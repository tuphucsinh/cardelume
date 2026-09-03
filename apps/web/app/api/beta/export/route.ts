import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { cardTypographyScript, CheckoutCardSnapshotSchema } from "@cardelume/card-schema";
import { loadReadyPhotoAssetForUser, getManagedTemplateForCheckout } from "@cardelume/db";
import { renderProductionFinal } from "@cardelume/renderer";
import { R2ObjectStorage } from "@cardelume/storage";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCheckoutCardDocument } from "../../../../lib/checkout-card.server";
import { getPaymentMode } from "../../../../lib/production-config.server";
import { anonymousIdFromCookieHeader, verifyPricingQuote } from "../../../../lib/pricing-quote.server";
import { checkUserRateLimit } from "../../../../lib/rate-limit.server";

export const runtime="nodejs";
export const dynamic="force-dynamic";

const Input=z.object({
  assetKind:z.enum(["jpg","pdf"]),
  card:CheckoutCardSnapshotSchema,
  priceQuote:z.string().min(32).max(4096)
});

let storage:R2ObjectStorage|undefined;
function privateStorage(){return storage??=(new R2ObjectStorage());}

function errorResponse(error:string,status:number){
  return NextResponse.json({error},{status,headers:{"cache-control":"no-store","referrer-policy":"no-referrer"}});
}

export async function POST(req:Request){
  let paymentMode;
  try{paymentMode=getPaymentMode();}catch{return errorResponse("beta_export_configuration_unavailable",503);}
  if(paymentMode!=="off")return errorResponse("beta_export_disabled",404);
  if(process.env.APP_MODE!=="live")return errorResponse("app_mode_live_required",503);

  const anon=z.string().uuid().safeParse(anonymousIdFromCookieHeader(req.headers.get("cookie")));
  if(!anon.success)return errorResponse("anonymous_session_required",401);
  const parsed=Input.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return errorResponse("invalid_beta_export",400);

  try{
    verifyPricingQuote(parsed.data.priceQuote,{anon:anon.data,kind:"single"});
    const rate=await checkUserRateLimit("beta_export",anon.data);
    if(!rate.allowed)return NextResponse.json({error:"rate_limited"},{status:429,headers:{"retry-after":String(rate.retryAfterSeconds),"cache-control":"no-store"}});

    const managedTemplate=parsed.data.card.templateId&&parsed.data.card.templateVersionId
      ?await getManagedTemplateForCheckout({templateId:parsed.data.card.templateId,templateVersionId:parsed.data.card.templateVersionId})
      :null;
    if(parsed.data.card.templateId&&!managedTemplate)throw new Error("template_not_available");
    if(managedTemplate){
      if(!managedTemplate.supportedFormats.includes(parsed.data.card.format))throw new Error("template_format_not_supported");
      if(!managedTemplate.scriptSupport.includes(cardTypographyScript(parsed.data.card.locale)))throw new Error("template_script_not_supported");
    }

    const document=buildCheckoutCardDocument({
      versionId:randomUUID(),
      snapshot:parsed.data.card,
      managedTemplate:managedTemplate?{
        rendererTemplateKey:managedTemplate.renderer_template_key,
        version:managedTemplate.version,
        templateVersionId:managedTemplate.template_version_id,
        photoMode:managedTemplate.photo_mode
      }:undefined
    });

    const assets:Record<string,{bytes:Uint8Array;contentType:"image/jpeg"}>={};
    for(const assetId of document.artworkAssetIds){
      const trusted=await loadReadyPhotoAssetForUser({assetId,userId:anon.data});
      if(!trusted||trusted.contentType!=="image/jpeg")throw new Error("photo_asset_not_ready_or_owned");
      const object=await privateStorage().getPrivate(trusted.cleanObjectKey);
      if(object.contentType!=="image/jpeg"||object.bytes.byteLength!==trusted.byteSize)throw new Error("photo_asset_object_mismatch");
      const digest=createHash("sha256").update(object.bytes).digest("hex");
      if(digest!==trusted.sha256)throw new Error("photo_asset_integrity_mismatch");
      assets[assetId]={bytes:object.bytes,contentType:"image/jpeg"};
    }

    const rendered=await renderProductionFinal(document,{assets});
    const bytes=parsed.data.assetKind==="jpg"?rendered.jpg:rendered.pdf;
    const contentType=parsed.data.assetKind==="jpg"?"image/jpeg":"application/pdf";
    const extension=parsed.data.assetKind==="jpg"?"jpg":"pdf";
    return new Response(Buffer.from(bytes),{headers:{
      "cache-control":"no-store",
      "content-disposition":`attachment; filename="cardelume-beta.${extension}"`,
      "content-length":String(bytes.byteLength),
      "content-type":contentType,
      "referrer-policy":"no-referrer",
      "x-content-type-options":"nosniff"
    }});
  }catch(error){
    const code=error instanceof Error?error.message:"beta_export_failed";
    const clientCode=new Set(["photo_asset_not_ready_or_owned","photo_asset_object_mismatch","photo_asset_integrity_mismatch","template_not_available","template_format_not_supported","template_script_not_supported","typography_copy_too_dense","photo_accent_requires_asset","photo_palette_required"]);
    return errorResponse(clientCode.has(code)?code:"beta_export_unavailable",clientCode.has(code)?409:503);
  }
}

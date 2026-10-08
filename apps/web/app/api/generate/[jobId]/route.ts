import { NextResponse } from "next/server";
import { z } from "zod";
import { GenerationBriefSchema, GenerationResultSchema } from "@cardelume/card-schema";
import { resolveCanonicalPresentation } from "@cardelume/templates";
import { cancelGenerationJob, generationStatusForOwner } from "@cardelume/db";
import { anonymousIdFromCookieHeader } from "../../../../lib/pricing-quote.server";
import { verifyGenerationStatusToken } from "../../../../lib/generation.server";
import { normalizeMarket } from "../../../../lib/pricing";
import { issueTemplateEventToken } from "../../../../lib/template-event-token.server";
export const runtime="nodejs";export const dynamic="force-dynamic";
function publicFailureCode(code:string|null){
  if(code==="ai_template_exhausted")return "generation_exhausted";
  if(code==="generation_expired"||code==="ai_budget_exhausted")return "generation_queue_expired";
  if(code==="ai_provider_timeout")return "ai_provider_timeout";
  if(/^ai_provider_http_4\d{2}$/.test(code??""))return "generation_provider_bad_request";
  if(/^ai_provider_http_5\d{2}$/.test(code??""))return "generation_provider_failed";
  if(code==="ai_generation_safe_failure")return "ai_generation_safe_failure";
  return "generation_provider_failed";
}
export async function GET(req:Request,{params}:{params:Promise<{jobId:string}>}){
  const {jobId}=await params;const id=z.string().uuid().safeParse(jobId);if(!id.success)return NextResponse.json({error:"job_id_invalid"},{status:400});
  const anon=z.string().uuid().safeParse(anonymousIdFromCookieHeader(req.headers.get("cookie")));if(!anon.success)return NextResponse.json({error:"anonymous_session_required"},{status:401});
  const token=req.headers.get("x-generation-token")??"";if(!token||!verifyGenerationStatusToken(token,id.data,anon.data))return NextResponse.json({error:"generation_status_forbidden"},{status:403});
  const row=await generationStatusForOwner({jobId:id.data,userId:anon.data});if(!row)return NextResponse.json({error:"generation_job_not_found"},{status:404});
  const state=row.status==="queued"||row.status==="planning"||row.status==="composing"||row.status==="rendering"||row.status==="ready"||row.status==="failed"?row.status:"failed";
  const result=state==="ready"?GenerationResultSchema.safeParse(row.result):null;
  if(state==="ready"&&!result?.success)return NextResponse.json({state:"failed",stage:3,error:"generation_result_invalid"},{headers:{"cache-control":"no-store"}});
  const brief=result?.success?GenerationBriefSchema.safeParse(row.brief):null;
  if(result?.success&&!brief?.success)return NextResponse.json({state:"failed",stage:3,error:"generation_brief_invalid"},{headers:{"cache-control":"no-store"}});
  let resultError:string|undefined;
  type CustomerSafeDirection={
    id:ReturnType<typeof GenerationResultSchema.parse>["directions"][number]["id"];
    templateId:string;
    templateVersionId:string;
    presentation:ReturnType<typeof resolveCanonicalPresentation>;
    templateName:string;
    visualDirection:string;
    photoMode:ReturnType<typeof resolveCanonicalPresentation>["photoMode"];
    accentMode?:ReturnType<typeof GenerationResultSchema.parse>["directions"][number]["accentMode"];
    signatureMove?:ReturnType<typeof GenerationResultSchema.parse>["directions"][number]["signatureMove"];
    kicker:string;
    headline:string;
    body:string;
    customerRationale?:string;
    templateEventToken:string;
    generationSource?:string;
  };
  let signedResult:{directions:CustomerSafeDirection[];generationSource?:ReturnType<typeof GenerationResultSchema.parse>["generationSource"]}|undefined;
  if(result?.success&&brief?.success){
    const readyResult=result.data;
    const readyBrief=brief.data;
    const market=normalizeMarket(req.headers.get("cf-ipcountry")??req.headers.get("x-vercel-ip-country")??req.headers.get("x-country-code"));
    const directions:CustomerSafeDirection[]=[];
    for(const [index,direction] of readyResult.directions.entries()){
      const templateId=direction.templateId;
      const templateVersionId=direction.templateVersionId;
      if(!templateId||!templateVersionId){resultError="generation_result_invalid";break;}
      try{
        const presentation=resolveCanonicalPresentation({templateId,templateVersionId,hasPhoto:readyBrief.hasPhoto,locale:readyBrief.locale,format:readyBrief.format});
        if(direction.presentation&&(
          direction.presentation.templateId!==presentation.templateId||
          direction.presentation.templateVersionId!==presentation.templateVersionId||
          direction.presentation.rendererTemplateKey!==presentation.rendererTemplateKey||
          direction.presentation.photoMode!==presentation.photoMode
        )){resultError="generation_presentation_invalid";break;}
        const generationSource=(direction as {generationSource?:string}).generationSource??readyResult.generationSource;
        const templateEventToken=issueTemplateEventToken({templateId,templateVersionId,source:"ai_direction",rankPosition:index+1,market,locale:readyBrief.locale,anonymousId:anon.data});
        directions.push({
          id:direction.id,
          templateId,
          templateVersionId,
          presentation,
          templateName:presentation.name,
          visualDirection:presentation.visualDirection,
          photoMode:presentation.photoMode,
          accentMode:direction.accentMode,
          signatureMove:direction.signatureMove,
          kicker:direction.kicker,
          headline:direction.headline,
          body:direction.body,
          customerRationale:direction.customerRationale,
          templateEventToken,
          ...(generationSource?{generationSource}:{})
        });
      }catch{resultError="generation_presentation_invalid";break;}
    }
    if(!resultError)signedResult={directions,...(readyResult.generationSource?{generationSource:readyResult.generationSource}:{})};
  }
  if(state==="ready"&&resultError)return NextResponse.json({state:"failed",stage:3,error:resultError},{headers:{"cache-control":"no-store"}});
  return NextResponse.json({state,stage:Math.max(0,Math.min(3,row.stage)),...(signedResult?{result:signedResult}:{}),...(state==="failed"?{error:publicFailureCode(row.error_code)}:{})},{headers:{"cache-control":"no-store"}});
}
export async function DELETE(req:Request,{params}:{params:Promise<{jobId:string}>}){
  const {jobId}=await params;const id=z.string().uuid().safeParse(jobId);if(!id.success)return NextResponse.json({error:"job_id_invalid"},{status:400});
  const anon=z.string().uuid().safeParse(anonymousIdFromCookieHeader(req.headers.get("cookie")));if(!anon.success)return NextResponse.json({error:"anonymous_session_required"},{status:401});
  const token=req.headers.get("x-generation-token")??"";if(!token||!verifyGenerationStatusToken(token,id.data,anon.data))return NextResponse.json({error:"generation_status_forbidden"},{status:403});
  const row=await generationStatusForOwner({jobId:id.data,userId:anon.data});if(!row)return NextResponse.json({error:"generation_job_not_found"},{status:404});
  const cancelled=await cancelGenerationJob({jobId:id.data,userId:anon.data});
  return NextResponse.json({state:cancelled?"failed":row.status,error:cancelled?"generation_cancelled":undefined},{status:cancelled?202:200,headers:{"cache-control":"no-store"}});
}

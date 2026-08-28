import { createHash, randomUUID } from "node:crypto";
import { cardTypographyScript } from "@cardelume/card-schema";
import { NextResponse } from "next/server";
import { z } from "zod";
import { CheckoutCardSnapshotSchema } from "@cardelume/card-schema";
import {
  bindProviderCheckout,
  claimProviderCheckoutCreation,
  createPendingSingleCardOrder,
  getManagedTemplateForCheckout,
  recordStyleFingerprint,
  recordTemplateEvent,
  releaseProviderCheckoutCreation
} from "@cardelume/db";
import { HOLIDAY_BUNDLE_CARD_COUNT, normalizeMarket } from "../../../lib/pricing";
import { adaptiveCurrencyFeesInclusive, holidayBundleEnabled } from "../../../lib/market-pricing.server";
import { anonymousIdFromCookieHeader, verifyPricingQuote } from "../../../lib/pricing-quote.server";
import { buildCheckoutCardDocument } from "../../../lib/checkout-card.server";
import { createDodoCheckoutSession } from "../../../lib/dodo-payments.server";
import { issueCheckoutReturnClaim } from "../../../lib/recovery.server";
import { checkUserRateLimit } from "../../../lib/rate-limit.server";

const PriceQuote=z.string().min(32).max(4096);
const IdempotencyKey=z.string().min(8).max(160).regex(/^[A-Za-z0-9_.:-]+$/);

const SingleCheckoutSchema=z.object({
  purchaseKind:z.literal("single"),
  card:CheckoutCardSnapshotSchema,
  priceQuote:PriceQuote
});

const HolidayBundleCheckoutSchema=z.object({
  purchaseKind:z.literal("holiday_bundle"),
  cardIds:z.array(z.string().min(8).max(160)).length(HOLIDAY_BUNDLE_CARD_COUNT)
    .refine(ids=>new Set(ids).size===HOLIDAY_BUNDLE_CARD_COUNT,"bundle_card_ids_must_be_unique"),
  priceQuote:PriceQuote
});

const CheckoutSchema=z.discriminatedUnion("purchaseKind",[
  SingleCheckoutSchema,
  HolidayBundleCheckoutSchema
]);

export const dynamic="force-dynamic";
export const runtime="nodejs";

function currentRequestMarket(req:Request){
  const url=new URL(req.url);
  const mockOverride=(process.env.APP_MODE??"mock")==="mock" ? url.searchParams.get("market") : null;
  return normalizeMarket(
    mockOverride
    ?? req.headers.get("cf-ipcountry")
    ?? req.headers.get("x-vercel-ip-country")
    ?? req.headers.get("x-country-code")
  );
}

function checkoutRequestHash(input:{
  card:z.infer<typeof CheckoutCardSnapshotSchema>;
  amountMinor:number;
  currency:string;
  market:string;
}){
  return createHash("sha256").update(JSON.stringify({
    card:input.card,
    amountMinor:input.amountMinor,
    currency:input.currency.toUpperCase(),
    market:input.market
  }),"utf8").digest("hex");
}

function safeCheckoutError(error:unknown){
  const code=error instanceof Error?error.message:"checkout_failed";
  const clientCodes=new Set([
    "checkout_idempotency_conflict",
    "typography_copy_too_dense",
    "photo_accent_requires_asset",
    "photo_palette_required",
    "photo_asset_not_ready_or_owned",
    "photo_asset_count_invalid",
    "template_not_available","template_format_not_supported","template_script_not_supported","template_photo_required","template_photo_not_supported"
  ]);
  if(clientCodes.has(code))return{code,status:409};
  if(code.startsWith("dodo_checkout_"))return{code:"payment_provider_unavailable",status:502};
  if(code.endsWith("_required")||code.endsWith("_invalid"))return{code:"checkout_configuration_unavailable",status:503};
  return{code:"checkout_unavailable",status:503};
}

export async function POST(req:Request){
  const idempotencyParsed=IdempotencyKey.safeParse(req.headers.get("idempotency-key"));
  if(!idempotencyParsed.success)return NextResponse.json({error:"idempotency_key_invalid"},{status:400});
  const idempotencyKey=idempotencyParsed.data;

  const parsed=CheckoutSchema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"invalid_checkout",issues:parsed.error.issues},{status:400});

  if(parsed.data.purchaseKind==="holiday_bundle"&&!holidayBundleEnabled()){
    return NextResponse.json({error:"holiday_bundle_disabled"},{status:404});
  }

  const anonRaw=anonymousIdFromCookieHeader(req.headers.get("cookie"));
  const anon=z.string().uuid().safeParse(anonRaw);
  if(!anon.success)return NextResponse.json({error:"anonymous_session_required"},{status:401});

  let quote;
  try{
    quote=verifyPricingQuote(parsed.data.priceQuote,{anon:anon.data,kind:parsed.data.purchaseKind});
  }catch(error){
    const code=error instanceof Error?error.message:"price_quote_invalid";
    return NextResponse.json({error:code},{status:409});
  }

  // The signed quote pins exactly what this anonymous session saw on the page.
  // Current edge market is available for fraud/analytics, but an IP/VPN change
  // between page view and click must never create an FX surprise.
  const requestMarket=currentRequestMarket(req);

  if(quote.adaptiveRequired&&!adaptiveCurrencyFeesInclusive()){
    return NextResponse.json({error:"adaptive_currency_inclusive_required"},{status:503});
  }

  const appMode=process.env.APP_MODE;
  if(appMode==="mock"&&process.env.NODE_ENV!=="production"){
    return NextResponse.json({
      mode:"mock",
      status:"ready",
      purchaseKind:parsed.data.purchaseKind,
      market:quote.market,
      requestMarket,
      price:{display:quote.display,currency:quote.currency,amountMinor:quote.amountMinor,source:"signed_quote"}
    });
  }
  if(appMode!=="live"){
    return NextResponse.json({error:"app_mode_live_required"},{status:503});
  }

  // The launch Holiday Bundle remains dormant. Never silently turn an enabled
  // flag into a fake production checkout before its multi-card ownership and
  // fulfillment boundary is implemented.
  if(parsed.data.purchaseKind==="holiday_bundle"){
    return NextResponse.json({error:"holiday_bundle_not_launch_ready"},{status:503});
  }

  try{
    const rate=await checkUserRateLimit("checkout",anon.data);
    if(!rate.allowed)return NextResponse.json({error:"rate_limited"},{status:429,headers:{"retry-after":String(rate.retryAfterSeconds),"cache-control":"no-store"}});
  }catch{return NextResponse.json({error:"checkout_unavailable"},{status:503,headers:{"cache-control":"no-store"}});}

  const orderId=randomUUID();
  const orderItemId=randomUUID();
  const cardId=randomUUID();
  const cardVersionId=randomUUID();
  const creationToken=randomUUID();

  try{
    const managedTemplate=parsed.data.card.templateId&&parsed.data.card.templateVersionId?await getManagedTemplateForCheckout({templateId:parsed.data.card.templateId,templateVersionId:parsed.data.card.templateVersionId}):null;
    if(parsed.data.card.templateId&&!managedTemplate)throw new Error("template_not_available");
    if(managedTemplate){
      if(!managedTemplate.supportedFormats.includes(parsed.data.card.format))throw new Error("template_format_not_supported");
      if(!managedTemplate.scriptSupport.includes(cardTypographyScript(parsed.data.card.locale)))throw new Error("template_script_not_supported");
    }
    const cardDocument=buildCheckoutCardDocument({versionId:cardVersionId,snapshot:parsed.data.card,managedTemplate:managedTemplate?{rendererTemplateKey:managedTemplate.renderer_template_key,version:managedTemplate.version,templateVersionId:managedTemplate.template_version_id,photoMode:managedTemplate.photo_mode}:undefined});
    const requestHash=checkoutRequestHash({
      card:parsed.data.card,
      amountMinor:quote.amountMinor,
      currency:quote.currency,
      market:quote.market
    });
    const pending=await createPendingSingleCardOrder({
      orderId,orderItemId,cardId,cardVersionId,
      userId:anon.data,
      idempotencyKey,
      requestHash,
      amountMinor:quote.amountMinor,
      currency:quote.currency,
      locale:parsed.data.card.locale,
      pricingMarket:quote.market,
      pricingDisplay:quote.display,
      direction:parsed.data.card.direction,
      occasion:parsed.data.card.occasion,
      cardDocument,
      trustedPhotoAssetIds:parsed.data.card.photoAssetId?[parsed.data.card.photoAssetId]:[],
      managedTemplateId:managedTemplate?.template_id,
      managedTemplateVersionId:managedTemplate?.template_version_id,
      managedTemplateSource:managedTemplate?(parsed.data.card.templateSource??"ai_direction"):undefined
    });

    if(pending.status==="paid"){
      return NextResponse.json({error:"order_already_paid",orderId:pending.orderId},{status:409});
    }
    if(managedTemplate&&pending.created){await recordTemplateEvent({eventId:randomUUID(),templateId:managedTemplate.template_id,templateVersionId:managedTemplate.template_version_id,eventType:"checkout_started",source:parsed.data.card.templateSource??"ai_direction",market:quote.market,locale:parsed.data.card.locale}).catch(()=>undefined);await recordStyleFingerprint({id:randomUUID(),userId:anon.data,templateId:managedTemplate.template_id,templateVersionId:managedTemplate.template_version_id,accentMode:parsed.data.card.accentMode,source:"checkout",sourceKey:`checkout:${pending.orderId}`}).catch(()=>undefined);}
    if(pending.providerCheckoutId&&pending.providerCheckoutUrl){
      return NextResponse.json({url:pending.providerCheckoutUrl,orderId:pending.orderId,reused:true});
    }

    const claim=await claimProviderCheckoutCreation({
      orderId:pending.orderId,
      userId:anon.data,
      creationToken
    });
    if(claim.status==="ready"){
      return NextResponse.json({url:claim.providerCheckoutUrl,orderId:pending.orderId,reused:true});
    }
    if(claim.status==="busy"){
      return NextResponse.json({error:"checkout_creation_in_progress",orderId:pending.orderId},{status:409,headers:{"retry-after":"1"}});
    }

    const checkoutReturn=await issueCheckoutReturnClaim(pending.orderId);
    let provider;
    try{
      provider=await createDodoCheckoutSession({
        orderId:pending.orderId,
        amountMinor:quote.amountMinor,
        currency:quote.currency,
        returnUrl:checkoutReturn.returnUrl,
        market:quote.market
      });
    }catch(error){
      await releaseProviderCheckoutCreation({orderId:pending.orderId,userId:anon.data,creationToken}).catch(()=>undefined);
      throw error;
    }

    const bound=await bindProviderCheckout({
      orderId:pending.orderId,
      userId:anon.data,
      creationToken,
      providerCheckoutId:provider.sessionId,
      providerCheckoutUrl:provider.url
    });
    return NextResponse.json({url:bound.providerCheckoutUrl,orderId:pending.orderId});
  }catch(error){
    const safe=safeCheckoutError(error);
    return NextResponse.json({error:safe.code},{status:safe.status});
  }
}

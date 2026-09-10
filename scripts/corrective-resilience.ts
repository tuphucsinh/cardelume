import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { issuePricingQuote, verifyPricingQuote } from "../apps/web/lib/pricing-quote.server.ts";
import { downloadBetaBlob, generationRecoveryMode } from "../apps/web/components/card-studio.tsx";

function need(value:unknown,message:string){assert.ok(value,message);}
function expectThrows(fn:()=>unknown,pattern:RegExp,message:string){assert.throws(fn,pattern,message);}
async function expectRejects(fn:()=>Promise<unknown>,pattern:RegExp,message:string){await assert.rejects(fn,pattern,message);}

async function main(){

const price={
  market:"US" as const,
  currency:"USD" as const,
  amount:2.99,
  billingSupport:"native" as const,
  display:"US$2.99",
  approxUsd:2.99,
  requestedMarket:"US" as const,
  effectiveMarket:"US" as const,
  source:"local-target" as const,
  adaptiveCurrencyFeesInclusiveRequired:false
};
const anon="11111111-1111-4111-8111-111111111111";
const quote=issuePricingQuote({kind:"single",anon,price,ttlSeconds:60});
need(verifyPricingQuote(quote,{anon,kind:"single"}).amountMinor===299,"valid_quote_round_trip");

const expired=issuePricingQuote({kind:"single",anon,price,ttlSeconds:0});
expectThrows(()=>verifyPricingQuote(expired,{anon,kind:"single"}),/price_quote_expired/,"expired_quote_must_fail_closed");
expectThrows(()=>verifyPricingQuote(quote,{anon:"22222222-2222-4222-8222-222222222222",kind:"single"}),/price_quote_owner_invalid/,"quote_owner_must_be_bound");
expectThrows(()=>verifyPricingQuote(`${quote}x`,{anon,kind:"single"}),/price_quote_signature_invalid/,"tampered_quote_must_fail_closed");
expectThrows(()=>verifyPricingQuote(quote,{anon,kind:"bundle" as never}),/price_quote_kind_invalid/,"quote_kind_must_be_bound");
const invalidAmountQuote=issuePricingQuote({kind:"single",anon,price:{...price,amount:0,approxUsd:0,display:"US$0.00"},ttlSeconds:60});
expectThrows(()=>verifyPricingQuote(invalidAmountQuote,{anon,kind:"single"}),/price_quote_amount_invalid/,"quote_amount_must_be_positive");

const studio=readFileSync(new URL("../apps/web/components/card-studio.tsx",import.meta.url),"utf8");
const quoteServer=readFileSync(new URL("../apps/web/lib/pricing-quote.server.ts",import.meta.url),"utf8");
const exportRoute=readFileSync(new URL("../apps/web/app/api/beta/export/route.ts",import.meta.url),"utf8");
const generationRoute=readFileSync(new URL("../apps/web/app/api/generate/route.ts",import.meta.url),"utf8");

const originalFetch=globalThis.fetch;
const originalWindow=(globalThis as typeof globalThis&{window?:unknown}).window;
Object.defineProperty(globalThis,"window",{configurable:true,value:{setTimeout,clearTimeout}});
try{
  let attempts=0;
  globalThis.fetch=async()=>{attempts+=1;return attempts===1?new Response("busy",{status:503}):new Response(new Blob(["jpg"],{type:"image/jpeg"}),{status:200,headers:{"content-type":"image/jpeg"}});};
  const retried=await downloadBetaBlob({assetKind:"jpg",card:{body:"edited"},priceQuote:quote});
  need(attempts===2&&retried.size===3,"download_5xx_retries_once");
  attempts=0;
  globalThis.fetch=async()=>{attempts+=1;return new Response("bad_request",{status:400});};
  await expectRejects(()=>downloadBetaBlob({assetKind:"pdf",card:{body:"edited"},priceQuote:quote}),/unavailable/,"download_4xx_does_not_retry");
  need(attempts===1,"download_4xx_attempt_count");
  need(generationRecoveryMode(new Error("network_error"))==="retryable"&&generationRecoveryMode(new Error("queue_expired"))==="exhausted","generation_recovery_modes_are_distinct");
}finally{
  globalThis.fetch=originalFetch;
  if(originalWindow===undefined)Reflect.deleteProperty(globalThis,"window");
  else Object.defineProperty(globalThis,"window",{configurable:true,value:originalWindow});
}

need(quoteServer.includes("payload.exp<=Math.floor(Date.now()/1000)"),"quote_expiry_boundary_not_exact");
need(studio.includes("DOWNLOAD_TIMEOUT_MS=12_000"),"download_timeout_missing");
need(studio.includes("DOWNLOAD_MAX_ATTEMPTS=2"),"download_retry_not_bounded");
need(studio.includes("new AbortController()")&&studio.includes("controller.abort()"),"download_abort_missing");
need(studio.includes("if(response.ok)return await response.blob()")&&studio.includes("response.clone().json()"),"download_body_handling_missing");
need(studio.includes("const card=buildCardSnapshot()")&&studio.includes("downloadBetaBlob({assetKind,card,priceQuote})"),"download_retry_does_not_preserve_snapshot");
need(studio.includes("response.status===409")&&studio.includes("quote_expired"),"expired_quote_recovery_missing");
need(studio.includes("sessionStorage")&&studio.includes("window.location.reload()"),"card_draft_quote_recovery_missing");
need(studio.includes("isPhotoPalette")&&studio.includes("isPhotoProfile")&&studio.includes("isAccentMode"),"draft_shape_validation_missing");
need(studio.includes("photoPreviewDataUrl")&&studio.includes("readObjectUrlAsDataUrl")&&studio.includes("objectUrlFromDataUrl"),"photo_preview_recovery_missing");
need(studio.includes("isChoice(occasions")&&studio.includes("isChoice(feelings")&&studio.includes("isChoice(formatValues"),"draft_enum_validation_missing");
need(studio.includes("isPhotoMode")&&studio.includes("selectedUsesPhoto")&&studio.includes("recoveryPhotoInvalid"),"photo_recovery_cross_check_missing");
need(studio.includes("betaBusy")&&studio.includes("if(paymentMode!==\"off\"||betaBusy)return"),"double_click_or_payment_guard_missing");
need(studio.includes("generationRecoveryMode")&&studio.includes("generationRecoveryMessage")&&studio.includes('className="checkout-note"'),"generation_failure_classification_missing");
need(exportRoute.includes('paymentMode!=="off"')&&exportRoute.includes('process.env.APP_MODE!=="live"'),"export_boundary_weakened");
need(exportRoute.includes("price_quote_expired")&&exportRoute.includes("isClient?409:503"),"expired_quote_safe_response_missing");
need(generationRoute.includes("verifyPricingQuote")&&generationRoute.includes("idempotency-key"),"generation_quote_or_idempotency_guard_missing");

console.log("QUOTE_ROUND_TRIP=PASS");
console.log("QUOTE_EXPIRY_AND_OWNER_GATES=PASS");
console.log("DOWNLOAD_TIMEOUT_RETRY_GUARD=PASS");
console.log("DRAFT_PRESERVING_QUOTE_RECOVERY=PASS");
console.log("GENERATION_FAILURE_CLASSIFICATION=PASS");
console.log("PAYMENT_ORDER_BOUNDARY=PASS");
console.log("CORRECTIVE_RESILIENCE=PASS");

}

void main().catch(error=>{console.error(error);throw error;});

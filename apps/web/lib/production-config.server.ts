import { validateEnvironmentIsolation } from "@cardelume/core";
import "server-only";
import { normalizeMarket, pricingTargetBook, type CurrencyCode, type MarketCode } from "./pricing";

export type PaymentMode="off"|"on";

const BASE_REQUIRED=[
  "DATABASE_URL","NEXT_PUBLIC_SITE_URL",
  "R2_ACCOUNT_ID","R2_ACCESS_KEY_ID","R2_SECRET_ACCESS_KEY","R2_BUCKET_PRIVATE",
  "PRICING_QUOTE_SECRET","CHECKOUT_RETURN_SECRET","GENERATION_STATUS_SECRET",
  "AI_PROVIDER","AI_API_KEY","AI_MODEL","TEMPLATE_ADMIN_USERNAME","TEMPLATE_ADMIN_PASSWORD","TEMPLATE_EVENT_SECRET","ANALYTICS_PSEUDONYM_KEY",
  "LEGAL_ENTITY_NAME","LEGAL_CONTACT_EMAIL","LEGAL_ENTITY_ADDRESS","LEGAL_EFFECTIVE_DATE",
  "PAYMENT_MODE"
] as const;

const DODO_REQUIRED=[
  "DODO_PAYMENTS_ENVIRONMENT","DODO_PAYMENTS_API_KEY","DODO_PAYMENTS_WEBHOOK_KEY"
] as const;

function bool(value:string|undefined){return ["1","true","yes","on"].includes((value??"").trim().toLowerCase());}
function hasProduct(currency:CurrencyCode){
  if(process.env[`DODO_PRODUCT_ID_SINGLE_${currency}`])return true;
  return Boolean(process.env.DODO_PRODUCT_ID_SINGLE&&process.env.DODO_PRODUCT_CURRENCY?.toUpperCase()===currency);
}

export function getPaymentMode(env:Record<string,string|undefined>=process.env):PaymentMode{
  const mode=(env.PAYMENT_MODE??"").trim().toLowerCase();
  if(mode==="off"||mode==="on")return mode;
  if(env.APP_MODE==="live"){
    throw new Error("PAYMENT_MODE_explicit_required");
  }
  return "on";
}

export function validateLiveRuntimeConfig(){
  const missing:string[]=BASE_REQUIRED.filter(k=>!process.env[k]);
  const invalid:string[]=[];

  const rawPaymentMode=(process.env.PAYMENT_MODE??"").trim().toLowerCase();
  if(process.env.PAYMENT_MODE&&rawPaymentMode!=="off"&&rawPaymentMode!=="on"){
    invalid.push("PAYMENT_MODE");
  }
  const isPaymentOff=rawPaymentMode==="off";

  const isolation=isPaymentOff
    ? validateEnvironmentIsolation({ ...process.env, DODO_PAYMENTS_ENVIRONMENT: process.env.APP_ENV === "production" ? "live_mode" : "test_mode" })
    : validateEnvironmentIsolation(process.env);
  const isolationErrors=isPaymentOff
    ? isolation.errors.filter(e=>!e.startsWith("DODO_PAYMENTS_ENVIRONMENT"))
    : isolation.errors;
  if(isolationErrors.length>0)invalid.push(...isolationErrors.map(e=>`ENV:${e}`));

  if(process.env.APP_MODE!=="live")invalid.push("APP_MODE");
  if(process.env.AI_PROVIDER==="mock")invalid.push("AI_PROVIDER");
  if(!["openai-compatible","openai"].includes(process.env.AI_PROVIDER??""))invalid.push("AI_PROVIDER");

  if(!isPaymentOff){
    missing.push(...DODO_REQUIRED.filter(k=>!process.env[k]));
    if(!["test_mode","live_mode"].includes(process.env.DODO_PAYMENTS_ENVIRONMENT??""))invalid.push("DODO_PAYMENTS_ENVIRONMENT");
    if(process.env.DODO_DYNAMIC_PRICING_READY!=="true")invalid.push("DODO_DYNAMIC_PRICING_READY");
    const markets=new Set<MarketCode>(["US","GB","FR","DE","ES","IT","IN"]);
    if(bool(process.env.PRICING_EXTENDED_LOCAL_ENABLED))for(const raw of (process.env.PRICING_VERIFIED_MARKETS??"").split(",")){const market=normalizeMarket(raw);if(market!=="OTHER")markets.add(market);}
    const currencies=new Set<CurrencyCode>();for(const market of markets)currencies.add(pricingTargetBook.single[market].currency);
    for(const currency of currencies)if(!hasProduct(currency))missing.push(`DODO_PRODUCT_ID_SINGLE_${currency}`);
  }

  if(bool(process.env.HOLIDAY_BUNDLE_ENABLED))invalid.push("HOLIDAY_BUNDLE_ENABLED");
  if(process.env.LEGAL_CONTENT_APPROVED!=="true")invalid.push("LEGAL_CONTENT_APPROVED");
  if(process.env.ADMIN_REQUIRE_EDGE_ACCESS!=="true")invalid.push("ADMIN_REQUIRE_EDGE_ACCESS");
  if(process.env.CSP_ENFORCE!=="true")invalid.push("CSP_ENFORCE");
  if(process.env.LEGAL_CONTACT_EMAIL&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(process.env.LEGAL_CONTACT_EMAIL))invalid.push("LEGAL_CONTACT_EMAIL");
  if(!process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://"))invalid.push("NEXT_PUBLIC_SITE_URL");
  for(const key of ["PRICING_QUOTE_SECRET","CHECKOUT_RETURN_SECRET","GENERATION_STATUS_SECRET","TEMPLATE_ADMIN_PASSWORD","TEMPLATE_EVENT_SECRET","ANALYTICS_PSEUDONYM_KEY"] as const){if(process.env[key]&&process.env[key]!.length<32)invalid.push(key);}

  const paymentMode:PaymentMode|undefined=rawPaymentMode==="off"?"off":(rawPaymentMode==="on"?"on":undefined);
  return{
    ok:missing.length===0&&invalid.length===0,
    missing:[...new Set(missing)].sort(),
    invalid:[...new Set(invalid)].sort(),
    paymentMode
  };
}

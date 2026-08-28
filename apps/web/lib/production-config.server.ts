import { validateEnvironmentIsolation } from "@cardelume/core";
import "server-only";
import { normalizeMarket, pricingTargetBook, type CurrencyCode, type MarketCode } from "./pricing";

const BASE_REQUIRED=[
  "DATABASE_URL","NEXT_PUBLIC_SITE_URL",
  "R2_ACCOUNT_ID","R2_ACCESS_KEY_ID","R2_SECRET_ACCESS_KEY","R2_BUCKET_PRIVATE",
  "PRICING_QUOTE_SECRET","CHECKOUT_RETURN_SECRET","GENERATION_STATUS_SECRET",
  "DODO_PAYMENTS_ENVIRONMENT","DODO_PAYMENTS_API_KEY","DODO_PAYMENTS_WEBHOOK_KEY",
  "AI_PROVIDER","AI_API_KEY","AI_MODEL","TEMPLATE_ADMIN_USERNAME","TEMPLATE_ADMIN_PASSWORD","TEMPLATE_EVENT_SECRET","ANALYTICS_PSEUDONYM_KEY",
  "LEGAL_ENTITY_NAME","LEGAL_CONTACT_EMAIL","LEGAL_ENTITY_ADDRESS","LEGAL_EFFECTIVE_DATE"
] as const;
function bool(value:string|undefined){return ["1","true","yes","on"].includes((value??"").trim().toLowerCase());}
function hasProduct(currency:CurrencyCode){
  if(process.env[`DODO_PRODUCT_ID_SINGLE_${currency}`])return true;
  return Boolean(process.env.DODO_PRODUCT_ID_SINGLE&&process.env.DODO_PRODUCT_CURRENCY?.toUpperCase()===currency);
}
export function validateLiveRuntimeConfig(){
  const missing:string[]=BASE_REQUIRED.filter(k=>!process.env[k]);
  const invalid:string[]=[];
  const isolation=validateEnvironmentIsolation(process.env);
  if(!isolation.ok)invalid.push(...isolation.errors.map(e=>`ENV:${e}`));
  if(process.env.APP_MODE!=="live")invalid.push("APP_MODE");
  if(process.env.AI_PROVIDER==="mock")invalid.push("AI_PROVIDER");
  if(!["openai-compatible","openai"].includes(process.env.AI_PROVIDER??""))invalid.push("AI_PROVIDER");
  if(!["test_mode","live_mode"].includes(process.env.DODO_PAYMENTS_ENVIRONMENT??""))invalid.push("DODO_PAYMENTS_ENVIRONMENT");
  if(process.env.DODO_DYNAMIC_PRICING_READY!=="true")invalid.push("DODO_DYNAMIC_PRICING_READY");
  if(bool(process.env.HOLIDAY_BUNDLE_ENABLED))invalid.push("HOLIDAY_BUNDLE_ENABLED");
  if(process.env.LEGAL_CONTENT_APPROVED!=="true")invalid.push("LEGAL_CONTENT_APPROVED");
  if(process.env.ADMIN_REQUIRE_EDGE_ACCESS!=="true")invalid.push("ADMIN_REQUIRE_EDGE_ACCESS");
  if(process.env.CSP_ENFORCE!=="true")invalid.push("CSP_ENFORCE");
  if(process.env.LEGAL_CONTACT_EMAIL&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(process.env.LEGAL_CONTACT_EMAIL))invalid.push("LEGAL_CONTACT_EMAIL");
  if(!process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://"))invalid.push("NEXT_PUBLIC_SITE_URL");
  for(const key of ["PRICING_QUOTE_SECRET","CHECKOUT_RETURN_SECRET","GENERATION_STATUS_SECRET","TEMPLATE_ADMIN_PASSWORD","TEMPLATE_EVENT_SECRET","ANALYTICS_PSEUDONYM_KEY"] as const){if(process.env[key]&&process.env[key]!.length<32)invalid.push(key);}
  const markets=new Set<MarketCode>(["US","GB","FR","DE","ES","IT","IN"]);
  if(bool(process.env.PRICING_EXTENDED_LOCAL_ENABLED))for(const raw of (process.env.PRICING_VERIFIED_MARKETS??"").split(",")){const market=normalizeMarket(raw);if(market!=="OTHER")markets.add(market);}
  const currencies=new Set<CurrencyCode>();for(const market of markets)currencies.add(pricingTargetBook.single[market].currency);
  for(const currency of currencies)if(!hasProduct(currency))missing.push(`DODO_PRODUCT_ID_SINGLE_${currency}`);
  return{ok:missing.length===0&&invalid.length===0,missing:[...new Set(missing)].sort(),invalid:[...new Set(invalid)].sort()};
}

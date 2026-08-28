import { headers } from "next/headers";
import {
  normalizeMarket,
  resolveHolidayBundlePrice,
  resolveSinglePrice,
  type MarketCode,
  type PricingRuntime
} from "./pricing";
import { assignPricingVariant } from "./pricing-experiment";
import { issuePricingQuote } from "./pricing-quote.server";

function boolEnv(value:string|undefined,defaultValue=false){
  if(value==null)return defaultValue;
  return ["1","true","yes","on"].includes(value.trim().toLowerCase());
}

function verifiedMarketSet(){
  const raw=process.env.PRICING_VERIFIED_MARKETS ?? "US,GB,FR,DE,ES,IT,IN";
  return new Set(raw.split(",").map(x=>normalizeMarket(x)).filter(x=>x!=="OTHER"));
}

export function pricingRuntime(stableId?:string|null):PricingRuntime{
  return{
    extendedLocalEnabled:boolEnv(process.env.PRICING_EXTENDED_LOCAL_ENABLED,false),
    verifiedMarkets:verifiedMarketSet(),
    experimentEnabled:boolEnv(process.env.PRICING_EXPERIMENT_ENABLED,false),
    experimentVariant:stableId?assignPricingVariant(stableId):(process.env.PRICING_EXPERIMENT_VARIANT==="test_349"?"test_349":"control_299")
  };
}

export function holidayBundleEnabled(){
  return boolEnv(process.env.HOLIDAY_BUNDLE_ENABLED,false);
}

export function adaptiveCurrencyFeesInclusive(){
  return boolEnv(process.env.DODO_ADAPTIVE_CURRENCY_FEES_INCLUSIVE,true);
}



export async function requestAnonId(){
  const h=await headers();
  return h.get("x-cardelume-anon")??"";
}

export async function requestMarket(reviewOverride?:string|string[]|null):Promise<MarketCode>{
  const reviewValue=Array.isArray(reviewOverride)?reviewOverride[0]:reviewOverride;
  // Explicit market override is accepted only in mock/review mode.
  if((process.env.APP_MODE ?? "mock")==="mock" && reviewValue){
    return normalizeMarket(reviewValue);
  }
  const h=await headers();
  return normalizeMarket(
    h.get("cf-ipcountry")
    ?? h.get("x-vercel-ip-country")
    ?? h.get("x-country-code")
  );
}

export async function singleOffer(reviewOverride?:string|string[]|null){
  const [market,anon]=await Promise.all([requestMarket(reviewOverride),requestAnonId()]);
  return resolveSinglePrice(market,pricingRuntime(anon));
}

export async function singleOfferWithQuote(reviewOverride?:string|string[]|null){
  const [market,anon]=await Promise.all([requestMarket(reviewOverride),requestAnonId()]);
  if(!anon)throw new Error("anonymous_id_required");
  const price=resolveSinglePrice(market,pricingRuntime(anon));
  return{price,quote:issuePricingQuote({kind:"single",anon,price})};
}

export async function holidayOffer(reviewOverride?:string|string[]|null){
  const [market,anon]=await Promise.all([requestMarket(reviewOverride),requestAnonId()]);
  return resolveHolidayBundlePrice(market,pricingRuntime(anon));
}

export async function holidayOfferWithQuote(reviewOverride?:string|string[]|null){
  const [market,anon]=await Promise.all([requestMarket(reviewOverride),requestAnonId()]);
  if(!anon)throw new Error("anonymous_id_required");
  const price=resolveHolidayBundlePrice(market,pricingRuntime(anon));
  return{price,quote:issuePricingQuote({kind:"holiday_bundle",anon,price})};
}

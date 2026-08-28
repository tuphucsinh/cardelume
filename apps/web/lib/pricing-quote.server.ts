import { createHmac, timingSafeEqual } from "node:crypto";
import { amountMinor, type ResolvedPrice } from "./pricing";

export type PurchaseKind="single"|"holiday_bundle";

type QuotePayload={
  v:1;
  kind:PurchaseKind;
  anon:string;
  market:string;
  currency:string;
  amountMinor:number;
  display:string;
  adaptiveRequired:boolean;
  exp:number;
};

function secret(){
  const configured=process.env.PRICING_QUOTE_SECRET;
  if(configured)return configured;
  if((process.env.APP_MODE??"mock")==="mock")return"cardelume-mock-pricing-quote-secret";
  throw new Error("PRICING_QUOTE_SECRET_required");
}

function sign(body:string){
  return createHmac("sha256",secret()).update(body).digest("base64url");
}

export function issuePricingQuote(input:{
  kind:PurchaseKind;
  anon:string;
  price:ResolvedPrice;
  ttlSeconds?:number;
}){
  const payload:QuotePayload={
    v:1,
    kind:input.kind,
    anon:input.anon,
    market:input.price.effectiveMarket,
    currency:input.price.currency,
    amountMinor:amountMinor(input.price),
    display:input.price.display,
    adaptiveRequired:input.price.adaptiveCurrencyFeesInclusiveRequired,
    exp:Math.floor(Date.now()/1000)+(input.ttlSeconds??30*60)
  };
  const body=Buffer.from(JSON.stringify(payload),"utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyPricingQuote(token:string,input:{anon:string;kind:PurchaseKind}):QuotePayload{
  const [body,signature,...extra]=token.split(".");
  if(!body||!signature||extra.length)throw new Error("price_quote_invalid");
  const expected=Buffer.from(sign(body));
  const received=Buffer.from(signature);
  if(expected.length!==received.length||!timingSafeEqual(expected,received))throw new Error("price_quote_signature_invalid");

  let payload:QuotePayload;
  try{
    payload=JSON.parse(Buffer.from(body,"base64url").toString("utf8")) as QuotePayload;
  }catch{
    throw new Error("price_quote_payload_invalid");
  }
  if(payload.v!==1||payload.kind!==input.kind)throw new Error("price_quote_kind_invalid");
  if(payload.anon!==input.anon)throw new Error("price_quote_owner_invalid");
  if(payload.exp<Math.floor(Date.now()/1000))throw new Error("price_quote_expired");
  if(!payload.currency||!Number.isInteger(payload.amountMinor)||payload.amountMinor<=0)throw new Error("price_quote_amount_invalid");
  return payload;
}

export function anonymousIdFromCookieHeader(cookieHeader?:string|null){
  if(!cookieHeader)return null;
  const match=cookieHeader.match(/(?:^|;\s*)cardelume_anon=([^;]+)/);
  return match?decodeURIComponent(match[1]):null;
}

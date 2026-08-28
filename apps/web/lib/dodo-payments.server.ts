import "server-only";
import { z } from "zod";
import { assertPaymentEnvironmentForApp } from "@cardelume/core";
import { verifyDodoStandardWebhook } from "./dodo-webhook";

const CheckoutResponseSchema=z.object({
  session_id:z.string().min(3).max(300),
  checkout_url:z.string().url().nullable()
}).passthrough();

function configured(name:string,legacy?:string){
  const value=process.env[name]??(legacy?process.env[legacy]:undefined);
  if(!value)throw new Error(`${name}_required`);
  return value;
}

function environment(){
  assertPaymentEnvironmentForApp(process.env);
  const value=configured("DODO_PAYMENTS_ENVIRONMENT");
  if(value!=="test_mode"&&value!=="live_mode")throw new Error("DODO_PAYMENTS_ENVIRONMENT_invalid");
  return value;
}

function apiBase(){return environment()==="test_mode"?"https://test.dodopayments.com":"https://live.dodopayments.com";}

function productForCurrency(currency:string){
  const code=currency.toUpperCase();
  const explicit=process.env[`DODO_PRODUCT_ID_SINGLE_${code}`];
  if(explicit)return explicit;
  const legacy=process.env.DODO_PRODUCT_ID_SINGLE;
  const legacyCurrency=(process.env.DODO_PRODUCT_CURRENCY??"USD").toUpperCase();
  if(legacy&&legacyCurrency===code)return legacy;
  throw new Error(`DODO_PRODUCT_ID_SINGLE_${code}_required`);
}

function assertDynamicPricingReady(){
  if(process.env.DODO_DYNAMIC_PRICING_READY!=="true"){
    throw new Error("DODO_DYNAMIC_PRICING_READY_required");
  }
}

function safeCheckoutUrl(value:string){
  const parsed=new URL(value);
  if(parsed.protocol!=="https:")throw new Error("dodo_checkout_url_invalid");
  const allowed=new Set(["checkout.dodopayments.com","test.checkout.dodopayments.com"]);
  if(!allowed.has(parsed.hostname))throw new Error("dodo_checkout_url_invalid");
  return parsed.toString();
}

export async function createDodoCheckoutSession(input:{
  orderId:string;
  amountMinor:number;
  currency:string;
  returnUrl:string;
  market:string;
}){
  assertDynamicPricingReady();
  if(!Number.isInteger(input.amountMinor)||input.amountMinor<=0)throw new Error("dodo_amount_invalid");
  const currency=input.currency.toUpperCase();
  if(!/^[A-Z]{3}$/.test(currency))throw new Error("dodo_currency_invalid");
  const productId=productForCurrency(currency);
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),10_000);
  try{
    const response=await fetch(`${apiBase()}/checkouts`,{
      method:"POST",
      headers:{
        "authorization":`Bearer ${configured("DODO_PAYMENTS_API_KEY","DODO_API_KEY")}`,
        "content-type":"application/json",
        "accept":"application/json"
      },
      body:JSON.stringify({
        product_cart:[{product_id:productId,quantity:1,amount:input.amountMinor}],
        billing_currency:currency,
        return_url:input.returnUrl,
        minimal_address:true,
        short_link:false,
        feature_flags:{
          allow_currency_selection:false,
          allow_discount_code:false,
          allow_phone_number_collection:false,
          redirect_immediately:true,
          single_page:true
        },
        metadata:{
          order_id:input.orderId,
          product_key:"cardelume",
          purchase_kind:"single",
          pricing_market:input.market,
          pricing_currency:currency
        }
      }),
      signal:controller.signal,
      cache:"no-store"
    });
    if(!response.ok){
      // Never forward provider error bodies to the browser/logs: they may contain
      // implementation details. Status alone is enough for controlled retries.
      throw new Error(`dodo_checkout_http_${response.status}`);
    }
    const parsed=CheckoutResponseSchema.safeParse(await response.json().catch(()=>null));
    if(!parsed.success||!parsed.data.checkout_url)throw new Error("dodo_checkout_response_invalid");
    return{sessionId:parsed.data.session_id,url:safeCheckoutUrl(parsed.data.checkout_url)};
  }catch(error){
    if(error instanceof Error&&error.name==="AbortError")throw new Error("dodo_checkout_timeout");
    throw error;
  }finally{clearTimeout(timeout);}
}

export function verifyDodoWebhook(rawBody:Uint8Array,headers:Headers){
  const secret=configured("DODO_PAYMENTS_WEBHOOK_KEY","DODO_WEBHOOK_SECRET");
  const toleranceRaw=Number(process.env.DODO_WEBHOOK_TOLERANCE_SECONDS??300);
  const tolerance=Number.isFinite(toleranceRaw)?toleranceRaw:300;
  return verifyDodoStandardWebhook({rawBody,headers,secret,toleranceSeconds:tolerance});
}

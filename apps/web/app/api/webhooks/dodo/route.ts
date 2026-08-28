import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { applyVerifiedDodoEvent, markDodoPaymentFulfilled, recordFunnelEventForOrder, recordPaidTemplateEventForOrder } from "@cardelume/db";
import { fulfillVerifiedPaidOrder } from "../../../../lib/paid-fulfillment.server";
import { DodoWebhookVerificationError } from "../../../../lib/dodo-webhook";
import { verifyDodoWebhook } from "../../../../lib/dodo-payments.server";
import { securityEvent } from "../../../../lib/security-log.server";

export const dynamic="force-dynamic";
export const runtime="nodejs";

const MetadataSchema=z.record(z.string(),z.unknown()).default({});
const EventSchema=z.object({
  type:z.string().min(1).max(120),
  timestamp:z.string().optional(),
  business_id:z.string().optional(),
  data:z.unknown()
}).passthrough();
const PaymentSchema=z.object({
  payment_id:z.string().min(3).max(300),
  checkout_session_id:z.string().min(3).max(300),
  total_amount:z.number().int().nonnegative(),
  currency:z.string().length(3),
  status:z.string().min(1).max(80),
  metadata:MetadataSchema
}).passthrough();

function safeAuditMetadata(metadata:Record<string,unknown>){
  const allowed=["order_id","product_key","purchase_kind","pricing_market","pricing_currency"] as const;
  return Object.fromEntries(allowed.flatMap(key=>typeof metadata[key]==="string"?[[key,metadata[key]]]:[]));
}

function auditPayload(event:z.infer<typeof EventSchema>,payment:z.infer<typeof PaymentSchema>|null){
  return{
    type:event.type,
    timestamp:event.timestamp??null,
    business_id:event.business_id??null,
    data:payment?{
      payment_id:payment.payment_id,
      checkout_session_id:payment.checkout_session_id,
      total_amount:payment.total_amount,
      currency:payment.currency,
      status:payment.status,
      metadata:safeAuditMetadata(payment.metadata)
    }:null
  };
}

export async function POST(req:Request){
  const rawBody=new Uint8Array(await req.arrayBuffer());
  let verified:{eventId:string;timestamp:number};
  try{verified=verifyDodoWebhook(rawBody,req.headers);}
  catch(error){
    if(error instanceof Error&&error.message.endsWith("_required")){securityEvent("dodo_webhook_rejected",{reason:"configuration_unavailable"});return NextResponse.json({error:"webhook_configuration_unavailable"},{status:503});}
    const code=error instanceof DodoWebhookVerificationError?error.message:"webhook_verification_failed";
    securityEvent("dodo_webhook_rejected",{reason:code});
    return NextResponse.json({error:code},{status:401});
  }

  let json:unknown;
  try{json=JSON.parse(new TextDecoder().decode(rawBody));}
  catch{securityEvent("dodo_webhook_payload_rejected",{reason:"json_invalid"});return NextResponse.json({error:"webhook_json_invalid"},{status:422});}
  const event=EventSchema.safeParse(json);
  if(!event.success){securityEvent("dodo_webhook_payload_rejected",{reason:"event_invalid"});return NextResponse.json({error:"webhook_payload_invalid"},{status:422});}
  securityEvent("dodo_webhook_verified");

  let payment:z.infer<typeof PaymentSchema>|null=null;
  if(event.data.type==="payment.succeeded"){
    const parsed=PaymentSchema.safeParse(event.data.data);
    if(!parsed.success){securityEvent("dodo_webhook_payload_rejected",{reason:"payment_invalid"});return NextResponse.json({error:"payment_payload_invalid"},{status:422});}
    payment=parsed.data;
  }
  const metadata=payment?.metadata??{};
  const orderId=typeof metadata.order_id==="string"?metadata.order_id:"";
  const productKey=typeof metadata.product_key==="string"?metadata.product_key:"";
  const boundPayment=payment&&z.string().uuid().safeParse(orderId).success?{
    orderId,
    productKey,
    paymentId:payment.payment_id,
    checkoutSessionId:payment.checkout_session_id,
    amountMinor:payment.total_amount,
    currency:payment.currency.toUpperCase(),
    status:payment.status
  }:null;

  const applied=await applyVerifiedDodoEvent({
    providerEventId:verified.eventId,
    eventType:event.data.type,
    auditPayload:auditPayload(event.data,payment),
    payment:boundPayment
  });

  if(applied.orderId&&payment){
    await recordFunnelEventForOrder({orderId:applied.orderId,eventId:randomUUID(),eventType:"payment_completed",source:"payment_webhook",dedupeKey:`payment_completed:${applied.orderId}`}).catch(()=>undefined);
  }

  if(applied.needsFulfillment&&applied.orderId&&applied.userId&&applied.providerPaymentId){
    try{
      await fulfillVerifiedPaidOrder({orderId:applied.orderId,userId:applied.userId});
      await markDodoPaymentFulfilled({orderId:applied.orderId,providerPaymentId:applied.providerPaymentId});
      await recordPaidTemplateEventForOrder({orderId:applied.orderId,eventId:randomUUID()}).catch(()=>undefined);
    }catch{
      securityEvent("dodo_paid_fulfillment_retry");
      // Deliberately non-2xx: Dodo retries. The order is already durably PAID,
      // and recovery/final provisioning is idempotent, so a retry is safe.
      return NextResponse.json({error:"paid_fulfillment_retry_required"},{status:503});
    }
  }

  return NextResponse.json({received:true,outcome:applied.outcome});
}

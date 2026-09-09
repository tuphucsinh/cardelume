import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { GenerationBriefSchema } from "@cardelume/card-schema";
import { defaultGenerationDeadlineMs } from "@cardelume/ai";
import { anonymousIdFromCookieHeader, verifyPricingQuote } from "../../../lib/pricing-quote.server";
import { createAndEnqueueGeneration, issueGenerationStatusToken } from "../../../lib/generation.server";
import { checkUserRateLimit } from "../../../lib/rate-limit.server";
import { normalizeMarket } from "../../../lib/pricing";
import { cancelGenerationJobByIdempotencyKey } from "@cardelume/db";

export const runtime="nodejs";export const dynamic="force-dynamic";
const IdempotencyKey=z.string().min(8).max(160).regex(/^[A-Za-z0-9_.:-]+$/);
const Input=GenerationBriefSchema.extend({priceQuote:z.string().min(32).max(4096)});
export async function POST(req:Request){
  if(process.env.APP_MODE!=="live")return NextResponse.json({error:"generation_live_mode_required"},{status:503});
  const idem=IdempotencyKey.safeParse(req.headers.get("idempotency-key"));if(!idem.success)return NextResponse.json({error:"idempotency_key_invalid"},{status:400});
  const parsed=Input.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"invalid_brief"},{status:400});
  const anon=z.string().uuid().safeParse(anonymousIdFromCookieHeader(req.headers.get("cookie")));if(!anon.success)return NextResponse.json({error:"anonymous_session_required"},{status:401});
  try{
    const quote=verifyPricingQuote(parsed.data.priceQuote,{anon:anon.data,kind:"single"});
    const rate=await checkUserRateLimit("generation",anon.data);
    if(!rate.allowed)return NextResponse.json({error:"rate_limited"},{status:429,headers:{"retry-after":String(rate.retryAfterSeconds),"cache-control":"no-store"}});
    const {priceQuote:_,...clientBrief}=parsed.data;void _;
    const requestMarket=normalizeMarket(req.headers.get("cf-ipcountry")??req.headers.get("x-vercel-ip-country")??req.headers.get("x-country-code"));void requestMarket;
    const brief={...clientBrief,market:quote.market};
    const durable=await createAndEnqueueGeneration({jobId:randomUUID(),cardId:randomUUID(),userId:anon.data,idempotencyKey:idem.data,brief});
    return NextResponse.json({jobId:durable.jobId,statusToken:issueGenerationStatusToken(durable.jobId,anon.data),state:durable.status,deadlineAt:durable.createdAt+defaultGenerationDeadlineMs()},{status:durable.created?202:200,headers:{"cache-control":"no-store"}});
  }catch(error){const code=error instanceof Error?error.message:"generation_start_failed";const status=code==="generation_idempotency_conflict"?409:code.includes("price_quote")?409:503;return NextResponse.json({error:status===503?"generation_start_failed":code},{status});}
}
export async function DELETE(req:Request){
  if(process.env.APP_MODE!=="live")return NextResponse.json({error:"generation_live_mode_required"},{status:503});
  const idem=IdempotencyKey.safeParse(req.headers.get("idempotency-key"));if(!idem.success)return NextResponse.json({error:"idempotency_key_invalid"},{status:400});
  const anon=z.string().uuid().safeParse(anonymousIdFromCookieHeader(req.headers.get("cookie")));if(!anon.success)return NextResponse.json({error:"anonymous_session_required"},{status:401});
  try{const cancelled=await cancelGenerationJobByIdempotencyKey({idempotencyKey:idem.data,userId:anon.data});return NextResponse.json({state:cancelled?"failed":"not_active",error:cancelled?"generation_cancelled":undefined},{status:200,headers:{"cache-control":"no-store"}});}
  catch{return NextResponse.json({error:"generation_cancel_failed"},{status:503});}
}

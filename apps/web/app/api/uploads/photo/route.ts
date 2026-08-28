import { NextResponse } from "next/server";
import { z } from "zod";
import { issuePhotoUpload } from "../../../../lib/photo-upload.server";
import { anonymousIdFromCookieHeader, verifyPricingQuote } from "../../../../lib/pricing-quote.server";
import { checkUserRateLimit } from "../../../../lib/rate-limit.server";

export const runtime="nodejs";export const dynamic="force-dynamic";
const Input=z.object({contentType:z.enum(["image/jpeg","image/png","image/webp","image/avif"]),sizeBytes:z.number().int().positive().max(10*1024*1024),originalName:z.string().max(180).optional(),priceQuote:z.string().min(32).max(4096)});
export async function POST(req:Request){
  const parsed=Input.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"invalid_photo_upload"},{status:400});
  const anon=z.string().uuid().safeParse(anonymousIdFromCookieHeader(req.headers.get("cookie")));if(!anon.success)return NextResponse.json({error:"anonymous_session_required"},{status:401});
  try{verifyPricingQuote(parsed.data.priceQuote,{anon:anon.data,kind:"single"});const rate=await checkUserRateLimit("photo_upload",anon.data);if(!rate.allowed)return NextResponse.json({error:"rate_limited"},{status:429,headers:{"retry-after":String(rate.retryAfterSeconds),"cache-control":"no-store"}});const issued=await issuePhotoUpload({userId:anon.data,contentType:parsed.data.contentType,sizeBytes:parsed.data.sizeBytes,originalName:parsed.data.originalName});return NextResponse.json(issued,{headers:{"cache-control":"no-store"}});}catch(error){
    const code=error instanceof Error?error.message:"photo_upload_unavailable";const client=code.startsWith("photo_")?code:"photo_upload_unavailable";return NextResponse.json({error:client},{status:client==="photo_upload_unavailable"?503:400});
  }
}

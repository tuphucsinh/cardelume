import { NextResponse } from "next/server";
import { z } from "zod";
import { completePhotoUpload } from "../../../../../../lib/photo-upload.server";
import { anonymousIdFromCookieHeader } from "../../../../../../lib/pricing-quote.server";

export const runtime="nodejs";export const dynamic="force-dynamic";
const Body=z.object({completionToken:z.string().min(32).max(200)});
export async function POST(req:Request,{params}:{params:Promise<{assetId:string}>}){
  const {assetId}=await params;const id=z.string().uuid().safeParse(assetId);const body=Body.safeParse(await req.json().catch(()=>null));
  if(!id.success||!body.success)return NextResponse.json({error:"invalid_photo_completion"},{status:400});
  const anon=z.string().uuid().safeParse(anonymousIdFromCookieHeader(req.headers.get("cookie")));if(!anon.success)return NextResponse.json({error:"anonymous_session_required"},{status:401});
  if(process.env.APP_MODE!=="live"&&!(process.env.APP_MODE==="mock"&&process.env.NODE_ENV!=="production"))return NextResponse.json({error:"app_mode_live_required"},{status:503});
  try{return NextResponse.json(await completePhotoUpload({userId:anon.data,assetId:id.data,completionToken:body.data.completionToken}),{headers:{"cache-control":"no-store"}});}catch(error){const code=error instanceof Error?error.message:"photo_processing_failed";const status=code==="photo_asset_processing"?409:code.startsWith("photo_")?422:503;return NextResponse.json({error:code.startsWith("photo_")?code:"photo_processing_failed"},{status});}
}

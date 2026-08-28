import { NextResponse } from "next/server";
import { funnelSummary } from "@cardelume/db";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(req:Request){
  const url=new URL(req.url);const raw=Number(url.searchParams.get("days")??30);const days=Number.isFinite(raw)?Math.max(1,Math.min(90,Math.floor(raw))):30;
  try{return NextResponse.json({days,events:await funnelSummary({days})},{headers:{"cache-control":"no-store"}});}
  catch{return NextResponse.json({error:"funnel_summary_unavailable"},{status:503,headers:{"cache-control":"no-store"}});}
}

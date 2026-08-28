import { NextResponse } from "next/server";
export const dynamic="force-dynamic";
export async function GET(){return NextResponse.json({status:"ok",service:"cardelume-web",version:process.env.APP_VERSION||"0.4.3-step.17i",now:new Date().toISOString()},{headers:{"cache-control":"no-store"}});}

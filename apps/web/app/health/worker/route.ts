import { NextResponse } from "next/server";
import { productionReadiness } from "@cardelume/db";

export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){
  try{
    const health=await productionReadiness({workerMaxAgeSeconds:Number(process.env.WORKER_HEARTBEAT_MAX_AGE_SECONDS||45),requiredVersion:process.env.APP_VERSION||"0.4.3-step.17i"});
    const ok=health.healthyWorkers>0;
    return NextResponse.json({status:ok?"healthy":"stale",version:process.env.APP_VERSION||"0.4.3-step.17i",...(process.env.NODE_ENV!=="production"?{healthyWorkers:health.healthyWorkers,activeJobs:health.activeJobs,newestWorkerAt:health.newestWorkerAt?.toISOString()??null,maxAgeSeconds:health.maxAgeSeconds}:{})},{status:ok?200:503,headers:{"cache-control":"no-store"}});
  }catch{return NextResponse.json({status:"unavailable",healthyWorkers:0,version:process.env.APP_VERSION||"0.4.3-step.17i"},{status:503,headers:{"cache-control":"no-store"}});}
}

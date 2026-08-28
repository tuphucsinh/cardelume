import { NextResponse } from "next/server";
import { productionReadiness, templateCatalogReadiness } from "@cardelume/db";
import { validateLiveRuntimeConfig } from "../../../lib/production-config.server";

export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){
  const mode=process.env.APP_MODE??"unset";
  const appEnv=process.env.APP_ENV??"unset";
  const config=validateLiveRuntimeConfig();
  if(!config.ok)return NextResponse.json({status:"not_ready",mode,appEnv,reason:"configuration_invalid",...(process.env.NODE_ENV!=="production"?{missing:config.missing,invalid:config.invalid}:{}),version:process.env.APP_VERSION||"0.4.3-step.17i"},{status:503,headers:{"cache-control":"no-store"}});
  try{
    const health=await productionReadiness({workerMaxAgeSeconds:Number(process.env.WORKER_HEARTBEAT_MAX_AGE_SECONDS||45),requiredVersion:process.env.APP_VERSION||"0.4.3-step.17i"});
    if(health.healthyWorkers<1)return NextResponse.json({status:"not_ready",mode,appEnv,reason:"worker_unavailable",version:process.env.APP_VERSION||"0.4.3-step.17i"},{status:503,headers:{"cache-control":"no-store"}});
    const templates=await templateCatalogReadiness();
    if(!templates.ready)return NextResponse.json({status:"not_ready",mode,appEnv,reason:"template_catalog_invalid",version:process.env.APP_VERSION||"0.4.3-step.17i",...(process.env.NODE_ENV!=="production"?{activeTemplates:templates.total,missingTemplateCoverage:templates.missing}:{})},{status:503,headers:{"cache-control":"no-store"}});
    return NextResponse.json({status:"ready",mode,appEnv,version:process.env.APP_VERSION||"0.4.3-step.17i",...(process.env.NODE_ENV!=="production"?{db:"ok",healthyWorkers:health.healthyWorkers,activeJobs:health.activeJobs,activeTemplates:templates.total}:{})},{headers:{"cache-control":"no-store"}});
  }catch{return NextResponse.json({status:"not_ready",mode,appEnv,reason:"database_unavailable",version:process.env.APP_VERSION||"0.4.3-step.17i"},{status:503,headers:{"cache-control":"no-store"}});}
}

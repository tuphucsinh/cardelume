import { NextResponse } from "next/server";
import { z } from "zod";
import { GenerationBriefSchema, GenerationResultSchema } from "@cardelume/card-schema";
import { resolveCanonicalPresentation, curatedFallbackPresentations } from "@cardelume/templates";
import { cancelGenerationJob, generationStatusForOwner } from "@cardelume/db";
import { anonymousIdFromCookieHeader } from "../../../../lib/pricing-quote.server";
import { verifyGenerationStatusToken } from "../../../../lib/generation.server";
import { issueTemplateEventToken } from "../../../../lib/template-event-token.server";
export const runtime="nodejs";export const dynamic="force-dynamic";
function publicFailureCode(code:string|null){
  if(code==="generation_expired"||code==="ai_budget_exhausted")return "generation_queue_expired";
  if(code==="ai_provider_timeout")return "ai_provider_timeout";
  if(/^ai_provider_http_4\d{2}$/.test(code??""))return "generation_provider_bad_request";
  if(/^ai_provider_http_5\d{2}$/.test(code??""))return "generation_provider_failed";
  if(code==="ai_generation_safe_failure")return "ai_generation_safe_failure";
  return "generation_provider_failed";
}
export async function GET(req:Request,{params}:{params:Promise<{jobId:string}>}){
  const {jobId}=await params;const id=z.string().uuid().safeParse(jobId);if(!id.success)return NextResponse.json({error:"job_id_invalid"},{status:400});
  const anon=z.string().uuid().safeParse(anonymousIdFromCookieHeader(req.headers.get("cookie")));if(!anon.success)return NextResponse.json({error:"anonymous_session_required"},{status:401});
  const token=req.headers.get("x-generation-token")??"";if(!token||!verifyGenerationStatusToken(token,id.data,anon.data))return NextResponse.json({error:"generation_status_forbidden"},{status:403});
  const row=await generationStatusForOwner({jobId:id.data,userId:anon.data});if(!row)return NextResponse.json({error:"generation_job_not_found"},{status:404});
  const state=row.status==="queued"||row.status==="planning"||row.status==="composing"||row.status==="rendering"||row.status==="ready"||row.status==="failed"?row.status:"failed";
  const result=state==="ready"?GenerationResultSchema.safeParse(row.result):null;
  if(state==="ready"&&!result?.success)return NextResponse.json({state:"failed",stage:3,error:"generation_result_invalid"},{headers:{"cache-control":"no-store"}});
  const brief=result?.success?GenerationBriefSchema.safeParse(row.brief):null;
  if(result?.success&&!brief?.success)return NextResponse.json({state:"failed",stage:3,error:"generation_brief_invalid"},{headers:{"cache-control":"no-store"}});
  const signedResult=result?.success&&brief?.success?{directions:result.data.directions.map((direction,index)=>{
    let templateId=direction.templateId;
    let templateVersionId=direction.templateVersionId;
    let presentation=direction.presentation;
    if(templateId&&templateVersionId&&!presentation){
      try{
        presentation=resolveCanonicalPresentation({
          templateId,
          templateVersionId,
          hasPhoto:brief.data.hasPhoto,
          locale:brief.data.locale,
          format:brief.data.format
        });
      }catch{
        presentation=undefined;
      }
    }else if(!templateId||!templateVersionId){
      const fallback=curatedFallbackPresentations[direction.id];
      if(fallback){
        templateId=fallback.templateId;
        templateVersionId=fallback.templateVersionId;
        presentation=fallback;
      }
    }
    const enriched={
      ...direction,
      ...(templateId?{templateId}:{}),
      ...(templateVersionId?{templateVersionId}:{}),
      ...(presentation?{
        presentation,
        templateName:presentation.name,
        visualDirection:presentation.visualDirection,
        photoMode:presentation.photoMode
      }:{})
    };
    return enriched.templateId&&enriched.templateVersionId?{
      ...enriched,
      templateEventToken:issueTemplateEventToken({
        templateId:enriched.templateId,
        templateVersionId:enriched.templateVersionId,
        source:"ai_direction",
        rankPosition:index+1,
        market:brief.data.market,
        locale:brief.data.locale,
        anonymousId:anon.data
      })
    }:enriched;
  })}:undefined;
  return NextResponse.json({state,stage:Math.max(0,Math.min(3,row.stage)),...(signedResult?{result:signedResult}:{}),...(state==="failed"?{error:"generation_failed"}:{})},{headers:{"cache-control":"no-store"}});
}
export async function DELETE(req:Request,{params}:{params:Promise<{jobId:string}>}){
  const {jobId}=await params;const id=z.string().uuid().safeParse(jobId);if(!id.success)return NextResponse.json({error:"job_id_invalid"},{status:400});
  const anon=z.string().uuid().safeParse(anonymousIdFromCookieHeader(req.headers.get("cookie")));if(!anon.success)return NextResponse.json({error:"anonymous_session_required"},{status:401});
  const token=req.headers.get("x-generation-token")??"";if(!token||!verifyGenerationStatusToken(token,id.data,anon.data))return NextResponse.json({error:"generation_status_forbidden"},{status:403});
  const row=await generationStatusForOwner({jobId:id.data,userId:anon.data});if(!row)return NextResponse.json({error:"generation_job_not_found"},{status:404});
  const cancelled=await cancelGenerationJob({jobId:id.data,userId:anon.data});
  return NextResponse.json({state:cancelled?"failed":row.status,error:cancelled?"generation_cancelled":undefined},{status:cancelled?202:200,headers:{"cache-control":"no-store"}});
}

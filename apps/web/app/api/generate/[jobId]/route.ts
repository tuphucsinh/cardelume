import { NextResponse } from "next/server";
import { z } from "zod";
import { GenerationBriefSchema, GenerationResultSchema } from "@cardelume/card-schema";
import { generationStatusForOwner } from "@cardelume/db";
import { anonymousIdFromCookieHeader } from "../../../../lib/pricing-quote.server";
import { verifyGenerationStatusToken } from "../../../../lib/generation.server";
import { issueTemplateEventToken } from "../../../../lib/template-event-token.server";
export const runtime="nodejs";export const dynamic="force-dynamic";
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
  const signedResult=result?.success&&brief?.success?{directions:result.data.directions.map((direction,index)=>direction.templateId&&direction.templateVersionId?{...direction,templateEventToken:issueTemplateEventToken({templateId:direction.templateId,templateVersionId:direction.templateVersionId,source:"ai_direction",rankPosition:index+1,market:brief.data.market,locale:brief.data.locale,anonymousId:anon.data})}:direction)}:undefined;
  return NextResponse.json({state,stage:Math.max(0,Math.min(3,row.stage)),...(signedResult?{result:signedResult}:{}),...(state==="failed"?{error:"generation_failed"}:{})},{headers:{"cache-control":"no-store"}});
}

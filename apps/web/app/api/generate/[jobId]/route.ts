import { NextResponse } from "next/server";
import { z } from "zod";
import { GenerationBriefSchema, GenerationResultSchema } from "@cardelume/card-schema";
import { resolveCanonicalPresentation } from "@cardelume/templates";
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
  let resultError:string|undefined;
  let signedResult:{directions:Array<ReturnType<typeof GenerationResultSchema.parse>["directions"][number]>}|undefined;
  if(result?.success&&brief?.success){
    const readyResult=result.data;
    const readyBrief=brief.data;
    const directions:typeof readyResult.directions=[];
    for(const [index,direction] of readyResult.directions.entries()){
      const templateId=direction.templateId;
      const templateVersionId=direction.templateVersionId;
      if(!templateId||!templateVersionId){resultError="generation_result_invalid";break;}
      try{
        const presentation=resolveCanonicalPresentation({templateId,templateVersionId,hasPhoto:readyBrief.hasPhoto,locale:readyBrief.locale,format:readyBrief.format});
        if(direction.presentation&&(
          direction.presentation.templateId!==presentation.templateId||
          direction.presentation.templateVersionId!==presentation.templateVersionId||
          direction.presentation.rendererTemplateKey!==presentation.rendererTemplateKey||
          direction.presentation.photoMode!==presentation.photoMode
        )){resultError="generation_presentation_invalid";break;}
        directions.push({...direction,templateId,templateVersionId,presentation,templateName:presentation.name,visualDirection:presentation.visualDirection,photoMode:presentation.photoMode,templateEventToken:issueTemplateEventToken({templateId,templateVersionId,source:"ai_direction",rankPosition:index+1,market:readyBrief.market,locale:readyBrief.locale,anonymousId:anon.data})});
      }catch{resultError="generation_presentation_invalid";break;}
    }
    if(!resultError)signedResult={directions};
  }
  if(state==="ready"&&resultError)return NextResponse.json({state:"failed",stage:3,error:resultError},{headers:{"cache-control":"no-store"}});
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

import { NextResponse } from "next/server";
import { z } from "zod";
import { decideManagedTemplateLaunch, listTemplateLaunchApprovals } from "@cardelume/db";

const Id=z.string().uuid();
const Decision=z.object({
  decision:z.enum(["approved","candidate","hold","rework","rejected"]),
  benchmarkEvidence:z.string().max(500).optional(),
  ipEvidence:z.string().max(500).optional(),
  humanReviewEvidence:z.string().max(500).optional(),
  note:z.string().max(2000).optional()
});

function actor(req:Request){return(req.headers.get("x-cardelume-admin-actor")??process.env.TEMPLATE_ADMIN_USERNAME??"owner").trim().slice(0,160)||"owner";}

export async function GET(_:Request,{params}:{params:Promise<{templateId:string}>}){
  const {templateId}=await params;const id=Id.safeParse(templateId);if(!id.success)return NextResponse.json({error:"template_id_invalid"},{status:400});
  try{return NextResponse.json({approvals:await listTemplateLaunchApprovals({templateId:id.data})});}
  catch{return NextResponse.json({error:"template_launch_evidence_unavailable"},{status:503});}
}

export async function POST(req:Request,{params}:{params:Promise<{templateId:string}>}){
  const {templateId}=await params;const id=Id.safeParse(templateId),body=Decision.safeParse(await req.json().catch(()=>null));
  if(!id.success||!body.success)return NextResponse.json({error:"template_launch_decision_invalid"},{status:400});
  try{return NextResponse.json(await decideManagedTemplateLaunch({templateId:id.data,actor:actor(req),...body.data}));}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:"template_launch_decision_failed"},{status:409});}
}

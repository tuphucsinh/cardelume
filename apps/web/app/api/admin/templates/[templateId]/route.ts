import { NextResponse } from "next/server";
import { z } from "zod";
import { archiveManagedTemplate, listManagedTemplates, updateManagedTemplate } from "@cardelume/db";

const Id=z.string().uuid();
const AffinityInput=z.object({key:z.string().min(1).max(80),score:z.number().min(0).max(1)});
const Patch=z.object({
  name:z.string().min(2).max(120).optional(),material:z.string().max(120).optional(),
  status:z.enum(["draft","active","archived"]).optional(),health:z.enum(["healthy","degraded","invalid"]).optional(),
  photoMode:z.enum(["none","optional","required"]).optional(),editorialScore:z.number().int().min(0).max(100).optional(),maturity:z.enum(["new","proven","legacy"]).optional(),
  feelings:z.array(AffinityInput).max(12).optional(),occasions:z.array(AffinityInput).max(12).optional(),
  markets:z.array(AffinityInput.extend({key:z.string().min(2).max(16)})).max(24).optional(),excludedMarkets:z.array(z.string().min(2).max(16)).max(24).optional()
});

export async function PATCH(req:Request,{params}:{params:Promise<{templateId:string}>}){
  const {templateId}=await params;const id=Id.safeParse(templateId),body=Patch.safeParse(await req.json().catch(()=>null));
  if(!id.success||!body.success)return NextResponse.json({error:"template_update_invalid"},{status:400});
  try{
    const existing=(await listManagedTemplates({includeInactive:true})).find(t=>t.id===id.data);
    if(!existing)return NextResponse.json({error:"template_not_found"},{status:404});
    if(body.data.photoMode&&body.data.photoMode!==existing.photoMode)return NextResponse.json({error:"photo_mode_change_requires_new_version_review"},{status:409});
    const {feelings,occasions,markets,excludedMarkets,...mutable}=body.data;
    const dimensions:Array<"market"|"occasion"|"feeling"|"exclude_market">=[];
    const targeting:Array<{dimension:"market"|"occasion"|"feeling"|"exclude_market";key:string;affinity:number}>=[];
    if(feelings!==undefined){dimensions.push("feeling");targeting.push(...feelings.map(x=>({dimension:"feeling" as const,key:x.key,affinity:x.score})));}
    if(occasions!==undefined){dimensions.push("occasion");targeting.push(...occasions.map(x=>({dimension:"occasion" as const,key:x.key,affinity:x.score})));}
    if(markets!==undefined){dimensions.push("market");const m=[...markets];if(!m.some(x=>x.key.toUpperCase()==="GLOBAL"))m.push({key:"GLOBAL",score:.55});targeting.push(...m.map(x=>({dimension:"market" as const,key:x.key.toUpperCase(),affinity:x.score})));}
    if(excludedMarkets!==undefined){dimensions.push("exclude_market");targeting.push(...excludedMarkets.map(key=>({dimension:"exclude_market" as const,key:key.toUpperCase(),affinity:1})));}
    return NextResponse.json(await updateManagedTemplate({templateId:id.data,...mutable,targeting:dimensions.length?targeting:undefined,replaceTargetingDimensions:dimensions.length?dimensions:undefined}));
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"template_update_failed"},{status:409});}
}

export async function DELETE(_:Request,{params}:{params:Promise<{templateId:string}>}){
  const {templateId}=await params;const id=Id.safeParse(templateId);
  if(!id.success)return NextResponse.json({error:"template_id_invalid"},{status:400});
  try{return NextResponse.json(await archiveManagedTemplate({templateId:id.data}));}
  catch{return NextResponse.json({error:"template_archive_failed"},{status:409});}
}

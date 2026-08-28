import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createManagedTemplate, listManagedTemplates } from "@cardelume/db";
import { portfolioV2AllTemplates } from "@cardelume/templates";

const rendererMap=new Map(portfolioV2AllTemplates.map(t=>[t.rendererTemplateKey,t]));
const AffinityInput=z.object({key:z.string().min(1).max(80),score:z.number().min(0).max(1)});
const Input=z.object({
  name:z.string().min(2).max(120),
  slug:z.string().regex(/^[a-z0-9-]{2,80}$/),
  familyId:z.string().uuid().optional(),
  material:z.string().max(120).default(""),
  rendererTemplateKey:z.string().min(2).max(80),
  photoMode:z.enum(["none","optional","required"]),
  editorialScore:z.number().int().min(0).max(100).default(85),
  maturity:z.enum(["new","proven","legacy"]).default("new"),
  feelings:z.array(AffinityInput).max(12).default([]),
  occasions:z.array(AffinityInput).max(12).default([]),
  markets:z.array(AffinityInput.extend({key:z.string().min(2).max(16)})).max(24).default([])
});

function targeting(data:z.infer<typeof Input>){
  const markets=[...data.markets];
  if(!markets.some(x=>x.key.toUpperCase()==="GLOBAL"))markets.push({key:"GLOBAL",score:.55});
  const rows=[
    ...data.feelings.map(x=>({dimension:"feeling" as const,key:x.key,affinity:x.score})),
    ...data.occasions.map(x=>({dimension:"occasion" as const,key:x.key,affinity:x.score})),
    ...markets.map(x=>({dimension:"market" as const,key:x.key.toUpperCase(),affinity:x.score}))
  ];
  const seen=new Set<string>();
  return rows.filter(x=>{const k=`${x.dimension}:${x.key.toLowerCase()}`;if(seen.has(k))return false;seen.add(k);return true;});
}

export async function GET(){
  try{return NextResponse.json({templates:await listManagedTemplates({includeInactive:true})},{headers:{"cache-control":"no-store"}});}
  catch{return NextResponse.json({error:"template_admin_unavailable"},{status:503});}
}

export async function POST(req:Request){
  const parsed=Input.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"template_input_invalid",issues:parsed.error.issues},{status:400});
  const approvedRenderer=rendererMap.get(parsed.data.rendererTemplateKey);
  if(!approvedRenderer)return NextResponse.json({error:"renderer_template_key_not_approved"},{status:409});
  const visualDirection=approvedRenderer.visualDirection;
  if(parsed.data.photoMode!==approvedRenderer.photoMode)return NextResponse.json({error:"photo_mode_not_supported_by_renderer"},{status:409});
  const familyId=parsed.data.familyId??randomUUID();
  try{
    const created=await createManagedTemplate({
      templateId:randomUUID(),familyId,createFamily:!parsed.data.familyId,versionId:randomUUID(),
      slug:parsed.data.slug,name:parsed.data.name,material:parsed.data.material,
      rendererTemplateKey:parsed.data.rendererTemplateKey,visualDirection,photoMode:parsed.data.photoMode,
      editorialScore:parsed.data.editorialScore,maturity:parsed.data.maturity,
      supportedFormats:[...approvedRenderer.supportedFormats],
      scriptSupport:[...approvedRenderer.scriptSupport],headlineCapacity:"medium",bodyCapacity:parsed.data.photoMode==="required"?"short":"medium",
      targeting:targeting(parsed.data)
    });
    return NextResponse.json(created,{status:201});
  }catch(error){
    const code=(error as {code?:string})?.code==="23505"?"template_slug_exists":error instanceof Error&&error.message==="template_family_not_found"?"template_family_not_found":"template_create_failed";
    return NextResponse.json({error:code},{status:409});
  }
}

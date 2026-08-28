import postgres from "postgres";
import { templateArchetype, type Affinity, type TemplateMeta, type TemplatePhotoMode, type TemplateStatus, type TemplateLaunchStatus, type TemplateHealth, type TemplateScript, type TextCapacity, type VisualDirection, type TemplateSurfaceSource } from "@cardelume/templates";

function dbUrl(value?:string){const url=value??process.env.DATABASE_URL;if(!url)throw new Error("DATABASE_URL is required");return url;}
function client(connectionString?:string){return postgres(dbUrl(connectionString),{max:2,prepare:false});}
function arr(value:unknown):string[]{return Array.isArray(value)?value.filter((x):x is string=>typeof x==="string"):[];}
function affinity(rows:Array<{dimension:string;target_key:string;affinity:number|string}>,dimension:string):Affinity[]{return rows.filter(r=>r.dimension===dimension).map(r=>({key:r.target_key,score:Number(r.affinity)}));}

type CatalogRow={
 id:string;family_id:string;version_id:string;version:number;slug:string;name:string;material:string;status:TemplateStatus;launch_status:TemplateLaunchStatus;health:TemplateHealth;photo_mode:TemplatePhotoMode;editorial_score:number;maturity:"new"|"proven"|"legacy";
 renderer_template_key:string;visual_direction:VisualDirection;supported_formats:unknown;script_support:unknown;headline_capacity:TextCapacity;body_capacity:TextCapacity;
 impressions:number;selected:number;paid:number;regenerated:number;ai_assigned:number;checkout_started:number;
};

export async function listManagedTemplates(input:{includeInactive?:boolean;connectionString?:string}={}):Promise<TemplateMeta[]>{
 const sql=client(input.connectionString);try{
  const rows=await sql<CatalogRow[]>`
    select t.id,t.family_id,v.id as version_id,v.version,t.slug,t.name,t.material,t.status,t.launch_status,t.health,t.photo_mode,t.editorial_score,t.maturity,
      v.renderer_template_key,v.visual_direction,v.supported_formats,v.script_support,v.headline_capacity,v.body_capacity,
      count(e.id) filter(where e.event_type='impression' and e.created_at>=now()-interval '30 days')::int as impressions,
      count(e.id) filter(where e.event_type='selected' and e.created_at>=now()-interval '30 days')::int as selected,
      count(e.id) filter(where e.event_type='paid' and e.created_at>=now()-interval '30 days')::int as paid,
      count(e.id) filter(where e.event_type='regenerated' and e.created_at>=now()-interval '30 days')::int as regenerated,
      count(e.id) filter(where e.event_type='ai_assigned' and e.created_at>=now()-interval '30 days')::int as ai_assigned,
      count(e.id) filter(where e.event_type='checkout_started' and e.created_at>=now()-interval '30 days')::int as checkout_started
    from templates t join template_versions v on v.id=t.current_version_id
    left join template_events e on e.template_id=t.id and e.created_at>=now()-interval '30 days'
    where (${Boolean(input.includeInactive)} or (t.status='active' and t.health='healthy' and v.validation_status='passed' and t.launch_status not in ('hold','retired') and (${process.env.APP_ENV!=="production"} or t.launch_status='approved')))
    group by t.id,v.id
    order by t.editorial_score desc,t.name asc
  `;
  const ids=rows.map(r=>r.id);if(!ids.length)return[];
  const targets=await sql<Array<{template_id:string;dimension:string;target_key:string;affinity:number|string}>>`
    select template_id,dimension,target_key,affinity from template_targeting where template_id=any(${ids}::uuid[])
  `;
  return rows.map(r=>{const tt=targets.filter(x=>x.template_id===r.id);return{
    id:r.id,familyId:r.family_id,versionId:r.version_id,version:r.version,slug:r.slug,name:r.name,material:r.material,status:r.status,launchStatus:r.launch_status,health:r.health,photoMode:r.photo_mode,editorialScore:r.editorial_score,maturity:r.maturity,
    rendererTemplateKey:r.renderer_template_key,visualDirection:r.visual_direction,supportedFormats:arr(r.supported_formats),scriptSupport:arr(r.script_support) as TemplateScript[],headlineCapacity:r.headline_capacity,bodyCapacity:r.body_capacity,
    feelings:affinity(tt,"feeling"),occasions:affinity(tt,"occasion"),markets:affinity(tt,"market"),excludedMarkets:tt.filter(x=>x.dimension==="exclude_market").map(x=>x.target_key),
    impressions:r.impressions,selected:r.selected,paid:r.paid,regenerated:r.regenerated,aiAssigned:r.ai_assigned,checkoutStarted:r.checkout_started
  };});
 }finally{await sql.end({timeout:2});}
}

export async function getManagedTemplateForCheckout(input:{templateId:string;templateVersionId:string;connectionString?:string}){
 const sql=client(input.connectionString);try{const rows=await sql<Array<{template_id:string;template_version_id:string;version:number;renderer_template_key:string;visual_direction:VisualDirection;photo_mode:TemplatePhotoMode;supported_formats:unknown;script_support:unknown}>>`
  select t.id template_id,v.id template_version_id,v.version,v.renderer_template_key,v.visual_direction,t.photo_mode,v.supported_formats,v.script_support
  from templates t join template_versions v on v.template_id=t.id and v.id=${input.templateVersionId}::uuid
  where t.id=${input.templateId}::uuid and t.status='active' and t.health='healthy' and t.launch_status not in ('hold','retired') and (${process.env.APP_ENV!=="production"} or t.launch_status='approved') and v.validation_status='passed' limit 1
 `;const row=rows[0];return row?{...row,supportedFormats:arr(row.supported_formats),scriptSupport:arr(row.script_support) as TemplateScript[]}:null;}finally{await sql.end({timeout:2});}
}

export async function createManagedTemplate(input:{templateId:string;familyId:string;createFamily:boolean;versionId:string;slug:string;name:string;material:string;rendererTemplateKey:string;visualDirection:VisualDirection;photoMode:TemplatePhotoMode;editorialScore:number;maturity:"new"|"proven"|"legacy";supportedFormats:string[];scriptSupport:TemplateScript[];headlineCapacity:TextCapacity;bodyCapacity:TextCapacity;targeting:Array<{dimension:"market"|"occasion"|"feeling"|"exclude_market";key:string;affinity:number}>;connectionString?:string}){
 const sql=client(input.connectionString);try{return await sql.begin(async tx=>{
  if(input.createFamily)await tx`insert into template_families(id,name,slug) values(${input.familyId}::uuid,${input.name},${input.slug})`;
  else{const family=await tx<Array<{id:string}>>`select id from template_families where id=${input.familyId}::uuid limit 1`;if(!family[0])throw new Error("template_family_not_found");}
  await tx`insert into templates(id,family_id,slug,name,material,status,launch_status,health,photo_mode,editorial_score,maturity) values(${input.templateId}::uuid,${input.familyId}::uuid,${input.slug},${input.name},${input.material},'draft','experiment','healthy',${input.photoMode},${input.editorialScore},${input.maturity})`;
  await tx`insert into template_versions(id,template_id,version,renderer_template_key,visual_direction,supported_formats,script_support,headline_capacity,body_capacity,validation_status) values(${input.versionId}::uuid,${input.templateId}::uuid,1,${input.rendererTemplateKey},${input.visualDirection},${tx.json(input.supportedFormats as never)},${tx.json(input.scriptSupport as never)},${input.headlineCapacity},${input.bodyCapacity},'passed')`;
  await tx`update templates set current_version_id=${input.versionId}::uuid where id=${input.templateId}::uuid`;
  for(const target of input.targeting)await tx`insert into template_targeting(template_id,dimension,target_key,affinity) values(${input.templateId}::uuid,${target.dimension},${target.key},${target.affinity}) on conflict(template_id,dimension,target_key) do update set affinity=excluded.affinity`;
  return{templateId:input.templateId,versionId:input.versionId,status:"draft" as const};
 });}finally{await sql.end({timeout:2});}
}

export async function updateManagedTemplate(input:{templateId:string;name?:string;material?:string;status?:TemplateStatus;launchStatus?:TemplateLaunchStatus;ownerApproval?:boolean;health?:TemplateHealth;photoMode?:TemplatePhotoMode;editorialScore?:number;maturity?:"new"|"proven"|"legacy";targeting?:Array<{dimension:"market"|"occasion"|"feeling"|"exclude_market";key:string;affinity:number}>;replaceTargetingDimensions?:Array<"market"|"occasion"|"feeling"|"exclude_market">;connectionString?:string}){
 const sql=client(input.connectionString);try{return await sql.begin(async tx=>{
  if(input.launchStatus==="approved"&&!input.ownerApproval)throw new Error("owner_approval_required_for_template_launch");
  if(input.status==="active"){const ready=await tx<Array<{id:string}>>`select t.id from templates t join template_versions v on v.id=t.current_version_id where t.id=${input.templateId}::uuid and v.validation_status='passed' and coalesce(${input.health??null},t.health)='healthy' limit 1 for update of t`;if(!ready[0])throw new Error("template_version_not_validated");}
  const rows=await tx<Array<{id:string}>>`update templates set name=coalesce(${input.name??null},name),material=coalesce(${input.material??null},material),status=coalesce(${input.status??null},status),launch_status=coalesce(${input.launchStatus??null},launch_status),health=coalesce(${input.health??null},health),photo_mode=coalesce(${input.photoMode??null},photo_mode),editorial_score=coalesce(${input.editorialScore??null},editorial_score),maturity=coalesce(${input.maturity??null},maturity),archived_at=case when ${input.status??null}='archived' then now() when ${input.status??null}='active' then null else archived_at end,updated_at=now() where id=${input.templateId}::uuid returning id`;
  if(!rows[0])throw new Error("template_not_found");
  if(input.targeting){const dims=input.replaceTargetingDimensions??["market","occasion","feeling","exclude_market"];if(dims.length)await tx`delete from template_targeting where template_id=${input.templateId}::uuid and dimension=any(${dims}::text[])`;for(const target of input.targeting)await tx`insert into template_targeting(template_id,dimension,target_key,affinity) values(${input.templateId}::uuid,${target.dimension},${target.key},${target.affinity})`; }
  return{templateId:input.templateId};
 });}finally{await sql.end({timeout:2});}
}

export async function listManagedTemplateVersions(input:{templateId:string;connectionString?:string}){
 const sql=client(input.connectionString);try{return await sql<Array<{id:string;version:number;renderer_template_key:string;visual_direction:VisualDirection;supported_formats:unknown;script_support:unknown;headline_capacity:TextCapacity;body_capacity:TextCapacity;validation_status:string;validation_notes:string|null;created_at:Date}>>`select id,version,renderer_template_key,visual_direction,supported_formats,script_support,headline_capacity,body_capacity,validation_status,validation_notes,created_at from template_versions where template_id=${input.templateId}::uuid order by version desc`;}finally{await sql.end({timeout:2});}
}

export async function createManagedTemplateVersion(input:{templateId:string;versionId:string;rendererTemplateKey:string;visualDirection:VisualDirection;supportedFormats:string[];scriptSupport:TemplateScript[];headlineCapacity:TextCapacity;bodyCapacity:TextCapacity;validationStatus:"pending"|"passed"|"failed";validationNotes?:string;activate?:boolean;connectionString?:string}){
 const sql=client(input.connectionString);try{return await sql.begin(async tx=>{
  await tx`select pg_advisory_xact_lock(hashtextextended(${`cardelume:template-version:${input.templateId}`},0))`;
  const current=await tx<Array<{next_version:number}>>`select coalesce(max(version),0)::int+1 as next_version from template_versions where template_id=${input.templateId}::uuid`;
  const version=current[0]?.next_version??1;
  await tx`insert into template_versions(id,template_id,version,renderer_template_key,visual_direction,supported_formats,script_support,headline_capacity,body_capacity,validation_status,validation_notes) values(${input.versionId}::uuid,${input.templateId}::uuid,${version},${input.rendererTemplateKey},${input.visualDirection},${tx.json(input.supportedFormats as never)},${tx.json(input.scriptSupport as never)},${input.headlineCapacity},${input.bodyCapacity},${input.validationStatus},${input.validationNotes??null})`;
  if(input.activate){if(input.validationStatus!=="passed")throw new Error("template_version_not_validated");await tx`update templates set current_version_id=${input.versionId}::uuid,status='active',launch_status=case when launch_status='approved' then 'candidate' else launch_status end,updated_at=now() where id=${input.templateId}::uuid`;}
  return{templateId:input.templateId,versionId:input.versionId,version};
 });}finally{await sql.end({timeout:2});}
}

export async function archiveManagedTemplate(input:{templateId:string;connectionString?:string}){return updateManagedTemplate({templateId:input.templateId,status:"archived",connectionString:input.connectionString});}

export async function recordTemplateEvent(input:{eventId:string;templateId:string;templateVersionId:string;eventType:"impression"|"selected"|"ai_assigned"|"checkout_started"|"paid"|"regenerated";source:TemplateSurfaceSource;market:string;locale:string;rankPosition?:number;dedupeKey?:string;connectionString?:string}){
 const sql=client(input.connectionString);try{await sql`insert into template_events(id,template_id,template_version_id,event_type,source,market,locale,rank_position,dedupe_key) values(${input.eventId}::uuid,${input.templateId}::uuid,${input.templateVersionId}::uuid,${input.eventType},${input.source},${input.market.slice(0,16).toUpperCase()},${input.locale.slice(0,20)},${input.rankPosition??null},${input.dedupeKey??null}) on conflict do nothing`;}finally{await sql.end({timeout:2});}
}

export async function recordPaidTemplateEventForOrder(input:{orderId:string;eventId:string;connectionString?:string}){
 const sql=client(input.connectionString);try{const rows=await sql<Array<{template_id:string;template_version_id:string;template_source:TemplateSurfaceSource|null;market:string|null;locale:string}>>`
  select cv.managed_template_id as template_id,cv.managed_template_version_id as template_version_id,cv.managed_template_source as template_source,o.pricing_market as market,o.locale
  from order_items oi join orders o on o.id=oi.order_id join card_versions cv on cv.id=oi.resource_version_id
  where oi.order_id=${input.orderId}::uuid and oi.product_key='cardelume' and cv.managed_template_id is not null limit 1
 `;const row=rows[0];if(!row)return false;await sql`insert into template_events(id,template_id,template_version_id,event_type,source,market,locale) values(${input.eventId}::uuid,${row.template_id}::uuid,${row.template_version_id}::uuid,'paid',${row.template_source??"ai_direction"},${(row.market??"GLOBAL").slice(0,16).toUpperCase()},${row.locale.slice(0,20)}) on conflict(id) do nothing`;return true;}finally{await sql.end({timeout:2});}
}

export async function rollupTemplateMetricsDaily(input:{lookbackDays?:number;connectionString?:string}={}){
 const days=Math.max(1,Math.min(7,Math.floor(input.lookbackDays??2)));const sql=client(input.connectionString);try{
  const rows=await sql<Array<{day:string;template_id:string}>>`
    insert into template_metrics_daily(day,template_id,market,source,impressions,selected,ai_assigned,checkout_started,paid,regenerated,updated_at)
    select created_at::date,template_id,market,source,
      count(*) filter(where event_type='impression')::int,
      count(*) filter(where event_type='selected')::int,
      count(*) filter(where event_type='ai_assigned')::int,
      count(*) filter(where event_type='checkout_started')::int,
      count(*) filter(where event_type='paid')::int,
      count(*) filter(where event_type='regenerated')::int,now()
    from template_events
    where created_at>=current_date-(${days} * interval '1 day') and created_at<current_date
    group by created_at::date,template_id,market,source
    on conflict(day,template_id,market,source) do update set
      impressions=excluded.impressions,selected=excluded.selected,ai_assigned=excluded.ai_assigned,
      checkout_started=excluded.checkout_started,paid=excluded.paid,regenerated=excluded.regenerated,updated_at=now()
    returning day::text,template_id
  `;return rows.length;
 }finally{await sql.end({timeout:2});}
}

export async function cleanupTemplateEvents(input:{olderThanDays?:number;connectionString?:string}={}){
 const days=Math.max(30,Math.min(365,Math.floor(input.olderThanDays??90)));const sql=client(input.connectionString);try{
  const rows=await sql<Array<{id:string}>>`delete from template_events where created_at<now()-(${days} * interval '1 day') returning id`;
  return rows.length;
 }finally{await sql.end({timeout:2});}
}

export async function templateCatalogReadiness(input:{connectionString?:string}={}){
 const sql=client(input.connectionString);try{
  const rows=await sql<Array<{id:string;visual_direction:VisualDirection;photo_mode:TemplatePhotoMode;supported_formats:unknown;script_support:unknown}>>`select t.id,v.visual_direction,t.photo_mode,v.supported_formats,v.script_support from templates t join template_versions v on v.id=t.current_version_id where t.status='active' and t.health='healthy' and t.launch_status not in ('hold','retired') and (${process.env.APP_ENV!=="production"} or t.launch_status='approved') and v.validation_status='passed'`;
  const formats=["portrait-5x7","folded-5x7","square-5x5","landscape-7x5","postcard-6x4"];const scripts:TemplateScript[]=["latin","cjk","hangul"];const required=["editorial","midnight","quiet","photo"] as const;const missing:string[]=[];
  for(const format of formats)for(const script of scripts)for(const archetype of required){const hit=rows.some(r=>arr(r.supported_formats).includes(format)&&arr(r.script_support).includes(script)&&templateArchetype({visualDirection:r.visual_direction,photoMode:r.photo_mode})===archetype);if(!hit)missing.push(`${format}:${script}:${archetype}`);}
  return{ready:rows.length>0&&missing.length===0,total:rows.length,missing};
 }finally{await sql.end({timeout:2});}
}

export async function listRecentStyleFingerprints(input:{userId:string;limit?:number;connectionString?:string}){
 const limit=Math.max(0,Math.min(8,Math.floor(input.limit??5)));if(limit===0)return[];
 const sql=client(input.connectionString);try{return await sql<Array<{familyId:string;templateId:string;visualDirection:VisualDirection;accentMode:"original"|"photo"|"navy"|"sage"|"rose"|null;createdAt:string}>>`
  select family_id::text as "familyId",template_id::text as "templateId",visual_direction as "visualDirection",accent_mode as "accentMode",created_at::text as "createdAt"
  from style_fingerprints where user_id=${input.userId}::uuid order by created_at desc limit ${limit}
 `;}finally{await sql.end({timeout:2});}
}

export async function recordStyleFingerprint(input:{id:string;userId:string;templateId:string;templateVersionId:string;accentMode?:"original"|"photo"|"navy"|"sage"|"rose";source:"selected"|"checkout"|"paid";sourceKey?:string;connectionString?:string}){
 const sql=client(input.connectionString);try{
  const rows=await sql<Array<{id:string}>>`
    insert into style_fingerprints(id,user_id,template_id,template_version_id,family_id,visual_direction,accent_mode,source,source_key)
    select ${input.id}::uuid,${input.userId}::uuid,t.id,v.id,t.family_id,v.visual_direction,${input.accentMode??null},${input.source},${input.sourceKey??null}
    from templates t join template_versions v on v.id=${input.templateVersionId}::uuid and v.template_id=t.id
    where t.id=${input.templateId}::uuid
    on conflict(source_key) do nothing returning id
  `;return Boolean(rows[0]);
 }finally{await sql.end({timeout:2});}
}

export async function cleanupStyleFingerprints(input:{olderThanDays?:number;connectionString?:string}={}){
 const days=Math.max(30,Math.min(730,Math.floor(input.olderThanDays??180)));const sql=client(input.connectionString);try{const rows=await sql<Array<{id:string}>>`delete from style_fingerprints where created_at<now()-(${days} * interval '1 day') returning id`;return rows.length;}finally{await sql.end({timeout:2});}
}

export type TemplateLaunchDecision="approved"|"candidate"|"hold"|"rework"|"rejected";

export async function decideManagedTemplateLaunch(input:{
  templateId:string;decision:TemplateLaunchDecision;actor:string;
  benchmarkEvidence?:string;ipEvidence?:string;humanReviewEvidence?:string;note?:string;connectionString?:string;
}){
  const actor=input.actor.trim().slice(0,160);if(!actor)throw new Error("template_launch_actor_required");
  const evidence={benchmark:(input.benchmarkEvidence??"").trim().slice(0,500),ip:(input.ipEvidence??"").trim().slice(0,500),human:(input.humanReviewEvidence??"").trim().slice(0,500)};
  if(input.decision==="approved"&&(!evidence.benchmark||!evidence.ip||!evidence.human))throw new Error("template_launch_evidence_required");
  const sql=client(input.connectionString);try{return await sql.begin(async tx=>{
    const current=await tx<Array<{template_id:string;version_id:string;status:TemplateStatus;health:TemplateHealth;validation_status:string}>>`
      select t.id::text as template_id,v.id::text as version_id,t.status,t.health,v.validation_status
      from templates t join template_versions v on v.id=t.current_version_id
      where t.id=${input.templateId}::uuid limit 1 for update of t
    `;
    const row=current[0];if(!row)throw new Error("template_not_found");
    if(input.decision==="approved"&&(row.status!=="active"||row.health!=="healthy"||row.validation_status!=="passed"))throw new Error("template_launch_runtime_not_ready");
    const launchStatus:TemplateLaunchStatus=input.decision==="approved"?"approved":input.decision==="candidate"?"candidate":"hold";
    const approvalId=(await tx<Array<{id:string}>>`
      insert into template_launch_approvals(template_id,template_version_id,decision,actor,benchmark_evidence,ip_evidence,human_review_evidence,note)
      values(${row.template_id}::uuid,${row.version_id}::uuid,${input.decision},${actor},${evidence.benchmark||null},${evidence.ip||null},${evidence.human||null},${input.note?.trim().slice(0,2000)??null}) returning id::text
    `)[0]?.id;
    await tx`update templates set launch_status=${launchStatus},updated_at=now() where id=${input.templateId}::uuid`;
    return{templateId:input.templateId,templateVersionId:row.version_id,launchStatus,decision:input.decision,approvalId};
  });}finally{await sql.end({timeout:2});}
}

export async function listTemplateLaunchApprovals(input:{templateId:string;limit?:number;connectionString?:string}){
  const limit=Math.max(1,Math.min(50,Math.floor(input.limit??10)));const sql=client(input.connectionString);try{return await sql<Array<{id:string;templateVersionId:string;decision:TemplateLaunchDecision;actor:string;benchmarkEvidence:string|null;ipEvidence:string|null;humanReviewEvidence:string|null;note:string|null;createdAt:string}>>`
    select id::text,template_version_id::text as "templateVersionId",decision,actor,benchmark_evidence as "benchmarkEvidence",ip_evidence as "ipEvidence",human_review_evidence as "humanReviewEvidence",note,created_at::text as "createdAt"
    from template_launch_approvals where template_id=${input.templateId}::uuid order by created_at desc limit ${limit}
  `;}finally{await sql.end({timeout:2});}
}

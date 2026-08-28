import postgres from "postgres";

export type FunnelEventType=
  | "studio_started" | "generation_requested" | "results_viewed" | "direction_selected"
  | "finish_opened" | "checkout_opened" | "checkout_started" | "payment_completed"
  | "final_render_completed" | "download_jpg" | "download_pdf" | "share_started" | "refund_requested";
export type FunnelSource="web"|"payment_webhook"|"worker"|"recovery";

function dbUrl(value?:string){const url=value??process.env.DATABASE_URL;if(!url)throw new Error("DATABASE_URL is required");return url;}
function client(connectionString?:string){return postgres(dbUrl(connectionString),{max:2,prepare:false});}
function clean(value:string|undefined,max:number,fallback:string){const v=(value??"").trim();return(v||fallback).slice(0,max);}
function pseudonymKey(){const key=process.env.ANALYTICS_PSEUDONYM_KEY??"";if(process.env.NODE_ENV==="production"&&key.length<32)throw new Error("analytics_pseudonym_key_invalid");return key||"cardelume-dev-analytics-pseudonym-key-not-for-production";}

export async function recordFunnelEvent(input:{
  eventId:string;subjectHash:string;eventType:FunnelEventType;source:FunnelSource;
  orderId?:string;templateId?:string;templateVersionId?:string;market?:string;locale?:string;
  currency?:string;pricingVariant?:string;purchaseKind?:string;direction?:string;photoUsed?:boolean;
  dedupeKey?:string;connectionString?:string;
}){
  if(!/^[a-f0-9]{64}$/.test(input.subjectHash))throw new Error("funnel_subject_hash_invalid");
  const sql=client(input.connectionString);try{
    await sql`insert into funnel_events(
      id,subject_hash,event_type,source,order_id,template_id,template_version_id,market,locale,currency,pricing_variant,purchase_kind,direction,photo_used,dedupe_key
    ) values(
      ${input.eventId}::uuid,${input.subjectHash},${input.eventType},${input.source},${input.orderId??null}::uuid,${input.templateId??null}::uuid,${input.templateVersionId??null}::uuid,
      ${clean(input.market,16,"GLOBAL").toUpperCase()},${clean(input.locale,20,"en")},${clean(input.currency,8,"OTHER").toUpperCase()},${clean(input.pricingVariant,40,"unknown")},${clean(input.purchaseKind,32,"single")},${input.direction?clean(input.direction,48,""):null},${input.photoUsed??null},${input.dedupeKey?clean(input.dedupeKey,180,""):null}
    ) on conflict do nothing`;
  }finally{await sql.end({timeout:2});}
}

export async function recordFunnelEventForOrder(input:{orderId:string;eventId:string;eventType:"payment_completed"|"final_render_completed";source:"payment_webhook"|"worker";dedupeKey?:string;connectionString?:string}){
  const sql=client(input.connectionString);try{
    const rows=await sql<Array<{user_id:string;market:string|null;locale:string;currency:string;template_id:string|null;template_version_id:string|null;direction:string|null;photo_used:boolean|null}>>`
      select o.user_id::text,o.pricing_market as market,o.locale,o.currency,
        cv.managed_template_id::text as template_id,cv.managed_template_version_id::text as template_version_id,cv.direction,
        case when cv.document ? 'photo' then true else null end as photo_used
      from orders o
      left join order_items oi on oi.order_id=o.id and oi.product_key='cardelume'
      left join card_versions cv on cv.id=oi.resource_version_id
      where o.id=${input.orderId}::uuid limit 1
    `;
    const row=rows[0];if(!row)return false;
    // UUIDs are high-entropy random identifiers. Hashing creates a stable pseudonymous subject without retaining the raw user id.
    const hashRows=await sql<Array<{subject_hash:string}>>`select encode(hmac(${`cardelume-funnel-v1|${row.user_id}`},${pseudonymKey()},'sha256'),'hex') as subject_hash`;
    const subjectHash=hashRows[0]?.subject_hash;if(!subjectHash)return false;
    await sql`insert into funnel_events(id,subject_hash,event_type,source,order_id,template_id,template_version_id,market,locale,currency,pricing_variant,purchase_kind,direction,photo_used,dedupe_key)
      values(${input.eventId}::uuid,${subjectHash},${input.eventType},${input.source},${input.orderId}::uuid,${row.template_id}::uuid,${row.template_version_id}::uuid,${(row.market??"GLOBAL").slice(0,16).toUpperCase()},${row.locale.slice(0,20)},${row.currency.slice(0,8).toUpperCase()},'order','single',${row.direction?.slice(0,48)??null},${row.photo_used},${input.dedupeKey??`${input.eventType}:${input.orderId}`}) on conflict do nothing`;
    return true;
  }finally{await sql.end({timeout:2});}
}

export async function funnelSummary(input:{days?:number;connectionString?:string}={}){
  const days=Math.max(1,Math.min(90,Math.floor(input.days??30)));const sql=client(input.connectionString);try{
    return await sql<Array<{event_type:FunnelEventType;events:number;subjects:number}>>`
      select event_type,count(*)::int as events,count(distinct subject_hash)::int as subjects
      from funnel_events where created_at>=now()-(${days} * interval '1 day')
      group by event_type order by min(created_at),event_type
    `;
  }finally{await sql.end({timeout:2});}
}

export async function cleanupFunnelEvents(input:{olderThanDays?:number;connectionString?:string}={}){
  const days=Math.max(30,Math.min(365,Math.floor(input.olderThanDays??180)));const sql=client(input.connectionString);try{
    const rows=await sql<Array<{id:string}>>`delete from funnel_events where created_at<now()-(${days} * interval '1 day') returning id`;return rows.length;
  }finally{await sql.end({timeout:2});}
}

import postgres from "postgres";

function dbUrl(value?:string){const url=value??process.env.DATABASE_URL;if(!url)throw new Error("DATABASE_URL is required");return url;}
function client(connectionString?:string){return postgres(dbUrl(connectionString),{max:2,prepare:false,connect_timeout:3,idle_timeout:5});}
function boundedInt(value:number,min:number,max:number){const n=Number.isFinite(value)?Math.floor(value):min;return Math.max(min,Math.min(max,n));}

export async function upsertWorkerHeartbeat(input:{nodeId:string;version:string;activeJobs:number;connectionString?:string}){
  const sql=client(input.connectionString);
  try{
    await sql`
      insert into worker_heartbeats(node_id,version,active_jobs,last_seen_at)
      values(${input.nodeId.slice(0,160)},${input.version.slice(0,120)},${Math.max(0,Math.floor(input.activeJobs))},now())
      on conflict(node_id) do update set
        version=excluded.version,
        active_jobs=excluded.active_jobs,
        last_seen_at=now()
    `;
  }finally{await sql.end({timeout:2});}
}

export async function removeWorkerHeartbeat(input:{nodeId:string;connectionString?:string}){
  const sql=client(input.connectionString);
  try{await sql`delete from worker_heartbeats where node_id=${input.nodeId.slice(0,160)}`;}finally{await sql.end({timeout:2});}
}

export async function productionReadiness(input:{workerMaxAgeSeconds?:number;requiredVersion?:string;connectionString?:string}={}){
  const maxAge=boundedInt(input.workerMaxAgeSeconds??45,10,300);
  const sql=client(input.connectionString);
  try{
    const requiredVersion=input.requiredVersion?.slice(0,120)??null;
    const rows=await sql<Array<{db_now:Date;healthy_workers:number;newest_worker_at:Date|null;active_jobs:number}>>`
      select now() as db_now,
        count(*) filter(where last_seen_at >= now()-(${maxAge}::text||' seconds')::interval and (${requiredVersion}::text is null or version=${requiredVersion}))::int as healthy_workers,
        max(last_seen_at) filter(where (${requiredVersion}::text is null or version=${requiredVersion})) as newest_worker_at,
        coalesce(sum(active_jobs) filter(where last_seen_at >= now()-(${maxAge}::text||' seconds')::interval and (${requiredVersion}::text is null or version=${requiredVersion})),0)::int as active_jobs
      from worker_heartbeats
    `;
    const row=rows[0];
    return{dbNow:row.db_now,healthyWorkers:row.healthy_workers,newestWorkerAt:row.newest_worker_at,activeJobs:row.active_jobs,maxAgeSeconds:maxAge};
  }finally{await sql.end({timeout:2});}
}

export type RateLimitResult={allowed:boolean;count:number;limit:number;retryAfterSeconds:number};
export async function consumeRateLimit(input:{bucketKey:string;subjectKey:string;limit:number;windowSeconds:number;connectionString?:string}):Promise<RateLimitResult>{
  const limit=boundedInt(input.limit,1,10000),window=boundedInt(input.windowSeconds,10,86400);
  const bucket=input.bucketKey.replace(/[^a-zA-Z0-9_.:-]/g,"-").slice(0,80);
  const subject=input.subjectKey.replace(/[^a-zA-Z0-9_.:-]/g,"-").slice(0,180);
  if(!bucket||!subject)throw new Error("rate_limit_identity_invalid");
  const sql=client(input.connectionString);
  try{
    const rows=await sql<Array<{request_count:number;window_start:Date;db_now:Date}>>`
      with boundary as (
        select to_timestamp(floor(extract(epoch from now())/${window})*${window}) as window_start
      )
      insert into request_rate_buckets(bucket_key,subject_key,window_start,request_count,updated_at)
      select ${bucket},${subject},boundary.window_start,1,now() from boundary
      on conflict(bucket_key,subject_key,window_start) do update set
        request_count=least(request_rate_buckets.request_count+1,${limit+1}),
        updated_at=now()
      returning request_count,window_start,now() as db_now
    `;
    const row=rows[0];if(!row)throw new Error("rate_limit_update_failed");
    const retry=Math.max(1,Math.ceil((row.window_start.getTime()+window*1000-row.db_now.getTime())/1000));
    return{allowed:row.request_count<=limit,count:row.request_count,limit,retryAfterSeconds:retry};
  }finally{await sql.end({timeout:2});}
}

export async function cleanupStaleWorkerHeartbeats(input:{olderThanHours?:number;connectionString?:string}={}){
  const hours=boundedInt(input.olderThanHours??24,1,720);
  const sql=client(input.connectionString);
  try{const rows=await sql<Array<{node_id:string}>>`delete from worker_heartbeats where last_seen_at < now()-(${hours}::text||' hours')::interval returning node_id`;return rows.length;}finally{await sql.end({timeout:2});}
}

export async function cleanupRateLimitBuckets(input:{olderThanHours?:number;connectionString?:string}={}){
  const hours=boundedInt(input.olderThanHours??48,2,720);
  const sql=client(input.connectionString);
  try{
    const rows=await sql<Array<{bucket_key:string}>>`
      delete from request_rate_buckets
      where window_start < now()-(${hours}::text||' hours')::interval
      returning bucket_key
    `;
    return rows.length;
  }finally{await sql.end({timeout:2});}
}

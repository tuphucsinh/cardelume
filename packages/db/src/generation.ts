import postgres from "postgres";
function dbUrl(value?:string){const url=value??process.env.DATABASE_URL;if(!url)throw new Error("DATABASE_URL is required");return url;}
function client(connectionString?:string){return postgres(dbUrl(connectionString),{max:2,prepare:false});}

export async function createDurableGenerationJob(input:{jobId:string;cardId:string;userId:string;idempotencyKey:string;requestHash:string;occasion:string;locale:string;brief:unknown;connectionString?:string}){
  const sql=client(input.connectionString);
  try{return await sql.begin(async tx=>{
    const lock=`cardelume:generation:${input.userId}:${input.idempotencyKey}`;await tx`select pg_advisory_xact_lock(hashtextextended(${lock},0))`;
    const existing=await tx<Array<{id:string;card_id:string;status:string;request_hash:string|null;queue_job_id:string|null;created_at:Date}>>`
      select id,card_id,status,request_hash,queue_job_id,created_at from generation_jobs
      where user_id=${input.userId}::uuid and idempotency_key=${input.idempotencyKey} limit 1 for update
    `;
    const prior=existing[0];if(prior){if(prior.request_hash!==input.requestHash)throw new Error("generation_idempotency_conflict");return{jobId:prior.id,cardId:prior.card_id,status:prior.status,queueJobId:prior.queue_job_id,createdAt:prior.created_at.getTime(),created:false};}
    await tx`insert into cards(id,user_id,status,occasion,locale) values(${input.cardId}::uuid,${input.userId}::uuid,'draft',${input.occasion},${input.locale})`;
    const inserted=await tx<Array<{created_at:Date}>>`insert into generation_jobs(id,user_id,card_id,status,idempotency_key,request_hash,brief,stage)
      values(${input.jobId}::uuid,${input.userId}::uuid,${input.cardId}::uuid,'queued',${input.idempotencyKey},${input.requestHash},${tx.json(input.brief as never)},0) returning created_at`;
    return{jobId:input.jobId,cardId:input.cardId,status:"queued",queueJobId:null,createdAt:inserted[0]!.created_at.getTime(),created:true};
  });}finally{await sql.end({timeout:2});}
}

export async function bindGenerationQueueJob(input:{jobId:string;queueJobId:string|null;connectionString?:string}){const sql=client(input.connectionString);try{await sql`update generation_jobs set queue_job_id=coalesce(queue_job_id,${input.queueJobId}),updated_at=now() where id=${input.jobId}::uuid`; }finally{await sql.end({timeout:2});}}

export async function claimGenerationJob(input:{jobId:string;connectionString?:string}){
  const sql=client(input.connectionString);try{return await sql.begin(async tx=>{
    const rows=await tx<Array<{id:string;user_id:string;card_id:string;status:string;brief:unknown;attempt_count:number;created_at:Date}>>`select id,user_id,card_id,status,brief,attempt_count,created_at from generation_jobs where id=${input.jobId}::uuid limit 1 for update`;
    const job=rows[0];if(!job)throw new Error("generation_job_not_found");if(job.status==="ready")return{state:"ready" as const,job};
    if(job.status==="failed")return{state:"cancelled" as const,job};
    await tx`update generation_jobs set status='planning',stage=1,attempt_count=attempt_count+1,started_at=coalesce(started_at,now()),error_code=null,updated_at=now() where id=${input.jobId}::uuid`;
    return{state:"claimed" as const,job};
  });}finally{await sql.end({timeout:2});}
}
export async function cancelGenerationJob(input:{jobId:string;userId:string;connectionString?:string}){const sql=client(input.connectionString);try{const rows=await sql<Array<{id:string}>>`update generation_jobs set status='failed',error_code='generation_cancelled',completed_at=now(),updated_at=now() where id=${input.jobId}::uuid and user_id=${input.userId}::uuid and status in ('queued','planning','composing','rendering') returning id`;return Boolean(rows[0]);}finally{await sql.end({timeout:2});}}
export async function cancelGenerationJobByIdempotencyKey(input:{idempotencyKey:string;userId:string;connectionString?:string}){const sql=client(input.connectionString);try{const rows=await sql<Array<{id:string}>>`update generation_jobs set status='failed',error_code='generation_cancelled',completed_at=now(),updated_at=now() where idempotency_key=${input.idempotencyKey} and user_id=${input.userId}::uuid and status in ('queued','planning','composing','rendering') returning id`;return Boolean(rows[0]);}finally{await sql.end({timeout:2});}}
export async function generationJobIsActive(input:{jobId:string;connectionString?:string}){const sql=client(input.connectionString);try{const rows=await sql<Array<{status:string}>>`select status from generation_jobs where id=${input.jobId}::uuid limit 1`;return rows[0]?.status!==undefined&&rows[0].status!=="failed"&&rows[0].status!=="ready";}finally{await sql.end({timeout:2});}}
export async function updateGenerationStage(input:{jobId:string;status:"planning"|"composing"|"rendering";stage:0|1|2|3;connectionString?:string}){const sql=client(input.connectionString);try{await sql`update generation_jobs set status=${input.status},stage=${input.stage},updated_at=now() where id=${input.jobId}::uuid and status not in ('ready','failed')`; }finally{await sql.end({timeout:2});}}
export async function completeGenerationJob(input:{jobId:string;result:unknown;connectionString?:string}){const sql=client(input.connectionString);try{const rows=await sql<Array<{id:string}>>`update generation_jobs set status='ready',stage=3,result=${sql.json(input.result as never)},error_code=null,completed_at=now(),updated_at=now() where id=${input.jobId}::uuid and status<>'failed' returning id`;if(!rows[0])throw new Error("generation_complete_failed");}finally{await sql.end({timeout:2});}}
export async function failGenerationJob(input:{jobId:string;errorCode:string;connectionString?:string}){const sql=client(input.connectionString);try{await sql`update generation_jobs set status='failed',error_code=${input.errorCode.slice(0,120)},completed_at=now(),updated_at=now() where id=${input.jobId}::uuid and status not in ('ready','failed')`; }finally{await sql.end({timeout:2});}}
export async function generationStatusForOwner(input:{jobId:string;userId:string;connectionString?:string}){const sql=client(input.connectionString);try{const rows=await sql<Array<{status:string;stage:number;result:unknown;brief:unknown;error_code:string|null}>>`select status,stage,result,brief,error_code from generation_jobs where id=${input.jobId}::uuid and user_id=${input.userId}::uuid limit 1`;return rows[0]??null;}finally{await sql.end({timeout:2});}}

export async function failStaleGenerationJobs(input:{olderThanMinutes?:number;connectionString?:string}={}){const sql=client(input.connectionString);const minutes=Math.max(2,input.olderThanMinutes??5);try{const rows=await sql<Array<{id:string}>>`update generation_jobs set status='failed',error_code='generation_expired',completed_at=now(),updated_at=now() where status in ('queued','planning','composing','rendering') and created_at < now()-(${minutes}::text||' minutes')::interval returning id`;return rows.length;}finally{await sql.end({timeout:2});}}
export async function cleanupCompletedGenerationJobs(input:{olderThanDays?:number;connectionString?:string}={}){
  const sql=client(input.connectionString);const days=Math.max(1,Math.min(30,Math.floor(input.olderThanDays??7)));
  try{
    const rows=await sql<Array<{id:string}>>`
      delete from generation_jobs
      where status in ('ready','failed')
        and coalesce(completed_at,updated_at,created_at) < now()-(${days}::text||' days')::interval
      returning id
    `;
    return rows.length;
  }finally{await sql.end({timeout:2});}
}

export async function recordGenerationAIUsage(input:{id:string;generationJobId:string;phase:"creative_director"|"expanded_director"|"critic_repair";provider:string;model:string;inputTokens?:number;outputTokens?:number;latencyMs:number;estimatedCostMicros?:number;success:boolean;errorCode?:string;connectionString?:string}){
  const sql=client(input.connectionString);try{await sql`insert into generation_ai_usage(id,generation_job_id,phase,provider,model,input_tokens,output_tokens,latency_ms,estimated_cost_micros,success,error_code) values(${input.id}::uuid,${input.generationJobId}::uuid,${input.phase},${input.provider.slice(0,80)},${input.model.slice(0,160)},${input.inputTokens??null},${input.outputTokens??null},${Math.max(0,Math.floor(input.latencyMs))},${input.estimatedCostMicros??null},${input.success},${input.errorCode?.slice(0,120)??null})`; }finally{await sql.end({timeout:2});}
}

export async function cleanupGenerationAIUsage(input:{olderThanDays?:number;connectionString?:string}={}){
  const days=Math.max(7,Math.min(365,Math.floor(input.olderThanDays??30)));const sql=client(input.connectionString);try{const rows=await sql<Array<{id:string}>>`delete from generation_ai_usage where created_at<now()-(${days} * interval '1 day') returning id`;return rows.length;}finally{await sql.end({timeout:2});}
}

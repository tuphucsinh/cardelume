import "server-only";
import { createHash } from "node:crypto";
import { bindGenerationQueueJob, createDurableGenerationJob, failGenerationJob } from "@cardelume/db";
import { createBoss, ensureCardeLumeQueues, platformSingletonKey, QUEUES } from "@cardelume/queue";
import type { GenerationBrief } from "@cardelume/card-schema";

export { issueGenerationStatusToken, verifyGenerationStatusToken } from "./generation-token.server";

export function generationRequestHash(brief:GenerationBrief){return createHash("sha256").update(JSON.stringify(brief),"utf8").digest("hex");}

let bossPromise:Promise<ReturnType<typeof createBoss>>|undefined;
async function sender(){
  if(!bossPromise)bossPromise=(async()=>{const boss=createBoss();boss.on("error",(error:unknown)=>console.error(JSON.stringify({level:"error",event:"queue_sender_error",error:error instanceof Error?error.message:"unknown"})));await boss.start();await ensureCardeLumeQueues(boss);return boss;})();
  return bossPromise;
}
export async function createAndEnqueueGeneration(input:{jobId:string;cardId:string;userId:string;idempotencyKey:string;brief:GenerationBrief}){
  const requestHash=generationRequestHash(input.brief);
  const durable=await createDurableGenerationJob({jobId:input.jobId,cardId:input.cardId,userId:input.userId,idempotencyKey:input.idempotencyKey,requestHash,occasion:input.brief.occasion,locale:input.brief.locale,brief:input.brief});
  if(durable.status==="ready")return durable;
  try{
    const boss=await sender();
    const queueJobId=await boss.send(QUEUES.aiPlan,{productKey:"cardelume",resourceId:durable.cardId,jobId:durable.jobId},{singletonSeconds:86400,singletonKey:platformSingletonKey({productKey:"cardelume",resourceId:durable.cardId,jobId:durable.jobId}),expireInSeconds:45});
    await bindGenerationQueueJob({jobId:durable.jobId,queueJobId});
    return{...durable,queueJobId:queueJobId??durable.queueJobId};
  }catch(error){
    await failGenerationJob({jobId:durable.jobId,errorCode:"generation_queue_unavailable"}).catch(()=>undefined);
    throw error;
  }
}

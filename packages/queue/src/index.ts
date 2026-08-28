import PgBoss from "pg-boss";

export const QUEUES={aiPlan:"ai_plan",final:"final_render",cleanup:"cleanup"} as const;
export type PlatformJobIdentity={productKey:string;resourceId:string;jobId:string};
export function platformSingletonKey(input:PlatformJobIdentity){return`${input.productKey}:${input.resourceId}:${input.jobId}`;}
export function createBoss(connectionString=process.env.QUEUE_DATABASE_URL??process.env.DATABASE_URL){if(!connectionString)throw new Error("QUEUE_DATABASE_URL_or_DATABASE_URL_required_for_pg_boss");return new PgBoss({connectionString,schema:"pgboss",application_name:`cardelume-${process.env.NODE_ID||"node"}`});}

export async function ensureCardeLumeQueues(boss:PgBoss){
  const definitions=[
    {name:QUEUES.aiPlan,options:{retryLimit:0,expireInSeconds:45,retentionSeconds:300,deleteAfterSeconds:86400}},
    {name:QUEUES.final,options:{retryLimit:2,retryDelay:3,retryBackoff:true,expireInSeconds:180}},
    {name:QUEUES.cleanup,options:{retryLimit:2,retryDelay:5,retryBackoff:true,expireInSeconds:180}}
  ] as const;
  for(const {name,options} of definitions){if(!await boss.getQueue(name))await boss.createQueue(name,options);}
}

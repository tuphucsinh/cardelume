import type { CanonicalPresentationIdentity, GenerationResult } from "@cardelume/card-schema";
export type GenerationState="queued"|"planning"|"composing"|"rendering"|"ready"|"failed";

export type GenerationStatus={
  state:GenerationState;
  stage?:0|1|2|3;
  error?:string;
  result?:GenerationResult;
};

export type GenerationBrief={
  occasion:string;
  recipient?:string;
  relationship:string;
  feeling:string;
  detail?:string;
  format:string;
  locale:string;
  hasPhoto:boolean;
  photoProfile?:{orientation:"portrait"|"landscape"|"square";temperature:"warm"|"cool"|"balanced";luminance:number;paletteConfidence:number;softened:boolean};
  refreshContext?:{priorTemplateIds?:string[];seenTemplateIdentities?:CanonicalPresentationIdentity[]};
};

export type StudioBriefInput=Omit<GenerationBrief,"occasion"|"relationship"|"feeling">&{
  occasion:string;customOccasion?:string;
  relationship:string;customRelation?:string;
  feeling:string;customFeeling?:string;
};

export function buildGenerationBrief(input:StudioBriefInput):GenerationBrief{
  const resolve=(selected:string,custom:string|undefined,sentinel:string,error:string)=>{
    const value=(selected===sentinel?custom:selected)?.trim()??"";
    if(!value)throw new Error(error);
    return value;
  };
  return{
    ...input,
    occasion:resolve(input.occasion,input.customOccasion,"Other","custom_occasion_required"),
    relationship:resolve(input.relationship,input.customRelation,"Someone else","custom_relationship_required"),
    feeling:resolve(input.feeling,input.customFeeling,"Custom","custom_feeling_required")
  };
}

export function isCurrentGenerationRequest(requestId:number,currentRequestId:number,signal?:AbortSignal){
  return requestId===currentRequestId&&!signal?.aborted;
}

export type GenerationFailureCode=
  |"generation_start_failed"
  |"generation_job_missing"
  |"generation_status_failed"
  |"generation_provider_failed"
  |"generation_provider_timeout"
  |"generation_provider_bad_request"
  |"generation_queue_expired"
  |"generation_safe_failure"
  |"generation_network_failed"
  |"generation_timeout";

export class GenerationError extends Error{
  readonly code:GenerationFailureCode;
  constructor(code:GenerationFailureCode){super(code);this.name="GenerationError";this.code=code;}
}

const REQUEST_TIMEOUT_MS=8_000;
const LIVE_GENERATION_DEADLINE_MS=22_000;

function sleep(ms:number,signal?:AbortSignal){
  return new Promise<void>((resolve,reject)=>{
    if(signal?.aborted){reject(aborted());return;}
    let timer:ReturnType<typeof setTimeout>;
    const onAbort=()=>{clearTimeout(timer);signal?.removeEventListener("abort",onAbort);reject(aborted());};
    timer=setTimeout(()=>{signal?.removeEventListener("abort",onAbort);resolve();},ms);
    signal?.addEventListener("abort",onAbort,{once:true});
  });
}

function pollDelay(elapsed:number){
  if(elapsed<2000)return 750;
  if(elapsed<5000)return 1500;
  if(elapsed<15000)return 2500;
  return 4000;
}

function aborted(){return new DOMException("Aborted","AbortError");}

async function fetchBounded(url:string,init:RequestInit,callerSignal?:AbortSignal,timeoutMs=REQUEST_TIMEOUT_MS){
  const controller=new AbortController();
  let callerAborted=false;
  const onAbort=()=>{callerAborted=true;controller.abort();};
  if(callerSignal?.aborted)throw aborted();
  callerSignal?.addEventListener("abort",onAbort,{once:true});
  const timer=setTimeout(()=>controller.abort(),Math.max(1,timeoutMs));
  try{
    return await fetch(url,{...init,signal:controller.signal});
  }catch(error){
    if(callerAborted||callerSignal?.aborted)throw aborted();
    if(error instanceof DOMException&&error.name==="AbortError")throw new GenerationError("generation_timeout");
    throw new GenerationError("generation_network_failed");
  }finally{
    clearTimeout(timer);
    callerSignal?.removeEventListener("abort",onAbort);
  }
}

function remainingDeadline(deadlineAt:number){
  const remaining=deadlineAt-performance.now();
  if(remaining<=0)throw new GenerationError("generation_timeout");
  return Math.min(REQUEST_TIMEOUT_MS,remaining);
}

function statusFailureCode(error:string|undefined):GenerationFailureCode{
  if(error==="generation_expired"||error==="generation_deadline_exceeded"||error==="ai_budget_exhausted")return "generation_queue_expired";
  if(error==="ai_provider_timeout")return "generation_provider_timeout";
  if(error==="ai_provider_http_400"||error==="generation_provider_bad_request")return "generation_provider_bad_request";
  if(error==="ai_generation_safe_failure")return "generation_safe_failure";
  return "generation_provider_failed";
}

export async function runGeneration(input:{
  mode:"mock"|"live";
  brief:GenerationBrief;
  onStatus:(status:GenerationStatus,elapsedMs:number)=>void;
  signal?:AbortSignal;
  sessionCapability:string;
}):Promise<GenerationResult|null>{
  const started=performance.now();
  let deadlineAt=started+LIVE_GENERATION_DEADLINE_MS;

  if(input.mode==="mock"){
    const stages:[number,GenerationStatus][]=[
      [0,{state:"planning",stage:0}],
      [420,{state:"planning",stage:1}],
      [850,{state:"composing",stage:2}],
      [1230,{state:"rendering",stage:3}],
      [1580,{state:"ready",stage:3}]
    ];
    let previous=0;
    for(const [at,status] of stages){
      if(input.signal?.aborted)throw aborted();
      await sleep(Math.max(0,at-previous),input.signal);
      previous=at;
      input.onStatus(status,performance.now()-started);
    }
    return null;
  }

  let created:{jobId:string;statusToken:string;deadlineAt?:number}|undefined;
  const idempotencyKey=crypto.randomUUID();
  const cancelCreatedJob=()=>{
    void (async()=>{
      for(const delay of [0,250,1000,2000]){
        if(delay>0)await new Promise(resolve=>setTimeout(resolve,delay));
        try{
          const response=await fetch("/api/generate",{method:"DELETE",keepalive:true,headers:{"idempotency-key":idempotencyKey}});
          const body=await response.json().catch(()=>null) as {state?:string}|null;
          if(body?.state==="failed")break;
        }catch{}
      }
    })();
  };
  input.signal?.addEventListener("abort",cancelCreatedJob,{once:true});
  try{
    const start=await fetchBounded("/api/generate",{
      method:"POST",
      headers:{"content-type":"application/json","idempotency-key":idempotencyKey},
      body:JSON.stringify({...input.brief,priceQuote:input.sessionCapability})
    },input.signal,remainingDeadline(deadlineAt));
    if(!start.ok)throw new GenerationError("generation_start_failed");
    const parsed=await start.json().catch(()=>({})) as {jobId?:string;statusToken?:string;deadlineAt?:number};
    if(!parsed.jobId||!parsed.statusToken)throw new GenerationError("generation_job_missing");
    created={jobId:parsed.jobId,statusToken:parsed.statusToken,deadlineAt:parsed.deadlineAt};
    if(typeof parsed.deadlineAt==="number"&&Number.isFinite(parsed.deadlineAt))deadlineAt=performance.now()+Math.max(0,parsed.deadlineAt-Date.now());

    while(true){
      if(input.signal?.aborted)throw aborted();
      const elapsed=performance.now()-started;
      const response=await fetchBounded(`/api/generate/${encodeURIComponent(created.jobId)}`,{cache:"no-store",headers:{"x-generation-token":created.statusToken}},input.signal,remainingDeadline(deadlineAt));
      if(!response.ok)throw new GenerationError("generation_status_failed");
      const status=await response.json().catch(()=>null) as GenerationStatus|null;
      if(!status||!status.state)throw new GenerationError("generation_status_failed");
      input.onStatus(status,elapsed);
      if(status.state==="ready")return status.result??null;
      if(status.state==="failed")throw new GenerationError(statusFailureCode(status.error));
      const base=pollDelay(elapsed);
      const jitter=Math.round(base*(Math.random()*.18-.09));
      await sleep(base+jitter,input.signal);
    }
  }catch(error){
    cancelCreatedJob();
    throw error;
  }finally{
    input.signal?.removeEventListener("abort",cancelCreatedJob);
  }
}

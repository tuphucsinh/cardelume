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

export type GenerationFailureCode=
  |"generation_start_failed"
  |"generation_job_missing"
  |"generation_status_failed"
  |"generation_provider_failed"
  |"generation_network_failed"
  |"generation_timeout";

export class GenerationError extends Error{
  readonly code:GenerationFailureCode;
  constructor(code:GenerationFailureCode){super(code);this.name="GenerationError";this.code=code;}
}

const REQUEST_TIMEOUT_MS=8_000;
const LIVE_GENERATION_DEADLINE_MS=24_000;

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

function remainingDeadline(started:number){
  const remaining=LIVE_GENERATION_DEADLINE_MS-(performance.now()-started);
  if(remaining<=0)throw new GenerationError("generation_timeout");
  return Math.min(REQUEST_TIMEOUT_MS,remaining);
}

export async function runGeneration(input:{
  mode:"mock"|"live";
  brief:GenerationBrief;
  onStatus:(status:GenerationStatus,elapsedMs:number)=>void;
  signal?:AbortSignal;
  sessionCapability:string;
}):Promise<GenerationResult|null>{
  const started=performance.now();

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

  const start=await fetchBounded("/api/generate",{
    method:"POST",
    headers:{"content-type":"application/json","idempotency-key":crypto.randomUUID()},
    body:JSON.stringify({...input.brief,priceQuote:input.sessionCapability})
  },input.signal,remainingDeadline(started));
  if(!start.ok)throw new GenerationError("generation_start_failed");
  const created=await start.json().catch(()=>({})) as {jobId?:string;statusToken?:string};
  if(!created.jobId||!created.statusToken)throw new GenerationError("generation_job_missing");

  while(true){
    if(input.signal?.aborted)throw aborted();
    const elapsed=performance.now()-started;
    const response=await fetchBounded(`/api/generate/${encodeURIComponent(created.jobId)}`,{cache:"no-store",headers:{"x-generation-token":created.statusToken}},input.signal,remainingDeadline(started));
    if(!response.ok)throw new GenerationError("generation_status_failed");
    const status=await response.json().catch(()=>null) as GenerationStatus|null;
    if(!status||!status.state)throw new GenerationError("generation_status_failed");
    input.onStatus(status,elapsed);
    if(status.state==="ready")return status.result??null;
    if(status.state==="failed")throw new GenerationError("generation_provider_failed");
    const base=pollDelay(elapsed);
    const jitter=Math.round(base*(Math.random()*.18-.09));
    await sleep(base+jitter,input.signal);
  }
}

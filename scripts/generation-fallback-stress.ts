import fs from "node:fs";
import { GenerationError, runGeneration } from "../apps/web/lib/generation-client.ts";

function must(value:boolean,message:string){if(!value)throw new Error(message);}

async function main() {
const studio=fs.readFileSync("apps/web/components/card-studio.tsx","utf8");
const client=fs.readFileSync("apps/web/lib/generation-client.ts","utf8");
const copy=fs.readFileSync("apps/web/i18n/launch-copy.ts","utf8");

const initialFailure=studio.slice(studio.indexOf("// Provider/queue/network failures"));
must(initialFailure.includes("setRefreshUnavailable(true)"),"initial failure does not enter bounded unavailable state");
must(initialFailure.includes('withTransition(()=>setPhase("brief"))'),"initial failure reveals result cards");
must(!initialFailure.includes("setUsedCuratedFallback(true)"),"initial failure claims curated fallback");
must(!initialFailure.includes("rememberDisplayed(resultDirections)"),"initial failure bypasses novelty history");
must(!studio.includes('window.setTimeout(()=>setPhase("brief"),1800)'),"legacy failure reset still present");
must(studio.includes("generationFallbackNotice"),"fallback notice missing from results");
must(client.includes("LIVE_GENERATION_DEADLINE_MS=22_000"),"overall live deadline missing");
must(client.includes("deadlineAt"),"server absolute deadline is not consumed");
must(client.includes("REQUEST_TIMEOUT_MS=8_000"),"request timeout missing");
must(client.includes('return "generation_provider_failed";'),"provider failure is not normalized");
must(client.includes('callerSignal?.removeEventListener("abort",onAbort)'),"abort listener cleanup missing");
for(const locale of ["en","ja","ko","es","fr","de","pt","it","zh","vi"]){
  must(copy.includes(`${locale}:{`),`locale ${locale} missing`);
}
must((copy.match(/generationFallbackNotice:/g)||[]).length===11,"fallback notice type + 10 locales expected");
must((copy.match(/generationFallbackReady:/g)||[]).length===11,"fallback ready type + 10 locales expected");

const originalFetch=globalThis.fetch;
try{
  globalThis.fetch=(async()=>new Response(JSON.stringify({error:"generation_queue_not_wired"}),{status:501,headers:{"content-type":"application/json"}})) as typeof fetch;
  let startFailure="";
  try{
    await runGeneration({mode:"live",brief:{occasion:"Birthday",relationship:"Friend",feeling:"Warm",format:"Portrait · 5 × 7 in",hasPhoto:false},onStatus:()=>{}});
  }catch(error){
    startFailure=error instanceof GenerationError?error.code:"unexpected";
  }
  must(startFailure==="generation_start_failed","501 start failure was not normalized");

  let calls=0;
  globalThis.fetch=(async()=>{
    calls++;
    if(calls===1)return new Response(JSON.stringify({jobId:"job-1",statusToken:"status-token-1"}),{status:200,headers:{"content-type":"application/json"}});
    return new Response(JSON.stringify({state:"ready",stage:3}),{status:200,headers:{"content-type":"application/json"}});
  }) as typeof fetch;
  const statuses:string[]=[];
  await runGeneration({mode:"live",brief:{occasion:"Birthday",relationship:"Friend",feeling:"Elegant",format:"Portrait · 5 × 7 in",hasPhoto:false},onStatus:s=>statuses.push(s.state)});
  must(statuses.includes("ready"),"ready live status did not complete");

  calls=0;
  globalThis.fetch=(async()=>{
    calls++;
    if(calls===1)return new Response(JSON.stringify({jobId:"job-failed",statusToken:"status-token-failed"}),{status:200,headers:{"content-type":"application/json"}});
    return new Response(JSON.stringify({state:"failed",error:"provider_internal_detail"}),{status:200,headers:{"content-type":"application/json"}});
  }) as typeof fetch;
  let providerFailure="";
  try{
    await runGeneration({mode:"live",brief:{occasion:"Birthday",relationship:"Friend",feeling:"Elegant",format:"Portrait · 5 × 7 in",hasPhoto:false},onStatus:()=>{}});
  }catch(error){providerFailure=error instanceof GenerationError?error.code:"unexpected";}
  must(providerFailure==="generation_provider_failed","provider failure was not normalized");
  must(providerFailure!=="provider_internal_detail","provider internal error leaked through client contract");

  let cancelCalls=0;
  globalThis.fetch=(async(_url,init)=>{
    if(init?.method==="DELETE"){
      cancelCalls++;
      must(new Headers(init.headers).has("idempotency-key"),"lost-start cancellation must use idempotency key");
      return new Response(JSON.stringify({state:"failed",error:"generation_cancelled"}),{status:200,headers:{"content-type":"application/json"}});
    }
    return new Response(JSON.stringify({}),{status:200,headers:{"content-type":"application/json"}});
  }) as typeof fetch;
  let lostStart="";
  try{await runGeneration({mode:"live",brief:{occasion:"Birthday",relationship:"Friend",feeling:"Elegant",format:"Portrait · 5 × 7 in",locale:"en",hasPhoto:false},onStatus:()=>{},sessionCapability:"fixture"});}
  catch(error){lostStart=error instanceof GenerationError?error.code:"unexpected";}
  must(lostStart==="generation_job_missing","lost POST response was not normalized");
  must(cancelCalls===1,"lost POST response did not trigger bounded idempotency cancellation");

  const controller=new AbortController();
  controller.abort();
  let abortName="";
  try{
    await runGeneration({mode:"live",brief:{occasion:"Birthday",relationship:"Friend",feeling:"Elegant",format:"Portrait · 5 × 7 in",hasPhoto:false},onStatus:()=>{},signal:controller.signal});
  }catch(error){abortName=error instanceof Error?error.name:"unknown";}
  must(abortName==="AbortError","user abort must remain AbortError");

  const duringSleep=new AbortController();
  const abortStarted=performance.now();
  const pending=runGeneration({mode:"mock",brief:{occasion:"Birthday",relationship:"Friend",feeling:"Elegant",format:"Portrait · 5 × 7 in",hasPhoto:false},onStatus:()=>{},signal:duringSleep.signal})
    .then(()=>"completed")
    .catch(error=>error instanceof Error?error.name:"unknown");
  setTimeout(()=>duringSleep.abort(),25);
  const sleepAbort=await pending;
  must(sleepAbort==="AbortError","abort during generation wait must remain AbortError");
  must(performance.now()-abortStarted<300,"abort during generation wait was not prompt");
}finally{
  globalThis.fetch=originalFetch;
}

console.log("generation fallback source + runtime contract: PASS");
}

main().catch((error)=>{ console.error(error); process.exit(1); });

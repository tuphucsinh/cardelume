import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

function need(value,message){if(!value)throw new Error(message);}
const read=(p)=>readFileSync(p,"utf8");
const proxy=read("apps/web/proxy.ts");
const generationServer=read("apps/web/lib/generation.server.ts");
const tokenSource=read("apps/web/lib/generation-token.server.ts");
const generationDb=read("packages/db/src/generation.ts");
const worker=read("apps/worker/src/index.ts");
const ai=read("packages/ai/src/index.ts");
const nextConfig=read("apps/web/next.config.ts");
const env=read(".env.example");

need(proxy.includes("UUID_RE")&&proxy.includes("validExistingAnon")&&proxy.includes("if(!validExistingAnon)"),"invalid anonymous cookie is not rotated");
need(generationServer.includes('from "./generation-token.server"'),"generation status token module not wired");
need(tokenSource.includes("GENERATION_STATUS_TTL_MINUTES")&&tokenSource.includes("expiresAt")&&tokenSource.includes("timingSafeEqual"),"expiring generation capability missing");
need(generationDb.includes("cleanupCompletedGenerationJobs")&&generationDb.includes("delete from generation_jobs")&&generationDb.includes("status in ('ready','failed')"),"generation retention cleanup missing");
need(worker.includes("cleanupCompletedGenerationJobs")&&worker.includes("GENERATION_RESULT_RETENTION_DAYS"),"generation retention cleanup not scheduled");
need(ai.includes("AI_MAX_RESPONSE_BYTES")&&ai.includes("ai_provider_response_too_large")&&ai.includes('response.headers.get("content-length")'),"AI response-size guard missing");
need(nextConfig.includes("Strict-Transport-Security")&&nextConfig.includes("max-age=31536000"),"HSTS header missing");
need(env.includes("GENERATION_STATUS_TTL_MINUTES=15")&&env.includes("GENERATION_RESULT_RETENTION_DAYS=7")&&env.includes("AI_MAX_RESPONSE_BYTES=65536"),"security/retention env defaults missing");

process.env.GENERATION_STATUS_SECRET="0123456789abcdef0123456789abcdef";
process.env.APP_MODE="live";
process.env.GENERATION_STATUS_TTL_MINUTES="15";
const tokenModule=await import(pathToFileURL(path.resolve("apps/web/lib/generation-token.server.ts")).href);
const job="11111111-1111-4111-8111-111111111111",user="22222222-2222-4222-8222-222222222222",now=1700000000000;
const token=tokenModule.issueGenerationStatusToken(job,user,now);
need(tokenModule.verifyGenerationStatusToken(token,job,user,now),"valid generation status token rejected");
need(!tokenModule.verifyGenerationStatusToken(token,job,"33333333-3333-4333-8333-333333333333",now),"cross-owner generation token accepted");
need(!tokenModule.verifyGenerationStatusToken(token,job,user,now+16*60*1000),"expired generation token accepted");
const [expiry,sig]=token.split("."),last=sig.endsWith("A")?"B":"A";
need(!tokenModule.verifyGenerationStatusToken(`${expiry}.${sig.slice(0,-1)}${last}`,job,user,now),"tampered generation token accepted");
console.log("launch security/retention stress: PASS");

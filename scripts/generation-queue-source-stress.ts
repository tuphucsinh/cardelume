import { readFileSync,existsSync } from "node:fs";
const api=readFileSync("apps/web/app/api/generate/route.ts","utf8");
const status=readFileSync("apps/web/app/api/generate/[jobId]/route.ts","utf8");
const server=readFileSync("apps/web/lib/generation.server.ts","utf8");
const worker=readFileSync("apps/worker/src/index.ts","utf8");
const ai=readFileSync("packages/ai/src/index.ts","utf8");
function need(v:boolean,m:string){if(!v)throw new Error(m);}
need(api.includes("verifyPricingQuote"),"generation session capability missing");
need(api.includes("createAndEnqueueGeneration"),"durable generation enqueue missing");
need(status.includes("verifyGenerationStatusToken"),"status capability missing");
need(server.includes("createDurableGenerationJob"),"durable job persistence missing");
need(server.includes("singletonSeconds"),"queue idempotency missing");
need(worker.includes("claimGenerationJob")&&worker.includes("completeGenerationJob"),"worker persistence lifecycle missing");
need(worker.includes("generateCreativeDirectorDirections")&&worker.includes("buildCreativeCandidatePack"),"production creative director missing");
need(ai.includes("ai_provider_mock_forbidden"),"live mock fail-closed guard missing");
need(ai.includes("response_format:{type:\"json_object\"}"),"structured JSON request missing");
need(!existsSync("apps/web/app/api/cards/generate/route.ts"),"stale duplicate 501 generation route remains");
need(!api.includes("501")&&!status.includes("501"),"generation 501 remains");
console.log("generation queue source stress: PASS");

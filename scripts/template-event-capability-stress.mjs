import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const source=readFileSync("apps/web/lib/template-event-token.server.ts","utf8").replace(/^import "server-only";\s*/m,"");
const target=join(tmpdir(),`cardelume-template-event-${process.pid}.ts`);
const harness=`\nprocess.env.TEMPLATE_EVENT_SECRET="0123456789abcdef0123456789abcdef";\nconst input={templateId:"10000000-0000-4000-8000-000000000001",templateVersionId:"30000000-0000-4000-8000-000000000001",source:"recommended",rankPosition:1,market:"VN",locale:"vi",anonymousId:"11111111-1111-4111-8111-111111111111"} as const;\nconst token=issueTemplateEventToken(input,60);\nif(!verifyTemplateEventToken(token,input))throw new Error("valid_token_rejected");\nif(verifyTemplateEventToken(token,{...input,rankPosition:2}))throw new Error("rank_tamper_accepted");\nif(verifyTemplateEventToken(token,{...input,source:"market_pick"}))throw new Error("source_tamper_accepted");\nif(verifyTemplateEventToken(token,{...input,market:"JP"}))throw new Error("market_tamper_accepted");\nif(verifyTemplateEventToken(token,{...input,locale:"ja"}))throw new Error("locale_tamper_accepted");
if(verifyTemplateEventToken(token,{...input,anonymousId:"22222222-2222-4222-8222-222222222222"}))throw new Error("anon_tamper_accepted");
const d1=templateEventDedupeKey(token,input.anonymousId,"impression");const d2=templateEventDedupeKey(token,input.anonymousId,"impression");if(d1!==d2)throw new Error("dedupe_not_deterministic");if(d1===templateEventDedupeKey(token,input.anonymousId,"selected"))throw new Error("dedupe_event_type_collision");\nif(verifyTemplateEventToken(token.slice(0,-2)+"aa",input))throw new Error("signature_tamper_accepted");\nconst now=Date.now;Date.now=()=>now()+61_000;if(verifyTemplateEventToken(token,input))throw new Error("expired_token_accepted");Date.now=now;\nconsole.log("template event capability runtime: PASS");\n`;
writeFileSync(target,source+harness);
try{
  const run=spawnSync(process.execPath,["--experimental-strip-types",target],{encoding:"utf8",env:{...process.env,NODE_ENV:"development"}});
  if(run.stdout)process.stdout.write(run.stdout);
  if(run.stderr)process.stderr.write(run.stderr);
  if(run.status!==0)process.exit(run.status??1);
}finally{try{unlinkSync(target)}catch{}}

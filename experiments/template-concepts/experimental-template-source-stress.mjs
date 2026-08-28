import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { experimentalTemplateIds, experimentalTemplateSvg } from "./experimental-template-art.mjs";
const here=path.dirname(new URL(import.meta.url).pathname);
const concepts=JSON.parse(fs.readFileSync(path.join(here,"TEMPLATE_CONCEPTS_V2.json"),"utf8"));
const conceptIds=new Set(concepts.concepts.map((x)=>x.id));
let checks=0;
function ok(v,msg){assert.ok(v,msg);checks++;}
ok(concepts.status==="EXPERIMENT_ONLY","concept registry must stay experiment-only");
ok(experimentalTemplateIds.length===12,"expected twelve implemented POCs");
for(const id of experimentalTemplateIds){
  ok(conceptIds.has(id),`implemented POC must exist in concept registry: ${id}`);
  const svg=experimentalTemplateSvg({templateId:id,recipient:"Mai",headline:"Cảm ơn vì luôn ở đây",body:"A small message.",date:"28 · 08 · 2026"});
  ok(svg.startsWith("<svg"),`${id}: must render SVG`);
  ok(!/<image\b/i.test(svg),`${id}: source POC cannot embed external image assets`);
  ok(!/https?:\/\//i.test(svg.replace("http://www.w3.org/2000/svg","")),`${id}: SVG cannot reference remote URLs`);
  ok(!/(etsy|pinterest|minted|hallmark|papier|canva)/i.test(svg),`${id}: no competitor/reference identifiers in output`);
}
const src=fs.readFileSync(path.join(here,"experimental-template-art.mjs"),"utf8");
ok(!/from\s+["'][^"']*(etsy|pinterest|minted|hallmark|papier|canva)/i.test(src),"no competitor module/import source");
ok(!/fetch\s*\(/.test(src),"POC renderer must not fetch external assets");
let threw=false;try{experimentalTemplateSvg({templateId:"unknown"});}catch{threw=true;}ok(threw,"unknown experimental template must fail closed");
console.log(`PASS: ${checks} experimental-template source checks`);

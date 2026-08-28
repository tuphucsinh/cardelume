#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,"..");
const goldenPath=path.join(root,"benchmarks/premium/golden-set-v1.json");

function die(message){console.error(message);process.exitCode=1;}
function readJson(file){return JSON.parse(fs.readFileSync(file,"utf8"));}
function readJsonl(file){return fs.readFileSync(file,"utf8").split(/\r?\n/).filter(Boolean).map((line,index)=>{try{return JSON.parse(line);}catch{throw new Error(`invalid_jsonl_line_${index+1}`);}});}
function pct(values,p){if(!values.length)return null;const s=[...values].sort((a,b)=>a-b);const i=Math.min(s.length-1,Math.max(0,Math.ceil(p*s.length)-1));return s[i];}
function mean(values){return values.length?values.reduce((a,b)=>a+b,0)/values.length:null;}
function stddev(values){if(!values.length)return null;const m=mean(values);return Math.sqrt(values.reduce((n,v)=>n+(v-m)**2,0)/values.length);}
function round(n,d=3){return n==null?null:Number(n.toFixed(d));}
function countBy(values,keyFn=x=>x){const m=new Map();for(const v of values){const k=keyFn(v);if(k==null||k==="")continue;m.set(k,(m.get(k)||0)+1);}return [...m.entries()].sort((a,b)=>b[1]-a[1]);}
function share(count,total){return total?count/total:0;}
function words(value){return String(value||"").toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim().split(/\s+/).filter(Boolean);}
function jaccardSets(a,b){const aa=new Set(a),bb=new Set(b);if(!aa.size&&!bb.size)return 0;let common=0;for(const x of aa)if(bb.has(x))common++;return common/(aa.size+bb.size-common);}
function archetype(d){const v=d?.visualDirection||"unknown";if(d?.photoMode==="required"||v==="photo")return"photo";if(["midnight","deco","quietnoir","celestial"].includes(v))return"midnight";if(["minimal","letterpress"].includes(v))return"quiet";return"editorial";}
function copyShape(d){const bucket=n=>n<28?"s":n<75?"m":"l";return `${bucket(String(d?.kicker||"").length)}-${bucket(String(d?.headline||"").length)}-${bucket(String(d?.body||"").length)}`;}
function csvEscape(v){const s=String(v??"");return /[",\n]/.test(s)?`"${s.replaceAll('"','""')}"`:s;}
function parseCsv(text){
  const rows=[];let row=[],cell="",quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(quoted){if(ch==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(ch==='"')quoted=false;else cell+=ch;}
    else if(ch==='"')quoted=true;else if(ch===','){row.push(cell);cell="";}else if(ch==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell="";}else cell+=ch;
  }
  if(cell.length||row.length){row.push(cell);rows.push(row);}
  if(!rows.length)return[];const headers=rows[0];return rows.slice(1).filter(r=>r.some(x=>x!=="")).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??""])));
}

function validateGolden(){
  const doc=readJson(goldenPath),briefs=doc.briefs||[];
  const requiredLocales=["en","vi","ja","ko","zh-CN","es","fr","de","pt-BR","it"];
  const requiredOccasions=["birthday","anniversary","thank-you","congratulations"];
  const requiredDifficulty=["easy","ambiguous","emotional","typography","market-prior-conflict","photo-veto","repeat-user"];
  const requiredPressure=["short","medium","long"];
  const requiredPhoto=["none","optional","required"];
  const errors=[];
  if(briefs.length<120)errors.push(`brief_count_${briefs.length}_lt_120`);
  for(const locale of requiredLocales)if(!briefs.some(b=>b.locale===locale))errors.push(`missing_locale_${locale}`);
  for(const x of requiredOccasions)if(!briefs.some(b=>b.occasion===x))errors.push(`missing_occasion_${x}`);
  for(const x of requiredDifficulty)if(!briefs.some(b=>b.difficulty===x))errors.push(`missing_difficulty_${x}`);
  for(const x of requiredPressure)if(!briefs.some(b=>b.textPressure===x))errors.push(`missing_text_pressure_${x}`);
  for(const x of requiredPhoto)if(!briefs.some(b=>b.photoMode===x))errors.push(`missing_photo_mode_${x}`);
  if(!briefs.some(b=>b.photoProfile?.fixture==="synthetic-excellent-portrait"))errors.push("missing_photo_fixture_excellent");
  if(!briefs.some(b=>b.photoProfile?.fixture==="synthetic-busy-photo"))errors.push("missing_photo_fixture_busy");
  if(!briefs.some(b=>b.photoProfile?.fixture==="synthetic-dark-photo"))errors.push("missing_photo_fixture_dark");
  if(!briefs.some(b=>b.photoProfile?.fixture==="synthetic-imperfect-usable"))errors.push("missing_photo_fixture_imperfect");
  if(!briefs.every(b=>b.referenceSafety==="synthetic-no-customer-data"))errors.push("non_synthetic_reference_safety_marker");
  const repeated=countBy(briefs.filter(b=>b.repeatIdentity),b=>b.repeatIdentity);
  if(repeated.length<requiredLocales.length||repeated.some(([,n])=>n<3))errors.push("repeat_user_sequences_incomplete");
  const ids=new Set();for(const b of briefs){if(ids.has(b.id))errors.push(`duplicate_id_${b.id}`);ids.add(b.id);if((b.detail||"").length>180)errors.push(`detail_too_long_${b.id}`);}
  const summary={version:doc.version,briefs:briefs.length,locales:countBy(briefs,b=>b.locale),markets:countBy(briefs,b=>b.market),scripts:countBy(briefs,b=>b.script),occasions:countBy(briefs,b=>b.occasion),photoModes:countBy(briefs,b=>b.photoMode),textPressure:countBy(briefs,b=>b.textPressure),difficulty:countBy(briefs,b=>b.difficulty)};
  console.log(JSON.stringify({ok:errors.length===0,errors,summary},null,2));
  if(errors.length)process.exitCode=1;
}

function reviewSheet(runFile,outFile){
  const rows=readJsonl(runFile).filter(r=>r.status==="success"&&Array.isArray(r.result?.directions));
  const headers=["benchmark_run_id","brief_id","repeat","locale","market","direction_index","direction_id","template_id","template_version_id","template_name","family_id","visual_direction","accent_mode","photo_used","creative_thesis","personal_relevance_0_10","emotional_resonance_0_10","premium_art_direction_0_10","originality_0_10","wow_0_10","copy_quality_0_10","visual_copy_harmony_0_10","market_language_naturalness_0_10","critical_rendering_defect_0_1","critical_copyright_defect_0_1","critical_security_defect_0_1","critical_localization_defect_0_1","culturally_inappropriate_0_1","reviewer_preference_rank_1_3","reviewer_notes"];
  const out=[headers.join(",")];
  for(const r of rows){for(let i=0;i<r.result.directions.length;i++){
    const d=r.result.directions[i],m=(r.directionMeta||[])[i]||{};
    const values=[r.benchmarkRunId,r.briefId,r.repeat,r.locale,r.market,i+1,d.id,d.templateId,d.templateVersionId,d.templateName,m.familyId,d.visualDirection,d.accentMode,d.accentMode==="photo"?1:0,d.creativeThesis,"","","","","","","","",0,0,0,0,0,"",""];
    out.push(values.map(csvEscape).join(","));
  }}
  fs.writeFileSync(outFile,out.join("\n")+"\n");console.log(outFile);
}

function reviewSummary(reviewFile){
  if(!reviewFile||!fs.existsSync(reviewFile))return{complete:false,reason:"human_review_file_missing"};
  const rows=parseCsv(fs.readFileSync(reviewFile,"utf8"));
  const scoreKeys=["personal_relevance_0_10","emotional_resonance_0_10","premium_art_direction_0_10","originality_0_10","wow_0_10","copy_quality_0_10","visual_copy_harmony_0_10","market_language_naturalness_0_10"];
  const scored=rows.filter(r=>scoreKeys.every(k=>r[k]!==""&&Number.isFinite(Number(r[k]))));
  if(!scored.length)return{complete:false,reason:"no_completed_human_scores",rows:rows.length};
  const weighted=scored.map(r=>{
    const n=k=>Number(r[k]);
    return n("personal_relevance_0_10")*.20+n("emotional_resonance_0_10")*.20+n("premium_art_direction_0_10")*.20+((n("originality_0_10")+n("wow_0_10"))/2)*.15+n("copy_quality_0_10")*.10+n("visual_copy_harmony_0_10")*.10+n("market_language_naturalness_0_10")*.05;
  });
  const critical=scored.filter(r=>["critical_rendering_defect_0_1","critical_copyright_defect_0_1","critical_security_defect_0_1","critical_localization_defect_0_1","culturally_inappropriate_0_1"].some(k=>Number(r[k])===1));
  const byMarket={};for(const [market] of countBy(scored,r=>r.market)){const subset=scored.filter(r=>r.market===market);const vals=subset.map(r=>{const n=k=>Number(r[k]);return n("personal_relevance_0_10")*.20+n("emotional_resonance_0_10")*.20+n("premium_art_direction_0_10")*.20+((n("originality_0_10")+n("wow_0_10"))/2)*.15+n("copy_quality_0_10")*.10+n("visual_copy_harmony_0_10")*.10+n("market_language_naturalness_0_10")*.05;});byMarket[market]={n:vals.length,median:round(pct(vals,.5)),p10:round(pct(vals,.1)),wowMean:round(mean(subset.map(r=>Number(r.wow_0_10))))};}
  return{complete:scored.length===rows.length&&rows.length>0,scoredRows:scored.length,totalRows:rows.length,medianWeighted:round(pct(weighted,.5)),p10Weighted:round(pct(weighted,.1)),weightedStdDev:round(stddev(weighted)),wowMean:round(mean(scored.map(r=>Number(r.wow_0_10)))),premiumArtDirectionMean:round(mean(scored.map(r=>Number(r.premium_art_direction_0_10)))),originalityMean:round(mean(scored.map(r=>Number(r.originality_0_10)))),reviewerPreferenceRanks:countBy(scored.filter(r=>r.reviewer_preference_rank_1_3!==""),r=>r.reviewer_preference_rank_1_3),criticalFailureRows:critical.length,byMarket};
}

function summarize(runFile,reviewFile,outFile){
  const rows=readJsonl(runFile);if(!rows.length)throw new Error("empty_benchmark_run");
  const ok=rows.filter(r=>r.status==="success"),fail=rows.filter(r=>r.status!=="success");
  const tele=rows.flatMap(r=>r.telemetry||[]).filter(t=>t.success!==false);
  const totalDirections=ok.reduce((n,r)=>n+(r.result?.directions?.length||0),0);
  const familyCounts=countBy(ok.flatMap(r=>r.directionMeta||[]),m=>m.familyId);
  const top3Family=familyCounts.slice(0,3).reduce((n,[,c])=>n+c,0);
  const directions=ok.flatMap(r=>r.result?.directions||[]);
  const visualCounts=countBy(directions,d=>d.visualDirection);
  const archetypeCounts=countBy(directions,d=>archetype(d));
  const accentCounts=countBy(directions,d=>d.accentMode);
  const thesisPatterns=countBy(directions,d=>words(d.creativeThesis).slice(0,6).join(" "));
  const copyShapes=countBy(directions,d=>copyShape(d));
  const byBrief=new Map();for(const r of ok){const a=byBrief.get(r.briefId)||[];a.push(r);byBrief.set(r.briefId,a);}
  const crossRun=[];for(const runs of byBrief.values()){for(let i=0;i<runs.length;i++)for(let j=i+1;j<runs.length;j++){const a=(runs[i].result?.directions||[]).map(d=>`${d.templateId}:${d.templateVersionId}`),b=(runs[j].result?.directions||[]).map(d=>`${d.templateId}:${d.templateVersionId}`);crossRun.push(jaccardSets(a,b));}}
  const repeatRows=ok.filter(r=>r.repeatIdentity).sort((a,b)=>String(a.repeatIdentity).localeCompare(String(b.repeatIdentity))||(a.sequenceIndex||0)-(b.sequenceIndex||0)||a.repeat-b.repeat);let repeatPairs=0,repeatSameFamily=0;const lastFamily=new Map();for(const r of repeatRows){const family=r.directionMeta?.[0]?.familyId;if(!family)continue;const prior=lastFamily.get(r.repeatIdentity);if(prior){repeatPairs++;if(prior===family)repeatSameFamily++;}lastFamily.set(r.repeatIdentity,family);}
  const photoEligible=rows.filter(r=>r.hasPhoto),photoUsed=photoEligible.filter(r=>r.status==="success"&&r.result?.directions?.some(d=>d.accentMode==="photo"));
  const tokensIn=tele.reduce((n,t)=>n+(t.inputTokens||0),0),tokensOut=tele.reduce((n,t)=>n+(t.outputTokens||0),0),cost=tele.reduce((n,t)=>n+(t.estimatedCostUsd||0),0);
  const totalLatency=rows.map(r=>r.totalLatencyMs).filter(Number.isFinite);
  const human=reviewSummary(reviewFile);
  let recommendation="REVIEW_REQUIRED";
  if(human.complete){
    if(human.criticalFailureRows>0||human.medianWeighted<7.5||human.p10Weighted<6.5)recommendation="NO-GO";
    else if(human.medianWeighted>=8.5&&human.p10Weighted>=7.5&&fail.length===0)recommendation="GO";
    else recommendation="TUNE";
  }
  const summary={
    benchmarkRunId:rows[0].benchmarkRunId,sourceCommit:rows[0].sourceCommit,configHash:rows[0].configHash,goldenSetVersion:rows[0].goldenSetVersion,provider:rows[0].provider,model:rows[0].model,
    generatedAt:new Date().toISOString(),sample:{records:rows.length,success:ok.length,failures:fail.length,directions:totalDirections,successRate:round(ok.length/rows.length)},
    orchestration:{expandRate:round(rows.filter(r=>r.expanded).length/rows.length),criticRate:round(rows.filter(r=>r.criticUsed).length/rows.length),fallbackRequiredRate:round(rows.filter(r=>r.fallbackRequired).length/rows.length),failureCodes:countBy(fail,r=>r.errorCode)},
    performance:{p50LatencyMs:pct(totalLatency,.5),p95LatencyMs:pct(totalLatency,.95),inputTokens:tokensIn,outputTokens:tokensOut,estimatedCostUsd:round(cost,6),estimatedCostPerGenerationUsd:round(cost/Math.max(1,rows.length),6)},
    creativeConcentration:{topFamilyShare:round(share(familyCounts[0]?.[1]||0,totalDirections)),top3FamilyShare:round(share(top3Family,totalDirections)),families:familyCounts,visualDirections:visualCounts,visualArchetypes:archetypeCounts,accents:accentCounts,topThesisPatternShare:round(share(thesisPatterns[0]?.[1]||0,totalDirections)),topThesisPatterns:thesisPatterns.slice(0,10),topCopyShapeShare:round(share(copyShapes[0]?.[1]||0,totalDirections)),copyShapes,meanCrossRunTemplateSetSimilarity:round(mean(crossRun)),repeatCustomerSameLeadFamilyRate:round(repeatSameFamily/Math.max(1,repeatPairs)),photoEligible:photoEligible.length,photoUsed:photoUsed.length,photoVetoOrUnused:photoEligible.length-photoUsed.length},
    humanReview:human,
    recommendation
  };
  const text=JSON.stringify(summary,null,2)+"\n";if(outFile)fs.writeFileSync(outFile,text);else process.stdout.write(text);
}

function compare(files){
  const items=files.map(f=>readJson(f));
  const rows=items.map(s=>({model:s.model,provider:s.provider,run:s.benchmarkRunId,recommendation:s.recommendation,medianPremium:s.humanReview?.medianWeighted??null,p10Premium:s.humanReview?.p10Weighted??null,qualityStdDev:s.humanReview?.weightedStdDev??null,wowMean:s.humanReview?.wowMean??null,successRate:s.sample?.successRate??null,criticRate:s.orchestration?.criticRate??null,expandRate:s.orchestration?.expandRate??null,fallbackRate:s.orchestration?.fallbackRequiredRate??null,p50Ms:s.performance?.p50LatencyMs??null,p95Ms:s.performance?.p95LatencyMs??null,costPerGenerationUsd:s.performance?.estimatedCostPerGenerationUsd??null}));
  console.log(JSON.stringify({comparison:rows,rule:"Choose the lowest cost/latency model that does not materially compromise the premium floor; meaningful WOW advantage wins."},null,2));
}

const [cmd,...args]=process.argv.slice(2);
try{
  if(cmd==="validate")validateGolden();
  else if(cmd==="review-sheet"){
    if(!args[0])throw new Error("usage: review-sheet <run.jsonl> [review.csv]");reviewSheet(path.resolve(args[0]),path.resolve(args[1]||args[0].replace(/\.jsonl$/,".review.csv")));
  }else if(cmd==="summarize"){
    if(!args[0])throw new Error("usage: summarize <run.jsonl> [review.csv] [summary.json]");summarize(path.resolve(args[0]),args[1]?path.resolve(args[1]):undefined,args[2]?path.resolve(args[2]):undefined);
  }else if(cmd==="compare"){
    if(args.length<2)throw new Error("usage: compare <summary-a.json> <summary-b.json> [...]");compare(args.map(x=>path.resolve(x)));
  }else throw new Error("commands: validate | review-sheet | summarize | compare");
}catch(error){die(error instanceof Error?error.message:String(error));}

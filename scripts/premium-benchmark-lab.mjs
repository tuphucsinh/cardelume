#!/usr/bin/env node
import crypto from "node:crypto";
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

function deriveStratifiedSubset(briefs,minCount=30){
  if(!Array.isArray(briefs)||!briefs.length)throw new Error("golden_briefs_empty_or_invalid");
  const requiredLocales=["en","vi","ja","ko","zh-CN","es","fr","de","pt-BR","it"];
  const requiredOccasions=["birthday","anniversary","thank-you","congratulations"];
  const requiredPressure=["short","medium","long"];
  const requiredPhoto=["none","optional","required"];

  const byLocale=new Map();
  for(const b of briefs){
    if(!b.id||!b.locale)continue;
    const list=byLocale.get(b.locale)||[];
    list.push(b);
    byLocale.set(b.locale,list);
  }

  for(const loc of requiredLocales){
    if(!byLocale.has(loc)||!byLocale.get(loc).length)throw new Error(`protocol_stratification_missing_locale_${loc}`);
  }

  const perLocaleCount=Math.max(3,Math.ceil(minCount/requiredLocales.length));
  const selected=new Set();
  const occCounts=Object.fromEntries(requiredOccasions.map(k=>[k,0]));
  const pressCounts=Object.fromEntries(requiredPressure.map(k=>[k,0]));
  const photoCounts=Object.fromEntries(requiredPhoto.map(k=>[k,0]));

  for(const loc of requiredLocales){
    const localeBriefs=[...(byLocale.get(loc)||[])].sort((a,b)=>a.id.localeCompare(b.id));
    const pickedForLocale=[];

    for(let round=0;round<perLocaleCount;round++){
      const candidates=localeBriefs.filter(b=>!selected.has(b.id)&&!pickedForLocale.includes(b));
      if(!candidates.length)break;

      let bestCandidate=candidates[0];
      let bestScore=-Infinity;

      for(const cand of candidates){
        const occC=occCounts[cand.occasion]??0;
        const pressC=pressCounts[cand.textPressure]??0;
        const photoC=photoCounts[cand.photoMode]??0;
        const score=(100-occC*10)+(100-pressC*10)+(100-photoC*10);
        if(score>bestScore){bestScore=score;bestCandidate=cand;}
      }

      pickedForLocale.push(bestCandidate);
      selected.add(bestCandidate.id);
      if(bestCandidate.occasion in occCounts)occCounts[bestCandidate.occasion]++;
      if(bestCandidate.textPressure in pressCounts)pressCounts[bestCandidate.textPressure]++;
      if(bestCandidate.photoMode in photoCounts)photoCounts[bestCandidate.photoMode]++;
    }
  }

  const subsetBriefIds=[...selected].sort((a,b)=>a.localeCompare(b));
  if(subsetBriefIds.length<minCount)throw new Error(`protocol_stratification_count_insufficient_${subsetBriefIds.length}_lt_${minCount}`);

  const subsetBriefs=briefs.filter(b=>selected.has(b.id));
  for(const loc of requiredLocales)if(!subsetBriefs.some(b=>b.locale===loc))throw new Error(`protocol_stratification_missing_locale_${loc}`);
  for(const occ of requiredOccasions)if(!subsetBriefs.some(b=>b.occasion===occ))throw new Error(`protocol_stratification_missing_occasion_${occ}`);
  for(const p of requiredPressure)if(!subsetBriefs.some(b=>b.textPressure===p))throw new Error(`protocol_stratification_missing_pressure_${p}`);
  for(const ph of requiredPhoto)if(!subsetBriefs.some(b=>b.photoMode===ph))throw new Error(`protocol_stratification_missing_photo_${ph}`);

  return subsetBriefIds;
}

const PROTOCOL_GOVERNANCE_CONTRACT={
  humanReviewRequired:true,
  minimumIndependentRaters:5,
  blindReviewRequired:true,
  ownerScoringProhibited:true,
  realModelRequired:true
};
const PROTOCOL_STATUS_FROZEN="FROZEN_PENDING_SEALED_EVIDENCE";
const PROTOCOL_FROZEN_NOTE="Protocol frozen before model execution and output inspection. Rater roster and conflict declarations remain pending independent assignment.";

function canonicalProtocolPayload(p){
  return {
    goldenSetVersion:p.goldenSetVersion,
    goldenSetSha256:p.goldenSetSha256,
    goldenSetBriefCount:p.goldenSetBriefCount,
    rubricVersion:p.rubricVersion,
    scoreDimensions:p.scoreDimensions,
    criticalDefectFlags:p.criticalDefectFlags,
    subsetBriefIds:p.subsetBriefIds,
    subsetStratification:p.subsetStratification,
    raterRosterStatus:p.raterRosterStatus,
    raterRosterHash:p.raterRosterHash,
    conflictPolicyStatus:p.conflictPolicyStatus,
    conflictPolicyHash:p.conflictPolicyHash,
    referenceStimuliManifest:p.referenceStimuliManifest,
    referenceStimuliManifestSha256:p.referenceStimuliManifestSha256,
    sealedOutputLocation:p.sealedOutputLocation,
    status:p.status,
    governance:p.governance,
    note:p.note
  };
}

function hashProtocolPayload(payload){
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function parseFreezeArgs(args){
  let outPath=null;
  for(let i=0;i<args.length;i++){
    const a=args[i];
    if(a==="--out"&&args[i+1]){outPath=args[i+1];i++;}
    else if(a.startsWith("--out=")){outPath=a.slice(6);}
    else if(!a.startsWith("--")&&!outPath){outPath=a;}
  }
  if(!outPath)throw new Error("usage: freeze-protocol --out <absolute-artifact-path>");
  return outPath;
}

function freezeProtocol(outPath){
  if(!outPath)throw new Error("usage: freeze-protocol --out <absolute-artifact-path>");
  if(!path.isAbsolute(outPath))throw new Error(`protocol_out_must_be_absolute_path: ${outPath}`);
  const resolvedOut=path.resolve(outPath);
  const repoRoot=path.resolve(root);
  if(resolvedOut===repoRoot||resolvedOut.startsWith(repoRoot+path.sep))throw new Error(`protocol_out_must_not_be_inside_repository: ${outPath}`);
  if(fs.existsSync(resolvedOut))throw new Error(`protocol_file_already_exists: ${outPath}`);

  const goldenBytes=fs.readFileSync(goldenPath);
  const goldenDoc=JSON.parse(goldenBytes.toString("utf8"));
  const briefs=goldenDoc.briefs||[];
  const goldenSha=crypto.createHash("sha256").update(goldenBytes).digest("hex");

  const subsetBriefIds=deriveStratifiedSubset(briefs,30);

  const refManifestRel=".ai/evidence/premium-reference-stimuli.json";
  const refManifestAbs=path.join(root,refManifestRel);
  if(!fs.existsSync(refManifestAbs))throw new Error("reference_stimuli_manifest_missing");
  const refBytes=fs.readFileSync(refManifestAbs);
  const refSha=crypto.createHash("sha256").update(refBytes).digest("hex");
  const refDoc=JSON.parse(refBytes.toString("utf8"));
  if(refDoc.status!=="SOURCE_ONLY_REFERENCE_SAFE")throw new Error("reference_stimuli_status_invalid");

  const rubricVersion="1.0.0";
  const scoreDimensions=["personal_relevance_0_10","emotional_resonance_0_10","premium_art_direction_0_10","originality_0_10","wow_0_10","copy_quality_0_10","visual_copy_harmony_0_10","market_language_naturalness_0_10"];
  const criticalDefectFlags=["critical_rendering_defect_0_1","critical_copyright_defect_0_1","critical_security_defect_0_1","critical_localization_defect_0_1","culturally_inappropriate_0_1"];

  const raterRosterStatus="PENDING_INDEPENDENT_DECLARATION";
  const raterRosterHash=crypto.createHash("sha256").update("PENDING_INDEPENDENT_HUMAN_RATER_ROSTER_V1").digest("hex");
  const conflictPolicyStatus="PENDING_INDEPENDENT_DECLARATION";
  const conflictPolicyHash=crypto.createHash("sha256").update("INDEPENDENT_RATER_NO_CONFLICT_POLICY_V1").digest("hex");

  const subsetBriefs=briefs.filter(b=>subsetBriefIds.includes(b.id));
  const subsetStratification={
    totalCount:subsetBriefIds.length,
    locales:countBy(subsetBriefs,b=>b.locale),
    occasions:countBy(subsetBriefs,b=>b.occasion),
    textPressure:countBy(subsetBriefs,b=>b.textPressure),
    photoModes:countBy(subsetBriefs,b=>b.photoMode),
    difficulties:countBy(subsetBriefs,b=>b.difficulty)
  };

  const payload=canonicalProtocolPayload({
    goldenSetVersion:goldenDoc.version||"1.0.0",
    goldenSetSha256:goldenSha,
    goldenSetBriefCount:briefs.length,
    rubricVersion,
    scoreDimensions,
    criticalDefectFlags,
    subsetBriefIds,
    subsetStratification,
    raterRosterStatus,
    raterRosterHash,
    conflictPolicyStatus,
    conflictPolicyHash,
    referenceStimuliManifest:refManifestRel,
    referenceStimuliManifestSha256:refSha,
    sealedOutputLocation:resolvedOut,
    status:PROTOCOL_STATUS_FROZEN,
    governance:PROTOCOL_GOVERNANCE_CONTRACT,
    note:PROTOCOL_FROZEN_NOTE
  });
  const protocolHash=hashProtocolPayload(payload);

  const protocol={
    ...payload,
    protocolHash
  };

  fs.mkdirSync(path.dirname(resolvedOut),{recursive:true});
  fs.writeFileSync(resolvedOut,JSON.stringify(protocol,null,2)+"\n","utf8");
  console.log(JSON.stringify({ok:true,protocolHash,sealedOutputLocation:resolvedOut,subsetSize:subsetBriefIds.length},null,2));
  return protocol;
}

function validateFrozenPremiumProtocol(protocolFile){
  if(!protocolFile)throw new Error("usage: validate-protocol <protocol.json>");
  const resolvedPath=path.resolve(protocolFile);
  if(!fs.existsSync(resolvedPath))throw new Error(`protocol_file_not_found: ${protocolFile}`);
  const protocol=readJson(resolvedPath);

  if(!protocol.sealedOutputLocation||!path.isAbsolute(protocol.sealedOutputLocation))throw new Error("protocol_sealed_output_location_invalid");
  const repoRoot=path.resolve(root);
  if(protocol.sealedOutputLocation===repoRoot||protocol.sealedOutputLocation.startsWith(repoRoot+path.sep))throw new Error("protocol_sealed_output_inside_repo");

  if(protocol.goldenSetVersion!=="1.0.0")throw new Error(`invalid_golden_version: ${protocol.goldenSetVersion}`);
  const goldenBytes=fs.readFileSync(goldenPath);
  const actualGoldenSha=crypto.createHash("sha256").update(goldenBytes).digest("hex");
  if(protocol.goldenSetSha256!==actualGoldenSha)throw new Error("golden_sha256_mismatch");

  const goldenDoc=JSON.parse(goldenBytes.toString("utf8"));
  const briefs=goldenDoc.briefs||[];
  if(protocol.goldenSetBriefCount!==briefs.length||briefs.length<120)throw new Error("golden_brief_count_mismatch");

  if(protocol.rubricVersion!=="1.0.0")throw new Error("invalid_rubric_version");
  const expectedDims=["personal_relevance_0_10","emotional_resonance_0_10","premium_art_direction_0_10","originality_0_10","wow_0_10","copy_quality_0_10","visual_copy_harmony_0_10","market_language_naturalness_0_10"];
  for(const dim of expectedDims){if(!protocol.scoreDimensions?.includes(dim))throw new Error(`missing_score_dimension_${dim}`);}
  const expectedDefects=["critical_rendering_defect_0_1","critical_copyright_defect_0_1","critical_security_defect_0_1","critical_localization_defect_0_1","culturally_inappropriate_0_1"];
  for(const def of expectedDefects){if(!protocol.criticalDefectFlags?.includes(def))throw new Error(`missing_defect_flag_${def}`);}

  if(!Array.isArray(protocol.subsetBriefIds)||protocol.subsetBriefIds.length<30)throw new Error("subset_brief_ids_lt_30");
  const briefMap=new Map(briefs.map(b=>[b.id,b]));
  const seenIds=new Set();
  for(const id of protocol.subsetBriefIds){
    if(!briefMap.has(id))throw new Error(`subset_unknown_brief_id_${id}`);
    if(seenIds.has(id))throw new Error(`subset_duplicate_brief_id_${id}`);
    seenIds.add(id);
  }
  const subsetBriefs=briefs.filter(b=>protocol.subsetBriefIds.includes(b.id));
  const requiredLocales=["en","vi","ja","ko","zh-CN","es","fr","de","pt-BR","it"];
  for(const loc of requiredLocales){if(!subsetBriefs.some(b=>b.locale===loc))throw new Error(`subset_missing_locale_${loc}`);}
  for(const occ of ["birthday","anniversary","thank-you","congratulations"]){if(!subsetBriefs.some(b=>b.occasion===occ))throw new Error(`subset_missing_occasion_${occ}`);}
  for(const p of ["short","medium","long"]){if(!subsetBriefs.some(b=>b.textPressure===p))throw new Error(`subset_missing_pressure_${p}`);}
  for(const ph of ["none","optional","required"]){if(!subsetBriefs.some(b=>b.photoMode===ph))throw new Error(`subset_missing_photo_${ph}`);}

  const canonicalSubset=deriveStratifiedSubset(briefs,protocol.subsetBriefIds.length);
  if(JSON.stringify(protocol.subsetBriefIds)!==JSON.stringify(canonicalSubset))throw new Error("subset_stratification_non_canonical");

  const expectedStratification={
    totalCount:protocol.subsetBriefIds.length,
    locales:countBy(subsetBriefs,b=>b.locale),
    occasions:countBy(subsetBriefs,b=>b.occasion),
    textPressure:countBy(subsetBriefs,b=>b.textPressure),
    photoModes:countBy(subsetBriefs,b=>b.photoMode),
    difficulties:countBy(subsetBriefs,b=>b.difficulty)
  };
  if(JSON.stringify(protocol.subsetStratification)!==JSON.stringify(expectedStratification))throw new Error("subset_stratification_mismatch");

  if(!protocol.referenceStimuliManifest)throw new Error("missing_reference_stimuli_manifest");
  const refAbs=path.resolve(root,protocol.referenceStimuliManifest);
  if(!fs.existsSync(refAbs))throw new Error(`reference_stimuli_manifest_not_found: ${protocol.referenceStimuliManifest}`);
  const refBytes=fs.readFileSync(refAbs);
  const actualRefSha=crypto.createHash("sha256").update(refBytes).digest("hex");
  if(protocol.referenceStimuliManifestSha256!==actualRefSha)throw new Error("reference_stimuli_manifest_sha_mismatch");
  const refDoc=JSON.parse(refBytes.toString("utf8"));
  if(refDoc.status!=="SOURCE_ONLY_REFERENCE_SAFE")throw new Error("reference_stimuli_status_invalid");
  if(refDoc.summary?.binaryCommitted!==false||refDoc.summary?.customerDataIncluded!==false)throw new Error("reference_stimuli_safety_violation");

  if(protocol.raterRosterStatus!=="PENDING_INDEPENDENT_DECLARATION"||!protocol.raterRosterHash)throw new Error("rater_roster_status_invalid");
  if(protocol.conflictPolicyStatus!=="PENDING_INDEPENDENT_DECLARATION"||!protocol.conflictPolicyHash)throw new Error("conflict_policy_status_invalid");

  if(protocol.status!==PROTOCOL_STATUS_FROZEN)throw new Error("protocol_status_invalid");
  if(!protocol.governance||typeof protocol.governance!=="object")throw new Error("protocol_governance_invalid");
  if(
    protocol.governance.humanReviewRequired!==true||
    protocol.governance.minimumIndependentRaters!==5||
    protocol.governance.blindReviewRequired!==true||
    protocol.governance.ownerScoringProhibited!==true||
    protocol.governance.realModelRequired!==true
  )throw new Error("protocol_governance_contract_violation");
  if(JSON.stringify(protocol.governance)!==JSON.stringify(PROTOCOL_GOVERNANCE_CONTRACT))throw new Error("protocol_governance_mismatch");
  if(protocol.note!==PROTOCOL_FROZEN_NOTE)throw new Error("protocol_note_invalid");

  const payload=canonicalProtocolPayload(protocol);
  const expectedHash=hashProtocolPayload(payload);
  if(protocol.protocolHash!==expectedHash)throw new Error("protocol_hash_integrity_mismatch");

  const out={ok:true,protocolHash:protocol.protocolHash,subsetSize:protocol.subsetBriefIds.length,status:"FROZEN_VALID"};
  console.log(JSON.stringify(out,null,2));
  return out;
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
  else if(cmd==="freeze-protocol"){
    const outPath=parseFreezeArgs(args);
    freezeProtocol(outPath);
  }else if(cmd==="validate-protocol"){
    if(!args[0])throw new Error("usage: validate-protocol <protocol.json>");
    validateFrozenPremiumProtocol(path.resolve(args[0]));
  }else if(cmd==="review-sheet"){
    if(!args[0])throw new Error("usage: review-sheet <run.jsonl> [review.csv]");reviewSheet(path.resolve(args[0]),path.resolve(args[1]||args[0].replace(/\.jsonl$/,".review.csv")));
  }else if(cmd==="summarize"){
    if(!args[0])throw new Error("usage: summarize <run.jsonl> [review.csv] [summary.json]");summarize(path.resolve(args[0]),args[1]?path.resolve(args[1]):undefined,args[2]?path.resolve(args[2]):undefined);
  }else if(cmd==="compare"){
    if(args.length<2)throw new Error("usage: compare <summary-a.json> <summary-b.json> [...]");compare(args.map(x=>path.resolve(x)));
  }else throw new Error("commands: validate | freeze-protocol | validate-protocol | review-sheet | summarize | compare");
}catch(error){die(error instanceof Error?error.message:String(error));}

export {
  validateGolden,
  deriveStratifiedSubset,
  freezeProtocol,
  validateFrozenPremiumProtocol,
  reviewSheet,
  reviewSummary,
  summarize,
  compare
};

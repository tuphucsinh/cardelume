import { GenerationResultSchema, cardCopyMetrics, type GeneratedDirection, type GenerationBrief, type GenerationResult } from "@cardelume/card-schema";
import { templateCreativeRecipe, type RankedTemplate, type RecentStyleFingerprint, type SignatureMove, type CreativeAccentMode } from "@cardelume/templates";

export type AIProviderUsage={inputTokens?:number;outputTokens?:number};
export type AIProviderResponse={data:unknown;provider:string;model:string;usage?:AIProviderUsage;latencyMs:number};
export interface AIProvider{
  readonly providerName:string;
  readonly modelName:string;
  generateJson(input:{system:string;prompt:string;timeoutMs?:number}):Promise<AIProviderResponse>;
}

export type AICallTelemetry={phase:"creative_director"|"expanded_director"|"critic_repair";provider:string;model:string;inputTokens?:number;outputTokens?:number;latencyMs:number;success:boolean;errorCode?:string};
export type CreativeDirectorResult={kind:"ready";result:GenerationResult;telemetry:AICallTelemetry};
export type CreativeExpansionRequest={kind:"expand_pool";reasonCode:string;desiredTraits:string[];telemetry:AICallTelemetry};
export type CreativeDirectorOutcome=CreativeDirectorResult|CreativeExpansionRequest;

const SIGNATURE_MOVES:SignatureMove[]=["recipient_anchor","quiet_opening","isolated_closing_line","keepsake_memory","understated_celebration","editorial_contrast"];
const ACCENTS:CreativeAccentMode[]=["original","photo","navy","sage","rose"];
const RISKS=["low_confidence","low_novelty","low_wow","market_tension","copy_risk","creative_range"] as const;

type FetchLike=typeof fetch;
function required(value:string|undefined,name:string){if(!value)throw new Error(`${name}_required`);return value;}
function timeoutMs(){const n=Number(process.env.AI_REQUEST_TIMEOUT_MS||12000);return Number.isFinite(n)?Math.max(4000,Math.min(30000,Math.floor(n))):12000;}
function maxResponseBytes(){const n=Number(process.env.AI_MAX_RESPONSE_BYTES||65536);return Number.isFinite(n)?Math.max(16384,Math.min(262144,Math.floor(n))):65536;}
function maxCreativePromptBytes(){const n=Number(process.env.AI_CREATIVE_PROMPT_MAX_BYTES||28000);return Number.isFinite(n)?Math.max(12000,Math.min(64000,Math.floor(n))):28000;}
function threshold(name:string,fallback:number){const n=Number(process.env[name]||fallback);return Number.isFinite(n)?Math.max(0,Math.min(1,n)):fallback;}
function wowRepairThreshold(){return threshold("AI_WOW_REPAIR_THRESHOLD",.70);}
function confidenceRepairThreshold(){return threshold("AI_CONFIDENCE_REPAIR_THRESHOLD",.62);}
function noveltyRepairThreshold(){return threshold("AI_NOVELTY_REPAIR_THRESHOLD",.50);}
function assertPromptBudget(prompt:string){if(new TextEncoder().encode(prompt).byteLength>maxCreativePromptBytes())throw new Error("ai_prompt_budget_exceeded");}

export class OpenAICompatibleProvider implements AIProvider{
  readonly providerName="openai-compatible";
  get modelName(){return this.config.model;}
  constructor(private readonly config:{apiKey:string;model:string;baseUrl:string},private readonly fetchImpl:FetchLike=fetch){}
  async generateJson(input:{system:string;prompt:string;timeoutMs?:number}){
    const started=Date.now();const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),input.timeoutMs??timeoutMs());
    try{
      const response=await this.fetchImpl(`${this.config.baseUrl.replace(/\/$/,"")}/chat/completions`,{
        method:"POST",signal:controller.signal,headers:{authorization:`Bearer ${this.config.apiKey}`,"content-type":"application/json"},
        body:JSON.stringify({model:this.config.model,temperature:.78,response_format:{type:"json_object"},messages:[{role:"system",content:input.system},{role:"user",content:input.prompt}]})
      });
      if(!response.ok)throw new Error(`ai_provider_http_${response.status}`);
      const maxBytes=maxResponseBytes();const declared=Number(response.headers.get("content-length")||0);
      if(Number.isFinite(declared)&&declared>maxBytes)throw new Error("ai_provider_response_too_large");
      const rawEnvelope=await response.text();if(new TextEncoder().encode(rawEnvelope).byteLength>maxBytes)throw new Error("ai_provider_response_too_large");
      let envelope:unknown;try{envelope=JSON.parse(rawEnvelope);}catch{throw new Error("ai_provider_invalid_response");}
      if(!envelope||typeof envelope!=="object")throw new Error("ai_provider_invalid_response");
      const e=envelope as {choices?:unknown;usage?:{prompt_tokens?:unknown;completion_tokens?:unknown};model?:unknown};
      if(!Array.isArray(e.choices)||!e.choices[0]||typeof e.choices[0]!=="object")throw new Error("ai_provider_invalid_response");
      const message=(e.choices[0] as {message?:unknown}).message;if(!message||typeof message!=="object")throw new Error("ai_provider_invalid_response");
      const content=(message as {content?:unknown}).content;let text:string|undefined;
      if(typeof content==="string")text=content;else if(Array.isArray(content))text=content.map(part=>part&&typeof part==="object"&&typeof (part as {text?:unknown}).text==="string"?(part as {text:string}).text:"").join("");
      if(!text)throw new Error("ai_provider_empty_content");let data:unknown;try{data=JSON.parse(text);}catch{throw new Error("ai_provider_invalid_json");}
      const inputTokens=typeof e.usage?.prompt_tokens==="number"?e.usage.prompt_tokens:undefined;const outputTokens=typeof e.usage?.completion_tokens==="number"?e.usage.completion_tokens:undefined;
      return{data,provider:this.providerName,model:typeof e.model==="string"?e.model:this.config.model,usage:{inputTokens,outputTokens},latencyMs:Date.now()-started};
    }catch(error){if(error instanceof DOMException&&error.name==="AbortError")throw new Error("ai_provider_timeout");throw error;}finally{clearTimeout(timer);}
  }
}

export class MockAIProvider implements AIProvider{
  readonly providerName="mock";readonly modelName="mock-premium";
  async generateJson(input:{system:string;prompt:string}){const started=Date.now();const ctx=JSON.parse(input.prompt) as {task?:string;slots?:string[];candidates?:Array<{id:string;versionId:string;name:string;photoMode:string;recipe?:{preferredAccents?:string[];signatureMoves?:string[]}}>;directions?:Array<Record<string,unknown>>};
    if(ctx.task==="critic_repair")return{data:{repairs:(ctx.directions??[]).map((d,i)=>({...d,body:`${String(d.body??"")} ${i===0?"With a little more heart.":"Made especially for this moment."}`.trim(),confidence:.91,noveltyScore:.82,wowScore:.86,riskCodes:[]}))},provider:this.providerName,model:this.modelName,usage:{inputTokens:150,outputTokens:90},latencyMs:Date.now()-started};
    const candidates=ctx.candidates??[];const slots=ctx.slots??["editorial","midnight","quiet"];
    return{data:{action:"select",directions:slots.map((slot,i)=>{const c=candidates[i]??candidates[0];return{id:slot,templateId:c?.id,templateVersionId:c?.versionId,creativeThesis:["A refined expression of this exact moment.","A contrasting, cinematic interpretation with warmth.","A fresh keepsake direction that avoids repetition."][i]??"A premium direction.",customerRationale:["Quiet, personal warmth for this exact moment.","A richer contrast for a moment worth celebrating.","A keepsake direction with a more unexpected point of view."][i]??"A thoughtful fit for this moment.",signatureMove:c?.recipe?.signatureMoves?.[0]??"recipient_anchor",accentMode:c?.photoMode==="required"?"photo":c?.recipe?.preferredAccents?.[0]??"original",kicker:["FOR THIS MOMENT","A LITTLE LIGHT","MADE TO REMEMBER"][i]??"JUST FOR YOU",headline:["Something beautiful, just for you.","Here is to what comes next.","A moment worth keeping."][i]??"With warm wishes.",body:["May this day feel as thoughtful, warm, and entirely yours as it deserves to be.","For everything this moment holds — and all the good still waiting just ahead.","A small keepsake for the details, feelings, and memories that make this day yours."][i]??"With warm wishes.",confidence:.92,noveltyScore:.84,wowScore:.86,riskCodes:[]};})},provider:this.providerName,model:this.modelName,usage:{inputTokens:420,outputTokens:260},latencyMs:Date.now()-started};
  }
}

export function createAIProviderFromEnv():AIProvider{
  const name=(process.env.AI_PROVIDER||"mock").toLowerCase();
  if(name==="mock"){if((process.env.APP_MODE==="live"||process.env.NODE_ENV==="production"))throw new Error("ai_provider_mock_forbidden");return new MockAIProvider();}
  if(name==="openai-compatible"||name==="openai")return new OpenAICompatibleProvider({apiKey:required(process.env.AI_API_KEY,"AI_API_KEY"),model:required(process.env.AI_MODEL,"AI_MODEL"),baseUrl:process.env.AI_API_BASE_URL||"https://api.openai.com/v1"});
  throw new Error("ai_provider_unsupported");
}

function expectedDirectionIds(brief:GenerationBrief){return brief.hasPhoto?["editorial","midnight","photo"] as const:["editorial","midnight","quiet"] as const;}
function validateDirectionCopy(direction:GeneratedDirection,brief:GenerationBrief){const metrics=cardCopyMetrics(direction.headline,direction.body,brief.locale,brief.format);if(metrics.hardOverflow)throw new Error("ai_copy_too_dense");if(/<\/?(?:script|style|svg|iframe)\b/i.test(`${direction.kicker} ${direction.headline} ${direction.body}`))throw new Error("ai_markup_rejected");}
function num(value:unknown,fallback=.75){return typeof value==="number"&&Number.isFinite(value)?Math.max(0,Math.min(1,value)):fallback;}
function str(value:unknown,max:number){return typeof value==="string"?value.trim().slice(0,max):"";}
function safeCustomerRationale(value:unknown){
  const text=str(value,140);
  if(!text)return undefined;
  // Customer-visible fit copy is deliberately separate from internal creative reasoning.
  // Fail closed to the UI fallback when provider output contains process/model/ranking jargon,
  // markup, URLs, UUID-like identifiers or score/percentage language.
  const forbidden=/\b(?:ai|model|prompt|system|rank(?:ing)?|score|candidate|template|algorithm|reasoning|chain[- ]of[- ]thought)\b|https?:\/\/|<[^>]*>|\b[0-9a-f]{8}-[0-9a-f-]{27,}\b|\b\d+(?:\.\d+)?%/i;
  return forbidden.test(text)?undefined:text;
}
function arr(value:unknown){return Array.isArray(value)?value:[];}
function telemetry(phase:AICallTelemetry["phase"],response:AIProviderResponse):AICallTelemetry{return{phase,provider:response.provider,model:response.model,inputTokens:response.usage?.inputTokens,outputTokens:response.usage?.outputTokens,latencyMs:response.latencyMs,success:true};}
function candidateContext(candidates:RankedTemplate[]){return candidates.map((item,index)=>({rank:index+1,id:item.template.id,versionId:item.template.versionId,familyId:item.template.familyId,name:item.template.name,visualDirection:item.template.visualDirection,photoMode:item.template.photoMode,materialWorld:item.template.materialWorld,materialCues:item.template.materialCues,energy:item.template.energy,colorWorld:item.template.colorWorld,motionProfile:item.template.motionProfile,score:Number(item.score.toFixed(4)),scoreComponents:Object.fromEntries(Object.entries(item.components).map(([k,v])=>[k,Number(Number(v).toFixed(3))])),reasons:item.reasons,recipe:templateCreativeRecipe(item.template)}));}
function compactRecentStyles(recent:RecentStyleFingerprint[]|undefined){return (recent??[]).slice(0,5).map(s=>({familyId:s.familyId,visualDirection:s.visualDirection,accentMode:s.accentMode??"unknown"}));}

function parseCreativeSelection(raw:unknown,brief:GenerationBrief,candidates:RankedTemplate[]):GenerationResult|{expand:true;reasonCode:string;desiredTraits:string[]}{
  if(!raw||typeof raw!=="object")throw new Error("ai_creative_invalid_response");const o=raw as Record<string,unknown>;
  if(o.action==="expand_pool")return{expand:true,reasonCode:str(o.reasonCode,80)||"insufficient_creative_range",desiredTraits:arr(o.desiredTraits).map(v=>str(v,60)).filter(Boolean).slice(0,6)};
  const rawDirections=arr(o.directions);if(rawDirections.length!==3)throw new Error("ai_direction_count_invalid");
  const byPair=new Map(candidates.map(c=>[`${c.template.id}:${c.template.versionId}`,c]));const expected=[...expectedDirectionIds(brief)];const directions:GeneratedDirection[]=[];const families=new Set<string>();
  for(const slot of expected){const d=rawDirections.find(v=>v&&typeof v==="object"&&(v as Record<string,unknown>).id===slot) as Record<string,unknown>|undefined;if(!d)throw new Error("ai_direction_set_invalid");
    const templateId=str(d.templateId,80),templateVersionId=str(d.templateVersionId,80);const candidate=byPair.get(`${templateId}:${templateVersionId}`);if(!candidate)throw new Error("ai_template_not_in_candidate_pool");if(families.has(candidate.template.familyId))throw new Error("ai_template_family_duplicate");families.add(candidate.template.familyId);
    const recipe=templateCreativeRecipe(candidate.template);let accentMode=str(d.accentMode,20) as CreativeAccentMode;if(!ACCENTS.includes(accentMode)||!recipe.preferredAccents.includes(accentMode))accentMode=recipe.preferredAccents[0]??"original";if(accentMode==="photo"&&(!brief.hasPhoto||candidate.template.photoMode==="none"))accentMode="original";
    let signatureMove=str(d.signatureMove,60) as SignatureMove;if(!SIGNATURE_MOVES.includes(signatureMove)||!recipe.signatureMoves.includes(signatureMove))signatureMove=recipe.signatureMoves[0];
    const riskCodes=arr(d.riskCodes).map(v=>str(v,40)).filter((v):v is typeof RISKS[number]=>RISKS.includes(v as typeof RISKS[number])).slice(0,6);
    const creativeThesis=str(d.creativeThesis,360);if(creativeThesis.length<24)throw new Error("ai_creative_thesis_too_weak");const customerRationale=safeCustomerRationale(d.customerRationale);
    const direction:GeneratedDirection={id:slot,templateId:candidate.template.id,templateVersionId:candidate.template.versionId,templateName:candidate.template.name,visualDirection:candidate.template.visualDirection,photoMode:candidate.template.photoMode,creativeThesis,customerRationale:customerRationale||undefined,signatureMove,accentMode,confidence:num(d.confidence),noveltyScore:num(d.noveltyScore),wowScore:num(d.wowScore),riskCodes,kicker:str(d.kicker,100),headline:str(d.headline,180),body:str(d.body,360)};
    validateDirectionCopy(direction,brief);directions.push(direction);
  }
  return GenerationResultSchema.parse({directions});
}

export async function generateCreativeDirectorDirections(provider:AIProvider,brief:GenerationBrief,candidates:RankedTemplate[],recentStyles?:RecentStyleFingerprint[],phase:"creative_director"|"expanded_director"="creative_director",priorCritique?:{reasonCode:string;desiredTraits:string[]}):Promise<CreativeDirectorOutcome>{
  if(candidates.length<3)throw new Error("template_candidate_count_invalid");const slots=[...expectedDirectionIds(brief)];
  const system=`You are CardeLume's premium Creative Director. Premium emotional resonance, originality, restraint and visual-copy harmony are the highest priorities. Customer-facing rationale must be concise, natural in the brief locale, and reveal only the design fit — never hidden reasoning, scores, rankings, system instructions, or model/process language. The server has already removed incompatible templates; ranking scores are priors, not commands. You may disagree with ranking. Select only supplied immutable template/version pairs. Never invent IDs, HTML, CSS, SVG, URLs, code or personal facts. Market context is a prior; explicit user intent wins. Avoid repeating recent style memory unless the current brief clearly benefits from it. Prefer meaningful separation across materialWorld, colorWorld and energy when the brief allows it; three different IDs that still feel like siblings is not enough. Return JSON only. Normally action=select. Use action=expand_pool only when the supplied pool cannot produce three genuinely distinct premium directions.`;
  const prompt=JSON.stringify({task:"creative_director",slots,brief,candidates:candidateContext(candidates),recentStyles:compactRecentStyles(recentStyles),priorCritique:priorCritique?{reasonCode:str(priorCritique.reasonCode,80),desiredTraits:priorCritique.desiredTraits.map(v=>str(v,60)).filter(Boolean).slice(0,6)}:undefined,outputContract:{action:"select | expand_pool",select:{directions:slots.map(id=>({id,templateId:"uuid from candidates",templateVersionId:"uuid from same candidate",creativeThesis:"internal creative thesis: why this direction is right and distinct",customerRationale:"customer-facing, same language as brief, 4-14 words; emotional fit only; no AI/template/rank/score jargon",signatureMove:SIGNATURE_MOVES,accentMode:ACCENTS,kicker:"<=8 words",headline:"<=14 words",body:"<=45 words",confidence:"0..1",noveltyScore:"0..1",wowScore:"0..1",riskCodes:RISKS}))},expand:{reasonCode:"short code",desiredTraits:["compact traits"]}}});
  assertPromptBudget(prompt);const response=await provider.generateJson({system,prompt,timeoutMs:timeoutMs()});const parsed=parseCreativeSelection(response.data,brief,candidates);if("expand" in parsed)return{kind:"expand_pool",reasonCode:parsed.reasonCode,desiredTraits:parsed.desiredTraits,telemetry:telemetry(phase,response)};return{kind:"ready",result:parsed,telemetry:telemetry(phase,response)};
}

function words(text:string){return new Set(text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").split(/\s+/).filter(Boolean));}
function jaccard(a:string,b:string){const aa=words(a),bb=words(b);if(!aa.size&&!bb.size)return 0;let common=0;for(const w of aa)if(bb.has(w))common++;return common/(aa.size+bb.size-common);}
const CLICHE_PATTERNS=[/on this special day/iu,/wishing you all the best/iu,/may all your dreams come true/iu,/best wishes for a wonderful/iu,/chúc .{0,20} thật nhiều niềm vui/iu,/ngày đặc biệt này/iu,/素敵な一年になりますよう/iu,/행복한 하루 보내/iu];
function occurrenceCount(text:string,needle:string){if(!needle)return 0;let count=0,from=0;const hay=text.toLocaleLowerCase(),n=needle.toLocaleLowerCase();while((from=hay.indexOf(n,from))>=0){count++;from+=Math.max(1,n.length);}return count;}
function directionArchetype(direction:GeneratedDirection){if(direction.photoMode==="required"||direction.visualDirection==="photo")return"photo";if(["midnight","deco","quietnoir","celestial","ledger"].includes(direction.visualDirection??""))return"midnight";if(["minimal","letterpress","whispered","museum","seal"].includes(direction.visualDirection??""))return"quiet";return"editorial";}
export function creativeQualityRisks(result:GenerationResult,brief:GenerationBrief,recentStyles?:RecentStyleFingerprint[]){const risks=new Set<string>();
  for(const d of result.directions){validateDirectionCopy(d,brief);const full=`${d.kicker} ${d.headline} ${d.body}`;const punct=(full.match(/[!！]/g)||[]).length;const clichéHits=CLICHE_PATTERNS.filter(re=>re.test(full)).length;if(punct>2||clichéHits>=2||jaccard(d.headline,d.body)>.72||occurrenceCount(full,brief.recipient??"")>2)risks.add("copy_risk");if((d.confidence??1)<confidenceRepairThreshold())risks.add("low_confidence");if((d.wowScore??1)<wowRepairThreshold())risks.add("low_wow");if((d.noveltyScore??1)<noveltyRepairThreshold()&&recentStyles?.length)risks.add("low_novelty");for(const r of d.riskCodes??[])risks.add(r);}
  const archetypes=new Set(result.directions.map(directionArchetype));const visuals=new Set(result.directions.map(d=>d.visualDirection??"unknown"));if(archetypes.size===1||visuals.size===1)risks.add("creative_range");
  for(let i=0;i<result.directions.length;i++)for(let j=i+1;j<result.directions.length;j++){const a=result.directions[i],b=result.directions[j];if(jaccard(`${a.headline} ${a.body}`,`${b.headline} ${b.body}`)>.62||jaccard(a.creativeThesis??"",b.creativeThesis??"")>.68)risks.add("creative_range");if(a.templateId&&a.templateId===b.templateId)risks.add("creative_range");}
  return [...risks];
}

export async function criticRepairDirections(provider:AIProvider,brief:GenerationBrief,result:GenerationResult,candidates:RankedTemplate[],risks:string[]):Promise<{result:GenerationResult;telemetry:AICallTelemetry}>{
  const allowTemplateSwap=risks.includes("creative_range");
  const riskyIds=new Set(result.directions.filter(d=>(d.riskCodes??[]).length||(d.confidence??1)<confidenceRepairThreshold()||(d.wowScore??1)<wowRepairThreshold()||((d.noveltyScore??1)<noveltyRepairThreshold())).map(d=>d.id));if(allowTemplateSwap||risks.includes("copy_risk"))for(const d of result.directions)riskyIds.add(d.id);
  if(!riskyIds.size)return{result,telemetry:{phase:"critic_repair",provider:provider.providerName,model:provider.modelName,latencyMs:0,success:true}};
  const targets=result.directions.filter(d=>riskyIds.has(d.id));const system=`You are CardeLume's premium creative critic. Repair only the supplied risky directions. ${allowTemplateSwap?"Because creative range is weak, you MAY replace a risky direction with another supplied immutable template/version pair when that creates a materially stronger, more distinct premium concept.":"Keep every template ID/version fixed."} Increase emotional specificity, premium restraint, creative separation and memorability. Never add facts not present in the brief. Never invent template IDs or controls. Return JSON only.`;
  const relevantCandidates=allowTemplateSwap?candidates:candidates.filter(c=>targets.some(d=>d.templateId===c.template.id&&d.templateVersionId===c.template.versionId));
  const prompt=JSON.stringify({task:"critic_repair",allowTemplateSwap,brief,risks,candidates:candidateContext(relevantCandidates),directions:targets,outputContract:{repairs:targets.map(d=>({id:d.id,templateId:allowTemplateSwap?"candidate uuid; omit to keep":"must remain fixed",templateVersionId:allowTemplateSwap?"matching candidate version uuid; omit to keep":"must remain fixed",creativeThesis:"stronger distinct thesis",customerRationale:"customer-facing, same language as brief, 4-14 words; emotional fit only",signatureMove:SIGNATURE_MOVES,accentMode:ACCENTS,kicker:"<=8 words",headline:"<=14 words",body:"<=45 words",confidence:"0..1",noveltyScore:"0..1",wowScore:"0..1"}))}});
  assertPromptBudget(prompt);const response=await provider.generateJson({system,prompt,timeoutMs:timeoutMs()});const raw=response.data;if(!raw||typeof raw!=="object"||!Array.isArray((raw as {repairs?:unknown}).repairs))throw new Error("ai_critic_invalid_response");const repairs=(raw as {repairs:unknown[]}).repairs;
  const merged=result.directions.map(original=>{const r=repairs.find(v=>v&&typeof v==="object"&&(v as {id?:unknown}).id===original.id) as Record<string,unknown>|undefined;if(!r)return original;
    let templateId=original.templateId,templateVersionId=original.templateVersionId;if(allowTemplateSwap){const requestedId=str(r.templateId,80),requestedVersion=str(r.templateVersionId,80);if(requestedId||requestedVersion){if(!requestedId||!requestedVersion)throw new Error("ai_critic_template_pair_invalid");templateId=requestedId;templateVersionId=requestedVersion;}}
    const candidate=candidates.find(c=>c.template.id===templateId&&c.template.versionId===templateVersionId);if(!candidate)throw new Error("ai_critic_candidate_missing");const recipe=templateCreativeRecipe(candidate.template);let signatureMove=str(r.signatureMove,60) as SignatureMove;if(!recipe.signatureMoves.includes(signatureMove))signatureMove=original.signatureMove&&recipe.signatureMoves.includes(original.signatureMove)?original.signatureMove:recipe.signatureMoves[0];let accentMode=str(r.accentMode,20) as CreativeAccentMode;if(!recipe.preferredAccents.includes(accentMode))accentMode=original.accentMode&&recipe.preferredAccents.includes(original.accentMode)?original.accentMode:recipe.preferredAccents[0];if(accentMode==="photo"&&(!brief.hasPhoto||candidate.template.photoMode==="none"))accentMode="original";const thesis=str(r.creativeThesis,360)||original.creativeThesis;if(!thesis||thesis.length<24)throw new Error("ai_critic_thesis_too_weak");const customerRationale=safeCustomerRationale(r.customerRationale)||original.customerRationale;const next={...original,templateId:candidate.template.id,templateVersionId:candidate.template.versionId,templateName:candidate.template.name,visualDirection:candidate.template.visualDirection,photoMode:candidate.template.photoMode,creativeThesis:thesis,customerRationale,signatureMove,accentMode,kicker:str(r.kicker,100)||original.kicker,headline:str(r.headline,180)||original.headline,body:str(r.body,360)||original.body,confidence:num(r.confidence,original.confidence??.8),noveltyScore:num(r.noveltyScore,original.noveltyScore??.8),wowScore:num(r.wowScore,original.wowScore??.8),riskCodes:[]};validateDirectionCopy(next,brief);return next;});
  const families=new Set<string>();const exactTemplates=new Set<string>();for(const direction of merged){const candidate=candidates.find(c=>c.template.id===direction.templateId&&c.template.versionId===direction.templateVersionId);if(!candidate)throw new Error("ai_critic_candidate_missing");if(families.has(candidate.template.familyId))throw new Error("ai_critic_family_duplicate");families.add(candidate.template.familyId);const key=`${candidate.template.id}:${candidate.template.versionId}`;if(exactTemplates.has(key))throw new Error("ai_critic_template_duplicate");exactTemplates.add(key);}
  const parsed=GenerationResultSchema.parse({directions:merged});return{result:parsed,telemetry:telemetry("critic_repair",response)};
}

// Backward-compatible Step 12 entry point retained for tests/curated integration.
export async function generateCardeLumeDirections(provider:AIProvider,brief:GenerationBrief,candidates?:Array<Pick<RankedTemplate["template"],"id"|"versionId"|"name"|"visualDirection"|"photoMode"|"familyId"|"editorialScore">>):Promise<GenerationResult>{
  if(!candidates||candidates.length<3){const slots=[...expectedDirectionIds(brief)];const legacy=slots.map((id,index)=>({id,kicker:["A MOMENT FOR YOU","UNDER THE SAME STARS","JUST FOR YOU"][index]??"JUST FOR YOU",headline:["A beautiful moment, made yours.","Here is to what comes next.","With warm wishes."][index]??"With warm wishes.",body:["May this day hold more of what makes you feel most like yourself.","For this moment, and for all the good still waiting ahead.","A simple note for a day worth remembering."][index]??"With warm wishes."}));return GenerationResultSchema.parse({directions:legacy});}
  const ranked:RankedTemplate[]=candidates.map((template,index):RankedTemplate=>({template:{...template,version:1,slug:template.name,material:"",rendererTemplateKey:template.visualDirection,status:"active",launchStatus:"candidate",health:"healthy",photoMode:template.photoMode,editorialScore:template.editorialScore??90,maturity:"proven",supportedFormats:[brief.format],scriptSupport:[brief.locale.startsWith("ko")?"hangul":brief.locale.startsWith("ja")||brief.locale.startsWith("zh")?"cjk":"latin"],headlineCapacity:"medium",bodyCapacity:"medium",feelings:[],occasions:[],markets:[],excludedMarkets:[],materialWorld:"editorial_luxury",materialCues:["paper grain"],energy:"warm",colorWorld:"ivory",motionProfile:"static_paper",localeStrengths:[brief.locale],printFormatStrength:[brief.format]},score:1-index*.01,baseScore:1-index*.01,marketScore:.7,reasons:[],components:{relevance:.8,market:.7,editorial:.9,performance:.8,textFit:1,freshness:.7,photoFit:1,noveltyPenalty:0}}));const outcome=await generateCreativeDirectorDirections(provider,brief,ranked);if(outcome.kind!=="ready")throw new Error("ai_unexpected_expansion");return outcome.result;
}

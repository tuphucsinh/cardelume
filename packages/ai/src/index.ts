import { randomUUID } from "node:crypto";
import { GenerationResultSchema, cardCopyMetrics, type GeneratedDirection, type GenerationBrief, type GenerationResult } from "@cardelume/card-schema";
import { resolveCanonicalPresentationFromTemplate, templateCreativeRecipe, templateArchetype, templatePairKey, type RankedTemplate, type RecentStyleFingerprint, type SignatureMove, type CreativeAccentMode, type TemplateArchetype, type VisualDirection, type TemplatePhotoMode, type TemplateMaterialWorld, type TemplateEnergy, type TemplateColorWorld, type TemplateMeta, type TemplateRankInput } from "@cardelume/templates";
import { deterministicFallbackCopy } from "./fallback-copy.ts";
export { deterministicFallbackCopy } from "./fallback-copy.ts";

export type AIProviderUsage={inputTokens?:number;outputTokens?:number};
export type AIProviderProtocol="chat_completions"|"responses";
export type AIProviderResponse={data:unknown;provider:string;model:string;protocol?:AIProviderProtocol;usage?:AIProviderUsage;latencyMs:number};
export interface AIProvider{
  readonly providerName:string;
  readonly modelName:string;
  readonly protocol?:AIProviderProtocol;
  generateJson(input:{system:string;prompt:string;timeoutMs?:number}):Promise<AIProviderResponse>;
}

export type ProviderFailureClass="request_contract"|"http_client"|"http_server"|"timeout"|"network"|"response_contract"|"budget"|"unknown";
export type AICallTelemetry={phase:"creative_director"|"expanded_director"|"critic_repair";provider:string;model:string;protocol?:AIProviderProtocol;inputTokens?:number;outputTokens?:number;latencyMs:number;success:boolean;errorCode?:string;failureClass?:ProviderFailureClass};
export type CreativeDirectorResult={kind:"ready";result:GenerationResult;telemetry:AICallTelemetry};
export type CreativeExpansionRequest={kind:"expand_pool";reasonCode:string;desiredTraits:string[];telemetry:AICallTelemetry};
export type CreativeDirectorOutcome=CreativeDirectorResult|CreativeExpansionRequest;

const SIGNATURE_MOVES:SignatureMove[]=["recipient_anchor","quiet_opening","isolated_closing_line","keepsake_memory","understated_celebration","editorial_contrast"];
const ACCENTS:CreativeAccentMode[]=["original","photo","navy","sage","rose"];
const RISKS=["low_confidence","low_novelty","low_wow","market_tension","copy_risk","creative_range"] as const;

type FetchLike=typeof fetch;
function required(value:string|undefined,name:string){if(!value)throw new Error(`${name}_required`);return value;}
function responsesOutputText(value:unknown){
  if(!Array.isArray(value))return "";
  return value.map(item=>{
    if(!item||typeof item!=="object")return "";
    const content=(item as {content?:unknown}).content;
    if(!Array.isArray(content))return "";
    return content.map(part=>part&&typeof part==="object"&&typeof (part as {text?:unknown}).text==="string"&&((part as {type?:unknown}).type==="output_text"||(part as {type?:unknown}).type==="text")?(part as {text:string}).text:"").join("");
  }).join("");
}
function timeoutMs(){const n=Number(process.env.AI_REQUEST_TIMEOUT_MS||12000);return Number.isFinite(n)?Math.max(4000,Math.min(30000,Math.floor(n))):12000;}
function maxResponseBytes(){const n=Number(process.env.AI_MAX_RESPONSE_BYTES||65536);return Number.isFinite(n)?Math.max(16384,Math.min(262144,Math.floor(n))):65536;}
function maxCreativePromptBytes(){const n=Number(process.env.AI_CREATIVE_PROMPT_MAX_BYTES||28000);return Number.isFinite(n)?Math.max(12000,Math.min(64000,Math.floor(n))):28000;}
function threshold(name:string,fallback:number){const n=Number(process.env[name]||fallback);return Number.isFinite(n)?Math.max(0,Math.min(1,n)):fallback;}
function wowRepairThreshold(){return threshold("AI_WOW_REPAIR_THRESHOLD",.70);}
function confidenceRepairThreshold(){return threshold("AI_CONFIDENCE_REPAIR_THRESHOLD",.62);}
function noveltyRepairThreshold(){return threshold("AI_NOVELTY_REPAIR_THRESHOLD",.50);}
function assertPromptBudget(prompt:string){if(new TextEncoder().encode(prompt).byteLength>maxCreativePromptBytes())throw new Error("ai_prompt_budget_exceeded");}

export const DEFAULT_GENERATION_DEADLINE_MS = 20_000;
export const DEFAULT_FALLBACK_RESERVE_MS = 2_000;
export const MAX_GENERATION_DEADLINE_MS = 22_000;

export function defaultGenerationDeadlineMs(): number {
  const n = Number(process.env.AI_GENERATION_DEADLINE_MS || process.env.GENERATION_DEADLINE_MS || DEFAULT_GENERATION_DEADLINE_MS);
  return Number.isFinite(n) && n > 0 ? Math.min(MAX_GENERATION_DEADLINE_MS, Math.floor(n)) : DEFAULT_GENERATION_DEADLINE_MS;
}

export function defaultFallbackReserveMs(): number {
  const n = Number(process.env.AI_FALLBACK_RESERVE_MS || DEFAULT_FALLBACK_RESERVE_MS);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : DEFAULT_FALLBACK_RESERVE_MS;
}

export interface GenerationBudgetOptions {
  totalTimeoutMs?: number;
  fallbackReserveMs?: number;
  startedAt?: number;
  now?: () => number;
}

export class GenerationBudget {
  readonly startedAt: number;
  readonly totalTimeoutMs: number;
  readonly fallbackReserveMs: number;
  readonly deadlineAt: number;
  readonly aiCutoffAt: number;
  private readonly nowFn: () => number;

  constructor(options: GenerationBudgetOptions = {}) {
    this.nowFn = options.now ?? Date.now;
    this.startedAt = Number.isFinite(options.startedAt) ? Math.floor(options.startedAt!) : this.nowFn();
    this.totalTimeoutMs = options.totalTimeoutMs ?? defaultGenerationDeadlineMs();
    this.fallbackReserveMs = options.fallbackReserveMs ?? defaultFallbackReserveMs();
    this.deadlineAt = this.startedAt + this.totalTimeoutMs;
    this.aiCutoffAt = Math.max(this.startedAt, this.deadlineAt - this.fallbackReserveMs);
  }

  get elapsedMs(): number {
    return Math.max(0, this.nowFn() - this.startedAt);
  }

  get remainingTotalMs(): number {
    return Math.max(0, this.deadlineAt - this.nowFn());
  }

  get remainingAiMs(): number {
    return Math.max(0, this.aiCutoffAt - this.nowFn());
  }

  isExpired(): boolean {
    return this.remainingAiMs <= 0;
  }

  ensureAiBudget(minRequiredMs = 1): number {
    const remaining = this.remainingAiMs;
    if (remaining < minRequiredMs) {
      throw new Error("ai_budget_exhausted");
    }
    return remaining;
  }

  clampTimeoutMs(requestedTimeoutMs?: number, minRequiredMs = 1): number {
    const remaining = this.ensureAiBudget(minRequiredMs);
    if (typeof requestedTimeoutMs === "number" && requestedTimeoutMs > 0) {
      return Math.max(1, Math.min(requestedTimeoutMs, remaining));
    }
    return Math.max(1, remaining);
  }
}

export function createGenerationBudget(options?: GenerationBudgetOptions | GenerationBudget): GenerationBudget {
  if (options instanceof GenerationBudget) return options;
  return new GenerationBudget(options);
}

const RESPONSES_MODEL_IDS=new Set(["gpt-5.6-luna"]);

export function providerProtocolFor(model:string,baseUrl:string):AIProviderProtocol{
  const normalizedModel=model.trim().toLowerCase();
  const normalizedBase=baseUrl.replace(/\/$/,"").toLowerCase();
  return RESPONSES_MODEL_IDS.has(normalizedModel)&&normalizedBase.includes("opencode.ai/zen/")?"responses":"chat_completions";
}

function needsOpenCodeSessionHeader(baseUrl:string){return /opencode\.ai\/zen\/go\//i.test(baseUrl);}
function responsesInstructions(system:string){return system.includes("json")?system:`${system}\nReturn a json object.`;}
function responsesPrompt(prompt:string){return prompt.includes("json")?prompt:`${prompt}\nReturn json only.`;}

function providerHttpError(status:number){
  return Number.isInteger(status)&&status>=100&&status<=599?`ai_provider_http_${status}`:"ai_provider_http_error";
}

function responseText(envelope:Record<string,unknown>,protocol:AIProviderProtocol){
  if(protocol==="chat_completions"){
    const choices=envelope.choices;
    if(!Array.isArray(choices)||!choices[0]||typeof choices[0]!=="object")return undefined;
    const message=(choices[0] as Record<string,unknown>).message;
    if(!message||typeof message!=="object")return undefined;
    const content=(message as Record<string,unknown>).content;
    if(typeof content==="string")return content;
    if(Array.isArray(content))return content.map(part=>part&&typeof part==="object"&&typeof (part as Record<string,unknown>).text==="string"?(part as Record<string,string>).text:"").join("");
    return undefined;
  }
  if(typeof envelope.output_text==="string")return envelope.output_text;
  if(!Array.isArray(envelope.output))return undefined;
  return envelope.output.flatMap(item=>{
    if(!item||typeof item!=="object")return [];
    const content=(item as Record<string,unknown>).content;
    if(!Array.isArray(content))return [];
    return content.flatMap(part=>part&&typeof part==="object"&&typeof (part as Record<string,unknown>).text==="string"?[(part as Record<string,string>).text]:[]);
  }).join("")||undefined;
}

function isRecord(value:unknown):value is Record<string,unknown>{return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);}
function normalizeCanonicalEnum(value:unknown,allowed:readonly string[]){
  if(!Array.isArray(value))return value;
  return value.find(item=>typeof item==="string"&&allowed.includes(item))??value;
}

/**
 * Normalize provider-shaped JSON into the one shape consumed by CardeLume's
 * strict generation parser. Provider quirks stay at this boundary; counts,
 * IDs, copy and eligibility remain validated by the generation pipeline.
 */
function normalizeProviderJson(value:unknown):unknown{
  let source=value;
  if(isRecord(value)&&value.action==="select"&&isRecord(value.select)&&Array.isArray(value.select.directions)){
    const metadata=Object.fromEntries(Object.entries(value).filter(([key])=>key!=="select"));
    source={...metadata,...value.select,action:value.action};
  }
  if(!isRecord(source)||!Array.isArray(source.directions))return source;
  return{
    ...source,
    directions:source.directions.map(direction=>{
      if(!isRecord(direction))return direction;
      const normalized={...direction};
      if("signatureMove" in direction)normalized.signatureMove=normalizeCanonicalEnum(direction.signatureMove,SIGNATURE_MOVES);
      if("accentMode" in direction)normalized.accentMode=normalizeCanonicalEnum(direction.accentMode,ACCENTS);
      return normalized;
    }),
  };
}

function parseProviderJsonText(text:string):unknown{
  const trimmed=text.trim();
  const candidates:string[]=[trimmed];
  const fenced=trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)?.[1]?.trim();
  if(fenced)candidates.push(fenced);
  for(const candidate of candidates){
    try{return normalizeProviderJson(JSON.parse(candidate));}catch{/* try the next bounded representation */}
  }
  throw new Error("ai_provider_invalid_json");
}

export function classifyProviderError(error:unknown):ProviderFailureClass{
  const message=error instanceof Error?error.message:"unknown";
  if(message==="ai_budget_exhausted")return "budget";
  if(message==="ai_provider_timeout")return "timeout";
  if(message==="ai_provider_request_contract")return "request_contract";
  if(/^ai_provider_http_4\d{2}$/.test(message))return "http_client";
  if(/^ai_provider_http_5\d{2}$/.test(message))return "http_server";
  if(message==="ai_provider_network")return "network";
  if(message.startsWith("ai_provider_invalid")||message==="ai_provider_empty_content"||message==="ai_provider_response_too_large"||message==="ai_provider_malformed_response")return "response_contract";
  if(error instanceof TypeError)return "network";
  return "unknown";
}

export function safeProviderErrorCode(error:unknown):string{
  const message=error instanceof Error?error.message:"";
  if(/^ai_provider_http_\d{3}$/.test(message)||[
    "ai_provider_timeout","ai_provider_network","ai_provider_request_contract",
    "ai_provider_invalid_response","ai_provider_invalid_json","ai_provider_empty_content",
    "ai_provider_response_too_large","ai_provider_malformed_response"
  ].includes(message))return message;
  const failure=classifyProviderError(error);
  return failure==="timeout"?"ai_provider_timeout":failure==="budget"?"ai_budget_exhausted":failure==="network"?"ai_provider_network":"ai_provider_failed";
}

function usageNumber(value:unknown){return typeof value==="number"&&Number.isFinite(value)&&value>=0?value:undefined;}

export class OpenAICompatibleProvider implements AIProvider{
  readonly providerName="openai-compatible";
  readonly protocol:AIProviderProtocol;
  private readonly sessionId:string;
  get modelName(){return this.config.model;}
  constructor(private readonly config:{apiKey:string;model:string;baseUrl:string;sessionId?:string},private readonly fetchImpl:FetchLike=fetch){this.protocol=providerProtocolFor(config.model,config.baseUrl);this.sessionId=config.sessionId?.trim()||randomUUID();}
  async generateJson(input:{system:string;prompt:string;timeoutMs?:number}){
    const started=Date.now();const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),input.timeoutMs??timeoutMs());
    const base=this.config.baseUrl.replace(/\/$/,"");
    const body=this.protocol==="responses"
      ? {model:this.config.model,instructions:responsesInstructions(input.system),input:responsesPrompt(input.prompt),text:{format:{type:"json_object"}}}
      : {model:this.config.model,temperature:.78,response_format:{type:"json_object"},messages:[{role:"system",content:input.system},{role:"user",content:input.prompt}]};
    try{

      const response=await this.fetchImpl(`${base}/${this.protocol==="responses"?"responses":"chat/completions"}`,{
        method:"POST",signal:controller.signal,headers:{authorization:`Bearer ${this.config.apiKey}`,"content-type":"application/json",accept:"application/json","user-agent":"CardeLume-P21-Staging/0.4.3",...(needsOpenCodeSessionHeader(this.config.baseUrl)?{"x-opencode-session":this.sessionId}:{})},body:JSON.stringify(body)
      });
      if(!response.ok)throw new Error(providerHttpError(response.status));
      const maxBytes=maxResponseBytes();const declared=Number(response.headers.get("content-length")||0);
      if(declared>maxBytes)throw new Error("ai_provider_response_too_large");
      const rawEnvelope=await response.text();if(new TextEncoder().encode(rawEnvelope).byteLength>maxBytes)throw new Error("ai_provider_response_too_large");
      let envelope:unknown;try{envelope=JSON.parse(rawEnvelope);}catch{throw new Error("ai_provider_invalid_response");}
      if(!envelope||typeof envelope!=="object")throw new Error("ai_provider_invalid_response");

      const e=envelope as Record<string,unknown>;const text=responseText(e,this.protocol);
      if(!text)throw new Error("ai_provider_empty_content");
      const data=parseProviderJsonText(text);
      const usage=e.usage&&typeof e.usage==="object"?e.usage as Record<string,unknown>:undefined;
      const inputTokens=usageNumber(usage?.input_tokens??usage?.prompt_tokens);const outputTokens=usageNumber(usage?.output_tokens??usage?.completion_tokens);
      return{data,provider:this.providerName,model:typeof e.model==="string"?e.model:this.config.model,protocol:this.protocol,usage:{inputTokens,outputTokens},latencyMs:Date.now()-started};
    }catch(error){if(error instanceof DOMException&&error.name==="AbortError")throw new Error("ai_provider_timeout");if(error instanceof TypeError)throw new Error("ai_provider_network");throw error;}finally{clearTimeout(timer);}
  }
}

export class MockAIProvider implements AIProvider{
  readonly providerName="mock";readonly modelName="mock-premium";
  async generateJson(input:{system:string;prompt:string;timeoutMs?:number}){const started=Date.now();const ctx=JSON.parse(input.prompt) as {task?:string;slots?:string[];brief?:Partial<GenerationBrief>;candidates?:Array<{id:string;versionId:string;familyId?:string;name:string;photoMode:string;recipe?:{preferredAccents?:string[];signatureMoves?:string[]}}>;directions?:Array<Record<string,unknown>>};
    const brief=semanticBriefFromPrompt(ctx.brief);
    if(ctx.task==="critic_repair")return{data:{repairs:(ctx.directions??[]).map((d,i)=>({...d,...semanticCopyForSlot(brief,String(d.id??ctx.slots?.[i]??"editorial"),i),confidence:.91,noveltyScore:.82,wowScore:.86,riskCodes:[]}))},provider:this.providerName,model:this.modelName,usage:{inputTokens:180,outputTokens:140},latencyMs:Date.now()-started};
    const candidates=ctx.candidates??[];const slots=ctx.slots??["editorial","midnight","quiet"];
    // Select distinct-family candidates from the full pool (may be >3) to satisfy family-uniqueness validation.
    const usedFamilies=new Set<string>();const picked:typeof candidates=[];
    for(const c of candidates){if(picked.length>=slots.length)break;const fam=c.familyId??c.id;if(!usedFamilies.has(fam)){usedFamilies.add(fam);picked.push(c);}}
    while(picked.length<slots.length&&candidates.length){const fallback=candidates.find(c=>!picked.includes(c));if(!fallback)break;picked.push(fallback);}
    return{data:{action:"select",directions:slots.map((slot,i)=>{const c=picked[i]??picked[0];return{id:slot,templateId:c?.id,templateVersionId:c?.versionId,...semanticCopyForSlot(brief,slot,i),signatureMove:c?.recipe?.signatureMoves?.[0]??"recipient_anchor",accentMode:c?.photoMode==="required"?"photo":c?.recipe?.preferredAccents?.[0]??"original",confidence:.92,noveltyScore:.84,wowScore:.86,riskCodes:[]};})},provider:this.providerName,model:this.modelName,usage:{inputTokens:560,outputTokens:360},latencyMs:Date.now()-started};
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

export type SemanticCopyLanguage="en"|"vi"|"ja"|"ko"|"zh"|"es"|"fr"|"de"|"pt"|"it";
export interface SemanticCopyContract{
  language:SemanticCopyLanguage;
  locale:string;
  occasion:string;
  occasionLabel:string;
  occasionAnchors:string[];
  feeling:string;
  feelingLabel:string;
  feelingAnchors:string[];
  relationship:string;
  recipient:string;
  detail:string;
}

function compactSemanticText(value:unknown,max=120){
  return typeof value==="string"?value.replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,max):"";
}
function semanticLanguage(locale:string):SemanticCopyLanguage{
  const norm=(locale||"").toLowerCase().trim();
  const prefix=norm.split(/[-_]/)[0];
  if(prefix==="vi"||prefix==="ja"||prefix==="ko"||prefix==="zh"||prefix==="es"||prefix==="fr"||prefix==="de"||prefix==="pt"||prefix==="it"){
    return prefix as SemanticCopyLanguage;
  }
  return "en";
}
function comparableCopy(value:string){return value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/[^\p{L}\p{N}]+/gu," ").trim();}
function hasCopyAnchor(text:string,anchors:string[]){const hay=comparableCopy(text);return anchors.some(anchor=>{const needle=comparableCopy(anchor);return Boolean(needle)&&hay.includes(needle);});}
function canonicalOccasionFamily(key:string):string{
  if(key==="birthday"||key==="cumpleanos"||key==="anniversaire"||key==="geburtstag"||key==="compleanno"||key==="sinh nhat"||key==="誕生日"||key==="お誕生日"||key==="생일"||key==="생신"||key==="生日")return "birthday";
  if(key==="anniversary"||key==="aniversario"||key==="jahrestag"||key==="ky niem"||key==="記念日"||key==="기념일"||key==="纪念日"||key==="週年"||key==="周年")return "anniversary";
  if(key.startsWith("thank")||key==="gracias"||key==="agradecimiento"||key==="merci"||key==="remerciement"||key==="danke"||key==="dank"||key==="obrigado"||key==="obrigada"||key==="gratidao"||key==="grazie"||key==="ringraziamento"||key==="cam on"||key==="tri an"||key==="ありがとう"||key==="感謝"||key==="감사"||key==="고마"||key==="谢谢"||key==="感谢")return "thank";
  if(key.startsWith("congrat")||key==="felicidades"||key==="logro"||key==="felicitations"||key==="reussite"||key==="gluckwunsch"||key==="gluckwunsche"||key==="erfolg"||key==="parabens"||key==="conquista"||key==="congratulazioni"||key==="traguardo"||key==="chuc mung"||key==="thanh tuu"||key==="おめでとう"||key==="達成"||key==="축하"||key==="恭喜"||key==="祝贺")return "congratulations";
  if(key==="new baby"||key==="bebe"||key==="recien nacido"||key==="nouveau ne"||key==="neugeborene"||key==="recem nascido"||key==="neonato"||key==="bambino"||key==="em be"||key==="chao be"||key==="赤ちゃん"||key==="出産"||key==="아기"||key==="출산"||key==="宝宝"||key==="新生")return "new baby";
  if(key==="other"||key==="general")return "other";
  return key;
}
function semanticOccasion(language:SemanticCopyLanguage,occasion:string){
  const key=comparableCopy(occasion);
  const family=canonicalOccasionFamily(key);
  const labels:Record<SemanticCopyLanguage,Record<string,string>>={
    en:{birthday:"birthday",anniversary:"anniversary",thank:"thank-you note",congratulations:"achievement","new baby":"new baby",other:"your own occasion",general:"your own occasion"},
    vi:{birthday:"sinh nhật",anniversary:"kỷ niệm","thank you":"lời cảm ơn",thank:"lời cảm ơn",congratulations:"thành tựu",congratulation:"thành tựu","new baby":"em bé mới",other:"dịp riêng",general:"dịp riêng"},
    es:{birthday:"cumpleaños",anniversary:"aniversario","thank you":"agradecimiento",thank:"agradecimiento",congratulations:"felicidades",congratulation:"felicidades","new baby":"bebé",other:"tu ocasión",general:"tu ocasión"},
    fr:{birthday:"anniversaire",anniversary:"anniversaire","thank you":"remerciement",thank:"remerciement",congratulations:"félicitations",congratulation:"félicitations","new baby":"bébé",other:"votre occasion",general:"votre occasion"},
    de:{birthday:"geburtstag",anniversary:"jahrestag","thank you":"danke",thank:"danke",congratulations:"glückwünsche",congratulation:"glückwünsche","new baby":"baby",other:"dein anlass",general:"dein anlass"},
    pt:{birthday:"aniversário",anniversary:"aniversário","thank you":"gratidão",thank:"gratidão",congratulations:"parabéns",congratulation:"parabéns","new baby":"bebê",other:"sua ocasião",general:"sua ocasião"},
    it:{birthday:"compleanno",anniversary:"anniversario","thank you":"ringraziamento",thank:"ringraziamento",congratulations:"congratulazioni",congratulation:"congratulazioni","new baby":"neonato",other:"tua occasione",general:"tua occasione"},
    ja:{birthday:"お誕生日",anniversary:"記念日","thank you":"感謝",thank:"感謝",congratulations:"おめでとう",congratulation:"おめでとう","new baby":"赤ちゃん",other:"特別な日",general:"特別な日"},
    ko:{birthday:"생일",anniversary:"기념일","thank you":"감사",thank:"감사",congratulations:"축하",congratulation:"축하","new baby":"아기",other:"특별한 날",general:"특별한 날"},
    zh:{birthday:"生日",anniversary:"纪念日","thank you":"感谢",thank:"感谢",congratulations:"祝贺",congratulation:"祝贺","new baby":"宝宝",other:"专属节日",general:"专属节日"}
  };
  return labels[language]?.[family]??labels[language]?.[key]??labels.en[family]??labels.en[key]??occasion;
}
function semanticOccasionAnchors(language:SemanticCopyLanguage,occasion:string,label:string){
  const key=comparableCopy(occasion);
  const family=canonicalOccasionFamily(key);
  const anchorsByLang:Record<SemanticCopyLanguage,Record<string,string[]>>={
    en:{
      birthday:["birthday"],anniversary:["anniversary"],thank:["thank","gratitude"],congratulations:["congrat","achievement"],"new baby":["new baby","baby"],other:["your own occasion"],general:["your own occasion"]
    },
    vi:{
      birthday:["birthday","sinh nhật"],anniversary:["anniversary","kỷ niệm"],thank:["thank","gratitude","cảm ơn","tri ân"],congratulations:["congrat","achievement","chúc mừng","thành tựu"],"new baby":["new baby","baby","em bé","chào bé"],other:["your own occasion","dịp riêng"],general:["your own occasion","dịp riêng"]
    },
    es:{
      birthday:["cumpleaños","cumpleanos"],anniversary:["aniversario"],thank:["gracias","agradecimiento"],congratulations:["felicidades","logro"],"new baby":["bebé","bebe","recién nacido","recien nacido"],other:["tu ocasión","tu ocasion"],general:["tu ocasión","tu ocasion"]
    },
    fr:{
      birthday:["anniversaire"],anniversary:["anniversaire"],thank:["merci","remerciement"],congratulations:["félicitations","felicitations","réussite","reussite"],"new baby":["bébé","bebe","nouveau-né","nouveau ne"],other:["votre occasion"],general:["votre occasion"]
    },
    de:{
      birthday:["geburtstag"],anniversary:["jahrestag"],thank:["danke","dank"],congratulations:["glückwunsch","gluckwunsch","glückwünsche","gluckwunsche","erfolg"],"new baby":["baby","neugeborene"],other:["dein anlass"],general:["dein anlass"]
    },
    pt:{
      birthday:["aniversário","aniversario"],anniversary:["aniversário","aniversario"],thank:["obrigado","obrigada","gratidão","gratidao"],congratulations:["parabéns","parabens","conquista"],"new baby":["bebê","bebe","recém-nascido","recem nascido"],other:["sua ocasião","sua ocasiao"],general:["sua ocasião","sua ocasiao"]
    },
    it:{
      birthday:["compleanno"],anniversary:["anniversario"],thank:["grazie","ringraziamento"],congratulations:["congratulazioni","traguardo"],"new baby":["neonato","bambino"],other:["tua occasione"],general:["tua occasione"]
    },
    ja:{
      birthday:["誕生日","お誕生日"],anniversary:["記念日"],thank:["ありがとう","感謝"],congratulations:["おめでとう","達成"],"new baby":["赤ちゃん","出産"],other:["特別な日"],general:["特別な日"]
    },
    ko:{
      birthday:["생일","생신"],anniversary:["기념일"],thank:["감사","고마"],congratulations:["축하"],"new baby":["아기","출산"],other:["특별한 날"],general:["특별한 날"]
    },
    zh:{
      birthday:["生日"],anniversary:["纪念日","週年","周年"],thank:["谢谢","感谢"],congratulations:["恭喜","祝贺"],"new baby":["宝宝","新生"],other:["专属节日"],general:["专属节日"]
    }
  };
  const list=anchorsByLang[language]?.[family]??anchorsByLang[language]?.[key]??anchorsByLang.en[family]??[];
  return [...new Set([...list,label,occasion,semanticDisplay(occasion,48),language==="vi"?"dịp":"occasion"])];
}
function canonicalFeelingFamily(key:string):string{
  if(key==="elegant"||key==="refined"||key==="thanh lich"||key==="elegante"||key==="raffine"||key==="vornehm"||key==="raffinato"||key==="エレガント"||key==="上品"||key==="우아"||key==="优雅"||key==="高雅")return "elegant";
  if(key==="warm"||key==="tender"||key==="am ap"||key==="calido"||key==="chaleureux"||key==="herzlich"||key==="caloroso"||key==="caldo"||key==="あたたか"||key==="温か"||key==="따뜻"||key==="温暖"||key==="温馨")return "warm";
  if(key==="romantic"||key==="intimate"||key==="lang man"||key==="romantico"||key==="romantique"||key==="romantisch"||key==="ロマン"||key==="愛"||key==="로맨"||key==="浪漫")return "romantic";
  if(key==="fun"||key==="playful"||key==="tuoi vui"||key==="divertido"||key==="amusant"||key==="joyeux"||key==="frohlich"||key==="lustig"||key==="divertente"||key==="楽しい"||key==="陽気"||key==="즐거"||key==="有趣"||key==="欢乐")return "fun";
  if(key==="surprise me"||key==="surprise"||key==="unexpected"||key==="bat ngo"||key==="sorpresa"||key==="uberraschung"||key==="サプライズ"||key==="놀라"||key==="惊喜")return "surprise me";
  return key;
}
function semanticFeeling(language:SemanticCopyLanguage,feeling:string){
  const key=comparableCopy(feeling);
  const family=canonicalFeelingFamily(key);
  const labels:Record<SemanticCopyLanguage,Record<string,string>>={
    en:{elegant:"refined",warm:"warm",romantic:"intimate",fun:"playful","surprise me":"unexpected"},
    vi:{elegant:"thanh lịch",warm:"ấm áp",romantic:"lãng mạn",fun:"tươi vui","surprise me":"bất ngờ"},
    es:{elegant:"elegante",warm:"cálido",romantic:"romántico",fun:"divertido","surprise me":"sorpresa"},
    fr:{elegant:"élégant",warm:"chaleureux",romantic:"romantique",fun:"joyeux","surprise me":"surprise"},
    de:{elegant:"elegant",warm:"warm",romantic:"romantisch",fun:"fröhlich","surprise me":"überraschung"},
    pt:{elegant:"elegante",warm:"caloroso",romantic:"romântico",fun:"divertido","surprise me":"surpresa"},
    it:{elegant:"elegante",warm:"caldo",romantic:"romantico",fun:"divertente","surprise me":"sorpresa"},
    ja:{elegant:"上品",warm:"あたたかい",romantic:"ロマンチック",fun:"楽しい","surprise me":"サプライズ"},
    ko:{elegant:"우아함",warm:"따뜻함",romantic:"로맨틱",fun:"즐거움","surprise me":"놀라움"},
    zh:{elegant:"优雅",warm:"温暖",romantic:"浪漫",fun:"欢乐","surprise me":"惊喜"}
  };
  return labels[language]?.[family]??labels[language]?.[key]??labels.en[family]??labels.en[key]??feeling;
}
function semanticFeelingAnchors(language:SemanticCopyLanguage,feeling:string,label:string){
  const key=comparableCopy(feeling);
  const family=canonicalFeelingFamily(key);
  const anchorsByLang:Record<SemanticCopyLanguage,Record<string,string[]>>={
    en:{
      elegant:["elegant","refined"],warm:["warm","tender"],romantic:["romantic","intimate"],fun:["fun","playful"],"surprise me":["surprise","unexpected"]
    },
    vi:{
      elegant:["elegant","refined","thanh lịch"],warm:["warm","tender","ấm áp"],romantic:["romantic","intimate","lãng mạn"],fun:["fun","playful","tươi vui"],"surprise me":["surprise","unexpected","bất ngờ"]
    },
    es:{
      elegant:["elegante"],warm:["cálido","calido"],romantic:["romántico","romantico"],fun:["divertido"],"surprise me":["sorpresa"]
    },
    fr:{
      elegant:["élégant","elegant","raffiné","raffine"],warm:["chaleureux","tendre"],romantic:["romantique"],fun:["amusant","joyeux"],"surprise me":["surprise"]
    },
    de:{
      elegant:["elegant","vornehm"],warm:["warm","herzlich"],romantic:["romantisch"],fun:["fröhlich","frohlich","lustig"],"surprise me":["überraschung","uberraschung"]
    },
    pt:{
      elegant:["elegante","refinado"],warm:["caloroso"],romantic:["romântico","romantico"],fun:["divertido"],"surprise me":["surpresa"]
    },
    it:{
      elegant:["elegante","raffinato"],warm:["caldo","caloroso"],romantic:["romantico"],fun:["divertente"],"surprise me":["sorpresa"]
    },
    ja:{
      elegant:["エレガント","上品"],warm:["あたたか","温か"],romantic:["ロマン","愛"],fun:["楽しい","陽気"],"surprise me":["サプライズ"]
    },
    ko:{
      elegant:["우아"],warm:["따뜻"],romantic:["로맨"],fun:["즐거"],"surprise me":["놀라"]
    },
    zh:{
      elegant:["优雅","高雅"],warm:["温暖","温馨"],romantic:["浪漫"],fun:["有趣","欢乐"],"surprise me":["惊喜"]
    }
  };
  const list=anchorsByLang[language]?.[family]??anchorsByLang[language]?.[key]??anchorsByLang.en[family]??[];
  return [...new Set([...list,label,feeling,semanticDisplay(feeling,28),language==="vi"?"cảm giác":"feeling"])];
}
function semanticBriefFromPrompt(input?:Partial<GenerationBrief>):GenerationBrief{
  const brief=input??{};
  return{
    occasion:compactSemanticText(brief.occasion,80)||"your occasion",
    recipient:compactSemanticText(brief.recipient,120),
    relationship:compactSemanticText(brief.relationship,80)||"someone special",
    feeling:compactSemanticText(brief.feeling,80)||"Warm",
    detail:compactSemanticText(brief.detail,180),
    format:brief.format??"portrait-5x7",
    locale:compactSemanticText(brief.locale,20)||"en-US",
    hasPhoto:Boolean(brief.hasPhoto),
    photoProfile:brief.photoProfile,
    refreshContext:brief.refreshContext,
    selectionContext:brief.selectionContext,
    market:compactSemanticText(brief.market,16)||"GLOBAL"
  };
}

export function semanticCopyContract(brief:GenerationBrief):SemanticCopyContract{
  const language=semanticLanguage(brief.locale);
  const occasion=compactSemanticText(brief.occasion,80)||"your occasion";
  const feeling=compactSemanticText(brief.feeling,80)||"Warm";
  const occasionLabel=semanticOccasion(language,occasion);
  const feelingLabel=semanticFeeling(language,feeling);
  return{
    language,locale:brief.locale,occasion,occasionLabel,
    occasionAnchors:semanticOccasionAnchors(language,occasion,occasionLabel),
    feeling,feelingLabel,feelingAnchors:semanticFeelingAnchors(language,feeling,feelingLabel),
    relationship:compactSemanticText(brief.relationship,80)||"someone special",
    recipient:compactSemanticText(brief.recipient,120),
    detail:compactSemanticText(brief.detail,180)
  };
}

function semanticDisplay(value:string,max:number){return value.length<=max?value:`${value.slice(0,Math.max(1,max-1)).trim()}…`;}
function semanticUpper(value:string){return value.toLocaleUpperCase().slice(0,48);}

/**
 * Produce customer-facing fit copy when a provider does not return a safe
 * rationale. This deliberately uses only the brief's emotional and occasion
 * semantics; catalog material, scores, model language, and hidden reasoning
 * are never exposed as an explanation.
 */
export function semanticCustomerRationale(brief:GenerationBrief,directionIndex=0):string{
  const contract=semanticCopyContract(brief);
  const occasion=semanticDisplay(contract.occasionLabel,48);
  const feeling=semanticDisplay(contract.feelingLabel,28).toLocaleLowerCase();
  const relationship=semanticDisplay(contract.relationship,32).toLocaleLowerCase();
  const relationshipCue=relationship&&relationship!=="someone special"&&relationship!=="someone else"?relationship:"";
  if(contract.language==="vi"){
    const variants=[
      `Hợp với dịp ${occasion}, giữ sắc thái ${feeling}.`,
      `Một hướng ${feeling} cho dịp ${occasion}${relationshipCue?` dành cho ${relationshipCue}`:""}.`,
      `Đặt cảm xúc ${feeling} vào đúng câu chuyện của dịp ${occasion}.`
    ];
    return variants[Math.abs(directionIndex)%variants.length]??variants[0];
  }
  const variants=[
    `A ${feeling} fit for ${occasion}.`,
    `A ${feeling} direction for ${occasion}${relationshipCue?` and your ${relationshipCue}`:""}.`,
    `Keeps the feeling of ${occasion} clear and personal.`
  ];
  return variants[Math.abs(directionIndex)%variants.length]??variants[0];
}

function semanticCopyForSlot(brief:GenerationBrief,slot:string,index:number){
  return deterministicFallbackCopy(brief,slot,index);
}

function semanticCopyFullText(direction:Pick<GeneratedDirection,"kicker"|"headline"|"body">){return `${direction.kicker} ${direction.headline} ${direction.body}`;}
function escapeSemanticPattern(value:string){return value.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");}
function semanticDetectorText(text:string,brief:GenerationBrief){
  const contract=semanticCopyContract(brief);
  const userInputs=[brief.detail,brief.recipient,brief.occasion,brief.relationship,brief.feeling,contract.occasionLabel,contract.feelingLabel].map(value=>compactSemanticText(value??"",180)).filter(value=>value.length>1).sort((a,b)=>b.length-a.length);
  return userInputs.reduce((current,input)=>current.replace(new RegExp(escapeSemanticPattern(input),"giu")," "),text);
}
function lowerFirst(value:string):string{
  return value?value.charAt(0).toLowerCase()+value.slice(1):value;
}

export function semanticCopyContractViolations(result:GenerationResult,brief:GenerationBrief):string[]{
  const contract=semanticCopyContract(brief);const violations:string[]=[];
  const texts=result.directions.map(semanticCopyFullText);
  const occasionMatches=texts.filter((text:string)=>hasCopyAnchor(text,contract.occasionAnchors)).length;
  if(occasionMatches<2)violations.push("occasion_missing");
  if(!texts.some((text:string)=>hasCopyAnchor(text,contract.feelingAnchors)))violations.push("feeling_missing");
  if(contract.recipient){
    const recipientAnchors=[contract.recipient,semanticDisplay(contract.recipient,42)];
    const recipientMatches=texts.filter((text:string)=>hasCopyAnchor(text,recipientAnchors)).length;
    if(recipientMatches<2)violations.push("recipient_missing");
  }
  if(contract.detail){
    const detailTokens=[...contract.detail.split(/\s+/).filter(token=>token.length>2).slice(0,3),semanticDisplay(contract.detail,96)];
    if(detailTokens.length&&!texts.some((text:string)=>hasCopyAnchor(text,detailTokens)))violations.push("detail_missing");
  }
  if(contract.language==="vi"){
    const isVi=(text:string)=>/[à-ỹ]/iu.test(text)||/\b(?:dành|gửi|chúc|mừng|lời|thiệp|cho|với)\b/iu.test(text);
    if(texts.filter(isVi).length<2)violations.push("locale_missing");
  }
  const strippedCopies=texts.map(text=>comparableCopy(semanticDetectorText(text,brief)));
  if(new Set(strippedCopies).size<Math.min(3,texts.length))violations.push("direction_copy_duplicate");
  return [...new Set(violations)];
}

export function assertSemanticCopyContract(result:GenerationResult,brief:GenerationBrief){
  const violations=semanticCopyContractViolations(result,brief);
  if(violations.length)throw new Error(`ai_semantic_copy_contract_${violations[0]}`);
}

export function repairSemanticCopyContract(result:GenerationResult,brief:GenerationBrief):GenerationResult{
  const contract=semanticCopyContract(brief);
  const repaired=GenerationResultSchema.parse({
    ...result,
    directions:result.directions.map(direction=>{
      let kicker=direction.kicker;
      let headline=direction.headline;
      const full=semanticCopyFullText(direction);

      if(contract.recipient){
        const recAnchors=[contract.recipient,semanticDisplay(contract.recipient,42)];
        const recipientMissing=!hasCopyAnchor(full,recAnchors);
        const headlineHasName=hasCopyAnchor(headline,recAnchors);
        if(recipientMissing&&!headlineHasName){
          if(contract.language==="ja"){
            headline=`${headline}｜${contract.recipient}さん`;
          }else if(contract.language==="ko"){
            headline=`${headline} · ${contract.recipient}님`;
          }else if(contract.language==="zh"){
            headline=`${headline}（致${contract.recipient}）`;
          }else{
            headline=`${contract.recipient}, ${lowerFirst(headline)}`;
          }
        }
      }

      if(!hasCopyAnchor(full,contract.occasionAnchors)){
        kicker=kicker?`${kicker} · ${contract.occasionLabel}`:contract.occasionLabel;
      }

      const updatedFull=`${kicker} ${headline} ${direction.body}`;
      if(!hasCopyAnchor(updatedFull,contract.feelingAnchors)){
        kicker=kicker?`${kicker} · ${contract.feelingLabel}`:contract.feelingLabel;
      }

      return{
        ...direction,
        kicker:kicker.slice(0,100),
        headline:headline.slice(0,180),
      };
    }),
  });
  return repaired;
}

function arr(value:unknown){return Array.isArray(value)?value:[];}
function telemetry(phase:AICallTelemetry["phase"],response:AIProviderResponse):AICallTelemetry{return{phase,provider:response.provider,model:response.model,protocol:response.protocol,inputTokens:response.usage?.inputTokens,outputTokens:response.usage?.outputTokens,latencyMs:response.latencyMs,success:true};}
function candidateContext(candidates:RankedTemplate[]){return candidates.map((item,index)=>({rank:index+1,id:item.template.id,versionId:item.template.versionId,familyId:item.template.familyId,name:item.template.name,visualDirection:item.template.visualDirection,photoMode:item.template.photoMode,materialWorld:item.template.materialWorld,materialCues:item.template.materialCues,energy:item.template.energy,colorWorld:item.template.colorWorld,motionProfile:item.template.motionProfile,score:Number(item.score.toFixed(4)),scoreComponents:Object.fromEntries(Object.entries(item.components).map(([k,v])=>[k,Number(Number(v).toFixed(3))])),reasons:item.reasons,recipe:templateCreativeRecipe(item.template)}));}
function compactRecentStyles(recent:RecentStyleFingerprint[]|undefined){return (recent??[]).slice(0,5).map(s=>({familyId:s.familyId,visualDirection:s.visualDirection,accentMode:s.accentMode??"unknown"}));}
function seenTemplateKeys(brief:GenerationBrief){return new Set((brief.refreshContext?.seenTemplateIdentities??[]).map(templatePairKey));}

export interface DirectionDiversityTarget {
  id?: string;
  templateId?: string;
  templateVersionId?: string;
  familyId: string;
  visualDirection: VisualDirection | string;
  photoMode?: TemplatePhotoMode | string;
  materialWorld?: TemplateMaterialWorld | string;
  colorWorld?: TemplateColorWorld | string;
  energy?: TemplateEnergy | string;
  archetype?: TemplateArchetype | string;
  signatureMove?: SignatureMove | string;
  creativeThesis?: string;
  name?: string;
}

export interface DiversityContract {
  readonly ok: true;
  readonly directionCount: 3;
  readonly uniqueFamilyIds: 3;
  readonly uniqueVisualDirections: 3;
  readonly minDistinctArchetypes: 2;
  readonly distinctFamilyCount: number;
  readonly distinctVisualDirectionCount: number;
  readonly distinctArchetypeCount: number;
  readonly familyIds: [string, string, string];
  readonly visualDirections: [VisualDirection | string, VisualDirection | string, VisualDirection | string];
  readonly archetypes: [TemplateArchetype, TemplateArchetype, TemplateArchetype];
}

export type ThreeDirectionDiversityContract = DiversityContract;

export function isLegacyCandidateContext(candidates?: unknown, brief?: unknown): boolean {
  if (!Array.isArray(candidates) || candidates.length < 3 || !brief || typeof brief !== "object") return true;
  return candidates.some(c => {
    if (!c || typeof c !== "object") return true;
    const item = c as Record<string, unknown>;
    if (typeof item.score !== "number" || !item.components || typeof item.components !== "object") return true;
    const t = item.template as Record<string, unknown> | undefined;
    if (!t || typeof t !== "object" || typeof t.status !== "string") return true;
    return false;
  });
}

export function validateThreeDirectionDiversity(
  items: unknown[],
  candidates?: RankedTemplate[],
  brief?: GenerationBrief
): DiversityContract {
  if (!Array.isArray(items) || items.length !== 3) {
    throw new Error("ai_direction_count_invalid");
  }
  const resolved = items.map(item => {
    if (!item || typeof item !== "object") throw new Error("ai_direction_set_invalid");
    const obj = item as Record<string, unknown>;
    const t = (obj.template && typeof obj.template === "object" ? obj.template : obj) as Record<string, unknown>;
    const familyId = String(t.familyId ?? obj.familyId ?? "").trim();
    const visualDirection = String(t.visualDirection ?? obj.visualDirection ?? "").trim();
    const photoMode = String(t.photoMode ?? obj.photoMode ?? "none").trim();
    const templateId = String(t.templateId ?? obj.templateId ?? t.id ?? obj.id ?? "").trim();
    const templateVersionId = String(t.templateVersionId ?? obj.templateVersionId ?? "").trim();
    if (!familyId) throw new Error("ai_template_family_missing");
    if (!visualDirection) throw new Error("ai_visual_direction_missing");
    return {
      templateId,
      templateVersionId,
      familyId,
      visualDirection: visualDirection as VisualDirection,
      photoMode: photoMode as TemplatePhotoMode,
      materialWorld: (t.materialWorld ?? obj.materialWorld) as TemplateMaterialWorld | undefined,
      colorWorld: (t.colorWorld ?? obj.colorWorld) as TemplateColorWorld | undefined,
      energy: (t.energy ?? obj.energy) as TemplateEnergy | undefined,
    };
  });

  const templateKeys = resolved.map(x => x.templateId ? (x.templateVersionId ? `${x.templateId}:${x.templateVersionId}` : x.templateId) : "").filter(Boolean);
  if (templateKeys.length === 3 && new Set(templateKeys).size !== 3) {
    throw new Error("ai_template_exact_duplicate");
  }

  const familyIds = resolved.map(x => x.familyId);
  const uniqueFamilies = new Set(familyIds);
  if (uniqueFamilies.size !== 3) {
    throw new Error("ai_template_family_duplicate");
  }

  const visualDirections = resolved.map(x => x.visualDirection);
  const uniqueVisuals = new Set(visualDirections);

  const archetypes = resolved.map(x => templateArchetype({ visualDirection: x.visualDirection, photoMode: x.photoMode }));
  const uniqueArchetypes = new Set(archetypes);

  if (!candidates || isLegacyCandidateContext(candidates, brief)) {
    if (uniqueVisuals.size !== 3) {
      throw new Error("ai_visual_direction_duplicate");
    }
    if (uniqueArchetypes.size < 2) {
      throw new Error("ai_direction_diversity_insufficient");
    }
  } else if (brief && hasMateriallyDifferentAlternatives(resolved, candidates, brief)) {
    // The model chooses from the full relevant pool. Validate the final result only
    // when the pool contains an unused materially different alternative; do not force
    // a midnight/photo/quiet quota into candidate construction.
    if (uniqueVisuals.size < 3) {
      throw new Error("ai_visual_direction_duplicate");
    }
    if (uniqueArchetypes.size < 2) {
      throw new Error("ai_direction_diversity_insufficient");
    }
  }

  return {
    ok: true,
    directionCount: 3,
    uniqueFamilyIds: 3,
    uniqueVisualDirections: 3,
    minDistinctArchetypes: 2,
    distinctFamilyCount: uniqueFamilies.size,
    distinctVisualDirectionCount: uniqueVisuals.size,
    distinctArchetypeCount: uniqueArchetypes.size,
    familyIds: [familyIds[0], familyIds[1], familyIds[2]],
    visualDirections: [visualDirections[0], visualDirections[1], visualDirections[2]],
    archetypes: [archetypes[0], archetypes[1], archetypes[2]],
  };
}

export const enforceThreeDirectionDiversity = validateThreeDirectionDiversity;
export const validateThreeDirections = validateThreeDirectionDiversity;

export function hasMateriallyDifferentAlternatives(
  selected: Array<Pick<DirectionDiversityTarget, "templateId" | "materialWorld" | "colorWorld" | "energy" | "visualDirection" | "photoMode">>,
  candidates?: RankedTemplate[],
  brief?: GenerationBrief
): boolean {
  if (!candidates || candidates.length <= 3) return false;
  const selectedIds = new Set(selected.map(s => s.templateId).filter(Boolean));
  const unused = candidates.filter(c => !selectedIds.has(c.template.id));
  if (!unused.length) return false;

  const eligibleUnused = unused.filter(c => {
    const t = c.template;
    if (t.status !== "active" || t.health !== "healthy" || t.launchStatus === "hold" || t.launchStatus === "retired") return false;
    if (brief && !brief.hasPhoto && t.photoMode === "required") return false;
    if (brief && brief.format && t.supportedFormats && !t.supportedFormats.includes(brief.format)) return false;
    return true;
  });
  if (!eligibleUnused.length) return false;

  const materials = new Set(selected.map(s => s.materialWorld).filter(Boolean));
  const colors = new Set(selected.map(s => s.colorWorld).filter(Boolean));
  const archetypes = new Set(selected.map(s => templateArchetype({ visualDirection: s.visualDirection as VisualDirection, photoMode: (s.photoMode ?? "none") as TemplatePhotoMode })));
  const energies = new Set(selected.map(s => s.energy).filter(Boolean));
  const visuals = new Set(selected.map(s => s.visualDirection).filter(Boolean));

  return eligibleUnused.some(c => {
    const t = c.template;
    const arch = templateArchetype(t);
    return (t.materialWorld && !materials.has(t.materialWorld)) ||
           (t.colorWorld && !colors.has(t.colorWorld)) ||
           (!archetypes.has(arch)) ||
           (t.visualDirection && !visuals.has(t.visualDirection)) ||
           (t.energy && !energies.has(t.energy));
  });
}

export function isVisualSiblingTrio(
  targets: Array<Pick<DirectionDiversityTarget, "materialWorld" | "colorWorld" | "energy" | "visualDirection" | "photoMode" | "signatureMove" | "creativeThesis">>
): boolean {
  if (targets.length !== 3) return false;

  const materials = new Set(targets.map(t => t.materialWorld).filter(Boolean));
  const colors = new Set(targets.map(t => t.colorWorld).filter(Boolean));
  const energies = new Set(targets.map(t => t.energy).filter(Boolean));
  const signatures = new Set(targets.map(t => t.signatureMove).filter(Boolean));
  const archetypes = new Set(targets.map(t => templateArchetype({ visualDirection: t.visualDirection as VisualDirection, photoMode: (t.photoMode ?? "none") as TemplatePhotoMode })));

  const sharesWorld = materials.size <= 1 && colors.size <= 1 && energies.size <= 1;
  if (!sharesWorld) return false;

  let thesisSimilarity = 0;
  for (let i = 0; i < targets.length; i++) {
    for (let j = i + 1; j < targets.length; j++) {
      const sim = jaccard(targets[i]?.creativeThesis ?? "", targets[j]?.creativeThesis ?? "");
      if (sim > thesisSimilarity) thesisSimilarity = sim;
    }
  }

  return signatures.size <= 1 || archetypes.size <= 1 || thesisSimilarity > 0.35;
}

export function assertCreativeDirectionDiversity(result:GenerationResult,candidates:RankedTemplate[],brief:GenerationBrief){
  const targets=resolveCandidateDiversityTargets(result.directions,candidates);
  if(isLegacyCandidateContext(candidates,brief))validateThreeDirectionDiversity(targets);
  else validateThreeDirectionDiversity(targets,candidates,brief);
}

function parseCreativeSelection(raw:unknown,brief:GenerationBrief,candidates:RankedTemplate[]):GenerationResult|{expand:true;reasonCode:string;desiredTraits:string[]}{
  if(!raw||typeof raw!=="object")throw new Error("ai_creative_invalid_response");const o=raw as Record<string,unknown>;
  if(o.action==="expand_pool")return{expand:true,reasonCode:str(o.reasonCode,80)||"insufficient_creative_range",desiredTraits:arr(o.desiredTraits).map(v=>str(v,60)).filter(Boolean).slice(0,6)};
  const rawDirections=arr(o.directions);if(rawDirections.length!==3)throw new Error("ai_direction_count_invalid");
  const byPair=new Map(candidates.map(c=>[`${c.template.id}:${c.template.versionId}`,c]));const expected=[...expectedDirectionIds(brief)];const directions:GeneratedDirection[]=[];const families=new Set<string>();const exactTemplates=new Set<string>();
  for(const [slotIndex,slot] of expected.entries()){const d=rawDirections.find(v=>v&&typeof v==="object"&&(v as Record<string,unknown>).id===slot) as Record<string,unknown>|undefined;if(!d)throw new Error("ai_direction_set_invalid");
    const templateId=str(d.templateId,80),templateVersionId=str(d.templateVersionId,80);const candidate=byPair.get(`${templateId}:${templateVersionId}`);if(!candidate)throw new Error("ai_template_not_in_candidate_pool");
    const key=`${candidate.template.id}:${candidate.template.versionId}`;
    if(exactTemplates.has(key)||exactTemplates.has(candidate.template.id))throw new Error("ai_template_exact_duplicate");
    const seenKeys = seenTemplateKeys(brief);
    const unusedUnseen = candidates.filter(c => !seenKeys.has(templatePairKey(c.template)) && !exactTemplates.has(`${c.template.id}:${c.template.versionId}`));
    if(seenKeys.has(templatePairKey(candidate.template)) && unusedUnseen.length > 0){
      throw new Error("ai_template_seen_duplicate");
    }
    exactTemplates.add(key);exactTemplates.add(candidate.template.id);
    if(families.has(candidate.template.familyId))throw new Error("ai_template_family_duplicate");families.add(candidate.template.familyId);
    if(candidate.template.status!=="active"||candidate.template.health!=="healthy"||candidate.template.launchStatus==="hold"||candidate.template.launchStatus==="retired")throw new Error("ai_template_not_eligible");
    if(candidate.template.supportedFormats&&!candidate.template.supportedFormats.includes(brief.format))throw new Error("ai_template_not_eligible");
    if(!brief.hasPhoto&&(candidate.template.photoMode==="required"||candidate.template.visualDirection==="photo"))throw new Error("ai_invalid_photo_direction");
    const recipe=templateCreativeRecipe(candidate.template);let accentMode=str(d.accentMode,20) as CreativeAccentMode;if(!ACCENTS.includes(accentMode)||!recipe.preferredAccents.includes(accentMode))accentMode=recipe.preferredAccents[0]??"original";if(accentMode==="photo"&&(!brief.hasPhoto||candidate.template.photoMode==="none"))accentMode="original";
    let signatureMove=str(d.signatureMove,60) as SignatureMove;if(!SIGNATURE_MOVES.includes(signatureMove)||!recipe.signatureMoves.includes(signatureMove))signatureMove=recipe.signatureMoves[0];
    const riskCodes=arr(d.riskCodes).map(v=>str(v,40)).filter((v):v is typeof RISKS[number]=>RISKS.includes(v as typeof RISKS[number])).slice(0,6);
    const creativeThesis=str(d.creativeThesis,360);if(creativeThesis.length<24)throw new Error("ai_creative_thesis_too_weak");const customerRationale=safeCustomerRationale(d.customerRationale)||semanticCustomerRationale(brief,slotIndex);
    const direction:GeneratedDirection={id:slot,templateId:candidate.template.id,templateVersionId:candidate.template.versionId,templateName:candidate.template.name,presentation:resolveCanonicalPresentationFromTemplate(candidate.template,{hasPhoto:brief.hasPhoto,locale:brief.locale,format:brief.format}),visualDirection:candidate.template.visualDirection,photoMode:candidate.template.photoMode,creativeThesis,customerRationale:customerRationale||undefined,signatureMove,accentMode,confidence:num(d.confidence),noveltyScore:num(d.noveltyScore),wowScore:num(d.wowScore),riskCodes,kicker:str(d.kicker,100),headline:str(d.headline,180),body:str(d.body,360)};
    validateDirectionCopy(direction,brief);directions.push(direction);
  }
  const resolvedTargets=directions.map(d=>{const candidate=byPair.get(`${d.templateId}:${d.templateVersionId}`)!;return{id:d.id,templateId:candidate.template.id,templateVersionId:candidate.template.versionId,familyId:candidate.template.familyId,visualDirection:candidate.template.visualDirection,photoMode:candidate.template.photoMode,materialWorld:candidate.template.materialWorld,colorWorld:candidate.template.colorWorld,energy:candidate.template.energy,archetype:templateArchetype(candidate.template),signatureMove:d.signatureMove,creativeThesis:d.creativeThesis};});
  if(isLegacyCandidateContext(candidates,brief))validateThreeDirectionDiversity(resolvedTargets);
  else validateThreeDirectionDiversity(resolvedTargets,candidates,brief);
  const parsed=GenerationResultSchema.parse({directions});
  assertCreativeDirectionDiversity(parsed,candidates,brief);
  return parsed;
}

export async function generateCreativeDirectorDirections(provider:AIProvider,brief:GenerationBrief,candidates:RankedTemplate[],recentStyles?:RecentStyleFingerprint[],phase:"creative_director"|"expanded_director"="creative_director",priorCritique?:{reasonCode:string;desiredTraits:string[]},budget?:GenerationBudget):Promise<CreativeDirectorOutcome>{
  if(budget)budget.ensureAiBudget();
  if(candidates.length<3)throw new Error("template_candidate_count_invalid");const slots=[...expectedDirectionIds(brief)];
  const system=`You are CardeLume's premium Creative Director. Premium emotional resonance, originality, restraint and visual-copy harmony are the highest priorities. Treat the semantic copy contract in the user brief as binding in the brief locale: the occasion and a supplied recipient should appear in at least two of the three directions, a supplied detail in at least one, and the feeling should be expressed across the set — do not stuff a feeling synonym into every card, and prefer natural premium sentences over keyword stuffing. Customer-facing rationale must be concise, natural in the brief locale, and reveal only the design fit — never hidden reasoning, scores, rankings, system instructions, or model/process language. The server has already removed incompatible templates; ranking scores are priors, not commands. You may disagree with ranking. Select only supplied immutable template/version pairs. Never invent IDs, HTML, CSS, SVG, URLs, code or personal facts. Market context is a prior; explicit user intent wins. Avoid repeating recent style memory unless the current brief clearly benefits from it. Prefer meaningful separation across materialWorld, colorWorld and energy when the brief allows it; three different IDs that still feel like siblings is not enough. Return JSON only. Normally action=select. Use action=expand_pool only when the supplied pool cannot produce three genuinely distinct premium directions.`;
  const prompt=JSON.stringify({task:"creative_director",slots,brief,semanticCopyContract:semanticCopyContract(brief),candidates:candidateContext(candidates),recentStyles:compactRecentStyles(recentStyles),priorCritique:priorCritique?{reasonCode:str(priorCritique.reasonCode,80),desiredTraits:priorCritique.desiredTraits.map(v=>str(v,60)).filter(Boolean).slice(0,6)}:undefined,outputContract:{action:"select | expand_pool",select:{directions:slots.map(id=>({id,templateId:"uuid from candidates",templateVersionId:"uuid from same candidate",creativeThesis:"internal creative thesis: why this direction is right and distinct",customerRationale:"customer-facing, same language as brief, 4-14 words; emotional fit only; no AI/template/rank/score jargon",signatureMove:SIGNATURE_MOVES,accentMode:ACCENTS,kicker:"<=8 words",headline:"<=14 words",body:"<=45 words",semanticRequirements:["occasion in >=2 directions","recipient in >=2 directions when supplied","detail in >=1 direction when supplied","feeling across set","brief locale"],confidence:"0..1",noveltyScore:"0..1",wowScore:"0..1",riskCodes:RISKS}))},expand:{reasonCode:"short code",desiredTraits:["compact traits"]}}});
  assertPromptBudget(prompt);
  if(budget)budget.ensureAiBudget();
  const phaseTimeout=budget?budget.clampTimeoutMs(timeoutMs()):timeoutMs();
  const response=await provider.generateJson({system,prompt,timeoutMs:phaseTimeout});
  const parsed=parseCreativeSelection(response.data,brief,candidates);if("expand" in parsed)return{kind:"expand_pool",reasonCode:parsed.reasonCode,desiredTraits:parsed.desiredTraits,telemetry:telemetry(phase,response)};return{kind:"ready",result:parsed,telemetry:telemetry(phase,response)};
}

function words(text:string){return new Set(text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").split(/\s+/).filter(Boolean));}
function jaccard(a:string,b:string){const aa=words(a),bb=words(b);if(!aa.size&&!bb.size)return 0;let common=0;for(const w of aa)if(bb.has(w))common++;return common/(aa.size+bb.size-common);}
const CLICHE_PATTERNS=[/on this special day/iu,/wishing you all the best/iu,/may all your dreams come true/iu,/best wishes for a wonderful/iu,/chúc .{0,20} thật nhiều niềm vui/iu,/ngày đặc biệt này/iu,/素敵な一年になりますよう/iu,/행복한 하루 보내/iu];
function occurrenceCount(text:string,needle:string){if(!needle)return 0;let count=0,from=0;const hay=text.toLocaleLowerCase(),n=needle.toLocaleLowerCase();while((from=hay.indexOf(n,from))>=0){count++;from+=Math.max(1,n.length);}return count;}
function directionArchetype(direction:GeneratedDirection){return templateArchetype({visualDirection:direction.visualDirection as VisualDirection,photoMode:direction.photoMode??"none"});}

export function creativeQualityRisks(
  result: GenerationResult,
  brief: GenerationBrief,
  recentStyles?: RecentStyleFingerprint[],
  candidates?: RankedTemplate[]
) {
  const risks = new Set<string>();
  if (semanticCopyContractViolations(result, brief).length) risks.add("copy_risk");
  for (const d of result.directions) {
    validateDirectionCopy(d, brief);
    const full = `${d.kicker} ${d.headline} ${d.body}`;
    const punct = (full.match(/[!！]/g) || []).length;
    const clichéHits = CLICHE_PATTERNS.filter(re => re.test(full)).length;
    if (punct > 2 || clichéHits >= 2 || jaccard(d.headline, d.body) > .72 || occurrenceCount(full, brief.recipient ?? "") > 2) risks.add("copy_risk");
    if ((d.confidence ?? 1) < confidenceRepairThreshold()) risks.add("low_confidence");
    if ((d.wowScore ?? 1) < wowRepairThreshold()) risks.add("low_wow");
    if ((d.noveltyScore ?? 1) < noveltyRepairThreshold() && recentStyles?.length) risks.add("low_novelty");
    for (const r of d.riskCodes ?? []) risks.add(r);
  }

  const targets: DirectionDiversityTarget[] = result.directions.map(d => {
    const candidate = candidates?.find(c => c.template.id === d.templateId && c.template.versionId === d.templateVersionId);
    return {
      id: d.id,
      templateId: d.templateId,
      templateVersionId: d.templateVersionId,
      familyId: candidate?.template.familyId ?? "",
      visualDirection: d.visualDirection ?? candidate?.template.visualDirection ?? "unknown",
      photoMode: d.photoMode ?? candidate?.template.photoMode ?? "none",
      materialWorld: candidate?.template.materialWorld,
      colorWorld: candidate?.template.colorWorld,
      energy: candidate?.template.energy,
      archetype: candidate ? templateArchetype(candidate.template) : directionArchetype(d),
      signatureMove: d.signatureMove,
      creativeThesis: d.creativeThesis,
    };
  });

  const archetypes = new Set(targets.map(t => t.archetype ?? directionArchetype({ visualDirection: t.visualDirection, photoMode: (t.photoMode ?? "none") as TemplatePhotoMode } as GeneratedDirection)));
  const visuals = new Set(result.directions.map(d => d.visualDirection ?? "unknown"));

  const alternativesFeasible = candidates ? hasMateriallyDifferentAlternatives(targets, candidates, brief) : true;

  if (visuals.size < 3 && alternativesFeasible) risks.add("creative_range");

  if (archetypes.size === 1 && alternativesFeasible) {
    risks.add("creative_range");
  }

  if (isVisualSiblingTrio(targets) && alternativesFeasible) {
    risks.add("creative_range");
  }

  for (let i = 0; i < result.directions.length; i++) {
    for (let j = i + 1; j < result.directions.length; j++) {
      const a = result.directions[i], b = result.directions[j];
      const copyA = semanticDetectorText(`${a.headline} ${a.body}`, brief);
      const copyB = semanticDetectorText(`${b.headline} ${b.body}`, brief);
      if (jaccard(copyA, copyB) > .62 || jaccard(a.creativeThesis ?? "", b.creativeThesis ?? "") > .68) risks.add("creative_range");
      if (a.templateId && a.templateId === b.templateId) risks.add("creative_range");
    }
  }
  return [...risks];
}

export function resolveCandidateDiversityTargets(directions:GeneratedDirection[],candidates:RankedTemplate[]):DirectionDiversityTarget[]{
  return directions.map(direction=>{
    const candidate=candidates.find(c=>c.template.id===direction.templateId&&c.template.versionId===direction.templateVersionId);
    if(!candidate)throw new Error("ai_critic_candidate_missing");
    return{
      id:direction.id,
      templateId:candidate.template.id,
      templateVersionId:candidate.template.versionId,
      familyId:candidate.template.familyId,
      visualDirection:candidate.template.visualDirection,
      photoMode:candidate.template.photoMode,
      materialWorld:candidate.template.materialWorld,
      colorWorld:candidate.template.colorWorld,
      energy:candidate.template.energy,
      archetype:templateArchetype(candidate.template),
      signatureMove:direction.signatureMove,
      creativeThesis:direction.creativeThesis,
      name:candidate.template.name
    };
  });
}

export async function criticRepairDirections(provider:AIProvider,brief:GenerationBrief,result:GenerationResult,candidates:RankedTemplate[],risks:string[],budget?:GenerationBudget):Promise<{result:GenerationResult;telemetry:AICallTelemetry}>{
  if(budget)budget.ensureAiBudget();
  const resolvedInitial=resolveCandidateDiversityTargets(result.directions,candidates);
  if (isLegacyCandidateContext(candidates, brief)) {
    validateThreeDirectionDiversity(resolvedInitial);
  } else {
    validateThreeDirectionDiversity(resolvedInitial, candidates, brief);
  }
  const allowTemplateSwap=risks.includes("creative_range");
  const riskyIds=new Set(result.directions.filter((d:GeneratedDirection)=>(d.riskCodes??[]).length||(d.confidence??1)<confidenceRepairThreshold()||(d.wowScore??1)<wowRepairThreshold()||((d.noveltyScore??1)<noveltyRepairThreshold())).map((d:GeneratedDirection)=>d.id));if(allowTemplateSwap||risks.includes("copy_risk"))for(const d of result.directions)riskyIds.add(d.id);
  if(!riskyIds.size)return{result,telemetry:{phase:"critic_repair",provider:provider.providerName,model:provider.modelName,latencyMs:0,success:true}};
  const targets=result.directions.filter(d=>riskyIds.has(d.id));const system=`You are CardeLume's premium creative critic. Repair only the supplied risky directions. ${allowTemplateSwap?"Because creative range is weak, you MAY replace a risky direction with another supplied immutable template/version pair when that creates a materially stronger, more distinct premium concept.":"Keep every template ID/version fixed."} Increase emotional specificity, premium restraint, creative separation and memorability. Preserve the semantic copy contract in the brief locale: the occasion and a supplied recipient should appear in at least two of the three directions, a supplied detail in at least one, and the feeling should be expressed across the set — do not stuff a feeling synonym into every card, and prefer natural premium sentences over keyword stuffing. Never add facts not present in the brief. Never invent template IDs or controls. Return JSON only.`;
  const relevantCandidates=allowTemplateSwap?candidates:candidates.filter(c=>targets.some(d=>d.templateId===c.template.id&&d.templateVersionId===c.template.versionId));
  const prompt=JSON.stringify({task:"critic_repair",allowTemplateSwap,brief,semanticCopyContract:semanticCopyContract(brief),risks,candidates:candidateContext(relevantCandidates),directions:targets,outputContract:{repairs:targets.map((d:GeneratedDirection)=>({id:d.id,templateId:allowTemplateSwap?"candidate uuid; omit to keep":"must remain fixed",templateVersionId:allowTemplateSwap?"matching candidate version uuid; omit to keep":"must remain fixed",creativeThesis:"stronger distinct thesis",customerRationale:"customer-facing, same language as brief, 4-14 words; emotional fit only",signatureMove:SIGNATURE_MOVES,accentMode:ACCENTS,kicker:"<=8 words",headline:"<=14 words",body:"<=45 words",semanticRequirements:["occasion","feeling","recipient when supplied","detail when supplied","brief locale"],confidence:"0..1",noveltyScore:"0..1",wowScore:"0..1"}))}});
  assertPromptBudget(prompt);
  if(budget)budget.ensureAiBudget();
  const phaseTimeout=budget?budget.clampTimeoutMs(timeoutMs()):timeoutMs();
  const response=await provider.generateJson({system,prompt,timeoutMs:phaseTimeout});
  const raw=response.data;const repairPayload=raw&&typeof raw==="object"?raw as {repairs?:unknown;directions?:unknown}:undefined;const repairsValue=repairPayload?.repairs??repairPayload?.directions;if(!Array.isArray(repairsValue))throw new Error("ai_critic_invalid_response");const repairs=repairsValue;
  const merged=result.directions.map((original,repairIndex)=>{const r=repairs.find(v=>v&&typeof v==="object"&&(v as {id?:unknown}).id===original.id) as Record<string,unknown>|undefined;if(!r)return original;
    let templateId=original.templateId,templateVersionId=original.templateVersionId;if(allowTemplateSwap){const requestedId=str(r.templateId,80),requestedVersion=str(r.templateVersionId,80);if(requestedId||requestedVersion){if(!requestedId||!requestedVersion)throw new Error("ai_critic_template_pair_invalid");templateId=requestedId;templateVersionId=requestedVersion;}}
    const candidate=candidates.find(c=>c.template.id===templateId&&c.template.versionId===templateVersionId);if(!candidate)throw new Error("ai_critic_candidate_missing");const recipe=templateCreativeRecipe(candidate.template);let signatureMove=str(r.signatureMove,60) as SignatureMove;if(!recipe.signatureMoves.includes(signatureMove))signatureMove=original.signatureMove&&recipe.signatureMoves.includes(original.signatureMove)?original.signatureMove:recipe.signatureMoves[0];let accentMode=str(r.accentMode,20) as CreativeAccentMode;if(!recipe.preferredAccents.includes(accentMode))accentMode=original.accentMode&&recipe.preferredAccents.includes(original.accentMode)?original.accentMode:recipe.preferredAccents[0];if(accentMode==="photo"&&(!brief.hasPhoto||candidate.template.photoMode==="none"))accentMode="original";const thesis=str(r.creativeThesis,360)||original.creativeThesis;if(!thesis||thesis.length<24)throw new Error("ai_critic_thesis_too_weak");const customerRationale=safeCustomerRationale(r.customerRationale)||original.customerRationale||semanticCustomerRationale(brief,repairIndex);const next={...original,templateId:candidate.template.id,templateVersionId:candidate.template.versionId,templateName:candidate.template.name,presentation:resolveCanonicalPresentationFromTemplate(candidate.template,{locale:brief.locale,format:brief.format}),visualDirection:candidate.template.visualDirection,photoMode:candidate.template.photoMode,creativeThesis:thesis,customerRationale,signatureMove,accentMode,kicker:str(r.kicker,100)||original.kicker,headline:str(r.headline,180)||original.headline,body:str(r.body,360)||original.body,confidence:num(r.confidence,original.confidence??.8),noveltyScore:num(r.noveltyScore,original.noveltyScore??.8),wowScore:num(r.wowScore,original.wowScore??.8),riskCodes:[]};validateDirectionCopy(next,brief);return next;});
  const families=new Set<string>();const exactTemplates=new Set<string>();
  const criticSeenKeys = seenTemplateKeys(brief);
  for(const direction of merged){
    const candidate=candidates.find(c=>c.template.id===direction.templateId&&c.template.versionId===direction.templateVersionId);
    if(!candidate)throw new Error("ai_critic_candidate_missing");
    if(families.has(candidate.template.familyId))throw new Error("ai_critic_family_duplicate");
    families.add(candidate.template.familyId);
    const key=`${candidate.template.id}:${candidate.template.versionId}`;
    if(exactTemplates.has(key)||exactTemplates.has(candidate.template.id))throw new Error("ai_critic_template_duplicate");
    const unusedUnseen = candidates.filter(c => !criticSeenKeys.has(templatePairKey(c.template)) && !exactTemplates.has(`${c.template.id}:${c.template.versionId}`));
    if(criticSeenKeys.has(templatePairKey(candidate.template)) && unusedUnseen.length > 0){
      throw new Error("ai_critic_seen_duplicate");
    }
    exactTemplates.add(key);exactTemplates.add(candidate.template.id);
    if(candidate.template.status!=="active"||candidate.template.health!=="healthy"||candidate.template.launchStatus==="hold"||candidate.template.launchStatus==="retired")throw new Error("ai_template_not_eligible");
    if(!brief.hasPhoto&&(candidate.template.photoMode==="required"||candidate.template.visualDirection==="photo"))throw new Error("ai_invalid_photo_direction");
  }
  const resolvedRepairs=resolveCandidateDiversityTargets(merged,candidates);
  if (isLegacyCandidateContext(candidates, brief)) {
    validateThreeDirectionDiversity(resolvedRepairs);
  } else {
    validateThreeDirectionDiversity(resolvedRepairs, candidates, brief);
  }
  const parsed=GenerationResultSchema.parse({directions:merged});assertCreativeDirectionDiversity(parsed,candidates,brief);return{result:parsed,telemetry:telemetry("critic_repair",response)};
}

// Backward-compatible Step 12 entry point retained for tests/curated integration.
export async function generateCardeLumeDirections(provider:AIProvider,brief:GenerationBrief,candidates?:Array<Pick<RankedTemplate["template"],"id"|"versionId"|"name"|"visualDirection"|"photoMode"|"familyId"|"editorialScore">>):Promise<GenerationResult>{
  if(!candidates||candidates.length<3){const slots=[...expectedDirectionIds(brief)];const legacy=slots.map((id,index)=>({id,...semanticCopyForSlot(brief,id,index)}));const parsed=GenerationResultSchema.parse({directions:legacy});assertSemanticCopyContract(parsed,brief);return parsed;}
  const ranked:RankedTemplate[]=candidates.map((template,index):RankedTemplate=>({template:{...template,version:1,slug:template.name,material:"",rendererTemplateKey:template.visualDirection,status:"active",launchStatus:"candidate",health:"healthy",photoMode:template.photoMode,editorialScore:template.editorialScore??90,maturity:"proven",supportedFormats:[brief.format],scriptSupport:[brief.locale.startsWith("ko")?"hangul":brief.locale.startsWith("ja")||brief.locale.startsWith("zh")?"cjk":"latin"],headlineCapacity:"medium",bodyCapacity:"medium",feelings:[],occasions:[],markets:[],excludedMarkets:[],materialWorld:"editorial_luxury",materialCues:["paper grain"],energy:"warm",colorWorld:"ivory",motionProfile:"static_paper",localeStrengths:[brief.locale],printFormatStrength:[brief.format]},score:1-index*.01,baseScore:1-index*.01,marketScore:.7,reasons:[],components:{relevance:.8,market:.7,editorial:.9,performance:.8,textFit:1,freshness:.7,photoFit:1,noveltyPenalty:0}}));const outcome=await generateCreativeDirectorDirections(provider,brief,ranked);if(outcome.kind!=="ready")throw new Error("ai_unexpected_expansion");return outcome.result;
}
export const SUPPORTED_OCCASIONS = [
  "Birthday",
  "Anniversary",
  "Thank You",
  "Congratulations",
  "New Baby",
  "Other",
] as const;

export type SupportedOccasion = (typeof SUPPORTED_OCCASIONS)[number];

export function isSupportedOccasion(occasion: unknown): occasion is SupportedOccasion {
  if (typeof occasion !== "string") return false;
  const norm = occasion.trim().toLowerCase();
  return SUPPORTED_OCCASIONS.some(o => o.toLowerCase() === norm) || norm === "general";
}

// Bounded deterministic fallback — no AI provider, no retry loop, no invented identity.
// Requires exactly three eligible, pre-ranked RankedTemplate candidates from the
// runtime catalog. Production callers still require approved candidates; a staging
// caller may explicitly opt into the already-filtered staging catalog.
// Every customer-visible field
// (templateId, templateVersionId, templateName, visualDirection, photoMode) is sourced
// from the candidate object; static copy and recipe values are the only additions.
// Slots are matched by templateArchetype — never by array position.
export function buildDeterministicCreativeFallback(brief:GenerationBrief,candidates:RankedTemplate[],metadata?:{exhaustionState?:"none"|"partial"|"total";allowStagingCandidates?:boolean}):GenerationResult{
  if(!brief||!compactSemanticText(brief.occasion,80))throw new Error("ai_fallback_unavailable");
  if(candidates.length!==3)throw new Error("ai_fallback_unavailable");
  const slots=[...expectedDirectionIds(brief)];
  const isBirthday=comparableCopy(brief.occasion)==="birthday";
  for(const candidate of candidates){
    const t=candidate.template;
    if(t.status!=="active"||t.health!=="healthy"||t.launchStatus==="hold"||t.launchStatus==="retired"||(!metadata?.allowStagingCandidates&&t.launchStatus!=="approved"))throw new Error("ai_fallback_template_not_eligible");
    if(!t.id||!t.versionId||!t.name||!t.visualDirection)throw new Error("ai_fallback_template_not_eligible");
    if(!isBirthday&&/\bbirthday\b/i.test(`${t.name} ${t.slug??""}`))throw new Error("ai_fallback_template_not_eligible");
  }
  const exactPairs=new Set<string>();
  for(const candidate of candidates){
    const key=`${candidate.template.id}:${candidate.template.versionId}`;
    if(exactPairs.has(key))throw new Error("ai_fallback_template_not_eligible");
    exactPairs.add(key);
  }
  const familyIds=new Set<string>();
  for(const candidate of candidates){
    if(familyIds.has(candidate.template.familyId))throw new Error("ai_fallback_template_not_eligible");
    familyIds.add(candidate.template.familyId);
  }
  const usedCandidates = new Set<string>();
  if(new Set(candidates.map(c=>templateArchetype(c.template))).size<2&&metadata?.exhaustionState!=="total")throw new Error("ai_fallback_unavailable");
  const directions=slots.map((slot,i)=>{
    // Match by templateArchetype — identity always comes from the matched candidate, never from slot name.
    const slotArchetype:TemplateArchetype=slot==="photo"?"photo":slot==="midnight"?"midnight":slot==="quiet"?"quiet":"editorial";
    let candidate=candidates.find(c=>!usedCandidates.has(c.template.id)&&templateArchetype(c.template)===slotArchetype);
    if(!candidate){
      candidate=candidates.find(c=>!usedCandidates.has(c.template.id));
    }
    if(!candidate)throw new Error("ai_fallback_unavailable");
    usedCandidates.add(candidate.template.id);
    const t=candidate.template;
    const recipe=templateCreativeRecipe(t);
    const signatureMove:SignatureMove=recipe.signatureMoves[0];
    let accentMode:CreativeAccentMode=recipe.preferredAccents[0]??"original";
    if(accentMode==="photo"&&(!brief.hasPhoto||t.photoMode==="none"))accentMode="original";
    const copy=deterministicFallbackCopy(brief,slot,i,t);
    return{
      id:slot,
      templateId:t.id,
      templateVersionId:t.versionId,
      templateName:t.name,
      visualDirection:t.visualDirection,
      photoMode:t.photoMode,
      presentation:resolveCanonicalPresentationFromTemplate(t,{locale:brief.locale,format:brief.format}),
      signatureMove,
      accentMode,
      ...copy,
      confidence:.80,
      noveltyScore:.70,
      wowScore:.75,
      riskCodes:[] as string[],
    };
  });
  const parsed=GenerationResultSchema.parse({
    directions,
    exhaustionState: metadata?.exhaustionState && metadata.exhaustionState !== "none" ? metadata.exhaustionState : undefined,
    generationSource: "recovery"
  });
  assertSemanticCopyContract(parsed,brief);
  return parsed;
}

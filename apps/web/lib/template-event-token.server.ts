import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export type TemplateEventSource="ai_direction"|"recommended"|"market_pick"|"show_more";
export type TemplateBrowserEventType="impression"|"selected"|"regenerated";
export type TemplateEventTokenInput={templateId:string;templateVersionId:string;source:TemplateEventSource;rankPosition:number;market:string;locale:string;anonymousId:string};
type TokenPayload={v:2;tid:string;vid:string;src:TemplateEventSource;pos:number;market:string;locale:string;aid:string;sid:string;exp:number};
const SOURCES=new Set<TemplateEventSource>(["ai_direction","recommended","market_pick","show_more"]);
const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function secret(){
  const value=process.env.TEMPLATE_EVENT_SECRET;
  if(value&&value.length>=32)return value;
  if(process.env.NODE_ENV!=="production")return "cardelume-dev-template-event-secret-32-bytes";
  throw new Error("TEMPLATE_EVENT_SECRET is required");
}
function b64(value:string|Buffer){return Buffer.from(value).toString("base64url");}
function signature(payload:string){return createHmac("sha256",secret()).update(payload).digest("base64url");}
function normalized(input:TemplateEventTokenInput){return{templateId:input.templateId,templateVersionId:input.templateVersionId,source:input.source,rankPosition:Math.floor(input.rankPosition),market:input.market.slice(0,16).toUpperCase(),locale:input.locale.slice(0,20),anonymousId:input.anonymousId.toLowerCase()};}
function payload(value:unknown):TokenPayload|null{
  if(!value||typeof value!=="object")return null;const v=value as Record<string,unknown>;
  if(v.v!==2||typeof v.tid!=="string"||typeof v.vid!=="string"||typeof v.src!=="string"||!SOURCES.has(v.src as TemplateEventSource)||!Number.isInteger(v.pos)||typeof v.market!=="string"||typeof v.locale!=="string"||typeof v.aid!=="string"||typeof v.sid!=="string"||!Number.isInteger(v.exp))return null;
  if((v.pos as number)<1||(v.pos as number)>24||v.market.length<2||v.market.length>16||v.locale.length<2||v.locale.length>20||!UUID_RE.test(v.aid as string)||(v.sid as string).length<16||(v.sid as string).length>64)return null;
  return v as TokenPayload;
}
export function issueTemplateEventToken(input:TemplateEventTokenInput,ttlSeconds=600){
  const n=normalized(input);const raw=JSON.stringify({v:2,tid:n.templateId,vid:n.templateVersionId,src:n.source,pos:n.rankPosition,market:n.market,locale:n.locale,aid:n.anonymousId,sid:randomBytes(12).toString("base64url"),exp:Math.floor(Date.now()/1000)+Math.max(60,Math.min(1800,Math.floor(ttlSeconds)))} satisfies TokenPayload);
  const encoded=b64(raw);return`${encoded}.${signature(encoded)}`;
}
export function verifyTemplateEventToken(token:string,input:TemplateEventTokenInput){
  try{
    const [encoded,sig,extra]=token.split(".");if(!encoded||!sig||extra)return false;
    const expected=signature(encoded);const a=Buffer.from(sig),b=Buffer.from(expected);if(a.length!==b.length||!timingSafeEqual(a,b))return false;
    const parsed=payload(JSON.parse(Buffer.from(encoded,"base64url").toString("utf8")));if(!parsed||parsed.exp<Math.floor(Date.now()/1000))return false;
    const n=normalized(input);return parsed.tid===n.templateId&&parsed.vid===n.templateVersionId&&parsed.src===n.source&&parsed.pos===n.rankPosition&&parsed.market===n.market&&parsed.locale===n.locale&&parsed.aid===n.anonymousId;
  }catch{return false;}
}
export function templateEventDedupeKey(token:string,anonymousId:string,eventType:TemplateBrowserEventType){
  return createHmac("sha256",secret()).update(`template-event-v1|${anonymousId.toLowerCase()}|${eventType}|${token}`).digest("hex");
}

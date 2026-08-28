import { createHmac, timingSafeEqual } from "node:crypto";

export class DodoWebhookVerificationError extends Error{
  constructor(message:string){super(message);this.name="DodoWebhookVerificationError";}
}

function decodedWebhookKey(secret:string){
  const encoded=secret.startsWith("whsec_")?secret.slice(6):secret;
  if(!encoded)throw new DodoWebhookVerificationError("webhook_secret_empty");
  if(!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded))throw new DodoWebhookVerificationError("webhook_secret_invalid");
  let key:Buffer;
  try{key=Buffer.from(encoded,"base64");}catch{throw new DodoWebhookVerificationError("webhook_secret_invalid");}
  if(key.length<24||key.length>128)throw new DodoWebhookVerificationError("webhook_secret_invalid");
  return key;
}

function headerValue(headers:Headers|Record<string,string|undefined>,name:string){
  if(headers instanceof Headers)return headers.get(name);
  const direct=headers[name]??headers[name.toLowerCase()]??headers[name.toUpperCase()];
  return direct??null;
}

export function verifyDodoStandardWebhook(input:{
  rawBody:Uint8Array;
  headers:Headers|Record<string,string|undefined>;
  secret:string;
  nowSeconds?:number;
  toleranceSeconds?:number;
}){
  const id=headerValue(input.headers,"webhook-id");
  const timestampRaw=headerValue(input.headers,"webhook-timestamp");
  const signatureHeader=headerValue(input.headers,"webhook-signature");
  if(!id||!timestampRaw||!signatureHeader)throw new DodoWebhookVerificationError("webhook_headers_missing");
  if(id.length>200||id.includes("."))throw new DodoWebhookVerificationError("webhook_id_invalid");
  if(!/^\d{9,12}$/.test(timestampRaw))throw new DodoWebhookVerificationError("webhook_timestamp_invalid");
  const timestamp=Number(timestampRaw);
  const now=input.nowSeconds??Math.floor(Date.now()/1000);
  const tolerance=Math.max(30,Math.min(900,input.toleranceSeconds??300));
  if(Math.abs(now-timestamp)>tolerance)throw new DodoWebhookVerificationError("webhook_timestamp_out_of_range");

  const prefix=Buffer.from(`${id}.${timestampRaw}.`,"utf8");
  const signed=Buffer.concat([prefix,Buffer.from(input.rawBody)]);
  const expected=createHmac("sha256",decodedWebhookKey(input.secret)).update(signed).digest();
  const candidates=signatureHeader.trim().split(/\s+/).slice(0,32);
  let matched=false;
  for(const candidate of candidates){
    const comma=candidate.indexOf(",");
    if(comma<0||candidate.slice(0,comma)!=="v1")continue;
    const encoded=candidate.slice(comma+1);
    let received:Buffer;
    try{received=Buffer.from(encoded,"base64");}catch{continue;}
    if(received.length===expected.length&&timingSafeEqual(received,expected)){matched=true;break;}
  }
  if(!matched)throw new DodoWebhookVerificationError("webhook_signature_invalid");
  return{eventId:id,timestamp};
}

export function signDodoStandardWebhookForTest(input:{rawBody:Uint8Array;eventId:string;timestamp:number;secret:string}){
  const prefix=Buffer.from(`${input.eventId}.${input.timestamp}.`,"utf8");
  const signed=Buffer.concat([prefix,Buffer.from(input.rawBody)]);
  const signature=createHmac("sha256",decodedWebhookKey(input.secret)).update(signed).digest("base64");
  return `v1,${signature}`;
}

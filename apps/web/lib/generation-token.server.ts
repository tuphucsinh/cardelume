import { createHmac, timingSafeEqual } from "node:crypto";

function secret(){
  const value=process.env.GENERATION_STATUS_SECRET;
  if(value)return value;
  if((process.env.APP_MODE??"mock")==="mock")return"cardelume-mock-generation-status-secret";
  throw new Error("GENERATION_STATUS_SECRET_required");
}

function statusTokenTtlMinutes(){
  const n=Number(process.env.GENERATION_STATUS_TTL_MINUTES||15);
  return Number.isFinite(n)?Math.max(5,Math.min(60,Math.floor(n))):15;
}

function statusSignature(jobId:string,userId:string,expiresAt:number){
  return createHmac("sha256",secret()).update(`${jobId}:${userId}:${expiresAt}`).digest("base64url");
}

export function issueGenerationStatusToken(jobId:string,userId:string,nowMs=Date.now()){
  const expiresAt=Math.floor(nowMs/1000)+statusTokenTtlMinutes()*60;
  return `${expiresAt}.${statusSignature(jobId,userId,expiresAt)}`;
}

export function verifyGenerationStatusToken(token:string,jobId:string,userId:string,nowMs=Date.now()){
  const [rawExpiry,signature,extra]=token.split(".");
  if(!rawExpiry||!signature||extra)return false;
  const expiresAt=Number(rawExpiry),now=Math.floor(nowMs/1000);
  if(!Number.isSafeInteger(expiresAt)||expiresAt<now)return false;
  if(expiresAt>now+62*60)return false;
  const expected=Buffer.from(statusSignature(jobId,userId,expiresAt));
  const received=Buffer.from(signature);
  return expected.length===received.length&&timingSafeEqual(expected,received);
}

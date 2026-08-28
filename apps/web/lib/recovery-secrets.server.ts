import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export function randomRecoverySecret(bytes=32){
  return randomBytes(bytes).toString("base64url");
}

export function hashRecoverySecret(secret:string){
  return createHash("sha256").update(secret,"utf8").digest("hex");
}

function checkoutReturnSecret(){
  const configured=process.env.CHECKOUT_RETURN_SECRET;
  if(configured&&configured.length>=32)return configured;
  if((process.env.APP_MODE??"mock")==="mock")return"cardelume-mock-checkout-return-secret-32-bytes";
  throw new Error("CHECKOUT_RETURN_SECRET_required");
}

// The provider return claim is short-lived and deterministic per order. This
// keeps the raw claim out of the database while allowing a safe checkout retry
// to reproduce the exact same return URL after an ambiguous provider request.
export function checkoutReturnClaimSecret(orderId:string){
  return createHmac("sha256",checkoutReturnSecret())
    .update(`cardelume:checkout-return:v1:${orderId}`,"utf8")
    .digest("base64url");
}

export function recoveryCookieName(recoveryId:string){
  const suffix=createHash("sha256").update(recoveryId,"utf8").digest("hex").slice(0,14);
  return `cardelume_recovery_${suffix}`;
}

export function safeSecretEquals(secret:string,expectedHash:string){
  const actual=Buffer.from(hashRecoverySecret(secret),"hex");
  const expected=Buffer.from(expectedHash,"hex");
  return actual.length===expected.length&&timingSafeEqual(actual,expected);
}

function intEnv(name:string,fallback:number,min:number,max:number){
  const raw=Number(process.env[name]);
  if(!Number.isFinite(raw))return fallback;
  return Math.max(min,Math.min(max,Math.round(raw)));
}

export function recoveryConfig(){
  return{
    recoveryDays:intEnv("RECOVERY_TOKEN_TTL_DAYS",365,7,730),
    browserSessionDays:intEnv("RECOVERY_SESSION_TTL_DAYS",365,1,730),
    returnClaimMinutes:intEnv("CHECKOUT_RETURN_CLAIM_TTL_MINUTES",60,10,240),
    returnReplayGraceMinutes:intEnv("CHECKOUT_RETURN_REPLAY_GRACE_MINUTES",10,1,30),
    signedDownloadSeconds:intEnv("RECOVERY_DOWNLOAD_URL_TTL_SECONDS",90,30,300)
  };
}

export function plusDays(days:number){
  return new Date(Date.now()+days*86_400_000);
}

export function plusMinutes(minutes:number){
  return new Date(Date.now()+minutes*60_000);
}

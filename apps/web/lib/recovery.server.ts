import "server-only";
import {
  createPurchaseRecoveryRecord,
  redeemCheckoutReturnClaim,
  redeemPurchaseRecoveryToken,
  upsertCheckoutReturnClaimRecord,
  validateRecoverySession,
  type RecoveryAccess
} from "@cardelume/db";
import {
  checkoutReturnClaimSecret,
  hashRecoverySecret,
  plusDays,
  plusMinutes,
  randomRecoverySecret,
  recoveryConfig
} from "./recovery-secrets.server";

function siteUrl(){
  return (process.env.NEXT_PUBLIC_SITE_URL||"https://cardelume.com").replace(/\/$/,"");
}

export async function issuePaidRecovery(input:{orderId:string;userId:string}){
  const cfg=recoveryConfig();
  const token=randomRecoverySecret();
  const result=await createPurchaseRecoveryRecord({
    orderId:input.orderId,
    userId:input.userId,
    tokenHash:hashRecoverySecret(token),
    expiresAt:plusDays(cfg.recoveryDays)
  });
  return{
    ...result,
    // Only the first successful creation can safely return a usable raw token.
    // Duplicate webhook events must not invent a second token whose hash is not stored.
    recoveryClaimUrl:result.created?`${siteUrl()}/r/${result.recoveryId}/${token}`:null
  };
}

export async function issueCheckoutReturnClaim(orderId:string){
  const cfg=recoveryConfig();
  const claim=checkoutReturnClaimSecret(orderId);
  const claimId=await upsertCheckoutReturnClaimRecord({
    orderId,
    claimHash:hashRecoverySecret(claim),
    expiresAt:plusMinutes(cfg.returnClaimMinutes)
  });
  if(!claimId)throw new Error("checkout_return_claim_already_consumed");
  return{
    claim,
    returnUrl:`${siteUrl()}/checkout/return/${orderId}/${claim}`
  };
}

export async function claimDurableRecovery(input:{recoveryId:string;token:string}){
  const cfg=recoveryConfig();
  const sessionSecret=randomRecoverySecret();
  const access=await redeemPurchaseRecoveryToken({
    recoveryId:input.recoveryId,
    tokenHash:hashRecoverySecret(input.token),
    sessionHash:hashRecoverySecret(sessionSecret),
    sessionExpiresAt:plusDays(cfg.browserSessionDays)
  });
  return access?{access,sessionSecret}:null;
}

export async function claimCheckoutReturn(input:{orderId:string;claim:string}){
  const cfg=recoveryConfig();
  const sessionSecret=randomRecoverySecret();
  const result=await redeemCheckoutReturnClaim({
    orderId:input.orderId,
    claimHash:hashRecoverySecret(input.claim),
    sessionHash:hashRecoverySecret(sessionSecret),
    sessionExpiresAt:plusDays(cfg.browserSessionDays),
    replayGraceMinutes:cfg.returnReplayGraceMinutes
  });
  return result.status==="ready"?{...result,sessionSecret}:result;
}

export async function verifyRecoveryBrowserSession(input:{recoveryId:string;sessionSecret:string|null|undefined}):Promise<RecoveryAccess|null>{
  if(!input.sessionSecret)return null;
  return validateRecoverySession({
    recoveryId:input.recoveryId,
    sessionHash:hashRecoverySecret(input.sessionSecret)
  });
}

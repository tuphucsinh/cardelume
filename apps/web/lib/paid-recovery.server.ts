import "server-only";
import type { EmailProvider } from "@cardelume/core";
import { normalizeLocale } from "../i18n/messages";
import { buildRecoveryEmail } from "./recovery-email";
import { issuePaidRecovery } from "./recovery.server";

// Call this only AFTER a verified payment webhook has persisted orders.status='paid'.
// Locale is owned by the order, not re-supplied by payment-provider metadata or
// recovered through a Card-domain join.
export async function provisionPaidRecovery(input:{
  orderId:string;
  userId:string;
  recoveryEmail?:string|null;
  emailProvider?:EmailProvider|null;
}){
  const recovery=await issuePaidRecovery({orderId:input.orderId,userId:input.userId});
  if(recovery.created&&recovery.recoveryClaimUrl&&input.recoveryEmail&&input.emailProvider){
    const email=buildRecoveryEmail(normalizeLocale(recovery.locale),recovery.recoveryClaimUrl);
    await input.emailProvider.send({to:input.recoveryEmail,subject:email.subject,text:email.text});
  }
  return recovery;
}

import "server-only";
import type { EmailProvider } from "@cardelume/core";
import { enqueuePaidFinalRenders } from "./final-render.server";
import { provisionPaidRecovery } from "./paid-recovery.server";

// Single orchestration point for a future VERIFIED payment webhook.
// The webhook must persist orders.status='paid' first; both called services
// independently re-check authoritative paid/order state.
export async function fulfillVerifiedPaidOrder(input:{
  orderId:string;
  userId:string;
  recoveryEmail?:string|null;
  emailProvider?:EmailProvider|null;
}){
  const recovery=await provisionPaidRecovery(input);
  const finalJobs=await enqueuePaidFinalRenders(input.orderId);
  return{recovery,finalJobs};
}

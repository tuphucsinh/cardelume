import "server-only";

type SecurityEvent=
  | "dodo_webhook_verified"
  | "dodo_webhook_rejected"
  | "dodo_webhook_payload_rejected"
  | "dodo_paid_fulfillment_retry"
  | "rate_limit_enforced"
  | "recovery_download_denied";

const safeString=(value:unknown,max=80)=>typeof value==="string"?value.replace(/[^A-Za-z0-9_.:\/-]/g,"_").slice(0,max):undefined;
export function securityEvent(event:SecurityEvent,fields:Record<string,unknown>={}){
  const safe:Record<string,string|number|boolean>={};
  for(const [key,value] of Object.entries(fields)){
    if(typeof value==="number"||typeof value==="boolean")safe[key]=value;
    else {const normalized=safeString(value);if(normalized)safe[key]=normalized;}
  }
  // Deliberately never accepts headers/cookies/tokens/raw request bodies.
  console.warn(JSON.stringify({level:"warn",category:"security",event,...safe}));
}

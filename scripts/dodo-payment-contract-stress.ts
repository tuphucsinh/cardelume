import { randomBytes } from "node:crypto";
import {
  DodoWebhookVerificationError,
  signDodoStandardWebhookForTest,
  verifyDodoStandardWebhook
} from "../apps/web/lib/dodo-webhook.ts";

function assert(value:unknown,message:string):asserts value{
  if(!value)throw new Error(message);
}
function expectVerificationFailure(run:()=>unknown,code:string){
  try{run();throw new Error(`expected_${code}`);}
  catch(error){
    assert(error instanceof DodoWebhookVerificationError,`wrong_error_type:${code}`);
    assert(error.message===code,`wrong_error_code:${error.message}:${code}`);
  }
}

const secret=`whsec_${randomBytes(32).toString("base64")}`;
const now=1_800_000_000;
const eventId="msg_cardelume_step6_contract";
const rawBody=new TextEncoder().encode(JSON.stringify({
  type:"payment.succeeded",
  data:{payment_id:"pay_test",checkout_session_id:"cks_test",total_amount:299,currency:"USD",status:"succeeded"}
}));
const signature=signDodoStandardWebhookForTest({rawBody,eventId,timestamp:now,secret});
const headers={
  "webhook-id":eventId,
  "webhook-timestamp":String(now),
  "webhook-signature":signature
};

const verified=verifyDodoStandardWebhook({rawBody,headers,secret,nowSeconds:now});
assert(verified.eventId===eventId,"valid_signature_rejected");

// Standard Webhooks may include multiple signatures during key rotation.
verifyDodoStandardWebhook({
  rawBody,
  headers:{...headers,"webhook-signature":`v1,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= ${signature}`},
  secret,
  nowSeconds:now
});

const changed=new TextEncoder().encode(new TextDecoder().decode(rawBody).replace("299","399"));
expectVerificationFailure(
  ()=>verifyDodoStandardWebhook({rawBody:changed,headers,secret,nowSeconds:now}),
  "webhook_signature_invalid"
);
expectVerificationFailure(
  ()=>verifyDodoStandardWebhook({rawBody,headers,secret,nowSeconds:now+301,toleranceSeconds:300}),
  "webhook_timestamp_out_of_range"
);
expectVerificationFailure(
  ()=>verifyDodoStandardWebhook({rawBody,headers:{...headers,"webhook-signature":undefined},secret,nowSeconds:now}),
  "webhook_headers_missing"
);
expectVerificationFailure(
  ()=>verifyDodoStandardWebhook({rawBody,headers,secret:"whsec_not-base64!",nowSeconds:now}),
  "webhook_secret_invalid"
);

console.log("Dodo Standard Webhooks contract: PASS");

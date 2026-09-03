import fs from "node:fs";

function must(value:boolean,message:string){if(!value)throw new Error(message);}
const checkout=fs.readFileSync("apps/web/app/api/checkout/route.ts","utf8");
const client=fs.readFileSync("apps/web/components/card-studio.tsx","utf8");
const dodo=fs.readFileSync("apps/web/lib/dodo-payments.server.ts","utf8");
const webhook=fs.readFileSync("apps/web/app/api/webhooks/dodo/route.ts","utf8");
const db=fs.readFileSync("packages/db/src/checkout-payment.ts","utf8");
const cardBuilder=fs.readFileSync("apps/web/lib/checkout-card.server.ts","utf8");
const recoveryDb=fs.readFileSync("packages/db/src/recovery.ts","utf8");
const migration=fs.readFileSync("packages/db/migrations/0004_verified_dodo_checkout.sql","utf8");
const prodConfig=fs.readFileSync("apps/web/lib/production-config.server.ts","utf8");
const ready=fs.readFileSync("apps/web/app/health/ready/route.ts","utf8");

must(prodConfig.includes('export type PaymentMode="off"|"on"')||prodConfig.includes('export type PaymentMode = "off" | "on"'),"explicit PaymentMode contract missing");
must(prodConfig.includes("getPaymentMode")&&prodConfig.includes("PAYMENT_MODE"),"server PaymentMode helper or validation missing");
must(prodConfig.includes("isPaymentOff")||prodConfig.includes("paymentMode"),"live readiness does not guard Dodo credentials behind payment mode");
must(ready.includes("paymentMode"),"readiness route does not expose payment mode");
must(checkout.includes('error:"payment_disabled"')&&checkout.includes('mode:"off"')&&checkout.includes("beta:true"),"checkout route missing payment-off response contract");
must(checkout.indexOf("payment_disabled")<checkout.indexOf("createPendingSingleCardOrder({"),"payment-off fail closed must precede order persistence");
must(checkout.indexOf("payment_disabled")<checkout.indexOf("CheckoutSchema.safeParse"),"payment-off fail closed must precede order schema parsing");

must(!checkout.includes("dodo_not_wired"),"legacy 501 Dodo checkout stub remains");
must(checkout.includes("createPendingSingleCardOrder"),"checkout does not persist order/card snapshot before provider");
must(checkout.indexOf("createPendingSingleCardOrder")<checkout.indexOf("createDodoCheckoutSession({"),"provider checkout can run before order persistence");
must(checkout.includes("checkoutRequestHash"),"idempotency request hash missing");
must(checkout.includes("claimProviderCheckoutCreation"),"provider checkout creation lease missing");
must(checkout.includes("trustedPhotoAssetIds:parsed.data.card.photoAssetId"),"trusted photo asset is not passed into checkout binding");
must(checkout.includes('appMode!=="live"'),"production checkout does not fail closed on APP_MODE");
must(client.includes("checkoutAttempt.current"),"client does not reuse idempotency key for identical retry");

must(dodo.includes("product_cart:[{product_id:productId,quantity:1,amount:input.amountMinor}]"),"Dodo dynamic amount is not server quote amount");
must(dodo.includes("billing_currency:currency"),"Dodo billing currency is not pinned to signed quote currency");
must(dodo.includes('allow_currency_selection:false'),"checkout allows provider-side currency drift");
must(dodo.includes('metadata:{')&&dodo.includes('order_id:input.orderId'),"bound order metadata missing");
must(!dodo.includes("await response.text()"),"provider error body must not be forwarded/logged");

must(webhook.includes("await req.arrayBuffer()"),"webhook is not reading exact raw body");
must(!webhook.includes("await req.json()"),"webhook parses JSON before signature verification");
must(webhook.indexOf("verifyDodoWebhook(rawBody")<webhook.indexOf("JSON.parse"),"webhook verifies after JSON parsing");
must(db.includes("exactAmount")&&db.includes("exactCurrency")&&db.includes("exactCheckout"),"authoritative payment reconciliation checks missing");
must(db.indexOf("if(!exactAmount||!exactCurrency||!exactCheckout)")<db.indexOf("update orders set status='paid'"),"PAID transition can precede payment reconciliation");
must(db.includes("paid_pending_fulfillment"),"resumable paid fulfillment marker missing");
must(db.includes("provider_checkout_creation_token"),"server checkout creation lease not persisted");
must(migration.includes("orders_provider_payment_uidx"),"provider payment uniqueness missing");

must(!cardBuilder.includes("typographyFit:snapshot"),"paid CardDocument trusts browser typography fit");
must(recoveryDb.includes("checkout_return_claims.consumed_at is null"),"checkout retry can reopen a consumed return claim");

console.log("verified Dodo payment source boundary: PASS");

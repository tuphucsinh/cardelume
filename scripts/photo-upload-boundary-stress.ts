import { readFileSync } from "node:fs";
const files={
  migration:readFileSync("packages/db/migrations/0005_trusted_photo_assets.sql","utf8"),
  route:readFileSync("apps/web/app/api/uploads/photo/route.ts","utf8"),
  complete:readFileSync("apps/web/app/api/uploads/photo/[assetId]/complete/route.ts","utf8"),
  server:readFileSync("apps/web/lib/photo-upload.server.ts","utf8"),
  checkout:readFileSync("packages/db/src/checkout-payment.ts","utf8"),
  worker:readFileSync("apps/worker/src/index.ts","utf8")
};
function need(ok:boolean,msg:string){if(!ok)throw new Error(msg);}
need(files.migration.includes("card_asset_bindings"),"binding table missing");
need(files.route.includes("verifyPricingQuote"),"upload init must require server-minted session capability");
need(files.server.includes("signPrivateUpload"),"quarantine presign missing");
need(files.server.includes("sanitizePhotoBytes"),"server sanitizer missing");
need(files.checkout.includes("photo_asset_not_ready_or_owned"),"checkout asset ownership/ready guard missing");
need(files.checkout.includes("card_asset_bindings"),"checkout version binding missing");
need(files.worker.includes("loadTrustedAssetsForVersion"),"worker trusted binding load missing");
need(files.worker.includes("trusted_photo_sha256_mismatch"),"worker sha256 verification missing");
need(!files.worker.includes("artworkAssetIds here"),"legacy untrusted asset boundary remains");
console.log("photo upload boundary source stress: PASS");

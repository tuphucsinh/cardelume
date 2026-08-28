import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getRecoveryAsset } from "@cardelume/db";
import { signRecoveryDownload } from "../../../../../lib/private-storage.server";
import { verifyRecoveryBrowserSession } from "../../../../../lib/recovery.server";
import { securityEvent } from "../../../../../lib/security-log.server";
import { recoveryConfig, recoveryCookieName } from "../../../../../lib/recovery-secrets.server";

export const dynamic="force-dynamic";

const Params=z.object({recoveryId:z.string().uuid(),entitlementId:z.string().uuid()});

export async function GET(req:Request,{params}:{params:Promise<{recoveryId:string;entitlementId:string}>}){
  const parsed=Params.safeParse(await params);
  if(!parsed.success)return new NextResponse("Not found",{status:404});
  const jar=await cookies();
  const secret=jar.get(recoveryCookieName(parsed.data.recoveryId))?.value;
  const access=await verifyRecoveryBrowserSession({recoveryId:parsed.data.recoveryId,sessionSecret:secret}).catch(()=>null);
  if(!access){securityEvent("recovery_download_denied",{reason:"session_or_recovery_invalid"});return new NextResponse("Not found",{status:404,headers:{"Cache-Control":"no-store"}});}

  const asset=await getRecoveryAsset(parsed.data).catch(()=>null);
  if(!asset){securityEvent("recovery_download_denied",{reason:"entitlement_not_found"});return new NextResponse("Not found",{status:404,headers:{"Cache-Control":"no-store"}});}

  const signed=await signRecoveryDownload({
    objectKey:asset.objectKey,
    downloadName:asset.downloadName||`cardelume-${asset.assetKind}`,
    contentType:asset.contentType,
    expiresSeconds:recoveryConfig().signedDownloadSeconds
  }).catch(()=>null);
  if(!signed)return new NextResponse("Download unavailable",{status:503,headers:{"Cache-Control":"no-store","Retry-After":"5"}});

  const res=NextResponse.redirect(signed,302);
  res.headers.set("Cache-Control","no-store, max-age=0");
  res.headers.set("Referrer-Policy","no-referrer");
  res.headers.set("X-Robots-Tag","noindex, nofollow, noarchive");
  return res;
}

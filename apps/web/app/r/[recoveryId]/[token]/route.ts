import { NextResponse } from "next/server";
import { z } from "zod";
import { claimDurableRecovery } from "../../../../lib/recovery.server";
import { recoveryConfig, recoveryCookieName } from "../../../../lib/recovery-secrets.server";

export const dynamic="force-dynamic";

const Params=z.object({
  recoveryId:z.string().uuid(),
  token:z.string().regex(/^[A-Za-z0-9_-]{40,100}$/)
});

function headers(){
  return{
    "Cache-Control":"no-store, max-age=0",
    "Referrer-Policy":"no-referrer",
    "X-Robots-Tag":"noindex, nofollow, noarchive"
  };
}

export async function GET(req:Request,{params}:{params:Promise<{recoveryId:string;token:string}>}){
  const parsed=Params.safeParse(await params);
  if(!parsed.success)return new NextResponse("Not found",{status:404,headers:headers()});

  const claimed=await claimDurableRecovery(parsed.data).catch(()=>null);
  if(!claimed)return new NextResponse("Not found",{status:404,headers:headers()});

  const target=new URL(`/d/${claimed.access.recoveryId}`,req.url);
  const res=NextResponse.redirect(target,303);
  Object.entries(headers()).forEach(([k,v])=>res.headers.set(k,v));
  const cfg=recoveryConfig();
  const remaining=Math.max(60,Math.floor((claimed.access.recoveryExpiresAt.getTime()-Date.now())/1000));
  res.cookies.set(recoveryCookieName(claimed.access.recoveryId),claimed.sessionSecret,{
    httpOnly:true,
    secure:process.env.NODE_ENV==="production",
    sameSite:"lax",
    path:`/d/${claimed.access.recoveryId}`,
    maxAge:Math.min(remaining,cfg.browserSessionDays*86_400)
  });
  return res;
}

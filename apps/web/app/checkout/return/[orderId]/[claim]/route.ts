import { NextResponse } from "next/server";
import { z } from "zod";
import { claimCheckoutReturn } from "../../../../../lib/recovery.server";
import { recoveryConfig, recoveryCookieName } from "../../../../../lib/recovery-secrets.server";
import { normalizeLocale, type LocaleCode } from "../../../../../i18n/messages";
import { recoveryCopy } from "../../../../../i18n/recovery-copy";

export const dynamic="force-dynamic";

const Params=z.object({
  orderId:z.string().uuid(),
  claim:z.string().regex(/^[A-Za-z0-9_-]{40,100}$/)
});

function commonHeaders(){
  return{
    "Cache-Control":"no-store, max-age=0",
    "Referrer-Policy":"no-referrer",
    "X-Robots-Tag":"noindex, nofollow, noarchive",
    "Content-Security-Policy":"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
  };
}

function escape(value:string){
  return value.replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]||ch));
}

function waitingHtml(locale:LocaleCode,currentUrl:string){
  const t=recoveryCopy[locale];
  const safeUrl=escape(currentUrl);
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="2;url=${safeUrl}"><title>CardeLume</title><style>html,body{margin:0;min-height:100%;background:#f7f3eb;color:#0b1730;font-family:system-ui,-apple-system,sans-serif}body{min-height:100vh;display:grid;place-items:center;padding:24px;box-sizing:border-box}.card{width:min(520px,100%);background:#fffdf8;border:1px solid rgba(11,23,48,.09);border-radius:24px;padding:34px;box-shadow:0 20px 70px rgba(11,23,48,.08);text-align:center}.mark{font-family:Georgia,serif;letter-spacing:.12em;font-size:14px}.dot{width:8px;height:8px;border-radius:50%;background:#b99762;margin:20px auto;box-shadow:0 0 0 8px rgba(185,151,98,.09)}h1{font-family:Georgia,serif;font-weight:500;font-size:38px;line-height:1;margin:0 0 12px}p{font-size:14px;line-height:1.7;color:#6f6a62;margin:0}</style></head><body><main class="card"><div class="mark">CARDELUME</div><div class="dot"></div><h1>${escape(t.returnWaiting)}</h1><p>${escape(t.returnWaitingBody)}</p></main></body></html>`;
}

function invalidHtml(locale:LocaleCode){
  const t=recoveryCopy[locale];
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CardeLume</title><style>html,body{margin:0;min-height:100%;background:#f7f3eb;color:#0b1730;font-family:system-ui,-apple-system,sans-serif}body{min-height:100vh;display:grid;place-items:center;padding:24px;box-sizing:border-box}.card{width:min(520px,100%);background:#fffdf8;border:1px solid rgba(11,23,48,.09);border-radius:24px;padding:34px;text-align:center}h1{font-family:Georgia,serif;font-weight:500;font-size:34px;line-height:1.05;margin:0 0 12px}p{font-size:14px;line-height:1.7;color:#6f6a62}</style></head><body><main class="card"><h1>${escape(t.invalid)}</h1><p>${escape(t.invalidBody)}</p></main></body></html>`;
}

export async function GET(req:Request,{params}:{params:Promise<{orderId:string;claim:string}>}){
  const parsed=Params.safeParse(await params);
  if(!parsed.success)return new NextResponse(invalidHtml("en"),{status:404,headers:{...commonHeaders(),"Content-Type":"text/html; charset=utf-8"}});

  const result=await claimCheckoutReturn(parsed.data).catch(()=>({status:"invalid" as const}));
  if(result.status==="invalid")return new NextResponse(invalidHtml("en"),{status:404,headers:{...commonHeaders(),"Content-Type":"text/html; charset=utf-8"}});
  if(result.status==="pending"){
    const locale=normalizeLocale(result.locale);
    return new NextResponse(waitingHtml(locale,req.url),{status:202,headers:{...commonHeaders(),"Content-Type":"text/html; charset=utf-8","Retry-After":"2"}});
  }

  const target=new URL(`/d/${result.access.recoveryId}`,req.url);
  const res=NextResponse.redirect(target,303);
  Object.entries(commonHeaders()).forEach(([k,v])=>res.headers.set(k,v));
  const cfg=recoveryConfig();
  const remaining=Math.max(60,Math.floor((result.access.recoveryExpiresAt.getTime()-Date.now())/1000));
  res.cookies.set(recoveryCookieName(result.access.recoveryId),result.sessionSecret,{
    httpOnly:true,
    secure:process.env.NODE_ENV==="production",
    sameSite:"lax",
    path:`/d/${result.access.recoveryId}`,
    maxAge:Math.min(remaining,cfg.browserSessionDays*86_400)
  });
  return res;
}

import { NextRequest, NextResponse } from "next/server";
import {
  detectLocale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  validLocale
} from "./i18n/locale-detection";
import { buildCsp } from "./lib/csp";

const ANON_COOKIE="cardelume_anon";
const ONE_YEAR=60*60*24*365;
const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function adminAuthorized(request:NextRequest){
  const user=process.env.TEMPLATE_ADMIN_USERNAME??"";const pass=process.env.TEMPLATE_ADMIN_PASSWORD??"";
  if(!user||!pass)return false;const raw=request.headers.get("authorization")??"";if(!raw.startsWith("Basic "))return false;
  try{const decoded=atob(raw.slice(6));const split=decoded.indexOf(":");return split>0&&decoded.slice(0,split)===user&&decoded.slice(split+1)===pass;}catch{return false;}
}
function adminEdgeAuthorized(request:NextRequest){
  if(process.env.NODE_ENV!=="production"||process.env.ADMIN_REQUIRE_EDGE_ACCESS!=="true")return true;
  return Boolean(request.headers.get("cf-access-authenticated-user-email")&&request.headers.get("cf-access-jwt-assertion"));
}
function adminChallenge(){return new NextResponse("Authentication required",{status:401,headers:{"www-authenticate":'Basic realm="CardeLume Templates", charset="UTF-8"',"cache-control":"no-store"}});}
function adminSecurityEvent(event:"admin_auth_succeeded"|"admin_auth_failed"|"admin_authorization_denied",request:NextRequest){console.warn(JSON.stringify({level:"warn",category:"security",event,path:request.nextUrl.pathname,method:request.method}));}


export default function proxy(request:NextRequest){
  let trustedAdminActor="";
  if(request.nextUrl.pathname.startsWith("/admin")||request.nextUrl.pathname.startsWith("/api/admin")){
    if(!adminEdgeAuthorized(request)){adminSecurityEvent("admin_authorization_denied",request);return new NextResponse("Edge access required",{status:403,headers:{"cache-control":"no-store"}});}
    if(!adminAuthorized(request)){adminSecurityEvent("admin_auth_failed",request);return adminChallenge();}
    adminSecurityEvent("admin_auth_succeeded",request);
    trustedAdminActor=(request.headers.get("cf-access-authenticated-user-email")??process.env.TEMPLATE_ADMIN_USERNAME??"owner").trim().slice(0,160);
    if(request.nextUrl.pathname.startsWith("/api/admin")&&request.method!=="GET"&&request.headers.get("x-cardelume-admin-action")!=="1"){adminSecurityEvent("admin_authorization_denied",request);return new NextResponse("Admin action header required",{status:403,headers:{"cache-control":"no-store"}});}
  }
  const explicitRaw=request.nextUrl.searchParams.get("lang");
  const explicit=validLocale(explicitRaw);
  const cookie=request.cookies.get(LOCALE_COOKIE)?.value;
  const acceptLanguage=request.headers.get("accept-language");

  // ?market=XX is a review-only override. Production trusts edge country headers.
  const reviewMarket=(process.env.APP_MODE??"mock")==="mock"
    ? request.nextUrl.searchParams.get("market")
    : null;
  const market=reviewMarket
    ?? request.headers.get("cf-ipcountry")
    ?? request.headers.get("x-vercel-ip-country")
    ?? request.headers.get("x-country-code");

  const detected=detectLocale({
    explicit:explicit??undefined,
    cookie,
    acceptLanguage,
    market
  });

  const existingAnon=request.cookies.get(ANON_COOKIE)?.value;
  const validExistingAnon=existingAnon&&UUID_RE.test(existingAnon)?existingAnon:undefined;
  const anon=validExistingAnon??crypto.randomUUID();
  const requestHeaders=new Headers(request.headers);
  const nonce=crypto.randomUUID().replace(/-/g,"");
  const csp=buildCsp(nonce);
  requestHeaders.set("x-nonce",nonce);
  requestHeaders.set("content-security-policy",csp);
  requestHeaders.set("x-cardelume-locale",detected.locale);
  requestHeaders.set("x-cardelume-locale-source",detected.source);
  requestHeaders.set("x-cardelume-anon",anon);
  if(trustedAdminActor)requestHeaders.set("x-cardelume-admin-actor",trustedAdminActor);else requestHeaders.delete("x-cardelume-admin-actor");

  const response=NextResponse.next({request:{headers:requestHeaders}});
  const enforceCsp=process.env.CSP_ENFORCE==="true";
  response.headers.set(enforceCsp?"Content-Security-Policy":"Content-Security-Policy-Report-Only",csp);

  if(!validExistingAnon){
    response.cookies.set(ANON_COOKIE,anon,{
      path:"/",
      maxAge:ONE_YEAR,
      sameSite:"lax",
      secure:process.env.NODE_ENV==="production",
      httpOnly:true
    });
  }

  // Explicit ?lang= is an intentional user/campaign choice and becomes sticky.
  // Browser/market auto-detection deliberately stays non-sticky.
  if(explicit && explicit!==validLocale(cookie)){
    response.cookies.set(LOCALE_COOKIE,explicit,{
      path:"/",
      maxAge:LOCALE_COOKIE_MAX_AGE,
      sameSite:"lax",
      secure:process.env.NODE_ENV==="production",
      httpOnly:true
    });
  }

  return response;
}

export const config={
  matcher:["/admin/:path*","/api/admin/:path*","/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"]
};

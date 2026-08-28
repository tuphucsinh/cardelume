import { cookies, headers } from "next/headers";
import { detectLocale, LOCALE_COOKIE, validLocale } from "./locale-detection";
import type { LocaleCode } from "./messages";

export async function requestLocale(
  explicit?:string|string[]|null,
  reviewMarket?:string|string[]|null
):Promise<LocaleCode>{
  const raw=Array.isArray(explicit)?explicit[0]:explicit;
  const direct=validLocale(raw);
  if(direct)return direct;

  const h=await headers();
  const forwarded=validLocale(h.get("x-cardelume-locale"));
  if(forwarded)return forwarded;

  // Defensive fallback for environments/tests where Next Proxy is bypassed.
  const cookieStore=await cookies();
  const reviewValue=Array.isArray(reviewMarket)?reviewMarket[0]:reviewMarket;
  const mockMarket=(process.env.APP_MODE??"mock")==="mock"?reviewValue:null;
  const market=mockMarket
    ?? h.get("cf-ipcountry")
    ?? h.get("x-vercel-ip-country")
    ?? h.get("x-country-code");

  return detectLocale({
    cookie:cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguage:h.get("accept-language"),
    market
  }).locale;
}

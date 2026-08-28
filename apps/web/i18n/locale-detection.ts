import { supportedLocales, type LocaleCode } from "./messages.ts";

export const LOCALE_COOKIE="cardelume_locale";
export const LOCALE_COOKIE_MAX_AGE=60*60*24*365;

const marketFallback:Partial<Record<string,LocaleCode>>={
  JP:"ja",
  KR:"ko",
  FR:"fr",
  DE:"de", AT:"de", LI:"de",
  IT:"it", SM:"it",
  BR:"pt",
  CN:"zh",
  VN:"vi",
  // Spanish is intentionally a Spain + LATAM baseline pack.
  ES:"es", MX:"es", AR:"es", BO:"es", CL:"es", CO:"es", CR:"es",
  CU:"es", DO:"es", EC:"es", SV:"es", GT:"es", HN:"es", NI:"es",
  PA:"es", PY:"es", PE:"es", PR:"es", UY:"es", VE:"es"
};

const directLanguageBases:Partial<Record<string,LocaleCode>>={
  en:"en",
  ja:"ja",
  ko:"ko",
  es:"es",
  fr:"fr",
  de:"de",
  it:"it",
  vi:"vi"
};

export function validLocale(value?:string|null):LocaleCode|null{
  if(!value)return null;
  const normalized=value.trim().toLowerCase().replace(/_/g,"-");
  return supportedLocales.includes(normalized as LocaleCode)?normalized as LocaleCode:null;
}

export function localeFromLanguageTag(value?:string|null):LocaleCode|null{
  if(!value)return null;
  const normalized=value.trim().toLowerCase().replace(/_/g,"-");
  if(!normalized||normalized==="*")return null;

  // Generic `pt` and `zh` do not contain enough regional/script information
  // for our PT-BR / Simplified-Chinese packs. Explicit user selection still
  // accepts `pt` and `zh` through validLocale().
  if(normalized==="pt"||normalized==="zh")return null;

  const exact=validLocale(normalized);
  if(exact)return exact;

  // We ship Brazilian Portuguese, not a generic Portugal-localized pack.
  // Auto-select it for pt-BR only; pt-PT can still be chosen manually.
  if(normalized==="pt-br"||normalized.startsWith("pt-br-"))return"pt";

  // We ship Simplified Chinese. Do not silently convert Traditional-Chinese
  // browser preferences (zh-TW/HK/MO or zh-Hant) into Simplified Chinese.
  if(
    normalized==="zh-cn" || normalized.startsWith("zh-cn-") ||
    normalized==="zh-sg" || normalized.startsWith("zh-sg-") ||
    normalized==="zh-hans" || normalized.startsWith("zh-hans-")
  )return"zh";
  if(
    normalized==="zh-tw" || normalized.startsWith("zh-tw-") ||
    normalized==="zh-hk" || normalized.startsWith("zh-hk-") ||
    normalized==="zh-mo" || normalized.startsWith("zh-mo-") ||
    normalized==="zh-hant" || normalized.startsWith("zh-hant-")
  )return null;

  const base=normalized.split("-")[0];
  return directLanguageBases[base]??null;
}

export function localeFromAcceptLanguage(header?:string|null):LocaleCode|null{
  if(!header)return null;
  const ordered=header.split(",")
    .map((part,index)=>{
      const [tag,...params]=part.trim().split(";");
      const qParam=params.map(x=>x.trim()).find(x=>/^q=/i.test(x));
      const parsed=qParam?Number(qParam.slice(2)):1;
      const quality=Number.isFinite(parsed)?Math.max(0,Math.min(1,parsed)):0;
      return{tag,quality,index};
    })
    .filter(item=>item.tag&&item.quality>0)
    .sort((a,b)=>b.quality-a.quality||a.index-b.index);

  for(const item of ordered){
    const match=localeFromLanguageTag(item.tag);
    if(match)return match;
  }
  return null;
}

export function localeFromMarket(country?:string|null):LocaleCode|null{
  if(!country)return null;
  return marketFallback[country.trim().toUpperCase()]??null;
}

export type LocaleSource="explicit"|"cookie"|"browser"|"market"|"fallback";

export function detectLocale(input:{
  explicit?:string|null;
  cookie?:string|null;
  acceptLanguage?:string|null;
  market?:string|null;
}):{locale:LocaleCode;source:LocaleSource}{
  const explicit=validLocale(input.explicit);
  if(explicit)return{locale:explicit,source:"explicit"};

  const cookie=validLocale(input.cookie);
  if(cookie)return{locale:cookie,source:"cookie"};

  const browser=localeFromAcceptLanguage(input.acceptLanguage);
  if(browser)return{locale:browser,source:"browser"};

  const market=localeFromMarket(input.market);
  if(market)return{locale:market,source:"market"};

  return{locale:"en",source:"fallback"};
}

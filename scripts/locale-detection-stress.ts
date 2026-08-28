import {
  detectLocale,
  localeFromAcceptLanguage,
  localeFromLanguageTag,
  localeFromMarket
} from "../apps/web/i18n/locale-detection.ts";

function eq(actual:unknown,expected:unknown,label:string){
  if(actual!==expected)throw new Error(`${label}: ${String(actual)} !== ${String(expected)}`);
  console.log(`PASS ${label}: ${String(actual)}`);
}

// Priority: explicit > cookie > browser > market > English.
eq(detectLocale({explicit:"ja",cookie:"vi",acceptLanguage:"fr-FR",market:"DE"}).locale,"ja","explicit wins");
eq(detectLocale({cookie:"vi",acceptLanguage:"ja-JP",market:"JP"}).locale,"vi","cookie wins");
eq(detectLocale({acceptLanguage:"en-US",market:"VN"}).locale,"en","browser wins over market");
eq(detectLocale({acceptLanguage:"th-TH",market:"VN"}).locale,"vi","market fallback");
eq(detectLocale({acceptLanguage:"th-TH",market:"TH"}).locale,"en","English final fallback");

// Browser language parsing / q-values.
eq(localeFromAcceptLanguage("fr-CA,fr;q=0.9,en;q=0.8"),"fr","French Canada browser");
eq(localeFromAcceptLanguage("th-TH,ja-JP;q=0.7,en-US;q=0.5"),"ja","next supported browser preference");
eq(localeFromAcceptLanguage("vi-VN;q=0,en-US;q=0.8"),"en","q=0 ignored");
eq(localeFromAcceptLanguage("es-MX,es;q=0.9"),"es","Spanish Mexico browser");
eq(localeFromAcceptLanguage("pt-BR,pt;q=0.8"),"pt","Brazilian Portuguese browser");
eq(localeFromAcceptLanguage("zh-CN,zh;q=0.8"),"zh","Simplified Chinese browser");

// Do not force users of unsupported regional/script variants into the wrong localized pack.
eq(localeFromLanguageTag("pt"),null,"generic Portuguese is not enough to choose PT-BR");
eq(localeFromLanguageTag("pt-PT"),null,"Portugal Portuguese not auto-mapped to PT-BR");
eq(localeFromLanguageTag("zh"),null,"generic Chinese is not enough to choose Simplified");
eq(localeFromLanguageTag("zh-TW"),null,"Traditional Chinese Taiwan not auto-mapped to Simplified");
eq(localeFromLanguageTag("zh-Hant-HK"),null,"Traditional Chinese script not auto-mapped to Simplified");

// Market fallback only after browser preference fails.
eq(localeFromMarket("JP"),"ja","Japan market fallback");
eq(localeFromMarket("KR"),"ko","Korea market fallback");
eq(localeFromMarket("MX"),"es","Mexico market fallback");
eq(localeFromMarket("AR"),"es","Argentina market fallback");
eq(localeFromMarket("AT"),"de","Austria market fallback");
eq(localeFromMarket("BR"),"pt","Brazil market fallback");
eq(localeFromMarket("CN"),"zh","China market fallback");
eq(localeFromMarket("VN"),"vi","Vietnam market fallback");
eq(localeFromMarket("CA"),null,"Canada relies on browser then English");

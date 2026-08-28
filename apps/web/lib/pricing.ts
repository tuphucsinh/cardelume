export type MarketCode =
  | "US" | "GB" | "CA" | "AU" | "SG" | "JP" | "KR"
  | "FR" | "DE" | "ES" | "IT" | "BR" | "MX" | "CN" | "VN" | "IN"
  | "OTHER";

export type CurrencyCode =
  | "USD" | "GBP" | "CAD" | "AUD" | "SGD" | "JPY" | "KRW"
  | "EUR" | "BRL" | "MXN" | "CNY" | "VND" | "INR";

export type BillingSupport = "native" | "adaptive-target";

export type PricePoint = {
  market:MarketCode;
  currency:CurrencyCode;
  amount:number;
  billingSupport:BillingSupport;
  display:string;
  approxUsd:number;
};

export type PricingRuntime = {
  extendedLocalEnabled:boolean;
  verifiedMarkets:Set<MarketCode>;
  experimentEnabled:boolean;
  experimentVariant:"control_299"|"test_349";
};

export type ResolvedPrice = PricePoint & {
  requestedMarket:MarketCode;
  effectiveMarket:MarketCode;
  source:"local-target"|"safe-usd-fallback"|"experiment";
  adaptiveCurrencyFeesInclusiveRequired:boolean;
};

const SINGLE_TARGET:Record<MarketCode,PricePoint>={
  US:{market:"US",currency:"USD",amount:2.99,billingSupport:"native",display:"US$2.99",approxUsd:2.99},
  GB:{market:"GB",currency:"GBP",amount:1.99,billingSupport:"native",display:"£1.99",approxUsd:2.70},
  CA:{market:"CA",currency:"CAD",amount:3.99,billingSupport:"adaptive-target",display:"C$3.99",approxUsd:2.87},
  AU:{market:"AU",currency:"AUD",amount:3.99,billingSupport:"adaptive-target",display:"A$3.99",approxUsd:2.86},
  SG:{market:"SG",currency:"SGD",amount:3.90,billingSupport:"adaptive-target",display:"S$3.90",approxUsd:3.07},
  JP:{market:"JP",currency:"JPY",amount:390,billingSupport:"adaptive-target",display:"¥390",approxUsd:2.45},
  KR:{market:"KR",currency:"KRW",amount:3900,billingSupport:"adaptive-target",display:"₩3,900",approxUsd:2.82},
  FR:{market:"FR",currency:"EUR",amount:2.49,billingSupport:"native",display:"€2.49",approxUsd:2.90},
  DE:{market:"DE",currency:"EUR",amount:2.49,billingSupport:"native",display:"€2.49",approxUsd:2.90},
  ES:{market:"ES",currency:"EUR",amount:2.49,billingSupport:"native",display:"€2.49",approxUsd:2.90},
  IT:{market:"IT",currency:"EUR",amount:2.49,billingSupport:"native",display:"€2.49",approxUsd:2.90},
  BR:{market:"BR",currency:"BRL",amount:9.90,billingSupport:"adaptive-target",display:"R$9,90",approxUsd:1.92},
  MX:{market:"MX",currency:"MXN",amount:39,billingSupport:"adaptive-target",display:"MX$39",approxUsd:2.30},
  CN:{market:"CN",currency:"CNY",amount:12.90,billingSupport:"adaptive-target",display:"¥12.90",approxUsd:1.92},
  VN:{market:"VN",currency:"VND",amount:39000,billingSupport:"adaptive-target",display:"39.000đ",approxUsd:1.50},
  IN:{market:"IN",currency:"INR",amount:149,billingSupport:"native",display:"₹149",approxUsd:1.56},
  OTHER:{market:"OTHER",currency:"USD",amount:2.99,billingSupport:"native",display:"US$2.99",approxUsd:2.99}
};

// Dormant volume pricing. This is NOT a credit wallet.
// The bundle purchase requires five finished card IDs in one checkout.
const HOLIDAY_TARGET:Record<MarketCode,PricePoint>={
  US:{market:"US",currency:"USD",amount:12.99,billingSupport:"native",display:"US$12.99",approxUsd:12.99},
  GB:{market:"GB",currency:"GBP",amount:8.99,billingSupport:"native",display:"£8.99",approxUsd:12.20},
  CA:{market:"CA",currency:"CAD",amount:17.49,billingSupport:"adaptive-target",display:"C$17.49",approxUsd:12.60},
  AU:{market:"AU",currency:"AUD",amount:17.49,billingSupport:"adaptive-target",display:"A$17.49",approxUsd:12.53},
  SG:{market:"SG",currency:"SGD",amount:16.90,billingSupport:"adaptive-target",display:"S$16.90",approxUsd:13.30},
  JP:{market:"JP",currency:"JPY",amount:1690,billingSupport:"adaptive-target",display:"¥1,690",approxUsd:10.62},
  KR:{market:"KR",currency:"KRW",amount:16900,billingSupport:"adaptive-target",display:"₩16,900",approxUsd:12.24},
  FR:{market:"FR",currency:"EUR",amount:10.99,billingSupport:"native",display:"€10.99",approxUsd:12.80},
  DE:{market:"DE",currency:"EUR",amount:10.99,billingSupport:"native",display:"€10.99",approxUsd:12.80},
  ES:{market:"ES",currency:"EUR",amount:10.99,billingSupport:"native",display:"€10.99",approxUsd:12.80},
  IT:{market:"IT",currency:"EUR",amount:10.99,billingSupport:"native",display:"€10.99",approxUsd:12.80},
  BR:{market:"BR",currency:"BRL",amount:42.90,billingSupport:"adaptive-target",display:"R$42,90",approxUsd:8.32},
  MX:{market:"MX",currency:"MXN",amount:169,billingSupport:"adaptive-target",display:"MX$169",approxUsd:9.96},
  CN:{market:"CN",currency:"CNY",amount:55.90,billingSupport:"adaptive-target",display:"¥55.90",approxUsd:8.32},
  VN:{market:"VN",currency:"VND",amount:169000,billingSupport:"adaptive-target",display:"169.000đ",approxUsd:6.50},
  IN:{market:"IN",currency:"INR",amount:649,billingSupport:"native",display:"₹649",approxUsd:6.80},
  OTHER:{market:"OTHER",currency:"USD",amount:12.99,billingSupport:"native",display:"US$12.99",approxUsd:12.99}
};

const MARKET_ALIASES:Record<string,MarketCode>={
  USA:"US",UNITEDSTATES:"US",
  UK:"GB",UNITEDKINGDOM:"GB",
  JP:"JP",JAPAN:"JP",
  KR:"KR",KOREA:"KR",SOUTHKOREA:"KR",
  VN:"VN",VIETNAM:"VN",
  CN:"CN",CHINA:"CN",
  IN:"IN",INDIA:"IN",
  SG:"SG",SINGAPORE:"SG",
  CA:"CA",CANADA:"CA",
  AU:"AU",AUSTRALIA:"AU",
  BR:"BR",BRAZIL:"BR",
  MX:"MX",MEXICO:"MX",
  FR:"FR",FRANCE:"FR",
  DE:"DE",GERMANY:"DE",
  ES:"ES",SPAIN:"ES",
  IT:"IT",ITALY:"IT"
};

export function normalizeMarket(value?:string|null):MarketCode{
  if(!value)return"OTHER";
  const raw=value.trim().toUpperCase().replace(/[\s_-]/g,"");
  const direct=(Object.keys(SINGLE_TARGET) as MarketCode[]).find(x=>x===raw);
  return direct ?? MARKET_ALIASES[raw] ?? "OTHER";
}

export function currencyMinorUnit(currency:CurrencyCode){
  return ["JPY","KRW","VND"].includes(currency)?0:2;
}

export function amountMinor(point:Pick<PricePoint,"amount"|"currency">){
  return Math.round(point.amount * Math.pow(10,currencyMinorUnit(point.currency)));
}

function canExposeLocal(point:PricePoint,runtime:PricingRuntime){
  if(point.billingSupport==="native")return true;
  return runtime.extendedLocalEnabled && runtime.verifiedMarkets.has(point.market);
}

function resolveFromBook(book:Record<MarketCode,PricePoint>,market:MarketCode,runtime:PricingRuntime):ResolvedPrice{
  const requested=book[market] ?? book.OTHER;
  if(canExposeLocal(requested,runtime)){
    return{
      ...requested,
      requestedMarket:market,
      effectiveMarket:requested.market,
      source:"local-target",
      adaptiveCurrencyFeesInclusiveRequired:requested.billingSupport==="adaptive-target"
    };
  }
  const safe=book.OTHER;
  return{
    ...safe,
    requestedMarket:market,
    effectiveMarket:"OTHER",
    source:"safe-usd-fallback",
    adaptiveCurrencyFeesInclusiveRequired:false
  };
}

export function resolveSinglePrice(market:MarketCode,runtime:PricingRuntime):ResolvedPrice{
  const price=resolveFromBook(SINGLE_TARGET,market,runtime);
  if(runtime.experimentEnabled && market==="US" && runtime.experimentVariant==="test_349"){
    return{
      ...price,
      market:"US",
      currency:"USD",
      amount:3.49,
      display:"US$3.49",
      approxUsd:3.49,
      requestedMarket:"US",
      effectiveMarket:"US",
      source:"experiment",
      adaptiveCurrencyFeesInclusiveRequired:false
    };
  }
  return price;
}

export function resolveHolidayBundlePrice(market:MarketCode,runtime:PricingRuntime):ResolvedPrice{
  return resolveFromBook(HOLIDAY_TARGET,market,runtime);
}

export const pricingTargetBook={
  single:SINGLE_TARGET,
  holidayBundle:HOLIDAY_TARGET
};

export const HOLIDAY_BUNDLE_CARD_COUNT=5;

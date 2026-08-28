import type { LocaleCode } from "../i18n/messages";
import { CARD_BODY_MIN_CSS_PX, cardCopyMetrics, cardTypographyScript, cardVisualLength, cardFormatFactor } from "@cardelume/card-schema";

export type MagicType = {
  headlinePx:number;
  bodyPx:number;
  trackingEm:number;
  headlineLineHeight:number;
  bodyLineHeight:number;
  headlineMaxWidthPct:number;
  bodyMaxWidthPct:number;
  density:"airy"|"balanced"|"compact";
  script:"latin"|"cjk"|"hangul";
  headlineLinesTarget:number;
};

export type MagicOptions = {
  locale?:LocaleCode;
  format?:string;
  measuredHeadlineWidthPx?:number;
  measuredBodyWidthPx?:number;
};

function measuredPressure(width:number|undefined, targetPerLine:number, lines:number){
  if(!width || width<=0) return 1;
  const capacity=targetPerLine*lines;
  return Math.max(1,width/capacity);
}

export function magicTypography(headline:string, body:string, options:MagicOptions={}):MagicType{
  const locale=options.locale ?? "en";
  const format=options.format ?? "Portrait · 5 × 7 in";
  const script=cardTypographyScript(locale);
  const ff=cardFormatFactor(format);
  const h=cardVisualLength(headline,locale);
  const b=cardVisualLength(body,locale);

  const headlineLinesTarget = script==="latin" ? (h>40?3:2) : (h>24?3:2);
  const hMeasured=measuredPressure(options.measuredHeadlineWidthPx, 260*ff, headlineLinesTarget);
  const bMeasured=measuredPressure(options.measuredBodyWidthPx, 250*ff, script==="latin"?5:6);
  const pressure=Math.max(
    h/(script==="latin"?42:31),
    b/(script==="latin"?185:135),
    hMeasured,
    bMeasured
  );

  const baseMetrics=cardCopyMetrics(headline,body,locale,format);
  const density:MagicType["density"] = Math.max(pressure,baseMetrics.pressure)>1.32 ? "compact" : Math.max(pressure,baseMetrics.pressure)>0.82 ? "balanced" : "airy";

  let headlinePx = script==="latin" ? 49 : script==="hangul" ? 43 : 42;
  let bodyPx = script==="latin" ? 11.8 : 11.2;
  if(density==="balanced"){ headlinePx-=5; bodyPx-=.8; }
  if(density==="compact"){ headlinePx-=10; bodyPx-=1.7; }
  if(pressure>1.65){ headlinePx-=3; bodyPx-=.5; }

  headlinePx*=ff;
  bodyPx*=Math.min(1.04,ff);
  bodyPx=Math.max(CARD_BODY_MIN_CSS_PX,bodyPx);

  const trackingEm = script==="latin" ? (density==="compact" ? -.03 : -.02) : 0;
  const headlineLineHeight = script==="latin" ? (density==="compact"?.96:.99) : script==="hangul" ? 1.12 : 1.16;
  const bodyLineHeight = script==="latin" ? 1.55 : 1.68;

  return {
    headlinePx:Math.round(headlinePx*10)/10,
    bodyPx:Math.round(bodyPx*10)/10,
    trackingEm,
    headlineLineHeight,
    bodyLineHeight,
    headlineMaxWidthPct:density==="compact"?93:density==="balanced"?89:83,
    bodyMaxWidthPct:density==="compact"?94:density==="balanced"?90:84,
    density,script,headlineLinesTarget
  };
}

export function measureTextWidth(text:string, locale:LocaleCode, px:number, role:"headline"|"body"="body"){
  if(typeof document==="undefined") return undefined;
  const canvas=document.createElement("canvas");
  const ctx=canvas.getContext("2d");
  if(!ctx) return undefined;
  const family = locale==="ja"
    ? (role==="headline" ? '"Noto Serif JP","Yu Mincho","Hiragino Mincho ProN",serif' : '"Noto Sans JP","Hiragino Sans","Yu Gothic",sans-serif')
    : locale==="ko"
    ? (role==="headline" ? '"Noto Serif KR","Apple SD Gothic Neo","Malgun Gothic",serif' : '"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif')
    : locale==="zh"
    ? (role==="headline" ? '"Noto Serif SC","Songti SC","STSong",serif' : '"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif')
    : role==="headline"
    ? '"Cormorant Garamond",Georgia,serif'
    : '"Plus Jakarta Sans",system-ui,sans-serif';
  ctx.font=`${role==="headline"?"500":"400"} ${px}px ${family}`;
  return ctx.measureText(text).width;
}

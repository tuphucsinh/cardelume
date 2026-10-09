import { Buffer } from "node:buffer";
import {
  CARD_BODY_MIN_CSS_PX,
  CARD_BODY_MIN_RENDER_PX,
  CardDocumentSchema,
  CanonicalPresentationSchema,
  PresentationLayoutProfileSchema,
  cardCopyMetrics,
  cardFormatFactor,
  cardPhotoContrastPalette,
  cardVisualLength,
  enforceReadableBodyFloor,
  type CardDocument,
  type CanonicalPresentation,
  type PresentationLayoutProfile,
  type RendererTypographyContract
} from "@cardelume/card-schema";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import { createPrintPdfFromJpeg } from "./pdf.ts";
import { getCardFormatSpec, type CardFormatSpec } from "./formats.ts";
import { rendererFontConfig } from "./fonts.ts";
import { assertRendererTemplateId, templateArtSvg } from "./template-art.ts";
import { templateLayoutProfile, type TemplateTextAnchor } from "./template-layout.ts";

export const CURRENT_RENDERER_VERSION="0.4.3-step.5" as const;

const XML:Record<string,string>={"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&apos;"};
export function escapeXml(value:string):string{return value.replace(/[&<>"']/g,char=>XML[char]);}

const palettes:Record<string,{bg:string;fg:string;accent:string}>={
  "editorial-ivory":{bg:"#f4eddd",fg:"#233049",accent:"#b99762"},
  "midnight-navy":{bg:"#0b1730",fg:"#fbf8f1",accent:"#d8c095"},
  "soft-sage":{bg:"#e9eee6",fg:"#26384a",accent:"#a28d67"},
  "soft-rose":{bg:"#f2e8e7",fg:"#2b3548",accent:"#b18a72"}
};

const templateOriginalPalettes:Partial<Record<string,{bg:string;fg:string;accent:string}>>={
  "whispered-type":{bg:"#f5f0e7",fg:"#1d2b40",accent:"#a6875d"},
  "museum-note":{bg:"#ece9e1",fg:"#263240",accent:"#92734d"},
  "monogram-orbit":{bg:"#e9ece5",fg:"#1e3240",accent:"#8d7a5d"},
  "ribbon-line":{bg:"#f1e6e5",fg:"#293344",accent:"#a97772"},
  "memory-window":{bg:"#e9e1d5",fg:"#243247",accent:"#9d7a55"},
  "type-celebration":{bg:"#eadcbc",fg:"#14233a",accent:"#b35e4c"},
  "quiet-seal":{bg:"#f0ece3",fg:"#233142",accent:"#9d7a4f"},
  "pressed-shadow":{bg:"#e8dfd1",fg:"#2b3543",accent:"#8e7760"},
  "ink-pause":{bg:"#eceae5",fg:"#1e3045",accent:"#52697d"},
  "petal-geometry":{bg:"#e8eee7",fg:"#2d403b",accent:"#80947d"},
  "soft-fold":{bg:"#ece8df",fg:"#283545",accent:"#9a8061"}
};

export type RenderAsset={bytes:Uint8Array;contentType:"image/jpeg"|"image/png"|"image/webp"};
export type RenderAssets=Readonly<Record<string,RenderAsset>>;
export type RenderSvgOptions={watermark?:boolean;assets?:RenderAssets;presentation?:CanonicalPresentation};
export type RasterizeSvg=(svg:string,input:{width:number;height:number;locale:string})=>Promise<Uint8Array>|Uint8Array;

export type ProductionRenderMetadata={
  format:CardDocument["format"];
  rendererVersion:string;
  deterministicKey:string;
  presentation?:CanonicalPresentation;
  jpg:{widthPx:number;heightPx:number;dpi:300;contentType:"image/jpeg"};
  pdf:{widthIn:number;heightIn:number;pageCount:number;contentType:"application/pdf";layout:CardFormatSpec["pdf"]["layout"]};
};

export function rendererTextSafeInset(format:CardDocument["format"]){
  const spec=getCardFormatSpec(format);
  const min=Math.min(spec.front.widthPx,spec.front.heightPx);
  const formatInset=Math.round(min*(spec.safeMarginIn/Math.min(spec.front.widthIn,spec.front.heightIn)));
  const frameInset=Math.round(min*.073);
  return Math.max(formatInset,frameInset)+Math.round(min*.035);
}

export function fitTypography(headline:string,body:string,locale="en",format:CardDocument["format"]="portrait-5x7"){
  const metrics=cardCopyMetrics(headline,body,locale,format);
  const script=metrics.script,ff=cardFormatFactor(format);
  const pressure=metrics.pressure;
  const density=metrics.density;
  let headlinePx=script==="latin"?116:script==="hangul"?103:100;let bodyPx=script==="latin"?36:34;
  if(density==="balanced"){headlinePx-=13;bodyPx-=3;}if(density==="compact"){headlinePx-=25;bodyPx-=6;}if(pressure>1.65){headlinePx-=7;bodyPx-=2;}
  headlinePx*=ff;
  bodyPx=Math.max(CARD_BODY_MIN_RENDER_PX,bodyPx);
  const bodyCssPx=Math.max(CARD_BODY_MIN_CSS_PX,Math.round((bodyPx*(CARD_BODY_MIN_CSS_PX/CARD_BODY_MIN_RENDER_PX))*10)/10);
  const contract=enforceReadableBodyFloor(bodyCssPx,bodyPx);
  return{
    headlinePx:Math.round(headlinePx),bodyPx:contract.bodyRenderPx,bodyCssPx:contract.bodyCssPx,floorSource:contract.floorSource,
    trackingEm:script==="latin"?(density==="compact"?-.03:-.02):0,
    headlineLineHeight:script==="latin"?(density==="compact"?.96:.99):script==="hangul"?1.12:1.16,bodyLineHeight:script==="latin"?1.46:1.62,
    headlineMaxWidthPct:density==="compact"?93:density==="balanced"?89:83,bodyMaxWidthPct:density==="compact"?94:density==="balanced"?90:84,
    maxHeadlineChars:script==="latin"?(density==="compact"?23:density==="balanced"?28:34):(density==="compact"?15:density==="balanced"?18:22),
    maxBodyChars:script==="latin"?(density==="compact"?50:56):(density==="compact"?24:30),density,script
  };
}

function assertRenderableCopy(headline:string,body:string,locale="en",format:CardDocument["format"]="portrait-5x7"){
  if(!headline.trim()||!body.trim())throw new Error("typography_copy_missing");
  const metrics=cardCopyMetrics(headline,body,locale,format);
  if(metrics.hardOverflow)throw new Error("typography_copy_too_dense");
}
function splitLongToken(token:string,maxVisual:number,locale:string){
  const out:string[]=[];let line="";
  for(const ch of Array.from(token)){
    const next=line+ch;
    if(line&&cardVisualLength(next,locale)>maxVisual){out.push(line);line=ch;}else line=next;
  }
  if(line)out.push(line);
  return out;
}
// Line breaking must respect word groups, not just width.
// Observed defects: English "beautiful as / the quiet" (line ended on a function word) and
// Vietnamese "người đồng / hành", "cảm xúc lặng / mạn" (a two-syllable compound split across
// lines). Moves only ever shorten a line and lengthen the next, so widths stay valid.
const LINE_TAIL_BLOCKED_LATIN=new Set(["a","an","the","of","to","and","or","for","with","in","on","as","at","by","but","that","this","your","my","her","his","their","our","is","are","was","were","be","its","not","from","into","than","then","so","if","when","while"]);
const LINE_TAIL_BLOCKED_VI=new Set(["và","của","với","trong","một","những","các","đã","sẽ","đang","là","mà","thì","cho","để","khi","như","nhưng","vẫn","rất","này","đó","ở","từ","đến","bằng","vì","nên","cũng","được","bị","hãy","mỗi","từng","giữa","trên","dưới","sau","trước","hay","hoặc","rồi","vào","ra","lên","xuống"]);
// Seeded, explicitly extensible data - NOT full Vietnamese word segmentation. It covers the
// compounds that actually appear in card copy and that were observed being split.
const VI_KEEP_TOGETHER=new Set(["lặng mạn","đồng hành","yêu thương","biết ơn","tri ân","kỷ niệm","ấm áp","chân thành","trân trọng","dịu dàng","bình yên","hạnh phúc","cảm xúc","thương yêu","yêu quý","gắn bó","sẻ chia","đồng cảm","tôn vinh","khắc ghi"]);
function lineTailBlocked(word:string,locale:string){
  if(/^(ja|ko|zh)/.test(locale))return false;
  const set=locale.startsWith("vi")?LINE_TAIL_BLOCKED_VI:LINE_TAIL_BLOCKED_LATIN;
  return set.has(word.toLowerCase().replace(/[.,;:!?…"'”“()]+$/,""));
}
function wouldSplitCompound(leftTail:string,rightHead:string,locale:string){
  if(!locale.startsWith("vi"))return false;
  const pair=`${leftTail} ${rightHead}`.toLowerCase().replace(/[.,;:!?…"'”“()]+/g,"");
  return VI_KEEP_TOGETHER.has(pair);
}
function wrapText(value:string,maxVisual:number,locale:string):string[]{
  const clean=value.replace(/\s+/g," ").trim();if(!clean)return[];
  if(!clean.includes(" "))return splitLongToken(clean,maxVisual,locale);
  // Split over-long tokens first, then choose break points with a look-ahead cost model.
  // A greedy filler cannot satisfy both "line fits" and "do not split a word group": when the
  // next line is already full there is no local fix, only a different earlier break.
  const tokens=clean.split(" ").flatMap(word=>cardVisualLength(word,locale)>maxVisual?splitLongToken(word,maxVisual,locale):[word]);
  const n=tokens.length;
  // Measure exactly like the layout does, so a line the DP accepts can never be reported as over-wide.
  const width=(i:number,j:number)=>cardVisualLength(tokens.slice(i,j+1).join(" "),locale);

  const COST_BLOCKED_TAIL=4000;   // line ends on a function word
  const COST_SPLIT_PAIR=9000;     // a two-syllable compound is split across the break
  const COST_SHORT_LINE=1200;     // non-final line with a single token
  const COST_RUNT=1500;           // final line with a single token

  const best=new Array(n+1).fill(Infinity);best[n]=0;
  const nextBreak=new Array(n+1).fill(n);
  for(let i=n-1;i>=0;i--){
    for(let j=i;j<n;j++){
      const lineWidth=width(i,j);
      if(lineWidth>maxVisual)break;
      const ragged=Math.max(0,maxVisual-lineWidth);
      let cost=ragged*ragged;
      const isLast=j===n-1;
      if(isLast){ if(j===i)cost+=COST_RUNT; }
      else {
        if(lineTailBlocked(tokens[j],locale))cost+=COST_BLOCKED_TAIL;
        if(wouldSplitCompound(tokens[j],tokens[j+1],locale))cost+=COST_SPLIT_PAIR;
        if(j===i)cost+=COST_SHORT_LINE;
      }
      const total=cost+best[j+1];
      if(total<best[i]){best[i]=total;nextBreak[i]=j;}
    }
  }
  const lines:string[]=[];
  for(let i=0;i<n;){const j=nextBreak[i];lines.push(tokens.slice(i,j+1).join(" "));i=j+1;}
  return lines;
}
function visualWidthPx(value:string,size:number,locale:string){return cardVisualLength(value,locale)*size*.54;}
// A decorative signature mark must not depend on a font. No face in the configured set
// contains U+2726, so the previous "<text>\u2726</text>" rasterised as missing-glyph bars.
// Draw the sparkle as a path: deterministic, font-independent, and correctly concave.
function signatureMark(textX:number,sparkY:number,anchor:string,accent:string,scale:number){
  const r=Math.max(18,Math.round(29*scale));
  const cx=anchor==="middle"?textX:anchor==="end"?textX-r:textX+r;
  const cy=sparkY-Math.round(r*0.72);
  const k=r*0.30;
  const f=(v:number)=>Math.round(v*100)/100;
  return `<path d="M ${f(cx)} ${f(cy-r)} C ${f(cx+k)} ${f(cy-k)}, ${f(cx+k)} ${f(cy-k)}, ${f(cx+r)} ${f(cy)} C ${f(cx+k)} ${f(cy+k)}, ${f(cx+k)} ${f(cy+k)}, ${f(cx)} ${f(cy+r)} C ${f(cx-k)} ${f(cy+k)}, ${f(cx-k)} ${f(cy+k)}, ${f(cx-r)} ${f(cy)} C ${f(cx-k)} ${f(cy-k)}, ${f(cx-k)} ${f(cy-k)}, ${f(cx)} ${f(cy-r)} Z" fill="${accent}"/>`;
}

function textLines(lines:string[],x:number,startY:number,size:number,lineHeight:number,attrs:string){return lines.map((line,index)=>`<text x="${x}" y="${startY+index*size*lineHeight}" ${attrs}>${escapeXml(line)}</text>`).join("\n");}
function base64Asset(asset:RenderAsset){return`data:${asset.contentType};base64,${Buffer.from(asset.bytes).toString("base64")}`;}
function firstPhoto(doc:CardDocument,assets?:RenderAssets){
  if(!assets||!(doc.photoTreatment||doc.templateId==="photo-story"))return null;
  for(const id of doc.artworkAssetIds){const asset=assets[id];if(asset)return asset;}
  return null;
}

function normalizedTypography(doc:CardDocument,headline:string,body:string){
  const auto=fitTypography(headline,body,doc.locale,doc.format);
  // Browser typographyFit values live in a much smaller CSS coordinate space;
  // final export therefore uses renderer-space fit unless the supplied values
  // are already plausible at the 1500px reference canvas.
  const supplied=doc.typographyFit;
  if(!supplied||supplied.headlinePx<60||supplied.bodyPx<20)return auto;
  const bodyRenderCandidate=Math.max(CARD_BODY_MIN_RENDER_PX,Math.min(48,supplied.bodyPx));
  const bodyCssCandidate=Math.max(CARD_BODY_MIN_CSS_PX,Math.round((bodyRenderCandidate*(CARD_BODY_MIN_CSS_PX/CARD_BODY_MIN_RENDER_PX))*10)/10);
  const contract=enforceReadableBodyFloor(bodyCssCandidate,bodyRenderCandidate);
  return{
    ...auto,
    headlinePx:Math.max(64,Math.min(142,supplied.headlinePx)),
    bodyPx:contract.bodyRenderPx,
    bodyCssPx:contract.bodyCssPx,
    floorSource:contract.floorSource,
    trackingEm:Math.max(-.06,Math.min(.08,supplied.trackingEm)),
    headlineLineHeight:supplied.headlineLineHeight??supplied.lineHeight??auto.headlineLineHeight,
    bodyLineHeight:supplied.bodyLineHeight??auto.bodyLineHeight,
    headlineMaxWidthPct:supplied.headlineMaxWidthPct??supplied.maxWidthPct??auto.headlineMaxWidthPct,
    bodyMaxWidthPct:supplied.bodyMaxWidthPct??supplied.maxWidthPct??auto.bodyMaxWidthPct
  };
}

function assertLayoutBounds(input:{
  headlineLines:string[];bodyLines:string[];hp:number;bp:number;hLeading:number;bLeading:number;
  width:number;height:number;safeInset:number;headlineStart:number;bodyStart:number;photo:boolean;
  headlineMaxWidthPct:number;bodyMaxWidthPct:number;locale:string;textX:number;anchor:TemplateTextAnchor;
}){
  const headlineHeight=Math.max(input.hp,input.headlineLines.length*input.hp*input.hLeading);
  const bodyHeight=Math.max(input.bp,input.bodyLines.length*input.bp*input.bLeading);
  const maxHeadline=input.photo?input.height*.24:input.height*.30;
  const maxBody=input.photo?input.height*.20:input.height*.27;
  if(headlineHeight>maxHeadline||bodyHeight>maxBody)throw new Error("typography_copy_too_dense");
  const headlineLimit=Math.min(input.width-input.safeInset*2,input.width*(input.headlineMaxWidthPct/100));
  const bodyLimit=Math.min(input.width-input.safeInset*2,input.width*(input.bodyMaxWidthPct/100));
  const horizontalOk=(line:string,size:number,limit:number)=>{
    const visual=visualWidthPx(line,size,input.locale);
    if(visual>limit)return false;
    const left=input.anchor==="middle"?input.textX-visual/2:input.anchor==="end"?input.textX-visual:input.textX;
    const right=input.anchor==="middle"?input.textX+visual/2:input.anchor==="end"?input.textX:input.textX+visual;
    return left>=input.safeInset&&right<=input.width-input.safeInset;
  };
  if(input.headlineLines.some(line=>!horizontalOk(line,input.hp,headlineLimit)))throw new Error("headline_horizontal_overflow");
  if(input.bodyLines.some(line=>!horizontalOk(line,input.bp,bodyLimit)))throw new Error("body_horizontal_overflow");
  const headlineTop=input.headlineStart-input.hp;
  const headlineBottom=input.headlineStart+Math.max(0,input.headlineLines.length-1)*input.hp*input.hLeading+input.hp*.28;
  const bodyTop=input.bodyStart-input.bp;
  const bodyBottom=input.bodyStart+Math.max(0,input.bodyLines.length-1)*input.bp*input.bLeading+input.bp*.28;
  if(headlineTop<input.safeInset||bodyBottom>input.height-input.safeInset)throw new Error("typography_safe_margin_overflow");
  if(headlineBottom+input.bp*.8>bodyTop)throw new Error("typography_blocks_overlap");
}


export function renderSafeSvg(input:CardDocument,options:RenderSvgOptions={}):string{
  const doc=CardDocumentSchema.parse(input);
  // Trust boundary: the SVG is assembled only from renderer-owned markup,
  // allowlisted IDs/colors, escaped text and in-memory raster assets. No raw
  // SVG/HTML/CSS/JS or external URL from AI/user input is ever emitted.
  const presentation = options.presentation ?? doc.presentation;
  if(presentation){
    if(presentation.rendererTemplateKey !== doc.templateId){
      throw new Error(`presentation_template_mismatch: presentation rendererTemplateKey (${presentation.rendererTemplateKey}) !== doc.templateId (${doc.templateId})`);
    }
    assertRendererTemplateId(presentation.rendererTemplateKey);
  } else {
    assertRendererTemplateId(doc.templateId);
  }
  const layout=presentation?.layout ?? templateLayoutProfile(doc.templateId);
  const spec=getCardFormatSpec(doc.format),w=spec.front.widthPx,h=spec.front.heightPx,min=Math.min(w,h),scale=min/1500;
  const base=(doc.paletteId==="editorial-ivory"?templateOriginalPalettes[doc.templateId]:undefined)??palettes[doc.paletteId]??palettes["editorial-ivory"];
  const photoPalette=doc.photoPalette?cardPhotoContrastPalette(doc.photoPalette):null;
  const photoDarkGradient=doc.templateId==="midnight-lume"||doc.templateId==="celestial-night";
  const photoFixedNoir=doc.templateId==="art-deco-noir"||doc.templateId==="quiet-noir";
  const photoAdjusted=photoPalette?(photoFixedNoir?{
    bg:"#111820",
    fg:"#f8f0e0",
    accent:photoPalette.darkAccent
  }:photoDarkGradient?{
    bg:photoPalette.darkBackground,
    fg:photoPalette.darkForeground,
    accent:photoPalette.darkAccent
  }:{
    bg:photoPalette.background,
    fg:photoPalette.foreground,
    accent:photoPalette.accent
  }):base;
  const palette=layout.darkSurface?{bg:"#111a2b",fg:"#f5f0e6",accent:photoPalette?.darkAccent??"#d8c095"}:photoAdjusted;
  const headline=doc.textBlocks.find(x=>x.role==="headline")?.text??"";
  const body=doc.textBlocks.find(x=>x.role==="body")?.text??"";
  const kicker=doc.textBlocks.find(x=>x.role==="kicker")?.text??"";
  assertRenderableCopy(headline,body,doc.locale,doc.format);
  const fit=normalizedTypography(doc,headline,body);
  const hp=Math.max(42,Math.round(fit.headlinePx*scale*layout.headlineScale));
  const bodyCandidate=Math.max(CARD_BODY_MIN_RENDER_PX,Math.ceil(fit.bodyPx*scale*layout.bodyScale));
  const bodyFloor=enforceReadableBodyFloor(
    Math.max(CARD_BODY_MIN_CSS_PX,fit.bodyCssPx??Number((bodyCandidate*(CARD_BODY_MIN_CSS_PX/CARD_BODY_MIN_RENDER_PX)).toFixed(1))),
    bodyCandidate
  );
  const bp=bodyFloor.bodyRenderPx;
  const kp=Math.max(18,Math.round(31*scale));
  const hLeading=fit.headlineLineHeight??1,bLeading=fit.bodyLineHeight??1.45;
  const inset=Math.round(min*(spec.safeMarginIn/Math.min(spec.front.widthIn,spec.front.heightIn)));
  const borderInset=Math.max(inset,Math.round(min*.073));
  const textSafeInset=rendererTextSafeInset(doc.format);
  const headlineWidthPct=Math.min(fit.headlineMaxWidthPct??88,layout.headlineWidthPct);
  const bodyWidthPct=Math.min(fit.bodyMaxWidthPct??90,layout.bodyWidthPct);
  const headlineWidthPx=Math.min(w-textSafeInset*2,w*(headlineWidthPct/100));
  const bodyWidthPx=Math.min(w-textSafeInset*2,w*(bodyWidthPct/100));
  const headlineLines=wrapText(headline,headlineWidthPx/(hp*.54),doc.locale);
  const bodyLines=wrapText(body,bodyWidthPx/(bp*.54),doc.locale);
  const photo=firstPhoto(doc,options.assets);

  const art=templateArtSvg({templateId:doc.templateId,width:w,height:h,scale,accent:palette.accent,foreground:palette.fg,background:palette.bg});

  const borderWidth=Math.max(2,Math.round(3*scale));
  const textX=Math.round(w*layout.xPct);
  const textAnchor=layout.anchor;
  const watermark=options.watermark?`<g aria-label="preview-watermark" opacity=".12"><text x="${w-borderInset}" y="${h-borderInset/2}" text-anchor="end" fill="${palette.fg}" font-family="sans-serif" font-size="${Math.max(12,Math.round(15*scale))}" letter-spacing="4">CARDELUME · PREVIEW</text></g>`:"";

  if(photo&&layout.photoWindow){
    const pw=layout.photoWindow;
    const photoX=Math.round(w*pw.xPct),photoY=Math.round(h*pw.yPct),photoW=Math.round(w*pw.widthPct),photoH=Math.round(h*pw.heightPct);
    const kickerY=Math.round(h*layout.kickerYPct),headlineCenter=Math.round(h*layout.headlineYPct),bodyCenter=Math.round(h*layout.bodyYPct);
    const headlineStart=headlineCenter-Math.max(0,headlineLines.length-1)*hp*hLeading/2;
    const bodyStart=bodyCenter-Math.max(0,bodyLines.length-1)*bp*bLeading/2;
    try {
      assertLayoutBounds({headlineLines,bodyLines,hp,bp,hLeading,bLeading,width:w,height:h,safeInset:textSafeInset,headlineStart,bodyStart,photo:false,headlineMaxWidthPct:headlineWidthPct,bodyMaxWidthPct:bodyWidthPct,locale:doc.locale,textX,anchor:textAnchor});
      return`<svg xmlns="http&#58;//www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <rect width="${w}" height="${h}" fill="${palette.bg}"/>
        <image x="${photoX}" y="${photoY}" width="${photoW}" height="${photoH}" preserveAspectRatio="xMidYMid slice" href="${base64Asset(photo)}"/>
        ${art}
        <text x="${textX}" y="${kickerY}" text-anchor="${textAnchor}" fill="${palette.accent}" font-family="sans-serif" font-size="${kp}" letter-spacing="${Math.max(3,Math.round(8*scale))}">${escapeXml(kicker)}</text>
        ${textLines(headlineLines,textX,headlineStart,hp,hLeading,`text-anchor="${textAnchor}" fill="${palette.fg}" font-family="serif" font-size="${hp}"`)}
        ${textLines(bodyLines,textX,bodyStart,bp,bLeading,`text-anchor="${textAnchor}" fill="${palette.fg}" font-family="sans-serif" font-size="${bp}"`)}
        ${watermark}
      </svg>`;
    } catch(primaryErr){
      const altBodyWidthPct=Math.max(bodyWidthPct,Math.min(94,fit.bodyMaxWidthPct??94));
      const altBodyWidthPx=Math.min(w-textSafeInset*2,w*(altBodyWidthPct/100));
      const altBodyLines=wrapText(body,altBodyWidthPx/(bp*.54),doc.locale);
      const altBLeading=Math.max(1.36,bLeading*.96);
      const altBodyStart=bodyCenter-Math.max(0,altBodyLines.length-1)*bp*altBLeading/2;
      assertLayoutBounds({headlineLines,bodyLines:altBodyLines,hp,bp,hLeading,bLeading:altBLeading,width:w,height:h,safeInset:textSafeInset,headlineStart,bodyStart:altBodyStart,photo:false,headlineMaxWidthPct:headlineWidthPct,bodyMaxWidthPct:altBodyWidthPct,locale:doc.locale,textX,anchor:textAnchor});
      return`<svg xmlns="http&#58;//www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <rect width="${w}" height="${h}" fill="${palette.bg}"/>
        <image x="${photoX}" y="${photoY}" width="${photoW}" height="${photoH}" preserveAspectRatio="xMidYMid slice" href="${base64Asset(photo)}"/>
        ${art}
        <text x="${textX}" y="${kickerY}" text-anchor="${textAnchor}" fill="${palette.accent}" font-family="sans-serif" font-size="${kp}" letter-spacing="${Math.max(3,Math.round(8*scale))}">${escapeXml(kicker)}</text>
        ${textLines(headlineLines,textX,headlineStart,hp,hLeading,`text-anchor="${textAnchor}" fill="${palette.fg}" font-family="serif" font-size="${hp}"`)}
        ${textLines(altBodyLines,textX,altBodyStart,bp,altBLeading,`text-anchor="${textAnchor}" fill="${palette.fg}" font-family="sans-serif" font-size="${bp}"`)}
        ${watermark}
      </svg>`;
    }
  }

  if(photo){
    const photoH=Math.round(h*.57),copyTop=photoH;
    const kickerY=Math.round(copyTop+h*.075);
    const headlineSpread=Math.max(0,headlineLines.length-1)*hp*hLeading;
    const bodySpread=Math.max(0,bodyLines.length-1)*bp*bLeading;
    const bodyCenter=Math.min(Math.round(copyTop+h*.33),Math.round(h-textSafeInset-bodySpread/2-bp*.28));
    const bodyStart=bodyCenter-bodySpread/2;
    const headlineCenter=Math.min(Math.round(copyTop+h*.18),Math.round(bodyStart-bp*.8-hp*.28-headlineSpread/2));
    const headlineStart=headlineCenter-headlineSpread/2;
    try {
      assertLayoutBounds({headlineLines,bodyLines,hp,bp,hLeading,bLeading,width:w,height:h,safeInset:textSafeInset,headlineStart,bodyStart,photo:true,headlineMaxWidthPct:headlineWidthPct,bodyMaxWidthPct:bodyWidthPct,locale:doc.locale,textX,anchor:textAnchor});
      return`<svg xmlns="http&#58;//www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <rect width="${w}" height="${h}" fill="${palette.bg}"/>
        <image x="0" y="0" width="${w}" height="${photoH}" preserveAspectRatio="xMidYMid slice" href="${base64Asset(photo)}"/>
        <rect x="0" y="${photoH}" width="${w}" height="${h-photoH}" fill="${palette.bg}"/>
        <text x="${textX}" y="${kickerY}" text-anchor="${textAnchor}" fill="${palette.accent}" font-family="sans-serif" font-size="${kp}" letter-spacing="${Math.max(3,Math.round(8*scale))}">${escapeXml(kicker)}</text>
        ${textLines(headlineLines,textX,headlineStart,hp,hLeading,`text-anchor="${textAnchor}" fill="${palette.fg}" font-family="serif" font-size="${hp}"`)}
        ${textLines(bodyLines,textX,bodyStart,bp,bLeading,`text-anchor="${textAnchor}" fill="${palette.fg}" font-family="sans-serif" font-size="${bp}"`)}
        ${watermark}
      </svg>`;
    } catch(primaryErr){
      const altBodyWidthPct=Math.max(bodyWidthPct,Math.min(94,fit.bodyMaxWidthPct??94));
      const altBodyWidthPx=Math.min(w-textSafeInset*2,w*(altBodyWidthPct/100));
      const altBodyLines=wrapText(body,altBodyWidthPx/(bp*.54),doc.locale);
      const altBLeading=Math.max(1.36,bLeading*.96);
      const altBodySpread=Math.max(0,altBodyLines.length-1)*bp*altBLeading;
      const altBodyCenter=Math.min(Math.round(copyTop+h*.33),Math.round(h-textSafeInset-altBodySpread/2-bp*.28));
      const altBodyStart=altBodyCenter-altBodySpread/2;
      const altHeadlineCenter=Math.min(Math.round(copyTop+h*.18),Math.round(altBodyStart-bp*.8-hp*.28-headlineSpread/2));
      const altHeadlineStart=altHeadlineCenter-headlineSpread/2;
      assertLayoutBounds({headlineLines,bodyLines:altBodyLines,hp,bp,hLeading,bLeading:altBLeading,width:w,height:h,safeInset:textSafeInset,headlineStart:altHeadlineStart,bodyStart:altBodyStart,photo:true,headlineMaxWidthPct:headlineWidthPct,bodyMaxWidthPct:altBodyWidthPct,locale:doc.locale,textX,anchor:textAnchor});
      return`<svg xmlns="http&#58;//www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <rect width="${w}" height="${h}" fill="${palette.bg}"/>
        <image x="0" y="0" width="${w}" height="${photoH}" preserveAspectRatio="xMidYMid slice" href="${base64Asset(photo)}"/>
        <rect x="0" y="${photoH}" width="${w}" height="${h-photoH}" fill="${palette.bg}"/>
        <text x="${textX}" y="${kickerY}" text-anchor="${textAnchor}" fill="${palette.accent}" font-family="sans-serif" font-size="${kp}" letter-spacing="${Math.max(3,Math.round(8*scale))}">${escapeXml(kicker)}</text>
        ${textLines(headlineLines,textX,altHeadlineStart,hp,hLeading,`text-anchor="${textAnchor}" fill="${palette.fg}" font-family="serif" font-size="${hp}"`)}
        ${textLines(altBodyLines,textX,altBodyStart,bp,altBLeading,`text-anchor="${textAnchor}" fill="${palette.fg}" font-family="sans-serif" font-size="${bp}"`)}
        ${watermark}
      </svg>`;
    }
  }

  const kickerY=Math.round(h*layout.kickerYPct),sparkY=Math.round(h*layout.signatureYPct);
  const headlineSpread=Math.max(0,headlineLines.length-1)*hp*hLeading;
  const bodySpread=Math.max(0,bodyLines.length-1)*bp*bLeading;
  const bodyCenter=Math.min(Math.round(h*layout.bodyYPct),Math.round(h-textSafeInset-bodySpread/2-bp*.28));
  const bodyStart=bodyCenter-bodySpread/2;
  const headlineCenter=Math.min(Math.round(h*layout.headlineYPct),Math.round(bodyStart-bp*.8-hp*.28-headlineSpread/2));
  const headlineStart=headlineCenter-headlineSpread/2;
  try {
    assertLayoutBounds({headlineLines,bodyLines,hp,bp,hLeading,bLeading,width:w,height:h,safeInset:textSafeInset,headlineStart,bodyStart,photo:false,headlineMaxWidthPct:headlineWidthPct,bodyMaxWidthPct:bodyWidthPct,locale:doc.locale,textX,anchor:textAnchor});
    return`<svg xmlns="http&#58;//www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <rect width="${w}" height="${h}" rx="${Math.max(6,Math.round(18*scale))}" fill="${palette.bg}"/>
      ${art}
      ${layout.showBorder?`<rect x="${borderInset}" y="${borderInset}" width="${w-borderInset*2}" height="${h-borderInset*2}" rx="${Math.max(2,Math.round(4*scale))}" fill="none" stroke="${palette.accent}" stroke-width="${borderWidth}" opacity=".68"/>`:""}
      <text x="${textX}" y="${kickerY}" text-anchor="${textAnchor}" fill="${palette.accent}" font-family="sans-serif" font-size="${kp}" letter-spacing="${Math.max(3,Math.round(8*scale))}">${escapeXml(kicker)}</text>
      ${textLines(headlineLines,textX,headlineStart,hp,hLeading,`text-anchor="${textAnchor}" fill="${palette.fg}" font-family="serif" font-size="${hp}"`)}
      ${textLines(bodyLines,textX,bodyStart,bp,bLeading,`text-anchor="${textAnchor}" fill="${palette.fg}" font-family="sans-serif" font-size="${bp}"`)}
      ${layout.showSignatureMark?signatureMark(textX,sparkY,textAnchor,palette.accent,scale):""}
      ${watermark}
    </svg>`;
  } catch(primaryErr){
    const altBodyWidthPct=Math.max(bodyWidthPct,Math.min(94,fit.bodyMaxWidthPct??94));
    const altBodyWidthPx=Math.min(w-textSafeInset*2,w*(altBodyWidthPct/100));
    const altBodyLines=wrapText(body,altBodyWidthPx/(bp*.54),doc.locale);
    const altHp=Math.max(42,Math.round(hp*0.92));
    const altBLeading=Math.max(1.36,bLeading*0.96);
    const altHSpread=Math.max(0,headlineLines.length-1)*altHp*hLeading;
    const altBSpread=Math.max(0,altBodyLines.length-1)*bp*altBLeading;
    const altBodyCenter=Math.min(Math.round(h*Math.max(0.52,layout.bodyYPct)),Math.round(h-textSafeInset-altBSpread/2-bp*.28));
    const altBodyStart=altBodyCenter-altBSpread/2;
    const altHeadlineCenter=Math.min(Math.round(h*Math.max(0.34,layout.headlineYPct)),Math.round(altBodyStart-bp*.8-altHp*.28-altHSpread/2));
    const altHeadlineStart=altHeadlineCenter-altHSpread/2;

    assertLayoutBounds({headlineLines,bodyLines:altBodyLines,hp:altHp,bp,hLeading,bLeading:altBLeading,width:w,height:h,safeInset:textSafeInset,headlineStart:altHeadlineStart,bodyStart:altBodyStart,photo:false,headlineMaxWidthPct:headlineWidthPct,bodyMaxWidthPct:altBodyWidthPct,locale:doc.locale,textX,anchor:textAnchor});

    return`<svg xmlns="http&#58;//www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <rect width="${w}" height="${h}" rx="${Math.max(6,Math.round(18*scale))}" fill="${palette.bg}"/>
      ${art}
      ${layout.showBorder?`<rect x="${borderInset}" y="${borderInset}" width="${w-borderInset*2}" height="${h-borderInset*2}" rx="${Math.max(2,Math.round(4*scale))}" fill="none" stroke="${palette.accent}" stroke-width="${borderWidth}" opacity=".68"/>`:""}
      <text x="${textX}" y="${kickerY}" text-anchor="${textAnchor}" fill="${palette.accent}" font-family="sans-serif" font-size="${kp}" letter-spacing="${Math.max(3,Math.round(8*scale))}">${escapeXml(kicker)}</text>
      ${textLines(headlineLines,textX,altHeadlineStart,altHp,hLeading,`text-anchor="${textAnchor}" fill="${palette.fg}" font-family="serif" font-size="${altHp}"`)}
      ${textLines(altBodyLines,textX,altBodyStart,bp,altBLeading,`text-anchor="${textAnchor}" fill="${palette.fg}" font-family="sans-serif" font-size="${bp}"`)}
      ${layout.showSignatureMark?signatureMark(textX,sparkY,textAnchor,palette.accent,scale):""}
      ${watermark}
    </svg>`;
  }
}

export function renderPreviewSvg(doc:CardDocument,assets?:RenderAssets,presentation?:CanonicalPresentation){return renderSafeSvg(doc,{watermark:true,assets,presentation});}
export function renderFinalSvg(doc:CardDocument,assets?:RenderAssets,presentation?:CanonicalPresentation){return renderSafeSvg(doc,{watermark:false,assets,presentation});}

export async function rasterizeSvgWithResvg(svg:string,input:{width:number;height:number;locale:string}){
  const font=rendererFontConfig(input.locale);
  const renderer=new Resvg(svg,{
    fitTo:{mode:"original"},
    dpi:300,
    background:"rgba(255,255,255,1)",
    font,
    shapeRendering:2,
    textRendering:2,
    imageRendering:0
  });
  const rendered=renderer.render();
  if(rendered.width!==input.width||rendered.height!==input.height)throw new Error(`resvg_dimension_mismatch:${rendered.width}x${rendered.height}`);
  return new Uint8Array(rendered.asPng());
}

async function encodeJpeg(png:Uint8Array,width:number,height:number){
  const out=await sharp(Buffer.from(png),{failOn:"error"})
    .resize(width,height,{fit:"fill",kernel:"lanczos3"})
    .flatten({background:"#ffffff"})
    .jpeg({quality:95,chromaSubsampling:"4:4:4",progressive:true,force:true})
    .withMetadata({density:300})
    .toBuffer();
  const meta=await sharp(out).metadata();
  if(meta.width!==width||meta.height!==height)throw new Error(`jpg_dimension_mismatch:${meta.width}x${meta.height}`);
  return new Uint8Array(out);
}

// Print bleed: the JPG the customer sees stays at trim size, while the print PDF carries
// the artwork 0.125in past the trim line. Extending by copying the outermost pixels keeps
// the composition untouched (no scaling, no cropping) and stays deterministic.
async function extendToBleed(jpg:Uint8Array,width:number,height:number,bleedPx:number){
  if(bleedPx<=0)return jpg;
  const out=await sharp(Buffer.from(jpg),{failOn:"error"})
    .extend({top:bleedPx,bottom:bleedPx,left:bleedPx,right:bleedPx,extendWith:"copy"})
    .jpeg({quality:95,chromaSubsampling:"4:4:4",progressive:true,force:true})
    .withMetadata({density:300})
    .toBuffer();
  const meta=await sharp(out).metadata();
  if(meta.width!==width+2*bleedPx||meta.height!==height+2*bleedPx)throw new Error(`bleed_dimension_mismatch:${meta.width}x${meta.height}`);
  return new Uint8Array(out);
}

export async function renderProductionFinal(input:CardDocument,options:{assets?:RenderAssets;rasterize?:RasterizeSvg;presentation?:CanonicalPresentation}={}):Promise<{jpg:Uint8Array;pdf:Uint8Array;metadata:ProductionRenderMetadata}>{
  const doc=CardDocumentSchema.parse(input);
  const presentation = options.presentation ?? doc.presentation;
  if(presentation){
    if(presentation.rendererTemplateKey !== doc.templateId){
      throw new Error(`presentation_template_mismatch: presentation rendererTemplateKey (${presentation.rendererTemplateKey}) !== doc.templateId (${doc.templateId})`);
    }
    assertRendererTemplateId(presentation.rendererTemplateKey);
  } else {
    assertRendererTemplateId(doc.templateId);
  }
  if(doc.rendererVersion!==CURRENT_RENDERER_VERSION)throw new Error(`unsupported_renderer_version:${doc.rendererVersion}`);
  if((doc.templateId==="photo-story"||doc.photoTreatment)&&!firstPhoto(doc,options.assets))throw new Error("trusted_photo_asset_required");
  const spec=getCardFormatSpec(doc.format),svg=renderFinalSvg(doc,options.assets,presentation);
  const rasterize=options.rasterize??rasterizeSvgWithResvg;
  const png=await rasterize(svg,{width:spec.front.widthPx,height:spec.front.heightPx,locale:doc.locale});
  const jpg=await encodeJpeg(png,spec.front.widthPx,spec.front.heightPx);
  const bleedPx=Math.round(spec.bleedIn*spec.dpi);
  const printJpg=await extendToBleed(jpg,spec.front.widthPx,spec.front.heightPx,bleedPx);
  const pdf=createPrintPdfFromJpeg({jpeg:printJpg,format:doc.format,pixelWidth:spec.front.widthPx+2*bleedPx,pixelHeight:spec.front.heightPx+2*bleedPx,bleedPx});
  const deterministicKey = presentation
    ? `${doc.id}:${doc.rendererVersion}:${doc.templateVersion}:${presentation.templateId}:${presentation.templateVersionId}:${doc.format}`
    : `${doc.id}:${doc.rendererVersion}:${doc.templateVersion}:${doc.format}`;
  return{
    jpg,pdf,
    metadata:{
      format:doc.format,rendererVersion:doc.rendererVersion,deterministicKey,
      presentation,
      jpg:{widthPx:spec.front.widthPx,heightPx:spec.front.heightPx,dpi:300,contentType:"image/jpeg"},
      pdf:{widthIn:spec.pdf.widthIn,heightIn:spec.pdf.heightIn,pageCount:spec.pdf.pageCount,contentType:"application/pdf",layout:spec.pdf.layout}
    }
  };
}

export async function renderProductionPreview(input:CardDocument,options:{assets?:RenderAssets;rasterize?:RasterizeSvg;maxLongEdge?:number;presentation?:CanonicalPresentation}={}):Promise<{jpg:Uint8Array;width:number;height:number}>{
  const doc=CardDocumentSchema.parse(input);
  const presentation = options.presentation ?? doc.presentation;
  const spec=getCardFormatSpec(doc.format),svg=renderPreviewSvg(doc,options.assets,presentation),max=options.maxLongEdge??1200;
  const ratio=Math.min(1,max/Math.max(spec.front.widthPx,spec.front.heightPx));
  const width=Math.max(1,Math.round(spec.front.widthPx*ratio)),height=Math.max(1,Math.round(spec.front.heightPx*ratio));
  const rasterize=options.rasterize??rasterizeSvgWithResvg;
  // render full deterministic SVG first, then use Sharp for the preview downscale.
  const png=await rasterize(svg,{width:spec.front.widthPx,height:spec.front.heightPx,locale:doc.locale});
  const jpg=await sharp(Buffer.from(png),{failOn:"error"}).resize(width,height,{fit:"fill",kernel:"lanczos3"}).jpeg({quality:88,chromaSubsampling:"4:2:0",progressive:true}).toBuffer();
  return{jpg:new Uint8Array(jpg),width,height};
}

export { createPrintPdfFromJpeg } from "./pdf.ts";
export { getCardFormatSpec } from "./formats.ts";
export { rendererFontConfig } from "./fonts.ts";
export { rendererTemplateIds, assertRendererTemplateId } from "./template-art.ts";
export {
  CARD_BODY_MIN_CSS_PX,
  CARD_BODY_MIN_RENDER_PX,
  CanonicalPresentationSchema,
  PresentationLayoutProfileSchema,
  enforceReadableBodyFloor,
  type CanonicalPresentation,
  type PresentationLayoutProfile,
  type RendererTypographyContract
} from "@cardelume/card-schema";

export function assertRendererFontsReady(){
  for(const locale of ["en","ja","ko","zh"] as const)rendererFontConfig(locale);
}

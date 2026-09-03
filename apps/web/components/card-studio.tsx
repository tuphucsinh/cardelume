"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, Check, ImagePlus, Palette, RefreshCw, Sparkles, Trash2, WandSparkles } from "lucide-react";
import { CardVisual } from "./card-visual";
import { extractPhotoPalette, type PhotoPalette } from "./photo-palette";
import { preparePhotoForUpload } from "./photo-preprocess";
import { magicTypography, measureTextWidth } from "./magic-typography";
import { PhysicalCardSurface, usePhysicalEffects } from "./physical-effects";
import type { VisualDirection } from "@cardelume/templates";
import { cardCopyMetrics, shortenCardBody, type GenerationResult } from "@cardelume/card-schema";
import { interpolate, type LocaleCode, type Messages } from "../i18n/messages";
import { directionDisplay } from "../i18n/display-copy";
import { launchCopy } from "../i18n/launch-copy";
import { betaCopy } from "../i18n/beta-copy";
import type { ResolvedPrice } from "../lib/pricing";
import { runGeneration, type GenerationStatus } from "../lib/generation-client";
import { uploadPreparedPhoto } from "../lib/photo-upload-client";
import { trackFunnelEvent } from "../lib/analytics-events";

const occasions=["Birthday","Anniversary","Thank You","Congratulations","New Baby","Other"] as const;
const relations=["Partner","Mom","Dad","Friend","Coworker","Client","Someone else"] as const;
const feelings=["Elegant","Warm","Romantic","Fun","Surprise me"] as const;

type Phase="brief"|"revealing"|"results"|"finish"|"checkout";
type AccentMode="original"|"photo"|"navy"|"sage"|"rose";
type DirectionId="editorial"|"midnight"|"photo"|"quiet";
type Direction={id:DirectionId;visual:VisualDirection;templateId?:string;templateVersionId?:string;templateName?:string;templateSource?:"ai_direction"|"recommended"|"market_pick"|"show_more";templatePosition?:number;templateEventToken?:string;photoMode?:"none"|"optional"|"required";suggestedAccentMode?:AccentMode};
type TemplateOption={id:string;versionId:string;name:string;material:string;visualDirection:VisualDirection;photoMode:"none"|"optional"|"required";source:"ai_direction"|"recommended"|"market_pick"|"show_more";position:number;archetype:string;eventToken:string};
const editorial:Direction={id:"editorial",visual:"editorial",photoMode:"none"};
const midnight:Direction={id:"midnight",visual:"midnight",photoMode:"none"};
const photo:Direction={id:"photo",visual:"photo",photoMode:"required"};
const quiet:Direction={id:"quiet",visual:"letterpress",photoMode:"none"};

function formatClass(value:string){
  if(value.startsWith("Square"))return"format-square";
  if(value.startsWith("Landscape")||value.startsWith("Postcard"))return"format-landscape";
  return"format-portrait";
}

const formatLabels:Record<LocaleCode,string[]>={
  en:["Portrait · 5 × 7 in","Folded · 5 × 7 in","Square · 5 × 5 in","Landscape · 7 × 5 in","Postcard · 6 × 4 in"],
  ja:["縦型 · 5 × 7 in","二つ折り · 5 × 7 in","正方形 · 5 × 5 in","横型 · 7 × 5 in","ポストカード · 6 × 4 in"],
  ko:["세로형 · 5 × 7 in","접이식 · 5 × 7 in","정사각형 · 5 × 5 in","가로형 · 7 × 5 in","포스트카드 · 6 × 4 in"],
  es:["Vertical · 5 × 7 in","Plegada · 5 × 7 in","Cuadrada · 5 × 5 in","Horizontal · 7 × 5 in","Postal · 6 × 4 in"],
  fr:["Portrait · 5 × 7 in","Pliée · 5 × 7 in","Carrée · 5 × 5 in","Paysage · 7 × 5 in","Carte postale · 6 × 4 in"],
  de:["Hochformat · 5 × 7 in","Gefaltet · 5 × 7 in","Quadratisch · 5 × 5 in","Querformat · 7 × 5 in","Postkarte · 6 × 4 in"],
  pt:["Retrato · 5 × 7 in","Dobrado · 5 × 7 in","Quadrado · 5 × 5 in","Paisagem · 7 × 5 in","Postal · 6 × 4 in"],
  it:["Verticale · 5 × 7 in","Piegato · 5 × 7 in","Quadrato · 5 × 5 in","Orizzontale · 7 × 5 in","Cartolina · 6 × 4 in"],
  zh:["竖版 · 5 × 7 in","折叠 · 5 × 7 in","方形 · 5 × 5 in","横版 · 7 × 5 in","明信片 · 6 × 4 in"],
  vi:["Dọc · 5 × 7 in","Gập · 5 × 7 in","Vuông · 5 × 5 in","Ngang · 7 × 5 in","Bưu thiếp · 6 × 4 in"]
};
const formatValues=["Portrait · 5 × 7 in","Folded · 5 × 7 in","Square · 5 × 5 in","Landscape · 7 × 5 in","Postcard · 6 × 4 in"];
const checkoutFormatValues=["portrait-5x7","folded-5x7","square-5x5","landscape-7x5","postcard-6x4"] as const;

function shortenMessage(message:string,locale:LocaleCode){
  const first=message.split(/[.!?。！？]/).filter(Boolean)[0]?.trim();
  return first ? first+(["ja","zh"].includes(locale)?"。":".") : message;
}


function localizedPaletteNote(locale:LocaleCode,palette:PhotoPalette,softenedNote:string){
  if(palette.softened)return softenedNote;
  const notes:Record<LocaleCode,Record<PhotoPalette["temperature"],string>>={
    en:{warm:"We picked up the warm tones from your photo.",cool:"We used the cooler tones from your photo to shape the palette.",balanced:"We built a balanced palette from the colors in your photo."},
    ja:{warm:"写真のあたたかな色を拾ってパレットに反映しました。",cool:"写真の涼やかな色をもとにパレットを整えました。",balanced:"写真の色からバランスのよいパレットを作りました。"},
    ko:{warm:"사진의 따뜻한 톤을 카드 팔레트에 반영했어요.",cool:"사진의 시원한 톤으로 팔레트를 구성했어요.",balanced:"사진의 색을 바탕으로 균형 잡힌 팔레트를 만들었어요."},
    es:{warm:"Tomamos los tonos cálidos de tu foto.",cool:"Usamos los tonos fríos de tu foto para crear la paleta.",balanced:"Creamos una paleta equilibrada a partir de tu foto."},
    fr:{warm:"Nous avons repris les tons chauds de votre photo.",cool:"Nous avons utilisé les tons plus frais de votre photo.",balanced:"Nous avons créé une palette équilibrée à partir de votre photo."},
    de:{warm:"Wir haben die warmen Töne Ihres Fotos aufgenommen.",cool:"Wir haben die kühleren Töne Ihres Fotos für die Palette genutzt.",balanced:"Wir haben aus den Farben Ihres Fotos eine ausgewogene Palette erstellt."},
    pt:{warm:"Usamos os tons quentes da sua foto.",cool:"Usamos os tons mais frios da sua foto para criar a paleta.",balanced:"Criamos uma paleta equilibrada a partir das cores da sua foto."},
    it:{warm:"Abbiamo ripreso i toni caldi della tua foto.",cool:"Abbiamo usato i toni più freddi della tua foto per creare la palette.",balanced:"Abbiamo creato una palette equilibrata dai colori della tua foto."},
    zh:{warm:"我们提取了照片里的暖色调。",cool:"我们用照片里的冷色调塑造了配色。",balanced:"我们根据照片颜色生成了平衡的配色。"},
    vi:{warm:"Chúng tôi đã lấy các tông màu ấm từ ảnh của bạn.",cool:"Chúng tôi dùng các tông màu lạnh trong ảnh để tạo palette.",balanced:"Chúng tôi tạo một palette cân bằng từ màu sắc trong ảnh của bạn."}
  };
  return notes[locale][palette.temperature];
}

type DocWithViewTransition=Document&{startViewTransition?:(update:()=>void)=>{finished:Promise<void>}};



export function CardStudio({locale,messages,price,priceQuote,generationMode,paymentMode}:{locale:LocaleCode;messages:Messages;price:ResolvedPrice;priceQuote:string;generationMode:"mock"|"live";paymentMode:"off"|"on"}){
  const m=messages.studio;
  const launch=launchCopy(locale);
  const beta=betaCopy(locale);
  const {haptic,reducedMotion}=usePhysicalEffects();
  const [phase,setPhase]=useState<Phase>("brief");
  const [occasion,setOccasion]=useState<(typeof occasions)[number]>("Birthday");
  const [customOccasion,setCustomOccasion]=useState("");
  const [recipient,setRecipient]=useState("");
  const [relation,setRelation]=useState<""|(typeof relations)[number]>("");
  const [customRelation,setCustomRelation]=useState("");
  const [feeling,setFeeling]=useState<(typeof feelings)[number]>("Elegant");
  const [detail,setDetail]=useState("");
  const [format,setFormat]=useState("Portrait · 5 × 7 in");
  const [selected,setSelected]=useState<Direction>(editorial);
  const [message,setMessage]=useState(m.copy.editorialBody);
  const [photoUrl,setPhotoUrl]=useState<string|null>(null);
  const [photoPalette,setPhotoPalette]=useState<PhotoPalette|null>(null);
  const [photoProfile,setPhotoProfile]=useState<{orientation:"portrait"|"landscape"|"square";temperature:"warm"|"cool"|"balanced";luminance:number;paletteConfidence:number;softened:boolean}|null>(null);
  const [photoAssetId,setPhotoAssetId]=useState<string|null>(null);
  const [photoState,setPhotoState]=useState<"idle"|"optimizing"|"reading"|"ready"|"error"|"large">("idle");
  const [accentMode,setAccentMode]=useState<AccentMode>("original");
  const [checkoutNote,setCheckoutNote]=useState("");
  const [betaNote,setBetaNote]=useState("");
  const [betaBusy,setBetaBusy]=useState<"jpg"|"pdf"|null>(null);
  const [generationMessage,setGenerationMessage]=useState(m.revealing);
  const [usedCuratedFallback,setUsedCuratedFallback]=useState(false);
  const [generatedResult,setGeneratedResult]=useState<GenerationResult|null>(null);
  const [rewriteBusy,setRewriteBusy]=useState<"warmer"|"playful"|null>(null);
  const [rewriteNote,setRewriteNote]=useState("");
  const [messageUndo,setMessageUndo]=useState<string|null>(null);
  const messageRef=useRef(message);
  messageRef.current=message;
  const generationAbort=useRef<AbortController|null>(null);
  const [measured,setMeasured]=useState<{headline?:number;body?:number}>({});
  const fileInput=useRef<HTMLInputElement>(null);
  const preparedPhotoFile=useRef<File|null>(null);
  const checkoutAttempt=useRef<{fingerprint:string;key:string}|null>(null);
  const checkoutInFlight=useRef(false);
  const impressedTemplates=useRef(new Set<string>());
  const studioShellRef=useRef<HTMLElement>(null);

  useEffect(()=>()=>{if(photoUrl)URL.revokeObjectURL(photoUrl);},[photoUrl]);
  useEffect(()=>()=>generationAbort.current?.abort(),[]);
  useEffect(()=>{trackFunnelEvent("studio_started",{locale,currency:price.currency,pricingVariant:price.source,purchaseKind:"single"});},[locale,price.currency,price.source]);
  useEffect(()=>{if(!["results","finish","checkout"].includes(phase))return;const frame=requestAnimationFrame(()=>studioShellRef.current?.querySelector<HTMLElement>("[data-phase-focus]")?.focus({preventScroll:false}));return()=>cancelAnimationFrame(frame);},[phase]);

  const resultDirections=useMemo<Direction[]>(()=>photoUrl&&photoState==="ready"?[editorial,midnight,photo]:[editorial,midnight,quiet],[photoUrl,photoState]);

  useEffect(()=>{
    if(selected.id==="photo"&&!photoUrl)setSelected(quiet);
  },[selected.id,photoUrl]);

  const previewDirection=useMemo<VisualDirection>(()=>{
    // Live preview is a customer-facing surface: never use HOLD/RETIRED legacy families.
    if(feeling==="Warm")return"botanical";
    if(feeling==="Romantic")return"editorial";
    if(feeling==="Fun")return"deco";
    if(feeling==="Surprise me")return photoUrl?"photo":"letterpress";
    return relation==="Coworker"||relation==="Client"?"minimal":"editorial";
  },[feeling,relation,photoUrl]);


  const effectiveOccasion=occasion==="Other"?(customOccasion.trim()||"Other"):occasion;
  const effectiveRelation=relation==="Someone else"?(customRelation.trim()||"Someone else"):(relation||"Someone special");

  const previewCopy=useMemo(()=>{
    const entered=recipient.trim();
    const name=entered||launch.someoneSpecial;
    const formal=relation==="Coworker"||relation==="Client";
    if(occasion==="Anniversary")return{kicker:m.copy.anniversaryKicker,headline:interpolate(m.copy.anniversaryHeadline,{name}),body:detail||m.copy.anniversaryBody};
    if(occasion==="Thank You")return{kicker:m.copy.thankKicker,headline:interpolate(m.copy.thankHeadline,{name}),body:detail||m.copy.thankBody};
    if(occasion==="Congratulations")return{kicker:m.copy.congratsKicker,headline:interpolate(m.copy.congratsHeadline,{name}),body:detail||m.copy.congratsBody};
    if(formal)return{kicker:m.copy.formalBirthdayKicker,headline:interpolate(m.copy.formalBirthdayHeadline,{name}),body:detail||m.copy.formalBirthdayBody};
    if(!entered&&feeling==="Elegant")return{kicker:m.copy.birthdayKicker,headline:m.copy.editorialHeadline,body:detail||m.copy.editorialBody};
    return{kicker:m.copy.birthdayKicker,headline:interpolate(feeling==="Fun"?m.copy.birthdayFun:feeling==="Romantic"?m.copy.birthdayRomantic:m.copy.birthdayHeadline,{name}),body:detail||m.copy.birthdayBody};
  },[occasion,recipient,relation,feeling,detail,m,launch.someoneSpecial]);

  const personalMark=useMemo(()=>{const chars=Array.from((recipient.trim()||launch.someoneSpecial).replace(/\s+/g,""));return (chars.slice(0,2).join("")||"CL").toLocaleUpperCase(locale);},[recipient,launch.someoneSpecial,locale]);
  const experience=useMemo(()=>({
    en:{relationshipOptional:"Choose if useful (optional)",printLayout:"Print layout (optional)",printLayoutHint:"Digital PDF layout · no physical card is shipped",whyFits:"Why this fits",direction:"Direction",refine:"Refine wording",undo:"Undo",curatedColor:"Curated accent",photoColor:"From your photo"},
    ja:{relationshipOptional:"必要な場合のみ選択（任意）",printLayout:"印刷レイアウト（任意）",printLayoutHint:"デジタルPDFのレイアウトです · 実物のカードは発送されません",whyFits:"この方向が合う理由",direction:"デザイン",refine:"言葉を整える",undo:"元に戻す",curatedColor:"おすすめの色",photoColor:"写真の色から"},
    ko:{relationshipOptional:"필요한 경우 선택 (선택)",printLayout:"인쇄 레이아웃 (선택)",printLayoutHint:"디지털 PDF 레이아웃 · 실물 카드는 배송되지 않습니다",whyFits:"이 방향이 어울리는 이유",direction:"디자인",refine:"문구 다듬기",undo:"되돌리기",curatedColor:"추천 색상",photoColor:"사진에서 가져온 색"},
    es:{relationshipOptional:"Elige solo si ayuda (opcional)",printLayout:"Formato de impresión (opcional)",printLayoutHint:"Formato del PDF digital · no se envía tarjeta física",whyFits:"Por qué encaja",direction:"Dirección",refine:"Refinar el texto",undo:"Deshacer",curatedColor:"Acento curado",photoColor:"De tu foto"},
    fr:{relationshipOptional:"Choisissez si utile (facultatif)",printLayout:"Mise en page d’impression (facultatif)",printLayoutHint:"Mise en page du PDF numérique · aucune carte physique n’est expédiée",whyFits:"Pourquoi cela convient",direction:"Direction",refine:"Affiner le texte",undo:"Annuler",curatedColor:"Accent choisi",photoColor:"Depuis votre photo"},
    de:{relationshipOptional:"Nur bei Bedarf wählen (optional)",printLayout:"Drucklayout (optional)",printLayoutHint:"Layout für die digitale PDF · keine physische Karte wird versendet",whyFits:"Warum das passt",direction:"Richtung",refine:"Text verfeinern",undo:"Rückgängig",curatedColor:"Kuratierter Akzent",photoColor:"Aus Ihrem Foto"},
    pt:{relationshipOptional:"Escolha só se ajudar (opcional)",printLayout:"Layout de impressão (opcional)",printLayoutHint:"Layout do PDF digital · nenhum cartão físico é enviado",whyFits:"Por que combina",direction:"Direção",refine:"Refinar o texto",undo:"Desfazer",curatedColor:"Acento curado",photoColor:"Da sua foto"},
    it:{relationshipOptional:"Scegli solo se utile (facoltativo)",printLayout:"Layout di stampa (facoltativo)",printLayoutHint:"Layout del PDF digitale · non viene spedito alcun biglietto fisico",whyFits:"Perché funziona",direction:"Direzione",refine:"Affina il testo",undo:"Annulla",curatedColor:"Accento scelto",photoColor:"Dalla tua foto"},
    zh:{relationshipOptional:"有帮助时再选择（可选）",printLayout:"打印版式（可选）",printLayoutHint:"数字PDF版式 · 不会寄送实体卡片",whyFits:"为什么适合",direction:"方向",refine:"润色文字",undo:"撤销",curatedColor:"精选配色",photoColor:"来自你的照片"},
    vi:{relationshipOptional:"Chọn nếu thật sự hữu ích (không bắt buộc)",printLayout:"Bố cục in (không bắt buộc)",printLayoutHint:"Bố cục cho file PDF số · không giao thiệp vật lý",whyFits:"Vì sao hướng này phù hợp",direction:"Hướng",refine:"Tinh chỉnh lời chúc",undo:"Hoàn tác",curatedColor:"Màu nhấn được chọn",photoColor:"Từ ảnh của bạn"}
  })[locale],[locale]);

  const generatedSelected=generatedResult?.directions.find(direction=>direction.id===selected.id);
  const selectedHeadline=generatedSelected?.headline??(selected.id==="midnight"?m.copy.midnightHeadline:selected.id==="photo"?m.copy.photoHeadline:selected.id==="quiet"?launch.quiet.headline:m.copy.editorialHeadline);
  const selectedKicker=generatedSelected?.kicker??(selected.id==="quiet"?launch.quiet.kicker:previewCopy.kicker);

  useEffect(()=>{
    const frame=requestAnimationFrame(()=>{
      setMeasured({
        headline:measureTextWidth(selectedHeadline,locale,44,"headline"),
        body:measureTextWidth(message,locale,12,"body")
      });
    });
    return()=>cancelAnimationFrame(frame);
  },[selectedHeadline,message,locale,format]);

  const typeFit=useMemo(()=>magicTypography(selectedHeadline,message,{
    locale,format,measuredHeadlineWidthPx:measured.headline,measuredBodyWidthPx:measured.body
  }),[selectedHeadline,message,locale,format,measured]);

  const copyGuard=useMemo(()=>cardCopyMetrics(selectedHeadline,message,locale,format),[selectedHeadline,message,locale,format]);

  function withTransition(update:()=>void){
    const d=document as DocWithViewTransition;
    if(d.startViewTransition&&!reducedMotion)d.startViewTransition(update);
    else update();
  }

  async function generate(regenerating=false){
    if(phase==="revealing")return;
    trackFunnelEvent("generation_requested",{locale,currency:price.currency,pricingVariant:price.source,purchaseKind:"single",photoUsed:Boolean(photoUrl&&photoState==="ready")});
    const previousTemplateIds=regenerating?(generatedResult?.directions.flatMap(item=>item.templateId?[item.templateId]:[])??[]):[];
    if(regenerating&&generatedResult?.directions?.length){
      const prior=generatedResult.directions.flatMap((item,index)=>item.templateId&&item.templateVersionId&&item.visualDirection&&item.templateEventToken?[{id:item.templateId,versionId:item.templateVersionId,name:item.templateName??"CardeLume",material:"",visualDirection:item.visualDirection as VisualDirection,photoMode:item.photoMode??"none",source:"ai_direction" as const,position:index+1,archetype:item.id,eventToken:item.templateEventToken}]:[]);
      trackTemplate(prior,"regenerated");
    }
    generationAbort.current?.abort();
    const controller=new AbortController();
    generationAbort.current=controller;
    setPhase("revealing");
    setUsedCuratedFallback(false);
    setGeneratedResult(null);
    setGenerationMessage(launch.generationStages[0]);
    const started=performance.now();
    let hapticPlayed=false;

    function updateStatus(status:GenerationStatus,elapsed:number){
      const stage=status.stage??(elapsed>7000?3:elapsed>3500?2:elapsed>1600?1:0);
      setGenerationMessage(elapsed>9000?launch.generationWaiting:launch.generationStages[Math.min(3,stage)]);
      if(!hapticPlayed && elapsed>850){
        hapticPlayed=true;
        haptic("reveal");
      }
    }

    try{
      const formatIndex=Math.max(0,formatValues.indexOf(format));
      const generated=await runGeneration({
        mode:generationMode,
        brief:{
          occasion:effectiveOccasion,
          recipient:recipient.trim()||undefined,
          relationship:effectiveRelation,
          feeling,
          detail:detail.trim()||undefined,
          format:checkoutFormatValues[formatIndex]??"portrait-5x7",
          locale,
          hasPhoto:Boolean(photoUrl&&photoState==="ready"),
          photoProfile:photoProfile??undefined,
          refreshContext:previousTemplateIds.length?{priorTemplateIds:previousTemplateIds}:undefined
        },
        sessionCapability:priceQuote,
        onStatus:updateStatus,
        signal:controller.signal
      });
      setGeneratedResult(generated);
      if(generated?.directions?.length){
        const aiOptions:TemplateOption[]=generated.directions.flatMap((item,index)=>item.templateId&&item.templateVersionId&&item.visualDirection?[{id:item.templateId,versionId:item.templateVersionId,name:item.templateName??"CardeLume",material:"",visualDirection:item.visualDirection as VisualDirection,photoMode:item.photoMode??"none",source:"ai_direction",position:index+1,archetype:item.id,eventToken:item.templateEventToken??""}]:[]);
        trackTemplate(aiOptions,"impression");
      }
      const minimum=reducedMotion?80:1200;
      const elapsed=performance.now()-started;
      if(elapsed<minimum)await new Promise(resolve=>window.setTimeout(resolve,minimum-elapsed));
      if(!hapticPlayed)haptic("reveal");
      trackFunnelEvent("results_viewed",{locale,currency:price.currency,pricingVariant:price.source,purchaseKind:"single",photoUsed:Boolean(photoUrl&&photoState==="ready")});
      withTransition(()=>setPhase("results"));
    }catch(error){
      if(error instanceof DOMException&&error.name==="AbortError")return;
      // Provider/queue/network failures are an availability problem, not a dead end
      // for the customer. Reveal the deterministic curated directions already
      // available in the CardeLume product layer; never expose technical errors.
      setGeneratedResult(null);
      setUsedCuratedFallback(true);
      setGenerationMessage(launch.generationFallbackReady);
      const minimum=reducedMotion?80:1050;
      const elapsed=performance.now()-started;
      if(elapsed<minimum)await new Promise(resolve=>window.setTimeout(resolve,minimum-elapsed));
      if(controller.signal.aborted)return;
      if(!hapticPlayed)haptic("reveal");
      trackFunnelEvent("results_viewed",{locale,currency:price.currency,pricingVariant:price.source,purchaseKind:"single",photoUsed:Boolean(photoUrl&&photoState==="ready")});
      withTransition(()=>setPhase("results"));
    }
  }

  function trackTemplate(options:TemplateOption[],eventType:"impression"|"selected"|"regenerated"){
    const events=options.filter(item=>eventType!=="impression"||!impressedTemplates.current.has(item.id)).map(item=>{if(eventType==="impression")impressedTemplates.current.add(item.id);return{templateId:item.id,templateVersionId:item.versionId,eventType,source:item.source,rankPosition:item.position,locale,eventToken:item.eventToken};});
    if(events.length)void fetch("/api/templates/events",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({events}),keepalive:true}).catch(()=>undefined);
  }

  function choose(direction:Direction){
    const generated=generatedResult?.directions.find(item=>item.id===direction.id);
    const next=generated?.body??(direction.id==="midnight"?m.copy.midnightBody:direction.id==="photo"?m.copy.photoBody:direction.id==="quiet"?launch.quiet.body:m.copy.editorialBody);
    if(direction.templateId&&direction.templateVersionId)trackTemplate([{id:direction.templateId,versionId:direction.templateVersionId,name:direction.templateName??"Template",material:"",visualDirection:direction.visual,photoMode:direction.photoMode??"none",source:direction.templateSource??"recommended",position:direction.templatePosition??1,archetype:direction.id,eventToken:direction.templateEventToken??""}],"selected");
    haptic("select");
    trackFunnelEvent("direction_selected",{locale,currency:price.currency,pricingVariant:price.source,purchaseKind:"single",direction:direction.visual,photoUsed:Boolean(photoUrl&&photoState==="ready"),templateId:direction.templateId,templateVersionId:direction.templateVersionId});
    trackFunnelEvent("finish_opened",{locale,currency:price.currency,pricingVariant:price.source,purchaseKind:"single",direction:direction.visual,photoUsed:Boolean(photoUrl&&photoState==="ready"),templateId:direction.templateId,templateVersionId:direction.templateVersionId});
    withTransition(()=>{
      setSelected(direction);
      setMessage(detail||next);
      setAccentMode(direction.suggestedAccentMode??(direction.photoMode==="required"&&photoPalette?"photo":"original"));
      setPhase("finish");
    });
  }

  function removePhoto(){
    if(photoUrl)URL.revokeObjectURL(photoUrl);
    setPhotoUrl(null);setPhotoPalette(null);setPhotoProfile(null);setPhotoAssetId(null);setPhotoState("idle");preparedPhotoFile.current=null;
    if(accentMode==="photo")setAccentMode("original");
    if(fileInput.current)fileInput.current.value="";
  }

  async function onPhoto(file?:File){
    if(!file)return;
    if(file.size>10*1024*1024){setPhotoState("large");return;}
    if(!["image/jpeg","image/png","image/webp","image/avif"].includes(file.type)){setPhotoState("error");return;}
    try{
      setPhotoState("optimizing");
      const prepared=await preparePhotoForUpload(file);
      preparedPhotoFile.current=prepared.file;
      const nextUrl=URL.createObjectURL(prepared.file);
      if(photoUrl)URL.revokeObjectURL(photoUrl);
      setPhotoUrl(nextUrl);
      setPhotoState("reading");
      const palette=await extractPhotoPalette(prepared.file);
      setPhotoPalette(palette);setPhotoProfile({orientation:Math.abs(prepared.width-prepared.height)/Math.max(prepared.width,prepared.height)<.08?"square":prepared.width>prepared.height?"landscape":"portrait",temperature:palette.temperature,luminance:palette.luminance,paletteConfidence:palette.confidence,softened:palette.softened});setAccentMode("photo");
      if(generationMode==="live"){
        const uploaded=await uploadPreparedPhoto({file:prepared.file,priceQuote});
        setPhotoAssetId(uploaded.assetId);
      }else setPhotoAssetId(null);
      setPhotoState("ready");
    }catch(error){
      setPhotoPalette(null);setPhotoProfile(null);
      setPhotoState(error instanceof Error&&error.message==="photo_too_large"?"large":"error");
    }
  }

  function replaceMessage(next:string){
    if(next===message)return;
    setMessageUndo(message);
    setMessage(next);
  }

  function undoMessage(){
    if(messageUndo===null)return;
    const previous=messageUndo;
    setMessageUndo(null);
    setMessage(previous);
    setRewriteNote("");
  }

  async function rewriteTone(mode:"warmer"|"playful"){
    if(generationMode!=="live"||rewriteBusy||!message.trim())return;
    const sourceMessage=message;
    setRewriteBusy(mode);setRewriteNote("");
    try{
      const response=await fetch("/api/rewrite",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({mode,message:sourceMessage,locale,occasion:effectiveOccasion,relationship:effectiveRelation,recipient:recipient.trim()||undefined})});
      const data=await response.json().catch(()=>null) as {text?:string}|null;
      if(response.ok&&data?.text){
        // Never overwrite a manual edit made while the bounded rewrite request is in flight.
        if(messageRef.current!==sourceMessage)return;
        replaceMessage(data.text);
      }else setRewriteNote(launch.rewriteUnavailable);
    }catch{setRewriteNote(launch.rewriteUnavailable);}
    finally{setRewriteBusy(null);}
  }

  function buildCardSnapshot(){
    const formatIndex=Math.max(0,formatValues.indexOf(format));
    return{
      locale,
      format:checkoutFormatValues[formatIndex]??"portrait-5x7",
      direction:selected.id,
      templateId:selected.templateId,
      templateVersionId:selected.templateVersionId,
      templateSource:selected.templateSource,
      occasion:effectiveOccasion,
      relationship:effectiveRelation,
      feeling,
      kicker:selectedKicker,
      headline:selectedHeadline,
      body:message,
      accentMode,
      photoPalette:photoPalette?{
        primary:photoPalette.primary,secondary:photoPalette.secondary,accent:photoPalette.accent,
        temperature:photoPalette.temperature,luminance:photoPalette.luminance
      }:undefined,
      photoAssetId:(selected.photoMode==="required"||(selected.photoMode==="optional"&&accentMode==="photo"))?(photoAssetId??undefined):undefined
    };
  }

  async function downloadBetaAsset(assetKind:"jpg"|"pdf"){
    if(paymentMode!=="off"||betaBusy)return;
    setBetaBusy(assetKind);setBetaNote("");
    try{
      const res=await fetch("/api/beta/export",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({assetKind,card:buildCardSnapshot(),priceQuote})});
      if(!res.ok){setBetaNote(beta.unavailable);return;}
      const blob=await res.blob();
      const url=URL.createObjectURL(blob);
      const anchor=document.createElement("a");anchor.href=url;anchor.download=`cardelume-beta.${assetKind}`;document.body.appendChild(anchor);anchor.click();anchor.remove();
      window.setTimeout(()=>URL.revokeObjectURL(url),0);
      trackFunnelEvent(assetKind==="jpg"?"download_jpg":"download_pdf",{locale,currency:price.currency,pricingVariant:price.source,purchaseKind:"single",direction:selected.visual,photoUsed:Boolean(photoUrl&&photoState==="ready"),templateId:selected.templateId,templateVersionId:selected.templateVersionId});
    }catch{setBetaNote(beta.unavailable);}
    finally{setBetaBusy(null);}
  }

  async function beginCheckout(){
    if(checkoutInFlight.current)return;
    trackFunnelEvent("checkout_started",{locale,currency:price.currency,pricingVariant:price.source,purchaseKind:"single",direction:selected.visual,photoUsed:Boolean(photoUrl&&photoState==="ready"),templateId:selected.templateId,templateVersionId:selected.templateVersionId});
    checkoutInFlight.current=true;
    setCheckoutNote(launch.preparingCheckout);
    try{
      const card=buildCardSnapshot();
      const payload={purchaseKind:"single" as const,card,priceQuote};
      const fingerprint=JSON.stringify(payload);
      if(!checkoutAttempt.current||checkoutAttempt.current.fingerprint!==fingerprint){
        checkoutAttempt.current={fingerprint,key:crypto.randomUUID()};
      }
      const reviewMarket=(process.env.NODE_ENV!=="production"&&price.requestedMarket!=="OTHER")?`?market=${price.requestedMarket}`:"";
      let res=await fetch(`/api/checkout${reviewMarket}`,{
        method:"POST",
        headers:{"content-type":"application/json","idempotency-key":checkoutAttempt.current.key},
        body:fingerprint
      });
      // A second tab/request may briefly own the server creation lease. One
      // bounded retry reuses the same idempotency key and cannot create a new order.
      if(res.status===409){
        const first=await res.clone().json().catch(()=>null);
        if(first?.error==="checkout_creation_in_progress"){
          await new Promise(resolve=>window.setTimeout(resolve,800));
          res=await fetch(`/api/checkout${reviewMarket}`,{
            method:"POST",
            headers:{"content-type":"application/json","idempotency-key":checkoutAttempt.current.key},
            body:fingerprint
          });
        }
      }
      const data=await res.json().catch(()=>null);
      if(data?.url){window.location.href=data.url;return;}
      if(data?.mode==="mock"&&process.env.NODE_ENV!=="production"){
        setCheckoutNote("");
        return;
      }
      setCheckoutNote(launch.checkoutUnavailable);
    }catch{setCheckoutNote(launch.checkoutUnavailable);}
    finally{checkoutInFlight.current=false;}
  }

  const fClass=formatClass(format);
  const currentFormatLabel=formatLabels[locale][formatValues.indexOf(format)]||format;
  const name=recipient.trim()||launch.someoneSpecial;
  const curatedAccent:Exclude<AccentMode,"original"|"photo">=(selected.suggestedAccentMode&&["navy","sage","rose"].includes(selected.suggestedAccentMode)?selected.suggestedAccentMode:(feeling==="Warm"?"sage":feeling==="Romantic"?"rose":"navy")) as Exclude<AccentMode,"original"|"photo">;

  return(
    <section className="studio-shell shell" lang={locale} ref={studioShellRef}>
      <input ref={fileInput} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>onPhoto(e.target.files?.[0])}/>
      <div className="studio-topline">
        <div><span className="eyebrow">{m.eyebrow}</span><h1>{m.title}</h1></div>
        <div className="studio-top-actions">
          <div className="progress-pill" aria-label="Progress">
          {m.steps.map((step,i)=><span key={step} className={(phase==="brief"||phase==="revealing"?0:phase==="results"?1:2)===i?"active":""}>{i+1} {step}</span>).reduce<React.ReactNode[]>((acc,node,i)=>i?[...acc,<i key={`line-${i}`}/>,node]:[node],[])}
          </div>
        </div>
      </div>

      {(phase==="brief"||phase==="revealing")&&(
        <div className="studio-grid">
          <form className="brief-card editorial-form" onSubmit={e=>{e.preventDefault();void generate(false);}}>
            <div className="mobile-mini-preview" aria-hidden="true">
              <div className={`mini-card mini-${previewDirection}`}><span>{previewCopy.kicker}</span><strong>{previewCopy.headline}</strong></div>
              <div><b>{launch.liveDirectionPreview}</b><small>{m.feelings[feeling]}</small></div>
            </div>

            <div className="form-section">
              <div className="field-heading"><span>01</span><label>{m.moment}</label></div>
              <div className="chip-row" role="group" aria-label={m.occasion}>
                {occasions.map(x=><button type="button" key={x} onClick={()=>setOccasion(x)} className={occasion===x?"chip active":"chip"} aria-pressed={occasion===x}>{m.occasions[x]}</button>)}
              </div>
              {occasion==="Other"?<input className="inline-custom-field" value={customOccasion} onChange={e=>setCustomOccasion(e.target.value)} placeholder={launch.customOccasionPlaceholder} maxLength={80} autoComplete="off"/>:null}
            </div>

            <div className="form-section">
              <div className="field-heading"><span>02</span><label>{m.forWhom}</label></div>
              <div className="two-fields compact-fields">
                <div>
                  <label className="sub-label" htmlFor="recipient">{m.recipient} <span>· {m.optional}</span></label>
                  <input id="recipient" value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder={launch.recipientPlaceholder} maxLength={120} autoComplete="off"/>
                </div>
                <div><label className="sub-label" htmlFor="relation">{m.relationship} <span>· {m.optional}</span></label><select id="relation" value={relation} onChange={e=>setRelation(e.target.value as typeof relation)}><option value="">{experience.relationshipOptional}</option>{relations.map(x=><option key={x} value={x}>{m.relations[x]??x}</option>)}</select>{relation==="Someone else"?<input className="inline-custom-field relation-custom" value={customRelation} onChange={e=>setCustomRelation(e.target.value)} placeholder={launch.customRelationPlaceholder} maxLength={80} autoComplete="off"/>:null}</div>
              </div>
            </div>

            <div className="form-section">
              <div className="field-heading"><span>03</span><label>{m.feel}</label></div>
              <div className="chip-row" role="group" aria-label={m.feel}>
                {feelings.map(x=><button type="button" key={x} onClick={()=>setFeeling(x)} className={feeling===x?"chip active":"chip"} aria-pressed={feeling===x}>{m.feelings[x]}</button>)}
              </div>
            </div>

            <details className="optional-details" open={Boolean(photoUrl||detail)}>
              <summary>{m.personalTouch}<span>{m.optional}</span></summary>
              <div className="optional-inner">
                <div className="photo-upload-wrap">
                  <button className="photo-upload" type="button" onClick={()=>fileInput.current?.click()}>
                    {photoUrl?<span className="photo-thumb" style={{backgroundImage:`url(${photoUrl})`}}/>:<ImagePlus size={20}/>}
                    <span><b>{photoUrl?m.changePhoto:m.addPhoto}</b><small>{photoUrl?m.photoAdapted:m.photoHint}</small></span>
                  </button>
                  {photoUrl?<button type="button" className="remove-photo" onClick={removePhoto} aria-label={launch.removePhoto}><Trash2 size={15}/>{launch.removePhoto}</button>:null}
                </div>
                <div className="photo-privacy"><span>{launch.photoPrivacy}</span><span>{launch.photoTypes}</span></div>
                <div className="palette-feedback-slot" aria-live="polite">
                  {photoState==="optimizing"?<p className="palette-note"><Sparkles size={14}/>{launch.photoOptimizing}</p>:null}
                  {photoState==="reading"?<p className="palette-note"><Sparkles size={14}/>{m.readingPalette}</p>:null}
                  {photoState==="large"?<p className="palette-note warning">{launch.photoTooLarge}</p>:null}
                  {photoState==="error"?<p className="palette-note warning">{launch.photoInvalid}</p>:null}
                  {photoPalette?<div className="palette-feedback show"><div className="palette-swatches"><i style={{background:photoPalette.primary}}/><i style={{background:photoPalette.secondary}}/><i style={{background:photoPalette.accent}}/></div><p>{localizedPaletteNote(locale,photoPalette,launch.paletteSoftened)}</p></div>:null}
                </div>
                <div className="format-detail-grid">
                  <div className="print-layout-field"><label className="sub-label" id="print-layout-label">{experience.printLayout}</label><div className="print-layout-picker" role="radiogroup" aria-labelledby="print-layout-label">{formatValues.map((x,i)=><button type="button" key={x} className={`print-layout-choice ${format===x?"selected":""}`} role="radio" aria-checked={format===x} onClick={()=>setFormat(x)}><span className={`print-layout-thumb print-layout-thumb-${i}`} aria-hidden="true"><i/></span><span>{formatLabels[locale][i]}</span></button>)}</div><small className="field-hint">{experience.printLayoutHint}</small></div>
                  <div><label className="sub-label" htmlFor="detail">{m.detail}</label><textarea id="detail" value={detail} onChange={e=>setDetail(e.target.value)} placeholder={m.detailPlaceholder} rows={2} maxLength={180}/></div>
                </div>
              </div>
            </details>

            <button className="button button-primary studio-submit" type="submit" disabled={phase==="revealing"}><WandSparkles size={17}/>{m.generate}</button>
            <p className="form-assurance">{m.assurance}</p>
          </form>

          <div className={`live-preview ${phase==="revealing"?"is-revealing":""}`}>
            <div className="preview-head"><span>{launch.liveDirectionPreview}</span><b>{m.feelings[feeling]} · {currentFormatLabel.split("·")[0].trim()}</b></div>
            <p className="preview-note">{launch.previewNote}</p>
            {phase==="revealing"?(
              <div className="reveal-stage signature-reveal" aria-live="polite">
                <div className="reveal-composition reveal-folio">
                  <div className="reveal-folio-pocket" aria-hidden="true"><span/><i/></div>
                  <div className="reveal-paper reveal-echo reveal-echo-left" style={{viewTransitionName:`card-${resultDirections[0]?.id??"editorial"}`} as CSSProperties}/>
                  <div className="reveal-paper reveal-main" style={{viewTransitionName:`card-${resultDirections[1]?.id??"midnight"}`} as CSSProperties}><span className="reveal-rule"/><span className="reveal-personal-mark">{personalMark}</span><strong>{recipient||launch.someoneSpecial}</strong><span className="reveal-copy-line one"/><span className="reveal-copy-line two"/><span className="reveal-art">✦</span></div>
                  <div className="reveal-paper reveal-echo reveal-echo-right" style={{viewTransitionName:`card-${resultDirections[2]?.id??"quiet"}`} as CSSProperties}/>
                </div>
                <p>{generationMessage}</p>
              </div>
            ):(
              <div className="preview-physical">
                <CardVisual direction={previewDirection} recipient={recipient||undefined} kicker={previewCopy.kicker} headline={previewCopy.headline} body={previewCopy.body} photoUrl={photoUrl} photoPalette={photoPalette} accentMode={photoPalette?"photo":"original"} watermark className={fClass} locale={locale} format={format}/>
              </div>
            )}
          </div>
        </div>
      )}

      {phase==="results"&&(
        <div className="results-panel">
          <button className="back-link" onClick={()=>setPhase("brief")}><ArrowLeft size={16}/>{m.refine}</button>
          <span className="eyebrow">{m.directions}</span>
          <h2 data-phase-focus tabIndex={-1}>{interpolate(m.whichFeels,{name})}</h2>
          <p className="results-intro">{m.directionsIntro}</p>
          {usedCuratedFallback?<p className="generation-fallback-note" role="status"><Sparkles size={15}/>{launch.generationFallbackNotice}</p>:null}
          <div className="result-grid">
            {resultDirections.map((d,i)=>{
              const generated=generatedResult?.directions.find(item=>item.id===d.id);
              const resultHeadline=generated?.headline??(d.id==="midnight"?m.copy.midnightHeadline:d.id==="photo"?m.copy.photoHeadline:d.id==="quiet"?launch.quiet.headline:previewCopy.headline);
              const resultBody=generated?.body??(detail||(d.id==="midnight"?m.copy.midnightBody:d.id==="photo"?m.copy.photoBody:d.id==="quiet"?launch.quiet.body:previewCopy.body));
              const resultKicker=generated?.kicker??(d.id==="quiet"?launch.quiet.kicker:previewCopy.kicker);
              const visual=(generated?.visualDirection as VisualDirection|undefined)??d.visual;
              const direction:Direction={...d,visual,templateId:generated?.templateId,templateVersionId:generated?.templateVersionId,templateName:generated?.templateName,templateSource:generated?.templateId?"ai_direction":undefined,templatePosition:i+1,templateEventToken:generated?.templateEventToken,photoMode:generated?.photoMode,suggestedAccentMode:generated?.accentMode};
              const display=d.id==="quiet"?launch.quiet:directionDisplay(locale,d.id as "editorial"|"midnight"|"photo");
              const rationale=generated?.customerRationale?.trim()||(generated?.photoMode==="required"?m.photoAdapted:display.sub);
              return <article className="result-card result-enter" style={{animationDelay:`${i*85}ms`}} key={d.id}>
                <div className="result-direction-index">{experience.direction} {String(i+1).padStart(2,"0")}</div>
                <div className="result-physical">
                  <CardVisual direction={visual} kicker={resultKicker} headline={resultHeadline} body={resultBody} photoUrl={generated?.photoMode==="required"?photoUrl:null} photoPalette={generated?.photoMode==="required"?photoPalette:null} accentMode={(generated?.accentMode??(generated?.photoMode==="required"&&photoPalette?"photo":"original")) as AccentMode} watermark className={fClass} transitionName={`card-${d.id}`} locale={locale} format={format}/>
                </div>
                <div className="result-meta"><h3>{display.name}</h3><p className="direction-rationale"><span>{experience.whyFits}</span>{rationale}</p>{photoPalette&&generated?.photoMode!=="none"?<div className="result-palette" aria-label={experience.photoColor}><i style={{background:photoPalette.primary}}/><i style={{background:photoPalette.secondary}}/><i style={{background:photoPalette.accent}}/><small>{experience.photoColor}</small></div>:null}<button aria-label={launch.chooseNamed(display.name)} className="button button-secondary" onClick={()=>choose(direction)}>{m.choose}</button></div>
              </article>;
            })}
          </div>
          <div className="direction-refresh">
            <span>{launch.noneFeelRight}</span>
            <button className="text-action" type="button" onClick={()=>void generate(true)}><RefreshCw size={15}/>{m.more}</button>
          </div>
        </div>
      )}

      {phase==="finish"&&(
        <div className="finish-panel">
          <button className="back-link" onClick={()=>withTransition(()=>setPhase("results"))}><ArrowLeft size={16}/>{m.changeDesign}</button>
          <div className="finish-grid refined-editor">
            <div className="finish-canvas">
              <PhysicalCardSurface className="finish-physical" intensity={1.05}>
                <CardVisual direction={selected.visual} kicker={selectedKicker} headline={selectedHeadline} body={message} photoUrl={(selected.photoMode==="required"||(selected.photoMode==="optional"&&accentMode==="photo"))?photoUrl:null} photoPalette={(selected.photoMode==="required"||(selected.photoMode==="optional"&&accentMode==="photo"))?photoPalette:null} accentMode={accentMode} watermark className={fClass} transitionName={`card-${selected.id}`} locale={locale} format={format} fitOverride={typeFit}/>
              </PhysicalCardSurface>
            </div>
            <aside className="finish-controls simple-finish">
              <span className="eyebrow">{m.finishEyebrow}</span>
              <h2 data-phase-focus tabIndex={-1}><span className="display-line">{m.finishTitleA}</span>{" "}<span className="display-line">{m.finishTitleB}</span></h2>
              <label htmlFor="message">{m.message}</label>
              <textarea id="message" rows={7} value={message} onChange={e=>{setMessageUndo(null);setMessage(e.target.value);}} maxLength={420}/>
              <div className="message-meta"><span>{message.length}/420</span><span>{copyGuard.suggestShortening?launch.messageFull:launch.magicBalanced}</span></div>
              {copyGuard.suggestShortening?<div className={`message-overflow-note ${copyGuard.hardOverflow?"strong":""}`} role="status"><span>{launch.messageFull}</span><button type="button" onClick={()=>replaceMessage(shortenCardBody(message,locale,copyGuard.softBodyVisualLimit*.76))}>{launch.shortenForMe}</button></div>:null}
              <div className="rewrite-row"><button type="button" onClick={()=>replaceMessage(shortenMessage(message,locale))}>{m.shorter}</button>{generationMode==="live"?<button type="button" disabled={Boolean(rewriteBusy)} onClick={()=>void rewriteTone("warmer")}>{rewriteBusy?"…":experience.refine}</button>:null}{messageUndo!==null?<button type="button" className="undo-action" onClick={undoMessage}>{experience.undo}</button>:null}</div>
              {rewriteNote?<p className="rewrite-note" role="status">{rewriteNote}</p>:null}
              <div className="finish-option">
                <div><Palette size={17}/><span><b>{m.colorMood}</b><small>{m.artDirected}</small></span></div>
                <div className="color-moods" aria-label={m.colorMood}>
                  <button type="button" aria-label="Original" title="Original" className={accentMode==="original"?"selected":""} onClick={()=>setAccentMode("original")}><i className="mood-original"/></button>
                  {photoPalette&&selected.photoMode!=="none"?<button type="button" aria-label={experience.photoColor} title={experience.photoColor} className={accentMode==="photo"?"selected":""} onClick={()=>setAccentMode("photo")}><i style={{background:photoPalette.primary}}/></button>:null}
                  <button type="button" aria-label={experience.curatedColor} title={experience.curatedColor} className={accentMode===curatedAccent?"selected":""} onClick={()=>setAccentMode(curatedAccent)}><i className={`mood-${curatedAccent}`}/></button>
                </div>
              </div>
              {photoUrl&&selected.photoMode==="required"?<button className="finish-option action-option" onClick={()=>fileInput.current?.click()}><div><ImagePlus size={17}/><span><b>{m.changePhoto}</b><small>{m.keepImage}</small></span></div><span>{m.change}</span></button>:null}
              <button className="button button-primary finish-continue" disabled={copyGuard.hardOverflow} aria-disabled={copyGuard.hardOverflow} title={copyGuard.hardOverflow?launch.messageFull:undefined} onClick={()=>{if(copyGuard.hardOverflow)return;haptic("select");if(paymentMode==="on")trackFunnelEvent("checkout_opened",{locale,currency:price.currency,pricingVariant:price.source,purchaseKind:"single",direction:selected.visual,photoUsed:Boolean(photoUrl&&photoState==="ready"),templateId:selected.templateId,templateVersionId:selected.templateVersionId});withTransition(()=>setPhase("checkout"));}}>{paymentMode==="off"?beta.title:m.feelsRight}<span>→</span></button>
            </aside>
          </div>
        </div>
      )}

      {phase==="checkout"&&(
        <div className="checkout-panel">
          <button className="back-link" onClick={()=>withTransition(()=>setPhase("finish"))}><ArrowLeft size={16}/>{m.lastEdit}</button>
          <div className="checkout-shell">
            <div className="checkout-product">
              <PhysicalCardSurface className="checkout-physical" intensity={1.05}>
                <CardVisual direction={selected.visual} kicker={selectedKicker} headline={selectedHeadline} body={message} photoUrl={(selected.photoMode==="required"||(selected.photoMode==="optional"&&accentMode==="photo"))?photoUrl:null} photoPalette={(selected.photoMode==="required"||(selected.photoMode==="optional"&&accentMode==="photo"))?photoPalette:null} accentMode={accentMode} watermark className={fClass} transitionName={`card-${selected.id}`} locale={locale} format={format} fitOverride={typeFit}/>
              </PhysicalCardSurface>
              <span className="checkout-caption">{paymentMode==="off"?beta.eyebrow:m.caption}</span>
              <strong className="checkout-ownership">{paymentMode==="off"?beta.title:launch.buyingThisCard}</strong>
            </div>
            <div className="checkout-copy">
              <span className="eyebrow">{paymentMode==="off"?beta.eyebrow:m.ready}</span>
              <h2 data-phase-focus tabIndex={-1}>{paymentMode==="off"?beta.title:m.checkoutTitle}</h2>
              {paymentMode==="off"?(
                <>
                  <p className="checkout-emotion">{beta.description}</p>
                  <div className="digital-clarity"><p>{launch.noPhysical}</p><p>{launch.printReadyPdf} · {currentFormatLabel}</p></div>
                  <div className="beta-export-actions">
                    <button className="button button-primary checkout-button" disabled={Boolean(betaBusy)} onClick={()=>void downloadBetaAsset("jpg")}>{betaBusy==="jpg"?"…":beta.jpg}</button>
                    <button className="button button-secondary checkout-button" disabled={Boolean(betaBusy)} onClick={()=>void downloadBetaAsset("pdf")}>{betaBusy==="pdf"?"…":beta.pdf}</button>
                  </div>
                  {betaNote?<p className="checkout-note" aria-live="polite">{betaNote}</p>:null}
                </>
              ):(
                <>
                  <p className="checkout-emotion">{interpolate(m.checkoutEmotion,{name})}</p>
                  <div className="checkout-price"><strong>{price.display}</strong><span>{m.oneTime}</span></div>
                  <div className="digital-clarity">
                    <p><strong>{launch.instantDigital}</strong><span>{launch.noPhysical}</span></p>
                    <p>{launch.filesReady}</p>
                    <p>{launch.printReadyPdf} · {currentFormatLabel}</p>
                    <p>{launch.noAccount}</p>
                    <p>{launch.keepForever}</p>
                    <p>{launch.printShare}</p>
                  </div>
                  <button className="button button-primary checkout-button" onClick={beginCheckout}>{m.getCard}</button>
                  <p className="checkout-secure"><Check size={14}/>{m.secure} · <a href={`/terms${(process.env.NODE_ENV!=="production"&&price.requestedMarket!=="OTHER")?`?market=${price.requestedMarket}`:""}#refund`} title={launch.refundPolicy}>{launch.qualityGuarantee}</a></p>
                  {checkoutNote?<p className="checkout-note" aria-live="polite">{checkoutNote}</p>:null}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

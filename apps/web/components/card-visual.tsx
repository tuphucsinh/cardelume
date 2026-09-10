import React, { type CSSProperties } from "react";
import type { VisualDirection } from "@cardelume/templates";
import type { PhotoPalette } from "./photo-palette";
import { cardPhotoContrastPalette, type CanonicalPresentation } from "@cardelume/card-schema";
import { magicTypography, type MagicType } from "./magic-typography";
import type { LocaleCode } from "../i18n/messages";

type Props = {
  direction?: VisualDirection;
  presentation?: CanonicalPresentation | null;
  requirePresentation?: boolean;
  compact?: boolean;
  recipient?: string;
  detail?: string;
  kicker?: string;
  headline?: string;
  body?: string;
  photoUrl?: string|null;
  photoPalette?: PhotoPalette|null;
  watermark?: boolean;
  className?: string;
  transitionName?: string;
  accentMode?: "original"|"photo"|"navy"|"sage"|"rose";
  locale?: LocaleCode;
  format?: string;
  fitOverride?: MagicType;
};

const copy:Record<VisualDirection,{kicker:string;title:string;body:string}>={
  editorial:{kicker:"FOR YOUR DAY",title:"A beautiful year awaits.",body:"With all the good things still to come."},
  midnight:{kicker:"TONIGHT IS YOURS",title:"Make this year glow.",body:"A little light, made just for you."},
  botanical:{kicker:"A NEW SEASON",title:"Grow gently. Bloom boldly.",body:"You’re doing beautifully."},
  washi:{kicker:"WITH QUIET JOY",title:"May this season bring you light.",body:"A small wish, carefully sent."},
  seoul:{kicker:"JUST BECAUSE",title:"You make ordinary days feel softer.",body:"Keep this close."},
  deco:{kicker:"A NIGHT TO REMEMBER",title:"Celebrate beautifully.",body:"Here’s to the moment."},
  photo:{kicker:"A MOMENT WORTH KEEPING",title:"Keep this feeling.",body:"Some memories deserve a place of their own."},
  minimal:{kicker:"FOR YOU",title:"Some things need only a few words.",body:"I’m glad you’re here."},
  watercolor:{kicker:"IN BLOOM",title:"May joy find you here.",body:"Softly, brightly, completely."},
  golden:{kicker:"GOOD DAY ENERGY",title:"Stay golden.",body:"Today, tomorrow, always."},
  quietnoir:{kicker:"SIMPLY SAID",title:"Well done.",body:"You earned this moment."},
  boldpop:{kicker:"BIG DAY ENERGY",title:"YES. YOU DID IT.",body:"Go celebrate properly."},
  kawaii:{kicker:"A LITTLE JOY",title:"Yay for you!",body:"Tiny confetti. Huge feelings."},
  letterpress:{kicker:"WITH WARMEST WISHES",title:"A good life, beautifully lived.",body:"With love and admiration."},
  celestial:{kicker:"UNDER THE SAME SKY",title:"Wish on something bright.",body:"May it find its way to you."},
  gouache:{kicker:"LITTLE WONDERS",title:"Today is for delight.",body:"Keep noticing the beautiful things."},
  whispered:{kicker:"A QUIET NOTE",title:"Some words deserve room to breathe.",body:"Sent with care, and only what matters."},
  museum:{kicker:"FROM THE ARCHIVE",title:"A moment worth keeping.",body:"For the story you will want to remember."},
  orbit:{kicker:"MADE AROUND YOU",title:"Your day, in its own orbit.",body:"A small universe with your name at the center."},
  ribbon:{kicker:"ONE BEAUTIFUL LINE",title:"Here is to what connects us.",body:"A wish drawn forward, without hurry."},
  memory:{kicker:"KEEP THIS MOMENT",title:"This one belongs in the story.",body:"For a memory that deserves its own frame."},
  typecelebration:{kicker:"THIS CALLS FOR JOY",title:"Make the moment unmistakable.",body:"Bold enough to remember. Warm enough to keep."},
  seal:{kicker:"PERSONALLY YOURS",title:"A few words. Entirely for you.",body:"Quietly made, carefully sent."},
  pressed:{kicker:"MADE TO LAST",title:"Let the feeling leave an impression.",body:"A keepsake in paper, shadow and light."},
  ink:{kicker:"BETWEEN THE LINES",title:"There is beauty in the pause.",body:"A little space for what is hard to say."},
  petal:{kicker:"IN YOUR SEASON",title:"Something beautiful is unfolding.",body:"May it find you at exactly the right time."},
  ledger:{kicker:"MARK THIS MOMENT",title:"Tonight, everything aligns.",body:"A quiet constellation made just for this day."},
  softfold:{kicker:"GENTLY HELD",title:"A wish with room around it.",body:"Softly composed for a moment that matters."}
};

function isVisualDirection(value: unknown): value is VisualDirection {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(copy, value);
}

function accentPalette(mode:Props["accentMode"],photoPalette?:PhotoPalette|null){
  if(mode==="photo"&&photoPalette)return{primary:photoPalette.primary,secondary:photoPalette.secondary,accent:photoPalette.accent};
  if(mode==="navy")return{primary:"#0b1730",secondary:"#f3ead8",accent:"#c3a16c"};
  if(mode==="sage")return{primary:"#536b5b",secondary:"#edf0e7",accent:"#a98457"};
  if(mode==="rose")return{primary:"#865b62",secondary:"#f4e9e7",accent:"#b58a65"};
  return null;
}

export function CardVisual({
  direction,presentation,requirePresentation=false,compact,recipient,detail,kicker,headline,body,photoUrl,photoPalette,watermark=false,
  className="",transitionName,accentMode="original",locale="en",format="Portrait · 5 × 7 in",fitOverride
}:Props){
  let resolvedDirection: VisualDirection | null = null;
  if (presentation) {
    if (isVisualDirection(presentation.visualDirection)) {
      resolvedDirection = presentation.visualDirection;
    }
  } else if (!requirePresentation && isVisualDirection(direction)) {
    resolvedDirection = direction;
  }

  if (!resolvedDirection) {
    return(
      <div lang={locale} className={`paper-card paper-card-unavailable ${compact?"paper-card-compact":""} ${className}`} role="status" aria-label="Preview unavailable">
        <div className="material-grain" aria-hidden="true"/>
        <div className="card-copy" style={{textAlign:"center",justifyContent:"center"}}>
          <span className="card-kicker">CARDELUME</span>
          <p style={{color:"var(--muted)",margin:"10px auto"}}>Preview unavailable</p>
        </div>
      </div>
    );
  }

  const c=copy[resolvedDirection];
  const resolvedHeadline=headline??(recipient?c.title.replace(/\byou\b/gi,recipient):c.title);
  const resolvedBody=body??detail??c.body;
  const type=fitOverride??magicTypography(resolvedHeadline,resolvedBody,{locale,format});
  const palette=accentPalette(accentMode,photoPalette);
  const contrastPalette=accentMode==="photo"&&photoPalette?cardPhotoContrastPalette(photoPalette):null;

  const layout = presentation?.layout;
  const headlineScale = layout?.headlineScale ?? 1;
  const bodyScale = layout?.bodyScale ?? 1;
  const headlinePx = Math.round((compact ? Math.min(type.headlinePx, 34) : type.headlinePx) * headlineScale);
  const bodyPx = Math.round((compact ? Math.min(type.bodyPx, 10) : type.bodyPx) * bodyScale);
  const headlineWidthPct = layout ? Math.min(type.headlineMaxWidthPct, layout.headlineWidthPct) : type.headlineMaxWidthPct;
  const bodyWidthPct = layout ? Math.min(type.bodyMaxWidthPct, layout.bodyWidthPct) : type.bodyMaxWidthPct;
  const showSignatureMark = layout ? layout.showSignatureMark : true;

  const photoSupported = presentation ? (presentation.photoSupported || presentation.photoMode !== "none") : (resolvedDirection === "photo" || resolvedDirection === "memory");
  const showPhoto = Boolean(photoUrl && photoSupported);

  const style={
    "--magic-headline":`${headlinePx}px`,
    "--magic-body":`${bodyPx}px`,
    "--magic-tracking":`${type.trackingEm}em`,
    "--magic-headline-leading":String(type.headlineLineHeight),
    "--magic-body-leading":String(type.bodyLineHeight),
    "--magic-headline-width":`${headlineWidthPct}%`,
    "--magic-body-width":`${bodyWidthPct}%`,
    ...(palette?{"--photo-primary":palette.primary,"--photo-secondary":palette.secondary,"--photo-accent":palette.accent}:{}),
    ...(contrastPalette?{
      "--photo-bg":contrastPalette.background,"--photo-bg-alt":contrastPalette.backgroundAlt,"--photo-fg":contrastPalette.foreground,
      "--photo-accent-safe":contrastPalette.accent,"--photo-dark-bg":contrastPalette.darkBackground,"--photo-dark-bg-alt":contrastPalette.darkBackgroundAlt,
      "--photo-dark-fg":contrastPalette.darkForeground,"--photo-dark-accent-safe":contrastPalette.darkAccent
    }:{}),
    ...(layout?.darkSurface && accentMode === "original" ? {
      background: "radial-gradient(circle at 72% 12%, rgba(216, 192, 149, .08), transparent 24%), linear-gradient(145deg, #07142c, #112747)",
      color: "#f4ead9"
    } : {}),
    ...(transitionName?{viewTransitionName:transitionName}:{})
  } as CSSProperties & Record<string,string>;

  const textAlign = layout ? (layout.anchor === "start" ? "left" : layout.anchor === "end" ? "right" : "center") : undefined;
  const alignItems = layout ? (layout.anchor === "start" ? "flex-start" : layout.anchor === "end" ? "flex-end" : "center") : undefined;
  const copyBlockStyle: CSSProperties = layout?.anchor === "start"
    ? { marginLeft: 0, marginRight: "auto" }
    : (layout?.anchor === "end" ? { marginLeft: "auto", marginRight: 0 } : {});

  return(
    <div
      lang={locale}
      className={`paper-card card-${resolvedDirection} ${presentation ? `template-${presentation.rendererTemplateKey} archetype-${presentation.archetype}` : ""} density-${type.density} script-${type.script} ${compact?"paper-card-compact":""} ${photoPalette?"has-extracted-palette":""} ${accentMode!=="original"?`accent-${accentMode}`:""} ${className}`}
      style={style}
      data-template-id={presentation?.templateId}
      data-template-version-id={presentation?.templateVersionId}
      data-renderer-template-key={presentation?.rendererTemplateKey}
      data-archetype={presentation?.archetype}
      data-visual-direction={resolvedDirection}
      data-format={format}
    >
      <div className="material-grain" aria-hidden="true"/>
      <div className="card-art" aria-hidden="true">
        {showPhoto ? (
          <span
            className="photo-art"
            style={{
              backgroundImage:`url(${photoUrl})`,
              ...(layout?.photoWindow ? {
                left: `${layout.photoWindow.xPct * 100}%`,
                top: `${layout.photoWindow.yPct * 100}%`,
                width: `${layout.photoWindow.widthPct * 100}%`,
                height: `${layout.photoWindow.heightPct * 100}%`
              } : {})
            }}
          />
        ) : null}
        <span className="art-a"/><span className="art-b"/><span className="art-c"/>
      </div>
      <div
        className="card-copy"
        style={{
          ...(textAlign ? { textAlign } : {}),
          ...(alignItems ? { alignItems } : {})
        }}
      >
        <span className="card-kicker">{kicker??c.kicker}</span>
        <h3 style={copyBlockStyle}>{resolvedHeadline}</h3>
        <p style={copyBlockStyle}>{resolvedBody}</p>
        {showSignatureMark ? <span className="card-spark">✦</span> : null}
      </div>
      {watermark?<div className="preview-watermark" aria-hidden="true"><span>CARDELUME</span><i/>PREVIEW</div>:null}
    </div>
  );
}

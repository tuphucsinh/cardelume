import type { CSSProperties } from "react";
import type { VisualDirection } from "@cardelume/templates";
import type { PhotoPalette } from "./photo-palette";
import { cardPhotoContrastPalette } from "@cardelume/card-schema";
import { magicTypography, type MagicType } from "./magic-typography";
import type { LocaleCode } from "../i18n/messages";

type Props = {
  direction:VisualDirection;
  compact?:boolean;
  recipient?:string;
  detail?:string;
  kicker?:string;
  headline?:string;
  body?:string;
  photoUrl?:string|null;
  photoPalette?:PhotoPalette|null;
  watermark?:boolean;
  className?:string;
  transitionName?:string;
  accentMode?:"original"|"photo"|"navy"|"sage"|"rose";
  locale?:LocaleCode;
  format?:string;
  fitOverride?:MagicType;
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

function accentPalette(mode:Props["accentMode"],photoPalette?:PhotoPalette|null){
  if(mode==="photo"&&photoPalette)return{primary:photoPalette.primary,secondary:photoPalette.secondary,accent:photoPalette.accent};
  if(mode==="navy")return{primary:"#0b1730",secondary:"#f3ead8",accent:"#c3a16c"};
  if(mode==="sage")return{primary:"#536b5b",secondary:"#edf0e7",accent:"#a98457"};
  if(mode==="rose")return{primary:"#865b62",secondary:"#f4e9e7",accent:"#b58a65"};
  return null;
}

export function CardVisual({
  direction,compact,recipient,detail,kicker,headline,body,photoUrl,photoPalette,watermark=false,
  className="",transitionName,accentMode="original",locale="en",format="Portrait · 5 × 7 in",fitOverride
}:Props){
  const c=copy[direction];
  const resolvedHeadline=headline??(recipient?c.title.replace(/\byou\b/gi,recipient):c.title);
  const resolvedBody=body??detail??c.body;
  const type=fitOverride??magicTypography(resolvedHeadline,resolvedBody,{locale,format});
  const palette=accentPalette(accentMode,photoPalette);
  const contrastPalette=accentMode==="photo"&&photoPalette?cardPhotoContrastPalette(photoPalette):null;
  const style={
    "--magic-headline":`${compact?Math.min(type.headlinePx,34):type.headlinePx}px`,
    "--magic-body":`${compact?Math.min(type.bodyPx,10):type.bodyPx}px`,
    "--magic-tracking":`${type.trackingEm}em`,
    "--magic-headline-leading":String(type.headlineLineHeight),
    "--magic-body-leading":String(type.bodyLineHeight),
    "--magic-headline-width":`${type.headlineMaxWidthPct}%`,
    "--magic-body-width":`${type.bodyMaxWidthPct}%`,
    ...(palette?{"--photo-primary":palette.primary,"--photo-secondary":palette.secondary,"--photo-accent":palette.accent}:{}),
    ...(contrastPalette?{
      "--photo-bg":contrastPalette.background,"--photo-bg-alt":contrastPalette.backgroundAlt,"--photo-fg":contrastPalette.foreground,
      "--photo-accent-safe":contrastPalette.accent,"--photo-dark-bg":contrastPalette.darkBackground,"--photo-dark-bg-alt":contrastPalette.darkBackgroundAlt,
      "--photo-dark-fg":contrastPalette.darkForeground,"--photo-dark-accent-safe":contrastPalette.darkAccent
    }:{}),
    ...(transitionName?{viewTransitionName:transitionName}:{})
  } as CSSProperties & Record<string,string>;

  return(
    <div lang={locale} className={`paper-card card-${direction} density-${type.density} script-${type.script} ${compact?"paper-card-compact":""} ${photoPalette?"has-extracted-palette":""} ${accentMode!=="original"?`accent-${accentMode}`:""} ${className}`} style={style}>
      <div className="material-grain" aria-hidden="true"/>
      <div className="card-art" aria-hidden="true">
        {(direction==="photo"||direction==="memory")&&photoUrl?<span className="photo-art" style={{backgroundImage:`url(${photoUrl})`}}/>:null}
        <span className="art-a"/><span className="art-b"/><span className="art-c"/>
      </div>
      <div className="card-copy">
        <span className="card-kicker">{kicker??c.kicker}</span>
        <h3>{resolvedHeadline}</h3>
        <p>{resolvedBody}</p>
        <span className="card-spark">✦</span>
      </div>
      {watermark?<div className="preview-watermark" aria-hidden="true"><span>CARDELUME</span><i/>PREVIEW</div>:null}
    </div>
  );
}

// CardeLume Photo Palette contrast guard shared by browser preview and final renderer.
// WCAG contrast uses sRGB relative luminance, not simple RGB brightness.
export type CardPhotoPaletteInput={primary:string;secondary:string;accent:string};
export type CardPhotoContrastPalette={
  background:string;
  backgroundAlt:string;
  foreground:string;
  accent:string;
  darkBackground:string;
  darkBackgroundAlt:string;
  darkForeground:string;
  darkAccent:string;
};

function cardHexRgb(hex:string):[number,number,number]{
  const value=hex.trim().replace(/^#/,'');
  if(!/^[0-9a-fA-F]{6}$/.test(value))throw new Error('invalid_card_color');
  return[parseInt(value.slice(0,2),16),parseInt(value.slice(2,4),16),parseInt(value.slice(4,6),16)];
}

function cardRgbHex(rgb:readonly [number,number,number]){
  return`#${rgb.map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('')}`;
}

export function cardBlendHex(a:string,b:string,t:number){
  const A=cardHexRgb(a),B=cardHexRgb(b),mix=Math.max(0,Math.min(1,t));
  return cardRgbHex([A[0]*(1-mix)+B[0]*mix,A[1]*(1-mix)+B[1]*mix,A[2]*(1-mix)+B[2]*mix]);
}

function cardLinearChannel(value:number){
  const v=value/255;
  return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);
}

export function cardRelativeLuminance(hex:string){
  const[r,g,b]=cardHexRgb(hex);
  return .2126*cardLinearChannel(r)+.7152*cardLinearChannel(g)+.0722*cardLinearChannel(b);
}

export function cardContrastRatio(a:string,b:string){
  const la=cardRelativeLuminance(a),lb=cardRelativeLuminance(b);
  const hi=Math.max(la,lb),lo=Math.min(la,lb);
  return(hi+.05)/(lo+.05);
}

export function cardMinContrast(foreground:string,backgrounds:readonly string[]){
  if(!backgrounds.length)throw new Error('card_contrast_background_required');
  return Math.min(...backgrounds.map(bg=>cardContrastRatio(foreground,bg)));
}

export function cardEnsureContrast(candidate:string,backgrounds:readonly string[],minimum=4.5){
  if(cardMinContrast(candidate,backgrounds)>=minimum)return candidate.toLowerCase();
  const anchors=['#0b1730','#fffaf0'] as const;
  const anchor=cardMinContrast(anchors[0],backgrounds)>=cardMinContrast(anchors[1],backgrounds)?anchors[0]:anchors[1];
  for(let step=1;step<=100;step++){
    const adjusted=cardBlendHex(candidate,anchor,step/100);
    if(cardMinContrast(adjusted,backgrounds)>=minimum)return adjusted;
  }
  if(cardMinContrast(anchor,backgrounds)>=minimum)return anchor;
  throw new Error("card_contrast_target_unreachable");
}

export function cardPhotoContrastPalette(input:CardPhotoPaletteInput):CardPhotoContrastPalette{
  const background=cardBlendHex(input.secondary,'#fbf6eb',.82);
  const backgroundAlt=cardBlendHex(background,'#f1eadc',.08);
  const lightBackgrounds=[background,backgroundAlt] as const;
  const foreground=cardEnsureContrast(cardBlendHex(input.primary,'#142038',.38),lightBackgrounds,4.5);
  const accent=cardEnsureContrast(cardBlendHex(input.accent,'#8c6c43',.32),lightBackgrounds,4.5);

  // Dark directions use a narrow navy range; include the noir base as a third
  // background so photo-derived kicker/accent color stays readable everywhere.
  const darkBackground=cardBlendHex(input.primary,'#07142d',.76);
  const darkBackgroundAlt='#10213d';
  const darkBackgrounds=[darkBackground,darkBackgroundAlt,'#111820'] as const;
  const darkForeground=cardEnsureContrast('#f8f2e8',darkBackgrounds,4.5);
  const darkAccent=cardEnsureContrast(cardBlendHex(input.accent,'#d8c095',.28),darkBackgrounds,4.5);

  return{background,backgroundAlt,foreground,accent,darkBackground,darkBackgroundAlt,darkForeground,darkAccent};
}

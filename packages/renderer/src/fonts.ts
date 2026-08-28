import { existsSync } from "node:fs";

const defaultDirs={
  latin:["/usr/share/fonts/opentype/ebgaramond","/usr/share/fonts/truetype/lato"],
  cjk:["/usr/share/fonts/opentype/noto"]
};

function scriptFor(locale:string){
  const lc=locale.toLowerCase();
  if(lc.startsWith("ja"))return"ja" as const;
  if(lc.startsWith("ko"))return"ko" as const;
  if(lc.startsWith("zh"))return"zh" as const;
  return"latin" as const;
}

function customDirs(){
  return (process.env.RENDER_FONT_DIRS||"").split(",").map(x=>x.trim()).filter(Boolean);
}

export type RendererFontConfig={
  loadSystemFonts:boolean;
  fontDirs:string[];
  serifFamily:string;
  sansSerifFamily:string;
  defaultFontFamily:string;
};

export function rendererFontConfig(locale:string):RendererFontConfig{
  const script=scriptFor(locale);
  const custom=customDirs();
  const expected=script==="latin"?defaultDirs.latin:defaultDirs.cjk;
  const dirs=(custom.length?custom:expected).filter(existsSync);
  const strict=(process.env.RENDER_REQUIRE_DETERMINISTIC_FONTS??(process.env.NODE_ENV==="production"?"true":"false"))==="true";
  if(strict&&dirs.length!==(custom.length?custom:expected).length){
    throw new Error(`renderer_fonts_missing:${script}`);
  }
  if(dirs.length===0){
    // Development-only escape hatch. Production defaults to strict mode.
    return{loadSystemFonts:true,fontDirs:[],serifFamily:"serif",sansSerifFamily:"sans-serif",defaultFontFamily:"sans-serif"};
  }
  if(script==="ja")return{loadSystemFonts:false,fontDirs:dirs,serifFamily:"Noto Serif CJK JP",sansSerifFamily:"Noto Sans CJK JP",defaultFontFamily:"Noto Sans CJK JP"};
  if(script==="ko")return{loadSystemFonts:false,fontDirs:dirs,serifFamily:"Noto Serif CJK KR",sansSerifFamily:"Noto Sans CJK KR",defaultFontFamily:"Noto Sans CJK KR"};
  if(script==="zh")return{loadSystemFonts:false,fontDirs:dirs,serifFamily:"Noto Serif CJK SC",sansSerifFamily:"Noto Sans CJK SC",defaultFontFamily:"Noto Sans CJK SC"};
  return{loadSystemFonts:false,fontDirs:dirs,serifFamily:"EB Garamond",sansSerifFamily:"Lato",defaultFontFamily:"Lato"};
}

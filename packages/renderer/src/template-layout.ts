export type TemplateTextAnchor="start"|"middle"|"end";
export type TemplateLayoutProfile={
  anchor:TemplateTextAnchor;
  xPct:number;
  kickerYPct:number;
  headlineYPct:number;
  bodyYPct:number;
  signatureYPct:number;
  headlineWidthPct:number;
  bodyWidthPct:number;
  headlineScale:number;
  bodyScale:number;
  showBorder:boolean;
  showSignatureMark:boolean;
  darkSurface?:boolean;
  photoWindow?:{xPct:number;yPct:number;widthPct:number;heightPct:number};
};

const centered:TemplateLayoutProfile={
  anchor:"middle",xPct:.5,kickerYPct:.267,headlineYPct:.43,bodyYPct:.59,signatureYPct:.755,
  headlineWidthPct:88,bodyWidthPct:90,headlineScale:1,bodyScale:1,showBorder:true,showSignatureMark:true
};

const profiles:Record<string,Partial<TemplateLayoutProfile>>={
  "whispered-type":{anchor:"start",xPct:.10,kickerYPct:.20,headlineYPct:.43,bodyYPct:.61,signatureYPct:.80,headlineWidthPct:73,bodyWidthPct:72,headlineScale:1.08,showBorder:false,showSignatureMark:false},
  "museum-note":{anchor:"start",xPct:.12,kickerYPct:.19,headlineYPct:.46,bodyYPct:.61,signatureYPct:.82,headlineWidthPct:70,bodyWidthPct:70,headlineScale:.92,bodyScale:.92,showBorder:false,showSignatureMark:false},
  "monogram-orbit":{anchor:"middle",xPct:.5,kickerYPct:.16,headlineYPct:.61,bodyYPct:.70,signatureYPct:.82,headlineWidthPct:78,bodyWidthPct:75,headlineScale:.92,bodyScale:.9,showBorder:false,showSignatureMark:false},
  "ribbon-line":{anchor:"start",xPct:.10,kickerYPct:.23,headlineYPct:.55,bodyYPct:.68,signatureYPct:.82,headlineWidthPct:76,bodyWidthPct:74,headlineScale:.96,bodyScale:.94,showBorder:false,showSignatureMark:false},
  "memory-window":{anchor:"start",xPct:.12,kickerYPct:.70,headlineYPct:.78,bodyYPct:.87,signatureYPct:.94,headlineWidthPct:74,bodyWidthPct:74,headlineScale:.78,bodyScale:.78,showBorder:false,showSignatureMark:false,photoWindow:{xPct:.12,yPct:.10,widthPct:.68,heightPct:.48}},
  "type-celebration":{anchor:"start",xPct:.10,kickerYPct:.18,headlineYPct:.39,bodyYPct:.68,signatureYPct:.82,headlineWidthPct:78,bodyWidthPct:72,headlineScale:1.12,bodyScale:.94,showBorder:false,showSignatureMark:false},
  "quiet-seal":{anchor:"middle",xPct:.5,kickerYPct:.19,headlineYPct:.49,bodyYPct:.61,signatureYPct:.77,headlineWidthPct:76,bodyWidthPct:72,headlineScale:.9,bodyScale:.9,showBorder:false,showSignatureMark:false},
  "pressed-shadow":{anchor:"start",xPct:.12,kickerYPct:.18,headlineYPct:.64,bodyYPct:.75,signatureYPct:.87,headlineWidthPct:74,bodyWidthPct:72,headlineScale:.94,bodyScale:.9,showBorder:false,showSignatureMark:false},
  "ink-pause":{anchor:"start",xPct:.10,kickerYPct:.19,headlineYPct:.56,bodyYPct:.68,signatureYPct:.82,headlineWidthPct:77,bodyWidthPct:74,headlineScale:.96,bodyScale:.92,showBorder:false,showSignatureMark:false},
  "petal-geometry":{anchor:"start",xPct:.10,kickerYPct:.21,headlineYPct:.54,bodyYPct:.67,signatureYPct:.81,headlineWidthPct:70,bodyWidthPct:70,headlineScale:.95,bodyScale:.9,showBorder:false,showSignatureMark:false},
  "night-ledger":{anchor:"start",xPct:.10,kickerYPct:.19,headlineYPct:.55,bodyYPct:.68,signatureYPct:.82,headlineWidthPct:76,bodyWidthPct:74,headlineScale:.96,bodyScale:.9,showBorder:false,showSignatureMark:false,darkSurface:true},
  "soft-fold":{anchor:"start",xPct:.10,kickerYPct:.19,headlineYPct:.45,bodyYPct:.58,signatureYPct:.82,headlineWidthPct:70,bodyWidthPct:70,headlineScale:.96,bodyScale:.9,showBorder:false,showSignatureMark:false}
};

export function templateLayoutProfile(templateId:string):TemplateLayoutProfile{
  return {...centered,...(profiles[templateId]??{})};
}

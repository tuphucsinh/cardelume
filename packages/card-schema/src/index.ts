import { z } from "zod";

export const CreateBriefSchema = z.object({
  occasion: z.string().min(1).max(80),
  recipient: z.string().max(120).optional().default(""),
  relationship: z.string().min(1).max(80),
  feeling: z.string().min(1).max(80),
  personalDetail: z.string().max(1000).optional().default(""),
  format: z.enum(["portrait-5x7", "folded-5x7", "square-5x5", "landscape-7x5", "postcard-6x4"]).default("portrait-5x7"),
  locale: z.string().max(20).default("en")
});

export const SafeTextBlockSchema = z.object({
  id: z.string().min(1).max(80),
  text: z.string().max(1500),
  role: z.enum(["kicker", "headline", "body", "signature"]),
  align: z.enum(["left", "center", "right"]).default("center")
});

export const PresentationLayoutProfileSchema = z.object({
  anchor: z.enum(["start", "middle", "end"]),
  xPct: z.number(),
  kickerYPct: z.number(),
  headlineYPct: z.number(),
  bodyYPct: z.number(),
  signatureYPct: z.number(),
  headlineWidthPct: z.number(),
  bodyWidthPct: z.number(),
  headlineScale: z.number(),
  bodyScale: z.number(),
  showBorder: z.boolean(),
  showSignatureMark: z.boolean(),
  darkSurface: z.boolean().optional(),
  photoWindow: z.object({
    xPct: z.number(),
    yPct: z.number(),
    widthPct: z.number(),
    heightPct: z.number()
  }).optional()
});

export const CanonicalPresentationSchema = z.object({
  templateId: z.string().uuid(),
  templateVersionId: z.string().uuid(),
  rendererTemplateKey: z.string().min(1).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(120),
  material: z.string().min(1).max(120),
  visualDirection: z.string().min(1).max(40),
  archetype: z.enum(["editorial", "midnight", "photo", "quiet"]),
  layout: PresentationLayoutProfileSchema,
  typographyId: z.string().min(1).regex(/^[a-z0-9-]+$/),
  headlineCapacity: z.enum(["short", "medium", "long"]).default("medium"),
  bodyCapacity: z.enum(["short", "medium", "long"]).default("medium"),
  scriptSupport: z.array(z.enum(["latin", "cjk", "hangul"])).min(1),
  photoMode: z.enum(["none", "optional", "required"]),
  photoSupported: z.boolean(),
  photoRequired: z.boolean(),
  familyId: z.string().uuid().optional(),
  version: z.number().int().positive().default(1),
  materialWorld: z.enum([
    "editorial_luxury", "nocturne_foil", "letterpress_tactile",
    "photo_keepsake", "quiet_modern", "personal_mark", "celebration_energy"
  ]).optional(),
  colorWorld: z.enum(["ivory", "navy", "sage", "warm", "soft_color", "noir", "photo"]).optional(),
  motionProfile: z.enum([
    "static_paper", "foil_light", "pressed_depth",
    "photo_palette", "personal_mark", "quiet_plane"
  ]).optional(),
  energy: z.enum(["quiet", "warm", "cinematic", "tactile", "bold", "personal"]).optional()
});

export const CanonicalPresentationIdentitySchema = z.object({
  templateId: z.string().uuid(),
  templateVersionId: z.string().uuid()
});

export type PresentationLayoutProfile = z.infer<typeof PresentationLayoutProfileSchema>;
export type CanonicalPresentation = z.infer<typeof CanonicalPresentationSchema>;
export type CanonicalPresentationIdentity = z.infer<typeof CanonicalPresentationIdentitySchema>;

export function assertCanonicalPresentationIdentity(input: {
  templateId?: unknown;
  templateVersionId?: unknown;
  visualDirection?: unknown;
}): CanonicalPresentationIdentity {
  if (input.visualDirection && (!input.templateId || !input.templateVersionId)) {
    throw new Error(`invalid_presentation_identity: visualDirection alone ('${input.visualDirection}') is not valid presentation identity; managed templateId and templateVersionId are required`);
  }
  if (!input.templateId && !input.templateVersionId) {
    throw new Error("missing_template_identity: managed templateId and templateVersionId are required");
  }
  if (!input.templateId || !input.templateVersionId) {
    throw new Error(`partial_template_identity_rejected: both templateId (${String(input.templateId)}) and templateVersionId (${String(input.templateVersionId)}) are required`);
  }
  const parsed = CanonicalPresentationIdentitySchema.safeParse({
    templateId: input.templateId,
    templateVersionId: input.templateVersionId
  });
  if (!parsed.success) {
    throw new Error(`invalid_template_identity: ${parsed.error.message}`);
  }
  return parsed.data;
}

export const CardDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  templateVersion: z.string().min(1),
  rendererVersion: z.string().min(1),
  marketPackVersion: z.string().min(1),
  id: z.string().uuid(),
  locale: z.string().min(2).max(20),
  format: z.enum(["portrait-5x7", "folded-5x7", "square-5x5", "landscape-7x5", "postcard-6x4"]),
  templateId: z.string().regex(/^[a-z0-9-]+$/),
  paletteId: z.string().regex(/^[a-z0-9-]+$/),
  typographyId: z.string().regex(/^[a-z0-9-]+$/),
  artworkAssetIds: z.array(z.string().regex(/^[a-zA-Z0-9_./-]+$/)).max(8),
  photoPalette: z.object({
    primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    temperature: z.enum(["warm","cool","balanced"]),
    luminance: z.number().min(0).max(1)
  }).optional(),
  photoTreatment: z.enum(["full-bleed","portrait-frame","soft-crop","polaroid","editorial","background-blur","type-overlay"]).optional(),
  typographyFit: z.object({
    headlinePx: z.number().positive(),
    bodyPx: z.number().positive(),
    trackingEm: z.number(),
    lineHeight: z.number().positive().optional(),
    maxWidthPct: z.number().min(40).max(100).optional(),
    headlineLineHeight: z.number().positive().optional(),
    bodyLineHeight: z.number().positive().optional(),
    headlineMaxWidthPct: z.number().min(40).max(100).optional(),
    bodyMaxWidthPct: z.number().min(40).max(100).optional(),
    density: z.enum(["airy","balanced","compact"]).optional(),
    script: z.enum(["latin","cjk","hangul"]).optional()
  }).optional(),
  textBlocks: z.array(SafeTextBlockSchema).min(1).max(12),
  metadata: z.object({
    occasion: z.string().max(80),
    relationship: z.string().max(80),
    feeling: z.string().max(80)
  }),
  presentation: CanonicalPresentationSchema.optional()
}).superRefine((value, ctx) => {
  if (value.presentation) {
    if (value.presentation.rendererTemplateKey !== value.templateId) {
      ctx.addIssue({
        code: "custom",
        message: `presentation_template_key_mismatch: presentation.rendererTemplateKey (${value.presentation.rendererTemplateKey}) !== templateId (${value.templateId})`,
        path: ["presentation", "rendererTemplateKey"]
      });
    }
  }
});

export const CheckoutCardSnapshotSchema = z.object({
  locale: z.string().min(2).max(20),
  format: CardDocumentSchema.shape.format,
  direction: z.enum(["editorial","midnight","photo","quiet"]),
  templateId: z.string().uuid().optional(),
  templateVersionId: z.string().uuid().optional(),
  presentation: CanonicalPresentationSchema.optional(),
  templateSource: z.enum(["ai_direction","recommended","market_pick","show_more"]).optional(),
  occasion: z.string().min(1).max(80),
  relationship: z.string().min(1).max(80),
  feeling: z.string().min(1).max(80),
  kicker: z.string().max(1500),
  headline: z.string().min(1).max(1500),
  body: z.string().max(1500),
  accentMode: z.enum(["original","photo","navy","sage","rose"]),
  photoPalette: CardDocumentSchema.shape.photoPalette,
  photoAssetId: z.string().uuid().optional(),
  visualDirection: z.string().max(40).optional()
}).superRefine((value,ctx)=>{
  if(Boolean(value.templateId)!==Boolean(value.templateVersionId))ctx.addIssue({code:"custom",message:"template_identity_incomplete",path:["templateVersionId"]});
  if(value.visualDirection&&(!value.templateId||!value.templateVersionId)){
    ctx.addIssue({code:"custom",message:"invalid_presentation_identity: visualDirection alone is not valid presentation identity",path:["visualDirection"]});
  }
  if(value.presentation){
    if(value.templateId&&value.presentation.templateId!==value.templateId){
      ctx.addIssue({code:"custom",message:"presentation_template_id_mismatch",path:["presentation","templateId"]});
    }
    if(value.templateVersionId&&value.presentation.templateVersionId!==value.templateVersionId){
      ctx.addIssue({code:"custom",message:"presentation_template_version_id_mismatch",path:["presentation","templateVersionId"]});
    }
  }
  if(value.photoAssetId&&!value.photoPalette)ctx.addIssue({code:"custom",message:"photo_palette_required",path:["photoPalette"]});
  if(value.accentMode==="photo"&&!value.photoAssetId)ctx.addIssue({code:"custom",message:"photo_accent_requires_asset",path:["accentMode"]});
});

export type CreateBrief = z.infer<typeof CreateBriefSchema>;
export type CardDocument = z.infer<typeof CardDocumentSchema>;
export type CheckoutCardSnapshot = z.infer<typeof CheckoutCardSnapshotSchema>;

export const GenerationBriefSchema=z.object({
  occasion:z.string().min(1).max(80),
  recipient:z.string().max(120).optional().default(""),
  relationship:z.string().min(1).max(80),
  feeling:z.string().min(1).max(80),
  detail:z.string().max(180).optional().default(""),
  format:CardDocumentSchema.shape.format,
  locale:z.string().min(2).max(20),
  hasPhoto:z.boolean(),
  photoProfile:z.object({
    orientation:z.enum(["portrait","landscape","square"]),
    temperature:z.enum(["warm","cool","balanced"]),
    luminance:z.number().min(0).max(1),
    paletteConfidence:z.number().min(0).max(1),
    softened:z.boolean()
  }).optional(),
  refreshContext:z.object({
    priorTemplateIds:z.array(z.string().uuid()).max(3).optional(),
    seenTemplateIdentities:z.array(CanonicalPresentationIdentitySchema).max(128).optional()
  }).optional(),
  selectionContext:z.object({
    rawOccasion:z.string().min(1).max(80),
    rawFeeling:z.string().min(1).max(80),
    normalizedOccasion:z.string().min(1).max(80),
    normalizedFeeling:z.string().min(1).max(80)
  }).optional(),
  market:z.string().min(2).max(16).default("GLOBAL")
});
export const GeneratedDirectionSchema=z.object({
  id:z.enum(["editorial","midnight","photo","quiet"]),
  templateId:z.string().uuid().optional(),
  templateVersionId:z.string().uuid().optional(),
  templateName:z.string().min(1).max(120).optional(),
  visualDirection:z.string().min(1).max(40).optional(),
  presentation:CanonicalPresentationSchema.optional(),
  photoMode:z.enum(["none","optional","required"]).optional(),
  templateEventToken:z.string().min(40).max(2048).optional(),
  creativeThesis:z.string().min(1).max(360).optional(),
  customerRationale:z.string().min(1).max(140).optional(),
  signatureMove:z.enum(["recipient_anchor","quiet_opening","isolated_closing_line","keepsake_memory","understated_celebration","editorial_contrast"]).optional(),
  accentMode:z.enum(["original","photo","navy","sage","rose"]).optional(),
  confidence:z.number().min(0).max(1).optional(),
  noveltyScore:z.number().min(0).max(1).optional(),
  wowScore:z.number().min(0).max(1).optional(),
  riskCodes:z.array(z.enum(["low_confidence","low_novelty","low_wow","market_tension","copy_risk","creative_range"])).max(6).optional(),
  kicker:z.string().min(1).max(100),
  headline:z.string().min(1).max(180),
  body:z.string().min(1).max(360)
});
export const GenerationResultSchema=z.object({
  directions:z.array(GeneratedDirectionSchema).length(3),
  exhaustionState:z.enum(["none","partial","total"]).optional(),
  generationSource:z.enum(["ai","recovery"]).optional()
});
export type GenerationBrief=z.infer<typeof GenerationBriefSchema>;
export type GeneratedDirection=z.infer<typeof GeneratedDirectionSchema>;
export type GenerationResult=z.infer<typeof GenerationResultSchema>;

export type GenerationSelectionContext=z.infer<typeof GenerationBriefSchema>["selectionContext"];

function normalizeBriefSignal(value:string){
  return value.trim().replace(/\s+/g," ").toLowerCase();
}

/** Preserve the customer's raw signals while giving ranking a stable normalized view. */
export function withNormalizedBriefContext(brief:GenerationBrief):GenerationBrief{
  return{
    ...brief,
    selectionContext:{
      rawOccasion:brief.occasion,
      rawFeeling:brief.feeling,
      normalizedOccasion:normalizeBriefSignal(brief.occasion),
      normalizedFeeling:normalizeBriefSignal(brief.feeling)
    }
  };
}


// CardeLume-specific copy-density guard shared by browser and final renderer.
// It deliberately lives with CardDocument rather than in generic platform code.
export type CardTypographyScript="latin"|"cjk"|"hangul";
export type CardCopyDensity="airy"|"balanced"|"compact";

export const CARD_BODY_MIN_CSS_PX=10.4 as const;
export const CARD_BODY_MIN_RENDER_PX=32 as const;

export interface RendererTypographyContract {
  bodyCssPx: number;
  bodyRenderPx: number;
  floorSource: "card-schema";
}

export function enforceReadableBodyFloor(bodyCssPx?: number, bodyRenderPx?: number): RendererTypographyContract {
  const css = bodyCssPx !== undefined ? bodyCssPx : CARD_BODY_MIN_CSS_PX;
  const render = bodyRenderPx !== undefined ? bodyRenderPx : CARD_BODY_MIN_RENDER_PX;
  if (css < CARD_BODY_MIN_CSS_PX || render < CARD_BODY_MIN_RENDER_PX) {
    throw new Error(`typography_below_readability_floor: css=${css}<${CARD_BODY_MIN_CSS_PX}, render=${render}<${CARD_BODY_MIN_RENDER_PX}`);
  }
  return {
    bodyCssPx: css,
    bodyRenderPx: render,
    floorSource: "card-schema"
  };
}

export function cardTypographyScript(locale:string):CardTypographyScript{
  const lc=locale.toLowerCase();
  if(lc.startsWith("ja")||lc.startsWith("zh"))return"cjk";
  if(lc.startsWith("ko"))return"hangul";
  return"latin";
}

export function cardGlyphWeight(ch:string,script:CardTypographyScript){
  if(/\s/.test(ch))return.32;
  if(/[\u3000-\u9fff\u3040-\u30ff]/.test(ch))return 1.72;
  if(/[\uac00-\ud7af]/.test(ch))return 1.58;
  if(/[MW@%&]/.test(ch))return 1.18;
  if(/[ilI1.,'’]/.test(ch))return.48;
  return script==="latin"?1:1.12;
}

export function cardVisualLength(value:string,locale="en"){
  const script=cardTypographyScript(locale);
  return Array.from(value.trim()).reduce((score,ch)=>score+cardGlyphWeight(ch,script),0);
}

export function cardFormatFactor(format:string){
  const f=format.toLowerCase();
  if(f.includes("square"))return.92;
  if(f.includes("landscape")||f.includes("postcard"))return 1.08;
  if(f.includes("folded"))return.98;
  return 1;
}

export type CardCopyMetrics={
  script:CardTypographyScript;
  density:CardCopyDensity;
  pressure:number;
  headlineVisual:number;
  bodyVisual:number;
  softBodyVisualLimit:number;
  hardBodyVisualLimit:number;
  suggestShortening:boolean;
  hardOverflow:boolean;
};

export function cardCopyMetrics(headline:string,body:string,locale="en",format="portrait-5x7"):CardCopyMetrics{
  const script=cardTypographyScript(locale);
  const ff=cardFormatFactor(format);
  const headlineVisual=cardVisualLength(headline,locale);
  const bodyVisual=cardVisualLength(body,locale);
  const headlineCapacity=(script==="latin"?42:31)*ff;
  const bodyCapacity=(script==="latin"?185:135)*ff;
  const pressure=Math.max(headlineVisual/headlineCapacity,bodyVisual/bodyCapacity);
  const density:CardCopyDensity=pressure>1.32?"compact":pressure>.82?"balanced":"airy";
  const softBodyVisualLimit=(script==="latin"?190:script==="hangul"?142:136)*ff;
  const hardBodyVisualLimit=(script==="latin"?330:script==="hangul"?235:220)*ff;
  return{
    script,density,pressure,headlineVisual,bodyVisual,softBodyVisualLimit,hardBodyVisualLimit,
    suggestShortening:bodyVisual>softBodyVisualLimit||pressure>1.18,
    hardOverflow:bodyVisual>hardBodyVisualLimit||headlineVisual>(script==="latin"?105:72)*ff
  };
}

function sentenceParts(value:string){
  return value.trim().split(/(?<=[.!?。！？])\s*/u).map(x=>x.trim()).filter(Boolean);
}

export function shortenCardBody(value:string,locale="en",targetVisual?:number){
  const clean=value.replace(/\s+/g," ").trim();
  if(!clean)return clean;
  const script=cardTypographyScript(locale);
  const target=targetVisual??(script==="latin"?145:script==="hangul"?105:98);
  if(cardVisualLength(clean,locale)<=target)return clean;
  const sentences=sentenceParts(clean);
  let out="";
  for(const sentence of sentences){
    const candidate=out?`${out} ${sentence}`:sentence;
    if(out&&cardVisualLength(candidate,locale)>target)break;
    out=candidate;
    if(cardVisualLength(out,locale)>=target*.72)break;
  }
  if(out&&cardVisualLength(out,locale)<=target)return out;
  const chars=Array.from(clean);let clipped="";
  for(const ch of chars){
    if(clipped&&cardVisualLength(clipped+ch,locale)>target)break;
    clipped+=ch;
  }
  clipped=clipped.trim().replace(/[,:;\-–—]+$/u,"");
  if(!clipped)return clean;
  if(/[.!?。！？]$/u.test(clipped))return clipped;
  return clipped+(script==="cjk"?"…":"…");
}

export * from "./photo-contrast.ts";

import "server-only";
import {
  CardDocumentSchema,
  CheckoutCardSnapshotSchema,
  cardCopyMetrics,
  type CardDocument,
  type CheckoutCardSnapshot
} from "@cardelume/card-schema";

const TEMPLATE_BY_DIRECTION:Record<CheckoutCardSnapshot["direction"],string>={
  editorial:"luxury-editorial",
  midnight:"midnight-lume",
  photo:"photo-story",
  quiet:"classic-letterpress"
};

const DEFAULT_PALETTE_BY_DIRECTION:Record<CheckoutCardSnapshot["direction"],string>={
  editorial:"editorial-ivory",
  midnight:"midnight-navy",
  photo:"editorial-ivory",
  quiet:"editorial-ivory"
};

const ACCENT_PALETTE:Partial<Record<CheckoutCardSnapshot["accentMode"],string>>={
  navy:"midnight-navy",
  sage:"soft-sage",
  rose:"soft-rose"
};

export function buildCheckoutCardDocument(input:{
  versionId:string;
  snapshot:unknown;
  managedTemplate?:{rendererTemplateKey:string;version:number;templateVersionId:string;photoMode:"none"|"optional"|"required"};
}):CardDocument{
  const snapshot=CheckoutCardSnapshotSchema.parse(input.snapshot);
  if(snapshot.accentMode==="photo"&&!snapshot.photoAssetId)throw new Error("photo_accent_requires_asset");
  if(snapshot.photoAssetId&&!snapshot.photoPalette)throw new Error("photo_palette_required");
  const copy=cardCopyMetrics(snapshot.headline,snapshot.body,snapshot.locale,snapshot.format);
  if(copy.hardOverflow)throw new Error("typography_copy_too_dense");

  if(input.managedTemplate?.photoMode==="required"&&!snapshot.photoAssetId)throw new Error("template_photo_required");
  if(input.managedTemplate?.photoMode==="none"&&snapshot.photoAssetId)throw new Error("template_photo_not_supported");
  const paletteId=ACCENT_PALETTE[snapshot.accentMode]
    ?? DEFAULT_PALETTE_BY_DIRECTION[snapshot.direction];
  const rendererTemplateKey=input.managedTemplate?.rendererTemplateKey??TEMPLATE_BY_DIRECTION[snapshot.direction];

  return CardDocumentSchema.parse({
    schemaVersion:1,
    templateVersion:input.managedTemplate?`managed-${input.managedTemplate.templateVersionId}-v${input.managedTemplate.version}`:"0.4.0",
    rendererVersion:"0.4.3-step.5",
    marketPackVersion:"2026.08",
    id:input.versionId,
    locale:snapshot.locale,
    format:snapshot.format,
    templateId:rendererTemplateKey,
    paletteId,
    typographyId:"editorial-serif",
    artworkAssetIds:snapshot.photoAssetId?[snapshot.photoAssetId]:[],
    photoPalette:snapshot.photoAssetId?snapshot.photoPalette:undefined,
    photoTreatment:rendererTemplateKey==="photo-story"?"editorial":undefined,
    textBlocks:[
      {id:"kicker",role:"kicker",align:"center",text:snapshot.kicker},
      {id:"headline",role:"headline",align:"center",text:snapshot.headline},
      {id:"body",role:"body",align:"center",text:snapshot.body}
    ],
    metadata:{
      occasion:snapshot.occasion,
      relationship:snapshot.relationship,
      feeling:snapshot.feeling
    }
  });
}

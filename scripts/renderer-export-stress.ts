import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import sharp from "sharp";
import type { CardDocument } from "@cardelume/card-schema";
import {
  CURRENT_RENDERER_VERSION,
  getCardFormatSpec,
  renderFinalSvg,
  renderProductionFinal
} from "@cardelume/renderer";

const formats:CardDocument["format"][]=[
  "portrait-5x7","folded-5x7","square-5x5","landscape-7x5","postcard-6x4"
];

function doc(format:CardDocument["format"],locale="en"):CardDocument{
  return{
    schemaVersion:1,
    templateVersion:"0.4.0",
    rendererVersion:CURRENT_RENDERER_VERSION,
    marketPackVersion:"2026.08",
    id:crypto.randomUUID(),
    locale,
    format,
    templateId:"luxury-editorial",
    paletteId:"editorial-ivory",
    typographyId:"editorial-serif",
    artworkAssetIds:[],
    textBlocks:[
      {id:"kicker",role:"kicker",align:"center",text:"FOR YOU"},
      {id:"headline",role:"headline",align:"center",text:"A beautiful year awaits."},
      {id:"body",role:"body",align:"center",text:"May it bring you more of what makes you feel most like yourself."}
    ],
    metadata:{occasion:"Birthday",relationship:"Friend",feeling:"Elegant"}
  };
}

async function deterministicRaster(_svg:string,input:{width:number;height:number}){
  return new Uint8Array(await sharp({
    create:{width:input.width,height:input.height,channels:4,background:{r:246,g:241,b:230,alpha:1}}
  }).png({compressionLevel:9}).toBuffer());
}

function hash(bytes:Uint8Array){return createHash("sha256").update(bytes).digest("hex");}
function pdfText(pdf:Uint8Array){return Buffer.from(pdf).toString("latin1");}

for(const format of formats){
  const input=doc(format,format==="square-5x5"?"ja":"en");
  const a=await renderProductionFinal(input,{rasterize:deterministicRaster});
  const b=await renderProductionFinal(input,{rasterize:deterministicRaster});
  const spec=getCardFormatSpec(format);
  const meta=await sharp(a.jpg).metadata();
  assert.equal(meta.width,spec.front.widthPx,`${format} jpg width`);
  assert.equal(meta.height,spec.front.heightPx,`${format} jpg height`);
  assert.equal(meta.density,300,`${format} jpg dpi`);
  assert.equal(a.metadata.pdf.pageCount,spec.pdf.pageCount,`${format} pdf page count metadata`);
  assert.equal(hash(a.jpg),hash(b.jpg),`${format} jpg deterministic`);
  assert.equal(hash(a.pdf),hash(b.pdf),`${format} pdf deterministic`);
  const text=pdfText(a.pdf);
  const pointsW=spec.pdf.widthIn*72,pointsH=spec.pdf.heightIn*72;
  assert.ok(text.includes(`/MediaBox [0 0 ${pointsW} ${pointsH}]`),`${format} MediaBox`);
  assert.ok(text.startsWith("%PDF-1.4"),`${format} PDF signature`);
}

const hostile=doc("portrait-5x7");
hostile.textBlocks[1]!.text='<script>alert("x")</script> & hello';
const svg=renderFinalSvg(hostile);
assert.ok(!svg.includes("<script>"),"raw script must not enter SVG");
assert.ok(svg.includes("&lt;script&gt;"),"hostile text must be XML escaped");
assert.ok(!/https?:\/\//i.test(svg),"renderer-owned SVG must not contain external URLs");

const photoDoc:CardDocument={
  ...doc("portrait-5x7"),
  templateId:"photo-story",
  artworkAssetIds:["photo-primary"],
  photoTreatment:"editorial"
};
await assert.rejects(()=>renderProductionFinal(photoDoc,{rasterize:deterministicRaster}),/trusted_photo_asset_required/);
const trustedPhoto=new Uint8Array(await sharp({create:{width:800,height:600,channels:3,background:{r:138,g:151,b:128}}}).jpeg({quality:90}).toBuffer());
await renderProductionFinal(photoDoc,{
  assets:{"photo-primary":{bytes:trustedPhoto,contentType:"image/jpeg"}},
  rasterize:deterministicRaster
});

console.log(JSON.stringify({ok:true,formats:formats.length,renderer:CURRENT_RENDERER_VERSION}));

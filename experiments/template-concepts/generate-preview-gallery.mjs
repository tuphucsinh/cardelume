import fs from "node:fs";
import path from "node:path";
import { experimentalTemplateIds, experimentalTemplateSvg } from "./experimental-template-art.mjs";

const here = path.dirname(new URL(import.meta.url).pathname);
const outputDir = path.join(here, "previews");
fs.mkdirSync(outputDir, { recursive: true });
const briefs = [
  { headline:"Always, you", body:"Still my favorite part of every day.", recipient:"Mai", date:"28 · 08 · 2026" },
  { headline:"Cảm ơn vì luôn ở đây", body:"Một lời nhỏ cho một điều rất lớn.", recipient:"Linh", date:"28 · 08 · 2026" },
  { headline:"Another bright year", body:"Here’s to everything that feels like you.", recipient:"Alex", date:"28 · 08 · 2026" },
  { headline:"For the quiet things", body:"The moments I remember most are the simple ones.", recipient:"Noah", date:"28 · 08 · 2026" },
  { headline:"You, in this moment", body:"A memory worth keeping close.", recipient:"Hana", date:"28 · 08 · 2026" },
  { headline:"This deserves a celebration", body:"Proud of you—beautifully and completely.", recipient:"Minh", date:"28 · 08 · 2026" },
  { headline:"With appreciation", body:"For what you did, and how you did it.", recipient:"An", date:"28 · 08 · 2026" },
  { headline:"A quiet kind of joy", body:"Some moments deserve more room to breathe.", recipient:"Eva", date:"28 · 08 · 2026" },
  { headline:"You made this matter", body:"A small mark for something I will remember.", recipient:"Min", date:"28 · 08 · 2026" },
  { headline:"Bloom into your year", body:"May the next chapter open gently and brightly.", recipient:"Aya", date:"28 · 08 · 2026" },
  { headline:"Still our favorite night", body:"The coordinates change. The feeling does not.", recipient:"June", date:"28 · 08 · 2026" },
  { headline:"Made for this moment", body:"A little structure for a very big feeling.", recipient:"Kai", date:"28 · 08 · 2026" },
];
const palette=[
  ["#f6f0e6","#17212f","#a17d51"],
  ["#f3efe8","#25211d","#92725a"],
  ["#eef0ec","#1e2934","#8d7552"],
  ["#f4eee9","#2a2020","#9d7167"],
  ["#eeeae3","#19232c","#90745c"],
  ["#f1ede4","#262019","#9a7652"],
  ["#f5f2ec","#1d2527","#8a6b4a"],
  ["#f2eee8","#1d2527","#9b7a60"],
  ["#f4eee8","#25201e","#9e766a"],
  ["#f1efe9","#1e2928","#78917c"],
  ["#111a2b","#f5f0e6","#c5a465"],
  ["#f4f0e9","#25211d","#a88465"],
];
const cards=[];
for (let i=0;i<experimentalTemplateIds.length;i++) {
  const id=experimentalTemplateIds[i], b=briefs[i], [background,foreground,accent]=palette[i];
  const svg=experimentalTemplateSvg({templateId:id,...b,background,foreground,accent,width:700,height:980});
  fs.writeFileSync(path.join(outputDir,`${id}.svg`),svg);
  cards.push(`<figure><div class="card">${svg}</div><figcaption><strong>${id}</strong><span>EXPERIMENT ONLY · original procedural POC</span></figcaption></figure>`);
}
const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>CardeLume Step 17D — Original template experiments</title><style>body{margin:0;padding:32px;background:#e9e7e1;color:#20242a;font:14px/1.5 Arial,sans-serif}header{max-width:1100px;margin:0 auto 28px}h1{font:500 34px/1.1 Georgia,serif;margin:0 0 8px}p{max-width:850px;color:#5c6268}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:28px;max-width:1500px;margin:auto}figure{margin:0}.card{background:#fff;box-shadow:0 18px 50px #0002;border-radius:3px;overflow:hidden}.card svg{display:block;width:100%;height:auto}figcaption{display:flex;justify-content:space-between;gap:10px;padding:10px 2px;color:#555;font-size:12px}figcaption span{color:#777;text-align:right}</style></head><body><header><h1>CardeLume Step 17D — original template experiments</h1><p>Renderer-safe procedural proof-of-concepts. These are not production templates and are not reconstructed from market references. Typography uses preview system fonts only; final font selection requires the Golden benchmark, glyph QA and provenance gates.</p></header><main class="grid">${cards.join("\n")}</main></body></html>`;
fs.writeFileSync(path.join(here,"STEP17D_TEMPLATE_EXPERIMENT_GALLERY.html"),html);
console.log(`PASS: generated ${experimentalTemplateIds.length} experiment SVG previews + gallery`);

import fs from "node:fs";
import { cardContrastRatio, cardMinContrast, cardPhotoContrastPalette } from "../packages/card-schema/src/photo-contrast.ts";

function must(value:boolean,message:string){if(!value)throw new Error(message);}
const samples=[
  {name:"near-white",primary:"#f7f3ed",secondary:"#fffaf4",accent:"#e8cfa4"},
  {name:"near-black",primary:"#15171a",secondary:"#24272b",accent:"#5d4a39"},
  {name:"mid-gray",primary:"#858585",secondary:"#a0a0a0",accent:"#96906f"},
  {name:"bright-yellow",primary:"#f2d84b",secondary:"#fff0a6",accent:"#f5c400"},
  {name:"saturated-red",primary:"#e44b55",secondary:"#f1b0b2",accent:"#e91e36"},
  {name:"cool-blue",primary:"#4f87c5",secondary:"#b8d6ea",accent:"#6ea6d7"},
  {name:"sage",primary:"#6f8b73",secondary:"#d7dfd2",accent:"#9d8a63"},
  {name:"violet",primary:"#765aa6",secondary:"#d8cbea",accent:"#af7bd0"}
] as const;
for(const sample of samples){
  const p=cardPhotoContrastPalette(sample);
  const light=[p.background,p.backgroundAlt];
  const dark=[p.darkBackground,p.darkBackgroundAlt,"#111820"];
  must(cardMinContrast(p.foreground,light)>=4.5,`${sample.name}: light foreground contrast`);
  must(cardMinContrast(p.accent,light)>=4.5,`${sample.name}: light accent contrast`);
  must(cardMinContrast(p.darkForeground,dark)>=4.5,`${sample.name}: dark foreground contrast`);
  must(cardMinContrast(p.darkAccent,dark)>=4.5,`${sample.name}: dark accent contrast`);
}

must(Math.abs(cardContrastRatio("#000000","#ffffff")-21)<.001,"black/white WCAG ratio must be 21:1");
must(cardContrastRatio("#777777","#ffffff")<4.5,"known sub-4.5 sample should remain sub-4.5");

// Deterministic randomized sweep catches edge combinations beyond curated adversarial samples.
let seed=0x5eed1234;
function nextByte(){seed=(1664525*seed+1013904223)>>>0;return seed>>>24;}
function nextHex(){return`#${[nextByte(),nextByte(),nextByte()].map(v=>v.toString(16).padStart(2,"0")).join("")}`;}
const randomCases=5000;
for(let i=0;i<randomCases;i++){
  const p=cardPhotoContrastPalette({primary:nextHex(),secondary:nextHex(),accent:nextHex()});
  const light=[p.background,p.backgroundAlt];
  const dark=[p.darkBackground,p.darkBackgroundAlt,"#111820"];
  must(cardMinContrast(p.foreground,light)>=4.5,`random ${i}: light foreground contrast`);
  must(cardMinContrast(p.accent,light)>=4.5,`random ${i}: light accent contrast`);
  must(cardMinContrast(p.darkForeground,dark)>=4.5,`random ${i}: dark foreground contrast`);
  must(cardMinContrast(p.darkAccent,dark)>=4.5,`random ${i}: dark accent contrast`);
}

const visual=fs.readFileSync("apps/web/components/card-visual.tsx","utf8");
const css=fs.readFileSync("apps/web/app/globals.css","utf8");
const renderer=fs.readFileSync("packages/renderer/src/index.ts","utf8");
must(visual.includes("cardPhotoContrastPalette(photoPalette)"),"browser is not using shared contrast palette");
must(css.includes("color:var(--photo-fg)"),"browser photo foreground variable missing");
must(css.includes("var(--photo-dark-accent-safe)"),"dark photo accent guard missing");
must(renderer.includes("cardPhotoContrastPalette(doc.photoPalette)"),"renderer is not using shared contrast palette");
must(renderer.includes('doc.templateId==="midnight-lume"||doc.templateId==="celestial-night"'),"renderer dark photo directions are not guarded");
must(renderer.includes('doc.templateId==="art-deco-noir"||doc.templateId==="quiet-noir"'),"renderer noir photo directions are not guarded");
must(renderer.includes('CURRENT_RENDERER_VERSION="0.4.3-step.5"'),"renderer version not bumped for output change");
console.log(`photo palette WCAG contrast contract: PASS (${samples.length} adversarial + ${randomCases} deterministic random palettes)`);

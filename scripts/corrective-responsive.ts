import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getCardFormatSpec } from "../packages/renderer/src/formats.ts";
import { magicTypography } from "../apps/web/components/magic-typography.ts";

const studio=readFileSync("apps/web/components/card-studio.tsx","utf8");
const visual=readFileSync("apps/web/components/card-visual.tsx","utf8");
const css=readFileSync("apps/web/app/globals.css","utf8");
const ratio=(format:Parameters<typeof getCardFormatSpec>[0])=>{
  const spec=getCardFormatSpec(format);return spec.front.widthIn/spec.front.heightIn;
};
const near=(actual:number,expected:number)=>Math.abs(actual-expected)<0.0001;

assert(near(ratio("portrait-5x7"),5/7));
assert(near(ratio("folded-5x7"),5/7));
assert(near(ratio("square-5x5"),1));
assert(near(ratio("landscape-7x5"),7/5));
assert(near(ratio("postcard-6x4"),3/2));
assert(studio.includes('if(value.startsWith("Postcard"))return"format-postcard"'));
assert(studio.includes('if(value.startsWith("Landscape"))return"format-landscape"'));
assert(visual.includes('data-format={format}'));
assert(css.includes(".paper-card.format-postcard{aspect-ratio:6/4}"));
assert(css.includes("overflow-wrap:anywhere"));
assert(css.includes(".studio-submit{width:100%}"));
assert(css.includes("print-layout-picker{min-width:0;overflow-x:auto"));

for(const locale of ["en","vi"] as const){
  const fit=magicTypography("Nguyễn Thị Minh Khang — một cái tên rất dài để kiểm tra khả năng xuống dòng", "Một lời nhắn tiếng Việt dài và giàu cảm xúc cần vẫn giữ được nhịp điệu, khoảng thở và khả năng đọc trên thẻ nhỏ.",{locale,format:"Postcard · 6 × 4 in"});
  assert(fit.headlinePx>0&&fit.bodyPx>0,`${locale}_long_copy_fit`);
}

console.log("FORMAT_RATIO_CONTRACT=PASS");
console.log("LONG_COPY_GUARD=PASS");
console.log("RESPONSIVE_CSS_GUARD=PASS");
console.log("CORRECTIVE_RESPONSIVE=PASS");
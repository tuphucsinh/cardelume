import assert from "node:assert/strict";
import {
  CARD_BODY_MIN_CSS_PX,
  CARD_BODY_MIN_RENDER_PX,
  cardCopyMetrics,
  cardVisualLength,
  shortenCardBody,
  type CardDocument
} from "@cardelume/card-schema";
import { magicTypography } from "../apps/web/components/magic-typography";
import { CURRENT_RENDERER_VERSION, fitTypography, renderFinalSvg } from "@cardelume/renderer";

const cases=[
  {locale:"en",format:"Portrait · 5 × 7 in",headline:"A beautiful year awaits.",body:"I hope this year brings you calm mornings, brave beginnings, generous laughter, and many small moments that feel unmistakably like you."},
  {locale:"vi",format:"Portrait · 5 × 7 in",headline:"Một năm thật đẹp đang chờ phía trước.",body:"Mong năm mới có thêm thật nhiều khoảnh khắc bình yên, những khởi đầu đầy can đảm và những niềm vui nhỏ khiến bạn luôn được là chính mình."},
  {locale:"ja",format:"Square · 5 × 5 in",headline:"美しい一年が待っています。",body:"穏やかな朝も、新しい一歩も、あなたらしく笑える小さな瞬間も、たくさん訪れる一年になりますように。"},
  {locale:"ko",format:"Landscape · 7 × 5 in",headline:"아름다운 한 해가 기다리고 있어요.",body:"평온한 아침과 용기 있는 시작, 그리고 가장 당신답게 웃을 수 있는 작은 순간들이 가득한 한 해가 되길 바라요."},
  {locale:"zh",format:"Portrait · 5 × 7 in",headline:"美好的一年正在前方。",body:"愿新的一年有安静的清晨、勇敢的新开始，也有许多让你自在做自己的小小幸福。"}
] as const;

for(const c of cases){
  const fit=magicTypography(c.headline,c.body,{locale:c.locale as never,format:c.format});
  assert.ok(fit.bodyPx>=CARD_BODY_MIN_CSS_PX,`${c.locale} browser body floor`);
  const rendererFit=fitTypography(c.headline,c.body,c.locale,c.format.includes("Square")?"square-5x5":c.format.includes("Landscape")?"landscape-7x5":"portrait-5x7");
  assert.ok(rendererFit.bodyPx>=CARD_BODY_MIN_RENDER_PX,`${c.locale} renderer body floor`);
}

const dense="This message is intentionally long because the typography guard must protect the composition instead of shrinking the type forever. It should notice visual density before the renderer is forced into tiny text, and offer a graceful shortening action that keeps the emotional meaning without turning the Finish screen into an error state.";
const metrics=cardCopyMetrics("A few words, held close.",dense,"en","portrait-5x7");
assert.equal(metrics.suggestShortening,true);
const shortened=shortenCardBody(dense,"en",metrics.softBodyVisualLimit*.76);
assert.ok(cardVisualLength(shortened,"en")<cardVisualLength(dense,"en"));
assert.ok(cardVisualLength(shortened,"en")<=metrics.softBodyVisualLimit*.80);

const extreme="word ".repeat(120);
assert.equal(cardCopyMetrics("A beautiful year awaits.",extreme,"en","portrait-5x7").hardOverflow,true);

const doc:CardDocument={
  schemaVersion:1,templateVersion:"0.4.0",rendererVersion:CURRENT_RENDERER_VERSION,marketPackVersion:"2026.08",
  id:crypto.randomUUID(),locale:"en",format:"portrait-5x7",templateId:"luxury-editorial",paletteId:"editorial-ivory",typographyId:"editorial-serif",artworkAssetIds:[],
  textBlocks:[
    {id:"kicker",role:"kicker",align:"center",text:"FOR YOU"},
    {id:"headline",role:"headline",align:"center",text:"A beautiful year awaits."},
    {id:"body",role:"body",align:"center",text:extreme}
  ],metadata:{occasion:"Birthday",relationship:"Friend",feeling:"Elegant"}
};
assert.throws(()=>renderFinalSvg(doc),/typography_copy_too_dense/);
console.log(JSON.stringify({ok:true,cases:cases.length,browserFloor:CARD_BODY_MIN_CSS_PX,rendererFloor:CARD_BODY_MIN_RENDER_PX}));

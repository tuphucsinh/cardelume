import { magicTypography, type MagicType } from "../apps/web/components/magic-typography.ts";
import type { LocaleCode } from "../apps/web/i18n/messages.ts";

const cases:Array<{locale:LocaleCode;headline:string;body:string;format:string}>= [
  {locale:"en",headline:"A beautiful year awaits.",body:"May it bring you more of what makes you feel most like yourself.",format:"Portrait · 5 × 7 in"},
  {locale:"de",headline:"Ein wunderschönes neues Lebensjahr wartet auf dich.",body:"Möge dieses Jahr dir noch mehr von dem bringen, was dich ganz du selbst sein lässt.",format:"Portrait · 5 × 7 in"},
  {locale:"fr",headline:"Une merveilleuse année pleine de lumière vous attend.",body:"Qu’elle vous apporte encore plus de ce qui vous fait vous sentir pleinement vous-même.",format:"Portrait · 5 × 7 in"},
  {locale:"es",headline:"Te espera un año precioso lleno de momentos que importan.",body:"Que este año te traiga más de todo lo que te hace sentir tú.",format:"Square · 5 × 5 in"},
  {locale:"vi",headline:"Một năm thật đẹp với những khoảnh khắc đáng nhớ đang chờ bạn.",body:"Mong năm mới mang đến nhiều hơn những điều khiến bạn cảm thấy thật là chính mình.",format:"Portrait · 5 × 7 in"},
  {locale:"ja",headline:"素敵な一年になりますように",body:"あなたらしくいられる瞬間が、もっと増える一年になりますように。",format:"Portrait · 5 × 7 in"},
  {locale:"ko",headline:"아름다운 한 해가 기다리고 있어요",body:"가장 나다운 순간이 더 많아지는 한 해가 되길 바랍니다.",format:"Portrait · 5 × 7 in"},
  {locale:"zh",headline:"美好的一年正在等你",body:"愿新的一年里，有更多让你真正成为自己的时刻。",format:"Landscape · 7 × 5 in"}
];

function validate(fit:MagicType){
  if(fit.headlinePx<28) throw new Error(`headline too small: ${fit.headlinePx}`);
  if(fit.bodyPx<8.5) throw new Error(`body too small: ${fit.bodyPx}`);
  if(fit.headlineMaxWidthPct>94||fit.bodyMaxWidthPct>95) throw new Error("width guard failed");
  if(fit.headlineLineHeight<.9||fit.bodyLineHeight<1.35) throw new Error("leading guard failed");
}

for(const c of cases){
  const fit=magicTypography(c.headline,c.body,{locale:c.locale,format:c.format});
  validate(fit);
  console.log(JSON.stringify({locale:c.locale,format:c.format,density:fit.density,script:fit.script,headlinePx:fit.headlinePx,bodyPx:fit.bodyPx}));
}

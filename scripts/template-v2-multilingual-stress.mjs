#!/usr/bin/env node
import { templateLayoutProfile } from '../packages/renderer/src/template-layout.ts';
import { portfolioV2ExperimentTemplates } from '../packages/templates/src/index.ts';

const dims={
 'portrait-5x7':[1500,2100],'folded-5x7':[1500,2100],'square-5x5':[1500,1500],
 'landscape-7x5':[2100,1500],'postcard-6x4':[1800,1200]
};
const samples={
 en:{short:['For Maya','Still us.','Always.'],medium:['For Maya, with love','Another year, still my favorite person','Thank you for making ordinary days feel special.'],long:['For Maya, with all my love','Another year together, and I would still choose every quiet morning, every wild plan, and every ordinary evening with you.','Thank you for the kindness, patience and light you bring to the people around you.']},
 vi:{short:['Gửi Mai','Vẫn là mình.','Thương mãi.'],medium:['Gửi Mai, với tất cả yêu thương','Thêm một năm, vẫn là người mình thương nhất','Cảm ơn vì đã làm những ngày bình thường trở nên đặc biệt.'],long:['Gửi Mai, với tất cả yêu thương','Thêm một năm bên nhau, mình vẫn chọn mọi buổi sáng yên bình, mọi kế hoạch bất ngờ và mọi tối giản dị cùng bạn.','Cảm ơn vì sự tử tế, kiên nhẫn và ấm áp mà bạn mang đến cho những người quanh mình.']},
 ja:{short:['美咲へ','これからも。','ありがとう。'],medium:['美咲へ、心から','今年もいちばん大切な人へ','何気ない毎日を特別にしてくれてありがとう。'],long:['美咲へ、心からの想いを込めて','また一年を一緒に過ごせたことがうれしい。静かな朝も、思いがけない計画も、何気ない夜も、これからもあなたと。','いつも周りの人に優しさと温かさを届けてくれて、本当にありがとう。']},
 ko:{short:['민지에게','우리답게.','고마워.'],medium:['민지에게, 마음을 담아','올해도 가장 소중한 사람에게','평범한 날들을 특별하게 만들어줘서 고마워.'],long:['민지에게, 진심을 가득 담아','또 한 해를 함께해서 기뻐. 조용한 아침도, 뜻밖의 계획도, 평범한 저녁도 앞으로 계속 너와 함께하고 싶어.','늘 주변 사람들에게 친절함과 따뜻함을 나누어줘서 정말 고마워.']},
 'zh-CN':{short:['给小雅','一直是我们。','谢谢你。'],medium:['给小雅，满满的爱','又一年，你依然是我最珍惜的人','谢谢你让平凡的日子也变得特别。'],long:['给小雅，带着全部的爱','又一起走过一年，我依然愿意选择每个安静的清晨、每个突然的计划和每个平凡的夜晚，继续和你一起。','谢谢你的善意、耐心与温暖，也谢谢你把这些美好带给身边的人。']}
};
function units(text,locale){let n=0;for(const ch of text){const cp=ch.codePointAt(0);if(cp>0x2e7f)n+=1.0;else if(/\s/.test(ch))n+=.32;else if(/[A-ZMW@#]/.test(ch))n+=.72;else n+=.56;}return n*(locale==='vi'?1.03:1);}
function capacity(widthPx,fontPx,locale){return widthPx/(fontPx*.58*(locale==='vi'?1.03:1));}
let checks=0,cases=0;const failures=[];
for(const t of portfolioV2ExperimentTemplates){
 const l=templateLayoutProfile(t.rendererTemplateKey);
 for(const [format,[w,h]] of Object.entries(dims)) for(const [locale,sets] of Object.entries(samples)) for(const [pressure,copy] of Object.entries(sets)){
   cases++;
   const left=l.anchor==='start'?l.xPct*w-(.01*w):l.anchor==='middle'?(l.xPct-l.headlineWidthPct/200)*w:(l.xPct-l.headlineWidthPct/100)*w;
   const right=l.anchor==='start'?(l.xPct+l.headlineWidthPct/100)*w:l.anchor==='middle'?(l.xPct+l.headlineWidthPct/200)*w:l.xPct*w;
   if(left<.035*w||right>.965*w) failures.push(`${t.rendererTemplateKey}/${format}/${locale}/${pressure}:headline_horizontal`);
   if(!(l.kickerYPct<l.headlineYPct&&l.headlineYPct<l.bodyYPct&&l.bodyYPct<=l.signatureYPct)) failures.push(`${t.rendererTemplateKey}/${format}/${locale}/${pressure}:vertical_order`);
   if(l.photoWindow){const p=l.photoWindow;if(p.xPct<.04||p.yPct<.04||p.xPct+p.widthPct>.96||p.yPct+p.heightPct>.68)failures.push(`${t.rendererTemplateKey}/${format}/${locale}/${pressure}:photo_window`);}
   // Conservative source-level pressure proxy: long copy must have enough theoretical wrap capacity.
   const hf=72*l.headlineScale*(h/2100)**.25, bf=32*l.bodyScale*(h/2100)**.25;
   const hcap=capacity(l.headlineWidthPct/100*w,hf,locale)*3.4;
   const bcap=capacity(l.bodyWidthPct/100*w,bf,locale)*(t.bodyCapacity==='long'?7.2:t.bodyCapacity==='short'?4.1:5.5);
   if(units(copy[1],locale)>hcap*1.28) failures.push(`${t.rendererTemplateKey}/${format}/${locale}/${pressure}:headline_pressure`);
   if(units(copy[2],locale)>bcap*1.35) failures.push(`${t.rendererTemplateKey}/${format}/${locale}/${pressure}:body_pressure`);
   checks+=5;
 }
}
if(failures.length){console.error(JSON.stringify({status:'FAIL',cases,checks,failures:failures.slice(0,80),failureCount:failures.length},null,2));process.exit(1)}
console.log(JSON.stringify({status:'PASS',scope:'source-level multilingual layout approximation; full font/render parity remains Step18 runtime evidence',templates:12,locales:5,formats:5,pressures:3,cases,checks},null,2));

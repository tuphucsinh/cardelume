import fs from 'node:fs';
import path from 'node:path';
import { rendererTemplateIds, templateArtSvg } from '../packages/renderer/src/template-art.ts';

const names = {
  'luxury-editorial':'Luxury Editorial','midnight-lume':'Midnight Lume','botanical-poise':'Botanical Poise',
  'washi-elegance':'Washi Elegance','soft-seoul':'Soft Seoul','art-deco-noir':'Art Deco Noir',
  'photo-story':'Photo Story','quiet-minimal':'Quiet Minimal','watercolor-bloom':'Watercolor Bloom',
  'golden-hour':'Golden Hour','quiet-noir':'Quiet Noir','bold-pop':'Bold Pop','kawaii-joy':'Kawaii Joy',
  'classic-letterpress':'Classic Letterpress','celestial-night':'Celestial Night','little-wonders':'Little Wonders'
};
const palettes = {
  'midnight-lume':['#0d1830','#f5eee2','#d3aa65'],'art-deco-noir':['#141516','#f3eee2','#d0aa68'],
  'quiet-noir':['#181a1c','#f1eee7','#bca679'],'celestial-night':['#0d1830','#f5eee2','#ccb06f'],
  'bold-pop':['#f6efe3','#1d2b3c','#e7b649'],'golden-hour':['#f0dfca','#45382e','#d18c54'],
  'kawaii-joy':['#f6eee8','#4d4543','#d39a9a'],'soft-seoul':['#f3ece8','#4a4541','#c49388']
};
const out = path.resolve('quality/template-audit/previews');
fs.mkdirSync(out,{recursive:true});
for (const id of rendererTemplateIds) {
  const [bg,fg,accent]=palettes[id]||['#f6f1e8','#292722','#b58a5f'];
  const w=700,h=980,s=1;
  const art=templateArtSvg({templateId:id,width:w,height:h,scale:s,accent,foreground:fg,background:bg});
  const photo=id==='photo-story'?`<rect x="95" y="105" width="510" height="390" rx="8" fill="#d9d1c5"/><circle cx="355" cy="300" r="76" fill="#b4a99b" opacity=".7"/>`:'';
  const title = ['bold-pop','kawaii-joy'].includes(id)?'Celebrate!':'For you, always';
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="100%" height="100%" fill="${bg}"/>
  ${art}${photo}
  <text x="${w/2}" y="${id==='photo-story'?610:480}" text-anchor="middle" fill="${fg}" font-family="Georgia, serif" font-size="58" font-weight="500">${title}</text>
  <text x="${w/2}" y="${id==='photo-story'?670:540}" text-anchor="middle" fill="${fg}" opacity=".72" font-family="Arial, sans-serif" font-size="21" letter-spacing="2">A MOMENT MADE PERSONAL</text>
  <line x1="250" y1="${id==='photo-story'?715:585}" x2="450" y2="${id==='photo-story'?715:585}" stroke="${accent}" stroke-width="2" opacity=".45"/>
  <text x="${w/2}" y="900" text-anchor="middle" fill="${fg}" opacity=".55" font-family="Arial, sans-serif" font-size="18">${names[id]}</text>
</svg>`;
  fs.writeFileSync(path.join(out,`${id}.svg`),svg);
}
console.log(`generated ${rendererTemplateIds.length} audit SVG previews`);

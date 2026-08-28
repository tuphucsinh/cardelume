#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import process from 'node:process';import {spawnSync} from 'node:child_process';
import {portfolioV2ExperimentTemplates} from '../packages/templates/src/index.ts';
import {templateArtSvg} from '../packages/renderer/src/template-art.ts';
import {templateLayoutProfile} from '../packages/renderer/src/template-layout.ts';
const root=path.resolve(import.meta.dirname,'..'), out=path.join(root,'quality/template-audit/v2-production-layout');fs.mkdirSync(out,{recursive:true});
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const samples={
 'whispered-type':['FOR ELISE','Still, always','For every quiet morning and every plan still ahead.'],
 'museum-note':['ANNIVERSARY · 28 AUG','Our small masterpiece','Another year of ordinary moments made remarkable together.'],
 'monogram-orbit':['FOR MAYA','A bright new orbit','Here’s to another year that feels entirely your own.'],
 'ribbon-line':['THANK YOU','You made it lighter','For the care you gave so naturally when it mattered most.'],
 'memory-window':['OUR DAY · 2026','Keep this one','Some moments deserve a little more room in the memory.'],
 'type-celebration':['TODAY IS YOURS','MAKE IT COUNT','A whole new year of good trouble, brave ideas and reasons to celebrate.'],
 'quiet-seal':['WITH GRATITUDE','For everything','Your kindness has a way of staying with people.'],
 'pressed-shadow':['CONGRATULATIONS','Well earned','For the patience, craft and courage behind this moment.'],
 'ink-pause':['FOR YOU','No grand speech','Just a quiet thank you for being exactly who you are.'],
 'petal-geometry':['HAPPY BIRTHDAY','Bloom your way','A year for curiosity, warmth and the things that feel most like you.'],
 'night-ledger':['28 · 08 · 2026','Still choosing you','One more year on the ledger. One more reason I would choose us again.'],
 'soft-fold':['A SMALL NOTE','You did it','A new chapter, folded gently into everything you built to get here.']
};
const bgFor=id=>id==='night-ledger'?'#111827':'#f6f0e5', fgFor=id=>id==='night-ledger'?'#f5efe4':'#172038', accentFor=id=>id==='night-ledger'?'#d1b274':'#9b7350';
for(const t of portfolioV2ExperimentTemplates){const id=t.rendererTemplateKey,l=templateLayoutProfile(id),w=750,h=1050,bg=bgFor(id),fg=fgFor(id),a=accentFor(id),[k,head,body]=samples[id];const art=templateArtSvg({templateId:id,width:w,height:h,scale:.5,accent:a,foreground:fg,background:bg});const anchor=l.anchor;const x=l.xPct*w;const ta=anchor;const font=x=>Math.round(x);const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="${bg}"/>${art}${l.photoWindow?`<rect x="${l.photoWindow.xPct*w}" y="${l.photoWindow.yPct*h}" width="${l.photoWindow.widthPct*w}" height="${l.photoWindow.heightPct*h}" rx="10" fill="${id==='night-ledger'?'#263247':'#ddd5c8'}" opacity=".72"/><text x="${(l.photoWindow.xPct+l.photoWindow.widthPct/2)*w}" y="${(l.photoWindow.yPct+l.photoWindow.heightPct/2)*h}" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="${fg}" opacity=".5">PHOTO WINDOW</text>`:''}<text x="${x}" y="${l.kickerYPct*h}" text-anchor="${ta}" font-family="Arial,sans-serif" font-size="${font(15)}" letter-spacing="3" fill="${fg}" opacity=".62">${esc(k)}</text><text x="${x}" y="${l.headlineYPct*h}" text-anchor="${ta}" font-family="Georgia,serif" font-size="${font(47*l.headlineScale)}" fill="${fg}">${esc(head)}</text><text x="${x}" y="${l.bodyYPct*h}" text-anchor="${ta}" font-family="Arial,sans-serif" font-size="${font(18*l.bodyScale)}" fill="${fg}" opacity=".84">${esc(body)}</text><text x="${x}" y="${l.signatureYPct*h}" text-anchor="${ta}" font-family="Arial,sans-serif" font-size="14" letter-spacing="2" fill="${a}" opacity=".8">CARDELUME EXPERIMENT</text></svg>`;fs.writeFileSync(path.join(out,`${id}.svg`),svg);}
const magick='/opt/imagemagick/bin/magick';
if(fs.existsSync(magick)){
 for(const t of portfolioV2ExperimentTemplates){const id=t.rendererTemplateKey;const r=spawnSync(magick,[path.join(out,`${id}.svg`),'-resize','300x420',path.join(out,`${id}.png`)],{encoding:'utf8'});if(r.status!==0)console.error(r.stderr)}
 const pngs=portfolioV2ExperimentTemplates.map(t=>path.join(out,`${t.rendererTemplateKey}.png`));
 const montage=spawnSync(magick,['montage',...pngs,'-tile','4x3','-geometry','300x420+16+16','-background','white',path.join(out,'STEP17E_V2_PRODUCTION_LAYOUT_CONTACT_SHEET.png')],{encoding:'utf8'});if(montage.status!==0)console.error(montage.stderr);
}
console.log(out);

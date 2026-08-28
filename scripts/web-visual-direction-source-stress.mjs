import fs from 'node:fs';
const template=fs.readFileSync('packages/templates/src/index.ts','utf8');
const visual=fs.readFileSync('apps/web/components/card-visual.tsx','utf8');
const css=fs.readFileSync('apps/web/app/globals.css','utf8');
const union=template.match(/export type VisualDirection =([\s\S]*?);/);
if(!union)throw new Error('visual_direction_union_missing');
const directions=[...union[1].matchAll(/"([a-z]+)"/g)].map(x=>x[1]);
const missingCopy=directions.filter(d=>!new RegExp(`\\b${d}:\\{kicker:`).test(visual));
const missingCss=directions.filter(d=>!css.includes(`.card-${d}`));
if(missingCopy.length)throw new Error(`web_preview_copy_missing:${missingCopy.join(',')}`);
if(missingCss.length)throw new Error(`web_preview_css_missing:${missingCss.join(',')}`);
if(!visual.includes('direction==="photo"||direction==="memory"'))throw new Error('memory_photo_window_preview_missing');
if(!template.includes('featuredTemplatesForEnvironment')||!template.includes('t.launchStatus==="approved"'))throw new Error('production_marketing_approval_filter_missing');
const home=fs.readFileSync('apps/web/app/page.tsx','utf8');
if(!home.includes('featuredTemplatesForEnvironment(process.env.APP_ENV)'))throw new Error('homepage_marketing_environment_gate_missing');
if(/direction="(?:editorial|botanical|midnight)"/.test(home))throw new Error('homepage_hardcoded_managed_direction_bypass');
const studio=fs.readFileSync('apps/web/components/card-studio.tsx','utf8');
for(const held of ['golden','watercolor','boldpop','washi']){
  const previewBlock=studio.slice(studio.indexOf('const previewDirection'),studio.indexOf('const previewCopy'));
  if(new RegExp(`return"${held}"`).test(previewBlock))throw new Error(`held_template_used_in_live_preview:${held}`);
}
console.log(JSON.stringify({ok:true,directions:directions.length,checks:directions.length*2+6},null,2));

export type VisualDirection =
  | "editorial" | "midnight" | "botanical" | "washi" | "seoul" | "deco" | "photo" | "minimal"
  | "watercolor" | "golden" | "quietnoir" | "boldpop" | "kawaii" | "letterpress" | "celestial" | "gouache"
  | "whispered" | "museum" | "orbit" | "ribbon" | "memory" | "typecelebration" | "seal" | "pressed" | "ink" | "petal" | "ledger" | "softfold";

export type TemplatePhotoMode="none"|"optional"|"required";
export type TemplateStatus="draft"|"active"|"archived";
export type TemplateLaunchStatus="experiment"|"candidate"|"approved"|"hold"|"retired";
export type TemplateHealth="healthy"|"degraded"|"invalid";
export type TemplateScript="latin"|"cjk"|"hangul";
export type TextCapacity="short"|"medium"|"long";
export type TemplateSurfaceSource="ai_direction"|"recommended"|"market_pick"|"show_more";

export type Affinity={key:string;score:number};
export type TemplateMeta = {
  id: string;
  familyId:string;
  versionId:string;
  version:number;
  slug:string;
  name: string;
  material: string;
  visualDirection: VisualDirection;
  rendererTemplateKey:string;
  status:TemplateStatus;
  launchStatus:TemplateLaunchStatus;
  health:TemplateHealth;
  photoMode:TemplatePhotoMode;
  editorialScore:number;
  maturity:"new"|"proven"|"legacy";
  supportedFormats:string[];
  scriptSupport:TemplateScript[];
  headlineCapacity:TextCapacity;
  bodyCapacity:TextCapacity;
  feelings:Affinity[];
  occasions:Affinity[];
  markets:Affinity[];
  excludedMarkets:string[];
  impressions?:number;
  selected?:number;
  paid?:number;
  regenerated?:number;
  aiAssigned?:number;
  checkoutStarted?:number;
};

export type RecentStyleFingerprint={
  familyId:string;
  templateId?:string;
  visualDirection:VisualDirection;
  accentMode?:"original"|"photo"|"navy"|"sage"|"rose";
  createdAt?:string;
};

export type TemplateRankInput={
  market:string;
  locale:string;
  format:string;
  feeling:string;
  occasion:string;
  hasPhoto:boolean;
  bodyPressure?:number;
  recentStyles?:RecentStyleFingerprint[];
  catalogMode?:"development"|"experiment"|"staging"|"production";
};

export type TemplateScoreComponents={
  relevance:number;
  market:number;
  editorial:number;
  performance:number;
  textFit:number;
  freshness:number;
  photoFit:number;
  noveltyPenalty:number;
};
export type RankedTemplate={template:TemplateMeta;score:number;baseScore:number;marketScore:number;reasons:string[];components:TemplateScoreComponents};
export type CreativeCandidatePack={fit:RankedTemplate[];wildcards:RankedTemplate[];all:RankedTemplate[]};
export type TemplateSurface={recommended:RankedTemplate[];marketPicks:RankedTemplate[];more:RankedTemplate[]};

function norm(value:string){return value.trim().toLowerCase();}
function clamp01(value:number){return Math.max(0,Math.min(1,Number.isFinite(value)?value:0));}
function affinity(list:Affinity[],key:string){const hit=list.find(item=>norm(item.key)===norm(key));return clamp01(hit?.score??0);}
function scriptForLocale(locale:string):TemplateScript{const lc=locale.toLowerCase();if(lc.startsWith("ja")||lc.startsWith("zh"))return"cjk";if(lc.startsWith("ko"))return"hangul";return"latin";}
function capacityScore(capacity:TextCapacity,pressure=0){if(pressure<=.82)return 1;if(pressure<=1.18)return capacity==="short"?.66:1;return capacity==="long"?1:capacity==="medium"?.75:.35;}
function performanceScore(t:TemplateMeta){
  const impressions=Math.max(0,t.impressions??0),paid=Math.max(0,t.paid??0),selected=Math.max(0,t.selected??0),regenerated=Math.max(0,t.regenerated??0);
  // Bayesian-style smoothing prevents tiny samples from dominating ranking.
  const paidRate=(paid+4)/(impressions+40);
  const selectRate=(selected+8)/(impressions+80);
  const regenPenalty=selected?Math.min(.18,regenerated/Math.max(20,selected)*.18):0;
  const evidence=Math.min(1,impressions/1200);
  const observed=clamp01(paidRate*2.5*.58+selectRate*1.7*.42-regenPenalty);
  return observed*evidence+(t.editorialScore/100)*(1-evidence);
}

export function templateEligible(t:TemplateMeta,input:TemplateRankInput){
  if(t.status!=="active"||t.health!=="healthy")return false;
  if(t.launchStatus==="hold"||t.launchStatus==="retired")return false;
  if(input.catalogMode==="production"&&t.launchStatus!=="approved")return false;
  if(!t.supportedFormats.includes(input.format))return false;
  if(!t.scriptSupport.includes(scriptForLocale(input.locale)))return false;
  if(t.excludedMarkets.some(m=>m.toUpperCase()===input.market.toUpperCase()))return false;
  if(!input.hasPhoto&&t.photoMode==="required")return false;
  return true;
}

function recentStylePenalty(template:TemplateMeta,recent:RecentStyleFingerprint[]|undefined){
  if(!recent?.length)return 0;
  let strongest=0;
  for(let i=0;i<Math.min(6,recent.length);i++){
    const item=recent[i];const recency=Math.max(.35,1-i*.12);
    let similarity=0;
    if(item.familyId===template.familyId)similarity=1;
    else if(item.visualDirection===template.visualDirection)similarity=.68;
    else if(templateArchetype(template)===templateArchetype({visualDirection:item.visualDirection,photoMode:"none"}))similarity=.42;
    strongest=Math.max(strongest,similarity*recency);
  }
  return clamp01(strongest);
}

export function rankTemplates(templates:TemplateMeta[],input:TemplateRankInput):RankedTemplate[]{
  return templates.filter(t=>templateEligible(t,input)).map(template=>{
    const feeling=affinity(template.feelings,input.feeling);
    const occasion=affinity(template.occasions,input.occasion);
    const relevance=(feeling*.55+occasion*.45);
    const marketScore=affinity(template.markets,input.market)||affinity(template.markets,"GLOBAL")*.55;
    const editorial=clamp01(template.editorialScore/100);
    const performance=performanceScore(template);
    const textFit=capacityScore(template.bodyCapacity,input.bodyPressure);
    const freshness=template.maturity==="new"?1:template.maturity==="proven"?.72:.35;
    const photoFit=input.hasPhoto?(template.photoMode==="required"?1:template.photoMode==="optional"?.92:.65):(template.photoMode==="none"?1:.92);
    const noveltyPenalty=recentStylePenalty(template,input.recentStyles);
    const baseScore=(relevance*.35+marketScore*.20+editorial*.20+performance*.15+textFit*.05+freshness*.05)*photoFit;
    // History is a soft freshness prior only. A strong semantic fit must remain selectable.
    const score=baseScore*(1-noveltyPenalty*.16);
    const reasons:string[]=[];
    if(relevance>=.75)reasons.push("brief");if(marketScore>=.75)reasons.push("market");if(editorial>=.9)reasons.push("editorial");if(template.photoMode==="required")reasons.push("photo");if(noveltyPenalty>=.55)reasons.push("recent_style");
    return{template,score,baseScore,marketScore,reasons,components:{relevance,market:marketScore,editorial,performance,textFit,freshness,photoFit,noveltyPenalty}};
  }).sort((a,b)=>b.score-a.score||b.template.editorialScore-a.template.editorialScore||a.template.name.localeCompare(b.template.name));
}

function creativeDistance(candidate:RankedTemplate,chosen:RankedTemplate[]){
  if(!chosen.length)return 1;
  let closest=0;
  for(const prior of chosen){
    let similarity=0;
    if(candidate.template.familyId===prior.template.familyId)similarity=1;
    else if(candidate.template.visualDirection===prior.template.visualDirection)similarity=.8;
    else if(templateArchetype(candidate.template)===templateArchetype(prior.template))similarity=.55;
    closest=Math.max(closest,similarity);
  }
  return 1-closest;
}

export function buildCreativeCandidatePack(templates:TemplateMeta[],input:TemplateRankInput):CreativeCandidatePack{
  const ranked=rankTemplates(templates,input);const used=new Set<string>();
  const fit=diversePick(ranked,Math.min(6,ranked.length),used);
  const remaining=ranked.filter(item=>!used.has(item.template.id)&&item.template.editorialScore>=84);
  const wildcardRanked=[...remaining].sort((a,b)=>{
    const aValue=creativeDistance(a,fit)*.50+(a.template.editorialScore/100)*.32+a.components.freshness*.18;
    const bValue=creativeDistance(b,fit)*.50+(b.template.editorialScore/100)*.32+b.components.freshness*.18;
    return bValue-aValue||b.score-a.score;
  });
  const wildcards=diversePick(wildcardRanked,Math.min(2,wildcardRanked.length),used);
  return{fit,wildcards,all:[...fit,...wildcards]};
}

export function expandedCreativeCandidatePool(templates:TemplateMeta[],input:TemplateRankInput,max=16){
  const limit=Math.max(3,Math.min(16,Math.floor(max)));const ranked=rankTemplates(templates,input);const used=new Set<string>();
  const fitTarget=Math.max(3,Math.floor(limit*.75));const fit=diversePick(ranked,Math.min(fitTarget,ranked.length),used);
  const exploration=[...ranked.filter(item=>!used.has(item.template.id)&&item.template.editorialScore>=82)].sort((a,b)=>{
    const av=creativeDistance(a,fit)*.58+(a.template.editorialScore/100)*.27+a.components.freshness*.15;
    const bv=creativeDistance(b,fit)*.58+(b.template.editorialScore/100)*.27+b.components.freshness*.15;return bv-av||b.score-a.score;
  });
  const wildcards=diversePick(exploration,limit-fit.length,used);
  const fill=wildcards.length+fit.length<limit?diversePick(ranked,limit-fit.length-wildcards.length,used):[];
  return[...fit,...wildcards,...fill];
}

function diversePick(pool:RankedTemplate[],count:number,used=new Set<string>()){
  const out:RankedTemplate[]=[];const families=new Set<string>();const directions=new Set<VisualDirection>();
  for(const item of pool){
    if(used.has(item.template.id))continue;
    const familyPenalty=families.has(item.template.familyId);const directionPenalty=directions.has(item.template.visualDirection);
    if((familyPenalty||directionPenalty)&&pool.length>count*2)continue;
    out.push(item);used.add(item.template.id);families.add(item.template.familyId);directions.add(item.template.visualDirection);if(out.length===count)break;
  }
  if(out.length<count)for(const item of pool){if(!used.has(item.template.id)){out.push(item);used.add(item.template.id);if(out.length===count)break;}}
  return out;
}

export function surfaceTemplates(templates:TemplateMeta[],input:TemplateRankInput):TemplateSurface{
  const ranked=rankTemplates(templates,input);const used=new Set<string>();
  // Reserve genuinely local candidates first so the Recommended row cannot consume
  // the entire market pack. The UI still renders Recommended first; this is only
  // candidate allocation and keeps all surfaced templates deduplicated.
  const marketPool=ranked.filter(item=>item.marketScore>=.55);
  const marketPicks=diversePick(marketPool,4,used);
  const recommended=diversePick(ranked,4,used);
  if(marketPicks.length<4){const fill=diversePick(ranked,4-marketPicks.length,used);marketPicks.push(...fill);}
  if(recommended.length<4){const fill=diversePick(ranked,4-recommended.length,used);recommended.push(...fill);}
  const more=diversePick(ranked,8,used);
  return{recommended,marketPicks,more};
}

export type TemplateArchetype="editorial"|"midnight"|"photo"|"quiet";
export type CreativeAccentMode="original"|"photo"|"navy"|"sage"|"rose";
export type SignatureMove="recipient_anchor"|"quiet_opening"|"isolated_closing_line"|"keepsake_memory"|"understated_celebration"|"editorial_contrast";
export type TemplateCreativeRecipe={
  voice:string[];
  preferredAccents:CreativeAccentMode[];
  signatureMoves:SignatureMove[];
  copyCadence:"restrained"|"intimate"|"expressive"|"editorial";
};

export function templateCreativeRecipe(t:Pick<TemplateMeta,"visualDirection"|"photoMode">):TemplateCreativeRecipe{
  // V2 families intentionally occupy different premium visual worlds while staying inside
  // the same controlled accent contract. This avoids "everything becomes ivory/navy" collapse
  // without turning accent selection into a runtime quota.
  if(t.visualDirection==="whispered")return{voice:["quiet","literary","human"],preferredAccents:["original","sage"],signatureMoves:["quiet_opening","isolated_closing_line","recipient_anchor"],copyCadence:"restrained"};
  if(t.visualDirection==="museum")return{voice:["editorial","cultivated","precise"],preferredAccents:["original","navy"],signatureMoves:["editorial_contrast","isolated_closing_line","recipient_anchor"],copyCadence:"editorial"};
  if(t.visualDirection==="orbit")return{voice:["personal","modern","symbolic"],preferredAccents:["navy","rose","original"],signatureMoves:["recipient_anchor","understated_celebration","editorial_contrast"],copyCadence:"editorial"};
  if(t.visualDirection==="ribbon")return{voice:["warm","romantic","fluid"],preferredAccents:["rose","original","sage"],signatureMoves:["isolated_closing_line","recipient_anchor","keepsake_memory"],copyCadence:"intimate"};
  if(t.visualDirection==="memory")return{voice:["personal","keepsake","warm"],preferredAccents:t.photoMode!=="none"?["photo","original","sage"]:["original","sage"],signatureMoves:["keepsake_memory","recipient_anchor","isolated_closing_line"],copyCadence:"intimate"};
  if(t.visualDirection==="typecelebration")return{voice:["joyful","graphic","confident"],preferredAccents:["rose","sage","original"],signatureMoves:["understated_celebration","editorial_contrast","recipient_anchor"],copyCadence:"expressive"};
  if(t.visualDirection==="seal")return{voice:["quiet","timeless","ceremonial"],preferredAccents:["original","navy"],signatureMoves:["quiet_opening","recipient_anchor","isolated_closing_line"],copyCadence:"restrained"};
  if(t.visualDirection==="pressed")return{voice:["tactile","restrained","architectural"],preferredAccents:["sage","original","navy"],signatureMoves:["editorial_contrast","quiet_opening","understated_celebration"],copyCadence:"restrained"};
  if(t.visualDirection==="ink")return{voice:["expressive","poetic","intimate"],preferredAccents:["navy","rose","original"],signatureMoves:["isolated_closing_line","quiet_opening","keepsake_memory"],copyCadence:"intimate"};
  if(t.visualDirection==="petal")return{voice:["organic","warm","refined"],preferredAccents:["sage","rose","original"],signatureMoves:["understated_celebration","recipient_anchor","isolated_closing_line"],copyCadence:"editorial"};
  if(t.visualDirection==="ledger")return{voice:["cinematic","nocturne","precise"],preferredAccents:["navy","original"],signatureMoves:["editorial_contrast","quiet_opening","isolated_closing_line"],copyCadence:"restrained"};
  if(t.visualDirection==="softfold")return{voice:["architectural","soft","considered"],preferredAccents:["original","sage","rose"],signatureMoves:["quiet_opening","editorial_contrast","recipient_anchor"],copyCadence:"editorial"};
  if(t.photoMode==="required"||t.visualDirection==="photo")return{voice:["personal","keepsake","warm"],preferredAccents:["photo","original"],signatureMoves:["keepsake_memory","isolated_closing_line","recipient_anchor"],copyCadence:"intimate"};
  if(t.photoMode==="optional")return{voice:["personal","editorial","flexible"],preferredAccents:["original","photo","sage","navy"],signatureMoves:["recipient_anchor","keepsake_memory","isolated_closing_line"],copyCadence:"editorial"};
  if(["midnight","deco","quietnoir","celestial","ledger"].includes(t.visualDirection))return{voice:["elegant","cinematic","restrained"],preferredAccents:["navy","original","rose"],signatureMoves:["editorial_contrast","quiet_opening","isolated_closing_line"],copyCadence:"restrained"};
  if(["minimal","letterpress","washi","whispered","museum","seal"].includes(t.visualDirection))return{voice:["quiet","refined","human"],preferredAccents:["original","sage","navy"],signatureMoves:["quiet_opening","recipient_anchor","understated_celebration"],copyCadence:"restrained"};
  if(["boldpop","kawaii","gouache","golden","typecelebration"].includes(t.visualDirection))return{voice:["joyful","fresh","tasteful"],preferredAccents:["original","rose","sage"],signatureMoves:["understated_celebration","recipient_anchor","editorial_contrast"],copyCadence:"expressive"};
  return{voice:["warm","editorial","premium"],preferredAccents:["original","sage","rose","navy"],signatureMoves:["recipient_anchor","isolated_closing_line","understated_celebration"],copyCadence:"editorial"};
}

export function templateArchetype(t:Pick<TemplateMeta,"visualDirection"|"photoMode">):TemplateArchetype{
  if(t.photoMode==="required"||t.visualDirection==="photo")return"photo";
  if(["midnight","deco","quietnoir","celestial","ledger"].includes(t.visualDirection))return"midnight";
  if(["minimal","letterpress","whispered","museum","seal"].includes(t.visualDirection))return"quiet";
  return"editorial";
}
export function selectGenerationTemplates(templates:TemplateMeta[],input:TemplateRankInput){
  // Backward-compatible deterministic fallback only. Step 13 normal generation uses
  // buildCreativeCandidatePack() and lets the premium AI Creative Director choose.
  const ranked=rankTemplates(templates,input);const slots:TemplateArchetype[]=input.hasPhoto?["editorial","midnight","photo"]:["editorial","midnight","quiet"];
  const used=new Set<string>();const out:RankedTemplate[]=[];
  for(const slot of slots){const pick=ranked.find(item=>!used.has(item.template.id)&&templateArchetype(item.template)===slot);if(!pick)continue;out.push(pick);used.add(pick.template.id);}
  return out;
}

const F="portrait-5x7,folded-5x7,square-5x5,landscape-7x5,postcard-6x4".split(",");
const ALL_SCRIPTS:TemplateScript[]=["latin","cjk","hangul"];
const O=(birthday=.8,anniversary=.7,thanks=.7,congrats=.7,baby=.55):Affinity[]=>[
  {key:"Birthday",score:birthday},{key:"Anniversary",score:anniversary},{key:"Thank You",score:thanks},{key:"Congratulations",score:congrats},{key:"New Baby",score:baby},{key:"Other",score:.58}
];
const FE=(e=.8,w=.7,r=.6,f=.3):Affinity[]=>[{key:"Elegant",score:e},{key:"Warm",score:w},{key:"Romantic",score:r},{key:"Fun",score:f},{key:"Surprise me",score:.72}];
const M=(...values:[string,number][]):Affinity[]=>{
  const map=new Map<string,number>([["GLOBAL",.7]]);
  for(const [key,score] of values) map.set(key.toUpperCase(),score);
  return [...map.entries()].map(([key,score])=>({key,score}));
};

// Stable IDs make curated fallback safe even if generation/provider/DB is unavailable.
const seed=(n:number,name:string,visualDirection:VisualDirection,material:string,overrides:Partial<TemplateMeta>={}):TemplateMeta=>({
  id:`10000000-0000-4000-8000-${String(n).padStart(12,"0")}`,
  familyId:`20000000-0000-4000-8000-${String(n).padStart(12,"0")}`,
  versionId:`30000000-0000-4000-8000-${String(n).padStart(12,"0")}`,
  version:1,slug:name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,""),name,material,visualDirection,rendererTemplateKey:({
    editorial:"luxury-editorial",midnight:"midnight-lume",botanical:"botanical-poise",washi:"washi-elegance",seoul:"soft-seoul",deco:"art-deco-noir",photo:"photo-story",minimal:"quiet-minimal",watercolor:"watercolor-bloom",golden:"golden-hour",quietnoir:"quiet-noir",boldpop:"bold-pop",kawaii:"kawaii-joy",letterpress:"classic-letterpress",celestial:"celestial-night",gouache:"little-wonders",
    whispered:"whispered-type",museum:"museum-note",orbit:"monogram-orbit",ribbon:"ribbon-line",memory:"memory-window",typecelebration:"type-celebration",seal:"quiet-seal",pressed:"pressed-shadow",ink:"ink-pause",petal:"petal-geometry",ledger:"night-ledger",softfold:"soft-fold"
  } as Record<VisualDirection,string>)[visualDirection],status:"active",launchStatus:"candidate",health:"healthy",photoMode:visualDirection==="photo"?"required":"none",editorialScore:88,maturity:"proven",supportedFormats:F,scriptSupport:ALL_SCRIPTS,headlineCapacity:"medium",bodyCapacity:"medium",feelings:FE(),occasions:O(),markets:M(),excludedMarkets:[],...overrides
});

export const bootstrapTemplates:TemplateMeta[]=[
  seed(1,"Luxury Editorial","editorial","Cotton · Restrained foil",{editorialScore:97,photoMode:"none",feelings:FE(.98,.72,.68,.18),markets:M(["US",.91],["GB",.91],["FR",.84])}),
  seed(2,"Midnight Lume","midnight","Navy · Foil",{editorialScore:95,photoMode:"none",feelings:FE(.93,.52,.78,.35),markets:M(["US",.88],["KR",.82])}),
  seed(3,"Botanical Poise","botanical","Letterpress · Botanical",{editorialScore:96,feelings:FE(.91,.92,.8,.2),markets:M(["FR",.91],["GB",.87],["VN",.82])}),
  seed(4,"Washi Elegance","washi","Washi · Ink",{launchStatus:"hold",editorialScore:96,photoMode:"none",feelings:FE(.98,.76,.7,.12),markets:M(["JP",.99]),scriptSupport:["latin","cjk"]}),
  seed(5,"Soft Seoul","seoul","Hanji · Soft color",{launchStatus:"hold",editorialScore:94,feelings:FE(.86,.95,.82,.35),markets:M(["KR",.99]),scriptSupport:["latin","hangul"]}),
  seed(6,"Art Deco Noir","deco","Noir · Gold foil",{editorialScore:93,photoMode:"none",feelings:FE(.98,.3,.62,.36),markets:M(["US",.86],["FR",.86])}),
  seed(7,"Photo Story","photo","Photo · Editorial",{editorialScore:95,photoMode:"required",bodyCapacity:"short",feelings:FE(.84,.94,.9,.45),markets:M(["US",.92],["KR",.88],["VN",.88])}),
  seed(8,"Quiet Minimal","minimal","Uncoated · Minimal",{editorialScore:92,photoMode:"none",feelings:FE(.96,.68,.5,.1),markets:M(["JP",.9],["DE",.88])}),
  seed(9,"Watercolor Bloom","watercolor","Cold press · Watercolor",{launchStatus:"hold",editorialScore:91,feelings:FE(.75,.95,.96,.32),markets:M(["FR",.86],["VN",.86])}),
  seed(10,"Golden Hour","golden","Retro stock · Sun print",{launchStatus:"hold",editorialScore:88,feelings:FE(.55,.95,.62,.78),markets:M(["US",.84],["VN",.82])}),
  seed(11,"Quiet Noir","quietnoir","Matte black · Blind emboss",{launchStatus:"hold",editorialScore:92,photoMode:"none",feelings:FE(.98,.38,.5,.2),markets:M(["DE",.88],["FR",.86])}),
  seed(12,"Bold Pop","boldpop","Risograph · Graphic",{launchStatus:"hold",editorialScore:86,feelings:FE(.28,.72,.4,.99),occasions:O(.96,.48,.62,.98,.7),markets:M(["US",.9],["KR",.82])}),
  seed(13,"Kawaii Joy","kawaii","Pearl paper · Kawaii",{launchStatus:"hold",editorialScore:87,feelings:FE(.35,.9,.55,.99),occasions:O(.98,.42,.65,.86,.92),markets:M(["JP",.96]),scriptSupport:["latin","cjk"]}),
  seed(14,"Classic Letterpress","letterpress","Cotton rag · Letterpress",{editorialScore:98,photoMode:"none",bodyCapacity:"long",feelings:FE(.99,.92,.72,.08),markets:M(["US",.92],["GB",.94],["FR",.9])}),
  seed(15,"Celestial Night","celestial","Navy · Constellation",{launchStatus:"hold",editorialScore:91,photoMode:"none",feelings:FE(.9,.63,.88,.45),markets:M(["US",.86],["KR",.84])}),
  seed(16,"Little Wonders","gouache","Gouache · Cut paper",{launchStatus:"hold",editorialScore:89,feelings:FE(.58,.96,.55,.92),occasions:O(.9,.35,.72,.75,.99),markets:M(["US",.82],["VN",.8])})
];

export const portfolioV2ExperimentTemplates:TemplateMeta[]=[
  seed(101,"Whispered Type","whispered","Type · Hairline",{status:"active",launchStatus:"experiment",maturity:"new",editorialScore:94,feelings:FE(.98,.82,.86,.18),occasions:O(.62,.92,.92,.72,.35),markets:M(["GLOBAL",.9])}),
  seed(102,"Museum Note","museum","Editorial · Rule grid",{status:"active",launchStatus:"experiment",maturity:"new",editorialScore:95,photoMode:"optional",bodyCapacity:"long",feelings:FE(.98,.74,.62,.12),occasions:O(.42,.86,.96,.82,.25),markets:M(["GLOBAL",.9])}),
  seed(103,"Monogram Orbit","orbit","Parametric · Personal mark",{status:"active",launchStatus:"experiment",maturity:"new",editorialScore:96,feelings:FE(.92,.78,.82,.52),occasions:O(.94,.94,.62,.94,.45),markets:M(["GLOBAL",.9])}),
  seed(104,"Ribbon Line","ribbon","Continuous line · Motion",{status:"active",launchStatus:"experiment",maturity:"new",editorialScore:94,feelings:FE(.86,.94,.96,.30),occasions:O(.72,.92,.94,.62,.35),markets:M(["GLOBAL",.9])}),
  seed(105,"Memory Window","memory","Photo fragment · Caption",{status:"active",launchStatus:"experiment",maturity:"new",editorialScore:96,photoMode:"optional",bodyCapacity:"short",feelings:FE(.88,.98,.92,.48),occasions:O(.96,.96,.78,.72,.75),markets:M(["GLOBAL",.9])}),
  seed(106,"Type Celebration","typecelebration","Kinetic type · Rule",{status:"active",launchStatus:"experiment",maturity:"new",editorialScore:93,feelings:FE(.55,.78,.48,.96),occasions:O(.99,.52,.58,.99,.68),markets:M(["GLOBAL",.9])}),
  seed(107,"Quiet Seal","seal","Personal seal · Negative space",{status:"active",launchStatus:"experiment",maturity:"new",editorialScore:97,bodyCapacity:"long",feelings:FE(.99,.86,.72,.08),occasions:O(.56,.94,.94,.88,.45),markets:M(["GLOBAL",.9])}),
  seed(108,"Pressed Shadow","pressed","Layered relief · Paper depth",{status:"active",launchStatus:"experiment",maturity:"new",editorialScore:94,feelings:FE(.94,.78,.58,.24),occasions:O(.58,.86,.84,.96,.40),markets:M(["GLOBAL",.9])}),
  seed(109,"Ink Pause","ink","Abstract ink · Pause",{status:"active",launchStatus:"experiment",maturity:"new",editorialScore:95,feelings:FE(.90,.96,.96,.18),occasions:O(.54,.88,.98,.62,.32),markets:M(["GLOBAL",.9])}),
  seed(110,"Petal Geometry","petal","Parametric ellipse · Botanical abstraction",{status:"active",launchStatus:"experiment",maturity:"new",editorialScore:93,feelings:FE(.82,.94,.76,.34),occasions:O(.92,.72,.96,.78,.64),markets:M(["GLOBAL",.9])}),
  seed(111,"Night Ledger","ledger","Nocturne · Coordinate light",{status:"active",launchStatus:"experiment",maturity:"new",editorialScore:97,feelings:FE(.98,.66,.94,.20),occasions:O(.50,.98,.64,.86,.20),markets:M(["GLOBAL",.9])}),
  seed(112,"Soft Fold","softfold","Fold geometry · Quiet plane",{status:"active",launchStatus:"experiment",maturity:"new",editorialScore:94,photoMode:"optional",bodyCapacity:"long",feelings:FE(.96,.90,.70,.12),occasions:O(.56,.82,.98,.94,.36),markets:M(["GLOBAL",.9])})
];

export const portfolioV2AllTemplates=[...bootstrapTemplates,...portfolioV2ExperimentTemplates];

// Marketing/customer-facing template surfaces follow the same production approval boundary
// as generation/catalog reads. Non-production may deliberately expose candidate/experiment
// families for review, but HOLD/RETIRED families remain hidden everywhere.
export function featuredTemplatesForEnvironment(appEnv:string|undefined){
  const reviewable=portfolioV2AllTemplates.filter(t=>t.status==="active"&&t.health==="healthy"&&t.launchStatus!=="hold"&&t.launchStatus!=="retired");
  return appEnv==="production"?reviewable.filter(t=>t.launchStatus==="approved"):reviewable;
}
export function bootstrapTemplateById(id:string){return bootstrapTemplates.find(t=>t.id===id);}

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
export type TemplateMaterialWorld="editorial_luxury"|"nocturne_foil"|"letterpress_tactile"|"photo_keepsake"|"quiet_modern"|"personal_mark"|"celebration_energy";
export type TemplateEnergy="quiet"|"warm"|"cinematic"|"tactile"|"bold"|"personal";
export type TemplateColorWorld="ivory"|"navy"|"sage"|"warm"|"soft_color"|"noir"|"photo";
export type TemplateMotionProfile="static_paper"|"foil_light"|"pressed_depth"|"photo_palette"|"personal_mark"|"quiet_plane";

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
  materialWorld:TemplateMaterialWorld;
  materialCues:string[];
  energy:TemplateEnergy;
  colorWorld:TemplateColorWorld;
  motionProfile:TemplateMotionProfile;
  localeStrengths:string[];
  printFormatStrength:string[];
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

export type TemplateIdentity={
  templateId:string;
  templateVersionId:string;
};

export function templatePairKey(template: Pick<TemplateMeta, "id" | "versionId"> | TemplateIdentity | { id?: string; versionId?: string; templateId?: string; templateVersionId?: string }): string {
  const tId = "templateId" in template && template.templateId ? template.templateId : (template as { id?: string }).id ?? "";
  const vId = "templateVersionId" in template && template.templateVersionId ? template.templateVersionId : (template as { versionId?: string }).versionId ?? "";
  return `${tId}:${vId}`.toLowerCase();
}
export const templateIdentityKey = templatePairKey;

export type TemplateRankInput={
  market:string;
  locale:string;
  format:string;
  feeling:string;
  occasion:string;
  hasPhoto:boolean;
  bodyPressure?:number;
  recentStyles?:RecentStyleFingerprint[];
  seenTemplateIdentities?:TemplateIdentity[];
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
    else if(candidate.template.visualDirection===prior.template.visualDirection)similarity=.82;
    else if(candidate.template.materialWorld===prior.template.materialWorld)similarity=.66;
    else if(templateArchetype(candidate.template)===templateArchetype(prior.template))similarity=.52;
    if(candidate.template.colorWorld===prior.template.colorWorld)similarity=Math.max(similarity,.32);
    if(candidate.template.energy===prior.template.energy)similarity=Math.max(similarity,.24);
    closest=Math.max(closest,similarity);
  }
  return 1-closest;
}

function partitionTemplatesBySeen(templates: TemplateMeta[], input: TemplateRankInput): TemplateMeta[] {
  const seenKeys = new Set((input.seenTemplateIdentities ?? []).map(templatePairKey));
  if (!seenKeys.size) return templates;
  const eligible = templates.filter(t => templateEligible(t, input));
  const unseen = eligible.filter(t => !seenKeys.has(templatePairKey(t)));
  if (unseen.length >= 3) return unseen;
  if (unseen.length > 0) {
    const seen = eligible.filter(t => seenKeys.has(templatePairKey(t)));
    return [...unseen, ...seen];
  }
  return eligible;
}

export function buildCreativeCandidatePack(templates:TemplateMeta[],input:TemplateRankInput):CreativeCandidatePack{
  const pool=partitionTemplatesBySeen(templates,input);
  const ranked=rankTemplates(pool,input);const used=new Set<string>();
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
  const limit=Math.max(3,Math.min(16,Math.floor(max)));
  const pool=partitionTemplatesBySeen(templates,input);
  const ranked=rankTemplates(pool,input);const used=new Set<string>();
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
  const out:RankedTemplate[]=[];const families=new Set<string>();const directions=new Set<VisualDirection>();const worlds=new Set<TemplateMaterialWorld>();
  for(const item of pool){
    if(used.has(item.template.id))continue;
    const familyPenalty=families.has(item.template.familyId);const directionPenalty=directions.has(item.template.visualDirection);const worldPenalty=worlds.has(item.template.materialWorld);
    if((familyPenalty||directionPenalty||worldPenalty)&&pool.length>count*2)continue;
    out.push(item);used.add(item.template.id);families.add(item.template.familyId);directions.add(item.template.visualDirection);worlds.add(item.template.materialWorld);if(out.length===count)break;
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
export function hasDiverseEffectiveArchetypes(templates:Array<Pick<TemplateMeta,"visualDirection"|"photoMode">>,minDistinct=2):boolean{
  if(!Array.isArray(templates)||templates.length<minDistinct)return false;
  const archetypes=new Set(templates.map(t=>templateArchetype(t)));
  return archetypes.size>=minDistinct;
}

function categoricalSimilarity(a:unknown,b:unknown){
  if(typeof a!=="string"||typeof b!=="string"||!a.trim()||!b.trim())return .5;
  return a===b?1:0;
}

function cueSimilarity(a?:string[],b?:string[]){
  const left=new Set((Array.isArray(a)?a:[]).map(norm).filter(Boolean));
  const right=new Set((Array.isArray(b)?b:[]).map(norm).filter(Boolean));
  if(!left.size||!right.size)return .5;
  let intersection=0;
  for(const cue of left)if(right.has(cue))intersection++;
  return intersection/(left.size+right.size-intersection);
}

function numericSimilarity(a:unknown,b:unknown,range:number){
  if(typeof a!=="number"||typeof b!=="number"||!Number.isFinite(a)||!Number.isFinite(b))return .5;
  return clamp01(1-Math.abs(a-b)/range);
}

function layoutSimilarity(a:TemplateMeta,b:TemplateMeta){
  if(!a.rendererTemplateKey||!b.rendererTemplateKey)return .5;
  const left=templateLayoutProfile(a.rendererTemplateKey);
  const right=templateLayoutProfile(b.rendererTemplateKey);
  const numeric=[
    numericSimilarity(left.xPct,right.xPct,0.5),
    numericSimilarity(left.kickerYPct,right.kickerYPct,0.45),
    numericSimilarity(left.headlineYPct,right.headlineYPct,0.45),
    numericSimilarity(left.bodyYPct,right.bodyYPct,0.45),
    numericSimilarity(left.signatureYPct,right.signatureYPct,0.45),
    numericSimilarity(left.headlineWidthPct,right.headlineWidthPct,35),
    numericSimilarity(left.bodyWidthPct,right.bodyWidthPct,35),
    numericSimilarity(left.headlineScale,right.headlineScale,0.5),
    numericSimilarity(left.bodyScale,right.bodyScale,0.5),
  ];
  const categorical=[
    left.anchor===right.anchor?1:0,
    left.showBorder===right.showBorder?1:0,
    left.showSignatureMark===right.showSignatureMark?1:0,
    Boolean(left.darkSurface)===Boolean(right.darkSurface)?1:0,
    Boolean(left.photoWindow)===Boolean(right.photoWindow)?1:0,
  ];
  return [...numeric,...categorical].reduce((sum,value)=>sum+value,0)/(numeric.length+categorical.length);
}

/**
 * Compare the rendered design language represented by two ranked candidates.
 * This deliberately uses existing catalog/presentation metadata instead of IDs:
 * two families can still be near-clones when their material, palette, layout,
 * typography capacity, density, and finish cues converge.
 */
export function perceptualSimilarity(a:RankedTemplate,b:RankedTemplate){
  const left=a.template;
  const right=b.template;
  const features=[
    [categoricalSimilarity(left.materialWorld,right.materialWorld),.14],
    [cueSimilarity(left.materialCues,right.materialCues),.10],
    [categoricalSimilarity(left.colorWorld,right.colorWorld),.13],
    [categoricalSimilarity(left.energy,right.energy),.10],
    [categoricalSimilarity(left.motionProfile,right.motionProfile),.10],
    [categoricalSimilarity(left.visualDirection,right.visualDirection),.07],
    [categoricalSimilarity(templateArchetype(left),templateArchetype(right)),.03],
    [categoricalSimilarity(left.familyId,right.familyId),.03],
    [categoricalSimilarity(left.photoMode,right.photoMode),.04],
    [categoricalSimilarity(left.headlineCapacity,right.headlineCapacity),.02],
    [categoricalSimilarity(left.bodyCapacity,right.bodyCapacity),.02],
    [categoricalSimilarity(left.material,right.material),.04],
    [layoutSimilarity(left,right),.16],
  ];
  return clamp01(features.reduce((sum,[value,weight])=>sum+value*weight,0));
}

/**
 * Greedy quality-aware reranking for the final direction trio. The first pick
 * is always the highest-quality ranked candidate; later picks pay only a soft
 * penalty for resemblance to anything already selected. Input order remains
 * the deterministic tie-break, so this never creates diversity by randomness.
 */
export function selectQualityAwareDiversifiedCandidates(ranked:RankedTemplate[],count=3,options:{requirePhoto?:boolean;requiredArchetypes?:TemplateArchetype[]}={}):RankedTemplate[]{
  const target=Math.max(0,Math.floor(count));
  if(!target||!ranked.length)return[];
  const pool=ranked.map((item,index)=>({item,index}));
  const selected:Array<{item:RankedTemplate;index:number}>=[];
  while(selected.length<target){
    const available=pool.filter(({item})=>{
      if(selected.some(({item:chosen})=>chosen.template.id===item.template.id))return false;
      return !selected.some(({item:chosen})=>chosen.template.familyId===item.template.familyId);
    });
    if(!available.length)break;
    let best:{item:RankedTemplate;index:number;adjusted:number;raw:number}|undefined;
    for(const entry of available){
      const raw=clamp01(entry.item.score);
      const similarity=selected.length?Math.max(...selected.map(({item:chosen})=>perceptualSimilarity(entry.item,chosen))):0;
      const adjusted=raw-similarity*.22;
      if(!best||adjusted>best.adjusted+1e-9||(Math.abs(adjusted-best.adjusted)<=1e-9&&(raw>best.raw+1e-9||(Math.abs(raw-best.raw)<=1e-9&&entry.index<best.index)))){
        best={...entry,adjusted,raw};
      }
    }
    if(!best)break;
    selected.push(best);
  }
  let result=selected.map(({item})=>item);
  const required=[...new Set(options.requiredArchetypes??[])].slice(0,target);
  if(required.length===target&&result.length===target){
    const anchor=result[0];
    const coverage:RankedTemplate[]=[];
    const anchorArchetype=templateArchetype(anchor.template);
    if(required.includes(anchorArchetype))coverage.push(anchor);
    for(const archetype of required){
      if(coverage.some(item=>templateArchetype(item.template)===archetype))continue;
      const optionsForSlot=pool.filter(({item})=>templateArchetype(item.template)===archetype&&!coverage.some(chosen=>chosen.template.id===item.template.id||chosen.template.familyId===item.template.familyId));
      let best:{item:RankedTemplate;index:number;adjusted:number;raw:number}|undefined;
      for(const entry of optionsForSlot){
        const raw=clamp01(entry.item.score);
        const similarity=coverage.length?Math.max(...coverage.map(chosen=>perceptualSimilarity(entry.item,chosen))):0;
        const adjusted=raw-similarity*.22;
        if(!best||adjusted>best.adjusted+1e-9||(Math.abs(adjusted-best.adjusted)<=1e-9&&(raw>best.raw+1e-9||(Math.abs(raw-best.raw)<=1e-9&&entry.index<best.index))))best={...entry,adjusted,raw};
      }
      if(best)coverage.push(best.item);
    }
    if(coverage.length===target){
      const greedyAverage=result.reduce((sum,item)=>sum+clamp01(item.score),0)/target;
      const coverageAverage=coverage.reduce((sum,item)=>sum+clamp01(item.score),0)/target;
      if(coverageAverage>=greedyAverage-.20)result=coverage;
    }
  }
  if(options.requirePhoto){
    const photoIndex=result.findIndex(item=>item.template.photoMode==="required"||item.template.visualDirection==="photo");
    if(photoIndex>=0&&photoIndex!==result.length-1){
      const [photoCandidate]=result.splice(photoIndex,1);
      result.push(photoCandidate);
    }
  }
  return result;
}

export type NovelSelectionOutcome = {
  candidates: RankedTemplate[];
  unseenCount: number;
  exhaustionState: "none" | "partial" | "total";
  exhausted: boolean;
};

export function selectNovelGenerationTemplates(
  templates: TemplateMeta[],
  input: TemplateRankInput
): NovelSelectionOutcome {
  const eligible = templates.filter(t => templateEligible(t, input));
  const seenKeys = new Set((input.seenTemplateIdentities ?? []).map(templatePairKey));

  const unseenEligible = eligible.filter(t => !seenKeys.has(templatePairKey(t)));
  const seenEligible = eligible.filter(t => seenKeys.has(templatePairKey(t)));

  const requiredArchetypes: TemplateArchetype[] = input.hasPhoto
    ? ["editorial", "midnight", "photo"]
    : ["editorial", "midnight", "quiet"];

  // Case 1: >= 3 unseen templates
  if (unseenEligible.length >= 3) {
    const rankedUnseen = rankTemplates(unseenEligible, input);
    let trio = selectQualityAwareDiversifiedCandidates(rankedUnseen, 3, {
      requirePhoto: input.hasPhoto,
      requiredArchetypes
    });
    if (trio.length < 3) {
      const usedIds = new Set(trio.map(item => item.template.id));
      const usedFamilies = new Set(trio.map(item => item.template.familyId));
      for (const item of rankedUnseen) {
        if (!usedIds.has(item.template.id) && !usedFamilies.has(item.template.familyId)) {
          trio.push(item);
          usedIds.add(item.template.id);
          usedFamilies.add(item.template.familyId);
          if (trio.length === 3) break;
        }
      }
      if (trio.length < 3) {
        for (const item of rankedUnseen) {
          if (!usedIds.has(item.template.id)) {
            trio.push(item);
            usedIds.add(item.template.id);
            if (trio.length === 3) break;
          }
        }
      }
    }
    return {
      candidates: trio,
      unseenCount: unseenEligible.length,
      exhaustionState: "none",
      exhausted: false
    };
  }

  // Case 2: 1-2 unseen templates
  if (unseenEligible.length >= 1 && unseenEligible.length < 3) {
    const rankedUnseen = rankTemplates(unseenEligible, input);
    const rankedSeen = rankTemplates(seenEligible, input);

    // Partial exhaustion must surface every unseen candidate before any recycled
    // candidate. Do not let the trio family gate discard one of the only unseen choices.
    const selected: RankedTemplate[] = rankedUnseen.slice(0, unseenEligible.length);

    // Existing bounded fill for remaining slots
    const needed = 3 - selected.length;
    if (needed > 0 && rankedSeen.length > 0) {
      const seenArchetypes = new Set<TemplateArchetype>();
      for (const c of selected) {
        seenArchetypes.add(templateArchetype(c.template));
      }
      const missingArchetypes = requiredArchetypes.filter(a => !seenArchetypes.has(a));

      const pool = rankedSeen.filter(
        item => !selected.some(c => c.template.id === item.template.id || c.template.familyId === item.template.familyId)
      );
      const fillPool = pool.length >= needed ? pool : rankedSeen.filter(
        item => !selected.some(c => c.template.id === item.template.id)
      );

      const filled = selectQualityAwareDiversifiedCandidates(fillPool, needed, {
        requirePhoto: input.hasPhoto && !selected.some(c => c.template.photoMode === "required" || c.template.visualDirection === "photo"),
        requiredArchetypes: missingArchetypes.length ? missingArchetypes : undefined
      });
      selected.push(...filled);

      if (selected.length < 3) {
        const usedIds = new Set(selected.map(s => s.template.id));
        const usedFamilies = new Set(selected.map(s => s.template.familyId));
        for (const item of rankedSeen) {
          if (!usedIds.has(item.template.id) && !usedFamilies.has(item.template.familyId)) {
            selected.push(item);
            usedIds.add(item.template.id);
            usedFamilies.add(item.template.familyId);
            if (selected.length === 3) break;
          }
        }
        if (selected.length < 3) {
          for (const item of rankedSeen) {
            if (!usedIds.has(item.template.id)) {
              selected.push(item);
              usedIds.add(item.template.id);
              if (selected.length === 3) break;
            }
          }
        }
      }
    }

    return {
      candidates: selected,
      unseenCount: unseenEligible.length,
      exhaustionState: "partial",
      exhausted: true
    };
  }

  // Case 3: 0 unseen templates (Total exhaustion)
  const rankedSeen = rankTemplates(eligible, input);
  let trio = selectQualityAwareDiversifiedCandidates(rankedSeen, 3, {
    requirePhoto: input.hasPhoto,
    requiredArchetypes
  });
  if (trio.length < 3) {
    const usedIds = new Set(trio.map(item => item.template.id));
    const usedFamilies = new Set(trio.map(item => item.template.familyId));
    for (const item of rankedSeen) {
      if (!usedIds.has(item.template.id) && !usedFamilies.has(item.template.familyId)) {
        trio.push(item);
        usedIds.add(item.template.id);
        usedFamilies.add(item.template.familyId);
        if (trio.length === 3) break;
      }
    }
    if (trio.length < 3) {
      for (const item of rankedSeen) {
        if (!usedIds.has(item.template.id)) {
          trio.push(item);
          usedIds.add(item.template.id);
          if (trio.length === 3) break;
        }
      }
    }
  }
  return {
    candidates: trio,
    unseenCount: 0,
    exhaustionState: "total",
    exhausted: true
  };
}

export function selectGenerationTemplates(templates:TemplateMeta[],input:TemplateRankInput):RankedTemplate[]{
  const outcome = selectNovelGenerationTemplates(templates, input);
  return outcome.candidates;
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
  } as Record<VisualDirection,string>)[visualDirection],status:"active",launchStatus:"candidate",health:"healthy",photoMode:visualDirection==="photo"?"required":"none",editorialScore:88,maturity:"proven",supportedFormats:F,scriptSupport:ALL_SCRIPTS,headlineCapacity:"medium",bodyCapacity:"medium",feelings:FE(),occasions:O(),markets:M(),excludedMarkets:[],materialWorld:"editorial_luxury",materialCues:["paper grain"],energy:"warm",colorWorld:"ivory",motionProfile:"static_paper",localeStrengths:["en"],printFormatStrength:["portrait-5x7"],...overrides
});

export const bootstrapTemplates:TemplateMeta[]=[
  seed(1,"Luxury Editorial","editorial","Cotton · Foil",{editorialScore:97,photoMode:"none",feelings:FE(.98,.72,.68,.18),markets:M(["US",.91],["GB",.91],["FR",.84]),materialWorld:"editorial_luxury",materialCues:["cotton paper","restrained foil","hairline frame"],energy:"quiet",colorWorld:"ivory",motionProfile:"foil_light",localeStrengths:["en","fr","de","vi"],printFormatStrength:["portrait-5x7","folded-5x7"]}),
  seed(2,"Midnight Lume","midnight","Navy · Foil",{editorialScore:95,photoMode:"none",feelings:FE(.93,.52,.78,.35),markets:M(["US",.88],["KR",.82]),materialWorld:"nocturne_foil",materialCues:["navy stock","gold foil","constellation light"],energy:"cinematic",colorWorld:"navy",motionProfile:"foil_light",localeStrengths:["en","ko","vi"],printFormatStrength:["portrait-5x7","square-5x5"]}),
  seed(3,"Botanical Poise","botanical","Letterpress · Botanical",{editorialScore:96,feelings:FE(.91,.92,.8,.2),markets:M(["FR",.91],["GB",.87],["VN",.82]),materialWorld:"letterpress_tactile",materialCues:["letterpress linework","botanical ink","cotton grain"],energy:"warm",colorWorld:"sage",motionProfile:"pressed_depth",localeStrengths:["en","fr","vi"],printFormatStrength:["portrait-5x7","folded-5x7"]}),
  seed(4,"Washi Elegance","washi","Washi · Ink",{launchStatus:"hold",editorialScore:96,photoMode:"none",feelings:FE(.98,.76,.7,.12),markets:M(["JP",.99]),scriptSupport:["latin","cjk"],materialWorld:"letterpress_tactile",materialCues:["washi fiber","sumi-style ink","restrained metallic rule"],energy:"quiet",colorWorld:"warm",motionProfile:"static_paper",localeStrengths:["ja","en"],printFormatStrength:["portrait-5x7","postcard-6x4"]}),
  seed(5,"Soft Seoul","seoul","Hanji · Soft color",{launchStatus:"hold",editorialScore:94,feelings:FE(.86,.95,.82,.35),markets:M(["KR",.99]),scriptSupport:["latin","hangul"],materialWorld:"quiet_modern",materialCues:["hanji grain","soft color fields","airy paper depth"],energy:"warm",colorWorld:"soft_color",motionProfile:"quiet_plane",localeStrengths:["ko","en"],printFormatStrength:["portrait-5x7","square-5x5"]}),
  seed(6,"Art Deco Noir","deco","Noir · Gold foil",{editorialScore:93,photoMode:"none",feelings:FE(.98,.3,.62,.36),markets:M(["US",.86],["FR",.86]),materialWorld:"nocturne_foil",materialCues:["matte noir","gold foil frame","architectural geometry"],energy:"cinematic",colorWorld:"noir",motionProfile:"foil_light",localeStrengths:["en","fr"],printFormatStrength:["portrait-5x7","folded-5x7"]}),
  seed(7,"Photo Story","photo","Photo · Editorial",{editorialScore:95,photoMode:"required",bodyCapacity:"short",feelings:FE(.84,.94,.9,.45),markets:M(["US",.92],["KR",.88],["VN",.88]),materialWorld:"photo_keepsake",materialCues:["editorial photo window","film grain","paper caption"],energy:"personal",colorWorld:"photo",motionProfile:"photo_palette",localeStrengths:["en","ko","vi"],printFormatStrength:["portrait-5x7","landscape-7x5","postcard-6x4"]}),
  seed(8,"Quiet Minimal","minimal","Uncoated · Minimal",{editorialScore:92,photoMode:"none",feelings:FE(.96,.68,.5,.1),markets:M(["JP",.9],["DE",.88]),materialWorld:"quiet_modern",materialCues:["uncoated paper","blind emboss","negative space"],energy:"quiet",colorWorld:"ivory",motionProfile:"pressed_depth",localeStrengths:["en","ja","de"],printFormatStrength:["portrait-5x7","square-5x5"]}),
  seed(9,"Watercolor Bloom","watercolor","Cold press · Watercolor",{launchStatus:"hold",editorialScore:91,feelings:FE(.75,.95,.96,.32),markets:M(["FR",.86],["VN",.86])}),
  seed(10,"Golden Hour","golden","Retro stock · Sun print",{launchStatus:"hold",editorialScore:88,feelings:FE(.55,.95,.62,.78),markets:M(["US",.84],["VN",.82])}),
  seed(11,"Quiet Noir","quietnoir","Matte black · Blind emboss",{launchStatus:"hold",editorialScore:92,photoMode:"none",feelings:FE(.98,.38,.5,.2),markets:M(["DE",.88],["FR",.86])}),
  seed(12,"Bold Pop","boldpop","Risograph · Graphic",{launchStatus:"hold",editorialScore:86,feelings:FE(.28,.72,.4,.99),occasions:O(.96,.48,.62,.98,.7),markets:M(["US",.9],["KR",.82])}),
  seed(13,"Kawaii Joy","kawaii","Pearl paper · Kawaii",{launchStatus:"hold",editorialScore:87,feelings:FE(.35,.9,.55,.99),occasions:O(.98,.42,.65,.86,.92),markets:M(["JP",.96]),scriptSupport:["latin","cjk"]}),
  seed(14,"Classic Letterpress","letterpress","Cotton rag · Letterpress",{editorialScore:98,photoMode:"none",bodyCapacity:"long",feelings:FE(.99,.92,.72,.08),markets:M(["US",.92],["GB",.94],["FR",.9]),materialWorld:"letterpress_tactile",materialCues:["cotton rag","debossed type","pressed edge"],energy:"tactile",colorWorld:"ivory",motionProfile:"pressed_depth",localeStrengths:["en","fr","vi"],printFormatStrength:["portrait-5x7","folded-5x7"]}),
  seed(15,"Celestial Night","celestial","Navy · Constellation",{launchStatus:"hold",editorialScore:91,photoMode:"none",feelings:FE(.9,.63,.88,.45),markets:M(["US",.86],["KR",.84]),materialWorld:"nocturne_foil",materialCues:["constellation foil","night paper","star point light"],energy:"cinematic",colorWorld:"navy",motionProfile:"foil_light",localeStrengths:["en","ko"],printFormatStrength:["portrait-5x7","square-5x5"]}),
  seed(16,"Little Wonders","gouache","Gouache · Cut paper",{launchStatus:"hold",editorialScore:89,feelings:FE(.58,.96,.55,.92),occasions:O(.9,.35,.72,.75,.99),markets:M(["US",.82],["VN",.8])})
];

export const portfolioV2ExperimentTemplates:TemplateMeta[]=[
  seed(101,"Whispered Type","whispered","Type · Hairline",{status:"active",launchStatus:"experiment",maturity:"new",editorialScore:94,feelings:FE(.98,.82,.86,.18),occasions:O(.62,.92,.92,.72,.35),markets:M(["GLOBAL",.9]),materialWorld:"editorial_luxury",materialCues:["oversized type","hairline rule","soft paper"],energy:"quiet",colorWorld:"ivory",motionProfile:"static_paper",localeStrengths:["en","fr","de"],printFormatStrength:["portrait-5x7"]}),
  seed(102,"Museum Note","museum","Editorial · Rule grid",{status:"active",launchStatus:"experiment",maturity:"new",editorialScore:95,photoMode:"optional",bodyCapacity:"long",feelings:FE(.98,.74,.62,.12),occasions:O(.42,.86,.96,.82,.25),markets:M(["GLOBAL",.9]),materialWorld:"editorial_luxury",materialCues:["museum label grid","archival stock","micro-rule detail"],energy:"quiet",colorWorld:"ivory",motionProfile:"static_paper",localeStrengths:["en","ja","vi"],printFormatStrength:["portrait-5x7","postcard-6x4"]}),
  seed(103,"Monogram Orbit","orbit","Parametric · Personal mark",{status:"active",launchStatus:"experiment",maturity:"new",editorialScore:96,feelings:FE(.92,.78,.82,.52),occasions:O(.94,.94,.62,.94,.45),markets:M(["GLOBAL",.9]),materialWorld:"personal_mark",materialCues:["parametric orbit","personal seal","metallic point"],energy:"personal",colorWorld:"sage",motionProfile:"personal_mark",localeStrengths:["en","vi","ja"],printFormatStrength:["portrait-5x7","square-5x5"]}),
  seed(104,"Ribbon Line","ribbon","Continuous line · Motion",{status:"active",launchStatus:"experiment",maturity:"new",editorialScore:94,feelings:FE(.86,.94,.96,.30),occasions:O(.72,.92,.94,.62,.35),markets:M(["GLOBAL",.9])}),
  seed(105,"Memory Window","memory","Photo fragment · Caption",{status:"active",launchStatus:"experiment",maturity:"new",editorialScore:96,photoMode:"optional",bodyCapacity:"short",feelings:FE(.88,.98,.92,.48),occasions:O(.96,.96,.78,.72,.75),markets:M(["GLOBAL",.9]),materialWorld:"photo_keepsake",materialCues:["layered photo fragment","paper window","caption rail"],energy:"personal",colorWorld:"photo",motionProfile:"photo_palette",localeStrengths:["en","ko","vi"],printFormatStrength:["portrait-5x7","landscape-7x5"]}),
  seed(106,"Type Celebration","typecelebration","Kinetic type · Rule",{status:"active",launchStatus:"experiment",maturity:"new",editorialScore:93,feelings:FE(.55,.78,.48,.96),occasions:O(.99,.52,.58,.99,.68),markets:M(["GLOBAL",.9])}),
  seed(107,"Quiet Seal","seal","Personal seal · Negative space",{status:"active",launchStatus:"experiment",maturity:"new",editorialScore:97,bodyCapacity:"long",feelings:FE(.99,.86,.72,.08),occasions:O(.56,.94,.94,.88,.45),markets:M(["GLOBAL",.9])}),
  seed(108,"Pressed Shadow","pressed","Layered relief · Paper depth",{status:"active",launchStatus:"experiment",maturity:"new",editorialScore:94,feelings:FE(.94,.78,.58,.24),occasions:O(.58,.86,.84,.96,.40),markets:M(["GLOBAL",.9]),materialWorld:"letterpress_tactile",materialCues:["layered relief","pressed paper","directional shadow"],energy:"tactile",colorWorld:"warm",motionProfile:"pressed_depth",localeStrengths:["en","vi"],printFormatStrength:["portrait-5x7","square-5x5"]}),
  seed(109,"Ink Pause","ink","Abstract ink · Pause",{status:"active",launchStatus:"experiment",maturity:"new",editorialScore:95,feelings:FE(.90,.96,.96,.18),occasions:O(.54,.88,.98,.62,.32),markets:M(["GLOBAL",.9])}),
  seed(110,"Petal Geometry","petal","Parametric ellipse · Botanical abstraction",{status:"active",launchStatus:"experiment",maturity:"new",editorialScore:93,feelings:FE(.82,.94,.76,.34),occasions:O(.92,.72,.96,.78,.64),markets:M(["GLOBAL",.9])}),
  seed(111,"Night Ledger","ledger","Nocturne · Coordinate light",{status:"active",launchStatus:"experiment",maturity:"new",editorialScore:97,feelings:FE(.98,.66,.94,.20),occasions:O(.50,.98,.64,.86,.20),markets:M(["GLOBAL",.9]),materialWorld:"nocturne_foil",materialCues:["night ledger grid","coordinate light","restrained foil"],energy:"cinematic",colorWorld:"navy",motionProfile:"foil_light",localeStrengths:["en","fr","ko"],printFormatStrength:["portrait-5x7"]}),
  seed(112,"Soft Fold","softfold","Fold geometry · Quiet plane",{status:"active",launchStatus:"experiment",maturity:"new",editorialScore:94,photoMode:"optional",bodyCapacity:"long",feelings:FE(.96,.90,.70,.12),occasions:O(.56,.82,.98,.94,.36),markets:M(["GLOBAL",.9])})
];

export const portfolioV2AllTemplates=[...bootstrapTemplates,...portfolioV2ExperimentTemplates];

// Step17J visual target: 10 proven 0.4.1 families first, then 6 later concepts.
// This is a review/showroom order only; it NEVER changes launch_status or owner approval.
export const step17jPortfolioSlugs=[
  "luxury-editorial","midnight-lume","botanical-poise","washi-elegance","soft-seoul","art-deco-noir","photo-story","quiet-minimal","classic-letterpress","celestial-night",
  "museum-note","memory-window","whispered-type","night-ledger","pressed-shadow","monogram-orbit"
] as const;
const step17jOrder=new Map<string,number>(step17jPortfolioSlugs.map((slug,index)=>[slug,index]));
export const step17jPortfolioTemplates=portfolioV2AllTemplates.filter(t=>step17jOrder.has(t.slug)).sort((a,b)=>(step17jOrder.get(a.slug)??99)-(step17jOrder.get(b.slug)??99));

// Customer-facing production surfaces remain APPROVED-only. Review/staging can render the
// curated 16-family target (including HOLD/experiment) solely so owner/human review can judge
// the intended gallery before statuses are changed through the immutable approval workflow.
export function step17jShowcaseTemplatesForEnvironment(appEnv:string|undefined){
  const healthy=step17jPortfolioTemplates.filter(t=>t.status==="active"&&t.health==="healthy"&&t.launchStatus!=="retired");
  return appEnv==="production"?healthy.filter(t=>t.launchStatus==="approved"):healthy;
}

// Backward-compatible generic marketing helper. Production is still approved-only; non-prod
// excludes HOLD because this helper is used outside the explicit Step17J owner-review showroom.
export function featuredTemplatesForEnvironment(appEnv:string|undefined){
  const reviewable=portfolioV2AllTemplates.filter(t=>t.status==="active"&&t.health==="healthy"&&t.launchStatus!=="hold"&&t.launchStatus!=="retired");
  return appEnv==="production"?reviewable.filter(t=>t.launchStatus==="approved"):reviewable;
}
export function bootstrapTemplateById(id:string){return bootstrapTemplates.find(t=>t.id===id);}

export type TemplateTextAnchor = "start" | "middle" | "end";
export type TemplateLayoutProfile = {
  anchor: TemplateTextAnchor;
  xPct: number;
  kickerYPct: number;
  headlineYPct: number;
  bodyYPct: number;
  signatureYPct: number;
  headlineWidthPct: number;
  bodyWidthPct: number;
  headlineScale: number;
  bodyScale: number;
  showBorder: boolean;
  showSignatureMark: boolean;
  darkSurface?: boolean;
  photoWindow?: { xPct: number; yPct: number; widthPct: number; heightPct: number };
};

const centeredLayoutProfile: TemplateLayoutProfile = {
  anchor: "middle",
  xPct: 0.5,
  kickerYPct: 0.267,
  headlineYPct: 0.43,
  bodyYPct: 0.59,
  signatureYPct: 0.755,
  headlineWidthPct: 88,
  bodyWidthPct: 90,
  headlineScale: 1,
  bodyScale: 1,
  showBorder: true,
  showSignatureMark: true
};

const layoutProfiles: Record<string, Partial<TemplateLayoutProfile>> = {
  "whispered-type": { anchor: "start", xPct: 0.14, kickerYPct: 0.20, headlineYPct: 0.43, bodyYPct: 0.61, signatureYPct: 0.80, headlineWidthPct: 73, bodyWidthPct: 72, headlineScale: 1.08, showBorder: false, showSignatureMark: false },
  "museum-note": { anchor: "start", xPct: 0.12, kickerYPct: 0.19, headlineYPct: 0.46, bodyYPct: 0.61, signatureYPct: 0.82, headlineWidthPct: 70, bodyWidthPct: 70, headlineScale: 0.92, bodyScale: 0.92, showBorder: false, showSignatureMark: false },
  "monogram-orbit": { anchor: "middle", xPct: 0.5, kickerYPct: 0.16, headlineYPct: 0.61, bodyYPct: 0.70, signatureYPct: 0.82, headlineWidthPct: 78, bodyWidthPct: 75, headlineScale: 0.92, bodyScale: 0.9, showBorder: false, showSignatureMark: false },
  "ribbon-line": { anchor: "start", xPct: 0.14, kickerYPct: 0.23, headlineYPct: 0.55, bodyYPct: 0.68, signatureYPct: 0.82, headlineWidthPct: 76, bodyWidthPct: 74, headlineScale: 0.96, bodyScale: 0.94, showBorder: false, showSignatureMark: false },
  "memory-window": { anchor: "start", xPct: 0.12, kickerYPct: 0.70, headlineYPct: 0.78, bodyYPct: 0.87, signatureYPct: 0.94, headlineWidthPct: 74, bodyWidthPct: 74, headlineScale: 0.78, bodyScale: 0.78, showBorder: false, showSignatureMark: false, photoWindow: { xPct: 0.12, yPct: 0.10, widthPct: 0.68, heightPct: 0.48 } },
  "type-celebration": { anchor: "start", xPct: 0.14, kickerYPct: 0.18, headlineYPct: 0.39, bodyYPct: 0.68, signatureYPct: 0.82, headlineWidthPct: 78, bodyWidthPct: 72, headlineScale: 1.12, bodyScale: 0.94, showBorder: false, showSignatureMark: false },
  "quiet-seal": { anchor: "middle", xPct: 0.5, kickerYPct: 0.19, headlineYPct: 0.49, bodyYPct: 0.61, signatureYPct: 0.77, headlineWidthPct: 76, bodyWidthPct: 72, headlineScale: 0.9, bodyScale: 0.9, showBorder: false, showSignatureMark: false },
  "pressed-shadow": { anchor: "start", xPct: 0.12, kickerYPct: 0.18, headlineYPct: 0.64, bodyYPct: 0.75, signatureYPct: 0.87, headlineWidthPct: 74, bodyWidthPct: 72, headlineScale: 0.94, bodyScale: 0.9, showBorder: false, showSignatureMark: false },
  "ink-pause": { anchor: "start", xPct: 0.14, kickerYPct: 0.19, headlineYPct: 0.56, bodyYPct: 0.68, signatureYPct: 0.82, headlineWidthPct: 77, bodyWidthPct: 74, headlineScale: 0.96, bodyScale: 0.92, showBorder: false, showSignatureMark: false },
  "petal-geometry": { anchor: "start", xPct: 0.14, kickerYPct: 0.21, headlineYPct: 0.54, bodyYPct: 0.67, signatureYPct: 0.81, headlineWidthPct: 70, bodyWidthPct: 70, headlineScale: 0.95, bodyScale: 0.9, showBorder: false, showSignatureMark: false },
  "night-ledger": { anchor: "start", xPct: 0.14, kickerYPct: 0.19, headlineYPct: 0.55, bodyYPct: 0.68, signatureYPct: 0.82, headlineWidthPct: 76, bodyWidthPct: 74, headlineScale: 0.96, bodyScale: 0.9, showBorder: false, showSignatureMark: false, darkSurface: true },
  "soft-fold": { anchor: "start", xPct: 0.14, kickerYPct: 0.19, headlineYPct: 0.45, bodyYPct: 0.58, signatureYPct: 0.82, headlineWidthPct: 70, bodyWidthPct: 70, headlineScale: 0.96, bodyScale: 0.9, showBorder: false, showSignatureMark: false }
};

export function templateLayoutProfile(templateIdOrKey: string): TemplateLayoutProfile {
  return { ...centeredLayoutProfile, ...(layoutProfiles[templateIdOrKey] ?? {}) };
}

export type CanonicalPresentation = {
  templateId: string;
  templateVersionId: string;
  rendererTemplateKey: string;
  name: string;
  material: string;
  visualDirection: VisualDirection;
  archetype: TemplateArchetype;
  layout: TemplateLayoutProfile;
  typographyId: string;
  headlineCapacity: TextCapacity;
  bodyCapacity: TextCapacity;
  scriptSupport: TemplateScript[];
  photoMode: TemplatePhotoMode;
  photoSupported: boolean;
  photoRequired: boolean;
  familyId?: string;
  version: number;
  materialWorld?: TemplateMaterialWorld;
  colorWorld?: TemplateColorWorld;
  motionProfile?: TemplateMotionProfile;
  energy?: TemplateEnergy;
};

export type CanonicalPresentationResolverInput = {
  templateId?: string | null;
  templateVersionId?: string | null;
  visualDirection?: string | null;
  hasPhoto?: boolean;
  locale?: string;
  format?: string;
  catalog?: TemplateMeta[];
  catalogMode?: "development" | "experiment" | "staging" | "production";
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function assertCanonicalTemplateIdentity(input: {
  templateId?: string | null;
  templateVersionId?: string | null;
  visualDirection?: string | null;
}): { templateId: string; templateVersionId: string } {
  if (input.visualDirection && (!input.templateId || !input.templateVersionId)) {
    throw new Error(`invalid_presentation_identity: visualDirection alone ('${input.visualDirection}') is not valid presentation identity; managed templateId and templateVersionId are mandatory`);
  }
  if (!input.templateId && !input.templateVersionId) {
    throw new Error("missing_template_identity: managed templateId and templateVersionId are mandatory");
  }
  if (!input.templateId || !input.templateVersionId) {
    throw new Error(`partial_template_identity_rejected: both templateId (${input.templateId ?? "missing"}) and templateVersionId (${input.templateVersionId ?? "missing"}) are mandatory`);
  }
  if (!UUID_REGEX.test(input.templateId)) {
    throw new Error(`invalid_template_id_format: templateId must be a valid UUID, got '${input.templateId}'`);
  }
  if (!UUID_REGEX.test(input.templateVersionId)) {
    throw new Error(`invalid_template_version_id_format: templateVersionId must be a valid UUID, got '${input.templateVersionId}'`);
  }
  return { templateId: input.templateId, templateVersionId: input.templateVersionId };
}

export function findManagedTemplateByIdAndVersion(
  templateId: string,
  templateVersionId: string,
  catalog: TemplateMeta[] = portfolioV2AllTemplates
): TemplateMeta | undefined {
  return catalog.find(t => t.id === templateId && t.versionId === templateVersionId);
}

export function resolveCanonicalPresentationFromTemplate(
  template: TemplateMeta,
  options: { hasPhoto?: boolean; locale?: string; format?: string } = {}
): CanonicalPresentation {
  const archetype = templateArchetype(template);
  const layout = templateLayoutProfile(template.rendererTemplateKey);
  const photoRequired = template.photoMode === "required";
  const photoSupported = template.photoMode !== "none";

  if (options.hasPhoto === false && photoRequired) {
    throw new Error(`template_photo_required: template '${template.name}' (${template.id}) requires a photo`);
  }
  if (options.hasPhoto === true && !photoSupported) {
    throw new Error(`template_photo_not_supported: template '${template.name}' (${template.id}) does not support photos`);
  }
  if (options.format && !template.supportedFormats.includes(options.format)) {
    throw new Error(`template_format_not_supported: template '${template.name}' (${template.id}) does not support format '${options.format}'`);
  }
  if (options.locale && !template.scriptSupport.includes(scriptForLocale(options.locale))) {
    throw new Error(`template_script_not_supported: template '${template.name}' (${template.id}) does not support script for locale '${options.locale}'`);
  }

  return {
    templateId: template.id,
    templateVersionId: template.versionId,
    rendererTemplateKey: template.rendererTemplateKey,
    name: template.name,
    material: template.material,
    visualDirection: template.visualDirection,
    archetype,
    layout,
    typographyId: "editorial-serif",
    headlineCapacity: template.headlineCapacity,
    bodyCapacity: template.bodyCapacity,
    scriptSupport: [...template.scriptSupport],
    photoMode: template.photoMode,
    photoSupported,
    photoRequired,
    familyId: template.familyId,
    version: template.version,
    materialWorld: template.materialWorld,
    colorWorld: template.colorWorld,
    motionProfile: template.motionProfile,
    energy: template.energy
  };
}

export function resolveCanonicalPresentation(
  input: CanonicalPresentationResolverInput
): CanonicalPresentation {
  const identity = assertCanonicalTemplateIdentity(input);
  const catalog = input.catalog ?? portfolioV2AllTemplates;
  const templateWithId = catalog.find(t => t.id === identity.templateId);
  if (!templateWithId) {
    throw new Error(`template_not_found: templateId '${identity.templateId}' was not found in managed catalog`);
  }
  if (templateWithId.versionId !== identity.templateVersionId) {
    throw new Error(`incompatible_template_version_rejected: template '${identity.templateId}' has active versionId '${templateWithId.versionId}', incompatible with requested '${identity.templateVersionId}'`);
  }
  if (templateWithId.status !== "active" || templateWithId.health !== "healthy" || templateWithId.launchStatus === "retired") {
    throw new Error(`template_not_launchable: template '${identity.templateId}' status='${templateWithId.status}' health='${templateWithId.health}' launchStatus='${templateWithId.launchStatus}'`);
  }
  if (input.catalogMode === "production" && templateWithId.launchStatus !== "approved") {
    throw new Error(`template_not_approved_for_production: template '${identity.templateId}' launchStatus is '${templateWithId.launchStatus}'`);
  }
  return resolveCanonicalPresentationFromTemplate(templateWithId, {
    hasPhoto: input.hasPhoto,
    locale: input.locale,
    format: input.format
  });
}

export const curatedFallbackPresentations: Record<TemplateArchetype, CanonicalPresentation> = {
  editorial: resolveCanonicalPresentationFromTemplate(
    bootstrapTemplates.find(t => t.slug === "luxury-editorial")!
  ),
  midnight: resolveCanonicalPresentationFromTemplate(
    bootstrapTemplates.find(t => t.slug === "midnight-lume")!
  ),
  photo: resolveCanonicalPresentationFromTemplate(
    bootstrapTemplates.find(t => t.slug === "photo-story")!,
    { hasPhoto: true }
  ),
  quiet: resolveCanonicalPresentationFromTemplate(
    bootstrapTemplates.find(t => t.slug === "botanical-poise")!
  )
};

export function resolveCuratedFallbackPresentation(
  slot: TemplateArchetype,
  options: { hasPhoto?: boolean; locale?: string; format?: string } = {}
): CanonicalPresentation {
  const fallback = curatedFallbackPresentations[slot];
  if (!fallback) {
    throw new Error(`unknown_fallback_slot: '${slot}'`);
  }
  const tmpl = bootstrapTemplates.find(t => t.id === fallback.templateId)!;
  return resolveCanonicalPresentationFromTemplate(tmpl, {
    hasPhoto: options.hasPhoto ?? (slot === "photo" ? true : undefined),
    locale: options.locale,
    format: options.format
  });
}

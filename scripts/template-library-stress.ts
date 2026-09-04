import { bootstrapTemplates, buildCreativeCandidatePack, perceptualSimilarity, portfolioV2AllTemplates, rankTemplates, selectGenerationTemplates, surfaceTemplates, type RankedTemplate } from "../packages/templates/src/index.ts";
function ok(v:unknown,msg:string):asserts v{if(!v)throw new Error(msg)}
const base={market:"VN",locale:"vi",format:"portrait-5x7",feeling:"Warm",occasion:"Birthday",hasPhoto:false};
const surface=surfaceTemplates(portfolioV2AllTemplates,{...base,catalogMode:"experiment"});ok(surface.recommended.length===4,"recommended_count");ok(surface.marketPicks.length===4,"market_count");ok(surface.marketPicks.filter(x=>x.marketScore>=.55).length>=1,"vn_market_signal_missing");ok(surface.more.length<=8,"more_count");const ids=[...surface.recommended,...surface.marketPicks,...surface.more].map(x=>x.template.id);ok(ids.length===new Set(ids).size,"surface_duplicate");
ok(!rankTemplates(portfolioV2AllTemplates,{...base,catalogMode:"experiment"}).some(x=>x.template.photoMode==="required"),"photo_required_without_photo");
const pairwiseMax=(items:RankedTemplate[])=>{let max=0;for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++)max=Math.max(max,perceptualSimilarity(items[i],items[j]));return max};
const noPhoto=selectGenerationTemplates(portfolioV2AllTemplates,{...base,catalogMode:"experiment"});ok(noPhoto.length===3,"no_photo_generation_count");ok(new Set(noPhoto.map(x=>x.template.id)).size===3,"no_photo_identity_duplicate");ok(new Set(noPhoto.map(x=>x.template.familyId)).size===3,"no_photo_family_duplicate");ok(pairwiseMax(noPhoto)<=.75,"no_photo_perceptual_clones");
const withPhoto=selectGenerationTemplates(portfolioV2AllTemplates,{...base,hasPhoto:true,catalogMode:"experiment"});ok(withPhoto.length===3,"photo_generation_count");ok(withPhoto[2].template.photoMode==="required","photo_slot_required");ok(pairwiseMax(withPhoto)<=.75,"photo_perceptual_clones");
const families=withPhoto.map(x=>x.template.familyId);ok(families.length===new Set(families).size,"generation_family_duplicate");
const archived=portfolioV2AllTemplates.map((t,i)=>i===0?{...t,status:"archived" as const}:t);ok(!rankTemplates(archived,{...base,catalogMode:"experiment"}).some(x=>x.template.id===portfolioV2AllTemplates[0].id),"archived_ranked");
console.log(JSON.stringify({status:"PASS",catalog:portfolioV2AllTemplates.length,recommended:surface.recommended.map(x=>x.template.name),marketPicks:surface.marketPicks.map(x=>x.template.name),generationNoPhoto:noPhoto.map(x=>x.template.name),generationPhoto:withPhoto.map(x=>x.template.name)},null,2));

// Step 13 creative shortlist contract: 6 strongest diverse candidates + up to 2 high-quality wildcards.
const pack=buildCreativeCandidatePack(portfolioV2AllTemplates,{...base,catalogMode:"experiment"});
ok(pack.fit.length===6,"creative_fit_count");
ok(pack.wildcards.length===2,"creative_wildcard_count");
ok(pack.all.length===8,"creative_pack_count");
ok(new Set(pack.all.map(x=>x.template.id)).size===pack.all.length,"creative_pack_duplicate");
ok(pack.wildcards.every(x=>x.template.editorialScore>=84),"wildcard_quality_floor");
const recent=[{familyId:pack.fit[0].template.familyId,templateId:pack.fit[0].template.id,visualDirection:pack.fit[0].template.visualDirection}];
const withHistory=rankTemplates(portfolioV2AllTemplates,{...base,recentStyles:recent,catalogMode:"experiment"});
const repeated=withHistory.find(x=>x.template.id===pack.fit[0].template.id);ok(repeated&&repeated.components.noveltyPenalty>.9,"recent_style_penalty_missing");ok(repeated.score>0,"novelty_became_hard_exclusion");
console.log(JSON.stringify({step13:{fit:pack.fit.map(x=>x.template.name),wildcards:pack.wildcards.map(x=>x.template.name),recentPenalty:repeated.components.noveltyPenalty}},null,2));

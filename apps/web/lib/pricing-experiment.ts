export type PricingExperimentVariant="control_299"|"test_349";

function fnv1a(value:string){
  let hash=0x811c9dc5;
  for(let i=0;i<value.length;i++){
    hash^=value.charCodeAt(i);
    hash=Math.imul(hash,0x01000193);
  }
  return hash>>>0;
}

// Deterministic assignment helper for a future sticky cohort.
// Feed it a stable anonymous/user ID stored server-side or in a first-party cookie.
// Do not use IP address or locale as the experiment identity.
export function assignPricingVariant(stableId:string):PricingExperimentVariant{
  return fnv1a(`cardelume-price-v1:${stableId}`)%2===0?"control_299":"test_349";
}

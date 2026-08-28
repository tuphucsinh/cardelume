export type BrowserFunnelEvent=
  | "studio_started" | "generation_requested" | "results_viewed" | "direction_selected"
  | "finish_opened" | "checkout_opened" | "checkout_started" | "download_jpg" | "download_pdf" | "share_started" | "refund_requested";

export function trackFunnelEvent(eventType:BrowserFunnelEvent,data:{locale:string;currency?:string;pricingVariant?:string;purchaseKind?:string;direction?:string;photoUsed?:boolean;templateId?:string;templateVersionId?:string;dedupeKey?:string}){
  if(typeof window==="undefined")return;
  void fetch("/api/analytics/funnel",{method:"POST",headers:{"content-type":"application/json"},credentials:"same-origin",keepalive:true,body:JSON.stringify({eventType,...data})}).catch(()=>undefined);
}

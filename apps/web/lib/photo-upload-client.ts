export async function uploadPreparedPhoto(input:{file:File;priceQuote:string;signal?:AbortSignal}){
  const init=await fetch("/api/uploads/photo",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({contentType:input.file.type,sizeBytes:input.file.size,originalName:input.file.name,priceQuote:input.priceQuote}),signal:input.signal});
  const issued=await init.json().catch(()=>null) as {assetId?:string;completionToken?:string;uploadUrl?:string;headers?:Record<string,string>;error?:string}|null;
  if(!init.ok||!issued?.assetId||!issued.completionToken||!issued.uploadUrl)throw new Error(issued?.error??"photo_upload_init_failed");
  const put=await fetch(issued.uploadUrl,{method:"PUT",headers:issued.headers??{"content-type":input.file.type},body:input.file,signal:input.signal});
  if(!put.ok)throw new Error("photo_upload_put_failed");
  const complete=await fetch(`/api/uploads/photo/${encodeURIComponent(issued.assetId)}/complete`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({completionToken:issued.completionToken}),signal:input.signal});
  const ready=await complete.json().catch(()=>null) as {assetId?:string;status?:string;error?:string}|null;
  if(!complete.ok||ready?.status!=="ready"||!ready.assetId)throw new Error(ready?.error??"photo_processing_failed");
  return{assetId:ready.assetId};
}

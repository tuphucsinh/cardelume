import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createPhotoAsset, claimPhotoAssetForProcessing, markPhotoAssetFailed, markPhotoAssetReady } from "@cardelume/db";
import { R2ObjectStorage } from "@cardelume/storage";
import { sanitizePhotoBytes } from "./photo-sanitize";

const ALLOWED_SOURCE_TYPES=new Set(["image/jpeg","image/png","image/webp","image/avif"]);
const MAX_DECLARED_BYTES=10*1024*1024;
const MAX_QUARANTINE_BYTES=12*1024*1024;
let storage:R2ObjectStorage|undefined;
function privateStorage(){return storage??=(new R2ObjectStorage());}
function sha256(value:Uint8Array|string){return createHash("sha256").update(value).digest("hex");}
function safeOriginalName(name?:string|null){return(name??"photo").replace(/[\r\n\\/]/g,"-").slice(0,120);}

export async function issuePhotoUpload(input:{userId:string;contentType:string;sizeBytes:number;originalName?:string|null}){
  if(!ALLOWED_SOURCE_TYPES.has(input.contentType))throw new Error("photo_invalid_type");
  if(!Number.isInteger(input.sizeBytes)||input.sizeBytes<=0||input.sizeBytes>MAX_DECLARED_BYTES)throw new Error("photo_too_large");
  const assetId=randomUUID(),completionToken=randomBytes(32).toString("base64url");
  const quarantineObjectKey=`uploads/quarantine/${input.userId}/${assetId}/source`;
  const cleanObjectKey=`uploads/clean/${input.userId}/${assetId}/photo.jpg`;
  await createPhotoAsset({id:assetId,userId:input.userId,originalName:safeOriginalName(input.originalName),sourceContentType:input.contentType,sourceSizeBytes:input.sizeBytes,quarantineObjectKey,cleanObjectKey,completionTokenHash:sha256(completionToken)});
  const uploadUrl=await privateStorage().signPrivateUpload({key:quarantineObjectKey,contentType:input.contentType,expiresSeconds:120});
  return{assetId,completionToken,uploadUrl,expiresSeconds:120,headers:{"content-type":input.contentType}};
}

function safeFailure(error:unknown){
  const code=error instanceof Error?error.message:"photo_processing_failed";
  const known=new Set(["photo_too_large","photo_invalid_type","photo_too_small","photo_decode_failed","photo_dimensions_invalid","photo_asset_capability_invalid","photo_asset_not_uploadable"]);
  return known.has(code)?code:"photo_processing_failed";
}

export async function completePhotoUpload(input:{userId:string;assetId:string;completionToken:string}){
  const tokenHash=sha256(input.completionToken);
  const claim=await claimPhotoAssetForProcessing({assetId:input.assetId,userId:input.userId,completionTokenHash:tokenHash});
  if(claim.state==="ready")return{assetId:input.assetId,status:"ready" as const,width:claim.row.width,height:claim.row.height};
  const row=claim.row;
  try{
    const head=await privateStorage().headPrivate(row.quarantine_object_key);
    if(!head.contentLength||head.contentLength<=0||head.contentLength>MAX_QUARANTINE_BYTES)throw new Error("photo_too_large");
    if(head.contentType!==row.source_content_type||!ALLOWED_SOURCE_TYPES.has(head.contentType??""))throw new Error("photo_invalid_type");
    const source=await privateStorage().getPrivate(row.quarantine_object_key);
    if(source.bytes.byteLength!==head.contentLength)throw new Error("photo_upload_size_mismatch");
    const clean=await sanitizePhotoBytes(source.bytes);
    const digest=sha256(clean.bytes);
    await privateStorage().putPrivate({key:row.clean_object_key,bytes:clean.bytes,contentType:clean.contentType,metadata:{assetid:input.assetId,sha256:digest,sanitized:"true"}});
    await markPhotoAssetReady({assetId:input.assetId,userId:input.userId,cleanContentType:clean.contentType,cleanSizeBytes:clean.bytes.byteLength,width:clean.width,height:clean.height,sha256:digest});
    // DB is authoritative. Delete quarantine only after READY commits; failure to
    // delete does not invalidate the clean asset and is handled by cleanup.
    await privateStorage().deletePrivate(row.quarantine_object_key).catch(()=>undefined);
    return{assetId:input.assetId,status:"ready" as const,width:clean.width,height:clean.height};
  }catch(error){
    await markPhotoAssetFailed({assetId:input.assetId,userId:input.userId,failureCode:safeFailure(error)}).catch(()=>undefined);
    throw error;
  }
}

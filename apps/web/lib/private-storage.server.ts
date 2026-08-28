import "server-only";
import { R2ObjectStorage } from "@cardelume/storage";

let storage:R2ObjectStorage|undefined;
function privateStorage(){return storage??=(new R2ObjectStorage());}

export async function signRecoveryDownload(input:{
  objectKey:string;
  downloadName?:string|null;
  contentType?:string|null;
  expiresSeconds:number;
}){
  return privateStorage().signPrivateDownload({
    key:input.objectKey,
    downloadName:input.downloadName,
    contentType:input.contentType,
    expiresSeconds:input.expiresSeconds
  });
}

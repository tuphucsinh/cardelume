import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { ObjectStorage, PrivateDownloadInput, PrivatePutInput } from "@cardelume/core";

function required(value:string|undefined,name:string){if(!value)throw new Error(`${name} is required`);return value;}
function safeDownloadName(name:string){return name.replace(/[\r\n"\\/]/g,"-").replace(/[^\p{L}\p{N}._() \-]/gu,"-").slice(0,140)||"cardelume-final";}

export type R2ObjectStorageConfig={accountId:string;accessKeyId:string;secretAccessKey:string;privateBucket:string;keyPrefix?:string;};
export function r2ConfigFromEnv():R2ObjectStorageConfig{return{
  accountId:required(process.env.R2_ACCOUNT_ID,"R2_ACCOUNT_ID"),accessKeyId:required(process.env.R2_ACCESS_KEY_ID,"R2_ACCESS_KEY_ID"),
  secretAccessKey:required(process.env.R2_SECRET_ACCESS_KEY,"R2_SECRET_ACCESS_KEY"),privateBucket:required(process.env.R2_BUCKET_PRIVATE,"R2_BUCKET_PRIVATE"),keyPrefix:(process.env.R2_OBJECT_PREFIX??"").trim().replace(/^\/+|\/+$/g,"")||undefined
};}

export class R2ObjectStorage implements ObjectStorage{
  private readonly client:S3Client;
  constructor(private readonly config:R2ObjectStorageConfig=r2ConfigFromEnv()){
    this.client=new S3Client({region:"auto",endpoint:`https://${config.accountId}.r2.cloudflarestorage.com`,credentials:{accessKeyId:config.accessKeyId,secretAccessKey:config.secretAccessKey}});
  }
  private scopedKey(key:string){const clean=key.replace(/^\/+/,"");return this.config.keyPrefix?`${this.config.keyPrefix}/${clean}`:clean;}
  async putPrivate(input:PrivatePutInput){await this.client.send(new PutObjectCommand({Bucket:this.config.privateBucket,Key:this.scopedKey(input.key),Body:input.bytes,ContentType:input.contentType,CacheControl:input.cacheControl??"private, no-store, max-age=0",Metadata:input.metadata}));}
  async signPrivateUpload(input:{key:string;contentType:string;expiresSeconds?:number}){
    return getSignedUrl(this.client,new PutObjectCommand({Bucket:this.config.privateBucket,Key:this.scopedKey(input.key),ContentType:input.contentType,CacheControl:"private, no-store, max-age=0"}),{expiresIn:Math.max(30,Math.min(300,input.expiresSeconds??120))});
  }
  async headPrivate(key:string){
    const out=await this.client.send(new HeadObjectCommand({Bucket:this.config.privateBucket,Key:this.scopedKey(key)}));
    return{contentLength:out.ContentLength??null,contentType:out.ContentType??null,metadata:out.Metadata??{}};
  }
  async getPrivate(key:string){
    const out=await this.client.send(new GetObjectCommand({Bucket:this.config.privateBucket,Key:this.scopedKey(key)}));
    if(!out.Body)throw new Error("private_object_body_missing");
    const body=out.Body as typeof out.Body & {transformToByteArray:()=>Promise<Uint8Array>};
    if(typeof body.transformToByteArray!=="function")throw new Error("private_object_body_unreadable");
    return{bytes:await body.transformToByteArray(),contentType:out.ContentType??null,contentLength:out.ContentLength??null,metadata:out.Metadata??{}};
  }
  async deletePrivate(key:string){await this.client.send(new DeleteObjectCommand({Bucket:this.config.privateBucket,Key:this.scopedKey(key)}));}
  async signPrivateDownload(input:PrivateDownloadInput){
    const name=safeDownloadName(input.downloadName??"cardelume-final");
    return getSignedUrl(this.client,new GetObjectCommand({Bucket:this.config.privateBucket,Key:this.scopedKey(input.key),ResponseContentDisposition:`attachment; filename="${name}"`,ResponseContentType:input.contentType??undefined}),{expiresIn:input.expiresSeconds});
  }
}

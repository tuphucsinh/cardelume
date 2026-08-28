export type PrivatePutInput={
  key:string;
  bytes:Uint8Array;
  contentType:string;
  cacheControl?:string;
  metadata?:Record<string,string>;
};
export type PrivateDownloadInput={
  key:string;
  expiresSeconds:number;
  downloadName?:string|null;
  contentType?:string|null;
};
export interface ObjectStorage{
  putPrivate(input:PrivatePutInput):Promise<void>;
  signPrivateDownload(input:PrivateDownloadInput):Promise<string>;
}
export interface JobQueue{
  send(name:string,payload:unknown,singletonKey?:string):Promise<string|null>;
}
export interface PaymentProvider{
  createCheckout(input:{
    orderId:string;
    amountMinor:number;
    currency:string;
    successUrl?:string;
    cancelUrl?:string;
    metadata?:Record<string,string>;
  }):Promise<{providerCheckoutId:string;url:string}>;
  verifyWebhook(rawBody:Uint8Array,headers:Headers):Promise<{eventId:string;type:string;data:unknown}>;
}
export interface Renderer{
  renderPreview(input:unknown):Promise<Uint8Array>;
  renderFinal(input:unknown):Promise<{jpg:Uint8Array;pdf:Uint8Array}>;
}
export interface EmailProvider{
  send(input:{to:string;subject:string;text:string}):Promise<void>;
}

export * from "./environment";
export * from "./experiment";

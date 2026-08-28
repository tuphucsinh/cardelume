import sharp from "sharp";

export const PHOTO_MIN_EDGE=480;
export const PHOTO_MAX_CLEAN_EDGE=3000;
export async function sanitizePhotoBytes(bytes:Uint8Array){
  const image=sharp(Buffer.from(bytes),{failOn:"warning",limitInputPixels:40_000_000}).rotate();
  const metadata=await image.metadata().catch(()=>null);
  if(!metadata?.width||!metadata?.height)throw new Error("photo_decode_failed");
  if(Math.min(metadata.width,metadata.height)<PHOTO_MIN_EDGE)throw new Error("photo_too_small");
  const cleanBuffer=await image.resize({width:PHOTO_MAX_CLEAN_EDGE,height:PHOTO_MAX_CLEAN_EDGE,fit:"inside",withoutEnlargement:true,kernel:"lanczos3"})
    .flatten({background:"#ffffff"}).jpeg({quality:92,chromaSubsampling:"4:4:4",progressive:true,mozjpeg:true,force:true}).toBuffer();
  const cleanMeta=await sharp(cleanBuffer).metadata();
  if(!cleanMeta.width||!cleanMeta.height)throw new Error("photo_dimensions_invalid");
  return{bytes:new Uint8Array(cleanBuffer),width:cleanMeta.width,height:cleanMeta.height,contentType:"image/jpeg" as const};
}

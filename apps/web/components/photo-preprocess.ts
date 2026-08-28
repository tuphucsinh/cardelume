export type PreparedPhoto={
  file:File;
  width:number;
  height:number;
  originalBytes:number;
  outputBytes:number;
  resized:boolean;
};

const TARGET_BYTES=950*1024;
const MAX_EDGE=2400;

function canvasToBlob(canvas:HTMLCanvasElement,type:string,quality:number){
  return new Promise<Blob>((resolve,reject)=>{
    canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("photo_encode_failed")),type,quality);
  });
}

async function bitmapFromFile(file:File){
  if(typeof createImageBitmap==="function")return createImageBitmap(file,{imageOrientation:"from-image"});
  const url=URL.createObjectURL(file);
  try{
    const image=await new Promise<HTMLImageElement>((resolve,reject)=>{
      const img=new Image();
      img.onload=()=>resolve(img);
      img.onerror=()=>reject(new Error("photo_decode_failed"));
      img.src=url;
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function preparePhotoForUpload(file:File):Promise<PreparedPhoto>{
  if(file.size>10*1024*1024)throw new Error("photo_too_large");
  if(!["image/jpeg","image/png","image/webp","image/avif"].includes(file.type))throw new Error("photo_invalid_type");

  const bitmap=await bitmapFromFile(file);
  const srcWidth="naturalWidth" in bitmap?bitmap.naturalWidth:bitmap.width;
  const srcHeight="naturalHeight" in bitmap?bitmap.naturalHeight:bitmap.height;
  if(!srcWidth||!srcHeight)throw new Error("photo_dimensions_invalid");

  const scale=Math.min(1,MAX_EDGE/Math.max(srcWidth,srcHeight));
  let width=Math.max(1,Math.round(srcWidth*scale));
  let height=Math.max(1,Math.round(srcHeight*scale));

  const canvas=document.createElement("canvas");
  canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext("2d",{alpha:true});
  if(!ctx)throw new Error("canvas_unavailable");
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality="high";
  ctx.drawImage(bitmap as CanvasImageSource,0,0,width,height);
  if("close" in bitmap && typeof bitmap.close==="function")bitmap.close();

  // WebP keeps alpha and gives a strong size/quality tradeoff for upload/preview.
  // Production still validates, decodes and re-encodes server-side after quarantine.
  let quality=.88;
  let blob=await canvasToBlob(canvas,"image/webp",quality);

  while(blob.size>TARGET_BYTES&&quality>.64){
    quality-=.06;
    blob=await canvasToBlob(canvas,"image/webp",quality);
  }

  // If a very detailed image is still too large, resize once more while
  // preserving enough pixels for a 5×7 / 7×5 card at useful print quality.
  if(blob.size>TARGET_BYTES&&Math.max(width,height)>2100){
    const extra=2100/Math.max(width,height);
    const resized=document.createElement("canvas");
    width=Math.round(width*extra);height=Math.round(height*extra);
    resized.width=width;resized.height=height;
    const rctx=resized.getContext("2d");
    if(!rctx)throw new Error("canvas_unavailable");
    rctx.imageSmoothingEnabled=true;rctx.imageSmoothingQuality="high";
    rctx.drawImage(canvas,0,0,width,height);
    blob=await canvasToBlob(resized,"image/webp",.76);
  }

  const base=(file.name.replace(/\.[^.]+$/,"")||"cardelume-photo").slice(0,80);
  const prepared=new File([blob],`${base}.webp`,{type:"image/webp",lastModified:Date.now()});
  return{
    file:prepared,
    width,height,
    originalBytes:file.size,
    outputBytes:prepared.size,
    resized:scale<1||prepared.size<file.size
  };
}

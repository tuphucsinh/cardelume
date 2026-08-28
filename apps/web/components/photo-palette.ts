export type PhotoPalette = {
  primary: string;
  secondary: string;
  accent: string;
  temperature: "warm" | "cool" | "balanced";
  luminance: number;
  note: string;
  confidence: number;
  softened: boolean;
};

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r,g,b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2,"0")).join("")}`;
}
function luminance(r:number,g:number,b:number){ return (0.2126*r + 0.7152*g + 0.0722*b) / 255; }
function distance(a:number[], b:number[]){ return Math.hypot(a[0]-b[0], a[1]-b[1], a[2]-b[2]); }

async function drawFile(file:File, ctx:CanvasRenderingContext2D){
  if(typeof createImageBitmap === "function"){
    const bitmap=await createImageBitmap(file);
    ctx.drawImage(bitmap,0,0,72,72);
    bitmap.close?.();
    return;
  }
  const url=URL.createObjectURL(file);
  try{
    await new Promise<void>((resolve,reject)=>{
      const image=new Image();
      image.onload=()=>{ctx.drawImage(image,0,0,72,72);resolve();};
      image.onerror=()=>reject(new Error("image_decode_failed"));
      image.src=url;
    });
  } finally { URL.revokeObjectURL(url); }
}

function mix(a:number[],b:number[],t:number){
  return a.map((v,i)=>v*(1-t)+b[i]*t);
}

export async function extractPhotoPalette(file: File): Promise<PhotoPalette> {
  if(file.size > 10 * 1024 * 1024) throw new Error("image_too_large_for_preview");
  const canvas = document.createElement("canvas");
  canvas.width = 72; canvas.height = 72;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("canvas_unavailable");
  await drawFile(file,ctx);
  const data = ctx.getImageData(0,0,72,72).data;

  const buckets = new Map<string,{rgb:[number,number,number],count:number}>();
  let warm=0, cool=0, lumTotal=0, samples=0;
  for(let i=0;i<data.length;i+=16){
    const a=data[i+3]; if(a<180) continue;
    const r=data[i], g=data[i+1], b=data[i+2];
    const lum=luminance(r,g,b);
    if(lum<0.08 || lum>0.94) continue;
    const qr=Math.round(r/32)*32, qg=Math.round(g/32)*32, qb=Math.round(b/32)*32;
    const key=`${qr}-${qg}-${qb}`;
    const bucket=buckets.get(key) || {rgb:[0,0,0] as [number,number,number], count:0};
    bucket.rgb[0]+=r; bucket.rgb[1]+=g; bucket.rgb[2]+=b; bucket.count++;
    buckets.set(key,bucket);
    warm += Math.max(0, r-b); cool += Math.max(0, b-r);
    lumTotal += lum; samples++;
  }

  const ranked=[...buckets.values()].filter(x=>x.count>0)
    .map(x=>({rgb:x.rgb.map(v=>v/x.count) as [number,number,number],count:x.count}))
    .sort((a,b)=>b.count-a.count);
  const fallback:[[number,number,number],[number,number,number],[number,number,number]] = [[185,151,98],[11,23,48],[242,236,224]];
  const chosen:number[][]=[];
  for(const item of ranked){ if(chosen.every(c=>distance(c,item.rgb)>58)) chosen.push(item.rgb); if(chosen.length===3) break; }
  while(chosen.length<3) chosen.push(fallback[chosen.length]);

  const temperature = warm > cool*1.12 ? "warm" : cool > warm*1.12 ? "cool" : "balanced";
  const averageLuminance=samples ? lumTotal/samples : .55;
  const confidence=Math.max(0,Math.min(1,(ranked.length/8)*Math.min(1,samples/220)));
  const softened=confidence<.42 || averageLuminance<.18 || averageLuminance>.82;
  const finalColors=softened
    ? chosen.map((rgb,i)=>mix(rgb,fallback[i]||fallback[0],.34))
    : chosen;
  const note = temperature === "warm" ? "We picked up the warm tones from your photo."
    : temperature === "cool" ? "We used the cooler tones from your photo to shape the palette."
    : "We built a balanced palette from the colors in your photo.";

  return {
    primary: rgbToHex(...finalColors[0] as [number,number,number]),
    secondary: rgbToHex(...finalColors[1] as [number,number,number]),
    accent: rgbToHex(...finalColors[2] as [number,number,number]),
    temperature,
    luminance: averageLuminance,
    note,
    confidence,
    softened
  };
}

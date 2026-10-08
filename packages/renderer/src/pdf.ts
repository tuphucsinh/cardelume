import { getCardFormatSpec, inchesToPoints, type CardFormat } from "./formats.ts";

type PdfObject={id:number;body:Uint8Array};

const encoder=new TextEncoder();
function ascii(value:string){return encoder.encode(value);}
function concat(parts:Uint8Array[]){
  const size=parts.reduce((sum,p)=>sum+p.byteLength,0);
  const out=new Uint8Array(size);let offset=0;
  for(const part of parts){out.set(part,offset);offset+=part.byteLength;}
  return out;
}
function streamObject(dict:string,bytes:Uint8Array){
  return concat([ascii(`${dict}\nstream\n`),bytes,ascii("\nendstream")]);
}
function contentStream(commands:string){
  const bytes=ascii(commands);
  return streamObject(`<< /Length ${bytes.byteLength} >>`,bytes);
}
function imageObject(jpeg:Uint8Array,width:number,height:number){
  return streamObject(
    `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.byteLength} >>`,
    jpeg
  );
}
function buildPdf(objects:PdfObject[],rootId:number,infoId:number){
  const header=new Uint8Array([0x25,0x50,0x44,0x46,0x2d,0x31,0x2e,0x34,0x0a,0x25,0xff,0xff,0xff,0xff,0x0a]);
  const parts:Uint8Array[]=[header];
  const offsets:number[]=[0];
  let offset=header.byteLength;
  for(const obj of objects){
    offsets[obj.id]=offset;
    const prefix=ascii(`${obj.id} 0 obj\n`);
    const suffix=ascii("\nendobj\n");
    parts.push(prefix,obj.body,suffix);
    offset+=prefix.byteLength+obj.body.byteLength+suffix.byteLength;
  }
  const xrefOffset=offset;
  const maxId=Math.max(...objects.map(x=>x.id));
  let xref=`xref\n0 ${maxId+1}\n0000000000 65535 f \n`;
  for(let id=1;id<=maxId;id++){
    const pos=offsets[id]??0;
    xref+=`${String(pos).padStart(10,"0")} 00000 n \n`;
  }
  const trailer=`trailer\n<< /Size ${maxId+1} /Root ${rootId} 0 R /Info ${infoId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  parts.push(ascii(xref),ascii(trailer));
  return concat(parts);
}

export function createPrintPdfFromJpeg(input:{jpeg:Uint8Array;format:CardFormat;pixelWidth:number;pixelHeight:number;bleedPx?:number}){
  const spec=getCardFormatSpec(input.format);
  const dpi=spec.dpi;
  const bleedPx=input.bleedPx??Math.round(spec.bleedIn*dpi);
  // Geometry comes from the declared bleed (exactly 0.125in = 9pt); the raster carries the
  // same allowance rounded to whole pixels and covers the box without distortion.
  const bleedPt=spec.bleedIn*72;
  const expectedW=spec.front.widthPx+2*bleedPx,expectedH=spec.front.heightPx+2*bleedPx;
  if(input.pixelWidth!==expectedW||input.pixelHeight!==expectedH){
    throw new Error(`pdf_source_dimensions_mismatch:${input.pixelWidth}x${input.pixelHeight}`);
  }
  const trimW=inchesToPoints(spec.pdf.widthIn),trimH=inchesToPoints(spec.pdf.heightIn);
  const pageW=trimW+2*bleedPt,pageH=trimH+2*bleedPt;
  const pageBoxes=`/MediaBox [0 0 ${pageW} ${pageH}] /BleedBox [0 0 ${pageW} ${pageH}] /TrimBox [${bleedPt} ${bleedPt} ${bleedPt+trimW} ${bleedPt+trimH}]`;

  if(spec.pdf.layout==="single"){
    const objects:PdfObject[]=[
      {id:1,body:ascii("<< /Type /Catalog /Pages 2 0 R >>")},
      {id:2,body:ascii("<< /Type /Pages /Kids [3 0 R] /Count 1 >>")},
      {id:3,body:ascii(`<< /Type /Page /Parent 2 0 R ${pageBoxes} /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`)},
      {id:4,body:imageObject(input.jpeg,input.pixelWidth,input.pixelHeight)},
      {id:5,body:contentStream(`q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im0 Do\nQ\n`)},
      {id:6,body:ascii(`<< /Producer (CardeLume Renderer 0.4.3 Step 3) /Title (CardeLume print-ready card) /BleedIn ${spec.bleedIn} >>`)}
    ];
    return buildPdf(objects,1,6);
  }

  // Folded 5×7: outside spread is 10×7. The front panel is the right half (its artwork
  // carries the bleed); the left half is intentionally blank (back). Page two is blank inside.
  const panelW=inchesToPoints(spec.front.widthIn);
  const imgW=panelW+2*bleedPt,imgX=trimW-panelW;
  const blank=contentStream("q\nQ\n");
  const objects:PdfObject[]=[
    {id:1,body:ascii("<< /Type /Catalog /Pages 2 0 R >>")},
    {id:2,body:ascii("<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>")},
    {id:3,body:ascii(`<< /Type /Page /Parent 2 0 R ${pageBoxes} /Resources << /XObject << /Im0 5 0 R >> >> /Contents 6 0 R >>`)},
    {id:4,body:ascii(`<< /Type /Page /Parent 2 0 R ${pageBoxes} /Resources << >> /Contents 7 0 R >>`)},
    {id:5,body:imageObject(input.jpeg,input.pixelWidth,input.pixelHeight)},
    {id:6,body:contentStream(`q\n${imgW} 0 0 ${pageH} ${imgX} 0 cm\n/Im0 Do\nQ\n`)},
    {id:7,body:blank},
    {id:8,body:ascii(`<< /Producer (CardeLume Renderer 0.4.3 Step 3) /Title (CardeLume folded 5x7 print-ready card) /BleedIn ${spec.bleedIn} >>`)}
  ];
  return buildPdf(objects,1,8);
}

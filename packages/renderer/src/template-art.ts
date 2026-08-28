export const rendererTemplateIds=[
  "luxury-editorial","midnight-lume","botanical-poise","washi-elegance","soft-seoul","art-deco-noir",
  "photo-story","quiet-minimal","watercolor-bloom","golden-hour","quiet-noir","bold-pop","kawaii-joy",
  "classic-letterpress","celestial-night","little-wonders",
  "whispered-type","museum-note","monogram-orbit","ribbon-line","memory-window","type-celebration",
  "quiet-seal","pressed-shadow","ink-pause","petal-geometry","night-ledger","soft-fold"
] as const;

export type RendererTemplateId=typeof rendererTemplateIds[number];

const allowed=new Set<string>(rendererTemplateIds);
export function assertRendererTemplateId(value:string):asserts value is RendererTemplateId{
  if(!allowed.has(value))throw new Error(`unsupported_template_id:${value}`);
}

function n(value:number){return Math.round(value*100)/100;}
function hash(value:string){let out=2166136261;for(const c of value){out^=c.codePointAt(0)??0;out=Math.imul(out,16777619);}return out>>>0;}

export function templateArtSvg(input:{
  templateId:string;width:number;height:number;scale:number;accent:string;foreground:string;background:string;
}){
  assertRendererTemplateId(input.templateId);
  const {templateId:id,width:w,height:h,scale:s,accent:a,foreground:fg}=input;
  const cx=w/2;
  const sw=Math.max(2,n(2.3*s));
  const thin=Math.max(1,n(1.3*s));
  const circle=(x:number,y:number,r:number,fill="none",stroke=a,opacity=.55)=>
    `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${fill}" stroke="${stroke}" stroke-width="${thin}" opacity="${opacity}"/>`;

  switch(id){
    case "luxury-editorial":
      return `${circle(cx,h*.17,55*s)}<line x1="${n(cx-42*s)}" y1="${n(h*.17)}" x2="${n(cx+42*s)}" y2="${n(h*.17)}" stroke="${a}" stroke-width="${thin}" opacity=".38"/>`;
    case "midnight-lume":
    case "celestial-night":
      return `<line x1="${n(cx)}" y1="${n(h*.075)}" x2="${n(cx)}" y2="${n(h*.275)}" stroke="${a}" stroke-width="${thin}" opacity=".55"/>
        ${circle(cx,h*.17,95*s,"none",a,.42)}
        ${circle(cx-112*s,h*.135,6*s,a,"none",.9)}${circle(cx+105*s,h*.16,5*s,a,"none",.9)}${circle(cx+76*s,h*.225,4*s,a,"none",.8)}${circle(cx-82*s,h*.215,3.5*s,a,"none",.75)}`;
    case "botanical-poise":
    case "watercolor-bloom":
      return `<path d="M ${n(w*.16)} ${n(h*.82)} C ${n(w*.22)} ${n(h*.60)}, ${n(w*.30)} ${n(h*.40)}, ${n(w*.43)} ${n(h*.25)}" fill="none" stroke="${fg}" stroke-width="${thin}" opacity=".42"/>
        <ellipse cx="${n(w*.26)}" cy="${n(h*.61)}" rx="${n(70*s)}" ry="${n(28*s)}" fill="${a}" opacity=".13" transform="rotate(-24 ${n(w*.26)} ${n(h*.61)})"/>
        <ellipse cx="${n(w*.39)}" cy="${n(h*.38)}" rx="${n(55*s)}" ry="${n(24*s)}" fill="${a}" opacity=".17" transform="rotate(21 ${n(w*.39)} ${n(h*.38)})"/>
        <ellipse cx="${n(w*.83)}" cy="${n(h*.16)}" rx="${n(145*s)}" ry="${n(80*s)}" fill="${a}" opacity=".10"/>`;
    case "washi-elegance":
      return `<circle cx="${n(w*.83)}" cy="${n(h*.17)}" r="${n(118*s)}" fill="${a}" opacity=".13"/>
        <line x1="${n(w*.18)}" y1="${n(h*.91)}" x2="${n(w*.48)}" y2="${n(h*.25)}" stroke="${fg}" stroke-width="${thin}" opacity=".34"/>
        <line x1="${n(w*.195)}" y1="${n(h*.91)}" x2="${n(w*.495)}" y2="${n(h*.25)}" stroke="${a}" stroke-width="${thin}" opacity=".18"/>`;
    case "soft-seoul":
      return `<path d="M ${n(w*.54)} ${n(h*.13)} C ${n(w*.74)} ${n(h*.07)}, ${n(w*.96)} ${n(h*.11)}, ${n(w*1.02)} ${n(h*.24)} C ${n(w*.91)} ${n(h*.33)}, ${n(w*.68)} ${n(h*.30)}, ${n(w*.54)} ${n(h*.13)} Z" fill="${a}" opacity=".16"/>
        <path d="M ${n(-w*.08)} ${n(h*.69)} C ${n(w*.10)} ${n(h*.61)}, ${n(w*.32)} ${n(h*.67)}, ${n(w*.37)} ${n(h*.82)} C ${n(w*.19)} ${n(h*.91)}, ${n(w*.02)} ${n(h*.90)}, ${n(-w*.08)} ${n(h*.69)} Z" fill="#8aa293" opacity=".13"/>`;
    case "art-deco-noir":
      return `<rect x="${n(w*.10)}" y="${n(h*.08)}" width="${n(w*.80)}" height="${n(h*.84)}" fill="none" stroke="${a}" stroke-width="${sw}" opacity=".62"/>
        <path d="M ${n(w*.31)} ${n(h*.22)} H ${n(w*.69)} M ${n(w*.31)} ${n(h*.78)} H ${n(w*.69)}" stroke="${a}" stroke-width="${thin}" opacity=".58"/>
        <path d="M ${n(cx)} ${n(h*.13)} l ${n(24*s)} ${n(28*s)} l ${n(-24*s)} ${n(28*s)} l ${n(-24*s)} ${n(-28*s)} Z" fill="none" stroke="${a}" stroke-width="${thin}" opacity=".58"/>`;
    case "quiet-noir":
      return `<rect x="${n(w*.11)}" y="${n(h*.09)}" width="${n(w*.78)}" height="${n(h*.82)}" rx="${n(7*s)}" fill="none" stroke="${a}" stroke-width="${thin}" opacity=".40"/>
        <line x1="${n(w*.39)}" y1="${n(h*.21)}" x2="${n(w*.61)}" y2="${n(h*.21)}" stroke="${a}" stroke-width="${thin}" opacity=".5"/>`;
    case "photo-story": return "";
    case "quiet-minimal":
      return `${circle(cx,h*.16,29*s,"none",fg,.25)}<line x1="${n(cx-20*s)}" y1="${n(h*.16)}" x2="${n(cx+20*s)}" y2="${n(h*.16)}" stroke="${a}" stroke-width="${thin}" opacity=".38"/>`;
    case "golden-hour":
      return `<circle cx="${n(cx)}" cy="${n(h*.15)}" r="${n(102*s)}" fill="#ce7d55" opacity=".82"/>
        <path d="M 0 ${n(h*.77)} L ${n(w*.28)} ${n(h*.66)} L ${n(w*.50)} ${n(h*.79)} L ${n(w*.73)} ${n(h*.64)} L ${w} ${n(h*.75)} L ${w} ${h} L 0 ${h} Z" fill="#806b50" opacity=".55"/>
        <path d="M 0 ${n(h*.84)} L ${n(w*.35)} ${n(h*.74)} L ${n(w*.63)} ${n(h*.86)} L ${w} ${n(h*.78)} L ${w} ${h} L 0 ${h} Z" fill="#544d3d" opacity=".44"/>`;
    case "bold-pop":
      return `<circle cx="${n(w*.91)}" cy="${n(h*.14)}" r="${n(105*s)}" fill="#e85d52" opacity=".92"/>
        <rect x="${n(-38*s)}" y="${n(h*.68)}" width="${n(132*s)}" height="${n(260*s)}" rx="${n(18*s)}" fill="#507db7" opacity=".88" transform="rotate(14 ${n(28*s)} ${n(h*.80)})"/>
        <circle cx="${n(w*.80)}" cy="${n(h*.80)}" r="${n(34*s)}" fill="${a}" opacity=".7"/>`;
    case "kawaii-joy":
      return `<circle cx="${n(w*.17)}" cy="${n(h*.15)}" r="${n(64*s)}" fill="#ffffff" opacity=".84"/>
        <circle cx="${n(w*.81)}" cy="${n(h*.22)}" r="${n(53*s)}" fill="#e2d7a9" opacity=".82"/>
        <path d="M ${n(w*.22)} ${n(h*.78)} q ${n(36*s)} ${n(-46*s)} ${n(72*s)} 0 q ${n(36*s)} ${n(46*s)} ${n(72*s)} 0" fill="none" stroke="${a}" stroke-width="${sw}" opacity=".48"/>`;
    case "classic-letterpress":
      return `<rect x="${n(w*.11)}" y="${n(h*.085)}" width="${n(w*.78)}" height="${n(h*.83)}" rx="${n(4*s)}" fill="none" stroke="${fg}" stroke-width="${thin}" opacity=".23"/>
        <path d="M ${n(cx)} ${n(h*.145)} c ${n(-28*s)} ${n(-32*s)} ${n(-68*s)} ${n(-2*s)} 0 ${n(55*s)} c ${n(68*s)} ${n(-57*s)} ${n(28*s)} ${n(-87*s)} 0 ${n(-55*s)} Z" fill="none" stroke="${a}" stroke-width="${thin}" opacity=".55"/>`;
    case "little-wonders":
      return `<path d="M ${n(w*.60)} ${n(h*.09)} C ${n(w*.78)} ${n(h*.06)}, ${n(w*.98)} ${n(h*.13)}, ${n(w*1.02)} ${n(h*.25)} C ${n(w*.90)} ${n(h*.33)}, ${n(w*.70)} ${n(h*.29)}, ${n(w*.60)} ${n(h*.09)} Z" fill="#c9836e" opacity=".72"/>
        <ellipse cx="${n(w*.02)}" cy="${n(h*.79)}" rx="${n(w*.27)}" ry="${n(h*.13)}" fill="#7f9a84" opacity=".70"/>
        <circle cx="${n(w*.82)}" cy="${n(h*.80)}" r="${n(42*s)}" fill="${a}" opacity=".35"/>`;
    case "whispered-type":
      return `<line x1="${n(w*.10)}" y1="${n(h*.51)}" x2="${n(w*.57)}" y2="${n(h*.51)}" stroke="${a}" stroke-width="${thin}" opacity=".5"/><circle cx="${n(w*.82)}" cy="${n(h*.18)}" r="${n(19*s)}" fill="none" stroke="${fg}" stroke-width="${thin}" opacity=".16"/>`;
    case "museum-note":
      return `<rect x="${n(w*.08)}" y="${n(h*.08)}" width="${n(w*.84)}" height="${n(h*.84)}" fill="none" stroke="${fg}" stroke-width="${thin}" opacity=".18"/><line x1="${n(w*.08)}" y1="${n(h*.27)}" x2="${n(w*.92)}" y2="${n(h*.27)}" stroke="${a}" stroke-width="${thin}" opacity=".34"/><line x1="${n(w*.69)}" y1="${n(h*.08)}" x2="${n(w*.69)}" y2="${n(h*.27)}" stroke="${fg}" stroke-width="${thin}" opacity=".18"/>`;
    case "monogram-orbit": {
      const seed=hash(id);const ox=cx+((seed>>>6)%60-30)*s,oy=h*.31;const r1=150*s,r2=220*s;
      let dots="";for(let i=0;i<5;i++){const angle=((seed>>>(i*3))%360)*Math.PI/180,rr=i%2?r2:r1;dots+=`<circle cx="${n(ox+Math.cos(angle)*rr)}" cy="${n(oy+Math.sin(angle)*rr)}" r="${n((5+i)*s)}" fill="${a}" opacity="${n(.4+i*.07)}"/>`;}
      return `${circle(ox,oy,r1,"none",a,.42)}${circle(ox,oy,r2,"none",fg,.13)}${dots}<line x1="${n(ox-36*s)}" y1="${n(oy)}" x2="${n(ox+36*s)}" y2="${n(oy)}" stroke="${a}" stroke-width="${thin}" opacity=".4"/>`;
    }
    case "ribbon-line":
      return `<path d="M ${n(-w*.08)} ${n(h*.37)} C ${n(w*.15)} ${n(h*.18)}, ${n(w*.31)} ${n(h*.60)}, ${n(w*.52)} ${n(h*.37)} S ${n(w*.84)} ${n(h*.16)}, ${n(w*1.08)} ${n(h*.42)}" fill="none" stroke="${a}" stroke-width="${n(12*s)}" stroke-linecap="round" opacity=".25"/><path d="M ${n(-w*.08)} ${n(h*.38)} C ${n(w*.15)} ${n(h*.20)}, ${n(w*.31)} ${n(h*.62)}, ${n(w*.52)} ${n(h*.39)} S ${n(w*.84)} ${n(h*.18)}, ${n(w*1.08)} ${n(h*.44)}" fill="none" stroke="${fg}" stroke-width="${thin}" opacity=".13"/>`;
    case "memory-window":
      return `<rect x="${n(w*.12)}" y="${n(h*.10)}" width="${n(w*.68)}" height="${n(h*.48)}" rx="${n(8*s)}" fill="${fg}" opacity=".055"/><rect x="${n(w*.135)}" y="${n(h*.115)}" width="${n(w*.65)}" height="${n(h*.45)}" rx="${n(5*s)}" fill="none" stroke="${a}" stroke-width="${thin}" stroke-dasharray="${n(8*s)} ${n(11*s)}" opacity=".32"/><line x1="${n(w*.84)}" y1="${n(h*.12)}" x2="${n(w*.84)}" y2="${n(h*.55)}" stroke="${a}" stroke-width="${thin}" opacity=".28"/>`;
    case "type-celebration":
      return `<line x1="${n(w*.14)}" y1="${n(h*.58)}" x2="${n(w*.84)}" y2="${n(h*.58)}" stroke="${a}" stroke-width="${sw}" opacity=".5"/><rect x="${n(w*.74)}" y="${n(h*.16)}" width="${n(52*s)}" height="${n(8*s)}" rx="${n(4*s)}" fill="${a}" opacity=".45" transform="rotate(-8 ${n(w*.74)} ${n(h*.16)})"/>`;
    case "quiet-seal":
      return `${circle(cx,h*.27,53*s,"none",a,.6)}${circle(cx,h*.27,42*s,"none",fg,.15)}<line x1="${n(cx-20*s)}" y1="${n(h*.27)}" x2="${n(cx+20*s)}" y2="${n(h*.27)}" stroke="${a}" stroke-width="${thin}" opacity=".35"/>`;
    case "pressed-shadow":
      return `<rect x="${n(w*.17)}" y="${n(h*.19)}" width="${n(w*.66)}" height="${n(h*.43)}" rx="${n(16*s)}" fill="${a}" opacity=".075" transform="rotate(-4 ${n(cx)} ${n(h*.40)})"/><rect x="${n(w*.22)}" y="${n(h*.22)}" width="${n(w*.60)}" height="${n(h*.42)}" rx="${n(15*s)}" fill="${fg}" opacity=".045" transform="rotate(3 ${n(cx)} ${n(h*.42)})"/>`;
    case "ink-pause":
      return `<path d="M ${n(w*.10)} ${n(h*.34)} C ${n(w*.28)} ${n(h*.25)}, ${n(w*.52)} ${n(h*.45)}, ${n(w*.89)} ${n(h*.29)}" fill="none" stroke="${a}" stroke-width="${n(42*s)}" stroke-linecap="round" opacity=".15"/><path d="M ${n(w*.12)} ${n(h*.35)} C ${n(w*.30)} ${n(h*.28)}, ${n(w*.57)} ${n(h*.42)}, ${n(w*.86)} ${n(h*.30)}" fill="none" stroke="${fg}" stroke-width="${n(5*s)}" stroke-linecap="round" opacity=".14"/>`;
    case "petal-geometry": {
      let petals="";for(let i=0;i<7;i++){const angle=i*(180/7)-45;petals+=`<ellipse cx="${n(w*.77)}" cy="${n(h*.28)}" rx="${n(55*s)}" ry="${n(120*s)}" fill="none" stroke="${i%2?a:fg}" stroke-width="${i%2?sw:thin}" opacity="${i%2?.28:.12}" transform="rotate(${n(angle)} ${n(w*.77)} ${n(h*.28)})"/>`;}
      return petals;
    }
    case "night-ledger":
      return `<path d="M ${n(w*.10)} ${n(h*.40)} C ${n(w*.34)} ${n(h*.36)}, ${n(w*.59)} ${n(h*.45)}, ${n(w*.90)} ${n(h*.39)}" fill="none" stroke="${a}" stroke-width="${thin}" opacity=".46"/>${[.14,.28,.42,.56,.70,.84].map((x,i)=>`<circle cx="${n(w*x)}" cy="${n(h*(.18+(i%3)*.05))}" r="${n((i%3===0?5:2.5)*s)}" fill="${a}" opacity="${n(.34+i*.05)}"/>`).join("")}`;
    case "soft-fold":
      return `<path d="M 0 ${n(h*.20)} L ${n(w*.74)} ${n(h*.12)} L ${w} ${n(h*.33)} L ${w} ${n(h*.66)} L ${n(w*.34)} ${n(h*.73)} L 0 ${n(h*.56)} Z" fill="${a}" opacity=".065"/><path d="M ${n(w*.34)} ${n(h*.73)} L ${n(w*.58)} ${n(h*.34)} L ${w} ${n(h*.33)}" fill="none" stroke="${fg}" stroke-width="${thin}" opacity=".10"/><path d="M ${n(w*.58)} ${n(h*.34)} L ${n(w*.74)} ${n(h*.12)}" fill="none" stroke="${a}" stroke-width="${sw}" opacity=".28"/>`;
  }
}

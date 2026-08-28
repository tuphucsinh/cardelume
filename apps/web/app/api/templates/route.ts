import { NextResponse } from "next/server";
import { z } from "zod";
import { listManagedTemplates, listRecentStyleFingerprints } from "@cardelume/db";
import { portfolioV2AllTemplates, surfaceTemplates, templateArchetype } from "@cardelume/templates";
import { normalizeMarket } from "../../../lib/pricing";
import { issueTemplateEventToken, type TemplateEventSource } from "../../../lib/template-event-token.server";
import { anonymousIdFromCookieHeader } from "../../../lib/pricing-quote.server";
export const runtime="nodejs";export const dynamic="force-dynamic";
const Query=z.object({occasion:z.string().min(1).max(80),feeling:z.string().min(1).max(80),format:z.string().min(1).max(40),locale:z.string().min(2).max(20),hasPhoto:z.enum(["0","1"]),bodyPressure:z.coerce.number().min(0).max(8).optional()});
export async function GET(req:Request){
 const url=new URL(req.url);const parsed=Query.safeParse(Object.fromEntries(url.searchParams));if(!parsed.success)return NextResponse.json({error:"template_query_invalid"},{status:400});
 const anonymousId=anonymousIdFromCookieHeader(req.headers.get("cookie"));if(!anonymousId)return NextResponse.json({error:"anonymous_session_required"},{status:401,headers:{"cache-control":"no-store"}});
 const market=normalizeMarket((process.env.APP_MODE==="mock"?url.searchParams.get("market"):null)??req.headers.get("cf-ipcountry")??req.headers.get("x-vercel-ip-country")??req.headers.get("x-country-code"));
 let catalog;try{catalog=await listManagedTemplates();if(!catalog.length){if(process.env.APP_MODE==="mock")catalog=portfolioV2AllTemplates;else return NextResponse.json({error:"template_catalog_unavailable"},{status:503,headers:{"cache-control":"no-store"}});}}catch{if(process.env.APP_MODE==="mock")catalog=portfolioV2AllTemplates;else return NextResponse.json({error:"template_catalog_unavailable"},{status:503,headers:{"cache-control":"no-store"}});}
 const recentStyles=await listRecentStyleFingerprints({userId:anonymousId,limit:5}).then(rows=>rows.map(row=>({...row,accentMode:row.accentMode??undefined}))).catch(()=>[]);
 const surface=surfaceTemplates(catalog,{...parsed.data,market,hasPhoto:parsed.data.hasPhoto==="1",recentStyles});
 const expose=(item:typeof surface.recommended[number],source:TemplateEventSource,position:number)=>({id:item.template.id,versionId:item.template.versionId,name:item.template.name,material:item.template.material,visualDirection:item.template.visualDirection,photoMode:item.template.photoMode,source,position,marketMatch:item.marketScore>=.55,archetype:templateArchetype(item.template),eventToken:issueTemplateEventToken({templateId:item.template.id,templateVersionId:item.template.versionId,source,rankPosition:position,market,locale:parsed.data.locale,anonymousId})});
 const marketSpecificCount=surface.marketPicks.filter(x=>x.marketScore>=.55).length;
 return NextResponse.json({market,marketSpecificCount,recommended:surface.recommended.map((x,i)=>expose(x,"recommended",i+1)),marketPicks:surface.marketPicks.map((x,i)=>expose(x,"market_pick",i+1)),more:surface.more.map((x,i)=>expose(x,"show_more",i+1))},{headers:{"cache-control":"private, max-age=15"}});
}

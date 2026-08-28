import { createHmac, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { recordFunnelEvent } from "@cardelume/db";
import { anonymousIdFromCookieHeader } from "../../../../lib/pricing-quote.server";
import { normalizeMarket } from "../../../../lib/pricing";
import { checkUserRateLimit } from "../../../../lib/rate-limit.server";

export const dynamic="force-dynamic";
export const runtime="nodejs";

const BrowserEvent=z.enum(["studio_started","generation_requested","results_viewed","direction_selected","finish_opened","checkout_opened","checkout_started","download_jpg","download_pdf","share_started","refund_requested"]);
const Body=z.object({
  eventType:BrowserEvent,
  locale:z.string().min(2).max(20),
  currency:z.string().min(3).max(8).optional(),
  pricingVariant:z.string().max(40).optional(),
  purchaseKind:z.string().max(32).optional(),
  direction:z.string().max(48).optional(),
  photoUsed:z.boolean().optional(),
  templateId:z.string().uuid().optional(),
  templateVersionId:z.string().uuid().optional(),
  dedupeKey:z.string().max(120).optional()
});

function pseudonymKey(){const key=process.env.ANALYTICS_PSEUDONYM_KEY??"";if(process.env.NODE_ENV==="production"&&key.length<32)throw new Error("analytics_pseudonym_key_invalid");return key||"cardelume-dev-analytics-pseudonym-key-not-for-production";}
function subjectHash(anon:string){return createHmac("sha256",pseudonymKey()).update(`cardelume-funnel-v1|${anon}`).digest("hex");}

export async function POST(req:Request){
  const parsed=Body.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"funnel_event_invalid"},{status:400});
  const anon=anonymousIdFromCookieHeader(req.headers.get("cookie"));if(!anon||!z.string().uuid().safeParse(anon).success)return NextResponse.json({error:"anonymous_session_required"},{status:401});
  const rate=await checkUserRateLimit("analytics",anon).catch(()=>null);if(!rate)return NextResponse.json({error:"analytics_unavailable"},{status:503});if(!rate.allowed)return NextResponse.json({error:"rate_limited"},{status:429,headers:{"retry-after":String(rate.retryAfterSeconds)}});
  const market=normalizeMarket(req.headers.get("cf-ipcountry")??req.headers.get("x-vercel-ip-country")??req.headers.get("x-country-code"));
  try{
    await recordFunnelEvent({eventId:randomUUID(),subjectHash:subjectHash(anon),eventType:parsed.data.eventType,source:"web",market,locale:parsed.data.locale,currency:parsed.data.currency,pricingVariant:parsed.data.pricingVariant,purchaseKind:parsed.data.purchaseKind,direction:parsed.data.direction,photoUsed:parsed.data.photoUsed,templateId:parsed.data.templateId,templateVersionId:parsed.data.templateVersionId,dedupeKey:parsed.data.dedupeKey?`${subjectHash(anon).slice(0,16)}:${parsed.data.dedupeKey}`:undefined});
    return NextResponse.json({ok:true},{headers:{"cache-control":"no-store"}});
  }catch{return NextResponse.json({error:"analytics_unavailable"},{status:503});}
}

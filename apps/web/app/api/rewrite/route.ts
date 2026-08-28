import { NextResponse } from "next/server";
import { z } from "zod";
import { createAIProviderFromEnv } from "@cardelume/ai";
import { anonymousIdFromCookieHeader } from "../../../lib/pricing-quote.server";
import { checkUserRateLimit } from "../../../lib/rate-limit.server";

export const runtime="nodejs";export const dynamic="force-dynamic";
const Input=z.object({
  mode:z.enum(["warmer","playful"]),
  message:z.string().trim().min(1).max(420),
  locale:z.string().min(2).max(20),
  occasion:z.string().min(1).max(80),
  relationship:z.string().min(1).max(80),
  recipient:z.string().max(120).optional()
});
const Output=z.object({text:z.string().trim().min(1).max(420)});
const MARKUP=/<\/?(?:script|style|svg|iframe|object|embed)\b/i;

export async function POST(req:Request){
  if(process.env.APP_MODE!=="live")return NextResponse.json({error:"rewrite_live_mode_required"},{status:503,headers:{"cache-control":"no-store"}});
  const parsed=Input.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"rewrite_input_invalid"},{status:400,headers:{"cache-control":"no-store"}});
  const anon=z.string().uuid().safeParse(anonymousIdFromCookieHeader(req.headers.get("cookie")));
  if(!anon.success)return NextResponse.json({error:"anonymous_session_required"},{status:401,headers:{"cache-control":"no-store"}});
  try{
    const rate=await checkUserRateLimit("rewrite",anon.data);
    if(!rate.allowed)return NextResponse.json({error:"rate_limited"},{status:429,headers:{"retry-after":String(rate.retryAfterSeconds),"cache-control":"no-store"}});
    const provider=createAIProviderFromEnv();
    const {mode,message,locale,occasion,relationship,recipient}=parsed.data;
    const system=`You are CardeLume's bounded copy finisher. Rewrite only the supplied greeting-card message. Preserve every factual claim, name, relationship, event and intended meaning. Never invent memories, promises, dates, achievements, health claims or personal facts. Do not add emojis, hashtags, markdown or markup. Keep the same language and roughly the same length. ${mode==="warmer"?"Make it warmer, more human and emotionally specific without becoming sentimental or clichéd.":"Make it lighter and more playful without becoming childish, loud or generic."} Return JSON only: {"text":"..."}.`;
    const prompt=JSON.stringify({task:"bounded_message_rewrite",mode,locale,occasion,relationship,recipient:recipient??null,message});
    if(new TextEncoder().encode(prompt).byteLength>3000)return NextResponse.json({error:"rewrite_input_too_large"},{status:413});
    const response=await provider.generateJson({system,prompt,timeoutMs:8000});
    const out=Output.safeParse(response.data);
    if(!out.success||MARKUP.test(out.data.text))throw new Error("rewrite_output_invalid");
    console.info(JSON.stringify({level:"info",event:"bounded_copy_rewrite",mode,provider:response.provider,model:response.model,latencyMs:response.latencyMs,inputTokens:response.usage?.inputTokens,outputTokens:response.usage?.outputTokens}));
    return NextResponse.json({text:out.data.text},{headers:{"cache-control":"no-store"}});
  }catch{
    return NextResponse.json({error:"rewrite_unavailable"},{status:503,headers:{"cache-control":"no-store"}});
  }
}

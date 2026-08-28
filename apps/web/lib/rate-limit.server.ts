import "server-only";
import { consumeRateLimit, type RateLimitResult } from "@cardelume/db";
import { securityEvent } from "./security-log.server";

type Kind="generation"|"photo_upload"|"checkout"|"template_events"|"rewrite"|"analytics";
function intEnv(name:string,fallback:number){const n=Number(process.env[name]??fallback);return Number.isFinite(n)&&n>0?Math.floor(n):fallback;}
const configs:Record<Kind,{env:string;fallback:number}>={
  generation:{env:"GENERATION_RATE_LIMIT_PER_HOUR",fallback:12},
  photo_upload:{env:"PHOTO_UPLOAD_RATE_LIMIT_PER_HOUR",fallback:8},
  checkout:{env:"CHECKOUT_RATE_LIMIT_PER_HOUR",fallback:12},
  template_events:{env:"TEMPLATE_EVENT_RATE_LIMIT_PER_HOUR",fallback:120},
  rewrite:{env:"REWRITE_RATE_LIMIT_PER_HOUR",fallback:30},
  analytics:{env:"ANALYTICS_EVENT_RATE_LIMIT_PER_HOUR",fallback:240}
};
export async function checkUserRateLimit(kind:Kind,userId:string):Promise<RateLimitResult>{
  const c=configs[kind];const result=await consumeRateLimit({bucketKey:kind,subjectKey:`anon:${userId}`,limit:intEnv(c.env,c.fallback),windowSeconds:3600});
  if(!result.allowed)securityEvent("rate_limit_enforced",{kind,retryAfterSeconds:result.retryAfterSeconds});
  return result;
}

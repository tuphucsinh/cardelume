import type { AppEnvironment } from "./environment";

export type FeatureFlagDefinition={
  key:string;
  description:string;
  defaultEnabled:false;
  allowedEnvironments:Array<Exclude<AppEnvironment,"production">|"production">;
  allowlist?:string[];
  rolloutPercent?:number;
  owner:string;
  expiresAt:string;
  killSwitchKey:string;
  experimentId?:string;
};

export type FeatureFlagContext={appEnv:AppEnvironment;subjectId?:string;allowlistValue?:string;env?:Record<string,string|undefined>};
function bool(v:string|undefined){return ["1","true","yes","on"].includes((v??"").trim().toLowerCase());}
function stablePercent(value:string){let h=2166136261;for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0)%100;}

export function isFeatureEnabled(flag:FeatureFlagDefinition,ctx:FeatureFlagContext){
  const env=ctx.env??process.env;
  if(flag.defaultEnabled!==false)throw new Error("new_feature_flags_must_default_off");
  if(!flag.allowedEnvironments.includes(ctx.appEnv))return false;
  if(bool(env.EXPERIMENT_KILL_SWITCH)||bool(env[flag.killSwitchKey]))return false;
  if(flag.expiresAt&&Date.now()>Date.parse(flag.expiresAt))return false;
  if(!bool(env[`FEATURE_${flag.key.toUpperCase().replace(/[^A-Z0-9]+/g,"_")}`]))return false;
  if(flag.allowlist?.length){if(!ctx.allowlistValue||!flag.allowlist.includes(ctx.allowlistValue))return false;}
  const pct=Math.max(0,Math.min(100,flag.rolloutPercent??100));
  if(pct>=100)return true;if(pct<=0||!ctx.subjectId)return false;
  return stablePercent(`${flag.key}:${ctx.subjectId}`)<pct;
}

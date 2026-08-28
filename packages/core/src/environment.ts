export const APP_ENVIRONMENTS=["development","experiment","staging","production"] as const;
export type AppEnvironment=(typeof APP_ENVIRONMENTS)[number];
export type EnvLike=Record<string,string|undefined>;

export type EnvironmentValidation={
  ok:boolean;
  appEnv:AppEnvironment|null;
  errors:string[];
  warnings:string[];
};

function clean(value:string|undefined){return (value??"").trim();}
function isAppEnvironment(value:string):value is AppEnvironment{return (APP_ENVIRONMENTS as readonly string[]).includes(value);}
function bool(value:string|undefined){return ["1","true","yes","on"].includes(clean(value).toLowerCase());}

export function getExplicitAppEnvironment(env:EnvLike=process.env):AppEnvironment{
  const value=clean(env.APP_ENV);
  if(!isAppEnvironment(value))throw new Error("APP_ENV_required_explicit_environment");
  return value;
}

function requireExactScope(env:EnvLike,key:string,appEnv:AppEnvironment,errors:string[]){
  const value=clean(env[key]);
  if(!value)errors.push(`${key}_required`);
  else if(value!==appEnv)errors.push(`${key}_must_equal_${appEnv}`);
}

export function validateEnvironmentIsolation(env:EnvLike=process.env):EnvironmentValidation{
  const errors:string[]=[],warnings:string[]=[];
  const raw=clean(env.APP_ENV);
  if(!isAppEnvironment(raw))return{ok:false,appEnv:null,errors:["APP_ENV_required_explicit_environment"],warnings};
  const appEnv=raw;
  const dodo=clean(env.DODO_PAYMENTS_ENVIRONMENT);

  if(appEnv==="production"){
    if(clean(env.APP_MODE)!=="live")errors.push("APP_MODE_must_be_live_in_production");
    if(dodo!=="live_mode")errors.push("DODO_PAYMENTS_ENVIRONMENT_must_be_live_mode_in_production");
    requireExactScope(env,"DATABASE_SCOPE",appEnv,errors);
    requireExactScope(env,"R2_SCOPE",appEnv,errors);
    requireExactScope(env,"ANALYTICS_SCOPE",appEnv,errors);
    requireExactScope(env,"RECOVERY_SECRET_SCOPE",appEnv,errors);
    requireExactScope(env,"AI_BUDGET_SCOPE",appEnv,errors);
    if(clean(env.EXPERIMENT_ID))errors.push("EXPERIMENT_ID_forbidden_in_production");
  } else if(appEnv==="experiment"||appEnv==="staging"){
    if(clean(env.APP_MODE)!=="live")errors.push(`APP_MODE_must_be_live_in_${appEnv}`);
    if(dodo!=="test_mode")errors.push(`DODO_PAYMENTS_ENVIRONMENT_must_be_test_mode_in_${appEnv}`);
    requireExactScope(env,"DATABASE_SCOPE",appEnv,errors);
    requireExactScope(env,"R2_SCOPE",appEnv,errors);
    requireExactScope(env,"ANALYTICS_SCOPE",appEnv,errors);
    requireExactScope(env,"RECOVERY_SECRET_SCOPE",appEnv,errors);
    requireExactScope(env,"AI_BUDGET_SCOPE",appEnv,errors);
    requireExactScope(env,"CLOUDFLARE_HOST_SCOPE",appEnv,errors);
    const prefix=clean(env.R2_OBJECT_PREFIX).replace(/^\/+/,"");
    if(!prefix)errors.push("R2_OBJECT_PREFIX_required_for_nonproduction");
    else if(!prefix.startsWith(`${appEnv}/`))errors.push(`R2_OBJECT_PREFIX_must_start_${appEnv}/`);
    const analytics=clean(env.ANALYTICS_NAMESPACE);
    if(!analytics)errors.push("ANALYTICS_NAMESPACE_required_for_nonproduction");
    else if(!analytics.toLowerCase().includes(appEnv))errors.push(`ANALYTICS_NAMESPACE_must_identify_${appEnv}`);
    if(appEnv==="experiment"&&!clean(env.EXPERIMENT_ID))errors.push("EXPERIMENT_ID_required_in_experiment");
    if(appEnv==="staging"&&clean(env.EXPERIMENT_ID)&&!bool(env.ALLOW_STAGING_EXPERIMENT_ID))warnings.push("staging_has_experiment_id");
    if(bool(env.ALLOW_PRODUCTION_WRITES))errors.push("ALLOW_PRODUCTION_WRITES_forbidden_in_nonproduction");
  } else {
    // Development can run without external services, but if live mode is used we
    // still refuse live-money checkout and accidental production-write override.
    if(dodo&&dodo!=="test_mode")errors.push("DODO_PAYMENTS_ENVIRONMENT_must_be_test_mode_in_development");
    if(bool(env.ALLOW_PRODUCTION_WRITES))errors.push("ALLOW_PRODUCTION_WRITES_forbidden_in_development");
  }

  if(appEnv!=="production"&&clean(env.PRODUCTION_DATABASE_URL)&&clean(env.DATABASE_URL)===clean(env.PRODUCTION_DATABASE_URL))errors.push("nonproduction_database_matches_production_guard");
  if(appEnv!=="production"&&clean(env.PRODUCTION_R2_BUCKET_PRIVATE)&&clean(env.R2_BUCKET_PRIVATE)===clean(env.PRODUCTION_R2_BUCKET_PRIVATE)&&!clean(env.R2_OBJECT_PREFIX))errors.push("nonproduction_r2_matches_production_without_prefix");

  return{ok:errors.length===0,appEnv,errors:[...new Set(errors)].sort(),warnings:[...new Set(warnings)].sort()};
}

export function assertEnvironmentIsolation(env:EnvLike=process.env):AppEnvironment{
  const result=validateEnvironmentIsolation(env);
  if(!result.ok)throw new Error(`environment_isolation_invalid:${result.errors.join(",")}`);
  return result.appEnv!;
}

export function assertPaymentEnvironmentForApp(env:EnvLike=process.env){
  const appEnv=getExplicitAppEnvironment(env),dodo=clean(env.DODO_PAYMENTS_ENVIRONMENT);
  if(appEnv==="production"&&dodo!=="live_mode")throw new Error("production_payment_requires_live_mode");
  if(appEnv!=="production"&&dodo&&dodo!=="test_mode")throw new Error("nonproduction_payment_requires_test_mode");
  return{appEnv,dodo};
}

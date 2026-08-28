import { assertEnvironmentIsolation, validateEnvironmentIsolation } from "../packages/core/src/environment.ts";
import { isFeatureEnabled, type FeatureFlagDefinition } from "../packages/core/src/experiment.ts";

function need(condition:unknown,message:string){if(!condition)throw new Error(message);}
const production={APP_ENV:"production",APP_MODE:"live",DATABASE_SCOPE:"production",R2_SCOPE:"production",ANALYTICS_SCOPE:"production",RECOVERY_SECRET_SCOPE:"production",AI_BUDGET_SCOPE:"production",DODO_PAYMENTS_ENVIRONMENT:"live_mode"};
need(validateEnvironmentIsolation(production).ok,"valid production environment rejected");
need(!validateEnvironmentIsolation({...production,DODO_PAYMENTS_ENVIRONMENT:"test_mode"}).ok,"production test payments accepted");
need(!validateEnvironmentIsolation({...production,EXPERIMENT_ID:"x"}).ok,"production experiment id accepted");

const experiment={APP_ENV:"experiment",APP_MODE:"live",EXPERIMENT_ID:"exp-1",DATABASE_SCOPE:"experiment",R2_SCOPE:"experiment",R2_OBJECT_PREFIX:"experiment/exp-1",ANALYTICS_SCOPE:"experiment",ANALYTICS_NAMESPACE:"cardelume-experiment-exp-1",RECOVERY_SECRET_SCOPE:"experiment",AI_BUDGET_SCOPE:"experiment",CLOUDFLARE_HOST_SCOPE:"experiment",DODO_PAYMENTS_ENVIRONMENT:"test_mode"};
need(validateEnvironmentIsolation(experiment).ok,"valid experiment environment rejected");
need(!validateEnvironmentIsolation({...experiment,DODO_PAYMENTS_ENVIRONMENT:"live_mode"}).ok,"experiment live payments accepted");
need(!validateEnvironmentIsolation({...experiment,R2_OBJECT_PREFIX:"production/cards"}).ok,"experiment production R2 prefix accepted");
need(!validateEnvironmentIsolation({...experiment,DATABASE_URL:"same",PRODUCTION_DATABASE_URL:"same"}).ok,"experiment production DB guard accepted");
need(!validateEnvironmentIsolation({...experiment,ALLOW_PRODUCTION_WRITES:"true"}).ok,"nonproduction production-write override accepted");

const staging={...experiment,APP_ENV:"staging",EXPERIMENT_ID:"",DATABASE_SCOPE:"staging",R2_SCOPE:"staging",R2_OBJECT_PREFIX:"staging/cardelume",ANALYTICS_SCOPE:"staging",ANALYTICS_NAMESPACE:"cardelume-staging",RECOVERY_SECRET_SCOPE:"staging",AI_BUDGET_SCOPE:"staging",CLOUDFLARE_HOST_SCOPE:"staging"};
need(validateEnvironmentIsolation(staging).ok,"valid staging environment rejected");
need(!validateEnvironmentIsolation({...staging,DODO_PAYMENTS_ENVIRONMENT:"live_mode"}).ok,"staging live payments accepted");
let threw=false;try{assertEnvironmentIsolation({});}catch{threw=true;}need(threw,"missing APP_ENV did not fail");

const flag:FeatureFlagDefinition={key:"studio_concept",description:"test",defaultEnabled:false,allowedEnvironments:["experiment","staging"],owner:"Lumer",expiresAt:new Date(Date.now()+86400000).toISOString(),killSwitchKey:"KILL_STUDIO_CONCEPT",rolloutPercent:100};
need(!isFeatureEnabled(flag,{appEnv:"experiment",subjectId:"u1",env:{}}),"flag enabled without explicit env toggle");
need(isFeatureEnabled(flag,{appEnv:"experiment",subjectId:"u1",env:{FEATURE_STUDIO_CONCEPT:"true"}}),"flag failed explicit enable");
need(!isFeatureEnabled(flag,{appEnv:"production",subjectId:"u1",env:{FEATURE_STUDIO_CONCEPT:"true"}}),"experiment flag leaked to production");
need(!isFeatureEnabled(flag,{appEnv:"experiment",subjectId:"u1",env:{FEATURE_STUDIO_CONCEPT:"true",KILL_STUDIO_CONCEPT:"true"}}),"per-flag kill switch failed");
need(!isFeatureEnabled(flag,{appEnv:"experiment",subjectId:"u1",env:{FEATURE_STUDIO_CONCEPT:"true",EXPERIMENT_KILL_SWITCH:"true"}}),"global kill switch failed");

console.log(JSON.stringify({status:"PASS",environmentIdentity:true,paymentModeGuard:true,nonprodScopes:true,productionDbGuard:true,featureDefaultOff:true,killSwitch:true}));

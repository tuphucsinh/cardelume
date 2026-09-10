import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildGenerationBrief } from "../apps/web/lib/generation-client.ts";
import { getMessages } from "../apps/web/i18n/messages.ts";
import { launchCopy } from "../apps/web/i18n/launch-copy.ts";

function main(){
  const custom=buildGenerationBrief({
    occasion:"Other",customOccasion:"Graduation",recipient:"Minh",relationship:"Someone else",customRelation:"Teacher",
    feeling:"Custom",customFeeling:"quietly proud",detail:"A small note",format:"postcard-6x4",locale:"vi",hasPhoto:true
  });
  assert.deepEqual({occasion:custom.occasion,relationship:custom.relationship,feeling:custom.feeling,locale:custom.locale,format:custom.format},
    {occasion:"Graduation",relationship:"Teacher",feeling:"quietly proud",locale:"vi",format:"postcard-6x4"});
  assert.throws(()=>buildGenerationBrief({occasion:"Other",customOccasion:"",relationship:"Someone else",customRelation:"Teacher",feeling:"Custom",customFeeling:"quiet",format:"portrait-5x7",locale:"en",hasPhoto:false}),/custom_occasion_required/);
  assert.throws(()=>buildGenerationBrief({occasion:"Birthday",relationship:"Someone else",customRelation:"",feeling:"Custom",customFeeling:"quiet",format:"portrait-5x7",locale:"en",hasPhoto:false}),/custom_relationship_required/);
  assert.throws(()=>buildGenerationBrief({occasion:"Birthday",relationship:"Friend",feeling:"Custom",customFeeling:"",format:"portrait-5x7",locale:"en",hasPhoto:false}),/custom_feeling_required/);
  assert.equal(getMessages("en").studio.feelings.Custom,"Describe the feeling");
  assert.equal(getMessages("vi").studio.feelings.Custom,"Tự mô tả cảm giác");
  assert.equal(launchCopy("en").customFeelingPlaceholder,"e.g., quietly proud, nostalgic…");
  assert.equal(launchCopy("vi").customFeelingPlaceholder,"Ví dụ: bình yên, tự hào…");

  const studio=readFileSync("apps/web/components/card-studio.tsx","utf8");
  const messages=readFileSync("apps/web/i18n/messages.ts","utf8");
  const launch=readFileSync("apps/web/i18n/launch-copy.ts","utf8");
  assert.match(studio,/buildGenerationBrief\(/,"studio_uses_shared_brief_builder");
  assert.match(studio,/required=\{occasion==="Other"\}/,"custom_occasion_required_ui");
  assert.match(studio,/required=\{relation==="Someone else"\}/,"custom_relation_required_ui");
  assert.match(studio,/required=\{feeling==="Custom"\}/,"custom_feeling_required_ui");
  assert.match(studio,/locale,\n\s+hasPhoto/,"locale_is_request_field");
  assert.match(messages,/feelings:\{[^\n]*Custom/,"custom_feeling_is_localized");
  assert.match(launch,/customFeelingPlaceholder/,"custom_feeling_placeholder_exists");
  console.log("I18N_CUSTOM_BRIEF=PASS");
  console.log("I18N_LOCALE_REQUEST_PARITY=PASS");
  console.log("I18N_CUSTOM_VALIDATION=PASS");
  console.log("CORRECTIVE_I18N=PASS");
}

main();

import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { isCurrentGenerationRequest } from "../apps/web/lib/generation-client.ts";

const studioPath = new URL("../apps/web/components/card-studio.tsx", import.meta.url);
const studio = readFileSync(studioPath, "utf8");

function need(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

type Direction = {
  id: "editorial" | "midnight" | "photo";
  templateId: string;
  templateVersionId: string;
  headline: string;
  body: string;
  kicker: string;
  customerRationale: string;
  presentation: { templateId: string; templateVersionId: string; visualDirection: string };
  occasion: string;
  recipient: string;
  detail: string;
  accentMode: "original" | "navy" | "sage" | "rose";
};

type SelectedDirection = Direction & { explicitBody?: string };

function choose(direction: Direction): SelectedDirection {
  assert.equal(direction.presentation.templateId, direction.templateId, "presentation templateId drifted before Choose");
  assert.equal(direction.presentation.templateVersionId, direction.templateVersionId, "presentation version drifted before Choose");
  return { ...direction };
}

function finish(selected: SelectedDirection) {
  return {
    templateId: selected.templateId,
    templateVersionId: selected.templateVersionId,
    headline: selected.headline,
    body: selected.explicitBody ?? selected.body,
    kicker: selected.kicker,
    customerRationale: selected.customerRationale,
    presentation: selected.presentation,
    accentMode: selected.accentMode,
    occasion: selected.occasion,
    recipient: selected.recipient,
    detail: selected.detail,
  };
}

function editBody(selected: SelectedDirection, body: string): SelectedDirection {
  return { ...selected, explicitBody: body };
}

function undoBody(selected: SelectedDirection): SelectedDirection {
  const { explicitBody: _discarded, ...canonical } = selected;
  return canonical;
}

const directions: Direction[] = [
  {
    id: "editorial",
    templateId: "11111111-1111-4111-8111-111111111111",
    templateVersionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    headline: "For Mai, with a little more room to breathe",
    body: "For the graduation day you built one patient step at a time.",
    kicker: "A NOTE FOR MAI",
    customerRationale: "The restrained editorial frame gives her achievement room to land.",
    presentation: { templateId: "11111111-1111-4111-8111-111111111111", templateVersionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", visualDirection: "editorial" },
    occasion: "Graduation",
    recipient: "Mai",
    detail: "the blue notebook she carried through school",
    accentMode: "original",
  },
  {
    id: "midnight",
    templateId: "22222222-2222-4222-8222-222222222222",
    templateVersionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    headline: "A bright beginning, held close",
    body: "For the new baby who has already changed the shape of your days.",
    kicker: "WELCOME, LITTLE ONE",
    customerRationale: "A deeper palette makes the new-baby welcome feel intimate rather than generic.",
    presentation: { templateId: "22222222-2222-4222-8222-222222222222", templateVersionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", visualDirection: "midnight" },
    occasion: "New Baby",
    recipient: "Linh",
    detail: "the first photo beside the window",
    accentMode: "navy",
  },
  {
    id: "photo",
    templateId: "33333333-3333-4333-8333-333333333333",
    templateVersionId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    headline: "A softer day for you, An",
    body: "Wishing you a gentle recovery and small moments that feel lighter.",
    kicker: "FOR YOUR RECOVERY",
    customerRationale: "The photo-led keepsake keeps the personal detail visible while the copy stays gentle.",
    presentation: { templateId: "33333333-3333-4333-8333-333333333333", templateVersionId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", visualDirection: "photo" },
    occasion: "Get Well",
    recipient: "An",
    detail: "the jasmine tea waiting by the bed",
    accentMode: "sage",
  },
];

function assertCanonicalEquality(label: string, selected: SelectedDirection) {
  const output = finish(selected);
  assert.equal(output.templateId, selected.templateId, `${label}: templateId changed`);
  assert.equal(output.templateVersionId, selected.templateVersionId, `${label}: templateVersionId changed`);
  assert.equal(output.headline, selected.headline, `${label}: headline changed`);
  assert.equal(output.kicker, selected.kicker, `${label}: kicker changed`);
  assert.equal(output.customerRationale, selected.customerRationale, `${label}: customer rationale changed`);
  assert.deepEqual(output.presentation, selected.presentation, `${label}: presentation identity changed`);
  assert.equal(output.occasion, selected.occasion, `${label}: occasion changed`);
  assert.equal(output.recipient, selected.recipient, `${label}: recipient changed`);
  assert.equal(output.detail, selected.detail, `${label}: detail changed`);
  return output;
}

function main() {
  need(studio.includes("type SelectedDirection=Direction &"), "complete_selected_direction_type_missing");
  for (const field of ["templateId", "templateVersionId", "kicker", "headline", "body", "customerRationale", "presentation"]) {
    need(studio.includes(`${field}:`), `selected_direction_${field}_missing`);
  }
  need(studio.includes("setSelected(next)"), "choose_does_not_store_complete_selected_direction");
  need(studio.includes("setMessage(explicitMessage??next.body)"), "choose_does_not_start_from_selected_direction_body");
  need(studio.includes("if(direction.presentation.templateId!==direction.templateId||direction.presentation.templateVersionId!==direction.templateVersionId)"), "choose_identity_mismatch_not_fail_closed");
  need(studio.includes("customerRationale:selected.customerRationale"), "export_drops_customer_rationale");
  need(studio.includes("selectionEpoch.current!==sourceSelectionEpoch"), "stale_async_edit_can_overwrite_reselected_direction");
  need(studio.includes("isCurrentGenerationRequest(requestId,generationRequestId.current,controller.signal)"), "stale_generation_guard_missing");
  need(!studio.includes("setMessage(detail||next)"), "raw_detail_still_overrides_selected_direction_body");
  need(!studio.includes("generatedSelected?.headline"), "finish_rederives_headline_from_generated_result");
  need(!studio.includes("generatedSelected?.kicker"), "finish_rederives_kicker_from_generated_result");
  need(!studio.includes("direction.id===\"midnight\"?m.copy.midnightBody"), "choose_keeps_static_slot_body_fallback");
  console.log("SOURCE_STATE_AUTHORITY=PASS");

  const first = choose(directions[0]);
  const firstFinish = assertCanonicalEquality("live/editorial", first);
  assert.equal(firstFinish.body, directions[0].body, "live direction body changed at Finish");

  const second = choose(directions[1]);
  const secondFinish = assertCanonicalEquality("recovery/midnight", second);
  assert.notEqual(secondFinish.templateId, firstFinish.templateId, "switch did not change selected template identity");
  assert.notEqual(secondFinish.body, firstFinish.body, "switch collapsed direction copy");

  const third = choose(directions[2]);
  const thirdFinish = assertCanonicalEquality("fallback/photo", third);
  assert.equal(thirdFinish.occasion, "Get Well", "custom occasion was lost");
  assert.equal(thirdFinish.recipient, "An", "personalized recipient was lost");
  assert.equal(thirdFinish.detail, "the jasmine tea waiting by the bed", "personal detail was lost");
  console.log("LIVE_AND_RECOVERY_DIRECTION_SELECTION=PASS");

  const edited = editBody(third, "An, I changed this message myself.");
  const editedExport = finish(edited);
  assert.equal(editedExport.body, "An, I changed this message myself.", "explicit Finish edit was not exported");
  assert.equal(editedExport.headline, third.headline, "explicit body edit changed headline");
  assert.deepEqual(editedExport.presentation, third.presentation, "explicit body edit changed presentation");
  const undone = finish(undoBody(edited));
  assert.equal(undone.body, third.body, "undo did not restore canonical selected body");
  assert.equal(undone.templateVersionId, third.templateVersionId, "undo changed template version");
  console.log("EXPLICIT_EDIT_AND_UNDO=PASS");

  assert.equal(isCurrentGenerationRequest(7, 6), false, "stale generation request was accepted");
  assert.equal(isCurrentGenerationRequest(7, 7), true, "current generation request was rejected");
  const aborted = new AbortController();
  aborted.abort();
  assert.equal(isCurrentGenerationRequest(7, 7, aborted.signal), false, "aborted generation request was accepted");
  console.log("STALE_ASYNC_RESULT_GUARD=PASS");
  console.log("CORRECTIVE_DIRECTION_STATE=PASS");
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}

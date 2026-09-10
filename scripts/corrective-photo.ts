import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { portfolioV2AllTemplates, resolveCanonicalPresentation, type TemplateMeta } from "../packages/templates/src/index.ts";

function need(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function first(mode: TemplateMeta["photoMode"]): TemplateMeta {
  const template = portfolioV2AllTemplates.find(item => item.photoMode === mode && item.status === "active" && item.health === "healthy");
  if (!template) throw new Error(`photo_fixture_missing:${mode}`);
  return template;
}
function rejects(fn: () => unknown, code: string) {
  assert.throws(fn, new RegExp(code));
}

const required = first("required");
const optional = first("optional");
const none = first("none");
const common = { locale: "en-US", format: "portrait-5x7" };

const requiredWithPhoto = resolveCanonicalPresentation({ templateId: required.id, templateVersionId: required.versionId, hasPhoto: true, ...common });
need(requiredWithPhoto.photoRequired && requiredWithPhoto.photoSupported, "required_photo_contract_missing");
rejects(() => resolveCanonicalPresentation({ templateId: required.id, templateVersionId: required.versionId, hasPhoto: false, ...common }), "template_photo_required");

const optionalWithPhoto = resolveCanonicalPresentation({ templateId: optional.id, templateVersionId: optional.versionId, hasPhoto: true, ...common });
const optionalWithoutPhoto = resolveCanonicalPresentation({ templateId: optional.id, templateVersionId: optional.versionId, hasPhoto: false, ...common });
need(optionalWithPhoto.photoSupported && optionalWithoutPhoto.photoSupported && !optionalWithPhoto.photoRequired, "optional_photo_contract_invalid");

rejects(() => resolveCanonicalPresentation({ templateId: none.id, templateVersionId: none.versionId, hasPhoto: true, ...common }), "template_photo_not_supported");
need(resolveCanonicalPresentation({ templateId: none.id, templateVersionId: none.versionId, hasPhoto: false, ...common }).photoMode === "none", "no_photo_contract_invalid");
console.log("PHOTO_MODE_MATRIX=PASS");

const route = readFileSync("apps/web/app/api/generate/[jobId]/route.ts", "utf8");
need(!route.includes("curatedFallbackPresentations"), "photo_route_silent_curated_substitution");
need(route.includes("generation_presentation_invalid") && route.includes("generation_result_invalid"), "photo_route_missing_fail_closed_error");
need(route.includes("direction.presentation.rendererTemplateKey!==presentation.rendererTemplateKey"), "photo_route_client_presentation_not_revalidated");
console.log("SERVER_PRESENTATION_FAIL_CLOSED=PASS");

const studio = readFileSync("apps/web/components/card-studio.tsx", "utf8");
need(studio.includes("invalidatesSelectedPhoto"), "photo_remove_selected_invalidation_missing");
need(studio.includes("invalidatesGeneratedPhoto"), "photo_remove_generated_invalidation_missing");
need(studio.includes("setGeneratedResult(null);setSelected(initialSelected)"), "photo_remove_does_not_clear_stale_selection");
need(studio.includes("setPhotoAssetId(null)"), "photo_remove_asset_state_not_cleared");
console.log("PHOTO_REMOVE_SELECTION_BEHAVIOR=PASS");
console.log("CORRECTIVE_PHOTO=PASS");
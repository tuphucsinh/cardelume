import type { CanonicalPresentation, CardDocument } from "@cardelume/card-schema";
import { renderProductionFinal, type RenderAssets } from "@cardelume/renderer";

export async function renderBetaExportArtifact(input: {
  document: CardDocument;
  assets?: RenderAssets;
  presentation?: CanonicalPresentation;
}) {
  return renderProductionFinal(input.document, {
    assets: input.assets,
    presentation: input.presentation
  });
}

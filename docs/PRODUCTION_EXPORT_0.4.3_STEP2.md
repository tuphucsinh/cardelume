# CardeLume 0.4.3 Step 2 — Production JPG/PDF Export

## Scope

This step implements the paid-final export boundary required by the CardeLume roadmap:

```text
authoritative PAID order
  → final_render job
  → selected CardDocument version
  → deterministic CardeLume renderer
  → 300-DPI JPG + print-sized PDF
  → private R2
  → idempotent download_entitlements
  → secure recovery/download from Step 1
```

## DONE

### Renderer

- Five launch formats have deterministic physical-size specs.
- JPG front export is 300 DPI:
  - Portrait 5×7: 1500×2100 px
  - Folded 5×7 front: 1500×2100 px
  - Square 5×5: 1500×1500 px
  - Landscape 7×5: 2100×1500 px
  - Postcard 6×4: 1800×1200 px
- Folded 5×7 PDF is a 10×7 outside spread plus blank inside spread.
- JPG encoder uses high-quality 4:4:4 JPEG and writes 300-DPI metadata.
- PDF is deterministic and uses exact physical MediaBox dimensions.
- Renderer accepts only allowlisted CardeLume template IDs.
- All text entering SVG is XML escaped.
- No raw user/AI HTML/SVG/CSS/JS/external URL is emitted.
- Photo Story fails closed unless a trusted in-memory raster asset is supplied.
- Preview path retains watermark; paid final path is clean.

### Worker / entitlement

- `final_render` now parses a typed payload.
- It skips work if both JPG/PDF entitlements already exist.
- It loads only an authoritative paid order item + selected CardDocument version.
- Final object keys are deterministic per order item/version/renderer.
- JPG/PDF are uploaded to private storage.
- PAID status is re-checked inside the entitlement transaction immediately before entitlement visibility.
- Entitlement creation is idempotent by `orderItemId:assetKind`.

### Minimal platform-boundary cleanup

Small, high-leverage changes only:

- `orders.product_key` and `orders.locale` own commerce metadata needed by recovery.
- `order_items` separates commerce items from CardeLume card-domain internals.
- private object storage interface is product-neutral.
- queue payload has a small `{productKey, resourceId, jobId}` identity boundary.

CardDocument, CardRenderer, templates and Studio remain CardeLume-specific.

## NOT DONE

- Real user-photo persistence → trusted renderer asset mapping is not implemented yet.
- Live Dodo adapter/webhook is still an external integration gap.
- Full generation queue/provider is still not wired.
- Long-message soft overflow UX is intentionally the next reliability step; Step 2 fails closed instead of shrinking text indefinitely.

## Validation

The repository includes `scripts/renderer-export-stress.ts` for installed-dependency validation. It checks all five formats, JPEG dimensions/DPI, PDF MediaBox, deterministic output, XML escaping and trusted-photo enforcement.

Actual render samples produced during artifact QA were also inspected with ImageMagick/pdf tooling and matched launch dimensions.

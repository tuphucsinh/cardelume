# CardeLume 0.4.3 Step 7 — Trusted Photo Upload + Private Asset Binding

## DONE

- Browser photo preprocessing remains UX/bandwidth optimization only.
- Live upload initialization requires the current signed single-card pricing quote, binding the request to the server-issued anonymous session capability.
- Browser receives a short-lived presigned PUT only for a server-selected private R2 quarantine key.
- Completion uses a separate 256-bit capability token; only its SHA-256 hash is stored.
- Server checks object Content-Type/length before decoding.
- Server decodes and normalizes JPEG/PNG/WebP/AVIF with Sharp, applies EXIF orientation, strips metadata by re-encoding, flattens to JPEG, and caps the clean edge at 3000px.
- Tiny/malformed assets fail closed.
- Clean object metadata includes a server-computed SHA-256.
- Checkout persists `photoAssetId` as an opaque UUID only. It never accepts R2 keys from the browser.
- The checkout transaction verifies READY + ownership and binds the asset to the exact `card_versions.id` in `card_asset_bindings`.
- Paid final worker resolves assets through that binding, loads the private clean object, verifies byte length/content type/SHA-256, and only then passes bytes to the renderer.
- Cleanup marks DB rows deleted only after R2 delete calls succeed; bound assets are excluded.

## Runtime QA

Server sanitizer exercised with generated JPEG, PNG, WebP and AVIF inputs. All normalize to JPEG. 4000×2000 input becomes 3000×1500. Tiny and garbage inputs are rejected.

## EXTERNAL

- Apply migration `0005_trusted_photo_assets.sql`.
- Configure private R2 bucket CORS so the CardeLume production origin may PUT the exact presigned object with the issued Content-Type. Keep the bucket private.
- Validate R2 credentials and upload CORS on Pi/VPS.
- Edge/WAF upload rate limiting remains deployment configuration.

## NEXT

Step 8: production AI provider + durable generation queue/status persistence.

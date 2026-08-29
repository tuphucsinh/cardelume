# Font provenance

Official OFL reference: <https://openfontlicense.org/open-font-license-official-text/>

Current research indicates the selected Cormorant/DM Sans/Noto CJK/Lato/EB Garamond families are distributed under OFL-compatible/open terms in their relevant upstream channels. CardeLume does **not** approve a font merely from the family name: release evidence binds the exact installed npm/Debian package version, binary/content hash and retained license/copyright evidence.

The current Phase 18 candidate has a reviewed `pnpm-lock.yaml`, exact web-font evidence for the eight active Fontsource records, and exact Debian package/font-tree evidence for the three active worker records from the pinned ARM64 worker image. The historical DM Sans record is retired from the web source path. The worker image evidence is bound to `cardelume-worker-font-evidence@sha256:5d65aa4618f3e0c7e98253a87951e1cf675dfb79817e221bf3db1ce01874e988` and the package pins in `docker/worker.Dockerfile`.

Font eligibility is no longer a Phase 18 blocker for the active web/worker pool. Production remains blocked by separate brand-asset provenance, template originality/promotion, dependency-risk disposition and runtime/security gates.

# Font provenance

Official OFL reference: <https://openfontlicense.org/open-font-license-official-text/>

Current research indicates the selected Cormorant/DM Sans/Noto CJK/Lato/EB Garamond families are distributed under OFL-compatible/open terms in their relevant upstream channels, but CardeLume does **not** approve a font merely from the family name. Release approval requires the exact installed npm/Debian package version, binary/content hash and retained license/copyright evidence.

The current baseline lacks `pnpm-lock.yaml`, and the worker Dockerfile installs Debian font packages without exact Debian package versions/snapshot pinning. Those font records therefore remain `UNKNOWN` until evidence is collected on the controlled Pi5/build environment.

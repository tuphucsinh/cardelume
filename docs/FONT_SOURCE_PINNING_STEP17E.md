# Font Source Pinning — Step 17E

## Decision

CardeLume now pins the **declared source version** of all shipping Fontsource web families to `5.2.6` and pins worker Debian font packages in the Bookworm image to exact package versions. This reduces source drift before the Step 18 lockfile/build gate.

Worker pins:

- `fonts-ebgaramond=0.016+git20210310.42d4f9f2-1`
- `fonts-lato=2.0-2.1`
- `fonts-noto-cjk=1:20220127+repack1-1`

The worker image also verifies that Debian package copyright files are present.

## Important boundary

This is **not** final binary approval. Production still requires:

1. reviewed `pnpm-lock.yaml`;
2. frozen install;
3. exact installed Fontsource package/file hashes;
4. worker font-file hashes from the built image;
5. retained license/copyright evidence;
6. cross-architecture render parity.

Source pinning reduces drift; it does not replace runtime provenance evidence.

# Historical Dependency Lock Audit — Step 17E

Purpose: determine whether the missing dependency lock can be recovered from an earlier frozen CardeLume baseline rather than regenerated or fabricated offline.

## Result

**No recoverable package-manager lockfile was found in the inspected historical frozen baselines.**

Searched exact basenames: `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, `npm-shrinkwrap.json`.

| Frozen archive | SHA256 | ZIP entries | Lockfile hits |
|---|---|---:|---|
| `CARDELUME_BASELINE_0.4.2_GLOBAL_LAUNCH_HARDENING_HERMES_HANDOFF.zip` | `08d561ca9209d7ff3cd4c300140226bd801109e4145e9cc332a068345d0803e9` | 124 | none |
| `CARDELUME_BASELINE_0.4.3_STEP11_REPRODUCIBLE_CONTAINERS_HA_PREFLIGHT_HERMES_HANDOFF.zip` | `bb8aa72e772ff90fd587533251646dc840cd6d417bb9e5c1b96a462716932454` | 283 | none |
| `CARDELUME_BASELINE_0.4.3_STEP12_MANAGED_TEMPLATE_LIBRARY_HERMES_HANDOFF.zip` | `76ebf6bfd1bc427bd2bf0229817ae62fb346011b433fff5ed1d8dfe8ee258f99` | 315 | none |

## Decision

- Do **not** hand-author a lockfile to satisfy a release gate.
- Do **not** infer exact package versions from semver ranges.
- In the controlled runtime with registry access: run the declared pnpm version, resolve dependencies, review the resulting graph and lockfile, then freeze and validate with `pnpm install --frozen-lockfile`.

This audit is historical evidence only; it does not make the dependency graph reproducible by itself.

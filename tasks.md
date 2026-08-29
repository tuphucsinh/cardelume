# CardeLume WBS — Remaining Work

Canonical phase details: `MASTERPLAN.MD`.

Legend: `[ ]` not started · `[~]` in progress · `[x]` evidence complete · `[!]` blocked.

> Scope note (2026-08-29): the detailed Phase 18/19/20 blocks below are regenerated against the current `MASTERPLAN.MD`. Phase 0/21 summaries are legacy, non-execution-ready notes until separately reconciled. Per owner gate clarification, Phase 19 staging/evidence work may start while production promotion remains blocked; public launch remains `NO_GO`.

> Review handoff: P19M1T01 is evidence-complete. P19M1T02 is active preparation only; calibration packet and cost/call bounds are prepared, but no real-model call, human score or external rater contact has occurred. Review artifacts are under `/home/pi5/hermes-artifacts/cardelume/phase19/61266c937a5b11a18c9ca8e5d8cae6a5e5c7469f/`.

## Phase 0 — Pi5/Hermes import

- [ ] 0.1 Extract to `~/projects/cardelume`
- [ ] 0.2 Verify `PROJECT_SHA256SUMS.txt`
- [ ] 0.3 Attach Hermes Desktop Project / Lumer profile
- [ ] 0.4 Read AGENTS/HANDOFF/MASTERPLAN
- [ ] 0.5 Run FAST/RELEASE/STATUS source checks
- [ ] 0.6 Initialize/verify Git remote and clean baseline commit
- [ ] 0.7 Create staging `.env` outside Git

**Milestone acceptance:** package integrity + source suites pass; clean Git state; no production secret.

## Phase 18 — Reproducible and Reviewable Baseline

**Entry/exit boundary**: this phase creates the reviewed dependency/IP baseline only. It does not apply migrations, start production services, run paid AI/human review, approve templates, perform checkout, or claim runtime/browser PASS. Phase 19 staging/evidence work may proceed under the explicit owner clarification, but Phase 18 dependency/template/runtime blockers still block production promotion; DB/RLS, queue, storage, payment, browser-runtime and restore evidence remain open.

## Milestone M1 — Dependency freeze

### [#P18M1T01] [package.json, apps/web/package.json, packages/*/package.json, apps/worker/package.json] `recordPhase18ToolchainBaseline(): ToolchainManifest`

**Goal**: Record the actual Node/package-manager/workspace baseline and inventory every manifest before generating a lockfile.

**Depends on**: `none`

**Parallel-safe**: `yes`

**New interface**:
~~~ts
interface ToolchainManifest { node: string; packageManager: "pnpm@10.15.0"; manifests: string[]; sourceSha: string; }
~~~

**Context hiện có**:
- Root `package.json` declares `packageManager: pnpm@10.15.0`; 11 workspaces are covered by Turbo.
- Current source/offline checks passed, but `pnpm-lock.yaml` is absent and must not be described as recovered history.

**Concrete changes**:
1. Capture Node, Corepack/pnpm version, workspace manifests and current source SHA in `/home/pi5/hermes-artifacts/cardelume/phase18/<source-sha>/toolchain.json`.
2. Compare declared workspace dependencies and package-manager fields; report duplicate/conflicting ranges without changing manifests.
3. Record the exact clean working-tree boundary used for the candidate.

**Owner/gate**: Mika read-only preflight; no dependency install or external mutation.

**Constraints**:
- Do not read/print secrets or `.env*`; do not upgrade packages in this task.
- If Node/Corepack resolution differs from the manifest, stop with `BLOCKED_TOOLCHAIN`.

**Definition of Done**:
- Manifest contains exact source SHA, Node version, `pnpm@10.15.0` and all workspace package paths; no untracked source change.
- `git diff --check` passes and the redacted manifest is retained outside Git; không commit/push.

**Status**: `[ ]`

---

### [#P18M1T02] [pnpm-lock.yaml] `generateReviewedLockfile(): LockfileCandidate`

**Goal**: Generate a new dependency-resolved lockfile from the current manifests and prove a clean frozen install.

**Depends on**: `[#P18M1T01]`

**Parallel-safe**: `no`

**Context hiện có**:
- `package.json` pins the package manager but no lockfile exists; all workspace packages use `workspace:*` links.
- Previous checks used Corepack because a direct `pnpm` binary may be absent from PATH.

**Concrete changes**:
1. Generate `pnpm-lock.yaml` with `corepack pnpm install --lockfile-only` using the recorded manifests.
2. Review importer/package/snapshot integrity, lifecycle scripts, native packages and ARM64/AMD64 compatibility.
3. Re-run install from a clean candidate checkout with `corepack pnpm install --frozen-lockfile`; retain command output, lockfile SHA and dependency graph summary.

**Owner/gate**: **Need approval** before dependency install or accepting any package-version delta; Mika verifies lockfile diff.

**Constraints**:
- No unrelated package upgrade, no secret-bearing registry configuration, no `--no-frozen-lockfile` on the verification install.
- Lockfile is a candidate until M1T03 review; rollback is `git restore -- pnpm-lock.yaml` before commit.

**Definition of Done**:
- Tracked candidate lockfile, frozen-install exit `0`, lockfile SHA, dependency delta and native/install-script review at `/home/pi5/hermes-artifacts/cardelume/phase18/<source-sha>/`.
- Any failed/unsupported package remains `BLOCKED`; không commit/push.

**Status**: `[ ]`

---

### [#P18M1T03] [pnpm-lock.yaml, security/DEPENDENCY_POLICY.md, .ai/evidence/phase18-dependency-freeze.json] `reviewDependencyFreeze(): DependencyReview`

**Goal**: Turn the generated lockfile into a reviewable candidate without silently accepting supply-chain or platform risk.

**Depends on**: `[#P18M1T02]`

**Parallel-safe**: `no`

**New interface**:
~~~ts
interface DependencyReview { lockSha256: string; changedPackages: string[]; nativeRisks: string[]; installScripts: string[]; verdict: "PASS"|"BLOCKED"; }
~~~

**Context hiện có**:
- `scripts/security-governance.mjs` requires `pnpm-lock.yaml` for release evidence; `scripts/release-sbom.mjs` binds the SBOM to the lock SHA.

**Concrete changes**:
1. Compare candidate lockfile against manifests and the prior source baseline; list only real package changes.
2. Verify registry integrity fields, install scripts, native dependencies and cross-architecture assumptions.
3. Write a redacted dependency review with reviewer, date, lock SHA and rollback note.

**Owner/gate**: Mika technical review; owner accepts unresolved dependency risk before advancing.

**Constraints**:
- Do not call absent lock history “recovered”; do not suppress integrity/install-script warnings.
- No production install or deployment.

**Definition of Done**:
- `DependencyReview.verdict=PASS` only when the lockfile is reviewed and frozen install evidence is readable; otherwise `BLOCKED` with exact reason.
- `.ai/evidence/phase18-dependency-freeze.json` contains no credentials/PII; không commit/push.

**Status**: `[x]`

---

## Milestone M2 — Strict semantic and source baseline

### [#P18M2T01] [apps/web/package.json, package.json, eslint.config.mjs] `runStrictLint(): StrictLintResult`

**Goal**: Replace the current masked/invalid web lint path with one supported strict lint command that fails on lint errors.

**Depends on**: `[#P18M1T02]`

**Parallel-safe**: `no`

**New interface**:
~~~ts
interface StrictLintResult { command: string; exitCode: 0; filesChecked: number; maskedFailure: false; }
~~~

**Context hiện có**:
- `apps/web/package.json:9` currently runs `next lint || true`; the current Next.js version is `16.3.3` and the command reports an invalid `apps/web/lint` directory.
- Other workspace lint scripts are mostly no-op, so root `pnpm lint` is not sufficient evidence by itself.

**Concrete changes**:
1. Use the supported Next 16 ESLint invocation/configuration for this repository; add only compatible pinned lint dependencies/config needed by the chosen command and update the lockfile in the same task.
2. Remove `|| true` and invalid positional `lint` behavior; ensure root Turbo invokes the same strict command in the web workspace.
3. Add/update a source stress assertion that fails if the command masks errors or silently checks zero files.

**Owner/gate**: Selected runner implements; Mika independently reviews package/lock diff. Any new dependency must be justified and included in M1 review.

**Constraints**:
- No broad rule suppression, generated-artifact linting, unrelated formatting or source refactor.
- Preserve existing behavior; rollback both manifest/config and lockfile together if the strict command cannot run.

**Definition of Done**:
- `corepack pnpm --filter @cardelume/web lint` and root `corepack pnpm lint` exit `0` while checking real source files; deliberate lint failure is proven to exit non-zero in an isolated fixture.
- `pnpm-lock.yaml` remains synchronized; no `next lint || true`, no false PASS; không commit/push.

**Status**: `[ ]`

---

### [#P18M2T02] [scripts/governance-runner.mjs, governance/check-registry.mjs, .ai/evidence/phase18-semantic.json] `runSemanticBaseline(): SemanticBaseline`

**Goal**: Run the resolved candidate through strict typecheck, tests, build and existing FAST/RELEASE/HEAVY source gates.

**Depends on**: `[#P18M2T01]`

**Parallel-safe**: `no`

**Context hiện có**:
- Root scripts expose `typecheck`, `test`, `lint`, `build`, `check:fast`, `check:release`, `check:heavy` and `check:status`.
- HEAVY checks requiring runtime/workspace dependencies must be recorded as `BLOCKED_RUNTIME`, not converted to PASS.

**Concrete changes**:
1. Run typecheck, tests, strict lint and production build with the reviewed lockfile.
2. Run FAST/RELEASE/HEAVY governance and capture command, exit code, package-manager version and artifact paths.
3. Separate source/offline PASS from runtime-required BLOCKED/UNKNOWN checks in the redacted evidence.

**Owner/gate**: Mika verification; no deployment or runtime service start.

**Constraints**:
- Do not use cache output as sole proof; remove only generated `.turbo`/`.next` residue after inspection.
- Preserve first failure and stop if the same failure repeats without new evidence.

**Definition of Done**:
- Typecheck, test, build and strict lint PASS; expected runtime-only checks are explicitly classified; `phase18-semantic.json` records evidence.
- `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm lint`, `corepack pnpm build`, `corepack pnpm check:release` outputs are retained; không commit/push.

**Status**: `[ ]`

---

### [#P18M2T03] [scripts/step17j-integration-source-stress.mjs, scripts/security-governance-source-stress.mjs, .ai/evidence/phase18-source-gates.json] `verifySourceGates(): SourceGateReport`

**Goal**: Confirm the candidate still satisfies existing source-level product/security governance without claiming runtime readiness.

**Depends on**: `[#P18M2T02]`

**Parallel-safe**: `yes`

**Context hiện có**:
- Governance registry already wires product, payment, upload, queue, template, IP and security source stress checks.
- Step17J validation previously distinguished source PASS from HEAVY runtime blocks.

**Concrete changes**:
1. Run the registered source stress suites and compare counts against the current registry, not hardcoded historical totals.
2. Verify no test/report was changed merely to pass and no release command deploys production.
3. Record source gate matrix and unresolved runtime gates for Phase 21.

**Owner/gate**: Mika read-only verification.

**Constraints**:
- No external DB, payment, storage or customer-data access.
- Do not edit tests, governance registry or reports to hide a failure.

**Definition of Done**:
- Source gate matrix is reproducible from the candidate SHA; all failures are resolved or marked `BLOCKED/UNKNOWN` with owner/next phase.
- No tracked generated report changes remain outside the task scope; không commit/push.

**Status**: `[ ]`

---

## Milestone M3 — Supply-chain and security baseline

### [#P18M3T01] [scripts/release-sbom.mjs, security/reports/release-sbom.cdx.json, .ai/evidence/phase18-sbom.json] `buildReleaseSbom(): ReleaseSbomEvidence`

**Goal**: Produce a resolved-dependency SBOM bound to the reviewed lockfile and run the dependency vulnerability scan.

**Depends on**: `[#P18M2T02]`, `[#P18M1T03]`

**Parallel-safe**: `no`

**Context hiện có**:
- `scripts/release-sbom.mjs` refuses to run without a lockfile and writes `security/reports/release-sbom.cdx.json`.
- `scripts/dependency-vulnerability-scan.mjs` writes `security/reports/dependency-vulnerability-report.json` and binds results to the lock SHA when available.

**Concrete changes**:
1. Generate release SBOM from the frozen installed graph and verify `cardelume:lockSha256` matches the candidate lock.
2. Run the vulnerability scanner and classify direct/transitive findings by severity and exploitability.
3. Record report hashes, tool versions, scope and remediation/owner-acceptance status in external Phase 18 evidence.

**Owner/gate**: **Need approval** for unresolved vulnerability acceptance; no production release.

**Constraints**:
- Do not mark a source SBOM as release-complete; do not suppress advisories or print registry credentials.
- Generated timestamp reports must be restored/isolated unless explicitly part of the reviewed candidate.

**Definition of Done**:
- SBOM and vulnerability report are valid, lock-bound and readable; every unresolved finding has `BLOCKED` or owner-approved rationale.
- `corepack pnpm security:sbom-release` and `corepack pnpm security:dependency-scan` evidence is retained; không commit/push.

**Status**: `[ ]`

---

### [#P18M3T02] [scripts/security-governance.mjs, scripts/ip-governance.mjs, licenses/, security/reports/, .ai/evidence/phase18-security.json] `runSecurityAndIpBaseline(): SecurityBaseline`

**Goal**: Close source-level secret, security-governance and IP audit evidence before any Phase 19 paid/human scoring.

**Depends on**: `[#P18M3T01]`, `[#P18M2T03]`

**Parallel-safe**: `no`

**Context hiện có**:
- Existing scripts include `security:secret-scan`, `security:audit`, `security:release-check`, `ip:audit` and `ip:release-check`.
- Current release is intentionally `NO_GO` while lockfile, exact asset/font evidence and runtime gates are incomplete.

**Concrete changes**:
1. Run secret scan, security audit, IP audit and release-check commands against the candidate.
2. Classify every finding as fixed, owner-accepted with rationale, `BLOCKED` or `UNKNOWN`; preserve `NO_GO` when release prerequisites are absent.
3. Store redacted report hashes and scope, never raw secrets, customer data or credential-bearing output.

**Owner/gate**: Mika verifies; owner/legal review required for any unresolved IP or vulnerability acceptance.

**Constraints**:
- Do not alter `.env*`, credential files, Git history or security findings to obtain PASS.
- Source audit PASS never promotes production or authorizes external traffic.

**Definition of Done**:
- Secret scan has zero findings; security/IP reports are internally consistent; unresolved items remain explicit and actionable.
- `corepack pnpm security:secret-scan`, `corepack pnpm security:audit`, `corepack pnpm ip:audit` and release checks have retained outputs; không commit/push.

**Status**: `[ ]`

---

## Milestone M4 — Font/asset eligibility and exit package

### [#P18M4T01] [scripts/font-provenance-collect.mjs, licenses/fonts/, .ai/evidence/phase18-fonts.json] `collectExactFontEvidence(): FontEvidence`

**Goal**: Capture exact browser/renderer font binaries, versions, hashes, license evidence and script coverage for the complete Phase 19 review pool.

**Depends on**: `[#P18M1T02]`

**Parallel-safe**: `yes`

**Context hiện có**:
- `scripts/font-provenance-collect.mjs` collects npm/Debian font evidence but intentionally leaves status UNKNOWN until human/reviewer verification.
- Font and asset manifests already distinguish family-level research from exact installed binary eligibility.

**Concrete changes**:
1. Run the collector against the frozen install and record exact package/binary tree hashes, versions and license evidence paths.
2. Map browser/renderer fonts to the enabled launch scripts/locales and identify missing glyph/coverage.
3. Record unresolved conditions without changing status to APPROVED automatically.

**Owner/gate**: Mika evidence collection; legal/owner review remains separate.

**Constraints**:
- Do not copy unlicensed binaries into Git or treat family-level OFL research as exact binary approval.
- No paid human review starts from this task.

**Definition of Done**:
- Every review-pool font has exact evidence or an explicit `UNKNOWN/BLOCKED` reason; manifest/status changes are reviewable.
- `.ai/evidence/phase18-fonts.json` contains hashes/paths but no secret or raw customer data; không commit/push.

**Status**: `[ ]`

---

### [#P18M4T02] [scripts/font-template-launch-readiness.mjs, licenses/assets/, licenses/templates/, .ai/evidence/phase18-eligibility.json] `checkPhase19Eligibility(): EligibilityReport`

**Goal**: Fail closed on any unresolved font, brand-asset, template-provenance or locale/script dependency before Phase 19 sampling.

**Depends on**: `[#P18M4T01]`, `[#P18M3T02]`

**Parallel-safe**: `no`

**New interface**:
~~~ts
interface EligibilityReport { reviewPool: string[]; eligible: string[]; blocked: Array<{id:string;reason:string}>; verdict: "PASS"|"BLOCKED"; }
~~~

**Context hiện có**:
- `quality:font-template-launch-check` validates font/template launch readiness and current production-approved template count is zero by design.
- Phase 19 must sample only legally eligible families; it is still responsible for final immutable-version attestation and Premium/WOW scoring.

**Concrete changes**:
1. Run the readiness check across the complete review pool, all ten enabled locales/scripts and browser/renderer paths.
2. Verify brand asset provenance and exact template provenance without promoting `candidate`, `experiment` or `hold` to `approved`.
3. Produce an allowlist for Phase 19 and a blocked list with repair owner/reason.

**Owner/gate**: **Owner/legal approval required** for commercial-use eligibility; no template launch-status mutation in this task.

**Constraints**:
- `UNKNOWN` font/asset/license status is not eligible; do not reduce the Phase 19 review pool silently.
- No Golden benchmark, paid model run, human rater recruitment or production catalog mutation.

**Definition of Done**:
- `corepack pnpm quality:font-template-launch-check` exits with a redacted report; every Phase 19 candidate is `eligible` or explicitly blocked.
- Production remains `NO_GO` and approved template count is not changed; không commit/push.

**Status**: `[ ]`

---

### [#P18M4T03] [MASTERPLAN.MD, .ai/evidence/phase18-exit.json, /home/pi5/hermes-artifacts/cardelume/phase18/<source-sha>/] `verifyPhase18Exit(): Phase18ExitEvidence`

**Goal**: Package the complete Phase 18 evidence and record one baseline SHA that Phase 19 can safely consume.

**Depends on**: `[#P18M1T03]`, `[#P18M2T03]`, `[#P18M3T02]`, `[#P18M4T02]`

**Parallel-safe**: `no`

**Context hiện có**:
- Current Master Plan exit gate requires `REPRODUCIBLE_INSTALL`, `SEMANTIC_BUILD`, `SUPPLY_CHAIN`, `FONT_ASSET_ELIGIBILITY` and `BASELINE_SHA`.
- Phase 19 tasks already use `PHASE18_EXIT_GATE` as their prerequisite and must not infer it from a single passing command.

**Concrete changes**:
1. Verify each prerequisite evidence artifact, exact candidate SHA, lock SHA, report hashes and unresolved-risk disposition.
2. Write `.ai/evidence/phase18-exit.json` with explicit PASS/BLOCKED/UNKNOWN per gate and the next owner/action for any non-PASS.
3. Mika performs final diff/secret/scope review; do not tick future Phase 19/20 tasks.

**Owner/gate**: Mika final gate; owner sign-off required for unresolved dependency/IP/vulnerability risk. No production approval.

**Constraints**:
- No fabricated PASS, no re-baselining to hide regressions, no runtime claim from source-only evidence.
- If any gate is not proven, the affected production/promotion gate is `BLOCKED`; Phase 19 staging/evidence work may proceed only within the owner-approved non-production boundary.

**Definition of Done**:
- `REPRODUCIBLE_INSTALL PASS`, `SEMANTIC_BUILD PASS`, `SUPPLY_CHAIN PASS`, `FONT_ASSET_ELIGIBILITY PASS` and `BASELINE_SHA RECORDED` are all evidenced, or the report is explicitly `BLOCKED`.
- Evidence is redacted, reproducible from the candidate SHA and ready for Phase 19 handoff; không commit/push.

**Status**: `[x]`

---

## Phase 19 — Premium/WOW Improvement and Product Truth

**Entry gate:** current `MASTERPLAN.MD` Phase 18 exit evidence is complete for controlled staging/evidence work under the owner clarification; production promotion remains blocked. No task below may auto-approve a template, spend on external model calls, recruit human raters or mutate a live catalog without its named approval gate.

## Milestone M1 — Frozen baseline and independent scoring

### [#P19M1T01] [scripts/premium-benchmark-lab.mjs] `validateFrozenPremiumProtocol(): ProtocolValidation`

**Goal**: Freeze the Golden/human-review protocol before output inspection and make provenance, stratification and anti-tampering machine-checkable.

**Depends on**: `PHASE18_EXIT_GATE`

**Parallel-safe**: `no`

**Owner/gate**: Mika prepares; independent Reviewer confirms protocol integrity before any paid run.

**New interface**:
~~~ts
interface FrozenPremiumProtocol {
  goldenSetVersion: string; goldenSetSha256: string; rubricVersion: string;
  subsetBriefIds: string[]; raterRosterHash: string; referenceStimuliManifest: string;
}
// VD: premium-benchmark-lab.mjs freeze-protocol --out <artifact>/protocol.json
~~~

**Context hiện có**:
- `benchmarks/premium/golden-set-v1.json` đã có 150 briefs / 10 locales; `scripts/premium-benchmark-lab.mjs` có `validate`, `review-sheet`, `summarize`, `compare`.
- `scripts/premium-benchmark-source-stress.mjs` đang giữ contract Step14; chưa có frozen protocol/provenance manifest.

**Concrete changes**:
1. Thêm `freeze-protocol` và validation cho exact Golden SHA, rubric, stratified ≥30-brief subset, roster/conflict hash và sealed-output location.
2. Tạo `.ai/evidence/premium-reference-stimuli.json` chỉ chứa URL/license basis/retrieval date/SHA-256/external artifact reference; không commit binary không có redistribution rights.
3. Mở rộng source stress để fail khi protocol thay đổi sau reveal hoặc thiếu provenance.

**Constraints**:
- Không đổi 150 briefs, subset, rubric, rater roster hoặc threshold sau khi output được reveal.
- Không chứa customer data, raw score sheets, secrets hoặc reference binaries trong Git.

**Definition of Done**:
- `pnpm benchmark:validate` và `node scripts/premium-benchmark-source-stress.mjs` exit 0.
- Protocol hash + artifact path được ghi; `git diff --check` pass; không commit/push.

**Status**: `[x]`

---

### [#P19M1T02] [/home/pi5/hermes-artifacts/cardelume/phase19/] `executeSealedBaseline(): BaselineEvidence`

**Goal**: Chuẩn bị và, sau approval riêng, chạy calibration real-model 30–50 briefs × 3 với ban đầu 3 independent raters; chỉ chạy Final Golden 100–150 briefs × 3 và ≥5 raters sau bounded improvement loop ổn định 6–8 families.

**Depends on**: `[#P19M1T01]`

**Parallel-safe**: `no`

**Owner/gate**: **Need approval** trước mọi external model cost hoặc external rater contact. Calibration bắt đầu với 3 independent raters; Final Golden dùng ≥5 sau khi M2 đóng và candidate set ổn định. Reviewer kiểm tra sealed aggregation.

**Context hiện có**:
- `scripts/premium-benchmark-runner.ts` hỗ trợ `--require-real-model`, repeat/limit/offset, budget attribution và JSONL.
- `scripts/premium-benchmark-lab.mjs` sinh review sheet và deterministic summary.
- Calibration packet: `/home/pi5/hermes-artifacts/cardelume/phase19/61266c937a5b11a18c9ca8e5d8cae6a5e5c7469f/calibration-review-packet.json`; trạng thái `PREPARED_WAITING_FOR_APPROVAL`, chưa có model output/rater score.

**Concrete changes**:
1. Chốt experiment/budget ID, source SHA, provider/model/config hash, calibration count 30–50 và artifact root `/home/pi5/hermes-artifacts/cardelume/phase19/<source-sha>/calibration/`; chuẩn bị anonymized packet và estimated API/model cost trước khi gọi bên ngoài.
2. Sau approval, chạy calibration real-model 30–50 briefs × 3, sinh anonymized review sheets, trộn frozen anchors và thu sealed scores từ ban đầu 3 independent raters.
3. Sau bounded improvement loop ổn định 6–8 families và approval mới, chạy Final Golden 100–150 briefs × 3 với ≥5 independent raters; aggregate trước reveal identities và ghi redacted summary + PASS/FAIL/UNKNOWN.

**Constraints**:
- Không chạy calibration nếu thiếu cost approval, rater approval/roster/conflict declaration hoặc Phase 18 eligibility gate; không contact external raters khi chưa có approval riêng.
- Không để owner/developer chấm human subset; không hạ threshold; không đưa raw PII/customer content vào artifact.
- Calibration là diagnostic, không được dùng để approve family hoặc hạ Final Golden quality thresholds.

**Definition of Done**:
- Calibration packet + estimated cost được tạo trước external execution; không có model call/rater contact nếu approval còn thiếu.
- Sau approval, `pnpm exec tsx scripts/premium-benchmark-runner.ts --require-real-model --repeat 3 --limit N --out <artifact>/calibration.jsonl` hoàn tất theo approved budget với số brief `N` là số nguyên `30 ≤ N ≤ 50`, rồi `pnpm benchmark:summarize -- <run.jsonl> <sealed-review.csv> <summary.json>` tạo deterministic summary.
- Final Golden chỉ chạy sau M2 ổn định 6–8 families với `--limit N` và `100 ≤ N ≤ 150`, ≥5 raters; evidence có Premium/WOW/originality/emotional-fit/diversity, latency/cost/fallback; không commit/push.

**Status**: `[ ]`

---

## Milestone M2 — Bounded improvement loop

### [#P19M2T01] [scripts/premium-benchmark-lab.mjs] `diagnosePremiumFailures(summary, review): ImprovementManifest`

**Goal**: Chuyển baseline fail thành danh sách hypothesis có thứ tự, exact scope và stop rule; không “polish chung chung”.

**Depends on**: `[#P19M1T02]`

**Parallel-safe**: `no`

**New interface**:
~~~ts
interface ImprovementHypothesis {
  id: string; class: "template"|"creative-recipe"|"ai-config";
  exactVersions: string[]; failureDimensions: string[]; calibrationBriefIds: string[];
  expectedUplift: number; maxIterations: 2;
}
// VD: premium-benchmark-lab.mjs diagnose baseline-summary.json review.csv diagnosis.json
~~~

**Context hiện có**:
- Summary đã có family concentration, visual archetypes, copy shapes, latency/cost và human scores nhưng chưa xuất failure clusters/action manifest.

**Concrete changes**:
1. Thêm `diagnose` command nhóm theo exact template/version, locale/script, copy pressure, photo mode và rubric dimension.
2. Chọn frozen representative calibration slice cho từng hypothesis và ghi expected uplift/guard metrics.
3. Test deterministic output, stable ordering và fail-closed khi review chưa complete.

**Constraints**:
- Không tự chọn giải pháp vượt class được evidence hỗ trợ.
- Không gộp nhiều root causes vào một hypothesis; tối đa 2 iteration cùng hypothesis.

**Definition of Done**:
- `node scripts/premium-benchmark-lab.mjs diagnose <summary.json> <review.csv> <diagnosis.json>` exit 0 và lặp lại cho output byte-stable sau khi bỏ timestamp.
- `node scripts/premium-benchmark-source-stress.mjs` exit 0; không commit/push.

**Status**: `[ ]`

---

### [#P19M2T02] [packages/ai/src/index.ts, packages/templates/src/index.ts] `applyCreativeQualityHypothesis(id): Candidate`

**Goal**: Sửa đúng một hypothesis về copy/design harmony, novelty hoặc three-direction diversity bằng candidate nhỏ nhất.

**Depends on**: `[#P19M2T01]`

**Parallel-safe**: `no`

**Owner/gate**: Chỉ activate nếu diagnosis có hypothesis class `creative-recipe` hoặc `ai-config`; nếu không, ghi `SKIPPED_NOT_APPLICABLE`.

**Context hiện có**:
- `packages/ai/src/index.ts` có Creative Director + critic thresholds; `packages/templates/src/index.ts` có candidate pack, recipes và diversity priors.
- `scripts/ai-creative-director-source-stress.ts` và premium source stress bảo vệ contract hiện hành.

**Concrete changes**:
1. Viết failing behavior test cho exact hypothesis và frozen calibration IDs.
2. Chỉ chỉnh một primary cause trong AI prompt/critic threshold hoặc creative recipe/ranking.
3. Lưu candidate config hash; chạy GREEN và regression source checks.

**Constraints**:
- Không hardcode output/case, không tăng randomness vô hạn, không bypass production eligibility.
- Không thay Golden/rubric/threshold; không chạy paid full benchmark trong code task.

**Definition of Done**:
- `pnpm exec tsx scripts/ai-creative-director-source-stress.ts` và `node scripts/premium-benchmark-source-stress.mjs` exit 0.
- `pnpm typecheck` exit 0; diff chỉ đúng hypothesis ID; không commit/push.

**Status**: `[ ]`

---

### [#P19M2T03] [packages/renderer/src/template-art.ts, apps/web/components/card-visual.tsx] `applyVisualCraftHypothesis(id): Candidate`

**Goal**: Sửa đúng một visual hypothesis về composition, typography, material realism hoặc browser↔renderer parity cho exact family/version.

**Depends on**: `[#P19M2T01]`

**Parallel-safe**: `no`

**Owner/gate**: Chỉ activate nếu diagnosis có hypothesis class `template`; visual direction theo `design-taste-frontend`.

**Context hiện có**:
- Renderer authority: `packages/renderer/src/template-art.ts`, `template-layout.ts`, `index.ts`; browser surface: `card-visual.tsx`, `physical-effects.tsx`, `globals.css`.
- Hero layout hiện tại là owner-approved và ngoài scope.

**Concrete changes**:
1. Tạo failing render/source assertion cho exact defect và family/version.
2. Patch tối thiểu ở template art/layout và browser counterpart; tạo immutable version mới nếu pixel output đổi.
3. Capture before/after browser + final preview evidence tại ba viewport và representative JPG/PDF.

**Constraints**:
- Không sửa hero scale/layout, không tạo fake physical-shipment cue, không dùng unlicensed asset/font.
- Một task chỉ một primary visual cause; reduced-motion/static fallback bắt buộc.

**Definition of Done**:
- `pnpm exec tsx scripts/renderer-export-stress.ts`, `node scripts/step17j-integration-source-stress.mjs`, `pnpm typecheck` exit 0.
- Browser evidence `390×844`, `768×1024`, `1440×900` + final render comparison; no overflow/console error; không commit/push.

**Status**: `[ ]`

---

### [#P19M2T04] [/home/pi5/hermes-artifacts/cardelume/phase19/] `calibrateAndDisposeCandidate(id): CandidateDisposition`

**Goal**: Đo candidate trên frozen slice, giữ uplift thật và dừng/cull khi cùng hypothesis thất bại hai lần.

**Depends on**: `[#P19M2T01]`, `[#P19M2T02]` hoặc `[#P19M2T03]` khi applicable

**Parallel-safe**: `no`

**Owner/gate**: **Need approval** cho calibration model cost; Mika adjudicates evidence, không dựa runner self-report.

**Context hiện có**:
- Diagnosis manifest đã khóa brief IDs, expected uplift và guard metrics; candidate có source/config SHA.

**Concrete changes**:
1. Chạy đúng frozen slice một case đại diện trước, rồi toàn slice khi case đầu không regress.
2. So baseline/candidate scores, renders, latency/cost/fallback và guard metrics.
3. Ghi `advance`, `rework`, `hold` hoặc `rejected`; lần fail thứ hai buộc stop/new hypothesis, không lặp cosmetic.

**Constraints**:
- Task này không sửa code; hypothesis mới phải thành task mới.
- Không full benchmark trước khi candidate slice đạt measurable uplift và zero material regression.

**Definition of Done**:
- `pnpm benchmark:compare -- <baseline-summary.json> <candidate-summary.json>` exit 0.
- Before/after artifact có exact SHA/config, score delta, render evidence, cost và disposition; không commit/push.

**Status**: `[ ]`

---

## Milestone M3 — Signature and material calibration

### [#P19M3T01] [.ai/DESIGN_CONTRACT.md] `approveCardeLumeSignature(): DesignContract`

**Goal**: Chốt một signature device nhận ra được và một small-size variant trước khi implement xuyên browser/renderer.

**Depends on**: `[#P19M2T04]`

**Parallel-safe**: `no`

**Owner/gate**: **Owner visual approval required**; plan-only evidence không tự duyệt thiết kế.

**New interface**:
~~~ts
interface SignatureContract { primary: string; compact: string; purpose: string; forbiddenUses: string[]; }
// VD: signature phải sống được ở hero, reveal, final card, OG/share và recovery.
~~~

**Context hiện có**:
- Master Plan dials: variance 7, motion 4, density 3; chưa có `.ai/DESIGN_CONTRACT.md`.

**Concrete changes**:
1. So sánh tối đa 3 evidence-backed signature candidates theo recognizability, craft, small-size và render feasibility.
2. Ghi chosen contract, composition/type/color/spacing/motion/reduced-motion rules và rejected alternatives.
3. Ghi exact owner decision/date và screenshot/render acceptance matrix.

**Constraints**:
- Không đổi hero layout; không dùng wordmark như tín hiệu duy nhất; không generic gold/glow/foil decoration.
- Đây là contract, không implement code.

**Definition of Done**:
- `.ai/DESIGN_CONTRACT.md` có owner-approved choice, exact states/viewports và renderer handoff.
- `git diff --check` pass; không commit/push.

**Status**: `[ ]`

---

### [#P19M3T02] [packages/renderer/src/template-art.ts, apps/web/components/physical-effects.tsx] `renderCardeLumeSignature(contract): void`

**Goal**: Implement approved signature và material calibration đồng nhất ở browser, watermarked preview và final JPG/PDF.

**Depends on**: `[#P19M3T01]`, `[#P19M2T03]` nếu applicable

**Parallel-safe**: `no`

**Context hiện có**:
- `renderSafeSvg`/`renderProductionPreview`/`renderProductionFinal` là renderer contract; `CardVisual` + `PhysicalCardSurface` là browser contract.

**Concrete changes**:
1. Add signature primitives/tokens ở renderer + browser theo exact design contract.
2. Calibrate grain/edge/contact shadow/foil-light/emboss cues; version-bump every pixel-affecting template.
3. Add reduced-motion/static behavior and parity tests for preview/final paths.

**Constraints**:
- Final output deterministic; preview chỉ khác watermark/resolution.
- Không degrade 390px legibility, print safe area, LCP/INP hoặc lower-capability fallback.

**Definition of Done**:
- `pnpm exec tsx scripts/renderer-export-stress.ts`, `pnpm typecheck`, `pnpm test` exit 0.
- Browser/final parity evidence passes approved matrix; không commit/push.

**Status**: `[ ]`

---

## Milestone M4 — Final rerun and flagship approval

### [#P19M4T01] [/home/pi5/hermes-artifacts/cardelume/phase19/] `executeFinalSealedBenchmark(): FinalQualityEvidence`

**Goal**: Rerun full sealed protocol sau khi mọi pixel/prompt/model change đã freeze và chứng minh threshold cuối.

**Depends on**: `[#P19M2T04]`, `[#P19M3T02]`

**Parallel-safe**: `no`

**Owner/gate**: **Need approval** cho external model/human cost; fresh independent review bắt buộc.

**Context hiện có**:
- Baseline protocol/rater rules từ M1; candidate/config SHA từ M2/M3.

**Concrete changes**:
1. Freeze final source/config/catalog hash và rerun Final Golden với `N` brief (`100 ≤ N ≤ 150`) × 3.
2. Blind-score frozen subset/anchors bằng protocol cũ; aggregate trước reveal identities.
3. Verify Premium ≥8.0, WOW ≥7.5, originality ≥7.5, emotional fit ≥8.0, diversity ≥90% và zero material blocker.

**Constraints**:
- Không reuse baseline score cho changed output; không cherry-pick run; missing score là UNKNOWN.
- Không approve family trong task đo lường.

**Definition of Done**:
- Final summary + sealed review + compare report có exact hashes và all thresholds.
- Reviewer verdict `PASS` với zero Critical/Important; nếu fail quay lại M2 bằng hypothesis mới, không hạ gate.

**Status**: `[ ]`

---

### [#P19M4T02] [packages/templates/src/index.ts, quality/template-audit/PHASE19_FLAGSHIP_APPROVAL.json] `approveFlagshipVersions(ids): ApprovalPackage`

**Goal**: Chỉ đưa 6–8 exact immutable versions đủ evidence vào approved launch catalog; giữ production deployment blocked.

**Depends on**: `[#P19M4T01]`

**Parallel-safe**: `no`

**Owner/gate**: **Explicit owner creative approval required** trước source status mutation; không DB apply/deploy trong task.

**Context hiện có**:
- `templateEligible()` và showcase helpers chỉ cho production `launchStatus === "approved"`; hiện production-approved count là 0.
- Admin/DB approval đã yêu cầu benchmark/IP/human evidence nhưng Phase 21 mới apply live/staging runtime.

**Concrete changes**:
1. Tạo approval package mapping exact family/template/version → benchmark/IP/human/render/owner evidence.
2. Set chỉ 6–8 exact versions approved; all others giữ candidate/hold/rework/rejected.
3. Add regression proving production showcase non-empty only from approved exact versions and version change demotes approval.

**Constraints**:
- Không auto/AI-only approval; không approve family-level alias; không deploy hay mutate DB.
- Catalog phải diverse composition/type/material/color/energy/photo behavior.

**Definition of Done**:
- `node scripts/font-template-launch-readiness.mjs`, `node scripts/step17j-integration-source-stress.mjs`, `pnpm typecheck` exit 0.
- Approved count 6..8 and exact evidence complete; no production action; không commit/push.

**Status**: `[ ]`

---

## Milestone M5 — Product-proof package

### [#P19M5T01] [apps/web/content/product-proof.ts] `approvedProductProofCases(): ProductProofCase[]`

**Goal**: Tạo 3 case studies thật từ approved versions để Phase 20 trình bày `brief → 3 directions → final → JPG/PDF detail`.

**Depends on**: `[#P19M4T02]`

**Parallel-safe**: `no`

**New interface**:
~~~ts
interface ProductProofCase { id:string; locale:string; brief:string; directions:readonly [Proof,Proof,Proof]; final:Proof; provenance:"synthetic"|"owner"|"consented"; }
// VD: approvedProductProofCases().every(x => x.directions.length === 3)
~~~

**Context hiện có**:
- Homepage chưa có approved case-study data source; Phase 20 sẽ wire UI.

**Concrete changes**:
1. Chọn 3 distinct recipients/occasions, gồm ≥1 photo case, chỉ dùng synthetic/owner-authored/explicitly consented content.
2. Render exact approved template/version outputs và store optimized proof assets dưới `apps/web/public/proof/`.
3. Add source test cho provenance, exact version mapping, alt/caption data và no fabricated review/volume.

**Constraints**:
- Không customer identity/testimonial giả; consent artifact không chứa PII trong Git.
- Chưa đổi homepage/hero trong task này.

**Definition of Done**:
- `node scripts/product-proof-source-stress.mjs`, `pnpm typecheck`, `pnpm build` exit 0.
- 3 cases map exact approved versions, readable personalized copy và provenance hợp lệ; không commit/push.

**Status**: `[ ]`

---

**Phase 19 acceptance:** all Master Plan Phase 19 exit tokens are evidenced; failure/UNKNOWN cannot be converted to approval.

## Phase 20 — Buyer Confidence, Conversion and “Help me choose”

**Entry gate:** `PHASE19_EXIT_GATE` PASS. This phase may expose only approved product proof and watermarked reduced-resolution pre-payment previews.

## Milestone M1 — Honest premium marketing surface

### [#P20M1T01] [/home/pi5/hermes-artifacts/browser-evidence/cardelume/phase20-baseline/] `capturePhase20Baseline(sourceSha): BrowserBaseline`

**Goal**: Capture current desktop/tablet/mobile visual and performance evidence before any Phase 20 UI mutation.

**Depends on**: `PHASE19_EXIT_GATE`

**Parallel-safe**: `no`

**Owner/gate**: Mika browser operator; no source mutation.

**Context hiện có**:
- Master Plan fixes baseline root to `phase20-baseline/<git-sha>/`; historical editorial-hero screenshots are not valid current-layout evidence.

**Concrete changes**:
1. Start isolated local build/server only after prerequisites pass; capture homepage and Studio at `390×844`, `768×1024`, `1440×900`.
2. Record metrics.json, console/network errors, reduced-motion and current five-second value-comprehension result.
3. Hash screenshots/metrics and bind to source SHA.

**Constraints**:
- Không submit checkout/paid flow, không deploy, không re-baseline sau mutation nếu thiếu dated owner approval.
- Unreachable route hoặc missing sample là BLOCKED/UNKNOWN, không PASS.

**Definition of Done**:
- Baseline folder chứa three viewport screenshots + `metrics.json` + route/source SHA manifest.
- No source diff from capture; server lifecycle closed or explicitly handed off.

**Status**: `[ ]`

---

### [#P20M1T02] [apps/web/app/page.tsx, apps/web/components/product-proof-section.tsx] `ProductProofSection(props): JSX.Element`

**Goal**: Trưng 6–8 flagship và 3 approved proof cases, làm rõ digital purchase/delivery mà không đổi owner-approved hero layout.

**Depends on**: `[#P20M1T01]`, `[#P19M5T01]`

**Parallel-safe**: `no`

**Context hiện có**:
- `page.tsx` dùng `step17jShowcaseTemplatesForEnvironment`; gallery copy còn hardcoded English.
- Hero copy hiện có uncommitted owner-requested changes trong i18n; phải preserve, không revert.

**Concrete changes**:
1. Add ProductProofSection dưới hero, consume approved proof data và approved-only gallery.
2. Move every marketing/aria string vào `messages.ts`/`launch-copy.ts` cho 10 locales.
3. Place concise one-time payment, preview-before-pay, JPG/PDF, no-account and no-physical-shipping truth near CTA.

**Constraints**:
- Không đổi hero font size/layout/padding/card position; không fake social proof; không catalog marketplace UI.
- Responsive/a11y/reduced-motion required; no hardcoded English leak.

**Definition of Done**:
- `pnpm --filter @cardelume/web typecheck`, `pnpm test`, `pnpm build` exit 0.
- Browser comparison vs P20 baseline at 3 viewports: no overflow/console error; proof maps approved exact versions; không commit/push.

**Status**: `[ ]`

---

### [#P20M1T03] [apps/web/public/brand/og-card.png, apps/web/app/layout.tsx] `approvedOpenGraphProductProof(): Metadata`

**Goal**: Thay OG placeholder yếu bằng product-specific composition thể hiện personalized premium card thật.

**Depends on**: `[#P19M5T01]`

**Parallel-safe**: `yes`

**Owner/gate**: Owner visual approval required before replacing tracked brand asset.

**Context hiện có**:
- `og-card.png` là 1200×630 brand panel nhưng không chứng minh product; `layout.tsx` là metadata authority.

**Concrete changes**:
1. Produce 1200×630 candidate từ approved proof assets, preserving CardeLume brand hierarchy and legibility.
2. Verify crop at common social-preview sizes, dark/light host backgrounds and metadata URL.
3. Replace asset only after owner approval; add dimensions/hash/product-proof source assertion.

**Constraints**:
- Không fake UI/testimonial/rating; không dùng unapproved/unlicensed output.
- Small-size brand legibility and alt/metadata localization must remain clear.

**Definition of Done**:
- `pnpm build` exit 0; OG screenshot evidence at full and reduced size; metadata resolves same-origin approved asset.
- `git diff --check` pass; không commit/push.

**Status**: `[ ]`

---

## Milestone M2 — Private “Help me choose”

### [#P20M2T01] [apps/web/lib/generation-client.ts] `runGeneration(input): Promise<GenerationCompletion>`

**Goal**: Giữ authoritative generation job identity trong Studio để share issue có thể verify owner/result thay vì tin client payload.

**Depends on**: `PHASE19_EXIT_GATE`

**Parallel-safe**: `no`

**New interface**:
~~~ts
type GenerationCompletion={jobId:string|null;result:GenerationResult|null};
// VD: const {jobId,result}=await runGeneration(input); mock/fallback => jobId === null.
~~~

**Context hiện có**:
- `runGeneration()` hiện discard `jobId` và chỉ trả `GenerationResult|null`; `CardStudio` chỉ giữ `generatedResult`.
- `generationStatusForOwner(jobId,userId)` đã enforce owner server-side.

**Concrete changes**:
1. Update client return contract, mock/failure behavior and call sites.
2. CardStudio stores/clears `generationJobId` atomically with result; regenerate replaces identity.
3. Update `scripts/generation-fallback-stress.ts` for live/mock/abort/failure identity behavior.

**Constraints**:
- Không expose status token sau completion; không persist job ID outside current anonymous session UI.
- Help-me-choose disabled for fallback/mock/null identity.

**Definition of Done**:
- `pnpm exec tsx scripts/generation-fallback-stress.ts`, web typecheck và root tests exit 0.
- All consumers compile and stale job identity is impossible after regenerate/failure; không commit/push.

**Status**: `[ ]`

---

### [#P20M2T02] [packages/card-schema/src/index.ts] `HelpChooseIssueSchema / HelpChooseFeedbackSchema`

**Goal**: Define one shared, bounded schema for exactly three share directions and plaintext feedback.

**Depends on**: `PHASE19_EXIT_GATE`

**Parallel-safe**: `yes`

**New interface**:
~~~ts
type HelpChooseIssue={generationJobId:string;directions:readonly [HelpChooseDirection,HelpChooseDirection,HelpChooseDirection];photoShareAcknowledged:boolean};
type HelpChooseFeedback={directionId:"editorial"|"midnight"|"photo"|"quiet";note?:string}; // max 280
~~~

**Context hiện có**:
- `CheckoutCardSnapshotSchema` đã bound copy/template/photo fields; `GenerationResultSchema` luôn đúng 3 directions.

**Concrete changes**:
1. Compose share direction schema from checkout snapshot + exact direction/template/version identity.
2. Enforce three distinct direction IDs, complete template identities, bounded rationale and conditional photo acknowledgement.
3. Add schema stress for malformed IDs, duplicate directions, markup payload and >280 note.

**Constraints**:
- Không có raw brief, email, payment/recovery state, object URL, final asset hoặc HTML field.
- TemplateId/versionId required for every shared direction.

**Definition of Done**:
- New targeted schema stress + `pnpm --filter @cardelume/card-schema typecheck` + root tests exit 0.
- Schemas exported from `@cardelume/card-schema`; không commit/push.

**Status**: `[ ]`

---

### [#P20M2T03] [packages/db/migrations/0012_help_choose.sql, packages/db/src/help-choose.ts] `create/read/vote/revoke/purgeHelpChoose*()`

**Goal**: Add fail-closed DB lifecycle with token hash-only storage, owner isolation, feedback dedupe and exact-ID cleanup.

**Depends on**: `[#P20M2T02]`

**Parallel-safe**: `no`

**Owner/gate**: Migration candidate only; **do not apply to live/staging DB** in this task. Apply belongs to Phase 21 with backup/approval.

**New interface**:
~~~ts
createHelpChooseSnapshot(input): Promise<{snapshotId:string}>;
readHelpChooseByTokenHash(input): Promise<PublicSnapshot|null>;
upsertHelpChooseFeedback(input): Promise<void>;
revokeHelpChooseSnapshot(input): Promise<boolean>;
listHelpChooseCleanupCandidates(input): Promise<Array<{snapshotId:string;objectKeys:string[]}>>;
~~~

**Context hiện có**:
- Migrations end at `0011`; DB modules use `postgres` helpers and are exported by `packages/db/src/index.ts`.
- RLS pattern is server/service-role only; request buckets use DB time.

**Concrete changes**:
1. Add snapshot/direction/feedback tables, constraints/indexes/RLS with no anonymous policy and status/expiry immediate-deny predicate.
2. Enforce one active link per immutable snapshot, max 6 issues/card and 12/owner rolling 24h transactionally; replacement revokes old and uses new IDs/token hash.
3. Add repository functions for creator-only results, voter-hash upsert, owned ready-photo lookup and exact cleanup/purge; export module.

**Constraints**:
- Store SHA-256/HMAC token hash only; raw token/note/greeting/photo content never in logs/analytics.
- No ON DELETE path may lose object keys before cleanup; cleanup idempotent and exact-ID only.

**Definition of Done**:
- `pnpm --filter @cardelume/db typecheck` and new `scripts/help-choose-db-source-stress.ts` exit 0.
- Static SQL verifies constraints/RLS/rolling quota/revoke-replace/purge contract; no DB mutation; không commit/push.

**Status**: `[ ]`

---

### [#P20M2T04] [apps/web/lib/help-choose.server.ts] `issue/read/revoke/listHelpChoose*()`

**Goal**: Build server authority that cross-checks generation ownership, renders exact watermarked previews and never exposes private storage URLs.

**Depends on**: `[#P20M2T02]`, `[#P20M2T03]`

**Parallel-safe**: `no`

**New interface**:
~~~ts
issueHelpChooseShare(input): Promise<{snapshotId:string;token:string;expiresAt:string}>;
readHelpChooseShare(snapshotId:string,token:string): Promise<PublicSnapshot|null>;
readHelpChoosePreview(input): Promise<{bytes:Uint8Array;contentType:"image/jpeg"}|null>;
~~~

**Context hiện có**:
- `generationStatusForOwner` loads authoritative result; `buildCheckoutCardDocument` validates checkout snapshot.
- `renderProductionPreview` always watermarks/downscales; `R2ObjectStorage` supports private put/get/delete.

**Concrete changes**:
1. Cross-check owner job/result and exact direction/template versions; validate owned ready photo and acknowledgement.
2. Build deterministic CardDocument per direction, render max-long-edge 1200 preview, persist private objects under exact snapshot/direction keys.
3. Generate 32 random bytes, persist hash only, return raw token once; implement read/revoke/results and same-origin byte delivery.

**Constraints**:
- Preview and final use same CardDocument/render contract; only watermark/resolution differ.
- Never return signed/private R2 URL, clean JPG/PDF, raw brief or secret; partial write must compensate/delete exact objects.

**Definition of Done**:
- New server stress covers ownership mismatch, template mismatch, photo ownership, partial failure rollback, revoked/expired/tampered token and render parity.
- Web typecheck + root tests exit 0; không commit/push.

**Status**: `[ ]`

---

### [#P20M2T05] [apps/web/app/api/help-choose/] `POST issue/vote/revoke/results`

**Goal**: Expose bounded creator/recipient APIs with correct status codes, abuse controls and privacy-minimized analytics.

**Depends on**: `[#P20M2T01]`, `[#P20M2T04]`

**Parallel-safe**: `no`

**Context hiện có**:
- Existing routes use Zod, anonymous cookie UUID, `checkUserRateLimit`, `no-store` and generic public errors.
- Funnel enum currently has only `share_started`; migration 0012 must add six approved Help-me-choose events.

**Concrete changes**:
1. Add issue, feedback, revoke, creator-results and same-origin preview routes; creator routes require matching anonymous owner.
2. Add issue/open/vote rate kinds; retain transactional rolling 24h card/owner quotas from DB.
3. Extend DB/browser/API analytics enums with six Master Plan events and categorical IDs only.

**Constraints**:
- Token accepted only on public read/vote path and never logged/echoed after issue.
- All responses `Cache-Control: no-store`; generic 404/410 prevents enumeration; notes rendered/stored plaintext.

**Definition of Done**:
- New API contract stress covers 400/401/403/404/410/429, replay, quota, ownership and analytics redaction.
- `pnpm --filter @cardelume/web typecheck`, `pnpm test` exit 0; không commit/push.

**Status**: `[ ]`

---

### [#P20M2T06] [apps/web/app/h/[snapshotId]/[token]/page.tsx] `HelpChooseRecipientPage(): JSX.Element`

**Goal**: Cho recipient không cần account xem đúng 3 previews và gửi một lựa chọn + note tối đa 280 ký tự trên mobile/desktop.

**Depends on**: `[#P20M2T05]`

**Parallel-safe**: `no`

**Context hiện có**:
- Recovery page đã dùng `metadata.robots={index:false,follow:false,nocache:true}`; React text rendering tránh `innerHTML`.

**Concrete changes**:
1. Add server page + client selection component + localized copy/states for valid, expired, revoked, unavailable and submitted.
2. Add `noindex/nofollow/nocache`, `Referrer-Policy: no-referrer` for `/h/`, no-store and same-origin preview images.
3. Keyboard/radio semantics, visible focus, 44×44 targets, note counter and double-submit protection.

**Constraints**:
- Recipient cannot edit/regenerate/checkout/download/claim ownership; no raw brief/payment/recovery/object URL.
- Không `dangerouslySetInnerHTML`; token không đưa vào analytics or client logs.

**Definition of Done**:
- Web typecheck/build + targeted browser assert for selection/note/error/reduced-motion at 390 and 1440 widths.
- Headers/DOM prove noindex, no-referrer, no-store and exactly three watermarked previews; không commit/push.

**Status**: `[ ]`

---

### [#P20M2T07] [apps/web/components/help-choose-panel.tsx, apps/web/components/card-studio.tsx] `HelpChoosePanel(props): JSX.Element`

**Goal**: Add creator issue/copy/share/results/revoke UX without disturbing the existing progressive Studio flow.

**Depends on**: `[#P20M2T01]`, `[#P20M2T05]`, `[#P20M2T06]`

**Parallel-safe**: `no`

**Context hiện có**:
- `CardStudio` phases are `brief → revealing → results → finish → checkout`; generation result and photo state are client-side.

**Concrete changes**:
1. Add Help-me-choose action in results/finish only when authoritative job + exactly 3 eligible directions exist.
2. Require photo acknowledgement, issue/copy/Web Share fallback, creator aggregate results and revoke/replace controls.
3. Block regenerate until active share revoke succeeds; replacement always creates new snapshot/token; clear stale UI atomically.

**Constraints**:
- Không biến Studio thành wizard/marketplace/social feed; checkout remains independent.
- No raw token persistence beyond current UI state/clipboard action; no note content in analytics.

**Definition of Done**:
- Web typecheck/build/tests + browser assertions for issue/copy/Web Share fallback/results/revoke/regenerate-fail-closed.
- Existing brief→3 directions→finish→checkout path unchanged when feature unused; không commit/push.

**Status**: `[ ]`

---

### [#P20M2T08] [apps/worker/src/index.ts] `purgeExpiredHelpChooseSnapshots(): PurgeResult`

**Goal**: Purge revoked/expired/replaced snapshots, feedback, token hashes and R2 previews within 24h using exact IDs.

**Depends on**: `[#P20M2T03]`, `[#P20M2T04]`

**Parallel-safe**: `yes`

**Context hiện có**:
- Worker already schedules hourly `cleanup` and deletes photo objects before marking DB rows deleted.

**Concrete changes**:
1. Load bounded cleanup candidates containing exact snapshot/object IDs.
2. Delete every exact private object, then purge/mark exact DB rows only after object success; retry partial failures safely.
3. Log counts/status only, never token/note/copy/photo content; expose cleanup metrics in existing maintenance log.

**Constraints**:
- Không prefix/time-range delete; no broad DB cleanup; failed object deletion cannot be reported purged.
- Immediate read denial is DB status/expiry, independent of asynchronous hard purge.

**Definition of Done**:
- New cleanup stress proves idempotency, partial failure retry, exact IDs and ≤24h hourly schedule bound.
- Worker typecheck + root tests exit 0; không commit/push.

**Status**: `[ ]`

---

## Milestone M3 — Buyer-journey browser/security gate

### [#P20M3T01] [tests/browser-verify.sh, scripts/help-choose-e2e-assert.mjs] `verifyPhase20Journey(): EvidenceMatrix`

**Goal**: Verify final buyer journey, private-sharing threats, accessibility and performance against the frozen P20 baseline.

**Depends on**: `[#P20M1T02]`, `[#P20M1T03]`, `[#P20M2T06]`, `[#P20M2T07]`, `[#P20M2T08]`

**Parallel-safe**: `no`

**Owner/gate**: Isolated staging fixtures only; DB migration/apply and test-data writes require backup + explicit approval. Cleanup exact IDs after full matrix PASS.

**Context hiện có**:
- Required matrix: Chrome desktop, Firefox, iPhone Safari, mid Android; 390/768/1440; keyboard, screen reader, zoom, reduced motion.

**Concrete changes**:
1. Seed bounded synthetic owner/recipient fixtures and snapshot IDs; preserve baseline counts and exact cleanup manifest.
2. Exercise homepage→Studio→Help choose→vote→creator return→finish→checkout boundary plus expired/revoked/regenerated/tampered/replay/XSS/cache/referrer/rate-limit paths.
3. Capture screenshots, accessibility output, console/network log and LCP/INP/CLS/long-task deltas; restore exact fixtures and verify adjacent counts.

**Constraints**:
- Không paid checkout, customer data or production service; no cleanup before full acceptance PASS.
- Missing browser/field sample is UNKNOWN; no metric may regress >10% without dated owner re-baseline.

**Definition of Done**:
- Browser/security matrix has no P0/P1, no overflow/blocked action, 12px trust text, 44×44 targets, lab LCP≤2.5s/CLS≤0.1 and no key long task >200ms.
- `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm build`, `git diff --check` pass; exact fixture restore verified; no commit/push.

**Status**: `[ ]`

---

**Phase 20 acceptance:** all Master Plan Phase 20 exit tokens are evidenced; PLAN PASS is not staging/runtime/production approval.

## Phase 21 — Soft launch / optimization

- [ ] 21.1 Owner soft-launch approval
- [ ] 21.2 Limited real traffic
- [ ] 21.3 Funnel/cost/latency/template metrics
- [ ] 21.4 Support/refund/failure analysis
- [ ] 21.5 Fix P0/P1 issues
- [ ] 21.6 Tune AI/portfolio based on evidence
- [ ] 21.7 Public launch readiness review
- [ ] 21.8 Owner public launch approval

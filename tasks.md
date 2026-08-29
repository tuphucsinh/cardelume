# CardeLume WBS — Remaining Work

Canonical phase details: `MASTERPLAN.MD`.

Legend: `[ ]` not started · `[~]` in progress · `[x]` evidence complete · `[!]` blocked.

> Scope note (2026-08-29): only the detailed Phase 19/20 blocks below are regenerated against the current `MASTERPLAN.MD`. Phase 0/18/21 summaries are legacy, non-execution-ready notes until separately reconciled. Phase 19 may start only after the current Master Plan Phase 18 exit gate passes.

## Phase 0 — Pi5/Hermes import

- [ ] 0.1 Extract to `~/projects/cardelume`
- [ ] 0.2 Verify `PROJECT_SHA256SUMS.txt`
- [ ] 0.3 Attach Hermes Desktop Project / Lumer profile
- [ ] 0.4 Read AGENTS/HANDOFF/MASTERPLAN
- [ ] 0.5 Run FAST/RELEASE/STATUS source checks
- [ ] 0.6 Initialize/verify Git remote and clean baseline commit
- [ ] 0.7 Create staging `.env` outside Git

**Milestone acceptance:** package integrity + source suites pass; clean Git state; no production secret.

## Phase 18 — Controlled runtime

### 18.1 Dependency freeze
- [ ] Generate candidate `pnpm-lock.yaml`
- [ ] Review dependency graph/install scripts/native packages
- [ ] Commit reviewed lock
- [ ] Clean frozen install PASS

### 18.2 Semantic build
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] `pnpm test`
- [ ] RELEASE PASS
- [ ] HEAVY locally executable gates PASS

### 18.3 Supply chain
- [ ] Release SBOM
- [ ] Vulnerability scan
- [ ] Secret scan
- [ ] Dependency remediation/acceptance log

### 18.4 Staging DB/RLS
- [ ] Staging DB backup
- [ ] Migrations 0001→0011
- [ ] Schema/trigger verification
- [ ] RLS user A/user B/service/admin matrix
- [ ] IDOR/authorization tests

### 18.5 Queue/worker
- [ ] pg-boss start/enqueue/complete
- [ ] retry/idempotency
- [ ] heartbeat/readiness
- [ ] crash/stale worker test
- [ ] concurrency/backlog measurement

### 18.6 R2/photo
- [ ] quarantine upload
- [ ] sanitize/re-encode
- [ ] ownership/capability checks
- [ ] adversarial upload cases
- [ ] retention/cleanup

### 18.7 Dodo/payment/recovery
- [ ] test checkout
- [ ] valid webhook → PAID
- [ ] webhook replay no duplicate fulfillment
- [ ] wrong amount/currency/session rejection
- [ ] invalid/stale signature rejection
- [ ] JPG/PDF entitlement
- [ ] recovery after tab/browser closure

### 18.8 Real AI/Golden
- [ ] 150 briefs × 3 runs/model
- [ ] latency/token/cost capture
- [ ] human Premium/WOW scoring
- [ ] 3-direction diversity scoring
- [ ] fallback/failure analysis
- [ ] production model/prompt decision

### 18.9 Template owner gate
- [ ] shortlist blind review
- [ ] Premium/WOW approval evidence
- [ ] originality/similarity evidence
- [ ] Golden evidence
- [ ] locale/render evidence
- [ ] approve ~6–8 launch families only after all evidence

### 18.10 Fonts/localization
- [ ] exact browser font hashes/licenses
- [ ] exact renderer font hashes/licenses
- [ ] EN/VI/JA/KO/ZH native QA
- [ ] browser↔final render parity

### 18.11 Browser/a11y/performance
- [ ] Chrome
- [ ] Firefox
- [ ] iPhone Safari
- [ ] mid Android
- [ ] keyboard path
- [ ] screen-reader checks
- [ ] reduced motion
- [ ] zoom
- [ ] Lighthouse/Core Web Vitals
- [ ] slow-device/network perceived performance

### 18.12 Security runtime/restore
- [ ] CSP Report-Only validation
- [ ] CSP enforce
- [ ] Cloudflare Access admin validation
- [ ] rate-limit validation
- [ ] logs/PII/secrets validation
- [ ] secret scope/rotation rehearsal
- [ ] isolated DB restore rehearsal

**Step18 acceptance:** every material runtime category has explicit evidence; no fabricated PASS.

## Phase 19 — Premium/WOW Improvement and Product Truth

**Entry gate:** current `MASTERPLAN.MD` Phase 18 exit gate is fully evidenced. No task below may auto-approve a template, spend on external model calls, recruit human raters or mutate a live catalog without its named approval gate.

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

**Status**: `[ ]`

---

### [#P19M1T02] [/home/pi5/hermes-artifacts/cardelume/phase19/] `executeSealedBaseline(): BaselineEvidence`

**Goal**: Chạy baseline real-model 150 briefs × 3 và blind human review để đo trạng thái thật, không dùng baseline làm approval.

**Depends on**: `[#P19M1T01]`

**Parallel-safe**: `no`

**Owner/gate**: **Need approval** trước external model cost và trước khi giao output cho ≥5 independent raters; Reviewer kiểm tra sealed aggregation.

**Context hiện có**:
- `scripts/premium-benchmark-runner.ts` hỗ trợ `--require-real-model`, repeat/limit/offset, budget attribution và JSONL.
- `scripts/premium-benchmark-lab.mjs` sinh review sheet và deterministic summary.

**Concrete changes**:
1. Chốt experiment/budget ID, source SHA, provider/model/config hash và artifact root `/home/pi5/hermes-artifacts/cardelume/phase19/<source-sha>/baseline/`.
2. Chạy real-model 150 briefs × 3, sinh anonymized review sheets, trộn frozen anchors và thu sealed individual scores.
3. Aggregate sau khi đủ score; ghi redacted summary + PASS/FAIL/UNKNOWN, không sửa source trong task này.

**Constraints**:
- Không chạy nếu thiếu cost approval, independent roster/conflict declaration hoặc Phase 18 eligibility gate.
- Không để owner/developer chấm human subset; không hạ threshold; không đưa raw PII/customer content vào artifact.

**Definition of Done**:
- `pnpm exec tsx scripts/premium-benchmark-runner.ts --require-real-model --repeat 3 --limit 150 --out <artifact>/baseline.jsonl` hoàn tất theo approved budget.
- `pnpm benchmark:summarize -- <run.jsonl> <sealed-review.csv> <summary.json>` tạo deterministic summary; failure đầu tiên được giữ nguyên.
- Evidence có Premium/WOW/originality/emotional-fit/diversity, latency/cost/fallback; không commit/push.

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
1. Freeze final source/config/catalog hash và rerun 150 × 3.
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

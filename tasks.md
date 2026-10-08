# CardeLume WBS — CL2 Generation Recovery & Premium UX (current authority)

**Canonical editable plan:** `.ai/MASTER_PLAN.md`; `MASTERPLAN.MD` is a required byte-identical mirror.
**Updated:** 2026-10-08 · **Base:** `cl2-release` forked from `origin/main` = `e476ad71780413e0b5658f872d4dbdd6a9d32dd5`
**Default executor:** Agy (`gemini-3.8-flash-high`) · **Review:** fresh `reviewer` for CONTROLLED.
Legend: `[ ]` pending · `[~]` active · `[x]` verified · `[!]` blocked.

Prior Phase 21R / CL-* history is preserved on the `origin/main` line and in `/home/pi5/hermes-artifacts/`; it is evidence, not an active queue. Local `main` (`a73546a`) and its dirty tree are frozen for OWNER-01 and are not a working surface.

Runner standard: inspect current source before editing; edit only files required by the task; preserve payment/security/template-approval/private-asset boundaries; run the declared focused checks and `git diff --check`; stop on a missing prerequisite, unrelated dirty-path collision or destructive ambiguity. Runner never edits `tasks.md`, `AGENTS.md`, `.ai/*`, `.state/*`.

`V(file)` = `TSX_DISABLE_CACHE=1 node --import tsx scripts/<file>` (`.ts`) or `node scripts/<file>` (`.mjs`).
Root gate = `pnpm run test && pnpm run lint && pnpm run typecheck && pnpm run build`.
Evidence root: `/home/pi5/hermes-artifacts/cardelume-cl2/<TASK-ID>/`.
Live provider jobs, candidate deploy, runtime config change and push to `origin/main` each require explicit owner approval.

---

### [ ] [#CL2-CTRL-01] Control-plane bootstrap and durable state reconciliation
Priority: P0 | Tier: control/FAST | Depends: [] | Owns (Mika): `cl2-release` control files + `.state/agent-state.json` | Locks: [control]
**Goal:** one clean control authority on the deployed base without touching the frozen canonical dirty tree.
**Changes:** create `cl2-release` control worktree from `e476ad7`; write the CL2 WBS; populate `.ai/PROJECT_TOOLING.md`; append CL2 decisions; refresh `HANDOFF.md`; reconcile `.state/agent-state.json` under lock (`remote_main_head`/`deployed_sha` → `e476ad7`, `canonical_head`/`BASE_SHA` → `e476ad7`, `active_task=null`, reservations empty).
**DoD:** `MASTERPLAN.MD` byte-identical to `.ai/MASTER_PLAN.md`; state read-back equals observed Git; control commit created locally (push deferred to CL2-REL-01).

### [ ] [#CL2-GEN-01] Locale-aware set-level copy contract and minimal repair
Priority: P0 | Tier: CONTROLLED | Depends: [CL2-CTRL-01] | Owns: `packages/ai/src/index.ts`, `packages/ai/package.json`, `scripts/generation-quality-contract.ts` | Locks: [ai-core]
**Goal:** stop the deterministic safe-failure for realistic briefs and support all 10 locales without robotic or foreign rewrite.
**Changes:** (1) set-level contract — occasion anchor in ≥2/3 cards, recipient (if supplied) in ≥2/3, feeling satisfied by anchors at set level (≥1 card), detail in ≥1 card; remove `moment`/`glow` from generic-collapse; keep cliché and `direction_copy_duplicate`; (2) locale-aware anchors for en, vi, ja, ko, zh, es, fr, de, pt, it; (3) `repairSemanticCopyContract` minimal + same-language: patch only the missing anchor in that card, never overwrite `creativeThesis`/`customerRationale`, never inject a different language; (4) diversity jaccard computed with user inputs stripped; (5) director and critic prompts state the set-level contract; (6) wire `packages/ai` `test` to the new suite.
**DoD:** `pnpm --filter @cardelume/ai test` exits 0 with the new suite; the suite fails when the repair fix is reverted (negative control); natural-copy fixtures for 10 locales pass; G1–G4/P1/P2 replicas raise no `creative_range` from repair alone; negative fixtures still flagged; thresholds `.62`/`.68` unchanged; root test/lint/typecheck PASS; `git diff --check`; fresh CONTROLLED review PASS.

### [ ] [#CL2-GEN-02] Premium deterministic fallback and recovery provenance
Priority: P0 | Tier: CONTROLLED | Depends: [CL2-GEN-01] | Owns: `packages/ai/src/index.ts`, `packages/ai/src/fallback-copy.ts` (new), `packages/card-schema/src/index.ts`, `apps/worker/src/index.ts`, `scripts/generation-quality-contract.ts` | Locks: [ai-core]
**Goal:** the customer-facing recovery path is premium-grade, localized and honest.
**Changes:** localized curated copy bank (en/vi full; 8 others concise) keyed by occasion family × slot voice; name optional; detail woven naturally into exactly one card; relationship = tone only; capitalized headlines; per-template `creativeThesis`; optional `GenerationResult.generationSource: "ai"|"recovery"`; worker sets it and logs `generationSource` + `criticUsed`.
**DoD:** every matrix brief × 10 locales yields `creativeQualityRisks = []` for the deterministic fallback with `portfolioV2AllTemplates` and with the live recovery sets; forbidden strings absent (`Detail to carry through`, `This is for your`, `Người nhận là`, `Chi tiết bạn gửi`, lowercase-start headline, English tokens inside VI copy); detail appears once; `generation-fallback`/`bounded-recovery`/diversity scripts PASS; root gates; fresh review PASS.

### [ ] [#CL2-API-01] Customer-safe status payload and template-events 403
Priority: P1 | Tier: CONTROLLED | Depends: [CL2-GEN-02] | Owns: `apps/web/app/api/generate/[jobId]/route.ts`, `apps/web/app/api/templates/events/route.ts`, `apps/web/lib/template-event-token.server.ts`, `scripts/api-payload-hygiene-stress.ts` (new) | Locks: []
**Goal:** stop leaking internal reasoning/scores to the browser; restore the template-events endpoint used on every result.
**Changes:** whitelist direction fields returned to the browser (drop `creativeThesis`, `confidence`, `noveltyScore`, `wowScore`, `riskCodes`); reproduce the 403 with a captured UI event on the candidate and fix the root cause without weakening token verification.
**DoD:** hygiene stress asserts dropped fields absent, valid event → 2xx, forged token → 4xx; `card-studio` consumers unchanged (typecheck); root gates; fresh review PASS.

### [ ] [#CL2-UX-01] Customer copy, recovery UX and style names
Priority: P1 | Tier: STANDARD | Depends: [CL2-GEN-02] | Owns: `apps/web/components/card-studio.tsx`, `apps/web/i18n/messages.ts`, `apps/web/i18n/launch-copy.ts`, `apps/web/i18n/display-copy.ts`, `scripts/cl2-copy-ux-stress.ts` (new) | Locks: []
**Goal:** no mixed-language or robotic customer copy; every resolved style shows its real name.
**Changes:** English `footerTagline`; recovery copy is system-side, no `anh`/`Brief`, with an explicit retry action; show the fallback notice when `generationSource==="recovery"`; natural VI studio title and VI recipient placeholder; display-name mapping for all active/candidate/experiment templates × 10 locales (no `Direction 0N` when a name exists); remove the `stagingNotice` customer string.
**DoD:** copy stress (no Italian in EN, no English leak in VI, no placeholder) + customer-copy-localization + corrective-i18n/polish PASS; browser check EN/VI 390/1440; root gates.

### [ ] [#CL2-UI-01] Card typography and ornament fit with preview/export parity
Priority: P1 | Tier: STANDARD | Depends: [CL2-CTRL-01] | Owns: `apps/web/app/globals.css` (card typography/ornament rules), `apps/web/components/card-visual.tsx`, `apps/web/components/magic-typography.ts`, `packages/renderer/src/template-layout.ts`, `scripts/preview-template-parity-stress.ts`, `scripts/renderer-export-stress.ts` | Locks: [candidate-browser]
**Goal:** no word broken mid-word and no ornament intersecting text, in preview and in exported files.
**Changes:** replace `overflow-wrap:anywhere` with word-safe wrapping plus size fitting; reserve or move ornament space; mirror in the renderer layout; CJK/hangul rules untouched.
**DoD:** DOM check over 16 templates × 5 formats × EN/VI long names shows zero intra-word breaks and zero ornament∩text; preview-parity + renderer-export stress PASS; JPG/PDF visual check; screenshots 390/768/1440.

### [ ] [#CL2-UI-02] Homepage proof, gallery and footer email
Priority: P1 | Tier: STANDARD | Depends: [CL2-UX-01] | Owns: `apps/web/components/product-proof-section.tsx`, `apps/web/app/page.tsx` | Locks: [candidate-browser]
**Goal:** the marketing proof surface looks premium and leaks nothing internal.
**Changes:** size proof cards inside their article so labels are never covered; remove `Curated design · exact template identity · Ref · ID · v`; ≥6 distinct existing copy keys across the 8 gallery samples; wrap the footer support email in `<!--email_off-->` so Cloudflare stops rewriting the `mailto:`.
**DoD:** card rect ∩ label rect = ∅ at 390/768/1440; no `Ref:`/`ID:`/`template identity`; ≥6 distinct gallery headlines; no CSP console error; public HTML retains `mailto:` (verified in CL2-E2E-01); screenshots.

### [ ] [#CL2-UI-03] Studio form and accessibility polish
Priority: P2 | Tier: STANDARD | Depends: [CL2-UI-01, CL2-UX-01] | Owns: `apps/web/app/globals.css` (studio/form/footer rules), `apps/web/components/card-studio.tsx` (markup/aria only) | Locks: [candidate-browser]
**Goal:** the brief form is comfortable and accessible on all three viewports.
**Changes:** full-width detail textarea, remove the reserved empty gap in the optional panel; VI relationship placeholder not truncated at 768; footer links ≥44px tap target on mobile; hidden photo input not exposed before H1.
**DoD:** screenshots 390/768/1440 EN/VI; tap-target probe ≥44px; form labels/aria check; root gates.

### [ ] [#CL2-PERF-01] Fonts and cumulative layout shift
Priority: P1 | Tier: STANDARD | Depends: [CL2-CTRL-01] | Owns: `apps/web/app/layout.tsx`, `apps/web/app/font-metrics.css` (new) | Locks: [candidate-browser]
**Goal:** no layout jump on load and no unused CJK font payload for Latin locales.
**Changes:** size-adjusted fallback faces / preload for the Vietnamese subsets; load CJK font CSS only for ja/ko/zh.
**DoD:** CLS ≤ 0.1 for {home,create}×{390,768,1440}×{en,vi} (2 samples, median if spread >5%); VI tablet /create from ~0.35 → ≤0.1; LCP ≤ baseline+10%; no CJK font CSS requested on en/vi; ja/ko/zh glyph smoke renders.

### [ ] [#CL2-OPS-01] Pin the AI model version (runtime config) — APPROVAL REQUIRED
Priority: P1 | Tier: CONTROLLED | Depends: [CL2-GEN-02] | Owns: `/home/pi5/.config/cardelume/run-worker.sh` (AI_MODEL only), `config/environments/staging.env.example`, `config/environments/production.env.example` | Locks: [staging-runtime, provider-canary]
**Changes:** look up the current stable pinned Gemini flash-lite model id (official docs, at execution time); byte backup + sha256; set `AI_MODEL`; restart worker inside the E2E window.
**DoD:** bounded canary 2 jobs reach `ready`; telemetry model equals pinned id; rollback = restore exact bytes + restart.

### [ ] [#CL2-E2E-01] Live candidate golden matrix — APPROVAL REQUIRED
Priority: P0 | Tier: CONTROLLED | Depends: [CL2-GEN-01, CL2-GEN-02, CL2-API-01, CL2-UX-01, CL2-UI-01, CL2-UI-02, CL2-UI-03, CL2-PERF-01, CL2-OPS-01] | Owns: none in repo (harness under evidence dir) | Locks: [staging-runtime, provider-canary, browser, candidate-browser]
**Matrix:** 12 briefs × {desktop 1440, mobile 390}; EN/VI heavy (birthday+detail, anniversary+detail, thank-you, congratulations, new baby, custom occasion+feeling, photo) + one each ja/ko/zh/es/fr/de/pt/it; Show More ×2 on 4 cases; JPG+PDF on 4.
**DoD:** ready=100%, safe_failure=0, AI-primary ≥85%, recovery ≤15%, critic ≤38%, 3 distinct identities + distinct copy per result, no meta labels/mixed language; A3/A4/A5 browser checks on the deployed candidate SHA; correlated with worker logs + `generation_ai_usage`. On failure: one bounded repair round, else HALTED + rollback runtime to `e476ad7`.

### [ ] [#CL2-REL-01] Fresh independent review and publish — APPROVAL REQUIRED
Priority: P0 | Tier: CONTROLLED | Depends: [CL2-E2E-01] | Owns: Mika integration WT only | Locks: [staging-runtime]
**DoD:** fresh `reviewer` PASS bound to the exact candidate SHA; fast-forward push of the release line to `origin/main`; read back `origin/main` = runtime = public health SHA; `PAYMENT_MODE=off`; rollback target `e476ad7`.

### [ ] [#CL2-DONE] Closure
Depends: [CL2-REL-01] | Mika. HANDOFF ≤15 lines, terminal state, worktrees/disposable roots reconciled, anh-owned dirty tree reported untouched.

---

## Owner decisions (non-blocking; not agent-executable)

- **OWNER-01:** canonical dirty tree holds unpushed work absent from `origin/main` (template-admin activity/preview/auth routes, migration `0012_template_admin_activity.sql`, 36 differing tracked files, prior CL closure control records). Decide integrate / archive / discard.
- **OWNER-02:** production eligibility = 0 approved templates (7 candidate / 12 experiment / 9 hold); public runs `appEnv=staging`. Paid/production launch stays `NO_GO` until a flagship set passes human/IP/Golden approval.

## Deferred queue — do not execute
Dodo/payment activation · Oracle failover · Help me choose · accounts/subscriptions · catalog expansion · DNS/Cloudflare zone changes.

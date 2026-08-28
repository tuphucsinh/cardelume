# CardeLume WBS — Remaining Work

Canonical phase details: `MASTERPLAN.MD`.

Legend: `[ ]` not started · `[~]` in progress · `[x]` evidence complete · `[!]` blocked.

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

## Phase 19 — Pi5 + Oracle/VPS HA

- [ ] 19.1 ARM64 image build/run
- [ ] 19.2 AMD64 image build/run
- [ ] 19.3 Pi5 web/worker/watchdog/tunnel
- [ ] 19.4 Oracle/VPS fallback node
- [ ] 19.5 Pi off → fallback PASS
- [ ] 19.6 fallback off → Pi PASS
- [ ] 19.7 home Internet loss
- [ ] 19.8 app/worker/tunnel crash matrix
- [ ] 19.9 shared dependency outage behavior
- [ ] 19.10 rolling deploy
- [ ] 19.11 backup/restore/node rebuild rehearsal

## Phase 20 — Optional Lume Account (conditional)

- [ ] 20.0 Confirm evidence justifies account work; otherwise SKIP
- [ ] passwordless auth
- [ ] anonymous order claim
- [ ] My Cards
- [ ] cross-device recovery
- [ ] opt-in style memory
- [ ] delete/export/reset
- [ ] RLS/auth/claim E2E

## Phase 21 — Soft launch / optimization

- [ ] 21.1 Owner soft-launch approval
- [ ] 21.2 Limited real traffic
- [ ] 21.3 Funnel/cost/latency/template metrics
- [ ] 21.4 Support/refund/failure analysis
- [ ] 21.5 Fix P0/P1 issues
- [ ] 21.6 Tune AI/portfolio based on evidence
- [ ] 21.7 Public launch readiness review
- [ ] 21.8 Owner public launch approval

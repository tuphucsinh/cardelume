# CARDELUME — Master Product, Architecture & Production Spec v7

> **Mục tiêu cốt lõi:**  
> Xây dựng **CardeLume** — webapp/app chuyên tạo **thiệp chúc mừng bằng AI** thật đơn giản, đẹp, cao cấp, chạy tốt trên mobile/tablet/PC, hướng đến thị trường quốc tế, không bắt đăng ký, không subscription, chỉ trả tiền cho tấm thiệp người dùng thực sự thích.
>
> **Brand tagline:** **Make their moment shine.**  
> **Hero promise:** **Beautiful cards, made in moments.**
>
> **Product principle:**  
> **The user tells us the occasion. We do the design. They only pay when they love the card.**

---


## Revision v7 — Lumer AI Operations, Premium Benchmark, Experiment Governance, IP/Security & Loyalty Layer

v7 does **not** replace the Step 13 AI Creative Director implementation. It defines the operating system around it so CardeLume can be managed safely by AI on the Raspberry Pi 5 and later reused across the Lume product family.

The operating principle is:

> **Lumer manages the system; CardeLume remains the product; production remains approval-gated.**

v7 adds these authority domains:

- **Lumer** — a dedicated Hermes profile for the Lume family, with isolated config, memory, sessions, skills and secrets from other Hermes profiles;
- **project-local CardeLume skills** — version-controlled under `.hermes/skills/` so CardeLume-specific creative, release, security and IP procedures travel with the repository;
- **Premium Benchmark Lab** — a Golden Card Set, human quality rubric, repeatability/diversity tests and model/prompt/template comparisons before production changes;
- **Experiment / Staging Lab** — feature flags, isolated data/services, bounded AI budgets, promotion gates and rollback evidence;
- **IP & Copyright Governance** — verifiable provenance for every production font, image, ornament, template and generated asset; unknown license is a hard publish failure;
- **Security Governance** — OWASP ASVS 5.0 Level 2 as the baseline target for the customer-facing application, plus selected higher-assurance controls for payment, admin, recovery, secrets and production operations;
- **Lume Control Center** — a privacy-minimized internal operating surface for health, creative quality, template portfolio, commerce, economics, security and experiments;
- **Optional Lume Account** — a post-core, feature-flagged loyalty layer for My Cards and opt-in style memory while anonymous creation/purchase remains first-class;
- **AI operating authority matrix** — Lumer may autonomously inspect, research, propose, edit experiment branches and operate staging within policy; production-impacting or destructive actions remain explicit-approval gated.

Canonical v7 documents:

```text
docs/MASTER_SPEC_V7.md
docs/ARCHITECTURE_V7_LUMER_OPERATIONS.md
docs/LUMER_PROFILE_SPEC_V1.md
docs/LUMER_SKILLS_TOOLKIT_SPEC_V1.md
docs/PREMIUM_BENCHMARK_LAB_SPEC_V1.md
docs/EXPERIMENT_STAGING_LAB_SPEC_V1.md
docs/IP_COPYRIGHT_GOVERNANCE_SPEC_V1.md
docs/SECURITY_GOVERNANCE_SPEC_V1.md
docs/OPTIONAL_LUME_ACCOUNT_SPEC_V1.md
docs/ROADMAP_V7.md
```

Where v7 operational/governance language conflicts with an older plan, **v7 wins**. Where a code-path claim conflicts with the frozen Step 13 validation report, **the Step 13 validation evidence wins** until the newer item is actually implemented and validated.

### v7 product invariant

Customer UX remains deliberately simple:

```text
small brief
→ CardeLume + premium AI
→ 3 premium directions
→ minimal finishing
→ pay once
→ secure final
```

Lumer, benchmark tooling, research, admin, experiments and operations are **internal capability**, not customer-facing complexity.

---

## Revision v5 — Managed Template Intelligence & Market-Aware Art Direction

v5 keeps every locked production rule from v4 and formally adds the Step 12 managed-template architecture.

The new product rule is:

> **The template system becomes more powerful behind the scenes while customer choice remains intentionally small and curated.**

Step 12 adds:

- managed Template Families,
- managed Template identities,
- immutable Template Versions,
- market / occasion / feeling affinities,
- script / format / text-capacity compatibility,
- deterministic ranking before AI,
- 3 diverse AI template assignments,
- customer discovery capped at **4 Recommended + 4 Market Picks + up to 8 More**,
- admin create / duplicate / edit / version / publish / archive,
- exact template-version checkout pinning,
- privacy-safe template analytics,
- signed template analytics capabilities,
- normalized performance scoring rather than raw usage count,
- daily metrics rollup + finite raw-event retention,
- production readiness checks for catalog coverage.

The authoritative detailed feature spec is:

```text
docs/TEMPLATE_SYSTEM_SPEC_0.4.3_STEP12.md
docs/TEMPLATE_API_CONTRACTS_0.4.3_STEP12.md
docs/TEMPLATE_ADMIN_RUNBOOK_0.4.3_STEP12.md
docs/TEMPLATE_RANKING_ANALYTICS_0.4.3_STEP12.md
docs/TEMPLATE_ROLLOUT_MIGRATION_0.4.3_STEP12.md
```

Where an older template-related passage conflicts with that Step 12 spec, **Step 12 wins**.

### v5 product invariant

Normal customer flow remains:

```text
small brief
↓
AI + CardeLume template intelligence
↓
3 premium directions
↓
choose
↓
minimal finishing
↓
pay once
↓
secure JPG/PDF
```

The catalog is **not** moved in front of the brief and CardeLume does **not** become Canva.

---

## Revision v4 — Free HA Launch Architecture + Paid Upgrade Path

Bản này khóa kiến trúc launch theo nguyên tắc:

> **Pi5 hoặc VPS chỉ cần một trong hai còn hoạt động thì website vẫn phải phục vụ được.**

### Phase 1 — Launch HA miễn phí

Dùng:

- **Cloudflare = DNS/CDN/WAF/TLS**
- **1 Cloudflare Tunnel UUID**
- **2 `cloudflared` replicas dùng cùng Tunnel UUID**
  - replica trên Raspberry Pi 5
  - replica trên VPS
- **local application health watchdog trên từng node**
- **Supabase = PostgreSQL + Anonymous Auth + RLS**
- **Cloudflare R2 = object storage**
- **Dodo Payments = Merchant of Record**
- **pg-boss = durable job queue**
- **SVG + resvg + Sharp = deterministic renderer**
- **Docker Compose + GHCR multi-arch = deployment**

Launch **không phụ thuộc Cloudflare Workers Free làm failover router** và **không bắt buộc mua Cloudflare Load Balancer**.

### Phase 1.5+ — Paid HA upgrade

Khi cần:

- Pi phải là primary rõ ràng
- VPS chỉ fallback
- health monitor ở Cloudflare edge
- traffic steering
- weighted/active-active origins
- nhiều VPS origins

nâng cấp routing layer thành:

> **2 independent Cloudflare Tunnels + Cloudflare Load Balancer**

Application architecture không đổi.

---

## Production rules

> Pi5 và VPS là **stateless compute nodes**.  
> Không node nào là nơi duy nhất giữ dữ liệu business-critical.

> **Public web không phụ thuộc WireGuard.**

> **Cloudflare Worker không nằm trên critical request path của Phase 1 HA.**

---

## Failure objective — Phase 1 Free HA

| Failure | Expected behavior |
|---|---|
| Pi5 power-off | Pi tunnel replica mất → VPS replica tiếp tục phục vụ |
| Home Internet down | Pi replica disconnect → VPS phục vụ |
| VPS down | VPS replica mất → Pi replica tiếp tục phục vụ |
| VPS datacenter/network down | Pi phục vụ |
| Pi app crash | local watchdog loại Pi replica khỏi tunnel cho đến khi app phục hồi |
| VPS app crash | local watchdog loại VPS replica khỏi tunnel |
| WireGuard down | không ảnh hưởng public web |
| Một node deploy/restart | node còn lại phục vụ |
| Cả Pi + VPS down | dynamic website unavailable; CDN-cached public assets có thể vẫn phục vụ |
| Supabase/R2/Dodo outage | cả hai compute node đều bị ảnh hưởng; graceful-degrade theo dependency |

### Trade-off của free HA

Shared Tunnel replicas **không đảm bảo Pi là primary**.

Cloudflare có thể đưa request tới Pi hoặc VPS tùy tunnel routing/network locality.

Điều này chấp nhận được ở Phase 1 vì:

- web layer nhẹ
- app stateless
- DB/storage external
- VPS worker concurrency được giới hạn thấp
- static assets được CDN phục vụ

Khi cần traffic steering chính xác:

> upgrade sang Cloudflare Load Balancer.

---

# 1. Định vị sản phẩm

### Phase 1
**AI Greeting Cards**

Tập trung tuyệt đối vào:
- Sinh nhật
- Tình yêu
- Kỷ niệm
- Cảm ơn
- Xin lỗi
- Chúc mừng
- Tốt nghiệp
- Tân gia
- Khai trương
- Mừng thọ
- Các ngày lễ theo từng thị trường
- Seasonal greetings

### Phase 2
**AI Invitations**
- Birthday invitation
- Wedding invitation
- Baby shower
- Housewarming
- Opening event
- Corporate event
- Online invitation page
- RSVP
- Guest list
- QR / map / event details

### Không cạnh tranh trực tiếp với
- Canva về editor
- Midjourney về image generation
- Evite/Greenvelope về event management ở Phase 1

### Lợi thế cần xây
1. **Extreme simplicity**
2. **Premium art direction**
3. **Cultural intelligence theo từng thị trường**
4. **Pay-per-card**
5. **Không cần tài khoản**
6. **AI nằm phía sau UX, không bắt user học prompt**

---


# 1A. Brand Identity — CARDELUME

## Tên thương hiệu

> **CARDELUME**

Ý nghĩa thương hiệu:

- **CARD** → sản phẩm cốt lõi: greeting cards / invitations
- **LUME** → light / illumination / glow
- Tinh thần: một tấm thiệp đẹp giúp **làm bừng sáng một khoảnh khắc có ý nghĩa**

Brand phải tạo cảm giác:

> **Modern Premium + Warm Emotion**

Không quá:
- wedding/floral
- feminine
- cổ điển
- tech/AI startup

Mục tiêu là một thương hiệu consumer quốc tế:
- tinh tế
- cảm xúc
- dễ nhớ
- hiện đại
- premium
- phù hợp cả nam/nữ/corporate
- mở rộng tốt từ Greeting Cards sang Invitations

---

## Logo direction — Final concept

Chọn hướng:

> **Open Card + Light**

Biểu tượng gồm:

- một tấm thiệp **đang mở rõ ràng**
- đường nét cực tối giản
- một điểm sáng / sparkle nhỏ ở chính giữa
- không dùng starburst nhiều tia
- không dùng hoa lá
- không dùng robot/chip/magic wand
- AI chỉ được gợi ý rất nhẹ bằng ánh sáng/sparkle

Ý nghĩa:

### Open Card
Thể hiện trực tiếp:
- greeting card
- invitation
- opening a meaningful message
- human connection

### Light / Spark
Thể hiện:
- **Lume**
- creativity
- emotion
- celebration
- một chút AI magic

Logo phải vẫn nhận ra ở:
- favicon
- app icon
- PWA icon
- watermark
- website header
- social avatar
- dark/light mode
- kích thước rất nhỏ

Nguyên tắc:

> **Simple enough to remember. Premium enough to trust. Clear enough to understand.**

---

## Visual language

### Primary colors

- **Deep Navy / Dark Ink**
- **Ivory / Warm White**
- **Champagne Gold** chỉ dùng làm accent

Gold phải:
- restrained
- tinh tế
- không gradient bóng kiểu “cheap luxury”

### Typography

Wordmark:
- elegant high-contrast serif
- letter spacing rộng vừa phải

UI:
- clean sans-serif
- dễ đọc
- mobile-first

Ưu tiên font open-source / Google Fonts có license thương mại rõ ràng.

---

## Final Brand Tagline

> ### **Make their moment shine.**

Vai trò:
- slogan thương hiệu dài hạn
- emotional
- ngắn
- dễ nhớ
- gắn trực tiếp với “Lume”
- không phụ thuộc công nghệ AI

Tinh thần tiếng Việt:

> **Làm khoảnh khắc của họ bừng sáng.**

---

## Final Homepage Hero

### Headline

> # **Beautiful cards, made in moments.**

Ý nghĩa:

> **Những tấm thiệp đẹp, được tạo nên chỉ trong chốc lát.**

Headline truyền đồng thời:
- đẹp
- nhanh
- đơn giản
- được làm giúp người dùng

---

### Hero subheadline

> **Personal, thoughtful, and created just for them.**

Mục tiêu:
- nhấn mạnh personalization
- cảm xúc
- không nói quá nhiều về công nghệ

---

### Primary CTA

> **Create your card ✦**

CTA phải:
- lớn
- rõ
- dễ bấm bằng một tay trên mobile
- luôn là hành động chính ở hero

---

### Trust line

> **No design skills · No subscription · Pay only when you love it**

Ba objection cần giải quyết ngay:

1. Tôi không biết thiết kế → **No design skills**
2. Tôi không muốn đăng ký gói → **No subscription**
3. Tôi sợ trả tiền trước rồi AI làm xấu → **Pay only when you love it**

---

## Brand hierarchy

Website nên dùng cấu trúc:

**CARDELUME**

> *Make their moment shine.*

# **Beautiful cards, made in moments.**

> Personal, thoughtful, and created just for them.

**Create your card ✦**

> No design skills · No subscription · Pay only when you love it

Không dùng “AI Greeting Cards & Invitations” làm slogan.

Có thể dùng nó như:
- descriptor
- SEO copy
- metadata
- footer
- product explanation

AI là engine phía sau, không phải thứ khách hàng phải học.

---

## Watermark branding

Preview miễn phí dùng watermark:

> **CARDELUME · PREVIEW**

hoặc dạng tối giản:

> **CARDELUME**

Watermark:
- baked vào preview raster
- opacity thấp
- lặp nhẹ 2–4 vị trí nếu cần
- không phá cảm giác premium
- không chỉ dùng CSS overlay

Paid final:
- hoàn toàn không watermark


# 2. Trải nghiệm người dùng cốt lõi

## Home

Thông điệp đơn giản:

> **Create a beautiful card in seconds.**  
> AI writes, designs and personalizes it for you.

CTA chính:

- **Create a Greeting Card**
- Invitation — Coming Soon

Không mở thẳng advanced editor.

---

## Flow chuẩn

### Step 1 — Occasion

> What are we celebrating?

Ví dụ:
- Birthday
- Anniversary
- Love
- Thank You
- Congratulations
- Graduation
- New Home
- New Baby
- Holiday
- Other

Market Pack quyết định occasion nào xuất hiện trước.

---

### Step 2 — Recipient + Relationship

> Who is it for?

Ví dụ:
- Mother
- Father
- Partner
- Friend
- Coworker
- Boss
- Teacher
- Client
- Child
- Other

Có tên người nhận nếu user muốn nhập.

**Relationship là input quan trọng**, vì ảnh hưởng:
- cách xưng hô
- độ trang trọng
- humor
- palette
- layout
- imagery
- lời chúc

---

### Step 3 — Mood / Style

Chỉ nên có khoảng 5–7 lựa chọn dễ hiểu:

- Elegant
- Warm
- Romantic
- Fun
- Cute
- Artistic
- Premium
- **Surprise me ✨**

Không expose:
- typography ID
- frame ID
- palette ID
- density
- DPI
- technical layout options

---

### Step 4 — Optional personalization

> Anything you'd like us to know?

Ví dụ:

> She loves roses and turns 60 this year.

Optional photo upload.

Không bắt buộc.

---

### Step 5 — Generate

CTA:

> **✨ Create my card**

AI trả ra **3 phương án**.

Không đưa user vào editor ngay.

---

# 3. Result screen

Hiển thị 3 card lớn, đẹp.

Mỗi card:

- Preview
- Select this card

CTA phụ:

- **Generate 3 more**
- giới hạn số lần free regenerate

Mục tiêu:

> **Time-to-first-card < 60 giây**

---

# 4. Simple Editor

Không gọi là “Editor” nếu có thể.

Tên thân thiện hơn:

> **Finish your card**

Chỉ có:

- Edit message
- Change design
- Change color
- Add / Change photo
- Regenerate
- Back

Advanced controls ẩn sau:

> More options

Nhưng Phase 1 nên hạn chế tối đa advanced controls.

---

# 5. AI Architecture

## v7 AI creative-authority rule

Template ranking is a **shortlisting prior**, not the final art-direction authority.

```text
CardBrief
→ objective hard compatibility filter
→ soft score + recent-style prior
→ up to 6 strong-fit + up to 2 premium wildcards
→ premium AI Creative Director reviews supplied exact versions
→ select 3 OR request one bounded expansion
→ creative thesis + signature move + copy + allowlisted controls
→ deterministic premium quality gate
→ conditional critic / targeted reconsideration
→ Studio directions or curated fallback
```

Hard rules may reject technically unsafe/incompatible candidates. Feeling, occasion, market affinity, performance, editorial quality, freshness and history are soft evidence only. AI may deliberately choose a lower-ranked supplied candidate when it provides stronger emotional or creative value.

The core customer-facing creative call stays on the configured premium model. Cost is reduced by compact context, one-call normal flow and conditional repair — not by replacing creative judgment with a mechanical score.

## Nguyên tắc

AI nên đóng vai:

> **Creative Director**

không phải:

> toàn bộ renderer

---

## AI chịu trách nhiệm

- viết lời chúc
- chọn tone
- chọn template
- chọn palette
- chọn typography
- chọn artwork
- chọn composition
- chọn style
- personalization
- localization

---

## Renderer chịu trách nhiệm

- text thật
- layout
- font
- image placement
- background
- frame
- decorative elements
- export
- print rendering

Không để AI image model tạo toàn bộ card chứa chữ.

### Lợi ích

- chữ luôn đúng
- tiếng Nhật/Hàn/Việt dễ xử lý
- sửa text dễ
- export ổn định
- print đẹp
- chi phí thấp
- không bị lỗi chữ AI

---

# 6. Chiến lược AI cost

## Tier A — Default

**Curated assets + AI composition**

AI chỉ:
- viết copy
- chọn template
- chọn artwork/style

Chi phí cực thấp.

Đây nên là default.

---

## Tier B — Personalized artwork

Nếu cần:

- tạo 1 AI artwork low/medium cost
- dùng cùng artwork để render 3 layout khác nhau

Không tạo 3 ảnh AI riêng cho mỗi card preview.

---

## Tier C — Paid final generation

Sau khi thanh toán mới:

- generate/upscale artwork chất lượng cao
- render final JPG/PDF

---

## Free-generation guardrails

Không cho generate vô hạn.

Ví dụ:

- 1 generation ban đầu
- 1–2 regenerate miễn phí
- sau đó cooldown / pay / rate limit

Áp dụng:
- session/device fingerprint
- IP rate limit
- CAPTCHA khi bất thường
- abuse detection
- cost budget theo ngày

---

# 7. Card data model

## v5 managed-template identity

`CardDocument` remains the render source-of-truth, but the purchase snapshot now also records managed-template identity outside the free-form document payload:

```text
card_versions.managed_template_id
card_versions.managed_template_version_id
card_versions.managed_template_source
```

Checkout always pins the **exact template version previewed by the customer**. A later catalog edit, archive, ranking change, or v2/v3 publish cannot mutate an old paid card.

Managed template metadata does not replace `CardDocument`; it selects and identifies the trusted renderer/template contract that produces the document.


Giữ hướng **structured document**.

Ví dụ:

```text
CardDocument
├─ template
├─ canvas
├─ background
├─ artwork
├─ images
├─ text blocks
├─ typography
├─ palette
├─ decorative elements
└─ metadata
```

Text và graphic phải tách riêng.

Không dùng flattened AI image làm source-of-truth.

---

# 8. Managed Template Strategy — v5 / Step 12

## Product intent

CardeLume must support a growing premium library without asking customers to manage a large design catalog.

The template system has two audiences:

### Customer

Sees only:

```text
3 AI directions
↓
optional Explore more styles
↓
4 Recommended
4 Market Picks / Curated Picks
↓
Show more → up to 8 additional
```

Maximum discovery surface is **16 unique compatible templates**.

### Operator

Can:

- create a draft template identity,
- create or reuse a Template Family,
- duplicate a template as a market/style variant,
- edit name/material/editorial metadata,
- set feeling affinities,
- set occasion affinities,
- set market affinities,
- exclude markets,
- create immutable render versions,
- publish validated versions,
- return a template to Draft,
- archive/remove it from future selection,
- inspect recent performance.

## Domain model

```text
Template Family
    ↓
Template
    ↓
Immutable Template Version
    ↓
Targeting + Performance
```

### Template Family

Groups close siblings. AI diversity should prefer at most one member of the same family in the initial three directions.

### Template

Mutable merchandising/editorial identity:

```text
name
slug
material
status
health
photo mode
editorial score
maturity
targeting
```

### Template Version

Immutable render contract:

```text
renderer key
visual direction
supported formats
script support
headline capacity
body capacity
validation status
version number
```

Any pixel-affecting change creates a new version.

## Lifecycle

```text
Draft → Active → Archived
```

Activation requires:

- healthy template,
- current version,
- current version validation passed.

Customer-facing deletion is implemented as **Archive**, not destructive deletion.

## Renderer trust boundary

Admin cannot upload arbitrary SVG/HTML/CSS/JS or invent a renderer key.

A managed version may only use a renderer key already present in CardeLume's code-reviewed renderer set.

A completely new visual renderer still requires:

```text
code implementation
→ renderer tests
→ export QA
→ deployment
→ managed template/version
```

## Photo mode

Schema supports:

```text
none
optional
required
```

Current launch renderer catalog uses only:

```text
none
required
```

`optional` remains reserved until an actual renderer is QA-approved for both photo/no-photo composition.

## Hard eligibility

Before ranking, exclude any template that is:

- not active,
- not healthy,
- not validated,
- incompatible with format,
- incompatible with locale script,
- explicitly excluded from market,
- photo-required when no photo is available.

AI cannot override eligibility.

## Soft targeting

Market, occasion and feeling use affinity scores instead of binary tags.

Example:

```text
Warm       0.95
Elegant    0.80
Birthday   0.92
VN         0.96
GLOBAL     0.70
```

Market and locale remain separate:

```text
market → merchandising/ranking
locale → language/script/copy
```

## Ranking formula — launch default

After hard eligibility:

```text
35% brief relevance
20% market affinity
20% editorial quality
15% normalized historical performance
 5% text-fit compatibility
 5% freshness/maturity
```

Then photo-fit adjustment and diversity pass are applied.

Raw usage count is deliberately not a ranking signal because it creates self-reinforcing exposure loops.

Historical performance uses normalized rates and smoothing so tiny samples cannot dominate.

## Text capacity

Versions declare:

```text
headline: short | medium | long
body: short | medium | long
```

Ranking may combine this with the existing Magic Typography pressure model. Final overflow protection remains authoritative in the renderer.

## Script compatibility

Launch groups:

```text
Latin
CJK
Hangul
```

Script compatibility is a hard filter because a composition can be excellent in English but unsuitable for Japanese/Korean density.

## AI assignment

AI never searches the full library.

```text
brief
↓
managed catalog
↓
eligibility
↓
deterministic ranking
↓
diversity/archetype pass
↓
3 trusted template versions
↓
AI writes copy for those fixed slots
```

Without photo, expected archetypes:

```text
editorial
midnight
quiet
```

With photo:

```text
editorial
midnight
photo
```

The LLM may generate copy but may not replace trusted template/version identity.

## Customer discovery allocation

The system reserves qualified Market Picks before allocating Recommended so one strong local pack is not entirely consumed by the first row.

Visible order remains:

```text
Recommended first
Market Picks second
```

All groups are deduplicated.

When insufficient direct-market inventory exists, the system fills with strong global templates and labels the row as curated rather than falsely market-specific.

## Exact-version purchase

The client carries:

```text
templateId
templateVersionId
templateSource
```

Checkout validates the exact pair. It does not silently re-resolve the latest template version.

This prevents:

```text
preview v1
admin publishes v2
checkout unexpectedly buys v2
```

## Analytics

Track privacy-safe events:

```text
impression
selected
ai_assigned
checkout_started
paid
regenerated
```

and attribution:

```text
ai_direction
recommended
market_pick
show_more
rank_position
market
locale
```

Do not store recipient/card copy/photo information in template analytics.

### Signed browser analytics

Because analytics affects ranking, client events are not trusted at face value.

Each surfaced slot gets an expiring HMAC capability bound to:

```text
template ID
version ID
source
position
market
locale
anonymous session ID
surface nonce
expiry
```

`TEMPLATE_EVENT_SECRET` is a required live secret.

AI assignment and PAID attribution are server-side events. Browser impression/selection evidence is additionally replay-deduplicated with a server HMAC dedupe key tied to the exact signed surface token and anonymous session.

## Retention

Raw events roll up to daily metrics and are removed after finite retention (default 90 days).

Long-term trend analysis should use `template_metrics_daily`.

## Readiness

`/health/ready` checks healthy validated catalog coverage across:

```text
5 formats
× Latin/CJK/Hangul
× editorial/midnight/quiet/photo
```

An operator cannot archive critical coverage and still leave the node production-ready.

## No public marketplace

Do not add:

- infinite template browsing,
- customer template uploads,
- arbitrary renderer uploads,
- favorites/accounts merely for templates,
- vector DB recommendation,
- ML ranking platform at launch.

## Copyright rule remains locked

Do not copy “free templates” from Canva, Freepik, Envato, Creative Market, Figma Community, Pinterest, Behance, or similar sources unless the license explicitly permits the intended commercial template-service use.

CardeLume production templates must be original/project-owned or licensed for this use.

For the full implementation-backed Step 12 contract, see:

```text
docs/TEMPLATE_SYSTEM_SPEC_0.4.3_STEP12.md
docs/TEMPLATE_API_CONTRACTS_0.4.3_STEP12.md
docs/TEMPLATE_ADMIN_RUNBOOK_0.4.3_STEP12.md
docs/TEMPLATE_RANKING_ANALYTICS_0.4.3_STEP12.md
docs/TEMPLATE_ROLLOUT_MIGRATION_0.4.3_STEP12.md
```

---

# 9. Asset & Copyright Policy

## Nguyên tắc cứng

> **Không asset nào vào production nếu không xác định được nguồn và license.**

Mỗi asset nên có:

```text
assetId
source
sourceUrl
author
license
licenseUrl
downloadedAt
commercialUse
attributionRequired
originalHash
```

Tạo:

- `security/licenses/ASSET_PROVENANCE.json` (machine-readable provenance registry)
- retained license/evidence files under the security/license evidence structure

---

## Font

Ưu tiên:

> **Google Fonts**

Chỉ dùng font có open-source license rõ ràng.

### Gợi ý

- Cormorant Garamond
- Playfair Display
- Lora
- DM Sans
- Inter
- Manrope
- Montserrat
- Poppins
- Bebas Neue
- Caveat
- Baloo 2
- Nunito
- Noto Serif JP
- Noto Sans JP
- M PLUS Rounded 1c
- Noto Sans KR
- Be Vietnam Pro

Không lấy font “free download” không rõ license.

---

## Artwork nguồn ưu tiên

### Tier A
**Original assets**

- SVG tự tạo
- CSS pattern
- procedural pattern
- original illustrations

Ưu tiên nhất.

### Tier B
**CC0**

Ví dụ nguồn public-domain / CC0:
- The Met Open Access
- Smithsonian Open Access

Chỉ nhập asset có license rõ ràng.

### Tier C
**Commercial stock miễn phí**

Ví dụ:
- Pexels
- Pixabay

Dùng có biến đổi, không bán asset gần như nguyên bản.

### Tier D
**AI-generated artwork**

Dùng cho personalization.

---

## Pattern

Nên tạo bằng code:

- dots
- stripes
- checker
- stars
- hearts
- waves
- confetti
- geometric
- Art Deco
- floral line-art

SVG/CSS procedural:
- nhẹ
- đổi màu dễ
- ít rủi ro bản quyền
- dễ scale

---

# 10. Market Packs — Global-first

## v5 template-market intelligence

Market Packs now influence template merchandising through affinity rows rather than requiring a separate hard-coded catalog per country.

A template can be global with a stronger affinity for JP/KR/VN/etc., or be explicitly excluded where typography/editorial review says it should not appear.

Do not create market variants simply to fill a quota. A strong global template is better than a weak “localized” design.


Không fork website theo từng nước.

Dùng:

```text
market-packs/
  global/
  us/
  gb/
  jp/
  kr/
  de/
  fr/
  au/
  ca/
```

---

## Market Pack chứa

```text
locale
language
currency
price
occasionCatalog
styleWeights
colorPreferences
typography
artDirection
writingTone
relationshipRules
formalityRules
seasonalCalendar
dateFormat
nameFormat
```

---

## US

Có thể ưu tiên:

- Modern Bold
- Funny
- Photo First
- Warm Family
- Premium Editorial
- Cute
- Retro

Tone:
- casual hơn
- humorous
- sentimental
- concise

---

## Japan

Có thể ưu tiên:

- Elegant Minimal
- Japanese Seasonal
- Watercolor
- Washi
- Botanical
- Kawaii
- Premium restrained

Phải đặc biệt xử lý:
- formality
- seniority
- relationship
- seasonal greetings
- Japanese typography
- future support vertical writing

---

## Quan trọng

Market Pack chỉ quyết định:

> **default ranking**

Không stereotype người dùng.

User Nhật vẫn có thể chọn Bold American Retro.

User Mỹ vẫn có thể chọn Japanese Minimal.

---

# 11. Data-driven localization

Sau khi có traffic:

Theo dõi:

```text
market
style
occasion
generation
selection
purchase
```

Ví dụ:

```text
JP / Japanese Seasonal / purchase rate = 11%
JP / Bold Pop / purchase rate = 3%
```

Sau đó tự tối ưu ranking theo conversion.

Đây có thể trở thành moat lâu dài.

---

# 12. Pricing

## Launch identity price

> **US$2.99 / finished premium card**

One-time payment.

CardeLume không bán:
- AI generations
- subscription
- credits
- wallet balance
- monthly plan
- annual plan
- forced account

Người dùng mua **một tấm thiệp hoàn chỉnh**, không mua lượt tạo AI.

### Market pricing

`locale` và `market` là hai khái niệm độc lập:

```text
locale → UI language / copy
market → price / currency
```

Ví dụ:

```text
locale = en
market = VN
price = 39.000đ target
```

Không được suy giá từ language switcher.

Launch price book:

| Market | Target |
|---|---:|
| US | US$2.99 |
| UK | £1.99 |
| EU launch (FR/DE/ES/IT) | €2.49 |
| Canada | C$3.99 target |
| Australia | A$3.99 target |
| Singapore | S$3.90 target |
| Japan | ¥390 target |
| Korea | ₩3,900 target |
| Brazil | R$9,90 target |
| Mexico | MX$39 target |
| China | ¥12.90 target |
| Vietnam | 39.000đ target |
| India | ₹149 |
| Other | US$2.99 |

`target` nghĩa là psychological local price đã được chọn, nhưng **chỉ được expose production sau khi billing market đó được verify end-to-end**.

Dodo currencies được coi là native trong baseline:
- USD
- GBP
- EUR
- INR

Các target currency khác mặc định fallback về US$2.99 cho đến khi:
1. market được verify,
2. extended local pricing được bật,
3. checkout total khớp giá CardeLume hiển thị,
4. adaptive currency fee được CardeLume absorb/inclusive nếu cần.

Không để:

```text
Website: 39.000đ
Checkout: 40.xxxđ
```

### Pricing experiment

Launch ban đầu:
> **control = US$2.99**

Không test ngay ngày đầu.

Sau khi có baseline funnel đủ ổn định:
- test `US$2.99` vs `US$3.49`
- chỉ traffic mới
- sticky cohort theo anonymous/user identity
- cùng user không được thấy giá thay đổi giữa các lần truy cập

Không fake discount.
Không countdown.
Không strike-through pricing.

### Vietnam

Launch target:
> **39.000đ**

Nếu conversion và perceived-value tốt:
> test 39.000đ vs 49.000đ

Không giảm xuống 29.000đ vì fixed payment fee ăn margin quá mạnh.

---

## Dormant Holiday Collection

Feature được code sẵn nhưng **OFF ở launch**:

```text
HOLIDAY_BUNDLE_ENABLED=false
```

Mô hình:

> **5 finished cards → one checkout**

Không phải:
- 5 credits
- wallet balance
- prepaid generations
- recurring plan

US target:
> **US$12.99 / 5 finished cards**

Các market có psychological bundle price riêng trong price book.

Điều kiện bật:
1. single-card conversion ổn định,
2. có bằng chứng người dùng tạo/mua nhiều card trong holiday season,
3. backend có 5 `FINISHED` card IDs thật,
4. checkout verify ownership/session server-side,
5. bundle payment + entitlement + final delivery đã test end-to-end.

---

# 13. Payment

## Chọn

> **Dodo Payments — Merchant of Record**

Mục tiêu:
- payment
- VAT/GST/sales tax
- invoicing
- compliance
- refund support
- international checkout

Không tự xây global tax engine.

---

## Payment flow

```text
CARD READY
↓
Create Order
↓
Dodo Checkout
↓
Payment
↓
SIGNED WEBHOOK
↓
Backend verifies signature
↓
order.status = PAID
↓
Unlock final card
```

---

## Security rules

Không bao giờ:

- unlock dựa trên redirect URL
- tin `payment-success` từ browser
- lưu card number
- lưu CVV
- expose secret keys client-side

Webhook phải:
- verify signature
- idempotent
- chống replay
- log provider event ID
- không xử lý một payment hai lần

---

# 14. Guest checkout

Không bắt đăng ký.

Có thể dùng:

> **Supabase Anonymous Auth**

User vẫn có session/ID nhưng không phải tạo tài khoản.

Email optional sau payment để:
- receipt
- recover purchase
- download lại

Có thể nâng anonymous account thành email account về sau.

---

# 15. Database, Backend & Application Architecture

## v5 managed-template persistence

Step 12 adds server-only RLS-protected tables:

```text
template_families
templates
template_versions
template_targeting
template_events
template_metrics_daily
```

and pins managed template identity into `card_versions`.

Template catalog data remains in shared Postgres so Pi5/VPS compute nodes see the same active catalog and analytics evidence.


## Database

Chọn:

> **Supabase PostgreSQL**

Vai trò:

- persistent relational database
- Anonymous Auth
- future Magic Link / OAuth
- Row Level Security
- database backups
- secure user/session ownership

Không đặt PostgreSQL production trên Pi 5 hoặc VPS local.

Lý do:

> Nếu Pi hoặc VPS hỏng/mất điện, website phải có thể chạy lại ngay trên compute node còn sống mà không phải sync database.

---

## Backend

Phase 1 dùng:

> **Next.js Route Handlers + Node.js worker riêng**

Không cần:

- NestJS
- microservices
- Kubernetes

Web process chịu trách nhiệm:

- request/response
- auth/session
- card CRUD
- checkout creation
- webhook endpoint
- signed-download authorization
- job status

Worker chịu trách nhiệm:

- AI planning
- optional artwork generation
- image processing
- preview rendering
- paid final rendering
- JPG/PDF export
- cleanup jobs

---

## Queue

Chọn:

> **pg-boss trên PostgreSQL**

Lý do:

- tận dụng PostgreSQL hiện có
- durable jobs
- retry
- multiple workers
- không cần thêm Redis cho MVP

Worker phải xử lý job theo nguyên tắc:

- idempotent
- retry-safe
- có max-attempts
- exponential backoff cho external API
- correlation ID
- không tạo final paid asset hai lần nếu job bị retry

---

## ORM / Validation

Chọn:

> **Drizzle ORM + Zod**

Drizzle:

- nhẹ
- TypeScript-first
- phù hợp ARM64 / Pi 5
- migration rõ ràng
- ít overhead hơn stack ORM nặng

Zod:

- validate API input
- validate AI structured output
- validate `CardDocument`
- validate webhook payload sau signature verification

---

## Tables gợi ý

```text
profiles
cards
card_versions
card_documents
generated_assets
generation_jobs
generation_usage
uploaded_photos
orders
payments
payment_events
download_entitlements
share_links
market_events
analytics_events
asset_licenses
abuse_events
audit_events
```

Mọi bảng user-owned phải có:

- stable ID
- `user_id`
- `created_at`
- `updated_at`
- RLS policy phù hợp

---

# 16. Object Storage & File Lifecycle

Chọn production ngay từ đầu:

> **Cloudflare R2**

Supabase tập trung vào:

- PostgreSQL
- Auth
- RLS

R2 tập trung vào:

- uploaded photos
- AI artwork
- watermarked previews
- public template assets
- paid JPG
- paid PDF
- social/share assets

---

## Storage classes logic

### Public assets

Ví dụ:

```text
public/templates/*
public/marketing/*
public/style-thumbnails/*
```

Có thể cache qua Cloudflare CDN.

### Private assets

Ví dụ:

```text
private/uploads/*
private/artwork/*
private/previews/*
private/finals/*
```

Private bucket không được public-listing.

Final paid assets chỉ trả bằng:

> **short-lived signed URL**

---

## Local disk policy

NVMe của Pi/VPS chỉ dùng cho:

```text
/tmp/cardelume/*
render scratch space
temporary downloads
local build/cache
```

Không dùng local disk làm source of truth.

Sau khi render:

```text
render
↓
upload R2
↓
verify object
↓
update DB
↓
delete temporary local file
```

---

## Upload security

Ảnh user upload phải:

- giới hạn file size
- giới hạn pixel dimensions
- kiểm tra magic bytes, không chỉ extension/MIME header
- chỉ nhận format whitelist
- decode/re-encode bằng image library
- strip EXIF/GPS metadata mặc định
- chống decompression/image bomb
- randomize object key
- không dùng original filename làm public path

Không cho user quyết định arbitrary R2 key/path.

---

# 17. Free preview & anti-screenshot strategy

## Không thể chặn screenshot 100%

Không cố:

- disable right-click
- chặn Print Screen bằng JS
- chặn DevTools
- chặn Ctrl+S

Các biện pháp đó dễ bypass và làm UX tệ.

---

## Watermark

Free preview phải có watermark:

> **baked vào preview raster**

Không chỉ CSS overlay.

Thiết kế watermark nên tinh tế:

- small edge mark
- small bottom strip
- hoặc repeating pattern rất nhẹ

Tránh diagonal watermark lớn kiểu stock-photo.

---

## Preview vs Final

### Unpaid

- khoảng 1000–1400 px tùy format
- compressed
- baked watermark
- web preview
- branded share link

### Paid

- high resolution
- no watermark
- JPG
- print-ready PDF
- clean share link

---

## Rule bắt buộc

> **A clean, high-resolution card must never be generated, stored publicly, or delivered to the client before server-side payment verification.**

---

# 18. Signed Downloads & Entitlements

Không public:

```text
/cards/abc/final.pdf
```

Flow:

```text
authenticated/anonymous session
↓
verify order
↓
verify entitlement
↓
issue short-lived signed R2 URL
↓
download
```

Signed URL phải:

- expiry ngắn
- chỉ cho đúng object
- không expose bucket listing
- không được dùng như permanent share URL

Muốn tải lại:

- secure purchase recovery
- optional email magic link
- verify entitlement
- issue signed URL mới

---

# 19. Production Hosting — Free HA with Shared Cloudflare Tunnel

## Phase 1 architecture

```text
                           GLOBAL USERS
                                │
                                ▼
                           CLOUDFLARE
                 DNS · CDN · WAF · TLS · Turnstile
                                │
                                ▼
                     ONE CLOUDFLARE TUNNEL
                         same Tunnel UUID
                         ┌──────┴──────┐
                         │             │
                  cloudflared      cloudflared
                    replica A       replica B
                         │             │
                         ▼             ▼
                    Raspberry Pi 5     VPS
                    Next.js            Next.js
                    Worker             Worker
                         │             │
                         └──────┬──────┘
                                ▼
                   EXTERNAL PERSISTENT STATE
                   Supabase · R2 · Dodo · AI
```

## Core rule

> **Pi5 và VPS chạy như hai replicas độc lập của cùng một Cloudflare Tunnel.**

Cả hai node dùng:

- cùng production app version
- cùng Tunnel UUID
- cùng external DB/storage
- local Docker stack riêng
- local `/health/*` endpoints
- local health watchdog riêng

Public web không cần:

- HAProxy
- DNS failover
- Cloudflare Worker failover router
- public Next.js port
- router port-forward
- WireGuard trong request path

---

## Shared Tunnel configuration

Ví dụ:

```text
Tunnel: cardelume-prod
UUID: <shared-tunnel-uuid>
```

Pi5:

```text
cloudflared
→ http://127.0.0.1:3000
```

VPS:

```text
cloudflared
→ http://127.0.0.1:3000
```

Cả hai dùng credentials của cùng Tunnel UUID.

Cloudflare Tunnel tạo outbound connections nên:

- Pi không cần public IP
- VPS app port không cần public
- không mở 3000 ra Internet
- Cloudflare WAF/CDN/TLS vẫn nằm trước application

---

## Important limitation

Shared Tunnel replicas cung cấp HA ở connector/node/network layer nhưng:

> **không cung cấp traffic steering kiểu “Pi primary / VPS standby”.**

Do đó khi cả hai khỏe:

```text
request A → Pi hoặc VPS
request B → Pi hoặc VPS
```

Application bắt buộc stateless.

Session/business state phải nằm ở:

```text
Supabase
R2
PostgreSQL / pg-boss
```

không nằm trong memory/local disk của một node.

---

## Local Application Health Watchdog

Cloudflare thấy connector sống chưa chắc Next.js upstream còn khỏe.

Vì vậy mỗi node phải có local watchdog.

Watch:

```text
http://127.0.0.1:3000/health/live
```

Recommended behavior:

```text
check every ~2–5 s
↓
3 consecutive failures
↓
stop/restart local cloudflared replica
↓
Cloudflare routes through remaining replica
```

Recovery:

```text
Next.js healthy for N consecutive checks
↓
start cloudflared
↓
node rejoins shared tunnel
```

Không dùng một request failure đơn lẻ để loại node.

Watchdog có thể triển khai bằng:

- systemd service/timer
- small shell/service script
- Docker healthcheck + supervisor logic

Ưu tiên:

> ít moving parts, log rõ, restart-safe.

---

## Health endpoint design

### `/health/live`

Chỉ kiểm tra:

- Node process responsive
- event loop không stuck
- app trả HTTP nhanh

Không kiểm DB/R2/AI.

Mục tiêu:

> biết local app có nên tiếp tục giữ cloudflared replica online hay không.

### `/health/ready`

Kiểm tra:

- DB reachable
- critical config loaded
- queue connectivity
- R2 availability khi cần

Dùng cho:

- deploy verification
- monitoring
- readiness

Không dùng dependency chung để stop tunnel replica nếu việc đó chỉ làm cả hai node cùng bị loại.

### `/health/worker`

Trả:

- worker heartbeat
- worker version
- queue consumer state
- active jobs
- last successful job

---

## Pi5 role

Pi5:

- Next.js web
- stronger worker
- preview rendering
- paid final rendering
- Sharp/resvg
- scratch cache

Khuyến nghị:

- Pi 5 8 GB
- NVMe
- Ethernet
- active cooling
- UPS
- không dùng microSD làm workload disk chính

---

## VPS role

VPS:

- second web replica
- backup compute
- low-concurrency worker
- monitoring/admin utility nếu cần

Nếu VPS yếu:

```text
web           normal
ai_plan       1
preview       1
final_render  1
```

Pi có concurrency cao hơn theo benchmark.

---

## Worker model

Cả Pi và VPS đều có thể chạy worker.

Queue:

```text
Supabase/PostgreSQL
        │
      pg-boss
      /     \
 Pi worker  VPS worker
```

Bắt buộc:

- idempotent jobs
- durable queue
- deterministic output key
- unique payment-event handling
- no duplicate final entitlement
- retry-safe render

Không dựa vào web-routing để quyết định worker nào nhận job.

---

## WireGuard

WireGuard là optional.

Dùng cho:

- private SSH/admin
- diagnostics
- node-to-node metrics
- maintenance

Không dùng làm public-web critical path.

Nếu WireGuard down:

> website vẫn phải hoạt động.

---

## Docker / deploy

Dùng:

> **Docker Compose**

Images:

```text
ghcr.io/<org>/cardelume-web:<git-sha>
ghcr.io/<org>/cardelume-worker:<git-sha>
```

Build multi-arch:

```text
linux/arm64
linux/amd64
```

Deploy order:

```text
1. build + test immutable image
2. deploy VPS
3. verify /health/live + /health/ready
4. deploy Pi
5. verify
6. monitor
```

Node đang deploy có thể tạm rời tunnel; node còn lại tiếp tục phục vụ.

---

## Payment webhook

Webhook handler có thể tới Pi hoặc VPS.

Điều đó an toàn vì:

- verify Dodo signature
- provider event ID unique
- DB-backed idempotency
- transaction
- durable final-render job

Không phụ thuộc local node state.

---

## Phase 1.5 — Upgrade to Cloudflare Load Balancer

Khi có nhu cầu:

- **Pi primary**
- **VPS fallback only**
- health-check từ edge
- automatic controlled failback
- weighted routing
- thêm VPS2/VPS3
- geographic steering

thì chuyển thành:

```text
                           CLOUDFLARE
                         LOAD BALANCER
                        ┌──────┴──────┐
                        │             │
                 Tunnel UUID A   Tunnel UUID B
                        │             │
                        ▼             ▼
                       Pi5           VPS
```

Ứng dụng không đổi.

Chỉ thay:

> routing / origin management layer.

---

## Không chọn Worker Free làm failover router mặc định

Không dùng:

```text
Cloudflare Worker
→ try Pi
→ timeout
→ retry VPS
```

làm kiến trúc Phase 1 mặc định vì:

- tạo thêm quota 100k requests/day
- tạo critical routing code phải tự duy trì
- mutation POST retry phức tạp
- có nguy cơ duplicate operation nếu idempotency sai
- tạo thêm một failure mode không cần thiết

Worker vẫn dùng được cho các edge feature khác sau này, nhưng:

> **không phải primary HA router của CardeLume.**

---

# 19A. Security, SSL/TLS & Server Hardening

Security là **P0**, không phải việc làm sau launch.

## TLS / SSL topology

Production:

```text
Browser
  │ HTTPS TLS 1.2/1.3
  ▼
Cloudflare Edge
  │
  ├── Cloudflare Tunnel A ──→ Pi5
  └── Cloudflare Tunnel B ──→ VPS
```

Public app traffic đi qua Cloudflare Tunnel; app port không public trực tiếp.

Nếu vẫn expose bất kỳ HTTPS origin endpoint công khai nào cho service phụ:

> **Cloudflare SSL mode = Full (strict)**

Tuyệt đối không dùng Flexible SSL.

Tuyệt đối không dùng:

> Flexible SSL

VPS origin dùng một trong:

1. **Cloudflare Origin Certificate**, hoặc
2. **Let's Encrypt certificate**

Nếu toàn bộ public traffic bắt buộc đi qua Cloudflare, Cloudflare Origin Certificate là lựa chọn đơn giản.

---

## TLS rules

Bắt buộc:

- redirect HTTP → HTTPS
- TLS 1.2+; ưu tiên TLS 1.3
- HSTS sau khi xác nhận HTTPS hoạt động ổn định
- `includeSubDomains` chỉ bật khi mọi subdomain đều HTTPS-ready
- không phục vụ mixed content
- certificate renewal monitoring
- alert trước khi origin certificate hết hạn

Không bật HSTS preload ngay ngày đầu.

Chỉ preload khi:

- toàn domain/subdomain strategy đã ổn định
- không còn HTTP dependency
- hiểu rõ preload khó rollback.

---

## Cloudflare security layer

Bật:

- proxy mode cho production domain
- managed WAF rules
- DDoS protection
- bot mitigation phù hợp plan
- rate limiting
- Turnstile ở flow có nguy cơ abuse
- cache rules rõ ràng
- origin access restrictions

Rate-limit đặc biệt:

```text
/api/cards/generate
/api/upload
/api/checkout
/api/share
/auth/*
```

Không rate-limit Dodo webhook bằng rule làm mất event hợp lệ.

Webhook route phải có rule riêng.

---

## Origin protection

Ưu tiên production:

> **không expose application origin port ra public Internet.**

Pi5:

- `cloudflared` outbound
- Next.js bind localhost/private Docker network
- firewall default deny inbound
- không port-forward router

VPS:

- `cloudflared` outbound cho public app
- Next.js bind localhost/private Docker network
- SSH key-only
- disable password login
- disable direct root login
- giới hạn SSH bằng Cloudflare Access/VPN/source IP nếu khả thi

Nếu tương lai có public HTTPS origin ngoài Tunnel:

- dùng Full (strict)
- cân nhắc Authenticated Origin Pulls / mTLS
- firewall chỉ chấp nhận Cloudflare path nếu operationally safe

---

## HTTP security headers

Production response nên có:

```text
Strict-Transport-Security
Content-Security-Policy
X-Content-Type-Options: nosniff
Referrer-Policy
Permissions-Policy
frame-ancestors trong CSP
```

CSP phải được test trước bằng:

> `Content-Security-Policy-Report-Only`

sau đó mới enforce.

Tránh CSP quá rộng như:

```text
script-src *
script-src 'unsafe-eval'
```

trong production nếu không thực sự bắt buộc.

---

## App/API security

Mọi mutation endpoint phải:

- require valid session hoặc provider-signed webhook
- validate body với Zod
- enforce authorization server-side
- không tin ID/price/status từ client
- có rate limits phù hợp
- return generic production errors
- không leak stack trace/secrets

Không dùng frontend hidden fields làm security boundary.

---

## CSRF

Ưu tiên same-site architecture:

```text
cardelume.com
cardelume.com/api/*
```

Nếu auth dựa trên cookie:

- `Secure`
- `HttpOnly` khi phù hợp
- `SameSite=Lax` hoặc stricter theo flow
- CSRF protection cho state-changing requests nếu browser credential tự gửi

Webhook không dùng browser CSRF flow; webhook dùng signature verification.

---

## Supabase / RLS

RLS phải bật cho tất cả bảng user-owned.

Không để anon key trở thành bypass.

`service_role`:

- server-only
- không xuất client bundle
- dùng tối thiểu
- không dùng cho API user-facing nếu RLS/session đủ xử lý

Test bắt buộc:

> anonymous user A không đọc/sửa card của anonymous user B.

---

## Secrets

Secrets gồm:

- Supabase service role
- DB credentials
- R2 secret
- Dodo secret
- webhook signing secret
- AI provider API keys
- Sentry auth token
- deploy tokens

Rules:

- không commit `.env`
- không gửi secret vào browser
- không hard-code vào Docker image
- dùng GitHub Actions Secrets / environment secrets
- production secrets tách khỏi staging
- rotate nếu có nghi ngờ leak
- logs phải redact secrets

---

## Docker hardening

Container production:

- chạy non-root nếu image/library cho phép
- không dùng `--privileged`
- drop Linux capabilities không cần
- read-only filesystem cho web container nếu khả thi
- mount writable temp directory riêng
- giới hạn memory/CPU hợp lý
- healthcheck
- restart policy
- pin image dependencies/version

CI nên chạy container scan, ví dụ:

- Trivy
- GitHub dependency/security alerts

---

## Payment security

Dodo webhook:

```text
request
↓
verify signature trên raw payload theo provider spec
↓
validate event
↓
check provider event ID
↓
idempotency
↓
update DB transaction
↓
enqueue final render
```

Không:

- unlock bằng success redirect
- tin browser nói payment thành công
- expose secret key
- lưu card number/CVV

Payment state machine phải chống:

- duplicate webhook
- out-of-order event
- replay
- retry

---

## Upload/image security

Ảnh user:

- whitelist format
- magic-byte validation
- size limit
- max dimensions / max megapixel
- server decode/re-encode
- strip EXIF
- randomized private object key
- short-lived upload authorization
- no arbitrary remote URL fetch

Nếu sau này cho “import image from URL”:

> phải có SSRF protection riêng.

---

## Abuse protection

Generation endpoint:

- per-session quota
- per-IP guardrail
- device/session heuristics
- daily cost cap
- Turnstile khi hành vi đáng ngờ
- regenerate cap
- provider timeout
- kill-switch nếu AI spend tăng bất thường

---

## Audit trail

Audit tối thiểu cho:

- payment status changes
- refund
- entitlement issuance
- admin action
- deletion request
- suspicious abuse block

Không ghi raw sensitive user content vào audit log nếu không cần.

---

# 19B. Performance & Scalability Guardrails — Locked

## Numeric performance budget

Production quality gate, ưu tiên p75 mobile:

| Metric | Target |
|---|---:|
| LCP | **≤ 2.5 s** |
| INP | **≤ 200 ms** |
| CLS | **≤ 0.10** |
| Marketing TTFB | **< 500 ms target** |
| Initial landing JS | **≤ 200 KB gzip target** |
| Main-thread long task | **< 50 ms** |
| Core interaction animation | **~55–60 fps** |
| Time-to-first-card | **< 60 s** |

Không merge decorative feature nếu làm budget regression đáng kể.

---

## Motion performance budget

Animate chủ yếu:

```text
transform
opacity
```

Không dùng continuous animation trên:

```text
large box-shadow
filter: blur()
large SVG filters
background-position
width / height
full-screen gradients
```

Gold foil:

- static material layer mặc định
- micro reflection khi hover/reveal
- không sheen sweep chạy liên tục

---

## Signature WOW

Master production UX khóa:

### Card Reveal

Duration mục tiêu:

> **1.2–1.8 s**

Sequence:

1. paper appears
2. typography composes
3. artwork resolves
4. card lifts
5. three directions separate

Không thêm artificial delay nếu generation đã xong.

### Result → Finish your card

Dùng shared-element transition:

- position
- scale
- transform
- opacity
- shadow approximation

Fallback browser:

> elegant fade/scale, không làm hỏng flow.

Rule:

> **Motion should be felt before it is noticed.**

---

## JS architecture

Marketing pages:

- Server Components ưu tiên
- static/ISR khi phù hợp
- client JS tối thiểu
- interactive islands cho hero/card interaction

Studio:

- client components chỉ nơi cần state
- không hydrate toàn bộ marketing homepage vì một animation
- dynamic import cho module nặng

---

## Job-status polling

Không poll cố định 1 request/second mãi mãi.

Recommended adaptive polling:

```text
0–2s   → ~750ms
2–5s   → ~1.5s
5–15s  → ~2.5s
15s+   → ~4s
```

Thêm jitter.

Khi tab hidden:

- giảm mạnh hoặc pause polling

Tạo abstraction:

```text
JobStatusProvider
```

để sau này đổi sang:

- SSE
- Supabase Realtime
- push/event channel

mà UI không cần rewrite.

---

# 19C. Database Connection & Queue Rules

## Supabase connection strategy

Không dùng một connection mode cho mọi workload.

### Web app

- small DB pool
- session-capable connection
- giới hạn connection per node

### pg-boss worker

- persistent/session-capable connection
- không phụ thuộc transaction-pool semantics cho queue features cần session state

### migrations / dump / restore

- dedicated direct/session connection
- không chạy migration qua request-serving connection pool

---

## Connection budget

Đặt hard limits.

Ví dụ khởi điểm:

```text
Pi web        3–5
VPS web       3–5
Pi worker     small dedicated pool
VPS worker    small dedicated pool
```

Không để autoscaling client tự tạo unlimited DB connections.

---

## Queue separation

Tách queue theo workload:

```text
ai_plan
artwork
preview_render
final_render
cleanup
```

Vì:

- AI = I/O bound
- resvg/Sharp = CPU/RAM bound
- final render = high-cost job

Concurrency phải benchmark-based, không dùng một số chung cho mọi job.

---

# 19D. Secure Direct Upload Pipeline

Không proxy toàn bộ ảnh user qua Next.js nếu không cần.

Flow production:

```text
Browser
↓
request upload authorization
↓
R2 quarantine object
↓
worker validates
↓
magic bytes
size / megapixel
decode
strip EXIF/GPS
re-encode
↓
R2 clean/private object
↓
delete quarantine object
```

Quarantine object:

- random key
- short retention
- không render trực tiếp
- không public
- không dùng original filename làm path

Card engine chỉ dùng **clean object**.

---

# 19E. Renderer Injection Safety

`CardDocument` là trust boundary.

Không cho user/AI inject raw markup.

Forbidden output fields:

```text
rawHtml
rawSvg
rawCss
javascript
arbitrary external URL
foreignObject
event handlers
```

User text phải:

- XML/HTML escape
- render dưới dạng text node
- không string-concatenate trực tiếp vào unsafe markup

AI chỉ trả:

```text
text
assetId
templateId
palette token
layout token
typography token
```

Asset IDs resolve qua allowlisted asset registry.

---

# 19F. CardDocument Versioning

Mỗi document bắt buộc có:

```json
{
  "schemaVersion": 1,
  "templateVersion": "1.0.0",
  "rendererVersion": "1.0.0",
  "marketPackVersion": "2026.08"
}
```

Phải có migration path:

```text
CardDocument v1
→ normalize/migrate
→ current renderer input
```

Không sửa template cũ theo cách làm paid historical card thay đổi không kiểm soát.

---

# 19G. CSP Strategy

Không bắt toàn website dùng cùng một CSP implementation nếu làm mất performance.

## Marketing / SEO pages

Ưu tiên:

- static generation
- very limited scripts
- strict allowlist CSP
- CDN cacheability

## Application pages

Có thể dùng CSP chặt hơn / nonce nếu architecture cần.

Flow:

```text
Report-Only
↓
monitor violations
↓
enforce
```

Không dùng:

```text
script-src *
unsafe-eval
```

nếu không có lý do bắt buộc.

---

# 19H. Admin Security

## Launch implementation — Template Admin

Template administration is exposed only at:

```text
/admin/templates/*
/api/admin/templates/*
```

Launch protection is intentionally simple for a single operator:

- HTTPS/TLS required in production,
- HTTP Basic credentials from secrets,
- `TEMPLATE_ADMIN_USERNAME`,
- long random `TEMPLATE_ADMIN_PASSWORD`,
- non-GET mutations require `x-cardelume-admin-action: 1`,
- admin responses use no-store,
- managed DB tables remain server-only/RLS protected.

The admin cannot upload arbitrary renderer code; it can only bind managed versions to approved renderer keys.

### Upgrade trigger

Move to Cloudflare Access / identity-aware admin + MFA + named audit identity when:

- more than one operator exists,
- contractors need access,
- role separation is needed,
- named audit identity is required,
- compliance demands stronger admin identity controls.

Do not add a heavyweight account system before those triggers.

Other high-risk administrative actions such as refund, entitlement override, takedown, paid regeneration or user deletion still require explicit audited operational procedures if/when those surfaces are implemented.

---

# 19I. Production SLO

Initial SLO:

| SLO | Target |
|---|---:|
| Public web uptime | **≥ 99.9%** |
| HTTP 5xx | **< 1%** |
| Generation success | **≥ 98.5%** |
| Payment webhook accepted | **99% < 30 s** |
| Paid → final ready | **p95 < 30 s** target |
| Queue wait | **p95 < 10 s** target |
| Pi disk usage alert | **> 80%** |
| Pi CPU temperature alert | **> 80°C** |
| certificate/tunnel health | monitored |

SLO phải gắn alert; không chỉ dashboard.

---

# 20. PWA & Android readiness

Ngay từ đầu:

> **mobile-first webapp**

Không phải desktop app co xuống mobile.

Phải:
- touch-friendly
- thumb-friendly CTA
- responsive typography
- safe areas
- camera/photo picker
- share sheet
- Android back behavior
- manifest
- service worker
- installable PWA
- deep links
- payment redirect handling

Sau khi có traction:

> đóng Android app

Không duy trì hai codebase từ đầu.

---

# 21. Privacy & Global Compliance

Đây là phần bắt buộc phải có trước public launch.

## Privacy Policy

Phải mô tả:
- loại dữ liệu thu thập
- ảnh user upload
- analytics
- payment provider
- AI provider
- retention period
- deletion
- international processing

---

## User photos

User phải xác nhận:
- có quyền sử dụng ảnh upload
- không upload nội dung bất hợp pháp/xâm phạm quyền người khác

Không dùng ảnh user để train model nếu chưa có consent rõ ràng.

---

## Data retention

Không giữ file vô thời hạn.

Ví dụ policy:
- unpaid card: tự xóa sau X ngày
- paid card: giữ X tháng hoặc theo entitlement
- raw upload: xóa sau finalization nếu không cần
- logs: retention ngắn hợp lý

---

## GDPR / privacy-friendly design

Giảm tối đa dữ liệu cá nhân.

Không cần biết:
- địa chỉ thật
- ngày sinh thật
- số điện thoại

nếu product không cần.

Cookie/analytics nên tối giản.

---

# 22. Content Safety & Abuse

AI card platform vẫn có thể bị abuse.

Cần moderation cho:
- hate
- harassment
- sexual content
- violence
- impersonation
- illegal requests
- deepfake-like misuse
- spam
- copyright abuse

Đặc biệt khi cho upload ảnh và AI image generation.

---

# 23. Refund & Support

Phải có policy rõ ràng.

Ví dụ:
- duplicate payment
- broken export
- generation failure
- corrupted file

Nên refund đơn giản nếu lỗi hệ thống.

Không cần hệ thống support phức tạp.

Ban đầu:
- email support
- order ID
- payment ID

---

# 24. Takedown / IP complaint

Vì có user-generated content và stock/public-domain assets, cần có:

- copyright complaint contact
- takedown process
- asset provenance
- asset hash
- source/license tracking

Nếu có tranh chấp, phải truy được nguồn asset.

---

# 25. SEO — Global-first Search Architecture

SEO là acquisition channel quan trọng, nhưng không được biến CardeLume thành programmatic-SEO spam site.

## SEO architecture

Marketing/intent pages phải:

- server-rendered hoặc statically generated
- có meaningful unique copy
- có example cards
- có strong CTA
- load nhanh
- có internal links hợp lý

Application flow không cần index.

---

## URL strategy

Ví dụ global English:

```text
/birthday-card
/birthday-card-for-mom
/birthday-card-for-wife
/anniversary-card
/thank-you-card
/graduation-card
/christmas-card
```

Localization nên dùng stable locale path khi triển khai nhiều ngôn ngữ:

```text
/en/birthday-card
/ja/birthday-card
/ko/birthday-card
/de/birthday-card
```

Không tạo hàng chục nghìn combination page nếu nội dung chỉ thay vài từ.

---

## Index / noindex policy

### Index

- homepage
- occasion landing pages chất lượng
- recipient-intent landing pages quan trọng
- selected editorial/guides hữu ích
- public brand/about/help pages

### Noindex

- `/create`
- Studio
- Results
- Editor
- checkout
- payment callbacks
- account/recovery
- internal search/filter pages
- duplicate A/B variants
- temporary preview URLs
- signed download URLs

Public share card:

```text
/c/<slug>
```

mặc định:

> **noindex**

để bảo vệ privacy và tránh thin/duplicate UGC.

Chỉ cân nhắc index nếu tương lai có explicit user opt-in và moderation.

---

## Canonical

Mỗi indexable page phải có:

> self-referencing canonical

Không canonical tất cả locale về homepage.

Query params dùng cho UI/filter không được tạo duplicate index.

---

## hreflang

Khi có localized market packs:

```text
hreflang="en"
hreflang="ja"
hreflang="ko"
hreflang="de"
hreflang="x-default"
```

Mỗi localized page phải trỏ reciprocal hreflang về nhau.

Không khai báo locale chưa thực sự có translated/localized content.

---

## Metadata

Mỗi landing page:

- unique `<title>`
- unique meta description
- canonical
- Open Graph
- Twitter/X card metadata nếu dùng
- locale metadata
- social preview image

Title không keyword stuffing.

---

## Structured Data

Chỉ dùng schema phản ánh đúng nội dung user nhìn thấy.

Có thể dùng khi phù hợp:

- `Organization`
- `WebSite`
- `SoftwareApplication`
- `BreadcrumbList`
- `FAQPage` chỉ nếu FAQ hiển thị thật và tuân guideline search engine hiện hành

Không fake:

- aggregate rating
- review count
- price
- awards

---

## Sitemap

Tạo:

```text
/sitemap.xml
```

Khi lớn hơn có thể split:

```text
/sitemap-pages.xml
/sitemap-occasions.xml
/sitemap-guides.xml
/sitemap-locales.xml
```

Chỉ đưa URL:

- canonical
- indexable
- 200 OK

Không đưa Studio/share/private pages vào sitemap.

---

## robots.txt

Robots file phải rõ.

Ví dụ logic:

```text
Allow public marketing pages

Disallow:
  /api/
  /checkout/
  /account/
  /internal/
```

Không dùng robots.txt thay thế cho authorization.

Private asset vẫn phải private dù crawler không truy cập.

---

## Technical SEO

Bắt buộc:

- semantic HTML
- heading hierarchy
- descriptive anchor text
- image `alt`
- crawlable internal links
- no JS-only navigation cho core SEO pages
- clean 404/410 strategy
- redirect 301 khi đổi slug
- không chain redirects
- HTTPS canonical only

---

## Core Web Vitals targets

Ưu tiên mobile.

Mục tiêu:

- LCP tốt
- CLS gần 0
- INP tốt
- hero không bị layout shift
- self-host fonts/subsets
- lazy-load dưới fold
- không lazy-load LCP image
- AVIF/WebP khi phù hợp
- reserve image dimensions

Không hy sinh performance để thêm decorative motion.

---

## SEO content principle

Mỗi SEO page phải trả lời một intent thật.

Ví dụ:

> `/birthday-card-for-mom`

nên có:

- curated examples
- tone suggestions
- short guide
- relevant styles
- CTA tạo card

Không chỉ:

> đổi chữ “mom” trong cùng một template SEO.

---

## Search Console / webmaster

Trước launch:

- Google Search Console
- Bing Webmaster Tools nếu target market phù hợp
- submit sitemap
- monitor indexing
- monitor Core Web Vitals
- monitor manual/security issues
- inspect canonical/hreflang

---

## Social SEO / sharing

OG image phải:

- đẹp
- lightweight
- đúng brand
- có dimension ổn định
- không expose private user photo/card nếu user chưa chủ động share

# 26. Viral loop

Paid/free share link có thể trở thành acquisition channel.

Ví dụ:

```text
cardelume.com/c/abc123
```

Người nhận mở:
- card animation nhẹ
- lời chúc
- branding nhỏ
- CTA:

> Create your own card

Free branded cards giúp lan truyền thương hiệu.

---

# 27. Analytics & KPI

## v5 template intelligence metrics

In addition to the customer funnel, template quality is evaluated with source-aware metrics:

```text
impressions
selected
ai_assigned
checkout_started
paid
regenerated
```

Always retain attribution to:

```text
market
locale
source
rank position
exact template version
```

Do not compare templates by raw usage count alone. Position and source create exposure bias, and low-sample templates require smoothing/editorial priors.

Template raw events are privacy-minimized, signed at the browser boundary, rolled up daily and retained for a finite period.


Không chỉ đo pageview.

Theo dõi funnel:

```text
Landing
↓
Start create
↓
Submit brief
↓
Generate
↓
Select card
↓
Edit
↓
Open checkout
↓
Paid
↓
Download
↓
Share
```

---

## KPI chính

### Time-to-first-card
Target:

> **< 60 seconds**

### Generation → Selection rate

Đo chất lượng AI/design.

### Selection → Checkout rate

Đo willingness to pay.

### Checkout → Paid rate

Đo payment UX.

### Paid → Share rate

Đo viral potential.

### Free generation cost / paid order

Đo economics.

### CAC

Sau này đây sẽ là KPI quyết định business.

---

# 28. Cost Guardrails

Phải có dashboard theo dõi:

```text
AI cost / day
AI cost / user
AI cost / paid order
storage cost
email cost
payment fee
refund rate
abuse rate
```

Thiết lập alert nếu:
- AI cost tăng bất thường
- regenerate tăng đột biến
- payment fail rate tăng
- traffic bot tăng

---

# 29. Performance

## Frontend

Target:

- landing page cực nhanh
- mobile-first
- static/SSR marketing pages
- lazy-load below-fold media
- không tải toàn bộ 16+ template full-resolution ngay
- self-host fonts
- font subsets theo locale
- image dimensions cố định để tránh CLS

Next.js production:

- `output: standalone`
- Docker deployment
- static assets cache lâu với content hash
- public template media qua CDN/R2
- không proxy mọi image asset qua Next.js nếu không cần

---

## Renderer

Final render:

```text
CardDocument
↓
SVG
↓
@resvg/resvg-js
↓
Sharp
↓
JPG/PNG
```

PDF:

```text
SVG
↓
PDFKit + svg-to-pdfkit
↓
Print-ready PDF
```

Không dùng Chromium/Puppeteer làm renderer chính trên Pi 5.

---

## Fonts

Production fonts nên self-host và license rõ ràng.

Renderer/browser phải dùng cùng font assets để tránh:

- line-wrap khác nhau
- PDF khác preview
- typography drift

---

## Cache

Cloudflare cache mạnh:

```text
/_next/static/*
public fonts
template thumbnails
marketing assets
public R2 assets
```

Không cache public edge:

```text
/api/*
checkout
payment callbacks
private signed downloads
personalized card JSON
```

Cache-control phải được đặt rõ, không dựa hoàn toàn vào default.

---

## Worker resource guardrails

Pi 5:

- giới hạn concurrency
- tránh render quá nhiều image lớn đồng thời
- temp cleanup
- memory ceiling
- external AI timeout

Nếu load cao:

> queue chậm lại thay vì làm Pi OOM.

---

# 30. Accessibility

Premium không đồng nghĩa bỏ accessibility.

Cần:

- WCAG-oriented contrast
- keyboard support
- semantic buttons
- form labels
- alt text
- visible focus states
- text scaling
- respect `prefers-reduced-motion`
- touch target khoảng 44px cho action quan trọng

Card design preview có thể decorative, nhưng form/checkout phải accessible.

---

# 31. Reliability, Backup & Disaster Recovery

## Stateless rule

Pi 5 và VPS không được là nơi duy nhất giữ:

- DB
- paid asset
- uploaded photo
- payment entitlement
- license manifest

---

## Database backup

Supabase/PostgreSQL:

- provider backup theo plan
- periodic logical export ngoài provider
- migration files version-controlled
- restore test định kỳ

Backup chỉ có giá trị khi restore đã được test.

---

## R2 / asset recovery

Cần:

- asset manifest
- deterministic object naming policy
- paid-final metadata trong DB
- source `CardDocument`
- template version
- renderer version

Nếu paid JPG/PDF mất nhưng source còn:

> có thể regenerate final asset.

---

## Disaster scenarios

Phải có runbook cho:

1. Pi mất điện
2. Pi NVMe hỏng
3. home Internet down
4. VPS down
5. corrupted deploy
6. Supabase incident
7. R2 incident
8. AI provider outage
9. Dodo webhook delayed
10. leaked secret

---

## RTO / RPO MVP

Mục tiêu hợp lý ban đầu:

- web failover Pi → VPS: **seconds**
- rollback bad app deploy: **minutes**
- DB recovery: theo Supabase plan + export policy
- business-critical payment event không được mất vì app restart

---

## Graceful degradation

Nếu AI provider lỗi:

- marketing site vẫn sống
- existing purchased downloads vẫn hoạt động
- generation hiện error thân thiện
- không charge user cho generation thất bại

Nếu Pi lỗi:

- VPS serve website
- worker có thể concurrency thấp hơn
- không hiện raw infrastructure error.

---

# 32. Observability & Monitoring

Tối thiểu:

## Application

- Next.js errors
- API latency
- 5xx rate
- worker failures
- queue depth
- generation duration

## Business-critical

- Dodo webhook failures
- payment paid-but-not-rendered
- final render failures
- signed download failures
- duplicate payment/event anomalies

## Infrastructure

- Pi health
- VPS health
- WireGuard reachability
- disk usage
- memory
- CPU temperature Pi
- container restart count
- SSL/certificate expiry

---

## Tools

Khuyến nghị:

- **Sentry** — app exceptions
- **Uptime Kuma** — endpoint / node monitoring
- structured JSON logs
- Cloudflare analytics/security events

Không log:

- full payment secrets
- auth tokens
- signed URLs nguyên vẹn nếu không cần
- raw private photo content

---

## Correlation

Mỗi flow nên có:

```text
request_id
card_id
job_id
order_id
payment_event_id
```

để trace end-to-end.

---

# 33. QA / Testing

## v5 template-system QA

Required Step 12 regression coverage:

- migration tables/constraints,
- exact template/version composite integrity,
- archive-not-delete behavior,
- approved-renderer-key boundary,
- no-photo/photo eligibility,
- 3-direction archetype diversity,
- family diversity,
- 4 Recommended + 4 Market + up to 8 More without duplicate IDs,
- market-fill label behavior,
- exact preview-version checkout pinning,
- AI ranking before provider call,
- server-side `ai_assigned` / `paid` attribution,
- signed/expiring browser analytics capabilities,
- event rate limit,
- daily metrics rollup,
- raw event retention,
- catalog readiness coverage,
- full regression of payment/photo/generation/recovery/operations/container guards.

A brand-new renderer key still requires export, typography, script, photo, WCAG and deterministic-render QA before it becomes admin-selectable.


Bắt buộc:

### Device

- mid-range Android
- iPhone
- tablet
- desktop
- low-power laptop

### Browser

- Chrome
- Safari
- Edge
- mobile Safari
- Android Chrome

### SEO

- title/meta/canonical
- sitemap
- robots
- noindex internal flow
- hreflang khi bật locale
- structured data validation
- social preview
- 404/redirect

### Security

- RLS cross-user test
- unauthenticated API test
- upload invalid MIME/magic bytes
- oversized image
- rate limit
- Turnstile abuse path
- CSP report-only trước enforce
- HTTPS redirect
- HSTS after stabilization
- no secret in client bundle
- webhook bad signature
- duplicate webhook/replay

### Failover

- stop Pi app
- power-off Pi
- break WireGuard
- verify HAProxy routes VPS
- restore Pi
- verify traffic returns theo policy
- ensure no duplicate jobs

### Localization

- English
- Japanese
- Korean sau này
- long German/French strings
- Unicode/emoji

### Payment

- success
- failure
- retry
- duplicate webhook
- out-of-order webhook
- refund
- cancelled checkout

### Export

- JPG
- PDF
- print layout
- Unicode
- emoji
- Japanese/Korean characters
- long personalized copy
- every card format

# 34. Brand & Visual Principle

Sản phẩm phải cảm giác:

> **simple but premium**

Premium đến từ:
- whitespace
- typography
- animation nhẹ
- consistency
- beautiful loading states
- elegant micro-interactions
- strong art direction

Không phải từ:
- nhiều button
- nhiều panel
- nhiều setting

---

# 35. Loading UX

Không dùng:

> Generating...

Dùng storytelling ngắn:

> Writing something special...

> Choosing the perfect style...

> Finishing your card... ✨

Nhưng không giả thời gian hoặc kéo dài animation không cần thiết.

---

# 36. Phase 1 — Không làm

Không:
- subscription
- credits
- teams
- workspace
- marketplace
- collaboration
- complex account
- Canva-like canvas
- layer panel
- timeline
- brand kit
- advanced image editor
- long AI chat
- RSVP
- guest management
- physical printing fulfillment
- native Android riêng
- microservices
- Kubernetes
- multi-cloud

---

# 37. Production Technical Stack

## Frontend / App

```text
Next.js App Router
React
TypeScript
Tailwind CSS + custom CSS
TanStack Query
React Hook Form
Zod
Lucide icons
```

Motion:

> ưu tiên CSS / Web Animations / View Transitions API.

Không thêm animation dependency lớn nếu CSS đủ xử lý.

---

## Monorepo

```text
pnpm workspaces
+ Turborepo
```

Suggested:

```text
cardelume/
├── apps/
│   ├── web/
│   └── worker/
├── packages/
│   ├── card-schema/
│   ├── renderer/
│   ├── templates/
│   ├── ai/
│   ├── db/
│   └── ui/
├── docker/
├── pnpm-workspace.yaml
└── turbo.json
```

---

## Backend / Data

```text
Next.js Route Handlers
Node.js worker
pg-boss
Supabase PostgreSQL
Supabase Anonymous Auth
Drizzle ORM
Zod
```

---

## Media

```text
Cloudflare R2
```

---

## Rendering

```text
SVG
@resvg/resvg-js
Sharp
PDFKit
svg-to-pdfkit
```

Không dùng Puppeteer làm final-render pipeline chính.

---

## Payment

```text
Dodo Payments
Merchant of Record
signed webhook
```

---

## Infrastructure

```text
Cloudflare DNS/CDN/WAF
Cloudflare Tunnel × 2
Cloudflare Load Balancer
Raspberry Pi 5
VPS
Docker Compose
Optional WireGuard for private administration
```

---

## CI/CD

```text
GitHub
GitHub Actions
GHCR
multi-arch ARM64 + AMD64
immutable image tags
```

---

## Monitoring

```text
Sentry
Uptime Kuma
structured logs
Cloudflare analytics
```

---

## Không dùng ở Phase 1

- Kubernetes
- Docker Swarm
- Redis nếu pg-boss đủ
- Prisma nếu Drizzle đủ
- NestJS
- separate API microservice
- local production DB
- local-only object storage
- DNS-based failover
- Chromium/Puppeteer render farm

---

# 38. High-level Production Architecture

## v5 template intelligence subsystem

```text
                                 ┌─────────────────────────────┐
                                 │ Managed Template Library    │
                                 │ family / template / version │
                                 │ targeting / metrics         │
                                 └──────────────┬──────────────┘
                                                │
                           ┌────────────────────┴────────────────────┐
                           ▼                                         ▼
                    Generation worker                         Studio discovery
                           │                                         │
                 eligibility + ranking                    4 Recommended
                           │                               4 Market Picks
                 3 diverse versions                         +8 More max
                           │                                         │
                           ▼                                         │
                       AI planner                                     │
                           └──────────────────┬───────────────────────┘
                                              ▼
                                      exact template/version
                                              │
                                              ▼
                                           checkout
                                              │
                                              ▼
                                      paid deterministic final
```

Template catalog and metrics live in shared Postgres, so both Pi5 and VPS use identical selection state. `/health/ready` fails closed when catalog coverage is no longer sufficient.


## Phase 1 — Free HA

```text
                            USERS
                              │
                              ▼
                         CLOUDFLARE
       DNS · CDN · WAF · TLS · Rate Limits · Turnstile
                              │
                              ▼
                    SHARED TUNNEL UUID
                    ┌─────────┴─────────┐
                    │                   │
              cloudflared          cloudflared
                    │                   │
                    ▼                   ▼
              RASPBERRY PI 5           VPS
              Web + Worker         Web + Worker
                    │                   │
                    └─────────┬─────────┘
                              │
             ┌────────────────┼────────────────┐
             ▼                ▼                ▼
         SUPABASE             R2              DODO
      Postgres/Auth        Objects       Merchant of Record
             │                │                │
             └────────┬───────┴───────┬────────┘
                      │               │
                      ▼               ▼
                 AI PROVIDERS      WEBHOOK
                      │               │
                      ▼               ▼
                  CARD PLAN        PAYMENT PAID
                      │               │
                      ▼               ▼
              CardDocument vN    final_render job
                      │               │
                      └───────┬───────┘
                              ▼
                         SVG RENDERER
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
             WATERMARKED PREVIEW     PAID FINAL
                    │                JPG / PDF
                    └─────────┬─────────┘
                              ▼
                         PRIVATE R2
```

---

## Availability model — Launch

### Pi down

```text
Pi cloudflared connections disappear
↓
VPS replica remains
↓
web continues
```

### VPS down

```text
VPS replica disappears
↓
Pi replica remains
↓
web continues
```

### Pi app crash but host stays alive

```text
local /health/live fails
↓
watchdog disables/restarts Pi cloudflared
↓
VPS replica serves
```

### WireGuard down

```text
no effect on public web
```

### Both nodes healthy

Cloudflare may route requests to either node.

Therefore:

> **No local application state may be required for correctness.**

---

## Runtime flow — Create card

```text
Browser
↓
Cloudflare
↓
shared tunnel
↓
Pi or VPS
↓
POST /api/cards/generate
↓
session + Zod + quota + idempotency
↓
enqueue pg-boss
↓
return job_id
↓
adaptive polling
↓
available worker
↓
CardDocument vN
↓
render previews
↓
private R2
↓
job = ready
```

---

## Runtime flow — Payment

```text
Choose card
↓
Dodo checkout
↓
signed webhook
↓
Cloudflare
↓
Pi or VPS
↓
signature + idempotency
↓
payment = PAID
↓
final_render job
↓
available worker
↓
private R2
↓
entitlement
↓
short-lived signed URL
```

---

## Upgrade path

### Stage A — Launch

```text
Shared Tunnel
Pi + VPS
$0 HA routing
```

### Stage B — Revenue / stronger HA control

```text
Cloudflare Load Balancer
2 independent Tunnels
Pi primary
VPS fallback
```

### Stage C — Scale

```text
Cloudflare LB
VPS1 + VPS2 + VPS3
Pi optional
```

### Stage D

```text
managed container compute / Vercel / Cloud Run / equivalent
```

Giữ nguyên:

- Supabase
- R2
- Dodo state machine
- CardDocument
- renderer
- provider interfaces
- queue abstraction

> **Scale by replacing routing/compute, not by rebuilding product core.**

---

## Provider abstraction

Core application uses:

```text
AIProvider
ObjectStorage
JobQueue
PaymentProvider
Renderer
EmailProvider
```

Phase 1:

```text
ObjectStorage → R2
JobQueue      → pg-boss
Payment       → Dodo
Renderer      → resvg/Sharp
```

---

# 39. Roadmap

The detailed current roadmap is authoritative in `ROADMAP_V7.md`. The locked sequence is:

```text
Step 13 — AI Creative Director                 DONE IN CODE
Step 14 — Premium Quality Benchmark Lab        NEXT
Step 15 — Lumer AI Operator Toolkit            PLANNED
Step 16 — Experiment / Staging Lab             PLANNED
Step 17 — IP + Security Governance              PLANNED
Step 18 — Controlled Runtime + Commerce E2E     PLANNED
Step 19 — Pi5 + Oracle Production / HA          PLANNED
Step 20 — Optional Lume Account                 FEATURE-FLAGGED / AFTER CORE QUALITY
Step 21 — Soft Launch                           AFTER ALL LAUNCH GATES
```

Rules:

- Do not add another creative-architecture layer before Step 14 produces real benchmark evidence.
- `~60 templates` is a **portfolio growth target**, not a hard launch requirement. Quality, coverage and originality matter more than count.
- Anonymous creation and purchase remain first-class even after optional accounts exist.
- Production changes made by Lumer remain evidence-backed and approval-gated.
- Experiment results do not become production behavior until benchmark, security, IP and rollout gates pass.

# 40. Launch Checklist

## Product
- [ ] Home cực đơn giản
- [ ] < 60 giây tới first card
- [ ] 3 strong variations
- [ ] simple editor
- [ ] mobile-first

## Templates
- [ ] 60 template
- [ ] license sạch
- [ ] font license verified
- [ ] asset manifest

## AI
- [ ] cost limits
- [ ] retry
- [ ] fallback
- [ ] moderation
- [ ] free-generation limit

## Payment
- [ ] Dodo approval
- [ ] webhook signature
- [ ] webhook idempotency
- [ ] refund path
- [ ] paid entitlement

## Security
- [ ] RLS
- [ ] secrets server-side
- [ ] signed URLs
- [ ] no public final files
- [ ] upload validation
- [ ] rate limit

## Free HA availability
- [ ] one production Cloudflare Tunnel UUID created
- [ ] Pi runs a replica of the shared tunnel
- [ ] VPS runs a replica of the shared tunnel
- [ ] no public Next.js port exposed
- [ ] local watchdog checks `/health/live`
- [ ] app crash causes unhealthy node replica to leave/restart
- [ ] Pi power-off → VPS serves
- [ ] VPS shutdown → Pi serves
- [ ] home Internet down simulation → VPS serves
- [ ] WireGuard down does not affect public web
- [ ] both workers verified against same durable queue
- [ ] no request correctness depends on sticky session
- [ ] upgrade path to independent tunnels + LB documented

## Performance gate
- [ ] LCP p75 ≤ 2.5s target
- [ ] INP p75 ≤ 200ms target
- [ ] CLS ≤ 0.10
- [ ] landing initial JS within budget
- [ ] mobile animation ~55–60fps
- [ ] no continuous heavy blur/shadow animation
- [ ] Card Reveal respects reduced-motion
- [ ] adaptive polling implemented

## Renderer security
- [ ] CardDocument versioned
- [ ] user text escaped in SVG/XML
- [ ] no raw SVG/HTML from AI
- [ ] asset IDs allowlisted
- [ ] quarantine upload pipeline
- [ ] clean object only reaches renderer

## Preview protection
- [ ] baked watermark
- [ ] medium resolution
- [ ] clean final never sent pre-payment

## Privacy
- [ ] privacy policy
- [ ] terms
- [ ] upload rights confirmation
- [ ] retention policy
- [ ] delete workflow

## Reliability
- [ ] DB backup
- [ ] monitoring
- [ ] error logging
- [ ] payment alerts

## Analytics
- [ ] funnel events
- [ ] conversion
- [ ] AI cost/order
- [ ] market/style performance

---

# 41. Nguyên tắc cuối cùng cho Hermes

Mỗi khi muốn thêm một tính năng, phải hỏi:

> **Does this reduce the effort required to get a beautiful card?**

Nếu không:

> cân nhắc không làm.

Và:

> **If a feature makes the user think more before getting the card, it is probably the wrong feature for Phase 1.**

---

# 40A. HA Routing Decision — Final for Launch

## Default launch

> **Use one Cloudflare Tunnel UUID with two replicas: Pi5 + VPS.**

Reason:

- $0 routing HA
- no Worker quota
- no custom edge retry router
- no HAProxy single point of failure
- no public app port
- enough for launch while app is stateless

## Known trade-off

Cannot guarantee:

```text
Pi = primary
VPS = standby
```

while both replicas are healthy.

This is acceptable for Phase 1.

## Upgrade trigger

Move to Cloudflare Load Balancer when any of these become true:

- VPS must be fallback-only
- need deterministic primary/fallback
- need edge-level health checks
- need weighted traffic
- add third origin
- shared-tunnel routing causes measurable performance problems
- HA cost is negligible relative to revenue

---

# 41A. Production Architecture Decisions — Locked

Các quyết định mặc định cho implementation:

| Layer | Decision |
|---|---|
| Web | Next.js + TypeScript |
| Query state | TanStack Query |
| Forms | React Hook Form + Zod |
| ORM | Drizzle |
| Queue | pg-boss |
| DB/Auth | Supabase PostgreSQL + Anonymous Auth |
| Storage | Cloudflare R2 |
| Render | SVG + resvg + Sharp |
| PDF | PDFKit + svg-to-pdfkit |
| Payment | Dodo Payments |
| Edge | Cloudflare |
| Public ingress | Cloudflare CDN/WAF/TLS + Shared Tunnel |
| Origin connectivity | 1 Tunnel UUID + 2 replicas |
| Primary compute | Raspberry Pi 5 |
| Paid HA upgrade | 2 Tunnels + Cloudflare Load Balancer |
| Deployment | Docker Compose |
| CI/CD | GitHub Actions + GHCR multi-arch |
| Monitoring | Sentry + Uptime Kuma |
| TLS | Cloudflare edge HTTPS; Tunnel-based private origins |

Nếu một implementation agent muốn thay stack trên, phải có lý do measurable về:

- reliability
- security
- performance
- operational simplicity
- cost

Không thay chỉ vì framework/library “phổ biến hơn”.

---

# 42. Những ưu tiên P0 quan trọng nhất

1. Mobile-first
2. Simple brief
3. AI Card Planner
4. 3 premium art directions
5. Structured + versioned CardDocument
6. Managed premium template library; grow toward ~60 original/licensed designs only as quality/market evidence justifies it
7. Copyright-safe asset pipeline
8. Real-card material treatment
9. Signature Card Reveal + shared transition
10. Numeric performance budget / Core Web Vitals
11. Watermarked unpaid preview
12. Dodo one-time checkout
13. Verified + idempotent webhook
14. Paid signed download
15. Supabase Anonymous Auth + RLS
16. Direct-to-R2 quarantine upload
17. Renderer injection safety
18. Shared Cloudflare Tunnel + 2 replicas
19. Local application health watchdog
20. Pi/VPS free HA failover
21. Durable dual-node worker strategy
22. Paid HA upgrade path: 2 Tunnels + Cloudflare Load Balancer
23. Market Pack architecture
24. AI cost guardrails
25. Analytics funnel
26. Security headers / CSP
27. Privacy / Terms / Refund / IP policy
28. Backup / monitoring / SLO
29. SEO / canonical / sitemap / noindex app flow
30. Launch US/global English first
31. Invitation chỉ làm sau khi Greeting Card chứng minh conversion

---

## One-line vision

> **CARDELUME — Beautiful cards, made in moments. No design skills, no account, no subscription. Pay only when you love it.**


---

**Production architecture updated:** 2026-08-27 — Phase 1 free HA = shared Cloudflare Tunnel with Pi5 + VPS replicas; paid upgrade = independent tunnels + Cloudflare Load Balancer.


# Appendix V5-A — Step 12 authority and implementation status

## Step 12 documentation set

The managed-template subsystem is fully specified across:

```text
docs/TEMPLATE_SYSTEM_SPEC_0.4.3_STEP12.md          # normative feature/domain contract
docs/ARCHITECTURE_V7_LUMER_OPERATIONS.md          # current runtime/trust-boundary architecture
docs/PREMIUM_EXPERIENCE_CONVERGENCE_0.4.3_STEP17I.md # current customer-experience source delta
docs/TEMPLATE_API_CONTRACTS_0.4.3_STEP12.md        # HTTP/API contract
docs/TEMPLATE_ADMIN_RUNBOOK_0.4.3_STEP12.md        # editorial/operator workflow
docs/TEMPLATE_RANKING_ANALYTICS_0.4.3_STEP12.md    # scoring/evidence semantics
docs/TEMPLATE_ROLLOUT_MIGRATION_0.4.3_STEP12.md    # deployment/migration/rollback
docs/VALIDATION_REPORT_0.4.3_STEP17I.md             # current claims/evidence boundary
```


Step 12 is implemented in code under version `0.4.3-step.12`.

Primary implementation-backed documents:

```text
docs/TEMPLATE_SYSTEM_SPEC_0.4.3_STEP12.md
docs/VALIDATION_REPORT_0.4.3_STEP17I.md
docs/HISTORY_INDEX.md
```

If a historical section in v4-era documents conflicts with the managed template architecture above, use the Step 12 implementation and Step 12 spec.

### V5 exact template-version DB invariant

The managed template pair is all-or-nothing at the database boundary. A managed card version may not store only a template ID or only a template-version ID; the composite pair must reference one real immutable template version. Template analytics likewise require exact version identity.

### V5 renderer capability subset rule

Managed template metadata cannot expand the technical capability of a QA-approved renderer. Supported formats/scripts declared by an admin-created version must remain within the renderer key’s approved capability set.

---

# V6 / Step 13 — Premium AI Creative Direction Authority

Step 13 supersedes any earlier wording that implies deterministic ranking is the final creative decision.

## Generation authority

- Hard compatibility/security constraints are deterministic and non-overridable.
- Soft rank scores are priors only.
- Candidate shortlist is normally 6 high-fit + 2 creative wildcards.
- A premium AI Creative Director reviews the shortlist and selects the final three immutable template versions.
- AI may request a bounded candidate expansion when the shortlist lacks creative range.
- AI returns a creative thesis, approved signature move, controlled accent treatment and premium copy for each direction.
- Recent pseudonymous style fingerprints add freshness pressure so repeat customers do not receive the same-looking cards by default.
- Deterministic quality gates detect measurable failure; a premium critic/repair call is conditional, not default.
- Core customer-facing generation stays on the configured premium production model. Economics are optimized through shorter context and fewer calls, not a weaker creative model.

Canonical detailed authority: `AI_CREATIVE_DIRECTOR_0.4.3_STEP13.md` and `AI_GENERATION_ECONOMICS_0.4.3_STEP13.md`.


## V6-A — Step 13 final creative governance invariants

1. **Hard constraints veto; they do not art-direct.** Lifecycle, health, exact renderer compatibility, format, script, excluded-market and photo requirements are deterministic.
2. **Soft scores are explainable priors only.** Feeling, occasion, market affinity, editorial/performance evidence, text fit, freshness and recent-style novelty may affect ordering but never become the final creative decision.
3. **Normal candidate context is 6 fit + 2 high-quality wildcards.** Wildcards must still pass all hard constraints and editorial quality floor.
4. **AI Creative Director owns the final first-pass choice of three.** It sees score decomposition and can deliberately choose a lower-ranked candidate for stronger emotional/creative rationale.
5. **AI may object to the shortlist once.** Bounded expansion is <=16 and carries forward the AI's own critique/desired traits.
6. **Creative controls are allowlisted.** AI cannot emit CSS/SVG/layout code or arbitrary renderer parameters.
7. **Conditional critic can reconsider selection only for creative-range risk.** Ordinary copy/control repair cannot swap immutable versions.
8. **Every replacement remains server-supplied, exact-version and family-unique.** AI never invents catalog identity.
9. **Premium quality is revalidated after critic.** Persistent material risk fails closed to curated fallback.
10. **Uploaded photo is creative input, not mandatory art direction.** AI may veto photo use; hard template photo requirements remain authoritative.
11. **Freshness is pseudonymous and content-free.** Do not store card copy/photo to achieve anti-sameness and do not covertly fingerprint users across devices.
12. **Core customer generation stays on the premium model.** Savings come from compact context, one-call normal flow, cached/objective preprocessing and conditional extra calls—not a weaker creative model.
13. **Bounded worst case is three premium calls.** No unbounded agent loop.
14. **Optimization objective:** best for this person and this moment, with premium/wow above latency/cost.


# V7 / Lumer — AI-Managed Product Operations Authority

## Lumer identity

**Lumer** is the dedicated Hermes profile for CardeLume and future Lume-family projects. It is an internal AI operator, not a production service dependency.

Lumer responsibilities:

- product/project health review;
- creative quality and template portfolio management;
- benchmark orchestration;
- experiment management;
- competitor/market/pricing research;
- IP/license provenance audit;
- security audit and release readiness;
- AI economics/latency/quality analysis;
- incident triage and recovery assistance;
- maintenance of project-local operating skills.

Lumer must not become an unrestricted production superuser.

## Authority tiers

| Tier | Typical actions | Default Lumer authority |
|---|---|---|
| A0 — Observe | read source, docs, logs, metrics, public research | autonomous |
| A1 — Prepare | proposals, benchmark runs, reports, local tests, branches/worktrees | autonomous |
| A2 — Experiment/Staging | deploy feature-flagged experiments, mutate isolated staging data | autonomous within quotas/policy |
| A3 — Production change | production deploy, production migration, payment/routing/security config | explicit owner approval required |
| A4 — Irreversible/high-risk | destructive DB/storage actions, secret rotation, disabling security gates, bulk data deletion | explicit approval + backup/rollback evidence required |

No skill or SOUL instruction may silently weaken this matrix.

## Skill precedence

CardeLume-specific procedures belong in project-local:

```text
<repo>/.hermes/skills/
```

This keeps creative/publish/security/IP workflows version-controlled with the project. Cross-Lume procedures may live in a Lumer-maintained shared skills repository or profile-local skill tree. Project-local CardeLume policy always wins for CardeLume sessions.

## Production principle

> **Lumer may autonomously inspect, research, test and improve experiments/staging. Production-impacting changes are least-privilege and approval-gated.**

## Copyright principle

> **Unknown license = rejected. Verifiable commercial-use provenance is required before production publication.**

This applies to fonts, images, ornaments, illustrations, templates, reference-derived work and AI-generated assets.

## Security principle

CardeLume targets OWASP ASVS 5.0 Level 2 for the customer-facing application, with risk-based higher-assurance controls for payment, recovery, admin, secrets and operations. The OWASP Top 10:2025 is an awareness/checklist complement, not a substitute for ASVS verification.

## Account principle

Optional Lume Account may add cross-device My Cards and opt-in style memory, but it must never make account creation a requirement for creating, purchasing or securely recovering a card.


## Step 17E font/template launch-safety addendum

CardeLume separates template technical runtime state from launch approval. `status/health/version` continue to protect renderer/runtime correctness; `launch_status` protects product/IP/quality promotion. Held/retired families are excluded. Production catalog reads require `launch_status=approved`; experiment/staging may evaluate `experiment`/`candidate` families inside their isolated lanes. This never converts a soft creative score into a hard aesthetic rule: once a candidate is production-approved and objectively compatible, Step 13 Premium AI remains the final creative decision-maker.

Font family license eligibility is also separate from exact shipped-binary approval. Source may select a candidate such as Plus Jakarta Sans, but production still requires pinned package/artifact evidence, hashes, retained license evidence and browser/final-render QA.

---

## Step 17F — Product / UX integration authority addendum

Step 17F does not change the Step 13 creative-authority hierarchy. It closes integration gaps between that engine and customer/operator surfaces.

Locked product rules after Step 17F:

- customer generation remains a three-direction AI-curated flow;
- a dissatisfied customer asks for three new directions instead of browsing a template marketplace in the main Studio flow;
- launch-held/retired templates must not appear on customer-facing showcase/preview surfaces;
- every governed visual direction exposed by the template system must have an explicit web-preview implementation or fail source validation;
- copy finishing may use bounded AI rewrite, but may not invent facts/memories or become an unbounded agent loop;
- technical template activation is not production launch approval;
- production template launch requires version-bound benchmark, IP and human Premium/WOW evidence plus explicit owner/admin action;
- customer funnel analytics must be privacy-minimized and content-free;
- legal/security production gates fail closed when owner/runtime evidence is missing.

Migration authority now extends through `0011_funnel_and_launch_approvals.sql`.


### Current source delta — Step17J
See `docs/MATERIAL_MAGIC_GALLERY_PREMIUM_CONVERGENCE_0.4.3_STEP17J.md` and `docs/VALIDATION_REPORT_0.4.3_STEP17J.md`. Step17I is historical.

# CardeLume 0.4.0 — Localization & Premium Voice QA

## Scope

Reviewed the baseline localization as **transcreation**, not word-for-word translation, for:

- EN — English / Global
- JA — Japanese
- KO — Korean
- ES — Spanish / Spain + LATAM baseline
- FR — French
- DE — German
- PT — Brazilian Portuguese
- IT — Italian
- ZH — Simplified Chinese
- VI — Vietnamese

Review criteria:

1. semantic accuracy
2. warmth and emotional tone
3. premium stationery feel
4. absence of unnecessary SaaS/AI jargon
5. relationship/formality behavior
6. text density / card composition
7. checkout clarity
8. consistency with CardeLume’s core idea:
   - tell us the moment
   - CardeLume handles the taste / composition
   - see before paying
   - one-time digital card
   - no Canva-like design work

## Automated integrity checks

- **10 / 10 locales:** complete key parity with English.
- **0 missing localized leaf fields.**
- **0 empty localized fields.**
- **0 placeholder mismatches** for variables such as `{name}`.
- Unwanted UI jargon audit for `brief`, `art direction`, `subscription`, `crop`, `palette`, etc.: **0 accidental occurrences** in the final `messages` / `launch-copy` surfaces.
- Representative card-copy Magic Typography test:
  - EN / ES / FR / DE / PT / IT / VI: headline stays at or above **44px**, body at or above **11px**.
  - JA / ZH: headline stays at or above **37px**, body at or above **10.4px**.
  - KO: headline stays at or above **38px**, body at or above **10.4px**.
  - No representative sample was forced into `compact` density.

## Language-by-language assessment

| Locale | Premium voice | Naturalness | Product meaning | Status |
|---|---:|---:|---:|---|
| EN | 9.5/10 | 9.5/10 | 10/10 | Source voice |
| JA | 9.3/10 | 9.2/10 | 9.5/10 | Launch-quality baseline |
| KO | 9.2/10 | 9.2/10 | 9.5/10 | Launch-quality baseline |
| ES | 9.1/10 | 9.1/10 | 9.5/10 | Launch-quality global Spanish baseline |
| FR | 9.3/10 | 9.2/10 | 9.5/10 | Launch-quality baseline |
| DE | 9.2/10 | 9.2/10 | 9.5/10 | Launch-quality baseline |
| PT-BR | 9.2/10 | 9.3/10 | 9.5/10 | Launch-quality Brazilian baseline |
| IT | 9.2/10 | 9.2/10 | 9.5/10 | Launch-quality baseline |
| ZH-CN | 9.4/10 | 9.3/10 | 9.5/10 | Launch-quality Simplified Chinese baseline |
| VI | 9.5/10 | 9.5/10 | 9.7/10 | Launch-quality baseline |

### EN

The English source now leads with **premium cards / thoughtful composition**, not AI technology.

Good:
- restrained
- emotional
- clear one-time purchase
- concise product promise

Keep:
> Beautiful cards, made in moments.

### JA

The Japanese version was moved away from agency/technology language toward:
- 想い
- 丁寧に仕立てる
- 美しい構成
- その人らしい一枚

This is more appropriate for premium stationery than literal translations of “AI” or “art direction”.

Examples:
> 想いを丁寧に仕立てる、上質なカード

> その人らしい一枚を。

> 色違いではなく、同じ想いから仕立てた3つの異なるデザインです。

Thank-you / anniversary copy was also rewritten to avoid incomplete or machine-translated sentence structures.

### KO

The Korean version now favors warm, natural consumer language over agency jargon.

Examples:
> 아름다운 카드를, 몇 번의 선택만으로.

> 같은 내용을 서로 다른 분위기와 구성으로 완성한 세 가지 카드입니다.

The no-photo direction was renamed from a direct English transliteration to:
> 고요한 편지

This feels more emotional and premium.

### ES

The Spanish version removes `brief` and technical design jargon from the customer-facing flow.

Examples:
> Tarjetas premium, compuestas con intención

> No son tres cambios de color: son tres direcciones artísticas distintas construidas a partir de las mismas elecciones.

Thank-you and congratulations copy is now more neutral so it can work for personal and professional relationships.

This is intentionally a broad Spanish baseline. Before country-specific campaigns, Spain vs Mexico / LATAM vocabulary can be split if analytics justify it.

### FR

French was moved from “premium / design tool” language toward a more luxury-consumer tone.

Examples:
> Des cartes haut de gamme, composées avec soin

> Vous choisissez l’émotion. CardeLume s’occupe de l’élégance.

The product uses informal `tu` for personal birthday copy and a formal branch for Client / Coworker. Thank-you and congratulations copy is largely pronoun-neutral to avoid inappropriate register.

### DE

German now uses:
- Gestaltung
- Gestaltungsrichtungen
- Feinschliff
- Komposition

instead of repeated `Art Direction / Design / Briefing` jargon.

Example:
> CardeLume übernimmt Gestaltung, Worte und Feinschliff.

Professional thank-you / congratulations wording was also made register-neutral.

### PT-BR

Brazilian Portuguese keeps the warmth expected in consumer gifting while removing excessive creative-agency jargon.

Examples:
> Cartões premium, compostos com cuidado

> Não são três trocas de cor — são três direções de arte distintas a partir das mesmas preferências.

The wording intentionally uses Brazilian conventions rather than European Portuguese.

### IT

Italian was corrected for:
- natural `quest’anno`
- gender-neutral emotional copy where practical
- a genuinely formal birthday branch
- neutral thank-you / congratulations language

Examples:
> Biglietti premium, composti con cura

> Un momento davvero meritato, {name}.

### ZH-CN

Simplified Chinese now emphasizes:
- 用心
- 高级
- 视觉风格
- 克制材质
- 心意

rather than literal agency terminology.

Examples:
> 用心排版的高级贺卡

> 不是三种换色，而是围绕同一份心意做出的三种不同视觉风格。

This matches the “premium stationery first” positioning well.

### VI

Vietnamese received the strongest transcreation pass because the earlier version contained unnecessary English terms such as:
`brief`, `art direction`, `crop`, `palette`, `subscription`, `foil`.

They were replaced with natural customer language.

Examples:
> Thiệp cao cấp, được chăm chút từng chi tiết

> CardeLume lo phần lời chúc, định hướng mỹ thuật và hoàn thiện.

> Không phải ba bản đổi màu — mà là ba hướng mỹ thuật riêng từ cùng một nội dung.

> Bố cục luôn được giữ cân bằng khi bạn chỉnh lời.

> Không đăng ký gói · không cần tài khoản

Card copy was also rewritten away from literal English calques:
> Cảm ơn {name} — vì đã khiến mọi thứ trở nên đặc biệt hơn.

> Bạn hoàn toàn xứng đáng. Hãy tận hưởng trọn vẹn khoảnh khắc này.

## Intentional non-translated terms

The following may remain when appropriate because they are brand names, file formats, recognized print/style techniques or technical labels rather than accidental English leakage:

- CardeLume
- JPG / PNG / WebP / AVIF / PDF
- Midnight Lume
- Art Deco Noir
- Washi
- Hanji
- Letterpress
- Risograph
- Kawaii
- selected curated style names

Customer-facing product instructions do **not** rely on users understanding these terms.

## Core-value alignment

The final localization preserves the same idea in every market:

> The user provides the moment and feeling.  
> CardeLume provides taste, composition and finish.  
> The user sees the result before paying.  
> The purchase is simple, digital and one-time.

The translations deliberately avoid positioning CardeLume as:
- an AI tool
- a SaaS dashboard
- a graphic-design editor
- a template marketplace

## Remaining recommendation before paid public launch

This QA is a high-detail model-based linguistic/transcreation review, **not a substitute for native-market legal or editorial sign-off**.

Before spending materially on paid acquisition in JA / KO / ES / FR / DE / PT / IT / ZH:
- have one native copy editor per priority market proof the final production pages
- prioritize emotional card copy and payment/legal microcopy
- do not let native review turn the product back into verbose, literal translation

No current translation issue is considered a design/product launch blocker in the 0.4.0 baseline.

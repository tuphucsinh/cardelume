> **Historical planning context:** current authority is `MASTER_SPEC_V7.md`, `ARCHITECTURE_V7_LUMER_OPERATIONS.md`, `VALIDATION_REPORT_0.4.3_STEP17I.md` and `HISTORY_INDEX.md`.

# CARDELUME — Upgrade Plan After Design Review

> **Mục tiêu:** Nâng CardeLume từ một prototype **premium** thành một trải nghiệm **WOW**, nhưng không làm sản phẩm phức tạp hơn.
>
> **Nguyên tắc xuyên suốt:**  
> **The card must be the hero.**  
> Khách hàng không mua giao diện CardeLume. Họ mua **tấm thiệp**.

---

# 1. Kết luận tổng hợp

Sau khi đối chiếu các review, nhận định chung là:

> **CardeLume hiện đã “premium”, nhưng chưa “WOW”.**

Điểm mạnh hiện tại nằm ở:

- brand direction rõ
- bảng màu premium
- typography tốt
- copywriting tốt
- motion tương đối tinh tế
- triết lý “Curated, not crowded”
- UX không blank-canvas
- no subscription / pay-per-card
- định vị “Boutique AI” thay vì AI tool đại trà

Điểm yếu lớn nhất hiện tại:

> **Chính các mẫu thiệp chưa đủ đẹp, đủ thật và đủ khác biệt.**

Do đó, bước nâng cấp tiếp theo **không nên tập trung vào thêm section, thêm hiệu ứng hoặc thêm tính năng phụ**.

Trọng tâm phải chuyển từ:

> **website chrome → actual card experience**

---

# 2. Giữ nguyên những gì đang đúng

Không nên thay đổi DNA hiện tại.

## Brand / Visual

Giữ:

- Deep Navy
- Ivory
- Champagne Gold
- Cormorant Garamond
- DM Sans
- Warm Emotion
- Modern Premium

Không chuyển sang:

- purple AI gradients
- tech startup visual
- Canva-like UI
- excessive glassmorphism
- excessive animation
- giant decorative blobs

---

## Copy

Giữ các câu mạnh hiện tại:

### Brand tagline

> **Make their moment shine.**

### Hero

> **Beautiful cards, made in moments.**

### Supporting principle

> **Curated, not crowded.**

### Product philosophy

> **The user tells us the occasion. We do the design. They only pay when they love the card.**

---

# 3. Upgrade Priorities

| Priority | Hạng mục | Mục tiêu |
|---|---|---|
| **P0** | Real Card Designs | Template phải trông như thiệp thật |
| **P0** | 3 Real Art Directions | 3 kết quả phải thực sự khác nhau |
| **P0** | Live Preview | Input thay đổi phải ảnh hưởng thiết kế thực |
| **P0** | Signature Reveal | Một hiệu ứng WOW duy nhất, thật xuất sắc |
| **P1** | Studio Refinement | Gọn nhưng không giống dashboard |
| **P1** | Editor Refinement | Chỉ giữ finishing controls |
| **P1** | Checkout Redesign | Bán tấm thiệp, không bán feature list |
| **P1** | Watermark Refinement | Tránh cảm giác stock image |
| **P1** | Performance | Premium phải mượt trên thiết bị trung bình |
| **P2** | Photo Palette Extraction | AI lấy palette từ ảnh |
| **P2** | Magic Typography | AI luôn giữ typography đẹp |
| Later | Physical Premium | Thiệp in cao cấp |
| Later | Voice-to-Poetry | Nói → lời chúc đẹp |
| Later | AR | Hiệu ứng AR cho người nhận |

---

# 4. P0 — Làm lại template thành “thiệp thật”

Đây là ưu tiên số 1.

Hiện nhiều template vẫn mang cảm giác:

> gradient background + decorative shape + text.

Điều này chưa đủ cho sản phẩm greeting card premium.

---

## Tiêu chuẩn template mới

Một template phải có cảm giác như một sản phẩm stationery thực tế.

Ví dụ:

### Luxury Editorial

Không chỉ:

- beige gradient
- vòng tròn
- serif text

Mà phải gợi được:

- cotton paper
- cold-press texture
- subtle letterpress
- gold foil detail
- editorial typography
- intentional whitespace
- realistic paper shadow

---

## Paper radius

Thiệp thật:

> **4–8 px**

UI container:

> **18–28 px**

Không dùng border radius rất lớn cho bản thân tấm thiệp.

---

## Texture

Có thể dùng:

- CSS noise rất nhẹ
- SVG paper texture
- subtle emboss
- paper grain
- linen texture
- watercolor grain

Không dùng texture quá mạnh.

---

## Gold / Navy Material Treatment

Nên bổ sung một lớp **texture / foil-shimmer cực nhẹ** cho các vùng champagne gold và deep navy để tránh cảm giác:

> flat gradient thuần CSS

### Gold

Gold không nên chỉ là:

- solid `#bd9a63`
- linear-gradient đơn giản

Có thể thêm:

- subtle metallic grain
- micro highlight
- restrained foil shimmer
- tiny luminance variation
- directional reflection rất nhẹ khi card nghiêng hoặc hover

Mục tiêu:

> gold phải gợi cảm giác **foil / metallic ink**, không phải “màu vàng UI”.

### Navy

Deep navy có thể thêm:

- paper grain rất nhẹ
- fine noise
- soft tonal variation
- subtle vignette
- extremely restrained material depth

Mục tiêu:

> navy phải có cảm giác **ink on premium paper / coated stock**, không phải một `div` màu xanh phẳng.

### Motion Rule

Foil-shimmer:

- chỉ xuất hiện khi hover / reveal / card tilt
- không chạy liên tục
- biên độ sáng rất nhỏ
- thời lượng chậm
- không dùng sweep mạnh toàn bề mặt
- không biến thành “sparkle effect”

### Performance Rule

Ưu tiên:

- static texture layer
- lightweight SVG/noise texture
- pseudo-element
- transform / opacity

Hạn chế:

- animated blur
- large filter stacks
- full-screen moving gradients
- heavy SVG filters

> **Material richness should be visible up close, not distracting from the card.**

---

# 5. Initial 8 Featured Card Styles

Nhóm mặc định nên gồm:

1. Luxury Editorial
2. Midnight Lume
3. Botanical Poise
4. Washi Elegance
5. Soft Seoul
6. Art Deco Noir
7. Photo Story
8. Quiet Minimal

Đây là **featured styles**, không phải toàn bộ thư viện.

---

## Mục tiêu chất lượng

Mỗi style phải có:

- typography system riêng
- layout rules riêng
- artwork direction riêng
- palette riêng
- relationship/tone weighting riêng

Không chỉ là đổi background.

---

# 6. P0 — 3 AI Results phải là 3 Art Directions

Sai:

> cùng layout + đổi màu.

Đúng:

> 3 creative directions hoàn toàn khác nhau.

---

## Direction A — Editorial

Ví dụ:

- cream paper
- high-contrast serif
- large whitespace
- small typography
- restrained decoration

---

## Direction B — Midnight

Ví dụ:

- deep navy
- champagne hairline
- celestial detail
- centered typography
- dramatic contrast

---

## Direction C — Photo Story

Ví dụ:

- uploaded photo
- asymmetrical layout
- modern serif/sans pairing
- subtle caption
- personalized palette

---

## Quality Test

Một bài test đơn giản:

> **Nếu chuyển tất cả ba mẫu sang grayscale mà vẫn nhìn ra ba art direction khác nhau → đạt.**

Nếu chỉ còn khác nhau bởi màu → chưa đạt.

---

# 7. P0 — Live Preview phải thật sự Live

Hiện preview không nên chỉ đổi text.

Khi thay đổi:

- Occasion
- Relationship
- Feeling
- Photo
- Card Format
- Personal Detail

thì preview nên thay đổi cả:

- copy
- typography
- palette
- composition
- artwork
- spacing
- photo treatment

---

## Ví dụ

Relationship:

> Partner

có thể tạo:

- intimate wording
- softer palette
- expressive typography

Relationship:

> Coworker

có thể tạo:

- restrained tone
- editorial layout
- neutral premium palette

---

# 8. P0 — Signature Interaction

Không nên tiếp tục thêm:

- more parallax
- more particles
- more glow
- more light sweep
- more scroll effects

Thay vào đó:

> **Chọn một interaction duy nhất làm signature của CardeLume.**

---

# 9. CardeLume Signature: Card Reveal

Đề xuất:

## Khi AI generation hoàn tất

Không dùng:

> Generating... 63%

Không dùng spinner là trung tâm trải nghiệm.

Thay bằng:

1. một paper sheet xuất hiện
2. typography compose
3. artwork nhẹ nhàng hình thành
4. card nâng lên khỏi mặt phẳng
5. ba creative directions tách ra

Duration mục tiêu:

> **1.2–1.8 seconds**

Sau đó user thấy ngay 3 card.

---

## Khi chọn một card

Không:

> Results screen biến mất → Editor xuất hiện.

Thay bằng:

> chính card đã chọn chuyển động từ Results vào Editor.

Shared-element transition:

- scale
- position
- shadow
- background
- canvas

Điều này tạo cảm giác:

> một vật thể xuyên suốt trải nghiệm

thay vì:

> chuyển giữa các màn hình website.

---

# 10. Scroll Motion Philosophy

Giữ motion:

- opacity
- 6–12 px translate
- subtle stagger
- light parallax
- slow easing

Không lạm dụng:

- 3D
- perspective
- rotate
- glow
- blur
- continuous animation

---

## Rule

> **Motion should be felt before it is noticed.**

Nếu user chú ý:

> “website có nhiều animation”

thì motion đã quá mạnh.

---

# 11. P1 — Studio Refinement

Studio hiện đã gọn hơn, nhưng không được nén quá mức.

Tránh:

- 9px labels
- dense controls
- tiny chips
- dashboard-like form

---

## Recommended Studio Structure

### Occasion

Chọn từ một nhóm compact.

### Recipient + Relationship

Có thể nằm cùng hàng desktop.

### Feeling

5–6 lựa chọn.

Bao gồm:

> Surprise me ✦

### Add Photo

Optional.

### Card Format

Default selected.

Dropdown:

- Portrait 5 × 7
- Folded 5 × 7
- Square 5 × 5
- Landscape 7 × 5
- Postcard 6 × 4

### Personal Detail

Optional.

### CTA

> **Create 3 designs ✦**

---

## Control sizing

Desktop/mobile:

> Tap target khoảng **40–44px**

Label:

> tối thiểu khoảng **11–12px**

Không tối ưu compact đến mức làm mất cảm giác premium.

---

# 12. P2 — Photo Palette Extraction

Đây là một trong những AI features đáng làm nhất.

Khi user upload ảnh:

AI / image processing lấy:

- dominant colors
- secondary colors
- temperature
- light/dark balance

Sau đó áp palette vào:

- background
- heading
- decorative artwork
- accent
- frame

---

## Example Feedback

> **We picked up the warm sunset tones from your photo.**

Hoặc:

> **We used the twilight blues from your photo to create a custom palette for Olivia’s card.**

Đây là AI magic có giá trị trực tiếp.

---

# 13. Photo UX

Upload photo không chỉ là:

> đặt ảnh vào một rectangle.

Có thể chọn treatment:

- Full bleed
- Portrait frame
- Soft crop
- Polaroid-style
- Editorial photo
- Background blur
- Photo + typography overlay

AI chọn mặc định.

User chỉ cần:

> Change photo

hoặc:

> Change design.

---

# 14. P2 — Magic Typography

Typography là một trong những yếu tố quan trọng nhất của premium greeting card.

User có thể sửa text.

Nhưng user không nên phá được layout.

---

## Magic Fit

Khi text thay đổi:

system tự động điều chỉnh:

- font size
- line breaks
- tracking
- leading
- text block width
- visual hierarchy
- alignment
- spacing

---

## Rule

> **The card must always look art-directed.**

Cho dù user thêm/bớt text.

---

# 15. AI Text Safety

Không để AI artwork tạo text baked-in.

Final text luôn render bằng:

- HTML/CSS
- SVG
- deterministic renderer

AI artwork:

> visual only

Text:

> separate structured layer.

Điều này tránh:

- typo
- nonsense letters
- hallucinated text
- multilingual issues

---

# 16. Editor Philosophy

Không trở thành Canva.

Editor nên giống:

> **Finish your card**

không phải:

> Design your card

---

## Controls tối đa

- Edit message
- Change design
- Change color
- Change photo
- Regenerate

Có thể thêm:

> Magic Fit

nhưng chạy tự động là tốt nhất.

---

# 17. P1 — Checkout Redesign

Checkout hiện không nên giống SaaS pricing modal.

Tránh:

- feature checklist là visual chính
- nhiều icon
- nhiều technical detail

---

## Desired Layout

Tấm card đã chọn phải là visual chính.

Ví dụ:

> **This one feels right.**

### $1.99

> One-time payment

CTA:

> **Get your card**

Nhỏ phía dưới:

> High-resolution JPG · Print-ready PDF · No watermark

---

## Rule

> **Sell the card, not the file formats.**

---

# 18. Watermark Refinement

Watermark diagonal lớn dễ tạo cảm giác:

> stock photo preview.

Nên tinh tế hơn.

---

## Options

### Option A

Small bottom strip:

> CARDELUME · PREVIEW

### Option B

Small corner mark.

### Option C

Very subtle repeating watermark.

---

## Technical Rule

Watermark vẫn phải:

> baked into raster preview

Không chỉ CSS overlay.

---

# 19. Performance

Premium UX = mượt.

Không chỉ đẹp.

Cần kiểm tra:

- backdrop-filter
- blur
- large shadows
- multiple radial gradients
- continuous animations
- large SVG filters

---

## Target

Test ít nhất:

- mid-range Android
- iPhone Safari
- Chrome desktop
- Edge
- low-power laptop

---

## Motion performance

Ưu tiên:

- transform
- opacity

Tránh animate:

- box-shadow lớn
- filter blur
- width/height
- background-position phức tạp

---

# 20. Positioning Decision

CardeLume không nên trở thành:

> luxury maison stationery $10–20/card

ở Phase 1.

Với pricing hiện tại:

> **$1.99**

hướng phù hợp hơn là:

# Premium Digital Delight

Nghĩa là:

- premium
- beautiful
- emotional
- fast
- accessible
- polished

Nhưng không:

- ultra-exclusive
- over-formal
- old luxury
- wedding-only aesthetic

---

# 21. Những thứ không nên thêm bây giờ

Không ưu tiên:

- more sections
- more templates
- more parallax
- more decorative particles
- more gradients
- more scroll animations
- fake social proof
- giant feature list

---

# 22. Later Ideas

Các ý tưởng đáng giữ lại nhưng chưa làm Phase 1:

## Physical Premium Tier

Có thể sau này:

> Send a Physical Masterpiece

Ví dụ:

- cotton rag
- foil stamping
- letterpress
- premium envelope

---

## Voice-to-Poetry

User nói:

> “Hôm nay sinh nhật mẹ...”

AI:

- transcribe
- understand emotion
- rewrite beautifully

---

## AR Card

Recipient scan QR:

- flowers bloom
- stars animate
- subtle AR effect

Không phải Phase 1.

---

# 23. Recommended Implementation Order

## Step 1 — Real Cards

Thiết kế lại:

> **8 featured card styles**

thành card thực sự đẹp.

---

## Step 2 — Three Directions

Làm Results:

> **3 genuinely different art directions**

---

## Step 3 — Live Preview

Connect Studio input → card plan → preview.

---

## Step 4 — Photo Intelligence

Upload photo → palette extraction → design adaptation.

---

## Step 5 — Card Reveal

Generation animation.

---

## Step 6 — Shared Transition

Result card → Editor.

---

## Step 7 — Magic Typography

Protect layout quality.

---

## Step 8 — Checkout

Product-centered purchase experience.

---

# 24. Success Metrics

## Time to first card

Target:

> **< 60 seconds**

---

## User decisions before generation

Target:

> **≤ 5 meaningful decisions**

---

## Results

Initial:

> **3 designs**

Không 20 templates.

---

## Regeneration

Free:

> 1–2 rounds

---

# 25. Current Evaluation

Approximate current state:

| Area | Score |
|---|---:|
| Brand identity | **9/10** |
| Visual language | **8.5/10** |
| Product philosophy | **9.5/10** |
| UX direction | **8.5/10** |
| Actual card quality | **5.5–6/10** |
| WOW factor | **~6.5/10** |

---

# 26. Target

Sau khi hoàn thành P0/P1:

| Area | Target |
|---|---:|
| Brand | **9+/10** |
| UX | **9+/10** |
| Card quality | **9+/10** |
| WOW | **9+/10** |

---

# 27. Final Product Rule

> **Do not add complexity to create WOW.**
>
> **Create WOW through better cards, better taste, better transitions, and deeper personalization.**

CardeLume không cần trở thành sản phẩm có nhiều tính năng nhất.

Nó cần trở thành sản phẩm mà khách hàng cảm thấy:

> **“I gave it almost nothing — and it made something beautiful for me.”**

---

# 28. Six Immediate Upgrades

Nếu chỉ chọn 6 việc để làm ngay:

1. **Redesign 8 featured templates as real premium cards**, including subtle paper texture and restrained gold/navy material treatment
2. **Make the 3 AI results genuinely different art directions**
3. **Refine Studio without making it dense**
4. **Make Live Preview truly respond to user inputs**
5. **Build one signature Card Reveal / Shared Transition**
6. **Redesign checkout around the purchased card**

> Đây là roadmap nâng cấp ưu tiên cho prototype CardeLume tiếp theo.

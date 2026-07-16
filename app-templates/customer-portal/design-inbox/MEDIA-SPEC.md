# MEDIA-SPEC — Calm Harbor Spa landing imagery (wave 11; assets DELIVERED wave 12)

**Delivery status: both assets are delivered** and live in
`customer-portal-design/design-inbox/media/` — the page renders them; the striped `no-data`
slots are gone. Delivered masters are below the original spec size but exceed every rendered
box at 1× and were accepted as-is; re-deliver larger masters later under the same file names
if 2×-retina desktop sharpness is required.

Two public bitmap assets complete the accepted `seo-hero` and `seo-proof` composition on the
Beauty (`Calm Harbor Spa`) `seo.landing`. The page is already wired: each slot (`seo-media`,
bindings `cms.media.hero` / `cms.media.proof` in `data/seo-fixtures.js`) renders the real image the
moment the file exists at the path below; until then it renders the striped spec slot
(`data-state="no-data"`). **No page change is needed to accept the files.**

Hard rules for both assets:
- Real Calm Harbor spa environment/treatment photography — **not** a blurred abstract background,
  stock collage, or illustration.
- **No logos, text, prices, ratings or promotional claims inside the bitmap.**
- sRGB, JPG (or WebP), quality ~80. Master sizes below; the page handles all cropping via
  `object-fit: cover` + the focal point, so ship ONE master per asset.

## Asset 1 — Hero (`cms.media.hero`)

| | |
| --- | --- |
| File | `customer-portal-design/design-inbox/media/spa-massage-1448.webp` **(delivered)** |
| Subject | Treatment moment: specialist's hands smoothing a warm towel/stones across a guest's shoulders, daylit single-guest room. Warm, unhurried; shallow depth is fine, subject sharp. |
| Delivered file | **1448 × 1086 (4:3)**, WEBP, 88 KB (spec asked ≥ 2400 px — accepted, covers all rendered boxes at 1×) |
| Focal point | **62% 40%** (guest's shoulders / hands slightly right of center, upper third) |
| Alt text | "Specialist smoothing a warm towel across a guest's shoulders in a daylit Calm Harbor treatment room" |

Rendered crops (focal-point anchored — keep the subject inside the central 60%; nothing
essential in the outer 15% of any edge):

| Viewport | Rendered box | Ratio |
| --- | --- | --- |
| Desktop 1440 / 1180 | right hero column, ≈ 600 × 450 | 4:3 |
| Tablet 768 | full-width band under the copy, ≈ 708 × 398 | 16:9 |
| Mobile 390 | full-width band, ≈ 346 × 231 | 3:2 |

## Asset 2 — Proof band (`cms.media.proof`)

Complements the hero without repeating it: **environment, no people** (hero = treatment moment,
proof = the room itself).

| | |
| --- | --- |
| File | `customer-portal-design/design-inbox/media/spa-room-1600.webp` **(delivered)** |
| Subject | Empty, prepared treatment room: linen-covered table, stone basin, folded towels, window light. Calm and orderly. |
| Delivered file | **1600 × 686 (≈21:9)**, WEBP, 82 KB (spec asked ≥ 2560 px — accepted, covers all rendered boxes at 1×) |
| Focal point | **50% 58%** (table + basin at lower center) |
| Alt text | "Empty Calm Harbor treatment room with a linen-covered table, stone basin and folded towels by a window" |

Rendered crops:

| Viewport | Rendered box | Ratio |
| --- | --- | --- |
| Desktop 1440 | full content width, ≈ 1076 × 461 | 21:9 |
| Tablet 768 | ≈ 708 × 398 | 16:9 |
| Mobile 390 | ≈ 346 × 260 | 4:3 |

Vertical-center weighted on tablet/mobile — keep the table fully visible at 4:3.

## If images must be CMS-hosted instead

Name the slots exactly `cms.media.hero` and `cms.media.proof`, each with fields
`{ src, alt, focal }` (focal = CSS `object-position` value). Ratios are enforced by the page —
the CMS only supplies the master file, alt text and focal point. Dark mode needs no separate
asset (the slot renders the same photo over dark tokens).

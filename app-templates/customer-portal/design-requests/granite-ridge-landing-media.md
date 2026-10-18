# Granite Ridge landing photography

Route: public landing (`seo.landing` composition), sections `seo-hero` and
`seo-proof`.
Package: `dist/manual-upload/customer-portal-granite-ridge-landing`.

## User goal

A property manager landing on the Granite Ridge page sees what a storm response
actually looks like before reading a single price.

## Status

No visual state is missing. The accepted `seoMedia` composition already covers
both cases: it renders the image when a URL is supplied and falls back to the
striped `data-state="no-data"` slot when it is not. Both slots currently ship
empty, so the page renders the accepted placeholder and nothing is invented.

This is an **asset request**, not a design request. It follows the shape of
`design-inbox/MEDIA-SPEC.md`, which is the accepted brief for the Calm Harbor
pair.

## What is needed

Two public bitmaps. Both are set through CMS parameters
`GRS_LANDING_02_HERO_MEDIA_URL` and `GRS_LANDING_06_PROOF_MEDIA_URL`; the page
needs no change to accept them.

Hard rules for both, carried over from the accepted spec:

- Real snow-operations photography, not a blurred abstract background, stock
  collage, or illustration.
- No logos, text, prices, ratings, or promotional claims inside the bitmap.
- sRGB, WebP or JPG, quality ~80. One master per asset; the page crops with
  `object-fit: cover` plus the CMS focal point.

### Asset 1 — hero (`cms.media.hero`)

| | |
| --- | --- |
| Parameter | `GRS_LANDING_02_HERO_MEDIA_URL`, focal `GRS_LANDING_02_HERO_MEDIA_FOCAL` |
| Subject | A crew clearing a commercial lot or drive lane before dawn: plow or pusher mid-pass, headlights and fresh-cut snow edges visible. Cold blue hour, working light. |
| Master | ≥ 2400 px on the long edge, 4:3 |
| Alt text | Currently `Granite Ridge crew clearing a lot before dawn` — adjust to what the delivered frame actually shows |

### Asset 2 — proof (`cms.media.proof`)

| | |
| --- | --- |
| Parameter | `GRS_LANDING_06_PROOF_MEDIA_URL`, focal `GRS_LANDING_06_PROOF_MEDIA_FOCAL` |
| Subject | The compliance evidence the section claims: a cleared walkway or stair run photographed as a service record, with the treated surface and its edge legible. No people required. |
| Master | ≥ 2400 px on the long edge, 16:9 or 3:2 |
| Alt text | Currently `Granite Ridge plow clearing a commercial lot at dawn` — adjust to the delivered frame |

## Constraints

- Granite Ridge is a demonstration organization. Any delivered image must be
  licensed for that use and must not imply a real customer property.
- The landing emits `noindex,nofollow` and must not be published to a
  production domain, with or without these assets.
- Serve both files same-origin with the landing document. The runtime accepts a
  media URL of any scheme for `<img src>` but reverts to the accepted no-data
  slot if the file fails to load.

## Related

- `design-inbox/MEDIA-SPEC.md` — the accepted brief for the Calm Harbor pair.
- `design-requests/storm-portal-top-nav-brand-and-mobile-overflow.md` — the one
  open visual gap that does affect this tenant's shell.

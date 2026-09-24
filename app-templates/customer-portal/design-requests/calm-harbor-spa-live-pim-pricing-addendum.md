# Addendum: Calm Harbor Live PIM Pricing Contract

## Why This Is Needed

The Wave 11 handoff correctly adds `seo-products-teaser` with
`pim.products[]`, but `SeoPricing()` still renders the Beauty fixture
`cms.pricing.rows[]` and its static `from` prices. This conflicts with the
accepted Calm Harbor landing rule: public treatments, memberships, retail
products, and displayed prices come from live public Core PIM.

The current fixture values are only visual examples. They must not become the
runtime price contract or remain visible when published PIM prices change.

## Requested Change

Update only the existing `seo-pricing` presentation contract. Keep its accepted
visual composition, tokens, type, and responsive layout.

- Ready state renders a repeated public collection `pim.pricing[]`.
- Each row binds to a public PIM pricing item with:
  `code`, `name`, `displayPrice`, and optional `interval` or `shortDescription`.
- Carry the stable product code in `data-product-code`.
- The collection includes public `SPA_SERVICE` and `SPA_MEMBERSHIP` items, and
  excludes `SPA_RETAIL`.
- Replace static `from` copy with the displayed PIM price. Do not calculate,
  estimate, compare, or transform a price in presentation.
- `loading` keeps the accepted skeleton treatment. `empty` must truthfully say
  that no treatments or memberships are currently published, without offering
  a quote, booking, or fallback price.
- The section action remains honest navigation only. It must not use
  `seo.cta.book`, `seo.cta.quote`, checkout, payment, or a success lifecycle.

## Transfer Hooks

- Existing module and visual ids remain: `seo-pricing`.
- Repeated rows use `data-bind="pim.pricing[]"` and `data-product-code`.
- Add stable `seo-pricing-row` module and visual ids if they are not already
  present.
- Cover `ready`, `loading`, and `empty` at `1440`, `1180`, `768`, and `390`
  widths in light and dark Beauty modes.

## Preview Identity

For the Calm Harbor SEO landing preview, bind the public nav brand to the
existing CMS brand value and render `Calm Harbor Spa`, not the generic
`Aircove` sample name. This is a content binding only: keep the accepted
public-nav composition unchanged.

## Media Delivery Status

The Wave 11 `MEDIA-SPEC.md` is accepted as a CMS media-slot specification.
The hero and proof bitmaps are user-provided assets, not a Claude Design task.
The user will provide them at the specified paths or as CMS-hosted URLs before
the landing is published. Claude Design only needs to complete the live PIM
pricing contract and its responsive evidence.

# Design Request: Calm Harbor Spa Public Landing Media and Product Teaser

## Context

Calm Harbor Spa needs a public, SEO-oriented landing page while private
customer APIs and booking commands are not ready for production use. The
current public Core PIM catalog is live and is the source of truth for:

- `SPA_SERVICE` treatments;
- `SPA_MEMBERSHIP` plans;
- `SPA_RETAIL` products and their displayed prices.

The accepted Beauty SEO system already provides the page composition:
`seo-hero`, `seo-trust-strip`, `seo-services-grid`, `seo-how-it-works`,
`seo-proof`, `seo-pricing`, `seo-service-area`, `seo-faq`,
`seo-final-cta`, and `seo-footer`. Do not redesign or replace those sections.

## Goal

Complete the existing SEO landing with an accepted Calm Harbor media direction
and one reusable retail-product teaser section. The result must feel like a
public spa brand site, while continuing to use the existing design system and
the current Beauty theme.

## Required Addition: Retail Product Teaser

Add one reusable `seo-products-teaser` section placed after `seo-pricing` and
before `seo-service-area`.

- It renders 3 to 4 cards from a repeated PIM collection.
- Each card may bind only to public product fields: `code`, `name`, optional
  short description, displayed price, and optional public product image.
- Reuse the accepted product-card visual language where appropriate. Do not
  create a second competing catalog-card system.
- Include one clear section-level action, `nav.products`, that routes to the
  existing public Shop route. Product cards use the same action unless an
  accepted public product-detail route is added in this handoff.
- The section must have an intentional empty state for an empty retail PIM
  collection. Do not show invented products or placeholder sales claims.
- There is no cart, checkout, order creation, payment, booking command, or
  success state in this public landing release.

## Required Addition: Calm Harbor Media Direction

The existing hero and proof sections need actual Calm Harbor Spa imagery rather
than generic placeholder media. Provide an image treatment that works with the
existing `seo-hero` and `seo-proof` composition.

- Provide a primary hero asset or precise media slot specification showing the
  spa experience or treatment environment, not a blurred abstract background.
- Provide a second proof-section asset or specification that complements the
  hero without repeating it.
- Provide desktop, tablet, and mobile crops, focal-point guidance, alt text,
  and the required aspect ratios.
- Supply the source files that the user can place in `design-inbox`, or name
  exact CMS media-slot requirements if the images must be hosted by CMS.
- Do not add logos, text, price, rating, or promotional claims inside the
  bitmap assets.

## Public Data and CTA Contract

The landing can use two data classes only:

| Data | Source | Rule |
| --- | --- | --- |
| Treatments, memberships, retail products, displayed prices | Public Core PIM | Repeated public catalog data only. |
| Brand story, locality, hours, FAQ, legal, approved proof claims, media references | CMS | Explicit content slots only. |

For this release, all public actions must be honest navigation:

- `nav.services` scrolls to the services section;
- `nav.pricing` scrolls to the live pricing section;
- `nav.products` opens the public Shop route;
- `auth.gotoSignin` opens the existing sign-in route.

Do not use `seo.cta.book`, `seo.cta.quote`, payment, checkout, or a generic
"request sent" visual state. A booking flow will receive a separate design
request after its backend contract is opened.

## Reuse, Transfer Hooks, and States

- Keep the existing Beauty tokens, typography, nav, responsive rules, button
  primitives, SEO sections, and footer intact.
- Add stable module and visual identifiers:
  `seo-products-teaser`, `seo-product-teaser-card`, and
  `seo-products-teaser-empty`.
- Repeated cards bind to `pim.products[]`; their source product code is carried
  in `data-product-code`.
- Cover `ready` and `empty` states at `1440`, `1180`, `768`, and `390` widths,
  in light and dark Beauty modes.
- Update the route source, styles, manifest, scenario coverage, and preview
  evidence. The user will import the accepted package into `design-inbox`.

## Requested Handoff

Return the updated reusable route/component files, styles, data-shape notes,
media assets or CMS media requirements, and desktop/tablet/mobile visual
evidence. Codex will transfer this accepted output into the manual CMS runtime
without visual redesign, changing only the bindings from demonstration data to
the public Core PIM response.

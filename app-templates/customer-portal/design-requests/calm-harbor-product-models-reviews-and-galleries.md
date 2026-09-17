# Design Request: Calm Harbor Product Models, Reviews, and Galleries

## Context

The authenticated Calm Harbor portal already has a live PIM-backed Shop and
repeatable product cards. The backend now has two additional domain contracts:

- `ProductModel`: groups products that belong to one service or retail
  collection and declares which product-type attributes distinguish variants;
- `ProductReview`: a workflow-owned review attached to one Product. Review
  content is stored in typed attributes and only `PUBLISHED` reviews may be
  presented to customers.

The current public price-comparison response does not include ProductModel,
Product media, or ProductReview. The authenticated runtime can load those
records separately and merge them by immutable Product id/code. Do not treat a
failed enrichment request as an empty collection.

## Goal

Add an accepted visual system for browsing collections, opening a product, and
reading published reviews without replacing the existing Beauty theme, Shop
cards, navigation, cart, or simulated checkout.

## Routes and User Goals

### `products` — Shop

- Keep the existing product grid and buy behavior.
- Add an optional collection/series grouping derived from ProductModel.
- A product without a model stays under a neutral `Other products` group; the
  browser must not infer a series from its code or name.
- A model heading may show model name, optional model media, product count, and
  the variant dimensions returned by `model.variants`.
- Product cards may show one primary image, collection name, and compact
  variant facts such as format or volume when returned.
- Card action `product.open` opens the product detail; `cart.addItem` remains a
  separate action and keeps its existing pending/error behavior.

### `product.detail` — Product detail

- New route parameter is an opaque product ref, not an authored id.
- Required composition: back to Shop, product name, current display price,
  product description, media gallery, source-provided variant facts,
  collection link, add-to-bag action, and published reviews.
- The primary image and thumbnails come from `product.media[]` in explicit
  backend order. No duplicated image is invented to make a gallery look full.
- One image renders as a deliberate single-image composition; zero images
  renders the accepted no-media state.
- The selected gallery image is presentation state only and never changes the
  product or cart identity.

## Product Review Contract

Review read model:

```text
review.ref
review.productRef
review.rating          integer 1..5
review.title           optional
review.body
review.authorName      public display name supplied by backend
review.verified        boolean supplied by backend
review.publishedAt     optional display-ready timestamp
```

- Render only reviews whose backend workflow state is `PUBLISHED`.
- Do not calculate a rating summary unless the backend response supplies the
  aggregate or the design explicitly labels it as calculated from the visible
  loaded set. Preferred initial release: show the review count and individual
  reviews, with no aggregate score claim.
- `VERIFIED` may render `Verified purchase`; absence/false renders no badge.
- Never expose Review id, Product id, User id, Account id, workflow ids, raw
  attributes, moderation state, or internal review key.
- Initial release is read-only. Do not add `Write a review` until a
  customer-scoped create contract and moderation submission command exist.

## Required States

Provide executable states for:

- Shop: models ready, mixed modeled/unmodeled products, models unavailable,
  products empty, products error.
- Product detail: ready with 3 images, ready with 1 image, ready without media,
  loading, not-found, product error.
- Reviews: ready, empty, loading, unavailable/forbidden, error.
- Gallery: first image selected and non-first thumbnail selected.
- Add to bag: idle, pending, failed, conflict, success readback.

Models/reviews/media are optional enrichments. If prices/products load but an
enrichment fails, preserve the sellable product page and show the accepted
unavailable treatment only in the affected region.

## Stable Transfer Hooks

- Route: `data-route="product.detail"`, `data-product-ref`.
- Models: `product-model-list`, `product-model-section`,
  `data-product-model-ref`.
- Gallery: `product-gallery`, `product-gallery-primary`,
  `product-gallery-thumb`, `data-media-ref`.
- Reviews: `product-review-list`, `product-review-card`,
  `data-review-ref`.
- Actions: `product.open`, `product.gallerySelect`, `cart.addItem`,
  `nav.products`.

## Responsive and Accessibility Requirements

- Evidence at 1440, 1180, 768, and 390 px in light mode; at least product ready
  and reviews unavailable in dark mode.
- Gallery thumbnails are keyboard reachable and expose selected state.
- Product images carry backend/CMS alt text; decorative collection images use
  empty alt text.
- Review stars have a textual accessible label such as `5 out of 5`.
- Long product names, descriptions, collection names, and review bodies must
  not overflow at 390 px.

## Constraints

- Reuse accepted Beauty tokens and primitives. Do not redesign the shell.
- No fake stock, bestseller labels, discount, crossed-out price, rating
  average, review count, or before/after claim.
- No generated person should be presented as a real reviewer.
- Product media must be public or delivered through an approved authenticated
  media URL. A raw Media id is not a usable image URL.
- Update designer source, manifest, scenarios, README, and preview evidence.

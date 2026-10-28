# Design Addendum: Calm Harbor Order Row Media

## Objective

Extend the already accepted Calm Harbor `orders.list` design with optional
source-provided thumbnails. This is an addendum only. Preserve the accepted
page, card, row spacing, typography, status badges, amount column, responsive
behavior, read-only semantics, and all existing routes and actions.

## Exact Change

Replace the existing abstract colored square in an Order row only when the
normalized Order read model supplies an explicit `previewMedia` record with a
browser-usable URL:

```text
order.previewMedia = null | {
  ref,
  src,
  alt,
  focalPoint,        optional
  kind               product | service | package
}
order.previewMediaState = ready | empty | unavailable | error
```

- Retail Order: approved Product primary image.
- Service Order: approved Service image.
- Package/series Order: approved Package or ProductModel hero.
- No explicit media association: retain an accepted neutral no-media tile.

Keep the thumbnail inside the current square footprint with the existing
corner-radius language. It is not a separate button or link and must not change
the row's current interaction.

## Required Executable States

Show the existing Orders card with:

1. mixed rows: product image, service image, package image, and no-media tile;
2. media loading without moving the text, status, or amount columns;
3. missing/empty media;
4. forbidden/unavailable media;
5. broken/error media falling back inside the same footprint;
6. long order title at 390 px with a thumbnail.

A media-only failure must not turn a valid Order row or Orders route into an
error state.

## Source And Truth Constraints

- The backend/read model selects `previewMedia`; the browser never joins an
  Order to PIM by title, type, amount, filename, or positional guess.
- A multi-line Order requires a backend-selected representative. Do not choose
  the first line and do not invent a collage.
- Product/service/package identity remains visible as text. The page must be
  fully understandable when images are disabled.
- Use empty alt text when the thumbnail duplicates adjacent identity text;
  otherwise use only media-owner supplied alt text.
- No customer photo, reviewer portrait, PII, generic stock image, generated
  status, inventory claim, or payment claim.
- A raw Media id is not an image URL. Until an approved URL and explicit Order
  relation exist, runtime remains on the no-media fallback.

## Stable Hooks

- Existing Order row retains its current hook and `data-order-ref`.
- Image: `data-module="order-preview-media"`, `data-media-ref`,
  `data-media-kind`.
- Fallback: `data-module="order-preview-media-fallback"`.

## Evidence

Update only the affected executable source, manifest/scenarios, README, and
preview evidence. Provide light-mode evidence at 1440, 768, and 390 px, plus
one dark-mode mixed-media state. Do not redesign any unrelated portal surface.

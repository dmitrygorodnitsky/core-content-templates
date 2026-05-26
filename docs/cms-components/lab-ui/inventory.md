# lab-ui Inventory

This inventory reflects the normalized block catalog in this directory. The
machine source is `manifest.json`, generated from each block's `block.json`.

## Summary

- 22 blocks
- 13 categories
- 1 canonical token set under `00-tokens/`
- Runtime gallery: `gallery.html`
- Durable validation: `scripts/validate-lab-ui.mjs`

## Decisions

| Area | Decision |
| --- | --- |
| Theme | Light is canonical. Dark overlay is reference-only for now. |
| Header | `header.default` is canonical for all landing types. |
| Breadcrumb | Optional sublayer owned by `header.default` for non-root pages. |
| CTA | `cta.btn-primary-ring` and `cta.btn-secondary-filled` are canonical. |
| Hub hero | `hero.operational-diagram`. |
| Vertical hero | `hero.composite-photo`. |
| Verticals grid | `verticals.glyph-grid-20-slots`. |
| Optional backgrounds | Full section blocks may declare `background.optional`; preview with `?bg=gradient` or `?bg=image`. |
| CMS generator | Future layer; no uploader in this package yet. |

## Categories And Blocks

| Category | Blocks |
| --- | --- |
| `01-header` | `header.default` |
| `02-footer` | `footer.default` |
| `03-cta` | `cta.btn-primary-ring`, `cta.btn-secondary-filled` |
| `04-language` | `language.locale-dropdown` |
| `05-hero` | `hero.operational-diagram`, `hero.composite-photo` |
| `06-features` | `features.accordion-2col-numbered`, `features.card-grid-3`, `features.card-grid-4` |
| `07-comparison` | `comparison.three-col-with-mobile-cards` |
| `08-faq` | `faq.bubble-light-grouped` |
| `09-vertical-section` | `section.h2-narrative-only`, `section.stages-list`, `section.axes-grid`, `section.stats-strip` |
| `10-verticals-grid` | `verticals.glyph-grid-20-slots` |
| `11-mobile-section` | `mobile.4-card-glyph` |
| `12-decorative` | `effect.hover-rise`, `decorative.cycle-strip`, `decorative.callout-band` |
| `13-signature` | `signature.ai-shell` |

## Validation Notes

The validator checks:

- `manifest.json` parity with `block.json`
- block id/category vs directory structure
- required files for every block
- runtime `block.js` syntax
- CSS duplicate class candidates

CSS duplicate classes are currently warnings, not failures, because some
duplicates are intentional shared primitives. The risk still matters before
multi-block CMS composition.

## Header Mobile Finding

Previous state: the burger toggled `.is-open`, but the block CSS did not render
a mobile menu. Also, iframe-based mobile previews still used a desktop pointer,
so dropdown/mega tap handling did not run.

Current state: the header block ships a mobile nav panel below 1024px and
dropdown/mega triggers use click-toggle when either the pointer is coarse or the
viewport is narrow.

## Remaining Risks

- CSS scoping is not production-safe enough for arbitrary multi-block pages.
- `block.json` parameter contracts are descriptive; there is no generator yet
  that proves every param maps to CMS placeholders.
- Preview PNGs are evidence snapshots, not automatically regenerated.
- Raw extraction sources were intentionally not promoted into the durable
  library because the previous source folders were symlinks back into `tmp/`.

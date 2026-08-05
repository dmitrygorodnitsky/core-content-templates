# Landing Composer Recipes

Recipes guide the block composer when the operator gives only a topic and rough
size. They are not copy outlines.

The only invariant is:

```text
header.default
  ...recipe-selected gallery blocks...
footer.default
```

## Small — 700-1600 Words

Use for compact campaign pages and early vertical tests.

Possible middle sequences:

```text
hero.operational-diagram
features.card-grid-3
section.h2-narrative-only
decorative.callout-band
```

```text
hero.composite-photo
features.card-grid-3
section.stats-strip
decorative.callout-band
```

```text
hero.operational-diagram
section.axes-grid
features.card-grid-3
decorative.cycle-strip
```

## Medium — 1601-3200 Words

Use for normal vertical landing templates.

Possible middle sequences:

```text
hero.operational-diagram
section.h2-narrative-only
features.card-grid-4
section.axes-grid
comparison.three-col-with-mobile-cards
faq.bubble-light-grouped
decorative.callout-band
```

```text
hero.composite-photo
features.accordion-2col-numbered
section.stages-list
mobile.4-card-glyph
faq.bubble-light-grouped
decorative.callout-band
```

```text
hero.operational-diagram
section.stats-strip
features.card-grid-3
verticals.glyph-grid-20-slots
comparison.three-col-with-mobile-cards
faq.bubble-light-grouped
```

## Long — 3201-7000 Words

Use for larger SEO families and deeper vertical templates.

Possible middle sequences:

```text
hero.composite-photo
section.h2-narrative-only
features.accordion-2col-numbered
section.axes-grid
section.stages-list
mobile.4-card-glyph
comparison.three-col-with-mobile-cards
signature.ai-shell
faq.bubble-light-grouped
decorative.callout-band
```

```text
hero.operational-diagram
features.card-grid-4
section.h2-narrative-only
verticals.glyph-grid-20-slots
section.stats-strip
comparison.three-col-with-mobile-cards
faq.bubble-light-grouped
signature.ai-shell
```

```text
hero.composite-photo
section.axes-grid
features.accordion-2col-numbered
decorative.cycle-strip
mobile.4-card-glyph
verticals.glyph-grid-20-slots
comparison.three-col-with-mobile-cards
faq.bubble-light-grouped
```

## Selection Policy

`build-landing.mjs` picks a sequence deterministically from topic + recipe so
reruns are stable, but different topics can produce different structures.

The operator can override all middle sections:

```bash
node docs/cms-components/lab-ui/scripts/build-landing.mjs \
  --topic hvac \
  --sections hero.composite-photo,features.card-grid-4,section.axes-grid,faq.bubble-light-grouped
```

The wrapper still enforces `header.default` first and `footer.default` last.

## Content Policy

All visible parameter values are deterministic lorem placeholders. The recipe
does not prescribe real copy, headings, FAQ questions, or comparison claims.

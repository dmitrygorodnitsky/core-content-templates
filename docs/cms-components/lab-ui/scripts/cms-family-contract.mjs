/* Shared contract between generate-cms-family / validate-cms-family /
   render-cms-family-preview. Single source of truth for slot marker
   strings, section codes, default block selection per section, and
   layout policies. */

/** Slot markers emitted by the generator and rewritten by the preview
 *  renderer / CMS adapter. Each value is the exact string injected
 *  inside an HTML comment: `<!-- cms-child-slot:NAME -->`. */
export const SLOT_MARKERS = {
  rootSections: "ROOT_SECTIONS",
  featureColumns: "FEATURE_COLUMNS",
  featureItems: "FEATURE_ITEMS",
  compareRows: "COMPARE_ROWS",
  faqGroups: "FAQ_GROUPS",
  faqItems: "FAQ_ITEMS",
};

/** Default block IDs picked per section. Override via copy frontmatter:
 *
 *  ---
 *  blocks.hero: hero.composite-photo
 *  blocks.features: features.card-grid-3
 *  ---
 *
 *  Any section whose `blocks.<name>` key is present in frontmatter
 *  beats the default below. */
export const DEFAULT_SECTION_BLOCKS = {
  header: "header.default",
  hero: "hero.operational-diagram",
  features: "features.accordion-2col-numbered",
  comparison: "comparison.three-col-with-mobile-cards",
  faq: "faq.bubble-light-grouped",
  ctaPrimary: "cta.btn-primary-ring",
  ctaSecondary: "cta.btn-secondary-filled",
  callout: "decorative.callout-band",
  footer: "footer.default",
};

/** Resolve final section→block IDs from a parsed copy model.
 *  Reads `model.frontmatter["blocks.<section>"]` overrides on top of
 *  DEFAULT_SECTION_BLOCKS. */
export const resolveSectionBlocks = (frontmatter = {}) => {
  const resolved = { ...DEFAULT_SECTION_BLOCKS };
  for (const [key, value] of Object.entries(frontmatter)) {
    if (!key.startsWith("blocks.")) continue;
    const section = key.slice("blocks.".length);
    if (Object.prototype.hasOwnProperty.call(resolved, section)) {
      resolved[section] = value;
    }
  }
  return resolved;
};

/** Layout policy: how repeatable content is split across nested
 *  child containers. Authored as defaults; future block contracts
 *  can override per-block. */
export const LAYOUT_POLICY = {
  features: {
    columns: 2,
    fill: "round-robin", // alternating left/right by index
  },
  faqGroups: {
    count: 2,
    split: "midpoint", // first half / second half
  },
};

/** Numbered child code patterns the validator should accept under
 *  each parent template. */
export const NESTED_CODE_PATTERNS = {
  FAQ_GROUP: /^FAQ_GROUP_\d+$/,
  FAQ_ITEM:  /^FAQ_\d+$/,
  COMPARE_ROW: /^COMPARE_ROW_\d+$/,
  FEATURE_ITEM: /^FEATURE_\d+$/,
  FEATURE_COL: /^FEATURE_COL_(LEFT|RIGHT)$/,
};

/** Build the literal slot-marker HTML comment string. */
export const slotMarker = (name) => `<!-- cms-child-slot:${name} -->`;

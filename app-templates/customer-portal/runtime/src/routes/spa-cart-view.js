// customer-portal/runtime/src/routes/spa-cart-view.js — the two decisions the
// bag makes before it draws anything, kept pure and DOM-free so
// `scripts/cart-module-check.mjs` can assert them without a browser.
//
// Neither function computes, sums, multiplies or rounds a money value. A
// display string is either one the source already carried or null, and null
// means the cart page renders nothing in its place.

/**
 * Which lifecycle state the bag is in.
 *
 * Live mode reads the cart module first — module status, then the envelope's
 * own state, then `loading` for a module that has not published yet. It never
 * consults `state.view`, the fixture scenario dial, so a live bag can never be
 * driven by a fixture toggle.
 */
export function spaCartRouteState(live, moduleStatus, envelope, fixtureView) {
  if (!live) return fixtureView;
  return moduleStatus || (envelope && envelope.state) || "loading";
}

/**
 * Which money rows the bag may draw.
 *
 * Core's `CartView` supplies a subtotal and nothing else — there is no cart tax
 * and no cart total — so in live mode `tax` and `total` are null and their rows
 * are absent. Off live the fixture bag stands in for the server and supplies
 * all three; a missing one is still absent rather than assembled.
 */
export function spaCartDisplayTotals(live, source) {
  if (live) return { subtotal: (source && source.displaySubtotal) || null, tax: null, total: null };
  var totals = (source && source.displayTotals) || null;
  return {
    subtotal: totals && totals.subtotal != null ? totals.subtotal : null,
    tax: totals && totals.tax != null ? totals.tax : null,
    total: totals && totals.total != null ? totals.total : null,
  };
}

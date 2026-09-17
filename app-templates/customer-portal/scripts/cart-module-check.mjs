// Verifies the cart module wiring: the registry selects the live Core cart
// adapter, the fixture path stays inert, failures map to accepted states, the
// page selector reads the live envelope instead of the fixture bag, and the
// bag renders no money figure Core did not supply.
//
// Browser-free by design — the DOM-shaped half of the cart page is covered by
// the wave-15/17 visual suites; everything decided before a node is created is
// pinned here.
import assert from "node:assert/strict";

// The runtime is browser code; static imports are hoisted above any assignment,
// so the globals it touches are installed before the module graph is pulled in.
globalThis.window = globalThis;
globalThis.location = { origin: "https://dev-1.servicewand.com" };

const { modules, openedModuleIds } = await import("../runtime/src/modules/index.js");
const { PortalRuntime } = await import("../runtime/src/portal-runtime.js");
const { portalProfiles } = await import("../runtime/src/config.js");
const { spaCartCount, spaCartEnvelope, spaCartLines, state } = await import("../runtime/src/state.js");
const { spaCartDisplayTotals, spaCartRouteState } = await import("../runtime/src/routes/spa-cart-view.js");

const cartModule = modules.cart;

/* ---- 1. registered, async-only, and actually reachable by a deployment ---- */

assert.ok(openedModuleIds.includes("cart"), "cart must be a registered module");
assert.equal(cartModule.id, "cart");
assert.equal(cartModule.asyncOnly, true, "the server cart is never loaded synchronously");
assert.ok(portalProfiles.spaTarget.modules.includes("cart"),
  "the target profile must enable the cart module or it is registered but never loaded");
{
  const runtime = new PortalRuntime({ state: { config: { enabledModules: portalProfiles.spaTarget.modules.slice() } } });
  assert.ok(runtime.enabledModuleIds().includes("cart"),
    "an enabled cart module must appear in the runtime's load set");
}

/* ---- 2. live mode selects the Core cart adapter ---- */

{
  const live = cartModule.adapter({ config: { dataMode: "live" } });
  for (const method of ["load", "addItem", "setItemCount", "removeItem", "clear"]) {
    assert.equal(typeof live[method], "function", "the live cart adapter must expose " + method);
  }
  // The live adapter must refuse any module but its own.
  assert.throws(() => live.load("orders", {}), (error) => error && error.code === "unsupported-module");
  // And it refuses before any call when the session has no resolved account.
  globalThis.fetch = () => { throw new Error("the cart adapter must not call Core without a resolved account"); };
  await assert.rejects(live.load("cart", { config: { organization: "CALM_HARBOR_SPA_STAGING" }, state: { session: { accessToken: "t" } } }),
    (error) => error && error.code === "customer-account-required");
}

/* ---- 3. the fixture path is inert: no Core call, no invented cart ---- */

const inertEnvelope = {
  backendId: null,
  byRef: {},
  currencyCode: null,
  displaySubtotal: null,
  itemCount: null,
  lines: [],
  notes: "",
  organizationCode: "",
  scopeMode: null,
  state: "empty",
  subtotal: null,
};

{
  const fixture = cartModule.adapter({ config: { dataMode: "fixture" } });
  assert.deepEqual(fixture.load(), inertEnvelope,
    "the non-live cart module publishes an empty envelope, never a fixture bag");
}

/* ---- 4. failures map to accepted states and carry no figures ---- */

{
  assert.deepEqual(cartModule.failureEnvelope({}, { code: "cart-forbidden" }),
    Object.assign({}, inertEnvelope, { state: "unauthorized" }));
  assert.deepEqual(cartModule.failureEnvelope({}, { code: "cart-unavailable" }),
    Object.assign({}, inertEnvelope, { state: "error" }));
  assert.deepEqual(cartModule.failureEnvelope({}, { code: "customer-account-required" }),
    Object.assign({}, inertEnvelope, { state: "error" }));
  // 404 means the account exists nowhere; only 403 means "not yours". Telling
  // the customer they lack access to a bag that does not exist would be a lie.
  assert.deepEqual(cartModule.failureEnvelope({}, { code: "cart-account-unknown" }),
    Object.assign({}, inertEnvelope, { state: "error" }));
  assert.deepEqual(cartModule.failureEnvelope({}, null),
    Object.assign({}, inertEnvelope, { state: "error" }));

  const context = { state: {} };
  cartModule.onError({ code: "session-expired" }, context);
  assert.equal(context.state.account, "session-expired", "an expired session surfaces on the account, not the bag");
  const other = { state: {} };
  cartModule.onError({ code: "cart-forbidden" }, other);
  assert.equal(other.state.account, undefined, "a cart refusal must not claim the whole account expired");
}

/* ---- 5. the page selector reads the live envelope, never the fixture bag ---- */

const liveLine = {
  backendId: 91, currencyCode: "USD", displayTotal: "$118.50", displayUnitPrice: "$39.50",
  lineAmount: 118.5, metadata: null, notes: "", priceId: 8801, productCode: "CHS_BODY_001",
  productId: 771, qty: 3, ref: "cart-line-8801", title: "Harbor body oil", unitAmount: 39.5, variant: null,
};
const liveEnvelope = {
  backendId: 4021, byRef: { "cart-line-8801": liveLine }, currencyCode: "USD",
  displaySubtotal: "$118.50", itemCount: 3, lines: [liveLine], notes: "",
  organizationCode: "CALM_HARBOR_SPA_STAGING", scopeMode: "server-account-bound",
  state: "ready", subtotal: 118.5,
};
const fixtureBag = {
  version: "cart-7",
  lines: [{ ref: "cln-01", title: "Silk Repair Set", variant: null, qty: 1, displayUnitPrice: "$64.00", displayTotal: "$64.00" }],
  displayTotals: { subtotal: "$64.00", tax: "$5.12", total: "$69.12" },
  fulfillment: { kind: "PICKUP", label: "Pickup at the studio", detail: "Availability is confirmed by the studio" },
};

{
  state.config.dataMode = "live";
  state.spaCart = fixtureBag;
  state.moduleData.cart = liveEnvelope;
  assert.equal(spaCartEnvelope(), liveEnvelope);
  assert.deepEqual(spaCartLines(), [liveLine]);
  // `itemCount` is a QUANTITY, not a line count: one line of three reports 3.
  assert.equal(spaCartCount(), 3, "the bag count is Core's itemCount, read verbatim");
  assert.equal(liveEnvelope.lines.length, 1, "one line of three is the case that distinguishes a quantity from a line count");

  // An unloaded module shows NOTHING — never the fixture bag sitting in state.
  state.moduleData.cart = undefined;
  assert.equal(spaCartEnvelope(), null);
  assert.deepEqual(spaCartLines(), [], "a cart module that has not loaded shows no lines, never fixture lines");
  assert.equal(spaCartCount(), 0);

  // A failed or unauthorized envelope is empty for the same reason.
  state.moduleData.cart = cartModule.failureEnvelope({}, { code: "cart-forbidden" });
  assert.deepEqual(spaCartLines(), []);
  assert.equal(spaCartCount(), 0);

  // Core reporting no itemCount means no count is shown — the browser does not
  // add the line quantities up to produce one.
  state.moduleData.cart = Object.assign({}, liveEnvelope, { itemCount: null });
  assert.deepEqual(spaCartLines(), [liveLine]);
  assert.equal(spaCartCount(), 0, "an absent server itemCount is shown as nothing, never summed locally");

  // Off live the fixture bag is still the source, unchanged.
  state.config.dataMode = "fixture";
  state.moduleData.cart = liveEnvelope;
  assert.equal(spaCartEnvelope(), fixtureBag);
  assert.deepEqual(spaCartLines(), fixtureBag.lines);
  assert.equal(spaCartCount(), 1);
}

/* ---- 6. route state comes from the module first, and never from state.view ---- */

{
  assert.equal(spaCartRouteState(true, "ready", liveEnvelope, "empty"), "ready");
  assert.equal(spaCartRouteState(true, undefined, liveEnvelope, "error"), "ready", "the envelope decides when no status is published");
  assert.equal(spaCartRouteState(true, undefined, undefined, "ready"), "loading", "an unloaded module is loading, not the fixture view");
  assert.equal(spaCartRouteState(true, "error", liveEnvelope, "ready"), "error");
  assert.equal(spaCartRouteState(true, "unauthorized", undefined, "ready"), "unauthorized");
  assert.equal(spaCartRouteState(false, "ready", liveEnvelope, "empty"), "empty", "off live the fixture scenario dial still drives the page");
}

/* ---- 7. money is read, never assembled ---- */

{
  const totals = spaCartDisplayTotals(true, liveEnvelope);
  assert.equal(totals.subtotal, "$118.50", "the subtotal is Core's own string, rendered verbatim");
  assert.equal(totals.tax, null, "Core exposes no cart tax — the row is absent, never derived");
  assert.equal(totals.total, null, "Core exposes no cart total — the row is absent, never summed");

  // A cart Core priced without a subtotal shows no money at all rather than a
  // figure derived from the lines it did return.
  const unpriced = spaCartDisplayTotals(true, Object.assign({}, liveEnvelope, { displaySubtotal: null, subtotal: null }));
  assert.deepEqual(unpriced, { subtotal: null, tax: null, total: null });

  assert.deepEqual(spaCartDisplayTotals(true, null), { subtotal: null, tax: null, total: null });
  assert.deepEqual(spaCartDisplayTotals(false, fixtureBag), fixtureBag.displayTotals,
    "off live the fixture stands in for the server and supplies all three rows");
  assert.deepEqual(spaCartDisplayTotals(false, { lines: [] }), { subtotal: null, tax: null, total: null });

  // The live envelope carries no fulfillment dimension, so the accepted
  // fulfillment card has nothing to render from.
  assert.equal(liveEnvelope.fulfillment, undefined);
  assert.equal(inertEnvelope.fulfillment, undefined);
}

/* ---- 8. end to end through the runtime: publish, status, and the 403 path ---- */

// The live-verified `CartView`: no `currency` field on the cart, no tax field,
// no total field, and a line currency carried as a Dictionary id.
const cartView = {
  id: 4021,
  itemCount: 3,
  items: [{ count: 3, currency: 312, id: 91, lineAmount: 118.5, metadata: null, notes: null, priceId: 8801, productCode: "CHS_BODY_001", productId: 771, unitAmount: 39.5 }],
  notes: null,
  organization: { code: "CALM_HARBOR_SPA_STAGING" },
  subtotal: 118.5,
};

assert.equal(Object.prototype.hasOwnProperty.call(cartView, "tax"), false);
assert.equal(Object.prototype.hasOwnProperty.call(cartView, "total"), false);

function liveRuntime(respond) {
  const runtimeState = {
    config: {
      billApiBase: "/core-bill",
      dataMode: "live",
      enabledModules: ["account", "cart"],
      organization: "CALM_HARBOR_SPA_STAGING",
      origin: "https://dev-1.servicewand.com",
    },
    customerAccount: { id: 5501 },
    moduleData: {},
    moduleStatus: {},
    session: { accessToken: "staging-token", tokenType: "Bearer" },
  };
  const calls = [];
  globalThis.fetch = async (url, options) => { calls.push({ options, url }); return respond(url, options); };
  return { calls, runtime: new PortalRuntime({ state: runtimeState }), state: runtimeState };
}

{
  const harness = liveRuntime((url) => (String(url).includes("/api/dictionary/list.json")
    ? { json: async () => ({ result: [{ code: "USD", id: 312 }] }), ok: true, status: 200 }
    : { json: async () => cartView, ok: true, status: 200 }));
  await harness.runtime.loadAsync("cart");
  const published = harness.state.moduleData.cart;
  assert.equal(harness.state.moduleStatus.cart, "ready");
  assert.equal(published.state, "ready");
  assert.equal(published.scopeMode, "server-account-bound", "the cart is scoped by the server, not narrowed in the browser");
  assert.equal(published.displaySubtotal, "$118.50");
  assert.equal(published.itemCount, 3, "one line of three: itemCount is a quantity, not a line count");
  assert.equal(published.lines.length, 1);
  assert.equal(published.lines[0].ref, "cart-line-8801");
  assert.ok(harness.calls.some((call) => String(call.url).startsWith("https://dev-1.servicewand.com/core-bill/api/cart/current.json?accountId=5501")),
    "the cart is read same-origin for the resolved session account: " + harness.calls.map((call) => call.url).join(" "));

  // The published envelope is what the selector then reads.
  state.config.dataMode = "live";
  state.moduleData.cart = published;
  assert.equal(spaCartCount(), 3);
  assert.deepEqual(spaCartDisplayTotals(true, published), { subtotal: "$118.50", tax: null, total: null });
}

{
  const harness = liveRuntime(() => ({ json: async () => null, ok: false, status: 403 }));
  await assert.rejects(harness.runtime.loadAsync("cart"), (error) => error && error.code === "cart-forbidden");
  assert.equal(harness.state.moduleStatus.cart, "error");
  assert.deepEqual(harness.state.moduleData.cart, Object.assign({}, inertEnvelope, { state: "unauthorized" }),
    "a refused cart renders the accepted unauthorized state with no lines and no money");
}

{
  // 404: the accountId exists nowhere. A different fault from 403, and the bag
  // must not tell the customer they lack access to someone else's cart.
  const harness = liveRuntime(() => ({ json: async () => null, ok: false, status: 404 }));
  await assert.rejects(harness.runtime.loadAsync("cart"), (error) => error && error.code === "cart-account-unknown");
  assert.equal(harness.state.moduleStatus.cart, "error");
  assert.equal(harness.state.moduleData.cart.state, "error");
}

{
  const harness = liveRuntime(() => ({ json: async () => null, ok: false, status: 401 }));
  await assert.rejects(harness.runtime.loadAsync("cart"), (error) => error && error.code === "session-expired");
  assert.equal(harness.state.account, "session-expired", "an expired session is surfaced on the account");
  assert.equal(harness.state.moduleData.cart.state, "error");
  assert.deepEqual(harness.state.moduleData.cart.lines, []);
}

console.log("cart-module-check ok: the cart module reads live Core, never falls back to fixtures, and shows no figure Core did not supply");

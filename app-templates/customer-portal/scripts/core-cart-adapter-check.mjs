// Verifies the server cart adapter: reads and mutations go through Core, every
// money field is the server's own, mutations are proven by readback rather than
// by a 2xx, a replayed mutation writes once, and every failure carries a named
// contract code instead of a stack trace.
import assert from "node:assert/strict";
import {
  addCoreCartItem,
  clearCoreCart,
  coreCartContract,
  loadCoreCart,
  removeCoreCartItem,
  setCoreCartItemCount,
} from "../runtime/src/adapters/core-cart-adapter.js";

const origin = "https://dev-1.servicewand.com";
const ACCOUNT_ID = 1;

function contextFor(overrides = {}) {
  return {
    config: {
      billApiBase: "/core-bill",
      coreApiBase: "/core",
      currency: "USD",
      organization: "CALM_HARBOR_SPA_STAGING",
      origin,
      ...(overrides.config || {}),
    },
    state: {
      customerAccount: overrides.account === null ? null : overrides.account || { code: "CHS_STG_ELENA_RIOS", id: ACCOUNT_ID },
      moduleData: {
        products: { items: [{ code: "CHS_BODY_001", id: 41, name: "Harbor body oil" }] },
      },
      session: { accessToken: "test-token", tokenType: "Bearer", userId: 33 },
    },
  };
}

const context = contextFor();

/* A fake Core cart. It owns every figure: `lineAmount` and `subtotal` are
   whatever this server says they are, which is what lets the checks below prove
   the adapter copies them rather than deriving them. */
function cartServer(options = {}) {
  const calls = [];
  const state = {
    items: (options.items || []).map((item) => ({ ...item })),
    // Set by a test to make the server accept a write and then not apply it.
    swallowWrites: options.swallowWrites || false,
  };

  /* Mirrors the live shape: `CartView` carries NO currency of its own, and each
     item's `currency` is a stringified Dictionary id, not a code. */
  function view() {
    const base = {
      id: 7,
      itemCount: state.items.reduce((sum, item) => sum + item.count, 0),
      items: state.items,
      organization: "CALM_HARBOR_SPA_STAGING",
    };
    if (options.omitSubtotal) return base;
    // Deliberately the server's own arithmetic, not the client's.
    return { ...base, subtotal: options.subtotal != null ? options.subtotal : state.items.reduce((sum, item) => sum + item.lineAmount, 0) };
  }

  const fetchImpl = async function (url, init) {
    calls.push({ body: init && init.body ? JSON.parse(init.body) : null, method: init.method, url });
    const parsed = new URL(url);
    if (options.status) return { ok: false, status: options.status, async json() { return {}; } };

    // Currency lives in the core Dictionary and is resolved in both directions.
    if (parsed.pathname.endsWith("/api/dictionary/list.json")) {
      const filters = JSON.parse(init.body).filters;
      const matches = [{ code: "USD", id: 17 }].filter((row) => filters.some((filter) =>
        filter.property === "id" ? String(row.id) === filter.value : row.code === filter.value));
      return { ok: true, status: 200, async json() { return { result: matches, resultSize: matches.length }; } };
    }

    const accountId = Number(parsed.searchParams.get("accountId"));
    if (accountId !== ACCOUNT_ID && init.method !== "POST") {
      return { ok: false, status: 403, async json() { return {}; } };
    }

    if (parsed.pathname.endsWith("/api/cart/current.json")) {
      return { ok: true, status: 200, async json() { return structuredClone(view()); } };
    }
    if (parsed.pathname.endsWith("/count.json")) {
      const priceId = Number(parsed.pathname.split("/").slice(-2)[0]);
      const delta = Number(parsed.searchParams.get("delta"));
      const line = state.items.find((item) => item.priceId === priceId);
      if (line && !state.swallowWrites) {
        line.count += delta;
        line.lineAmount = line.unitAmount * line.count;
      }
      return { ok: true, status: 204, async json() { return null; } };
    }
    if (parsed.pathname.endsWith("/api/cart/current/items.json") && init.method === "POST") {
      const body = JSON.parse(init.body);
      if (!state.swallowWrites) {
        const line = state.items.find((item) => item.priceId === body.priceId);
        if (line) { line.count += body.count; line.lineAmount = line.unitAmount * line.count; }
        else {
          state.items.push({
            count: body.count, currency: String(body.currency), id: 900 + state.items.length,
            lineAmount: 42 * body.count, priceId: body.priceId, productCode: "CHS_BODY_001",
            productId: body.productId, unitAmount: 42,
          });
        }
      }
      return { ok: true, status: 200, async json() { return structuredClone(view()); } };
    }
    if (parsed.pathname.endsWith("/api/cart/current/items.json") && init.method === "DELETE") {
      if (!state.swallowWrites) state.items = [];
      return { ok: true, status: 204, async json() { return null; } };
    }
    if (init.method === "DELETE") {
      const priceId = Number(parsed.pathname.split("/").pop().replace(".json", ""));
      if (!state.swallowWrites) state.items = state.items.filter((item) => item.priceId !== priceId);
      return { ok: true, status: 204, async json() { return null; } };
    }
    throw new Error("unexpected request: " + url);
  };

  return { calls, fetchImpl, state };
}

const bodyOil = {
  count: 2, currency: "17", id: 901, lineAmount: 84, metadata: null,
  priceId: 55, productCode: "CHS_BODY_001", productId: 41, unitAmount: 42,
};

{
  // Read: the envelope is the server's cart, and the line title is joined from
  // the catalog the portal already holds.
  const server = cartServer({ items: [bodyOil] });
  const cart = await loadCoreCart(context, server.fetchImpl, origin);
  assert.equal(cart.state, "ready");
  assert.equal(cart.scopeMode, "server-account-bound", "the cart is bound by Core, not narrowed by the portal");
  assert.equal(cart.itemCount, 2);
  assert.equal(cart.subtotal, 84);
  assert.equal(cart.displaySubtotal, "$84.00");
  // The line carries Dictionary id 17; the code that formats the money was
  // resolved from Core, not assumed from configuration.
  assert.equal(cart.currencyCode, "USD");
  assert.ok(server.calls.some((call) => call.url.includes("/api/dictionary/list.json")),
    "the currency code is resolved from Core, never inferred from the id");
  assert.equal(cart.lines.length, 1);
  const line = cart.lines[0];
  assert.equal(line.ref, coreCartContract.lineRefPrefix + "55");
  assert.equal(line.title, "Harbor body oil");
  assert.equal(line.qty, 2);
  assert.equal(line.unitAmount, 42);
  assert.equal(line.lineAmount, 84);
  assert.equal(line.displayUnitPrice, "$42.00");
  assert.equal(line.displayTotal, "$84.00");
  assert.equal(cart.byRef[line.ref], line);
  assert.equal(server.calls[0].method, "GET");
  assert.ok(server.calls[0].url.includes("accountId=1"), "every cart call carries the resolved account");
}

{
  // Money is READ, never assembled. The server reports figures that do not
  // agree with unit x count; the adapter must report the server's, not its own.
  const server = cartServer({
    items: [{ ...bodyOil, count: 3, lineAmount: 99, unitAmount: 42 }],
    subtotal: 111,
  });
  const cart = await loadCoreCart(context, server.fetchImpl, origin);
  assert.equal(cart.lines[0].lineAmount, 99, "lineAmount is Core's figure, never unitAmount x count");
  assert.equal(cart.lines[0].displayTotal, "$99.00");
  assert.equal(cart.subtotal, 111, "subtotal is Core's figure, never the sum of the lines");
  assert.equal(cart.displaySubtotal, "$111.00");
}

{
  // Where Core supplies no figure the adapter supplies none either.
  const server = cartServer({ items: [{ ...bodyOil, lineAmount: null, unitAmount: null }], omitSubtotal: true });
  const cart = await loadCoreCart(context, server.fetchImpl, origin);
  assert.equal(cart.subtotal, null);
  assert.equal(cart.displaySubtotal, null, "no server subtotal means no shown subtotal");
  assert.equal(cart.lines[0].displayUnitPrice, null);
  assert.equal(cart.lines[0].displayTotal, null);
}

{
  // An empty cart is empty, never a fixture.
  const server = cartServer({ items: [] });
  const cart = await loadCoreCart(context, server.fetchImpl, origin);
  assert.equal(cart.state, "empty");
  assert.deepEqual(cart.lines, []);
  assert.deepEqual(cart.byRef, {});
}

{
  // Add: the request is a CartItemRequest, and success comes from the readback.
  const server = cartServer({ items: [] });
  const cart = await addCoreCartItem({ count: 1, priceId: 55, productId: 41 }, context, server.fetchImpl, origin);
  const post = server.calls.find((call) => call.url.endsWith("/api/cart/current/items.json") && call.method === "POST");
  // `currency` is the Dictionary id. Core answers a currency CODE here with
  // `404 "No sellable price found"` wrapped in a 500.
  assert.deepEqual(post.body, {
    accountId: 1, count: 1, currency: 17, metadata: null, notes: null, priceId: 55, productId: 41,
  });
  assert.equal(cart.lines.length, 1);
  assert.equal(cart.lines[0].qty, 1);
  assert.equal(server.calls.filter((call) => call.method === "GET").length, 2, "a mutation reads before and re-reads after");
}

{
  // A 2xx is not success: Core accepted the write and did not apply it.
  const server = cartServer({ items: [], swallowWrites: true });
  await assert.rejects(
    () => addCoreCartItem({ count: 1, priceId: 55, productId: 41 }, context, server.fetchImpl, origin),
    (error) => error && error.code === "cart-add-unconfirmed",
  );
}

{
  // Count change: the delta is derived from the count Core reports right now.
  const server = cartServer({ items: [{ ...bodyOil, count: 2 }] });
  const cart = await setCoreCartItemCount({ count: 5, ref: "cart-line-55" }, context, server.fetchImpl, origin);
  const post = server.calls.find((call) => call.url.includes("/count.json"));
  assert.ok(post.url.includes("/items/55/count.json"), "the count endpoint is keyed by priceId");
  assert.ok(post.url.includes("delta=3"), "delta is target minus the server's current count");
  assert.equal(cart.lines[0].qty, 5);
  assert.equal(cart.lines[0].lineAmount, 210, "the recalculated line amount comes back from Core");
}

{
  // A replayed identical target is a no-op: no write at all, so a repeat can
  // never double the quantity.
  const server = cartServer({ items: [{ ...bodyOil, count: 2 }] });
  const cart = await setCoreCartItemCount({ count: 2, ref: "cart-line-55" }, context, server.fetchImpl, origin);
  assert.equal(server.calls.filter((call) => call.url.includes("/api/cart/")  && call.method !== "GET").length, 0,
    "an unchanged target writes nothing at all");
  assert.equal(cart.lines[0].qty, 2);
}

{
  // Two concurrent identical mutations share one flight and write once.
  const server = cartServer({ items: [] });
  const input = { count: 1, priceId: 55, productId: 41, requestRef: "double-click" };
  const [first, second] = await Promise.all([
    addCoreCartItem(input, context, server.fetchImpl, origin),
    addCoreCartItem(input, context, server.fetchImpl, origin),
  ]);
  assert.equal(server.calls.filter((call) => call.url.endsWith("/api/cart/current/items.json") && call.method === "POST").length, 1,
    "a replayed in-flight add writes once");
  assert.equal(first.lines[0].qty, 1, "the quantity did not double");
  assert.equal(second, first, "both callers get the same authoritative cart");
}

{
  // Counting down to zero removes the line rather than sending a zero quantity.
  const server = cartServer({ items: [{ ...bodyOil, count: 1 }] });
  const cart = await setCoreCartItemCount({ count: 0, ref: "cart-line-55" }, context, server.fetchImpl, origin);
  assert.equal(server.calls.find((call) => call.method === "DELETE").url.includes("/items/55.json"), true);
  assert.equal(cart.state, "empty");
}

{
  const server = cartServer({ items: [bodyOil] });
  const cart = await removeCoreCartItem({ ref: "cart-line-55" }, context, server.fetchImpl, origin);
  assert.equal(cart.state, "empty");
  assert.deepEqual(cart.lines, []);
}

{
  const server = cartServer({ items: [bodyOil], swallowWrites: true });
  await assert.rejects(
    () => removeCoreCartItem({ ref: "cart-line-55" }, context, server.fetchImpl, origin),
    (error) => error && error.code === "cart-remove-unconfirmed",
  );
}

{
  const server = cartServer({ items: [bodyOil, { ...bodyOil, id: 902, priceId: 56 }] });
  const cart = await clearCoreCart(context, server.fetchImpl, origin);
  assert.equal(cart.state, "empty");
  const del = server.calls.find((call) => call.method === "DELETE");
  assert.ok(del.url.endsWith("/api/cart/current/items.json?accountId=1"));
}

{
  const server = cartServer({ items: [bodyOil], swallowWrites: true });
  await assert.rejects(
    () => clearCoreCart(context, server.fetchImpl, origin),
    (error) => error && error.code === "cart-clear-unconfirmed",
  );
}

{
  // Changing a line that is no longer in the server cart fails by name.
  const server = cartServer({ items: [] });
  await assert.rejects(
    () => setCoreCartItemCount({ count: 2, ref: "cart-line-55" }, context, server.fetchImpl, origin),
    (error) => error && error.code === "cart-line-missing",
  );
}

{
  // No resolved customer Account: refuse before any call. Core answers a cart
  // request with no accountId with a raw 500, so the portal never sends one.
  const server = cartServer({ items: [bodyOil] });
  await assert.rejects(
    () => loadCoreCart(contextFor({ account: null }), server.fetchImpl, origin),
    (error) => error && error.code === "customer-account-required",
  );
  // Mutations refuse synchronously, before a promise is even handed back.
  assert.throws(
    () => addCoreCartItem({ count: 1, priceId: 55, productId: 41 }, contextFor({ account: null }), server.fetchImpl, origin),
    (error) => error && error.code === "customer-account-required",
  );
  assert.equal(server.calls.length, 0, "no cart call may run before the customer resolves");
}

{
  // The server-side account binding is real on this endpoint: a foreign id is
  // refused by Core, not filtered by the portal.
  const server = cartServer({ items: [bodyOil] });
  await assert.rejects(
    () => loadCoreCart(contextFor({ account: { code: "OTHER", id: 2099 } }), server.fetchImpl, origin),
    (error) => error && error.code === "cart-forbidden" && error.status === 403,
  );
}

// 403 is an account that exists and is not the caller's; 404 is an accountId
// that exists nowhere. Core answers a request with NO accountId with a raw 500,
// which is why the adapter refuses locally instead of ever sending one.
for (const [status, code] of [
  [401, "session-expired"], [403, "cart-forbidden"], [404, "cart-account-unknown"],
  [409, "cart-conflict"], [500, "cart-unavailable"],
]) {
  const server = cartServer({ items: [], status });
  await assert.rejects(
    () => loadCoreCart(context, server.fetchImpl, origin),
    (error) => error && error.code === code,
    "HTTP " + status + " must surface as " + code,
  );
}

{
  // The adapter refuses any module but its own.
  const { createCoreCartAdapter } = await import("../runtime/src/adapters/core-cart-adapter.js");
  const adapter = createCoreCartAdapter({ fetch: cartServer({ items: [] }).fetchImpl, origin });
  assert.throws(() => adapter.load("orders", context), (error) => error && error.code === "unsupported-module");
}

console.log("core-cart-adapter-check ok: the cart reads and mutates through Core with server-owned money only");

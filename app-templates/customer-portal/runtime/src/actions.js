// customer-portal/runtime/src/actions.js — production transfer module.
import { F } from "../data/fixtures.js";
import { findProduct, proposalSites, state } from "./state.js";
import { render } from "./app.js";
import { normalizeVertical, verticalProfiles } from "./config.js";
import { resolveRoute, writeRouteToLocation } from "./router.js";

export var ACTIONS = {
  "nav.go":            function (id) { go(id); },
  "nav.landing":       function ()   { go("landing"); },
  "auth.gotoSignin":   function ()   { state.authError = null; state.code = ""; go("auth.phone"); },
  "auth.sendCode":     function ()   { validatePhone(); },
  "auth.verifyCode":   function ()   { validateCode(); },
  "auth.back":         function ()   { state.authError = null; go("auth.phone"); },
  "auth.resend":       function ()   { failCommand("auth.resend"); },
  "auth.apple":        function ()   { failCommand("auth.apple"); },
  "order.open":        function (id) { openOrder(id); },
  "order.back":        function ()   { go("orders.list"); },
  "order.cancel":      function (id) { runCommand("order.cancel", id, function () { cancelOrder(id); }); },
  "order.reschedule":  function ()   { openDrawer("booking"); },
  "order.downloadInvoice": function () { failCommand("order.downloadInvoice"); },
  "order.bookAgain":   function ()   { openDrawer("booking"); },
  "order.filter":      function (id) { setState({ filter: id }); },
  "compliance.unlock": function ()   { toast("Compliance Reports is a Pro add-on \u2014 ask your account manager"); },
  "booking.open":      function ()   { openDrawer("booking"); },
  "booking.confirm":   function ()   { closeDrawer(); failCommand("booking.confirm"); },
  "proposal.review":   function ()   { go("proposals.list"); },
  "proposal.open":     function (id) { openProposal(id); },
  "proposal.selectPlan": function (id) { selectPlan(id); },
  "proposal.approve":  function ()   { runCommand("proposal.approve", state.currentSiteId, function () { decideSite("approved"); }); },
  "proposal.requestRevision": function () { runCommand("proposal.requestRevision", state.currentSiteId, function () { decideSite("revision"); }); },
  "proposal.decline":  function ()   { runCommand("proposal.decline", state.currentSiteId, function () { decideSite("declined"); }); },
  "weather.confirm":   function (id) { runCommand("weather.confirm", id, function () { confirmWeather(id, "confirmed"); }); },
  "weather.decline":   function (id) { runCommand("weather.decline", id, function () { confirmWeather(id, "declined"); }); },
  "membership.activate": function () { failCommand("membership.activate"); },
  "support.open":      function ()   { go("support"); },
  "support.sendMessage": function () { runCommand("support.sendMessage", null, sendChat); },
  "support.quickReply": function (id) { runCommand("support.quickReply", id, function () { pushChat(id); }); },
  "support.helpTopic": function (id) { go("support"); runCommand("support.helpTopic", id, function () { pushChat(id); }); },
  "support.call":      function ()   { failCommand("support.call"); },
  "support.email":     function ()   { failCommand("support.email"); },
  "cart.open":         function ()   { go("checkout"); },
  "service.request":   function ()   { openDrawer("booking"); },
  "service.requestExtra": function (id) { runCommand("service.requestExtra", id, function () { requestExtraService(id); }); },
  "service.reportIssue": function () { failCommand("service.reportIssue"); },
  "access.confirm":    function (id) { runCommand("access.confirm", id, function () { confirmAccess(id); }); },
  "access.update":     function ()   { failCommand("access.update"); },
  "cart.addItem":      function (id) { runCommand("cart.addItem", id, function () { addToCart(id); }); },
  "cart.removeItem":   function (id) { runCommand("cart.removeItem", id, function () { setCart(state.cartItems.filter(function (x) { return x.name !== id; })); }); },
  "cart.inc":          function (id) { runCommand("cart.inc", id, function () { changeQty(id, 1); }); },
  "cart.dec":          function (id) { runCommand("cart.dec", id, function () { changeQty(id, -1); }); },
  "checkout.placeOrder": function () { runCommand("checkout.placeOrder", null, placeFixtureOrder); },
  "checkout.pickAddress": function (id) { runCommand("checkout.pickAddress", id, function () { setState({ addrId: id }); }); },
  "checkout.pickPayment": function (id) { runCommand("checkout.pickPayment", id, function () { setState({ payId: id }); }); },
  "products.filter":   function (id) { setState({ prodCat: id }); },
  "activity.open":     function ()   { go("activity"); },
  "activity.markRead": function ()   { runCommand("activity.markRead", null, function () { state.activityReadAll = true; toast("Activity marked read in fixture state"); }); },
  "activity.filter":   function (id) { setState({ feedFilter: id }); },
  "activity.act":      function (id) { feedAction(id); },
  "profile.open":      function ()   { go("profile"); },
  "profile.filter":    function (id) { setState({ profileFilter: id }); },
  "profile.setDefaultAddress": function (id) { runCommand("profile.setDefaultAddress", id, function () { setState({ addrId: id }); }); },
  "profile.setDefaultPayment": function (id) { runCommand("profile.setDefaultPayment", id, function () { setState({ payId: id }); }); },
  "profile.addAddress": function ()  { failCommand("profile.addAddress"); },
  "profile.addCard":   function ()   { failCommand("profile.addCard"); },
  "profile.updateAddress": function () { failCommand("profile.updateAddress"); },
  "profile.togglePref": function (id) { runCommand("profile.togglePref", id, function () { togglePref(id); }); },
  "profile.managePlan": function ()  { go("pricing"); },
  "auth.signOut":      function ()   { state.session.authenticated = false; state.phone = ""; state.code = ""; go("auth.phone"); toast("Signed out"); },
  "calendar.open":     function ()   { go("calendar"); },
  "calendar.prev":     function ()   { calShift(-1); },
  "calendar.next":     function ()   { calShift(1); },
  "ui.retry":          function ()   { setState({ view: "ready" }); },
  "ui.toggleMode":     function ()   { state.userModeOverridden = true; setState({ mode: state.mode === "Dark" ? "Light" : "Dark" }); },
  "ui.toggleMobileNav":function ()   { setState({ mobileNav: !state.mobileNav }); },
  "theme.pick":        function (id) { pickTheme(id); }
};

/* delegated action handling: reads data-action + data-id */

export function bindActions(root) {
  root.addEventListener("click", function (e) {
    var el = e.target.closest("[data-action]");
    if (!el || !root.contains(el)) return;
    if (el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true") return;
    var name = el.getAttribute("data-action");
    var id = el.getAttribute("data-id") || null;
    if (el.hasAttribute("data-requires-confirmation")) {
      if (!window.confirm("Are you sure?\n\n" + name + (id ? " \u00b7 " + id : ""))) return;
    }
    var fn = ACTIONS[name];
    if (fn) fn(id, el);
    else failCommand(name);
  });
}

export function failCommand(name) {
  console.warn("[aircove] command unavailable:", name);
  state.commandErrors[name] = "Command is not connected";
  toast(name + " is not connected yet");
}

export function commandKey(name, id) { return name + ":" + (id || "_"); }

export function runCommand(name, id, handler) {
  var key = commandKey(name, id);
  state.pending[key] = true;
  delete state.commandErrors[key];
  try {
    handler();
  } catch (error) {
    state.commandErrors[key] = error && error.message ? error.message : "Command failed";
    toast(name + " failed");
  } finally {
    state.pending[key] = false;
    render();
  }
}

export function setState(patch) { Object.assign(state, patch); render(); }

export function go(route) {
  var resolved = resolveRoute(route);
  state.route = resolved.id;
  state.mobileNav = false;
  writeRouteToLocation(resolved.id);
  render();
}

export function openOrder(id) { state.currentOrderId = id; state.route = "order.detail"; state.view = "ready"; state.mobileNav = false; render(); }

export function cancelOrder(id) {
  var order = state.orders.find(function (o) { return o.id === id; });
  if (!order) throw new Error("Order not found");
  if (order.status === "completed" || order.status === "cancelled") throw new Error("Order cannot be cancelled");
  state.orders = state.orders.map(function (o) { return o.id === id ? Object.assign({}, o, { status: "cancelled" }) : o; });
  render();
  toast("Visit " + id + " cancelled");
}

export function setCart(items) { state.cartItems = items; render(); }

export function addToCart(name) {
  var p = findProduct(name);
  if (!p) throw new Error("Product not found");
  var existing = state.cartItems.find(function (x) { return x.name === name; });
  if (existing) state.cartItems = state.cartItems.map(function (x) { return x.name === name ? Object.assign({}, x, { qty: x.qty + 1 }) : x; });
  else state.cartItems = state.cartItems.concat([Object.assign({}, p, { qty: 1 })]);
  render(); toast(name + " added to cart");
}

export function changeQty(name, delta) {
  if (!state.cartItems.some(function (x) { return x.name === name; })) throw new Error("Cart item not found");
  state.cartItems = state.cartItems
    .map(function (x) { return x.name === name ? Object.assign({}, x, { qty: x.qty + delta }) : x; })
    .filter(function (x) { return x.qty > 0; });
  render();
}
/* switching theme clears the (theme-specific) cart */

export function pickThemeResetCart() { state.cartItems = []; state.prodCat = "all"; }

/* active portal profile (config-driven by vertical) */

export function signIn() {
  var nextRoute = state.session.intendedRoute || "orders.list";
  state.session.authenticated = true;
  state.session.intendedRoute = null;
  state.authError = null;
  state.code = "";
  go(nextRoute);
  toast("Signed in");
}

export function validatePhone() {
  var digits = (state.phone || "").replace(/\D/g, "");
  if (digits.length < 6) { setState({ authError: "Enter a valid phone number" }); return; }
  state.authError = null; state.code = ""; go("auth.code");
}

export function validateCode() {
  if ((state.code || "").length < 4) { setState({ authError: "Enter all 4 digits" }); return; }
  signIn();
}

export function togglePref(key) { state.prefs = Object.assign({}, state.prefs, { }); state.prefs[key] = !state.prefs[key]; render(); }

export function calShift(delta) {
  var m = state.calMonth + delta, y = state.calYear;
  if (m < 0) { m = 11; y--; } else if (m > 11) { m = 0; y++; }
  setState({ calMonth: m, calYear: y });
}

export function feedAction(act) {
  if (act === "orders") { var o = state.orders.find(function (x) { return x.status === "inprogress"; }) || state.orders[0]; openOrder(o.id); }
  else if (act === "products") go("products");
  else if (act === "book") openDrawer("booking");
  else if (act === "invoice") toast("Invoice #SV-2381 emailed to you");
  else if (act === "weather") { var w = state.orders.find(function (x) { return x.wt && x.wt.status === "pending"; }); if (w) openOrder(w.id); }
}
export function pushChat(text) {
  if (!text || !text.trim()) throw new Error("Message is empty");
  state.messages = state.messages.concat([{ from: "user", text: text.trim() }]);
  state.chatInput = "";
  if (state.route !== "support") state.route = "support";
  toast("Message queued in fixture state");
}

export function sendChat() { pushChat(state.chatInput); }

export function confirmAccess(id) {
  var key = id || "next";
  state.accessConfirmations[key] = true;
  toast("Access confirmed in fixture state");
}

export function requestExtraService(id) {
  state.serviceRequests = state.serviceRequests.concat([{ id: id || "extra", status: "draft" }]);
  openDrawer("booking");
}

export function placeFixtureOrder() {
  if (!state.cartItems.length) throw new Error("Cart is empty");
  var first = state.cartItems[0];
  var order = {
    id: "FX-" + String(state.nextFixtureOrder++).padStart(3, "0"),
    status: "scheduled",
    serviceName: first.name,
    y: 2026,
    m: 0,
    d: 22,
    slot: "10:00 AM",
    locationId: state.addrId,
    total: state.cartItems.reduce(function (sum, item) { return sum + item.priceNum * item.qty; }, 0),
    timeline: ["Order placed in fixture state", "Awaiting dispatch"],
  };
  state.orders = [order].concat(state.orders);
  setCart([]);
  go("orders.list");
  toast("Order placed in fixture state");
}

export function openProposal(id) {
  if (!proposalSites().some(function (p) { return p.id === id; })) throw new Error("Proposal not found");
  state.currentSiteId = id;
  state.psites = state.psites.map(function (p) { return (p.id === id && p.status === "unseen") ? Object.assign({}, p, { status: "viewed" }) : p; });
  state.route = "proposal.detail"; state.mobileNav = false; render();
}

export function selectPlan(planId) {
  if (!planId) throw new Error("Plan is required");
  if (!proposalSites().some(function (p) { return p.id === state.currentSiteId; })) throw new Error("Proposal not found");
  state.psites = state.psites.map(function (p) { return p.id === state.currentSiteId ? Object.assign({}, p, { selected: planId }) : p; });
  render();
}

export function decideSite(status) {
  if (["approved", "revision", "declined"].indexOf(status) === -1) throw new Error("Unsupported proposal status");
  var id = state.currentSiteId;
  if (!proposalSites().some(function (p) { return p.id === id; })) throw new Error("Proposal not found");
  state.psites = state.psites.map(function (p) { return p.id === id ? Object.assign({}, p, { status: status }) : p; });
  go("proposals.list");
  toast(status === "approved" ? "Plan approved in fixture state" : status === "revision" ? "Revision requested in fixture state" : "Proposal declined in fixture state");
}
/* derive per-visit + season pricing from Beam AI measured area */

export function pickTheme(name) {
  var slug = normalizeVertical(name);
  var profile = verticalProfiles[slug];
  state.config.vertical = slug;
  state.config.profile = profile.profile;
  state.config.defaultRoute = profile.defaultRoute;
  state.config.enabledModules = profile.modules.slice();
  state.theme = profile.displayName;
  state.orders = F.ordersFor(profile.displayName);
  state.filter = "all";
  pickThemeResetCart();
  var resolved = resolveRoute(state.route);
  state.route = resolved.id;
  writeRouteToLocation(resolved.id);
  render();
}

export function confirmWeather(id, decision) {
  if (["confirmed", "declined"].indexOf(decision) === -1) throw new Error("Unsupported weather decision");
  var order = state.orders.find(function (o) { return o.id === id && o.wt; });
  if (!order) throw new Error("Weather-triggered order not found");
  state.orders = state.orders.map(function (o) {
    if (o.id === id && o.wt) return Object.assign({}, o, { wt: Object.assign({}, o.wt, { status: decision }) });
    return o;
  });
  render();
  toast(decision === "confirmed" ? "Visit confirmed" : "Visit declined");
}

export function openDrawer(name) { state.drawer = name; render(); }

export function closeDrawer() { state.drawer = null; render(); }

var toastTimer;

export function toast(msg) {
  state.toast = msg; render();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { state.toast = null; render(); }, 2600);
}

/* =========================================================
   COMPONENT FACTORIES  (visual-first, props-driven)
   ========================================================= */

/* StatusBadge */

// customer-portal/runtime/src/actions.js — production transfer module.
import { F } from "../data/fixtures.js";
import { findProduct, state } from "./state.js";
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
  "order.cancel":      function (id) { cancelOrder(id); },
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
  "proposal.approve":  function ()   { decideSite("approved"); },
  "proposal.requestRevision": function () { decideSite("revision"); },
  "proposal.decline":  function ()   { decideSite("declined"); },
  "weather.confirm":   function (id) { confirmWeather(id, "confirmed"); },
  "weather.decline":   function (id) { confirmWeather(id, "declined"); },
  "membership.activate": function () { failCommand("membership.activate"); },
  "support.open":      function ()   { go("support"); },
  "support.sendMessage": function () { failCommand("support.sendMessage"); },
  "support.quickReply": function () { failCommand("support.quickReply"); },
  "support.helpTopic": function () { go("support"); failCommand("support.helpTopic"); },
  "support.call":      function ()   { failCommand("support.call"); },
  "support.email":     function ()   { failCommand("support.email"); },
  "cart.open":         function ()   { go("checkout"); },
  "service.request":   function ()   { openDrawer("booking"); },
  "service.requestExtra": function () { openDrawer("booking"); },
  "service.reportIssue": function () { failCommand("service.reportIssue"); },
  "access.confirm":    function () { failCommand("access.confirm"); },
  "access.update":     function ()   { failCommand("access.update"); },
  "cart.addItem":      function (id) { addToCart(id); },
  "cart.removeItem":   function (id) { setCart(state.cartItems.filter(function (x) { return x.name !== id; })); },
  "cart.inc":          function (id) { changeQty(id, 1); },
  "cart.dec":          function (id) { changeQty(id, -1); },
  "checkout.placeOrder": function () { failCommand("checkout.placeOrder"); },
  "checkout.pickAddress": function (id) { setState({ addrId: id }); },
  "checkout.pickPayment": function (id) { setState({ payId: id }); },
  "products.filter":   function (id) { setState({ prodCat: id }); },
  "activity.open":     function ()   { go("activity"); },
  "activity.markRead": function ()   { failCommand("activity.markRead"); },
  "activity.filter":   function (id) { setState({ feedFilter: id }); },
  "activity.act":      function (id) { feedAction(id); },
  "profile.open":      function ()   { go("profile"); },
  "profile.filter":    function (id) { setState({ profileFilter: id }); },
  "profile.setDefaultAddress": function (id) { setState({ addrId: id }); },
  "profile.setDefaultPayment": function (id) { setState({ payId: id }); },
  "profile.addAddress": function ()  { failCommand("profile.addAddress"); },
  "profile.addCard":   function ()   { failCommand("profile.addCard"); },
  "profile.updateAddress": function () { failCommand("profile.updateAddress"); },
  "profile.togglePref": function (id) { togglePref(id); },
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
  toast(name + " is not connected yet");
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
  state.orders = state.orders.map(function (o) { return o.id === id ? Object.assign({}, o, { status: "cancelled" }) : o; });
  render();
  toast("Visit " + id + " cancelled");
}

export function setCart(items) { state.cartItems = items; render(); }

export function addToCart(name) {
  var p = findProduct(name); if (!p) return;
  var existing = state.cartItems.find(function (x) { return x.name === name; });
  if (existing) state.cartItems = state.cartItems.map(function (x) { return x.name === name ? Object.assign({}, x, { qty: x.qty + 1 }) : x; });
  else state.cartItems = state.cartItems.concat([Object.assign({}, p, { qty: 1 })]);
  render(); toast(name + " added to cart");
}

export function changeQty(name, delta) {
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
  if (!text || !text.trim()) return;
  failCommand("support.sendMessage");
}

export function sendChat() { pushChat(state.chatInput); }

export function openProposal(id) {
  state.currentSiteId = id;
  state.psites = state.psites.map(function (p) { return (p.id === id && p.status === "unseen") ? Object.assign({}, p, { status: "viewed" }) : p; });
  state.route = "proposal.detail"; state.mobileNav = false; render();
}

export function selectPlan(planId) {
  state.psites = state.psites.map(function (p) { return p.id === state.currentSiteId ? Object.assign({}, p, { selected: planId }) : p; });
  render();
}

export function decideSite(status) {
  var id = state.currentSiteId;
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

// customer-portal/runtime/src/actions.js — production transfer module.
import { F } from "../data/fixtures.js";
import { cmdPhase, currentAppointment, currentFixture, currentPurchase, findProduct, isSpa, orderItems, productItems, proposalSites, spaCurrentApiDemoOpen, spaPlanOffers, spaPlanSellOpen, spaProfileValues, spaRetailOpen, state } from "./state.js";
import { invalidateCareRuntime, reloadCareRuntime, reloadRuntimeModule, render, retryRuntimeLoad } from "./app.js";
import { createCoreSpaDemoAdapter } from "./adapters/core-spa-demo-adapter.js";
import { startCoreOidcSignIn, startCoreOidcSignOut } from "./adapters/core-oidc-adapter.js";
import { createCoreUserProfileAdapter } from "./adapters/core-user-profile-adapter.js";
import { normalizeVertical, verticalProfiles } from "./config.js";
import { resolveRoute, writeRouteToLocation } from "./router.js";
import { selectSeoService, toggleSeoFaq } from "./seo-actions.js";

export var ACTIONS = {
  "nav.go":            function (id) { go(id); },
  "nav.landing":       function ()   { go("landing"); },
  "nav.services":      function ()   { go("services"); },
  "nav.pricing":       function ()   { go("pricing"); },
  "nav.products":      function ()   { go("products"); },
  "auth.gotoSignin":   function ()   { state.authError = null; state.code = ""; go("auth.oidc"); },
  "auth.oidcSignIn":   function ()   {
    if (state.config.dataMode !== "live") return failCommand("auth.oidcSignIn");
    state.oidc = "redirecting";
    render();
    return startCoreOidcSignIn(state.config).catch(function (error) {
      state.oidc = "unavailable";
      state.commandErrors["auth.oidcSignIn"] = error && error.message || "Sign-in failed";
      render();
      return false;
    });
  },
  "auth.retrySession": function ()   { return retryRuntimeLoad(); },
  "auth.sendCode":     function ()   { validatePhone(); },
  "auth.verifyCode":   function ()   { validateCode(); },
  "auth.back":         function ()   { state.authError = null; go("auth.phone"); },
  "auth.resend":       function ()   { failCommand("auth.resend"); },
  "auth.apple":        function ()   { failCommand("auth.apple"); },
  "order.open":        function (id) { openOrder(id); },
  "order.back":        function ()   { go("orders.list"); },
  "order.cancel":      function (id) {
    if (isSpa()) return spaApptCancel(id);
    return runCommand("order.cancel", id, function () { cancelOrder(id); });
  },
  "order.reschedule":  function (id) { if (spaFlowCapable()) return openSpaFlow({ entry: "reschedule", rescheduleOf: id }); openDrawer("booking"); },
  "order.downloadInvoice": function () { failCommand("order.downloadInvoice"); },
  "order.bookAgain":   function (id) { if (spaFlowCapable()) return openSpaFlow({ entry: "book-again", fromAppt: id }); openDrawer("booking"); },
  "order.filter":      function (id) { setState({ filter: id }); },
  "compliance.unlock": function ()   { toast("Compliance Reports is a Pro add-on \u2014 ask your account manager"); },
  "booking.open":      function (id) { if (spaFlowCapable()) return openSpaFlow(id ? { entry: "service", serviceCode: id } : { entry: "empty" }); openDrawer("booking"); },
  "booking.close":     function ()   { state.spaFlow = null; state.spaBookAck = false; closeDrawer(); },
  "booking.selectService": function (id) { var flow = state.spaFlow; if (!flow) return; flow.serviceCode = id; flow.specialistRef = null; flow.slotRef = null; flow.held = false; spaFlowAfterService(flow); render(); },
  "booking.selectSpecialist": function (id) { var flow = state.spaFlow; if (!flow) return; flow.specialistRef = id === "any" ? null : id; flow.step = "slots"; render(); },
  "booking.selectSlot": function (id) { var flow = state.spaFlow; if (!flow) return; if (String(id).indexOf("day:") === 0) { flow.dayKey = String(id).slice(4); flow.slotRef = null; } else { flow.slotRef = id; var day = F.spaBooking.days.find(function (item) { return (item.slots || []).some(function (slot) { return slot.ref === id; }); }); if (day) flow.dayKey = day.key; } render(); },
  "booking.hold":      function (id) { return spaHoldSlot(id); },
  "booking.retry":     function (id) { var flow = state.spaFlow; if (!flow) return; if (id === "hold") { clearSpaCommand("booking.hold:" + flow.slotRef); return spaHoldSlot(flow.slotRef); } clearSpaCommand("booking.confirm:" + F.spaBooking.ref); return spaBookingConfirm(); },
  "booking.back":      function () { var flow = state.spaFlow; if (!flow) return; if (flow.step === "review") { flow.held = false; flow.step = "slots"; } else if (flow.step === "slots") { flow.step = (F.spaBooking.eligibleSpecialists[flow.serviceCode] || []).length ? "specialist" : "context"; } else { flow.step = "context"; } render(); },
  "booking.ackPolicy": function () { setState({ spaBookAck: !state.spaBookAck }); },
  "booking.confirm":   function ()   { if (isSpa()) return spaBookingConfirm(); closeDrawer(); failCommand("booking.confirm"); },
  "appointment.open": function (id) { state.spaCurrentAppointment = id; state.view = "ready"; go("appointment.detail"); },
  "appointment.openPurchase": function (id) { ACTIONS["purchase.open"](id); },
  "appointment.reschedule": function (id) { return openSpaFlow({ entry: "reschedule", rescheduleOf: id }); },
  "appointment.cancel": function (id) { return spaApptCancel(id); },
  "appointment.bookAgain": function (id) { return openSpaFlow({ entry: "book-again", fromAppt: id }); },
  "proposal.review":   function ()   { go("proposals.list"); },
  "proposal.open":     function (id) { openProposal(id); },
  "proposal.selectPlan": function (id) { runCommand("proposal.selectPlan", id, function () { selectPlan(id); }); },
  "proposal.approve":  function ()   { runCommand("proposal.approve", state.currentSiteId, function () { decideSite("approved"); }); },
  "proposal.requestRevision": function () { runCommand("proposal.requestRevision", state.currentSiteId, function () { decideSite("revision"); }); },
  "proposal.decline":  function ()   { runCommand("proposal.decline", state.currentSiteId, function () { decideSite("declined"); }); },
  "weather.confirm":   function (id) { runCommand("weather.confirm", id, function () { confirmWeather(id, "confirmed"); }); },
  "weather.decline":   function (id) { runCommand("weather.decline", id, function () { confirmWeather(id, "declined"); }); },
  "membership.activate": function () { failCommand("membership.activate"); },
  "support.open":      function ()   { if (isSpa()) return setState({ spaSupport: true, accountMenu: false, mobileNav: false }); go("support"); },
  "support.sendMessage": function () { runCommand("support.sendMessage", null, sendChat); },
  "support.quickReply": function (id) { runCommand("support.quickReply", id, function () { pushChat(id); }); },
  "support.helpTopic": function (id) { go("support"); runCommand("support.helpTopic", id, function () { pushChat(id); }); },
  "support.call":      function ()   { if (isSpa()) return setState({ spaSupport: true }); failCommand("support.call"); },
  "support.email":     function ()   { if (isSpa()) return setState({ spaSupport: true }); failCommand("support.email"); },
  "support.dismiss":   function ()   { setState({ spaSupport: false }); },
  "care.selectUnit":   function (id, el) { return selectCareUnit(id, el); },
  "care.download":     function (id, el) { return downloadCareDocument(id, el); },
  "care.requestRetreat": function (id, el) { return requestCareRetreat(id, el); },
  "care.selectSpecialist": function (id, el) { return selectCareSpecialist(id, el); },
  "care.completeTask": function (id, el) { return toggleCareTask(id, el); },
  "care.contactProvider": function (id, el) { return runUnavailableCareCommand("care.contactProvider", id, el); },
  "care.openSecureDoc": function (id, el) { return runUnavailableCareCommand("care.openSecureDoc", id, el); },
  "seo.cta.book":    function (id, el) { validateSeoLink(el); },
  "seo.cta.quote":   function (id, el) { validateSeoLink(el); },
  "seo.cta.call":    function (id, el) { validateSeoLink(el); },
  "seo.cta.services": function (id, el, event) { navigateSeoServices(el, event); },
  "seo.service.select": function (id) { selectSeoService(id, render); },
  "seo.faq.toggle": function (id, el, event) { if (event) event.preventDefault(); toggleSeoFaq(id, render); },
  "cart.open":         function ()   { go(isSpa() && spaRetailOpen() ? "cart" : "checkout"); },
  "service.request":   function ()   { openDrawer("booking"); },
  "service.requestExtra": function (id) { runCommand("service.requestExtra", id, function () { requestExtraService(id); }); },
  "service.reportIssue": function () { failCommand("service.reportIssue"); },
  "access.confirm":    function (id) { runCommand("access.confirm", id, function () { confirmAccess(id); }); },
  "access.update":     function ()   { failCommand("access.update"); },
  "cart.addItem":      function (id) { if (isSpa() && state.capability === "target-appointments") { if (spaCurrentApiDemoOpen()) { spaAddLine(id); render(); return true; } return runSpaCommand("cart.addItem:" + id, function () { spaAddLine(id); }); } runCommand("cart.addItem", id, function () { addToCart(id); }); },
  "cart.removeItem":   function (id) { if (isSpa() && state.capability === "target-appointments") { if (spaCurrentApiDemoOpen()) { spaSetLines(spaLines().filter(function (line) { return line.ref !== id; })); render(); return true; } return runSpaCommand("cart.removeItem:" + id, function () { spaSetLines(spaLines().filter(function (line) { return line.ref !== id; })); }); } runCommand("cart.removeItem", id, function () { removeCartItem(id); }); },
  "cart.changeQuantity": function (id) { return spaChangeQuantity(id); },
  "cart.inc":          function (id) { runCommand("cart.inc", id, function () { changeQty(id, 1); }); },
  "cart.dec":          function (id) { runCommand("cart.dec", id, function () { changeQty(id, -1); }); },
  "checkout.placeOrder": function () { runCommand("checkout.placeOrder", null, placeFixtureOrder); },
  "checkout.pickAddress": function (id) { runCommand("checkout.pickAddress", id, function () { selectAddress(id); }); },
  "checkout.pickPayment": function (id) { runCommand("checkout.pickPayment", id, function () { selectPayment(id); }); },
  "account.open":          function () { go("account"); },
  "account.openPurchases": function () { state.spaPurchFilter = "all"; go("purchases.list"); },
  "account.openPlan":      function () { go("plan"); },
  "account.openProfile":   function () { go("profile"); },
  "account.menu":          function () { setState({ accountMenu: !state.accountMenu, mobileNav: false }); },
  "purchases.filter":      function (id) { setState({ spaPurchFilter: id }); },
  "purchases.more":        function () { spaLoadMore(); },
  "purchase.open":         function (id) { state.spaCurrentPurchase = id; state.view = "ready"; go("purchase.detail"); },
  "purchase.openAppointment": function () { go("orders.list"); },
  "purchase.cancelRequest": function (id) { return runSpaCommand("purchase.cancelRequest:" + id, function () { state.spaCancelReqs = Object.assign({}, state.spaCancelReqs, { [id]: "accepted-for-review" }); }); },
  "purchase.returnRequest": function (id) { return runSpaCommand("purchase.returnRequest:" + id, function () { state.spaReturns = Object.assign({}, state.spaReturns, { [id]: "accepted-for-review" }); }); },
  "purchase.buyAgain":     function (id) { return spaBuyAgain(id); },
  "plan.bookWithCredit":   function (id) { if (spaFlowCapable()) return openSpaFlow({ entry: "credit", planRef: id }); openDrawer("booking"); },
  "plan.purchase":         function (id) { if (!spaPlanSellOpen() || state.spaOfferDemo !== "sellable") return false; state.spaPlanOffer = id; return spaCheckoutStart("plan"); },
  "plan.cancelRenewal":    function (id) { return runSpaCommand("plan.cancelRenewal:" + id, function () { state.spaPlanCancelled = Object.assign({}, state.spaPlanCancelled, { [id]: true }); }); },
  "shop.pickVariant":      function (id) { var parts = String(id || "").split("|"); state.spaVariantPick = Object.assign({}, state.spaVariantPick, { [parts[0]]: parts[1] }); render(); },
  "checkout.start":        function (id) { return spaCheckoutStart(id); },
  "checkout.selectFulfillment": function () { render(); },
  "checkout.ackPolicy":    function () { setState({ spaPolicyAck: !state.spaPolicyAck }); },
  "checkout.confirm":      function () { return spaConfirmCheckout(); },
  "checkout.retryConfirm": function () { return spaConfirmCheckout(); },
  "products.filter":   function (id) { setState({ prodCat: id }); },
  "activity.open":     function ()   { go("activity"); },
  "activity.markRead": function ()   { runCommand("activity.markRead", null, function () { state.activityReadAll = true; toast("Activity marked read in fixture state"); }); },
  "activity.filter":   function (id) { setState({ feedFilter: id }); },
  "activity.act":      function (id) { feedAction(id); },
  "profile.open":      function ()   { go("profile"); },
  "profile.filter":    function (id) { setState({ profileFilter: id }); },
  "profile.setDefaultAddress": function (id) { runCommand("profile.setDefaultAddress", id, function () { selectAddress(id); }); },
  "profile.setDefaultPayment": function (id) { runCommand("profile.setDefaultPayment", id, function () { selectPayment(id); }); },
  "profile.addAddress": function ()  { failCommand("profile.addAddress"); },
  "profile.addCard":   function ()   { failCommand("profile.addCard"); },
  "profile.updateAddress": function () { failCommand("profile.updateAddress"); },
  "profile.togglePref": function (id) { runCommand("profile.togglePref", id, function () { togglePref(id); }); },
  "profile.edit": function () { var value = spaProfileValues(); state.spaProfileDraft = { phone: value.phone, email: value.email, prefs: Object.assign({}, value.prefs) }; state.spaProfileErrors = null; render(); },
  "profile.changeField": function (id) { return spaProfileChange(id); },
  "profile.save": function () { return spaProfileSave(); },
  "profile.reload": function () {
    clearSpaCommand("profile.save:profile"); state.spaProfileDraft = null; state.spaProfileErrors = null;
    if (state.config.dataMode === "live") return reloadRuntimeModule("profile").then(function () { toast("Profile reloaded from Core"); });
    render(); toast("Profile reloaded — showing the details on file");
  },
  "profile.managePlan": function ()  { go("pricing"); },
  "auth.signOut":      function ()   {
    if (state.config.dataMode === "live") {
      state.oidc = "signing-out";
      render();
      return startCoreOidcSignOut(state.config).catch(function (error) {
        state.oidc = "unavailable";
        state.commandErrors["auth.signOut"] = error && error.message || "Sign-out failed";
        render();
        return false;
      });
    }
    state.session.authenticated = false; state.account = "session-expired"; state.phone = ""; state.code = ""; invalidateCareRuntime(); go("auth.oidc"); toast("Signed out");
  },
  "calendar.open":     function ()   { go("calendar"); },
  "calendar.prev":     function ()   { calShift(-1); },
  "calendar.next":     function ()   { calShift(1); },
  "ui.retry":          function (id)   { return retrySpaOrRuntime(id); },
  "ui.toggleMode":     function ()   { state.userModeOverridden = true; setState({ mode: state.mode === "Dark" ? "Light" : "Dark" }); },
  "ui.toggleMobileNav":function ()   { setState({ mobileNav: !state.mobileNav, accountMenu: false }); },
  "theme.pick":        function (id) { return pickTheme(id); }
};

function validateSeoLink(el) {
  var href = el && el.getAttribute("href");
  if (!href || !(href.charAt(0) === "#" || /^https?:\/\//i.test(href) || /^tel:/i.test(href))) {
    throw new Error("SEO destination is unavailable");
  }
}

function navigateSeoServices(el, event) {
  validateSeoLink(el);
  if (state.route !== "seo.landing" || state.config.routerMode !== "hash") return;
  if (event) event.preventDefault();
  var target = document.getElementById("seo-services");
  if (target) target.scrollIntoView({ block: "start" });
}

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
    if (fn) {
      var result = fn(id, el, e);
      if (result && typeof result.then === "function") {
        Promise.resolve(result).catch(function () { render(); });
      }
    }
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

var spaCommandTimers = {};
var spaLiveCommandFlights = new Map();

export function runSpaCommand(key, onReadback, options) {
  options = options || {};
  if (state.config.dataMode !== "fixture") {
    state.commands = Object.assign({}, state.commands, { [key]: "failed" });
    render();
    return false;
  }
  if (state.commands[key] === "pending") return false;
  clearTimeout(spaCommandTimers[key]);
  state.commands = Object.assign({}, state.commands, { [key]: "pending" });
  render();
  spaCommandTimers[key] = setTimeout(function () {
    var outcome = state.cmdForce || "succeeded";
    state.commands = Object.assign({}, state.commands);
    if (outcome === "session-lost") {
      delete state.commands[key];
      state.drawer = null;
      state.spaFlow = null;
      state.spaBookAck = false;
      state.account = "session-expired";
      render();
      return;
    }
    if (outcome !== "succeeded") {
      state.commands[key] = outcome;
      render();
      return;
    }
    delete state.commands[key];
    if (onReadback) onReadback();
    render();
    if (options.toast) toast(options.toast);
  }, options.ms || 650);
  return true;
}

function runLiveSpaCommand(key, operation, onReadback, options) {
  options = options || {};
  if (!spaCurrentApiDemoOpen()) return false;
  if (spaLiveCommandFlights.has(key)) return spaLiveCommandFlights.get(key);
  state.commands = Object.assign({}, state.commands, { [key]: "pending" });
  render();
  var flight = Promise.resolve().then(operation).then(function (result) {
    state.commands = Object.assign({}, state.commands);
    delete state.commands[key];
    if (onReadback) onReadback(result);
    if (options.toast) toast(options.toast);
    return result;
  }).catch(function (error) {
    state.commands = Object.assign({}, state.commands, {
      [key]: error && error.code === "conflict" ? "conflict" : "failed",
    });
    if (error && error.code === "session-expired") {
      delete state.commands[key];
      state.drawer = null;
      state.spaFlow = null;
      state.spaBookAck = false;
      state.account = "session-expired";
    }
    console.error("[aircove] live SPA command failed", key, error);
    return false;
  }).finally(function () {
    spaLiveCommandFlights.delete(key);
    render();
  });
  spaLiveCommandFlights.set(key, flight);
  return flight;
}

function spaLiveAdapter() {
  return createCoreSpaDemoAdapter();
}

function spaLiveContext() {
  return { config: state.config, state: state };
}

function spaLines() { return state.spaCart && state.spaCart.lines || []; }

function spaSetLines(lines) { state.spaCart = F.spaServerCart(lines); }

function spaAddLine(code) {
  if (!spaRetailOpen()) return;
  if (spaCurrentApiDemoOpen()) {
    var liveProduct = productItems().find(function (item) { return item.code === code; });
    if (!liveProduct || !Number.isFinite(Number(liveProduct.priceNum))) return;
    var liveRef = "cln-" + String(code).toLowerCase().replace(/[^a-z0-9]+/g, "-");
    var liveLines = spaLines().slice();
    var liveExisting = liveLines.find(function (line) { return line.ref === liveRef; });
    if (liveExisting) liveLines = liveLines.map(function (line) { return line.ref === liveRef ? Object.assign({}, line, { qty: line.qty + 1 }) : line; });
    else liveLines.push({ ref: liveRef, code: code, variantRef: null, title: liveProduct.name, variant: null, qty: 1, cents: Math.round(Number(liveProduct.priceNum) * 100) });
    spaSetLines(liveLines);
    return;
  }
  var retail = F.spaCommerce.retail.products.find(function (product) { return product.code === code; });
  var product = F.themes.Beauty.products.find(function (item) { return item.code === code; });
  if (!retail || !product) return;
  var variant = retail.variants && retail.variants.find(function (item) { return item.ref === state.spaVariantPick[code]; });
  if (retail.variants && !variant) return;
  var lineRef = "cln-" + code.replace("rtl-beauty-", "") + (variant ? "-" + variant.ref.split("-").pop() : "");
  var lines = spaLines().slice();
  var existing = lines.find(function (line) { return line.ref === lineRef; });
  if (existing) lines = lines.map(function (line) { return line.ref === lineRef ? Object.assign({}, line, { qty: line.qty + 1 }) : line; });
  else lines.push({ ref: lineRef, code: code, variantRef: variant ? variant.ref : null, title: product.name, variant: variant ? variant.label : null, qty: 1, cents: variant ? variant.cents : retail.cents });
  spaSetLines(lines);
}

function spaChangeQuantity(id) {
  var parts = String(id || "").split("|");
  var ref = parts[0];
  var qty = Math.max(0, Number(parts[1] || 0));
  if (spaCurrentApiDemoOpen()) {
    spaSetLines(qty === 0
      ? spaLines().filter(function (line) { return line.ref !== ref; })
      : spaLines().map(function (line) { return line.ref === ref ? Object.assign({}, line, { qty: qty }) : line; }));
    render();
    return true;
  }
  return runSpaCommand("cart.changeQuantity:" + ref, function () {
    spaSetLines(qty === 0
      ? spaLines().filter(function (line) { return line.ref !== ref; })
      : spaLines().map(function (line) { return line.ref === ref ? Object.assign({}, line, { qty: qty }) : line; }));
    if (state.spaCartDemo === "inventory-conflict" && qty <= 1) state.spaCartDemo = "as-added";
  });
}

var spaPurchMoreTimer;
function spaLoadMore() {
  if (state.spaPurchMore !== "idle") return;
  state.spaPurchMore = "loading";
  render();
  clearTimeout(spaPurchMoreTimer);
  spaPurchMoreTimer = setTimeout(function () { state.spaPurchMore = "loaded"; render(); }, 650);
}

function spaCheckoutStart(source) {
  if (source !== "plan" && (state.spaCartDemo === "stale-price" || state.spaCartDemo === "inventory-conflict")) return false;
  if (source === "plan" && !state.spaPlanOffer) state.spaPlanOffer = "off-pkg-4c21";
  state.spaCheckoutSource = source === "plan" ? "plan" : "cart";
  state.spaResult = null;
  state.spaPolicyAck = false;
  state.spaCheckoutDemo = "ready";
  delete state.commands["checkout.confirm:" + F.spaCommerce.checkout.ref];
  go("checkout");
  return true;
}

function spaConfirmCheckout() {
  var commerceOpen = state.spaCheckoutSource === "plan" ? spaPlanSellOpen() : spaRetailOpen();
  if (!commerceOpen || state.spaCheckoutDemo !== "ready" || !state.spaPolicyAck) return false;
  var key = "checkout.confirm:" + F.spaCommerce.checkout.ref;
  if (spaCurrentApiDemoOpen()) {
    var lines = state.spaCheckoutSource === "plan" ? [] : spaLines();
    var requestRef = F.spaCommerce.checkout.ref + "-" + state.spaCheckoutSource + "-" + (state.spaCheckoutSource === "plan"
      ? state.spaPlanOffer || "offer"
      : lines.map(function (line) { return line.ref + "x" + line.qty; }).sort().join("-"));
    var amounts = spaLiveCheckoutAmounts();
    return runLiveSpaCommand(key, function () {
      return spaLiveAdapter().createOrder({ requestRef: requestRef, total: amounts.total, taxes: amounts.taxes }, spaLiveContext())
        .then(function (order) { return reloadRuntimeModule("orders").then(function () { return order; }); });
    }, function (order) {
      state.spaResult = {
        kind: "purchase",
        headline: "Order confirmed",
        sub: "The order was recorded in Core. This demo did not take a payment.",
        purchase: { ref: order.ref, reference: order.ref },
        fulfillment: "Pickup at Harbor Front studio",
      };
      if (state.spaCheckoutSource === "cart") {
        state.spaCart = F.spaServerCart([]);
        state.spaCartDemo = "as-added";
      }
    }, { toast: "Order created — confirmed by Core" });
  }
  return runSpaCommand(key, function () {
    if (state.spaCheckoutSource === "plan") {
      var offer = F.spaCommerce.planOffers.find(function (item) { return item.ref === state.spaPlanOffer; });
      state.spaResult = offer && offer.kind === "MEMBERSHIP" ? F.spaCommerce.confirmations.membership : F.spaCommerce.confirmations.plan;
    } else state.spaResult = F.spaCommerce.confirmations.retail;
    if (state.spaCheckoutSource === "cart") {
      state.spaCart = F.spaServerCart([]);
      state.spaCartDemo = "as-added";
    }
  }, { ms: 900 });
}

function spaBookingConfirm() {
  if (state.capability !== "target-appointments" || state.spaBooking !== "open" || state.spaHold !== "held") return false;
  var flow = state.spaFlow;
  var key = flow ? "booking.confirm:" + F.spaBooking.ref : "booking.confirm:booking";
  if (flow && (!flow.held || !state.spaBookAck || (flow.entry === "credit" && state.spaCredit !== "ok"))) return false;
  if (flow && spaCurrentApiDemoOpen()) {
    var service = state.config.dataMode === "live"
      ? (state.moduleData.pricing && state.moduleData.pricing.rates || []).find(function (item) { return item.code === flow.serviceCode; })
      : F.spa.pim.services.find(function (item) { return item.code === flow.serviceCode; });
    var input = {
      requestRef: F.spaBooking.ref + "-" + (flow.slotRef || "slot") + "-" + (flow.serviceCode || "service"),
      serviceName: service && service.name || "Spa appointment",
      start: spaSlotIso(flow.slotRef),
      durationMinutes: 60,
    };
    var command = flow.entry === "reschedule" && flow.rescheduleOf
      ? spaLiveAdapter().rescheduleAppointment.bind(null, flow.rescheduleOf, input, spaLiveContext())
      : spaLiveAdapter().createAppointment.bind(null, input, spaLiveContext());
    return runLiveSpaCommand(key, function () {
      return command().then(function (appointment) {
        return reloadRuntimeModule("appointments").then(function () { return appointment; });
      });
    }, function (appointment) {
      state.spaResult = {
        kind: "appointment",
        headline: flow.entry === "reschedule" ? "Booking updated" : "Booking confirmed",
        sub: "The appointment was recorded in Core. No payment was taken.",
        appointment: { ref: appointment.ref, service: appointment.service, start: appointment.start },
      };
      if (flow.entry === "reschedule" && flow.rescheduleOf) {
        state.spaRescheduled = Object.assign({}, state.spaRescheduled, { [flow.rescheduleOf]: { start: appointment.start } });
      }
      state.spaCurrentAppointment = appointment.ref;
      state.drawer = null;
      state.spaFlow = null;
      state.spaBookAck = false;
      state.route = "checkout";
      writeRouteToLocation("checkout");
    }, { toast: flow.entry === "reschedule" ? "Appointment moved — confirmed by Core" : "Appointment booked — confirmed by Core" });
  }
  return runSpaCommand(key, function () {
    state.spaResult = flow ? spaFlowResult() : F.spaCommerce.confirmations[state.spaBookResult] || F.spaCommerce.confirmations["appointment-only"];
    if (flow && flow.entry === "reschedule" && flow.rescheduleOf) {
      state.spaRescheduled = Object.assign({}, state.spaRescheduled, { [flow.rescheduleOf]: { start: spaSlotLabel() } });
    }
    state.drawer = null;
    state.spaFlow = null;
    state.spaBookAck = false;
    state.route = "checkout";
    writeRouteToLocation("checkout");
  }, { ms: 900 });
}

function clearSpaCommand(key) {
  if (!state.commands[key]) return;
  state.commands = Object.assign({}, state.commands);
  delete state.commands[key];
}

function spaFlowCapable() {
  return isSpa() && state.capability === "target-appointments" && state.spaBooking === "open";
}

function openSpaFlow(config) {
  if (!spaFlowCapable()) return false;
  clearSpaCommand("booking.confirm:" + F.spaBooking.ref);
  Object.keys(state.commands).forEach(function (key) {
    if (key.indexOf("booking.hold:") === 0) clearSpaCommand(key);
  });
  var flow = {
    entry: config.entry,
    step: "context",
    serviceCode: config.serviceCode || null,
    planRef: config.planRef || null,
    specialistRef: null,
    dayKey: F.spaBooking.days[0].key,
    slotRef: null,
    rescheduleOf: config.rescheduleOf || null,
    held: false,
  };
  if (config.entry === "reschedule" && config.rescheduleOf) state.spaCurrentAppointment = config.rescheduleOf;
  if (config.fromAppt) {
    state.spaCurrentAppointment = config.fromAppt;
    var source = state.config.dataMode === "live" ? currentAppointment() : F.spaCommerce.appointmentDetails[config.fromAppt];
    if (source) flow.serviceCode = state.config.dataMode === "live"
      ? ((state.moduleData.pricing && state.moduleData.pricing.rates || []).find(function (item) { return item.name === source.service; }) || {}).code || null
      : F.spaBooking.serviceForTitle[source.service] || null;
  }
  if (config.entry === "reschedule" && flow.rescheduleOf) {
    var appointment = state.config.dataMode === "live" ? currentAppointment() : F.spaCommerce.appointmentDetails[flow.rescheduleOf];
    if (appointment) flow.serviceCode = state.config.dataMode === "live"
      ? ((state.moduleData.pricing && state.moduleData.pricing.rates || []).find(function (item) { return item.name === appointment.service; }) || {}).code || null
      : F.spaBooking.serviceForTitle[appointment.service] || null;
    flow.step = "slots";
  }
  if (config.entry === "credit") flow.serviceCode = "svc-spa-03";
  state.spaFlow = flow;
  state.spaBookAck = false;
  state.spaHold = "held";
  state.drawer = "booking";
  state.mobileNav = false;
  state.accountMenu = false;
  render();
  return true;
}

function spaFlowAfterService(flow) {
  flow.step = (F.spaBooking.eligibleSpecialists[flow.serviceCode] || []).length ? "specialist" : "slots";
}

function spaHoldSlot(slotRef) {
  var flow = state.spaFlow;
  if (!flow || !slotRef || state.spaSlots !== "ready") return false;
  flow.slotRef = slotRef;
  if (spaCurrentApiDemoOpen()) {
    flow.held = true;
    flow.step = "review";
    state.spaHold = "held";
    render();
    return true;
  }
  return runSpaCommand("booking.hold:" + slotRef, function () {
    flow.held = true;
    flow.step = "review";
    state.spaHold = "held";
  }, { ms: 900 });
}

function spaSlotLabel() {
  var flow = state.spaFlow;
  if (!flow) return "";
  for (var index = 0; index < F.spaBooking.days.length; index += 1) {
    var day = F.spaBooking.days[index];
    var slot = (day.slots || []).find(function (item) { return item.ref === flow.slotRef; });
    if (slot) return day.label + " · " + slot.label;
  }
  var fallback = F.spaBooking.days.find(function (item) { return item.key === flow.dayKey; }) || F.spaBooking.days[0];
  return fallback.label;
}

function spaSlotIso(slotRef) {
  var match = String(slotRef || "").match(/^sl-(\d{2})(\d{2})-(\d{1,4})$/);
  if (!match) throw new Error("Selected appointment time is invalid");
  var month = Number(match[1]);
  var day = Number(match[2]);
  var compact = match[3].padStart(2, "0");
  var hour = compact.length <= 2 ? Number(compact) : Number(compact.slice(0, -2));
  var minute = compact.length <= 2 ? 0 : Number(compact.slice(-2));
  var year = Number(state.config.demoCalendarYear) || 2026;
  // Calm Harbor's accepted demo calendar is America/Chicago in summer (UTC-5).
  return new Date(Date.UTC(year, month - 1, day, hour + 5, minute)).toISOString();
}

function spaLiveCheckoutAmounts() {
  if (state.spaCheckoutSource === "plan") {
    var offer = spaPlanOffers().find(function (item) { return item.ref === state.spaPlanOffer; });
    if (offer && Number.isFinite(Number(offer.amount))) return { total: Number(offer.amount), taxes: 0 };
    if (offer && Number.isFinite(Number(offer.cents))) return { total: Number(offer.cents) / 100, taxes: 0 };
    var match = offer && String(offer.displayPrice || "").replace(/,/g, "").match(/\d+(?:\.\d+)?/);
    return { total: match ? Number(match[0]) : 0, taxes: 0 };
  }
  var subtotalCents = spaLines().reduce(function (sum, line) { return sum + Number(line.cents || 0) * Number(line.qty || 0); }, 0);
  var taxCents = Math.round(subtotalCents * 0.08);
  return { total: (subtotalCents + taxCents) / 100, taxes: taxCents / 100 };
}

function spaFlowResult() {
  var flow = state.spaFlow;
  var confirmations = F.spaCommerce.confirmations;
  var service = F.spa.pim.services.find(function (item) { return flow && item.code === flow.serviceCode; }) || null;
  var start = spaSlotLabel();
  var stamp = function (base, ref) {
    return Object.assign({}, base, { appointment: Object.assign({}, base.appointment, {
      ref: ref || base.appointment.ref,
      service: service ? service.name : base.appointment.service,
      start: start || base.appointment.start,
    }) });
  };
  if (flow.entry === "reschedule") return stamp(confirmations.reschedule, flow.rescheduleOf);
  if (flow.entry === "credit") return stamp(confirmations.credit, null);
  return stamp(confirmations[state.spaBookResult] || confirmations["appointment-only"], null);
}

function spaApptCancel(id) {
  return runSpaCommand("order.cancel:" + id, function () {
    state.spaCancelled = Object.assign({}, state.spaCancelled, { [id]: true });
  }, { toast: "Appointment cancelled — confirmed" });
}

function spaProfileChange(id) {
  var confirmed = spaProfileValues();
  var draft = state.spaProfileDraft || { phone: confirmed.phone, email: confirmed.email, prefs: Object.assign({}, confirmed.prefs) };
  state.spaProfileDraft = draft;
  var value = String(id || "");
  if (value.indexOf("pref:") === 0) {
    var key = value.slice(5);
    draft.prefs = Object.assign({}, draft.prefs, { [key]: !draft.prefs[key] });
    render();
    return true;
  }
  var separator = value.indexOf("|");
  if (separator === -1) return false;
  draft[value.slice(0, separator)] = value.slice(separator + 1);
  return true;
}

function spaProfileSave() {
  if (cmdPhase("profile.save:profile") === "conflict") return false;
  var draft = state.spaProfileDraft || spaProfileValues();
  var errors = {};
  if (draft.phone != null && ((draft.phone || "").replace(/\D/g, "")).length < 7) errors.phone = "Enter a valid phone number";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.email || "")) errors.email = "Enter a valid email address";
  if (Object.keys(errors).length) { setState({ spaProfileErrors: errors }); return false; }
  state.spaProfileErrors = null;
  if (spaCurrentApiDemoOpen()) {
    return runLiveSpaCommand("profile.save:profile", function () {
      return createCoreUserProfileAdapter().save({ email: draft.email }, spaLiveContext())
        .then(function (profile) { return reloadRuntimeModule("profile").then(function () { return profile; }); });
    }, function () {
      state.spaProfileDraft = null;
    }, { toast: "Profile email saved — confirmed by Core" });
  }
  return runSpaCommand("profile.save:profile", function () {
    state.spaProfile = { phone: draft.phone, email: draft.email, prefs: Object.assign({}, draft.prefs) };
    state.spaProfileDraft = null;
  }, { toast: "Profile saved — confirmed" });
}

function spaBuyAgain() {
  var purchase = currentPurchase();
  if (!purchase) return false;
  if (purchase.kind === "PACKAGE" || purchase.kind === "MEMBERSHIP") return spaCheckoutStart("plan");
  if (!spaRetailOpen()) return false;
  return runSpaCommand("purchase.buyAgain:" + purchase.ref, function () {
    purchase.lines.forEach(function (line) {
      var product = F.themes.Beauty.products.find(function (item) { return item.name === line.title; });
      if (product) spaAddLine(product.code);
    });
    state.route = "cart";
    writeRouteToLocation("cart");
  });
}

function retrySpaOrRuntime(id) {
  if (id === "cart-quote") { state.spaCartDemo = "as-added"; spaSetLines(spaLines()); render(); return true; }
  if (id === "checkout-quote") { setState({ spaCheckoutDemo: "ready" }); return true; }
  if (id === "booking-hold") { setState({ spaHold: "held" }); return true; }
  if (id === "slots") { setState({ spaSlots: "ready" }); return true; }
  if (id === "plan-offers") { setState({ spaOfferDemo: "sellable" }); return true; }
  if (id === "plan-credit") { setState({ spaCredit: "ok" }); return true; }
  if (id && state.commands[id]) {
    state.commands = Object.assign({}, state.commands);
    delete state.commands[id];
    render();
    return true;
  }
  return retryRuntimeLoad();
}

function careEntityScope(name, id, element, content) {
  if (name === "care.selectUnit") return content.units && content.units.find(function (item) { return item.id === id; });
  if (name === "care.download" || name === "care.openSecureDoc") {
    return content.docs && content.docs.find(function (item) { return item.id === id; });
  }
  if (name === "care.selectSpecialist") {
    return content.specialists && content.specialists.find(function (item) { return item.id === id; });
  }
  if (name === "care.completeTask") return content.tasks && content.tasks.find(function (item) { return item.id === id; });
  if (name === "care.contactProvider") return content.provider && content.provider.id === id ? content.provider : null;
  if (name === "care.requestRetreat") {
    var scope = content.guarantee && content.guarantee.scope;
    var propertyId = element && element.getAttribute("data-property-id");
    var serviceId = element && element.getAttribute("data-service-id");
    return scope && scope.planId === id && scope.propertyId === propertyId && scope.serviceId === serviceId ? scope : null;
  }
  return null;
}

export function authorizeCareCommand(name, id, element, expected) {
  var envelope = state.moduleData.care;
  var enabled = (state.config.enabledModules || []).includes("care");
  var authenticated = state.session && state.session.authenticated === true;
  var scoped = state.session && state.session.hasCustomerScope === true && state.session.hasTenantScope === true;
  var entitled = state.access && state.access.care && state.access.care.status === "granted";
  var fixtureReady = state.config.dataMode === "fixture"
    && envelope && envelope.id === "care" && envelope.phase === "payload"
    && envelope.state === "ready" && envelope.access && envelope.access.status === "granted"
    && envelope.content && Array.isArray(envelope.allowedActions);
  var currentVertical = fixtureReady && envelope.vertical === state.config.vertical && state.careStateVertical === state.config.vertical;
  var actionAllowed = fixtureReady && envelope.allowedActions.includes(name);
  var entity = fixtureReady ? careEntityScope(name, id, element, envelope.content) : null;
  var epoch = state.careAuthorizationEpoch || 0;
  var expectedCurrent = !expected || (expected.epoch === epoch && expected.vertical === state.config.vertical && expected.entityId === id);

  if (!enabled || !authenticated || !scoped || !entitled || !fixtureReady || !currentVertical || !expectedCurrent) {
    var authorizationError = new Error("Care command is not authorized for the current portal state");
    authorizationError.careAuthorizationFailure = true;
    throw authorizationError;
  }
  if (!entity) throw new Error("Care command target is invalid or no longer current");
  if (!actionAllowed) throw new Error("Care command is unavailable");
  return { envelope: envelope, content: envelope.content, entity: entity, epoch: epoch, vertical: state.config.vertical, entityId: id };
}

function clearGeneralCareCommandErrors() {
  for (const key of Object.keys(state.commandErrors || {})) {
    if (key.startsWith("care.") && key.endsWith(":_")) delete state.commandErrors[key];
  }
}

function runCareCommand(name, id, element, mutation) {
  try {
    var authorization = authorizeCareCommand(name, id, element);
    clearGeneralCareCommandErrors();
    delete state.commandErrors[commandKey(name, id)];
    mutation(authorization);
    render();
    return true;
  } catch (error) {
    return failCareMutation(name, id, error);
  }
}

function runUnavailableCareCommand(name, id, element) {
  return runCareCommand(name, id, element, function () {
    throw new Error("Care command is unavailable");
  });
}

export function selectCareUnit(id, element) {
  return runCareCommand("care.selectUnit", id, element, function () { state.careSelectedUnitId = id; });
}

export function selectCareSpecialist(id, element) {
  return runCareCommand("care.selectSpecialist", id, element, function () { state.careSelectedSpecialistId = id; });
}

export function toggleCareTask(id, element) {
  return runCareCommand("care.completeTask", id, element, function (authorization) {
    var task = authorization.entity;
    var current = Object.prototype.hasOwnProperty.call(state.careTasksDone, id) ? state.careTasksDone[id] : !!task.done;
    state.careTasksDone = Object.assign({}, state.careTasksDone, { [id]: !current });
  });
}

export function downloadCareDocument(id, element) {
  return runUnavailableCareCommand("care.download", id, element);
}

var careRetreatFlights = new Map();

export function resetCareActionFlights() {
  careRetreatFlights.clear();
}

function failCareMutation(name, id, error) {
  var key = commandKey(name, error && error.careAuthorizationFailure ? null : id);
  state.commandErrors[key] = error && error.message ? error.message : "Command failed";
  delete state.pending[key];
  render();
  toast(name + " failed");
  return false;
}

export function requestCareRetreat(id, element) {
  var name = "care.requestRetreat";
  var key = commandKey(name, id);
  var authorization;
  try {
    authorization = authorizeCareCommand(name, id, element);
    clearGeneralCareCommandErrors();
    if (state.careRetreatRequests[id] && state.careRetreatRequests[id].status === "submitted") {
      throw new Error("Care re-treatment request is already submitted");
    }
  } catch (error) {
    return Promise.resolve(failCareMutation(name, id, error));
  }
  if (careRetreatFlights.has(key)) return careRetreatFlights.get(key);

  delete state.commandErrors[key];
  state.pending[key] = true;
  state.careRetreatRequests = Object.assign({}, state.careRetreatRequests, {
    [id]: { planId: authorization.entity.planId, propertyId: authorization.entity.propertyId, serviceId: authorization.entity.serviceId, status: "submitting" }
  });
  render();

  var flight = Promise.resolve().then(function () {
    authorizeCareCommand(name, id, element, authorization);
    state.careRetreatRequests = Object.assign({}, state.careRetreatRequests, {
      [id]: { planId: authorization.entity.planId, propertyId: authorization.entity.propertyId, serviceId: authorization.entity.serviceId, status: "submitted" }
    });
    return state.careRetreatRequests[id];
  }).catch(function (error) {
    if (state.careAuthorizationEpoch === authorization.epoch) {
      var requests = Object.assign({}, state.careRetreatRequests);
      delete requests[id];
      state.careRetreatRequests = requests;
      delete state.pending[key];
      if (error && error.careAuthorizationFailure) delete state.commandErrors[key];
      else state.commandErrors[key] = error && error.message ? error.message : "Care re-treatment request failed";
    }
    return false;
  }).finally(function () {
    if (state.careAuthorizationEpoch === authorization.epoch) delete state.pending[key];
    careRetreatFlights.delete(key);
    render();
  });
  careRetreatFlights.set(key, flight);
  return flight;
}

export function setState(patch) { Object.assign(state, patch); render(); }

export function go(route) {
  var resolved = resolveRoute(route);
  state.route = resolved.id;
  state.mobileNav = false;
  state.accountMenu = false;
  if (state.drawer) {
    state.drawer = null;
    state.spaFlow = null;
    state.spaBookAck = false;
  }
  writeRouteToLocation(resolved.id);
  render();
}

export function openOrder(id) {
  if (!orderItems().some(function (order) { return order.id === id; })) throw new Error("Order not found");
  state.currentOrderId = id;
  state.view = "ready";
  go("order.detail");
}

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

export function removeCartItem(name) {
  if (!state.cartItems.some(function (x) { return x.name === name; })) throw new Error("Cart item not found");
  setCart(state.cartItems.filter(function (x) { return x.name !== name; }));
}

export function selectAddress(id) {
  if (!currentFixture().addresses.some(function (address) { return address.id === id; })) throw new Error("Address not found");
  setState({ addrId: id });
}

export function selectPayment(id) {
  if (!currentFixture().cards.some(function (card) { return card.id === id; })) throw new Error("Payment method not found");
  setState({ payId: id });
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

export function togglePref(key) {
  if (["receipts", "sms", "marketing"].indexOf(key) === -1) throw new Error("Preference not found");
  state.prefs = Object.assign({}, state.prefs, { });
  state.prefs[key] = !state.prefs[key];
  render();
  toast("Preference updated in fixture state");
}

export function calShift(delta) {
  var m = state.calMonth + delta, y = state.calYear;
  if (m < 0) { m = 11; y--; } else if (m > 11) { m = 0; y++; }
  setState({ calMonth: m, calYear: y });
}

export function feedAction(act) {
  if (act === "orders") { var o = state.orders.find(function (x) { return x.status === "inprogress"; }) || state.orders[0]; openOrder(o.id); }
  else if (act === "products") go("products");
  else if (act === "pricing") go("pricing");
  else if (act === "care") go("care");
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
  var key = id || "";
  var cal = F.stormCalendar(state.theme);
  if (!cal.days.some(function (day) { return day.needsAccess && day.dateSub === key; })) throw new Error("Access confirmation target not found");
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
  var total = state.cartItems.reduce(function (sum, item) { return sum + item.priceNum * item.qty; }, 0);
  var palette = F.PAL[0];
  var fixture = currentFixture();
  var order = {
    id: fixture.id === "calm-harbor-spa" ? "#CHS-R-" + String(200 + state.nextFixtureOrder++) : "FX-" + String(state.nextFixtureOrder++).padStart(3, "0"),
    status: "scheduled",
    name: first.name,
    date: "Jan 22",
    price: "$" + total.toLocaleString(),
    dot: palette[0],
    iconBg: palette[1],
    serviceName: first.name,
    y: 2026,
    m: 0,
    d: 22,
    slot: "10:00 AM",
    locationId: state.addrId,
    total: total,
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
  go("proposal.detail");
}

export function selectPlan(planId) {
  if (!planId) throw new Error("Plan is required");
  if (!proposalSites().some(function (p) { return p.id === state.currentSiteId; })) throw new Error("Proposal not found");
  if (["897", "898", "899"].indexOf(planId) === -1) throw new Error("Proposal plan not found");
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
  state.config.theme = slug;
  state.config.profile = profile.profile;
  state.config.defaultRoute = profile.defaultRoute;
  state.config.enabledModules = profile.modules.slice();
  state.config.caseId = "";
  state.theme = profile.displayName;
  state.orders = F.ordersFor(profile.displayName);
  state.filter = "all";
  state.drawer = null;
  state.spaFlow = null;
  state.spaBookAck = false;
  state.spaCurrentAppointment = null;
  state.spaPlanOffer = null;
  state.spaRescheduled = {};
  state.spaProfile = null;
  state.spaProfileDraft = null;
  state.spaProfileErrors = null;
  for (const moduleId of Object.keys(state.moduleData || {})) {
    if (moduleId !== "auth") delete state.moduleData[moduleId];
  }
  for (const moduleId of Object.keys(state.moduleStatus || {})) {
    if (moduleId !== "auth") delete state.moduleStatus[moduleId];
  }
  pickThemeResetCart();
  var resolved = resolveRoute(state.route);
  state.route = resolved.id;
  writeRouteToLocation(resolved.id);
  return reloadCareRuntime();
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

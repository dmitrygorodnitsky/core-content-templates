// customer-portal-design/src/actions.js — presentation runtime (auto-split from app.js). No business logic.
import { F } from "../data/fixtures.js";
import { cmdPhase, currentContact, currentPurchase, findProduct, isSpa, spaPlanSellOpen, spaProfileValues, spaRetailOpen, state } from "./state.js";
import { render } from "./app.js";
import { StatusBadge } from "./components/primitives/StatusBadge.js";

export var ACTIONS = {
  "nav.go":            function (id) { go(id); },
  "nav.landing":       function ()   { go("landing"); },
  /* wave 11 — honest public navigation for the SEO landing (Calm Harbor
     release): scroll to live sections / open the existing public Shop
     route. No booking, payment or checkout command is ever dispatched
     from the public landing. */
  "nav.services":      function ()   { seoScrollTo("seo-services"); },
  "nav.pricing":       function ()   { seoScrollTo("seo-pricing"); },
  "nav.products":      function ()   { go("products"); },
  "auth.gotoSignin":   function ()   { state.authError = null; state.code = ""; go("auth.oidc"); }, /* wave 10: → Core OIDC login */
  "auth.sendCode":     function ()   { validatePhone(); },
  "auth.verifyCode":   function ()   { validateCode(); },
  "auth.back":         function ()   { state.authError = null; go("auth.phone"); },
  "auth.resend":       function ()   { toast("New code sent"); },
  "auth.apple":        function ()   { signIn(); }, /* reference only — auth.phone/auth.code fixture flow (superseded by auth.oidc) */
  /* wave 10 — Core OIDC login (route auth.oidc). DEMO bodies only: Codex replaces
     auth.oidcSignIn with the real authorization-code+PKCE redirect (the browser
     actually leaves for Core, so 'redirecting' persists until unload),
     auth.retrySession with real discovery / library re-init, and auth.signOut
     with the real Core logout. Only session status + one customer-safe display
     name ever reach this presentation layer. */
  "auth.oidcSignIn":   function ()   { if (state.account === "session-expired") { reauthDemo(); return; } oidcSignIn(); }, /* wave 13: from the expired-session gate, sign-in preserves the intended route (in production the Core return URL carries it) */
  "auth.retrySession": function ()   { oidcRetry(); },
  "order.open":        function (id) { openOrder(id); },
  "order.back":        function ()   { go("orders.list"); },
  "order.cancel":      function (id) {
    /* wave 14 — on the Calm Harbor target portal the SAME stable action cancels an
       appointment (wave 16: preserved ALIAS of appointment.cancel — both share one
       command key, so the lifecycle is identical wherever it renders) */
    if (isSpa() && state.capability === "target-appointments") { spaApptCancel(id); return; }
    runCommand("order.cancel:" + id, { onReadback: function () { cancelOrder(id); }, successToast: "Visit " + id + " cancelled \u2014 confirmed" });
  },
  "order.reschedule":  function (id)   { if (spaFlowCapable()) { openSpaFlow({ entry: "reschedule", rescheduleOf: id }); return; } openDrawer("booking"); }, /* wave 16: preserved ALIAS of appointment.reschedule on the spa target */
  "order.downloadInvoice": function () { toast("Invoice downloaded"); },
  "order.bookAgain":   function (id)   { if (spaFlowCapable()) { openSpaFlow({ entry: "book-again", fromAppt: id }); return; } openDrawer("booking"); }, /* wave 16: preserved ALIAS of appointment.bookAgain on the spa target */
  "order.filter":      function (id) { setState({ filter: id }); },
  "compliance.unlock": function ()   { toast("Compliance Reports is a Pro add-on \u2014 ask your account manager"); },
  /* care hub — payload contracts: selectUnit receives unit.id, download receives
     document.id, requestRetreat receives plan.planId (+ data-property-id /
     data-service-id on the element). DEMO bodies — Codex owns the real calls. */
  "care.selectUnit":   function (id) { setState({ careUnit: id }); },
  "care.download":     function (id) { toast("Download queued \u00b7 " + (id || "document")); },
  "care.requestRetreat": function (id) {
    state.careRetreat = "requesting";
    runCommand("care.requestRetreat:" + (id || "plan"), {
      onReadback: function () { state.careRetreat = "used"; render(); toast("Re-treat scheduled \u2014 your technician confirms the window"); },
      onFail: function () { state.careRetreat = "available"; },
      onSessionLost: function () { state.careRetreat = "available"; }
    });
  },
  /* wave 9 care hubs (Health, Beauty) — payload contracts: selectSpecialist
     receives specialist.id, completeTask receives task.id, contactProvider
     receives provider.id, openSecureDoc receives document.id. DEMO bodies —
     Codex owns the real commands (and, for secure docs, the audited viewer). */
  "care.selectSpecialist": function (id) { setState({ careSpecialist: id }); toast("Preferred specialist updated"); },
  "care.completeTask": function (id) { toggleCareTask(id); },
  "care.contactProvider": function (id) { go("support"); toast("Secure message \u2014 your care team replies within one business day"); },
  "care.openSecureDoc": function (id) { toast("Opening in the secure viewer \u2014 access is logged"); },
  /* public SEO landing (route seo.landing) — FIXED action ids.
     CTA lifecycle idle→pending→success|error is DEMO here (ctaDemo);
     Codex replaces the body with the real command, keeping the id and
     the data-state contract. Primary destination = cms.meta.primaryCta.destination. */
  "seo.cta.book":      function (id, el) { ctaDemo("seo.cta.book", function () { openDrawer("booking"); }); },
  "seo.cta.quote":     function (id, el) { ctaDemo("seo.cta.quote", function () { openDrawer("booking"); }); },
  "seo.cta.call":      function ()   { toast("Calling — phone number comes from the CMS"); },
  "seo.cta.services":  function ()   { seoScrollToServices(); },
  "seo.service.select": function (id) { openDrawer("booking"); toast((id || "Service") + " — booking flow"); },
  "seo.faq.toggle":    function (id) { setState({ seoFaqOpen: state.seoFaqOpen === Number(id) ? null : Number(id) }); },
  "booking.open":      function (id) { if (spaFlowCapable()) { openSpaFlow(id ? { entry: "service", serviceCode: id } : { entry: "empty" }); return; } openDrawer("booking"); },
  "booking.close":     function ()   { state.spaFlow = null; state.spaBookAck = false; closeDrawer(); }, /* wave 13: closing is not confirming */
  /* ============ wave 16 — booking flow steps (spa target) ============
     Every step renders SERVER-returned options only; the hold and the
     confirmation are entity-scoped commands whose success renders ONLY
     from the (demo) authoritative readback. */
  "booking.selectService": function (id) { var f = state.spaFlow; if (!f) return; f.serviceCode = id; f.specialistRef = null; f.slotRef = null; f.held = false; spaFlowAfterService(f); render(); },
  "booking.selectSpecialist": function (id) { var f = state.spaFlow; if (!f) return; f.specialistRef = id === "any" ? null : id; f.step = "slots"; render(); },
  "booking.selectSlot": function (id) { var f = state.spaFlow; if (!f) return; if (String(id).indexOf("day:") === 0) { f.dayKey = String(id).slice(4); f.slotRef = null; } else { f.slotRef = id; var d = F.spaBooking.days.find(function (dd) { return (dd.slots || []).some(function (s) { return s.ref === id; }); }); if (d) f.dayKey = d.key; } render(); },
  "booking.hold":      function (id) { spaHoldSlot(id); },
  "booking.retry":     function (id) { var f = state.spaFlow; if (!f) return; if (id === "hold") { clearCommand("booking.hold:" + f.slotRef); spaHoldSlot(f.slotRef); } else { clearCommand("booking.confirm:" + F.spaBooking.ref); spaBookingConfirm(); } },
  "booking.back":      function ()   { var f = state.spaFlow; if (!f) return; if (f.step === "review") { f.held = false; f.step = "slots"; } else if (f.step === "slots") { f.step = (F.spaBooking.eligibleSpecialists[f.serviceCode] || []).length ? "specialist" : "context"; } else { f.step = "context"; } render(); },
  "booking.ackPolicy": function ()   { setState({ spaBookAck: !state.spaBookAck }); },
  "booking.confirm":   function ()   { if (isSpa() && state.capability === "target-appointments") { spaBookingConfirm(); return; } runCommand("booking.confirm:booking", { onReadback: function () { closeDrawer(); toast("Booking confirmed \u2014 it\u2019s on your calendar"); } }); },
  /* ============ wave 16 — appointment detail (customer-owned) ============ */
  "appointment.open":  function (id) { state.spaCurrentAppointment = id; state.view = "ready"; go("appointment.detail"); },
  "appointment.openPurchase": function (id) { ACTIONS["purchase.open"](id); },
  "appointment.reschedule": function (id) { openSpaFlow({ entry: "reschedule", rescheduleOf: id }); },
  "appointment.cancel": function (id) { spaApptCancel(id); },
  "appointment.bookAgain": function (id) { openSpaFlow({ entry: "book-again", fromAppt: id }); },
  "proposal.review":   function ()   { go("proposals.list"); },
  "proposal.open":     function (id) { openProposal(id); },
  "proposal.selectPlan": function (id) { selectPlan(id); },
  /* wave 13 — decisions are entity-scoped commands on the open site; success renders
     only from the (demo) readback, conflict prompts a refresh instead of success */
  "proposal.approve":  function ()   { decideCmd("approved"); },
  "proposal.requestRevision": function () { decideCmd("revision"); },
  "proposal.decline":  function ()   { decideCmd("declined"); },
  "weather.confirm":   function (id) { confirmWeather(id, "confirmed"); },
  "weather.decline":   function (id) { confirmWeather(id, "declined"); },
  "membership.activate": function () { toast("Membership activated \u00b7 $9/mo"); },
  /* wave 14.1 — Calm Harbor has NO approved support destination and no opened
     customer support-thread source: every visible support action ends at the
     honest support-unavailable notice. Fixture chat/help content is never
     reachable through spa navigation, and no toast pretends a message,
     email or call started. */
  "support.open":      function ()   { if (isSpa()) { setState({ spaSupport: true, accountMenu: false, mobileNav: false }); return; } go("support"); },
  "support.sendMessage": function (id, el) { sendChat(); },
  "support.retryMessage": function (id) { sendMessageAt(Number(String(id || "").replace("m", ""))); }, /* wave 13: explicit retry of one failed message */
  "support.quickReply": function (id) { pushChat(id); },
  "support.helpTopic": function (id) { go("support"); pushChat(id); },
  "support.call":      function ()   { if (isSpa()) { setState({ spaSupport: true, accountMenu: false, mobileNav: false }); return; } toast("Calling support \u2014 average wait under 2 min"); },
  "support.email":     function ()   { if (isSpa()) { setState({ spaSupport: true, accountMenu: false, mobileNav: false }); return; } toast("Opening email to support"); },
  "support.dismiss":   function ()   { setState({ spaSupport: false }); },
  "cart.open":         function ()   { if (spaRetailOpen()) { go("cart"); return; } go("checkout"); },
  "service.request":   function ()   { openDrawer("booking"); },
  "service.requestExtra": function () { openDrawer("booking"); },
  "service.reportIssue": function (id) { toast("Issue reported \u2014 we\u2019ll follow up"); },
  "access.confirm":    function (id) { toast("Access confirmed for " + (id || "the next visit")); },
  "access.update":     function ()   { toast("Update access & gate notes"); },
  /* wave 13 — cart mutations + checkout are commands: entity-scoped pending, no local success */
  "cart.addItem":      function (id) {
    /* wave 15 — on the spa (retail-commerce-open) the SAME stable id adds to the
       SERVER cart: the readback is a complete recalculated cart, never local math */
    if (isSpa()) {
      if (!spaRetailOpen()) return;
      runCommand("cart.addItem:" + id, { ms: 600, onReadback: function () { spaAddLine(id); render(); toast("Added to your bag — not reserved yet"); } });
      return;
    }
    runCommand("cart.addItem:" + id, { ms: 500, onReadback: function () { addToCart(id); } });
  },
  "cart.removeItem":   function (id) {
    if (isSpa()) { spaCartCmd("cart.removeItem:" + id, function () { spaSetLines(spaLines().filter(function (l) { return l.ref !== id; })); }); return; }
    runCommand("cart.mutate:" + id, { ms: 420, onReadback: function () { setCart(state.cartItems.filter(function (x) { return x.name !== id; })); } });
  },
  /* wave 15 — stable quantity command: data-id = "<lineRef>|<newQty>" (the target
     quantity, server-style). qty 0 removes the line. */
  "cart.changeQuantity": function (id) {
    var parts = String(id || "").split("|");
    var ref = parts[0], qty = Math.max(0, Number(parts[1] || 0));
    spaCartCmd("cart.changeQuantity:" + ref, function () {
      var lines = qty === 0
        ? spaLines().filter(function (l) { return l.ref !== ref; })
        : spaLines().map(function (l) { return l.ref === ref ? Object.assign({}, l, { qty: qty }) : l; });
      spaSetLines(lines);
      if (state.spaCartDemo === "inventory-conflict" && qty <= 1) state.spaCartDemo = "as-added";
    });
  },
  "cart.inc":          function (id) { runCommand("cart.mutate:" + id, { ms: 420, onReadback: function () { changeQty(id, 1); } }); },
  "cart.dec":          function (id) { runCommand("cart.mutate:" + id, { ms: 420, onReadback: function () { changeQty(id, -1); } }); },
  "checkout.placeOrder": function () { runCommand("checkout.placeOrder:cart", { ms: 1400, onReadback: function () { setCart([]); go("orders.list"); toast("Order confirmed \u2014 it\u2019s in your orders now"); } }); },
  /* ============ wave 15 — Calm Harbor commercial lifecycle ============ */
  "account.open":          function () { go("account"); },
  "account.openPurchases": function () { state.spaPurchFilter = "all"; go("purchases.list"); },
  "account.openPlan":      function () { go("plan"); },
  "account.openProfile":   function () { go("profile"); },
  "purchases.filter":      function (id) { setState({ spaPurchFilter: id }); },
  "purchases.more":        function () { spaLoadMore(); },
  "purchase.open":         function (id) { state.spaCurrentPurchase = id; state.view = "ready"; go("purchase.detail"); },
  "purchase.openAppointment": function (id) { go("orders.list"); },
  "purchase.cancelRequest": function (id) {
    runCommand("purchase.cancelRequest:" + id, { onReadback: function () {
      state.spaCancelReqs = Object.assign({}, state.spaCancelReqs); state.spaCancelReqs[id] = "accepted-for-review"; render();
      toast("Cancellation requested — the studio will confirm");
    } });
  },
  "purchase.returnRequest": function (id) {
    runCommand("purchase.returnRequest:" + id, { onReadback: function () {
      state.spaReturns = Object.assign({}, state.spaReturns); state.spaReturns[id] = "accepted-for-review"; render();
      toast("Return request received — accepted for review");
    } });
  },
  "purchase.buyAgain":     function (id) {
    var d = currentPurchase();
    if (d && (d.kind === "PACKAGE" || d.kind === "MEMBERSHIP")) { ACTIONS["checkout.start"]("plan"); return; }
    if (!spaRetailOpen()) return;
    runCommand("purchase.buyAgain:" + id, { ms: 700, onReadback: function () {
      (d ? d.lines : []).forEach(function (l) {
        var p = F.themes["Beauty"].products.find(function (x) { return x.name === l.title; });
        if (p) spaAddLine(p.code);
      });
      go("cart"); toast("Items are in your bag — prices re-checked by the store");
    } });
  },
  "plan.bookWithCredit":   function (id) { if (spaFlowCapable()) { openSpaFlow({ entry: "credit", planRef: id }); return; } openDrawer("booking"); },
  /* wave 16 — published-offer purchase entry: only while the sellable plan
     contract is open AND the offer's server sellability allows it */
  "plan.purchase":         function (id) {
    if (!spaPlanSellOpen() || state.spaOfferDemo !== "sellable") return;
    state.spaPlanOffer = id;
    ACTIONS["checkout.start"]("plan");
  },
  "plan.cancelRenewal":    function (id) {
    runCommand("plan.cancelRenewal:" + id, { onReadback: function () {
      state.spaPlanCancelled = Object.assign({}, state.spaPlanCancelled); state.spaPlanCancelled[id] = true; render();
      toast("Renewal cancelled — confirmed. Benefits run to the period end.");
    } });
  },
  "shop.pickVariant":      function (id) {
    var parts = String(id || "").split("|");
    state.spaVariantPick = Object.assign({}, state.spaVariantPick);
    state.spaVariantPick[parts[0]] = parts[1];
    render();
  },
  "checkout.start":        function (id) {
    if (id !== "plan" && (state.spaCartDemo === "stale-price" || state.spaCartDemo === "inventory-conflict")) return;
    if (id === "plan" && !state.spaPlanOffer) state.spaPlanOffer = "off-pkg-4c21"; /* wave 16: default published offer for legacy entries */
    clearCommand("checkout.confirm:" + F.spaCommerce.checkout.ref);
    setState({ spaCheckoutSource: id === "plan" ? "plan" : "cart", spaResult: null, spaPolicyAck: false, spaCheckoutDemo: "ready", route: "checkout", mobileNav: false, accountMenu: false });
  },
  "checkout.selectFulfillment": function (id) { render(); /* single allowed option in this increment — selection readback is a demo no-op */ },
  "checkout.ackPolicy":    function () { setState({ spaPolicyAck: !state.spaPolicyAck }); },
  "checkout.confirm":      function (id) { spaConfirmCheckout(); },
  "checkout.retryConfirm": function (id) { spaConfirmCheckout(); },
  "checkout.pickAddress": function (id) { setState({ addrId: id }); },
  "checkout.pickPayment": function (id) { setState({ payId: id }); },
  "products.filter":   function (id) { setState({ prodCat: id }); },
  "activity.open":     function ()   { go("activity"); },
  "activity.markRead": function ()   { toast("All caught up"); },
  "activity.filter":   function (id) { setState({ feedFilter: id }); },
  "activity.act":      function (id) { feedAction(id); },
  "profile.open":      function ()   { go("profile"); },
  "profile.filter":    function (id) { setState({ profileFilter: id }); },
  "profile.setDefaultAddress": function (id) { setState({ addrId: id }); },
  "profile.setDefaultPayment": function (id) { setState({ payId: id }); },
  "profile.addAddress": function ()  { toast("Add a new address"); },
  "profile.addCard":   function ()   { toast("Add a new card"); },
  "profile.updateAddress": function () { toast("Edit address"); },
  "profile.togglePref": function (id) { togglePref(id); },
  "profile.saveContact": function () { saveContact(); }, /* wave 13; wave 16 — preserved ALIAS: on the Calm Harbor profile the save command is profile.save (this id keeps its legacy generic-panel meaning) */
  /* wave 16 — Calm Harbor least-data Profile (scoped API) */
  "profile.edit":       function () { var v = spaProfileValues(); state.spaProfileDraft = { phone: v.phone, email: v.email, prefs: Object.assign({}, v.prefs) }; state.spaProfileErrors = null; render(); },
  "profile.changeField": function (id) { spaProfileChange(id); },
  "profile.save":       function () { spaProfileSave(); },
  "profile.reload":     function () { clearCommand("profile.save:profile"); state.spaProfileDraft = null; state.spaProfileErrors = null; render(); toast("Profile reloaded \u2014 showing the details on file"); },
  "profile.managePlan": function ()  { go("pricing"); },
  "auth.signOut":      function ()   { oidcSignOut(); },
  "calendar.open":     function ()   { go("calendar"); },
  "calendar.prev":     function ()   { calShift(-1); },
  "calendar.next":     function ()   { calShift(1); },
  "ui.retry":          function (id) {
    /* wave 13 — existing action, now scoped by module/entity id:
       account-bootstrap retries account resolution; a command key clears that
       command's failed/conflict state; otherwise the route reloads to ready. */
    if (id === "account-bootstrap") { accountRetry(); return; }
    /* wave 15 — explicit quote reloads: the readback replaces the stale model
       with a freshly recalculated one, never a local fix-up */
    if (id === "cart-quote") { state.spaCartDemo = "as-added"; spaSetLines(spaLines()); toast("Bag refreshed — current prices shown"); return; }
    if (id === "checkout-quote") { setState({ spaCheckoutDemo: "ready" }); toast("Quote reloaded — review before confirming"); return; }
    if (id === "booking-hold") { setState({ spaHold: "held" }); toast("New time held — review and confirm"); return; }
    /* wave 16 — explicit reloads for slots, published offers and plan credit */
    if (id === "slots") { setState({ spaSlots: "ready" }); toast("Times reloaded — current availability shown"); return; }
    if (id === "plan-offers") { setState({ spaOfferDemo: "sellable" }); toast("Offers reloaded — current price and terms shown"); return; }
    if (id === "plan-credit") { setState({ spaCredit: "ok" }); toast("Plan balance reloaded"); return; }
    if (id && state.commands[id]) { clearCommand(id); render(); return; }
    setState({ view: "ready" });
  },
  "ui.toggleMode":     function ()   { setState({ mode: state.mode === "Dark" ? "Light" : "Dark" }); },
  "ui.toggleMobileNav":function ()   { setState({ mobileNav: !state.mobileNav, accountMenu: false }); },
  "account.menu":      function ()   { setState({ accountMenu: !state.accountMenu, mobileNav: false }); }, /* wave 14 — spa account/session menu (identity + sign-out only) */
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
    else console.warn("[aircove] no handler for action:", name);
  });
}

export function setState(patch) { Object.assign(state, patch); render(); }

export function go(route) { state.route = route; state.mobileNav = false; state.accountMenu = false; if (state.drawer) { state.drawer = null; state.spaFlow = null; state.spaBookAck = false; } render(); } /* wave 16: navigating closes any open drawer/flow — navigation never confirms anything */

export function openOrder(id) { state.currentOrderId = id; state.route = "order.detail"; state.view = "ready"; state.mobileNav = false; render(); }

export function cancelOrder(id) {
  /* wave 13: applied only from the command readback — the toast comes from the engine */
  state.orders = state.orders.map(function (o) { return o.id === id ? Object.assign({}, o, { status: "cancelled" }) : o; });
  render();
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

export function signIn() { state.authError = null; state.code = ""; go("orders.list"); toast("Signed in \u2014 welcome to Aircove"); }

export function validatePhone() {
  var digits = (state.phone || "").replace(/\D/g, "");
  if (digits.length < 6) { setState({ authError: "Enter a valid phone number" }); return; }
  state.authError = null; state.code = ""; go("auth.code");
}

export function validateCode() {
  if ((state.code || "").length < 4) { setState({ authError: "Enter all 4 digits" }); return; }
  signIn();
}

/* ---- wave 10: Core OIDC demo transitions (DEMO ONLY — see ACTIONS comment) ---- */
var oidcTimer;

export function oidcSignIn() {
  if (state.oidc === "redirecting" || state.oidc === "signing-out") return;
  clearTimeout(oidcTimer);
  setState({ oidc: "redirecting" });
  /* demo stand-in for the redirect round-trip; in production the page unloads here */
  oidcTimer = setTimeout(function () {
    setState({ oidc: "ready-signed-in", sessionName: F.customer.firstName });
    toast("Signed in \u2014 welcome back");
  }, 1600);
}

export function oidcRetry() {
  clearTimeout(oidcTimer);
  setState({ oidc: "ready-signed-out" });
  toast("Secure sign-in is back \u2014 try again");
}

export function oidcSignOut() {
  clearTimeout(oidcTimer);
  state.route = "auth.oidc";
  state.account = "ready"; /* wave 13: leaving the portal clears bootstrap + command state */
  state.commands = {};
  state.accountMenu = false; state.mobileNav = false; state.spaSupport = false; /* wave 14: nothing session-scoped survives sign-out */
  setState({ oidc: "signing-out" });
  oidcTimer = setTimeout(function () {
    setState({ oidc: "ready-signed-out", sessionName: null });
    toast("Signed out");
  }, 1400);
}

export function togglePref(key) { state.prefs = Object.assign({}, state.prefs, { }); state.prefs[key] = !state.prefs[key]; render(); }

/* =========================================================
   Wave 13 — command lifecycle engine (DEMO ONLY)
   state.commands["<action>:<entityId>"] = pending | failed | conflict.
   "succeeded" is never stored: success may render ONLY from the readback
   callback — here a fixture stand-in for the authoritative entity the server
   returns. Codex replaces the timer with the real command dispatch: pending
   until the server answers, failed/conflict from the server result,
   session-lost when the request loses its session (→ the expired-session
   gate, with the intended route preserved in state.route).
   The dev-toolbar "cmd" select (state.cmdForce) forces any outcome.
   ========================================================= */
var cmdTimers = {};

export function runCommand(key, opts) {
  opts = opts || {};
  if ((state.commands[key] || "idle") === "pending") return; /* duplicate submission disabled */
  clearTimeout(cmdTimers[key]);
  state.commands = Object.assign({}, state.commands); state.commands[key] = "pending";
  render();
  cmdTimers[key] = setTimeout(function () {
    var outcome = state.cmdForce || "succeeded";
    state.commands = Object.assign({}, state.commands);
    if (outcome === "session-lost") {
      delete state.commands[key];            /* clear pending, suppress success */
      if (opts.onSessionLost) opts.onSessionLost();
      state.drawer = null;                   /* nothing modal survives a lost session */
      state.account = "session-expired";     /* intended route stays in state.route */
      render();
      return;
    }
    if (outcome === "succeeded") {
      delete state.commands[key];
      if (opts.onReadback) opts.onReadback(); else render();
      if (opts.successToast) toast(opts.successToast);
      return;
    }
    state.commands[key] = outcome;           /* failed | conflict — no success claimed */
    if (opts.onFail) opts.onFail(outcome);
    render();
  }, opts.ms || 1100);
}

export function clearCommand(key) {
  if (state.commands[key]) { state.commands = Object.assign({}, state.commands); delete state.commands[key]; }
}

/* =========================================================
   Wave 15 — Calm Harbor commerce demo helpers (DEMO ONLY).
   The "server" here is F.spaServerCart / the confirmation fixtures — stand-ins
   for authoritative /portal/v1 responses. Presentation renders their display
   strings verbatim; success is only ever written from these readbacks.
   ========================================================= */
export function spaLines() { return (state.spaCart && state.spaCart.lines) || []; }

export function spaSetLines(lines) { state.spaCart = F.spaServerCart(lines); render(); }

export function spaAddLine(code) {
  var r = F.spaCommerce.retail.products.find(function (p) { return p.code === code; });
  var pim = F.themes["Beauty"].products.find(function (p) { return p.code === code; });
  if (!r || !pim) return;
  var pick = r.variants ? r.variants.find(function (v) { return v.ref === state.spaVariantPick[code]; }) : null;
  if (r.variants && !pick) return;
  var lineRef = "cln-" + code.replace("rtl-beauty-", "") + (pick ? "-" + pick.ref.split("-").pop() : "");
  var lines = spaLines().slice();
  var existing = lines.find(function (l) { return l.ref === lineRef; });
  if (existing) lines = lines.map(function (l) { return l.ref === lineRef ? Object.assign({}, l, { qty: l.qty + 1 }) : l; });
  else lines.push({ ref: lineRef, code: code, variantRef: pick ? pick.ref : null, title: pim.name, variant: pick ? pick.label : null, qty: 1, cents: pick ? pick.cents : r.cents });
  state.spaCart = F.spaServerCart(lines);
}

export function spaCartCmd(key, apply) {
  runCommand(key, { ms: 520, onReadback: function () { apply(); render(); } });
}

var purchMoreTimer;
export function spaLoadMore() {
  if (state.spaPurchMore !== "idle") return;
  setState({ spaPurchMore: "loading" });
  clearTimeout(purchMoreTimer);
  purchMoreTimer = setTimeout(function () { setState({ spaPurchMore: "loaded" }); }, 1000);
}

export function spaConfirmCheckout() {
  if (state.spaCheckoutDemo !== "ready" || !state.spaPolicyAck) return;
  var key = "checkout.confirm:" + F.spaCommerce.checkout.ref;
  runCommand(key, { ms: 1500, onReadback: function () {
    if (state.spaCheckoutSource === "plan") {
      /* wave 16 — the enrollment readback matches the purchased offer's kind */
      var offer = F.spaCommerce.planOffers.find(function (o) { return o.ref === state.spaPlanOffer; });
      state.spaResult = offer && offer.kind === "MEMBERSHIP" ? F.spaCommerce.confirmations.membership : F.spaCommerce.confirmations.plan;
    } else {
      state.spaResult = F.spaCommerce.confirmations.retail;
    }
    if (state.spaCheckoutSource === "cart") { state.spaCart = F.spaServerCart([]); state.spaCartDemo = "as-added"; }
    render();
  } });
}

export function spaBookingConfirm() {
  /* blocked while the hold expired or the price changed — the drawer shows the
     blocking state; confirm readback may create an Appointment only, or an
     Appointment plus Order (state.spaBookResult picks the demo response shape).
     Wave 16: with a flow open, confirm additionally requires the policy
     acknowledgement and (for credit bookings) a usable plan credit; the
     reschedule readback is the ONLY place the original visit is released. */
  if (state.spaHold !== "held") return;
  var f = state.spaFlow;
  if (f) {
    if (!f.held || !state.spaBookAck) return;
    if (f.entry === "credit" && state.spaCredit !== "ok") return;
    runCommand("booking.confirm:" + F.spaBooking.ref, { ms: 1300, onReadback: function () {
      state.spaResult = spaFlowResult();
      if (f.entry === "reschedule" && f.rescheduleOf) {
        state.spaRescheduled = Object.assign({}, state.spaRescheduled);
        state.spaRescheduled[f.rescheduleOf] = { start: spaSlotLabel() };
      }
      state.drawer = null; state.spaFlow = null; state.spaBookAck = false; state.route = "checkout"; render();
    } });
    return;
  }
  runCommand("booking.confirm:booking", { ms: 1300, onReadback: function () {
    state.spaResult = F.spaCommerce.confirmations[state.spaBookResult] || F.spaCommerce.confirmations["appointment-only"];
    state.drawer = null; state.route = "checkout"; render();
  } });
}

/* =========================================================
   Wave 16 — booking flow engine + appointment/profile commands
   (DEMO ONLY — Codex owns the real slot source, hold, confirm,
   cancellation and profile save; success renders only from the
   authoritative readback).
   ========================================================= */
export function spaFlowCapable() { return isSpa() && state.capability === "target-appointments"; }

export function openSpaFlow(cfg) {
  clearCommand("booking.confirm:" + F.spaBooking.ref);
  Object.keys(state.commands).forEach(function (k) { if (k.indexOf("booking.hold:") === 0) clearCommand(k); });
  var f = { entry: cfg.entry, step: "context", serviceCode: cfg.serviceCode || null, planRef: cfg.planRef || null,
            specialistRef: null, dayKey: F.spaBooking.days[0].key, slotRef: null, rescheduleOf: cfg.rescheduleOf || null, held: false };
  if (cfg.fromAppt) { var a = F.spaCommerce.appointmentDetails[cfg.fromAppt]; if (a) f.serviceCode = F.spaBooking.serviceForTitle[a.service] || null; }
  if (cfg.entry === "reschedule" && f.rescheduleOf) {
    var r = F.spaCommerce.appointmentDetails[f.rescheduleOf];
    if (r) f.serviceCode = F.spaBooking.serviceForTitle[r.service] || null;
    f.step = "slots"; /* a reschedule changes the TIME of the identified visit — service/specialist context is fixed */
  }
  if (cfg.entry === "credit") f.serviceCode = "svc-spa-03"; /* the package's service — server-provided context */
  state.spaFlow = f; state.spaBookAck = false; state.spaHold = "held";
  state.drawer = "booking"; state.mobileNav = false; state.accountMenu = false;
  render();
}

export function spaFlowAfterService(f) {
  f.step = (F.spaBooking.eligibleSpecialists[f.serviceCode] || []).length ? "specialist" : "slots";
}

export function spaHoldSlot(slotRef) {
  var f = state.spaFlow;
  if (!f || !slotRef) return;
  f.slotRef = slotRef;
  runCommand("booking.hold:" + slotRef, { ms: 900, onReadback: function () {
    f.held = true; f.step = "review"; state.spaHold = "held"; render();
  } });
}

export function spaSlotLabel() {
  var f = state.spaFlow; if (!f) return "";
  for (var i = 0; i < F.spaBooking.days.length; i++) {
    var d = F.spaBooking.days[i];
    var s = (d.slots || []).find(function (x) { return x.ref === f.slotRef; });
    if (s) return d.label + " \u00b7 " + s.label;
  }
  return (F.spaBooking.days.find(function (d2) { return d2.key === f.dayKey; }) || F.spaBooking.days[0]).label;
}

function spaFlowService() {
  var f = state.spaFlow;
  return F.spa.pim.services.find(function (s) { return f && s.code === f.serviceCode; }) || null;
}

function spaFlowResult() {
  var f = state.spaFlow, C = F.spaCommerce.confirmations;
  var svc = spaFlowService(), start = spaSlotLabel();
  var stamp = function (base, ref) {
    return Object.assign({}, base, { appointment: Object.assign({}, base.appointment, {
      ref: ref || base.appointment.ref,
      service: svc ? svc.name : base.appointment.service,
      start: start || base.appointment.start
    }) });
  };
  if (f.entry === "reschedule") return stamp(C.reschedule, f.rescheduleOf);
  if (f.entry === "credit") return stamp(C.credit, null);
  return stamp(C[state.spaBookResult] || C["appointment-only"], null);
}

/* appointment cancellation — shared body for appointment.cancel and its
   preserved alias order.cancel (ONE command key = one lifecycle) */
export function spaApptCancel(id) {
  runCommand("order.cancel:" + id, {
    onReadback: function () { state.spaCancelled = Object.assign({}, state.spaCancelled); state.spaCancelled[id] = true; render(); },
    successToast: "Appointment cancelled \u2014 confirmed"
  });
}

/* Calm Harbor profile: draft edit → validation → saving → confirmed readback;
   conflict requires an explicit profile.reload before further edits */
export function spaProfileChange(id) {
  var v = spaProfileValues();
  var d = state.spaProfileDraft || { phone: v.phone, email: v.email, prefs: Object.assign({}, v.prefs) };
  state.spaProfileDraft = d;
  var s = String(id || "");
  if (s.indexOf("pref:") === 0) { var k = s.slice(5); d.prefs = Object.assign({}, d.prefs); d.prefs[k] = !d.prefs[k]; render(); return; }
  var i = s.indexOf("|");
  if (i === -1) return;
  d[s.slice(0, i)] = s.slice(i + 1); /* text-input hook — no re-render (focus preserved) */
}

export function spaProfileSave() {
  if (cmdPhase("profile.save:profile") === "conflict") return; /* reload required first */
  var d = state.spaProfileDraft || spaProfileValues();
  var errs = {};
  if (((d.phone || "").replace(/\D/g, "")).length < 7) errs.phone = "Enter a valid phone number";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email || "")) errs.email = "Enter a valid email address";
  if (Object.keys(errs).length) { setState({ spaProfileErrors: errs }); return; }
  state.spaProfileErrors = null;
  runCommand("profile.save:profile", {
    onReadback: function () {
      state.spaProfile = { phone: d.phone, email: d.email, prefs: Object.assign({}, d.prefs) };
      state.spaProfileDraft = null; render();
    },
    successToast: "Profile saved \u2014 confirmed"
  });
}

/* account bootstrap demo transitions (DEMO ONLY — Codex resolves the real
   Account through the authenticated subject; the browser never chooses it) */
var accountTimer;

export function accountRetry() {
  clearTimeout(accountTimer);
  setState({ account: "resolving-customer" });
  accountTimer = setTimeout(function () { setState({ account: "ready" }); toast("Account loaded \u2014 you\u2019re up to date"); }, 1300);
}

export function reauthDemo() {
  clearTimeout(accountTimer);
  setState({ account: "resolving-customer" });
  accountTimer = setTimeout(function () { setState({ account: "ready" }); toast("Signed in \u2014 right where you left off"); }, 1400);
}

/* proposal decision as an entity-scoped command on the open site */
export function decideCmd(status) {
  var id = state.currentSiteId;
  state.lastDecide = status; /* which decision is pending (presentation only) */
  runCommand("proposal.decide:" + id, {
    onReadback: function () { decideSite(status); }
  });
}

/* profile contact save: validation → saving → server-confirmed readback / failure */
export function saveContact() {
  var d = state.contactDraft || currentContact();
  var errs = {};
  if (((d.phone || "").replace(/\D/g, "")).length < 7) errs.phone = "Enter a valid phone number";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email || "")) errs.email = "Enter a valid email address";
  if (Object.keys(errs).length) { setState({ contactErrors: errs }); return; }
  state.contactErrors = null;
  runCommand("profile.saveContact:contact", {
    onReadback: function () { state.contact = { phone: d.phone, email: d.email }; state.contactDraft = null; render(); },
    successToast: "Contact details saved"
  });
}

/* health care hub: toggle a follow-up task's visual done state.
   Override map wins over the fixture default (m.tasks[].done). */
export function toggleCareTask(id) {
  var m = F.careModules[state.theme] || {};
  var t = (m.tasks || []).find(function (x) { return x.id === id; });
  var cur = (id in state.careTasksDone) ? state.careTasksDone[id] : !!(t && t.done);
  state.careTasksDone = Object.assign({}, state.careTasksDone);
  state.careTasksDone[id] = !cur;
  render();
}

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
var chatTimer;

/* wave 13 — messages are entity-scoped commands: each new message renders as
   "sending", becomes "sent" only on readback, or "failed" with an explicit
   per-message retry. A lost session marks it failed (never silently sent). */
function setMsgStatus(idx, status) {
  state.messages = state.messages.map(function (m, i) { return i === idx ? Object.assign({}, m, { status: status }) : m; });
}

export function sendMessageAt(idx) {
  var msg = state.messages[idx];
  if (!msg) return;
  setMsgStatus(idx, "sending");
  runCommand("support.sendMessage:m" + idx, { ms: 900,
    onReadback: function () {
      setMsgStatus(idx, "sent");
      state.typing = true; render();
      clearTimeout(chatTimer);
      chatTimer = setTimeout(function () {
        state.messages = state.messages.concat([{ from: "agent", text: F.chatReply(msg.text) }]);
        state.typing = false; render();
      }, 1100);
    },
    onFail: function () { setMsgStatus(idx, "failed"); },
    onSessionLost: function () { setMsgStatus(idx, "failed"); }
  });
}

export function pushChat(text) {
  if (!text || !text.trim()) return;
  var idx = state.messages.length;
  state.messages = state.messages.concat([{ from: "user", text: text.trim(), status: "sending" }]);
  state.chatInput = "";
  if (state.route !== "support") state.route = "support";
  sendMessageAt(idx);
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
  toast(status === "approved" ? "Plan approved \u2014 order created" : status === "revision" ? "Revision requested \u2014 we\u2019ll re-quote" : "Proposal declined");
}
/* derive per-visit + season pricing from Beam AI measured area */

export function pickTheme(name) {
  state.theme = name;
  state.orders = F.ordersFor(name);
  state.filter = "all";
  state.careUnit = null;
  state.careRetreat = null;
  state.careSpecialist = null;
  state.careTasksDone = {};
  state.accountMenu = false;
  state.spaSupport = false;
  state.spaCancelled = {};
  /* wave 15 — nothing commerce-session-scoped survives a vertical switch */
  state.spaCart = null; state.spaCartDemo = "as-added"; state.spaVariantPick = {};
  state.spaResult = null; state.spaPolicyAck = false; state.spaCheckoutDemo = "ready"; state.spaCheckoutSource = "cart";
  state.spaReturns = {}; state.spaCancelReqs = {}; state.spaPlanCancelled = {};
  state.spaPurchMore = "idle"; state.spaPurchFilter = "all"; state.spaCurrentPurchase = null; state.spaHold = "held";
  /* wave 16 — nothing flow/profile-session-scoped survives a vertical switch */
  state.spaCurrentAppointment = null; state.spaFlow = null; state.spaBookAck = false;
  state.spaSlots = "ready"; state.spaCredit = "ok"; state.spaOfferDemo = "sellable"; state.spaPlanOffer = null;
  state.spaRescheduled = {}; state.spaProfile = null; state.spaProfileDraft = null; state.spaProfileErrors = null;
  pickThemeResetCart();
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

/* demo CTA lifecycle for seo.landing: idle → pending → success → idle.
   Error state is reachable via the dev-toolbar "cta" override (state.seoCtaForce)
   and, in production, set by Codex when the real command fails. */
var seoCtaTimers = {};
export function ctaDemo(actionId, onSuccess) {
  if ((state.seoCta[actionId] || "idle") === "pending") return;
  clearTimeout(seoCtaTimers[actionId]);
  state.seoCta = Object.assign({}, state.seoCta); state.seoCta[actionId] = "pending"; render();
  seoCtaTimers[actionId] = setTimeout(function () {
    state.seoCta = Object.assign({}, state.seoCta); state.seoCta[actionId] = "success"; render();
    seoCtaTimers[actionId] = setTimeout(function () {
      state.seoCta = Object.assign({}, state.seoCta); state.seoCta[actionId] = "idle";
      if (onSuccess) onSuccess(); else render();
    }, 800);
  }, 900);
}

/* jump to a live landing section by id (scrollIntoView is not allowed
   in this workspace) */
export function seoScrollTo(id) {
  var el = document.getElementById(id);
  if (!el) return;
  var top = el.getBoundingClientRect().top + window.scrollY - 24;
  window.scrollTo({ top: top, behavior: "smooth" });
}
export function seoScrollToServices() { seoScrollTo("seo-services"); }

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

// customer-portal-design/src/state.js — presentation runtime (auto-split from app.js). No business logic.
import { F } from "../data/fixtures.js";
import { clear } from "./dom.js";
import { ACTIONS } from "./actions.js";

export var state = {
  route: "orders.list",
  theme: "HVAC",     // vertical display name
  mode: "Light",     // Light | Dark
  view: "ready",     // ready | loading | empty | error | unauthorized | not-found | conflict (route lifecycle — wave 13)
  /* wave 13 — shared account bootstrap state. After Core sign-in the server
     resolves the subject to ONE active SPA_CUSTOMER Account; until that is
     "ready" NO private route content (fixture or otherwise) may render.
     The browser never chooses the Account — this is display state only. */
  account: "ready",  // ready | resolving-customer | customer-unavailable | customer-not-linked | customer-forbidden | session-expired
  /* wave 13 — command lifecycle per exact entity/action: commands["<action>:<entityId>"]
     = pending | failed | conflict. "succeeded" is never stored locally — success renders
     only from the (demo) readback callback. cmdForce = dev-toolbar outcome override. */
  commands: {},
  cmdForce: null,    // null(=succeeded demo readback) | "failed" | "conflict" | "session-lost"
  contact: null,     // server-confirmed contact readback override: {phone,email} | null(=fixture)
  contactDraft: null,   // in-progress edit buffer {phone,email} | null
  contactErrors: null,  // field validation: {phone?,email?} | null
  filter: "all",     // order tab
  currentOrderId: null, // open order for order.detail
  cartItems: [],     // checkout cart
  addrId: "home",    // selected delivery address
  payId: "visa",     // selected payment method
  prodCat: "all",    // product category filter
  psites: F.proposalSites.map(function (p) { return Object.assign({}, p); }), // proposal sites (mutable)
  currentSiteId: "s2", // open proposal site
  profileFilter: "all",  // profile order-history tab
  feedFilter: "all",     // activity feed tab
  careUnit: null,        // selected unit.id on the care hub (HVAC equipment); null = first unit
  careRetreat: null,     // retreat request visual state override: null(=fixture) | "available" | "requesting" | "used"
  careSpecialist: null,  // preferred specialist.id on the beauty care hub; null = fixture preferredId
  careTasksDone: {},     // follow-up task overrides on the health care hub: { taskId: true|false }
  prefs: { receipts: true, sms: true, marketing: false },
  messages: F.initialMessages.slice(),
  typing: false,
  chatInput: "",
  calYear: 2026, calMonth: 0,
  phone: "",
  code: "",
  authError: null,
  /* wave 10 — Core OIDC login (auth.oidc). DEMO fields: Codex derives both from
     the real Core session/library status. sessionName is the ONLY dynamic session
     value besides status — one customer-safe display name (binding
     session.displayName). Never an Account id, token, role or claim. */
  oidc: "ready-signed-out", // checking-session | ready-signed-out | redirecting | unavailable | ready-signed-in | signing-out (checking-session = bootstrap: discovery + session restore on every /login load, incl. the callback return — Codex resolves it to signed-out/signed-in/unavailable)
  sessionName: null,
  mobileNav: false,
  /* wave 14 — Calm Harbor spa (Beauty). `capability` is DEPLOYMENT CONFIG
     (previewed via the dev toolbar), never a user control. */
  capability: "current-staging", // current-staging | target-appointments
  spaBooking: "closed",   // target only: booking/reschedule/cancel command contracts open? closed | open
  spaAppt: "salon",       // target review scenario: salon | home | long | minimal | empty | no-history
  spaRows: "many",        // staging orders ready variant: many | one
  spaLongName: false,     // long customer-name / long-label review scenario
  spaCancelled: {},       // appointment ids cancelled via the authoritative (demo) readback
  accountMenu: false,     // spa account/session menu open
  spaSupport: false,      // spa: honest support-unavailable notice open (no support destination is configured)
  /* wave 15 — Calm Harbor commercial lifecycle. `spaRetail` is DEPLOYMENT
     CONFIG (capability retail-commerce-open), never a user control. All
     success-like values below (spaCart, spaResult, spaReturns, spaCancelReqs,
     spaPlanCancelled) are written ONLY from the (demo) authoritative readback. */
  spaRetail: "browse-only",        // browse-only | retail-commerce-open
  spaAccountPartial: false,        // review: Account overview with some sections unavailable
  spaPurchFilter: "all",           // purchases list filter (all | services | shop | plans)
  spaPurchMore: "idle",            // cursor demo: idle | loading | loaded (appends, never replaces)
  spaCurrentPurchase: null,        // opaque ref of the open purchase (purchase.detail)
  spaPlanScenario: "active",       // active | expiring | exhausted | cancelled | empty (review scenario)
  spaPlanCancelled: {},            // plan refs whose renewal was cancelled via readback
  spaCart: null,                   // COMPLETE server cart readback (null = never fetched -> empty)
  spaCartDemo: "as-added",         // as-added | stale-price | inventory-conflict (review overlay on line 1)
  spaVariantPick: {},              // shop: chosen variant ref per product code (pre-command UI state)
  spaCheckoutSource: "cart",       // cart | plan (booking confirms arrive via the drawer bridge)
  spaCheckoutDemo: "ready",        // ready | repriced | inventory-conflict | slot-expired (blocking review states)
  spaPolicyAck: false,             // checkout policy acknowledgement
  spaResult: null,                 // authoritative (demo) confirmation readback — the ONLY source of success UI
  spaHold: "held",                 // booking review: held | slot-expired | repriced (blocking states)
  spaBookResult: "appointment-and-order", // confirm readback shape: appointment-only | appointment-and-order
  spaReturns: {},                  // line/purchase ref -> request state from readback (accepted-for-review | rejected)
  spaCancelReqs: {},               // purchase ref -> cancellation-request state from readback
  /* wave 16 — full flow activation. `spaPlanCommerce` is DEPLOYMENT CONFIG
     (the sellable-plan contract), never a user control. All success-like
     values (spaRescheduled, spaProfile) are written ONLY from the (demo)
     authoritative readback. */
  spaCurrentAppointment: null,     // opaque ref of the open appointment detail
  spaFlow: null,                   // booking flow: { entry, step, serviceCode, planRef, specialistRef, dayKey, slotRef, rescheduleOf, held }
  spaBookAck: false,               // booking review policy acknowledgement
  spaSlots: "ready",               // slot source: ready | loading | empty | error (review scenario)
  spaCredit: "ok",                 // plan-credit context: ok | unavailable | exhausted | changed (review scenario)
  spaPlanCommerce: "closed",       // sellable plan contract: closed | open (deployment config)
  spaOfferDemo: "sellable",        // published-offer review scenario: sellable | unavailable | changed
  spaPlanOffer: null,              // offer ref feeding checkout source `plan`
  spaRescheduled: {},              // appointment ref -> { start } from the authoritative readback
  spaProfile: null,                // server-confirmed profile readback override: {phone,email,prefs} | null(=fixture)
  spaProfileDraft: null,           // in-progress edit buffer | null (null = not editing)
  spaProfileErrors: null,          // per-field validation: {phone?,email?} | null (conflict is read from the profile.save command phase)
  seoCta: {},        // CTA lifecycle per action id: idle|pending|success|error (seo.landing)
  seoCtaForce: null, // dev-toolbar override: null | "pending" | "success" | "error"
  seoFaqOpen: null,  // open FAQ item index on seo.landing
  drawer: null,      // null | "booking"
  orders: F.ordersFor("HVAC"),
  vw: "full"         // preview viewport: full|390|768|1180|1440
};

/* ---------------- ACTIONS registry ----------------
   Every data-action maps here. Bodies are DEMO ONLY.
   Codex swaps bodies for Core API / command dispatch.        */

export function currentOrder() {
  return state.orders.find(function (o) { return o.id === state.currentOrderId; }) ||
         state.orders.find(function (o) { return o.status === "inprogress"; }) || state.orders[0];
}

export function money(n) { return "$" + n.toLocaleString(); }

export function cartCount() { return state.cartItems.reduce(function (a, x) { return a + x.qty; }, 0); }

export function findProduct(name) {
  var v = F.themes[state.theme];
  return v.products.find(function (p) { return p.name === name; });
}

export function activeProfile() {
  /* wave 14 — Beauty ships as the Calm Harbor spa portal: its profile follows
     the capability config instead of the wave-9 'appointments' profile */
  if (isSpa()) return F.profiles[spaCapability() === "target-appointments" ? "spaTarget" : "spaStaging"];
  return F.profiles[F.profileFor[state.theme] || "onDemand"];
}

/* wave 14 — Calm Harbor spa helpers */
export function isSpa() { return state.theme === "Beauty"; }
export function spaCapability() { return state.capability === "target-appointments" ? "target-appointments" : "current-staging"; }
export function spaBookingOpen() { return isSpa() && spaCapability() === "target-appointments" && state.spaBooking === "open"; }
export function spaCustomer() {
  return state.spaLongName
    ? F.spa.longCustomer
    : { first: F.customer.firstName, greeting: F.customer.greeting, fullName: F.customer.fullName };
}

/* wave 15 — Calm Harbor commerce helpers */
export function spaRetailOpen() { return isSpa() && spaCapability() === "target-appointments" && state.spaRetail === "retail-commerce-open"; }
/* wave 16 — the sellable plan contract (package/membership purchase entry) */
export function spaPlanSellOpen() { return isSpa() && spaCapability() === "target-appointments" && state.spaPlanCommerce === "open"; }
/* wave 16 — open appointment detail read model (null = non-enumerating not-found) */
export function currentAppointment() {
  var a = state.spaCurrentAppointment ? F.spaCommerce.appointmentDetails[state.spaCurrentAppointment] || null : null;
  if (!a) return null;
  var r = state.spaRescheduled[a.ref];
  if (r) return Object.assign({}, a, { start: r.start, customerStatus: "Confirmed", attention: "Rescheduled \u2014 confirmed by the studio. The previous time was released." });
  return a;
}
/* wave 16 — last server-confirmed profile values (readback override over fixture) */
export function spaProfileValues() {
  if (state.spaProfile) return state.spaProfile;
  var prefs = {};
  F.spaProfileSrv.preferences.forEach(function (p) { prefs[p.key] = p.value; });
  return { phone: F.spaProfileSrv.phone, email: F.spaProfileSrv.email, prefs: prefs };
}
export function spaCartLines() { return (state.spaCart && state.spaCart.lines) || []; }
export function spaCartCount() { return spaCartLines().reduce(function (a, l) { return a + l.qty; }, 0); }
export function currentPurchase() { return state.spaCurrentPurchase ? F.spaCommerce.purchaseDetails[state.spaCurrentPurchase] || null : null; }
export function spaPlans() {
  var refs = F.spaCommerce.plans.scenarios[state.spaPlanScenario] || [];
  return refs.map(function (r) {
    var p = F.spaCommerce.plans.byRef[r];
    if (state.spaPlanCancelled[r]) return Object.assign({}, p, { status: "Cancelled", note: "Renewal cancelled — your benefits continue to the end of the paid period.", allowedActions: [] });
    return p;
  });
}

/* wave 13 — customer-safe route display label (used by session-expired to show
   the preserved destination; a label, never an id) */
export function routeLabel(r) {
  var nav = activeProfile().nav.find(function (n) { return n.key === r; });
  if (nav) return nav.key === "care" ? F.careModules[state.theme].navLabel : nav.label;
  var map = { "order.detail": "Order details", "proposal.detail": "Your proposal", "checkout": "Checkout", "profile": "Profile", "calendar": "Calendar", "activity": "Activity", "orders.list": "Home", "account": "Account", "purchases.list": "Purchases", "purchase.detail": "Purchase details", "plan": "My plan", "cart": "Your bag", "appointment.detail": "Your visit" };
  return map[r] || "your page";
}

/* wave 13 — command phase for one exact entity/action */
export function cmdPhase(key) { return state.commands[key] || "idle"; }

/* wave 13 — server-confirmed contact values (readback override) over fixture defaults */
export function currentContact() { return state.contact || { phone: F.customer.phone, email: F.customer.email }; }

export function isPublic() { return state.route === "landing" || state.route === "seo.landing" || state.route === "auth.oidc" || state.route === "auth.phone" || state.route === "auth.code"; }

export function buildCalendarGrid(year, month) {
  var first = new Date(year, month, 1);
  var startWeekday = first.getDay();
  var daysInMonth = new Date(year, month + 1, 0).getDate();
  var cells = [];
  for (var i = 0; i < startWeekday; i++) cells.push({ empty: true });
  for (var d = 1; d <= daysInMonth; d++) {
    cells.push({ empty: false, day: d, events: state.orders.filter(function (o) { return o.y === year && o.m === month && o.d === d; }) });
  }
  return cells;
}

export function currentSite() { return state.psites.find(function (p) { return p.id === state.currentSiteId; }) || state.psites[0]; }

export function computeSite(site) {
  var cs = 0, ds = 0, total = 0;
  var names = F.themes[state.theme].prop.surfaces;
  var rows = F.surfaceDefs.map(function (d, i) {
    var a = site.areas[i];
    var c = Math.round(a * d.clear), de = Math.round(a * d.deice);
    cs += c; ds += de; total += a;
    return { name: names[i] || ("Surface " + (i + 1)), color: d.color, area: a.toLocaleString(),
      clear: "$" + c, deice: "$" + de,
      clearRate: "$" + ("" + d.clear).replace(/^0/, ""), deiceRate: "$" + ("" + d.deice).replace(/^0/, "") };
  });
  var clearing = cs + F.MOB_CLEAR, deice = ds + F.MOB_DEICE;
  var seasonRef = clearing * 18 + deice * 22;
  var unlim = seasonRef * 0.853;
  var monthly = Math.round((unlim / 5) / 5) * 5;
  var seasonLock = Math.round((unlim * 0.9) / 25) * 25;
  return { rows: rows, total: total, clearing: clearing, deice: deice, monthly: monthly, seasonLock: seasonLock, unlim: unlim,
    clearStr: "$" + clearing, deiceStr: "$" + deice };
}

export function filteredOrders() {
  var list = state.orders;
  if (state.filter !== "all") list = list.filter(function (o) { return o.status === state.filter; });
  return list;
}

export function tabItems() {
  var o = state.orders;
  var count = function (k) { return k === "all" ? o.length : o.filter(function (x) { return x.status === k; }).length; };
  return [
    { key: "all", label: "All", count: count("all") },
    { key: "inprogress", label: "Active", count: count("inprogress") },
    { key: "scheduled", label: "Scheduled", count: count("scheduled") },
    { key: "completed", label: "Done", count: count("completed") }
  ];
}

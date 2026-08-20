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
  /* wave 17 — product models, media galleries & published reviews. `spaModels`
     and `spaReviews` are OPTIONAL-ENRICHMENT states, region-scoped: a failure
     never blanks the sellable product/shop, it only degrades its own region.
     `spaGallery` is presentation-only (selected media index) — it never changes
     the product or cart identity. */
  spaCurrentProduct: null,         // opaque product ref of the open product.detail (null -> not-found)
  spaGallery: 0,                   // selected gallery media index (presentation state only)
  spaModels: "ready",              // ProductModel enrichment on the shop: ready | unavailable
  spaOrderMedia: "mixed",          // staging Order-row thumbnails (wave 17.1): mixed | loading | missing | forbidden | broken
  spaReviews: "ready",             // reviews region: ready | loading | empty | unavailable | error
  spaProfile: null,                // server-confirmed profile readback override: {phone,email,prefs} | null(=fixture)
  spaProfileDraft: null,           // in-progress edit buffer | null (null = not editing)
  spaProfileErrors: null,          // per-field validation: {phone?,email?} | null (conflict is read from the profile.save command phase)
  /* wave 20 — booking options: visit mode / location, add-ons, customer note.
     `spaOptScenario` is the SERVER capability payload for the selected
     service/profile (deployment + source config, never a user control);
     `spaLocSrc` / `spaAddonSrc` are SOURCE states that never fall back to a
     fixture success or to an empty choice; `spaNoteCap` is the server's notes
     capability (a sensitive profile disables it entirely). `spaNote` is
     TRANSIENT browser state — never persisted to storage, analytics, logs or a
     URL, and cleared on explicit close or authoritative readback. */
  spaOptScenario: "fixed-studio", // fixed-studio | mode-choice | addons | all
  spaLocSrc: "ready",             // ready | loading | empty | error | unavailable | ineligible | no-address
  spaAddonSrc: "ready",           // ready | loading | error | unavailable | ineligible | removed | repriced
  spaNoteCap: "enabled",          // enabled | disabled (sensitive profile — capability off, section + review row omitted)
  spaNote: "",                    // transient customer note (in-memory only)
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
/* wave 17 — product catalog helpers (Calm Harbor Shop + product detail).
   Models / reviews are optional enrichments: these resolve source-provided
   read models only, never inferring a collection, image or review. */
export function spaProductRef(code) { return F.spaCommerce.productCatalog.codeToRef[code] || null; }
/* open product detail read model (null = non-enumerating not-found) */
export function currentProduct() {
  var ref = state.spaCurrentProduct;
  return ref ? (F.spaCommerce.productCatalog.byRef[ref] || null) : null;
}
/* published reviews for one product ref (already PUBLISHED-only in the fixture) */
export function productReviews(ref) { return F.spaCommerce.productCatalog.reviews[ref] || []; }
/* ProductModel enrichment availability on the shop (region-scoped) */
export function spaModelsReady() { return state.spaModels === "ready"; }
/* SERVER sellability for a retail code (never inferred in the browser) */
export function spaSellInfo(code) {
  return F.spaCommerce.retail.products.find(function (r) { return r.code === code; }) || { state: "unavailable" };
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

/* =========================================================
   Wave 20 — booking OPTIONS selectors (visit mode / location, add-ons,
   note). Pure resolution of the SERVER read model + its source states.
   Nothing here computes a price, duration, compatibility or eligibility,
   and no absent source is ever presented as an empty choice.
   ========================================================= */

/* the resolved bookingOptions read model for the open flow */
export function spaBookingOpts() {
  var S = F.spaBookingOptions;
  var sc = S.scenarios[state.spaOptScenario] || S.scenarios["fixed-studio"];
  var f = state.spaFlow;
  var caps = Object.assign({}, sc.capabilities);
  if (state.spaNoteCap === "disabled") caps.notes = false;
  /* a reschedule changes the identified visit's time and place — add-ons are
     not part of that contract (recorded assumption, not a silent omission) */
  if (f && f.entry === "reschedule") caps.addOns = false;
  var addOns = (sc.addOns || []).map(function (a) { return Object.assign({}, a); });
  var affected = f && f.addOns && f.addOns.length ? f.addOns[0] : null;
  if (state.spaAddonSrc === "removed" && affected) addOns = addOns.filter(function (a) { return a.ref !== affected; });
  if (state.spaAddonSrc === "repriced" && affected) addOns = addOns.map(function (a) { return a.ref === affected ? Object.assign({}, a, { displayPrice: "$22.00" }) : a; });
  if (state.spaAddonSrc === "ineligible") addOns = addOns.map(function (a) { return Object.assign({}, a, { allowedActions: [] }); });
  var notes = Object.assign({}, sc.notes, { enabled: !!caps.notes, value: state.spaNote });
  return { capabilities: caps, visitModes: sc.visitModes || [], locations: sc.locations || [], addOns: addOns, notes: notes, selectionVersion: sc.selectionVersion, copy: S.sourceCopy };
}

/* the visit mode in play: the customer's choice, or the single returned mode
   (fixed context — the customer is never asked to select it) */
export function spaVisitMode(o) {
  o = o || spaBookingOpts();
  var f = state.spaFlow;
  var byCode = function (c) { return o.visitModes.find(function (m) { return m.code === c; }) || null; };
  if (f && f.visitMode) return byCode(f.visitMode);
  if (!o.capabilities.visitMode || o.visitModes.length === 1) return o.visitModes[0] || null;
  return null;
}

/* places the source returned for the mode in play. loading/error/unavailable
   return [] — the caller renders the SOURCE STATE, never an empty list. */
export function spaEligibleLocations(o) {
  o = o || spaBookingOpts();
  var m = spaVisitMode(o);
  if (!m) return [];
  if (state.spaLocSrc === "loading" || state.spaLocSrc === "error" || state.spaLocSrc === "unavailable" || state.spaLocSrc === "empty") return [];
  var list = o.locations.filter(function (l) { return l.visitModeCode === m.code; });
  if (state.spaLocSrc === "no-address") list = list.filter(function (l) { return l.kind !== "SAVED_PLACE"; });
  return list;
}

/* the place in play: the customer's choice, the single eligible one (fixed
   context), or null — never an assumed studio */
export function spaSelectedLocation(o) {
  o = o || spaBookingOpts();
  var list = spaEligibleLocations(o);
  var f = state.spaFlow;
  if (f && f.locationRef && state.spaLocSrc !== "ineligible") {
    var hit = list.find(function (l) { return l.ref === f.locationRef; });
    if (hit) return hit;
  }
  if (list.length === 1) return list[0];
  return null;
}

/* selected add-ons = the customer's refs INTERSECTED with what the source
   still returns (a dropped add-on can never reach the review) */
export function spaSelectedAddOns(o) {
  o = o || spaBookingOpts();
  var f = state.spaFlow;
  var picked = (f && f.addOns) || [];
  return o.addOns.filter(function (a) { return picked.indexOf(a.ref) !== -1 || (a.required && a.selected && !(a.allowedActions || []).length); });
}

/* the SERVER quote for the current selection (demo stand-in in fixtures.js) */
export function spaBookingQuote(o) {
  o = o || spaBookingOpts();
  var f = state.spaFlow;
  if (!f) return null;
  var refs = spaSelectedAddOns(o).map(function (a) { return a.ref; });
  var over = null;
  if (state.spaAddonSrc === "repriced" && f.addOns && f.addOns.length) {
    over = {}; over[f.addOns[0]] = { cents: 2200, displayPrice: "$22.00" };
  }
  return F.spaBookingQuote(f.serviceCode, refs, state.spaOptScenario, over);
}

/* add-on change the customer MUST review before confirming */
export function spaAddonChange(o) {
  o = o || spaBookingOpts();
  if (!o.capabilities.addOns) return null;
  if (state.spaAddonSrc === "removed") return { kind: "removed", copy: o.copy.addOnRemoved };
  if (state.spaAddonSrc === "repriced") return { kind: "repriced", copy: o.copy.addOnRepriced };
  return null;
}

/* note field state — the maximum is SERVER-provided, never a UI guess */
export function spaNoteState(o) {
  o = o || spaBookingOpts();
  var max = o.notes.maxLength || 0;
  var v = state.spaNote || "";
  return { enabled: !!o.notes.enabled, value: v, max: max, len: v.length, remaining: max - v.length,
           near: max > 0 && v.length >= max - 30 && v.length <= max, invalid: max > 0 && v.length > max,
           helperText: o.notes.helperText,
           errorCopy: (o.copy.noteTooLong || "").replace("{max}", String(max)) };
}

/* does an Options step exist? ONLY when a supported capability has something
   real to show — a choice to make or a source state to resolve. Never empty. */
export function spaOptionsStepOn(o) {
  o = o || spaBookingOpts();
  var c = o.capabilities;
  if (c.visitMode && o.visitModes.length > 1) return true;
  if (c.location) {
    if (state.spaLocSrc !== "ready") return true;
    if (spaEligibleLocations(o).length > 1) return true;
  }
  if (c.addOns) {
    if (state.spaAddonSrc !== "ready") return true;
    if (o.addOns.length) return true;
  }
  return false;
}

/* every required selection the source asked for is answered */
export function spaOptionsComplete(o) {
  o = o || spaBookingOpts();
  var c = o.capabilities, f = state.spaFlow;
  if (!f) return false;
  if (c.visitMode && o.visitModes.length > 1 && !f.visitMode) return false;
  var m = spaVisitMode(o);
  if (c.location && m && m.locationRequired) {
    if (state.spaLocSrc === "unavailable") return true; /* the studio assigns it — shown before confirming */
    if (state.spaLocSrc !== "ready") return false;
    if (!spaSelectedLocation(o)) return false;
  }
  if (c.addOns && state.spaAddonSrc === "ready") {
    var unmet = o.addOns.filter(function (a) { return a.required && (a.allowedActions || []).indexOf("toggle") !== -1 && (f.addOns || []).indexOf(a.ref) === -1; });
    if (unmet.length) return false;
  }
  return true;
}

/* the step rail — coherent with Options and Specialist absent or present in
   any combination; an empty step is never rendered */
export function spaFlowSteps(f) {
  f = f || state.spaFlow;
  if (!f) return [];
  var o = spaBookingOpts();
  var steps = [];
  if (f.entry !== "reschedule") steps.push({ k: "context", l: "Service" });
  if (spaOptionsStepOn(o)) steps.push({ k: "options", l: "Options" });
  if (f.entry !== "reschedule" && (F.spaBooking.eligibleSpecialists[f.serviceCode] || []).length) steps.push({ k: "specialist", l: "Specialist" });
  steps.push({ k: "slots", l: f.entry === "reschedule" ? "New time" : "Time" });
  steps.push({ k: "review", l: "Review" });
  return steps;
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

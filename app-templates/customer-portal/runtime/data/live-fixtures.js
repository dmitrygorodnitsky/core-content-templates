/*
 * Production-only compatibility boundary.
 *
 * The shared portal source still contains fixture-capable routes for local
 * design previews. The CMS build aliases every fixtures.js import to this
 * module so no customer, order, appointment, product, review, Care, or SEO
 * seed record is shipped in the live template JavaScript.
 */

const EMPTY_THEME = Object.freeze({
  slug: "beauty",
  accent: "#df2f73",
  hero: Object.freeze({ badge: "", title: "", sub: "" }),
  svc: Object.freeze([]),
  orderNames: Object.freeze([]),
  wt: Object.freeze({ icon: "", trigger: "", past: "", sla: "" }),
  plan: Object.freeze({ name: "", plusName: "", tag: "", desc: "", headline: "", features: Object.freeze([]), plusFeatures: Object.freeze([]) }),
  feat: Object.freeze({ badge: "", title: "", desc: "", cta: "", fin: "" }),
  cats: Object.freeze([]),
  products: Object.freeze([]),
  reminder: Object.freeze({ title: "", desc: "" }),
  prop: Object.freeze({ svc: "", surfaces: Object.freeze([]), months: "", unlimDesc: "", colA: "", colB: "", unitA: "", unitB: "" }),
});

const EMPTY_THEMES = Object.freeze({
  HVAC: EMPTY_THEME,
  "Snow Removal": EMPTY_THEME,
  "Lawn & Garden": EMPTY_THEME,
  "Pool & Spa": EMPTY_THEME,
  Roofing: EMPTY_THEME,
  "Pest Control": EMPTY_THEME,
  Health: EMPTY_THEME,
  Beauty: EMPTY_THEME,
});

const EMPTY_SPA = Object.freeze({
  stagingOrders: Object.freeze([]),
  appointments: Object.freeze({ upcoming: Object.freeze([]), past: Object.freeze([]), nextVariants: Object.freeze({ salon: Object.freeze([]), mobile: Object.freeze([]) }), tzNote: "" }),
  longCustomer: "",
  modeLabels: Object.freeze({ salon: "", mobile: "" }),
  pim: Object.freeze({ services: Object.freeze([]), products: Object.freeze([]) }),
  statusBadges: Object.freeze({}),
});

const EMPTY_COMMERCE = Object.freeze({
  accountEntries: Object.freeze([]),
  appointmentDetails: Object.freeze({}),
  checkout: Object.freeze({ ref: "", planQuote: null, planQuotes: Object.freeze({}) }),
  confirmations: Object.freeze({ membership: null, plan: null, retail: null }),
  offerNotes: Object.freeze({ changed: "", unavailable: "" }),
  planOffers: Object.freeze([]),
  plans: Object.freeze({ byRef: Object.freeze({}), scenarios: Object.freeze({}), statusBadges: Object.freeze({}) }),
  purchaseByAppointment: Object.freeze({}),
  purchaseDetails: Object.freeze({}),
  purchases: Object.freeze({ filters: Object.freeze([]), kindFilter: Object.freeze({}), kindLabels: Object.freeze({}), list: Object.freeze([]), nextPage: Object.freeze([]), statusBadges: Object.freeze({}) }),
  retail: Object.freeze({ products: Object.freeze([]) }),
});

const EMPTY_BOOKING = Object.freeze({
  ref: "",
  days: Object.freeze([]),
  eligibleServices: Object.freeze([]),
  eligibleSpecialists: Object.freeze([]),
  specialists: Object.freeze([]),
  serviceForTitle: Object.freeze({}),
  displayTotals: null,
  hold: Object.freeze({ ref: "", untilLabel: "", note: "" }),
  reviewLocation: "",
  policy: "",
  policyNote: "",
  creditNotes: Object.freeze({ ok: "", unavailable: "", exhausted: "", changed: "" }),
});

export const F = Object.freeze({
  // PAL and TINTS are design tokens, not fixture data. The accepted design
  // declares four pairs and every call site indexes `[i % 4]`, so trimming them
  // to one entry both destroyed the accepted four-colour rhythm and made
  // `pal[1]` throw on the second row of any list — which is what crashed the
  // Prices & memberships tab. Copied verbatim from
  // design-inbox/data/fixtures.js; keep them in step with it.
  //
  // The fixture boundary exists to keep invented *customer data* out of
  // production. Colours are not customer data, and stripping them is not what
  // it is for.
  PAL: Object.freeze([
    Object.freeze(["var(--accent)", "rgba(var(--accent-rgb),.12)"]),
    Object.freeze(["#1f8a44", "rgba(52,199,89,.16)"]),
    Object.freeze(["#ff8a3d", "rgba(255,159,10,.16)"]),
    Object.freeze(["#7a52e0", "rgba(122,82,224,.16)"]),
  ]),
  TINTS: Object.freeze([
    Object.freeze(["var(--accent)", "linear-gradient(160deg,rgba(var(--accent-rgb),.18),rgba(var(--accent-rgb),.32))"]),
    Object.freeze(["#1f8a44", "linear-gradient(160deg,#dcf5e2,#bff0cf)"]),
    Object.freeze(["#ff8a3d", "linear-gradient(160deg,#ffe9d6,#ffd3ad)"]),
    Object.freeze(["#7a52e0", "linear-gradient(160deg,#eee6ff,#d8c6ff)"]),
  ]),
  themeSlugs: Object.freeze({}),
  themes: EMPTY_THEMES,
  statusMeta: Object.freeze({}),
  technician: Object.freeze({}),
  pstatus: Object.freeze({}),
  customer: Object.freeze({ firstName: "", fullName: "", name: "", greeting: "", subline: "" }),
  MONTHS: Object.freeze([]),
  buildFeed: function () { return []; },
  feedTabs: Object.freeze([]),
  initialMessages: Object.freeze([]),
  quickReplies: Object.freeze([]),
  helpTopics: Object.freeze([]),
  chatReply: function () { return ""; },
  stormCalendar: Object.freeze({}),
  spa: EMPTY_SPA,
  spaCommerce: EMPTY_COMMERCE,
  spaServerCart: function () { return { version: "", lines: [], displayTotals: null, fulfillment: null }; },
  spaBooking: EMPTY_BOOKING,
  spaProfileSrv: Object.freeze({ version: "", phone: "", email: "", preferences: Object.freeze([]), allowedActions: Object.freeze([]) }),
  addresses: Object.freeze([]),
  cards: Object.freeze([]),
  proposal: Object.freeze({}),
  proposalSites: Object.freeze([]),
  surfaceDefs: Object.freeze({}),
  MOB_CLEAR: 0,
  MOB_DEICE: 0,
  planName: "",
  ordersFor: function () { return []; },
});

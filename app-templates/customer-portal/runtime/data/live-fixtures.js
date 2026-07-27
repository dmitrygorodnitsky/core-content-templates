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
  PAL: Object.freeze([["var(--accent)", "rgba(var(--accent-rgb),.12)"]]),
  TINTS: Object.freeze([["var(--accent)", "rgba(var(--accent-rgb),.12)"]]),
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

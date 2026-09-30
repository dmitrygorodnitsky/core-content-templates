const accent = "#0e8fc4";
const softAccent = "rgba(14,143,196,.16)";
const ok = "#1f8a44";
const softOk = "rgba(52,199,89,.16)";
const warn = "#ff8a3d";
const softWarn = "rgba(255,159,10,.16)";
const violet = "#7a52e0";
const softViolet = "rgba(122,82,224,.16)";

const MONITORED_SITES = [
  ["Alkire Street", "Arvada, CO 80004", "north", 39.82445, -105.13698],
  ["Braun Court", "Golden, CO 80401", "west", 39.71911, -105.22827],
  ["Coal Creek Lane", "Arvada, CO 80003", "north", 39.82994, -105.04903],
  ["Dover Way", "Wheat Ridge, CO 80033", "north", 39.77594, -105.11421],
  ["Eldridge Circle", "Golden, CO 80401", "west", 39.71521, -105.23147],
  ["Flatiron Parkway", "Arvada, CO 80002", "north", 39.79588, -105.0863],
  ["Garrison Green", "Lakewood, CO 80215", "central", 39.74506, -105.12045],
  ["Holland Street", "Lakewood, CO 80214", "central", 39.74449, -105.06442],
  ["Independence Way", "Lakewood, CO 80228", "west", 39.69538, -105.14948],
  ["Jellison Place", "Wheat Ridge, CO 80033", "north", 39.76814, -105.08381],
  ["Kipling Crossing", "Lakewood, CO 80215", "central", 39.73986, -105.11245],
  ["Lamar Terrace", "Denver, CO 80212", "north", 39.76599, -105.04791],
  ["Marshall Row", "Lakewood, CO 80232", "south", 39.68228, -105.07064],
  ["Newland Yard", "Lakewood, CO 80227", "south", 39.65744, -105.10738],
  ["Owens Court", "Denver, CO 80235", "south", 39.63555, -105.08189],
  ["Pierce Landing", "Lakewood, CO 80226", "central", 39.70188, -105.05427],
  ["Quail Ridge", "Lakewood, CO 80227", "south", 39.67824, -105.11058],
  ["Robb Street", "Morrison, CO 80465", "west", 39.62278, -105.22989],
  ["Saulsbury Bend", "Denver, CO 80212", "north", 39.78159, -105.04311],
  ["Union Ridge", "Lakewood, CO 80228", "west", 39.70578, -105.17348],
];

const MONITORED_VISITS = {
  "Alkire Street": { appointment: { state: "SCHEDULED", service: "Lot & drive clearing", when: "Tomorrow · auto-dispatch", dayIndex: 1, resource: "Team 4 · Plow", est: { start: "5:40 AM", end: "6:35 AM" }, actual: null } },
  "Coal Creek Lane": { appointment: { state: "SCHEDULED", service: "Lot & drive clearing", when: "Tomorrow · auto-dispatch", dayIndex: 1, resource: "Team 4 · Plow", est: { start: "6:50 AM", end: "7:45 AM" }, actual: null } },
  "Garrison Green": { appointment: { state: "SCHEDULED", service: "Walkway de-icing", when: "Tomorrow · auto-dispatch", dayIndex: 1, resource: "Priya N.", est: { start: "7:05 AM", end: "7:35 AM" }, actual: null } },
  "Marshall Row": { appointment: { state: "SCHEDULED", service: "Lot & drive clearing", when: "Tomorrow · auto-dispatch", dayIndex: 1, resource: "Marcus H.", est: { start: "7:50 AM", end: "8:40 AM" }, actual: null } },
  "Pierce Landing": { appointment: { state: "SCHEDULED", service: "Refreeze re-treat", when: "Sat · auto-dispatch", dayIndex: 2, resource: "Priya N.", est: { start: "6:30 AM", end: "7:00 AM" }, actual: null } },
  "Holland Street": { appointment: { state: "SCHEDULED", service: "Refreeze re-treat", when: "Sat · auto-dispatch", dayIndex: 2, resource: "Kyle B.", est: { start: "8:10 AM", end: "8:45 AM" }, actual: null } },
  "Union Ridge": { appointment: { state: "SCHEDULED", service: "Seasonal contract visit", when: "Sun", dayIndex: 3, resource: "Team 4 · Plow", est: { start: "10:00 AM", end: "11:15 AM" }, actual: null } },
  "Quail Ridge": { appointment: { state: "SCHEDULED", service: "Lot & drive clearing", when: "Wed · auto-dispatch", dayIndex: 6, resource: "Marcus H.", est: { start: "6:00 AM", end: "6:55 AM" }, actual: null } },
  "Dover Way": { appointment: { state: "COMPLETED", service: "Lot & drive clearing", when: "Completed 4:52 AM", dayIndex: 0, resource: "Team 4 · Plow", est: { start: "4:00 AM", end: "4:50 AM" }, actual: { start: "4:03 AM", end: "4:52 AM" } } },
  "Kipling Crossing": { appointment: { state: "COMPLETED", service: "Walkway de-icing", when: "Completed 5:14 AM", dayIndex: 0, resource: "Priya N.", est: { start: "4:30 AM", end: "5:05 AM" }, actual: { start: "4:29 AM", end: "5:14 AM" } } },
  "Lamar Terrace": { appointment: { state: "COMPLETED", service: "Refreeze re-treat", when: "Completed 6:07 AM", dayIndex: 0, resource: "Kyle B.", est: { start: "5:15 AM", end: "5:50 AM" }, actual: { start: "5:41 AM", end: "6:07 AM" } } },
};

const QUOTE_PATH = ["INITIAL", "QUOTE_PREPARED", "QUOTE_APPROVED_INTERNALLY", "QUOTE_SENT", "QUOTE_VIEWED"];
const AGREEMENT_PATH = ["QUOTATION", "QUOTATION_SENT", "AWAITING_CLIENT_DETAILS", "CLIENT_DETAILS_RECEIVED", "DRAFT", "PENDING_MANAGEMENT_APPROVAL", "INTERNALLY_APPROVED", "SENT_TO_CLIENT", "CLIENT_APPROVED", "ACTIVE"];
const CLIENT_ACCOUNT = 6001;
const SALES_TAX_RATE = 0.029;
const MONTHS_IN_SEASON = 5;

const SEASONS = {
  "2024-25": ["2024-11-01", "2025-03-31"],
  "2025-26": ["2025-11-01", "2026-03-31"],
  "2026-27": ["2026-11-01", "2027-03-31"],
};

const SNOW_PRODUCTS = [
  { id: 601, code: "GRS_SNOW_CLEARING", nls: { en: { NAME: "Snow clearing" } }, type: { id: 5, code: "AREA_BASED_SNOW_REMOVAL" } },
  { id: 602, code: "GRS_DEICING", nls: { en: { NAME: "De-icing" } }, type: { id: 9, code: "AREA_BASED_DE_ICING" } },
];

const PRICE_ROWS = { PER_SERVICE: [701, 702], MONTHLY: [703, 704], SEASONAL: [705, 706] };

const PRICE_BOOK = {
  7101: { PER_SERVICE: [185, 74], MONTHLY: [1256, 556], SEASONAL: [5980, 2645] },
  7102: { PER_SERVICE: [228, 91], MONTHLY: [1548, 684], SEASONAL: [7370, 3255] },
  7103: { PER_SERVICE: [164, 66], MONTHLY: [1113, 494], SEASONAL: [5300, 2350] },
  7104: { PER_SERVICE: [668, 297], MONTHLY: [4547, 2016], SEASONAL: [21650, 9600] },
  7201: { PER_SERVICE: [190, 76], SEASONAL: [6150, 2720] },
  7202: { MONTHLY: [1340, 590], SEASONAL: [6420, 2840] },
  7203: { MONTHLY: [1180, 520], SEASONAL: [5620, 2480] },
  7204: { MONTHLY: [1225, 540], SEASONAL: [5840, 2590] },
  7205: { PER_SERVICE: [172, 69], SEASONAL: [5420, 2400] },
  7206: { MONTHLY: [1405, 620] },
  7207: { MONTHLY: [1060, 470] },
  7208: { SEASONAL: [4980, 2210] },
  7209: { MONTHLY: [1290, 570], SEASONAL: [6180, 2730] },
  7210: { SEASONAL: [5160, 2290] },
  7211: { PER_SERVICE: [176, 71], SEASONAL: [5560, 2460] },
  7212: { MONTHLY: [1120, 495], SEASONAL: [5360, 2370] },
};

const SERVICE_ADDRESSES = {
  7101: "4820 Foothill Court, Lakewood, CO 80215",
  7102: "1190 Tabor Street, Golden, CO 80401",
  7103: "3355 Yarrow Ridge Drive, Arvada, CO 80002",
  7104: "870 Cinnamon Bear Way, Lakewood, CO 80227",
};

const QUOTE_ORDERS = [
  [8101, 7101, "PER_SERVICE", "DECLINED", "2026-27"],
  [8102, 7101, "MONTHLY", "CLIENT_APPROVED", "2026-27"],
  [8103, 7101, "SEASONAL", "DECLINED", "2026-27"],
  [8104, 7102, "PER_SERVICE", "CUSTOMER_CHANGES_REQUESTED", "2026-27"],
  [8105, 7102, "MONTHLY", "CUSTOMER_CHANGES_REQUESTED", "2026-27"],
  [8106, 7102, "SEASONAL", "CUSTOMER_CHANGES_REQUESTED", "2026-27"],
  [8107, 7103, "PER_SERVICE", "DECLINED", "2026-27"],
  [8108, 7103, "MONTHLY", "DECLINED", "2026-27"],
  [8109, 7103, "SEASONAL", "DECLINED", "2026-27"],
  [8110, 7104, "PER_SERVICE", "QUOTE_VIEWED", "2026-27"],
  [8111, 7104, "MONTHLY", "QUOTE_SENT", "2026-27"],
  [8112, 7104, "SEASONAL", "QUOTE_SENT", "2026-27"],
  [8113, 7207, "MONTHLY", "QUOTE_PREPARED", "2026-27"],
  [8201, 7201, "SEASONAL", "CLIENT_APPROVED", "2026-27"],
  [8202, 7201, "PER_SERVICE", "DECLINED", "2026-27"],
  [8203, 7202, "MONTHLY", "CLIENT_APPROVED", "2026-27"],
  [8204, 7202, "SEASONAL", "DECLINED", "2026-27"],
  [8301, 7203, "SEASONAL", "CLIENT_APPROVED", "2026-27"],
  [8302, 7203, "MONTHLY", "DECLINED", "2026-27"],
  [8401, 7204, "MONTHLY", "CLIENT_APPROVED", "2026-27"],
  [8402, 7204, "SEASONAL", "DECLINED", "2026-27"],
  [8001, 7205, "SEASONAL", "CLIENT_APPROVED", "2025-26"],
  [8002, 7205, "PER_SERVICE", "DECLINED", "2025-26"],
  [8003, 7206, "MONTHLY", "CLIENT_APPROVED", "2025-26"],
  [8501, 7208, "SEASONAL", "CLIENT_APPROVED", "2024-25"],
  [8601, 7209, "MONTHLY", "CLIENT_APPROVED", "2025-26"],
  [8602, 7209, "SEASONAL", "DECLINED", "2025-26"],
  [8701, 7210, "SEASONAL", "CLIENT_APPROVED", "2024-25"],
  [8801, 7211, "PER_SERVICE", "DECLINED", "2026-27"],
  [8802, 7211, "SEASONAL", "DECLINED", "2026-27"],
  [8901, 7212, "SEASONAL", "CLIENT_APPROVED", "2026-27"],
  [8902, 7212, "MONTHLY", "DECLINED", "2026-27"],
];

const PROVIDER = {
  PROVIDER_LEGAL_NAME: "Granite Ridge Snow Removal LLC",
  PROVIDER_REPRESENTATIVE_NAME: "Jordan Pike",
  PROVIDER_REPRESENTATIVE_JOB_TITLE: "Contracts Manager",
};

const CLIENT_DETAILS = {
  LEGAL_NAME: "Whitlock Property Group LLC",
  CLIENT_TYPE: "ORGANIZATION",
  BILLING_ADDRESS: "1550 Wynkoop Street, Suite 400, Denver, CO 80202",
  REPRESENTATIVE_FIRST_NAME: "Dana",
  REPRESENTATIVE_LAST_NAME: "Whitlock",
  REPRESENTATIVE_JOB_TITLE: "Portfolio Manager",
  REPRESENTATIVE_EMAIL: "dana.whitlock@example.test",
  REPRESENTATIVE_PHONE: "+1 (303) 555-0164",
};

const CONTRACT_TERMS = [
  "# Winter service terms",
  "",
  "1. Services",
  "1.1 Granite Ridge clears snow and applies de-icing material at each property listed in this agreement, under the option approved for that property.",
  "1.2 Every visit is logged with its arrival time and photographs.",
  "",
  "2. Service triggers",
  "2.1 Clearing starts once snowfall reaches 2 cm.",
  "2.2 De-icing is applied when the surface temperature is forecast at or below 0 °C.",
  "",
  "3. Invoicing",
  "- Seasonal options are invoiced once, at the start of the term.",
  "- Monthly options are invoiced on the first day of each month of the term.",
  "- Per-service options are invoiced after each visit.",
  "",
  "4. Access",
  "The client keeps each property accessible and tells Granite Ridge about obstacles such as parked vehicles or construction work.",
  "1) Gate codes are shared through the storm desk only.",
  "2) Blackout days are agreed in writing before the season starts.",
  "",
  "# Cancellation",
  "Either party may cancel with thirty days written notice before the season starts.",
].join("\n");

const AGREEMENTS = [
  { id: 9101, state: "QUOTATION_SENT", orders: [8101, 8102, 8103, 8104, 8105, 8106, 8107, 8108, 8109, 8110, 8111, 8112], attributes: {} },
  { id: 9102, state: "SENT_TO_CLIENT", orders: [8201, 8202, 8203, 8204], attributes: Object.assign({ EFFECTIVE_DATE: "2026-10-20", TERM_START_DATE: SEASONS["2026-27"][0], TERM_END_DATE: SEASONS["2026-27"][1], CONTRACT_TERMS: CONTRACT_TERMS }, PROVIDER, CLIENT_DETAILS) },
  { id: 9103, state: "AWAITING_CLIENT_DETAILS", orders: [8301, 8302], attributes: Object.assign({ TERM_START_DATE: SEASONS["2026-27"][0], TERM_END_DATE: SEASONS["2026-27"][1] }, PROVIDER) },
  { id: 9104, state: "PENDING_MANAGEMENT_APPROVAL", orders: [8401, 8402], attributes: Object.assign({ TERM_START_DATE: SEASONS["2026-27"][0], TERM_END_DATE: SEASONS["2026-27"][1] }, PROVIDER, CLIENT_DETAILS) },
  { id: 9100, state: "ACTIVE", orders: [8001, 8002, 8003], attributes: Object.assign({ EFFECTIVE_DATE: "2025-10-15", TERM_START_DATE: SEASONS["2025-26"][0], TERM_END_DATE: SEASONS["2025-26"][1], CONTRACT_TERMS: CONTRACT_TERMS }, PROVIDER, CLIENT_DETAILS) },
  { id: 9099, state: "EXPIRED", orders: [8501], attributes: Object.assign({ EFFECTIVE_DATE: "2024-10-10", TERM_START_DATE: SEASONS["2024-25"][0], TERM_END_DATE: SEASONS["2024-25"][1], CONTRACT_TERMS: CONTRACT_TERMS }, PROVIDER, CLIENT_DETAILS) },
  { id: 9098, state: "SUSPENDED", orders: [8601, 8602], attributes: Object.assign({ EFFECTIVE_DATE: "2025-10-12", TERM_START_DATE: SEASONS["2025-26"][0], TERM_END_DATE: SEASONS["2025-26"][1], CONTRACT_TERMS: CONTRACT_TERMS }, PROVIDER, CLIENT_DETAILS) },
  { id: 9097, state: "ARCHIVED", orders: [8701], attributes: Object.assign({ EFFECTIVE_DATE: "2024-10-08", TERM_START_DATE: SEASONS["2024-25"][0], TERM_END_DATE: SEASONS["2024-25"][1], CONTRACT_TERMS: CONTRACT_TERMS }, PROVIDER, CLIENT_DETAILS) },
  { id: 9096, state: "CANCELED", orders: [8801, 8802], attributes: {} },
  { id: 9095, state: "CLIENT_APPROVED", orders: [8901, 8902], attributes: Object.assign({ EFFECTIVE_DATE: "2026-10-18", TERM_START_DATE: SEASONS["2026-27"][0], TERM_END_DATE: SEASONS["2026-27"][1], CONTRACT_TERMS: CONTRACT_TERMS }, PROVIDER, CLIENT_DETAILS) },
];
const AGREEMENT_ENDINGS = {
  SUSPENDED: ["ACTIVE", "SUSPENDED"],
  EXPIRED: ["ACTIVE", "EXPIRED"],
  ARCHIVED: ["ACTIVE", "EXPIRED", "ARCHIVED"],
  CANCELED: ["QUOTATION_SENT", "CANCELED"],
};

function statePath(path, target) {
  const reached = path.indexOf(target);
  return (reached === -1 ? path.concat([target]) : path.slice(0, reached + 1)).map(function (code) { return { code: code }; });
}

function money(value) {
  return Math.round(value * 100) / 100;
}

function quoteLines(entry) {
  const prices = PRICE_BOOK[entry[1]][entry[2]];
  const count = entry[2] === "MONTHLY" ? MONTHS_IN_SEASON : 1;
  return prices.map(function (amount, index) {
    return {
      id: entry[0] * 10 + index + 1,
      order: { id: entry[0] },
      itemPrice: { id: PRICE_ROWS[entry[2]][index] },
      amount: amount,
      itemCount: count,
      sortOrder: index,
      grandTotal: money(amount * count),
    };
  });
}

function quoteOrder(entry) {
  const lines = quoteLines(entry);
  const charges = money(lines.reduce(function (sum, line) { return sum + line.grandTotal; }, 0));
  const taxes = money(charges * SALES_TAX_RATE);
  const attributes = {
    CLIENT: { value: CLIENT_ACCOUNT },
    SERVICE_PROPERTY: { value: entry[1] },
    PRICING_MODEL: { value: entry[2] },
    SERVICE_PERIOD_START: { value: SEASONS[entry[4]][0] },
    SERVICE_PERIOD_END: { value: SEASONS[entry[4]][1] },
  };
  if (SERVICE_ADDRESSES[entry[1]]) attributes.SERVICE_ADDRESS = { value: SERVICE_ADDRESSES[entry[1]] };
  return {
    id: entry[0],
    type: { id: 6, code: "WINTER_SERVICES_ORDER" },
    account: { id: CLIENT_ACCOUNT },
    states: statePath(QUOTE_PATH, entry[3]),
    totalCharges: charges,
    totalTaxes: taxes,
    grandTotal: money(charges + taxes),
    currency: { id: 2, code: "USD" },
    attributes: { 5: attributes },
    items: lines.map(function (line) { return { id: line.id }; }),
  };
}

function serviceAgreement(spec) {
  const attributes = { CLIENT: { value: CLIENT_ACCOUNT }, ORDERS: { value: spec.orders.slice() } };
  Object.keys(spec.attributes).forEach(function (code) { attributes[code] = { value: spec.attributes[code] }; });
  const ending = AGREEMENT_ENDINGS[spec.state];
  const states = ending
    ? statePath(AGREEMENT_PATH, ending[0]).concat(ending.slice(1).map(function (code) { return { code: code }; }))
    : statePath(AGREEMENT_PATH, spec.state);
  return {
    id: spec.id,
    type: { id: 17, code: "SERVICE_AGREEMENT" },
    organization: { id: 43, code: "GRANITE_RIDGE_SNOW", nls: { en: { NAME: "Granite Ridge Snow Removal" } } },
    states: states,
    attributes: { 17: attributes },
  };
}

function monitoredProperties() {
  return MONITORED_SITES.map(function (site, index) {
    return Object.assign({
      id: "prop-monitored-" + (index + 1),
      backendId: 7200 + index + 1,
      name: site[0],
      address: (index * 37 + 210) + " " + site[0] + ", " + site[1],
      lat: site[3], lon: site[4], zone: site[2],
      contract: index % 3 === 0 ? "1241" : "1234",
      appointment: null,
      ticket: null,
      lastService: { service: index % 3 === 0 ? "Walkway de-icing" : "Lot & drive clearing", when: "Jan " + (2 + (index % 11)) },
    }, MONITORED_VISITS[site[0]] || {});
  });
}

export const graniteRidgeSnowFixture = Object.freeze({
  id: "granite-ridge-snow",
  vertical: "snow",
  organization: { name: "Granite Ridge Snow Removal", locality: "Denver, Colorado", mode: "fixture" },
  theme: {
    slug: "snow",
    accent,
    hero: {
      badge: "Front Range storm response · fixture organization",
      title: "Cleared before the first shift arrives.",
      sub: "Weather-triggered clearing and de-icing across your Denver properties. Every visit is GPS-logged, timed against your SLA, and photographed.",
    },
    svc: [
      { id: "grs-lot-clearing", name: "Lot & drive clearing", price: "$185", tagline: "Plowed to bare surface before 6 AM", duration: "~70 min", includes: ["Drive lanes, aprons and fire lanes", "GPS-logged arrival and photo proof", "90-minute storm-window SLA"] },
      { id: "grs-walk-deicing", name: "Walkway de-icing", price: "$74", tagline: "Salt and brine on the paths people use", duration: "~35 min", includes: ["Entries, sidewalks and stair treads", "Pet-safe blend on request", "Free re-treat after refreeze"] },
      { id: "grs-roof-ice", name: "Roof snow & ice dam", price: "Quote", tagline: "Before the load becomes a claim", duration: "half day", includes: ["Load assessment before crews go up", "Rope-access certified team", "Gutter and downspout ice clearing"] },
      { id: "grs-season-contract", name: "Seasonal contract visit", price: "$140", tagline: "Set the trigger, forget the phone", duration: "~45 min", includes: ["Auto-dispatch on the 2 cm rule", "Unlimited storm visits Nov–Mar", "Monthly compliance report"] },
    ],
    orderNames: ["Walkway de-icing", "Lot & drive clearing", "Seasonal contract visit", "Roof snow & ice dam", "Refreeze re-treat"],
    wt: {
      icon: "❄️",
      trigger: "Snowfall ≥ 2 cm forecast overnight",
      past: "Snowfall 3.4 cm recorded overnight",
      sla: "Cleared within the 90-minute contracted window",
    },
    plan: {
      name: "Winter Plan",
      plusName: "Winter Plus",
      monthlyPrice: "$149",
      plusMonthlyPrice: "$268",
      tag: "For a single managed property",
      plusTag: "For a multi-property portfolio",
      desc: "Priority storm dispatch and –15% on materials.",
      headline: "Pricing that fits your winter",
      features: ["Priority storm dispatch", "2 free de-icing visits a season", "–15% on materials", "Photo report after every visit"],
      plusFeatures: ["Same-storm guarantee across every site", "Unlimited de-icing", "–25% on materials", "24/7 storm line and named crew"],
    },
    feat: {
      badge: "Fixture supply catalog",
      title: "Brine sprayer for pre-storm treatment",
      desc: "A fixture supply item tied to Granite Ridge's pre-treat routine.",
      cta: "Add to cart · $890",
      fin: "Fixture checkout only",
    },
    cats: [{ key: "deicers", label: "De-icers" }, { key: "equipment", label: "Equipment" }, { key: "markers", label: "Markers & mats" }],
    products: [
      { id: "grs-calcium-blend", sku: "GRS-DEI-001", cat: "deicers", tag: "De-icer", name: "Calcium blend 20 kg", blurb: "Melts to −25°C · concrete-safe", price: "$34", priceNum: 34 },
      { id: "grs-pet-safe", sku: "GRS-DEI-002", cat: "deicers", tag: "De-icer", name: "Pet-safe granules", blurb: "Chloride-free · gentle on paws", price: "$41", priceNum: 41 },
      { id: "grs-brine-drum", sku: "GRS-DEI-003", cat: "deicers", tag: "De-icer", name: "Brine concentrate 60 L", blurb: "Pre-treat before the storm lands", price: "$96", priceNum: 96 },
      { id: "grs-snow-pusher", sku: "GRS-EQP-001", cat: "equipment", tag: "Equipment", name: "Poly snow pusher", blurb: "Wide blade · no-scratch edge", price: "$58", priceNum: 58 },
      { id: "grs-roof-rake", sku: "GRS-EQP-002", cat: "equipment", tag: "Equipment", name: "Telescopic roof rake", blurb: "Reach 6 m from the ground", price: "$92", priceNum: 92 },
      { id: "grs-drive-markers", sku: "GRS-MRK-001", cat: "markers", tag: "Marker", name: "Drive markers (12)", blurb: "Reflective · guide the plow at night", price: "$26", priceNum: 26 },
      { id: "grs-entry-mat", sku: "GRS-MRK-002", cat: "markers", tag: "Mat", name: "Heated entry mat", blurb: "Plug-in · melts 5 cm an hour", price: "$228", priceNum: 228 },
    ],
    reminder: { title: "Restock de-icer before the next front", desc: "Your last pallet was delivered 47 days ago" },
    prop: {
      svc: "Snow Removal & De-Icing",
      surfaces: ["Drive lanes", "Parking apron", "Private sidewalk", "Entry stairs", "Fire lane"],
      months: "Nov–Mar",
      unlimDesc: "Unlimited de-icing at ≤0°C and clearing at 2 cm.",
      colA: "Snow clearing",
      colB: "De-icing",
      unitA: "/ clearing",
      unitB: "/ de-ice",
    },
    checkoutNote: "Fixture checkout records the supply order in this Granite Ridge demo only.",
    copy: {
      servicesSub: "Pick the service your property needs, review what a visit covers, and keep every storm response in one place.",
      servicesSteps: [
        { n: "1", t: "Set the trigger", d: "Choose the snowfall rule that dispatches your crew" },
        { n: "2", t: "We clear on the storm", d: "Crews roll before the trigger is met, GPS-logged" },
        { n: "3", t: "Review the proof", d: "Photos, response time and materials land in your season log" },
      ],
      payAsYouGo: {
        name: "Pay per storm",
        price: "Per visit",
        tag: "Billed per cleared visit, no season commitment",
        features: ["Call a visit when you need one", "Same GPS-logged photo proof", "No seasonal minimum"],
      },
      marketingPref: "Seasonal offers, supply restock reminders and winter prep tips",
    },
    checkout: {
      emptyCart: "Your supply cart is empty",
      emptyCartDescription: "Browse Granite Ridge de-icer, equipment and markers.",
      fulfillmentNote: "Fixture checkout records the supply order in this Granite Ridge demo only.",
    },
  },
  customer: {
    firstName: "Dana",
    greeting: "Good morning, Dana",
    subline: "Storm watch tonight · 24 properties under contract",
    fullName: "Dana Whitlock",
    phone: "+1 (303) 555-0164",
    email: "dana.whitlock@example.test",
    memberSince: "2022",
    stats: { orders: "38", spent: "$14,820", savings: "$2,140" },
  },
  customerAccount: {
    id: CLIENT_ACCOUNT,
    code: "GRS-CUSTOMER-6001",
    nls: { en: { NAME: "Whitlock Property Group" } },
    type: { id: 2, code: "CUSTOMER" },
    user: { id: 4301 },
    states: [{ id: 83, code: "ACTIVE" }],
    contacts: [
      {
        id: 6101,
        firstName: "Dana",
        lastName: "Whitlock",
        title: "Portfolio Manager",
        type: { id: 1, code: "PRIMARY" },
        contactEntries: [
          { id: 6111, type: { id: 1, code: "EMAIL" }, value: "dana.whitlock@example.test" },
          { id: 6112, type: { id: 2, code: "PHONE" }, value: "+1 (303) 555-0164" },
        ],
      },
      {
        id: 6102,
        firstName: "Marco",
        lastName: "Ruiz",
        title: "Facilities Coordinator",
        type: { id: 2, code: "SECONDARY" },
        contactEntries: [{ id: 6121, type: { id: 1, code: "EMAIL" }, value: "marco.ruiz@example.test" }],
      },
    ],
    addresses: [
      {
        id: 6201,
        types: [{ id: 1, code: "BILLING" }],
        address: { id: 7301, address1: "1550 Wynkoop Street", address2: "Suite 400", city: "Denver", postalCode: "80202", state: { id: 6, code: "CO" } },
      },
      {
        id: 6202,
        types: [{ id: 3, code: "SERVICE" }],
        address: { id: 7302, address1: "4820 Foothill Court", city: "Lakewood", postalCode: "80215", state: { id: 6, code: "CO" } },
      },
    ],
  },
  addresses: [
    { id: "foothill", label: "Foothill Court", line: "4820 Foothill Court", city: "Lakewood, CO 80215", dot: accent, iconBg: softAccent },
    { id: "tabor", label: "Tabor Street", line: "1190 Tabor Street", city: "Golden, CO 80401", dot: ok, iconBg: softOk },
    { id: "yarrow", label: "Yarrow Ridge", line: "3355 Yarrow Ridge Drive", city: "Arvada, CO 80002", dot: warn, iconBg: softWarn },
  ],
  cards: [{ id: "visa", brand: "Visa", last4: "4417", exp: "05/29" }],
  technician: { name: "Marcus Hale", role: "Lead operator · Route 4", rating: "4.9", visits: "61 visits with you", eta: "arriving in ~20 min" },
  statusMeta: {
    inprogress: { badge: "accent", label: "In progress" },
    scheduled: { badge: "info", label: "Scheduled" },
    completed: { badge: "ok", label: "Completed" },
    cancelled: { badge: "danger", label: "Cancelled" },
  },
  orders: [
    { id: "#GR-3182", name: "Lot & drive clearing", date: "Today", status: "inprogress", price: "$185", dot: warn, iconBg: softWarn, locationId: "foothill", y: 2026, m: 0, d: 15, serviceName: "Lot & drive clearing", timeline: ["Trigger met at 4:52 AM", "Marcus dispatched", "Clearing in progress"] },
    { id: "#GR-3190", name: "Walkway de-icing", date: "Tomorrow", status: "scheduled", price: "$74", dot: accent, iconBg: softAccent, locationId: "tabor", y: 2026, m: 0, d: 16, serviceName: "Walkway de-icing", timeline: ["Auto-dispatch armed on the 2 cm rule"], wt: { status: "pending", trigger: "Snowfall ≥ 2 cm forecast overnight", detected: "Today · 5:10 AM", deadline: "Today · 8:00 PM", auto: "If we don’t hear back by the deadline, the visit proceeds automatically per your contract." } },
    { id: "#GR-3204", name: "Seasonal contract visit", date: "Jan 30", status: "scheduled", price: "$140", dot: accent, iconBg: softAccent, locationId: "yarrow", y: 2026, m: 0, d: 30, serviceName: "Seasonal contract visit", timeline: ["Scheduled under the Winter Plus contract"] },
    { id: "#GR-3151", name: "Roof snow & ice dam", date: "Jan 12", status: "completed", price: "$920", dot: ok, iconBg: softOk, locationId: "foothill", y: 2026, m: 0, d: 12, photos: true, serviceName: "Roof snow & ice dam", timeline: ["Load assessment completed", "Ice dam cleared", "Photo report saved"] },
    { id: "#GR-3120", name: "Lot & drive clearing", date: "Jan 5", status: "completed", price: "$185", dot: ok, iconBg: softOk, locationId: "tabor", y: 2026, m: 0, d: 5, photos: true, serviceName: "Lot & drive clearing", timeline: ["Trigger met at 4:46 AM", "Cleared within SLA", "Photo report saved"], wt: { status: "auto", trigger: "Snowfall 3.4 cm recorded overnight", detected: "Jan 5 · 4:46 AM", deadline: "Jan 5 · 7:00 AM", sla: "Cleared within the 90-minute contracted window" } },
    { id: "#GR-3044", name: "Refreeze re-treat", date: "Dec 19", status: "completed", price: "$74", dot: ok, iconBg: softOk, locationId: "yarrow", y: 2025, m: 11, d: 19, photos: true, serviceName: "Refreeze re-treat", timeline: ["Refreeze reported", "Re-treated at no charge"] },
  ],
  prefs: { receipts: true, sms: true, marketing: false },
  initialMessages: [{ from: "agent", text: "Hi Dana, this is Rowan on the Granite Ridge storm desk. I can help with tonight's dispatch, your contracts, or a supply order." }],
  quickReplies: ["Where is the crew?", "Confirm tomorrow's access", "Contract question", "Restock de-icer"],
  helpTopics: [
    { label: "Track tonight's storm response", dot: accent, iconBg: softAccent, q: "Where is the crew right now?" },
    { label: "Access, gate codes and blackout days", dot: ok, iconBg: softOk, q: "I need to update site access" },
    { label: "Contracts and seasonal pricing", dot: violet, iconBg: softViolet, q: "I have a contract question" },
    { label: "Supply order support", dot: warn, iconBg: softWarn, q: "I need help with a supply order" },
  ],
  feedTabs: [{ key: "all", label: "All" }, { key: "orders", label: "Storm response" }, { key: "billing", label: "Billing" }, { key: "reminders", label: "Reminders" }],
  activity: [
    { day: "Today", items: [
      { type: "orders", title: "Weather Trigger — confirm tomorrow's visit", desc: "Snowfall ≥ 2 cm forecast overnight at Tabor Street · respond by 8:00 PM today", time: "5:12 AM", dot: accent, iconBg: softAccent, action: "Review", act: "weather", unread: true },
      { type: "orders", title: "Marcus is clearing Foothill Court", desc: "Lot & drive clearing · started 5:38 AM", time: "5:38 AM", dot: warn, iconBg: softWarn, action: "Track", act: "orders", unread: true },
    ] },
    { day: "Yesterday", items: [
      { type: "billing", title: "Payment received", desc: "$920 · Roof snow & ice dam #GR-3151", time: "3:04 PM", dot: ok, iconBg: softOk, action: "View invoice", act: "invoice" },
      { type: "orders", title: "December compliance report ready", desc: "8 storm visits · slip-and-fall record attached", time: "9:20 AM", dot: violet, iconBg: softViolet, action: "Open season log", act: "care" },
    ] },
    { day: "Earlier this week", items: [
      { type: "reminders", title: "Yarrow Ridge contract renews", desc: "Winter Plus renews Feb 1 — review the site list before then.", time: "Mon", dot: violet, iconBg: softViolet, action: "View contracts", act: "proposals" },
      { type: "reminders", title: "Restock de-icer before the next front", desc: "Your last pallet was delivered 47 days ago", time: "Sun", dot: warn, iconBg: softWarn, action: "Shop supplies", act: "products" },
    ] },
  ],
  support: { agentName: "Rowan", label: "Granite Ridge storm desk", ticket: "GR-418", availability: "Storm desk · staffed 24/7 Nov–Mar", intro: "Reach the Granite Ridge storm desk about tonight’s dispatch, site access, contracts or a supply order." },
  care: {
    kind: "seasonLog",
    navLabel: "Season log",
    empty: { glyph: "❄", title: "No storm responses yet", desc: "When the first storm triggers a visit, the GPS-logged response appears here." },
    title: "Season log",
    sub: "Every Granite Ridge storm response this winter — GPS-logged, timed against your SLA, with materials used.",
    stats: [
      { label: "Storms served", value: "11" },
      { label: "Visits", value: "19" },
      { label: "Avg response", value: "48 min" },
      { label: "De-icer used", value: "540 kg" },
    ],
    sla: { pct: 95, label: "18 of 19 visits inside the 90-minute window — the missed one was credited per contract." },
    events: [
      { date: "Jan 12", storm: "Snowfall 3.4 cm", trigger: "Auto · 2 cm rule", response: "36 min", sla: true, material: "31 kg salt", orderId: "#GR-3151", photos: true },
      { date: "Jan 5", storm: "Snowfall 4.6 cm", trigger: "Auto · 2 cm rule", response: "44 min", sla: true, material: "38 kg salt", orderId: "#GR-3120", photos: true },
      { date: "Dec 28", storm: "Freezing rain", trigger: "Ice watch", response: "39 min", sla: true, material: "52 L brine", orderId: "#GR-3044", photos: true },
      { date: "Dec 19", storm: "Snowfall 9.1 cm", trigger: "Auto · 2 cm rule", response: "112 min", sla: false, material: "34 kg salt", note: "crew rerouted — visit credited", orderId: "#GR-3044", photos: true },
      { date: "Dec 12", storm: "Snowfall 2.4 cm", trigger: "Auto · 2 cm rule", response: "51 min", sla: true, material: "27 kg salt", orderId: "#GR-3120", photos: true },
    ],
    docs: [
      { id: "doc-grs-compliance-2025-12", name: "December compliance report", meta: "PDF · 8 visits · slip-and-fall record" },
      { id: "doc-grs-compliance-2025-11", name: "November compliance report", meta: "PDF · 5 visits" },
      { id: "doc-grs-coi-2026", name: "Certificate of insurance 2025–26", meta: "PDF · valid through Jun 2026" },
    ],
  },
  overview: {
    map: {
      center: { lat: 39.7264, lon: -105.1397 },
      zoom: 11,
    },
    weather: {
      nowIndex: 0,
      zoneCentroids: {
        north: { lat: 39.83, lon: -105.12 },
        central: { lat: 39.72, lon: -105.09 },
        south: { lat: 39.57, lon: -105.06 },
        west: { lat: 39.66, lon: -105.22 },
      },
      legend: [
        { key: "clear", label: "Clear" },
        { key: "snow", label: "Snow" },
        { key: "freezing", label: "Freezing rain" },
        { key: "storm", label: "Storm warning" },
        { key: "issue", label: "Issue opened" },
      ],
      timeline: [
        {
          day: "Today", date: "Jan 15", kind: "storm", temp: "−6°C",
          label: "Storm watch", note: "Service likely tonight",
          stats: [
            { label: "Precipitation", value: "70%" },
            { label: "Wind", value: "18 km/h NW" },
            { label: "Feels like", value: "−10°C" },
            { label: "Humidity", value: "80%" },
          ],
          zones: { north: "storm", central: "storm", south: "snow", west: "clear" },
        },
        {
          day: "Fri", date: "Jan 16", kind: "snow", temp: "−8°C",
          label: "Snowfall 3 cm", note: "Trigger met · crews dispatch overnight",
          stats: [
            { label: "Precipitation", value: "90%" },
            { label: "Wind", value: "24 km/h NW" },
            { label: "Feels like", value: "−14°C" },
            { label: "Humidity", value: "86%" },
          ],
          zones: { north: "snow", central: "snow", south: "snow", west: "snow" },
        },
        {
          day: "Sat", date: "Jan 17", kind: "freezing", temp: "−9°C",
          label: "Freezing rain", note: "De-icing expected across the north lots",
          stats: [
            { label: "Precipitation", value: "60%" },
            { label: "Wind", value: "12 km/h N" },
            { label: "Feels like", value: "−15°C" },
            { label: "Humidity", value: "91%" },
          ],
          zones: { north: "freezing", central: "freezing", south: "snow", west: "snow" },
        },
        {
          day: "Sun", date: "Jan 18", kind: "snow", temp: "−3°C",
          label: "Light snow", note: "Weather trigger possible after midnight",
          stats: [
            { label: "Precipitation", value: "45%" },
            { label: "Wind", value: "9 km/h W" },
            { label: "Feels like", value: "−7°C" },
            { label: "Humidity", value: "74%" },
          ],
          zones: { north: "snow", central: "clear", south: "snow", west: "clear" },
        },
        {
          day: "Mon", date: "Jan 19", kind: "clear", temp: "−1°C",
          label: "Clearing", note: "Crews finish outstanding routes",
          stats: [
            { label: "Precipitation", value: "10%" },
            { label: "Wind", value: "7 km/h SW" },
            { label: "Feels like", value: "−4°C" },
            { label: "Humidity", value: "58%" },
          ],
          zones: { north: "clear", central: "clear", south: "clear", west: "clear" },
        },
        {
          day: "Tue", date: "Jan 20", kind: "clear", temp: "1°C",
          label: "Clear", note: "Below the service trigger all day",
          stats: [
            { label: "Precipitation", value: "5%" },
            { label: "Wind", value: "6 km/h S" },
            { label: "Feels like", value: "−1°C" },
            { label: "Humidity", value: "49%" },
          ],
          zones: { north: "clear", central: "clear", south: "clear", west: "clear" },
        },
        {
          day: "Wed", date: "Jan 21", kind: "snow", temp: "−4°C",
          label: "Snow returning", note: "Next storm window opens in the evening",
          stats: [
            { label: "Precipitation", value: "55%" },
            { label: "Wind", value: "15 km/h NW" },
            { label: "Feels like", value: "−9°C" },
            { label: "Humidity", value: "77%" },
          ],
          zones: { north: "snow", central: "snow", south: "clear", west: "snow" },
        },
      ],
    },
    properties: [
      {
        id: "prop-foothill", backendId: 7101, name: "Foothill Court", address: "4820 Foothill Court, Lakewood, CO 80215",
        lat: 39.73336, lon: -105.12205, zone: "central", contract: "1234", quoteSiteId: "gr-foothill",
        appointment: { state: "IN_PROGRESS", service: "Lot & drive clearing", when: "Started 5:38 AM", dayIndex: 0, resource: "Marcus H.", est: { start: "5:30 AM", end: "6:20 AM" }, actual: { start: "5:38 AM", end: "" } },
        ticket: null,
        lastService: { service: "Roof snow & ice dam", when: "Jan 12" },
      },
      {
        id: "prop-tabor", backendId: 7102, name: "Tabor Street", address: "1190 Tabor Street, Golden, CO 80401",
        lat: 39.72431, lon: -105.23627, zone: "north", contract: "1234", quoteSiteId: "gr-tabor",
        appointment: { state: "SCHEDULED", service: "Walkway de-icing", when: "Tomorrow · auto-dispatch", dayIndex: 1, resource: "Priya N.", est: { start: "9:00 AM", end: "9:40 AM" }, actual: null },
        ticket: null,
        lastService: { service: "Lot & drive clearing", when: "Jan 5" },
      },
      {
        id: "prop-yarrow", backendId: 7103, name: "Yarrow Ridge", address: "3355 Yarrow Ridge Drive, Arvada, CO 80002",
        lat: 39.80498, lon: -105.0911, zone: "north", contract: "1241", quoteSiteId: "gr-yarrow",
        appointment: { state: "SCHEDULED", service: "Seasonal contract visit", when: "In three days", dayIndex: 3, resource: "Kyle B.", est: { start: "11:30 AM", end: "12:45 PM" }, actual: null },
        ticket: { state: "SUBMITTED", title: "Snow not cleared near entrance" },
        lastService: { service: "Refreeze re-treat", when: "Dec 19" },
      },
      {
        id: "prop-cinnamon", backendId: 7104, name: "Cinnamon Bear Way", address: "870 Cinnamon Bear Way, Lakewood, CO 80227",
        lat: 39.67564, lon: -105.08018, zone: "south", contract: "1241", quoteSiteId: "gr-cinnamon",
        appointment: null,
        ticket: null,
        lastService: { service: "Lot & drive clearing", when: "Dec 28" },
      },
    ].concat(monitoredProperties()),
    invoices: {
      outstanding: [
        { number: "INV-4402", amount: 6240, due: "Oct 31", state: "OVERDUE" },
        { number: "INV-4417", amount: 4880, due: "Nov 14", state: "OVERDUE" },
        { number: "INV-4433", amount: 3960, due: "Nov 28", state: "OVERDUE" },
        { number: "INV-4448", amount: 3410, due: "Dec 12", state: "OVERDUE" },
        { number: "INV-4459", amount: 2740, due: "Dec 19", state: "OVERDUE" },
        { number: "INV-4471", amount: 2180, due: "Dec 31", state: "OVERDUE" },
        { number: "INV-4486", amount: 1440, due: "Jan 9", state: "OVERDUE" },
        { number: "INV-4498", amount: 2650, due: "Jan 20", state: "DUE_THIS_MONTH" },
        { number: "INV-4502", amount: 1710, due: "Jan 24", state: "DUE_THIS_MONTH" },
        { number: "INV-4507", amount: 840, due: "Jan 30", state: "DUE_THIS_MONTH" },
        { number: "INV-4511", amount: 1290, due: "Feb 14", state: "DUE_LATER" },
        { number: "INV-4514", amount: 810, due: "Feb 28", state: "DUE_LATER" },
      ],
      paidThisMonth: [
        { number: "INV-4489", amount: 1920, paid: "Jan 12" },
        { number: "INV-4483", amount: 1340, paid: "Jan 9" },
        { number: "INV-4477", amount: 1150, paid: "Jan 7" },
        { number: "INV-4468", amount: 880, paid: "Jan 4" },
        { number: "INV-4461", amount: 560, paid: "Jan 2" },
      ],
    },
    contracts: [
      {
        number: "1234", plan: "Seasonal Unlimited Coverage",
        description: "Predictable budget, full-season protection. Unlimited de-icing at ≤0°C and clearing at 2 cm. GPS logs and photos after every visit.",
      },
      {
        number: "1241", plan: "Walkway & Entry Care",
        description: "Entries, stair treads and private sidewalks kept passable through the season, with a pet-safe blend on request.",
      },
    ],
    support: [
      { title: "Snow not cleared near entrance", status: "In Review", when: "Opened today", tone: "warn" },
      { title: "Salting needed in parking area", status: "Scheduled", when: "Updated 1h ago", tone: "info" },
      { title: "Gate code changed for the north lot", status: "In Review", when: "Updated 3h ago", tone: "warn" },
      { title: "Invoice question on INV-4471", status: "Escalated", when: "Opened yesterday", tone: "danger" },
    ],
    banner: {
      title: "We're monitoring the storm",
      copy: "Our team is watching conditions closely and will dispatch as needed.",
      action: "Contact us",
    },
  },
  stormCalendar: {
    contract: { rule: "Auto-dispatch by weather trigger", note: "Cleared within the 90-minute contracted window" },
    accessNotes: [
      { label: "Gate code", value: "4417" },
      { label: "Fire lane", value: "Keep clear — never stage equipment here" },
      { label: "Sundays", value: "Do not service Yarrow Ridge" },
    ],
    days: [
      { date: "Mon", dateSub: "Jan 12", weather: { state: "served", label: "Snowfall 3.4 cm recorded overnight", temp: "−4°C" }, events: [
        { type: "Lot & drive clearing", status: "completed", time: "5:34 AM", photos: true },
        { type: "Walkway de-icing", status: "completed", time: "6:48 AM" },
      ] },
      { date: "Wed", dateSub: "Jan 14", weather: { state: "clear", label: "Clear · below service trigger", temp: "−1°C" }, events: [
        { type: "Lot & drive clearing", status: "skipped", note: "Below trigger — visit not required" },
      ] },
      { date: "Today", dateSub: "Jan 15", today: true, weather: { state: "watch", label: "Storm watch — service likely tonight", temp: "−6°C" }, events: [
        { type: "Lot & drive clearing", status: "onroute", time: "ETA 5:40 AM", tech: "Marcus H." },
      ] },
      { date: "Fri", dateSub: "Jan 16", needsAccess: true, weather: { state: "expected", label: "Snowfall ≥ 2 cm forecast overnight", temp: "−8°C" }, events: [
        { type: "Lot & drive clearing", status: "scheduled", trigger: true },
        { type: "Walkway de-icing", status: "scheduled", trigger: true },
      ] },
      { date: "Sun", dateSub: "Jan 18", weather: { state: "expected", label: "Weather trigger possible", temp: "−3°C" }, events: [
        { type: "Walkway de-icing", status: "delayed", note: "Rescheduled from Fri — crew capacity" },
      ] },
    ],
  },
  proposals: {
    agreements: AGREEMENTS.map(serviceAgreement),
    orders: QUOTE_ORDERS.map(quoteOrder),
    orderItems: QUOTE_ORDERS.reduce(function (lines, entry) { return lines.concat(quoteLines(entry)); }, []),
    productPrices: Object.keys(PRICE_ROWS).reduce(function (rows, model) {
      return rows.concat(PRICE_ROWS[model].map(function (id, index) { return { id: id, product: { id: SNOW_PRODUCTS[index].id } }; }));
    }, []),
    products: SNOW_PRODUCTS,
    sites: [
      { id: "gr-foothill", addr: "4820 Foothill Court", city: "Lakewood, CO", postal: "80215", lot: "19,400" },
      { id: "gr-tabor", addr: "1190 Tabor Street", city: "Golden, CO", postal: "80401", lot: "23,800" },
      { id: "gr-yarrow", addr: "3355 Yarrow Ridge Drive", city: "Arvada, CO", postal: "80002", lot: "16,200" },
      { id: "gr-cinnamon", addr: "870 Cinnamon Bear Way", city: "Littleton, CO", postal: "80127", lot: "51,600" },
    ],
  },
});

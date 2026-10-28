(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // app-templates/customer-portal/runtime/data/live-care-fixtures.js
  var live_care_fixtures_exports = {};
  __export(live_care_fixtures_exports, {
    careFixtures: () => careFixtures
  });
  var careFixtures;
  var init_live_care_fixtures = __esm({
    "app-templates/customer-portal/runtime/data/live-care-fixtures.js"() {
      careFixtures = /* @__PURE__ */ Object.freeze({});
    }
  });

  // app-templates/customer-portal/runtime/data/live-fixtures.js
  var EMPTY_THEME = /* @__PURE__ */ Object.freeze({
    slug: "beauty",
    accent: "#df2f73",
    hero: /* @__PURE__ */ Object.freeze({ badge: "", title: "", sub: "" }),
    svc: /* @__PURE__ */ Object.freeze([]),
    orderNames: /* @__PURE__ */ Object.freeze([]),
    wt: /* @__PURE__ */ Object.freeze({ icon: "", trigger: "", past: "", sla: "" }),
    plan: /* @__PURE__ */ Object.freeze({ name: "", plusName: "", tag: "", desc: "", headline: "", features: /* @__PURE__ */ Object.freeze([]), plusFeatures: /* @__PURE__ */ Object.freeze([]) }),
    feat: /* @__PURE__ */ Object.freeze({ badge: "", title: "", desc: "", cta: "", fin: "" }),
    cats: /* @__PURE__ */ Object.freeze([]),
    products: /* @__PURE__ */ Object.freeze([]),
    reminder: /* @__PURE__ */ Object.freeze({ title: "", desc: "" }),
    prop: /* @__PURE__ */ Object.freeze({ svc: "", surfaces: /* @__PURE__ */ Object.freeze([]), months: "", unlimDesc: "", colA: "", colB: "", unitA: "", unitB: "" })
  });
  var EMPTY_THEMES = /* @__PURE__ */ Object.freeze({
    HVAC: EMPTY_THEME,
    "Snow Removal": EMPTY_THEME,
    "Lawn & Garden": EMPTY_THEME,
    "Pool & Spa": EMPTY_THEME,
    Roofing: EMPTY_THEME,
    "Pest Control": EMPTY_THEME,
    Health: EMPTY_THEME,
    Beauty: EMPTY_THEME
  });
  var EMPTY_SPA = /* @__PURE__ */ Object.freeze({
    stagingOrders: /* @__PURE__ */ Object.freeze([]),
    appointments: /* @__PURE__ */ Object.freeze({ upcoming: /* @__PURE__ */ Object.freeze([]), past: /* @__PURE__ */ Object.freeze([]), nextVariants: /* @__PURE__ */ Object.freeze({ salon: /* @__PURE__ */ Object.freeze([]), mobile: /* @__PURE__ */ Object.freeze([]) }), tzNote: "" }),
    longCustomer: "",
    modeLabels: /* @__PURE__ */ Object.freeze({ salon: "", mobile: "" }),
    pim: /* @__PURE__ */ Object.freeze({ services: /* @__PURE__ */ Object.freeze([]), products: /* @__PURE__ */ Object.freeze([]) }),
    statusBadges: /* @__PURE__ */ Object.freeze({})
  });
  var EMPTY_COMMERCE = /* @__PURE__ */ Object.freeze({
    accountEntries: /* @__PURE__ */ Object.freeze([]),
    appointmentDetails: /* @__PURE__ */ Object.freeze({}),
    checkout: /* @__PURE__ */ Object.freeze({ ref: "", planQuote: null, planQuotes: /* @__PURE__ */ Object.freeze({}) }),
    confirmations: /* @__PURE__ */ Object.freeze({ membership: null, plan: null, retail: null }),
    offerNotes: /* @__PURE__ */ Object.freeze({ changed: "", unavailable: "" }),
    planOffers: /* @__PURE__ */ Object.freeze([]),
    plans: /* @__PURE__ */ Object.freeze({ byRef: /* @__PURE__ */ Object.freeze({}), scenarios: /* @__PURE__ */ Object.freeze({}), statusBadges: /* @__PURE__ */ Object.freeze({}) }),
    purchaseByAppointment: /* @__PURE__ */ Object.freeze({}),
    purchaseDetails: /* @__PURE__ */ Object.freeze({}),
    purchases: /* @__PURE__ */ Object.freeze({ filters: /* @__PURE__ */ Object.freeze([]), kindFilter: /* @__PURE__ */ Object.freeze({}), kindLabels: /* @__PURE__ */ Object.freeze({}), list: /* @__PURE__ */ Object.freeze([]), nextPage: /* @__PURE__ */ Object.freeze([]), statusBadges: /* @__PURE__ */ Object.freeze({}) }),
    retail: /* @__PURE__ */ Object.freeze({ products: /* @__PURE__ */ Object.freeze([]) })
  });
  var EMPTY_BOOKING = /* @__PURE__ */ Object.freeze({
    ref: "",
    days: /* @__PURE__ */ Object.freeze([]),
    eligibleServices: /* @__PURE__ */ Object.freeze([]),
    eligibleSpecialists: /* @__PURE__ */ Object.freeze([]),
    specialists: /* @__PURE__ */ Object.freeze([]),
    serviceForTitle: /* @__PURE__ */ Object.freeze({}),
    displayTotals: null,
    hold: /* @__PURE__ */ Object.freeze({ ref: "", untilLabel: "", note: "" }),
    reviewLocation: "",
    policy: "",
    policyNote: "",
    creditNotes: /* @__PURE__ */ Object.freeze({ ok: "", unavailable: "", exhausted: "", changed: "" })
  });
  var F = /* @__PURE__ */ Object.freeze({
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
    PAL: /* @__PURE__ */ Object.freeze([
      /* @__PURE__ */ Object.freeze(["var(--accent)", "rgba(var(--accent-rgb),.12)"]),
      /* @__PURE__ */ Object.freeze(["#1f8a44", "rgba(52,199,89,.16)"]),
      /* @__PURE__ */ Object.freeze(["#ff8a3d", "rgba(255,159,10,.16)"]),
      /* @__PURE__ */ Object.freeze(["#7a52e0", "rgba(122,82,224,.16)"])
    ]),
    TINTS: /* @__PURE__ */ Object.freeze([
      /* @__PURE__ */ Object.freeze(["var(--accent)", "linear-gradient(160deg,rgba(var(--accent-rgb),.18),rgba(var(--accent-rgb),.32))"]),
      /* @__PURE__ */ Object.freeze(["#1f8a44", "linear-gradient(160deg,#dcf5e2,#bff0cf)"]),
      /* @__PURE__ */ Object.freeze(["#ff8a3d", "linear-gradient(160deg,#ffe9d6,#ffd3ad)"]),
      /* @__PURE__ */ Object.freeze(["#7a52e0", "linear-gradient(160deg,#eee6ff,#d8c6ff)"])
    ]),
    themeSlugs: /* @__PURE__ */ Object.freeze({}),
    themes: EMPTY_THEMES,
    statusMeta: /* @__PURE__ */ Object.freeze({}),
    technician: /* @__PURE__ */ Object.freeze({}),
    pstatus: /* @__PURE__ */ Object.freeze({}),
    customer: /* @__PURE__ */ Object.freeze({ firstName: "", fullName: "", name: "", greeting: "", subline: "" }),
    MONTHS: /* @__PURE__ */ Object.freeze([]),
    buildFeed: function() {
      return [];
    },
    feedTabs: /* @__PURE__ */ Object.freeze([]),
    initialMessages: /* @__PURE__ */ Object.freeze([]),
    quickReplies: /* @__PURE__ */ Object.freeze([]),
    helpTopics: /* @__PURE__ */ Object.freeze([]),
    chatReply: function() {
      return "";
    },
    stormCalendar: /* @__PURE__ */ Object.freeze({}),
    spa: EMPTY_SPA,
    spaCommerce: EMPTY_COMMERCE,
    spaServerCart: function() {
      return { version: "", lines: [], displayTotals: null, fulfillment: null };
    },
    spaBooking: EMPTY_BOOKING,
    spaProfileSrv: /* @__PURE__ */ Object.freeze({ version: "", phone: "", email: "", preferences: /* @__PURE__ */ Object.freeze([]), allowedActions: /* @__PURE__ */ Object.freeze([]) }),
    addresses: /* @__PURE__ */ Object.freeze([]),
    cards: /* @__PURE__ */ Object.freeze([]),
    proposal: /* @__PURE__ */ Object.freeze({}),
    proposalSites: /* @__PURE__ */ Object.freeze([]),
    surfaceDefs: /* @__PURE__ */ Object.freeze({}),
    MOB_CLEAR: 0,
    MOB_DEICE: 0,
    planName: "",
    ordersFor: function() {
      return [];
    }
  });

  // app-templates/customer-portal/runtime/data/live-case-fixtures.js
  function caseFixtureFor() {
    return null;
  }
  function caseVerticalFor() {
    return null;
  }
  function cloneCaseValue(value) {
    if (value === void 0 || value === null) return value;
    return JSON.parse(JSON.stringify(value));
  }

  // app-templates/customer-portal/runtime/src/config.js
  var SIGNED_OUT_DESTINATIONS = /* @__PURE__ */ Object.freeze(["sign-in", "landing"]);
  var LANDING_REASON_PARAMETER = "portal";
  var LANDING_ENTRY_REASONS = /* @__PURE__ */ Object.freeze({ signedOut: "signed-out", noAccess: "no-access" });
  var ACCOUNT_NO_ACCESS_STATES = /* @__PURE__ */ Object.freeze(["customer-not-linked", "organization-forbidden", "customer-forbidden"]);
  var portalProfiles = {
    onDemand: {
      id: "onDemand",
      nav: [
        { key: "orders.list", label: "Orders" },
        { key: "care" },
        { key: "proposals.list", label: "Proposals" },
        { key: "services", label: "Services" },
        { key: "pricing", label: "Pricing" },
        { key: "products", label: "Products" },
        { key: "support", label: "Support" }
      ],
      primary: { label: "+ Book", action: "booking.open" },
      modules: ["orders", "calendar", "activity", "proposals", "care", "services", "pricing", "products", "checkout", "profile", "support"],
      weatherCalendar: false,
      showCart: true,
      drawerTitle: "Book a service"
    },
    stormOps: {
      id: "stormOps",
      nav: [
        { key: "orders.list", label: "Home" },
        { key: "calendar", label: "Calendar" },
        { key: "care" },
        { key: "proposals.list", label: "Contracts" },
        { key: "services", label: "Services" },
        { key: "activity", label: "Activity" },
        { key: "support", label: "Support" }
      ],
      primary: { label: "Request service", action: "service.request" },
      modules: ["orders", "calendar", "activity", "proposals", "care", "services", "profile", "support"],
      weatherCalendar: true,
      showCart: false,
      drawerTitle: "Request service"
    },
    appointments: {
      id: "appointments",
      nav: [
        { key: "orders.list", label: "Appointments" },
        { key: "calendar", label: "Calendar" },
        { key: "care" },
        { key: "services", label: "Services" },
        { key: "pricing", label: "Pricing" },
        { key: "products", label: "Products" },
        { key: "support", label: "Support" }
      ],
      primary: { label: "+ Book", action: "booking.open" },
      modules: ["orders", "calendar", "care", "services", "pricing", "products", "checkout", "profile", "support"],
      weatherCalendar: false,
      showCart: true,
      drawerTitle: "Book an appointment"
    },
    stormRetail: {
      id: "stormRetail",
      nav: [
        { key: "overview", label: "Home" },
        { key: "appointments", label: "Appointments" },
        { key: "invoices", label: "Invoices" },
        { key: "calendar", label: "Calendar" },
        { key: "care" },
        { key: "proposals.list", label: "Contracts" },
        { key: "support", label: "Support" }
      ],
      primary: { label: "Request a quote", action: "service.requestForm" },
      modules: ["overview", "appointmentsTimeline", "properties", "invoices", "orders", "calendar", "activity", "proposals", "care", "pricing", "profile", "support"],
      weatherCalendar: true,
      showCart: false,
      drawerTitle: "Request service",
      customerAccountProfile: true
    },
    spaStaging: {
      id: "spaStaging",
      nav: [
        { key: "orders.list", label: "Orders" },
        { key: "services", label: "Services & prices" },
        { key: "products", label: "Shop", secondary: true },
        { key: "account", label: "Account" }
      ],
      primary: { label: "Browse services", action: "nav.go" },
      modules: ["orders", "services", "pricing", "products", "account"],
      weatherCalendar: false,
      showCart: false,
      drawerTitle: "Book an appointment"
    },
    spaTarget: {
      id: "spaTarget",
      nav: [
        { key: "orders.list", label: "Appointments" },
        { key: "services", label: "Services & prices" },
        { key: "products", label: "Shop", secondary: true },
        { key: "account", label: "Account" }
      ],
      primary: { label: "+ Book", action: "booking.open" },
      modules: ["appointments", "orders", "services", "pricing", "products", "account", "purchases", "plan", "cart", "checkout", "profile"],
      weatherCalendar: false,
      showCart: false,
      drawerTitle: "Book an appointment"
    }
  };
  var verticalProfiles = {
    hvac: vertical("hvac", "HVAC", "onDemand", "Equipment"),
    snow: vertical("snow", "Snow Removal", "stormOps", "Season log"),
    lawn: vertical("lawn", "Lawn & Garden", "stormOps", "Program"),
    pool: vertical("pool", "Pool & Spa", "stormOps", "Water"),
    roofing: vertical("roofing", "Roofing", "stormOps", "Roof report"),
    pest: vertical("pest", "Pest Control", "stormOps", "Monitoring"),
    health: vertical("health", "Health", "appointments", "Care plan", false),
    beauty: vertical("beauty", "Beauty", "spaStaging", "My routine", false)
  };
  var routeRegistry = {
    "seo.landing": { id: "seo.landing", path: "/seo-preview", module: "seo-parity", public: true, parityOnly: true },
    "auth.oidc": { id: "auth.oidc", path: "/login", module: "auth", public: true },
    "auth.phone": { id: "auth.phone", path: "/login/phone-reference", module: "auth", public: true },
    "auth.code": { id: "auth.code", path: "/login/verify", module: "auth", public: true },
    overview: { id: "overview", path: "/overview", module: "overview" },
    appointments: { id: "appointments", path: "/appointments", module: "appointmentsTimeline" },
    "visit.detail": { id: "visit.detail", path: "/visits/:id", module: "appointmentsTimeline", param: "id" },
    "property.detail": { id: "property.detail", path: "/properties/:id", module: "properties", param: "id" },
    invoices: { id: "invoices", path: "/invoices", module: "invoices" },
    "invoice.detail": { id: "invoice.detail", path: "/invoices/:id", module: "invoices", param: "id" },
    "orders.list": { id: "orders.list", path: "/orders", module: "orders" },
    "order.detail": { id: "order.detail", path: "/orders/:id", module: "orders", param: "id" },
    "appointment.detail": { id: "appointment.detail", path: "/appointments/:id", module: "appointments", param: "id" },
    calendar: { id: "calendar", path: "/calendar", module: "calendar" },
    activity: { id: "activity", path: "/activity", module: "activity" },
    services: { id: "services", path: "/services", module: "services" },
    pricing: { id: "pricing", path: "/pricing", module: "pricing" },
    products: { id: "products", path: "/products", module: "products" },
    "product.detail": { id: "product.detail", path: "/products/:id", module: "products", param: "id" },
    checkout: { id: "checkout", path: "/checkout", module: "checkout" },
    account: { id: "account", path: "/account", module: "account", ownedByProfile: true },
    "purchases.list": { id: "purchases.list", path: "/purchases", module: "purchases" },
    "purchase.detail": { id: "purchase.detail", path: "/purchases/:id", module: "purchases", param: "id" },
    plan: { id: "plan", path: "/account/plan", module: "plan" },
    cart: { id: "cart", path: "/cart", module: "cart" },
    "proposals.list": { id: "proposals.list", path: "/proposals", module: "proposals" },
    "proposal.detail": { id: "proposal.detail", path: "/proposals/:id", module: "proposals", param: "id" },
    "agreement.detail": { id: "agreement.detail", path: "/agreements/:id", module: "proposals", param: "id" },
    profile: { id: "profile", path: "/profile", module: "profile" },
    support: { id: "support", path: "/support", module: "support" },
    care: { id: "care", path: "/care", module: "care", access: "care" }
  };
  var routeMatchers = Object.values(routeRegistry).map(function(route) {
    var names = [];
    var pattern = route.path.split("/").map(function(segment) {
      if (segment.charAt(0) !== ":") return escapeRegExp(segment);
      names.push(segment.slice(1));
      return "([^/]+)";
    }).join("/");
    return { route, names, expression: new RegExp("^" + pattern + "/?$") };
  });
  function matchRoutePath(pathname) {
    var cleanPath = String(pathname || "/").split(/[?#]/, 1)[0] || "/";
    for (var i = 0; i < routeMatchers.length; i += 1) {
      var matcher = routeMatchers[i];
      var match = cleanPath.match(matcher.expression);
      if (!match) continue;
      var params = {};
      try {
        matcher.names.forEach(function(name, index) {
          params[name] = decodeURIComponent(match[index + 1]);
        });
      } catch (_) {
        return null;
      }
      return { id: matcher.route.id, params };
    }
    return null;
  }
  function normalizeVertical(value) {
    if (!value) return "hvac";
    var normalized = String(value).trim().toLowerCase();
    if (verticalProfiles[normalized]) return normalized;
    var match = Object.values(verticalProfiles).find(function(profile) {
      return profile.displayName.toLowerCase() === normalized;
    });
    return match ? match.slug : "hvac";
  }
  function resolveProfile(vertical2, requestedProfile) {
    var verticalConfig = verticalProfiles[vertical2] || verticalProfiles.hvac;
    var candidate = portalProfiles[requestedProfile] ? requestedProfile : verticalConfig.profile;
    if (portalProfiles[candidate].weatherCalendar && !verticalConfig.weather) return verticalConfig.profile;
    return candidate;
  }
  function readPortalConfig(root) {
    var dataset = root ? root.dataset : {};
    var vertical2 = normalizeVertical(dataset.portalVertical);
    var theme = normalizeVertical(dataset.portalTheme || vertical2);
    var verticalConfig = verticalProfiles[vertical2];
    var enabledModules = splitList(dataset.portalEnabledModules);
    var profile = resolveProfile(vertical2, dataset.portalProfile);
    var dataMode = allowed(dataset.portalDataMode, ["fixture", "live"], "fixture");
    var caseId = dataMode === "fixture" && caseVerticalFor(dataset.portalCase) === vertical2 ? dataset.portalCase : "";
    return {
      experienceId: dataset.portalExperienceId || "local-preview",
      brandName: dataset.portalBrandName || verticalConfig.displayName,
      landingUrl: safeConfiguredUrl(dataset.portalLandingUrl),
      portalUrl: safeConfiguredUrl(dataset.portalUrl),
      supportUrl: safeConfiguredUrl(dataset.portalSupportUrl),
      logoutReturnUrl: safeConfiguredUrl(dataset.portalLogoutReturnUrl),
      registrationUrl: safeConfiguredUrl(dataset.portalRegistrationUrl),
      allowedNavOrigins: splitList(dataset.portalAllowedNavOrigins),
      signedOutDestination: allowed(dataset.portalSignedOutDestination, SIGNED_OUT_DESTINATIONS, "sign-in"),
      navigation: {
        primary: dataset.portalNavPrimaryLabel || "",
        appointments: dataset.portalNavAppointmentsLabel || "",
        invoices: dataset.portalNavInvoicesLabel || "",
        calendar: dataset.portalNavCalendarLabel || "",
        activity: dataset.portalNavActivityLabel || "",
        care: dataset.portalNavCareLabel || "",
        proposals: dataset.portalNavProposalsLabel || "",
        services: dataset.portalNavServicesLabel || "",
        pricing: dataset.portalNavPricingLabel || "",
        products: dataset.portalNavProductsLabel || "",
        account: dataset.portalNavAccountLabel || "",
        support: dataset.portalNavSupportLabel || ""
      },
      primaryCtaLabel: dataset.portalPrimaryCtaLabel || "",
      vertical: vertical2,
      theme,
      profile,
      capability: allowed(dataset.portalCapability, ["current-staging", "target-appointments"], "current-staging"),
      booking: allowed(dataset.portalBooking, ["closed", "open"], "closed"),
      retail: allowed(dataset.portalRetail, ["browse-only", "retail-commerce-open"], "browse-only"),
      planCommerce: allowed(dataset.portalPlanCommerce, ["closed", "open"], "closed"),
      demoCommands: allowed(dataset.portalDemoCommands, ["closed", "current-api"], "closed"),
      anonymousIntentMode: allowed(dataset.portalAnonymousIntentMode, ["closed", "selection-only"], "closed"),
      anonymousIntentTtlSeconds: boundedInteger(dataset.portalAnonymousIntentTtlSeconds, 1800, 60, 86400),
      anonymousIntentMaxItems: boundedInteger(dataset.portalAnonymousIntentMaxItems, 10, 1, 50),
      anonymousIntentReconciliationMode: allowed(dataset.portalAnonymousIntentReconciliation, ["authenticated-server"], "authenticated-server"),
      registrationMode: allowed(dataset.portalRegistrationMode, ["closed", "core-auth"], "closed"),
      organization: dataset.portalOrganization || dataset.portalPimOrganization || "SERVICEWAND",
      coreApiBase: dataset.portalCoreApiBase || "/core",
      accountApiBase: dataset.portalAccountApiBase || "/core-acct",
      billApiBase: dataset.portalBillApiBase || "/core-bill",
      serviceApiBase: dataset.portalServiceApiBase || "/core-svc",
      resourceApiBase: dataset.portalResourceApiBase || "/core-rm",
      accountTypeCode: dataset.portalAccountTypeCode || "SPA_CUSTOMER",
      authCoreBase: dataset.portalAuthCoreBase || "/core",
      authCallbackPath: dataset.portalAuthCallbackPath || "/core/oauth2-callback.html",
      authReturnStorageKey: dataset.portalAuthReturnStorageKey || "oidc-return-url",
      authLogoutReturnStorageKey: dataset.portalAuthLogoutReturnStorageKey || "oidc-logout-return-url",
      requestFormUrl: safeConfiguredUrl(dataset.portalRequestFormUrl),
      timeZone: readTimeZone(dataset.portalTimeZone),
      weatherClientId: browserCredential(dataset.portalWeatherClientId),
      weatherClientSecret: browserCredential(dataset.portalWeatherClientSecret),
      mapsApiKey: browserCredential(dataset.portalMapsApiKey),
      mapsMapId: browserCredential(dataset.portalMapsMapId),
      serviceGeography: readServiceGeography(dataset.portalServiceGeography),
      routerMode: allowed(dataset.portalRouterMode, ["hash", "history", "memory"], "hash"),
      authMode: allowed(dataset.portalAuthMode, ["fixture", "required"], "fixture"),
      defaultRoute: routeRegistry[dataset.portalDefaultRoute] ? dataset.portalDefaultRoute : verticalConfig.defaultRoute,
      enabledModules: enabledModules.length ? enabledModules : portalProfiles[profile].modules.slice(),
      errorMode: allowed(dataset.portalErrorMode, ["error", "fallback"], "error"),
      dataMode,
      caseId,
      pimFixtureUrl: dataset.portalPimFixtureUrl || "",
      pimApiBase: dataset.portalPimApiBase || "/core-pim/api",
      pimOrganization: dataset.portalPimOrganization || "SERVICEWAND",
      pimEnrichmentMode: allowed(dataset.portalPimEnrichment, ["closed", "current-api"], "closed"),
      pimProductTypeCode: dataset.portalPimProductTypeCode || "SERVICEWAND_SAAS",
      pimPricingProductTypeCodes: splitList(dataset.portalPimPricingProductTypeCodes),
      pimProductsProductTypeCodes: splitList(dataset.portalPimProductsProductTypeCodes),
      pimCurrency: dataset.portalPimCurrency || "CAD",
      // Defaults follow the SYSTEM price types. `PRICE_CURRENCY` is the abstract
      // root, so with `includeChildPriceTypes` it covers `PER_UNIT` (retail,
      // services, packages) and `PER_UNIT_RECURRENT` (memberships) alike; naming
      // either child directly loses the other.
      pimPriceTypeCode: dataset.portalPimPriceTypeCode || "PRICE_CURRENCY",
      // The price-attribute filter defaults to OFF, and an empty deployment
      // attribute must keep it off. Under the SYSTEM types a one-time price
      // carries no INTERVAL at all, so any non-empty filter drops every
      // non-recurring row and the catalog comes back empty. Defaulting these to
      // `INTERVAL`/`1` meant clearing them in the CMS silently restored them.
      pimPriceAttributeCode: dataset.portalPimPriceAttributeCode || "",
      pimPriceAttributeValues: splitList(dataset.portalPimPriceAttributeValues || ""),
      pimCurrencyAttributeCode: dataset.portalPimCurrencyAttributeCode || "CURRENCY",
      pimCurrencyAttributeValues: splitList(dataset.portalPimCurrencyAttributeValues || dataset.portalPimCurrency || "CAD"),
      pimAmountAttributeCode: dataset.portalPimAmountAttributeCode || "UNIT_PRICE",
      pimAmountMinorDivisor: positiveNumber(dataset.portalPimAmountMinorDivisor, 100),
      pimCta: dataset.portalPimCta || "",
      defaultMode: allowed(dataset.portalDefaultMode, ["light", "dark"], "light")
    };
  }
  function customerAccountRequired(config) {
    return !!config && config.dataMode === "live" && config.authMode === "required";
  }
  function customerAccountProfile(config) {
    var profile = config && portalProfiles[config.profile];
    return !!(profile && profile.customerAccountProfile);
  }
  function configuredExternalUrl(config, key) {
    var value = config && config[key];
    if (!value) return "";
    var parsed2;
    try {
      parsed2 = new URL(value, globalThis.location && globalThis.location.href);
    } catch (_) {
      return "";
    }
    if (parsed2.protocol !== "https:") return "";
    var allowedOrigins = config.allowedNavOrigins || [];
    return allowedOrigins.includes(parsed2.origin) ? parsed2.href : "";
  }
  function landingEntryUrl(config, reason) {
    var landing = configuredExternalUrl(config, "landingUrl");
    if (!landing || !reason) return landing;
    var url = new URL(landing);
    url.searchParams.set(LANDING_REASON_PARAMETER, reason);
    return url.href;
  }
  function landingEntryOpen(config) {
    return !!config && config.signedOutDestination === "landing" && customerAccountRequired(config) && !!landingEntryUrl(config);
  }
  function readTimeZone(value) {
    var zone = typeof value === "string" ? value.trim() : "";
    if (!zone) return null;
    try {
      return new Intl.DateTimeFormat("en-US", { timeZone: zone }).resolvedOptions().timeZone;
    } catch (_) {
      return null;
    }
  }
  function safeConfiguredUrl(value) {
    if (!value) return "";
    try {
      var parsed2 = new URL(value);
      return parsed2.protocol === "https:" ? parsed2.href : "";
    } catch (_) {
      return "";
    }
  }
  function routePath(routeId, params) {
    var route = routeRegistry[routeId];
    if (!route) return "/";
    var values = params || {};
    return route.path.replace(/:([a-zA-Z0-9_]+)/g, function(_, name) {
      if (values[name] === void 0 || values[name] === null || values[name] === "") {
        throw new Error("Missing route parameter " + name + " for " + routeId);
      }
      return encodeURIComponent(String(values[name]));
    });
  }
  function readServiceGeography(raw) {
    if (typeof raw !== "string" || !raw.trim()) return null;
    var parsed2;
    try {
      parsed2 = JSON.parse(raw);
    } catch (_) {
      return null;
    }
    if (!parsed2 || typeof parsed2 !== "object") return null;
    var map = readGeoMap(parsed2.map);
    var zones = readGeoZones(parsed2.zones);
    if (!map || !zones) return null;
    return { map, zones };
  }
  function readGeoMap(value) {
    if (!value || typeof value !== "object") return null;
    var center = readGeoPoint(value.center);
    var zoom = finiteNumber(value.zoom);
    if (!center) return null;
    if (!Number.isFinite(zoom) || zoom < 0 || zoom > 22) return null;
    return { center, zoom };
  }
  function readGeoZones(value) {
    if (!value || typeof value !== "object") return null;
    var zones = {};
    var names = /* @__PURE__ */ Object.keys(value);
    for (var index = 0; index < names.length; index += 1) {
      var point = readGeoPoint(value[names[index]]);
      if (!point) return null;
      zones[names[index]] = point;
    }
    return names.length ? zones : null;
  }
  function readGeoPoint(value) {
    if (!value || typeof value !== "object") return null;
    var lat = finiteNumber(value.lat);
    var lon = finiteNumber(value.lon);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) return null;
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) return null;
    return { lat, lon };
  }
  function finiteNumber(value) {
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() !== "") return Number(value);
    return Number.NaN;
  }
  function browserCredential(value) {
    var token = String(value || "").trim();
    return /^[A-Za-z0-9_-]+$/.test(token) ? token : "";
  }
  function vertical(slug, displayName, profile, careNavLabel, weather) {
    return {
      slug,
      displayName,
      profile,
      careNavLabel,
      modules: portalProfiles[profile].modules.slice(),
      defaultRoute: "orders.list",
      weather: weather !== false
    };
  }
  function allowed(value, values, fallback) {
    return values.includes(value) ? value : fallback;
  }
  function splitList(value) {
    return String(value || "").split(",").map(function(item) {
      return item.trim();
    }).filter(Boolean);
  }
  function positiveNumber(value, fallback) {
    var parsed2 = Number(value);
    return Number.isFinite(parsed2) && parsed2 > 0 ? parsed2 : fallback;
  }
  function boundedInteger(value, fallback, minimum, maximum) {
    var parsed2 = Number(value);
    return Number.isInteger(parsed2) && parsed2 >= minimum && parsed2 <= maximum ? parsed2 : fallback;
  }
  function escapeRegExp(value) {
    return value.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
  }

  // app-templates/customer-portal/runtime/src/normalizers/core-record.js
  function text(value) {
    return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
  }
  function positiveInteger(value) {
    var number = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : Number.NaN;
    return Number.isInteger(number) && number > 0 ? number : null;
  }
  function latestStateCode(row) {
    var states = Array.isArray(row && row.states) ? row.states : [];
    var last = states[states.length - 1];
    return text(last && last.code);
  }
  function attributeEntry(row, code) {
    var buckets = row && row.attributes;
    if (!buckets || typeof buckets !== "object") return null;
    var keys = /* @__PURE__ */ Object.keys(buckets);
    for (var index = 0; index < keys.length; index += 1) {
      var bucket2 = buckets[keys[index]];
      if (bucket2 && Object.prototype.hasOwnProperty.call(bucket2, code)) return bucket2[code];
    }
    return null;
  }
  function attributeNumber(row, code) {
    var entry = attributeEntry(row, code);
    return entry ? positiveInteger(entry.value) : null;
  }
  function attributeText(row, code) {
    var entry = attributeEntry(row, code);
    return entry && entry.value != null ? text(entry.value) : "";
  }

  // app-templates/customer-portal/runtime/src/normalizers/overview.js
  var OVERVIEW_STATUS = {
    issue: {
      label: "Issue Opened",
      copy: "Your request is being reviewed. We\u2019ll get back to you shortly."
    },
    enroute: {
      label: "En Route",
      copy: "Our team is on the way to this property."
    },
    scheduled: {
      label: "Scheduled",
      copy: "Service is scheduled for this property."
    },
    monitoring: {
      label: "Active Monitoring",
      copy: "We\u2019re monitoring conditions and will dispatch service when needed."
    }
  };
  var OPEN_TICKET_STATES = ["SUBMITTED", "IN_PROGRESS", "ESCALATED"];
  function propertyStatus(property) {
    var ticket = property && property.ticket;
    if (ticket && OPEN_TICKET_STATES.indexOf(ticket.state) !== -1) return "issue";
    var appointment = property && property.appointment;
    if (appointment && appointment.state === "IN_PROGRESS") return "enroute";
    if (appointment && appointment.state === "SCHEDULED") return "scheduled";
    return "monitoring";
  }
  function propertyWeather(property, frame) {
    if (propertyStatus(property) === "issue") return "issue";
    return zoneWeather(property, frame);
  }
  function zoneWeather(property, frame) {
    var zones = frame && frame.zones || null;
    var zone = property && property.zone;
    if (zones && zone && zones[zone]) return zones[zone];
    return frame && frame.kind || "clear";
  }
  function clampFrameIndex(timeline, index) {
    var total = timeline && timeline.length || 0;
    if (!total) return 0;
    if (index < 0) return 0;
    if (index > total - 1) return total - 1;
    return index;
  }
  function serviceDayCount(properties, dayIndex) {
    if (!properties || !Number.isFinite(dayIndex)) return 0;
    return properties.filter(function(property) {
      return property.appointment && property.appointment.dayIndex === dayIndex;
    }).length;
  }
  function appointmentDay(appointment, timeline) {
    var frame = appointment && Number.isFinite(appointment.dayIndex) && timeline && timeline[appointment.dayIndex];
    return frame ? frame.day + " " + frame.date : "";
  }
  function sectionAvailable(model, section) {
    return !!model && sourceOpened(model.sources, section);
  }
  function sourceOpened(sources, section) {
    return !sources || sources[section] === "ready";
  }
  var PROPERTY_STATUS_SOURCES = ["appointments", "support", "contracts"];
  function propertyStatusKnown(sources) {
    return PROPERTY_STATUS_SOURCES.every(function(section) {
      return sourceOpened(sources, section);
    });
  }
  function knownPropertyStatus(property, sources) {
    return propertyStatusKnown(sources) ? propertyStatus(property) : null;
  }
  function invoiceBuckets(invoices) {
    var outstanding = invoices && invoices.outstanding || [];
    var paid = invoices && invoices.paidThisMonth || [];
    var overdue = outstanding.filter(function(invoice) {
      return invoice.state === "OVERDUE";
    });
    var thisMonth = outstanding.filter(function(invoice) {
      return invoice.state === "DUE_THIS_MONTH";
    });
    return {
      overdue: bucket(overdue),
      outstanding: bucket(outstanding),
      dueThisMonth: bucket(thisMonth),
      paidThisMonth: bucket(paid)
    };
  }
  function bucket(rows2) {
    return {
      count: rows2.length,
      amount: rows2.reduce(function(running, invoice) {
        return running + (Number(invoice.amount) || 0);
      }, 0)
    };
  }
  function money(amount) {
    return "$" + Number(amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function formatArea(squareFeet) {
    return Number.isFinite(squareFeet) && squareFeet > 0 ? new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(squareFeet) + " ft\xB2" : "";
  }
  function propertyHighlights(property) {
    return [formatArea(property && property.areaSqft), property && property.planId ? "Plan approved" : ""].filter(Boolean);
  }

  // app-templates/customer-portal/runtime/src/normalizers/weather.js
  var DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var SNOW_CODES = ["S", "SI", "BS", "BY", "WM", "SW"];
  var FREEZING_CODES = ["ZR", "ZL", "ZY", "IP", "IC"];
  var THUNDER_CODES = ["T"];
  var STORM_TEMP_C = -5;
  var STORM_SNOW_CM = 2;
  var STORM_POP = 40;
  var WEATHER_LEGEND = /* @__PURE__ */ Object.freeze([
    /* @__PURE__ */ Object.freeze({ key: "clear", label: "Clear" }),
    /* @__PURE__ */ Object.freeze({ key: "snow", label: "Snow" }),
    /* @__PURE__ */ Object.freeze({ key: "freezing", label: "Freezing rain" }),
    /* @__PURE__ */ Object.freeze({ key: "storm", label: "Storm warning" }),
    /* @__PURE__ */ Object.freeze({ key: "issue", label: "Issue opened" })
  ]);
  function frameDay(date, index) {
    return index === 0 ? "Today" : DAY_NAMES[date.getDay()];
  }
  function frameDate(date) {
    return MONTH_NAMES[date.getMonth()] + " " + date.getDate();
  }
  function periodKind(period) {
    var coded6 = String(period && period.weatherPrimaryCoded || "");
    var precipitation = coded6.split(":")[2] || "";
    if (FREEZING_CODES.indexOf(precipitation) !== -1) return "freezing";
    if (SNOW_CODES.indexOf(precipitation) !== -1) {
      var snow = num(period.snowCM);
      var feels = num(period.minFeelslikeC);
      var stormy = Number.isFinite(snow) && snow >= STORM_SNOW_CM || Number.isFinite(feels) && feels <= STORM_TEMP_C;
      return stormy ? "storm" : "snow";
    }
    if (THUNDER_CODES.indexOf(precipitation) !== -1 && num(period.pop) >= STORM_POP) return "storm";
    return "clear";
  }
  function periodTemp(period) {
    var value = num(period && period.maxTempC);
    if (!Number.isFinite(value)) return "\u2014";
    return (value < 0 ? "\u2212" : "") + Math.abs(Math.round(value)) + "\xB0C";
  }
  function periodStats(period) {
    return [
      { label: "Precipitation", value: statValue(period.pop, "%") },
      { label: "Wind", value: windValue(period) },
      { label: "Feels like", value: tempValue(period.minFeelslikeC) },
      { label: "Humidity", value: statValue(period.humidity, "%") }
    ];
  }
  function periodNote(period) {
    var reading = periodReading(period);
    return [reading.forecast, reading.service].filter(Boolean).join(" \xB7 ");
  }
  function periodForecastNote(period) {
    return periodReading(period).forecast;
  }
  function periodReading(period) {
    var kind = periodKind(period);
    if (kind === "freezing") return { forecast: "Freezing precipitation", service: "de-icing expected" };
    var snow = num(period && period.snowCM);
    if (Number.isFinite(snow) && snow >= STORM_SNOW_CM) return { forecast: "Snowfall " + round1(snow) + " cm forecast", service: "trigger met" };
    if (kind === "storm") {
      var feels = num(period && period.minFeelslikeC);
      if (Number.isFinite(feels) && feels <= STORM_TEMP_C) return { forecast: "Feels like " + tempValue(feels) + " \xB7 refreeze risk overnight", service: "" };
      return { forecast: "Storm risk " + statValue(period && period.pop, "%"), service: "crews on standby" };
    }
    if (Number.isFinite(snow) && snow > 0) return { forecast: "Snowfall " + round1(snow) + " cm forecast", service: "below the 2 cm trigger" };
    return { forecast: "", service: "Below the service trigger" };
  }
  function forecastDay(period) {
    return {
      kind: periodKind(period),
      temp: periodTemp(period),
      phrase: String(period && period.weather || "").split(",")[0],
      note: periodNote(period),
      forecastNote: periodForecastNote(period)
    };
  }
  function buildTimeline(zonePeriods, zoneOrder) {
    var lead2 = zonePeriods[zoneOrder[0]];
    if (!Array.isArray(lead2) || !lead2.length) throw new Error("The lead zone returned no periods");
    return lead2.map(function(period, index) {
      var date = periodDate(period);
      var zones = {};
      var candidates = [];
      zoneOrder.forEach(function(zone) {
        var periods = zonePeriods[zone];
        var match = Array.isArray(periods) && periods[index] || period;
        zones[zone] = periodKind(match);
        candidates.push(match);
      });
      var headline = worstPeriod(candidates);
      return {
        day: frameDay(date, index),
        date: frameDate(date),
        kind: periodKind(headline),
        temp: periodTemp(headline),
        label: String(headline.weather || "").split(",")[0] || "Forecast",
        note: periodNote(headline),
        forecastNote: periodForecastNote(headline),
        stats: periodStats(headline),
        zones
      };
    });
  }
  var SEVERITY = { clear: 0, snow: 1, freezing: 2, storm: 3 };
  function worstPeriod(periods) {
    return periods.reduce(function(running, period) {
      var severity = SEVERITY[periodKind(period)];
      var runningSeverity = SEVERITY[periodKind(running)];
      if (severity !== runningSeverity) return severity > runningSeverity ? period : running;
      return (num(period.snowCM) || 0) > (num(running.snowCM) || 0) ? period : running;
    });
  }
  function periodDate(period) {
    var seconds = num(period && period.timestamp);
    if (Number.isFinite(seconds)) return new Date(seconds * 1e3);
    return new Date(String(period && period.dateTimeISO));
  }
  function num(value) {
    if (value === null || value === void 0 || value === "") return Number.NaN;
    return Number(value);
  }
  function round1(value) {
    return Math.round(value * 10) / 10;
  }
  function statValue(value, unit) {
    var number = num(value);
    return Number.isFinite(number) ? Math.round(number) + unit : "\u2014";
  }
  function tempValue(value) {
    var number = num(value);
    if (!Number.isFinite(number)) return "\u2014";
    return (number < 0 ? "\u2212" : "") + Math.abs(Math.round(number)) + "\xB0C";
  }
  function windValue(period) {
    var speed = num(period && period.windSpeedMaxKPH);
    if (!Number.isFinite(speed)) speed = num(period && period.windSpeedKPH);
    if (!Number.isFinite(speed)) return "\u2014";
    var direction = period && (period.windDirMax || period.windDir);
    return Math.round(speed) + " km/h" + (direction ? " " + direction : "");
  }

  // app-templates/customer-portal/runtime/src/normalizers/property-map.js
  var POPUP_WIDTH = 288;
  var POPUP_HEIGHT = 250;
  var PIN_HEIGHT = 36;
  var PIN_HALF_WIDTH = 18;
  var GAP = 10;
  var EDGE = 8;
  var LOWER_PART = 0.55;
  var FORECAST_DECIMALS = 2;
  function geoPoint(lat, lon) {
    var latitude = coordinate(lat, 90);
    var longitude = coordinate(lon, 180);
    if (latitude === null || longitude === null) return null;
    if (latitude === 0 && longitude === 0) return null;
    return { lat: latitude, lon: longitude };
  }
  function propertyPoint(property) {
    return property ? geoPoint(property.lat, property.lon) : null;
  }
  function addressKey(address) {
    if (typeof address !== "string") return "";
    return address.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").replace(/\s*,\s*/g, ", ").replace(/^[\s,]+|[\s,]+$/g, "");
  }
  function forecastPoint(point) {
    var factor = Math.pow(10, FORECAST_DECIMALS);
    return { lat: Math.round(point.lat * factor) / factor, lon: Math.round(point.lon * factor) / factor };
  }
  function weatherLabel(kind, legend) {
    var items = legend && legend.length ? legend : WEATHER_LEGEND;
    var match = items.find(function(item) {
      return item.key === kind;
    });
    return match ? match.label : "";
  }
  function weatherReading(kind, frame, legend) {
    if (frame && kind === frame.kind && frame.label) return frame.label;
    return weatherLabel(kind, legend);
  }
  function popupWeather(frame, zoneKind, source, entry, index, sources) {
    var day = frame.day + " " + frame.date;
    if (entry && entry.state === "loading") return { state: "loading", day, source: "xweather" };
    var own2 = entry && entry.state === "ready" && Array.isArray(entry.days) ? entry.days[index] : null;
    if (own2) {
      var note = sourceOpened(sources, "contracts") ? own2.note : own2.forecastNote || "";
      return { state: "property", day, kind: own2.kind, temp: own2.temp, phrase: own2.phrase, note, source: "xweather" };
    }
    return {
      state: entry && entry.state === "failed" ? "failed" : "area",
      day,
      kind: zoneKind,
      temp: frame.temp,
      phrase: zoneKind === frame.kind ? frame.label || "" : "",
      note: "",
      source: source === "xweather" ? "xweather" : "sample"
    };
  }
  function popupDocks(frameWidth) {
    return frameWidth > 0 && frameWidth < 2 * (POPUP_WIDTH + PIN_HALF_WIDTH + GAP + EDGE);
  }
  function popupPlacement(anchor, frame, size) {
    var width = size && size.width > 0 ? size.width : POPUP_WIDTH;
    var height = size && size.height > 0 ? size.height : POPUP_HEIGHT;
    var room = {
      below: frame.height - EDGE - anchor.y - GAP,
      above: anchor.y - PIN_HEIGHT - GAP - EDGE,
      right: frame.width - EDGE - anchor.x - PIN_HALF_WIDTH - GAP,
      left: anchor.x - PIN_HALF_WIDTH - GAP - EDGE
    };
    var preferred = anchor.y > frame.height * LOWER_PART ? "above" : "below";
    var other = preferred === "above" ? "below" : "above";
    var side = height <= room[preferred] ? preferred : height <= room[other] ? other : width <= Math.max(room.right, room.left) ? room.right >= room.left ? "right" : "left" : preferred;
    var top = side === "above" ? anchor.y - PIN_HEIGHT - GAP - height : side === "below" ? anchor.y + GAP : anchor.y - PIN_HEIGHT / 2 - height / 2;
    var left = side === "right" ? anchor.x + PIN_HALF_WIDTH + GAP : side === "left" ? anchor.x - PIN_HALF_WIDTH - GAP - width : anchor.x - width / 2;
    return {
      side,
      left: clamp(left, EDGE, frame.width - width - EDGE),
      top: clamp(top, EDGE, frame.height - height - EDGE)
    };
  }
  function coordinate(value, limit) {
    var number = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : Number.NaN;
    return Number.isFinite(number) && Math.abs(number) <= limit ? number : null;
  }
  function clamp(value, low, high) {
    if (high < low) return low;
    return Math.min(Math.max(value, low), high);
  }

  // app-templates/customer-portal/runtime/src/normalizers/postal-address.js
  var POSTAL_CODE = /^(?:[A-Z]\d[A-Z] ?\d[A-Z]\d|\d{5}(?:-\d{4})?)$/i;
  var COUNTRY_CODE = /^[A-Z]{2}$/;
  var REGION_CODE = /^[A-Z]{2,3}$/;
  var NORTH_AMERICAN_PHONE = /^\+?1(\d{3})(\d{3})(\d{4})$/;
  var PHONE_PUNCTUATION = /[\s().-]/g;
  function formatPostalAddress(address) {
    if (!address || typeof address !== "object") return "";
    return formatAddressParts({
      lines: [address.address1, address.address2],
      city: address.city,
      region: address.state && typeof address.state === "object" ? address.state.code : "",
      postalCode: address.postalCode,
      country: address.country && typeof address.country === "object" ? address.country.code || address.country.id : ""
    });
  }
  function formatAddressLine(value) {
    return formatAddressParts({ lines: [value] });
  }
  function formatAddressParts(parts) {
    var segments = [];
    var country = plain(parts.country);
    appendSegments(segments, parts.lines || []);
    var last = segments[segments.length - 1];
    if (last && COUNTRY_CODE.test(last) && segments.slice(0, -1).some(isPostalCode)) {
      country = country || last;
      segments.pop();
    }
    appendSegments(segments, [parts.city, parts.region]);
    var postal = plain(parts.postalCode) || segments.filter(isPostalCode).pop() || "";
    if (postal) {
      segments = segments.filter(function(segment) {
        return comparable(segment) !== comparable(postal);
      });
      if (segments.some(function(segment) {
        return comparable(segment).indexOf(comparable(postal)) !== -1;
      })) postal = "";
    }
    if (country) {
      segments = segments.filter(function(segment) {
        return comparable(segment) !== comparable(country);
      });
    }
    last = segments[segments.length - 1];
    if (postal && last && REGION_CODE.test(last)) {
      segments[segments.length - 1] = last + " " + postal;
      postal = "";
    }
    if (postal) segments.push(postal);
    if (country) segments.push(countryName(country));
    return segments.join(", ");
  }
  function addressRepeats(title, address) {
    var street = comparable(plain(address).split(",")[0]);
    return !!street && comparable(title).indexOf(street) !== -1;
  }
  function formatPhone(value) {
    var stored = plain(value);
    var match = NORTH_AMERICAN_PHONE.exec(stored.replace(PHONE_PUNCTUATION, ""));
    return match ? "+1 " + match[1] + "-" + match[2] + "-" + match[3] : stored;
  }
  function countryName(code) {
    var value = plain(code);
    if (!COUNTRY_CODE.test(value)) return value;
    try {
      var name = new Intl.DisplayNames(["en"], { type: "region" }).of(value);
      return name || value;
    } catch (_) {
      return value;
    }
  }
  function appendSegments(segments, values) {
    values.forEach(function(value) {
      plain(value).split(",").forEach(function(piece) {
        var segment = piece.replace(/\s+/g, " ").trim();
        if (segment && !segments.some(function(known) {
          return comparable(known) === comparable(segment);
        })) segments.push(segment);
      });
    });
  }
  function isPostalCode(segment) {
    return POSTAL_CODE.test(segment);
  }
  function comparable(value) {
    return plain(value).toLowerCase().replace(/[^a-z0-9]/g, "");
  }
  function plain(value) {
    if (typeof value === "string") return value.trim();
    return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
  }

  // app-templates/customer-portal/runtime/src/normalizers/contracts.js
  var QUOTE_ORDER_TYPES = /* @__PURE__ */ Object.freeze(["FIELD_SERVICE_ORDER", "WINTER_SERVICES_ORDER"]);
  var CUSTOMER_ORDER_STATUS = /* @__PURE__ */ Object.freeze({
    CLIENT_APPROVED: "approved",
    CUSTOMER_CHANGES_REQUESTED: "revision",
    DECLINED: "declined",
    QUOTE_SENT: "unseen",
    QUOTE_VIEWED: "viewed"
  });
  var OPERATOR_ORDER_STATES = /* @__PURE__ */ Object.freeze(["CHANGES_REQUESTED", "INITIAL", "QUOTE_APPROVED_INTERNALLY", "QUOTE_PREPARED"]);
  var PRICING_MODELS = /* @__PURE__ */ Object.freeze({
    PER_SERVICE: "Per service",
    MONTHLY: "Monthly",
    SEASONAL: "Seasonal"
  });
  var RECURRING_MODEL = /* @__PURE__ */ Object.freeze({ code: "RECURRING", label: "Recurring" });
  var PRICE_PERIODS = /* @__PURE__ */ Object.freeze({
    PER_SERVICE: "per visit",
    MONTHLY: "/ month",
    SEASONAL: "per season"
  });
  var CLIENT_TYPES = /* @__PURE__ */ Object.freeze({
    INDIVIDUAL: "Individual",
    ORGANIZATION: "Organization"
  });
  var SCOPE_MODES = /* @__PURE__ */ Object.freeze(["server-scoped", "browser-filtered", "unscoped"]);
  var ORDER_ACTIONS = { unseen: ["view"], viewed: ["approve", "decline"] };
  var PRICING_MODEL_RANK = ["PER_SERVICE", "MONTHLY", "SEASONAL", RECURRING_MODEL.code];
  var MONTH_UNIT = "MONTH";
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var SCHEMATIC_X = [18, 82];
  var SCHEMATIC_Y = [24, 76];
  var SCHEMATIC_MIN_SPAN = 0.01;
  var STAGE_ORDER = ["approval", "review", "details", "drafting", "approved", "active", "suspended", "expired", "archived", "canceled"];
  var QUOTE_STAGES = ["preparing", "review"];
  var APPROVED_SERVICE_STAGES = ["details", "drafting", "approval", "approved", "active", "suspended", "expired", "archived"];
  var CURRENT_SERVICE_STAGES = ["active", "approved", "approval", "drafting", "details", "suspended"];
  var PENDING_STATUSES = ["unseen", "viewed", "revision"];
  var TERMS_DEPTH_LIMIT = 4;
  var HEADING_LINE = /^#{1,6}\s+(.+)$/;
  var ITEM_LINE = /^[-*•]\s+(.+)$/;
  var NUMBERED_LINE = /^(\d+(?:\.\d+)+[.)]?|\d+[.)])\s+(.+)$/;
  var PREPARING = agreementStage("preparing", "", "");
  var DRAFTING = agreementStage("drafting", "Agreement in preparation", "scheduled");
  var APPROVED = agreementStage("approved", "Approved", "ok");
  var AGREEMENT_STAGES = /* @__PURE__ */ Object.freeze({
    QUOTATION: PREPARING,
    QUOTATION_SEND_FAILED: PREPARING,
    QUOTATION_SENT: agreementStage("review", "Awaiting your decisions", "info"),
    AWAITING_CLIENT_DETAILS: agreementStage("details", "Contract details needed", "warn"),
    CLIENT_DETAILS_RECEIVED: DRAFTING,
    DRAFT: DRAFTING,
    PENDING_MANAGEMENT_APPROVAL: DRAFTING,
    INTERNALLY_APPROVED: DRAFTING,
    AGREEMENT_SEND_FAILED: DRAFTING,
    SENT_TO_CLIENT: agreementStage("approval", "Ready for your approval", "warn"),
    CLIENT_APPROVED: APPROVED,
    ACTIVATION_FAILED: APPROVED,
    ACTIVE: agreementStage("active", "Active", "ok"),
    SUSPENDED: agreementStage("suspended", "Suspended", "warn"),
    EXPIRED: agreementStage("expired", "Expired", "scheduled"),
    ARCHIVED: agreementStage("archived", "Archived", "scheduled"),
    CANCELED: agreementStage("canceled", "Cancelled", "scheduled")
  });
  function normalizeContracts(raw) {
    var source = raw && typeof raw === "object" ? raw : {};
    var reads = source.reads && typeof source.reads === "object" ? source.reads : {};
    var catalog = {
      orderItems: readRows(source.orderItems),
      productPrices: readRows(source.productPrices),
      products: readRows(source.products)
    };
    var quotes = normalizeQuoteOrders(source.quoteOrders, catalog);
    var agreementRows = readRows(source.agreements);
    var agreements = (agreementRows || []).map(function(row) {
      return normalizeServiceAgreement(row, source.client);
    }).filter(Boolean);
    var orderRows = readRows(source.quoteOrders);
    return {
      accountId: positiveInteger(source.accountId),
      scopeMode: scopeModeOf(source.scopeMode),
      reads: readSummaries(reads),
      agreements,
      orders: quotes.orders,
      withheldBackendIds: quotes.withheldBackendIds,
      preparing: quotes.preparing || agreements.some(function(agreement) {
        return agreement.stage === "preparing";
      }),
      sources: {
        agreements: agreementRows ? "ready" : failedRead(reads.agreements),
        orders: orderRows ? "ready" : failedRead(reads.orders),
        lines: catalog.orderItems ? "ready" : failedRead(reads.orderItems),
        prices: catalog.productPrices ? "ready" : failedRead(reads.productPrices),
        products: catalog.products ? "ready" : failedRead(reads.products)
      },
      truncated: (/* @__PURE__ */ Object.keys(reads)).some(function(key) {
        return !!(reads[key] && reads[key].truncated);
      })
    };
  }
  function normalizeQuoteOrders(payload, catalog) {
    var lines = lineCatalog(catalog);
    var orders = [];
    var withheld = [];
    var preparing = false;
    listRows(payload).forEach(function(row) {
      if (!row || typeof row !== "object") return;
      if (QUOTE_ORDER_TYPES.indexOf(text(row.type && row.type.code)) === -1) return;
      var backendId = positiveInteger(row.id);
      if (!backendId) return;
      var stateCode = latestStateCode(row);
      var status = own(CUSTOMER_ORDER_STATUS, stateCode);
      if (!status) {
        if (OPERATOR_ORDER_STATES.indexOf(stateCode) !== -1) {
          preparing = true;
          withheld.push(backendId);
        }
        return;
      }
      var currency = currencyCode(row.currency);
      var total = orderTotal(row.grandTotal, row.currency);
      var quoteLines = linesOf(row, backendId, currency, lines);
      orders.push({
        id: "quote-core-" + backendId,
        backendId,
        propertyBackendId: attributeNumber(row, "SERVICE_PROPERTY"),
        stateCode,
        status,
        pricingModel: attributeModel(row) || priceVariant(backendId, lines),
        total,
        money: total ? {
          subtotal: formatMoney(row.totalCharges, currency),
          taxes: formatMoney(row.totalTaxes, currency),
          total: formatMoney(row.grandTotal, currency),
          taxFree: finiteNumber2(row.totalTaxes) === 0
        } : null,
        lines: quoteLines.lines,
        linesState: quoteLines.state,
        allowedActions: (ORDER_ACTIONS[status] || []).slice()
      });
    });
    return { orders, preparing, withheldBackendIds: withheld };
  }
  function normalizeServiceAgreement(document2, client) {
    if (!document2 || typeof document2 !== "object") return null;
    if (text(document2.type && document2.type.code) !== "SERVICE_AGREEMENT") return null;
    var backendId = positiveInteger(document2.id);
    var stateCode = latestStateCode(document2);
    var stage = own(AGREEMENT_STAGES, stateCode);
    if (!backendId || !stage) return null;
    return {
      id: "agreement-core-" + backendId,
      backendId,
      stateCode,
      stage: stage.stage,
      label: stage.label,
      tone: stage.tone,
      orderBackendIds: attributeIds(document2, "ORDERS"),
      effectiveDate: isoDate(attributeText(document2, "EFFECTIVE_DATE")),
      term: datePeriod(attributeText(document2, "TERM_START_DATE"), attributeText(document2, "TERM_END_DATE")),
      parties: agreementParties(document2, client),
      terms: termsBlocks(attributeString(document2, "CONTRACT_TERMS")),
      allowedActions: stateCode === "SENT_TO_CLIENT" ? ["approve"] : []
    };
  }
  function contractsPackage(source, properties) {
    var data = source && typeof source === "object" ? source : {};
    var orders = Array.isArray(data.orders) ? data.orders : [];
    var agreements = Array.isArray(data.agreements) ? data.agreements.filter(Boolean) : [];
    var byProperty = propertyIndex(properties);
    var packageOf = packageIndex(agreements);
    var readable = new Set(orders.map(function(order) {
      return order.backendId;
    }).concat(data.withheldBackendIds || []));
    var quoted = orders.filter(function(order) {
      var owner = packageOf.get(order.backendId);
      return isOpen(order) || !owner || QUOTE_STAGES.indexOf(owner.stage) !== -1;
    });
    var groups = quoteGroups(quoted, packageOf, byProperty);
    var pending = groups.map(function(group) {
      var waiting = group.orders.filter(function(order) {
        return PENDING_STATUSES.indexOf(order.status) !== -1;
      });
      return waiting.length ? Object.assign({}, group, { orders: waiting }) : null;
    }).filter(Boolean);
    var counts = { orders: quoted.length, properties: 0, decided: 0, approved: 0, revision: 0, declined: 0, open: 0 };
    groups.forEach(function(group) {
      if (!group.propertyBackendId) return;
      counts.properties += 1;
      if (group.decision === "approved" || group.decision === "declined") counts.decided += 1;
    });
    quoted.forEach(function(order) {
      if (isOpen(order)) counts.open += 1;
      else counts[order.status] += 1;
    });
    var rows2 = agreements.filter(function(agreement) {
      return agreement.stage !== "preparing";
    }).map(function(agreement) {
      return agreementRow(agreement, orders, readable, byProperty);
    }).sort(byStage);
    return {
      agreements: rows2,
      groups,
      pending,
      counts,
      deciding: counts.open > 0,
      preparing: !!data.preparing,
      sources: data.sources || {},
      truncated: !!data.truncated,
      scopeMode: data.scopeMode || null,
      partial: partialOf(data, orders, rows2)
    };
  }
  function pricePeriod(order) {
    return order && order.pricingModel ? own(PRICE_PERIODS, order.pricingModel.code) || "" : "";
  }
  function formatOrderPrice(order) {
    var total = formatOrderTotal(order && order.total);
    var period = pricePeriod(order);
    return total && period ? total + " " + period : total;
  }
  function optionSummary(order) {
    return [order.pricingModel ? order.pricingModel.label : "", formatOrderPrice(order)].filter(Boolean).join(" \xB7 ");
  }
  function chosenOrders(row) {
    if (!row || row.servicesScope !== "approved") return [];
    return row.properties.reduce(function(found, entry) {
      return found.concat(entry.orders);
    }, []);
  }
  function currentServiceAgreement(pkg, propertyBackendId) {
    var rows2 = (pkg && Array.isArray(pkg.agreements) ? pkg.agreements : []).filter(function(row) {
      if (CURRENT_SERVICE_STAGES.indexOf(row.agreement.stage) === -1 || row.servicesScope !== "approved") return false;
      return propertyBackendId == null || row.properties.some(function(entry) {
        return entry.propertyBackendId === propertyBackendId;
      });
    });
    return rows2.find(function(row) {
      return row.agreement.stage === "active";
    }) || rows2[0] || null;
  }
  function activeServiceNames(pkg, propertyBackendId) {
    var row = currentServiceAgreement(pkg, propertyBackendId);
    if (!row || row.agreement.stage !== "active") return [];
    var entry = row.properties.find(function(item) {
      return item.propertyBackendId === propertyBackendId;
    });
    var names = [];
    (entry ? entry.orders : []).forEach(function(order) {
      order.lines.forEach(function(line) {
        if (line.product && names.indexOf(line.product) === -1) names.push(line.product);
      });
    });
    return names;
  }
  function groupDecision(orders) {
    var list = orders || [];
    if (list.some(hasStatus("approved"))) return "approved";
    if (list.length && list.every(hasStatus("declined"))) return "declined";
    if (list.some(hasStatus("revision"))) return "revision";
    return "open";
  }
  function groupStatus(orders) {
    var decision = groupDecision(orders);
    if (decision !== "open") return decision;
    return (orders || []).some(hasStatus("viewed")) ? "viewed" : "unseen";
  }
  function findQuote(pkg, backendId) {
    var groups = pkg && Array.isArray(pkg.groups) ? pkg.groups : [];
    for (var index = 0; index < groups.length; index += 1) {
      var found = groups[index].orders.find(function(order) {
        return order.backendId === backendId;
      });
      if (found) return found;
    }
    var rows2 = pkg && Array.isArray(pkg.agreements) ? pkg.agreements : [];
    for (var position = 0; position < rows2.length; position += 1) {
      var listed = rows2[position].orders.find(function(order) {
        return order.backendId === backendId;
      });
      if (listed) return listed;
    }
    return null;
  }
  function findAgreement(pkg, backendId) {
    var rows2 = pkg && Array.isArray(pkg.agreements) ? pkg.agreements : [];
    return rows2.find(function(row) {
      return row.agreement.backendId === backendId;
    }) || null;
  }
  function termsBlocks(value) {
    var source = typeof value === "string" ? value.replace(/\r\n?/g, "\n") : "";
    if (!source.trim()) return [];
    if (/<\/?[a-z][^>]*>/i.test(source)) source = htmlToText(source);
    var blocks = [];
    var section = 0;
    var outline = 0;
    source.split(/\n[ \t]*\n+/).forEach(function(chunk) {
      var paragraph = [];
      function flush() {
        if (paragraph.length) blocks.push({ kind: "paragraph", text: paragraph.join("\n"), depth: section });
        paragraph = [];
      }
      chunk.split("\n").forEach(function(line) {
        var trimmed = line.replace(/\s+/g, " ").trim();
        if (!trimmed) return;
        var heading = HEADING_LINE.exec(trimmed);
        var numbered = NUMBERED_LINE.exec(trimmed);
        var item = ITEM_LINE.exec(trimmed);
        if (heading) {
          flush();
          section = 0;
          outline = 0;
          blocks.push({ kind: "heading", text: heading[1] });
        } else if (numbered) {
          flush();
          var segments = numbered[1].split(/[.)]/).filter(Boolean).length;
          var nested = /\)$/.test(numbered[1]) && segments === 1;
          section = Math.min(nested ? outline + 1 : segments, TERMS_DEPTH_LIMIT);
          if (!nested) outline = section;
          blocks.push({ kind: "numbered", marker: numbered[1], text: numbered[2], depth: section });
        } else if (item) {
          flush();
          blocks.push({ kind: "item", text: item[1], depth: section });
        } else {
          paragraph.push(trimmed);
        }
      });
      flush();
    });
    return blocks;
  }
  function schematicPositions(points) {
    var valid = (points || []).map(function(point) {
      return point ? geoPoint(point.lat, point.lon) : null;
    });
    var placed = valid.filter(Boolean);
    if (!placed.length) return valid;
    var box = placed.reduce(function(bounds, point) {
      return {
        north: Math.max(bounds.north, point.lat),
        south: Math.min(bounds.south, point.lat),
        east: Math.max(bounds.east, point.lon),
        west: Math.min(bounds.west, point.lon)
      };
    }, { north: -Infinity, south: Infinity, east: -Infinity, west: Infinity });
    var latSpan = Math.max(box.north - box.south, SCHEMATIC_MIN_SPAN);
    var lonSpan = Math.max(box.east - box.west, SCHEMATIC_MIN_SPAN);
    var midLat = (box.north + box.south) / 2;
    var midLon = (box.east + box.west) / 2;
    return valid.map(function(point) {
      if (!point) return null;
      return {
        x: tenths(50 + (point.lon - midLon) / lonSpan * (SCHEMATIC_X[1] - SCHEMATIC_X[0])),
        y: tenths(50 - (point.lat - midLat) / latSpan * (SCHEMATIC_Y[1] - SCHEMATIC_Y[0]))
      };
    });
  }
  function formatOrderTotal(total) {
    if (!total) return "";
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: total.currency }).format(total.amount);
    } catch (_) {
      return "";
    }
  }
  function formatMoney(value, currency) {
    var number = finiteNumber2(value);
    if (number === null) return "";
    var code = /^[A-Z]{3}$/.test(text(currency)) ? text(currency) : "";
    try {
      if (code) return new Intl.NumberFormat("en-US", { style: "currency", currency: code, minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(number);
    } catch (_) {
      code = "";
    }
    return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(number);
  }
  function formatIsoDate(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text(value));
    return match ? MONTHS[Number(match[2]) - 1] + " " + Number(match[3]) + ", " + match[1] : "";
  }
  function formatDatePeriod(period) {
    return period ? formatIsoDate(period.start) + " \u2013 " + formatIsoDate(period.end) : "";
  }
  function quoteGroups(orders, packageOf, byProperty) {
    var groups = [];
    var keyed = /* @__PURE__ */ new Map();
    orders.forEach(function(order) {
      var owner = packageOf.get(order.backendId) || null;
      var agreementId = owner ? owner.backendId : 0;
      var propertyId = order.propertyBackendId || 0;
      var key = agreementId + "-" + propertyId;
      var group = keyed.get(key);
      if (!group) {
        var property = propertyId ? byProperty.get(propertyId) || null : null;
        group = {
          id: "quote-" + key,
          property,
          propertyBackendId: propertyId || null,
          agreement: owner,
          agreementBackendId: agreementId || null,
          orders: [],
          decision: "open",
          title: "",
          address: ""
        };
        keyed.set(key, group);
        groups.push(group);
      }
      group.orders.push(order);
    });
    groups.forEach(function(group) {
      group.orders.sort(byPricingModel);
      group.decision = groupDecision(group.orders);
      group.status = groupStatus(group.orders);
      group.title = propertyTitle(group.propertyBackendId, group.property);
      group.address = propertyAddress(group.property, group.title);
    });
    return groups.sort(function(left, right) {
      return stageRank(left.agreement) - stageRank(right.agreement) || (right.agreementBackendId || 0) - (left.agreementBackendId || 0);
    });
  }
  function agreementRow(agreement, orders, readable, byProperty) {
    var listed = orders.filter(function(order) {
      return agreement.orderBackendIds.indexOf(order.backendId) !== -1;
    });
    var services = APPROVED_SERVICE_STAGES.indexOf(agreement.stage) !== -1 ? listed.filter(hasStatus("approved")) : listed;
    var properties = [];
    var keyed = /* @__PURE__ */ new Map();
    services.forEach(function(order) {
      var key = order.propertyBackendId || 0;
      var entry = keyed.get(key);
      if (!entry) {
        var property = key ? byProperty.get(key) || null : null;
        entry = { key: "property-" + key, propertyBackendId: key || null, property, orders: [], title: "", address: "" };
        keyed.set(key, entry);
        properties.push(entry);
      }
      entry.orders.push(order);
    });
    properties.forEach(function(entry) {
      entry.orders.sort(byPricingModel);
      entry.title = propertyTitle(entry.propertyBackendId, entry.property);
      entry.address = propertyAddress(entry.property, entry.title);
    });
    var named = [];
    listed.forEach(function(order) {
      var property = order.propertyBackendId ? byProperty.get(order.propertyBackendId) : null;
      var name = property && property.name ? property.name : "";
      if (name && named.indexOf(name) === -1) named.push(name);
    });
    var propertyIds = [];
    listed.forEach(function(order) {
      if (order.propertyBackendId && propertyIds.indexOf(order.propertyBackendId) === -1) propertyIds.push(order.propertyBackendId);
    });
    return {
      id: agreement.id,
      agreement,
      orders: listed,
      properties,
      servicesScope: APPROVED_SERVICE_STAGES.indexOf(agreement.stage) !== -1 ? "approved" : "listed",
      propertyNames: named,
      propertyCount: propertyIds.length,
      quoteCount: listed.length,
      unreadableOrders: agreement.orderBackendIds.filter(function(id) {
        return !readable.has(id);
      }).length
    };
  }
  function partialOf(data, orders, rows2) {
    var sources = data.sources || {};
    var lines = orders.some(function(order) {
      return order.linesState !== "ready";
    });
    var unreadableOrders = rows2.reduce(function(sum, row) {
      return sum + row.unreadableOrders;
    }, 0);
    return {
      agreements: !!sources.agreements && sources.agreements !== "ready",
      orders: !!sources.orders && sources.orders !== "ready",
      lines,
      unreadableOrders,
      truncated: !!data.truncated
    };
  }
  function agreementParties(document2, client) {
    var owner = document2.organization;
    var first = attributeString(document2, "REPRESENTATIVE_FIRST_NAME");
    var last = attributeString(document2, "REPRESENTATIVE_LAST_NAME");
    return {
      provider: {
        legalName: attributeString(document2, "PROVIDER_LEGAL_NAME") || localizedName(owner && owner.nls),
        representativeName: attributeString(document2, "PROVIDER_REPRESENTATIVE_NAME"),
        representativeJobTitle: attributeString(document2, "PROVIDER_REPRESENTATIVE_JOB_TITLE"),
        phone: formatPhone(attributeString(document2, "PROVIDER_CONTACT_PHONE")),
        email: attributeString(document2, "PROVIDER_CONTACT_EMAIL")
      },
      client: {
        legalName: attributeString(document2, "LEGAL_NAME") || text(client && typeof client.displayName === "string" ? client.displayName : ""),
        clientType: own(CLIENT_TYPES, attributeString(document2, "CLIENT_TYPE")) || "",
        billingAddress: formatAddressLine(attributeString(document2, "BILLING_ADDRESS")),
        representativeName: [first, last].filter(Boolean).join(" "),
        representativeJobTitle: attributeString(document2, "REPRESENTATIVE_JOB_TITLE"),
        email: attributeString(document2, "REPRESENTATIVE_EMAIL"),
        phone: formatPhone(attributeString(document2, "REPRESENTATIVE_PHONE"))
      }
    };
  }
  function linesOf(row, backendId, currency, catalog) {
    if (!catalog.items) return { state: "unavailable", lines: [] };
    var found = (catalog.byOrder.get(backendId) || []).slice();
    var listed = idList(row.items);
    var missing = listed.filter(function(id) {
      return !found.some(function(line) {
        return line.backendId === id;
      });
    }).length;
    var incomplete = false;
    var lines = found.sort(function(left, right) {
      return rankOf(left) - rankOf(right) || left.position - right.position;
    }).map(function(entry) {
      var line = entry.row;
      var priceId = positiveInteger(line.itemPrice && line.itemPrice.id);
      var price = priceId && catalog.prices ? catalog.prices.get(priceId) || null : null;
      var productId = positiveInteger(price && price.product && price.product.id);
      var product = productId && catalog.products ? catalog.products.get(productId) || null : null;
      if (priceId && !price || productId && !product) incomplete = true;
      return {
        key: "line-" + entry.backendId,
        product: localizedName(product && product.nls),
        quantity: formatQuantity(line.itemCount),
        unitPrice: formatMoney(line.amount, currency),
        total: formatMoney(line.grandTotal, currency)
      };
    });
    return { state: missing || incomplete ? "partial" : "ready", lines };
  }
  function attributeModel(row) {
    var code = attributeText(row, "PRICING_MODEL");
    var label = own(PRICING_MODELS, code);
    return label ? { code, label } : null;
  }
  function priceVariant(backendId, catalog) {
    var entries = catalog.byOrder.get(backendId) || [];
    if (!entries.length || !catalog.prices) return null;
    var prices = entries.map(function(entry) {
      return catalog.prices.get(positiveInteger(entry.row.itemPrice && entry.row.itemPrice.id)) || null;
    });
    var names = prices.map(function(price) {
      return localizedName(price && price.nls);
    });
    var name = names[0] && names.every(function(entry) {
      return entry === names[0];
    }) ? names[0] : "";
    var types = prices.map(function(price) {
      return text(price && price.type && price.type.code).toUpperCase();
    });
    var recurrent = types.filter(function(type) {
      return /(^|_)RECURRENT$/.test(type);
    }).length;
    var code = "";
    if (types.every(Boolean) && recurrent === 0) code = "PER_SERVICE";
    if (types.every(Boolean) && recurrent === types.length) code = recurringCode(entries.map(function(entry) {
      return intervalMonths(entry.row.metadata);
    }));
    if (!code && !name) return null;
    return { code, label: name || own(PRICING_MODELS, code) || RECURRING_MODEL.label };
  }
  function recurringCode(months) {
    var first = months[0];
    if (first === null || !months.every(function(count) {
      return count === first;
    })) return RECURRING_MODEL.code;
    return first === 1 ? "MONTHLY" : "SEASONAL";
  }
  function intervalMonths(metadata) {
    if (!metadata || typeof metadata !== "object") return null;
    if (text(metadata.INTERVAL_UNIT).toUpperCase() !== MONTH_UNIT) return null;
    return positiveInteger(metadata.INTERVAL_COUNT);
  }
  function lineCatalog(catalog) {
    var source = catalog || {};
    var items = source.orderItems ? [] : null;
    var byOrder = /* @__PURE__ */ new Map();
    (source.orderItems || []).forEach(function(row, position) {
      var backendId = positiveInteger(row && row.id);
      var orderId = positiveInteger(row && row.order && row.order.id);
      if (!backendId || !orderId) return;
      var entry = { backendId, position, row };
      items.push(entry);
      var list = byOrder.get(orderId);
      if (!list) byOrder.set(orderId, list = []);
      if (!list.some(function(known) {
        return known.backendId === backendId;
      })) list.push(entry);
    });
    return {
      items,
      byOrder,
      prices: source.productPrices ? rowsById(source.productPrices) : null,
      products: source.products ? rowsById(source.products) : null
    };
  }
  function rankOf(entry) {
    var rank = finiteNumber2(entry.row.sortOrder);
    return rank === null ? Number.MAX_SAFE_INTEGER : rank;
  }
  function readRows(value) {
    if (Array.isArray(value)) return value;
    return value && Array.isArray(value.result) ? value.result : null;
  }
  function readSummaries(reads) {
    var summary = {};
    (/* @__PURE__ */ Object.keys(reads)).forEach(function(key) {
      var read = reads[key] || {};
      summary[key] = { state: text(read.state) || "ready", scopeMode: scopeModeOf(read.scopeMode), truncated: !!read.truncated };
    });
    return summary;
  }
  function failedRead(read) {
    var state2 = read && text(read.state);
    return state2 === "unauthorized" ? "unauthorized" : "error";
  }
  function scopeModeOf(value) {
    return SCOPE_MODES.indexOf(value) === -1 ? null : value;
  }
  function rowsById(rows2) {
    var found = /* @__PURE__ */ new Map();
    (Array.isArray(rows2) ? rows2 : []).forEach(function(row) {
      var id = positiveInteger(row && row.id);
      if (id && !found.has(id)) found.set(id, row);
    });
    return found;
  }
  function propertyIndex(properties) {
    var index = /* @__PURE__ */ new Map();
    (properties || []).forEach(function(property) {
      var backendId = positiveInteger(property && property.backendId);
      if (backendId && !index.has(backendId)) index.set(backendId, property);
    });
    return index;
  }
  function packageIndex(agreements) {
    var index = /* @__PURE__ */ new Map();
    agreements.forEach(function(agreement) {
      agreement.orderBackendIds.forEach(function(id) {
        var current = index.get(id);
        if (!current || current.backendId < agreement.backendId) index.set(id, agreement);
      });
    });
    return index;
  }
  function propertyTitle(propertyBackendId, property) {
    if (property && property.name) return property.name;
    return propertyBackendId ? "Property details unavailable" : "No property on this quote";
  }
  function propertyAddress(property, title) {
    var address = property && property.address || "";
    return address && address !== title && !addressRepeats(title, address) ? address : "";
  }
  function byStage(left, right) {
    return stageRank(left.agreement) - stageRank(right.agreement) || right.agreement.backendId - left.agreement.backendId;
  }
  function stageRank(agreement) {
    if (!agreement) return STAGE_ORDER.length + 1;
    var index = STAGE_ORDER.indexOf(agreement.stage);
    return index === -1 ? STAGE_ORDER.length : index;
  }
  function htmlToText(source) {
    return decodeEntities(source.replace(/<\s*br\s*\/?\s*>/gi, "\n").replace(/<\s*h[1-6](\s[^>]*)?>/gi, "\n\n# ").replace(/<\s*li(\s[^>]*)?>/gi, "\n- ").replace(/<\s*\/\s*(p|div|h[1-6]|ul|ol|li|section|article|blockquote|table|tr)\s*>/gi, "\n\n").replace(/<\s*(p|div|ul|ol|section|article|blockquote|table|tr)(\s[^>]*)?>/gi, "\n\n").replace(/<[^>]*>/g, ""));
  }
  function decodeEntities(value) {
    return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, function(match, name) {
      var lower = name.toLowerCase();
      if (lower === "amp") return "&";
      if (lower === "lt") return "<";
      if (lower === "gt") return ">";
      if (lower === "quot") return '"';
      if (lower === "apos") return "'";
      if (lower === "nbsp") return " ";
      var point = lower.charAt(1) === "x" ? parseInt(lower.slice(2), 16) : parseInt(lower.slice(1), 10);
      return Number.isFinite(point) && point > 0 && point <= 1114111 ? String.fromCodePoint(point) : match;
    });
  }
  function agreementStage(stage, label, tone) {
    return /* @__PURE__ */ Object.freeze({ stage, label, tone });
  }
  function listRows(payload) {
    if (Array.isArray(payload)) return payload;
    return payload && Array.isArray(payload.result) ? payload.result : [];
  }
  function attributeString(row, code) {
    var entry = attributeEntry(row, code);
    return entry && typeof entry.value === "string" ? entry.value.trim() : "";
  }
  function attributeIds(row, code) {
    var entry = attributeEntry(row, code);
    return idList(entry ? entry.value : null);
  }
  function idList(value) {
    var parts = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : value == null ? [] : [value];
    var ids = [];
    parts.forEach(function(part) {
      var id = positiveInteger(part && typeof part === "object" ? part.id : part);
      if (id && ids.indexOf(id) === -1) ids.push(id);
    });
    return ids;
  }
  function localizedName(value) {
    if (!value || typeof value !== "object") return "";
    var localized = value.en || value["en-US"] || Object.values(value)[0] || {};
    var name = localized && (localized.NAME || localized.name);
    return typeof name === "string" ? name.trim() : "";
  }
  function currencyCode(currency) {
    var code = text(currency && currency.code);
    return /^[A-Z]{3}$/.test(code) ? code : "";
  }
  function orderTotal(amount, currency) {
    var value = finiteNumber2(amount);
    var code = currencyCode(currency);
    return value !== null && value > 0 && code ? { amount: value, currency: code } : null;
  }
  function formatQuantity(value) {
    var number = finiteNumber2(value);
    return number === null ? "" : new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(number);
  }
  function finiteNumber2(value) {
    var number = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : Number.NaN;
    return Number.isFinite(number) ? number : null;
  }
  function isoDate(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text(value));
    if (!match) return null;
    var year = Number(match[1]);
    var month = Number(match[2]);
    var day = Number(match[3]);
    var date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? match[0] : null;
  }
  function datePeriod(start, end) {
    var from = isoDate(start);
    var to = isoDate(end);
    return from && to && from <= to ? { start: from, end: to } : null;
  }
  function byPricingModel(left, right) {
    return pricingRank(left) - pricingRank(right) || left.backendId - right.backendId;
  }
  function pricingRank(order) {
    var index = order.pricingModel ? PRICING_MODEL_RANK.indexOf(order.pricingModel.code) : -1;
    return index === -1 ? PRICING_MODEL_RANK.length : index;
  }
  function isOpen(order) {
    return order.status === "unseen" || order.status === "viewed";
  }
  function hasStatus(status) {
    return function(order) {
      return order.status === status;
    };
  }
  function own(map, key) {
    return typeof key === "string" && Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null;
  }
  function tenths(value) {
    return Math.round(value * 10) / 10;
  }

  // app-templates/customer-portal/runtime/src/state.js
  var state = {
    route: "orders.list",
    routeQuery: "",
    routeQueryOwner: null,
    theme: "HVAC",
    // vertical display name
    mode: "Light",
    // Light | Dark
    view: "ready",
    // ready | loading | empty | error
    account: "ready",
    // ready | resolving-customer | customer-* | session-expired
    commands: {},
    cmdForce: null,
    contact: null,
    contactDraft: null,
    contactErrors: null,
    filter: "all",
    // order tab
    currentOrderId: null,
    // open order for order.detail
    cartItems: [],
    // checkout cart
    addrId: "home",
    // selected delivery address
    payId: "visa",
    // selected payment method
    prodCat: "all",
    // product category filter
    psites: F.proposalSites.map(function(p) {
      return Object.assign({}, p);
    }),
    // proposal sites (mutable)
    porders: [],
    pagreements: [],
    agreementId: null,
    agreementTermsOpen: false,
    quoteViews: {},
    contractCommand: null,
    contractConfirm: null,
    ovProperty: null,
    ovWeatherIndex: null,
    currentSiteId: "s2",
    // open proposal site
    profileFilter: "all",
    // profile order-history tab
    feedFilter: "all",
    // activity feed tab
    prefs: { receipts: true, sms: true, marketing: false },
    messages: F.initialMessages.slice(),
    typing: false,
    chatInput: "",
    activityReadAll: false,
    accessConfirmations: {},
    serviceRequests: [],
    nextFixtureOrder: 1,
    calYear: 2026,
    calMonth: 0,
    phone: "",
    code: "",
    authError: null,
    oidc: "ready-signed-out",
    sessionName: null,
    profileEdit: null,
    profileSaved: null,
    profileLoginChanged: null,
    session: { authenticated: true, intendedRoute: null, hasCustomerScope: true, hasTenantScope: true },
    access: { care: { status: "granted", reasonCode: null } },
    carePayloadState: "ready",
    careStateVertical: null,
    careSelectedUnitId: null,
    careSelectedSpecialistId: null,
    careTasksDone: {},
    careAuthorizationEpoch: 0,
    careRetreatRequests: {},
    seoSelectedServiceId: null,
    seoFaqOpenId: null,
    seoCtaStates: {},
    moduleStatus: {},
    moduleData: {},
    apptDay: null,
    visitId: null,
    invoiceId: null,
    invoicePayment: null,
    propertyId: null,
    apptSort: "asc",
    liveWeather: null,
    liveWeatherState: "off",
    pending: {},
    commandErrors: {},
    config: {
      vertical: "hvac",
      theme: "hvac",
      profile: "onDemand",
      routerMode: "hash",
      authMode: "fixture",
      defaultRoute: "orders.list",
      enabledModules: verticalProfiles.hvac.modules.slice(),
      errorMode: "error",
      dataMode: "fixture",
      caseId: "",
      defaultMode: "light",
      capability: "current-staging",
      booking: "closed",
      retail: "browse-only",
      planCommerce: "closed",
      demoCommands: "closed"
    },
    userModeOverridden: false,
    mobileNav: false,
    capability: "current-staging",
    spaBooking: "closed",
    spaAppt: "salon",
    spaRows: "many",
    spaLongName: false,
    spaCancelled: {},
    accountMenu: false,
    spaSupport: false,
    spaRetail: "browse-only",
    spaAccountPartial: false,
    spaPurchFilter: "all",
    spaPurchMore: "idle",
    spaCurrentPurchase: null,
    spaPlanScenario: "active",
    spaPlanCancelled: {},
    spaCart: null,
    spaCartDemo: "as-added",
    spaVariantPick: {},
    spaCurrentProduct: null,
    spaGallery: 0,
    spaModels: "ready",
    spaReviews: "ready",
    spaOrderMedia: "mixed",
    spaCheckoutSource: "cart",
    spaCheckoutDemo: "ready",
    spaPolicyAck: false,
    spaResult: null,
    spaHold: "held",
    spaBookResult: "appointment-and-order",
    spaReturns: {},
    spaCancelReqs: {},
    spaCurrentAppointment: null,
    spaFlow: null,
    spaBookAck: false,
    spaOptScenario: "fixed-studio",
    spaLocSrc: "ready",
    spaAddonSrc: "ready",
    spaNoteCap: "enabled",
    spaNote: "",
    spaSlots: "ready",
    spaCredit: "ok",
    spaPlanCommerce: "closed",
    spaOfferDemo: "sellable",
    spaPlanOffer: null,
    spaRescheduled: {},
    spaProfile: null,
    spaProfileDraft: null,
    spaProfileErrors: null,
    drawer: null,
    // null | "booking"
    orders: F.ordersFor("HVAC")
  };
  function currentOrder() {
    var orders = orderItems();
    return orders.find(function(o) {
      return o.id === state.currentOrderId;
    }) || orders.find(function(o) {
      return o.status === "inprogress";
    }) || orders[0];
  }
  function money2(n) {
    return "$" + n.toLocaleString();
  }
  function cartCount() {
    return state.cartItems.reduce(function(a, x) {
      return a + x.qty;
    }, 0);
  }
  function findProduct(name) {
    return productItems().find(function(p) {
      return p.name === name;
    });
  }
  function orderItems() {
    return state.moduleData.orders && state.moduleData.orders.items || state.orders;
  }
  function productItems() {
    var v = currentFixture().theme;
    var items = state.moduleData.products && state.moduleData.products.items || v.products;
    return items.map(function(product) {
      if (product.code) return product;
      return Object.assign({}, product, { code: product.sku || product.id });
    });
  }
  function currentOverview() {
    var fixture = currentFixture();
    var overview = fixture && fixture.overview || null;
    if (state.config.dataMode === "live") return liveOverview();
    if (!overview) return null;
    if (!state.liveWeather) return overview;
    return Object.assign({}, overview, { weather: state.liveWeather });
  }
  function liveOverview() {
    var envelope2 = state.moduleData.properties;
    if (!envelope2 || envelope2.state !== "ready") return null;
    var geography = state.config.serviceGeography;
    var forecast = liveForecastState();
    return {
      map: geography ? geography.map : null,
      weather: forecast === "ready" ? state.liveWeather : null,
      forecast,
      properties: envelope2.items || [],
      sources: { invoices: "unavailable", appointments: "unavailable", contracts: "unavailable", support: "unavailable" },
      invoices: null,
      contracts: null,
      support: null,
      banner: null
    };
  }
  function liveOverviewStatus() {
    if (!isModuleEnabled("properties")) return "unconfigured";
    var envelope2 = state.moduleData.properties;
    if (envelope2 && envelope2.state === "unauthorized") return "unauthorized";
    if (envelope2 && envelope2.state === "error") return "error";
    if (!envelope2 || envelope2.state !== "ready") return "loading";
    return "ready";
  }
  function liveVisits() {
    var envelope2 = state.config.dataMode === "live" && isModuleEnabled("appointmentsTimeline") ? state.moduleData.appointmentsTimeline : null;
    return envelope2 && envelope2.state === "ready" && Array.isArray(envelope2.upcoming) && Array.isArray(envelope2.past) ? envelope2 : null;
  }
  function liveInvoices() {
    var envelope2 = isModuleEnabled("invoices") ? state.moduleData.invoices : null;
    return envelope2 && envelope2.state === "ready" && Array.isArray(envelope2.items) ? envelope2 : null;
  }
  function liveListStatus(moduleId) {
    var envelope2 = state.moduleData[moduleId];
    if (!envelope2 || !envelope2.state || envelope2.state === "loading") return "loading";
    if (envelope2.state !== "ready") return envelope2.state === "unauthorized" ? "unauthorized" : "error";
    var rows2 = moduleId === "invoices" ? (envelope2.items || []).length : (envelope2.upcoming || []).length + (envelope2.past || []).length;
    return rows2 ? "ready" : "empty";
  }
  function navListShown(moduleId) {
    if (moduleId === "invoices" || moduleId === "appointmentsTimeline" && state.config.dataMode === "live") {
      var status = liveListStatus(moduleId);
      return status === "ready" || status === "error";
    }
    return true;
  }
  function liveProperties() {
    var envelope2 = state.moduleData.properties;
    return envelope2 && envelope2.state === "ready" && Array.isArray(envelope2.items) ? envelope2.items : [];
  }
  function liveForecastState() {
    if (!state.config.serviceGeography || !state.config.weatherClientId || !state.config.weatherClientSecret) return "unconfigured";
    if (state.liveWeatherState === "ready" && state.liveWeather) return "ready";
    if (state.liveWeatherState === "failed") return "failed";
    return "loading";
  }
  function activityUnread() {
    if (!isModuleEnabled("activity") || state.config.dataMode === "live" || state.activityReadAll) return false;
    return (currentFixture().activity || []).some(function(group) {
      return (group.items || []).some(function(item) {
        return !!item.unread;
      });
    });
  }
  function currentFixture() {
    var fixture = caseFixtureFor(state.config.caseId);
    if (fixture) return fixture;
    return {
      theme: F.themes[state.theme],
      customer: F.customer,
      addresses: F.addresses,
      cards: F.cards,
      technician: F.technician,
      statusMeta: F.statusMeta,
      feedTabs: F.feedTabs,
      support: { agentName: "Avery", label: "Aircove Support", ticket: "SP-104", availability: "Online now" },
      helpTopics: F.helpTopics,
      quickReplies: F.quickReplies,
      activity: F.buildFeed(F.themes[state.theme])
    };
  }
  function currentTheme() {
    return currentFixture().theme;
  }
  function currentStormCalendar() {
    var fixture = caseFixtureFor(state.config.caseId);
    return fixture && fixture.stormCalendar || F.stormCalendar(state.theme);
  }
  function caseProposals() {
    var fixture = caseFixtureFor(state.config.caseId);
    return fixture && fixture.proposals || null;
  }
  function currentProposal() {
    var proposals = caseProposals();
    if (proposals) return proposals.proposal || null;
    return F.proposal;
  }
  function quotePackage() {
    var data = state.moduleData.proposals;
    if (!data || !data.quotes) return null;
    return contractsPackage(data.quotes, contractProperties());
  }
  function contractProperties() {
    if (state.config.dataMode === "live") {
      var envelope2 = state.moduleData.properties;
      return envelope2 && envelope2.state === "ready" && Array.isArray(envelope2.items) ? envelope2.items : [];
    }
    var overview = currentOverview();
    return overview && overview.properties || [];
  }
  function quoteGroupFor(id) {
    var quotes = quotePackage();
    if (!quotes || !id) return null;
    var exact = quotes.groups.find(function(group) {
      return group.id === id;
    });
    if (exact) return exact;
    return quotes.groups.filter(function(group) {
      return !!group.property && (group.property.quoteSiteId === id || group.property.id === id);
    }).sort(function(left, right) {
      return (right.agreementBackendId || 0) - (left.agreementBackendId || 0);
    })[0] || null;
  }
  function contractAgreementFor(id) {
    var quotes = quotePackage();
    return quotes && id && quotes.agreements.find(function(row) {
      return row.id === id;
    }) || null;
  }
  function proposalStatusMeta() {
    var proposals = caseProposals();
    return proposals && proposals.statusMeta || F.pstatus;
  }
  function proposalPlanName(id) {
    var proposals = caseProposals();
    var names = proposals && proposals.planNames;
    return names && names[id] || F.planName(id);
  }
  function proposalSites() {
    return state.moduleData.proposals && state.moduleData.proposals.sites || state.psites;
  }
  function activeVerticalConfig() {
    return verticalProfiles[state.config.vertical] || verticalProfiles.hvac;
  }
  function activeProfile() {
    var vertical2 = activeVerticalConfig();
    if (isSpa()) return portalProfiles[spaCapability() === "target-appointments" ? "spaTarget" : "spaStaging"];
    return portalProfiles[state.config.profile] || portalProfiles[vertical2.profile];
  }
  function isSpa() {
    return state.config.vertical === "beauty" || state.theme === "Beauty";
  }
  function spaCapability() {
    return state.capability === "target-appointments" ? "target-appointments" : "current-staging";
  }
  function routeLabel(routeId) {
    var nav = activeProfile().nav.find(function(item) {
      return item.key === routeId;
    });
    if (nav) return nav.label || "your page";
    var labels = {
      "order.detail": "Order details",
      checkout: "Checkout",
      profile: "Profile",
      calendar: "Calendar",
      activity: "Activity",
      "orders.list": "Home",
      account: "Account",
      "purchases.list": "Purchases",
      "purchase.detail": "Purchase details",
      plan: "My plan",
      cart: "Your bag",
      "appointment.detail": "Your visit"
    };
    return labels[routeId] || "your page";
  }
  function cmdPhase(key) {
    return state.commands[key] || "idle";
  }
  function isPublic(routeId) {
    var route = routeRegistry[routeId || state.route];
    return !!(route && route.public);
  }
  function customerPortalAccessRequired() {
    return customerAccountRequired(state.config);
  }
  function customerPortalGateActive() {
    return customerPortalAccessRequired() && state.session.authenticated === true && state.account !== "ready";
  }
  function isModuleEnabled(moduleId) {
    if (!moduleId || moduleId === "auth" || moduleId === "seo-parity") return true;
    return state.config.enabledModules.includes(moduleId);
  }
  function applyPortalConfig(config) {
    var vertical2 = verticalProfiles[config.vertical] ? config.vertical : "hvac";
    var verticalConfig = verticalProfiles[vertical2];
    var theme = verticalProfiles[config.theme] ? config.theme : vertical2;
    var profile = resolveProfile(vertical2, config.profile);
    state.config = Object.assign({}, state.config, config, {
      vertical: vertical2,
      theme,
      profile,
      defaultRoute: config.defaultRoute || verticalConfig.defaultRoute,
      enabledModules: config.enabledModules && config.enabledModules.length ? config.enabledModules : portalProfiles[profile].modules.slice()
    });
    state.capability = state.config.capability === "target-appointments" ? "target-appointments" : "current-staging";
    state.spaBooking = state.config.booking === "open" ? "open" : "closed";
    state.spaRetail = state.config.retail === "retail-commerce-open" ? "retail-commerce-open" : "browse-only";
    state.spaPlanCommerce = state.config.planCommerce === "open" ? "open" : "closed";
    state.session.authenticated = state.config.authMode !== "required";
    state.session.intendedRoute = null;
    var fixture = caseFixtureFor(state.config.caseId);
    state.theme = verticalConfig.displayName;
    state.orders = fixture ? cloneCaseValue(fixture.orders) : F.ordersFor(verticalConfig.displayName);
    state.addrId = fixture ? fixture.addresses[0].id : "home";
    state.payId = fixture ? fixture.cards[0].id : "visa";
    state.ovProperty = null;
    state.ovWeatherIndex = null;
    state.psites = fixture && fixture.proposals ? cloneCaseValue(fixture.proposals.sites) : F.proposalSites.map(function(site) {
      return Object.assign({}, site);
    });
    state.porders = fixture && fixture.proposals && fixture.proposals.orders ? cloneCaseValue(fixture.proposals.orders) : [];
    state.pagreements = fixture && fixture.proposals && fixture.proposals.agreements ? cloneCaseValue(fixture.proposals.agreements) : [];
    state.agreementId = null;
    state.quoteViews = {};
    state.contractCommand = null;
    state.contractConfirm = null;
    state.prefs = fixture ? cloneCaseValue(fixture.prefs) : { receipts: true, sms: true, marketing: false };
    state.messages = fixture ? cloneCaseValue(fixture.initialMessages) : F.initialMessages.slice();
    state.filter = "all";
    state.cartItems = [];
    state.account = state.config.dataMode === "live" && state.config.authMode === "required" ? "resolving-customer" : "ready";
    state.commands = {};
    state.accountMenu = false;
    state.spaSupport = false;
    state.spaCart = null;
    state.spaCartDemo = "as-added";
    state.spaVariantPick = {};
    state.spaCurrentProduct = null;
    state.spaGallery = 0;
    state.spaModels = "ready";
    state.spaReviews = "ready";
    state.spaOrderMedia = "mixed";
    state.spaResult = null;
    state.spaPolicyAck = false;
    state.spaCheckoutDemo = "ready";
    state.spaCheckoutSource = "cart";
    state.spaReturns = {};
    state.spaCancelReqs = {};
    state.spaPlanCancelled = {};
    state.spaPurchMore = "idle";
    state.spaPurchFilter = "all";
    state.spaCurrentPurchase = null;
    state.spaHold = "held";
    state.spaCurrentAppointment = null;
    state.spaFlow = null;
    state.spaBookAck = false;
    state.spaOptScenario = "fixed-studio";
    state.spaLocSrc = "ready";
    state.spaAddonSrc = "ready";
    state.spaNoteCap = "enabled";
    state.spaNote = "";
    state.spaSlots = "ready";
    state.spaCredit = "ok";
    state.spaOfferDemo = "sellable";
    state.spaPlanOffer = null;
    state.spaRescheduled = {};
    state.spaProfile = null;
    state.spaProfileDraft = null;
    state.spaProfileErrors = null;
    state.carePayloadState = "ready";
    state.careStateVertical = null;
    state.careSelectedUnitId = null;
    state.careSelectedSpecialistId = null;
    state.careTasksDone = {};
    state.careAuthorizationEpoch += 1;
    state.careRetreatRequests = {};
    delete state.moduleData.care;
    delete state.moduleStatus.care;
    if (!state.userModeOverridden) {
      state.mode = state.config.defaultMode === "dark" ? "Dark" : "Light";
    }
  }
  function buildCalendarGrid(year, month) {
    var first = new Date(year, month, 1);
    var startWeekday = first.getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var cells = [];
    for (var i = 0; i < startWeekday; i++) cells.push({ empty: true });
    for (var d = 1; d <= daysInMonth; d++) {
      cells.push({ empty: false, day: d, events: orderItems().filter(function(o) {
        return o.y === year && o.m === month && o.d === d;
      }) });
    }
    return cells;
  }
  function currentSite() {
    var sites = proposalSites();
    return sites.find(function(p) {
      return p.id === state.currentSiteId;
    }) || sites[0];
  }
  function computeSite(site) {
    var cs = 0, ds = 0, total = 0;
    var names = currentTheme().prop.surfaces;
    var rows2 = F.surfaceDefs.map(function(d, i) {
      var a = site.areas[i];
      var c = Math.round(a * d.clear), de = Math.round(a * d.deice);
      cs += c;
      ds += de;
      total += a;
      return {
        name: names[i] || "Surface " + (i + 1),
        color: d.color,
        area: a.toLocaleString(),
        clear: "$" + c,
        deice: "$" + de,
        clearRate: "$" + ("" + d.clear).replace(/^0/, ""),
        deiceRate: "$" + ("" + d.deice).replace(/^0/, "")
      };
    });
    var clearing = cs + F.MOB_CLEAR, deice = ds + F.MOB_DEICE;
    var seasonRef = clearing * 18 + deice * 22;
    var unlim = seasonRef * 0.853;
    var monthly = Math.round(unlim / 5 / 5) * 5;
    var seasonLock = Math.round(unlim * 0.9 / 25) * 25;
    return {
      rows: rows2,
      total,
      clearing,
      deice,
      monthly,
      seasonLock,
      unlim,
      clearStr: "$" + clearing,
      deiceStr: "$" + deice
    };
  }
  function filteredOrders() {
    var list = orderItems();
    if (state.filter !== "all") list = list.filter(function(o) {
      return o.status === state.filter;
    });
    return list;
  }
  function tabItems() {
    var o = orderItems();
    var count = function(k) {
      return k === "all" ? o.length : o.filter(function(x) {
        return x.status === k;
      }).length;
    };
    return [
      { key: "all", label: "All", count: count("all") },
      { key: "inprogress", label: "Active", count: count("inprogress") },
      { key: "scheduled", label: "Scheduled", count: count("scheduled") },
      { key: "completed", label: "Done", count: count("completed") }
    ];
  }

  // app-templates/customer-portal/runtime/src/components/primitives/StatusBadge.js
  function StatusBadge(props) {
    return h("span", {
      "class": "status-badge " + props.variant,
      "data-module": "status-badge",
      "data-visual-id": "status-badge",
      "data-bind": props.bind || "status.label",
      "data-state": props.state || void 0
    }, props.label);
  }

  // app-templates/customer-portal/runtime/src/contract-commands.js
  var CONTRACT_EVENTS = /* @__PURE__ */ Object.freeze({
    view: /* @__PURE__ */ Object.freeze({ entity: "order", source: "QUOTE_SENT", code: "QUOTE_SENT-QUOTE_VIEWED" }),
    approve: /* @__PURE__ */ Object.freeze({ entity: "order", source: "QUOTE_VIEWED", code: "QUOTE_VIEWED-CLIENT_APPROVED" }),
    decline: /* @__PURE__ */ Object.freeze({ entity: "order", source: "QUOTE_VIEWED", code: "QUOTE_VIEWED-DECLINED" }),
    agreement: /* @__PURE__ */ Object.freeze({ entity: "document", source: "SENT_TO_CLIENT", code: "SENT_TO_CLIENT-CLIENT_APPROVED" })
  });
  var CONFIRMED_TOAST = {
    approve: "Option approved",
    decline: "Option declined",
    agreement: "Agreement approved"
  };
  function createContractCommands(deps) {
    var flight = null;
    function busy() {
      return !!flight;
    }
    function run(command, operation) {
      if (flight) return null;
      deps.state.contractCommand = Object.assign({ phase: "pending" }, command);
      var started2 = Promise.resolve().then(operation).catch(function(error2) {
        return settle2(command, error2);
      }).finally(function() {
        flight = null;
        if (command.kind !== "view") deps.state.contractConfirm = null;
        deps.render();
      });
      flight = started2;
      deps.render();
      return started2;
    }
    function decide(kind, backendId) {
      var definition = CONTRACT_EVENTS[kind];
      if (!definition || definition.entity !== "order") return Promise.resolve(false);
      var quote = findQuote(deps.current(), backendId);
      if (!quote || quote.stateCode !== definition.source || quote.allowedActions.indexOf(kind) === -1) return Promise.resolve(false);
      return run({ kind, targets: [backendId] }, async function() {
        var gateway = deps.gateway();
        var row = await gateway.readOrder(backendId, deps.context());
        if (latestStateCode(row) !== definition.source) throw coded("conflict");
        await gateway.sendOrderEvent(backendId, definition.code, deps.context());
        return confirm(kind, backendId, definition.source, function(pkg) {
          var read = findQuote(pkg, backendId);
          return read ? read.stateCode : null;
        });
      }) || Promise.resolve(false);
    }
    function approveAgreement(backendId) {
      var definition = CONTRACT_EVENTS.agreement;
      var row = findAgreement(deps.current(), backendId);
      if (!row || row.agreement.stateCode !== definition.source || row.agreement.allowedActions.indexOf("approve") === -1) return Promise.resolve(false);
      return run({ kind: "agreement", targets: [backendId] }, async function() {
        var gateway = deps.gateway();
        var document2 = await gateway.readAgreement(backendId, deps.context());
        if (latestStateCode(document2) !== definition.source) throw coded("conflict");
        await gateway.sendAgreementEvent(backendId, definition.code, deps.context());
        return confirm("agreement", backendId, definition.source, function(pkg) {
          var read = findAgreement(pkg, backendId);
          return read ? read.agreement.stateCode : null;
        });
      }) || Promise.resolve(false);
    }
    function view(backendIds) {
      var definition = CONTRACT_EVENTS.view;
      if (flight) return Promise.resolve(false);
      var pkg = deps.current();
      var ids = (backendIds || []).filter(function(id, index, all) {
        var quote = findQuote(pkg, id);
        return all.indexOf(id) === index && !!quote && quote.stateCode === definition.source;
      });
      if (!ids.length) return Promise.resolve(false);
      ids.forEach(function(id) {
        deps.state.quoteViews[id] = "pending";
      });
      return run({ kind: "view", targets: ids }, async function() {
        var gateway = deps.gateway();
        for (var index = 0; index < ids.length; index += 1) {
          try {
            await gateway.sendOrderEvent(ids[index], definition.code, deps.context());
          } catch (error2) {
            if (error2 && error2.code === "session-expired") throw error2;
          }
        }
        var read;
        try {
          read = await deps.reload();
        } catch (error2) {
          ids.forEach(function(id) {
            deps.state.quoteViews[id] = "failed";
          });
          throw readbackFailure(error2);
        }
        if (!ordersRead(read)) {
          ids.forEach(function(id) {
            deps.state.quoteViews[id] = "failed";
          });
          throw readbackFailure(null);
        }
        ids.forEach(function(id) {
          var quote = findQuote(read, id);
          if (quote && quote.stateCode !== definition.source) delete deps.state.quoteViews[id];
          else deps.state.quoteViews[id] = "failed";
        });
        deps.state.contractCommand = null;
        return true;
      }) || Promise.resolve(false);
    }
    async function confirm(kind, backendId, source, stateOf) {
      var read;
      try {
        read = await deps.reload();
      } catch (error2) {
        throw readbackFailure(error2);
      }
      var stateCode = stateOf(read);
      if (!stateCode) throw readbackFailure(null);
      if (stateCode === source) {
        deps.state.contractCommand = { kind, targets: [backendId], phase: "unconfirmed" };
        return false;
      }
      deps.state.contractCommand = null;
      if (deps.notify) deps.notify(CONFIRMED_TOAST[kind]);
      return true;
    }
    async function settle2(command, error2) {
      var code = error2 && error2.code;
      if (code === "session-expired") {
        deps.state.contractCommand = null;
        deps.state.account = "session-expired";
        return false;
      }
      if (code === "readback-failed") {
        deps.state.contractCommand = Object.assign({}, command, { phase: "readback-failed" });
        return false;
      }
      var phase = code === "conflict" ? "conflict" : code === "customer-forbidden" || code === "not-found" || code === "command-refused" ? "refused" : "failed";
      if (phase === "conflict" || code === "not-found") {
        try {
          await deps.reload();
        } catch (_) {
          deps.state.contractCommand = Object.assign({}, command, { phase: "readback-failed" });
          return false;
        }
      }
      deps.state.contractCommand = Object.assign({}, command, { phase });
      return false;
    }
    return {
      busy,
      decide,
      approveAgreement,
      view
    };
  }
  function ordersRead(pkg) {
    return !!pkg && !!pkg.sources && pkg.sources.orders === "ready";
  }
  function readbackFailure(cause) {
    var error2 = coded("readback-failed");
    error2.cause = cause;
    return error2;
  }
  function coded(code) {
    var error2 = new Error(code);
    error2.code = code;
    return error2;
  }

  // app-templates/customer-portal/runtime/src/adapters/fixture-adapter.js
  var fixtureAdapter = {
    load(moduleId, context) {
      var themeName = context.state.theme;
      var fixture = caseFixtureFor(context.config.caseId);
      var theme = fixture ? fixture.theme : F.themes[themeName];
      switch (moduleId) {
        case "auth":
          return { session: context.state.session, phone: context.state.phone, code: context.state.code };
        case "orders":
          return { orders: context.state.orders, statusMeta: fixture ? fixture.statusMeta || F.statusMeta : F.statusMeta, technician: fixture ? fixture.technician : F.technician, addresses: fixture ? fixture.addresses : F.addresses };
        case "proposals":
          return proposalsFixture(fixture, context);
        case "services":
          return { services: theme.svc };
        case "pricing":
          return { plan: theme.plan, services: theme.svc };
        case "products":
          return { feature: theme.feat, categories: theme.cats, products: theme.products };
        case "checkout":
          return { cartItems: context.state.cartItems, addresses: fixture ? fixture.addresses : F.addresses, cards: fixture ? fixture.cards : F.cards };
        case "overview":
        case "appointmentsTimeline":
        case "properties":
          return { overview: fixture ? fixture.overview || null : null };
        case "calendar":
          return { orders: context.state.orders, stormCalendar: fixture && fixture.stormCalendar ? fixture.stormCalendar : F.stormCalendar(themeName) };
        case "activity":
          return { groups: fixture ? fixture.activity : F.buildFeed(theme), tabs: fixture ? fixture.feedTabs : F.feedTabs };
        case "profile":
          return {
            customer: fixture ? fixture.customer : F.customer,
            addresses: fixture ? fixture.addresses : F.addresses,
            cards: fixture ? fixture.cards : F.cards,
            preferences: context.state.prefs,
            orders: context.state.orders
          };
        case "support":
          return {
            customer: fixture ? fixture.customer : F.customer,
            topics: fixture ? fixture.helpTopics : F.helpTopics,
            quickReplies: fixture ? fixture.quickReplies : F.quickReplies,
            messages: context.state.messages
          };
        default:
          throw new Error("Unknown fixture module: " + moduleId);
      }
    }
  };
  var fixtureAccountProfileAdapter = {
    load(moduleId, context) {
      var fixture = caseFixtureFor(context.config.caseId);
      return { account: fixture && fixture.customerAccount ? clone(fixture.customerAccount) : null, scopeMode: null };
    }
  };
  function createFixtureContractsGateway(state2) {
    return {
      async readOrder(backendId) {
        return clone(fixtureRow(state2.porders, backendId));
      },
      async readAgreement(backendId) {
        return clone(fixtureRow(state2.pagreements, backendId));
      },
      async sendOrderEvent(backendId, event) {
        var target = transition(fixtureRow(state2.porders, backendId), event);
        var orders = withState(state2.porders, [backendId], target);
        var packages = state2.pagreements.filter(function(agreement) {
          return listedOrderIds(agreement).indexOf(positiveInteger(backendId)) !== -1;
        });
        if (target === "CLIENT_APPROVED") orders = withState(orders, siblingsOf(orders, packages, backendId), "DECLINED");
        state2.porders = orders;
        if (target === "CLIENT_APPROVED" || target === "DECLINED") state2.pagreements = evaluatePackages(state2.pagreements, packages, orders);
        return true;
      },
      async sendAgreementEvent(backendId, event) {
        var target = transition(fixtureRow(state2.pagreements, backendId), event);
        state2.pagreements = withState(state2.pagreements, [backendId], target);
        return true;
      }
    };
  }
  function proposalsFixture(fixture, context) {
    var proposals = fixture && fixture.proposals;
    var quotation = !!(proposals && proposals.orders);
    return {
      proposal: proposals ? proposals.proposal || null : F.proposal,
      sites: context.state.psites,
      statusMeta: proposals && proposals.statusMeta ? proposals.statusMeta : F.pstatus,
      quoteOrders: quotation ? context.state.porders : null,
      agreements: quotation ? context.state.pagreements : null,
      orderItems: quotation ? proposals.orderItems || [] : null,
      productPrices: quotation ? proposals.productPrices || [] : null,
      products: quotation ? proposals.products || [] : null,
      client: quotation ? { displayName: fixture.customer.fullName } : null
    };
  }
  function fixtureRow(rows2, backendId) {
    var id = positiveInteger(backendId);
    var row = (rows2 || []).find(function(candidate) {
      return candidate.id === id;
    });
    if (!row) throw coded2("not-found");
    return row;
  }
  function transition(row, event) {
    var parts = String(event || "").split("-");
    if (parts.length !== 2 || latestStateCode(row) !== parts[0]) throw coded2("command-refused");
    return parts[1];
  }
  function withState(rows2, ids, code) {
    return rows2.map(function(row) {
      return ids.indexOf(row.id) === -1 ? row : Object.assign({}, row, { states: row.states.concat({ code }) });
    });
  }
  function siblingsOf(orders, packages, backendId) {
    var property = attributeNumber(fixtureRow(orders, backendId), "SERVICE_PROPERTY");
    var listed = [];
    packages.forEach(function(agreement) {
      listed = listed.concat(listedOrderIds(agreement));
    });
    return orders.filter(function(row) {
      return row.id !== positiveInteger(backendId) && listed.indexOf(row.id) !== -1 && attributeNumber(row, "SERVICE_PROPERTY") === property && ["QUOTE_SENT", "QUOTE_VIEWED"].indexOf(latestStateCode(row)) !== -1;
    }).map(function(row) {
      return row.id;
    });
  }
  function evaluatePackages(agreements, packages, orders) {
    var decided = packages.filter(function(agreement) {
      if (latestStateCode(agreement) !== "QUOTATION_SENT") return false;
      var byProperty = {};
      listedOrderIds(agreement).forEach(function(id) {
        var row = orders.find(function(candidate) {
          return candidate.id === id;
        });
        if (!row) return;
        var key = String(attributeNumber(row, "SERVICE_PROPERTY") || 0);
        (byProperty[key] = byProperty[key] || []).push(latestStateCode(row));
      });
      var keys = /* @__PURE__ */ Object.keys(byProperty);
      return keys.length > 0 && keys.every(function(key) {
        return byProperty[key].indexOf("CLIENT_APPROVED") !== -1 || byProperty[key].every(function(code) {
          return code === "DECLINED";
        });
      });
    });
    if (!decided.length) return agreements;
    return agreements.map(function(agreement) {
      if (decided.indexOf(agreement) === -1) return agreement;
      var approved = listedOrderIds(agreement).some(function(id) {
        var row = orders.find(function(candidate) {
          return candidate.id === id;
        });
        return !!row && latestStateCode(row) === "CLIENT_APPROVED";
      });
      return Object.assign({}, agreement, { states: agreement.states.concat({ code: approved ? "AWAITING_CLIENT_DETAILS" : "CANCELED" }) });
    });
  }
  function listedOrderIds(agreement) {
    var buckets = agreement && agreement.attributes || {};
    var ids = [];
    (/* @__PURE__ */ Object.keys(buckets)).forEach(function(key) {
      var entry = buckets[key] && buckets[key].ORDERS;
      var value = entry ? entry.value : null;
      (Array.isArray(value) ? value : []).forEach(function(id) {
        var parsed2 = positiveInteger(id);
        if (parsed2 && ids.indexOf(parsed2) === -1) ids.push(parsed2);
      });
    });
    return ids;
  }
  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }
  function coded2(code) {
    var error2 = new Error(code);
    error2.code = code;
    return error2;
  }

  // app-templates/customer-portal/runtime/src/normalizers/visits.js
  var VISIT_TYPE = "SNOW_SERVICE_VISIT";
  var VISIT_STATUS = /* @__PURE__ */ Object.freeze({
    SCHEDULED: /* @__PURE__ */ Object.freeze({ label: "Scheduled", tone: "info", phase: "upcoming" }),
    IN_PROGRESS: /* @__PURE__ */ Object.freeze({ label: "In progress", tone: "progress", phase: "upcoming" }),
    COMPLETED: /* @__PURE__ */ Object.freeze({ label: "Completed", tone: "ok", phase: "past" })
  });
  var PROGRESS_STEPS = /* @__PURE__ */ Object.freeze({
    SCHEDULED: "Scheduled",
    IN_PROGRESS: "Started",
    COMPLETED: "Completed"
  });
  var MEDIA_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  var WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var MONTHS2 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function normalizeVisits(raw) {
    var rows2 = Array.isArray(raw && raw.items) ? raw.items : [];
    var visits = rows2.map(visitRecord).filter(Boolean);
    return {
      state: "ready",
      truncated: !!(raw && raw.truncated),
      upcoming: visits.filter(inPhase("upcoming")).sort(function(left, right) {
        return left.start.ms - right.start.ms;
      }),
      past: visits.filter(inPhase("past")).sort(function(left, right) {
        return right.start.ms - left.start.ms;
      })
    };
  }
  function findVisit(envelope2, id) {
    if (!envelope2 || !id) return null;
    return (envelope2.upcoming || []).concat(envelope2.past || []).find(function(visit) {
      return visit.id === id;
    }) || null;
  }
  function visitsForProperty(envelope2, propertyBackendId) {
    var owned = function(visit) {
      return visit.propertyBackendId === propertyBackendId;
    };
    return {
      next: (envelope2 && envelope2.upcoming || []).find(owned) || null,
      last: (envelope2 && envelope2.past || []).find(owned) || null
    };
  }
  function visitPlace(visit, properties) {
    var list = Array.isArray(properties) ? properties : [];
    if (list.length < 2 || !visit) return "";
    var property = list.find(function(item) {
      return item.backendId === visit.propertyBackendId;
    });
    return property ? property.address || property.name || "" : "";
  }
  function visitDay(visit, today) {
    var start = visit && visit.start;
    if (!start) return "";
    if (today && start.date === today) return "Today";
    var label = WEEKDAYS[start.weekday] + ", " + MONTHS2[start.month - 1] + " " + start.day;
    return today && today.slice(0, 4) !== String(start.year) ? label + ", " + start.year : label;
  }
  function visitWindow(visit) {
    var start = visit && visit.start;
    if (!start) return "";
    var end = visit.end && visit.end.ms > start.ms ? visit.end : null;
    if (!end) return clock(start.minutes, true);
    var samePeriod = meridiem(start.minutes) === meridiem(end.minutes) && start.date === end.date;
    return clock(start.minutes, !samePeriod) + " \u2013 " + clock(end.minutes, true);
  }
  function visitWhen(visit, today) {
    return [visitDay(visit, today), visitWindow(visit)].filter(Boolean).join(", ");
  }
  function normalizeVisitProgress(rows2) {
    return (Array.isArray(rows2) ? rows2 : []).map(function(row) {
      var code = text(row && row.state && row.state.code);
      var ms = epochMs(row && row.observed);
      if (!Object.prototype.hasOwnProperty.call(PROGRESS_STEPS, code) || ms === null) return null;
      return { code, label: PROGRESS_STEPS[code], ms };
    }).filter(Boolean).sort(function(left, right) {
      return left.ms - right.ms;
    });
  }
  function progressWhen(step, visit, timeZone) {
    var at = zonedParts(step.ms, timeZone);
    var day = MONTHS2[at.month - 1] + " " + at.day;
    var start = visit && visit.start;
    if (start && at.year !== start.year) day += ", " + at.year;
    if (step.code === "SCHEDULED") return day;
    var time = clock(at.minutes, true);
    return start && at.date === start.date ? time : day + ", " + time;
  }
  function localDateKey(date, timeZone) {
    return zonedParts((date instanceof Date ? date : /* @__PURE__ */ new Date()).getTime(), timeZone).date;
  }
  function visitImageUrl(coreBase, id) {
    return MEDIA_ID.test(id) ? String(coreBase || "/core").replace(/\/+$/, "") + "/image/" + id + "/get" : "";
  }
  function visitRecord(row) {
    var backendId = positiveInteger(row && row.id);
    var stateCode = latestStateCode(row);
    var status = Object.prototype.hasOwnProperty.call(VISIT_STATUS, stateCode) ? VISIT_STATUS[stateCode] : null;
    if (!backendId || !status || text(row.type && row.type.code) !== VISIT_TYPE) return null;
    var start = wallClock(row.start);
    if (!start) return null;
    return {
      id: "visit-core-" + backendId,
      backendId,
      stateCode,
      status: { label: status.label, tone: status.tone },
      phase: status.phase,
      start,
      end: wallClock(row.end),
      propertyBackendId: attributeNumber(row, "RESOURCE"),
      completionNotes: attributeText(row, "COMPLETION_NOTES"),
      before: mediaIds(row, "PRE_SERVICE_MEDIA"),
      after: mediaIds(row, "POST_SERVICE_MEDIA")
    };
  }
  function zonedParts(ms, timeZone) {
    var at = new Date(ms);
    var parts = { year: at.getFullYear(), month: at.getMonth() + 1, day: at.getDate(), hour: at.getHours(), minute: at.getMinutes() };
    if (timeZone) {
      new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" }).formatToParts(at).forEach(function(part) {
        if (Object.prototype.hasOwnProperty.call(parts, part.type)) parts[part.type] = Number(part.value);
      });
    }
    return {
      date: parts.year + "-" + pad(parts.month) + "-" + pad(parts.day),
      year: parts.year,
      month: parts.month,
      day: parts.day,
      minutes: parts.hour % 24 * 60 + parts.minute
    };
  }
  function epochMs(value) {
    var ms = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : Number.NaN;
    return Number.isFinite(ms) ? ms : null;
  }
  function wallClock(value) {
    var ms = epochMs(value);
    if (ms === null) return null;
    var instant = new Date(ms);
    var year = instant.getUTCFullYear();
    var month = instant.getUTCMonth() + 1;
    var day = instant.getUTCDate();
    return {
      ms,
      date: year + "-" + pad(month) + "-" + pad(day),
      year,
      month,
      day,
      weekday: instant.getUTCDay(),
      minutes: instant.getUTCHours() * 60 + instant.getUTCMinutes()
    };
  }
  function mediaIds(row, code) {
    var entry = attributeEntry(row, code);
    var value = entry ? entry.value : null;
    if (typeof value === "string" && /^\s*\[/.test(value)) {
      try {
        value = JSON.parse(value);
      } catch (_) {
        return [];
      }
    }
    return (Array.isArray(value) ? value : []).map(function(item) {
      if (!item || typeof item !== "object") return "";
      if (item.type != null && text(item.type) !== "image") return "";
      var id = text(item.id).toLowerCase();
      return MEDIA_ID.test(id) ? id : "";
    }).filter(function(id, index, ids) {
      return !!id && ids.indexOf(id) === index;
    });
  }
  function inPhase(phase) {
    return function(visit) {
      return visit.phase === phase;
    };
  }
  function clock(minutes, withMeridiem) {
    var hour = Math.floor(minutes / 60);
    var label = (hour % 12 || 12) + ":" + pad(minutes % 60);
    return withMeridiem ? label + " " + meridiem(minutes) : label;
  }
  function meridiem(minutes) {
    return minutes < 720 ? "AM" : "PM";
  }
  function pad(value) {
    return value < 10 ? "0" + value : String(value);
  }

  // app-templates/customer-portal/runtime/src/adapters/core-snow-adapter.js
  var PROPERTY_TYPE = "SNOW_REMOVAL_PROPERTY";
  var PROPERTY_BASE_TYPE = "PROPERTY";
  var AGREEMENT_TYPE = "SERVICE_AGREEMENT";
  var PIM_SERVICE_BASE = "/core-pim";
  var PROPERTY_PAGE_SIZE = 200;
  var PROPERTY_PAGE_LIMIT = 6;
  var AGREEMENT_PAGE_SIZE = 100;
  var ORDER_PAGE_SIZE = 100;
  var LINE_PAGE_SIZE = 200;
  var CATALOG_PAGE_SIZE = 200;
  var VISIT_PAGE_SIZE = 50;
  var VISIT_TRANSITION_PAGE_SIZE = 20;
  var INVOICE_PAGE_SIZE = 50;
  var MEDIA_ID2 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  var REF_MAPPINGS = [{ name: "id" }, { name: "code" }, { name: "nls" }];
  var ID_MAPPINGS = [{ name: "id" }];
  var RESOURCE_MAPPINGS = [
    { name: "attributes" },
    { name: "code" },
    { name: "id" },
    { name: "nls" },
    { key: "id", mappings: REF_MAPPINGS, name: "type", type: "identifier" },
    { mappings: REF_MAPPINGS, name: "states", type: "collection" }
  ];
  var ADDRESS_MAPPINGS = [
    { name: "address1" },
    { name: "city" },
    { name: "id" },
    { name: "postalCode" },
    { key: "id", mappings: [{ name: "id" }, { name: "code" }], name: "country", type: "identifier" },
    { key: "id", mappings: [{ name: "id" }, { name: "code" }], name: "state", type: "identifier" }
  ];
  var ACCOUNT_ADDRESS_MAPPINGS = [
    { name: "id" },
    { key: "id", mappings: ID_MAPPINGS, name: "user", type: "identifier" },
    {
      name: "addresses",
      type: "collection",
      mappings: [{ key: "id", mappings: ADDRESS_MAPPINGS, name: "address", type: "identifier" }]
    }
  ];
  var ORDER_MAPPINGS = [
    { name: "attributes" },
    { name: "grandTotal" },
    { name: "id" },
    { name: "totalCharges" },
    { name: "totalTaxes" },
    { key: "id", mappings: ID_MAPPINGS, name: "account", type: "identifier" },
    { key: "id", mappings: REF_MAPPINGS, name: "currency", type: "identifier" },
    { mappings: ID_MAPPINGS, name: "items", type: "collection" },
    { mappings: REF_MAPPINGS, name: "states", type: "collection" },
    { key: "id", mappings: REF_MAPPINGS, name: "type", type: "identifier" }
  ];
  var DOCUMENT_TYPE_MAPPINGS = [{ name: "code" }, { name: "id" }];
  var AGREEMENT_MAPPINGS = [
    { name: "attributes" },
    { name: "id" },
    { key: "id", mappings: REF_MAPPINGS, name: "organization", type: "identifier" },
    { mappings: REF_MAPPINGS, name: "states", type: "collection" },
    { key: "id", mappings: REF_MAPPINGS, name: "type", type: "identifier" }
  ];
  var ORDER_ITEM_MAPPINGS = [
    { name: "amount" },
    { name: "grandTotal" },
    { name: "id" },
    { name: "itemCount" },
    { name: "metadata" },
    { name: "sortOrder" },
    { name: "totalTaxes" },
    { key: "id", mappings: ID_MAPPINGS, name: "itemPrice", type: "identifier" },
    { key: "id", mappings: ID_MAPPINGS, name: "order", type: "identifier" }
  ];
  var PRODUCT_PRICE_MAPPINGS = [
    { name: "id" },
    { name: "nls" },
    { key: "id", mappings: ID_MAPPINGS, name: "product", type: "identifier" },
    { key: "id", mappings: REF_MAPPINGS, name: "type", type: "identifier" }
  ];
  var PRODUCT_MAPPINGS = [{ name: "code" }, { name: "id" }, { name: "nls" }];
  var ORDER_TARGET_MAPPINGS = [
    { name: "id" },
    { key: "id", mappings: ID_MAPPINGS, name: "account", type: "identifier" },
    { mappings: REF_MAPPINGS, name: "states", type: "collection" },
    { key: "id", mappings: REF_MAPPINGS, name: "type", type: "identifier" }
  ];
  var AGREEMENT_TARGET_MAPPINGS = [
    { name: "attributes" },
    { name: "id" },
    { mappings: REF_MAPPINGS, name: "states", type: "collection" },
    { key: "id", mappings: REF_MAPPINGS, name: "type", type: "identifier" }
  ];
  var TAGGED_REF_MAPPINGS = [{ name: "id" }, { name: "code" }, { name: "nls" }];
  var VISIT_MAPPINGS = [
    { name: "id" },
    { name: "code" },
    { name: "nls" },
    { name: "start" },
    { name: "end" },
    { name: "attributes" },
    { name: "type", type: "identifier", mappings: TAGGED_REF_MAPPINGS },
    { name: "states", type: "collection", mappings: TAGGED_REF_MAPPINGS }
  ];
  var INVOICE_MAPPINGS = [
    { name: "id" },
    { name: "created" },
    { name: "dueDate" },
    { name: "notes" },
    { name: "amountDue" },
    { name: "totalPaidAmount" },
    { name: "attributes" },
    { name: "type", type: "identifier", mappings: TAGGED_REF_MAPPINGS },
    { name: "states", type: "collection", mappings: TAGGED_REF_MAPPINGS },
    { name: "order", type: "reference", mappings: [{ name: "id" }, { name: "currency", type: "identifier", mappings: [{ name: "id" }, { name: "code" }] }] },
    {
      name: "items",
      type: "collection",
      mappings: [
        { name: "id" },
        { name: "amount" },
        { name: "itemCount" },
        { name: "notes" },
        {
          name: "itemPrice",
          type: "reference",
          mappings: [{ name: "id" }, { name: "product", type: "reference", mappings: TAGGED_REF_MAPPINGS }]
        }
      ]
    }
  ];
  var VISIT_LIST_BODY = /* @__PURE__ */ Object.freeze({
    filters: [{ operator: "=", property: "type.code", value: VISIT_TYPE }],
    mappings: VISIT_MAPPINGS,
    offset: 0,
    pageSize: VISIT_PAGE_SIZE,
    sorting: [{ field: "start", direction: "DESC" }]
  });
  var VISIT_TRANSITIONS_BODY = /* @__PURE__ */ Object.freeze({
    filters: [],
    mappings: [
      { name: "id" },
      { name: "observed" },
      { name: "state", type: "identifier", mappings: TAGGED_REF_MAPPINGS }
    ],
    offset: 0,
    pageSize: VISIT_TRANSITION_PAGE_SIZE,
    sorting: [{ field: "observed", direction: "ASC" }]
  });
  var INVOICE_LIST_BODY = /* @__PURE__ */ Object.freeze({
    mappings: INVOICE_MAPPINGS,
    offset: 0,
    pageSize: INVOICE_PAGE_SIZE,
    sorting: [{ field: "dueDate", direction: "DESC" }]
  });
  function createCoreSnowVisitsAdapter(options2 = {}) {
    var fetchImpl = options2.fetch || globalThis.fetch;
    if (typeof fetchImpl !== "function") throw contractError("fetch-unavailable", "Core snow adapter requires fetch");
    return {
      async load(moduleId, context) {
        if (moduleId !== "appointmentsTimeline") throw contractError("unsupported-module", "Core snow visits adapter cannot load " + moduleId);
        return loadSnowVisits(context, fetchImpl, options2.origin);
      }
    };
  }
  function createCoreSnowInvoicesAdapter(options2 = {}) {
    var fetchImpl = options2.fetch || globalThis.fetch;
    if (typeof fetchImpl !== "function") throw contractError("fetch-unavailable", "Core snow adapter requires fetch");
    return {
      async load(moduleId, context) {
        if (moduleId !== "invoices") throw contractError("unsupported-module", "Core snow invoices adapter cannot load " + moduleId);
        return loadSnowInvoices(context, fetchImpl, options2.origin);
      }
    };
  }
  async function loadSnowVisits(context, fetchImpl = globalThis.fetch, explicitOrigin) {
    var api = readContext(context, explicitOrigin);
    var reply = await requestJson(fetchImpl, api.serviceBase + "/api/tagged/appointment/list.json", readOptions(api, VISIT_LIST_BODY));
    var rows2 = listResult(reply);
    return {
      state: "ready",
      accountId: api.accountId,
      items: rows2.filter(function(row) {
        return text(row && row.type && row.type.code) === VISIT_TYPE;
      }),
      truncated: resultSizeOf(reply, rows2.length) > rows2.length
    };
  }
  async function readVisitTransitions(context, backendId, fetchImpl = globalThis.fetch, explicitOrigin) {
    var api = readContext(context, explicitOrigin);
    var id = positiveInteger(backendId);
    if (!id) throw contractError("invalid-target", "A visit id is required before reading its progress");
    var reply = await requestJson(fetchImpl, api.serviceBase + "/api/tagged/appointment/" + id + "/list-transitions.json", readOptions(api, VISIT_TRANSITIONS_BODY));
    return listResult(reply);
  }
  async function loadSnowInvoices(context, fetchImpl = globalThis.fetch, explicitOrigin) {
    var api = readContext(context, explicitOrigin);
    var reply = await requestJson(fetchImpl, api.billBase + "/api/tagged/invoice/list.json", readOptions(api, INVOICE_LIST_BODY));
    var rows2 = listResult(reply);
    return {
      state: "ready",
      accountId: api.accountId,
      items: rows2,
      truncated: resultSizeOf(reply, rows2.length) > rows2.length
    };
  }
  function createCoreSnowPropertiesAdapter(options2 = {}) {
    var fetchImpl = options2.fetch || globalThis.fetch;
    if (typeof fetchImpl !== "function") throw contractError("fetch-unavailable", "Core snow adapter requires fetch");
    return {
      async load(moduleId, context) {
        if (moduleId !== "properties") throw contractError("unsupported-module", "Core snow properties adapter cannot load " + moduleId);
        return loadSnowProperties(context, fetchImpl, options2.origin);
      }
    };
  }
  function createCoreSnowQuotesAdapter(options2 = {}) {
    var fetchImpl = options2.fetch || globalThis.fetch;
    if (typeof fetchImpl !== "function") throw contractError("fetch-unavailable", "Core snow adapter requires fetch");
    return {
      async load(moduleId, context) {
        if (moduleId !== "proposals") throw contractError("unsupported-module", "Core snow quotes adapter cannot load " + moduleId);
        return loadSnowQuotes(context, fetchImpl, options2.origin);
      },
      async readOrder(backendId, context) {
        return readCustomerOrder(context, backendId, fetchImpl, options2.origin);
      },
      async readAgreement(backendId, context) {
        return readCustomerAgreement(context, backendId, fetchImpl, options2.origin);
      },
      async sendOrderEvent(backendId, event, context) {
        var api = readContext(context, options2.origin);
        return sendEvent(fetchImpl, api, api.billBase + "/api/tagged/order/" + commandId(backendId) + "/send-event.json?event=" + eventCode(event));
      },
      async sendAgreementEvent(backendId, event, context) {
        var api = readContext(context, options2.origin);
        return sendEvent(fetchImpl, api, api.coreBase + "/api/tagged/document/" + commandId(backendId) + "/send-event.json?event=" + eventCode(event));
      }
    };
  }
  async function loadSnowProperties(context, fetchImpl = globalThis.fetch, explicitOrigin) {
    var api = readContext(context, explicitOrigin);
    var rows2 = await customerProperties(api, fetchImpl);
    var addresses = await resolveAddresses(api, fetchImpl, rows2.items);
    return {
      state: "ready",
      accountId: api.accountId,
      items: rows2.items.map(function(row) {
        return propertyRecord(row, addresses);
      }),
      scopeMode: rows2.scopeMode,
      truncated: rows2.truncated
    };
  }
  async function loadSnowQuotes(context, fetchImpl = globalThis.fetch, explicitOrigin) {
    var api = readContext(context, explicitOrigin);
    var primary = await Promise.all([
      settled(customerAgreements(api, fetchImpl)),
      settled(customerOrders(api, fetchImpl))
    ]);
    var agreements = primary[0];
    var orders = primary[1];
    rethrowSessionLoss(primary);
    if (agreements.state !== "ready" && orders.state !== "ready") throw orders.error;
    var visibleOrderIds = orders.state === "ready" ? customerVisibleOrderIds(orders.rows) : [];
    var orderItems2 = visibleOrderIds.length ? await settled(customerOrderItems(api, fetchImpl, visibleOrderIds)) : skippedRead("server-scoped", orders.state === "ready");
    rethrowSessionLoss([orderItems2]);
    var priceIds = referencedIds(orderItems2.rows, "itemPrice");
    var productPrices = priceIds.length ? await settled(catalogRows(fetchImpl, api, api.pimBase + "/api/product-price/list.json", priceIds, PRODUCT_PRICE_MAPPINGS)) : skippedRead("unscoped", orderItems2.state === "ready");
    var productIds = referencedIds(productPrices.rows, "product");
    var products = productIds.length ? await settled(catalogRows(fetchImpl, api, api.pimBase + "/api/product/list.json", productIds, PRODUCT_MAPPINGS)) : skippedRead("unscoped", productPrices.state === "ready");
    return {
      state: "ready",
      accountId: api.accountId,
      scopeMode: weakestScope([agreements, orders, orderItems2]),
      reads: {
        agreements: readSummary(agreements),
        orders: readSummary(orders),
        orderItems: readSummary(orderItems2),
        productPrices: readSummary(productPrices),
        products: readSummary(products)
      },
      client: { displayName: api.accountName },
      agreements: agreements.rows,
      quoteOrders: orders.rows,
      orderItems: orderItems2.rows,
      productPrices: productPrices.rows,
      products: products.rows
    };
  }
  async function readCustomerOrder(context, backendId, fetchImpl = globalThis.fetch, explicitOrigin) {
    var api = readContext(context, explicitOrigin);
    var id = commandId(backendId);
    var row = await requestJson(fetchImpl, api.billBase + "/api/tagged/order/get.json?id=" + id, readOptions(api, ORDER_TARGET_MAPPINGS));
    if (!row || positiveInteger(row.id) !== id) throw contractError("not-found", "Core did not return the Order");
    if (positiveInteger(row.account && row.account.id) !== api.accountId) throw contractError("customer-forbidden", "The Order does not belong to the signed-in customer");
    return row;
  }
  async function readCustomerAgreement(context, backendId, fetchImpl = globalThis.fetch, explicitOrigin) {
    var api = readContext(context, explicitOrigin);
    var id = commandId(backendId);
    var row = await requestJson(fetchImpl, api.coreBase + "/api/tagged/document/get.json?id=" + id, readOptions(api, AGREEMENT_TARGET_MAPPINGS));
    if (!row || positiveInteger(row.id) !== id || text(row.type && row.type.code) !== AGREEMENT_TYPE) throw contractError("not-found", "Core did not return the service agreement");
    if (attributeNumber(row, "CLIENT") !== api.accountId) throw contractError("customer-forbidden", "The service agreement does not belong to the signed-in customer");
    return row;
  }
  async function customerAgreements(api, fetchImpl) {
    var types = await requestJson(fetchImpl, api.coreBase + "/api/document-type/list.json", readOptions(api, {
      filters: [{ type: "STRING", operator: "=", property: "code", value: AGREEMENT_TYPE }],
      mappings: DOCUMENT_TYPE_MAPPINGS,
      offset: 0,
      pageSize: 2
    }));
    var type = listResult(types).find(function(row) {
      return text(row && row.code) === AGREEMENT_TYPE;
    });
    var typeId = positiveInteger(type && type.id);
    if (!typeId) throw contractError("agreement-type-unavailable", "Core did not return the service agreement type");
    var reply = await requestJson(fetchImpl, api.coreBase + "/api/tagged/document/list.json", readOptions(api, {
      filters: [
        { type: "STRING", operator: "=", property: "type.code", value: AGREEMENT_TYPE },
        { type: "INTEGER", operator: "=", property: "attributes." + typeId + ".CLIENT.value", value: String(api.accountId) }
      ],
      mappings: AGREEMENT_MAPPINGS,
      offset: 0,
      pageSize: AGREEMENT_PAGE_SIZE
    }));
    return scopedRows(reply, function(row) {
      return text(row && row.type && row.type.code) === AGREEMENT_TYPE && attributeNumber(row, "CLIENT") === api.accountId;
    });
  }
  async function customerOrders(api, fetchImpl) {
    var reply = await requestJson(fetchImpl, api.billBase + "/api/tagged/order/list.json", readOptions(api, {
      filters: [{ type: "INTEGER", operator: "=", property: "account.id", value: String(api.accountId) }],
      mappings: ORDER_MAPPINGS,
      offset: 0,
      pageSize: ORDER_PAGE_SIZE
    }));
    return scopedRows(reply, function(row) {
      return positiveInteger(row && row.account && row.account.id) === api.accountId;
    });
  }
  async function customerOrderItems(api, fetchImpl, orderIds) {
    var reply = await requestJson(fetchImpl, api.billBase + "/api/tagged/order-item/list.json", readOptions(api, {
      filters: [
        { type: "INTEGER", operator: "=", property: "order.account.id", value: String(api.accountId) },
        { type: "INTEGER", operator: "IN", property: "order.id", value: orderIds.join(",") }
      ],
      mappings: ORDER_ITEM_MAPPINGS,
      offset: 0,
      pageSize: LINE_PAGE_SIZE
    }));
    return scopedRows(reply, function(row) {
      return orderIds.indexOf(positiveInteger(row && row.order && row.order.id)) !== -1;
    });
  }
  async function catalogRows(fetchImpl, api, url, ids, mappings) {
    var reply = await requestJson(fetchImpl, url, readOptions(api, {
      filters: [{ type: "INTEGER", operator: "IN", property: "id", value: ids.join(",") }],
      mappings,
      offset: 0,
      pageSize: CATALOG_PAGE_SIZE
    }));
    var rows2 = listResult(reply).filter(function(row) {
      return ids.indexOf(positiveInteger(row && row.id)) !== -1;
    });
    return { rows: rows2, scopeMode: "unscoped", truncated: resultSizeOf(reply, rows2.length) > rows2.length };
  }
  function scopedRows(reply, owned) {
    var rows2 = listResult(reply);
    var kept = rows2.filter(owned);
    return {
      rows: kept,
      scopeMode: kept.length === rows2.length ? "server-scoped" : "browser-filtered",
      truncated: resultSizeOf(reply, rows2.length) > rows2.length
    };
  }
  function customerVisibleOrderIds(rows2) {
    var ids = [];
    (rows2 || []).forEach(function(row) {
      var id = positiveInteger(row && row.id);
      if (!id || QUOTE_ORDER_TYPES.indexOf(text(row.type && row.type.code)) === -1) return;
      if (!Object.prototype.hasOwnProperty.call(CUSTOMER_ORDER_STATUS, latestStateCode(row))) return;
      if (ids.indexOf(id) === -1) ids.push(id);
    });
    return ids;
  }
  function referencedIds(rows2, field2) {
    var ids = [];
    (rows2 || []).forEach(function(row) {
      var id = positiveInteger(row && row[field2] && row[field2].id);
      if (id && ids.indexOf(id) === -1) ids.push(id);
    });
    return ids;
  }
  async function settled(operation) {
    try {
      var result = await operation;
      return { state: "ready", rows: result.rows, scopeMode: result.scopeMode, truncated: !!result.truncated, error: null };
    } catch (error2) {
      return { state: error2 && error2.code === "customer-forbidden" ? "unauthorized" : "error", rows: null, scopeMode: null, truncated: false, error: error2 };
    }
  }
  function skippedRead(scopeMode, readable) {
    return readable ? { state: "ready", rows: [], scopeMode, truncated: false, error: null } : { state: "error", rows: null, scopeMode: null, truncated: false, error: null };
  }
  function rethrowSessionLoss(reads) {
    var lost = reads.find(function(read) {
      return read.error && read.error.code === "session-expired";
    });
    if (lost) throw lost.error;
  }
  function readSummary(read) {
    var summary = { state: read.state, scopeMode: read.scopeMode, truncated: read.truncated };
    if (read.error && read.error.code) summary.reasonCode = read.error.code;
    return summary;
  }
  function weakestScope(reads) {
    var modes = reads.filter(function(read) {
      return read.state === "ready";
    }).map(function(read) {
      return read.scopeMode;
    });
    if (modes.indexOf("unscoped") !== -1) return "unscoped";
    if (modes.indexOf("browser-filtered") !== -1) return "browser-filtered";
    return modes.length ? "server-scoped" : null;
  }
  function listResult(reply) {
    return Array.isArray(reply && reply.result) ? reply.result : [];
  }
  function resultSizeOf(reply, fallback) {
    return reply && typeof reply.resultSize === "number" && Number.isFinite(reply.resultSize) ? reply.resultSize : fallback;
  }
  async function sendEvent(fetchImpl, api, url) {
    var response = await fetchImpl(url, readOptions(api, {}));
    if (!response || typeof response.ok !== "boolean") throw contractError("invalid-response", "Core request returned an invalid response");
    if (!response.ok) throw failure(response.status, true);
    return true;
  }
  function commandId(backendId) {
    var id = positiveInteger(backendId);
    if (!id) throw contractError("invalid-target", "A Core id is required before sending an event");
    return id;
  }
  function eventCode(event) {
    var code = text(event);
    if (!/^[A-Z][A-Z_]*-[A-Z][A-Z_]*$/.test(code)) throw contractError("invalid-event", "A workflow event code is required");
    return encodeURIComponent(code);
  }
  async function customerProperties(api, fetchImpl) {
    var items = [];
    var truncated = false;
    var scopeMode = "server-scoped";
    for (var page = 0; page < PROPERTY_PAGE_LIMIT; page += 1) {
      var response = await requestJson(fetchImpl, api.resourceBase + "/api/tagged/resource/list.json", readOptions(api, {
        filters: [{ type: "STRING", operator: "=", property: "type.code", value: PROPERTY_TYPE }],
        mappings: RESOURCE_MAPPINGS,
        offset: page * PROPERTY_PAGE_SIZE,
        pageSize: PROPERTY_PAGE_SIZE
      }));
      var rows2 = Array.isArray(response && response.result) ? response.result : [];
      rows2.forEach(function(row) {
        if (attributeNumber(row, "ACCOUNT") === api.accountId) items.push(row);
        else scopeMode = "browser-filtered";
      });
      if (rows2.length < PROPERTY_PAGE_SIZE) return { items, truncated: false, scopeMode };
      truncated = page === PROPERTY_PAGE_LIMIT - 1;
    }
    return { items, truncated, scopeMode };
  }
  async function resolveAddresses(api, fetchImpl, rows2) {
    var resolved = {};
    var ids = [];
    rows2.forEach(function(row) {
      var id = attributeNumber(row, "ADDRESS");
      if (id && ids.indexOf(id) < 0) ids.push(id);
    });
    if (!ids.length) return resolved;
    if (!api.userId) throw contractError("session-user-required", "The signed-in Core User is required before reading property addresses");
    var account = await requestJson(fetchImpl, api.accountBase + "/api/tagged/account/get.json?id=" + api.accountId, readOptions(api, ACCOUNT_ADDRESS_MAPPINGS));
    if (positiveInteger(account && account.id) !== api.accountId || positiveInteger(account && account.user && account.user.id) !== api.userId) {
      throw contractError("customer-forbidden", "Property addresses must belong to the signed-in customer's Account");
    }
    (Array.isArray(account.addresses) ? account.addresses : []).forEach(function(link) {
      var address = link && link.address;
      var id = positiveInteger(address && address.id);
      if (id && ids.indexOf(id) !== -1) resolved[String(id)] = address;
    });
    return resolved;
  }
  function propertyRecord(row, addresses) {
    var address = addresses[String(attributeNumber(row, "ADDRESS"))] || null;
    return {
      id: "prop-core-" + row.id,
      backendId: positiveInteger(row.id),
      name: localizedName2(row.nls) || text(row.code) || "Property",
      address: formatPostalAddress(address),
      city: address ? text(address.city) : "",
      postal: address ? text(address.postalCode) : "",
      region: address && address.state ? text(address.state.code) : "",
      country: address && address.country ? text(address.country.id || address.country.code) : "",
      category: attributeText(row, "PROPERTY_CATEGORY") || null,
      stateCode: latestStateCode(row) || null,
      lat: attributeCoordinate(row, "COORD_LAT", 90),
      lon: attributeCoordinate(row, "COORD_LNG", 180),
      areaSqft: attributeArea(row, "SERVICE_AREA_SQFT"),
      planId: attributeMediaId(row, "PROPERTY_PLAN"),
      zone: null,
      contract: null,
      quoteSiteId: null,
      appointment: null,
      ticket: null,
      lastService: null
    };
  }
  function attributeArea(row, code) {
    var entry = attributeEntry(row, code);
    var value = entry ? entry.value : null;
    var number = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : Number.NaN;
    return Number.isFinite(number) && number > 0 ? number : null;
  }
  function attributeMediaId(row, code) {
    var entry = attributeEntry(row, code);
    var value = entry ? entry.value : null;
    if (typeof value === "string" && /^\s*\[/.test(value)) {
      try {
        value = JSON.parse(value);
      } catch (_) {
        return "";
      }
    }
    var ids = (Array.isArray(value) ? value : value == null ? [] : [value]).map(function(item) {
      var id = text(item && typeof item === "object" ? item.id : item).toLowerCase();
      return MEDIA_ID2.test(id) ? id : "";
    });
    return ids.length === 1 ? ids[0] : "";
  }
  function attributeCoordinate(row, code, limit) {
    var entry = attributeEntry(row, code);
    var value = entry ? entry.value : null;
    var number = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : Number.NaN;
    return Number.isFinite(number) && Math.abs(number) <= limit ? number : null;
  }
  function readContext(context, explicitOrigin) {
    var config = context && context.config || {};
    var runtimeState = context && context.state || {};
    var session2 = runtimeState.session || {};
    var accessToken = text(session2.accessToken || session2.access_token);
    if (!accessToken) throw contractError("session-required", "A Core access token is required");
    var account = runtimeState.customerAccount || session2.account || null;
    var accountId = positiveInteger(account && account.id);
    if (!accountId) throw contractError("customer-unresolved", "A resolved customer Account is required before reading snow records");
    var organization = text(config.organization);
    if (!organization) throw contractError("organization-required", "A portal organization code is required");
    var origin = explicitOrigin || config.origin || browserOrigin();
    return {
      accountBase: sameOriginBase(config.accountApiBase || "/core-acct", origin, "Core Account API base"),
      accountId,
      accountName: text(account && typeof account.displayName === "string" ? account.displayName : ""),
      authorization: text(session2.tokenType || session2.token_type || "Bearer") + " " + accessToken,
      billBase: sameOriginBase(config.billApiBase || "/core-bill", origin, "Core Bill API base"),
      coreBase: sameOriginBase(config.coreApiBase || "/core", origin, "Core API base"),
      organization,
      pimBase: sameOriginBase(PIM_SERVICE_BASE, origin, "Core PIM API base"),
      resourceBase: sameOriginBase(config.resourceApiBase || "/core-rm", origin, "Core Resource API base"),
      serviceBase: sameOriginBase(config.serviceApiBase || "/core-svc", origin, "Core Service API base"),
      userId: positiveInteger(session2.userId)
    };
  }
  function readOptions(api, body) {
    return {
      method: "POST",
      credentials: "same-origin",
      headers: {
        Authorization: api.authorization,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Organization-Code": api.organization
      },
      body: JSON.stringify(body)
    };
  }
  async function requestJson(fetchImpl, url, options2) {
    var response = await fetchImpl(url, options2);
    if (!response || typeof response.ok !== "boolean") throw contractError("invalid-response", "Core request returned an invalid response");
    if (!response.ok) throw failure(response.status);
    var payload;
    try {
      payload = await response.json();
    } catch (_) {
      throw contractError("invalid-response", "Core response was not valid JSON");
    }
    if (typeof payload === "string") throw contractError("unprojectable-response", "Core answered with an unprojected body");
    return payload;
  }
  function sameOriginBase(value, origin, label) {
    if (!origin) throw contractError("origin-required", label + " requires a browser origin");
    var target = new URL(String(value || ""), origin);
    if (target.origin !== new URL(origin).origin) throw contractError("cross-origin-service", label + " must be same-origin");
    return target.href.replace(/\/+$/, "");
  }
  function browserOrigin() {
    return globalThis.location && globalThis.location.origin || "";
  }
  function localizedName2(value) {
    if (!value || typeof value !== "object") return "";
    var localized = value.en || value["en-US"] || Object.values(value)[0] || {};
    return text(localized && (localized.NAME || localized.name));
  }
  function failure(status, command) {
    var code = status === 401 ? "session-expired" : status === 403 ? "customer-forbidden" : status === 404 ? "not-found" : command && status >= 400 && status < 500 ? "command-refused" : "core-request-failed";
    var error2 = contractError(code, "Core request failed with HTTP " + status);
    error2.status = status;
    return error2;
  }
  function contractError(code, message) {
    var error2 = new Error(message);
    error2.code = code;
    return error2;
  }
  var coreSnowContract = /* @__PURE__ */ Object.freeze({
    accountAddressMappings: ACCOUNT_ADDRESS_MAPPINGS,
    addressMappings: ADDRESS_MAPPINGS,
    agreementMappings: AGREEMENT_MAPPINGS,
    agreementType: AGREEMENT_TYPE,
    invoiceListBody: INVOICE_LIST_BODY,
    customerQuoteStatus: /* @__PURE__ */ Object.freeze(Object.assign({}, CUSTOMER_ORDER_STATUS)),
    operatorQuoteStates: /* @__PURE__ */ Object.freeze(OPERATOR_ORDER_STATES.slice()),
    orderItemMappings: ORDER_ITEM_MAPPINGS,
    orderMappings: ORDER_MAPPINGS,
    productMappings: PRODUCT_MAPPINGS,
    productPriceMappings: PRODUCT_PRICE_MAPPINGS,
    propertyBaseType: PROPERTY_BASE_TYPE,
    propertyPageLimit: PROPERTY_PAGE_LIMIT,
    propertyPageSize: PROPERTY_PAGE_SIZE,
    propertyType: PROPERTY_TYPE,
    quoteOrderTypes: /* @__PURE__ */ Object.freeze(QUOTE_ORDER_TYPES.slice()),
    resourceMappings: RESOURCE_MAPPINGS,
    visitListBody: VISIT_LIST_BODY,
    visitTransitionsBody: VISIT_TRANSITIONS_BODY,
    quoteFilters: ["account.id"],
    agreementFilters: ["type.code", "attributes.{SERVICE_AGREEMENT type id}.CLIENT.value"],
    orderItemFilters: ["order.account.id", "order.id"],
    catalogFilters: ["id"],
    propertyFilters: ["type.code"],
    scopeModes: /* @__PURE__ */ Object.freeze({
      agreements: "server-scoped",
      orders: "server-scoped",
      orderItems: "server-scoped",
      productPrices: "unscoped",
      products: "unscoped",
      properties: "server-scoped"
    })
  });

  // app-templates/customer-portal/runtime/src/adapters/core-oidc-adapter.js
  var manager = null;
  function createCoreOidcAdapter() {
    return {
      async load(moduleId, context) {
        if (moduleId !== "auth") throw new Error("Core OIDC adapter cannot load " + moduleId);
        if (context.config.dataMode !== "live" || context.config.authMode !== "required") {
          return { state: "ready-signed-in", user: null };
        }
        return loadCoreOidcSession(context.config);
      }
    };
  }
  async function loadCoreOidcSession(config) {
    if (!globalThis.oidc || !globalThis.oidc.UserManager || !globalThis.oidc.WebStorageStateStore) {
      throw contractError2("oidc-library-unavailable", "Core sign-in library did not load");
    }
    var coreBase = sameOriginUrl(config.authCoreBase || "/core", "Core authentication base").replace(/\/+$/, "");
    var expectedCallback = sameOriginUrl(config.authCallbackPath || "/core/oauth2-callback.html", "Core callback");
    var response = await globalThis.fetch(coreBase + "/.well-known/oauth-protected-resource/", {
      credentials: "omit",
      headers: { Accept: "application/json" }
    });
    if (!response.ok) throw contractError2("oidc-discovery-failed", "Core authentication discovery failed with HTTP " + response.status);
    var metadata = await response.json();
    var authority = Array.isArray(metadata.authorization_servers) ? metadata.authorization_servers[0] : "";
    if (!authority || !metadata.resource || !metadata.x_client_id || !metadata.x_redirect_uri || !metadata.x_post_logout_redirect_uri) {
      throw contractError2("oidc-discovery-incomplete", "Core authentication discovery is incomplete");
    }
    if (new URL(metadata.resource, globalThis.location.origin).origin !== globalThis.location.origin) {
      throw contractError2("oidc-cross-origin-resource", "Core authentication resource must be same-origin");
    }
    if (new URL(authority, globalThis.location.origin).origin !== globalThis.location.origin) {
      throw contractError2("oidc-cross-origin-authority", "Core authorization server must be same-origin");
    }
    if (new URL(metadata.x_redirect_uri, globalThis.location.origin).href !== expectedCallback || new URL(metadata.x_post_logout_redirect_uri, globalThis.location.origin).href !== expectedCallback) {
      throw contractError2("oidc-callback-mismatch", "Core authentication callback does not match the portal contract");
    }
    manager = new globalThis.oidc.UserManager({
      authority,
      client_id: metadata.x_client_id,
      post_logout_redirect_uri: expectedCallback,
      redirect_uri: expectedCallback,
      response_type: "code",
      scope: "openid profile email roles",
      userStore: new globalThis.oidc.WebStorageStateStore({ store: globalThis.localStorage })
    });
    var user = await manager.getUser();
    if (user && user.expired) {
      await manager.removeUser();
      user = null;
    }
    return { state: user ? "ready-signed-in" : "ready-signed-out", user: user || null };
  }
  function storedCoreOidcUser() {
    if (!manager) return Promise.resolve(null);
    return manager.getUser().then(function(user) {
      return user && !user.expired ? user : null;
    });
  }
  function startCoreOidcSignIn(config) {
    if (!manager) return Promise.reject(contractError2("oidc-manager-unavailable", "Core sign-in is not ready"));
    var returnUrl = portalRouteUrl(config, config.defaultRoute || "orders.list");
    globalThis.sessionStorage.setItem(config.authReturnStorageKey || "oidc-return-url", returnUrl.href);
    return manager.signinRedirect();
  }
  function startCoreOidcSignOut(config) {
    if (!manager) return Promise.reject(contractError2("oidc-manager-unavailable", "Core sign-out is not ready"));
    var configured = config && config.logoutReturnUrl;
    var returnUrl = configured ? new URL(configured) : new URL(globalThis.location.href);
    if (!configured) returnUrl.hash = "#/login";
    if (configured && (returnUrl.protocol !== "https:" || !(config.allowedNavOrigins || []).includes(returnUrl.origin))) {
      return Promise.reject(contractError2("oidc-logout-return-invalid", "Configured sign-out return URL is not allowlisted"));
    }
    globalThis.sessionStorage.setItem(config.authLogoutReturnStorageKey || "oidc-logout-return-url", returnUrl.href);
    return manager.signoutRedirect();
  }
  function sameOriginUrl(value, label) {
    var url = new URL(value, globalThis.location.origin);
    if (url.origin !== globalThis.location.origin) throw contractError2("cross-origin-service", label + " must be same-origin");
    return url.href;
  }
  function portalRouteUrl(config, routeId) {
    var configured = config && config.portalUrl;
    var returnUrl = configured ? new URL(configured) : new URL(globalThis.location.href);
    if (configured && (returnUrl.protocol !== "https:" || !(config.allowedNavOrigins || []).includes(returnUrl.origin))) {
      throw contractError2("oidc-return-invalid", "Configured portal return URL is not allowlisted");
    }
    var route = routePath(routeId);
    if (config.routerMode === "history") {
      if (!returnUrl.pathname.endsWith("/")) throw contractError2("oidc-return-invalid", "History-mode portal URL must end with a slash");
      returnUrl.pathname += route.replace(/^\//, "");
      return returnUrl;
    }
    returnUrl.hash = "#" + route;
    return returnUrl;
  }
  function contractError2(code, message) {
    var error2 = new Error(message);
    error2.code = code;
    return error2;
  }

  // app-templates/customer-portal/runtime/src/adapters/core-user-profile-adapter.js
  var CONTACT_ENTRY_MAPPINGS = [
    { name: "id" },
    { name: "value" },
    { key: "id", mappings: [{ name: "id" }, { name: "code" }], name: "kind", type: "identifier" },
    { key: "id", mappings: [{ name: "id" }, { name: "code" }], name: "type", type: "identifier" }
  ];
  var ACCOUNT_CONTACT_MAPPINGS = [
    { name: "id" },
    { name: "code" },
    {
      mappings: [
        { name: "id" },
        { name: "firstName" },
        { name: "lastName" },
        { mappings: CONTACT_ENTRY_MAPPINGS, name: "contactEntries", type: "collection" }
      ],
      name: "contacts",
      type: "collection"
    }
  ];
  var USER_MAPPINGS = [
    { name: "email" },
    { name: "enabled" },
    { name: "fullname" },
    { name: "id" },
    { name: "name" },
    { name: "optimistic" },
    { key: "id", name: "language", type: "identifier" },
    { key: "id", name: "workflow", type: "identifier" }
  ];
  var saveFlight = null;
  function createCoreUserProfileAdapter(options2 = {}) {
    var fetchImpl = options2.fetch || globalThis.fetch;
    return {
      async load(moduleId, context) {
        if (moduleId !== "profile") throw error("unsupported-module", "Core User profile adapter cannot load " + moduleId);
        return loadCoreUserProfile(context, fetchImpl, options2.origin);
      },
      save(input, context) {
        if (saveFlight) return saveFlight;
        saveFlight = saveCoreUserProfile(input, context, fetchImpl, options2.origin).finally(function() {
          saveFlight = null;
        });
        return saveFlight;
      }
    };
  }
  async function loadCoreUserProfile(context, fetchImpl = globalThis.fetch, explicitOrigin) {
    var api = requestContext(context, explicitOrigin);
    var row = await requestJson2(fetchImpl, api.base + "/api/user/get.json?id=" + api.userId, options(api, USER_MAPPINGS));
    var phone = api.accountId ? await loadAccountPhone(api, fetchImpl) : null;
    return normalize(row, api.userId, phone);
  }
  async function loadAccountPhone(api, fetchImpl) {
    if (!api.accountBase) return null;
    var response = await requestJson2(fetchImpl, api.accountBase + "/api/account/list.json", options(api, {
      filters: [{ type: "INTEGER", operator: "=", property: "id", value: String(api.accountId) }],
      mappings: ACCOUNT_CONTACT_MAPPINGS,
      offset: 0,
      pageSize: 1
    }));
    var account = (Array.isArray(response && response.result) ? response.result : [])[0];
    if (!account || positiveInteger2(account.id) !== api.accountId) return null;
    var contacts = Array.isArray(account.contacts) ? account.contacts : [];
    for (var index = 0; index < contacts.length; index += 1) {
      var entries = Array.isArray(contacts[index].contactEntries) ? contacts[index].contactEntries : [];
      for (var entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
        var entry = entries[entryIndex];
        if (text2(entry.type && entry.type.code) === "PHONE" && text2(entry.value)) return text2(entry.value);
      }
    }
    return null;
  }
  async function saveCoreUserProfile(input, context, fetchImpl = globalThis.fetch, explicitOrigin) {
    var api = requestContext(context, explicitOrigin);
    var current = await requestJson2(fetchImpl, api.base + "/api/user/get.json?id=" + api.userId, options(api, USER_MAPPINGS));
    var entity = {
      email: text2(input && input.email),
      enabled: current.enabled !== false,
      fullname: text2(current.fullname),
      id: api.userId,
      language: requiredRef(current.language, "User language"),
      name: text2(current.name),
      optimistic: finiteNumber3(current.optimistic, 0),
      workflow: requiredRef(current.workflow, "User workflow")
    };
    if (!entity.email) throw error("profile-email-required", "Email is required");
    await requestJson2(fetchImpl, api.base + "/api/user/save.json", options(api, { entities: [entity], mappings: USER_MAPPINGS }));
    var readback = await requestJson2(fetchImpl, api.base + "/api/user/get.json?id=" + api.userId, options(api, USER_MAPPINGS));
    return normalize(readback, api.userId);
  }
  function normalize(row, userId, phone) {
    if (!row || positiveInteger2(row.id) !== userId) throw error("profile-scope-mismatch", "Core User readback did not match the signed-in User");
    return {
      state: "ready",
      email: text2(row.email),
      phone: phone || null,
      prefs: {},
      optimistic: Number.isFinite(Number(row.optimistic)) ? Number(row.optimistic) : null,
      // Phone is read-only until a scoped contact write contract exists; only the
      // email edit is opened. Preferences have nowhere to persist in Core.
      allowedActions: ["edit-email"],
      unavailableFields: phone ? ["preferences"] : ["phone", "preferences"]
    };
  }
  function requestContext(context, explicitOrigin) {
    var config = context && context.config || {};
    var state2 = context && context.state || {};
    var session2 = context && context.session || state2.session || {};
    var token = text2(session2.accessToken || session2.access_token);
    var userId = positiveInteger2(session2.userId);
    if (!token) throw error("session-required", "A Core access token is required");
    if (!userId) throw error("session-user-required", "The signed-in Core User is required");
    var origin = explicitOrigin || config.origin || globalThis.location && globalThis.location.origin;
    var base = sameOriginBase2(config.coreApiBase || "/core", origin, "Core API base");
    var customer = context && context.account || state2.customerAccount || session2.account || {};
    return {
      accountBase: sameOriginBase2(config.accountApiBase || "/core-acct", origin, "Core Account API base"),
      accountId: positiveInteger2(customer.id) || null,
      base,
      token: text2(session2.tokenType || session2.token_type || "Bearer") + " " + token,
      userId
    };
  }
  function options(api, body) {
    return { method: "POST", credentials: "same-origin", headers: { Authorization: api.token, "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(body) };
  }
  async function requestJson2(fetchImpl, url, requestOptions) {
    var response = await fetchImpl(url, requestOptions);
    if (!response || typeof response.ok !== "boolean") throw error("invalid-response", "Core User returned an invalid response");
    if (!response.ok) {
      var code = response.status === 401 ? "session-expired" : response.status === 403 ? "customer-forbidden" : response.status === 409 || response.status === 412 ? "conflict" : "profile-request-failed";
      var failure2 = error(code, "Core User request failed with HTTP " + response.status);
      failure2.status = response.status;
      throw failure2;
    }
    try {
      return await response.json();
    } catch (_) {
      throw error("invalid-response", "Core User response was not valid JSON");
    }
  }
  function sameOriginBase2(value, origin, label) {
    if (!origin) throw error("origin-required", label + " requires a browser origin");
    var url = new URL(value, origin);
    if (url.origin !== new URL(origin).origin) throw error("cross-origin-service", label + " must be same-origin");
    return url.href.replace(/\/+$/, "");
  }
  function requiredRef(value, label) {
    var id = value && positiveInteger2(value.id);
    if (!id) throw error("profile-reference-missing", label + " is missing");
    return { id };
  }
  function positiveInteger2(value) {
    var number = Number(value);
    return Number.isInteger(number) && number > 0 ? number : null;
  }
  function finiteNumber3(value, fallback) {
    var number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }
  function text2(value) {
    return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
  }
  function error(code, message) {
    var failure2 = new Error(message);
    failure2.code = code;
    return failure2;
  }

  // app-templates/customer-portal/runtime/src/adapters/core-profile-form-adapter.js
  var PROFILE_FORM = /* @__PURE__ */ Object.freeze({ typeCode: "CUSTOMER_PROFILE_UPDATE", preference: "SNOW_CUSTOMER_PROFILE_UPDATE" });
  var LOGIN_FORM = /* @__PURE__ */ Object.freeze({ typeCode: "CUSTOMER_LOGIN_CHANGE", preference: "SNOW_CUSTOMER_LOGIN_CHANGE" });
  var INVOICE_PAYMENT_FORM = /* @__PURE__ */ Object.freeze({ typeCode: "CUSTOMER_INVOICE_PAYMENT", preference: "SNOW_CUSTOMER_INVOICE_PAYMENT" });
  var OUTCOMES = /* @__PURE__ */ Object.freeze(["APPLIED", "REFUSED", "FAILED"]);
  var FORM_LOCALE = "en";
  var POLL_INTERVAL_MS = 1e3;
  var OUTCOME_TIMEOUT_MS = 45e3;
  function createCoreProfileFormAdapter(options2 = {}) {
    var fetchImpl = options2.fetch || globalThis.fetch;
    if (typeof fetchImpl !== "function") throw coded3("fetch-unavailable", "Core profile form adapter requires fetch");
    var wait = options2.wait || function(ms) {
      return new Promise(function(resolve) {
        setTimeout(resolve, ms);
      });
    };
    var now = options2.now || function() {
      return Date.now();
    };
    var pollInterval = options2.pollIntervalMs || POLL_INTERVAL_MS;
    var timeout = options2.timeoutMs || OUTCOME_TIMEOUT_MS;
    var typeIds = {};
    async function formTypeId(form, api) {
      if (typeIds[form.typeCode]) return typeIds[form.typeCode];
      var type = await requestJson3(fetchImpl, api.origin + "/" + FORM_LOCALE + api.cmsPath + "/api/form-type/" + encodeURIComponent(form.typeCode) + "/get.json", {
        method: "GET",
        credentials: "same-origin",
        headers: { Accept: "application/json" }
      }, "form-type-unavailable");
      var id = positiveInteger(type && type.id);
      if (!id || text(type.code) !== form.typeCode) throw coded3("form-type-unavailable", "Core did not answer the " + form.typeCode + " form type");
      typeIds[form.typeCode] = id;
      return id;
    }
    var adapter = {
      async submit(form, values, context) {
        var api = requestContext2(context);
        var typeId = await formTypeId(form, api);
        var attributes = {};
        (/* @__PURE__ */ Object.keys(values)).forEach(function(code) {
          attributes[code] = { value: values[code] };
        });
        var formId = await requestJson3(fetchImpl, api.cmsBase + "/api/form/submit.json", {
          method: "POST",
          credentials: "same-origin",
          headers: api.headers({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            type: { id: typeId },
            organization: { id: api.organizationId },
            attributes: { [String(typeId)]: attributes },
            metadata: { language: FORM_LOCALE }
          })
        }, "profile-submit-failed");
        var id = positiveInteger(formId);
        if (!id) throw coded3("profile-submit-failed", "Core accepted the form without a form id");
        return id;
      },
      async outcome(form, formId, context) {
        var reported = await adapter.report(form, formId, context, OUTCOMES);
        return {
          outcome: reported.outcome,
          field: text(reported.field) || null,
          message: text(reported.message),
          changed: Array.isArray(reported.changed) ? reported.changed.map(text).filter(Boolean) : []
        };
      },
      async report(form, formId, context, outcomes) {
        var api = requestContext2(context);
        var deadline = now() + timeout;
        while (true) {
          var preferences = await requestJson3(fetchImpl, api.coreBase + "/api/user/preferences.json", {
            method: "GET",
            credentials: "same-origin",
            headers: api.headers({})
          }, "outcome-unreadable");
          var reported = parsed(preferences && preferences[form.preference]);
          if (reported && positiveInteger(reported.form) === formId && outcomes.indexOf(reported.outcome) !== -1) return reported;
          if (now() >= deadline) throw coded3("outcome-unknown", "Core did not report the outcome of form " + formId + " in time");
          await wait(pollInterval);
        }
      }
    };
    return adapter;
  }
  function parsed(value) {
    if (typeof value !== "string" || !value) return null;
    try {
      var result = JSON.parse(value);
      return result && typeof result === "object" ? result : null;
    } catch (_) {
      return null;
    }
  }
  function requestContext2(context) {
    var config = context && context.config || {};
    var session2 = context && context.state && context.state.session || {};
    var accessToken = text(session2.accessToken || session2.access_token);
    if (!accessToken) throw coded3("session-expired", "A Core access token is required");
    var organization = text(config.organization);
    var organizationId = positiveInteger(session2.organizationId);
    if (!organization || !organizationId) throw coded3("organization-required", "The portal organization and its id are required");
    var origin = config.origin || globalThis.location && globalThis.location.origin || "";
    var cmsBase = sameOriginBase3(config.cmsApiBase || "/core-cms", origin, "Core CMS API base");
    var authorization = text(session2.tokenType || session2.token_type || "Bearer") + " " + accessToken;
    return {
      origin: new URL(origin).origin,
      cmsBase,
      cmsPath: new URL(cmsBase).pathname.replace(/\/+$/, ""),
      coreBase: sameOriginBase3(config.coreApiBase || "/core", origin, "Core API base"),
      organizationId,
      headers: function(extra) {
        return Object.assign({ Authorization: authorization, Accept: "application/json", "X-Organization-Code": organization }, extra);
      }
    };
  }
  async function requestJson3(fetchImpl, url, options2, failureCode) {
    var response = await fetchImpl(url, options2);
    if (!response || typeof response.ok !== "boolean") throw coded3(failureCode, "Core request returned an invalid response");
    if (!response.ok) {
      var failure2 = coded3(response.status === 401 ? "session-expired" : failureCode, "Core request failed with HTTP " + response.status);
      failure2.status = response.status;
      throw failure2;
    }
    try {
      return await response.json();
    } catch (_) {
      throw coded3(failureCode, "Core response was not valid JSON");
    }
  }
  function sameOriginBase3(value, origin, label) {
    if (!origin) throw coded3("origin-required", label + " requires a browser origin");
    var target = new URL(String(value || ""), origin);
    if (target.origin !== new URL(origin).origin) throw coded3("cross-origin-service", label + " must be same-origin");
    return target.href.replace(/\/+$/, "");
  }
  function coded3(code, message) {
    var error2 = new Error(message);
    error2.code = code;
    return error2;
  }

  // app-templates/customer-portal/runtime/src/profile-edit.js
  var NAME_LIMIT = 32;
  var EMAIL_LIMIT = 254;
  var ADDRESS_LIMIT = 255;
  var EMAIL_SHAPE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
  var PHONE_CHARACTERS = /^\+?[0-9 ().-]+$/;
  var CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;
  var field = (code, key, label, type, autocomplete, placeholder) => /* @__PURE__ */ Object.freeze({ code, key, label, type, autocomplete, placeholder });
  var PROFILE_EDIT_ROWS = /* @__PURE__ */ Object.freeze({
    contact: /* @__PURE__ */ Object.freeze({ label: "Name", form: PROFILE_FORM, fields: /* @__PURE__ */ Object.freeze([field("FIRST_NAME", "firstName", "First name", "text", "given-name"), field("LAST_NAME", "lastName", "Last name", "text", "family-name")]) }),
    email: /* @__PURE__ */ Object.freeze({ label: "Email", form: PROFILE_FORM, fields: /* @__PURE__ */ Object.freeze([field("EMAIL", "email", "Email", "email", "email")]) }),
    phone: /* @__PURE__ */ Object.freeze({ label: "Phone", form: PROFILE_FORM, fields: /* @__PURE__ */ Object.freeze([field("PHONE", "phone", "Phone", "tel", "tel")]) }),
    billing: /* @__PURE__ */ Object.freeze({ label: "Billing address", form: PROFILE_FORM, fields: /* @__PURE__ */ Object.freeze([field("BILLING_ADDRESS", "billingAddress", "Billing address", "text", "street-address")]) }),
    login: /* @__PURE__ */ Object.freeze({ label: "Account name", form: LOGIN_FORM, fields: /* @__PURE__ */ Object.freeze([field("LOGIN", "login", "Account name", "email", "username", "name@example.com")]) })
  });
  var SESSION_ENDED = "Your session ended while the sign-in was changing. Sign in again: with {next} if the change went through, otherwise with {current}.";
  var UNCONFIRMED = "We couldn't confirm the change yet. Reload the page in a minute to see the details on file.";
  var NOT_SENT = "Your change wasn't sent. Check your connection and try again.";
  var FAILED = "We couldn't save your change right now. Please try again in a few minutes.";
  function profileEditing(config) {
    return !!config && config.vertical === "snow" && config.dataMode === "live" && customerAccountProfile(config);
  }
  function profileEditBusy() {
    return !!(state.profileEdit && state.profileEdit.phase === "saving");
  }
  function currentSignIn() {
    return state.profileLoginChanged || state.session && state.session.login || "";
  }
  function startProfileEdit(row) {
    var definition = PROFILE_EDIT_ROWS[row];
    if (!definition || profileEditBusy()) return false;
    var initial = initialValues(row);
    state.profileSaved = null;
    state.profileEdit = { row, initial, draft: Object.assign({}, initial), errors: {}, phase: "editing", message: null };
    return true;
  }
  function changeProfileDraft(key, value) {
    var edit = state.profileEdit;
    if (!edit || edit.phase === "saving") return false;
    edit.draft[key] = String(value == null ? "" : value);
    return true;
  }
  function cancelProfileEdit() {
    if (!state.profileEdit || profileEditBusy()) return false;
    state.profileEdit = null;
    return true;
  }
  function profileEditRequest(row, initial, draft) {
    var definition = PROFILE_EDIT_ROWS[row];
    var errors = {};
    var values = {};
    var fields = [];
    definition.fields.forEach(function(item) {
      var raw = String(draft[item.key] == null ? "" : draft[item.key]);
      var before = String(initial[item.key] == null ? "" : initial[item.key]);
      var unchanged = item.code === "LOGIN" ? comparable2(raw).toLowerCase() === comparable2(before).toLowerCase() : comparable2(raw) === comparable2(before);
      if (unchanged && item.code !== "LOGIN") return;
      var checked = validateProfileValue(item.code, raw, before);
      if (checked.error) errors[item.code] = checked.error;
      else {
        values[item.code] = checked.value;
        fields.push(item.code);
      }
    });
    if ((/* @__PURE__ */ Object.keys(errors)).length) return { errors, values: null };
    if (!fields.length) return { errors: {}, values: null };
    if (definition.form === LOGIN_FORM) return { errors: {}, values: { LOGIN: values.LOGIN } };
    return { errors: {}, values: Object.assign({ FIELDS: fields }, values) };
  }
  function validateProfileValue(code, raw, current) {
    var collapsed = comparable2(raw);
    if (code === "FIRST_NAME" || code === "LAST_NAME") {
      if (!collapsed) return refusal(code === "FIRST_NAME" ? "Enter your first name." : "Enter your last name.");
      if (CONTROL_CHARACTERS.test(collapsed)) return refusal("Use letters, spaces and punctuation only.");
      if (collapsed.length > NAME_LIMIT) return refusal("Use " + NAME_LIMIT + " characters or fewer.");
      return accepted(collapsed);
    }
    if (code === "EMAIL" || code === "LOGIN") {
      var email = String(raw == null ? "" : raw).trim().toLowerCase();
      if (!email) return refusal(code === "EMAIL" ? "Enter your email address." : "Enter the email you want to sign in with.");
      if (email.length > EMAIL_LIMIT || !EMAIL_SHAPE.test(email)) return refusal("Enter a valid email address, like name@example.com.");
      if (code === "LOGIN" && email === comparable2(current).toLowerCase()) return refusal("This is already the email you sign in with.");
      return accepted(email);
    }
    if (code === "PHONE") {
      if (!collapsed) return refusal("Enter your phone number.");
      var digits = collapsed.replace(/\D/g, "");
      if (!PHONE_CHARACTERS.test(collapsed) || digits.length < 7 || digits.length > 15) return refusal("Enter a valid phone number with its area code.");
      return accepted(collapsed);
    }
    if (code === "BILLING_ADDRESS") {
      if (!collapsed) return refusal("Enter your billing address.");
      if (collapsed.length > ADDRESS_LIMIT) return refusal("Use " + ADDRESS_LIMIT + " characters or fewer.");
      if (CONTROL_CHARACTERS.test(collapsed) || !/[0-9]/.test(collapsed) || !/\p{L}/u.test(collapsed)) return refusal("Enter the full street address, including the building number.");
      return accepted(collapsed);
    }
    return refusal("This detail can't be changed here.");
  }
  function saveProfileEdit(options2) {
    var edit = state.profileEdit;
    if (!edit || edit.phase === "saving") return Promise.resolve(false);
    var changed = options2.onChange;
    var definition = PROFILE_EDIT_ROWS[edit.row];
    var request = profileEditRequest(edit.row, edit.initial, edit.draft);
    if ((/* @__PURE__ */ Object.keys(request.errors)).length) {
      edit.errors = request.errors;
      edit.message = null;
      edit.phase = "editing";
      changed("invalid");
      return Promise.resolve(false);
    }
    if (!request.values) {
      state.profileEdit = null;
      changed("closed");
      return Promise.resolve(true);
    }
    var forms = options2.forms || createCoreProfileFormAdapter();
    var context = { config: state.config, state };
    edit.phase = "saving";
    edit.errors = {};
    edit.message = null;
    changed("saving");
    return Promise.resolve().then(function() {
      return forms.submit(definition.form, request.values, context);
    }).then(function(formId) {
      return forms.outcome(definition.form, formId, context);
    }).then(function(result) {
      return settle(edit, definition, request.values, result, options2.reload, changed);
    }, function(error2) {
      return fail(edit, request.values, error2, changed);
    });
  }
  function settle(edit, definition, values, result, reloadProfile, changed) {
    if (state.profileEdit !== edit) return false;
    if (result.outcome === "APPLIED") {
      if (definition.form === LOGIN_FORM) {
        state.profileLoginChanged = values.LOGIN;
        state.session.login = values.LOGIN;
        state.profileEdit = null;
        changed("applied");
        return true;
      }
      return Promise.resolve().then(function() {
        return reloadProfile("profile");
      }).then(function() {
        return true;
      }, function() {
        return true;
      }).then(function(done) {
        if (state.profileEdit === edit) state.profileEdit = null;
        state.profileSaved = edit.row;
        changed("applied");
        return done;
      });
    }
    edit.phase = result.outcome === "REFUSED" ? "refused" : "failed";
    var codes = definition.fields.map(function(item) {
      return item.code;
    });
    if (result.outcome === "REFUSED" && result.field && codes.indexOf(result.field) !== -1) edit.errors = { [result.field]: result.message };
    else edit.message = result.message || FAILED;
    changed(edit.phase);
    return false;
  }
  function fail(edit, values, error2, changed) {
    if (state.profileEdit !== edit) return false;
    var code = error2 && error2.code;
    if (code === "session-expired" && edit.row === "login") {
      edit.phase = "session-ended";
      edit.message = SESSION_ENDED.replace("{next}", values.LOGIN).replace("{current}", edit.initial.login || "your current email");
    } else if (code === "session-expired") {
      state.profileEdit = null;
      state.account = "session-expired";
    } else {
      edit.phase = "failed";
      edit.message = code === "outcome-unknown" ? UNCONFIRMED : NOT_SENT;
    }
    changed(edit.phase || "closed");
    return false;
  }
  function initialValues(row) {
    if (row === "login") return { login: currentSignIn() };
    var envelope2 = state.moduleData.profile || {};
    var editable = envelope2.editable || {};
    var values = {};
    PROFILE_EDIT_ROWS[row].fields.forEach(function(item) {
      values[item.key] = editable[item.key] || "";
    });
    return values;
  }
  function focusProfileInput(invalidFirst) {
    var root = globalThis.document;
    if (!root || typeof root.querySelector !== "function") return;
    var input = invalidFirst && root.querySelector('[data-profile-input][aria-invalid="true"]') || root.querySelector("[data-profile-input]");
    if (input && typeof input.focus === "function") input.focus();
  }
  function comparable2(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }
  function refusal(message) {
    return { error: message, value: null };
  }
  function accepted(value) {
    return { error: null, value };
  }

  // app-templates/customer-portal/runtime/src/normalizers/invoices.js
  var INVOICE_STATUS = /* @__PURE__ */ Object.freeze({
    OVERDUE: /* @__PURE__ */ Object.freeze({ label: "Overdue", tone: "danger", open: true }),
    SENT: /* @__PURE__ */ Object.freeze({ label: "Due", tone: "info", open: true }),
    PAID: /* @__PURE__ */ Object.freeze({ label: "Paid", tone: "ok", open: false }),
    VOID: /* @__PURE__ */ Object.freeze({ label: "Void", tone: "scheduled", open: false })
  });
  function normalizeInvoices(raw) {
    var rows2 = Array.isArray(raw && raw.items) ? raw.items : [];
    return {
      state: "ready",
      truncated: !!(raw && raw.truncated),
      items: rows2.map(invoiceRecord).filter(Boolean)
    };
  }
  function openInvoices(envelope2) {
    return (envelope2 && envelope2.items || []).filter(function(invoice) {
      return invoice.open;
    }).sort(function(left, right) {
      var overdue = Number(right.stateCode === "OVERDUE") - Number(left.stateCode === "OVERDUE");
      return overdue || (left.due || "9999-99-99").localeCompare(right.due || "9999-99-99") || left.backendId - right.backendId;
    });
  }
  function findInvoice(envelope2, id) {
    return (envelope2 && envelope2.items || []).find(function(invoice) {
      return invoice.id === id;
    }) || null;
  }
  function invoiceTitle(invoice) {
    return invoice.period || formatIsoDate(invoice.issued) || "Invoice";
  }
  function invoiceStatusLine(invoice) {
    if (invoice.stateCode === "SENT" && invoice.due) return "Due on " + formatIsoDate(invoice.due);
    return invoice.status.label;
  }
  function invoiceAmount(invoice) {
    return formatMoney(invoice.total, invoice.currency);
  }
  function invoiceTerms(invoice) {
    return invoice.netDays ? "Net " + invoice.netDays : "";
  }
  function invoiceRecord(row) {
    var backendId = positiveInteger(row && row.id);
    var stateCode = latestStateCode(row);
    var status = Object.prototype.hasOwnProperty.call(INVOICE_STATUS, stateCode) ? INVOICE_STATUS[stateCode] : null;
    if (!backendId || !status) return null;
    var currency = text(row.order && row.order.currency && row.order.currency.code);
    return {
      id: "invoice-core-" + backendId,
      backendId,
      stateCode,
      status: { label: status.label, tone: status.tone },
      open: status.open,
      period: attributeText(row, "SERVICE_PERIOD"),
      issued: isoDate2(attributeText(row, "DATE")),
      due: isoDate2(row.dueDate),
      netDays: attributeNumber(row, "PAYMENT_NET_TERMS"),
      currency,
      total: finiteNumber4(row.amountDue),
      paid: finiteNumber4(row.totalPaidAmount),
      lines: (Array.isArray(row.items) ? row.items : []).map(function(item) {
        return lineRecord(item, currency);
      }).filter(Boolean)
    };
  }
  function lineRecord(item, currency) {
    var amount = finiteNumber4(item && item.amount);
    if (amount === null) return null;
    var count = finiteNumber4(item.itemCount);
    var quantity = count !== null && count > 0 ? count : 1;
    var product = item.itemPrice && item.itemPrice.product;
    return {
      id: positiveInteger(item.id),
      name: localizedName3(product && product.nls) || "Service",
      quantity,
      amount: formatMoney(amount * quantity, currency)
    };
  }
  function isoDate2(value) {
    var parts = Array.isArray(value) ? value : /^(\d{4})-(\d{2})-(\d{2})$/.exec(text(value));
    if (!parts) return "";
    var numbers = Array.isArray(value) ? parts.slice(0, 3).map(Number) : parts.slice(1, 4).map(Number);
    var date = new Date(Date.UTC(numbers[0], numbers[1] - 1, numbers[2]));
    if (date.getUTCFullYear() !== numbers[0] || date.getUTCMonth() !== numbers[1] - 1 || date.getUTCDate() !== numbers[2]) return "";
    return numbers[0] + "-" + String(numbers[1]).padStart(2, "0") + "-" + String(numbers[2]).padStart(2, "0");
  }
  function finiteNumber4(value) {
    var number = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : Number.NaN;
    return Number.isFinite(number) ? number : null;
  }
  function localizedName3(value) {
    if (!value || typeof value !== "object") return "";
    var localized = value.en || value["en-US"] || Object.values(value)[0] || {};
    return text(localized && (localized.NAME || localized.name));
  }

  // app-templates/customer-portal/runtime/src/adapters/core-user-preference-adapter.js
  function createCoreUserPreferenceAdapter(options2 = {}) {
    var fetchImpl = options2.fetch || globalThis.fetch;
    return {
      async overwrite(key, value, context) {
        var api = requestContext2(context);
        var response = await fetchImpl(api.coreBase + "/api/user/preference.json", {
          method: "PUT",
          credentials: "same-origin",
          headers: api.headers({ "Content-Type": "application/json" }),
          body: JSON.stringify({ key, value: JSON.stringify(value) })
        });
        return !!(response && response.ok);
      }
    };
  }

  // app-templates/customer-portal/runtime/src/adapters/stripe-js-adapter.js
  var STRIPE_JS_URL = "https://js.stripe.com/v3/";
  var LOAD_TIMEOUT_MS = 2e4;
  var loads = /* @__PURE__ */ new WeakMap();
  function loadStripeJs(options2 = {}) {
    var scope = options2.scope || globalThis;
    if (typeof scope.Stripe === "function") return Promise.resolve(scope.Stripe);
    if (loads.has(scope)) return loads.get(scope);
    var root = scope.document;
    if (!root || typeof root.createElement !== "function") return Promise.reject(coded4("stripe-unavailable", "Stripe.js needs a document"));
    var loading = new Promise(function(resolve, reject) {
      var script = root.createElement("script");
      var timer = setTimeout(function() {
        reject(coded4("stripe-unavailable", "Stripe.js did not load in time"));
      }, options2.timeoutMs || LOAD_TIMEOUT_MS);
      script.setAttribute("src", STRIPE_JS_URL);
      script.setAttribute("async", "");
      script.addEventListener("load", function() {
        clearTimeout(timer);
        if (typeof scope.Stripe === "function") resolve(scope.Stripe);
        else reject(coded4("stripe-unavailable", "Stripe.js loaded without Stripe"));
      });
      script.addEventListener("error", function() {
        clearTimeout(timer);
        reject(coded4("stripe-unavailable", "Stripe.js could not be loaded"));
      });
      (root.head || root.body).appendChild(script);
    });
    loads.set(scope, loading);
    loading.catch(function() {
      loads.delete(scope);
    });
    return loading;
  }
  function coded4(code, message) {
    var error2 = new Error(message);
    error2.code = code;
    return error2;
  }

  // app-templates/customer-portal/runtime/src/invoice-payment.js
  var PAYABLE_STATES = /* @__PURE__ */ Object.freeze(["SENT", "OVERDUE"]);
  var PAYMENT_OUTCOMES = /* @__PURE__ */ Object.freeze(["READY", "PROCESSING", "REFUSED", "FAILED"]);
  var TEST_CARD = "4242 4242 4242 4242";
  var OUTCOME_TIMEOUT_MS2 = 6e4;
  var RECORDING_TIMEOUT_MS = 6e4;
  var RECORDING_POLL_MS = 2e3;
  var BUSY_PHASES = /* @__PURE__ */ Object.freeze(["starting", "confirming"]);
  var CLOSABLE_PHASES = /* @__PURE__ */ Object.freeze(["card", "recording", "paid", "slow", "refused", "failed"]);
  var PAYMENT_COPY = /* @__PURE__ */ Object.freeze({
    title: "Pay invoice",
    starting: "Preparing a secure card payment\u2026",
    cardLabel: "Card details",
    note: "Payments are processed by Stripe. We never see or store your card number.",
    testMode: "Test mode",
    testHint: "No real charge. Use the test card " + TEST_CARD + " with any future date and any CVC.",
    confirming: "Confirming your payment\u2026",
    recording: "Payment received. Updating your invoice\u2026",
    paidTitle: "Paid",
    paidBody: "Thank you. This invoice is now paid.",
    slowTitle: "Payment received",
    slowBody: "Your payment went through, but the invoice hasn't updated yet. It will show as paid within a few minutes; you don't need to pay again.",
    notSent: "We couldn't start the payment. Nothing was charged. Check your connection and try again.",
    unconfirmed: "We couldn't confirm that the payment was set up. Nothing was charged. Reload the page in a minute and try again.",
    stripeUnavailable: "The secure card form couldn't load. Nothing was charged. Check your connection and try again.",
    cardFailed: "Your card wasn't charged. Check the details and try again.",
    close: "Close",
    cancel: "Cancel",
    done: "Done",
    retry: "Try again",
    processing: "Processing\u2026"
  });
  var session = null;
  function invoicePaymentOpen(config) {
    return !!config && config.vertical === "snow" && config.dataMode === "live";
  }
  function invoicePayable(invoice) {
    return !!invoice && PAYABLE_STATES.indexOf(invoice.stateCode) !== -1 && typeof invoice.total === "number" && invoice.total > 0 && !(invoice.paid > 0) && /^[A-Z]{3}$/.test(String(invoice.currency || ""));
  }
  function invoicePaymentFor(invoiceId) {
    var payment = state.invoicePayment;
    return payment && payment.invoiceId === invoiceId ? payment : null;
  }
  function invoicePaymentBusy() {
    return !!(state.invoicePayment && (BUSY_PHASES.indexOf(state.invoicePayment.phase) !== -1 || state.invoicePayment.phase === "card" || state.invoicePayment.phase === "recording"));
  }
  function payInvoice(invoiceId, options2) {
    var settings = options2 || {};
    var invoice = findInvoice(liveInvoices(), invoiceId);
    if (!invoicePaymentOpen(state.config) || !invoicePayable(invoice) || invoicePaymentBusy()) return Promise.resolve(false);
    closeSheet();
    var amountLabel = formatMoney(invoice.total, invoice.currency);
    var payment = { invoiceId: invoice.id, backendId: invoice.backendId, title: invoiceTitle(invoice), amountLabel, phase: "starting", message: "", testMode: false };
    state.invoicePayment = payment;
    session = {
      payment,
      forms: settings.forms || createCoreProfileFormAdapter({ timeoutMs: OUTCOME_TIMEOUT_MS2 }),
      preferences: settings.preferences || createCoreUserPreferenceAdapter(),
      loadStripe: settings.loadStripe || loadStripeJs,
      reload: settings.reload,
      render: settings.render || function() {
      },
      wait: settings.wait || function(ms) {
        return new Promise(function(resolve) {
          setTimeout(resolve, ms);
        });
      },
      now: settings.now || function() {
        return Date.now();
      },
      document: settings.document || globalThis.document,
      stripe: null,
      card: null,
      secret: "",
      sheet: null
    };
    var current = session;
    openSheet(current);
    update(current, "starting", "");
    var context = { config: state.config, state };
    return Promise.resolve().then(function() {
      return current.forms.submit(INVOICE_PAYMENT_FORM, { INVOICE_ID: payment.backendId }, context);
    }).then(function(formId) {
      return current.forms.report(INVOICE_PAYMENT_FORM, formId, context, PAYMENT_OUTCOMES);
    }).then(function(report) {
      return started(current, report, context);
    }, function(error2) {
      if (session !== current) return false;
      if (error2 && error2.code === "session-expired") {
        closeSheet();
        state.invoicePayment = null;
        state.account = "session-expired";
        current.render();
        return false;
      }
      update(current, "failed", error2 && error2.code === "outcome-unknown" ? PAYMENT_COPY.unconfirmed : PAYMENT_COPY.notSent);
      return false;
    });
  }
  function started(current, report, context) {
    if (session !== current) return false;
    if (report.outcome === "PROCESSING") return recording(current);
    if (report.outcome !== "READY") {
      update(current, report.outcome === "REFUSED" ? "refused" : "failed", String(report.message || PAYMENT_COPY.notSent));
      return false;
    }
    var secret = String(report.clientSecret || "");
    var key = String(report.publishableKey || "");
    if (!/^pi_[A-Za-z0-9]+_secret_[A-Za-z0-9]+$/.test(secret) || !/^pk_(test|live)_[A-Za-z0-9]+$/.test(key) || Number(report.invoiceId) !== current.payment.backendId) {
      update(current, "failed", PAYMENT_COPY.unconfirmed);
      return false;
    }
    current.secret = secret;
    current.payment.testMode = key.indexOf("pk_test_") === 0;
    Promise.resolve().then(function() {
      return current.preferences.overwrite(INVOICE_PAYMENT_FORM.preference, Object.assign({}, report, { clientSecret: null, publishableKey: null }), context);
    }).catch(function() {
      return false;
    });
    return Promise.resolve(current.loadStripe()).then(function(Stripe) {
      if (session !== current) return false;
      current.stripe = Stripe(key);
      current.card = current.stripe.elements().create("card", { style: cardStyle(current.document) });
      current.card.mount(current.sheet.cardHost);
      current.card.on("change", function(event) {
        if (session !== current || current.payment.phase !== "card") return;
        current.sheet.error.textContent = event && event.error && event.error.message ? String(event.error.message) : "";
      });
      update(current, "card", "");
      return true;
    }, function() {
      if (session === current) update(current, "failed", PAYMENT_COPY.stripeUnavailable);
      return false;
    });
  }
  function confirmInvoicePayment() {
    var current = session;
    if (!current || current.payment.phase !== "card" || !current.stripe || !current.card) return Promise.resolve(false);
    update(current, "confirming", "");
    return Promise.resolve().then(function() {
      return current.stripe.confirmCardPayment(current.secret, { payment_method: { card: current.card } });
    }).then(function(result) {
      if (session !== current) return false;
      var outcome = result || {};
      var intent = outcome.paymentIntent || outcome.error && outcome.error.payment_intent;
      if (intent && (intent.status === "succeeded" || intent.status === "processing")) return recording(current);
      update(current, "card", String(outcome.error && outcome.error.message || PAYMENT_COPY.cardFailed));
      return false;
    }, function() {
      if (session === current) update(current, "card", PAYMENT_COPY.cardFailed);
      return false;
    });
  }
  function recording(current) {
    releaseCard(current);
    update(current, "recording", "");
    var deadline = current.now() + RECORDING_TIMEOUT_MS;
    function poll() {
      if (session !== current && state.invoicePayment !== current.payment) return Promise.resolve(false);
      return Promise.resolve(current.reload ? current.reload("invoices") : null).catch(function() {
        return null;
      }).then(function() {
        var invoice = findInvoice(liveInvoices(), current.payment.invoiceId);
        if (invoice && invoice.stateCode === "PAID") {
          update(current, "paid", "");
          return true;
        }
        if (current.now() >= deadline) {
          update(current, "slow", "");
          return false;
        }
        return current.wait(RECORDING_POLL_MS).then(poll);
      });
    }
    return poll();
  }
  function closeInvoicePayment() {
    var current = session;
    var payment = state.invoicePayment;
    if (!payment || CLOSABLE_PHASES.indexOf(payment.phase) === -1) return false;
    if (current) releaseCard(current);
    closeSheet();
    if (payment.phase !== "recording") state.invoicePayment = null;
    if (current) current.render();
    return true;
  }
  function retryInvoicePayment() {
    var payment = state.invoicePayment;
    if (!payment || payment.phase !== "failed" || !session) return Promise.resolve(false);
    var options2 = { forms: session.forms, preferences: session.preferences, loadStripe: session.loadStripe, reload: session.reload, render: session.render, wait: session.wait, now: session.now, document: session.document };
    var invoiceId = payment.invoiceId;
    closeSheet();
    state.invoicePayment = null;
    return payInvoice(invoiceId, options2);
  }
  function update(current, phase, message) {
    current.payment.phase = phase;
    current.payment.message = message;
    if (current.sheet) paint(current);
    current.render();
  }
  function releaseCard(current) {
    if (current.card && typeof current.card.destroy === "function") current.card.destroy();
    current.card = null;
  }
  function closeSheet() {
    if (session && session.sheet) {
      session.sheet.scrim.remove();
      session.sheet.panel.remove();
      session.sheet = null;
    }
  }
  function openSheet(current) {
    var root = current.document;
    var title = h("h2", { "class": "drawer__title pay-sheet__title", id: "pay-sheet-title", tabindex: "-1" }, PAYMENT_COPY.title);
    var closeButton = h("button", { "class": "drawer__close", type: "button", "aria-label": PAYMENT_COPY.close, "data-visual-id": "pay-sheet-close" }, "\u2715");
    var summary = h("div", { "class": "pay-sheet__summary", "data-module": "pay-summary" }, [
      h("span", { "class": "pay-sheet__invoice" }, current.payment.title),
      h("b", { "class": "pay-sheet__amount" }, current.payment.amountLabel)
    ]);
    var status = h("div", { "class": "pay-sheet__status", role: "status", "aria-live": "polite", "data-module": "pay-status" });
    var testNote = h("div", { "class": "pay-sheet__test", "data-module": "pay-test-mode", hidden: true }, [
      h("span", { "class": "status-badge status-badge--warn" }, PAYMENT_COPY.testMode),
      h("span", null, PAYMENT_COPY.testHint)
    ]);
    var cardLabel = h("div", { "class": "field-label", id: "pay-sheet-card-label" }, PAYMENT_COPY.cardLabel);
    var cardHost = h("div", { "class": "field pay-sheet__card", role: "group", "aria-labelledby": "pay-sheet-card-label", "data-module": "pay-card" });
    var error2 = h("div", { "class": "field-error pay-sheet__error", role: "alert", "data-module": "pay-error" });
    var cardField = h("div", { "class": "field-row pay-sheet__field", "data-module": "pay-card-field", hidden: true }, [cardLabel, cardHost, error2]);
    var note = h("p", { "class": "pay-sheet__note", hidden: true }, PAYMENT_COPY.note);
    var result = h("div", { "class": "pay-sheet__result", "data-module": "pay-result", hidden: true });
    var primary = h("button", { "class": "btn btn--primary btn--block btn--lg", type: "button", "data-visual-id": "pay-sheet-confirm" });
    var secondary = h("button", { "class": "btn btn--ghost btn--block", type: "button", "data-visual-id": "pay-sheet-secondary" });
    var actions = h("div", { "class": "pay-sheet__actions" }, [primary, secondary]);
    var panel = h("aside", { "class": "drawer pay-sheet", role: "dialog", "aria-modal": "true", "aria-labelledby": "pay-sheet-title", "data-module": "invoice-pay-sheet", "data-visual-id": "invoice-pay-sheet" }, [
      h("div", { "class": "drawer__head" }, [title, closeButton]),
      summary,
      testNote,
      status,
      cardField,
      note,
      result,
      actions
    ]);
    var scrim = h("div", { "class": "scrim pay-sheet__scrim", "data-visual-id": "invoice-pay-scrim" });
    closeButton.addEventListener("click", closeInvoicePayment);
    scrim.addEventListener("click", closeInvoicePayment);
    panel.addEventListener("keydown", function(event) {
      if (event.key === "Escape") closeInvoicePayment();
    });
    primary.addEventListener("click", function() {
      var phase = current.payment.phase;
      if (phase === "card") confirmInvoicePayment();
      else if (phase === "failed") retryInvoicePayment();
      else closeInvoicePayment();
    });
    secondary.addEventListener("click", closeInvoicePayment);
    var host = root.body || root;
    host.appendChild(scrim);
    host.appendChild(panel);
    current.sheet = { scrim, panel, title, closeButton, status, testNote, cardField, cardHost, error: error2, note, result, primary, secondary };
    paint(current);
    if (typeof title.focus === "function") title.focus();
  }
  function paint(current) {
    var sheet = current.sheet;
    var payment = current.payment;
    var phase = payment.phase;
    var cardShown = phase === "card" || phase === "confirming";
    sheet.panel.setAttribute("data-state", phase);
    sheet.panel.setAttribute("aria-busy", BUSY_PHASES.indexOf(phase) !== -1 ? "true" : "false");
    toggle(sheet.testNote, payment.testMode && cardShown);
    toggle(sheet.cardField, cardShown);
    toggle(sheet.note, cardShown);
    sheet.error.textContent = phase === "card" ? payment.message : "";
    var progress2 = phase === "starting" ? PAYMENT_COPY.starting : phase === "confirming" ? PAYMENT_COPY.confirming : phase === "recording" ? PAYMENT_COPY.recording : "";
    sheet.status.replaceChildren.apply(sheet.status, progress2 ? [h("span", { "class": "pay-sheet__spinner", "aria-hidden": "true" }), h("span", null, progress2)] : []);
    var outcome = phase === "paid" ? [PAYMENT_COPY.paidTitle, PAYMENT_COPY.paidBody, "ok"] : phase === "slow" ? [PAYMENT_COPY.slowTitle, PAYMENT_COPY.slowBody, "info"] : phase === "refused" || phase === "failed" ? ["", payment.message, "danger"] : null;
    toggle(sheet.result, !!outcome);
    sheet.result.setAttribute("data-state", outcome ? outcome[2] : "");
    sheet.result.replaceChildren.apply(sheet.result, outcome ? [
      outcome[0] ? h("div", { "class": "pay-sheet__result-title" }, outcome[0]) : null,
      h("div", { "class": "pay-sheet__result-body" }, outcome[1])
    ].filter(Boolean) : []);
    var primaryLabel = phase === "card" ? "Pay " + payment.amountLabel : phase === "confirming" ? PAYMENT_COPY.processing : phase === "failed" ? PAYMENT_COPY.retry : phase === "paid" ? PAYMENT_COPY.done : phase === "slow" || phase === "refused" ? PAYMENT_COPY.close : "";
    sheet.primary.textContent = primaryLabel;
    toggle(sheet.primary, !!primaryLabel);
    setDisabled(sheet.primary, phase === "confirming");
    var secondaryLabel = phase === "card" ? PAYMENT_COPY.cancel : phase === "failed" ? PAYMENT_COPY.close : "";
    sheet.secondary.textContent = secondaryLabel;
    toggle(sheet.secondary, !!secondaryLabel);
    setDisabled(sheet.closeButton, CLOSABLE_PHASES.indexOf(phase) === -1);
  }
  function toggle(node, shown) {
    if (shown) node.removeAttribute("hidden");
    else node.setAttribute("hidden", "");
  }
  function setDisabled(node, disabled) {
    if (disabled) node.setAttribute("disabled", "");
    else node.removeAttribute("disabled");
  }
  function cardStyle(root) {
    var view = root && root.defaultView || globalThis;
    var styles = view && typeof view.getComputedStyle === "function" && root.documentElement ? view.getComputedStyle(root.documentElement) : null;
    var token = function(name, fallback) {
      return styles && styles.getPropertyValue(name).trim() || fallback;
    };
    return {
      base: {
        color: token("--ink", "#1d1d1f"),
        iconColor: token("--accent", "#0a84ff"),
        fontFamily: "Manrope, system-ui, -apple-system, sans-serif",
        fontSize: "16px",
        "::placeholder": { color: token("--ink-3", "#9aa0ad") }
      },
      invalid: { color: token("--danger", "#c0392b"), iconColor: token("--danger", "#c0392b") }
    };
  }

  // app-templates/customer-portal/runtime/src/components/primitives/ErrorState.js
  function ErrorState(props) {
    return h("div", { "class": "state-block", "data-module": "error-state", "data-visual-id": "error-state", "data-state": "error" }, [
      h("div", { "class": "state-block__glyph state-block__glyph--error" }, "\u26A0"),
      h("div", { "class": "state-block__title" }, props.title || "Something went wrong"),
      h("div", { "class": "state-block__desc" }, props.desc || "We couldn\u2019t load your orders. Check your connection and try again."),
      ActionButton({ variant: "btn--primary", label: "Try again", action: "ui.retry", visualId: "retry" })
    ]);
  }

  // app-templates/customer-portal/runtime/src/components/storm/overview-icons.js
  var ICONS = {
    map: "M4 7.5 9.5 5l5 2.5L20 5v11.5L14.5 19l-5-2.5L4 19V7.5Z M9.5 5v11.5 M14.5 7.5V19",
    calendar: "M4.5 7.5h15v12a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5v-12Z M4.5 7.5V6A1.5 1.5 0 0 1 6 4.5h12A1.5 1.5 0 0 1 19.5 6v1.5 M8.5 3v3 M15.5 3v3 M8 12h3 M8 16h8",
    invoice: "M6 3.5h12v17l-3-2-3 2-3-2-3 2v-17Z M9.5 8.5h5 M9.5 12.5h5 M9.5 16h3",
    contract: "M12 3.2 19.5 6v6c0 4.2-3 7.6-7.5 8.8C7.5 19.6 4.5 16.2 4.5 12V6L12 3.2Z M9 12.2l2.2 2.2 4-4.2",
    support: "M4.5 6.5A2 2 0 0 1 6.5 4.5h11a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H10l-4 3.5v-3.5H6.5a2 2 0 0 1-2-2v-7Z M9 9.5h6 M9 12.5h4",
    alert: "M12 4.2 21 19.5H3L12 4.2Z M12 10v4.4 M12 16.6v.6",
    pin: "M12 21s-6.5-5.8-6.5-10.5a6.5 6.5 0 1 1 13 0C18.5 15.2 12 21 12 21Z M12 12.8a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6Z",
    snowflake: "M12 3v18 M4.2 7.5l15.6 9 M19.8 7.5l-15.6 9 M12 7l-2.6-2.2 M12 7l2.6-2.2 M12 17l-2.6 2.2 M12 17l2.6 2.2",
    signOut: "M10 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H10 M14.5 8l4 4-4 4 M18.5 12H9.5"
  };
  function icon(name, className) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    if (className) svg.setAttribute("class", className);
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", ICONS[name] || "");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1.6");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.appendChild(path);
    return svg;
  }

  // app-templates/customer-portal/runtime/src/components/shell/TopNav.js
  function TopNav(gated) {
    if (false) return SpaTopNav(gated);
    var profile = activeProfile();
    if (gated) {
      return h("div", { "class": "top-nav-wrap" }, h("nav", { "class": "top-nav", "data-module": "top-nav", "data-visual-id": "top-nav", "data-state": "gated" }, [
        h("div", { "class": "top-nav__brand" }, [h("div", { "class": "brand-logo" }), h("span", { "class": "brand-name" }, state.config.brandName || "Aircove")]),
        h("div", { "class": "nav-links" }),
        h("div", { "class": "top-nav__actions" }, [h("div", { "class": "icon-btn", "data-action": "ui.toggleMode", title: "Toggle light/dark" }, state.mode === "Dark" ? "\u2600" : "\u263E")])
      ]));
    }
    var navItems = profile.nav.filter(isNavItemEnabled);
    var links = navItems.map(function(n) {
      var active = navActive(n);
      return h("span", {
        "class": "nav-link" + (active ? " nav-link--active" : ""),
        "data-action": "nav.go",
        "data-id": n.key,
        "data-state": active ? "active" : void 0
      }, navLabel(n));
    });
    var actions = [
      h("div", { "class": "icon-btn icon-btn--optional", "data-action": "ui.toggleMode", title: "Toggle light/dark" }, state.mode === "Dark" ? "\u2600" : "\u263E")
    ];
    if (primaryConnected(profile.primary)) actions.push(ActionButton({ variant: "btn--primary", label: state.config.primaryCtaLabel || profile.primary.label, action: profile.primary.action, visualId: "primary-cta" }));
    if (!profile.weatherCalendar && isModuleEnabled("calendar")) actions.push(h("div", { "class": "icon-btn icon-btn--optional", "data-action": "calendar.open", title: "Calendar" }, "\u{1F4C5}"));
    if (profile.showCart && isModuleEnabled("checkout")) actions.push(h("div", { "class": "icon-btn", "data-action": "cart.open", title: "Cart", "data-state": cartCount() ? "filled" : "empty" }, ["\u{1F6D2}", cartCount() ? h("span", { "class": "cart-badge", "data-bind": "cart.count" }, String(cartCount())) : null]));
    if (isModuleEnabled("activity")) {
      var unread = activityUnread();
      actions.push(h("div", {
        "class": "icon-btn icon-btn--optional",
        "data-module": "activity-control",
        "data-action": "activity.open",
        "data-state": unread ? "unread" : void 0,
        title: "Activity"
      }, ["\u{1F514}", unread ? h("span", { "class": "dot-badge" }) : null]));
    }
    var profileEnabled = isModuleEnabled("profile");
    var signInRequired = state.config.authMode === "required";
    if (profileEnabled) actions.push(h("div", { "class": "avatar", "data-module": "profile-avatar", "data-action": "profile.open", title: "Profile", "aria-label": "Profile" }, initials(avatarName())));
    else if (signInRequired) actions.push(h("button", { "class": "icon-btn icon-btn--optional", "data-module": "sign-out-control", "data-visual-id": "sign-out-control", "data-action": "auth.signOut", title: "Sign out", "aria-label": "Sign out", type: "button" }, [icon("signOut", "ov-icon")]));
    actions.push(h("div", { "class": "icon-btn hamburger", "data-action": "ui.toggleMobileNav", title: "Menu" }, "\u2630"));
    var landingOpen = !!configuredExternalUrl(state.config, "landingUrl");
    var nav = h("nav", { "class": "top-nav", "data-module": "top-nav", "data-visual-id": "top-nav" }, [
      h("div", { "class": "top-nav__brand", "data-action": landingOpen ? "nav.landing" : "nav.go", "data-id": landingOpen ? void 0 : state.config.defaultRoute }, [
        h("div", { "class": "brand-logo" }),
        h("span", { "class": "brand-name", "data-bind": "brand.name" }, state.config.brandName || "Aircove")
      ]),
      h("div", { "class": "nav-links" }, [h("div", { "class": "nav-pill", "data-nav-pill": "true" })].concat(links)),
      h("div", { "class": "top-nav__actions" }, actions)
    ]);
    if (state.mobileNav) {
      nav.appendChild(h(
        "div",
        { "class": "mobile-nav", "data-state": "mobile-navigation-open" },
        navItems.map(function(n) {
          var active = navActive(n);
          return h("span", { "class": "nav-link" + (active ? " nav-link--active" : ""), "data-action": "nav.go", "data-id": n.key }, navLabel(n));
        }).concat(profileEnabled || signInRequired ? [h("div", { "class": "mobile-nav__divider" })] : [], profileEnabled ? [
          h("span", { "class": "nav-link" + (state.route === "profile" ? " nav-link--active" : ""), "data-action": "profile.open" }, navLabel({ key: "profile", label: "Profile" }))
        ] : [], signInRequired ? [
          h("span", { "class": "nav-link", "data-module": "mobile-sign-out", "data-action": "auth.signOut" }, "Sign out")
        ] : [])
      ));
    }
    return h("div", { "class": "top-nav-wrap" }, nav);
  }
  function avatarName() {
    if (state.config.dataMode !== "live") {
      var customer = currentFixture().customer;
      return customer && customer.fullName || "";
    }
    var profile = state.moduleData.profile;
    return profile && (profile.contact && profile.contact.name || profile.accountName) || "";
  }
  function initials(name) {
    return String(name || "").split(/\s+/).filter(function(part) {
      return /^\p{L}/u.test(part);
    }).slice(0, 2).map(function(part) {
      return part.charAt(0).toUpperCase();
    }).join("");
  }
  function primaryConnected(primary) {
    if (!primary) return false;
    return primary.action !== "service.requestForm" || !!state.config.requestFormUrl;
  }
  var NAV_DETAIL_ROUTES = {
    "orders.list": ["order.detail"],
    products: ["checkout"],
    "proposals.list": ["proposal.detail", "agreement.detail"],
    appointments: ["visit.detail"],
    invoices: ["invoice.detail"]
  };
  function navActive(item) {
    return item.key === state.route || (NAV_DETAIL_ROUTES[item.key] || []).indexOf(state.route) !== -1;
  }
  function isNavItemEnabled(item) {
    var route = routeRegistry[item.key];
    return !!(route && (route.public || isModuleEnabled(route.module) && navListShown(route.module)));
  }
  function navLabel(item) {
    var configured = state.config.navigation || {};
    var key = {
      "orders.list": "primary",
      appointments: "appointments",
      invoices: "invoices",
      calendar: "calendar",
      activity: "activity",
      care: "care",
      "proposals.list": "proposals",
      services: "services",
      pricing: "pricing",
      products: "products",
      account: "account",
      support: "support"
    }[item.key];
    return configured[key] || (item.key === "care" ? activeVerticalConfig().careNavLabel : item.label);
  }

  // app-templates/customer-portal/runtime/src/components/primitives/Toggle.js
  function Toggle(on, id) {
    return h(
      "div",
      { "class": "toggle" + (on ? " toggle--on" : ""), "data-module": "toggle", "data-action": "profile.togglePref", "data-id": id, "data-state": on ? "on" : "off", role: "switch", "aria-checked": on ? "true" : "false" },
      h("div", { "class": "toggle__knob" })
    );
  }

  // app-templates/customer-portal/runtime/src/components/shell/PublicNav.js
  function PublicNav() {
    var landingOpen = isSpa() || !!configuredExternalUrl(state.config, "landingUrl");
    return h(
      "div",
      { "class": "top-nav-wrap" },
      h("nav", { "class": "top-nav", "data-module": "public-nav", "data-visual-id": "public-nav" }, [
        h("div", { "class": "top-nav__brand", "data-action": landingOpen ? "nav.landing" : void 0 }, [
          h("div", { "class": "brand-logo" }),
          h("span", { "class": "brand-name", "data-bind": "brand.name" }, state.config.brandName || "Aircove")
        ]),
        h("div", { "class": "top-nav__actions" }, [
          h("div", { "class": "icon-btn icon-btn--optional", "data-action": "ui.toggleMode", title: "Toggle light/dark" }, state.mode === "Dark" ? "\u2600" : "\u263E"),
          state.route === "landing" || state.route === "seo.landing" ? ActionButton({ variant: "btn--primary", label: "Sign in", action: "auth.gotoSignin", visualId: "public-signin" }) : landingOpen ? ActionButton({ variant: "btn--ghost", label: "\u2039 Home", action: "nav.landing", visualId: "public-home" }) : null
        ])
      ])
    );
  }

  // app-templates/customer-portal/runtime/src/components/shell/AppShell.js
  function AppShell(content) {
    var gated = customerPortalGateActive() || !isPublic() && state.account !== "ready";
    var capability = isSpa() ? spaCapability() : void 0;
    return h("div", {
      "class": "app-shell",
      "data-module": "app-shell",
      "data-visual-id": "app-shell",
      "data-account-state": gated || !isPublic() ? state.account : void 0,
      "data-capability": capability,
      "data-booking": capability === "target-appointments" ? state.spaBooking : void 0,
      "data-portal-profile": isSpa() ? activeProfile().id : void 0
    }, [
      gated ? TopNav(true) : isPublic() ? PublicNav() : TopNav(false),
      content,
      isSpa() && state.spaSupport ? h(
        "div",
        { "class": "spa-support-scrim" },
        h("div", { "class": "spa-support-card", "data-module": "support-unavailable", "data-visual-id": "support-unavailable", "data-state": "unavailable", role: "dialog", "aria-modal": "true", "aria-label": "Support unavailable" }, [
          h("div", { "class": "state-block__glyph" }, "\u2709"),
          h("div", { "class": "state-block__title" }, "Support isn\u2019t set up yet"),
          h("div", { "class": "state-block__desc" }, "A support contact hasn\u2019t been set up for this portal, so nothing was opened, sent or recorded. For now, please reach the studio the way you usually do."),
          h("button", { "class": "btn btn--primary", "data-action": "support.dismiss", "data-visual-id": "support-dismiss", style: "margin-top:14px" }, "Close")
        ])
      ) : null
    ]);
  }

  // app-templates/customer-portal/runtime/src/components/primitives/LoadingState.js
  function skeletonRow() {
    return h("div", { style: "display:flex;align-items:center;gap:13px;padding:14px 13px;border-top:1px solid var(--glass-border)" }, [
      h("div", { "class": "skeleton", style: "width:38px;height:38px;border-radius:11px" }),
      h("div", { style: "flex:1" }, [
        h("div", { "class": "skeleton", style: "width:46%;height:12px;margin-bottom:7px" }),
        h("div", { "class": "skeleton", style: "width:28%;height:10px" })
      ]),
      h("div", { "class": "skeleton", style: "width:74px;height:22px;border-radius:999px" })
    ]);
  }
  function detailSkeleton() {
    var col = h("div", { "class": "detail-col" });
    for (var i = 0; i < 3; i++) col.appendChild(h("div", { "class": "skeleton", style: "height:" + (i === 0 ? 180 : 120) + "px;border-radius:20px" }));
    return h("div", { "class": "detail-grid" }, [col, h("div", { "class": "detail-col" }, [h("div", { "class": "skeleton", style: "height:160px;border-radius:20px" })])]);
  }

  // app-templates/customer-portal/runtime/src/components/orders/TrackingCard.js
  function TrackingCard(technician, order) {
    var techData = technician || { name: "Your specialist", eta: "Arrival details are being prepared", role: "Service team" };
    var serviceName = order && order.name ? order.name : "your appointment";
    var map = h("div", { "class": "tracking-map" }, [
      h("span", { "class": "tracking-map__label" }, "live appointment status"),
      svgPath(),
      h("div", { "class": "tracking-pin-start" }),
      h("div", { "class": "tracking-pin-end" }, [
        h("div", { "class": "tracking-pin-end__ping" }),
        h("div", { "class": "tracking-pin-end__dot" })
      ])
    ]);
    var tech = h("div", { "class": "tracking-card__tech" }, [
      h("div", { "class": "tech-avatar" }),
      h("div", { style: "flex:1" }, [
        h("div", { style: "font-weight:600;font-size:14.5px", "data-bind": "visit.techName" }, techData.name + " is with you"),
        h("div", { style: "font-size:12.5px;color:var(--ink-2)", "data-bind": "visit.eta" }, techData.eta + " \xB7 " + serviceName)
      ]),
      ActionButton({ variant: "btn--ghost", label: "Message", action: "support.open", visualId: "tech-message" }),
      ActionButton({ variant: "btn--primary", label: "Call", action: "support.open", visualId: "tech-call" })
    ]);
    return h("div", { "class": "tracking-card", "data-module": "tracking-card", "data-visual-id": "tracking-card" }, [map, tech]);
  }

  // app-templates/customer-portal/runtime/src/components/orders/MembershipCard.js
  function MembershipCard(plan) {
    return h("div", { "class": "membership-card", "data-module": "membership-card", "data-visual-id": "membership-card" }, [
      h("div", { "class": "membership-card__sheen" }),
      h("div", { style: "position:relative" }, [
        h("div", { style: "font-weight:700;font-size:15px", "data-bind": "plan.name" }, plan.name),
        h("div", { style: "font-size:12.5px;line-height:1.5;opacity:.85;margin-top:5px", "data-bind": "plan.desc" }, plan.desc),
        h("div", { "class": "membership-card__cta", "data-action": "membership.activate", "data-visual-id": "membership-cta" }, "Activate \xB7 " + (plan.monthlyPrice || "$9") + "/mo")
      ])
    ]);
  }

  // app-templates/customer-portal/runtime/src/components/orders/Timeline.js
  function Timeline(steps) {
    return h("div", { "class": "panel", "data-module": "timeline", "data-visual-id": "timeline" }, [
      h("div", { "class": "panel__title", style: "margin-bottom:16px" }, "Progress"),
      h("div", { "class": "timeline" }, [h("div", { "class": "timeline__line" })].concat(
        steps.map(function(st) {
          return h("div", { "class": "timeline-step", "data-module": "timeline-step" }, [
            h("div", { "class": "timeline-step__dot", style: "background:" + st.dot }),
            h("div", null, [
              h("div", { "class": "timeline-step__title", style: st.muted ? "color:var(--ink-3)" : "" }, st.label),
              h("div", { "class": "timeline-step__sub" }, st.sub)
            ])
          ]);
        })
      ))
    ]);
  }

  // app-templates/customer-portal/runtime/src/routes/OrderDetailPage.js
  function buildOrderView(o) {
    var fixture = currentFixture();
    var num2 = parseInt(String(o.price).replace(/[^0-9]/g, ""), 10);
    var hasPrice = num2 > 0 && o.status !== "cancelled";
    var labor = hasPrice ? Math.round(num2 * 0.65) : 0;
    var parts = hasPrice ? num2 - labor : 0;
    var activeIdx = o.status === "scheduled" ? 0 : o.status === "inprogress" ? 2 : 3;
    var stepDefs = [
      { label: "Order booked", sub: "Confirmation sent" },
      { label: "Specialist assigned", sub: fixture.technician.name + " \xB7 \u2605 " + fixture.technician.rating },
      { label: "Appointment in progress", sub: "Status shared in your portal" },
      { label: "Service complete", sub: o.status === "completed" ? "Rated \u2605\u2605\u2605\u2605\u2605" : "Pending" }
    ];
    var steps = stepDefs.map(function(st, i) {
      var dot, done;
      if (o.status === "cancelled") {
        dot = i === 0 ? "#1f8a44" : "#cfd4dd";
        done = i === 0;
      } else if (o.status === "completed") {
        dot = "#1f8a44";
        done = true;
      } else if (i < activeIdx) {
        dot = "#1f8a44";
        done = true;
      } else if (i === activeIdx) {
        dot = "var(--accent)";
        done = true;
      } else {
        dot = "#cfd4dd";
        done = false;
      }
      return { label: st.label, sub: st.sub, dot, muted: !done };
    });
    var loc = fixture.addresses.find(function(a) {
      return a.id === o.locationId;
    });
    return {
      order: o,
      hasPrice,
      laborStr: "$" + labor,
      partsStr: "$" + parts,
      steps,
      location: loc,
      isScheduled: o.status === "scheduled",
      isInProgress: o.status === "inprogress",
      isCompleted: o.status === "completed",
      isCancelled: o.status === "cancelled"
    };
  }
  function DetailLiveMap(technician) {
    var tech = technician || { name: "Your specialist", eta: "Status updating" };
    var canvas = h("div", { "class": "detail-map__canvas" }, [
      detailSvg(),
      h("div", { style: "position:absolute;left:40px;top:142px;width:14px;height:14px;border-radius:999px;background:var(--surface);border:3px solid var(--accent)" }),
      h("div", { style: "position:absolute;left:548px;top:18px" }, [
        h("div", { "class": "tracking-pin-end__ping" }),
        h("div", { "class": "tracking-pin-end__dot" })
      ])
    ]);
    var bar = h("div", { "class": "detail-map__bar" }, [
      h("div", { style: "font-weight:600;font-size:14px;flex:1", "data-bind": "visit.techName,visit.eta" }, tech.name + " is with you \xB7 " + tech.eta),
      ActionButton({ variant: "btn--primary", label: "Call", action: "support.open", visualId: "detail-call" })
    ]);
    return h("div", { "class": "detail-map", "data-module": "tracking-card", "data-visual-id": "detail-live-map" }, [canvas, bar]);
  }
  function detailSvg() {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 600 180");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("style", "position:absolute;inset:0;width:100%;height:100%");
    var p = document.createElementNS(ns, "path");
    p.setAttribute("d", "M40 150 C 160 130, 200 50, 330 70 S 520 60, 560 30");
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", "var(--accent)");
    p.setAttribute("stroke-width", "3");
    p.setAttribute("stroke-dasharray", "8 8");
    p.setAttribute("opacity", ".55");
    svg.appendChild(p);
    return svg;
  }
  function kv(k, v) {
    return h("div", { "class": "kv-row" }, [h("span", null, k), h("b", null, v)]);
  }
  function PhotoReport() {
    function col(label, after) {
      return h("div", null, [
        h("div", { "class": "photo-col__label" }, label),
        h("div", { "class": "photo-pair" }, [
          h("div", { "class": "photo-tile" + (after ? " photo-tile--after" : "") }, h("span", null, (after ? "after" : "before") + " photo")),
          h("div", { "class": "photo-tile" + (after ? " photo-tile--after" : "") }, h("span", null, (after ? "after" : "before") + " photo"))
        ])
      ]);
    }
    return h("div", { "class": "panel", "data-module": "photo-report", "data-visual-id": "photo-report" }, [
      h("div", { "class": "panel__title", style: "margin-bottom:3px" }, "Photo report"),
      h("div", { style: "font-size:13px;color:var(--ink-2);margin-bottom:14px" }, "Before & after this visit"),
      h("div", { "class": "photo-grid" }, [col("Before", false), col("After", true)])
    ]);
  }
  function OrderDetail() {
    var o = currentOrder();
    var fixture = currentFixture();
    var page = h("section", { "class": "page page--narrow", "data-route": "order.detail", "data-visual-id": "order-detail", "data-state": o.status });
    page.appendChild(h("div", { "class": "detail-back", "data-action": "order.back", "data-visual-id": "detail-back" }, "\u2039 Back to orders"));
    if (state.view === "loading") {
      page.appendChild(detailSkeleton());
      return page;
    }
    if (state.view === "error") {
      page.appendChild(ErrorState({ title: "Couldn\u2019t load this visit", desc: "Something went wrong fetching the order. Try again." }));
      return page;
    }
    var vm = buildOrderView(o);
    var meta = fixture.statusMeta[o.status];
    page.appendChild(h("div", { "class": "detail-head" }, [
      h("div", { "class": "detail-head__icon", style: "background:" + o.iconBg }, h("i", { style: "background:" + o.dot })),
      h("div", { "class": "detail-head__body" }, [
        h("div", { "class": "detail-head__title", "data-bind": "order.name" }, o.name),
        h("div", { "class": "detail-head__meta", "data-bind": "order.id,order.date" }, o.id + " \xB7 " + o.date)
      ]),
      h("div", { "class": "detail-head__right" }, [
        StatusBadge({ variant: meta.badge, label: meta.label, bind: "order.statusLabel" }),
        h("div", { "class": "detail-price", "data-bind": "order.price" }, vm.isCancelled ? "\u2014" : o.price)
      ])
    ]));
    var grid = h("div", { "class": "detail-grid" });
    var left = h("div", { "class": "detail-col" });
    var right = h("div", { "class": "detail-col" });
    if (vm.isInProgress) left.appendChild(DetailLiveMap(fixture.technician));
    if (vm.isScheduled) left.appendChild(h("div", { "class": "status-banner status-banner--accent", "data-module": "status-banner", "data-visual-id": "scheduled-banner" }, [
      h("div", { "class": "status-banner__icon" }, h("i")),
      h("div", { style: "flex:1" }, [
        h("div", { "class": "status-banner__title" }, "Scheduled for " + o.date),
        h("div", { "class": "status-banner__sub" }, "Your specialist and preparation details are in the appointment record.")
      ])
    ]));
    if (vm.isCompleted) left.appendChild(h("div", { "class": "status-banner status-banner--ok", "data-module": "status-banner", "data-visual-id": "completed-banner" }, [
      h("div", { "class": "status-banner__icon", style: "color:var(--ok)" }, "\u2713"),
      h("div", { style: "flex:1" }, [
        h("div", { "class": "status-banner__title" }, "Completed on " + o.date),
        h("div", { "class": "status-banner__sub status-banner__sub--ok" }, "You rated this visit \u2605\u2605\u2605\u2605\u2605")
      ])
    ]));
    if (vm.isCancelled) left.appendChild(h("div", { "class": "status-banner status-banner--danger", "data-module": "status-banner", "data-visual-id": "cancelled-banner" }, [
      h("div", { "class": "status-banner__icon", style: "color:var(--danger)" }, "\u2715"),
      h("div", { style: "flex:1" }, [
        h("div", { "class": "status-banner__title" }, "Visit cancelled"),
        h("div", { "class": "status-banner__sub status-banner__sub--danger" }, "This visit was cancelled. You weren\u2019t charged.")
      ])
    ]));
    if (vm.location) {
      var others = state.orders.filter(function(x) {
        return x.id !== o.id && (x.status === "scheduled" || x.status === "inprogress");
      });
      var locCard = h("div", { "class": "card", "data-module": "location-card", "data-visual-id": "location-card", style: "overflow:hidden" }, [
        h("div", { style: "display:flex;align-items:center;gap:10px;padding:14px 16px 0;flex-wrap:wrap" }, [
          h("div", { "class": "panel__title", style: "font-size:14.5px" }, "Service location"),
          h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, "\u{1F4CD} " + vm.location.label)
        ])
      ]);
      if (others.length) locCard.appendChild(h(
        "div",
        { style: "display:flex;gap:8px;flex-wrap:wrap;padding:10px 16px 0" },
        others.map(function(x) {
          var l2 = fixture.addresses.find(function(a) {
            return a.id === x.locationId;
          });
          return h("span", { "class": "chip", "data-action": "order.open", "data-id": x.id }, "\u2194 " + (l2 ? l2.label : "") + " \xB7 " + x.date);
        })
      ));
      locCard.appendChild(h("div", { "class": "property-map" }, [
        h("span", { "class": "map-label" }, "property map"),
        h("div", { style: "position:absolute;left:30%;top:52%" }, h("div", { "class": "map-pin__marker" }))
      ]));
      left.appendChild(locCard);
    }
    if (!vm.isCancelled) left.appendChild(h("div", { "class": "tech-card", "data-module": "technician-card", "data-visual-id": "technician-card" }, [
      h("div", { "class": "tech-card__avatar" }),
      h("div", { style: "flex:1" }, [
        h("div", { style: "font-weight:700;font-size:15px", "data-bind": "technician.name" }, fixture.technician.name),
        h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, fixture.technician.role + " \xB7 \u2605 " + fixture.technician.rating + " (" + fixture.technician.visits + " visits)")
      ]),
      ActionButton({ variant: "btn--ghost", label: "Message", action: "support.open", visualId: "tech-message" })
    ]));
    left.appendChild(Timeline(vm.steps));
    if (o.wt) left.appendChild(WeatherDetail(o));
    if (o.photos && vm.isCompleted) left.appendChild(PhotoReport());
    var inv = h("div", { "class": "panel", "data-module": "invoice", "data-visual-id": "invoice" }, [h("div", { "class": "panel__title", style: "margin-bottom:14px" }, "Invoice")]);
    if (vm.hasPrice) {
      inv.appendChild(h("div", { "class": "invoice__row" }, [h("span", null, "Treatment"), h("b", null, vm.laborStr)]));
      inv.appendChild(h("div", { "class": "invoice__row" }, [h("span", null, "Products & care"), h("b", null, vm.partsStr)]));
      inv.appendChild(h("div", { "class": "invoice__total" }, [h("span", null, "Total"), h("span", { "data-bind": "order.price" }, o.price)]));
    } else if (vm.isScheduled) {
      inv.appendChild(h("div", { style: "font-size:13px;line-height:1.5;color:var(--ink-2)" }, [
        "Your appointment total is confirmed before your visit. Estimate: ",
        h("b", { style: "color:var(--ink)" }, o.price),
        "."
      ]));
    } else {
      inv.appendChild(h("div", { style: "font-size:13px;color:var(--ink-2)" }, "No charge for this visit."));
    }
    right.appendChild(inv);
    var acts = h("div", { "class": "action-stack" });
    if (vm.isCompleted) {
      acts.appendChild(ActionButton({ variant: "btn--primary", label: "Download invoice", action: "order.downloadInvoice", id: o.id, block: true, lg: true, visualId: "download-invoice" }));
      acts.appendChild(ActionButton({ variant: "btn--ghost", label: "Book again", action: "order.bookAgain", block: true, lg: true, visualId: "book-again" }));
    } else if (vm.isInProgress) {
      acts.appendChild(ActionButton({ variant: "btn--primary", label: "Contact technician", action: "support.open", block: true, lg: true, visualId: "contact-tech" }));
    } else if (vm.isScheduled) {
      acts.appendChild(ActionButton({ variant: "btn--primary", label: "Reschedule", action: "order.reschedule", id: o.id, block: true, lg: true, visualId: "reschedule" }));
      acts.appendChild(ActionButton({ variant: "btn--danger", label: "Cancel visit", action: "order.cancel", id: o.id, confirm: true, block: true, lg: true, visualId: "cancel-visit" }));
    } else if (vm.isCancelled) {
      acts.appendChild(ActionButton({ variant: "btn--primary", label: "Rebook this service", action: "order.bookAgain", block: true, lg: true, visualId: "rebook" }));
    }
    acts.appendChild(ActionButton({ variant: "btn--ghost", label: "Get help", action: "support.open", block: true, lg: true, visualId: "get-help" }));
    right.appendChild(acts);
    grid.appendChild(left);
    grid.appendChild(right);
    page.appendChild(grid);
    return page;
  }

  // app-templates/customer-portal/runtime/src/components/orders/WeatherCard.js
  function WeatherBanner(order) {
    var v = currentTheme();
    var loc = (currentFixture().addresses.find(function(a) {
      return a.id === order.locationId;
    }) || {}).label || "";
    return h("div", { "class": "alert-banner alert-banner--info", "data-module": "alert-banner", "data-visual-id": "weather-banner", "data-state": "pending-action" }, [
      h("div", { "class": "alert-banner__icon wt-pulse", style: "background:rgba(14,143,196,.16)" }, v.wt.icon),
      h("div", { "class": "alert-banner__body", "data-action": "order.open", "data-id": order.id, style: "cursor:pointer" }, [
        h("div", { "class": "alert-banner__title" }, [
          h("span", null, "Weather Trigger \u2014 confirm your visit"),
          StatusBadge({ variant: "status-badge--warn", label: "Respond by " + order.wt.deadline })
        ]),
        h("div", { "class": "alert-banner__desc" }, order.name + " at " + loc + " \xB7 if we don\u2019t hear back, the visit proceeds automatically per your contract")
      ]),
      ActionButton({ variant: "btn--info", label: "Confirm", action: "weather.confirm", id: order.id, visualId: "weather-confirm" }),
      ActionButton({ variant: "btn--danger", label: "Decline", action: "weather.decline", id: order.id, visualId: "weather-decline" })
    ]);
  }
  function WeatherDetail(o) {
    var wt = o.wt, els = [];
    els.push(h("div", { "class": "weather-card__head" }, [
      h("div", { "class": "weather-card__icon" + (wt.status === "pending" ? " wt-pulse" : "") }, currentTheme().wt.icon),
      h("div", { "class": "panel__title", style: "flex:1" }, "Weather Trigger"),
      StatusBadge({
        variant: wt.status === "pending" ? "status-badge--warn" : wt.status === "declined" ? "status-badge--danger" : "status-badge--ok",
        label: wt.status === "pending" ? "Awaiting you" : wt.status === "declined" ? "Declined" : wt.status === "confirmed" ? "Confirmed" : "Auto-confirmed"
      })
    ]));
    els.push(h("div", { style: "font-size:13px;line-height:1.5;color:var(--ink-2);margin-bottom:14px" }, wt.trigger + " \xB7 detected " + wt.detected));
    if (wt.status === "pending") {
      els.push(h("div", { "class": "weather-pending", "data-state": "pending-action" }, [
        h("div", { style: "font-weight:600;font-size:13.5px;color:var(--warn)" }, "Please confirm by " + wt.deadline),
        h("div", { style: "font-size:12.5px;line-height:1.5;color:var(--ink-2);margin-top:3px" }, wt.auto)
      ]));
      els.push(h("div", { style: "display:flex;gap:10px" }, [
        ActionButton({ variant: "btn--info", label: "Confirm visit", action: "weather.confirm", id: o.id, block: true, visualId: "wt-confirm" }),
        ActionButton({ variant: "btn--danger", label: "Decline", action: "weather.decline", id: o.id, visualId: "wt-decline" })
      ]));
    } else if (wt.status === "auto") {
      els.push(h("div", { style: "display:flex;flex-direction:column;gap:7px;margin-bottom:6px" }, [
        kv("Dispatched", "Jan 5 \xB7 7:02 AM"),
        kv("Arrived", "Jan 5 \xB7 7:38 AM"),
        kv("Cleared", "Jan 5 \xB7 8:51 AM")
      ]));
      els.push(h("div", { style: "font-size:12.5px;color:var(--ok);font-weight:600" }, "\u2713 " + wt.sla));
    } else if (wt.status === "confirmed") {
      els.push(h("div", { style: "font-size:13px;color:var(--ok);font-weight:600" }, "\u2713 You confirmed this visit \u2014 the crew will proceed as scheduled."));
    } else if (wt.status === "declined") {
      els.push(h("div", { style: "font-size:13px;color:var(--danger);font-weight:600" }, "\u2715 You declined \u2014 no service will occur for this trigger."));
    }
    els.push(h("div", { "class": "locked-report", "data-module": "locked-report", "data-visual-id": "compliance-report" }, [
      h("div", { "class": "locked-report__blur" }, [
        kv("GPS arrival ping", "43.21, -79.88"),
        kv("Surface temp at arrival", "\u22122.4\xB0C"),
        kv("Snowfall depth logged", "3.2 cm")
      ]),
      h("div", { "class": "locked-report__lock" }, [
        h("div", { style: "font-size:20px" }, "\u{1F512}"),
        h("div", { style: "font-weight:700;font-size:13.5px" }, "Detailed Compliance Report"),
        h("div", { style: "font-size:12px;line-height:1.5;color:var(--ink-2);max-width:240px" }, "GPS arrival logs, time-stamped readings & full audit trail for this trigger."),
        h("div", { "class": "tab tab--active", style: "margin-top:4px", "data-action": "compliance.unlock", "data-visual-id": "unlock-compliance" }, "Unlock \xB7 $12/mo")
      ])
    ]));
    return h("div", { "class": "panel", "data-module": "weather-card", "data-visual-id": "weather-card" }, els);
  }

  // app-templates/customer-portal/runtime/src/components/proposals/ProposalBanner.js
  function ProposalBanner(pendingCount) {
    var v = currentTheme();
    var proposal = currentProposal();
    var siteCount = proposalSites().length;
    return h("div", {
      "class": "alert-banner alert-banner--glass",
      "data-module": "alert-banner",
      "data-visual-id": "proposal-banner",
      "data-action": "proposal.review"
    }, [
      h("div", { "class": "brand-logo brand-logo--lg" }),
      h("div", { "class": "alert-banner__body" }, [
        h("div", { "class": "alert-banner__title" }, [
          h("span", { "data-bind": "proposal.id" }, "Proposal #" + proposal.id + " is ready"),
          StatusBadge({ variant: "status-badge--warn", label: pendingCount + " awaiting you", bind: "proposal.pendingCount" })
        ]),
        h("div", { "class": "alert-banner__desc" }, v.prop.svc + " across " + siteCount + " properties \xB7 choose a plan per site \xB7 valid until " + proposal.validUntil)
      ]),
      h("div", { "class": "btn btn--primary btn--lg" }, "Review proposal \u203A")
    ]);
  }

  // app-templates/customer-portal/runtime/src/routes/CalendarPage.js
  function Calendar() {
    if (state.view === "empty") {
      return h("section", { "class": "page", "data-route": "calendar", "data-visual-id": "calendar", "data-state": "empty" }, [
        EmptyState({ glyph: "i", title: "No visits scheduled", desc: "Upcoming and completed visits appear here once they are available." })
      ]);
    }
    if (activeProfile().weatherCalendar) return StormCalendar();
    return MonthCalendar();
  }
  function MonthCalendar() {
    var page = h("section", { "class": "page", style: "max-width:920px", "data-route": "calendar", "data-visual-id": "calendar" });
    page.appendChild(h("div", { "class": "section-head" }, [
      h("div", { "class": "section-head__title" }, "Calendar"),
      h("div", { "class": "section-head__sub" }, "Every upcoming and past service, at a glance.")
    ]));
    var cal = h("div", { "class": "cal-card", "data-module": "calendar-grid", "data-visual-id": "calendar-grid" });
    cal.appendChild(h("div", { "class": "cal-nav" }, [
      h("div", { "class": "cal-nav__btn", "data-action": "calendar.prev", "aria-label": "Previous month" }, "\u2039"),
      h("div", { "class": "cal-month" }, F.MONTHS[state.calMonth] + " " + state.calYear),
      h("div", { "class": "cal-nav__btn", "data-action": "calendar.next", "aria-label": "Next month" }, "\u203A")
    ]));
    cal.appendChild(h("div", { "class": "cal-weekdays" }, ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(function(d) {
      return h("div", { "class": "cal-weekday" }, d);
    })));
    var grid = h("div", { "class": "cal-grid" });
    buildCalendarGrid(state.calYear, state.calMonth).forEach(function(c) {
      if (c.empty) {
        grid.appendChild(h("div"));
        return;
      }
      var isToday = state.calYear === 2026 && state.calMonth === 0 && c.day === 15;
      var cell = h(
        "div",
        { "class": "cal-cell" + (c.events.length ? " cal-cell--has" : "") + (isToday ? " cal-cell--today" : ""), "data-module": "calendar-cell" },
        [h("div", { "class": "cal-day" }, String(c.day))]
      );
      var dots = h("div", { "class": "cal-dots" });
      c.events.forEach(function(e) {
        var color = e.status === "completed" ? "#1f8a44" : e.status === "inprogress" ? "#ff9f0a" : "var(--accent)";
        dots.appendChild(h("span", { "class": "cal-dot", style: "background:" + color }));
      });
      cell.appendChild(dots);
      if (c.events.length) {
        cell.setAttribute("data-action", "order.open");
        cell.setAttribute("data-id", c.events[0].id);
      }
      grid.appendChild(cell);
    });
    cal.appendChild(grid);
    page.appendChild(cal);
    var upcoming = state.orders.filter(function(o) {
      return o.status !== "completed";
    }).sort(sortByDateAsc);
    var past = state.orders.filter(function(o) {
      return o.status === "completed";
    }).sort(sortByDateDesc);
    page.appendChild(h("div", { "class": "cal-lists" }, [
      calList("Upcoming", upcoming),
      calList("Past", past)
    ]));
    return page;
  }
  function sortByDateAsc(a, b) {
    return a.y - b.y || a.m - b.m || a.d - b.d;
  }
  function sortByDateDesc(a, b) {
    return b.y - a.y || b.m - a.m || b.d - a.d;
  }
  function calList(title, orders) {
    var list = h("div", { "class": "cal-list", "data-module": "order-list" }, [h("div", { "class": "cal-list__title" }, title)]);
    if (orders.length === 0) list.appendChild(h("div", { style: "padding:14px 12px;font-size:13px;color:var(--ink-2)" }, "Nothing here."));
    else orders.forEach(function(o) {
      list.appendChild(OrderCard(o));
    });
    return list;
  }

  // app-templates/customer-portal/runtime/src/components/storm/StormCalendar.js
  function stormChip(status) {
    var map = {
      completed: ["status-badge--ok", "Completed"],
      onroute: ["status-badge--info", "On route"],
      scheduled: ["status-badge--scheduled", "Scheduled"],
      skipped: ["status-badge--scheduled", "Skipped"],
      delayed: ["status-badge--warn", "Delayed"]
    };
    var m = map[status] || map.scheduled;
    return h("span", { "class": "status-badge " + m[0], "data-module": "status-badge", "data-bind": "event.status", "data-state": status }, m[1]);
  }
  function StormCalendar() {
    var cal = currentStormCalendar();
    var page = h("section", { "class": "page page--narrow", "data-route": "calendar", "data-visual-id": "storm-calendar" });
    page.appendChild(h("div", { "class": "section-head" }, [
      h("div", { "class": "section-head__title" }, "Calendar"),
      h("div", { "class": "section-head__sub" }, "Your service plan, by date and weather \u2014 what\u2019s scheduled, what triggers service, and what needs you.")
    ]));
    page.appendChild(h("div", { "class": "contract-banner", "data-module": "contract-banner", "data-visual-id": "contract-banner" }, [
      h("div", { "class": "contract-banner__icon" }, "\u21BB"),
      h("div", { style: "flex:1" }, [
        h("div", { style: "font-weight:700;font-size:14px" }, "Recurring: " + cal.contract.rule),
        h("div", { style: "font-size:12.5px;color:var(--ink-2);margin-top:2px" }, cal.contract.note)
      ]),
      h("span", { "class": "status-badge status-badge--ok" }, "Active")
    ]));
    var agenda = h("div", { "class": "storm-agenda", "data-module": "storm-agenda" });
    cal.days.forEach(function(d) {
      var col = h("div", { "class": "storm-day__date" + (d.today ? " storm-day__date--today" : "") }, [
        h("div", { style: "font-weight:800;font-size:15px" }, d.date),
        h("div", { style: "font-size:12px;color:var(--ink-3);margin-top:1px" }, d.dateSub)
      ]);
      var main = h("div", { "class": "storm-day__main" });
      main.appendChild(h("div", { "class": "storm-weather storm-weather--" + d.weather.state, "data-module": "weather-row", "data-visual-id": "weather-row" }, [
        h("span", { "class": "storm-weather__dot" }),
        h("span", { style: "flex:1;font-weight:600;font-size:13px" }, d.weather.label),
        h("span", { style: "font-size:12.5px;color:var(--ink-2)" }, d.weather.temp)
      ]));
      d.events.forEach(function(ev) {
        var meta = ev.time ? ev.tech ? ev.time + " \xB7 " + ev.tech : ev.time : ev.note || (ev.trigger ? "Auto-dispatch on trigger" : "");
        var acts = [];
        if (ev.status === "onroute") {
          acts.push(stormAct("Track", "order.open", state.orders[0] && state.orders[0].id));
          acts.push(stormAct("Message", "support.open"));
        }
        if (ev.status === "scheduled" && d.needsAccess) acts.push(stormAct("Confirm access", "access.confirm", d.dateSub, true));
        if (ev.status === "completed") {
          if (ev.photos) acts.push(stormAct("View report", "order.open", "#SV-3290"));
          acts.push(stormAct("Report issue", "service.reportIssue", ev.type));
        }
        if (ev.status === "delayed" || ev.status === "skipped") acts.push(stormAct("Request extra", "service.requestExtra"));
        var event = h("div", { "class": "storm-event", "data-module": "service-window", "data-visual-id": "service-window", "data-state": ev.status }, [
          stormChip(ev.status),
          h("div", { "class": "storm-event__body" }, [
            h("div", { style: "display:flex;align-items:center;gap:8px;flex-wrap:wrap" }, [
              h("span", { style: "font-weight:600;font-size:14px", "data-bind": "event.type" }, ev.type),
              ev.trigger ? h("span", { "class": "trigger-tag" }, "\u26A1 auto by trigger") : null
            ]),
            meta ? h("div", { style: "font-size:12.5px;color:var(--ink-2);margin-top:2px" }, meta) : null
          ]),
          acts.length ? h("div", { "class": "storm-actions" }, acts) : null
        ]);
        main.appendChild(event);
      });
      agenda.appendChild(h("div", { "class": "storm-day" + (d.today ? " storm-day--today" : ""), "data-module": "storm-day", "data-visual-id": "storm-day" }, [col, main]));
    });
    page.appendChild(agenda);
    var access = h("div", { "class": "list-panel", "data-module": "access-notes", "data-visual-id": "access-notes" }, [
      h("div", { "class": "list-panel__head" }, [
        h("div", { "class": "list-panel__title", style: "flex:1" }, "Access & blackout notes"),
        h("div", { "class": "link-action", "data-action": "access.update" }, "Update")
      ])
    ]);
    cal.accessNotes.forEach(function(n) {
      access.appendChild(h("div", { "class": "access-row" }, [
        h("span", { style: "font-weight:600;font-size:13px;min-width:96px" }, n.label),
        h("span", { style: "font-size:13px;color:var(--ink-2)" }, n.value)
      ]));
    });
    page.appendChild(access);
    return page;
  }
  function stormAct(label, action, id, primary) {
    return h("button", { "class": "storm-act" + (primary ? " storm-act--primary" : ""), "data-action": action, "data-id": id || void 0, "data-visual-id": "storm-action" }, label);
  }

  // app-templates/customer-portal/runtime/src/components/storm/StormHome.js
  function StormHome() {
    var cal = currentStormCalendar();
    var today = cal.days.find(function(d) {
      return d.today;
    }) || cal.days[0];
    var todayIdx = cal.days.indexOf(today);
    var upcoming = cal.days.slice(todayIdx + 1);
    var accessDay = upcoming.find(function(d) {
      return d.needsAccess;
    });
    var page = h("section", { "class": "page", "data-route": "orders.list", "data-visual-id": "storm-home" });
    page.appendChild(PageHeader({
      title: currentFixture().customer.greeting,
      sub: today.weather.state === "watch" ? "Weather watch tonight \xB7 " + (accessDay ? "1 visit needs your OK" : "crew on the way") : "Your service plan is on track"
    }));
    if (state.view === "error") {
      page.appendChild(ErrorState({}));
      return page;
    }
    var grid = h("div", { "class": "cabinet-grid" });
    var left = h("div", { "class": "cabinet-col" });
    var right = h("div", { "class": "cabinet-col" });
    var todayEvent = today.events[0];
    var statusActions = [];
    if (todayEvent && todayEvent.status === "onroute") {
      statusActions.push(stormAct("Track visit", "order.open", state.orders[0] && state.orders[0].id, true));
      statusActions.push(stormAct("Message crew", "support.open"));
    }
    if (accessDay) statusActions.push(stormAct("Confirm access \xB7 " + accessDay.date, "access.confirm", accessDay.dateSub, !todayEvent || todayEvent.status !== "onroute"));
    var status = h("div", { "class": "storm-status storm-status--" + today.weather.state, "data-module": "storm-status", "data-visual-id": "storm-status", "data-state": today.weather.state }, [
      h("div", { "class": "storm-status__head" }, [
        h("span", { "class": "storm-status__dot" }),
        h("span", { style: "flex:1;font-weight:700;font-size:15.5px" }, today.weather.label),
        h("span", { "class": "storm-status__temp" }, today.weather.temp)
      ]),
      todayEvent ? h("div", { "class": "storm-status__event" }, [
        stormChip(todayEvent.status),
        h("div", { style: "flex:1;min-width:0" }, [
          h("div", { style: "font-weight:600;font-size:14.5px" }, todayEvent.type),
          h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, todayEvent.time ? todayEvent.tech ? todayEvent.time + " \xB7 " + todayEvent.tech : todayEvent.time : "Scheduled")
        ])
      ]) : h("div", { style: "font-size:13.5px;color:var(--ink-2)" }, "No visit needed today \u2014 below the service trigger."),
      statusActions.length ? h("div", { "class": "storm-actions", style: "margin-top:2px" }, statusActions) : null
    ]);
    left.appendChild(status);
    var windows = h("div", { "class": "card card--pad", "data-module": "next-windows", "data-visual-id": "next-windows" }, [
      h("div", { style: "display:flex;align-items:center;margin-bottom:12px" }, [
        h("div", { "class": "card__title", style: "flex:1" }, "Next service windows"),
        h("div", { "class": "link-action", "data-action": "nav.go", "data-id": "calendar" }, "Open calendar \u203A")
      ])
    ]);
    if (upcoming.length === 0) windows.appendChild(h("div", { style: "font-size:13px;color:var(--ink-2)" }, "Nothing scheduled \u2014 we dispatch automatically when the weather triggers."));
    upcoming.slice(0, 3).forEach(function(d) {
      var ev = d.events[0];
      windows.appendChild(h("div", { "class": "home-window", "data-module": "service-window" }, [
        h("div", { "class": "home-window__date" }, [h("div", { style: "font-weight:700;font-size:13.5px" }, d.date), h("div", { style: "font-size:11.5px;color:var(--ink-3)" }, d.dateSub)]),
        h("div", { "class": "storm-weather storm-weather--" + d.weather.state, style: "flex:1" }, [
          h("span", { "class": "storm-weather__dot" }),
          h("span", { style: "flex:1;font-weight:600;font-size:12.5px" }, d.weather.label)
        ]),
        ev ? stormChip(ev.status) : null,
        d.needsAccess ? stormAct("Confirm", "access.confirm", d.dateSub, true) : null
      ]));
    });
    left.appendChild(windows);
    var history = h("div", { "class": "card", "data-module": "order-list", "data-visual-id": "service-history" }, [
      h("div", { "class": "card__head" }, [h("span", { "class": "card__title" }, "Service history")])
    ]);
    var hlist = h("div", { "class": "order-list" });
    if (state.view === "loading") {
      for (var i = 0; i < 3; i++) hlist.appendChild(skeletonRow());
    } else state.orders.filter(function(o) {
      return o.status === "completed";
    }).slice(0, 4).forEach(function(o) {
      hlist.appendChild(OrderCard(o));
    });
    history.appendChild(hlist);
    left.appendChild(history);
    right.appendChild(h("div", { "class": "card card--pad season-card", "data-module": "season-status", "data-visual-id": "season-status" }, [
      h("div", { style: "display:flex;align-items:center;gap:9px;margin-bottom:14px" }, [
        h("div", { "class": "card__title", style: "flex:1" }, currentTheme().plan.name),
        h("span", { "class": "status-badge status-badge--ok" }, "Active")
      ]),
      seasonRow("Visits this season", "8"),
      seasonRow("Auto-dispatch", "weather trigger"),
      seasonRow("Saved this season", currentFixture().customer.stats.savings, "var(--ok)"),
      h("div", { style: "margin-top:14px" }, ActionButton({ variant: "btn--ghost", label: "Manage plan", action: "profile.managePlan", block: true, visualId: "home-manage-plan" }))
    ]));
    var access = h("div", { "class": "card card--pad", "data-module": "access-notes", "data-visual-id": "home-access-notes" }, [
      h("div", { style: "display:flex;align-items:center;margin-bottom:12px" }, [
        h("div", { "class": "card__title", style: "flex:1;font-size:15px" }, "Access notes"),
        h("div", { "class": "link-action", "data-action": "access.update" }, "Edit")
      ])
    ]);
    cal.accessNotes.forEach(function(n) {
      access.appendChild(h("div", { "class": "access-row" }, [h("span", { style: "font-weight:600;font-size:12.5px;min-width:84px" }, n.label), h("span", { style: "font-size:12.5px;color:var(--ink-2)" }, n.value)]));
    });
    right.appendChild(access);
    grid.appendChild(left);
    grid.appendChild(right);
    page.appendChild(grid);
    return page;
  }
  function seasonRow(label, value, color) {
    return h("div", { "class": "season-row" }, [
      h("span", { style: "font-size:13.5px;color:var(--ink-2)" }, label),
      h("span", { style: "font-weight:700;font-size:13.5px" + (color ? ";color:" + color : "") }, value)
    ]);
  }

  // app-templates/customer-portal/runtime/src/routes/OrdersPage.js
  function Cabinet() {
    if (activeProfile().weatherCalendar) return StormHome();
    var fixture = currentFixture();
    var v = currentTheme();
    var page = h("section", { "class": "page", "data-route": "orders.list", "data-visual-id": "cabinet" });
    page.appendChild(PageHeader({ title: fixture.customer.greeting, sub: fixture.customer.subline }));
    if (state.view === "error") {
      page.appendChild(ErrorState({}));
      return page;
    }
    var pending = proposalSites().filter(function(p) {
      return p.status === "unseen" || p.status === "viewed";
    }).length;
    if (state.view === "ready") {
      if (!state.config.caseId) page.appendChild(ProposalBanner(pending));
      var wt = state.orders.find(function(o) {
        return o.wt && o.wt.status === "pending";
      });
      if (wt) page.appendChild(WeatherBanner(wt));
    }
    var grid = h("div", { "class": "cabinet-grid" });
    var left = h("div", { "class": "cabinet-col" });
    var right = h("div", { "class": "cabinet-col" });
    if (state.view === "ready" && state.orders.some(function(o) {
      return o.status === "inprogress";
    })) {
      left.appendChild(TrackingCard(fixture.technician, state.orders.find(function(o) {
        return o.status === "inprogress";
      })));
    }
    var ordersCard = h("div", { "class": "card", "data-module": "glass-card" });
    ordersCard.appendChild(h("div", { "class": "card__head" }, [
      h("span", { "class": "card__title" }, "Your orders"),
      h("div", { style: "margin-left:auto;display:flex;gap:6px;flex-wrap:wrap;align-items:center" }, [
        Tabs({ items: tabItems(), active: state.filter, action: "order.filter" }),
        h("select", { "class": "select-pill", "data-module": "filter-bar", "data-visual-id": "date-filter", "aria-label": "Date range" }, [
          h("option", null, "All time"),
          h("option", null, "Last 30 days"),
          h("option", null, "Last 90 days")
        ]),
        h(
          "select",
          { "class": "select-pill", "data-module": "filter-bar", "data-visual-id": "location-filter", "aria-label": "Location" },
          [h("option", null, "All locations")].concat(fixture.addresses.map(function(a) {
            return h("option", null, a.label);
          }))
        )
      ])
    ]));
    var listWrap = h("div", { "class": "order-list", "data-module": "order-list", "data-visual-id": "order-list" });
    if (state.view === "loading") {
      for (var i = 0; i < 4; i++) listWrap.appendChild(skeletonRow());
    } else if (state.view === "empty" || filteredOrders().length === 0) {
      listWrap.appendChild(EmptyState({
        glyph: "\u{1F5D3}",
        title: "No orders yet",
        desc: "When you book a visit it shows up here with live status and invoices.",
        action: { variant: "btn--primary", label: "Book a service", action: "booking.open", visualId: "empty-book" }
      }));
    } else {
      filteredOrders().forEach(function(o) {
        listWrap.appendChild(OrderCard(o));
      });
    }
    ordersCard.appendChild(listWrap);
    left.appendChild(ordersCard);
    var quick = h("div", { "class": "card card--pad", "data-module": "glass-card" }, [
      h("div", { "class": "card__title", style: "margin-bottom:13px" }, "Quick book"),
      h(
        "div",
        { style: "display:flex;flex-direction:column;gap:9px" },
        v.svc.map(function(s, i2) {
          return ServiceCard(s, i2);
        })
      )
    ]);
    right.appendChild(quick);
    right.appendChild(MembershipCard(v.plan));
    grid.appendChild(left);
    grid.appendChild(right);
    page.appendChild(grid);
    return page;
  }

  // app-templates/customer-portal/runtime/src/components/commerce/PricingCard.js
  function PricingCard(props) {
    var featIcon = props.featured ? h("span", { "class": "plan-badge" }, "POPULAR") : null;
    var card = h("div", { "class": "plan-card" + (props.featured ? " plan-card--featured" : ""), "data-module": "pricing-card", "data-visual-id": "pricing-card", "data-state": props.current ? "current" : void 0 });
    if (props.featured) card.appendChild(h("div", { "class": "plan-sheen" }));
    var body = h("div", props.featured ? { style: "position:relative;display:flex;flex-direction:column;flex:1" } : null, [
      h("div", { "class": "plan-card__name" }, [h("span", null, props.name), featIcon]),
      h("div", { "class": "plan-card__price" }, [h("b", null, props.price), h("span", null, props.suffix || "/mo")]),
      h("div", { "class": "plan-card__tag" }, props.tag),
      h("div", { "class": "plan-features" }, props.features.map(function(f) {
        return h("div", null, "\u2713 " + f);
      })),
      props.current ? h("div", { "class": "plan-cta" }, "Current plan") : h("div", { style: "margin-top:18px" }, ActionButton({ variant: props.featured ? "btn--onaccent" : "btn--ghost", label: props.ctaLabel || "Activate plan", action: props.action || "booking.open", id: props.actionId, block: true, lg: true, visualId: "activate-plan" }))
    ]);
    card.appendChild(body);
    return card;
  }

  // app-templates/customer-portal/runtime/src/routes/ServicesPage.js
  function Services() {
    var v = currentTheme();
    var copy = v.copy || {};
    var page = h("section", { "class": "page", "data-route": "services", "data-visual-id": "services" });
    page.appendChild(h("div", { "class": "section-head" }, [
      h("div", { "class": "section-head__title" }, "Our services"),
      h("div", { "class": "section-head__sub" }, copy.servicesSub || "Choose a ritual, review the details, and manage every visit in one place.")
    ]));
    if (state.view === "loading") {
      var g = h("div", { "class": "services-grid" });
      for (var i = 0; i < 4; i++) g.appendChild(h("div", { "class": "skeleton", style: "height:280px;border-radius:24px" }));
      page.appendChild(g);
      return page;
    }
    page.appendChild(h("div", { "class": "services-grid", "data-module": "service-list" }, v.svc.map(function(s, i2) {
      return ServiceCatalogCard(s, i2);
    })));
    var steps = copy.servicesSteps || [
      { n: "1", t: "Choose your ritual", d: "Review the service that fits your day" },
      { n: "2", t: "Confirm your visit", d: "Your appointment appears in the portal" },
      { n: "3", t: "Keep your routine", d: "Return to notes and aftercare after the visit" }
    ];
    page.appendChild(h("div", { "class": "howto", "data-module": "how-it-works" }, [
      h("div", { "class": "panel__title", style: "margin-bottom:16px" }, "How it works"),
      h("div", { "class": "howto-grid" }, steps.map(function(s) {
        return h("div", { "class": "howto-step" }, [
          h("div", { "class": "howto-step__num" }, s.n),
          h("div", null, [h("div", { style: "font-weight:600;font-size:14px" }, s.t), h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, s.d)])
        ]);
      }))
    ]));
    return page;
  }

  // app-templates/customer-portal/runtime/src/routes/PricingPage.js
  function Pricing() {
    var v = currentTheme();
    var payg = v.copy && v.copy.payAsYouGo || {};
    var pricing = state.moduleData.pricing || {};
    var livePlans = pricing.source === "core-pim" ? pricing.plans : null;
    var page = h("section", { "class": "page", "data-route": "pricing", "data-visual-id": "pricing" });
    page.appendChild(h("div", { "class": "pricing-head" }, [
      h("span", { "class": "eyebrow" }, "Transparent, no surprises"),
      h("h1", { "data-bind": livePlans ? "pim.plan.name" : "plan.headline" }, livePlans ? "Plans from Core PIM" : v.plan.headline),
      h("p", null, livePlans ? "Live catalog data is loaded from Core PIM." : "Pay per visit, or save with a membership. Cancel anytime.")
    ]));
    var cards = livePlans ? livePlans.map(function(plan, index) {
      return PricingCard({
        name: plan.name,
        price: plan.price,
        suffix: plan.interval ? "/" + plan.interval.replace(/^1\s+/i, "").toLowerCase() : "",
        tag: plan.description || plan.cta,
        featured: index === 1,
        features: plan.description ? [plan.description] : ["Published catalog offer"],
        action: plan.allowedActions && plan.allowedActions.includes("support.open") ? "support.open" : "cart.addItem",
        actionId: plan.name,
        ctaLabel: plan.cta || "Choose plan"
      });
    }) : [
      PricingCard({
        name: payg.name || "Pay as you go",
        price: payg.price || "Per ritual",
        tag: payg.tag || "Current total is shown before confirmation",
        current: true,
        features: payg.features || ["Choose an individual ritual", "Keep appointments in one portal", "Review aftercare after your visit"]
      }),
      PricingCard({ name: v.plan.name, price: v.plan.monthlyPrice || "$9", tag: v.plan.tag, featured: true, features: v.plan.features }),
      PricingCard({ name: v.plan.plusName, price: v.plan.plusMonthlyPrice || "$19", tag: v.plan.plusTag || "For a deeper ritual rhythm", features: v.plan.plusFeatures })
    ];
    page.appendChild(h("div", { "class": "pricing-grid", "data-bind": livePlans ? "pim.plans" : "plan.cards" }, cards));
    var rates = h("div", { "class": "rates-card", "data-module": "rates-list", "data-visual-id": "per-visit-rates" }, [
      h("div", { "class": "panel__title", style: "font-size:16px;padding:14px 0 6px" }, livePlans ? "Core PIM catalog" : "Per-visit rates")
    ]);
    (livePlans || v.svc).forEach(function(s, i) {
      var pal = F.PAL[i % 4];
      rates.appendChild(h("div", { "class": "rate-row", "data-module": "rate-row" }, [
        h("div", { "class": "rate-row__icon", style: "background:" + pal[1] }, h("i", { style: "background:" + pal[0] })),
        h("div", { style: "flex:1" }, [
          h("div", { style: "font-weight:600;font-size:14px", "data-bind": "service.name" }, s.name),
          h("div", { style: "font-size:12px;color:var(--ink-2)" }, s.tagline || s.description || "Published catalog item")
        ]),
        h("div", { style: "font-weight:700;font-size:15px", "data-bind": "service.price" }, s.price === "Quote" ? "Quote" : s.price)
      ]));
    });
    page.appendChild(rates);
    return page;
  }

  // app-templates/customer-portal/runtime/src/components/commerce/ProductCard.js
  function ProductCard(p, catIndex) {
    var tint = F.TINTS[catIndex % 4];
    var displayTag = p.displayTag || p.tag || "";
    return h("div", { "class": "product-card", "data-module": "product-card", "data-visual-id": "product-card" }, [
      h(
        "div",
        { "class": "product-card__art", style: "background:" + tint[1] },
        h("div", { "class": "product-card__thumb" }, h("i", { style: "background:" + tint[0] }))
      ),
      displayTag ? h("span", { "class": "product-tag", "data-bind": "product.displayTag" }, displayTag) : null,
      h("div", { "class": "product-card__name", "data-bind": "product.name" }, p.name),
      h("div", { "class": "product-card__blurb", "data-bind": "product.blurb" }, p.blurb || p.description || p.cta),
      h("div", { "class": "product-card__foot" }, [
        h("div", { "class": "price-lg", "data-bind": "product.price" }, p.price),
        ActionButton({ variant: "btn--primary", label: p.allowedActions && p.allowedActions.includes("support.open") ? "Contact" : "Add", action: p.allowedActions && p.allowedActions.includes("support.open") ? "support.open" : "cart.addItem", id: p.name, visualId: "product-add" })
      ])
    ]);
  }

  // app-templates/customer-portal/runtime/src/routes/ProductsPage.js
  function Products() {
    var v = currentTheme();
    var products = state.moduleData.products || {};
    var liveProducts = products.source === "core-pim";
    var page = h("section", { "class": "page", "data-route": "products", "data-visual-id": "products" });
    page.appendChild(h("div", { "class": "featured-banner", "data-module": "featured-banner", "data-visual-id": "featured-banner" }, [
      h("div", { style: "flex:1" }, [
        h("span", { "class": "eyebrow", "data-bind": liveProducts ? "pim.catalog" : "feat.badge" }, liveProducts ? "Core PIM catalog" : v.feat.badge),
        h("h1", { "data-bind": liveProducts ? "pim.product.name" : "feat.title" }, liveProducts ? "Live catalog products" : v.feat.title),
        h("p", { "data-bind": liveProducts ? "pim.product.description" : "feat.desc" }, liveProducts ? "Products and purchasable plans are loaded from Core PIM." : v.feat.desc),
        h("div", { style: "display:flex;gap:11px;align-items:center" }, [
          ActionButton({ variant: "btn--ghost", label: liveProducts ? "Contact support" : v.feat.cta, action: liveProducts ? "support.open" : "booking.open", lg: true, visualId: "featured-cta" }),
          h("div", { style: "font-size:13px;color:rgba(255,255,255,.8)", "data-bind": "feat.fin" }, liveProducts ? "Live mode" : v.feat.fin)
        ])
      ]),
      h("div", { "class": "featured-banner__art" }, h("div", { style: "width:120px;height:56px;border-radius:12px;background:var(--surface);box-shadow:0 4px 14px rgba(var(--hair),.12)" }))
    ]));
    var cats = liveProducts ? [{ key: "all", label: "All" }] : [{ key: "all", label: "All" }].concat(v.cats);
    page.appendChild(h("div", { "class": "shop-head" }, [
      h("div", { "class": "shop-head__title" }, "Shop"),
      h("div", { "class": "tabs", "data-module": "filter-bar" }, cats.map(function(c) {
        return h("span", { "class": "tab" + (c.key === state.prodCat ? " tab--active" : ""), "data-action": "products.filter", "data-id": c.key }, c.label);
      }))
    ]));
    if (state.view === "loading") {
      var loading = h("div", { "class": "product-grid", "data-module": "product-list", "data-state": "loading" });
      for (var index = 0; index < 4; index++) loading.appendChild(skeletonRow());
      page.appendChild(loading);
      return page;
    }
    var list = productItems();
    if (!liveProducts && state.prodCat !== "all") list = list.filter(function(p) {
      return p.cat === state.prodCat;
    });
    if (state.view === "empty" || list.length === 0) {
      page.appendChild(EmptyState({ glyph: "\u{1F4E6}", title: "Nothing here yet", desc: "No products in this category. Try another filter." }));
      return page;
    }
    page.appendChild(h("div", { "class": "product-grid", "data-module": "product-list" }, list.map(function(p) {
      var ci = liveProducts ? 0 : Math.max(0, v.cats.findIndex(function(c) {
        return c.key === p.cat;
      }));
      return ProductCard(p, ci);
    })));
    return page;
  }

  // app-templates/customer-portal/runtime/src/components/commerce/CartRow.js
  function CartRow(item) {
    return h("div", { "class": "cart-row", "data-module": "cart-row", "data-visual-id": "cart-row" }, [
      h(
        "div",
        { "class": "cart-row__thumb", style: "background:" + item.tint },
        h("div", { "class": "cart-row__thumb-inner" }, h("i", { style: "background:" + item.dot }))
      ),
      h("div", { "class": "cart-row__body" }, [
        h("div", { style: "font-weight:700;font-size:14.5px", "data-bind": "product.name" }, item.name),
        h("div", { style: "font-size:13px;color:var(--ink-2)" }, item.price + " each")
      ]),
      h("div", { "class": "qty" }, [
        h("button", { "class": "qty__btn qty__btn--minus", "data-action": "cart.dec", "data-id": item.name, "aria-label": "Decrease" }, "\u2212"),
        h("div", { "class": "qty__val", "data-bind": "cart.qty" }, String(item.qty)),
        h("button", { "class": "qty__btn qty__btn--plus", "data-action": "cart.inc", "data-id": item.name, "aria-label": "Increase" }, "+")
      ]),
      h("div", { "class": "cart-row__total" }, money2(item.priceNum * item.qty)),
      h("button", { "class": "cart-remove", "data-action": "cart.removeItem", "data-id": item.name }, "Remove")
    ]);
  }

  // app-templates/customer-portal/runtime/src/components/commerce/AddressCard.js
  function AddressCard(a) {
    var sel = state.addrId === a.id;
    return h("div", { "class": "select-card" + (sel ? " select-card--active" : ""), "data-module": "address-card", "data-visual-id": "address-card", "data-action": "checkout.pickAddress", "data-id": a.id, "data-state": sel ? "selected" : void 0 }, [
      h("div", { "class": "select-card__icon", style: "background:" + a.iconBg }, h("i", { style: "background:" + a.dot })),
      h("div", { style: "flex:1" }, [
        h("div", { style: "font-weight:600;font-size:14px", "data-bind": "address.label" }, a.label),
        h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, a.line + " \xB7 " + a.city)
      ]),
      sel ? h("span", { "class": "select-card__check" }, "\u2713") : null
    ]);
  }

  // app-templates/customer-portal/runtime/src/components/commerce/PaymentMethodCard.js
  function PaymentCard(c) {
    var sel = state.payId === c.id;
    return h("div", { "class": "select-card" + (sel ? " select-card--active" : ""), "data-module": "payment-method-card", "data-visual-id": "payment-method-card", "data-action": "checkout.pickPayment", "data-id": c.id, "data-state": sel ? "selected" : void 0 }, [
      h("div", { "class": "card-chip" }),
      h("div", { style: "flex:1" }, [
        h("div", { style: "font-weight:600;font-size:14px", "data-bind": "card.brand,card.last4" }, c.brand + " \xB7\xB7\xB7\xB7 " + c.last4),
        h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, "Expires " + c.exp)
      ]),
      sel ? h("span", { "class": "select-card__check" }, "\u2713") : null
    ]);
  }

  // app-templates/customer-portal/runtime/src/routes/CheckoutPage.js
  function Checkout() {
    var fixture = currentFixture();
    var theme = currentTheme();
    var page = h("section", { "class": "page", "data-route": "checkout", "data-visual-id": "checkout" });
    page.appendChild(h("div", { "class": "section-head" }, [
      h("div", { "class": "section-head__title" }, "Checkout"),
      h("div", { "class": "section-head__sub" }, "Review your items, delivery and payment.")
    ]));
    var emptyCopy = theme.checkout || {};
    if (state.cartItems.length === 0 || state.view === "empty") {
      page.appendChild(h("div", { "class": "empty-cart", "data-module": "empty-state", "data-state": "empty", "data-visual-id": "empty-cart" }, [
        h("div", { "class": "empty-cart__glyph" }, "\u{1F6D2}"),
        h("div", { style: "font-weight:700;font-size:18px" }, emptyCopy.emptyCart || "Your cart is empty"),
        h("div", { style: "font-size:14px;color:var(--ink-2);margin:6px 0 20px" }, emptyCopy.emptyCartDescription || "Browse Calm Harbor ritual products and add them to your order."),
        ActionButton({ variant: "btn--primary", label: "Browse products", action: "nav.go", id: "products", lg: true, visualId: "browse-products" })
      ]));
      return page;
    }
    var subtotal = state.cartItems.reduce(function(a, x) {
      return a + x.priceNum * x.qty;
    }, 0);
    var tax = Math.round(subtotal * 0.0825);
    var grid = h("div", { "class": "checkout-grid" });
    var left = h("div", { style: "display:flex;flex-direction:column;gap:16px" });
    var cartCard = h("div", { "class": "cart-card", "data-module": "cart-list", "data-visual-id": "cart-list" }, [h("div", { "class": "panel__title", style: "font-size:16px;padding:14px 0 4px" }, "Your cart")]);
    state.cartItems.forEach(function(it) {
      cartCard.appendChild(CartRow(it));
    });
    left.appendChild(cartCard);
    var addrPanel = h("div", { "class": "checkout-panel" }, [
      h("div", { "class": "panel__title", style: "font-size:16px;margin-bottom:13px" }, "Delivery address"),
      h("div", { style: "display:flex;flex-direction:column;gap:10px" }, fixture.addresses.map(AddressCard))
    ]);
    left.appendChild(addrPanel);
    var payPanel = h("div", { "class": "checkout-panel" }, [
      h("div", { "class": "panel__title", style: "font-size:16px;margin-bottom:13px" }, "Payment"),
      h("div", { style: "display:flex;flex-direction:column;gap:10px" }, fixture.cards.map(PaymentCard))
    ]);
    left.appendChild(payPanel);
    var summary = h("div", { "class": "checkout-panel checkout-summary", "data-module": "checkout-summary", "data-visual-id": "checkout-summary" }, [
      h("div", { "class": "panel__title", style: "font-size:16px;margin-bottom:16px" }, "Order summary"),
      h("div", { "class": "summary-row" }, [h("span", null, "Subtotal"), h("b", null, money2(subtotal))]),
      h("div", { "class": "summary-row" }, [h("span", null, "Delivery"), h("b", { style: "color:var(--ok)" }, "Free")]),
      h("div", { "class": "summary-row" }, [h("span", null, "Est. tax"), h("b", null, money2(tax))]),
      h("div", { "class": "summary-total" }, [h("span", null, "Total"), h("span", null, money2(subtotal + tax))]),
      ActionButton({ variant: "btn--primary", label: "Place order", action: "checkout.placeOrder", block: true, lg: true, visualId: "place-order" }),
      h("div", { "class": "summary-note" }, theme.checkoutNote || "Orders are prepared by Calm Harbor and sent to your saved delivery address.")
    ]);
    grid.appendChild(left);
    grid.appendChild(summary);
    page.appendChild(grid);
    return page;
  }

  // app-templates/customer-portal/runtime/src/adapters/xweather-adapter.js
  var HOST = "https://data.api.xweather.com";
  function createXweatherAdapter(options2) {
    var clientId = options2 && options2.clientId || "";
    var clientSecret = options2 && options2.clientSecret || "";
    var fetchImpl = options2 && options2.fetch || (typeof fetch === "function" ? fetch : null);
    return {
      opened: function() {
        return !!(clientId && clientSecret && fetchImpl);
      },
      dailyForecast: function(lat, lon, days) {
        if (!this.opened()) return Promise.reject(new Error("Xweather adapter is not opened"));
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return Promise.reject(new Error("A forecast needs a finite coordinate"));
        var url = HOST + "/forecasts/" + encodeURIComponent(lat + "," + lon) + "?filter=day&limit=" + encodeURIComponent(String(days)) + "&client_id=" + encodeURIComponent(clientId) + "&client_secret=" + encodeURIComponent(clientSecret);
        return fetchImpl(url, { credentials: "omit", mode: "cors" }).then(function(response) {
          if (!response.ok) throw new Error("Xweather HTTP " + response.status);
          return response.json();
        }).then(function(payload) {
          if (!payload || payload.success !== true) {
            throw new Error("Xweather error: " + (payload && payload.error && payload.error.description || "unknown"));
          }
          var periods = payload.response && payload.response[0] && payload.response[0].periods;
          if (!Array.isArray(periods) || !periods.length) throw new Error("Xweather returned no forecast periods");
          return periods;
        });
      }
    };
  }

  // app-templates/customer-portal/runtime/src/live-weather.js
  var FRAME_COUNT = 7;
  function liveWeatherOpened(config) {
    return !!(config && config.weatherClientId && config.weatherClientSecret);
  }
  function weatherSource(config, fixtureWeather) {
    var geography = config && config.serviceGeography;
    if (geography) return { zoneCentroids: geography.zones, legend: WEATHER_LEGEND };
    if (config && config.dataMode === "live") return null;
    return fixtureWeather || null;
  }
  function loadLiveWeather(fixtureWeather, config, adapter) {
    if (!liveWeatherOpened(config)) return Promise.resolve(null);
    var source = weatherSource(config, fixtureWeather);
    var centroids = source && source.zoneCentroids || null;
    if (!centroids) return Promise.resolve(null);
    var zoneOrder = /* @__PURE__ */ Object.keys(centroids);
    if (!zoneOrder.length) return Promise.resolve(null);
    var client = adapter || createXweatherAdapter({
      clientId: config.weatherClientId,
      clientSecret: config.weatherClientSecret
    });
    if (!client.opened()) return Promise.resolve(null);
    state.liveWeatherState = "loading";
    return Promise.all(zoneOrder.map(function(zone) {
      return client.dailyForecast(centroids[zone].lat, centroids[zone].lon, FRAME_COUNT);
    })).then(function(results) {
      var zonePeriods = {};
      zoneOrder.forEach(function(zone, index) {
        zonePeriods[zone] = results[index];
      });
      var timeline = buildTimeline(zonePeriods, zoneOrder);
      state.liveWeather = {
        nowIndex: 0,
        legend: source.legend || WEATHER_LEGEND,
        zoneCentroids: centroids,
        timeline,
        source: "xweather"
      };
      state.liveWeatherState = "ready";
      return state.liveWeather;
    }).catch(function(error2) {
      state.liveWeather = null;
      state.liveWeatherState = "failed";
      console.warn("[portal] live weather unavailable, staying on fixture data", error2);
      return null;
    });
  }
  function createPropertyForecasts(options2) {
    var adapter = options2.adapter;
    var onChange = options2.onChange;
    var entries = /* @__PURE__ */ new Map();
    return {
      request: function(id, point) {
        if (entries.has(id)) return entries.get(id);
        if (!point || !adapter.opened()) return null;
        entries.set(id, { state: "loading", days: [] });
        adapter.dailyForecast(point.lat, point.lon, FRAME_COUNT).then(function(periods) {
          return { state: "ready", days: periods.map(forecastDay) };
        }).catch(function(error2) {
          console.warn("[portal] property forecast unavailable, showing the area forecast", error2 && error2.message);
          return { state: "failed", days: [] };
        }).then(function(entry) {
          entries.set(id, entry);
          onChange();
        });
        return entries.get(id);
      }
    };
  }

  // app-templates/customer-portal/runtime/src/components/shell/Destinations.js
  function SupportContactButton(props) {
    if (isSpa()) return ActionButton(Object.assign({ label: "Contact support", action: "support.email" }, props));
    if (!configuredExternalUrl(state.config, "supportUrl")) return null;
    return ActionButton(Object.assign({ label: "Contact support", action: "support.open" }, props));
  }
  function LandingReturnButton(props) {
    if (isSpa()) return ActionButton(Object.assign({ label: "Back to the catalog", action: "nav.landing" }, props));
    if (!configuredExternalUrl(state.config, "landingUrl")) return null;
    return ActionButton(Object.assign({ label: "Back to our website", action: "nav.landing" }, props));
  }
  function GateGlyph(glyph) {
    if (isSpa()) return h("div", { "class": "oidc-glyph" }, glyph);
    return h("div", { "class": "oidc-glyph", "data-tone": "neutral", style: "background:rgba(var(--accent-rgb),.12);color:var(--accent)" }, glyph);
  }

  // app-templates/customer-portal/runtime/src/components/primitives/RouteStates.js
  function UnauthorizedState(props) {
    props = props || {};
    return h("div", { "class": "state-block", "data-module": "unauthorized-state", "data-visual-id": "unauthorized-state", "data-state": "unauthorized" }, [
      h("div", { "class": "state-block__glyph" }, "\u26BF"),
      h("div", { "class": "state-block__title" }, "You don\u2019t have access to this page"),
      h("div", { "class": "state-block__desc" }, "Your account doesn\u2019t include access to " + (props.scope || "this area") + ". If that seems wrong, we can sort it out."),
      h("div", { style: "display:flex;gap:10px;justify-content:center;flex-wrap:wrap" }, [
        SupportContactButton({ variant: "btn--primary", visualId: "unauthorized-support" }),
        ActionButton({ variant: "btn--ghost", label: "Go back", action: "nav.go", id: props.backRoute || "orders.list", visualId: "unauthorized-back" })
      ])
    ]);
  }
  function NotFoundState(props) {
    props = props || {};
    return h("div", { "class": "state-block", "data-module": "not-found-state", "data-visual-id": "not-found-state", "data-state": "not-found" }, [
      h("div", { "class": "state-block__glyph" }, "\u2205"),
      h("div", { "class": "state-block__title" }, "We can\u2019t find that " + (props.noun || "page")),
      h("div", { "class": "state-block__desc" }, "It may have been removed or the link may be out of date. Everything you can open is on your " + (props.backLabel || "overview") + " page."),
      ActionButton({ variant: "btn--primary", label: "Back to " + (props.backLabel || "overview"), action: "nav.go", id: props.backRoute || "orders.list", visualId: "not-found-back" })
    ]);
  }
  function InlineFailure(props) {
    props = props || {};
    return h("div", { "class": "inline-fail", "data-module": "command-failure", "data-visual-id": "command-failure", "data-state": "failed", role: "alert" }, [
      h("span", { "class": "inline-fail__icon" }, "!"),
      h("div", { style: "flex:1;font-size:13px;line-height:1.45;min-width:0" }, props.msg || "That didn\u2019t go through \u2014 nothing was changed."),
      props.retryAction ? ActionButton({ variant: "btn--ghost", label: props.retryLabel || "Try again", action: props.retryAction, id: props.retryId, visualId: "command-retry" }) : null
    ]);
  }
  function skel(style) {
    return h("div", { "class": "skeleton", style });
  }

  // app-templates/customer-portal/runtime/src/components/storm/PropertyMap.js
  var SINGLE_PIN_ZOOM = 14;
  var FIT_PADDING = 56;
  var FOCUS_ACTIONS = ["overview.selectProperty", "overview.closeProperty", "overview.openProperty"];
  var PLACEMENT_NOTES = {
    locating: "Finding it on the map\u2026",
    "not-found": "Address not found on the map",
    "no-address": "No address on file"
  };
  var listScroll = {};
  function createPropertyMap(options2) {
    var adapter = options2.adapter;
    var cache = options2.cache;
    var dispatch = options2.dispatch;
    var onChange = options2.onChange;
    var mapId = options2.mapId || "";
    var status = "idle";
    var maps = null;
    var map = null;
    var layer = null;
    var canvas = null;
    var mount2 = null;
    var statusLabel = null;
    var pinsHost = null;
    var popupHost = null;
    var view = null;
    var fitted = null;
    var narrow = false;
    var located = /* @__PURE__ */ new Map();
    var failed = /* @__PURE__ */ new Set();
    var requested = /* @__PURE__ */ new Set();
    var queue = [];
    var geocoding = false;
    return {
      status: function() {
        return status;
      },
      docked: function() {
        return narrow;
      },
      placement,
      pointOf: function(property) {
        return placement(property).point;
      },
      stage
    };
    function stage(next) {
      if (!canvas) build();
      if (status === "idle") start(next.viewport);
      view = next;
      canvas.setAttribute("data-state", status);
      canvas.setAttribute("data-pins", String(next.pins.length));
      canvas.setAttribute("data-locating", next.locating ? "true" : "false");
      statusLabel.textContent = statusText(next);
      pinsHost.replaceChildren.apply(pinsHost, next.pins.map(function(pin) {
        return pin.element;
      }));
      popupHost.replaceChildren.apply(popupHost, next.popup && !narrow ? [next.popup.element] : []);
      draw();
      Promise.resolve().then(settle2);
      return canvas;
    }
    function statusText(next) {
      if (status !== "ready") return "Loading map\u2026";
      if (next.pins.length) return "";
      if (next.locating) return next.locatingText || "Finding your properties on the map\u2026";
      return "None of your properties could be placed on the map";
    }
    function settle2() {
      fit(view.pins);
      draw();
    }
    function build() {
      mount2 = h("div", { "class": "ov-map__google" });
      statusLabel = h("span", { "class": "ov-map__status-label" }, "Loading map\u2026");
      canvas = h("div", { "class": "ov-map__canvas", "data-surface": "google" }, [
        mount2,
        h("div", { "class": "ov-map__status", role: "status" }, [statusLabel])
      ]);
      pinsHost = h("div", { "class": "ov-map__pins" });
      popupHost = h("div", { "class": "ov-map__popup" });
      pinsHost.addEventListener("click", relay);
      popupHost.addEventListener("click", relay);
      new ResizeObserver(resized).observe(canvas);
    }
    function resized(entries) {
      var width = entries[entries.length - 1].contentRect.width;
      if (!width || popupDocks(width) === narrow) return;
      narrow = !narrow;
      if (view && view.popup) onChange();
    }
    function relay(event) {
      var host = event.currentTarget;
      var target = event.target && typeof event.target.closest === "function" ? event.target.closest("[data-action]") : null;
      if (!target || !host.contains(target)) return;
      event.stopPropagation();
      dispatch(target.getAttribute("data-action"), target.getAttribute("data-id"));
    }
    function start(viewport) {
      status = "loading";
      adapter.onFailure(fail2);
      adapter.load().then(function(loaded) {
        if (status === "failed") return;
        maps = loaded;
        map = new maps.Map(mount2, mapOptions(viewport, mapId));
        layer = pinLayer();
        layer.setMap(map);
        status = "ready";
        drain();
        onChange();
      }).catch(fail2);
    }
    function fail2(error2) {
      if (status === "failed") return;
      status = "failed";
      console.warn("[portal] Google map unavailable, listing the properties instead", error2 && error2.message);
      onChange();
    }
    function pinLayer() {
      var overlay = new maps.OverlayView();
      overlay.onAdd = function() {
        var panes = overlay.getPanes();
        panes.overlayMouseTarget.appendChild(pinsHost);
        panes.floatPane.appendChild(popupHost);
        if (typeof maps.OverlayView.preventMapHitsAndGesturesFrom === "function") {
          maps.OverlayView.preventMapHitsAndGesturesFrom(pinsHost);
          maps.OverlayView.preventMapHitsAndGesturesFrom(popupHost);
        }
      };
      overlay.draw = draw;
      overlay.onRemove = function() {
        pinsHost.remove();
        popupHost.remove();
      };
      return overlay;
    }
    function draw() {
      var projection = layer ? layer.getProjection() : null;
      if (!projection || !view) return;
      view.pins.forEach(function(pin) {
        var at = projection.fromLatLngToDivPixel(latLng(pin.point));
        if (!at) return;
        pin.element.style.left = at.x + "px";
        pin.element.style.top = at.y + "px";
      });
      if (view.popup && !narrow) placePopup(projection, view.popup);
    }
    function placePopup(projection, popup) {
      var anchor = latLng(popup.point);
      var at = projection.fromLatLngToDivPixel(anchor);
      var box = projection.fromLatLngToContainerPixel(anchor);
      if (!at || !box) return;
      var place = popupPlacement(
        box,
        { width: canvas.offsetWidth, height: canvas.offsetHeight },
        { width: popup.element.offsetWidth, height: popup.element.offsetHeight }
      );
      popup.element.style.left = at.x + place.left - box.x + "px";
      popup.element.style.top = at.y + place.top - box.y + "px";
      popup.element.setAttribute("data-place", place.side);
    }
    function fit(pins) {
      if (!map) return;
      var signature = pins.map(function(pin) {
        return pin.id + "@" + pin.point.lat + "," + pin.point.lon;
      }).join("|");
      if (signature === fitted) return;
      fitted = signature;
      if (!pins.length) return;
      if (pins.length === 1) {
        map.setCenter(latLng(pins[0].point));
        map.setZoom(SINGLE_PIN_ZOOM);
        return;
      }
      var bounds = new maps.LatLngBounds();
      pins.forEach(function(pin) {
        bounds.extend(latLng(pin.point));
      });
      map.fitBounds(bounds, FIT_PADDING);
    }
    function latLng(point) {
      return new maps.LatLng(point.lat, point.lon);
    }
    function placement(property) {
      var known = knownPlacement(property, null);
      if (known.reason !== "unplaced") return known;
      var key = addressKey(property.address);
      if (located.has(key)) return { point: located.get(key), reason: "located" };
      if (failed.has(key)) return { point: null, reason: "not-found" };
      if (requested.has(key)) return { point: null, reason: "locating" };
      var cached = cache.read(key);
      var point = cached ? geoPoint(cached.lat, cached.lon) : null;
      if (point) {
        located.set(key, point);
        return { point, reason: "located" };
      }
      requested.add(key);
      queue.push({ key, address: property.address });
      drain();
      return { point: null, reason: "locating" };
    }
    function drain() {
      if (geocoding || status !== "ready" || !queue.length) return;
      geocoding = true;
      var next = queue.shift();
      adapter.geocode(next.address).then(function(found) {
        var point = geoPoint(found.lat, found.lon);
        if (!point) throw new Error("Geocoder answered without a usable point");
        located.set(next.key, point);
        cache.write(next.key, point);
      }).catch(function(error2) {
        failed.add(next.key);
        console.warn("[portal] a property could not be placed on the map", error2 && error2.message);
      }).then(function() {
        geocoding = false;
        onChange();
        drain();
      });
    }
  }
  function knownPlacement(property, cache) {
    var direct = propertyPoint(property);
    if (direct) return { point: direct, reason: "stored" };
    var key = addressKey(property && property.address);
    if (!key) return { point: null, reason: "no-address" };
    var cached = cache ? cache.read(key) : null;
    var point = cached ? geoPoint(cached.lat, cached.lon) : null;
    return point ? { point, reason: "located" } : { point: null, reason: "unplaced" };
  }
  function PropertyStage(props) {
    var controller2 = props.map || null;
    var failed = !!controller2 && controller2.status() === "failed";
    var map = controller2 && props.viewport && !failed ? controller2 : null;
    var placed = [];
    var listed = [];
    props.properties.forEach(function(property) {
      var place = controller2 ? controller2.placement(property) : { point: propertyPoint(property), reason: null };
      var entry = { property, point: place.point, reason: map ? place.reason : null };
      if (map && entry.point) placed.push(entry);
      else listed.push(entry);
    });
    var chosen = props.direct ? null : placed.concat(listed).find(function(entry) {
      return entry.property.id === props.selectedId;
    }) || null;
    var popup = chosen ? PropertyPopup(chosen.property, props.frame ? popupView(chosen, props) : null, props.weather ? props.weather.legend : null, props.sources) : null;
    var pinned = !!chosen && placed.indexOf(chosen) !== -1;
    if (!map) {
      return h("div", { "class": "ov-map__stage", "data-surface": "list", "data-state": failed ? "failed" : void 0 }, [
        failed ? h("div", { "class": "ov-map__note", "data-module": "map-unavailable", "data-visual-id": "map-unavailable", role: "status" }, "The map couldn\u2019t load, so your properties are listed instead.") : null,
        PropertyList("all", listed, props, popup)
      ]);
    }
    var docked = pinned && map.docked();
    return h("div", { "class": "ov-map__stage", "data-surface": "google" }, [
      map.stage({
        viewport: props.viewport,
        pins: placed.map(function(entry) {
          return { id: entry.property.id, point: entry.point, element: PropertyPin(entry.property, props.frame, !!chosen && entry.property.id === props.selectedId, props.sources, props.direct) };
        }),
        popup: pinned ? { point: chosen.point, element: popup } : null,
        locating: listed.some(function(entry) {
          return entry.reason === "locating";
        })
      }),
      docked ? dock(popup) : null,
      listed.length ? UnplacedProperties(listed, props, pinned ? null : popup) : null
    ]);
  }
  function placeEach(map, properties) {
    return properties.map(function(property) {
      return property ? map.placement(property) : { point: null, reason: "unknown" };
    });
  }
  function placementNote(reason) {
    return Object.prototype.hasOwnProperty.call(PLACEMENT_NOTES, reason) ? PLACEMENT_NOTES[reason] : "";
  }
  function LocationMap(map, viewport, places, placements, locatingText) {
    var pins = [];
    places.forEach(function(place, index) {
      var point = placements[index].point;
      if (point) pins.push({ id: place.id, point, element: LocationPin(place) });
    });
    return map.stage({
      viewport,
      pins,
      popup: null,
      locating: placements.some(function(placement) {
        return placement.reason === "locating";
      }),
      locatingText
    });
  }
  function PropertyLocation(props) {
    var property = props.property;
    var controller2 = props.map || null;
    var map = controller2 && props.viewport && controller2.status() !== "failed" ? controller2 : null;
    var placement = map ? placeEach(map, [property])[0] : null;
    if (!placement || !placement.point && placement.reason !== "locating") return null;
    return h("section", {
      "class": "card ov-map",
      "data-module": "property-location",
      "data-visual-id": "property-location",
      "data-state": placement.point ? "placed" : "locating",
      "aria-labelledby": "property-location-title"
    }, [
      h("div", { "class": "ov-map__head" }, [
        h("span", { "class": "ov-card__icon" }, [icon("map", "ov-icon")]),
        h("h2", { "class": "ov-card__title", id: "property-location-title" }, "Location")
      ]),
      h("div", { "class": "ov-map__stage", "data-surface": "google" }, [
        LocationMap(map, props.viewport, [{ id: property.id, name: property.name }], [placement], "Finding it on the map\u2026")
      ]),
      placement.point && props.link ? h("button", { "class": "link-action", type: "button", "data-action": props.link.action, "data-id": props.link.id, "data-visual-id": "property-location-link", style: "margin-top:12px" }, props.link.label + " \u203A") : null
    ]);
  }
  function LocationPin(place) {
    var label = place.name + " on the map";
    var attributes = { "class": "ov-pin", "data-module": "location-pin", "data-visual-id": "location-pin", "data-id": place.id, "data-state": place.state || void 0, style: "color:" + (place.color || "var(--accent)") };
    if (!place.action) {
      return h("span", Object.assign(attributes, { role: "img", "aria-label": label, style: attributes.style + ";cursor:default" }), [icon("pin", "ov-pin__glyph")]);
    }
    return h("button", Object.assign(attributes, { type: "button", "data-action": place.action, "aria-label": place.actionLabel || label }), [icon("pin", "ov-pin__glyph")]);
  }
  function WeatherAttribution(source, className) {
    return text3("div", "ov-attr" + (className ? " " + className : ""), source === "xweather" ? "Weather \xB7 Xweather" : "Sample conditions");
  }
  function closeOnEscape(target, isOpen2, close) {
    target.addEventListener("keydown", function(event) {
      if (event.key !== "Escape" || event.defaultPrevented || !isOpen2()) return;
      close();
    });
  }
  function createFocusKeeper(doc) {
    var remembered = null;
    doc.addEventListener("focusin", function(event) {
      remembered = focusIdentity(event.target);
    }, true);
    doc.addEventListener("pointerdown", function(event) {
      remembered = focusIdentity(event.target);
    }, true);
    return {
      settle: function(selectedId, previousId) {
        var target = null;
        if (selectedId !== previousId) {
          target = selectedId ? doc.querySelector(".ov-tip__close") : actionElement(doc, "overview.selectProperty", previousId);
        } else if (remembered && (!doc.activeElement || doc.activeElement === doc.body)) {
          target = actionElement(doc, remembered.action, remembered.id);
        }
        if (!target) return;
        var tip = selectedId ? target.closest(".ov-tip") : null;
        var place = tip ? tip.getAttribute("data-place") : null;
        if (place === "inline" || place === "dock") tip.scrollIntoView({ block: "nearest" });
        target.focus({ preventScroll: true });
        remembered = focusIdentity(target);
      }
    };
  }
  function focusIdentity(element) {
    var target = element && typeof element.closest === "function" ? element.closest("[data-action]") : null;
    var action = target ? target.getAttribute("data-action") : null;
    return FOCUS_ACTIONS.indexOf(action) === -1 ? null : { action, id: target.getAttribute("data-id") };
  }
  function actionElement(root, action, id) {
    var candidates = root.querySelectorAll('[data-action="' + action + '"]');
    for (var index = 0; index < candidates.length; index += 1) {
      if (candidates[index].getAttribute("data-id") === id) return candidates[index];
    }
    return null;
  }
  function mapOptions(viewport, mapId) {
    var settings = {
      center: { lat: viewport.center.lat, lng: viewport.center.lon },
      zoom: viewport.zoom,
      disableDefaultUI: true,
      zoomControl: true,
      clickableIcons: false,
      gestureHandling: "cooperative"
    };
    if (mapId) settings.mapId = mapId;
    return settings;
  }
  function popupView(entry, props) {
    var property = entry.property;
    var live = props.weather.source === "xweather" && entry.point && props.forecasts;
    var forecast = live ? props.forecasts.request(property.id, forecastPoint(entry.point)) : null;
    return popupWeather(props.frame, zoneWeather(property, props.frame), props.weather.source, forecast, props.index, props.sources);
  }
  function weatherKey(property, frame, status) {
    if (status) return propertyWeather(property, frame);
    return frame ? zoneWeather(property, frame) : void 0;
  }
  function PropertyPin(property, frame, selected, sources, direct) {
    var status = knownPropertyStatus(property, sources);
    return h("button", {
      "class": "ov-pin" + (status === "enroute" ? " ov-pin--active" : "") + (selected ? " ov-pin--on" : ""),
      "data-action": direct ? "overview.openProperty" : "overview.selectProperty",
      "data-id": property.id,
      "data-module": "property-pin",
      "data-visual-id": "property-pin",
      "data-state": status || void 0,
      "data-weather": weatherKey(property, frame, status),
      "aria-label": status ? property.name + " \u2014 " + OVERVIEW_STATUS[status].label : property.name,
      "aria-pressed": direct ? void 0 : selected ? "true" : "false"
    }, [icon("pin", "ov-pin__glyph")]);
  }
  function PropertyList(key, entries, props, popup) {
    if (!entries.length) {
      return h("div", { "class": "ov-empty", "data-state": "empty" }, [
        text3("div", "ov-empty__title", "No properties yet"),
        sourceOpened(props.sources, "contracts") ? text3("div", "ov-empty__desc", "A property appears here once it is under contract.") : null
      ]);
    }
    var list = h(
      "ul",
      { "class": "ov-plist", "data-module": "property-list", "data-visual-id": "property-list", "aria-label": "Your properties" },
      entries.map(function(entry) {
        var selected = !props.direct && entry.property.id === props.selectedId;
        return h("li", { "class": "ov-plist__item" }, [
          PropertyRow(entry.property, props, selected, entry.reason),
          selected && popup ? inline(popup) : null
        ]);
      })
    );
    list.addEventListener("scroll", function() {
      listScroll[key] = list.scrollTop;
    });
    Promise.resolve().then(function() {
      list.scrollTop = listScroll[key] || 0;
    });
    return list;
  }
  function UnplacedProperties(entries, props, popup) {
    return h("div", { "class": "ov-map__unplaced", "data-module": "unplaced-properties", "data-visual-id": "unplaced-properties" }, [
      h("div", { "class": "ov-map__unplaced-head" }, [
        text3("span", "ov-map__unplaced-title", "Not on the map"),
        text3("span", "ov-map__unplaced-count", String(entries.length))
      ]),
      PropertyList("unplaced", entries, props, popup)
    ]);
  }
  function PropertyRow(property, props, selected, reason) {
    var status = knownPropertyStatus(property, props.sources);
    var note = reason ? placementNote(reason) : "";
    var line = propertyLine(property);
    return h("button", {
      "class": "ov-prow" + (status === "enroute" ? " ov-prow--active" : "") + (selected ? " ov-prow--on" : ""),
      "data-action": props.direct ? "overview.openProperty" : "overview.selectProperty",
      "data-id": property.id,
      "data-module": "property-row",
      "data-visual-id": "property-row",
      "data-state": status || void 0,
      "data-weather": weatherKey(property, props.frame, status),
      "data-placement": note ? reason : void 0,
      "aria-expanded": props.direct ? void 0 : selected ? "true" : "false"
    }, [
      h("span", { "class": "ov-prow__pin" }, [icon("pin", "ov-prow__glyph")]),
      h("span", { "class": "ov-prow__read" }, [
        text3("span", "ov-prow__name", property.name),
        line ? text3("span", "ov-prow__addr", line) : null,
        note ? text3("span", "ov-prow__why", note) : null
      ]),
      h("span", { "class": "ov-prow__meta" }, [
        props.frame ? text3("span", "ov-prow__wx", weatherReading(zoneWeather(property, props.frame), props.frame, props.weather.legend)) : null,
        status ? text3("span", "ov-tip__tag ov-tip__tag--" + status, OVERVIEW_STATUS[status].label) : null
      ])
    ]);
  }
  function propertyLine(property) {
    var address = property.address && !addressRepeats(property.name, property.address) ? property.address : "";
    return [address].concat(propertyHighlights(property)).filter(Boolean).join(" \xB7 ");
  }
  function PropertyPopup(property, weather, legend, sources) {
    var status = knownPropertyStatus(property, sources);
    var line = sourceOpened(sources, "appointments") ? visitLine(property) : "";
    return h("div", { "class": "ov-tip", "data-module": "property-tooltip", "data-visual-id": "property-tooltip", "data-state": status || void 0, role: "dialog", "aria-label": property.name }, [
      h("div", { "class": "ov-tip__head" }, [
        h("div", { style: "flex:1;min-width:0" }, [
          text3("div", "ov-tip__name", property.name),
          property.address && !addressRepeats(property.name, property.address) ? text3("div", "ov-tip__addr", property.address) : null
        ]),
        h("button", { "class": "ov-tip__close", "data-action": "overview.closeProperty", "aria-label": "Close" }, "\u2715")
      ]),
      status ? h("div", { "class": "ov-tip__tags" }, [
        text3("span", "ov-tip__tag ov-tip__tag--" + status, OVERVIEW_STATUS[status].label)
      ]) : null,
      line ? text3("div", "ov-tip__line", line) : null,
      weather ? PopupWeather(weather, legend) : null,
      h("button", { "class": "link-action ov-tip__link", "data-action": "overview.openProperty", "data-id": property.id, "data-visual-id": "property-details" }, "Go to Property \u203A")
    ]);
  }
  function PopupWeather(view, legend) {
    var own2 = view.state === "property" || view.state === "loading";
    var reading = view.state === "loading" ? "Loading forecast\u2026" : (view.phrase || weatherLabel(view.kind, legend)) + " \xB7 " + view.temp;
    var note = view.state === "failed" ? "This property\u2019s own forecast is unavailable right now." : view.note;
    return h("div", {
      "class": "ov-tip__wx",
      "data-module": "property-weather",
      "data-visual-id": "property-weather",
      "data-state": view.state,
      "data-weather": view.kind,
      "data-source": view.source,
      "aria-live": "polite",
      "aria-busy": view.state === "loading" ? "true" : void 0
    }, [
      text3("div", "ov-tip__wx-scope", (own2 ? "This property" : "Area forecast") + " \xB7 " + view.day),
      h("div", { "class": "ov-tip__wx-read" }, [h("i"), text3("span", "", reading)]),
      note ? text3("div", "ov-tip__wx-note", note) : null,
      view.state === "loading" ? h("div", { "class": "ov-tip__wx-note", "aria-hidden": "true" }, "\xA0") : null
    ]);
  }
  function visitLine(property) {
    var appointment = property.appointment;
    var active = appointment && appointment.state === "IN_PROGRESS" ? appointment : null;
    var next = appointment && appointment.state === "SCHEDULED" ? appointment : null;
    return active ? active.service + " \xB7 " + active.when : next ? next.service + " \xB7 " + next.when : property.lastService ? "Last service \xB7 " + property.lastService.service + " \xB7 " + property.lastService.when : "";
  }
  function inline(popup) {
    popup.setAttribute("data-place", "inline");
    return popup;
  }
  function dock(popup) {
    popup.setAttribute("data-place", "dock");
    return popup;
  }
  function text3(tag, className, value) {
    return h(tag, className ? { "class": className } : null, value == null ? "" : String(value));
  }

  // app-templates/customer-portal/runtime/src/components/proposals/QuotePackage.js
  var QUOTE_STATUS = /* @__PURE__ */ Object.freeze({
    approved: /* @__PURE__ */ Object.freeze({ label: "\u2713 Approved", badge: "status-badge--ok", dot: "#34c759" }),
    revision: /* @__PURE__ */ Object.freeze({ label: "\u27F3 Revision pending", badge: "status-badge--warn", dot: "#ff9f0a" }),
    declined: /* @__PURE__ */ Object.freeze({ label: "\u2715 Declined", badge: "status-badge--danger", dot: "#ff3b30" }),
    unseen: /* @__PURE__ */ Object.freeze({ label: "\u25D4 Unseen", badge: "status-badge--scheduled", dot: "#8a94a6" }),
    viewed: /* @__PURE__ */ Object.freeze({ label: "\u2022 Reviewing", badge: "status-badge--scheduled", dot: "#8a94a6" })
  });
  var DECISION_META = { approved: "approved", declined: "declined", revision: "revision", open: "unseen" };
  var DECISION_LABEL = {
    approved: "Option approved",
    declined: "Declined",
    revision: "Changes requested",
    open: "Awaiting your decision"
  };
  function ContractsHead(quotes) {
    var counts = quotes.counts;
    var deciding = quotes.deciding && counts.properties > 0;
    return h("div", { "class": "proposals-head", "data-module": "quote-package-head", "data-visual-id": "quote-package-head", "data-state": deciding ? "deciding" : "settled" }, [
      h("div", { "class": "proposals-head__read" }, [
        h("div", { "class": "proposals-head__title-row" }, [
          h("h1", { "class": "proposals-head__title" }, quotes.pending.length && !quotes.agreements.length ? "Your quotes" : "Your contracts")
        ])
      ]),
      deciding ? h("span", { "class": "proposals-head__pill" }, counts.decided + " of " + plural(counts.properties, "property", "properties") + " decided") : null
    ]);
  }
  function ContractsSectionTitle(label, count) {
    return h("h2", { "class": "contracts-section__title" }, [label, count ? h("span", { "class": "contracts-section__count" }, String(count)) : null]);
  }
  function AgreementList(rows2) {
    return h("div", { "class": "site-list agreement-list", "data-module": "agreement-list", "data-visual-id": "agreement-list" }, rows2.map(function(row) {
      var agreement = row.agreement;
      var summary = agreementSummary(row);
      return h("button", {
        "class": "proposal-card agreement-row",
        "data-module": "agreement-row",
        "data-visual-id": "agreement-row",
        "data-action": "agreement.open",
        "data-id": row.id,
        "data-state": agreement.stage,
        "aria-label": "Open the service agreement " + agreementTitle(row) + " \u2014 " + agreement.label
      }, [
        h("span", { "class": "proposal-card__body" }, [
          h("span", { "class": "proposal-card__name" }, agreementTitle(row)),
          summary ? h("span", { "class": "proposal-card__meta" }, summary) : null
        ]),
        StatusBadge({ variant: "status-badge--" + agreement.tone, label: agreement.label, bind: "agreement.stateLabel", state: agreement.stage }),
        h("span", { "class": "proposal-card__chev", "aria-hidden": "true" }, "\u203A")
      ]);
    }));
  }
  function agreementTitle(row) {
    var names = row.propertyNames;
    if (!names.length) return "Service agreement";
    if (names.length === 1) return names[0];
    if (names.length === 2) return names[0] + " and " + names[1];
    return names[0] + " and " + (names.length - 1) + " more";
  }
  function agreementSummary(row) {
    var agreement = row.agreement;
    var chosen = chosenOrders(row);
    var facts2 = [];
    if (chosen.length === 1) facts2.push(optionSummary(chosen[0]));
    else if (chosen.length > 1) facts2.push(plural(chosen.length, "option", "options") + " approved");
    else if (agreement.stage === "review" && row.quoteCount) {
      facts2.push(plural(row.quoteCount, "quote", "quotes") + (row.propertyCount ? " for " + plural(row.propertyCount, "property", "properties") : ""));
    }
    var season = agreementSeason(agreement);
    if (season) facts2.push(season);
    else if (agreement.effectiveDate) facts2.push("Effective " + formatIsoDate(agreement.effectiveDate));
    return facts2.filter(Boolean).join(" \xB7 ");
  }
  function agreementSeason(agreement) {
    return agreement && agreement.term ? "Season " + formatDatePeriod(agreement.term) : "";
  }
  function QuotesPreparing() {
    return h("div", { "class": "state-block", "data-module": "quote-preparing", "data-visual-id": "quote-preparing", "data-state": "preparing", role: "status" }, [
      h("div", { "class": "state-block__glyph quote-preparing__glyph" }, "\u25D4"),
      h("div", { "class": "state-block__title" }, "We have your request"),
      h("div", { "class": "state-block__desc" }, "We\u2019re preparing your quote. It appears here as soon as we send it to you.")
    ]);
  }
  function QuotesPreparingNotice() {
    return h("div", { "class": "alert-banner alert-banner--info quote-preparing", "data-module": "quote-preparing", "data-visual-id": "quote-preparing", "data-state": "preparing", role: "status" }, [
      h("div", { "class": "alert-banner__icon quote-preparing__glyph" }, "\u25D4"),
      h("div", { "class": "alert-banner__body" }, [
        h("div", { "class": "alert-banner__title" }, "We\u2019re still preparing part of your request"),
        h("div", { "class": "alert-banner__desc" }, "Anything we send you appears in this list.")
      ])
    ]);
  }
  function PortfolioSchematic(groups, placements) {
    var positions = schematicPositions(placements.map(function(placement) {
      return placement.point;
    }));
    var placed = positions.filter(Boolean).length;
    if (!placed) return null;
    var mappable = groups.filter(function(group) {
      return !!group.propertyBackendId;
    }).length;
    var canvas = h("div", { "class": "portfolio-map__canvas" }, [
      h("span", { "class": "portfolio-map__label" }, "portfolio map" + (placed < mappable ? " \xB7 " + placed + " of " + plural(mappable, "property", "properties") + " on the map" : ""))
    ]);
    groups.forEach(function(group, index) {
      var position = positions[index];
      if (!position) return;
      canvas.appendChild(h("div", { "class": "map-pin-wrap", style: "left:" + position.x + "%;top:" + position.y + "%", "data-state": group.decision }, [
        h("div", { "class": "map-pin-diamond", style: "background:" + QUOTE_STATUS[DECISION_META[group.decision]].dot }),
        h("div", { "class": "map-pin-label" }, group.title)
      ]));
    });
    return h("div", { "class": "portfolio-map", "data-module": "portfolio-map", "data-visual-id": "portfolio-map", "data-surface": "schematic" }, canvas);
  }
  function PortfolioMap(groups, placements, map, viewport) {
    if (!groups.some(function(group) {
      return !!group.property;
    })) return null;
    var places = groups.map(function(group) {
      return { id: group.id, name: group.title, state: group.decision, color: QUOTE_STATUS[DECISION_META[group.decision]].dot, action: "proposal.open", actionLabel: group.title + " \u2014 " + DECISION_LABEL[group.decision] };
    });
    return h("div", { "class": "ov-map__stage", "data-module": "portfolio-map", "data-visual-id": "portfolio-map", "data-surface": "google", style: "margin-bottom:16px" }, [
      LocationMap(map, viewport, places, placements, "Finding these properties on the map\u2026")
    ]);
  }
  function QuoteGroups(groups, placements, mapShown) {
    return h("div", { "class": "site-list", "data-module": "proposal-list", "data-visual-id": "proposal-list" }, groups.map(function(group, index) {
      var offMap = mapShown && !!group.propertyBackendId && !placements[index].point;
      var summary = [group.address, plural(group.orders.length, "quote", "quotes")].filter(Boolean).join(" \xB7 ");
      var head = [
        h("span", { "class": "proposal-card__diamond", style: "background:" + QUOTE_STATUS[DECISION_META[group.decision]].dot }),
        h("span", { "class": "proposal-card__body" }, [
          h("span", { "class": "proposal-card__name" }, group.title),
          h("span", { "class": "proposal-card__meta" }, summary),
          offMap ? h("span", { "class": "proposal-card__tag", "data-placement": placements[index].reason }, placementNote(placements[index].reason) || "Not on the map") : null
        ]),
        h("span", { "class": "proposal-group__decision", "data-state": group.decision }, DECISION_LABEL[group.decision]),
        h("span", { "class": "proposal-card__chev", "aria-hidden": "true" }, "\u203A")
      ];
      return h("section", { "class": "proposal-group", "data-module": "quote-property", "data-visual-id": "quote-property", "data-state": group.decision }, [
        h("button", { "class": "proposal-card proposal-group__head", "data-action": "proposal.open", "data-id": group.id, "aria-label": "Open the quotes for " + group.title }, head),
        h("ul", { "class": "proposal-options", "aria-label": "Quotes for " + group.title }, group.orders.map(QuoteOption))
      ]);
    }));
  }
  function QuotesFooter() {
    return h("div", { "class": "proposal-footer", "data-module": "quote-package-footer", "data-visual-id": "quote-package-footer" }, [
      h("div", { "class": "proposal-footer__icon" }, "\u2726"),
      h("div", { "class": "proposal-footer__copy" }, "Decide each property on its own. Approving one option for a property declines its other options. Once every property has a decision, we\u2019ll ask for your contract details and prepare your service agreement.")
    ]);
  }
  function QuoteOption(order) {
    var meta = QUOTE_STATUS[order.status];
    var total = formatOrderPrice(order);
    return h("li", { "class": "proposal-option", "data-module": "quote-row", "data-visual-id": "quote-row", "data-state": order.status }, [
      h("span", { "class": "proposal-option__model" }, order.pricingModel ? order.pricingModel.label : "Quote"),
      total ? h("span", { "class": "proposal-option__total" }, total) : null,
      StatusBadge({ variant: meta.badge, label: meta.label, bind: "quote.statusLabel", state: order.status })
    ]);
  }
  function plural(count, one, many) {
    return count + " " + (count === 1 ? one : many);
  }

  // app-templates/customer-portal/runtime/src/adapters/google-maps-adapter.js
  var SCRIPT_URL = "https://maps.googleapis.com/maps/api/js";
  var LIBRARIES = ["core", "maps", "geocoding"];
  var READY_CALLBACK = "__portalGoogleMapsReady";
  var GEOCODE_PREFIX = "portal.geocode:";
  var SUGGESTION_LIMIT = 5;
  var SUGGESTION_TYPES = ["street_address", "premise", "subpremise", "route"];
  function createGoogleMapsAdapter(options2) {
    var apiKey = options2 && options2.apiKey || "";
    var scope = options2 && options2.scope || globalThis;
    var failureListeners = [];
    var loading = null;
    var maps = null;
    function fail2(error2) {
      failureListeners.slice().forEach(function(listener) {
        listener(error2);
      });
    }
    return {
      opened: function() {
        return !!apiKey;
      },
      onFailure: function(listener) {
        failureListeners.push(listener);
      },
      load: function() {
        if (loading) return loading;
        if (!apiKey) {
          loading = Promise.reject(new Error("Google Maps adapter is not opened"));
          return loading;
        }
        loading = scriptNamespace(scope, apiKey, fail2).then(function(namespace) {
          return importLibraries(namespace, scope);
        }).then(function(loaded) {
          maps = loaded;
          return loaded;
        });
        return loading;
      },
      suggestAddresses: function(query) {
        return this.load().then(function(loaded) {
          return typeof loaded.importLibrary === "function" ? loaded.importLibrary("places") : loaded.places;
        }).then(function(places) {
          var finder = places && places.AutocompleteSuggestion;
          if (!finder || typeof finder.fetchAutocompleteSuggestions !== "function") return [];
          return Promise.resolve(finder.fetchAutocompleteSuggestions({ input: query, includedPrimaryTypes: SUGGESTION_TYPES })).then(function(response) {
            return (response && response.suggestions || []).map(function(suggestion) {
              var prediction = suggestion && suggestion.placePrediction;
              var label = prediction && prediction.text ? String(prediction.text) : "";
              return { label, address: function() {
                return formattedAddress(prediction, label);
              } };
            }).filter(function(item) {
              return item.label;
            }).slice(0, SUGGESTION_LIMIT);
          });
        });
      },
      geocode: function(address) {
        if (!maps || typeof maps.Geocoder !== "function") return Promise.reject(new Error("Google Maps is not loaded"));
        return new Promise(function(resolve, reject) {
          new maps.Geocoder().geocode({ address }, function(results, status) {
            var location = status === "OK" && results && results[0] && results[0].geometry && results[0].geometry.location;
            if (!location || typeof location.lat !== "function" || typeof location.lng !== "function") {
              reject(new Error("Geocoder answered " + status));
              return;
            }
            resolve({ lat: location.lat(), lon: location.lng() });
          });
        });
      }
    };
  }
  function createGeocodeCache(storage) {
    return {
      read: function(key) {
        if (!key || !storage) return null;
        try {
          var raw = storage.getItem(GEOCODE_PREFIX + key);
          return raw ? JSON.parse(raw) : null;
        } catch (_) {
          return null;
        }
      },
      write: function(key, point) {
        if (!key || !point || !storage) return false;
        try {
          storage.setItem(GEOCODE_PREFIX + key, JSON.stringify({ lat: point.lat, lon: point.lon }));
          return true;
        } catch (_) {
          return false;
        }
      }
    };
  }
  function browserStorage() {
    try {
      return globalThis.localStorage || null;
    } catch (_) {
      return null;
    }
  }
  function formattedAddress(prediction, label) {
    var place = prediction && typeof prediction.toPlace === "function" ? prediction.toPlace() : null;
    if (!place || typeof place.fetchFields !== "function") return Promise.resolve(label);
    return Promise.resolve(place.fetchFields({ fields: ["formattedAddress"] })).then(function() {
      return String(place.formattedAddress || label);
    }, function() {
      return label;
    });
  }
  function scriptNamespace(scope, apiKey, fail2) {
    var present = scope.google && scope.google.maps;
    if (present && (typeof present.importLibrary === "function" || typeof present.Map === "function")) {
      return Promise.resolve(present);
    }
    return new Promise(function(resolve, reject) {
      var settled2 = false;
      function ready() {
        var loaded = scope.google && scope.google.maps;
        if (settled2 || !loaded || typeof loaded.importLibrary !== "function" && typeof loaded.Map !== "function") return false;
        settled2 = true;
        resolve(loaded);
        return true;
      }
      var previous = scope.gm_authFailure;
      scope.gm_authFailure = function() {
        var error2 = new Error("Google Maps rejected the browser key");
        settled2 = true;
        reject(error2);
        fail2(error2);
        if (typeof previous === "function") previous();
      };
      scope[READY_CALLBACK] = ready;
      var script = scope.document.createElement("script");
      script.async = true;
      script.src = SCRIPT_URL + "?key=" + encodeURIComponent(apiKey) + "&loading=async&v=weekly&callback=" + READY_CALLBACK;
      script.addEventListener("error", function() {
        settled2 = true;
        reject(new Error("The Google Maps script did not load"));
      });
      script.addEventListener("load", function() {
        if (ready()) return;
        if (!(scope.google && scope.google.maps)) {
          settled2 = true;
          reject(new Error("The Google Maps script loaded without google.maps"));
        }
      });
      scope.document.head.appendChild(script);
    });
  }
  function importLibraries(maps, scope) {
    if (typeof maps.importLibrary !== "function") return maps;
    return Promise.all(LIBRARIES.map(function(name) {
      return maps.importLibrary(name);
    })).then(function(libraries) {
      var current = scope && scope.google && scope.google.maps || maps;
      if (typeof current.Map === "function") return current;
      return libraries.reduce(function(merged, library) {
        return Object.assign(merged, library);
      }, Object.assign({}, current));
    });
  }

  // app-templates/customer-portal/runtime/src/property-map-session.js
  var controller = null;
  function sharedPropertyMap() {
    if (!state.config.mapsApiKey) return null;
    if (!controller) {
      controller = createPropertyMap({
        adapter: createGoogleMapsAdapter({ apiKey: state.config.mapsApiKey }),
        cache: createGeocodeCache(browserStorage()),
        mapId: state.config.mapsMapId,
        dispatch: dispatchMapAction,
        onChange: render
      });
    }
    return controller;
  }
  function mapViewport() {
    var model = currentOverview();
    if (model && model.map) return model.map;
    var geography = state.config.serviceGeography;
    return geography && geography.map || null;
  }
  function usablePropertyMap() {
    var map = sharedPropertyMap();
    return map && mapViewport() && map.status() !== "failed" ? map : null;
  }
  function dispatchMapAction(name, id) {
    var action = ACTIONS[name];
    if (action) action(id);
  }

  // app-templates/customer-portal/runtime/src/components/storm/RecordRows.js
  function VisitRow(visit, options2) {
    var settings = options2 || {};
    var when = visitWhen(visit, settings.today);
    return h("button", {
      "class": "prop-visit record-row",
      type: "button",
      "data-module": "visit-row",
      "data-visual-id": "visit-row",
      "data-action": "appointments.openVisit",
      "data-id": visit.id,
      "data-state": visit.stateCode.toLowerCase(),
      "aria-label": [settings.label, visitDay(visit, settings.today), visit.status.label].filter(Boolean).join(" \xB7 ")
    }, [
      h("span", { "class": "record-row__main" }, [
        settings.label ? text4("record-row__eyebrow", settings.label) : null,
        text4("prop-visit__title", when),
        settings.place ? text4("prop-visit__meta", settings.place) : null
      ]),
      text4("status-badge status-badge--" + visit.status.tone, visit.status.label),
      text4("prop-visit__caret", "\u203A")
    ]);
  }
  function InvoiceRow(invoice) {
    var title = invoiceTitle(invoice);
    var amount = invoiceAmount(invoice);
    var status = invoiceStatusLine(invoice);
    return h("button", {
      "class": "prop-visit record-row",
      type: "button",
      "data-module": "invoice-row",
      "data-visual-id": "invoice-row",
      "data-action": "invoice.open",
      "data-id": invoice.id,
      "data-state": invoice.stateCode.toLowerCase(),
      "aria-label": [title, amount, status].filter(Boolean).join(" \xB7 ")
    }, [
      h("span", { "class": "record-row__main" }, [
        text4("prop-visit__title", title),
        amount ? text4("prop-visit__meta record-row__amount", amount) : null
      ]),
      text4("status-badge status-badge--" + invoice.status.tone, status),
      text4("prop-visit__caret", "\u203A")
    ]);
  }
  function RecordSection(id, title, rows2) {
    return h("section", { "class": "card card--pad record-section", "data-module": id, "data-visual-id": id }, [
      title ? h("h2", { "class": "prop-section__title" }, title) : null,
      h("div", { "class": "record-list" }, rows2)
    ]);
  }
  function text4(className, value) {
    return h("span", { "class": className }, value == null ? "" : String(value));
  }

  // app-templates/customer-portal/runtime/src/routes/OverviewPage.js
  var propertyForecastStore = null;
  var focusKeeper = null;
  var lastSelection = null;
  function overviewModel() {
    return currentOverview();
  }
  function Overview() {
    var model = overviewModel();
    var page = h("section", { "class": "page", "data-route": "overview", "data-visual-id": "overview" });
    var customer = overviewCustomer();
    var header = PageHeader({ title: customer.greeting, sub: subline(model, customer) });
    if (!model) {
      page.appendChild(header);
      page.appendChild(OverviewUnavailable());
      return page;
    }
    var weather = model.weather;
    var index = weather ? clampFrameIndex(weather.timeline, state.ovWeatherIndex == null ? weather.nowIndex : state.ovWeatherIndex) : 0;
    var frame = weather ? weather.timeline[index] : null;
    var forecastShown = !!frame || !!model.forecast && model.forecast !== "unconfigured";
    page.appendChild(h("div", { "class": "ov-head" }, [header, frame ? WeatherPanel(frame, index === weather.nowIndex, weather.source, sectionAvailable(model, "contracts")) : forecastShown ? ForecastUnavailable(model.forecast) : null]));
    page.appendChild(MapPanel(model, frame, index));
    var invoices = InvoicesWidget(model);
    if (invoices) page.appendChild(invoices);
    var cards = [NextVisitWidget(), InvoiceDueWidget(), UpcomingWidget(model, weather ? weather.timeline : []), ContractsWidget(model), SupportWidget(model)].filter(Boolean);
    if (cards.length) page.appendChild(h("div", { "class": "ov-grid", "data-count": String(cards.length) }, cards));
    if (model.banner) page.appendChild(Banner(model.banner));
    return page;
  }
  function overviewCustomer() {
    if (state.config.dataMode !== "live") return currentFixture().customer;
    var profile = state.moduleData.profile;
    var contact = profile && profile.contact;
    var name = contact && contact.firstName || profile && profile.accountName || "";
    return { greeting: name ? "Welcome back, " + name : "Welcome back", subline: "" };
  }
  function OverviewUnavailable() {
    if (state.config.dataMode !== "live") {
      return EmptyState({ glyph: "\u25CC", title: "Nothing to show yet", desc: "This portal has no overview data configured." });
    }
    var status = liveOverviewStatus();
    if (status === "loading") {
      return h("div", { "data-module": "overview-loading", "data-visual-id": "overview-loading", "data-state": "loading", "aria-busy": "true", style: "margin-top:20px" }, [
        skel("height:420px;border-radius:22px;margin-bottom:16px"),
        h("div", { "class": "ov-grid" }, [skel("height:170px;border-radius:22px"), skel("height:170px;border-radius:22px"), skel("height:170px;border-radius:22px")])
      ]);
    }
    if (status === "error") {
      return ErrorState({ title: "Couldn\u2019t load your home screen", desc: "Your properties didn\u2019t load. Nothing was changed \u2014 try again." });
    }
    if (status === "unauthorized") {
      return EmptyState({
        glyph: "\u26BF",
        title: "You don\u2019t have access to these properties",
        desc: "Your account doesn\u2019t include the properties on this portal. If that seems wrong, contact us.",
        action: supportAction()
      });
    }
    return EmptyState({ glyph: "\u25CC", title: "Your home screen isn\u2019t set up yet", desc: "This portal doesn\u2019t list your properties yet, so there is nothing to show here." });
  }
  function supportAction() {
    if (isModuleEnabled("support")) return { variant: "btn--ghost", label: "Go to support", action: "nav.go", id: "support", visualId: "overview-support" };
    if (configuredExternalUrl(state.config, "supportUrl")) return { variant: "btn--ghost", label: "Contact support", action: "support.open", visualId: "overview-support" };
    return null;
  }
  function subline(model, customer) {
    var frame = model && model.weather && state.liveWeather ? model.weather.timeline[model.weather.nowIndex] || model.weather.timeline[0] : null;
    if (state.config.dataMode === "live") return [frame ? frame.label : "", activeSeason()].filter(Boolean).join(" \xB7 ");
    if (!frame) return customer.subline || propertyCount(model);
    return frame.label + " \xB7 " + propertyCount(model);
  }
  function activeSeason() {
    if (!isModuleEnabled("proposals")) return "";
    var row = currentServiceAgreement(quotePackage());
    return row ? agreementSeason(row.agreement) : "";
  }
  function propertyCount(model) {
    if (!model) return "";
    var count = model.properties.length;
    var contracted = sectionAvailable(model, "contracts") && count > 0 && model.properties.every(function(property) {
      return !!property.contract;
    });
    return count + (count === 1 ? " property" : " properties") + (contracted ? " under contract" : "");
  }
  function ForecastUnavailable(forecast) {
    var loading = forecast === "loading";
    var failed = forecast === "failed";
    return h("div", {
      "class": "ov-wx",
      "data-module": "weather-summary",
      "data-visual-id": "weather-summary",
      "data-state": loading ? "loading" : failed ? "error" : "unavailable",
      "aria-busy": loading ? "true" : void 0,
      "aria-live": "polite"
    }, [
      h("span", { "class": "ov-wx__mark", style: "background:rgba(var(--hair),.08);color:var(--ink-3)" }, [icon("snowflake", "ov-wx__glyph")]),
      h("div", { "class": "ov-wx__read" }, loading ? [
        skel("width:132px;height:15px;margin:3px 0 7px"),
        skel("width:188px;height:11px")
      ] : [
        text5("div", "ov-wx__label", "Forecast unavailable"),
        text5("div", "ov-wx__note", failed ? "The forecast didn\u2019t load. Your properties are shown without it." : "The forecast isn\u2019t set up for this portal yet."),
        failed ? h("button", { "class": "link-action", "data-action": "overview.retryWeather", type: "button", style: "margin-top:6px" }, "Try again \u203A") : null
      ])
    ]);
  }
  function WeatherPanel(frame, isNow, source, serviceNotes) {
    var stats = frame.stats || [];
    var note = serviceNotes ? frame.note : frame.forecastNote;
    var line = isNow ? note : [frame.day + " " + frame.date, note].filter(Boolean).join(" \xB7 ");
    return h("div", { "class": "ov-wx", "data-module": "weather-summary", "data-visual-id": "weather-summary", "data-weather": frame.kind }, [
      h("span", { "class": "ov-wx__mark" }, [icon("snowflake", "ov-wx__glyph")]),
      h("div", { "class": "ov-wx__read" }, [
        text5("div", "ov-wx__temp", frame.temp),
        text5("div", "ov-wx__label", frame.label),
        line ? text5("div", "ov-wx__note", line) : null,
        WeatherAttribution(source)
      ]),
      stats.length ? h("div", { "class": "ov-wx__stats" }, stats.map(function(stat) {
        return h("div", { "class": "ov-wx__stat" }, [
          text5("span", "ov-wx__stat-label", stat.label),
          text5("span", "ov-wx__stat-value", stat.value)
        ]);
      })) : null
    ]);
  }
  function MapPanel(model, frame, index) {
    var weather = frame ? model.weather : null;
    var statusKnown = propertyStatusKnown(model.sources);
    var stage = PropertyStage({
      direct: state.config.dataMode === "live",
      properties: model.properties,
      frame,
      index,
      weather,
      viewport: model.map,
      selectedId: state.ovProperty,
      map: sharedPropertyMap(),
      forecasts: propertyForecasts(),
      sources: model.sources
    });
    followSelection();
    return h("div", { "class": "ov-map card", "data-module": "property-map", "data-visual-id": "property-map" }, [
      h("div", { "class": "ov-map__head" }, [
        h("span", { "class": "ov-card__icon" }, [icon("map", "ov-icon")]),
        text5("h2", "ov-card__title", "Your properties"),
        weather ? h("div", { "class": "ov-legend" }, weather.legend.filter(function(item) {
          return statusKnown || item.key !== "issue";
        }).map(function(item) {
          return h("span", { "class": "ov-legend__item", "data-weather": item.key }, [h("i"), text5("span", "", item.label)]);
        })) : null
      ]),
      stage,
      weather ? DayTimeline(weather, index, model.properties, sectionAvailable(model, "appointments")) : null,
      weather ? WeatherAttribution(weather.source, "ov-map__attr") : null
    ]);
  }
  function propertyForecasts() {
    if (!propertyForecastStore) {
      propertyForecastStore = createPropertyForecasts({
        adapter: createXweatherAdapter({ clientId: state.config.weatherClientId, clientSecret: state.config.weatherClientSecret }),
        onChange: render
      });
    }
    return propertyForecastStore;
  }
  function followSelection() {
    if (!focusKeeper) {
      focusKeeper = createFocusKeeper(document);
      closeOnEscape(document, function() {
        return state.route === "overview" && !!state.ovProperty;
      }, function() {
        dispatchMapAction("overview.closeProperty");
      });
    }
    var previous = lastSelection;
    var current = state.ovProperty;
    lastSelection = current;
    Promise.resolve().then(function() {
      focusKeeper.settle(current, previous);
    });
  }
  function DayTimeline(weather, index, properties, visitsKnown) {
    var last = weather.timeline.length - 1;
    var track = h("div", { "class": "ov-timeline__track" }, weather.timeline.map(function(item, position) {
      var visits = serviceDayCount(properties, position);
      return h("button", {
        "class": "ov-day" + (position === index ? " ov-day--on" : "") + (position === weather.nowIndex ? " ov-day--now" : "") + (visits ? " ov-day--service" : ""),
        "data-action": "overview.scrubWeather",
        "data-id": String(position),
        "data-weather": item.kind,
        "data-service": visits ? String(visits) : void 0,
        "aria-label": item.day + " " + item.date + " \u2014 " + item.label + (visits ? " \u2014 " + visits + (visits === 1 ? " visit" : " visits") : visitsKnown ? " \u2014 no visit" : ""),
        "aria-pressed": position === index ? "true" : "false"
      }, [
        text5("span", "ov-day__name", item.day),
        text5("span", "ov-day__date", item.date),
        h("i"),
        h("span", { "class": "ov-day__svc" }, visits ? [
          text5("b", "", String(visits)),
          text5("span", "ov-day__svc-word", visits === 1 ? " visit" : " visits")
        ] : [])
      ]);
    }));
    return h("div", { "class": "ov-timeline", "data-module": "weather-timeline", "data-visual-id": "weather-timeline" }, [
      stepButton("\u2039", "Previous day", index - 1, index === 0),
      track,
      stepButton("\u203A", "Next day", index + 1, index === last)
    ]);
  }
  function stepButton(glyph, label, target, disabled) {
    return h("button", {
      "class": "ov-step",
      "data-action": disabled ? void 0 : "overview.scrubWeather",
      "data-id": String(target),
      "aria-label": label,
      disabled: disabled ? "disabled" : void 0
    }, glyph);
  }
  function UpcomingWidget(model, timeline) {
    var scheduled = model.properties.filter(function(property) {
      return property.appointment && property.appointment.state === "SCHEDULED";
    });
    if (!sectionAvailable(model, "appointments")) return null;
    var card = widget("upcoming-services", "Upcoming services", "calendar");
    if (!scheduled.length) {
      card.appendChild(emptyLine("No scheduled visits", "Dispatch happens automatically when your trigger is met."));
      return card;
    }
    card.appendChild(lead(String(scheduled.length), scheduled.length === 1 ? "scheduled appointment" : "scheduled appointments", scheduled[0].appointment.when));
    scheduled.slice(0, 3).forEach(function(property) {
      var appointment = property.appointment;
      card.appendChild(h("div", { "class": "ov-slot", "data-module": "upcoming-row", "data-visual-id": "upcoming-row" }, [
        appointment.time ? text5("span", "ov-slot__time", appointment.time) : null,
        h("span", { "class": "ov-slot__pin" }, [icon("pin", "ov-slot__glyph")]),
        h("button", {
          "class": "ov-slot__link",
          "data-action": "appointments.openVisit",
          "data-id": property.id,
          "aria-label": "Open the " + appointment.service + " visit at " + property.name
        }, [
          text5("span", "ov-row__title", property.name),
          text5("span", "ov-row__meta", metaOf(appointmentDay(appointment, timeline), appointment.service))
        ])
      ]));
    });
    card.appendChild(h("div", { "class": "ov-foot" }, [
      ActionButton({ variant: "btn--ghost", label: "View full calendar", action: "overview.openCalendar", visualId: "view-full-calendar" })
    ]));
    return card;
  }
  function NextVisitWidget() {
    var visits = liveVisits();
    var next = visits && visits.upcoming[0];
    if (!next) return null;
    var card = widget("next-visit", "Next visit", "calendar");
    card.appendChild(VisitRow(next, { today: localDateKey(/* @__PURE__ */ new Date(), state.config.timeZone), place: visitPlace(next, liveProperties()) }));
    card.appendChild(navLine("All visits", "appointments"));
    return card;
  }
  function InvoiceDueWidget() {
    var due = openInvoices(liveInvoices());
    if (!due.length) return null;
    var card = widget("invoice-due", due.length === 1 ? "Invoice due" : "Invoices due", "invoice");
    due.slice(0, 3).forEach(function(invoice) {
      card.appendChild(InvoiceRow(invoice));
    });
    card.appendChild(navLine(due.length > 3 ? due.length - 3 + " more in Invoices" : "All invoices", "invoices"));
    return card;
  }
  function navLine(label, route) {
    return h("div", { "class": "link-action ov-more", "data-action": "nav.go", "data-id": route }, label + " \u203A");
  }
  function InvoicesWidget(model) {
    if (!sectionAvailable(model, "invoices")) return null;
    var buckets = invoiceBuckets(model.invoices);
    var overdue = buckets.overdue;
    var card = h("div", { "class": "card card--pad ov-card ov-bill" + (overdue.count ? " ov-bill--alarm" : ""), "data-module": "invoices", "data-visual-id": "invoices", "data-state": overdue.count ? "overdue" : "current" }, [
      h("div", { "class": "ov-card__head" }, [
        h("span", { "class": "ov-card__icon" }, [icon("invoice", "ov-icon")]),
        text5("h2", "ov-card__title", "Invoices"),
        h("div", { "class": "link-action ov-bill__all", "data-action": "overview.openInvoices" }, "View all \u203A")
      ])
    ]);
    if (!buckets.outstanding.count && !buckets.paidThisMonth.count) {
      card.appendChild(emptyLine("No invoices yet", "Invoices appear here once the season is billed."));
      return card;
    }
    if (overdue.count) card.appendChild(OverdueAlert(overdue));
    card.appendChild(h("div", { "class": "ov-bill__stats" }, [
      billStat("Total outstanding", money(buckets.outstanding.amount), buckets.outstanding.count, ""),
      billStat("Due this month", money(buckets.dueThisMonth.amount), buckets.dueThisMonth.count, ""),
      billStat("Paid this month", money(buckets.paidThisMonth.amount), buckets.paidThisMonth.count, "ov-bill__stat-value--ok")
    ]));
    card.appendChild(moreLine(null, "View all invoices", "overview.openInvoices"));
    return card;
  }
  function OverdueAlert(overdue) {
    return h("div", { "class": "ov-alarm", "data-module": "overdue-alert", "data-visual-id": "overdue-alert", role: "alert" }, [
      h("span", { "class": "ov-alarm__mark" }, [icon("alert", "ov-alarm__glyph")]),
      h("div", { "class": "ov-alarm__read" }, [
        text5("div", "ov-alarm__eyebrow", "Overdue amount"),
        text5("div", "ov-alarm__amount", money(overdue.amount)),
        text5("div", "ov-alarm__count", "Across " + overdue.count + (overdue.count === 1 ? " overdue invoice" : " overdue invoices")),
        text5("div", "ov-alarm__warn", "Please make a payment to avoid service interruption.")
      ]),
      h("div", { "class": "ov-alarm__act" }, [
        ActionButton({ variant: "btn--danger", label: "View overdue invoices \u2192", action: "overview.openInvoices", visualId: "view-overdue-invoices" })
      ])
    ]);
  }
  function billStat(label, value, count, valueClass) {
    return h("div", { "class": "ov-bill__stat" }, [
      text5("div", "ov-bill__stat-label", label),
      text5("div", "ov-bill__stat-value " + valueClass, value),
      text5("div", "ov-bill__stat-count", String(count) + (count === 1 ? " invoice" : " invoices"))
    ]);
  }
  function ContractsWidget(model) {
    if (state.config.dataMode === "live" && isModuleEnabled("proposals")) return LiveContractsWidget();
    var contracts = model.contracts || [];
    var quotes = quotePackage();
    var preparing = !!(quotes && quotes.preparing);
    if (!sectionAvailable(model, "contracts")) return null;
    var card = widget("active-contracts", "Active contracts", "contract");
    if (!contracts.length) {
      card.appendChild(preparing ? QuotePreparingLine() : emptyLine("No active contracts", "A contract appears here once your service agreement is approved."));
      return card;
    }
    card.appendChild(lead(String(contracts.length), contracts.length === 1 ? "active contract" : "active contracts"));
    contracts.slice(0, 3).forEach(function(contract) {
      card.appendChild(h("div", { "class": "ov-row", "data-module": "contract-row", "data-visual-id": "contract-row" }, [
        h("div", { style: "flex:1;min-width:0" }, [
          text5("div", "ov-row__title", "Contract #" + contract.number),
          text5("div", "ov-row__meta", contract.plan)
        ]),
        text5("span", "status-badge status-badge--ok", "Active")
      ]));
    });
    if (preparing) card.appendChild(QuotePreparingRow());
    card.appendChild(moreLine(null, "View all contracts", "overview.openContracts"));
    return card;
  }
  function LiveContractsWidget() {
    var card = widget("active-contracts", "Contracts", "contract");
    var envelope2 = state.moduleData.proposals;
    var readbackFailed = !!(state.contractCommand && state.contractCommand.phase === "readback-failed");
    if (readbackFailed || !envelope2 && state.moduleStatus.proposals === "error" || envelope2 && envelope2.state === "error") return contractsProblem(card, "error", "Couldn\u2019t load your contracts", "Nothing was changed. Try again in a moment.", true);
    if (!envelope2) return contractsLoading(card);
    if (envelope2.state === "unauthorized") return contractsProblem(card, "unauthorized", "No access to contracts", "Your account doesn\u2019t include access to your contracts.", false);
    var quotes = quotePackage();
    if (envelope2.state === "unavailable" || !quotes) return null;
    var agreements = quotes.agreements;
    var waiting = quotes.counts.open;
    var revising = !waiting && quotes.pending.length > 0;
    var partial = !!(quotes.partial && (quotes.partial.agreements || quotes.partial.orders));
    card.setAttribute("data-state", partial ? "partial" : agreements.length || quotes.pending.length ? "ready" : quotes.preparing ? "preparing" : "empty");
    if (!agreements.length && !quotes.pending.length) {
      card.appendChild(quotes.preparing ? QuotePreparingLine() : emptyLine("No contracts yet", "When we send you a quote or a service agreement, it appears here."));
      if (partial) card.appendChild(ContractsPartialLine());
      return card;
    }
    if (waiting) card.appendChild(QuotesWaitingLink(waiting));
    agreements.slice(0, 3).forEach(function(row) {
      card.appendChild(AgreementLine(row));
    });
    if (revising) card.appendChild(QuotesRevisionLine());
    if (quotes.preparing) card.appendChild(QuotePreparingRow());
    if (partial) card.appendChild(ContractsPartialLine());
    card.appendChild(moreLine(agreements.length > 3 ? agreements.length - 3 : null, agreements.length > 3 ? "more in Contracts" : "View all contracts", "overview.openContracts"));
    return card;
  }
  function AgreementLine(row) {
    var agreement = row.agreement;
    var meta = agreementSummary(row);
    return h("div", { "class": "ov-row", "data-module": "contract-row", "data-visual-id": "contract-row", "data-state": agreement.stage }, [
      h("div", { style: "flex:1;min-width:0" }, [
        text5("div", "ov-row__title", agreementTitle(row)),
        h("div", { "class": "ov-row__line", style: "margin-top:4px;flex-wrap:wrap;row-gap:4px" }, [
          text5("span", "status-badge status-badge--" + agreement.tone, agreement.label),
          meta ? text5("span", "ov-row__meta", meta) : null
        ])
      ]),
      chevron("agreement.open", row.id, "Open the service agreement " + agreementTitle(row) + " \u2014 " + agreement.label)
    ]);
  }
  function QuotesWaitingLink(count) {
    return h("button", { "class": "ov-waiting", type: "button", "data-module": "quote-decision", "data-visual-id": "quote-decision", "data-action": "overview.openContracts" }, [
      text5("span", "ov-waiting__label", plural(count, "quote", "quotes") + " waiting for your decision"),
      h("span", { "class": "ov-waiting__chev", "aria-hidden": "true" }, "\u203A")
    ]);
  }
  function QuotesRevisionLine() {
    return h("div", { "class": "ov-row", "data-module": "quote-revision", "data-visual-id": "quote-revision", "data-tone": "info" }, [
      h("i", { "class": "ov-dot" }),
      h("div", { style: "flex:1;min-width:0" }, [
        text5("div", "ov-row__title", "Changes requested"),
        text5("div", "ov-row__meta", "We\u2019re reviewing the changes you asked for.")
      ]),
      chevron("overview.openContracts", "", "Go to Contracts")
    ]);
  }
  function ContractsPartialLine() {
    return h("div", { "class": "ov-row__meta", "data-module": "contracts-partial", "data-visual-id": "contracts-partial", "data-state": "partial", role: "status" }, "Part of your contracts couldn\u2019t be loaded. Contracts shows what did.");
  }
  function contractsLoading(card) {
    card.setAttribute("data-state", "loading");
    card.setAttribute("aria-busy", "true");
    card.appendChild(h("div", { "class": "ov-lead", "data-module": "contracts-loading", "data-visual-id": "contracts-loading" }, [skel("width:46%;height:24px")]));
    card.appendChild(skel("height:13px;width:82%"));
    card.appendChild(skel("height:13px;width:64%"));
    return card;
  }
  function contractsProblem(card, stateName, title, desc, retry) {
    card.setAttribute("data-state", stateName);
    card.appendChild(h("div", { "class": "ov-empty", "data-module": "contracts-" + stateName, "data-visual-id": "contracts-" + stateName, "data-state": stateName, role: stateName === "error" ? "alert" : "status" }, [
      text5("div", "ov-empty__title", title),
      text5("div", "ov-empty__desc", desc),
      retry ? h("button", { "class": "link-action", "data-action": "contracts.refresh", type: "button" }, "Try again \u203A") : null
    ]));
    return card;
  }
  function QuotePreparingLine() {
    return h("div", { "class": "ov-empty", "data-module": "quote-preparing", "data-visual-id": "quote-preparing", "data-state": "preparing", role: "status" }, [
      text5("div", "ov-empty__title", "We have your request"),
      text5("div", "ov-empty__desc", "We\u2019re preparing your quote. It appears under Contracts once we send it."),
      h("div", { "class": "link-action", "data-action": "overview.openContracts" }, "Go to Contracts \u203A")
    ]);
  }
  function QuotePreparingRow() {
    return h("div", { "class": "ov-row", "data-module": "quote-preparing", "data-visual-id": "quote-preparing", "data-state": "preparing", "data-tone": "info", role: "status" }, [
      h("i", { "class": "ov-dot" }),
      h("div", { style: "flex:1;min-width:0" }, [
        text5("div", "ov-row__title", "Request in preparation"),
        text5("div", "ov-row__meta", "We have your request and are preparing your quote.")
      ]),
      chevron("overview.openContracts", "", "Go to Contracts")
    ]);
  }
  function SupportWidget(model) {
    if (!sectionAvailable(model, "support")) return null;
    var requests = model.support || [];
    var card = widget("support-requests", "Support requests", "support");
    if (!requests.length) {
      card.appendChild(h("div", { "class": "ov-empty", "data-state": "empty" }, [
        text5("div", "ov-empty__title", "No open requests"),
        text5("div", "ov-empty__desc", "Everything looks good. Need help?"),
        h("div", { "class": "link-action", "data-action": "overview.newRequest" }, "Submit a request \u203A")
      ]));
      return card;
    }
    card.appendChild(lead(String(requests.length), requests.length === 1 ? "open request" : "open requests"));
    requests.slice(0, 2).forEach(function(request, position) {
      card.appendChild(h("div", { "class": "ov-row", "data-module": "support-row", "data-visual-id": "support-row", "data-tone": request.tone || "info" }, [
        h("i", { "class": "ov-dot" }),
        h("div", { style: "flex:1;min-width:0" }, [
          text5("div", "ov-row__title", request.title),
          h("div", { "class": "ov-row__meta" }, [
            text5("span", "ov-row__status", request.status),
            text5("span", "", " \xB7 " + request.when)
          ])
        ]),
        chevron("overview.openSupport", String(position), "Open " + request.title)
      ]));
    });
    card.appendChild(requests.length > 2 ? moreLine(requests.length - 2, "more open requests", "overview.openSupport") : moreLine(null, "View all requests", "overview.openSupport"));
    return card;
  }
  function Banner(banner) {
    return h("div", { "class": "card card--pad ov-banner", "data-module": "storm-banner", "data-visual-id": "storm-banner" }, [
      h("span", { "class": "ov-banner__mark" }, [icon("snowflake", "ov-icon")]),
      h("div", { style: "flex:1;min-width:0" }, [
        text5("div", "ov-banner__title", banner.title),
        text5("div", "ov-banner__copy", banner.copy)
      ]),
      ActionButton({ variant: "btn--ghost", label: banner.action, action: "overview.newRequest", visualId: "storm-banner-cta" })
    ]);
  }
  function widget(id, title, iconName) {
    return h("div", { "class": "card card--pad ov-card", "data-module": id, "data-visual-id": id }, [
      h("div", { "class": "ov-card__head" }, [
        h("span", { "class": "ov-card__icon" }, [icon(iconName, "ov-icon")]),
        text5("h2", "ov-card__title", title)
      ])
    ]);
  }
  function lead(value, label, meta) {
    return h("div", { "class": "ov-lead" }, [
      h("div", { "class": "ov-lead__main" }, [
        text5("span", "ov-lead__value", value),
        text5("span", "ov-lead__label", label)
      ]),
      meta ? text5("div", "ov-lead__meta", meta) : null
    ]);
  }
  function metaOf(day, service) {
    return day ? day + " \xB7 " + service : service;
  }
  function chevron(action, id, label) {
    return h("button", { "class": "ov-chev", "data-action": action, "data-id": id, "aria-label": label }, "\u203A");
  }
  function moreLine(count, label, action) {
    return h("div", { "class": "link-action ov-more", "data-action": action }, (count == null ? label : String(count) + " " + label) + " \u203A");
  }
  function emptyLine(title, desc) {
    return h("div", { "class": "ov-empty", "data-state": "empty" }, [
      text5("div", "ov-empty__title", title),
      text5("div", "ov-empty__desc", desc)
    ]);
  }
  function text5(tag, className, value) {
    return h(tag, className ? { "class": className } : null, value == null ? "" : String(value));
  }

  // app-templates/customer-portal/runtime/src/normalizers/appointments.js
  var APPOINTMENT_STATE = {
    COMPLETED: { label: "Completed", tone: "ok" },
    IN_PROGRESS: { label: "In progress", tone: "progress" },
    EN_ROUTE: { label: "En route", tone: "warn" },
    SCHEDULED: { label: "Scheduled", tone: "info" },
    CANCELLED: { label: "Cancelled", tone: "scheduled" }
  };
  function appointmentRows(properties, timeline) {
    var rows2 = [];
    (properties || []).forEach(function(property) {
      var appointment = property.appointment;
      if (!appointment) return;
      var frame = timeline && timeline[appointment.dayIndex];
      rows2.push({
        id: property.id,
        resource: appointment.resource || "Unassigned",
        name: property.name,
        address: property.address,
        service: appointment.service,
        state: appointment.state,
        dayIndex: appointment.dayIndex,
        day: frame ? frame.day + " " + frame.date : "",
        est: window_(appointment.est),
        actual: window_(appointment.actual),
        minutes: minutesOf(appointment.est)
      });
    });
    return rows2;
  }
  function stateMeta(state2) {
    return APPOINTMENT_STATE[state2] || { label: state2 || "Unknown", tone: "scheduled" };
  }
  function resourceNames(rows2) {
    var seen = {};
    var names = [];
    rows2.forEach(function(row) {
      if (seen[row.resource]) return;
      seen[row.resource] = true;
      names.push(row.resource);
    });
    return names.sort(function(a, b) {
      return a.localeCompare(b);
    });
  }
  function filterRows(rows2, dayIndex) {
    if (dayIndex === null || dayIndex === void 0 || dayIndex === "") return rows2.slice();
    var wanted = Number(dayIndex);
    return rows2.filter(function(row) {
      return row.dayIndex === wanted;
    });
  }
  function sortRows(rows2, direction) {
    var factor = direction === "desc" ? -1 : 1;
    return rows2.slice().sort(function(a, b) {
      var byResource = a.resource.localeCompare(b.resource) * factor;
      if (byResource) return byResource;
      if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
      if (a.minutes !== b.minutes) return a.minutes - b.minutes;
      return a.name.localeCompare(b.name);
    });
  }
  function window_(range) {
    if (!range || !range.start) return "";
    return range.end ? range.start + " \u2013 " + range.end : range.start + " \u2013 \u2026";
  }
  function minutesOf(range) {
    if (!range || !range.start) return Number.MAX_SAFE_INTEGER;
    return clockMinutes(range.start);
  }
  function clockMinutes(clock2) {
    var match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(clock2).trim());
    if (!match) return Number.MAX_SAFE_INTEGER;
    var hour = Number(match[1]) % 12;
    if (/PM/i.test(match[3])) hour += 12;
    return hour * 60 + Number(match[2]);
  }

  // app-templates/customer-portal/runtime/src/routes/AppointmentsPage.js
  var COLUMNS = [
    { key: "resource", label: "Resource", sortable: true },
    { key: "address", label: "Address" },
    { key: "state", label: "Appointment state" },
    { key: "est", label: "Est time" },
    { key: "actual", label: "Actual time" }
  ];
  function Appointments() {
    var page = h("section", { "class": "page", "data-route": "appointments", "data-visual-id": "appointments" });
    var model = currentOverview();
    var timeline = model && model.weather && model.weather.timeline || [];
    var all = appointmentRows(model && model.properties, timeline);
    page.appendChild(PageHeader({
      title: "Appointments timeline",
      sub: subline2(all, timeline)
    }));
    if (!all.length) {
      page.appendChild(EmptyState({
        glyph: "\u25CC",
        title: "No appointments yet",
        desc: "Visits appear here once a storm trigger dispatches a crew."
      }));
      return page;
    }
    var day = state.apptDay;
    var direction = state.apptSort === "desc" ? "desc" : "asc";
    var rows2 = sortRows(filterRows(all, day), direction);
    page.appendChild(Filters(all, timeline, day));
    var card = h("div", { "class": "card card--pad appt", "data-module": "appointments-table", "data-visual-id": "appointments-table" });
    if (!rows2.length) {
      card.appendChild(h("div", { "class": "appt__empty" }, [
        text6("div", "ov-empty__title", "No visits on this day"),
        text6("div", "ov-empty__desc", "Pick another date, or clear the filter to see the whole week."),
        h("div", { "class": "link-action", "data-action": "appointments.filterDay", "data-id": "" }, "Show all dates \u203A")
      ]));
      page.appendChild(card);
      return page;
    }
    card.appendChild(Table(rows2, direction));
    page.appendChild(card);
    page.appendChild(text6("div", "appt__count", rows2.length === all.length ? String(all.length) + (all.length === 1 ? " appointment" : " appointments") : String(rows2.length) + " of " + all.length + " appointments"));
    return page;
  }
  function subline2(rows2, timeline) {
    var span = timeline.length ? timeline[0].date + " \u2013 " + timeline[timeline.length - 1].date : "";
    var resources = resourceNames(rows2).length;
    return span ? span + " \xB7 " + resources + (resources === 1 ? " resource" : " resources") : resources + (resources === 1 ? " resource" : " resources");
  }
  function Filters(rows2, timeline, day) {
    var chips = [dayChip("All dates", "", day === null || day === void 0 || day === "")];
    timeline.forEach(function(frame, index) {
      var count = rows2.filter(function(row) {
        return row.dayIndex === index;
      }).length;
      if (!count) return;
      chips.push(dayChip(frame.day + " " + frame.date, String(index), String(day) === String(index), count));
    });
    return h("div", { "class": "appt-filters", "data-module": "appointment-filters", "data-visual-id": "appointment-filters" }, [
      text6("span", "appt-filters__label", "Date"),
      h("div", { "class": "appt-filters__chips", role: "group", "aria-label": "Filter appointments by date" }, chips)
    ]);
  }
  function dayChip(label, id, active, count) {
    return h("button", {
      "class": "appt-chip" + (active ? " appt-chip--on" : ""),
      "data-action": "appointments.filterDay",
      "data-id": id,
      "aria-pressed": active ? "true" : "false"
    }, count ? [text6("span", "", label), text6("span", "appt-chip__count", String(count))] : [text6("span", "", label)]);
  }
  function Table(rows2, direction) {
    var head = h("tr", null, COLUMNS.map(function(column) {
      if (!column.sortable) return h("th", { scope: "col" }, column.label);
      return h("th", { scope: "col", "aria-sort": direction === "desc" ? "descending" : "ascending" }, [
        h("button", {
          "class": "appt__sort",
          "data-action": "appointments.sortResource",
          "aria-label": "Sort by resource, currently " + (direction === "desc" ? "descending" : "ascending")
        }, [text6("span", "", column.label), text6("span", "appt__caret", direction === "desc" ? "\u2193" : "\u2191")])
      ]);
    }));
    var body = h("tbody", null, rows2.map(function(row) {
      var meta = stateMeta(row.state);
      return h("tr", { "data-module": "appointment-row", "data-visual-id": "appointment-row", "data-state": row.state.toLowerCase() }, [
        h("td", null, [
          text6("div", "appt__resource", row.resource),
          row.day ? text6("div", "appt__sub", row.day) : null
        ]),
        h("td", null, [
          h("button", {
            "class": "appt__link",
            "data-action": "appointments.openProperty",
            "data-id": row.id,
            "aria-label": "Open " + row.name
          }, [
            text6("span", "appt__name", row.name),
            text6("span", "appt__sub", row.address)
          ])
        ]),
        h("td", null, [
          h("button", {
            "class": "appt__link",
            "data-action": "appointments.openVisit",
            "data-id": row.id,
            "aria-label": "Open the " + row.service + " visit at " + row.name
          }, [
            text6("span", "status-badge status-badge--" + meta.tone, meta.label),
            text6("span", "appt__sub", row.service)
          ])
        ]),
        h("td", { "class": "appt__time" }, row.est || "\u2014"),
        h("td", { "class": "appt__time" }, row.actual || "\u2014")
      ]);
    }));
    return h("div", { "class": "appt__scroll" }, [
      h("table", { "class": "appt__table" }, [h("thead", null, [head]), body])
    ]);
  }
  function text6(tag, className, value) {
    return h(tag, className ? { "class": className } : null, value == null ? "" : String(value));
  }

  // app-templates/customer-portal/runtime/src/routes/VisitDetailPage.js
  function currentVisit() {
    var model = currentOverview();
    var timeline = model && model.weather && model.weather.timeline || [];
    var rows2 = appointmentRows(model && model.properties, timeline);
    return rows2.find(function(row) {
      return row.id === state.visitId;
    }) || null;
  }
  function VisitDetail() {
    var page = h("section", { "class": "page page--narrow", "data-route": "visit.detail", "data-visual-id": "visit-detail" });
    var visit = currentVisit();
    page.appendChild(h("div", { "class": "detail-back", "data-action": "nav.go", "data-id": "appointments" }, "\u2039 Back to appointments"));
    if (!visit) {
      page.appendChild(EmptyState({ glyph: "\u25CC", title: "Visit not found", desc: "This visit is no longer on the schedule." }));
      return page;
    }
    var meta = stateMeta(visit.state);
    page.appendChild(h("div", { "class": "prop-head", "data-state": visit.state.toLowerCase() }, [
      h("div", { style: "flex:1;min-width:0" }, [
        text7("h1", "prop-head__title", visit.service),
        text7("div", "prop-head__addr", visit.day)
      ]),
      text7("span", "status-badge status-badge--" + meta.tone, meta.label)
    ]));
    page.appendChild(h("div", { "class": "card card--pad prop-facts", "data-module": "visit-facts", "data-visual-id": "visit-facts" }, [
      fact("Resource", visit.resource),
      fact("Property", visit.name, "appointments.openProperty", visit.id),
      fact("Address", visit.address),
      fact("Estimated", visit.est || "\u2014"),
      fact("Actual", visit.actual || "Not started")
    ]));
    return page;
  }
  function fact(label, value, action, id) {
    return h("div", { "class": "prop-fact" }, [
      text7("div", "prop-fact__label", label),
      action ? h("div", { "class": "link-action prop-fact__value", "data-action": action, "data-id": id }, value + " \u203A") : text7("div", "prop-fact__value", value)
    ]);
  }
  function text7(tag, className, value) {
    return h(tag, className ? { "class": className } : null, value == null ? "" : String(value));
  }

  // app-templates/customer-portal/runtime/src/components/storm/PropertyPlan.js
  var SVG = "http://www.w3.org/2000/svg";
  var SCALE = 1e5;
  var METERS_PER_DEGREE = 111320;
  var MIN_SPAN = 2e-4;
  var PADDING = 0.08;
  function PropertyPlan(entry) {
    if (!entry || entry.status === "unavailable") return null;
    var card = h("section", { "class": "card card--pad prop-plan", "data-module": "property-plan", "data-visual-id": "property-plan", "data-state": entry.status, "aria-labelledby": "property-plan-title" }, [
      h("div", { "class": "prop-section__title", id: "property-plan-title" }, "Service plan")
    ]);
    if (entry.status !== "ready") {
      card.setAttribute("aria-busy", "true");
      card.appendChild(skel("height:220px;border-radius:14px"));
      return card;
    }
    card.appendChild(planDrawing(entry.plan));
    card.appendChild(h("ul", { "class": "prop-plan__legend", "aria-label": "Plan elements" }, entry.plan.elements.map(function(element) {
      return h("li", { "class": "prop-plan__item" }, [
        h("span", { "class": "prop-plan__swatch", "data-tone": String(element.tone), "data-kind": element.kind, "aria-hidden": "true" }),
        h("span", { "class": "prop-plan__name" }, element.name || "Element " + element.position),
        element.areaText ? h("span", { "class": "prop-plan__size" }, element.areaText + " ft\xB2") : null
      ]);
    })));
    return card;
  }
  function planDrawing(plan) {
    var frame = planFrame(plan.bounds);
    var svg = svgNode("svg", {
      "class": "prop-plan__drawing",
      viewBox: [frame.x, frame.y, frame.width, frame.height].map(round).join(" "),
      role: "img",
      "aria-label": "Plan drawing with " + plan.elements.length + (plan.elements.length === 1 ? " element" : " elements")
    });
    plan.elements.forEach(function(element) {
      element.shapes.forEach(function(shape) {
        svg.appendChild(shapeNode(shape, element, frame));
      });
    });
    return svg;
  }
  function planFrame(bounds) {
    var cos = Math.cos((bounds.north + bounds.south) / 2 * Math.PI / 180);
    var width = Math.max((bounds.east - bounds.west) * cos, MIN_SPAN) * SCALE;
    var height = Math.max(bounds.north - bounds.south, MIN_SPAN) * SCALE;
    var centerX = (bounds.east - bounds.west) * cos * SCALE / 2;
    var centerY = (bounds.north - bounds.south) * SCALE / 2;
    var pad2 = Math.max(width, height) * PADDING;
    return {
      x: centerX - width / 2 - pad2,
      y: centerY - height / 2 - pad2,
      width: width + pad2 * 2,
      height: height + pad2 * 2,
      dot: Math.max(width, height) / 70,
      project: function(point) {
        return [(point.lng - bounds.west) * cos * SCALE, (bounds.north - point.lat) * SCALE];
      }
    };
  }
  function shapeNode(shape, element, frame) {
    var project = frame.project;
    var attributes = { "class": "prop-plan__shape", "data-tone": String(element.tone), "data-kind": shape.kind };
    if (shape.kind === "area") {
      attributes.d = shape.polygons.map(function(rings) {
        return rings.map(function(ring) {
          return "M" + ring.map(function(point) {
            return project(point).map(round).join(" ");
          }).join("L") + "Z";
        }).join("");
      }).join("");
      attributes["fill-rule"] = "evenodd";
      return svgNode("path", attributes);
    }
    if (shape.kind === "line") {
      attributes.points = shape.path.map(function(point) {
        return project(point).map(round).join(",");
      }).join(" ");
      return svgNode("polyline", attributes);
    }
    var center = project(shape.kind === "circle" ? shape.center : shape.position);
    attributes.cx = round(center[0]);
    attributes.cy = round(center[1]);
    attributes.r = round(shape.kind === "circle" ? shape.radius / METERS_PER_DEGREE * SCALE : frame.dot);
    return svgNode("circle", attributes);
  }
  function svgNode(tag, attributes) {
    var node = document.createElementNS(SVG, tag);
    (/* @__PURE__ */ Object.keys(attributes)).forEach(function(name) {
      node.setAttribute(name, String(attributes[name]));
    });
    return node;
  }
  function round(value) {
    return Math.round(value * 10) / 10;
  }

  // app-templates/customer-portal/runtime/client-review/plan.js
  (function(global) {
    "use strict";
    var ns = global.ClientReview || (global.ClientReview = {});
    var EARTH_RADIUS_METERS = 6378137;
    var SQUARE_FOOT_IN_SQUARE_METERS = 0.09290304;
    var MAP_SURFACE = "GOOGLE_MAPS";
    var TONES = 5;
    function finite(value) {
      return typeof value === "number" && isFinite(value);
    }
    function radians(degrees) {
      return degrees * Math.PI / 180;
    }
    function position(value) {
      if (!Array.isArray(value) || value.length < 2 || value.length > 3) return null;
      var lng = value[0];
      var lat = value[1];
      if (!finite(lng) || !finite(lat) || Math.abs(lng) > 180 || Math.abs(lat) > 90) return null;
      if (value.length === 3 && !finite(value[2])) return null;
      return { lat, lng };
    }
    function path(value, minimum) {
      if (!Array.isArray(value) || value.length < minimum) return null;
      var points = [];
      for (var index = 0; index < value.length; index += 1) {
        var point = position(value[index]);
        if (!point) return null;
        points.push(point);
      }
      return points;
    }
    function polygon(value) {
      if (!Array.isArray(value) || !value.length) return null;
      var rings = [];
      for (var index = 0; index < value.length; index += 1) {
        var ring = path(value[index], 4);
        if (!ring) return null;
        rings.push(ring);
      }
      return rings;
    }
    function shapeOf(geometry) {
      if (!geometry || typeof geometry !== "object") return null;
      var coordinates = geometry.coordinates;
      if (geometry.type === "Point") {
        var point = position(coordinates);
        return point ? { kind: "point", position: point } : null;
      }
      if (geometry.type === "LineString") {
        var line = path(coordinates, 2);
        return line ? { kind: "line", path: line } : null;
      }
      if (geometry.type === "Polygon") {
        var single = polygon(coordinates);
        return single ? { kind: "area", polygons: [single] } : null;
      }
      if (geometry.type === "MultiPolygon") {
        if (!Array.isArray(coordinates) || !coordinates.length) return null;
        var polygons = [];
        for (var index = 0; index < coordinates.length; index += 1) {
          var part = polygon(coordinates[index]);
          if (!part) return null;
          polygons.push(part);
        }
        return { kind: "area", polygons };
      }
      if (geometry.type === "Circle") {
        var center = position(coordinates);
        return center && finite(geometry.radius) && geometry.radius > 0 ? { kind: "circle", center, radius: geometry.radius } : null;
      }
      return null;
    }
    function projector(origin) {
      var scale = Math.cos(radians(origin.lat));
      return function(point) {
        return [EARTH_RADIUS_METERS * radians(point.lng - origin.lng) * scale, EARTH_RADIUS_METERS * radians(point.lat - origin.lat)];
      };
    }
    function ringArea(ring, project) {
      var twice = 0;
      ring.forEach(function(point, index) {
        var here = project(point);
        var next = project(ring[(index + 1) % ring.length]);
        twice += here[0] * next[1] - next[0] * here[1];
      });
      return Math.abs(twice) / 2;
    }
    function polygonArea(rings, project) {
      var holes = 0;
      rings.slice(1).forEach(function(ring) {
        holes += ringArea(ring, project);
      });
      return Math.max(0, ringArea(rings[0], project) - holes);
    }
    function shapeArea(shape) {
      if (shape.kind === "circle") return Math.PI * shape.radius * shape.radius;
      if (shape.kind !== "area") return 0;
      var project = projector(shape.polygons[0][0][0]);
      var area = 0;
      shape.polygons.forEach(function(rings) {
        area += polygonArea(rings, project);
      });
      return area;
    }
    function shapePoints(shape) {
      if (shape.kind === "point") return [shape.position];
      if (shape.kind === "line") return shape.path;
      if (shape.kind === "circle") {
        var latSpan = shape.radius / EARTH_RADIUS_METERS * 180 / Math.PI;
        var lngSpan = latSpan / Math.max(Math.cos(radians(shape.center.lat)), 0.01);
        return [
          { lat: shape.center.lat + latSpan, lng: shape.center.lng + lngSpan },
          { lat: shape.center.lat - latSpan, lng: shape.center.lng - lngSpan }
        ];
      }
      var points = [];
      shape.polygons.forEach(function(rings) {
        points = points.concat(rings[0]);
      });
      return points;
    }
    function boundsOf(elements) {
      var bounds = { north: -90, south: 90, east: -180, west: 180 };
      elements.forEach(function(element) {
        element.shapes.forEach(function(shape) {
          shapePoints(shape).forEach(function(point) {
            bounds.north = Math.max(bounds.north, point.lat);
            bounds.south = Math.min(bounds.south, point.lat);
            bounds.east = Math.max(bounds.east, point.lng);
            bounds.west = Math.min(bounds.west, point.lng);
          });
        });
      });
      return bounds;
    }
    function nameOf(element, locale) {
      var localized = ns.normalizer && typeof ns.normalizer.localizedName === "function" ? ns.normalizer.localizedName(element.nls, locale) : "";
      var label = typeof element.label === "string" ? element.label.replace(/\s+/g, " ").trim() : "";
      return localized || label;
    }
    function parse(raw, locale) {
      if (!raw || typeof raw !== "object" || raw.type !== "PropertyPlan" || raw.schemaVersion !== 1 || !Array.isArray(raw.elements)) return null;
      var tones = {};
      var toneCount = 0;
      var elements = [];
      var area = 0;
      raw.elements.forEach(function(element) {
        if (!element || typeof element !== "object" || !Array.isArray(element.overlays)) return;
        var shapes = [];
        element.overlays.forEach(function(overlay) {
          if (!overlay || typeof overlay !== "object" || overlay.map !== MAP_SURFACE) return;
          var shape = shapeOf(overlay.geometry);
          if (shape) shapes.push(shape);
        });
        if (!shapes.length) return;
        var type = "type-" + String(element.elementTypeDictionaryId);
        if (!Object.prototype.hasOwnProperty.call(tones, type)) {
          tones[type] = toneCount % TONES + 1;
          toneCount += 1;
        }
        var elementArea = 0;
        shapes.forEach(function(shape) {
          elementArea += shapeArea(shape);
        });
        area += elementArea;
        var kind = shapes[0].kind === "circle" ? "area" : shapes[0].kind;
        var squareFeet = elementArea / SQUARE_FOOT_IN_SQUARE_METERS;
        elements.push({
          key: "element-" + (elements.length + 1),
          position: elements.length + 1,
          name: nameOf(element, locale),
          tone: tones[type],
          kind,
          shapes,
          squareFeet,
          areaText: kind === "area" ? formatArea2(squareFeet, locale) : ""
        });
      });
      if (!elements.length) return null;
      var planSquareFeet = area / SQUARE_FOOT_IN_SQUARE_METERS;
      return { elements, squareFeet: planSquareFeet, areaText: formatArea2(planSquareFeet, locale), bounds: boundsOf(elements) };
    }
    function formatArea2(squareFeet, locale) {
      if (!finite(squareFeet) || squareFeet <= 0) return "";
      try {
        return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(squareFeet);
      } catch (_) {
        return new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(squareFeet);
      }
    }
    ns.plan = /* @__PURE__ */ Object.freeze({
      tones: TONES,
      parse,
      formatArea: formatArea2
    });
  })(typeof window !== "undefined" ? window : globalThis);

  // app-templates/customer-portal/runtime/src/property-plan.js
  var MEDIA_ID3 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  var plans = /* @__PURE__ */ new Map();
  function propertyPlan(planId, onChange, fetchImpl) {
    if (!MEDIA_ID3.test(String(planId || ""))) return null;
    var entry = plans.get(planId);
    if (entry) return entry;
    entry = { status: "loading", plan: null };
    plans.set(planId, entry);
    readPlan(planId, fetchImpl || globalThis.fetch).then(function(raw) {
      var plan = globalThis.ClientReview.plan.parse(raw, "en");
      entry.status = plan ? "ready" : "unavailable";
      entry.plan = plan;
    }, function() {
      entry.status = "unavailable";
    }).then(function() {
      if (typeof onChange === "function") onChange();
    });
    return entry;
  }
  function readPlan(planId, fetchImpl) {
    var base = String(state.config.coreApiBase || "/core").replace(/\/+$/, "");
    return Promise.resolve(fetchImpl(base + "/media/" + planId + "/stream.json", {
      method: "GET",
      credentials: "omit",
      referrerPolicy: "no-referrer",
      headers: { Accept: "application/json" }
    })).then(function(response) {
      if (!response || !response.ok) throw new Error("The property plan could not be read");
      return response.json();
    });
  }

  // app-templates/customer-portal/runtime/src/visit-progress.js
  var progress = /* @__PURE__ */ new Map();
  function visitProgress(visit, onChange, fetchImpl) {
    if (!visit || !visit.backendId) return null;
    var account = state.customerAccount && state.customerAccount.id;
    var key = [account, visit.backendId, visit.stateCode].join(":");
    var entry = progress.get(key);
    if (entry) return entry;
    entry = { status: "loading", steps: [] };
    progress.set(key, entry);
    readVisitTransitions({ config: state.config, state }, visit.backendId, fetchImpl || globalThis.fetch).then(function(rows2) {
      entry.steps = normalizeVisitProgress(rows2);
      entry.status = "ready";
    }, function() {
      entry.status = "unavailable";
    }).then(function() {
      if (typeof onChange === "function") onChange();
    });
    return entry;
  }

  // app-templates/customer-portal/runtime/src/routes/LiveVisitsPage.js
  function LiveVisits() {
    var page = h("section", { "class": "page page--narrow", "data-route": "appointments", "data-visual-id": "visits" });
    page.appendChild(PageHeader({ title: "Visits" }));
    var status = liveListStatus("appointmentsTimeline");
    page.setAttribute("data-state", status);
    if (status !== "ready") {
      page.appendChild(listState(status));
      return page;
    }
    var visits = liveVisits();
    var today = localDateKey(/* @__PURE__ */ new Date(), state.config.timeZone);
    var properties = liveProperties();
    var row = function(visit) {
      return VisitRow(visit, { today, place: visitPlace(visit, properties) });
    };
    if (visits.upcoming.length) page.appendChild(RecordSection("visits-upcoming", "Upcoming", visits.upcoming.map(row)));
    if (visits.past.length) page.appendChild(RecordSection("visits-past", "Past", visits.past.map(row)));
    return page;
  }
  function LiveVisitDetail() {
    var page = h("section", { "class": "page page--narrow", "data-route": "visit.detail", "data-visual-id": "visit-detail" });
    page.appendChild(h("div", { "class": "detail-back", "data-action": "nav.go", "data-id": "appointments" }, "\u2039 Back to visits"));
    var status = liveListStatus("appointmentsTimeline");
    var visit = status === "ready" ? findVisit(liveVisits(), state.visitId) : null;
    if (!visit) {
      page.setAttribute("data-state", status === "ready" || status === "empty" ? "not-found" : status);
      page.appendChild(status === "ready" || status === "empty" ? EmptyState({ glyph: "\u25CC", title: "Visit not found", desc: "This visit is not on your schedule." }) : listState(status));
      return page;
    }
    var today = localDateKey(/* @__PURE__ */ new Date(), state.config.timeZone);
    var property = liveProperties().find(function(item) {
      return item.backendId === visit.propertyBackendId;
    }) || null;
    page.setAttribute("data-state", visit.stateCode.toLowerCase());
    page.appendChild(h("div", { "class": "prop-head" }, [
      h("div", { style: "flex:1;min-width:0" }, [
        h("h1", { "class": "prop-head__title" }, visitDay(visit, today)),
        h("div", { "class": "prop-head__addr", "data-module": "visit-when" }, visitWindow(visit))
      ]),
      h("span", { "class": "status-badge status-badge--" + visit.status.tone }, visit.status.label)
    ]));
    if (property) {
      page.appendChild(PropertyFacts(property));
      var plan = PropertyPlan(propertyPlan(property.planId, render));
      if (plan) page.appendChild(plan);
      var services = ServicesCard(property);
      if (services) page.appendChild(services);
    }
    var progress2 = ProgressCard(visit);
    if (progress2) page.appendChild(progress2);
    if (visit.completionNotes) {
      page.appendChild(h("section", { "class": "card card--pad record-section", "data-module": "visit-notes", "data-visual-id": "visit-notes" }, [
        h("h2", { "class": "prop-section__title" }, "Completion notes"),
        h("p", { "class": "record-notes" }, visit.completionNotes)
      ]));
    }
    var photos = [photoGroup("Before", visit.before), photoGroup("After", visit.after)].filter(Boolean);
    if (photos.length) {
      page.appendChild(h("section", { "class": "card card--pad record-section", "data-module": "visit-photos", "data-visual-id": "visit-photos" }, [
        h("h2", { "class": "prop-section__title" }, "Photos")
      ].concat(photos)));
    }
    return page;
  }
  function PropertyFacts(property) {
    var area = formatArea(property.areaSqft);
    return h("section", { "class": "card card--pad prop-facts", "data-module": "visit-property", "data-visual-id": "visit-property" }, [
      h("div", { "class": "prop-fact", "data-fact": "property" }, [
        h("div", { "class": "prop-fact__label" }, "Property"),
        h("a", { "class": "link-action prop-fact__value", href: "#/properties/" + encodeURIComponent(property.id), "data-visual-id": "visit-property-link" }, (property.address || property.name) + " \u203A")
      ]),
      area ? h("div", { "class": "prop-fact", "data-fact": "area" }, [
        h("div", { "class": "prop-fact__label" }, "Area"),
        h("div", { "class": "prop-fact__value" }, area)
      ]) : null
    ]);
  }
  function ServicesCard(property) {
    if (!isModuleEnabled("proposals")) return null;
    var names = activeServiceNames(quotePackage(), property.backendId);
    if (!names.length) return null;
    return h("section", { "class": "card card--pad record-section", "data-module": "visit-services", "data-visual-id": "visit-services" }, [
      h("h2", { "class": "prop-section__title" }, "Services"),
      h("ul", { "class": "prop-service__lines", "aria-label": "Services" }, names.map(function(name) {
        return h("li", { "class": "prop-service__line" }, name);
      }))
    ]);
  }
  function ProgressCard(visit) {
    var entry = visitProgress(visit, render);
    if (!entry || entry.status !== "ready" || !entry.steps.length) return null;
    return h("section", { "class": "card card--pad record-section", "data-module": "visit-progress", "data-visual-id": "visit-progress" }, [
      h("h2", { "class": "prop-section__title" }, "Progress"),
      h("div", { "class": "timeline" }, [h("div", { "class": "timeline__line" })].concat(entry.steps.map(function(step) {
        return h("div", { "class": "timeline-step", "data-module": "visit-progress-step", "data-state": step.code.toLowerCase() }, [
          h("div", { "class": "timeline-step__dot", style: "background:" + (step.code === "COMPLETED" ? "var(--ok)" : "var(--accent)") }),
          h("div", { "class": "timeline-step__title" }, step.label + " \xB7 " + progressWhen(step, visit, state.config.timeZone))
        ]);
      })))
    ]);
  }
  function photoGroup(label, ids) {
    var urls = ids.map(function(id) {
      return visitImageUrl(state.config.coreApiBase, id);
    }).filter(Boolean);
    if (!urls.length) return null;
    return h("div", { "class": "record-photos", "data-module": "visit-photos-" + label.toLowerCase() }, [
      h("div", { "class": "record-photos__label" }, label),
      h("div", { "class": "record-photos__grid" }, urls.map(function(url, index) {
        return h("a", { "class": "record-photos__item", href: url, target: "_blank", rel: "noopener" }, [
          h("img", { src: url, alt: label + " service photo " + (index + 1), loading: "lazy", decoding: "async" })
        ]);
      }))
    ]);
  }
  function listState(status) {
    if (status === "loading") {
      return h("div", { "data-module": "visits-loading", "data-visual-id": "visits-loading", "aria-busy": "true" }, [
        skel("height:72px;border-radius:16px;margin-bottom:12px"),
        skel("height:72px;border-radius:16px;margin-bottom:12px"),
        skel("height:72px;border-radius:16px")
      ]);
    }
    if (status === "unauthorized") return UnauthorizedState({ scope: "these visits", backRoute: state.config.defaultRoute });
    if (status === "error") return ErrorState({ title: "Couldn\u2019t load your visits", desc: "Nothing was changed. Check your connection and try again." });
    return EmptyState({ glyph: "\u25CC", title: "No visits yet", desc: "Your scheduled and completed visits appear here." });
  }

  // app-templates/customer-portal/runtime/src/routes/InvoicesPage.js
  function Invoices() {
    var page = h("section", { "class": "page page--narrow", "data-route": "invoices", "data-visual-id": "invoices-page" });
    page.appendChild(PageHeader({ title: "Invoices" }));
    var status = liveListStatus("invoices");
    page.setAttribute("data-state", status);
    if (status !== "ready") {
      page.appendChild(listState2(status));
      return page;
    }
    page.appendChild(RecordSection("invoice-list", "", liveInvoices().items.map(InvoiceRow)));
    return page;
  }
  function InvoiceDetail() {
    var page = h("section", { "class": "page page--narrow", "data-route": "invoice.detail", "data-visual-id": "invoice-detail" });
    page.appendChild(h("div", { "class": "detail-back", "data-action": "nav.go", "data-id": "invoices" }, "\u2039 Back to invoices"));
    var status = liveListStatus("invoices");
    var invoice = status === "ready" ? findInvoice(liveInvoices(), state.invoiceId) : null;
    if (!invoice) {
      page.setAttribute("data-state", status === "ready" || status === "empty" ? "not-found" : status);
      page.appendChild(status === "ready" || status === "empty" ? EmptyState({ glyph: "\u25CC", title: "Invoice not found", desc: "This invoice is not on your account." }) : listState2(status));
      return page;
    }
    page.setAttribute("data-state", invoice.stateCode.toLowerCase());
    page.appendChild(h("div", { "class": "prop-head" }, [
      h("div", { style: "flex:1;min-width:0" }, [h("h1", { "class": "prop-head__title" }, invoiceTitle(invoice))]),
      h("span", { "class": "status-badge status-badge--" + invoice.status.tone }, invoice.status.label)
    ]));
    var facts2 = [
      invoice.due ? fact2("due", "Due date", formatIsoDate(invoice.due)) : null,
      invoiceTerms(invoice) ? fact2("terms", "Payment terms", invoiceTerms(invoice)) : null,
      invoice.issued && invoice.period ? fact2("issued", "Invoice date", formatIsoDate(invoice.issued)) : null
    ].filter(Boolean);
    if (facts2.length) page.appendChild(h("div", { "class": "card card--pad prop-facts", "data-module": "invoice-facts", "data-visual-id": "invoice-facts" }, facts2));
    var total = invoiceAmount(invoice);
    var rows2 = invoice.lines.map(function(line) {
      return h("div", { "class": "invoice__row", "data-module": "invoice-line" }, [
        h("span", null, line.quantity > 1 ? line.name + " \xD7 " + line.quantity : line.name),
        h("b", null, line.amount)
      ]);
    });
    var balance = invoice.stateCode !== "PAID" && invoice.paid > 0 && invoice.total !== null ? [
      h("div", { "class": "invoice__row", "data-module": "invoice-paid" }, [h("span", null, "Paid"), h("b", null, formatMoney(invoice.paid, invoice.currency))]),
      h("div", { "class": "invoice__row", "data-module": "invoice-balance" }, [h("span", null, "Balance"), h("b", null, formatMoney(invoice.total - invoice.paid, invoice.currency))])
    ] : [];
    if (rows2.length || total) {
      page.appendChild(h("section", { "class": "card card--pad record-section", "data-module": "invoice-lines", "data-visual-id": "invoice-lines" }, [
        h("h2", { "class": "prop-section__title" }, "Charges")
      ].concat(rows2, total ? [h("div", { "class": "invoice__total", "data-module": "invoice-total" }, [h("span", null, "Total"), h("span", null, total)])] : [], balance)));
    }
    var pay = PaySection(invoice);
    if (pay) page.appendChild(pay);
    return page;
  }
  function PaySection(invoice) {
    if (!invoicePaymentOpen(state.config) || !invoicePayable(invoice)) return null;
    var payment = invoicePaymentFor(invoice.id);
    if (payment && (payment.phase === "recording" || payment.phase === "slow")) {
      return h("section", { "class": "card card--pad invoice-pay", "data-module": "invoice-pay", "data-visual-id": "invoice-pay", "data-state": "recording", role: "status" }, [
        h("div", { "class": "invoice-pay__title" }, "Payment received"),
        h("div", { "class": "invoice-pay__note" }, "Your invoice will show as paid shortly. You don't need to pay again.")
      ]);
    }
    var busy = invoicePaymentBusy();
    return h("section", { "class": "card card--pad invoice-pay", "data-module": "invoice-pay", "data-visual-id": "invoice-pay", "data-state": busy ? "busy" : "ready" }, [
      h("button", {
        "class": "btn btn--primary btn--block btn--lg",
        type: "button",
        "data-action": "invoice.pay",
        "data-id": invoice.id,
        "data-visual-id": "invoice-pay-button",
        disabled: busy ? true : void 0
      }, "Pay " + invoiceAmount(invoice)),
      h("div", { "class": "invoice-pay__note" }, "Pay by card. Payments are processed securely by Stripe.")
    ]);
  }
  function fact2(key, label, value) {
    return h("div", { "class": "prop-fact", "data-fact": key }, [
      h("div", { "class": "prop-fact__label" }, label),
      h("div", { "class": "prop-fact__value" }, value)
    ]);
  }
  function listState2(status) {
    if (status === "loading") {
      return h("div", { "data-module": "invoices-loading", "data-visual-id": "invoices-loading", "aria-busy": "true" }, [
        skel("height:72px;border-radius:16px;margin-bottom:12px"),
        skel("height:72px;border-radius:16px")
      ]);
    }
    if (status === "unauthorized") return UnauthorizedState({ scope: "these invoices", backRoute: state.config.defaultRoute });
    if (status === "error") return ErrorState({ title: "Couldn\u2019t load your invoices", desc: "Nothing was changed. Check your connection and try again." });
    return EmptyState({ glyph: "\u25CC", title: "No invoices yet", desc: "Your invoices appear here once we send one." });
  }

  // app-templates/customer-portal/runtime/src/routes/PropertyDetailPage.js
  function currentProperty() {
    var model = currentOverview();
    var properties = model && model.properties || [];
    return properties.find(function(property) {
      return property.id === state.propertyId;
    }) || null;
  }
  function PropertyDetail() {
    var page = h("section", { "class": "page page--narrow", "data-route": "property.detail", "data-visual-id": "property-detail" });
    var source = state.config.dataMode === "live" ? liveOverviewStatus() : "ready";
    if (source !== "ready") {
      page.setAttribute("data-state", source === "loading" ? "loading" : source === "unauthorized" ? "unauthorized" : "error");
      if (source === "loading") page.appendChild(PropertySkeleton());
      else if (source === "unauthorized") page.appendChild(UnauthorizedState({ scope: "this property", backRoute: state.config.defaultRoute }));
      else {
        page.appendChild(BackLink(null));
        page.appendChild(ErrorState({ title: "Couldn\u2019t load this property", desc: "Nothing was changed. Check your connection and try again." }));
      }
      return page;
    }
    var model = currentOverview();
    var property = currentProperty();
    if (!property) {
      page.setAttribute("data-state", "not-found");
      page.appendChild(BackLink(model));
      page.appendChild(EmptyState({ glyph: "\u25CC", title: "Property not found", desc: sectionAvailable(model, "contracts") ? "This address is not on your contract." : "We couldn\u2019t find this property." }));
      return page;
    }
    var status = knownPropertyStatus(property, model.sources);
    var contract = contractFor(property);
    var service = serviceFor(property);
    page.appendChild(BackLink(model));
    page.appendChild(h("div", { "class": "prop-head" }, [
      h("div", { style: "flex:1;min-width:0" }, [
        text8("h1", "prop-head__title", property.name),
        property.address && !addressRepeats(property.name, property.address) ? text8("div", "prop-head__addr", property.address) : null
      ]),
      status ? text8("span", "status-badge status-badge--" + statusTone(status), OVERVIEW_STATUS[status].label) : null
    ]));
    var rows2 = facts(property, contract, model, service);
    if (rows2.length) {
      page.appendChild(h(
        "div",
        { "class": "card card--pad prop-facts", "data-module": "property-facts", "data-visual-id": "property-facts" },
        rows2.map(function(item) {
          return h("div", { "class": "prop-fact", "data-fact": item.key }, [
            text8("div", "prop-fact__label", item.label),
            item.action ? h("div", { "class": "link-action prop-fact__value", "data-action": item.action, "data-id": item.id }, item.value + " \u203A") : text8("div", "prop-fact__value", item.value)
          ]);
        })
      ));
    }
    if (service) page.appendChild(ServiceCard2(service));
    var visits = LiveVisitsCard(property);
    if (visits) page.appendChild(visits);
    var plan = PropertyPlan(propertyPlan(property.planId, render));
    if (plan) page.appendChild(plan);
    var location = PropertyLocation({
      property,
      map: sharedPropertyMap(),
      viewport: mapViewport(),
      link: { label: "See it with your other properties", action: "property.showOnMap", id: property.id }
    });
    if (location) page.appendChild(location);
    if (property.ticket && sectionAvailable(model, "support")) {
      page.appendChild(h("div", { "class": "card card--pad prop-ticket", "data-module": "property-ticket", "data-visual-id": "property-ticket" }, [
        text8("div", "prop-section__title", "Open request"),
        text8("div", "prop-ticket__title", property.ticket.title),
        h("div", { "class": "link-action", "data-action": "nav.go", "data-id": "support" }, "Open support \u203A")
      ]));
    }
    if (sectionAvailable(model, "appointments")) page.appendChild(VisitCard(property));
    return page;
  }
  function ServiceCard2(service) {
    var row = service.row;
    var agreement = row.agreement;
    return h("section", { "class": "card card--pad prop-service", "data-module": "property-service", "data-visual-id": "property-service", "data-state": agreement.stage, "aria-labelledby": "property-service-title" }, [
      h("div", { "class": "prop-section__title", id: "property-service-title" }, "Your service")
    ].concat(service.orders.map(function(order) {
      var price = formatOrderPrice(order);
      var products = order.lines.map(function(line) {
        return line.product;
      }).filter(function(name, index, names) {
        return !!name && names.indexOf(name) === index;
      });
      return h("div", { "class": "prop-service__entry", "data-module": "property-service-option" }, [
        h("div", { "class": "prop-service__head" }, [
          h("div", { style: "flex:1;min-width:0" }, [
            text8("div", "prop-service__option", order.pricingModel ? order.pricingModel.label : "Service"),
            price ? text8("div", "prop-service__price", price) : null
          ]),
          StatusBadge({ variant: "status-badge--" + agreement.tone, label: agreement.label, bind: "agreement.stateLabel", state: agreement.stage })
        ]),
        products.length ? h("ul", { "class": "prop-service__lines", "aria-label": "Services" }, products.map(function(name) {
          return text8("li", "prop-service__line", name);
        })) : null
      ]);
    }), [
      h("button", { "class": "link-action prop-service__link", type: "button", "data-action": "agreement.open", "data-id": row.id, "data-visual-id": "property-service-agreement" }, "View agreement \u203A")
    ]));
  }
  function serviceFor(property) {
    if (state.config.dataMode !== "live" || !isModuleEnabled("proposals")) return null;
    var envelope2 = state.moduleData.proposals;
    if (!envelope2 || envelope2.state === "unauthorized" || envelope2.state === "unavailable" || envelope2.state === "error") return null;
    var row = currentServiceAgreement(quotePackage(), property.backendId);
    var entry = row ? row.properties.find(function(item) {
      return item.propertyBackendId === property.backendId;
    }) : null;
    return entry && entry.orders.length ? { row, orders: entry.orders } : null;
  }
  function LiveVisitsCard(property) {
    var found = visitsForProperty(liveVisits(), property.backendId);
    if (!found.next && !found.last) return null;
    var today = localDateKey(/* @__PURE__ */ new Date(), state.config.timeZone);
    return h("section", { "class": "card card--pad prop-visits record-section", "data-module": "property-live-visits", "data-visual-id": "property-live-visits" }, [
      h("h2", { "class": "prop-section__title" }, "Visits"),
      h("div", { "class": "record-list" }, [
        found.next ? VisitRow(found.next, { today, label: "Next visit" }) : null,
        found.last ? VisitRow(found.last, { today, label: "Last visit" }) : null
      ]),
      h("div", { "class": "link-action prop-visits__foot", "data-action": "nav.go", "data-id": "appointments", "data-visual-id": "property-all-visits" }, "All visits \u203A")
    ]);
  }
  function VisitCard(property) {
    var card = h("div", { "class": "card card--pad prop-visits", "data-module": "property-visits", "data-visual-id": "property-visits" }, [
      text8("div", "prop-section__title", "Service")
    ]);
    if (property.appointment) {
      var meta = stateMeta(property.appointment.state);
      card.appendChild(h("div", { "class": "prop-visit", "data-action": "appointments.openVisit", "data-id": property.id, "data-state": property.appointment.state.toLowerCase() }, [
        h("div", { style: "flex:1;min-width:0" }, [
          text8("div", "prop-visit__title", property.appointment.service),
          text8("div", "prop-visit__meta", property.appointment.when)
        ]),
        text8("span", "status-badge status-badge--" + meta.tone, meta.label),
        text8("span", "prop-visit__caret", "\u203A")
      ]));
    } else {
      card.appendChild(text8("div", "prop-visit__meta", "No visit booked. Dispatch happens automatically when your trigger is met."));
    }
    if (property.lastService) {
      card.appendChild(h("div", { "class": "prop-last" }, [
        text8("div", "prop-fact__label", "Last service"),
        text8("div", "prop-visit__meta", property.lastService.service + " \xB7 " + property.lastService.when)
      ]));
    }
    card.appendChild(h("div", { "class": "prop-visits__foot" }, [
      ActionButton({ variant: "btn--ghost", label: "See the whole week", action: "nav.go", id: "appointments", visualId: "property-week" })
    ]));
    return card;
  }
  function BackLink(model) {
    return sectionAvailable(model, "appointments") ? h("div", { "class": "detail-back", "data-action": "nav.go", "data-id": "appointments" }, "\u2039 Back to appointments") : h("div", { "class": "detail-back", "data-action": "nav.go", "data-id": "overview" }, "\u2039 Back to home");
  }
  function facts(property, contract, model, service) {
    var rows2 = [];
    if (sectionAvailable(model, "contracts")) {
      rows2.push({ key: "contract", label: "Contract", value: contract ? "#" + contract.number + " \xB7 " + contract.plan : "Not under contract", action: contract ? "nav.go" : void 0, id: contract ? "proposals.list" : void 0 });
    }
    var area = formatArea(property.areaSqft);
    if (area) rows2.push({ key: "area", label: "Area", value: area });
    if (property.planId) rows2.push({ key: "plan", label: "Plan", value: "Approved" });
    if (service && service.row.agreement.term) rows2.push({ key: "season", label: "Season", value: formatDatePeriod(service.row.agreement.term) });
    if (property.zone) rows2.push({ key: "zone", label: "Service zone", value: zoneLabel(property.zone) });
    var site = quoteSiteFor(property);
    if (site && site.lot) rows2.push({ key: "lot", label: "Lot", value: site.lot + " sq ft" });
    var group = quoteGroupFor(property.quoteSiteId || property.id);
    var listed = group ? (quotePackage() || { pending: [] }).pending.find(function(item) {
      return item.id === group.id;
    }) : null;
    var waiting = listed ? listed.orders.filter(function(order) {
      return order.status === "unseen" || order.status === "viewed";
    }).length : 0;
    if (waiting) {
      rows2.push({
        key: "quotes",
        label: "Quotes",
        value: waiting + (waiting === 1 ? " quote" : " quotes") + " \xB7 awaiting your decision",
        action: "proposal.open",
        id: group.id
      });
    }
    return rows2;
  }
  function PropertySkeleton() {
    return h("div", { "data-module": "property-loading", "data-visual-id": "property-loading", "data-state": "loading", "aria-busy": "true" }, [
      skel("width:124px;height:13px;margin-bottom:16px"),
      h("div", { "class": "prop-head" }, [h("div", { style: "flex:1;min-width:0" }, [skel("width:48%;height:30px;margin-bottom:9px"), skel("width:66%;height:13px")])]),
      h("div", { "class": "card card--pad prop-facts" }, [0, 1].map(function() {
        return h("div", { "class": "prop-fact" }, [skel("width:38%;height:11px;margin-bottom:8px"), skel("width:70%;height:15px")]);
      })),
      skel("height:140px;border-radius:22px")
    ]);
  }
  function contractFor(property) {
    var model = currentOverview();
    var contracts = model && model.contracts || [];
    return contracts.find(function(contract) {
      return contract.number === property.contract;
    }) || null;
  }
  function quoteSiteFor(property) {
    if (!property.quoteSiteId) return null;
    var fixture = currentFixture();
    var sites = fixture && fixture.proposals && fixture.proposals.sites || [];
    return sites.find(function(site) {
      return site.id === property.quoteSiteId;
    }) || null;
  }
  function zoneLabel(zone) {
    return String(zone || "").replace(/^./, function(letter) {
      return letter.toUpperCase();
    });
  }
  function statusTone(status) {
    return { issue: "danger", enroute: "progress", scheduled: "info", monitoring: "scheduled" }[status] || "scheduled";
  }
  function text8(tag, className, value) {
    return h(tag, className ? { "class": className } : null, value == null ? "" : String(value));
  }

  // app-templates/customer-portal/runtime/src/components/proposals/ProposalCard.js
  function ProposalCard(site) {
    var c = computeSite(site);
    var st = proposalStatusMeta()[site.status];
    var sub = site.city.split(",")[0] + " \xB7 " + c.total.toLocaleString() + " sq ft \xB7 " + (site.status === "approved" ? "chose " + proposalPlanName(site.selected) : "3 plans offered");
    var fromPrice = site.status === "declined" ? null : "$" + c.monthly.toLocaleString();
    return h("div", { "class": "proposal-card", "data-module": "proposal-card", "data-visual-id": "proposal-card", "data-action": "proposal.open", "data-id": site.id, "data-state": site.status }, [
      h("div", { "class": "proposal-card__diamond", style: "background:" + st.dot }),
      h("div", { "class": "proposal-card__body" }, [
        h("div", { style: "font-weight:700;font-size:14.5px", "data-bind": "site.addr" }, site.addr),
        h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, sub)
      ]),
      fromPrice ? h("div", { "class": "proposal-card__price" }, [fromPrice, h("span", null, "/mo")]) : null,
      StatusBadge({ variant: st.badge, label: st.label, bind: "site.statusLabel" }),
      h("span", { style: "font-weight:600;font-size:18px;color:#c2c7d0" }, "\u203A")
    ]);
  }

  // app-templates/customer-portal/runtime/src/components/proposals/ContractStates.js
  var READBACK_COPY = {
    view: "We let the provider know you opened this quote, but its current status couldn\u2019t be loaded",
    approve: "Your approval was sent, but the quote\u2019s current status couldn\u2019t be loaded",
    decline: "Your decline was sent, but the quote\u2019s current status couldn\u2019t be loaded",
    agreement: "Your approval was sent, but the agreement\u2019s current status couldn\u2019t be loaded"
  };
  var OUTCOME_COPY = {
    failed: "We couldn\u2019t confirm whether this went through. Refresh the status before trying again.",
    refused: "This decision wasn\u2019t accepted, so nothing was changed.",
    unconfirmed: "Your decision didn\u2019t register \u2014 this is still waiting for it. Nothing else was changed."
  };
  function contractsGate(skeleton) {
    var command = state.contractCommand;
    if (command && command.phase === "readback-failed") return ReadbackFailed(command.kind);
    var envelope2 = state.moduleData.proposals;
    if (!envelope2) return state.moduleStatus.proposals === "error" ? ContractsError() : skeleton();
    if (envelope2.state === "unauthorized") return UnauthorizedState({ scope: "your contracts", backRoute: state.config.defaultRoute });
    if (envelope2.state === "unavailable") return ContractsUnavailable();
    if (envelope2.state === "error") return ContractsError();
    return null;
  }
  function ContractsListSkeleton() {
    var wrap = h("div", { "data-module": "contracts-loading", "data-visual-id": "contracts-loading", "data-state": "loading", "aria-busy": "true" });
    wrap.appendChild(h("div", { "class": "proposals-head" }, [h("div", { "class": "proposals-head__read" }, [skel("width:42%;height:28px;margin-bottom:9px"), skel("width:58%;height:13px")])]));
    wrap.appendChild(skel("height:118px;border-radius:22px;margin-bottom:16px"));
    wrap.appendChild(skel("height:260px;border-radius:24px;margin-bottom:16px"));
    wrap.appendChild(skel("height:190px;border-radius:22px"));
    return wrap;
  }
  function ContractDetailSkeleton() {
    var wrap = h("div", { "data-module": "contracts-loading", "data-visual-id": "contracts-loading", "data-state": "loading", "aria-busy": "true" });
    wrap.appendChild(h("div", { "class": "proposal-detail-head" }, [h("div", { style: "flex:1" }, [skel("width:52%;height:26px;margin-bottom:9px"), skel("width:38%;height:13px")])]));
    wrap.appendChild(skel("height:220px;border-radius:20px;margin-bottom:14px"));
    wrap.appendChild(skel("height:220px;border-radius:20px"));
    return wrap;
  }
  function ContractsNotices(quotes) {
    var partial = quotes.partial || {};
    var notes = [];
    if (partial.agreements) notes.push("Your service agreements couldn\u2019t be loaded, so only your quotes are shown.");
    if (partial.orders) notes.push("Your quotes couldn\u2019t be loaded, so only your service agreements are shown.");
    if (!partial.orders && partial.unreadableOrders) notes.push(partial.unreadableOrders === 1 ? "1 quote listed in your agreements couldn\u2019t be loaded." : partial.unreadableOrders + " quotes listed in your agreements couldn\u2019t be loaded.");
    if (partial.lines) notes.push("Some services on your quotes couldn\u2019t be loaded. Prices and totals shown come from our system as returned.");
    if (partial.truncated) notes.push("Only part of your contract history could be shown.");
    return notes.map(PartialNotice);
  }
  function PartialNotice(text10) {
    return h("div", { "class": "alert-banner alert-banner--partial", "data-module": "contracts-partial", "data-visual-id": "contracts-partial", "data-state": "partial", role: "status" }, [
      h("div", { "class": "alert-banner__icon alert-banner__icon--partial", "aria-hidden": "true" }, "!"),
      h("div", { "class": "alert-banner__body" }, [h("div", { "class": "alert-banner__desc" }, text10)])
    ]);
  }
  function CommandOutcome(phase) {
    if (phase === "conflict") {
      return h("div", { "class": "conflict-banner decision-outcome", "data-module": "command-conflict", "data-visual-id": "command-conflict", "data-state": "conflict", role: "alert" }, [
        h("div", { "class": "conflict-banner__icon" }, "\u21BA"),
        h("div", { "class": "conflict-banner__body" }, [
          h("div", { "class": "decision-outcome__title" }, "This changed since you opened it"),
          h("div", { "class": "decision-outcome__desc" }, "Its current state is shown here. Nothing was sent.")
        ])
      ]);
    }
    if (!OUTCOME_COPY[phase]) return null;
    return DecisionFailure(OUTCOME_COPY[phase], { action: "contracts.refresh", label: "Refresh status" });
  }
  function DecisionFailure(message, retry) {
    return h("div", { "class": "inline-fail decision-outcome", "data-module": "command-failure", "data-visual-id": "command-failure", "data-state": "failed", role: "alert" }, [
      h("span", { "class": "inline-fail__icon", "aria-hidden": "true" }, "!"),
      h("div", { "class": "decision-outcome__body" }, message),
      ActionButton({ variant: "btn--ghost", label: retry.label, action: retry.action, id: retry.id, visualId: "command-retry" })
    ]);
  }
  function PendingNote(text10) {
    return h("div", { "class": "decision-note", "data-module": "command-pending", "data-visual-id": "command-pending", "data-state": "pending", role: "status" }, [
      h("span", { "class": "decision-note__spinner", "aria-hidden": "true" }),
      h("span", null, text10)
    ]);
  }
  function ReadbackFailed(kind) {
    return h("div", { "class": "state-block", "data-module": "contracts-readback-failed", "data-visual-id": "contracts-readback-failed", "data-state": "readback-failed", role: "alert" }, [
      h("div", { "class": "state-block__glyph state-block__glyph--error" }, "\u26A0"),
      h("div", { "class": "state-block__title" }, READBACK_COPY[kind] || READBACK_COPY.approve),
      h("div", { "class": "state-block__desc" }, "Nothing is shown until it loads, so you never see an out-of-date status."),
      ActionButton({ variant: "btn--primary", label: "Try again", action: "contracts.refresh", visualId: "contracts-readback-retry" })
    ]);
  }
  function ContractsError() {
    return ErrorState({ title: "Couldn\u2019t load your contracts", desc: "Nothing was changed. Check your connection and try again." });
  }
  function ContractsUnavailable() {
    var block = EmptyState({ glyph: "\u25CB", title: "Contracts aren\u2019t in the portal yet", desc: "Your quotes and service agreements can\u2019t be shown here yet." });
    block.setAttribute("data-state", "unavailable");
    block.setAttribute("data-module", "contracts-unavailable");
    return block;
  }

  // app-templates/customer-portal/runtime/src/components/proposals/QuoteOptionCard.js
  function QuoteOptionCard(order, options2) {
    var settings = options2 || {};
    var meta = QUOTE_STATUS[order.status];
    var label = order.pricingModel ? order.pricingModel.label : "Quote";
    var card = h("article", {
      "class": "card card--pad quote-option",
      "data-module": "quote-option",
      "data-visual-id": "quote-option",
      "data-state": order.status,
      "aria-label": label + " \u2014 " + meta.label
    }, [
      h("div", { "class": "quote-option__head" }, [
        h("h3", { "class": "quote-option__model" }, label),
        StatusBadge({ variant: meta.badge, label: meta.label, bind: "quote.statusLabel", state: order.status })
      ]),
      QuoteLines(order),
      QuoteMoney(order)
    ]);
    if (settings.interactive) {
      var decisions = QuoteDecisions(order, settings);
      if (decisions) card.appendChild(decisions);
    }
    return card;
  }
  function QuoteLines(order) {
    if (order.linesState === "unavailable") {
      return h("div", { "class": "quote-option__note", "data-module": "quote-lines", "data-state": "unavailable" }, "The services on this quote couldn\u2019t be loaded.");
    }
    if (!order.lines.length) {
      return h("div", { "class": "quote-option__note", "data-module": "quote-lines", "data-state": "empty" }, "No services are listed on this quote.");
    }
    var list = h("div", { "class": "purch-lines quote-lines", "data-module": "quote-lines", "data-visual-id": "quote-lines", "data-state": order.linesState, role: "list", "aria-label": "Services" }, order.lines.map(function(line) {
      var detail = line.quantity && line.unitPrice ? line.quantity + " \xD7 " + line.unitPrice : line.unitPrice || (line.quantity ? "Quantity " + line.quantity : "");
      return h("div", { "class": "purch-line quote-line", "data-line": line.key, role: "listitem" }, [
        h("div", { "class": "quote-line__body" }, [
          h("div", { "class": "purch-line__title" + (line.product ? "" : " quote-line__title--unnamed") }, line.product || "Unnamed service"),
          detail ? h("div", { "class": "purch-line__meta" }, detail) : null
        ]),
        line.total ? h("div", { "class": "purch-line__side" }, h("b", null, line.total)) : null
      ]);
    }));
    if (order.linesState !== "partial") return list;
    return h("div", null, [list, h("div", { "class": "quote-option__note", "data-state": "partial" }, "Some details of these services couldn\u2019t be loaded.")]);
  }
  function QuoteMoney(order) {
    if (!order.money) {
      return h("div", { "class": "quote-option__note", "data-module": "quote-totals", "data-state": "unpriced" }, "No price is stated on this quote yet.");
    }
    var rows2 = order.money.taxFree ? [] : [["Subtotal", order.money.subtotal, "subtotal"], ["Taxes", order.money.taxes, "taxes"]].filter(function(row) {
      return !!row[1];
    });
    var wrap = h("div", { "class": "money-rows quote-totals", "data-module": "quote-totals", "data-visual-id": "quote-totals" }, rows2.map(function(row) {
      return h("div", { "class": "money-rows__row", "data-kind": row[2] }, [h("span", null, row[0]), h("span", null, row[1])]);
    }));
    if (order.money.total) {
      var period = pricePeriod(order);
      wrap.appendChild(h("div", { "class": "money-rows__row money-rows__row--total", "data-kind": "total" }, [h("span", null, "Total"), h("span", null, period ? order.money.total + " " + period : order.money.total)]));
    }
    return wrap;
  }
  function QuoteDecisions(order, settings) {
    var command = state.contractCommand;
    var targeted = !!command && command.targets.indexOf(order.backendId) !== -1;
    var outcome = targeted && command.phase !== "pending" ? CommandOutcome(command.phase) : null;
    var busy = !!settings.busy;
    if (order.status === "unseen") {
      var view = state.quoteViews[order.backendId];
      if (view === "failed") {
        return h("div", { "class": "quote-option__decide" }, DecisionFailure(
          "We couldn\u2019t let the provider know you opened this quote, so its decisions aren\u2019t available yet.",
          { action: "quote.retryView", id: String(order.backendId), label: "Try again" }
        ));
      }
      return h("div", { "class": "quote-option__decide" }, PendingNote("Letting the provider know you opened this quote\u2026"));
    }
    if (order.status !== "viewed") return outcome ? h("div", { "class": "quote-option__decide" }, outcome) : null;
    var confirm = state.contractConfirm;
    var confirming = !!confirm && confirm.backendId === order.backendId && (confirm.kind === "approve" || confirm.kind === "decline");
    var section = h("div", { "class": "quote-option__decide" });
    if (confirming) section.appendChild(DecisionConfirm(confirm.kind, order, settings, targeted && command.phase === "pending"));
    else {
      section.appendChild(h("div", { "class": "proposal-actions" }, [
        ActionButton({ variant: "btn--primary", label: "Approve", action: "quote.approve", id: String(order.backendId), lg: true, disabled: busy, visualId: "quote-approve" }),
        ActionButton({ variant: "btn--danger", label: "Decline", action: "quote.decline", id: String(order.backendId), lg: true, disabled: busy, visualId: "quote-decline" })
      ]));
    }
    if (outcome) section.appendChild(outcome);
    return section;
  }
  function DecisionConfirm(kind, order, settings, pending) {
    var label = order.pricingModel ? order.pricingModel.label : "this option";
    var titleId = "decision-title-" + order.backendId;
    var body = kind === "approve" ? settings.siblingsOpen ? "Approving it declines the other options for this property." : "" : "A declined option can\u2019t be approved later.";
    var confirmButton = ActionButton({
      variant: kind === "approve" ? "btn--primary" : "btn--danger",
      label: pending ? "Sending\u2026" : kind === "approve" ? "Confirm approval" : "Confirm decline",
      action: "quote.confirm",
      id: String(order.backendId),
      lg: true,
      disabled: pending || settings.busy,
      visualId: "quote-confirm"
    });
    if (pending) confirmButton.setAttribute("data-state", "pending");
    return h("div", { "class": "decision-confirm", "data-module": "decision-confirm", "data-visual-id": "decision-confirm", "data-state": pending ? "pending" : "open", "data-kind": kind, role: "group", "aria-labelledby": titleId }, [
      h("p", { "class": "decision-confirm__title", id: titleId }, kind === "approve" ? "Approve " + label + " for this property?" : "Decline " + label + "?"),
      body ? h("p", { "class": "decision-confirm__body" }, body) : null,
      h("div", { "class": "proposal-actions" }, [
        confirmButton,
        ActionButton({ variant: "btn--ghost", label: "Cancel", action: "quote.cancel", lg: true, disabled: pending, visualId: "quote-cancel" })
      ])
    ]);
  }

  // app-templates/customer-portal/runtime/src/components/profile/StatCard.js
  function statCard(label, num2, color) {
    return h("div", { "class": "stat-card", "data-module": "stat-card" }, [
      h("div", { "class": "stat-card__label" }, label),
      h("div", { "class": "stat-card__num", style: color ? "color:" + color : "" }, num2)
    ]);
  }

  // app-templates/customer-portal/runtime/src/routes/ProfilePage.js
  function Profile() {
    var fixture = currentFixture();
    var v = currentTheme();
    var c = fixture.customer;
    var page = h("section", { "class": "page page--narrow", "data-route": "profile", "data-visual-id": "profile" });
    page.appendChild(h("div", { "class": "profile-hero", "data-module": "profile-hero", "data-visual-id": "profile-hero" }, [
      h("div", { "class": "profile-hero__avatar" }),
      h("div", { style: "flex:1" }, [
        h("div", { "class": "profile-hero__name", "data-bind": "customer.fullName" }, c.fullName),
        h("div", { "class": "profile-hero__meta" }, c.phone + " \xB7 " + c.email),
        h("span", { "class": "profile-hero__badge" }, v.plan.name + " member \xB7 since " + c.memberSince)
      ]),
      ActionButton({ variant: "btn--onaccent", label: "Manage plan", action: "profile.managePlan", visualId: "manage-plan" })
    ]));
    page.appendChild(h("div", { "class": "stats-grid", "data-module": "profile-stats" }, [
      statCard("Orders", c.stats.orders, null),
      statCard("Spent this year", c.stats.spent, null),
      statCard("Plan savings", c.stats.savings, "var(--ok)")
    ]));
    var history = state.profileFilter === "all" ? state.orders : state.orders.filter(function(o) {
      return o.status === state.profileFilter;
    });
    var hist = h("div", { "class": "list-panel", "data-module": "order-list", "data-visual-id": "profile-history" }, [
      h("div", { "class": "list-panel__head" }, [
        h("div", { "class": "list-panel__title", style: "margin-right:4px" }, "Order history"),
        Tabs({ items: [
          { key: "all", label: "All" },
          { key: "inprogress", label: "Active" },
          { key: "scheduled", label: "Scheduled" },
          { key: "completed", label: "Done" }
        ], active: state.profileFilter, action: "profile.filter" })
      ])
    ]);
    var histList = h("div", { style: "display:flex;flex-direction:column" });
    if (history.length === 0) histList.appendChild(EmptyState({ glyph: "\u{1F5D3}", title: "Nothing here", desc: "No orders in this filter." }));
    else history.forEach(function(o) {
      histList.appendChild(OrderCard(o));
    });
    hist.appendChild(histList);
    page.appendChild(hist);
    var addrPanel = h("div", { "class": "list-panel" }, [
      h("div", { "class": "list-panel__head" }, [
        h("div", { "class": "list-panel__title", style: "flex:1" }, "Saved addresses"),
        h("div", { "class": "link-action", "data-action": "profile.addAddress" }, "+ Add address")
      ])
    ]);
    var addrList = h("div", { style: "display:flex;flex-direction:column;gap:10px" });
    fixture.addresses.forEach(function(a) {
      var isDefault = a.id === state.addrId;
      addrList.appendChild(h("div", { "class": "saved-row", "data-module": "address-card", "data-visual-id": "profile-address" }, [
        h("div", { "class": "saved-row__icon", style: "background:" + a.iconBg }, h("i", { style: "background:" + a.dot })),
        h("div", { "class": "saved-row__body" }, [
          h("div", { style: "display:flex;align-items:center;gap:8px" }, [
            h("div", { style: "font-weight:600;font-size:14px" }, a.label),
            isDefault ? h("span", { "class": "default-tag" }, "Default") : null
          ]),
          h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, a.line + " \xB7 " + a.city)
        ]),
        isDefault ? h("div", { "class": "link-action", style: "color:var(--ink-3)", "data-action": "profile.updateAddress", "data-id": a.id }, "Edit") : h("div", { "class": "link-action", "data-action": "profile.setDefaultAddress", "data-id": a.id }, "Make default")
      ]));
    });
    addrPanel.appendChild(addrList);
    page.appendChild(addrPanel);
    var payPanel = h("div", { "class": "list-panel" }, [
      h("div", { "class": "list-panel__head" }, [
        h("div", { "class": "list-panel__title", style: "flex:1" }, "Payment methods"),
        h("div", { "class": "link-action", "data-action": "profile.addCard" }, "+ Add card")
      ])
    ]);
    var payList = h("div", { style: "display:flex;flex-direction:column;gap:10px" });
    fixture.cards.forEach(function(cd) {
      var isDefault = cd.id === state.payId;
      payList.appendChild(h("div", { "class": "saved-row", "data-module": "payment-method-card", "data-visual-id": "profile-card" }, [
        h("div", { "class": "card-chip card-chip--lg" }),
        h("div", { "class": "saved-row__body" }, [
          h("div", { style: "display:flex;align-items:center;gap:8px" }, [
            h("div", { style: "font-weight:600;font-size:14px" }, cd.brand + " \xB7\xB7\xB7\xB7 " + cd.last4),
            isDefault ? h("span", { "class": "default-tag" }, "Default") : null
          ]),
          h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, "Expires " + cd.exp)
        ]),
        isDefault ? null : h("div", { "class": "link-action", "data-action": "profile.setDefaultPayment", "data-id": cd.id }, "Make default")
      ]));
    });
    payPanel.appendChild(payList);
    page.appendChild(payPanel);
    var prefs = [
      { key: "receipts", title: "Email receipts", desc: "Invoice & payment confirmations" },
      { key: "sms", title: "SMS appointment updates", desc: "Appointment reminders and arrival alerts" },
      { key: "marketing", title: "Offers & tips", desc: (currentTheme().copy || {}).marketingPref || "Wellness rituals, products and seasonal offers" }
    ];
    var prefPanel = h("div", { "class": "list-panel", "data-module": "preferences" }, [h("div", { "class": "list-panel__title", style: "margin-bottom:16px" }, "Notifications")]);
    prefs.forEach(function(p) {
      prefPanel.appendChild(h("div", { "class": "pref-row" }, [
        h("div", { style: "flex:1" }, [
          h("div", { style: "font-weight:600;font-size:14px" }, p.title),
          h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, p.desc)
        ]),
        Toggle(state.prefs[p.key], p.key)
      ]));
    });
    page.appendChild(prefPanel);
    page.appendChild(h("div", { "class": "signout-btn", "data-action": "auth.signOut", "data-visual-id": "sign-out" }, "Sign out"));
    return page;
  }

  // app-templates/customer-portal/runtime/src/routes/ActivityPage.js
  function Activity() {
    var fixture = currentFixture();
    var page = h("section", { "class": "page", style: "max-width:760px", "data-route": "activity", "data-visual-id": "activity" });
    page.appendChild(h("div", { "class": "activity-head" }, [
      h("div", { style: "flex:1" }, [
        h("div", { style: "font-weight:800;font-size:28px;line-height:1.15;letter-spacing:-.025em" }, "Activity"),
        h("div", { style: "font-size:14.5px;color:var(--ink-2);margin-top:3px" }, "Your appointments, orders and account updates, newest first.")
      ]),
      h("div", { "class": "tab", "data-action": "activity.markRead", "data-visual-id": "mark-read" }, "Mark all read")
    ]));
    page.appendChild(h(
      "div",
      { "class": "tabs", style: "margin:0 4px 18px", "data-module": "activity-filter" },
      fixture.feedTabs.map(function(t) {
        return h("span", { "class": "tab" + (t.key === state.feedFilter ? " tab--active" : ""), "data-action": "activity.filter", "data-id": t.key }, t.label);
      })
    ));
    var groups = fixture.activity.map(function(g) {
      return { day: g.day, items: g.items.filter(function(ev) {
        return state.feedFilter === "all" || ev.type === state.feedFilter;
      }) };
    }).filter(function(g) {
      return g.items.length;
    });
    if (groups.length === 0) {
      page.appendChild(EmptyState({ glyph: "\u{1F514}", title: "Nothing here", desc: "No activity in this filter yet." }));
      return page;
    }
    groups.forEach(function(g) {
      page.appendChild(h("div", { "class": "feed-day" }, g.day));
      var group = h("div", { "class": "feed-group", "data-module": "activity-feed" }, [h("div", { "class": "feed-line" })]);
      g.items.forEach(function(ev) {
        var card = h("div", { "class": "feed-card" }, [
          h("div", { style: "flex:1;min-width:0" }, [
            h("div", { style: "display:flex;align-items:center;gap:8px" }, [
              h("div", { style: "font-weight:700;font-size:14.5px" }, ev.title),
              ev.unread ? h("span", { "class": "unread-dot" }) : null
            ]),
            h("div", { style: "font-size:13px;line-height:1.45;color:var(--ink-2);margin-top:2px" }, ev.desc)
          ]),
          h("div", { "class": "feed-time" }, ev.time),
          ev.action ? h("div", { "class": "feed-action", "data-action": "activity.act", "data-id": ev.act }, ev.action) : null
        ]);
        group.appendChild(h("div", { "class": "feed-item", "data-module": "activity-item", "data-visual-id": "activity-item" }, [
          h("div", { "class": "feed-item__icon", style: "background:" + ev.iconBg }, h("i", { style: "background:" + ev.dot })),
          card
        ]));
      });
      page.appendChild(group);
    });
    return page;
  }

  // app-templates/customer-portal/runtime/src/routes/SupportPage.js
  function Support() {
    var fixture = currentFixture();
    var support = fixture.support;
    var page = h("section", { "class": "page", "data-route": "support", "data-visual-id": "support" });
    page.appendChild(h("div", { "class": "section-head" }, [
      h("div", { "class": "section-head__title" }, "How can we help, " + fixture.customer.firstName + "?"),
      h("div", { "class": "section-head__sub" }, support.intro || "Chat with the " + support.label + " team about your appointment, products or account.")
    ]));
    var grid = h("div", { "class": "support-grid" });
    var rail = h("div", { "class": "help-rail" });
    var helpPanel = h("div", { "class": "help-panel", "data-module": "help-rail", "data-visual-id": "help-rail" }, [
      h("div", { "class": "help-search" }, "Search help articles\u2026"),
      h("div", { style: "font-weight:700;font-size:14px;margin-bottom:12px" }, "Common topics")
    ]);
    var topics = h("div", { style: "display:flex;flex-direction:column;gap:9px" });
    fixture.helpTopics.forEach(function(t) {
      topics.appendChild(h("div", { "class": "help-topic", "data-module": "help-topic", "data-action": "support.helpTopic", "data-id": t.q }, [
        h("div", { "class": "help-topic__icon", style: "background:" + t.iconBg }, h("i", { style: "background:" + t.dot })),
        h("div", { style: "flex:1;font-weight:600;font-size:13px" }, t.label),
        h("div", { style: "color:#b7bcc7;font-size:16px" }, "\u203A")
      ]));
    });
    helpPanel.appendChild(topics);
    rail.appendChild(helpPanel);
    rail.appendChild(h("div", { "class": "call-card", "data-module": "call-card" }, [
      h("div", { style: "font-weight:700;font-size:15px" }, "Prefer to talk?"),
      h("div", { style: "font-size:13px;line-height:1.5;opacity:.7;margin-top:5px" }, "Call the studio team during opening hours, or send us a message here."),
      h("div", { "class": "call-card__btns" }, [
        h("div", { "class": "call-card__btn call-card__btn--solid", "data-action": "support.call" }, "Call now"),
        h("div", { "class": "call-card__btn call-card__btn--ghost", "data-action": "support.email" }, "Email")
      ])
    ]));
    grid.appendChild(rail);
    var thread = h("div", { "class": "chat-thread", "data-module": "chat-thread", "data-visual-id": "chat-thread" }, [h("div", { "class": "chat-day" }, "Today")]);
    state.messages.forEach(function(m) {
      var user = m.from === "user";
      thread.appendChild(h(
        "div",
        { "class": "msg-row " + (user ? "msg-row--user" : "msg-row--agent") },
        h("div", { "class": "msg-bubble " + (user ? "msg-bubble--user" : "msg-bubble--agent") }, m.text)
      ));
    });
    if (state.typing) thread.appendChild(h("div", { "class": "msg-row msg-row--agent" }, h("div", { "class": "typing" }, [
      h("span", { "class": "typing-dot" }),
      h("span", { "class": "typing-dot", style: "animation-delay:.2s" }),
      h("span", { "class": "typing-dot", style: "animation-delay:.4s" })
    ])));
    var quick = h("div", { "class": "quick-replies" }, fixture.quickReplies.map(function(q) {
      return h("span", { "class": "quick-reply", "data-action": "support.quickReply", "data-id": q }, q);
    }));
    var input = h("input", { "class": "composer__input", placeholder: "Type a message\u2026", value: state.chatInput, "aria-label": "Message" });
    input.addEventListener("input", function() {
      state.chatInput = input.value;
    });
    input.addEventListener("keydown", function(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        composer.querySelector('[data-action="support.sendMessage"]').click();
      }
    });
    var commandError = state.commandErrors["support.sendMessage:_"];
    var composer = h("div", {
      "class": "composer",
      "data-module": "chat-composer",
      "data-visual-id": "chat-composer",
      style: commandError ? "position:relative;padding-bottom:38px" : void 0
    }, [
      h("div", { "class": "composer__add" }, "+"),
      input,
      h("button", { "class": "composer__send", "data-action": "support.sendMessage", "aria-label": "Send" }, "\u2191")
    ]);
    if (commandError) {
      composer.appendChild(h("div", {
        "class": "composer__error",
        "data-state": "validation-error",
        "data-command-error": "support.sendMessage:_",
        "role": "alert",
        style: "position:absolute;left:64px;right:64px;bottom:8px;color:var(--danger);font-size:12px"
      }, commandError));
    }
    var panel = h("div", { "class": "chat-panel", "data-module": "chat-panel", "data-visual-id": "chat-panel" }, [
      h("div", { "class": "chat-header" }, [
        h("div", { "class": "chat-avatar" }, [h("div", { "class": "chat-avatar__img" }), h("span", { "class": "online-dot" })]),
        h("div", { style: "flex:1" }, [
          h("div", { style: "font-weight:700;font-size:15px" }, currentFixture().support.agentName + " \xB7 " + currentFixture().support.label),
          h("div", { style: "font-size:12.5px;color:var(--ok)" }, "Online now")
        ]),
        h("div", { "class": "chat-ticket" }, "Ticket #" + currentFixture().support.ticket)
      ]),
      thread,
      quick,
      composer
    ]);
    grid.appendChild(panel);
    page.appendChild(grid);
    return page;
  }

  // app-templates/customer-portal/runtime/src/routes/ProposalDetailPage.js
  function noteBox(title, body) {
    return h("div", { "class": "note-box" }, [
      h("div", { style: "font-weight:700;font-size:12.5px" }, title),
      h("div", { style: "font-size:12px;line-height:1.45;color:var(--ink-2);margin-top:3px" }, body)
    ]);
  }
  function beamMap() {
    var rects = [
      "left:30%;top:34%;width:42%;height:34%;background:rgba(60,70,90,.45);border-radius:4px",
      "left:6%;top:20%;width:18%;height:62%;background:rgba(52,199,89,.45);border:1.5px solid #34c759;border-radius:3px",
      "left:30%;top:74%;width:42%;height:13%;background:rgba(255,214,10,.5);border:1.5px solid #ffd60a;border-radius:3px",
      "left:74%;top:22%;width:18%;height:40%;background:rgba(255,107,74,.42);border:1.5px solid #ff6b4a;border-radius:3px",
      "left:30%;top:24%;width:42%;height:7%;background:rgba(58,144,255,.45);border:1.5px solid #2f7be0;border-radius:3px",
      "left:6%;top:86%;width:86%;height:7%;background:rgba(199,125,255,.4);border:1.5px solid #c77dff;border-radius:3px"
    ];
    var map = h("div", { "class": "beam-map" }, [
      h("span", { "class": "beam-map__label", style: "top:13px;left:15px" }, "Beam AI \xB7 aerial property report")
    ]);
    rects.forEach(function(s) {
      map.appendChild(h("div", { style: "position:absolute;" + s }));
    });
    map.appendChild(h("span", { "class": "beam-map__label", style: "bottom:11px;left:15px" }, "licensed via ibeam.ai \u2014 drops in here"));
    return map;
  }
  function ProposalDetail() {
    if (state.config.dataMode === "live" || quotePackage()) return QuoteDetail();
    var v = currentTheme();
    var p = currentSite();
    var c = computeSite(p);
    var st = proposalStatusMeta()[p.status];
    var page = h("section", { "class": "page page--narrow", "data-route": "proposal.detail", "data-visual-id": "proposal-detail", "data-state": p.status });
    page.appendChild(h("div", { "class": "detail-back", "data-action": "proposal.review", "data-visual-id": "proposal-back" }, "\u2039 Back to proposal"));
    page.appendChild(h("div", { "class": "proposal-detail-head" }, [
      h("div", { style: "flex:1" }, [
        h("div", { "class": "proposal-detail-head__title", "data-bind": "site.addr" }, p.addr),
        h("div", { "class": "proposal-detail-head__meta" }, p.city + " " + p.postal + " \xB7 lot " + p.lot + " sq ft")
      ]),
      StatusBadge({ variant: st.badge, label: st.label, bind: "site.statusLabel" })
    ]));
    var side = h("div", { "class": "beam-side" }, [
      h("div", { style: "display:flex;justify-content:space-between;align-items:baseline;margin-bottom:11px" }, [
        h("span", { style: "font-weight:700;font-size:14px" }, "Measured surfaces"),
        h("span", { style: "font-size:11.5px;color:var(--ink-3)" }, "serviceable")
      ])
    ]);
    c.rows.forEach(function(su) {
      side.appendChild(h("div", { "class": "surface-row" }, [
        h("span", { "class": "surface-swatch", style: "background:" + su.color }),
        h("span", { style: "flex:1;font-weight:590;font-size:13px" }, su.name),
        h("span", { style: "font-weight:700;font-size:13px;white-space:nowrap" }, [su.area, " ", h("span", { style: "color:var(--ink-3);font-weight:500" }, "sq ft")])
      ]));
    });
    side.appendChild(h("div", { "class": "beam-total" }, [
      h("span", { style: "font-weight:700;font-size:13.5px" }, "Total serviceable"),
      h("span", { style: "font-weight:800;font-size:16px;color:var(--accent)" }, c.total.toLocaleString() + " sq ft")
    ]));
    page.appendChild(h(
      "div",
      { "class": "beam-report", "data-module": "beam-report", "data-visual-id": "beam-report" },
      h("div", { "class": "beam-report__grid" }, [beamMap(), side])
    ));
    var comp = ProposalComparison(p, c);
    page.appendChild(comp.el);
    page.appendChild(h("div", { style: "margin:0 4px 12px" }, [
      h("div", { style: "font-weight:800;font-size:19px;letter-spacing:-.01em" }, v.prop.svc + " \u2014 choose your plan"),
      h("div", { style: "font-size:13px;color:var(--ink-2);margin-top:3px" }, "Approving one option declines the other two. Request a revision and we\u2019ll re-quote all three.")
    ]));
    var plans2 = [
      { id: "897", name: "Flex Service Plan", tag: "Pay-as-you-go \xB7 Order #34897", isFlex: true, desc: "Best for smaller or low-exposure sites. Billed per service at the rates above." },
      { id: "898", name: "Seasonal Unlimited Coverage", tag: "Order #34898", badge: "MOST SELECTED", priceMain: comp.monthlyStr, priceSub: "/ mo \xD7 5 \xB7 " + v.prop.months, desc: "Predictable budget, full-season protection. " + v.prop.unlimDesc + " GPS logs + photos after every visit." },
      { id: "899", name: "Season-Lock Prepaid", tag: "Order #34899", badge: "BEST VALUE", badgeGreen: true, priceMain: comp.lockStr, priceSub: "one-time \xB7 season", desc: "Maximum cost certainty for the whole season. 10% saving vs. monthly. " + v.prop.unlimDesc }
    ];
    plans2.forEach(function(pl) {
      var sel = pl.id === p.selected;
      var opt = h("div", { "class": "plan-option" + (sel ? " plan-option--sel" : ""), "data-module": "plan-option", "data-visual-id": "plan-option", "data-action": "proposal.selectPlan", "data-id": pl.id, "data-state": sel ? "selected" : void 0 });
      if (pl.badge) opt.appendChild(h("span", { "class": "plan-badge2" + (pl.badgeGreen ? " plan-badge2--green" : "") }, pl.badge));
      opt.appendChild(h("div", { "class": "plan-radio" + (sel ? " plan-radio--sel" : "") }, sel ? h("i") : null));
      opt.appendChild(h("div", { "class": "plan-option__body" }, [
        h("div", { "class": "plan-option__head" }, [
          h("span", { style: "font-weight:700;font-size:15.5px" }, pl.name),
          h("span", { style: "font-size:12px;color:var(--ink-3)" }, pl.tag)
        ]),
        h("div", { style: "font-size:13px;line-height:1.5;color:var(--ink-2);margin-top:4px" }, pl.desc)
      ]));
      var price = h("div", { "class": "plan-option__price" });
      if (pl.isFlex) {
        price.appendChild(h("div", { style: "font-weight:800;font-size:17px" }, [c.clearStr, h("span", { style: "font-weight:500;font-size:12.5px;color:var(--ink-3)" }, " " + v.prop.unitA)]));
        price.appendChild(h("div", { style: "font-weight:800;font-size:17px" }, [c.deiceStr, h("span", { style: "font-weight:500;font-size:12.5px;color:var(--ink-3)" }, " " + v.prop.unitB)]));
      } else {
        price.appendChild(h("div", { style: "font-weight:800;font-size:19px" }, pl.priceMain));
        price.appendChild(h("div", { style: "font-size:12px;color:var(--ink-2)" }, pl.priceSub));
      }
      opt.appendChild(price);
      page.appendChild(opt);
    });
    var decided = p.status === "approved" || p.status === "revision" || p.status === "declined";
    if (decided) {
      page.appendChild(h("div", { "class": "proposal-decided" }, [
        h("div", { "class": "proposal-decided__icon" }, "i"),
        h("div", { style: "font-size:13px;line-height:1.45;color:var(--ink-2)" }, proposalDecisionNote(p))
      ]));
    }
    var selId = p.selected || "898";
    page.appendChild(h("div", { "class": "proposal-actions" }, [
      ActionButton({ variant: "btn--primary", label: "Approve " + proposalPlanName(selId), action: "proposal.approve", block: true, lg: true, visualId: "proposal-approve" }),
      ActionButton({ variant: "btn--ghost", label: "Request revision", action: "proposal.requestRevision", lg: true, visualId: "proposal-revise" }),
      ActionButton({ variant: "btn--danger", label: "Decline", action: "proposal.decline", lg: true, visualId: "proposal-decline" })
    ]));
    return page;
  }
  function QuoteDetail() {
    var page = h("section", { "class": "page page--narrow", "data-route": "proposal.detail", "data-visual-id": "proposal-detail" });
    page.appendChild(h("div", { "class": "detail-back", "data-action": "proposal.review", "data-visual-id": "proposal-back" }, "\u2039 Back to your contracts"));
    var gate = contractsGate(ContractDetailSkeleton);
    if (gate) {
      page.setAttribute("data-state", gate.getAttribute("data-state") || "loading");
      page.appendChild(gate);
      return page;
    }
    var group = quoteGroupFor(state.currentSiteId);
    if (!group) {
      page.setAttribute("data-state", "not-found");
      page.appendChild(NotFoundState({ noun: "quote", backLabel: "contracts", backRoute: "proposals.list" }));
      return page;
    }
    scheduleQuoteViews(group);
    var status = QUOTE_STATUS[group.status];
    var busy = contractCommandsBusy();
    page.setAttribute("data-state", group.status);
    var facts2 = [group.address].filter(Boolean);
    page.appendChild(h("div", { "class": "proposal-detail-head", "data-module": "quote-detail-head", "data-visual-id": "quote-detail-head" }, [
      h("div", { style: "flex:1;min-width:0" }, [
        h("h1", { "class": "proposal-detail-head__title", "data-bind": "quote.property" }, group.title),
        facts2.length ? h("div", { "class": "proposal-detail-head__meta" }, facts2.join(" \xB7 ")) : null
      ]),
      StatusBadge({ variant: status.badge, label: status.label, bind: "quote.groupStatus", state: group.status })
    ]));
    var agreement = group.agreement;
    if (agreement && agreement.stage !== "preparing") {
      page.appendChild(h("button", { "class": "quote-package-link", "data-module": "quote-package-link", "data-visual-id": "quote-package-link", "data-action": "agreement.open", "data-id": agreement.id }, [
        h("span", { "class": "quote-package-link__label" }, "Part of your service agreement"),
        StatusBadge({ variant: "status-badge--" + agreement.tone, label: agreement.label, bind: "agreement.stateLabel", state: agreement.stage }),
        h("span", { "class": "proposal-card__chev", "aria-hidden": "true" }, "\u203A")
      ]));
    }
    if (group.orders.some(function(order) {
      return order.linesState !== "ready";
    })) {
      page.appendChild(PartialNotice("Some services on these quotes couldn\u2019t be loaded. Prices and totals shown come from our system as returned."));
    }
    var note = decisionNote(group);
    if (note) {
      page.appendChild(h("div", { "class": "proposal-decided", "data-module": "quote-decided", "data-state": group.decision }, [
        h("div", { "class": "proposal-decided__icon" }, "i"),
        h("div", { style: "font-size:13px;line-height:1.45;color:var(--ink-2)" }, note)
      ]));
    }
    var open = group.orders.filter(function(order) {
      return order.status === "unseen" || order.status === "viewed";
    });
    var list = h("div", { "class": "quote-options", "data-module": "quote-options", "data-visual-id": "quote-options" });
    group.orders.forEach(function(order) {
      list.appendChild(QuoteOptionCard(order, {
        interactive: true,
        busy,
        siblingsOpen: open.some(function(other) {
          return other.backendId !== order.backendId;
        })
      }));
    });
    page.appendChild(list);
    if (open.length) {
      page.appendChild(h("div", { "class": "proposal-footer", "data-module": "quote-detail-footer", "data-visual-id": "quote-detail-footer" }, [
        h("div", { "class": "proposal-footer__icon" }, "\u2726"),
        h("div", { "class": "proposal-footer__copy" }, "Approving one option for this property declines its other options.")
      ]));
    }
    var location = PropertyLocation({ property: quotedProperty(group), map: sharedPropertyMap(), viewport: mapViewport() });
    if (location) page.appendChild(location);
    return page;
  }
  function quotedProperty(group) {
    return group.property || { id: group.id, name: group.title, address: group.address, lat: null, lon: null };
  }
  function decisionNote(group) {
    if (group.decision === "approved") {
      var approved = group.orders.find(function(order) {
        return order.status === "approved";
      });
      var name = approved && approved.pricingModel ? approved.pricingModel.label : "an option";
      var others = group.orders.filter(function(order) {
        return order !== approved;
      });
      var allDeclined = others.length > 0 && others.every(function(order) {
        return order.status === "declined";
      });
      return "You approved " + name + "." + (allDeclined ? " The other options for this property are declined." : "");
    }
    if (group.decision === "revision") return "You asked for changes to these quotes. Our team is reviewing your request.";
    if (group.decision === "declined") return "You declined the quotes for this property.";
    return "";
  }
  function proposalDecisionNote(p) {
    var note = p.status === "approved" ? "You approved " + proposalPlanName(p.selected) + "." : p.status === "revision" ? "Revision requested \u2014 our team will re-quote all three options." : "You declined this proposal.";
    return note + " You can still change your decision below.";
  }

  // app-templates/customer-portal/runtime/src/components/proposals/ProposalComparison.js
  function ProposalComparison(site, c) {
    var v = currentTheme();
    var seasonStr = "$" + (Math.round(c.unlim / 25) * 25).toLocaleString();
    var monthlyStr = "$" + c.monthly.toLocaleString();
    var lockStr = "$" + c.seasonLock.toLocaleString();
    var table = h("div", { "class": "pricing-table", "data-module": "proposal-comparison", "data-visual-id": "proposal-comparison" });
    table.appendChild(h("div", { "class": "pt-title" }, [
      h("span", { style: "font-weight:800;font-size:16px;letter-spacing:-.01em" }, "Pricing from measured area"),
      h("span", { style: "font-size:12px;color:var(--ink-3)" }, "rate \xD7 Beam AI surface \xB7 per visit")
    ]));
    table.appendChild(h("div", { "class": "pt-grid pt-head" }, [
      h("div", null, "Surface"),
      h("div", { style: "text-align:right" }, "Area"),
      h("div", { style: "text-align:right", "data-bind": "prop.colA" }, v.prop.colA),
      h("div", { style: "text-align:right", "data-bind": "prop.colB" }, v.prop.colB)
    ]));
    c.rows.forEach(function(su) {
      table.appendChild(h("div", { "class": "pt-grid pt-row" }, [
        h("div", { style: "display:flex;align-items:center;gap:9px" }, [h("span", { "class": "surface-swatch", style: "background:" + su.color }), su.name]),
        h("div", { style: "text-align:right;color:var(--ink-2)" }, su.area),
        h("div", { style: "text-align:right;font-weight:600" }, [su.clear, " ", h("span", { style: "color:var(--ink-3);font-weight:500;font-size:11px" }, su.clearRate)]),
        h("div", { style: "text-align:right;font-weight:600" }, [su.deice, " ", h("span", { style: "color:var(--ink-3);font-weight:500;font-size:11px" }, su.deiceRate)])
      ]));
    });
    table.appendChild(h("div", { "class": "pt-grid pt-row", style: "color:var(--ink-2)" }, [
      h("div", null, "Site mobilization"),
      h("div", { style: "text-align:right" }, "\u2014"),
      h("div", { style: "text-align:right;font-weight:600;color:var(--ink)" }, "$" + F.MOB_CLEAR),
      h("div", { style: "text-align:right;font-weight:600;color:var(--ink)" }, "$" + F.MOB_DEICE)
    ]));
    table.appendChild(h("div", { "class": "pt-grid pt-total" }, [
      h("div", { style: "font-weight:800;font-size:14px" }, "Per-visit total"),
      h("div"),
      h("div", { style: "text-align:right;font-weight:800;font-size:16px" }, c.clearStr),
      h("div", { style: "text-align:right;font-weight:800;font-size:16px" }, c.deiceStr)
    ]));
    table.appendChild(h("div", { "class": "plan-notes" }, [
      noteBox("Flex", "Billed at the per-visit totals above."),
      noteBox("Seasonal Unlimited", ["Expected season \u2248 ", h("b", { style: "color:var(--ink)" }, seasonStr), " \xF7 5 mo = ", h("b", { style: "color:var(--accent)" }, monthlyStr + "/mo"), ", uncapped."]),
      noteBox("Season-Lock", [seasonStr + " prepaid ", h("b", { style: "color:var(--ink)" }, "\u221210%"), " = ", h("b", { style: "color:var(--accent)" }, lockStr), "."])
    ]));
    return { el: table, seasonStr, monthlyStr, lockStr };
  }

  // app-templates/customer-portal/runtime/src/routes/ProposalsPage.js
  function proposalRollup() {
    var r = { approved: 0, revision: 0, declined: 0, unseen: 0, viewed: 0 };
    state.psites.forEach(function(p) {
      r[p.status]++;
    });
    return r;
  }
  function ProposalsList() {
    if (state.config.dataMode === "live") return ContractsPage();
    var quotes = quotePackage();
    if (quotes) return ContractsPage();
    var proposal = currentProposal();
    var statusMeta = proposalStatusMeta();
    var r = proposalRollup();
    var decided = r.approved + r.revision + r.declined;
    var open = r.unseen + r.viewed;
    var page = h("section", { "class": "page page--narrow", "data-route": "proposals.list", "data-visual-id": "proposals-list" });
    page.appendChild(h("div", { "class": "proposals-head" }, [
      h("div", { style: "flex:1" }, [
        h("div", { style: "font-weight:800;font-size:28px;line-height:1.15;letter-spacing:-.025em", "data-bind": "proposal.id" }, "Proposal #" + proposal.id),
        h("div", { style: "font-size:14.5px;color:var(--ink-2);margin-top:3px" }, open + " property choices open \xB7 sent " + proposal.sent + " \xB7 valid until " + proposal.validUntil)
      ]),
      h("span", { "class": "proposals-head__pill" }, decided + " of " + state.psites.length + " decided")
    ]));
    if (state.view === "empty") {
      page.appendChild(EmptyState({ glyph: "\u{1F4C4}", title: "No proposals yet", desc: "When our team sends you a multi-site proposal, it shows up here." }));
      return page;
    }
    var canvas = h("div", { "class": "portfolio-map__canvas" }, [
      h("span", { "class": "portfolio-map__label" }, proposal.mapLabel || "portfolio map \xB7 Port Coquitlam \xB7 Coquitlam"),
      h("div", { "class": "portfolio-map__river" })
    ]);
    state.psites.forEach(function(p) {
      var st = statusMeta[p.status];
      canvas.appendChild(h("div", { "class": "map-pin-wrap", style: "left:" + p.x + "%;top:" + p.y + "%" }, [
        h("div", { "class": "map-pin-diamond", style: "background:" + st.dot }),
        h("div", { "class": "map-pin-label" }, p.addr)
      ]));
    });
    page.appendChild(h("div", { "class": "portfolio-map", "data-module": "portfolio-map", "data-visual-id": "portfolio-map" }, canvas));
    page.appendChild(h("div", { "class": "rollup-grid", "data-module": "proposal-rollup" }, [
      rollupCard("Approved", r.approved, "var(--ok)"),
      rollupCard("Revision", r.revision, "var(--warn)"),
      rollupCard("Declined", r.declined, "var(--danger)"),
      rollupCard("Open", open, "var(--ink-3)")
    ]));
    page.appendChild(h("div", { "class": "site-list", "data-module": "proposal-list", "data-visual-id": "proposal-list" }, state.psites.map(ProposalCard)));
    page.appendChild(h("div", { "class": "proposal-footer" }, [
      h("div", { "class": "proposal-footer__icon" }, "\u2726"),
      h("div", { style: "flex:1;font-size:13px;line-height:1.5;color:var(--ink-2)" }, "Decide each site independently. Every price is derived from that site\u2019s Beam AI measured area, so larger lots scale up automatically. Approving a plan records your decision on the quote we already prepared for that site.")
    ]));
    return page;
  }
  function ContractsPage() {
    var page = h("section", { "class": "page page--narrow", "data-route": "proposals.list", "data-visual-id": "proposals-list" });
    var gate = contractsGate(ContractsListSkeleton);
    if (gate) {
      page.setAttribute("data-state", gate.getAttribute("data-state") || "loading");
      page.appendChild(gate);
      return page;
    }
    var quotes = quotePackage();
    if (!quotes) {
      page.setAttribute("data-state", "unavailable");
      page.appendChild(EmptyState({ glyph: "\u25CB", title: "Contracts aren\u2019t in the portal yet", desc: "Your quotes and service agreements can\u2019t be shown here yet." }));
      return page;
    }
    var hasAgreements = quotes.agreements.length > 0;
    var hasQuotes = quotes.pending.length > 0;
    var partial = ContractsNotices(quotes);
    page.setAttribute("data-state", hasAgreements || hasQuotes ? partial.length ? "partial" : "ready" : quotes.preparing ? "preparing" : "empty");
    page.appendChild(ContractsHead(quotes));
    if (!hasAgreements && !hasQuotes) {
      partial.forEach(function(notice) {
        page.appendChild(notice);
      });
      page.appendChild(quotes.preparing ? QuotesPreparing() : EmptyState({ glyph: "\u{1F4C4}", title: "No contracts yet", desc: "When we send you a quote or a service agreement, it shows up here." }));
      return page;
    }
    if (quotes.preparing) page.appendChild(QuotesPreparingNotice());
    partial.forEach(function(notice) {
      page.appendChild(notice);
    });
    if (hasAgreements) {
      page.appendChild(h("section", { "class": "contracts-section", "data-module": "contracts-agreements", "aria-label": "Service agreements" }, [
        ContractsSectionTitle("Service agreements", quotes.agreements.length),
        AgreementList(quotes.agreements)
      ]));
    }
    if (hasQuotes) {
      var section = h("section", { "class": "contracts-section", "data-module": "contracts-quotes", "aria-label": "Quotes" }, [
        hasAgreements ? ContractsSectionTitle("Quotes", quotes.pending.reduce(function(sum, group) {
          return sum + group.orders.length;
        }, 0)) : null
      ]);
      var map = usablePropertyMap();
      var cache = createGeocodeCache(browserStorage());
      var placements = map ? placeEach(map, quotes.pending.map(function(group) {
        return group.property;
      })) : quotes.pending.map(function(group) {
        return group.property ? knownPlacement(group.property, cache) : { point: null, reason: "unknown" };
      });
      var portfolio = map ? PortfolioMap(quotes.pending, placements, map, mapViewport()) : PortfolioSchematic(quotes.pending, placements);
      if (portfolio) section.appendChild(portfolio);
      section.appendChild(QuoteGroups(quotes.pending, placements, !!portfolio));
      if (quotes.deciding) section.appendChild(QuotesFooter());
      page.appendChild(section);
    }
    return page;
  }
  function rollupCard(label, num2, color) {
    return h("div", { "class": "rollup-card" }, [
      h("div", { "class": "rollup-card__label" }, label),
      h("div", { "class": "rollup-card__num", style: "color:" + color }, String(num2))
    ]);
  }

  // app-templates/customer-portal/runtime/src/components/proposals/AgreementParts.js
  var STAGE_NOTICE = {
    review: { tone: "info", text: "The quotes in this agreement are waiting for your decisions.", link: { label: "Go to your quotes \u203A", action: "nav.go", id: "proposals.list" } },
    details: { tone: "warn", text: "We need your contract details before we can prepare this agreement." }
  };
  function AgreementStageNotice(agreement) {
    var notice = STAGE_NOTICE[agreement.stage];
    if (!notice) return null;
    return h("div", { "class": "agreement-notice", "data-module": "agreement-notice", "data-visual-id": "agreement-notice", "data-state": agreement.stage, "data-tone": notice.tone, role: "status" }, [
      h("span", { "class": "agreement-notice__dot", "aria-hidden": "true" }),
      h("span", { "class": "agreement-notice__text" }, notice.text),
      notice.link ? h("span", { "class": "link-action agreement-notice__link", "data-action": notice.link.action, "data-id": notice.link.id }, notice.link.label) : null
    ]);
  }
  function AgreementParties(parties) {
    return h("div", { "class": "agreement-parties", "data-module": "agreement-parties", "data-visual-id": "agreement-parties" }, [
      FactsCard("Provider", "agreement-party", [
        ["Legal name", parties.provider.legalName],
        ["Representative", joinName(parties.provider.representativeName, parties.provider.representativeJobTitle)],
        ["Phone", parties.provider.phone, "tel:" + parties.provider.phone.replace(/[^+\d]/g, "")],
        ["Email", parties.provider.email, "mailto:" + parties.provider.email]
      ]),
      FactsCard("Client", "agreement-party", [
        ["Legal name", parties.client.legalName],
        ["Client type", parties.client.clientType],
        ["Billing address", parties.client.billingAddress],
        ["Representative", joinName(parties.client.representativeName, parties.client.representativeJobTitle)],
        ["Email", parties.client.email],
        ["Phone", parties.client.phone]
      ])
    ]);
  }
  function AgreementTerm(agreement) {
    if (!agreement.effectiveDate) return null;
    return FactsCard("Term", "agreement-term", [["Effective date", formatIsoDate(agreement.effectiveDate)]]);
  }
  function AgreementServices(row, map) {
    var section = h("section", { "class": "agreement-services", "data-module": "agreement-services", "data-visual-id": "agreement-services", "aria-labelledby": "agreement-services-title" }, [
      h("div", { "class": "agreement-section-head" }, [
        h("h2", { "class": "contracts-section__title", id: "agreement-services-title" }, "Properties and services"),
        row.servicesScope === "approved" ? h("div", { "class": "agreement-section-head__sub" }, "The options you approved") : null
      ]),
      map || null
    ]);
    if (!row.properties.length) {
      section.appendChild(h("div", { "class": "card card--pad quote-option__note", "data-state": "empty" }, row.servicesScope === "approved" ? "No approved services are listed on this agreement yet." : "No services are listed on this agreement yet."));
      return section;
    }
    row.properties.forEach(function(entry) {
      section.appendChild(h("div", { "class": "agreement-property", "data-module": "agreement-property", "data-visual-id": "agreement-property" }, [
        h("div", { "class": "agreement-property__head" }, [
          h("h3", { "class": "agreement-property__title" }, entry.title),
          entry.address ? h("div", { "class": "agreement-property__address" }, entry.address) : null
        ]),
        h("div", { "class": "agreement-property__options" }, entry.orders.map(function(order) {
          return QuoteOptionCard(order);
        }))
      ]));
    });
    return section;
  }
  function AgreementTerms(blocks, open) {
    if (!blocks.length) return null;
    var card = h("section", { "class": "card card--pad agreement-terms", "data-module": "agreement-terms", "data-visual-id": "agreement-terms", "data-state": open ? "open" : "closed", "aria-labelledby": "agreement-terms-title" }, [
      h("div", { "class": "agreement-terms__head" }, [
        h("h2", { "class": "agreement-card__title", id: "agreement-terms-title" }, "Terms"),
        h("button", { "class": "link-action agreement-terms__toggle", type: "button", "data-action": "agreement.toggleTerms", "aria-expanded": open ? "true" : "false", "aria-controls": "agreement-terms-body", "data-visual-id": "agreement-terms-toggle" }, open ? "Hide terms" : "Show terms")
      ])
    ]);
    if (!open) return card;
    var body = h("div", { "class": "agreement-terms__body", id: "agreement-terms-body" });
    card.appendChild(body);
    var list = null;
    blocks.forEach(function(block) {
      if (block.kind === "item") {
        if (!list || list.getAttribute("data-depth") !== String(block.depth)) {
          list = h("ul", { "class": "terms-list", "data-depth": String(block.depth) });
          body.appendChild(list);
        }
        list.appendChild(h("li", null, block.text));
        return;
      }
      list = null;
      if (block.kind === "heading") body.appendChild(h("h3", { "class": "terms-heading" }, block.text));
      else if (block.kind === "numbered") {
        body.appendChild(h("div", { "class": "terms-num", "data-depth": String(block.depth) }, [
          h("span", { "class": "terms-num__marker" }, block.marker),
          h("span", { "class": "terms-num__text" }, block.text)
        ]));
      } else body.appendChild(h("p", { "class": "terms-paragraph", "data-depth": String(block.depth) }, block.text));
    });
    return card;
  }
  function AgreementOutcome(agreement) {
    var command = state.contractCommand;
    if (!command || command.kind !== "agreement" || command.phase === "pending" || command.targets.indexOf(agreement.backendId) === -1) return null;
    var outcome = CommandOutcome(command.phase);
    if (!outcome) return null;
    return h("section", { "class": "card card--pad agreement-approve", "data-module": "agreement-approve", "data-visual-id": "agreement-approve", "data-state": command.phase, "aria-labelledby": "agreement-approve-title" }, [
      h("h2", { "class": "agreement-card__title", id: "agreement-approve-title" }, "Your approval"),
      outcome
    ]);
  }
  function AgreementApproval(row, busy) {
    var agreement = row.agreement;
    var command = state.contractCommand;
    var targeted = !!command && command.kind === "agreement" && command.targets.indexOf(agreement.backendId) !== -1;
    var pending = targeted && command.phase === "pending";
    var confirm = state.contractConfirm;
    var confirming = !!confirm && confirm.kind === "agreement" && confirm.backendId === agreement.backendId;
    var card = h("section", { "class": "card card--pad agreement-approve", "data-module": "agreement-approve", "data-visual-id": "agreement-approve", "data-tone": "warn", "data-state": pending ? "pending" : confirming ? "confirming" : "idle", "aria-labelledby": "agreement-approve-title" });
    if (confirming) {
      var client = agreement.parties.client.legalName;
      var confirmButton = ActionButton({ variant: "btn--primary", label: pending ? "Sending\u2026" : "Confirm approval", action: "agreement.confirm", id: String(agreement.backendId), lg: true, disabled: pending || busy, visualId: "agreement-confirm" });
      if (pending) confirmButton.setAttribute("data-state", "pending");
      card.appendChild(h("div", { "class": "decision-confirm", "data-module": "decision-confirm", "data-visual-id": "decision-confirm", "data-state": pending ? "pending" : "open", "data-kind": "agreement", role: "group", "aria-labelledby": "agreement-approve-title" }, [
        h("p", { "class": "decision-confirm__title", id: "agreement-approve-title" }, "Approve this service agreement?"),
        client ? h("p", { "class": "decision-confirm__body" }, "You approve it on behalf of " + client + ".") : null,
        h("div", { "class": "proposal-actions" }, [
          confirmButton,
          ActionButton({ variant: "btn--ghost", label: "Cancel", action: "agreement.cancel", lg: true, disabled: pending, visualId: "agreement-cancel" })
        ])
      ]));
    } else {
      card.appendChild(h("h2", { "class": "agreement-card__title", id: "agreement-approve-title" }, "Waiting for your approval"));
      card.appendChild(h("p", { "class": "agreement-approve__copy" }, "Approving accepts the parties, services and terms shown on this page."));
      card.appendChild(h("div", { "class": "proposal-actions" }, [
        ActionButton({ variant: "btn--primary", label: "Approve agreement", action: "agreement.approve", id: String(agreement.backendId), lg: true, disabled: busy, visualId: "agreement-approve" })
      ]));
    }
    if (targeted && !pending) {
      var outcome = CommandOutcome(command.phase);
      if (outcome) card.appendChild(outcome);
    }
    return card;
  }
  function FactsCard(title, className, rows2) {
    var stated = rows2.filter(function(row) {
      return !!row[1];
    });
    if (!stated.length) return null;
    return h("section", { "class": "card card--pad " + className, "data-module": className, "data-visual-id": className }, [
      h("h2", { "class": "agreement-card__title" }, title),
      h("dl", { "class": "agreement-facts" }, stated.map(function(row) {
        return h("div", { "class": "agreement-facts__row" }, [
          h("dt", { "class": "agreement-facts__label" }, row[0]),
          h("dd", { "class": "agreement-facts__value" }, row[2] ? h("a", { "class": "link-action", href: row[2] }, row[1]) : row[1])
        ]);
      }))
    ]);
  }
  function joinName(name, title) {
    if (!name) return "";
    return title ? name + ", " + title : name;
  }

  // app-templates/customer-portal/runtime/src/routes/AgreementDetailPage.js
  function AgreementDetail() {
    var page = h("section", { "class": "page page--narrow", "data-route": "agreement.detail", "data-visual-id": "agreement-detail" });
    page.appendChild(h("div", { "class": "detail-back", "data-action": "proposal.review", "data-visual-id": "agreement-back" }, "\u2039 Back to your contracts"));
    var gate = contractsGate(ContractDetailSkeleton);
    if (gate) {
      page.setAttribute("data-state", gate.getAttribute("data-state") || "loading");
      page.appendChild(gate);
      return page;
    }
    var row = contractAgreementFor(state.agreementId);
    if (!row) {
      page.setAttribute("data-state", "not-found");
      page.appendChild(NotFoundState({ noun: "agreement", backLabel: "contracts", backRoute: "proposals.list" }));
      return page;
    }
    var agreement = row.agreement;
    page.setAttribute("data-state", agreement.stage);
    var season = agreementSeason(agreement);
    var title = agreementTitle(row);
    page.appendChild(h("div", { "class": "proposal-detail-head", "data-module": "agreement-detail-head", "data-visual-id": "agreement-detail-head" }, [
      h("div", { style: "flex:1;min-width:0" }, [
        row.propertyNames.length ? h("div", { "class": "agreement-detail-head__eyebrow" }, "Service agreement") : null,
        h("h1", { "class": "proposal-detail-head__title", "data-bind": "agreement.title" }, title),
        season ? h("div", { "class": "proposal-detail-head__meta", "data-bind": "agreement.season" }, season) : null
      ]),
      StatusBadge({ variant: "status-badge--" + agreement.tone, label: agreement.label, bind: "agreement.stateLabel", state: agreement.stage })
    ]));
    var approvable = agreement.allowedActions.indexOf("approve") !== -1;
    var notice = approvable ? AgreementApproval(row, contractCommandsBusy()) : AgreementStageNotice(agreement);
    if (notice) page.appendChild(notice);
    if (row.unreadableOrders) {
      page.appendChild(PartialNotice(row.unreadableOrders === 1 ? "1 quote listed in this agreement couldn\u2019t be loaded." : row.unreadableOrders + " quotes listed in this agreement couldn\u2019t be loaded."));
    }
    if (row.orders.some(function(order) {
      return order.linesState !== "ready";
    })) {
      page.appendChild(PartialNotice("Some services in this agreement couldn\u2019t be loaded. Prices and totals shown come from our system as returned."));
    }
    page.appendChild(AgreementParties(agreement.parties));
    var term = AgreementTerm(agreement);
    if (term) page.appendChild(term);
    page.appendChild(AgreementServices(row, AgreementMap(row.properties)));
    var terms = AgreementTerms(agreement.terms, state.agreementTermsOpen);
    if (terms) page.appendChild(terms);
    var outcome = approvable ? null : AgreementOutcome(agreement);
    if (outcome) page.appendChild(outcome);
    return page;
  }
  function AgreementMap(entries) {
    var map = usablePropertyMap();
    var located = entries.filter(function(entry) {
      return !!entry.property;
    });
    if (!map || !located.length) return null;
    var places = located.map(function(entry) {
      return { id: entry.key, name: entry.title };
    });
    return h("div", { "class": "ov-map__stage", "data-module": "agreement-map", "data-visual-id": "agreement-map", "data-surface": "google", style: "margin-bottom:16px" }, [
      LocationMap(map, mapViewport(), places, placeEach(map, located.map(function(entry) {
        return entry.property;
      })), "Finding these properties on the map\u2026")
    ]);
  }

  // app-templates/customer-portal/runtime/src/routes/AccountProfilePage.js
  var SUGGESTION_DELAY = 250;
  var SUGGESTION_MINIMUM = 3;
  var addressFinder = null;
  function accountProfileView() {
    var envelope2 = state.moduleData.profile;
    if (state.moduleStatus.profile === "loading" || !envelope2) return "loading";
    return envelope2.state;
  }
  function AccountProfile() {
    var view = accountProfileView();
    var envelope2 = state.moduleData.profile;
    var editable = profileEditing(state.config);
    var page = h("section", { "class": "page page--narrow", "data-route": "profile", "data-visual-id": "profile", "data-state": view });
    if (view === "loading") page.appendChild(ProfileSkeleton());
    else if (view === "unauthorized") page.appendChild(UnauthorizedState({ scope: "your account details", backRoute: state.config.defaultRoute }));
    else if (view === "error") page.appendChild(ErrorState({ title: "Couldn\u2019t load your account details", desc: "Nothing was changed. Check your connection and try again." }));
    else if (view === "unavailable") page.appendChild(stateBlock(EmptyState({ glyph: "\u25CB", title: "Your account details aren\u2019t available", desc: "They didn\u2019t come back for this sign-in. Sign out and sign in again, or try later." }), "unavailable"));
    else {
      page.appendChild(ProfileHead(envelope2, editable));
      var facts2 = editable ? EditableFacts(envelope2) : view === "empty" ? null : ProfileFacts(envelope2);
      if (facts2) page.appendChild(facts2);
      else page.appendChild(EmptyState({ glyph: "\u25CC", title: "No contact details on file", desc: "We don\u2019t have a contact, email, phone or billing address for your account yet." }));
      if (editable) page.appendChild(SignInFacts());
    }
    page.appendChild(h("button", { "class": "signout-btn", "data-action": "auth.signOut", "data-visual-id": "sign-out", type: "button", style: "width:100%;margin-top:18px" }, "Sign out"));
    return page;
  }
  function ProfileHead(envelope2, editable) {
    return h("div", { "class": "prop-head", "data-module": "profile-head", "data-visual-id": "profile-head" }, [
      h("div", { style: "flex:1;min-width:0" }, [
        h("h1", { "class": "prop-head__title", style: "overflow-wrap:anywhere" }, envelope2.accountName || "Your account"),
        h("div", { "class": "prop-head__addr" }, editable ? "The details we have on file for your account. Select Edit to change one." : "The details we have on file for your account.")
      ])
    ]);
  }
  function ProfileFacts(envelope2) {
    var contact = envelope2.contact;
    var billing = envelope2.billingAddresses || [];
    var named = !!(contact && contact.name) && contact.name !== envelope2.accountName;
    var facts2 = [
      named ? Fact("contact", "Contact", [contact.name], contact.title) : null,
      Fact("email", "Email", envelope2.emails || []),
      Fact("phone", "Phone", envelope2.phones || []),
      Fact("billing", billing.length > 1 ? "Billing addresses" : "Billing address", billing)
    ].filter(Boolean);
    if (!facts2.length) return null;
    return h("div", { "class": "card card--pad prop-facts", "data-module": "profile-facts", "data-visual-id": "profile-facts", "data-state": envelope2.state }, facts2);
  }
  function Fact(key, label, values, note) {
    if (!values.length) return null;
    var children = [h("div", { "class": "prop-fact__label" }, label)];
    values.forEach(function(value) {
      children.push(h("div", { "class": "prop-fact__value", style: "overflow-wrap:anywhere" }, value));
    });
    if (note) children.push(h("div", { "class": "prop-fact__note" }, note));
    return h("div", { "class": "prop-fact", "data-fact": key, "data-state": "ready" }, children);
  }
  function EditableFacts(envelope2) {
    var contact = envelope2.contact;
    var billing = envelope2.billingAddresses || [];
    return h("div", { "class": "card card--pad prop-facts", "data-module": "profile-facts", "data-visual-id": "profile-facts", "data-state": envelope2.state }, [
      EditableFact("contact", contact && contact.name ? [contact.name] : [], contact && contact.title),
      EditableFact("email", envelope2.emails || []),
      EditableFact("phone", envelope2.phones || []),
      EditableFact("billing", billing, null, billing.length > 1 ? "Billing addresses" : null)
    ]);
  }
  function SignInFacts() {
    var changed = state.profileLoginChanged;
    var login = currentSignIn();
    return h("div", { "class": "card card--pad prop-facts prop-facts--single", "data-module": "profile-sign-in", "data-visual-id": "profile-sign-in" }, [
      EditableFact("login", login ? [login] : [], changed ? "Use this account name the next time you sign in. Your password stays the same." : "The name you sign in to this portal with. Changing it does not change your contact email.")
    ]);
  }
  function EditableFact(key, values, note, label) {
    var definition = PROFILE_EDIT_ROWS[key];
    var edit = state.profileEdit;
    if (edit && edit.row === key) return EditingFact(key, definition, edit);
    var busy = profileEditBusy();
    var title = label || definition.label;
    var children = [h("div", { "class": "prop-fact__head" }, [
      h("div", { "class": "prop-fact__label" }, title),
      h("button", {
        "class": "link-action prop-fact__edit",
        type: "button",
        "data-action": "profileEdit.start",
        "data-id": key,
        "data-visual-id": "profile-edit-" + key,
        "aria-label": (values.length ? "Edit " : "Add ") + definition.label.toLowerCase(),
        disabled: busy ? true : void 0
      }, values.length ? "Edit" : "Add")
    ])];
    values.forEach(function(value) {
      children.push(h("div", { "class": "prop-fact__value", style: "overflow-wrap:anywhere" }, value));
    });
    if (state.profileSaved === key) children.push(h("div", { "class": "prop-fact__saved", role: "status" }, "Saved"));
    if (note) children.push(h("div", { "class": "prop-fact__note" }, note));
    return h("div", { "class": "prop-fact", "data-fact": key, "data-state": values.length ? "ready" : "missing" }, children);
  }
  function EditingFact(key, definition, edit) {
    var saving = edit.phase === "saving";
    var ended = edit.phase === "session-ended";
    var row = h("div", { "class": "prop-fact prop-fact--editing", "data-fact": key, "data-state": edit.phase, "data-visual-id": "profile-editing-" + key }, [
      h("div", { "class": "prop-fact__label", id: "profile-edit-" + key + "-label" }, definition.label)
    ]);
    var group = h("div", { "class": "prop-edit" + (definition.fields.length > 1 ? " prop-edit--pair" : ""), role: "group", "aria-labelledby": "profile-edit-" + key + "-label", "aria-busy": saving ? "true" : void 0 });
    definition.fields.forEach(function(item) {
      var id = "profile-edit-" + item.key;
      var error2 = edit.errors[item.code];
      var input = h("input", {
        "class": "field",
        id,
        name: item.key,
        type: item.type,
        autocomplete: item.code === "BILLING_ADDRESS" && addressSuggestionsOpen() ? "off" : item.autocomplete,
        value: edit.draft[item.key] || "",
        placeholder: item.placeholder,
        "data-profile-input": item.code,
        "data-state": error2 ? "invalid" : void 0,
        "aria-invalid": error2 ? "true" : void 0,
        "aria-describedby": error2 ? id + "-error" : void 0,
        "aria-label": definition.fields.length > 1 ? void 0 : item.label,
        disabled: saving || ended ? true : void 0,
        spellcheck: item.type === "text" && item.code !== "BILLING_ADDRESS" ? void 0 : "false"
      });
      input.addEventListener("input", function() {
        changeProfileDraft(item.key, input.value);
      });
      input.addEventListener("keydown", function(event) {
        if (event.defaultPrevented) return;
        if (event.key === "Enter" && !input.getAttribute("aria-activedescendant")) {
          event.preventDefault();
          ACTIONS["profileEdit.save"]();
        }
        if (event.key === "Escape" && input.getAttribute("aria-expanded") !== "true") {
          event.preventDefault();
          ACTIONS["profileEdit.cancel"]();
        }
      });
      var cell = h("div", { "class": "field-row prop-edit__field" }, [
        definition.fields.length > 1 ? h("label", { "class": "field-label", "for": id }, item.label) : null,
        input,
        error2 ? h("div", { "class": "field-error", id: id + "-error", role: "alert" }, error2) : null
      ]);
      if (item.code === "BILLING_ADDRESS" && addressSuggestionsOpen() && !saving && !ended) suggestAddresses(input, cell, item.key);
      group.appendChild(cell);
    });
    row.appendChild(group);
    if (edit.message) row.appendChild(h("div", { "class": "prop-edit__message", role: "alert", "data-state": edit.phase }, edit.message));
    row.appendChild(h("div", { "class": "prop-edit__actions" }, ended ? [
      h("button", { "class": "btn btn--primary", type: "button", "data-action": "auth.signOut", "data-visual-id": "profile-edit-sign-in" }, "Sign in again")
    ] : [
      h("button", { "class": "btn btn--primary", type: "button", "data-action": "profileEdit.save", "data-visual-id": "profile-edit-save", disabled: saving ? true : void 0 }, saving ? "Saving\u2026" : "Save"),
      h("button", { "class": "btn btn--ghost", type: "button", "data-action": "profileEdit.cancel", "data-visual-id": "profile-edit-cancel", disabled: saving ? true : void 0 }, "Cancel"),
      h("span", { "class": "prop-edit__status", role: "status", "aria-live": "polite" }, saving ? key === "login" ? "Changing your sign-in\u2026" : "Saving and waiting for confirmation\u2026" : "")
    ]));
    return row;
  }
  function addressSuggestionsOpen() {
    return !!(state.config && state.config.mapsApiKey);
  }
  function suggestAddresses(input, cell, key) {
    if (!addressFinder) addressFinder = createGoogleMapsAdapter({ apiKey: state.config.mapsApiKey });
    var listId = input.getAttribute("id") + "-suggestions";
    var list = h("ul", { "class": "prop-suggest", id: listId, role: "listbox", "aria-label": "Suggested addresses", hidden: true });
    var offered = [];
    var active = -1;
    var timer = null;
    cell.appendChild(list);
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-controls", listId);
    input.setAttribute("aria-expanded", "false");
    function highlight(index) {
      active = index;
      offered.forEach(function(option, position) {
        option.node.setAttribute("aria-selected", position === index ? "true" : "false");
      });
      if (index === -1) input.removeAttribute("aria-activedescendant");
      else input.setAttribute("aria-activedescendant", offered[index].node.getAttribute("id"));
    }
    function close() {
      list.replaceChildren();
      list.setAttribute("hidden", "");
      offered = [];
      highlight(-1);
      input.setAttribute("aria-expanded", "false");
    }
    function take(option) {
      close();
      Promise.resolve(option.item.address()).then(function(address) {
        input.value = address;
        changeProfileDraft(key, address);
        input.focus();
      });
    }
    input.addEventListener("keydown", function(event) {
      if (list.hasAttribute("hidden")) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        var count = offered.length;
        highlight(event.key === "ArrowDown" ? (active + 1) % count : (active <= 0 ? count : active) - 1);
      } else if (event.key === "Enter" && active !== -1) {
        event.preventDefault();
        take(offered[active]);
      } else if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    });
    input.addEventListener("blur", function() {
      setTimeout(close, 150);
    });
    input.addEventListener("input", function() {
      if (timer !== null) clearTimeout(timer);
      var value = input.value.trim();
      if (value.length < SUGGESTION_MINIMUM) {
        timer = null;
        close();
        return;
      }
      timer = setTimeout(function() {
        timer = null;
        addressFinder.suggestAddresses(value).then(function(items) {
          if (input.value.trim() !== value || !input.isConnected) return;
          close();
          offered = items.map(function(item, index) {
            var node = h("li", { "class": "prop-suggest__option", id: listId + "-" + index, role: "option", "aria-selected": "false" }, item.label);
            var option = { node, item };
            node.addEventListener("mousedown", function(event) {
              event.preventDefault();
            });
            node.addEventListener("click", function() {
              take(option);
            });
            list.appendChild(node);
            return option;
          });
          if (!offered.length) return;
          list.removeAttribute("hidden");
          input.setAttribute("aria-expanded", "true");
        }, close);
      }, SUGGESTION_DELAY);
    });
  }
  function ProfileSkeleton() {
    return h("div", { "data-module": "profile-loading", "data-visual-id": "profile-loading", "data-state": "loading", "aria-busy": "true" }, [
      h("div", { "class": "prop-head" }, [h("div", { style: "flex:1;min-width:0" }, [skel("width:52%;height:30px;margin-bottom:9px"), skel("width:38%;height:13px")])]),
      h("div", { "class": "card card--pad prop-facts" }, [0, 1, 2, 3].map(function() {
        return h("div", { "class": "prop-fact" }, [skel("width:34%;height:11px;margin-bottom:8px"), skel("width:72%;height:15px")]);
      }))
    ]);
  }
  function stateBlock(block, stateName) {
    block.setAttribute("data-state", stateName);
    return block;
  }

  // app-templates/customer-portal/runtime/src/routes/AuthPage.js
  function pitchRow(dot, bg, text10) {
    return h("div", { style: "display:flex;align-items:center;gap:12px" }, [
      h("div", { style: "width:34px;height:34px;border-radius:10px;background:" + bg + ";display:grid;place-items:center" }, h("i", { style: "width:12px;height:12px;border-radius:4px;background:" + dot + ";display:block" })),
      h("div", { style: "font-size:14px;color:var(--ink-2)" }, text10)
    ]);
  }
  function Auth() {
    var page = h("section", { "class": "page auth-page", "data-route": state.route, "data-visual-id": state.route });
    var grid = h("div", { "class": "auth-grid" });
    grid.appendChild(h("div", { "class": "auth-pitch" }, [
      h("span", { "class": "eyebrow" }, "Your customer account"),
      h("h1", { "class": "auth-pitch__title" }, "Sign in to track every visit."),
      h("p", { "class": "auth-pitch__sub" }, "One account for all your properties \u2014 bookings, live tracking, invoices and your membership in one place."),
      h("div", { style: "display:flex;flex-direction:column;gap:14px;max-width:360px" }, [
        pitchRow("var(--accent)", "rgba(var(--accent-rgb),.12)", "Book in under a minute"),
        pitchRow("#1f8a44", "rgba(52,199,89,.16)", "Track your technician live"),
        pitchRow("#7a52e0", "rgba(122,82,224,.16)", "Save with a membership")
      ])
    ]));
    var step = state.route === "auth.code" ? "code" : "phone";
    var card = h("div", { "class": "auth-card", "data-module": "auth-card", "data-visual-id": "auth-card", "data-state": "auth-" + step });
    if (step === "phone") card.appendChild(AuthPhone());
    else card.appendChild(AuthCode());
    grid.appendChild(card);
    page.appendChild(grid);
    return page;
  }
  function AuthPhone() {
    var err = state.authError;
    var input = h("input", { "class": "auth-phone__input", placeholder: "(555) 000-0000", value: state.phone, inputmode: "tel", "aria-label": "Phone number" });
    input.addEventListener("input", function() {
      state.phone = input.value;
    });
    input.addEventListener("keydown", function(e) {
      if (e.key === "Enter") validatePhone();
    });
    return h("div", { "data-state": "auth-phone" }, [
      h("div", { "class": "brand-logo brand-logo--lg", style: "margin-bottom:18px" }),
      h("div", { style: "font-weight:800;font-size:22px;letter-spacing:-.02em" }, "Welcome to Aircove"),
      h("div", { style: "font-size:14px;color:var(--ink-2);margin:4px 0 22px" }, "Enter your phone to get a one-time code."),
      h("div", { style: "font-weight:600;font-size:12px;color:var(--ink-3);letter-spacing:.04em;text-transform:uppercase;margin-bottom:8px" }, "Phone number"),
      h("div", { "class": "auth-phone" + (err ? " auth-phone--error" : "") }, [
        h("div", { "class": "auth-phone__cc" }, "\u{1F1FA}\u{1F1F8} +1"),
        input
      ]),
      err ? h("div", { "class": "auth-error", "data-state": "validation-error" }, err) : null,
      h("div", { style: "margin-top:18px" }, ActionButton({ variant: "btn--primary", label: "Send code", action: "auth.sendCode", block: true, lg: true, visualId: "send-code" })),
      h("div", { "class": "auth-divider" }, [h("span", { "class": "auth-divider__line" }), h("span", { style: "font-size:12px;color:var(--ink-3)" }, "or"), h("span", { "class": "auth-divider__line" })]),
      h("div", { "class": "auth-apple", "data-action": "auth.apple", "data-visual-id": "apple-signin" }, [h("span", { "class": "auth-apple__mark" }), "Continue with Apple"]),
      h("div", { style: "text-align:center;font-size:12px;line-height:1.5;color:var(--ink-3);margin-top:18px" }, "By continuing you agree to our Terms & Privacy Policy.")
    ]);
  }
  function AuthCode() {
    var err = state.authError;
    var code = state.code || "";
    var boxEls = [];
    var boxes = h("div", { "class": "otp" }, [0, 1, 2, 3].map(function(i) {
      var filled = i < code.length;
      var active = i === code.length;
      var el = h("div", { "class": "otp__box" + (filled ? " otp__box--filled" : "") + (active && !err ? " otp__box--active" : "") + (err ? " otp__box--error" : "") }, filled ? code[i] : active ? "" : "");
      boxEls.push(el);
      return el;
    }));
    var input = h("input", { "class": "otp__input", inputmode: "numeric", maxlength: "4", value: code, "aria-label": "Verification code", autocomplete: "one-time-code" });
    input.addEventListener("input", function() {
      var v = input.value.replace(/\D/g, "").slice(0, 4);
      input.value = v;
      state.code = v;
      boxEls.forEach(function(el, i) {
        el.className = "otp__box" + (i < v.length ? " otp__box--filled" : "") + (i === v.length ? " otp__box--active" : "");
        el.textContent = i < v.length ? v[i] : "";
      });
    });
    input.addEventListener("keydown", function(e) {
      if (e.key === "Enter") validateCode();
    });
    return h("div", { "data-state": "auth-code" }, [
      h("div", { "class": "auth-back", "data-action": "auth.back" }, "\u2039 Back"),
      h("div", { style: "font-weight:800;font-size:22px;letter-spacing:-.02em" }, "Enter the code"),
      h("div", { style: "font-size:14px;color:var(--ink-2);margin:4px 0 22px" }, "We sent a 4-digit code to " + (state.phone ? "+1 " + state.phone : "+1 (555) \u2022\u2022\u2022-\u20220000") + "."),
      h("div", { "class": "otp-wrap" }, [boxes, input]),
      err ? h("div", { "class": "auth-error", "data-state": "validation-error", style: "margin-top:14px" }, err) : null,
      h("div", { style: "margin-top:22px" }, ActionButton({ variant: "btn--primary", label: "Verify & continue", action: "auth.verifyCode", block: true, lg: true, visualId: "verify-code" })),
      h("div", { style: "text-align:center;font-size:13px;color:var(--ink-2);margin-top:18px" }, ["Didn\u2019t get it? ", h("span", { style: "color:var(--accent);font-weight:600;cursor:pointer", "data-action": "auth.resend" }, "Resend")])
    ]);
  }

  // app-templates/customer-portal/runtime/src/activation-policy.js
  function markCareControlUnavailable(control, reason) {
    control.setAttribute("disabled", "");
    control.setAttribute("aria-disabled", "true");
    control.setAttribute("data-state", "unavailable");
    control.setAttribute("title", reason);
    return control;
  }

  // app-templates/customer-portal/runtime/src/components/care/shared.js
  function careChip(kind, label) {
    var map = { ok: "status-badge--ok", warn: "status-badge--warn", issue: "status-badge--danger", info: "status-badge--info", muted: "status-badge--scheduled" };
    return h("span", { "class": "status-badge " + (map[kind] || map.muted), "data-module": "status-badge", "data-state": kind }, label);
  }
  function DocRow(d) {
    return h("div", { "class": "log-row", "data-module": "document-row", "data-visual-id": "document-row", "data-document-id": d.id }, [
      h("div", { style: "flex:1;min-width:0" }, [
        h("div", { style: "font-weight:600;font-size:13.5px", "data-bind": "doc.name" }, d.name),
        h("div", { style: "font-size:12px;color:var(--ink-3);margin-top:1px", "data-bind": "doc.meta" }, d.meta)
      ]),
      markCareControlUnavailable(h("div", {
        "class": "link-action",
        "data-action": "care.download",
        "data-id": d.id,
        role: "link",
        tabindex: "-1"
      }, "Download"), "Download is unavailable: no approved document destination")
    ]);
  }

  // app-templates/customer-portal/runtime/src/components/care/SeasonLog.js
  function SeasonLog(m) {
    var stats = h(
      "div",
      { "class": "care-stats", "data-module": "season-stats", "data-visual-id": "season-stats" },
      m.stats.map(function(s) {
        return h("div", { "class": "care-stat" }, [
          h("div", { style: "font-size:12px;color:var(--ink-3)" }, s.label),
          h("div", { style: "font-weight:800;font-size:20px;margin-top:2px" }, s.value)
        ]);
      })
    );
    var log = h("div", { "class": "list-panel", "data-module": "storm-log", "data-visual-id": "storm-log" }, [
      h("div", { "class": "list-panel__head" }, [
        h("div", { "class": "list-panel__title", style: "flex:1" }, "Storm responses"),
        h("span", { style: "font-size:12.5px;color:var(--ink-3)" }, "GPS-logged \xB7 this season")
      ])
    ]);
    m.events.forEach(function(ev) {
      log.appendChild(h("div", { "class": "log-row", "data-module": "storm-log-row", "data-state": ev.sla ? "ok" : "warn" }, [
        h("div", { "class": "log-date" }, ev.date),
        h("div", { style: "flex:1;min-width:0" }, [
          h("div", { style: "display:flex;align-items:center;gap:8px;flex-wrap:wrap" }, [
            h("span", { style: "font-weight:600;font-size:13.5px", "data-bind": "event.storm" }, ev.storm),
            careChip(ev.sla ? "ok" : "warn", ev.sla ? "SLA met" : "SLA missed")
          ]),
          h(
            "div",
            { style: "font-size:12px;color:var(--ink-3);margin-top:2px" },
            ev.trigger + " \xB7 response " + ev.response + " \xB7 " + ev.material + (ev.note ? " \xB7 " + ev.note : "")
          )
        ]),
        ev.photos ? h("div", { "class": "link-action", "data-action": "order.open", "data-id": ev.orderId || "#SV-3290" }, "Report \u203A") : null
      ]));
    });
    var sla = h("div", { "class": "card card--pad", "data-module": "sla-meter", "data-visual-id": "sla-meter" }, [
      h("div", { "class": "card__title", style: "margin-bottom:10px" }, "SLA this season"),
      h("div", { "class": "score-big" }, m.sla.pct + "%"),
      h("div", { "class": "meter" }, [h("div", { "class": "meter__fill", style: "width:" + m.sla.pct + "%" })]),
      h("div", { style: "font-size:12.5px;color:var(--ink-2);margin-top:10px" }, m.sla.label)
    ]);
    var docs = h("div", { "class": "list-panel", "data-module": "compliance-reports", "data-visual-id": "compliance-reports" }, [
      h("div", { "class": "list-panel__head" }, [
        h("div", { "class": "list-panel__title", style: "flex:1" }, "Compliance reports"),
        h("span", { style: "font-size:12px;color:var(--ink-3)" }, "slip-and-fall record")
      ])
    ].concat(m.docs.map(DocRow)));
    return h("div", null, [stats, h("div", { "class": "care-grid" }, [
      h("div", { "class": "care-col" }, [log]),
      h("div", { "class": "care-col" }, [sla, docs])
    ])]);
  }

  // app-templates/customer-portal/runtime/src/routes/CarePage.js
  var RENDERERS = false ? {
    equipment: EquipmentHub,
    seasonLog: SeasonLog,
    program: LawnProgram,
    water: WaterQuality,
    roof: RoofReport,
    monitoring: PestMonitoring,
    healthCare: HealthCareHub,
    beautyCare: BeautyCareHub
  } : {
    seasonLog: SeasonLog
  };
  function careSkeleton() {
    return h("div", { "class": "care-grid", "data-state": "loading" }, [
      h("div", { "class": "care-col" }, [
        h("div", { "class": "skeleton", style: "height:120px;border-radius:16px" }),
        h("div", { "class": "skeleton", style: "height:320px;border-radius:20px" })
      ]),
      h("div", { "class": "care-col" }, [
        h("div", { "class": "skeleton", style: "height:240px;border-radius:20px" }),
        h("div", { "class": "skeleton", style: "height:150px;border-radius:20px" })
      ])
    ]);
  }
  function entitlementGate(envelope2) {
    return h("div", { "class": "state-block", "data-module": "entitlement-gate", "data-visual-id": "entitlement-gate", "data-state": "unauthorized" }, [
      h("div", { "class": "state-block__glyph" }, "\u26BF"),
      h("div", { "class": "state-block__title" }, envelope2.navLabel + " isn\u2019t part of your plan yet"),
      h("div", { "class": "state-block__desc" }, "Your current plan doesn\u2019t include " + envelope2.title.toLowerCase() + ". Upgrade to unlock it, or ask us anything."),
      h("div", { style: "display:flex;gap:10px;justify-content:center" }, [
        ActionButton({ variant: "btn--primary", label: "View plans", action: "profile.managePlan", visualId: "entitlement-upgrade" }),
        ActionButton({ variant: "btn--ghost", label: "Contact support", action: "support.open", visualId: "entitlement-support" })
      ])
    ]);
  }
  function accessState(envelope2) {
    if (envelope2.state === "unauthorized") return entitlementGate(envelope2);
    if (envelope2.state === "loading") return careSkeleton();
    if (envelope2.state === "error") return ErrorState({ title: "Couldn\u2019t load " + envelope2.title.toLowerCase(), desc: "Something went wrong fetching this page. Try again." });
    if (envelope2.state === "empty") return EmptyState({ glyph: envelope2.emptyState.glyph, title: envelope2.emptyState.title, desc: envelope2.emptyState.description });
    if (envelope2.state === "disabled") return EmptyState({ glyph: "i", title: "Care is not enabled", desc: "This module is disabled for the current portal configuration." });
    return null;
  }
  function Care() {
    var envelope2 = state.moduleData.care;
    if (!envelope2) {
      envelope2 = { title: "Care", subtitle: "", navLabel: "Care", kind: null, state: "loading", access: { status: "checking", reasonCode: null } };
    }
    var page = h("section", {
      "class": "page",
      "data-route": "care",
      "data-visual-id": envelope2.kind ? "care-" + envelope2.kind : "care-access",
      "data-state": envelope2.state,
      "data-access": envelope2.access.status,
      "data-reason-code": envelope2.access.reasonCode || void 0
    });
    page.appendChild(PageHeader({ title: envelope2.title, sub: envelope2.subtitle }));
    var treatment = accessState(envelope2);
    if (treatment) {
      page.appendChild(treatment);
      return page;
    }
    var renderer = RENDERERS[envelope2.kind];
    if (!renderer || !envelope2.content) {
      page.appendChild(ErrorState({ title: "Couldn\u2019t load care", desc: "The Care payload is unavailable." }));
      return page;
    }
    var retreatScope = envelope2.content.guarantee && envelope2.content.guarantee.scope;
    var retreatKey = retreatScope && "care.requestRetreat:" + retreatScope.planId;
    page.appendChild(renderer(envelope2.content, {
      selectedUnitId: state.careSelectedUnitId,
      selectedSpecialistId: state.careSelectedSpecialistId,
      tasksDone: state.careTasksDone,
      retreatRequest: retreatScope ? state.careRetreatRequests[retreatScope.planId] || null : null,
      retreatPending: retreatKey ? state.pending[retreatKey] === true : false,
      retreatError: retreatKey ? state.commandErrors[retreatKey] || null : null
    }));
    return page;
  }

  // app-templates/customer-portal/runtime/src/routes/AuthOidcPage.js
  function AuthOidc() {
    var s = state.oidc || "ready-signed-out";
    var page = h("section", { "class": "page auth-page", "data-route": "auth.oidc", "data-visual-id": "auth.oidc", "data-screen-label": "Login (" + s + ")" });
    var grid = h("div", { "class": "auth-grid" });
    grid.appendChild(h("div", { "class": "auth-pitch" }, [
      h("span", { "class": "eyebrow" }, "Customer account"),
      h("h1", { "class": "auth-pitch__title" }, "Secure sign-in, handled in one place."),
      h("p", { "class": "auth-pitch__sub" }, "You sign in with our secure account service and come straight back here. Your password is never entered on this site.")
    ]));
    var card = h("div", { "class": "auth-card", "data-module": "core-oidc-auth", "data-visual-id": "core-oidc-auth", "data-state": s });
    if (s === "checking-session") card.appendChild(OidcProgress("checking-session", "Checking your session\u2026", "Securely restoring your existing sign-in. This only takes a moment \u2014 no need to do anything."));
    else if (s === "ready-signed-out") card.appendChild(OidcSignedOut());
    else if (s === "redirecting") card.appendChild(OidcProgress("redirecting", "Taking you to secure sign-in\u2026", "This page is leaving for the secure account service. You\u2019ll come back here automatically \u2014 no need to do anything."));
    else if (s === "unavailable") card.appendChild(OidcUnavailable());
    else if (s === "ready-signed-in") card.appendChild(OidcSignedIn());
    else if (s === "signing-out") card.appendChild(OidcProgress("signing-out", "Signing you out\u2026", "Finishing sign-out with the secure account service. One moment."));
    grid.appendChild(card);
    page.appendChild(grid);
    return page;
  }
  function oidcStep(n, text10) {
    return h("div", { "class": "oidc-step" }, [h("span", { "class": "oidc-step__num" }, String(n)), text10]);
  }
  function OidcSignedOut() {
    return h("div", { "data-state": "ready-signed-out" }, [
      h("div", { "class": "brand-logo brand-logo--lg", style: "margin-bottom:18px" }),
      h("div", { "class": "oidc-title" }, "Sign in to your account"),
      h("div", { "class": "oidc-sub" }, "Sign-in continues in the secure account service. When you\u2019re done, you\u2019ll return right here."),
      h("div", { "class": "oidc-steps" }, [
        oidcStep(1, "Continue to the secure account service"),
        oidcStep(2, "Sign in there \u2014 we never see your password"),
        oidcStep(3, "Come back here, signed in")
      ]),
      ActionButton({ variant: "btn--primary", label: "Continue to secure sign-in", action: "auth.oidcSignIn", block: true, lg: true, visualId: "oidc-signin" }),
      h("div", { "class": "oidc-note" }, "By continuing you agree to our Terms & Privacy Policy.")
    ]);
  }
  function OidcSignedIn() {
    return h("div", { "data-state": "ready-signed-in" }, [
      h("div", { "class": "oidc-status" }, [h("div", { "class": "oidc-glyph oidc-glyph--ok" }, "\u2713")]),
      h("div", { "class": "oidc-title" }, "You\u2019re signed in"),
      h("div", { "class": "oidc-sub" }, "You can go straight to your account."),
      h("div", { "class": "oidc-actions" }, [
        ActionButton({ variant: "btn--primary", label: "Open the portal", action: "nav.go", id: state.config.defaultRoute, block: true, lg: true, visualId: "oidc-open-portal" })
      ])
    ]);
  }
  function OidcProgress(stateName, title, sub) {
    return h("div", { "data-state": stateName, "aria-busy": "true" }, [
      h("div", { "class": "oidc-status" }, [h("span", { "class": "oidc-spinner" })]),
      h("div", { "class": "oidc-title" }, title),
      h("div", { "class": "oidc-sub oidc-sub--tail" }, sub)
    ]);
  }
  function OidcUnavailable() {
    return h("div", { "data-state": "unavailable" }, [
      h("div", { "class": "oidc-status" }, [h("div", { "class": "oidc-glyph oidc-glyph--warn" }, "!")]),
      h("div", { "class": "oidc-title" }, "Secure sign-in isn\u2019t available"),
      h("div", { "class": "oidc-sub" }, "We couldn\u2019t reach the secure account service, so sign-in can\u2019t start right now. There\u2019s no other way to sign in here \u2014 please try again in a moment."),
      h("div", { "class": "oidc-actions" }, [
        ActionButton({ variant: "btn--primary", label: "Try again", action: "auth.retrySession", block: true, lg: true, visualId: "oidc-retry" }),
        LandingReturnButton({ variant: "btn--ghost", block: true, visualId: "oidc-back-catalog" })
      ])
    ]);
  }

  // app-templates/customer-portal/runtime/src/router.js
  function ComingSoon(routeId, wave) {
    return h("section", { "class": "page", "data-route": routeId, "data-visual-id": routeId }, [
      EmptyState({
        glyph: "\u{1F9F1}",
        title: routeId + " \u2014 coming in " + wave,
        desc: "This route is part of a later wave. The shell, theming and action contract are already wired.",
        action: { variant: "btn--ghost", label: "Back to orders", action: "nav.go", id: "orders.list" }
      })
    ]);
  }
  function resolveRoute(routeId) {
    var defaultRoute = reachableDefaultRoute();
    var requested = routeRegistry[routeId] ? routeId : defaultRoute;
    var activeRoute = routeRegistry[requested];
    var reason = requested === routeId ? null : "unknown";
    if (activeRoute && activeRoute.parityOnly && state.config.dataMode === "live") {
      requested = defaultRoute;
      activeRoute = routeRegistry[requested];
      reason = "preview-only";
    }
    if (!activeRoute) return { id: "auth.oidc", reason: "invalid-config" };
    if (!isPublic(requested) && !state.session.authenticated) {
      state.session.intendedRoute = requested;
      return { id: "auth.oidc", reason: "unauthorized" };
    }
    if (requested === "auth.oidc" && signedInWithAccess()) {
      return { id: defaultRoute, reason: "signed-in" };
    }
    if (requested === "care" && !isModuleEnabled("care")) {
      return { id: "care", reason: "disabled" };
    }
    if (!activeRoute.public && !privateRouteOpen(activeRoute)) {
      return { id: defaultRoute, reason: "disabled" };
    }
    if (requested === "care") {
      return { id: "care", reason: careAccessReason() };
    }
    return { id: requested, reason };
  }
  function signedInWithAccess() {
    return customerPortalAccessRequired() && state.session.authenticated === true && state.account === "ready";
  }
  function publicEntryDestination() {
    if (!landingEntryOpen(state.config) || !state.session.intendedRoute) return "";
    if (!state.session.authenticated) return state.oidc === "ready-signed-out" ? landingEntryUrl(state.config) : "";
    return ACCOUNT_NO_ACCESS_STATES.includes(state.account) ? landingEntryUrl(state.config, LANDING_ENTRY_REASONS.noAccess) : "";
  }
  function reachableDefaultRoute() {
    if (isRouteReachable(state.config.defaultRoute)) return state.config.defaultRoute;
    if (isRouteReachable("orders.list")) return "orders.list";
    var enabledRoute = Object.values(routeRegistry).find(function(route) {
      return !route.public && privateRouteOpen(route);
    });
    return enabledRoute ? enabledRoute.id : "auth.oidc";
  }
  function isRouteReachable(routeId) {
    var route = routeRegistry[routeId];
    if (!route || route.parityOnly && state.config.dataMode === "live") return false;
    return !!(route.public || privateRouteOpen(route));
  }
  function privateRouteOpen(route) {
    if (!isModuleEnabled(route.module)) return false;
    return !route.ownedByProfile || activeProfile().modules.includes(route.module);
  }
  function routeFromLocation() {
    if (state.config.routerMode === "memory") return state.route;
    var raw;
    if (state.config.routerMode === "history") {
      raw = window.location.pathname + window.location.search;
    } else {
      raw = window.location.hash.replace(/^#/, "");
      if (!raw) return state.config.defaultRoute || state.route;
      if (raw.charAt(0) !== "/") {
        var routeId = raw.split("?", 1)[0];
        setRouteQuery(routeId, raw);
        return routeId;
      }
    }
    var match = matchRoutePath(raw);
    if (!match) {
      clearRouteQuery();
      return "__unknown__";
    }
    setRouteQuery(match.id, raw);
    applyRouteParams(match);
    return match.id;
  }
  function writeRouteToLocation(routeId, replace) {
    scopeRouteQuery(routeId);
    if (state.config.routerMode === "memory") return;
    var path = routePath(routeId, paramsForRoute(routeId));
    var query = state.routeQuery || "";
    var record = replace ? "replaceState" : "pushState";
    if (state.config.routerMode === "history") {
      if (window.location.pathname + window.location.search !== path + query) window.history[record]({}, "", path + query);
      return;
    }
    var nextHash = "#" + path + query;
    if (window.location.hash !== nextHash) window.history[record]({}, "", nextHash);
  }
  function initRouter(onRouteChange) {
    var applyLocation = function() {
      var requested = routeFromLocation();
      var resolved = resolveRoute(requested);
      state.route = resolved.id;
      if (resolved.id !== requested) writeRouteToLocation(resolved.id, true);
      onRouteChange();
    };
    if (state.config.routerMode === "history") {
      window.addEventListener("popstate", applyLocation);
    } else if (state.config.routerMode === "hash") {
      window.addEventListener("hashchange", applyLocation);
    }
    var initial = resolveRoute(routeFromLocation());
    state.route = initial.id;
    writeRouteToLocation(initial.id, true);
  }
  function renderRoute() {
    var resolved = resolveRoute(state.route);
    if (resolved.id !== state.route) state.route = resolved.id;
    if (state.view === "fallback") return RouteFallback("fallback");
    switch (resolved.id) {
      case "overview":
        return Overview();
      case "appointments":
        return state.config.dataMode === "live" ? LiveVisits() : Appointments();
      case "visit.detail":
        return state.config.dataMode === "live" ? LiveVisitDetail() : VisitDetail();
      case "invoices":
        return Invoices();
      case "invoice.detail":
        return InvoiceDetail();
      case "property.detail":
        return PropertyDetail();
      case "orders.list":
        return false ? spaCapability() === "target-appointments" ? SpaAppointments() : SpaOrders() : Cabinet();
      case "order.detail":
        return OrderDetail();
      case "appointment.detail":
        return false ? SpaAppointmentDetail() : ComingSoon("appointment.detail", "a later wave");
      case "services":
        return false ? SpaCatalog() : Services();
      case "pricing":
        return false ? SpaCatalog() : Pricing();
      case "products":
        return false ? SpaShop() : Products();
      case "product.detail":
        return false ? SpaProductDetail() : ComingSoon("product.detail", "a later wave");
      case "checkout":
        return false ? SpaCheckout() : Checkout();
      case "account":
        return false ? SpaAccount() : ComingSoon("account", "a later wave");
      case "purchases.list":
        return false ? SpaPurchases() : ComingSoon("purchases.list", "a later wave");
      case "purchase.detail":
        return false ? SpaPurchaseDetail() : ComingSoon("purchase.detail", "a later wave");
      case "plan":
        return false ? SpaPlan() : ComingSoon("plan", "a later wave");
      case "cart":
        return false ? SpaCart() : Checkout();
      case "proposals.list":
        return ProposalsList();
      case "proposal.detail":
        return ProposalDetail();
      case "agreement.detail":
        return AgreementDetail();
      case "profile":
        return false ? SpaProfile() : customerAccountProfile(state.config) ? AccountProfile() : Profile();
      case "activity":
        return Activity();
      case "calendar":
        return Calendar();
      case "support":
        return Support();
      case "auth.phone":
        return Auth();
      case "auth.code":
        return Auth();
      case "auth.oidc":
        return AuthOidc();
      case "care":
        return Care();
      case "seo.landing":
        return false ? SeoLanding() : RouteFallback(resolved.reason);
      default:
        return RouteFallback(resolved.reason);
    }
  }
  function RouteFallback(reason) {
    return h("section", { "class": "page", "data-route": state.route, "data-visual-id": "route-fallback", "data-state": reason || "error" }, [
      EmptyState({
        glyph: "!",
        title: "Route unavailable",
        desc: "This route is not enabled for the current portal profile.",
        action: { variant: "btn--ghost", label: "Back to home", action: "nav.go", id: "orders.list" }
      })
    ]);
  }
  function careAccessReason() {
    var access = state.access && state.access.care;
    var status = access && access.status;
    if (status === "granted") return "granted";
    if (status === "checking") return "loading";
    if (status === "error") return "error";
    return "unauthorized";
  }
  function applyRouteParams(match) {
    if (match.id === "order.detail" && match.params.id) state.currentOrderId = match.params.id;
    if (match.id === "proposal.detail" && match.params.id) state.currentSiteId = match.params.id;
    if (match.id === "agreement.detail" && match.params.id) state.agreementId = match.params.id;
    if (match.id === "visit.detail" && match.params.id) state.visitId = match.params.id;
    if (match.id === "invoice.detail" && match.params.id) state.invoiceId = match.params.id;
    if (match.id === "property.detail" && match.params.id) state.propertyId = match.params.id;
    if (match.id === "purchase.detail" && match.params.id) state.spaCurrentPurchase = match.params.id;
    if (match.id === "appointment.detail" && match.params.id) state.spaCurrentAppointment = match.params.id;
    if (match.id === "product.detail" && match.params.id) state.spaCurrentProduct = match.params.id;
  }
  function paramsForRoute(routeId) {
    if (routeId === "order.detail") {
      if (!state.currentOrderId) state.currentOrderId = state.orders[0] && state.orders[0].id;
      return { id: state.currentOrderId };
    }
    if (routeId === "proposal.detail") return { id: state.currentSiteId };
    if (routeId === "agreement.detail") return { id: state.agreementId };
    if (routeId === "visit.detail") return { id: state.visitId };
    if (routeId === "invoice.detail") return { id: state.invoiceId };
    if (routeId === "property.detail") return { id: state.propertyId };
    if (routeId === "purchase.detail") return { id: state.spaCurrentPurchase };
    if (routeId === "appointment.detail") return { id: state.spaCurrentAppointment };
    if (routeId === "product.detail") return { id: state.spaCurrentProduct };
    return {};
  }
  function queryFrom(value) {
    var index = String(value || "").indexOf("?");
    return index === -1 ? "" : String(value).slice(index);
  }
  function routeFamily(routeId) {
    if (routeId === "orders.list" || routeId === "order.detail" || routeId === "appointment.detail") return "appointments";
    if (routeId === "appointments" || routeId === "visit.detail" || routeId === "property.detail") return "appointments-timeline";
    if (routeId === "proposals.list" || routeId === "proposal.detail" || routeId === "agreement.detail") return "proposals";
    if (routeId === "purchases.list" || routeId === "purchase.detail") return "purchases";
    if (routeId === "products" || routeId === "product.detail") return "products";
    return null;
  }
  function setRouteQuery(routeId, value) {
    var query = queryFrom(value);
    state.routeQuery = query;
    state.routeQueryOwner = query ? routeFamily(routeId) : null;
  }
  function scopeRouteQuery(routeId) {
    var family = routeFamily(routeId);
    if (!family || state.routeQueryOwner !== family) clearRouteQuery();
  }
  function clearRouteQuery() {
    state.routeQuery = "";
    state.routeQueryOwner = null;
  }

  // app-templates/customer-portal/runtime/src/actions.js
  var ACTIONS = {
    "nav.go": function(id) {
      go(id);
    },
    "nav.landing": function() {
      return externalOnly("landingUrl");
    },
    "nav.services": function() {
      go("services");
    },
    "nav.pricing": function() {
      go("pricing");
    },
    "nav.products": function() {
      go("products");
    },
    "auth.gotoSignin": function() {
      state.authError = null;
      state.code = "";
      go("auth.oidc");
    },
    "auth.oidcSignIn": function() {
      if (state.config.dataMode !== "live") return failCommand("auth.oidcSignIn");
      state.oidc = "redirecting";
      render();
      return startCoreOidcSignIn(state.config).catch(function(error2) {
        state.oidc = "unavailable";
        state.commandErrors["auth.oidcSignIn"] = error2 && error2.message || "Sign-in failed";
        render();
        return false;
      });
    },
    "auth.retrySession": function() {
      return retryRuntimeLoad();
    },
    "auth.sendCode": function() {
      validatePhone();
    },
    "auth.verifyCode": function() {
      validateCode();
    },
    "auth.back": function() {
      state.authError = null;
      go("auth.phone");
    },
    "auth.resend": function() {
      failCommand("auth.resend");
    },
    "auth.apple": function() {
      failCommand("auth.apple");
    },
    "order.open": function(id) {
      openOrder(id);
    },
    "order.back": function() {
      go("orders.list");
    },
    "order.cancel": function(id) {
      if (false) return spaApptCancel(id);
      return runCommand("order.cancel", id, function() {
        cancelOrder(id);
      });
    },
    "order.reschedule": function(id) {
      if (false) return openSpaFlow({ entry: "reschedule", rescheduleOf: id });
      openDrawer("booking");
    },
    "order.downloadInvoice": function() {
      failCommand("order.downloadInvoice");
    },
    "order.bookAgain": function(id) {
      if (false) return openSpaFlow({ entry: "book-again", fromAppt: id });
      openDrawer("booking");
    },
    "order.filter": function(id) {
      setState({ filter: id });
    },
    "compliance.unlock": function() {
      toast("Compliance Reports is a Pro add-on \u2014 ask your account manager");
    },
    "booking.open": function(id) {
      if (false) return openSpaFlow(id ? { entry: "service", serviceCode: id } : { entry: "empty" });
      openDrawer("booking");
    },
    "booking.close": function() {
      state.spaFlow = null;
      state.spaBookAck = false;
      state.spaNote = "";
      closeDrawer();
    },
    ...false ? {
      "booking.selectService": function(id) {
        var flow = state.spaFlow;
        if (!flow) return;
        flow.serviceCode = id;
        flow.specialistRef = null;
        flow.slotRef = null;
        flow.visitMode = null;
        flow.locationRef = null;
        flow.addOns = [];
        flow.held = false;
        spaFlowAfterService(flow);
        render();
      },
      "booking.selectVisitMode": function(id) {
        var flow = state.spaFlow;
        if (!flow) return;
        flow.visitMode = id;
        flow.locationRef = null;
        spaInvalidateAfterOptions(flow, "visit-mode");
        render();
      },
      "booking.selectLocation": function(id) {
        var flow = state.spaFlow;
        if (!flow) return;
        flow.locationRef = id;
        spaInvalidateAfterOptions(flow, "location");
        render();
      },
      "booking.reloadLocations": function() {
        return spaReloadLocations();
      },
      "booking.toggleAddon": function(id) {
        return spaToggleAddon(id);
      },
      "booking.changeNotes": function(value) {
        state.spaNote = String(value || "");
      },
      "booking.next": function() {
        return spaFlowNext();
      },
      "booking.selectSpecialist": function(id) {
        var flow = state.spaFlow;
        if (!flow) return;
        flow.specialistRef = id === "any" ? null : id;
        flow.slotRef = null;
        flow.held = false;
        var booking = spaBookingModel(flow.serviceCode, flow.specialistRef);
        flow.dayKey = (booking.days[0] || {}).key || null;
        flow.step = "slots";
        render();
      },
      "booking.selectSlot": function(id) {
        var flow = state.spaFlow;
        if (!flow) return;
        if (String(id).indexOf("day:") === 0) {
          flow.dayKey = String(id).slice(4);
          flow.slotRef = null;
        } else {
          flow.slotRef = id;
          var day = spaBookingModel().days.find(function(item) {
            return (item.slots || []).some(function(slot) {
              return slot.ref === id;
            });
          });
          if (day) flow.dayKey = day.key;
        }
        render();
      },
      "booking.hold": function(id) {
        return spaHoldSlot(id);
      },
      "booking.retry": function(id) {
        var flow = state.spaFlow;
        if (!flow) return;
        if (id === "hold") {
          clearSpaCommand("booking.hold:" + flow.slotRef);
          return spaHoldSlot(flow.slotRef);
        }
        clearSpaCommand("booking.confirm:" + spaBookingModel().ref);
        return spaBookingConfirm();
      },
      "booking.back": function() {
        return spaFlowBack();
      },
      "booking.ackPolicy": function() {
        setState({ spaBookAck: !state.spaBookAck });
      }
    } : null,
    "booking.confirm": function() {
      if (false) return spaBookingConfirm();
      closeDrawer();
      failCommand("booking.confirm");
    },
    ...false ? {
      "appointment.open": function(id) {
        state.spaCurrentAppointment = id;
        state.view = "ready";
        go("appointment.detail");
      },
      "appointment.openPurchase": function(id) {
        ACTIONS["purchase.open"](id);
      },
      "appointment.reschedule": function(id) {
        return openSpaFlow({ entry: "reschedule", rescheduleOf: id });
      },
      "appointment.cancel": function(id) {
        return spaApptCancel(id);
      },
      "appointment.bookAgain": function(id) {
        return openSpaFlow({ entry: "book-again", fromAppt: id });
      },
      "product.open": function(id) {
        state.spaCurrentProduct = id;
        state.spaGallery = 0;
        state.view = "ready";
        go("product.detail");
      },
      "product.gallerySelect": function(id) {
        setState({ spaGallery: Math.max(0, Number(id) || 0) });
      }
    } : null,
    "proposal.review": function() {
      go("proposals.list");
    },
    "proposal.open": function(id) {
      openProposal(id);
    },
    "proposal.selectPlan": function(id) {
      runCommand("proposal.selectPlan", id, function() {
        selectPlan(id);
      });
    },
    "proposal.approve": function() {
      runCommand("proposal.approve", state.currentSiteId, function() {
        decideSite("approved");
      });
    },
    "proposal.requestRevision": function() {
      runCommand("proposal.requestRevision", state.currentSiteId, function() {
        decideSite("revision");
      });
    },
    "proposal.decline": function() {
      runCommand("proposal.decline", state.currentSiteId, function() {
        decideSite("declined");
      });
    },
    "agreement.open": function(id) {
      openAgreement(id);
    },
    "quote.approve": function(id) {
      return openContractConfirm("approve", id);
    },
    "quote.decline": function(id) {
      return openContractConfirm("decline", id);
    },
    "quote.confirm": function(id) {
      return confirmContractCommand("quote", id);
    },
    "quote.cancel": function() {
      return cancelContractConfirm();
    },
    "quote.retryView": function(id) {
      return retryQuoteView(id);
    },
    "agreement.approve": function(id) {
      return openContractConfirm("agreement", id);
    },
    "agreement.confirm": function(id) {
      return confirmContractCommand("agreement", id);
    },
    "agreement.cancel": function() {
      return cancelContractConfirm();
    },
    "agreement.toggleTerms": function() {
      state.agreementTermsOpen = !state.agreementTermsOpen;
      render();
    },
    "contracts.refresh": function() {
      return refreshContracts();
    },
    "weather.confirm": function(id) {
      runCommand("weather.confirm", id, function() {
        confirmWeather(id, "confirmed");
      });
    },
    "weather.decline": function(id) {
      runCommand("weather.decline", id, function() {
        confirmWeather(id, "declined");
      });
    },
    "membership.activate": function() {
      failCommand("membership.activate");
    },
    "support.open": function() {
      var url = configuredExternalUrl(state.config, "supportUrl");
      if (url) {
        globalThis.location.assign(url);
        return;
      }
      if (isSpa()) return setState({ spaSupport: true, accountMenu: false, mobileNav: false });
      go("support");
    },
    "support.sendMessage": function() {
      runCommand("support.sendMessage", null, sendChat);
    },
    "support.quickReply": function(id) {
      runCommand("support.quickReply", id, function() {
        pushChat(id);
      });
    },
    "support.helpTopic": function(id) {
      go("support");
      runCommand("support.helpTopic", id, function() {
        pushChat(id);
      });
    },
    "support.call": function() {
      if (isSpa()) return setState({ spaSupport: true });
      failCommand("support.call");
    },
    "support.email": function() {
      if (isSpa()) return setState({ spaSupport: true });
      failCommand("support.email");
    },
    "support.dismiss": function() {
      setState({ spaSupport: false });
    },
    "care.selectUnit": function(id, el) {
      return selectCareUnit(id, el);
    },
    "care.download": function(id, el) {
      return downloadCareDocument(id, el);
    },
    "care.requestRetreat": function(id, el) {
      return requestCareRetreat(id, el);
    },
    "care.selectSpecialist": function(id, el) {
      return selectCareSpecialist(id, el);
    },
    "care.completeTask": function(id, el) {
      return toggleCareTask(id, el);
    },
    "care.contactProvider": function(id, el) {
      return runUnavailableCareCommand("care.contactProvider", id, el);
    },
    "care.openSecureDoc": function(id, el) {
      return runUnavailableCareCommand("care.openSecureDoc", id, el);
    },
    ...false ? {
      "seo.cta.book": function(id, el) {
        validateSeoLink(el);
      },
      "seo.cta.quote": function(id, el) {
        validateSeoLink(el);
      },
      "seo.cta.call": function(id, el) {
        validateSeoLink(el);
      },
      "seo.cta.services": function(id, el, event) {
        navigateSeoServices(el, event);
      },
      "seo.service.select": function(id) {
        selectSeoService(id, render);
      },
      "seo.faq.toggle": function(id, el, event) {
        if (event) event.preventDefault();
        toggleSeoFaq(id, render);
      }
    } : null,
    "cart.open": function() {
      go(false ? "cart" : "checkout");
    },
    "service.request": function() {
      openDrawer("booking");
    },
    "service.requestForm": function() {
      return openRequestForm();
    },
    "service.requestExtra": function(id) {
      runCommand("service.requestExtra", id, function() {
        requestExtraService(id);
      });
    },
    "service.reportIssue": function() {
      failCommand("service.reportIssue");
    },
    "access.confirm": function(id) {
      runCommand("access.confirm", id, function() {
        confirmAccess(id);
      });
    },
    "access.update": function() {
      failCommand("access.update");
    },
    "cart.addItem": function(id) {
      if (false) {
        if (spaCurrentApiDemoOpen()) return spaLiveCartAdd(id);
        return runSpaCommand("cart.addItem:" + id, function() {
          spaAddLine(id);
        });
      }
      runCommand("cart.addItem", id, function() {
        addToCart(id);
      });
    },
    "cart.removeItem": function(id) {
      if (false) {
        if (spaCurrentApiDemoOpen()) return spaLiveCartRemove(id);
        return runSpaCommand("cart.removeItem:" + id, function() {
          spaSetLines(spaLines().filter(function(line) {
            return line.ref !== id;
          }));
        });
      }
      runCommand("cart.removeItem", id, function() {
        removeCartItem(id);
      });
    },
    ...false ? {
      "cart.changeQuantity": function(id) {
        return spaChangeQuantity(id);
      }
    } : null,
    "cart.inc": function(id) {
      runCommand("cart.inc", id, function() {
        changeQty(id, 1);
      });
    },
    "cart.dec": function(id) {
      runCommand("cart.dec", id, function() {
        changeQty(id, -1);
      });
    },
    "checkout.placeOrder": function() {
      runCommand("checkout.placeOrder", null, placeFixtureOrder);
    },
    "checkout.pickAddress": function(id) {
      runCommand("checkout.pickAddress", id, function() {
        selectAddress(id);
      });
    },
    "checkout.pickPayment": function(id) {
      runCommand("checkout.pickPayment", id, function() {
        selectPayment(id);
      });
    },
    "account.open": function() {
      go("account");
    },
    "account.openPurchases": function() {
      state.spaPurchFilter = "all";
      go("purchases.list");
    },
    "account.openPlan": function() {
      go("plan");
    },
    "account.openProfile": function() {
      go("profile");
    },
    "account.menu": function() {
      setState({ accountMenu: !state.accountMenu, mobileNav: false });
    },
    ...false ? {
      "purchases.filter": function(id) {
        setState({ spaPurchFilter: id });
      },
      "purchases.more": function() {
        spaLoadMore();
      },
      "purchase.open": function(id) {
        state.spaCurrentPurchase = id;
        state.view = "ready";
        go("purchase.detail");
      },
      "purchase.openAppointment": function() {
        go("orders.list");
      },
      "purchase.cancelRequest": function(id) {
        return runSpaCommand("purchase.cancelRequest:" + id, function() {
          state.spaCancelReqs = Object.assign({}, state.spaCancelReqs, { [id]: "accepted-for-review" });
        });
      },
      "purchase.returnRequest": function(id) {
        return runSpaCommand("purchase.returnRequest:" + id, function() {
          state.spaReturns = Object.assign({}, state.spaReturns, { [id]: "accepted-for-review" });
        });
      },
      "purchase.buyAgain": function(id) {
        return spaBuyAgain(id);
      },
      "plan.bookWithCredit": function(id) {
        if (isSpa() && state.capability === "target-appointments") return openSpaFlow({ entry: "credit", planRef: id });
        openDrawer("booking");
      },
      "plan.purchase": function(id) {
        if (!spaPlanSellOpen() || state.spaOfferDemo !== "sellable") return false;
        state.spaPlanOffer = id;
        return spaCheckoutStart("plan");
      },
      "plan.cancelRenewal": function(id) {
        return runSpaCommand("plan.cancelRenewal:" + id, function() {
          state.spaPlanCancelled = Object.assign({}, state.spaPlanCancelled, { [id]: true });
        });
      },
      "shop.pickVariant": function(id) {
        var parts = String(id || "").split("|");
        state.spaVariantPick = Object.assign({}, state.spaVariantPick, { [parts[0]]: parts[1] });
        render();
      },
      "checkout.start": function(id) {
        return spaCheckoutStart(id);
      },
      "checkout.selectFulfillment": function() {
        render();
      },
      "checkout.ackPolicy": function() {
        setState({ spaPolicyAck: !state.spaPolicyAck });
      },
      "checkout.confirm": function() {
        return spaConfirmCheckout();
      },
      "checkout.retryConfirm": function() {
        return spaConfirmCheckout();
      }
    } : null,
    "products.filter": function(id) {
      setState({ prodCat: id });
    },
    "activity.open": function() {
      go("activity");
    },
    "activity.markRead": function() {
      runCommand("activity.markRead", null, function() {
        state.activityReadAll = true;
        toast("Activity marked read in fixture state");
      });
    },
    "activity.filter": function(id) {
      setState({ feedFilter: id });
    },
    "activity.act": function(id) {
      feedAction(id);
    },
    "profile.open": function() {
      go("profile");
    },
    "profile.filter": function(id) {
      setState({ profileFilter: id });
    },
    "profile.setDefaultAddress": function(id) {
      runCommand("profile.setDefaultAddress", id, function() {
        selectAddress(id);
      });
    },
    "profile.setDefaultPayment": function(id) {
      runCommand("profile.setDefaultPayment", id, function() {
        selectPayment(id);
      });
    },
    "profile.addAddress": function() {
      failCommand("profile.addAddress");
    },
    "profile.addCard": function() {
      failCommand("profile.addCard");
    },
    "profile.updateAddress": function() {
      failCommand("profile.updateAddress");
    },
    "profile.togglePref": function(id) {
      runCommand("profile.togglePref", id, function() {
        togglePref(id);
      });
    },
    ...false ? {
      "profile.edit": function() {
        var value = spaProfileValues();
        state.spaProfileDraft = { phone: value.phone, email: value.email, prefs: Object.assign({}, value.prefs) };
        state.spaProfileErrors = null;
        render();
      },
      "profile.changeField": function(id) {
        return spaProfileChange(id);
      },
      "profile.save": function() {
        return spaProfileSave();
      },
      "profile.reload": function() {
        clearSpaCommand("profile.save:profile");
        state.spaProfileDraft = null;
        state.spaProfileErrors = null;
        if (state.config.dataMode === "live") return reloadRuntimeModule("profile").then(function() {
          toast("Profile reloaded from Core");
        });
        render();
        toast("Profile reloaded \u2014 showing the details on file");
      }
    } : null,
    "profile.managePlan": function() {
      go("pricing");
    },
    "profileEdit.start": function(id) {
      if (!startProfileEdit(id)) return false;
      render();
      focusProfileInput(false);
      return true;
    },
    "profileEdit.cancel": function() {
      if (!cancelProfileEdit()) return false;
      render();
      return true;
    },
    "profileEdit.save": function() {
      return saveProfileEdit({ reload: reloadRuntimeModule, onChange: function(phase) {
        render();
        if (phase === "invalid" || phase === "refused") focusProfileInput(true);
      } });
    },
    "overview.selectProperty": function(id) {
      state.ovProperty = state.ovProperty === id ? null : id;
      render();
    },
    "overview.closeProperty": function() {
      state.ovProperty = null;
      render();
    },
    "overview.scrubWeather": function(id) {
      state.ovWeatherIndex = Number(id);
      render();
    },
    "overview.retryWeather": function() {
      return retryForecast();
    },
    "overview.openProperty": function(id) {
      if (id) state.propertyId = id;
      go("property.detail");
    },
    "overview.openProperties": function() {
      go("appointments");
    },
    "overview.openAppointments": function() {
      go("appointments");
    },
    "appointments.filterDay": function(id) {
      var day = Number(id);
      state.apptDay = id === null || id === "" || id === void 0 || !Number.isInteger(day) ? null : day;
      render();
    },
    "appointments.openVisit": function(id) {
      state.visitId = id;
      go("visit.detail");
    },
    "invoice.open": function(id) {
      if (id) state.invoiceId = id;
      go("invoice.detail");
    },
    "invoice.pay": function(id) {
      return payInvoice(id, { reload: reloadRuntimeModule, render });
    },
    "appointments.openProperty": function(id) {
      state.propertyId = id;
      go("property.detail");
    },
    "property.showOnMap": function(id) {
      if (id) state.ovProperty = id;
      go("overview");
    },
    "appointments.sortResource": function() {
      state.apptSort = state.apptSort === "desc" ? "asc" : "desc";
      render();
    },
    "overview.openCalendar": function() {
      go("calendar");
    },
    "overview.openInvoices": function() {
      go("activity");
    },
    "overview.openInvoice": function() {
      go("activity");
    },
    "overview.openContracts": function() {
      go("proposals.list");
    },
    "overview.openSupport": function() {
      go("support");
    },
    "overview.newRequest": function() {
      go("support");
    },
    "auth.signOut": function() {
      if (state.config.dataMode === "live") {
        state.oidc = "signing-out";
        render();
        return startCoreOidcSignOut(state.config).catch(function(error2) {
          state.oidc = "unavailable";
          state.commandErrors["auth.signOut"] = error2 && error2.message || "Sign-out failed";
          render();
          return false;
        });
      }
      state.session.authenticated = false;
      state.account = "session-expired";
      state.oidc = "ready-signed-out";
      state.phone = "";
      state.code = "";
      invalidateCareRuntime();
      go("auth.oidc");
      toast("Signed out");
    },
    "calendar.open": function() {
      go("calendar");
    },
    "calendar.prev": function() {
      calShift(-1);
    },
    "calendar.next": function() {
      calShift(1);
    },
    "ui.retry": function(id) {
      return retrySpaOrRuntime(id);
    },
    "ui.toggleMode": function() {
      state.userModeOverridden = true;
      setState({ mode: state.mode === "Dark" ? "Light" : "Dark" });
    },
    "ui.toggleMobileNav": function() {
      setState({ mobileNav: !state.mobileNav, accountMenu: false });
    },
    "theme.pick": function(id) {
      return pickTheme(id);
    }
  };
  function retryForecast() {
    if (state.config.dataMode !== "live" || state.liveWeatherState === "loading") return false;
    return reloadRuntimeModule("overview").catch(function() {
      return null;
    });
  }
  function openRequestForm() {
    var url = state.config.requestFormUrl;
    if (!url) {
      failCommand("nav.external.requestFormUrl");
      return false;
    }
    globalThis.location.assign(url);
    return true;
  }
  function externalOnly(configKey) {
    var url = configuredExternalUrl(state.config, configKey);
    if (url) {
      globalThis.location.assign(url);
      return true;
    }
    failCommand("nav.external." + configKey);
    return false;
  }
  function bindActions(root) {
    root.addEventListener("click", function(e) {
      var el = e.target.closest("[data-action]");
      if (!el || !root.contains(el)) return;
      if (el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true") return;
      var name = el.getAttribute("data-action");
      var id = el.getAttribute("data-id") || null;
      if (el.hasAttribute("data-requires-confirmation")) {
        if (!window.confirm("Are you sure?\n\n" + name + (id ? " \xB7 " + id : ""))) return;
      }
      var fn = ACTIONS[name];
      if (fn) {
        var result = fn(id, el, e);
        if (result && typeof result.then === "function") {
          Promise.resolve(result).catch(function() {
            render();
          });
        }
      } else failCommand(name);
    });
  }
  function failCommand(name) {
    console.warn("[aircove] command unavailable:", name);
    state.commandErrors[name] = "Command is not connected";
    toast(name + " is not connected yet");
  }
  function commandKey(name, id) {
    return name + ":" + (id || "_");
  }
  function runCommand(name, id, handler) {
    var key = commandKey(name, id);
    state.pending[key] = true;
    delete state.commandErrors[key];
    try {
      handler();
    } catch (error2) {
      state.commandErrors[key] = error2 && error2.message ? error2.message : "Command failed";
      toast(name + " failed");
    } finally {
      state.pending[key] = false;
      render();
    }
  }
  function retrySpaOrRuntime(id) {
    if (false) {
      state.spaCartDemo = "as-added";
      spaSetLines(spaLines());
      render();
      return true;
    }
    if (id === "checkout-quote") {
      setState({ spaCheckoutDemo: "ready" });
      return true;
    }
    if (id === "booking-hold") {
      setState({ spaHold: "held" });
      return true;
    }
    if (false) return spaReloadAddons();
    if (id === "slots") {
      setState({ spaSlots: "ready" });
      return true;
    }
    if (id === "plan-offers") {
      setState({ spaOfferDemo: "sellable" });
      return true;
    }
    if (id === "plan-credit") {
      setState({ spaCredit: "ok" });
      return true;
    }
    if (id === "product-reviews") {
      if (state.config.dataMode === "live") return reloadRuntimeModule("products");
      setState({ spaReviews: "ready" });
      return true;
    }
    if (id && state.commands[id]) {
      state.commands = Object.assign({}, state.commands);
      delete state.commands[id];
      render();
      return true;
    }
    return retryRuntimeLoad();
  }
  function careEntityScope(name, id, element, content) {
    if (name === "care.selectUnit") return content.units && content.units.find(function(item) {
      return item.id === id;
    });
    if (name === "care.download" || name === "care.openSecureDoc") {
      return content.docs && content.docs.find(function(item) {
        return item.id === id;
      });
    }
    if (name === "care.selectSpecialist") {
      return content.specialists && content.specialists.find(function(item) {
        return item.id === id;
      });
    }
    if (name === "care.completeTask") return content.tasks && content.tasks.find(function(item) {
      return item.id === id;
    });
    if (name === "care.contactProvider") return content.provider && content.provider.id === id ? content.provider : null;
    if (name === "care.requestRetreat") {
      var scope = content.guarantee && content.guarantee.scope;
      var propertyId = element && element.getAttribute("data-property-id");
      var serviceId = element && element.getAttribute("data-service-id");
      return scope && scope.planId === id && scope.propertyId === propertyId && scope.serviceId === serviceId ? scope : null;
    }
    return null;
  }
  function authorizeCareCommand(name, id, element, expected) {
    var envelope2 = state.moduleData.care;
    var enabled = (state.config.enabledModules || []).includes("care");
    var authenticated = state.session && state.session.authenticated === true;
    var scoped = state.session && state.session.hasCustomerScope === true && state.session.hasTenantScope === true;
    var entitled = state.access && state.access.care && state.access.care.status === "granted";
    var fixtureReady = state.config.dataMode === "fixture" && envelope2 && envelope2.id === "care" && envelope2.phase === "payload" && envelope2.state === "ready" && envelope2.access && envelope2.access.status === "granted" && envelope2.content && Array.isArray(envelope2.allowedActions);
    var currentVertical = fixtureReady && envelope2.vertical === state.config.vertical && state.careStateVertical === state.config.vertical;
    var actionAllowed = fixtureReady && envelope2.allowedActions.includes(name);
    var entity = fixtureReady ? careEntityScope(name, id, element, envelope2.content) : null;
    var epoch = state.careAuthorizationEpoch || 0;
    var expectedCurrent = !expected || expected.epoch === epoch && expected.vertical === state.config.vertical && expected.entityId === id;
    if (!enabled || !authenticated || !scoped || !entitled || !fixtureReady || !currentVertical || !expectedCurrent) {
      var authorizationError = new Error("Care command is not authorized for the current portal state");
      authorizationError.careAuthorizationFailure = true;
      throw authorizationError;
    }
    if (!entity) throw new Error("Care command target is invalid or no longer current");
    if (!actionAllowed) throw new Error("Care command is unavailable");
    return { envelope: envelope2, content: envelope2.content, entity, epoch, vertical: state.config.vertical, entityId: id };
  }
  function clearGeneralCareCommandErrors() {
    for (const key of /* @__PURE__ */ Object.keys(state.commandErrors || {})) {
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
    } catch (error2) {
      return failCareMutation(name, id, error2);
    }
  }
  function runUnavailableCareCommand(name, id, element) {
    return runCareCommand(name, id, element, function() {
      throw new Error("Care command is unavailable");
    });
  }
  function selectCareUnit(id, element) {
    return runCareCommand("care.selectUnit", id, element, function() {
      state.careSelectedUnitId = id;
    });
  }
  function selectCareSpecialist(id, element) {
    return runCareCommand("care.selectSpecialist", id, element, function() {
      state.careSelectedSpecialistId = id;
    });
  }
  function toggleCareTask(id, element) {
    return runCareCommand("care.completeTask", id, element, function(authorization) {
      var task = authorization.entity;
      var current = Object.prototype.hasOwnProperty.call(state.careTasksDone, id) ? state.careTasksDone[id] : !!task.done;
      state.careTasksDone = Object.assign({}, state.careTasksDone, { [id]: !current });
    });
  }
  function downloadCareDocument(id, element) {
    return runUnavailableCareCommand("care.download", id, element);
  }
  var careRetreatFlights = /* @__PURE__ */ new Map();
  function failCareMutation(name, id, error2) {
    var key = commandKey(name, error2 && error2.careAuthorizationFailure ? null : id);
    state.commandErrors[key] = error2 && error2.message ? error2.message : "Command failed";
    delete state.pending[key];
    render();
    toast(name + " failed");
    return false;
  }
  function requestCareRetreat(id, element) {
    var name = "care.requestRetreat";
    var key = commandKey(name, id);
    var authorization;
    try {
      authorization = authorizeCareCommand(name, id, element);
      clearGeneralCareCommandErrors();
      if (state.careRetreatRequests[id] && state.careRetreatRequests[id].status === "submitted") {
        throw new Error("Care re-treatment request is already submitted");
      }
    } catch (error2) {
      return Promise.resolve(failCareMutation(name, id, error2));
    }
    if (careRetreatFlights.has(key)) return careRetreatFlights.get(key);
    delete state.commandErrors[key];
    state.pending[key] = true;
    state.careRetreatRequests = Object.assign({}, state.careRetreatRequests, {
      [id]: { planId: authorization.entity.planId, propertyId: authorization.entity.propertyId, serviceId: authorization.entity.serviceId, status: "submitting" }
    });
    render();
    var flight = Promise.resolve().then(function() {
      authorizeCareCommand(name, id, element, authorization);
      state.careRetreatRequests = Object.assign({}, state.careRetreatRequests, {
        [id]: { planId: authorization.entity.planId, propertyId: authorization.entity.propertyId, serviceId: authorization.entity.serviceId, status: "submitted" }
      });
      return state.careRetreatRequests[id];
    }).catch(function(error2) {
      if (state.careAuthorizationEpoch === authorization.epoch) {
        var requests = Object.assign({}, state.careRetreatRequests);
        delete requests[id];
        state.careRetreatRequests = requests;
        delete state.pending[key];
        if (error2 && error2.careAuthorizationFailure) delete state.commandErrors[key];
        else state.commandErrors[key] = error2 && error2.message ? error2.message : "Care re-treatment request failed";
      }
      return false;
    }).finally(function() {
      if (state.careAuthorizationEpoch === authorization.epoch) delete state.pending[key];
      careRetreatFlights.delete(key);
      render();
    });
    careRetreatFlights.set(key, flight);
    return flight;
  }
  function setState(patch) {
    Object.assign(state, patch);
    render();
  }
  function go(route, replace) {
    var resolved = resolveRoute(route);
    state.route = resolved.id;
    state.mobileNav = false;
    state.accountMenu = false;
    if (state.drawer) {
      state.drawer = null;
      state.spaFlow = null;
      state.spaBookAck = false;
      state.spaNote = "";
    }
    writeRouteToLocation(resolved.id, replace);
    render();
  }
  function openOrder(id) {
    if (!orderItems().some(function(order) {
      return order.id === id;
    })) throw new Error("Order not found");
    state.currentOrderId = id;
    state.view = "ready";
    go("order.detail");
  }
  function cancelOrder(id) {
    var order = state.orders.find(function(o) {
      return o.id === id;
    });
    if (!order) throw new Error("Order not found");
    if (order.status === "completed" || order.status === "cancelled") throw new Error("Order cannot be cancelled");
    state.orders = state.orders.map(function(o) {
      return o.id === id ? Object.assign({}, o, { status: "cancelled" }) : o;
    });
    render();
    toast("Visit " + id + " cancelled");
  }
  function setCart(items) {
    state.cartItems = items;
    render();
  }
  function addToCart(name) {
    var p = findProduct(name);
    if (!p) throw new Error("Product not found");
    var existing = state.cartItems.find(function(x) {
      return x.name === name;
    });
    if (existing) state.cartItems = state.cartItems.map(function(x) {
      return x.name === name ? Object.assign({}, x, { qty: x.qty + 1 }) : x;
    });
    else state.cartItems = state.cartItems.concat([Object.assign({}, p, { qty: 1 })]);
    render();
    toast(name + " added to cart");
  }
  function changeQty(name, delta) {
    if (!state.cartItems.some(function(x) {
      return x.name === name;
    })) throw new Error("Cart item not found");
    state.cartItems = state.cartItems.map(function(x) {
      return x.name === name ? Object.assign({}, x, { qty: x.qty + delta }) : x;
    }).filter(function(x) {
      return x.qty > 0;
    });
    render();
  }
  function removeCartItem(name) {
    if (!state.cartItems.some(function(x) {
      return x.name === name;
    })) throw new Error("Cart item not found");
    setCart(state.cartItems.filter(function(x) {
      return x.name !== name;
    }));
  }
  function selectAddress(id) {
    if (!currentFixture().addresses.some(function(address) {
      return address.id === id;
    })) throw new Error("Address not found");
    setState({ addrId: id });
  }
  function selectPayment(id) {
    if (!currentFixture().cards.some(function(card) {
      return card.id === id;
    })) throw new Error("Payment method not found");
    setState({ payId: id });
  }
  function pickThemeResetCart() {
    state.cartItems = [];
    state.prodCat = "all";
  }
  function signIn() {
    var nextRoute = state.session.intendedRoute || "orders.list";
    state.session.authenticated = true;
    state.session.intendedRoute = null;
    state.authError = null;
    state.code = "";
    go(nextRoute);
    toast("Signed in");
  }
  function validatePhone() {
    var digits = (state.phone || "").replace(/\D/g, "");
    if (digits.length < 6) {
      setState({ authError: "Enter a valid phone number" });
      return;
    }
    state.authError = null;
    state.code = "";
    go("auth.code");
  }
  function validateCode() {
    if ((state.code || "").length < 4) {
      setState({ authError: "Enter all 4 digits" });
      return;
    }
    signIn();
  }
  function togglePref(key) {
    if (["receipts", "sms", "marketing"].indexOf(key) === -1) throw new Error("Preference not found");
    state.prefs = Object.assign({}, state.prefs, {});
    state.prefs[key] = !state.prefs[key];
    render();
    toast("Preference updated in fixture state");
  }
  function calShift(delta) {
    var m = state.calMonth + delta, y = state.calYear;
    if (m < 0) {
      m = 11;
      y--;
    } else if (m > 11) {
      m = 0;
      y++;
    }
    setState({ calMonth: m, calYear: y });
  }
  function feedAction(act) {
    if (act === "orders") {
      var o = state.orders.find(function(x) {
        return x.status === "inprogress";
      }) || state.orders[0];
      openOrder(o.id);
    } else if (act === "products") go("products");
    else if (act === "pricing") go("pricing");
    else if (act === "care") go("care");
    else if (act === "book") openDrawer("booking");
    else if (act === "invoice") toast("Invoice #SV-2381 emailed to you");
    else if (act === "weather") {
      var w = state.orders.find(function(x) {
        return x.wt && x.wt.status === "pending";
      });
      if (w) openOrder(w.id);
    }
  }
  function pushChat(text10) {
    if (!text10 || !text10.trim()) throw new Error("Message is empty");
    state.messages = state.messages.concat([{ from: "user", text: text10.trim() }]);
    state.chatInput = "";
    if (state.route !== "support") state.route = "support";
    toast("Message queued in fixture state");
  }
  function sendChat() {
    pushChat(state.chatInput);
  }
  function confirmAccess(id) {
    var key = id || "";
    var cal = F.stormCalendar(state.theme);
    if (!cal.days.some(function(day) {
      return day.needsAccess && day.dateSub === key;
    })) throw new Error("Access confirmation target not found");
    state.accessConfirmations[key] = true;
    toast("Access confirmed in fixture state");
  }
  function requestExtraService(id) {
    state.serviceRequests = state.serviceRequests.concat([{ id: id || "extra", status: "draft" }]);
    openDrawer("booking");
  }
  function placeFixtureOrder() {
    if (!state.cartItems.length) throw new Error("Cart is empty");
    var first = state.cartItems[0];
    var total = state.cartItems.reduce(function(sum, item) {
      return sum + item.priceNum * item.qty;
    }, 0);
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
      total,
      timeline: ["Order placed in fixture state", "Awaiting dispatch"]
    };
    state.orders = [order].concat(state.orders);
    setCart([]);
    go("orders.list");
    toast("Order placed in fixture state");
  }
  function openProposal(id) {
    if (quotePackage()) {
      var group = quoteGroupFor(id);
      if (!group) throw new Error("Quote not found");
      state.currentSiteId = group.id;
      state.contractConfirm = null;
      go("proposal.detail");
      return;
    }
    if (!proposalSites().some(function(p) {
      return p.id === id;
    })) throw new Error("Proposal not found");
    state.currentSiteId = id;
    state.psites = state.psites.map(function(p) {
      return p.id === id && p.status === "unseen" ? Object.assign({}, p, { status: "viewed" }) : p;
    });
    go("proposal.detail");
  }
  function openAgreement(id) {
    if (!contractAgreementFor(id)) throw new Error("Agreement not found");
    state.agreementId = id;
    state.agreementTermsOpen = false;
    state.contractConfirm = null;
    go("agreement.detail");
  }
  var contractCommands = createContractCommands({
    state,
    render: function() {
      render();
    },
    notify: function(message) {
      toast(message);
    },
    current: function() {
      return quotePackage();
    },
    context: function() {
      return { config: state.config, state };
    },
    gateway: function() {
      return state.config.dataMode === "live" ? createCoreSnowQuotesAdapter() : createFixtureContractsGateway(state);
    },
    reload: function() {
      return reloadRuntimeModule("proposals").then(function() {
        var pkg = quotePackage();
        if (!pkg) throw new Error("The contracts readback did not return a package");
        return pkg;
      });
    }
  });
  function contractCommandsBusy() {
    return contractCommands.busy();
  }
  function scheduleQuoteViews(group) {
    if (!group || contractCommands.busy()) return;
    var pending = group.orders.filter(function(order) {
      return order.status === "unseen" && !state.quoteViews[order.backendId];
    }).map(function(order) {
      return order.backendId;
    });
    if (!pending.length) return;
    pending.forEach(function(id) {
      state.quoteViews[id] = "pending";
    });
    Promise.resolve().then(function() {
      if (contractCommands.busy()) {
        pending.forEach(function(id) {
          if (state.quoteViews[id] === "pending") delete state.quoteViews[id];
        });
        render();
        return;
      }
      contractCommands.view(pending);
    });
  }
  function contractTarget(id) {
    var backendId = Number(id);
    return Number.isInteger(backendId) && backendId > 0 ? backendId : null;
  }
  function openContractConfirm(kind, id) {
    var backendId = contractTarget(id);
    if (!backendId || contractCommands.busy()) return false;
    state.contractConfirm = { kind, backendId };
    if (state.contractCommand && state.contractCommand.phase !== "pending") state.contractCommand = null;
    render();
    return true;
  }
  function confirmContractCommand(kind, id) {
    var backendId = contractTarget(id);
    var confirm = state.contractConfirm;
    if (!backendId || !confirm || confirm.backendId !== backendId) return false;
    if (kind === "agreement") return confirm.kind === "agreement" ? contractCommands.approveAgreement(backendId) : false;
    if (confirm.kind !== "approve" && confirm.kind !== "decline") return false;
    return contractCommands.decide(confirm.kind, backendId);
  }
  function cancelContractConfirm() {
    if (contractCommands.busy()) return false;
    state.contractConfirm = null;
    render();
    return true;
  }
  function retryQuoteView(id) {
    var backendId = contractTarget(id);
    if (!backendId || contractCommands.busy()) return false;
    delete state.quoteViews[backendId];
    return contractCommands.view([backendId]);
  }
  function refreshContracts() {
    if (contractCommands.busy()) return false;
    state.contractCommand = null;
    state.contractConfirm = null;
    return reloadRuntimeModule("proposals").catch(function() {
      return null;
    });
  }
  function selectPlan(planId) {
    if (!planId) throw new Error("Plan is required");
    if (!proposalSites().some(function(p) {
      return p.id === state.currentSiteId;
    })) throw new Error("Proposal not found");
    if (["897", "898", "899"].indexOf(planId) === -1) throw new Error("Proposal plan not found");
    state.psites = state.psites.map(function(p) {
      return p.id === state.currentSiteId ? Object.assign({}, p, { selected: planId }) : p;
    });
    render();
  }
  function decideSite(status) {
    if (["approved", "revision", "declined"].indexOf(status) === -1) throw new Error("Unsupported proposal status");
    var id = state.currentSiteId;
    if (!proposalSites().some(function(p) {
      return p.id === id;
    })) throw new Error("Proposal not found");
    state.psites = state.psites.map(function(p) {
      return p.id === id ? Object.assign({}, p, { status }) : p;
    });
    go("proposals.list");
    toast(status === "approved" ? "Plan approved in fixture state" : status === "revision" ? "Revision requested in fixture state" : "Proposal declined in fixture state");
  }
  function pickTheme(name) {
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
    state.spaNote = "";
    state.spaCurrentAppointment = null;
    state.spaPlanOffer = null;
    state.spaRescheduled = {};
    state.spaProfile = null;
    state.spaProfileDraft = null;
    state.spaProfileErrors = null;
    for (const moduleId of /* @__PURE__ */ Object.keys(state.moduleData || {})) {
      if (moduleId !== "auth") delete state.moduleData[moduleId];
    }
    for (const moduleId of /* @__PURE__ */ Object.keys(state.moduleStatus || {})) {
      if (moduleId !== "auth") delete state.moduleStatus[moduleId];
    }
    pickThemeResetCart();
    var resolved = resolveRoute(state.route);
    state.route = resolved.id;
    writeRouteToLocation(resolved.id);
    return reloadCareRuntime();
  }
  function confirmWeather(id, decision) {
    if (["confirmed", "declined"].indexOf(decision) === -1) throw new Error("Unsupported weather decision");
    var order = state.orders.find(function(o) {
      return o.id === id && o.wt;
    });
    if (!order) throw new Error("Weather-triggered order not found");
    state.orders = state.orders.map(function(o) {
      if (o.id === id && o.wt) return Object.assign({}, o, { wt: Object.assign({}, o.wt, { status: decision }) });
      return o;
    });
    render();
    toast(decision === "confirmed" ? "Visit confirmed" : "Visit declined");
  }
  function openDrawer(name) {
    state.drawer = name;
    render();
  }
  function closeDrawer() {
    state.drawer = null;
    render();
  }
  var toastTimer;
  function toast(msg) {
    state.toast = msg;
    render();
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function() {
      state.toast = null;
      render();
    }, 2600);
  }

  // app-templates/customer-portal/runtime/src/components/commerce/ServiceCard.js
  function ServiceCard(svc, i) {
    var pal = F.PAL[i % 4];
    return h("div", {
      "class": "svc-row",
      "data-module": "service-card",
      "data-visual-id": "service-card",
      "data-action": "booking.open",
      "data-id": svc.name
    }, [
      h("div", { "class": "svc-row__icon", style: "background:" + pal[1] }, h("i", { style: "background:" + pal[0] })),
      h("div", { "class": "svc-row__name", "data-bind": "service.name" }, svc.name),
      h("div", { "class": "svc-row__price", "data-bind": "service.price" }, svc.price)
    ]);
  }
  function ServiceCatalogCard(svc, i) {
    var pal = F.PAL[i % 4];
    var price = svc.price === "Quote" ? "Free quote" : "from " + svc.price;
    return h("div", { "class": "service-catalog-card", "data-module": "service-catalog-card", "data-visual-id": "service-catalog-card" }, [
      h("div", { "class": "scc__head" }, [
        h("div", { "class": "scc__icon", style: "background:" + pal[1] }, h("i", { style: "background:" + pal[0] })),
        h("div", { style: "flex:1" }, [
          h("div", { "class": "scc__name", "data-bind": "service.name" }, svc.name),
          h("div", { "class": "scc__tagline", "data-bind": "service.tagline" }, svc.tagline)
        ]),
        h("div", { "class": "scc__price" }, [h("b", { "data-bind": "service.price" }, price), h("span", { "data-bind": "service.duration" }, svc.duration)])
      ]),
      h("div", { "class": "includes" }, svc.includes.map(function(inc) {
        return h("div", { "class": "include-item" }, [h("span", { "class": "check" }, "\u2713"), inc]);
      })),
      h("div", { "class": "scc__actions" }, [
        ActionButton({ variant: "btn--primary", label: "Book now", action: "booking.open", id: svc.name, block: true, lg: true, visualId: "scc-book" }),
        ActionButton({ variant: "btn--ghost", label: "Details", action: "nav.go", id: "pricing", lg: true, visualId: "scc-details" })
      ])
    ]);
  }

  // app-templates/customer-portal/runtime/src/components/orders/OrderCard.js
  function OrderCard(order) {
    var statusMeta = currentFixture().statusMeta;
    var meta = statusMeta[order.status] || statusMeta.scheduled;
    return h("article", {
      "class": "order-card",
      "data-module": "order-card",
      "data-visual-id": "order-card",
      "data-action": "order.open",
      "data-id": order.id
    }, [
      h(
        "div",
        { "class": "order-card__icon", style: "background:" + order.iconBg },
        h("i", { style: "background:" + order.dot })
      ),
      h("div", { "class": "order-card__body" }, [
        h("div", { "class": "order-card__name", "data-bind": "order.name" }, order.name),
        h("div", { "class": "order-card__meta", "data-bind": "order.id,order.date" }, order.id + " \xB7 " + order.date)
      ]),
      StatusBadge({ variant: meta.badge, label: meta.label, bind: "order.statusLabel" }),
      h("div", { "class": "order-card__price", "data-bind": "order.price" }, order.price),
      h("div", { "class": "chevron" }, "\u203A")
    ]);
  }

  // app-templates/customer-portal/runtime/src/components/primitives/Tabs.js
  function Tabs(props) {
    return h(
      "div",
      { "class": "tabs", "data-module": "tabs", "data-visual-id": "order-tabs", role: "tablist" },
      props.items.map(function(t) {
        return h("span", {
          "class": "tab" + (t.key === props.active ? " tab--active" : ""),
          "data-action": props.action,
          "data-id": t.key,
          "data-state": t.key === props.active ? "active" : void 0,
          role: "tab"
        }, t.count != null ? [t.label + " ", h("span", { style: "opacity:.6" }, String(t.count))] : t.label);
      })
    );
  }

  // app-templates/customer-portal/runtime/src/components/shell/PageHeader.js
  function PageHeader(props) {
    return h("div", { "class": "page-header", "data-module": "page-header", "data-visual-id": "page-header" }, [
      h("div", null, [
        h("h1", { "class": "page-header__title", "data-bind": "page.title" }, props.title),
        props.sub ? h("div", { "class": "page-header__sub", "data-bind": "page.subtitle" }, props.sub) : null
      ])
    ]);
  }

  // app-templates/customer-portal/runtime/src/components/primitives/ActionButton.js
  function ActionButton(props) {
    return h(props.href ? "a" : "button", {
      "class": "btn " + (props.variant || "btn--primary") + (props.block ? " btn--block" : "") + (props.lg ? " btn--lg" : ""),
      "data-module": "action-button",
      "data-visual-id": props.visualId || "action-button",
      "data-action": props.action,
      "data-id": props.id || void 0,
      "data-requires-confirmation": props.confirm ? "true" : void 0,
      "disabled": props.disabled ? true : void 0,
      "href": props.href || void 0
    }, props.label);
  }

  // app-templates/customer-portal/runtime/src/components/primitives/EmptyState.js
  function EmptyState(props) {
    return h("div", { "class": "state-block", "data-module": "empty-state", "data-visual-id": "empty-state", "data-state": "empty" }, [
      h("div", { "class": "state-block__glyph" }, props.glyph || "\u25CB"),
      h("div", { "class": "state-block__title" }, props.title),
      h("div", { "class": "state-block__desc" }, props.desc),
      props.action ? ActionButton(props.action) : null
    ]);
  }

  // app-templates/customer-portal/runtime/src/dom.js
  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) (/* @__PURE__ */ Object.keys(attrs)).forEach(function(k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "class") el.className = v;
      else if (k === "html") el.innerHTML = v;
      else if (k === "style") el.setAttribute("style", v);
      else if (k === "text") el.textContent = v;
      else el.setAttribute(k, v === true ? "" : v);
    });
    if (children != null) (Array.isArray(children) ? children : [children]).forEach(function(c) {
      if (c == null || c === false) return;
      el.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
    });
    return el;
  }
  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }
  function svgPath() {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 600 210");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("class", "tracking-map__path");
    var p = document.createElementNS(ns, "path");
    p.setAttribute("d", "M40 180 C 160 150, 200 60, 330 80 S 520 70, 560 36");
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", "var(--accent)");
    p.setAttribute("stroke-width", "3");
    p.setAttribute("stroke-dasharray", "8 8");
    p.setAttribute("opacity", ".55");
    svg.appendChild(p);
    return svg;
  }

  // app-templates/customer-portal/runtime/src/adapters/core-account-profile-adapter.js
  var CODE_MAPPINGS = [{ name: "id" }, { name: "code" }];
  var PROFILE_MAPPINGS = [
    { name: "id" },
    { name: "nls" },
    { key: "id", mappings: [{ name: "id" }], name: "user", type: "identifier" },
    {
      mappings: [
        { name: "id" },
        { name: "firstName" },
        { name: "lastName" },
        { name: "title" },
        { key: "id", mappings: CODE_MAPPINGS, name: "type", type: "identifier" },
        {
          mappings: [
            { name: "id" },
            { name: "value" },
            { key: "id", mappings: CODE_MAPPINGS, name: "type", type: "identifier" }
          ],
          name: "contactEntries",
          type: "collection"
        }
      ],
      name: "contacts",
      type: "collection"
    },
    {
      mappings: [
        { name: "id" },
        { mappings: CODE_MAPPINGS, name: "types", type: "collection" },
        {
          key: "id",
          mappings: [
            { name: "id" },
            { name: "address1" },
            { name: "address2" },
            { name: "city" },
            { name: "postalCode" },
            { key: "id", mappings: CODE_MAPPINGS, name: "state", type: "identifier" },
            { key: "id", mappings: CODE_MAPPINGS, name: "country", type: "identifier" }
          ],
          name: "address",
          type: "identifier"
        }
      ],
      name: "addresses",
      type: "collection"
    }
  ];
  function createCoreAccountProfileAdapter(options2 = {}) {
    var fetchImpl = options2.fetch || globalThis.fetch;
    if (typeof fetchImpl !== "function") throw coded5("fetch-unavailable", "Core account profile adapter requires fetch");
    return {
      async load(moduleId, context) {
        if (moduleId !== "profile") throw coded5("unsupported-module", "Core account profile adapter cannot load " + moduleId);
        return loadCustomerAccountProfile(context, fetchImpl, options2.origin);
      }
    };
  }
  async function loadCustomerAccountProfile(context, fetchImpl = globalThis.fetch, explicitOrigin) {
    var api = requestContext3(context, explicitOrigin);
    var reply = await requestJson4(fetchImpl, api.accountBase + api.accountListPath, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        Authorization: api.authorization,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Organization-Code": api.organization
      },
      body: JSON.stringify({
        filters: [
          { type: "INTEGER", operator: "=", property: "id", value: String(api.accountId) },
          { type: "INTEGER", operator: "=", property: "user.id", value: String(api.userId) }
        ],
        mappings: PROFILE_MAPPINGS,
        offset: 0,
        pageSize: 2
      })
    });
    var rows2 = Array.isArray(reply && reply.result) ? reply.result : [];
    var owned = rows2.filter(function(row) {
      return ownedBySession(row, api);
    });
    if (!owned.length) throw coded5("profile-unavailable", "Core did not return the signed-in customer's Account");
    return { account: owned[0], scopeMode: owned.length === rows2.length ? "server-scoped" : "browser-filtered" };
  }
  function ownedBySession(row, api) {
    if (!row || typeof row !== "object" || positiveInteger(row.id) !== api.accountId) return false;
    var linked = row.user && typeof row.user === "object" ? positiveInteger(row.user.id) : null;
    return linked === null && !api.tagged || linked === api.userId;
  }
  function requestContext3(context, explicitOrigin) {
    var config = context && context.config || {};
    var runtimeState = context && context.state || {};
    var session2 = runtimeState.session || {};
    var accessToken = text(session2.accessToken || session2.access_token);
    if (!accessToken) throw coded5("session-required", "A Core access token is required");
    var userId = positiveInteger(session2.userId);
    if (!userId) throw coded5("session-user-required", "The signed-in Core User is required");
    var account = runtimeState.customerAccount || session2.account || null;
    var accountId = positiveInteger(account && account.id);
    if (!accountId) throw coded5("customer-unresolved", "A resolved customer Account is required before reading its profile");
    var organization = text(config.organization);
    if (!organization) throw coded5("organization-required", "A portal organization code is required");
    var origin = explicitOrigin || config.origin || globalThis.location && globalThis.location.origin || "";
    return {
      accountBase: sameOriginBase4(config.accountApiBase || "/core-acct", origin, "Core Account API base"),
      accountId,
      accountListPath: config.vertical === "snow" ? "/api/tagged/account/list.json" : "/api/account/list.json",
      tagged: config.vertical === "snow",
      authorization: text(session2.tokenType || session2.token_type || "Bearer") + " " + accessToken,
      organization,
      userId
    };
  }
  async function requestJson4(fetchImpl, url, options2) {
    var response = await fetchImpl(url, options2);
    if (!response || typeof response.ok !== "boolean") throw coded5("invalid-response", "Core request returned an invalid response");
    if (!response.ok) {
      var code = response.status === 401 ? "session-expired" : response.status === 403 ? "customer-forbidden" : "profile-request-failed";
      var failure2 = coded5(code, "Core Account request failed with HTTP " + response.status);
      failure2.status = response.status;
      throw failure2;
    }
    var payload;
    try {
      payload = await response.json();
    } catch (_) {
      throw coded5("invalid-response", "Core response was not valid JSON");
    }
    if (!payload || typeof payload !== "object") throw coded5("invalid-response", "Core answered with an unprojected body");
    return payload;
  }
  function sameOriginBase4(value, origin, label) {
    if (!origin) throw coded5("origin-required", label + " requires a browser origin");
    var target = new URL(String(value || ""), origin);
    if (target.origin !== new URL(origin).origin) throw coded5("cross-origin-service", label + " must be same-origin");
    return target.href.replace(/\/+$/, "");
  }
  function coded5(code, message) {
    var error2 = new Error(message);
    error2.code = code;
    return error2;
  }

  // app-templates/customer-portal/runtime/src/normalizers/account-profile.js
  var ACCOUNT_PROFILE_SCOPE_MODES = /* @__PURE__ */ Object.freeze(["server-scoped", "browser-filtered"]);
  var LEGAL_CONTACT = "LEGAL";
  var BILLING_ADDRESS = "BILLING";
  var EMAIL_ENTRY = "EMAIL";
  var PHONE_ENTRY = "PHONE";
  function normalizeAccountProfile(raw) {
    var source = raw && typeof raw === "object" ? raw : {};
    var account = source.account && typeof source.account === "object" && !Array.isArray(source.account) ? source.account : null;
    if (!account) return accountProfileFailure("profile-unavailable");
    var primary = primaryContact(account.contacts);
    var contact = primary ? { name: [plain2(primary.firstName), plain2(primary.lastName)].filter(Boolean).join(" "), firstName: plain2(primary.firstName), title: plain2(primary.title) } : null;
    var emails = primary ? entryValues(primary.contactEntries, EMAIL_ENTRY) : [];
    var phones = primary ? entryValues(primary.contactEntries, PHONE_ENTRY).map(formatPhone) : [];
    var billingAddresses = typedAddresses(account.addresses, BILLING_ADDRESS);
    var editable = {
      firstName: primary ? plain2(primary.firstName) : "",
      lastName: primary ? plain2(primary.lastName) : "",
      email: primary ? firstEntryValue(primary.contactEntries, EMAIL_ENTRY) : "",
      phone: primary ? formatPhone(firstEntryValue(primary.contactEntries, PHONE_ENTRY)) : "",
      billingAddress: oldestTypedAddress(account.addresses, BILLING_ADDRESS)
    };
    var filled = [!!(contact && contact.name), emails.length > 0, phones.length > 0, billingAddresses.length > 0];
    return {
      state: filled.every(Boolean) ? "ready" : filled.some(Boolean) ? "partial" : "empty",
      reasonCode: null,
      scopeMode: ACCOUNT_PROFILE_SCOPE_MODES.indexOf(source.scopeMode) === -1 ? null : source.scopeMode,
      accountName: localizedName4(account.nls),
      contact,
      emails,
      phones,
      billingAddresses,
      editable,
      allowedActions: []
    };
  }
  function accountProfileFailure(code) {
    return {
      state: code === "customer-forbidden" ? "unauthorized" : code === "profile-unavailable" ? "unavailable" : "error",
      reasonCode: code || "profile-load-failed",
      scopeMode: null,
      accountName: "",
      contact: null,
      emails: [],
      phones: [],
      billingAddresses: [],
      editable: null,
      allowedActions: []
    };
  }
  function formatAccountAddress(address) {
    return formatPostalAddress(address);
  }
  function primaryContact(contacts) {
    var primaries = rows(contacts).filter(function(contact) {
      return text(contact.type && contact.type.code) === LEGAL_CONTACT;
    });
    return primaries.sort(byIdAscending)[0] || null;
  }
  function entryValues(entries, typeCode) {
    var values = [];
    rows(entries).forEach(function(entry) {
      if (text(entry.type && entry.type.code) !== typeCode) return;
      var value = plain2(entry.value);
      if (value && values.indexOf(value) === -1) values.push(value);
    });
    return values;
  }
  function firstEntryValue(entries, typeCode) {
    var entry = rows(entries).filter(function(row) {
      return text(row.type && row.type.code) === typeCode && plain2(row.value);
    }).sort(byIdAscending)[0];
    return entry ? plain2(entry.value) : "";
  }
  function oldestTypedAddress(addresses, typeCode) {
    var link = rows(addresses).filter(function(row) {
      return rows(row.types).some(function(type) {
        return text(type.code) === typeCode;
      });
    }).sort(byIdAscending)[0];
    return link ? formatAccountAddress(link.address) : "";
  }
  function typedAddresses(addresses, typeCode) {
    var formatted = [];
    rows(addresses).filter(function(row) {
      return rows(row.types).some(function(type) {
        return text(type.code) === typeCode;
      });
    }).sort(byIdDescending).forEach(function(row) {
      var line = formatAccountAddress(row.address);
      if (line && formatted.indexOf(line) === -1) formatted.push(line);
    });
    return formatted;
  }
  function byIdAscending(left, right) {
    return compareIds(left, right, 1);
  }
  function byIdDescending(left, right) {
    return compareIds(left, right, -1);
  }
  function compareIds(left, right, direction) {
    var a = positiveInteger(left && left.id);
    var b = positiveInteger(right && right.id);
    if (a === b) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return (a - b) * direction;
  }
  function rows(value) {
    return Array.isArray(value) ? value.filter(function(row) {
      return row && typeof row === "object";
    }) : [];
  }
  function localizedName4(value) {
    if (!value || typeof value !== "object") return "";
    var localized = value.en || value["en-US"] || Object.values(value)[0] || {};
    return plain2(localized && (localized.NAME || localized.name));
  }
  function plain2(value) {
    if (typeof value === "string") return value.trim();
    return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
  }

  // app-templates/customer-portal/runtime/src/adapters/care-fixture-adapter.js
  function clone2(value) {
    return JSON.parse(JSON.stringify(value));
  }
  function createCareFixtureAdapter() {
    return {
      async load(moduleId, context) {
        if (moduleId !== "care") throw new Error("Care fixture adapter only supports care");
        var caseFixture = caseFixtureFor(context.config.caseId);
        var fixture;
        var products;
        if (caseFixture) {
          fixture = caseFixture.care;
          products = caseFixture.theme.products;
        } else {
          const { careFixtures: careFixtures2 } = await Promise.resolve().then(() => (init_live_care_fixtures(), live_care_fixtures_exports));
          var vertical2 = verticalProfiles[context.config.vertical];
          var displayName = vertical2 && vertical2.displayName;
          fixture = careFixtures2[displayName];
          products = F.themes[displayName] && F.themes[displayName].products || [];
        }
        if (!fixture) throw new Error("Care fixture is unavailable for configured vertical");
        var requestedState = context.state.carePayloadState;
        var stateName = requestedState === void 0 ? "ready" : requestedState;
        if (!["ready", "loading", "empty", "error"].includes(stateName)) {
          throw new Error("Unsupported Care payload state");
        }
        return {
          vertical: context.config.vertical,
          state: stateName,
          emptyState: clone2(fixture.empty),
          fixture: stateName === "ready" ? clone2(fixture) : null,
          products: stateName === "ready" ? clone2(products) : []
        };
      }
    };
  }

  // app-templates/customer-portal/runtime/src/adapters/core-account-adapter.js
  var BASIC_INFO_MAPPINGS = ["code", "id", "name", "nls"].map(function(name) {
    return { name };
  });
  var ACCOUNT_MAPPINGS = [
    { name: "code" },
    { name: "id" },
    { name: "nls" },
    { name: "optimistic" },
    { key: "id", name: "organization", type: "identifier" },
    { key: "id", name: "type", type: "identifier" },
    { key: "id", name: "user", type: "identifier" }
  ];
  var TYPED_ACCOUNT_MAPPINGS = ACCOUNT_MAPPINGS.map(function(mapping) {
    return mapping.name === "type" ? { key: "id", mappings: [{ name: "id" }, { name: "code" }], name: "type", type: "identifier" } : mapping;
  });
  function accountTypeCodes(value) {
    var codes = [];
    String(value || "").split(",").forEach(function(item) {
      var code = item.trim();
      if (code && codes.indexOf(code) === -1) codes.push(code);
    });
    return codes.length ? codes : ["SPA_CUSTOMER"];
  }
  function createCoreAccountAdapter(options2 = {}) {
    var fetchImpl = options2.fetch || globalThis.fetch;
    if (typeof fetchImpl !== "function") throw contractError3("fetch-unavailable", "Core account adapter requires fetch");
    return {
      async load(moduleId, context) {
        if (moduleId !== "account") throw contractError3("unsupported-module", "Core account adapter cannot load " + moduleId);
        return resolveCoreAccount(context, fetchImpl, options2.origin);
      },
      async resolve(context) {
        return resolveCoreAccount(context, fetchImpl, options2.origin);
      }
    };
  }
  async function resolveCoreAccount(context, fetchImpl = globalThis.fetch, explicitOrigin) {
    var config = context && context.config || {};
    var session2 = context && context.session || context && context.state && context.state.session || {};
    var accessToken = text9(session2.accessToken || session2.access_token);
    if (!accessToken) throw contractError3("session-required", "A Core access token is required");
    var origin = explicitOrigin || config.origin || browserOrigin2();
    var coreBase = sameOriginBase5(config.coreApiBase || "/core", origin, "Core API base");
    var accountBase = sameOriginBase5(config.accountApiBase || "/core-acct", origin, "Core Account API base");
    var tokenType = text9(session2.tokenType || session2.token_type || "Bearer");
    var authorization = tokenType + " " + accessToken;
    var basicInfo = await requestJson5(fetchImpl, coreBase + "/api/user/basic-info.json", {
      method: "POST",
      credentials: "same-origin",
      headers: { Authorization: authorization, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(BASIC_INFO_MAPPINGS)
    });
    var userId = positiveInteger3(basicInfo.authenticatedUserId || basicInfo.id);
    if (!userId) throw contractError3("invalid-session-user", "Core basic-info did not return authenticatedUserId");
    var organizationCode = selectOrganization(config.organization || config.pimOrganization, basicInfo);
    var typeCodes = accountTypeCodes(config.accountTypeCode);
    var typeList = typeCodes.length > 1;
    var accountReply = await requestJson5(fetchImpl, accountBase + (config.vertical === "snow" ? "/api/tagged/account/list.json" : "/api/account/list.json"), {
      method: "POST",
      credentials: "same-origin",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Organization-Code": organizationCode
      },
      body: JSON.stringify({
        filters: [
          { type: "INTEGER", operator: "=", property: "user.id", value: String(userId) },
          typeList ? { type: "STRING", operator: "IN", property: "type.code", value: typeCodes.join(",") } : { type: "STRING", operator: "=", property: "type.code", value: typeCodes[0] }
        ],
        mappings: typeList ? TYPED_ACCOUNT_MAPPINGS : ACCOUNT_MAPPINGS,
        offset: 0,
        pageSize: 2
      })
    });
    var returned = Array.isArray(accountReply && accountReply.result) ? accountReply.result : [];
    var accounts = typeList ? returned.filter(function(row) {
      return typeCodes.indexOf(text9(row && row.type && row.type.code)) !== -1;
    }) : returned;
    var total = Number(accountReply.resultSize || returned.length);
    if (!accounts.length) throw contractError3("customer-not-linked", "No customer Account is linked to the signed-in Core User");
    if (accounts.length !== 1 || (typeList ? total > returned.length : total > 1)) {
      throw contractError3("customer-account-ambiguous", "The signed-in Core User must resolve to exactly one customer Account");
    }
    var account = accounts[0] || {};
    if (!positiveInteger3(account.id)) throw contractError3("invalid-customer-account", "Core Account response did not include an id");
    if (config.vertical === "snow" && positiveInteger3(account.user && account.user.id) !== userId || account.user && positiveInteger3(account.user.id) && Number(account.user.id) !== userId) {
      throw contractError3("customer-scope-mismatch", "Core Account user does not match the authenticated Core User");
    }
    return {
      state: "ready",
      scopeMode: accounts.length === returned.length ? "server-scoped" : "browser-filtered",
      organization: { code: organizationCode, id: authorizedOrganizationId(basicInfo, organizationCode) },
      user: {
        id: userId,
        displayName: text9(basicInfo.authenticatedUserName || basicInfo.authenticatedUser || basicInfo.name),
        login: text9(basicInfo.authenticatedUserName)
      },
      account: {
        id: Number(account.id),
        code: text9(account.code),
        displayName: localizedName5(account.nls) || "Customer account",
        optimistic: Number.isFinite(Number(account.optimistic)) ? Number(account.optimistic) : null,
        typeCode: typeList ? text9(account.type && account.type.code) : typeCodes[0]
      }
    };
  }
  function authorizedOrganizationId(basicInfo, code) {
    var authorized = Array.isArray(basicInfo && basicInfo.authorizedOrganizations) ? basicInfo.authorizedOrganizations : [];
    var match = authorized.find(function(item) {
      return item && text9(item.code) === code;
    });
    return match ? positiveInteger3(match.id) : null;
  }
  function selectOrganization(configuredCode, basicInfo) {
    var configured = text9(configuredCode);
    var authorized = Array.isArray(basicInfo && basicInfo.authorizedOrganizations) ? basicInfo.authorizedOrganizations.map(function(item) {
      return text9(item && item.code);
    }).filter(Boolean) : [];
    var current = text9(basicInfo && (basicInfo.organizationCode || basicInfo.defaultOrganizationCode));
    var selected = configured || current || authorized[0];
    if (!selected) throw contractError3("organization-required", "Core basic-info did not provide an organization");
    if (authorized.length && !authorized.includes(selected)) {
      throw contractError3("organization-forbidden", "Configured portal organization is not authorized for the signed-in Core User");
    }
    return selected;
  }
  async function requestJson5(fetchImpl, url, options2) {
    var response = await fetchImpl(url, options2);
    if (!response || typeof response.ok !== "boolean") throw contractError3("invalid-response", "Core request returned an invalid response");
    if (!response.ok) {
      var code = response.status === 401 ? "session-expired" : response.status === 403 ? "customer-forbidden" : "core-request-failed";
      var error2 = contractError3(code, "Core request failed with HTTP " + response.status);
      error2.status = response.status;
      throw error2;
    }
    try {
      return await response.json();
    } catch (_) {
      throw contractError3("invalid-response", "Core response was not valid JSON");
    }
  }
  function sameOriginBase5(value, origin, label) {
    if (!origin) throw contractError3("origin-required", label + " requires a browser origin");
    var target = new URL(String(value || ""), origin);
    if (target.origin !== new URL(origin).origin) throw contractError3("cross-origin-service", label + " must be same-origin");
    return target.href.replace(/\/+$/, "");
  }
  function browserOrigin2() {
    return globalThis.location && globalThis.location.origin || "";
  }
  function positiveInteger3(value) {
    var number = Number(value);
    return Number.isInteger(number) && number > 0 ? number : null;
  }
  function localizedName5(value) {
    if (!value || typeof value !== "object") return "";
    var localized = value.en || value["en-US"] || Object.values(value)[0] || {};
    return text9(localized && (localized.NAME || localized.name));
  }
  function text9(value) {
    return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
  }
  function contractError3(code, message) {
    var error2 = new Error(message);
    error2.code = code;
    return error2;
  }

  // app-templates/customer-portal/runtime/src/normalizers/care.js
  var CARE_KINDS = ["equipment", "seasonLog", "program", "water", "roof", "monitoring", "healthCare", "beautyCare"];
  var CARE_META = {
    hvac: { navLabel: "Equipment", title: "Your equipment", subtitle: "Every unit we service \u2014 condition, warranty and the latest diagnostic in one place." },
    snow: { navLabel: "Season log", title: "Season log", subtitle: "Every storm response this winter \u2014 GPS-logged, timed against your SLA, with materials used." },
    lawn: { navLabel: "Program", title: "Season program", subtitle: "Your 5-step feeding and care program \u2014 what\u2019s done, what\u2019s next, and when the lawn is safe to use." },
    pool: { navLabel: "Water", title: "Water quality", subtitle: "Readings from every visit, tracked against safe ranges \u2014 plus what your tech dosed and why." },
    roofing: { navLabel: "Roof report", title: "Roof condition", subtitle: "Findings from your drone inspection on Jan 8 \u2014 and the repair project it kicked off." },
    pest: { navLabel: "Monitoring", title: "Station monitoring", subtitle: "Bait stations and smart sensors watch your home between visits \u2014 alerts go straight to your technician." },
    health: { navLabel: "Care plan", title: "Your care plan", subtitle: "Appointments, milestones, documents and your care team \u2014 the logistics in one place. Clinical details stay with your provider." },
    beauty: { navLabel: "My routine", title: "Your routine", subtitle: "Appointments, packages, your specialist and the formulas they use \u2014 remembered visit to visit." }
  };
  var ACTIONS_BY_KIND = {
    equipment: ["care.selectUnit"],
    seasonLog: [],
    program: [],
    water: [],
    roof: [],
    monitoring: ["care.requestRetreat"],
    healthCare: ["care.completeTask"],
    beautyCare: ["care.selectSpecialist", "care.completeTask"]
  };
  function clone3(value) {
    return JSON.parse(JSON.stringify(value));
  }
  function emptyState(raw) {
    if (!raw) return null;
    return { glyph: raw.glyph, title: raw.title, description: raw.desc };
  }
  function stripClosedDocumentDestinations(content) {
    if (!Array.isArray(content.docs)) return;
    content.docs = content.docs.map(function(documentItem) {
      var safe = Object.assign({}, documentItem);
      delete safe.url;
      delete safe.href;
      delete safe.downloadUrl;
      delete safe.filename;
      return safe;
    });
  }
  function careDisplayMeta(vertical2) {
    return CARE_META[vertical2] || CARE_META.hvac;
  }
  function envelope(vertical2, phase, stateName, access, extra) {
    var meta = careDisplayMeta(vertical2);
    return Object.assign({
      id: "care",
      vertical: vertical2,
      phase,
      kind: null,
      navLabel: meta.navLabel,
      title: meta.title,
      subtitle: meta.subtitle,
      state: stateName,
      access: { status: access.status, reasonCode: access.reasonCode || null },
      emptyState: null,
      content: null,
      allowedActions: []
    }, extra || {});
  }
  function normalizeCarePreflight(access, context) {
    var stateName = access.status === "disabled" ? "disabled" : access.status === "checking" ? "loading" : access.status === "error" ? "error" : "unauthorized";
    return envelope(context.config.vertical, "preflight", stateName, access);
  }
  function normalizeCareLoading(context) {
    return envelope(context.config.vertical, "payload", "loading", { status: "granted", reasonCode: null });
  }
  function normalizeCareFailure(context, reasonCode) {
    return envelope(context.config.vertical, "payload", "error", { status: "granted", reasonCode: reasonCode || "payload-load-failed" });
  }
  function normalizeCare(raw) {
    var stateName = raw && raw.state;
    if (!["ready", "loading", "empty", "error"].includes(stateName)) throw new Error("Unsupported Care payload state");
    if (stateName !== "ready") {
      return envelope(raw.vertical, "payload", stateName, { status: "granted", reasonCode: null }, {
        emptyState: stateName === "empty" ? emptyState(raw.emptyState) : null
      });
    }
    var fixture = raw.fixture;
    if (!fixture || !CARE_KINDS.includes(fixture.kind)) throw new Error("Invalid Care fixture kind");
    var content = clone3(fixture);
    delete content.kind;
    delete content.navLabel;
    delete content.title;
    delete content.sub;
    delete content.empty;
    stripClosedDocumentDestinations(content);
    if (fixture.kind === "beautyCare") {
      var productsByName = new Map((raw.products || []).map(function(product) {
        return [product.name, product];
      }));
      content.productRecs.items = content.productRecs.names.map(function(name) {
        return productsByName.get(name);
      }).filter(Boolean);
    }
    return envelope(raw.vertical, "payload", "ready", { status: "granted", reasonCode: null }, {
      kind: fixture.kind,
      navLabel: fixture.navLabel,
      title: fixture.title,
      subtitle: fixture.sub,
      emptyState: emptyState(fixture.empty),
      content,
      allowedActions: ACTIONS_BY_KIND[fixture.kind].slice()
    });
  }

  // app-templates/customer-portal/runtime/src/normalizers/index.js
  function clone4(value) {
    return JSON.parse(JSON.stringify(value));
  }
  function normalizeOrders(raw) {
    return {
      items: clone4(raw.orders).map(function(order) {
        return Object.assign({}, order, {
          allowedActions: order.status === "completed" ? ["order.bookAgain", "order.downloadInvoice"] : ["order.cancel", "order.reschedule", "support.open"]
        });
      }),
      statusMeta: raw.statusMeta,
      technician: raw.technician,
      addresses: raw.addresses
    };
  }
  function normalizeProposals(raw) {
    var normalized = {
      proposal: raw.proposal ? clone4(raw.proposal) : null,
      sites: Array.isArray(raw.sites) ? clone4(raw.sites).map(function(site) {
        return Object.assign({}, site, {
          allowedActions: ["proposal.selectPlan", "proposal.approve", "proposal.requestRevision", "proposal.decline"]
        });
      }) : [],
      statusMeta: raw.statusMeta
    };
    if (raw.quoteOrders || raw.reads) normalized.quotes = normalizeContracts(raw);
    return normalized;
  }
  function normalizeServices(raw) {
    if (raw.pimPlans) return { items: clone4(raw.pimPlans), source: "core-pim" };
    return { items: clone4(raw.services) };
  }
  function normalizePricing(raw) {
    if (raw.pimPlans) {
      return {
        plans: clone4(raw.pimPlans),
        rates: clone4(raw.pimPlans),
        source: "core-pim"
      };
    }
    return {
      plans: [
        { id: "payg", name: "Pay as you go", price: "$0", interval: "visit", cta: "Book any service" },
        { id: "member", name: raw.plan.name, price: "$9", interval: "month", cta: raw.plan.tag },
        { id: "plus", name: raw.plan.plusName, price: "$19", interval: "month", cta: "For multiple properties" }
      ],
      rates: clone4(raw.services)
    };
  }
  function normalizeProducts(raw) {
    if (raw.pimProducts) {
      return {
        feature: null,
        categories: [],
        items: clone4(raw.pimProducts),
        models: clone4(raw.pimProductModels || []),
        reviews: clone4(raw.pimProductReviews || []),
        enrichment: clone4(raw.pimEnrichment || { models: "unavailable", reviews: "unavailable" }),
        source: "core-pim"
      };
    }
    return {
      feature: clone4(raw.feature),
      categories: clone4(raw.categories),
      items: clone4(raw.products).map(function(product) {
        return Object.assign({}, product, { allowedActions: ["cart.addItem"] });
      })
    };
  }
  function normalizeCheckout(raw) {
    return {
      cartItems: clone4(raw.cartItems),
      addresses: clone4(raw.addresses),
      cards: clone4(raw.cards),
      allowedActions: raw.cartItems.length ? ["checkout.placeOrder"] : []
    };
  }
  function normalizeCalendar(raw) {
    return {
      orders: clone4(raw.orders),
      stormCalendar: clone4(raw.stormCalendar)
    };
  }
  function normalizeActivity(raw) {
    return {
      tabs: clone4(raw.tabs),
      groups: clone4(raw.groups)
    };
  }
  function normalizeProfile(raw) {
    return {
      customer: clone4(raw.customer),
      addresses: clone4(raw.addresses),
      cards: clone4(raw.cards),
      preferences: clone4(raw.preferences),
      orders: clone4(raw.orders)
    };
  }
  function normalizeSupport(raw) {
    return {
      customer: clone4(raw.customer),
      topics: clone4(raw.topics),
      quickReplies: clone4(raw.quickReplies),
      messages: clone4(raw.messages)
    };
  }

  // app-templates/customer-portal/runtime/src/modules/index.js
  function module(id, normalize2) {
    return {
      id,
      adapter(context) {
        if (context.config.dataMode === "live") {
          if (false) return corePimAdapter;
          throw new Error("Live adapter is not opened for module " + id);
        }
        return fixtureAdapter;
      },
      normalize(raw) {
        return normalize2(raw);
      }
    };
  }
  function clearCareProtectedState(runtimeState) {
    runtimeState.careAuthorizationEpoch = (runtimeState.careAuthorizationEpoch || 0) + 1;
    runtimeState.careStateVertical = null;
    runtimeState.careSelectedUnitId = null;
    runtimeState.careSelectedSpecialistId = null;
    runtimeState.careTasksDone = {};
    runtimeState.careRetreatRequests = {};
    for (const key of /* @__PURE__ */ Object.keys(runtimeState.pending || {})) if (key.startsWith("care.")) delete runtimeState.pending[key];
    for (const key of /* @__PURE__ */ Object.keys(runtimeState.commandErrors || {})) {
      if (key.startsWith("care.") && !key.endsWith(":_")) delete runtimeState.commandErrors[key];
    }
  }
  function clearGeneralCareCommandErrors2(runtimeState) {
    for (const key of /* @__PURE__ */ Object.keys(runtimeState.commandErrors || {})) {
      if (key.startsWith("care.") && key.endsWith(":_")) delete runtimeState.commandErrors[key];
    }
  }
  function carePreflight(context) {
    var enabled = context.config.enabledModules.includes("care");
    if (!enabled) return { status: "disabled", reasonCode: "module-disabled" };
    if (!context.state.session.authenticated) return { status: "unauthenticated", reasonCode: "session-required" };
    if (context.state.session.hasCustomerScope !== true || context.state.session.hasTenantScope !== true) {
      return { status: "forbidden", reasonCode: "scope-missing" };
    }
    var access = context.state.access && context.state.access.care;
    var status = access && access.status;
    if (status === "granted" && context.config.dataMode !== "fixture") {
      return { status: "error", reasonCode: "live-adapter-not-opened" };
    }
    if (["checking", "not-entitled", "forbidden", "granted", "error"].includes(status)) {
      return { status, reasonCode: access.reasonCode || null };
    }
    return { status: "not-entitled", reasonCode: "entitlement-missing" };
  }
  var careModule = {
    id: "care",
    asyncOnly: true,
    dataSources: ["care.fixture", "care.live"],
    requires: ["session", "customer-scope", "tenant-scope", "care-entitlement"],
    routes: ["care"],
    commands: ["care.selectUnit", "care.download", "care.requestRetreat", "care.selectSpecialist", "care.completeTask", "care.contactProvider", "care.openSecureDoc"],
    preflight: carePreflight,
    safeEnvelope: normalizeCarePreflight,
    loadingEnvelope: normalizeCareLoading,
    clearProtectedState(context) {
      clearCareProtectedState(context.state);
    },
    onResult(envelope2, context) {
      clearGeneralCareCommandErrors2(context.state);
      if (!envelope2.content) {
        clearCareProtectedState(context.state);
        return;
      }
      if (context.state.careStateVertical && context.state.careStateVertical !== envelope2.vertical) clearCareProtectedState(context.state);
      context.state.careStateVertical = envelope2.vertical;
    },
    failureEnvelope(context) {
      return normalizeCareFailure(context, "payload-load-failed");
    },
    cacheKey(context) {
      var payloadState = context.state.carePayloadState === void 0 ? "ready" : String(context.state.carePayloadState);
      return [context.config.dataMode, context.config.vertical, payloadState].join(":");
    },
    adapter(context) {
      if (context.config.dataMode !== "fixture") throw new Error("Care live adapter is not opened");
      return createCareFixtureAdapter();
    },
    normalize(raw, context) {
      return normalizeCare(raw, context);
    }
  };
  var ACCOUNT_GATE_STATES = /* @__PURE__ */ Object.freeze(["customer-not-linked", "customer-account-ambiguous", "organization-forbidden", "customer-forbidden", "session-expired"]);
  var accountModule = {
    id: "account",
    asyncOnly: true,
    adapter(context) {
      if (context.config.dataMode === "live") return createCoreAccountAdapter();
      return {
        load() {
          var customer = context.state.currentCustomer || {};
          return {
            state: "ready",
            organization: { code: context.config.organization },
            user: { id: null, displayName: customer.fullName || "Customer" },
            account: { id: null, code: "fixture", displayName: customer.fullName || "Customer", typeCode: context.config.accountTypeCode }
          };
        }
      };
    },
    normalize(raw) {
      return raw;
    },
    onResult(envelope2, context) {
      context.state.customerAccount = envelope2.account;
      context.state.session.account = envelope2.account;
      context.state.sessionName = envelope2.user && envelope2.user.displayName || envelope2.account && envelope2.account.displayName || null;
      context.state.session.userId = envelope2.user && envelope2.user.id || null;
      context.state.session.login = envelope2.user && envelope2.user.login || null;
      context.state.session.organizationId = envelope2.organization && envelope2.organization.id || null;
      context.state.account = "ready";
    },
    onError(error2, context) {
      context.state.customerAccount = null;
      delete context.state.session.account;
      var code = error2 && error2.code;
      context.state.account = ACCOUNT_GATE_STATES.includes(code) ? code : "customer-unavailable";
    },
    failureEnvelope(context, error2) {
      return { state: error2 && error2.code || "customer-unavailable", items: [] };
    }
  };
  var profileModule = {
    id: "profile",
    asyncOnly: true,
    adapter(context) {
      if (customerAccountProfile(context.config)) return context.config.dataMode === "live" ? createCoreAccountProfileAdapter() : fixtureAccountProfileAdapter;
      return context.config.dataMode === "live" ? createCoreUserProfileAdapter() : fixtureAdapter;
    },
    normalize(raw, context) {
      if (customerAccountProfile(context.config)) return normalizeAccountProfile(raw);
      return context.config.dataMode === "live" ? raw : normalizeProfile(raw);
    },
    onError(error2, context) {
      if (error2 && error2.code === "session-expired") context.state.account = "session-expired";
    },
    failureEnvelope(context, error2) {
      if (customerAccountProfile(context.config)) return accountProfileFailure(error2 && error2.code);
      return { state: error2 && error2.code === "customer-forbidden" ? "unauthorized" : "error", email: "", phone: null, prefs: {}, allowedActions: [] };
    }
  };
  var authModule = {
    id: "auth",
    asyncOnly: true,
    adapter(context) {
      return createCoreOidcAdapter();
    },
    normalize(raw) {
      return raw;
    },
    onResult(envelope2, context) {
      if (context.config.dataMode !== "live") {
        context.state.oidc = context.config.authMode === "required" ? "ready-signed-out" : "ready-signed-in";
        context.state.session.authenticated = context.config.authMode !== "required";
        return;
      }
      var user = envelope2 && envelope2.user;
      context.state.oidc = envelope2 && envelope2.state || "ready-signed-out";
      context.state.session.authenticated = !!user || context.config.authMode !== "required";
      if (user) {
        context.state.session.accessToken = user.access_token;
        context.state.session.tokenType = user.token_type || "Bearer";
        var profile = user.profile || {};
        context.state.sessionName = profile.name || profile.preferred_username || profile.email || null;
      } else {
        delete context.state.session.accessToken;
        delete context.state.session.tokenType;
        context.state.account = "session-required";
      }
    },
    onError(error2, context) {
      context.state.oidc = "unavailable";
      context.state.session.authenticated = false;
      context.state.account = "session-required";
    },
    failureEnvelope() {
      return { state: "unavailable", user: null };
    }
  };
  var ordersModule = {
    id: "orders",
    asyncOnly: true,
    adapter(context) {
      if (context.config.dataMode !== "live") return fixtureAdapter;
      if (false) return createCoreOrdersAdapter();
      throw liveAdapterClosed("orders");
    },
    normalize(raw, context) {
      return context.config.dataMode === "live" ? raw : normalizeOrders(raw);
    },
    onError(error2, context) {
      if (error2 && error2.code === "session-expired") context.state.account = "session-expired";
    },
    failureEnvelope(context, error2) {
      return { state: error2 && error2.code || "error", items: [] };
    }
  };
  var appointmentsModule = {
    id: "appointments",
    asyncOnly: true,
    adapter(context) {
      if (context.config.dataMode === "live") {
        if (false) return createCoreSpaDemoAdapter();
        throw liveAdapterClosed("appointments");
      }
      return {
        load() {
          return { state: "ready", items: [], next: null, upcoming: [], past: [], byRef: {} };
        }
      };
    },
    normalize(raw) {
      return raw;
    },
    onError(error2, context) {
      if (error2 && error2.code === "session-expired") context.state.account = "session-expired";
    },
    failureEnvelope(context, error2) {
      return {
        state: error2 && error2.code === "customer-forbidden" ? "unauthorized" : "error",
        items: [],
        next: null,
        upcoming: [],
        past: [],
        byRef: {},
        availability: { state: "error", reasonCode: error2 && error2.code || "appointments-load-failed", providers: [], busy: [] }
      };
    }
  };
  var planModule = {
    id: "plan",
    asyncOnly: true,
    adapter(context) {
      if (context.config.dataMode === "live") {
        if (false) return createCorePlansAdapter();
        throw liveAdapterClosed("plan");
      }
      return { load() {
        return { state: "ready", items: [], byRef: {} };
      } };
    },
    normalize(raw) {
      return raw;
    },
    onError(error2, context) {
      if (error2 && error2.code === "session-expired") context.state.account = "session-expired";
    },
    failureEnvelope(context, error2) {
      return {
        state: error2 && error2.code === "customer-forbidden" ? "unauthorized" : "error",
        items: [],
        byRef: {}
      };
    }
  };
  function localCartEnvelope(cartState) {
    return {
      backendId: null,
      byRef: {},
      currencyCode: null,
      displaySubtotal: null,
      itemCount: null,
      lines: [],
      notes: "",
      organizationCode: "",
      scopeMode: null,
      state: cartState,
      subtotal: null
    };
  }
  var cartModule = {
    id: "cart",
    asyncOnly: true,
    adapter(context) {
      if (context.config.dataMode === "live") {
        if (false) return createCoreCartAdapter();
        throw liveAdapterClosed("cart");
      }
      return { load() {
        return localCartEnvelope("empty");
      } };
    },
    normalize(raw) {
      return raw;
    },
    onError(error2, context) {
      if (error2 && error2.code === "session-expired") context.state.account = "session-expired";
    },
    /* `cart-forbidden` is the one refusal Core actually enforces on this route —
       an existing Account that is not the caller's. `cart-account-unknown` (404)
       is a different fault: the account does not exist at all, and telling the
       customer they lack access to someone else's bag would be a lie. It takes
       the plain error state. */
    failureEnvelope(context, error2) {
      return localCartEnvelope(error2 && error2.code === "cart-forbidden" ? "unauthorized" : "error");
    }
  };
  var propertiesModule = {
    id: "properties",
    asyncOnly: true,
    adapter(context) {
      if (context.config.dataMode === "live") return createCoreSnowPropertiesAdapter();
      return fixtureAdapter;
    },
    normalize(raw) {
      return raw;
    },
    onError(error2, context) {
      if (error2 && error2.code === "session-expired") context.state.account = "session-expired";
    },
    failureEnvelope(context, error2) {
      return {
        state: error2 && error2.code === "customer-forbidden" ? "unauthorized" : "error",
        accountId: null,
        items: [],
        scopeMode: null,
        truncated: false
      };
    }
  };
  function liveAdapterClosed(moduleId) {
    var closed = new Error("Live adapter is not opened for module " + moduleId);
    closed.code = "live-adapter-not-opened";
    return closed;
  }
  function liveListFailure(error2) {
    var code = error2 && error2.code;
    return code === "customer-forbidden" ? "unauthorized" : code === "live-adapter-not-opened" ? "unavailable" : "error";
  }
  var appointmentsTimelineModule = {
    id: "appointmentsTimeline",
    gatesFirstRender: false,
    adapter(context) {
      if (context.config.dataMode !== "live") return fixtureAdapter;
      if (context.config.vertical === "snow") return createCoreSnowVisitsAdapter();
      throw liveAdapterClosed("appointmentsTimeline");
    },
    normalize(raw, context) {
      return context.config.dataMode === "live" ? normalizeVisits(raw) : raw;
    },
    onError(error2, context) {
      if (error2 && error2.code === "session-expired") context.state.account = "session-expired";
    },
    failureEnvelope(context, error2) {
      return { state: liveListFailure(error2), reasonCode: error2 && error2.code || "visits-load-failed", truncated: false, upcoming: [], past: [] };
    }
  };
  var invoicesModule = {
    id: "invoices",
    gatesFirstRender: false,
    adapter(context) {
      if (context.config.dataMode !== "live") return { load() {
        return { state: "ready", truncated: false, items: [] };
      } };
      if (context.config.vertical === "snow") return createCoreSnowInvoicesAdapter();
      throw liveAdapterClosed("invoices");
    },
    normalize(raw, context) {
      return context.config.dataMode === "live" ? normalizeInvoices(raw) : raw;
    },
    onError(error2, context) {
      if (error2 && error2.code === "session-expired") context.state.account = "session-expired";
    },
    failureEnvelope(context, error2) {
      return { state: liveListFailure(error2), reasonCode: error2 && error2.code || "invoices-load-failed", truncated: false, items: [] };
    }
  };
  var proposalsModule = {
    id: "proposals",
    adapter(context) {
      if (context.config.dataMode === "live") {
        if (context.config.vertical === "snow") return createCoreSnowQuotesAdapter();
        var closed = new Error("Live adapter is not opened for module proposals");
        closed.code = "live-adapter-not-opened";
        throw closed;
      }
      return fixtureAdapter;
    },
    normalize(raw) {
      return normalizeProposals(raw);
    },
    onError(error2, context) {
      if (error2 && error2.code === "session-expired") context.state.account = "session-expired";
    },
    failureEnvelope(context, error2) {
      var code = error2 && error2.code;
      return {
        state: code === "customer-forbidden" ? "unauthorized" : code === "live-adapter-not-opened" ? "unavailable" : "error",
        reasonCode: code || "proposals-load-failed",
        proposal: null,
        sites: [],
        statusMeta: null
      };
    }
  };
  var checkoutModule = {
    id: "checkout",
    adapter(context) {
      if (context.config.dataMode === "live") return { load() {
        return { state: "ready" };
      } };
      return fixtureAdapter;
    },
    normalize(raw, context) {
      return context.config.dataMode === "live" ? raw : normalizeCheckout(raw);
    }
  };
  var liveOverviewAdapter = {
    async load(moduleId, context) {
      if (!liveWeatherOpened(context.config) || !weatherSource(context.config, null)) return { state: "unavailable", reasonCode: "forecast-unconfigured", source: null };
      if (!(context.state.liveWeatherState === "ready" && context.state.liveWeather)) await loadLiveWeather(null, context.config);
      if (!context.state.liveWeather) return { state: "error", reasonCode: "weather-unavailable", source: null };
      return { state: "ready", source: context.state.liveWeather.source };
    }
  };
  var overviewModule = {
    id: "overview",
    gatesFirstRender: false,
    adapter(context) {
      return context.config.dataMode === "live" ? liveOverviewAdapter : fixtureAdapter;
    },
    normalize(raw) {
      return raw;
    },
    failureEnvelope(context, error2) {
      return { state: "error", reasonCode: error2 && error2.code || "overview-unavailable" };
    }
  };
  var modules = {
    auth: authModule,
    account: accountModule,
    appointments: appointmentsModule,
    orders: ordersModule,
    proposals: proposalsModule,
    services: module("services", normalizeServices),
    pricing: module("pricing", normalizePricing),
    products: module("products", normalizeProducts),
    cart: cartModule,
    checkout: checkoutModule,
    plan: planModule,
    overview: overviewModule,
    appointmentsTimeline: appointmentsTimelineModule,
    properties: propertiesModule,
    calendar: module("calendar", normalizeCalendar),
    activity: module("activity", normalizeActivity),
    profile: profileModule,
    support: module("support", normalizeSupport),
    care: careModule,
    invoices: invoicesModule
  };
  var openedModuleIds = /* @__PURE__ */ Object.keys(modules);

  // app-templates/customer-portal/runtime/src/portal-runtime.js
  var PortalRuntime = class {
    constructor(options2) {
      this.state = options2.state;
      this.modules = options2.modules || modules;
      this.cache = /* @__PURE__ */ new Map();
      this.generations = /* @__PURE__ */ new Map();
      this.inFlight = /* @__PURE__ */ new Map();
    }
    parseConfig() {
      return this.state.config;
    }
    context() {
      var config = this.parseConfig();
      return {
        state: this.state,
        config: Object.assign({}, config, {
          enabledModules: (config.enabledModules || []).slice()
        })
      };
    }
    generation(moduleId) {
      return this.generations.get(moduleId) || 0;
    }
    cancel(moduleId, descriptor, context) {
      this.generations.set(moduleId, this.generation(moduleId) + 1);
      this.cache.delete(moduleId);
      this.inFlight.delete(moduleId);
      if (descriptor.clearProtectedState) descriptor.clearProtectedState(context);
    }
    publish(moduleId, data) {
      this.state.moduleData[moduleId] = data;
      this.state.moduleStatus[moduleId] = data && data.state ? data.state : "ready";
      return data;
    }
    publishDenied(moduleId, descriptor, preflight, context) {
      this.cancel(moduleId, descriptor, context);
      return this.publish(moduleId, descriptor.safeEnvelope(preflight, context));
    }
    cached(moduleId, cacheKey) {
      var cached = cacheKey && this.cache.get(moduleId);
      return cached && cached.cacheKey === cacheKey ? cached.data : null;
    }
    syncPreflight(moduleId) {
      var descriptor = this.modules[moduleId];
      if (!descriptor || !descriptor.preflight) return this.state.moduleData[moduleId] || null;
      var context = this.context();
      var preflight = descriptor.preflight(context);
      if (preflight.status !== "granted") return this.publishDenied(moduleId, descriptor, preflight, context);
      var current = this.state.moduleData[moduleId];
      if (descriptor.asyncOnly && current && current.vertical !== context.config.vertical) {
        this.cancel(moduleId, descriptor, context);
        return this.publish(moduleId, descriptor.loadingEnvelope(context));
      }
      return current || null;
    }
    load(moduleId) {
      var descriptor = this.modules[moduleId];
      if (!descriptor) throw new Error("Unknown module: " + moduleId);
      var context = this.context();
      var preflight = descriptor.preflight && descriptor.preflight(context);
      if (preflight && preflight.status !== "granted") {
        return this.publishDenied(moduleId, descriptor, preflight, context);
      }
      var cacheKey = descriptor.cacheKey && descriptor.cacheKey(context);
      var cached = this.cached(moduleId, cacheKey);
      if (cached) return this.publish(moduleId, cached);
      if (descriptor.asyncOnly) {
        var flight = this.inFlight.get(moduleId);
        if (flight && flight.cacheKey === cacheKey) return this.state.moduleData[moduleId];
        if (descriptor.clearProtectedState) descriptor.clearProtectedState(context);
        return this.publish(moduleId, descriptor.loadingEnvelope(context));
      }
      this.state.moduleStatus[moduleId] = "loading";
      try {
        var adapter = descriptor.adapter(context);
        var raw = adapter.load(moduleId, context);
        if (raw && typeof raw.then === "function") throw new Error("Module " + moduleId + " requires async load");
        var normalized = descriptor.normalize(raw, context);
        if (descriptor.onResult) descriptor.onResult(normalized, context);
        this.cache.set(moduleId, cacheKey ? { cacheKey, data: normalized } : normalized);
        return this.publish(moduleId, normalized);
      } catch (error2) {
        this.cache.delete(moduleId);
        if (descriptor.clearProtectedState) descriptor.clearProtectedState(context);
        if (descriptor.onError) descriptor.onError(error2, context);
        this.state.moduleStatus[moduleId] = "error";
        this.state.moduleData[moduleId] = descriptor.failureEnvelope ? descriptor.failureEnvelope(context, error2) : null;
        throw error2;
      }
    }
    loadAll(moduleIds) {
      var ids = moduleIds || this.enabledModuleIds().filter((moduleId) => !this.modules[moduleId].asyncOnly);
      return ids.map((moduleId) => this.load(moduleId));
    }
    loadAsync(moduleId) {
      var descriptor = this.modules[moduleId];
      if (!descriptor) return Promise.reject(new Error("Unknown module: " + moduleId));
      var context = this.context();
      var preflight = descriptor.preflight && descriptor.preflight(context);
      if (preflight && preflight.status !== "granted") {
        return Promise.resolve(this.publishDenied(moduleId, descriptor, preflight, context));
      }
      var cacheKey = descriptor.cacheKey && descriptor.cacheKey(context);
      var cached = this.cached(moduleId, cacheKey);
      if (cached) return Promise.resolve(this.publish(moduleId, cached));
      var existing = this.inFlight.get(moduleId);
      if (existing && existing.cacheKey === cacheKey) return existing.promise;
      var generation = this.generation(moduleId);
      var vertical2 = context.config.vertical;
      if (descriptor.clearProtectedState) descriptor.clearProtectedState(context);
      if (descriptor.loadingEnvelope) this.publish(moduleId, descriptor.loadingEnvelope(context));
      else this.state.moduleStatus[moduleId] = "loading";
      var operation;
      try {
        operation = Promise.resolve(descriptor.adapter(context).load(moduleId, context));
      } catch (error2) {
        operation = Promise.reject(error2);
      }
      var promise = operation.then((raw) => {
        if (!this.isCurrentLoad(moduleId, descriptor, generation, cacheKey, vertical2)) {
          return this.state.moduleData[moduleId] || null;
        }
        var normalized = descriptor.normalize(raw, context);
        if (!this.isCurrentLoad(moduleId, descriptor, generation, cacheKey, vertical2)) {
          return this.state.moduleData[moduleId] || null;
        }
        if (descriptor.onResult) descriptor.onResult(normalized, context);
        this.cache.set(moduleId, cacheKey ? { cacheKey, data: normalized } : normalized);
        return this.publish(moduleId, normalized);
      }).catch((error2) => {
        if (!this.isCurrentLoad(moduleId, descriptor, generation, cacheKey, vertical2)) {
          return this.state.moduleData[moduleId] || null;
        }
        this.cache.delete(moduleId);
        if (descriptor.clearProtectedState) descriptor.clearProtectedState(this.context());
        if (descriptor.onError) descriptor.onError(error2, this.context());
        this.state.moduleStatus[moduleId] = "error";
        this.state.moduleData[moduleId] = descriptor.failureEnvelope ? descriptor.failureEnvelope(this.context(), error2) : null;
        throw error2;
      }).finally(() => {
        var flight = this.inFlight.get(moduleId);
        if (flight && flight.promise === promise) this.inFlight.delete(moduleId);
      });
      this.inFlight.set(moduleId, { cacheKey, promise });
      return promise;
    }
    isCurrentLoad(moduleId, descriptor, generation, cacheKey, vertical2) {
      if (this.generation(moduleId) !== generation) return false;
      var context = this.context();
      if (context.config.vertical !== vertical2) return false;
      if (descriptor.cacheKey && descriptor.cacheKey(context) !== cacheKey) return false;
      var preflight = descriptor.preflight && descriptor.preflight(context);
      return !preflight || preflight.status === "granted";
    }
    async loadAllAsync(moduleIds) {
      var ids = moduleIds || this.enabledModuleIds();
      if (ids.includes("auth")) {
        await this.loadAsync("auth");
        ids = ids.filter((moduleId) => moduleId !== "auth");
        if (this.state.config.dataMode === "live" && this.state.config.authMode === "required" && !this.state.session.authenticated) return [];
      }
      if (ids.includes("account")) {
        await this.loadAsync("account");
        ids = ids.filter((moduleId) => moduleId !== "account");
      }
      var deferred = this.state.config && this.state.config.dataMode === "live" ? ids.filter((moduleId) => this.modules[moduleId] && this.modules[moduleId].gatesFirstRender === false) : [];
      deferred.forEach((moduleId) => {
        this.loadAsync(moduleId).catch(() => null);
      });
      return Promise.all(ids.filter((moduleId) => !deferred.includes(moduleId)).map((moduleId) => this.loadAsync(moduleId)));
    }
    settled() {
      return Promise.allSettled(Array.from(this.inFlight.values(), (flight) => flight.promise)).then(() => void 0);
    }
    eachSettled(callback) {
      this.inFlight.forEach((flight) => {
        flight.promise.then(() => callback(), () => callback());
      });
    }
    enabledModuleIds() {
      var config = this.state.config || {};
      var enabled = config.enabledModules || [];
      var accountGate = customerAccountRequired(config);
      return openedModuleIds.filter((moduleId) => moduleId === "auth" || moduleId === "account" && accountGate || enabled.includes(moduleId));
    }
    invalidate(moduleId) {
      var descriptor = this.modules[moduleId];
      if (!descriptor) throw new Error("Unknown module: " + moduleId);
      var context = this.context();
      this.cancel(moduleId, descriptor, context);
      return this.load(moduleId);
    }
    reloadAsync(moduleId) {
      var descriptor = this.modules[moduleId];
      if (!descriptor) return Promise.reject(new Error("Unknown module: " + moduleId));
      this.cancel(moduleId, descriptor, this.context());
      return this.loadAsync(moduleId);
    }
    refreshModules(moduleIds) {
      return Promise.all(moduleIds.map((moduleId) => {
        return this.modules[moduleId].asyncOnly ? this.reloadAsync(moduleId) : Promise.resolve(this.invalidate(moduleId));
      }));
    }
  };

  // app-templates/customer-portal/runtime/src/components/shell/AccountBootstrap.js
  function gateActions(list) {
    return h("div", { "class": "account-gate__actions" }, list);
  }
  function supportOrSignOut() {
    var support = SupportContactButton({ variant: "btn--primary", block: true, lg: true, visualId: "account-support" });
    return gateActions([
      support,
      ActionButton(support ? { variant: "btn--ghost", label: "Sign out", action: "auth.signOut", block: true, visualId: "account-signout" } : { variant: "btn--primary", label: "Sign out", action: "auth.signOut", block: true, lg: true, visualId: "account-signout" })
    ]);
  }
  function AccountBootstrap() {
    var s = state.account;
    var intendedRoute = state.session.intendedRoute || state.route;
    var page = h("section", { "class": "page account-gate", "data-route": intendedRoute, "data-state": s, "data-visual-id": "account-gate", "data-screen-label": "Account (" + s + ")" });
    var card = h("div", { "class": "auth-card account-gate__card", "data-module": "account-bootstrap", "data-visual-id": "account-bootstrap", "data-state": s, "data-intended-route": intendedRoute });
    if (s === "resolving-customer") {
      card.setAttribute("aria-busy", "true");
      card.appendChild(h("div", { "class": "oidc-status" }, [h("span", { "class": "oidc-spinner" })]));
      card.appendChild(h("div", { "class": "oidc-title" }, "Getting your account ready\u2026"));
      card.appendChild(h("div", { "class": "oidc-sub oidc-sub--tail" }, "You\u2019re signed in. We\u2019re securely loading your account and what it can do here \u2014 no need to do anything."));
    } else if (s === "customer-unavailable") {
      card.appendChild(h("div", { "class": "oidc-status" }, [h("div", { "class": "oidc-glyph oidc-glyph--warn" }, "!")]));
      card.appendChild(h("div", { "class": "oidc-title" }, "We can\u2019t open your account right now"));
      card.appendChild(h("div", { "class": "oidc-sub" }, "The portal couldn\u2019t load your account. Your data is safe and nothing was changed \u2014 try again in a moment."));
      card.appendChild(gateActions([
        ActionButton({ variant: "btn--primary", label: "Try again", action: "ui.retry", id: "account-bootstrap", block: true, lg: true, visualId: "account-retry" }),
        ActionButton({ variant: "btn--ghost", label: "Sign out", action: "auth.signOut", block: true, visualId: "account-signout" })
      ]));
    } else if (s === "customer-not-linked") {
      card.appendChild(h("div", { "class": "oidc-status" }, [GateGlyph("\u26AD")]));
      card.appendChild(h("div", { "class": "oidc-title" }, "This sign-in isn\u2019t linked to a customer account"));
      card.appendChild(h("div", { "class": "oidc-sub" }, "You\u2019re signed in, but this identity isn\u2019t connected to an active customer account with us, so the portal can\u2019t be opened. Our support team can link it for you."));
      card.appendChild(supportOrSignOut());
    } else if (s === "customer-account-ambiguous") {
      card.appendChild(h("div", { "class": "oidc-status" }, [GateGlyph("\u29C9")]));
      card.appendChild(h("div", { "class": "oidc-title" }, "We can\u2019t tell which account is yours"));
      card.appendChild(h("div", { "class": "oidc-sub" }, "Your sign-in matches more than one customer account, so the portal won\u2019t guess. Our support team can link the right one \u2014 nothing is shown until then."));
      card.appendChild(supportOrSignOut());
    } else if (s === "organization-forbidden") {
      card.appendChild(h("div", { "class": "oidc-status" }, [GateGlyph("\u2302")]));
      card.appendChild(h("div", { "class": "oidc-title" }, "This sign-in can\u2019t be used here"));
      card.appendChild(h("div", { "class": "oidc-sub" }, "Your sign-in works, but it doesn\u2019t belong to this portal\u2019s organization, so nothing here can be opened. If that seems wrong, contact support."));
      card.appendChild(supportOrSignOut());
    } else if (s === "customer-forbidden") {
      card.appendChild(h("div", { "class": "oidc-status" }, [GateGlyph("\u26BF")]));
      card.appendChild(h("div", { "class": "oidc-title" }, "This account can\u2019t open the customer portal"));
      card.appendChild(h("div", { "class": "oidc-sub" }, "Your sign-in works, but it doesn\u2019t include access to the customer portal. If you believe it should, contact support."));
      card.appendChild(supportOrSignOut());
    } else if (s === "session-expired") {
      card.appendChild(h("div", { "class": "oidc-status" }, [GateGlyph("\u23F1")]));
      card.appendChild(h("div", { "class": "oidc-title" }, "Your session ended"));
      card.appendChild(h("div", { "class": "oidc-sub" }, "For your security you were signed out. Nothing you see below is live anymore. Sign in again and you\u2019ll come right back here."));
      card.appendChild(h("div", { "class": "account-gate__route" }, ["Returning to\u2002", h("b", null, routeLabel(intendedRoute))]));
      card.appendChild(gateActions([
        ActionButton({ variant: "btn--primary", label: "Sign in again", action: "auth.oidcSignIn", block: true, lg: true, visualId: "account-reauth" }),
        LandingReturnButton({ variant: "btn--ghost", block: true, visualId: "account-catalog" })
      ]));
    }
    page.appendChild(card);
    return page;
  }

  // app-templates/customer-portal/runtime/src/app.js
  function BookingDrawer() {
    if (false) {
      return h("div", null, [
        h("div", { "class": "scrim", "data-action": "booking.close", "data-visual-id": "scrim" }),
        h("aside", { "class": "drawer", "data-module": "drawer", "data-visual-id": "booking-drawer", "data-state": "drawer-open", role: "dialog", "aria-label": flowTitle(state.spaFlow) }, [
          h("div", { "class": "drawer__head" }, [
            h("div", { "class": "drawer__title" }, flowTitle(state.spaFlow)),
            h("button", { "class": "drawer__close", "data-action": "booking.close", "aria-label": "Close" }, "\u2715")
          ]),
          SpaBookingFlow()
        ])
      ]);
    }
    var v = currentTheme();
    var phase = cmdPhase("booking.confirm:booking");
    var spaBridge = isSpa() && state.capability === "target-appointments";
    var holdBlocked = spaBridge && state.spaHold !== "held";
    var spaReview = false ? h("div", { "class": "booking-review", "data-module": "booking-review", "data-visual-id": "booking-review", "data-payment-mode": "SIMULATED", "data-state": state.spaHold }, [
      state.spaHold === "held" ? h("div", { "class": "booking-review__hold" }, "Your time is held for 10 minutes while you review \u2014 confirming books it.") : null,
      state.spaHold === "slot-expired" ? InlineFailure({ msg: "Your held time expired \u2014 nothing was booked. Pick a new time to continue.", retryAction: "ui.retry", retryId: "booking-hold", retryLabel: "Find a new time" }) : null,
      state.spaHold === "repriced" ? InlineFailure({ msg: "The price for this time changed while you were reviewing \u2014 reload and check it before confirming.", retryAction: "ui.retry", retryId: "booking-hold", retryLabel: "Reload & review" }) : null,
      SimulationBadge(true),
      h("div", { style: "font-size:11.5px;color:var(--ink-3);line-height:1.5;margin-top:6px" }, "No charge is made when you confirm \u2014 you pay at the studio as usual.")
    ]) : null;
    return h("div", null, [
      h("div", { "class": "scrim", "data-action": "booking.close", "data-visual-id": "scrim" }),
      h("aside", { "class": "drawer", "data-module": "drawer", "data-visual-id": "booking-drawer", "data-state": "drawer-open", role: "dialog", "aria-label": "Book a service" }, [
        h("div", { "class": "drawer__head" }, [
          h("div", { "class": "drawer__title" }, activeProfile().drawerTitle),
          h("button", { "class": "drawer__close", "data-action": "booking.close", "aria-label": "Close" }, "\u2715")
        ]),
        h(
          "div",
          { style: "display:flex;flex-direction:column;gap:9px;margin-bottom:18px" },
          v.svc.map(function(s, i) {
            return ServiceCard(s, i);
          })
        ),
        spaReview,
        phase === "failed" || phase === "conflict" ? InlineFailure({
          msg: phase === "conflict" ? "That time window just changed \u2014 pick again before confirming." : "Your booking wasn\u2019t confirmed \u2014 nothing is scheduled yet.",
          retryAction: "booking.confirm",
          retryLabel: phase === "conflict" ? "Re-check & confirm" : "Try again"
        }) : null,
        ActionButton({ variant: "btn--primary", label: spaBridge ? "Send booking request \u2014 no charge" : "Confirm booking", action: "booking.confirm", block: true, lg: true, visualId: "confirm-booking", disabled: holdBlocked, pending: phase === "pending", pendingLabel: "Sending\u2026" })
      ])
    ]);
  }
  var mount;
  var shell;
  var resizeObs;
  var runtime;
  var liveRetryPromise;
  var careTransitionPromise;
  var drawerScroll = 0;
  var leavingFor = "";
  var SETTLED_SIGN_IN_STATES = ["ready-signed-out", "ready-signed-in", "unavailable"];
  function leaveForPublicEntry() {
    if (leavingFor) return true;
    var destination = publicEntryDestination();
    if (!destination) return false;
    leavingFor = destination;
    globalThis.location.replace(destination);
    return true;
  }
  function loadGrantedCareTransition() {
    var envelope2 = state.moduleData.care;
    var granted = state.config.dataMode === "fixture" && state.config.enabledModules.includes("care") && state.session.authenticated === true && state.session.hasCustomerScope === true && state.session.hasTenantScope === true && state.access && state.access.care && state.access.care.status === "granted";
    if (!granted || !envelope2 || envelope2.phase !== "preflight") return;
    var pending = runtime.loadAsync("care");
    if (pending === careTransitionPromise) return;
    careTransitionPromise = pending;
    pending.then(function() {
      if (careTransitionPromise === pending) careTransitionPromise = null;
      render();
    }, function() {
      if (careTransitionPromise === pending) careTransitionPromise = null;
      render();
    });
  }
  function render() {
    if (leavingFor) return;
    var root = document.documentElement;
    root.setAttribute("data-theme", state.config.theme);
    root.setAttribute("data-mode", state.mode === "Dark" ? "dark" : "light");
    var openDrawer2 = mount.querySelector(".drawer");
    var drawerWasOpen = !!openDrawer2;
    if (openDrawer2) drawerScroll = openDrawer2.scrollTop;
    clear(mount);
    if (runtime && state.config.dataMode !== "live") runtime.loadAll();
    if (runtime) runtime.syncPreflight("care");
    if (runtime) loadGrantedCareTransition();
    var content = customerPortalGateActive() || !isPublic() && state.account !== "ready" ? AccountBootstrap() : renderRoute();
    if (content && state.route !== lastRoute) content.classList.add("route-enter");
    lastRoute = state.route;
    shell = AppShell(content);
    mount.appendChild(shell);
    if (state.drawer === "booking") {
      mount.appendChild(BookingDrawer());
      var drawer = mount.querySelector(".drawer");
      if (drawerWasOpen && drawer) {
        drawer.classList.add("drawer--open-static");
        var scrim = mount.querySelector(".scrim");
        if (scrim) scrim.classList.add("scrim--static");
        drawer.scrollTop = drawerScroll;
      } else drawerScroll = 0;
    } else drawerScroll = 0;
    if (state.toast) mount.appendChild(h("div", { "class": "toast", "data-module": "toast", "data-visual-id": "toast" }, [h("span", { "class": "toast__dot" }), state.toast]));
    applyResponsive();
    positionNavPill();
    var thread = mount.querySelector(".chat-thread");
    if (thread) thread.scrollTop = thread.scrollHeight;
  }
  var lastPill = null;
  var lastRoute = null;
  function positionNavPill() {
    var links = mount.querySelector(".nav-links");
    var pill = links && links.querySelector("[data-nav-pill]");
    if (!pill) {
      lastPill = null;
      return;
    }
    var active = links.querySelector(".nav-link--active");
    if (!active || getComputedStyle(links).display === "none") {
      pill.style.opacity = "0";
      lastPill = null;
      return;
    }
    var target = { left: active.offsetLeft, width: active.offsetWidth };
    pill.style.opacity = "1";
    if (lastPill) {
      pill.style.transition = "none";
      pill.style.width = lastPill.width + "px";
      pill.style.transform = "translateX(" + lastPill.left + "px)";
      pill.getBoundingClientRect();
      pill.style.transition = "";
    }
    pill.style.width = target.width + "px";
    pill.style.transform = "translateX(" + target.left + "px)";
    lastPill = target;
  }
  function applyResponsive() {
    if (resizeObs) resizeObs.disconnect();
    var target = shell;
    var apply = function(w) {
      var nodes = [target];
      var drawer = mount.querySelector(".drawer");
      if (drawer) nodes.push(drawer);
      nodes.forEach(function(node) {
        node.classList.remove("vw-mobile", "vw-tablet", "vw-compact");
        if (w <= 560) node.classList.add("vw-mobile");
        else if (w <= 900) node.classList.add("vw-tablet");
        if (w <= 1040) node.classList.add("vw-compact");
      });
    };
    apply(shell.getBoundingClientRect().width);
    resizeObs = new ResizeObserver(function(ents) {
      apply(ents[0].contentRect.width);
    });
    resizeObs.observe(shell);
  }
  function retryRuntimeLoad() {
    if (state.route === "care" && runtime) {
      state.carePayloadState = "ready";
      return reloadCareRuntime().catch(function() {
        return null;
      });
    }
    if (state.config.dataMode !== "live" || !runtime) {
      setState({ view: "ready" });
      return Promise.resolve();
    }
    if (liveRetryPromise) return liveRetryPromise;
    state.view = "loading";
    render();
    liveRetryPromise = runtime.loadAllAsync().then(function() {
      state.view = "ready";
      if (continueToIntendedRoute()) return;
      render();
    }).catch(function(error2) {
      state.view = state.config.errorMode === "fallback" ? "fallback" : "error";
      console.error("[aircove] runtime retry failed", error2);
      if (continueToIntendedRoute()) return;
      render();
    }).then(function() {
      return runtime.settled();
    }).then(function() {
      render();
    }).finally(function() {
      liveRetryPromise = null;
    });
    return liveRetryPromise;
  }
  function resumeIntendedRoute() {
    runtime.eachSettled(render);
    if (!continueToIntendedRoute()) render();
  }
  function continueToIntendedRoute() {
    if (leaveForPublicEntry()) return true;
    if (!state.session.authenticated || state.account !== "ready") return false;
    var intended = state.session.intendedRoute;
    if (!intended && state.route === "auth.oidc") intended = state.config.defaultRoute || "orders.list";
    if (!intended) return false;
    state.session.intendedRoute = null;
    go(intended, true);
    return true;
  }
  function recheckRestoredSession(event) {
    if (!event || !event.persisted || !customerPortalAccessRequired()) return;
    if (leavingFor || !SETTLED_SIGN_IN_STATES.includes(state.oidc) || state.account === "resolving-customer") {
      globalThis.location.reload();
      return;
    }
    storedCoreOidcUser().then(function(user) {
      if ((user && user.access_token || "") !== (state.session.accessToken || "")) globalThis.location.reload();
    }, function() {
      globalThis.location.reload();
    });
  }
  function invalidateCareRuntime() {
    if (!runtime) return null;
    return runtime.invalidate("care");
  }
  function reloadCareRuntime() {
    if (!runtime) return Promise.resolve(null);
    var pending = runtime.reloadAsync("care");
    render();
    return pending.then(function(result) {
      render();
      return result;
    }).catch(function(error2) {
      render();
      throw error2;
    });
  }
  function reloadRuntimeModule(moduleId) {
    if (!runtime) return Promise.reject(new Error("Portal runtime is not ready"));
    var pending = runtime.reloadAsync(moduleId);
    render();
    return pending.then(function(result) {
      render();
      return result;
    }).catch(function(error2) {
      render();
      throw error2;
    });
  }
  document.addEventListener("DOMContentLoaded", function() {
    mount = document.getElementById("app");
    applyPortalConfig(readPortalConfig(mount));
    runtime = new PortalRuntime({ state });
    var signingIn = customerPortalAccessRequired();
    if (signingIn) state.oidc = "checking-session";
    var loaded = runtime.loadAllAsync();
    initRouter(render);
    bindActions(mount);
    globalThis.addEventListener("pageshow", recheckRestoredSession);
    var fixture = currentFixture();
    if (state.config.dataMode !== "live") {
      loadLiveWeather(fixture && fixture.overview && fixture.overview.weather, state.config).then(function(live) {
        if (live) render();
      });
    }
    if (signingIn) {
      render();
      runtime.loadAsync("auth").then(function() {
        if (leaveForPublicEntry()) return null;
        render();
        if (state.session.authenticated) return runtime.loadAsync("account").then(resumeIntendedRoute, resumeIntendedRoute);
        return null;
      }, render);
    }
    loaded.then(function() {
      if (continueToIntendedRoute()) return;
      render();
    }).catch(function(error2) {
      state.view = state.config.errorMode === "fallback" ? "fallback" : "error";
      console.error("[aircove] runtime load failed", error2);
      if (continueToIntendedRoute()) return;
      render();
    }).then(function() {
      return runtime.settled();
    }).then(function() {
      render();
    });
  });
  window.AircovePortal = { state, go, setState, ACTIONS, runtime: function() {
    return runtime;
  } };
})();

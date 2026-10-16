// customer-portal/runtime/src/state.js — production transfer module.
import { F } from "../data/fixtures.js";
import { SPA_PRODUCT_CATALOG } from "../data/spa-product-catalog.js";
import { caseFixtureFor, cloneCaseValue } from "../data/case-fixtures.js";
import { deriveCoreBookingModel } from "./normalizers/spa-availability.js";
import { emptyLiveBookingOptions, liveBookingQuote, normalizeLiveBookingOptions } from "./normalizers/spa-booking-options.js";
import { customerAccountRequired, portalProfiles, resolveProfile, routeRegistry, verticalProfiles } from "./config.js";
import { contractsPackage } from "./normalizers/contracts.js";

export var state = {
  route: "orders.list",
  routeQuery: "",
  routeQueryOwner: null,
  theme: "HVAC",     // vertical display name
  mode: "Light",     // Light | Dark
  view: "ready",     // ready | loading | empty | error
  account: "ready",  // ready | resolving-customer | customer-* | session-expired
  commands: {},
  cmdForce: null,
  contact: null,
  contactDraft: null,
  contactErrors: null,
  filter: "all",     // order tab
  currentOrderId: null, // open order for order.detail
  cartItems: [],     // checkout cart
  addrId: "home",    // selected delivery address
  payId: "visa",     // selected payment method
  prodCat: "all",    // product category filter
  psites: F.proposalSites.map(function (p) { return Object.assign({}, p); }), // proposal sites (mutable)
  porders: [],
  pagreements: [],
  agreementId: null,
  quoteViews: {},
  contractCommand: null,
  contractConfirm: null,
  ovProperty: null,
  ovWeatherIndex: null,
  currentSiteId: "s2", // open proposal site
  profileFilter: "all",  // profile order-history tab
  feedFilter: "all",     // activity feed tab
  prefs: { receipts: true, sms: true, marketing: false },
  messages: F.initialMessages.slice(),
  typing: false,
  chatInput: "",
  activityReadAll: false,
  accessConfirmations: {},
  serviceRequests: [],
  nextFixtureOrder: 1,
  calYear: 2026, calMonth: 0,
  phone: "",
  code: "",
  authError: null,
  oidc: "ready-signed-out",
  sessionName: null,
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
    demoCommands: "closed",
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
  drawer: null,      // null | "booking"
  orders: F.ordersFor("HVAC")
};

/* ---------------- ACTIONS registry ----------------
   Every data-action maps here. Production command dispatch lands in S3.
   S1 keeps only honest local fixture transitions.             */

export function currentOrder() {
  var orders = orderItems();
  return orders.find(function (o) { return o.id === state.currentOrderId; }) ||
         orders.find(function (o) { return o.status === "inprogress"; }) || orders[0];
}

export function money(n) { return "$" + n.toLocaleString(); }

export function cartCount() { return state.cartItems.reduce(function (a, x) { return a + x.qty; }, 0); }

export function findProduct(name) {
  return productItems().find(function (p) { return p.name === name; });
}

export function orderItems() { return (state.moduleData.orders && state.moduleData.orders.items) || state.orders; }

export function productItems() {
  var v = currentFixture().theme;
  var items = (state.moduleData.products && state.moduleData.products.items) || v.products;
  return items.map(function (product) {
    if (product.code) return product;
    return Object.assign({}, product, { code: product.sku || product.id });
  });
}

export function spaSellInfo(code) {
  if (state.config.dataMode === "live") {
    var product = productItems().find(function (item) { return item.code === code; });
    if (!product) return { state: "unavailable" };
    /* Sellability is the PIM adapter's inventory join and nothing else — never
       the presence of a price. `unknown` stays its own state rather than being
       folded into `unavailable`, which renders "Not sold online": the store
       never said that, and for these products it is false. Unknown closes the
       buy action and says nothing, pending
       design-requests/calm-harbor-unknown-stock-shop-state.md. No `cents`: the
       live cart is priced by the server, so nothing needs a client-side minor
       unit any more. */
    var sellability = product.sellability === "sellable" || product.sellability === "out-of-stock"
      ? product.sellability : "unknown";
    return {
      state: sellability,
      backendPriceId: product.backendPriceId || null,
      backendProductId: product.backendProductId || null,
      displayPrice: product.price,
    };
  }
  var fixtureRetail = F.spaCommerce.retail.products.find(function (item) { return item.code === code; });
  if (fixtureRetail) return fixtureRetail;
  var fixtureProduct = productItems().find(function (item) { return item.code === code; });
  return fixtureProduct ? { state: "sellable", cents: Math.round(Number(fixtureProduct.priceNum || 0) * 100), displayPrice: fixtureProduct.price } : { state: "unavailable" };
}

export function spaProductRef(code) {
  var product = productItems().find(function (item) { return item.code === code; });
  if (product && product.ref) return product.ref;
  var catalog = SPA_PRODUCT_CATALOG;
  return catalog && catalog.codeToRef && catalog.codeToRef[code] || opaqueRef("product", code);
}

export function spaModelsReady() {
  if (state.config.dataMode !== "live") return state.spaModels === "ready";
  return !!(state.moduleData.products && state.moduleData.products.enrichment && state.moduleData.products.enrichment.models === "ready");
}

export function spaReviewsState() {
  if (state.config.dataMode !== "live") return state.spaReviews;
  var enrichment = state.moduleData.products && state.moduleData.products.enrichment;
  var value = enrichment && enrichment.reviews;
  return value === "ready" ? "ready" : value === "error" ? "error" : "unavailable";
}

export function spaProductModels() {
  if (state.config.dataMode !== "live") {
    var available = new Set(productItems().map(function (product) { return product.code; }));
    return SPA_PRODUCT_CATALOG.models.map(function (model) {
      return Object.assign({}, model, { productCodes: model.productCodes.filter(function (code) { return available.has(code); }) });
    }).filter(function (model) { return model.productCodes.length; });
  }
  return (state.moduleData.products && state.moduleData.products.models || []).map(function (model) {
    return {
      ref: model.ref,
      name: model.name,
      media: model.media || null,
      variants: (model.variantAttributes || []).map(displayAttributeLabel),
      productCodes: model.productCodes || [],
    };
  });
}

export function productDetailByCode(code) {
  if (state.config.dataMode !== "live") {
    var fixtureCatalog = SPA_PRODUCT_CATALOG;
    var fixtureProduct = productItems().find(function (item) { return item.code === code; });
    var fixtureDetail = fixtureCatalog && fixtureCatalog.byRef[fixtureCatalog.codeToRef[code]];
    if (fixtureDetail) return fixtureDetail;
    return fixtureProduct ? {
      ref: opaqueRef("product", code), code: code, name: fixtureProduct.name,
      displayPrice: fixtureProduct.price, description: fixtureProduct.description || fixtureProduct.blurb || "",
      collection: null, displayTag: fixtureProduct.displayTag || fixtureProduct.tag || "", variantFacts: [], media: [],
    } : null;
  }
  var product = productItems().find(function (item) { return item.code === code; });
  if (!product) return null;
  var model = spaProductModels().find(function (item) { return item.ref === product.modelRef; });
  return {
    ref: product.ref,
    code: product.code,
    name: product.name,
    displayPrice: product.price,
    description: product.description || "",
    collection: model ? { ref: model.ref, name: model.name } : null,
    displayTag: product.displayTag || "",
    variantFacts: product.variantFacts || [],
    media: product.media || [],
  };
}

export function currentProduct() {
  if (!state.spaCurrentProduct) return null;
  if (state.config.dataMode !== "live") {
    var fixtureDetail = SPA_PRODUCT_CATALOG.byRef[state.spaCurrentProduct];
    if (fixtureDetail) return fixtureDetail;
    var fixtureProduct = productItems().find(function (item) { return opaqueRef("product", item.code) === state.spaCurrentProduct; });
    return fixtureProduct ? productDetailByCode(fixtureProduct.code) : null;
  }
  var product = productItems().find(function (item) { return item.ref === state.spaCurrentProduct; });
  return product ? productDetailByCode(product.code) : null;
}

export function productReviews(productRef) {
  if (state.config.dataMode !== "live") {
    return SPA_PRODUCT_CATALOG.reviews[productRef] || [];
  }
  var product = productItems().find(function (item) { return item.ref === productRef; });
  if (!product) return [];
  return (state.moduleData.products && state.moduleData.products.reviews || []).filter(function (review) {
    return review.productCode === product.code;
  });
}

function displayAttributeLabel(value) {
  return String(value || "").toLowerCase().split("_").map(function (part) {
    return part ? part.charAt(0).toUpperCase() + part.slice(1) : "";
  }).join(" ");
}

function opaqueRef(prefix, value) {
  var text = String(value || prefix);
  var left = 2166136261;
  var right = 2246822507;
  for (var index = 0; index < text.length; index += 1) {
    var code = text.charCodeAt(index);
    left = Math.imul(left ^ code, 16777619);
    right = Math.imul(right ^ code, 3266489909);
  }
  return prefix + "-" + (left >>> 0).toString(36) + (right >>> 0).toString(36);
}

export function spaCatalogServices() {
  if (state.config.dataMode !== "live") return F.spa.pim.services;
  var source = state.moduleData.pricing && state.moduleData.pricing.rates || state.moduleData.services && state.moduleData.services.items || [];
  return source.filter(function (item) { return !item.productTypeCode || item.productTypeCode === "SPA_SERVICE"; }).map(function (item) {
    var durationMinutes = positiveCatalogInteger(spaCatalogAttribute(item.attributes, "DURATION_MIN"));
    if (!durationMinutes) {
      var bookingOptions = normalizeLiveBookingOptions(item, { providers: [] });
      var baseQuote = liveBookingQuote(bookingOptions, []);
      durationMinutes = positiveCatalogInteger(baseQuote && baseQuote.durationMinutes);
    }
    return {
      code: item.code,
      name: item.name,
      shortDescription: item.description || "Published spa service",
      displayPrice: item.price,
      interval: isOneTimeInterval(item.interval) ? "" : (item.interval || ""),
      backendProductId: item.backendProductId || null,
      durationMinutes: durationMinutes,
      attributes: item.attributes || {},
    };
  });
}

function liveBookingAvailability() {
  var appointments = state.moduleData.appointments || {};
  return appointments.availability || {
    state: state.moduleStatus.appointments === "error" ? "error" : "loading",
    providers: [],
  };
}

function liveBookingOptionsFor(serviceCode) {
  var service = spaCatalogServices().find(function (item) { return item.code === serviceCode; });
  return service ? normalizeLiveBookingOptions(service, liveBookingAvailability()) : emptyLiveBookingOptions();
}

export function spaBookingModel(serviceCode, specialistRef) {
  if (state.config.dataMode !== "live") return F.spaBooking;
  var flow = state.spaFlow || {};
  var selectedCode = serviceCode === undefined ? flow.serviceCode : serviceCode;
  var services = spaCatalogServices();
  var options = liveBookingOptionsFor(selectedCode);
  var quote = liveBookingQuote(options, selectedCode === flow.serviceCode ? flow.addOns : []);
  if (quote && quote.durationMinutes) services = services.map(function (service) {
    return service.code === selectedCode ? Object.assign({}, service, { durationMinutes: quote.durationMinutes }) : service;
  });
  return deriveCoreBookingModel(liveBookingAvailability(), services, {
    serviceCode: selectedCode,
    specialistRef: specialistRef === undefined ? flow.specialistRef : specialistRef,
  });
}

export function spaBookingSlotState() {
  return state.config.dataMode === "live" ? spaBookingModel().state : state.spaSlots;
}

export function spaSelectedSlot() {
  var flow = state.spaFlow;
  if (!flow || !flow.slotRef) return null;
  var days = spaBookingModel().days || [];
  for (var index = 0; index < days.length; index += 1) {
    var slot = (days[index].slots || []).find(function (item) { return item.ref === flow.slotRef; });
    if (slot) return slot;
  }
  return null;
}

/* Wave 20 booking options. Fixture mode exposes the accepted designer
   scenarios. The current live Core contract exposes no mode, add-on or note
   capability, so those sections remain absent instead of borrowing fixtures. */
export function spaBookingOpts() {
  if (state.config.dataMode === "live") {
    var live = liveBookingOptionsFor(state.spaFlow && state.spaFlow.serviceCode);
    live.notes = Object.assign({}, live.notes, { value: state.spaNote });
    return live;
  }
  var source = F.spaBookingOptions;
  var scenario = source.scenarios[state.spaOptScenario] || source.scenarios["fixed-studio"];
  var flow = state.spaFlow;
  var capabilities = Object.assign({}, scenario.capabilities);
  if (state.spaNoteCap === "disabled") capabilities.notes = false;
  if (flow && flow.entry === "reschedule") capabilities.addOns = false;
  var addOns = (scenario.addOns || []).map(function (addon) { return Object.assign({}, addon); });
  var affected = flow && flow.addOns && flow.addOns.length ? flow.addOns[0] : null;
  if (state.spaAddonSrc === "removed" && affected) addOns = addOns.filter(function (addon) { return addon.ref !== affected; });
  if (state.spaAddonSrc === "repriced" && affected) addOns = addOns.map(function (addon) { return addon.ref === affected ? Object.assign({}, addon, { displayPrice: "$22.00" }) : addon; });
  if (state.spaAddonSrc === "ineligible") addOns = addOns.map(function (addon) { return Object.assign({}, addon, { allowedActions: [] }); });
  return {
    capabilities: capabilities,
    visitModes: scenario.visitModes || [],
    locations: scenario.locations || [],
    addOns: addOns,
    notes: Object.assign({}, scenario.notes, { enabled: !!capabilities.notes, value: state.spaNote }),
    selectionVersion: scenario.selectionVersion,
    copy: source.sourceCopy,
  };
}

export function spaVisitMode(options) {
  options = options || spaBookingOpts();
  var flow = state.spaFlow;
  var byCode = function (code) { return options.visitModes.find(function (mode) { return mode.code === code; }) || null; };
  if (flow && flow.visitMode) return byCode(flow.visitMode);
  if (!options.capabilities.visitMode || options.visitModes.length === 1) return options.visitModes[0] || null;
  return null;
}

export function spaEligibleLocations(options) {
  options = options || spaBookingOpts();
  var mode = spaVisitMode(options);
  if (!mode) return [];
  if (["loading", "error", "unavailable", "empty"].includes(state.spaLocSrc)) return [];
  var list = options.locations.filter(function (location) { return location.visitModeCode === mode.code; });
  if (state.spaLocSrc === "no-address") list = list.filter(function (location) { return location.kind !== "SAVED_PLACE"; });
  return list;
}

export function spaSelectedLocation(options) {
  options = options || spaBookingOpts();
  var list = spaEligibleLocations(options);
  var flow = state.spaFlow;
  if (flow && flow.locationRef && state.spaLocSrc !== "ineligible") {
    var selected = list.find(function (location) { return location.ref === flow.locationRef; });
    if (selected) return selected;
  }
  return list.length === 1 ? list[0] : null;
}

export function spaSelectedAddOns(options) {
  options = options || spaBookingOpts();
  var flow = state.spaFlow;
  var selected = flow && flow.addOns || [];
  return options.addOns.filter(function (addon) {
    return selected.indexOf(addon.ref) !== -1 || (addon.required && addon.selected && !(addon.allowedActions || []).length);
  });
}

export function spaBookingQuote(options) {
  options = options || spaBookingOpts();
  var flow = state.spaFlow;
  if (!flow) return null;
  if (state.config.dataMode === "live") {
    var selected = spaSelectedAddOns(options).map(function (addon) { return addon.ref; });
    var liveQuote = liveBookingQuote(options, selected);
    if (liveQuote) return liveQuote;
    if (selected.length) return null;
    return {
      version: options.selectionVersion,
      addOns: [],
      displaySubtotal: null,
      displayTotal: spaBookingModel().displayTotals[flow.serviceCode] || "",
      durationMinutes: (spaCatalogServices().find(function (service) { return service.code === flow.serviceCode; }) || {}).durationMinutes || null,
    };
  }
  var refs = spaSelectedAddOns(options).map(function (addon) { return addon.ref; });
  var overrides = null;
  if (state.spaAddonSrc === "repriced" && flow.addOns && flow.addOns.length) {
    overrides = {};
    overrides[flow.addOns[0]] = { cents: 2200, displayPrice: "$22.00" };
  }
  return F.spaBookingQuote(flow.serviceCode, refs, state.spaOptScenario, overrides);
}

export function spaAddonChange(options) {
  options = options || spaBookingOpts();
  if (!options.capabilities.addOns) return null;
  if (state.spaAddonSrc === "removed") return { kind: "removed", copy: options.copy.addOnRemoved };
  if (state.spaAddonSrc === "repriced") return { kind: "repriced", copy: options.copy.addOnRepriced };
  return null;
}

export function spaNoteState(options) {
  options = options || spaBookingOpts();
  var max = options.notes.maxLength || 0;
  var value = state.spaNote || "";
  return {
    enabled: !!options.notes.enabled,
    value: value,
    max: max,
    len: value.length,
    remaining: max - value.length,
    near: max > 0 && value.length >= max - 30 && value.length <= max,
    invalid: max > 0 && value.length > max,
    helperText: options.notes.helperText,
    errorCopy: (options.copy.noteTooLong || "").replace("{max}", String(max)),
  };
}

export function spaOptionsStepOn(options) {
  options = options || spaBookingOpts();
  var capabilities = options.capabilities;
  if (capabilities.visitMode && options.visitModes.length > 1) return true;
  if (capabilities.location) {
    if (state.spaLocSrc !== "ready") return true;
    if (spaEligibleLocations(options).length > 1) return true;
  }
  if (capabilities.addOns) {
    if (state.spaAddonSrc !== "ready") return true;
    if (options.addOns.length) return true;
  }
  return false;
}

export function spaOptionsComplete(options) {
  options = options || spaBookingOpts();
  var capabilities = options.capabilities;
  var flow = state.spaFlow;
  if (!flow) return false;
  if (capabilities.visitMode && options.visitModes.length > 1 && !flow.visitMode) return false;
  var mode = spaVisitMode(options);
  if (capabilities.location && mode && mode.locationRequired) {
    if (state.spaLocSrc === "unavailable") return true;
    if (state.spaLocSrc !== "ready" || !spaSelectedLocation(options)) return false;
  }
  if (capabilities.addOns && state.spaAddonSrc === "ready") {
    var unmet = options.addOns.filter(function (addon) {
      return addon.required && (addon.allowedActions || []).indexOf("toggle") !== -1 && (flow.addOns || []).indexOf(addon.ref) === -1;
    });
    if (unmet.length) return false;
    if (!spaBookingQuote(options)) return false;
  }
  return true;
}

export function spaFlowSteps(flow) {
  flow = flow || state.spaFlow;
  if (!flow) return [];
  var steps = [];
  if (flow.entry !== "reschedule") steps.push({ k: "context", l: "Service" });
  if (spaOptionsStepOn()) steps.push({ k: "options", l: "Options" });
  if (flow.entry !== "reschedule" && (spaBookingModel().eligibleSpecialists[flow.serviceCode] || []).length) steps.push({ k: "specialist", l: "Specialist" });
  steps.push({ k: "slots", l: flow.entry === "reschedule" ? "New time" : "Time" });
  steps.push({ k: "review", l: "Review" });
  return steps;
}

function spaCatalogAttribute(attributes, code) {
  if (!attributes || typeof attributes !== "object") return null;
  for (var group of Object.values(attributes)) {
    var entry = group && group[code];
    if (entry && Object.prototype.hasOwnProperty.call(entry, "value")) return entry.value;
  }
  return null;
}

function positiveCatalogInteger(value) {
  var number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

// The adapter formats a one-time price as "One time"; these comparisons used to
// test lowercase "one time" and so never matched. Compare case-insensitively.
function isOneTimeInterval(value) {
  return String(value || "").trim().toLowerCase() === "one time";
}

export function spaPlanOffers() {
  if (state.config.dataMode !== "live") return F.spaCommerce.planOffers;
  var source = state.moduleData.pricing && state.moduleData.pricing.rates || [];
  return source.filter(function (item) { return item.productTypeCode === "SPA_MEMBERSHIP" || item.productTypeCode === "SPA_PACKAGE"; }).map(function (item) {
    var kind = item.productTypeCode === "SPA_MEMBERSHIP" ? "MEMBERSHIP" : "PACKAGE";
    return {
      ref: "offer-" + item.code,
      productCode: item.code,
      // Carried so confirming an offer can create a typed order line without a
      // second catalog lookup, exactly as a cart line does.
      backendPriceId: item.backendPriceId || null,
      backendProductId: item.backendProductId || null,
      productTypeCode: item.productTypeCode,
      kind: kind,
      title: item.name,
      displayPrice: item.price + (item.interval && !isOneTimeInterval(item.interval) ? " / " + item.interval : ""),
      amount: Number(item.priceNum) || 0,
      termsSummary: item.description || "Published catalog offer",
      benefits: [],
      sellability: "sellable",
      allowedActions: ["purchase"],
    };
  });
}

export function currentOverview() {
  var fixture = currentFixture();
  var overview = (fixture && fixture.overview) || null;
  if (state.config.dataMode === "live") return liveOverview();
  if (!overview) return null;
  if (!state.liveWeather) return overview;
  return Object.assign({}, overview, { weather: state.liveWeather });
}

function liveOverview() {
  var envelope = state.moduleData.properties;
  if (!envelope || envelope.state !== "ready") return null;
  var geography = state.config.serviceGeography;
  var forecast = liveForecastState();
  return {
    map: geography ? geography.map : null,
    weather: forecast === "ready" ? state.liveWeather : null,
    forecast: forecast,
    properties: envelope.items || [],
    sources: { invoices: "unavailable", appointments: "unavailable", contracts: "unavailable", support: "unavailable" },
    invoices: null,
    contracts: null,
    support: null,
    banner: null,
  };
}

export function liveOverviewStatus() {
  if (!isModuleEnabled("properties")) return "unconfigured";
  var envelope = state.moduleData.properties;
  if (envelope && envelope.state === "unauthorized") return "unauthorized";
  if (envelope && envelope.state === "error") return "error";
  if (!envelope || envelope.state !== "ready") return "loading";
  return "ready";
}

export function liveForecastState() {
  if (!state.config.serviceGeography || !state.config.weatherClientId || !state.config.weatherClientSecret) return "unconfigured";
  if (state.liveWeatherState === "ready" && state.liveWeather) return "ready";
  if (state.liveWeatherState === "failed") return "failed";
  return "loading";
}

export function activityUnread() {
  if (!isModuleEnabled("activity") || state.config.dataMode === "live" || state.activityReadAll) return false;
  return (currentFixture().activity || []).some(function (group) {
    return (group.items || []).some(function (item) { return !!item.unread; });
  });
}

export function currentFixture() {
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
    activity: F.buildFeed(F.themes[state.theme]),
  };
}

export function currentTheme() { return currentFixture().theme; }

export function currentStormCalendar() {
  var fixture = caseFixtureFor(state.config.caseId);
  return (fixture && fixture.stormCalendar) || F.stormCalendar(state.theme);
}

function caseProposals() {
  var fixture = caseFixtureFor(state.config.caseId);
  return (fixture && fixture.proposals) || null;
}

export function currentProposal() {
  var proposals = caseProposals();
  if (proposals) return proposals.proposal || null;
  return F.proposal;
}

export function quotePackage() {
  var data = state.moduleData.proposals;
  if (!data || !data.quotes) return null;
  return contractsPackage(data.quotes, contractProperties());
}

function contractProperties() {
  if (state.config.dataMode === "live") {
    var envelope = state.moduleData.properties;
    return envelope && envelope.state === "ready" && Array.isArray(envelope.items) ? envelope.items : [];
  }
  var overview = currentOverview();
  return (overview && overview.properties) || [];
}

export function quoteGroupFor(id) {
  var quotes = quotePackage();
  if (!quotes || !id) return null;
  var exact = quotes.groups.find(function (group) { return group.id === id; });
  if (exact) return exact;
  return quotes.groups.filter(function (group) {
    return !!group.property && (group.property.quoteSiteId === id || group.property.id === id);
  }).sort(function (left, right) { return (right.agreementBackendId || 0) - (left.agreementBackendId || 0); })[0] || null;
}

export function contractAgreementFor(id) {
  var quotes = quotePackage();
  return (quotes && id && quotes.agreements.find(function (row) { return row.id === id; })) || null;
}

export function proposalStatusMeta() {
  var proposals = caseProposals();
  return (proposals && proposals.statusMeta) || F.pstatus;
}

export function proposalPlanName(id) {
  var proposals = caseProposals();
  var names = proposals && proposals.planNames;
  return (names && names[id]) || F.planName(id);
}

export function proposalSites() { return (state.moduleData.proposals && state.moduleData.proposals.sites) || state.psites; }

export function activeVerticalConfig() { return verticalProfiles[state.config.vertical] || verticalProfiles.hvac; }

export function activeProfile() {
  var vertical = activeVerticalConfig();
  if (isSpa()) return portalProfiles[spaCapability() === "target-appointments" ? "spaTarget" : "spaStaging"];
  return portalProfiles[state.config.profile] || portalProfiles[vertical.profile];
}

export function isSpa() { return state.config.vertical === "beauty" || state.theme === "Beauty"; }

export function spaCapability() {
  return state.capability === "target-appointments" ? "target-appointments" : "current-staging";
}

export function spaBookingOpen() {
  if (!isSpa() || spaCapability() !== "target-appointments" || state.spaBooking !== "open") return false;
  if (state.config.dataMode !== "live") return true;
  var booking = spaBookingModel();
  // `empty` with eligible services is a real no-slots result and may open the
  // accepted empty-slots drawer. Loading/error/unavailable, or no eligible
  // Resource-to-service relationship, must use the accepted closed-booking UI.
  return (booking.state === "ready" || booking.state === "empty")
    && booking.eligibleServices.length > 0;
}

export function spaCurrentApiDemoOpen() {
  return isSpa() && state.config.dataMode === "live" && state.config.demoCommands === "current-api";
}

export function spaAppointments() {
  if (state.config.dataMode === "live") {
    return state.moduleData.appointments || { state: state.moduleStatus.appointments || "loading", items: [], next: null, upcoming: [], past: [], byRef: {} };
  }
  var sc = state.spaAppt;
  var next = sc === "empty" || sc === "no-history" ? null : (F.spa.appointments.nextVariants[sc] || F.spa.appointments.nextVariants.salon);
  return {
    state: next || F.spa.appointments.past.length ? "ready" : "empty",
    next: next,
    upcoming: F.spa.appointments.upcoming,
    past: sc === "no-history" ? [] : F.spa.appointments.past,
    byRef: F.spaCommerce.appointmentDetails,
  };
}

export function spaCustomer() {
  if (state.spaLongName) return F.spa.longCustomer;
  var fixtureCustomer = currentFixture().customer || F.customer;
  var displayName = state.sessionName || fixtureCustomer.fullName || fixtureCustomer.name || "Customer";
  var first = fixtureCustomer.firstName || displayName.split(/\s+/, 1)[0] || "Customer";
  return { first: first, greeting: fixtureCustomer.greeting || ("Welcome back, " + first), fullName: displayName };
}

export function spaRetailOpen() {
  return isSpa() && spaCapability() === "target-appointments" && state.spaRetail === "retail-commerce-open";
}

export function spaPlanSellOpen() {
  return isSpa() && spaCapability() === "target-appointments" && state.spaPlanCommerce === "open";
}

export function currentAppointment() {
  if (state.config.dataMode === "live") {
    var live = state.moduleData.appointments && state.moduleData.appointments.byRef || {};
    return state.spaCurrentAppointment ? live[state.spaCurrentAppointment] || null : null;
  }
  var appointment = state.spaCurrentAppointment ? F.spaCommerce.appointmentDetails[state.spaCurrentAppointment] || null : null;
  if (!appointment) return null;
  var rescheduled = state.spaRescheduled[appointment.ref];
  if (!rescheduled) return appointment;
  return Object.assign({}, appointment, {
    start: rescheduled.start,
    customerStatus: "Confirmed",
    attention: "Rescheduled — confirmed by the studio. The previous time was released.",
  });
}

export function spaProfileValues() {
  if (state.config.dataMode === "live") {
    var live = state.moduleData.profile || {};
    return {
      phone: live.phone == null ? null : live.phone,
      email: live.email || "",
      prefs: live.prefs || {},
      allowedActions: live.allowedActions || [],
      unavailableFields: live.unavailableFields || [],
    };
  }
  if (state.spaProfile) return state.spaProfile;
  var prefs = {};
  F.spaProfileSrv.preferences.forEach(function (preference) { prefs[preference.key] = preference.value; });
  return { phone: F.spaProfileSrv.phone, email: F.spaProfileSrv.email, prefs: prefs };
}

/* The cart envelope is the SERVER cart as the cart module last read it. In live
   mode there is no fixture fallback: a module that has not loaded returns null,
   and the bag renders as unloaded rather than showing lines nobody bought. */
export function spaCartEnvelope() {
  if (state.config.dataMode === "live") return state.moduleData.cart || null;
  return state.spaCart;
}

export function spaCartLines() {
  var envelope = spaCartEnvelope();
  return (envelope && Array.isArray(envelope.lines) && envelope.lines) || [];
}

export function spaCartCount() {
  if (state.config.dataMode === "live") {
    // `itemCount` is Core's own figure. When Core reports none the bag shows no
    // count — the browser does not add the line quantities up to invent one.
    var envelope = state.moduleData.cart;
    var itemCount = envelope == null ? null : envelope.itemCount;
    return itemCount == null || !Number.isFinite(Number(itemCount)) ? 0 : Number(itemCount);
  }
  return spaCartLines().reduce(function (count, line) { return count + line.qty; }, 0);
}

export function currentPurchase() {
  if (state.config.dataMode === "live") {
    var live = state.moduleData.orders && state.moduleData.orders.byRef || {};
    return state.spaCurrentPurchase ? live[state.spaCurrentPurchase] || null : null;
  }
  return state.spaCurrentPurchase ? F.spaCommerce.purchaseDetails[state.spaCurrentPurchase] || null : null;
}

export function spaPlans() {
  if (state.config.dataMode === "live") {
    var envelope = state.moduleData.plan;
    var items = envelope && Array.isArray(envelope.items) ? envelope.items : [];
    // Cancelled renewals still render from the server readback; the local map is
    // fixture-only and must not mask what Core returned.
    return items;
  }
  var refs = F.spaCommerce.plans.scenarios[state.spaPlanScenario] || [];
  return refs.map(function (ref) {
    var plan = F.spaCommerce.plans.byRef[ref];
    if (!state.spaPlanCancelled[ref]) return plan;
    return Object.assign({}, plan, {
      status: "Cancelled",
      note: "Renewal cancelled — your benefits continue to the end of the paid period.",
      allowedActions: [],
    });
  });
}

export function routeLabel(routeId) {
  var nav = activeProfile().nav.find(function (item) { return item.key === routeId; });
  if (nav) return nav.label || "your page";
  var labels = {
    "order.detail": "Order details", checkout: "Checkout", profile: "Profile", calendar: "Calendar",
    activity: "Activity", "orders.list": "Home", account: "Account", "purchases.list": "Purchases",
    "purchase.detail": "Purchase details", plan: "My plan", cart: "Your bag",
    "appointment.detail": "Your visit",
  };
  return labels[routeId] || "your page";
}

export function cmdPhase(key) { return state.commands[key] || "idle"; }

export function currentContact() {
  if (state.config.dataMode === "live") {
    var profile = state.moduleData.profile || {};
    return state.contact || { phone: profile.phone || "", email: profile.email || "" };
  }
  var customer = currentFixture().customer || F.customer;
  return state.contact || { phone: customer.phone || "", email: customer.email || "" };
}

export function isPublic(routeId) {
  var route = routeRegistry[routeId || state.route];
  return !!(route && route.public);
}

export function customerPortalAccessRequired() {
  return customerAccountRequired(state.config);
}

export function customerPortalGateActive() {
  return customerPortalAccessRequired()
    && state.session.authenticated === true
    && state.account !== "ready";
}

export function isModuleEnabled(moduleId) {
  if (!moduleId || moduleId === "auth" || moduleId === "seo-parity") return true;
  return state.config.enabledModules.includes(moduleId);
}

export function applyPortalConfig(config) {
  var vertical = verticalProfiles[config.vertical] ? config.vertical : "hvac";
  var verticalConfig = verticalProfiles[vertical];
  var theme = verticalProfiles[config.theme] ? config.theme : vertical;
  var profile = resolveProfile(vertical, config.profile);
  state.config = Object.assign({}, state.config, config, {
    vertical: vertical,
    theme: theme,
    profile: profile,
    defaultRoute: config.defaultRoute || verticalConfig.defaultRoute,
    enabledModules: config.enabledModules && config.enabledModules.length ? config.enabledModules : portalProfiles[profile].modules.slice(),
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
  state.psites = fixture && fixture.proposals
    ? cloneCaseValue(fixture.proposals.sites)
    : F.proposalSites.map(function (site) { return Object.assign({}, site); });
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

export function buildCalendarGrid(year, month) {
  var first = new Date(year, month, 1);
  var startWeekday = first.getDay();
  var daysInMonth = new Date(year, month + 1, 0).getDate();
  var cells = [];
  for (var i = 0; i < startWeekday; i++) cells.push({ empty: true });
  for (var d = 1; d <= daysInMonth; d++) {
    cells.push({ empty: false, day: d, events: orderItems().filter(function (o) { return o.y === year && o.m === month && o.d === d; }) });
  }
  return cells;
}

export function currentSite() {
  var sites = proposalSites();
  return sites.find(function (p) { return p.id === state.currentSiteId; }) || sites[0];
}

export function computeSite(site) {
  var cs = 0, ds = 0, total = 0;
  var names = currentTheme().prop.surfaces;
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
  var list = orderItems();
  if (state.filter !== "all") list = list.filter(function (o) { return o.status === state.filter; });
  return list;
}

export function tabItems() {
  var o = orderItems();
  var count = function (k) { return k === "all" ? o.length : o.filter(function (x) { return x.status === k; }).length; };
  return [
    { key: "all", label: "All", count: count("all") },
    { key: "inprogress", label: "Active", count: count("inprogress") },
    { key: "scheduled", label: "Scheduled", count: count("scheduled") },
    { key: "completed", label: "Done", count: count("completed") }
  ];
}

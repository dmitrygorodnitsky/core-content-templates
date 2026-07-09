// customer-portal/runtime/src/state.js — production transfer module.
import { F } from "../data/fixtures.js";
import { routeRegistry, verticalProfiles } from "./config.js";

export var state = {
  route: "orders.list",
  theme: "HVAC",     // vertical display name
  mode: "Light",     // Light | Dark
  view: "ready",     // ready | loading | empty | error
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
  session: { authenticated: true, intendedRoute: null },
  moduleStatus: {},
  moduleData: {},
  pending: {},
  commandErrors: {},
  config: {
    vertical: "hvac",
    profile: "onDemand",
    routerMode: "hash",
    authMode: "fixture",
    dataMode: "fixture",
    defaultMode: "light",
  },
  userModeOverridden: false,
  mobileNav: false,
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
  var v = F.themes[state.theme];
  return (state.moduleData.products && state.moduleData.products.items) || v.products;
}

export function proposalSites() { return (state.moduleData.proposals && state.moduleData.proposals.sites) || state.psites; }

export function activeVerticalConfig() { return verticalProfiles[state.config.vertical] || verticalProfiles.hvac; }

export function activeProfile() {
  var config = activeVerticalConfig();
  return F.profiles[config.profile] || F.profiles.onDemand;
}

export function isPublic(routeId) {
  var route = routeRegistry[routeId || state.route];
  return !!(route && route.public);
}

export function isModuleEnabled(moduleId) {
  if (!moduleId || moduleId === "auth" || moduleId === "landing") return true;
  return activeVerticalConfig().modules.includes(moduleId);
}

export function applyPortalConfig(config) {
  var vertical = verticalProfiles[config.vertical] ? config.vertical : "hvac";
  var verticalConfig = verticalProfiles[vertical];
  state.config = Object.assign({}, state.config, config, {
    vertical: vertical,
    profile: verticalConfig.profile,
  });
  state.theme = verticalConfig.displayName;
  state.orders = F.ordersFor(verticalConfig.displayName);
  state.filter = "all";
  state.cartItems = [];
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

export function currentSite() { return proposalSites().find(function (p) { return p.id === state.currentSiteId; }) || proposalSites()[0]; }

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

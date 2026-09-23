import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const dom = createDom();
const listeners = {};
const history = [];
globalThis.window = globalThis;
globalThis.document = dom.document;
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
globalThis.addEventListener = (type, listener) => { listeners[type] = listener; };
globalThis.location = { href: "https://portal.example.test/pages/SNOWLIMITLESS/portal", origin: "https://portal.example.test", pathname: "/pages/SNOWLIMITLESS/portal", search: "", hash: "" };
globalThis.history = {
  pushState(_, __, url) { history.push(["push", url]); globalThis.location.hash = url; },
  replaceState(_, __, url) { history.push(["replace", url]); globalThis.location.hash = url; },
};

const runtimeRoot = pathToFileURL(path.resolve("app-templates/customer-portal/runtime") + "/");
const load = (file) => import(new URL(file, runtimeRoot));
const { customerAccountRequired, readPortalConfig } = await load("src/config.js");
const { activityUnread, applyPortalConfig, customerPortalAccessRequired, state } = await load("src/state.js");
const { PortalRuntime } = await load("src/portal-runtime.js");
const { ACCOUNT_GATE_STATES, modules } = await load("src/modules/index.js");
const { initRouter, resolveRoute } = await load("src/router.js");
const { TopNav } = await load("src/components/shell/TopNav.js");
const { PublicNav } = await load("src/components/shell/PublicNav.js");
const { AccountBootstrap } = await load("src/components/shell/AccountBootstrap.js");
const { AuthOidc } = await load("src/routes/AuthOidcPage.js");
const { UnauthorizedState } = await load("src/components/primitives/RouteStates.js");
const { Overview } = await load("src/routes/OverviewPage.js");

const all = (root, selector) => root.querySelectorAll(selector);
const one = (root, selector) => root.querySelector(selector);
const actions = (root) => all(root, "[data-action]").map((node) => node.getAttribute("data-action"));
const RAW_ACTIONS = /^(?:support\.email|nav\.landing)$/;

const SNOW_LIVE = {
  portalVertical: "snow", portalProfile: "stormRetail", portalTheme: "snow", portalDataMode: "live", portalAuthMode: "required",
  portalOrganization: "SNOWLIMITLESS", portalAccountTypeCode: "CUSTOMER", portalDefaultRoute: "overview",
  portalBrandName: "Limitless Snow Removal", portalRequestFormUrl: "https://example.test/request-quote",
};
const SNOW_FIXTURE = {
  portalVertical: "snow", portalProfile: "stormRetail", portalTheme: "snow", portalDataMode: "fixture", portalAuthMode: "fixture",
  portalCase: "granite-ridge-snow", portalDefaultRoute: "overview", portalBrandName: "Granite Ridge",
};
const SPA_LIVE = {
  portalVertical: "beauty", portalProfile: "spaTarget", portalTheme: "beauty", portalCapability: "target-appointments", portalDataMode: "live",
  portalAuthMode: "required", portalOrganization: "CALM_HARBOR_SPA_STAGING", portalAccountTypeCode: "SPA_CUSTOMER", portalDefaultRoute: "orders.list",
  portalEnabledModules: "appointments,orders,services,pricing,products,account,cart,checkout,purchases,plan,profile",
};

function configure(dataset, extra = {}) {
  applyPortalConfig(readPortalConfig({ dataset: Object.assign({}, dataset, extra) }));
  state.session.authenticated = true;
  state.account = "ready";
  state.activityReadAll = false;
  state.mobileNav = false;
  state.route = state.config.defaultRoute;
  return state.config;
}

{
  const snowModules = "account,overview,properties,proposals,profile";
  configure(SNOW_LIVE, { portalEnabledModules: "overview,properties" });
  assert.equal(customerAccountRequired(state.config), true);
  assert.equal(customerPortalAccessRequired(), true, "a live portal that requires sign-in always needs the customer Account");
  assert.deepEqual(new PortalRuntime({ state }).enabledModuleIds(), ["auth", "account", "overview", "properties"], "the Account lookup runs whatever the module list says");
  configure(SNOW_LIVE, { portalEnabledModules: snowModules });
  assert.deepEqual(new PortalRuntime({ state }).enabledModuleIds(), ["auth", "account", "proposals", "overview", "properties", "profile"], "a listed account module is not loaded twice");
  configure(SNOW_FIXTURE);
  assert.equal(customerPortalAccessRequired(), false, "a fixture portal never resolves a customer Account");
  assert.equal(new PortalRuntime({ state }).enabledModuleIds().includes("account"), false);
  configure(SNOW_LIVE, { portalAuthMode: "fixture", portalEnabledModules: "overview,properties" });
  assert.equal(new PortalRuntime({ state }).enabledModuleIds().includes("account"), false, "a live preview without sign-in has no customer to resolve");

  configure(SNOW_LIVE, { portalEnabledModules: snowModules });
  assert.deepEqual(resolveRoute("account"), { id: "overview", reason: "disabled" }, "the snow profile owns no account screen, so the gate module never exposes the placeholder");
  configure(SPA_LIVE);
  assert.deepEqual(resolveRoute("account"), { id: "account", reason: null }, "the spa keeps its account screen");

  for (const code of ["core-request-failed", "invalid-response", "customer-scope-mismatch", undefined]) {
    configure(SNOW_LIVE);
    modules.account.onError(code ? Object.assign(new Error(code), { code }) : new Error("no code"), { state, config: state.config });
    assert.equal(state.account, "customer-unavailable", "an unexpected Account failure lands on the designed unavailable gate, never a blank card: " + code);
  }
  for (const code of ACCOUNT_GATE_STATES) {
    modules.account.onError(Object.assign(new Error(code), { code }), { state, config: state.config });
    assert.equal(state.account, code);
    const gate = AccountBootstrap();
    assert.ok(one(gate, ".oidc-title").textContent.length > 0, code + " renders its designed card");
  }
}

{
  configure(SNOW_LIVE, { portalEnabledModules: "account,overview,properties,proposals,profile" });
  state.session.authenticated = true;
  history.length = 0;
  globalThis.location.hash = "#/calendar";
  let routed = 0;
  initRouter(() => { routed += 1; });
  assert.equal(state.route, "overview");
  assert.equal(globalThis.location.hash, "#/overview", "a disabled route opened on load shows the home and says so in the address");

  history.length = 0;
  globalThis.location.hash = "#/calendar";
  listeners.hashchange();
  assert.equal(state.route, "overview");
  assert.equal(globalThis.location.hash, "#/overview", "a disabled route typed into the address bar is rewritten to the route actually shown");
  assert.deepEqual(history, [["replace", "#/overview"]], "the rewrite replaces the entry, so Back does not return to the disabled route");

  history.length = 0;
  globalThis.location.hash = "#/account";
  listeners.hashchange();
  assert.equal(globalThis.location.hash, "#/overview", "the account placeholder is never shown to a snow customer");

  history.length = 0;
  globalThis.location.hash = "#/nowhere";
  listeners.hashchange();
  assert.equal(globalThis.location.hash, "#/overview", "an unknown route is rewritten too");

  history.length = 0;
  globalThis.location.hash = "#/profile";
  listeners.hashchange();
  assert.equal(state.route, "profile");
  assert.deepEqual(history, [], "an enabled route keeps its address untouched");
  assert.equal(routed, 4);
}

{
  configure(SNOW_LIVE, { portalEnabledModules: "account,overview,properties,proposals,profile" });
  const nav = TopNav(false);
  const brand = one(nav, ".top-nav__brand");
  assert.equal(brand.getAttribute("data-action"), "nav.go", "without a landing address the brand goes to the portal home");
  assert.equal(brand.getAttribute("data-id"), "overview");
  assert.equal(one(nav, "[data-visual-id=\"primary-cta\"]").getAttribute("data-action"), "service.requestForm");
  const bell = one(nav, "[data-module=\"activity-control\"]");
  assert.equal(all(bell, ".dot-badge").length, 0, "no unread dot when Activity is disabled");
  assert.equal(bell.getAttribute("aria-disabled"), "true");
  assert.equal(one(nav, ".avatar").getAttribute("data-action"), "profile.open", "the header reaches the profile page, where Sign out lives");
  assert.equal(all(nav, "[data-module=\"sign-out-control\"]").length, 0);
  state.mobileNav = true;
  const menu = one(TopNav(false), "[data-state=\"mobile-navigation-open\"]");
  assert.deepEqual(all(menu, "[data-action]").map((node) => node.textContent), ["Home", "Contracts", "Profile", "Sign out"], "the mobile menu reaches Profile and Sign out directly");
  assert.equal(one(menu, "[data-module=\"mobile-sign-out\"]").getAttribute("data-action"), "auth.signOut");

  configure(SNOW_LIVE, { portalEnabledModules: "account,overview,properties" });
  const bare = TopNav(false);
  assert.equal(all(bare, ".avatar").length, 0);
  const signOut = one(bare, "[data-module=\"sign-out-control\"]");
  assert.equal(signOut.getAttribute("data-action"), "auth.signOut", "without the profile page the header still signs out");
  assert.equal(signOut.getAttribute("aria-label"), "Sign out");
  state.mobileNav = true;
  assert.deepEqual(all(one(TopNav(false), "[data-state=\"mobile-navigation-open\"]"), "[data-action]").map((node) => node.textContent), ["Home", "Sign out"]);

  configure(SNOW_LIVE, { portalEnabledModules: "account,overview,properties", portalRequestFormUrl: "" });
  assert.equal(all(TopNav(false), "[data-visual-id=\"primary-cta\"]").length, 0, "a quote button with nowhere to go is not rendered");

  configure(SNOW_LIVE, { portalEnabledModules: "account,overview,properties", portalLandingUrl: "https://www.example.test/", portalAllowedNavOrigins: "https://www.example.test" });
  assert.equal(one(TopNav(false), ".top-nav__brand").getAttribute("data-action"), "nav.landing", "a configured landing address keeps the brand an external link");
  configure(SNOW_LIVE, { portalEnabledModules: "account,overview,properties", portalLandingUrl: "https://elsewhere.example.test/" });
  assert.equal(one(TopNav(false), ".top-nav__brand").getAttribute("data-action"), "nav.go", "a landing address outside the allowed origins is not a destination");

  configure(SNOW_FIXTURE);
  const fixtureNav = TopNav(false);
  assert.equal(all(one(fixtureNav, "[data-module=\"activity-control\"]"), ".dot-badge").length, 1, "the fixture feed has unread items, so the bell says so");
  assert.equal(activityUnread(), true);
  assert.equal(all(fixtureNav, "[data-module=\"sign-out-control\"]").length, 0, "a fixture portal requires no sign-in");
  state.mobileNav = true;
  assert.deepEqual(all(one(TopNav(false), "[data-state=\"mobile-navigation-open\"]"), "[data-action]").map((node) => node.getAttribute("data-action")).slice(-1), ["profile.open"], "no Sign out in a portal that requires no sign-in");
  state.activityReadAll = true;
  assert.equal(all(one(TopNav(false), "[data-module=\"activity-control\"]"), ".dot-badge").length, 0, "the dot clears once the feed is marked read");
  configure(SNOW_FIXTURE, { portalEnabledModules: "overview,properties,profile" });
  assert.equal(activityUnread(), false, "no dot when Activity is disabled");
  configure(SNOW_LIVE, { portalEnabledModules: "account,overview,properties,activity" });
  assert.equal(activityUnread(), false, "no dot when Activity has no live source");
}

{
  configure(SNOW_LIVE);
  for (const gate of ["customer-not-linked", "customer-account-ambiguous", "organization-forbidden", "customer-forbidden"]) {
    state.account = gate;
    const card = AccountBootstrap();
    assert.equal(actions(card).filter((action) => RAW_ACTIONS.test(action)).length, 0, gate + " offers no action that is not connected");
    assert.deepEqual(actions(card), ["auth.signOut"], gate + " still lets the customer sign out");
    assert.match(one(card, "[data-visual-id=\"account-signout\"]").className, /btn--primary/, "the only action is the primary one");
    const glyph = one(card, ".oidc-glyph");
    assert.match(glyph.getAttribute("style") || "", /background:rgba\(var\(--accent-rgb\),\.12\)/, gate + " draws its symbol on a tile");
  }
  state.account = "session-expired";
  const expired = AccountBootstrap();
  assert.deepEqual(actions(expired), ["auth.oidcSignIn"], "a session that ended offers only sign-in without a landing address");
  assert.doesNotMatch(expired.textContent, /catalog/i, "the snow portal has no catalog");
  state.account = "customer-unavailable";
  assert.deepEqual(actions(AccountBootstrap()), ["ui.retry", "auth.signOut"]);

  configure(SNOW_LIVE, { portalSupportUrl: "https://help.example.test/portal", portalLandingUrl: "https://www.example.test/", portalAllowedNavOrigins: "https://help.example.test,https://www.example.test" });
  state.account = "customer-not-linked";
  const supported = AccountBootstrap();
  assert.deepEqual(actions(supported), ["support.open", "auth.signOut"], "a configured support address is the support action");
  assert.equal(one(supported, "[data-visual-id=\"account-support\"]").textContent, "Contact support");
  state.account = "session-expired";
  const landing = one(AccountBootstrap(), "[data-visual-id=\"account-catalog\"]");
  assert.equal(landing.textContent, "Back to our website");
  assert.equal(landing.getAttribute("data-action"), "nav.landing");

  configure(SNOW_LIVE);
  state.oidc = "unavailable";
  const oidc = AuthOidc();
  assert.deepEqual(actions(oidc), ["auth.retrySession"], "sign-in unavailable offers only the retry when no landing address is set");
  assert.doesNotMatch(oidc.textContent, /catalog/i);
  assert.deepEqual(actions(UnauthorizedState({ scope: "your contracts", backRoute: "overview" })), ["nav.go"], "an access refusal offers no support action that is not connected");

  const refusedHome = (extra) => {
    configure(SNOW_LIVE, Object.assign({ portalEnabledModules: "account,overview,properties" }, extra));
    state.moduleData.properties = { state: "unauthorized", items: [] };
    return one(Overview(), "[data-module=\"empty-state\"]");
  };
  assert.deepEqual(actions(refusedHome()), [], "a home the customer may not see offers no support action that goes nowhere");
  const helpDesk = refusedHome({ portalSupportUrl: "https://help.example.test/portal", portalAllowedNavOrigins: "https://help.example.test" });
  assert.deepEqual(actions(helpDesk), ["support.open"], "a configured support address is the way out of a refused home");
  assert.equal(one(helpDesk, "[data-visual-id=\"overview-support\"]").textContent, "Contact support");
  const supportRoute = one(refusedHome({ portalEnabledModules: "account,overview,properties,support" }), "[data-visual-id=\"overview-support\"]");
  assert.equal(supportRoute.getAttribute("data-action"), "nav.go", "an enabled support screen keeps the in-portal link");
  assert.equal(supportRoute.getAttribute("data-id"), "support");
}

{
  configure(SPA_LIVE);
  for (const gate of ["customer-not-linked", "customer-account-ambiguous", "organization-forbidden", "customer-forbidden"]) {
    state.account = gate;
    const card = AccountBootstrap();
    assert.deepEqual(actions(card), ["support.email", "auth.signOut"], "the spa keeps its support dialog on " + gate);
    assert.equal(one(card, "[data-visual-id=\"account-support\"]").className, "btn btn--primary btn--block btn--lg");
    assert.equal(one(card, "[data-visual-id=\"account-signout\"]").className, "btn btn--ghost btn--block");
    assert.equal(one(card, ".oidc-glyph").getAttribute("style"), null, "the spa gate keeps its accepted glyph");
  }
  state.account = "session-expired";
  const catalog = one(AccountBootstrap(), "[data-visual-id=\"account-catalog\"]");
  assert.equal(catalog.textContent, "Back to the catalog", "the spa keeps its catalog copy");
  assert.equal(catalog.getAttribute("data-action"), "nav.landing");
  state.oidc = "unavailable";
  assert.deepEqual(actions(AuthOidc()), ["auth.retrySession", "nav.landing"]);
  assert.deepEqual(actions(UnauthorizedState({ scope: "your orders", backRoute: "orders.list" })), ["support.email", "nav.go"]);
}

{
  const signedOutHeader = (dataset, extra) => {
    configure(dataset, extra);
    state.session.authenticated = false;
    state.route = "auth.oidc";
    return PublicNav();
  };
  const bare = signedOutHeader(SNOW_LIVE);
  assert.equal(all(bare, "[data-visual-id=\"public-home\"]").length, 0, "the signed-out header offers no Home link that goes nowhere");
  assert.equal(one(bare, ".top-nav__brand").getAttribute("data-action"), null, "the signed-out brand is not a link without a landing address");
  assert.equal(actions(bare).filter((action) => RAW_ACTIONS.test(action)).length, 0);
  const linked = signedOutHeader(SNOW_LIVE, { portalLandingUrl: "https://www.example.test/", portalAllowedNavOrigins: "https://www.example.test" });
  assert.equal(one(linked, "[data-visual-id=\"public-home\"]").getAttribute("data-action"), "nav.landing", "a configured landing address is the Home link");
  assert.equal(one(linked, ".top-nav__brand").getAttribute("data-action"), "nav.landing");
  const outside = signedOutHeader(SNOW_LIVE, { portalLandingUrl: "https://elsewhere.example.test/" });
  assert.equal(all(outside, "[data-visual-id=\"public-home\"]").length, 0, "a landing address outside the allowed origins is not a destination");
  assert.equal(one(signedOutHeader(SPA_LIVE), "[data-visual-id=\"public-home\"]").getAttribute("data-action"), "nav.landing", "the spa keeps its Home link");
}

{
  configure(SNOW_LIVE, { portalEnabledModules: "overview,properties" });
  const gates = {};
  const gate = (id) => new Promise((resolve, reject) => { gates[id] = { resolve, reject }; });
  const module = (id, extra = {}) => Object.assign({ id, asyncOnly: true, adapter: () => ({ load: () => gate(id) }), normalize: (raw) => raw }, extra);
  const runtime = new PortalRuntime({
    state,
    modules: {
      auth: module("auth", { adapter: () => ({ load: () => ({ state: "ready-signed-in" }) }) }),
      account: module("account", { adapter: () => ({ load: () => ({ state: "ready" }) }) }),
      overview: module("overview", { gatesFirstRender: false }),
      properties: module("properties"),
    },
  });
  const flush = () => new Promise((resolve) => setImmediate(resolve));
  let finished = false;
  const loaded = runtime.loadAllAsync(["auth", "account", "overview", "properties"]).then(() => { finished = true; });
  await flush();
  const settledCalls = [];
  runtime.eachSettled(() => settledCalls.push(Object.keys(gates).filter((id) => state.moduleStatus[id] !== "loading")));
  assert.deepEqual(Object.keys(gates).sort(), ["overview", "properties"], "both reads start once the Account resolves");
  gates.properties.resolve({ state: "ready", items: [] });
  await loaded;
  assert.equal(finished, true, "the first render waits for the properties and not for a read that does not gate it");
  assert.equal(state.moduleStatus.overview, "loading");
  let quiet = false;
  runtime.settled().then(() => { quiet = true; });
  await flush();
  assert.equal(quiet, false, "settled waits for the forecast still on its way");
  gates.overview.reject(Object.assign(new Error("slow forecast failed"), { code: "weather-unavailable" }));
  await runtime.settled();
  await flush();
  assert.equal(quiet, true);
  assert.equal(settledCalls.length, 2, "each read that settles asks for one more render");
  assert.deepEqual(settledCalls[settledCalls.length - 1].sort(), ["overview", "properties"]);
}

console.log("snow-portal-shell-check ok: a live signed-in portal resolves the customer Account whatever its module list says and never exposes the account placeholder, an unexpected Account failure lands on the designed gate, a disabled, unknown or placeholder route is rewritten to the route shown, no header, gate or access-refusal action is rendered without a configured destination, the snow portal speaks of no catalog, the bell shows a dot only for unread items of an Activity source, gate symbols sit on a tile, Sign out is reachable from the header and the mobile menu whenever sign-in is required, the first render never waits for the forecast while every read that settles asks for one more render, and the spa gates keep their accepted actions, copy and glyphs");

function createDom() {
  class Text {
    constructor(value) { this.textContent = String(value); this.parentNode = null; }
  }
  class Element {
    constructor(tag) {
      this.tagName = String(tag).toUpperCase();
      this.attributes = new Map();
      this.childNodes = [];
      this.parentNode = null;
      this.listeners = {};
      this.style = {};
    }
    get className() { return this.getAttribute("class") || ""; }
    set className(value) { this.setAttribute("class", value); }
    get children() { return this.childNodes.filter((node) => node instanceof Element); }
    get textContent() { return this.childNodes.map((node) => node.textContent).join(""); }
    set textContent(value) { this.replaceChildren(new Text(value)); }
    get classList() {
      const element = this;
      return {
        add(...names) { element.className = element.className.split(/\s+/).filter(Boolean).concat(names).join(" "); },
        remove(...names) { element.className = element.className.split(/\s+/).filter((name) => name && !names.includes(name)).join(" "); },
      };
    }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
    hasAttribute(name) { return this.attributes.has(name); }
    removeAttribute(name) { this.attributes.delete(name); }
    appendChild(child) {
      if (child.parentNode) child.parentNode.removeChild(child);
      child.parentNode = this;
      this.childNodes.push(child);
      return child;
    }
    removeChild(child) {
      this.childNodes = this.childNodes.filter((node) => node !== child);
      child.parentNode = null;
      return child;
    }
    replaceChildren(...nodes) {
      this.childNodes.forEach((node) => { node.parentNode = null; });
      this.childNodes = [];
      nodes.forEach((node) => this.appendChild(node));
    }
    addEventListener(type, listener) { (this.listeners[type] = this.listeners[type] || []).push(listener); }
    querySelectorAll(selector) {
      let scope = [this];
      selector.split(" ").forEach((step) => {
        const found = [];
        scope.forEach((root) => {
          const walk = (node) => node.children.forEach((child) => { if (matches(child, step) && !found.includes(child)) found.push(child); walk(child); });
          walk(root);
        });
        scope = found;
      });
      return scope;
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  }
  function matches(node, selector) {
    const parts = selector.match(/^[a-zA-Z0-9-]+|\.[\w-]+|\[[^\]]+\]/g) || [];
    return parts.every((part) => {
      if (part[0] === ".") return node.className.split(/\s+/).includes(part.slice(1));
      if (part[0] === "[") {
        const attribute = /^\[([\w-]+)(?:="([^"]*)")?\]$/.exec(part);
        return attribute[2] === undefined ? node.hasAttribute(attribute[1]) : node.getAttribute(attribute[1]) === attribute[2];
      }
      return node.tagName === part.toUpperCase();
    });
  }
  const documentNode = new Element("#document");
  documentNode.head = new Element("head");
  documentNode.createElement = (tag) => new Element(tag);
  documentNode.createElementNS = (_, tag) => new Element(tag);
  documentNode.createTextNode = (value) => new Text(value);
  return { document: documentNode };
}

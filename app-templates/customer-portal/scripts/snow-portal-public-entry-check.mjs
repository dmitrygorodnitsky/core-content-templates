import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";

const PORTAL_ORIGIN = "https://dev-1.servicewand.com";
const PORTAL_PATH = "/pages/SNOWLIMITLESS/portal";
const LANDING = "https://dev-1.servicewand.com/pages/SNOWLIMITLESS/home";
const SIGNED_OUT_RETURN = LANDING + "?portal=signed-out";
const NO_ACCESS = LANDING + "?portal=no-access";
const NO_ACCESS_STATES = ["customer-not-linked", "organization-forbidden", "customer-forbidden"];

if (isMainThread) await main();
else await boot(workerData);

async function main() {
  const root = path.resolve("app-templates/customer-portal");
  const runtimeRoot = pathToFileURL(path.join(root, "runtime") + "/");
  const load = (file) => import(new URL(file, runtimeRoot));
  installBrowser({ hash: "" });

  const { ACCOUNT_NO_ACCESS_STATES, LANDING_ENTRY_REASONS, landingEntryOpen, landingEntryUrl, readPortalConfig, routeRegistry } = await load("src/config.js");
  const { applyPortalConfig, state } = await load("src/state.js");
  const { ACCOUNT_GATE_STATES } = await load("src/modules/index.js");
  const { initRouter, publicEntryDestination } = await load("src/router.js");
  const { exportLivePortalManual } = await import(pathToFileURL(path.join(root, "scripts/export-live-portal-manual.mjs")).href);

  const outputDir = path.join(root, "dist/manual-upload/.snow-portal-public-entry-check");
  let shipped;
  try {
    await fs.rm(outputDir, { recursive: true, force: true });
    await exportLivePortalManual({
      inputPath: path.join(root, "cms/granite-ridge-snow.customer-portal-staging.json"),
      runtimePath: path.join(root, "runtime/manual/granite-ridge-staging-runtime.js"),
      outputDir,
    });
    shipped = shippedDataset(JSON.parse(await fs.readFile(path.join(outputDir, "root/template.json"), "utf8")));
  } finally {
    await fs.rm(outputDir, { recursive: true, force: true });
  }

  assert.equal(shipped.portalSignedOutDestination, "landing", "the live snow root opts in to the landing as its anonymous face");
  assert.equal(shipped.portalLandingUrl, LANDING);
  assert.equal(shipped.portalLogoutReturnUrl, SIGNED_OUT_RETURN);
  assert.equal(shipped.portalAllowedNavOrigins, PORTAL_ORIGIN);
  assert.equal(routeRegistry["auth.oidc"].path, "/login", "#/login is the explicit sign-in entry the landing links to");
  assert.equal(LANDING_ENTRY_REASONS.signedOut, "signed-out");
  assert.equal(LANDING_ENTRY_REASONS.noAccess, "no-access");
  assert.deepEqual([...ACCOUNT_NO_ACCESS_STATES].sort(), [...NO_ACCESS_STATES].sort(), "exactly three gate states mean the User has no access here");
  for (const code of ACCOUNT_NO_ACCESS_STATES) assert.ok(ACCOUNT_GATE_STATES.includes(code), code + " is an account gate state");

  const configured = (overrides = {}) => {
    const dataset = Object.assign({}, shipped, overrides);
    for (const key of Object.keys(dataset)) if (dataset[key] === undefined) delete dataset[key];
    return readPortalConfig({ dataset });
  };
  assert.equal(configured().signedOutDestination, "landing");
  assert.equal(configured({ portalSignedOutDestination: undefined }).signedOutDestination, "sign-in", "without the setting the portal keeps its sign-in card");
  assert.equal(configured({ portalSignedOutDestination: "elsewhere" }).signedOutDestination, "sign-in", "an unknown value keeps the sign-in card");
  assert.equal(landingEntryUrl(configured()), LANDING, "a signed-out visit carries no reason");
  assert.equal(landingEntryUrl(configured(), LANDING_ENTRY_REASONS.noAccess), NO_ACCESS);
  assert.equal(landingEntryUrl(configured(), LANDING_ENTRY_REASONS.signedOut), SIGNED_OUT_RETURN, "the sign-out return the source declares is the one the runtime would build");
  assert.equal(landingEntryUrl(configured({ portalLandingUrl: LANDING + "?utm=snow" }), LANDING_ENTRY_REASONS.noAccess), LANDING + "?utm=snow&portal=no-access", "a landing address with a query keeps it");

  const variants = {
    on: { overrides: {}, open: true },
    off: { overrides: { portalSignedOutDestination: undefined }, open: false },
    "no landing address": { overrides: { portalLandingUrl: undefined }, open: false },
    "landing outside the allowed origins": { overrides: { portalAllowedNavOrigins: "https://www.example.test" }, open: false },
    "plain-http landing": { overrides: { portalLandingUrl: "http://dev-1.servicewand.com/pages/SNOWLIMITLESS/home" }, open: false },
    "fixture data": { overrides: { portalDataMode: "fixture" }, open: false },
    "no sign-in required": { overrides: { portalAuthMode: "fixture" }, open: false },
  };
  const oidcStates = ["checking-session", "ready-signed-out", "redirecting", "unavailable", "signing-out", "ready-signed-in"];
  const accountStates = ["ready", "resolving-customer", "session-required", "customer-unavailable", ...ACCOUNT_GATE_STATES];
  let decisions = 0;
  for (const [label, variant] of Object.entries(variants)) {
    applyPortalConfig(configured(variant.overrides));
    assert.equal(landingEntryOpen(state.config), variant.open, label);
    for (const intendedRoute of ["overview", null]) {
      for (const authenticated of [false, true]) {
        for (const oidc of oidcStates) {
          for (const account of accountStates) {
            state.session.intendedRoute = intendedRoute;
            state.session.authenticated = authenticated;
            state.oidc = oidc;
            state.account = account;
            let expected = "";
            if (variant.open && intendedRoute) {
              if (!authenticated && oidc === "ready-signed-out") expected = LANDING;
              if (authenticated && NO_ACCESS_STATES.includes(account)) expected = NO_ACCESS;
            }
            assert.equal(publicEntryDestination(), expected, [label, intendedRoute || "#/login", authenticated ? "signed in" : "signed out", oidc, account].join(" / "));
            decisions += 1;
          }
        }
      }
    }
  }

  const initialWrite = (overrides, hash) => {
    const browser = installBrowser({ hash });
    applyPortalConfig(configured(overrides));
    initRouter(() => {});
    return { writes: browser.history, intended: state.session.intendedRoute, route: state.route };
  };
  assert.deepEqual(initialWrite({}, "#/overview"), { writes: [["replace", "#/login"]], intended: "overview", route: "auth.oidc" }, "with the landing on, the session check never adds a history entry the landing could be trapped behind");
  assert.deepEqual(initialWrite({}, ""), { writes: [["replace", "#/login"]], intended: "overview", route: "auth.oidc" }, "the bare portal address is a private-route visit");
  assert.deepEqual(initialWrite({}, "#/login"), { writes: [], intended: null, route: "auth.oidc" }, "#/login is public, so nothing is intended beyond it");
  assert.deepEqual(initialWrite({ portalSignedOutDestination: undefined }, "#/overview"), { writes: [["push", "#/login"]], intended: "overview", route: "auth.oidc" }, "with the setting off the router writes history as it always has");

  const scenarios = [
    { id: "signed out on a private route", hash: "#/overview", session: "signed-out", replaced: [LANDING], last: "oidc:checking-session", never: ["oidc:ready-signed-out"] },
    { id: "signed out on the bare portal address", hash: "", session: "signed-out", replaced: [LANDING], last: "oidc:checking-session", never: ["oidc:ready-signed-out"] },
    { id: "signed out on a property link", hash: "#/properties/9101", session: "signed-out", replaced: [LANDING], last: "oidc:checking-session" },
    { id: "signed out on #/login", hash: "#/login", session: "signed-out", replaced: [], last: "oidc:ready-signed-out", actions: ["auth.oidcSignIn"] },
    { id: "session check still running", hash: "#/overview", session: "signed-out", discovery: "pending", replaced: [], last: "oidc:checking-session" },
    { id: "sign-in library missing", hash: "#/overview", session: "signed-out", oidcLibrary: false, replaced: [], last: "oidc:unavailable", actions: ["auth.retrySession", "nav.landing"] },
    { id: "Core discovery failing", hash: "#/overview", session: "signed-out", discovery: "fail", replaced: [], last: "oidc:unavailable" },
    { id: "a retry that settles signed out", hash: "#/overview", session: "signed-out", discovery: "fail-once", click: "oidc-retry", replaced: [LANDING], last: "oidc:unavailable" },
    ...NO_ACCESS_STATES.map((gate) => ({ id: gate + " on a private route", hash: "#/overview", session: "signed-in", account: gate, replaced: [NO_ACCESS], last: "gate:resolving-customer", never: ["gate:" + gate] })),
    ...["customer-account-ambiguous", "customer-unavailable", "session-expired"].map((gate) => ({ id: gate + " on a private route", hash: "#/overview", session: "signed-in", account: gate, replaced: [], last: "gate:" + gate })),
    ...NO_ACCESS_STATES.map((gate) => ({ id: gate + " on #/login", hash: "#/login", session: "signed-in", account: gate, replaced: [], last: "gate:" + gate, actions: ["auth.signOut"] })),
    { id: "signed in with access on #/login", hash: "#/login", session: "signed-in", account: "ready", replaced: [], last: "route:overview", route: "overview", pushed: "#/overview" },
    { id: "sign-out from the no-access gate", hash: "#/login", session: "signed-in", account: "customer-not-linked", click: "account-signout", replaced: [], signedOutTo: SIGNED_OUT_RETURN },
    { id: "setting off, signed out on a private route", hash: "#/overview", session: "signed-out", off: true, replaced: [], last: "oidc:ready-signed-out" },
    ...NO_ACCESS_STATES.map((gate) => ({ id: "setting off, " + gate + " on a private route", hash: "#/overview", session: "signed-in", account: gate, off: true, replaced: [], last: "gate:" + gate })),
  ];
  const workerFile = fileURLToPath(import.meta.url);
  const results = await Promise.all(scenarios.map((scenario) => runWorker(workerFile, {
    scenario, runtimeRoot: runtimeRoot.href,
    dataset: scenario.off ? Object.fromEntries(Object.entries(shipped).filter(([key]) => key !== "portalSignedOutDestination")) : shipped,
  })));
  for (const [index, result] of results.entries()) {
    const scenario = scenarios[index];
    const label = scenario.id;
    assert.deepEqual(result.errors, [], label + ": the boot raised no unexpected error");
    assert.deepEqual(result.replaced, scenario.replaced, label + ": location.replace targets");
    assert.deepEqual(result.assigned, [], label + ": no other navigation");
    if (scenario.last) assert.equal(result.cards[result.cards.length - 1], scenario.last, label + ": the last screen rendered");
    for (const card of scenario.never || []) assert.equal(result.cards.includes(card), false, label + ": " + card + " never renders before leaving");
    if (scenario.actions) assert.deepEqual(result.actions, scenario.actions, label + ": the actions on the card");
    if (scenario.route) assert.equal(result.route, scenario.route, label + ": the route it continues to");
    if (scenario.pushed) assert.deepEqual(result.history[result.history.length - 1], ["push", scenario.pushed], label + ": continues as it always has");
    if (scenario.signedOutTo) {
      assert.equal(result.calls.signoutRedirect, 1, label + ": Core sign-out starts once");
      assert.equal(result.logoutReturn, scenario.signedOutTo, label + ": the shared Core callback finds the landing with the signed-out reason");
    } else {
      assert.equal(result.calls.signoutRedirect, 0, label + ": nobody is signed out");
    }
    assert.equal(result.calls.removeUser, 0, label + ": the shared Core Auth session is kept");
    if (scenario.replaced.length) {
      assert.equal(result.history.some(([kind]) => kind === "push"), false, label + ": leaving adds no history entry");
      assert.equal(result.rendersAfterLeaving, 0, label + ": nothing renders once the portal is leaving");
    }
  }

  console.log("snow-portal-public-entry-check ok: " + decisions + " decisions over the opt-in, the session and the account gate, and " + scenarios.length
    + " boots of runtime/src against the shipped root. A private route that settles signed out replaces itself with the landing; customer-not-linked, organization-forbidden and customer-forbidden replace it with ?portal=no-access without signing out; the session check, an unavailable sign-in, #/login, the ambiguous, unavailable and expired gates, and the setting off never leave; Sign out stores the landing with ?portal=signed-out for the shared Core callback; and the session check adds no history entry");
}

function runWorker(file, data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(file, { workerData: data });
    const timer = setTimeout(() => { worker.terminate(); reject(new Error("Boot timed out: " + data.scenario.id)); }, 20000);
    worker.once("message", (message) => { clearTimeout(timer); worker.terminate(); resolve(message); });
    worker.once("error", (error) => { clearTimeout(timer); reject(new Error(data.scenario.id + ": " + error.message)); });
  });
}

async function boot({ scenario, runtimeRoot, dataset }) {
  const browser = installBrowser({ hash: scenario.hash, dataset, scenario });
  console.error = (...args) => {
    const text = args.map((item) => (item && item.message) || String(item)).join(" ");
    if (!/\[aircove\] runtime (load|retry) failed/.test(text)) browser.errors.push(text);
  };
  process.on("unhandledRejection", (error) => browser.errors.push("unhandled: " + (error && error.message)));
  const app = new URL("src/app.js", runtimeRoot);
  await import(app.href);
  browser.document.fire("DOMContentLoaded");
  await browser.settle();
  if (scenario.click) {
    browser.click(scenario.click);
    await browser.settle();
  }
  const state = globalThis.AircovePortal.state;
  parentPort.postMessage({
    replaced: browser.replaced,
    assigned: browser.assigned,
    history: browser.history,
    cards: browser.cards,
    rendersAfterLeaving: browser.rendersAfterLeaving(),
    actions: browser.cardActions(),
    route: state.route,
    calls: browser.calls,
    logoutReturn: browser.sessionStorage.getItem("oidc-logout-return-url"),
    errors: browser.errors,
  });
}

function shippedDataset(template) {
  const values = new Map(template.parameters.map((item) => [item.code, item.value]));
  const html = template.html.replace(/\$\{([A-Z0-9_]+)@STRING\}/g, (_, code) => values.get(code));
  const match = /^<section id="app" ([^>]*)><\/section>$/.exec(html);
  assert.ok(match, "the root element is the whole html field");
  const dataset = {};
  for (const attribute of match[1].matchAll(/data-([a-z-]+)="([^"]*)"/g)) {
    dataset[attribute[1].replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = decodeHtml(attribute[2]);
  }
  return dataset;
}

function decodeHtml(value) {
  return value.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

function installBrowser({ hash, dataset = {}, scenario = {} }) {
  const replaced = [];
  const assigned = [];
  const history = [];
  const cards = [];
  const errors = [];
  const calls = { signoutRedirect: 0, removeUser: 0, signinRedirect: 0 };
  let renders = 0;
  let rendersAtLeave = null;
  const document = createDocument();
  const mount = document.createElement("section");
  mount.setAttribute("id", "app");
  mount.dataset = dataset;
  document.mount = mount;
  const appendToMount = mount.appendChild.bind(mount);
  mount.appendChild = (child) => {
    appendToMount(child);
    if (child.getAttribute("data-module") === "app-shell") {
      renders += 1;
      const card = child.querySelector('[data-module="core-oidc-auth"]') || child.querySelector('[data-module="account-bootstrap"]');
      const page = child.querySelector("section[data-route]");
      cards.push(card ? (card.getAttribute("data-module") === "core-oidc-auth" ? "oidc:" : "gate:") + card.getAttribute("data-state") : "route:" + (page && page.getAttribute("data-route")));
    }
    return child;
  };

  const location = {
    origin: PORTAL_ORIGIN, pathname: PORTAL_PATH, search: "", hash,
    get href() { return PORTAL_ORIGIN + PORTAL_PATH + this.hash; },
    replace(url) { replaced.push(url); if (rendersAtLeave === null) rendersAtLeave = renders; },
    assign(url) { assigned.push(url); },
  };
  const memoryStorage = () => {
    const values = new Map();
    return { getItem: (key) => (values.has(key) ? values.get(key) : null), setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key), clear: () => values.clear(), key: (index) => Array.from(values.keys())[index] || null, get length() { return values.size; } };
  };
  const sessionStorage = memoryStorage();
  const windowListeners = {};
  Object.assign(globalThis, {
    window: globalThis,
    document,
    location,
    history: {
      pushState(_, __, url) { history.push(["push", url]); location.hash = url; },
      replaceState(_, __, url) { history.push(["replace", url]); location.hash = url; },
    },
    sessionStorage,
    localStorage: memoryStorage(),
    ResizeObserver: class { observe() {} unobserve() {} disconnect() {} },
    getComputedStyle: () => ({ display: "flex" }),
    requestAnimationFrame: (callback) => setTimeout(callback, 0),
    addEventListener: (type, listener) => { windowListeners[type] = listener; },
    removeEventListener: () => {},
    fetch: coreFetch(scenario),
  });
  if (scenario.oidcLibrary === false) delete globalThis.oidc;
  else globalThis.oidc = oidcLibrary(scenario, calls);

  return {
    document, replaced, assigned, history, cards, errors, calls, sessionStorage,
    rendersAfterLeaving: () => (rendersAtLeave === null ? 0 : renders - rendersAtLeave),
    cardActions() {
      const card = mount.querySelector('[data-module="core-oidc-auth"]') || mount.querySelector('[data-module="account-bootstrap"]');
      return card ? card.querySelectorAll("[data-action]").map((node) => node.getAttribute("data-action")) : [];
    },
    click(visualId) {
      const target = mount.querySelector('[data-visual-id="' + visualId + '"]');
      assert.ok(target, "no control " + visualId + " to click");
      for (const listener of mount.listeners.click || []) listener({ target, preventDefault() {} });
    },
    async settle() {
      for (let turn = 0; turn < 40; turn += 1) await new Promise((resolve) => setTimeout(resolve, 0));
    },
  };
}

function oidcLibrary(scenario, calls) {
  const user = scenario.session === "signed-in" ? { access_token: "stub-access-token", token_type: "Bearer", expired: false, profile: { name: "Jordan Lee" } } : null;
  return {
    WebStorageStateStore: class { constructor(options) { this.options = options; } },
    UserManager: class {
      async getUser() { return user; }
      async removeUser() { calls.removeUser += 1; }
      async signinRedirect() { calls.signinRedirect += 1; }
      async signoutRedirect() { calls.signoutRedirect += 1; }
    },
  };
}

function coreFetch(scenario) {
  let discoveryFailures = 0;
  const reply = (status, body) => Promise.resolve({ ok: status >= 200 && status < 300, status, headers: { get: () => null }, json: async () => body, text: async () => JSON.stringify(body) });
  const account = (id) => ({ id, code: "CUST-" + id, nls: { en: { NAME: "Harbourview Strata Council" } }, optimistic: 3, user: { id: 7001 }, type: { id: 5, code: "SNOW_RESIDENTIAL_CUSTOMER" }, attributes: {} });
  return (input) => {
    const url = new URL(String(input), PORTAL_ORIGIN);
    if (url.pathname === "/core/.well-known/oauth-protected-resource/") {
      if (scenario.discovery === "pending") return new Promise(() => {});
      if (scenario.discovery === "fail" || (scenario.discovery === "fail-once" && discoveryFailures++ === 0)) return reply(500, {});
      const callback = PORTAL_ORIGIN + "/core/oauth2-callback.html";
      return reply(200, { authorization_servers: [PORTAL_ORIGIN + "/oauth2"], resource: PORTAL_ORIGIN, x_client_id: "core", x_redirect_uri: callback, x_post_logout_redirect_uri: callback });
    }
    if (url.pathname === "/core/api/user/basic-info.json") {
      if (scenario.account === "session-expired") return reply(401, {});
      const organizations = scenario.account === "organization-forbidden" ? ["CALM_HARBOR_SPA_STAGING"] : ["SNOWLIMITLESS"];
      return reply(200, { authenticatedUserId: 7001, authenticatedUserName: "Jordan Lee", authorizedOrganizations: organizations.map((code, index) => ({ id: 43 + index, code })) });
    }
    if (url.pathname === "/core-acct/api/account/list.json") {
      if (scenario.account === "customer-forbidden") return reply(403, {});
      if (scenario.account === "customer-unavailable") return reply(500, {});
      if (scenario.account === "customer-not-linked") return reply(200, { resultSize: 0, result: [] });
      if (scenario.account === "customer-account-ambiguous") return reply(200, { resultSize: 2, result: [account(5001), account(5002)] });
      return reply(200, { resultSize: 1, result: [account(5001)] });
    }
    return reply(200, { resultSize: 0, result: [] });
  };
}

function createDocument() {
  class Text {
    constructor(value) { this.data = String(value); this.parentNode = null; }
    get textContent() { return this.data; }
    set textContent(value) { this.data = String(value); }
  }
  class Element {
    constructor(tag) {
      this.tagName = String(tag).toUpperCase();
      this.attributes = new Map();
      this.childNodes = [];
      this.parentNode = null;
      this.listeners = {};
      this.style = {};
      this.scrollTop = 0;
      this.scrollHeight = 0;
      this.offsetLeft = 0;
      this.offsetWidth = 0;
    }
    get firstChild() { return this.childNodes[0] || null; }
    get children() { return this.childNodes.filter((node) => node instanceof Element); }
    get className() { return this.getAttribute("class") || ""; }
    set className(value) { this.setAttribute("class", value); }
    get classList() {
      const element = this;
      const names = () => element.className.split(/\s+/).filter(Boolean);
      return {
        add(...added) { element.className = names().concat(added.filter((name) => !names().includes(name))).join(" "); },
        remove(...removed) { element.className = names().filter((name) => !removed.includes(name)).join(" "); },
        contains(name) { return names().includes(name); },
        toggle(name, force) { const on = force === undefined ? !names().includes(name) : force; if (on) this.add(name); else this.remove(name); return on; },
      };
    }
    get textContent() { return this.childNodes.map((node) => node.textContent).join(""); }
    set textContent(value) { this.replaceChildren(new Text(value)); }
    get innerText() { return this.textContent; }
    set innerHTML(value) { this.replaceChildren(new Text(value)); }
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
    insertBefore(child, reference) {
      if (!reference) return this.appendChild(child);
      if (child.parentNode) child.parentNode.removeChild(child);
      child.parentNode = this;
      this.childNodes.splice(this.childNodes.indexOf(reference), 0, child);
      return child;
    }
    removeChild(child) {
      this.childNodes = this.childNodes.filter((node) => node !== child);
      child.parentNode = null;
      return child;
    }
    remove() { if (this.parentNode) this.parentNode.removeChild(this); }
    replaceChildren(...nodes) {
      this.childNodes.forEach((node) => { node.parentNode = null; });
      this.childNodes = [];
      nodes.forEach((node) => this.appendChild(node));
    }
    contains(node) {
      for (let current = node; current; current = current.parentNode) if (current === this) return true;
      return false;
    }
    closest(selector) {
      for (let current = this; current instanceof Element; current = current.parentNode) if (matchesGroup(current, selector)) return current;
      return null;
    }
    matches(selector) { return matchesGroup(this, selector); }
    querySelectorAll(selector) {
      const found = [];
      const walk = (node) => node.children.forEach((child) => { if (matchesGroup(child, selector, this)) found.push(child); walk(child); });
      walk(this);
      return found;
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    addEventListener(type, listener) { (this.listeners[type] = this.listeners[type] || []).push(listener); }
    removeEventListener() {}
    getBoundingClientRect() { return { width: 1280, height: 800, top: 0, left: 0, right: 1280, bottom: 800 }; }
    focus() {}
    blur() {}
    scrollIntoView() {}
  }
  function matchesGroup(node, selector, scope) {
    return selector.split(",").some((part) => matchesChain(node, part.trim().split(/\s+/), scope));
  }
  function matchesChain(node, steps, scope) {
    if (!matchesCompound(node, steps[steps.length - 1])) return false;
    let current = node.parentNode;
    for (let index = steps.length - 2; index >= 0; index -= 1) {
      while (current instanceof Element && current !== scope && !matchesCompound(current, steps[index])) current = current.parentNode;
      if (!(current instanceof Element) || current === scope) return false;
      current = current.parentNode;
    }
    return true;
  }
  function matchesCompound(node, compound) {
    const parts = compound.match(/^[a-zA-Z][a-zA-Z0-9-]*|#[\w-]+|\.[\w-]+|\[[^\]]+\]/g) || [];
    return parts.length > 0 && parts.every((part) => {
      if (part[0] === ".") return node.className.split(/\s+/).includes(part.slice(1));
      if (part[0] === "#") return node.getAttribute("id") === part.slice(1);
      if (part[0] === "[") {
        const attribute = /^\[([\w-]+)(?:="([^"]*)")?\]$/.exec(part);
        return attribute[2] === undefined ? node.hasAttribute(attribute[1]) : node.getAttribute(attribute[1]) === attribute[2];
      }
      return node.tagName === part.toUpperCase();
    });
  }
  const documentListeners = {};
  const documentNode = new Element("#document");
  documentNode.documentElement = new Element("html");
  documentNode.head = new Element("head");
  documentNode.body = new Element("body");
  documentNode.createElement = (tag) => new Element(tag);
  documentNode.createElementNS = (_, tag) => new Element(tag);
  documentNode.createTextNode = (value) => new Text(value);
  documentNode.getElementById = (id) => (id === "app" ? documentNode.mount : null);
  documentNode.addEventListener = (type, listener) => { (documentListeners[type] = documentListeners[type] || []).push(listener); };
  documentNode.fire = (type) => (documentListeners[type] || []).forEach((listener) => listener({ type }));
  return documentNode;
}

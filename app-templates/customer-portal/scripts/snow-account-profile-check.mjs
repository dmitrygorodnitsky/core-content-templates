import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const dom = createDom();
globalThis.window = globalThis;
globalThis.document = dom.document;
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };

const runtimeRoot = pathToFileURL(path.resolve("app-templates/customer-portal/runtime") + "/");
const load = (file) => import(new URL(file, runtimeRoot));
const { customerAccountProfile, portalProfiles, readPortalConfig } = await load("src/config.js");
const { applyPortalConfig, state } = await load("src/state.js");
const { PortalRuntime } = await load("src/portal-runtime.js");
const { modules } = await load("src/modules/index.js");
const { coreAccountProfileContract, createCoreAccountProfileAdapter, loadCustomerAccountProfile } = await load("src/adapters/core-account-profile-adapter.js");
const { fixtureAccountProfileAdapter, fixtureAdapter } = await load("src/adapters/fixture-adapter.js");
const { accountProfileFailure, formatAccountAddress, normalizeAccountProfile } = await load("src/normalizers/account-profile.js");
const { graniteRidgeSnowFixture } = await load("data/cases/granite-ridge-snow.js");
const { AccountProfile } = await load("src/routes/AccountProfilePage.js");
const { renderRoute } = await load("src/router.js");

const ORIGIN = "https://portal.example.test";
const ACCOUNT = 7801;
const USER = 5101;
const all = (root, selector) => root.querySelectorAll(selector);
const one = (root, selector) => root.querySelector(selector);
const plain = (value) => JSON.parse(JSON.stringify(value));

const entry = (id, type, value) => ({ id, type: { id: type === "EMAIL" ? 1 : 2, code: type }, value });
const contactRow = (id, first, last, title, type, entries) => ({ id, firstName: first, lastName: last, title, type: { id: 1, code: type }, contactEntries: entries });
const typed = (id, types, address) => ({ id, types: types.map((code, index) => ({ id: index + 1, code })), address });

function accountRow(overrides = {}) {
  return Object.assign({
    id: ACCOUNT,
    nls: { en: { NAME: "Harbourview Strata Council" } },
    user: { id: USER },
    contacts: [
      contactRow(6602, "Priya", "Sandhu", "Building Manager", "SECONDARY", [entry(6621, "EMAIL", "priya.sandhu@example.test")]),
      contactRow(6601, "Jordan", "Lee", "Strata Council President", "PRIMARY", [
        entry(6611, "EMAIL", "jordan.lee@example.test"),
        entry(6612, "PHONE", "+1 604 555 0148"),
        entry(6613, "EMAIL", " jordan.lee@example.test "),
        entry(6614, "FAX", "+1 604 555 0199"),
      ]),
      contactRow(6609, "Morgan", "Hale", "Treasurer", "PRIMARY", [entry(6691, "EMAIL", "morgan.hale@example.test")]),
    ],
    addresses: [
      typed(1901, ["BILLING"], { id: 8801, address1: "133 Acceptance Way, Toronto, ON M5V 2T6" }),
      typed(1902, ["SERVICE"], { id: 8101, address1: "1200 West Pender Street", city: "Vancouver", postalCode: "V6E 2S9", state: { id: 2, code: "BC" } }),
      typed(1903, ["BILLING", "LEGAL"], { id: 8802, address1: "1200 West Pender Street", address2: "Suite 400", city: "Vancouver", postalCode: "V6E 2S9", state: { id: 2, code: "BC" } }),
      typed(1904, ["BILLING"], { id: 8803, address1: "1200 West Pender Street", address2: "Suite 400", city: "Vancouver", postalCode: "V6E 2S9", state: { id: 2, code: "BC" } }),
    ],
  }, overrides);
}

function context(overrides = {}) {
  return {
    config: Object.assign({ organization: "SNOWLIMITLESS", accountApiBase: "/core-acct", origin: ORIGIN }, overrides.config || {}),
    state: Object.assign({
      customerAccount: { id: ACCOUNT, displayName: "Harbourview Strata Council" },
      session: { accessToken: "test-token", tokenType: "Bearer", userId: USER },
    }, overrides.state || {}),
  };
}

function reply(status, body) {
  return { ok: status >= 200 && status < 300, status, async json() { if (body === undefined) throw new SyntaxError("empty"); return structuredClone(body); } };
}

{
  const requests = [];
  const fetchImpl = async (url, options) => { requests.push({ url, options }); return reply(200, { resultSize: 1, result: [accountRow()] }); };
  const raw = await createCoreAccountProfileAdapter({ fetch: fetchImpl }).load("profile", context());
  assert.equal(requests.length, 1, "the whole profile is one read of the customer Account");
  const [{ url, options }] = requests;
  assert.equal(url, ORIGIN + "/core-acct/api/account/list.json");
  assert.equal(options.method, "POST");
  assert.equal(options.credentials, "same-origin");
  assert.equal(options.headers.Authorization, "Bearer test-token");
  assert.equal(options.headers["X-Organization-Code"], "SNOWLIMITLESS");
  const body = JSON.parse(options.body);
  assert.deepEqual(body.filters, [
    { type: "INTEGER", operator: "=", property: "id", value: String(ACCOUNT) },
    { type: "INTEGER", operator: "=", property: "user.id", value: String(USER) },
  ], "the read asks Core for the resolved Account only while it is linked to the signed-in User");
  assert.equal(body.pageSize, 2);
  const names = (mappings) => mappings.map((mapping) => mapping.name);
  const byName = (mappings, name) => mappings.find((mapping) => mapping.name === name);
  assert.deepEqual(names(body.mappings), ["id", "nls", "user", "contacts", "addresses"], "no code, attribute, state or workflow is read for a profile");
  const contacts = byName(body.mappings, "contacts");
  assert.equal(contacts.type, "collection");
  assert.deepEqual(names(contacts.mappings), ["id", "firstName", "lastName", "title", "type", "contactEntries"]);
  assert.deepEqual(names(byName(contacts.mappings, "contactEntries").mappings), ["id", "value", "type"], "entry kind is not read, so the role needs no contact-entry-kind permission");
  const addresses = byName(body.mappings, "addresses");
  assert.deepEqual(names(addresses.mappings), ["id", "types", "address"]);
  assert.equal(byName(addresses.mappings, "types").type, "collection", "an AccountAddress carries its types as a collection");
  assert.deepEqual(names(byName(addresses.mappings, "address").mappings), ["id", "address1", "address2", "city", "postalCode", "state"]);
  assert.deepEqual(plain(coreAccountProfileContract.filters), ["id", "user.id"]);
  assert.equal(coreAccountProfileContract.scopeMode, "server-scoped");
  assert.equal(raw.scopeMode, "server-scoped", "every row Core returned passed the browser check");
  assert.equal(raw.account.id, ACCOUNT);
}

{
  const foreign = accountRow({ id: 9999 });
  const unlinked = accountRow({ user: { id: 42 } });
  const mixed = await loadCustomerAccountProfile(context(), async () => reply(200, { resultSize: 3, result: [foreign, unlinked, accountRow()] }));
  assert.equal(mixed.account.id, ACCOUNT);
  assert.equal(mixed.scopeMode, "browser-filtered", "a row Core should not have returned is dropped and the read says so");
  const userless = await loadCustomerAccountProfile(context(), async () => reply(200, { resultSize: 1, result: [accountRow({ user: undefined })] }));
  assert.equal(userless.account.id, ACCOUNT, "a row without its user projection still passed the server's user.id filter");

  const failure = async (fetchImpl, ctx = context()) => loadCustomerAccountProfile(ctx, fetchImpl).then(() => null, (error) => error.code);
  assert.equal(await failure(async () => reply(200, { resultSize: 0, result: [] })), "profile-unavailable", "no row for the signed-in User is not an empty profile");
  assert.equal(await failure(async () => reply(200, { resultSize: 1, result: [foreign] })), "profile-unavailable");
  assert.equal(await failure(async () => reply(401, {})), "session-expired");
  assert.equal(await failure(async () => reply(403, {})), "customer-forbidden");
  assert.equal(await failure(async () => reply(500, {})), "profile-request-failed");
  assert.equal(await failure(async () => reply(200)), "invalid-response");
  assert.equal(await failure(async () => reply(200, "unprojected")), "invalid-response");
  assert.equal(await failure(async () => { throw new Error("never"); }, context({ state: { session: { tokenType: "Bearer", userId: USER } } })), "session-required");
  assert.equal(await failure(async () => { throw new Error("never"); }, context({ state: { session: { accessToken: "t" } } })), "session-user-required");
  assert.equal(await failure(async () => { throw new Error("never"); }, context({ state: { customerAccount: null } })), "customer-unresolved", "no profile is read before the Account gate resolved");
  assert.equal(await failure(async () => { throw new Error("never"); }, context({ config: { organization: "" } })), "organization-required");
  assert.equal(await failure(async () => { throw new Error("never"); }, context({ config: { accountApiBase: "https://elsewhere.example.test/core-acct" } })), "cross-origin-service");
}

{
  const ready = normalizeAccountProfile({ account: accountRow(), scopeMode: "server-scoped" });
  assert.equal(ready.state, "ready");
  assert.equal(ready.scopeMode, "server-scoped");
  assert.equal(ready.accountName, "Harbourview Strata Council");
  assert.deepEqual(plain(ready.contact), { name: "Jordan Lee", title: "Strata Council President" }, "the PRIMARY contact with the lowest id is the primary contact; a secondary contact is never promoted");
  assert.deepEqual(plain(ready.emails), ["jordan.lee@example.test"], "entries are trimmed and a repeated value is shown once");
  assert.deepEqual(plain(ready.phones), ["+1 604 555 0148"], "only PHONE entries are phones");
  assert.deepEqual(plain(ready.billingAddresses), [
    "1200 West Pender Street, Suite 400, Vancouver, BC, V6E 2S9",
    "133 Acceptance Way, Toronto, ON M5V 2T6",
  ], "billing addresses, newest first, the same address once, a service address never");
  assert.deepEqual(plain(ready.allowedActions), [], "the profile is read-only");
  assert.equal("preferences" in ready, false, "notification preferences have no Core source, so none are modelled");

  const partial = normalizeAccountProfile({ account: accountRow({ contacts: [contactRow(1, "Jordan", "", "", "PRIMARY", [entry(2, "EMAIL", "jordan.lee@example.test")])], addresses: [] }), scopeMode: "server-scoped" });
  assert.equal(partial.state, "partial");
  assert.deepEqual(plain(partial.contact), { name: "Jordan", title: "" });
  assert.deepEqual(plain(partial.phones), []);
  assert.deepEqual(plain(partial.billingAddresses), []);

  const secondaryOnly = normalizeAccountProfile({ account: accountRow({ contacts: [contactRow(1, "Priya", "Sandhu", "", "SECONDARY", [entry(2, "PHONE", "+1 604 555 0101")])], addresses: [] }) });
  assert.equal(secondaryOnly.state, "empty", "without a PRIMARY contact nothing is shown as the primary contact");
  assert.equal(secondaryOnly.contact, null);
  assert.deepEqual(plain(secondaryOnly.phones), []);

  const bare = normalizeAccountProfile({ account: { id: ACCOUNT, code: "J63646E6-3FDB", nls: {}, contacts: null, addresses: "nope" } });
  assert.equal(bare.state, "empty");
  assert.equal(bare.accountName, "", "an Account without a name is never named by its code");
  assert.equal(bare.scopeMode, null);

  const odd = normalizeAccountProfile({ account: accountRow({ contacts: [contactRow(1, { first: "x" }, 42, null, "PRIMARY", [entry(2, "EMAIL", { value: "x" }), entry(3, "PHONE", 6045550148)])], addresses: [typed(1, ["BILLING"], { address1: "", city: null })] }), scopeMode: "unscoped" });
  assert.deepEqual(plain(odd.contact), { name: "42", title: "" }, "only strings and finite numbers become text");
  assert.deepEqual(plain(odd.emails), []);
  assert.deepEqual(plain(odd.phones), ["6045550148"]);
  assert.deepEqual(plain(odd.billingAddresses), [], "an empty address is not an address");
  assert.equal(odd.scopeMode, null, "an unscoped profile read is not a scope the profile accepts");

  assert.equal(formatAccountAddress({ address1: "1550 Wynkoop Street", address2: "Suite 400", city: "Denver", postalCode: "80202", state: { code: "CO" } }), "1550 Wynkoop Street, Suite 400, Denver, CO, 80202");
  assert.equal(formatAccountAddress(null), "");

  assert.equal(normalizeAccountProfile({ account: null }).state, "unavailable");
  assert.equal(normalizeAccountProfile(null).state, "unavailable");
  assert.equal(normalizeAccountProfile({ account: [] }).state, "unavailable");
  assert.equal(accountProfileFailure("customer-forbidden").state, "unauthorized");
  assert.equal(accountProfileFailure("profile-unavailable").state, "unavailable");
  assert.equal(accountProfileFailure("profile-request-failed").state, "error");
  assert.equal(accountProfileFailure(undefined).reasonCode, "profile-load-failed");
}

{
  assert.equal(portalProfiles.stormRetail.customerAccountProfile, true);
  for (const id of Object.keys(portalProfiles).filter((key) => key !== "stormRetail")) {
    assert.equal(customerAccountProfile({ profile: id }), false, id + " keeps its own profile screen");
  }
  const snowLive = readPortalConfig({ dataset: { portalVertical: "snow", portalProfile: "stormRetail", portalTheme: "snow", portalDataMode: "live", portalAuthMode: "required", portalOrganization: "SNOWLIMITLESS" } });
  const snowFixture = readPortalConfig({ dataset: { portalVertical: "snow", portalProfile: "stormRetail", portalTheme: "snow", portalCase: "granite-ridge-snow" } });
  const spaLive = readPortalConfig({ dataset: { portalVertical: "beauty", portalProfile: "spaTarget", portalTheme: "beauty", portalDataMode: "live", portalAuthMode: "required" } });
  const stormOps = readPortalConfig({ dataset: { portalVertical: "lawn", portalProfile: "stormOps", portalTheme: "lawn" } });
  const adapterOf = (config) => modules.profile.adapter({ config, state });
  assert.equal(typeof adapterOf(snowLive).load, "function");
  assert.equal(adapterOf(snowLive).save, undefined, "the live snow profile adapter opens no write");
  assert.equal(adapterOf(snowFixture), fixtureAccountProfileAdapter, "fixture mode reads the demonstration Account through the same normalizer");
  assert.equal(typeof adapterOf(spaLive).save, "function", "the spa keeps its User email profile");
  assert.equal(adapterOf(stormOps), fixtureAdapter, "other storm verticals keep the generic fixture profile");
  assert.equal(modules.profile.failureEnvelope({ config: snowLive, state }, { code: "customer-forbidden" }).state, "unauthorized");
  assert.equal(modules.profile.failureEnvelope({ config: snowLive, state }, { code: "profile-unavailable" }).state, "unavailable");
  assert.deepEqual(plain(modules.profile.failureEnvelope({ config: spaLive, state }, { code: "customer-forbidden" })), { state: "unauthorized", email: "", phone: null, prefs: {}, allowedActions: [] }, "the spa failure envelope is unchanged");
}

{
  const account = graniteRidgeSnowFixture.customerAccount;
  const quoteClient = graniteRidgeSnowFixture.proposals.orders[0].attributes[5].CLIENT.value;
  assert.equal(account.id, quoteClient, "the demonstration profile is the Account the demonstration quotes belong to");
  const serialized = JSON.stringify(account);
  for (const email of serialized.match(/[\w.+-]+@[\w.-]+/g)) assert.match(email, /@example\.test$/, "fixture e-mail addresses stay on the reserved test domain");
  for (const phone of serialized.match(/\+1 \(\d{3}\) \d{3}-\d{4}/g)) assert.match(phone, /\) 555-01\d\d$/, "fixture phone numbers stay in the fictional 555-01xx range");
  applyPortalConfig(readPortalConfig({ dataset: { portalVertical: "snow", portalProfile: "stormRetail", portalTheme: "snow", portalDataMode: "fixture", portalAuthMode: "fixture", portalCase: "granite-ridge-snow", portalEnabledModules: "overview,properties,profile" } }));
  delete state.moduleData.profile;
  delete state.moduleStatus.profile;
  const runtime = new PortalRuntime({ state });
  await runtime.loadAsync("profile");
  const envelope = state.moduleData.profile;
  assert.equal(envelope.state, "ready");
  assert.equal(envelope.accountName, "Whitlock Property Group");
  assert.deepEqual(plain(envelope.contact), { name: "Dana Whitlock", title: "Portfolio Manager" });
  assert.deepEqual(plain(envelope.emails), ["dana.whitlock@example.test"]);
  assert.deepEqual(plain(envelope.phones), ["+1 (303) 555-0164"]);
  assert.deepEqual(plain(envelope.billingAddresses), ["1550 Wynkoop Street, Suite 400, Denver, CO, 80202"], "the service address of a property is not a billing address");
  state.route = "profile";
  const routed = renderRoute();
  assert.equal(routed.getAttribute("data-visual-id"), "profile");
  assert.equal(all(routed, "[data-module=\"profile-facts\"]").length, 1, "stormRetail renders the customer Account profile, not the generic one");
  assert.equal(all(routed, "[data-module=\"order-list\"], [data-module=\"payment-method-card\"], [data-module=\"preferences\"]").length, 0);
  assert.doesNotMatch(routed.textContent, /Manage plan|Order history|Saved addresses|Payment methods|Add card|Add address/, "no order history, saved places, payment or plan on the snow profile");

  applyPortalConfig(readPortalConfig({ dataset: { portalVertical: "lawn", portalProfile: "stormOps", portalTheme: "lawn" } }));
  state.route = "profile";
  assert.match(renderRoute().textContent, /Manage plan/, "another storm vertical keeps the generic profile page");
}

function renderWith(envelope, status) {
  applyPortalConfig(readPortalConfig({ dataset: { portalVertical: "snow", portalProfile: "stormRetail", portalTheme: "snow", portalDataMode: "live", portalAuthMode: "required", portalOrganization: "SNOWLIMITLESS", portalDefaultRoute: "overview" } }));
  if (envelope === undefined) delete state.moduleData.profile;
  else state.moduleData.profile = envelope;
  state.moduleStatus.profile = status || (envelope && envelope.state) || "loading";
  return AccountProfile();
}

{
  const expectations = [
    ["ready", normalizeAccountProfile({ account: accountRow(), scopeMode: "server-scoped" })],
    ["partial", normalizeAccountProfile({ account: accountRow({ contacts: [contactRow(1, "Jordan", "Lee", "", "PRIMARY", [entry(2, "EMAIL", "jordan.lee@example.test")])], addresses: [] }) })],
    ["empty", normalizeAccountProfile({ account: accountRow({ contacts: [], addresses: [] }) })],
    ["loading", undefined],
    ["error", accountProfileFailure("profile-request-failed")],
    ["unauthorized", accountProfileFailure("customer-forbidden")],
    ["unavailable", accountProfileFailure("profile-unavailable")],
  ];
  for (const [view, envelope] of expectations) {
    const page = renderWith(envelope);
    assert.equal(page.getAttribute("data-state"), view);
    const signOut = one(page, "[data-visual-id=\"sign-out\"]");
    assert.equal(signOut.tagName, "BUTTON", view + ": Sign out is a real button");
    assert.equal(signOut.getAttribute("data-action"), "auth.signOut", view + ": Sign out is always on the profile page");
    assert.deepEqual(all(page, "[data-action]").map((node) => node.getAttribute("data-action")).filter((action) => !["auth.signOut", "ui.retry", "nav.go"].includes(action)), [], view + ": no edit, save, toggle or support action");
    assert.equal(all(page, "input, textarea, select, .toggle").length, 0, view + ": no edit control");
    assert.doesNotMatch(page.textContent, /7801|5101|CUSTOMER-|test-token/, view + ": no Account id, User id, code or token reaches the page");
  }

  const ready = renderWith(expectations[0][1]);
  assert.equal(one(ready, ".prop-head__title").textContent, "Harbourview Strata Council");
  const facts = all(ready, "[data-fact]").map((fact) => [fact.getAttribute("data-fact"), fact.getAttribute("data-state"), all(fact, ".prop-fact__value").map((node) => node.textContent), (one(fact, ".prop-fact__note") || { textContent: "" }).textContent]);
  assert.deepEqual(facts, [
    ["contact", "ready", ["Jordan Lee"], "Strata Council President"],
    ["email", "ready", ["jordan.lee@example.test"], ""],
    ["phone", "ready", ["+1 604 555 0148"], ""],
    ["billing", "ready", ["1200 West Pender Street, Suite 400, Vancouver, BC, V6E 2S9", "133 Acceptance Way, Toronto, ON M5V 2T6"], ""],
  ]);
  assert.equal(one(one(ready, "[data-fact=\"billing\"]"), ".prop-fact__label").textContent, "Billing addresses", "two billing addresses on file are both shown and labelled as such");

  const partial = renderWith(expectations[1][1]);
  assert.deepEqual(all(partial, "[data-fact][data-state=\"missing\"]").map((fact) => [fact.getAttribute("data-fact"), one(fact, ".prop-fact__note").textContent]), [["phone", "Not on file"], ["billing", "Not on file"]]);
  assert.equal(one(one(partial, "[data-fact=\"billing\"]"), ".prop-fact__label").textContent, "Billing address");

  const empty = renderWith(expectations[2][1]);
  assert.equal(one(empty, "[data-module=\"empty-state\"] .state-block__title").textContent, "No contact details on file");
  assert.equal(all(empty, "[data-module=\"profile-facts\"]").length, 0);

  const loading = renderWith(undefined);
  assert.equal(one(loading, "[data-module=\"profile-loading\"]").getAttribute("aria-busy"), "true");
  const reloading = renderWith(expectations[0][1], "loading");
  assert.equal(reloading.getAttribute("data-state"), "loading", "a reload shows the loading state rather than the details it is replacing");

  const failed = renderWith(expectations[4][1]);
  assert.equal(one(failed, "[data-module=\"error-state\"] .state-block__title").textContent, "Couldn’t load your account details");
  assert.equal(one(failed, "[data-visual-id=\"retry\"]").getAttribute("data-action"), "ui.retry");

  const denied = renderWith(expectations[5][1]);
  assert.match(one(denied, "[data-module=\"unauthorized-state\"]").textContent, /doesn’t include access to your account details/);
  assert.equal(all(denied, "[data-action=\"support.email\"]").length, 0, "no support action that is not connected");

  const unavailable = renderWith(expectations[6][1]);
  assert.equal(one(unavailable, "[data-module=\"empty-state\"]").getAttribute("data-state"), "unavailable");
  assert.match(unavailable.textContent, /Your account details aren’t available/);
}

{
  const source = fs.readFileSync(path.resolve("app-templates/customer-portal/runtime/src/routes/AccountProfilePage.js"), "utf8")
    + fs.readFileSync(path.resolve("app-templates/customer-portal/runtime/src/adapters/core-account-profile-adapter.js"), "utf8")
    + fs.readFileSync(path.resolve("app-templates/customer-portal/runtime/src/normalizers/account-profile.js"), "utf8");
  assert.doesNotMatch(source, /save\.json|send-event|PATCH|innerHTML|kind"/, "the snow profile reads and renders; it writes nothing and injects no markup");
}

console.log("snow-account-profile-check ok: the snow profile is one server-scoped read of the resolved customer Account filtered by id and the signed-in User, with contacts, entries and typed addresses projected and no entry kind, a row outside the session dropped and named browser-filtered, every Core failure mapped, a normalizer that shows the PRIMARY contact, its e-mail and phone and the billing addresses newest first without codes, preferences or invented values, fixture data read through the same normalizer, stormRetail routed to it while every other profile keeps its page, and ready, partial, empty, loading, error, unauthorized and unavailable states with Sign out always present and no edit control");

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
      const alternatives = selector.split(",").map((part) => part.trim());
      if (alternatives.length > 1) {
        const found = [];
        alternatives.forEach((alternative) => this.querySelectorAll(alternative).forEach((node) => { if (!found.includes(node)) found.push(node); }));
        return found;
      }
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

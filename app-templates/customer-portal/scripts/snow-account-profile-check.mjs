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
const { TopNav } = await load("src/components/shell/TopNav.js");
const { AccountProfile } = await load("src/routes/AccountProfilePage.js");
const { renderRoute } = await load("src/router.js");
const { LOGIN_FORM, PROFILE_FORM, createCoreProfileFormAdapter } = await load("src/adapters/core-profile-form-adapter.js");
const { PROFILE_EDIT_ROWS, cancelProfileEdit, changeProfileDraft, profileEditRequest, profileEditing, saveProfileEdit, startProfileEdit, validateProfileValue } = await load("src/profile-edit.js");

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
      contactRow(6601, "Jordan", "Lee", "Strata Council President", "LEGAL", [
        entry(6611, "EMAIL", "jordan.lee@example.test"),
        entry(6612, "PHONE", "+1 604 555 0148"),
        entry(6613, "EMAIL", " jordan.lee@example.test "),
        entry(6614, "FAX", "+1 604 555 0199"),
      ]),
      contactRow(6609, "Morgan", "Hale", "Treasurer", "LEGAL", [entry(6691, "EMAIL", "morgan.hale@example.test")]),
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
    config: Object.assign({ vertical: "snow", organization: "SNOWLIMITLESS", accountApiBase: "/core-acct", origin: ORIGIN }, overrides.config || {}),
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
  assert.equal(url, ORIGIN + "/core-acct/api/tagged/account/list.json");
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
  assert.deepEqual(names(byName(addresses.mappings, "address").mappings), ["id", "address1", "address2", "city", "postalCode", "state", "country"], "the country is read so a billing address can name it");
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
  await assert.rejects(() => loadCustomerAccountProfile(context(), async () => reply(200, { resultSize: 1, result: [accountRow({ user: undefined })] })), { code: "profile-unavailable" }, "Snow must verify the Account.user projection even when tags authorized the Account");

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
  assert.deepEqual(plain(ready.contact), { name: "Jordan Lee", firstName: "Jordan", title: "Strata Council President" }, "the LEGAL contact with the lowest id is the primary contact; a secondary contact is never promoted");
  assert.deepEqual(plain(ready.emails), ["jordan.lee@example.test"], "entries are trimmed and a repeated value is shown once");
  assert.deepEqual(plain(ready.phones), ["+1 604-555-0148"], "only PHONE entries are phones, and a North American number is shown as +1 NNN-NNN-NNNN");
  assert.deepEqual(plain(ready.billingAddresses), [
    "1200 West Pender Street, Suite 400, Vancouver, BC V6E 2S9",
    "133 Acceptance Way, Toronto, ON M5V 2T6",
  ], "billing addresses, newest first, the same address once, a service address never");
  assert.deepEqual(plain(ready.allowedActions), [], "the Account read grants no record action; a change goes through a form");
  assert.deepEqual(plain(ready.editable), { firstName: "Jordan", lastName: "Lee", email: "jordan.lee@example.test", phone: "+1 604-555-0148", billingAddress: "133 Acceptance Way, Toronto, ON M5V 2T6" }, "an edit starts from the LEGAL contact's names, its oldest EMAIL and PHONE entries and the oldest BILLING link: the ones the server changes");
  assert.equal("preferences" in ready, false, "notification preferences have no Core source, so none are modelled");

  const partial = normalizeAccountProfile({ account: accountRow({ contacts: [contactRow(1, "Jordan", "", "", "LEGAL", [entry(2, "EMAIL", "jordan.lee@example.test")])], addresses: [] }), scopeMode: "server-scoped" });
  assert.equal(partial.state, "partial");
  assert.deepEqual(plain(partial.contact), { name: "Jordan", firstName: "Jordan", title: "" });
  assert.deepEqual(plain(partial.phones), []);
  assert.deepEqual(plain(partial.billingAddresses), []);

  const secondaryOnly = normalizeAccountProfile({ account: accountRow({ contacts: [contactRow(1, "Priya", "Sandhu", "", "SECONDARY", [entry(2, "PHONE", "+1 604 555 0101")])], addresses: [] }) });
  assert.equal(secondaryOnly.state, "empty", "without a LEGAL contact nothing is shown as the primary contact");
  assert.equal(secondaryOnly.contact, null);
  assert.deepEqual(plain(secondaryOnly.phones), []);

  const bare = normalizeAccountProfile({ account: { id: ACCOUNT, code: "J63646E6-3FDB", nls: {}, contacts: null, addresses: "nope" } });
  assert.equal(bare.state, "empty");
  assert.equal(bare.accountName, "", "an Account without a name is never named by its code");
  assert.equal(bare.scopeMode, null);

  const odd = normalizeAccountProfile({ account: accountRow({ contacts: [contactRow(1, { first: "x" }, 42, null, "LEGAL", [entry(2, "EMAIL", { value: "x" }), entry(3, "PHONE", 6045550148)])], addresses: [typed(1, ["BILLING"], { address1: "", city: null })] }), scopeMode: "unscoped" });
  assert.deepEqual(plain(odd.contact), { name: "42", firstName: "", title: "" }, "only strings and finite numbers become text");
  assert.deepEqual(plain(odd.emails), []);
  assert.deepEqual(plain(odd.phones), ["6045550148"], "a number without a +1 country code is left as stored");
  assert.deepEqual(plain(odd.billingAddresses), [], "an empty address is not an address");
  assert.equal(odd.scopeMode, null, "an unscoped profile read is not a scope the profile accepts");

  assert.equal(formatAccountAddress({ address1: "1550 Wynkoop Street", address2: "Suite 400", city: "Denver", postalCode: "80202", state: { code: "CO" } }), "1550 Wynkoop Street, Suite 400, Denver, CO 80202");
  assert.equal(formatAccountAddress({ address1: "1239 W Georgia St, Vancouver, BC, V6E 4R8, CA", postalCode: "V6E 4R8" }), "1239 W Georgia St, Vancouver, BC V6E 4R8, Canada", "a billing address stored as one line keeps its postal code once and names its country");
  assert.equal(formatAccountAddress({ address1: "1239 W Georgia St", city: "Vancouver", postalCode: "V6E 4R8", state: { code: "BC" }, country: { id: "CA", code: "CA" } }), "1239 W Georgia St, Vancouver, BC V6E 4R8, Canada", "a structured address reads like the property address");
  assert.equal(formatAccountAddress({ address1: "1 Main St", city: "Los Angeles", postalCode: "90210", state: { code: "CA" } }), "1 Main St, Los Angeles, CA 90210", "a region code is never mistaken for a country");
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
  assert.deepEqual(plain(envelope.contact), { name: "Dana Whitlock", firstName: "Dana", title: "Portfolio Manager" });
  assert.deepEqual(plain(envelope.emails), ["dana.whitlock@example.test"]);
  assert.deepEqual(plain(envelope.phones), ["+1 303-555-0164"]);
  assert.deepEqual(plain(envelope.billingAddresses), ["1550 Wynkoop Street, Suite 400, Denver, CO 80202"], "the service address of a property is not a billing address");
  state.route = "profile";
  const routed = renderRoute();
  assert.equal(routed.getAttribute("data-visual-id"), "profile");
  assert.equal(all(routed, "[data-module=\"profile-facts\"]").length, 1, "stormRetail renders the customer Account profile, not the generic one");
  assert.equal(profileEditing(state.config), false, "a fixture portal has no Core to submit to");
  assert.equal(all(routed, "[data-action=\"profileEdit.start\"], [data-module=\"profile-sign-in\"], input").length, 0, "so its profile stays read-only");
  assert.equal(all(routed, "[data-module=\"order-list\"], [data-module=\"payment-method-card\"], [data-module=\"preferences\"]").length, 0);
  assert.doesNotMatch(routed.textContent, /Manage plan|Order history|Saved addresses|Payment methods|Add card|Add address/, "no order history, saved places, payment or plan on the snow profile");

  applyPortalConfig(readPortalConfig({ dataset: { portalVertical: "lawn", portalProfile: "stormOps", portalTheme: "lawn" } }));
  state.route = "profile";
  assert.match(renderRoute().textContent, /Manage plan/, "another storm vertical keeps the generic profile page");
}

function renderWith(envelope, status) {
  applyPortalConfig(readPortalConfig({ dataset: { portalVertical: "snow", portalProfile: "stormRetail", portalTheme: "snow", portalDataMode: "live", portalAuthMode: "required", portalOrganization: "SNOWLIMITLESS", portalDefaultRoute: "overview" } }));
  state.profileEdit = null;
  state.profileSaved = null;
  state.profileLoginChanged = null;
  state.session.login = "jordan.lee@example.test";
  if (envelope === undefined) delete state.moduleData.profile;
  else state.moduleData.profile = envelope;
  state.moduleStatus.profile = status || (envelope && envelope.state) || "loading";
  return AccountProfile();
}

{
  const expectations = [
    ["ready", normalizeAccountProfile({ account: accountRow(), scopeMode: "server-scoped" })],
    ["partial", normalizeAccountProfile({ account: accountRow({ contacts: [contactRow(1, "Jordan", "Lee", "", "LEGAL", [entry(2, "EMAIL", "jordan.lee@example.test")])], addresses: [] }) })],
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
    const editable = ["ready", "partial", "empty"].includes(view);
    assert.deepEqual(all(page, "[data-action]").map((node) => node.getAttribute("data-action")).filter((action) => !["auth.signOut", "ui.retry", "nav.go"].includes(action)), editable ? ["profileEdit.start", "profileEdit.start", "profileEdit.start", "profileEdit.start", "profileEdit.start"] : [], view + ": an Account on screen offers only an Edit or Add on each detail; no save, toggle or support action");
    assert.equal(all(page, "input, textarea, select, .toggle").length, 0, view + ": no edit control until Edit is chosen");
    assert.doesNotMatch(page.textContent, /7801|5101|CUSTOMER-|test-token/, view + ": no Account id, User id, code or token reaches the page");
  }

  const ready = renderWith(expectations[0][1]);
  assert.equal(one(ready, ".prop-head__title").textContent, "Harbourview Strata Council");
  const facts = all(ready, "[data-fact]").map((fact) => [fact.getAttribute("data-fact"), fact.getAttribute("data-state"), all(fact, ".prop-fact__value").map((node) => node.textContent), (one(fact, ".prop-fact__note") || { textContent: "" }).textContent, one(fact, "[data-action=\"profileEdit.start\"]").textContent]);
  assert.deepEqual(facts, [
    ["contact", "ready", ["Jordan Lee"], "Strata Council President", "Edit"],
    ["email", "ready", ["jordan.lee@example.test"], "", "Edit"],
    ["phone", "ready", ["+1 604-555-0148"], "", "Edit"],
    ["billing", "ready", ["1200 West Pender Street, Suite 400, Vancouver, BC V6E 2S9", "133 Acceptance Way, Toronto, ON M5V 2T6"], "", "Edit"],
    ["login", "ready", ["jordan.lee@example.test"], "The email you sign in to this portal with. Changing it does not change your contact email.", "Edit"],
  ]);
  assert.deepEqual(all(ready, "[data-action=\"profileEdit.start\"]").map((node) => node.getAttribute("data-id")), ["contact", "email", "phone", "billing", "login"]);
  assert.equal(all(one(ready, "[data-module=\"profile-facts\"]"), "[data-fact=\"login\"]").length, 0, "the sign-in is not one of the contact details");
  assert.equal(all(one(ready, "[data-module=\"profile-sign-in\"]"), "[data-fact]").length, 1, "the sign-in has its own card with its own Edit");
  assert.equal(one(one(ready, "[data-fact=\"contact\"]"), ".prop-fact__label").textContent, "Name", "the LEGAL contact's name is the editable Name");
  assert.equal(one(one(ready, "[data-fact=\"billing\"]"), ".prop-fact__label").textContent, "Billing addresses", "two billing addresses on file are both shown and labelled as such");

  const partial = renderWith(expectations[1][1]);
  assert.deepEqual(all(partial, "[data-fact]").map((fact) => [fact.getAttribute("data-fact"), fact.getAttribute("data-state"), all(fact, ".prop-fact__value").length, one(fact, "[data-action]").textContent]), [
    ["contact", "ready", 1, "Edit"], ["email", "ready", 1, "Edit"], ["phone", "missing", 0, "Add"], ["billing", "missing", 0, "Add"], ["login", "ready", 1, "Edit"],
  ], "a detail that is not on file offers Add and shows no value");
  assert.doesNotMatch(partial.textContent, /Not on file/);

  const bilbo = renderWith(normalizeAccountProfile({
    account: accountRow({
      nls: { en: { NAME: "Bilbo Baggins" } },
      contacts: [contactRow(731, "Bilbo", "Baggins", "", "LEGAL", [entry(959, "EMAIL", "bilbo@example.test"), entry(960, "PHONE", "+19991112233")])],
      addresses: [typed(767, ["BILLING"], { id: 742, address1: "1239 W Georgia St, Vancouver, BC, V6E 4R8, CA", postalCode: "V6E 4R8" })],
    }),
    scopeMode: "server-scoped",
  }));
  assert.equal(one(bilbo, ".prop-head__title").textContent, "Bilbo Baggins");
  assert.deepEqual(all(bilbo, "[data-fact]").map((fact) => [fact.getAttribute("data-fact"), all(fact, ".prop-fact__value").map((node) => node.textContent).join("|")]), [
    ["contact", "Bilbo Baggins"],
    ["email", "bilbo@example.test"],
    ["phone", "+1 999-111-2233"],
    ["billing", "1239 W Georgia St, Vancouver, BC V6E 4R8, Canada"],
    ["login", "jordan.lee@example.test"],
  ], "the contact's name is shown even when it is the account's name, so it can be edited");
  assert.doesNotMatch(bilbo.textContent, /Primary contact|V6E 4R8, CA|, CA,/);
  assert.equal(one(one(bilbo, "[data-fact=\"billing\"]"), ".prop-fact__label").textContent, "Billing address");

  const empty = renderWith(expectations[2][1]);
  assert.deepEqual(all(one(empty, "[data-module=\"profile-facts\"]"), "[data-action]").map((node) => node.textContent), ["Add", "Add", "Add", "Add"], "an Account with no contact details offers to add each of them");
  assert.equal(all(empty, "[data-module=\"empty-state\"]").length, 0);

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
  applyPortalConfig(readPortalConfig({ dataset: { portalVertical: "snow", portalProfile: "stormRetail", portalTheme: "snow", portalDataMode: "live", portalAuthMode: "required", portalOrganization: "SNOWLIMITLESS", portalEnabledModules: "overview,properties,proposals,profile" } }));
  state.moduleData.profile = normalizeAccountProfile({ account: accountRow({ nls: { en: { NAME: "Bilbo Baggins" } }, contacts: [contactRow(731, "Bilbo", "Baggins", "", "LEGAL", [])] }) });
  const nav = TopNav(false);
  assert.equal(one(nav, "[data-module=\"profile-avatar\"]").textContent, "BB", "the avatar carries the contact's initials instead of an empty circle");
  assert.equal(all(nav, "[data-module=\"activity-control\"]").length, 0, "no notification bell when the portal has no notifications");
  state.moduleData.profile = normalizeAccountProfile({ account: accountRow({ nls: { en: { NAME: "01953720 B.C. Ltd" } }, contacts: [] }) });
  assert.equal(one(TopNav(false), "[data-module=\"profile-avatar\"]").textContent, "BL", "initials skip words that do not start with a letter");
  delete state.moduleData.profile;
  assert.equal(one(TopNav(false), "[data-module=\"profile-avatar\"]").textContent, "", "before the profile loads the avatar stays empty rather than guessing");
}

{
  const refusedAs = (code, raw, message, current) => assert.equal(validateProfileValue(code, raw, current).error, message, code + " " + JSON.stringify(raw));
  refusedAs("FIRST_NAME", "   ", "Enter your first name.");
  refusedAs("LAST_NAME", "B".repeat(33), "Use 32 characters or fewer.");
  refusedAs("FIRST_NAME", "Bil\u0000bo", "Use letters, spaces and punctuation only.");
  for (const email of ["bilbo", "bilbo@example", "bil bo@example.com", "bilbo@@example.com"]) refusedAs("EMAIL", email, "Enter a valid email address, like name@example.com.");
  refusedAs("EMAIL", " ", "Enter your email address.");
  for (const phone of ["12345", "+1 604 555 0199 ext 4", "1234567890123456"]) refusedAs("PHONE", phone, "Enter a valid phone number with its area code.");
  refusedAs("BILLING_ADDRESS", "Bagshot Row, Hobbiton", "Enter the full street address, including the building number.");
  refusedAs("BILLING_ADDRESS", "1 " + "a".repeat(254), "Use 255 characters or fewer.");
  refusedAs("LOGIN", "Jordan.Lee@Example.test", "This is already the email you sign in with.", "jordan.lee@example.test");
  refusedAs("LOGIN", "", "Enter the email you want to sign in with.");
  assert.deepEqual(plain(validateProfileValue("FIRST_NAME", "  Bilbo   Took ")), { error: null, value: "Bilbo Took" });
  assert.deepEqual(plain(validateProfileValue("EMAIL", " Bilbo.Baggins@Example.COM ")), { error: null, value: "bilbo.baggins@example.com" }, "the browser checks with the server's rules and messages before anything is sent");

  const initial = { firstName: "Jordan", lastName: "Lee" };
  assert.deepEqual(plain(profileEditRequest("contact", initial, { firstName: " Jordan ", lastName: "Lee-Smith" })), { errors: {}, values: { FIELDS: ["LAST_NAME"], LAST_NAME: "Lee-Smith" } }, "only a field whose value changed is named in FIELDS and sent; an untouched first name is not sent at all");
  assert.deepEqual(plain(profileEditRequest("contact", initial, { firstName: "Jordan", lastName: " Lee " })), { errors: {}, values: null }, "an unchanged row sends nothing");
  assert.deepEqual(plain(profileEditRequest("phone", { phone: "+1 604-555-0148" }, { phone: "604 555 0199" })), { errors: {}, values: { FIELDS: ["PHONE"], PHONE: "604 555 0199" } });
  assert.deepEqual(plain(profileEditRequest("email", { email: "jordan.lee@example.test" }, { email: "nope" })), { errors: { EMAIL: "Enter a valid email address, like name@example.com." }, values: null });
  assert.deepEqual(plain(profileEditRequest("login", { login: "jordan.lee@example.test" }, { login: " New.Login@Example.test " })), { errors: {}, values: { LOGIN: "new.login@example.test" } }, "the sign-in form carries only the new login");
  assert.deepEqual(plain(profileEditRequest("login", { login: "jordan.lee@example.test" }, { login: "jordan.lee@example.test" })), { errors: { LOGIN: "This is already the email you sign in with." }, values: null }, "an unchanged sign-in is refused, not silently dropped");
  assert.equal(PROFILE_EDIT_ROWS.login.form, LOGIN_FORM);
  for (const row of ["contact", "email", "phone", "billing"]) assert.equal(PROFILE_EDIT_ROWS[row].form, PROFILE_FORM, row + " goes through the profile form");
  assert.deepEqual(plain(PROFILE_FORM), { typeCode: "CUSTOMER_PROFILE_UPDATE", preference: "SNOW_CUSTOMER_PROFILE_UPDATE" });
  assert.deepEqual(plain(LOGIN_FORM), { typeCode: "CUSTOMER_LOGIN_CHANGE", preference: "SNOW_CUSTOMER_LOGIN_CHANGE" });
}

{
  const calls = [];
  let polls = 0;
  const outcome = (form, extra) => JSON.stringify(Object.assign({ form, outcome: "APPLIED", field: null, message: "Saved.", changed: ["PHONE"] }, extra));
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith("/form-type/CUSTOMER_PROFILE_UPDATE/get.json")) return reply(200, { id: 8, code: "CUSTOMER_PROFILE_UPDATE" });
    if (url.endsWith("/api/form/submit.json")) return reply(200, 631);
    if (url.endsWith("/api/user/preferences.json")) {
      polls += 1;
      if (polls === 1) return reply(200, {});
      if (polls === 2) return reply(200, { SNOW_CUSTOMER_PROFILE_UPDATE: outcome(630) });
      return reply(200, { SNOW_CUSTOMER_PROFILE_UPDATE: outcome(631, { outcome: "REFUSED", field: "PHONE", message: "Enter a valid phone number with its area code.", changed: [] }), SNOW_CUSTOMER_LOGIN_CHANGE: outcome(631) });
    }
    throw new Error("unexpected request " + url);
  };
  const forms = createCoreProfileFormAdapter({ fetch: fetchImpl, wait: async () => {}, now: () => 0 });
  const ctx = { config: { vertical: "snow", organization: "SNOWLIMITLESS", origin: ORIGIN }, state: { session: { accessToken: "test-token", tokenType: "Bearer", organizationId: 43 } } };
  assert.equal(await forms.submit(PROFILE_FORM, { FIELDS: ["PHONE"], PHONE: "604 555 0199" }, ctx), 631);
  assert.equal(calls[0].url, ORIGIN + "/en/core-cms/api/form-type/CUSTOMER_PROFILE_UPDATE/get.json", "the form type is found by its code, as the public form finds it");
  assert.equal(calls[0].options.headers.Authorization, undefined);
  assert.equal(calls[1].url, ORIGIN + "/core-cms/api/form/submit.json");
  assert.equal(calls[1].options.method, "POST");
  assert.equal(calls[1].options.headers.Authorization, "Bearer test-token", "the form is submitted with the session, so Core sets Form.user to the signed-in User");
  assert.equal(calls[1].options.headers["X-Organization-Code"], "SNOWLIMITLESS");
  assert.deepEqual(JSON.parse(calls[1].options.body), { type: { id: 8 }, organization: { id: 43 }, attributes: { 8: { FIELDS: { value: ["PHONE"] }, PHONE: { value: "604 555 0199" } } }, metadata: { language: "en" } }, "only the changed field and FIELDS are submitted; no Account, User or contact id");
  const result = await forms.outcome(PROFILE_FORM, 631, ctx);
  assert.deepEqual(plain(result), { outcome: "REFUSED", field: "PHONE", message: "Enter a valid phone number with its area code.", changed: [] }, "the outcome is the one reported for this form in the profile preference");
  assert.equal(polls, 3, "no report yet and a report for an earlier form are both waited past");
  assert.ok(calls.slice(2).every(({ url, options }) => url === ORIGIN + "/core/api/user/preferences.json" && options.method === "GET" && options.headers.Authorization === "Bearer test-token"), "the outcome is read from the signed-in User's own preferences");
  await forms.submit(PROFILE_FORM, { FIELDS: ["EMAIL"], EMAIL: "a@example.test" }, ctx);
  assert.equal(calls.filter(({ url }) => url.includes("/form-type/")).length, 1, "the form type id is read once");

  let clock = 0;
  const silent = createCoreProfileFormAdapter({ fetch: async () => reply(200, {}), wait: async () => { clock += 1000; }, now: () => clock, timeoutMs: 5000 });
  await assert.rejects(() => silent.outcome(PROFILE_FORM, 9, ctx), { code: "outcome-unknown" }, "no report in time is an unknown outcome, never a success");
  const expired = createCoreProfileFormAdapter({ fetch: async () => reply(401, {}), wait: async () => {} });
  await assert.rejects(() => expired.outcome(LOGIN_FORM, 9, ctx), { code: "session-expired" });
  await assert.rejects(() => forms.submit(PROFILE_FORM, { FIELDS: ["PHONE"], PHONE: "1" }, { config: ctx.config, state: { session: { accessToken: "t" } } }), { code: "organization-required" }, "no form is sent without the organization the User is signed in to");
}

{
  const before = normalizeAccountProfile({ account: accountRow(), scopeMode: "server-scoped" });
  const after = normalizeAccountProfile({ account: accountRow({ contacts: [contactRow(6601, "Jordan", "Lee", "Strata Council President", "LEGAL", [entry(6611, "EMAIL", "jordan.lee@example.test"), entry(6612, "PHONE", "+16045550199")])] }), scopeMode: "server-scoped" });
  const fake = () => {
    const forms = { submits: [], next: null, error: null, gate: null };
    forms.submit = async (form, values) => { forms.submits.push([form.typeCode, plain(values)]); return 700 + forms.submits.length; };
    forms.outcome = async () => { if (forms.gate) await forms.gate; if (forms.error) throw forms.error; return forms.next; };
    return forms;
  };
  const coded = (code) => Object.assign(new Error(code), { code });
  const row = (page, key) => one(page, "[data-fact=\"" + key + "\"]");
  const phases = [];
  const reloads = [];
  const options = (forms, onSaving) => ({ forms, reload: async (id) => { reloads.push(id); state.moduleData.profile = after; }, onChange: (phase) => { phases.push(phase); if (phase === "saving" && onSaving) onSaving(AccountProfile()); } });

  renderWith(before);
  assert.equal(startProfileEdit("phone"), true);
  let page = AccountProfile();
  const input = one(row(page, "phone"), "[data-profile-input=\"PHONE\"]");
  assert.equal(row(page, "phone").getAttribute("data-state"), "editing", "Edit turns the row itself into an editor, in place");
  assert.equal(input.getAttribute("value"), "+1 604-555-0148");
  assert.equal(input.getAttribute("type"), "tel");
  assert.deepEqual(all(row(page, "phone"), "[data-action]").map((node) => node.getAttribute("data-action")), ["profileEdit.save", "profileEdit.cancel"]);
  assert.equal(all(page, "input").length, 1, "only the chosen row is edited");

  const forms = fake();
  changeProfileDraft("phone", "12");
  assert.equal(await saveProfileEdit(options(forms)), false);
  assert.deepEqual(phases, ["invalid"]);
  assert.equal(forms.submits.length, 0, "an invalid value is caught in the browser and nothing is sent");
  page = AccountProfile();
  assert.equal(one(row(page, "phone"), ".field-error").textContent, "Enter a valid phone number with its area code.");
  assert.equal(one(row(page, "phone"), "input").getAttribute("aria-invalid"), "true");
  assert.equal(one(row(page, "phone"), "input").getAttribute("aria-describedby"), one(row(page, "phone"), ".field-error").getAttribute("id"));

  changeProfileDraft("phone", "604 555 0199");
  forms.next = { outcome: "APPLIED", field: null, message: "Saved.", changed: ["PHONE"] };
  let release;
  forms.gate = new Promise((resolve) => { release = resolve; });
  let savingPage = null;
  const saving = saveProfileEdit(options(forms, (snapshot) => { savingPage = snapshot; }));
  assert.equal(await saveProfileEdit(options(forms)), false, "a second save while one is in flight does nothing");
  assert.equal(startProfileEdit("email"), false, "and no other detail can be opened meanwhile");
  assert.equal(cancelProfileEdit(), false, "nor the save abandoned");
  assert.equal(one(row(savingPage, "phone"), "[data-action=\"profileEdit.save\"]").textContent, "Saving…");
  assert.equal(one(row(savingPage, "phone"), "[data-action=\"profileEdit.save\"]").hasAttribute("disabled"), true);
  assert.equal(one(row(savingPage, "phone"), "input").hasAttribute("disabled"), true);
  assert.match(one(row(savingPage, "phone"), "[role=\"status\"]").textContent, /waiting for confirmation/);
  assert.ok(all(savingPage, "[data-action=\"profileEdit.start\"]").every((node) => node.hasAttribute("disabled")), "every other Edit waits for the save");
  release();
  assert.equal(await saving, true);
  assert.deepEqual(forms.submits, [["CUSTOMER_PROFILE_UPDATE", { FIELDS: ["PHONE"], PHONE: "604 555 0199" }]], "one submission carrying only the phone");
  assert.deepEqual(reloads, ["profile"], "after Core applied it the profile is read again");
  assert.equal(state.profileEdit, null);
  page = AccountProfile();
  assert.equal(one(row(page, "phone"), ".prop-fact__value").textContent, "+1 604-555-0199", "the page shows what the re-read returned");
  assert.equal(one(row(page, "phone"), ".prop-fact__saved").textContent, "Saved");

  const refusing = fake();
  startProfileEdit("email");
  changeProfileDraft("email", "taken@example.test");
  refusing.next = { outcome: "REFUSED", field: "EMAIL", message: "Server says no to this email.", changed: [] };
  assert.equal(await saveProfileEdit(options(refusing)), false);
  page = AccountProfile();
  assert.equal(row(page, "email").getAttribute("data-state"), "refused");
  assert.equal(one(row(page, "email"), ".field-error").textContent, "Server says no to this email.", "the server's reason is shown next to the field it names");
  assert.equal(one(row(page, "email"), "input").getAttribute("value"), "taken@example.test", "and the value the client typed is kept");
  assert.equal(one(row(page, "email"), "[data-action=\"profileEdit.save\"]").hasAttribute("disabled"), false);
  refusing.next = { outcome: "REFUSED", field: null, message: "This sign-in is linked to more than one account. Contact us to update your details.", changed: [] };
  await saveProfileEdit(options(refusing));
  page = AccountProfile();
  assert.equal(one(row(page, "email"), ".prop-edit__message").textContent, "This sign-in is linked to more than one account. Contact us to update your details.", "a reason that names no field is shown in the row");
  refusing.next = { outcome: "FAILED", field: null, message: "We couldn't save your change right now. Please try again in a few minutes.", changed: [] };
  await saveProfileEdit(options(refusing));
  assert.equal(row(AccountProfile(), "email").getAttribute("data-state"), "failed");
  refusing.error = coded("outcome-unknown");
  await saveProfileEdit(options(refusing));
  assert.match(one(row(AccountProfile(), "email"), ".prop-edit__message").textContent, /couldn't confirm the change yet/);
  assert.equal(cancelProfileEdit(), true);
  assert.equal(all(AccountProfile(), "input").length, 0, "Cancel puts the row back as it was");

  const quiet = fake();
  startProfileEdit("billing");
  assert.equal(await saveProfileEdit(options(quiet)), true);
  assert.equal(quiet.submits.length, 0, "Save without a change closes the editor without a submission");

  const login = fake();
  startProfileEdit("login");
  page = AccountProfile();
  assert.equal(one(row(page, "login"), "input").getAttribute("value"), "jordan.lee@example.test");
  assert.equal(all(one(page, "[data-module=\"profile-facts\"]"), "input").length, 0, "the sign-in is edited in its own card");
  changeProfileDraft("login", "New.Login@Example.test");
  login.next = { outcome: "APPLIED", field: null, message: "Saved. Use your new email the next time you sign in.", changed: ["LOGIN"] };
  reloads.length = 0;
  assert.equal(await saveProfileEdit(options(login)), true);
  assert.deepEqual(login.submits, [["CUSTOMER_LOGIN_CHANGE", { LOGIN: "new.login@example.test" }]]);
  page = AccountProfile();
  assert.equal(one(row(page, "login"), ".prop-fact__value").textContent, "new.login@example.test");
  assert.equal(one(row(page, "login"), ".prop-fact__note").textContent, "Use this email the next time you sign in. Your password stays the same.");
  assert.equal(one(row(page, "email"), ".prop-fact__value").textContent, "jordan.lee@example.test", "the contact email is not the sign-in and does not change with it");
  assert.deepEqual(reloads, [], "a sign-in change does not re-read the Account");

  const ended = fake();
  startProfileEdit("login");
  changeProfileDraft("login", "another@example.test");
  ended.error = coded("session-expired");
  await saveProfileEdit(options(ended));
  page = AccountProfile();
  assert.equal(row(page, "login").getAttribute("data-state"), "session-ended");
  assert.match(one(row(page, "login"), ".prop-edit__message").textContent, /with another@example\.test if the change went through, otherwise with new\.login@example\.test/);
  assert.equal(one(row(page, "login"), "[data-visual-id=\"profile-edit-sign-in\"]").getAttribute("data-action"), "auth.signOut");

  state.profileEdit = null;
  const expiredProfile = fake();
  startProfileEdit("phone");
  changeProfileDraft("phone", "604 555 0100");
  expiredProfile.error = coded("session-expired");
  await saveProfileEdit(options(expiredProfile));
  assert.equal(state.account, "session-expired", "an expired session during a profile save goes to the session gate");
  assert.equal(state.profileEdit, null);
}

{
  const read = (file) => fs.readFileSync(path.resolve("app-templates/customer-portal/runtime/src/" + file), "utf8");
  const source = ["routes/AccountProfilePage.js", "adapters/core-account-profile-adapter.js", "normalizers/account-profile.js", "adapters/core-profile-form-adapter.js", "profile-edit.js"].map(read).join("\n");
  assert.doesNotMatch(source, /save\.json|send-event|PATCH|innerHTML|kind"/, "the snow profile never saves an Account, contact or address through CRUD, sends no record event and injects no markup");
  assert.deepEqual([...read("adapters/core-profile-form-adapter.js").matchAll(/"(\/api\/[\w/.-]+)"/g)].map(([, route]) => route), ["/api/form-type/", "/api/form/submit.json", "/api/user/preferences.json"], "the only write is a form submission; the rest are reads");
}

console.log("snow-account-profile-check ok: the snow profile is one server-scoped read of the resolved customer Account filtered by id and the signed-in User, with contacts, entries and typed addresses projected and no entry kind, a row outside the session dropped and named browser-filtered, every Core failure mapped, a normalizer that shows the LEGAL contact, its e-mail and phone and the billing addresses newest first without codes, preferences or invented values, fixture data read through the same normalizer, stormRetail routed to it while every other profile keeps its page, ready, partial, empty, loading, error, unauthorized and unavailable states with Sign out always present, and inline Edit on the name, email, phone, billing address and sign-in that checks the server's rules in the browser, submits only changed fields as a CUSTOMER_PROFILE_UPDATE or CUSTOMER_LOGIN_CHANGE form with the session, saves one at a time, waits for the outcome in the User's preference, re-reads the profile after a change and shows a refusal next to its field");

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

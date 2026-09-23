import assert from "node:assert/strict";
import crypto from "node:crypto";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve("app-templates/customer-portal");
const reviewDir = path.join(root, "runtime/client-review");
const RUNTIME = ["copy.js", "core-contract.js", "adapter.js", "normalizer.js", "components.js", "controller.js"];
const FIXTURES = "fixtures.js";
const sources = Object.fromEntries(await Promise.all(RUNTIME.concat([FIXTURES]).map(async (name) => [name, await fs.readFile(path.join(reviewDir, name), "utf8")])));
const css = await fs.readFile(path.join(reviewDir, "client-review.css"), "utf8");
const tokensCss = await fs.readFile(path.join(root, "runtime/styles/tokens.css"), "utf8");
const previewPage = await fs.readFile(path.join(root, "runtime/client-review.html"), "utf8");

const plain = (value) => JSON.parse(JSON.stringify(value === undefined ? null : value));
const settle = (promise, ms = 200) => Promise.race([promise.then(() => "idle"), new Promise((resolve) => setTimeout(() => resolve("held"), ms))]);
const tick = () => new Promise((resolve) => setImmediate(resolve));
const formatCad = (value) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(value);

function fakeTimers() {
  let now = 0;
  let sequence = 0;
  const queue = new Map();
  const waits = [];
  return {
    waits,
    get now() { return now; },
    get pending() { return queue.size; },
    set(callback, ms) { sequence += 1; queue.set(sequence, { at: now + ms, ms, callback }); return sequence; },
    clear(handle) { queue.delete(handle); },
    fire() {
      const next = [...queue.entries()].sort((left, right) => left[1].at - right[1].at)[0];
      if (!next) return false;
      queue.delete(next[0]);
      now = next[1].at;
      waits.push(next[1].ms);
      next[1].callback();
      return true;
    },
  };
}

async function drain(controller, timers, limit = 40) {
  await controller.idle();
  for (let fired = 0; fired < limit && timers.fire(); fired += 1) await controller.idle();
}

function createDocument() {
  const document = { activeElement: null };
  document.createElement = (tag) => {
    const node = {
      tagName: String(tag).toUpperCase(),
      className: "",
      children: [],
      attributes: {},
      listeners: {},
      parentNode: null,
      value: "",
      checked: false,
      selected: false,
      ownText: "",
      get textContent() { return this.ownText + this.children.map((child) => child.textContent).join(""); },
      set textContent(value) { this.ownText = String(value); this.children = []; },
      setAttribute(name, value) { this.attributes[name] = String(value); },
      getAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null; },
      removeAttribute(name) { delete this.attributes[name]; },
      appendChild(child) { child.parentNode = this; this.children.push(child); return child; },
      replaceChildren(...nodes) { this.children.forEach((child) => { child.parentNode = null; }); this.children = []; nodes.forEach((child) => this.appendChild(child)); },
      addEventListener(type, listener) { (this.listeners[type] = this.listeners[type] || []).push(listener); },
      fire(type, event) { (this.listeners[type] || []).slice().forEach((listener) => listener.call(this, Object.assign({ target: this, preventDefault() {} }, event || {}))); },
      focus() { document.activeElement = this; },
      querySelector() { return null; },
    };
    return node;
  };
  return document;
}

function walk(node, visit) { visit(node); node.children.forEach((child) => walk(child, visit)); }
function all(node, predicate) { const found = []; walk(node, (candidate) => { if (predicate(candidate)) found.push(candidate); }); return found; }
function byClass(node, name) { return all(node, (candidate) => String(candidate.className).split(/\s+/).includes(name)); }
function byAttribute(node, name, value) { return all(node, (candidate) => candidate.getAttribute(name) === value); }
function surface(node) {
  const parts = [];
  walk(node, (candidate) => { parts.push(candidate.ownText, String(candidate.value ?? ""), ...Object.values(candidate.attributes)); });
  return parts.join("\n");
}
function visibleText(node) {
  const parts = [];
  walk(node, (candidate) => { parts.push(candidate.ownText); });
  return parts.join("");
}

function loadRuntime(options = {}) {
  const document = createDocument();
  const consoleCalls = [];
  const storageCalls = [];
  const storage = {
    getItem: (...args) => { storageCalls.push(["getItem", ...args]); return null; },
    setItem: (...args) => { storageCalls.push(["setItem", ...args]); },
    removeItem: (...args) => { storageCalls.push(["removeItem", ...args]); },
    clear: () => { storageCalls.push(["clear"]); },
  };
  const sandbox = {
    document,
    console: new Proxy({}, { get: (_, method) => (...args) => { consoleCalls.push([String(method), ...args]); } }),
    localStorage: storage,
    sessionStorage: storage,
    navigator: { language: "en-CA" },
    location: { hash: options.hash || "", search: "" },
    URL,
    URLSearchParams,
    Intl,
    Promise,
    JSON,
    setTimeout,
    clearTimeout,
    addEventListener() {},
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  for (const name of RUNTIME.concat(options.fixtures ? [FIXTURES] : [])) vm.runInContext(sources[name], sandbox, { filename: name });
  return { sandbox, CR: sandbox.ClientReview, document, consoleCalls, storageCalls };
}

async function boundProcessorPath() {
  const seedsDir = path.resolve("../core-ui/scripts/dev/seeds");
  const workflowsPath = path.join(seedsDir, "serviceAgreementWorkflows.json");
  const scriptsPath = path.join(seedsDir, "serviceAgreementScripts.json");
  if (!existsSync(workflowsPath) || !existsSync(scriptsPath)) return null;
  const workflows = JSON.parse(await fs.readFile(workflowsPath, "utf8")).workflows;
  const scripts = JSON.parse(await fs.readFile(scriptsPath, "utf8")).scripts;
  const contentOf = (code) => {
    const entry = scripts.find((script) => script.code === code);
    assert.ok(entry && entry.contentFile, "serviceAgreementScripts.json declares " + code);
    return path.join(seedsDir, entry.contentFile);
  };
  const bound = workflows.find((workflow) => workflow.code === "SERVICE_AGREEMENT_LIFECYCLE");
  assert.ok(bound && bound.script, "SERVICE_AGREEMENT_LIFECYCLE is bound to a utility script");
  const utility = await fs.readFile(contentOf(bound.script), "utf8");
  const processors = [...new Set([...utility.matchAll(/"(SNOW_SERVICE_AGREEMENT_PROCESSOR_V\d+)"/g)].map((match) => match[1]))];
  assert.equal(processors.length, 1, bound.script + " dispatches exactly one details processor");
  return contentOf(processors[0]);
}

function section(document, attributes) {
  const node = document.createElement("section");
  Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, value));
  return node;
}

const MONEY = "(?:amount|grandTotal|totalCharges|totalTaxes|itemCount|unitPrice|price|total|subtotal|charges|taxes|grand)";
const MONEY_ARITHMETIC = new RegExp("\\b" + MONEY + "\\b\\s*(?:[-+*/%]=?|\\*\\*)\\s*[\\w(.]|[\\w).\\]]\\s*(?:[-+*/%]=?|\\*\\*)\\s*(?:[\\w.]+\\.)?" + MONEY + "\\b");
const codeOf = (line) => line.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g, "\"\"");
for (const bad of ["line.amount * line.itemCount", "sum += row.grandTotal", "var total = charges + taxes", "price*2", "a - total"]) {
  assert.match(codeOf(bad), MONEY_ARITHMETIC, "the money scan must catch: " + bad);
}
for (const good of ["formatMoney(row.grandTotal, currency, locale)", "\"cr-total__value\" + (option.total ? \"\" : \" cr-muted\")", "total: priced ? formatMoney(row.grandTotal) : \"\"", "grandTotal: spec.grand,", "var total = el(\"div\", \"cr-total\");"]) {
  assert.doesNotMatch(codeOf(good), MONEY_ARITHMETIC, "the money scan must allow: " + good);
}
for (const [name, source] of Object.entries(sources)) {
  assert.doesNotMatch(source, /innerHTML|outerHTML|insertAdjacentHTML|document\.write/, name + " must build markup with createElement and textContent");
  assert.doesNotMatch(source, /\beval\s*\(|new\s+Function\b|\bFunction\s*\(/, name + " must never execute strings as code");
  assert.doesNotMatch(source, /\bconsole\s*\./, name + " must not write to the console");
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|document\.cookie/, name + " must not persist anything in the browser");
  assert.doesNotMatch(source, /servicewand\.com|pixelnation\.com/, name + " must not hardcode a deployment host");
  assert.doesNotMatch(source, /\.reduce\s*\(|Math\.(?:round|floor|ceil|trunc)|\.toFixed\s*\(/, name + " must not carry the usual tools for rebuilding a total");
  assert.doesNotMatch(source, /\/\*|^\s*\/\/(?!\s*@)/m, name + " must carry no comments");
  source.split("\n").forEach((line, index) => {
    assert.doesNotMatch(codeOf(line), MONEY_ARITHMETIC, name + ":" + (index + 1) + " must not compute with a money field: " + line.trim());
  });
}

const { controlCharacterOffsets } = await import("./export-client-review-manual.mjs");
for (const [name, source] of Object.entries(sources)) {
  assert.deepEqual(controlCharacterOffsets(source), [], name + " carries no control character, which an HTML parser rewrites inside an inline script");
}
assert.deepEqual(controlCharacterOffsets(css), [], "the stylesheet carries no control character");
assert.deepEqual(controlCharacterOffsets(previewPage), [], "the preview page carries no control character");

assert.doesNotMatch(css, /\/\*/, "the stylesheet carries no comments");
assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i, "no raw hex colour may bypass the portal tokens");
assert.doesNotMatch(css, /\b(?:rgba?|hsla?)\(\s*[\d.]/i, "no literal rgb or hsl channel may bypass the portal tokens");
assert.doesNotMatch(css, /:\s*(?:white|black|red|green|blue|gray|grey|orange|yellow|purple|pink|silver|navy)\b/i, "no named colour may bypass the portal tokens");
const declaredTokens = new Set([...tokensCss.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((match) => match[1]));
const usedTokens = new Set([...css.matchAll(/var\((--[a-z0-9-]+)/g)].map((match) => match[1]));
for (const token of usedTokens) assert.ok(declaredTokens.has(token), "client-review.css uses " + token + ", which tokens.css does not declare");
for (const token of ["--accent", "--accent-rgb", "--ink", "--ink-2", "--ink-3", "--surface", "--surface-2", "--glass", "--glass-border", "--hair", "--radius-card", "--radius-md", "--danger", "--danger-bg", "--ok", "--warn", "--info"]) {
  assert.ok(usedTokens.has(token), "the stylesheet must build on the portal token " + token);
}

{
  const { CR } = loadRuntime();
  const { tokenFromFragment, safeApiBase } = CR.adapter;
  assert.equal(tokenFromFragment("#token=abc.DEF-123_x"), "abc.DEF-123_x");
  assert.equal(tokenFromFragment("#view=1&token=t%2Bk%3D"), "t+k=", "the token is percent-decoded, and + is not read as a space");
  assert.equal(tokenFromFragment(""), "");
  assert.equal(tokenFromFragment("#token="), "");
  assert.equal(tokenFromFragment("#tokens=abc"), "");
  assert.equal(tokenFromFragment("#token=has%20space"), "", "a token with whitespace is refused");
  assert.equal(tokenFromFragment("#token=%E0%A4%A"), "", "a malformed escape is refused");
  assert.equal(safeApiBase("https://core.example"), "https://core.example");
  assert.equal(safeApiBase("https://core.example/"), "https://core.example");
  assert.equal(safeApiBase("http://core.example"), "", "a non-https base is discarded");
  assert.equal(safeApiBase("https://core.example/core"), "", "a base with a path is discarded");
  assert.equal(safeApiBase("https://core.example/?token=x"), "", "a base with a query is discarded");
  assert.equal(safeApiBase("https://user:pass@core.example"), "", "a base with credentials is discarded");
  assert.equal(safeApiBase("$" + "{REVIEW_API_BASE_URL@STRING}"), "", "an unresolved CMS marker is not a base");

  const { safePortalUrl } = CR.adapter;
  assert.equal(safePortalUrl("https://portal.example.com/"), "https://portal.example.com/");
  assert.equal(safePortalUrl(" https://portal.example.com/sign-in?from=review "), "https://portal.example.com/sign-in?from=review", "a portal address may carry a path and a query");
  assert.equal(safePortalUrl("https://portal.example.com"), "https://portal.example.com/", "the portal address is used as the URL parser normalizes it");
  for (const refused of ["", "   ", "http://portal.example.com/", "javascript:alert(1)", "data:text/html,x", "//portal.example.com/", "/portal", "portal.example.com", "https://user:pass@portal.example.com/", "$" + "{PORTAL_URL@STRING}"]) {
    assert.equal(safePortalUrl(refused), "", JSON.stringify(refused) + " is not a portal address");
  }

  const errors = CR.adapter.fieldErrorsOf({
    fieldErrors: [{ field: "metadata.LEGAL_NAME", message: "Too short" }],
    errors: { "REPRESENTATIVE_EMAIL": ["Unreachable"], lowercase: "ignored" },
    violations: [{ propertyPath: "attributes[BILLING_ADDRESS]", message: "Required" }],
  });
  assert.deepEqual(plain(errors), { LEGAL_NAME: "Too short", REPRESENTATIVE_EMAIL: "Unreachable", BILLING_ADDRESS: "Required" }, "field errors are read from the common refusal shapes");
  assert.equal(CR.adapter.refusalMessage({ message: "  Not   allowed " }), "Not allowed");
  assert.equal(CR.adapter.refusalMessage("<html>502</html>"), "", "a non-JSON body is never shown as a refusal message");
}

const N = loadRuntime().CR.normalizer;
{
  const { CR } = loadRuntime({ fixtures: true });
  const contract = CR.contract;
  const normalizer = CR.normalizer;
  const EXPECTED_STATUS = {
    QUOTE_SENT: "new", QUOTE_VIEWED: "viewed", CLIENT_APPROVED: "approved", DECLINED: "declined",
    CUSTOMER_CHANGES_REQUESTED: "changes", INITIAL: "revising", QUOTE_PREPARED: "revising",
    CHANGES_REQUESTED: "revising", QUOTE_APPROVED_INTERNALLY: "revising",
  };
  assert.deepEqual(Object.keys(EXPECTED_STATUS).sort(), plain(contract.orderStates).sort(), "every order state has an expected customer status");
  const EXPECTED_PROPERTY = { new: "awaiting", viewed: "awaiting", approved: "approved", declined: "declined", changes: "changes", revising: "changes" };
  const EXPECTED_ACTIONS = {
    QUOTE_SENT: { view: true, approve: false, decline: false, changes: false },
    QUOTE_VIEWED: { view: false, approve: true, decline: true, changes: true },
  };
  const model = (data) => normalizer.reviewModel({
    grant: normalizer.grantOf(data.grant),
    documents: data.documents,
    orders: data.orders,
    accounts: data.accounts,
    orderItems: data.orderItems,
    productPrices: data.productPrices,
    products: data.products,
    accountFailed: data.accountFails,
  }, { locale: "en-CA", contract });

  for (const state of contract.orderStates) {
    const data = CR.fixtures.quotationData();
    data.orders = data.orders.filter((row) => row.id === 3102);
    data.orders[0].states = [{ code: state }];
    data.documents[0].attributes[17].ORDERS.value = [3102];
    const view = model(data);
    const option = view.properties[0].options[0];
    assert.equal(option.status, EXPECTED_STATUS[state], state + " maps to its customer status");
    assert.equal(view.properties[0].status, EXPECTED_PROPERTY[option.status], state + " decides the property status");
    assert.equal(option.priced, option.status !== "revising", state + " shows server prices only when the quote is not being revised");
    assert.deepEqual(plain(option.actions), EXPECTED_ACTIONS[state] || { view: false, approve: false, decline: false, changes: false }, state + " offers only the events its state allows");
  }
  {
    const data = CR.fixtures.quotationData();
    data.orders[1].states = [{ code: "SOMETHING_NEW" }];
    const option = model(data).properties[0].options[1];
    assert.equal(option.status, "unknown", "an unmapped order state is never guessed");
    assert.deepEqual(plain(option.actions), { view: false, approve: false, decline: false, changes: false });
  }

  assert.equal(normalizer.propertyStatus([{ status: "approved" }, { status: "declined" }]), "approved");
  assert.equal(normalizer.propertyStatus([{ status: "declined" }, { status: "declined" }]), "declined");
  assert.equal(normalizer.propertyStatus([{ status: "declined" }, { status: "new" }]), "awaiting");
  assert.equal(normalizer.propertyStatus([{ status: "changes" }, { status: "viewed" }]), "changes");
  assert.equal(normalizer.propertyStatus([{ status: "revising" }, { status: "declined" }]), "changes");
  assert.equal(normalizer.propertyStatus([{ status: "unknown" }]), "unknown");
  assert.equal(normalizer.propertyStatus([]), "unknown");

  const EXPECTED_KIND = {
    QUOTATION: "preparing", QUOTATION_SENT: "quote-review", QUOTATION_SEND_FAILED: "unavailable",
    AWAITING_CLIENT_DETAILS: "contract-details", CLIENT_DETAILS_RECEIVED: "checking", DRAFT: "preparing",
    PENDING_MANAGEMENT_APPROVAL: "preparing",
    INTERNALLY_APPROVED: "preparing", SENT_TO_CLIENT: "agreement-review", AGREEMENT_SEND_FAILED: "unavailable",
    CLIENT_APPROVED: "completion", ACTIVATION_FAILED: "completion", ACTIVE: "completion", SUSPENDED: "reference", EXPIRED: "reference",
    ARCHIVED: "closed", CANCELED: "closed",
  };
  const EXPECTED_COMPLETION = { CLIENT_APPROVED: "approved", ACTIVATION_FAILED: "finishing", ACTIVE: "active" };
  assert.deepEqual(Object.keys(EXPECTED_KIND).sort(), plain(contract.agreementStates).sort(), "every agreement state has an expected page");
  const quotationGrant = CR.fixtures.quotationData().grant;
  const agreementGrant = CR.fixtures.agreementData("SENT_TO_CLIENT").grant;
  for (const state of contract.agreementStates.concat(["NOT_A_STATE"])) {
    const data = CR.fixtures.quotationData(state);
    data.grant = { expiresAt: quotationGrant.expiresAt, types: quotationGrant.types.slice(0, 2).concat([{ entityType: "Document", canRead: true, events: agreementGrant.types[2].events.concat(quotationGrant.types[2].events) }]) };
    const view = model(data);
    assert.equal(view.kind, EXPECTED_KIND[state] || "unavailable", state + " selects its page");
    assert.equal(view.completion, EXPECTED_COMPLETION[state] || "", state + " selects its completion wording");
    assert.equal(view.reason === "unknown-state", !EXPECTED_KIND[state], state + (EXPECTED_KIND[state] ? " is never answered as an unknown state" : " is an unknown state"));
    const offered = view.properties.some((property) => property.options.some((option) => Object.values(option.actions).some(Boolean)));
    assert.equal(offered, state === "QUOTATION_SENT", state + " offers quote decisions only while the package is sent");
    assert.equal(view.details.available, state === "AWAITING_CLIENT_DETAILS", state + " offers the details step only while details are awaited");
    assert.equal(view.canApproveAgreement, state === "SENT_TO_CLIENT", state + " offers agreement approval only while it is sent to the client");
  }

  const review = model(CR.fixtures.quotationData());
  assert.deepEqual(plain(review.properties.map((property) => [property.key, property.status, property.options.map((option) => option.id)])), [
    ["property-278", "awaiting", [3101, 3102, 3103]],
    ["property-430", "approved", [3104, 3105]],
    ["property-512", "changes", [3106, 3107]],
    ["property-661", "awaiting", [3108]],
    ["property-702", "declined", [3109, 3110]],
  ], "options are grouped by SERVICE_PROPERTY in package order");
  assert.deepEqual(plain(review.summary), { properties: 5, awaiting: 2, approved: 1, declined: 1, changes: 1 }, "the package summary is counts only");
  const unaddressed = review.properties[3];
  assert.equal(unaddressed.address, "", "an Order without SERVICE_ADDRESS carries no invented address");
  assert.equal(unaddressed.options[0].model, "", "an Order without PRICING_MODEL carries no invented model");

  const money = CR.fixtures.quotationData();
  money.orders[1].grandTotal = 777.77;
  const priced = model(money).properties[0].options[1];
  const format = (value) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(value);
  assert.equal(priced.total, format(777.77), "the option total is the server grandTotal, never a sum of lines");
  assert.deepEqual(plain(priced.lines.map((line) => [line.product, line.quantity, line.unitPrice])), [["Snow Removal", "5", format(280)], ["Rock Salt De-Icing", "5", format(1470)]], "lines show product, quantity and unit price as sent");
  assert.equal(priced.subtotal, format(8750), "the subtotal is the server's totalCharges");
  assert.equal(priced.taxes, format(437.5), "the taxes are the server's totalTaxes");
  const withoutTaxes = CR.fixtures.quotationData();
  delete withoutTaxes.orders[1].totalTaxes;
  const untaxed = model(withoutTaxes).properties[0].options[1];
  assert.equal(untaxed.taxes, "", "a totalTaxes the server does not return leaves no taxes value");
  assert.equal(untaxed.subtotal, format(8750), "and the subtotal still shows");
  const withoutCharges = CR.fixtures.quotationData();
  delete withoutCharges.orders[1].totalCharges;
  assert.equal(model(withoutCharges).properties[0].options[1].subtotal, "", "a totalCharges the server does not return leaves no subtotal value");
  const bare = model(CR.fixtures.quotationData()).properties[3].options[0];
  assert.deepEqual([bare.subtotal, bare.taxes, bare.total], ["", "", format(288.75)], "the fixture exercises an option whose server returns only its total");
  assert.equal(normalizer.formatMoney(0.035, "CAD", "en-CA"), format(0.035), "a sub-cent unit price keeps its digits");
  assert.equal(normalizer.formatMoney(null, "CAD", "en-CA"), "", "a missing amount stays missing rather than becoming zero");
  assert.equal(normalizer.formatMoney("abc", "CAD", "en-CA"), "");
  assert.equal(normalizer.formatMoney(12, "", "en-CA"), new Intl.NumberFormat("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(12), "an amount without a currency is shown without inventing one");

  const joined = CR.fixtures.quotationData();
  const joinedOrder = joined.orders.find((row) => row.id === 3102);
  joined.documents[0].attributes[17].ORDERS.value = [3102];
  joined.orders = [joinedOrder];
  joined.orderItems = joinedOrder.items.map((line) => ({ id: line.id, sortOrder: line.sortOrder, itemCount: line.itemCount, amount: line.amount, itemPrice: { id: line.itemPrice.id } }));
  joined.productPrices = joinedOrder.items.map((line) => ({ id: line.itemPrice.id, product: { id: line.itemPrice.product.id } }));
  joined.products = joinedOrder.items.map((line) => line.itemPrice.product);
  joinedOrder.items = joinedOrder.items.map((line) => ({ id: line.id }));
  assert.deepEqual(plain(model(joined).properties[0].options[0].lines.map((line) => [line.product, line.quantity, line.unitPrice])), [["Snow Removal", "5", format(280)], ["Rock Salt De-Icing", "5", format(1470)]], "shallow Order item references join through separately granted OrderItem, ProductPrice and Product rows");
  assert.equal(normalizer.entityKind("com.pixelnation.pim.domain.ProductPrice"), "product-price", "ProductPrice introspection uses the adapter's product-price key");

  const narrowed = CR.fixtures.quotationData();
  narrowed.grant.types[1].events = narrowed.grant.types[1].events.filter((event) => event.code !== "QUOTE_VIEWED-DECLINED");
  const narrowedOption = model(narrowed).properties[0].options[1];
  assert.equal(narrowedOption.actions.decline, false, "an event the grant does not delegate is not offered");
  assert.equal(narrowedOption.actions.approve, true);
  const scoped = CR.fixtures.quotationData();
  scoped.grant.types[1] = { entityType: "com.pixelnation.bill.domain.Order", canRead: true, entityId: 3103, events: [{ code: "P_WF:GENERAL_FSM_ORDER:QUOTE_VIEWED-CLIENT_APPROVED" }] };
  const scopedOptions = model(scoped).properties[0].options;
  assert.equal(scopedOptions[2].actions.approve, true, "a per-entry event with a workflow prefix is granted to that entry");
  assert.equal(scopedOptions[1].actions.approve, false, "and to no other entry");
  const sibling = CR.fixtures.quotationData();
  sibling.orders[0].states = [{ code: "CLIENT_APPROVED" }];
  const siblingOptions = model(sibling).properties[0].options;
  assert.equal(siblingOptions[1].siblingApproved, true);
  assert.deepEqual(plain(siblingOptions[1].actions), { view: false, approve: false, decline: false, changes: false }, "once a property has an approved option its other options offer nothing");

  const partial = CR.fixtures.quotationData();
  partial.orders = partial.orders.filter((row) => row.id !== 3107);
  const partialView = model(partial);
  assert.equal(partialView.unreadableOrders, 1, "an Order the agreement lists but the link cannot read is counted, not dropped silently");
  assert.equal(partialView.properties[2].options.length, 1);

  const fields = normalizer.detailFields(contract.contractDetails, "en");
  assert.deepEqual(plain(fields.map((field) => [field.code, field.kind, field.required])), [
    ["LEGAL_NAME", "text", true], ["CLIENT_TYPE", "select", true], ["BILLING_ADDRESS", "address", true],
    ["REPRESENTATIVE_FIRST_NAME", "text", true], ["REPRESENTATIVE_LAST_NAME", "text", true],
    ["REPRESENTATIVE_JOB_TITLE", "text", false], ["REPRESENTATIVE_EMAIL", "email", true],
    ["REPRESENTATIVE_PHONE", "tel", true], ["INFORMATION_CONFIRMED", "boolean", true], ["AUTHORITY_CONFIRMED", "boolean", true],
  ], "the ten contract details attributes render in seed order with their kinds");

  const formSandbox = { window: {} };
  formSandbox.globalThis = formSandbox;
  vm.createContext(formSandbox);
  vm.runInContext(await fs.readFile(path.join(root, "runtime/forms/portal-form.js"), "utf8"), formSandbox, { filename: "portal-form.js" });
  const formModel = formSandbox.window.PortalForm.normalizeSchema(plain({ id: 0, code: contract.contractDetails.event, nls: {}, attributes: contract.contractDetails.attributes, attributeGroups: [], attributeOrder: contract.contractDetails.attributeOrder }), "en");
  const formFields = formModel.groups.flatMap((group) => group.fields);
  assert.deepEqual(plain(fields.map((field) => [field.code, field.kind, field.label, field.description, field.required, field.choices])), plain(formFields.map((field) => [field.code, field.kind, field.label, field.description, field.required, field.choices])), "the details fields keep the form document's field behaviour for the same attributes");
  const defaults = CR.defaultCopy();
  const information = fields.find((field) => field.code === "INFORMATION_CONFIRMED");
  assert.equal(CR.components.confirmationStatement(defaults, information), defaults.confirmInformationStatement, "without an attribute description the confirmation reads as the default statement");
  const described = Object.assign({}, information, { description: "I confirm these details are true." });
  assert.equal(CR.components.confirmationStatement(defaults, described), "I confirm these details are true.", "an attribute description is preferred over the default statement");
  assert.equal(CR.components.confirmationStatement(Object.assign({}, defaults, { confirmInformationStatement: "We confirm our details are correct." }), described), "We confirm our details are correct.", "copy changed in CMS is preferred over the attribute description");
  const describedContract = plain(contract.contractDetails);
  describedContract.attributes.find((attribute) => attribute.code === "AUTHORITY_CONFIRMED").nls.en.DESCRIPTION = "I may sign for the client.";
  assert.equal(normalizer.detailFields(describedContract, "en").find((field) => field.code === "AUTHORITY_CONFIRMED").description, "I may sign for the client.", "an attribute description is read from its nls");

  const seedPath = path.resolve("../core-ui/scripts/dev/seeds/serviceAgreementWorkflows.json");
  if (existsSync(seedPath)) {
    const seed = JSON.parse(await fs.readFile(seedPath, "utf8"));
    const seedWorkflow = seed.workflows.find((workflow) => workflow.code === contract.agreementWorkflow);
    const seedEvent = seedWorkflow.events.find((event) => event.code === contract.contractDetails.event);
    assert.deepEqual(plain(contract.contractDetails.attributes), seedEvent.attributes, "the shipped details contract equals the seed's event attributes");
    assert.deepEqual(plain(contract.contractDetails.attributeOrder), seedEvent.attributeOrder, "the shipped details order equals the seed's event attribute order");
    assert.deepEqual(plain(contract.agreementStates), seedWorkflow.states.map((state) => state.code), "the page knows every state of the seeded agreement workflow, ACTIVATION_FAILED included");
    console.log("client-review-check: details contract and agreement states compared with " + path.relative(process.cwd(), seedPath));
  } else {
    console.log("client-review-check: seed " + seedPath + " not present, details contract and agreement states not compared");
  }

  const returnedOf = (value) => plain(normalizer.returnedDetails(value, fields, contract.detailsReturn));
  const nothingReturned = { returned: false, processingFailed: false, unexplained: false, fields: {} };
  for (const empty of [undefined, null, "", " , ", [], 12]) assert.deepEqual(returnedOf(empty), nothingReturned, JSON.stringify(empty) + " returns nothing");
  const requiredText = plain(contract.contractDetails.attributes.filter((attribute) => attribute.required && attribute.className !== "java.lang.Boolean").map((attribute) => attribute.code));
  assert.deepEqual(requiredText, ["LEGAL_NAME", "CLIENT_TYPE", "BILLING_ADDRESS", "REPRESENTATIVE_FIRST_NAME", "REPRESENTATIVE_LAST_NAME", "REPRESENTATIVE_EMAIL", "REPRESENTATIVE_PHONE"]);
  assert.deepEqual(returnedOf(requiredText.join(",")), { returned: true, processingFailed: false, unexplained: false, fields: Object.fromEntries(requiredText.map((code) => [code, "missing"])) }, "a blank required text field comes back under its own code and marks that field");
  assert.deepEqual(returnedOf("CLIENT_TYPE_INVALID,REPRESENTATIVE_EMAIL_INVALID,INFORMATION_CONFIRMED,AUTHORITY_CONFIRMED"), {
    returned: true, processingFailed: false, unexplained: false,
    fields: { CLIENT_TYPE: "choice", REPRESENTATIVE_EMAIL: "email", INFORMATION_CONFIRMED: "unconfirmed", AUTHORITY_CONFIRMED: "unconfirmed" },
  }, "the two _INVALID codes mark their fields, and a confirmation that was not true marks its checkbox");
  assert.deepEqual(returnedOf("PROCESSING_FAILED"), { returned: true, processingFailed: true, unexplained: false, fields: {} }, "PROCESSING_FAILED marks no field");
  assert.deepEqual(returnedOf("TAX_NUMBER_MISSING"), { returned: true, processingFailed: false, unexplained: true, fields: {} }, "an unknown code is counted, never mapped");
  assert.deepEqual(returnedOf(" REPRESENTATIVE_PHONE , ,REPRESENTATIVE_PHONE,constructor,toString,__proto__"), { returned: true, processingFailed: false, unexplained: true, fields: { REPRESENTATIVE_PHONE: "missing" } }, "codes are trimmed and de-duplicated, and an inherited property name is an unknown code");
  assert.deepEqual(returnedOf(["LEGAL_NAME", "CLIENT_TYPE_INVALID", "CLIENT_TYPE"]), { returned: true, processingFailed: false, unexplained: false, fields: { LEGAL_NAME: "missing", CLIENT_TYPE: "choice" } }, "a list value is read like the comma-separated string, and the first reason for a field wins");
  const modelled = plain(CR.fixtures.detailsErrors({ CLIENT_TYPE: "partnership", REPRESENTATIVE_EMAIL: "dana@", INFORMATION_CONFIRMED: "true" }));
  assert.deepEqual(modelled, ["LEGAL_NAME", "BILLING_ADDRESS", "REPRESENTATIVE_FIRST_NAME", "REPRESENTATIVE_LAST_NAME", "REPRESENTATIVE_PHONE", "CLIENT_TYPE_INVALID", "REPRESENTATIVE_EMAIL_INVALID", "INFORMATION_CONFIRMED", "AUTHORITY_CONFIRMED"], "the fixture models the processor's validation and code order");
  assert.equal(returnedOf(modelled.join(",")).unexplained, false, "every code of the modelled processor is known to the page");
  for (const [state, expected] of [["AWAITING_CLIENT_DETAILS", true], ["CLIENT_DETAILS_RECEIVED", false], ["DRAFT", false]]) {
    const data = CR.fixtures.quotationData(state, CR.fixtures.decidedStates);
    data.documents[0].attributes[17].CLIENT_DETAILS_ERRORS = { value: "LEGAL_NAME" };
    assert.equal(model(data).details.returned.returned, expected, "CLIENT_DETAILS_ERRORS is read only while the agreement awaits the details again, not in " + state);
  }

  const processorPath = await boundProcessorPath();
  if (processorPath && existsSync(processorPath)) {
    const processor = await fs.readFile(processorPath, "utf8");
    const listOf = (name) => [...((processor.match(new RegExp(name + "\\s*=\\s*List\\.of\\(([^)]*)\\)")) || ["", ""])[1]).matchAll(/"([A-Z_]+)"/g)].map((match) => match[1]);
    const required = listOf("REQUIRED_TEXT_FIELDS");
    const booleans = listOf("BOOLEAN_FIELDS");
    const invalid = [...processor.matchAll(/missing\.add\("([A-Z_]+)"\)/g)].map((match) => match[1]);
    const failure = [...processor.matchAll(/List\.of\("([A-Z_]+)"\)\)/g)].map((match) => match[1]);
    assert.ok(processor.includes("\"" + contract.agreementAttributes.detailsErrors + "\""), "the processor writes " + contract.agreementAttributes.detailsErrors);
    assert.deepEqual(required, requiredText, "the processor's required text fields are the contract's");
    assert.deepEqual(booleans, plain(contract.contractDetails.attributes.filter((attribute) => attribute.className === "java.lang.Boolean").map((attribute) => attribute.code)), "the processor's confirmations are the contract's");
    assert.deepEqual(invalid, Object.keys(contract.detailsReturn.invalid), "the processor's _INVALID codes are the contract's");
    assert.deepEqual(failure, [contract.detailsReturn.processingFailed], "the processor's failure code is the contract's");
    assert.equal(returnedOf(required.concat(invalid, booleans, failure).join(",")).unexplained, false, "every code the processor can write is known to the page");
    console.log("client-review-check: details return codes compared with " + path.relative(process.cwd(), processorPath));
  } else {
    console.log("client-review-check: seed " + processorPath + " not present, details return codes not compared");
  }

  const typesPath = path.resolve("../core-ui/scripts/dev/seeds/serviceAgreementTypes.json");
  if (existsSync(typesPath)) {
    const types = JSON.parse(await fs.readFile(typesPath, "utf8"));
    const agreementType = types.typeGroups.flatMap((group) => group.items).find((item) => item.code === contract.agreementType);
    const terms = agreementType.attributes.find((attribute) => attribute.code === contract.agreementAttributes.terms);
    assert.ok(terms, contract.agreementAttributes.terms + " is declared on the seeded " + contract.agreementType + " type");
    assert.equal(terms.className, "java.lang.String", "the terms are one string");
    assert.equal(terms.required, false, "an agreement may carry none");
    assert.equal(terms.multiselect, false, "and never more than one");
    assert.equal(terms.inputFormat, "textarea", "the type asks the attribute editor for a multi-line field");
    console.log("client-review-check: terms attribute compared with " + path.relative(process.cwd(), typesPath));
  } else {
    console.log("client-review-check: seed " + typesPath + " not present, terms attribute not compared");
  }

  const account = CR.fixtures.quotationData().accounts[0];
  assert.deepEqual(plain(normalizer.detailsPrefill(account, fields, "en-CA")), {
    LEGAL_NAME: "Harbourview Strata Corporation",
    BILLING_ADDRESS: "1500 Harbour Green Drive, Suite 210, Vancouver, BC V6C 3T8, Canada",
    REPRESENTATIVE_FIRST_NAME: "Dana",
    REPRESENTATIVE_LAST_NAME: "Reyes",
    REPRESENTATIVE_EMAIL: "dana.reyes@harbourview.example",
    REPRESENTATIVE_PHONE: "+1 604 555 0164",
  }, "pre-fill takes only what the account holds: a billing-typed address, the primary contact and its EMAIL and PHONE entries, never the contact's role as a job title and never a confirmation");
  const serviceOnly = plain(account);
  serviceOnly.addresses = serviceOnly.addresses.filter((entry) => entry.types[0].code === "SERVICE");
  assert.equal(normalizer.detailsPrefill(serviceOnly, fields, "en-CA").BILLING_ADDRESS, undefined, "a service address is never offered as the billing address");
  const idOnly = plain(CR.fixtures.idOnlyAccount({ accounts: [plain(account)] }).accounts[0]);
  assert.deepEqual(plain(normalizer.detailsPrefill(idOnly, fields, "en-CA")), { LEGAL_NAME: "Harbourview Strata Corporation" }, "contacts and addresses returned as ids only, as the link returns them today, pre-fill the Legal Name alone");

  const blocks = normalizer.termsBlocks("<h2>1. Scope</h2><p>Clear &amp; salt<br>daily.</p><ul><li>One</li><li>Two</li></ul><script>alert(1)</script>");
  assert.deepEqual(plain(blocks), [
    { kind: "heading", text: "1. Scope" },
    { kind: "paragraph", text: "Clear & salt\ndaily." },
    { kind: "item", text: "One" },
    { kind: "item", text: "Two" },
    { kind: "paragraph", text: "alert(1)" },
  ], "written terms become text blocks; markup never reaches the page");
  assert.deepEqual(plain(normalizer.termsBlocks("# Scope\n\nPlain a < b text\n- item")), [
    { kind: "heading", text: "Scope" }, { kind: "paragraph", text: "Plain a < b text" }, { kind: "item", text: "item" },
  ]);
  assert.deepEqual(plain(normalizer.termsBlocks("# 1. Scope\n- 1. First\nnext line\n\nIntro\n- item")), [
    { kind: "heading", text: "1. Scope" }, { kind: "item", text: "1. First" }, { kind: "paragraph", text: "next line" },
    { kind: "paragraph", text: "Intro" }, { kind: "item", text: "item" },
  ], "a numbered heading or item keeps the # and - syntax, and a line after an item is still its own paragraph");
  const clause = (number, depth, value) => ({ kind: "clause", number, depth, text: value });
  assert.deepEqual(plain(normalizer.termsBlocks(CR.fixtures.numberedTerms)), [
    clause("1.", 1, "Services\nThe Provider clears snow and applies de-icing material at each property listed in this agreement, under the option approved for that property."),
    clause("2.", 1, "Service triggers"),
    clause("2.1", 2, "Snow removal starts once accumulation reaches 5 cm."),
    clause("2.2", 2, "De-icing is applied when the surface temperature is forecast at or below 0 °C,\nincluding overnight frost on walkways and ramps."),
    clause("3.", 1, "Invoicing"),
    clause("3.1)", 2, "Seasonal options are invoiced once, at the start of the term."),
    clause("3.2)", 2, "Monthly options are invoiced on the first day of each month of the term."),
    clause("3.3)", 2, "Per-service options are invoiced after each visit."),
    clause("4.", 1, "Access\nThe Client keeps each property accessible and tells the Provider about obstacles:"),
    { kind: "item", text: "parked vehicles;" },
    { kind: "item", text: "construction work." },
    clause("5.", 1, "Term and notice"),
    clause("5.1.", 2, "This agreement runs from the term start date to the term end date."),
    clause("5.1.1", 3, "Either party may end it early with 30 days' written notice."),
  ], "numbered lines keep their numbers as written and their depth, and continuation lines belong to their clause");
  assert.deepEqual(plain(normalizer.termsBlocks("Scope of work:\n1) Plowing\n2) Salting\nafter heavy snow\n\nSigned below.")), [
    { kind: "paragraph", text: "Scope of work:" }, clause("1)", 1, "Plowing"), clause("2)", 1, "Salting\nafter heavy snow"), { kind: "paragraph", text: "Signed below." },
  ], "a paragraph before a clause stays a paragraph, and a blank line ends a clause");
  for (const prose of ["5 cm of snow starts a visit.", "2026 season pricing applies.", "15.03.2026 is the first day.", "3.14159 is not a clause.", "12.5% is added late.", "1.\nServices"]) {
    assert.ok(plain(normalizer.termsBlocks(prose)).every((block) => block.kind === "paragraph"), JSON.stringify(prose) + " stays prose");
  }

  const termsOf = (mutate) => {
    const data = CR.fixtures.agreementData("SENT_TO_CLIENT", false);
    mutate(data.documents[0]);
    return plain(model(data).agreement.terms);
  };
  assert.equal(contract.agreementAttributes.terms, "CONTRACT_TERMS", "the terms are an attribute of the agreement type");
  assert.ok(termsOf(() => {}).some((block) => block.kind === "heading"), "the page reads its terms from the CONTRACT_TERMS attribute");
  assert.deepEqual(termsOf((row) => {
    delete row.attributes[17].CONTRACT_TERMS;
    row.content = "<h2>Ignored</h2><p>Terms on a field Document does not declare.</p>";
  }), [], "an agreement without CONTRACT_TERMS has no terms, and a content field on the row is never read");
  assert.equal(Object.values(contract.rawShape).includes("content"), false, "no part of the contract names a content field");
}

const EXPECTED_SCENARIOS = {
  "quote-review": ["ready", "quote-review"], loading: ["loading", null], "link-missing": ["link-missing", null],
  "link-closed": ["link-closed", null], unconfigured: ["unconfigured", null], empty: ["ready", "empty"],
  error: ["error", null], partial: ["ready", "quote-review"], "option-open": ["ready", "quote-review"],
  "view-pending": ["ready", "quote-review"], "view-failed": ["ready", "quote-review"], "approve-confirm": ["ready", "quote-review"],
  "changes-invalid": ["ready", "quote-review"], "command-pending": ["ready", "quote-review"], "command-refused": ["ready", "quote-review"],
  "command-failed": ["ready", "quote-review"], "command-stale-pending": ["ready", "quote-review"], "command-unconfirmed": ["ready", "quote-review"],
  "view-unconfirmed": ["ready", "quote-review"], decided: ["ready", "quote-review"],
  "decided-following": ["ready", "quote-review"], "decided-following-slow": ["ready", "quote-review"], "decided-next-step": ["ready", "contract-details"],
  "contract-details": ["ready", "contract-details"],
  "details-invalid": ["ready", "contract-details"], "details-refused": ["ready", "contract-details"],
  "details-checking": ["ready", "checking"], "details-checking-slow": ["ready", "checking"],
  "details-returned": ["ready", "contract-details"], "details-returned-processing": ["ready", "contract-details"],
  "details-returned-unknown": ["ready", "contract-details"], "details-returned-sent": ["ready", "contract-details"], "details-closed": ["link-closed", null],
  "details-stale-checking": ["ready", "checking"], "details-stale-slow": ["ready", "checking"], "details-stale-closed": ["link-closed", null],
  preparing: ["ready", "preparing"], "agreement-review": ["ready", "agreement-review"], "agreement-numbered-terms": ["ready", "agreement-review"],
  "agreement-no-terms": ["ready", "agreement-review"], "agreement-confirm": ["ready", "agreement-review"], "agreement-unconfirmed": ["ready", "agreement-review"], "approval-closed": ["link-closed", null],
  completion: ["ready", "completion"], "completion-portal": ["ready", "completion"], "completion-finishing": ["ready", "completion"],
  "link-closed-portal": ["link-closed", null], "reference-expired": ["ready", "reference"],
  "closed-canceled": ["ready", "closed"], unavailable: ["ready", "unavailable"],
};
const POLLED_SCENARIOS = new Set(["details-checking-slow", "details-closed", "details-returned-sent", "decided-following-slow", "decided-next-step", "details-stale-slow", "details-stale-closed", "command-unconfirmed", "view-unconfirmed", "agreement-unconfirmed"]);

async function runScenario(id) {
  const runtime = loadRuntime({ fixtures: true });
  const mount = runtime.document.createElement("div");
  const live = runtime.document.createElement("p");
  const timers = fakeTimers();
  const host = section(runtime.document, { "data-review-data-mode": "fixture" });
  const sent = [];
  const setup = runtime.CR.fixtures.setup;
  runtime.CR.fixtures.setup = (requested) => {
    const result = setup(requested);
    if (result.adapter) {
      const original = result.adapter.sendEvent;
      result.adapter.sendEvent = (...args) => { sent.push(plain(args)); return original(...args); };
    }
    return result;
  };
  const controller = runtime.CR.boot(host, { scenario: id, mount, live, timers, locale: "en-CA" });
  const outcome = await settle(runtime.CR.fixtures.play(controller, controller.steps).then(() => controller.idle()));
  if (POLLED_SCENARIOS.has(id)) await drain(controller, timers);
  return { runtime, mount, live, timers, controller, sent, outcome, copy: controller.copy };
}

const fieldNamed = (node, code) => all(node, (candidate) => candidate.getAttribute("data-code") === code)[0];
const controlOf = (field) => byAttribute(field, "id", "cr-field-" + field.getAttribute("data-code"))[0];
const errorOf = (field) => byClass(field, "cr-field__error")[0];
const portalLinks = (node) => byAttribute(node, "data-action", "portal.open");

{
  const ids = loadRuntime({ fixtures: true }).CR.fixtures.scenarios.map((scenario) => scenario.id);
  assert.deepEqual(Object.keys(EXPECTED_SCENARIOS).sort(), plain(ids).sort(), "every preview state has an expectation");
  assert.match(previewPage, /data-review-data-mode="fixture"/, "the preview page selects fixture mode by its data attribute");
  const order = [...previewPage.matchAll(/<script src="client-review\/([a-z-]+\.js)"><\/script>/g)].map((match) => match[1]);
  assert.deepEqual(order, RUNTIME.concat([FIXTURES]), "the preview page loads the runtime in dependency order, fixtures last");

  for (const id of ids) {
    const run = await runScenario(id);
    const snapshot = run.controller.snapshot();
    assert.equal(snapshot.phase, EXPECTED_SCENARIOS[id][0], id + " reaches its phase");
    assert.equal(snapshot.view ? snapshot.view.kind : null, EXPECTED_SCENARIOS[id][1], id + " reaches its page");
    assert.equal(run.runtime.consoleCalls.length, 0, id + " writes nothing to the console");
    assert.equal(run.runtime.storageCalls.length, 0, id + " touches no browser storage");
    const page = run.mount.children[0];
    assert.ok(page && page.getAttribute("data-phase") === snapshot.phase, id + " renders its phase");
    const text = surface(run.mount);
    const copy = run.copy;
    switch (id) {
      case "loading":
        assert.equal(run.outcome, "held");
        assert.equal(byClass(run.mount, "cr-skeleton").length, 1, "loading renders the skeleton");
        break;
      case "error": {
        const retry = byAttribute(run.mount, "data-action", "retry")[0];
        assert.ok(retry, "the error state offers retry");
        assert.ok(text.includes(copy.errorBody));
        retry.fire("click");
        await run.controller.idle();
        assert.equal(run.controller.snapshot().phase, "ready", "retry loads the page once the source answers");
        break;
      }
      case "link-closed":
        assert.ok(text.includes(copy.linkClosedTitle));
        assert.equal(byAttribute(run.mount, "data-portal", "sign-in").length + portalLinks(run.mount).length, 0, "without PORTAL_URL a closed link offers no portal line");
        break;
      case "link-closed-portal": {
        assert.ok(text.includes(copy.linkClosedTitle) && text.includes(copy.linkClosedBody));
        const aside = byAttribute(run.mount, "data-portal", "sign-in")[0];
        assert.ok(aside && surface(aside).includes(copy.linkClosedPortal), "with PORTAL_URL a closed link of unknown reason adds a secondary sign-in line");
        assert.equal(portalLinks(aside)[0].getAttribute("href"), run.runtime.CR.fixtures.portalUrl);
        assert.ok(!text.includes(copy.portalTitle), "and promises no portal access");
        break;
      }
      case "details-checking": {
        const card = byClass(run.mount, "cr-state")[0];
        assert.equal(card.getAttribute("data-checking"), "active", "an agreement in CLIENT_DETAILS_RECEIVED shows the checking state");
        assert.equal(card.getAttribute("role"), null, "the checking card is redrawn on every read, so it is not itself a live region");
        assert.ok(text.includes(copy.checkingTitle) && text.includes(copy.checkingBody));
        assert.ok(!text.includes(copy.preparingTitle), "the checking state no longer says the agreement is being prepared");
        assert.equal(byAttribute(run.mount, "data-action", "refresh").length, 0, "while it re-reads on its own it offers no refresh");
        assert.equal(run.timers.pending, 1, "the next read is scheduled");
        assert.equal(run.live.textContent, "", "opening the link on a checking agreement announces nothing beyond the page");
        break;
      }
      case "details-checking-slow": {
        const card = byClass(run.mount, "cr-state")[0];
        assert.equal(card.getAttribute("data-checking"), "slow");
        assert.ok(text.includes(copy.checkingSlowTitle) && text.includes(copy.checkingSlowBody), "a spent budget says the check is taking longer than usual");
        assert.equal(byAttribute(run.mount, "data-action", "refresh").length, 1, "and offers Refresh status");
        assert.deepEqual(run.timers.waits, [300, 300, 300], "the preview scenario runs a shortened budget");
        assert.equal(run.timers.pending, 0, "and stops re-reading");
        assert.ok(run.live.textContent.includes(copy.checkingSlowTitle), "the change is announced");
        break;
      }
      case "details-returned": {
        const notice = byAttribute(run.mount, "data-returned", "fields")[0];
        assert.ok(notice && surface(notice).includes(copy.detailsReturnedTitle) && surface(notice).includes(copy.detailsReturnedReenter), "a reopened link says the details must be entered again, the marked fields being why they came back");
        assert.equal(notice.getAttribute("data-form"), "fresh");
        assert.ok(!surface(notice).includes(copy.detailsReturnedBody), "and does not ask to fix fields the form no longer holds");
        const reopened = run.controller.snapshot().details.values;
        assert.equal(reopened.LEGAL_NAME, "Harbourview Strata Corporation", "with contacts and addresses returned as ids only, the Legal Name is the one pre-filled value");
        assert.deepEqual(["BILLING_ADDRESS", "REPRESENTATIVE_FIRST_NAME", "REPRESENTATIVE_EMAIL", "REPRESENTATIVE_PHONE"].map((code) => reopened[code]), ["", "", "", ""]);
        assert.equal(notice.getAttribute("role"), null, "the notice is page content; the live region announces a return that happens while the page is open");
        const shell = run.mount.children[0].children[0];
        assert.ok(shell.children.indexOf(notice) < shell.children.indexOf(byClass(run.mount, "cr-form-card")[0]), "the notice stands above the form");
        for (const [code, key] of [["CLIENT_TYPE", "returnedMissing"], ["REPRESENTATIVE_EMAIL", "returnedEmail"], ["AUTHORITY_CONFIRMED", "returnedUnconfirmed"]]) {
          const field = fieldNamed(run.mount, code);
          assert.equal(field.getAttribute("data-state"), "invalid", code + " is marked");
          assert.equal(controlOf(field).getAttribute("aria-invalid"), "true", code + " is invalid for assistive technology");
          assert.equal(errorOf(field).textContent, copy[key], code + " says what came back");
        }
        for (const code of ["LEGAL_NAME", "BILLING_ADDRESS", "REPRESENTATIVE_PHONE", "INFORMATION_CONFIRMED"]) {
          assert.equal(fieldNamed(run.mount, code).getAttribute("data-state"), "idle", code + " is not marked");
        }
        assert.doesNotMatch(visibleText(run.mount), /_INVALID|CLIENT_DETAILS_ERRORS/, "no raw code reaches the page");
        break;
      }
      case "details-returned-processing": {
        const notice = byAttribute(run.mount, "data-returned", "processing")[0];
        assert.ok(notice && surface(notice).includes(copy.detailsProcessingTitle) && surface(notice).includes(copy.detailsProcessingReenter), "PROCESSING_FAILED on a reopened link has its own wording and asks for the details again");
        assert.equal(notice.getAttribute("data-form"), "fresh");
        assert.equal(notice.getAttribute("data-state"), "info", "and is not presented as the client's mistake");
        assert.ok(!surface(notice).includes(copy.detailsReturnedBody) && !surface(notice).includes(copy.detailsProcessingBody));
        assert.equal(all(run.mount, (node) => String(node.className).split(/\s+/).includes("cr-field") && node.getAttribute("data-state") === "invalid").length, 0, "no field is marked");
        assert.ok(!visibleText(run.mount).includes("PROCESSING_FAILED"));
        break;
      }
      case "details-returned-unknown": {
        const notice = byAttribute(run.mount, "data-returned", "unexplained")[0];
        assert.ok(notice && surface(notice).includes(copy.detailsReturnedUnknownReenter), "an unknown code on a reopened link produces the generic line and asks for the details again");
        assert.ok(!surface(notice).includes(copy.detailsReturnedUnknown), "not the wording for a form that still holds what was sent");
        assert.ok(!visibleText(run.mount).includes("TAX_NUMBER_MISSING"), "never the raw code");
        assert.equal(all(run.mount, (node) => String(node.className).split(/\s+/).includes("cr-field") && node.getAttribute("data-state") === "invalid").length, 0);
        break;
      }
      case "details-returned-sent": {
        const notice = byAttribute(run.mount, "data-returned", "processing")[0];
        assert.ok(notice && surface(notice).includes(copy.detailsProcessingBody), "a return after sending in this session keeps the wording for the form that holds what was typed");
        assert.equal(notice.getAttribute("data-form"), "sent");
        assert.ok(!surface(notice).includes(copy.detailsProcessingReenter));
        const values = run.controller.snapshot().details.values;
        assert.deepEqual([values.BILLING_ADDRESS, values.REPRESENTATIVE_PHONE, values.CLIENT_TYPE, values.AUTHORITY_CONFIRMED], ["1500 Harbour Green Drive, Suite 210, Vancouver, BC V6C 3T8", "+1 604 555 0164", "ORGANIZATION", true], "and the form holds what the client typed");
        assert.ok(run.live.textContent.includes(copy.detailsProcessingTitle), "the return is announced");
        assert.equal(run.timers.pending, 0);
        break;
      }
      case "details-closed":
        assert.ok(text.includes(copy.closedAfterDetailsBody), "a link that closes after the details were checked says so without claiming acceptance");
        assert.equal(run.timers.pending, 0, "the page stops re-reading once the link closes");
        assert.ok(run.live.textContent.includes(copy.closedAfterTitle), "the link closing while the page checks is announced");
        assert.equal(byAttribute(run.mount, "data-portal", "invitation").length, 0, "no portal access is promised after the details step");
        assert.equal(run.sent.length, 1);
        assert.deepEqual(run.sent[0][3], {
          LEGAL_NAME: "Harbourview Strata Corporation", CLIENT_TYPE: "ORGANIZATION",
          BILLING_ADDRESS: "1500 Harbour Green Drive, Suite 210, Vancouver, BC V6C 3T8, Canada",
          REPRESENTATIVE_FIRST_NAME: "Dana", REPRESENTATIVE_LAST_NAME: "Reyes",
          REPRESENTATIVE_EMAIL: "dana.reyes@harbourview.example", REPRESENTATIVE_PHONE: "+1 604 555 0164",
          INFORMATION_CONFIRMED: true, AUTHORITY_CONFIRMED: true,
        }, "the details travel as event metadata, trimmed, with the optional empty job title left out");
        assert.deepEqual(run.sent[0].slice(0, 3), ["document", 5205, "AWAITING_CLIENT_DETAILS-CLIENT_DETAILS_RECEIVED"]);
        break;
      case "partial":
        assert.ok(text.includes("1 option could not be loaded"), "partial data is announced");
        break;
      case "quote-review": {
        const unaddressed = byAttribute(run.mount, "aria-labelledby", "cr-property-661")[0];
        assert.ok(surface(unaddressed).includes(copy.addressUnavailable) && surface(unaddressed).includes("Option 1"), "absent planned fields render neutral labels");
        assert.equal(byClass(run.mount, "cr-summary__item").length, 5);
        assert.equal(run.sent.length, 0, "opening the page sends no event");
        break;
      }
      case "view-pending":
        assert.equal(run.outcome, "held");
        assert.equal(byClass(run.mount, "cr-note--pending").length, 1, "the view event shows as pending");
        assert.deepEqual(run.sent.map((call) => call[2]), ["QUOTE_SENT-QUOTE_VIEWED"], "opening an unviewed option sends the view event once");
        break;
      case "view-failed":
        assert.ok(text.includes(copy.viewFailed));
        assert.ok(byAttribute(run.mount, "data-action", "option.view")[0], "a failed view event can be tried again");
        break;
      case "approve-confirm":
        assert.ok(text.includes(copy.approveConfirmOthers), "approval explains that the provider declines the other options");
        assert.equal(run.sent.length, 0, "the confirmation step sends nothing");
        break;
      case "changes-invalid":
        assert.ok(text.includes(copy.changesRequired));
        assert.equal(run.sent.length, 0, "a change request without a message is not sent");
        break;
      case "command-pending": {
        assert.equal(run.outcome, "held");
        const confirm = byAttribute(run.mount, "data-action", "option.confirm")[0];
        assert.equal(confirm.getAttribute("data-state"), "pending");
        assert.notEqual(confirm.getAttribute("disabled"), null, "a pending command cannot be sent again from the page");
        assert.equal(confirm.textContent, copy.sendingLabel);
        confirm.fire("click");
        run.controller.dispatch("option.confirm", { id: 3102 });
        await tick();
        assert.equal(run.sent.length, 1, "a second confirm while pending sends nothing");
        break;
      }
      case "command-refused":
        assert.ok(text.includes("This option was revised by the provider after you opened it."), "the server's refusal message is shown");
        assert.equal(run.controller.snapshot().view.properties[0].options[1].status, "viewed", "a refusal assumes no state change");
        assert.equal(run.timers.pending, 0, "a refused command is not followed");
        break;
      case "command-failed":
        assert.ok(text.includes(copy.failedBody));
        assert.ok(byAttribute(run.mount, "data-action", "refresh").length > 0, "a failed command offers a status refresh, not a blind resend");
        assert.equal(run.timers.pending, 0, "a failed command is not followed");
        break;
      case "command-stale-pending": {
        const card = byAttribute(run.mount, "aria-labelledby", "cr-property-278")[0];
        const confirm = byAttribute(card, "data-action", "option.confirm")[0];
        assert.equal(run.controller.snapshot().commands["order:3102"].status, "pending", "an accepted decision whose readback still shows the option undecided stays pending");
        assert.equal(confirm.getAttribute("data-state"), "pending");
        assert.notEqual(confirm.getAttribute("disabled"), null, "and cannot be sent again");
        assert.equal(confirm.textContent, copy.sendingLabel);
        run.controller.dispatch("option.confirm", { id: 3102 });
        run.controller.dispatch("option.intent", { id: 3102, kind: "decline" });
        await tick();
        assert.deepEqual(run.sent.map((call) => call[2]), ["QUOTE_VIEWED-CLIENT_APPROVED"], "no second decision leaves the page");
        assert.equal(run.timers.pending, 1, "the page keeps reading");
        assert.equal(run.live.textContent, "", "a pending decision makes no announcement of its own");
        break;
      }
      case "command-unconfirmed":
      case "view-unconfirmed": {
        const orderId = id === "command-unconfirmed" ? 3102 : 3101;
        const body = byAttribute(run.mount, "id", "cr-option-" + orderId)[0];
        const note = byAttribute(body, "data-command", "unconfirmed")[0];
        assert.ok(note && surface(note).includes(copy.commandUnconfirmed), id + ": an accepted command not seen within the budget says so");
        assert.equal(byAttribute(note, "data-action", "refresh").length, 1, "and offers Refresh status");
        assert.equal(["option.approve", "option.decline", "option.changes", "option.confirm", "option.view"].reduce((count, action) => count + byAttribute(body, "data-action", action).length, 0), 0, "without offering the command again");
        assert.equal(byClass(body, "cr-note--pending").length, 0);
        assert.equal(run.controller.snapshot().commands["order:" + orderId].status, "unconfirmed");
        assert.equal(run.timers.pending, 0, "the page stops reading on its own");
        assert.ok(run.live.textContent.includes(copy.commandUnconfirmed), "the fallback is announced");
        assert.equal(run.sent.length, 1);
        run.controller.dispatch("option.toggle", { id: orderId });
        run.controller.dispatch("option.toggle", { id: orderId });
        run.controller.dispatch("option.view", { id: orderId });
        run.controller.dispatch("option.intent", { id: orderId, kind: "approve" });
        run.controller.dispatch("option.confirm", { id: orderId });
        await tick();
        assert.equal(run.sent.length, 1, "reopening or deciding the option again sends nothing");
        break;
      }
      case "details-stale-checking":
        assert.equal(run.sent.length, 1);
        assert.equal(byAttribute(run.mount, "data-returned", "processing").length + byClass(run.mount, "cr-form-card").length, 0, "an accepted submit whose readback still shows the old return never shows the returned form");
        assert.equal(byClass(run.mount, "cr-state")[0].getAttribute("data-checking"), "active");
        assert.ok(run.live.textContent.includes(copy.checkingTitle), "the checking state is announced");
        assert.equal(run.timers.pending, 1);
        break;
      case "details-stale-slow":
        assert.equal(byClass(run.mount, "cr-state")[0].getAttribute("data-checking"), "slow", "without a newer read the budget ends in the slow check");
        assert.equal(byAttribute(run.mount, "data-returned", "processing").length + byClass(run.mount, "cr-form-card").length, 0, "never in the stale returned form");
        assert.equal(byAttribute(run.mount, "data-action", "refresh").length, 1);
        assert.equal(run.timers.pending, 0);
        break;
      case "details-stale-closed":
        assert.ok(text.includes(copy.closedAfterDetailsBody), "a stale readback is followed until the link closes after the details");
        assert.equal(run.timers.pending, 0);
        assert.ok(run.live.textContent.includes(copy.closedAfterTitle));
        break;
      case "agreement-unconfirmed": {
        const card = byClass(run.mount, "cr-approve")[0];
        const note = byAttribute(card, "data-command", "unconfirmed")[0];
        assert.ok(note && surface(note).includes(copy.commandUnconfirmed), "an accepted approval not seen within the budget says so");
        assert.equal(byAttribute(card, "data-action", "agreement.approve").length + byAttribute(card, "data-action", "agreement.confirm").length, 0, "and does not offer approval again");
        assert.equal(run.timers.pending, 0);
        assert.ok(run.live.textContent.includes(copy.commandUnconfirmed));
        run.controller.dispatch("agreement.intent");
        run.controller.dispatch("agreement.confirm");
        await tick();
        assert.deepEqual(run.sent.map((call) => call[2]), ["SENT_TO_CLIENT-CLIENT_APPROVED"], "one approval left the page");
        break;
      }
      case "decided": {
        const notice = byAttribute(run.mount, "data-decided", "settled")[0];
        assert.ok(notice && surface(notice).includes(copy.decidedTitle) && surface(notice).includes(copy.decidedBody), "a link opened on a fully decided package keeps today's card");
        assert.equal(byAttribute(notice, "data-action", "refresh").length, 1, "with Check again");
        assert.equal(notice.getAttribute("role"), "status", "and today's status role");
        assert.equal(run.timers.pending, 0, "and does not re-read on its own: the page did not cause that state");
        break;
      }
      case "decided-following": {
        const notice = byAttribute(run.mount, "data-decided", "following")[0];
        assert.ok(notice && surface(notice).includes(copy.decidedTitle) && surface(notice).includes(copy.decidedFollowingBody), "after the page's own last decision the card says the page updates on its own");
        assert.equal(byAttribute(notice, "data-action", "refresh").length, 0, "and offers no Check again while it re-reads");
        assert.equal(notice.getAttribute("role"), null, "it is redrawn on every read, so it is not itself a live region");
        assert.ok(byClass(notice, "cr-notice__icon--busy").length === 1, "its icon shows that the page is working");
        assert.equal(run.timers.pending, 1, "the next read is scheduled");
        assert.ok(run.live.textContent.includes(copy.decidedFollowingBody), "and the wait is announced");
        assert.deepEqual(run.sent.map((call) => call[2]), ["QUOTE_SENT-QUOTE_VIEWED", "QUOTE_VIEWED-CLIENT_APPROVED"]);
        break;
      }
      case "decided-following-slow": {
        const notice = byAttribute(run.mount, "data-decided", "settled")[0];
        assert.ok(notice && surface(notice).includes(copy.decidedBody), "a spent budget falls back to today's card");
        assert.equal(byAttribute(notice, "data-action", "refresh").length, 1, "with Check again");
        assert.deepEqual(run.timers.waits, [300, 300, 300], "the preview scenario runs a shortened budget");
        assert.equal(run.timers.pending, 0, "and stops re-reading");
        assert.ok(run.live.textContent.includes(copy.decidedBody), "the fallback is announced");
        break;
      }
      case "decided-next-step":
        assert.ok(text.includes(copy.detailsTitle), "the details step follows the last decision on its own");
        assert.equal(byAttribute(run.mount, "data-decided", "following").length + byAttribute(run.mount, "data-decided", "settled").length, 0);
        assert.equal(run.timers.pending, 0, "and the page stops re-reading");
        assert.ok(run.live.textContent.includes(copy.detailsTitle), "the move is announced");
        assert.deepEqual(run.timers.waits, [plain(run.runtime.CR.checkingDelays)[0]], "one wait of the checking backoff was enough");
        break;
      case "details-invalid":
        assert.ok(all(run.mount, (node) => node.getAttribute("data-state") === "invalid" && String(node.className).includes("cr-field")).length >= 3, "validation marks the missing fields");
        assert.ok(text.includes(copy.detailsInvalid));
        assert.equal(run.sent.length, 0, "invalid details are not sent");
        break;
      case "details-refused": {
        const email = all(run.mount, (node) => node.getAttribute("data-code") === "REPRESENTATIVE_EMAIL")[0];
        assert.equal(email.getAttribute("data-state"), "invalid");
        assert.ok(surface(email).includes("This address cannot receive mail."), "a server refusal for one attribute shows at that field");
        break;
      }
      case "option-open": {
        const card = byAttribute(run.mount, "aria-labelledby", "cr-property-278")[0];
        const rows = byClass(card, "cr-breakdown__row").map((row) => [row.getAttribute("data-kind"), row.children[1].textContent]);
        assert.deepEqual(rows, [["subtotal", formatCad(8750)], ["taxes", formatCad(437.5)]], "an open option shows the server subtotal and taxes above its total");
        break;
      }
      case "agreement-review": {
        const priced = byAttribute(run.mount, "aria-labelledby", "cr-property-278")[0];
        assert.equal(byClass(priced, "cr-breakdown__row").length, 2, "agreement tables show subtotal and taxes when the server returns them");
        const bare = byAttribute(run.mount, "aria-labelledby", "cr-property-661")[0];
        assert.equal(byClass(bare, "cr-breakdown").length, 0, "an option whose server returns neither field shows no breakdown");
        assert.equal(byClass(bare, "cr-total").length, 1, "and still shows its total");
        const panel = byAttribute(run.mount, "aria-labelledby", "cr-terms-title")[0];
        assert.ok(byClass(panel, "cr-terms__heading").length > 0, "written terms keep their headings");
        assert.ok(byClass(panel, "cr-terms__paragraph").length > 0, "their paragraphs");
        assert.equal(byClass(panel, "cr-terms__list").length, 1, "and one list for their consecutive items");
        assert.ok(!surface(panel).includes(copy.termsEmpty), "and the empty note stays away");
        break;
      }
      case "agreement-no-terms": {
        const panel = byAttribute(run.mount, "aria-labelledby", "cr-terms-title")[0];
        assert.ok(surface(panel).includes(copy.termsEmpty), "an agreement whose terms were never written keeps the designed empty note");
        assert.equal(byClass(panel, "cr-terms__heading").length + byClass(panel, "cr-terms__paragraph").length + byClass(panel, "cr-terms__list").length, 0, "and draws no term block");
        break;
      }
      case "contract-details":
        for (const [code, key, name] of [["INFORMATION_CONFIRMED", "confirmInformationStatement", "Information Confirmation"], ["AUTHORITY_CONFIRMED", "confirmAuthorityStatement", "Authority Confirmation"]]) {
          const field = all(run.mount, (node) => node.getAttribute("data-code") === code)[0];
          assert.ok(surface(field).includes(copy[key]), code + " reads as an explicit statement");
          assert.ok(!surface(field).includes(name), code + " no longer shows its attribute name");
        }
        break;
      case "completion": {
        const invitation = byAttribute(run.mount, "data-portal", "invitation")[0];
        assert.ok(invitation && surface(invitation).includes(copy.portalTitle), "completion invites the client to the portal");
        assert.ok(visibleText(invitation).includes("dana.reyes@harbourview.example"), "naming the primary email the link returned");
        assert.equal(portalLinks(run.mount).length, 0, "without PORTAL_URL there is no portal button");
        break;
      }
      case "completion-portal": {
        const link = portalLinks(run.mount)[0];
        assert.ok(link, "with PORTAL_URL completion offers the portal");
        assert.equal(link.tagName, "A", "as a link, because it navigates");
        assert.equal(link.getAttribute("href"), run.runtime.CR.fixtures.portalUrl);
        assert.equal(link.textContent, copy.portalOpen);
        assert.ok(byAttribute(run.mount, "data-portal", "invitation")[0].children.includes(link), "inside the invitation");
        break;
      }
      case "completion-finishing": {
        assert.ok(text.includes(copy.completeApprovedTitle) && text.includes(copy.completeFinishingBody), "ACTIVATION_FAILED shows the approval recorded and the provider finishing the setup");
        const badge = byClass(run.mount, "status-badge")[0];
        assert.equal(badge.textContent, copy.agreementApproved);
        assert.ok(String(badge.className).includes("status-badge--ok"));
        assert.equal(byClass(run.mount, "cr-state").length + byClass(run.mount, "cr-outcome").length + byClass(run.mount, "status-badge--danger").length + byClass(run.mount, "status-badge--warn").length, 0, "with no error styling and no unavailable state");
        const invitation = byAttribute(run.mount, "data-portal", "invitation")[0];
        assert.ok(visibleText(invitation).includes(copy.portalBody) && !visibleText(invitation).includes("@"), "without a primary email in the link the invitation names none");
        assert.equal(portalLinks(invitation).length, 1);
        break;
      }
      case "approval-closed": {
        assert.ok(text.includes(copy.closedAfterApprovalBody), "a link that closes right after approval says so");
        const invitation = byAttribute(run.mount, "data-portal", "invitation")[0];
        assert.ok(invitation && surface(invitation).includes(copy.portalTitle), "and carries the portal invitation");
        assert.ok(visibleText(invitation).includes("dana.reyes@harbourview.example"), "with the primary email the link returned before it closed");
        assert.equal(portalLinks(invitation)[0].getAttribute("href"), run.runtime.CR.fixtures.portalUrl);
        assert.deepEqual(run.sent.map((call) => call[2]), ["SENT_TO_CLIENT-CLIENT_APPROVED"]);
        break;
      }
      case "agreement-numbered-terms": {
        const panel = byAttribute(run.mount, "aria-labelledby", "cr-terms-title")[0];
        const lists = byClass(panel, "cr-terms__clauses");
        assert.equal(lists.length, 2, "consecutive clauses form one list, and the bullet items between them end it");
        for (const list of lists) {
          assert.equal(list.tagName, "OL");
          assert.equal(list.getAttribute("role"), "list", "the ordered list keeps its list role without list markers");
        }
        const items = byClass(panel, "cr-terms__clause");
        assert.deepEqual(items.map((item) => byClass(item, "cr-terms__number")[0].textContent), ["1.", "2.", "2.1", "2.2", "3.", "3.1)", "3.2)", "3.3)", "4.", "5.", "5.1.", "5.1.1"], "numbers show as written");
        assert.deepEqual(items.map((item) => item.getAttribute("data-depth")), ["1", "1", "2", "2", "1", "2", "2", "2", "1", "1", "2", "3"], "and keep their depth");
        assert.ok(items.every((item) => item.children.every((child) => child.children.length === 0)), "each clause is a number and a text node");
        assert.equal(byClass(panel, "cr-terms__list").length, 1, "the - items between them still render as a bullet list");
        assert.equal(byClass(panel, "cr-terms__paragraph").length, 0, "no numbered line falls back to prose");
        break;
      }
      case "agreement-confirm":
        assert.ok(text.includes(copy.agreementConfirmTitle));
        assert.equal(run.sent.length, 0);
        break;
      default:
        break;
    }
  }
}

{
  const { CR } = loadRuntime({ fixtures: true });
  const account = plain(CR.fixtures.agreementData("CLIENT_APPROVED", false).accounts[0]);
  const emailOf = (mutate) => { const row = plain(account); mutate(row); return CR.normalizer.primaryEmail(row); };
  assert.equal(emailOf(() => {}), "dana.reyes@harbourview.example", "the portal sign-in is the PRIMARY contact's EMAIL entry");
  assert.equal(emailOf((row) => { delete row.contacts; }), "", "a link that returns no contacts names no email");
  assert.equal(emailOf((row) => { row.contacts = [{ id: 7 }]; }), "", "an id-only contact names no email");
  assert.equal(emailOf((row) => { row.contacts[0].type.code = "BILLING"; }), "", "only a PRIMARY contact carries the sign-in");
  assert.equal(emailOf((row) => { row.contacts[0].contactEntries.push({ value: "office@harbourview.example", type: { code: "EMAIL" } }); }), "", "two primary emails, which provisioning refuses, name none");
  assert.equal(emailOf((row) => { row.contacts[0].contactEntries[0].value = "  "; }), "", "a blank entry is not an email");
  assert.equal(emailOf((row) => { row.contacts.push({ type: { code: "SECONDARY" }, contactEntries: [{ value: "x@y.example", type: { code: "EMAIL" } }] }); }), "dana.reyes@harbourview.example", "another contact's email is not the sign-in");

  const invitations = [];
  for (const withUser of [false, true]) {
    const runtime = loadRuntime({ fixtures: true });
    const mount = runtime.document.createElement("div");
    const controller = runtime.CR.createController({ adapter: runtime.CR.fixtures.createFixtureAdapter(runtime.CR.fixtures.agreementData("CLIENT_APPROVED", withUser), {}), mount, timers: fakeTimers(), locale: "en-CA" });
    controller.start();
    await controller.idle();
    invitations.push(surface(byAttribute(mount, "data-portal", "invitation")[0]));
  }
  assert.equal(invitations[0], invitations[1], "the invitation reads the same whether or not Account.user is already linked at readback");
}

async function checkingController(options = {}) {
  const runtime = loadRuntime({ fixtures: true });
  const { CR } = runtime;
  const data = CR.fixtures.quotationData(options.state || "CLIENT_DETAILS_RECEIVED", options.orderStates || CR.fixtures.decidedStates);
  const adapter = CR.fixtures.createFixtureAdapter(data, { hooks: options.hooks || { details: "hold" } });
  const counts = { reads: 0, failNext: false };
  const introspect = adapter.introspect;
  adapter.introspect = () => {
    counts.reads += 1;
    if (counts.failNext) {
      counts.failNext = false;
      return Promise.reject(CR.adapter.reviewError("failed", 503));
    }
    return introspect();
  };
  const timers = fakeTimers();
  const live = runtime.document.createElement("p");
  const mount = runtime.document.createElement("div");
  const controller = CR.createController({ adapter, mount, live, timers, pollDelays: options.pollDelays, locale: "en-CA" });
  controller.start();
  await controller.idle();
  return { runtime, CR, data, adapter, counts, timers, live, mount, controller, copy: controller.copy };
}

{
  const run = await checkingController();
  const { controller, timers, counts, live, mount, copy, data } = run;
  const delays = plain(run.CR.checkingDelays);
  const budget = delays.reduce((sum, ms) => sum + ms, 0);
  assert.ok(budget >= 60000 && budget <= 90000, "the checking budget is " + budget + " ms, within 60 to 90 s");
  assert.ok(delays.every((ms, index) => index === 0 || ms >= delays[index - 1]), "the waits back off");
  assert.equal(controller.snapshot().view.kind, "checking");
  assert.equal(counts.reads, 1);
  for (let poll = 1; poll <= delays.length; poll += 1) {
    assert.equal(timers.pending, 1, "one read is scheduled at a time");
    if (poll === 3) counts.failNext = true;
    timers.fire();
    assert.equal(timers.pending, 0, "nothing else is scheduled while a read is in flight");
    await controller.idle();
    assert.equal(counts.reads, poll + 1, "every wait ends in exactly one read");
    assert.equal(controller.snapshot().view && controller.snapshot().view.kind, "checking", "a failed read while checking keeps the checking state");
  }
  assert.deepEqual(timers.waits, delays, "the reads follow the backoff");
  assert.equal(timers.now, budget, "and end when the budget is spent");
  assert.equal(timers.pending, 0);
  assert.equal(controller.snapshot().waiting.exhausted, true);
  assert.ok(surface(mount).includes(copy.checkingSlowTitle));
  assert.ok(live.textContent.includes(copy.checkingSlowTitle), "running out of budget is announced");
  byAttribute(mount, "data-action", "refresh")[0].fire("click");
  await controller.idle();
  assert.equal(counts.reads, delays.length + 2, "Refresh status reads once");
  assert.equal(timers.pending, 0, "and does not restart the budget");
  assert.equal(controller.snapshot().waiting.exhausted, true);

  data.documents[0].states = [{ code: "AWAITING_CLIENT_DETAILS" }];
  data.documents[0].attributes[17].CLIENT_DETAILS_ERRORS = { value: "PROCESSING_FAILED" };
  byAttribute(mount, "data-action", "refresh")[0].fire("click");
  await controller.idle();
  assert.equal(controller.snapshot().view.kind, "contract-details", "the page moves to whatever it reads");
  assert.equal(controller.snapshot().waiting.exhausted, false);
  assert.ok(live.textContent.includes(copy.detailsProcessingTitle), "leaving the checking state is announced");
  assert.equal(timers.pending, 0);
}

{
  const run = await checkingController({ state: "AWAITING_CLIENT_DETAILS", hooks: { detailsCodes: ["REPRESENTATIVE_PHONE", "CLIENT_TYPE_INVALID", "SOMETHING_NEW"] } });
  const { controller, timers, live, mount, copy } = run;
  assert.equal(byAttribute(mount, "data-returned", "fields").length, 0, "details awaited for the first time carry no notice");
  controller.dispatch("details.choose", { code: "CLIENT_TYPE", value: "ORGANIZATION" });
  controller.dispatch("details.choose", { code: "INFORMATION_CONFIRMED", value: true });
  controller.dispatch("details.choose", { code: "AUTHORITY_CONFIRMED", value: true });
  controller.dispatch("details.input", { code: "REPRESENTATIVE_JOB_TITLE", value: "Council President" });
  controller.dispatch("details.submit");
  await controller.idle();
  assert.equal(controller.snapshot().view.kind, "checking", "right after the details are sent the page checks them");
  assert.ok(live.textContent.includes(copy.checkingTitle), "and announces it");
  assert.equal(timers.pending, 1);
  timers.fire();
  await controller.idle();
  const snapshot = controller.snapshot();
  assert.equal(snapshot.view.kind, "contract-details", "returned details bring the form back");
  assert.deepEqual([snapshot.details.values.CLIENT_TYPE, snapshot.details.values.REPRESENTATIVE_JOB_TITLE, snapshot.details.values.AUTHORITY_CONFIRMED], ["ORGANIZATION", "Council President", true], "with what the client entered");
  assert.equal(snapshot.details.serverErrors.REPRESENTATIVE_PHONE, copy.returnedMissing);
  assert.equal(snapshot.details.serverErrors.CLIENT_TYPE, copy.returnedChoice);
  const notice = byAttribute(mount, "data-returned", "fields")[0];
  assert.ok(surface(notice).includes(copy.detailsReturnedBody) && surface(notice).includes(copy.detailsReturnedUnexplained), "an unknown code next to known ones adds the generic line");
  assert.equal(notice.getAttribute("data-form"), "sent", "the form holds what this session sent, so the notice keeps asking to fix the marked fields");
  assert.ok(!visibleText(mount).includes("SOMETHING_NEW"));
  assert.ok(live.textContent.includes(copy.detailsReturnedTitle), "the return is announced");
  assert.equal(timers.pending, 0, "and the page stops re-reading");
  const phone = fieldNamed(mount, "REPRESENTATIVE_PHONE");
  assert.equal(phone.getAttribute("data-state"), "invalid");
  controlOf(phone).value = "+1 604 555 0199";
  controlOf(phone).fire("input");
  assert.equal(controller.snapshot().details.serverErrors.REPRESENTATIVE_PHONE, undefined, "correcting a marked field clears its mark");
  assert.equal(phone.getAttribute("data-state"), "idle");
  controller.dispatch("refresh", {});
  await controller.idle();
  assert.equal(controller.snapshot().details.serverErrors.REPRESENTATIVE_PHONE, undefined, "a refresh does not put back a mark the client already answered");
  assert.equal(controller.snapshot().details.serverErrors.CLIENT_TYPE, copy.returnedChoice);
  assert.equal(controller.snapshot().details.values.REPRESENTATIVE_PHONE, "+1 604 555 0199");
}

{
  const run = await checkingController({ state: "AWAITING_CLIENT_DETAILS" });
  const { controller, timers, data, adapter, copy } = run;
  const sendEvent = adapter.sendEvent;
  adapter.sendEvent = (...args) => sendEvent(...args).then((result) => {
    data.documents[0].states = [{ code: "AWAITING_CLIENT_DETAILS" }];
    data.documents[0].attributes[17].CLIENT_DETAILS_ERRORS = { value: "REPRESENTATIVE_EMAIL_INVALID" };
    return result;
  });
  controller.dispatch("details.choose", { code: "CLIENT_TYPE", value: "ORGANIZATION" });
  controller.dispatch("details.choose", { code: "INFORMATION_CONFIRMED", value: true });
  controller.dispatch("details.choose", { code: "AUTHORITY_CONFIRMED", value: true });
  controller.dispatch("details.submit");
  await controller.idle();
  assert.equal(controller.snapshot().view.kind, "contract-details");
  assert.equal(controller.snapshot().details.serverErrors.REPRESENTATIVE_EMAIL, copy.returnedEmail, "a return the hook finished before the readback still marks its field");
  assert.equal(timers.pending, 0);
}

{
  const runtime = loadRuntime({ fixtures: true });
  const data = runtime.CR.fixtures.quotationData("AWAITING_CLIENT_DETAILS", runtime.CR.fixtures.decidedStates);
  data.documents[0].attributes[17].CLIENT_DETAILS_ERRORS = { value: "LEGAL_NAME" };
  data.grant.types = data.grant.types.map((type) => (type.entityType === "Document" ? Object.assign({}, type, { events: [] }) : type));
  const mount = runtime.document.createElement("div");
  const controller = runtime.CR.createController({ adapter: runtime.CR.fixtures.createFixtureAdapter(data, {}), mount, timers: fakeTimers(), locale: "en-CA" });
  controller.start();
  await controller.idle();
  assert.equal(byAttribute(mount, "data-returned", "fields").length, 0, "a link that cannot send the details again does not ask the client to");
  assert.ok(surface(mount).includes(controller.copy.detailsUnavailable));
}

{
  const run = await checkingController({ pollDelays: [1] });
  const { controller, timers, counts, data, mount, copy } = run;
  await drain(controller, timers);
  assert.equal(controller.snapshot().waiting.exhausted, true);
  counts.failNext = true;
  byAttribute(mount, "data-action", "refresh")[0].fire("click");
  await controller.idle();
  assert.equal(controller.snapshot().phase, "error", "a manual refresh that fails shows the error");
  assert.ok(surface(mount).includes(copy.readbackErrorBody), "worded as a read after the details reached the provider");
  data.closed = true;
  byAttribute(mount, "data-action", "retry")[0].fire("click");
  await controller.idle();
  assert.equal(controller.snapshot().phase, "link-closed");
  assert.equal(controller.snapshot().closedAfter, "details", "a link that closes while the details are checked reads as closed after the details, also on retry");
}

{
  const run = await checkingController();
  const { controller, timers, data, live, copy } = run;
  assert.equal(timers.pending, 1);
  data.documents[0].states = [{ code: "DRAFT" }];
  await controller.reload({});
  assert.equal(controller.snapshot().view.kind, "preparing", "DRAFT after the check shows as today");
  assert.equal(timers.pending, 0, "a read that leaves the checking state cancels the scheduled one");
  assert.ok(live.textContent.includes(copy.preparingTitle), "and the move is announced");
}

async function decideLast(controller, kind) {
  controller.dispatch("option.toggle", { id: 3108 });
  await controller.idle();
  controller.dispatch("option.intent", { id: 3108, kind });
  if (kind === "changes") controller.dispatch("option.draft", { id: 3108, value: "Please quote weekly visits." });
  controller.dispatch("option.confirm", { id: 3108 });
  await controller.idle();
}

{
  const lastOpen = plain(loadRuntime({ fixtures: true }).CR.fixtures.lastOpenStates);
  const run = await checkingController({ state: "QUOTATION_SENT", orderStates: lastOpen, hooks: { evaluation: "hold" } });
  const { controller, timers, counts, live, mount, copy, data } = run;
  assert.equal(controller.snapshot().view.allDecided, false);
  assert.equal(timers.pending, 0, "an undecided package is not followed");
  await decideLast(controller, "approve");
  assert.equal(controller.snapshot().view.kind, "quote-review");
  assert.equal(controller.snapshot().view.allDecided, true);
  assert.equal(controller.snapshot().waiting.decisions, true, "the page follows its own last decision");
  assert.ok(live.textContent.includes(copy.decidedFollowingBody), "and announces that it waits");
  const delays = plain(run.CR.checkingDelays);
  const readsBefore = counts.reads;
  for (let poll = 1; poll <= delays.length; poll += 1) {
    assert.equal(timers.pending, 1, "one read is scheduled at a time");
    if (poll === 2) counts.failNext = true;
    timers.fire();
    assert.equal(timers.pending, 0, "nothing else is scheduled while a read is in flight");
    await controller.idle();
    assert.equal(counts.reads, readsBefore + poll, "every wait ends in exactly one read");
    assert.equal(controller.snapshot().view && controller.snapshot().view.kind, "quote-review", "a failed read while following keeps the decided page");
  }
  assert.deepEqual(timers.waits, delays, "the decisions are followed with the checking backoff");
  assert.equal(controller.snapshot().waiting.exhausted, true);
  const settled = byAttribute(mount, "data-decided", "settled")[0];
  assert.ok(settled && surface(settled).includes(copy.decidedBody), "a spent budget falls back to today's card");
  assert.ok(live.textContent.includes(copy.decidedBody), "and says so");
  byAttribute(mount, "data-action", "refresh")[0].fire("click");
  await controller.idle();
  assert.equal(counts.reads, readsBefore + delays.length + 1, "Check again reads once");
  assert.equal(timers.pending, 0, "and does not restart the budget");
  data.documents[0].states = [{ code: "AWAITING_CLIENT_DETAILS" }];
  byAttribute(mount, "data-action", "refresh")[0].fire("click");
  await controller.idle();
  assert.equal(controller.snapshot().view.kind, "contract-details", "the page renders whatever it reads");
  assert.equal(controller.snapshot().waiting.decisions, false);
  assert.ok(live.textContent.includes(copy.detailsTitle), "and the move is announced");
}

{
  const lastOpen = plain(loadRuntime({ fixtures: true }).CR.fixtures.lastOpenStates);
  const run = await checkingController({ state: "QUOTATION_SENT", orderStates: lastOpen, hooks: { evaluation: "hold" } });
  const { controller, timers, adapter, data, live, copy } = run;
  const sendEvent = adapter.sendEvent;
  adapter.sendEvent = (...args) => sendEvent(...args).then((result) => {
    if (args[2] === "QUOTE_VIEWED-CLIENT_APPROVED") data.documents[0].states = [{ code: "AWAITING_CLIENT_DETAILS" }];
    return result;
  });
  await decideLast(controller, "approve");
  assert.equal(controller.snapshot().view.kind, "contract-details", "an evaluation that finished before the readback lands on the details step at once");
  assert.equal(timers.pending, 0);
  assert.ok(live.textContent.includes(copy.detailsTitle), "and the move is announced like one the page waited for");
}

{
  const declined = Object.fromEntries([3101, 3102, 3103, 3104, 3105, 3106, 3107, 3109, 3110].map((id) => [id, "DECLINED"]));
  const run = await checkingController({ state: "QUOTATION_SENT", orderStates: declined, hooks: {} });
  const { controller, timers, live, copy } = run;
  await decideLast(controller, "decline");
  assert.equal(controller.snapshot().waiting.decisions, true, "a last decline that decides the package is followed too");
  timers.fire();
  await controller.idle();
  assert.equal(controller.snapshot().view.kind, "closed", "a package with no approval moves on to its closed state");
  assert.ok(live.textContent.includes(copy.canceledTitle));
  assert.equal(timers.pending, 0);
}

{
  const lastOpen = plain(loadRuntime({ fixtures: true }).CR.fixtures.lastOpenStates);
  const run = await checkingController({ state: "QUOTATION_SENT", orderStates: lastOpen, hooks: { evaluation: "hold" } });
  const { controller, timers, data } = run;
  await decideLast(controller, "approve");
  data.closed = true;
  timers.fire();
  await controller.idle();
  assert.equal(controller.snapshot().phase, "link-closed");
  assert.equal(controller.snapshot().closedAfter, "", "a link that closes while decisions are followed reads as a closed link, not as closed after the details");
  assert.equal(timers.pending, 0);
}

{
  const lastOpen = plain(loadRuntime({ fixtures: true }).CR.fixtures.lastOpenStates);
  const run = await checkingController({ state: "QUOTATION_SENT", orderStates: lastOpen, hooks: {} });
  const { controller, timers } = run;
  await decideLast(controller, "changes");
  assert.equal(controller.snapshot().view.properties.find((property) => property.key === "property-661").status, "changes");
  assert.equal(controller.snapshot().waiting.decisions, false, "a change request decides nothing, so nothing is followed");
  assert.equal(timers.pending, 0);
}

{
  const runtime = loadRuntime({ fixtures: true });
  const data = runtime.CR.fixtures.idOnlyAccount(runtime.CR.fixtures.agreementData("CLIENT_APPROVED", true));
  const mount = runtime.document.createElement("div");
  const controller = runtime.CR.createController({ adapter: runtime.CR.fixtures.createFixtureAdapter(data, {}), mount, timers: fakeTimers(), locale: "en-CA" });
  controller.start();
  await controller.idle();
  const invitation = byAttribute(mount, "data-portal", "invitation")[0];
  assert.ok(visibleText(invitation).includes(controller.copy.portalBody) && !visibleText(invitation).includes("@"), "contacts returned as ids only, as the link returns them today, leave the invitation on its no-email wording");
  assert.equal(controller.snapshot().primaryEmail, "");
}

async function stagedController(build, behavior = {}, pollDelays) {
  const runtime = loadRuntime({ fixtures: true });
  const { CR } = runtime;
  const data = build(CR.fixtures);
  const adapter = CR.fixtures.createFixtureAdapter(data, behavior);
  const counts = { reads: 0 };
  const introspect = adapter.introspect;
  adapter.introspect = () => { counts.reads += 1; return introspect(); };
  const sent = [];
  const sendEvent = adapter.sendEvent;
  adapter.sendEvent = (...args) => { sent.push(plain(args)); return sendEvent(...args); };
  const timers = fakeTimers();
  const live = runtime.document.createElement("p");
  const mount = runtime.document.createElement("div");
  const controller = CR.createController({ adapter, mount, live, timers, pollDelays, locale: "en-CA" });
  controller.start();
  await controller.idle();
  return { runtime, CR, data, adapter, counts, sent, timers, live, mount, controller, copy: controller.copy };
}

const returnedWith = (errors) => (F) => {
  const data = F.idOnlyAccount(F.quotationData("AWAITING_CLIENT_DETAILS", F.decidedStates));
  data.documents[0].attributes[17].CLIENT_DETAILS_ERRORS = { value: errors };
  return data;
};

async function sendDetails(controller) {
  for (const [code, value] of [["BILLING_ADDRESS", "1500 Harbour Green Drive, Vancouver"], ["REPRESENTATIVE_FIRST_NAME", "Dana"], ["REPRESENTATIVE_LAST_NAME", "Reyes"], ["REPRESENTATIVE_EMAIL", "dana.reyes@harbourview.example"], ["REPRESENTATIVE_PHONE", "+1 604 555 0164"]]) {
    controller.dispatch("details.input", { code, value });
  }
  controller.dispatch("details.choose", { code: "CLIENT_TYPE", value: "ORGANIZATION" });
  controller.dispatch("details.choose", { code: "INFORMATION_CONFIRMED", value: true });
  controller.dispatch("details.choose", { code: "AUTHORITY_CONFIRMED", value: true });
  controller.dispatch("details.submit");
  await controller.idle();
}

const kindOf = (run) => run.controller.snapshot().view && run.controller.snapshot().view.kind;
const staleForm = (run) => byAttribute(run.mount, "data-returned", "processing").length + byClass(run.mount, "cr-form-card").length;

{
  const run = await stagedController(returnedWith("PROCESSING_FAILED"), { staleReads: 1 });
  assert.ok(byAttribute(run.mount, "data-returned", "processing")[0], "the earlier return shows before the new submit");
  await sendDetails(run.controller);
  assert.equal(run.sent.length, 1);
  assert.equal(kindOf(run), "checking", "a first readback that still shows the earlier return does not roll the page back");
  assert.equal(staleForm(run), 0, "and the stale returned form does not come back");
  assert.ok(run.live.textContent.includes(run.copy.checkingTitle));
  assert.equal(run.timers.pending, 1, "the page follows the submit with the checking budget");
  run.timers.fire();
  await run.controller.idle();
  assert.equal(run.controller.snapshot().phase, "link-closed");
  assert.equal(run.controller.snapshot().closedAfter, "details", "the revoked link reads as closed after the details, as on agreement 138");
  assert.equal(run.timers.pending, 0);
}

{
  const run = await stagedController(returnedWith("PROCESSING_FAILED"), { staleReads: 1, hooks: { detailsCodes: ["REPRESENTATIVE_PHONE"] } });
  await sendDetails(run.controller);
  assert.equal(kindOf(run), "checking");
  run.timers.fire();
  await run.controller.idle();
  assert.equal(kindOf(run), "contract-details", "CLIENT_DETAILS_ERRORS that differ from the ones held at submit prove a completed cycle");
  const notice = byAttribute(run.mount, "data-returned", "fields")[0];
  assert.ok(notice && notice.getAttribute("data-form") === "sent", "and the new return shows with the typed values held");
  assert.equal(run.controller.snapshot().details.serverErrors.REPRESENTATIVE_PHONE, run.copy.returnedMissing);
  assert.equal(run.controller.snapshot().details.values.REPRESENTATIVE_PHONE, "+1 604 555 0164");
  assert.equal(run.timers.pending, 0);
}

{
  const run = await stagedController(returnedWith("PROCESSING_FAILED"), { staleReads: 1, hooks: { details: "processing-failed", settleAfter: 3 } });
  await sendDetails(run.controller);
  assert.equal(kindOf(run), "checking");
  run.timers.fire();
  await run.controller.idle();
  assert.equal(kindOf(run), "checking", "a read of CLIENT_DETAILS_RECEIVED keeps checking");
  run.timers.fire();
  await run.controller.idle();
  assert.equal(kindOf(run), "contract-details", "after CLIENT_DETAILS_RECEIVED was seen, AWAITING_CLIENT_DETAILS with the same errors is a completed cycle");
  const notice = byAttribute(run.mount, "data-returned", "processing")[0];
  assert.ok(notice && notice.getAttribute("data-form") === "sent");
  assert.ok(run.live.textContent.includes(run.copy.detailsProcessingTitle));
  assert.equal(run.timers.pending, 0);
}

{
  const run = await stagedController(returnedWith("PROCESSING_FAILED"), { hooks: { details: "hold" } });
  const sendEvent = run.adapter.sendEvent;
  run.adapter.sendEvent = (...args) => sendEvent(...args).then((result) => {
    run.data.documents[0].states = [{ code: "AWAITING_CLIENT_DETAILS" }];
    run.data.documents[0].attributes[17].CLIENT_DETAILS_ERRORS = { value: "" };
    return result;
  });
  await sendDetails(run.controller);
  assert.equal(kindOf(run), "contract-details", "a change of CLIENT_DETAILS_ERRORS to empty also proves a completed cycle");
  assert.equal(byAttribute(run.mount, "data-returned", "processing").length + byAttribute(run.mount, "data-returned", "fields").length, 0, "and the form shows without a return notice");
  assert.equal(run.timers.pending, 0);
}

{
  const run = await stagedController(returnedWith("PROCESSING_FAILED"), { staleReads: 99 }, [1, 1]);
  await sendDetails(run.controller);
  await drain(run.controller, run.timers);
  assert.equal(kindOf(run), "checking");
  assert.equal(run.controller.snapshot().waiting.exhausted, true);
  assert.equal(byClass(run.mount, "cr-state")[0].getAttribute("data-checking"), "slow", "no evidence within the budget ends in the slow check");
  assert.equal(staleForm(run), 0, "never in the stale returned form");
  const reads = run.counts.reads;
  byAttribute(run.mount, "data-action", "refresh")[0].fire("click");
  await run.controller.idle();
  assert.equal(run.counts.reads, reads + 1, "Refresh status reads once");
  assert.equal(byClass(run.mount, "cr-state")[0].getAttribute("data-checking"), "slow", "and a read that is still stale keeps the slow check");
  assert.equal(staleForm(run), 0);
}

{
  const run = await stagedController(returnedWith("PROCESSING_FAILED"), { hooks: { revokeOnDetails: false, settleAfter: 1 } });
  await sendDetails(run.controller);
  assert.equal(kindOf(run), "preparing", "a readback in any state other than the two details states is rendered as it is");
  assert.equal(run.timers.pending, 0);
}

for (const [kind, orderId, event, status] of [
  ["view", 3101, "QUOTE_SENT-QUOTE_VIEWED", "viewed"],
  ["approve", 3102, "QUOTE_VIEWED-CLIENT_APPROVED", "approved"],
  ["decline", 3102, "QUOTE_VIEWED-DECLINED", "declined"],
  ["changes", 3102, "QUOTE_VIEWED-CUSTOMER_CHANGES_REQUESTED", "changes"],
]) {
  const run = await stagedController((F) => F.quotationData(), { staleReads: 1 });
  const { controller } = run;
  const optionOf = () => controller.snapshot().view.properties[0].options.find((option) => option.id === orderId);
  controller.dispatch("option.toggle", { id: orderId });
  await controller.idle();
  if (kind !== "view") {
    controller.dispatch("option.intent", { id: orderId, kind });
    if (kind === "changes") controller.dispatch("option.draft", { id: orderId, value: "Please quote weekly visits." });
    controller.dispatch("option.confirm", { id: orderId });
    await controller.idle();
  }
  assert.deepEqual(run.sent.map((call) => call[2]), [event], kind + " left the page once");
  assert.equal(optionOf().state, event.split("-")[0], kind + ": the first readback still shows the source state");
  assert.equal((controller.snapshot().commands["order:" + orderId] || {}).status, "pending", kind + " stays pending instead of being offered again");
  const body = byAttribute(run.mount, "id", "cr-option-" + orderId)[0];
  const offered = all(body, (node) => ["option.approve", "option.decline", "option.changes", "option.confirm", "option.view"].includes(node.getAttribute("data-action")) && node.getAttribute("disabled") === null);
  assert.equal(offered.length, 0, kind + ": nothing in the option can be sent again");
  if (kind === "view") assert.equal(byClass(body, "cr-note--pending").length, 1, "the view shows as pending");
  controller.dispatch("option.toggle", { id: orderId });
  controller.dispatch("option.toggle", { id: orderId });
  controller.dispatch("option.view", { id: orderId });
  controller.dispatch("option.intent", { id: orderId, kind: "approve" });
  controller.dispatch("option.confirm", { id: orderId });
  await tick();
  assert.equal(run.sent.length, 1, kind + ": no path sends it again while it is pending");
  assert.equal(run.timers.pending, 1, kind + " is followed with the checking budget");
  run.timers.fire();
  await controller.idle();
  assert.equal(optionOf().status, status, kind + " lands once a read shows it");
  assert.equal(controller.snapshot().commands["order:" + orderId], undefined);
  assert.equal(run.timers.pending, 0);
}

{
  const run = await stagedController((F) => F.quotationData(), { staleReads: 3 }, [1]);
  const { controller } = run;
  controller.dispatch("option.toggle", { id: 3102 });
  await controller.idle();
  controller.dispatch("option.intent", { id: 3102, kind: "approve" });
  controller.dispatch("option.confirm", { id: 3102 });
  await controller.idle();
  await drain(controller, run.timers);
  assert.equal((controller.snapshot().commands["order:3102"] || {}).status, "unconfirmed", "an accepted decision not seen within the budget falls back to Refresh status");
  assert.ok(run.live.textContent.includes(run.copy.commandUnconfirmed));
  const refresh = () => byAttribute(byAttribute(run.mount, "id", "cr-option-3102")[0], "data-action", "refresh")[0].fire("click");
  refresh();
  await controller.idle();
  assert.equal((controller.snapshot().commands["order:3102"] || {}).status, "unconfirmed", "a read that is still stale keeps it");
  assert.equal(run.timers.pending, 0, "and does not restart the budget");
  refresh();
  await controller.idle();
  assert.equal(controller.snapshot().view.properties[0].options[1].status, "approved", "the first fresh read lands it");
  assert.equal(controller.snapshot().commands["order:3102"], undefined);
  assert.equal(run.sent.length, 1);
}

{
  const run = await stagedController((F) => F.quotationData());
  const { controller, data } = run;
  const order = () => data.orders.find((row) => row.id === 3102);
  const sendEvent = run.adapter.sendEvent;
  run.adapter.sendEvent = (...args) => sendEvent(...args).then((result) => {
    order().states = [{ code: "QUOTE_VIEWED" }];
    data.unreadable = [3102];
    return result;
  });
  controller.dispatch("option.toggle", { id: 3102 });
  await controller.idle();
  controller.dispatch("option.intent", { id: 3102, kind: "approve" });
  controller.dispatch("option.confirm", { id: 3102 });
  await controller.idle();
  assert.equal(controller.snapshot().view.unreadableOrders, 1, "the readback misses the decided option");
  assert.equal((controller.snapshot().commands["order:3102"] || {}).status, "pending", "which keeps its decision pending rather than taken as seen");
  data.unreadable = [];
  run.timers.fire();
  await controller.idle();
  controller.dispatch("option.toggle", { id: 3102 });
  await controller.idle();
  const body = byAttribute(run.mount, "id", "cr-option-3102")[0];
  assert.equal(run.sent.length, 1, "reopening the option sends nothing");
  assert.equal(all(body, (node) => ["option.approve", "option.decline", "option.changes", "option.confirm"].includes(node.getAttribute("data-action")) && node.getAttribute("disabled") === null).length, 0, "so a later read that shows it undecided offers nothing again");
  order().states = [{ code: "CLIENT_APPROVED" }];
  run.timers.fire();
  await controller.idle();
  assert.equal(controller.snapshot().commands["order:3102"], undefined, "it lands once a read shows the decision");
}

{
  const run = await stagedController((F) => F.quotationData(), { staleReads: 2 }, [1]);
  const { controller } = run;
  for (const orderId of [3102, 3107]) {
    controller.dispatch("option.toggle", { id: orderId });
    await controller.idle();
    controller.dispatch("option.intent", { id: orderId, kind: "approve" });
    controller.dispatch("option.confirm", { id: orderId });
    await controller.idle();
    if (orderId === 3102) {
      await drain(controller, run.timers);
      assert.equal((controller.snapshot().commands["order:3102"] || {}).status, "unconfirmed");
    }
  }
  assert.equal((controller.snapshot().commands["order:3107"] || {}).status, "pending", "a new command after a spent budget gets a budget of its own");
  assert.equal(run.timers.pending, 1, "and the page reads again");
  assert.equal(controller.snapshot().commands["order:3102"], undefined, "while the earlier one lands on the next read that shows it");
}

{
  const run = await stagedController((F) => F.agreementData("SENT_TO_CLIENT", false), { staleReads: 1 });
  const { controller } = run;
  controller.dispatch("agreement.intent");
  controller.dispatch("agreement.confirm");
  await controller.idle();
  assert.equal(kindOf(run), "agreement-review", "the first readback still shows the agreement awaiting approval");
  assert.equal((controller.snapshot().commands["document:5205"] || {}).status, "pending");
  const confirm = byAttribute(run.mount, "data-action", "agreement.confirm")[0];
  assert.ok(confirm && confirm.getAttribute("disabled") !== null && confirm.textContent === run.copy.sendingLabel, "the approval shows as pending");
  controller.dispatch("agreement.confirm");
  controller.dispatch("agreement.intent");
  await tick();
  assert.equal(run.sent.length, 1, "and is not sent again");
  run.timers.fire();
  await controller.idle();
  assert.equal(kindOf(run), "completion", "the approval lands on the completion page");
  assert.ok(run.live.textContent.includes(run.copy.completeApprovedTitle), "which is announced, since it arrived on its own");
  assert.equal(run.timers.pending, 0);
}

{
  const run = await stagedController((F) => F.agreementData("SENT_TO_CLIENT", false), { staleReads: 1, hooks: { revokeOnApproval: true } });
  const { controller } = run;
  controller.dispatch("agreement.intent");
  controller.dispatch("agreement.confirm");
  await controller.idle();
  assert.equal(kindOf(run), "agreement-review");
  run.timers.fire();
  await controller.idle();
  assert.equal(controller.snapshot().phase, "link-closed");
  assert.equal(controller.snapshot().closedAfter, "approval", "a link revoked after a stale approval readback reads as closed after the approval");
}

{
  const run = await stagedController((F) => F.quotationData("QUOTATION_SENT", F.lastOpenStates), { staleReads: 1 });
  const { controller } = run;
  controller.dispatch("option.toggle", { id: 3108 });
  await controller.idle();
  run.timers.fire();
  await controller.idle();
  controller.dispatch("option.intent", { id: 3108, kind: "approve" });
  controller.dispatch("option.confirm", { id: 3108 });
  await controller.idle();
  assert.equal(controller.snapshot().view.allDecided, false, "the stale readback does not show the last decision yet");
  assert.equal((controller.snapshot().commands["order:3108"] || {}).status, "pending");
  await drain(controller, run.timers);
  assert.equal(kindOf(run), "contract-details", "once the decision lands the page follows it to the details step");
  assert.ok(run.live.textContent.includes(run.copy.detailsTitle));
}

{
  const run = await checkingController();
  const { controller, timers, counts, mount } = run;
  assert.equal(timers.pending, 1);
  controller.stop();
  assert.equal(timers.pending, 0, "stop cancels the scheduled read");
  const page = mount.children[0];
  await controller.reload({});
  assert.equal(mount.children[0], page, "a stopped controller no longer draws into its mount");
  assert.equal(timers.pending, 0, "and schedules nothing");
  assert.equal(counts.reads, 2);
}

{
  const runtime = loadRuntime({ fixtures: true });
  const data = runtime.CR.fixtures.quotationData();
  delete data.orders.find((row) => row.id === 3102).totalTaxes;
  const mount = runtime.document.createElement("div");
  const controller = runtime.CR.createController({ adapter: runtime.CR.fixtures.createFixtureAdapter(data, {}), mount, locale: "en-CA" });
  controller.start();
  await controller.idle();
  controller.dispatch("option.toggle", { id: 3102 });
  await controller.idle();
  const card = byAttribute(mount, "aria-labelledby", "cr-property-278")[0];
  assert.deepEqual(byClass(card, "cr-breakdown__row").map((row) => row.getAttribute("data-kind")), ["subtotal"], "a totalTaxes the server does not return hides the taxes row, and nothing is computed in its place");
  assert.ok(surface(card).includes(formatCad(9187.5)), "the option total stays the server grandTotal");
}

{
  const runtime = loadRuntime({ fixtures: true });
  const data = runtime.CR.fixtures.quotationData();
  const orderItems = [];
  const productPrices = {};
  const products = {};
  data.orders.forEach((order) => {
    order.items = order.items.map((line) => {
      const price = line.itemPrice;
      const product = price.product;
      orderItems.push({ id: line.id, sortOrder: line.sortOrder, itemCount: line.itemCount, amount: line.amount, itemPrice: { id: price.id } });
      productPrices[price.id] = { id: price.id, product: { id: product.id } };
      products[product.id] = product;
      return { id: line.id };
    });
  });
  data.grant.types.push(
    { entityType: "OrderItem", canRead: true, canWrite: false, events: [] },
    { entityType: "ProductPrice", canRead: true, canWrite: false, events: [] },
    { entityType: "Product", canRead: true, canWrite: false, events: [] },
  );
  const serverAdapter = runtime.CR.fixtures.createFixtureAdapter(data, {});
  const TOKEN = "grant-token-8f3a1c+/=";
  const encoded = encodeURIComponent(TOKEN);
  const calls = [];
  let hold = null;
  let eventReply = null;
  const reply = (status, body) => ({ status, ok: status >= 200 && status < 300, text: () => Promise.resolve(body === undefined ? "" : JSON.stringify(body)) });
  const fetch = async (url, init) => {
    calls.push({ url, init });
    const prefix = "https://core.example/";
    assert.ok(url.startsWith(prefix), "every request goes to the configured origin");
    const route = url.slice(prefix.length).split("?")[0].replace("/i/" + encoded + "/", "/i/TOKEN/");
    const query = new URLSearchParams(url.split("?")[1] || "");
    const body = init.body ? JSON.parse(init.body) : null;
    const answer = (work) => work.then((value) => reply(200, value), (error) => reply(error.status || 500, { message: error.serverMessage || "" }));
    if (route === "core/i/TOKEN/introspect.json") return answer(serverAdapter.introspect());
    if (route === "core/i/TOKEN/document/list.json") return answer(serverAdapter.list("document").then((result) => ({ result })));
    if (route === "core-acct/i/TOKEN/account/list.json") return answer(serverAdapter.list("account").then((result) => ({ result })));
    if (route === "core-bill/i/TOKEN/order/list.json") return answer(serverAdapter.list("order").then((result) => ({ result })));
    if (route === "core-bill/i/TOKEN/order-item/list.json") return reply(200, { result: orderItems });
    if (route === "core-pim/i/TOKEN/product-price/list.json") return reply(200, { result: Object.values(productPrices) });
    if (route === "core-pim/i/TOKEN/product/list.json") return reply(200, { result: Object.values(products) });
    if (route === "core-bill/i/TOKEN/order/get.json") return answer(serverAdapter.get("order", Number(query.get("id"))));
    if (route === "core-bill/i/TOKEN/order/event.json") {
      if (eventReply) return eventReply;
      if (hold) await hold.promise;
      return answer(serverAdapter.sendEvent("order", body.id, body.event, body.metadata).then(() => ({})));
    }
    return reply(404, {});
  };
  const mount = runtime.document.createElement("div");
  const host = section(runtime.document, { "data-review-data-mode": "live", "data-review-api-base": "https://core.example" });
  runtime.CR.fixtures.setup = () => { throw new Error("live mode consulted the fixtures"); };
  const controller = runtime.CR.boot(host, { location: { hash: "#token=" + encoded }, fetch, mount, locale: "en-CA" });
  await controller.idle();
  assert.equal(controller.snapshot().phase, "ready", "live mode reads the package through the grant endpoints, never the fixtures loaded beside it");
  assert.deepEqual(plain(controller.snapshot().view.properties[0].options[1].lines.map((line) => line.product)), ["Snow Removal", "Rock Salt De-Icing"], "live mode joins shallow order items through all three additional grant entities");
  for (const suffix of ["/order-item/list.json", "/product-price/list.json", "/product/list.json"]) assert.ok(calls.some((call) => call.url.endsWith(suffix)), "live mode reads " + suffix + " through the grant");

  const toggle = byAttribute(mount, "data-focus-key", "toggle-3102")[0];
  toggle.fire("click");
  byAttribute(mount, "data-action", "option.approve")[0].fire("click");
  let release;
  hold = { promise: new Promise((resolve) => { release = resolve; }) };
  const introspections = () => calls.filter((call) => call.url.endsWith("/introspect.json")).length;
  const before = introspections();
  const confirm = byAttribute(mount, "data-action", "option.confirm")[0];
  confirm.fire("click");
  confirm.fire("click");
  controller.dispatch("option.confirm", { id: 3102 });
  await tick();
  assert.equal(calls.filter((call) => call.url.endsWith("/order/event.json")).length, 1, "three confirms while the first is in flight send one event");
  assert.equal(controller.snapshot().commands["order:3102"].status, "pending");
  release();
  await controller.idle();
  assert.ok(introspections() > before, "a successful event is followed by a full re-read");
  const approvedView = controller.snapshot().view;
  assert.deepEqual(plain(approvedView.properties[0].options.map((option) => option.status)), ["declined", "approved", "declined"], "the page renders the read-back state, hooks included");
  assert.equal(controller.snapshot().commands["order:3102"], undefined, "no local outcome outlives the read-back");
  const eventCall = calls.find((call) => call.url.endsWith("/order/event.json"));
  assert.deepEqual(JSON.parse(eventCall.init.body), { id: 3102, event: "QUOTE_VIEWED-CLIENT_APPROVED", metadata: {} }, "an event is sent as { id, event, metadata }");

  hold = null;
  eventReply = reply(409, { message: "No longer awaiting your decision" });
  byAttribute(mount, "data-focus-key", "toggle-3107")[0].fire("click");
  byAttribute(mount, "data-action", "option.changes")[0].fire("click");
  const area = byAttribute(mount, "data-focus-key", "draft-3107")[0];
  area.value = "  Please quote weekly visits.  ";
  area.fire("input");
  const beforeRefusal = introspections();
  byAttribute(mount, "data-action", "option.confirm")[0].fire("click");
  await controller.idle();
  const changeCall = calls.filter((call) => call.url.endsWith("/order/event.json")).pop();
  assert.deepEqual(JSON.parse(changeCall.init.body).metadata, { MESSAGE: "Please quote weekly visits." }, "a change request carries its trimmed message as MESSAGE metadata");
  assert.equal(controller.snapshot().commands["order:3107"].status, "refused");
  assert.ok(surface(mount).includes("No longer awaiting your decision"), "the refusal message comes from the server");
  assert.equal(introspections(), beforeRefusal, "a refusal is not dressed up by a silent re-read");

  eventReply = null;
  for (const call of calls) {
    const [address, query = ""] = call.url.split("?");
    assert.ok(address.includes("/i/" + encoded + "/"), "the token travels only as the grant path segment");
    assert.ok(!query.includes(TOKEN) && !query.includes(encoded), "the token never appears in a query string");
    assert.equal(call.init.method, "POST");
    assert.equal(call.init.credentials, "omit", "grant requests are anonymous");
    assert.equal(call.init.headers.Authorization, undefined);
    assert.ok(!String(call.init.body).includes(TOKEN) && !String(call.init.body).includes(encoded), "the token is never sent in a body");
  }
  assert.ok(!surface(mount).includes(TOKEN) && !surface(mount).includes(encoded), "the token never reaches the page");
  assert.equal(runtime.consoleCalls.length, 0, "the token path writes nothing to the console");
  assert.equal(runtime.storageCalls.length, 0, "the token is never stored");

  const revoked = loadRuntime();
  const closedFetch = async (url) => { calls.push({ url }); return reply(401, {}); };
  const closed = revoked.CR.boot(section(revoked.document, { "data-review-data-mode": "live", "data-review-api-base": "https://core.example" }), { location: { hash: "#token=abc" }, fetch: closedFetch, mount: revoked.document.createElement("div"), locale: "en-CA" });
  await closed.idle();
  assert.equal(closed.snapshot().phase, "link-closed", "introspection 401 means the link expired or was revoked");

  for (const [attributes, hash, phase] of [
    [{ "data-review-data-mode": "live", "data-review-api-base": "https://core.example" }, "", "link-missing"],
    [{ "data-review-data-mode": "live", "data-review-api-base": "http://core.example" }, "#token=abc", "unconfigured"],
    [{ "data-review-data-mode": "fixture", "data-review-api-base": "https://core.example" }, "#token=abc", "unconfigured"],
  ]) {
    const isolated = loadRuntime();
    let fetched = 0;
    const booted = isolated.CR.boot(section(isolated.document, attributes), { location: { hash }, fetch: () => { fetched += 1; }, mount: isolated.document.createElement("div"), locale: "en-CA" });
    await booted.idle();
    assert.equal(booted.snapshot().phase, phase, JSON.stringify(attributes) + " " + hash + " → " + phase);
    assert.equal(fetched, 0, "no request leaves the page in the " + phase + " state");
  }
}

const { exportClientReviewManual } = await import("./export-client-review-manual.mjs");
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "client-review-check-"));
try {
  const outputDir = path.join(tempDir, "client-review-document");
  const first = await exportClientReviewManual({ outputDir });
  const second = await exportClientReviewManual({ outputDir });
  assert.deepEqual(first.template, second.template, "the export is deterministic");
  assert.deepEqual(first.manifest, second.manifest);
  const { template, manifest } = first;
  assert.equal(template.code, "CLIENT_REVIEW_DOCUMENT");
  assert.equal(template.templateLanguage, "JTE");
  const nonCopy = template.parameters.filter((parameter) => parameter.type !== "LOCALIZED_STRING_SS");
  assert.deepEqual(nonCopy.map((parameter) => [parameter.code, parameter.type, parameter.value]), [["REVIEW_API_BASE_URL", "STRING", ""], ["PORTAL_URL", "STRING", ""]], "the API base and the portal address are the only non-copy parameters, and both ship empty");
  assert.match(template.html, /data-review-portal-url="\$\{PORTAL_URL@STRING\}"/, "the portal address reaches the page only through its section attribute");
  assert.match(template.html, /<p class="cr-visually-hidden" role="status" aria-live="polite" aria-atomic="true" data-client-review-live><\/p>/, "the document carries a live region that survives every redraw");
  assert.match(previewPage, /data-client-review-live/, "and so does the preview page");
  assert.deepEqual(manifest.runtime.checkingDelaysMs, plain(loadRuntime().CR.checkingDelays), "the manifest documents the checking backoff the runtime uses");
  assert.ok(manifest.constraints.some((line) => line.startsWith("PORTAL_URL ")), "the manifest states what PORTAL_URL does");
  const copyEntries = loadRuntime().CR.copyEntries;
  assert.deepEqual(template.parameters.filter((parameter) => parameter.type === "LOCALIZED_STRING_SS").map((parameter) => [parameter.code, parameter.value.en]), plain(copyEntries.map((entry) => [entry[0], entry[2]])), "every other parameter is runtime copy with its default");
  for (const parameter of template.parameters) {
    assert.doesNotMatch(parameter.code, /TOKEN|ACCOUNT_ID|ORDER_ID|DOCUMENT_ID|AGREEMENT_ID|USER|ORGANIZATION|SECRET|API_KEY|MAPS/, parameter.code + " must not configure data or credentials");
    assert.ok(parameter.nls.en.DESCRIPTION.trim(), parameter.code + " needs a description in CMS");
  }
  assert.equal(new Set(template.parameters.map((parameter) => parameter.code)).size, template.parameters.length, "parameter codes are unique");
  for (const marker of ["Harbourview", "Coastline", "dana.reyes", "createFixtureAdapter", "quotationData", "5205", "3102"]) {
    assert.ok(!template.javascript.includes(marker) && !template.html.includes(marker), "the CMS document carries no fixture data: " + marker);
  }
  for (const [field, value] of Object.entries({ head: template.head, html: template.html, css: template.css, javascript: template.javascript })) {
    assert.deepEqual(controlCharacterOffsets(value), [], "the CMS " + field + " carries no control character");
  }
  const parsedAsInline = template.javascript.split(String.fromCharCode(0)).join(String.fromCharCode(65533));
  assert.doesNotThrow(() => new vm.Script(parsedAsInline, { filename: "inline-javascript.js" }), "the document javascript still compiles as an HTML parser delivers an inline script");
  assert.match(template.html, /data-review-data-mode="live"/, "the CMS document is live");
  assert.match(template.head, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(template.head, /<meta name="referrer" content="no-referrer">/);
  assert.match(template.javascript, /credentials: "omit"/);
  assert.match(template.javascript, /url\.protocol !== "https:"/, "the document rejects a non-https base");
  assert.doesNotMatch(Object.values({ head: template.head, html: template.html, javascript: template.javascript }).join("\n"), /servicewand\.com|pixelnation\.com/, "no deployment host is baked in");
  assert.equal(manifest.uploadPerformed, false);
  assert.equal(manifest.kind, "client-review-document");
  for (const path of ["/core-bill/i/{token}/order-item/list.json", "/core-pim/i/{token}/product-price/list.json", "/core-pim/i/{token}/product/list.json"]) {
    assert.ok(manifest.api.reads.some((read) => read.includes(path)), "the manual package documents the grant read " + path);
  }
  for (const [field, file] of Object.entries({ head: "root/head.html", html: "root/html.html", css: "root/css.css", javascript: "root/javascript.js" })) {
    const content = await fs.readFile(path.join(outputDir, file), "utf8");
    assert.equal(crypto.createHash("sha256").update(content.replace(/\n$/, ""), "utf8").digest("hex"), manifest.template.sha256[field], file + " matches its manifest digest");
  }
  for (const file of ["cms-family.payload.json", "manual-export-manifest.json", "root/template.json", "root/parameters.json", "preview.html", "README.md"]) {
    assert.ok(existsSync(path.join(outputDir, file)), "the package contains " + file);
  }
  const preview = await fs.readFile(path.join(outputDir, "preview.html"), "utf8");
  assert.match(preview, /data-review-data-mode="fixture"/, "the package preview opens on fixtures without a network");
  assert.match(preview, /createFixtureAdapter/);
  await assert.rejects(exportClientReviewManual({ outputDir: path.join(root, "runtime/escape") }), /may only be written/, "the exporter refuses to write outside dist/manual-upload");

  const exported = loadRuntime();
  const exportedSandbox = { document: exported.document, URL, Intl, Promise, setTimeout, clearTimeout, navigator: { language: "en-CA" }, location: { hash: "#token=abc" } };
  exportedSandbox.window = exportedSandbox;
  exportedSandbox.globalThis = exportedSandbox;
  vm.createContext(exportedSandbox);
  const bootStart = template.javascript.indexOf("(function () {\n  \"use strict\";\n  function ready(");
  assert.ok(bootStart > 0, "the document javascript ends with its boot script");
  vm.runInContext(template.javascript.slice(0, bootStart), exportedSandbox, { filename: "javascript.js" });
  let exportedFetches = 0;
  const unconfigured = exportedSandbox.ClientReview.boot(section(exported.document, { "data-review-data-mode": "live", "data-review-api-base": "$" + "{REVIEW_API_BASE_URL@STRING}", "data-review-portal-url": "$" + "{PORTAL_URL@STRING}" }), { fetch: () => { exportedFetches += 1; }, mount: exported.document.createElement("div"), locale: "en-CA" });
  await unconfigured.idle();
  assert.equal(unconfigured.snapshot().phase, "unconfigured", "the uploaded document without a base reports that it is not set up");
  assert.equal(unconfigured.snapshot().portalUrl, "", "an unresolved PORTAL_URL marker is no portal address");
  assert.equal(exportedFetches, 0);
  for (const [value, expected] of [["https://portal.example.com/sign-in", "https://portal.example.com/sign-in"], ["http://portal.example.com/", ""], ["https://user:pass@portal.example.com/", ""]]) {
    const configured = exportedSandbox.ClientReview.boot(section(exported.document, { "data-review-data-mode": "live", "data-review-api-base": "", "data-review-portal-url": value }), { mount: exported.document.createElement("div"), locale: "en-CA" });
    assert.equal(configured.snapshot().portalUrl, expected, "the uploaded document reads PORTAL_URL " + value + " as " + JSON.stringify(expected));
  }
  assert.equal(exportedSandbox.ClientReview.fixtures, undefined, "the uploaded document has no fixtures to fall back on");

  const committed = path.join(root, "dist/manual-upload/client-review-document");
  for (const file of ["root/head.html", "root/html.html", "root/css.css", "root/javascript.js", "root/parameters.json", "manual-export-manifest.json", "preview.html", "README.md"]) {
    const [fresh, onDisk] = await Promise.all([fs.readFile(path.join(outputDir, file), "utf8"), fs.readFile(path.join(committed, file), "utf8")]);
    assert.equal(onDisk, fresh, "dist/manual-upload/client-review-document/" + file + " is stale; regenerate it with scripts/export-client-review-manual.mjs");
  }
} finally {
  await fs.rm(tempDir, { recursive: true, force: true });
}

console.log("client-review-check ok: " + Object.keys(EXPECTED_SCENARIOS).length + " preview states, every order and agreement state, grouping and counts-only summary, server subtotal and taxes shown only when returned, confirmation statements with description and CMS precedence, grant-gated single-flight commands with read-back, refusals and failures, returned details codes, a bounded one-read-at-a-time checking backoff with announcements, the portal invitation with and without PORTAL_URL, ACTIVATION_FAILED as completion, numbered terms, token only in the grant path, no money arithmetic, innerHTML, eval, console or storage, portal tokens only, and a live-only deterministic CMS package");

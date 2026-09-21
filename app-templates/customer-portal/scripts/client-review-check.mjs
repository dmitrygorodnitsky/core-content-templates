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
    AWAITING_CLIENT_DETAILS: "contract-details", DRAFT: "preparing", PENDING_MANAGEMENT_APPROVAL: "preparing",
    INTERNALLY_APPROVED: "preparing", SENT_TO_CLIENT: "agreement-review", AGREEMENT_SEND_FAILED: "unavailable",
    CLIENT_APPROVED: "completion", ACTIVE: "completion", SUSPENDED: "reference", EXPIRED: "reference",
    ARCHIVED: "closed", CANCELED: "closed",
  };
  assert.deepEqual(Object.keys(EXPECTED_KIND).sort(), plain(contract.agreementStates).sort(), "every agreement state has an expected page");
  const quotationGrant = CR.fixtures.quotationData().grant;
  const agreementGrant = CR.fixtures.agreementData("SENT_TO_CLIENT").grant;
  for (const state of contract.agreementStates.concat(["NOT_A_STATE"])) {
    const data = CR.fixtures.quotationData(state);
    data.grant = { expiresAt: quotationGrant.expiresAt, types: quotationGrant.types.slice(0, 2).concat([{ entityType: "Document", canRead: true, events: agreementGrant.types[2].events.concat(quotationGrant.types[2].events) }]) };
    const view = model(data);
    assert.equal(view.kind, EXPECTED_KIND[state] || "unavailable", state + " selects its page");
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
    const seedEvent = seed.workflows.find((workflow) => workflow.code === contract.agreementWorkflow).events.find((event) => event.code === contract.contractDetails.event);
    assert.deepEqual(plain(contract.contractDetails.attributes), seedEvent.attributes, "the shipped details contract equals the seed's event attributes");
    assert.deepEqual(plain(contract.contractDetails.attributeOrder), seedEvent.attributeOrder, "the shipped details order equals the seed's event attribute order");
    console.log("client-review-check: details contract compared with " + path.relative(process.cwd(), seedPath));
  } else {
    console.log("client-review-check: seed " + seedPath + " not present, details contract not compared");
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
  "command-failed": ["ready", "quote-review"], decided: ["ready", "quote-review"], "contract-details": ["ready", "contract-details"],
  "details-invalid": ["ready", "contract-details"], "details-refused": ["ready", "contract-details"], "details-closed": ["link-closed", null],
  preparing: ["ready", "preparing"], "agreement-review": ["ready", "agreement-review"], "agreement-no-terms": ["ready", "agreement-review"],
  "agreement-confirm": ["ready", "agreement-review"],
  completion: ["ready", "completion"], "completion-portal": ["ready", "completion"], "reference-expired": ["ready", "reference"],
  "closed-canceled": ["ready", "closed"], unavailable: ["ready", "unavailable"],
};

async function runScenario(id) {
  const runtime = loadRuntime({ fixtures: true });
  const mount = runtime.document.createElement("div");
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
  const controller = runtime.CR.boot(host, { scenario: id, mount, locale: "en-CA" });
  const outcome = await settle(runtime.CR.fixtures.play(controller, controller.steps).then(() => controller.idle()));
  return { runtime, mount, controller, sent, outcome, copy: controller.copy };
}

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
        break;
      case "details-closed":
        assert.ok(text.includes(copy.closedAfterDetailsBody), "a link that closes right after the details were sent says so without claiming acceptance");
        assert.equal(run.sent.length, 1);
        assert.deepEqual(run.sent[0][3], {
          LEGAL_NAME: "Harbourview Strata Corporation", CLIENT_TYPE: "ORGANIZATION",
          BILLING_ADDRESS: "1500 Harbour Green Drive, Suite 210, Vancouver, BC V6C 3T8, Canada",
          REPRESENTATIVE_FIRST_NAME: "Dana", REPRESENTATIVE_LAST_NAME: "Reyes",
          REPRESENTATIVE_EMAIL: "dana.reyes@harbourview.example", REPRESENTATIVE_PHONE: "+1 604 555 0164",
          INFORMATION_CONFIRMED: true, AUTHORITY_CONFIRMED: true,
        }, "the details travel as event metadata, trimmed, with the optional empty job title left out");
        assert.deepEqual(run.sent[0].slice(0, 3), ["document", 5205, "AWAITING_CLIENT_DETAILS-DRAFT"]);
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
        break;
      case "command-failed":
        assert.ok(text.includes(copy.failedBody));
        assert.ok(byAttribute(run.mount, "data-action", "refresh").length > 0, "a failed command offers a status refresh, not a blind resend");
        break;
      case "decided":
        assert.ok(text.includes(copy.decidedTitle));
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
      case "completion":
        assert.ok(!text.includes(copy.completePortal), "completion promises no portal access the data does not show");
        break;
      case "completion-portal":
        assert.ok(text.includes(copy.completePortal));
        break;
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
  assert.deepEqual(nonCopy.map((parameter) => [parameter.code, parameter.type, parameter.value]), [["REVIEW_API_BASE_URL", "STRING", ""]], "the API base is the only non-copy parameter and it ships empty");
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
  const unconfigured = exportedSandbox.ClientReview.boot(section(exported.document, { "data-review-data-mode": "live", "data-review-api-base": "$" + "{REVIEW_API_BASE_URL@STRING}" }), { fetch: () => { exportedFetches += 1; }, mount: exported.document.createElement("div"), locale: "en-CA" });
  await unconfigured.idle();
  assert.equal(unconfigured.snapshot().phase, "unconfigured", "the uploaded document without a base reports that it is not set up");
  assert.equal(exportedFetches, 0);
  assert.equal(exportedSandbox.ClientReview.fixtures, undefined, "the uploaded document has no fixtures to fall back on");

  const committed = path.join(root, "dist/manual-upload/client-review-document");
  for (const file of ["root/head.html", "root/html.html", "root/css.css", "root/javascript.js", "root/parameters.json", "manual-export-manifest.json", "preview.html", "README.md"]) {
    const [fresh, onDisk] = await Promise.all([fs.readFile(path.join(outputDir, file), "utf8"), fs.readFile(path.join(committed, file), "utf8")]);
    assert.equal(onDisk, fresh, "dist/manual-upload/client-review-document/" + file + " is stale; regenerate it with scripts/export-client-review-manual.mjs");
  }
} finally {
  await fs.rm(tempDir, { recursive: true, force: true });
}

console.log("client-review-check ok: " + Object.keys(EXPECTED_SCENARIOS).length + " preview states, every order and agreement state, grouping and counts-only summary, server subtotal and taxes shown only when returned, confirmation statements with description and CMS precedence, grant-gated single-flight commands with read-back, refusals and failures, token only in the grant path, no money arithmetic, innerHTML, eval, console or storage, portal tokens only, and a live-only deterministic CMS package");

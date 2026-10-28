import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

process.env.TZ = "America/Vancouver";

const dom = createDom();
globalThis.window = globalThis;
globalThis.document = dom.document;
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
globalThis.location = { href: "https://portal.example.test/pages/SNOWLIMITLESS/portal", origin: "https://portal.example.test", pathname: "/pages/SNOWLIMITLESS/portal", search: "", hash: "" };

const portalRoot = path.resolve("app-templates/customer-portal");
const runtimeRoot = pathToFileURL(path.join(portalRoot, "runtime") + "/");
const load = (file) => import(new URL(file, runtimeRoot));
const { readPortalConfig } = await load("src/config.js");
const { applyPortalConfig, state } = await load("src/state.js");
const { normalizeInvoices } = await load("src/normalizers/invoices.js");
const { renderRoute } = await load("src/router.js");
const { ACTIONS } = await load("src/actions.js");
const { INVOICE_PAYMENT_FORM, createCoreProfileFormAdapter } = await load("src/adapters/core-profile-form-adapter.js");
const { createCoreUserPreferenceAdapter } = await load("src/adapters/core-user-preference-adapter.js");
const { STRIPE_JS_URL, loadStripeJs } = await load("src/adapters/stripe-js-adapter.js");
const payment = await load("src/invoice-payment.js");
const { PAYMENT_COPY, PAYMENT_OUTCOMES, closeInvoicePayment, confirmInvoicePayment, invoicePayable, payInvoice } = payment;

const ORIGIN = "https://portal.example.test";
const SECRET = "pi_3UVYaFQWOX4qwHeX5JowqHAZ_secret_Tst0nly";
const all = (root, selector) => root.querySelectorAll(selector);
const one = (root, selector) => root.querySelector(selector);
const visible = (node) => !!node && !node.hasAttribute("hidden");
const reply = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => structuredClone(body) });
const sheet = () => one(document.body, "[data-module=\"invoice-pay-sheet\"]");
const click = (node) => (node.listeners.click || []).forEach((listener) => listener({ target: node, preventDefault() {} }));

const line = (id, amount, product) => ({ id, amount, itemCount: 1, notes: "Monthly " + product, itemPrice: { id: id + 100, product: { id: id + 200, code: "CODE_" + id, nls: { en: { NAME: product } } } } });
const invoice = (id, stateCode, amountDue, totalPaidAmount = 0) => ({
  id, created: 1793190283996, dueDate: [2026, 11, 12], notes: "dev-1 test invoice", amountDue, totalPaidAmount,
  attributes: { 6: { DATE: { value: "2026-10-28" }, SERVICE_PERIOD: { value: "November 2026" }, PAYMENT_NET_TERMS: { value: 15 } } },
  type: { id: 6, code: "FIXED_RATE" }, states: [{ id: 120, code: stateCode, nls: { en: { NAME: stateCode } } }],
  order: { id: 114, currency: { id: 21, code: "CAD" } }, items: [line(140, 747.99, "Snow Removal"), line(141, 3469.95, "Rock Salt De-Icing")],
});

function configure(dataMode = "live") {
  applyPortalConfig(readPortalConfig({
    dataset: {
      portalVertical: "snow", portalProfile: "stormRetail", portalTheme: "snow", portalDataMode: dataMode, portalAuthMode: "required",
      portalOrganization: "SNOWLIMITLESS", portalAccountTypeCode: "CUSTOMER", portalDefaultRoute: "overview",
      portalNavInvoicesLabel: "Invoices", portalEnabledModules: "overview,properties,appointmentsTimeline,invoices,proposals,profile",
    },
  }));
  state.config.origin = ORIGIN;
  Object.assign(state.session, { authenticated: true, accessToken: "test-token", tokenType: "Bearer", userId: 55, organizationId: 43 });
  state.customerAccount = { id: 732 };
  state.account = "ready";
  state.invoicePayment = null;
}

function invoices(rows) {
  state.moduleData.invoices = normalizeInvoices({ items: rows });
  state.moduleStatus.invoices = "ready";
}

const page = (invoiceId) => { state.invoiceId = invoiceId; state.route = "invoice.detail"; return renderRoute(); };
const payButton = (root) => one(root, "[data-action=\"invoice.pay\"]");

function fakeForms(script) {
  const calls = [];
  return {
    calls,
    async submit(form, values) { calls.push(["submit", form.typeCode, values]); if (script.submitError) throw script.submitError; return 701; },
    async report(form, formId, _context, outcomes) {
      calls.push(["report", form.preference, formId, outcomes.join()]);
      if (script.reportError) throw script.reportError;
      return Object.assign({ form: formId, invoiceId: 47, amount: "4217.94", currency: "CAD", message: "" }, script.report);
    },
  };
}

function fakeStripe(results) {
  const made = { keys: [], mounted: [], confirmed: [], destroyed: 0, listeners: {} };
  const factory = (key) => {
    made.keys.push(key);
    return {
      elements: () => ({
        create: (type, options) => {
          made.created = [type, options];
          return {
            mount: (host) => made.mounted.push(host),
            on: (event, listener) => { made.listeners[event] = listener; },
            destroy: () => { made.destroyed += 1; },
          };
        },
      }),
      confirmCardPayment: async (secret, data) => { made.confirmed.push([secret, Object.keys(data.payment_method)]); return results.shift(); },
    };
  };
  return { made, loadStripe: async () => factory };
}

function harness(script, results = [], replies = {}) {
  const forms = fakeForms(script);
  const stripe = fakeStripe(results);
  const overwrites = [];
  let clock = 0;
  let reads = 0;
  const options = {
    forms,
    preferences: { overwrite: async (key, value) => { overwrites.push([key, value]); return true; } },
    loadStripe: stripe.loadStripe,
    reload: async (moduleId) => {
      reads += 1;
      assert.equal(moduleId, "invoices", "only the invoice list is re-read");
      if (replies.paidAfter && reads >= replies.paidAfter) invoices([invoice(47, "PAID", 4217.94, 4217.94), invoice(46, "PAID", 4217.94)]);
    },
    render: () => {},
    wait: async (ms) => { clock += ms; },
    now: () => clock,
    document,
  };
  return { forms, stripe, overwrites, options, reads: () => reads, clock: () => clock };
}

{
  configure();
  invoices([invoice(47, "SENT", 4217.94), invoice(46, "PAID", 4217.94), invoice(49, "OVERDUE", 747.99), invoice(51, "VOID", 747.99), invoice(52, "SENT", 4217.94, 100), invoice(53, "SENT", 0)]);
  const sent = page("invoice-core-47");
  assert.equal(payButton(sent).textContent, "Pay CA$4,217.94", "a SENT invoice offers to pay its full amount");
  assert.equal(payButton(sent).getAttribute("data-id"), "invoice-core-47");
  assert.match(one(sent, "[data-module=\"invoice-pay\"]").textContent, /Stripe/);
  assert.equal(payButton(page("invoice-core-49")).textContent, "Pay CA$747.99", "an OVERDUE invoice too");
  for (const [id, why] of [["invoice-core-46", "PAID"], ["invoice-core-51", "VOID"], ["invoice-core-52", "partly paid"], ["invoice-core-53", "nothing due"]]) {
    assert.equal(all(page(id), "[data-module=\"invoice-pay\"]").length, 0, "no pay button for a " + why + " invoice");
  }
  assert.equal(invoicePayable(normalizeInvoices({ items: [invoice(8, "DRAFT", 100)] }).items[0]), false, "a DRAFT invoice is never payable");
  assert.equal(invoicePayable(null), false);
  configure("fixture");
  invoices([invoice(47, "SENT", 4217.94)]);
  assert.equal(all(page("invoice-core-47"), "[data-module=\"invoice-pay\"]").length, 0, "fixture mode never offers a card payment");
}

{
  configure();
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith("/form-type/CUSTOMER_INVOICE_PAYMENT/get.json")) return reply(200, { id: 10, code: "CUSTOMER_INVOICE_PAYMENT" });
    if (url.endsWith("/api/form/submit.json")) return reply(200, 701);
    if (url.endsWith("/api/user/preferences.json")) return reply(200, { SNOW_CUSTOMER_INVOICE_PAYMENT: JSON.stringify({ form: 701, outcome: "READY", invoiceId: 47, clientSecret: SECRET, publishableKey: "pk_test_51Tst", amount: "4217.94", currency: "CAD", message: "" }) });
    if (url.endsWith("/api/user/preference.json")) return reply(200, null);
    throw new Error("unexpected request " + url);
  };
  const forms = createCoreProfileFormAdapter({ fetch: fetchImpl, wait: async () => {}, now: () => 0 });
  const ctx = { config: state.config, state };
  assert.deepEqual({ ...INVOICE_PAYMENT_FORM }, { typeCode: "CUSTOMER_INVOICE_PAYMENT", preference: "SNOW_CUSTOMER_INVOICE_PAYMENT" });
  assert.equal(await forms.submit(INVOICE_PAYMENT_FORM, { INVOICE_ID: 47 }, ctx), 701);
  assert.equal(calls[1].url, ORIGIN + "/core-cms/api/form/submit.json");
  assert.equal(calls[1].options.headers.Authorization, "Bearer test-token", "the form is submitted with the session, so Core takes the payer from it");
  assert.equal(calls[1].options.headers["X-Organization-Code"], "SNOWLIMITLESS");
  assert.deepEqual(JSON.parse(calls[1].options.body), { type: { id: 10 }, organization: { id: 43 }, attributes: { 10: { INVOICE_ID: { value: 47 } } }, metadata: { language: "en" } }, "the request carries only the invoice id: no amount, currency, Account or User");
  const report = await forms.report(INVOICE_PAYMENT_FORM, 701, ctx, PAYMENT_OUTCOMES);
  assert.equal(report.clientSecret, SECRET, "the client secret comes back only in the User's own preference");
  assert.equal(calls[2].url, ORIGIN + "/core/api/user/preferences.json");
  assert.equal(await createCoreUserPreferenceAdapter({ fetch: fetchImpl }).overwrite("SNOW_CUSTOMER_INVOICE_PAYMENT", { form: 701, outcome: "READY", clientSecret: null }, ctx), true);
  const put = calls.at(-1);
  assert.equal(put.options.method, "PUT");
  assert.equal(put.url, ORIGIN + "/core/api/user/preference.json");
  assert.deepEqual(JSON.parse(put.options.body), { key: "SNOW_CUSTOMER_INVOICE_PAYMENT", value: "{\"form\":701,\"outcome\":\"READY\",\"clientSecret\":null}" });
}

{
  configure();
  invoices([invoice(47, "SENT", 4217.94), invoice(46, "PAID", 4217.94)]);
  const run = harness({ report: { outcome: "READY", clientSecret: SECRET, publishableKey: "pk_test_51Tst", paymentIntentId: "pi_3UVYaFQWOX4qwHeX5JowqHAZ" } },
    [{ error: { type: "card_error", code: "card_declined", message: "Your card was declined.", payment_intent: { status: "requires_payment_method" } } }, { paymentIntent: { status: "succeeded" } }],
    { paidAfter: 3 });
  const pending = payInvoice("invoice-core-47", run.options);
  assert.equal(state.invoicePayment.phase, "starting");
  assert.equal(sheet().getAttribute("data-state"), "starting");
  assert.equal(one(sheet(), "[data-module=\"pay-status\"]").textContent, PAYMENT_COPY.starting);
  assert.equal(payButton(page("invoice-core-47")).hasAttribute("disabled"), true, "the page's pay button is disabled while a payment is under way");
  assert.equal(await payInvoice("invoice-core-47", run.options), false, "one payment at a time");
  assert.equal(await pending, true);
  assert.deepEqual(run.forms.calls, [["submit", "CUSTOMER_INVOICE_PAYMENT", { INVOICE_ID: 47 }], ["report", "SNOW_CUSTOMER_INVOICE_PAYMENT", 701, "READY,PROCESSING,REFUSED,FAILED"]], "one form for invoice 47, its outcome read from the preference");
  assert.deepEqual(run.stripe.made.keys, ["pk_test_51Tst"], "Stripe runs with the publishable key the server answered");
  assert.equal(run.stripe.made.created[0], "card");
  assert.deepEqual(run.stripe.made.mounted, [one(sheet(), "[data-module=\"pay-card\"]")], "the card field is mounted in the sheet, outside the re-rendered page");
  await Promise.resolve();
  assert.deepEqual(run.overwrites.map(([key, value]) => [key, value.clientSecret, value.publishableKey, value.outcome, value.form]), [["SNOW_CUSTOMER_INVOICE_PAYMENT", null, null, "READY", 701]], "the secret is removed from the preference once read");
  assert.equal(sheet().getAttribute("data-state"), "card");
  assert.equal(one(sheet(), "[data-visual-id=\"pay-sheet-confirm\"]").textContent, "Pay CA$4,217.94");
  assert.equal(one(sheet(), "[data-module=\"pay-summary\"]").textContent, "November 2026CA$4,217.94");
  assert.ok(visible(one(sheet(), "[data-module=\"pay-test-mode\"]")), "test mode says which card to use");
  assert.match(one(sheet(), "[data-module=\"pay-test-mode\"]").textContent, /4242 4242 4242 4242/);
  assert.doesNotMatch(sheet().textContent + page("invoice-core-47").textContent, /_secret_|pk_test/, "neither the secret nor the key is shown");

  run.stripe.made.listeners.change({ error: { message: "Your card number is incomplete." } });
  assert.equal(one(sheet(), "[data-module=\"pay-error\"]").textContent, "Your card number is incomplete.", "Stripe's field errors are shown inline");
  assert.equal(await confirmInvoicePayment(), false);
  assert.deepEqual(run.stripe.made.confirmed[0], [SECRET, ["card"]], "the card is confirmed against the intent's secret");
  assert.equal(sheet().getAttribute("data-state"), "card", "a declined card keeps the card form open");
  assert.equal(one(sheet(), "[data-module=\"pay-error\"]").textContent, "Your card was declined.", "the decline is shown next to the card field");
  assert.equal(state.invoicePayment.phase, "card");

  assert.equal(await confirmInvoicePayment(), true);
  assert.equal(run.stripe.made.confirmed.length, 2);
  assert.equal(run.reads(), 3, "the invoice is re-read until it shows Paid");
  assert.equal(run.stripe.made.destroyed, 1, "the card field is released once the payment went through");
  assert.equal(sheet().getAttribute("data-state"), "paid");
  assert.match(one(sheet(), "[data-module=\"pay-result\"]").textContent, /^PaidThank you/);
  assert.equal(one(sheet(), "[data-visual-id=\"pay-sheet-confirm\"]").textContent, "Done");
  const paid = page("invoice-core-47");
  assert.equal(one(paid, ".status-badge").textContent, "Paid");
  assert.equal(all(paid, "[data-module=\"invoice-pay\"]").length, 0, "a paid invoice has no pay button");
  click(one(sheet(), "[data-visual-id=\"pay-sheet-confirm\"]"));
  assert.equal(sheet(), null, "Done closes the sheet");
  assert.equal(state.invoicePayment, null);
}

{
  configure();
  invoices([invoice(47, "SENT", 4217.94)]);
  const run = harness({ report: { outcome: "READY", clientSecret: SECRET, publishableKey: "pk_test_51Tst" } }, [{ paymentIntent: { status: "succeeded" } }]);
  await payInvoice("invoice-core-47", run.options);
  assert.equal(await confirmInvoicePayment(), false);
  assert.equal(run.clock(), 60000, "the invoice is re-read for a minute");
  assert.equal(sheet().getAttribute("data-state"), "slow");
  assert.match(one(sheet(), "[data-module=\"pay-result\"]").textContent, /went through, but the invoice hasn't updated yet.*don't need to pay again/);
  const slow = page("invoice-core-47");
  assert.equal(all(slow, "[data-action=\"invoice.pay\"]").length, 0, "after a slow webhook the page offers no second payment");
  assert.match(one(slow, "[data-module=\"invoice-pay\"]").textContent, /Payment received/);
  assert.equal(closeInvoicePayment(), true);
}

{
  configure();
  invoices([invoice(47, "SENT", 4217.94)]);
  const refused = harness({ report: { outcome: "REFUSED", message: "This invoice is already paid." } });
  assert.equal(await payInvoice("invoice-core-47", refused.options), false);
  assert.equal(sheet().getAttribute("data-state"), "refused");
  assert.equal(one(sheet(), "[data-module=\"pay-result\"]").textContent, "This invoice is already paid.", "a refusal shows the server's message");
  assert.equal(refused.stripe.made.keys.length, 0, "no card form for a refusal");
  closeInvoicePayment();

  const processing = harness({ report: { outcome: "PROCESSING", message: "Your payment for this invoice is already going through." } }, [], { paidAfter: 1 });
  assert.equal(await payInvoice("invoice-core-47", processing.options), true);
  assert.equal(processing.stripe.made.keys.length, 0, "an intent already paid gets no new card form");
  assert.equal(sheet().getAttribute("data-state"), "paid");
  closeInvoicePayment();

  invoices([invoice(47, "SENT", 4217.94)]);
  const lost = harness({ reportError: Object.assign(new Error("late"), { code: "outcome-unknown" }) });
  assert.equal(await payInvoice("invoice-core-47", lost.options), false);
  assert.equal(sheet().getAttribute("data-state"), "failed");
  assert.equal(one(sheet(), "[data-module=\"pay-result\"]").textContent, PAYMENT_COPY.unconfirmed);
  assert.equal(one(sheet(), "[data-visual-id=\"pay-sheet-confirm\"]").textContent, "Try again");
  closeInvoicePayment();

  const forged = harness({ report: { outcome: "READY", clientSecret: SECRET, publishableKey: "sk_test_51Tst" } });
  assert.equal(await payInvoice("invoice-core-47", forged.options), false, "a secret key is never handed to Stripe.js");
  assert.equal(forged.stripe.made.keys.length, 0);
  closeInvoicePayment();

  const expired = harness({ submitError: Object.assign(new Error("401"), { code: "session-expired" }) });
  assert.equal(await payInvoice("invoice-core-47", expired.options), false);
  assert.equal(state.account, "session-expired", "an expired session goes to the session gate");
  assert.equal(sheet(), null);
}

{
  const head = document.head;
  head.replaceChildren();
  const scope = { document: { createElement: (tag) => document.createElement(tag), head } };
  const loading = loadStripeJs({ scope });
  assert.equal(loadStripeJs({ scope }), loading, "Stripe.js is requested once");
  const scripts = all(head, "script");
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].getAttribute("src"), STRIPE_JS_URL);
  assert.equal(STRIPE_JS_URL, "https://js.stripe.com/v3/", "Stripe.js comes from Stripe, never from a copy");
  scope.Stripe = function Stripe() {};
  (scripts[0].listeners.load || []).forEach((listener) => listener());
  assert.equal(await loading, scope.Stripe);
}

{
  const read = (file) => fs.readFileSync(path.join(portalRoot, "runtime/src", file), "utf8");
  const source = ["invoice-payment.js", "adapters/stripe-js-adapter.js", "adapters/core-user-preference-adapter.js", "routes/InvoicesPage.js"].map(read).join("\n");
  assert.doesNotMatch(source, /send-event|save\.json|create-payment-intent|stripe\/config|innerHTML|localStorage|sessionStorage/, "the portal pays only through the form and Stripe.js, stores nothing and sends no invoice event");
  assert.deepEqual([...read("adapters/core-user-preference-adapter.js").matchAll(/"(\/api\/[\w/.-]+)"/g)].map(([, route]) => route), ["/api/user/preference.json"]);
  assert.equal(typeof ACTIONS["invoice.pay"], "function");
}

console.log("snow-invoice-payment-check ok: a Pay button only on a live SENT or OVERDUE invoice with its full amount due, a CUSTOMER_INVOICE_PAYMENT form carrying only the invoice id with the session, the outcome and client secret read from the User's own preference and then overwritten, Stripe.js from js.stripe.com with the server's publishable key, the card field in a sheet outside the re-rendered page, one payment at a time, an inline decline, the invoice re-read until Paid, a timeout that tells the client not to pay again, refusals, lost outcomes, a forged key and an expired session");

function createDom() {
  class Text {
    constructor(value) { this.textContent = String(value); this.parentNode = null; this.listeners = {}; }
  }

  class Element {
    constructor(tag) {
      this.tagName = String(tag).toUpperCase();
      this.attributes = new Map();
      this.childNodes = [];
      this.parentNode = null;
      this.listeners = {};
      this.style = {};
      this.offsetWidth = 0;
      this.offsetHeight = 0;
      this.classList = { add: () => {}, remove: () => {}, contains: () => false };
    }
    get className() { return this.getAttribute("class") || ""; }
    set className(value) { this.setAttribute("class", value); }
    get children() { return this.childNodes.filter((node) => node instanceof Element); }
    get textContent() { return this.childNodes.map((node) => node.textContent).join(""); }
    set textContent(value) { this.replaceChildren(new Text(value)); }
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
    remove() { if (this.parentNode) this.parentNode.removeChild(this); }
    replaceChildren(...nodes) {
      this.childNodes.forEach((node) => { node.parentNode = null; });
      this.childNodes = [];
      nodes.forEach((node) => this.appendChild(node));
    }
    addEventListener(type, listener) { (this.listeners[type] = this.listeners[type] || []).push(listener); }
    contains(node) {
      for (let current = node; current; current = current.parentNode) if (current === this) return true;
      return false;
    }
    closest(selector) {
      for (let current = this; current instanceof Element; current = current.parentNode) if (matches(current, selector)) return current;
      return null;
    }
    querySelectorAll(selector) {
      const found = [];
      const walk = (node) => node.children.forEach((child) => { if (matches(child, selector)) found.push(child); walk(child); });
      walk(this);
      return found;
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    focus() {}
    scrollIntoView() {}
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
  documentNode.body = new Element("body");
  documentNode.createElement = (tag) => new Element(tag);
  documentNode.createElementNS = (_, tag) => new Element(tag);
  documentNode.createTextNode = (value) => new Text(value);
  return { document: documentNode };
}

import { h } from "./dom.js";
import { liveInvoices, state } from "./state.js";
import { findInvoice, invoiceTitle } from "./normalizers/invoices.js";
import { formatMoney } from "./normalizers/contracts.js";
import { INVOICE_PAYMENT_FORM, createCoreProfileFormAdapter } from "./adapters/core-profile-form-adapter.js";
import { createCoreUserPreferenceAdapter } from "./adapters/core-user-preference-adapter.js";
import { loadStripeJs } from "./adapters/stripe-js-adapter.js";

export const PAYABLE_STATES = Object.freeze(["SENT", "OVERDUE"]);
export const PAYMENT_OUTCOMES = Object.freeze(["READY", "PROCESSING", "REFUSED", "FAILED"]);
export const TEST_CARD = "4242 4242 4242 4242";

const OUTCOME_TIMEOUT_MS = 60000;
const RECORDING_TIMEOUT_MS = 60000;
const RECORDING_POLL_MS = 2000;
const BUSY_PHASES = Object.freeze(["starting", "confirming"]);
const CLOSABLE_PHASES = Object.freeze(["card", "recording", "paid", "slow", "refused", "failed"]);

export const PAYMENT_COPY = Object.freeze({
  title: "Pay invoice",
  starting: "Preparing a secure card payment…",
  cardLabel: "Card details",
  note: "Payments are processed by Stripe. We never see or store your card number.",
  testMode: "Test mode",
  testHint: "No real charge. Use the test card " + TEST_CARD + " with any future date and any CVC.",
  confirming: "Confirming your payment…",
  recording: "Payment received. Updating your invoice…",
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
  processing: "Processing…",
});

var session = null;

export function invoicePaymentOpen(config) {
  return !!config && config.vertical === "snow" && config.dataMode === "live";
}

export function invoicePayable(invoice) {
  return !!invoice
    && PAYABLE_STATES.indexOf(invoice.stateCode) !== -1
    && typeof invoice.total === "number" && invoice.total > 0
    && !(invoice.paid > 0)
    && /^[A-Z]{3}$/.test(String(invoice.currency || ""));
}

export function invoicePaymentFor(invoiceId) {
  var payment = state.invoicePayment;
  return payment && payment.invoiceId === invoiceId ? payment : null;
}

export function invoicePaymentBusy() {
  return !!(state.invoicePayment && (BUSY_PHASES.indexOf(state.invoicePayment.phase) !== -1 || state.invoicePayment.phase === "card" || state.invoicePayment.phase === "recording"));
}

export function payInvoice(invoiceId, options) {
  var settings = options || {};
  var invoice = findInvoice(liveInvoices(), invoiceId);
  if (!invoicePaymentOpen(state.config) || !invoicePayable(invoice) || invoicePaymentBusy()) return Promise.resolve(false);
  closeSheet();
  var amountLabel = formatMoney(invoice.total, invoice.currency);
  var payment = { invoiceId: invoice.id, backendId: invoice.backendId, title: invoiceTitle(invoice), amountLabel: amountLabel, phase: "starting", message: "", testMode: false };
  state.invoicePayment = payment;
  session = {
    payment: payment,
    forms: settings.forms || createCoreProfileFormAdapter({ timeoutMs: OUTCOME_TIMEOUT_MS }),
    preferences: settings.preferences || createCoreUserPreferenceAdapter(),
    loadStripe: settings.loadStripe || loadStripeJs,
    reload: settings.reload,
    render: settings.render || function () {},
    wait: settings.wait || function (ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); },
    now: settings.now || function () { return Date.now(); },
    document: settings.document || globalThis.document,
    stripe: null,
    card: null,
    secret: "",
    sheet: null,
  };
  var current = session;
  openSheet(current);
  update(current, "starting", "");
  var context = { config: state.config, state: state };
  return Promise.resolve()
    .then(function () { return current.forms.submit(INVOICE_PAYMENT_FORM, { INVOICE_ID: payment.backendId }, context); })
    .then(function (formId) { return current.forms.report(INVOICE_PAYMENT_FORM, formId, context, PAYMENT_OUTCOMES); })
    .then(function (report) { return started(current, report, context); }, function (error) {
      if (session !== current) return false;
      if (error && error.code === "session-expired") {
        closeSheet();
        state.invoicePayment = null;
        state.account = "session-expired";
        current.render();
        return false;
      }
      update(current, "failed", error && error.code === "outcome-unknown" ? PAYMENT_COPY.unconfirmed : PAYMENT_COPY.notSent);
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
  Promise.resolve().then(function () {
    return current.preferences.overwrite(INVOICE_PAYMENT_FORM.preference, Object.assign({}, report, { clientSecret: null, publishableKey: null }), context);
  }).catch(function () { return false; });
  return Promise.resolve(current.loadStripe()).then(function (Stripe) {
    if (session !== current) return false;
    current.stripe = Stripe(key);
    current.card = current.stripe.elements().create("card", { style: cardStyle(current.document) });
    current.card.mount(current.sheet.cardHost);
    current.card.on("change", function (event) {
      if (session !== current || current.payment.phase !== "card") return;
      current.sheet.error.textContent = event && event.error && event.error.message ? String(event.error.message) : "";
    });
    update(current, "card", "");
    return true;
  }, function () {
    if (session === current) update(current, "failed", PAYMENT_COPY.stripeUnavailable);
    return false;
  });
}

export function confirmInvoicePayment() {
  var current = session;
  if (!current || current.payment.phase !== "card" || !current.stripe || !current.card) return Promise.resolve(false);
  update(current, "confirming", "");
  return Promise.resolve()
    .then(function () { return current.stripe.confirmCardPayment(current.secret, { payment_method: { card: current.card } }); })
    .then(function (result) {
      if (session !== current) return false;
      var outcome = result || {};
      var intent = outcome.paymentIntent || (outcome.error && outcome.error.payment_intent);
      if (intent && (intent.status === "succeeded" || intent.status === "processing")) return recording(current);
      update(current, "card", String(outcome.error && outcome.error.message || PAYMENT_COPY.cardFailed));
      return false;
    }, function () {
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
    return Promise.resolve(current.reload ? current.reload("invoices") : null).catch(function () { return null; }).then(function () {
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

export function closeInvoicePayment() {
  var current = session;
  var payment = state.invoicePayment;
  if (!payment || CLOSABLE_PHASES.indexOf(payment.phase) === -1) return false;
  if (current) releaseCard(current);
  closeSheet();
  if (payment.phase !== "recording") state.invoicePayment = null;
  if (current) current.render();
  return true;
}

export function retryInvoicePayment() {
  var payment = state.invoicePayment;
  if (!payment || payment.phase !== "failed" || !session) return Promise.resolve(false);
  var options = { forms: session.forms, preferences: session.preferences, loadStripe: session.loadStripe, reload: session.reload, render: session.render, wait: session.wait, now: session.now, document: session.document };
  var invoiceId = payment.invoiceId;
  closeSheet();
  state.invoicePayment = null;
  return payInvoice(invoiceId, options);
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
  var closeButton = h("button", { "class": "drawer__close", type: "button", "aria-label": PAYMENT_COPY.close, "data-visual-id": "pay-sheet-close" }, "✕");
  var summary = h("div", { "class": "pay-sheet__summary", "data-module": "pay-summary" }, [
    h("span", { "class": "pay-sheet__invoice" }, current.payment.title),
    h("b", { "class": "pay-sheet__amount" }, current.payment.amountLabel),
  ]);
  var status = h("div", { "class": "pay-sheet__status", role: "status", "aria-live": "polite", "data-module": "pay-status" });
  var testNote = h("div", { "class": "pay-sheet__test", "data-module": "pay-test-mode", hidden: true }, [
    h("span", { "class": "status-badge status-badge--warn" }, PAYMENT_COPY.testMode),
    h("span", null, PAYMENT_COPY.testHint),
  ]);
  var cardLabel = h("div", { "class": "field-label", id: "pay-sheet-card-label" }, PAYMENT_COPY.cardLabel);
  var cardHost = h("div", { "class": "field pay-sheet__card", role: "group", "aria-labelledby": "pay-sheet-card-label", "data-module": "pay-card" });
  var error = h("div", { "class": "field-error pay-sheet__error", role: "alert", "data-module": "pay-error" });
  var cardField = h("div", { "class": "field-row pay-sheet__field", "data-module": "pay-card-field", hidden: true }, [cardLabel, cardHost, error]);
  var note = h("p", { "class": "pay-sheet__note", hidden: true }, PAYMENT_COPY.note);
  var result = h("div", { "class": "pay-sheet__result", "data-module": "pay-result", hidden: true });
  var primary = h("button", { "class": "btn btn--primary btn--block btn--lg", type: "button", "data-visual-id": "pay-sheet-confirm" });
  var secondary = h("button", { "class": "btn btn--ghost btn--block", type: "button", "data-visual-id": "pay-sheet-secondary" });
  var actions = h("div", { "class": "pay-sheet__actions" }, [primary, secondary]);
  var panel = h("aside", { "class": "drawer pay-sheet", role: "dialog", "aria-modal": "true", "aria-labelledby": "pay-sheet-title", "data-module": "invoice-pay-sheet", "data-visual-id": "invoice-pay-sheet" }, [
    h("div", { "class": "drawer__head" }, [title, closeButton]),
    summary, testNote, status, cardField, note, result, actions,
  ]);
  var scrim = h("div", { "class": "scrim pay-sheet__scrim", "data-visual-id": "invoice-pay-scrim" });
  closeButton.addEventListener("click", closeInvoicePayment);
  scrim.addEventListener("click", closeInvoicePayment);
  panel.addEventListener("keydown", function (event) { if (event.key === "Escape") closeInvoicePayment(); });
  primary.addEventListener("click", function () {
    var phase = current.payment.phase;
    if (phase === "card") confirmInvoicePayment();
    else if (phase === "failed") retryInvoicePayment();
    else closeInvoicePayment();
  });
  secondary.addEventListener("click", closeInvoicePayment);
  var host = root.body || root;
  host.appendChild(scrim);
  host.appendChild(panel);
  current.sheet = { scrim: scrim, panel: panel, title: title, closeButton: closeButton, status: status, testNote: testNote, cardField: cardField, cardHost: cardHost, error: error, note: note, result: result, primary: primary, secondary: secondary };
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
  var progress = phase === "starting" ? PAYMENT_COPY.starting : phase === "confirming" ? PAYMENT_COPY.confirming : phase === "recording" ? PAYMENT_COPY.recording : "";
  sheet.status.replaceChildren.apply(sheet.status, progress ? [h("span", { "class": "pay-sheet__spinner", "aria-hidden": "true" }), h("span", null, progress)] : []);
  var outcome = phase === "paid" ? [PAYMENT_COPY.paidTitle, PAYMENT_COPY.paidBody, "ok"]
    : phase === "slow" ? [PAYMENT_COPY.slowTitle, PAYMENT_COPY.slowBody, "info"]
    : phase === "refused" || phase === "failed" ? ["", payment.message, "danger"] : null;
  toggle(sheet.result, !!outcome);
  sheet.result.setAttribute("data-state", outcome ? outcome[2] : "");
  sheet.result.replaceChildren.apply(sheet.result, outcome ? [
    outcome[0] ? h("div", { "class": "pay-sheet__result-title" }, outcome[0]) : null,
    h("div", { "class": "pay-sheet__result-body" }, outcome[1]),
  ].filter(Boolean) : []);
  var primaryLabel = phase === "card" ? "Pay " + payment.amountLabel
    : phase === "confirming" ? PAYMENT_COPY.processing
    : phase === "failed" ? PAYMENT_COPY.retry
    : phase === "paid" ? PAYMENT_COPY.done
    : phase === "slow" || phase === "refused" ? PAYMENT_COPY.close : "";
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
  var token = function (name, fallback) { return styles && styles.getPropertyValue(name).trim() || fallback; };
  return {
    base: {
      color: token("--ink", "#1d1d1f"),
      iconColor: token("--accent", "#0a84ff"),
      fontFamily: "Manrope, system-ui, -apple-system, sans-serif",
      fontSize: "16px",
      "::placeholder": { color: token("--ink-3", "#9aa0ad") },
    },
    invalid: { color: token("--danger", "#c0392b"), iconColor: token("--danger", "#c0392b") },
  };
}

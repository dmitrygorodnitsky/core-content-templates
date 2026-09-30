import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import { buildCustomerExperience } from "./build-customer-experience.mjs";
import { loadCustomerExperienceInputs } from "./customer-experience-config-report.mjs";

const inputs = await loadCustomerExperienceInputs();
const outputDir = "app-templates/customer-portal/dist/customer-experience/direct-login-check";
const build = await buildCustomerExperience({ inputs, outputDir });

try {
  const script = build.templates.login.javascript;
  const portalUrl = "https://dev-1.servicewand.com/calm-harbor-spa-customer-portal";
  const origin = "https://dev-1.servicewand.com";
  const calls = [];
  const postDeferreds = [];
  const redirects = [];
  const bootstrapDeferred = deferred();

  const submit = element();
  const csrf = element({ name: "{{CSRF_PARAMETER_NAME}}", value: "{{CSRF_TOKEN}}" });
  const username = element();
  username.value = "elena";
  const password = element();
  password.value = "private-test-value";
  const reset = element({ href: "{{RESET_PASSWORD_URL}}" });
  const error = element();
  const logout = element();
  const toggle = element();
  toggle.hidden = true;
  const form = element({ action: "{{LOGIN_ACTION}}", "data-login-success-url": portalUrl });
  form.querySelector = (selector) => ({
    "[data-login-submit]": submit,
    "[data-login-csrf]": csrf,
    "input[name=\"username\"]": username,
    "input[name=\"password\"]": password,
  })[selector] || null;

  const document = {
    querySelector(selector) {
      return ({
        "[data-core-auth-login]": form,
        "[data-login-reset]": reset,
        "[data-password-toggle]": toggle,
      })[selector] || null;
    },
    getElementById(id) {
      return ({ password, "auth-error-message": error, "auth-logout-message": logout })[id] || null;
    },
  };

  class FakeDOMParser {
    parseFromString(html) {
      const sourceCsrf = element({ value: html });
      return {
        querySelector(selector) {
          if (selector !== 'form[action="/oauth2/login"]') return null;
          return { querySelector: (childSelector) => childSelector === 'input[name="_csrf"]' ? sourceCsrf : null };
        },
      };
    }
  }

  function fetch(url, options = {}) {
    calls.push({ url, options });
    if ((options.method || "GET") === "GET") return bootstrapDeferred.promise;
    const pending = deferred();
    postDeferreds.push(pending);
    return pending.promise;
  }

  vm.runInNewContext(script, {
    document,
    DOMParser: FakeDOMParser,
    fetch,
    URL,
    URLSearchParams,
    window: { location: { origin, href: origin + "/pages/CALM_HARBOR_SPA_STAGING/auth/login.html?returnUrl=" + encodeURIComponent(portalUrl), assign: (url) => redirects.push(String(url)) } },
  });

  assert.equal(calls.length, 1, "initial bootstrap starts exactly once");
  assert.equal(submit.disabled, true, "submit is visibly disabled while the CSRF bootstrap is pending");
  assert.equal(form.getAttribute("aria-busy"), "true");

  bootstrapDeferred.resolve(response(origin + "/oauth2/login", "csrf-one"));
  await flush();
  assert.equal(csrf.getAttribute("name"), "_csrf");
  assert.equal(csrf.getAttribute("value"), "csrf-one");
  assert.equal(form.getAttribute("action"), "/oauth2/login");
  assert.equal(submit.disabled, false, "submit is enabled only after the CSRF token is ready");
  assert.equal(reset.getAttribute("href"), "/oauth2/forgot-password");

  submitForm(form);
  submitForm(form);
  assert.equal(calls.filter((call) => call.options.method === "POST").length, 1, "repeat submit is dropped while the first login is pending");
  assert.equal(submit.disabled, true);
  assert.match(calls.at(-1).options.body, /username=elena/);
  assert.match(calls.at(-1).options.body, /_csrf=csrf-one/);
  assert.equal(calls.at(-1).options.body.includes("{{"), false, "runtime placeholders never enter the direct login request");

  postDeferreds[0].resolve(response(origin + "/oauth2/login?error", "csrf-two"));
  await flush();
  assert.equal(error.style.display, "block", "credential failure uses the accepted error region");
  assert.equal(csrf.getAttribute("value"), "csrf-two", "credential failure refreshes the one-time token");
  assert.equal(submit.disabled, false);
  assert.equal(password.focusCount, 1);

  submitForm(form);
  postDeferreds[1].resolve(response(origin + "/oauth2/", "signed-in"));
  await flush();
  assert.deepEqual(redirects, [portalUrl], "successful direct login returns to the configured customer portal");

  console.log("customer-experience-direct-login-check ok: single bootstrap, disabled pending CTA, drop-while-running submit, token refresh after credential failure, same-origin portal return");
} finally {
  await fs.rm(outputDir, { recursive: true, force: true });
}

function element(attributes = {}) {
  const values = new Map(Object.entries(attributes));
  const listeners = new Map();
  return {
    style: {},
    disabled: false,
    hidden: false,
    value: attributes.value || "",
    focusCount: 0,
    getAttribute: (name) => values.has(name) ? values.get(name) : null,
    setAttribute: (name, value) => { values.set(name, String(value)); },
    removeAttribute: (name) => { values.delete(name); },
    addEventListener: (name, listener) => { listeners.set(name, listener); },
    dispatch(name, event) { return listeners.get(name)?.(event); },
    focus() { this.focusCount += 1; },
  };
}

function submitForm(form) {
  let prevented = false;
  form.dispatch("submit", { preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true, "direct-session submit stays under the guarded handler");
}

function response(url, html) {
  return { ok: true, url, text: async () => html };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

async function flush() {
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
}

export const STRIPE_JS_URL = "https://js.stripe.com/v3/";

const LOAD_TIMEOUT_MS = 20000;
const loads = new WeakMap();

export function loadStripeJs(options = {}) {
  var scope = options.scope || globalThis;
  if (typeof scope.Stripe === "function") return Promise.resolve(scope.Stripe);
  if (loads.has(scope)) return loads.get(scope);
  var root = scope.document;
  if (!root || typeof root.createElement !== "function") return Promise.reject(coded("stripe-unavailable", "Stripe.js needs a document"));
  var loading = new Promise(function (resolve, reject) {
    var script = root.createElement("script");
    var timer = setTimeout(function () { reject(coded("stripe-unavailable", "Stripe.js did not load in time")); }, options.timeoutMs || LOAD_TIMEOUT_MS);
    script.setAttribute("src", STRIPE_JS_URL);
    script.setAttribute("async", "");
    script.addEventListener("load", function () {
      clearTimeout(timer);
      if (typeof scope.Stripe === "function") resolve(scope.Stripe);
      else reject(coded("stripe-unavailable", "Stripe.js loaded without Stripe"));
    });
    script.addEventListener("error", function () {
      clearTimeout(timer);
      reject(coded("stripe-unavailable", "Stripe.js could not be loaded"));
    });
    (root.head || root.body).appendChild(script);
  });
  loads.set(scope, loading);
  loading.catch(function () { loads.delete(scope); });
  return loading;
}

function coded(code, message) {
  var error = new Error(message);
  error.code = code;
  return error;
}

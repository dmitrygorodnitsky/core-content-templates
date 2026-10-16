const VERSION = 1;
const CODE = /^[A-Za-z0-9._:-]{1,128}$/;
const ROUTES = new Set(["services", "products", "cart", "auth.oidc"]);
const FLIGHTS = new Map();

export function createAnonymousIntentStore(config, options) {
  var settings = config || {};
  var dependencies = options || {};
  var storage = dependencies.storage || globalThis.sessionStorage;
  var now = dependencies.now || function () { return Date.now(); };
  var createRef = dependencies.createRef || defaultRef;
  var experienceId = validCode(settings.experienceId, "experienceId");
  var key = "cx:pending-intent:" + experienceId;
  var enabled = settings.anonymousIntentMode === "selection-only";
  var ttlSeconds = boundedInteger(settings.anonymousIntentTtlSeconds, 1800, 60, 86400);
  var maxItems = boundedInteger(settings.anonymousIntentMaxItems, 10, 1, 50);

  return {
    key: key,
    enabled: enabled,
    captureRetail: function (items, returnRoute) {
      if (!enabled) throw new Error("Anonymous intent is closed");
      var payload = { items: validateRetailItems(items, maxItems) };
      return save("retail", payload, returnRoute || "cart");
    },
    captureService: function (offeringCode, returnRoute) {
      if (!enabled) throw new Error("Anonymous intent is closed");
      var payload = { offeringCode: validCode(offeringCode, "offeringCode") };
      return save("service", payload, returnRoute || "services");
    },
    read: read,
    clear: function () { storage.removeItem(key); },
  };

  function save(kind, payload, returnRoute) {
    var createdAt = now();
    var capsule = {
      version: VERSION,
      experienceId: experienceId,
      kind: kind,
      payload: payload,
      returnRoute: validRoute(returnRoute),
      createdAt: createdAt,
      expiresAt: createdAt + ttlSeconds * 1000,
      intentRef: validCode(createRef(), "intentRef"),
    };
    storage.setItem(key, JSON.stringify(capsule));
    return structuredClone(capsule);
  }

  function read() {
    var raw = storage.getItem(key);
    if (!raw) return { status: enabled ? "empty" : "closed" };
    var value;
    try { value = JSON.parse(raw); } catch (_) { return reject("invalid"); }
    try { validateCapsule(value, experienceId, maxItems); } catch (_) { return reject("invalid"); }
    if (value.expiresAt <= now()) return reject("expired");
    return { status: "ready", intent: structuredClone(value) };
  }

  function reject(status) {
    storage.removeItem(key);
    return { status: status };
  }
}

export function reconcileAnonymousIntent(options) {
  var input = options || {};
  if (!input.authenticated) return Promise.resolve({ status: "awaiting-auth" });
  if (!input.accountReady) return Promise.resolve({ status: "awaiting-account" });
  if (!input.store || typeof input.store.read !== "function") return Promise.reject(new Error("Anonymous intent store is required"));
  var snapshot = input.store.read();
  if (snapshot.status !== "ready") return Promise.resolve(snapshot);
  var intent = snapshot.intent;
  var key = intent.experienceId + ":" + intent.intentRef;
  if (FLIGHTS.has(key)) return FLIGHTS.get(key);

  var handler = intent.kind === "retail" ? input.handlers && input.handlers.retailCart : input.handlers && input.handlers.serviceSelection;
  if (typeof handler !== "function") return Promise.reject(new Error("No authenticated-server handler for " + intent.kind));
  if (typeof input.onStatus === "function") input.onStatus("pending", intent);
  var pending = Promise.resolve().then(function () {
    return handler(structuredClone(intent), { idempotencyKey: intent.intentRef });
  }).then(function (result) {
    input.store.clear();
    if (typeof input.onStatus === "function") input.onStatus("ready", intent);
    return { status: "reconciled", intentRef: intent.intentRef, result: result };
  }).catch(function (error) {
    if (typeof input.onStatus === "function") input.onStatus("failed", intent, error);
    throw error;
  }).finally(function () {
    FLIGHTS.delete(key);
  });
  FLIGHTS.set(key, pending);
  return pending;
}

export function resetAnonymousIntentFlightsForTests() { FLIGHTS.clear(); }

function validateCapsule(value, experienceId, maxItems) {
  assertExactKeys(value, ["version", "experienceId", "kind", "payload", "returnRoute", "createdAt", "expiresAt", "intentRef"]);
  if (value.version !== VERSION || value.experienceId !== experienceId) throw new Error("Capsule scope mismatch");
  if (!Number.isFinite(value.createdAt) || !Number.isFinite(value.expiresAt) || value.expiresAt <= value.createdAt) throw new Error("Invalid capsule lifetime");
  validCode(value.intentRef, "intentRef");
  validRoute(value.returnRoute);
  if (value.kind === "retail") {
    assertExactKeys(value.payload, ["items"]);
    validateRetailItems(value.payload.items, maxItems);
  } else if (value.kind === "service") {
    assertExactKeys(value.payload, ["offeringCode"]);
    validCode(value.payload.offeringCode, "offeringCode");
  } else throw new Error("Invalid intent kind");
}

function validateRetailItems(items, maxItems) {
  if (!Array.isArray(items) || !items.length || items.length > maxItems) throw new Error("Retail intent item count is invalid");
  return items.map(function (item) {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("Retail item must be an object");
    var allowedKeys = item.variantCode === undefined ? ["offerCode", "quantity"] : ["offerCode", "quantity", "variantCode"];
    assertExactKeys(item, allowedKeys);
    var result = { offerCode: validCode(item.offerCode, "offerCode"), quantity: boundedInteger(item.quantity, 0, 1, 99) };
    if (!result.quantity) throw new Error("Retail quantity is invalid");
    if (item.variantCode !== undefined) result.variantCode = validCode(item.variantCode, "variantCode");
    return result;
  });
}

function assertExactKeys(value, expected) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected an object");
  var actual = Object.keys(value).sort();
  var allowed = expected.slice().sort();
  if (JSON.stringify(actual) !== JSON.stringify(allowed)) throw new Error("Unexpected fields in anonymous intent");
}

function validCode(value, label) {
  var result = String(value || "");
  if (!CODE.test(result)) throw new Error(label + " is invalid");
  return result;
}

function validRoute(value) {
  var result = String(value || "");
  if (!ROUTES.has(result)) throw new Error("returnRoute is invalid");
  return result;
}

function boundedInteger(value, fallback, minimum, maximum) {
  var parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : fallback;
}

function defaultRef() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") return globalThis.crypto.randomUUID();
  return "intent-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

import assert from "node:assert/strict";
import {
  createAnonymousIntentStore,
  reconcileAnonymousIntent,
  resetAnonymousIntentFlightsForTests,
} from "../runtime/src/anonymous-intent.js";
import { readPortalConfig } from "../runtime/src/config.js";

const parsedConfig = readPortalConfig({ dataset: {
  portalExperienceId: "test-family",
  portalAnonymousIntentMode: "selection-only",
  portalAnonymousIntentTtlSeconds: "600",
  portalAnonymousIntentMaxItems: "4",
  portalAnonymousIntentReconciliation: "authenticated-server",
  portalRegistrationMode: "core-auth",
  portalRegistrationUrl: "https://auth.example.test/register",
} });
assert.equal(parsedConfig.experienceId, "test-family");
assert.equal(parsedConfig.anonymousIntentMode, "selection-only");
assert.equal(parsedConfig.anonymousIntentTtlSeconds, 600);
assert.equal(parsedConfig.anonymousIntentMaxItems, 4);
assert.equal(parsedConfig.registrationMode, "core-auth");
assert.equal(parsedConfig.registrationUrl, "https://auth.example.test/register");
assert.equal(readPortalConfig({ dataset: {} }).anonymousIntentMode, "closed");

const storage = memoryStorage();
let clock = 1_000_000;
let reference = 0;
const store = createAnonymousIntentStore({
  experienceId: "test-family",
  anonymousIntentMode: "selection-only",
  anonymousIntentTtlSeconds: 60,
  anonymousIntentMaxItems: 2,
}, { storage, now: () => clock, createRef: () => "intent-" + (++reference) });

const retail = store.captureRetail([{ offerCode: "offer-1", variantCode: "blue", quantity: 2 }]);
assert.equal(retail.returnRoute, "cart");
assert.deepEqual(Object.keys(retail.payload.items[0]).sort(), ["offerCode", "quantity", "variantCode"]);
assert.equal(store.read().status, "ready");
assert.throws(() => store.captureRetail([{ offerCode: "x", quantity: 1, price: 100 }]), /Unexpected fields/);
assert.throws(() => store.captureRetail([{ offerCode: "x", quantity: 1 }, { offerCode: "y", quantity: 1 }, { offerCode: "z", quantity: 1 }]), /item count/);

clock += 61_000;
assert.equal(store.read().status, "expired");
assert.equal(storage.getItem(store.key), null);

store.captureService("massage-60");
assert.equal((await reconcileAnonymousIntent({ store, authenticated: false, accountReady: false })).status, "awaiting-auth");
assert.equal((await reconcileAnonymousIntent({ store, authenticated: true, accountReady: false })).status, "awaiting-account");

let calls = 0;
let release;
const deferred = new Promise((resolve) => { release = resolve; });
const options = {
  store,
  authenticated: true,
  accountReady: true,
  handlers: { serviceSelection: async (_intent, context) => { calls += 1; assert.equal(context.idempotencyKey, "intent-2"); return deferred; } },
};
const first = reconcileAnonymousIntent(options);
const second = reconcileAnonymousIntent(options);
assert.equal(first, second, "same intent returns the exact same in-flight promise");
assert.equal(calls, 0, "handler begins on the next microtask");
await Promise.resolve();
assert.equal(calls, 1);
release({ accepted: true });
assert.equal((await first).status, "reconciled");
assert.equal(store.read().status, "empty");

store.captureRetail([{ offerCode: "offer-retry", quantity: 1 }]);
let attempts = 0;
await assert.rejects(reconcileAnonymousIntent({
  store,
  authenticated: true,
  accountReady: true,
  handlers: { retailCart: async () => { attempts += 1; throw new Error("server unavailable"); } },
}), /server unavailable/);
assert.equal(store.read().status, "ready", "failed reconciliation preserves the capsule for retry");
const retry = await reconcileAnonymousIntent({
  store,
  authenticated: true,
  accountReady: true,
  handlers: { retailCart: async () => { attempts += 1; return { accepted: true }; } },
});
assert.equal(retry.status, "reconciled");
assert.equal(attempts, 2);

const closed = createAnonymousIntentStore({ experienceId: "closed-family", anonymousIntentMode: "closed" }, { storage: memoryStorage() });
assert.equal(closed.read().status, "closed");
assert.throws(() => closed.captureService("service-1"), /closed/);
resetAnonymousIntentFlightsForTests();

console.log("anonymous-intent-check ok: strict session capsule, expiry, auth/account gates, single-flight dedupe, retry preservation");

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

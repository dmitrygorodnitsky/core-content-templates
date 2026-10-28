import assert from "node:assert/strict";

const ORIGIN = "https://dev-1.servicewand.com";
const CALLBACK = ORIGIN + "/core/oauth2-callback.html";
const STALE = "stale-access-token";
const RENEWED = "renewed-access-token";
const API = ORIGIN + "/core-acct/api/tagged/account/list.json";

const report = console.log;
const world = installWorld();
const oidcAdapter = await import("../runtime/src/adapters/core-oidc-adapter.js");
const { CORE_OIDC_REFRESH_LOCK, coreSessionFetch, loadCoreOidcSession, onCoreOidcSessionChange } = oidcAdapter;
const config = { dataMode: "live", authMode: "required", authCoreBase: "/core", authCallbackPath: "/core/oauth2-callback.html" };
let cases = 0;

async function signedIn(user, options = {}) {
  world.reset(user, options);
  const listeners = { renewed: [], ended: 0 };
  onCoreOidcSessionChange((renewedUser) => listeners.renewed.push(renewedUser.access_token), () => { listeners.ended += 1; });
  const envelope = await loadCoreOidcSession(config);
  return { envelope, listeners };
}

function authorized(token) {
  return { method: "POST", credentials: "same-origin", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify({ offset: 0 }) };
}

{
  const { envelope } = await signedIn(user(STALE, { refresh: true }));
  const settings = world.lastSettings();
  assert.equal(envelope.state, "ready-signed-in");
  assert.equal(settings.automaticSilentRenew, false, "renewal is driven by the portal under the shared core-ui lock, not by the library timer alone");
  assert.equal(settings.monitorSession, false);
  assert.equal(settings.scope, "openid profile email roles", "the portal asks for the same scopes as core-ui and the shared callback");
  assert.equal(settings.silent_redirect_uri, undefined, "renewal never falls back to an iframe the shared callback cannot serve");
  assert.equal(settings.userStore.options.store, globalThis.localStorage, "the session survives a reload and a new tab, like core-ui");
  assert.equal(settings.redirect_uri, CALLBACK);
  cases += 1;
}

{
  const { listeners } = await signedIn(user(STALE, { refresh: true }));
  world.stored().expires_in = 45;
  await world.raise("expiring");
  assert.equal(world.calls.signinSilent, 1, "an access token about to expire is renewed before it expires");
  assert.deepEqual(world.calls.locks, [CORE_OIDC_REFRESH_LOCK], "the renewal runs under the lock core-ui uses on the same origin");
  assert.equal(CORE_OIDC_REFRESH_LOCK, "oidc-token-refresh");
  assert.deepEqual(listeners.renewed, [RENEWED], "the portal session receives the renewed token");
  assert.equal(listeners.ended, 0);
  cases += 1;
}

{
  await signedIn(user(STALE, { refresh: true }));
  world.stored().expires_in = 600;
  world.storeElsewhere(user("other-tab-token", { refresh: true }));
  await world.raise("expiring");
  assert.equal(world.calls.signinSilent, 0, "a token another tab already renewed is adopted, not refreshed again");
  cases += 1;
}

{
  const { listeners } = await signedIn(user(STALE, { refresh: true }));
  world.rejectToken(STALE);
  const response = await coreSessionFetch(API, authorized(STALE));
  assert.equal(response.status, 200, "a 401 is renewed and the request retried once");
  assert.equal(world.calls.signinSilent, 1);
  assert.deepEqual(world.requests.map((request) => request.token), [STALE, RENEWED]);
  assert.equal(world.requests[1].body, JSON.stringify({ offset: 0 }), "the retry carries the same body");
  assert.deepEqual(listeners.renewed, [RENEWED]);
  cases += 1;
}

{
  await signedIn(user(STALE, { refresh: true }));
  world.rejectToken(STALE);
  const responses = await Promise.all([1, 2, 3, 4].map(() => coreSessionFetch(API, authorized(STALE))));
  assert.deepEqual(responses.map((response) => response.status), [200, 200, 200, 200], "every concurrent request succeeds after the renewal");
  assert.equal(world.calls.signinSilent, 1, "concurrent 401s share one renewal");
  assert.equal(world.requests.filter((request) => request.token === STALE).length, 4);
  assert.equal(world.requests.filter((request) => request.token === RENEWED).length, 4);
  cases += 1;
}

{
  await signedIn(user(STALE, { refresh: true }));
  world.rejectToken(STALE);
  world.storeElsewhere(user("other-tab-token", { refresh: true }));
  const response = await coreSessionFetch(API, authorized(STALE));
  assert.equal(response.status, 200);
  assert.equal(world.calls.signinSilent, 0, "a request sent with an outdated token uses the stored, already renewed one");
  assert.deepEqual(world.requests.map((request) => request.token), ["other-tab-token"]);
  cases += 1;
}

{
  await signedIn(user(STALE, { refresh: true }));
  world.stored().expired = true;
  world.stored().expires_in = -5;
  const response = await coreSessionFetch(API, authorized(STALE));
  assert.equal(response.status, 200);
  assert.equal(world.calls.signinSilent, 1, "an expired token is renewed before the request is sent");
  assert.deepEqual(world.requests.map((request) => request.token), [RENEWED]);
  cases += 1;
}

{
  const { listeners } = await signedIn(user(STALE, { refresh: true }), { refresh: "rejected" });
  world.rejectToken(STALE);
  const response = await coreSessionFetch(API, authorized(STALE));
  assert.equal(response.status, 401, "a rejected refresh returns the original 401");
  assert.equal(world.calls.removeUser, 1, "a session whose refresh token was rejected is removed");
  assert.equal(listeners.ended, 1, "and the portal is told the session ended");
  assert.equal(world.requests.length, 1, "nothing is retried with a token that could not be renewed");
  cases += 1;
}

{
  const { listeners } = await signedIn(user(STALE, { refresh: true }), { refresh: "network" });
  world.rejectToken(STALE);
  const response = await coreSessionFetch(API, authorized(STALE));
  assert.equal(response.status, 401);
  assert.equal(world.calls.removeUser, 0, "a refresh that failed on the network keeps the session");
  assert.equal(listeners.ended, 0);
  cases += 1;
}

{
  const { listeners } = await signedIn(user(STALE, { refresh: true }), { refresh: "rejected" });
  world.stored().expires_in = 45;
  await world.raise("expiring");
  assert.equal(world.calls.removeUser, 1, "a background renewal the server rejects ends the session");
  assert.equal(listeners.ended, 1);
  cases += 1;
}

{
  const { listeners } = await signedIn(user(STALE, {}));
  world.rejectToken(STALE);
  const response = await coreSessionFetch(API, authorized(STALE));
  assert.equal(response.status, 401);
  assert.equal(world.calls.signinSilent, 0);
  assert.equal(listeners.ended, 0, "a 401 on an unexpired session without a refresh token keeps the existing session-expired gate");
  world.stored().expired = true;
  world.stored().expires_in = -5;
  await coreSessionFetch(API, authorized(STALE));
  assert.equal(listeners.ended, 1, "an expired session without a refresh token has truly ended");
  assert.equal(world.calls.removeUser, 1);
  cases += 1;
}

{
  const { envelope, listeners } = await signedIn(user(STALE, { refresh: true, expired: true }));
  assert.equal(envelope.state, "ready-signed-in", "a reload with an expired but refreshable stored session stays signed in");
  assert.equal(envelope.user.access_token, RENEWED);
  assert.equal(world.calls.removeUser, 0);
  assert.deepEqual(listeners.renewed, [RENEWED]);
  cases += 1;
}

{
  const { envelope } = await signedIn(user(STALE, { refresh: true, expired: true }), { refresh: "rejected" });
  assert.equal(envelope.state, "ready-signed-out", "a reload whose refresh is rejected settles signed out");
  assert.equal(world.calls.removeUser, 1);
  cases += 1;
}

{
  world.reset(user(STALE, { refresh: true, expired: true }), { refresh: "network" });
  await assert.rejects(loadCoreOidcSession(config), (error) => error.code === "oidc-renewal-failed", "a reload whose refresh fails on the network reports an unavailable session instead of signing out");
  assert.equal(world.calls.removeUser, 0);
  cases += 1;
}

{
  const { envelope } = await signedIn(user(STALE, { expired: true }));
  assert.equal(envelope.state, "ready-signed-out", "an expired session without a refresh token settles signed out");
  assert.equal(world.calls.signinSilent, 0);
  assert.equal(world.calls.removeUser, 1);
  cases += 1;
}

{
  await signedIn(user(STALE, { refresh: true }));
  const anonymous = { method: "GET", headers: { Accept: "application/json" } };
  const lookups = world.calls.getUser;
  const response = await coreSessionFetch(ORIGIN + "/core/api/form-type/X/get.json", anonymous);
  assert.equal(response.status, 200);
  assert.equal(world.requests[0].init, anonymous, "a request without a session token passes through untouched");
  assert.equal(world.calls.getUser, lookups, "and never reads the stored session");
  cases += 1;
}

assert.equal(world.requestsEver.some((request) => /access-token|refresh-token|other-tab-token/.test(request.url)), false, "no token is ever placed in a URL");
assert.deepEqual(world.logged, [], "nothing is logged");

report("core-oidc-session-check ok: " + cases + " cases. The portal keeps Core sessions in localStorage, renews them with the stored refresh token under core-ui's oidc-token-refresh lock before expiry, on load and after a 401, shares one renewal between concurrent 401s, retries each request once with the renewed token, adopts a token another tab renewed, and removes a session only when its refresh is rejected or it expired with no refresh token");

function user(token, { refresh = false, expired = false } = {}) {
  return Object.assign({ access_token: token, token_type: "Bearer", expired, expires_in: expired ? -5 : 900, profile: { sub: "7001" } }, refresh ? { refresh_token: "stub-refresh-token" } : {});
}

function installWorld() {
  const storage = () => {
    const values = new Map();
    return { getItem: (key) => (values.has(key) ? values.get(key) : null), setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) };
  };
  const state = { user: null, options: {}, rejected: new Set(), handlers: {}, settings: [], manager: null };
  const world = {
    calls: null,
    requests: [],
    requestsEver: [],
    logged: [],
    reset(initial, options = {}) {
      state.user = initial;
      state.options = options;
      state.rejected = new Set();
      world.calls = { signinSilent: 0, removeUser: 0, getUser: 0, locks: [] };
      world.requests = [];
    },
    stored: () => state.user,
    storeElsewhere(next) { state.user = next; },
    rejectToken(token) { state.rejected.add(token); },
    lastSettings: () => state.settings[state.settings.length - 1],
    async raise(name) {
      await Promise.all((state.manager.handlers[name] || []).map((handler) => handler()));
      for (let turn = 0; turn < 10; turn += 1) await new Promise((resolve) => setTimeout(resolve, 0));
    },
  };
  for (const level of ["log", "info", "warn", "error", "debug"]) console[level] = (...args) => world.logged.push(level + ": " + args.join(" "));
  class ErrorResponse extends Error {
    constructor(error) { super(error); this.error = error; }
  }
  class UserManager {
    constructor(settings) {
      state.settings.push(settings);
      state.manager = this;
      this.handlers = {};
      const add = (name) => (handler) => {
        (this.handlers[name] = this.handlers[name] || []).push(handler);
        return () => { this.handlers[name] = this.handlers[name].filter((item) => item !== handler); };
      };
      this.events = {
        addAccessTokenExpiring: add("expiring"),
        addAccessTokenExpired: add("expired"),
        addUserLoaded: add("loaded"),
        load: async (loaded) => (this.handlers.loaded || []).forEach((handler) => handler(loaded)),
      };
    }
    async getUser() { world.calls.getUser += 1; return state.user; }
    async removeUser() { world.calls.removeUser += 1; state.user = null; }
    async signinSilent() {
      world.calls.signinSilent += 1;
      await new Promise((resolve) => setTimeout(resolve, 5));
      if (state.options.refresh === "rejected") throw new ErrorResponse("invalid_grant");
      if (state.options.refresh === "network") throw new TypeError("Failed to fetch");
      state.user = Object.assign({}, state.user, { access_token: RENEWED, expired: false, expires_in: 900 });
      await this.events.load(state.user);
      return state.user;
    }
  }
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { locks: { request: async (name, callback) => { world.calls.locks.push(name); return callback(); } } },
  });
  Object.assign(globalThis, {
    location: { origin: ORIGIN, href: ORIGIN + "/pages/SNOWLIMITLESS/portal" },
    localStorage: storage(),
    sessionStorage: storage(),
    oidc: { ErrorResponse, UserManager, WebStorageStateStore: class { constructor(options) { this.options = options; } } },
    fetch: async (input, init = {}) => {
      const url = String(input);
      const reply = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
      world.requestsEver.push({ url });
      if (url === ORIGIN + "/core/.well-known/oauth-protected-resource/") {
        return reply(200, { authorization_servers: [ORIGIN + "/oauth2"], resource: ORIGIN, x_client_id: "core", x_redirect_uri: CALLBACK, x_post_logout_redirect_uri: CALLBACK });
      }
      const header = init.headers && init.headers.Authorization;
      const token = header ? header.split(" ")[1] : null;
      world.requests.push({ url, init, token, body: init.body });
      return reply(token && state.rejected.has(token) ? 401 : 200, { resultSize: 0, result: [] });
    },
  });
  return world;
}

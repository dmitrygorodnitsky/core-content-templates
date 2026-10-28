import { routePath } from "../config.js";

export const CORE_OIDC_REFRESH_LOCK = "oidc-token-refresh";
const EXPIRING_THRESHOLD_SECONDS = 60;

var manager = null;
var renewal = null;
var detachRenewal = null;
var sessionListeners = { renewed: null, ended: null };

export function createCoreOidcAdapter() {
  return {
    async load(moduleId, context) {
      if (moduleId !== "auth") throw new Error("Core OIDC adapter cannot load " + moduleId);
      if (context.config.dataMode !== "live" || context.config.authMode !== "required") {
        return { state: "ready-signed-in", user: null };
      }
      return loadCoreOidcSession(context.config);
    },
  };
}

export async function loadCoreOidcSession(config) {
  if (!globalThis.oidc || !globalThis.oidc.UserManager || !globalThis.oidc.WebStorageStateStore) {
    throw contractError("oidc-library-unavailable", "Core sign-in library did not load");
  }
  var coreBase = sameOriginUrl(config.authCoreBase || "/core", "Core authentication base").replace(/\/+$/, "");
  var expectedCallback = sameOriginUrl(config.authCallbackPath || "/core/oauth2-callback.html", "Core callback");
  var response = await globalThis.fetch(coreBase + "/.well-known/oauth-protected-resource/", {
    credentials: "omit",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw contractError("oidc-discovery-failed", "Core authentication discovery failed with HTTP " + response.status);
  var metadata = await response.json();
  var authority = Array.isArray(metadata.authorization_servers) ? metadata.authorization_servers[0] : "";
  if (!authority || !metadata.resource || !metadata.x_client_id || !metadata.x_redirect_uri || !metadata.x_post_logout_redirect_uri) {
    throw contractError("oidc-discovery-incomplete", "Core authentication discovery is incomplete");
  }
  if (new URL(metadata.resource, globalThis.location.origin).origin !== globalThis.location.origin) {
    throw contractError("oidc-cross-origin-resource", "Core authentication resource must be same-origin");
  }
  if (new URL(authority, globalThis.location.origin).origin !== globalThis.location.origin) {
    throw contractError("oidc-cross-origin-authority", "Core authorization server must be same-origin");
  }
  if (new URL(metadata.x_redirect_uri, globalThis.location.origin).href !== expectedCallback
      || new URL(metadata.x_post_logout_redirect_uri, globalThis.location.origin).href !== expectedCallback) {
    throw contractError("oidc-callback-mismatch", "Core authentication callback does not match the portal contract");
  }
  manager = new globalThis.oidc.UserManager({
    authority: authority,
    client_id: metadata.x_client_id,
    post_logout_redirect_uri: expectedCallback,
    redirect_uri: expectedCallback,
    response_type: "code",
    scope: "openid profile email roles",
    automaticSilentRenew: false,
    monitorSession: false,
    userStore: new globalThis.oidc.WebStorageStateStore({ store: globalThis.localStorage }),
  });
  attachRenewal(manager);
  var user = await settleStoredUser(await manager.getUser());
  return { state: user ? "ready-signed-in" : "ready-signed-out", user: user || null };
}

export function onCoreOidcSessionChange(renewed, ended) {
  sessionListeners = { renewed: renewed || null, ended: ended || null };
}

export async function coreSessionFetch(input, init) {
  var sent = authorizationHeader(init);
  if (!manager || !sent) return globalThis.fetch(input, init);
  var user = await manager.getUser();
  if (user && user.expired && user.refresh_token) {
    user = await renewCoreOidcUser(user.access_token).catch(function () { return user; }) || user;
  }
  var request = user ? withAuthorization(init, sent.name, user) : init;
  var response = await globalThis.fetch(input, request);
  if (response.status !== 401) return response;
  var renewed = await renewAfterUnauthorized(user ? user.access_token : bearerToken(sent.value));
  return renewed ? globalThis.fetch(input, withAuthorization(init, sent.name, renewed)) : response;
}

function renewCoreOidcUser(staleAccessToken) {
  if (!manager) return Promise.resolve(null);
  var owner = manager;
  if (!renewal) {
    renewal = withRefreshLock(async function () {
      var user = await owner.getUser();
      if (!user) return null;
      if (user.access_token !== staleAccessToken && !expiring(user)) {
        await owner.events.load(user);
        return user;
      }
      if (!user.refresh_token) return null;
      return owner.signinSilent();
    }).finally(function () {
      renewal = null;
    });
  }
  return renewal;
}

async function settleStoredUser(user) {
  if (!user || !user.expired) return user;
  try {
    var renewed = await renewCoreOidcUser(user.access_token);
    if (renewed) return renewed;
  } catch (error) {
    if (!rejectedRenewal(error)) throw contractError("oidc-renewal-failed", "Core session could not be renewed");
  }
  await manager.removeUser();
  return null;
}

async function renewAfterUnauthorized(staleAccessToken) {
  try {
    var renewed = await renewCoreOidcUser(staleAccessToken);
    if (renewed) return renewed;
  } catch (error) {
    if (rejectedRenewal(error)) await endSession();
    return null;
  }
  var stored = await manager.getUser();
  if (!stored || stored.expired) await endSession();
  return null;
}

function renewInBackground() {
  return manager.getUser().then(function (user) {
    if (!user || !user.refresh_token) return null;
    if (!expiring(user)) return manager.events.load(user);
    return renewCoreOidcUser(user.access_token).catch(function (error) {
      return rejectedRenewal(error) ? endSession() : null;
    });
  });
}

async function endSession() {
  if (await manager.getUser()) await manager.removeUser();
  if (sessionListeners.ended) sessionListeners.ended();
}

function attachRenewal(next) {
  if (detachRenewal) detachRenewal();
  renewal = null;
  var removers = [
    next.events.addAccessTokenExpiring(renewInBackground),
    next.events.addAccessTokenExpired(renewInBackground),
    next.events.addUserLoaded(function (user) {
      if (sessionListeners.renewed) sessionListeners.renewed(user);
    }),
  ];
  detachRenewal = function () { removers.forEach(function (remove) { remove(); }); };
}

function withRefreshLock(callback) {
  var locks = globalThis.navigator && globalThis.navigator.locks;
  if (!locks) return Promise.resolve().then(callback);
  return locks.request(CORE_OIDC_REFRESH_LOCK, callback);
}

function expiring(user) {
  return user.expires_in !== undefined && user.expires_in <= EXPIRING_THRESHOLD_SECONDS;
}

function rejectedRenewal(error) {
  return !!(globalThis.oidc && globalThis.oidc.ErrorResponse && error instanceof globalThis.oidc.ErrorResponse);
}

function authorizationHeader(init) {
  var headers = init && init.headers;
  if (!headers || typeof headers !== "object") return null;
  var name = Object.keys(headers).find(function (key) { return key.toLowerCase() === "authorization"; });
  return name && headers[name] ? { name: name, value: String(headers[name]) } : null;
}

function bearerToken(value) {
  return value.split(" ").slice(1).join(" ");
}

function withAuthorization(init, name, user) {
  var headers = Object.assign({}, init.headers);
  headers[name] = (user.token_type || "Bearer") + " " + user.access_token;
  return Object.assign({}, init, { headers: headers });
}

export function storedCoreOidcUser() {
  if (!manager) return Promise.resolve(null);
  return manager.getUser().then(function (user) { return user && !user.expired ? user : null; });
}

export function startCoreOidcSignIn(config) {
  if (!manager) return Promise.reject(contractError("oidc-manager-unavailable", "Core sign-in is not ready"));
  var returnUrl = portalRouteUrl(config, config.defaultRoute || "orders.list");
  globalThis.sessionStorage.setItem(config.authReturnStorageKey || "oidc-return-url", returnUrl.href);
  return manager.signinRedirect();
}

export function startCoreOidcSignOut(config) {
  if (!manager) return Promise.reject(contractError("oidc-manager-unavailable", "Core sign-out is not ready"));
  var configured = config && config.logoutReturnUrl;
  var returnUrl = configured ? new URL(configured) : new URL(globalThis.location.href);
  if (!configured) returnUrl.hash = "#/login";
  if (configured && (returnUrl.protocol !== "https:" || !(config.allowedNavOrigins || []).includes(returnUrl.origin))) {
    return Promise.reject(contractError("oidc-logout-return-invalid", "Configured sign-out return URL is not allowlisted"));
  }
  globalThis.sessionStorage.setItem(config.authLogoutReturnStorageKey || "oidc-logout-return-url", returnUrl.href);
  return manager.signoutRedirect();
}

function sameOriginUrl(value, label) {
  var url = new URL(value, globalThis.location.origin);
  if (url.origin !== globalThis.location.origin) throw contractError("cross-origin-service", label + " must be same-origin");
  return url.href;
}

function portalRouteUrl(config, routeId) {
  var configured = config && config.portalUrl;
  var returnUrl = configured ? new URL(configured) : new URL(globalThis.location.href);
  if (configured && (returnUrl.protocol !== "https:" || !(config.allowedNavOrigins || []).includes(returnUrl.origin))) {
    throw contractError("oidc-return-invalid", "Configured portal return URL is not allowlisted");
  }
  var route = routePath(routeId);
  if (config.routerMode === "history") {
    if (!returnUrl.pathname.endsWith("/")) throw contractError("oidc-return-invalid", "History-mode portal URL must end with a slash");
    returnUrl.pathname += route.replace(/^\//, "");
    return returnUrl;
  }
  returnUrl.hash = "#" + route;
  return returnUrl;
}

function contractError(code, message) { var error = new Error(message); error.code = code; return error; }

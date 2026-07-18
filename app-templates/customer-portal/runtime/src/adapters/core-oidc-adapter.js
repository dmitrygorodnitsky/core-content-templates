var manager = null;

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
    userStore: new globalThis.oidc.WebStorageStateStore({ store: globalThis.localStorage }),
  });
  var user = await manager.getUser();
  if (user && user.expired) {
    await manager.removeUser();
    user = null;
  }
  return { state: user ? "ready-signed-in" : "ready-signed-out", user: user || null };
}

export function startCoreOidcSignIn(config) {
  if (!manager) return Promise.reject(contractError("oidc-manager-unavailable", "Core sign-in is not ready"));
  var returnUrl = new URL(globalThis.location.href);
  returnUrl.hash = "#/orders";
  globalThis.sessionStorage.setItem(config.authReturnStorageKey || "oidc-return-url", returnUrl.href);
  return manager.signinRedirect();
}

export function startCoreOidcSignOut(config) {
  if (!manager) return Promise.reject(contractError("oidc-manager-unavailable", "Core sign-out is not ready"));
  var returnUrl = new URL(globalThis.location.href);
  returnUrl.hash = "#/login";
  globalThis.sessionStorage.setItem(config.authLogoutReturnStorageKey || "oidc-logout-return-url", returnUrl.href);
  return manager.signoutRedirect();
}

function sameOriginUrl(value, label) {
  var url = new URL(value, globalThis.location.origin);
  if (url.origin !== globalThis.location.origin) throw contractError("cross-origin-service", label + " must be same-origin");
  return url.href;
}

function contractError(code, message) { var error = new Error(message); error.code = code; return error; }

// customer-portal-design/src/routes/AuthOidcPage.js — Wave 10: Core OIDC login (route auth.oidc, path /login).
// PRESENTATION ONLY. The real flow is authorization-code + PKCE owned by the Core
// account service: auth.oidcSignIn starts the redirect, the browser leaves this page
// and returns to the same /login URL. No password input, API key, access token or
// customer Account id is ever rendered here — the only dynamic values are the session
// status (state.oidc) and ONE customer-safe display name (data-bind="session.displayName").
import { h } from "../dom.js";
import { F } from "../../data/fixtures.js";
import { state } from "../state.js";
import { ActionButton } from "../components/primitives/ActionButton.js";

export function AuthOidc() {
  var s = state.oidc || "ready-signed-out";
  var page = h("section", { "class": "page auth-page", "data-route": "auth.oidc", "data-visual-id": "auth.oidc", "data-screen-label": "Login (" + s + ")" });
  var grid = h("div", { "class": "auth-grid" });

  /* left column — operational, not marketing: explains the redirect */
  grid.appendChild(h("div", { "class": "auth-pitch" }, [
    h("span", { "class": "eyebrow" }, "Customer account"),
    h("h1", { "class": "auth-pitch__title" }, "Secure sign-in, handled in one place."),
    h("p", { "class": "auth-pitch__sub" }, "You sign in with our secure account service and come straight back here. Your password is never entered on this site.")
  ]));

  var card = h("div", { "class": "auth-card", "data-module": "core-oidc-auth", "data-visual-id": "core-oidc-auth", "data-state": s });
  if (s === "checking-session") card.appendChild(OidcProgress("checking-session", "Checking your session\u2026", "Securely restoring your existing sign-in. This only takes a moment \u2014 no need to do anything."));
  else if (s === "ready-signed-out") card.appendChild(OidcSignedOut());
  else if (s === "redirecting") card.appendChild(OidcProgress("redirecting", "Taking you to secure sign-in\u2026", "This page is leaving for the secure account service. You\u2019ll come back here automatically \u2014 no need to do anything."));
  else if (s === "unavailable") card.appendChild(OidcUnavailable());
  else if (s === "ready-signed-in") card.appendChild(OidcSignedIn());
  else if (s === "signing-out") card.appendChild(OidcProgress("signing-out", "Signing you out\u2026", "Finishing sign-out with the secure account service. One moment."));

  grid.appendChild(card);
  page.appendChild(grid);
  return page;
}

function oidcStep(n, text) {
  return h("div", { "class": "oidc-step" }, [h("span", { "class": "oidc-step__num" }, String(n)), text]);
}

function OidcSignedOut() {
  return h("div", { "data-state": "ready-signed-out" }, [
    h("div", { "class": "brand-logo brand-logo--lg", style: "margin-bottom:18px" }),
    h("div", { "class": "oidc-title" }, "Sign in to your account"),
    h("div", { "class": "oidc-sub" }, "Sign-in continues in the secure account service. When you\u2019re done, you\u2019ll return right here."),
    h("div", { "class": "oidc-steps" }, [
      oidcStep(1, "Continue to the secure account service"),
      oidcStep(2, "Sign in there \u2014 we never see your password"),
      oidcStep(3, "Come back here, signed in")
    ]),
    ActionButton({ variant: "btn--primary", label: "Continue to secure sign-in", action: "auth.oidcSignIn", block: true, lg: true, visualId: "oidc-signin" }),
    h("div", { "class": "oidc-note" }, "By continuing you agree to our Terms & Privacy Policy.")
  ]);
}

/* shared non-interactive progress body (checking-session | redirecting | signing-out).
   checking-session = initial bootstrap on every page load (incl. the return from
   /core/oauth2-callback.html): discovery + session restore from browser storage.
   It claims NO redirect, shows NO sign-in controls and NO session name. */
function OidcProgress(stateName, title, sub) {
  return h("div", { "data-state": stateName, "aria-busy": "true" }, [
    h("div", { "class": "oidc-status" }, [h("span", { "class": "oidc-spinner" })]),
    h("div", { "class": "oidc-title" }, title),
    h("div", { "class": "oidc-sub oidc-sub--tail" }, sub)
  ]);
}

/* honest retry — Core discovery / authorization library failed to initialize.
   Deliberately NO fallback login method. */
function OidcUnavailable() {
  return h("div", { "data-state": "unavailable" }, [
    h("div", { "class": "oidc-status" }, [h("div", { "class": "oidc-glyph oidc-glyph--warn" }, "!")]),
    h("div", { "class": "oidc-title" }, "Secure sign-in isn\u2019t available"),
    h("div", { "class": "oidc-sub" }, "We couldn\u2019t reach the secure account service, so sign-in can\u2019t start right now. There\u2019s no other way to sign in here \u2014 please try again in a moment."),
    h("div", { "class": "oidc-actions" }, [
      ActionButton({ variant: "btn--primary", label: "Try again", action: "auth.retrySession", block: true, lg: true, visualId: "oidc-retry" }),
      ActionButton({ variant: "btn--ghost", label: "Back to the catalog", action: "nav.landing", block: true, visualId: "oidc-back-catalog" })
    ])
  ]);
}

function OidcSignedIn() {
  /* the ONLY dynamic session value besides status — a single customer-safe
     display name supplied by the authenticated session */
  var name = state.sessionName || F.customer.firstName;
  return h("div", { "data-state": "ready-signed-in" }, [
    h("div", { "class": "oidc-status" }, [h("div", { "class": "oidc-glyph oidc-glyph--ok" }, "\u2713")]),
    h("div", { "class": "oidc-title" }, "You\u2019re signed in"),
    h("div", { "class": "oidc-session" }, [
      h("div", { "class": "oidc-session__ava" }, (name || "?").charAt(0).toUpperCase()),
      h("div", null, [
        h("div", { "class": "oidc-session__label" }, "Signed in as"),
        h("div", { "class": "oidc-session__name", "data-bind": "session.displayName" }, name)
      ])
    ]),
    h("div", { "class": "oidc-sub" }, "You can keep browsing while signed in."),
    h("div", { "class": "oidc-actions" }, [
      ActionButton({ variant: "btn--primary", label: "Browse the catalog", action: "nav.landing", block: true, lg: true, visualId: "oidc-browse-catalog" }),
      ActionButton({ variant: "btn--ghost", label: "Sign out", action: "auth.signOut", block: true, visualId: "oidc-signout" })
    ])
  ]);
}

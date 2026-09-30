// customer-portal-design/src/components/shell/AccountBootstrap.js — Wave 13: shared session/account
// states. After Core sign-in the portal must resolve the subject to ONE active SPA_CUSTOMER Account
// before any private data renders. While that is unresolved (or failed), this module replaces every
// private route body — no private fixture entity is ever rendered as a fallback.
// data-state on the module: resolving-customer | customer-unavailable | customer-not-linked |
// customer-account-ambiguous | organization-forbidden | customer-forbidden | session-expired. The intended route is PRESERVED in state.route and exposed
// as data-intended-route (a route id — never an Account id, tenant id, token, role or claim).
import { h } from "../../dom.js";
import { state, routeLabel } from "../../state.js";
import { ActionButton } from "../primitives/ActionButton.js";

function gateActions(list) {
  return h("div", { "class": "account-gate__actions" }, list);
}

export function AccountBootstrap() {
  var s = state.account;
  var page = h("section", { "class": "page account-gate", "data-route": state.route, "data-state": s, "data-visual-id": "account-gate", "data-screen-label": "Account (" + s + ")" });
  var card = h("div", { "class": "auth-card account-gate__card", "data-module": "account-bootstrap", "data-visual-id": "account-bootstrap", "data-state": s, "data-intended-route": state.route });

  if (s === "resolving-customer") {
    /* non-interactive: no private entities, no ids, no claims */
    card.setAttribute("aria-busy", "true");
    card.appendChild(h("div", { "class": "oidc-status" }, [h("span", { "class": "oidc-spinner" })]));
    card.appendChild(h("div", { "class": "oidc-title" }, "Getting your account ready\u2026"));
    card.appendChild(h("div", { "class": "oidc-sub oidc-sub--tail" }, "You\u2019re signed in. We\u2019re securely loading your account and what it can do here \u2014 no need to do anything."));
  } else if (s === "customer-unavailable") {
    card.appendChild(h("div", { "class": "oidc-status" }, [h("div", { "class": "oidc-glyph oidc-glyph--warn" }, "!")]));
    card.appendChild(h("div", { "class": "oidc-title" }, "We can\u2019t open your account right now"));
    card.appendChild(h("div", { "class": "oidc-sub" }, "The portal couldn\u2019t load your account. Your data is safe and nothing was changed \u2014 try again in a moment."));
    card.appendChild(gateActions([
      ActionButton({ variant: "btn--primary", label: "Try again", action: "ui.retry", id: "account-bootstrap", block: true, lg: true, visualId: "account-retry" }),
      ActionButton({ variant: "btn--ghost", label: "Sign out", action: "auth.signOut", block: true, visualId: "account-signout" })
    ]));
  } else if (s === "customer-not-linked") {
    card.appendChild(h("div", { "class": "oidc-status" }, [h("div", { "class": "oidc-glyph" }, "\u26ad")]));
    card.appendChild(h("div", { "class": "oidc-title" }, "This sign-in isn\u2019t linked to a customer account"));
    card.appendChild(h("div", { "class": "oidc-sub" }, "You\u2019re signed in, but this identity isn\u2019t connected to an active customer account with us, so the portal can\u2019t be opened. Our support team can link it for you."));
    card.appendChild(gateActions([
      ActionButton({ variant: "btn--primary", label: "Contact support", action: "support.email", block: true, lg: true, visualId: "account-support" }),
      ActionButton({ variant: "btn--ghost", label: "Sign out", action: "auth.signOut", block: true, visualId: "account-signout" })
    ]));
  } else if (s === "customer-account-ambiguous") {
    /* wave 14 — non-enumerating: never lists candidate accounts, never lets the browser pick */
    card.appendChild(h("div", { "class": "oidc-status" }, [h("div", { "class": "oidc-glyph" }, "\u29c9")]));
    card.appendChild(h("div", { "class": "oidc-title" }, "We can\u2019t tell which account is yours"));
    card.appendChild(h("div", { "class": "oidc-sub" }, "Your sign-in matches more than one customer account, so the portal won\u2019t guess. Our support team can link the right one \u2014 nothing is shown until then."));
    card.appendChild(gateActions([
      ActionButton({ variant: "btn--primary", label: "Contact support", action: "support.email", block: true, lg: true, visualId: "account-support" }),
      ActionButton({ variant: "btn--ghost", label: "Sign out", action: "auth.signOut", block: true, visualId: "account-signout" })
    ]));
  } else if (s === "organization-forbidden") {
    /* wave 14 — non-enumerating: no organization name, code or reason */
    card.appendChild(h("div", { "class": "oidc-status" }, [h("div", { "class": "oidc-glyph" }, "\u2302")]));
    card.appendChild(h("div", { "class": "oidc-title" }, "This sign-in can\u2019t be used here"));
    card.appendChild(h("div", { "class": "oidc-sub" }, "Your sign-in works, but it doesn\u2019t belong to this portal\u2019s organization, so nothing here can be opened. If that seems wrong, contact support."));
    card.appendChild(gateActions([
      ActionButton({ variant: "btn--primary", label: "Contact support", action: "support.email", block: true, lg: true, visualId: "account-support" }),
      ActionButton({ variant: "btn--ghost", label: "Sign out", action: "auth.signOut", block: true, visualId: "account-signout" })
    ]));
  } else if (s === "customer-forbidden") {
    /* non-enumerating: no reason, no role names, no claims */
    card.appendChild(h("div", { "class": "oidc-status" }, [h("div", { "class": "oidc-glyph" }, "\u26bf")]));
    card.appendChild(h("div", { "class": "oidc-title" }, "This account can\u2019t open the customer portal"));
    card.appendChild(h("div", { "class": "oidc-sub" }, "Your sign-in works, but it doesn\u2019t include access to the customer portal. If you believe it should, contact support."));
    card.appendChild(gateActions([
      ActionButton({ variant: "btn--primary", label: "Contact support", action: "support.email", block: true, lg: true, visualId: "account-support" }),
      ActionButton({ variant: "btn--ghost", label: "Sign out", action: "auth.signOut", block: true, visualId: "account-signout" })
    ]));
  } else if (s === "session-expired") {
    card.appendChild(h("div", { "class": "oidc-status" }, [h("div", { "class": "oidc-glyph" }, "\u23f1")]));
    card.appendChild(h("div", { "class": "oidc-title" }, "Your session ended"));
    card.appendChild(h("div", { "class": "oidc-sub" }, "For your security you were signed out. Nothing you see below is live anymore. Sign in again and you\u2019ll come right back here."));
    card.appendChild(h("div", { "class": "account-gate__route" }, ["Returning to\u2002", h("b", null, routeLabel(state.route))]));
    card.appendChild(gateActions([
      ActionButton({ variant: "btn--primary", label: "Sign in again", action: "auth.oidcSignIn", block: true, lg: true, visualId: "account-reauth" }),
      ActionButton({ variant: "btn--ghost", label: "Back to the catalog", action: "nav.landing", block: true, visualId: "account-catalog" })
    ]));
  }

  page.appendChild(card);
  return page;
}

import { h } from "../dom.js";
import { state } from "../state.js";
import { ensureRequestLink } from "../actions.js";
import { ActionButton } from "../components/primitives/ActionButton.js";

export function RequestLink() {
  var link = ensureRequestLink() || { event: "confirm", phase: "invalid" };
  var copy = state.config.requestLinkCopy;
  var cancel = link.event === "cancel";
  var phase = link.phase === "ready" ? "pending" : link.phase;
  var page = h("section", { "class": "page account-gate", "data-route": state.route, "data-visual-id": "request-link", "data-state": phase });
  var card = h("div", { "class": "auth-card account-gate__card", "data-module": "request-link", "data-visual-id": "request-link-card", "data-event": link.event, "data-state": phase });
  if (phase === "pending") {
    card.setAttribute("aria-busy", "true");
    card.appendChild(h("div", { "class": "oidc-status" }, [h("span", { "class": "oidc-spinner" })]));
    card.appendChild(h("div", { "class": "oidc-title" }, cancel ? copy.cancelling : copy.confirming));
  } else if (phase === "done") {
    card.setAttribute("role", "status");
    card.appendChild(h("div", { "class": "oidc-status" }, [h("div", { "class": "oidc-glyph oidc-glyph--ok" }, "\u2713")]));
    card.appendChild(h("div", { "class": "oidc-title" }, cancel ? copy.cancelledTitle : copy.confirmedTitle));
    card.appendChild(h("div", { "class": "oidc-sub oidc-sub--tail" }, cancel ? copy.cancelledBody : copy.confirmedBody));
  } else if (phase === "failed") {
    card.setAttribute("role", "alert");
    card.appendChild(h("div", { "class": "oidc-status" }, [h("div", { "class": "oidc-glyph oidc-glyph--warn" }, "!")]));
    card.appendChild(h("div", { "class": "oidc-title" }, copy.failedTitle));
    card.appendChild(h("div", { "class": "oidc-sub" }, copy.failedBody));
    card.appendChild(h("div", { "class": "account-gate__actions" }, [
      ActionButton({ variant: "btn--primary", label: copy.retry, action: "requestLink.retry", block: true, lg: true, visualId: "request-link-retry" })
    ]));
  } else {
    card.setAttribute("role", "alert");
    card.appendChild(h("div", { "class": "oidc-status" }, [h("div", { "class": "oidc-glyph oidc-glyph--warn" }, "!")]));
    card.appendChild(h("div", { "class": "oidc-title" }, copy.invalidTitle));
    card.appendChild(h("div", { "class": "oidc-sub oidc-sub--tail" }, copy.invalidBody));
  }
  page.appendChild(card);
  return page;
}

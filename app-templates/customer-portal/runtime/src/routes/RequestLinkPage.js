import { h } from "../dom.js";
import { state } from "../state.js";
import { ActionButton } from "../components/primitives/ActionButton.js";

export function RequestLink() {
  var link = state.requestLink || { event: "confirm", phase: "invalid" };
  var copy = state.config.requestLinkCopy;
  var cancel = link.event === "cancel";
  var phase = link.phase;
  var page = h("section", { "class": "page account-gate", "data-route": state.route, "data-visual-id": "request-link", "data-state": phase });
  var card = h("div", { "class": "auth-card account-gate__card", "data-module": "request-link", "data-visual-id": "request-link-card", "data-event": link.event, "data-state": phase });
  if (phase === "prompt") {
    card.appendChild(h("div", { "class": "oidc-title" }, cancel ? copy.cancelTitle : copy.confirmTitle));
    card.appendChild(h("div", { "class": "oidc-sub" }, cancel ? copy.cancelBody : copy.confirmBody));
    card.appendChild(actions(cancel ? copy.cancelButton : copy.confirmButton, "requestLink.send", "request-link-send"));
  } else if (phase === "pending") {
    card.setAttribute("aria-busy", "true");
    card.appendChild(h("div", { "class": "oidc-status" }, [h("span", { "class": "oidc-spinner" })]));
    card.appendChild(h("div", { "class": "oidc-title" }, cancel ? copy.cancelling : copy.confirming));
  } else if (phase === "done") {
    card.setAttribute("role", "status");
    card.appendChild(glyph("ok", "✓"));
    card.appendChild(h("div", { "class": "oidc-title" }, cancel ? copy.cancelledTitle : copy.confirmedTitle));
    card.appendChild(h("div", { "class": "oidc-sub oidc-sub--tail" }, cancel ? copy.cancelledBody : copy.confirmedBody));
  } else if (phase === "failed") {
    card.setAttribute("role", "alert");
    card.appendChild(glyph("warn", "!"));
    card.appendChild(h("div", { "class": "oidc-title" }, copy.failedTitle));
    card.appendChild(h("div", { "class": "oidc-sub" }, copy.failedBody));
    card.appendChild(actions(copy.retry, "requestLink.send", "request-link-retry"));
  } else if (phase === "unconfirmed") {
    card.setAttribute("role", "alert");
    card.appendChild(glyph("warn", "!"));
    card.appendChild(h("div", { "class": "oidc-title" }, copy.unconfirmedTitle));
    card.appendChild(h("div", { "class": "oidc-sub" }, copy.unconfirmedBody));
    card.appendChild(actions(copy.checkAgain, "requestLink.check", "request-link-check"));
  } else {
    card.setAttribute("role", "alert");
    card.appendChild(glyph("warn", "!"));
    card.appendChild(h("div", { "class": "oidc-title" }, copy.invalidTitle));
    card.appendChild(h("div", { "class": "oidc-sub oidc-sub--tail" }, copy.invalidBody));
  }
  page.appendChild(card);
  return page;
}

function glyph(tone, mark) {
  return h("div", { "class": "oidc-status" }, [h("div", { "class": "oidc-glyph oidc-glyph--" + tone }, mark)]);
}

function actions(label, action, visualId) {
  return h("div", { "class": "account-gate__actions" }, [
    ActionButton({ variant: "btn--primary", label: label, action: action, block: true, lg: true, visualId: visualId })
  ]);
}

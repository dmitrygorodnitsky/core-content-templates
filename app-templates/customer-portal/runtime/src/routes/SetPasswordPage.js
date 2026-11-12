import { h } from "../dom.js";
import { state } from "../state.js";
import { ACTIONS } from "../actions.js";
import { ActionButton } from "../components/primitives/ActionButton.js";
import { PASSWORD_MIN_LENGTH, changeSetPasswordEntry, setPasswordEntry } from "../set-password.js";

export function SetPassword() {
  var link = state.setPassword || { login: "", phase: "invalid", errors: {}, message: "" };
  var phase = link.phase;
  var provider = state.config.brandName || "your service provider";
  var page = h("section", { "class": "page account-gate", "data-route": "auth.setPassword", "data-visual-id": "set-password", "data-state": phase });
  var card = h("div", { "class": "auth-card account-gate__card", "data-module": "set-password", "data-visual-id": "set-password-card", "data-state": phase });
  if (phase === "prompt") {
    card.appendChild(h("div", { "class": "oidc-title" }, "Set your password"));
    card.appendChild(h("div", { "class": "oidc-sub" }, "Choose the password you will sign in to " + provider + " with."));
    card.appendChild(PasswordForm(link));
  } else if (phase === "pending") {
    card.setAttribute("aria-busy", "true");
    card.appendChild(h("div", { "class": "oidc-status" }, [h("span", { "class": "oidc-spinner" })]));
    card.appendChild(h("div", { "class": "oidc-title" }, "Setting your password…"));
  } else if (phase === "done") {
    card.setAttribute("role", "status");
    card.appendChild(glyph("ok", "✓"));
    card.appendChild(h("div", { "class": "oidc-title" }, "Your password is set"));
    card.appendChild(h("div", { "class": "oidc-sub" }, ["Sign in with ", h("strong", { "data-module": "set-password-login" }, link.login), " and your new password."]));
    card.appendChild(actions("Sign in", "auth.gotoSignin", "set-password-sign-in"));
  } else {
    card.setAttribute("role", "alert");
    card.appendChild(glyph("warn", "!"));
    card.appendChild(h("div", { "class": "oidc-title" }, phase === "expired" ? "This link has expired" : "This link is incomplete"));
    card.appendChild(h("div", { "class": "oidc-sub" }, phase === "expired"
      ? "A set-password link works once. If you have already set your password, sign in. Otherwise contact " + provider + " and ask for a new link."
      : "Open the link from your email again. If it still doesn’t work, contact " + provider + " and ask for a new link."));
    card.appendChild(actions("Sign in", "auth.gotoSignin", "set-password-sign-in"));
  }
  page.appendChild(card);
  return page;
}

function PasswordForm(link) {
  var entry = setPasswordEntry();
  var form = h("form", { "class": "set-password__form", "data-module": "set-password-form", novalidate: true, autocomplete: "on" });
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    ACTIONS["setPassword.submit"]();
  });
  form.appendChild(field("set-password-login", "Sign-in email", h("input", { "class": "field", id: "set-password-login", name: "username", type: "email", value: link.login, autocomplete: "username", readonly: true }), ""));
  form.appendChild(field("set-password-new", "New password", passwordInput("set-password-new", "password", entry.password, link.errors.password), link.errors.password, "At least " + PASSWORD_MIN_LENGTH + " characters."));
  form.appendChild(field("set-password-confirm", "Repeat the password", passwordInput("set-password-confirm", "confirm", entry.confirm, link.errors.confirm), link.errors.confirm));
  if (link.message) {
    form.appendChild(h("div", { "class": "inline-fail", "data-module": "set-password-message", role: "alert" }, [
      h("span", { "class": "inline-fail__icon", "aria-hidden": "true" }, "!"),
      h("div", { "class": "decision-outcome__body" }, link.message),
    ]));
  }
  form.appendChild(h("div", { "class": "account-gate__actions" }, [
    h("button", { "class": "btn btn--primary btn--block btn--lg", type: "submit", "data-module": "action-button", "data-visual-id": "set-password-submit" }, "Set password"),
  ]));
  return form;
}

function passwordInput(id, name, value, error) {
  var input = h("input", {
    "class": "field",
    id: id,
    name: name === "password" ? "new-password" : "confirm-password",
    type: "password",
    value: value || "",
    autocomplete: "new-password",
    minlength: String(PASSWORD_MIN_LENGTH),
    "data-state": error ? "invalid" : undefined,
    "aria-invalid": error ? "true" : undefined,
    "aria-describedby": error ? id + "-error" : name === "password" ? id + "-hint" : undefined,
  });
  input.addEventListener("input", function () { changeSetPasswordEntry(name, input.value); });
  return input;
}

function field(id, label, control, error, hint) {
  return h("div", { "class": "field-row set-password__field" }, [
    h("label", { "class": "field-label", "for": id }, label),
    control,
    error ? h("div", { "class": "field-error", id: id + "-error", role: "alert" }, error) : hint ? h("div", { "class": "set-password__hint", id: id + "-hint" }, hint) : null,
  ]);
}

function glyph(tone, mark) {
  return h("div", { "class": "oidc-status" }, [h("div", { "class": "oidc-glyph oidc-glyph--" + tone }, mark)]);
}

function actions(label, action, visualId) {
  return h("div", { "class": "account-gate__actions" }, [
    ActionButton({ variant: "btn--primary", label: label, action: action, block: true, lg: true, visualId: visualId })
  ]);
}

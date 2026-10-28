import { h } from "../dom.js";
import { state } from "../state.js";
import { ACTIONS } from "../actions.js";
import { EmptyState } from "../components/primitives/EmptyState.js";
import { ErrorState } from "../components/primitives/ErrorState.js";
import { UnauthorizedState, skel } from "../components/primitives/RouteStates.js";
import { PROFILE_EDIT_ROWS, changeProfileDraft, currentSignIn, profileEditBusy, profileEditing } from "../profile-edit.js";
import { createGoogleMapsAdapter } from "../adapters/google-maps-adapter.js";

const SUGGESTION_DELAY = 250;
const SUGGESTION_MINIMUM = 3;
let addressFinder = null;

export function accountProfileView() {
  var envelope = state.moduleData.profile;
  if (state.moduleStatus.profile === "loading" || !envelope) return "loading";
  return envelope.state;
}

export function AccountProfile() {
  var view = accountProfileView();
  var envelope = state.moduleData.profile;
  var editable = profileEditing(state.config);
  var page = h("section", { "class": "page page--narrow", "data-route": "profile", "data-visual-id": "profile", "data-state": view });

  if (view === "loading") page.appendChild(ProfileSkeleton());
  else if (view === "unauthorized") page.appendChild(UnauthorizedState({ scope: "your account details", backRoute: state.config.defaultRoute }));
  else if (view === "error") page.appendChild(ErrorState({ title: "Couldn’t load your account details", desc: "Nothing was changed. Check your connection and try again." }));
  else if (view === "unavailable") page.appendChild(stateBlock(EmptyState({ glyph: "○", title: "Your account details aren’t available", desc: "They didn’t come back for this sign-in. Sign out and sign in again, or try later." }), "unavailable"));
  else {
    page.appendChild(ProfileHead(envelope, editable));
    var facts = editable ? EditableFacts(envelope) : view === "empty" ? null : ProfileFacts(envelope);
    if (facts) page.appendChild(facts);
    else page.appendChild(EmptyState({ glyph: "◌", title: "No contact details on file", desc: "We don’t have a contact, email, phone or billing address for your account yet." }));
    if (editable) page.appendChild(SignInFacts());
  }

  page.appendChild(h("button", { "class": "signout-btn", "data-action": "auth.signOut", "data-visual-id": "sign-out", type: "button", style: "width:100%;margin-top:18px" }, "Sign out"));
  return page;
}

function ProfileHead(envelope, editable) {
  return h("div", { "class": "prop-head", "data-module": "profile-head", "data-visual-id": "profile-head" }, [
    h("div", { style: "flex:1;min-width:0" }, [
      h("h1", { "class": "prop-head__title", style: "overflow-wrap:anywhere" }, envelope.accountName || "Your account"),
      h("div", { "class": "prop-head__addr" }, editable ? "The details we have on file for your account. Select Edit to change one." : "The details we have on file for your account."),
    ]),
  ]);
}

function ProfileFacts(envelope) {
  var contact = envelope.contact;
  var billing = envelope.billingAddresses || [];
  var named = !!(contact && contact.name) && contact.name !== envelope.accountName;
  var facts = [
    named ? Fact("contact", "Contact", [contact.name], contact.title) : null,
    Fact("email", "Email", envelope.emails || []),
    Fact("phone", "Phone", envelope.phones || []),
    Fact("billing", billing.length > 1 ? "Billing addresses" : "Billing address", billing),
  ].filter(Boolean);
  if (!facts.length) return null;
  return h("div", { "class": "card card--pad prop-facts", "data-module": "profile-facts", "data-visual-id": "profile-facts", "data-state": envelope.state }, facts);
}

function Fact(key, label, values, note) {
  if (!values.length) return null;
  var children = [h("div", { "class": "prop-fact__label" }, label)];
  values.forEach(function (value) { children.push(h("div", { "class": "prop-fact__value", style: "overflow-wrap:anywhere" }, value)); });
  if (note) children.push(h("div", { "class": "prop-fact__note" }, note));
  return h("div", { "class": "prop-fact", "data-fact": key, "data-state": "ready" }, children);
}

function EditableFacts(envelope) {
  var contact = envelope.contact;
  var billing = envelope.billingAddresses || [];
  return h("div", { "class": "card card--pad prop-facts", "data-module": "profile-facts", "data-visual-id": "profile-facts", "data-state": envelope.state }, [
    EditableFact("contact", contact && contact.name ? [contact.name] : [], contact && contact.title),
    EditableFact("email", envelope.emails || []),
    EditableFact("phone", envelope.phones || []),
    EditableFact("billing", billing, null, billing.length > 1 ? "Billing addresses" : null),
  ]);
}

function SignInFacts() {
  var changed = state.profileLoginChanged;
  var login = currentSignIn();
  return h("div", { "class": "card card--pad prop-facts prop-facts--single", "data-module": "profile-sign-in", "data-visual-id": "profile-sign-in" }, [
    EditableFact("login", login ? [login] : [], changed ? "Use this account name the next time you sign in. Your password stays the same." : "The name you sign in to this portal with. Changing it does not change your contact email."),
  ]);
}

function EditableFact(key, values, note, label) {
  var definition = PROFILE_EDIT_ROWS[key];
  var edit = state.profileEdit;
  if (edit && edit.row === key) return EditingFact(key, definition, edit);
  var busy = profileEditBusy();
  var title = label || definition.label;
  var children = [h("div", { "class": "prop-fact__head" }, [
    h("div", { "class": "prop-fact__label" }, title),
    h("button", {
      "class": "link-action prop-fact__edit",
      type: "button",
      "data-action": "profileEdit.start",
      "data-id": key,
      "data-visual-id": "profile-edit-" + key,
      "aria-label": (values.length ? "Edit " : "Add ") + definition.label.toLowerCase(),
      disabled: busy ? true : undefined,
    }, values.length ? "Edit" : "Add"),
  ])];
  values.forEach(function (value) { children.push(h("div", { "class": "prop-fact__value", style: "overflow-wrap:anywhere" }, value)); });
  if (state.profileSaved === key) children.push(h("div", { "class": "prop-fact__saved", role: "status" }, "Saved"));
  if (note) children.push(h("div", { "class": "prop-fact__note" }, note));
  return h("div", { "class": "prop-fact", "data-fact": key, "data-state": values.length ? "ready" : "missing" }, children);
}

function EditingFact(key, definition, edit) {
  var saving = edit.phase === "saving";
  var ended = edit.phase === "session-ended";
  var row = h("div", { "class": "prop-fact prop-fact--editing", "data-fact": key, "data-state": edit.phase, "data-visual-id": "profile-editing-" + key }, [
    h("div", { "class": "prop-fact__label", id: "profile-edit-" + key + "-label" }, definition.label),
  ]);
  var group = h("div", { "class": "prop-edit" + (definition.fields.length > 1 ? " prop-edit--pair" : ""), role: "group", "aria-labelledby": "profile-edit-" + key + "-label", "aria-busy": saving ? "true" : undefined });
  definition.fields.forEach(function (item) {
    var id = "profile-edit-" + item.key;
    var error = edit.errors[item.code];
    var input = h("input", {
      "class": "field",
      id: id,
      name: item.key,
      type: item.type,
      autocomplete: item.code === "BILLING_ADDRESS" && addressSuggestionsOpen() ? "off" : item.autocomplete,
      value: edit.draft[item.key] || "",
      placeholder: item.placeholder,
      "data-profile-input": item.code,
      "data-state": error ? "invalid" : undefined,
      "aria-invalid": error ? "true" : undefined,
      "aria-describedby": error ? id + "-error" : undefined,
      "aria-label": definition.fields.length > 1 ? undefined : item.label,
      disabled: saving || ended ? true : undefined,
      spellcheck: item.type === "text" && item.code !== "BILLING_ADDRESS" ? undefined : "false",
    });
    input.addEventListener("input", function () { changeProfileDraft(item.key, input.value); });
    input.addEventListener("keydown", function (event) {
      if (event.defaultPrevented) return;
      if (event.key === "Enter" && !input.getAttribute("aria-activedescendant")) { event.preventDefault(); ACTIONS["profileEdit.save"](); }
      if (event.key === "Escape" && input.getAttribute("aria-expanded") !== "true") { event.preventDefault(); ACTIONS["profileEdit.cancel"](); }
    });
    var cell = h("div", { "class": "field-row prop-edit__field" }, [
      definition.fields.length > 1 ? h("label", { "class": "field-label", "for": id }, item.label) : null,
      input,
      error ? h("div", { "class": "field-error", id: id + "-error", role: "alert" }, error) : null,
    ]);
    if (item.code === "BILLING_ADDRESS" && addressSuggestionsOpen() && !saving && !ended) suggestAddresses(input, cell, item.key);
    group.appendChild(cell);
  });
  row.appendChild(group);
  if (edit.message) row.appendChild(h("div", { "class": "prop-edit__message", role: "alert", "data-state": edit.phase }, edit.message));
  row.appendChild(h("div", { "class": "prop-edit__actions" }, ended ? [
    h("button", { "class": "btn btn--primary", type: "button", "data-action": "auth.signOut", "data-visual-id": "profile-edit-sign-in" }, "Sign in again"),
  ] : [
    h("button", { "class": "btn btn--primary", type: "button", "data-action": "profileEdit.save", "data-visual-id": "profile-edit-save", disabled: saving ? true : undefined }, saving ? "Saving…" : "Save"),
    h("button", { "class": "btn btn--ghost", type: "button", "data-action": "profileEdit.cancel", "data-visual-id": "profile-edit-cancel", disabled: saving ? true : undefined }, "Cancel"),
    h("span", { "class": "prop-edit__status", role: "status", "aria-live": "polite" }, saving ? (key === "login" ? "Changing your sign-in…" : "Saving and waiting for confirmation…") : ""),
  ]));
  return row;
}

function addressSuggestionsOpen() {
  return !!(state.config && state.config.mapsApiKey);
}

function suggestAddresses(input, cell, key) {
  if (!addressFinder) addressFinder = createGoogleMapsAdapter({ apiKey: state.config.mapsApiKey });
  var listId = input.getAttribute("id") + "-suggestions";
  var list = h("ul", { "class": "prop-suggest", id: listId, role: "listbox", "aria-label": "Suggested addresses", hidden: true });
  var offered = [];
  var active = -1;
  var timer = null;
  cell.appendChild(list);
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-controls", listId);
  input.setAttribute("aria-expanded", "false");

  function highlight(index) {
    active = index;
    offered.forEach(function (option, position) { option.node.setAttribute("aria-selected", position === index ? "true" : "false"); });
    if (index === -1) input.removeAttribute("aria-activedescendant");
    else input.setAttribute("aria-activedescendant", offered[index].node.getAttribute("id"));
  }

  function close() {
    list.replaceChildren();
    list.setAttribute("hidden", "");
    offered = [];
    highlight(-1);
    input.setAttribute("aria-expanded", "false");
  }

  function take(option) {
    close();
    Promise.resolve(option.item.address()).then(function (address) {
      input.value = address;
      changeProfileDraft(key, address);
      input.focus();
    });
  }

  input.addEventListener("keydown", function (event) {
    if (list.hasAttribute("hidden")) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      var count = offered.length;
      highlight(event.key === "ArrowDown" ? (active + 1) % count : (active <= 0 ? count : active) - 1);
    } else if (event.key === "Enter" && active !== -1) {
      event.preventDefault();
      take(offered[active]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  });
  input.addEventListener("blur", function () { setTimeout(close, 150); });
  input.addEventListener("input", function () {
    if (timer !== null) clearTimeout(timer);
    var value = input.value.trim();
    if (value.length < SUGGESTION_MINIMUM) { timer = null; close(); return; }
    timer = setTimeout(function () {
      timer = null;
      addressFinder.suggestAddresses(value).then(function (items) {
        if (input.value.trim() !== value || !input.isConnected) return;
        close();
        offered = items.map(function (item, index) {
          var node = h("li", { "class": "prop-suggest__option", id: listId + "-" + index, role: "option", "aria-selected": "false" }, item.label);
          var option = { node: node, item: item };
          node.addEventListener("mousedown", function (event) { event.preventDefault(); });
          node.addEventListener("click", function () { take(option); });
          list.appendChild(node);
          return option;
        });
        if (!offered.length) return;
        list.removeAttribute("hidden");
        input.setAttribute("aria-expanded", "true");
      }, close);
    }, SUGGESTION_DELAY);
  });
}

function ProfileSkeleton() {
  return h("div", { "data-module": "profile-loading", "data-visual-id": "profile-loading", "data-state": "loading", "aria-busy": "true" }, [
    h("div", { "class": "prop-head" }, [h("div", { style: "flex:1;min-width:0" }, [skel("width:52%;height:30px;margin-bottom:9px"), skel("width:38%;height:13px")])]),
    h("div", { "class": "card card--pad prop-facts" }, [0, 1, 2, 3].map(function () {
      return h("div", { "class": "prop-fact" }, [skel("width:34%;height:11px;margin-bottom:8px"), skel("width:72%;height:15px")]);
    })),
  ]);
}

function stateBlock(block, stateName) {
  block.setAttribute("data-state", stateName);
  return block;
}

import { h } from "../dom.js";
import { state } from "../state.js";
import { EmptyState } from "../components/primitives/EmptyState.js";
import { ErrorState } from "../components/primitives/ErrorState.js";
import { UnauthorizedState, skel } from "../components/primitives/RouteStates.js";

export function accountProfileView() {
  var envelope = state.moduleData.profile;
  if (state.moduleStatus.profile === "loading" || !envelope) return "loading";
  return envelope.state;
}

export function AccountProfile() {
  var view = accountProfileView();
  var envelope = state.moduleData.profile;
  var page = h("section", { "class": "page page--narrow", "data-route": "profile", "data-visual-id": "profile", "data-state": view });

  if (view === "loading") page.appendChild(ProfileSkeleton());
  else if (view === "unauthorized") page.appendChild(UnauthorizedState({ scope: "your account details", backRoute: state.config.defaultRoute }));
  else if (view === "error") page.appendChild(ErrorState({ title: "Couldn’t load your account details", desc: "Nothing was changed. Check your connection and try again." }));
  else if (view === "unavailable") page.appendChild(stateBlock(EmptyState({ glyph: "○", title: "Your account details aren’t available", desc: "They didn’t come back for this sign-in. Sign out and sign in again, or try later." }), "unavailable"));
  else {
    page.appendChild(ProfileHead(envelope));
    page.appendChild(view === "empty"
      ? EmptyState({ glyph: "◌", title: "No contact details on file", desc: "We don’t have a contact, email, phone or billing address for your account yet." })
      : ProfileFacts(envelope));
  }

  page.appendChild(h("button", { "class": "signout-btn", "data-action": "auth.signOut", "data-visual-id": "sign-out", type: "button", style: "width:100%;margin-top:18px" }, "Sign out"));
  return page;
}

function ProfileHead(envelope) {
  return h("div", { "class": "prop-head", "data-module": "profile-head", "data-visual-id": "profile-head" }, [
    h("div", { style: "flex:1;min-width:0" }, [
      h("h1", { "class": "prop-head__title", style: "overflow-wrap:anywhere" }, envelope.accountName || "Your account"),
      h("div", { "class": "prop-head__addr" }, "The details we have on file for your account."),
    ]),
  ]);
}

function ProfileFacts(envelope) {
  var contact = envelope.contact;
  var billing = envelope.billingAddresses || [];
  return h("div", { "class": "card card--pad prop-facts", "data-module": "profile-facts", "data-visual-id": "profile-facts", "data-state": envelope.state }, [
    Fact("contact", "Primary contact", contact && contact.name ? [contact.name] : [], contact && contact.name ? contact.title : ""),
    Fact("email", "Email", envelope.emails || []),
    Fact("phone", "Phone", envelope.phones || []),
    Fact("billing", billing.length > 1 ? "Billing addresses" : "Billing address", billing),
  ]);
}

function Fact(key, label, values, note) {
  var children = [h("div", { "class": "prop-fact__label" }, label)];
  if (values.length) {
    values.forEach(function (value) { children.push(h("div", { "class": "prop-fact__value", style: "overflow-wrap:anywhere" }, value)); });
    if (note) children.push(h("div", { "class": "prop-fact__note" }, note));
  } else {
    children.push(h("div", { "class": "prop-fact__note" }, "Not on file"));
  }
  return h("div", { "class": "prop-fact", "data-fact": key, "data-state": values.length ? "ready" : "missing" }, children);
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

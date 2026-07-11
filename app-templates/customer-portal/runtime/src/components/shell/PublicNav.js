// customer-portal/runtime/src/components/shell/PublicNav.js — production transfer module.
import { h } from "../../dom.js";
import { state } from "../../state.js";
import { ActionButton } from "../primitives/ActionButton.js";
import { Toggle } from "../primitives/Toggle.js";

export function PublicNav() {
  return h("div", { "class": "top-nav-wrap" },
    h("nav", { "class": "top-nav", "data-module": "public-nav", "data-visual-id": "public-nav" }, [
      h("div", { "class": "top-nav__brand", "data-action": "nav.landing" }, [
        h("div", { "class": "brand-logo" }),
        h("span", { "class": "brand-name", "data-bind": "brand.name" }, "Aircove")
      ]),
      h("div", { "class": "top-nav__actions" }, [
        h("div", { "class": "icon-btn icon-btn--optional", "data-action": "ui.toggleMode", title: "Toggle light/dark" }, state.mode === "Dark" ? "\u2600" : "\u263e"),
        state.route === "landing" || state.route === "seo.landing"
          ? ActionButton({ variant: "btn--primary", label: "Sign in", action: "auth.gotoSignin", visualId: "public-signin" })
          : ActionButton({ variant: "btn--ghost", label: "\u2039 Home", action: "nav.landing", visualId: "public-home" })
      ])
    ])
  );
}

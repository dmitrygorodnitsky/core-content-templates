// customer-portal/runtime/src/components/shell/PublicNav.js — production transfer module.
import { h } from "../../dom.js";
import { configuredExternalUrl } from "../../config.js";
import { isSpa, state } from "../../state.js";
import { signedInWithAccess } from "../../router.js";
import { ActionButton } from "../primitives/ActionButton.js";
import { BrandParts, brandIdentity } from "./BrandLogo.js";
import { Toggle } from "../primitives/Toggle.js";

export function PublicNav() {
  var landingOpen = isSpa() || !!configuredExternalUrl(state.config, "landingUrl");
  var signedIn = signedInWithAccess();
  var brand = brandIdentity();
  return h("div", { "class": "top-nav-wrap" },
    h("nav", { "class": "top-nav", "data-module": "public-nav", "data-visual-id": "public-nav" }, [
      h("div", { "class": "top-nav__brand", "data-action": signedIn ? "nav.go" : landingOpen ? "nav.landing" : undefined, "data-id": signedIn ? state.config.defaultRoute : undefined, "data-brand": brand.logo && brand.logo.wordmark ? "wordmark" : undefined }, BrandParts(brand)),
      h("div", { "class": "top-nav__actions" }, [
        h("div", { "class": "icon-btn icon-btn--optional", "data-action": "ui.toggleMode", title: "Toggle light/dark" }, state.mode === "Dark" ? "\u2600" : "\u263e"),
        state.route === "landing" || state.route === "seo.landing"
          ? ActionButton({ variant: "btn--primary", label: "Sign in", action: "auth.gotoSignin", visualId: "public-signin" })
          : signedIn ? ActionButton({ variant: "btn--ghost", label: "\u2039 Home", action: "nav.go", id: state.config.defaultRoute, visualId: "public-home" })
          : landingOpen ? ActionButton({ variant: "btn--ghost", label: "\u2039 Home", action: "nav.landing", visualId: "public-home" }) : null
      ])
    ])
  );
}

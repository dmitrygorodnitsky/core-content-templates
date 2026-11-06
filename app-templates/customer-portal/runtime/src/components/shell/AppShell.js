// customer-portal/runtime/src/components/shell/AppShell.js — production transfer module.
import { h } from "../../dom.js";
import { activeProfile, customerPortalGateActive, isPublic, isSpa, spaCapability, state } from "../../state.js";
import { TopNav } from "./TopNav.js";
import { PublicNav } from "./PublicNav.js";

export function AppShell(content) {
  var gated = customerPortalGateActive() || (!isPublic() && state.account !== "ready");
  var capability = isSpa() ? spaCapability() : undefined;
  return h("div", {
    "class": "app-shell", "data-module": "app-shell", "data-visual-id": "app-shell",
    "data-account-state": gated || !isPublic() ? state.account : undefined,
    "data-capability": capability,
    "data-booking": capability === "target-appointments" ? state.spaBooking : undefined,
    "data-portal-profile": isSpa() ? activeProfile().id : undefined,
  }, [
    gated ? TopNav(true) : (isPublic() ? PublicNav() : TopNav(false)),
    content,
    isSpa() && state.spaSupport ? h("div", { "class": "spa-support-scrim" },
      h("div", { "class": "spa-support-card", "data-module": "support-unavailable", "data-visual-id": "support-unavailable", "data-state": "unavailable", role: "dialog", "aria-modal": "true", "aria-label": "Support unavailable" }, [
        h("div", { "class": "state-block__glyph" }, "✉"),
        h("div", { "class": "state-block__title" }, "Support isn’t set up yet"),
        h("div", { "class": "state-block__desc" }, "A support contact hasn’t been set up for this portal, so nothing was opened, sent or recorded. For now, please reach the studio the way you usually do."),
        h("button", { "class": "btn btn--primary", "data-action": "support.dismiss", "data-visual-id": "support-dismiss", style: "margin-top:14px" }, "Close")
      ])) : null
  ]);
}

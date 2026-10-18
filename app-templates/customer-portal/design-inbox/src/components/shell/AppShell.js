// customer-portal-design/src/components/shell/AppShell.js — presentation runtime (auto-split from app.js). No business logic.
import { h } from "../../dom.js";
import { activeProfile, isPublic, isSpa, spaCapability, state } from "../../state.js";
import { TopNav } from "./TopNav.js";
import { PublicNav } from "./PublicNav.js";

export function AppShell(content) {
  /* wave 13 — while the customer Account is unresolved/denied, the nav renders
     gated (brand + light/dark only): no private links, counts or entity badges. */
  var gated = !isPublic() && state.account !== "ready";
  /* wave 14 — the capability config hook: production reads data-capability /
     data-booking / data-portal-profile to activate modules unambiguously */
  var cap = isSpa() ? spaCapability() : undefined;
  return h("div", { "class": "app-shell", "data-module": "app-shell", "data-visual-id": "app-shell", "data-account-state": isPublic() ? undefined : state.account,
    "data-capability": cap,
    "data-booking": cap === "target-appointments" ? (state.spaBooking === "open" ? "open" : "closed") : undefined,
    "data-portal-profile": isSpa() ? activeProfile().id : undefined }, [
    isPublic() ? PublicNav() : TopNav(gated),
    content,
    /* wave 14.1 — honest support treatment: Calm Harbor has no approved support
       destination, so every support action opens this notice instead of fixture
       chat/threads. It claims nothing was sent, recorded or opened. */
    isSpa() && state.spaSupport ? h("div", { "class": "spa-support-scrim" },
      h("div", { "class": "spa-support-card", "data-module": "support-unavailable", "data-visual-id": "support-unavailable", "data-state": "unavailable", role: "dialog", "aria-modal": "true", "aria-label": "Support unavailable" }, [
        h("div", { "class": "state-block__glyph" }, "\u2709"),
        h("div", { "class": "state-block__title" }, "Support isn\u2019t set up yet"),
        h("div", { "class": "state-block__desc" }, "A support contact hasn\u2019t been set up for this portal, so nothing was opened, sent or recorded. For now, please reach the studio the way you usually do."),
        h("button", { "class": "btn btn--primary", "data-action": "support.dismiss", style: "margin-top:14px" }, "Close")
      ])) : null
  ]);
}

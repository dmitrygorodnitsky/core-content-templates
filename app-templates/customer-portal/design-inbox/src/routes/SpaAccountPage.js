// customer-portal-design/src/routes/SpaAccountPage.js — Wave 15: Account overview.
// The 4th primary destination. Owns Purchases / My plan / Profile / Support as
// entry cards; each entry is available | unavailable per its OWN contract —
// unavailable is an honest notice, never rendered as empty data. Shows ONE
// customer-safe display name; no Account/User id, role, permission or
// organization selector exists anywhere on this surface.
import { h } from "../dom.js";
import { F } from "../../data/fixtures.js";
import { spaCapability, spaCustomer, state } from "../state.js";
import { PageHeader } from "../components/shell/PageHeader.js";
import { skel } from "../components/primitives/RouteStates.js";
import { spaGate } from "../components/spa/CommerceBits.js";

/* availability is decided from the capability config — the page never guesses */
function entryAvailability(key) {
  var staging = spaCapability() === "current-staging";
  if (key === "support") return "unavailable"; /* wave 14.1 — no approved destination */
  if (staging) return "unavailable";
  if (state.spaAccountPartial && (key === "plan" || key === "profile")) return "unavailable";
  return "available";
}

export function SpaAccount() {
  var page = h("section", { "class": "page", "data-route": "account", "data-state": state.view, "data-visual-id": "spa-account", "data-module": "spa-account", "data-capability": spaCapability(), "data-screen-label": "Account overview" });
  page.appendChild(PageHeader({ title: "Account", sub: h("span", { "data-bind": "session.displayName" }, "Signed in as " + spaCustomer().fullName) }));

  var gate = spaGate({
    states: ["loading", "error", "unauthorized"],
    skeleton: function () {
      var w = h("div", { "class": "account-grid", "data-state": "loading", "aria-busy": "true" });
      for (var i = 0; i < 4; i++) w.appendChild(skel("height:120px;border-radius:20px"));
      return w;
    },
    error: { title: "Couldn\u2019t load your account", desc: "Your account overview didn\u2019t load, so nothing is shown \u2014 we never show stale sections. Nothing was changed; try again.", retryId: "account" },
    scope: "your account", backRoute: "orders.list",
    unavailable: { title: "Account isn\u2019t available yet", desc: "This part of the portal isn\u2019t connected yet. Your visits and catalog pages still work as usual." }
  });
  if (gate) { page.appendChild(gate); return page; }

  var grid = h("div", { "class": "account-grid", "data-module": "account-entry-list", "data-visual-id": "account-entry-list" });
  F.spaCommerce.accountEntries.forEach(function (e) {
    var avail = entryAvailability(e.key);
    var card = h("div", {
      "class": "card card--pad account-entry" + (avail === "unavailable" ? " account-entry--unavailable" : ""),
      "data-module": "account-entry", "data-visual-id": "account-entry-" + e.key, "data-state": avail
    }, [
      h("div", { style: "display:flex;align-items:center;gap:9px" }, [
        h("div", { "class": "card__title", style: "flex:1" }, e.title),
        avail === "unavailable" ? h("span", { "class": "readonly-chip" }, "Not available yet") : null
      ]),
      h("div", { "class": "account-entry__desc" }, avail === "available" ? e.desc : e.unavailableDesc),
      h("div", { "class": "account-entry__foot" },
        avail === "available"
          ? h("span", { "class": "link-action", "data-action": e.action }, "Open " + e.title.toLowerCase() + " \u203a")
          : (e.key === "purchases" && spaCapability() === "current-staging"
              ? h("span", { "class": "link-action", "data-action": "nav.go", "data-id": "orders.list" }, "See your orders \u203a")
              : (e.key === "plan"
                  ? h("span", { "class": "link-action", "data-action": "nav.go", "data-id": "pricing" }, "Membership options \u203a")
                  : null)))
    ]);
    grid.appendChild(card);
  });
  page.appendChild(grid);
  page.appendChild(h("div", { "class": "catalog-note" }, "Sections appear here as they\u2019re connected for your account \u2014 nothing is shown from guesses."));
  return page;
}

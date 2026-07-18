// customer-portal-design/src/routes/SpaPurchasesPage.js — Wave 15: Purchases list
// (under Account). Renders the customer-safe Purchase summary read model:
// user-facing reference, placed date, item summary, kind, customer status
// (BACKEND-OWNED mapping — see the raw staging Orders variant for unmapped data),
// display total VERBATIM and an optional attention message. Filters render ONLY
// for kinds present in the returned data. Cursor loading appends a page below
// the already-rendered rows — it never replaces them.
// The current-staging capability keeps its separate raw Orders variant
// (spa-order-row) — target labels are never applied to unmapped OPEN data.
import { h } from "../dom.js";
import { F } from "../../data/fixtures.js";
import { spaCapability, state } from "../state.js";
import { PageHeader } from "../components/shell/PageHeader.js";
import { EmptyState } from "../components/primitives/EmptyState.js";
import { Tabs } from "../components/primitives/Tabs.js";
import { skeletonRow } from "../components/primitives/LoadingState.js";
import { KindChip, purchaseStatusBadge, spaGate } from "../components/spa/CommerceBits.js";

function purchaseRow(p) {
  return h("article", { "class": "purch-row", "data-module": "purchase-row", "data-visual-id": "purchase-row", "data-purchase-ref": p.ref, "data-action": "purchase.open", "data-id": p.ref, tabindex: "0", role: "link" }, [
    h("div", { "class": "purch-row__body" }, [
      h("div", { "class": "purch-row__top" }, [
        h("span", { "class": "purch-row__ref", "data-bind": "purchase.reference" }, p.reference),
        KindChip(p.kind),
        h("span", { "class": "purch-row__date", "data-bind": "purchase.placedAt" }, p.placedAt)
      ]),
      h("div", { "class": "purch-row__summary", "data-bind": "purchase.itemSummary" }, p.itemSummary),
      p.attention ? h("div", { "class": "purch-row__attention", "data-bind": "purchase.attention", role: "note" }, p.attention) : null
    ]),
    h("div", { "class": "purch-row__side" }, [
      purchaseStatusBadge(p.customerStatus),
      h("div", { "class": "purch-row__total" }, [
        h("b", { "data-bind": "purchase.displayTotal" }, p.displayTotal),
        h("span", { "data-bind": "purchase.currency" }, p.currency)
      ])
    ]),
    h("span", { "class": "purch-row__chev", "aria-hidden": "true" }, "\u203a")
  ]);
}

export function SpaPurchases() {
  var page = h("section", { "class": "page", "data-route": "purchases.list", "data-state": state.view, "data-visual-id": "spa-purchases", "data-module": "spa-purchases", "data-capability": spaCapability(), "data-screen-label": "Purchases" });
  page.appendChild(PageHeader({ title: "Purchases", sub: "Everything you\u2019ve ordered, with its current state \u2014 exactly as our records show it." }));

  /* the mapped purchase list is a TARGET capability; staging keeps its raw
     read-only Orders variant and never borrows these labels */
  if (spaCapability() === "current-staging" && state.view === "ready") {
    page.appendChild(spaGateUnavailable());
    return page;
  }

  var gate = spaGate({
    states: ["loading", "empty", "error", "unauthorized"],
    skeleton: function () {
      var card = h("div", { "class": "card", "data-state": "loading", "aria-busy": "true" });
      for (var i = 0; i < 4; i++) card.appendChild(skeletonRow());
      return card;
    },
    empty: { glyph: "\u25ce", title: "No purchases yet", desc: "Anything you order \u2014 a visit, shop items or a plan \u2014 will appear here with its current state.",
      action: { variant: "btn--ghost", label: "Browse services", action: "nav.go", id: "services", visualId: "purchases-empty-browse" } },
    error: { title: "Couldn\u2019t load your purchases", desc: "Your purchases didn\u2019t load, so nothing is shown \u2014 we never show stale records. Nothing was changed; try again.", retryId: "purchases" },
    scope: "your purchases", backRoute: "account",
    unavailable: { title: "Purchases aren\u2019t available yet", desc: "Purchase history isn\u2019t connected on this portal yet. Nothing is shown in the meantime.", action: { variant: "btn--ghost", label: "Back to account", action: "account.open", visualId: "purchases-unavailable-back" } }
  });
  if (gate) { page.appendChild(gate); return page; }

  var list = F.spaCommerce.purchases.list;
  var loaded = state.spaPurchMore === "loaded" ? list.concat(F.spaCommerce.purchases.nextPage) : list;

  /* filters: ONLY those supported by the returned data */
  var kindsPresent = {};
  loaded.forEach(function (p) { kindsPresent[p.kind] = true; });
  var filters = F.spaCommerce.purchases.filters.filter(function (f) {
    if (f.key === "all") return true;
    return (F.spaCommerce.purchases.kindFilter[f.key] || []).some(function (k) { return kindsPresent[k]; });
  });
  if (filters.length > 1) {
    page.appendChild(h("div", { "class": "spa-tabs" }, Tabs({
      items: filters.map(function (f) { return { key: f.key, label: f.label }; }),
      active: state.spaPurchFilter, action: "purchases.filter"
    })));
  }

  var visible = loaded.filter(function (p) {
    if (state.spaPurchFilter === "all") return true;
    return (F.spaCommerce.purchases.kindFilter[state.spaPurchFilter] || []).indexOf(p.kind) !== -1;
  });

  var card = h("div", { "class": "card", "data-module": "purchase-list", "data-visual-id": "purchase-list" });
  if (visible.length === 0) {
    card.appendChild(EmptyState({ glyph: "\u25ce", title: "Nothing under this filter", desc: "You have purchases, just not of this kind. Switch back to All to see everything." }));
  } else {
    visible.forEach(function (p) { card.appendChild(purchaseRow(p)); });
  }
  /* cursor page: pending rows render BELOW the kept rows */
  if (state.spaPurchMore === "loading") { card.appendChild(skeletonRow()); card.appendChild(skeletonRow()); }
  page.appendChild(card);

  if (state.spaPurchMore === "idle") {
    page.appendChild(h("div", { style: "display:flex;justify-content:center;margin-top:14px" },
      h("button", { "class": "btn btn--ghost", "data-action": "purchases.more", "data-module": "action-button", "data-visual-id": "purchases-load-more" }, "Show earlier purchases")));
  }
  page.appendChild(h("div", { "class": "card__footnote", style: "border-top:0;padding:12px 4px 0" }, "Amounts and statuses come from our records exactly as written \u2014 receipts and payment history aren\u2019t part of this portal yet."));
  return page;
}

function spaGateUnavailable() {
  return h("div", { "class": "state-block", "data-module": "unavailable-state", "data-visual-id": "unavailable-state", "data-state": "unavailable" }, [
    h("div", { "class": "state-block__glyph" }, "\u25cc"),
    h("div", { "class": "state-block__title" }, "Purchases aren\u2019t available on this portal yet"),
    h("div", { "class": "state-block__desc" }, "Purchase history with customer statuses isn\u2019t connected yet. Your raw order records \u2014 exactly as recorded \u2014 are on the Orders page."),
    h("button", { "class": "btn btn--primary", "data-action": "nav.go", "data-id": "orders.list", "data-module": "action-button", "data-visual-id": "purchases-unavailable-orders" }, "See your orders")
  ]);
}

// customer-portal/runtime/src/routes/PricingPage.js — production transfer module.
import { F } from "../../data/fixtures.js";
import { h } from "../dom.js";
import { state } from "../state.js";
import { go } from "../actions.js";
import { PricingCard } from "../components/commerce/PricingCard.js";
import { ProductCard } from "../components/commerce/ProductCard.js";

export function Pricing() {
  var v = F.themes[state.theme];
  var page = h("section", { "class": "page", "data-route": "pricing", "data-visual-id": "pricing" });
  page.appendChild(h("div", { "class": "pricing-head" }, [
    h("span", { "class": "eyebrow" }, "Transparent, no surprises"),
    h("h1", { "data-bind": "plan.headline" }, v.plan.headline),
    h("p", null, "Pay per visit, or save with a membership. Cancel anytime.")
  ]));
  page.appendChild(h("div", { "class": "pricing-grid" }, [
    PricingCard({ name: "Pay as you go", price: "$0", tag: "Standard rates per visit", current: true,
      features: ["Book any service on demand", "Live technician tracking", "In-app payment & invoices"] }),
    PricingCard({ name: v.plan.name, price: "$9", tag: v.plan.tag, featured: true, features: v.plan.features }),
    PricingCard({ name: v.plan.plusName, price: "$19", tag: "For multiple properties", features: v.plan.plusFeatures })
  ]));
  var rates = h("div", { "class": "rates-card", "data-module": "rates-list", "data-visual-id": "per-visit-rates" }, [
    h("div", { "class": "panel__title", style: "font-size:16px;padding:14px 0 6px" }, "Per-visit rates")
  ]);
  v.svc.forEach(function (s, i) {
    var pal = F.PAL[i % 4];
    rates.appendChild(h("div", { "class": "rate-row", "data-module": "rate-row" }, [
      h("div", { "class": "rate-row__icon", style: "background:" + pal[1] }, h("i", { style: "background:" + pal[0] })),
      h("div", { style: "flex:1" }, [
        h("div", { style: "font-weight:600;font-size:14px", "data-bind": "service.name" }, s.name),
        h("div", { style: "font-size:12px;color:var(--ink-2)" }, s.tagline)
      ]),
      h("div", { style: "font-weight:700;font-size:15px", "data-bind": "service.price" }, s.price === "Quote" ? "Quote" : s.price)
    ]));
  });
  page.appendChild(rates);
  return page;
}

/* ProductCard */

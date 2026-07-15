// customer-portal/runtime/src/routes/PricingPage.js — production transfer module.
import { F } from "../../data/fixtures.js";
import { h } from "../dom.js";
import { currentTheme, state } from "../state.js";
import { PricingCard } from "../components/commerce/PricingCard.js";

export function Pricing() {
  var v = currentTheme();
  var pricing = state.moduleData.pricing || {};
  var livePlans = pricing.source === "core-pim" ? pricing.plans : null;
  var page = h("section", { "class": "page", "data-route": "pricing", "data-visual-id": "pricing" });
  page.appendChild(h("div", { "class": "pricing-head" }, [
    h("span", { "class": "eyebrow" }, "Transparent, no surprises"),
    h("h1", { "data-bind": livePlans ? "pim.plan.name" : "plan.headline" }, livePlans ? "Plans from Core PIM" : v.plan.headline),
    h("p", null, livePlans ? "Live catalog data is loaded from Core PIM." : "Pay per visit, or save with a membership. Cancel anytime.")
  ]));
  var cards = livePlans
    ? livePlans.map(function (plan, index) {
      return PricingCard({
        name: plan.name,
        price: plan.price,
        suffix: plan.interval ? "/" + plan.interval.replace(/^1\s+/i, "").toLowerCase() : "",
        tag: plan.description || plan.cta,
        featured: index === 1,
        features: plan.description ? [plan.description] : [plan.code],
        action: plan.allowedActions && plan.allowedActions.includes("support.open") ? "support.open" : "cart.addItem",
        actionId: plan.name,
        ctaLabel: plan.cta || "Choose plan"
      });
    })
    : [
      PricingCard({ name: "Pay as you go", price: "Per ritual", tag: "Current total is shown before confirmation", current: true,
        features: ["Choose an individual ritual", "Keep appointments in one portal", "Review aftercare after your visit"] }),
      PricingCard({ name: v.plan.name, price: v.plan.monthlyPrice || "$9", tag: v.plan.tag, featured: true, features: v.plan.features }),
      PricingCard({ name: v.plan.plusName, price: v.plan.plusMonthlyPrice || "$19", tag: "For a deeper ritual rhythm", features: v.plan.plusFeatures })
    ];
  page.appendChild(h("div", { "class": "pricing-grid", "data-bind": livePlans ? "pim.plans" : "plan.cards" }, cards));
  var rates = h("div", { "class": "rates-card", "data-module": "rates-list", "data-visual-id": "per-visit-rates" }, [
    h("div", { "class": "panel__title", style: "font-size:16px;padding:14px 0 6px" }, livePlans ? "Core PIM catalog" : "Per-visit rates")
  ]);
  (livePlans || v.svc).forEach(function (s, i) {
    var pal = F.PAL[i % 4];
    rates.appendChild(h("div", { "class": "rate-row", "data-module": "rate-row" }, [
      h("div", { "class": "rate-row__icon", style: "background:" + pal[1] }, h("i", { style: "background:" + pal[0] })),
      h("div", { style: "flex:1" }, [
        h("div", { style: "font-weight:600;font-size:14px", "data-bind": "service.name" }, s.name),
        h("div", { style: "font-size:12px;color:var(--ink-2)" }, s.tagline || s.description || s.code)
      ]),
      h("div", { style: "font-weight:700;font-size:15px", "data-bind": "service.price" }, s.price === "Quote" ? "Quote" : s.price)
    ]));
  });
  page.appendChild(rates);
  return page;
}

/* ProductCard */

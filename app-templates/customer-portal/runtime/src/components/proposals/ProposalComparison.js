// customer-portal/runtime/src/components/proposals/ProposalComparison.js — production transfer module.
import { F } from "../../../data/fixtures.js";
import { clear, h } from "../../dom.js";
import { state } from "../../state.js";
import { Pricing } from "../../routes/PricingPage.js";
import { noteBox } from "../../routes/ProposalDetailPage.js";

export function ProposalComparison(site, c) {
  var v = F.themes[state.theme];
  var seasonStr = "$" + (Math.round(c.unlim / 25) * 25).toLocaleString();
  var monthlyStr = "$" + c.monthly.toLocaleString();
  var lockStr = "$" + c.seasonLock.toLocaleString();
  var table = h("div", { "class": "pricing-table", "data-module": "proposal-comparison", "data-visual-id": "proposal-comparison" });
  table.appendChild(h("div", { "class": "pt-title" }, [
    h("span", { style: "font-weight:800;font-size:16px;letter-spacing:-.01em" }, "Pricing from measured area"),
    h("span", { style: "font-size:12px;color:var(--ink-3)" }, "rate \u00d7 Beam AI surface \u00b7 per visit")
  ]));
  table.appendChild(h("div", { "class": "pt-grid pt-head" }, [
    h("div", null, "Surface"), h("div", { style: "text-align:right" }, "Area"),
    h("div", { style: "text-align:right", "data-bind": "prop.colA" }, v.prop.colA), h("div", { style: "text-align:right", "data-bind": "prop.colB" }, v.prop.colB)
  ]));
  c.rows.forEach(function (su) {
    table.appendChild(h("div", { "class": "pt-grid pt-row" }, [
      h("div", { style: "display:flex;align-items:center;gap:9px" }, [h("span", { "class": "surface-swatch", style: "background:" + su.color }), su.name]),
      h("div", { style: "text-align:right;color:var(--ink-2)" }, su.area),
      h("div", { style: "text-align:right;font-weight:600" }, [su.clear, " ", h("span", { style: "color:var(--ink-3);font-weight:500;font-size:11px" }, su.clearRate)]),
      h("div", { style: "text-align:right;font-weight:600" }, [su.deice, " ", h("span", { style: "color:var(--ink-3);font-weight:500;font-size:11px" }, su.deiceRate)])
    ]));
  });
  table.appendChild(h("div", { "class": "pt-grid pt-row", style: "color:var(--ink-2)" }, [
    h("div", null, "Site mobilization"), h("div", { style: "text-align:right" }, "\u2014"),
    h("div", { style: "text-align:right;font-weight:600;color:var(--ink)" }, "$" + F.MOB_CLEAR),
    h("div", { style: "text-align:right;font-weight:600;color:var(--ink)" }, "$" + F.MOB_DEICE)
  ]));
  table.appendChild(h("div", { "class": "pt-grid pt-total" }, [
    h("div", { style: "font-weight:800;font-size:14px" }, "Per-visit total"), h("div"),
    h("div", { style: "text-align:right;font-weight:800;font-size:16px" }, c.clearStr),
    h("div", { style: "text-align:right;font-weight:800;font-size:16px" }, c.deiceStr)
  ]));
  table.appendChild(h("div", { "class": "plan-notes" }, [
    noteBox("Flex", "Billed at the per-visit totals above."),
    noteBox("Seasonal Unlimited", ["Expected season \u2248 ", h("b", { style: "color:var(--ink)" }, seasonStr), " \u00f7 5 mo = ", h("b", { style: "color:var(--accent)" }, monthlyStr + "/mo"), ", uncapped."]),
    noteBox("Season-Lock", [seasonStr + " prepaid ", h("b", { style: "color:var(--ink)" }, "\u221210%"), " = ", h("b", { style: "color:var(--accent)" }, lockStr), "."])
  ]));
  return { el: table, seasonStr: seasonStr, monthlyStr: monthlyStr, lockStr: lockStr };
}

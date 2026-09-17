// customer-portal/runtime/src/routes/ProposalDetailPage.js — production transfer module.
import { h } from "../dom.js";
import { computeSite, currentSite, currentTheme, proposalPlanName, proposalPlanPricingModel, proposalStatusMeta, state } from "../state.js";
import { go, selectPlan } from "../actions.js";
import { StatusBadge } from "../components/primitives/StatusBadge.js";
import { ActionButton } from "../components/primitives/ActionButton.js";
import { ProposalComparison } from "../components/proposals/ProposalComparison.js";
import { PRICING_MODELS } from "../normalizers/contracts.js";
import { Profile } from "./ProfilePage.js";
import { Activity } from "./ActivityPage.js";
import { Calendar } from "./CalendarPage.js";
import { Support } from "./SupportPage.js";

export function noteBox(title, body) {
  return h("div", { "class": "note-box" }, [
    h("div", { style: "font-weight:700;font-size:12.5px" }, title),
    h("div", { style: "font-size:12px;line-height:1.45;color:var(--ink-2);margin-top:3px" }, body)
  ]);
}

export function beamMap() {
  var rects = [
    "left:30%;top:34%;width:42%;height:34%;background:rgba(60,70,90,.45);border-radius:4px",
    "left:6%;top:20%;width:18%;height:62%;background:rgba(52,199,89,.45);border:1.5px solid #34c759;border-radius:3px",
    "left:30%;top:74%;width:42%;height:13%;background:rgba(255,214,10,.5);border:1.5px solid #ffd60a;border-radius:3px",
    "left:74%;top:22%;width:18%;height:40%;background:rgba(255,107,74,.42);border:1.5px solid #ff6b4a;border-radius:3px",
    "left:30%;top:24%;width:42%;height:7%;background:rgba(58,144,255,.45);border:1.5px solid #2f7be0;border-radius:3px",
    "left:6%;top:86%;width:86%;height:7%;background:rgba(199,125,255,.4);border:1.5px solid #c77dff;border-radius:3px"
  ];
  var map = h("div", { "class": "beam-map" }, [
    h("span", { "class": "beam-map__label", style: "top:13px;left:15px" }, "Beam AI · aerial property report")
  ]);
  rects.forEach(function (s) { map.appendChild(h("div", { style: "position:absolute;" + s })); });
  map.appendChild(h("span", { "class": "beam-map__label", style: "bottom:11px;left:15px" }, "licensed via ibeam.ai — drops in here"));
  return map;
}

export function ProposalDetail() {
  var v = currentTheme();
  var p = currentSite();
  var quotes = p.quotes || null;
  var c = computeSite(p);
  var st = proposalStatusMeta()[p.status];
  var page = h("section", { "class": "page page--narrow", "data-route": "proposal.detail", "data-visual-id": "proposal-detail", "data-state": p.status });

  page.appendChild(h("div", { "class": "detail-back", "data-action": "proposal.review", "data-visual-id": "proposal-back" }, quotes ? "‹ Back to your quotes" : "‹ Back to proposal"));
  page.appendChild(h("div", { "class": "proposal-detail-head" }, [
    h("div", { style: "flex:1" }, [
      h("div", { "class": "proposal-detail-head__title", "data-bind": "site.addr" }, p.addr),
      h("div", { "class": "proposal-detail-head__meta" }, p.city + " " + p.postal + " · lot " + p.lot + " sq ft")
    ]),
    StatusBadge({ variant: st.badge, label: st.label, bind: "site.statusLabel" })
  ]));

  /* Beam AI report */
  var side = h("div", { "class": "beam-side" }, [
    h("div", { style: "display:flex;justify-content:space-between;align-items:baseline;margin-bottom:11px" }, [
      h("span", { style: "font-weight:700;font-size:14px" }, "Measured surfaces"),
      h("span", { style: "font-size:11.5px;color:var(--ink-3)" }, "serviceable")
    ])
  ]);
  c.rows.forEach(function (su) {
    side.appendChild(h("div", { "class": "surface-row" }, [
      h("span", { "class": "surface-swatch", style: "background:" + su.color }),
      h("span", { style: "flex:1;font-weight:590;font-size:13px" }, su.name),
      h("span", { style: "font-weight:700;font-size:13px;white-space:nowrap" }, [su.area, " ", h("span", { style: "color:var(--ink-3);font-weight:500" }, "sq ft")])
    ]));
  });
  side.appendChild(h("div", { "class": "beam-total" }, [
    h("span", { style: "font-weight:700;font-size:13.5px" }, "Total serviceable"),
    h("span", { style: "font-weight:800;font-size:16px;color:var(--accent)" }, c.total.toLocaleString() + " sq ft")
  ]));
  page.appendChild(h("div", { "class": "beam-report", "data-module": "beam-report", "data-visual-id": "beam-report" },
    h("div", { "class": "beam-report__grid" }, [beamMap(), side])));

  /* pricing comparison table */
  var comp = ProposalComparison(p, c);
  page.appendChild(comp.el);

  /* plan selector */
  page.appendChild(h("div", { style: "margin:0 4px 12px" }, [
    h("div", { style: "font-weight:800;font-size:19px;letter-spacing:-.01em" }, v.prop.svc + " — choose your plan"),
    h("div", { style: "font-size:13px;color:var(--ink-2);margin-top:3px" }, "Approving one option declines the other two. Request a revision and we’ll re-quote all three.")
  ]));

  var plans = [
    { id: "897", name: "Flex Service Plan", tag: quotes ? pricingModelTag("897") : "Pay-as-you-go · Order #34897", isFlex: true, desc: "Best for smaller or low-exposure sites. Billed per service at the rates above." },
    { id: "898", name: "Seasonal Unlimited Coverage", tag: quotes ? pricingModelTag("898") : "Order #34898", badge: "MOST SELECTED", priceMain: comp.monthlyStr, priceSub: "/ mo × 5 · " + v.prop.months, desc: "Predictable budget, full-season protection. " + v.prop.unlimDesc + " GPS logs + photos after every visit." },
    { id: "899", name: "Season-Lock Prepaid", tag: quotes ? pricingModelTag("899") : "Order #34899", badge: "BEST VALUE", badgeGreen: true, priceMain: comp.lockStr, priceSub: "one-time · season", desc: "Maximum cost certainty for the whole season. 10% saving vs. monthly. " + v.prop.unlimDesc }
  ];
  plans.forEach(function (pl) {
    var sel = pl.id === p.selected;
    var opt = h("div", { "class": "plan-option" + (sel ? " plan-option--sel" : ""), "data-module": "plan-option", "data-visual-id": "plan-option", "data-action": "proposal.selectPlan", "data-id": pl.id, "data-state": sel ? "selected" : undefined });
    if (pl.badge) opt.appendChild(h("span", { "class": "plan-badge2" + (pl.badgeGreen ? " plan-badge2--green" : "") }, pl.badge));
    opt.appendChild(h("div", { "class": "plan-radio" + (sel ? " plan-radio--sel" : "") }, sel ? h("i") : null));
    opt.appendChild(h("div", { "class": "plan-option__body" }, [
      h("div", { "class": "plan-option__head" }, [
        h("span", { style: "font-weight:700;font-size:15.5px" }, pl.name),
        h("span", { style: "font-size:12px;color:var(--ink-3)" }, pl.tag)
      ]),
      h("div", { style: "font-size:13px;line-height:1.5;color:var(--ink-2);margin-top:4px" }, pl.desc)
    ]));
    var price = h("div", { "class": "plan-option__price" });
    if (pl.isFlex) {
      price.appendChild(h("div", { style: "font-weight:800;font-size:17px" }, [c.clearStr, h("span", { style: "font-weight:500;font-size:12.5px;color:var(--ink-3)" }, " " + v.prop.unitA)]));
      price.appendChild(h("div", { style: "font-weight:800;font-size:17px" }, [c.deiceStr, h("span", { style: "font-weight:500;font-size:12.5px;color:var(--ink-3)" }, " " + v.prop.unitB)]));
    } else {
      price.appendChild(h("div", { style: "font-weight:800;font-size:19px" }, pl.priceMain));
      price.appendChild(h("div", { style: "font-size:12px;color:var(--ink-2)" }, pl.priceSub));
    }
    opt.appendChild(price);
    page.appendChild(opt);
  });

  /* decided note */
  var decided = p.status === "approved" || p.status === "revision" || p.status === "declined";
  if (decided) {
    page.appendChild(h("div", { "class": "proposal-decided" }, [
      h("div", { "class": "proposal-decided__icon" }, "i"),
      h("div", { style: "font-size:13px;line-height:1.45;color:var(--ink-2)" }, quotes ? quoteDecisionNote(p) : proposalDecisionNote(p))
    ]));
  }

  /* actions */
  if (quotes && decided) return page;
  var selId = p.selected || "898";
  page.appendChild(h("div", { "class": "proposal-actions" }, [
    ActionButton({ variant: "btn--primary", label: "Approve " + proposalPlanName(selId), action: "proposal.approve", block: true, lg: true, visualId: "proposal-approve" }),
    ActionButton({ variant: "btn--ghost", label: "Request revision", action: "proposal.requestRevision", lg: true, visualId: "proposal-revise" }),
    ActionButton({ variant: "btn--danger", label: "Decline", action: "proposal.decline", lg: true, visualId: "proposal-decline" })
  ]));
  return page;
}

function pricingModelTag(planId) {
  var code = proposalPlanPricingModel(planId);
  return code && Object.prototype.hasOwnProperty.call(PRICING_MODELS, code) ? PRICING_MODELS[code] : "";
}

function quoteDecisionNote(p) {
  if (p.status === "approved") return "You approved " + proposalPlanName(p.selected) + ". The other options for this property are declined.";
  if (p.status === "revision") return "You asked for changes to these quotes. Our team is reviewing your request.";
  return "You declined the quotes for this property.";
}

function proposalDecisionNote(p) {
  var note = p.status === "approved" ? "You approved " + proposalPlanName(p.selected) + "."
    : p.status === "revision" ? "Revision requested — our team will re-quote all three options."
    : "You declined this proposal.";
  return note + " You can still change your decision below.";
}

/* =========================================================
   WAVE 5 — Profile / Activity / Calendar / Support
   ========================================================= */

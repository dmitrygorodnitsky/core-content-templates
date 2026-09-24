// customer-portal-design/src/routes/ProposalDetailPage.js — presentation runtime (auto-split from app.js). No business logic.
import { F } from "../../data/fixtures.js";
import { h } from "../dom.js";
import { cmdPhase, computeSite, currentSite, state } from "../state.js";
import { go, selectPlan } from "../actions.js";
import { StatusBadge } from "../components/primitives/StatusBadge.js";
import { ActionButton } from "../components/primitives/ActionButton.js";
import { detailSkeleton } from "../components/primitives/LoadingState.js";
import { ConflictBanner, InlineFailure, NotFoundState, routeStateBody } from "../components/primitives/RouteStates.js";
import { ProposalComparison } from "../components/proposals/ProposalComparison.js";
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
    h("span", { "class": "beam-map__label", style: "top:13px;left:15px" }, "Beam AI \u00b7 aerial property report")
  ]);
  rects.forEach(function (s) { map.appendChild(h("div", { style: "position:absolute;" + s })); });
  map.appendChild(h("span", { "class": "beam-map__label", style: "bottom:11px;left:15px" }, "licensed via ibeam.ai \u2014 drops in here"));
  return map;
}

export function ProposalDetail() {
  var v = F.themes[state.theme];
  var p = currentSite();
  var c = computeSite(p);
  var st = F.pstatus[p.status];

  /* wave 13 — versioned proposal lifecycle. While unresolved / failed /
     unauthorized / not-found, NO entity field (address, area, price) renders.
     not-found is non-enumerating: identical whether the id never existed,
     was withdrawn, or belongs to another customer. */
  var gate = routeStateBody({
    states: ["loading", "error", "unauthorized"],
    skeleton: detailSkeleton,
    error: { title: "Couldn\u2019t load this proposal", desc: "The proposal didn\u2019t load, so nothing is shown. Nothing was decided \u2014 try again.", retryId: "proposal.detail" },
    scope: "this proposal", backRoute: "proposals.list"
  });
  if (state.view === "not-found") gate = NotFoundState({ noun: "proposal", backLabel: "proposals", backRoute: "proposals.list" });
  if (gate) {
    var gpage = h("section", { "class": "page page--narrow", "data-route": "proposal.detail", "data-state": state.view, "data-visual-id": "proposal-detail" });
    gpage.appendChild(h("div", { "class": "detail-back", "data-action": "proposal.review", "data-visual-id": "proposal-back" }, "\u2039 Back to proposal"));
    gpage.appendChild(gate);
    return gpage;
  }

  /* decision command state for THIS site only — other sites stay actionable */
  var dKey = "proposal.decide:" + p.id;
  var dPhase = cmdPhase(dKey);
  var hasConflict = state.view === "conflict" || dPhase === "conflict";
  var lifecycle = hasConflict ? "conflict" : dPhase === "pending" ? "pending-action" : p.status;
  var page = h("section", { "class": "page page--narrow", "data-route": "proposal.detail", "data-visual-id": "proposal-detail", "data-state": lifecycle, "data-entity-id": p.id });

  page.appendChild(h("div", { "class": "detail-back", "data-action": "proposal.review", "data-visual-id": "proposal-back" }, "\u2039 Back to proposal"));
  if (hasConflict) page.appendChild(ConflictBanner({ noun: "proposal", desc: "A newer version was issued while you were viewing this one. Load the latest and review it \u2014 your decision was NOT submitted.", retryId: dKey }));
  page.appendChild(h("div", { "class": "proposal-detail-head" }, [
    h("div", { style: "flex:1" }, [
      h("div", { "class": "proposal-detail-head__title", "data-bind": "site.addr" }, p.addr),
      h("div", { "class": "proposal-detail-head__meta" }, p.city + " " + p.postal + " \u00b7 lot " + p.lot + " sq ft")
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
    h("div", { style: "font-weight:800;font-size:19px;letter-spacing:-.01em" }, v.prop.svc + " \u2014 choose your plan"),
    h("div", { style: "font-size:13px;color:var(--ink-2);margin-top:3px" }, "Approving one option declines the other two. Request a revision and we\u2019ll re-quote all three.")
  ]));

  var plans = [
    { id: "897", name: "Flex Service Plan", tag: "Pay-as-you-go \u00b7 Order #34897", isFlex: true, desc: "Best for smaller or low-exposure sites. Billed per service at the rates above." },
    { id: "898", name: "Seasonal Unlimited Coverage", tag: "Order #34898", badge: "MOST SELECTED", priceMain: comp.monthlyStr, priceSub: "/ mo \u00d7 5 \u00b7 " + v.prop.months, desc: "Predictable budget, full-season protection. " + v.prop.unlimDesc + " GPS logs + photos after every visit." },
    { id: "899", name: "Season-Lock Prepaid", tag: "Order #34899", badge: "BEST VALUE", badgeGreen: true, priceMain: comp.lockStr, priceSub: "one-time \u00b7 season", desc: "Maximum cost certainty for the whole season. 10% saving vs. monthly. " + v.prop.unlimDesc }
  ];
  plans.forEach(function (pl) {
    var sel = pl.id === p.selected;
    var opt = h("div", { "class": "plan-option" + (sel ? " plan-option--sel" : ""), "data-module": "plan-option", "data-visual-id": "plan-option", "data-action": "proposal.selectPlan", "data-id": pl.id, "data-state": sel ? "selected" : undefined });
    if (pl.badge) opt.appendChild(h("span", { "class": "plan-badge2" + (pl.badgeGreen ? " plan-badge2--green" : "") }, pl.badge));
    opt.appendChild(h("div", { "class": "plan-radio" + (sel ? " plan-radio--sel" : "") }, sel ? h("i") : null));
    opt.appendChild(h("div", { "class": "plan-option__body" }, [
      h("div", { style: "display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding-right:104px" }, [
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
    var note = p.status === "approved" ? "You approved " + F.planName(p.selected) + " \u2014 a live order was created."
      : p.status === "revision" ? "Revision requested \u2014 our team will re-quote all three options."
      : "You declined this proposal.";
    page.appendChild(h("div", { "class": "proposal-decided" }, [
      h("div", { "class": "proposal-decided__icon" }, "i"),
      h("div", { style: "font-size:13px;line-height:1.45;color:var(--ink-2)" }, note + " You can still change your decision below.")
    ]));
  }

  /* actions — entity-scoped command lifecycle: the clicked decision shows
     pending, all three are locked against duplicate submission, failure keeps
     the proposal unchanged with the buttons as the explicit retry, and a
     conflict blocks deciding until the latest version is loaded. */
  var selId = p.selected || "898";
  var busy = dPhase === "pending";
  if (dPhase === "failed") {
    page.appendChild(h("div", { style: "margin:0 4px 12px" }, InlineFailure({ msg: "Your decision wasn\u2019t submitted \u2014 this proposal is unchanged. Try again below." })));
  }
  page.appendChild(h("div", { "class": "proposal-actions", "data-state": busy ? "pending" : hasConflict ? "conflict" : dPhase === "failed" ? "failed" : "ready" }, [
    ActionButton({ variant: "btn--primary", label: "Approve " + F.planName(selId), action: "proposal.approve", block: true, lg: true, visualId: "proposal-approve",
      pending: busy && state.lastDecide === "approved", pendingLabel: "Submitting\u2026", disabled: busy || hasConflict }),
    ActionButton({ variant: "btn--ghost", label: "Request revision", action: "proposal.requestRevision", lg: true, visualId: "proposal-revise",
      pending: busy && state.lastDecide === "revision", pendingLabel: "Submitting\u2026", disabled: busy || hasConflict }),
    ActionButton({ variant: "btn--danger", label: "Decline", action: "proposal.decline", lg: true, visualId: "proposal-decline",
      pending: busy && state.lastDecide === "declined", pendingLabel: "Submitting\u2026", disabled: busy || hasConflict })
  ]));
  return page;
}

/* =========================================================
   WAVE 5 — Profile / Activity / Calendar / Support
   ========================================================= */

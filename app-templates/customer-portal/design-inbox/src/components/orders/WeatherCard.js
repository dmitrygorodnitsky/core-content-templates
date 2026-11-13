// customer-portal-design/src/components/orders/WeatherCard.js — presentation runtime (auto-split from app.js). No business logic.
import { F } from "../../../data/fixtures.js";
import { h } from "../../dom.js";
import { state } from "../../state.js";
import { StatusBadge } from "../primitives/StatusBadge.js";
import { ActionButton } from "../primitives/ActionButton.js";
import { TrackingCard } from "./TrackingCard.js";
import { kv } from "../../routes/OrderDetailPage.js";

export function WeatherBanner(order) {
  var v = F.themes[state.theme];
  var loc = (F.addresses.find(function (a) { return a.id === order.locationId; }) || {}).label || "";
  return h("div", { "class": "alert-banner alert-banner--info", "data-module": "alert-banner", "data-visual-id": "weather-banner", "data-state": "pending-action" }, [
    h("div", { "class": "alert-banner__icon wt-pulse", style: "background:rgba(14,143,196,.16)" }, v.wt.icon),
    h("div", { "class": "alert-banner__body", "data-action": "order.open", "data-id": order.id, style: "cursor:pointer" }, [
      h("div", { "class": "alert-banner__title" }, [
        h("span", null, "Weather Trigger \u2014 confirm your visit"),
        StatusBadge({ variant: "status-badge--warn", label: "Respond by " + order.wt.deadline })
      ]),
      h("div", { "class": "alert-banner__desc" }, order.name + " at " + loc + " \u00b7 if we don\u2019t hear back, the visit proceeds automatically per your contract")
    ]),
    ActionButton({ variant: "btn--info", label: "Confirm", action: "weather.confirm", id: order.id, visualId: "weather-confirm" }),
    ActionButton({ variant: "btn--danger", label: "Decline", action: "weather.decline", id: order.id, visualId: "weather-decline" })
  ]);
}

/* TrackingCard */

export function WeatherDetail(o) {
  var wt = o.wt, els = [];
  els.push(h("div", { "class": "weather-card__head" }, [
    h("div", { "class": "weather-card__icon" + (wt.status === "pending" ? " wt-pulse" : "") }, F.themes[state.theme].wt.icon),
    h("div", { "class": "panel__title", style: "flex:1" }, "Weather Trigger"),
    StatusBadge({
      variant: wt.status === "pending" ? "status-badge--warn" : wt.status === "declined" ? "status-badge--danger" : "status-badge--ok",
      label: wt.status === "pending" ? "Awaiting you" : wt.status === "declined" ? "Declined" : wt.status === "confirmed" ? "Confirmed" : "Auto-confirmed"
    })
  ]));
  els.push(h("div", { style: "font-size:13px;line-height:1.5;color:var(--ink-2);margin-bottom:14px" }, wt.trigger + " \u00b7 detected " + wt.detected));

  if (wt.status === "pending") {
    els.push(h("div", { "class": "weather-pending", "data-state": "pending-action" }, [
      h("div", { style: "font-weight:600;font-size:13.5px;color:var(--warn)" }, "Please confirm by " + wt.deadline),
      h("div", { style: "font-size:12.5px;line-height:1.5;color:var(--ink-2);margin-top:3px" }, wt.auto)
    ]));
    els.push(h("div", { style: "display:flex;gap:10px" }, [
      ActionButton({ variant: "btn--info", label: "Confirm visit", action: "weather.confirm", id: o.id, block: true, visualId: "wt-confirm" }),
      ActionButton({ variant: "btn--danger", label: "Decline", action: "weather.decline", id: o.id, visualId: "wt-decline" })
    ]));
  } else if (wt.status === "auto") {
    els.push(h("div", { style: "display:flex;flex-direction:column;gap:7px;margin-bottom:6px" }, [
      kv("Dispatched", "Jan 5 \u00b7 7:02 AM"), kv("Arrived", "Jan 5 \u00b7 7:38 AM"), kv("Cleared", "Jan 5 \u00b7 8:51 AM")
    ]));
    els.push(h("div", { style: "font-size:12.5px;color:var(--ok);font-weight:600" }, "\u2713 " + wt.sla));
  } else if (wt.status === "confirmed") {
    els.push(h("div", { style: "font-size:13px;color:var(--ok);font-weight:600" }, "\u2713 You confirmed this visit \u2014 the crew will proceed as scheduled."));
  } else if (wt.status === "declined") {
    els.push(h("div", { style: "font-size:13px;color:var(--danger);font-weight:600" }, "\u2715 You declined \u2014 no service will occur for this trigger."));
  }

  /* locked compliance report (premium) */
  els.push(h("div", { "class": "locked-report", "data-module": "locked-report", "data-visual-id": "compliance-report" }, [
    h("div", { "class": "locked-report__blur" }, [
      kv("GPS arrival ping", "43.21, -79.88"), kv("Surface temp at arrival", "\u22122.4\u00b0C"), kv("Snowfall depth logged", "3.2 cm")
    ]),
    h("div", { "class": "locked-report__lock" }, [
      h("div", { style: "font-size:20px" }, "\ud83d\udd12"),
      h("div", { style: "font-weight:700;font-size:13.5px" }, "Detailed Compliance Report"),
      h("div", { style: "font-size:12px;line-height:1.5;color:var(--ink-2);max-width:240px" }, "GPS arrival logs, time-stamped readings & full audit trail for this trigger."),
      h("div", { "class": "tab tab--active", style: "margin-top:4px", "data-action": "compliance.unlock", "data-visual-id": "unlock-compliance" }, "Unlock \u00b7 $12/mo")
    ])
  ]));
  return h("div", { "class": "panel", "data-module": "weather-card", "data-visual-id": "weather-card" }, els);
}

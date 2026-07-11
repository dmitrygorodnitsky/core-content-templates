// customer-portal/runtime/src/components/care/shared.js — Wave 7 shared pieces. Presentation runtime, no business logic.
import { h } from "../../dom.js";
import { markCareControlUnavailable } from "../../activation-policy.js";

/* status chip for care modules (checks, zones, stations, SLA) */
export function careChip(kind, label) {
  var map = { ok: "status-badge--ok", warn: "status-badge--warn", issue: "status-badge--danger", info: "status-badge--info", muted: "status-badge--scheduled" };
  return h("span", { "class": "status-badge " + (map[kind] || map.muted), "data-module": "status-badge", "data-state": kind }, label);
}

/* downloadable document row (reports, warranties, compliance packs)
   contract: data-id = document.id (stable), never the display name */
export function DocRow(d) {
  return h("div", { "class": "log-row", "data-module": "document-row", "data-visual-id": "document-row", "data-document-id": d.id }, [
    h("div", { style: "flex:1;min-width:0" }, [
      h("div", { style: "font-weight:600;font-size:13.5px", "data-bind": "doc.name" }, d.name),
      h("div", { style: "font-size:12px;color:var(--ink-3);margin-top:1px", "data-bind": "doc.meta" }, d.meta)
    ]),
    markCareControlUnavailable(h("div", {
      "class": "link-action", "data-action": "care.download", "data-id": d.id,
      role: "link", tabindex: "-1"
    }, "Download"), "Download is unavailable: no approved document destination")
  ]);
}

/* key-value row with card padding */
export function kvRow(label, val) {
  return h("div", { "class": "kv-row", style: "padding:5px 0" }, [h("span", null, label), h("b", null, val)]);
}

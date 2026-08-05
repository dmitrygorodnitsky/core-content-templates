// customer-portal/runtime/src/components/primitives/LoadingState.js — production transfer module.
import { h } from "../../dom.js";
import { ServiceCatalogCard } from "../commerce/ServiceCard.js";
import { AppShell } from "../shell/AppShell.js";

export function skeletonRow() {
  return h("div", { style: "display:flex;align-items:center;gap:13px;padding:14px 13px;border-top:1px solid var(--glass-border)" }, [
    h("div", { "class": "skeleton", style: "width:38px;height:38px;border-radius:11px" }),
    h("div", { style: "flex:1" }, [
      h("div", { "class": "skeleton", style: "width:46%;height:12px;margin-bottom:7px" }),
      h("div", { "class": "skeleton", style: "width:28%;height:10px" })
    ]),
    h("div", { "class": "skeleton", style: "width:74px;height:22px;border-radius:999px" })
  ]);
}

/* =========================================================
   TOP NAV  (AppShell chrome)
   ========================================================= */

export function detailSkeleton() {
  var col = h("div", { "class": "detail-col" });
  for (var i = 0; i < 3; i++) col.appendChild(h("div", { "class": "skeleton", style: "height:" + (i === 0 ? 180 : 120) + "px;border-radius:20px" }));
  return h("div", { "class": "detail-grid" }, [col, h("div", { "class": "detail-col" }, [h("div", { "class": "skeleton", style: "height:160px;border-radius:20px" })])]);
}

/* =========================================================
   WAVE 3 — Commerce
   ========================================================= */

/* ServiceCatalogCard (services page) */

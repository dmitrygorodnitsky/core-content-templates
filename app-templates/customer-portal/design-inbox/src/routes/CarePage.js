// customer-portal-design/src/routes/CarePage.js — Wave 7: vertical care hub. Presentation runtime, no business logic.
import { F } from "../../data/fixtures.js";
import { h } from "../dom.js";
import { state } from "../state.js";
import { PageHeader } from "../components/shell/PageHeader.js";
import { EmptyState } from "../components/primitives/EmptyState.js";
import { ErrorState } from "../components/primitives/ErrorState.js";
import { ActionButton } from "../components/primitives/ActionButton.js";
import { EquipmentHub } from "../components/care/EquipmentHub.js";
import { SeasonLog } from "../components/care/SeasonLog.js";
import { LawnProgram } from "../components/care/LawnProgram.js";
import { WaterQuality } from "../components/care/WaterQuality.js";
import { RoofReport } from "../components/care/RoofReport.js";
import { PestMonitoring } from "../components/care/PestMonitoring.js";
import { HealthCareHub } from "../components/care/HealthCareHub.js";
import { BeautyCareHub } from "../components/care/BeautyCareHub.js";

/* loading skeleton mirrors the care-grid shape */
function careSkeleton() {
  return h("div", { "class": "care-grid", "data-state": "loading" }, [
    h("div", { "class": "care-col" }, [
      h("div", { "class": "skeleton", style: "height:120px;border-radius:16px" }),
      h("div", { "class": "skeleton", style: "height:320px;border-radius:20px" })
    ]),
    h("div", { "class": "care-col" }, [
      h("div", { "class": "skeleton", style: "height:240px;border-radius:20px" }),
      h("div", { "class": "skeleton", style: "height:150px;border-radius:20px" })
    ])
  ]);
}

/* entitlement gate — shown when the plan doesn't include this hub.
   Visual only: upgrade goes to pricing, questions go to support. */
function entitlementGate(m) {
  return h("div", { "class": "state-block", "data-module": "entitlement-gate", "data-visual-id": "entitlement-gate", "data-state": "unauthorized" }, [
    h("div", { "class": "state-block__glyph" }, "\u26bf"),
    h("div", { "class": "state-block__title" }, m.navLabel + " isn\u2019t part of your plan yet"),
    h("div", { "class": "state-block__desc" }, "Your current plan doesn\u2019t include " + m.title.toLowerCase() + ". Upgrade to unlock it, or ask us anything."),
    h("div", { style: "display:flex;gap:10px;justify-content:center" }, [
      ActionButton({ variant: "btn--primary", label: "View plans", action: "profile.managePlan", visualId: "entitlement-upgrade" }),
      ActionButton({ variant: "btn--ghost", label: "Contact support", action: "support.open", visualId: "entitlement-support" })
    ])
  ]);
}

/* One config-driven route ("care") whose CONTENT is vertical-specific —
   the same mechanism as portal profiles: fixtures.careModules[theme]
   picks which hub renders and what the nav item is called.
   States: ready | loading | empty | error | unauthorized (state.view). */
export function Care() {
  var m = F.careModules[state.theme] || F.careModules["HVAC"];
  var page = h("section", { "class": "page", "data-route": "care", "data-visual-id": "care-" + m.kind, "data-state": state.view });
  page.appendChild(PageHeader({ title: m.title, sub: m.sub }));

  if (state.view === "loading")      { page.appendChild(careSkeleton()); return page; }
  if (state.view === "error")        { page.appendChild(ErrorState({ title: "Couldn\u2019t load " + m.title.toLowerCase(), desc: "Something went wrong fetching this page. Try again." })); return page; }
  if (state.view === "empty")        { page.appendChild(EmptyState(m.empty)); return page; }
  if (state.view === "unauthorized") { page.appendChild(entitlementGate(m)); return page; }

  var body =
    m.kind === "equipment"  ? EquipmentHub(m) :
    m.kind === "seasonLog"  ? SeasonLog(m) :
    m.kind === "program"    ? LawnProgram(m) :
    m.kind === "water"      ? WaterQuality(m) :
    m.kind === "roof"       ? RoofReport(m) :
    m.kind === "healthCare" ? HealthCareHub(m) :
    m.kind === "beautyCare" ? BeautyCareHub(m) :
                              PestMonitoring(m);
  page.appendChild(body);
  return page;
}

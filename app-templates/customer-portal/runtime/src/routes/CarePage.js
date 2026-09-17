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

const RENDERERS = {
  equipment: EquipmentHub,
  seasonLog: SeasonLog,
  program: LawnProgram,
  water: WaterQuality,
  roof: RoofReport,
  monitoring: PestMonitoring,
  healthCare: HealthCareHub,
  beautyCare: BeautyCareHub,
};

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

function entitlementGate(envelope) {
  return h("div", { "class": "state-block", "data-module": "entitlement-gate", "data-visual-id": "entitlement-gate", "data-state": "unauthorized" }, [
    h("div", { "class": "state-block__glyph" }, "\u26bf"),
    h("div", { "class": "state-block__title" }, envelope.navLabel + " isn\u2019t part of your plan yet"),
    h("div", { "class": "state-block__desc" }, "Your current plan doesn\u2019t include " + envelope.title.toLowerCase() + ". Upgrade to unlock it, or ask us anything."),
    h("div", { style: "display:flex;gap:10px;justify-content:center" }, [
      ActionButton({ variant: "btn--primary", label: "View plans", action: "profile.managePlan", visualId: "entitlement-upgrade" }),
      ActionButton({ variant: "btn--ghost", label: "Contact support", action: "support.open", visualId: "entitlement-support" })
    ])
  ]);
}

function accessState(envelope) {
  if (envelope.state === "unauthorized") return entitlementGate(envelope);
  if (envelope.state === "loading") return careSkeleton();
  if (envelope.state === "error") return ErrorState({ title: "Couldn\u2019t load " + envelope.title.toLowerCase(), desc: "Something went wrong fetching this page. Try again." });
  if (envelope.state === "empty") return EmptyState({ glyph: envelope.emptyState.glyph, title: envelope.emptyState.title, desc: envelope.emptyState.description });
  if (envelope.state === "disabled") return EmptyState({ glyph: "i", title: "Care is not enabled", desc: "This module is disabled for the current portal configuration." });
  return null;
}

export function Care() {
  var envelope = state.moduleData.care;
  if (!envelope) {
    envelope = { title: "Care", subtitle: "", navLabel: "Care", kind: null, state: "loading", access: { status: "checking", reasonCode: null } };
  }
  var page = h("section", {
    "class": "page", "data-route": "care",
    "data-visual-id": envelope.kind ? "care-" + envelope.kind : "care-access",
    "data-state": envelope.state, "data-access": envelope.access.status,
    "data-reason-code": envelope.access.reasonCode || undefined,
  });
  page.appendChild(PageHeader({ title: envelope.title, sub: envelope.subtitle }));

  var treatment = accessState(envelope);
  if (treatment) { page.appendChild(treatment); return page; }

  var renderer = RENDERERS[envelope.kind];
  if (!renderer || !envelope.content) {
    page.appendChild(ErrorState({ title: "Couldn\u2019t load care", desc: "The Care payload is unavailable." }));
    return page;
  }
  var retreatScope = envelope.content.guarantee && envelope.content.guarantee.scope;
  var retreatKey = retreatScope && "care.requestRetreat:" + retreatScope.planId;
  page.appendChild(renderer(envelope.content, {
    selectedUnitId: state.careSelectedUnitId,
    selectedSpecialistId: state.careSelectedSpecialistId,
    tasksDone: state.careTasksDone,
    retreatRequest: retreatScope ? state.careRetreatRequests[retreatScope.planId] || null : null,
    retreatPending: retreatKey ? state.pending[retreatKey] === true : false,
    retreatError: retreatKey ? state.commandErrors[retreatKey] || null : null,
  }));
  return page;
}

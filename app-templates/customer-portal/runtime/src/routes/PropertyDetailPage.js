import { h } from "../dom.js";
import { currentFixture, currentOverview, isModuleEnabled, liveOverviewStatus, quoteGroupFor, quotePackage, state } from "../state.js";
import { browserStorage, createGeocodeCache } from "../adapters/google-maps-adapter.js";
import { ActionButton } from "../components/primitives/ActionButton.js";
import { EmptyState } from "../components/primitives/EmptyState.js";
import { ErrorState } from "../components/primitives/ErrorState.js";
import { UnauthorizedState, skel } from "../components/primitives/RouteStates.js";
import { SectionUnavailable, UnavailableChip } from "../components/primitives/SectionUnavailable.js";
import { knownPlacement } from "../components/storm/PropertyMap.js";
import { OVERVIEW_STATUS as STATUS, knownPropertyStatus, sectionAvailable } from "../normalizers/overview.js";
import { stateMeta } from "../normalizers/appointments.js";

var AGREEMENT_FACT_NOTES = {
  unauthorized: "Your account doesn’t include access to contracts.",
  unavailable: "Contracts aren’t in the portal yet.",
  error: "Your contracts couldn’t be loaded.",
};

var QUOTE_DECISION = {
  approved: "option approved",
  declined: "declined",
  revision: "changes requested",
  open: "awaiting your decision",
};

export function currentProperty() {
  var model = currentOverview();
  var properties = (model && model.properties) || [];
  return properties.find(function (property) { return property.id === state.propertyId; }) || null;
}

export function PropertyDetail() {
  var page = h("section", { "class": "page page--narrow", "data-route": "property.detail", "data-visual-id": "property-detail" });
  var source = state.config.dataMode === "live" ? liveOverviewStatus() : "ready";
  if (source !== "ready") {
    page.setAttribute("data-state", source === "loading" ? "loading" : source === "unauthorized" ? "unauthorized" : "error");
    if (source === "loading") page.appendChild(PropertySkeleton());
    else if (source === "unauthorized") page.appendChild(UnauthorizedState({ scope: "this property", backRoute: state.config.defaultRoute }));
    else {
      page.appendChild(BackLink(null));
      page.appendChild(ErrorState({ title: "Couldn’t load this property", desc: "Nothing was changed. Check your connection and try again." }));
    }
    return page;
  }

  var model = currentOverview();
  var property = currentProperty();

  if (!property) {
    page.setAttribute("data-state", "not-found");
    page.appendChild(BackLink(model));
    page.appendChild(EmptyState({ glyph: "◌", title: "Property not found", desc: sectionAvailable(model, "contracts") ? "This address is not on your contract." : "We couldn’t find this property." }));
    return page;
  }

  var status = knownPropertyStatus(property, model.sources);
  var contract = contractFor(property);

  page.appendChild(BackLink(model));
  page.appendChild(h("div", { "class": "prop-head" }, [
    h("div", { style: "flex:1;min-width:0" }, [
      text("h1", "prop-head__title", property.name),
      property.address ? text("div", "prop-head__addr", property.address) : null,
    ]),
    status ? text("span", "status-badge status-badge--" + statusTone(status), STATUS[status].label) : null,
  ]));

  page.appendChild(h("div", { "class": "card card--pad prop-facts", "data-module": "property-facts", "data-visual-id": "property-facts" },
    facts(property, contract, model).map(function (item) {
      return h("div", { "class": "prop-fact", "data-fact": item.key, "data-state": item.state }, [
        text("div", "prop-fact__label", item.label),
        item.state === "unavailable"
          ? h("div", { "class": "prop-fact__value" }, [UnavailableChip()])
          : item.state === "loading"
            ? h("div", { "class": "prop-fact__value", "aria-busy": "true" }, [skel("width:62%;height:15px")])
            : item.action
            ? h("div", { "class": "link-action prop-fact__value", "data-action": item.action, "data-id": item.id }, item.value + " ›")
            : text("div", "prop-fact__value", item.value),
        item.note ? text("div", "prop-fact__note", item.note) : null,
      ]);
    })));

  if (property.ticket && sectionAvailable(model, "support")) {
    page.appendChild(h("div", { "class": "card card--pad prop-ticket", "data-module": "property-ticket", "data-visual-id": "property-ticket" }, [
      text("div", "prop-section__title", "Open request"),
      text("div", "prop-ticket__title", property.ticket.title),
      h("div", { "class": "link-action", "data-action": "nav.go", "data-id": "support" }, "Open support ›"),
    ]));
  }

  page.appendChild(VisitCard(property, model));
  return page;
}

function VisitCard(property, model) {
  var card = h("div", { "class": "card card--pad prop-visits", "data-module": "property-visits", "data-visual-id": "property-visits" }, [
    text("div", "prop-section__title", "Service"),
  ]);

  if (!sectionAvailable(model, "appointments")) {
    card.setAttribute("data-state", "unavailable");
    card.appendChild(SectionUnavailable("Scheduled visits"));
    return card;
  }

  if (property.appointment) {
    var meta = stateMeta(property.appointment.state);
    card.appendChild(h("div", { "class": "prop-visit", "data-action": "appointments.openVisit", "data-id": property.id, "data-state": property.appointment.state.toLowerCase() }, [
      h("div", { style: "flex:1;min-width:0" }, [
        text("div", "prop-visit__title", property.appointment.service),
        text("div", "prop-visit__meta", property.appointment.when),
      ]),
      text("span", "status-badge status-badge--" + meta.tone, meta.label),
      text("span", "prop-visit__caret", "›"),
    ]));
  } else {
    card.appendChild(text("div", "prop-visit__meta", "No visit booked. Dispatch happens automatically when your trigger is met."));
  }

  if (property.lastService) {
    card.appendChild(h("div", { "class": "prop-last" }, [
      text("div", "prop-fact__label", "Last service"),
      text("div", "prop-visit__meta", property.lastService.service + " · " + property.lastService.when),
    ]));
  }

  card.appendChild(h("div", { "class": "prop-visits__foot" }, [
    ActionButton({ variant: "btn--ghost", label: "See the whole week", action: "nav.go", id: "appointments", visualId: "property-week" }),
  ]));
  return card;
}

function BackLink(model) {
  return sectionAvailable(model, "appointments")
    ? h("div", { "class": "detail-back", "data-action": "nav.go", "data-id": "appointments" }, "‹ Back to appointments")
    : h("div", { "class": "detail-back", "data-action": "nav.go", "data-id": "overview" }, "‹ Back to home");
}

function facts(property, contract, model) {
  var rows = [
    sectionAvailable(model, "contracts")
      ? { key: "contract", label: "Contract", value: contract ? "#" + contract.number + " · " + contract.plan : "Not under contract", action: contract ? "nav.go" : undefined, id: contract ? "proposals.list" : undefined }
      : state.config.dataMode === "live" && isModuleEnabled("proposals")
        ? liveAgreementFact(property)
        : { key: "contract", label: "Contract", state: "unavailable", note: "Contracts aren’t in the portal yet." },
  ];
  if (property.zone) rows.push({ key: "zone", label: "Service zone", value: zoneLabel(property.zone) });
  var map = mapFact(property);
  if (map) rows.push(map);
  var site = quoteSiteFor(property);
  if (site && site.lot) rows.push({ key: "lot", label: "Lot", value: site.lot + " sq ft" });
  var quotes = quoteGroupFor(property.quoteSiteId || property.id);
  if (quotes) {
    rows.push({
      key: "quotes", label: "Quotes",
      value: quotes.orders.length + (quotes.orders.length === 1 ? " quote" : " quotes") + " · " + QUOTE_DECISION[quotes.decision],
      action: "proposal.open", id: quotes.id,
    });
  }
  return rows;
}

function liveAgreementFact(property) {
  var envelope = state.moduleData.proposals;
  if (!envelope && state.moduleStatus.proposals !== "error") return { key: "contract", label: "Service agreement", state: "loading" };
  var readable = !!envelope && !AGREEMENT_FACT_NOTES[envelope.state] && !(state.contractCommand && state.contractCommand.phase === "readback-failed");
  var quotes = readable ? quotePackage() : null;
  if (!quotes) return { key: "contract", label: "Service agreement", state: "unavailable", note: AGREEMENT_FACT_NOTES[envelope && envelope.state] || AGREEMENT_FACT_NOTES.error };
  var row = quotes.agreements.find(function (agreement) {
    return agreement.properties.some(function (entry) { return entry.propertyBackendId === property.backendId; });
  });
  return row
    ? { key: "contract", label: "Service agreement", value: row.agreement.label, action: "agreement.open", id: row.id }
    : { key: "contract", label: "Service agreement", value: "None yet" };
}

function PropertySkeleton() {
  return h("div", { "data-module": "property-loading", "data-visual-id": "property-loading", "data-state": "loading", "aria-busy": "true" }, [
    skel("width:124px;height:13px;margin-bottom:16px"),
    h("div", { "class": "prop-head" }, [h("div", { style: "flex:1;min-width:0" }, [skel("width:48%;height:30px;margin-bottom:9px"), skel("width:66%;height:13px")])]),
    h("div", { "class": "card card--pad prop-facts" }, [0, 1].map(function () {
      return h("div", { "class": "prop-fact" }, [skel("width:38%;height:11px;margin-bottom:8px"), skel("width:70%;height:15px")]);
    })),
    skel("height:140px;border-radius:22px"),
  ]);
}

function mapFact(property) {
  if (!state.config.mapsApiKey) return null;
  var placement = knownPlacement(property, createGeocodeCache(browserStorage()));
  if (placement.point) return { key: "map", label: "Map", value: "On the map", action: "property.showOnMap", id: property.id };
  return { key: "map", label: "Map", value: "Not on the map", note: placement.reason === "no-address" ? "No address on file" : "" };
}

function contractFor(property) {
  var model = currentOverview();
  var contracts = (model && model.contracts) || [];
  return contracts.find(function (contract) { return contract.number === property.contract; }) || null;
}

function quoteSiteFor(property) {
  if (!property.quoteSiteId) return null;
  var fixture = currentFixture();
  var sites = (fixture && fixture.proposals && fixture.proposals.sites) || [];
  return sites.find(function (site) { return site.id === property.quoteSiteId; }) || null;
}

function zoneLabel(zone) {
  return String(zone || "").replace(/^./, function (letter) { return letter.toUpperCase(); });
}

function statusTone(status) {
  return { issue: "danger", enroute: "progress", scheduled: "info", monitoring: "scheduled" }[status] || "scheduled";
}

function text(tag, className, value) {
  return h(tag, className ? { "class": className } : null, value == null ? "" : String(value));
}

import { h } from "../dom.js";
import { render } from "../app.js";
import { currentFixture, currentOverview, isModuleEnabled, liveOverviewStatus, liveVisits, quoteGroupFor, quotePackage, state } from "../state.js";
import { ActionButton } from "../components/primitives/ActionButton.js";
import { EmptyState } from "../components/primitives/EmptyState.js";
import { ErrorState } from "../components/primitives/ErrorState.js";
import { StatusBadge } from "../components/primitives/StatusBadge.js";
import { UnauthorizedState, skel } from "../components/primitives/RouteStates.js";
import { PropertyLocation } from "../components/storm/PropertyMap.js";
import { PropertyPlan } from "../components/storm/PropertyPlan.js";
import { mapViewport, sharedPropertyMap } from "../property-map-session.js";
import { propertyPlan } from "../property-plan.js";
import { OVERVIEW_STATUS as STATUS, formatArea, knownPropertyStatus, sectionAvailable } from "../normalizers/overview.js";
import { currentServiceAgreement, formatDatePeriod, formatOrderPrice } from "../normalizers/contracts.js";
import { addressRepeats } from "../normalizers/postal-address.js";
import { stateMeta } from "../normalizers/appointments.js";
import { localDateKey, visitsForProperty } from "../normalizers/visits.js";
import { VisitRow } from "../components/storm/RecordRows.js";

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
  var service = serviceFor(property);

  page.appendChild(BackLink(model));
  page.appendChild(h("div", { "class": "prop-head" }, [
    h("div", { style: "flex:1;min-width:0" }, [
      text("h1", "prop-head__title", property.name),
      property.address && !addressRepeats(property.name, property.address) ? text("div", "prop-head__addr", property.address) : null,
    ]),
    status ? text("span", "status-badge status-badge--" + statusTone(status), STATUS[status].label) : null,
  ]));

  var rows = facts(property, contract, model, service);
  if (rows.length) {
    page.appendChild(h("div", { "class": "card card--pad prop-facts", "data-module": "property-facts", "data-visual-id": "property-facts" },
      rows.map(function (item) {
        return h("div", { "class": "prop-fact", "data-fact": item.key }, [
          text("div", "prop-fact__label", item.label),
          item.action
            ? h("div", { "class": "link-action prop-fact__value", "data-action": item.action, "data-id": item.id }, item.value + " ›")
            : text("div", "prop-fact__value", item.value),
        ]);
      })));
  }

  if (service) page.appendChild(ServiceCard(service));
  var visits = LiveVisitsCard(property);
  if (visits) page.appendChild(visits);
  var plan = PropertyPlan(propertyPlan(property.planId, render));
  if (plan) page.appendChild(plan);

  var location = PropertyLocation({
    property: property, map: sharedPropertyMap(), viewport: mapViewport(),
    link: { label: "See it with your other properties", action: "property.showOnMap", id: property.id },
  });
  if (location) page.appendChild(location);

  if (property.ticket && sectionAvailable(model, "support")) {
    page.appendChild(h("div", { "class": "card card--pad prop-ticket", "data-module": "property-ticket", "data-visual-id": "property-ticket" }, [
      text("div", "prop-section__title", "Open request"),
      text("div", "prop-ticket__title", property.ticket.title),
      h("div", { "class": "link-action", "data-action": "nav.go", "data-id": "support" }, "Open support ›"),
    ]));
  }

  if (sectionAvailable(model, "appointments")) page.appendChild(VisitCard(property));
  return page;
}

function ServiceCard(service) {
  var row = service.row;
  var agreement = row.agreement;
  return h("section", { "class": "card card--pad prop-service", "data-module": "property-service", "data-visual-id": "property-service", "data-state": agreement.stage, "aria-labelledby": "property-service-title" }, [
    h("div", { "class": "prop-section__title", id: "property-service-title" }, "Your service"),
  ].concat(service.orders.map(function (order) {
    var price = formatOrderPrice(order);
    var products = order.lines.map(function (line) { return line.product; }).filter(function (name, index, names) { return !!name && names.indexOf(name) === index; });
    return h("div", { "class": "prop-service__entry", "data-module": "property-service-option" }, [
      h("div", { "class": "prop-service__head" }, [
        h("div", { style: "flex:1;min-width:0" }, [
          text("div", "prop-service__option", order.pricingModel ? order.pricingModel.label : "Service"),
          price ? text("div", "prop-service__price", price) : null,
        ]),
        StatusBadge({ variant: "status-badge--" + agreement.tone, label: agreement.label, bind: "agreement.stateLabel", state: agreement.stage }),
      ]),
      products.length ? h("ul", { "class": "prop-service__lines", "aria-label": "Services" }, products.map(function (name) { return text("li", "prop-service__line", name); })) : null,
    ]);
  }), [
    h("button", { "class": "link-action prop-service__link", type: "button", "data-action": "agreement.open", "data-id": row.id, "data-visual-id": "property-service-agreement" }, "View agreement ›"),
  ]));
}

function serviceFor(property) {
  if (state.config.dataMode !== "live" || !isModuleEnabled("proposals")) return null;
  var envelope = state.moduleData.proposals;
  if (!envelope || envelope.state === "unauthorized" || envelope.state === "unavailable" || envelope.state === "error") return null;
  var row = currentServiceAgreement(quotePackage(), property.backendId);
  var entry = row ? row.properties.find(function (item) { return item.propertyBackendId === property.backendId; }) : null;
  return entry && entry.orders.length ? { row: row, orders: entry.orders } : null;
}

function LiveVisitsCard(property) {
  var found = visitsForProperty(liveVisits(), property.backendId);
  if (!found.next && !found.last) return null;
  var today = localDateKey(new Date(), state.config.timeZone);
  return h("section", { "class": "card card--pad prop-visits record-section", "data-module": "property-live-visits", "data-visual-id": "property-live-visits" }, [
    h("h2", { "class": "prop-section__title" }, "Visits"),
    h("div", { "class": "record-list" }, [
      found.next ? VisitRow(found.next, { today: today, label: "Next visit" }) : null,
      found.last ? VisitRow(found.last, { today: today, label: "Last visit" }) : null,
    ]),
    h("div", { "class": "link-action prop-visits__foot", "data-action": "nav.go", "data-id": "appointments", "data-visual-id": "property-all-visits" }, "All visits ›"),
  ]);
}

function VisitCard(property) {
  var card = h("div", { "class": "card card--pad prop-visits", "data-module": "property-visits", "data-visual-id": "property-visits" }, [
    text("div", "prop-section__title", "Service"),
  ]);

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

function facts(property, contract, model, service) {
  var rows = [];
  if (sectionAvailable(model, "contracts")) {
    rows.push({ key: "contract", label: "Contract", value: contract ? "#" + contract.number + " · " + contract.plan : "Not under contract", action: contract ? "nav.go" : undefined, id: contract ? "proposals.list" : undefined });
  }
  var area = formatArea(property.areaSqft);
  if (area) rows.push({ key: "area", label: "Area", value: area });
  if (property.planId) rows.push({ key: "plan", label: "Plan", value: "Approved" });
  if (service && service.row.agreement.term) rows.push({ key: "season", label: "Season", value: formatDatePeriod(service.row.agreement.term) });
  if (property.zone) rows.push({ key: "zone", label: "Service zone", value: zoneLabel(property.zone) });
  var site = quoteSiteFor(property);
  if (site && site.lot) rows.push({ key: "lot", label: "Lot", value: site.lot + " sq ft" });
  var group = quoteGroupFor(property.quoteSiteId || property.id);
  var listed = group ? (quotePackage() || { pending: [] }).pending.find(function (item) { return item.id === group.id; }) : null;
  var waiting = listed ? listed.orders.filter(function (order) { return order.status === "unseen" || order.status === "viewed"; }).length : 0;
  if (waiting) {
    rows.push({
      key: "quotes", label: "Quotes",
      value: waiting + (waiting === 1 ? " quote" : " quotes") + " · awaiting your decision",
      action: "proposal.open", id: group.id,
    });
  }
  return rows;
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

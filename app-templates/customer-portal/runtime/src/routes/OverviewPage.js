import { h } from "../dom.js";
import { currentFixture, state } from "../state.js";
import { ActionButton } from "../components/primitives/ActionButton.js";
import { EmptyState } from "../components/primitives/EmptyState.js";
import { PageHeader } from "../components/shell/PageHeader.js";
import { OVERVIEW_STATUS as STATUS, propertyStatus } from "../normalizers/overview.js";

var ICONS = {
  map: "M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11Z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  calendar: "M4.5 7.5h15v12a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5v-12Z M4.5 7.5V6A1.5 1.5 0 0 1 6 4.5h12A1.5 1.5 0 0 1 19.5 6v1.5 M8.5 3v3 M15.5 3v3 M8 12h3 M8 16h8",
  invoice: "M6 3.5h12v17l-3-2-3 2-3-2-3 2v-17Z M9.5 8.5h5 M9.5 12.5h5 M9.5 16h3",
  contract: "M12 3.2 19.5 6v6c0 4.2-3 7.6-7.5 8.8C7.5 19.6 4.5 16.2 4.5 12V6L12 3.2Z M9 12.2l2.2 2.2 4-4.2",
  support: "M4.5 6.5A2 2 0 0 1 6.5 4.5h11a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H10l-4 3.5v-3.5H6.5a2 2 0 0 1-2-2v-7Z M9 9.5h6 M9 12.5h4",
};

function icon(name, className) {
  var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  if (className) svg.setAttribute("class", className);
  var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", ICONS[name] || "");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "1.6");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  svg.appendChild(path);
  return svg;
}

export function overviewModel() {
  var fixture = currentFixture();
  return (fixture && fixture.overview) || null;
}

export function Overview() {
  var model = overviewModel();
  var page = h("section", { "class": "page", "data-route": "overview", "data-visual-id": "overview" });
  var customer = currentFixture().customer;

  page.appendChild(PageHeader({
    title: customer.greeting,
    sub: customer.subline,
  }));

  if (!model) {
    page.appendChild(EmptyState({
      glyph: "◌",
      title: "Nothing to show yet",
      desc: "This portal has no overview data configured.",
    }));
    return page;
  }

  page.appendChild(MapPanel(model));

  var grid = h("div", { "class": "ov-grid" });
  grid.appendChild(UpcomingWidget(model));
  grid.appendChild(InvoicesWidget(model));
  grid.appendChild(ContractsWidget(model));
  grid.appendChild(SupportWidget(model));
  page.appendChild(grid);

  return page;
}

function MapPanel(model) {
  var weather = model.weather;
  var index = state.ovWeatherIndex == null ? weather.nowIndex : state.ovWeatherIndex;
  var frame = weather.timeline[index] || weather.timeline[weather.nowIndex];

  var canvas = h("div", { "class": "ov-map__canvas", "data-weather": frame.kind });
  canvas.appendChild(h("div", { "class": "ov-map__overlay", "data-weather": frame.kind }));
  canvas.appendChild(h("div", { "class": "ov-map__road" }));
  canvas.appendChild(text("span", "ov-map__label", "property map · " + frame.label + " · " + frame.temp));

  model.properties.forEach(function (property) {
    var status = propertyStatus(property);
    var selected = state.ovProperty === property.id;
    var pin = h("button", {
      "class": "ov-pin ov-pin--" + status + (selected ? " ov-pin--on" : ""),
      style: "left:" + property.x + "%;top:" + property.y + "%",
      "data-action": "overview.selectProperty", "data-id": property.id,
      "data-module": "property-pin", "data-visual-id": "property-pin", "data-state": status,
      "aria-label": property.name + " — " + STATUS[status].label,
      "aria-pressed": selected ? "true" : "false",
    }, [h("i"), text("span", "ov-pin__name", property.name)]);
    canvas.appendChild(pin);
  });

  var panel = h("div", { "class": "ov-map card", "data-module": "property-map", "data-visual-id": "property-map" }, [
    h("div", { "class": "ov-map__head" }, [
      h("span", { "class": "ov-card__icon" }, [icon("map", "ov-icon")]),
      text("h2", "ov-card__title", "Your properties"),
      h("div", { "class": "ov-legend" }, weather.legend.map(function (item) {
        return h("span", { "class": "ov-legend__item", "data-weather": item.key }, [h("i"), text("span", "", item.label)]);
      })),
    ]),
    canvas,
    WeatherTimeline(weather, index),
  ]);

  var selectedProperty = model.properties.find(function (property) { return property.id === state.ovProperty; });
  if (selectedProperty) panel.appendChild(PropertyTooltip(selectedProperty));
  return panel;
}

function WeatherTimeline(weather, index) {
  var frame = weather.timeline[index];
  var wrap = h("div", { "class": "ov-timeline", "data-module": "weather-timeline", "data-visual-id": "weather-timeline" });

  var track = h("div", { "class": "ov-timeline__track" });
  weather.timeline.forEach(function (item, position) {
    track.appendChild(h("button", {
      "class": "ov-tick" + (position === index ? " ov-tick--on" : "") + (position === weather.nowIndex ? " ov-tick--now" : ""),
      "data-action": "overview.scrubWeather", "data-id": String(position),
      "data-weather": item.kind, "aria-label": item.at + " — " + item.label,
      "aria-pressed": position === index ? "true" : "false",
    }, [h("i"), text("span", "ov-tick__at", item.at)]));
  });
  wrap.appendChild(track);

  wrap.appendChild(h("div", { "class": "ov-timeline__read" }, [
    text("span", "ov-timeline__temp", frame.temp),
    text("span", "ov-timeline__label", frame.label),
    frame.note ? text("span", "ov-timeline__note", frame.note) : null,
  ]));
  return wrap;
}

function PropertyTooltip(property) {
  var status = propertyStatus(property);
  var active = property.appointment && property.appointment.state === "IN_PROGRESS" ? property.appointment : null;
  var rows = [];

  if (active) {
    rows.push(detailRow("Active Service", active.service + " · " + active.when));
  } else if (property.lastService) {
    rows.push(detailRow("Last Service", property.lastService.service + " · " + property.lastService.when));
  }

  return h("div", { "class": "ov-tip", "data-module": "property-tooltip", "data-visual-id": "property-tooltip", "data-state": status, role: "dialog", "aria-label": property.name }, [
    h("div", { "class": "ov-tip__head" }, [
      h("div", { style: "flex:1;min-width:0" }, [
        text("div", "ov-tip__name", property.name),
        text("div", "ov-tip__addr", property.address),
      ]),
      h("button", { "class": "ov-tip__close", "data-action": "overview.closeProperty", "aria-label": "Close" }, "✕"),
    ]),
    h("div", { "class": "ov-tip__status ov-tip__status--" + status }, [
      h("i"),
      h("div", null, [
        text("div", "ov-tip__status-label", STATUS[status].label),
        text("div", "ov-tip__status-copy", STATUS[status].copy),
      ]),
    ]),
    h("div", { "class": "ov-tip__rows" }, rows),
    h("div", { "class": "ov-tip__actions" }, [
      ActionButton({ variant: "btn--primary", label: "Property Details", action: "overview.openProperty", id: property.id, visualId: "property-details" }),
      ActionButton({ variant: "btn--ghost", label: "Go to Properties", action: "overview.openProperties", visualId: "go-to-properties" }),
    ]),
  ]);
}

function UpcomingWidget(model) {
  var scheduled = model.properties.filter(function (property) {
    return property.appointment && property.appointment.state === "SCHEDULED";
  });
  var card = widget("upcoming-services", "Upcoming services", "Appointments", "overview.openAppointments", "calendar");
  if (!scheduled.length) {
    card.appendChild(emptyLine("No scheduled visits", "Dispatch happens automatically when your trigger is met."));
    return card;
  }
  card.appendChild(lead(String(scheduled.length), scheduled.length === 1 ? "scheduled appointment" : "scheduled appointments"));
  scheduled.forEach(function (property) {
    card.appendChild(h("div", { "class": "ov-row", "data-module": "upcoming-row" }, [
      h("div", { style: "flex:1;min-width:0" }, [
        text("div", "ov-row__title", property.appointment.service),
        text("div", "ov-row__meta", property.appointment.when + " · " + property.name),
      ]),
    ]));
  });
  return card;
}

function InvoicesWidget(model) {
  var invoices = model.invoices;
  var outstanding = invoices.outstanding || [];
  var card = widget("invoices", "Invoices", "Invoices", "overview.openInvoices", "invoice");

  if (!outstanding.length) {
    if (!invoices.lastPaid) {
      card.appendChild(emptyLine("No invoices yet", "Invoices appear here once the season is billed."));
      return card;
    }
    card.appendChild(invoiceRow({
      number: invoices.lastPaid.number,
      amount: invoices.lastPaid.amount,
      meta: "paid " + invoices.lastPaid.paid,
      state: "PAID",
    }));
    return card;
  }

  card.appendChild(lead(totalOf(outstanding), outstanding.length === 1 ? "outstanding" : "across " + outstanding.length + " invoices"));
  outstanding.slice(0, 3).forEach(function (invoice) {
    card.appendChild(invoiceRow({
      number: invoice.number,
      amount: invoice.amount,
      meta: invoice.state === "OVERDUE" ? "overdue since " + invoice.due : "due " + invoice.due,
      state: invoice.state,
    }));
  });
  if (outstanding.length > 3) card.appendChild(moreLine(outstanding.length - 3, "more outstanding", "overview.openInvoices"));
  return card;
}

function invoiceRow(invoice) {
  return h("div", { "class": "ov-row", "data-module": "invoice-row", "data-visual-id": "invoice-row", "data-state": invoice.state.toLowerCase() }, [
    h("div", { style: "flex:1;min-width:0" }, [
      text("div", "ov-row__title", "Invoice " + invoice.number),
      text("div", "ov-row__meta", invoice.amount + " " + invoice.meta),
    ]),
    invoice.state === "OVERDUE" ? text("span", "status-badge status-badge--danger", "Overdue") : null,
    h("div", { "class": "link-action", "data-action": "overview.openInvoice", "data-id": invoice.number }, "View invoice ›"),
  ]);
}

function ContractsWidget(model) {
  var contracts = model.contracts || [];
  var card = widget("active-contracts", "Active contracts", "Contracts", "overview.openContracts", "contract");
  if (!contracts.length) {
    card.appendChild(emptyLine("No active contracts", "A contract appears here once a quote is approved."));
    return card;
  }
  card.appendChild(lead(String(contracts.length), contracts.length === 1 ? "active contract" : "active contracts"));
  contracts.slice(0, 3).forEach(function (contract) {
    card.appendChild(h("div", { "class": "ov-contract", "data-module": "contract-row", "data-visual-id": "contract-row" }, [
      text("div", "ov-row__title", "Contract #" + contract.number),
      text("div", "ov-contract__plan", contract.plan),
      text("div", "ov-contract__desc", contract.description),
    ]));
  });
  if (contracts.length > 3) card.appendChild(moreLine(contracts.length - 3, "more contracts", "overview.openContracts"));
  return card;
}

function SupportWidget(model) {
  var requests = model.support || [];
  var card = widget("support-requests", "Support requests", "Support", "overview.openSupport", "support");
  if (!requests.length) {
    card.appendChild(h("div", { "class": "ov-empty", "data-state": "empty" }, [
      text("div", "ov-empty__title", "No open requests"),
      text("div", "ov-empty__desc", "Everything looks good. Need help?"),
      h("div", { "class": "link-action", "data-action": "overview.newRequest" }, "Submit a request ›"),
    ]));
    return card;
  }
  card.appendChild(lead(String(requests.length), requests.length === 1 ? "open request" : "open requests"));
  requests.slice(0, 2).forEach(function (request) {
    card.appendChild(h("div", { "class": "ov-row", "data-module": "support-row", "data-visual-id": "support-row" }, [
      h("div", { style: "flex:1;min-width:0" }, [
        text("div", "ov-row__title", request.title),
        text("div", "ov-row__meta", request.status + " · " + request.when),
      ]),
    ]));
  });
  if (requests.length > 2) card.appendChild(moreLine(requests.length - 2, "more open requests", "overview.openSupport"));
  return card;
}

function widget(id, title, linkLabel, action, iconName) {
  return h("div", { "class": "card card--pad ov-card", "data-module": id, "data-visual-id": id }, [
    h("div", { "class": "ov-card__head" }, [
      h("span", { "class": "ov-card__icon" }, [icon(iconName, "ov-icon")]),
      text("h2", "ov-card__title", title),
      h("div", { "class": "link-action", "data-action": action }, linkLabel + " ›"),
    ]),
  ]);
}

function lead(value, label) {
  return h("div", { "class": "ov-lead" }, [
    text("span", "ov-lead__value", value),
    text("span", "ov-lead__label", label),
  ]);
}

function totalOf(invoices) {
  var sum = invoices.reduce(function (running, invoice) {
    return running + Number(String(invoice.amount).replace(/[^0-9.]/g, "")) || running;
  }, 0);
  return "$" + sum.toLocaleString("en-US");
}

function moreLine(count, label, action) {
  return h("div", { "class": "link-action ov-more", "data-action": action }, String(count) + " " + label + " ›");
}

function emptyLine(title, desc) {
  return h("div", { "class": "ov-empty", "data-state": "empty" }, [
    text("div", "ov-empty__title", title),
    text("div", "ov-empty__desc", desc),
  ]);
}

function detailRow(label, value) {
  return h("div", { "class": "ov-tip__row" }, [
    text("span", "ov-tip__row-label", label),
    text("span", "ov-tip__row-value", value),
  ]);
}

function text(tag, className, value) {
  return h(tag, className ? { "class": className } : null, value == null ? "" : String(value));
}

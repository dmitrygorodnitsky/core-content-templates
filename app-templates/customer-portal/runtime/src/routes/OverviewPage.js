import { h } from "../dom.js";
import { currentFixture, currentOverview, state } from "../state.js";
import { ActionButton } from "../components/primitives/ActionButton.js";
import { EmptyState } from "../components/primitives/EmptyState.js";
import { PageHeader } from "../components/shell/PageHeader.js";
import { OVERVIEW_STATUS as STATUS, appointmentDay, clampFrameIndex, invoiceBuckets, money, propertyStatus, propertyWeather, serviceDayCount } from "../normalizers/overview.js";
import { mapImageUrl, mapOpened, projectPoint } from "../normalizers/map-image.js";

var ICONS = {
  map: "M4 7.5 9.5 5l5 2.5L20 5v11.5L14.5 19l-5-2.5L4 19V7.5Z M9.5 5v11.5 M14.5 7.5V19",
  calendar: "M4.5 7.5h15v12a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5v-12Z M4.5 7.5V6A1.5 1.5 0 0 1 6 4.5h12A1.5 1.5 0 0 1 19.5 6v1.5 M8.5 3v3 M15.5 3v3 M8 12h3 M8 16h8",
  invoice: "M6 3.5h12v17l-3-2-3 2-3-2-3 2v-17Z M9.5 8.5h5 M9.5 12.5h5 M9.5 16h3",
  contract: "M12 3.2 19.5 6v6c0 4.2-3 7.6-7.5 8.8C7.5 19.6 4.5 16.2 4.5 12V6L12 3.2Z M9 12.2l2.2 2.2 4-4.2",
  support: "M4.5 6.5A2 2 0 0 1 6.5 4.5h11a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H10l-4 3.5v-3.5H6.5a2 2 0 0 1-2-2v-7Z M9 9.5h6 M9 12.5h4",
  alert: "M12 4.2 21 19.5H3L12 4.2Z M12 10v4.4 M12 16.6v.6",
  pin: "M12 21s-6.5-5.8-6.5-10.5a6.5 6.5 0 1 1 13 0C18.5 15.2 12 21 12 21Z M12 12.8a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6Z",
  snowflake: "M12 3v18 M4.2 7.5l15.6 9 M19.8 7.5l-15.6 9 M12 7l-2.6-2.2 M12 7l2.6-2.2 M12 17l-2.6 2.2 M12 17l2.6 2.2",
  live: "M12 11.2a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Z M8.6 8.6a4.8 4.8 0 0 0 0 6.8 M15.4 8.6a4.8 4.8 0 0 1 0 6.8 M6 6a8 8 0 0 0 0 12 M18 6a8 8 0 0 1 0 12",
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
  return currentOverview();
}

export function Overview() {
  var model = overviewModel();
  var page = h("section", { "class": "page", "data-route": "overview", "data-visual-id": "overview" });
  var customer = currentFixture().customer;
  var header = PageHeader({ title: customer.greeting, sub: subline(model, customer) });

  if (!model) {
    page.appendChild(header);
    page.appendChild(EmptyState({
      glyph: "◌",
      title: "Nothing to show yet",
      desc: "This portal has no overview data configured.",
    }));
    return page;
  }

  var weather = model.weather;
  var index = clampFrameIndex(weather.timeline, state.ovWeatherIndex == null ? weather.nowIndex : state.ovWeatherIndex);
  var frame = weather.timeline[index];

  page.appendChild(h("div", { "class": "ov-head" }, [header, WeatherPanel(frame, index === weather.nowIndex)]));
  page.appendChild(MapPanel(model, frame, index));
  page.appendChild(InvoicesWidget(model));

  var grid = h("div", { "class": "ov-grid" });
  grid.appendChild(UpcomingWidget(model, weather.timeline));
  grid.appendChild(ContractsWidget(model));
  grid.appendChild(SupportWidget(model));
  page.appendChild(grid);

  if (model.banner) page.appendChild(Banner(model.banner));
  return page;
}

function subline(model, customer) {
  if (!model || !state.liveWeather) return customer.subline;
  var frame = model.weather.timeline[model.weather.nowIndex] || model.weather.timeline[0];
  var count = model.properties.length;
  return frame.label + " · " + count + (count === 1 ? " property under contract" : " properties under contract");
}

function WeatherPanel(frame, isNow) {
  var stats = frame.stats || [];
  return h("div", { "class": "ov-wx", "data-module": "weather-summary", "data-visual-id": "weather-summary", "data-weather": frame.kind }, [
    h("span", { "class": "ov-wx__mark" }, [icon("snowflake", "ov-wx__glyph")]),
    h("div", { "class": "ov-wx__read" }, [
      text("div", "ov-wx__temp", frame.temp),
      text("div", "ov-wx__label", frame.label),
      text("div", "ov-wx__note", isNow ? frame.note : frame.day + " " + frame.date + " · " + frame.note),
    ]),
    stats.length ? h("div", { "class": "ov-wx__stats" }, stats.map(function (stat) {
      return h("div", { "class": "ov-wx__stat" }, [
        text("span", "ov-wx__stat-label", stat.label),
        text("span", "ov-wx__stat-value", stat.value),
      ]);
    })) : null,
  ]);
}

function MapPanel(model, frame, index) {
  var weather = model.weather;
  var geo = mapOpened(model.map, state.config) ? model.map : null;
  var imageUrl = geo ? mapImageUrl(geo, state.config) : "";
  var canvas = h("div", { "class": "ov-map__canvas", "data-weather": frame.kind, "data-surface": imageUrl ? "map" : "drawn" });
  if (imageUrl) {
    canvas.appendChild(h("img", {
      "class": "ov-map__image", src: imageUrl, alt: "", "aria-hidden": "true",
      width: String(geo.size.width), height: String(geo.size.height), loading: "eager", decoding: "async",
    }));
  } else {
    canvas.appendChild(h("div", { "class": "ov-map__road" }));
  }
  canvas.appendChild(h("div", { "class": "ov-map__overlay", "data-weather": frame.kind }));
  canvas.appendChild(h("div", { "class": "ov-map__chip", "data-source": weather.source || "fixture" }, [
    icon("live", "ov-map__chip-glyph"),
    text("span", "", weather.source === "xweather" ? "Live conditions · Xweather" : "Sample conditions"),
  ]));

  var pins = h("div", { "class": "ov-map__pins" });
  model.properties.forEach(function (property) {
    var status = propertyStatus(property);
    var kind = propertyWeather(property, frame);
    var selected = state.ovProperty === property.id;
    var at = pinPlacement(property, geo);
    if (!at) return;
    pins.appendChild(h("button", {
      "class": "ov-pin" + (status === "enroute" ? " ov-pin--active" : "") + (selected ? " ov-pin--on" : ""),
      style: "left:" + at.x + "%;top:" + at.y + "%",
      "data-action": "overview.selectProperty", "data-id": property.id,
      "data-module": "property-pin", "data-visual-id": "property-pin",
      "data-state": status, "data-weather": kind,
      "aria-label": property.name + " — " + STATUS[status].label,
      "aria-pressed": selected ? "true" : "false",
    }, [icon("pin", "ov-pin__glyph")]));
  });

  var selectedProperty = model.properties.find(function (property) { return property.id === state.ovProperty; });
  if (selectedProperty) {
    var anchor = pinPlacement(selectedProperty, geo);
    if (anchor) pins.appendChild(PropertyTooltip(selectedProperty, frame, anchor));
  }

  return h("div", { "class": "ov-map card", "data-module": "property-map", "data-visual-id": "property-map" }, [
    h("div", { "class": "ov-map__head" }, [
      h("span", { "class": "ov-card__icon" }, [icon("map", "ov-icon")]),
      text("h2", "ov-card__title", "Your properties"),
      h("div", { "class": "ov-legend" }, weather.legend.map(function (item) {
        return h("span", { "class": "ov-legend__item", "data-weather": item.key }, [h("i"), text("span", "", item.label)]);
      })),
    ]),
    h("div", { "class": "ov-map__stage" }, [canvas, pins]),
    DayTimeline(weather, index, model.properties),
  ]);
}

function DayTimeline(weather, index, properties) {
  var last = weather.timeline.length - 1;
  var track = h("div", { "class": "ov-timeline__track" }, weather.timeline.map(function (item, position) {
    var visits = serviceDayCount(properties, position);
    return h("button", {
      "class": "ov-day" + (position === index ? " ov-day--on" : "") + (position === weather.nowIndex ? " ov-day--now" : "") + (visits ? " ov-day--service" : ""),
      "data-action": "overview.scrubWeather", "data-id": String(position),
      "data-weather": item.kind, "data-service": visits ? String(visits) : undefined,
      "aria-label": item.day + " " + item.date + " — " + item.label + (visits ? " — " + visits + (visits === 1 ? " visit" : " visits") : " — no visit"),
      "aria-pressed": position === index ? "true" : "false",
    }, [
      text("span", "ov-day__name", item.day),
      text("span", "ov-day__date", item.date),
      h("i"),
      h("span", { "class": "ov-day__svc" }, visits ? [
        text("b", "", String(visits)),
        text("span", "ov-day__svc-word", visits === 1 ? " visit" : " visits"),
      ] : []),
    ]);
  }));

  return h("div", { "class": "ov-timeline", "data-module": "weather-timeline", "data-visual-id": "weather-timeline" }, [
    stepButton("‹", "Previous day", index - 1, index === 0),
    track,
    stepButton("›", "Next day", index + 1, index === last),
  ]);
}

function stepButton(glyph, label, target, disabled) {
  return h("button", {
    "class": "ov-step",
    "data-action": disabled ? undefined : "overview.scrubWeather",
    "data-id": String(target),
    "aria-label": label,
    disabled: disabled ? "disabled" : undefined,
  }, glyph);
}

function pinPlacement(property, geo) {
  if (!geo) return { x: property.x, y: property.y };
  return projectPoint(property.lat, property.lon, geo);
}

function PropertyTooltip(property, frame, at) {
  var status = propertyStatus(property);
  var active = property.appointment && property.appointment.state === "IN_PROGRESS" ? property.appointment : null;
  var next = property.appointment && property.appointment.state === "SCHEDULED" ? property.appointment : null;
  var line = active ? active.service + " · " + active.when
    : next ? next.service + " · " + next.when
    : property.lastService ? "Last service · " + property.lastService.service + " · " + property.lastService.when
    : "";

  var above = at.y > 55;
  var top = above ? "calc(" + at.y + "% - 194px)" : "calc(" + at.y + "% + 12px)";
  var place = "left:clamp(0px, calc(" + at.x + "% - 144px), calc(100% - 288px));"
    + "top:clamp(8px, " + top + ", calc(100% - 168px))";

  return h("div", { "class": "ov-tip", style: place, "data-module": "property-tooltip", "data-visual-id": "property-tooltip", "data-state": status, "data-place": above ? "above" : "below", role: "dialog", "aria-label": property.name }, [
    h("div", { "class": "ov-tip__head" }, [
      h("div", { style: "flex:1;min-width:0" }, [
        text("div", "ov-tip__name", property.name),
        text("div", "ov-tip__addr", property.address),
      ]),
      h("button", { "class": "ov-tip__close", "data-action": "overview.closeProperty", "aria-label": "Close" }, "✕"),
    ]),
    h("div", { "class": "ov-tip__tags" }, [
      text("span", "ov-tip__tag ov-tip__tag--" + status, STATUS[status].label),
      text("span", "ov-tip__tag ov-tip__tag--wx", frame.day + " · " + frame.temp),
    ]),
    line ? text("div", "ov-tip__line", line) : null,
    h("div", { "class": "link-action ov-tip__link", "data-action": "overview.openProperty", "data-id": property.id, "data-visual-id": "property-details" }, "Go to Property ›"),
  ]);
}

function UpcomingWidget(model, timeline) {
  var scheduled = model.properties.filter(function (property) {
    return property.appointment && property.appointment.state === "SCHEDULED";
  });
  var card = widget("upcoming-services", "Upcoming services", "calendar");
  if (!scheduled.length) {
    card.appendChild(emptyLine("No scheduled visits", "Dispatch happens automatically when your trigger is met."));
    return card;
  }
  card.appendChild(lead(String(scheduled.length), scheduled.length === 1 ? "scheduled appointment" : "scheduled appointments", scheduled[0].appointment.when));
  scheduled.slice(0, 3).forEach(function (property) {
    var appointment = property.appointment;
    card.appendChild(h("div", { "class": "ov-slot", "data-module": "upcoming-row", "data-visual-id": "upcoming-row" }, [
      appointment.time ? text("span", "ov-slot__time", appointment.time) : null,
      h("span", { "class": "ov-slot__pin" }, [icon("pin", "ov-slot__glyph")]),
      h("button", { "class": "ov-slot__link", "data-action": "appointments.openVisit", "data-id": property.id,
        "aria-label": "Open the " + appointment.service + " visit at " + property.name }, [
        text("span", "ov-row__title", property.name),
        text("span", "ov-row__meta", metaOf(appointmentDay(appointment, timeline), appointment.service)),
      ]),
    ]));
  });
  card.appendChild(h("div", { "class": "ov-foot" }, [
    ActionButton({ variant: "btn--ghost", label: "View full calendar", action: "overview.openCalendar", visualId: "view-full-calendar" }),
  ]));
  return card;
}

function InvoicesWidget(model) {
  var buckets = invoiceBuckets(model.invoices);
  var overdue = buckets.overdue;
  var card = h("div", { "class": "card card--pad ov-card ov-bill" + (overdue.count ? " ov-bill--alarm" : ""), "data-module": "invoices", "data-visual-id": "invoices", "data-state": overdue.count ? "overdue" : "current" }, [
    h("div", { "class": "ov-card__head" }, [
      h("span", { "class": "ov-card__icon" }, [icon("invoice", "ov-icon")]),
      text("h2", "ov-card__title", "Invoices"),
      h("div", { "class": "link-action ov-bill__all", "data-action": "overview.openInvoices" }, "View all ›"),
    ]),
  ]);

  if (!buckets.outstanding.count && !buckets.paidThisMonth.count) {
    card.appendChild(emptyLine("No invoices yet", "Invoices appear here once the season is billed."));
    return card;
  }

  if (overdue.count) card.appendChild(OverdueAlert(overdue));

  card.appendChild(h("div", { "class": "ov-bill__stats" }, [
    billStat("Total outstanding", money(buckets.outstanding.amount), buckets.outstanding.count, ""),
    billStat("Due this month", money(buckets.dueThisMonth.amount), buckets.dueThisMonth.count, ""),
    billStat("Paid this month", money(buckets.paidThisMonth.amount), buckets.paidThisMonth.count, "ov-bill__stat-value--ok"),
  ]));

  card.appendChild(moreLine(null, "View all invoices", "overview.openInvoices"));
  return card;
}

function OverdueAlert(overdue) {
  return h("div", { "class": "ov-alarm", "data-module": "overdue-alert", "data-visual-id": "overdue-alert", role: "alert" }, [
    h("span", { "class": "ov-alarm__mark" }, [icon("alert", "ov-alarm__glyph")]),
    h("div", { "class": "ov-alarm__read" }, [
      text("div", "ov-alarm__eyebrow", "Overdue amount"),
      text("div", "ov-alarm__amount", money(overdue.amount)),
      text("div", "ov-alarm__count", "Across " + overdue.count + (overdue.count === 1 ? " overdue invoice" : " overdue invoices")),
      text("div", "ov-alarm__warn", "Please make a payment to avoid service interruption."),
    ]),
    h("div", { "class": "ov-alarm__act" }, [
      ActionButton({ variant: "btn--danger", label: "View overdue invoices →", action: "overview.openInvoices", visualId: "view-overdue-invoices" }),
    ]),
  ]);
}

function billStat(label, value, count, valueClass) {
  return h("div", { "class": "ov-bill__stat" }, [
    text("div", "ov-bill__stat-label", label),
    text("div", "ov-bill__stat-value " + valueClass, value),
    text("div", "ov-bill__stat-count", String(count) + (count === 1 ? " invoice" : " invoices")),
  ]);
}

function ContractsWidget(model) {
  var contracts = model.contracts || [];
  var card = widget("active-contracts", "Active contracts", "contract");
  if (!contracts.length) {
    card.appendChild(emptyLine("No active contracts", "A contract appears here once a quote is approved."));
    return card;
  }
  card.appendChild(lead(String(contracts.length), contracts.length === 1 ? "active contract" : "active contracts"));
  contracts.slice(0, 3).forEach(function (contract) {
    card.appendChild(h("div", { "class": "ov-row", "data-module": "contract-row", "data-visual-id": "contract-row" }, [
      h("div", { style: "flex:1;min-width:0" }, [
        text("div", "ov-row__title", "Contract #" + contract.number),
        text("div", "ov-row__meta", contract.plan),
      ]),
      text("span", "status-badge status-badge--ok", "Active"),
    ]));
  });
  card.appendChild(moreLine(null, "View all contracts", "overview.openContracts"));
  return card;
}

function SupportWidget(model) {
  var requests = model.support || [];
  var card = widget("support-requests", "Support requests", "support");
  if (!requests.length) {
    card.appendChild(h("div", { "class": "ov-empty", "data-state": "empty" }, [
      text("div", "ov-empty__title", "No open requests"),
      text("div", "ov-empty__desc", "Everything looks good. Need help?"),
      h("div", { "class": "link-action", "data-action": "overview.newRequest" }, "Submit a request ›"),
    ]));
    return card;
  }
  card.appendChild(lead(String(requests.length), requests.length === 1 ? "open request" : "open requests"));
  requests.slice(0, 2).forEach(function (request, position) {
    card.appendChild(h("div", { "class": "ov-row", "data-module": "support-row", "data-visual-id": "support-row", "data-tone": request.tone || "info" }, [
      h("i", { "class": "ov-dot" }),
      h("div", { style: "flex:1;min-width:0" }, [
        text("div", "ov-row__title", request.title),
        h("div", { "class": "ov-row__meta" }, [
          text("span", "ov-row__status", request.status),
          text("span", "", " · " + request.when),
        ]),
      ]),
      chevron("overview.openSupport", String(position), "Open " + request.title),
    ]));
  });
  card.appendChild(requests.length > 2
    ? moreLine(requests.length - 2, "more open requests", "overview.openSupport")
    : moreLine(null, "View all requests", "overview.openSupport"));
  return card;
}

function Banner(banner) {
  return h("div", { "class": "card card--pad ov-banner", "data-module": "storm-banner", "data-visual-id": "storm-banner" }, [
    h("span", { "class": "ov-banner__mark" }, [icon("snowflake", "ov-icon")]),
    h("div", { style: "flex:1;min-width:0" }, [
      text("div", "ov-banner__title", banner.title),
      text("div", "ov-banner__copy", banner.copy),
    ]),
    ActionButton({ variant: "btn--ghost", label: banner.action, action: "overview.newRequest", visualId: "storm-banner-cta" }),
  ]);
}

function widget(id, title, iconName) {
  return h("div", { "class": "card card--pad ov-card", "data-module": id, "data-visual-id": id }, [
    h("div", { "class": "ov-card__head" }, [
      h("span", { "class": "ov-card__icon" }, [icon(iconName, "ov-icon")]),
      text("h2", "ov-card__title", title),
    ]),
  ]);
}

function lead(value, label, meta) {
  return h("div", { "class": "ov-lead" }, [
    h("div", { "class": "ov-lead__main" }, [
      text("span", "ov-lead__value", value),
      text("span", "ov-lead__label", label),
    ]),
    meta ? text("div", "ov-lead__meta", meta) : null,
  ]);
}

function metaOf(day, service) {
  return day ? day + " · " + service : service;
}

function chevron(action, id, label) {
  return h("button", { "class": "ov-chev", "data-action": action, "data-id": id, "aria-label": label }, "›");
}

function moreLine(count, label, action) {
  return h("div", { "class": "link-action ov-more", "data-action": action }, (count == null ? label : String(count) + " " + label) + " ›");
}

function emptyLine(title, desc) {
  return h("div", { "class": "ov-empty", "data-state": "empty" }, [
    text("div", "ov-empty__title", title),
    text("div", "ov-empty__desc", desc),
  ]);
}

function text(tag, className, value) {
  return h(tag, className ? { "class": className } : null, value == null ? "" : String(value));
}

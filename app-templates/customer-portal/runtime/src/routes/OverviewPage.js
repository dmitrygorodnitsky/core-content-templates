import { h } from "../dom.js";
import { currentFixture, currentOverview, liveOverviewStatus, quotePackage, state } from "../state.js";
import { ACTIONS } from "../actions.js";
import { render } from "../app.js";
import { createPropertyForecasts } from "../live-weather.js";
import { createXweatherAdapter } from "../adapters/xweather-adapter.js";
import { browserStorage, createGeocodeCache, createGoogleMapsAdapter } from "../adapters/google-maps-adapter.js";
import { ActionButton } from "../components/primitives/ActionButton.js";
import { EmptyState } from "../components/primitives/EmptyState.js";
import { ErrorState } from "../components/primitives/ErrorState.js";
import { skel } from "../components/primitives/RouteStates.js";
import { PageHeader } from "../components/shell/PageHeader.js";
import { PropertyStage, WeatherAttribution, closeOnEscape, createFocusKeeper, createPropertyMap } from "../components/storm/PropertyMap.js";
import { icon } from "../components/storm/overview-icons.js";
import { appointmentDay, clampFrameIndex, invoiceBuckets, money, serviceDayCount } from "../normalizers/overview.js";

var propertyMapController = null;
var propertyForecastStore = null;
var focusKeeper = null;
var lastSelection = null;

export function overviewModel() {
  return currentOverview();
}

export function Overview() {
  var model = overviewModel();
  var page = h("section", { "class": "page", "data-route": "overview", "data-visual-id": "overview" });
  var customer = overviewCustomer();
  var header = PageHeader({ title: customer.greeting, sub: subline(model, customer) });

  if (!model) {
    page.appendChild(header);
    page.appendChild(OverviewUnavailable());
    return page;
  }

  var weather = model.weather;
  var index = clampFrameIndex(weather.timeline, state.ovWeatherIndex == null ? weather.nowIndex : state.ovWeatherIndex);
  var frame = weather.timeline[index];

  page.appendChild(h("div", { "class": "ov-head" }, [header, WeatherPanel(frame, index === weather.nowIndex, weather.source)]));
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

function overviewCustomer() {
  if (state.config.dataMode !== "live") return currentFixture().customer;
  var name = String(state.sessionName || "").trim();
  var first = name && name.indexOf("@") === -1 ? name.split(/\s+/)[0] : "";
  return { greeting: first ? "Welcome back, " + first : "Welcome back", subline: "" };
}

function OverviewUnavailable() {
  if (state.config.dataMode !== "live") {
    return EmptyState({ glyph: "◌", title: "Nothing to show yet", desc: "This portal has no overview data configured." });
  }
  var status = liveOverviewStatus();
  if (status === "loading") {
    return h("div", { "data-module": "overview-loading", "data-visual-id": "overview-loading", "data-state": "loading", "aria-busy": "true", style: "margin-top:20px" }, [
      skel("height:420px;border-radius:22px;margin-bottom:16px"),
      h("div", { "class": "ov-grid" }, [skel("height:170px;border-radius:22px"), skel("height:170px;border-radius:22px"), skel("height:170px;border-radius:22px")]),
    ]);
  }
  if (status === "error") {
    return ErrorState({ title: "Couldn’t load your home screen", desc: "Your properties or the forecast didn’t load. Nothing was changed — try again." });
  }
  if (status === "unauthorized") {
    return EmptyState({
      glyph: "⚿",
      title: "You don’t have access to these properties",
      desc: "Your account doesn’t include the properties on this portal. If that seems wrong, contact us.",
      action: { variant: "btn--ghost", label: "Go to support", action: "nav.go", id: "support", visualId: "overview-support" },
    });
  }
  return EmptyState({ glyph: "◌", title: "Your home screen isn’t set up yet", desc: "This portal has no service area or forecast configured, so there is nothing to show here yet." });
}

function subline(model, customer) {
  if (!model || !state.liveWeather) return customer.subline;
  var frame = model.weather.timeline[model.weather.nowIndex] || model.weather.timeline[0];
  var count = model.properties.length;
  var contracted = count > 0 && model.properties.every(function (property) { return !!property.contract; });
  return frame.label + " · " + count + (count === 1 ? " property" : " properties") + (contracted ? " under contract" : "");
}

function WeatherPanel(frame, isNow, source) {
  var stats = frame.stats || [];
  return h("div", { "class": "ov-wx", "data-module": "weather-summary", "data-visual-id": "weather-summary", "data-weather": frame.kind }, [
    h("span", { "class": "ov-wx__mark" }, [icon("snowflake", "ov-wx__glyph")]),
    h("div", { "class": "ov-wx__read" }, [
      text("div", "ov-wx__temp", frame.temp),
      text("div", "ov-wx__label", frame.label),
      text("div", "ov-wx__note", isNow ? frame.note : frame.day + " " + frame.date + " · " + frame.note),
      WeatherAttribution(source),
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
  var stage = PropertyStage({
    properties: model.properties,
    frame: frame,
    index: index,
    weather: weather,
    viewport: model.map,
    selectedId: state.ovProperty,
    map: propertyMap(),
    forecasts: propertyForecasts(),
  });
  followSelection();
  return h("div", { "class": "ov-map card", "data-module": "property-map", "data-visual-id": "property-map" }, [
    h("div", { "class": "ov-map__head" }, [
      h("span", { "class": "ov-card__icon" }, [icon("map", "ov-icon")]),
      text("h2", "ov-card__title", "Your properties"),
      h("div", { "class": "ov-legend" }, weather.legend.map(function (item) {
        return h("span", { "class": "ov-legend__item", "data-weather": item.key }, [h("i"), text("span", "", item.label)]);
      })),
    ]),
    stage,
    DayTimeline(weather, index, model.properties),
    WeatherAttribution(weather.source, "ov-map__attr"),
  ]);
}

function propertyMap() {
  if (!state.config.mapsApiKey) return null;
  if (!propertyMapController) {
    propertyMapController = createPropertyMap({
      adapter: createGoogleMapsAdapter({ apiKey: state.config.mapsApiKey }),
      cache: createGeocodeCache(browserStorage()),
      mapId: state.config.mapsMapId,
      dispatch: dispatchAction,
      onChange: render,
    });
  }
  return propertyMapController;
}

function propertyForecasts() {
  if (!propertyForecastStore) {
    propertyForecastStore = createPropertyForecasts({
      adapter: createXweatherAdapter({ clientId: state.config.weatherClientId, clientSecret: state.config.weatherClientSecret }),
      onChange: render,
    });
  }
  return propertyForecastStore;
}

function dispatchAction(name, id) {
  var action = ACTIONS[name];
  if (action) action(id);
}

function followSelection() {
  if (!focusKeeper) {
    focusKeeper = createFocusKeeper(document);
    closeOnEscape(document, function () {
      return state.route === "overview" && !!state.ovProperty;
    }, function () {
      dispatchAction("overview.closeProperty");
    });
  }
  var previous = lastSelection;
  var current = state.ovProperty;
  lastSelection = current;
  Promise.resolve().then(function () { focusKeeper.settle(current, previous); });
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
  var quotes = quotePackage();
  var preparing = !!(quotes && quotes.preparing);
  var card = widget("active-contracts", "Active contracts", "contract");
  if (!contracts.length) {
    card.appendChild(preparing
      ? QuotePreparingLine()
      : emptyLine("No active contracts", "A contract appears here once your service agreement is approved."));
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
  if (preparing) card.appendChild(QuotePreparingRow());
  card.appendChild(moreLine(null, "View all contracts", "overview.openContracts"));
  return card;
}

function QuotePreparingLine() {
  return h("div", { "class": "ov-empty", "data-module": "quote-preparing", "data-visual-id": "quote-preparing", "data-state": "preparing", role: "status" }, [
    text("div", "ov-empty__title", "We have your request"),
    text("div", "ov-empty__desc", "We’re preparing your quote. It appears under Contracts once we send it."),
    h("div", { "class": "link-action", "data-action": "overview.openContracts" }, "Go to Contracts ›"),
  ]);
}

function QuotePreparingRow() {
  return h("div", { "class": "ov-row", "data-module": "quote-preparing", "data-visual-id": "quote-preparing", "data-state": "preparing", "data-tone": "info", role: "status" }, [
    h("i", { "class": "ov-dot" }),
    h("div", { style: "flex:1;min-width:0" }, [
      text("div", "ov-row__title", "Request in preparation"),
      text("div", "ov-row__meta", "We have your request and are preparing your quote."),
    ]),
    chevron("overview.openContracts", "", "Go to Contracts"),
  ]);
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

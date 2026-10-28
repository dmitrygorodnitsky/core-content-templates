import { h } from "../dom.js";
import { liveProperties, state } from "../state.js";
import { ACTIONS, ensureQuoteRequestSchema } from "../actions.js";
import { ActionButton } from "../components/primitives/ActionButton.js";
import { ErrorState } from "../components/primitives/ErrorState.js";
import { skel } from "../components/primitives/RouteStates.js";
import { PendingNote } from "../components/proposals/ContractStates.js";
import { LocationMap, placeEach } from "../components/storm/PropertyMap.js";
import { icon } from "../components/storm/overview-icons.js";
import { formatArea } from "../normalizers/overview.js";
import { addressRepeats } from "../normalizers/postal-address.js";
import { mapViewport, sharedPropertyMap } from "../property-map-session.js";
import { attachAddressSuggestions } from "../address-suggestions.js";
import { acceptQuoteAddress, addressFinder, changeQuoteRequestDraft, quoteRequestBusy, quoteRequestState } from "../quote-request.js";

var PROGRESS = {
  sending: "Sending your request…",
  waiting: "Request sent. Waiting for our system to pick it up…",
  processing: "We’re checking your properties and preparing quote drafts…",
};

export function QuoteRequest() {
  var request = quoteRequestState();
  var page = h("section", { "class": "page page--narrow quote-request", "data-route": "quote.new", "data-visual-id": "quote-request", "data-state": request.phase });
  page.appendChild(h("div", { "class": "detail-back", "data-action": "proposal.review", "data-visual-id": "quote-request-back" }, "‹ Back to your contracts"));
  if (request.phase === "accepted") {
    page.appendChild(RequestOutcome("accepted", "Request received", "A manager prepares your quotes. When they’re ready, they arrive by email and appear in Contracts, where you can approve them, decline them or ask for changes."));
    return page;
  }
  if (request.phase === "slow" || (request.phase === "checking" && request.formId)) {
    page.appendChild(RequestOutcome("slow", "We’re still working on your request", "It’s taking longer than usual. You don’t need to send it again: a manager prepares your quotes, and they arrive by email and appear in Contracts.", request.phase === "checking"));
    return page;
  }

  page.appendChild(h("div", { "class": "prop-head", "data-module": "quote-request-head" }, [
    h("div", { style: "flex:1;min-width:0" }, [
      h("h1", { "class": "prop-head__title" }, "Request a quote"),
      h("div", { "class": "prop-head__addr" }, "Choose your properties or add a new address. We prepare per-visit, monthly and seasonal options for each."),
    ]),
  ]));

  var loaded = ensureQuoteRequestSchema();
  if (!loaded || loaded.state === "loading") {
    page.appendChild(RequestSkeleton());
    return page;
  }
  if (loaded.state === "error") {
    var failed = ErrorState({ title: "The quote request couldn’t be loaded", desc: "Nothing was sent. Check your connection and try again." });
    var retry = failed.querySelector("[data-action]");
    if (retry) retry.setAttribute("data-action", "quoteRequest.retry");
    page.appendChild(failed);
    return page;
  }

  var schema = loaded.schema;
  var busy = quoteRequestBusy();
  page.appendChild(PropertiesSection(request, schema, busy));
  var details = DetailsSection(request, schema, busy);
  if (details) page.appendChild(details);
  if (request.message) {
    page.appendChild(h("div", { "class": "inline-fail quote-request__message", "data-module": "quote-request-message", role: "alert" }, [
      h("span", { "class": "inline-fail__icon", "aria-hidden": "true" }, "!"),
      h("div", { "class": "decision-outcome__body" }, request.message),
    ]));
  }
  page.appendChild(busy ? Progress(request) : Submit(request));
  return page;
}

function PropertiesSection(request, schema, busy) {
  var envelope = state.moduleData.properties;
  var properties = liveProperties();
  var section = h("section", { "class": "card card--pad quote-request__section", "data-module": "quote-request-properties", "aria-labelledby": "quote-request-properties-title" }, [
    h("h2", { "class": "agreement-card__title", id: "quote-request-properties-title" }, "Properties"),
  ]);
  if (!envelope || envelope.state === "loading") {
    section.appendChild(h("div", { "class": "quote-request__properties", "aria-busy": "true" }, [skel("height:64px;border-radius:14px"), skel("height:64px;border-radius:14px")]));
  } else if (envelope.state !== "ready") {
    section.appendChild(h("p", { "class": "contract-form__note" }, "Your properties couldn’t be loaded. You can still add an address."));
  } else if (properties.length) {
    section.appendChild(h("div", { "class": "quote-request__properties", role: "group", "aria-label": "Your properties" }, properties.map(function (property) {
      return PropertyChoice(property, request.draft.propertyIds.indexOf(property.backendId) !== -1, busy);
    })));
  }
  if (request.errors.PROPERTY_IDS) section.appendChild(h("div", { "class": "field-error", id: "quote-request-properties-error", role: "alert" }, request.errors.PROPERTY_IDS));

  if (request.draft.addresses.length) {
    section.appendChild(h("ul", { "class": "quote-request__addresses", "aria-label": "New addresses" }, request.draft.addresses.map(function (entry, index) {
      return h("li", { "class": "quote-request__address", "data-module": "quote-request-address" }, [
        h("span", { "class": "quote-request__address-icon", "aria-hidden": "true" }, [icon("pin", "ov-icon")]),
        h("span", { "class": "quote-request__address-text" }, entry.address),
        h("button", { "class": "link-action", type: "button", "data-action": "quoteRequest.removeAddress", "data-id": String(index), "aria-label": "Remove " + entry.address, disabled: busy ? true : undefined }, "Remove"),
      ]);
    })));
  }
  section.appendChild(AddressField(request, schema, busy, properties.length > 0));
  var map = RequestMap(request, properties);
  if (map) section.appendChild(map);
  return section;
}

function PropertyChoice(property, chosen, busy) {
  var address = property.address && property.address !== property.name && !addressRepeats(property.name, property.address) ? property.address : "";
  var meta = [address, formatArea(property.areaSqft)].filter(Boolean).join(" · ");
  return h("button", {
    "class": "quote-request__property",
    type: "button",
    role: "checkbox",
    "aria-checked": chosen ? "true" : "false",
    "aria-describedby": state.quoteRequest.errors.PROPERTY_IDS ? "quote-request-properties-error" : undefined,
    "data-action": "quoteRequest.toggleProperty",
    "data-id": String(property.backendId),
    "data-module": "quote-request-property",
    "data-state": chosen ? "selected" : "idle",
    disabled: busy ? true : undefined,
  }, [
    h("span", { "class": "quote-request__check", "aria-hidden": "true" }, chosen ? "✓" : ""),
    h("span", { "class": "quote-request__property-body" }, [
      h("span", { "class": "quote-request__property-name" }, property.name),
      meta ? h("span", { "class": "quote-request__property-meta" }, meta) : null,
    ]),
  ]);
}

function AddressField(request, schema, busy, hasProperties) {
  var error = request.errors.PROPERTY_ADDRESSES;
  var checking = request.addressCheck === "checking";
  var finder = addressFinder();
  var input = h("input", {
    "class": "field",
    id: "quote-request-address",
    name: "PROPERTY_ADDRESSES",
    type: "text",
    autocomplete: finder ? "off" : "street-address",
    value: request.draft.pendingAddress || "",
    placeholder: "Street address",
    "data-quote-request-input": "address",
    "data-state": error ? "invalid" : undefined,
    "aria-invalid": error ? "true" : undefined,
    "aria-describedby": error ? "quote-request-address-error" : undefined,
    disabled: busy || checking ? true : undefined,
    spellcheck: "false",
  });
  input.addEventListener("input", function () { changeQuoteRequestDraft("pendingAddress", input.value); });
  input.addEventListener("keydown", function (event) {
    if (event.defaultPrevented || event.key !== "Enter" || input.getAttribute("aria-activedescendant")) return;
    event.preventDefault();
    ACTIONS["quoteRequest.addAddress"]();
  });
  var anchor = h("div", { "class": "prop-edit__field quote-request__address-input" }, [input]);
  if (finder && !busy && !checking) {
    attachAddressSuggestions(input, anchor, {
      finder: finder,
      within: schema.within,
      pick: function (item) {
        changeQuoteRequestDraft("pendingAddress", item.label);
        Promise.resolve(item.place()).then(function (place) {
          if (!acceptQuoteAddress(place.address, place.point)) changeQuoteRequestDraft("pendingAddress", place.address);
          ACTIONS["quoteRequest.refresh"]();
        });
      },
    });
  }
  return h("div", { "class": "field-row quote-request__address-field" }, [
    h("label", { "class": "field-label", "for": "quote-request-address" }, hasProperties ? "Add another address" : "Property address"),
    h("div", { "class": "quote-request__address-row" }, [
      anchor,
      ActionButton({ variant: "btn--ghost", label: checking ? "Checking…" : "Add", action: "quoteRequest.addAddress", disabled: busy || checking, visualId: "quote-request-add-address" }),
    ]),
    error ? h("div", { "class": "field-error", id: "quote-request-address-error", role: "alert" }, error) : null,
  ]);
}

function RequestMap(request, properties) {
  var map = sharedPropertyMap();
  var viewport = mapViewport();
  if (!map || !viewport || map.status() === "failed") return null;
  var chosen = properties.filter(function (property) { return request.draft.propertyIds.indexOf(property.backendId) !== -1; });
  var located = request.draft.addresses.filter(function (entry) { return !!entry.point; });
  if (!chosen.length && !located.length) return null;
  var places = chosen.map(function (property) { return { id: property.id, name: property.name }; })
    .concat(located.map(function (entry, index) { return { id: "quote-request-address-" + index, name: entry.address, color: "var(--warn)" }; }));
  var placements = placeEach(map, chosen).concat(located.map(function (entry) { return { point: entry.point, reason: "stored" }; }));
  return h("div", { "class": "ov-map__stage quote-request__map", "data-module": "quote-request-map", "data-visual-id": "quote-request-map", "data-surface": "google" }, [
    LocationMap(map, viewport, places, placements, "Finding these properties on the map…"),
  ]);
}

function DetailsSection(request, schema, busy) {
  var risks = schema.risks.length ? h("fieldset", { "class": "quote-request__risks", "data-module": "quote-request-risks" }, [
    h("legend", { "class": "field-label" }, schema.riskLabel || "Winter risk factors"),
    h("div", { "class": "choice-chips" }, schema.risks.map(function (option) {
      var input = h("input", { "class": "choice-chip__input", type: "checkbox", name: "RISK_FACTORS", value: option.value, checked: request.draft.risks.indexOf(option.value) !== -1 ? true : undefined, disabled: busy ? true : undefined, "data-quote-request-risk": option.value });
      input.addEventListener("change", function () { changeQuoteRequestDraft("risk", option.value); });
      return h("label", { "class": "choice-chip" }, [input, h("span", { "class": "choice-chip__label" }, option.label)]);
    })),
  ]) : null;
  var notes = h("textarea", { "class": "field", id: "quote-request-notes", name: "ADDITIONAL_NOTES", rows: String(schema.notesRows), disabled: busy ? true : undefined, "data-quote-request-input": "notes" }, request.draft.notes || "");
  notes.addEventListener("input", function () { changeQuoteRequestDraft("notes", notes.value); });
  return h("section", { "class": "card card--pad quote-request__section", "data-module": "quote-request-details", "aria-label": "Site details" }, [
    risks,
    h("div", { "class": "field-row" }, [
      h("label", { "class": "field-label", "for": "quote-request-notes" }, (schema.notesLabel || "Additional notes") + " (optional)"),
      notes,
    ]),
  ]);
}

function Submit(request) {
  var counts = [];
  if (request.draft.propertyIds.length) counts.push(request.draft.propertyIds.length + (request.draft.propertyIds.length === 1 ? " property" : " properties"));
  if (request.draft.addresses.length) counts.push(request.draft.addresses.length + (request.draft.addresses.length === 1 ? " new address" : " new addresses"));
  return h("div", { "class": "quote-request__submit", "data-module": "quote-request-submit" }, [
    counts.length ? h("span", { "class": "quote-request__summary" }, counts.join(" and ")) : null,
    ActionButton({ variant: "btn--primary", label: "Request quotes", action: "quoteRequest.submit", lg: true, disabled: request.addressCheck === "checking", visualId: "quote-request-submit" }),
  ]);
}

function Progress(request) {
  return h("div", { "class": "card card--pad quote-request__progress", "data-module": "quote-request-progress", "data-state": request.phase, "aria-live": "polite" }, [
    PendingNote(PROGRESS[request.phase] || PROGRESS.sending),
    request.phase === "sending" ? null : h("p", { "class": "contract-form__note" }, "This can take a few minutes, especially for new addresses. You can leave this page: your quotes will appear in Contracts and we’ll email you when they’re ready."),
  ]);
}

function RequestOutcome(kind, title, body, checking) {
  return h("div", { "class": "state-block quote-request__outcome", "data-module": "quote-request-outcome", "data-state": kind, role: "status", tabindex: "-1" }, [
    h("div", { "class": "state-block__glyph" + (kind === "accepted" ? " quote-request__glyph--ok" : "") }, kind === "accepted" ? "✓" : "◔"),
    h("h1", { "class": "state-block__title" }, title),
    h("div", { "class": "state-block__desc" }, body),
    h("div", { "class": "proposal-actions quote-request__outcome-actions" }, [
      ActionButton({ variant: "btn--primary", label: "Go to Contracts", action: "nav.go", id: "proposals.list", visualId: "quote-request-contracts" }),
      kind === "slow" ? ActionButton({ variant: "btn--ghost", label: checking ? "Checking…" : "Check again", action: "quoteRequest.checkAgain", disabled: checking, visualId: "quote-request-check-again" }) : null,
    ]),
  ]);
}

function RequestSkeleton() {
  return h("div", { "data-module": "quote-request-loading", "data-state": "loading", "aria-busy": "true" }, [
    skel("height:180px;border-radius:22px;margin-bottom:16px"),
    skel("height:160px;border-radius:22px"),
  ]);
}

(function (global) {
  "use strict";

  var ns = global.ClientReview || (global.ClientReview = {});

  var ACCOUNT_ID = 694;
  var AGREEMENT_ID = 5205;
  var ACCOUNT_TYPE = { id: 2, code: "SNOW_COMMERCIAL_CUSTOMER", nls: { en: { NAME: "Commercial customer" } } };
  var ORDER_TYPE = { id: 5, code: "FIELD_SERVICE_ORDER" };
  var CURRENCY = { id: 3, code: "CAD" };
  var PRICE_TYPES = { SEASONAL: { id: 6, code: "TIERED_RECURRENT" }, MONTHLY: { id: 6, code: "TIERED_RECURRENT" }, PER_SERVICE: { id: 5, code: "TIERED" } };

  var PRODUCTS = {
    snow: { id: 25, nls: { en: { NAME: "Snow Removal" } } },
    rockSalt: { id: 31, nls: { en: { NAME: "Rock Salt De-Icing" } } },
    iceMelt: { id: 32, nls: { en: { NAME: "Ice Melt De-Icing" } } },
    atv: { id: 40, nls: { en: { NAME: "ATV / UTV, hourly" } } },
  };

  var ADDRESSES = {
    278: "1180 Pacific Crescent, Vancouver, BC V6Z 2R5",
    430: "4620 Garden City Way, Richmond, BC V6X 2W6",
    512: "9150 Cedar Hollow Drive, Surrey, BC V3V 7K2",
    661: "",
    702: "220 Lonsdale Quay Road, North Vancouver, BC V7M 3K9",
  };

  var ORDERS = [
    { id: 3101, property: 278, model: "SEASONAL", state: "QUOTE_SENT", charges: 8750, taxes: 437.5, grand: 9187.5, lines: [[1, "snow", 1, 1400], [2, "rockSalt", 1, 7350]] },
    { id: 3102, property: 278, model: "MONTHLY", state: "QUOTE_VIEWED", charges: 8750, taxes: 437.5, grand: 9187.5, lines: [[3, "snow", 5, 280], [4, "rockSalt", 5, 1470]] },
    { id: 3103, property: 278, model: "PER_SERVICE", state: "QUOTE_VIEWED", charges: 595, taxes: 29.75, grand: 624.75, lines: [[5, "snow", 1, 350], [6, "rockSalt", 1, 245]] },
    { id: 3104, property: 430, model: "SEASONAL", state: "CLIENT_APPROVED", charges: 10200, taxes: 510, grand: 10710, lines: [[7, "snow", 1, 1750], [8, "iceMelt", 1, 8450]] },
    { id: 3105, property: 430, model: "PER_SERVICE", state: "DECLINED", charges: 631.75, taxes: 31.59, grand: 663.34, lines: [[9, "snow", 1, 350], [10, "iceMelt", 1, 281.75]] },
    { id: 3106, property: 512, model: "SEASONAL", state: "CUSTOMER_CHANGES_REQUESTED", charges: 3240, taxes: 162, grand: 3402, lines: [[11, "snow", 1, 2100], [12, "atv", 12, 95]] },
    { id: 3107, property: 512, model: "MONTHLY", state: "QUOTE_VIEWED", charges: 3240, taxes: 162, grand: 3402, lines: [[13, "snow", 5, 420], [14, "atv", 12, 95]] },
    { id: 3108, property: 661, model: "", state: "QUOTE_SENT", grand: 288.75, lines: [[15, "snow", 1, 275]] },
    { id: 3109, property: 702, model: "SEASONAL", state: "DECLINED", charges: 1400, taxes: 70, grand: 1470, lines: [[16, "snow", 1, 1400]] },
    { id: 3110, property: 702, model: "MONTHLY", state: "DECLINED", charges: 1400, taxes: 70, grand: 1470, lines: [[17, "snow", 5, 280]] },
  ];

  var TERMS = [
    "<h2>1. Services</h2>",
    "<p>The Provider clears snow and applies de-icing material at each property listed in this agreement, under the option approved for that property.</p>",
    "<h2>2. Service triggers</h2>",
    "<p>Snow removal starts once accumulation reaches 5 cm. De-icing is applied when the surface temperature is forecast at or below 0 °C.</p>",
    "<h2>3. Invoicing</h2>",
    "<ul><li>Seasonal options are invoiced once, at the start of the term.</li>",
    "<li>Monthly options are invoiced on the first day of each month of the term.</li>",
    "<li>Per-service options are invoiced after each visit.</li></ul>",
    "<h2>4. Access</h2>",
    "<p>The Client keeps each property accessible and tells the Provider about obstacles such as parked vehicles or construction work.</p>",
  ].join("");

  var NUMBERED_TERMS = [
    "1. Services",
    "The Provider clears snow and applies de-icing material at each property listed in this agreement, under the option approved for that property.",
    "",
    "2. Service triggers",
    "2.1 Snow removal starts once accumulation reaches 5 cm.",
    "2.2 De-icing is applied when the surface temperature is forecast at or below 0 °C,",
    "including overnight frost on walkways and ramps.",
    "",
    "3. Invoicing",
    "3.1) Seasonal options are invoiced once, at the start of the term.",
    "3.2) Monthly options are invoiced on the first day of each month of the term.",
    "3.3) Per-service options are invoiced after each visit.",
    "",
    "4. Access",
    "The Client keeps each property accessible and tells the Provider about obstacles:",
    "- parked vehicles;",
    "- construction work.",
    "",
    "5. Term and notice",
    "5.1. This agreement runs from the term start date to the term end date.",
    "5.1.1 Either party may end it early with 30 days' written notice.",
  ].join("\n");

  var ACCOUNT_PREFILL = {
    BILLING_ADDRESS: "1500 Harbour Green Drive, Suite 210, Vancouver, BC V6C 3T8, Canada",
    REPRESENTATIVE_FIRST_NAME: "Dana",
    REPRESENTATIVE_LAST_NAME: "Reyes",
    REPRESENTATIVE_JOB_TITLE: "Property Manager",
    REPRESENTATIVE_EMAIL: "dana.reyes@harbourview.example",
    REPRESENTATIVE_PHONE: "+1 604 555 0164",
  };

  var PORTAL_URL = "https://portal.coastline-winter.example/sign-in";

  var PROVIDER_CONTACT = { phone: "+1 604 555 0199", email: "service@coastline-winter.example" };
  var LOGO_ID = "5b1f0c2e-6a4d-4c3b-9f0e-2d7a8c1b3e90";
  var LOGO_IMAGE = "data:image/svg+xml;charset=utf-8," + encodeURIComponent([
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 330 76'>",
    "<rect x='2' y='8' width='60' height='60' rx='14' fill='#0e8fc4'/>",
    "<path d='M32 20v36M16.4 29l31.2 18M16.4 47l31.2-18' stroke='#fff' stroke-width='5' stroke-linecap='round' fill='none'/>",
    "<text x='76' y='37' font-family='Arial,Helvetica,sans-serif' font-size='25' font-weight='700' fill='#0b2a4a'>COASTLINE</text>",
    "<text x='76' y='60' font-family='Arial,Helvetica,sans-serif' font-size='16' font-weight='700' fill='#0e8fc4' letter-spacing='1.6'>WINTER SERVICES</text>",
    "</svg>",
  ].join(""));

  var PLAN_CENTERS = {
    278: { lat: 49.2731, lng: -123.1252 },
    430: { lat: 49.1752, lng: -123.1305 },
  };

  var PLAN_IDS = {
    278: "3f5d2c4e-8a1b-4c7d-9e2f-6a0b1c2d3e4f",
    430: "7c9e1a2b-3d4f-4a5b-8c6d-0e1f2a3b4c5d",
    broken: "0b7d6c5e-4f3a-4b2c-9d1e-8f7a6b5c4d3e",
  };

  var BILLING_PLACE = { lat: 49.2888, lng: -123.1193 };

  function placed(center) {
    var latPerMeter = 1 / 111320;
    var lngPerMeter = latPerMeter / Math.cos(center.lat * Math.PI / 180);
    return function (east, north) {
      return [center.lng + east * lngPerMeter, center.lat + north * latPerMeter, 12.5];
    };
  }

  function ring(at, corners) {
    var points = corners.map(function (corner) { return at(corner[0], corner[1]); });
    return points.concat([points[0]]);
  }

  function planElement(id, type, name, overlays) {
    return { id: id, elementTypeDictionaryId: type, label: name, nls: { en: { NAME: name } }, attributes: {}, overlays: overlays };
  }

  function mapOverlay(geometry) {
    return { map: "GOOGLE_MAPS", geometry: geometry };
  }

  function strataPlan() {
    var at = placed(PLAN_CENTERS[278]);
    return {
      type: "PropertyPlan",
      schemaVersion: 1,
      backgrounds: [{ map: "GOOGLE_MAPS", center: at(0, 0), zoom: 19, address: ADDRESSES[278] }],
      elements: [
        planElement("main-driveway", 83120, "Main driveway", [mapOverlay({ type: "Polygon", coordinates: [ring(at, [[-6, -30], [6, -30], [6, 10], [-6, 10]])] })]),
        planElement("front-sidewalk", 83118, "Front sidewalk", [mapOverlay({ type: "Polygon", coordinates: [ring(at, [[-40, -35], [40, -35], [40, -32], [-40, -32]])] })]),
        planElement("visitor-parking", 83119, "Visitor parking", [mapOverlay({ type: "Polygon", coordinates: [ring(at, [[9, -14], [38, -14], [38, 14], [9, 14]])] })]),
        planElement("loading-apron", 83120, "Loading bay apron", [mapOverlay({ type: "Polygon", coordinates: [ring(at, [[-38, -14], [-10, -14], [-10, 4], [-38, 4]])] })]),
        planElement("fire-lane", 83121, "Fire lane edge", [mapOverlay({ type: "LineString", coordinates: [at(-6, 10), at(-6, 28), at(22, 28)] })]),
        planElement("salt-bin", 83122, "Salt bin", [mapOverlay({ type: "Point", coordinates: at(11, -27) })]),
      ],
    };
  }

  function retailPlan() {
    var at = placed(PLAN_CENTERS[430]);
    return {
      type: "PropertyPlan",
      schemaVersion: 1,
      backgrounds: [{ map: "GOOGLE_MAPS", center: at(0, 0), zoom: 19 }],
      elements: [
        planElement("customer-parking", 83119, "Customer parking", [mapOverlay({ type: "MultiPolygon", coordinates: [
          [ring(at, [[-44, -24], [-8, -24], [-8, 18], [-44, 18]])],
          [ring(at, [[8, -24], [44, -24], [44, 18], [8, 18]]), ring(at, [[20, -6], [30, -6], [30, 4], [20, 4]])],
        ] })]),
        planElement("entrance-walkway", 83118, "Entrance walkway", [mapOverlay({ type: "Polygon", coordinates: [ring(at, [[-8, 18], [8, 18], [8, 30], [-8, 30]])] })]),
        planElement("turnaround", 83120, "Delivery turnaround", [mapOverlay({ type: "Circle", coordinates: at(0, -34), radius: 9 })]),
        planElement("storefront-photo", 83123, "Storefront photo marker", [{ mediaId: "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d", geometry: { type: "Point", coordinates: [120, 40] } }]),
      ],
    };
  }

  function brokenPlan() {
    return {
      type: "PropertyPlan",
      schemaVersion: 1,
      elements: [planElement("photo-only", 83123, "Photo only", [{ mediaId: "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d", geometry: { type: "Point", coordinates: [10, 10] } }])],
    };
  }

  var PLAN_FILES = {};
  PLAN_FILES[PLAN_IDS[278]] = strataPlan();
  PLAN_FILES[PLAN_IDS[430]] = retailPlan();
  PLAN_FILES[PLAN_IDS.broken] = brokenPlan();

  var PLACES = {};
  PLACES["1500 Harbour Green Drive, Suite 210, Vancouver, BC V6C 3T8, Canada"] = BILLING_PLACE;
  PLACES["1500 Harbour Green Drive, Vancouver, BC V6C 3T8, Canada"] = BILLING_PLACE;
  PLACES["1500 West Georgia Street, Vancouver, BC V6G 2Z6, Canada"] = { lat: 49.2918, lng: -123.1335 };
  PLACES[ADDRESSES[278]] = PLAN_CENTERS[278];
  PLACES[ADDRESSES[430]] = PLAN_CENTERS[430];
  PLACES[ADDRESSES[512]] = { lat: 49.1893, lng: -122.8421 };

  var QUOTATION_EVENTS = [
    "QUOTE_SENT-QUOTE_VIEWED",
    "QUOTE_VIEWED-CLIENT_APPROVED",
    "QUOTE_VIEWED-DECLINED",
    "QUOTE_VIEWED-CUSTOMER_CHANGES_REQUESTED",
  ];

  var SCENARIOS = [
    { id: "quote-review", label: "Quote review — every property status" },
    { id: "loading", label: "Loading" },
    { id: "link-missing", label: "Link incomplete — no token" },
    { id: "link-closed", label: "Link expired or revoked — 401" },
    { id: "unconfigured", label: "Not set up — no API base" },
    { id: "empty", label: "Valid link, nothing to show" },
    { id: "error", label: "Load error — retry recovers" },
    { id: "partial", label: "Partial data — one option unreadable" },
    { id: "quote-price-labels", label: "Quote review — options named from their prices, no PRICING_MODEL" },
    { id: "link-copied", label: "Copy link — copied on the contract details step" },
    { id: "link-copy-failed", label: "Copy link — the browser refused to copy" },
    { id: "contact-phone-only", label: "Contact us — the provider shows a phone and no email" },
    { id: "contact-none", label: "Contact us — the provider shows neither, no block" },
    { id: "option-open", label: "Option open — lines, total, decisions" },
    { id: "view-pending", label: "Unviewed option opened — view event pending" },
    { id: "view-failed", label: "Unviewed option opened — view event failed" },
    { id: "approve-confirm", label: "Approve — confirmation" },
    { id: "changes-invalid", label: "Request changes — message required" },
    { id: "decline-all-confirm", label: "Decline all options — confirmation" },
    { id: "decline-all-done", label: "Decline all options — sent, every option declined" },
    { id: "command-pending", label: "Decision pending" },
    { id: "command-refused", label: "Decision refused by the server" },
    { id: "command-failed", label: "Decision failed" },
    { id: "command-stale-pending", label: "Decision accepted, readback still shows the option undecided — pending" },
    { id: "command-unconfirmed", label: "Decision accepted, change not seen within the budget — Refresh status" },
    { id: "view-unconfirmed", label: "Option opened, view accepted but not seen within the budget — Refresh status" },
    { id: "decided", label: "Every property decided — link opened, provider not done yet" },
    { id: "decided-following", label: "Last decision sent here — next step being opened" },
    { id: "decided-following-slow", label: "Last decision sent here — next step taking longer, Check again" },
    { id: "decided-next-step", label: "Last decision sent here — details step opens on its own" },
    { id: "contract-details", label: "Contract details — pre-filled from the account" },
    { id: "contract-details-attributes", label: "Contract details — contacts and addresses as ids, pre-filled from Account attributes" },
    { id: "contract-details-ids-only", label: "Contract details — contacts and addresses as ids, no Account attributes" },
    { id: "contract-details-billing-service", label: "Contract details — billing address taken from a service address" },
    { id: "contract-details-maps", label: "Contract details — Maps key set: billing address on a map, each approved property's plan" },
    { id: "contract-details-address-missing", label: "Contract details — Maps key set: billing address not found on the map" },
    { id: "contract-details-plan-unavailable", label: "Contract details — Maps key set: a property's plan cannot be read" },
    { id: "contract-details-maps-failed", label: "Contract details — Maps key set, the map service does not load" },
    { id: "details-invalid", label: "Contract details — validation errors" },
    { id: "details-refused", label: "Contract details — refused per field" },
    { id: "details-checking", label: "Contract details sent — being checked (CLIENT_DETAILS_RECEIVED)" },
    { id: "details-checking-slow", label: "Contract details check — taking longer than usual" },
    { id: "details-returned", label: "Contract details returned, link reopened — fields to fix" },
    { id: "details-returned-attributes", label: "Contract details returned, link reopened — pre-filled from Account attributes" },
    { id: "details-returned-processing", label: "Contract details returned, link reopened — provider could not save them" },
    { id: "details-returned-unknown", label: "Contract details returned, link reopened — reason not shown" },
    { id: "details-returned-sent", label: "Contract details returned after sending here — provider could not save them" },
    { id: "details-stale-checking", label: "Details sent over an old return, readback still shows it — checking" },
    { id: "details-stale-slow", label: "Details sent over an old return, no newer read within the budget — slow check" },
    { id: "details-stale-closed", label: "Details sent over an old return, stale readback, then checked and closed" },
    { id: "details-closed", label: "Contract details sent — checked, link closed" },
    { id: "preparing", label: "Agreement being prepared — DRAFT" },
    { id: "agreement-review", label: "Agreement review — SENT_TO_CLIENT" },
    { id: "agreement-numbered-terms", label: "Agreement review — numbered contract terms" },
    { id: "agreement-no-terms", label: "Agreement review — no contract terms written" },
    { id: "agreement-no-logo", label: "Agreement review — the provider has no logo" },
    { id: "agreement-confirm", label: "Agreement approval — confirmation" },
    { id: "agreement-unconfirmed", label: "Agreement approval accepted, change not seen within the budget — Refresh status" },
    { id: "agreement-changes", label: "Agreement — request changes, the form" },
    { id: "agreement-changes-invalid", label: "Agreement — request changes, message required" },
    { id: "agreement-changes-pending", label: "Agreement — request changes, being sent" },
    { id: "agreement-changes-refused", label: "Agreement — request changes, refused by the server" },
    { id: "agreement-changes-sent", label: "Agreement — request changes sent here, thanks" },
    { id: "agreement-changes-requested", label: "Agreement — changes already requested (CLIENT_CHANGES_REQUESTED)" },
    { id: "agreement-approval-only", label: "Agreement — a link issued before change requests, approval only" },
    { id: "approval-closed", label: "Agreement approved — link closed, portal invitation" },
    { id: "completion", label: "Completion — CLIENT_APPROVED, no portal address" },
    { id: "completion-portal", label: "Completion — ACTIVE, portal address configured" },
    { id: "completion-finishing", label: "Completion — ACTIVATION_FAILED, no primary email in the link" },
    { id: "completion-attributes", label: "Completion — CLIENT_APPROVED, sign-in email from Account attributes" },
    { id: "link-closed-portal", label: "Link expired or revoked — portal address configured" },
    { id: "reference-expired", label: "Expired agreement — read only" },
    { id: "closed-canceled", label: "Canceled — closed" },
    { id: "unavailable", label: "Send failed — unavailable" },
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function orderRow(spec) {
    var attributes = { CLIENT: { value: ACCOUNT_ID }, SERVICE_PROPERTY: { value: spec.property } };
    if (ADDRESSES[spec.property]) attributes.SERVICE_ADDRESS = { value: ADDRESSES[spec.property] };
    if (spec.model) attributes.PRICING_MODEL = { value: spec.model };
    var row = {
      id: spec.id,
      type: ORDER_TYPE,
      currency: CURRENCY,
      states: [{ code: spec.state }],
      attributes: { 5: attributes },
      grandTotal: spec.grand,
      items: spec.lines.map(function (entry, index) {
        return {
          id: entry[0],
          sortOrder: index,
          itemCount: entry[2],
          amount: entry[3],
          itemPrice: { id: entry[0], product: PRODUCTS[entry[1]], type: PRICE_TYPES[spec.model] },
        };
      }),
    };
    if (spec.charges !== undefined) row.totalCharges = spec.charges;
    if (spec.taxes !== undefined) row.totalTaxes = spec.taxes;
    return row;
  }

  function accountRow(withUser) {
    var row = {
      id: ACCOUNT_ID,
      code: "ACC-694",
      nls: { en: { NAME: "Harbourview Strata Corporation" } },
      type: clone(ACCOUNT_TYPE),
      attributes: { 2: { MANAGEMENT_COMPANY: { value: "Lionsgate Property Management" } } },
      contacts: [{
        firstName: "Dana",
        middleName: null,
        lastName: "Reyes",
        title: "PROPERTY_MANAGER",
        type: { code: "PRIMARY", nls: { en: { NAME: "Primary" } } },
        contactEntries: [
          { value: "dana.reyes@harbourview.example", kind: { code: "WORK" }, type: { code: "EMAIL" } },
          { value: "+1 604 555 0164", kind: { code: "WORK" }, type: { code: "PHONE" } },
        ],
      }],
      addresses: [
        {
          address: {
            address1: "1500 Harbour Green Drive",
            address2: "Suite 210",
            city: "Vancouver",
            postalCode: "V6C 3T8",
            state: { code: "BC", nls: { en: { NAME: "British Columbia" } } },
            country: { nls: { en: { NAME: "Canada" } } },
          },
          types: [{ code: "BILLING", nls: { en: { NAME: "Billing" } } }],
        },
        {
          address: {
            address1: "1180 Pacific Crescent",
            city: "Vancouver",
            postalCode: "V6Z 2R5",
            state: { code: "BC", nls: { en: { NAME: "British Columbia" } } },
            country: { nls: { en: { NAME: "Canada" } } },
          },
          types: [{ code: "SERVICE", nls: { en: { NAME: "Service" } } }],
        },
      ],
    };
    if (withUser) row.user = { id: 29 };
    return row;
  }

  function agreementRow(state, orderIds, withSnapshot) {
    var attributes = {
      CLIENT: { value: ACCOUNT_ID },
      ORDERS: { value: orderIds.slice() },
      TERM_START_DATE: { value: "2026-11-01" },
      TERM_END_DATE: { value: "2027-03-31" },
      PROVIDER_CONTACT_PHONE: { value: PROVIDER_CONTACT.phone },
      PROVIDER_CONTACT_EMAIL: { value: PROVIDER_CONTACT.email },
      PROVIDER_LOGO: { value: LOGO_ID },
    };
    if (withSnapshot) {
      attributes.EFFECTIVE_DATE = { value: "2026-10-20" };
      attributes.LEGAL_NAME = { value: "Harbourview Strata Corporation" };
      attributes.CLIENT_TYPE = { value: "ORGANIZATION" };
      attributes.BILLING_ADDRESS = { value: "1500 Harbour Green Drive, Suite 210, Vancouver, BC V6C 3T8, Canada" };
      attributes.REPRESENTATIVE_FIRST_NAME = { value: "Dana" };
      attributes.REPRESENTATIVE_LAST_NAME = { value: "Reyes" };
      attributes.REPRESENTATIVE_JOB_TITLE = { value: "Strata Council President" };
      attributes.REPRESENTATIVE_EMAIL = { value: "dana.reyes@harbourview.example" };
      attributes.REPRESENTATIVE_PHONE = { value: "+1 604 555 0164" };
      attributes.PROVIDER_LEGAL_NAME = { value: "Coastline Winter Services Ltd." };
      attributes.PROVIDER_REPRESENTATIVE_NAME = { value: "Morgan Ellis" };
      attributes.PROVIDER_REPRESENTATIVE_JOB_TITLE = { value: "Contracts Manager" };
      attributes.CONTRACT_TERMS = { value: TERMS };
    }
    return {
      id: AGREEMENT_ID,
      code: "SA-5205",
      nls: { en: { NAME: "Service agreement 2026–2027" } },
      type: { id: 17, code: "SERVICE_AGREEMENT" },
      organization: { id: 43, code: "COASTLINE_WINTER", nls: { en: { NAME: "Coastline Winter Services" } } },
      states: [{ code: state }],
      attributes: { 17: attributes },
    };
  }

  function grantEvent(code, position) {
    return { id: 400 + position, code: code, nls: { en: { NAME: code } } };
  }

  function quotationGrant() {
    return {
      expiresAt: "2026-10-15T23:59:00",
      types: [
        { entityType: "Account", canRead: true, canWrite: false, events: [] },
        { entityType: "Order", canRead: true, canWrite: false, events: QUOTATION_EVENTS.map(grantEvent) },
        { entityType: "Document", canRead: true, canWrite: false, events: [grantEvent("AWAITING_CLIENT_DETAILS-CLIENT_DETAILS_RECEIVED", 9)] },
      ],
    };
  }

  function agreementGrant() {
    return {
      expiresAt: "2026-11-05T23:59:00",
      types: [
        { entityType: "Account", canRead: true, canWrite: false, events: [] },
        { entityType: "Order", canRead: true, canWrite: false, events: [] },
        { entityType: "Document", canRead: true, canWrite: false, events: [grantEvent("SENT_TO_CLIENT-CLIENT_APPROVED", 12), grantEvent("SENT_TO_CLIENT-CLIENT_CHANGES_REQUESTED", 13)] },
      ],
    };
  }

  function quotationData(agreementState, orderStates) {
    var orders = ORDERS.map(orderRow);
    orders.forEach(function (row) {
      if (orderStates && orderStates[row.id]) row.states = [{ code: orderStates[row.id] }];
    });
    return {
      grant: quotationGrant(),
      accounts: [accountRow(false)],
      documents: [agreementRow(agreementState || "QUOTATION_SENT", ORDERS.map(function (spec) { return spec.id; }), false)],
      orders: orders,
      unreadable: [],
      accountFails: false,
      closed: false,
    };
  }

  var DECIDED = { 3101: "DECLINED", 3102: "CLIENT_APPROVED", 3103: "DECLINED", 3107: "CLIENT_APPROVED", 3108: "CLIENT_APPROVED" };
  var LAST_OPEN = { 3101: "DECLINED", 3102: "CLIENT_APPROVED", 3103: "DECLINED", 3107: "CLIENT_APPROVED" };

  function agreementData(state, withUser) {
    var approved = [3102, 3104, 3107, 3108];
    var orders = ORDERS.filter(function (spec) { return approved.indexOf(spec.id) !== -1; }).map(orderRow);
    orders.forEach(function (row) { row.states = [{ code: "CLIENT_APPROVED" }]; });
    return {
      grant: agreementGrant(),
      accounts: [accountRow(withUser)],
      documents: [agreementRow(state, approved, true)],
      orders: orders,
      unreadable: [],
      accountFails: false,
      closed: false,
    };
  }

  function currentState(row) {
    return row.states && row.states[0] ? row.states[0].code : "";
  }

  function orderAttribute(row, code) {
    var bucket = row.attributes && row.attributes[5];
    return bucket && bucket[code] ? bucket[code].value : undefined;
  }

  function grantAllows(grant, entity, code) {
    return (grant.types || []).some(function (type) {
      return ns.normalizer.entityKind(type.entityType) === entity && (type.events || []).some(function (event) { return event.code === code; });
    });
  }

  function evaluatePackage(data) {
    var agreement = data.documents[0];
    if (!agreement || currentState(agreement) !== "QUOTATION_SENT") return;
    var ids = agreement.attributes[17].ORDERS.value;
    var byProperty = {};
    data.orders.forEach(function (order) {
      if (ids.indexOf(order.id) === -1) return;
      var key = String(orderAttribute(order, "SERVICE_PROPERTY"));
      (byProperty[key] = byProperty[key] || []).push(currentState(order));
    });
    var keys = Object.keys(byProperty);
    var decided = keys.length > 0 && keys.every(function (key) {
      return byProperty[key].indexOf("CLIENT_APPROVED") !== -1 || byProperty[key].every(function (code) { return code === "DECLINED"; });
    });
    if (!decided) return;
    var approved = keys.some(function (key) { return byProperty[key].indexOf("CLIENT_APPROVED") !== -1; });
    agreement.states = [{ code: approved ? "AWAITING_CLIENT_DETAILS" : "CANCELED" }];
  }

  function apply(data, entity, id, code, metadata, hooks) {
    var reviewError = ns.adapter.reviewError;
    var separator = code.indexOf("-");
    var source = code.slice(0, separator);
    var target = code.slice(separator).replace(/^-/, "");
    var rows = entity === "order" ? data.orders : entity === "document" ? data.documents : [];
    var row = rows.filter(function (candidate) { return candidate.id === id; })[0];
    if (!row) throw reviewError("refused", 404, "This record is not available through this link.");
    if (!grantAllows(data.grant, entity, code)) throw reviewError("refused", 403, "This action is not part of this link.");
    if (currentState(row) !== source) throw reviewError("refused", 409, "This record is no longer waiting for that decision.");
    if ((code === "QUOTE_VIEWED-CUSTOMER_CHANGES_REQUESTED" || code === "SENT_TO_CLIENT-CLIENT_CHANGES_REQUESTED") && !String(metadata.MESSAGE || "").trim()) {
      throw reviewError("refused", 400, "", { MESSAGE: "A message is required." });
    }
    row.states = [{ code: target }];
    if (entity === "order") {
      if (target === "CLIENT_APPROVED" && hooks.declineSiblings !== false) {
        data.orders.forEach(function (other) {
          var sameProperty = orderAttribute(other, "SERVICE_PROPERTY") === orderAttribute(row, "SERVICE_PROPERTY");
          if (other.id !== row.id && sameProperty && ["QUOTE_SENT", "QUOTE_VIEWED"].indexOf(currentState(other)) !== -1) {
            other.states = [{ code: "DECLINED" }];
          }
        });
      }
      if ((target === "CLIENT_APPROVED" || target === "DECLINED") && hooks.evaluatePackage !== false) data.pendingEvaluation = { reads: 0 };
    }
    if (entity === "document" && code === "AWAITING_CLIENT_DETAILS-CLIENT_DETAILS_RECEIVED") {
      data.pendingDetails = { metadata: clone(metadata), reads: 0 };
    }
    if (entity === "document" && target === "CLIENT_APPROVED" && hooks.revokeOnApproval === true) data.closed = true;
    if (entity === "document" && target === "CLIENT_CHANGES_REQUESTED" && hooks.revokeOnChanges === true) data.closed = true;
    return null;
  }

  function detailsErrors(metadata) {
    var attributes = ns.contract.contractDetails.attributes;
    var codes = [];
    attributes.forEach(function (attribute) {
      var value = metadata[attribute.code];
      if (attribute.required && attribute.className !== "java.lang.Boolean" && !(typeof value === "string" && value.trim())) codes.push(attribute.code);
    });
    var type = String(metadata.CLIENT_TYPE || "").trim();
    if (type && ["INDIVIDUAL", "ORGANIZATION"].indexOf(type.toUpperCase()) === -1) codes.push("CLIENT_TYPE_INVALID");
    var email = String(metadata.REPRESENTATIVE_EMAIL || "").trim();
    if (email && (email.indexOf("@") === -1 || email.charAt(0) === "@" || email.slice(-1) === "@")) codes.push("REPRESENTATIVE_EMAIL_INVALID");
    attributes.forEach(function (attribute) {
      if (attribute.className === "java.lang.Boolean" && metadata[attribute.code] !== true) codes.push(attribute.code);
    });
    return codes;
  }

  function settleEvaluation(data, hooks) {
    var pending = data.pendingEvaluation;
    if (!pending || hooks.evaluation === "hold") return;
    pending.reads += 1;
    if (pending.reads < 2) return;
    data.pendingEvaluation = null;
    evaluatePackage(data);
  }

  function settleDetails(data, hooks) {
    var pending = data.pendingDetails;
    var outcome = hooks.details || "check";
    if (!pending || outcome === "hold") return;
    pending.reads += 1;
    if (pending.reads < (hooks.settleAfter || 2)) return;
    data.pendingDetails = null;
    var agreement = data.documents[0];
    var bucket = agreement.attributes[17];
    var codes = outcome === "processing-failed" ? ["PROCESSING_FAILED"] : hooks.detailsCodes || detailsErrors(pending.metadata);
    if (codes.length) {
      bucket.CLIENT_DETAILS_ERRORS = { value: codes.join(",") };
      agreement.states = [{ code: "AWAITING_CLIENT_DETAILS" }];
      return;
    }
    Object.keys(pending.metadata).forEach(function (key) { bucket[key] = { value: pending.metadata[key] }; });
    bucket.CLIENT_DETAILS_ERRORS = { value: "" };
    agreement.states = [{ code: "DRAFT" }];
    if (hooks.revokeOnDetails !== false) data.closed = true;
  }

  function createFixtureAdapter(data, behavior) {
    var settings = behavior || {};
    var reviewError = ns.adapter.reviewError;
    var introspectFailures = settings.introspect === "fail-once" ? 1 : 0;
    var stale = { left: 0, snapshot: null };
    var served = data;

    function never() {
      return new Promise(function () {});
    }

    function later(work) {
      return new Promise(function (resolve, reject) {
        function run() {
          try {
            resolve(work());
          } catch (error) {
            reject(error);
          }
        }
        if (settings.delay > 0) global.setTimeout(run, settings.delay);
        else run();
      });
    }

    function guard(source) {
      if (source.closed) throw reviewError("link-closed", 401);
    }

    return {
      imageUrl: function (id) {
        return id === LOGO_ID ? LOGO_IMAGE : "";
      },
      readPlan: function (id) {
        return later(function () {
          var file = PLAN_FILES[id];
          if (!file || (settings.planFails || []).indexOf(id) !== -1) throw reviewError("failed", 404);
          return clone(file);
        });
      },
      introspect: function () {
        if (settings.introspect === "hold") return never();
        return later(function () {
          settleEvaluation(data, settings.hooks || {});
          settleDetails(data, settings.hooks || {});
          served = data;
          if (stale.left > 0) {
            stale.left -= 1;
            served = stale.snapshot;
          }
          guard(served);
          if (settings.introspect === "unauthorized") throw reviewError("link-closed", 401);
          if (introspectFailures > 0) {
            introspectFailures = 0;
            throw reviewError("failed", 503);
          }
          return clone(served.grant);
        });
      },
      list: function (entity) {
        return later(function () {
          guard(served);
          if (entity === "account") {
            if (served.accountFails) throw reviewError("failed", 500);
            return clone(served.accounts);
          }
          if (entity === "document") return clone(served.documents);
          if (entity === "order") return clone(served.orders.filter(function (row) { return served.unreadable.indexOf(row.id) === -1; }));
          throw reviewError("refused", 400);
        });
      },
      get: function (entity, id) {
        return later(function () {
          guard(served);
          var row = entity === "order" ? served.orders.filter(function (candidate) { return candidate.id === id; })[0] : null;
          if (!row || served.unreadable.indexOf(id) !== -1) throw reviewError("refused", 404);
          return clone(row);
        });
      },
      sendEvent: function (entity, id, code, metadata) {
        var rule = (settings.events || {})[code] || { outcome: "accept" };
        if (rule.outcome === "hold") return never();
        return later(function () {
          guard(data);
          if (rule.outcome === "refuse") throw reviewError("refused", 409, rule.message || "", rule.fieldErrors || {});
          if (rule.outcome === "fail") throw reviewError("failed", 502);
          var before = settings.staleReads ? clone(data) : null;
          var result = apply(data, entity, id, code, metadata || {}, settings.hooks || {});
          if (before) {
            stale.snapshot = before;
            stale.left = settings.staleReads;
          }
          return result;
        });
      },
    };
  }

  function withPlans(data, overrides) {
    var references = Object.assign({}, { 278: PLAN_IDS[278], 430: [{ id: PLAN_IDS[430], type: "mediaAsset" }] }, overrides || {});
    data.orders.forEach(function (row) {
      var reference = references[orderAttribute(row, "SERVICE_PROPERTY")];
      if (reference) row.attributes[5].PROPERTY_PLAN = { value: clone(reference) };
    });
    return data;
  }

  var PRICE_NAMES = { 3101: "Seasonal plan", 3102: "Monthly plan" };

  function priceLabelled(data) {
    data.orders.forEach(function (row) {
      delete row.attributes[5].PRICING_MODEL;
      var name = PRICE_NAMES[row.id];
      if (!name) return;
      row.items.forEach(function (line) { line.itemPrice.nls = { en: { NAME: name } }; });
    });
    return data;
  }

  function idOnlyAccount(data) {
    data.accounts.forEach(function (row) {
      row.contacts = [{ id: 901 }];
      row.addresses = [{ id: 902 }];
    });
    return data;
  }

  function attributedAccount(data) {
    var codes = ns.contract.accountPrefill;
    idOnlyAccount(data).accounts.forEach(function (row) {
      var bucket = row.attributes[row.type.id];
      Object.keys(codes).forEach(function (field) { bucket[codes[field]] = { value: ACCOUNT_PREFILL[field] }; });
    });
    return data;
  }

  function returnedData(errors) {
    var data = idOnlyAccount(quotationData("AWAITING_CLIENT_DETAILS", DECIDED));
    data.documents[0].attributes[17].CLIENT_DETAILS_ERRORS = { value: errors };
    return data;
  }

  function mapsStub() {
    var SVG = "http://www.w3.org/2000/svg";
    var DEGREE_METERS = 111320;

    function drawable() {
      return Boolean(global.document) && typeof global.document.createElementNS === "function";
    }

    function svg(tag, attrs) {
      var node = global.document.createElementNS(SVG, tag);
      Object.keys(attrs).forEach(function (name) { node.setAttribute(name, String(attrs[name])); });
      return node;
    }

    function lookup(text) {
      var wanted = String(text || "").trim().toLowerCase();
      var found = null;
      Object.keys(PLACES).forEach(function (address) { if (address.toLowerCase() === wanted) found = PLACES[address]; });
      return found;
    }

    function StubMap(canvas, options) {
      this.canvas = canvas;
      this.options = options || {};
      this.center = this.options.center || { lat: 0, lng: 0 };
      this.zoom = this.options.zoom || 2;
      this.bounds = null;
      this.padding = 0;
      this.overlays = [];
      this.draw();
    }

    StubMap.prototype.setCenter = function (center) {
      this.center = center;
      this.bounds = null;
      this.draw();
    };

    StubMap.prototype.setZoom = function (zoom) {
      this.zoom = zoom;
      this.draw();
    };

    StubMap.prototype.fitBounds = function (bounds, padding) {
      this.bounds = bounds;
      this.padding = padding || 0;
      this.draw();
    };

    StubMap.prototype.attach = function (overlay) {
      if (this.overlays.indexOf(overlay) === -1) this.overlays.push(overlay);
      this.draw();
    };

    StubMap.prototype.detach = function (overlay) {
      var index = this.overlays.indexOf(overlay);
      if (index !== -1) this.overlays.splice(index, 1);
      this.draw();
    };

    StubMap.prototype.frame = function (width, height) {
      if (this.bounds) {
        var middle = (this.bounds.north + this.bounds.south) / 2;
        var shrink = Math.cos(middle * Math.PI / 180);
        var spanX = Math.max((this.bounds.east - this.bounds.west) * shrink, 0.000001);
        var spanY = Math.max(this.bounds.north - this.bounds.south, 0.000001);
        var usableX = Math.max(width - 2 * this.padding, 1);
        var usableY = Math.max(height - 2 * this.padding, 1);
        return { lat: middle, lng: (this.bounds.east + this.bounds.west) / 2, shrink: shrink, scale: Math.min(usableX / spanX, usableY / spanY) };
      }
      var cosine = Math.cos(this.center.lat * Math.PI / 180);
      return { lat: this.center.lat, lng: this.center.lng, shrink: cosine, scale: 256 * Math.pow(2, this.zoom) / 360 / cosine };
    };

    StubMap.prototype.project = function (frame, width, height, point) {
      return [width / 2 + (point.lng - frame.lng) * frame.shrink * frame.scale, height / 2 - (point.lat - frame.lat) * frame.scale];
    };

    StubMap.prototype.draw = function () {
      if (!drawable() || !this.canvas || typeof this.canvas.replaceChildren !== "function") return;
      var self = this;
      var width = this.canvas.clientWidth || 640;
      var height = this.canvas.clientHeight || 260;
      var frame = this.frame(width, height);
      var aerial = this.options.mapTypeId === "hybrid" || this.options.mapTypeId === "satellite";
      var dark = this.options.colorScheme === "DARK";
      var palette = aerial ? { ground: "#4a5544", block: "#3c4637", street: "#6b7263", label: "#e8ecdf" }
        : dark ? { ground: "#202838", block: "#283246", street: "#323d52", label: "#9aa6ba" }
          : { ground: "#eceee9", block: "#e1e5dc", street: "#ffffff", label: "#6c7480" };
      var root = svg("svg", { viewBox: "0 0 " + width + " " + height, width: "100%", height: "100%", "aria-hidden": "true", "data-stub-map": aerial ? "aerial" : "road" });
      root.appendChild(svg("rect", { x: 0, y: 0, width: width, height: height, fill: palette.ground }));
      var step = 132;
      var shiftX = Math.abs(frame.lng * 7919) % 1 * step;
      var shiftY = Math.abs(frame.lat * 6271) % 1 * step;
      for (var x = shiftX - step; x < width; x += step) {
        for (var y = shiftY - step; y < height; y += step) {
          root.appendChild(svg("rect", { x: x + 14, y: y + 14, width: step - 28, height: step - 28, rx: 6, fill: palette.block }));
        }
      }
      for (var column = shiftX - step; column < width; column += step) root.appendChild(svg("rect", { x: column - 7, y: 0, width: 14, height: height, fill: palette.street }));
      for (var row = shiftY - step; row < height; row += step) root.appendChild(svg("rect", { x: 0, y: row - 7, width: width, height: 14, fill: palette.street }));
      this.overlays.forEach(function (overlay) { overlay.paint(root, self, frame, width, height); });
      var caption = svg("text", { x: width - 10, y: height - 10, "text-anchor": "end", "font-size": 11, "font-family": "Manrope, Arial, sans-serif", fill: palette.label });
      caption.textContent = "Preview map, no Google request";
      root.appendChild(caption);
      this.canvas.replaceChildren(root);
    };

    function overlayType(paint) {
      function Overlay(options) {
        this.options = options || {};
        this.map = null;
        this.setMap(this.options.map || null);
      }
      Overlay.prototype.setMap = function (map) {
        if (this.map) this.map.detach(this);
        this.map = map;
        if (map) map.attach(this);
      };
      Overlay.prototype.paint = paint;
      return Overlay;
    }

    function colorOf(options, fallback) {
      return options.strokeColor || fallback;
    }

    var Polygon = overlayType(function (root, map, frame, width, height) {
      var path = "";
      (this.options.paths || []).forEach(function (points) {
        points.forEach(function (point, index) {
          var at = map.project(frame, width, height, point);
          path += (index ? "L" : "M") + at[0] + " " + at[1] + " ";
        });
        path += "Z ";
      });
      root.appendChild(svg("path", { d: path, fill: this.options.fillColor || colorOf(this.options, "#0e8fc4"), "fill-opacity": this.options.fillOpacity || 0.35, "fill-rule": "evenodd", stroke: colorOf(this.options, "#0e8fc4"), "stroke-width": this.options.strokeWeight || 2 }));
    });

    var Polyline = overlayType(function (root, map, frame, width, height) {
      var path = "";
      (this.options.path || []).forEach(function (point, index) {
        var at = map.project(frame, width, height, point);
        path += (index ? "L" : "M") + at[0] + " " + at[1] + " ";
      });
      root.appendChild(svg("path", { d: path, fill: "none", stroke: colorOf(this.options, "#0e8fc4"), "stroke-width": this.options.strokeWeight || 3, "stroke-linecap": "round", "stroke-linejoin": "round" }));
    });

    var Circle = overlayType(function (root, map, frame, width, height) {
      var at = map.project(frame, width, height, this.options.center);
      var radius = this.options.radius / DEGREE_METERS * frame.scale;
      root.appendChild(svg("circle", { cx: at[0], cy: at[1], r: radius, fill: this.options.fillColor || colorOf(this.options, "#0e8fc4"), "fill-opacity": this.options.fillOpacity || 0.35, stroke: colorOf(this.options, "#0e8fc4"), "stroke-width": this.options.strokeWeight || 2 }));
    });

    var Marker = overlayType(function (root, map, frame, width, height) {
      var at = map.project(frame, width, height, this.options.position);
      var icon = this.options.icon;
      if (icon && icon.path === "circle") {
        root.appendChild(svg("circle", { cx: at[0], cy: at[1], r: icon.scale || 6, fill: icon.fillColor || "#0e8fc4", stroke: icon.strokeColor || "#ffffff", "stroke-width": icon.strokeWeight || 2 }));
        return;
      }
      root.appendChild(svg("path", { d: "M" + at[0] + " " + at[1] + " l-7 -12 a9 9 0 1 1 14 0 z", fill: "#d93a2b", stroke: "#ffffff", "stroke-width": 1.5 }));
      root.appendChild(svg("circle", { cx: at[0], cy: at[1] - 17, r: 3.4, fill: "#ffffff" }));
    });

    function Geocoder() {}

    Geocoder.prototype.geocode = function (request, callback) {
      var found = lookup(request && request.address);
      return Promise.resolve().then(function () {
        if (found) callback([{ geometry: { location: found } }], "OK");
        else callback([], "ZERO_RESULTS");
      });
    };

    function suggestions(request) {
      var query = String(request && request.input || "").trim().toLowerCase();
      var matches = Object.keys(PLACES).filter(function (address) { return query && address.toLowerCase().indexOf(query) !== -1; });
      return Promise.resolve({
        suggestions: matches.map(function (address) {
          return {
            placePrediction: {
              text: address,
              toPlace: function () {
                var place = { formattedAddress: "", location: null };
                place.fetchFields = function () {
                  place.formattedAddress = address;
                  place.location = PLACES[address];
                  return Promise.resolve({ place: place });
                };
                return place;
              },
            },
          };
        }),
      });
    }

    return {
      importLibrary: function () { return Promise.resolve({}); },
      Map: StubMap,
      Marker: Marker,
      SymbolPath: { CIRCLE: "circle" },
      Polygon: Polygon,
      Polyline: Polyline,
      Circle: Circle,
      Geocoder: Geocoder,
      places: {
        AutocompleteSessionToken: function () {},
        AutocompleteSuggestion: { fetchAutocompleteSuggestions: suggestions },
      },
    };
  }

  function fixtureClipboard(accepts) {
    return {
      writeText: function () {
        return accepts ? Promise.resolve() : Promise.reject(new Error("The fixture clipboard refuses every write"));
      },
    };
  }

  function build(id, delay) {
    var data = quotationData();
    var behavior = { introspect: "ok", events: {}, hooks: {}, delay: delay };
    var steps = [];
    var phase = "";
    var portalUrl = "";
    var pollDelays = null;
    var clipboard = null;
    var maps = "";
    var approve = [["option.toggle", { id: 3102 }], ["option.intent", { id: 3102, kind: "approve" }]];
    var confirmBoth = [
      ["details.choose", { code: "CLIENT_TYPE", value: "ORGANIZATION" }],
      ["details.choose", { code: "INFORMATION_CONFIRMED", value: true }],
      ["details.choose", { code: "AUTHORITY_CONFIRMED", value: true }],
    ];
    var typeDetails = [
      ["details.input", { code: "BILLING_ADDRESS", value: "1500 Harbour Green Drive, Suite 210, Vancouver, BC V6C 3T8" }],
      ["details.input", { code: "REPRESENTATIVE_FIRST_NAME", value: "Dana" }],
      ["details.input", { code: "REPRESENTATIVE_LAST_NAME", value: "Reyes" }],
      ["details.input", { code: "REPRESENTATIVE_EMAIL", value: "dana.reyes@harbourview.example" }],
      ["details.input", { code: "REPRESENTATIVE_PHONE", value: "+1 604 555 0164" }],
    ];
    var lastDecision = [["option.toggle", { id: 3108 }], ["option.intent", { id: 3108, kind: "approve" }], ["option.confirm", { id: 3108 }]];
    var agreementChanges = [
      ["agreement.changes", {}],
      ["agreement.draft", { value: "Please start the service on November 15 and add the side parking lot at 9150 Cedar Hollow Drive." }],
      ["agreement.changes.send", {}],
    ];
    switch (id) {
      case "loading":
        behavior.introspect = "hold";
        break;
      case "link-missing":
        phase = "link-missing";
        break;
      case "link-closed":
        behavior.introspect = "unauthorized";
        break;
      case "unconfigured":
        phase = "unconfigured";
        break;
      case "empty":
        data.grant.types = data.grant.types.filter(function (type) { return type.entityType === "Account"; });
        break;
      case "error":
        behavior.introspect = "fail-once";
        break;
      case "partial":
        data.unreadable = [3107];
        break;
      case "quote-price-labels":
        priceLabelled(data);
        break;
      case "link-copied":
        data = quotationData("AWAITING_CLIENT_DETAILS", DECIDED);
        clipboard = fixtureClipboard(true);
        steps = [["link.copy", {}]];
        break;
      case "link-copy-failed":
        clipboard = fixtureClipboard(false);
        steps = [["link.copy", {}]];
        break;
      case "contact-phone-only":
        delete data.documents[0].attributes[17].PROVIDER_CONTACT_EMAIL;
        break;
      case "contact-none":
        delete data.documents[0].attributes[17].PROVIDER_CONTACT_PHONE;
        delete data.documents[0].attributes[17].PROVIDER_CONTACT_EMAIL;
        break;
      case "option-open":
        steps = [["option.toggle", { id: 3102 }]];
        break;
      case "view-pending":
        behavior.events["QUOTE_SENT-QUOTE_VIEWED"] = { outcome: "hold" };
        steps = [["option.toggle", { id: 3101 }]];
        break;
      case "view-failed":
        behavior.events["QUOTE_SENT-QUOTE_VIEWED"] = { outcome: "fail" };
        steps = [["option.toggle", { id: 3101 }]];
        break;
      case "approve-confirm":
        steps = approve;
        break;
      case "decline-all-confirm":
        steps = [["property.decline", { key: "property-278" }]];
        break;
      case "decline-all-done":
        steps = [["property.decline", { key: "property-278" }], ["property.confirm", { key: "property-278" }]];
        break;
      case "changes-invalid":
        steps = [["option.toggle", { id: 3103 }], ["option.intent", { id: 3103, kind: "changes" }], ["option.confirm", { id: 3103 }]];
        break;
      case "command-pending":
        behavior.events["QUOTE_VIEWED-CLIENT_APPROVED"] = { outcome: "hold" };
        steps = approve.concat([["option.confirm", { id: 3102 }]]);
        break;
      case "command-refused":
        behavior.events["QUOTE_VIEWED-CLIENT_APPROVED"] = {
          outcome: "refuse",
          message: "This option was revised by the provider after you opened it. Refresh to see the current version.",
        };
        steps = approve.concat([["option.confirm", { id: 3102 }]]);
        break;
      case "command-failed":
        behavior.events["QUOTE_VIEWED-CLIENT_APPROVED"] = { outcome: "fail" };
        steps = approve.concat([["option.confirm", { id: 3102 }]]);
        break;
      case "command-stale-pending":
        behavior.staleReads = 99;
        steps = approve.concat([["option.confirm", { id: 3102 }]]);
        break;
      case "command-unconfirmed":
        behavior.staleReads = 99;
        steps = approve.concat([["option.confirm", { id: 3102 }]]);
        pollDelays = [300, 300, 300];
        break;
      case "view-unconfirmed":
        behavior.staleReads = 99;
        steps = [["option.toggle", { id: 3101 }]];
        pollDelays = [300, 300, 300];
        break;
      case "decided":
        data = quotationData("QUOTATION_SENT", DECIDED);
        break;
      case "decided-following":
        data = quotationData("QUOTATION_SENT", LAST_OPEN);
        behavior.hooks.evaluation = "hold";
        steps = lastDecision;
        break;
      case "decided-following-slow":
        data = quotationData("QUOTATION_SENT", LAST_OPEN);
        behavior.hooks.evaluation = "hold";
        steps = lastDecision;
        pollDelays = [300, 300, 300];
        break;
      case "decided-next-step":
        data = quotationData("QUOTATION_SENT", LAST_OPEN);
        steps = lastDecision;
        break;
      case "contract-details":
        data = quotationData("AWAITING_CLIENT_DETAILS", DECIDED);
        break;
      case "contract-details-attributes":
        data = attributedAccount(quotationData("AWAITING_CLIENT_DETAILS", DECIDED));
        break;
      case "contract-details-ids-only":
        data = idOnlyAccount(quotationData("AWAITING_CLIENT_DETAILS", DECIDED));
        break;
      case "contract-details-billing-service":
        data = attributedAccount(quotationData("AWAITING_CLIENT_DETAILS", DECIDED));
        steps = [["details.useAddress", { code: "BILLING_ADDRESS", value: ADDRESSES[430] }]];
        break;
      case "contract-details-maps":
        data = withPlans(attributedAccount(quotationData("AWAITING_CLIENT_DETAILS", DECIDED)));
        maps = "stub";
        break;
      case "contract-details-address-missing":
        data = withPlans(attributedAccount(quotationData("AWAITING_CLIENT_DETAILS", DECIDED)));
        data.accounts[0].attributes[data.accounts[0].type.id].BILLING_ADDRESS = { value: "PO Box 4471, Station Terminal, Vancouver, BC V6B 3Z8" };
        maps = "stub";
        break;
      case "contract-details-plan-unavailable":
        data = withPlans(attributedAccount(quotationData("AWAITING_CLIENT_DETAILS", DECIDED)), { 278: PLAN_IDS.broken });
        maps = "stub";
        break;
      case "contract-details-maps-failed":
        data = withPlans(attributedAccount(quotationData("AWAITING_CLIENT_DETAILS", DECIDED)));
        maps = "fail";
        break;
      case "details-invalid":
        data = quotationData("AWAITING_CLIENT_DETAILS", DECIDED);
        steps = [["details.input", { code: "REPRESENTATIVE_PHONE", value: "" }], ["details.submit", {}]];
        break;
      case "details-refused":
        data = quotationData("AWAITING_CLIENT_DETAILS", DECIDED);
        behavior.events["AWAITING_CLIENT_DETAILS-CLIENT_DETAILS_RECEIVED"] = {
          outcome: "refuse",
          message: "",
          fieldErrors: { REPRESENTATIVE_EMAIL: "This address cannot receive mail. Enter another email." },
        };
        steps = confirmBoth.concat([["details.submit", {}]]);
        break;
      case "details-checking":
        data = quotationData("CLIENT_DETAILS_RECEIVED", DECIDED);
        behavior.hooks.details = "hold";
        break;
      case "details-checking-slow":
        data = quotationData("CLIENT_DETAILS_RECEIVED", DECIDED);
        behavior.hooks.details = "hold";
        pollDelays = [300, 300, 300];
        break;
      case "details-returned":
        data = returnedData("CLIENT_TYPE,REPRESENTATIVE_EMAIL_INVALID,AUTHORITY_CONFIRMED");
        break;
      case "details-returned-attributes":
        data = attributedAccount(returnedData("CLIENT_TYPE,REPRESENTATIVE_EMAIL_INVALID,AUTHORITY_CONFIRMED"));
        break;
      case "details-returned-processing":
        data = returnedData("PROCESSING_FAILED");
        break;
      case "details-returned-unknown":
        data = returnedData("TAX_NUMBER_MISSING");
        break;
      case "details-returned-sent":
        data = idOnlyAccount(quotationData("AWAITING_CLIENT_DETAILS", DECIDED));
        behavior.hooks.details = "processing-failed";
        steps = typeDetails.concat(confirmBoth, [["details.submit", {}]]);
        break;
      case "details-stale-checking":
        data = returnedData("PROCESSING_FAILED");
        behavior.staleReads = 1;
        behavior.hooks.details = "hold";
        steps = typeDetails.concat(confirmBoth, [["details.submit", {}]]);
        break;
      case "details-stale-slow":
        data = returnedData("PROCESSING_FAILED");
        behavior.staleReads = 99;
        steps = typeDetails.concat(confirmBoth, [["details.submit", {}]]);
        pollDelays = [300, 300, 300];
        break;
      case "details-stale-closed":
        data = returnedData("PROCESSING_FAILED");
        behavior.staleReads = 1;
        steps = typeDetails.concat(confirmBoth, [["details.submit", {}]]);
        break;
      case "details-closed":
        data = quotationData("AWAITING_CLIENT_DETAILS", DECIDED);
        steps = confirmBoth.concat([["details.submit", {}]]);
        break;
      case "preparing":
        data = quotationData("DRAFT", DECIDED);
        break;
      case "agreement-review":
        data = agreementData("SENT_TO_CLIENT", false);
        break;
      case "agreement-numbered-terms":
        data = agreementData("SENT_TO_CLIENT", false);
        data.documents[0].attributes[17].CONTRACT_TERMS = { value: NUMBERED_TERMS };
        break;
      case "agreement-no-terms":
        data = agreementData("SENT_TO_CLIENT", false);
        delete data.documents[0].attributes[17].CONTRACT_TERMS;
        break;
      case "agreement-no-logo":
        data = agreementData("SENT_TO_CLIENT", false);
        delete data.documents[0].attributes[17].PROVIDER_LOGO;
        break;
      case "agreement-confirm":
        data = agreementData("SENT_TO_CLIENT", false);
        steps = [["agreement.intent", {}]];
        break;
      case "agreement-unconfirmed":
        data = agreementData("SENT_TO_CLIENT", false);
        behavior.staleReads = 99;
        steps = [["agreement.intent", {}], ["agreement.confirm", {}]];
        pollDelays = [300, 300, 300];
        break;
      case "agreement-changes":
        data = agreementData("SENT_TO_CLIENT", false);
        steps = [["agreement.changes", {}]];
        break;
      case "agreement-changes-invalid":
        data = agreementData("SENT_TO_CLIENT", false);
        steps = [["agreement.changes", {}], ["agreement.changes.send", {}]];
        break;
      case "agreement-changes-pending":
        data = agreementData("SENT_TO_CLIENT", false);
        behavior.events["SENT_TO_CLIENT-CLIENT_CHANGES_REQUESTED"] = { outcome: "hold" };
        steps = agreementChanges;
        break;
      case "agreement-changes-refused":
        data = agreementData("SENT_TO_CLIENT", false);
        behavior.events["SENT_TO_CLIENT-CLIENT_CHANGES_REQUESTED"] = {
          outcome: "refuse",
          message: "The provider has already updated this agreement. Open the link in their newest email.",
        };
        steps = agreementChanges;
        break;
      case "agreement-changes-sent":
        data = agreementData("SENT_TO_CLIENT", false);
        steps = agreementChanges;
        break;
      case "agreement-changes-requested":
        data = agreementData("CLIENT_CHANGES_REQUESTED", false);
        break;
      case "agreement-approval-only":
        data = agreementData("SENT_TO_CLIENT", false);
        data.grant.types[2].events = data.grant.types[2].events.filter(function (event) { return event.code === "SENT_TO_CLIENT-CLIENT_APPROVED"; });
        break;
      case "approval-closed":
        data = agreementData("SENT_TO_CLIENT", false);
        behavior.hooks.revokeOnApproval = true;
        steps = [["agreement.intent", {}], ["agreement.confirm", {}]];
        portalUrl = PORTAL_URL;
        break;
      case "completion":
        data = agreementData("CLIENT_APPROVED", false);
        break;
      case "completion-portal":
        data = agreementData("ACTIVE", true);
        portalUrl = PORTAL_URL;
        break;
      case "completion-finishing":
        data = agreementData("ACTIVATION_FAILED", false);
        delete data.accounts[0].contacts;
        portalUrl = PORTAL_URL;
        break;
      case "completion-attributes":
        data = attributedAccount(agreementData("CLIENT_APPROVED", false));
        portalUrl = PORTAL_URL;
        break;
      case "link-closed-portal":
        behavior.introspect = "unauthorized";
        portalUrl = PORTAL_URL;
        break;
      case "reference-expired":
        data = agreementData("EXPIRED", false);
        break;
      case "closed-canceled":
        data = quotationData("CANCELED");
        break;
      case "unavailable":
        data = agreementData("AGREEMENT_SEND_FAILED", false);
        break;
      default:
        break;
    }
    return { data: data, behavior: behavior, steps: steps, phase: phase, portalUrl: portalUrl, pollDelays: pollDelays, clipboard: clipboard, maps: maps };
  }

  function mapsLoader(kind) {
    if (kind === "stub") return function () { return Promise.resolve(mapsStub()); };
    if (kind === "fail") return function () { return Promise.reject(new Error("The fixture map service does not load")); };
    return null;
  }

  function setup(requested) {
    var id = SCENARIOS.some(function (scenario) { return scenario.id === requested; }) ? requested : SCENARIOS[0].id;
    var built = build(id, ns.fixtures.options.delay);
    return {
      id: id,
      phase: built.phase,
      adapter: built.phase ? null : createFixtureAdapter(built.data, built.behavior),
      steps: built.steps,
      data: built.data,
      portalUrl: built.portalUrl,
      pollDelays: built.pollDelays,
      clipboard: built.clipboard,
      loadMaps: built.phase ? null : mapsLoader(built.maps),
    };
  }

  function play(controller, steps) {
    var chain = controller.idle();
    (steps || []).forEach(function (step) {
      chain = chain.then(function () { return controller.idle(); }).then(function () {
        controller.dispatch(step[0], step[1] || {});
      });
    });
    return chain;
  }

  ns.fixtures = {
    options: { delay: 0 },
    scenarios: SCENARIOS.map(function (scenario) { return Object.freeze(Object.assign({}, scenario)); }),
    setup: setup,
    play: play,
    createFixtureAdapter: createFixtureAdapter,
    mapsStub: mapsStub,
    withPlans: withPlans,
    planIds: Object.freeze(Object.assign({}, PLAN_IDS)),
    planFiles: PLAN_FILES,
    places: PLACES,
    quotationData: quotationData,
    agreementData: agreementData,
    detailsErrors: detailsErrors,
    priceLabelled: priceLabelled,
    idOnlyAccount: idOnlyAccount,
    attributedAccount: attributedAccount,
    numberedTerms: NUMBERED_TERMS,
    portalUrl: PORTAL_URL,
    providerContact: Object.freeze(Object.assign({}, PROVIDER_CONTACT)),
    logoId: LOGO_ID,
    logoImage: LOGO_IMAGE,
    decidedStates: Object.freeze(Object.assign({}, DECIDED)),
    lastOpenStates: Object.freeze(Object.assign({}, LAST_OPEN)),
  };
})(typeof window !== "undefined" ? window : globalThis);

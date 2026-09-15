(function (global) {
  "use strict";

  var ns = global.ClientReview || (global.ClientReview = {});

  var ACCOUNT_ID = 694;
  var AGREEMENT_ID = 5205;
  var ORDER_TYPE = { id: 5, code: "FIELD_SERVICE_ORDER" };
  var CURRENCY = { id: 3, code: "CAD" };

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
    { id: "option-open", label: "Option open — lines, total, decisions" },
    { id: "view-pending", label: "Unviewed option opened — view event pending" },
    { id: "view-failed", label: "Unviewed option opened — view event failed" },
    { id: "approve-confirm", label: "Approve — confirmation" },
    { id: "changes-invalid", label: "Request changes — message required" },
    { id: "command-pending", label: "Decision pending" },
    { id: "command-refused", label: "Decision refused by the server" },
    { id: "command-failed", label: "Decision failed" },
    { id: "decided", label: "Every property decided — provider not done yet" },
    { id: "contract-details", label: "Contract details — pre-filled from the account" },
    { id: "details-invalid", label: "Contract details — validation errors" },
    { id: "details-refused", label: "Contract details — refused per field" },
    { id: "details-closed", label: "Contract details sent — link closed" },
    { id: "preparing", label: "Agreement being prepared — DRAFT" },
    { id: "agreement-review", label: "Agreement review — SENT_TO_CLIENT" },
    { id: "agreement-confirm", label: "Agreement approval — confirmation" },
    { id: "completion", label: "Completion — CLIENT_APPROVED" },
    { id: "completion-portal", label: "Completion — ACTIVE with a linked portal user" },
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
          itemPrice: { id: entry[0], product: PRODUCTS[entry[1]] },
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
      type: { code: "CUSTOMER", nls: { en: { NAME: "Customer" } } },
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
    }
    return {
      id: AGREEMENT_ID,
      code: "SA-5205",
      nls: { en: { NAME: "Service agreement 2026–2027" } },
      type: { id: 17, code: "SERVICE_AGREEMENT" },
      organization: { id: 43, code: "COASTLINE_WINTER", nls: { en: { NAME: "Coastline Winter Services" } } },
      states: [{ code: state }],
      attributes: { 17: attributes },
      content: TERMS,
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
        { entityType: "Document", canRead: true, canWrite: false, events: [grantEvent("AWAITING_CLIENT_DETAILS-DRAFT", 9)] },
      ],
    };
  }

  function agreementGrant() {
    return {
      expiresAt: "2026-11-05T23:59:00",
      types: [
        { entityType: "Account", canRead: true, canWrite: false, events: [] },
        { entityType: "Order", canRead: true, canWrite: false, events: [] },
        { entityType: "Document", canRead: true, canWrite: false, events: [grantEvent("SENT_TO_CLIENT-CLIENT_APPROVED", 12)] },
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
    if (code === "QUOTE_VIEWED-CUSTOMER_CHANGES_REQUESTED" && !String(metadata.MESSAGE || "").trim()) {
      throw reviewError("refused", 400, "", { MESSAGE: "A message is required." });
    }
    if (code === "AWAITING_CLIENT_DETAILS-DRAFT") {
      var missing = {};
      ns.contract.contractDetails.attributes.forEach(function (attribute) {
        var value = metadata[attribute.code];
        var filled = attribute.className === "java.lang.Boolean" ? value === true : typeof value === "string" && value.trim() !== "";
        if (attribute.required && !filled) missing[attribute.code] = "This value is required.";
      });
      if (Object.keys(missing).length) throw reviewError("refused", 400, "", missing);
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
      if ((target === "CLIENT_APPROVED" || target === "DECLINED") && hooks.evaluatePackage !== false) evaluatePackage(data);
    }
    if (entity === "document" && target === "DRAFT") {
      Object.keys(metadata).forEach(function (key) { row.attributes[17][key] = { value: metadata[key] }; });
      if (hooks.revokeOnDetails !== false) data.closed = true;
    }
    if (entity === "document" && target === "CLIENT_APPROVED" && hooks.revokeOnApproval === true) data.closed = true;
    return null;
  }

  function createFixtureAdapter(data, behavior) {
    var settings = behavior || {};
    var reviewError = ns.adapter.reviewError;
    var introspectFailures = settings.introspect === "fail-once" ? 1 : 0;

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

    function guard() {
      if (data.closed) throw reviewError("link-closed", 401);
    }

    return {
      introspect: function () {
        if (settings.introspect === "hold") return never();
        return later(function () {
          guard();
          if (settings.introspect === "unauthorized") throw reviewError("link-closed", 401);
          if (introspectFailures > 0) {
            introspectFailures = 0;
            throw reviewError("failed", 503);
          }
          return clone(data.grant);
        });
      },
      list: function (entity) {
        return later(function () {
          guard();
          if (entity === "account") {
            if (data.accountFails) throw reviewError("failed", 500);
            return clone(data.accounts);
          }
          if (entity === "document") return clone(data.documents);
          if (entity === "order") return clone(data.orders.filter(function (row) { return data.unreadable.indexOf(row.id) === -1; }));
          throw reviewError("refused", 400);
        });
      },
      get: function (entity, id) {
        return later(function () {
          guard();
          var row = entity === "order" ? data.orders.filter(function (candidate) { return candidate.id === id; })[0] : null;
          if (!row || data.unreadable.indexOf(id) !== -1) throw reviewError("refused", 404);
          return clone(row);
        });
      },
      sendEvent: function (entity, id, code, metadata) {
        var rule = (settings.events || {})[code] || { outcome: "accept" };
        if (rule.outcome === "hold") return never();
        return later(function () {
          guard();
          if (rule.outcome === "refuse") throw reviewError("refused", 409, rule.message || "", rule.fieldErrors || {});
          if (rule.outcome === "fail") throw reviewError("failed", 502);
          return apply(data, entity, id, code, metadata || {}, settings.hooks || {});
        });
      },
    };
  }

  function build(id, delay) {
    var data = quotationData();
    var behavior = { introspect: "ok", events: {}, hooks: {}, delay: delay };
    var steps = [];
    var phase = "";
    var approve = [["option.toggle", { id: 3102 }], ["option.intent", { id: 3102, kind: "approve" }]];
    var confirmBoth = [
      ["details.choose", { code: "CLIENT_TYPE", value: "ORGANIZATION" }],
      ["details.choose", { code: "INFORMATION_CONFIRMED", value: true }],
      ["details.choose", { code: "AUTHORITY_CONFIRMED", value: true }],
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
      case "decided":
        data = quotationData("QUOTATION_SENT", DECIDED);
        break;
      case "contract-details":
        data = quotationData("AWAITING_CLIENT_DETAILS", DECIDED);
        break;
      case "details-invalid":
        data = quotationData("AWAITING_CLIENT_DETAILS", DECIDED);
        steps = [["details.input", { code: "REPRESENTATIVE_PHONE", value: "" }], ["details.submit", {}]];
        break;
      case "details-refused":
        data = quotationData("AWAITING_CLIENT_DETAILS", DECIDED);
        behavior.events["AWAITING_CLIENT_DETAILS-DRAFT"] = {
          outcome: "refuse",
          message: "",
          fieldErrors: { REPRESENTATIVE_EMAIL: "This address cannot receive mail. Enter another email." },
        };
        steps = confirmBoth.concat([["details.submit", {}]]);
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
      case "agreement-confirm":
        data = agreementData("SENT_TO_CLIENT", false);
        steps = [["agreement.intent", {}]];
        break;
      case "completion":
        data = agreementData("CLIENT_APPROVED", false);
        break;
      case "completion-portal":
        data = agreementData("ACTIVE", true);
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
    return { data: data, behavior: behavior, steps: steps, phase: phase };
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
    quotationData: quotationData,
    agreementData: agreementData,
    decidedStates: Object.freeze(Object.assign({}, DECIDED)),
  };
})(typeof window !== "undefined" ? window : globalThis);

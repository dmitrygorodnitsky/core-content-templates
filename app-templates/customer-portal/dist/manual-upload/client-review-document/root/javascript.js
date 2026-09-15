(function (global) {
  "use strict";

  var ns = global.ClientReview || (global.ClientReview = {});

  var ENTRIES = [
    ["DOCUMENT_TITLE", "documentTitle", "Your quotation and agreement"],
    ["LOADING_LABEL", "loadingLabel", "Loading your quotation"],
    ["FROM_LABEL", "fromLabel", "From"],
    ["FOR_LABEL", "forLabel", "For"],
    ["LINK_VALID_UNTIL", "linkValidUntil", "This link works until {date}."],

    ["QUOTE_EYEBROW", "quoteEyebrow", "Quotation"],
    ["QUOTE_TITLE", "quoteTitle", "Review your quotes"],
    ["QUOTE_SUBTITLE", "quoteSubtitle", "Each property has its own options. Open an option to see its services and price, then approve it, decline it or ask for changes."],
    ["SUMMARY_LABEL", "summaryLabel", "Package summary"],
    ["SUMMARY_PROPERTIES", "summaryProperties", "Properties"],
    ["SUMMARY_AWAITING", "summaryAwaiting", "Awaiting decision"],
    ["SUMMARY_APPROVED", "summaryApproved", "Option approved"],
    ["SUMMARY_DECLINED", "summaryDeclined", "Declined"],
    ["SUMMARY_CHANGES", "summaryChanges", "Changes requested"],
    ["ADDRESS_UNAVAILABLE", "addressUnavailable", "Address unavailable"],
    ["OPTIONS_ONE", "optionsOne", "1 option"],
    ["OPTIONS_MANY", "optionsMany", "{n} options"],
    ["OPTION_FALLBACK", "optionFallback", "Option {n}"],
    ["MODEL_SEASONAL", "modelSeasonal", "Seasonal"],
    ["MODEL_MONTHLY", "modelMonthly", "Monthly"],
    ["MODEL_PER_SERVICE", "modelPerService", "Per service"],
    ["PROPERTY_AWAITING", "propertyAwaiting", "Awaiting decision"],
    ["PROPERTY_APPROVED", "propertyApproved", "Option approved"],
    ["PROPERTY_DECLINED", "propertyDeclined", "Declined"],
    ["PROPERTY_CHANGES", "propertyChanges", "Changes requested"],
    ["PROPERTY_UNKNOWN", "propertyUnknown", "Status unavailable"],
    ["OPTION_NEW", "optionNew", "New"],
    ["OPTION_VIEWED", "optionViewed", "Awaiting decision"],
    ["OPTION_APPROVED", "optionApproved", "Approved"],
    ["OPTION_DECLINED", "optionDeclined", "Declined"],
    ["OPTION_CHANGES", "optionChanges", "Changes requested"],
    ["OPTION_REVISING", "optionRevising", "Being revised"],
    ["OPTION_UNKNOWN", "optionUnknown", "Status unavailable"],
    ["SHOW_OPTION", "showOption", "Show details"],
    ["HIDE_OPTION", "hideOption", "Hide details"],
    ["LINE_SERVICE", "lineService", "Service"],
    ["LINE_QUANTITY", "lineQuantity", "Quantity"],
    ["LINE_UNIT_PRICE", "lineUnitPrice", "Unit price"],
    ["ORDER_TOTAL", "orderTotal", "Option total"],
    ["LINES_EMPTY", "linesEmpty", "No services are listed on this option."],
    ["VALUE_NOT_STATED", "valueNotStated", "Not stated"],
    ["SERVICE_UNNAMED", "serviceUnnamed", "Unnamed service"],
    ["NOTE_REVISING", "noteRevising", "The provider is revising this option. Its services and price show here again once it is sent back to you."],
    ["NOTE_SIBLING_APPROVED", "noteSiblingApproved", "You approved another option for this property."],
    ["NOTE_NO_ACTIONS", "noteNoActions", "Decisions on this option cannot be made through this link."],
    ["VIEW_PENDING", "viewPending", "Letting the provider know you opened this option…"],
    ["VIEW_FAILED", "viewFailed", "We could not let the provider know you opened this option, so its decisions are not available yet."],
    ["APPROVE_LABEL", "approveLabel", "Approve"],
    ["DECLINE_LABEL", "declineLabel", "Decline"],
    ["CHANGES_LABEL", "changesLabel", "Request changes"],
    ["CANCEL_LABEL", "cancelLabel", "Cancel"],
    ["SENDING_LABEL", "sendingLabel", "Sending…"],
    ["APPROVE_CONFIRM_TITLE", "approveConfirmTitle", "Approve {option} for this property?"],
    ["APPROVE_CONFIRM_OTHERS", "approveConfirmOthers", "The provider will decline the other options for this property."],
    ["APPROVE_CONFIRM_BUTTON", "approveConfirmButton", "Confirm approval"],
    ["DECLINE_CONFIRM_TITLE", "declineConfirmTitle", "Decline {option}?"],
    ["DECLINE_CONFIRM_BODY", "declineConfirmBody", "A declined option cannot be approved later through this link."],
    ["DECLINE_CONFIRM_BUTTON", "declineConfirmButton", "Confirm decline"],
    ["CHANGES_TITLE", "changesTitle", "What should change?"],
    ["CHANGES_PLACEHOLDER", "changesPlaceholder", "For example: add sidewalk de-icing, or quote weekly visits instead."],
    ["CHANGES_REQUIRED", "changesRequired", "Write what you would like changed before sending."],
    ["CHANGES_SEND", "changesSend", "Send request"],
    ["REFUSED_TITLE", "refusedTitle", "Not accepted"],
    ["REFUSED_FALLBACK", "refusedFallback", "The provider's system did not accept this request."],
    ["FAILED_BODY", "failedBody", "We could not confirm whether this went through. Refresh the status before trying again."],
    ["REFRESH_LABEL", "refreshLabel", "Refresh status"],
    ["PARTIAL_ONE", "partialOne", "1 option could not be loaded. Everything else is shown as the provider's system returned it."],
    ["PARTIAL_MANY", "partialMany", "{n} options could not be loaded. Everything else is shown as the provider's system returned it."],
    ["ACCOUNT_PARTIAL", "accountPartial", "Your account details could not be loaded, so nothing is filled in for you."],
    ["DECIDED_TITLE", "decidedTitle", "Every property has a decision"],
    ["DECIDED_BODY", "decidedBody", "The provider opens the next step once its system has processed your decisions."],
    ["CHECK_AGAIN", "checkAgain", "Check again"],

    ["DETAILS_EYEBROW", "detailsEyebrow", "Contract details"],
    ["DETAILS_TITLE", "detailsTitle", "Complete your contract details"],
    ["DETAILS_SUBTITLE", "detailsSubtitle", "Every property has a decision. These details go into your service agreement."],
    ["DETAILS_APPROVED_TITLE", "detailsApprovedTitle", "Approved options"],
    ["DETAILS_FORM_TITLE", "detailsFormTitle", "Client and representative"],
    ["DETAILS_SUBMIT", "detailsSubmit", "Send details"],
    ["DETAILS_INVALID", "detailsInvalid", "Check the highlighted fields."],
    ["DETAILS_REFUSED_TITLE", "detailsRefusedTitle", "The details were not accepted"],
    ["DETAILS_UNAVAILABLE", "detailsUnavailable", "Contract details cannot be sent through this link."],
    ["REQUIRED_ERROR", "requiredError", "This field is required."],
    ["EMAIL_ERROR", "emailError", "Enter a valid email address."],
    ["SELECT_PLACEHOLDER", "selectPlaceholder", "Choose one"],

    ["AGREEMENT_EYEBROW", "agreementEyebrow", "Service agreement"],
    ["AGREEMENT_TITLE", "agreementTitle", "Review your service agreement"],
    ["AGREEMENT_SUBTITLE", "agreementSubtitle", "Read the parties, services and terms below, then approve the agreement."],
    ["AGREEMENT_AWAITING", "agreementAwaiting", "Awaiting your approval"],
    ["PARTY_PROVIDER", "partyProvider", "Provider"],
    ["PARTY_CLIENT", "partyClient", "Client"],
    ["PARTY_LEGAL_NAME", "partyLegalName", "Legal name"],
    ["PARTY_CLIENT_TYPE", "partyClientType", "Client type"],
    ["PARTY_BILLING_ADDRESS", "partyBillingAddress", "Billing address"],
    ["PARTY_REPRESENTATIVE", "partyRepresentative", "Representative"],
    ["PARTY_EMAIL", "partyEmail", "Email"],
    ["PARTY_PHONE", "partyPhone", "Phone"],
    ["TERM_TITLE", "termTitle", "Term"],
    ["TERM_EFFECTIVE", "termEffective", "Effective date"],
    ["TERM_START", "termStart", "Starts"],
    ["TERM_END", "termEnd", "Ends"],
    ["SERVICES_TITLE", "servicesTitle", "Properties and services"],
    ["TERMS_TITLE", "termsTitle", "Terms"],
    ["TERMS_EMPTY", "termsEmpty", "The agreement text is not included on this page."],
    ["AGREEMENT_APPROVE", "agreementApprove", "Approve agreement"],
    ["AGREEMENT_CONFIRM_TITLE", "agreementConfirmTitle", "Approve this agreement?"],
    ["AGREEMENT_CONFIRM_BODY", "agreementConfirmBody", "You approve it on behalf of {client}."],
    ["AGREEMENT_CONFIRM_BUTTON", "agreementConfirmButton", "Confirm approval"],
    ["AGREEMENT_NO_ACTION", "agreementNoAction", "This agreement cannot be approved through this link."],
    ["AGREEMENT_APPROVED", "agreementApproved", "Approved"],
    ["AGREEMENT_ACTIVE", "agreementActive", "Active"],
    ["AGREEMENT_EXPIRED", "agreementExpired", "This agreement has expired. It is shown for reference."],
    ["AGREEMENT_SUSPENDED", "agreementSuspended", "This agreement is suspended. It is shown for reference."],

    ["COMPLETE_APPROVED_TITLE", "completeApprovedTitle", "Agreement approved"],
    ["COMPLETE_ACTIVE_TITLE", "completeActiveTitle", "Agreement active"],
    ["COMPLETE_BODY", "completeBody", "The provider's system has recorded your approval."],
    ["COMPLETE_PORTAL", "completePortal", "A customer portal account is linked to this client."],

    ["PREPARING_TITLE", "preparingTitle", "Your agreement is being prepared"],
    ["PREPARING_BODY", "preparingBody", "Nothing is needed from you on this page right now."],
    ["CANCELED_TITLE", "canceledTitle", "This quotation is closed"],
    ["CANCELED_BODY", "canceledBody", "The provider canceled it. Contact them if you expected to review it."],
    ["ARCHIVED_TITLE", "archivedTitle", "This agreement is archived"],
    ["ARCHIVED_BODY", "archivedBody", "It is no longer available through this link."],
    ["UNAVAILABLE_TITLE", "unavailableTitle", "This page is not available right now"],
    ["UNAVAILABLE_BODY", "unavailableBody", "The provider's system has not finished sending it. Try this link again later."],
    ["LINK_MISSING_TITLE", "linkMissingTitle", "This link is incomplete"],
    ["LINK_MISSING_BODY", "linkMissingBody", "Open the full link from your email. Nothing can be shown without it."],
    ["LINK_CLOSED_TITLE", "linkClosedTitle", "This link has expired or was withdrawn"],
    ["LINK_CLOSED_BODY", "linkClosedBody", "Ask the provider to send you a new link."],
    ["CLOSED_AFTER_TITLE", "closedAfterTitle", "This link is now closed"],
    ["CLOSED_AFTER_DETAILS_BODY", "closedAfterDetailsBody", "It closed after your details were sent. The provider closes it when the details step ends."],
    ["CLOSED_AFTER_APPROVAL_BODY", "closedAfterApprovalBody", "It closed after your approval was sent. The provider closes it when the agreement review ends."],
    ["EMPTY_TITLE", "emptyTitle", "There is nothing to review here"],
    ["EMPTY_BODY", "emptyBody", "This link does not include a quotation or an agreement."],
    ["ERROR_TITLE", "errorTitle", "We could not load this page"],
    ["ERROR_BODY", "errorBody", "The provider's system did not answer as expected. Nothing was changed."],
    ["READBACK_ERROR_BODY", "readbackErrorBody", "Your request reached the provider's system, but its current status could not be loaded."],
    ["RETRY_LABEL", "retryLabel", "Try again"],
    ["UNCONFIGURED_TITLE", "unconfiguredTitle", "This page is not set up yet"],
    ["UNCONFIGURED_BODY", "unconfiguredBody", "Its connection to the provider's system is missing."],
  ];

  function defaultCopy() {
    var copy = {};
    ENTRIES.forEach(function (entry) { copy[entry[1]] = entry[2]; });
    return copy;
  }

  function withDefaults(overrides) {
    var copy = defaultCopy();
    Object.keys(overrides || {}).forEach(function (key) {
      var value = overrides[key];
      if (Object.prototype.hasOwnProperty.call(copy, key) && typeof value === "string" && value.trim()) copy[key] = value;
    });
    return copy;
  }

  function fill(template, values) {
    return String(template == null ? "" : template).replace(/\{([a-zA-Z]+)\}/g, function (match, name) {
      return values && Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match;
    });
  }

  ns.copyEntries = ENTRIES.map(function (entry) { return Object.freeze(entry.slice()); });
  ns.defaultCopy = defaultCopy;
  ns.withDefaults = withDefaults;
  ns.fill = fill;
})(typeof window !== "undefined" ? window : globalThis);
(function (global) {
  "use strict";

  var ns = global.ClientReview || (global.ClientReview = {});

  function deepFreeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
      Object.freeze(value);
    }
    return value;
  }

  function choice(value, name) {
    return { value: value, nls: { en: { NAME: name } } };
  }

  function attribute(code, className, required, name, extra) {
    var definition = {
      code: code,
      className: className,
      required: required,
      multiselect: false,
      freeValue: false,
      unique: false,
      nls: { en: { NAME: name } },
      options: extra && extra.options ? extra.options : [],
    };
    if (extra && extra.inputFormat) definition.inputFormat = extra.inputFormat;
    return definition;
  }

  var CONTRACT_DETAILS_ATTRIBUTES = [
    attribute("LEGAL_NAME", "java.lang.String", true, "Legal Name"),
    attribute("CLIENT_TYPE", "java.lang.String", true, "Client Type", {
      options: [choice("INDIVIDUAL", "Individual"), choice("ORGANIZATION", "Organization")],
    }),
    attribute("BILLING_ADDRESS", "java.lang.String", true, "Billing Address", { inputFormat: "address" }),
    attribute("REPRESENTATIVE_FIRST_NAME", "java.lang.String", true, "First Name"),
    attribute("REPRESENTATIVE_LAST_NAME", "java.lang.String", true, "Last Name"),
    attribute("REPRESENTATIVE_JOB_TITLE", "java.lang.String", false, "Job Title"),
    attribute("REPRESENTATIVE_EMAIL", "java.lang.String", true, "Email", { inputFormat: "email" }),
    attribute("REPRESENTATIVE_PHONE", "java.lang.String", true, "Phone", { inputFormat: "tel" }),
    attribute("INFORMATION_CONFIRMED", "java.lang.Boolean", true, "Information Confirmation"),
    attribute("AUTHORITY_CONFIRMED", "java.lang.Boolean", true, "Authority Confirmation"),
  ];

  var CONTRACT = {
    orderWorkflow: "GENERAL_FSM_ORDER",
    agreementWorkflow: "SERVICE_AGREEMENT_LIFECYCLE",
    agreementType: "SERVICE_AGREEMENT",
    orderStates: [
      "INITIAL", "QUOTE_PREPARED", "CHANGES_REQUESTED", "QUOTE_APPROVED_INTERNALLY",
      "QUOTE_SENT", "QUOTE_VIEWED", "CLIENT_APPROVED", "DECLINED", "CUSTOMER_CHANGES_REQUESTED",
    ],
    agreementStates: [
      "QUOTATION", "QUOTATION_SENT", "QUOTATION_SEND_FAILED", "AWAITING_CLIENT_DETAILS", "DRAFT",
      "PENDING_MANAGEMENT_APPROVAL", "INTERNALLY_APPROVED", "SENT_TO_CLIENT", "AGREEMENT_SEND_FAILED",
      "CLIENT_APPROVED", "ACTIVE", "SUSPENDED", "EXPIRED", "ARCHIVED", "CANCELED",
    ],
    orderEvents: {
      view: { code: "QUOTE_SENT-QUOTE_VIEWED", source: "QUOTE_SENT" },
      approve: { code: "QUOTE_VIEWED-CLIENT_APPROVED", source: "QUOTE_VIEWED" },
      decline: { code: "QUOTE_VIEWED-DECLINED", source: "QUOTE_VIEWED" },
      changes: { code: "QUOTE_VIEWED-CUSTOMER_CHANGES_REQUESTED", source: "QUOTE_VIEWED", messageAttribute: "MESSAGE" },
    },
    agreementEvents: {
      details: { code: "AWAITING_CLIENT_DETAILS-DRAFT", source: "AWAITING_CLIENT_DETAILS" },
      approve: { code: "SENT_TO_CLIENT-CLIENT_APPROVED", source: "SENT_TO_CLIENT" },
    },
    orderAttributes: {
      property: "SERVICE_PROPERTY",
      address: "SERVICE_ADDRESS",
      pricingModel: "PRICING_MODEL",
    },
    pricingModels: ["SEASONAL", "MONTHLY", "PER_SERVICE"],
    rawShape: {
      orderLines: "items",
      documentContent: "content",
      documentOwner: "organization",
      accountUser: "user",
    },
    agreementAttributes: {
      client: "CLIENT",
      orders: "ORDERS",
      effectiveDate: "EFFECTIVE_DATE",
      termStart: "TERM_START_DATE",
      termEnd: "TERM_END_DATE",
      providerLegalName: "PROVIDER_LEGAL_NAME",
      providerRepresentativeName: "PROVIDER_REPRESENTATIVE_NAME",
      providerRepresentativeJobTitle: "PROVIDER_REPRESENTATIVE_JOB_TITLE",
    },
    contractDetails: {
      event: "AWAITING_CLIENT_DETAILS-DRAFT",
      attributes: CONTRACT_DETAILS_ATTRIBUTES,
      attributeOrder: [
        {
          default: CONTRACT_DETAILS_ATTRIBUTES.map(function (definition) {
            return { attributeCode: definition.code, visible: true };
          }),
        },
      ],
    },
  };

  ns.contract = deepFreeze(CONTRACT);
})(typeof window !== "undefined" ? window : globalThis);
(function (global) {
  "use strict";

  var ns = global.ClientReview || (global.ClientReview = {});

  var GRANT = {
    introspect: { service: "core", tail: "introspect.json" },
    entities: {
      account: { service: "core-acct", segment: "account" },
      order: { service: "core-bill", segment: "order" },
      document: { service: "core", segment: "document" },
    },
    pageSize: 200,
    pageLimit: 10,
    messageLimit: 400,
    refusalMessageKeys: ["message", "error_description", "detail", "title", "error"],
    fieldErrorKeys: ["fieldErrors", "errors", "violations"],
  };

  function freeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      Object.keys(value).forEach(function (key) { freeze(value[key]); });
      Object.freeze(value);
    }
    return value;
  }

  function reviewError(code, status, serverMessage, fieldErrors) {
    var error = new Error(code);
    error.name = "ClientReviewError";
    error.code = code;
    error.status = typeof status === "number" ? status : 0;
    error.serverMessage = typeof serverMessage === "string" ? serverMessage : "";
    error.fieldErrors = fieldErrors && typeof fieldErrors === "object" ? fieldErrors : {};
    return error;
  }

  function tokenFromFragment(hash) {
    var fragment = String(hash == null ? "" : hash).replace(/^#/, "");
    var found = "";
    fragment.split("&").some(function (pair) {
      if (pair.indexOf("token=") !== 0) return false;
      try {
        found = decodeURIComponent(pair.slice("token=".length));
      } catch (_) {
        found = "";
      }
      return true;
    });
    return acceptableToken(found) ? found : "";
  }

  function acceptableToken(value) {
    if (!value || value.length > 2048 || /\s/.test(value)) return false;
    for (var index = 0; index < value.length; index += 1) {
      var code = value.charCodeAt(index);
      if (code < 32 || code === 127) return false;
    }
    return true;
  }

  function safeApiBase(value) {
    var text = String(value == null ? "" : value).trim();
    if (!text) return "";
    var url;
    try {
      url = new URL(text);
    } catch (_) {
      return "";
    }
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) return "";
    if (url.pathname && url.pathname !== "/") return "";
    return url.origin;
  }

  function clip(value) {
    var text = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
    if (text.length <= GRANT.messageLimit) return text;
    return text.slice(0, GRANT.messageLimit) + "…";
  }

  function parseJson(text) {
    if (typeof text !== "string" || !text.trim()) return undefined;
    try {
      return JSON.parse(text);
    } catch (_) {
      return undefined;
    }
  }

  function refusalMessage(payload) {
    if (!payload || typeof payload !== "object") return "";
    var found = "";
    GRANT.refusalMessageKeys.some(function (key) {
      found = clip(payload[key]);
      return Boolean(found);
    });
    return found;
  }

  function fieldCode(value) {
    var text = typeof value === "string" ? value.trim() : "";
    var tail = text.split(/[.[\]]/).filter(Boolean).pop() || "";
    return /^[A-Z][A-Z0-9_]*$/.test(tail) ? tail : "";
  }

  function fieldErrorsOf(payload) {
    var found = {};
    if (!payload || typeof payload !== "object") return found;
    GRANT.fieldErrorKeys.forEach(function (key) {
      var source = payload[key];
      if (Array.isArray(source)) {
        source.forEach(function (entry) {
          if (!entry || typeof entry !== "object") return;
          var code = fieldCode(entry.field || entry.attribute || entry.code || entry.property || entry.propertyPath || entry.name);
          var message = clip(entry.message || entry.defaultMessage || entry.reason);
          if (code && message && !found[code]) found[code] = message;
        });
      } else if (source && typeof source === "object") {
        Object.keys(source).forEach(function (name) {
          var code = fieldCode(name);
          var value = Array.isArray(source[name]) ? source[name][0] : source[name];
          var message = clip(value);
          if (code && message && !found[code]) found[code] = message;
        });
      }
    });
    return found;
  }

  function outcome(response, operation) {
    if (!response || typeof response.status !== "number" || typeof response.text !== "function") {
      throw reviewError("failed", 0);
    }
    return Promise.resolve(response.text()).then(null, function () { return ""; }).then(function (body) {
      var status = response.status;
      var payload = parseJson(body);
      if (status >= 200 && status < 300) return { payload: payload };
      if (status === 401) throw reviewError("link-closed", status);
      if (operation === "introspect" && (status === 403 || status === 404)) throw reviewError("link-closed", status);
      if (status >= 400 && status < 500) throw reviewError("refused", status, refusalMessage(payload), fieldErrorsOf(payload));
      throw reviewError("failed", status);
    });
  }

  function objectPayload(result) {
    var payload = result && result.payload;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw reviewError("failed", 200);
    return payload;
  }

  function createGrantAdapter(options) {
    var settings = options || {};
    var base = safeApiBase(settings.apiBase);
    var token = typeof settings.token === "string" ? settings.token : "";
    var fetchImpl = settings.fetch || (typeof global.fetch === "function" ? global.fetch.bind(global) : null);
    if (!base || typeof fetchImpl !== "function") throw reviewError("unconfigured", 0);
    if (!token) throw reviewError("link-missing", 0);

    function url(service, tail) {
      return base + "/" + service + "/i/" + encodeURIComponent(token) + "/" + tail;
    }

    function post(target, body, operation) {
      return new Promise(function (resolve) {
        resolve(fetchImpl(target, {
          method: "POST",
          credentials: "omit",
          cache: "no-store",
          referrerPolicy: "no-referrer",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }));
      }).then(function (response) {
        return outcome(response, operation);
      }, function () {
        throw reviewError("failed", 0);
      });
    }

    function entity(name) {
      var spec = GRANT.entities[name];
      if (!spec) throw reviewError("unsupported-entity", 0);
      return spec;
    }

    return {
      introspect: function () {
        return post(url(GRANT.introspect.service, GRANT.introspect.tail), {}, "introspect").then(objectPayload);
      },
      list: function (name) {
        var spec = entity(name);
        var rows = [];
        function page(index) {
          return post(url(spec.service, spec.segment + "/list.json"), { offset: index * GRANT.pageSize, pageSize: GRANT.pageSize }, "read")
            .then(objectPayload)
            .then(function (payload) {
              if (!Array.isArray(payload.result)) throw reviewError("failed", 200);
              rows = rows.concat(payload.result);
              if (payload.result.length < GRANT.pageSize || index + 1 >= GRANT.pageLimit) return rows;
              return page(index + 1);
            });
        }
        return page(0);
      },
      get: function (name, id) {
        var spec = entity(name);
        return post(url(spec.service, spec.segment + "/get.json") + "?id=" + encodeURIComponent(String(id)), {}, "read").then(objectPayload);
      },
      sendEvent: function (name, id, event, metadata) {
        var spec = entity(name);
        return post(url(spec.service, spec.segment + "/event.json"), { id: id, event: event, metadata: metadata || {} }, "command")
          .then(function (result) { return result.payload === undefined ? null : result.payload; });
      },
    };
  }

  ns.adapter = Object.freeze({
    contract: freeze(GRANT),
    createGrantAdapter: createGrantAdapter,
    tokenFromFragment: tokenFromFragment,
    safeApiBase: safeApiBase,
    reviewError: reviewError,
    refusalMessage: refusalMessage,
    fieldErrorsOf: fieldErrorsOf,
  });
})(typeof window !== "undefined" ? window : globalThis);
(function (global) {
  "use strict";

  var ns = global.ClientReview || (global.ClientReview = {});

  var ORDER_STATUS = {
    QUOTE_SENT: "new",
    QUOTE_VIEWED: "viewed",
    CLIENT_APPROVED: "approved",
    DECLINED: "declined",
    CUSTOMER_CHANGES_REQUESTED: "changes",
    INITIAL: "revising",
    QUOTE_PREPARED: "revising",
    CHANGES_REQUESTED: "revising",
    QUOTE_APPROVED_INTERNALLY: "revising",
  };

  var PRICED_STATUSES = ["new", "viewed", "approved", "declined", "changes"];

  var AGREEMENT_DISPOSITION = {
    QUOTATION: { kind: "preparing" },
    QUOTATION_SENT: { kind: "quote-review" },
    QUOTATION_SEND_FAILED: { kind: "unavailable", reason: "send-failed" },
    AWAITING_CLIENT_DETAILS: { kind: "contract-details" },
    DRAFT: { kind: "preparing" },
    PENDING_MANAGEMENT_APPROVAL: { kind: "preparing" },
    INTERNALLY_APPROVED: { kind: "preparing" },
    SENT_TO_CLIENT: { kind: "agreement-review" },
    AGREEMENT_SEND_FAILED: { kind: "unavailable", reason: "send-failed" },
    CLIENT_APPROVED: { kind: "completion", completion: "approved" },
    ACTIVE: { kind: "completion", completion: "active" },
    SUSPENDED: { kind: "reference", banner: "suspended" },
    EXPIRED: { kind: "reference", banner: "expired" },
    ARCHIVED: { kind: "closed", reason: "archived" },
    CANCELED: { kind: "closed", reason: "canceled" },
  };

  function text(value) {
    if (typeof value === "string") return value.trim();
    if (typeof value === "number" && isFinite(value)) return String(value);
    return "";
  }

  function positiveInteger(value) {
    if (value === null || value === undefined || value === "" || typeof value === "boolean") return null;
    var number = Number(value);
    return Number.isInteger(number) && number > 0 ? number : null;
  }

  function finiteOrNull(value) {
    if (value === null || value === undefined || value === "" || typeof value === "boolean") return null;
    var number = Number(value);
    return isFinite(number) ? number : null;
  }

  function ascending(left, right) {
    if (left < right) return -1;
    if (left > right) return 1;
    return 0;
  }

  function localizedName(nls, locale) {
    if (!nls || typeof nls !== "object") return "";
    var language = String(locale || "en").split("-")[0];
    var bag = nls[locale] || nls[language] || nls.en || nls[Object.keys(nls)[0]];
    if (!bag || typeof bag !== "object") return "";
    return text(bag.NAME || bag.name).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  }

  function attributeEntry(row, code) {
    var buckets = row && row.attributes;
    if (!buckets || typeof buckets !== "object") return null;
    var keys = Object.keys(buckets);
    for (var index = 0; index < keys.length; index += 1) {
      var bucket = buckets[keys[index]];
      if (bucket && typeof bucket === "object" && Object.prototype.hasOwnProperty.call(bucket, code)) return bucket[code];
    }
    return null;
  }

  function attributeValue(row, code) {
    var entry = attributeEntry(row, code);
    if (entry && typeof entry === "object" && !Array.isArray(entry)) return entry.value;
    return entry === null ? undefined : entry;
  }

  function attributeText(row, code) {
    return text(attributeValue(row, code));
  }

  function idList(value) {
    var source = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : value === null || value === undefined ? [] : [value];
    var ids = [];
    source.forEach(function (item) {
      var id = positiveInteger(item && typeof item === "object" ? item.id : item);
      if (id && ids.indexOf(id) === -1) ids.push(id);
    });
    return ids;
  }

  function stateCode(row, known) {
    var codes = [];
    var states = row && Array.isArray(row.states) ? row.states : [];
    states.forEach(function (entry) {
      var code = text(entry && typeof entry === "object" ? entry.code : entry);
      if (code && known.indexOf(code) !== -1 && codes.indexOf(code) === -1) codes.push(code);
    });
    if (!codes.length && row && row.state && typeof row.state === "object") {
      var single = text(row.state.code);
      if (known.indexOf(single) !== -1) codes.push(single);
    }
    return codes.length === 1 ? codes[0] : "";
  }

  function entityKind(entityType) {
    var tail = text(entityType).split(".").pop() || "";
    var compact = tail.replace(/[^A-Za-z]/g, "").toLowerCase();
    return compact === "orderitem" ? "order-item" : compact;
  }

  function eventCodeOf(entry) {
    var code = text(entry && typeof entry === "object" ? entry.code : entry);
    var separator = code.lastIndexOf(":");
    return separator === -1 ? code : code.slice(separator).replace(/^:/, "");
  }

  function grantOf(raw) {
    var grant = { expiresAt: raw && typeof raw.expiresAt === "string" ? raw.expiresAt : "", entities: {} };
    var types = raw && Array.isArray(raw.types) ? raw.types : [];
    types.forEach(function (type) {
      if (!type || typeof type !== "object") return;
      var kind = entityKind(type.entityType);
      if (!kind) return;
      var slot = grant.entities[kind] || (grant.entities[kind] = { readable: false, writable: false, events: [], entries: {} });
      var events = (Array.isArray(type.events) ? type.events : []).map(eventCodeOf).filter(Boolean);
      var scoped = idList(type.entityIds !== undefined ? type.entityIds : type.entityId);
      if (type.canRead === true) slot.readable = true;
      if (type.canWrite === true) slot.writable = true;
      if (scoped.length) {
        scoped.forEach(function (id) {
          var bucket = slot.entries[id] || (slot.entries[id] = []);
          events.forEach(function (code) { if (bucket.indexOf(code) === -1) bucket.push(code); });
        });
        return;
      }
      events.forEach(function (code) { if (slot.events.indexOf(code) === -1) slot.events.push(code); });
    });
    return grant;
  }

  function canRead(grant, kind) {
    return Boolean(grant && grant.entities && grant.entities[kind] && grant.entities[kind].readable);
  }

  function eventGranted(grant, kind, id, code) {
    var slot = grant && grant.entities && grant.entities[kind];
    if (!slot) return false;
    if (slot.events.indexOf(code) !== -1) return true;
    var entry = slot.entries[id];
    return Boolean(entry && entry.indexOf(code) !== -1);
  }

  function formatMoney(value, currency, locale) {
    var number = finiteOrNull(value);
    if (number === null) return "";
    var code = /^[A-Z]{3}$/.test(text(currency)) ? text(currency) : "";
    var digits = { minimumFractionDigits: 2, maximumFractionDigits: 6 };
    try {
      if (code) return new Intl.NumberFormat(locale, { style: "currency", currency: code, minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(number);
    } catch (_) {
      return new Intl.NumberFormat(locale, digits).format(number);
    }
    return new Intl.NumberFormat(locale, digits).format(number);
  }

  function formatQuantity(value, locale) {
    var number = finiteOrNull(value);
    if (number === null) return "";
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 6 }).format(number);
  }

  function formatDate(value, locale) {
    var date = null;
    var utc = false;
    if (typeof value === "number" && isFinite(value)) {
      date = new Date(value);
    } else if (typeof value === "string" && value.trim()) {
      var day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
      if (day) {
        date = new Date(Date.UTC(Number(day[1]), Number(day[2]) - 1, Number(day[3])));
        utc = true;
      } else {
        date = new Date(value.trim());
      }
    }
    if (!date || !isFinite(date.getTime())) return "";
    try {
      return new Intl.DateTimeFormat(locale, utc ? { dateStyle: "medium", timeZone: "UTC" } : { dateStyle: "medium" }).format(date);
    } catch (_) {
      return "";
    }
  }

  function decodeEntities(value) {
    return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, function (match, name) {
      var lower = name.toLowerCase();
      if (lower === "amp") return "&";
      if (lower === "lt") return "<";
      if (lower === "gt") return ">";
      if (lower === "quot") return "\"";
      if (lower === "apos") return "'";
      if (lower === "nbsp") return " ";
      var point = lower.charAt(1) === "x" ? parseInt(lower.slice(2), 16) : parseInt(lower.slice(1), 10);
      return isFinite(point) && point > 0 && point <= 1114111 ? String.fromCodePoint(point) : match;
    });
  }

  function termsBlocks(value) {
    var source = typeof value === "string" ? value.replace(/\r\n?/g, "\n") : "";
    if (!source.trim()) return [];
    if (/<\/?[a-z][^>]*>/i.test(source)) {
      source = decodeEntities(source
        .replace(/<\s*br\s*\/?\s*>/gi, "\n")
        .replace(/<\s*h[1-6](\s[^>]*)?>/gi, "\n\n# ")
        .replace(/<\s*li(\s[^>]*)?>/gi, "\n- ")
        .replace(/<\s*\/\s*(p|div|h[1-6]|ul|ol|li|section|article|blockquote|table|tr)\s*>/gi, "\n\n")
        .replace(/<\s*(p|div|ul|ol|section|article|blockquote|table|tr)(\s[^>]*)?>/gi, "\n\n")
        .replace(/<[^>]*>/g, ""));
    }
    var blocks = [];
    source.split(/\n[ \t]*\n+/).forEach(function (chunk) {
      var paragraph = [];
      function flush() {
        if (paragraph.length) blocks.push({ kind: "paragraph", text: paragraph.join("\n") });
        paragraph = [];
      }
      chunk.split("\n").forEach(function (line) {
        var trimmed = line.replace(/\s+/g, " ").trim();
        if (!trimmed) return;
        var heading = /^#{1,6}\s+(.+)$/.exec(trimmed);
        var item = /^[-*•]\s+(.+)$/.exec(trimmed);
        if (heading) {
          flush();
          blocks.push({ kind: "heading", text: heading[1] });
        } else if (item) {
          flush();
          blocks.push({ kind: "item", text: item[1] });
        } else {
          paragraph.push(trimmed);
        }
      });
      flush();
    });
    return blocks;
  }

  function inputTokens(inputFormat) {
    return String(inputFormat || "").split(/[\s;]+/).filter(Boolean);
  }

  function fieldOf(definition, locale) {
    var tokens = inputTokens(definition.inputFormat);
    var choices = (Array.isArray(definition.options) ? definition.options : []).map(function (option) {
      var value = text(option && option.value);
      return { value: value, label: localizedName(option && option.nls, locale) || value };
    }).filter(function (option) { return option.value; });
    var kind = "text";
    if (choices.length) kind = tokens.indexOf("expanded") !== -1 ? "radio" : "select";
    else if (/Boolean$|^boolean$/.test(text(definition.className))) kind = "boolean";
    else if (tokens.indexOf("address") !== -1) kind = "address";
    else if (tokens.indexOf("textarea") !== -1) kind = "textarea";
    else if (tokens.indexOf("email") !== -1) kind = "email";
    else if (tokens.indexOf("tel") !== -1) kind = "tel";
    return {
      code: definition.code,
      kind: kind,
      label: localizedName(definition.nls, locale) || definition.code,
      required: definition.required === true,
      choices: choices,
    };
  }

  function detailFields(definition, locale) {
    var attributes = definition && Array.isArray(definition.attributes) ? definition.attributes : [];
    var byCode = {};
    attributes.forEach(function (attribute) { if (attribute && attribute.code) byCode[attribute.code] = attribute; });
    var ordered = [];
    var hidden = [];
    (definition && Array.isArray(definition.attributeOrder) ? definition.attributeOrder : []).forEach(function (entry) {
      Object.keys(entry || {}).forEach(function (group) {
        (Array.isArray(entry[group]) ? entry[group] : []).forEach(function (row) {
          var code = row && row.attributeCode;
          if (!byCode[code] || ordered.indexOf(code) !== -1 || hidden.indexOf(code) !== -1) return;
          if (row.visible === false) hidden.push(code);
          else ordered.push(code);
        });
      });
    });
    attributes.forEach(function (attribute) {
      if (attribute && ordered.indexOf(attribute.code) === -1 && hidden.indexOf(attribute.code) === -1) ordered.push(attribute.code);
    });
    return ordered.map(function (code) { return fieldOf(byCode[code], locale); });
  }

  function primaryContact(account) {
    var contacts = account && Array.isArray(account.contacts)
      ? account.contacts.filter(function (contact) { return contact && typeof contact === "object"; })
      : [];
    var primary = contacts.filter(function (contact) { return text(contact.type && contact.type.code).toUpperCase() === "PRIMARY"; })[0];
    return primary || contacts[0] || null;
  }

  function contactEntry(contact, typeCode) {
    var entries = contact && Array.isArray(contact.contactEntries) ? contact.contactEntries : [];
    var found = entries.filter(function (entry) {
      return entry && text(entry.type && entry.type.code).toUpperCase() === typeCode && text(entry.value);
    })[0];
    return found ? text(found.value) : "";
  }

  function formatAddress(address, locale) {
    if (!address || typeof address !== "object") return "";
    var region = text(address.state && address.state.code) || localizedName(address.state && address.state.nls, locale);
    var country = localizedName(address.country && address.country.nls, locale) || text(address.country && address.country.code);
    var regionLine = [region, text(address.postalCode)].filter(Boolean).join(" ");
    var cityLine = [text(address.city), regionLine].filter(Boolean).join(", ");
    return [text(address.address1), text(address.address2), cityLine, country].filter(Boolean).join(", ");
  }

  function billingAddress(account, locale) {
    var entries = account && Array.isArray(account.addresses) ? account.addresses : [];
    var billing = entries.filter(function (entry) {
      return entry && Array.isArray(entry.types) && entry.types.some(function (type) {
        return text(type && type.code).toUpperCase() === "BILLING";
      });
    })[0];
    return billing ? formatAddress(billing.address, locale) : "";
  }

  function detailsPrefill(account, fields, locale) {
    var values = {};
    if (!account || typeof account !== "object") return values;
    var contact = primaryContact(account);
    var derived = {
      LEGAL_NAME: localizedName(account.nls, locale),
      BILLING_ADDRESS: billingAddress(account, locale),
      REPRESENTATIVE_FIRST_NAME: contact ? text(contact.firstName) : "",
      REPRESENTATIVE_LAST_NAME: contact ? text(contact.lastName) : "",
      REPRESENTATIVE_EMAIL: contactEntry(contact, "EMAIL"),
      REPRESENTATIVE_PHONE: contactEntry(contact, "PHONE"),
    };
    fields.forEach(function (field) {
      if (field.kind === "boolean") return;
      var value = attributeText(account, field.code) || text(derived[field.code]);
      if (!value) return;
      if (field.choices.length && !field.choices.some(function (option) { return option.value === value; })) return;
      values[field.code] = value;
    });
    return values;
  }

  function partiesOf(agreement, account, fields, locale, contract) {
    var codes = contract.agreementAttributes;
    var owner = agreement && agreement[contract.rawShape.documentOwner];
    var contact = primaryContact(account);
    function stated(code) {
      return attributeText(agreement, code) || attributeText(account, code);
    }
    var typeField = fields.filter(function (field) { return field.code === "CLIENT_TYPE"; })[0];
    var typeValue = stated("CLIENT_TYPE");
    var typeChoice = typeField ? typeField.choices.filter(function (option) { return option.value === typeValue; })[0] : null;
    var first = stated("REPRESENTATIVE_FIRST_NAME") || (contact ? text(contact.firstName) : "");
    var last = stated("REPRESENTATIVE_LAST_NAME") || (contact ? text(contact.lastName) : "");
    return {
      provider: {
        legalName: attributeText(agreement, codes.providerLegalName) || localizedName(owner && owner.nls, locale),
        representativeName: attributeText(agreement, codes.providerRepresentativeName),
        representativeJobTitle: attributeText(agreement, codes.providerRepresentativeJobTitle),
      },
      client: {
        legalName: stated("LEGAL_NAME") || localizedName(account && account.nls, locale),
        clientType: typeChoice ? typeChoice.label : "",
        billingAddress: stated("BILLING_ADDRESS") || billingAddress(account, locale),
        representativeName: [first, last].filter(Boolean).join(" "),
        representativeJobTitle: stated("REPRESENTATIVE_JOB_TITLE"),
        email: stated("REPRESENTATIVE_EMAIL") || contactEntry(contact, "EMAIL"),
        phone: stated("REPRESENTATIVE_PHONE") || contactEntry(contact, "PHONE"),
      },
    };
  }

  function linesOf(row, currency, locale, contract) {
    var raw = row && Array.isArray(row[contract.rawShape.orderLines]) ? row[contract.rawShape.orderLines] : [];
    return raw
      .map(function (line, position) {
        return { line: line, position: position, rank: line && typeof line === "object" ? finiteOrNull(line.sortOrder) : null };
      })
      .filter(function (entry) { return entry.line && typeof entry.line === "object"; })
      .sort(function (left, right) {
        if (left.rank === null && right.rank === null) return ascending(left.position, right.position);
        if (left.rank === null) return 1;
        if (right.rank === null) return -1;
        return ascending(left.rank, right.rank) || ascending(left.position, right.position);
      })
      .map(function (entry) {
        var line = entry.line;
        var price = line.itemPrice && typeof line.itemPrice === "object" ? line.itemPrice : null;
        var lineId = positiveInteger(line.id);
        return {
          key: lineId ? "line-" + lineId : "position-" + entry.position,
          product: localizedName(price && price.product && price.product.nls, locale) || localizedName(price && price.nls, locale),
          quantity: formatQuantity(line.itemCount, locale),
          unitPrice: formatMoney(line.amount, currency, locale),
        };
      });
  }

  function optionOf(row, position, context) {
    var contract = context.contract;
    var id = positiveInteger(row.id);
    var state = stateCode(row, contract.orderStates);
    var status = ORDER_STATUS[state] || "unknown";
    var currency = text(row.currency && row.currency.code);
    var model = attributeText(row, contract.orderAttributes.pricingModel).toUpperCase();
    var priced = PRICED_STATUSES.indexOf(status) !== -1;
    return {
      id: id,
      recordKey: "order:" + id,
      position: position,
      model: contract.pricingModels.indexOf(model) !== -1 ? model : "",
      state: state,
      status: status,
      priced: priced,
      lines: priced ? linesOf(row, currency, context.locale, contract) : [],
      total: priced ? formatMoney(row.grandTotal, currency, context.locale) : "",
      awaitingClient: state === contract.orderEvents.view.source || state === contract.orderEvents.approve.source,
      siblingApproved: false,
      actions: { view: false, approve: false, decline: false, changes: false },
    };
  }

  function propertyStatus(options) {
    var statuses = options.map(function (option) { return option.status; });
    if (statuses.indexOf("approved") !== -1) return "approved";
    if (statuses.length && statuses.every(function (status) { return status === "declined"; })) return "declined";
    if (statuses.indexOf("changes") !== -1 || statuses.indexOf("revising") !== -1) return "changes";
    if (statuses.indexOf("new") !== -1 || statuses.indexOf("viewed") !== -1) return "awaiting";
    return "unknown";
  }

  function propertiesOf(rows, context) {
    var contract = context.contract;
    var groups = [];
    var byKey = {};
    rows.forEach(function (row) {
      var propertyId = positiveInteger(attributeValue(row, contract.orderAttributes.property));
      var key = propertyId ? "property-" + propertyId : "order-" + row.id;
      var group = byKey[key];
      if (!group) {
        group = byKey[key] = { key: key, address: "", rows: [] };
        groups.push(group);
      }
      group.rows.push(row);
      if (!group.address) group.address = attributeText(row, contract.orderAttributes.address);
    });
    return groups.map(function (group) {
      var options = group.rows.map(function (row, index) { return optionOf(row, index + 1, context); });
      options.forEach(function (option) {
        option.siblingApproved = options.some(function (other) { return other.id !== option.id && other.status === "approved"; });
      });
      return { key: group.key, address: group.address, options: options, status: propertyStatus(options) };
    });
  }

  function grantActions(properties, grant, contract) {
    var events = contract.orderEvents;
    properties.forEach(function (property) {
      property.options.forEach(function (option) {
        function allowed(event) {
          return !option.siblingApproved && option.state === event.source && eventGranted(grant, "order", option.id, event.code);
        }
        option.actions = {
          view: allowed(events.view),
          approve: allowed(events.approve),
          decline: allowed(events.decline),
          changes: allowed(events.changes),
        };
      });
    });
  }

  function summaryOf(properties) {
    var counts = { properties: properties.length, awaiting: 0, approved: 0, declined: 0, changes: 0 };
    properties.forEach(function (property) {
      if (["awaiting", "approved", "declined", "changes"].indexOf(property.status) !== -1) counts[property.status] += 1;
    });
    return counts;
  }

  function pickAgreement(rows, contract) {
    var documents = (Array.isArray(rows) ? rows : []).filter(function (row) {
      return row && typeof row === "object" && positiveInteger(row.id);
    });
    var typed = documents.filter(function (row) { return text(row.type && row.type.code) === contract.agreementType; });
    var untyped = documents.filter(function (row) { return !text(row.type && row.type.code); });
    var candidates = typed.length ? typed : untyped;
    if (candidates.length === 1) return { row: candidates[0], ambiguous: false };
    return { row: null, ambiguous: candidates.length > 1 };
  }

  function pickAccount(accounts, agreement, contract) {
    var rows = (Array.isArray(accounts) ? accounts : []).filter(function (row) { return row && typeof row === "object"; });
    var clientId = positiveInteger(attributeValue(agreement, contract.agreementAttributes.client));
    var matched = clientId ? rows.filter(function (row) { return positiveInteger(row.id) === clientId; })[0] : null;
    return matched || (rows.length === 1 ? rows[0] : null);
  }

  function packageOrderIds(documents, contract) {
    var picked = pickAgreement(documents, contract);
    if (!picked.row || attributeEntry(picked.row, contract.agreementAttributes.orders) === null) return null;
    return idList(attributeValue(picked.row, contract.agreementAttributes.orders));
  }

  function reviewModel(input, options) {
    var locale = options.locale;
    var contract = options.contract;
    var grant = input.grant || grantOf(null);
    var expiresAt = formatDate(grant.expiresAt, locale);
    var picked = pickAgreement(input.documents, contract);
    if (!picked.row) {
      return {
        kind: picked.ambiguous ? "unavailable" : "empty",
        reason: picked.ambiguous ? "ambiguous" : "no-agreement",
        expiresAt: expiresAt,
      };
    }

    var agreement = picked.row;
    var agreementId = positiveInteger(agreement.id);
    var state = stateCode(agreement, contract.agreementStates);
    var disposition = AGREEMENT_DISPOSITION[state] || { kind: "unavailable", reason: "unknown-state" };
    var account = pickAccount(input.accounts, agreement, contract);
    var fields = detailFields(contract.contractDetails, locale);
    var parties = partiesOf(agreement, account, fields, locale, contract);

    var ordersById = {};
    (Array.isArray(input.orders) ? input.orders : []).forEach(function (row) {
      var id = positiveInteger(row && row.id);
      if (id && !ordersById[id]) ordersById[id] = row;
    });
    var listed = packageOrderIds([agreement], contract);
    var wanted = listed || Object.keys(ordersById).map(Number).sort(ascending);
    var readable = [];
    var unreadable = 0;
    wanted.forEach(function (id) {
      if (ordersById[id]) readable.push(ordersById[id]);
      else unreadable += 1;
    });

    var properties = propertiesOf(readable, { locale: locale, contract: contract });
    if (state === "QUOTATION_SENT") grantActions(properties, grant, contract);
    var detailsEvent = contract.agreementEvents.details;
    var approveEvent = contract.agreementEvents.approve;
    var user = account ? account[contract.rawShape.accountUser] : null;

    return {
      kind: disposition.kind,
      reason: disposition.reason || "",
      banner: disposition.banner || "",
      completion: disposition.completion || "",
      expiresAt: expiresAt,
      agreement: {
        id: agreementId,
        recordKey: "document:" + agreementId,
        state: state,
        effectiveDate: formatDate(attributeValue(agreement, contract.agreementAttributes.effectiveDate), locale),
        termStart: formatDate(attributeValue(agreement, contract.agreementAttributes.termStart), locale),
        termEnd: formatDate(attributeValue(agreement, contract.agreementAttributes.termEnd), locale),
        terms: termsBlocks(agreement[contract.rawShape.documentContent]),
      },
      names: {
        provider: parties.provider.legalName,
        client: localizedName(account && account.nls, locale) || parties.client.legalName,
      },
      parties: parties,
      properties: properties,
      summary: summaryOf(properties),
      allDecided: properties.length > 0 && properties.every(function (property) {
        return property.status === "approved" || property.status === "declined";
      }),
      unreadableOrders: unreadable,
      accountUnavailable: Boolean(input.accountFailed),
      details: {
        available: state === detailsEvent.source && eventGranted(grant, "document", agreementId, detailsEvent.code),
        fields: fields,
        prefill: detailsPrefill(account, fields, locale),
      },
      canApproveAgreement: state === approveEvent.source && eventGranted(grant, "document", agreementId, approveEvent.code),
      portalAccess: Boolean(user && typeof user === "object" && positiveInteger(user.id)),
    };
  }

  ns.normalizer = Object.freeze({
    orderStatus: Object.freeze(Object.assign({}, ORDER_STATUS)),
    agreementDisposition: Object.freeze(Object.assign({}, AGREEMENT_DISPOSITION)),
    positiveInteger: positiveInteger,
    attributeValue: attributeValue,
    idList: idList,
    stateCode: stateCode,
    entityKind: entityKind,
    grantOf: grantOf,
    canRead: canRead,
    eventGranted: eventGranted,
    formatMoney: formatMoney,
    formatQuantity: formatQuantity,
    formatDate: formatDate,
    termsBlocks: termsBlocks,
    detailFields: detailFields,
    detailsPrefill: detailsPrefill,
    pickAgreement: pickAgreement,
    pickAccount: pickAccount,
    packageOrderIds: packageOrderIds,
    propertyStatus: propertyStatus,
    reviewModel: reviewModel,
  });
})(typeof window !== "undefined" ? window : globalThis);
(function (global) {
  "use strict";

  var ns = global.ClientReview || (global.ClientReview = {});

  var OPTION_BADGE = {
    new: ["status-badge--info", "optionNew"],
    viewed: ["status-badge--info", "optionViewed"],
    approved: ["status-badge--ok", "optionApproved"],
    declined: ["status-badge--danger", "optionDeclined"],
    changes: ["status-badge--warn", "optionChanges"],
    revising: ["status-badge--warn", "optionRevising"],
    unknown: ["status-badge--scheduled", "optionUnknown"],
  };

  var PROPERTY_BADGE = {
    awaiting: ["status-badge--info", "propertyAwaiting"],
    approved: ["status-badge--ok", "propertyApproved"],
    declined: ["status-badge--danger", "propertyDeclined"],
    changes: ["status-badge--warn", "propertyChanges"],
    unknown: ["status-badge--scheduled", "propertyUnknown"],
  };

  var MODEL_COPY = { SEASONAL: "modelSeasonal", MONTHLY: "modelMonthly", PER_SERVICE: "modelPerService" };

  var AUTOCOMPLETE = {
    LEGAL_NAME: "organization",
    BILLING_ADDRESS: "street-address",
    REPRESENTATIVE_FIRST_NAME: "given-name",
    REPRESENTATIVE_LAST_NAME: "family-name",
    REPRESENTATIVE_JOB_TITLE: "organization-title",
    REPRESENTATIVE_EMAIL: "email",
    REPRESENTATIVE_PHONE: "tel",
  };

  function el(tag, className, attrs) {
    var node = global.document.createElement(tag);
    if (className) node.className = className;
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value === undefined || value === null || value === false) return;
        node.setAttribute(key, value === true ? "" : String(value));
      });
    }
    return node;
  }

  function text(tag, className, value, attrs) {
    var node = el(tag, className, attrs);
    node.textContent = value === null || value === undefined ? "" : String(value);
    return node;
  }

  function mark(ctx, node, key) {
    node.setAttribute("data-focus-key", key);
    ctx.focus[key] = node;
    return node;
  }

  function button(label, variant, onClick, attrs) {
    var node = text("button", "btn " + variant, label, Object.assign({ type: "button" }, attrs || {}));
    if (typeof onClick === "function") node.addEventListener("click", onClick);
    return node;
  }

  function badge(map, status, copy) {
    var entry = map[status] || map.unknown;
    return text("span", "status-badge " + entry[0], copy[entry[1]], { "data-state": status });
  }

  function optionLabel(option, copy) {
    return option.model ? copy[MODEL_COPY[option.model]] : ns.fill(copy.optionFallback, { n: option.position });
  }

  function isPending(command) {
    return Boolean(command && command.status === "pending");
  }

  function stateCard(tone, glyph, title, body, action) {
    var card = el("section", "cr-panel cr-state cr-state--" + tone, { "data-state": tone, role: tone === "error" ? "alert" : "status" });
    card.appendChild(text("div", "cr-state__glyph", glyph, { "aria-hidden": "true" }));
    card.appendChild(text("h1", "cr-state__title", title));
    if (body) card.appendChild(text("p", "cr-state__body", body));
    if (action) card.appendChild(action);
    return card;
  }

  function notice(tone, title, body, action) {
    var box = el("div", "cr-notice cr-notice--" + tone, { role: "status", "data-state": tone });
    box.appendChild(text("span", "cr-notice__icon", tone === "ok" ? "✓" : tone === "warn" ? "!" : "i", { "aria-hidden": "true" }));
    var content = el("div", "cr-notice__body");
    if (title) content.appendChild(text("p", "cr-notice__title", title));
    if (body) content.appendChild(text("p", "cr-notice__text", body));
    box.appendChild(content);
    if (action) box.appendChild(action);
    return box;
  }

  function refreshButton(ctx, recordKey, label) {
    return button(label, "btn--ghost", function () { ctx.dispatch("refresh", { recordKey: recordKey }); }, {
      disabled: ctx.busy,
      "data-action": "refresh",
      "aria-busy": ctx.snapshot.refreshing ? "true" : null,
    });
  }

  function skeletonBar(extra) {
    return el("span", "skeleton cr-skeleton__bar " + extra, { "aria-hidden": "true" });
  }

  function skeleton(copy) {
    var wrap = el("div", "cr-skeleton", { "data-state": "loading", role: "status", "aria-label": copy.loadingLabel });
    var head = el("div", "cr-head");
    head.appendChild(skeletonBar("cr-skeleton__eyebrow"));
    head.appendChild(skeletonBar("cr-skeleton__title"));
    head.appendChild(skeletonBar("cr-skeleton__sub"));
    wrap.appendChild(head);
    var summary = el("div", "cr-summary");
    for (var tile = 0; tile < 5; tile += 1) summary.appendChild(skeletonBar("cr-skeleton__tile"));
    wrap.appendChild(summary);
    for (var card = 0; card < 2; card += 1) {
      var property = el("div", "cr-property cr-skeleton__property");
      var propertyHead = el("div", "cr-property__head");
      propertyHead.appendChild(skeletonBar("cr-skeleton__pin"));
      propertyHead.appendChild(skeletonBar("cr-skeleton__address"));
      property.appendChild(propertyHead);
      for (var row = 0; row < 3; row += 1) {
        var line = el("div", "cr-skeleton__row");
        line.appendChild(skeletonBar("cr-skeleton__label"));
        line.appendChild(skeletonBar("cr-skeleton__chip"));
        property.appendChild(line);
      }
      wrap.appendChild(property);
    }
    return wrap;
  }

  function pageHead(ctx, eyebrow, title, subtitle, badgeNode) {
    var view = ctx.snapshot.view;
    var copy = ctx.copy;
    var head = el("header", "cr-head");
    var top = el("div", "cr-head__top");
    top.appendChild(text("p", "cr-eyebrow", eyebrow));
    if (badgeNode) top.appendChild(badgeNode);
    head.appendChild(top);
    head.appendChild(text("h1", "cr-title", title));
    if (subtitle) head.appendChild(text("p", "cr-sub", subtitle));
    var meta = el("dl", "cr-meta");
    [[copy.fromLabel, view.names && view.names.provider], [copy.forLabel, view.names && view.names.client]].forEach(function (entry) {
      if (!entry[1]) return;
      var item = el("div", "cr-meta__item");
      item.appendChild(text("dt", "cr-meta__label", entry[0]));
      item.appendChild(text("dd", "cr-meta__value", entry[1]));
      meta.appendChild(item);
    });
    if (meta.children.length) head.appendChild(meta);
    if (view.expiresAt) head.appendChild(text("p", "cr-validity", ns.fill(copy.linkValidUntil, { date: view.expiresAt })));
    return head;
  }

  function readNotices(ctx) {
    var view = ctx.snapshot.view;
    var copy = ctx.copy;
    var found = [];
    if (view.unreadableOrders) {
      var body = ns.fill(view.unreadableOrders === 1 ? copy.partialOne : copy.partialMany, { n: view.unreadableOrders });
      found.push(notice("warn", "", body, refreshButton(ctx, "", copy.retryLabel)));
    }
    if (view.accountUnavailable && view.kind === "contract-details") found.push(notice("warn", "", copy.accountPartial, null));
    return found;
  }

  function summary(ctx) {
    var counts = ctx.snapshot.view.summary;
    var copy = ctx.copy;
    var section = el("section", "cr-summary", { "aria-label": copy.summaryLabel });
    [
      ["properties", copy.summaryProperties],
      ["awaiting", copy.summaryAwaiting],
      ["approved", copy.summaryApproved],
      ["declined", copy.summaryDeclined],
      ["changes", copy.summaryChanges],
    ].forEach(function (entry) {
      var item = el("div", "cr-summary__item", { "data-kind": entry[0] });
      item.appendChild(text("span", "cr-summary__label", entry[1]));
      item.appendChild(text("span", "cr-summary__value", String(counts[entry[0]])));
      section.appendChild(item);
    });
    return section;
  }

  function linesTable(ctx, option) {
    var copy = ctx.copy;
    if (!option.lines.length) return text("p", "cr-note", copy.linesEmpty);
    var wrap = el("div", "cr-lines-wrap");
    var table = el("table", "cr-lines");
    var head = el("thead");
    var headRow = el("tr");
    headRow.appendChild(text("th", "", copy.lineService, { scope: "col" }));
    headRow.appendChild(text("th", "cr-num", copy.lineQuantity, { scope: "col" }));
    headRow.appendChild(text("th", "cr-num", copy.lineUnitPrice, { scope: "col" }));
    head.appendChild(headRow);
    table.appendChild(head);
    var body = el("tbody");
    option.lines.forEach(function (line) {
      var row = el("tr", "", { "data-line": line.key });
      row.appendChild(text("td", "cr-lines__service" + (line.product ? "" : " cr-muted"), line.product || copy.serviceUnnamed, { "data-label": copy.lineService }));
      row.appendChild(text("td", "cr-num" + (line.quantity ? "" : " cr-muted"), line.quantity || copy.valueNotStated, { "data-label": copy.lineQuantity }));
      row.appendChild(text("td", "cr-num" + (line.unitPrice ? "" : " cr-muted"), line.unitPrice || copy.valueNotStated, { "data-label": copy.lineUnitPrice }));
      body.appendChild(row);
    });
    table.appendChild(body);
    wrap.appendChild(table);
    return wrap;
  }

  function optionContent(body, ctx, option) {
    var copy = ctx.copy;
    if (!option.priced) {
      body.appendChild(text("p", "cr-note", option.status === "revising" ? copy.noteRevising : copy.noteNoActions));
      return;
    }
    body.appendChild(linesTable(ctx, option));
    var total = el("div", "cr-total");
    total.appendChild(text("span", "cr-total__label", copy.orderTotal));
    total.appendChild(text("span", "cr-total__value" + (option.total ? "" : " cr-muted"), option.total || copy.valueNotStated));
    body.appendChild(total);
  }

  function outcomeBox(ctx, command, options) {
    var copy = ctx.copy;
    var settings = options || {};
    var refused = command.status === "refused";
    var box = el("div", "cr-outcome cr-outcome--" + command.status, { role: "alert", "data-state": command.status });
    box.appendChild(text("span", "cr-outcome__icon", "!", { "aria-hidden": "true" }));
    var content = el("div", "cr-outcome__body");
    var title = settings.title || (refused ? copy.refusedTitle : "");
    if (title) content.appendChild(text("p", "cr-outcome__title", title));
    var detail = refused ? command.message || copy.refusedFallback : settings.title ? "" : copy.failedBody;
    if (detail) content.appendChild(text("p", "cr-outcome__text", detail));
    box.appendChild(content);
    if (settings.action) box.appendChild(settings.action);
    return box;
  }

  function actionRow(ctx, option) {
    var copy = ctx.copy;
    var disabled = ctx.busy || isPending(ctx.snapshot.commands[option.recordKey]);
    var row = el("div", "cr-actions");
    function intent(kind) {
      return function () { ctx.dispatch("option.intent", { id: option.id, kind: kind }); };
    }
    if (option.actions.approve) row.appendChild(button(copy.approveLabel, "btn--primary btn--lg", intent("approve"), { disabled: disabled, "data-action": "option.approve" }));
    if (option.actions.changes) row.appendChild(button(copy.changesLabel, "btn--ghost btn--lg", intent("changes"), { disabled: disabled, "data-action": "option.changes" }));
    if (option.actions.decline) row.appendChild(button(copy.declineLabel, "btn--danger btn--lg", intent("decline"), { disabled: disabled, "data-action": "option.decline" }));
    return row;
  }

  function confirmPanel(ctx, property, option, confirm, pending) {
    var copy = ctx.copy;
    var label = optionLabel(option, copy);
    var kind = confirm.kind;
    var titleId = "cr-confirm-title-" + option.id;
    var panel = el("div", "cr-confirm cr-confirm--" + kind, { role: "group", "aria-labelledby": titleId, "data-state": pending ? "pending" : "open" });
    if (kind === "changes") {
      var invalid = Boolean(ctx.snapshot.draftInvalid[option.id]);
      var field = el("div", "cr-field", { "data-state": invalid ? "invalid" : "idle" });
      field.appendChild(text("label", "cr-field__label", copy.changesTitle, { for: "cr-draft-" + option.id, id: titleId }));
      var area = el("textarea", "cr-input cr-input--area", {
        id: "cr-draft-" + option.id,
        name: "MESSAGE",
        rows: 4,
        placeholder: copy.changesPlaceholder,
        "aria-required": "true",
        "aria-invalid": invalid ? "true" : null,
        "aria-describedby": "cr-draft-error-" + option.id,
        disabled: pending,
      });
      area.value = ctx.snapshot.drafts[option.id] || "";
      area.addEventListener("input", function () { ctx.dispatch("option.draft", { id: option.id, value: area.value }); });
      mark(ctx, area, "draft-" + option.id);
      field.appendChild(area);
      field.appendChild(text("p", "cr-field__error", invalid ? copy.changesRequired : "", { id: "cr-draft-error-" + option.id }));
      panel.appendChild(field);
    } else {
      panel.appendChild(text("p", "cr-confirm__title", ns.fill(kind === "approve" ? copy.approveConfirmTitle : copy.declineConfirmTitle, { option: label }), { id: titleId }));
      var others = property.options.some(function (other) { return other.id !== option.id && other.status !== "declined"; });
      var body = kind === "approve" ? (others ? copy.approveConfirmOthers : "") : copy.declineConfirmBody;
      if (body) panel.appendChild(text("p", "cr-confirm__body", body));
    }
    var actions = el("div", "cr-actions");
    var confirmLabel = pending ? copy.sendingLabel
      : kind === "approve" ? copy.approveConfirmButton
        : kind === "decline" ? copy.declineConfirmButton : copy.changesSend;
    var confirmButton = button(confirmLabel, kind === "decline" ? "btn--danger btn--lg" : "btn--primary btn--lg", function () {
      ctx.dispatch("option.confirm", { id: option.id });
    }, { disabled: pending || ctx.busy, "data-state": pending ? "pending" : null, "data-action": "option.confirm", "aria-busy": pending ? "true" : null });
    if (kind !== "changes") mark(ctx, confirmButton, "confirm-" + option.id);
    actions.appendChild(confirmButton);
    actions.appendChild(button(copy.cancelLabel, "btn--ghost btn--lg", function () {
      ctx.dispatch("option.cancel", { id: option.id });
    }, { disabled: pending, "data-action": "option.cancel" }));
    panel.appendChild(actions);
    return panel;
  }

  function optionFooter(body, ctx, property, option) {
    var copy = ctx.copy;
    var command = ctx.snapshot.commands[option.recordKey] || null;
    var pending = isPending(command);
    if (command && command.event === ns.contract.orderEvents.view.code) {
      if (pending) {
        body.appendChild(text("p", "cr-note cr-note--pending", copy.viewPending, { role: "status", "data-state": "pending" }));
        return;
      }
      body.appendChild(outcomeBox(ctx, command, {
        title: copy.viewFailed,
        action: button(copy.retryLabel, "btn--ghost", function () { ctx.dispatch("option.view", { id: option.id }); }, { disabled: ctx.busy, "data-action": "option.view" }),
      }));
      return;
    }
    if (option.siblingApproved && option.awaitingClient) {
      body.appendChild(text("p", "cr-note", copy.noteSiblingApproved));
      return;
    }
    var decisions = option.actions.approve || option.actions.decline || option.actions.changes;
    if (!decisions) {
      if (option.awaitingClient && !option.actions.view) body.appendChild(text("p", "cr-note", copy.noteNoActions));
      return;
    }
    var confirm = ctx.snapshot.confirm && ctx.snapshot.confirm.kind !== "agreement" && ctx.snapshot.confirm.id === option.id ? ctx.snapshot.confirm : null;
    body.appendChild(confirm ? confirmPanel(ctx, property, option, confirm, pending) : actionRow(ctx, option));
    if (command && !pending) {
      body.appendChild(outcomeBox(ctx, command, { action: refreshButton(ctx, option.recordKey, copy.refreshLabel) }));
    }
  }

  function optionItem(ctx, property, option) {
    var copy = ctx.copy;
    var expanded = Boolean(ctx.snapshot.expanded[option.id]);
    var bodyId = "cr-option-" + option.id;
    var item = el("li", "cr-option", { "data-state": option.status, "data-expanded": expanded ? "true" : "false" });
    var toggle = el("button", "cr-option__toggle", {
      type: "button",
      "aria-expanded": expanded ? "true" : "false",
      "aria-controls": expanded ? bodyId : null,
      "data-action": "option.toggle",
    });
    toggle.appendChild(text("span", "cr-option__label", optionLabel(option, copy)));
    toggle.appendChild(badge(OPTION_BADGE, option.status, copy));
    toggle.appendChild(text("span", "cr-visually-hidden", expanded ? copy.hideOption : copy.showOption));
    toggle.appendChild(el("span", "cr-option__chevron", { "aria-hidden": "true" }));
    toggle.addEventListener("click", function () { ctx.dispatch("option.toggle", { id: option.id }); });
    mark(ctx, toggle, "toggle-" + option.id);
    item.appendChild(toggle);
    if (!expanded) return item;
    var body = el("div", "cr-option__body", { id: bodyId });
    optionContent(body, ctx, option);
    optionFooter(body, ctx, property, option);
    item.appendChild(body);
    return item;
  }

  function optionStatic(ctx, option) {
    var item = el("li", "cr-option cr-option--static", { "data-state": option.status });
    item.appendChild(text("p", "cr-option__head", optionLabel(option, ctx.copy)));
    var body = el("div", "cr-option__body");
    optionContent(body, ctx, option);
    item.appendChild(body);
    return item;
  }

  function propertyCard(ctx, property, interactive) {
    var copy = ctx.copy;
    var headingId = "cr-" + property.key;
    var card = el("section", "cr-property", { "data-state": property.status, "aria-labelledby": headingId });
    var head = el("header", "cr-property__head");
    head.appendChild(el("span", "cr-pin", { "aria-hidden": "true" }));
    var identity = el("div", "cr-property__identity");
    identity.appendChild(text("h2", "cr-property__address" + (property.address ? "" : " cr-muted"), property.address || copy.addressUnavailable, { id: headingId }));
    identity.appendChild(text("p", "cr-property__meta", property.options.length === 1 ? copy.optionsOne : ns.fill(copy.optionsMany, { n: property.options.length })));
    head.appendChild(identity);
    if (interactive) head.appendChild(badge(PROPERTY_BADGE, property.status, copy));
    card.appendChild(head);
    var list = el("ol", "cr-options");
    property.options.forEach(function (option) {
      list.appendChild(interactive ? optionItem(ctx, property, option) : optionStatic(ctx, option));
    });
    card.appendChild(list);
    return card;
  }

  function quoteReview(shell, ctx) {
    var view = ctx.snapshot.view;
    var copy = ctx.copy;
    shell.appendChild(pageHead(ctx, copy.quoteEyebrow, copy.quoteTitle, copy.quoteSubtitle, null));
    shell.appendChild(summary(ctx));
    readNotices(ctx).forEach(function (node) { shell.appendChild(node); });
    if (view.allDecided) shell.appendChild(notice("ok", copy.decidedTitle, copy.decidedBody, refreshButton(ctx, "", copy.checkAgain)));
    if (!view.properties.length && !view.unreadableOrders) {
      shell.appendChild(stateCard("neutral", "○", copy.emptyTitle, copy.emptyBody, null));
      return;
    }
    var list = el("div", "cr-properties");
    view.properties.forEach(function (property) { list.appendChild(propertyCard(ctx, property, true)); });
    shell.appendChild(list);
  }

  function fieldNode(ctx, field, pending) {
    var details = ctx.snapshot.details;
    var copy = ctx.copy;
    var id = "cr-field-" + field.code;
    var errorId = id + "-error";
    var clientError = details.touched[field.code] ? details.errors[field.code] || "" : "";
    var message = clientError || details.serverErrors[field.code] || "";
    var wrap = el("div", "cr-field", { "data-code": field.code, "data-kind": field.kind, "data-state": message ? "invalid" : "idle" });
    var errorNode = text("p", "cr-field__error", message, { id: errorId, role: message ? "alert" : null });
    var control;

    function common(extra) {
      return Object.assign({
        id: id,
        name: field.code,
        "aria-describedby": errorId,
        "aria-invalid": message ? "true" : null,
        "aria-required": field.required ? "true" : null,
        disabled: pending,
      }, extra || {});
    }

    function patch(next) {
      var current = next || "";
      wrap.setAttribute("data-state", current ? "invalid" : "idle");
      errorNode.textContent = current;
      if (current) control.setAttribute("aria-invalid", "true");
      else control.removeAttribute("aria-invalid");
    }

    if (field.kind !== "boolean") {
      var label = el("label", "cr-field__label", { for: id });
      label.appendChild(text("span", "", field.label));
      if (field.required) label.appendChild(text("span", "cr-req", "*", { "aria-hidden": "true" }));
      wrap.appendChild(label);
    }

    if (field.kind === "boolean") {
      var toggle = el("label", "cr-choice", { for: id });
      control = el("input", "cr-choice__input", common({ type: "checkbox" }));
      control.checked = details.values[field.code] === true;
      control.addEventListener("change", function () { patch(ctx.dispatch("details.choose", { code: field.code, value: control.checked })); });
      toggle.appendChild(control);
      toggle.appendChild(el("span", "cr-check", { "aria-hidden": "true" }));
      var caption = text("span", "cr-choice__label", field.label);
      if (field.required) caption.appendChild(text("span", "cr-req", "*", { "aria-hidden": "true" }));
      toggle.appendChild(caption);
      wrap.appendChild(toggle);
    } else if (field.kind === "select") {
      control = el("select", "cr-input cr-select", common());
      var blank = text("option", "", copy.selectPlaceholder);
      blank.value = "";
      control.appendChild(blank);
      field.choices.forEach(function (choice) {
        var option = text("option", "", choice.label);
        option.value = choice.value;
        if (details.values[field.code] === choice.value) option.selected = true;
        control.appendChild(option);
      });
      control.value = details.values[field.code] || "";
      control.addEventListener("change", function () { patch(ctx.dispatch("details.choose", { code: field.code, value: control.value })); });
      wrap.appendChild(control);
    } else if (field.kind === "radio") {
      control = el("div", "cr-choices", { role: "radiogroup", id: id, "aria-describedby": errorId, "aria-required": field.required ? "true" : null });
      field.choices.forEach(function (choice, index) {
        var row = el("label", "cr-choice");
        var input = el("input", "cr-choice__input", { type: "radio", name: field.code, value: choice.value, id: index === 0 ? id + "-first" : null, disabled: pending });
        input.checked = details.values[field.code] === choice.value;
        input.addEventListener("change", function () { patch(ctx.dispatch("details.choose", { code: field.code, value: choice.value })); });
        row.appendChild(input);
        row.appendChild(el("span", "cr-radio", { "aria-hidden": "true" }));
        row.appendChild(text("span", "cr-choice__label", choice.label));
        control.appendChild(row);
      });
      wrap.appendChild(control);
    } else {
      var area = field.kind === "textarea";
      control = el(area ? "textarea" : "input", area ? "cr-input cr-input--area" : "cr-input", common(area ? { rows: 4 } : {
        type: field.kind === "email" ? "email" : field.kind === "tel" ? "tel" : "text",
        inputmode: field.kind === "tel" ? "tel" : field.kind === "email" ? "email" : null,
        autocomplete: AUTOCOMPLETE[field.code] || null,
      }));
      control.value = details.values[field.code] || "";
      control.addEventListener("input", function () { patch(ctx.dispatch("details.input", { code: field.code, value: control.value })); });
      control.addEventListener("blur", function () { patch(ctx.dispatch("details.blur", { code: field.code })); });
      wrap.appendChild(control);
    }
    mark(ctx, control, "field-" + field.code);
    wrap.appendChild(errorNode);
    return wrap;
  }

  function detailsForm(ctx) {
    var view = ctx.snapshot.view;
    var copy = ctx.copy;
    var card = el("section", "cr-panel cr-form-card", { "aria-labelledby": "cr-details-title" });
    card.appendChild(text("h2", "cr-section-title", copy.detailsFormTitle, { id: "cr-details-title" }));
    if (!view.details.available) {
      card.appendChild(text("p", "cr-note", copy.detailsUnavailable));
      return card;
    }
    var command = ctx.snapshot.commands[view.agreement.recordKey] || null;
    var pending = isPending(command);
    var form = el("form", "cr-form", { novalidate: true, "data-state": pending ? "pending" : "idle" });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      ctx.dispatch("details.submit");
    });
    var fields = el("div", "cr-fields");
    view.details.fields.forEach(function (field) { fields.appendChild(fieldNode(ctx, field, pending)); });
    form.appendChild(fields);
    var details = ctx.snapshot.details;
    var invalid = view.details.fields.some(function (field) { return details.touched[field.code] && details.errors[field.code]; });
    if (details.invalid && invalid) form.appendChild(notice("warn", "", copy.detailsInvalid, null));
    if (command && command.status === "refused") {
      var mapped = Object.keys(details.serverErrors).length > 0;
      if (command.message || !mapped) {
        form.appendChild(outcomeBox(ctx, { status: "refused", message: command.message }, { title: copy.detailsRefusedTitle }));
      }
    }
    if (command && command.status === "failed") {
      form.appendChild(outcomeBox(ctx, command, { action: refreshButton(ctx, view.agreement.recordKey, copy.refreshLabel) }));
    }
    var actions = el("div", "cr-form-actions");
    actions.appendChild(text("button", "btn btn--primary btn--lg", pending ? copy.sendingLabel : copy.detailsSubmit, {
      type: "submit",
      disabled: pending || ctx.busy,
      "data-state": pending ? "pending" : null,
      "data-action": "details.submit",
      "aria-busy": pending ? "true" : null,
    }));
    form.appendChild(actions);
    card.appendChild(form);
    return card;
  }

  function approvedEntries(view) {
    var entries = [];
    view.properties.forEach(function (property) {
      property.options.forEach(function (option) {
        if (option.status === "approved") entries.push({ address: property.address, option: option });
      });
    });
    return entries;
  }

  function contractDetails(shell, ctx) {
    var view = ctx.snapshot.view;
    var copy = ctx.copy;
    shell.appendChild(pageHead(ctx, copy.detailsEyebrow, copy.detailsTitle, copy.detailsSubtitle, null));
    readNotices(ctx).forEach(function (node) { shell.appendChild(node); });
    var approved = approvedEntries(view);
    if (approved.length) {
      var section = el("section", "cr-panel cr-approved", { "aria-labelledby": "cr-approved-title" });
      section.appendChild(text("h2", "cr-section-title", copy.detailsApprovedTitle, { id: "cr-approved-title" }));
      var list = el("ul", "cr-approved__list");
      approved.forEach(function (entry) {
        var item = el("li", "cr-approved__item");
        var identity = el("div", "cr-approved__identity");
        identity.appendChild(text("span", "cr-approved__address" + (entry.address ? "" : " cr-muted"), entry.address || copy.addressUnavailable));
        identity.appendChild(text("span", "cr-approved__option", optionLabel(entry.option, copy)));
        item.appendChild(identity);
        item.appendChild(text("span", "cr-approved__total" + (entry.option.total ? "" : " cr-muted"), entry.option.total || copy.valueNotStated));
        list.appendChild(item);
      });
      section.appendChild(list);
      shell.appendChild(section);
    }
    shell.appendChild(detailsForm(ctx));
  }

  function joinName(name, title) {
    if (!name) return "";
    return title ? name + ", " + title : name;
  }

  function factsCard(ctx, title, rows, className) {
    var copy = ctx.copy;
    var card = el("article", "cr-panel " + className);
    card.appendChild(text("h2", "cr-section-title", title));
    var list = el("dl", "cr-facts");
    rows.forEach(function (row) {
      var item = el("div", "cr-facts__row");
      item.appendChild(text("dt", "cr-facts__label", row[0]));
      item.appendChild(text("dd", "cr-facts__value" + (row[1] ? "" : " cr-muted"), row[1] || copy.valueNotStated));
      list.appendChild(item);
    });
    card.appendChild(list);
    return card;
  }

  function approveSection(ctx) {
    var view = ctx.snapshot.view;
    var copy = ctx.copy;
    var recordKey = view.agreement.recordKey;
    var command = ctx.snapshot.commands[recordKey] || null;
    var pending = isPending(command);
    var card = el("section", "cr-panel cr-approve", { "data-state": pending ? "pending" : "idle" });
    if (!view.canApproveAgreement) {
      card.appendChild(text("p", "cr-note", copy.agreementNoAction));
      return card;
    }
    var confirming = Boolean(ctx.snapshot.confirm && ctx.snapshot.confirm.kind === "agreement");
    var actions = el("div", "cr-actions");
    if (confirming) {
      card.setAttribute("role", "group");
      card.setAttribute("aria-labelledby", "cr-agreement-confirm");
      card.appendChild(text("p", "cr-confirm__title", copy.agreementConfirmTitle, { id: "cr-agreement-confirm" }));
      var client = view.parties.client.legalName || view.names.client;
      if (client) card.appendChild(text("p", "cr-confirm__body", ns.fill(copy.agreementConfirmBody, { client: client })));
      var confirmButton = button(pending ? copy.sendingLabel : copy.agreementConfirmButton, "btn--primary btn--lg", function () {
        ctx.dispatch("agreement.confirm");
      }, { disabled: pending || ctx.busy, "data-state": pending ? "pending" : null, "data-action": "agreement.confirm", "aria-busy": pending ? "true" : null });
      mark(ctx, confirmButton, "confirm-agreement");
      actions.appendChild(confirmButton);
      actions.appendChild(button(copy.cancelLabel, "btn--ghost btn--lg", function () { ctx.dispatch("agreement.cancel"); }, { disabled: pending, "data-action": "agreement.cancel" }));
    } else {
      actions.appendChild(mark(ctx, button(copy.agreementApprove, "btn--primary btn--lg", function () {
        ctx.dispatch("agreement.intent");
      }, { disabled: ctx.busy || pending, "data-action": "agreement.approve" }), "approve-agreement"));
    }
    card.appendChild(actions);
    if (command && !pending) card.appendChild(outcomeBox(ctx, command, { action: refreshButton(ctx, recordKey, copy.refreshLabel) }));
    return card;
  }

  function agreementPage(shell, ctx) {
    var view = ctx.snapshot.view;
    var copy = ctx.copy;
    var completion = view.kind === "completion";
    var reviewing = view.kind === "agreement-review";
    var badgeNode = reviewing ? text("span", "status-badge status-badge--info", copy.agreementAwaiting)
      : completion ? text("span", "status-badge status-badge--ok", view.completion === "active" ? copy.agreementActive : copy.agreementApproved)
        : null;
    var title = completion ? (view.completion === "active" ? copy.completeActiveTitle : copy.completeApprovedTitle) : copy.agreementTitle;
    var subtitle = completion ? copy.completeBody : reviewing ? copy.agreementSubtitle : "";
    shell.appendChild(pageHead(ctx, copy.agreementEyebrow, title, subtitle, badgeNode));
    if (completion && view.portalAccess) shell.appendChild(notice("ok", "", copy.completePortal, null));
    if (view.kind === "reference") shell.appendChild(notice("warn", "", view.banner === "expired" ? copy.agreementExpired : copy.agreementSuspended, null));
    readNotices(ctx).forEach(function (node) { shell.appendChild(node); });

    var parties = view.parties;
    var partiesSection = el("div", "cr-parties");
    partiesSection.appendChild(factsCard(ctx, copy.partyProvider, [
      [copy.partyLegalName, parties.provider.legalName],
      [copy.partyRepresentative, joinName(parties.provider.representativeName, parties.provider.representativeJobTitle)],
    ], "cr-party"));
    partiesSection.appendChild(factsCard(ctx, copy.partyClient, [
      [copy.partyLegalName, parties.client.legalName],
      [copy.partyClientType, parties.client.clientType],
      [copy.partyBillingAddress, parties.client.billingAddress],
      [copy.partyRepresentative, joinName(parties.client.representativeName, parties.client.representativeJobTitle)],
      [copy.partyEmail, parties.client.email],
      [copy.partyPhone, parties.client.phone],
    ], "cr-party"));
    shell.appendChild(partiesSection);

    var term = view.agreement;
    var termRows = [[copy.termEffective, term.effectiveDate], [copy.termStart, term.termStart], [copy.termEnd, term.termEnd]]
      .filter(function (row) { return row[1]; });
    if (termRows.length) shell.appendChild(factsCard(ctx, copy.termTitle, termRows, "cr-term"));

    var services = el("section", "cr-services", { "aria-labelledby": "cr-services-title" });
    services.appendChild(text("h2", "cr-section-heading", copy.servicesTitle, { id: "cr-services-title" }));
    view.properties.forEach(function (property) { services.appendChild(propertyCard(ctx, property, false)); });
    if (!view.properties.length && !view.unreadableOrders) services.appendChild(text("p", "cr-note", copy.linesEmpty));
    shell.appendChild(services);

    var terms = el("section", "cr-panel cr-terms", { "aria-labelledby": "cr-terms-title" });
    terms.appendChild(text("h2", "cr-section-title", copy.termsTitle, { id: "cr-terms-title" }));
    if (!term.terms.length) terms.appendChild(text("p", "cr-note", copy.termsEmpty));
    var list = null;
    term.terms.forEach(function (block) {
      if (block.kind === "item") {
        if (!list) {
          list = el("ul", "cr-terms__list");
          terms.appendChild(list);
        }
        list.appendChild(text("li", "", block.text));
        return;
      }
      list = null;
      terms.appendChild(text(block.kind === "heading" ? "h3" : "p", block.kind === "heading" ? "cr-terms__heading" : "cr-terms__paragraph", block.text));
    });
    shell.appendChild(terms);

    if (reviewing) shell.appendChild(approveSection(ctx));
  }

  function ready(shell, ctx) {
    var view = ctx.snapshot.view;
    var copy = ctx.copy;
    switch (view.kind) {
      case "quote-review":
        quoteReview(shell, ctx);
        return;
      case "contract-details":
        contractDetails(shell, ctx);
        return;
      case "agreement-review":
      case "reference":
      case "completion":
        agreementPage(shell, ctx);
        return;
      case "preparing":
        shell.appendChild(stateCard("progress", "…", copy.preparingTitle, copy.preparingBody, null));
        return;
      case "closed":
        shell.appendChild(view.reason === "archived"
          ? stateCard("neutral", "⊘", copy.archivedTitle, copy.archivedBody, null)
          : stateCard("neutral", "⊘", copy.canceledTitle, copy.canceledBody, null));
        return;
      case "empty":
        shell.appendChild(stateCard("neutral", "○", copy.emptyTitle, copy.emptyBody, null));
        return;
      default:
        shell.appendChild(stateCard("warn", "!", copy.unavailableTitle, copy.unavailableBody, null));
    }
  }

  function renderPage(mount, snapshot, dispatch, copy) {
    var ctx = {
      snapshot: snapshot,
      dispatch: dispatch,
      copy: copy,
      focus: {},
      busy: snapshot.refreshing || snapshot.phase !== "ready",
    };
    var page = el("div", "cr-page", {
      "data-phase": snapshot.phase,
      "data-kind": snapshot.view ? snapshot.view.kind : null,
      "aria-busy": snapshot.phase === "loading" || snapshot.refreshing ? "true" : null,
    });
    var shell = el("div", "cr-shell");
    page.appendChild(shell);
    switch (snapshot.phase) {
      case "loading":
        shell.appendChild(skeleton(copy));
        break;
      case "unconfigured":
        shell.appendChild(stateCard("warn", "!", copy.unconfiguredTitle, copy.unconfiguredBody, null));
        break;
      case "link-missing":
        shell.appendChild(stateCard("warn", "?", copy.linkMissingTitle, copy.linkMissingBody, null));
        break;
      case "link-closed":
        shell.appendChild(snapshot.closedAfter
          ? stateCard("info", "i", copy.closedAfterTitle, snapshot.closedAfter === "details" ? copy.closedAfterDetailsBody : copy.closedAfterApprovalBody, null)
          : stateCard("neutral", "⊘", copy.linkClosedTitle, copy.linkClosedBody, null));
        break;
      case "error":
        shell.appendChild(stateCard("error", "!", copy.errorTitle, snapshot.errorAfterCommand ? copy.readbackErrorBody : copy.errorBody,
          button(copy.retryLabel, "btn--primary btn--lg", function () { dispatch("retry"); }, { "data-action": "retry" })));
        break;
      default:
        if (snapshot.view) ready(shell, ctx);
    }
    mount.replaceChildren();
    mount.appendChild(page);
    return { focus: ctx.focus };
  }

  ns.components = Object.freeze({
    renderPage: renderPage,
    optionLabel: optionLabel,
  });
})(typeof window !== "undefined" ? window : globalThis);
(function (global) {
  "use strict";

  var ns = global.ClientReview || (global.ClientReview = {});

  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function createController(options) {
    var settings = options || {};
    var adapter = settings.adapter || null;
    var copy = ns.withDefaults(settings.copy);
    var locale = settings.locale || "en";
    var mount = settings.mount || null;
    var contract = ns.contract;
    var normalizer = ns.normalizer;
    var inflight = {};
    var loading = null;
    var listeners = [];
    var state = {
      phase: settings.phase || "loading",
      view: null,
      closedAfter: "",
      errorAfterCommand: false,
      refreshing: false,
      expanded: {},
      confirm: null,
      drafts: {},
      draftInvalid: {},
      commands: {},
      details: emptyDetails(null),
      focusKey: "",
    };

    function emptyDetails(agreementId) {
      return { seededFor: agreementId, values: {}, errors: {}, touched: {}, serverErrors: {}, invalid: false };
    }

    function optionsOf(view) {
      var found = [];
      (view && Array.isArray(view.properties) ? view.properties : []).forEach(function (property) {
        property.options.forEach(function (option) { found.push(option); });
      });
      return found;
    }

    function findOption(id) {
      var wanted = normalizer.positiveInteger(id);
      return optionsOf(state.view).filter(function (option) { return option.id === wanted; })[0] || null;
    }

    function detailField(code) {
      var fields = state.view && state.view.details ? state.view.details.fields : [];
      return fields.filter(function (field) { return field.code === code; })[0] || null;
    }

    function readAll() {
      return adapter.introspect().then(function (rawGrant) {
        var grant = normalizer.grantOf(rawGrant);
        if (!normalizer.canRead(grant, "document")) {
          return { grant: grant, documents: [], orders: [], accounts: [], accountFailed: false };
        }
        var ordersReadable = normalizer.canRead(grant, "order");
        var accountRead = normalizer.canRead(grant, "account")
          ? adapter.list("account").then(function (rows) { return { rows: rows, failed: false }; }, function (error) {
            if (error && error.code === "link-closed") throw error;
            return { rows: [], failed: true };
          })
          : Promise.resolve({ rows: [], failed: false });
        var ordersRead = ordersReadable ? adapter.list("order") : Promise.resolve([]);
        return Promise.all([adapter.list("document"), accountRead, ordersRead]).then(function (parts) {
          var documents = parts[0];
          var orders = parts[2].slice();
          var present = {};
          orders.forEach(function (row) {
            var id = normalizer.positiveInteger(row && row.id);
            if (id) present[id] = true;
          });
          var missing = ordersReadable
            ? (normalizer.packageOrderIds(documents, contract) || []).filter(function (id) { return !present[id]; })
            : [];
          return Promise.all(missing.map(function (id) {
            return adapter.get("order", id).then(function (row) {
              return row && normalizer.positiveInteger(row.id) === id ? row : null;
            }, function (error) {
              if (error && error.code === "link-closed") throw error;
              return null;
            });
          })).then(function (fetched) {
            fetched.forEach(function (row) { if (row) orders.push(row); });
            return {
              grant: grant,
              documents: documents,
              orders: orders,
              accounts: parts[1].rows,
              accountFailed: parts[1].failed,
            };
          });
        });
      });
    }

    function seedDetails() {
      var view = state.view;
      if (!view || view.kind !== "contract-details" || state.details.seededFor === view.agreement.id) return;
      var details = emptyDetails(view.agreement.id);
      view.details.fields.forEach(function (field) {
        details.values[field.code] = field.kind === "boolean" ? false : view.details.prefill[field.code] || "";
      });
      state.details = details;
    }

    function prune() {
      var present = {};
      optionsOf(state.view).forEach(function (option) { present[option.id] = option; });
      Object.keys(state.expanded).forEach(function (id) { if (!present[id]) delete state.expanded[id]; });
      var confirm = state.confirm;
      if (!confirm) return;
      if (confirm.kind === "agreement") {
        if (!state.view || !state.view.canApproveAgreement) state.confirm = null;
        return;
      }
      if (!present[confirm.id] || !present[confirm.id].actions[confirm.kind]) state.confirm = null;
    }

    function load(context) {
      if (!adapter) {
        render();
        return Promise.resolve();
      }
      if (loading) return loading;
      var after = context || {};
      if (state.phase === "ready" && state.view) state.refreshing = true;
      else state.phase = "loading";
      render();
      loading = readAll().then(function (input) {
        state.view = normalizer.reviewModel(input, { locale: locale, contract: contract });
        state.phase = "ready";
        state.closedAfter = "";
        state.errorAfterCommand = false;
        seedDetails();
        prune();
      }, function (error) {
        state.view = null;
        state.confirm = null;
        if (error && error.code === "link-closed") {
          state.phase = "link-closed";
          state.closedAfter = after.closedAfter || "";
        } else {
          state.phase = "error";
          state.errorAfterCommand = Boolean(after.afterCommand);
        }
      }).then(function () {
        state.refreshing = false;
        loading = null;
        render();
      });
      return loading;
    }

    function reload(context) {
      if (loading) return loading.then(function () { return load(context); });
      return load(context);
    }

    function send(recordKey, entity, id, event, metadata, context) {
      if (inflight[recordKey]) return inflight[recordKey];
      if (!adapter || loading || state.phase !== "ready") return Promise.resolve(false);
      var after = context || {};
      state.commands[recordKey] = { status: "pending", event: event, message: "" };
      render();
      var task = adapter.sendEvent(entity, id, event, metadata).then(function () {
        return reload({ afterCommand: true, closedAfter: after.closedAfter || "" }).then(function () {
          delete state.commands[recordKey];
          if (typeof after.onSuccess === "function") after.onSuccess();
          render();
          return true;
        });
      }, function (error) {
        if (error && error.code === "link-closed") {
          delete state.commands[recordKey];
          state.view = null;
          state.confirm = null;
          state.phase = "link-closed";
          state.closedAfter = "";
        } else {
          var refused = Boolean(error && error.code === "refused");
          state.commands[recordKey] = { status: refused ? "refused" : "failed", event: event, message: refused ? error.serverMessage || "" : "" };
          if (refused && typeof after.onRefusal === "function") after.onRefusal(error);
        }
        render();
        return false;
      }).then(function (result) {
        delete inflight[recordKey];
        return result;
      });
      inflight[recordKey] = task;
      return task;
    }

    function clearOutcome(recordKey) {
      var command = state.commands[recordKey];
      if (command && command.status !== "pending") delete state.commands[recordKey];
    }

    function busy() {
      return Boolean(loading) || state.refreshing || state.phase !== "ready";
    }

    function validateDetail(field, value) {
      var filled = field.kind === "boolean" ? value === true : typeof value === "string" && value.trim() !== "";
      if (!filled) return field.required ? copy.requiredError : "";
      if (field.kind === "email" && !EMAIL.test(value.trim())) return copy.emailError;
      if (field.choices.length && !field.choices.some(function (option) { return option.value === value; })) return copy.requiredError;
      return "";
    }

    function detailsMetadata(fields) {
      var metadata = {};
      fields.forEach(function (field) {
        var value = state.details.values[field.code];
        if (field.kind === "boolean") {
          if (value === true) metadata[field.code] = true;
          return;
        }
        var trimmed = typeof value === "string" ? value.trim() : "";
        if (trimmed) metadata[field.code] = trimmed;
      });
      return metadata;
    }

    function toggleOption(id) {
      var option = findOption(id);
      if (!option) return;
      var opening = !state.expanded[option.id];
      if (opening) state.expanded[option.id] = true;
      else delete state.expanded[option.id];
      if (opening && option.actions.view && !state.commands[option.recordKey] && !busy()) {
        send(option.recordKey, "order", option.id, contract.orderEvents.view.code, {}, {});
        return;
      }
      render();
    }

    function confirmOption(id) {
      var option = findOption(id);
      var confirm = state.confirm;
      if (!option || !confirm || confirm.id !== option.id || !option.actions[confirm.kind] || busy()) return;
      var event = contract.orderEvents[confirm.kind];
      var metadata = {};
      if (confirm.kind === "changes") {
        var message = String(state.drafts[option.id] || "").trim();
        if (!message) {
          state.draftInvalid[option.id] = true;
          state.focusKey = "draft-" + option.id;
          render();
          return;
        }
        metadata[event.messageAttribute] = message;
      }
      delete state.draftInvalid[option.id];
      send(option.recordKey, "order", option.id, event.code, metadata, {
        onSuccess: function () {
          if (confirm.kind === "changes") delete state.drafts[option.id];
        },
      });
    }

    function submitDetails() {
      var view = state.view;
      if (!view || view.kind !== "contract-details" || !view.details.available || busy()) return;
      var firstInvalid = "";
      view.details.fields.forEach(function (field) {
        state.details.touched[field.code] = true;
        var message = validateDetail(field, state.details.values[field.code]);
        state.details.errors[field.code] = message;
        if (message && !firstInvalid) firstInvalid = field.code;
      });
      state.details.invalid = Boolean(firstInvalid);
      if (firstInvalid) {
        clearOutcome(view.agreement.recordKey);
        state.focusKey = "field-" + firstInvalid;
        render();
        return;
      }
      state.details.serverErrors = {};
      send(view.agreement.recordKey, "document", view.agreement.id, contract.agreementEvents.details.code, detailsMetadata(view.details.fields), {
        closedAfter: "details",
        onRefusal: function (error) {
          Object.keys(error.fieldErrors || {}).forEach(function (code) {
            if (detailField(code)) state.details.serverErrors[code] = error.fieldErrors[code];
          });
        },
      });
    }

    function dispatch(type, payload) {
      var data = payload || {};
      var option;
      var field;
      var view = state.view;
      switch (type) {
        case "retry":
          load({});
          return;
        case "refresh":
          if (data.recordKey) clearOutcome(data.recordKey);
          reload({});
          return;
        case "option.toggle":
          toggleOption(data.id);
          return;
        case "option.view":
          option = findOption(data.id);
          if (!option || !option.actions.view || busy()) return;
          clearOutcome(option.recordKey);
          send(option.recordKey, "order", option.id, contract.orderEvents.view.code, {}, {});
          return;
        case "option.intent":
          option = findOption(data.id);
          if (!option || !option.actions[data.kind] || busy() || inflight[option.recordKey]) return;
          clearOutcome(option.recordKey);
          state.confirm = { recordKey: option.recordKey, id: option.id, kind: data.kind };
          state.focusKey = data.kind === "changes" ? "draft-" + option.id : "confirm-" + option.id;
          render();
          return;
        case "option.cancel":
          option = findOption(data.id);
          if (!option || inflight[option.recordKey]) return;
          state.confirm = null;
          delete state.draftInvalid[option.id];
          state.focusKey = "toggle-" + option.id;
          render();
          return;
        case "option.draft":
          state.drafts[data.id] = String(data.value == null ? "" : data.value);
          if (state.draftInvalid[data.id] && state.drafts[data.id].trim()) delete state.draftInvalid[data.id];
          return;
        case "option.confirm":
          confirmOption(data.id);
          return;
        case "details.input":
          field = detailField(data.code);
          if (!field) return "";
          state.details.values[field.code] = String(data.value == null ? "" : data.value);
          delete state.details.serverErrors[field.code];
          if (!state.details.touched[field.code]) return "";
          state.details.errors[field.code] = validateDetail(field, state.details.values[field.code]);
          return state.details.errors[field.code];
        case "details.blur":
          field = detailField(data.code);
          if (!field) return "";
          state.details.touched[field.code] = true;
          state.details.errors[field.code] = validateDetail(field, state.details.values[field.code]);
          return state.details.errors[field.code] || state.details.serverErrors[field.code] || "";
        case "details.choose":
          field = detailField(data.code);
          if (!field) return "";
          state.details.values[field.code] = field.kind === "boolean" ? data.value === true : String(data.value == null ? "" : data.value);
          state.details.touched[field.code] = true;
          state.details.errors[field.code] = validateDetail(field, state.details.values[field.code]);
          delete state.details.serverErrors[field.code];
          return state.details.errors[field.code];
        case "details.submit":
          submitDetails();
          return;
        case "agreement.intent":
          if (!view || !view.canApproveAgreement || busy() || inflight[view.agreement.recordKey]) return;
          clearOutcome(view.agreement.recordKey);
          state.confirm = { recordKey: view.agreement.recordKey, id: view.agreement.id, kind: "agreement" };
          state.focusKey = "confirm-agreement";
          render();
          return;
        case "agreement.cancel":
          if (!view || inflight[view.agreement.recordKey]) return;
          state.confirm = null;
          state.focusKey = "approve-agreement";
          render();
          return;
        case "agreement.confirm":
          if (!view || !view.canApproveAgreement || !state.confirm || state.confirm.kind !== "agreement" || busy()) return;
          send(view.agreement.recordKey, "document", view.agreement.id, contract.agreementEvents.approve.code, {}, { closedAfter: "approval" });
          return;
        default:
          return;
      }
    }

    function snapshot() {
      return {
        phase: state.phase,
        view: state.view,
        closedAfter: state.closedAfter,
        errorAfterCommand: state.errorAfterCommand,
        refreshing: state.refreshing,
        expanded: state.expanded,
        confirm: state.confirm,
        drafts: state.drafts,
        draftInvalid: state.draftInvalid,
        commands: state.commands,
        details: state.details,
        pending: Object.keys(inflight),
      };
    }

    function render() {
      if (mount && ns.components) {
        var rendered = ns.components.renderPage(mount, snapshot(), dispatch, copy);
        var key = state.focusKey;
        state.focusKey = "";
        var target = key && rendered && rendered.focus ? rendered.focus[key] : null;
        if (target && typeof target.focus === "function") target.focus();
      }
      var current = snapshot();
      listeners.forEach(function (listener) { listener(current); });
    }

    function idle() {
      var waiting = Object.keys(inflight).map(function (key) { return inflight[key]; });
      if (loading) waiting.push(loading);
      if (!waiting.length) return Promise.resolve();
      return Promise.all(waiting).then(idle);
    }

    function start() {
      if (adapter) load({});
      else render();
      return controller;
    }

    var controller = {
      start: start,
      dispatch: dispatch,
      reload: reload,
      idle: idle,
      snapshot: snapshot,
      copy: copy,
      subscribe: function (listener) {
        if (typeof listener === "function") listeners.push(listener);
      },
    };
    return controller;
  }

  function kebab(key) {
    return key.replace(/[A-Z]/g, function (character) { return "-" + character.toLowerCase(); });
  }

  function copyFromAttributes(section) {
    var overrides = {};
    ns.copyEntries.forEach(function (entry) {
      var value = section.getAttribute("data-copy-" + kebab(entry[1]));
      if (typeof value === "string" && value.trim() && !/^\$\{/.test(value.trim())) overrides[entry[1]] = value;
    });
    return overrides;
  }

  function displayLocale(environment) {
    var navigatorRef = environment.navigator || global.navigator;
    var language = navigatorRef && typeof navigatorRef.language === "string" ? navigatorRef.language : "";
    try {
      return (language && Intl.NumberFormat.supportedLocalesOf([language])[0]) || "en";
    } catch (_) {
      return "en";
    }
  }

  function boot(section, environment) {
    var env = environment || {};
    if (!section || typeof section.getAttribute !== "function") return null;
    var mount = env.mount || (typeof section.querySelector === "function" && section.querySelector("[data-client-review-mount]")) || section;
    var dataMode = String(section.getAttribute("data-review-data-mode") || "").trim().toLowerCase() === "fixture" ? "fixture" : "live";
    var options = { mount: mount, copy: copyFromAttributes(section), locale: env.locale || displayLocale(env) };
    var steps = [];
    if (dataMode === "fixture") {
      var setup = ns.fixtures && typeof ns.fixtures.setup === "function" ? ns.fixtures.setup(env.scenario) : null;
      if (!setup) {
        options.phase = "unconfigured";
      } else {
        options.adapter = setup.adapter || null;
        if (setup.phase) options.phase = setup.phase;
        steps = setup.steps || [];
      }
    } else {
      var apiBase = ns.adapter.safeApiBase(section.getAttribute("data-review-api-base"));
      var locationRef = env.location || global.location || {};
      var token = ns.adapter.tokenFromFragment(locationRef.hash);
      if (!apiBase) options.phase = "unconfigured";
      else if (!token) options.phase = "link-missing";
      else options.adapter = ns.adapter.createGrantAdapter({ apiBase: apiBase, token: token, fetch: env.fetch });
    }
    var controller = createController(options);
    controller.dataMode = dataMode;
    controller.steps = steps;
    controller.start();
    return controller;
  }

  ns.createController = createController;
  ns.boot = boot;
})(typeof window !== "undefined" ? window : globalThis);
(function () {
  "use strict";
  function ready(fn) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true }); else fn(); }
  function followScheme(query) { document.documentElement.dataset.mode = query && query.matches ? "dark" : "light"; }
  ready(function () {
    var root = document.getElementById("client-review-root");
    if (!root || !window.ClientReview || typeof window.ClientReview.boot !== "function") return;
    document.documentElement.dataset.theme = "snow";
    var query = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    followScheme(query);
    if (query && typeof query.addEventListener === "function") query.addEventListener("change", function () { followScheme(query); });
    window.addEventListener("hashchange", function () { window.location.reload(); });
    window.ClientReview.boot(root, {});
  });
})();

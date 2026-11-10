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
      options: [choice("INDIVIDUAL", "Individual"), choice("UNINCORPORATED_BUSINESS", "Unincorporated business"), choice("CORPORATE", "Corporation"), choice("ASSOCIATION", "Association"), choice("GOVERNMENT", "Government")],
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
    orderWorkflow: "ORDER_LIFECYCLE",
    agreementWorkflow: "SERVICE_AGREEMENT_LIFECYCLE",
    agreementType: "SERVICE_AGREEMENT",
    orderStates: [
      "DRAFT", "QUOTE_PREPARED", "CHANGES_REQUESTED", "QUOTE_APPROVED",
      "QUOTE_SENT", "CUSTOMER_CHANGES_REQUESTED", "DECLINED",
      "ACCEPTED", "ACTIVE", "SUSPENDED", "COMPLETED", "CANCELED",
    ],
    agreementStates: [
      "QUOTATION", "QUOTATION_SENT", "QUOTATION_UPDATE", "QUOTATION_SEND_FAILED", "AWAITING_CLIENT_DETAILS",
      "CLIENT_DETAILS_RECEIVED", "DRAFT",
      "PENDING_MANAGEMENT_APPROVAL", "INTERNALLY_APPROVED", "SENT_TO_CLIENT", "CLIENT_CHANGES_REQUESTED", "AGREEMENT_SEND_FAILED",
      "CLIENT_APPROVED", "ACTIVATION_FAILED", "ACTIVE", "SUSPENDED", "EXPIRED", "ARCHIVED", "CANCELED",
      "ACCESS_CLEANUP_RETRY",
    ],
    orderEvents: {
      approve: { code: "QUOTE_SENT-ACCEPTED", source: "QUOTE_SENT" },
      decline: { code: "QUOTE_SENT-DECLINED", source: "QUOTE_SENT" },
      changes: { code: "QUOTE_SENT-CUSTOMER_CHANGES_REQUESTED", source: "QUOTE_SENT", messageAttribute: "MESSAGE" },
    },
    agreementOperationStatus: {
      key: "AGREEMENT_OPERATION_STATUS",
      presentedStates: {
        SENT_TO_CLIENT: { AGREEMENT_DELIVERY_FAILED: "AGREEMENT_SEND_FAILED" },
        CLIENT_APPROVED: { ACTIVATION_FAILED: "ACTIVATION_FAILED" },
      },
    },
    agreementEvents: {
      approve: { code: "SENT_TO_CLIENT-CLIENT_APPROVED", source: "SENT_TO_CLIENT" },
      changes: { code: "SENT_TO_CLIENT-CLIENT_CHANGES_REQUESTED", source: "SENT_TO_CLIENT", messageAttribute: "MESSAGE" },
    },
    orderAttributes: {
      property: "SERVICE_PROPERTY",
      pricingModel: "PRICING_MODEL",
      quotationRound: "QUOTATION_ROUND",
    },
    propertyAttributes: {
      address: "ADDRESS",
      plan: "PROPERTY_PLAN",
    },
    addressFormat: {
      parts: ["address1", "address2", "city", "jurisdiction", "state.code", "postalCode", "country.id"],
      separator: ", ",
      fallback: "alias",
    },
    pricingModels: ["SEASONAL", "MONTHLY", "PER_SERVICE"],
    priceVariants: {
      perService: "PER_SERVICE",
      monthly: "MONTHLY",
      seasonal: "SEASONAL",
      recurring: "RECURRING",
      lineMetadata: "metadata",
      intervalCount: "INTERVAL_COUNT",
      intervalUnit: "INTERVAL_UNIT",
      monthUnit: "MONTH",
      priceInterval: "INTERVAL",
      priceIntervalUnit: "unit",
      unitEntity: "unit",
    },
    rawShape: {
      orderLines: "items",
      documentOwner: "organization",
    },
    agreementAttributes: {
      client: "CLIENT",
      orders: "ORDERS",
      effectiveDate: "EFFECTIVE_DATE",
      termStart: "TERM_START_DATE",
      termEnd: "TERM_END_DATE",
      terms: "CONTRACT_TERMS",
    },
    contractDetails: {
      event: "QUOTE_SENT-ACCEPTED",
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

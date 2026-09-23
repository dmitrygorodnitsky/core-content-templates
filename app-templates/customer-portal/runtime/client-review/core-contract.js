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
      "QUOTATION", "QUOTATION_SENT", "QUOTATION_SEND_FAILED", "AWAITING_CLIENT_DETAILS",
      "CLIENT_DETAILS_RECEIVED", "DRAFT",
      "PENDING_MANAGEMENT_APPROVAL", "INTERNALLY_APPROVED", "SENT_TO_CLIENT", "AGREEMENT_SEND_FAILED",
      "CLIENT_APPROVED", "ACTIVATION_FAILED", "ACTIVE", "SUSPENDED", "EXPIRED", "ARCHIVED", "CANCELED",
    ],
    orderEvents: {
      view: { code: "QUOTE_SENT-QUOTE_VIEWED", source: "QUOTE_SENT" },
      approve: { code: "QUOTE_VIEWED-CLIENT_APPROVED", source: "QUOTE_VIEWED" },
      decline: { code: "QUOTE_VIEWED-DECLINED", source: "QUOTE_VIEWED" },
      changes: { code: "QUOTE_VIEWED-CUSTOMER_CHANGES_REQUESTED", source: "QUOTE_VIEWED", messageAttribute: "MESSAGE" },
    },
    agreementEvents: {
      details: { code: "AWAITING_CLIENT_DETAILS-CLIENT_DETAILS_RECEIVED", source: "AWAITING_CLIENT_DETAILS" },
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
      documentOwner: "organization",
    },
    agreementAttributes: {
      client: "CLIENT",
      orders: "ORDERS",
      effectiveDate: "EFFECTIVE_DATE",
      termStart: "TERM_START_DATE",
      termEnd: "TERM_END_DATE",
      terms: "CONTRACT_TERMS",
      providerLegalName: "PROVIDER_LEGAL_NAME",
      providerRepresentativeName: "PROVIDER_REPRESENTATIVE_NAME",
      providerRepresentativeJobTitle: "PROVIDER_REPRESENTATIVE_JOB_TITLE",
      detailsErrors: "CLIENT_DETAILS_ERRORS",
    },
    accountPrefill: {
      BILLING_ADDRESS: "BILLING_ADDRESS",
      REPRESENTATIVE_FIRST_NAME: "REPRESENTATIVE_FIRST_NAME",
      REPRESENTATIVE_LAST_NAME: "REPRESENTATIVE_LAST_NAME",
      REPRESENTATIVE_JOB_TITLE: "REPRESENTATIVE_JOB_TITLE",
      REPRESENTATIVE_EMAIL: "REPRESENTATIVE_EMAIL",
      REPRESENTATIVE_PHONE: "REPRESENTATIVE_PHONE",
    },
    detailsReturn: {
      processingFailed: "PROCESSING_FAILED",
      invalid: {
        CLIENT_TYPE_INVALID: { field: "CLIENT_TYPE", reason: "choice" },
        REPRESENTATIVE_EMAIL_INVALID: { field: "REPRESENTATIVE_EMAIL", reason: "email" },
      },
    },
    contractDetails: {
      event: "AWAITING_CLIENT_DETAILS-CLIENT_DETAILS_RECEIVED",
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

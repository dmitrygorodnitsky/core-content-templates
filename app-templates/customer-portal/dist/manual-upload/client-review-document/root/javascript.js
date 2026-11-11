(function (global) {
  "use strict";

  var ns = global.ClientReview || (global.ClientReview = {});

  var ENTRIES = [
    ["DOCUMENT_TITLE", "documentTitle", "Your quotation and agreement"],
    ["LOADING_LABEL", "loadingLabel", "Loading your quotation"],
    ["FROM_LABEL", "fromLabel", "From"],
    ["FOR_LABEL", "forLabel", "For"],
    ["LINK_VALID_UNTIL", "linkValidUntil", "This link works until {date}."],
    ["LINK_COPY", "linkCopy", "Copy link"],
    ["LINK_COPIED", "linkCopied", "Link copied"],
    ["LINK_COPIED_NOTE", "linkCopiedNote", "Use it to come back to this page later. Anyone who has the link can open this page."],
    ["LINK_COPIED_UNSENT", "linkCopiedUnsent", "What you type here is not saved until you send it."],
    ["LINK_COPY_FAILED", "linkCopyFailed", "The link could not be copied. Copy this page's address from your browser, or open the link in the provider's email again."],

    ["PDF_DOWNLOAD", "pdfDownload", "Download PDF"],
    ["PDF_CREATING", "pdfCreating", "Preparing PDF..."],
    ["PDF_DOWNLOADED", "pdfDownloaded", "Your PDF download has started."],
    ["PDF_FAILED", "pdfFailed", "We could not prepare the PDF. Please try again. If this continues, contact the provider."],
    ["PDF_INCOMPLETE", "pdfIncomplete", "PDF download is available once all document details have loaded. Please refresh the page."],
    ["PDF_SNAPSHOT", "pdfSnapshot", "Downloaded {date}. This copy reflects the information shown on this page."],
    ["PDF_PAGE", "pdfPage", "Page {page} of {pages}"],
    ["QUOTE_EYEBROW", "quoteEyebrow", "Quotation"],
    ["QUOTE_TITLE", "quoteTitle", "Review your quotes"],
    ["QUOTE_SUBTITLE", "quoteSubtitle", "Each property has its own options. Choose one to see its services, then approve it or ask for changes. If none suits you, decline them all. You send your decisions together at the end."],
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
    ["MODEL_RECURRING", "modelRecurring", "Recurring"],
    ["PROPERTY_AWAITING", "propertyAwaiting", "Awaiting decision"],
    ["PROPERTY_APPROVED", "propertyApproved", "Option approved"],
    ["PROPERTY_DECLINED", "propertyDeclined", "Declined"],
    ["PROPERTY_CANCELLED", "propertyCancelled", "Cancelled"],
    ["PROPERTY_CHANGES", "propertyChanges", "Changes requested"],
    ["PROPERTY_UNKNOWN", "propertyUnknown", "Status unavailable"],
    ["OPTION_NEW", "optionNew", "New"],
    ["OPTION_APPROVED", "optionApproved", "Approved"],
    ["OPTION_DECLINED", "optionDeclined", "Declined"],
    ["OPTION_CANCELLED", "optionCancelled", "Cancelled"],
    ["OPTION_CHANGES", "optionChanges", "Changes requested"],
    ["OPTION_REVISING", "optionRevising", "Being revised"],
    ["OPTION_UNKNOWN", "optionUnknown", "Status unavailable"],
    ["SHOW_OPTION", "showOption", "Show details"],
    ["HIDE_OPTION", "hideOption", "Hide details"],
    ["LINE_SERVICE", "lineService", "Service"],
    ["LINE_QUANTITY", "lineQuantity", "Quantity"],
    ["LINE_UNIT_PRICE", "lineUnitPrice", "Unit price"],
    ["LINE_INCLUDED", "lineIncluded", "Included"],
    ["ORDER_TOTAL", "orderTotal", "Option total"],
    ["PER_SERVICE_NOTE", "perServiceNote", "You pay the price of each service every time it is performed."],
    ["PER_SERVICE_PRICE", "perServicePrice", "Per visit"],
    ["TAXES_NOTE", "taxesNote", "Plus applicable taxes."],
    ["LINES_EMPTY", "linesEmpty", "No services are listed on this option."],
    ["VALUE_NOT_STATED", "valueNotStated", "Not stated"],
    ["SERVICE_UNNAMED", "serviceUnnamed", "Unnamed service"],
    ["NOTE_REVISING", "noteRevising", "The provider is revising this option. Its services and price show here again once it is sent back to you."],
    ["NOTE_SIBLING_APPROVED", "noteSiblingApproved", "You approved another option for this property."],
    ["NOTE_NO_ACTIONS", "noteNoActions", "Decisions on this option cannot be made through this link."],
    ["APPROVE_LABEL", "approveLabel", "Approve"],
    ["CHANGES_LABEL", "changesLabel", "Request changes"],
    ["CANCEL_LABEL", "cancelLabel", "Cancel"],
    ["SENDING_LABEL", "sendingLabel", "Sending…"],
    ["CHANGES_TITLE", "changesTitle", "What should change?"],
    ["CHANGES_ALL_BODY", "changesAllBody", "Your request goes to the provider for every open option of this property."],
    ["CHANGES_PLACEHOLDER", "changesPlaceholder", "For example: add sidewalk de-icing, or quote weekly visits instead."],
    ["CHANGES_REQUIRED", "changesRequired", "Write what you would like changed before sending."],
    ["CHANGES_SEND", "changesSend", "Send request"],
    ["CHOICE_LEGEND", "choiceLegend", "Options for {address}"],
    ["CHOOSE_OPTION", "chooseOption", "Choose an option to see its services and approve it."],
    ["DECLINE_ALL_LABEL", "declineAllLabel", "Decline all options"],
    ["DECLINE_CONFIRM_TITLE", "declineConfirmTitle", "Decline every option for this property?"],
    ["DECLINE_CONFIRM_BODY", "declineConfirmBody", "Declined options cannot be approved later through this link."],
    ["DECLINE_CONFIRM_SEND", "declineConfirmSend", "Confirm decline"],
    ["CHOICE_APPROVED_NOTE", "choiceApprovedNote", "You chose this option. It is approved when you send your decisions."],
    ["CHOICE_DECLINED_NOTE", "choiceDeclinedNote", "You chose to decline every option for this property. They are declined when you send your decisions."],
    ["CHOICE_UNDO", "choiceUndo", "Undo"],
    ["CHOICES_TITLE", "choicesTitle", "Confirm your choices"],
    ["CHOICES_BODY", "choicesBody", "Approving an option declines the other options for its property. Declined options cannot be approved later through this link."],
    ["CHOICE_APPROVE_ROW", "choiceApproveRow", "Approve {option}"],
    ["CHOICE_DECLINE_ROW", "choiceDeclineRow", "Decline every option"],
    ["CHOICES_UNDECIDED_ONE", "choicesUndecidedOne", "1 property has no decision in this step. You can decide it later through this link."],
    ["CHOICES_UNDECIDED_MANY", "choicesUndecidedMany", "{n} properties have no decision in this step. You can decide them later through this link."],
    ["CHOICES_SUBMIT", "choicesSubmit", "Send decisions"],
    ["DETAILS_STEP_TITLE", "detailsStepTitle", "Contract details"],
    ["CHOICES_BACK", "choicesBack", "‹ Back to your quotes"],
    ["CHOICES_READY_ONE", "choicesReadyOne", "1 decision is ready to send."],
    ["CHOICES_READY_MANY", "choicesReadyMany", "{n} decisions are ready to send."],
    ["CHOICES_CONTINUE", "choicesContinue", "Review and send"],
    ["CHOICES_CONTINUE_DETAILS", "choicesContinueDetails", "Continue to contract details"],
    ["PARTIAL_DECIDED_TITLE", "partialDecidedTitle", "Your decisions so far are recorded"],
    ["PARTIAL_DECIDED_BODY", "partialDecidedBody", "Decide the properties still awaiting a decision, now or later through this link."],
    ["REFUSED_TITLE", "refusedTitle", "Not accepted"],
    ["REFUSED_FALLBACK", "refusedFallback", "The provider's system did not accept this request."],
    ["FAILED_BODY", "failedBody", "We could not confirm whether this went through. Refresh the status before trying again."],
    ["COMMAND_UNCONFIRMED", "commandUnconfirmed", "The provider's system accepted this, but has not shown the change yet. Refresh the status in a minute."],
    ["REFRESH_LABEL", "refreshLabel", "Refresh status"],
    ["PARTIAL_ONE", "partialOne", "1 option could not be loaded. Everything else is shown as the provider's system returned it."],
    ["PARTIAL_MANY", "partialMany", "{n} options could not be loaded. Everything else is shown as the provider's system returned it."],
    ["ACCOUNT_PARTIAL", "accountPartial", "Your account details could not be loaded, so nothing is filled in for you."],
    ["DECIDED_TITLE", "decidedTitle", "Every property has a decision"],
    ["DECIDED_FOLLOWING_BODY", "decidedFollowingBody", "The provider's system is processing your decisions. This page updates on its own."],
    ["DECIDED_ROUND_BODY", "decidedRoundBody", "Thank you, your decisions are recorded. The provider will contact you about the next step."],

    ["DETAILS_SUBTITLE", "detailsSubtitle", "These details go into your service agreement. You give them once for every option you approve."],
    ["DETAILS_FORM_TITLE", "detailsFormTitle", "Client and representative"],
    ["DETAILS_INVALID", "detailsInvalid", "Check the highlighted fields."],
    ["REQUIRED_ERROR", "requiredError", "This field is required."],
    ["EMAIL_ERROR", "emailError", "Enter a valid email address."],
    ["SELECT_PLACEHOLDER", "selectPlaceholder", "Choose one"],
    ["ADDRESS_SUGGESTIONS", "addressSuggestions", "Address suggestions"],
    ["ADDRESS_MAP_LABEL", "addressMapLabel", "Map of the address you entered"],
    ["ADDRESS_MAP_MISSING", "addressMapMissing", "This address was not found on the map. Check it, or send it as you wrote it."],
    ["SERVICE_ADDRESS_REUSE", "serviceAddressReuse", "Same as a service address?"],
    ["SERVICE_ADDRESS_USE", "serviceAddressUse", "Use {address}"],
    ["PLAN_TITLE", "planTitle", "Property plan"],
    ["PLAN_LOADING", "planLoading", "Loading the property plan…"],
    ["PLAN_UNAVAILABLE", "planUnavailable", "The plan for this property cannot be shown right now."],
    ["PLAN_MAP_LABEL", "planMapLabel", "Map of the property plan"],
    ["PROPERTY_AREA", "propertyArea", "Total service area"],
    ["LEGAL_ADDRESS_REFUSED", "legalAddressRefused", "Enter the client's legal address on one line that ends with the province or state and the country."],
    ["PLAN_AREA_VALUE", "planAreaValue", "{area} sq ft"],
    ["PLAN_ELEMENT_FALLBACK", "planElementFallback", "Plan element {n}"],
    ["PLAN_NOTE", "planNote", "The provider prepared this plan for your service. If something on it looks wrong, contact them."],
    ["CONFIRM_INFORMATION_STATEMENT", "confirmInformationStatement", "I confirm that the information above is accurate."],
    ["CONFIRM_AUTHORITY_STATEMENT", "confirmAuthorityStatement", "I confirm that I am authorized to enter into this agreement on behalf of the client."],

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
    ["PROVIDER_LOGO_ALT", "providerLogoAlt", "{provider} logo"],
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
    ["BILLING_ADDRESS_LABEL", "billingAddressLabel", "Billing address"],
    ["BILLING_ADDRESS_HINT", "billingAddressHint", "We need a billing address before the agreement can be approved. Your invoices carry it."],
    ["BILLING_SAME_AS_LEGAL", "billingSameAsLegal", "Same as legal address"],
    ["BILLING_ADDRESS_REQUIRED", "billingAddressRequired", "Enter the billing address, or choose Same as legal address."],
    ["AGREEMENT_NO_ACTION", "agreementNoAction", "This agreement cannot be approved through this link."],
    ["AGREEMENT_CHANGES_HINT", "agreementChangesHint", "The provider reads your request, revises the agreement and emails you a new link to review it."],
    ["AGREEMENT_CHANGES_PLACEHOLDER", "agreementChangesPlaceholder", "For example: start the service on November 15, or add the side parking lot."],
    ["AGREEMENT_CHANGES_BADGE", "agreementChangesBadge", "Changes requested"],
    ["AGREEMENT_CHANGES_SENT_TITLE", "agreementChangesSentTitle", "Thank you, we received your request"],
    ["AGREEMENT_CHANGES_SENT_BODY", "agreementChangesSentBody", "The provider revises the agreement and emails you a new link to review it. The agreement as it was sent to you is below."],
    ["AGREEMENT_APPROVED", "agreementApproved", "Approved"],
    ["AGREEMENT_ACTIVE", "agreementActive", "Active"],
    ["AGREEMENT_EXPIRED", "agreementExpired", "This agreement has expired. It is shown for reference."],
    ["AGREEMENT_SUSPENDED", "agreementSuspended", "This agreement is suspended. It is shown for reference."],

    ["COMPLETE_APPROVED_TITLE", "completeApprovedTitle", "Agreement approved"],
    ["COMPLETE_ACTIVE_TITLE", "completeActiveTitle", "Agreement active"],
    ["COMPLETE_BODY", "completeBody", "The provider's system has recorded your approval."],
    ["COMPLETE_FINISHING_BODY", "completeFinishingBody", "The provider's system has recorded your approval. The provider is finishing setting up your account; nothing is needed from you."],
    ["PORTAL_TITLE", "portalTitle", "Your customer portal access"],
    ["PORTAL_EMAIL_BODY", "portalEmailBody", "You sign in with {email}. If you have no portal password yet, the provider's system emails one to this address once your access is ready. If you already have a portal password, it stays the same."],
    ["PORTAL_BODY", "portalBody", "You sign in with the primary email address on your account. If you have no portal password yet, the provider's system emails one to that address once your access is ready. If you already have a portal password, it stays the same."],
    ["PORTAL_OPEN", "portalOpen", "Open the customer portal"],

    ["CONTACT_TITLE", "contactTitle", "Contact us"],
    ["CONTACT_PHONE", "contactPhone", "Phone"],
    ["CONTACT_EMAIL", "contactEmail", "Email"],

    ["PREPARING_TITLE", "preparingTitle", "Your agreement is being prepared"],
    ["PREPARING_BODY", "preparingBody", "Nothing is needed from you on this page right now."],
    ["CANCELED_TITLE", "canceledTitle", "This quotation is closed"],
    ["CANCELED_BODY", "canceledBody", "The provider canceled it. Contact them if you expected to review it."],
    ["DECLINED_CLOSED_BODY", "declinedClosedBody", "You declined every option, so the provider closed this quotation. Contact them if you would like new options."],
    ["ARCHIVED_TITLE", "archivedTitle", "This agreement is archived"],
    ["ARCHIVED_BODY", "archivedBody", "It is no longer available through this link."],
    ["UNAVAILABLE_TITLE", "unavailableTitle", "This page is not available right now"],
    ["UNAVAILABLE_BODY", "unavailableBody", "The provider's system has not finished sending it. Try this link again later."],
    ["ROUND_AMBIGUOUS_BODY", "roundAmbiguousBody", "This link covers more than one quotation. Open the link in the provider's newest email, or ask them to send you a new one."],
    ["LINK_MISSING_TITLE", "linkMissingTitle", "This link is incomplete"],
    ["LINK_MISSING_BODY", "linkMissingBody", "Open the full link from your email. Nothing can be shown without it."],
    ["LINK_CLOSED_TITLE", "linkClosedTitle", "This link has expired or was withdrawn"],
    ["LINK_CLOSED_BODY", "linkClosedBody", "Use the link in the provider's newest email. If that link does not work either, ask them to send you a new one."],
    ["LINK_CLOSED_PORTAL", "linkClosedPortal", "If you already have customer portal access, you can sign in there."],
    ["DETAILS_SENT_TITLE", "detailsSentTitle", "Thank you, we received your details"],
    ["DETAILS_SENT_BODY", "detailsSentBody", "The provider prepares your service agreement next and emails you a new link to review it. This link is now closed."],
    ["APPROVAL_SENT_TITLE", "approvalSentTitle", "Thank you, we received your approval"],
    ["APPROVAL_SENT_BODY", "approvalSentBody", "The provider's system has recorded your approval of the service agreement. This link is now closed."],
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

  var MODEL_COPY = { SEASONAL: "modelSeasonal", MONTHLY: "modelMonthly", PER_SERVICE: "modelPerService", RECURRING: "modelRecurring" };

  function optionLabel(option, copy) {
    return option.priceName || copy[MODEL_COPY[option.model]] || fill(copy.optionFallback, { n: option.position });
  }

  ns.copyEntries = ENTRIES.map(function (entry) { return Object.freeze(entry.slice()); });
  ns.defaultCopy = defaultCopy;
  ns.withDefaults = withDefaults;
  ns.fill = fill;
  ns.optionLabel = optionLabel;
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
      options: [choice("INDIVIDUAL", "Individual"), choice("UNINCORPORATED_BUSINESS", "Unincorporated business"), choice("CORPORATE", "Corporation"), choice("ASSOCIATION", "Association"), choice("GOVERNMENT", "Government")],
    }),
    attribute("BILLING_ADDRESS", "java.lang.String", true, "Billing Address", { inputFormat: "address" }),
    attribute("LEGAL_ADDRESS", "java.lang.String", false, "Legal Address", { inputFormat: "address" }),
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
      "CLIENT_DETAILS_RECEIVED", "CREATED", "DRAFT",
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
      approve: {
        code: "SENT_TO_CLIENT-CLIENT_APPROVED",
        source: "SENT_TO_CLIENT",
        attributes: [
          attribute("BILLING_ADDRESS", "java.lang.String", false, "Billing Address", { inputFormat: "address" }),
          attribute("BILLING_SAME_AS_LEGAL", "java.lang.Boolean", false, "Billing Address Is the Legal Address"),
        ],
        billingAddressAttribute: "BILLING_ADDRESS",
        billingSameAsLegalAttribute: "BILLING_SAME_AS_LEGAL",
        billingAddressLimit: 255,
      },
      changes: { code: "SENT_TO_CLIENT-CLIENT_CHANGES_REQUESTED", source: "SENT_TO_CLIENT", messageAttribute: "MESSAGE" },
    },
    orderMetadata: {
      pricingModel: "PRICING_MODEL",
    },
    orderAttributes: {
      property: "SERVICE_PROPERTY",
      pricingModel: "PRICING_MODEL",
      quotationRound: "QUOTATION_ROUND",
    },
    propertyAttributes: {
      address: "ADDRESS",
      plan: "PROPERTY_PLAN",
      area: "SERVICE_AREA_SQFT",
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
    },
    agreementContent: {
      entity: "localizedtextcontent",
      document: "document",
      text: "content",
      language: "language",
    },
    contractDetails: {
      event: "QUOTE_SENT-ACCEPTED",
      requiredBeforeAccept: ["LEGAL_ADDRESS"],
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
      "order-item": { service: "core-bill", segment: "order-item" },
      document: { service: "core", segment: "document" },
      "product-price": { service: "core-pim", segment: "product-price" },
      product: { service: "core-pim", segment: "product" },
      address: { service: "core", segment: "address" },
      unit: { service: "core", segment: "unit" },
      localizedtextcontent: { service: "core", segment: "localized-text-content" },
      resource: { service: "core-rm", segment: "resource", grant: "property" },
    },
    fragment: { token: "token", propertyToken: "property-token", billingAddress: "billing-address", billingAddressMissing: "missing" },
    image: { service: "core", head: "image", tail: "get", width: 440 },
    plan: { service: "core", head: "media", tail: "stream.json" },
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

  function fragmentValue(hash, key) {
    var fragment = String(hash == null ? "" : hash).replace(/^#/, "");
    var prefix = key + "=";
    var found = "";
    fragment.split("&").some(function (pair) {
      if (pair.indexOf(prefix) !== 0) return false;
      try {
        found = decodeURIComponent(pair.slice(prefix.length));
      } catch (_) {
        found = "";
      }
      return true;
    });
    return acceptableToken(found) ? found : "";
  }

  function tokenFromFragment(hash) {
    return fragmentValue(hash, GRANT.fragment.token);
  }

  function propertyTokenFromFragment(hash) {
    return fragmentValue(hash, GRANT.fragment.propertyToken);
  }

  function billingAddressMissingFromFragment(hash) {
    return fragmentValue(hash, GRANT.fragment.billingAddress) === GRANT.fragment.billingAddressMissing;
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

  function safePortalUrl(value) {
    var text = String(value == null ? "" : value).trim();
    if (!text) return "";
    var url;
    try {
      url = new URL(text);
    } catch (_) {
      return "";
    }
    if (url.protocol !== "https:" || url.username || url.password) return "";
    return url.href;
  }

  function imageId(value) {
    var text = String(value).trim();
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text) ? text.toLowerCase() : "";
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
    var propertyToken = typeof settings.propertyToken === "string" ? settings.propertyToken : "";
    var fetchImpl = settings.fetch || (typeof global.fetch === "function" ? global.fetch.bind(global) : null);
    if (!base || typeof fetchImpl !== "function") throw reviewError("unconfigured", 0);
    if (!token) throw reviewError("link-missing", 0);

    function url(service, tail, grantToken) {
      return base + "/" + service + "/i/" + encodeURIComponent(grantToken === undefined ? token : grantToken) + "/" + tail;
    }

    function grantTokenOf(spec) {
      if (spec.grant !== "property") return token;
      if (!propertyToken) throw reviewError("link-missing", 0);
      return propertyToken;
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

    function readPlan(id) {
      var media = imageId(id);
      if (!media) return Promise.reject(reviewError("failed", 0));
      var target = base + "/" + GRANT.plan.service + "/" + GRANT.plan.head + "/" + media + "/" + GRANT.plan.tail;
      return new Promise(function (resolve) {
        resolve(fetchImpl(target, {
          method: "GET",
          credentials: "omit",
          cache: "no-store",
          referrerPolicy: "no-referrer",
          headers: { Accept: "application/json" },
        }));
      }).then(function (response) {
        if (!response || typeof response.status !== "number" || typeof response.text !== "function" || response.status < 200 || response.status >= 300) {
          throw reviewError("failed", response && typeof response.status === "number" ? response.status : 0);
        }
        return Promise.resolve(response.text()).then(null, function () { return ""; }).then(function (body) {
          var payload = parseJson(body);
          if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw reviewError("failed", response.status);
          return payload;
        });
      }, function () {
        throw reviewError("failed", 0);
      });
    }

    return {
      imageUrl: function (id) {
        var image = imageId(id);
        return image ? base + "/" + GRANT.image.service + "/" + GRANT.image.head + "/" + image + "/" + GRANT.image.tail + "?width=" + GRANT.image.width : "";
      },
      readPlan: readPlan,
      introspect: function () {
        return post(url(GRANT.introspect.service, GRANT.introspect.tail), {}, "introspect").then(objectPayload);
      },
      introspectProperties: function () {
        if (!propertyToken) return Promise.reject(reviewError("link-missing", 0));
        return post(url(GRANT.introspect.service, GRANT.introspect.tail, propertyToken), {}, "introspect").then(objectPayload);
      },
      list: function (name) {
        var spec;
        var grantToken;
        try {
          spec = entity(name);
          grantToken = grantTokenOf(spec);
        } catch (error) {
          return Promise.reject(error);
        }
        var rows = [];
        function page(index) {
          return post(url(spec.service, spec.segment + "/list.json", grantToken), { offset: index * GRANT.pageSize, pageSize: GRANT.pageSize }, "read")
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
        return post(url(spec.service, spec.segment + "/get.json", grantTokenOf(spec)) + "?id=" + encodeURIComponent(String(id)), {}, "read").then(objectPayload);
      },
      sendEvent: function (name, id, event, metadata) {
        var spec = entity(name);
        return post(url(spec.service, spec.segment + "/event.json", grantTokenOf(spec)), { id: id, event: event, metadata: metadata || {} }, "command")
          .then(function (result) { return result.payload === undefined ? null : result.payload; });
      },
    };
  }

  ns.adapter = Object.freeze({
    contract: freeze(GRANT),
    createGrantAdapter: createGrantAdapter,
    tokenFromFragment: tokenFromFragment,
    propertyTokenFromFragment: propertyTokenFromFragment,
    billingAddressMissingFromFragment: billingAddressMissingFromFragment,
    safeApiBase: safeApiBase,
    safePortalUrl: safePortalUrl,
    imageId: imageId,
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
    ACCEPTED: "approved",
    ACTIVE: "approved",
    SUSPENDED: "approved",
    COMPLETED: "approved",
    CANCELED: "cancelled",
    DECLINED: "declined",
    CUSTOMER_CHANGES_REQUESTED: "changes",
    DRAFT: "revising",
    QUOTE_PREPARED: "revising",
    CHANGES_REQUESTED: "revising",
    QUOTE_APPROVED: "revising",
  };

  var PRICED_STATUSES = ["new", "approved", "declined", "cancelled", "changes"];

  var SIGNED_AGREEMENT_STATE = "CLIENT_APPROVED";

  var CANCELED_ORDER_STATE = "CANCELED";

  var CANCELED_SERVICE = { kind: "closed", reason: "canceled" };

  var SERVICE_DISPOSITION = {
    ACTIVE: { kind: "completion", completion: "active" },
    SUSPENDED: { kind: "reference", banner: "suspended" },
    COMPLETED: { kind: "reference", banner: "expired" },
  };

  var AGREEMENT_DISPOSITION = {
    QUOTATION: { kind: "unavailable", reason: "retired" },
    QUOTATION_SENT: { kind: "unavailable", reason: "retired" },
    QUOTATION_UPDATE: { kind: "unavailable", reason: "retired" },
    QUOTATION_SEND_FAILED: { kind: "unavailable", reason: "retired" },
    AWAITING_CLIENT_DETAILS: { kind: "unavailable", reason: "retired" },
    CLIENT_DETAILS_RECEIVED: { kind: "unavailable", reason: "retired" },
    CREATED: { kind: "preparing" },
    DRAFT: { kind: "preparing" },
    PENDING_MANAGEMENT_APPROVAL: { kind: "preparing" },
    INTERNALLY_APPROVED: { kind: "preparing" },
    SENT_TO_CLIENT: { kind: "agreement-review" },
    CLIENT_CHANGES_REQUESTED: { kind: "reference", banner: "changes" },
    AGREEMENT_SEND_FAILED: { kind: "unavailable", reason: "send-failed" },
    CLIENT_APPROVED: { kind: "completion", completion: "approved" },
    ACTIVATION_FAILED: { kind: "completion", completion: "finishing" },
    ACTIVE: { kind: "unavailable", reason: "retired" },
    SUSPENDED: { kind: "unavailable", reason: "retired" },
    EXPIRED: { kind: "unavailable", reason: "retired" },
    ARCHIVED: { kind: "closed", reason: "archived" },
    CANCELED: { kind: "closed", reason: "canceled" },
    ACCESS_CLEANUP_RETRY: { kind: "closed", reason: "canceled" },
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

  function localizedText(nls, locale, key) {
    if (!nls || typeof nls !== "object") return "";
    var language = String(locale || "en").split("-")[0];
    var bag = nls[locale] || nls[language] || nls.en || nls[Object.keys(nls)[0]];
    if (!bag || typeof bag !== "object") return "";
    return text(bag[key]).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  }

  function localizedName(nls, locale) {
    return localizedText(nls, locale, "NAME") || localizedText(nls, locale, "name");
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

  function mediaId(value) {
    var id = text(value);
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? id.toLowerCase() : "";
  }

  function mediaIds(value) {
    var source = value;
    if (typeof source === "string" && /^\s*\[/.test(source)) {
      try {
        source = JSON.parse(source);
      } catch (_) {
        return null;
      }
    }
    var list = Array.isArray(source) ? source : source === null || source === undefined || source === "" ? [] : [source];
    var ids = [];
    var invalid = false;
    list.forEach(function (entry) {
      var id = mediaId(entry && typeof entry === "object" ? entry.id : entry);
      if (!id) invalid = true;
      else if (ids.indexOf(id) === -1) ids.push(id);
    });
    return invalid ? null : ids;
  }

  function planReference(values) {
    var ids = [];
    var invalid = false;
    values.forEach(function (value) {
      var found = mediaIds(value);
      if (!found) invalid = true;
      else found.forEach(function (id) { if (ids.indexOf(id) === -1) ids.push(id); });
    });
    return !invalid && ids.length === 1 ? ids[0] : "";
  }

  function pathValue(row, path) {
    var value = row;
    path.split(".").forEach(function (key) {
      value = value && typeof value === "object" ? value[key] : undefined;
    });
    return value;
  }

  function addressText(row, format) {
    if (!row || typeof row !== "object") return "";
    var parts = [];
    var seen = [];
    format.parts.forEach(function (path) {
      var part = text(pathValue(row, path));
      var folded = part.toLowerCase();
      if (!part || seen.indexOf(folded) !== -1) return;
      seen.push(folded);
      parts.push(part);
    });
    return parts.length ? parts.join(format.separator) : text(row[format.fallback]);
  }

  function propertyAddress(resource, addresses, contract) {
    var value = attributeValue(resource, contract.propertyAttributes.address);
    var id = positiveInteger(value && typeof value === "object" ? value.id : value);
    return id && addresses[id] ? addressText(addresses[id], contract.addressFormat) : "";
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

  function presentedAgreementState(row, contract) {
    var state = stateCode(row, contract.agreementStates);
    var spec = contract.agreementOperationStatus;
    var metadata = row && row.metadata;
    if (!spec || !metadata || typeof metadata !== "object") return state;
    var status = text(metadata[spec.key]);
    var presented = spec.presentedStates && Object.prototype.hasOwnProperty.call(spec.presentedStates, state) ? spec.presentedStates[state] : null;
    return presented && status && Object.prototype.hasOwnProperty.call(presented, status) ? presented[status] : state;
  }

  function entityKind(entityType) {
    var tail = text(entityType).split(".").pop() || "";
    var compact = tail.replace(/[^A-Za-z]/g, "").toLowerCase();
    if (compact === "orderitem") return "order-item";
    if (compact === "productprice") return "product-price";
    return compact;
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

  function squareFeet(value) {
    var number = finiteOrNull(value);
    return number === null || number <= 0 ? null : number;
  }

  function formatArea(value, locale) {
    var number = squareFeet(value);
    return number === null ? "" : new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(number);
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
      var clause = null;
      function flush() {
        if (paragraph.length) blocks.push({ kind: "paragraph", text: paragraph.join("\n") });
        paragraph = [];
      }
      chunk.split("\n").forEach(function (line) {
        var trimmed = line.replace(/\s+/g, " ").trim();
        if (!trimmed) return;
        var heading = /^#{1,6}\s+(.+)$/.exec(trimmed);
        var item = /^[-*•]\s+(.+)$/.exec(trimmed);
        var numbered = heading || item ? null : clauseOf(trimmed);
        if (heading) {
          flush();
          clause = null;
          blocks.push({ kind: "heading", text: heading[1] });
        } else if (item) {
          flush();
          clause = null;
          blocks.push({ kind: "item", text: item[1] });
        } else if (numbered) {
          flush();
          clause = numbered;
          blocks.push(clause);
        } else if (clause) {
          clause.text += "\n" + trimmed;
        } else {
          paragraph.push(trimmed);
        }
      });
      flush();
    });
    return blocks;
  }

  var LANGUAGE_ALIASES = { eng: "en", fre: "fr", fra: "fr", rus: "ru", spa: "es", heb: "he", kaz: "kk", chi: "zh", zho: "zh", ara: "ar" };

  function languageTag(language) {
    var code = text(language && typeof language === "object" ? language.code2 || language.id : language).toLowerCase();
    return LANGUAGE_ALIASES[code] || code;
  }

  function agreementTermsText(agreement, contents, locale, contract) {
    var spec = contract.agreementContent;
    var agreementId = positiveInteger(agreement && agreement.id);
    var written = (Array.isArray(contents) ? contents : []).filter(function (row) {
      var owner = row && row[spec.document];
      return agreementId && positiveInteger(owner && typeof owner === "object" ? owner.id : owner) === agreementId && text(row[spec.text]);
    }).sort(function (left, right) { return ascending(positiveInteger(left.id) || 0, positiveInteger(right.id) || 0); });
    var wanted = text(locale).toLowerCase().split("-")[0];
    var chosen = written.filter(function (row) { return languageTag(row[spec.language]) === wanted; })[0] || written[0];
    return chosen ? text(chosen[spec.text]) : "";
  }

  function clauseOf(line) {
    var match = /^(\d{1,3}(?:\.\d{1,3})*)([.)]?)\s+(.+)$/.exec(line);
    if (!match || (!match[2] && match[1].indexOf(".") === -1)) return null;
    return { kind: "clause", number: match[1] + match[2], depth: match[1].split(".").length, text: match[3] };
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
      description: localizedText(definition.nls, locale, "DESCRIPTION"),
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
    var askedFirst = definition && Array.isArray(definition.requiredBeforeAccept) ? definition.requiredBeforeAccept : [];
    return ordered.map(function (code) {
      var field = fieldOf(byCode[code], locale);
      if (askedFirst.indexOf(code) !== -1) field.askedFirst = true;
      return field;
    });
  }

  function legalContact(account) {
    var contacts = account && Array.isArray(account.contacts)
      ? account.contacts.filter(function (contact) { return contact && typeof contact === "object"; })
      : [];
    return contacts.filter(function (contact) { return text(contact.type && contact.type.code).toUpperCase() === "LEGAL"; }).sort(function(a,b){return Number(a.id)-Number(b.id);})[0] || null;
  }

  function contactEntry(contact, typeCode) {
    var entries = (contact && Array.isArray(contact.contactEntries) ? contact.contactEntries : []).filter(function(entry){return entry && text(entry.type && entry.type.code).toUpperCase() === typeCode && text(entry.value);});
    function unique(rows) { var values=[]; rows.forEach(function(entry){var value=text(entry.value);if(values.indexOf(value)<0)values.push(value);});return values; }
    for(var i=0;i<2;i++){var kind=["PRIMARY","WORK"][i];var selected=unique(entries.filter(function(entry){return text(entry.kind && entry.kind.code).toUpperCase() === kind;}));if(selected.length)return selected.length===1?selected[0]:"";}
    var values=unique(entries);return values.length===1?values[0]:"";
  }

  function primaryEmail(account) { return contactEntry(legalContact(account),"EMAIL"); }

  function formatAddress(address, locale) {
    if (!address || typeof address !== "object") return "";
    var region = text(address.state && address.state.code) || localizedName(address.state && address.state.nls, locale);
    var country = localizedName(address.country && address.country.nls, locale) || text(address.country && address.country.code);
    var regionLine = [region, text(address.postalCode)].filter(Boolean).join(" ");
    var cityLine = [text(address.city), regionLine].filter(Boolean).join(", ");
    return [text(address.address1), text(address.address2), cityLine, country].filter(Boolean).join(", ");
  }

  function typedAddress(account, typeCode, locale) {
    var entries = account && Array.isArray(account.addresses) ? account.addresses : [];
    var found = entries.filter(function (entry) {
      return entry && Array.isArray(entry.types) && entry.types.some(function (type) {
        return text(type && type.code).toUpperCase() === typeCode;
      });
    })[0];
    return found ? formatAddress(found.address, locale) : "";
  }

  function billingAddress(account, locale) {
    return typedAddress(account, "BILLING", locale);
  }

  function detailsPrefill(account, fields, locale, contract) {
    var values = {};
    if (!account || typeof account !== "object") return values;
    var contact = legalContact(account);
    var derived = {
      CLIENT_TYPE: attributeText(account, "LEGAL_ENTITY_TYPE"),
      LEGAL_NAME: localizedName(account.nls, locale),
      BILLING_ADDRESS: billingAddress(account, locale),
      LEGAL_ADDRESS: typedAddress(account, "LEGAL", locale),
      REPRESENTATIVE_FIRST_NAME: contact ? text(contact.firstName) : "",
      REPRESENTATIVE_JOB_TITLE: contact ? text(contact.title) : "",
      REPRESENTATIVE_LAST_NAME: contact ? text(contact.lastName) : "",
      REPRESENTATIVE_EMAIL: contactEntry(contact, "EMAIL"),
      REPRESENTATIVE_PHONE: contactEntry(contact, "PHONE"),
    };
    fields.forEach(function (field) {
      if (field.kind === "boolean") return;
      var value = text(derived[field.code]);
      if (!value) return;
      if (field.choices.length && !field.choices.some(function (option) { return option.value === value; })) return;
      values[field.code] = value;
    });
    return values;
  }

  function telHref(value) {
    var match = /^(\+?[\d\s().-]+?)(?:\s*(?:ext\.?|x)\s*\d+)?$/i.exec(value);
    var number = match ? match[1].replace(/[^\d+]/g, "") : "";
    return number.replace(/\D/g, "").length < 3 ? "" : "tel:" + number;
  }

  function mailHref(value) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "";
    return "mailto:" + encodeURIComponent(value).replace(/%40/g, "@");
  }

  function contactOf(provider) {
    return { name: provider, phone: "", phoneHref: "", email: "", emailHref: "" };
  }

  function partiesOf(agreement, account, fields, locale, contract) {
    var owner = agreement && agreement[contract.rawShape.documentOwner];
    var contact = legalContact(account);
    var typeField = fields.filter(function (field) { return field.code === "CLIENT_TYPE"; })[0];
    var typeValue = attributeText(account, "LEGAL_ENTITY_TYPE");
    var typeChoice = typeField ? typeField.choices.filter(function (option) { return option.value === typeValue; })[0] : null;
    var first = contact ? text(contact.firstName) : "";
    var last = contact ? text(contact.lastName) : "";
    return {
      provider: {
        legalName: localizedName(owner && owner.nls, locale),
        representativeName: "",
        representativeJobTitle: "",
        logo: "",
      },
      client: {
        legalName: localizedName(account && account.nls, locale),
        clientType: typeChoice ? typeChoice.label : "",
        billingAddress: billingAddress(account, locale),
        representativeName: [first, last].filter(Boolean).join(" "),
        representativeJobTitle: contact ? text(contact.title) : "",
        email: contactEntry(contact, "EMAIL"),
        phone: contactEntry(contact, "PHONE"),
      },
    };
  }

  function rowsById(rows) {
    var found = {};
    (Array.isArray(rows) ? rows : []).forEach(function (row) {
      var id = positiveInteger(row && row.id);
      if (id && !found[id]) found[id] = row;
    });
    return found;
  }

  function referenced(value, rows) {
    if (!value || typeof value !== "object") return null;
    var id = positiveInteger(value.id);
    return id && rows[id] ? rows[id] : value;
  }

  function priceTypeCode(price) {
    return text(price && price.type && price.type.code).toUpperCase();
  }

  function recurrentPrice(price) {
    return /(^|_)RECURRENT$/.test(priceTypeCode(price));
  }

  function intervalMonths(line, variants) {
    var metadata = line[variants.lineMetadata];
    if (!metadata || typeof metadata !== "object") return null;
    if (text(metadata[variants.intervalUnit]).toUpperCase() !== variants.monthUnit) return null;
    return positiveInteger(metadata[variants.intervalCount]);
  }

  function priceIntervalMonths(price, units, variants) {
    var interval = attributeEntry(price, variants.priceInterval);
    if (!interval || typeof interval !== "object") return null;
    var reference = interval[variants.priceIntervalUnit];
    var unitId = positiveInteger(reference && typeof reference === "object" ? reference.id : reference);
    var unit = unitId && units ? units[unitId] : null;
    if (!unit || text(unit.code).toUpperCase() !== variants.monthUnit) return null;
    return positiveInteger(interval.value);
  }

  function recurringModel(months, variants) {
    var first = months[0];
    var shared = first !== null && months.every(function (count) { return count === first; });
    if (!shared) return variants.recurring;
    return first === 1 ? variants.monthly : variants.seasonal;
  }

  function priceVariant(row, context) {
    var contract = context.contract;
    var variants = contract.priceVariants;
    var raw = row && Array.isArray(row[contract.rawShape.orderLines]) ? row[contract.rawShape.orderLines] : [];
    var lines = raw
      .map(function (line) { return referenced(line, context.catalog.orderItems); })
      .filter(function (line) { return line && typeof line === "object"; });
    if (!lines.length) return { model: "", name: "" };
    var prices = lines.map(function (line) { return referenced(line.itemPrice, context.catalog.productPrices); });
    var names = lines.map(function (line, index) {
      return localizedName(prices[index] && prices[index].nls, context.locale) || localizedName(line.itemPrice && line.itemPrice.nls, context.locale);
    });
    var name = names[0] && names.every(function (entry) { return entry === names[0]; }) ? names[0] : "";
    var typed = prices.every(function (price) { return Boolean(priceTypeCode(price)); });
    var recurrent = prices.filter(recurrentPrice).length;
    var model = "";
    if (typed && recurrent === 0) model = variants.perService;
    if (typed && recurrent === prices.length) {
      model = recurringModel(lines.map(function (line, index) {
        var months = priceIntervalMonths(prices[index], context.catalog.units, variants);
        return months !== null ? months : intervalMonths(line, variants);
      }), variants);
    }
    return { model: model, name: name };
  }

  function linesOf(row, currency, locale, contract, catalog) {
    var raw = row && Array.isArray(row[contract.rawShape.orderLines]) ? row[contract.rawShape.orderLines] : [];
    return raw
      .map(function (line, position) {
        var resolved = referenced(line, catalog.orderItems);
        return { line: resolved, position: position, rank: resolved ? finiteOrNull(resolved.sortOrder) : null };
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
        var price = referenced(line.itemPrice, catalog.productPrices);
        var product = referenced(price && price.product, catalog.products);
        var lineId = positiveInteger(line.id);
        return {
          key: lineId ? "line-" + lineId : "position-" + entry.position,
          product: localizedName(product && product.nls, locale) || localizedName(price && price.product && price.product.nls, locale) || localizedName(price && price.nls, locale),
          quantity: formatQuantity(line.itemCount, locale),
          unitPrice: formatMoney(line.amount, currency, locale),
          recurrent: recurrentPrice(price),
        };
      });
  }

  function recordedModel(row, contract) {
    var metadata = row && row.metadata && typeof row.metadata === "object" ? row.metadata : {};
    var candidates = [text(metadata[contract.orderMetadata.pricingModel]), attributeText(row, contract.orderAttributes.pricingModel)];
    return candidates.map(function (value) { return value.toUpperCase(); }).filter(function (value) {
      return contract.pricingModels.indexOf(value) !== -1;
    })[0] || "";
  }

  function pricingDisplay(model, lines, contract) {
    var variants = contract.priceVariants;
    if (model === variants.perService) return { linePrices: true, total: false };
    var recurring = [variants.monthly, variants.seasonal, variants.recurring].indexOf(model) !== -1;
    if (recurring || (lines.length > 0 && lines.every(function (line) { return line.recurrent; }))) return { linePrices: false, total: true };
    return { linePrices: true, total: true };
  }

  function totalBeforeTaxes(row) {
    if (finiteOrNull(row.totalCharges) !== null) return row.totalCharges;
    return finiteOrNull(row.totalTaxes) ? null : row.grandTotal;
  }

  function optionOf(row, position, context) {
    var contract = context.contract;
    var id = positiveInteger(row.id);
    var state = stateCode(row, contract.orderStates);
    var status = ORDER_STATUS[state] || "unknown";
    var currency = text(row.currency && row.currency.code);
    var statedModel = recordedModel(row, contract);
    var variant = statedModel ? { model: statedModel, name: "" } : priceVariant(row, context);
    var priced = PRICED_STATUSES.indexOf(status) !== -1;
    var lines = priced ? linesOf(row, currency, context.locale, contract, context.catalog) : [];
    return {
      id: id,
      recordKey: "order:" + id,
      position: position,
      model: variant.model,
      priceName: variant.name,
      state: state,
      status: status,
      priced: priced,
      lines: lines,
      recurrent: lines.length > 0 && lines.every(function (line) { return line.recurrent; }),
      pricing: pricingDisplay(variant.model, lines, contract),
      total: priced ? formatMoney(totalBeforeTaxes(row), currency, context.locale) : "",
      awaitingClient: state === contract.orderEvents.approve.source,
      siblingApproved: false,
      actions: { approve: false, decline: false, changes: false },
    };
  }

  function propertyStatus(options) {
    var statuses = options.map(function (option) { return option.status; });
    if (statuses.indexOf("approved") !== -1) return "approved";
    if (statuses.length && statuses.every(function (status) { return status === "declined"; })) return "declined";
    if (statuses.length && statuses.every(function (status) { return status === "declined" || status === "cancelled"; })) return "cancelled";
    if (statuses.indexOf("changes") !== -1 || statuses.indexOf("revising") !== -1) return "changes";
    if (statuses.indexOf("new") !== -1) return "awaiting";
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
        group = byKey[key] = { key: key, resource: propertyId ? context.catalog.resources[propertyId] || null : null, rows: [] };
        groups.push(group);
      }
      group.rows.push(row);
    });
    return groups.map(function (group) {
      var options = group.rows.map(function (row, index) { return optionOf(row, index + 1, context); });
      options.forEach(function (option) {
        option.siblingApproved = options.some(function (other) { return other.id !== option.id && other.status === "approved"; });
      });
      return {
        key: group.key,
        address: group.resource ? propertyAddress(group.resource, context.catalog.addresses, contract) : "",
        plan: group.resource ? planReference([attributeValue(group.resource, contract.propertyAttributes.plan)]) : "",
        area: group.resource ? formatArea(attributeValue(group.resource, contract.propertyAttributes.area), context.locale) : "",
        areaSquareFeet: group.resource ? squareFeet(attributeValue(group.resource, contract.propertyAttributes.area)) : null,
        options: options,
        status: propertyStatus(options),
      };
    });
  }

  function approvalsOffered(properties) {
    return properties.some(function (property) {
      return property.options.some(function (option) {
        return option.actions.approve;
      });
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

  function documentRooted(input) {
    return canRead(input.grant, "document") || (Array.isArray(input.documents) && input.documents.length > 0);
  }

  function pickRound(orders, contract) {
    var rounds = [];
    (Array.isArray(orders) ? orders : []).forEach(function (row) {
      var round = attributeText(row, contract.orderAttributes.quotationRound);
      if (round && rounds.indexOf(round) === -1) rounds.push(round);
    });
    return { round: rounds.length === 1 ? rounds[0] : "", ambiguous: rounds.length > 1 };
  }

  function requestLocale(input, fallback, contract) {
    var picked = pickAgreement(input.documents, contract);
    var account = picked.row || !documentRooted(input) ? pickAccount(input.accounts, picked.row, contract) : null;
    var contact = legalContact(account);
    var language = contact && contact.language;
    var code = language && (language.code2 || language.id);
    code = LANGUAGE_ALIASES[code] || code;
    return typeof code === "string" && /^[a-z]{2,3}(?:-[A-Za-z0-9]+)*$/.test(code) ? code : fallback;
  }

  function catalogOf(input) {
    return {
      orderItems: rowsById(input.orderItems),
      productPrices: rowsById(input.productPrices),
      products: rowsById(input.products),
      resources: rowsById(input.resources),
      addresses: rowsById(input.addresses),
      units: rowsById(input.units),
    };
  }

  function summarized(properties) {
    return {
      summary: summaryOf(properties),
      allDecided: properties.length > 0 && properties.every(function (property) {
        return property.status === "approved" || property.status === "declined" || property.status === "cancelled";
      }),
    };
  }

  function roundModel(input, grant, locale, contract, expiresAt) {
    var ordersById = rowsById(input.orders);
    var orders = Object.keys(ordersById).map(Number).sort(ascending).map(function (id) { return ordersById[id]; });
    if (!orders.length) return { kind: "empty", reason: "no-orders", expiresAt: expiresAt };
    var picked = pickRound(orders, contract);
    if (picked.ambiguous) return { kind: "unavailable", reason: "ambiguous-round", expiresAt: expiresAt };
    var account = pickAccount(input.accounts, null, contract);
    var properties = propertiesOf(orders, { locale: locale, contract: contract, catalog: catalogOf(input) });
    grantActions(properties, grant, contract);
    var decided = summarized(properties);
    var fields = detailFields(contract.contractDetails, locale);
    return {
      kind: "quote-review",
      reason: "",
      banner: "",
      completion: "",
      expiresAt: expiresAt,
      round: picked.round,
      agreement: null,
      names: { provider: "", client: localizedName(account && account.nls, locale) },
      parties: null,
      contact: null,
      properties: properties,
      summary: decided.summary,
      allDecided: decided.allDecided,
      unreadableOrders: 0,
      accountUnavailable: Boolean(input.accountFailed),
      details: {
        available: approvalsOffered(properties),
        fields: fields,
        prefill: detailsPrefill(account, fields, locale, contract),
      },
      canApproveAgreement: false,
      canRequestAgreementChanges: false,
      primaryEmail: primaryEmail(account, contract),
    };
  }

  function serviceDisposition(orders, contract) {
    var states = orders.map(function (row) { return stateCode(row, contract.orderStates); });
    var found = Object.keys(SERVICE_DISPOSITION).filter(function (code) { return states.indexOf(code) !== -1; })[0];
    if (found) return SERVICE_DISPOSITION[found];
    return states.length && states.every(function (code) { return code === CANCELED_ORDER_STATE; }) ? CANCELED_SERVICE : null;
  }

  function reviewModel(input, options) {
    var locale = options.locale;
    var contract = options.contract;
    var grant = input.grant || grantOf(null);
    var expiresAt = formatDate(grant.expiresAt, locale);
    if (!documentRooted(input)) return roundModel(input, grant, locale, contract, expiresAt);
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
    var state = presentedAgreementState(agreement, contract);
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

    var disposition = (state === SIGNED_AGREEMENT_STATE && serviceDisposition(readable, contract))
      || AGREEMENT_DISPOSITION[state] || { kind: "unavailable", reason: "unknown-state" };
    var properties = propertiesOf(readable, { locale: locale, contract: contract, catalog: catalogOf(input) });
    var decided = summarized(properties);
    var approveEvent = contract.agreementEvents.approve;
    var changesEvent = contract.agreementEvents.changes;

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
        terms: termsBlocks(agreementTermsText(agreement, input.contents, locale, contract)),
      },
      names: {
        provider: parties.provider.legalName,
        client: localizedName(account && account.nls, locale) || parties.client.legalName,
      },
      parties: parties,
      contact: contactOf(parties.provider.legalName),
      properties: properties,
      summary: decided.summary,
      allDecided: decided.allDecided,
      unreadableOrders: unreadable,
      accountUnavailable: Boolean(input.accountFailed),
      details: { available: false, fields: [], prefill: {} },
      canApproveAgreement: state === approveEvent.source && eventGranted(grant, "document", agreementId, approveEvent.code),
      canRequestAgreementChanges: state === changesEvent.source && eventGranted(grant, "document", agreementId, changesEvent.code),
      primaryEmail: primaryEmail(account, contract),
    };
  }

  ns.normalizer = Object.freeze({
    orderStatus: Object.freeze(Object.assign({}, ORDER_STATUS)),
    agreementDisposition: Object.freeze(Object.assign({}, AGREEMENT_DISPOSITION)),
    serviceDisposition: Object.freeze(Object.assign({}, SERVICE_DISPOSITION)),
    positiveInteger: positiveInteger,
    localizedName: localizedName,
    planReference: planReference,
    addressText: addressText,
    attributeValue: attributeValue,
    idList: idList,
    stateCode: stateCode,
    entityKind: entityKind,
    grantOf: grantOf,
    canRead: canRead,
    eventGranted: eventGranted,
    formatMoney: formatMoney,
    formatQuantity: formatQuantity,
    recurrentPrice: recurrentPrice,
    priceVariant: priceVariant,
    formatDate: formatDate,
    termsBlocks: termsBlocks,
    agreementTermsText: agreementTermsText,
    pricingDisplay: pricingDisplay,
    primaryEmail: primaryEmail,
    telHref: telHref,
    mailHref: mailHref,
    detailFields: detailFields,
    detailsPrefill: detailsPrefill,
    pickAgreement: pickAgreement,
    pickAccount: pickAccount,
    packageOrderIds: packageOrderIds,
    pickRound: pickRound,
    propertyStatus: propertyStatus,
    requestLocale: requestLocale,
    reviewModel: reviewModel,
  });
})(typeof window !== "undefined" ? window : globalThis);
(function (global) {
  "use strict";

  var ns = global.ClientReview || (global.ClientReview = {});

  var EARTH_RADIUS_METERS = 6378137;
  var SQUARE_FOOT_IN_SQUARE_METERS = 0.09290304;
  var MAP_SURFACE = "GOOGLE_MAPS";
  var TONES = 5;
  var SVG_NAMESPACE = "http://www.w3.org/2000/svg";
  var DRAWING_SCALE = 100000;
  var DRAWING_MIN_SPAN = 0.0002;
  var DRAWING_PADDING = 0.08;
  var DRAWING_MIN_ASPECT = 16 / 9;
  var DRAWING_MAX_ASPECT = 5 / 2;
  var DRAWING_DOT = 1 / 70;
  var METERS_PER_DEGREE = 111320;
  var AREA_TOLERANCE_SQUARE_FEET = 1;

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function radians(degrees) {
    return degrees * Math.PI / 180;
  }

  function position(value) {
    if (!Array.isArray(value) || value.length < 2 || value.length > 3) return null;
    var lng = value[0];
    var lat = value[1];
    if (!finite(lng) || !finite(lat) || Math.abs(lng) > 180 || Math.abs(lat) > 90) return null;
    if (value.length === 3 && !finite(value[2])) return null;
    return { lat: lat, lng: lng };
  }

  function path(value, minimum) {
    if (!Array.isArray(value) || value.length < minimum) return null;
    var points = [];
    for (var index = 0; index < value.length; index += 1) {
      var point = position(value[index]);
      if (!point) return null;
      points.push(point);
    }
    return points;
  }

  function polygon(value) {
    if (!Array.isArray(value) || !value.length) return null;
    var rings = [];
    for (var index = 0; index < value.length; index += 1) {
      var ring = path(value[index], 4);
      if (!ring) return null;
      rings.push(ring);
    }
    return rings;
  }

  function shapeOf(geometry) {
    if (!geometry || typeof geometry !== "object") return null;
    var coordinates = geometry.coordinates;
    if (geometry.type === "Point") {
      var point = position(coordinates);
      return point ? { kind: "point", position: point } : null;
    }
    if (geometry.type === "LineString") {
      var line = path(coordinates, 2);
      return line ? { kind: "line", path: line } : null;
    }
    if (geometry.type === "Polygon") {
      var single = polygon(coordinates);
      return single ? { kind: "area", polygons: [single] } : null;
    }
    if (geometry.type === "MultiPolygon") {
      if (!Array.isArray(coordinates) || !coordinates.length) return null;
      var polygons = [];
      for (var index = 0; index < coordinates.length; index += 1) {
        var part = polygon(coordinates[index]);
        if (!part) return null;
        polygons.push(part);
      }
      return { kind: "area", polygons: polygons };
    }
    if (geometry.type === "Circle") {
      var center = position(coordinates);
      return center && finite(geometry.radius) && geometry.radius > 0 ? { kind: "circle", center: center, radius: geometry.radius } : null;
    }
    return null;
  }

  function projector(origin) {
    var scale = Math.cos(radians(origin.lat));
    return function (point) {
      return [EARTH_RADIUS_METERS * radians(point.lng - origin.lng) * scale, EARTH_RADIUS_METERS * radians(point.lat - origin.lat)];
    };
  }

  function ringArea(ring, project) {
    var twice = 0;
    ring.forEach(function (point, index) {
      var here = project(point);
      var next = project(ring[(index + 1) % ring.length]);
      twice += here[0] * next[1] - next[0] * here[1];
    });
    return Math.abs(twice) / 2;
  }

  function polygonArea(rings, project) {
    var holes = 0;
    rings.slice(1).forEach(function (ring) { holes += ringArea(ring, project); });
    return Math.max(0, ringArea(rings[0], project) - holes);
  }

  function shapeArea(shape) {
    if (shape.kind === "circle") return Math.PI * shape.radius * shape.radius;
    if (shape.kind !== "area") return 0;
    var project = projector(shape.polygons[0][0][0]);
    var area = 0;
    shape.polygons.forEach(function (rings) { area += polygonArea(rings, project); });
    return area;
  }

  function shapePoints(shape) {
    if (shape.kind === "point") return [shape.position];
    if (shape.kind === "line") return shape.path;
    if (shape.kind === "circle") {
      var latSpan = shape.radius / EARTH_RADIUS_METERS * 180 / Math.PI;
      var lngSpan = latSpan / Math.max(Math.cos(radians(shape.center.lat)), 0.01);
      return [
        { lat: shape.center.lat + latSpan, lng: shape.center.lng + lngSpan },
        { lat: shape.center.lat - latSpan, lng: shape.center.lng - lngSpan },
      ];
    }
    var points = [];
    shape.polygons.forEach(function (rings) { points = points.concat(rings[0]); });
    return points;
  }

  function boundsOf(elements) {
    var bounds = { north: -90, south: 90, east: -180, west: 180 };
    elements.forEach(function (element) {
      element.shapes.forEach(function (shape) {
        shapePoints(shape).forEach(function (point) {
          bounds.north = Math.max(bounds.north, point.lat);
          bounds.south = Math.min(bounds.south, point.lat);
          bounds.east = Math.max(bounds.east, point.lng);
          bounds.west = Math.min(bounds.west, point.lng);
        });
      });
    });
    return bounds;
  }

  function nameOf(element, locale) {
    var localized = ns.normalizer && typeof ns.normalizer.localizedName === "function" ? ns.normalizer.localizedName(element.nls, locale) : "";
    var label = typeof element.label === "string" ? element.label.replace(/\s+/g, " ").trim() : "";
    return localized || label;
  }

  function parse(raw, locale) {
    if (!raw || typeof raw !== "object" || raw.type !== "PropertyPlan" || raw.schemaVersion !== 1 || !Array.isArray(raw.elements)) return null;
    var tones = {};
    var toneCount = 0;
    var elements = [];
    var area = 0;
    raw.elements.forEach(function (element) {
      if (!element || typeof element !== "object" || !Array.isArray(element.overlays)) return;
      var shapes = [];
      element.overlays.forEach(function (overlay) {
        if (!overlay || typeof overlay !== "object" || overlay.map !== MAP_SURFACE) return;
        var shape = shapeOf(overlay.geometry);
        if (shape) shapes.push(shape);
      });
      if (!shapes.length) return;
      var type = "type-" + String(element.elementTypeDictionaryId);
      if (!Object.prototype.hasOwnProperty.call(tones, type)) {
        tones[type] = toneCount % TONES + 1;
        toneCount += 1;
      }
      var elementArea = 0;
      shapes.forEach(function (shape) { elementArea += shapeArea(shape); });
      area += elementArea;
      var kind = shapes[0].kind === "circle" ? "area" : shapes[0].kind;
      var squareFeet = elementArea / SQUARE_FOOT_IN_SQUARE_METERS;
      elements.push({
        key: "element-" + (elements.length + 1),
        position: elements.length + 1,
        name: nameOf(element, locale),
        tone: tones[type],
        kind: kind,
        shapes: shapes,
        squareFeet: squareFeet,
        areaText: kind === "area" ? formatArea(squareFeet, locale) : "",
      });
    });
    if (!elements.length) return null;
    var planSquareFeet = area / SQUARE_FOOT_IN_SQUARE_METERS;
    return { elements: elements, squareFeet: planSquareFeet, areaText: formatArea(planSquareFeet, locale), bounds: boundsOf(elements) };
  }

  function formatArea(squareFeet, locale) {
    if (!finite(squareFeet) || squareFeet <= 0) return "";
    try {
      return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(squareFeet);
    } catch (_) {
      return new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(squareFeet);
    }
  }

  function sumsTo(plan, squareFeet) {
    return Boolean(plan) && finite(squareFeet) && squareFeet > 0 && Math.abs(plan.squareFeet - squareFeet) <= AREA_TOLERANCE_SQUARE_FEET;
  }

  function frameOf(bounds) {
    var cos = Math.cos(radians((bounds.north + bounds.south) / 2));
    var spanX = (bounds.east - bounds.west) * cos * DRAWING_SCALE;
    var spanY = (bounds.north - bounds.south) * DRAWING_SCALE;
    var minimum = DRAWING_MIN_SPAN * DRAWING_SCALE;
    var reach = Math.max(spanX, spanY, minimum);
    var width = Math.max(spanX, minimum) + reach * DRAWING_PADDING * 2;
    var height = Math.max(spanY, minimum) + reach * DRAWING_PADDING * 2;
    if (width / height < DRAWING_MIN_ASPECT) width = height * DRAWING_MIN_ASPECT;
    if (width / height > DRAWING_MAX_ASPECT) height = width / DRAWING_MAX_ASPECT;
    return {
      x: spanX / 2 - width / 2,
      y: spanY / 2 - height / 2,
      width: width,
      height: height,
      dot: reach * DRAWING_DOT,
      project: function (point) {
        return [(point.lng - bounds.west) * cos * DRAWING_SCALE, (bounds.north - point.lat) * DRAWING_SCALE];
      },
    };
  }

  function svgNode(doc, tag, attributes) {
    var node = doc.createElementNS(SVG_NAMESPACE, tag);
    Object.keys(attributes).forEach(function (name) { node.setAttribute(name, String(attributes[name])); });
    return node;
  }

  function shapeNode(doc, shape, element, frame, prefix) {
    var attributes = { "class": prefix + "__shape", "data-tone": String(element.tone), "data-kind": shape.kind };
    if (shape.kind === "area") {
      attributes.d = shape.polygons.map(function (rings) {
        return rings.map(function (ring) { return "M" + ring.map(function (point) { return frame.project(point).join(" "); }).join("L") + "Z"; }).join("");
      }).join("");
      attributes["fill-rule"] = "evenodd";
      return svgNode(doc, "path", attributes);
    }
    if (shape.kind === "line") {
      attributes.points = shape.path.map(function (point) { return frame.project(point).join(","); }).join(" ");
      return svgNode(doc, "polyline", attributes);
    }
    var center = frame.project(shape.kind === "circle" ? shape.center : shape.position);
    attributes.cx = center[0];
    attributes.cy = center[1];
    attributes.r = shape.kind === "circle" ? shape.radius / METERS_PER_DEGREE * DRAWING_SCALE : frame.dot;
    return svgNode(doc, "circle", attributes);
  }

  function ringCentre(ring, frame) {
    var points = ring.map(frame.project);
    var twice = 0;
    var x = 0;
    var y = 0;
    points.forEach(function (here, index) {
      var next = points[(index + 1) % points.length];
      var cross = here[0] * next[1] - next[0] * here[1];
      twice += cross;
      x += (here[0] + next[0]) * cross;
      y += (here[1] + next[1]) * cross;
    });
    return { weight: Math.abs(twice) / 2, point: twice ? [x / (3 * twice), y / (3 * twice)] : points[0] };
  }

  function labelPoint(element, frame) {
    var best = null;
    element.shapes.forEach(function (shape) {
      var candidates = [];
      if (shape.kind === "circle") {
        var reach = shape.radius / METERS_PER_DEGREE * DRAWING_SCALE;
        candidates.push({ weight: Math.PI * reach * reach, point: frame.project(shape.center) });
      } else if (shape.kind === "area") {
        shape.polygons.forEach(function (rings) { candidates.push(ringCentre(rings[0], frame)); });
      }
      candidates.forEach(function (candidate) {
        if (!best || candidate.weight > best.weight) best = candidate;
      });
    });
    return best ? best.point : null;
  }

  function percent(value) {
    return Math.min(Math.max(value, 0), 1) * 100 + "%";
  }

  function figure(doc, plan, options) {
    var settings = options || {};
    var prefix = settings.classPrefix;
    var frame = frameOf(plan.bounds);
    var node = doc.createElement("div");
    node.className = prefix + "__figure";
    var svg = svgNode(doc, "svg", {
      "class": prefix + "__drawing",
      viewBox: [frame.x, frame.y, frame.width, frame.height].join(" "),
      role: "img",
      "aria-label": settings.label || "",
    });
    plan.elements.forEach(function (element) {
      element.shapes.forEach(function (shape) { svg.appendChild(shapeNode(doc, shape, element, frame, prefix)); });
    });
    node.appendChild(svg);
    var labels = 0;
    plan.elements.forEach(function (element) {
      var point = labelPoint(element, frame);
      var name = typeof settings.nameOf === "function" ? settings.nameOf(element) : element.name;
      if (!point || !name) return;
      var label = doc.createElement("span");
      label.className = prefix + "__label";
      label.setAttribute("data-tone", String(element.tone));
      label.setAttribute("aria-hidden", "true");
      label.style.left = percent((point[0] - frame.x) / frame.width);
      label.style.top = percent((point[1] - frame.y) / frame.height);
      label.textContent = name;
      node.appendChild(label);
      labels += 1;
    });
    node.setAttribute("data-labels", String(labels));
    return node;
  }

  ns.plan = Object.freeze({
    tones: TONES,
    parse: parse,
    formatArea: formatArea,
    sumsTo: sumsTo,
    figure: figure,
  });
})(typeof window !== "undefined" ? window : globalThis);
(function (global) {
  "use strict";

  var ns = global.ClientReview || (global.ClientReview = {});
  var KINDS = ["agreement-review", "reference", "completion"];
  var STATUSES = { new: "optionNew", approved: "optionApproved", declined: "optionDeclined", cancelled: "optionCancelled", changes: "optionChanges", revising: "optionRevising", unknown: "optionUnknown" };

  function offered(snapshot) {
    return snapshot.phase === "ready" && snapshot.view && KINDS.indexOf(snapshot.view.kind) !== -1;
  }

  function available(snapshot) {
    return Boolean(offered(snapshot) && !snapshot.refreshing && !snapshot.view.unreadableOrders && !snapshot.view.accountUnavailable);
  }

  function isAgreement(view) {
    return ["agreement-review", "reference", "completion"].indexOf(view.kind) !== -1;
  }

  function statusOf(view, copy) {
    if (view.kind === "agreement-review") return copy.agreementAwaiting;
    if (view.kind === "completion") return view.completion === "active" ? copy.agreementActive : copy.agreementApproved;
    if (view.kind === "reference") return view.banner === "changes" ? copy.agreementChangesBadge : view.banner === "expired" ? copy.agreementExpired : copy.agreementSuspended;
    return "";
  }

  function joined(name, title) { return name ? name + (title ? ", " + title : "") : ""; }

  function build(snapshot, copy, options) {
    if (!available(snapshot)) throw new Error("The document is unavailable or incomplete");
    var settings = options || {};
    var engine = settings.engine || global.jspdf;
    var font = settings.font || global.ClientReviewPdfFont;
    if (!engine || typeof engine.jsPDF !== "function" || !font) throw new Error("PDF assets are unavailable");
    var doc = new engine.jsPDF({ unit: "pt", format: "a4", compress: true, putOnlyUsedFonts: true });
    doc.addFileToVFS("Roboto-Regular.ttf", font);
    doc.addFont("Roboto-Regular.ttf", "Review", "normal");
    doc.setFont("Review", "normal");
    var view = snapshot.view;
    var agreement = isAgreement(view);
    var title = agreement ? copy.agreementEyebrow : copy.quoteEyebrow;
    var identity = title + " #" + view.agreement.id;
    doc.setProperties({ title: identity, author: view.names.provider || "", creator: "ServiceWand", subject: title });
    var width = doc.internal.pageSize.getWidth();
    var height = doc.internal.pageSize.getHeight();
    var margin = 44;
    var contentWidth = width - margin * 2;
    var bottom = height - 58;
    var y = margin + 24;
    var ink = [31, 43, 61];
    var muted = [89, 105, 125];
    var accent = [30, 92, 139];

    function safeText(value) {
      var valueText = String(value == null ? "" : value).replace(/\u00a0/g, " ").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
      var metadata = doc.getFont().metadata;
      if (metadata && typeof metadata.characterToGlyph === "function") {
        Array.from(valueText).forEach(function (character) {
          if (!/\s/.test(character) && !metadata.characterToGlyph(character.codePointAt(0))) throw new Error("The PDF font does not support this text");
        });
      }
      return valueText;
    }

    function newPage() {
      doc.addPage();
      y = margin;
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, muted);
      var heading = doc.splitTextToSize(safeText(identity), contentWidth);
      doc.text(heading, margin, y);
      y += heading.length * 12 + 16;
    }

    function ensure(size) { if (y + size > bottom) newPage(); }

    function paragraph(value, size, color, gap, inset) {
      var fontSize = size || 10;
      var left = inset || 0;
      doc.setFontSize(fontSize);
      var lines = doc.splitTextToSize(safeText(value), contentWidth - left);
      lines.forEach(function (line) {
        ensure(fontSize * 1.45);
        doc.setFontSize(fontSize);
        doc.setTextColor.apply(doc, color || ink);
        doc.text(line, margin + left, y);
        y += fontSize * 1.45;
      });
      y += gap === undefined ? 6 : gap;
    }

    function section(label) {
      ensure(58);
      y += 12;
      doc.setDrawColor(220, 228, 236);
      doc.line(margin, y - 8, width - margin, y - 8);
      paragraph(label, 13, accent, 9);
    }

    function fact(label, value) { paragraph(label + ": " + (value || copy.valueNotStated), 10); }

    function tableHeader(unpriced) {
      ensure(35);
      doc.setFillColor(240, 245, 249);
      doc.rect(margin, y - 11, contentWidth, 24, "F");
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, muted);
      doc.text(safeText(copy.lineService), margin + 8, y + 3);
      doc.text(safeText(copy.lineQuantity), margin + contentWidth * 0.61, y + 3);
      if (!unpriced) doc.text(safeText(copy.lineUnitPrice), margin + contentWidth * 0.81, y + 3);
      y += 31;
    }

    function lines(option) {
      if (!option.lines.length) { paragraph(copy.linesEmpty, 10, muted); return; }
      var unpriced = !option.pricing.linePrices;
      var columns = unpriced ? [contentWidth * 0.61 - 18, contentWidth * 0.39 - 16] : [contentWidth * 0.61 - 18, contentWidth * 0.2 - 16, contentWidth * 0.19 - 16];
      var offsets = [8, contentWidth * 0.61, contentWidth * 0.81];
      tableHeader(unpriced);
      option.lines.forEach(function (line) {
        var cells = [line.product || copy.serviceUnnamed, line.quantity || copy.valueNotStated];
        if (!unpriced) cells.push(line.recurrent ? copy.lineIncluded : line.unitPrice || copy.valueNotStated);
        doc.setFontSize(10);
        var wrapped = cells.map(function (value, i) { return doc.splitTextToSize(safeText(value), columns[i]); });
        var count = Math.max.apply(Math, wrapped.map(function (cell) { return cell.length; }));
        for (var i = 0; i < count; i += 1) {
          if (y + 15 > bottom) { newPage(); tableHeader(unpriced); }
          doc.setFontSize(10);
          doc.setTextColor.apply(doc, ink);
          wrapped.forEach(function (cell, column) { if (cell[i]) doc.text(cell[i], margin + offsets[column], y); });
          y += 15;
        }
        doc.setDrawColor(230, 236, 242);
        doc.line(margin, y, width - margin, y);
        y += 13;
      });
    }

    doc.setFillColor.apply(doc, accent);
    doc.rect(margin, margin - 17, contentWidth, 3, "F");
    if (settings.logo) {
      try {
        var props = doc.getImageProperties(settings.logo);
        var scale = Math.min(100 / props.width, 40 / props.height);
        doc.addImage(settings.logo, "PNG", width - margin - props.width * scale, y, props.width * scale, props.height * scale);
        y += 52;
      } catch (_) {}
    }
    paragraph(identity, 24, ink, 9);
    var status = statusOf(view, copy);
    if (status) paragraph(status, 11, accent, 10);
    if (view.names.provider) fact(copy.fromLabel, view.names.provider);
    if (view.names.client) fact(copy.forLabel, view.names.client);
    paragraph(ns.fill(copy.pdfSnapshot, { date: new Intl.DateTimeFormat(settings.locale || "en", { dateStyle: "medium", timeStyle: "short" }).format(settings.now || new Date()) }), 9, muted, 10);

    if (agreement) {
      section(copy.partyProvider);
      [[copy.partyLegalName, view.parties.provider.legalName], [copy.partyRepresentative, joined(view.parties.provider.representativeName, view.parties.provider.representativeJobTitle)]].filter(function (row) { return row[1]; }).forEach(function (row) { fact(row[0], row[1]); });
      section(copy.partyClient);
      var client = view.parties.client;
      [[copy.partyLegalName, client.legalName], [copy.partyClientType, client.clientType], [copy.partyBillingAddress, client.billingAddress], [copy.partyRepresentative, joined(client.representativeName, client.representativeJobTitle)], [copy.partyEmail, client.email], [copy.partyPhone, client.phone]].filter(function (row) { return row[1]; }).forEach(function (row) { fact(row[0], row[1]); });
      var term = view.agreement;
      var dates = [[copy.termEffective, term.effectiveDate], [copy.termStart, term.termStart], [copy.termEnd, term.termEnd]].filter(function (row) { return row[1]; });
      if (dates.length) { section(copy.termTitle); dates.forEach(function (row) { fact(row[0], row[1]); }); }
    }

    section(copy.servicesTitle);
    view.properties.forEach(function (property) {
      var options = property.options;
      if (!options.length) return;
      ensure(70);
      paragraph(property.address || copy.addressUnavailable, 12, ink, 10);
      if (property.area) fact(copy.propertyArea, ns.fill(copy.planAreaValue, { area: property.area }));
      options.forEach(function (option) {
        ensure(65);
        var label = ns.optionLabel(option, copy);
        paragraph(label + " - " + (copy[STATUSES[option.status]] || copy.optionUnknown), 11, accent, 10);
        if (!option.priced) { paragraph(option.status === "revising" ? copy.noteRevising : copy.noteNoActions, 10, muted); return; }
        lines(option);
        if (option.pricing.total) paragraph(copy.orderTotal + ": " + (option.total || copy.valueNotStated), 12, ink, 4);
        else paragraph(copy.perServiceNote, 10, muted, 4);
        paragraph(copy.taxesNote, 10, muted, 16);
      });
    });
    if (!view.properties.length) paragraph(copy.linesEmpty, 10, muted);

    if (agreement) {
      section(copy.termsTitle);
      if (!view.agreement.terms.length) paragraph(copy.termsEmpty, 10, muted);
      view.agreement.terms.forEach(function (block) {
        var prefix = block.kind === "clause" ? block.number + " " : block.kind === "item" ? "- " : "";
        var inset = block.kind === "clause" ? Math.min(block.depth || 0, 3) * 10 : 0;
        if (block.kind === "heading") ensure(45);
        paragraph(prefix + block.text, block.kind === "heading" ? 12 : 10, ink, 8, inset);
      });
    }
    var contact = snapshot.contact || view.contact;
    if (contact && (contact.phone || contact.email)) {
      section(copy.contactTitle);
      if (contact.phone) fact(copy.contactPhone, contact.phone);
      if (contact.email) fact(copy.contactEmail, contact.email);
    }
    var pageCount = doc.getNumberOfPages();
    for (var page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, muted);
      doc.text(ns.fill(copy.pdfPage, { page: page, pages: pageCount }), width - margin, height - 28, { align: "right" });
    }
    return { document: doc, bytes: doc.output("arraybuffer"), filename: (agreement ? "service-agreement-" : "quotation-") + view.agreement.id + ".pdf" };
  }

  function logoOf(url) {
    if (!url || typeof global.Image !== "function" || !global.document) return Promise.resolve(null);
    return new Promise(function (resolve) {
      var image = new global.Image();
      image.referrerPolicy = "no-referrer";
      var timer = global.setTimeout(function () { finish(null); }, 3000);
      function finish(value) { global.clearTimeout(timer); image.onload = image.onerror = null; resolve(value); }
      image.onerror = function () { finish(null); };
      image.onload = function () {
        try {
          var canvas = global.document.createElement("canvas");
          var scale = Math.min(1, 600 / image.naturalWidth, 240 / image.naturalHeight);
          canvas.width = Math.max(1, image.naturalWidth * scale);
          canvas.height = Math.max(1, image.naturalHeight * scale);
          canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
          finish(canvas.toDataURL("image/png"));
        } catch (_) { finish(null); }
      };
      image.src = url;
    });
  }

  function create(snapshot, copy, locale) {
    return logoOf(snapshot.logoUrl).then(function (logo) { return build(snapshot, copy, { logo: logo, locale: locale }); });
  }

  function save(result) {
    result.document.save(result.filename);
  }

  ns.pdf = Object.freeze({ offered: offered, available: available, build: build, create: create, save: save });
})(typeof window !== "undefined" ? window : globalThis);
(function (global) {
  "use strict";

  var ns = global.ClientReview || (global.ClientReview = {});

  var KEY_PATTERN = /^[A-Za-z0-9_-]{20,128}$/;
  var SCRIPT_URL = "https://maps.googleapis.com/maps/api/js";
  var LIBRARIES = ["maps", "places", "geocoding"];
  var ADDRESS_ZOOM = 17;
  var PLAN_PADDING = 28;
  var SUGGESTION_LIMIT = 5;
  var SUGGESTION_DELAY = 250;
  var SUGGESTION_MINIMUM = 3;
  var SUGGESTION_TYPES = ["street_address", "premise", "subpremise", "route"];
  var TONE_TOKENS = ["--accent", "--warn", "--ok", "--danger", "--accent-3"];

  function keyOf(value) {
    var text = String(value == null ? "" : value).trim();
    return KEY_PATTERN.test(text) ? text : "";
  }

  function el(tag, className, attrs) {
    var node = global.document.createElement(tag);
    if (className) node.className = className;
    Object.keys(attrs || {}).forEach(function (name) {
      var value = attrs[name];
      if (value === undefined || value === null || value === false) return;
      node.setAttribute(name, value === true ? "" : String(value));
    });
    return node;
  }

  function latLng(value) {
    if (!value) return null;
    var lat = typeof value.lat === "function" ? value.lat() : value.lat;
    var lng = typeof value.lng === "function" ? value.lng() : value.lng;
    return typeof lat === "number" && isFinite(lat) && typeof lng === "number" && isFinite(lng) ? { lat: lat, lng: lng } : null;
  }

  function darkMode() {
    var root = global.document && global.document.documentElement;
    return Boolean(root && root.dataset && root.dataset.mode === "dark");
  }

  function tokenColor(name) {
    var root = global.document && global.document.documentElement;
    if (!root || typeof global.getComputedStyle !== "function") return "";
    try {
      return String(global.getComputedStyle(root).getPropertyValue(name) || "").trim();
    } catch (_) {
      return "";
    }
  }

  function toneColor(tone) {
    return tokenColor(TONE_TOKENS[tone - 1] || TONE_TOKENS[0]);
  }

  function allowOriginReferrer(doc) {
    var meta = doc && typeof doc.querySelector === "function" ? doc.querySelector("meta[name=\"referrer\"]") : null;
    if (meta && String(meta.getAttribute("content") || "").trim().toLowerCase() === "no-referrer") meta.setAttribute("content", "strict-origin");
  }

  function scriptLoader(key, onAuthFailure) {
    var promise = null;
    return function () {
      if (promise) return promise;
      promise = new Promise(function (resolve, reject) {
        var doc = global.document;
        var callback = "__clientReviewMapsReady";
        while (Object.prototype.hasOwnProperty.call(global, callback)) callback += "_";
        allowOriginReferrer(doc);
        if (typeof onAuthFailure === "function" && typeof global.gm_authFailure !== "function") {
          global.gm_authFailure = function () { onAuthFailure(); };
        }
        global[callback] = function () {
          delete global[callback];
          var maps = global.google && global.google.maps;
          if (maps && typeof maps.importLibrary === "function") resolve(maps);
          else reject(new Error("maps-unavailable"));
        };
        var script = doc.createElement("script");
        script.async = true;
        script.src = SCRIPT_URL + "?key=" + encodeURIComponent(key) + "&loading=async&v=weekly&callback=" + callback;
        script.addEventListener("error", function () {
          delete global[callback];
          reject(new Error("maps-script-failed"));
        });
        doc.head.appendChild(script);
      }).then(function (maps) {
        return Promise.all(LIBRARIES.map(function (name) { return maps.importLibrary(name); })).then(function () { return maps; });
      });
      return promise;
    };
  }

  function service(options) {
    var settings = options || {};
    var key = keyOf(settings.key);
    var load = typeof settings.load === "function" ? settings.load : key ? scriptLoader(key, function () { fail(); }) : null;
    if (!load) return null;
    var copy = settings.copy || {};
    var delay = typeof settings.suggestionDelay === "number" ? settings.suggestionDelay : SUGGESTION_DELAY;
    var api = null;
    var failed = false;
    var loading = null;
    var pending = [];
    var addresses = {};
    var plans = {};

    function hold(promise) {
      var tracked = promise.then(null, function () { return null; });
      pending.push(tracked);
      tracked.then(function () {
        var index = pending.indexOf(tracked);
        if (index !== -1) pending.splice(index, 1);
      });
      return tracked;
    }

    function idle() {
      if (!pending.length) return null;
      return Promise.all(pending.slice()).then(function () { return idle(); });
    }

    function setState(target, state) {
      target.state = state;
      target.node.setAttribute("data-state", state);
    }

    function fail() {
      failed = true;
      Object.keys(addresses).forEach(function (code) { setState(addresses[code], "failed"); });
      Object.keys(plans).forEach(function (name) { setState(plans[name], "failed"); });
    }

    function ready() {
      if (!loading) {
        loading = hold(Promise.resolve().then(load).then(function (maps) {
          if (!maps || typeof maps.Map !== "function") throw new Error("maps-unavailable");
          api = maps;
          return maps;
        }).then(null, function () {
          fail();
          return null;
        }));
      }
      return loading.then(function (maps) { return failed ? null : maps; });
    }

    function view(kind, label) {
      var node = el("div", "cr-map", { "data-map": kind, "data-state": failed ? "failed" : "idle" });
      var canvas = el("div", "cr-map__canvas", { "aria-hidden": "true" });
      node.appendChild(canvas);
      return { node: node, canvas: canvas, label: label, state: failed ? "failed" : "idle", map: null, overlays: [], frame: null };
    }

    function watchSize(target) {
      if (typeof global.ResizeObserver !== "function") return;
      var size = "";
      new global.ResizeObserver(function () {
        var measured = target.canvas.offsetWidth + "x" + target.canvas.offsetHeight;
        if (!target.canvas.offsetWidth || !target.canvas.offsetHeight || measured === size) return;
        size = measured;
        if (typeof target.frame === "function") target.frame();
      }).observe(target.canvas);
    }

    function mapOf(target, maps, extra) {
      if (target.map) return target.map;
      target.canvas.removeAttribute("aria-hidden");
      target.canvas.setAttribute("role", "region");
      if (target.label) target.canvas.setAttribute("aria-label", target.label);
      target.map = new maps.Map(target.canvas, Object.assign({
        center: { lat: 0, lng: 0 },
        zoom: 2,
        disableDefaultUI: true,
        zoomControl: true,
        clickableIcons: false,
        gestureHandling: "cooperative",
        colorScheme: darkMode() ? "DARK" : "LIGHT",
      }, extra || {}));
      watchSize(target);
      return target.map;
    }

    function geocode(maps, text) {
      return new Promise(function (resolve) {
        var settled = false;
        function answer(results, status) {
          if (settled) return;
          settled = true;
          var best = status === "OK" && results && results.length ? latLng(results[0].geometry && results[0].geometry.location) : null;
          if (best) resolve(best);
          else resolve(status === "ZERO_RESULTS" ? null : undefined);
        }
        if (typeof maps.Geocoder !== "function") {
          answer(null, "UNAVAILABLE");
          return;
        }
        try {
          var asked = new maps.Geocoder().geocode({ address: text }, answer);
          if (asked && typeof asked.then === "function") asked.then(null, function () { answer(null, "ERROR"); });
        } catch (_) {
          answer(null, "ERROR");
        }
      });
    }

    function addressView(code) {
      var target = addresses[code];
      if (!target) {
        target = addresses[code] = view("address", copy.addressMapLabel || "");
        target.note = el("p", "cr-map__note");
        target.node.appendChild(target.note);
        target.places = {};
        target.asking = {};
        target.shown = "";
        target.wanted = "";
        target.marker = null;
        target.session = undefined;
      }
      return target;
    }

    function clearMarker(target) {
      if (target.marker) target.marker.setMap(null);
      target.marker = null;
    }

    function paintAddress(target, text, point) {
      if (!api) {
        hold(ready().then(function (maps) { if (maps && target.wanted === text) paintAddress(target, text, point); }));
        return;
      }
      setState(target, "ready");
      target.note.textContent = "";
      var map = mapOf(target, api, {});
      clearMarker(target);
      target.marker = new api.Marker({ map: map, position: point, title: text, clickable: false });
      target.shown = text;
      target.frame = function () {
        map.setCenter(point);
        map.setZoom(ADDRESS_ZOOM);
      };
      target.frame();
    }

    function showAddress(target, text) {
      target.wanted = text;
      if (failed) {
        setState(target, "failed");
        return;
      }
      if (!text) {
        clearMarker(target);
        target.shown = "";
        target.note.textContent = "";
        setState(target, "idle");
        return;
      }
      var known = Object.prototype.hasOwnProperty.call(target.places, text) ? target.places[text] : undefined;
      if (known === null) {
        clearMarker(target);
        target.shown = text;
        target.note.textContent = copy.addressMapMissing || "";
        setState(target, "missing");
        return;
      }
      if (known) {
        if (target.shown === text && target.marker) setState(target, "ready");
        else paintAddress(target, text, known);
        return;
      }
      setState(target, target.map && target.shown ? "stale" : "locating");
      if (target.asking[text]) return;
      target.asking[text] = true;
      hold(ready().then(function (maps) {
        if (!maps) return null;
        return geocode(maps, text).then(function (point) {
          if (point !== undefined) target.places[text] = point;
          delete target.asking[text];
          if (target.wanted !== text || failed) return;
          if (point === undefined) {
            setState(target, target.map && target.shown ? "stale" : "idle");
            return;
          }
          showAddress(target, text);
        });
      }));
    }

    function suggest(target, input, maps, choose) {
      var places = maps.places || {};
      var finder = places.AutocompleteSuggestion;
      var anchor = input.parentNode;
      if (!finder || typeof finder.fetchAutocompleteSuggestions !== "function" || !anchor) return;
      var listId = input.getAttribute("id") + "-suggestions";
      var list = el("ul", "cr-suggest", { id: listId, role: "listbox", "aria-label": copy.addressSuggestions || "", hidden: true });
      var offered = [];
      var recent = { query: "", items: [] };
      var active = -1;
      var timer = null;
      anchor.appendChild(list);
      input.setAttribute("role", "combobox");
      input.setAttribute("aria-autocomplete", "list");
      input.setAttribute("aria-controls", listId);
      input.setAttribute("aria-expanded", "false");
      input.setAttribute("autocomplete", "off");
      if (target.session === undefined && typeof places.AutocompleteSessionToken === "function") target.session = new places.AutocompleteSessionToken();

      function highlight(index) {
        active = index;
        offered.forEach(function (option, position) { option.node.setAttribute("aria-selected", position === index ? "true" : "false"); });
        if (index === -1) input.removeAttribute("aria-activedescendant");
        else input.setAttribute("aria-activedescendant", offered[index].node.getAttribute("id"));
      }

      function close() {
        list.replaceChildren();
        list.setAttribute("hidden", "");
        offered = [];
        highlight(-1);
        input.setAttribute("aria-expanded", "false");
      }

      function take(option) {
        close();
        option.accept();
      }

      function offer(items) {
        close();
        offered = items.slice(0, SUGGESTION_LIMIT).map(function (item, index) {
          var node = el("li", "cr-suggest__option", { id: listId + "-" + index, role: "option", "aria-selected": "false" });
          node.textContent = item.label;
          var option = { node: node, accept: item.accept };
          node.addEventListener("mousedown", function (event) { event.preventDefault(); });
          node.addEventListener("click", function () { take(option); });
          list.appendChild(node);
          return option;
        });
        if (!offered.length) return;
        list.removeAttribute("hidden");
        input.setAttribute("aria-expanded", "true");
      }

      function accepted(prediction, label) {
        return function () {
          target.session = typeof places.AutocompleteSessionToken === "function" ? new places.AutocompleteSessionToken() : undefined;
          var place = prediction && typeof prediction.toPlace === "function" ? prediction.toPlace() : null;
          if (!place || typeof place.fetchFields !== "function") {
            choose(label, null);
            return;
          }
          hold(Promise.resolve(place.fetchFields({ fields: ["formattedAddress", "location"] })).then(function () {
            choose(String(place.formattedAddress || label), latLng(place.location));
          }, function () {
            choose(label, null);
          }));
        };
      }

      function ask(value) {
        hold(Promise.resolve(finder.fetchAutocompleteSuggestions({
          input: value,
          sessionToken: target.session,
          includedPrimaryTypes: SUGGESTION_TYPES,
        })).then(function (response) {
          if (input.value.trim() !== value) return;
          recent = {
            query: value,
            items: ((response && response.suggestions) || []).map(function (suggestion) {
              var prediction = suggestion && suggestion.placePrediction;
              var label = prediction && prediction.text ? String(prediction.text) : "";
              return { label: label, accept: accepted(prediction, label) };
            }).filter(function (item) { return item.label; }),
          };
          if (global.document.activeElement === input) offer(recent.items);
        }, close));
      }

      input.addEventListener("keydown", function (event) {
        if (list.getAttribute("hidden") !== null) {
          if (event.key !== "ArrowDown" || !recent.items.length || recent.query !== input.value.trim()) return;
          event.preventDefault();
          offer(recent.items);
          highlight(0);
          return;
        }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          var count = offered.length;
          highlight(event.key === "ArrowDown" ? (active + 1) % count : (active <= 0 ? count : active) - 1);
          return;
        }
        if (event.key === "Enter") {
          event.preventDefault();
          if (active !== -1) take(offered[active]);
          else close();
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          close();
        }
      });
      input.addEventListener("input", function () {
        if (timer !== null) global.clearTimeout(timer);
        var value = input.value.trim();
        if (value.length < SUGGESTION_MINIMUM) {
          timer = null;
          close();
          return;
        }
        timer = global.setTimeout(function () {
          timer = null;
          ask(value);
        }, delay);
      });
      input.addEventListener("blur", close);
    }

    function attachAddress(code, input, pick) {
      var target = addressView(code);
      showAddress(target, String(input.value || "").trim());
      input.addEventListener("input", function () {
        var text = String(input.value || "").trim();
        if (text === target.shown || target.state === "failed") return;
        if (target.state === "ready") setState(target, "stale");
        else if (target.state === "missing" || target.state === "locating") setState(target, "idle");
      });
      input.addEventListener("blur", function () { showAddress(target, String(input.value || "").trim()); });
      hold(ready().then(function (maps) {
        if (!maps) return;
        suggest(target, input, maps, function (formatted, point) {
          if (point) target.places[formatted] = point;
          pick(formatted);
          showAddress(target, formatted);
        });
      }));
      return target.node;
    }

    function overlaysOf(maps, map, shape, color, title) {
      var paint = color ? { strokeColor: color, fillColor: color } : {};
      if (shape.kind === "area") {
        return shape.polygons.map(function (rings) {
          return new maps.Polygon(Object.assign({ map: map, paths: rings, strokeOpacity: 1, strokeWeight: 2, fillOpacity: 0.35, clickable: false }, paint));
        });
      }
      if (shape.kind === "circle") {
        return [new maps.Circle(Object.assign({ map: map, center: shape.center, radius: shape.radius, strokeOpacity: 1, strokeWeight: 2, fillOpacity: 0.35, clickable: false }, paint))];
      }
      if (shape.kind === "line") {
        return [new maps.Polyline(Object.assign({ map: map, path: shape.path, strokeOpacity: 1, strokeWeight: 4, clickable: false }, color ? { strokeColor: color } : {}))];
      }
      var marker = { map: map, position: shape.position, title: title, clickable: false };
      if (maps.SymbolPath && color) {
        marker.icon = { path: maps.SymbolPath.CIRCLE, scale: 6, fillColor: color, fillOpacity: 1, strokeColor: tokenColor("--surface") || color, strokeWeight: 2 };
      }
      return [new maps.Marker(marker)];
    }

    function drawPlan(target, maps, plan) {
      setState(target, "ready");
      var map = mapOf(target, maps, { mapTypeId: "hybrid", tilt: 0 });
      target.overlays.forEach(function (overlay) { overlay.setMap(null); });
      target.overlays = [];
      plan.elements.forEach(function (element) {
        var color = toneColor(element.tone);
        element.shapes.forEach(function (shape) {
          target.overlays = target.overlays.concat(overlaysOf(maps, map, shape, color, element.name));
        });
      });
      target.frame = function () { map.fitBounds(plan.bounds, PLAN_PADDING); };
      target.frame();
    }

    function planView(name, plan) {
      var target = plans[name];
      if (!target) {
        target = plans[name] = view("plan", copy.planMapLabel || "");
        target.plan = null;
        if (!failed) setState(target, "loading");
      }
      if (target.plan !== plan) {
        target.plan = plan;
        hold(ready().then(function (maps) {
          if (maps && target.plan === plan) drawPlan(target, maps, plan);
        }));
      }
      return target.node;
    }

    return {
      attachAddress: attachAddress,
      planView: planView,
      idle: idle,
      failed: function () { return failed; },
    };
  }

  ns.maps = Object.freeze({
    keyOf: keyOf,
    scriptLoader: scriptLoader,
    service: service,
  });
})(typeof window !== "undefined" ? window : globalThis);
(function (global) {
  "use strict";

  var ns = global.ClientReview || (global.ClientReview = {});

  var OPTION_BADGE = {
    new: ["status-badge--info", "optionNew"],
    approved: ["status-badge--ok", "optionApproved"],
    declined: ["status-badge--danger", "optionDeclined"],
    cancelled: ["status-badge--scheduled", "optionCancelled"],
    changes: ["status-badge--warn", "optionChanges"],
    revising: ["status-badge--warn", "optionRevising"],
    unknown: ["status-badge--scheduled", "optionUnknown"],
  };

  var PROPERTY_BADGE = {
    awaiting: ["status-badge--info", "propertyAwaiting"],
    approved: ["status-badge--ok", "propertyApproved"],
    declined: ["status-badge--danger", "propertyDeclined"],
    cancelled: ["status-badge--scheduled", "propertyCancelled"],
    changes: ["status-badge--warn", "propertyChanges"],
    unknown: ["status-badge--scheduled", "propertyUnknown"],
  };

  var AUTOCOMPLETE = {
    LEGAL_NAME: "organization",
    BILLING_ADDRESS: "street-address",
    LEGAL_ADDRESS: "street-address",
    REPRESENTATIVE_FIRST_NAME: "given-name",
    REPRESENTATIVE_LAST_NAME: "family-name",
    REPRESENTATIVE_JOB_TITLE: "organization-title",
    REPRESENTATIVE_EMAIL: "email",
    REPRESENTATIVE_PHONE: "tel",
  };

  var STATEMENT_COPY = {
    INFORMATION_CONFIRMED: "confirmInformationStatement",
    AUTHORITY_CONFIRMED: "confirmAuthorityStatement",
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
    return ns.optionLabel(option, copy);
  }

  function confirmationStatement(copy, field) {
    var key = STATEMENT_COPY[field.code];
    if (!key) return field.description || field.label;
    var configured = copy[key];
    if (configured !== ns.defaultCopy()[key]) return configured;
    return field.description || configured;
  }

  function isPending(command) {
    return Boolean(command && command.status === "pending");
  }

  function sentences(parts) {
    return parts.filter(Boolean).map(function (part) { return /[.!?…:]$/.test(part) ? part : part + "."; }).join(" ");
  }

  function announce(ctx, parts) {
    ctx.announcement = sentences(parts);
  }

  function stateCard(tone, glyph, title, body, action, quiet) {
    var card = el("section", "cr-panel cr-state cr-state--" + tone, { "data-state": tone, role: quiet ? null : tone === "error" ? "alert" : "status" });
    card.appendChild(text("div", "cr-state__glyph", glyph, { "aria-hidden": "true" }));
    card.appendChild(text("h1", "cr-state__title", title));
    if (body) card.appendChild(text("p", "cr-state__body", body));
    if (action) card.appendChild(action);
    return card;
  }

  function announcedCard(ctx, tone, glyph, title, body, action) {
    announce(ctx, [title, body]);
    return stateCard(tone, glyph, title, body, action);
  }

  function notice(tone, title, body, action, options) {
    var settings = options || {};
    var box = el("div", "cr-notice cr-notice--" + tone, { role: settings.quiet ? null : "status", "data-state": tone });
    var glyph = settings.busy ? "" : tone === "ok" ? "✓" : tone === "warn" ? "!" : "i";
    box.appendChild(text("span", "cr-notice__icon" + (settings.busy ? " cr-notice__icon--busy" : ""), glyph, { "aria-hidden": "true" }));
    var content = el("div", "cr-notice__body");
    if (title) content.appendChild(text("p", "cr-notice__title", title));
    (Array.isArray(body) ? body : [body]).forEach(function (line) {
      if (!line) return;
      content.appendChild(typeof line === "string" ? text("p", "cr-notice__text", line) : line);
    });
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

  function linkRow(ctx) {
    var copy = ctx.copy;
    var view = ctx.snapshot.view;
    var link = ctx.snapshot.link;
    if (!view.expiresAt && !link.available) return null;
    var box = el("div", "cr-link", { "data-link": link.status || "idle" });
    var row = el("div", "cr-link__row");
    box.appendChild(row);
    if (view.expiresAt) row.appendChild(text("p", "cr-validity", ns.fill(copy.linkValidUntil, { date: view.expiresAt })));
    if (!link.available) return box;
    var copied = link.status === "copied";
    row.appendChild(mark(ctx, button(copied ? copy.linkCopied : copy.linkCopy, "btn--ghost cr-link__copy", function () {
      ctx.dispatch("link.copy");
    }, { "data-action": "link.copy" }), "link-copy"));
    var unsent = view.details.available ? copy.linkCopiedUnsent : "";
    var notes = copied ? [copy.linkCopiedNote, unsent].filter(Boolean) : link.status === "failed" ? [copy.linkCopyFailed] : [];
    notes.forEach(function (line) { box.appendChild(text("p", "cr-link__note", line)); });
    ctx.linkStatus = sentences(copied ? [copy.linkCopied].concat(notes) : notes);
    return box;
  }

  function pageHead(ctx, eyebrow, title, subtitle, badgeNode) {
    var view = ctx.snapshot.view;
    var copy = ctx.copy;
    var head = el("header", "cr-head");
    var top = el("div", "cr-head__top");
    top.appendChild(text("p", "cr-eyebrow", eyebrow));
    if (badgeNode) top.appendChild(badgeNode);
    head.appendChild(top);
    head.appendChild(mark(ctx, text("h1", "cr-title", title, { tabindex: "-1" }), "page-title"));
    if (subtitle) head.appendChild(text("p", "cr-sub", subtitle));
    announce(ctx, [title, subtitle]);
    var meta = el("dl", "cr-meta");
    [[copy.fromLabel, view.names && view.names.provider], [copy.forLabel, view.names && view.names.client]].forEach(function (entry) {
      if (!entry[1]) return;
      var item = el("div", "cr-meta__item");
      item.appendChild(text("dt", "cr-meta__label", entry[0]));
      item.appendChild(text("dd", "cr-meta__value", entry[1]));
      meta.appendChild(item);
    });
    if (meta.children.length) head.appendChild(meta);
    var link = linkRow(ctx);
    if (link) head.appendChild(link);
    if (ns.pdf && view.agreement && ns.pdf.offered(ctx.snapshot)) {
      var pdf = ctx.snapshot.pdf || {};
      var pending = pdf.status === "pending";
      var allowed = ns.pdf.available(ctx.snapshot);
      var actions = el("div", "cr-pdf");
      actions.appendChild(mark(ctx, button(pending ? copy.pdfCreating : copy.pdfDownload, "btn--ghost", function () {
        ctx.dispatch("pdf.download");
      }, { "data-action": "pdf.download", disabled: pending || !allowed || ctx.busy, "aria-busy": pending ? "true" : null }), "pdf-download"));
      var note = !allowed ? copy.pdfIncomplete : pdf.status === "failed" ? copy.pdfFailed : pdf.status === "downloaded" ? copy.pdfDownloaded : "";
      if (note) actions.appendChild(text("p", "cr-pdf__note", note));
      ctx.pdfStatus = note;
      head.appendChild(actions);
    }
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
    if (view.accountUnavailable && view.details.available) found.push(notice("warn", "", copy.accountPartial, null));
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
    if (!option.lines.length) return text("p", "cr-note cr-lines-empty", copy.linesEmpty);
    var priced = option.pricing.linePrices;
    var wrap = el("div", "cr-lines-wrap");
    var table = el("table", "cr-lines" + (priced ? "" : " cr-lines--unpriced"), { role: "table", "data-priced": priced ? "true" : "false" });
    var head = el("thead", "", { role: "rowgroup" });
    var headRow = el("tr", "", { role: "row" });
    headRow.appendChild(text("th", "", copy.lineService, { scope: "col", role: "columnheader" }));
    headRow.appendChild(text("th", "cr-num", copy.lineQuantity, { scope: "col", role: "columnheader" }));
    if (priced) headRow.appendChild(text("th", "cr-num", copy.lineUnitPrice, { scope: "col", role: "columnheader" }));
    head.appendChild(headRow);
    table.appendChild(head);
    var body = el("tbody", "", { role: "rowgroup" });
    option.lines.forEach(function (line) {
      var row = el("tr", "", { role: "row", "data-line": line.key, "data-recurrent": line.recurrent ? "true" : null });
      row.appendChild(text("td", "cr-lines__service" + (line.product ? "" : " cr-muted"), line.product || copy.serviceUnnamed, { role: "cell", "data-label": copy.lineService }));
      row.appendChild(text("td", "cr-num" + (line.quantity ? "" : " cr-muted"), line.quantity || copy.valueNotStated, { role: "cell", "data-label": copy.lineQuantity }));
      if (priced) {
        var price = line.recurrent ? copy.lineIncluded : line.unitPrice || copy.valueNotStated;
        row.appendChild(text("td", "cr-num" + (!line.recurrent && line.unitPrice ? "" : " cr-muted"), price, { role: "cell", "data-label": copy.lineUnitPrice }));
      }
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
    if (!option.pricing.total) {
      body.appendChild(text("p", "cr-note cr-per-service", copy.perServiceNote, { "data-pricing": "per-service" }));
      body.appendChild(text("p", "cr-note cr-taxes-note", copy.taxesNote, { "data-pricing": "taxes" }));
      return;
    }
    var total = el("div", "cr-total");
    total.appendChild(text("span", "cr-total__label", copy.orderTotal));
    total.appendChild(text("span", "cr-total__value" + (option.total ? "" : " cr-muted"), option.total || copy.valueNotStated));
    body.appendChild(total);
    body.appendChild(text("p", "cr-note cr-taxes-note", copy.taxesNote, { "data-pricing": "taxes" }));
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

  function chosenOption(ctx, property, option) {
    var choice = ctx.snapshot.choices[property.key];
    return Boolean(choice && choice.kind === "approve" && choice.id === option.id);
  }

  function actionRow(ctx, property, option) {
    var copy = ctx.copy;
    var disabled = ctx.busy || isPending(ctx.snapshot.commands[option.recordKey]);
    var chosen = chosenOption(ctx, property, option);
    var row = el("div", "cr-actions");
    row.appendChild(button(copy.approveLabel, "btn--primary btn--lg", function () { ctx.dispatch("option.choose", { id: option.id }); }, { disabled: disabled, "data-action": "option.approve" }));
    return chosen ? null : row;
  }

  function chosenNote(ctx, property, kind) {
    var copy = ctx.copy;
    var box = el("div", "cr-chosen", { "data-chosen": kind, role: "group", "aria-label": kind === "approve" ? copy.choiceApprovedNote : copy.choiceDeclinedNote });
    box.appendChild(text("span", "cr-chosen__icon", kind === "approve" ? "✓" : "✕", { "aria-hidden": "true" }));
    box.appendChild(text("p", "cr-chosen__text", kind === "approve" ? copy.choiceApprovedNote : copy.choiceDeclinedNote));
    box.appendChild(mark(ctx, button(copy.choiceUndo, "btn--ghost", function () {
      ctx.dispatch("choice.clear", { key: property.key });
    }, { disabled: ctx.busy, "data-action": "choice.clear" }), "choice-" + property.key));
    return box;
  }

  function changesPanel(ctx, property, pending) {
    var copy = ctx.copy;
    var key = property.key;
    var draftKey = "property:" + key;
    var titleId = "cr-changes-title-" + key;
    var invalid = Boolean(ctx.snapshot.draftInvalid[draftKey]);
    var panel = el("div", "cr-confirm cr-confirm--changes", { role: "group", "aria-labelledby": titleId, "data-state": pending ? "pending" : "open", "data-changes": key });
    var field = el("div", "cr-field", { "data-state": invalid ? "invalid" : "idle" });
    field.appendChild(text("label", "cr-field__label", copy.changesTitle, { for: "cr-changes-" + key, id: titleId }));
    field.appendChild(text("p", "cr-field__hint", copy.changesAllBody, { id: "cr-changes-hint-" + key }));
    var area = el("textarea", "cr-input cr-input--area", {
      id: "cr-changes-" + key,
      name: "MESSAGE",
      rows: 4,
      placeholder: copy.changesPlaceholder,
      "aria-required": "true",
      "aria-invalid": invalid ? "true" : null,
      "aria-describedby": "cr-changes-hint-" + key + " cr-changes-error-" + key,
      disabled: pending,
    });
    area.value = ctx.snapshot.drafts[draftKey] || "";
    area.addEventListener("input", function () { ctx.dispatch("property.changes.draft", { key: key, value: area.value }); });
    mark(ctx, area, "changes-draft-" + key);
    field.appendChild(area);
    field.appendChild(text("p", "cr-field__error", invalid ? copy.changesRequired : "", { id: "cr-changes-error-" + key }));
    panel.appendChild(field);
    var actions = el("div", "cr-actions");
    actions.appendChild(button(pending ? copy.sendingLabel : copy.changesSend, "btn--primary btn--lg", function () {
      ctx.dispatch("property.changes.send", { key: key });
    }, { disabled: pending || ctx.busy, "data-state": pending ? "pending" : null, "data-action": "property.changes.send", "aria-busy": pending ? "true" : null }));
    actions.appendChild(button(copy.cancelLabel, "btn--ghost btn--lg", function () {
      ctx.dispatch("property.changes.cancel");
    }, { disabled: pending, "data-action": "property.changes.cancel" }));
    panel.appendChild(actions);
    return panel;
  }

  function unconfirmedNotice(ctx, recordKey) {
    var box = notice("info", "", ctx.copy.commandUnconfirmed, refreshButton(ctx, recordKey, ctx.copy.refreshLabel), { quiet: true });
    box.setAttribute("data-command", "unconfirmed");
    return box;
  }

  function announceUnconfirmed(ctx) {
    var commands = ctx.snapshot.commands;
    if (Object.keys(commands).some(function (key) { return commands[key].status === "unconfirmed"; })) announce(ctx, [ctx.copy.commandUnconfirmed]);
  }

  function optionFooter(body, ctx, property, option) {
    var copy = ctx.copy;
    var command = ctx.snapshot.commands[option.recordKey] || null;
    if (command && command.status === "unconfirmed") {
      body.appendChild(unconfirmedNotice(ctx, option.recordKey));
      return;
    }
    var pending = isPending(command);
    if (option.siblingApproved && option.awaitingClient) {
      body.appendChild(text("p", "cr-note", copy.noteSiblingApproved));
      return;
    }
    var decisions = option.actions.approve || option.actions.changes;
    if (!decisions) {
      if (option.awaitingClient) body.appendChild(text("p", "cr-note", copy.noteNoActions));
      return;
    }
    if (chosenOption(ctx, property, option)) body.appendChild(chosenNote(ctx, property, "approve"));
    var approval = option.actions.approve ? actionRow(ctx, property, option) : null;
    if (approval) body.appendChild(approval);
    if (command && !pending) {
      body.appendChild(outcomeBox(ctx, command, { action: refreshButton(ctx, option.recordKey, copy.refreshLabel) }));
    }
  }

  function optionItem(ctx, property, option) {
    var copy = ctx.copy;
    var expanded = Boolean(ctx.snapshot.expanded[option.id]);
    var bodyId = "cr-option-" + option.id;
    var item = el("li", "cr-option", { "data-state": option.status, "data-expanded": expanded ? "true" : "false" });
    var choice = el("label", "cr-option__toggle cr-pick");
    var radio = el("input", "cr-pick__radio", {
      type: "radio",
      name: "cr-pick-" + property.key,
      value: String(option.id),
      checked: expanded,
      "aria-controls": expanded ? bodyId : null,
      "data-action": "option.toggle",
    });
    radio.checked = expanded;
    radio.addEventListener("click", function () {
      if (!expanded) ctx.dispatch("option.toggle", { id: option.id });
    });
    mark(ctx, radio, "toggle-" + option.id);
    choice.appendChild(radio);
    choice.appendChild(el("span", "cr-pick__mark", { "aria-hidden": "true" }));
    choice.appendChild(text("span", "cr-option__label", optionLabel(option, copy)));
    if (option.priced && !option.pricing.total) choice.appendChild(text("span", "cr-pick__total", copy.perServicePrice, { "data-pricing": "per-service" }));
    else if (option.priced && option.total) choice.appendChild(text("span", "cr-pick__total", option.total));
    choice.appendChild(badge(OPTION_BADGE, option.status, copy));
    item.appendChild(choice);
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

  function declineConfirm(ctx, property, pending) {
    var copy = ctx.copy;
    var titleId = "cr-decline-title-" + property.key;
    var panel = el("div", "cr-confirm cr-confirm--decline", { role: "group", "aria-labelledby": titleId, "data-state": pending ? "pending" : "open", "data-decline": property.key });
    panel.appendChild(text("p", "cr-confirm__title", copy.declineConfirmTitle, { id: titleId }));
    panel.appendChild(text("p", "cr-confirm__body", copy.declineConfirmBody));
    var actions = el("div", "cr-actions");
    actions.appendChild(mark(ctx, button(pending ? copy.sendingLabel : copy.declineConfirmSend, "btn--danger btn--lg", function () {
      ctx.dispatch("property.decline.confirm", { key: property.key });
    }, { disabled: pending || ctx.busy, "data-state": pending ? "pending" : null, "data-action": "property.decline.confirm", "aria-busy": pending ? "true" : null }), "decline-confirm-" + property.key));
    actions.appendChild(button(copy.cancelLabel, "btn--ghost btn--lg", function () {
      ctx.dispatch("property.decline.cancel");
    }, { disabled: pending, "data-action": "property.decline.cancel" }));
    panel.appendChild(actions);
    return panel;
  }

  function propertyFooter(ctx, property) {
    var copy = ctx.copy;
    var snapshot = ctx.snapshot;
    var footerEvents = [ns.contract.orderEvents.decline.code, ns.contract.orderEvents.changes.code];
    var chosen = property.options.some(function (option) { return snapshot.expanded[option.id]; });
    var declinable = property.options.some(function (option) { return option.actions.decline; });
    var choice = snapshot.choices[property.key] || null;
    var failed = property.options.filter(function (option) {
      var command = snapshot.commands[option.recordKey];
      return command && footerEvents.indexOf(command.event) !== -1 && (command.status === "failed" || command.status === "refused") && !snapshot.expanded[option.id];
    })[0];
    var footer = el("div", "cr-property__foot");
    if (!chosen && !choice && property.options.some(function (option) { return option.awaitingClient && !option.siblingApproved; })) {
      footer.appendChild(text("p", "cr-note cr-pick__hint", copy.chooseOption));
    }
    if (failed) {
      footer.appendChild(outcomeBox(ctx, snapshot.commands[failed.recordKey], { action: refreshButton(ctx, failed.recordKey, copy.refreshLabel) }));
    }
    var changeable = property.options.some(function (option) { return option.actions.changes; });
    if (snapshot.changing === property.key) {
      footer.appendChild(changesPanel(ctx, property, snapshot.bulk === "changes"));
    } else if (snapshot.declining === property.key) {
      footer.appendChild(declineConfirm(ctx, property, snapshot.bulk === "choices"));
    } else if (choice && choice.kind === "decline") {
      footer.appendChild(chosenNote(ctx, property, "decline"));
    } else if (declinable || changeable) {
      var pending = property.options.some(function (option) { return isPending(snapshot.commands[option.recordKey]); });
      var row = el("div", "cr-actions cr-property__actions");
      if (changeable) {
        row.appendChild(mark(ctx, button(copy.changesLabel, "btn--ghost", function () {
          ctx.dispatch("property.changes", { key: property.key });
        }, { disabled: ctx.busy || pending, "data-action": "property.changes" }), "changes-" + property.key));
      }
      if (declinable) {
        row.appendChild(mark(ctx, button(copy.declineAllLabel, "btn--danger", function () {
          ctx.dispatch("property.decline", { key: property.key });
        }, { disabled: ctx.busy || pending, "data-action": "property.decline" }), "decline-" + property.key));
      }
      footer.appendChild(row);
    }
    return footer.children.length ? footer : null;
  }

  function propertyCard(ctx, property, interactive) {
    var copy = ctx.copy;
    var headingId = "cr-" + property.key;
    var card = el("section", "cr-property", { "data-state": property.status, "aria-labelledby": headingId });
    var head = el("header", "cr-property__head");
    head.appendChild(el("span", "cr-pin", { "aria-hidden": "true" }));
    var identity = el("div", "cr-property__identity");
    var heading = text("h2", "cr-property__address" + (property.address ? "" : " cr-muted"), property.address || copy.addressUnavailable, { id: headingId, tabindex: interactive ? "-1" : null });
    if (interactive) mark(ctx, heading, "property-" + property.key);
    identity.appendChild(heading);
    identity.appendChild(text("p", "cr-property__meta", property.options.length === 1 ? copy.optionsOne : ns.fill(copy.optionsMany, { n: property.options.length })));
    head.appendChild(identity);
    if (interactive) head.appendChild(badge(PROPERTY_BADGE, property.status, copy));
    card.appendChild(head);
    var site = propertySite(ctx, property);
    if (site) card.appendChild(site);
    var list = el("ol", "cr-options");
    property.options.forEach(function (option) {
      list.appendChild(interactive ? optionItem(ctx, property, option) : optionStatic(ctx, option));
    });
    if (!interactive) {
      card.appendChild(list);
      return card;
    }
    var group = el("fieldset", "cr-pick-group");
    group.appendChild(text("legend", "cr-visually-hidden", ns.fill(copy.choiceLegend, { address: property.address || copy.addressUnavailable })));
    group.appendChild(list);
    card.appendChild(group);
    var footer = propertyFooter(ctx, property);
    if (footer) card.appendChild(footer);
    return card;
  }

  function decidedNotice(ctx) {
    var copy = ctx.copy;
    var waiting = ctx.snapshot.waiting;
    var following = waiting.decisions && !waiting.exhausted;
    var body = following ? copy.decidedFollowingBody : copy.decidedRoundBody;
    announce(ctx, [copy.decidedTitle, body]);
    var box = notice("ok", copy.decidedTitle, body, null, { quiet: waiting.decisions, busy: following });
    box.setAttribute("data-decided", following ? "following" : "recorded");
    return box;
  }

  function partialNotice(ctx) {
    var copy = ctx.copy;
    var counts = ctx.snapshot.view.summary;
    if (ctx.snapshot.view.allDecided || !counts.awaiting || !(counts.approved + counts.declined)) return null;
    var box = notice("ok", copy.partialDecidedTitle, copy.partialDecidedBody, null, { quiet: true });
    box.setAttribute("data-decided", "partial");
    return box;
  }

  function choiceRow(ctx, entry) {
    var copy = ctx.copy;
    var item = el("li", "cr-approved__item cr-choices__item", { "data-choice": entry.kind, "data-property": entry.property.key });
    var row = el("div", "cr-approved__row");
    var identity = el("div", "cr-approved__identity");
    identity.appendChild(text("span", "cr-approved__address" + (entry.property.address ? "" : " cr-muted"), entry.property.address || copy.addressUnavailable));
    identity.appendChild(text("span", "cr-approved__option", entry.kind === "approve" ? ns.fill(copy.choiceApproveRow, { option: optionLabel(entry.option, copy) }) : copy.choiceDeclineRow));
    row.appendChild(identity);
    if (entry.kind === "approve" && entry.option.pricing.total) row.appendChild(text("span", "cr-approved__total" + (entry.option.total ? "" : " cr-muted"), entry.option.total || copy.valueNotStated));
    item.appendChild(row);
    var failed = (entry.kind === "approve" ? [entry.option] : entry.property.options).map(function (option) { return ctx.snapshot.commands[option.recordKey]; }).filter(function (command) {
      return command && (command.status === "failed" || command.status === "refused");
    })[0];
    if (failed) item.appendChild(outcomeBox(ctx, failed, { action: refreshButton(ctx, "", copy.refreshLabel) }));
    return item;
  }

  function choiceEntries(ctx) {
    return ctx.snapshot.view.properties.filter(function (property) { return Boolean(ctx.snapshot.choices[property.key]); }).map(function (property) {
      var choice = ctx.snapshot.choices[property.key];
      var option = choice.kind === "approve" ? property.options.filter(function (candidate) { return candidate.id === choice.id; })[0] : null;
      return { property: property, kind: choice.kind, option: option };
    }).filter(function (entry) { return entry.kind === "decline" || entry.option; });
  }

  function choicesBar(ctx) {
    var copy = ctx.copy;
    var entries = choiceEntries(ctx);
    if (!entries.length || ctx.snapshot.declining) return null;
    var approvals = entries.some(function (entry) { return entry.kind === "approve"; });
    var bar = el("section", "cr-continue", { "aria-label": copy.choicesTitle, "data-choices": String(entries.length) });
    bar.appendChild(text("p", "cr-continue__text", entries.length === 1 ? copy.choicesReadyOne : ns.fill(copy.choicesReadyMany, { n: entries.length })));
    bar.appendChild(mark(ctx, button(approvals ? copy.choicesContinueDetails : copy.choicesContinue, "btn--primary btn--lg", function () {
      ctx.dispatch("choices.open");
    }, { disabled: ctx.busy, "data-action": "choices.open" }), "choices-open"));
    return bar;
  }

  function confirmStep(shell, ctx) {
    var copy = ctx.copy;
    var entries = choiceEntries(ctx);
    var sending = ctx.snapshot.bulk === "choices";
    var title = entries.some(function (entry) { return entry.kind === "approve"; }) ? copy.detailsStepTitle : copy.choicesTitle;
    var back = el("div", "cr-step-back");
    back.appendChild(mark(ctx, button(copy.choicesBack, "btn--ghost", function () {
      ctx.dispatch("choices.back");
    }, { disabled: sending, "data-action": "choices.back" }), "choices-back"));
    shell.appendChild(back);
    var head = el("header", "cr-head");
    head.appendChild(text("p", "cr-eyebrow", copy.quoteEyebrow));
    head.appendChild(mark(ctx, text("h1", "cr-title", title, { id: "cr-choices-title", tabindex: "-1" }), "choices-title"));
    head.appendChild(text("p", "cr-sub", copy.choicesBody));
    var link = linkRow(ctx);
    if (link) head.appendChild(link);
    shell.appendChild(head);
    announce(ctx, [title, copy.choicesBody]);
    var panel = choicesPanel(ctx, entries);
    if (panel) shell.appendChild(panel);
    announceUnconfirmed(ctx);
  }

  function choicesPanel(ctx, entries) {
    var view = ctx.snapshot.view;
    var copy = ctx.copy;
    if (!entries.length) return null;
    var sending = ctx.snapshot.bulk === "choices";
    var approvals = entries.some(function (entry) { return entry.kind === "approve"; });
    var card = el("section", "cr-panel cr-choices", { "aria-labelledby": "cr-choices-title", "data-state": sending ? "pending" : "open" });
    var list = el("ul", "cr-approved__list cr-choices__list");
    entries.forEach(function (entry) { list.appendChild(choiceRow(ctx, entry)); });
    card.appendChild(list);
    if (approvals) card.appendChild(text("p", "cr-note cr-taxes-note", copy.taxesNote, { "data-pricing": "taxes" }));
    var undecided = view.properties.filter(function (property) {
      return property.status === "awaiting" && !ctx.snapshot.choices[property.key];
    }).length;
    if (undecided) card.appendChild(text("p", "cr-note", ns.fill(undecided === 1 ? copy.choicesUndecidedOne : copy.choicesUndecidedMany, { n: undecided }), { "data-undecided": String(undecided) }));
    var form = el("form", "cr-form", { novalidate: true, "data-state": sending ? "pending" : "idle" });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      ctx.dispatch("choices.submit");
    });
    if (approvals) {
      var details = el("div", "cr-form-card", { role: "group", "aria-labelledby": "cr-details-title" });
      details.appendChild(text("h3", "cr-section-title", copy.detailsFormTitle, { id: "cr-details-title" }));
      details.appendChild(text("p", "cr-note", copy.detailsSubtitle));
      var fields = el("div", "cr-fields");
      view.details.fields.forEach(function (field) { fields.appendChild(fieldNode(ctx, field, sending)); });
      details.appendChild(fields);
      var entered = ctx.snapshot.details;
      var invalid = view.details.fields.some(function (field) { return entered.touched[field.code] && entered.errors[field.code]; });
      if (entered.invalid && invalid) details.appendChild(notice("warn", "", copy.detailsInvalid, null));
      form.appendChild(details);
    }
    var actions = el("div", "cr-form-actions");
    actions.appendChild(text("button", "btn btn--primary btn--lg", sending ? copy.sendingLabel : copy.choicesSubmit, {
      type: "submit",
      disabled: sending || ctx.busy,
      "data-state": sending ? "pending" : null,
      "data-action": "choices.submit",
      "aria-busy": sending ? "true" : null,
    }));
    form.appendChild(actions);
    card.appendChild(form);
    return card;
  }

  function quoteReview(shell, ctx) {
    var view = ctx.snapshot.view;
    var copy = ctx.copy;
    if (ctx.snapshot.step === "confirm") {
      confirmStep(shell, ctx);
      return;
    }
    shell.appendChild(pageHead(ctx, copy.quoteEyebrow, copy.quoteTitle, copy.quoteSubtitle, null));
    shell.appendChild(summary(ctx));
    readNotices(ctx).forEach(function (node) { shell.appendChild(node); });
    if (view.allDecided) shell.appendChild(decidedNotice(ctx));
    var partial = partialNotice(ctx);
    if (partial) shell.appendChild(partial);
    if (!view.properties.length && !view.unreadableOrders) {
      shell.appendChild(stateCard("neutral", "○", copy.emptyTitle, copy.emptyBody, null));
      return;
    }
    var list = el("div", "cr-properties");
    view.properties.forEach(function (property) { list.appendChild(propertyCard(ctx, property, true)); });
    shell.appendChild(list);
    var choices = choicesBar(ctx);
    if (choices) shell.appendChild(choices);
    announceUnconfirmed(ctx);
  }

  function fieldNode(ctx, field, pending) {
    var details = ctx.snapshot.details;
    var copy = ctx.copy;
    var id = "cr-field-" + field.code;
    var errorId = id + "-error";
    var describedBy = field.description && field.kind !== "boolean" ? id + "-hint " + errorId : errorId;
    var clientError = details.touched[field.code] ? details.errors[field.code] || "" : "";
    var message = clientError || details.serverErrors[field.code] || "";
    var wrap = el("div", "cr-field", { "data-code": field.code, "data-kind": field.kind, "data-state": message ? "invalid" : "idle" });
    var errorNode = text("p", "cr-field__error", message, { id: errorId, role: message ? "alert" : null });
    var control;

    function common(extra) {
      return Object.assign({
        id: id,
        name: field.code,
        "aria-describedby": describedBy,
        "aria-invalid": message ? "true" : null,
        "aria-required": field.required || field.askedFirst ? "true" : null,
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
      if (field.required || field.askedFirst) label.appendChild(text("span", "cr-req", "*", { "aria-hidden": "true" }));
      wrap.appendChild(label);
    }

    if (field.kind === "boolean") {
      var toggle = el("label", "cr-choice", { for: id });
      control = el("input", "cr-choice__input", common({ type: "checkbox" }));
      control.checked = details.values[field.code] === true;
      control.addEventListener("change", function () { patch(ctx.dispatch("details.choose", { code: field.code, value: control.checked })); });
      toggle.appendChild(control);
      toggle.appendChild(el("span", "cr-check", { "aria-hidden": "true" }));
      var caption = text("span", "cr-choice__label", confirmationStatement(copy, field));
      if (field.required || field.askedFirst) caption.appendChild(text("span", "cr-req", "*", { "aria-hidden": "true" }));
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
      control = el("div", "cr-choices", { role: "radiogroup", id: id, "aria-describedby": errorId, "aria-required": field.required || field.askedFirst ? "true" : null });
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
      if (field.kind === "address") {
        var anchor = el("div", "cr-address");
        anchor.appendChild(control);
        wrap.appendChild(anchor);
      } else {
        wrap.appendChild(control);
      }
    }
    mark(ctx, control, "field-" + field.code);
    if (field.description && field.kind !== "boolean") wrap.appendChild(text("p", "cr-field__hint", field.description, { id: id + "-hint" }));
    wrap.appendChild(errorNode);
    if (field.kind === "address") {
      var reuse = serviceAddressOffer(ctx, field, pending);
      if (reuse) wrap.appendChild(reuse);
      if (ctx.maps) {
        wrap.appendChild(ctx.maps.attachAddress(field.code, control, function (formatted) {
          control.value = formatted;
          patch(ctx.dispatch("details.input", { code: field.code, value: formatted }));
        }));
      }
    }
    return wrap;
  }

  function serviceAddressOffer(ctx, field, pending) {
    var copy = ctx.copy;
    var choices = ctx.snapshot.choices;
    var addresses = [];
    ctx.snapshot.view.properties.forEach(function (property) {
      var choice = choices[property.key];
      if (choice && choice.kind === "approve" && property.address && addresses.indexOf(property.address) === -1) addresses.push(property.address);
    });
    if (!addresses.length) return null;
    var current = String(ctx.snapshot.details.values[field.code] || "").trim();
    var row = el("div", "cr-reuse", { role: "group", "aria-labelledby": "cr-reuse-" + field.code });
    row.appendChild(text("p", "cr-reuse__label", copy.serviceAddressReuse, { id: "cr-reuse-" + field.code }));
    var chips = el("div", "cr-reuse__chips");
    addresses.forEach(function (address) {
      var chosen = current === address;
      chips.appendChild(button(address, "cr-chip", function () {
        ctx.dispatch("details.useAddress", { code: field.code, value: address });
      }, {
        "aria-label": ns.fill(copy.serviceAddressUse, { address: address }),
        "aria-pressed": chosen ? "true" : "false",
        "data-action": "details.useAddress",
        "data-state": chosen ? "chosen" : null,
        disabled: pending || ctx.busy,
      }));
    });
    row.appendChild(chips);
    return row;
  }

  function areaFact(ctx, value) {
    var facts = el("p", "cr-plan__area", { "data-fact": "total-area" });
    facts.appendChild(text("span", "cr-plan__area-label", ctx.copy.propertyArea));
    facts.appendChild(text("span", "cr-plan__area-value", ns.fill(ctx.copy.planAreaValue, { area: value })));
    return facts;
  }

  function propertySite(ctx, property) {
    if (property.plan) return planBlock(ctx, property);
    if (!property.area) return null;
    var block = el("div", "cr-plan cr-plan--facts", { "data-state": "area", "data-plan": property.key });
    block.appendChild(areaFact(ctx, property.area));
    return block;
  }

  function planBlock(ctx, property) {
    var copy = ctx.copy;
    var loaded = ctx.snapshot.plans && ctx.snapshot.plans[property.plan];
    var status = loaded ? loaded.status : "loading";
    var block = el("div", "cr-plan", { "data-state": status, "data-plan": property.key });
    block.appendChild(text("p", "cr-plan__title", copy.planTitle));
    if (status === "unavailable") {
      block.appendChild(text("p", "cr-note cr-plan__note", copy.planUnavailable));
      if (property.area) block.appendChild(areaFact(ctx, property.area));
      return block;
    }
    if (status !== "ready") {
      block.appendChild(el("div", "cr-plan__placeholder skeleton", { "aria-hidden": "true" }));
      block.appendChild(text("p", "cr-note cr-note--pending", copy.planLoading, { role: "status", "data-state": "pending" }));
      return block;
    }
    var plan = loaded.plan;
    var nameOf = function (element) { return element.name || ns.fill(copy.planElementFallback, { n: element.position }); };
    if (ctx.maps) block.appendChild(ctx.maps.planView(property.key, plan));
    block.appendChild(ns.plan.figure(global.document, plan, { classPrefix: "cr-plan", label: copy.planMapLabel, nameOf: nameOf }));
    if (property.area) block.appendChild(areaFact(ctx, property.area));
    var sized = ns.plan.sumsTo(plan, property.areaSquareFeet);
    var legend = el("ul", "cr-plan__legend", { "aria-label": copy.planTitle });
    plan.elements.forEach(function (element) {
      var item = el("li", "cr-plan__element", { "data-kind": element.kind });
      item.appendChild(el("span", "cr-plan__swatch", { "data-tone": String(element.tone), "data-kind": element.kind, "aria-hidden": "true" }));
      item.appendChild(text("span", "cr-plan__name", nameOf(element)));
      if (sized && element.areaText) item.appendChild(text("span", "cr-plan__size", ns.fill(copy.planAreaValue, { area: element.areaText })));
      legend.appendChild(item);
    });
    block.appendChild(legend);
    block.appendChild(text("p", "cr-plan__note", copy.planNote));
    return block;
  }

  function portalLink(ctx) {
    return text("a", "btn btn--ghost", ctx.copy.portalOpen, { href: ctx.snapshot.portalUrl, rel: "noreferrer", "data-action": "portal.open" });
  }

  function portalBody(ctx, className) {
    var email = ctx.snapshot.primaryEmail;
    if (!email) return text("p", className, ctx.copy.portalBody);
    var line = el("p", className);
    ctx.copy.portalEmailBody.split("{email}").forEach(function (part, index) {
      if (index > 0) line.appendChild(text("strong", "cr-portal__email", email));
      if (part) line.appendChild(text("span", "", part));
    });
    return line;
  }

  function portalInvitation(ctx) {
    var box = notice("info", ctx.copy.portalTitle, [portalBody(ctx, "cr-notice__text")], ctx.snapshot.portalUrl ? portalLink(ctx) : null);
    box.setAttribute("data-portal", "invitation");
    return box;
  }

  function portalReturn(ctx) {
    var box = notice("info", ctx.copy.portalTitle, [], portalLink(ctx), { quiet: true });
    box.setAttribute("data-portal", "return");
    return box;
  }

  function portalAside(ctx, title, line) {
    var aside = el("div", "cr-state__aside", { "data-portal": title ? "invitation" : "sign-in" });
    if (title) aside.appendChild(text("h2", "cr-state__aside-title", title));
    aside.appendChild(line);
    if (ctx.snapshot.portalUrl) aside.appendChild(portalLink(ctx));
    return aside;
  }

  function joinName(name, title) {
    if (!name) return "";
    return title ? name + ", " + title : name;
  }

  function providerLogo(ctx) {
    if (!ctx.snapshot.logoUrl) return null;
    var provider = ctx.snapshot.view.parties.provider.legalName;
    var image = el("img", "cr-party__logo", {
      src: ctx.snapshot.logoUrl,
      alt: provider ? ns.fill(ctx.copy.providerLogoAlt, { provider: provider }) : "",
      decoding: "async",
      referrerpolicy: "no-referrer",
    });
    image.addEventListener("error", function () { image.setAttribute("hidden", ""); });
    return image;
  }

  function statedFact(row) {
    return !!row[1];
  }

  function factsCard(ctx, title, rows, className, lead) {
    var copy = ctx.copy;
    var card = el("article", "cr-panel " + className);
    card.appendChild(text("h2", "cr-section-title", title));
    if (lead) card.appendChild(lead);
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
    if (command && command.status === "unconfirmed") {
      card.appendChild(unconfirmedNotice(ctx, recordKey));
      return card;
    }
    if (!view.canApproveAgreement && !view.canRequestAgreementChanges) {
      card.appendChild(text("p", "cr-note", copy.agreementNoAction));
      return card;
    }
    var confirm = ctx.snapshot.confirm;
    var confirming = Boolean(confirm && confirm.kind === "agreement");
    var changing = Boolean(confirm && confirm.kind === "agreement-changes");
    var actions = el("div", "cr-actions");
    if (changing) {
      var invalid = Boolean(ctx.snapshot.draftInvalid.agreement);
      card.setAttribute("role", "group");
      card.setAttribute("aria-labelledby", "cr-agreement-changes-title");
      var field = el("div", "cr-field", { "data-state": invalid ? "invalid" : "idle" });
      field.appendChild(text("label", "cr-field__label", copy.changesTitle, { for: "cr-draft-agreement", id: "cr-agreement-changes-title" }));
      field.appendChild(text("p", "cr-field__hint", copy.agreementChangesHint, { id: "cr-draft-hint-agreement" }));
      var area = el("textarea", "cr-input cr-input--area", {
        id: "cr-draft-agreement",
        name: "MESSAGE",
        rows: 5,
        placeholder: copy.agreementChangesPlaceholder,
        "aria-required": "true",
        "aria-invalid": invalid ? "true" : null,
        "aria-describedby": "cr-draft-hint-agreement cr-draft-error-agreement",
        disabled: pending,
      });
      area.value = ctx.snapshot.drafts.agreement || "";
      area.addEventListener("input", function () { ctx.dispatch("agreement.draft", { value: area.value }); });
      mark(ctx, area, "draft-agreement");
      field.appendChild(area);
      field.appendChild(text("p", "cr-field__error", invalid ? copy.changesRequired : "", { id: "cr-draft-error-agreement" }));
      card.appendChild(field);
      actions.appendChild(button(pending ? copy.sendingLabel : copy.changesSend, "btn--primary btn--lg", function () {
        ctx.dispatch("agreement.changes.send");
      }, { disabled: pending || ctx.busy, "data-state": pending ? "pending" : null, "data-action": "agreement.changes.send", "aria-busy": pending ? "true" : null }));
      actions.appendChild(button(copy.cancelLabel, "btn--ghost btn--lg", function () { ctx.dispatch("agreement.cancel"); }, { disabled: pending, "data-action": "agreement.cancel" }));
    } else if (confirming) {
      card.setAttribute("role", "group");
      card.setAttribute("aria-labelledby", "cr-agreement-confirm");
      card.appendChild(text("p", "cr-confirm__title", copy.agreementConfirmTitle, { id: "cr-agreement-confirm" }));
      var client = view.parties.client.legalName || view.names.client;
      if (client) card.appendChild(text("p", "cr-confirm__body", ns.fill(copy.agreementConfirmBody, { client: client })));
      if (ctx.snapshot.billing.asked) card.appendChild(billingField(ctx, pending));
      var confirmButton = button(pending ? copy.sendingLabel : copy.agreementConfirmButton, "btn--primary btn--lg", function () {
        ctx.dispatch("agreement.confirm");
      }, { disabled: pending || ctx.busy, "data-state": pending ? "pending" : null, "data-action": "agreement.confirm", "aria-busy": pending ? "true" : null });
      mark(ctx, confirmButton, "confirm-agreement");
      actions.appendChild(confirmButton);
      actions.appendChild(button(copy.cancelLabel, "btn--ghost btn--lg", function () { ctx.dispatch("agreement.cancel"); }, { disabled: pending, "data-action": "agreement.cancel" }));
    } else {
      if (view.canApproveAgreement) {
        actions.appendChild(mark(ctx, button(copy.agreementApprove, "btn--primary btn--lg", function () {
          ctx.dispatch("agreement.intent");
        }, { disabled: ctx.busy || pending, "data-action": "agreement.approve" }), "approve-agreement"));
      }
      if (view.canRequestAgreementChanges) {
        actions.appendChild(mark(ctx, button(copy.changesLabel, "btn--ghost btn--lg", function () {
          ctx.dispatch("agreement.changes");
        }, { disabled: ctx.busy || pending, "data-action": "agreement.changes" }), "agreement-changes"));
      }
    }
    card.appendChild(actions);
    if (command && !pending) card.appendChild(outcomeBox(ctx, command, { action: refreshButton(ctx, recordKey, copy.refreshLabel) }));
    return card;
  }

  function billingField(ctx, pending) {
    var copy = ctx.copy;
    var billing = ctx.snapshot.billing;
    var message = billing.invalid ? copy.billingAddressRequired : "";
    var field = el("div", "cr-field cr-billing", { "data-module": "billing-address", "data-state": message ? "invalid" : "idle", role: "group", "aria-labelledby": "cr-billing-label" });
    field.appendChild(text("p", "cr-field__label", copy.billingAddressLabel, { id: "cr-billing-label" }));
    field.appendChild(text("p", "cr-field__hint", copy.billingAddressHint, { id: "cr-billing-hint" }));
    var toggle = el("label", "cr-choice", { for: "cr-billing-same" });
    var same = el("input", "cr-choice__input", { type: "checkbox", id: "cr-billing-same", name: "BILLING_SAME_AS_LEGAL", disabled: pending });
    same.checked = billing.same;
    same.addEventListener("change", function () { ctx.dispatch("agreement.billing.same", { value: same.checked }); });
    mark(ctx, same, "billing-same");
    toggle.appendChild(same);
    toggle.appendChild(el("span", "cr-check", { "aria-hidden": "true" }));
    toggle.appendChild(text("span", "cr-choice__label", copy.billingSameAsLegal));
    field.appendChild(toggle);
    if (!billing.same) {
      var input = el("input", "cr-input", {
        type: "text",
        id: "cr-billing-address",
        name: "BILLING_ADDRESS",
        autocomplete: "street-address",
        maxlength: String(ns.contract.agreementEvents.approve.billingAddressLimit),
        "aria-labelledby": "cr-billing-label",
        "aria-describedby": "cr-billing-hint cr-billing-error",
        "aria-required": "true",
        "aria-invalid": message ? "true" : null,
        disabled: pending,
      });
      input.value = billing.value;
      input.addEventListener("input", function () { ctx.dispatch("agreement.billing.value", { value: input.value }); });
      mark(ctx, input, "billing-address");
      field.appendChild(input);
    }
    field.appendChild(text("p", "cr-field__error", message, { id: "cr-billing-error", role: message ? "alert" : null }));
    return field;
  }

  function clauseItem(block) {
    var item = el("li", "cr-terms__clause", { "data-depth": String(Math.min(block.depth, 3)) });
    item.appendChild(text("span", "cr-terms__number", block.number));
    item.appendChild(text("span", "cr-terms__clause-text", block.text));
    return item;
  }

  function agreementPage(shell, ctx) {
    var view = ctx.snapshot.view;
    var copy = ctx.copy;
    var completion = view.kind === "completion";
    var reviewing = view.kind === "agreement-review";
    var changesRequested = view.kind === "reference" && view.banner === "changes";
    var badgeNode = reviewing ? text("span", "status-badge status-badge--info", copy.agreementAwaiting)
      : completion ? text("span", "status-badge status-badge--ok", view.completion === "active" ? copy.agreementActive : copy.agreementApproved)
        : changesRequested ? text("span", "status-badge status-badge--warn", copy.agreementChangesBadge)
          : null;
    var title = completion ? (view.completion === "active" ? copy.completeActiveTitle : copy.completeApprovedTitle)
      : changesRequested ? copy.agreementChangesSentTitle : copy.agreementTitle;
    var subtitle = completion ? (view.completion === "finishing" ? copy.completeFinishingBody : copy.completeBody)
      : reviewing ? copy.agreementSubtitle : changesRequested ? copy.agreementChangesSentBody : "";
    shell.appendChild(pageHead(ctx, copy.agreementEyebrow, title, subtitle, badgeNode));
    if (completion) shell.appendChild(portalInvitation(ctx));
    if (view.kind === "reference" && !changesRequested) shell.appendChild(notice("warn", "", view.banner === "expired" ? copy.agreementExpired : copy.agreementSuspended, null));
    readNotices(ctx).forEach(function (node) { shell.appendChild(node); });

    var parties = view.parties;
    var partiesSection = el("div", "cr-parties");
    partiesSection.appendChild(factsCard(ctx, copy.partyProvider, [
      [copy.partyLegalName, parties.provider.legalName],
      [copy.partyRepresentative, joinName(parties.provider.representativeName, parties.provider.representativeJobTitle)],
    ].filter(statedFact), "cr-party", providerLogo(ctx)));
    partiesSection.appendChild(factsCard(ctx, copy.partyClient, [
      [copy.partyLegalName, parties.client.legalName],
      [copy.partyClientType, parties.client.clientType],
      [copy.partyBillingAddress, parties.client.billingAddress],
      [copy.partyRepresentative, joinName(parties.client.representativeName, parties.client.representativeJobTitle)],
      [copy.partyEmail, parties.client.email],
      [copy.partyPhone, parties.client.phone],
    ].filter(statedFact), "cr-party"));
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
    var clauses = null;
    term.terms.forEach(function (block) {
      if (block.kind === "item") {
        clauses = null;
        if (!list) {
          list = el("ul", "cr-terms__list");
          terms.appendChild(list);
        }
        list.appendChild(text("li", "", block.text));
        return;
      }
      list = null;
      if (block.kind === "clause") {
        if (!clauses) {
          clauses = el("ol", "cr-terms__clauses", { role: "list" });
          terms.appendChild(clauses);
        }
        clauses.appendChild(clauseItem(block));
        return;
      }
      clauses = null;
      terms.appendChild(text(block.kind === "heading" ? "h3" : "p", block.kind === "heading" ? "cr-terms__heading" : "cr-terms__paragraph", block.text));
    });
    shell.appendChild(terms);

    if (reviewing) shell.appendChild(approveSection(ctx));
    if (completion && ctx.snapshot.portalUrl) shell.appendChild(portalReturn(ctx));
    announceUnconfirmed(ctx);
  }

  function ready(shell, ctx) {
    var view = ctx.snapshot.view;
    var copy = ctx.copy;
    switch (view.kind) {
      case "quote-review":
        quoteReview(shell, ctx);
        return;
      case "agreement-review":
      case "reference":
      case "completion":
        agreementPage(shell, ctx);
        return;
      case "preparing":
        shell.appendChild(announcedCard(ctx, "progress", "…", copy.preparingTitle, copy.preparingBody, null));
        return;
      case "closed":
        shell.appendChild(view.reason === "archived"
          ? announcedCard(ctx, "neutral", "⊘", copy.archivedTitle, copy.archivedBody, null)
          : announcedCard(ctx, "neutral", "⊘", copy.canceledTitle, copy.canceledBody, null));
        return;
      case "empty":
        shell.appendChild(announcedCard(ctx, "neutral", "○", copy.emptyTitle, copy.emptyBody, null));
        return;
      default:
        shell.appendChild(announcedCard(ctx, "warn", "!", copy.unavailableTitle, view.reason === "ambiguous-round" ? copy.roundAmbiguousBody : copy.unavailableBody, null));
    }
  }

  function contactLine(label, value, href, kind) {
    var item = el("li", "cr-contact__item", { "data-contact": kind });
    item.appendChild(text("span", "cr-contact__label", label));
    item.appendChild(href ? text("a", "cr-contact__link", value, { href: href }) : text("span", "cr-contact__value", value));
    return item;
  }

  function contactBlock(ctx) {
    var contact = ctx.snapshot.contact;
    if (!contact || (!contact.phone && !contact.email)) return null;
    var copy = ctx.copy;
    var block = el("section", "cr-contact", { "aria-labelledby": "cr-contact-title" });
    var identity = el("div", "cr-contact__identity");
    identity.appendChild(text("h2", "cr-contact__title", copy.contactTitle, { id: "cr-contact-title" }));
    if (contact.name) identity.appendChild(text("p", "cr-contact__name", contact.name));
    block.appendChild(identity);
    var list = el("ul", "cr-contact__list");
    if (contact.phone) list.appendChild(contactLine(copy.contactPhone, contact.phone, contact.phoneHref, "phone"));
    if (contact.email) list.appendChild(contactLine(copy.contactEmail, contact.email, contact.emailHref, "email"));
    block.appendChild(list);
    return block;
  }

  function closedCard(ctx) {
    var copy = ctx.copy;
    var after = ctx.snapshot.closedAfter;
    if (!after) {
      var signIn = ctx.snapshot.portalUrl ? portalAside(ctx, "", text("p", "cr-state__aside-text", copy.linkClosedPortal)) : null;
      return announcedCard(ctx, "neutral", "⊘", copy.linkClosedTitle, copy.linkClosedBody, signIn);
    }
    if (after === "approval") {
      return announcedCard(ctx, "ok", "✓", copy.approvalSentTitle, copy.approvalSentBody, portalAside(ctx, copy.portalTitle, portalBody(ctx, "cr-state__aside-text")));
    }
    if (after === "declined") return announcedCard(ctx, "neutral", "⊘", copy.canceledTitle, copy.declinedClosedBody, null);
    return announcedCard(ctx, "ok", "✓", copy.detailsSentTitle, copy.detailsSentBody, null);
  }

  function renderPage(mount, snapshot, dispatch, copy, services) {
    var ctx = {
      snapshot: snapshot,
      dispatch: dispatch,
      copy: copy,
      maps: services && services.maps ? services.maps : null,
      focus: {},
      announcement: "",
      linkStatus: "",
      pdfStatus: "",
      busy: snapshot.refreshing || snapshot.phase !== "ready" || Boolean(snapshot.bulk),
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
        shell.appendChild(closedCard(ctx));
        break;
      case "error":
        shell.appendChild(announcedCard(ctx, "error", "!", copy.errorTitle, snapshot.errorAfterCommand ? copy.readbackErrorBody : copy.errorBody,
          button(copy.retryLabel, "btn--primary btn--lg", function () { dispatch("retry"); }, { "data-action": "retry" })));
        break;
      default:
        if (snapshot.view) ready(shell, ctx);
    }
    var contact = contactBlock(ctx);
    if (contact) shell.appendChild(contact);
    mount.replaceChildren();
    mount.appendChild(page);
    return { focus: ctx.focus, announcement: ctx.announcement, linkStatus: ctx.linkStatus, pdfStatus: ctx.pdfStatus };
  }

  ns.components = Object.freeze({
    renderPage: renderPage,
    optionLabel: optionLabel,
    confirmationStatement: confirmationStatement,
  });
})(typeof window !== "undefined" ? window : globalThis);
(function (global) {
  "use strict";

  var ns = global.ClientReview || (global.ClientReview = {});

  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var CHECKING_DELAYS = [2000, 3000, 5000, 8000, 12000, 15000, 15000, 15000];
  var LINK_STEPS = { "quote-review": true, "agreement-review": true };
  var STEP_STATE_KEY = "clientReviewStep";

  function systemTimers() {
    return {
      set: function (callback, ms) { return global.setTimeout(callback, ms); },
      clear: function (handle) { global.clearTimeout(handle); },
    };
  }

  function createController(options) {
    var settings = options || {};
    var adapter = settings.adapter || null;
    var copy = ns.withDefaults(settings.copy);
    var locale = settings.locale || "en";
    var mount = settings.mount || null;
    var live = settings.live || null;
    var timers = settings.timers || systemTimers();
    var delays = Array.isArray(settings.pollDelays) && settings.pollDelays.length ? settings.pollDelays.slice() : CHECKING_DELAYS.slice();
    var portalUrl = ns.adapter.safePortalUrl(settings.portalUrl);
    var pageLink = settings.pageLink || "";
    var clipboard = settings.clipboard || null;
    var maps = settings.maps || null;
    var historyRef = settings.history && typeof settings.history.pushState === "function" ? settings.history : null;
    var navigationTarget = settings.navigationTarget && typeof settings.navigationTarget.addEventListener === "function" ? settings.navigationTarget : null;
    var contract = ns.contract;
    var normalizer = ns.normalizer;
    var inflight = {};
    var planReads = {};
    var loading = null;
    var copying = null;
    var exporting = null;
    var submitting = null;
    var listeners = [];
    var stopped = false;
    var poll = { timer: null, attempt: 0, exhausted: false };
    var state = {
      phase: settings.phase || "loading",
      view: null,
      closedAfter: "",
      errorAfterCommand: false,
      retryContext: {},
      primaryEmail: "",
      contact: null,
      logoUrl: "",
      followDecisions: false,
      followClosedAfter: "",
      accepted: {},
      refreshing: false,
      expanded: {},
      bulk: "",
      confirm: null,
      choices: {},
      step: "review",
      lastChoiceKey: "",
      declining: "",
      changing: "",
      drafts: {},
      draftInvalid: {},
      billing: { asked: settings.billingAddressMissing === true, same: true, value: "", invalid: false },
      commands: {},
      details: emptyDetails(null),
      plans: {},
      link: "",
      pdf: "",
      focusKey: "",
    };

    function emptyDetails(seededFor) {
      return { seededFor: seededFor, values: {}, errors: {}, touched: {}, serverErrors: {}, invalid: false };
    }

    function followingNow() {
      return state.phase === "ready" && state.followDecisions && Boolean(state.view) && state.view.kind === "quote-review" && state.view.allDecided;
    }

    function roundRecordedNow() {
      return state.phase === "ready" && Boolean(state.view) && state.view.kind === "quote-review" && state.view.allDecided;
    }

    function pageWaitingNow() {
      return followingNow();
    }

    function waitingNow() {
      return pageWaitingNow() || (state.phase === "ready" && Object.keys(state.accepted).length > 0);
    }

    function eventSource(code) {
      var found = "";
      [contract.orderEvents, contract.agreementEvents].forEach(function (events) {
        Object.keys(events).forEach(function (key) { if (events[key].code === code) found = events[key].source; });
      });
      return found;
    }

    function accept(recordKey, entity, id, event, closedAfter) {
      state.accepted[recordKey] = {
        entity: entity,
        id: id,
        event: event,
        source: eventSource(event),
        closedAfter: closedAfter,
      };
      poll.attempt = 0;
      poll.exhausted = false;
    }

    function currentOf(expectation, view) {
      if (expectation.entity !== "order") return view.agreement ? view.agreement.state : "";
      var option = optionsOf(view).filter(function (candidate) { return candidate.id === expectation.id; })[0];
      return option ? option.state : null;
    }

    function landed(expectation, view) {
      var current = currentOf(expectation, view);
      if (current === null) return false;
      return current !== expectation.source;
    }

    function settleAccepted() {
      Object.keys(state.accepted).forEach(function (recordKey) {
        var expectation = state.accepted[recordKey];
        if (!landed(expectation, state.view)) return;
        delete state.accepted[recordKey];
        delete state.commands[recordKey];
        if (expectation.event === contract.orderEvents.approve.code || expectation.event === contract.orderEvents.decline.code) state.followDecisions = true;
        if (expectation.event === contract.agreementEvents.changes.code) {
          delete state.drafts.agreement;
          state.focusKey = "page-title";
        }
      });
    }

    function markAccepted() {
      Object.keys(state.accepted).forEach(function (recordKey) {
        state.commands[recordKey] = { status: poll.exhausted ? "unconfirmed" : "pending", event: state.accepted[recordKey].event, message: "" };
      });
    }

    function pageKey() {
      return state.phase + ":" + (state.view ? state.view.kind : "");
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

    function findProperty(key) {
      var properties = state.view && Array.isArray(state.view.properties) ? state.view.properties : [];
      return properties.filter(function (property) { return property.key === key; })[0] || null;
    }

    function propertyOfOption(id) {
      var properties = state.view && Array.isArray(state.view.properties) ? state.view.properties : [];
      return properties.filter(function (property) {
        return property.options.some(function (option) { return option.id === id; });
      })[0] || null;
    }

    function declinableOptions(property) {
      return property.options.filter(function (option) {
        return option.actions.decline && !state.accepted[option.recordKey] && !inflight[option.recordKey];
      });
    }

    function choiceEntries() {
      var properties = state.view && state.view.kind === "quote-review" ? state.view.properties : [];
      return properties.filter(function (property) { return Boolean(state.choices[property.key]); }).map(function (property) {
        var choice = state.choices[property.key];
        var option = choice.kind === "approve" ? property.options.filter(function (candidate) { return candidate.id === choice.id; })[0] || null : null;
        return { property: property, kind: choice.kind, option: option };
      });
    }

    function shownStep() {
      return state.step === "confirm" && !state.declining && state.phase === "ready" && choiceEntries().length > 0 && !state.view.allDecided ? "confirm" : "review";
    }

    function historyStep() {
      return historyRef && historyRef.state && historyRef.state[STEP_STATE_KEY] === "confirm" ? "confirm" : "review";
    }

    function openConfirm() {
      if (!choiceEntries().length) return;
      if (state.step !== "confirm") {
        state.step = "confirm";
        if (historyRef && historyStep() !== "confirm") {
          var entry = {};
          entry[STEP_STATE_KEY] = "confirm";
          historyRef.pushState(entry, "");
        }
      }
      state.focusKey = "choices-title";
      render();
    }

    function showReview() {
      state.step = "review";
      state.focusKey = state.choices[state.lastChoiceKey] ? "choice-" + state.lastChoiceKey : "page-title";
      render();
    }

    function closeConfirm() {
      if (shownStep() !== "confirm" || state.bulk) return;
      if (historyRef && navigationTarget && historyStep() === "confirm" && typeof historyRef.back === "function") {
        historyRef.back();
        return;
      }
      showReview();
    }

    function followHistory(event) {
      var wanted = event && event.state && event.state[STEP_STATE_KEY] === "confirm" && choiceEntries().length ? "confirm" : "review";
      if (stopped || wanted === shownStep()) return;
      if (wanted === "confirm") {
        state.step = "confirm";
        state.focusKey = "choices-title";
        render();
      } else {
        showReview();
      }
    }

    function approving() {
      return choiceEntries().some(function (entry) { return entry.kind === "approve"; });
    }

    function chosenAddresses() {
      var found = [];
      choiceEntries().forEach(function (entry) {
        var address = entry.property.address;
        if (entry.kind === "approve" && address && found.indexOf(address) === -1) found.push(address);
      });
      return found;
    }

    function addressDetailField() {
      var fields = state.view && state.view.details ? state.view.details.fields : [];
      return fields.filter(function (field) { return field.kind === "address"; })[0] || null;
    }

    function detailField(code) {
      var fields = state.view && state.view.details ? state.view.details.fields : [];
      return fields.filter(function (field) { return field.code === code; })[0] || null;
    }

    function readProperties() {
      if (typeof adapter.introspectProperties !== "function") return Promise.resolve([]);
      return Promise.resolve().then(function () { return adapter.introspectProperties(); }).then(function (rawGrant) {
        return normalizer.canRead(normalizer.grantOf(rawGrant), "resource") ? adapter.list("resource") : [];
      }).then(function (rows) {
        return Array.isArray(rows) ? rows : [];
      }, function () {
        return [];
      });
    }

    function readAddresses(grant) {
      if (!normalizer.canRead(grant, "address")) return Promise.resolve([]);
      return Promise.resolve().then(function () { return adapter.list("address"); }).then(function (rows) {
        return Array.isArray(rows) ? rows : [];
      }, function () {
        return [];
      });
    }

    function readUnits(grant) {
      var entity = contract.priceVariants.unitEntity;
      if (!normalizer.canRead(grant, entity)) return Promise.resolve([]);
      return Promise.resolve().then(function () { return adapter.list(entity); }).then(function (rows) {
        return Array.isArray(rows) ? rows : [];
      }, function () {
        return [];
      });
    }

    function readContents(grant) {
      var entity = contract.agreementContent.entity;
      if (!normalizer.canRead(grant, entity)) return Promise.resolve([]);
      return Promise.resolve().then(function () { return adapter.list(entity); }).then(function (rows) {
        return Array.isArray(rows) ? rows : [];
      }, function () {
        return [];
      });
    }

    function readAll() {
      return adapter.introspect().then(function (rawGrant) {
        var grant = normalizer.grantOf(rawGrant);
        var ordersReadable = normalizer.canRead(grant, "order");
        var documentsReadable = normalizer.canRead(grant, "document");
        if (!ordersReadable && !documentsReadable) {
          return { grant: grant, documents: [], orders: [], accounts: [], orderItems: [], productPrices: [], products: [], resources: [], addresses: [], units: [], contents: [], accountFailed: false };
        }
        var accountRead = normalizer.canRead(grant, "account")
          ? adapter.list("account").then(function (rows) { return { rows: rows, failed: false }; }, function (error) {
            if (error && error.code === "link-closed") throw error;
            return { rows: [], failed: true };
          })
          : Promise.resolve({ rows: [], failed: false });
        var ordersRead = ordersReadable ? adapter.list("order") : Promise.resolve([]);
        var orderItemsRead = normalizer.canRead(grant, "order-item") ? adapter.list("order-item") : Promise.resolve([]);
        var productPricesRead = normalizer.canRead(grant, "product-price") ? adapter.list("product-price") : Promise.resolve([]);
        var productsRead = normalizer.canRead(grant, "product") ? adapter.list("product") : Promise.resolve([]);
        var documentsRead = documentsReadable ? adapter.list("document") : Promise.resolve([]);
        return Promise.all([documentsRead, accountRead, ordersRead, orderItemsRead, productPricesRead, productsRead, readProperties(), readAddresses(grant), readUnits(grant), readContents(grant)]).then(function (parts) {
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
              orderItems: parts[3],
              productPrices: parts[4],
              products: parts[5],
              resources: parts[6],
              addresses: parts[7],
              units: parts[8],
              contents: parts[9],
              accountFailed: parts[1].failed,
            };
          });
        });
      });
    }

    function seedDetails() {
      var view = state.view;
      if (!view || view.kind !== "quote-review" || !view.details.available || state.details.seededFor === "round") return;
      var details = emptyDetails("round");
      view.details.fields.forEach(function (field) {
        details.values[field.code] = field.kind === "boolean" ? false : view.details.prefill[field.code] || "";
      });
      state.details = details;
    }

    function readPlans() {
      var view = state.view;
      if (!adapter || typeof adapter.readPlan !== "function" || !view || !Array.isArray(view.properties)) return;
      view.properties.forEach(function (property) {
        var id = property.plan;
        if (!id || state.plans[id] || planReads[id]) return;
        state.plans[id] = { status: "loading", plan: null };
        planReads[id] = Promise.resolve().then(function () { return adapter.readPlan(id); }).then(function (raw) {
          var plan = ns.plan ? ns.plan.parse(raw, locale) : null;
          state.plans[id] = plan ? { status: "ready", plan: plan } : { status: "unavailable", plan: null };
        }, function () {
          state.plans[id] = { status: "unavailable", plan: null };
        }).then(function () {
          delete planReads[id];
          render();
        });
      });
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
      if (confirm.kind === "agreement-changes") {
        if (!state.view || !state.view.canRequestAgreementChanges) state.confirm = null;
        return;
      }
      state.confirm = null;
    }

    function pruneChanging() {
      if (!state.changing || state.bulk) return;
      var property = findProperty(state.changing);
      if (!property || !changeableOptions(property).length) state.changing = "";
    }

    function pruneChoices() {
      if (state.bulk) return;
      Object.keys(state.choices).forEach(function (key) {
        var property = findProperty(key);
        var choice = state.choices[key];
        var option = property && choice.kind === "approve" ? property.options.filter(function (candidate) { return candidate.id === choice.id; })[0] : null;
        var standing = choice.kind === "approve" ? Boolean(option && option.actions.approve) : Boolean(property && declinableOptions(property).length);
        if (!standing) delete state.choices[key];
      });
    }

    function stopPolling() {
      if (poll.timer !== null) timers.clear(poll.timer);
      poll.timer = null;
    }

    function schedulePoll() {
      stopPolling();
      poll.timer = timers.set(function () {
        poll.timer = null;
        poll.attempt += 1;
        load(Object.assign({ afterCommand: true, quiet: true }, readContext()));
      }, delays[poll.attempt]);
    }

    function track() {
      if (stopped) return;
      if (!waitingNow()) {
        stopPolling();
        poll.attempt = 0;
        poll.exhausted = false;
        return;
      }
      if (poll.exhausted) return;
      if (poll.attempt >= delays.length) {
        poll.exhausted = true;
        return;
      }
      schedulePoll();
    }

    function announces(before, after) {
      if (before.phase !== "ready") return false;
      if (before.pageWaiting !== pageWaitingNow()) return true;
      if (waitingNow() && poll.exhausted && !before.exhausted) return true;
      if (Boolean(after.event) && !before.recorded && roundRecordedNow()) return true;
      return (Boolean(after.event) || Boolean(after.quiet)) && before.page !== pageKey();
    }

    function speak(rendered) {
      var message = rendered && rendered.announcement ? rendered.announcement : "";
      if (live && message) live.textContent = message;
    }

    function readContext() {
      var closedAfter = followingNow() ? state.followClosedAfter : "";
      Object.keys(state.accepted).forEach(function (recordKey) { closedAfter = closedAfter || state.accepted[recordKey].closedAfter; });
      return closedAfter ? { afterCommand: true, closedAfter: closedAfter } : {};
    }

    function load(context) {
      if (!adapter) {
        render();
        return Promise.resolve();
      }
      if (loading) return loading;
      var after = context || {};
      var before = { phase: state.phase, page: pageKey(), pageWaiting: pageWaitingNow(), exhausted: poll.exhausted, recorded: roundRecordedNow() };
      if (state.phase === "ready" && state.view) state.refreshing = true;
      else state.phase = "loading";
      render();
      loading = readAll().then(function (input) {
        if (normalizer.requestLocale) locale = normalizer.requestLocale(input, locale, contract);
        state.view = normalizer.reviewModel(input, { locale: locale, contract: contract });
        state.phase = "ready";
        state.closedAfter = "";
        state.errorAfterCommand = false;
        state.primaryEmail = state.view.primaryEmail || "";
        state.contact = state.view.contact || null;
        state.logoUrl = state.view.parties && typeof adapter.imageUrl === "function" ? adapter.imageUrl(state.view.parties.provider.logo) : "";
        settleAccepted();
        if (state.view.kind !== "quote-review" || !state.view.allDecided) state.followDecisions = false;
        seedDetails();
        prune();
        pruneChoices();
        pruneChanging();
        readPlans();
      }, function (error) {
        var closed = Boolean(error && error.code === "link-closed");
        if (after.quiet && !closed && waitingNow()) return;
        state.view = null;
        state.confirm = null;
        if (closed) {
          state.phase = "link-closed";
          state.closedAfter = after.closedAfter || "";
        } else {
          state.phase = "error";
          state.errorAfterCommand = Boolean(after.afterCommand);
          state.retryContext = { afterCommand: Boolean(after.afterCommand), closedAfter: after.closedAfter || "" };
        }
      }).then(function () {
        state.refreshing = false;
        loading = null;
        if (before.page !== pageKey()) state.link = "";
        state.pdf = "";
        track();
        markAccepted();
        var rendered = render();
        if (announces(before, after)) speak(rendered);
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
        accept(recordKey, entity, id, event, after.closedAfter || "");
        return reload({ afterCommand: true, closedAfter: after.closedAfter || "", event: event }).then(function () {
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

    function billingAddress() {
      var typed = state.billing.value.replace(/\s+/g, " ").trim();
      return typed.length > contract.agreementEvents.approve.billingAddressLimit ? "" : typed;
    }

    function billingInput() {
      var approve = contract.agreementEvents.approve;
      var input = {};
      if (state.billing.same) {
        input[approve.billingSameAsLegalAttribute] = { value: true };
        return input;
      }
      var typed = billingAddress();
      if (!typed) return null;
      input[approve.billingAddressAttribute] = { value: typed };
      return input;
    }

    function validateDetail(field, value) {
      var filled = field.kind === "boolean" ? value === true : typeof value === "string" && value.trim() !== "";
      if (!filled) return field.required || field.askedFirst ? copy.requiredError : "";
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
      if (opening) {
        var property = propertyOfOption(option.id);
        (property ? property.options : []).forEach(function (sibling) {
          if (sibling.id !== option.id) delete state.expanded[sibling.id];
        });
        state.expanded[option.id] = true;
      } else {
        delete state.expanded[option.id];
      }
      render();
    }

    function changeableOptions(property) {
      return property.options.filter(function (option) {
        return option.actions.changes && !state.accepted[option.recordKey] && !inflight[option.recordKey];
      });
    }

    function changesDraftKey(key) {
      return "property:" + key;
    }

    function openChanges(key) {
      var property = findProperty(key);
      if (!property || !changeableOptions(property).length || busy() || state.bulk) return;
      property.options.forEach(function (option) { clearOutcome(option.recordKey); });
      state.changing = key;
      state.declining = "";
      state.focusKey = "changes-draft-" + key;
      render();
    }

    function cancelChanges() {
      if (!state.changing || state.bulk) return;
      var key = state.changing;
      state.changing = "";
      delete state.draftInvalid[changesDraftKey(key)];
      state.focusKey = "changes-" + key;
      render();
    }

    function sendChanges(key) {
      var property = findProperty(key);
      if (state.changing !== key || !property || busy() || state.bulk) return Promise.resolve(false);
      var ids = changeableOptions(property).map(function (option) { return option.id; });
      if (!ids.length) return Promise.resolve(false);
      var draftKey = changesDraftKey(key);
      var event = contract.orderEvents.changes;
      var message = String(state.drafts[draftKey] || "").trim();
      if (!message) {
        state.draftInvalid[draftKey] = true;
        state.focusKey = "changes-draft-" + key;
        render();
        return Promise.resolve(false);
      }
      delete state.draftInvalid[draftKey];
      var metadata = {};
      metadata[event.messageAttribute] = message;
      state.bulk = "changes";
      render();
      function stepFrom(index) {
        if (index >= ids.length) return Promise.resolve(true);
        var option = findOption(ids[index]);
        if (!option || !option.actions.changes) return stepFrom(index + 1);
        return send(option.recordKey, "order", option.id, event.code, metadata, {}).then(function (ok) {
          return ok ? stepFrom(index + 1) : false;
        });
      }
      submitting = stepFrom(0).then(function (ok) {
        submitting = null;
        state.bulk = "";
        if (ok) {
          delete state.drafts[draftKey];
          state.changing = "";
        }
        if (state.phase === "ready") state.focusKey = ok ? "page-title" : "changes-draft-" + key;
        track();
        render();
        return ok;
      });
      return submitting;
    }

    function chooseOption(id) {
      var option = findOption(id);
      var property = option ? propertyOfOption(option.id) : null;
      if (!option || !property || !option.actions.approve || busy() || state.bulk || inflight[option.recordKey] || state.accepted[option.recordKey]) return;
      clearOutcome(option.recordKey);
      state.choices[property.key] = { kind: "approve", id: option.id };
      state.lastChoiceKey = property.key;
      readPlans();
      openConfirm();
    }

    function declineProperty(key) {
      var property = findProperty(key);
      if (!property || !declinableOptions(property).length || busy() || state.bulk) return;
      if (property.options.some(function (option) { return state.accepted[option.recordKey] || inflight[option.recordKey]; })) return;
      if (approving()) {
        state.choices[key] = { kind: "decline" };
        state.lastChoiceKey = key;
        openConfirm();
        return;
      }
      state.declining = key;
      state.changing = "";
      state.focusKey = "decline-confirm-" + key;
      render();
    }

    function cancelDecline() {
      if (!state.declining || state.bulk) return;
      var key = state.declining;
      state.declining = "";
      state.focusKey = "decline-" + key;
      render();
    }

    function confirmDecline(key) {
      var property = findProperty(key);
      if (state.declining !== key || !property || !declinableOptions(property).length || approving() || busy() || state.bulk) return Promise.resolve(false);
      state.choices[key] = { kind: "decline" };
      return submitChoices().then(function (ok) {
        delete state.choices[key];
        state.declining = "";
        if (state.phase === "ready") state.focusKey = ok ? "page-title" : "decline-" + key;
        render();
        return ok;
      });
    }

    function clearChoice(key) {
      if (!state.choices[key] || state.bulk) return;
      var choice = state.choices[key];
      delete state.choices[key];
      state.focusKey = choice.kind === "approve" ? "toggle-" + choice.id : "decline-" + key;
      render();
    }

    function decideOption(id, kind, metadata, closedAfter) {
      var option = findOption(id);
      var target = kind === "approve" ? "approved" : "declined";
      if (!option) return Promise.resolve(false);
      if (option.status === target) return Promise.resolve(true);
      if (state.accepted[option.recordKey] || inflight[option.recordKey]) return Promise.resolve(false);
      var context = { closedAfter: closedAfter };
      if (!option.actions[kind]) return Promise.resolve(false);
      return send(option.recordKey, "order", option.id, contract.orderEvents[kind].code, metadata, Object.assign({
        onRefusal: function (error) {
          if (kind !== "approve") return;
          var addressField = addressDetailField();
          Object.keys(error.fieldErrors || {}).forEach(function (code) {
            var target = detailField(code) ? code : /ADDRESS$/.test(code) && addressField ? addressField.code : "";
            if (target && !state.details.serverErrors[target]) state.details.serverErrors[target] = error.fieldErrors[code];
          });
          var legalField = detailField("LEGAL_ADDRESS");
          if (legalField && !state.details.serverErrors[legalField.code] && /legal address/i.test(error.serverMessage || "")) state.details.serverErrors[legalField.code] = copy.legalAddressRefused;
        },
      }, context));
    }

    function checkDetails() {
      var fields = state.view.details.fields;
      var firstInvalid = "";
      fields.forEach(function (field) {
        state.details.touched[field.code] = true;
        var message = validateDetail(field, state.details.values[field.code]);
        state.details.errors[field.code] = message;
        if (message && !firstInvalid) firstInvalid = field.code;
      });
      state.details.invalid = Boolean(firstInvalid);
      return firstInvalid;
    }

    function submitChoices() {
      var view = state.view;
      var entries = choiceEntries();
      if (!view || view.kind !== "quote-review" || !entries.length || busy() || state.bulk) return Promise.resolve(false);
      var withApproval = approving();
      var metadata = {};
      if (withApproval) {
        if (!view.details.available) return Promise.resolve(false);
        var firstInvalid = checkDetails();
        if (firstInvalid) {
          state.focusKey = "field-" + firstInvalid;
          render();
          return Promise.resolve(false);
        }
        state.details.serverErrors = {};
        metadata = detailsMetadata(view.details.fields);
      }
      var closedAfter = withApproval || view.summary.approved > 0 ? "details" : "declined";
      var steps = [];
      entries.forEach(function (entry) {
        if (entry.kind === "approve") steps.push({ id: entry.option.id, kind: "approve", metadata: metadata, key: entry.property.key });
        else declinableOptions(entry.property).forEach(function (option) { steps.push({ id: option.id, kind: "decline", metadata: {}, key: entry.property.key }); });
      });
      var landedAny = false;
      state.bulk = "choices";
      state.followClosedAfter = closedAfter;
      render();
      function stepFrom(index) {
        if (index >= steps.length) return Promise.resolve(true);
        var step = steps[index];
        return decideOption(step.id, step.kind, step.metadata, closedAfter).then(function (ok) {
          if (!ok) return false;
          landedAny = true;
          if (!steps.slice(index + 1).some(function (later) { return later.key === step.key; })) delete state.choices[step.key];
          return stepFrom(index + 1);
        });
      }
      submitting = stepFrom(0).then(function (ok) {
        submitting = null;
        state.bulk = "";
        if (state.phase === "link-closed" && landedAny && !state.closedAfter) state.closedAfter = closedAfter;
        if (state.phase === "ready") {
          pruneChoices();
          state.focusKey = ok ? "page-title" : "choices-title";
        }
        track();
        render();
        return ok;
      });
      return submitting;
    }

    function requestAgreementChanges() {
      var view = state.view;
      var confirm = state.confirm;
      if (!view || !view.canRequestAgreementChanges || !confirm || confirm.kind !== "agreement-changes" || busy() || state.accepted[view.agreement.recordKey]) return;
      var event = contract.agreementEvents.changes;
      var message = String(state.drafts.agreement || "").trim();
      if (!message) {
        state.draftInvalid.agreement = true;
        state.focusKey = "draft-agreement";
        render();
        return;
      }
      delete state.draftInvalid.agreement;
      var metadata = {};
      metadata[event.messageAttribute] = message;
      send(view.agreement.recordKey, "document", view.agreement.id, event.code, metadata, {
        onSuccess: function () {
          if (!state.accepted[view.agreement.recordKey]) state.focusKey = "page-title";
        },
      });
    }

    function writeToClipboard(value) {
      try {
        return Promise.resolve(clipboard.writeText(value));
      } catch (error) {
        return Promise.reject(error);
      }
    }

    function linkOffered() {
      return Boolean(pageLink) && Boolean(state.view) && LINK_STEPS[state.view.kind] === true;
    }

    function copyLink() {
      if (copying) return copying;
      if (!linkOffered()) return Promise.resolve(false);
      copying = writeToClipboard(pageLink).then(function () { return true; }, function () { return false; }).then(function (copied) {
        copying = null;
        state.link = copied ? "copied" : "failed";
        state.focusKey = "link-copy";
        var rendered = render();
        if (live && rendered && rendered.linkStatus) live.textContent = rendered.linkStatus;
        return copied;
      });
      return copying;
    }

    function downloadPdf() {
      if (exporting || busy() || !ns.pdf || !ns.pdf.available(snapshot()) || !state.view.agreement) return;
      var current = state.view;
      var input = { phase: state.phase, view: JSON.parse(JSON.stringify(current)), contact: state.contact, logoUrl: state.logoUrl };
      state.pdf = "pending";
      render();
      var create = settings.pdfFactory || ns.pdf.create;
      var save = settings.pdfSave || ns.pdf.save;
      exporting = Promise.resolve().then(function () { return create(input, copy, locale); }).then(function (result) {
        if (stopped || state.phase !== "ready" || state.view !== current || !ns.pdf.available(snapshot())) throw new Error("The displayed document changed");
        save(result);
        state.pdf = "downloaded";
      }, function () { state.pdf = "failed"; }).catch(function () { state.pdf = "failed"; }).then(function () {
        exporting = null;
        if (stopped) return;
        state.focusKey = "pdf-download";
        var rendered = render();
        if (live && rendered && rendered.pdfStatus) live.textContent = rendered.pdfStatus;
      });
      return exporting;
    }

    function dispatch(type, payload) {
      var data = payload || {};
      var option;
      var field;
      var view = state.view;
      switch (type) {
        case "pdf.download":
          downloadPdf();
          return;
        case "retry":
          load(state.retryContext);
          return;
        case "refresh":
          if (data.recordKey) clearOutcome(data.recordKey);
          reload(readContext());
          return;
        case "link.copy":
          copyLink();
          return;
        case "option.toggle":
          toggleOption(data.id);
          return;
        case "option.choose":
          chooseOption(data.id);
          return;
        case "property.changes":
          openChanges(data.key);
          return;
        case "property.changes.draft":
          state.drafts[changesDraftKey(data.key)] = String(data.value == null ? "" : data.value);
          if (state.draftInvalid[changesDraftKey(data.key)] && state.drafts[changesDraftKey(data.key)].trim()) delete state.draftInvalid[changesDraftKey(data.key)];
          return;
        case "property.changes.cancel":
          cancelChanges();
          return;
        case "property.changes.send":
          sendChanges(data.key);
          return;
        case "property.decline":
          declineProperty(data.key);
          return;
        case "property.decline.confirm":
          confirmDecline(data.key);
          return;
        case "property.decline.cancel":
          cancelDecline();
          return;
        case "choice.clear":
          clearChoice(data.key);
          return;
        case "choices.submit":
          submitChoices();
          return;
        case "choices.open":
          if (!busy() && !state.bulk) openConfirm();
          return;
        case "choices.back":
          closeConfirm();
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
        case "details.useAddress":
          field = detailField(data.code);
          if (!field || field.kind !== "address" || !view || !view.details.available || busy()) return;
          if (chosenAddresses().indexOf(data.value) === -1) return;
          state.details.values[field.code] = data.value;
          state.details.touched[field.code] = true;
          state.details.errors[field.code] = validateDetail(field, data.value);
          delete state.details.serverErrors[field.code];
          state.focusKey = "field-" + field.code;
          render();
          return;
        case "agreement.intent":
          if (!view || !view.canApproveAgreement || busy() || inflight[view.agreement.recordKey] || state.accepted[view.agreement.recordKey]) return;
          clearOutcome(view.agreement.recordKey);
          state.confirm = { recordKey: view.agreement.recordKey, id: view.agreement.id, kind: "agreement" };
          state.focusKey = "confirm-agreement";
          render();
          return;
        case "agreement.cancel":
          if (!view || !view.agreement || inflight[view.agreement.recordKey]) return;
          state.focusKey = state.confirm && state.confirm.kind === "agreement-changes" ? "agreement-changes" : "approve-agreement";
          state.confirm = null;
          delete state.draftInvalid.agreement;
          render();
          return;
        case "agreement.changes":
          if (!view || !view.canRequestAgreementChanges || busy() || inflight[view.agreement.recordKey] || state.accepted[view.agreement.recordKey]) return;
          clearOutcome(view.agreement.recordKey);
          state.confirm = { recordKey: view.agreement.recordKey, id: view.agreement.id, kind: "agreement-changes" };
          state.focusKey = "draft-agreement";
          render();
          return;
        case "agreement.draft":
          state.drafts.agreement = String(data.value == null ? "" : data.value);
          if (state.draftInvalid.agreement && state.drafts.agreement.trim()) delete state.draftInvalid.agreement;
          return;
        case "agreement.changes.send":
          requestAgreementChanges();
          return;
        case "agreement.billing.same":
          state.billing.same = data.value === true;
          state.billing.invalid = false;
          state.focusKey = state.billing.same ? "billing-same" : "billing-address";
          render();
          return;
        case "agreement.billing.value":
          state.billing.value = String(data.value == null ? "" : data.value);
          if (state.billing.invalid && billingAddress()) state.billing.invalid = false;
          return;
        case "agreement.confirm":
          if (!view || !view.canApproveAgreement || !state.confirm || state.confirm.kind !== "agreement" || busy() || state.accepted[view.agreement.recordKey]) return;
          var billing = state.billing.asked ? billingInput() : {};
          if (!billing) {
            state.billing.invalid = true;
            state.focusKey = "billing-address";
            render();
            return;
          }
          send(view.agreement.recordKey, "document", view.agreement.id, contract.agreementEvents.approve.code, billing, { closedAfter: "approval" });
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
        bulk: state.bulk,
        confirm: state.confirm,
        choices: state.choices,
        step: shownStep(),
        declining: state.declining,
        changing: state.changing,
        drafts: state.drafts,
        draftInvalid: state.draftInvalid,
        billing: state.billing,
        commands: state.commands,
        details: state.details,
        plans: state.plans,
        maps: Boolean(maps),
        waiting: { exhausted: poll.exhausted, decisions: state.followDecisions },
        portalUrl: portalUrl,
        link: { available: linkOffered(), status: state.link },
        primaryEmail: state.primaryEmail,
        contact: state.contact,
        logoUrl: state.logoUrl,
        pdf: { status: state.pdf },
        pending: Object.keys(inflight),
      };
    }

    function render() {
      if (stopped) return null;
      var rendered = null;
      if (mount && ns.components) {
        rendered = ns.components.renderPage(mount, snapshot(), dispatch, copy, { maps: maps });
        var key = state.focusKey;
        state.focusKey = "";
        var target = key && rendered && rendered.focus ? rendered.focus[key] : null;
        if (target && typeof target.focus === "function") target.focus();
      }
      var current = snapshot();
      listeners.forEach(function (listener) { listener(current); });
      return rendered;
    }

    function stop() {
      stopped = true;
      stopPolling();
      if (navigationTarget && typeof navigationTarget.removeEventListener === "function") navigationTarget.removeEventListener("popstate", followHistory);
    }

    function idle() {
      var waiting = Object.keys(inflight).map(function (key) { return inflight[key]; });
      Object.keys(planReads).forEach(function (id) { waiting.push(planReads[id]); });
      if (maps && typeof maps.idle === "function") {
        var drawing = maps.idle();
        if (drawing) waiting.push(drawing);
      }
      if (loading) waiting.push(loading);
      if (copying) waiting.push(copying);
      if (exporting) waiting.push(exporting);
      if (submitting) waiting.push(submitting);
      if (!waiting.length) return Promise.resolve();
      return Promise.all(waiting).then(idle);
    }

    function start() {
      if (navigationTarget) navigationTarget.addEventListener("popstate", followHistory);
      if (adapter) load({});
      else render();
      return controller;
    }

    var controller = {
      start: start,
      stop: stop,
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
    var locationRef = env.location || global.location || {};
    var navigatorRef = env.navigator || global.navigator || {};
    var options = {
      mount: mount,
      live: env.live || (typeof section.querySelector === "function" && section.querySelector("[data-client-review-live]")) || null,
      timers: env.timers,
      portalUrl: section.getAttribute("data-review-portal-url"),
      pageLink: locationRef.href,
      history: env.history || global.history || null,
      navigationTarget: env.navigationTarget || (typeof global.addEventListener === "function" ? global : null),
      clipboard: navigatorRef.clipboard,
      copy: copyFromAttributes(section),
      locale: env.locale || displayLocale(env),
    };
    var steps = [];
    var mapsCopy = ns.withDefaults(options.copy);
    if (dataMode === "fixture") {
      var setup = ns.fixtures && typeof ns.fixtures.setup === "function" ? ns.fixtures.setup(env.scenario) : null;
      if (!setup) {
        options.phase = "unconfigured";
      } else {
        options.adapter = setup.adapter || null;
        if (setup.loadMaps && ns.maps) options.maps = ns.maps.service({ load: setup.loadMaps, copy: mapsCopy, suggestionDelay: env.suggestionDelay });
        if (setup.phase) options.phase = setup.phase;
        if (setup.portalUrl) options.portalUrl = setup.portalUrl;
        if (setup.pollDelays) options.pollDelays = setup.pollDelays;
        if (setup.billingAddressMissing) options.billingAddressMissing = true;
        if (setup.clipboard) options.clipboard = setup.clipboard;
        steps = setup.steps || [];
      }
    } else {
      var apiBase = ns.adapter.safeApiBase(section.getAttribute("data-review-api-base"));
      var token = ns.adapter.tokenFromFragment(locationRef.hash);
      if (!apiBase) options.phase = "unconfigured";
      else if (!token) options.phase = "link-missing";
      else options.adapter = ns.adapter.createGrantAdapter({ apiBase: apiBase, token: token, propertyToken: ns.adapter.propertyTokenFromFragment(locationRef.hash), fetch: env.fetch });
      options.billingAddressMissing = ns.adapter.billingAddressMissingFromFragment(locationRef.hash);
      var mapsKey = ns.maps ? ns.maps.keyOf(section.getAttribute("data-review-maps-api-key")) : "";
      if (options.adapter && mapsKey) {
        options.maps = ns.maps.service({
          key: mapsKey,
          load: env.loadMaps,
          copy: mapsCopy,
          suggestionDelay: env.suggestionDelay,
        });
      }
    }
    var controller = createController(options);
    controller.dataMode = dataMode;
    controller.steps = steps;
    controller.start();
    return controller;
  }

  ns.createController = createController;
  ns.checkingDelays = Object.freeze(CHECKING_DELAYS.slice());
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

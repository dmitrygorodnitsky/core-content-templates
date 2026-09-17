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
    ["ORDER_SUBTOTAL", "orderSubtotal", "Subtotal"],
    ["ORDER_TAXES", "orderTaxes", "Taxes"],
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

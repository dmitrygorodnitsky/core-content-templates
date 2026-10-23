(function (global) {
  "use strict";

  var ns = global.PlanSubscription || (global.PlanSubscription = {});

  var COPY = {
    purchase: {
      title: "Get started with ServiceWand",
      subtitle: "Pick a plan, add capacity if you need it, and tell us about your company.",
      steps: ["Plan", "Add-ons", "Company"],
      stepIntro: [
        "Choose the plan that fits your operation",
        "Add capacity and features",
        "Tell us about your company",
      ],
      periodLabel: "Billing period",
      monthly: "Monthly",
      yearly: "Yearly",
      perMonth: "/ month",
      perYear: "/ year",
      included: "{count} Active Properties included",
      upTo: "Up to {count} Active Properties",
      featured: "Most popular",
      salesOnlyPrice: "Custom pricing",
      salesOnlyAction: "Talk to sales",
      expansionTitle: "Site expansion packs",
      expansionUnit: "+{count} Active Properties per pack",
      expansionPrice: "{price} per pack {period}",
      packsLabel: "Packs",
      decrease: "Remove one pack",
      increase: "Add one pack",
      capacityLine: "{included} included + {extra} from packs = {total} Active Properties",
      capacityLimit: "Plan limit: {count}",
      capacityReached: "You've reached this plan's limit. Need more? Talk to sales.",
      weatherTitle: "Weather Intelligence",
      weatherPrice: "{price} per Property {period}",
      weatherToggle: "Add Weather Intelligence",
      weatherCountLabel: "Properties with Weather Intelligence",
      weatherCountHint: "Up to {count} — your purchased capacity.",
      weatherPending: "Setup pending",
      noAddons: "This plan has no add-ons available online. Contact us if you need extra capacity.",
      companyName: "Company name",
      companyAddress: "Company address",
      companyAddressPlaceholder: "Street, city, province, postal code, country",
      companyAddressHint: "Used as your billing and legal address.",
      firstName: "First name",
      lastName: "Last name",
      email: "Work email",
      emailHint: "We'll send a confirmation link here.",
      phone: "Phone",
      optional: "optional",
      back: "← Back",
      next: "Next →",
      submit: "Send request",
      submitting: "Sending…",
      errors: {
        required: "This field is required.",
        invalid: "Remove line breaks or shorten this value.",
        email: "Enter a valid email address.",
        positive: "Enter a whole number of 1 or more.",
        capacity: "This is more than your purchased capacity.",
        max: "This exceeds the plan's limit.",
        plan: "Choose a plan to continue.",
        unavailable: "This option isn't available for the selected plan.",
      },
      loading: "Loading plans…",
      loadErrorTitle: "We couldn't load the plans",
      loadErrorBody: "Check your connection and try again. Nothing was sent.",
      retry: "Try again",
      unavailableTitle: "Online sign-up isn't available right now",
      unavailableBody: "Please talk to our team and we'll set up your account.",
      unconfiguredTitle: "This page isn't connected yet",
      unconfiguredBody: "The sign-up form has no organization configured, so it can't send requests.",
      submitErrorTitle: "Your request wasn't sent",
      submitErrorBody: "Something went wrong on the way. Your answers are still here — try again.",
      doneTitle: "Check your inbox",
      doneBody: "We sent a confirmation link to {email}. It works for 24 hours.",
      doneSteps: [
        "Confirm your email with the link we just sent.",
        "Review your plan in the second email and approve it.",
        "We prepare your order. Nothing is charged yet.",
      ],
      doneHint: "Didn't get it? Check spam, or start a new request with the right email.",
      restart: "Start a new request",
    },
    confirm: {
      verify: {
        title: "Confirm your email",
        body: "Confirm that this is your email so we can prepare your plan summary.",
        action: "Confirm email",
        doneTitle: "Thanks — confirmation received",
        doneBody: "We're preparing your plan summary. It arrives in a separate email.",
      },
      purchase: {
        title: "Approve your subscription",
        body: "You're approving the plan, add-ons and amounts from the email we sent you. Approving doesn't charge your card.",
        action: "Approve plan",
        doneTitle: "Thanks — your approval is saved",
        doneBody: "We're preparing your order and will email you a private link to view it. No payment is taken at this step.",
      },
      sending: "Sending…",
      doneHint: "No email? Check your spam folder. If it isn't there, the link may have expired — start a new request.",
      missingTitle: "Open the link from your email",
      missingBody: "This page needs the private link we emailed you. For your security, the link is removed from the address bar once the page opens — open it from the email again.",
      usedTitle: "This link was already used",
      usedBody: "Each confirmation link works once. Check your inbox for the next email.",
      unknownTitle: "This link isn't valid",
      unknownBody: "It may have expired or been replaced. Start a new request to get a fresh link.",
      failedTitle: "We couldn't confirm right now",
      failedBody: "The link may have been used or expired, or the service is unavailable. Check your inbox for the next email, or start a new request.",
      restart: "Start a new request",
    },
    order: {
      title: "Your subscription order",
      subtitle: "A private, read-only view of the order prepared from your approval.",
      orderNumber: "Order #{id}",
      columnItem: "Item",
      columnQuantity: "Qty",
      columnAmount: "Amount",
      unitPrice: "{price} each",
      subtotal: "Subtotal",
      taxes: "Taxes",
      taxesPending: "Not calculated yet",
      total: "Total",
      totalPending: "Not final until taxes are calculated",
      draftNote: "This order is a draft. Online payment isn't available yet — nothing has been charged.",
      expires: "This private link works until {date}. Don't forward it.",
      partial: "Some lines couldn't be loaded. Refresh to try again.",
      states: { DRAFT: "Draft" },
      loading: "Loading your order…",
      missingTitle: "Open the link from your email",
      missingBody: "This page needs the private link we emailed you. For your security, the link is removed from the address bar once the page opens — open it from the email again.",
      closedTitle: "This link is no longer available",
      closedBody: "Private order links expire after 24 hours or when they're replaced. Contact us if you need a new one.",
      failedTitle: "We couldn't load your order",
      failedBody: "Check your connection and try again.",
      retry: "Try again",
      contact: "Contact us",
    },
  };

  function merge(base, override) {
    if (!override || typeof override !== "object") return base;
    var out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    Object.keys(override).forEach(function (key) {
      var value = override[key];
      if (value === null || value === undefined || value === "") return;
      out[key] = base && typeof base[key] === "object" && !Array.isArray(base[key]) && typeof value === "object" ? merge(base[key], value) : value;
    });
    return out;
  }

  function flatten(value, prefix, out) {
    var result = out || {};
    if (Array.isArray(value)) {
      value.forEach(function (item, index) { flatten(item, prefix + "." + index, result); });
    } else if (value && typeof value === "object") {
      Object.keys(value).forEach(function (key) { flatten(value[key], prefix ? prefix + "." + key : key, result); });
    } else {
      result[prefix] = value;
    }
    return result;
  }

  function unflatten(map, base) {
    var out = JSON.parse(JSON.stringify(base));
    Object.keys(map || {}).forEach(function (key) {
      var path = key.split(".");
      var node = out;
      for (var index = 0; index < path.length - 1; index += 1) {
        if (!node || typeof node !== "object" || !(path[index] in node)) return;
        node = node[path[index]];
      }
      var last = path[path.length - 1];
      if (node && typeof node === "object" && last in node && typeof node[last] === "string" && typeof map[key] === "string" && map[key]) node[last] = map[key];
    });
    return out;
  }

  function fromDocument(root, screen) {
    var found = {};
    Array.prototype.forEach.call(root.querySelectorAll("[data-ps-copy-key]"), function (node) {
      var text = String(node.textContent || "").replace(/\s+/g, " ").trim();
      if (text) found[node.getAttribute("data-ps-copy-key")] = text;
    });
    return unflatten(found, COPY)[screen];
  }

  ns.copy = Object.freeze({
    defaults: COPY,
    merge: merge,
    flatten: flatten,
    unflatten: unflatten,
    fromDocument: fromDocument,
  });
})(typeof window !== "undefined" ? window : globalThis);

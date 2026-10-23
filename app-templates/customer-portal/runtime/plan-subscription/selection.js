(function (global) {
  "use strict";

  var ns = global.PlanSubscription || (global.PlanSubscription = {});

  var PERIODS = ["MONTHLY", "YEARLY"];
  var INTEGER_MAX = 2147483647;
  var TEXT_LIMIT = 4096;
  var EMAIL_LIMIT = 254;
  var CONTACT_FIELDS = ["COMPANY_NAME", "COMPANY_ADDRESS", "FIRST_NAME", "LAST_NAME", "EMAIL", "PHONE"];
  var REQUIRED_FIELDS = ["COMPANY_NAME", "COMPANY_ADDRESS", "EMAIL"];

  function planById(catalog, id) {
    return (catalog.plans || []).filter(function (plan) { return plan.id === id; })[0] || null;
  }

  function selfServicePlans(catalog) {
    return (catalog.plans || []).filter(function (plan) { return plan.selfService; });
  }

  function initial(catalog, preset) {
    var wanted = preset || {};
    var plans = selfServicePlans(catalog);
    var plan = plans.filter(function (entry) { return entry.code === wanted.plan || String(entry.id) === String(wanted.plan); })[0] || null;
    return normalize(catalog, {
      planId: plan ? plan.id : null,
      period: PERIODS.indexOf(wanted.period) !== -1 ? wanted.period : "MONTHLY",
      packs: 0,
      weatherOn: false,
      weather: 0,
    });
  }

  function options(catalog, selection) {
    var plan = planById(catalog, selection.planId);
    var result = { plan: plan, expansion: null, weather: null, included: null, packSize: null, maxPacks: null, capacity: null, maximum: null };
    if (!plan) return result;
    plan.compatibility.forEach(function (id) {
      var addon = catalog.addons[id];
      if (!addon) return;
      if (addon.role === "SITE_EXPANSION" && !result.expansion) result.expansion = addon;
      if (addon.role === "WEATHER" && !result.weather) result.weather = addon;
    });
    result.included = plan.included;
    result.maximum = plan.maximum;
    if (result.expansion) {
      result.packSize = result.expansion.packSize;
      if (plan.maximum !== null && plan.included !== null) {
        result.maxPacks = Math.max(0, Math.floor((plan.maximum - plan.included) / result.packSize));
      }
    }
    var packs = result.expansion ? selection.packs : 0;
    result.capacity = plan.included === null ? null : plan.included + packs * (result.packSize || 0);
    return result;
  }

  function whole(value) {
    var number = typeof value === "number" ? value : Number(String(value == null ? "" : value).trim());
    return Number.isInteger(number) ? number : NaN;
  }

  function normalize(catalog, selection) {
    var next = {
      planId: selection.planId,
      period: PERIODS.indexOf(selection.period) !== -1 ? selection.period : "MONTHLY",
      packs: Math.max(0, whole(selection.packs) || 0),
      weatherOn: Boolean(selection.weatherOn),
      weather: Math.max(0, whole(selection.weather) || 0),
    };
    var available = options(catalog, next);
    if (!available.expansion) next.packs = 0;
    if (available.maxPacks !== null && next.packs > available.maxPacks) next.packs = available.maxPacks;
    if (!available.weather) {
      next.weatherOn = false;
      next.weather = 0;
    }
    return next;
  }

  function validateAddons(catalog, selection, rawWeather) {
    var errors = {};
    var available = options(catalog, selection);
    if (!available.plan || !available.plan.selfService) errors.plan = "required";
    if (selection.packs > 0) {
      if (!available.expansion) errors.packs = "unavailable";
      else if (available.maxPacks !== null && selection.packs > available.maxPacks) errors.packs = "max";
      else if (selection.packs > INTEGER_MAX) errors.packs = "max";
    }
    if (selection.weatherOn) {
      var raw = rawWeather === undefined ? selection.weather : rawWeather;
      var count = whole(raw);
      if (String(raw == null ? "" : raw).trim() === "") errors.weather = "required";
      else if (!Number.isInteger(count) || count < 1) errors.weather = "positive";
      else if (available.capacity !== null && count > available.capacity) errors.weather = "capacity";
      else if (count > INTEGER_MAX) errors.weather = "capacity";
    }
    return errors;
  }

  function controlFree(text) {
    for (var index = 0; index < text.length; index += 1) {
      var code = text.charCodeAt(index);
      if (code < 32 || code === 127) return false;
    }
    return true;
  }

  function validEmail(email) {
    if (email.length > EMAIL_LIMIT || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) return false;
    if (/[,;:"()[\]\\]/.test(email) || email.charAt(0) === "." || email.indexOf("..") !== -1) return false;
    return email.slice(0, email.indexOf("@")).slice(-1) !== ".";
  }

  function validateContact(contact) {
    var errors = {};
    CONTACT_FIELDS.forEach(function (code) {
      var text = String(contact[code] == null ? "" : contact[code]).trim();
      if (!text) {
        if (REQUIRED_FIELDS.indexOf(code) !== -1) errors[code] = "required";
        return;
      }
      if (text.length > TEXT_LIMIT || !controlFree(text)) errors[code] = "invalid";
      else if (code === "EMAIL" && !validEmail(text)) errors[code] = "email";
    });
    return errors;
  }

  function attributes(catalog, selection, contact) {
    var available = options(catalog, selection);
    var values = {
      PLAN_PRODUCT: available.plan ? available.plan.id : null,
      BILLING_PERIOD: selection.period,
      ADDON_PRODUCTS: [],
    };
    if (available.expansion && selection.packs > 0) {
      values.ADDON_PRODUCTS.push(available.expansion.id);
      values.SITE_EXPANSION_PACKS = selection.packs;
    }
    if (available.weather && selection.weatherOn && selection.weather > 0) {
      values.ADDON_PRODUCTS.push(available.weather.id);
      values.WEATHER_PROPERTY_COUNT = selection.weather;
    }
    CONTACT_FIELDS.forEach(function (code) {
      var text = String(contact[code] == null ? "" : contact[code]).trim();
      if (text) values[code] = text;
    });
    return values;
  }

  function submitBody(typeId, organizationId, values) {
    var typed = {};
    Object.keys(values).forEach(function (code) {
      if (values[code] !== null && values[code] !== undefined) typed[code] = { value: values[code] };
    });
    var body = { type: { id: typeId }, organization: { id: organizationId }, attributes: {} };
    body.attributes[typeId] = typed;
    return body;
  }

  ns.selection = Object.freeze({
    periods: PERIODS,
    contactFields: CONTACT_FIELDS,
    requiredFields: REQUIRED_FIELDS,
    selfServicePlans: selfServicePlans,
    initial: initial,
    options: options,
    normalize: normalize,
    validateAddons: validateAddons,
    validateContact: validateContact,
    attributes: attributes,
    submitBody: submitBody,
  });
})(typeof window !== "undefined" ? window : globalThis);

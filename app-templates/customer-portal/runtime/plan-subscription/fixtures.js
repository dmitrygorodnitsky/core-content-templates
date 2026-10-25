(function (global) {
  "use strict";

  var CATALOG = {"prices":[{"price":{"price":{"id":247},"attributes":{"1":{"UNIT_PRICE":{"value":1.95}},"4":{"INTERVAL":{"value":1,"unit":55},"USAGE_TYPE":{"value":"Licensed"}}},"display":{"amount":1.95,"currency":"USD","intervalLabel":"1 Month","customPrice":false}},"product":{"product":{"id":41,"code":"SERVICEWAND_WEATHER_INTELLIGENCE","nls":{"en":{"NAME":"Weather Intelligence","DESCRIPTION":"<p>Optional add-on for all plans. $1.95 per month for each Active Property selected by the customer. Monitor weather and use weather triggers to inform operational decisions and route planning. Charged only for selected properties.</p>"}}},"type":{"code":"FEATURE_ADD_ON"},"attributes":{"20":{"SORT_ORDER_PRIORITY":{"value":20}},"23":{"ENABLED":{"value":true}}}}},{"price":{"price":{"id":249},"attributes":{"1":{"FIXED_FEE":{"value":95},"UNIT_PRICE":{"value":9.9}},"4":{"INTERVAL":{"value":1,"unit":55},"USAGE_TYPE":{"value":"Metered"}}},"display":{"amount":9.9,"currency":"USD","intervalLabel":"1 Month","customPrice":false}},"product":{"product":{"id":42,"code":"SERVICEWAND_ROUTE_OPTIMIZATION_CREDITS","nls":{"en":{"NAME":"Route Optimization Credits"}}},"type":{"code":"SERVICEWAND_TEMPORAL_EXPANSION"},"attributes":{"20":{"SORT_ORDER_PRIORITY":{"value":30}},"24":{"COUNT":{"value":10,"unit":52}}}}},{"price":{"price":{"id":250},"attributes":{"1":{"FIXED_FEE":{"value":950},"UNIT_PRICE":{"value":9.9}},"4":{"INTERVAL":{"value":1,"unit":56},"USAGE_TYPE":{"value":"Metered"}}},"display":{"amount":9.9,"currency":"USD","intervalLabel":"1 Year","customPrice":false}},"product":{"product":{"id":42,"code":"SERVICEWAND_ROUTE_OPTIMIZATION_CREDITS","nls":{"en":{"NAME":"Route Optimization Credits"}}},"type":{"code":"SERVICEWAND_TEMPORAL_EXPANSION"},"attributes":{"20":{"SORT_ORDER_PRIORITY":{"value":30}},"24":{"COUNT":{"value":10,"unit":52}}}}},{"price":{"price":{"id":248},"attributes":{"1":{"UNIT_PRICE":{"value":23.4}},"4":{"INTERVAL":{"value":1,"unit":56},"USAGE_TYPE":{"value":"Licensed"}}},"display":{"amount":23.4,"currency":"USD","intervalLabel":"1 Year","customPrice":false}},"product":{"product":{"id":41,"code":"SERVICEWAND_WEATHER_INTELLIGENCE","nls":{"en":{"NAME":"Weather Intelligence","DESCRIPTION":"<p>Optional add-on for all plans. $1.95 per month for each Active Property selected by the customer. Monitor weather and use weather triggers to inform operational decisions and route planning. Charged only for selected properties.</p>"}}},"type":{"code":"FEATURE_ADD_ON"},"attributes":{"20":{"SORT_ORDER_PRIORITY":{"value":20}},"23":{"ENABLED":{"value":true}}}}},{"price":{"price":{"id":244},"attributes":{"1":{"UNIT_PRICE":{"value":80}},"4":{"INTERVAL":{"value":1,"unit":55},"USAGE_TYPE":{"value":"Licensed"}}},"display":{"amount":80,"currency":"USD","intervalLabel":"1 Month","customPrice":false}},"product":{"product":{"id":40,"code":"SERVICEWAND_SAAS_PROPERTY_EXT_FOUNDATION","nls":{"en":{"NAME":"Foundation Site Expansion","DESCRIPTION":"<p>Adds 50 Active Properties to Foundation for $80 per month per block. Foundation includes 50 Active Properties and supports up to 500 in total.</p>"}}},"type":{"code":"SERVICEWAND_NUMERIC_EXPANSION"},"attributes":{"20":{"SORT_ORDER_PRIORITY":{"value":10}},"22":{"COUNT":{"value":50}}}}},{"price":{"price":{"id":257},"attributes":{"1":{"UNIT_PRICE":{"value":100}},"4":{"INTERVAL":{"value":1,"unit":55},"USAGE_TYPE":{"value":"Licensed"}}},"display":{"amount":100,"currency":"USD","intervalLabel":"1 Month","customPrice":false}},"product":{"product":{"id":46,"code":"SERVICEWAND_SAAS_PROPERTY_EXT_PRO","nls":{"en":{"NAME":"Business Site Expansion","DESCRIPTION":"<p><span style=\"color: rgb(102, 112, 133); background-color: rgb(255, 255, 255);\">Adds 100 Active Properties to Business for $100 per month per block. Business includes 500 Active Properties and supports up to 2000 in total. Higher capacity by agreement.</span></p>"}}},"type":{"code":"SERVICEWAND_NUMERIC_EXPANSION"},"attributes":{"20":{"SORT_ORDER_PRIORITY":{"value":30}},"22":{"COUNT":{"value":100}}}}},{"price":{"price":{"id":258},"attributes":{"1":{"UNIT_PRICE":{"value":150}},"4":{"INTERVAL":{"value":1,"unit":55},"USAGE_TYPE":{"value":"Licensed"}}},"display":{"amount":150,"currency":"USD","intervalLabel":"1 Month","customPrice":false}},"product":{"product":{"id":47,"code":"SERVICEWAND_SAAS_PROPERTY_EXT_GROWTH","nls":{"en":{"NAME":"Growth Site Expansion","DESCRIPTION":"<p><span style=\"background-color: rgb(255, 255, 255); color: rgb(102, 112, 133);\">Adds 100 Active Properties to Growth for $150 per month per block. Growth includes 200 Active Properties and supports up to 1000 in total.</span></p>"}}},"type":{"code":"SERVICEWAND_NUMERIC_EXPANSION"},"attributes":{"20":{"SORT_ORDER_PRIORITY":{"value":20}},"22":{"COUNT":{"value":100}}}}},{"price":{"price":{"id":242},"attributes":{"1":{"UNIT_PRICE":{"value":199}},"4":{"INTERVAL":{"value":1,"unit":55},"USAGE_TYPE":{"value":"Licensed"}}},"display":{"amount":199,"currency":"USD","intervalLabel":"1 Month","customPrice":false}},"product":{"product":{"id":38,"code":"SERVICEWAND_FOUNDATION","nls":{"en":{"NAME":"Foundation","DESCRIPTION":"<p>Organize customers, manual dispatch, field work, and billing in one system.</p>"}}},"type":{"code":"SERVICEWAND_SAAS"},"attributes":{"19":{"PLAN_KICKER":{"value":{"en":{"NAME":"Core Operations"}}},"PLAN_CARD_FEATURE_01":{"value":{"en":{"NAME":"Customer & Property Management"}}},"PLAN_CARD_FEATURE_02":{"value":{"en":{"NAME":"Manual Route Planning & Dispatch"}}},"PLAN_CARD_FEATURE_03":{"value":{"en":{"NAME":"Crew App & Site Instructions"}}},"ACTIVE_PROPERTIES_INCLUDED":{"value":"50"}},"20":{"COMPATIBILITY":{"value":[40,41]},"SORT_ORDER_PRIORITY":{"value":10}}}}},{"price":{"price":{"id":251},"attributes":{"1":{"UNIT_PRICE":{"value":449}},"4":{"INTERVAL":{"value":1,"unit":55},"USAGE_TYPE":{"value":"Licensed"}}},"display":{"amount":449,"currency":"USD","intervalLabel":"1 Month","customPrice":false}},"product":{"product":{"id":43,"code":"SERVICEWAND_GROWTH","nls":{"en":{"NAME":"Growth","DESCRIPTION":"<p>For growing companies managing multiple crews, vehicles, and recurring routes.</p>"}}},"type":{"code":"SERVICEWAND_SAAS"},"attributes":{"19":{"PLAN_KICKER":{"value":{"en":{"NAME":"Multi-Crew Operations"}}},"PLAN_CARD_STATE":{"value":{"en":{"NAME":"featured"}}},"PLAN_CARD_FEATURE_01":{"value":{"en":{"NAME":"Advanced Route Optimization"}}},"PLAN_CARD_FEATURE_02":{"value":{"en":{"NAME":"Bulk Reassignment of Unfinished Work"}}},"PLAN_CARD_FEATURE_03":{"value":{"en":{"NAME":"Standard Operational Dashboards"}}},"ACTIVE_PROPERTIES_INCLUDED":{"value":"200"}},"20":{"COMPATIBILITY":{"value":[47,41,52]},"SORT_ORDER_PRIORITY":{"value":20}}}}},{"price":{"price":{"id":245},"attributes":{"1":{"UNIT_PRICE":{"value":960}},"4":{"INTERVAL":{"value":1,"unit":56},"USAGE_TYPE":{"value":"Licensed"}}},"display":{"amount":960,"currency":"USD","intervalLabel":"1 Year","customPrice":false}},"product":{"product":{"id":40,"code":"SERVICEWAND_SAAS_PROPERTY_EXT_FOUNDATION","nls":{"en":{"NAME":"Foundation Site Expansion","DESCRIPTION":"<p>Adds 50 Active Properties to Foundation for $80 per month per block. Foundation includes 50 Active Properties and supports up to 500 in total.</p>"}}},"type":{"code":"SERVICEWAND_NUMERIC_EXPANSION"},"attributes":{"20":{"SORT_ORDER_PRIORITY":{"value":10}},"22":{"COUNT":{"value":50}}}}},{"price":{"price":{"id":252},"attributes":{"1":{"UNIT_PRICE":{"value":1099}},"4":{"INTERVAL":{"value":1,"unit":55},"USAGE_TYPE":{"value":"Licensed"}}},"display":{"amount":1099,"currency":"USD","intervalLabel":"1 Month","customPrice":false}},"product":{"product":{"id":44,"code":"SERVICEWAND_PROFESSIONAL","nls":{"en":{"NAME":"Business","DESCRIPTION":"<p>Coordinate subcontractors, prepare map-based quotations, and review business performance.</p>"}}},"type":{"code":"SERVICEWAND_SAAS"},"attributes":{"19":{"PLAN_KICKER":{"value":{"en":{"NAME":"Advanced Operations"}}},"PLAN_CARD_STATE":{"value":{"en":{"NAME":"standard"}}},"PLAN_CARD_FEATURE_01":{"value":{"en":{"NAME":"Full Subcontractor Management"}}},"PLAN_CARD_FEATURE_02":{"value":{"en":{"NAME":"Area Measurement & AI-Assisted Mapping"}}},"PLAN_CARD_FEATURE_03":{"value":{"en":{"NAME":"Map-Based, Area-Informed Quotations"}}},"ACTIVE_PROPERTIES_INCLUDED":{"value":"500"}},"20":{"COMPATIBILITY":{"value":[46,41,53,55]},"SORT_ORDER_PRIORITY":{"value":30}}}}},{"price":{"price":{"id":264},"attributes":{"1":{"UNIT_PRICE":{"value":1200}},"4":{"INTERVAL":{"value":1,"unit":56},"USAGE_TYPE":{"value":"Licensed"}}},"display":{"amount":1200,"currency":"USD","intervalLabel":"1 Year","customPrice":false}},"product":{"product":{"id":46,"code":"SERVICEWAND_SAAS_PROPERTY_EXT_PRO","nls":{"en":{"NAME":"Business Site Expansion","DESCRIPTION":"<p><span style=\"color: rgb(102, 112, 133); background-color: rgb(255, 255, 255);\">Adds 100 Active Properties to Business for $100 per month per block. Business includes 500 Active Properties and supports up to 2000 in total. Higher capacity by agreement.</span></p>"}}},"type":{"code":"SERVICEWAND_NUMERIC_EXPANSION"},"attributes":{"20":{"SORT_ORDER_PRIORITY":{"value":30}},"22":{"COUNT":{"value":100}}}}},{"price":{"price":{"id":263},"attributes":{"1":{"UNIT_PRICE":{"value":1800}},"4":{"INTERVAL":{"value":1,"unit":56},"USAGE_TYPE":{"value":"Licensed"}}},"display":{"amount":1800,"currency":"USD","intervalLabel":"1 Year","customPrice":false}},"product":{"product":{"id":47,"code":"SERVICEWAND_SAAS_PROPERTY_EXT_GROWTH","nls":{"en":{"NAME":"Growth Site Expansion","DESCRIPTION":"<p><span style=\"background-color: rgb(255, 255, 255); color: rgb(102, 112, 133);\">Adds 100 Active Properties to Growth for $150 per month per block. Growth includes 200 Active Properties and supports up to 1000 in total.</span></p>"}}},"type":{"code":"SERVICEWAND_NUMERIC_EXPANSION"},"attributes":{"20":{"SORT_ORDER_PRIORITY":{"value":20}},"22":{"COUNT":{"value":100}}}}},{"price":{"price":{"id":246},"attributes":{"1":{"UNIT_PRICE":{"value":1990}},"4":{"INTERVAL":{"value":1,"unit":56},"USAGE_TYPE":{"value":"Licensed"}}},"display":{"amount":1990,"currency":"USD","intervalLabel":"1 Year","customPrice":false}},"product":{"product":{"id":38,"code":"SERVICEWAND_FOUNDATION","nls":{"en":{"NAME":"Foundation","DESCRIPTION":"<p>Organize customers, manual dispatch, field work, and billing in one system.</p>"}}},"type":{"code":"SERVICEWAND_SAAS"},"attributes":{"19":{"PLAN_KICKER":{"value":{"en":{"NAME":"Core Operations"}}},"PLAN_CARD_FEATURE_01":{"value":{"en":{"NAME":"Customer & Property Management"}}},"PLAN_CARD_FEATURE_02":{"value":{"en":{"NAME":"Manual Route Planning & Dispatch"}}},"PLAN_CARD_FEATURE_03":{"value":{"en":{"NAME":"Crew App & Site Instructions"}}},"ACTIVE_PROPERTIES_INCLUDED":{"value":"50"}},"20":{"COMPATIBILITY":{"value":[40,41]},"SORT_ORDER_PRIORITY":{"value":10}}}}},{"price":{"price":{"id":254},"attributes":{"1":{"UNIT_PRICE":{"value":4490}},"4":{"INTERVAL":{"value":1,"unit":56},"USAGE_TYPE":{"value":"Licensed"}}},"display":{"amount":4490,"currency":"USD","intervalLabel":"1 Year","customPrice":false}},"product":{"product":{"id":43,"code":"SERVICEWAND_GROWTH","nls":{"en":{"NAME":"Growth","DESCRIPTION":"<p>For growing companies managing multiple crews, vehicles, and recurring routes.</p>"}}},"type":{"code":"SERVICEWAND_SAAS"},"attributes":{"19":{"PLAN_KICKER":{"value":{"en":{"NAME":"Multi-Crew Operations"}}},"PLAN_CARD_STATE":{"value":{"en":{"NAME":"featured"}}},"PLAN_CARD_FEATURE_01":{"value":{"en":{"NAME":"Advanced Route Optimization"}}},"PLAN_CARD_FEATURE_02":{"value":{"en":{"NAME":"Bulk Reassignment of Unfinished Work"}}},"PLAN_CARD_FEATURE_03":{"value":{"en":{"NAME":"Standard Operational Dashboards"}}},"ACTIVE_PROPERTIES_INCLUDED":{"value":"200"}},"20":{"COMPATIBILITY":{"value":[47,41,52]},"SORT_ORDER_PRIORITY":{"value":20}}}}},{"price":{"price":{"id":255},"attributes":{"1":{"UNIT_PRICE":{"value":10990}},"4":{"INTERVAL":{"value":1,"unit":56},"USAGE_TYPE":{"value":"Licensed"}}},"display":{"amount":10990,"currency":"USD","intervalLabel":"1 Year","customPrice":false}},"product":{"product":{"id":44,"code":"SERVICEWAND_PROFESSIONAL","nls":{"en":{"NAME":"Business","DESCRIPTION":"<p>Coordinate subcontractors, prepare map-based quotations, and review business performance.</p>"}}},"type":{"code":"SERVICEWAND_SAAS"},"attributes":{"19":{"PLAN_KICKER":{"value":{"en":{"NAME":"Advanced Operations"}}},"PLAN_CARD_STATE":{"value":{"en":{"NAME":"standard"}}},"PLAN_CARD_FEATURE_01":{"value":{"en":{"NAME":"Full Subcontractor Management"}}},"PLAN_CARD_FEATURE_02":{"value":{"en":{"NAME":"Area Measurement & AI-Assisted Mapping"}}},"PLAN_CARD_FEATURE_03":{"value":{"en":{"NAME":"Map-Based, Area-Informed Quotations"}}},"ACTIVE_PROPERTIES_INCLUDED":{"value":"500"}},"20":{"COMPATIBILITY":{"value":[46,41,53,55]},"SORT_ORDER_PRIORITY":{"value":30}}}}},{"price":{"price":{"id":253},"attributes":{"1":{"UNIT_PRICE":{"value":2147483647}},"4":{"INTERVAL":{"value":1,"unit":55},"USAGE_TYPE":{"value":"Licensed"}}},"display":{"amount":2147483647,"currency":"USD","intervalLabel":"1 Month","customPrice":true}},"product":{"product":{"id":45,"code":"SERVICEWAND_ENTERPRISE","nls":{"en":{"NAME":"Enterprise","DESCRIPTION":"<p>Agree the capacity, implementation, and service scope your operation requires.</p>"}}},"type":{"code":"SERVICEWAND_SAAS"},"attributes":{"19":{"PLAN_BADGE":{"value":{"en":{"NAME":"Enterprise"}}},"PLAN_KICKER":{"value":{"en":{"NAME":"Custom Requirements"}}},"PLAN_CARD_STATE":{"value":{"en":{"NAME":"muted/custom"}}},"PLAN_CARD_FEATURE_01":{"value":{"en":{"NAME":"Agreed Property Capacity"}}},"PLAN_CARD_FEATURE_02":{"value":{"en":{"NAME":"Agreed Optimization Capacity"}}},"PLAN_CARD_FEATURE_03":{"value":{"en":{"NAME":"Tailored Implementation"}}},"ACTIVE_PROPERTIES_INCLUDED":{"value":"By agreement"}},"20":{"COMPATIBILITY":{"value":[41,54,55]},"SORT_ORDER_PRIORITY":{"value":40}}}}},{"price":{"price":{"id":256},"attributes":{"1":{"UNIT_PRICE":{"value":2147483647}},"4":{"INTERVAL":{"value":1,"unit":56},"USAGE_TYPE":{"value":"Licensed"}}},"display":{"amount":2147483647,"currency":"USD","intervalLabel":"1 Year","customPrice":true}},"product":{"product":{"id":45,"code":"SERVICEWAND_ENTERPRISE","nls":{"en":{"NAME":"Enterprise","DESCRIPTION":"<p>Agree the capacity, implementation, and service scope your operation requires.</p>"}}},"type":{"code":"SERVICEWAND_SAAS"},"attributes":{"19":{"PLAN_BADGE":{"value":{"en":{"NAME":"Enterprise"}}},"PLAN_KICKER":{"value":{"en":{"NAME":"Custom Requirements"}}},"PLAN_CARD_STATE":{"value":{"en":{"NAME":"muted/custom"}}},"PLAN_CARD_FEATURE_01":{"value":{"en":{"NAME":"Agreed Property Capacity"}}},"PLAN_CARD_FEATURE_02":{"value":{"en":{"NAME":"Agreed Optimization Capacity"}}},"PLAN_CARD_FEATURE_03":{"value":{"en":{"NAME":"Tailored Implementation"}}},"ACTIVE_PROPERTIES_INCLUDED":{"value":"By agreement"}},"20":{"COMPATIBILITY":{"value":[41,54,55]},"SORT_ORDER_PRIORITY":{"value":40}}}}}]};
  var FORM_TYPE = {"id":6,"code":"PLAN_SUBSCRIPTION","attributes":[{"code":"PLAN_PRODUCT"},{"code":"BILLING_PERIOD"},{"code":"ADDON_PRODUCTS"},{"code":"SITE_EXPANSION_PACKS"},{"code":"WEATHER_PROPERTY_COUNT"},{"code":"COMPANY_NAME"},{"code":"COMPANY_ADDRESS"},{"code":"FIRST_NAME"},{"code":"LAST_NAME"},{"code":"EMAIL"},{"code":"PHONE"}]};
  var ORDER = {
    id: 9001,
    currency: { id: 17, code: "USD", nls: { en: { NAME: "US Dollar" } } },
    items: [{ id: 9101 }, { id: 9102 }, { id: 9103 }],
    states: [{ id: 1, code: "DRAFT", nls: { en: { NAME: "Draft" } } }],
    type: { id: 1, code: "SERVICEWAND_SUBSCRIPTION", nls: { en: { NAME: "Subscription" } } },
    totalCharges: 1334,
    totalTaxes: null,
    grandTotal: 1334,
  };
  var ORDER_STATES = {
    SUBMITTED: { id: 2, code: "SUBMITTED", nls: { en: { NAME: "Submitted" } } },
    ACTIVE: { id: 3, code: "ACTIVE", nls: { en: { NAME: "Active" } } },
  };
  var ITEMS = {
    9101: { id: 9101, itemCount: 1, amount: 449, itemPrice: { id: 242 }, order: { id: 9001 }, type: { id: 5, code: "SERVICEWAND_SUBSCRIPTION_ITEM", nls: { en: { NAME: "Subscription item" } } } },
    9102: { id: 9102, itemCount: 2, amount: 150, itemPrice: { id: 251 }, order: { id: 9001 }, type: { id: 5, code: "SERVICEWAND_SUBSCRIPTION_ITEM", nls: { en: { NAME: "Subscription item" } } } },
    9103: { id: 9103, itemCount: 300, amount: 1.95, itemPrice: { id: 260 }, order: { id: 9001 }, type: { id: 5, code: "SERVICEWAND_SUBSCRIPTION_ITEM", nls: { en: { NAME: "Subscription item" } } } },
  };

  var PRICES = {
    242: { id: 242, product: { id: 43, nls: { en: { NAME: "Growth" } } } },
    251: { id: 251, product: { id: 47, nls: { en: { NAME: "Growth Site Expansion" } } } },
    260: { id: 260, product: { id: 41, nls: { en: { NAME: "Weather Intelligence" } } } },
  };

  var RULES = {
    planCodes: ["SERVICEWAND_FOUNDATION", "SERVICEWAND_GROWTH", "SERVICEWAND_PROFESSIONAL"],
    siteExpansionCodes: ["SERVICEWAND_SAAS_PROPERTY_EXT_FOUNDATION", "SERVICEWAND_SAAS_PROPERTY_EXT_GROWTH", "SERVICEWAND_SAAS_PROPERTY_EXT_PRO"],
    weatherCode: "SERVICEWAND_WEATHER_INTELLIGENCE",
    maximumByPlanCode: { SERVICEWAND_FOUNDATION: 500, SERVICEWAND_GROWTH: 1000, SERVICEWAND_PROFESSIONAL: 2000 },
  };

  function respond(status, payload) {
    return { status: status, text: function () { return Promise.resolve(payload === undefined ? "" : JSON.stringify(payload)); } };
  }

  function route(scenario, url) {
    var path = String(url);
    if (path.indexOf("/catalog/price-comparison.json") !== -1) {
      if (scenario === "load-error") return respond(503, { message: "Service unavailable" });
      if (scenario === "unavailable") return respond(200, { prices: [] });
      return respond(200, CATALOG);
    }
    if (path.indexOf("/form-type/PLAN_SUBSCRIPTION/get.json") !== -1) return respond(200, FORM_TYPE);
    if (path.indexOf("/core-cms/api/form/submit.json") !== -1) {
      if (scenario === "submitting") return null;
      if (scenario === "submit-error") return respond(400, { message: "EMAIL is invalid", status: 400 });
      return respond(200, 4242);
    }
    if (path.indexOf("/core-cms/api/form/send-event/") !== -1) {
      if (scenario === "sending") return null;
      if (scenario === "used") return respond(410, { message: "Token already used" });
      if (scenario === "unknown") return respond(404, { message: "Token not found" });
      if (scenario === "failed") return respond(500, { message: "Internal error" });
      return respond(200, 4242);
    }
    if (path.indexOf("/introspect.json") !== -1) {
      if (scenario === "closed") return respond(401, {});
      if (scenario === "order-loading") return null;
      return respond(200, { expiresAt: new Date(Date.now() + 23 * 3600000).toISOString(), entities: {} });
    }
    if (path.indexOf("/order/get.json") !== -1) {
      if (scenario === "closed") return respond(401, {});
      if (scenario === "order-failed") return respond(503, {});
      if (scenario === "order-loading") return null;
      if (scenario === "taxes") return respond(200, Object.assign({}, ORDER, { totalTaxes: 66.7, grandTotal: 1400.7 }));
      if (scenario === "active") return respond(200, Object.assign({}, ORDER, { states: [ORDER_STATES.ACTIVE], totalTaxes: 66.7, grandTotal: 1400.7 }));
      if (scenario.indexOf("pay-") === 0) return respond(200, Object.assign({}, ORDER, { states: [ORDER_STATES.SUBMITTED], totalTaxes: 66.7, grandTotal: 1400.7 }));
      return respond(200, ORDER);
    }
    if (path.indexOf("/product-price/get.json") !== -1) {
      var priceId = Number((path.match(/[?&]id=(\d+)/) || [])[1]);
      if (scenario === "partial") return respond(403, {});
      return PRICES[priceId] ? respond(200, PRICES[priceId]) : respond(404, {});
    }
    if (path.indexOf("/order-item/get.json") !== -1) {
      var id = Number((path.match(/[?&]id=(\d+)/) || [])[1]);
      if (scenario === "partial" && id === 9103) return respond(500, {});
      return ITEMS[id] ? respond(200, ITEMS[id]) : respond(404, {});
    }
    return respond(404, { message: "Unknown fixture route" });
  }

  function fetchFor(scenario, delay) {
    return function (url) {
      var response = route(scenario, url);
      return new Promise(function (resolve) {
        if (response === null) return;
        global.setTimeout(function () { resolve(response); }, delay || 0);
      });
    };
  }

  function fakeCard(options) {
    var style = options && options.style && options.style.base || {};
    var handlers = {};
    var host = null;
    var part = function (text, grow) {
      var node = global.document.createElement("span");
      node.textContent = text;
      node.style.cssText = "color:" + (style["::placeholder"] && style["::placeholder"].color || "gray") + ";" + "white-space:nowrap;" + (grow ? "flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;" : "");
      return node;
    };
    return {
      mount: function (node) {
        host = node;
        host.classList.add("StripeElement", "StripeElement--empty");
        var row = global.document.createElement("div");
        row.dir = "ltr";
        row.style.cssText = "display:flex;gap:12px;overflow:hidden;align-items:center;font-size:" + (style.fontSize || "16px") + ";font-family:" + (style.fontFamily || "inherit") + ";line-height:1.2;";
        var brand = part("▭");
        brand.style.color = style.iconColor || "currentColor";
        row.append(brand, part("1234 1234 1234 1234", true), part("MM / YY"), part("CVC"));
        host.replaceChildren(row);
      },
      on: function (name, handler) { handlers[name] = handler; },
      update: function (next) { if (host) host.style.opacity = next && next.disabled ? "0.5" : ""; },
      destroy: function () {
        if (!host) return;
        host.replaceChildren();
        host.classList.remove("StripeElement", "StripeElement--empty");
        host = null;
      },
    };
  }

  function stripeFor(scenario, delay) {
    return function () {
      return {
        elements: function () {
          return { create: function (type, options) { return fakeCard(options); } };
        },
        confirmCardPayment: function () {
          return new Promise(function (resolve) {
            if (scenario === "pay-processing") return;
            global.setTimeout(function () {
              resolve(scenario === "pay-failed"
                ? { error: { type: "card_error", code: "card_declined", message: "Your card was declined." } }
                : { paymentIntent: { id: "pi_demo", status: "succeeded" } });
            }, delay || 0);
          });
        },
      };
    };
  }

  global.PlanSubscriptionFixtures = Object.freeze({ rules: RULES, fetchFor: fetchFor, stripeFor: stripeFor });
})(typeof window !== "undefined" ? window : globalThis);

(function (global) {
  "use strict";

  var ns = global.PlanSubscription || (global.PlanSubscription = {});

  var TOKEN_LIMIT = 2048;
  var MESSAGE_LIMIT = 300;

  function el(tag, className, attrs, children) {
    var node = global.document.createElement(tag);
    if (className) node.className = className;
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value === null || value === undefined || value === false) return;
        if (key === "text") node.textContent = String(value);
        else if (key === "dataset") Object.keys(value).forEach(function (name) { node.dataset[name] = value[name]; });
        else if (key.indexOf("on") === 0 && typeof value === "function") node.addEventListener(key.slice(2), value);
        else node.setAttribute(key, value === true ? "" : String(value));
      });
    }
    (children || []).forEach(function (child) {
      if (child === null || child === undefined || child === false) return;
      node.appendChild(typeof child === "string" ? global.document.createTextNode(child) : child);
    });
    return node;
  }

  function fill(template, values) {
    return String(template == null ? "" : template).replace(/\{(\w+)\}/g, function (match, name) {
      return values && values[name] !== undefined && values[name] !== null ? String(values[name]) : match;
    });
  }

  function plainText(html) {
    var text = String(html == null ? "" : html)
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/p>\s*<p[^>]*>/gi, " ")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;| /g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, "\"")
      .replace(/&#39;/g, "'");
    return text.replace(/\s+/g, " ").trim();
  }

  function clip(value, limit) {
    var text = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
    var max = limit || MESSAGE_LIMIT;
    return text.length <= max ? text : text.slice(0, max) + "…";
  }

  function nls(source, locale, key) {
    if (!source || typeof source !== "object") return "";
    var field = key || "NAME";
    var language = String(locale || "en").toLowerCase().split("-")[0];
    var pick = function (entry) {
      if (!entry) return "";
      if (typeof entry === "string") return entry;
      return typeof entry[field] === "string" ? entry[field] : "";
    };
    return pick(source[language]) || pick(source.en) || Object.keys(source).map(function (name) { return pick(source[name]); }).filter(Boolean)[0] || "";
  }

  function toCents(value) {
    if (value === null || value === undefined || value === "") return null;
    var number = typeof value === "number" ? value : Number(String(value).trim());
    if (!isFinite(number)) return null;
    return Math.round(number * 100);
  }

  function money(cents, currency, locale) {
    if (cents === null || cents === undefined || !currency) return "";
    var whole = cents % 100 === 0;
    try {
      return new Intl.NumberFormat(locale || "en", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: whole ? 0 : 2,
        maximumFractionDigits: 2,
      }).format(cents / 100);
    } catch (_) {
      return (cents / 100).toFixed(whole ? 0 : 2) + " " + currency;
    }
  }

  function integer(value, locale) {
    try {
      return new Intl.NumberFormat(locale || "en").format(value);
    } catch (_) {
      return String(value);
    }
  }

  function date(value, locale) {
    if (!value) return "";
    var parsed = new Date(typeof value === "number" ? value : String(value));
    if (isNaN(parsed.getTime())) return "";
    try {
      return new Intl.DateTimeFormat(locale || "en", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
    } catch (_) {
      return parsed.toISOString();
    }
  }

  function acceptableToken(value) {
    if (!value || value.length > TOKEN_LIMIT || /\s/.test(value)) return false;
    for (var index = 0; index < value.length; index += 1) {
      var code = value.charCodeAt(index);
      if (code < 32 || code === 127) return false;
    }
    return true;
  }

  function fragment(hash) {
    var values = {};
    String(hash == null ? "" : hash).replace(/^#/, "").split("&").forEach(function (pair) {
      var at = pair.indexOf("=");
      if (at <= 0) return;
      var key = pair.slice(0, at);
      try {
        values[key] = decodeURIComponent(pair.slice(at + 1));
      } catch (_) {
        values[key] = "";
      }
    });
    return values;
  }

  function scrubFragment(location, history) {
    if (!location || !history || typeof history.replaceState !== "function") return;
    if (!location.hash) return;
    try {
      history.replaceState(null, "", location.pathname + location.search);
    } catch (_) {
      return;
    }
  }

  function apiBase(value, location) {
    var text = String(value == null ? "" : value).trim();
    if (!text && location && location.origin) return location.origin;
    try {
      var url = new URL(text);
      if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") return "";
      return url.origin;
    } catch (_) {
      return "";
    }
  }

  function failure(code, status, message) {
    var error = new Error(code);
    error.name = "PlanSubscriptionError";
    error.code = code;
    error.status = typeof status === "number" ? status : 0;
    error.serverMessage = clip(message);
    return error;
  }

  function messageOf(payload) {
    if (!payload || typeof payload !== "object") return "";
    var keys = ["message", "error_description", "detail", "title", "error"];
    for (var index = 0; index < keys.length; index += 1) {
      if (typeof payload[keys[index]] === "string" && payload[keys[index]].trim()) return payload[keys[index]];
    }
    return "";
  }

  function request(fetchImpl, url, options) {
    var settings = options || {};
    var init = {
      method: settings.method || "GET",
      credentials: "omit",
      cache: "no-store",
      referrerPolicy: "no-referrer",
      headers: { Accept: "application/json" },
    };
    if (settings.body !== undefined) {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(settings.body);
    }
    return new Promise(function (resolve) {
      resolve(fetchImpl(url, init));
    }).then(function (response) {
      if (!response || typeof response.status !== "number") throw failure("network", 0);
      return Promise.resolve(response.text()).then(null, function () { return ""; }).then(function (body) {
        var payload;
        try {
          payload = body ? JSON.parse(body) : undefined;
        } catch (_) {
          payload = undefined;
        }
        return { status: response.status, payload: payload };
      });
    }, function () {
      throw failure("network", 0);
    });
  }

  function announce(node, text) {
    if (!node) return;
    node.textContent = "";
    global.setTimeout(function () { node.textContent = text || ""; }, 30);
  }

  ns.core = Object.freeze({
    el: el,
    fill: fill,
    plainText: plainText,
    clip: clip,
    nls: nls,
    toCents: toCents,
    money: money,
    integer: integer,
    date: date,
    acceptableToken: acceptableToken,
    fragment: fragment,
    scrubFragment: scrubFragment,
    apiBase: apiBase,
    failure: failure,
    messageOf: messageOf,
    request: request,
    announce: announce,
  });
})(typeof window !== "undefined" ? window : globalThis);

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
      resource: { service: "core-rm", segment: "resource", grant: "property" },
    },
    fragment: { token: "token", propertyToken: "property-token" },
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
    safeApiBase: safeApiBase,
    safePortalUrl: safePortalUrl,
    imageId: imageId,
    reviewError: reviewError,
    refusalMessage: refusalMessage,
    fieldErrorsOf: fieldErrorsOf,
  });
})(typeof window !== "undefined" ? window : globalThis);

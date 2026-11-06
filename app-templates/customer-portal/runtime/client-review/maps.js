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

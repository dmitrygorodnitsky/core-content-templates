var SCRIPT_URL = "https://maps.googleapis.com/maps/api/js";
var LIBRARIES = ["core", "maps", "geocoding"];
var READY_CALLBACK = "__portalGoogleMapsReady";
var GEOCODE_PREFIX = "portal.geocode:";
var SUGGESTION_LIMIT = 5;
var SUGGESTION_TYPES = ["street_address", "premise", "subpremise", "route"];

export function createGoogleMapsAdapter(options) {
  var apiKey = (options && options.apiKey) || "";
  var scope = (options && options.scope) || globalThis;
  var failureListeners = [];
  var loading = null;
  var maps = null;

  function fail(error) {
    failureListeners.slice().forEach(function (listener) { listener(error); });
  }

  return {
    opened: function () {
      return !!apiKey;
    },

    onFailure: function (listener) {
      failureListeners.push(listener);
    },

    load: function () {
      if (loading) return loading;
      if (!apiKey) {
        loading = Promise.reject(new Error("Google Maps adapter is not opened"));
        return loading;
      }
      loading = scriptNamespace(scope, apiKey, fail).then(function (namespace) {
        return importLibraries(namespace, scope);
      }).then(function (loaded) {
        maps = loaded;
        return loaded;
      });
      return loading;
    },

    suggestAddresses: function (query) {
      return this.load().then(function (loaded) {
        return typeof loaded.importLibrary === "function" ? loaded.importLibrary("places") : loaded.places;
      }).then(function (places) {
        var finder = places && places.AutocompleteSuggestion;
        if (!finder || typeof finder.fetchAutocompleteSuggestions !== "function") return [];
        return Promise.resolve(finder.fetchAutocompleteSuggestions({ input: query, includedPrimaryTypes: SUGGESTION_TYPES })).then(function (response) {
          return ((response && response.suggestions) || []).map(function (suggestion) {
            var prediction = suggestion && suggestion.placePrediction;
            var label = prediction && prediction.text ? String(prediction.text) : "";
            return { label: label, address: function () { return formattedAddress(prediction, label); } };
          }).filter(function (item) { return item.label; }).slice(0, SUGGESTION_LIMIT);
        });
      });
    },

    geocode: function (address) {
      if (!maps || typeof maps.Geocoder !== "function") return Promise.reject(new Error("Google Maps is not loaded"));
      return new Promise(function (resolve, reject) {
        new maps.Geocoder().geocode({ address: address }, function (results, status) {
          var location = status === "OK" && results && results[0] && results[0].geometry && results[0].geometry.location;
          if (!location || typeof location.lat !== "function" || typeof location.lng !== "function") {
            reject(new Error("Geocoder answered " + status));
            return;
          }
          resolve({ lat: location.lat(), lon: location.lng() });
        });
      });
    },
  };
}

export function createGeocodeCache(storage) {
  return {
    read: function (key) {
      if (!key || !storage) return null;
      try {
        var raw = storage.getItem(GEOCODE_PREFIX + key);
        return raw ? JSON.parse(raw) : null;
      } catch (_) {
        return null;
      }
    },

    write: function (key, point) {
      if (!key || !point || !storage) return false;
      try {
        storage.setItem(GEOCODE_PREFIX + key, JSON.stringify({ lat: point.lat, lon: point.lon }));
        return true;
      } catch (_) {
        return false;
      }
    },
  };
}

export function browserStorage() {
  try {
    return globalThis.localStorage || null;
  } catch (_) {
    return null;
  }
}

function formattedAddress(prediction, label) {
  var place = prediction && typeof prediction.toPlace === "function" ? prediction.toPlace() : null;
  if (!place || typeof place.fetchFields !== "function") return Promise.resolve(label);
  return Promise.resolve(place.fetchFields({ fields: ["formattedAddress"] })).then(function () {
    return String(place.formattedAddress || label);
  }, function () {
    return label;
  });
}

function scriptNamespace(scope, apiKey, fail) {
  var present = scope.google && scope.google.maps;
  if (present && (typeof present.importLibrary === "function" || typeof present.Map === "function")) {
    return Promise.resolve(present);
  }
  return new Promise(function (resolve, reject) {
    var settled = false;
    function ready() {
      var loaded = scope.google && scope.google.maps;
      if (settled || !loaded || (typeof loaded.importLibrary !== "function" && typeof loaded.Map !== "function")) return false;
      settled = true;
      resolve(loaded);
      return true;
    }
    var previous = scope.gm_authFailure;
    scope.gm_authFailure = function () {
      var error = new Error("Google Maps rejected the browser key");
      settled = true;
      reject(error);
      fail(error);
      if (typeof previous === "function") previous();
    };
    scope[READY_CALLBACK] = ready;
    var script = scope.document.createElement("script");
    script.async = true;
    script.src = SCRIPT_URL + "?key=" + encodeURIComponent(apiKey) + "&loading=async&v=weekly&callback=" + READY_CALLBACK;
    script.addEventListener("error", function () {
      settled = true;
      reject(new Error("The Google Maps script did not load"));
    });
    script.addEventListener("load", function () {
      if (ready()) return;
      if (!(scope.google && scope.google.maps)) {
        settled = true;
        reject(new Error("The Google Maps script loaded without google.maps"));
      }
    });
    scope.document.head.appendChild(script);
  });
}

function importLibraries(maps, scope) {
  if (typeof maps.importLibrary !== "function") return maps;
  return Promise.all(LIBRARIES.map(function (name) { return maps.importLibrary(name); })).then(function (libraries) {
    var current = (scope && scope.google && scope.google.maps) || maps;
    if (typeof current.Map === "function") return current;
    return libraries.reduce(function (merged, library) {
      return Object.assign(merged, library);
    }, Object.assign({}, current));
  });
}

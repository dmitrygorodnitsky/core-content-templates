var SCRIPT_URL = "https://maps.googleapis.com/maps/api/js";
var LIBRARIES = ["core", "maps", "geocoding"];
var GEOCODE_PREFIX = "portal.geocode:";

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
      loading = scriptNamespace(scope, apiKey, fail).then(importLibraries).then(function (loaded) {
        maps = loaded;
        return loaded;
      });
      return loading;
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

function scriptNamespace(scope, apiKey, fail) {
  var present = scope.google && scope.google.maps;
  if (present && (typeof present.importLibrary === "function" || typeof present.Map === "function")) {
    return Promise.resolve(present);
  }
  return new Promise(function (resolve, reject) {
    var previous = scope.gm_authFailure;
    scope.gm_authFailure = function () {
      var error = new Error("Google Maps rejected the browser key");
      reject(error);
      fail(error);
      if (typeof previous === "function") previous();
    };
    var script = scope.document.createElement("script");
    script.async = true;
    script.src = SCRIPT_URL + "?key=" + encodeURIComponent(apiKey) + "&loading=async&v=weekly";
    script.addEventListener("error", function () {
      reject(new Error("The Google Maps script did not load"));
    });
    script.addEventListener("load", function () {
      var loaded = scope.google && scope.google.maps;
      if (loaded) resolve(loaded);
      else reject(new Error("The Google Maps script loaded without google.maps"));
    });
    scope.document.head.appendChild(script);
  });
}

function importLibraries(maps) {
  if (typeof maps.importLibrary !== "function") return maps;
  return Promise.all(LIBRARIES.map(function (name) { return maps.importLibrary(name); })).then(function () {
    return maps;
  });
}

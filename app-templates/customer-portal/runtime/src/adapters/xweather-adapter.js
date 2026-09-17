var HOST = "https://data.api.xweather.com";

export function createXweatherAdapter(options) {
  var clientId = (options && options.clientId) || "";
  var clientSecret = (options && options.clientSecret) || "";
  var fetchImpl = (options && options.fetch) || (typeof fetch === "function" ? fetch : null);

  return {
    opened: function () {
      return !!(clientId && clientSecret && fetchImpl);
    },

    dailyForecast: function (lat, lon, days) {
      if (!this.opened()) return Promise.reject(new Error("Xweather adapter is not opened"));
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return Promise.reject(new Error("A forecast needs a finite coordinate"));
      var url = HOST + "/forecasts/" + encodeURIComponent(lat + "," + lon)
        + "?filter=day&limit=" + encodeURIComponent(String(days))
        + "&client_id=" + encodeURIComponent(clientId)
        + "&client_secret=" + encodeURIComponent(clientSecret);
      return fetchImpl(url, { credentials: "omit", mode: "cors" }).then(function (response) {
        if (!response.ok) throw new Error("Xweather HTTP " + response.status);
        return response.json();
      }).then(function (payload) {
        if (!payload || payload.success !== true) {
          throw new Error("Xweather error: " + ((payload && payload.error && payload.error.description) || "unknown"));
        }
        var periods = payload.response && payload.response[0] && payload.response[0].periods;
        if (!Array.isArray(periods) || !periods.length) throw new Error("Xweather returned no forecast periods");
        return periods;
      });
    },
  };
}

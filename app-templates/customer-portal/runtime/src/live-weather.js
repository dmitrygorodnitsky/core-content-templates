import { createXweatherAdapter } from "./adapters/xweather-adapter.js";
import { WEATHER_LEGEND, buildTimeline, forecastDay } from "./normalizers/weather.js";
import { state } from "./state.js";

var FRAME_COUNT = 7;

export function liveWeatherOpened(config) {
  return !!(config && config.weatherClientId && config.weatherClientSecret);
}

export function weatherSource(config, fixtureWeather) {
  var geography = config && config.serviceGeography;
  if (geography) return { zoneCentroids: geography.zones, legend: WEATHER_LEGEND };
  if (config && config.dataMode === "live") return null;
  return fixtureWeather || null;
}

export function loadLiveWeather(fixtureWeather, config, adapter) {
  if (!liveWeatherOpened(config)) return Promise.resolve(null);
  var source = weatherSource(config, fixtureWeather);
  var centroids = (source && source.zoneCentroids) || null;
  if (!centroids) return Promise.resolve(null);

  var zoneOrder = Object.keys(centroids);
  if (!zoneOrder.length) return Promise.resolve(null);

  var client = adapter || createXweatherAdapter({
    clientId: config.weatherClientId,
    clientSecret: config.weatherClientSecret,
  });
  if (!client.opened()) return Promise.resolve(null);

  state.liveWeatherState = "loading";
  return Promise.all(zoneOrder.map(function (zone) {
    return client.dailyForecast(centroids[zone].lat, centroids[zone].lon, FRAME_COUNT);
  })).then(function (results) {
    var zonePeriods = {};
    zoneOrder.forEach(function (zone, index) { zonePeriods[zone] = results[index]; });
    var timeline = buildTimeline(zonePeriods, zoneOrder);
    state.liveWeather = {
      nowIndex: 0,
      legend: source.legend || WEATHER_LEGEND,
      zoneCentroids: centroids,
      timeline: timeline,
      source: "xweather",
    };
    state.liveWeatherState = "ready";
    return state.liveWeather;
  }).catch(function (error) {
    state.liveWeather = null;
    state.liveWeatherState = "failed";
    console.warn("[portal] live weather unavailable, staying on fixture data", error);
    return null;
  });
}

export function createPropertyForecasts(options) {
  var adapter = options.adapter;
  var onChange = options.onChange;
  var entries = new Map();

  return {
    request: function (id, point) {
      if (entries.has(id)) return entries.get(id);
      if (!point || !adapter.opened()) return null;
      entries.set(id, { state: "loading", days: [] });
      adapter.dailyForecast(point.lat, point.lon, FRAME_COUNT).then(function (periods) {
        return { state: "ready", days: periods.map(forecastDay) };
      }).catch(function (error) {
        console.warn("[portal] property forecast unavailable, showing the area forecast", error && error.message);
        return { state: "failed", days: [] };
      }).then(function (entry) {
        entries.set(id, entry);
        onChange();
      });
      return entries.get(id);
    },
  };
}

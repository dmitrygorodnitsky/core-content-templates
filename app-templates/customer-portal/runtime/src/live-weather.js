import { createXweatherAdapter } from "./adapters/xweather-adapter.js";
import { buildTimeline } from "./normalizers/weather.js";
import { state } from "./state.js";

var FRAME_COUNT = 7;

export function liveWeatherOpened(config) {
  return !!(config && config.weatherClientId && config.weatherClientSecret);
}

export function loadLiveWeather(fixtureWeather, config, adapter) {
  if (!liveWeatherOpened(config)) return Promise.resolve(null);
  var centroids = (fixtureWeather && fixtureWeather.zoneCentroids) || null;
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
      legend: fixtureWeather.legend,
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

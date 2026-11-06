import { ACTIONS } from "./actions.js";
import { render } from "./app.js";
import { currentOverview, state } from "./state.js";
import { browserStorage, createGeocodeCache, createGoogleMapsAdapter } from "./adapters/google-maps-adapter.js";
import { createPropertyMap } from "./components/storm/PropertyMap.js";

var controller = null;

export function sharedPropertyMap() {
  if (!state.config.mapsApiKey) return null;
  if (!controller) {
    controller = createPropertyMap({
      adapter: createGoogleMapsAdapter({ apiKey: state.config.mapsApiKey }),
      cache: createGeocodeCache(browserStorage()),
      mapId: state.config.mapsMapId,
      dispatch: dispatchMapAction,
      onChange: render,
    });
  }
  return controller;
}

export function mapViewport() {
  var model = currentOverview();
  if (model && model.map) return model.map;
  var geography = state.config.serviceGeography;
  return (geography && geography.map) || null;
}

export function usablePropertyMap() {
  var map = sharedPropertyMap();
  return map && mapViewport() && map.status() !== "failed" ? map : null;
}

export function dispatchMapAction(name, id) {
  var action = ACTIONS[name];
  if (action) action(id);
}

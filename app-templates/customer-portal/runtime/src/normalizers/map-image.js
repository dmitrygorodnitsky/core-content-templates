var HOST = "https://maps.api.xweather.com";
var TILE = 256;

export function mapOpened(map, config) {
  return !!(map && map.center && map.size && config && config.weatherClientId && config.weatherClientSecret);
}

export function mapImageUrl(map, config) {
  if (!mapOpened(map, config)) return "";
  var layers = (map.layers || []).filter(function (layer) { return /^[a-z0-9-]+$/.test(layer); });
  if (!layers.length) return "";
  return HOST + "/" + encodeURIComponent(config.weatherClientId + "_" + config.weatherClientSecret)
    + "/" + layers.join(",")
    + "/" + map.size.width + "x" + map.size.height
    + "/" + map.center.lat + "," + map.center.lon + "," + map.zoom
    + "/current.png";
}

export function projectPoint(lat, lon, map) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !map || !map.center) return null;
  var world = TILE * Math.pow(2, map.zoom);
  var dx = worldX(lon, world) - worldX(map.center.lon, world);
  var dy = worldY(lat, world) - worldY(map.center.lat, world);
  return {
    x: (dx + map.size.width / 2) / map.size.width * 100,
    y: (dy + map.size.height / 2) / map.size.height * 100,
  };
}

export function withinFrame(point) {
  return !!point && point.x >= 0 && point.x <= 100 && point.y >= 0 && point.y <= 100;
}

function worldX(lon, world) {
  return (lon + 180) / 360 * world;
}

function worldY(lat, world) {
  var radians = clampLatitude(lat) * Math.PI / 180;
  var merc = Math.log(Math.tan(radians) + 1 / Math.cos(radians));
  return (1 - merc / Math.PI) / 2 * world;
}

function clampLatitude(lat) {
  if (lat > 85.05112878) return 85.05112878;
  if (lat < -85.05112878) return -85.05112878;
  return lat;
}

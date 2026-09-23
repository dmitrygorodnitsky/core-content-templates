var ICONS = {
  map: "M4 7.5 9.5 5l5 2.5L20 5v11.5L14.5 19l-5-2.5L4 19V7.5Z M9.5 5v11.5 M14.5 7.5V19",
  calendar: "M4.5 7.5h15v12a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5v-12Z M4.5 7.5V6A1.5 1.5 0 0 1 6 4.5h12A1.5 1.5 0 0 1 19.5 6v1.5 M8.5 3v3 M15.5 3v3 M8 12h3 M8 16h8",
  invoice: "M6 3.5h12v17l-3-2-3 2-3-2-3 2v-17Z M9.5 8.5h5 M9.5 12.5h5 M9.5 16h3",
  contract: "M12 3.2 19.5 6v6c0 4.2-3 7.6-7.5 8.8C7.5 19.6 4.5 16.2 4.5 12V6L12 3.2Z M9 12.2l2.2 2.2 4-4.2",
  support: "M4.5 6.5A2 2 0 0 1 6.5 4.5h11a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H10l-4 3.5v-3.5H6.5a2 2 0 0 1-2-2v-7Z M9 9.5h6 M9 12.5h4",
  alert: "M12 4.2 21 19.5H3L12 4.2Z M12 10v4.4 M12 16.6v.6",
  pin: "M12 21s-6.5-5.8-6.5-10.5a6.5 6.5 0 1 1 13 0C18.5 15.2 12 21 12 21Z M12 12.8a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6Z",
  snowflake: "M12 3v18 M4.2 7.5l15.6 9 M19.8 7.5l-15.6 9 M12 7l-2.6-2.2 M12 7l2.6-2.2 M12 17l-2.6 2.2 M12 17l2.6 2.2",
  signOut: "M10 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H10 M14.5 8l4 4-4 4 M18.5 12H9.5",
};

export function icon(name, className) {
  var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  if (className) svg.setAttribute("class", className);
  var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", ICONS[name] || "");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "1.6");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  svg.appendChild(path);
  return svg;
}

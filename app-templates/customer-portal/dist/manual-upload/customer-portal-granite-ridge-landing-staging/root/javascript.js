(function () {
  "use strict";
  var page = document.documentElement;
  var reasons = ["signed-out","no-access"];
  var darkScheme = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function applyMode() { page.dataset.mode = darkScheme && darkScheme.matches ? "dark" : "light"; }
  page.dataset.theme = "snow";
  applyMode();
  if (darkScheme && typeof darkScheme.addEventListener === "function") darkScheme.addEventListener("change", applyMode);
  function safeUrl(value) {
    var raw = String(value || "").trim();
    if (!raw) return "";
    try { var url = new URL(raw); return url.protocol === "https:" ? url.href : ""; } catch (_) { return ""; }
  }
  function disableUnsetDestinations(shell) {
    shell.querySelectorAll("a[data-destination]").forEach(function (link) {
      if (safeUrl(link.getAttribute("href"))) return;
      link.removeAttribute("href");
      link.setAttribute("aria-disabled", "true");
      link.setAttribute("data-destination-state", "unset");
    });
  }
  function noticeReason(search) {
    var entries = [];
    new URLSearchParams(search).forEach(function (value, key) { entries.push([key, value]); });
    if (entries.length !== 1 || entries[0][0] !== "portal") return "";
    return reasons.indexOf(entries[0][1]) === -1 ? "" : entries[0][1];
  }
  function forgetReason() {
    try { window.history.replaceState(window.history.state, "", window.location.pathname + window.location.hash); } catch (_) {}
  }
  function showNotice(shell, reason) {
    var shown = false;
    shell.querySelectorAll("[data-notice]").forEach(function (notice) {
      if (!reason || notice.getAttribute("data-notice") !== reason) return;
      notice.hidden = false;
      shown = true;
      var dismiss = notice.querySelector("[data-notice-dismiss]");
      if (dismiss) dismiss.addEventListener("click", function () { notice.hidden = true; });
    });
    if (shown) forgetReason();
  }
  function trackWidth(shell) {
    function apply() {
      var width = shell.getBoundingClientRect().width;
      shell.classList.toggle("vw-mobile", width <= 560);
      shell.classList.toggle("vw-tablet", width > 560 && width <= 900);
      shell.classList.toggle("vw-compact", width <= 1040);
    }
    apply();
    if (typeof window.ResizeObserver === "function") new window.ResizeObserver(apply).observe(shell);
  }
  function start() {
    var shell = document.getElementById("snow-landing");
    if (!shell) return;
    trackWidth(shell);
    disableUnsetDestinations(shell);
    showNotice(shell, noticeReason(window.location.search));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();

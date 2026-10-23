(function (global) {
  "use strict";

  var ns = global.PlanSubscription || (global.PlanSubscription = {});
  var core = ns.core;
  var ui = ns.ui;

  var STEPS = ["verify", "purchase"];

  function outcome(status) {
    if (status >= 200 && status < 300) return "received";
    if (status === 410) return "used";
    if (status === 404) return "unknown";
    return "failed";
  }

  function mount(root, options) {
    var settings = options || {};
    var copy = ns.copy.merge(ns.copy.defaults.confirm, settings.copy);
    var fetchImpl = settings.fetch || (global.fetch && global.fetch.bind(global));
    var base = core.apiBase(settings.apiBase, global.location);
    var location = settings.location || global.location;
    var values = core.fragment(location && location.hash);
    var onHash = settings.location ? null : function () {
      if (core.acceptableToken(core.fragment(global.location.hash).token)) global.location.reload();
    };
    if (onHash) global.addEventListener("hashchange", onHash);
    core.scrubFragment(location, settings.history || global.history);
    var step = STEPS.indexOf(values.step) !== -1 ? values.step : "";
    var token = core.acceptableToken(values.token) ? values.token : "";
    var purchaseHref = settings.purchaseHref || "subscribe.html";
    var alive = true;
    var shell = core.el("div", "df-wrapper ps", { dataset: { psScreen: "confirm", state: "loading" } });
    root.replaceChildren(shell);

    function render(phase) {
      shell.dataset.state = phase;
      var text = copy[step] || copy.verify;
      var restart = ui.link(copy.restart, purchaseHref, "ghost");
      var view;
      if (phase === "sending") view = ui.loader(copy.sending);
      else if (phase === "received") view = ui.status({ tone: "success", state: "success", icon: step === "purchase" ? "doc" : "mail", visualId: "plan-subscription-confirm-" + step, title: text.doneTitle, body: text.doneBody, extra: [core.el("p", "ps-status__hint", { text: copy.doneHint })] });
      else if (phase === "used") view = ui.status({ tone: "info", state: "fallback", icon: "check", title: copy.usedTitle, body: copy.usedBody });
      else if (phase === "unknown") view = ui.status({ tone: "error", state: "error", icon: "link", title: copy.unknownTitle, body: copy.unknownBody, actions: [restart] });
      else if (phase === "failed") view = ui.status({ tone: "error", state: "error", title: copy.failedTitle, body: copy.failedBody, actions: [restart] });
      else view = ui.status({ tone: "info", state: "unauthorized", icon: "lock", title: copy.missingTitle, body: copy.missingBody });
      shell.replaceChildren(view);
      var title = shell.querySelector(".ps-status__title");
      if (title && phase !== "sending") title.focus({ preventScroll: true });
    }

    function send() {
      render("sending");
      core.request(fetchImpl, base + "/core-cms/api/form/send-event/" + encodeURIComponent(token) + ".json", { method: "POST", body: {} }).then(function (result) {
        if (alive) render(outcome(result.status));
      }, function () {
        if (alive) render("failed");
      });
    }

    if (!step || !token || !base || typeof fetchImpl !== "function") render("missing");
    else send();

    return {
      stop: function () {
        alive = false;
        if (onHash) global.removeEventListener("hashchange", onHash);
        root.replaceChildren();
      },
    };
  }

  ns.confirm = Object.freeze({ mount: mount, steps: STEPS, outcome: outcome });
})(typeof window !== "undefined" ? window : globalThis);

(function (global) {
  "use strict";

  var ns = global.ClientReview || (global.ClientReview = {});

  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var CHECKING_DELAYS = [2000, 3000, 5000, 8000, 12000, 15000, 15000, 15000];
  var RETURNED_COPY = { missing: "returnedMissing", unconfirmed: "returnedUnconfirmed", choice: "returnedChoice", email: "returnedEmail" };

  function systemTimers() {
    return {
      set: function (callback, ms) { return global.setTimeout(callback, ms); },
      clear: function (handle) { global.clearTimeout(handle); },
    };
  }

  function createController(options) {
    var settings = options || {};
    var adapter = settings.adapter || null;
    var copy = ns.withDefaults(settings.copy);
    var locale = settings.locale || "en";
    var mount = settings.mount || null;
    var live = settings.live || null;
    var timers = settings.timers || systemTimers();
    var delays = Array.isArray(settings.pollDelays) && settings.pollDelays.length ? settings.pollDelays.slice() : CHECKING_DELAYS.slice();
    var portalUrl = ns.adapter.safePortalUrl(settings.portalUrl);
    var contract = ns.contract;
    var normalizer = ns.normalizer;
    var inflight = {};
    var loading = null;
    var listeners = [];
    var stopped = false;
    var poll = { timer: null, attempt: 0, exhausted: false };
    var state = {
      phase: settings.phase || "loading",
      view: null,
      closedAfter: "",
      errorAfterCommand: false,
      retryContext: {},
      primaryEmail: "",
      followDecisions: false,
      accepted: {},
      refreshing: false,
      expanded: {},
      confirm: null,
      drafts: {},
      draftInvalid: {},
      commands: {},
      details: emptyDetails(null),
      focusKey: "",
    };

    function emptyDetails(agreementId) {
      return { seededFor: agreementId, values: {}, errors: {}, touched: {}, serverErrors: {}, invalid: false, returnPending: true, sent: false };
    }

    function checkingNow() {
      return state.phase === "ready" && Boolean(state.view) && state.view.kind === "checking";
    }

    function followingNow() {
      return state.phase === "ready" && state.followDecisions && Boolean(state.view) && state.view.kind === "quote-review" && state.view.allDecided;
    }

    function pageWaitingNow() {
      return checkingNow() || followingNow();
    }

    function waitingNow() {
      return pageWaitingNow() || (state.phase === "ready" && Object.keys(state.accepted).length > 0);
    }

    function eventSource(code) {
      var found = "";
      [contract.orderEvents, contract.agreementEvents].forEach(function (events) {
        Object.keys(events).forEach(function (key) { if (events[key].code === code) found = events[key].source; });
      });
      return found;
    }

    function accept(recordKey, entity, id, event, closedAfter) {
      var details = event === contract.agreementEvents.details.code;
      state.accepted[recordKey] = {
        entity: entity,
        id: id,
        event: event,
        source: eventSource(event),
        closedAfter: closedAfter,
        errorsBefore: details && state.view && state.view.agreement ? state.view.agreement.detailsErrors : "",
      };
      if (details) {
        state.details.returnPending = true;
        state.details.sent = true;
      }
      poll.attempt = 0;
      poll.exhausted = false;
    }

    function currentOf(expectation, view) {
      if (expectation.entity !== "order") return view.agreement ? view.agreement.state : "";
      var option = optionsOf(view).filter(function (candidate) { return candidate.id === expectation.id; })[0];
      return option ? option.state : null;
    }

    function landed(expectation, view) {
      var current = currentOf(expectation, view);
      if (current === null) return false;
      if (current !== expectation.source) return true;
      return expectation.event === contract.agreementEvents.details.code && view.agreement.detailsErrors !== expectation.errorsBefore;
    }

    function settleAccepted() {
      var receiving = false;
      Object.keys(state.accepted).forEach(function (recordKey) {
        var expectation = state.accepted[recordKey];
        if (!landed(expectation, state.view)) {
          if (expectation.event === contract.agreementEvents.details.code) receiving = true;
          return;
        }
        delete state.accepted[recordKey];
        delete state.commands[recordKey];
        if (expectation.event === contract.orderEvents.approve.code || expectation.event === contract.orderEvents.decline.code) state.followDecisions = true;
      });
      if (receiving) state.view.kind = "checking";
    }

    function markAccepted() {
      Object.keys(state.accepted).forEach(function (recordKey) {
        state.commands[recordKey] = { status: poll.exhausted ? "unconfirmed" : "pending", event: state.accepted[recordKey].event, message: "" };
      });
    }

    function pageKey() {
      return state.phase + ":" + (state.view ? state.view.kind : "");
    }

    function optionsOf(view) {
      var found = [];
      (view && Array.isArray(view.properties) ? view.properties : []).forEach(function (property) {
        property.options.forEach(function (option) { found.push(option); });
      });
      return found;
    }

    function findOption(id) {
      var wanted = normalizer.positiveInteger(id);
      return optionsOf(state.view).filter(function (option) { return option.id === wanted; })[0] || null;
    }

    function detailField(code) {
      var fields = state.view && state.view.details ? state.view.details.fields : [];
      return fields.filter(function (field) { return field.code === code; })[0] || null;
    }

    function readAll() {
      return adapter.introspect().then(function (rawGrant) {
        var grant = normalizer.grantOf(rawGrant);
        if (!normalizer.canRead(grant, "document")) {
          return { grant: grant, documents: [], orders: [], accounts: [], orderItems: [], productPrices: [], products: [], accountFailed: false };
        }
        var ordersReadable = normalizer.canRead(grant, "order");
        var accountRead = normalizer.canRead(grant, "account")
          ? adapter.list("account").then(function (rows) { return { rows: rows, failed: false }; }, function (error) {
            if (error && error.code === "link-closed") throw error;
            return { rows: [], failed: true };
          })
          : Promise.resolve({ rows: [], failed: false });
        var ordersRead = ordersReadable ? adapter.list("order") : Promise.resolve([]);
        var orderItemsRead = normalizer.canRead(grant, "order-item") ? adapter.list("order-item") : Promise.resolve([]);
        var productPricesRead = normalizer.canRead(grant, "product-price") ? adapter.list("product-price") : Promise.resolve([]);
        var productsRead = normalizer.canRead(grant, "product") ? adapter.list("product") : Promise.resolve([]);
        return Promise.all([adapter.list("document"), accountRead, ordersRead, orderItemsRead, productPricesRead, productsRead]).then(function (parts) {
          var documents = parts[0];
          var orders = parts[2].slice();
          var present = {};
          orders.forEach(function (row) {
            var id = normalizer.positiveInteger(row && row.id);
            if (id) present[id] = true;
          });
          var missing = ordersReadable
            ? (normalizer.packageOrderIds(documents, contract) || []).filter(function (id) { return !present[id]; })
            : [];
          return Promise.all(missing.map(function (id) {
            return adapter.get("order", id).then(function (row) {
              return row && normalizer.positiveInteger(row.id) === id ? row : null;
            }, function (error) {
              if (error && error.code === "link-closed") throw error;
              return null;
            });
          })).then(function (fetched) {
            fetched.forEach(function (row) { if (row) orders.push(row); });
            return {
              grant: grant,
              documents: documents,
              orders: orders,
              accounts: parts[1].rows,
              orderItems: parts[3],
              productPrices: parts[4],
              products: parts[5],
              accountFailed: parts[1].failed,
            };
          });
        });
      });
    }

    function seedDetails() {
      var view = state.view;
      if (!view || view.kind !== "contract-details") return;
      if (state.details.seededFor !== view.agreement.id) {
        var details = emptyDetails(view.agreement.id);
        view.details.fields.forEach(function (field) {
          details.values[field.code] = field.kind === "boolean" ? false : view.details.prefill[field.code] || "";
        });
        state.details = details;
      }
      if (!state.details.returnPending) return;
      state.details.returnPending = false;
      var marked = view.details.returned.fields;
      Object.keys(marked).forEach(function (code) {
        state.details.serverErrors[code] = copy[RETURNED_COPY[marked[code]]] || copy.returnedMissing;
      });
    }

    function prune() {
      var present = {};
      optionsOf(state.view).forEach(function (option) { present[option.id] = option; });
      Object.keys(state.expanded).forEach(function (id) { if (!present[id]) delete state.expanded[id]; });
      var confirm = state.confirm;
      if (!confirm) return;
      if (confirm.kind === "agreement") {
        if (!state.view || !state.view.canApproveAgreement) state.confirm = null;
        return;
      }
      if (!present[confirm.id] || !present[confirm.id].actions[confirm.kind]) state.confirm = null;
    }

    function stopPolling() {
      if (poll.timer !== null) timers.clear(poll.timer);
      poll.timer = null;
    }

    function schedulePoll() {
      stopPolling();
      poll.timer = timers.set(function () {
        poll.timer = null;
        poll.attempt += 1;
        load(Object.assign({ afterCommand: true, quiet: true }, readContext()));
      }, delays[poll.attempt]);
    }

    function track() {
      if (stopped) return;
      if (!waitingNow()) {
        stopPolling();
        poll.attempt = 0;
        poll.exhausted = false;
        return;
      }
      if (poll.exhausted) return;
      if (poll.attempt >= delays.length) {
        poll.exhausted = true;
        return;
      }
      schedulePoll();
    }

    function announces(before, after) {
      if (before.phase !== "ready") return false;
      if (before.pageWaiting !== pageWaitingNow()) return true;
      if (waitingNow() && poll.exhausted && !before.exhausted) return true;
      return (Boolean(after.event) || Boolean(after.quiet)) && before.page !== pageKey();
    }

    function speak(rendered) {
      var message = rendered && rendered.announcement ? rendered.announcement : "";
      if (live && message) live.textContent = message;
    }

    function readContext() {
      var closedAfter = checkingNow() ? "details" : "";
      Object.keys(state.accepted).forEach(function (recordKey) { closedAfter = closedAfter || state.accepted[recordKey].closedAfter; });
      return closedAfter ? { afterCommand: true, closedAfter: closedAfter } : {};
    }

    function load(context) {
      if (!adapter) {
        render();
        return Promise.resolve();
      }
      if (loading) return loading;
      var after = context || {};
      var before = { phase: state.phase, page: pageKey(), pageWaiting: pageWaitingNow(), exhausted: poll.exhausted };
      if (state.phase === "ready" && state.view) state.refreshing = true;
      else state.phase = "loading";
      render();
      loading = readAll().then(function (input) {
        state.view = normalizer.reviewModel(input, { locale: locale, contract: contract });
        state.phase = "ready";
        state.closedAfter = "";
        state.errorAfterCommand = false;
        state.primaryEmail = state.view.primaryEmail || "";
        settleAccepted();
        if (state.view.kind !== "quote-review" || !state.view.allDecided) state.followDecisions = false;
        seedDetails();
        prune();
      }, function (error) {
        var closed = Boolean(error && error.code === "link-closed");
        if (after.quiet && !closed && waitingNow()) return;
        state.view = null;
        state.confirm = null;
        if (closed) {
          state.phase = "link-closed";
          state.closedAfter = after.closedAfter || "";
        } else {
          state.phase = "error";
          state.errorAfterCommand = Boolean(after.afterCommand);
          state.retryContext = { afterCommand: Boolean(after.afterCommand), closedAfter: after.closedAfter || "" };
        }
      }).then(function () {
        state.refreshing = false;
        loading = null;
        track();
        markAccepted();
        var rendered = render();
        if (announces(before, after)) speak(rendered);
      });
      return loading;
    }

    function reload(context) {
      if (loading) return loading.then(function () { return load(context); });
      return load(context);
    }

    function send(recordKey, entity, id, event, metadata, context) {
      if (inflight[recordKey]) return inflight[recordKey];
      if (!adapter || loading || state.phase !== "ready") return Promise.resolve(false);
      var after = context || {};
      state.commands[recordKey] = { status: "pending", event: event, message: "" };
      render();
      var task = adapter.sendEvent(entity, id, event, metadata).then(function () {
        accept(recordKey, entity, id, event, after.closedAfter || "");
        return reload({ afterCommand: true, closedAfter: after.closedAfter || "", event: event }).then(function () {
          if (typeof after.onSuccess === "function") after.onSuccess();
          render();
          return true;
        });
      }, function (error) {
        if (error && error.code === "link-closed") {
          delete state.commands[recordKey];
          state.view = null;
          state.confirm = null;
          state.phase = "link-closed";
          state.closedAfter = "";
        } else {
          var refused = Boolean(error && error.code === "refused");
          state.commands[recordKey] = { status: refused ? "refused" : "failed", event: event, message: refused ? error.serverMessage || "" : "" };
          if (refused && typeof after.onRefusal === "function") after.onRefusal(error);
        }
        render();
        return false;
      }).then(function (result) {
        delete inflight[recordKey];
        return result;
      });
      inflight[recordKey] = task;
      return task;
    }

    function clearOutcome(recordKey) {
      var command = state.commands[recordKey];
      if (command && command.status !== "pending") delete state.commands[recordKey];
    }

    function busy() {
      return Boolean(loading) || state.refreshing || state.phase !== "ready";
    }

    function validateDetail(field, value) {
      var filled = field.kind === "boolean" ? value === true : typeof value === "string" && value.trim() !== "";
      if (!filled) return field.required ? copy.requiredError : "";
      if (field.kind === "email" && !EMAIL.test(value.trim())) return copy.emailError;
      if (field.choices.length && !field.choices.some(function (option) { return option.value === value; })) return copy.requiredError;
      return "";
    }

    function detailsMetadata(fields) {
      var metadata = {};
      fields.forEach(function (field) {
        var value = state.details.values[field.code];
        if (field.kind === "boolean") {
          if (value === true) metadata[field.code] = true;
          return;
        }
        var trimmed = typeof value === "string" ? value.trim() : "";
        if (trimmed) metadata[field.code] = trimmed;
      });
      return metadata;
    }

    function toggleOption(id) {
      var option = findOption(id);
      if (!option) return;
      var opening = !state.expanded[option.id];
      if (opening) state.expanded[option.id] = true;
      else delete state.expanded[option.id];
      if (opening && option.actions.view && !state.commands[option.recordKey] && !state.accepted[option.recordKey] && !busy()) {
        send(option.recordKey, "order", option.id, contract.orderEvents.view.code, {}, {});
        return;
      }
      render();
    }

    function confirmOption(id) {
      var option = findOption(id);
      var confirm = state.confirm;
      if (!option || !confirm || confirm.id !== option.id || !option.actions[confirm.kind] || busy() || state.accepted[option.recordKey]) return;
      var event = contract.orderEvents[confirm.kind];
      var metadata = {};
      if (confirm.kind === "changes") {
        var message = String(state.drafts[option.id] || "").trim();
        if (!message) {
          state.draftInvalid[option.id] = true;
          state.focusKey = "draft-" + option.id;
          render();
          return;
        }
        metadata[event.messageAttribute] = message;
      }
      delete state.draftInvalid[option.id];
      send(option.recordKey, "order", option.id, event.code, metadata, {
        onSuccess: function () {
          if (confirm.kind === "changes") delete state.drafts[option.id];
        },
      });
    }

    function submitDetails() {
      var view = state.view;
      if (!view || view.kind !== "contract-details" || !view.details.available || busy()) return;
      var firstInvalid = "";
      view.details.fields.forEach(function (field) {
        state.details.touched[field.code] = true;
        var message = validateDetail(field, state.details.values[field.code]);
        state.details.errors[field.code] = message;
        if (message && !firstInvalid) firstInvalid = field.code;
      });
      state.details.invalid = Boolean(firstInvalid);
      if (firstInvalid) {
        clearOutcome(view.agreement.recordKey);
        state.focusKey = "field-" + firstInvalid;
        render();
        return;
      }
      state.details.serverErrors = {};
      send(view.agreement.recordKey, "document", view.agreement.id, contract.agreementEvents.details.code, detailsMetadata(view.details.fields), {
        closedAfter: "details",
        onRefusal: function (error) {
          Object.keys(error.fieldErrors || {}).forEach(function (code) {
            if (detailField(code)) state.details.serverErrors[code] = error.fieldErrors[code];
          });
        },
      });
    }

    function dispatch(type, payload) {
      var data = payload || {};
      var option;
      var field;
      var view = state.view;
      switch (type) {
        case "retry":
          load(state.retryContext);
          return;
        case "refresh":
          if (data.recordKey) clearOutcome(data.recordKey);
          reload(readContext());
          return;
        case "option.toggle":
          toggleOption(data.id);
          return;
        case "option.view":
          option = findOption(data.id);
          if (!option || !option.actions.view || busy() || state.accepted[option.recordKey]) return;
          clearOutcome(option.recordKey);
          send(option.recordKey, "order", option.id, contract.orderEvents.view.code, {}, {});
          return;
        case "option.intent":
          option = findOption(data.id);
          if (!option || !option.actions[data.kind] || busy() || inflight[option.recordKey] || state.accepted[option.recordKey]) return;
          clearOutcome(option.recordKey);
          state.confirm = { recordKey: option.recordKey, id: option.id, kind: data.kind };
          state.focusKey = data.kind === "changes" ? "draft-" + option.id : "confirm-" + option.id;
          render();
          return;
        case "option.cancel":
          option = findOption(data.id);
          if (!option || inflight[option.recordKey]) return;
          state.confirm = null;
          delete state.draftInvalid[option.id];
          state.focusKey = "toggle-" + option.id;
          render();
          return;
        case "option.draft":
          state.drafts[data.id] = String(data.value == null ? "" : data.value);
          if (state.draftInvalid[data.id] && state.drafts[data.id].trim()) delete state.draftInvalid[data.id];
          return;
        case "option.confirm":
          confirmOption(data.id);
          return;
        case "details.input":
          field = detailField(data.code);
          if (!field) return "";
          state.details.values[field.code] = String(data.value == null ? "" : data.value);
          delete state.details.serverErrors[field.code];
          if (!state.details.touched[field.code]) return "";
          state.details.errors[field.code] = validateDetail(field, state.details.values[field.code]);
          return state.details.errors[field.code];
        case "details.blur":
          field = detailField(data.code);
          if (!field) return "";
          state.details.touched[field.code] = true;
          state.details.errors[field.code] = validateDetail(field, state.details.values[field.code]);
          return state.details.errors[field.code] || state.details.serverErrors[field.code] || "";
        case "details.choose":
          field = detailField(data.code);
          if (!field) return "";
          state.details.values[field.code] = field.kind === "boolean" ? data.value === true : String(data.value == null ? "" : data.value);
          state.details.touched[field.code] = true;
          state.details.errors[field.code] = validateDetail(field, state.details.values[field.code]);
          delete state.details.serverErrors[field.code];
          return state.details.errors[field.code];
        case "details.submit":
          submitDetails();
          return;
        case "agreement.intent":
          if (!view || !view.canApproveAgreement || busy() || inflight[view.agreement.recordKey] || state.accepted[view.agreement.recordKey]) return;
          clearOutcome(view.agreement.recordKey);
          state.confirm = { recordKey: view.agreement.recordKey, id: view.agreement.id, kind: "agreement" };
          state.focusKey = "confirm-agreement";
          render();
          return;
        case "agreement.cancel":
          if (!view || inflight[view.agreement.recordKey]) return;
          state.confirm = null;
          state.focusKey = "approve-agreement";
          render();
          return;
        case "agreement.confirm":
          if (!view || !view.canApproveAgreement || !state.confirm || state.confirm.kind !== "agreement" || busy() || state.accepted[view.agreement.recordKey]) return;
          send(view.agreement.recordKey, "document", view.agreement.id, contract.agreementEvents.approve.code, {}, { closedAfter: "approval" });
          return;
        default:
          return;
      }
    }

    function snapshot() {
      return {
        phase: state.phase,
        view: state.view,
        closedAfter: state.closedAfter,
        errorAfterCommand: state.errorAfterCommand,
        refreshing: state.refreshing,
        expanded: state.expanded,
        confirm: state.confirm,
        drafts: state.drafts,
        draftInvalid: state.draftInvalid,
        commands: state.commands,
        details: state.details,
        waiting: { exhausted: poll.exhausted, decisions: state.followDecisions },
        portalUrl: portalUrl,
        primaryEmail: state.primaryEmail,
        pending: Object.keys(inflight),
      };
    }

    function render() {
      if (stopped) return null;
      var rendered = null;
      if (mount && ns.components) {
        rendered = ns.components.renderPage(mount, snapshot(), dispatch, copy);
        var key = state.focusKey;
        state.focusKey = "";
        var target = key && rendered && rendered.focus ? rendered.focus[key] : null;
        if (target && typeof target.focus === "function") target.focus();
      }
      var current = snapshot();
      listeners.forEach(function (listener) { listener(current); });
      return rendered;
    }

    function stop() {
      stopped = true;
      stopPolling();
    }

    function idle() {
      var waiting = Object.keys(inflight).map(function (key) { return inflight[key]; });
      if (loading) waiting.push(loading);
      if (!waiting.length) return Promise.resolve();
      return Promise.all(waiting).then(idle);
    }

    function start() {
      if (adapter) load({});
      else render();
      return controller;
    }

    var controller = {
      start: start,
      stop: stop,
      dispatch: dispatch,
      reload: reload,
      idle: idle,
      snapshot: snapshot,
      copy: copy,
      subscribe: function (listener) {
        if (typeof listener === "function") listeners.push(listener);
      },
    };
    return controller;
  }

  function kebab(key) {
    return key.replace(/[A-Z]/g, function (character) { return "-" + character.toLowerCase(); });
  }

  function copyFromAttributes(section) {
    var overrides = {};
    ns.copyEntries.forEach(function (entry) {
      var value = section.getAttribute("data-copy-" + kebab(entry[1]));
      if (typeof value === "string" && value.trim() && !/^\$\{/.test(value.trim())) overrides[entry[1]] = value;
    });
    return overrides;
  }

  function displayLocale(environment) {
    var navigatorRef = environment.navigator || global.navigator;
    var language = navigatorRef && typeof navigatorRef.language === "string" ? navigatorRef.language : "";
    try {
      return (language && Intl.NumberFormat.supportedLocalesOf([language])[0]) || "en";
    } catch (_) {
      return "en";
    }
  }

  function boot(section, environment) {
    var env = environment || {};
    if (!section || typeof section.getAttribute !== "function") return null;
    var mount = env.mount || (typeof section.querySelector === "function" && section.querySelector("[data-client-review-mount]")) || section;
    var dataMode = String(section.getAttribute("data-review-data-mode") || "").trim().toLowerCase() === "fixture" ? "fixture" : "live";
    var options = {
      mount: mount,
      live: env.live || (typeof section.querySelector === "function" && section.querySelector("[data-client-review-live]")) || null,
      timers: env.timers,
      portalUrl: section.getAttribute("data-review-portal-url"),
      copy: copyFromAttributes(section),
      locale: env.locale || displayLocale(env),
    };
    var steps = [];
    if (dataMode === "fixture") {
      var setup = ns.fixtures && typeof ns.fixtures.setup === "function" ? ns.fixtures.setup(env.scenario) : null;
      if (!setup) {
        options.phase = "unconfigured";
      } else {
        options.adapter = setup.adapter || null;
        if (setup.phase) options.phase = setup.phase;
        if (setup.portalUrl) options.portalUrl = setup.portalUrl;
        if (setup.pollDelays) options.pollDelays = setup.pollDelays;
        steps = setup.steps || [];
      }
    } else {
      var apiBase = ns.adapter.safeApiBase(section.getAttribute("data-review-api-base"));
      var locationRef = env.location || global.location || {};
      var token = ns.adapter.tokenFromFragment(locationRef.hash);
      if (!apiBase) options.phase = "unconfigured";
      else if (!token) options.phase = "link-missing";
      else options.adapter = ns.adapter.createGrantAdapter({ apiBase: apiBase, token: token, fetch: env.fetch });
    }
    var controller = createController(options);
    controller.dataMode = dataMode;
    controller.steps = steps;
    controller.start();
    return controller;
  }

  ns.createController = createController;
  ns.checkingDelays = Object.freeze(CHECKING_DELAYS.slice());
  ns.boot = boot;
})(typeof window !== "undefined" ? window : globalThis);

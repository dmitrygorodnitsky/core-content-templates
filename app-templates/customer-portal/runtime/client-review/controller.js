(function (global) {
  "use strict";

  var ns = global.ClientReview || (global.ClientReview = {});

  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function createController(options) {
    var settings = options || {};
    var adapter = settings.adapter || null;
    var copy = ns.withDefaults(settings.copy);
    var locale = settings.locale || "en";
    var mount = settings.mount || null;
    var contract = ns.contract;
    var normalizer = ns.normalizer;
    var inflight = {};
    var loading = null;
    var listeners = [];
    var state = {
      phase: settings.phase || "loading",
      view: null,
      closedAfter: "",
      errorAfterCommand: false,
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
      return { seededFor: agreementId, values: {}, errors: {}, touched: {}, serverErrors: {}, invalid: false };
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
          return { grant: grant, documents: [], orders: [], accounts: [], accountFailed: false };
        }
        var ordersReadable = normalizer.canRead(grant, "order");
        var accountRead = normalizer.canRead(grant, "account")
          ? adapter.list("account").then(function (rows) { return { rows: rows, failed: false }; }, function (error) {
            if (error && error.code === "link-closed") throw error;
            return { rows: [], failed: true };
          })
          : Promise.resolve({ rows: [], failed: false });
        var ordersRead = ordersReadable ? adapter.list("order") : Promise.resolve([]);
        return Promise.all([adapter.list("document"), accountRead, ordersRead]).then(function (parts) {
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
              accountFailed: parts[1].failed,
            };
          });
        });
      });
    }

    function seedDetails() {
      var view = state.view;
      if (!view || view.kind !== "contract-details" || state.details.seededFor === view.agreement.id) return;
      var details = emptyDetails(view.agreement.id);
      view.details.fields.forEach(function (field) {
        details.values[field.code] = field.kind === "boolean" ? false : view.details.prefill[field.code] || "";
      });
      state.details = details;
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

    function load(context) {
      if (!adapter) {
        render();
        return Promise.resolve();
      }
      if (loading) return loading;
      var after = context || {};
      if (state.phase === "ready" && state.view) state.refreshing = true;
      else state.phase = "loading";
      render();
      loading = readAll().then(function (input) {
        state.view = normalizer.reviewModel(input, { locale: locale, contract: contract });
        state.phase = "ready";
        state.closedAfter = "";
        state.errorAfterCommand = false;
        seedDetails();
        prune();
      }, function (error) {
        state.view = null;
        state.confirm = null;
        if (error && error.code === "link-closed") {
          state.phase = "link-closed";
          state.closedAfter = after.closedAfter || "";
        } else {
          state.phase = "error";
          state.errorAfterCommand = Boolean(after.afterCommand);
        }
      }).then(function () {
        state.refreshing = false;
        loading = null;
        render();
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
        return reload({ afterCommand: true, closedAfter: after.closedAfter || "" }).then(function () {
          delete state.commands[recordKey];
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
      if (opening && option.actions.view && !state.commands[option.recordKey] && !busy()) {
        send(option.recordKey, "order", option.id, contract.orderEvents.view.code, {}, {});
        return;
      }
      render();
    }

    function confirmOption(id) {
      var option = findOption(id);
      var confirm = state.confirm;
      if (!option || !confirm || confirm.id !== option.id || !option.actions[confirm.kind] || busy()) return;
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
          load({});
          return;
        case "refresh":
          if (data.recordKey) clearOutcome(data.recordKey);
          reload({});
          return;
        case "option.toggle":
          toggleOption(data.id);
          return;
        case "option.view":
          option = findOption(data.id);
          if (!option || !option.actions.view || busy()) return;
          clearOutcome(option.recordKey);
          send(option.recordKey, "order", option.id, contract.orderEvents.view.code, {}, {});
          return;
        case "option.intent":
          option = findOption(data.id);
          if (!option || !option.actions[data.kind] || busy() || inflight[option.recordKey]) return;
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
          if (!view || !view.canApproveAgreement || busy() || inflight[view.agreement.recordKey]) return;
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
          if (!view || !view.canApproveAgreement || !state.confirm || state.confirm.kind !== "agreement" || busy()) return;
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
        pending: Object.keys(inflight),
      };
    }

    function render() {
      if (mount && ns.components) {
        var rendered = ns.components.renderPage(mount, snapshot(), dispatch, copy);
        var key = state.focusKey;
        state.focusKey = "";
        var target = key && rendered && rendered.focus ? rendered.focus[key] : null;
        if (target && typeof target.focus === "function") target.focus();
      }
      var current = snapshot();
      listeners.forEach(function (listener) { listener(current); });
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
    var options = { mount: mount, copy: copyFromAttributes(section), locale: env.locale || displayLocale(env) };
    var steps = [];
    if (dataMode === "fixture") {
      var setup = ns.fixtures && typeof ns.fixtures.setup === "function" ? ns.fixtures.setup(env.scenario) : null;
      if (!setup) {
        options.phase = "unconfigured";
      } else {
        options.adapter = setup.adapter || null;
        if (setup.phase) options.phase = setup.phase;
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
  ns.boot = boot;
})(typeof window !== "undefined" ? window : globalThis);

(function (global) {
  "use strict";

  var ns = global.ClientReview || (global.ClientReview = {});

  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var CHECKING_DELAYS = [2000, 3000, 5000, 8000, 12000, 15000, 15000, 15000];
  var LINK_STEPS = { "quote-review": true, "agreement-review": true };

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
    var pageLink = settings.pageLink || "";
    var clipboard = settings.clipboard || null;
    var maps = settings.maps || null;
    var contract = ns.contract;
    var normalizer = ns.normalizer;
    var inflight = {};
    var planReads = {};
    var loading = null;
    var copying = null;
    var exporting = null;
    var submitting = null;
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
      contact: null,
      logoUrl: "",
      followDecisions: false,
      followClosedAfter: "",
      accepted: {},
      refreshing: false,
      expanded: {},
      bulk: "",
      confirm: null,
      choices: {},
      drafts: {},
      draftInvalid: {},
      billing: { same: true, value: "", invalid: false, refused: false },
      commands: {},
      details: emptyDetails(null),
      plans: {},
      link: "",
      pdf: "",
      focusKey: "",
    };

    function emptyDetails(seededFor) {
      return { seededFor: seededFor, values: {}, errors: {}, touched: {}, serverErrors: {}, invalid: false };
    }

    function followingNow() {
      return state.phase === "ready" && state.followDecisions && Boolean(state.view) && state.view.kind === "quote-review" && state.view.allDecided;
    }

    function roundRecordedNow() {
      return state.phase === "ready" && Boolean(state.view) && state.view.kind === "quote-review" && state.view.allDecided;
    }

    function pageWaitingNow() {
      return followingNow();
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
      state.accepted[recordKey] = {
        entity: entity,
        id: id,
        event: event,
        source: eventSource(event),
        closedAfter: closedAfter,
      };
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
      return current !== expectation.source;
    }

    function settleAccepted() {
      Object.keys(state.accepted).forEach(function (recordKey) {
        var expectation = state.accepted[recordKey];
        if (!landed(expectation, state.view)) return;
        delete state.accepted[recordKey];
        delete state.commands[recordKey];
        if (expectation.event === contract.orderEvents.approve.code || expectation.event === contract.orderEvents.decline.code) state.followDecisions = true;
        if (expectation.event === contract.agreementEvents.changes.code) {
          delete state.drafts.agreement;
          state.focusKey = "page-title";
        }
      });
    }

    function markAccepted() {
      Object.keys(state.accepted).forEach(function (recordKey) {
        var expectation = state.accepted[recordKey];
        if (poll.exhausted && expectation.event === contract.agreementEvents.approve.code) {
          delete state.accepted[recordKey];
          state.commands[recordKey] = { status: "refused", event: expectation.event, message: "" };
          state.billing.refused = true;
          state.billing.same = false;
          return;
        }
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

    function findProperty(key) {
      var properties = state.view && Array.isArray(state.view.properties) ? state.view.properties : [];
      return properties.filter(function (property) { return property.key === key; })[0] || null;
    }

    function propertyOfOption(id) {
      var properties = state.view && Array.isArray(state.view.properties) ? state.view.properties : [];
      return properties.filter(function (property) {
        return property.options.some(function (option) { return option.id === id; });
      })[0] || null;
    }

    function declinableOptions(property) {
      return property.options.filter(function (option) {
        return option.actions.decline && !state.accepted[option.recordKey] && !inflight[option.recordKey];
      });
    }

    function choiceEntries() {
      var properties = state.view && state.view.kind === "quote-review" ? state.view.properties : [];
      return properties.filter(function (property) { return Boolean(state.choices[property.key]); }).map(function (property) {
        var choice = state.choices[property.key];
        var option = choice.kind === "approve" ? property.options.filter(function (candidate) { return candidate.id === choice.id; })[0] || null : null;
        return { property: property, kind: choice.kind, option: option };
      });
    }

    function approving() {
      return choiceEntries().some(function (entry) { return entry.kind === "approve"; });
    }

    function chosenAddresses() {
      var found = [];
      choiceEntries().forEach(function (entry) {
        var address = entry.property.address;
        if (entry.kind === "approve" && address && found.indexOf(address) === -1) found.push(address);
      });
      return found;
    }

    function addressDetailField() {
      var fields = state.view && state.view.details ? state.view.details.fields : [];
      return fields.filter(function (field) { return field.kind === "address"; })[0] || null;
    }

    function detailField(code) {
      var fields = state.view && state.view.details ? state.view.details.fields : [];
      return fields.filter(function (field) { return field.code === code; })[0] || null;
    }

    function readProperties() {
      if (typeof adapter.introspectProperties !== "function") return Promise.resolve([]);
      return Promise.resolve().then(function () { return adapter.introspectProperties(); }).then(function (rawGrant) {
        return normalizer.canRead(normalizer.grantOf(rawGrant), "resource") ? adapter.list("resource") : [];
      }).then(function (rows) {
        return Array.isArray(rows) ? rows : [];
      }, function () {
        return [];
      });
    }

    function readAddresses(grant) {
      if (!normalizer.canRead(grant, "address")) return Promise.resolve([]);
      return Promise.resolve().then(function () { return adapter.list("address"); }).then(function (rows) {
        return Array.isArray(rows) ? rows : [];
      }, function () {
        return [];
      });
    }

    function readUnits(grant) {
      var entity = contract.priceVariants.unitEntity;
      if (!normalizer.canRead(grant, entity)) return Promise.resolve([]);
      return Promise.resolve().then(function () { return adapter.list(entity); }).then(function (rows) {
        return Array.isArray(rows) ? rows : [];
      }, function () {
        return [];
      });
    }

    function readContents(grant) {
      var entity = contract.agreementContent.entity;
      if (!normalizer.canRead(grant, entity)) return Promise.resolve([]);
      return Promise.resolve().then(function () { return adapter.list(entity); }).then(function (rows) {
        return Array.isArray(rows) ? rows : [];
      }, function () {
        return [];
      });
    }

    function readAll() {
      return adapter.introspect().then(function (rawGrant) {
        var grant = normalizer.grantOf(rawGrant);
        var ordersReadable = normalizer.canRead(grant, "order");
        var documentsReadable = normalizer.canRead(grant, "document");
        if (!ordersReadable && !documentsReadable) {
          return { grant: grant, documents: [], orders: [], accounts: [], orderItems: [], productPrices: [], products: [], resources: [], addresses: [], units: [], contents: [], accountFailed: false };
        }
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
        var documentsRead = documentsReadable ? adapter.list("document") : Promise.resolve([]);
        return Promise.all([documentsRead, accountRead, ordersRead, orderItemsRead, productPricesRead, productsRead, readProperties(), readAddresses(grant), readUnits(grant), readContents(grant)]).then(function (parts) {
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
              resources: parts[6],
              addresses: parts[7],
              units: parts[8],
              contents: parts[9],
              accountFailed: parts[1].failed,
            };
          });
        });
      });
    }

    function seedDetails() {
      var view = state.view;
      if (!view || view.kind !== "quote-review" || !view.details.available || state.details.seededFor === "round") return;
      var details = emptyDetails("round");
      view.details.fields.forEach(function (field) {
        details.values[field.code] = field.kind === "boolean" ? false : view.details.prefill[field.code] || "";
      });
      state.details = details;
    }

    function readPlans() {
      var view = state.view;
      if (!adapter || typeof adapter.readPlan !== "function" || !view || !Array.isArray(view.properties)) return;
      view.properties.forEach(function (property) {
        var id = property.plan;
        if (!id || state.plans[id] || planReads[id]) return;
        state.plans[id] = { status: "loading", plan: null };
        planReads[id] = Promise.resolve().then(function () { return adapter.readPlan(id); }).then(function (raw) {
          var plan = ns.plan ? ns.plan.parse(raw, locale) : null;
          state.plans[id] = plan ? { status: "ready", plan: plan } : { status: "unavailable", plan: null };
        }, function () {
          state.plans[id] = { status: "unavailable", plan: null };
        }).then(function () {
          delete planReads[id];
          render();
        });
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
      if (confirm.kind === "agreement-changes") {
        if (!state.view || !state.view.canRequestAgreementChanges) state.confirm = null;
        return;
      }
      if (!present[confirm.id] || !present[confirm.id].actions[confirm.kind]) state.confirm = null;
    }

    function pruneChoices() {
      if (state.bulk) return;
      Object.keys(state.choices).forEach(function (key) {
        var property = findProperty(key);
        var choice = state.choices[key];
        var option = property && choice.kind === "approve" ? property.options.filter(function (candidate) { return candidate.id === choice.id; })[0] : null;
        var standing = choice.kind === "approve" ? Boolean(option && option.actions.approve) : Boolean(property && declinableOptions(property).length);
        if (!standing) delete state.choices[key];
      });
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
      if (Boolean(after.event) && !before.recorded && roundRecordedNow()) return true;
      return (Boolean(after.event) || Boolean(after.quiet)) && before.page !== pageKey();
    }

    function speak(rendered) {
      var message = rendered && rendered.announcement ? rendered.announcement : "";
      if (live && message) live.textContent = message;
    }

    function readContext() {
      var closedAfter = followingNow() ? state.followClosedAfter : "";
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
      var before = { phase: state.phase, page: pageKey(), pageWaiting: pageWaitingNow(), exhausted: poll.exhausted, recorded: roundRecordedNow() };
      if (state.phase === "ready" && state.view) state.refreshing = true;
      else state.phase = "loading";
      render();
      loading = readAll().then(function (input) {
        if (normalizer.requestLocale) locale = normalizer.requestLocale(input, locale, contract);
        state.view = normalizer.reviewModel(input, { locale: locale, contract: contract });
        state.phase = "ready";
        state.closedAfter = "";
        state.errorAfterCommand = false;
        state.primaryEmail = state.view.primaryEmail || "";
        state.contact = state.view.contact || null;
        state.logoUrl = state.view.parties && typeof adapter.imageUrl === "function" ? adapter.imageUrl(state.view.parties.provider.logo) : "";
        settleAccepted();
        if (state.view.kind !== "quote-review" || !state.view.allDecided) state.followDecisions = false;
        seedDetails();
        prune();
        pruneChoices();
        readPlans();
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
        if (before.page !== pageKey()) state.link = "";
        state.pdf = "";
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

    function billingAddress() {
      var typed = state.billing.value.replace(/\s+/g, " ").trim();
      return typed.length > contract.agreementEvents.approve.billingAddressLimit ? "" : typed;
    }

    function billingInput() {
      var approve = contract.agreementEvents.approve;
      var input = {};
      if (state.billing.same) {
        input[approve.billingSameAsLegalAttribute] = { value: true };
        return input;
      }
      var typed = billingAddress();
      if (!typed) return null;
      input[approve.billingAddressAttribute] = { value: typed };
      return input;
    }

    function validateDetail(field, value) {
      var filled = field.kind === "boolean" ? value === true : typeof value === "string" && value.trim() !== "";
      if (!filled) return field.required || field.askedFirst ? copy.requiredError : "";
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
      if (opening) {
        var property = propertyOfOption(option.id);
        (property ? property.options : []).forEach(function (sibling) {
          if (sibling.id !== option.id) delete state.expanded[sibling.id];
        });
        var confirm = state.confirm;
        if (confirm && confirm.kind !== "agreement" && confirm.kind !== "agreement-changes" && confirm.id !== option.id && property
          && property.options.some(function (sibling) { return sibling.id === confirm.id; }) && !inflight[confirm.recordKey]) {
          state.confirm = null;
        }
        state.expanded[option.id] = true;
      } else {
        delete state.expanded[option.id];
      }
      render();
    }

    function confirmOption(id) {
      var option = findOption(id);
      var confirm = state.confirm;
      if (!option || !confirm || confirm.id !== option.id || confirm.kind !== "changes" || !option.actions.changes || busy() || state.accepted[option.recordKey]) return;
      var event = contract.orderEvents.changes;
      var message = String(state.drafts[option.id] || "").trim();
      if (!message) {
        state.draftInvalid[option.id] = true;
        state.focusKey = "draft-" + option.id;
        render();
        return;
      }
      var metadata = {};
      metadata[event.messageAttribute] = message;
      delete state.draftInvalid[option.id];
      send(option.recordKey, "order", option.id, event.code, metadata, {
        onSuccess: function () { delete state.drafts[option.id]; },
      });
    }

    function chooseOption(id) {
      var option = findOption(id);
      var property = option ? propertyOfOption(option.id) : null;
      if (!option || !property || !option.actions.approve || busy() || state.bulk || inflight[option.recordKey] || state.accepted[option.recordKey]) return;
      clearOutcome(option.recordKey);
      if (state.confirm && state.confirm.id === option.id) state.confirm = null;
      state.choices[property.key] = { kind: "approve", id: option.id };
      state.focusKey = "choice-" + property.key;
      readPlans();
      render();
    }

    function declineProperty(key) {
      var property = findProperty(key);
      if (!property || !declinableOptions(property).length || busy() || state.bulk) return;
      if (property.options.some(function (option) { return state.accepted[option.recordKey] || inflight[option.recordKey]; })) return;
      state.choices[key] = { kind: "decline" };
      state.focusKey = "choice-" + key;
      render();
    }

    function clearChoice(key) {
      if (!state.choices[key] || state.bulk) return;
      var choice = state.choices[key];
      delete state.choices[key];
      state.focusKey = choice.kind === "approve" ? "toggle-" + choice.id : "decline-" + key;
      render();
    }

    function decideOption(id, kind, metadata, closedAfter) {
      var option = findOption(id);
      var target = kind === "approve" ? "approved" : "declined";
      if (!option) return Promise.resolve(false);
      if (option.status === target) return Promise.resolve(true);
      if (state.accepted[option.recordKey] || inflight[option.recordKey]) return Promise.resolve(false);
      var context = { closedAfter: closedAfter };
      if (!option.actions[kind]) return Promise.resolve(false);
      return send(option.recordKey, "order", option.id, contract.orderEvents[kind].code, metadata, Object.assign({
        onRefusal: function (error) {
          if (kind !== "approve") return;
          var addressField = addressDetailField();
          Object.keys(error.fieldErrors || {}).forEach(function (code) {
            var target = detailField(code) ? code : /ADDRESS$/.test(code) && addressField ? addressField.code : "";
            if (target && !state.details.serverErrors[target]) state.details.serverErrors[target] = error.fieldErrors[code];
          });
          var legalField = detailField("LEGAL_ADDRESS");
          if (legalField && !state.details.serverErrors[legalField.code] && /legal address/i.test(error.serverMessage || "")) state.details.serverErrors[legalField.code] = copy.legalAddressRefused;
        },
      }, context));
    }

    function checkDetails() {
      var fields = state.view.details.fields;
      var firstInvalid = "";
      fields.forEach(function (field) {
        state.details.touched[field.code] = true;
        var message = validateDetail(field, state.details.values[field.code]);
        state.details.errors[field.code] = message;
        if (message && !firstInvalid) firstInvalid = field.code;
      });
      state.details.invalid = Boolean(firstInvalid);
      return firstInvalid;
    }

    function submitChoices() {
      var view = state.view;
      var entries = choiceEntries();
      if (!view || view.kind !== "quote-review" || !entries.length || busy() || state.bulk) return Promise.resolve(false);
      var withApproval = approving();
      var metadata = {};
      if (withApproval) {
        if (!view.details.available) return Promise.resolve(false);
        var firstInvalid = checkDetails();
        if (firstInvalid) {
          state.focusKey = "field-" + firstInvalid;
          render();
          return Promise.resolve(false);
        }
        state.details.serverErrors = {};
        metadata = detailsMetadata(view.details.fields);
      }
      var closedAfter = withApproval || view.summary.approved > 0 ? "details" : "declined";
      var steps = [];
      entries.forEach(function (entry) {
        if (entry.kind === "approve") steps.push({ id: entry.option.id, kind: "approve", metadata: metadata, key: entry.property.key });
        else declinableOptions(entry.property).forEach(function (option) { steps.push({ id: option.id, kind: "decline", metadata: {}, key: entry.property.key }); });
      });
      var landedAny = false;
      state.bulk = "choices";
      state.followClosedAfter = closedAfter;
      render();
      function stepFrom(index) {
        if (index >= steps.length) return Promise.resolve(true);
        var step = steps[index];
        return decideOption(step.id, step.kind, step.metadata, closedAfter).then(function (ok) {
          if (!ok) return false;
          landedAny = true;
          if (!steps.slice(index + 1).some(function (later) { return later.key === step.key; })) delete state.choices[step.key];
          return stepFrom(index + 1);
        });
      }
      submitting = stepFrom(0).then(function (ok) {
        submitting = null;
        state.bulk = "";
        if (state.phase === "link-closed" && landedAny && !state.closedAfter) state.closedAfter = closedAfter;
        if (state.phase === "ready") {
          pruneChoices();
          state.focusKey = ok ? "page-title" : "choices-title";
        }
        track();
        render();
        return ok;
      });
      return submitting;
    }

    function requestAgreementChanges() {
      var view = state.view;
      var confirm = state.confirm;
      if (!view || !view.canRequestAgreementChanges || !confirm || confirm.kind !== "agreement-changes" || busy() || state.accepted[view.agreement.recordKey]) return;
      var event = contract.agreementEvents.changes;
      var message = String(state.drafts.agreement || "").trim();
      if (!message) {
        state.draftInvalid.agreement = true;
        state.focusKey = "draft-agreement";
        render();
        return;
      }
      delete state.draftInvalid.agreement;
      var metadata = {};
      metadata[event.messageAttribute] = message;
      send(view.agreement.recordKey, "document", view.agreement.id, event.code, metadata, {
        onSuccess: function () {
          if (!state.accepted[view.agreement.recordKey]) state.focusKey = "page-title";
        },
      });
    }

    function writeToClipboard(value) {
      try {
        return Promise.resolve(clipboard.writeText(value));
      } catch (error) {
        return Promise.reject(error);
      }
    }

    function linkOffered() {
      return Boolean(pageLink) && Boolean(state.view) && LINK_STEPS[state.view.kind] === true;
    }

    function copyLink() {
      if (copying) return copying;
      if (!linkOffered()) return Promise.resolve(false);
      copying = writeToClipboard(pageLink).then(function () { return true; }, function () { return false; }).then(function (copied) {
        copying = null;
        state.link = copied ? "copied" : "failed";
        state.focusKey = "link-copy";
        var rendered = render();
        if (live && rendered && rendered.linkStatus) live.textContent = rendered.linkStatus;
        return copied;
      });
      return copying;
    }

    function downloadPdf() {
      if (exporting || busy() || !ns.pdf || !ns.pdf.available(snapshot()) || !state.view.agreement) return;
      var current = state.view;
      var input = { phase: state.phase, view: JSON.parse(JSON.stringify(current)), contact: state.contact, logoUrl: state.logoUrl };
      state.pdf = "pending";
      render();
      var create = settings.pdfFactory || ns.pdf.create;
      var save = settings.pdfSave || ns.pdf.save;
      exporting = Promise.resolve().then(function () { return create(input, copy, locale); }).then(function (result) {
        if (stopped || state.phase !== "ready" || state.view !== current || !ns.pdf.available(snapshot())) throw new Error("The displayed document changed");
        save(result);
        state.pdf = "downloaded";
      }, function () { state.pdf = "failed"; }).catch(function () { state.pdf = "failed"; }).then(function () {
        exporting = null;
        if (stopped) return;
        state.focusKey = "pdf-download";
        var rendered = render();
        if (live && rendered && rendered.pdfStatus) live.textContent = rendered.pdfStatus;
      });
      return exporting;
    }

    function dispatch(type, payload) {
      var data = payload || {};
      var option;
      var field;
      var view = state.view;
      switch (type) {
        case "pdf.download":
          downloadPdf();
          return;
        case "retry":
          load(state.retryContext);
          return;
        case "refresh":
          if (data.recordKey) clearOutcome(data.recordKey);
          reload(readContext());
          return;
        case "link.copy":
          copyLink();
          return;
        case "option.toggle":
          toggleOption(data.id);
          return;
        case "option.intent":
          option = findOption(data.id);
          if (data.kind !== "changes" || !option || !option.actions.changes || busy() || inflight[option.recordKey] || state.accepted[option.recordKey]) return;
          clearOutcome(option.recordKey);
          state.confirm = { recordKey: option.recordKey, id: option.id, kind: data.kind };
          state.focusKey = "draft-" + option.id;
          render();
          return;
        case "option.choose":
          chooseOption(data.id);
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
        case "property.decline":
          declineProperty(data.key);
          return;
        case "choice.clear":
          clearChoice(data.key);
          return;
        case "choices.submit":
          submitChoices();
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
        case "details.useAddress":
          field = detailField(data.code);
          if (!field || field.kind !== "address" || !view || !view.details.available || busy()) return;
          if (chosenAddresses().indexOf(data.value) === -1) return;
          state.details.values[field.code] = data.value;
          state.details.touched[field.code] = true;
          state.details.errors[field.code] = validateDetail(field, data.value);
          delete state.details.serverErrors[field.code];
          state.focusKey = "field-" + field.code;
          render();
          return;
        case "agreement.intent":
          if (!view || !view.canApproveAgreement || busy() || inflight[view.agreement.recordKey] || state.accepted[view.agreement.recordKey]) return;
          clearOutcome(view.agreement.recordKey);
          state.confirm = { recordKey: view.agreement.recordKey, id: view.agreement.id, kind: "agreement" };
          state.focusKey = "confirm-agreement";
          render();
          return;
        case "agreement.cancel":
          if (!view || !view.agreement || inflight[view.agreement.recordKey]) return;
          state.focusKey = state.confirm && state.confirm.kind === "agreement-changes" ? "agreement-changes" : "approve-agreement";
          state.confirm = null;
          delete state.draftInvalid.agreement;
          render();
          return;
        case "agreement.changes":
          if (!view || !view.canRequestAgreementChanges || busy() || inflight[view.agreement.recordKey] || state.accepted[view.agreement.recordKey]) return;
          clearOutcome(view.agreement.recordKey);
          state.confirm = { recordKey: view.agreement.recordKey, id: view.agreement.id, kind: "agreement-changes" };
          state.focusKey = "draft-agreement";
          render();
          return;
        case "agreement.draft":
          state.drafts.agreement = String(data.value == null ? "" : data.value);
          if (state.draftInvalid.agreement && state.drafts.agreement.trim()) delete state.draftInvalid.agreement;
          return;
        case "agreement.changes.send":
          requestAgreementChanges();
          return;
        case "agreement.billing.same":
          state.billing.same = data.value === true;
          state.billing.invalid = false;
          state.focusKey = state.billing.same ? "billing-same" : "billing-address";
          render();
          return;
        case "agreement.billing.value":
          state.billing.value = String(data.value == null ? "" : data.value);
          if (state.billing.invalid && billingAddress()) state.billing.invalid = false;
          return;
        case "agreement.confirm":
          if (!view || !view.canApproveAgreement || !state.confirm || state.confirm.kind !== "agreement" || busy() || state.accepted[view.agreement.recordKey]) return;
          var billing = billingInput();
          if (!billing) {
            state.billing.invalid = true;
            state.focusKey = "billing-address";
            render();
            return;
          }
          send(view.agreement.recordKey, "document", view.agreement.id, contract.agreementEvents.approve.code, billing, { closedAfter: "approval" });
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
        bulk: state.bulk,
        confirm: state.confirm,
        choices: state.choices,
        drafts: state.drafts,
        draftInvalid: state.draftInvalid,
        billing: state.billing,
        commands: state.commands,
        details: state.details,
        plans: state.plans,
        maps: Boolean(maps),
        waiting: { exhausted: poll.exhausted, decisions: state.followDecisions },
        portalUrl: portalUrl,
        link: { available: linkOffered(), status: state.link },
        primaryEmail: state.primaryEmail,
        contact: state.contact,
        logoUrl: state.logoUrl,
        pdf: { status: state.pdf },
        pending: Object.keys(inflight),
      };
    }

    function render() {
      if (stopped) return null;
      var rendered = null;
      if (mount && ns.components) {
        rendered = ns.components.renderPage(mount, snapshot(), dispatch, copy, { maps: maps });
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
      Object.keys(planReads).forEach(function (id) { waiting.push(planReads[id]); });
      if (maps && typeof maps.idle === "function") {
        var drawing = maps.idle();
        if (drawing) waiting.push(drawing);
      }
      if (loading) waiting.push(loading);
      if (copying) waiting.push(copying);
      if (exporting) waiting.push(exporting);
      if (submitting) waiting.push(submitting);
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
    var locationRef = env.location || global.location || {};
    var navigatorRef = env.navigator || global.navigator || {};
    var options = {
      mount: mount,
      live: env.live || (typeof section.querySelector === "function" && section.querySelector("[data-client-review-live]")) || null,
      timers: env.timers,
      portalUrl: section.getAttribute("data-review-portal-url"),
      pageLink: locationRef.href,
      clipboard: navigatorRef.clipboard,
      copy: copyFromAttributes(section),
      locale: env.locale || displayLocale(env),
    };
    var steps = [];
    var mapsCopy = ns.withDefaults(options.copy);
    if (dataMode === "fixture") {
      var setup = ns.fixtures && typeof ns.fixtures.setup === "function" ? ns.fixtures.setup(env.scenario) : null;
      if (!setup) {
        options.phase = "unconfigured";
      } else {
        options.adapter = setup.adapter || null;
        if (setup.loadMaps && ns.maps) options.maps = ns.maps.service({ load: setup.loadMaps, copy: mapsCopy, suggestionDelay: env.suggestionDelay });
        if (setup.phase) options.phase = setup.phase;
        if (setup.portalUrl) options.portalUrl = setup.portalUrl;
        if (setup.pollDelays) options.pollDelays = setup.pollDelays;
        if (setup.clipboard) options.clipboard = setup.clipboard;
        steps = setup.steps || [];
      }
    } else {
      var apiBase = ns.adapter.safeApiBase(section.getAttribute("data-review-api-base"));
      var token = ns.adapter.tokenFromFragment(locationRef.hash);
      if (!apiBase) options.phase = "unconfigured";
      else if (!token) options.phase = "link-missing";
      else options.adapter = ns.adapter.createGrantAdapter({ apiBase: apiBase, token: token, propertyToken: ns.adapter.propertyTokenFromFragment(locationRef.hash), fetch: env.fetch });
      var mapsKey = ns.maps ? ns.maps.keyOf(section.getAttribute("data-review-maps-api-key")) : "";
      if (options.adapter && mapsKey) {
        options.maps = ns.maps.service({
          key: mapsKey,
          load: env.loadMaps,
          copy: mapsCopy,
          suggestionDelay: env.suggestionDelay,
        });
      }
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

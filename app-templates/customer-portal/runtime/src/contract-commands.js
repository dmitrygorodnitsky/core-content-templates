import { findAgreement, findQuote } from "./normalizers/contracts.js";
import { latestStateCode } from "./normalizers/core-record.js";

export var CONTRACT_EVENTS = Object.freeze({
  view: Object.freeze({ entity: "order", source: "QUOTE_SENT", code: "QUOTE_SENT-QUOTE_VIEWED" }),
  approve: Object.freeze({ entity: "order", source: "QUOTE_VIEWED", code: "QUOTE_VIEWED-CLIENT_APPROVED" }),
  decline: Object.freeze({ entity: "order", source: "QUOTE_VIEWED", code: "QUOTE_VIEWED-DECLINED" }),
  agreement: Object.freeze({ entity: "document", source: "SENT_TO_CLIENT", code: "SENT_TO_CLIENT-CLIENT_APPROVED" }),
});

var CONFIRMED_TOAST = {
  approve: "Option approved",
  decline: "Option declined",
  agreement: "Agreement approved",
};

export function createContractCommands(deps) {
  var flight = null;

  function busy() {
    return !!flight;
  }

  function run(command, operation) {
    if (flight) return null;
    deps.state.contractCommand = Object.assign({ phase: "pending" }, command);
    var started = Promise.resolve()
      .then(operation)
      .catch(function (error) { return settle(command, error); })
      .finally(function () {
        flight = null;
        if (command.kind !== "view") deps.state.contractConfirm = null;
        deps.render();
      });
    flight = started;
    deps.render();
    return started;
  }

  function decide(kind, backendId) {
    var definition = CONTRACT_EVENTS[kind];
    if (!definition || definition.entity !== "order") return Promise.resolve(false);
    var quote = findQuote(deps.current(), backendId);
    if (!quote || quote.stateCode !== definition.source || quote.allowedActions.indexOf(kind) === -1) return Promise.resolve(false);
    return run({ kind: kind, targets: [backendId] }, async function () {
      var gateway = deps.gateway();
      var row = await gateway.readOrder(backendId, deps.context());
      if (latestStateCode(row) !== definition.source) throw coded("conflict");
      await gateway.sendOrderEvent(backendId, definition.code, deps.context());
      return confirm(kind, backendId, definition.source, function (pkg) {
        var read = findQuote(pkg, backendId);
        return read ? read.stateCode : null;
      });
    }) || Promise.resolve(false);
  }

  function approveAgreement(backendId) {
    var definition = CONTRACT_EVENTS.agreement;
    var row = findAgreement(deps.current(), backendId);
    if (!row || row.agreement.stateCode !== definition.source || row.agreement.allowedActions.indexOf("approve") === -1) return Promise.resolve(false);
    return run({ kind: "agreement", targets: [backendId] }, async function () {
      var gateway = deps.gateway();
      var document = await gateway.readAgreement(backendId, deps.context());
      if (latestStateCode(document) !== definition.source) throw coded("conflict");
      await gateway.sendAgreementEvent(backendId, definition.code, deps.context());
      return confirm("agreement", backendId, definition.source, function (pkg) {
        var read = findAgreement(pkg, backendId);
        return read ? read.agreement.stateCode : null;
      });
    }) || Promise.resolve(false);
  }

  function view(backendIds) {
    var definition = CONTRACT_EVENTS.view;
    if (flight) return Promise.resolve(false);
    var pkg = deps.current();
    var ids = (backendIds || []).filter(function (id, index, all) {
      var quote = findQuote(pkg, id);
      return all.indexOf(id) === index && !!quote && quote.stateCode === definition.source;
    });
    if (!ids.length) return Promise.resolve(false);
    ids.forEach(function (id) { deps.state.quoteViews[id] = "pending"; });
    return run({ kind: "view", targets: ids }, async function () {
      var gateway = deps.gateway();
      for (var index = 0; index < ids.length; index += 1) {
        try {
          await gateway.sendOrderEvent(ids[index], definition.code, deps.context());
        } catch (error) {
          if (error && error.code === "session-expired") throw error;
        }
      }
      var read;
      try {
        read = await deps.reload();
      } catch (error) {
        ids.forEach(function (id) { deps.state.quoteViews[id] = "failed"; });
        throw readbackFailure(error);
      }
      if (!ordersRead(read)) {
        ids.forEach(function (id) { deps.state.quoteViews[id] = "failed"; });
        throw readbackFailure(null);
      }
      ids.forEach(function (id) {
        var quote = findQuote(read, id);
        if (quote && quote.stateCode !== definition.source) delete deps.state.quoteViews[id];
        else deps.state.quoteViews[id] = "failed";
      });
      deps.state.contractCommand = null;
      return true;
    }) || Promise.resolve(false);
  }

  async function confirm(kind, backendId, source, stateOf) {
    var read;
    try {
      read = await deps.reload();
    } catch (error) {
      throw readbackFailure(error);
    }
    var stateCode = stateOf(read);
    if (!stateCode) throw readbackFailure(null);
    if (stateCode === source) {
      deps.state.contractCommand = { kind: kind, targets: [backendId], phase: "unconfirmed" };
      return false;
    }
    deps.state.contractCommand = null;
    if (deps.notify) deps.notify(CONFIRMED_TOAST[kind]);
    return true;
  }

  async function settle(command, error) {
    var code = error && error.code;
    if (code === "session-expired") {
      deps.state.contractCommand = null;
      deps.state.account = "session-expired";
      return false;
    }
    if (code === "readback-failed") {
      deps.state.contractCommand = Object.assign({}, command, { phase: "readback-failed" });
      return false;
    }
    var phase = code === "conflict" ? "conflict"
      : code === "customer-forbidden" || code === "not-found" || code === "command-refused" ? "refused"
      : "failed";
    if (phase === "conflict" || code === "not-found") {
      try {
        await deps.reload();
      } catch (_) {
        deps.state.contractCommand = Object.assign({}, command, { phase: "readback-failed" });
        return false;
      }
    }
    deps.state.contractCommand = Object.assign({}, command, { phase: phase });
    return false;
  }

  return {
    busy: busy,
    decide: decide,
    approveAgreement: approveAgreement,
    view: view,
  };
}

function ordersRead(pkg) {
  return !!pkg && !!pkg.sources && pkg.sources.orders === "ready";
}

function readbackFailure(cause) {
  var error = coded("readback-failed");
  error.cause = cause;
  return error;
}

function coded(code) {
  var error = new Error(code);
  error.code = code;
  return error;
}

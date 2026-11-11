import { findAgreement, findQuote } from "./normalizers/contracts.js";
import { latestStateCode } from "./normalizers/core-record.js";

export var CONTRACT_EVENTS = Object.freeze({
  approve: Object.freeze({ entity: "order", source: "QUOTE_SENT", code: "QUOTE_SENT-ACCEPTED" }),
  decline: Object.freeze({ entity: "order", source: "QUOTE_SENT", code: "QUOTE_SENT-DECLINED" }),
  changes: Object.freeze({ entity: "order", source: "QUOTE_SENT", code: "QUOTE_SENT-CUSTOMER_CHANGES_REQUESTED" }),
  agreement: Object.freeze({ entity: "document", source: "SENT_TO_CLIENT", code: "SENT_TO_CLIENT-CLIENT_APPROVED" }),
});

var CONFIRMED_TOAST = {
  approve: "Option approved",
  decline: "Option declined",
  changes: "Change request sent",
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
        var kept = command.kind === "changes" && !!deps.state.contractCommand;
        if (!kept) deps.state.contractConfirm = null;
        deps.render();
      });
    flight = started;
    deps.render();
    return started;
  }

  function decide(kind, backendId, input) {
    var definition = CONTRACT_EVENTS[kind];
    if (!definition || definition.entity !== "order") return Promise.resolve(false);
    var quote = findQuote(deps.current(), backendId);
    if (!quote || quote.stateCode !== definition.source || quote.allowedActions.indexOf(kind) === -1) return Promise.resolve(false);
    return run({ kind: kind, targets: [backendId] }, async function () {
      var gateway = deps.gateway();
      var row = await gateway.readOrder(backendId, deps.context());
      if (latestStateCode(row) !== definition.source) throw coded("conflict");
      await gateway.sendOrderEvent(backendId, definition.code, deps.context(), input);
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

  function requestChanges(backendId, message) {
    var text = typeof message === "string" ? message.trim() : "";
    if (!text) return Promise.resolve(false);
    return decide("changes", backendId, { MESSAGE: { value: text } });
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
    deps.state.contractCommand = Object.assign({}, command, { phase: phase }, phase === "refused" && error && error.serverMessage ? { message: error.serverMessage } : {});
    return false;
  }

  return {
    busy: busy,
    decide: decide,
    requestChanges: requestChanges,
    approveAgreement: approveAgreement,
  };
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

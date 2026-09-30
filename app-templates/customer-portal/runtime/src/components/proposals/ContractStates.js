import { h } from "../../dom.js";
import { state } from "../../state.js";
import { ActionButton } from "../primitives/ActionButton.js";
import { EmptyState } from "../primitives/EmptyState.js";
import { ErrorState } from "../primitives/ErrorState.js";
import { UnauthorizedState, skel } from "../primitives/RouteStates.js";

var READBACK_COPY = {
  view: "We let the provider know you opened this quote, but its current status couldn’t be loaded",
  approve: "Your approval was sent, but the quote’s current status couldn’t be loaded",
  decline: "Your decline was sent, but the quote’s current status couldn’t be loaded",
  agreement: "Your approval was sent, but the agreement’s current status couldn’t be loaded",
};

var OUTCOME_COPY = {
  failed: "We couldn’t confirm whether this went through. Refresh the status before trying again.",
  refused: "This decision wasn’t accepted, so nothing was changed.",
  unconfirmed: "Your decision didn’t register — this is still waiting for it. Nothing else was changed.",
};

export function contractsGate(skeleton) {
  var command = state.contractCommand;
  if (command && command.phase === "readback-failed") return ReadbackFailed(command.kind);
  var envelope = state.moduleData.proposals;
  if (!envelope) return state.moduleStatus.proposals === "error" ? ContractsError() : skeleton();
  if (envelope.state === "unauthorized") return UnauthorizedState({ scope: "your contracts", backRoute: state.config.defaultRoute });
  if (envelope.state === "unavailable") return ContractsUnavailable();
  if (envelope.state === "error") return ContractsError();
  return null;
}

export function ContractsListSkeleton() {
  var wrap = h("div", { "data-module": "contracts-loading", "data-visual-id": "contracts-loading", "data-state": "loading", "aria-busy": "true" });
  wrap.appendChild(h("div", { "class": "proposals-head" }, [h("div", { "class": "proposals-head__read" }, [skel("width:42%;height:28px;margin-bottom:9px"), skel("width:58%;height:13px")])]));
  wrap.appendChild(skel("height:118px;border-radius:22px;margin-bottom:16px"));
  wrap.appendChild(skel("height:260px;border-radius:24px;margin-bottom:16px"));
  wrap.appendChild(skel("height:190px;border-radius:22px"));
  return wrap;
}

export function ContractDetailSkeleton() {
  var wrap = h("div", { "data-module": "contracts-loading", "data-visual-id": "contracts-loading", "data-state": "loading", "aria-busy": "true" });
  wrap.appendChild(h("div", { "class": "proposal-detail-head" }, [h("div", { style: "flex:1" }, [skel("width:52%;height:26px;margin-bottom:9px"), skel("width:38%;height:13px")])]));
  wrap.appendChild(skel("height:220px;border-radius:20px;margin-bottom:14px"));
  wrap.appendChild(skel("height:220px;border-radius:20px"));
  return wrap;
}

export function ContractsNotices(quotes) {
  var partial = quotes.partial || {};
  var notes = [];
  if (partial.agreements) notes.push("Your service agreements couldn’t be loaded, so only your quotes are shown.");
  if (partial.orders) notes.push("Your quotes couldn’t be loaded, so only your service agreements are shown.");
  if (!partial.orders && partial.unreadableOrders) notes.push(partial.unreadableOrders === 1 ? "1 quote listed in your agreements couldn’t be loaded." : partial.unreadableOrders + " quotes listed in your agreements couldn’t be loaded.");
  if (partial.lines) notes.push("Some services on your quotes couldn’t be loaded. Prices and totals shown come from our system as returned.");
  if (partial.truncated) notes.push("Only part of your contract history could be shown.");
  return notes.map(PartialNotice);
}

export function PartialNotice(text) {
  return h("div", { "class": "alert-banner alert-banner--partial", "data-module": "contracts-partial", "data-visual-id": "contracts-partial", "data-state": "partial", role: "status" }, [
    h("div", { "class": "alert-banner__icon alert-banner__icon--partial", "aria-hidden": "true" }, "!"),
    h("div", { "class": "alert-banner__body" }, [h("div", { "class": "alert-banner__desc" }, text)]),
  ]);
}

export function CommandOutcome(phase) {
  if (phase === "conflict") {
    return h("div", { "class": "conflict-banner decision-outcome", "data-module": "command-conflict", "data-visual-id": "command-conflict", "data-state": "conflict", role: "alert" }, [
      h("div", { "class": "conflict-banner__icon" }, "↺"),
      h("div", { "class": "conflict-banner__body" }, [
        h("div", { "class": "decision-outcome__title" }, "This changed since you opened it"),
        h("div", { "class": "decision-outcome__desc" }, "Its current state is shown here. Nothing was sent."),
      ]),
    ]);
  }
  if (!OUTCOME_COPY[phase]) return null;
  return DecisionFailure(OUTCOME_COPY[phase], { action: "contracts.refresh", label: "Refresh status" });
}

export function DecisionFailure(message, retry) {
  return h("div", { "class": "inline-fail decision-outcome", "data-module": "command-failure", "data-visual-id": "command-failure", "data-state": "failed", role: "alert" }, [
    h("span", { "class": "inline-fail__icon", "aria-hidden": "true" }, "!"),
    h("div", { "class": "decision-outcome__body" }, message),
    ActionButton({ variant: "btn--ghost", label: retry.label, action: retry.action, id: retry.id, visualId: "command-retry" }),
  ]);
}

export function PendingNote(text) {
  return h("div", { "class": "decision-note", "data-module": "command-pending", "data-visual-id": "command-pending", "data-state": "pending", role: "status" }, [
    h("span", { "class": "decision-note__spinner", "aria-hidden": "true" }),
    h("span", null, text),
  ]);
}

function ReadbackFailed(kind) {
  return h("div", { "class": "state-block", "data-module": "contracts-readback-failed", "data-visual-id": "contracts-readback-failed", "data-state": "readback-failed", role: "alert" }, [
    h("div", { "class": "state-block__glyph state-block__glyph--error" }, "⚠"),
    h("div", { "class": "state-block__title" }, READBACK_COPY[kind] || READBACK_COPY.approve),
    h("div", { "class": "state-block__desc" }, "Nothing is shown until it loads, so you never see an out-of-date status."),
    ActionButton({ variant: "btn--primary", label: "Try again", action: "contracts.refresh", visualId: "contracts-readback-retry" }),
  ]);
}

function ContractsError() {
  return ErrorState({ title: "Couldn’t load your contracts", desc: "Nothing was changed. Check your connection and try again." });
}

function ContractsUnavailable() {
  var block = EmptyState({ glyph: "○", title: "Contracts aren’t in the portal yet", desc: "Your quotes and service agreements can’t be shown here yet." });
  block.setAttribute("data-state", "unavailable");
  block.setAttribute("data-module", "contracts-unavailable");
  return block;
}

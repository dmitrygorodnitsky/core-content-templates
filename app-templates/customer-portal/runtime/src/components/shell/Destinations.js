import { h } from "../../dom.js";
import { configuredExternalUrl } from "../../config.js";
import { isSpa, state } from "../../state.js";
import { ActionButton } from "../primitives/ActionButton.js";

export function SupportContactButton(props) {
  if (isSpa()) return ActionButton(Object.assign({ label: "Contact support", action: "support.email" }, props));
  if (!configuredExternalUrl(state.config, "supportUrl")) return null;
  return ActionButton(Object.assign({ label: "Contact support", action: "support.open" }, props));
}

export function LandingReturnButton(props) {
  if (isSpa()) return ActionButton(Object.assign({ label: "Back to the catalog", action: "nav.landing" }, props));
  if (!configuredExternalUrl(state.config, "landingUrl")) return null;
  return ActionButton(Object.assign({ label: "Back to our website", action: "nav.landing" }, props));
}

export function GateGlyph(glyph) {
  if (isSpa()) return h("div", { "class": "oidc-glyph" }, glyph);
  return h("div", { "class": "oidc-glyph", "data-tone": "neutral", style: "background:rgba(var(--accent-rgb),.12);color:var(--accent)" }, glyph);
}

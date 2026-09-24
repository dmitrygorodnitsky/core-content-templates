import { h } from "../../dom.js";

export function UnavailableChip() {
  return h("span", { "class": "readonly-chip" }, "Not available yet");
}

export function SectionUnavailable(subject) {
  return h("div", { "class": "ov-empty", "data-module": "section-unavailable", "data-visual-id": "section-unavailable" }, [
    UnavailableChip(),
    h("div", { "class": "ov-empty__desc" }, subject + " aren’t in the portal yet."),
  ]);
}

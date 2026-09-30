// customer-portal-design/src/components/orders/Timeline.js — presentation runtime (auto-split from app.js). No business logic.
import { h } from "../../dom.js";

export function Timeline(steps) {
  return h("div", { "class": "panel", "data-module": "timeline", "data-visual-id": "timeline" }, [
    h("div", { "class": "panel__title", style: "margin-bottom:16px" }, "Progress"),
    h("div", { "class": "timeline" }, [h("div", { "class": "timeline__line" })].concat(
      steps.map(function (st) {
        return h("div", { "class": "timeline-step", "data-module": "timeline-step" }, [
          h("div", { "class": "timeline-step__dot", style: "background:" + st.dot }),
          h("div", null, [
            h("div", { "class": "timeline-step__title", style: st.muted ? "color:var(--ink-3)" : "" }, st.label),
            h("div", { "class": "timeline-step__sub" }, st.sub)
          ])
        ]);
      })
    ))
  ]);
}

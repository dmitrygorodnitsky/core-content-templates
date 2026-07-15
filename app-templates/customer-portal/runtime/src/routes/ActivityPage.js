// customer-portal/runtime/src/routes/ActivityPage.js — production transfer module.
import { h } from "../dom.js";
import { currentFixture, state } from "../state.js";
import { EmptyState } from "../components/primitives/EmptyState.js";

export function Activity() {
  var fixture = currentFixture();
  var page = h("section", { "class": "page", style: "max-width:760px", "data-route": "activity", "data-visual-id": "activity" });
  page.appendChild(h("div", { "class": "activity-head" }, [
    h("div", { style: "flex:1" }, [
      h("div", { style: "font-weight:800;font-size:28px;line-height:1.15;letter-spacing:-.025em" }, "Activity"),
      h("div", { style: "font-size:14.5px;color:var(--ink-2);margin-top:3px" }, "Your appointments, orders and account updates, newest first.")
    ]),
    h("div", { "class": "tab", "data-action": "activity.markRead", "data-visual-id": "mark-read" }, "Mark all read")
  ]));
  page.appendChild(h("div", { "class": "tabs", style: "margin:0 4px 18px", "data-module": "activity-filter" },
    fixture.feedTabs.map(function (t) {
      return h("span", { "class": "tab" + (t.key === state.feedFilter ? " tab--active" : ""), "data-action": "activity.filter", "data-id": t.key }, t.label);
    })));

  var groups = fixture.activity.map(function (g) {
    return { day: g.day, items: g.items.filter(function (ev) { return state.feedFilter === "all" || ev.type === state.feedFilter; }) };
  }).filter(function (g) { return g.items.length; });

  if (groups.length === 0) { page.appendChild(EmptyState({ glyph: "\ud83d\udd14", title: "Nothing here", desc: "No activity in this filter yet." })); return page; }

  groups.forEach(function (g) {
    page.appendChild(h("div", { "class": "feed-day" }, g.day));
    var group = h("div", { "class": "feed-group", "data-module": "activity-feed" }, [h("div", { "class": "feed-line" })]);
    g.items.forEach(function (ev) {
      var card = h("div", { "class": "feed-card" }, [
        h("div", { style: "flex:1;min-width:0" }, [
          h("div", { style: "display:flex;align-items:center;gap:8px" }, [
            h("div", { style: "font-weight:700;font-size:14.5px" }, ev.title),
            ev.unread ? h("span", { "class": "unread-dot" }) : null
          ]),
          h("div", { style: "font-size:13px;line-height:1.45;color:var(--ink-2);margin-top:2px" }, ev.desc)
        ]),
        h("div", { "class": "feed-time" }, ev.time),
        ev.action ? h("div", { "class": "feed-action", "data-action": "activity.act", "data-id": ev.act }, ev.action) : null
      ]);
      group.appendChild(h("div", { "class": "feed-item", "data-module": "activity-item", "data-visual-id": "activity-item" }, [
        h("div", { "class": "feed-item__icon", style: "background:" + ev.iconBg }, h("i", { style: "background:" + ev.dot })),
        card
      ]));
    });
    page.appendChild(group);
  });
  return page;
}

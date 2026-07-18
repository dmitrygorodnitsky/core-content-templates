// customer-portal-design/src/routes/SupportPage.js — presentation runtime (auto-split from app.js). No business logic.
import { F } from "../../data/fixtures.js";
import { h } from "../dom.js";
import { state } from "../state.js";
import { sendChat } from "../actions.js";
import { routeStateBody, skel } from "../components/primitives/RouteStates.js";
import { render } from "../app.js";

export function Support() {
  var v = F.themes[state.theme];
  var page = h("section", { "class": "page", "data-route": "support", "data-state": state.view, "data-visual-id": "support" });
  page.appendChild(h("div", { "class": "section-head" }, [
    h("div", { "class": "section-head__title" }, "How can we help, " + F.customer.firstName + "?"),
    h("div", { "class": "section-head__sub" }, "Chat with us \u2014 agents reply in under 2 minutes, 24/7.")
  ]));

  /* wave 13 — threads/messages are customer-scoped; help content alone is not
     worth rendering over a broken customer scope, so the route gates whole */
  var gate = routeStateBody({
    states: ["loading", "error", "unauthorized"],
    skeleton: function () {
      return h("div", { "class": "support-grid", "data-state": "loading", "aria-busy": "true" }, [
        h("div", { style: "display:flex;flex-direction:column;gap:16px" }, [skel("height:260px;border-radius:20px"), skel("height:140px;border-radius:20px")]),
        skel("height:440px;border-radius:20px")
      ]);
    },
    error: { title: "Couldn\u2019t load support", desc: "Your conversations didn\u2019t load. Nothing was sent \u2014 try again.", retryId: "support" },
    scope: "support"
  });
  if (gate) { page.appendChild(gate); return page; }

  var grid = h("div", { "class": "support-grid" });

  /* help rail */
  var rail = h("div", { "class": "help-rail" });
  var helpPanel = h("div", { "class": "help-panel", "data-module": "help-rail", "data-visual-id": "help-rail" }, [
    h("div", { "class": "help-search" }, "Search help articles\u2026"),
    h("div", { style: "font-weight:700;font-size:14px;margin-bottom:12px" }, "Common topics")
  ]);
  var topics = h("div", { style: "display:flex;flex-direction:column;gap:9px" });
  F.helpTopics.forEach(function (t) {
    topics.appendChild(h("div", { "class": "help-topic", "data-module": "help-topic", "data-action": "support.helpTopic", "data-id": t.q }, [
      h("div", { "class": "help-topic__icon", style: "background:" + t.iconBg }, h("i", { style: "background:" + t.dot })),
      h("div", { style: "flex:1;font-weight:600;font-size:13px" }, t.label),
      h("div", { style: "color:#b7bcc7;font-size:16px" }, "\u203a")
    ]));
  });
  helpPanel.appendChild(topics);
  rail.appendChild(helpPanel);
  rail.appendChild(h("div", { "class": "call-card", "data-module": "call-card" }, [
    h("div", { style: "font-weight:700;font-size:15px" }, "Prefer to talk?"),
    h("div", { style: "font-size:13px;line-height:1.5;opacity:.7;margin-top:5px" }, "Call our 24/7 line \u2014 average wait under 2 min."),
    h("div", { "class": "call-card__btns" }, [
      h("div", { "class": "call-card__btn call-card__btn--solid", "data-action": "support.call" }, "Call now"),
      h("div", { "class": "call-card__btn call-card__btn--ghost", "data-action": "support.email" }, "Email")
    ])
  ]));
  grid.appendChild(rail);

  /* chat panel — wave 13: messages carry an entity-scoped send lifecycle.
     sending = command pending; sent = server readback; failed = explicit
     per-message retry (support.retryMessage, data-id = m<index>). */
  var thread = h("div", { "class": "chat-thread", "data-module": "chat-thread", "data-visual-id": "chat-thread" }, [h("div", { "class": "chat-day" }, "Today")]);
  if (state.view === "empty") {
    thread.appendChild(h("div", { "class": "state-block", style: "padding:36px 20px", "data-module": "empty-state", "data-visual-id": "chat-empty", "data-state": "empty" }, [
      h("div", { "class": "state-block__glyph" }, "\ud83d\udcac"),
      h("div", { "class": "state-block__title" }, "No messages yet"),
      h("div", { "class": "state-block__desc" }, "Start the conversation below \u2014 your messages and our replies stay here.")
    ]));
  } else state.messages.forEach(function (m, i) {
    var user = m.from === "user";
    var bubble = h("div", { "class": "msg-bubble " + (user ? "msg-bubble--user" : "msg-bubble--agent"), "data-state": user && m.status ? m.status : undefined }, m.text);
    var body = bubble;
    if (user && m.status === "sending") {
      body = h("div", { style: "display:flex;flex-direction:column;align-items:flex-end;min-width:0" }, [bubble, h("div", { "class": "msg-status" }, "Sending\u2026")]);
    } else if (user && m.status === "failed") {
      body = h("div", { style: "display:flex;flex-direction:column;align-items:flex-end;min-width:0" }, [bubble,
        h("div", { "class": "msg-status msg-status--failed" }, ["Not delivered", h("span", { "class": "msg-retry", "data-action": "support.retryMessage", "data-id": "m" + i, role: "button" }, "Retry")])]);
    }
    thread.appendChild(h("div", { "class": "msg-row " + (user ? "msg-row--user" : "msg-row--agent") }, body));
  });
  if (state.typing) thread.appendChild(h("div", { "class": "msg-row msg-row--agent" }, h("div", { "class": "typing" }, [
    h("span", { "class": "typing-dot" }), h("span", { "class": "typing-dot", style: "animation-delay:.2s" }), h("span", { "class": "typing-dot", style: "animation-delay:.4s" })
  ])));

  var quick = h("div", { "class": "quick-replies" }, F.quickReplies.map(function (q) {
    return h("span", { "class": "quick-reply", "data-action": "support.quickReply", "data-id": q }, q);
  }));

  var input = h("input", { "class": "composer__input", placeholder: "Type a message\u2026", value: state.chatInput, "aria-label": "Message" });
  input.addEventListener("input", function () { state.chatInput = input.value; }); /* no re-render: preserve focus */
  input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); sendChat(); } });
  var composer = h("div", { "class": "composer", "data-module": "chat-composer", "data-visual-id": "chat-composer" }, [
    h("div", { "class": "composer__add" }, "+"),
    input,
    h("button", { "class": "composer__send", "data-action": "support.sendMessage", "aria-label": "Send" }, "\u2191")
  ]);

  var panel = h("div", { "class": "chat-panel", "data-module": "chat-panel", "data-visual-id": "chat-panel" }, [
    h("div", { "class": "chat-header" }, [
      h("div", { "class": "chat-avatar" }, [h("div", { "class": "chat-avatar__img" }), h("span", { "class": "online-dot" })]),
      h("div", { style: "flex:1" }, [
        h("div", { style: "font-weight:700;font-size:15px" }, "Avery \u00b7 Aircove Support"),
        h("div", { style: "font-size:12.5px;color:var(--ok)" }, "Online now")
      ]),
      h("div", { "class": "chat-ticket" }, "Ticket #SP-104")
    ]),
    thread, quick, composer
  ]);
  grid.appendChild(panel);
  page.appendChild(grid);
  return page;
}

/* Weather-operational calendar (stormOps profile) */

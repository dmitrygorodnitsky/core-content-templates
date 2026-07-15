// customer-portal/runtime/src/routes/SupportPage.js — production transfer module.
import { h } from "../dom.js";
import { currentFixture, state } from "../state.js";

export function Support() {
  var fixture = currentFixture();
  var page = h("section", { "class": "page", "data-route": "support", "data-visual-id": "support" });
  page.appendChild(h("div", { "class": "section-head" }, [
    h("div", { "class": "section-head__title" }, "How can we help, " + fixture.customer.firstName + "?"),
    h("div", { "class": "section-head__sub" }, "Chat with the Calm Harbor team about your appointment, products or account.")
  ]));

  var grid = h("div", { "class": "support-grid" });

  /* help rail */
  var rail = h("div", { "class": "help-rail" });
  var helpPanel = h("div", { "class": "help-panel", "data-module": "help-rail", "data-visual-id": "help-rail" }, [
    h("div", { "class": "help-search" }, "Search help articles\u2026"),
    h("div", { style: "font-weight:700;font-size:14px;margin-bottom:12px" }, "Common topics")
  ]);
  var topics = h("div", { style: "display:flex;flex-direction:column;gap:9px" });
  fixture.helpTopics.forEach(function (t) {
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
    h("div", { style: "font-size:13px;line-height:1.5;opacity:.7;margin-top:5px" }, "Call the studio team during opening hours, or send us a message here."),
    h("div", { "class": "call-card__btns" }, [
      h("div", { "class": "call-card__btn call-card__btn--solid", "data-action": "support.call" }, "Call now"),
      h("div", { "class": "call-card__btn call-card__btn--ghost", "data-action": "support.email" }, "Email")
    ])
  ]));
  grid.appendChild(rail);

  /* chat panel */
  var thread = h("div", { "class": "chat-thread", "data-module": "chat-thread", "data-visual-id": "chat-thread" }, [h("div", { "class": "chat-day" }, "Today")]);
  state.messages.forEach(function (m) {
    var user = m.from === "user";
    thread.appendChild(h("div", { "class": "msg-row " + (user ? "msg-row--user" : "msg-row--agent") },
      h("div", { "class": "msg-bubble " + (user ? "msg-bubble--user" : "msg-bubble--agent") }, m.text)));
  });
  if (state.typing) thread.appendChild(h("div", { "class": "msg-row msg-row--agent" }, h("div", { "class": "typing" }, [
    h("span", { "class": "typing-dot" }), h("span", { "class": "typing-dot", style: "animation-delay:.2s" }), h("span", { "class": "typing-dot", style: "animation-delay:.4s" })
  ])));

  var quick = h("div", { "class": "quick-replies" }, fixture.quickReplies.map(function (q) {
    return h("span", { "class": "quick-reply", "data-action": "support.quickReply", "data-id": q }, q);
  }));

  var input = h("input", { "class": "composer__input", placeholder: "Type a message\u2026", value: state.chatInput, "aria-label": "Message" });
  input.addEventListener("input", function () { state.chatInput = input.value; }); /* no re-render: preserve focus */
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      composer.querySelector('[data-action="support.sendMessage"]').click();
    }
  });
  var commandError = state.commandErrors["support.sendMessage:_"];
  var composer = h("div", {
    "class": "composer",
    "data-module": "chat-composer",
    "data-visual-id": "chat-composer",
    style: commandError ? "position:relative;padding-bottom:38px" : undefined
  }, [
    h("div", { "class": "composer__add" }, "+"),
    input,
    h("button", { "class": "composer__send", "data-action": "support.sendMessage", "aria-label": "Send" }, "\u2191")
  ]);
  if (commandError) {
    composer.appendChild(h("div", {
      "class": "composer__error",
      "data-state": "validation-error",
      "data-command-error": "support.sendMessage:_",
      "role": "alert",
      style: "position:absolute;left:64px;right:64px;bottom:8px;color:var(--danger);font-size:12px"
    }, commandError));
  }

  var panel = h("div", { "class": "chat-panel", "data-module": "chat-panel", "data-visual-id": "chat-panel" }, [
    h("div", { "class": "chat-header" }, [
      h("div", { "class": "chat-avatar" }, [h("div", { "class": "chat-avatar__img" }), h("span", { "class": "online-dot" })]),
      h("div", { style: "flex:1" }, [
        h("div", { style: "font-weight:700;font-size:15px" }, "Nina \u00b7 Calm Harbor"),
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

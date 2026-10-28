import { h } from "./dom.js";

const SUGGESTION_DELAY = 250;
const SUGGESTION_MINIMUM = 3;

export function attachAddressSuggestions(input, cell, options) {
  var finder = options.finder;
  var listId = input.getAttribute("id") + "-suggestions";
  var list = h("ul", { "class": "prop-suggest", id: listId, role: "listbox", "aria-label": "Suggested addresses", hidden: true });
  var offered = [];
  var active = -1;
  var timer = null;
  cell.appendChild(list);
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-controls", listId);
  input.setAttribute("aria-expanded", "false");

  function highlight(index) {
    active = index;
    offered.forEach(function (option, position) { option.node.setAttribute("aria-selected", position === index ? "true" : "false"); });
    if (index === -1) input.removeAttribute("aria-activedescendant");
    else input.setAttribute("aria-activedescendant", offered[index].node.getAttribute("id"));
  }

  function close() {
    list.replaceChildren();
    list.setAttribute("hidden", "");
    offered = [];
    highlight(-1);
    input.setAttribute("aria-expanded", "false");
  }

  function take(option) {
    close();
    options.pick(option.item);
  }

  input.addEventListener("keydown", function (event) {
    if (list.hasAttribute("hidden")) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      var count = offered.length;
      highlight(event.key === "ArrowDown" ? (active + 1) % count : (active <= 0 ? count : active) - 1);
    } else if (event.key === "Enter" && active !== -1) {
      event.preventDefault();
      take(offered[active]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  });
  input.addEventListener("blur", function () { setTimeout(close, 150); });
  input.addEventListener("input", function () {
    if (timer !== null) clearTimeout(timer);
    var value = input.value.trim();
    if (value.length < SUGGESTION_MINIMUM) { timer = null; close(); return; }
    timer = setTimeout(function () {
      timer = null;
      finder.suggestAddresses(value, { within: options.within || null }).then(function (items) {
        if (input.value.trim() !== value || !input.isConnected) return;
        close();
        offered = items.map(function (item, index) {
          var node = h("li", { "class": "prop-suggest__option", id: listId + "-" + index, role: "option", "aria-selected": "false" }, item.label);
          var option = { node: node, item: item };
          node.addEventListener("mousedown", function (event) { event.preventDefault(); });
          node.addEventListener("click", function () { take(option); });
          list.appendChild(node);
          return option;
        });
        if (!offered.length) return;
        list.removeAttribute("hidden");
        input.setAttribute("aria-expanded", "true");
      }, close);
    }, SUGGESTION_DELAY);
  });
}

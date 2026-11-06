// customer-portal/runtime/src/components/shell/PageHeader.js — production transfer module.
import { h } from "../../dom.js";
import { Tabs } from "../primitives/Tabs.js";

export function PageHeader(props) {
  return h("div", { "class": "page-header", "data-module": "page-header", "data-visual-id": "page-header" }, [
    h("div", null, [
      h("h1", { "class": "page-header__title", "data-bind": "page.title" }, props.title),
      props.sub ? h("div", { "class": "page-header__sub", "data-bind": "page.subtitle" }, props.sub) : null
    ])
  ]);
}

/* Tabs / SegmentedControl */

// customer-portal/runtime/src/components/shell/AppShell.js — production transfer module.
import { h } from "../../dom.js";
import { isPublic } from "../../state.js";
import { TopNav } from "./TopNav.js";
import { PublicNav } from "./PublicNav.js";

export function AppShell(content) {
  return h("div", { "class": "app-shell", "data-module": "app-shell", "data-visual-id": "app-shell" }, [
    isPublic() ? PublicNav() : TopNav(),
    content
  ]);
}

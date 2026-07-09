// customer-portal-design/src/components/shell/AppShell.js — presentation runtime (auto-split from app.js). No business logic.
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

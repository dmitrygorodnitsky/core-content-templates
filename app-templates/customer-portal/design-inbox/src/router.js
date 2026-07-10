// customer-portal-design/src/router.js — presentation runtime (auto-split from app.js). No business logic.
import { h } from "./dom.js";
import { state } from "./state.js";
import { go } from "./actions.js";
import { EmptyState } from "./components/primitives/EmptyState.js";
import { Cabinet } from "./routes/OrdersPage.js";
import { OrderDetail } from "./routes/OrderDetailPage.js";
import { Services } from "./routes/ServicesPage.js";
import { Pricing } from "./routes/PricingPage.js";
import { Products } from "./routes/ProductsPage.js";
import { Checkout } from "./routes/CheckoutPage.js";
import { ProposalsList } from "./routes/ProposalsPage.js";
import { ProposalDetail } from "./routes/ProposalDetailPage.js";
import { Profile } from "./routes/ProfilePage.js";
import { Activity } from "./routes/ActivityPage.js";
import { Calendar } from "./routes/CalendarPage.js";
import { Support } from "./routes/SupportPage.js";
import { Landing } from "./routes/LandingPage.js";
import { SeoLanding } from "./routes/SeoLandingPage.js";
import { Auth } from "./routes/AuthPage.js";
import { Care } from "./routes/CarePage.js";

export function ComingSoon(routeId, wave) {
  return h("section", { "class": "page", "data-route": routeId, "data-visual-id": routeId }, [
    EmptyState({
      glyph: "\ud83e\uddf1", title: routeId + " \u2014 coming in " + wave,
      desc: "This route is part of a later wave. The shell, theming and action contract are already wired.",
      action: { variant: "btn--ghost", label: "Back to orders", action: "nav.go", id: "orders.list" }
    })
  ]);
}

export function renderRoute() {
  switch (state.route) {
    case "orders.list": return Cabinet();
    case "order.detail": return OrderDetail();
    case "care":        return Care();
    case "services":    return Services();
    case "pricing":     return Pricing();
    case "products":    return Products();
    case "checkout":    return Checkout();
    case "proposals.list": return ProposalsList();
    case "proposal.detail": return ProposalDetail();
    case "profile":     return Profile();
    case "activity":    return Activity();
    case "calendar":    return Calendar();
    case "support":     return Support();
    case "landing":     return Landing();
    case "seo.landing": return SeoLanding();
    case "auth.phone":  return Auth();
    case "auth.code":   return Auth();
    default:            return Cabinet();
  }
}

/* =========================================================
   Booking drawer (minimal — full flow in later waves)
   ========================================================= */

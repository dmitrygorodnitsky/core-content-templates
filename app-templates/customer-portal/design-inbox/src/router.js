// customer-portal-design/src/router.js — presentation runtime (auto-split from app.js). No business logic.
import { h } from "./dom.js";
import { isSpa, spaCapability, state } from "./state.js";
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
import { AuthOidc } from "./routes/AuthOidcPage.js";
import { Care } from "./routes/CarePage.js";
import { SpaOrders } from "./routes/SpaOrdersPage.js";
import { SpaAppointments } from "./routes/SpaAppointmentsPage.js";
import { SpaCatalog } from "./routes/SpaCatalogPage.js";
import { SpaShop } from "./routes/SpaShopPage.js";
import { SpaProductDetail } from "./routes/SpaProductDetailPage.js";
import { SpaAccount } from "./routes/SpaAccountPage.js";
import { SpaPurchases } from "./routes/SpaPurchasesPage.js";
import { SpaPurchaseDetail } from "./routes/SpaPurchaseDetailPage.js";
import { SpaPlan } from "./routes/SpaPlanPage.js";
import { SpaCart } from "./routes/SpaCartPage.js";
import { SpaCheckout } from "./routes/SpaCheckoutPage.js";
import { SpaAppointmentDetail } from "./routes/SpaAppointmentDetailPage.js";
import { SpaProfile } from "./routes/SpaProfilePage.js";

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
  /* wave 14 — Beauty renders the Calm Harbor spa portal on the SAME stable
     route ids: orders.list is the staging Orders list or (capability-gated)
     the target Appointments default; services+pricing are one destination;
     products is the browse-only Shop. All other verticals are unchanged. */
  switch (state.route) {
    case "orders.list": return isSpa() ? (spaCapability() === "target-appointments" ? SpaAppointments() : SpaOrders()) : Cabinet();
    case "order.detail": return OrderDetail();
    /* wave 16 — standalone customer-owned Appointment detail (spa target only) */
    case "appointment.detail": return isSpa() ? SpaAppointmentDetail() : ComingSoon("appointment.detail", "a later wave");
    case "care":        return Care();
    case "services":    return isSpa() ? SpaCatalog() : Services();
    case "pricing":     return isSpa() ? SpaCatalog() : Pricing();
    case "products":    return isSpa() ? SpaShop() : Products();
    /* wave 17 — Calm Harbor product detail: media gallery + published reviews
       (spa only; opaque product ref). Other verticals keep the accepted Products page. */
    case "product.detail": return isSpa() ? SpaProductDetail() : ComingSoon("product.detail", "a later wave");
    /* wave 15 — Calm Harbor commercial lifecycle: Account owns Purchases /
       My plan; cart + checkout are the SIMULATED commerce surfaces (spa only —
       other verticals keep the accepted generic checkout). */
    case "account":         return isSpa() ? SpaAccount() : ComingSoon("account", "a later wave");
    case "purchases.list":  return isSpa() ? SpaPurchases() : ComingSoon("purchases.list", "a later wave");
    case "purchase.detail": return isSpa() ? SpaPurchaseDetail() : ComingSoon("purchase.detail", "a later wave");
    case "plan":            return isSpa() ? SpaPlan() : ComingSoon("plan", "a later wave");
    case "cart":            return isSpa() ? SpaCart() : Checkout();
    case "checkout":    return isSpa() ? SpaCheckout() : Checkout();
    case "proposals.list": return ProposalsList();
    case "proposal.detail": return ProposalDetail();
    case "profile":     return isSpa() ? SpaProfile() : Profile(); /* wave 16 — Calm Harbor least-data Profile */
    case "activity":    return Activity();
    case "calendar":    return Calendar();
    case "support":     return Support();
    case "landing":     return Landing();
    case "seo.landing": return SeoLanding();
    case "auth.oidc":   return AuthOidc(); /* wave 10 — Core OIDC login at /login */
    case "auth.phone":  return Auth(); /* reference only — superseded by auth.oidc */
    case "auth.code":   return Auth(); /* reference only — superseded by auth.oidc */
    default:            return Cabinet();
  }
}

/* =========================================================
   Booking drawer (minimal — full flow in later waves)
   ========================================================= */

import { F } from "../../data/fixtures.js";

export const fixtureAdapter = {
  load(moduleId, context) {
    var themeName = context.state.theme;
    var theme = F.themes[themeName];

    switch (moduleId) {
      case "auth":
        return { session: context.state.session, phone: context.state.phone, code: context.state.code };
      case "orders":
        return { orders: context.state.orders, statusMeta: F.statusMeta, technician: F.technician, addresses: F.addresses };
      case "proposals":
        return { proposal: F.proposal, sites: context.state.psites, statusMeta: F.pstatus };
      case "services":
        return { services: theme.svc };
      case "pricing":
        return { plan: theme.plan, services: theme.svc };
      case "products":
        return { feature: theme.feat, categories: theme.cats, products: theme.products };
      case "checkout":
        return { cartItems: context.state.cartItems, addresses: F.addresses, cards: F.cards };
      case "calendar":
        return { orders: context.state.orders, stormCalendar: F.stormCalendar(themeName) };
      case "activity":
        return { groups: F.buildFeed(theme), tabs: F.feedTabs };
      case "profile":
        return {
          customer: F.customer,
          addresses: F.addresses,
          cards: F.cards,
          preferences: context.state.prefs,
          orders: context.state.orders,
        };
      case "support":
        return {
          customer: F.customer,
          topics: F.helpTopics,
          quickReplies: F.quickReplies,
          messages: context.state.messages,
        };
      default:
        throw new Error("Unknown fixture module: " + moduleId);
    }
  },
};

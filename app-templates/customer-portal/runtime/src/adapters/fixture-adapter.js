import { F } from "../../data/fixtures.js";
import { caseFixtureFor } from "../../data/case-fixtures.js";

export const fixtureAdapter = {
  load(moduleId, context) {
    var themeName = context.state.theme;
    var fixture = caseFixtureFor(context.config.caseId);
    var theme = fixture ? fixture.theme : F.themes[themeName];

    switch (moduleId) {
      case "auth":
        return { session: context.state.session, phone: context.state.phone, code: context.state.code };
      case "orders":
        return { orders: context.state.orders, statusMeta: fixture ? fixture.statusMeta || F.statusMeta : F.statusMeta, technician: fixture ? fixture.technician : F.technician, addresses: fixture ? fixture.addresses : F.addresses };
      case "proposals":
        return {
          proposal: fixture && fixture.proposals ? fixture.proposals.proposal : F.proposal,
          sites: context.state.psites,
          statusMeta: fixture && fixture.proposals && fixture.proposals.statusMeta ? fixture.proposals.statusMeta : F.pstatus,
        };
      case "services":
        return { services: theme.svc };
      case "pricing":
        return { plan: theme.plan, services: theme.svc };
      case "products":
        return { feature: theme.feat, categories: theme.cats, products: theme.products };
      case "checkout":
        return { cartItems: context.state.cartItems, addresses: fixture ? fixture.addresses : F.addresses, cards: fixture ? fixture.cards : F.cards };
      case "overview":
      case "appointmentsTimeline":
      case "properties":
        return { overview: fixture ? fixture.overview || null : null };
      case "calendar":
        return { orders: context.state.orders, stormCalendar: fixture && fixture.stormCalendar ? fixture.stormCalendar : F.stormCalendar(themeName) };
      case "activity":
        return { groups: fixture ? fixture.activity : F.buildFeed(theme), tabs: fixture ? fixture.feedTabs : F.feedTabs };
      case "profile":
        return {
          customer: fixture ? fixture.customer : F.customer,
          addresses: fixture ? fixture.addresses : F.addresses,
          cards: fixture ? fixture.cards : F.cards,
          preferences: context.state.prefs,
          orders: context.state.orders,
        };
      case "support":
        return {
          customer: fixture ? fixture.customer : F.customer,
          topics: fixture ? fixture.helpTopics : F.helpTopics,
          quickReplies: fixture ? fixture.quickReplies : F.quickReplies,
          messages: context.state.messages,
        };
      default:
        throw new Error("Unknown fixture module: " + moduleId);
    }
  },
};

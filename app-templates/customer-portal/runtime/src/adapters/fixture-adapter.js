import { F } from "../../data/fixtures.js";
import { caseFixtureFor } from "../../data/case-fixtures.js";
import { attributeNumber, latestStateCode, positiveInteger } from "../normalizers/core-record.js";

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
        return proposalsFixture(fixture, context);
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

export const fixtureAccountProfileAdapter = {
  load(moduleId, context) {
    var fixture = caseFixtureFor(context.config.caseId);
    return { account: fixture && fixture.customerAccount ? clone(fixture.customerAccount) : null, scopeMode: null };
  },
};

export function createFixtureContractsGateway(state) {
  return {
    async readOrder(backendId) {
      return clone(fixtureRow(state.porders, backendId));
    },
    async readAgreement(backendId) {
      return clone(fixtureRow(state.pagreements, backendId));
    },
    async sendOrderEvent(backendId, event) {
      var target = transition(fixtureRow(state.porders, backendId), event);
      var orders = withState(state.porders, [backendId], target);
      var packages = state.pagreements.filter(function (agreement) { return listedOrderIds(agreement).indexOf(positiveInteger(backendId)) !== -1; });
      if (target === "CLIENT_APPROVED") orders = withState(orders, siblingsOf(orders, packages, backendId), "DECLINED");
      state.porders = orders;
      if (target === "CLIENT_APPROVED" || target === "DECLINED") state.pagreements = evaluatePackages(state.pagreements, packages, orders);
      return true;
    },
    async sendAgreementEvent(backendId, event) {
      var target = transition(fixtureRow(state.pagreements, backendId), event);
      state.pagreements = withState(state.pagreements, [backendId], target);
      return true;
    },
  };
}

function proposalsFixture(fixture, context) {
  var proposals = fixture && fixture.proposals;
  var quotation = !!(proposals && proposals.orders);
  return {
    proposal: proposals ? proposals.proposal || null : F.proposal,
    sites: context.state.psites,
    statusMeta: proposals && proposals.statusMeta ? proposals.statusMeta : F.pstatus,
    quoteOrders: quotation ? context.state.porders : null,
    agreements: quotation ? context.state.pagreements : null,
    orderItems: quotation ? proposals.orderItems || [] : null,
    productPrices: quotation ? proposals.productPrices || [] : null,
    products: quotation ? proposals.products || [] : null,
    client: quotation ? { displayName: fixture.customer.fullName } : null,
  };
}

function fixtureRow(rows, backendId) {
  var id = positiveInteger(backendId);
  var row = (rows || []).find(function (candidate) { return candidate.id === id; });
  if (!row) throw coded("not-found");
  return row;
}

function transition(row, event) {
  var parts = String(event || "").split("-");
  if (parts.length !== 2 || latestStateCode(row) !== parts[0]) throw coded("command-refused");
  return parts[1];
}

function withState(rows, ids, code) {
  return rows.map(function (row) {
    return ids.indexOf(row.id) === -1 ? row : Object.assign({}, row, { states: row.states.concat({ code: code }) });
  });
}

function siblingsOf(orders, packages, backendId) {
  var property = attributeNumber(fixtureRow(orders, backendId), "SERVICE_PROPERTY");
  var listed = [];
  packages.forEach(function (agreement) { listed = listed.concat(listedOrderIds(agreement)); });
  return orders.filter(function (row) {
    return row.id !== positiveInteger(backendId)
      && listed.indexOf(row.id) !== -1
      && attributeNumber(row, "SERVICE_PROPERTY") === property
      && ["QUOTE_SENT", "QUOTE_VIEWED"].indexOf(latestStateCode(row)) !== -1;
  }).map(function (row) { return row.id; });
}

function evaluatePackages(agreements, packages, orders) {
  var decided = packages.filter(function (agreement) {
    if (latestStateCode(agreement) !== "QUOTATION_SENT") return false;
    var byProperty = {};
    listedOrderIds(agreement).forEach(function (id) {
      var row = orders.find(function (candidate) { return candidate.id === id; });
      if (!row) return;
      var key = String(attributeNumber(row, "SERVICE_PROPERTY") || 0);
      (byProperty[key] = byProperty[key] || []).push(latestStateCode(row));
    });
    var keys = Object.keys(byProperty);
    return keys.length > 0 && keys.every(function (key) {
      return byProperty[key].indexOf("CLIENT_APPROVED") !== -1 || byProperty[key].every(function (code) { return code === "DECLINED"; });
    });
  });
  if (!decided.length) return agreements;
  return agreements.map(function (agreement) {
    if (decided.indexOf(agreement) === -1) return agreement;
    var approved = listedOrderIds(agreement).some(function (id) {
      var row = orders.find(function (candidate) { return candidate.id === id; });
      return !!row && latestStateCode(row) === "CLIENT_APPROVED";
    });
    return Object.assign({}, agreement, { states: agreement.states.concat({ code: approved ? "AWAITING_CLIENT_DETAILS" : "CANCELED" }) });
  });
}

function listedOrderIds(agreement) {
  var buckets = agreement && agreement.attributes || {};
  var ids = [];
  Object.keys(buckets).forEach(function (key) {
    var entry = buckets[key] && buckets[key].ORDERS;
    var value = entry ? entry.value : null;
    (Array.isArray(value) ? value : []).forEach(function (id) {
      var parsed = positiveInteger(id);
      if (parsed && ids.indexOf(parsed) === -1) ids.push(parsed);
    });
  });
  return ids;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function coded(code) {
  var error = new Error(code);
  error.code = code;
  return error;
}

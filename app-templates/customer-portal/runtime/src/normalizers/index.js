function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function normalizeAuth(raw) {
  return {
    authenticated: !!raw.session.authenticated,
    intendedRoute: raw.session.intendedRoute || null,
    phone: raw.phone || "",
    codeLength: raw.code ? raw.code.length : 0,
  };
}

export function normalizeOrders(raw) {
  return {
    items: clone(raw.orders).map(function (order) {
      return Object.assign({}, order, {
        allowedActions: order.status === "completed"
          ? ["order.bookAgain", "order.downloadInvoice"]
          : ["order.cancel", "order.reschedule", "support.open"],
      });
    }),
    statusMeta: raw.statusMeta,
    technician: raw.technician,
    addresses: raw.addresses,
  };
}

export function normalizeProposals(raw) {
  return {
    proposal: clone(raw.proposal),
    sites: clone(raw.sites).map(function (site) {
      return Object.assign({}, site, {
        allowedActions: ["proposal.selectPlan", "proposal.approve", "proposal.requestRevision", "proposal.decline"],
      });
    }),
    statusMeta: raw.statusMeta,
  };
}

export function normalizeServices(raw) {
  return { items: clone(raw.services) };
}

export function normalizePricing(raw) {
  return {
    plans: [
      { id: "payg", name: "Pay as you go", price: "$0", interval: "visit", cta: "Book any service" },
      { id: "member", name: raw.plan.name, price: "$9", interval: "month", cta: raw.plan.tag },
      { id: "plus", name: raw.plan.plusName, price: "$19", interval: "month", cta: "For multiple properties" },
    ],
    rates: clone(raw.services),
  };
}

export function normalizeProducts(raw) {
  return {
    feature: clone(raw.feature),
    categories: clone(raw.categories),
    items: clone(raw.products).map(function (product) {
      return Object.assign({}, product, { allowedActions: ["cart.addItem"] });
    }),
  };
}

export function normalizeCheckout(raw) {
  return {
    cartItems: clone(raw.cartItems),
    addresses: clone(raw.addresses),
    cards: clone(raw.cards),
    allowedActions: raw.cartItems.length ? ["checkout.placeOrder"] : [],
  };
}

export function normalizeCalendar(raw) {
  return {
    orders: clone(raw.orders),
    stormCalendar: clone(raw.stormCalendar),
  };
}

export function normalizeActivity(raw) {
  return {
    tabs: clone(raw.tabs),
    groups: clone(raw.groups),
  };
}

export function normalizeProfile(raw) {
  return {
    customer: clone(raw.customer),
    addresses: clone(raw.addresses),
    cards: clone(raw.cards),
    preferences: clone(raw.preferences),
    orders: clone(raw.orders),
  };
}

export function normalizeSupport(raw) {
  return {
    customer: clone(raw.customer),
    topics: clone(raw.topics),
    quickReplies: clone(raw.quickReplies),
    messages: clone(raw.messages),
  };
}

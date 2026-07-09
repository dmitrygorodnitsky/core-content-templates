import { fixtureAdapter } from "../adapters/fixture-adapter.js";
import {
  normalizeActivity,
  normalizeAuth,
  normalizeCalendar,
  normalizeCheckout,
  normalizeOrders,
  normalizePricing,
  normalizeProducts,
  normalizeProfile,
  normalizeProposals,
  normalizeServices,
  normalizeSupport,
} from "../normalizers/index.js";

function module(id, normalize) {
  return {
    id: id,
    adapter: fixtureAdapter,
    normalize(raw) {
      return normalize(raw);
    },
  };
}

export const modules = {
  auth: module("auth", normalizeAuth),
  orders: module("orders", normalizeOrders),
  proposals: module("proposals", normalizeProposals),
  services: module("services", normalizeServices),
  pricing: module("pricing", normalizePricing),
  products: module("products", normalizeProducts),
  checkout: module("checkout", normalizeCheckout),
  calendar: module("calendar", normalizeCalendar),
  activity: module("activity", normalizeActivity),
  profile: module("profile", normalizeProfile),
  support: module("support", normalizeSupport),
};

export const openedModuleIds = Object.keys(modules);

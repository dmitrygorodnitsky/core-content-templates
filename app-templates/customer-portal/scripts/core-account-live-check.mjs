import fs from "node:fs/promises";
import process from "node:process";
import { createCoreAccountAdapter } from "../runtime/src/adapters/core-account-adapter.js";
import { createCoreOrdersAdapter } from "../runtime/src/adapters/core-orders-adapter.js";

const accessToken = process.env.SERVICEWAND_BEARER
  || process.env.SERVICEWAND_BEARER_FILE && (await fs.readFile(process.env.SERVICEWAND_BEARER_FILE, "utf8")).trim();
if (!accessToken) throw new Error("Set SERVICEWAND_BEARER or SERVICEWAND_BEARER_FILE to a customer OIDC bearer token");

const origin = new URL(process.env.SERVICEWAND_BASE_URL || "https://dev-1.servicewand.com").origin;
const organization = process.env.SERVICEWAND_ORG || "CALM_HARBOR_SPA_STAGING";
const adapter = createCoreAccountAdapter({ origin });

try {
  const result = await adapter.resolve({
    config: {
      origin,
      organization,
      coreApiBase: "/core",
      accountApiBase: "/core-acct",
      accountTypeCode: process.env.SERVICEWAND_ACCOUNT_TYPE || "SPA_CUSTOMER",
    },
    state: { session: { accessToken, tokenType: "Bearer" } },
  });
  const orders = await createCoreOrdersAdapter({ origin }).load("orders", {
    config: { origin, organization, billApiBase: "/core-bill" },
    state: {
      session: { accessToken, tokenType: "Bearer" },
      customerAccount: result.account,
    },
  });
  console.log(JSON.stringify({
    status: result.state,
    organization: result.organization.code,
    userResolved: Number.isInteger(result.user.id),
    accountResolved: Number.isInteger(result.account.id),
    accountCode: result.account.code,
    accountTypeCode: result.account.typeCode,
    ordersState: orders.state,
    orderCount: orders.items.length,
    orderIds: orders.items.map((order) => order.id),
    orderStatusCodes: orders.items.map((order) => order.statusCode),
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    code: error && error.code || "unknown",
    message: error instanceof Error ? error.message : String(error),
    status: error && error.status || null,
  }, null, 2));
  process.exitCode = 1;
}

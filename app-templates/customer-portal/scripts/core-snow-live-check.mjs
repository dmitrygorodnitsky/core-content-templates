import fs from "node:fs/promises";
import process from "node:process";
import { loadSnowProperties, loadSnowQuotes } from "../runtime/src/adapters/core-snow-adapter.js";
import { resolveCoreAccount } from "../runtime/src/adapters/core-account-adapter.js";
import { contractsPackage, normalizeContracts } from "../runtime/src/normalizers/contracts.js";

const origin = new URL(process.env.SERVICEWAND_BASE_URL || "https://dev-1.servicewand.com").origin;
const organization = process.env.SERVICEWAND_ORG || "SNOWLIMITLESS";
const accountTypeCode = process.env.SERVICEWAND_ACCOUNT_TYPE || "CUSTOMER";

async function fileValue(name) {
  const path = process.env[name];
  return path ? (await fs.readFile(path, "utf8")).trim() : "";
}

async function accessToken() {
  const bearer = process.env.SERVICEWAND_BEARER || (await fileValue("SERVICEWAND_BEARER_FILE"));
  if (bearer) return { token: bearer, kind: "bearer" };
  const apiKey = process.env.SERVICEWAND_API_KEY || (await fileValue("SERVICEWAND_API_KEY_FILE"));
  if (!apiKey) throw new Error("Set SERVICEWAND_BEARER, SERVICEWAND_BEARER_FILE, SERVICEWAND_API_KEY or SERVICEWAND_API_KEY_FILE");
  const resource = await fetch(`${origin}/core/.well-known/oauth-protected-resource`).then((response) => response.json());
  const issuer = resource.authorization_servers?.[0];
  if (!issuer) throw new Error("OAuth issuer missing from protected-resource metadata");
  const openid = await fetch(`${issuer}/.well-known/openid-configuration`).then((response) => response.json());
  const reply = await fetch(openid.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "X-API-Key": apiKey },
    body: new URLSearchParams({ grant_type: "api_key", scope: "openid" }),
  });
  if (!reply.ok) throw new Error(`Token request failed with ${reply.status}`);
  const token = await reply.json();
  if (!token.access_token) throw new Error("Token response carried no access_token");
  return { token: token.access_token, kind: "api-key" };
}

const config = {
  origin,
  organization,
  accountApiBase: "/core-acct",
  accountTypeCode,
  billApiBase: "/core-bill",
  coreApiBase: "/core",
  resourceApiBase: "/core-rm",
};

try {
  const { token, kind } = await accessToken();
  const session = { accessToken: token, tokenType: "Bearer" };

  const forced = Number(process.env.SERVICEWAND_ACCOUNT_ID);
  let account = null;
  let accountSource = null;
  if (Number.isInteger(forced) && forced > 0) {
    account = { id: forced, code: null, displayName: null, typeCode: accountTypeCode };
    accountSource = "SERVICEWAND_ACCOUNT_ID";
  } else {
    const resolved = await resolveCoreAccount({ config, state: { session } }, globalThis.fetch, origin);
    account = resolved.account;
    accountSource = "session";
  }

  const context = { config, state: { session, customerAccount: account } };
  const properties = await loadSnowProperties(context, globalThis.fetch, origin);
  const quotes = await loadSnowQuotes(context, globalThis.fetch, origin);
  const contracts = contractsPackage(normalizeContracts(quotes), properties.items);

  console.log(JSON.stringify({
    tokenKind: kind,
    organization,
    accountId: account.id,
    accountSource,
    properties: {
      state: properties.state,
      scopeMode: properties.scopeMode,
      truncated: properties.truncated,
      count: properties.items.length,
      withAddress: properties.items.filter((item) => item.address).length,
      withCoordinates: properties.items.filter((item) => item.lat != null && item.lon != null).length,
      stateCodes: [...new Set(properties.items.map((item) => item.stateCode))],
      sample: properties.items.slice(0, 3).map((item) => ({ id: item.id, name: item.name, address: item.address, category: item.category })),
    },
    quotes: {
      state: quotes.state,
      scopeMode: quotes.scopeMode,
      reads: quotes.reads,
      rows: {
        agreements: quotes.agreements ? quotes.agreements.length : null,
        orders: quotes.quoteOrders ? quotes.quoteOrders.length : null,
        orderItems: quotes.orderItems ? quotes.orderItems.length : null,
        productPrices: quotes.productPrices ? quotes.productPrices.length : null,
        products: quotes.products ? quotes.products.length : null,
      },
      agreements: contracts.agreements.map((row) => ({ id: row.id, stage: row.agreement.stage, quotes: row.quoteCount, unreadableOrders: row.unreadableOrders })),
      groups: contracts.groups.map((group) => ({ id: group.id, decision: group.decision, orders: group.orders.map((order) => ({ id: order.backendId, status: order.status, lines: order.lines.length, linesState: order.linesState, total: order.money && order.money.total })) })),
      preparing: contracts.preparing,
      partial: contracts.partial,
    },
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    code: error && error.code || "unknown",
    message: error instanceof Error ? error.message : String(error),
    status: error && error.status || null,
  }, null, 2));
  process.exitCode = 1;
}

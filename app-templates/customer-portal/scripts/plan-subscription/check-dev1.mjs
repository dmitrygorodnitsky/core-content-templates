import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { randomUUID, createHash } from 'node:crypto';
import { loadConfig, readDev1Catalog } from './entitlements/prepare.mjs';
import { checkoutEntitlements, fingerprint } from './entitlements/checkout-config.mjs';
import { withPurchaseAccessProbe } from './purchase-access/native-probe.mjs';

// This is an integration test with temporary writes, restricted to dev-1.
assert.ok(process.argv.includes('--apply'), 'Pass --apply to create and clean up synthetic dev-1 test data');
const origin = 'https://dev-1.servicewand.com';
let bearer = process.env.SERVICEWAND_BEARER;
const key = process.env.SERVICEWAND_API_KEY || process.env.DEPLOY_API_KEY;
let authorizedAt = Date.now();
let refreshingAuth = false;
const created = [];
const run = randomUUID().slice(0, 8);
let helperId;
let billHelperId;
const helperCode = 'PLAN_SUBSCRIPTION_TEST_' + run.toUpperCase();
const billHelperCode = 'PLAN_SUBSCRIPTION_BILL_TEST_' + run.toUpperCase();
const checks = [];
const addressStreets = ['123', '456'].map(number => number + ' Plan Subscription ' + run + ' Test Street');
let addressFixturesChecked = false;
let deletedAddressCount = 0;
let ownerId;
let deletedAccountCount = 0;
let deletedOrderCount = 0;
let deletedOrderItemCount = 0;
let deletedInvoiceCount = 0;
let primaryFailure;

async function call(path, { method = 'POST', json, anonymous = false, org = 'SERVICEWAND' } = {}) {
  if (key && bearer && !refreshingAuth && Date.now() - authorizedAt > 600000) {
    refreshingAuth = true;
    try { await auth(true); authorizedAt = Date.now(); }
    finally { refreshingAuth = false; }
  }
  assert.ok(['/core/', '/core-cms/', '/core-pim/', '/core-acct/', '/core-bill/'].some(prefix => path.startsWith(prefix)));
  const options = {
    method, redirect: 'error', signal: AbortSignal.timeout(45000),
    headers: { Connection: 'close', 'Content-Type': 'application/json', 'X-Organization-Code': org,
      ...(!anonymous && bearer ? { Authorization: 'Bearer ' + bearer } : {}) },
    ...(json === undefined ? {} : { body: JSON.stringify(json) }),
  };
  const readOnly = (method === 'GET' && !path.includes('/form/send-event/'))
    || (method === 'POST' && /\/(list|size|get|result|list-transitions)\.json$/.test(path));
  let response;
  for (let attempt = 0; attempt < 4; attempt++) {
    try { response = await fetch(origin + path, { ...options, signal: AbortSignal.timeout(45000) }); break; }
    catch (failure) {
      const beforeRequest = failure.cause?.code === 'UND_ERR_CONNECT_TIMEOUT'
        || (failure.cause?.code === 'ETIMEDOUT' && failure.cause?.syscall === 'connect');
      // Never replay a sent mutation, including GET FormToken links.
      if ((!beforeRequest && !readOnly) || attempt === 3) throw failure;
    }
  }
  const body = await response.text();
  let data;
  try { data = body ? JSON.parse(body) : null; } catch { data = null; }
  // Never include paths or response bodies in failures: a path can contain a token.
  return { status: response.status, data };
}
async function ok(path, options) {
  const result = await call(path, options);
  assert.ok(result.status >= 200 && result.status < 300, 'Core request failed with HTTP ' + result.status);
  return result.data;
}
async function auth(force = false) {
  if (bearer && !force) return;
  assert.ok(key, 'SERVICEWAND_BEARER or SERVICEWAND_API_KEY is required');
  const resource = await ok('/core/.well-known/oauth-protected-resource', { method: 'GET', anonymous: true });
  const issuer = resource.authorization_servers[0];
  assert.equal(new URL(issuer).origin, origin);
  const configResponse = await fetch(issuer.replace(/\/$/, '') + '/.well-known/openid-configuration', { headers: { Connection: 'close' }, signal: AbortSignal.timeout(30000) });
  const oidc = await configResponse.json();
  assert.equal(new URL(oidc.token_endpoint).origin, origin);
  const response = await fetch(oidc.token_endpoint, { method: 'POST', signal: AbortSignal.timeout(30000),
    headers: { Connection: 'close', 'Content-Type': 'application/x-www-form-urlencoded', 'X-API-Key': key },
    body: new URLSearchParams({ grant_type: 'api_key', scope: 'openid' }) });
  assert.equal(response.status, 200, 'Dev-1 authentication failed');
  bearer = (await response.json()).access_token;
  assert.ok(bearer);
}
const list = async (service, entity, code, mappings, org = 'SERVICEWAND') =>
  (await ok(`/${service}/api/${entity}/list.json`, { org, json: {
    filters: [{ property: 'code', operator: '=', value: code }], mappings, offset: 0, pageSize: 10,
  } })).result;
const names = fields => fields.map(name => ({ name }));
const stateMapping = { name: 'states', type: 'collection', mappings: names(['id', 'code']) };
const formTypeMappings = [...names(['id', 'optimistic', 'code', 'isAbstract', 'attributes', 'attributeGroups',
  'attributeOrder', 'nls', 'permissions']), ...['workflow', 'organization'].map(name => ({
  name, type: 'identifier', key: 'id', mappings: names(['id', 'code']),
}))];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function fixtureAddresses() {
  const rows = [];
  for (const street of addressStreets) {
    const data = await ok('/core/api/address/list.json', { org: 'SYSTEM', json: {
      filters: [{ property: 'address1', operator: '=', value: street }],
      mappings: names(['id', 'address1', 'address2', 'city', 'postalCode']), offset: 0, pageSize: 100,
    } });
    assert.ok(data.result.length < 100, 'Unexpectedly many synthetic address matches');
    for (const row of data.result) assert.equal(row.address1, street, 'Address cleanup scope did not match');
    rows.push(...data.result);
  }
  return rows;
}
async function readForm(id) {
  const rows = await ok('/core-cms/api/form/list.json', { json: {
    filters: [{ property: 'id', operator: '=', value: id }],
    mappings: [...names(['id', 'attributes', 'metadata']), stateMapping], offset: 0, pageSize: 10,
  } });
  assert.equal(rows.result.length, 1);
  return rows.result[0];
}
async function fixturePurchases() {
  if (!ownerId || !created.length) return { accounts: [], orders: [] };
  const codes = created.map(id => 'PS' + createHash('sha256').update(ownerId + ':' + id).digest('hex').slice(0, 30).toUpperCase());
  const accounts = (await ok('/core-acct/api/account/list.json', { json: {
    filters: [{ property: 'code', operator: 'IN', type: 'STRING', value: codes.join(',') }],
    mappings: names(['id', 'code', 'metadata', 'nls']), offset: 0, pageSize: 100,
  } })).result;
  for (const account of accounts) {
    assert.ok(created.includes(Number(account.metadata?.PLAN_SUBSCRIPTION?.sourceFormId)), 'Account cleanup scope escaped test Forms');
    assert.equal(account.nls?.en?.NAME, 'PLAN_SUBSCRIPTION integration ' + run, 'Account cleanup scope escaped the test run');
  }
  const orders = accounts.length ? (await ok('/core-bill/api/order/list.json', { json: {
    filters: [{ property: 'account.id', operator: 'IN', type: 'STRING', value: accounts.map(a => a.id).join(',') }],
    mappings: names(['id', 'metadata']), offset: 0, pageSize: 100,
  } })).result : [];
  for (const order of orders) assert.ok(created.includes(Number(order.metadata?.PLAN_SUBSCRIPTION?.sourceFormId)), 'Order cleanup scope escaped test Forms');
  assert.ok(accounts.length < 100 && orders.length < 100);
  return { accounts, orders };
}
async function purchaseAction(name, formId, checkoutDigest, expectFailure = false) {
  const args = [{ formId }, ...(checkoutDigest === undefined ? [] : [{ checkoutDigest }])];
  const job = await ok(`/core/api/script/PLAN_SUBSCRIPTION_WORKFLOW_V11/${name}/exec.json`, { org: 'SYSTEM', json: args });
  for (let attempt = 0; attempt < 80; attempt++) {
    const item = (await ok('/core/api/script/result.json', { org: 'SYSTEM', json: [job] }))[0];
    if (item?.status === 'COMPLETED' || item?.status === 'FAILED') {
      if (expectFailure) { assert.equal(item.status, 'FAILED', 'Purchase action unexpectedly accepted invalid input'); return null; }
      if (item.status === 'FAILED') {
        const frames = JSON.parse(item.result).map(frame => frame.className + '.' + frame.methodName + ':' + frame.lineNumber);
        await fs.writeFile(new URL('../../../../tmp/plan-subscription-checkout-failure.json', import.meta.url),
          JSON.stringify({ job, name, formId, frames }, null, 2), { mode: 0o600 });
      }
      assert.equal(item.status, 'COMPLETED', 'Purchase backend action failed; inspect its execution queue result');
      return JSON.parse(item.result);
    }
    await sleep(300);
  }
  throw new Error('Purchase action timed out; inspect this test run before retrying');
}
async function formState(id, expected) {
  for (let attempt = 0; attempt < 200; attempt++) {
    const form = await readForm(id);
    if (form.states.some(state => state.code === expected)) return form;
    const data = form.metadata?.PLAN_SUBSCRIPTION || {};
    if (expected === 'DRAFT_ORDER_READY' && (data.buyerContinuationError || data.draftPreparationError)) {
      throw new Error('Automatic draft continuation failed: ' + (data.buyerContinuationError || data.draftPreparationError));
    }
    await sleep(300);
  }
  throw new Error('Purchase Form did not reach expected state ' + expected);
}
async function settled(id) {
  for (let attempt = 0; attempt < 250; attempt++) {
    const form = await readForm(id);
    const state = form.states[0]?.code;
    const status = form.metadata?.PLAN_SUBSCRIPTION?.mailStatus;
    if (state === 'PREPARATION_FAILED' || (state === 'AWAITING_EMAIL' && status !== 'PENDING')) return form;
    await sleep(300);
  }
  const last = await readForm(id);
  const d = last.metadata?.PLAN_SUBSCRIPTION || {};
  throw new Error('Test Form ' + id + ' did not settle: ' + last.states.map(s => s.code).join(',') + '; mail=' + d.mailStatus + '; error=' + (d.preparationError || 'none')); 
}
async function execute(functionName, formId) {
  const job = await ok(`/core/api/script/${helperCode}/${functionName}/exec.json`, { json: [{ formId }] });
  for (let attempt = 0; attempt < 40; attempt++) {
    const result = (await ok('/core/api/script/result.json', { json: [job] }))[0];
    if (result?.status === 'COMPLETED') return JSON.parse(result.result);
    if (result?.status === 'FAILED') {
      let location = 'unknown execution failure';
      try { location = JSON.parse(result.result).slice(0, 5).map(frame => frame.className + '.' + frame.methodName).join(', '); } catch {}
      throw new Error('Synthetic test helper failed: ' + location);
    }
    await sleep(300);
  }
  throw new Error('Synthetic test helper timed out');
}

async function billingFixture(functionName, orderId, formId) {
  const job = await ok(`/core/api/script/${billHelperCode}/${functionName}/exec.json`, {
    org: 'SYSTEM', json: orderId === undefined ? [] : [{ orderId }, { formId }, { run }],
  });
  for (let attempt = 0; attempt < 40; attempt++) {
    const item = (await ok('/core/api/script/result.json', { org: 'SYSTEM', json: [job] }))[0];
    if (item?.status === 'COMPLETED') return JSON.parse(item.result);
    if (item?.status === 'FAILED') await fs.writeFile(new URL('../../../../tmp/plan-subscription-billing-fixture-failure.json',import.meta.url),JSON.stringify({functionName,result:item.result},null,2),{mode:0o600});
    assert.notEqual(item?.status, 'FAILED', 'Scoped billing fixture failed');
    await sleep(300);
  }
  throw new Error('Scoped billing fixture timed out');
}

await auth();
console.log('Dev-1 integration: validating types, catalog and synthetic fixture scope');
try {
  const [type] = await list('core-cms', 'form-type', 'PLAN_SUBSCRIPTION', formTypeMappings);
  assert.equal(type.workflow?.code, 'PLAN_SUBSCRIPTION');
  assert.equal(type.organization?.code, 'SERVICEWAND');
  assert.deepEqual(type.attributes.map(attribute => attribute.code).sort(), [
    'PLAN_PRODUCT', 'BILLING_PERIOD', 'ADDON_PRODUCTS', 'COMPANY_NAME', 'COMPANY_ADDRESS',
    'FIRST_NAME', 'LAST_NAME', 'EMAIL', 'PHONE', 'SITE_EXPANSION_PACKS', 'WEATHER_PROPERTY_COUNT',
  ].sort());
  assert.equal(type.attributes.length, 11);
  assert.equal(type.attributeGroups.length, 3);
  assert.ok(!type.attributes.some(attribute => attribute.code.startsWith('BILLING_') && attribute.code !== 'BILLING_PERIOD'));
  assert.ok(!type.attributeGroups.some(group => group.code === 'BILLING_DETAILS'));
  const typeBefore = JSON.stringify(type);
  const [script] = await list('core', 'script', 'PLAN_SUBSCRIPTION_WORKFLOW_V11', names(['metadata', 'content']), 'SYSTEM');
  assert.ok(script.content.trimEnd() === (await fs.readFile(new URL('./PLAN_SUBSCRIPTION_WORKFLOW_V11.java', import.meta.url), 'utf8')).trimEnd(), 'Deployed workflow source differs from the checked source');
  assert.equal(script.metadata.LINK_TTL_HOURS, 24);
  assert.equal(script.metadata.DEV_CAPTURE_INVALID_EMAIL, true);
  const productId = async code => { const rows = await list('core-pim', 'product', code, names(['id'])); assert.equal(rows.length, 1); return rows[0].id; };
  const growth = await productId('SERVICEWAND_GROWTH');
  const enterprise = await productId('SERVICEWAND_ENTERPRISE');
  const expansion = await productId('SERVICEWAND_SAAS_PROPERTY_EXT_GROWTH');
  const weather = await productId('SERVICEWAND_WEATHER_INTELLIGENCE');
  const foundationExpansion = await productId('SERVICEWAND_SAAS_PROPERTY_EXT_FOUNDATION');
  const [owner] = await list('core', 'organization', 'SERVICEWAND', names(['id']), 'SYSTEM');
  ownerId = owner.id;
  assert.equal((await fixtureAddresses()).length, 0, 'Synthetic address scope already exists');
  addressFixturesChecked = true;
  const companyAddress = addressStreets[0] + ', Vancouver, BC V6B 1A1, Canada';
  const values = { PLAN_PRODUCT: growth, BILLING_PERIOD: 'MONTHLY', ADDON_PRODUCTS: [],
    COMPANY_NAME: 'PLAN_SUBSCRIPTION integration ' + run,
    COMPANY_ADDRESS: companyAddress,
    EMAIL: 'plan-subscription-test@example.invalid' };
  const payload = overrides => ({ type: { id: type.id }, organization: { id: owner.id },
    attributes: { [type.id]: Object.fromEntries(Object.entries({ ...values, ...overrides }).map(([key, value]) => [key, { value }])) } });
  async function submit(overrides = {}, extra = {}) {
    const result = await call('/core-cms/api/form/submit.json', { anonymous: true, json: { ...payload(overrides), ...extra } });
    if (result.status === 200 && Number.isInteger(result.data)) created.push(result.data);
    return result;
  }
  async function awaiting(overrides = {}, extra = {}) {
    const result = await submit(overrides, extra);
    assert.equal(result.status, 200, 'Valid synthetic submission failed');
    const form = await settled(result.data);
    assert.equal(form.states[0].code, 'AWAITING_EMAIL', 'Valid form did not reach email verification');
    const data = form.metadata.PLAN_SUBSCRIPTION;
    assert.equal(data.mailStatus, 'SUPPRESSED_FOR_DEV_TEST');
    assert.equal(data.expiresAt - data.issuedAt, 86400000);
    assert.equal(data.catalogValidation, 'VALIDATED');
    const address = data.companyAddress;
    assert.equal(address.status, 'RESOLVED');
    assert.equal(address.method, 'QUOTATION_RESOLVE_OR_CREATE');
    assert.equal(address.validation, 'COMPONENTS_ONLY');
    assert.ok(Number.isInteger(address.addressId) && address.addressId > 0);
    assert.ok(addressStreets.includes(address.address1), 'Resolved address escaped the synthetic fixture scope');
    const input = form.attributes[String(type.id)].COMPANY_ADDRESS.value;
    assert.equal(address.sourceDigest, createHash('sha256').update(input.trim()).digest('hex'));
    assert.ok(address.resolvedAt <= data.issuedAt, 'Email token was issued before address resolution');
    assert.ok(typeof data.devCapturedToken === 'string' && /^[a-f0-9-]{36}$/.test(data.devCapturedToken), 'Captured test token has an unexpected format');
    return form;
  }
  const use = (form, method = 'GET') => call('/core-cms/api/form/send-event/' + form.metadata.PLAN_SUBSCRIPTION.devCapturedToken + '.json', {
    method, anonymous: true, ...(method === 'POST' ? { json: {} } : {}),
  });

  async function confirmationReady(id, expectedIdentity = 'SYSTEM') {
    for (let attempt = 0; attempt < 180; attempt++) {
      const form = await readForm(id);
      const data = form.metadata?.PLAN_SUBSCRIPTION;
      if (data?.confirmation?.devCapturedToken) {
        assert.equal(form.states[0].code, 'CHECKOUT_PREPARED');
        assert.equal(data.confirmation.mailStatus, 'SUPPRESSED_FOR_DEV_TEST');
        assert.equal(data.confirmation.expiresAt - data.confirmation.issuedAt, 86400000);
        assert.equal(data.confirmation.checkoutDigest, data.checkout.checkoutDigest);
        assert.equal(data.confirmation.formId, id);
        assert.equal(data.checkout.executionIdentity, expectedIdentity);
        assert.equal(data.checkout.executionSystemAdmin, expectedIdentity === 'OPERATOR');
        return form;
      }
      if (data?.buyerContinuationError) throw new Error('Automatic buyer continuation failed: ' + data.buyerContinuationError);
      await sleep(300);
    }
    throw new Error('Automatic Checkout or confirmation email did not settle');
  }
  const confirmLink = (form, method = 'GET', json) => call('/core-cms/api/form/send-event/' + form.metadata.PLAN_SUBSCRIPTION.confirmation.devCapturedToken + '.json', {
    method, anonymous: true, ...(method === 'POST' ? { json: json || {} } : {}),
  });

  const [category] = await list('core', 'script-category', 'WORKFLOW', names(['id']), 'SYSTEM');
  const [system] = await list('core', 'organization', 'SYSTEM', names(['id']), 'SYSTEM');
  const helper = { code: helperCode, language: 'Java', executable: true, category: { id: category.id }, organization: { id: system.id },
    nls: { en: { NAME: 'Temporary synthetic subscription expiry test' } },
    content: await fs.readFile(new URL('./verification-test-helper.java', import.meta.url), 'utf8'),
    metadata: { CAPABILITIES: ['CORE', 'CORE-CMS'], FUNCTIONS: ['expire', 'expireConfirmation', 'used', 'unresolve', 'staleCheckout', 'forgetReceipt', 'forgetBasePlanReceipt',
      'staleFeature', 'staleLevel', 'staleCapacity', 'staleWeather', 'staleMapping', 'legacyCheckout'].map(name => ({ name, parameters: [{ name: 'formId', type: 'java.lang.Integer', required: true }] })) } };
  [helperId] = await ok('/core/api/script/save.json', { org: 'SYSTEM', json: { entities: [helper], mappings: Object.keys(helper).map(name =>
    ['category', 'organization'].includes(name) ? { name, type: 'identifier', key: 'id' } : { name }) } });
  const billHelper = { ...helper, code: billHelperCode,
    content: process.argv.includes('--purchase-access-only') ? await withPurchaseAccessProbe(await fs.readFile(new URL('./base-plan-test-helper.java', import.meta.url), 'utf8')) : await fs.readFile(new URL('./base-plan-test-helper.java', import.meta.url), 'utf8'),
    metadata: { CAPABILITIES: ['CORE', 'CORE-BILL', 'CORE-PIM', 'CORE-ACCT'], FUNCTIONS: [{ name: 'inspectConfiguration', parameters: [] }, ...['emptyWithStaleSnapshot', 'restoreSnapshot', 'unlockPreparedInvoiceCleanup', ...(process.argv.includes('--purchase-access-only') ? ['verifyPurchaseReadGrant'] : [])].map(name => ({ name, parameters: [
      { name: 'orderId', type: 'java.lang.Integer', required: true }, { name: 'formId', type: 'java.lang.Integer', required: true },
      { name: 'run', type: 'java.lang.String', required: true },
    ] }))] } };
  [billHelperId] = await ok('/core/api/script/save.json', { org: 'SYSTEM', json: { entities: [billHelper], mappings: Object.keys(billHelper).map(name =>
    ['category', 'organization'].includes(name) ? { name, type: 'identifier', key: 'id' } : { name }) } });
  assert.equal(await billingFixture('inspectConfiguration'), true, 'Billing fixture runtime is not ready');

  if (process.argv.includes('--purchase-access-only')) {
    const config=(await list('core','script','PLAN_SUBSCRIPTION_DRAFT_V5',names(['metadata']),'SYSTEM'))[0].metadata.PURCHASE_READ_ACCESS_CONFIG;
    assert.equal(config.pageUrl,undefined,'This focused checkpoint expects no buyer page: it must not email a placeholder');
    const draft=await awaiting();await use(draft,'POST');const review=await confirmationReady(draft.id);
    await confirmLink(review,'POST');const ready=await formState(draft.id,'DRAFT_ORDER_READY');
    const digest=review.metadata.PLAN_SUBSCRIPTION.checkout.checkoutDigest;
    const prepared=await purchaseAction('prepareOnboarding',draft.id,digest);
    await fs.writeFile(new URL('../../../../tmp/plan-subscription-magic-onboarding-result.json',import.meta.url),JSON.stringify(prepared,null,2),{mode:0o600});
    assert.equal(prepared.status,'AWAITING_PAYMENT');
    const status=await purchaseAction('deliverPurchaseReadAccess',draft.id,digest);
    assert.equal(status.status,'WAITING_FOR_PURCHASE_PAGE_URL');assert.equal(status.paymentEnabled,false);
    assert.ok(!status.grantId && !status.token && !status.link);
    const repeated=await purchaseAction('deliverPurchaseReadAccess',draft.id,digest);
    assert.deepEqual(repeated,status);
    const read=await purchaseAction('readPurchaseReadAccess',draft.id,digest);assert.deepEqual(read,status);
    const rows=(await ok('/core-bill/api/order/list.json',{json:{filters:[{property:'id',operator:'=',value:ready.metadata.PLAN_SUBSCRIPTION.purchase.orderId}],mappings:names(['id','metadata']),offset:0,pageSize:2}})).result;
    assert.equal(rows.length,1);assert.equal(rows[0].metadata.PLAN_SUBSCRIPTION_READ_ACCESS.status,'WAITING_FOR_PURCHASE_PAGE_URL');
    if(prepared.status==='AWAITING_PAYMENT')assert.ok(rows[0].metadata.PLAN_SUBSCRIPTION_ONBOARDING,'Read-access receipt discarded frozen onboarding plan');
    await purchaseAction('deliverPurchaseReadAccess',draft.id,'0'.repeat(64),true);
    const anonymous=await call('/core/api/script/PLAN_SUBSCRIPTION_WORKFLOW_V11/deliverPurchaseReadAccess/exec.json',{anonymous:true,json:[{formId:draft.id},{checkoutDigest:digest}]});
    assert.ok([401,403].includes(anonymous.status));
    const nativeGrant=await billingFixture('verifyPurchaseReadGrant',rows[0].id,draft.id);
    await fs.writeFile(new URL('../../../../tmp/plan-subscription-magic-native-grant-result.json',import.meta.url),JSON.stringify(nativeGrant,null,2),{mode:0o600});
    assert.ok(nativeGrant.grantId,'Native grant probe did not return cleanup reference');
    await ok('/core-bill/api/grant/delete.json',{method:'DELETE',org:'SYSTEM',json:[nativeGrant.grantId]});
    assert.equal(nativeGrant.passed,true,'Native grant check failed: '+nativeGrant.check);
    assert.equal(nativeGrant.itemsChecked,1);
    checks.push('confirmed FormToken workflow prepares draft and safe read-access waiting receipt; retries preserve it and frozen onboarding metadata');
    checks.push('invalid digest and anonymous internal Script API cannot issue purchase access; no page placeholder, buyer User or email created');
    checks.push('actual private issuer and mapping policy: anonymous Order/Item reads succeed; other Order, writes, workflow events and revoked credential denied');
  } else if (process.argv.includes('--entitlements-only')) {
    const config = await loadConfig(), catalog = await readDev1Catalog(bearer);
    const addonFields = { ADDON_PRODUCTS: [expansion, weather], SITE_EXPANSION_PACKS: 2, WEATHER_PROPERTY_COUNT: 10 };
    const expected = checkoutEntitlements(catalog, config, { planCode: 'SERVICEWAND_GROWTH', billingPeriod: 'MONTHLY',
      addons: [{ productCode: 'SERVICEWAND_SAAS_PROPERTY_EXT_GROWTH', quantity: 2 }, { productCode: 'SERVICEWAND_WEATHER_INTELLIGENCE', quantity: 10 }] });
    const readOrder = async id => (await ok('/core-bill/api/order/list.json', { json: {
      filters: [{ property: 'id', operator: '=', value: id }], mappings: [...names(['id', 'metadata']), stateMapping], offset: 0, pageSize: 10,
    } })).result[0];
    let successful = 0;
    async function assertDraft(review) {
      const ready = await formState(review.id, 'DRAFT_ORDER_READY'), data = ready.metadata.PLAN_SUBSCRIPTION;
      assert.equal(data.purchase.entitlementFingerprint, data.checkout.entitlementFingerprint);
      assert.deepEqual(data.purchase.entitlementSnapshot, data.checkout.preview.entitlements);
      const order = await readOrder(data.purchase.orderId);
      assert.equal(order.states[0].code, 'DRAFT');
      assert.equal(order.metadata.PLAN_SUBSCRIPTION.entitlementFingerprint, data.checkout.entitlementFingerprint);
      assert.deepEqual(order.metadata.PLAN_SUBSCRIPTION.planPreview.entitlements, data.checkout.preview.entitlements);
      assert.equal(data.purchase.paymentEnabled, false);
      assert.equal(data.purchase.executionSystemAdmin, false); assert.equal(data.purchase.billingSystemAdmin, false);
      const repeated = await purchaseAction('confirmPurchase', review.id, data.checkout.checkoutDigest);
      assert.equal(repeated.orderId, data.purchase.orderId);
      assert.equal(repeated.entitlementFingerprint, data.checkout.entitlementFingerprint);
      assert.equal(await execute('forgetReceipt', review.id), true);
      const recovered = await purchaseAction('confirmPurchase', review.id, data.checkout.checkoutDigest);
      assert.equal(recovered.orderId, repeated.orderId);
      assert.deepEqual(recovered.entitlementSnapshot, data.checkout.preview.entitlements);
      successful++;
      assert.equal((await fixturePurchases()).accounts.length, successful);
    }
    const normal = await awaiting(addonFields); await use(normal);
    const normalReview = await confirmationReady(normal.id), normalCheckout = normalReview.metadata.PLAN_SUBSCRIPTION.checkout;
    assert.deepEqual(normalCheckout.preview.entitlements, expected, 'Java snapshot differs from independent catalog projection');
    assert.equal(normalCheckout.entitlementFingerprint, fingerprint(expected));
    const repeated = await purchaseAction('prepareCheckout', normal.id);
    assert.equal(repeated.checkout.checkoutDigest, normalCheckout.checkoutDigest);
    assert.equal((await readForm(normal.id)).metadata.PLAN_SUBSCRIPTION.confirmation.tokenId, normalReview.metadata.PLAN_SUBSCRIPTION.confirmation.tokenId);
    await Promise.all([confirmLink(normalReview), confirmLink(normalReview, 'POST', { entitlementSnapshot: {}, entitlementFingerprint: '0'.repeat(64), organizationId: 1 })]);
    await assertDraft(normalReview);
    checks.push('native Entitlements match independent current-catalog projection, enter Checkout/Order/receipt, ignore request overrides and survive concurrent confirmation/recovery without duplicate purchase');
    for (const fixture of ['staleFeature', 'staleLevel', 'staleCapacity', 'staleWeather', 'staleMapping', 'legacyCheckout']) {
      console.log('Dev-1 Entitlements integration: ' + fixture);
      const form = await awaiting(addonFields); await use(form); await confirmationReady(form.id);
      assert.equal(await execute(fixture, form.id), true);
      const stale = await readForm(form.id);
      await confirmLink(stale, 'POST', { catalogFingerprint: normalCheckout.catalogFingerprint, entitlements: expected });
      const refused = await readForm(form.id);
      assert.equal(refused.states[0].code, 'CHECKOUT_PREPARED', fixture + ' advanced despite catalog mismatch');
      assert.ok(!refused.metadata.PLAN_SUBSCRIPTION.confirmation.authorizedAt, fixture + ' recorded consent');
      assert.equal((await fixturePurchases()).accounts.length, successful, fixture + ' created a purchase');
      if (fixture === 'staleFeature' || fixture === 'legacyCheckout') {
        await purchaseAction('prepareCheckout', form.id);
        const refreshed = await confirmationReady(form.id, 'OPERATOR');
        assert.notEqual(refreshed.metadata.PLAN_SUBSCRIPTION.confirmation.tokenId, stale.metadata.PLAN_SUBSCRIPTION.confirmation.tokenId);
        assert.deepEqual(refreshed.metadata.PLAN_SUBSCRIPTION.checkout.preview.entitlements, expected);
        await confirmLink(stale);
        assert.equal((await readForm(form.id)).states[0].code, 'CHECKOUT_PREPARED', 'Old link authorized refreshed Checkout');
        const same = await purchaseAction('prepareCheckout', form.id);
        assert.equal(same.checkout.entitlementFingerprint, fingerprint(expected));
        assert.equal((await readForm(form.id)).metadata.PLAN_SUBSCRIPTION.confirmation.tokenId, refreshed.metadata.PLAN_SUBSCRIPTION.confirmation.tokenId);
        await confirmLink(refreshed); await assertDraft(refreshed);
      }
      checks.push(fixture + ': internally rehashed old review is rejected before consent/draft creation against a fresh catalog read');
    }
    checks.push('explicit changed/legacy Checkout refresh replaces the one-time confirmation; unchanged refresh does not resend; superseded links cannot authorize the new snapshot');
  } else if (process.argv.includes('--invoice-only')) {
    const invoiceMaps = [...names(['id', 'metadata', 'amountDue', 'totalPaidAmount', 'dueDate']), stateMapping,
      { name: 'order', type: 'identifier', key: 'id', mappings: names(['id']) },
      { name: 'items', type: 'collection', mappings: [...names(['id', 'amount', 'itemCount', 'applicableTaxes', 'totalTaxes', 'grandTotal']),
        { name: 'itemPrice', type: 'identifier', key: 'id', mappings: names(['id']) }] },
      { name: 'payments', type: 'collection', mappings: names(['id']) }];
    const orderMaps = [...names(['id', 'metadata', 'totalCharges', 'totalTaxes', 'grandTotal']), stateMapping,
      { name: 'items', type: 'collection', mappings: names(['id', 'amount', 'itemCount', 'applicableTaxes', 'totalTaxes', 'grandTotal']) }];
    const readOrder = async id => (await ok('/core-bill/api/order/list.json', { json: {
      filters: [{ property: 'id', operator: '=', value: id }], mappings: orderMaps, offset: 0, pageSize: 10,
    } })).result[0];
    const readInvoices = async id => (await ok('/core-bill/api/invoice/list.json', { json: {
      filters: [{ property: 'order.id', operator: '=', value: id }], mappings: invoiceMaps, offset: 0, pageSize: 10,
    } })).result;
    const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.0000001, 'Native monetary calculation differs from configured rates');
    const results = [];
    for (const scenario of [
      { code: 'CA_BC', address: addressStreets[0] + ', Vancouver, BC V6B 1A1, Canada', rateCode: 'CA_BC_HST', period: 'MONTHLY', packs: 2, properties: 10, rounding: 'EXACT_MINOR_UNITS' },
      { code: 'CA_QC', address: addressStreets[0] + ', Montreal, QC H2Y 1C6, Canada', rateCode: 'CA_QC_HST', period: 'YEARLY', packs: 1, properties: 7, rounding: 'ROUNDING_POLICY_REQUIRED' },
      { code: 'US_AK', address: addressStreets[1] + ', Anchorage, AK 99501, US', rateCode: 'US_AK_VAT', period: 'MONTHLY', packs: 1, properties: 3, rounding: 'EXACT_MINOR_UNITS' },
      { code: 'US_NY', address: addressStreets[1] + ', Test City, NY 00501, US', period: 'MONTHLY', packs: 1, properties: 3 },
    ]) {
      console.log('Dev-1 invoice integration: ' + scenario.code + ' ' + scenario.period);
      const form = await awaiting({ BILLING_PERIOD: scenario.period, COMPANY_ADDRESS: scenario.address,
        ADDON_PRODUCTS: [expansion, weather], SITE_EXPANSION_PACKS: scenario.packs, WEATHER_PROPERTY_COUNT: scenario.properties });
      await use(form);
      const review = await confirmationReady(form.id);
      assert.equal(review.metadata.PLAN_SUBSCRIPTION.checkout.executionIdentity, 'SYSTEM');
      if (scenario.code === 'CA_BC') await Promise.all([confirmLink(review), confirmLink(review, 'POST', { amount: 0, invoiceId: 1, sourceFormId: 1, tax: 0 })]);
      else await confirmLink(review, 'POST', { amount: 0, invoiceId: 1, sourceFormId: 1, tax: 0 });
      const ready = await formState(form.id, 'DRAFT_ORDER_READY');
      const purchase = ready.metadata.PLAN_SUBSCRIPTION.purchase;
      assert.equal(purchase.executionIdentity, 'SYSTEM'); assert.equal(purchase.executionSystemAdmin, false);
      assert.equal(purchase.billingExecutionIdentity, 'SYSTEM'); assert.equal(purchase.billingSystemAdmin, false);
      const order = await readOrder(purchase.orderId);
      assert.equal(order.states[0].code, 'DRAFT'); assert.equal(order.items.length, 3);
      const invoices = await readInvoices(order.id);
      if (scenario.rateCode) {
        const [rate] = await list('core', 'dictionary', scenario.rateCode, names(['id', 'attributes']), 'SYSTEM');
        const rateValue = Number(Object.values(rate.attributes).map(a => a.PERCENTAGE?.value).find(x => x !== undefined));
        assert.ok(Number.isFinite(rateValue));
        assert.equal(purchase.invoiceStatus, 'DRAFT_INVOICE_READY');
        assert.equal(invoices.length, 1);
        const invoice = invoices[0]; assert.equal(invoice.id, purchase.invoiceId);
        assert.deepEqual(invoice.states.map(s => s.code), ['DRAFT']);
        assert.equal(invoice.order.id, order.id); assert.equal(invoice.payments.length, 0); assert.equal(invoice.totalPaidAmount, 0);
        assert.ok(invoice.dueDate == null, 'An unapproved payment term was invented');
        assert.deepEqual(invoice.items.map(i => i.id).sort(), order.items.map(i => i.id).sort(), 'Invoice copied or lost native OrderItems');
        assert.equal(purchase.invoicePreparation.tax.status, 'CONFIGURED_RATES_APPLIED');
        assert.equal(purchase.invoicePreparation.tax.roundingStatus, scenario.rounding);
        for (const item of order.items) {
          assert.equal(Number(item.applicableTaxes[rate.id]), rateValue);
          close(item.totalTaxes, item.amount * item.itemCount * rateValue / 100);
        }
        close(order.totalTaxes, order.totalCharges * rateValue / 100);
        close(order.grandTotal, order.totalCharges + order.totalTaxes);
        close(invoice.amountDue, order.grandTotal);
        assert.equal(invoice.metadata.PLAN_SUBSCRIPTION.preparationOnly, true);
        assert.equal(invoice.metadata.PLAN_SUBSCRIPTION.paymentEnabled, false);
        console.log(JSON.stringify({scenario: scenario.code, subtotal: order.totalCharges, rate: rateValue,
          nativeTax: order.totalTaxes, nativeInvoiceAmount: invoice.amountDue, rounding: scenario.rounding}));
        const repeated = await purchaseAction('prepareInvoice', form.id, review.metadata.PLAN_SUBSCRIPTION.checkout.checkoutDigest);
        assert.equal(repeated.invoiceId, invoice.id);
        assert.deepEqual(repeated.itemIds, purchase.itemIds);
        assert.equal((await readInvoices(order.id)).length, 1);
        if (scenario.code === 'CA_BC') {
          assert.equal(await execute('forgetReceipt', form.id), true);
          const recovered = await purchaseAction('prepareInvoice', form.id, review.metadata.PLAN_SUBSCRIPTION.checkout.checkoutDigest);
          assert.equal(recovered.invoiceId, invoice.id); assert.deepEqual(recovered.itemIds, purchase.itemIds);
          const item = order.items[0];
          await call('/core-bill/api/order-item/save.json', { json: { entities: [{ id: item.id, itemCount: 999 }], mappings: names(['id', 'itemCount']) } });
          assert.equal((await readOrder(order.id)).items.find(i => i.id === item.id).itemCount, item.itemCount, 'Prepared invoice was repriced by an item edit');
          await call('/core-bill/api/invoice/save.json', { json: { entities: [{ id: invoice.id, items: [{ id: order.items[0].id }] }],
            mappings: [{ name: 'id' }, { name: 'items', type: 'collection', mappings: names(['id']) }] } });
          assert.equal((await readInvoices(order.id))[0].items.length, 3, 'Invoice subset edit removed shared OrderItems');
          await call(`/core-bill/api/invoice/${invoice.id}/send-event.json?event=DRAFT-SUBMITTED`, { json: {} });
          assert.equal((await readInvoices(order.id))[0].states[0].code, 'DRAFT', 'Preparation invoice was submitted');
          await call('/core-bill/api/invoice/delete.json', { method: 'DELETE', json: [invoice.id] });
          assert.equal((await readInvoices(order.id)).length, 1, 'Invoice deletion destroyed shared order lines');
          await call('/core-bill/api/order/delete.json', { method: 'DELETE', json: [order.id] });
          assert.ok(await readOrder(order.id), 'Order with a prepared invoice was deleted');
          checks.push('prepared invoice/item snapshot rejects repricing, subset edits, Submit and unsafe Invoice/Order deletion');
          checks.push('concurrent-safe explicit preparation and lost CMS receipt recovery reuse the same Invoice and all OrderItems');
        }
        checks.push(scenario.code + ': existing Order tax hook and native OrderItem totals produce one complete unpaid DRAFT Invoice; ' + scenario.rounding);
      } else {
        assert.equal(purchase.invoiceStatus, 'TAX_CONFIGURATION_REQUIRED');
        assert.equal(invoices.length, 0, 'Missing tax configuration produced a zero-tax invoice');
        const repeated = await purchaseAction('prepareInvoice', form.id, review.metadata.PLAN_SUBSCRIPTION.checkout.checkoutDigest);
        assert.equal(repeated.orderId, order.id); assert.equal(repeated.invoiceStatus, 'TAX_CONFIGURATION_REQUIRED');
        assert.equal((await readInvoices(order.id)).length, 0);
        checks.push('US_NY: missing tax configuration keeps the existing Order DRAFT without inventing a zero rate or creating an Invoice');
      }
      results.push({form: form.id, order: order.id, invoice: purchase.invoiceId || null});
    }
    assert.equal((await fixturePurchases()).accounts.length, 4);
    console.log(JSON.stringify({invoiceScenarios: results, realEmailsSent: 0, paymentApiCalls: 0}));

  } else {
  const unavailable = async code => (await list('core-pim', 'product', code, names(['id'])))[0].id;
  const routing = await unavailable('SERVICEWAND_ROUTE_CREDITS_GROWTH');
  const oldRouting = await productId('SERVICEWAND_SAAS_ROUTING_EXT_GROWTH');
  const reports = await unavailable('SERVICEWAND_CUSTOM_REPORTS');
  for (const [label, fields] of [
    ['missing expansion quantity', { ADDON_PRODUCTS: [expansion] }],
    ['missing Weather quantity', { ADDON_PRODUCTS: [weather] }],
    ['negative quantity', { SITE_EXPANSION_PACKS: -1 }],
    ['fractional quantity', { WEATHER_PROPERTY_COUNT: 1.5 }],
    ['quantity without selection', { SITE_EXPANSION_PACKS: 1 }],
    ['incompatible expansion', { ADDON_PRODUCTS: [foundationExpansion], SITE_EXPANSION_PACKS: 1 }],
    ['Weather above capacity', { ADDON_PRODUCTS: [weather], WEATHER_PROPERTY_COUNT: 201 }],
    ['excluded new Routing', { ADDON_PRODUCTS: [routing] }],
    ['excluded old Routing', { ADDON_PRODUCTS: [oldRouting] }],
    ['excluded Custom Reports', { ADDON_PRODUCTS: [reports] }],
  ]) {
    console.log("Dev-1 integration: reject " + label);
    const result = await submit(fields);
    if (result.status === 200) {
      const rejected = await settled(result.data);
      assert.equal(rejected.states[0].code, 'PREPARATION_FAILED', label + ' accepted');
      assert.ok(!rejected.metadata.PLAN_SUBSCRIPTION.tokenId, label + ' issued email token');
    } else assert.ok(result.status >= 400, label + ' accepted');
    checks.push('reject ' + label);
  }
  const direct = await awaiting();
  const directAddress = direct.metadata.PLAN_SUBSCRIPTION.companyAddress;
  assert.equal(directAddress.countryCode, 'CA');
  assert.equal(directAddress.regionCode, 'BC');
  assert.equal(directAddress.city, 'Vancouver');
  assert.equal(directAddress.postalCode, 'V6B 1A1');
  const persistedAddress = (await fixtureAddresses()).find(row => row.id === directAddress.addressId);
  assert.ok(persistedAddress, 'Resolved address was not persisted');
  assert.equal(persistedAddress.postalCode, 'V6B 1A1');
  checks.push('CA components resolved before token issuance and persisted in native Address; source text preserved');
  const directResponse = await call(`/core-cms/api/form/${direct.id}/send-event.json?event=VERIFY_EMAIL`, { anonymous: true, json: {} });
  const afterDirect = await readForm(direct.id);
  assert.equal(afterDirect.states[0].code, 'AWAITING_EMAIL', 'Anonymous direct event bypassed the token');
  assert.ok(!afterDirect.metadata.PLAN_SUBSCRIPTION.verifiedAt);
  checks.push('anonymous direct event blocked; native HTTP ' + directResponse.status);

  const [workflow] = await list('core', 'workflow', 'PLAN_SUBSCRIPTION', [
    { name: 'states', type: 'collection', mappings: names(['id', 'code']) }, { name: 'id' },
  ]);
  const verifiedState = workflow.states.find(state => state.code === 'EMAIL_VERIFIED_MODEL_PENDING');
  const serverData = direct.metadata.PLAN_SUBSCRIPTION;
  const forged = await submit({}, { workflow: { id: workflow.id }, states: [{ id: verifiedState.id }], metadata: { PLAN_SUBSCRIPTION: {
    inputDigest: serverData.inputDigest, emailDigest: serverData.emailDigest, tokenId: serverData.tokenId,
    issuedAt: serverData.issuedAt, expiresAt: serverData.expiresAt, verifiedAt: Date.now(),
  } } });
  if (forged.status === 200) {
    let saved = await readForm(forged.data);
    assert.ok(!saved.states.some(state => state.code === 'EMAIL_VERIFIED_MODEL_PENDING'), 'Anonymous submission accepted a forged verified state');
    if (saved.states.some(state => state.code === 'SUBMITTED')) saved = await settled(forged.data);
    assert.ok(!saved.metadata.PLAN_SUBSCRIPTION.verifiedAt, 'Anonymous submission accepted a forged verification marker');
  }
  checks.push('forged initial state and verification metadata rejected/reset');

  console.log('Dev-1 integration: intake checks passed; exercising email token and automatic SYSTEM Checkout');
  const valid = await awaiting({ ADDON_PRODUCTS: [expansion, weather], SITE_EXPANSION_PACKS: 2, WEATHER_PROPERTY_COUNT: 10 });
  assert.equal(valid.metadata.PLAN_SUBSCRIPTION.companyAddress.addressId, directAddress.addressId,
    'Repeated company address created another Address');
  assert.equal((await use(valid)).status, 200, 'Native anonymous verification failed');
  const verified = await readForm(valid.id);
  assert.ok(['EMAIL_VERIFIED_MODEL_PENDING', 'CHECKOUT_PREPARED'].includes(verified.states[0].code));
  assert.ok(verified.metadata.PLAN_SUBSCRIPTION.verifiedAt);
  const usage = await execute('used', valid.id);
  assert.deepEqual(usage, { found: true, typeMatches: true, ownerMatches: true, emailMatches: true, labelMatches: true, used: true }, 'Native service did not consume the token of the synthetic form');
  const replay = await use(valid);
  assert.ok([410, 500].includes(replay.status), 'Consumed token was accepted again');
  assert.equal((await readForm(valid.id)).metadata.PLAN_SUBSCRIPTION.verifiedAt, verified.metadata.PLAN_SUBSCRIPTION.verifiedAt);
  checks.push('single COMPANY_ADDRESS without billing fields: anonymous submit, 24h TTL, native consumption, deferred catalog; replay HTTP ' + replay.status);

  if (!process.argv.includes('--purchase-only')) {
  const expired = await awaiting();
  assert.equal(await execute('expire', expired.id), true);
  assert.ok((await readForm(expired.id)).metadata.PLAN_SUBSCRIPTION.expiresAt < expired.metadata.PLAN_SUBSCRIPTION.issuedAt, 'Expiry test did not persist its expired timestamp');
  const expiryResponse = await use(expired, 'POST');
  const afterExpiry = await readForm(expired.id);
  assert.equal(afterExpiry.states[0].code, 'AWAITING_EMAIL', 'Expired token advanced the workflow; HTTP ' + expiryResponse.status);
  assert.ok(!afterExpiry.metadata.PLAN_SUBSCRIPTION.verifiedAt, 'Expired token marked the email as verified');
  checks.push('expiry blocks verification; native HTTP ' + expiryResponse.status);

  const racing = await awaiting();
  const attempts = await Promise.all([use(racing), use(racing, 'POST')]);
  const raced = await readForm(racing.id);
  assert.ok(['EMAIL_VERIFIED_MODEL_PENDING', 'CHECKOUT_PREPARED'].includes(raced.states[0].code));
  assert.ok(raced.metadata.PLAN_SUBSCRIPTION.verifiedAt);
  const history = await ok(`/core-cms/api/form/${racing.id}/list-transitions.json`, { json: {
    mappings: [{ name: 'id' }, { name: 'state', type: 'identifier', key: 'id', mappings: names(['id', 'code']) }], offset: 0, pageSize: 100,
  } });
  assert.equal(history.result.filter(row => row.state?.code === 'EMAIL_VERIFIED_MODEL_PENDING').length, 1,
    'Concurrent requests produced multiple verification transitions');
  assert.equal((await execute('used', racing.id)).used, true);
  checks.push('concurrent consumption: one verification transition; native HTTP ' + attempts.map(result => result.status).sort().join('/'));

  const unresolved = await awaiting();
  assert.equal(await execute('unresolve', unresolved.id), true);
  await use(unresolved);
  const afterUnresolved = await readForm(unresolved.id);
  assert.equal(afterUnresolved.states[0].code, 'AWAITING_EMAIL');
  assert.ok(!afterUnresolved.metadata.PLAN_SUBSCRIPTION.verifiedAt, 'Missing address resolution allowed email confirmation');
  checks.push('email confirmation refuses a missing current address-resolution marker');

  const unit4 = await awaiting({ COMPANY_ADDRESS: 'Suite 4, ' + companyAddress });
  const unit4Again = await awaiting({ COMPANY_ADDRESS: 'Unit 4 - ' + companyAddress });
  const unit5 = await awaiting({ COMPANY_ADDRESS: 'Suite 5, ' + companyAddress });
  const unitAddress = form => form.metadata.PLAN_SUBSCRIPTION.companyAddress;
  assert.equal(unitAddress(unit4).address2, 'UNIT 4');
  assert.equal(unitAddress(unit4Again).addressId, unitAddress(unit4).addressId);
  assert.notEqual(unitAddress(unit4).addressId, unitAddress(unit5).addressId, 'Different units were merged');
  assert.notEqual(unitAddress(unit4).addressId, directAddress.addressId, 'Unit was merged into building-only address');
  checks.push('native address reuse preserves distinct units; equivalent unit formats resolve to one ID');

  for (const [label, overrides] of [['whitespace company', { COMPANY_NAME: '  ' }], ['email format', { EMAIL: 'invalid@' }],
    ['multiple email recipients', { EMAIL: 'plan-subscription-test,other@example.invalid' }],
    ['billing period', { BILLING_PERIOD: 'WEEKLY' }],
    ['missing company address', { COMPANY_ADDRESS: null }], ['blank company address', { COMPANY_ADDRESS: '   ' }],
    ['non-string company address', { COMPANY_ADDRESS: { city: 'Vancouver' } }],
    ['control character in company address', { COMPANY_ADDRESS: '123 Test Street\nVancouver' }],
    ['oversized company address', { COMPANY_ADDRESS: 'X'.repeat(4097) }],
    ['unresolvable address', { COMPANY_ADDRESS: 'not an address' }],
    ['missing address country', { COMPANY_ADDRESS: addressStreets[0] + ', Vancouver' }],
    ['missing address city', { COMPANY_ADDRESS: addressStreets[0] + ', BC V6B 1A1, Canada' }],
    ['missing address postal code', { COMPANY_ADDRESS: addressStreets[0] + ', Vancouver, BC, Canada' }],
    ['unknown address province', { COMPANY_ADDRESS: addressStreets[0] + ', Vancouver, ZZ V6B 1A1, Canada' }],
    ['invalid address postal code', { COMPANY_ADDRESS: addressStreets[0] + ', Vancouver, BC Z0Z 0Z0, Canada' }],
    ['address country/postal conflict', { COMPANY_ADDRESS: addressStreets[0] + ', Vancouver, BC 00501, Canada' }],
    ['duplicate add-ons', { ADDON_PRODUCTS: [expansion, expansion] }], ['plan as add-on', { ADDON_PRODUCTS: [enterprise] }],
    ['enterprise', { PLAN_PRODUCT: enterprise }], ['unknown product', { PLAN_PRODUCT: 2147483646 }]]) {
    const result = await submit(overrides);
    if (result.status === 200) {
      const rejected = await settled(result.data);
      assert.equal(rejected.states[0].code, 'PREPARATION_FAILED', label + ' was accepted');
      assert.ok(!rejected.metadata.PLAN_SUBSCRIPTION.tokenId, label + ' issued a token');
      assert.equal(rejected.metadata.PLAN_SUBSCRIPTION.companyAddress.status, 'FAILED');
    } else assert.ok(result.status >= 400, label + ' was accepted');
    checks.push('reject ' + label);
  }

  }

  const usAddress = addressStreets[1] + ', Test City, NY 00501, US';
  const usFields = { BILLING_PERIOD: 'YEARLY', COMPANY_ADDRESS: usAddress,
    ADDON_PRODUCTS: [expansion, weather], SITE_EXPANSION_PACKS: 1, WEATHER_PROPERTY_COUNT: 7,
    FIRST_NAME: 'Alex', LAST_NAME: 'Tester', PHONE: '+1 604 555 0100' };
  const us = await awaiting(usFields);
  assert.equal(us.metadata.PLAN_SUBSCRIPTION.companyAddress.countryCode, 'US');
  assert.equal(us.metadata.PLAN_SUBSCRIPTION.companyAddress.regionCode, 'NY');
  assert.equal(us.metadata.PLAN_SUBSCRIPTION.companyAddress.postalCode, '00501');
  assert.equal(us.attributes[String(type.id)].COMPANY_ADDRESS.value, usAddress, 'Company address text was not preserved');
  const changed = payload({ ...usFields, EMAIL: 'changed@example.invalid' });
  changed.id = us.id;
  const update = await call('/core-cms/api/form/save.json', { json: { entities: [changed], mappings: names(['id', 'attributes']) } });
  assert.ok(update.status >= 400, 'Changing an email preserved verification');
  const unchanged = await readForm(us.id);
  assert.equal(unchanged.attributes[String(type.id)].EMAIL.value, values.EMAIL, 'Rejected email update still modified the saved purchase');
  const changedAddress = payload({ ...usFields, COMPANY_ADDRESS: values.COMPANY_ADDRESS });
  changedAddress.id = us.id;
  const addressUpdate = await call('/core-cms/api/form/save.json', { json: { entities: [changedAddress], mappings: names(['id', 'attributes']) } });
  assert.ok(addressUpdate.status >= 400, 'Changing the company address preserved verification');
  assert.equal((await readForm(us.id)).attributes[String(type.id)].COMPANY_ADDRESS.value, usAddress,
    'Rejected address update still modified the saved purchase');
  const changedQuantity = payload({ ...usFields, WEATHER_PROPERTY_COUNT: 8 });
  changedQuantity.id = us.id;
  const quantityUpdate = await call('/core-cms/api/form/save.json', { json: { entities: [changedQuantity], mappings: names(['id', 'attributes']) } });
  assert.ok(quantityUpdate.status >= 400, 'Confirmed quantity was editable');
  assert.equal((await readForm(us.id)).attributes[String(type.id)].WEATHER_PROPERTY_COUNT.value, 7);
  checks.push('quantities participate in immutable verified input digest');
  checks.push('single company address text preserved, yearly period, email and company address changes rejected');
  checks.push('US address components resolved; leading-zero ZIP preserved as a string');

  const anonymousCheckout = await call('/core/api/script/PLAN_SUBSCRIPTION_WORKFLOW_V11/prepareCheckout/exec.json', {
    anonymous: true, org: 'SYSTEM', json: [{ formId: valid.id }],
  });
  assert.ok(anonymousCheckout.status >= 400, 'Anonymous caller could access purchase details by Form ID');
  await purchaseAction('prepareCheckout', direct.id, undefined, true);
  assert.equal((await fixturePurchases()).accounts.length, 0, 'Unverified purchase created an Account');
  checks.push('Checkout API requires authentication and verified immutable purchase data');

  const unknownToken = await call('/core-cms/api/form/send-event/' + randomUUID() + '.json', { anonymous: true, method: 'GET' });
  assert.ok(unknownToken.status >= 400);
  const review = await confirmationReady(valid.id);
  const preview = { checkout: review.metadata.PLAN_SUBSCRIPTION.checkout };
  assert.equal(preview.checkout.status, 'PREPARED');
  assert.ok(preview.checkout.preview.totalPayable == null, 'Pending snapshot contains a payable total');
  assert.equal(preview.checkout.preview.catalogValidation, 'VALIDATED');
  assert.ok(preview.checkout.preview.planName);
  assert.ok(preview.checkout.preview.addonNames.length === 2);
  const sourcePrice = (await ok('/core-pim/api/product-price/list.json', { json: {
    filters: [{ property: 'id', operator: '=', value: preview.checkout.preview.priceId }], mappings: names(['id', 'attributes']), offset: 0, pageSize: 10,
  } })).result[0];
  const amount = Object.values(sourcePrice.attributes).flatMap(attrs => Object.entries(attrs)).find(([code]) => code === 'UNIT_PRICE')[1].value;
  assert.equal(preview.checkout.preview.planAmount, String(amount));
  const repeatedPreview = await purchaseAction('prepareCheckout', valid.id);
  assert.equal(repeatedPreview.paymentEnabled, false);
  assert.deepEqual(repeatedPreview.inputs.addonProductIds, [expansion, weather]);
  assert.equal(repeatedPreview.checkout.checkoutDigest, preview.checkout.checkoutDigest);
  assert.equal((await readForm(valid.id)).metadata.PLAN_SUBSCRIPTION.confirmation.tokenId, review.metadata.PLAN_SUBSCRIPTION.confirmation.tokenId,
    'Repeated preview issued a second confirmation email/token');
  assert.equal((await fixturePurchases()).accounts.length, 0, 'Preview created a purchase before confirmation');
  checks.push('Email confirmation automatically prepares Checkout as SYSTEM and queues one separate 24h confirmation link; no purchase yet');

  const anonymousConfirm = await call(`/core-cms/api/form/${valid.id}/send-event.json?event=CONFIRM_PURCHASE`, { anonymous: true, json: {} });
  assert.ok(anonymousConfirm.status >= 400);
  await call(`/core-cms/api/form/${valid.id}/send-event.json?event=CONFIRM_PURCHASE`, { json: {} });
  assert.equal((await readForm(valid.id)).states[0].code, 'CHECKOUT_PREPARED', 'Direct event bypassed one-time confirmation');
  await purchaseAction('confirmPurchase', valid.id, preview.checkout.checkoutDigest, true);
  assert.equal((await fixturePurchases()).accounts.length, 0);
  checks.push('Neither Form ID, an authenticated direct event nor operator Script execution substitutes for native one-time consent');

  const expiredPurchase = await awaiting();
  await use(expiredPurchase);
  const expiredReview = await confirmationReady(expiredPurchase.id);
  assert.equal(await execute('expireConfirmation', expiredPurchase.id), true);
  await confirmLink(expiredReview);
  assert.equal((await readForm(expiredPurchase.id)).states[0].code, 'CHECKOUT_PREPARED');
  assert.ok(!(await readForm(expiredPurchase.id)).metadata.PLAN_SUBSCRIPTION.confirmation.authorizedAt);
  assert.equal((await fixturePurchases()).accounts.length, 0);
  checks.push('Expired purchase confirmation cannot record consent or create Account/Order');

  const stalePurchase = await awaiting();
  await use(stalePurchase);
  const staleReview = await confirmationReady(stalePurchase.id);
  assert.equal(await execute('staleCheckout', stalePurchase.id), true);
  await confirmLink(staleReview, 'POST');
  assert.equal((await readForm(stalePurchase.id)).states[0].code, 'CHECKOUT_PREPARED');
  assert.ok(!(await readForm(stalePurchase.id)).metadata.PLAN_SUBSCRIPTION.confirmation.authorizedAt);
  assert.equal((await fixturePurchases()).accounts.length, 0);
  checks.push('A confirmation link bound to another Checkout snapshot is refused');

  console.log('Dev-1 integration: confirmation guards passed; exercising anonymous concurrent purchase confirmation');
  const refreshed = { checkout: preview.checkout };
  const linkResults = await Promise.all([
    confirmLink(review),
    confirmLink(review, 'POST', { formId: direct.id, organizationId: 1, checkoutDigest: 'f'.repeat(64),
      PLAN_SUBSCRIPTION: { inputDigest: 'forged', purchase: { orderId: 1 } }, price: 0 }),
  ]);
  assert.equal((await readForm(direct.id)).states[0].code, 'AWAITING_EMAIL', 'Request body retargeted a token to a different Form');
  const ready = await formState(valid.id, 'DRAFT_ORDER_READY');
  const confirmations = [ready.metadata.PLAN_SUBSCRIPTION.purchase];
  assert.equal(confirmations[0].executionIdentity, 'SYSTEM');
  assert.equal(confirmations[0].executionSystemAdmin, false);
  assert.equal(confirmations[0].billingExecutionIdentity, 'SYSTEM');
  assert.equal(confirmations[0].billingSystemAdmin, false);
  assert.ok(ready.metadata.PLAN_SUBSCRIPTION.confirmation.authorizedAt);
  assert.equal(confirmations[0].confirmationTokenId, review.metadata.PLAN_SUBSCRIPTION.confirmation.tokenId);
  const consentHistory = await ok(`/core-cms/api/form/${valid.id}/list-transitions.json`, { json: {
    mappings: [{ name: 'id' }, { name: 'state', type: 'identifier', key: 'id', mappings: names(['id', 'code']) }], offset: 0, pageSize: 100,
  } });
  assert.equal(consentHistory.result.filter(row => row.state?.code === 'PURCHASE_CONFIRMATION_RECEIVED').length, 1);
  assert.equal(consentHistory.result.filter(row => row.state?.code === 'DRAFT_ORDER_READY').length, 1);
  const replayPurchase = await confirmLink(review);
  assert.ok(replayPurchase.status >= 400);
  checks.push('Anonymous concurrent GET/POST confirmation is Form/action/snapshot-scoped, ignores forged request metadata and runs billing as SYSTEM; replay refused');
  console.log('Dev-1 integration: anonymous SYSTEM draft created; checking persistence, recovery and Submit guard');
  const confirmed = await formState(valid.id, 'DRAFT_ORDER_READY');
  assert.equal(confirmed.metadata.PLAN_SUBSCRIPTION.purchase.orderId, confirmations[0].orderId);
  let purchases = await fixturePurchases();
  assert.equal(purchases.accounts.length, 1); assert.equal(purchases.orders.length, 1);
  const [account] = await list('core-acct', 'account', purchases.accounts[0].code, [
    ...names(['id', 'metadata']), { name: 'type', type: 'identifier', key: 'id', mappings: names(['code']) },
    { name: 'addresses', type: 'collection', mappings: [
      { name: 'address', type: 'identifier', key: 'id', mappings: names(['id']) },
      { name: 'types', type: 'collection', mappings: names(['code']) },
    ] }, { name: 'contacts', type: 'collection', mappings: [
      ...names(['firstName', 'lastName']), { name: 'contactEntries', type: 'collection', mappings: [
        { name: 'value' }, { name: 'type', type: 'identifier', key: 'id', mappings: names(['code']) },
      ] },
    ] },
  ]);
  assert.equal(account.type.code, 'CUSTOMER');
  assert.equal(account.addresses.length, 1);
  assert.equal(account.addresses[0].address.id, valid.metadata.PLAN_SUBSCRIPTION.companyAddress.addressId);
  assert.deepEqual(account.addresses[0].types.map(t => t.code).sort(), ['BILLING', 'LEGAL']);
  assert.equal(account.contacts.length, 1);
  assert.equal(account.contacts[0].contactEntries.length, 1, 'Optional phone was invented');
  assert.equal(account.contacts[0].contactEntries[0].type.code, 'EMAIL');
  assert.equal(account.contacts[0].contactEntries[0].value, values.EMAIL);
  const orderMaps = [...names(['id', 'metadata', 'totalCharges', 'totalTaxes', 'grandTotal']), stateMapping,
    { name: 'items', type: 'collection', mappings: [
      ...names(['id', 'metadata', 'amount', 'overrideAmount', 'itemCount', 'grandTotal']), stateMapping,
      ...['type', 'organization'].map(name => ({ name, type: 'identifier', key: 'id', mappings: names(['id', 'code']) })),
      { name: 'order', type: 'identifier', key: 'id', mappings: names(['id']) },
      { name: 'itemPrice', type: 'identifier', key: 'id', mappings: [
        ...names(['id', 'attributes']), { name: 'product', type: 'identifier', key: 'id', mappings: names(['id', 'code']) },
      ] },
    ] },
    ...['account', 'type', 'currency'].map(name => ({ name, type: 'identifier', key: 'id', mappings: names(['id', 'code']) }))];
  const readOrder = async id => (await ok('/core-bill/api/order/list.json', { json: {
    filters: [{ property: 'id', operator: '=', value: id }], mappings: orderMaps, offset: 0, pageSize: 10,
  } })).result[0];
  const order = await readOrder(confirmations[0].orderId);
  assert.equal(order.type.code, 'SERVICEWAND_SUBSCRIPTION');
  assert.equal(order.account.id, account.id);
  assert.equal(order.currency.code, preview.checkout.preview.currencyCode);
  assert.equal(order.states[0].code, 'DRAFT');
  const assertBasePlan = (order, purchase, preview, formId, productId) => {
    assert.equal(order.items.length, preview.lines.length, 'Selection must materialize exactly the confirmed catalog lines');
    for (const line of preview.lines) {
      const matches = order.items.filter(i => i.itemPrice.id === line.priceId);
      assert.equal(matches.length, 1);
      const actual = matches[0];
      assert.equal(actual.itemPrice.product.id, line.productId);
      assert.equal(actual.itemCount, line.quantity);
      assert.equal(actual.amount, Number(line.unitAmount));
      assert.equal(actual.metadata.PLAN_SUBSCRIPTION.role, line.role);
      assert.equal(actual.metadata.PLAN_SUBSCRIPTION.quantitySource, line.quantitySource);
      assert.equal(actual.states[0].code, 'DRAFT');
      assert.ok(actual.overrideAmount == null);
    }
    const item = order.items.find(i => i.metadata.PLAN_SUBSCRIPTION.role === 'BASE_PLAN');
    assert.equal(item.states[0].code, 'DRAFT');
    assert.equal(item.id, purchase.basePlanItemId);
    assert.equal(item.type.code, 'SERVICEWAND_SUBSCRIPTION_ITEM');
    assert.equal(item.organization.id, ownerId);
    assert.equal(item.order.id, order.id);
    assert.equal(item.itemCount, 1);
    assert.equal(item.amount, Number(preview.planAmount));
    assert.ok(item.overrideAmount == null, 'An override replaced the catalog amount');
    assert.equal(item.itemPrice.id, preview.priceId);
    assert.equal(item.itemPrice.product.id, productId);
    assert.equal(item.metadata.PLAN_SUBSCRIPTION.sourceFormId, formId);
    assert.equal(item.metadata.PLAN_SUBSCRIPTION.role, 'BASE_PLAN');
    assert.equal(item.metadata.PLAN_SUBSCRIPTION.billingPeriod, preview.billingPeriod);
    assert.equal(item.metadata.PLAN_SUBSCRIPTION.quantitySource, 'SINGLE_SELECTED_PLAN');
    assert.equal(order.totalCharges, Number(preview.subtotal), 'Native order charge differs from confirmed plan and add-ons');
    assert.equal(purchase.subtotal, preview.subtotal);
    assert.equal(purchase.itemIds.length, preview.lines.length);
    assert.equal(preview.quantityValidation, 'VALIDATED');
    assert.equal(preview.capacityValidation, 'VALIDATED_CONFIG_MAXIMUM');
    assert.equal(preview.entitlements.propertyCapacity.overallMaximum, 1000);
    assert.equal(order.metadata.PLAN_SUBSCRIPTION.basePlanMaterialized, true);
    assert.equal(order.metadata.PLAN_SUBSCRIPTION.itemsMaterialized, true);
    assert.equal(order.metadata.PLAN_SUBSCRIPTION.draftOnly, true);
    assert.equal(purchase.basePlanPriceId, preview.priceId);
    assert.equal(purchase.basePlanAmount, preview.planAmount);
    assert.equal(purchase.paymentEnabled, false);
    assert.equal(purchase.basePlanPricingStatus, 'CATALOG_PLAN_ONLY');
  };
  assertBasePlan(order, confirmations[0], preview.checkout.preview, valid.id, growth);
  assert.equal(order.metadata.PLAN_SUBSCRIPTION.draftOnly, true);
  assert.deepEqual(order.metadata.PLAN_SUBSCRIPTION.selection.addonProductIds, [expansion, weather]);
  checks.push('Concurrent confirmation atomically creates one CUSTOMER, linked DRAFT and catalog-priced monthly plan, two expansion packs and ten Weather Properties');

  assert.equal(await execute('forgetReceipt', valid.id), true);
  const recovered = await purchaseAction('confirmPurchase', valid.id, refreshed.checkout.checkoutDigest);
  assert.equal(recovered.accountId, account.id); assert.equal(recovered.orderId, order.id);
  assert.equal(recovered.basePlanItemId, confirmations[0].basePlanItemId);
  assert.deepEqual(recovered.itemIds, confirmations[0].itemIds);
  assertBasePlan(await readOrder(order.id), recovered, preview.checkout.preview, valid.id, growth);
  assert.equal((await fixturePurchases()).orders.length, 1);
  checks.push('Billing receipt recovers lost CMS links without duplicate Account, Order or base-plan item');

  console.log('Dev-1 integration: monthly selection and idempotent recovery passed; checking legacy draft and annual line');
  if (!confirmations[0].invoiceId) {
  assert.equal(await billingFixture('emptyWithStaleSnapshot', order.id, valid.id), true);
  assert.equal((await readOrder(order.id)).items.length, 0, 'Legacy empty-draft fixture was not persisted');
  assert.equal(await execute('forgetBasePlanReceipt', valid.id), true);
  await purchaseAction('confirmPurchase', valid.id, refreshed.checkout.checkoutDigest, true);
  assert.equal((await readOrder(order.id)).items.length, 0, 'A changed saved pricing snapshot produced a line');
  assert.equal((await fixturePurchases()).orders.length, 1);
  checks.push('A mismatched saved pricing snapshot blocks empty-draft recovery without creating lines or another Order');
  assert.equal(await billingFixture('restoreSnapshot', order.id, valid.id), true);
  const upgraded = await purchaseAction('confirmPurchase', valid.id, refreshed.checkout.checkoutDigest);
  assert.equal(upgraded.accountId, account.id); assert.equal(upgraded.orderId, order.id);
  assertBasePlan(await readOrder(order.id), upgraded, preview.checkout.preview, valid.id, growth);
  assert.notEqual(upgraded.basePlanItemId, recovered.basePlanItemId);
  const removedItem = await ok('/core-bill/api/order-item/list.json', { json: {
    filters: [{ property: 'id', operator: '=', value: recovered.basePlanItemId }], mappings: names(['id']), offset: 0, pageSize: 10,
  } });
  assert.equal(removedItem.result.length, 0, 'The scoped legacy fixture left an orphaned old item');
  const repeated = await purchaseAction('confirmPurchase', valid.id, refreshed.checkout.checkoutDigest);
  assert.equal(repeated.basePlanItemId, upgraded.basePlanItemId);
  checks.push('Explicit same-Form recovery upgrades a matching legacy empty draft once; repeated confirmation reuses the base-plan item');

  }

  const submitDraft = await call(`/core-bill/api/order/${order.id}/send-event.json?event=DRAFT-SUBMITTED`, { json: {} });
  assert.equal((await readOrder(order.id)).states[0].code, 'DRAFT', 'Pending purchase draft was submitted');
  const invoices = await ok('/core-bill/api/invoice/list.json', { json: {
    filters: [{ property: 'order.id', operator: '=', value: order.id }], mappings: names(['id']), offset: 0, pageSize: 10,
  } });
  assert.equal(invoices.result.length, confirmations[0].invoiceId ? 1 : 0);
  checks.push('Pending-model draft guard blocks Submit and preserves the prepared Invoice count; native HTTP ' + submitDraft.status);

  assert.equal((await use(us)).status, 200);
  const yearlyReview = await confirmationReady(us.id);
  const yearlyPreview = { checkout: yearlyReview.metadata.PLAN_SUBSCRIPTION.checkout };
  assert.equal(yearlyPreview.checkout.preview.billingPeriod, 'YEARLY');
  assert.notEqual(yearlyPreview.checkout.preview.priceId, preview.checkout.preview.priceId);
  await confirmLink(yearlyReview, 'POST', { formId: direct.id, organizationId: 1,
    COMPANY_NAME: 'forged', EMAIL: 'forged@example.invalid', price: 0,
    PLAN_SUBSCRIPTION: { confirmation: { formId: direct.id, checkoutDigest: 'f'.repeat(64) } } });
  assert.equal((await readForm(direct.id)).states[0].code, 'AWAITING_EMAIL');
  const yearlyReady = await formState(us.id, 'DRAFT_ORDER_READY');
  const yearlyPurchase = yearlyReady.metadata.PLAN_SUBSCRIPTION.purchase;
  assertBasePlan(await readOrder(yearlyPurchase.orderId), yearlyPurchase, yearlyPreview.checkout.preview, us.id, growth);
  assert.equal(yearlyPurchase.executionIdentity, 'SYSTEM');
  assert.notEqual(yearlyPurchase.orderId, order.id);
  const yearlyAccount = (await ok('/core-acct/api/account/list.json', { json: {
    filters: [{ property: 'id', operator: '=', value: yearlyPurchase.accountId }], mappings: [
      { name: 'contacts', type: 'collection', mappings: [...names(['firstName', 'lastName']),
        { name: 'contactEntries', type: 'collection', mappings: [{ name: 'value' },
          { name: 'type', type: 'identifier', key: 'id', mappings: names(['code']) }] }] },
    ], offset: 0, pageSize: 10,
  } })).result[0];
  assert.equal(yearlyAccount.contacts[0].firstName, 'Alex');
  assert.equal(yearlyAccount.contacts[0].lastName, 'Tester');
  assert.equal(yearlyAccount.contacts[0].contactEntries.find(entry => entry.type.code === 'PHONE').value, '+1 604 555 0100');
  assert.equal((await fixturePurchases()).accounts.length, 2, 'Separate Forms were incorrectly merged by email');
  checks.push('YEARLY base-plan item uses the annual catalog amount rather than monthly x 12; separate Form/names/phone are preserved');

  }
  const formTypeAfter = (await list('core-cms', 'form-type', 'PLAN_SUBSCRIPTION', formTypeMappings))[0];
  assert.equal(JSON.stringify(formTypeAfter), typeBefore, 'Integration checks changed the FormType');
} catch (failure) {
  primaryFailure = failure;
  console.error("Dev-1 integration failure before cleanup: " + failure.message);
  throw failure;
} finally {
  console.log(JSON.stringify({ environment: 'dev-1', run, completedBusinessChecks: checks }, null, 2));
  const failures = [];
  try {
    const purchases = await fixturePurchases();
    if (purchases.orders.length) {
      const items = (await ok('/core-bill/api/order-item/list.json', { json: {
        filters: [{ property: 'order.id', operator: 'IN', type: 'STRING', value: purchases.orders.map(o => o.id).join(',') }],
        mappings: names(['id', 'metadata']), offset: 0, pageSize: 100,
      } })).result;
      assert.ok(items.length < 100);
      for (const item of items) assert.ok(created.includes(Number(item.metadata?.PLAN_SUBSCRIPTION?.sourceFormId)), 'Item cleanup escaped test Forms');
      for (const order of purchases.orders) {
        const invoiceIds = await billingFixture('unlockPreparedInvoiceCleanup', order.id, Number(order.metadata.PLAN_SUBSCRIPTION.sourceFormId));
        if (invoiceIds.length) {
          await ok('/core-bill/api/invoice/delete.json', { method: 'DELETE', json: invoiceIds });
          deletedInvoiceCount += invoiceIds.length;
        }
      }
      await ok('/core-bill/api/order/delete.json', { method: 'DELETE', json: purchases.orders.map(o => o.id) });
      deletedOrderCount = purchases.orders.length;
      if (items.length) {
        const remaining = (await ok('/core-bill/api/order-item/list.json', { json: {
          filters: [{ property: 'id', operator: 'IN', type: 'STRING', value: items.map(item => item.id).join(',') }],
          mappings: names(['id']), offset: 0, pageSize: 100,
        } })).result;
        assert.equal(remaining.length, 0, 'Order deletion left synthetic items');
        deletedOrderItemCount = items.length;
      }
    }
    if (purchases.accounts.length) {
      await ok('/core-acct/api/account/delete.json', { method: 'DELETE', json: purchases.accounts.map(a => a.id) });
      deletedAccountCount = purchases.accounts.length;
    }
  } catch { failures.push('Synthetic purchase cleanup requires review for run ' + run); }
  if (created.length) {
    try { await ok('/core-cms/api/form/delete.json', { method: 'DELETE', json: created }); }
    catch { failures.push('Synthetic forms require cleanup: ' + created.join(',')); }
  }
  if (addressFixturesChecked) {
    try {
      const addresses = await fixtureAddresses();
      if (addresses.length) {
        await ok('/core/api/address/delete.json', { method: 'DELETE', org: 'SYSTEM', json: addresses.map(row => row.id) });
        deletedAddressCount = addresses.length;
      }
      assert.equal((await fixtureAddresses()).length, 0, 'Synthetic address cleanup left records');
    } catch { failures.push('Synthetic addresses require cleanup for run ' + run); }
  }
  if (helperId) {
    try { await ok('/core/api/script/delete.json', { method: 'DELETE', org: 'SYSTEM', json: [helperId] }); }
    catch { failures.push('Temporary test helper requires cleanup: ' + helperId); }
  }
  if (billHelperId) {
    try { await ok('/core/api/script/delete.json', { method: 'DELETE', org: 'SYSTEM', json: [billHelperId] }); }
    catch { failures.push('Temporary billing helper requires cleanup: ' + billHelperId); }
  }
  if (failures.length) {
    if (primaryFailure) throw new AggregateError([primaryFailure], failures.join('; '));
    throw new Error(failures.join('; '));
  }
}
console.log(JSON.stringify({ environment: 'dev-1', passed: checks, syntheticFormsDeleted: created.length,
  syntheticAccountsDeleted: deletedAccountCount, syntheticOrdersDeleted: deletedOrderCount,
  syntheticOrderItemsDeleted: deletedOrderItemCount, syntheticInvoicesDeleted: deletedInvoiceCount,
  syntheticAddressesDeleted: deletedAddressCount, temporaryHelperDeleted: Boolean(helperId),
  temporaryBillingHelperDeleted: Boolean(billHelperId), realEmailsSent: 0 }, null, 2));

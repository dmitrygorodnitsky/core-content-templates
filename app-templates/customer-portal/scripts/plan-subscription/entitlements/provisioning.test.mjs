import assert from 'node:assert/strict';
import test from 'node:test';
import { loadConfig } from './prepare.mjs';
import { catalogFixture } from './test-fixtures.mjs';
import { prepareProvisioning, reviewProvisioningRecovery } from './provisioning.mjs';

const config = await loadConfig();
const purchase = { formId: 101, orderId: 201, targetOrganizationId: 901,
  selection: { planCode: 'SERVICEWAND_GROWTH', billingPeriod: 'MONTHLY', addons: [
    { productCode: 'SERVICEWAND_SAAS_PROPERTY_EXT_GROWTH', quantity: 2 },
    { productCode: 'SERVICEWAND_WEATHER_INTELLIGENCE', quantity: 10 },
  ] } };
const lifecycle = { resourceTypes: [{ id: 999, code: 'SNOW_REMOVAL_PROPERTY' }], workflows: [{
  id: 888, code: 'PROPERTY_LIFECYCLE', states: [
    { code: 'INACTIVE', events: [{ id: 777, targets: [{ code: 'ACTIVE' }] }] },
    { code: 'ACTIVE', events: [{ id: 778, targets: [{ code: 'INACTIVE' }] },
      { id: 779, targets: [{ code: 'BLACKLISTED' }] }, { id: 780, targets: [{ code: 'ACTIVE' }] }] },
  ],
}] };
const build = (p = purchase, catalog = catalogFixture(), hooks = lifecycle) =>
  prepareProvisioning(catalog, config, p, hooks);

function recoveryFixture(plan) {
  let nextId = 4000;
  const receipt = { planDigest: plan.planDigest, formId: purchase.formId, orderId: purchase.orderId,
    targetOrganizationId: purchase.targetOrganizationId, records: {} };
  const definitions = new Map();
  const grants = plan.grants.map(template => {
    const code = template.fields.entitlementDefinition.reference.slice('definition:'.length);
    const definition = { id: nextId++, code, organization: { code: plan.definitionOwner } };
    definitions.set(code, definition);
    const row = { ...structuredClone(template.fields), id: nextId++, entitlementDefinition: definition };
    receipt.records[template.key] = row.id; return row;
  });
  const pools = plan.pools.map(template => {
    const code = template.fields.entitlementDefinition.reference.slice('definition:'.length);
    const row = { ...structuredClone(template.fields), id: nextId++, usedValue: 37,
      entitlementDefinition: definitions.get(code), entitlementGrant: { id: receipt.records['grant:' + code] } };
    receipt.records[template.key] = row.id; return row;
  });
  return { receipt, current: { grants, pools } };
}

test('one combined Property allowance includes expansion; Weather uses its own selected quantity', () => {
  for (const period of ['MONTHLY', 'YEARLY']) {
    const plan = build({ ...purchase, selection: { ...purchase.selection, billingPeriod: period } });
    assert.deepEqual(plan.pools.map(row => row.fields.limitValue), [400, 10]);
    assert.equal(plan.grants.filter(row => row.key === 'grant:' + config.propertyCapacity.definitionCode).length, 1);
    assert.equal(plan.grants.find(row => row.key === 'grant:' + config.propertyCapacity.definitionCode).fields.value, '400');
    assert.ok(plan.grants.every(row => row.coverage.effectiveFrom === 'CONFIRMED_PAYMENT_TIMESTAMP'));
    assert.ok(plan.pools.every(row => row.fields.resetPeriod === 'NONE' && !('usedValue' in row.fields)));
    assert.ok(plan.grants.every(row => !('sourcePlanId' in row.fields)));
  }
});

test('disabled/missing features and false levels do not become grants; Standard remains a level', () => {
  const catalog = catalogFixture();
  delete catalog.products[1].attributes.source.AREA_MEASUREMENT;
  catalog.products[1].attributes.source.CASE_MANAGEMENT.value = 'false';
  const plan = build(purchase, catalog);
  assert.ok(!plan.grants.some(row => row.key.includes('AREA_MEASUREMENT') || row.key.includes('CASE_MANAGEMENT')));
  assert.equal(plan.grants.find(row => row.key.includes('OPERATIONAL_DASHBOARDS')).fields.value, 'Standard');
  const without = build({ ...purchase, selection: { ...purchase.selection, addons: [] } });
  assert.equal(without.pools.length, 1);
  assert.ok(!without.grants.some(row => row.key.includes('WEATHER')));
});

test('snapshot changes when expansion size, quantity or purchase identity changes', () => {
  const original = build();
  const changed = catalogFixture();
  changed.products.find(row => row.code === purchase.selection.addons[0].productCode).attributes.source.COUNT.value = 110;
  assert.notEqual(build(purchase, changed).purchaseDigest, original.purchaseDigest);
  assert.notEqual(build({ ...purchase, orderId: 202 }).planDigest, original.planDigest);
  assert.notEqual(build({ ...purchase, targetOrganizationId: 902 }).planDigest, original.planDigest);
  const quantity = structuredClone(purchase); quantity.selection.addons[0].quantity = 3;
  assert.notEqual(build(quantity).purchaseDigest, original.purchaseDigest);
});

test('sorting catalog, selected addons and workflow states does not change the reviewed plan', () => {
  const catalog = catalogFixture(); catalog.products.reverse();
  const p = structuredClone(purchase); p.selection.addons.reverse();
  const hooks = structuredClone(lifecycle); hooks.workflows[0].states.reverse();
  assert.equal(build(p, catalog, hooks).planDigest, build().planDigest);
});

test('bindings derive event IDs and every ACTIVE boundary from the supplied environment', () => {
  const plan = build();
  assert.deepEqual(plan.bindingTemplates.map(row => row.fields.operation),
    ['workflow:event:777', 'workflow:event:778', 'workflow:event:779']);
  assert.equal(plan.bindingTemplates[0].fields.effectType, 'RESERVE_QUOTA');
  assert.ok(plan.bindingTemplates.slice(1).every(row => row.fields.effectType === 'RELEASE_QUOTA'));
  assert.ok(plan.bindingTemplates.every(row => row.fields.whenExpression === '#entity.type.id == 999'
    && row.fields.reserveBefore === false && row.fields.organization.id === 901));
  assert.deepEqual(plan.policyTemplates.map(row => row.fields.action), ['CREATE', 'DELETE']);
  assert.ok(plan.policyTemplates.every(row => row.fields.whenExpression.includes("code == 'ACTIVE'")));
});

test('ambiguous and incomplete lifecycle snapshots are rejected, not silently partially configured', () => {
  const ambiguous = structuredClone(lifecycle);
  ambiguous.workflows[0].states[0].events[0].targets.push({ code: 'INACTIVE' });
  assert.throws(() => build(purchase, catalogFixture(), ambiguous), /Ambiguous ACTIVE/);
  const incomplete = structuredClone(lifecycle); incomplete.workflows[0].states.pop();
  assert.throws(() => build(purchase, catalogFixture(), incomplete), /Incomplete ACTIVE/);
  const wrong = structuredClone(lifecycle); wrong.resourceTypes[0].code = 'PROPERTY';
  assert.throws(() => build(purchase, catalogFixture(), wrong));
});

test('no target or lifecycle produces explicit unresolved dependencies without invented IDs', () => {
  const p = structuredClone(purchase); delete p.targetOrganizationId;
  const plan = prepareProvisioning(catalogFixture(), config, p);
  assert.deepEqual(plan.bindingTemplates, []);
  assert.ok(plan.readiness.blockers.includes('CUSTOMER_ORGANIZATION_NOT_CREATED'));
  assert.ok(plan.readiness.blockers.includes('PROPERTY_LIFECYCLE_SNAPSHOT_REQUIRED'));
  assert.equal(plan.grants[0].fields.granteeOrganization.reference, 'organization.createdAfterConfirmedPayment');
  for (const value of [0, -1, '101', null]) assert.throws(() => build({ ...purchase, formId: value }));
});

test('plans cannot enable writes, grants, runtime enforcement or reconciliation', () => {
  const plan = build(); assert.equal(plan.readiness.canApply, false);
  assert.ok(Object.values(plan.safety).every(value => value === false));
  assert.ok(plan.grants.every(row => row.fields.status === 'INACTIVE'));
  assert.ok([...plan.pools, ...plan.policyTemplates, ...plan.bindingTemplates].every(row => row.fields.status === 'SUSPENDED'));
  assert.ok(plan.readiness.blockers.includes('FEATURE_ASSERTION_NOT_ENFORCED'));
  assert.ok(plan.readiness.blockers.includes('RESOURCE_CREATE_DELETE_HOOKS_MISSING'));
  assert.equal(plan.receiptContract.implemented, false);
});

test('recovery reuses only the recorded purchase and never resets usage, including usage above limit', () => {
  const plan = build(), { receipt, current } = recoveryFixture(plan);
  current.pools[0].usedValue = 501;
  const before = structuredClone(current);
  const result = reviewProvisioningRecovery(plan, receipt, current);
  assert.equal(result.decision, 'REUSE_RECORDED_PLAN');
  assert.equal(result.remoteWritesEnabled, false); assert.equal(result.preserveUsedValue, true);
  assert.deepEqual(current, before);
});

test('missing/mismatched receipts and orphaned records block recovery instead of creating replacements', () => {
  const plan = build(), { receipt, current } = recoveryFixture(plan);
  assert.equal(reviewProvisioningRecovery(plan, null, current).decision, 'BLOCKED');
  assert.equal(reviewProvisioningRecovery(plan, { ...receipt, orderId: 202 }, current).decision, 'BLOCKED');
  current.pools.pop();
  assert.ok(reviewProvisioningRecovery(plan, receipt, current).conflicts.some(reason => reason.includes('MISSING')));
});

test('foreign definitions, wrong grant links, duplicate allowances and changed limits fail recovery', () => {
  const plan = build();
  for (const mutate of [
    current => { current.grants[0].entitlementDefinition.organization.code = 'FOREIGN'; },
    current => { current.pools[0].organization.id = 902; },
    current => { current.pools[0].entitlementGrant.id = 1; },
    current => { current.pools[0].entitlementDefinition = { ...current.pools[0].entitlementDefinition, id: 1 }; },
    current => { current.pools[0].usedValue = 1.5; },
    current => { current.pools[0].limitValue = 999; },
    current => { current.pools.push({ ...current.pools[0], id: 9999 }); },
    current => { current.grants[0].value = 'false'; },
  ]) {
    const { receipt, current } = recoveryFixture(plan); mutate(current);
    assert.equal(reviewProvisioningRecovery(plan, receipt, current).decision, 'BLOCKED');
  }
});

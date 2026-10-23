import assert from 'node:assert/strict';
import test from 'node:test';
import { loadConfig, prepareConfiguration, previewSelection } from './prepare.mjs';
import { catalogFixture } from './test-fixtures.mjs';

const config = await loadConfig();
const clone = value => structuredClone(value);

const growthSelection = { planCode: 'SERVICEWAND_GROWTH', billingPeriod: 'MONTHLY', addons: [
  { productCode: 'SERVICEWAND_SAAS_PROPERTY_EXT_GROWTH', quantity: 2 },
  { productCode: 'SERVICEWAND_WEATHER_INTELLIGENCE', quantity: 10 },
] };

test('missing Boolean flags disable features; malformed values are never truthy-coerced', () => {
  const catalog = catalogFixture();
  delete catalog.products[0].attributes.source.AREA_MEASUREMENT;
  const profile = prepareConfiguration(catalog, config).planProfiles[0];
  const rule = profile.features.find(feature => feature.sourceAttribute === 'AREA_MEASUREMENT');
  assert.equal(rule.value, false); assert.equal(rule.sourceStatus, 'ABSENT_DISABLED_BY_USER_RULE');
  catalog.products[0].attributes.source.AREA_MEASUREMENT = { value: 'false' };
  assert.throws(() => prepareConfiguration(catalog, config), /not a Boolean/);
});

test('localized Boolean accepts explicit configured-locale literals, not marketing text or another language', () => {
  const catalog = catalogFixture();
  catalog.products[0].attributes.source.CUSTOMER_PORTAL.value = { en: { NAME: 'false' } };
  const profile = prepareConfiguration(catalog, config).planProfiles[0];
  assert.equal(profile.features.find(feature => feature.sourceAttribute === 'CUSTOMER_PORTAL').value, false);
  catalog.products[0].attributes.source.CUSTOMER_PORTAL.value = { ru: { NAME: 'true' } };
  assert.throws(() => prepareConfiguration(catalog, config), /no explicit localized/);
});

test('levels preserve false, Standard and Configurable without flattening them into booleans', () => {
  const result = prepareConfiguration(catalogFixture(), config);
  assert.deepEqual(result.planProfiles.map(profile => profile.levels[0].value), ['false', 'Standard', 'Configurable']);
  assert.equal(result.planProfiles[0].levels[0].enabled, false);
  assert.equal(result.planProfiles[1].levels[0].enabled, true);
  assert.ok(result.nativeDefinitionCandidates.filter(definition => definition.code.includes('.LEVEL.'))
    .every(definition => definition.valueType === 'STRING' && definition.status === 'INACTIVE'));
  const changed = catalogFixture(); changed.products[1].attributes.source.CASE_MANAGEMENT.value = 'Enterprise';
  assert.throws(() => prepareConfiguration(changed, config), /Unreviewed level/);
});

test('purchased capacity composes quantities; yearly billing does not multiply the capacity by twelve', () => {
  for (const period of ['MONTHLY', 'YEARLY']) {
    const result = previewSelection(catalogFixture(), config, { ...growthSelection, billingPeriod: period });
    assert.equal(result.activePropertiesLimit, 400);
    assert.equal(result.weatherPropertiesLimit, 10); assert.equal(result.weatherEnabled, true);
    assert.equal(result.grantIssuanceEnabled, false); assert.equal(result.paymentEnabled, false);
    assert.equal(result.overallMaximumVerified, true); assert.equal(result.policyEnforcementVerified, false);
    assert.ok(!('grants' in result) && !('quotaPools' in result));
  }
});

test('all configured plan maxima accept the last expansion pack and reject the next for monthly and yearly billing', () => {
  const plans = [
    ['SERVICEWAND_FOUNDATION', 'SERVICEWAND_SAAS_PROPERTY_EXT_FOUNDATION', 9, 500],
    ['SERVICEWAND_GROWTH', 'SERVICEWAND_SAAS_PROPERTY_EXT_GROWTH', 8, 1000],
    ['SERVICEWAND_PROFESSIONAL', 'SERVICEWAND_SAAS_PROPERTY_EXT_PRO', 15, 2000],
  ];
  for (const [planCode, productCode, quantity, maximum] of plans) for (const billingPeriod of ['MONTHLY', 'YEARLY']) {
    const selection = {planCode, billingPeriod, addons:[{productCode, quantity}]};
    const result = previewSelection(catalogFixture(), config, selection);
    assert.equal(result.activePropertiesLimit, maximum); assert.equal(result.overallMaximum, maximum);
    assert.equal(result.maximumSource, 'TEMPORARY_CONFIG');
    assert.throws(() => previewSelection(catalogFixture(), config, {...selection, addons:[{productCode, quantity:quantity + 1}]}), /exceeds configured plan maximum/);
  }
});

test('missing, unsupported or malformed maximum configuration fails closed without reading marketing prose', () => {
  for (const value of [0, -1, 1000.5, '1000', NaN, Infinity, 2147483648]) {
    const changed = clone(config); changed.propertyCapacity.overallPlanMaximum.byPlanCode.SERVICEWAND_GROWTH = value;
    assert.throws(() => previewSelection(catalogFixture(), changed, growthSelection));
  }
  const missing = clone(config); delete missing.propertyCapacity.overallPlanMaximum.byPlanCode.SERVICEWAND_GROWTH;
  assert.throws(() => previewSelection(catalogFixture(), missing, growthSelection), /explicit maximum/);
  const unknown = clone(config); unknown.propertyCapacity.overallPlanMaximum.source = 'MARKETING_TEXT';
  assert.throws(() => previewSelection(catalogFixture(), unknown, growthSelection));
  const changedCatalog = catalogFixture(); changedCatalog.products[1].attributes.source.EXPANSION_PACK = {value:'Up to 999999 Properties'};
  assert.equal(previewSelection(changedCatalog, config, growthSelection).overallMaximum, 1000);
});

test('unselected Weather stays disabled even though its product is enabled', () => {
  const result = previewSelection(catalogFixture(), config, { ...growthSelection, addons: [] });
  assert.equal(result.activePropertiesLimit, 200); assert.equal(result.weatherPropertiesLimit, 0);
  assert.equal(result.weatherEnabled, false);
});

test('Weather cannot exceed purchased capacity; incompatible/excluded choices are rejected rather than dropped', () => {
  assert.throws(() => previewSelection(catalogFixture(), config, { ...growthSelection, addons: [
    { productCode: 'SERVICEWAND_WEATHER_INTELLIGENCE', quantity: 201 },
  ] }), /exceeds purchased/);
  for (const code of ['SERVICEWAND_SAAS_PROPERTY_EXT_FOUNDATION', 'SERVICEWAND_ROUTE_CREDITS_GROWTH',
    'SERVICEWAND_CUSTOM_REPORTS', 'UNKNOWN_PRODUCT']) {
    assert.throws(() => previewSelection(catalogFixture(), config, { ...growthSelection,
      addons: [{ productCode: code, quantity: 1 }] }), /Incompatible or excluded/);
  }
  assert.throws(() => previewSelection(catalogFixture(), config, { ...growthSelection,
    planCode: 'SERVICEWAND_ENTERPRISE' }), /excluded or unavailable/);
});

test('duplicate and invalid quantities never become entitlement capacity', () => {
  assert.throws(() => previewSelection(catalogFixture(), config, { ...growthSelection,
    addons: [growthSelection.addons[0], growthSelection.addons[0]] }), /Duplicate/);
  for (const quantity of [0, -1, 1.5, '2', NaN, Infinity, 2147483648]) {
    assert.throws(() => previewSelection(catalogFixture(), config, { ...growthSelection,
      addons: [{ productCode: 'SERVICEWAND_SAAS_PROPERTY_EXT_GROWTH', quantity }] }));
  }
});

test('ambiguous attributes, foreign products and source-type drift stop preparation', () => {
  const duplicate = catalogFixture();
  duplicate.products[0].attributes.other = { AREA_MEASUREMENT: { value: false } };
  assert.throws(() => prepareConfiguration(duplicate, config), /Ambiguous attribute/);
  const foreign = catalogFixture(); foreign.products[0].organization.code = 'FOREIGN';
  assert.throws(() => prepareConfiguration(foreign, config), /seller-owned product/);
  const wrongType = catalogFixture(); wrongType.types[0].attributes[0].className = 'java.lang.String';
  assert.throws(() => prepareConfiguration(wrongType, config), /Source type drift/);
});

test('a repeated preview has a stable digest; catalog entitlement changes invalidate it', () => {
  const catalog = catalogFixture();
  const original = prepareConfiguration(catalog, config).planProfiles[0].profileDigest;
  catalog.products.reverse(); catalog.types[0].attributes.reverse();
  assert.equal(prepareConfiguration(catalog, config).planProfiles[0].profileDigest, original);
  catalog.products.find(product => product.code === 'SERVICEWAND_FOUNDATION')
    .attributes.source.AREA_MEASUREMENT.value = false;
  assert.notEqual(prepareConfiguration(catalog, config).planProfiles[0].profileDigest, original);
});

test('preparation cannot activate definitions, writes, operation bindings or payment', () => {
  for (const key of Object.keys(config.safety)) {
    const changed = clone(config); changed.safety[key] = true;
    assert.throws(() => prepareConfiguration(catalogFixture(), changed));
  }
  const active = clone(config); active.definitionDefaults.status = 'ACTIVE';
  assert.throws(() => prepareConfiguration(catalogFixture(), active));
  const result = prepareConfiguration(catalogFixture(), config);
  assert.ok(result.nativeDefinitionCandidates.every(definition => definition.status === 'INACTIVE'));
  assert.deepEqual(result.policyBindings, []); assert.equal(result.readiness.deploymentEnabled, false);
});

test('an existing definition with another native meaning is reported, never overwritten', () => {
  const catalog = catalogFixture();
  catalog.definitions.push({ code: config.propertyCapacity.definitionCode,
    organization: { code: 'SERVICEWAND' }, valueType: 'BOOLEAN' });
  const result = prepareConfiguration(catalog, config);
  assert.ok(result.definitionConflicts.some(conflict => conflict.field === 'valueType'));
  assert.ok(result.readiness.blockers.includes('EXISTING_DEFINITION_CONFLICT'));
});

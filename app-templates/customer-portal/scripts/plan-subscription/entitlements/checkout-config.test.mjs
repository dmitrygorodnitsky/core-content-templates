import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { loadConfig } from './prepare.mjs';
import { catalogFixture } from './test-fixtures.mjs';
import { checkoutConfig, checkoutEntitlements, fingerprint } from './checkout-config.mjs';

const config = await loadConfig();
const selection = { planCode: 'SERVICEWAND_GROWTH', billingPeriod: 'MONTHLY', addons: [
  { productCode: 'SERVICEWAND_SAAS_PROPERTY_EXT_GROWTH', quantity: 2 },
  { productCode: 'SERVICEWAND_WEATHER_INTELLIGENCE', quantity: 10 },
] };

test('deployed metadata is the exact projection of the owning config and excludes provisioning configuration', async () => {
  const seed = JSON.parse(await fs.readFile(new URL('../scripts.json', import.meta.url), 'utf8'));
  assert.deepEqual(seed.scripts.find(row => row.code === 'PLAN_SUBSCRIPTION_DRAFT_V5').metadata.ENTITLEMENT_CHECKOUT_CONFIG, checkoutConfig(config));
  assert.ok(!('ownerOrganizationCode' in checkoutConfig(config)));
  assert.ok(!('policyIntents' in checkoutConfig(config)));
});

test('feature and level changes invalidate consent even with unchanged product and price IDs', () => {
  const catalog = catalogFixture(), before = fingerprint(checkoutEntitlements(catalog, config, selection));
  catalog.products[1].attributes.source.AREA_MEASUREMENT.value = false;
  assert.notEqual(fingerprint(checkoutEntitlements(catalog, config, selection)), before);
  catalog.products[1].attributes.source.AREA_MEASUREMENT.value = true;
  catalog.products[1].attributes.source.CASE_MANAGEMENT.value = 'Configurable';
  assert.notEqual(fingerprint(checkoutEntitlements(catalog, config, selection)), before);
});

test('expansion terms, selected quantities and mapping configuration are covered independently of prices', () => {
  const catalog = catalogFixture(), snapshot = checkoutEntitlements(catalog, config, selection);
  assert.equal(snapshot.propertyCapacity.limit, 400); assert.equal(snapshot.weather.propertyCount, 10);
  catalog.products.find(row => row.code === selection.addons[0].productCode).attributes.source.COUNT.value = 110;
  assert.notEqual(fingerprint(checkoutEntitlements(catalog, config, selection)), fingerprint(snapshot));
  const updated = structuredClone(config); updated.booleanFeatures[0].definitionCode += '_REVISED';
  assert.notEqual(checkoutEntitlements(catalogFixture(), updated, selection).configurationFingerprint, snapshot.configurationFingerprint);
  assert.equal(snapshot.grantIssuanceEnabled, false); assert.equal(snapshot.enforcementVerified, false);
});

test('canonical fingerprint survives JSON transport and map ordering; yearly capacity stays unchanged', () => {
  const snapshot = checkoutEntitlements(catalogFixture(), config, selection);
  const reverse = Object.fromEntries(Object.entries(JSON.parse(JSON.stringify(snapshot))).reverse());
  assert.equal(fingerprint(reverse), fingerprint(snapshot));
  const yearly = checkoutEntitlements(catalogFixture(), config, { ...selection, billingPeriod: 'YEARLY' });
  assert.equal(yearly.propertyCapacity.limit, snapshot.propertyCapacity.limit);
  assert.equal(yearly.coverage.startEvent, 'PAYMENT_CONFIRMED');
  assert.ok(!('effectiveFrom' in yearly) && !('effectiveTo' in yearly));
});

test('the reviewed maximum and its configuration are preserved in the snapshot and covered by consent fingerprints', () => {
  const original = checkoutEntitlements(catalogFixture(), config, selection);
  assert.equal(original.propertyCapacity.overallMaximum, 1000);
  assert.equal(original.propertyCapacity.maximumSource, 'TEMPORARY_CONFIG');
  assert.equal(original.propertyCapacity.maximumValidation, 'VALIDATED_CONFIG_MAXIMUM');
  const changed = structuredClone(config); changed.propertyCapacity.overallPlanMaximum.byPlanCode.SERVICEWAND_GROWTH = 900;
  const revised = checkoutEntitlements(catalogFixture(), changed, selection);
  assert.notEqual(revised.configurationFingerprint, original.configurationFingerprint);
  assert.notEqual(fingerprint(revised), fingerprint(original));
  assert.equal(original.propertyCapacity.overallMaximum, 1000, 'Do not rewrite an already reviewed snapshot');
});

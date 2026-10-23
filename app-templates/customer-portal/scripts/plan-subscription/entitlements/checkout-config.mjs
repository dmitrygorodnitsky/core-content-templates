import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { loadConfig, previewSelection } from './prepare.mjs';

export const canonical = value => Array.isArray(value) ? value.map(canonical)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
export const fingerprint = value => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');

export function checkoutConfig(config) {
  return { schemaVersion: 1, planCodes: config.plans.productCodes,
    featureRules: config.booleanFeatures, levelRules: config.levels,
    propertyDefinitionCode: config.propertyCapacity.definitionCode,
    overallPlanMaximum: config.propertyCapacity.overallPlanMaximum,
    weatherFeatureDefinitionCode: config.addons.weather.featureDefinitionCode,
    weatherLimitDefinitionCode: config.addons.weather.limitDefinitionCode,
    coverage: config.coverage };
}

// Independent reference projection used to compare native Java snapshots in dev-1 tests.
export function checkoutEntitlements(catalog, config, selection) {
  const preview = previewSelection(catalog, config, selection);
  const preparedPlan = catalog.products.find(row => row.code === selection.planCode
    && row.organization?.code === config.ownerOrganizationCode);
  const attribute = (product, code) => Object.values(product.attributes).flatMap(group => Object.entries(group))
    .find(([name]) => name === code)?.[1]?.value;
  const expansion = selection.addons.find(row => config.addons.siteExpansion.productCodes.includes(row.productCode));
  const packSize = expansion ? attribute(catalog.products.find(row => row.code === expansion.productCode
    && row.organization?.code === config.ownerOrganizationCode), 'COUNT') : 0;
  return { schemaVersion: 1, configurationFingerprint: fingerprint(checkoutConfig(config)),
    planCode: preview.planCode, billingPeriod: preview.billingPeriod,
    features: preview.features, levels: preview.levels,
    propertyCapacity: { definitionCode: config.propertyCapacity.definitionCode,
      included: Number(attribute(preparedPlan, config.propertyCapacity.includedAttribute)),
      expansionPacks: expansion?.quantity || 0, expansionPackSize: packSize,
      limit: preview.activePropertiesLimit, overallMaximum: preview.overallMaximum,
      maximumSource: preview.maximumSource, maximumValidation: 'VALIDATED_CONFIG_MAXIMUM' },
    weather: { selected: preview.weatherEnabled, featureDefinitionCode: config.addons.weather.featureDefinitionCode,
      limitDefinitionCode: config.addons.weather.limitDefinitionCode, propertyCount: preview.weatherPropertiesLimit },
    coverage: config.coverage, grantIssuanceEnabled: false, enforcementVerified: false };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  assert.ok(process.argv.length === 3 && ['--check', '--write'].includes(process.argv[2]), 'Use --check or --write');
  const url = new URL('../scripts.json', import.meta.url);
  const seed = JSON.parse(await fs.readFile(url, 'utf8'));
  const script = seed.scripts.find(row => row.code === 'PLAN_SUBSCRIPTION_DRAFT_V5');
  const expected = checkoutConfig(await loadConfig());
  if (process.argv[2] === '--write') {
    script.metadata.ENTITLEMENT_CHECKOUT_CONFIG = expected;
    await fs.writeFile(url, JSON.stringify(seed, null, 2) + '\n');
  } else assert.deepEqual(script.metadata.ENTITLEMENT_CHECKOUT_CONFIG, expected, 'Checkout metadata must be regenerated');
}

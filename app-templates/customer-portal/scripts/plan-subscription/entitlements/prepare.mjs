import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const configUrl = new URL('./config.json', import.meta.url);
const MAX_QUANTITY = 2147483647;
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const canonical = value => Array.isArray(value) ? value.map(canonical)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const fingerprint = value => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');

export async function loadConfig() {
  return JSON.parse(await fs.readFile(configUrl, 'utf8'));
}

function validateConfig(config) {
  assert.equal(config.schemaVersion, 1);
  assert.equal(config.mode, 'PREPARE_ONLY');
  assert.equal(config.ownerOrganizationCode, 'SERVICEWAND');
  assert.equal(config.issuerOrganizationCode, 'SERVICEWAND');
  for (const key of ['remoteWritesEnabled', 'grantIssuanceEnabled', 'quotaPoolWritesEnabled',
    'paymentEnabled', 'runtimeBindingsEnabled']) assert.equal(config.safety[key], false, key);
  assert.equal(config.definitionDefaults.status, 'INACTIVE');
  assert.equal(config.grantPreparation.enabled, false);
  assert.equal(config.grantPreparation.omitDisabledFeatures, true);
  assert.equal(config.grantPreparation.omitFalseLevels, true);
  assert.equal(config.backendContract.featureAssertionEnforcesGrant, false);
  assert.equal(config.backendContract.scriptEvaluationImplemented, false);
  assert.equal(config.backendContract.resourceMutationHooksImplemented, false);
  assert.equal(config.coverage.startEvent, 'PAYMENT_CONFIRMED');
  assert.equal(config.coverage.startSource, 'CONFIRMED_PAYMENT_TIMESTAMP');
  assert.ok(config.policyIntents.every(intent => intent.enabled === false && intent.operation === null));
  assert.ok(config.booleanFeatures.every(rule => rule.missingValue === false));
  const maximum = config.propertyCapacity.overallPlanMaximum;
  assert.equal(maximum.source, 'TEMPORARY_CONFIG');
  assert.equal(maximum.status, 'CONFIGURED_PENDING_MODEL_MIGRATION');
  assert.equal(maximum.allowMarketingTextParsing, false);
  assert.deepEqual(Object.keys(maximum.byPlanCode).sort(), [...config.plans.productCodes].sort(), 'Every allowed plan needs an explicit maximum');
  for (const [code, value] of Object.entries(maximum.byPlanCode)) {
    positiveInteger(value, code + ' maximum');
    assert.ok(value <= MAX_QUANTITY, code + ' maximum exceeds Integer range');
  }
  const codes = [...config.booleanFeatures, ...config.levels].map(rule => rule.definitionCode);
  codes.push(config.propertyCapacity.definitionCode, config.addons.weather.featureDefinitionCode,
    config.addons.weather.limitDefinitionCode);
  assert.equal(new Set(codes).size, codes.length, 'Duplicate definition codes');
}

function attributes(product) {
  const values = new Map();
  for (const group of Object.values(product.attributes || {})) for (const [key, value] of Object.entries(group)) {
    assert.ok(!values.has(key), 'Ambiguous attribute ' + product.code + '.' + key);
    values.set(key, value.value);
  }
  return values;
}

function lookup(catalog, config, code) {
  const found = catalog.products.filter(product => product.code === code
    && product.organization?.code === config.ownerOrganizationCode);
  assert.equal(found.length, 1, 'Expected one seller-owned product: ' + code);
  return found[0];
}

function positiveInteger(value, label, stringAllowed = false) {
  assert.ok(typeof value === 'number' || stringAllowed && typeof value === 'string'
    && /^[1-9][0-9]*$/.test(value), label + ' must be a structured positive integer');
  const result = Number(value);
  assert.ok(Number.isSafeInteger(result) && result > 0, label + ' must be a safe positive integer');
  return result;
}

function booleanValue(value, rule) {
  if (rule.decoder === 'BOOLEAN') {
    assert.equal(typeof value, 'boolean', rule.attribute + ' is not a Boolean');
    return value;
  }
  assert.equal(rule.decoder, 'LOCALIZED_BOOLEAN');
  const localized = value?.[rule.locale]?.[rule.field];
  assert.ok(localized === 'true' || localized === 'false', rule.attribute + ' has no explicit localized true/false');
  return localized === 'true';
}

function definition(config, code, valueType, enforcementType, aggregationType, label) {
  return { code, organization: { code: config.ownerOrganizationCode }, valueType, enforcementType,
    aggregationType, ...config.definitionDefaults, nls: { en: { NAME: label } } };
}

export function prepareConfiguration(catalog, config) {
  validateConfig(config);
  assert.ok(Array.isArray(catalog.products) && Array.isArray(catalog.types), 'Catalog products/types required');
  const planType = catalog.types.find(type => type.code === config.plans.productTypeCode);
  assert.ok(planType, 'Plan ProductType is missing');
  const sourceTypes = new Map(planType.attributes.map(attribute => [attribute.code, attribute.className]));
  const definitions = config.booleanFeatures.map(rule => {
    assert.equal(sourceTypes.get(rule.attribute), rule.decoder === 'BOOLEAN'
      ? 'java.lang.Boolean' : 'com.pixelnation.spring.domain.LocalizationMessage', 'Source type drift: ' + rule.attribute);
    return definition(config, rule.definitionCode, 'BOOLEAN', 'FEATURE', 'ANY_TRUE', rule.attribute);
  });
  for (const rule of config.levels) {
    assert.equal(sourceTypes.get(rule.attribute), 'java.lang.String', 'Source level type drift: ' + rule.attribute);
    definitions.push(definition(config, rule.definitionCode, rule.valueType,
      rule.enforcementType, rule.aggregationType, rule.attribute + ' level'));
  }
  const capacity = config.propertyCapacity;
  definitions.push(definition(config, capacity.definitionCode, capacity.valueType,
    capacity.enforcementType, capacity.aggregationType, 'Maximum active Properties'));
  const weather = config.addons.weather;
  definitions.push(definition(config, weather.featureDefinitionCode, 'BOOLEAN', 'FEATURE', 'ANY_TRUE', 'Weather Intelligence'));
  definitions.push(definition(config, weather.limitDefinitionCode, weather.valueType,
    weather.enforcementType, weather.aggregationType, 'Properties with Weather Intelligence'));

  const allowedAddonCodes = [...config.addons.siteExpansion.productCodes, weather.productCode];
  const addonProfiles = allowedAddonCodes.map(code => {
    const product = lookup(catalog, config, code);
    const values = attributes(product);
    if (code === weather.productCode) {
      assert.equal(values.get(weather.enabledAttribute), true, 'Weather is disabled or missing its enabled flag');
      return { productCode: code, kind: 'WEATHER', enabled: true,
        quantitySource: weather.quantitySource, featureDefinitionCode: weather.featureDefinitionCode,
        limitDefinitionCode: weather.limitDefinitionCode, grantType: weather.grantType };
    }
    return { productCode: code, kind: 'SITE_EXPANSION', grantType: config.addons.siteExpansion.grantType,
      quantitySource: config.addons.siteExpansion.quantitySource,
      packSize: positiveInteger(values.get(config.addons.siteExpansion.packSizeAttribute), code + '.COUNT') };
  });

  const planProfiles = config.plans.productCodes.map(code => {
    const product = lookup(catalog, config, code);
    assert.equal(product.type?.code, config.plans.productTypeCode, 'Unexpected plan type');
    const values = attributes(product);
    const features = config.booleanFeatures.map(rule => {
      const missing = !values.has(rule.attribute);
      return { definitionCode: rule.definitionCode, sourceAttribute: rule.attribute,
        value: missing ? rule.missingValue : booleanValue(values.get(rule.attribute), rule),
        sourceStatus: missing ? 'ABSENT_DISABLED_BY_USER_RULE' : 'EXPLICIT_CATALOG_VALUE' };
    });
    const levels = config.levels.map(rule => {
      const value = values.get(rule.attribute);
      assert.equal(typeof value, 'string', 'Level is missing: ' + code + '.' + rule.attribute);
      assert.ok(rule.allowedValues.includes(value), 'Unreviewed level: ' + code + '.' + rule.attribute);
      return { definitionCode: rule.definitionCode, sourceAttribute: rule.attribute, value,
        enabled: value !== 'false', valueComparisonVerified: false };
    });
    const compatibleIds = values.get(config.addons.compatibilityAttribute);
    assert.ok(Array.isArray(compatibleIds) && compatibleIds.every(Number.isInteger), 'Structured compatibility is missing');
    const profile = { productCode: code, grantType: 'PURCHASED', features, levels,
      includedProperties: positiveInteger(values.get(capacity.includedAttribute), code + '.' + capacity.includedAttribute, true),
      overallMaximum: capacity.overallPlanMaximum.byPlanCode[code], maximumSource: capacity.overallPlanMaximum.source,
      compatibleAddonCodes: allowedAddonCodes.filter(addonCode => compatibleIds.includes(lookup(catalog, config, addonCode).id)) };
    assert.ok(profile.includedProperties <= profile.overallMaximum, 'Included Properties exceed the configured plan maximum');
    return { ...profile, profileDigest: fingerprint({ config, profile }) };
  });

  const definitionConflicts = [];
  for (const candidate of definitions) for (const existing of catalog.definitions || []) {
    if (existing.code === candidate.code && existing.organization?.code === config.ownerOrganizationCode) {
      for (const field of ['valueType', 'enforcementType', 'scopeType', 'aggregationType', 'resetPeriod', 'status']) {
        if (existing[field] !== candidate[field]) definitionConflicts.push({ code: candidate.code, field });
      }
    }
  }
  return { schemaVersion: 1, mode: config.mode, configDigest: fingerprint(config),
    ownerOrganizationCode: config.ownerOrganizationCode, safety: config.safety, coverage: config.coverage,
    nativeDefinitionCandidates: definitions, planProfiles, addonProfiles, definitionConflicts,
    policyBindings: [], policyIntents: config.policyIntents,
    readiness: { deploymentEnabled: false, grantIssuanceEnabled: false, enforcementVerified: false,
      blockers: ['RESOURCE_CREATE_DELETE_HOOKS_MISSING', 'WEATHER_OPERATION_CONTRACT_REQUIRED',
        'FEATURE_ASSERTION_NOT_ENFORCED', 'SCRIPT_EVALUATION_NOT_IMPLEMENTED',
        'DEFINITION_OWNER_DECISION_REQUIRED',
        'TRANSACTIONAL_PURCHASE_PROVISIONING_NOT_IMPLEMENTED', 'PAID_PROVISIONING_RECEIPT_NOT_IMPLEMENTED',
        ...(definitionConflicts.length ? ['EXISTING_DEFINITION_CONFLICT'] : [])] } };
}

// Pure purchase-composition preview; does not produce or issue a Grant/QuotaPool.
export function previewSelection(catalog, config, selection) {
  const prepared = prepareConfiguration(catalog, config);
  const plan = prepared.planProfiles.find(profile => profile.productCode === selection.planCode);
  assert.ok(plan, 'Plan is excluded or unavailable');
  assert.ok(own(config.coverage.periods, selection.billingPeriod), 'Unsupported billing period');
  assert.ok(Array.isArray(selection.addons), 'Explicit add-on list required');
  const seen = new Set();
  let capacity = plan.includedProperties, weatherCount = 0, expansionSeen = false;
  for (const addon of selection.addons) {
    assert.ok(!seen.has(addon.productCode), 'Duplicate add-on'); seen.add(addon.productCode);
    assert.ok(plan.compatibleAddonCodes.includes(addon.productCode), 'Incompatible or excluded add-on');
    const quantity = positiveInteger(addon.quantity, 'Selected add-on quantity');
    assert.ok(quantity <= MAX_QUANTITY, 'Quantity exceeds Form Integer range');
    const profile = prepared.addonProfiles.find(profile => profile.productCode === addon.productCode);
    if (profile.kind === 'SITE_EXPANSION') {
      assert.equal(expansionSeen, false, 'Only one site expansion product is allowed'); expansionSeen = true;
      capacity += quantity * profile.packSize;
      assert.ok(Number.isSafeInteger(capacity), 'Property capacity overflow');
    } else weatherCount = quantity;
  }
  assert.ok(capacity <= plan.overallMaximum, 'Purchased Properties capacity exceeds configured plan maximum');
  assert.ok(weatherCount <= capacity, 'Weather count exceeds purchased Property capacity');
  return { mode: 'PREVIEW_ONLY', grantIssuanceEnabled: false, paymentEnabled: false,
    planCode: plan.productCode, profileDigest: plan.profileDigest, billingPeriod: selection.billingPeriod,
    features: plan.features, levels: plan.levels, activePropertiesLimit: capacity,
    weatherEnabled: weatherCount > 0, weatherPropertiesLimit: weatherCount,
    overallMaximum: plan.overallMaximum, maximumSource: plan.maximumSource,
    overallMaximumVerified: true, policyEnforcementVerified: false };
}

export async function readDev1Catalog(bearer) {
  assert.ok(bearer, 'SERVICEWAND_BEARER is required for read-only dev-1 access');
  const names = values => values.map(name => ({ name }));
  const ref = (name, type = 'identifier') => ({ name, type, key: 'id', mappings: names(['id', 'code']) });
  const jobs = [
    ['products', 'core-pim', 'product', [...names(['id', 'code', 'attributes']), ref('type'), ref('organization')]],
    ['types', 'core-pim', 'product-type', [...names(['id', 'code', 'attributes']), ref('parents', 'collection'), ref('organization')]],
    ['definitions', 'core', 'entitlement-definition', [...names(['id', 'code', 'valueType', 'enforcementType',
      'scopeType', 'aggregationType', 'resetPeriod', 'status']), ref('organization')]],
  ];
  const catalog = { observedAt: new Date().toISOString(), access: 'READ_ONLY' };
  const results = await Promise.allSettled(jobs.map(async ([key, service, entity, mappings]) => {
    const rows = [];
    for (let offset = 0; offset < 5000; offset += 250) {
      // All remote calls are explicitly list-only; there is no apply path.
      const response = await fetch(`https://dev-1.servicewand.com/${service}/api/${entity}/list.json`, {
        method: 'POST', headers: { Authorization: 'Bearer ' + bearer, 'Content-Type': 'application/json',
          'X-Organization-Code': 'SERVICEWAND', Connection: 'close' },
        body: JSON.stringify({ mappings, offset, pageSize: 250 }), signal: AbortSignal.timeout(45000),
      });
      assert.ok(response.ok, `Read-only ${entity} lookup failed: HTTP ${response.status}`);
      const data = await response.json(); assert.ok(Array.isArray(data.result), 'Missing list result');
      rows.push(...data.result);
      if (data.result.length < 250) { catalog[key] = rows; return; }
    }
    throw new Error('Catalog read limit exceeded: ' + entity);
  }));
  for (const result of results) if (result.status === 'rejected') throw result.reason;
  return catalog;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const options = new Map();
  for (let index = 0; index < args.length; index++) {
    const name = args[index];
    assert.ok(['--dev-1', '--catalog', '--out'].includes(name) && !options.has(name), 'Unsupported or duplicate option');
    if (name === '--dev-1') options.set(name, true);
    else { const value = args[++index]; assert.ok(value && !value.startsWith('--'), 'Option value required'); options.set(name, value); }
  }
  assert.ok(options.has('--dev-1') !== options.has('--catalog'), 'Use exactly one of --dev-1 or --catalog FILE');
  const catalog = options.has('--dev-1') ? await readDev1Catalog(process.env.SERVICEWAND_BEARER)
    : JSON.parse(await fs.readFile(options.get('--catalog'), 'utf8'));
  const output = JSON.stringify(prepareConfiguration(catalog, await loadConfig()), null, 2) + '\n';
  if (options.has('--out')) await fs.writeFile(options.get('--out'), output);
  else process.stdout.write(output);
}

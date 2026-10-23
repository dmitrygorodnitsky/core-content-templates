import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { loadConfig, prepareConfiguration, previewSelection } from './prepare.mjs';

const canonical = value => Array.isArray(value) ? value.map(canonical)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const digest = value => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
const id = (value, label) => assert.ok(Number.isSafeInteger(value) && value > 0, label + ' must be a positive ID');
const ref = reference => ({ reference });

// These are review templates with symbolic references, not SaveMappedRequest payloads.
// Receipt/record arguments to recovery review must come from trusted server reads.
export function prepareProvisioning(catalog, config, purchase, lifecycle) {
  id(purchase.formId, 'Form'); id(purchase.orderId, 'Order');
  if (purchase.targetOrganizationId !== undefined) id(purchase.targetOrganizationId, 'Target organization');
  const prepared = prepareConfiguration(catalog, config);
  const selection = previewSelection(catalog, config, purchase.selection);
  const target = purchase.targetOrganizationId ? { id: purchase.targetOrganizationId }
    : ref('organization.createdAfterConfirmedPayment');
  const definitions = new Map(prepared.nativeDefinitionCandidates.map(row => [row.code, row]));
  const selectedAddons = purchase.selection.addons.map(addon => ({ ...addon })).sort((a, b) =>
    a.productCode.localeCompare(b.productCode));
  const purchaseSnapshot = { formId: purchase.formId, orderId: purchase.orderId,
    targetOrganization: target, planCode: selection.planCode, billingPeriod: selection.billingPeriod,
    addons: selectedAddons, profileDigest: selection.profileDigest,
    features: selection.features, levels: selection.levels,
    activePropertiesLimit: selection.activePropertiesLimit, weatherPropertiesLimit: selection.weatherPropertiesLimit };
  const purchaseDigest = digest(purchaseSnapshot);
  const grants = [], pools = [];
  function grant(code, value, grantType, quota = false) {
    const definition = definitions.get(code); assert.ok(definition, 'Missing definition: ' + code);
    const key = 'grant:' + code;
    grants.push({ key, fields: { grantorOrganization: { code: config.issuerOrganizationCode },
      granteeOrganization: target, entitlementDefinition: ref('definition:' + code),
      grantType, value: String(value), valueType: definition.valueType, scopeType: 'ORGANIZATION_SELF',
      sourceOrderId: purchase.orderId, status: 'INACTIVE' },
    coverage: { effectiveFrom: 'CONFIRMED_PAYMENT_TIMESTAMP',
      duration: config.coverage.periods[selection.billingPeriod], effectiveTo: 'CALENDAR_PERIOD_END_FROM_CONFIRMED_PAYMENT' } });
    if (quota) pools.push({ key: 'pool:' + code, fields: { organization: target,
      entitlementDefinition: ref('definition:' + code), entitlementGrant: ref(key),
      limitValue: value, resetPeriod: 'NONE', status: 'SUSPENDED' },
    usageInitialization: 'ZERO_ONLY_FOR_VERIFIED_EMPTY_ORGANIZATION_OTHERWISE_TRANSACTIONAL_BASELINE',
    usageOnRetry: 'PRESERVE' });
  }
  for (const feature of selection.features) if (feature.value) grant(feature.definitionCode, true, 'PURCHASED');
  for (const level of selection.levels) if (level.enabled) grant(level.definitionCode, level.value, 'PURCHASED');
  // One allowance and one Pool include base capacity plus every selected expansion.
  // Parallel base/add-on Pools would all be charged, not summed, by the native engine.
  grant(config.propertyCapacity.definitionCode, selection.activePropertiesLimit, 'PURCHASED', true);
  if (selection.weatherEnabled) {
    grant(config.addons.weather.featureDefinitionCode, true, 'ADDON');
    grant(config.addons.weather.limitDefinitionCode, selection.weatherPropertiesLimit, 'ADDON', true);
  }
  const policyTemplates = [], bindingTemplates = [];
  if (lifecycle) {
    assert.equal(lifecycle.resourceTypes.length, 1, 'One matching ResourceType required');
    assert.equal(lifecycle.workflows.length, 1, 'One matching workflow required');
    const type = lifecycle.resourceTypes[0], workflow = lifecycle.workflows[0];
    id(type.id, 'ResourceType'); id(workflow.id, 'Workflow');
    assert.equal(type.code, 'SNOW_REMOVAL_PROPERTY'); assert.equal(workflow.code, 'PROPERTY_LIFECYCLE');
    assert.ok(Array.isArray(workflow.states), 'Workflow states required');
    const typeCondition = '#entity.type.id == ' + type.id;
    const activeCondition = "#entity.states.^[code == 'ACTIVE'] != null";
    const definition = ref('definition:' + config.propertyCapacity.definitionCode);
    for (const action of ['CREATE', 'DELETE']) policyTemplates.push({ key: 'property:' + action,
      fields: { organization: target, entityClass: 'com.pixelnation.rm.domain.Resource', action,
        entitlementDefinition: definition, enforcementType: 'QUOTA_POOL', amountExpression: '1',
        consumerOrgExpression: '#entity.organization', whenExpression: '(' + typeCondition + ') and ' + activeCondition,
        status: 'SUSPENDED' }, blocker: 'RESOURCE_CREATE_DELETE_HOOKS_MISSING' });
    const eventIds = new Set();
    for (const state of workflow.states) for (const event of state.events || []) {
      assert.ok(Array.isArray(event.targets), 'Event targets required');
      const crossesActive = event.targets.some(to => (state.code === 'ACTIVE') !== (to.code === 'ACTIVE'));
      if (!crossesActive) continue;
      assert.equal(event.targets.length, 1, 'Ambiguous ACTIVE boundary'); id(event.id, 'Workflow event');
      assert.ok(!eventIds.has(event.id), 'Duplicate ACTIVE boundary event'); eventIds.add(event.id);
      const entering = state.code !== 'ACTIVE';
      bindingTemplates.push({ key: 'property:event:' + event.id, from: state.code, to: event.targets[0].code,
        fields: { organization: target, operation: 'workflow:event:' + event.id,
          policyAction: entering ? 'ACTIVATE' : 'DEACTIVATE', entitlementDefinition: definition,
          effectType: entering ? 'RESERVE_QUOTA' : 'RELEASE_QUOTA', amountExpression: '1',
          consumerOrgExpression: '#entity.organization', whenExpression: typeCondition,
          reserveBefore: false, status: 'SUSPENDED' }, blocker: 'RESOURCE_CREATE_DELETE_HOOKS_MISSING' });
    }
    assert.ok(bindingTemplates.some(row => row.fields.effectType === 'RESERVE_QUOTA')
      && bindingTemplates.some(row => row.fields.effectType === 'RELEASE_QUOTA'), 'Incomplete ACTIVE boundaries');
    bindingTemplates.sort((a, b) => a.fields.operation.localeCompare(b.fields.operation));
    policyTemplates.sort((a, b) => a.key.localeCompare(b.key));
  }
  const intent = { purchaseSnapshot, purchaseDigest, definitionOwner: config.ownerOrganizationCode,
    grants, pools, policyTemplates, bindingTemplates };
  const blockers = [...prepared.readiness.blockers];
  if (!lifecycle) blockers.push('PROPERTY_LIFECYCLE_SNAPSHOT_REQUIRED');
  if (!purchase.targetOrganizationId) blockers.push('CUSTOMER_ORGANIZATION_NOT_CREATED');
  return { schemaVersion: 1, mode: 'PROVISIONING_REVIEW_ONLY', ...intent, planDigest: digest(intent),
    safety: { ...config.safety },
    readiness: { canApply: false, blockers: [...new Set(blockers)] },
    issuanceRequirements: ['TRUSTED_CONFIRMED_PAYMENT_RECEIPT', 'CHECKOUT_SNAPSHOT_DIGEST_MATCH',
      'TRANSACTIONAL_UNIQUE_PURCHASE_RECEIPT_AND_SERIALIZATION', 'RESOLVE_DEFINITION_IDS_IN_CONFIRMED_OWNER',
      'VERIFY_EMPTY_ORGANIZATION_OR_INITIALIZE_BASELINE_WITH_LEDGER', 'EXPLICIT_OPERATOR_BINDINGS_IF_NEEDED'],
    receiptContract: { key: { formId: purchase.formId, orderId: purchase.orderId, targetOrganization: target },
      planDigest: digest(intent), records: 'MAP_TEMPLATE_KEY_TO_CREATED_RECORD_ID',
      implemented: false },
    excludedRuntimeActions: ['PAYMENT', 'GRANT_ISSUANCE', 'FEATURE_ASSERTION', 'SCRIPT_EVALUATION',
      'WEATHER_BINDINGS', 'QUOTA_RECONCILIATION', 'AUTOMATIC_OPERATOR_OR_ANCESTOR_BINDINGS'] };
}

// A successful result only permits reuse of an already recorded, matching plan.
// It never authorizes creation, a changed purchase, resetting usage, or auto-adoption.
export function reviewProvisioningRecovery(plan, receipt, current) {
  const conflicts = [];
  const targetId = plan.purchaseSnapshot.targetOrganization.id;
  if (!targetId) return { decision: 'BLOCKED', conflicts: ['TARGET_ORGANIZATION_REQUIRED'], remoteWritesEnabled: false };
  assert.ok(Array.isArray(current.grants) && Array.isArray(current.pools), 'Fresh grants/pools snapshot required');
  if (!receipt) return { decision: 'BLOCKED', conflicts: ['TRUSTED_PROVISIONING_RECEIPT_REQUIRED'], remoteWritesEnabled: false };
  if (receipt.planDigest !== plan.planDigest || receipt.orderId !== plan.purchaseSnapshot.orderId
    || receipt.formId !== plan.purchaseSnapshot.formId || receipt.targetOrganizationId !== targetId) {
    return { decision: 'BLOCKED', conflicts: ['PURCHASE_RECEIPT_MISMATCH'], remoteWritesEnabled: false };
  }
  assert.ok(receipt.records && typeof receipt.records === 'object', 'Receipt record map required');
  const referenced = new Set();
  for (const template of [...plan.grants, ...plan.pools]) {
    const isPool = template.key.startsWith('pool:');
    const recordId = receipt.records[template.key];
    const matching = (isPool ? current.pools : current.grants).filter(row => row.id === recordId);
    const code = template.fields.entitlementDefinition.reference.slice('definition:'.length);
    const row = matching[0];
    const uniqueKey = (isPool ? 'pool:' : 'grant:') + recordId;
    if (matching.length !== 1 || !Number.isSafeInteger(recordId) || recordId <= 0 || referenced.has(uniqueKey)) {
      conflicts.push(template.key + ':MISSING_OR_DUPLICATE_RECORD'); continue;
    }
    referenced.add(uniqueKey);
    if (row.entitlementDefinition?.code !== code
      || row.entitlementDefinition?.organization?.code !== plan.definitionOwner
      || !Number.isSafeInteger(row.entitlementDefinition?.id) || row.entitlementDefinition.id <= 0
      || (isPool ? row.organization?.id : row.granteeOrganization?.id) !== targetId
      || row.parentPool || row.parentGrant) conflicts.push(template.key + ':SCOPE_MISMATCH');
    if (isPool) {
      const linkedGrant = current.grants.find(grant => grant.id === receipt.records['grant:' + code]);
      if (row.limitValue !== template.fields.limitValue
        || row.entitlementGrant?.id !== receipt.records['grant:' + code]
        || row.entitlementDefinition?.id !== linkedGrant?.entitlementDefinition?.id
        || row.resetPeriod !== 'NONE' || !Number.isSafeInteger(row.usedValue) || row.usedValue < 0) {
        conflicts.push(template.key + ':QUOTA_MISMATCH');
      }
    } else if (row.value !== template.fields.value || row.valueType !== template.fields.valueType
      || row.grantType !== template.fields.grantType || row.scopeType !== 'ORGANIZATION_SELF'
      || row.grantorOrganization?.code !== template.fields.grantorOrganization.code
      || row.sourceOrderId !== plan.purchaseSnapshot.orderId) conflicts.push(template.key + ':GRANT_MISMATCH');
    const siblings = (isPool ? current.pools : current.grants).filter(candidate =>
      (isPool ? candidate.organization?.id : candidate.granteeOrganization?.id) === targetId
      && candidate.entitlementDefinition?.code === code
      && candidate.entitlementDefinition?.organization?.code === plan.definitionOwner);
    if (siblings.length !== 1) conflicts.push(template.key + ':MULTIPLE_ALLOWANCES_REQUIRE_REVIEW');
  }
  return { decision: conflicts.length ? 'BLOCKED' : 'REUSE_RECORDED_PLAN', conflicts,
    remoteWritesEnabled: false, preserveUsedValue: true,
    scope: 'GRANT_POOL_IDENTITY_AND_ALLOWANCE_ONLY_NOT_PAYMENT_COVERAGE_OR_POLICY_VERIFICATION' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const options = new Map(), args = process.argv.slice(2);
  for (let index = 0; index < args.length; index++) {
    const key = args[index], value = args[++index];
    assert.ok(['--catalog', '--purchase', '--lifecycle', '--out'].includes(key)
      && !options.has(key) && value && !value.startsWith('--'), 'Unsupported, duplicate or incomplete option');
    options.set(key, value);
  }
  const read = async key => JSON.parse(await fs.readFile(options.get(key), 'utf8'));
  assert.ok(options.has('--catalog') && options.has('--purchase'), 'Catalog and purchase files required');
  const result = prepareProvisioning(await read('--catalog'), await loadConfig(), await read('--purchase'),
    options.has('--lifecycle') ? await read('--lifecycle') : undefined);
  const output = JSON.stringify(result, null, 2) + '\n';
  if (options.has('--out')) await fs.writeFile(options.get('--out'), output);
  else process.stdout.write(output);
}

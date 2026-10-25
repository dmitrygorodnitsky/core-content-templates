import test from 'node:test';
import assert from 'node:assert/strict';
import { planDefinitions } from './definitions.mjs';

const candidate = (code, overrides = {}) => ({ code, organization: { code: 'SERVICEWAND' }, valueType: 'BOOLEAN', enforcementType: 'FEATURE',
  aggregationType: 'ANY_TRUE', scopeType: 'ORGANIZATION_SELF', resetPeriod: 'NONE', status: 'INACTIVE', nls: { en: { NAME: code } }, ...overrides });

test('missing definitions are created active under the owner', () => {
  const [row] = planDefinitions([candidate('SERVICEWAND.FEATURE.CUSTOMER_PORTAL')], [], 'SERVICEWAND');
  assert.equal(row.action, 'CREATE');
  assert.equal(row.target.status, 'ACTIVE');
});

test('an owned definition with the same fields matches and is never rewritten', () => {
  const existing = [{ id: 9, ...candidate('SERVICEWAND.FEATURE.CUSTOMER_PORTAL', { status: 'ACTIVE' }) }];
  const [row] = planDefinitions([candidate('SERVICEWAND.FEATURE.CUSTOMER_PORTAL')], existing, 'SERVICEWAND');
  assert.equal(row.action, 'MATCH');
  assert.equal(row.id, 9);
});

test('differing owned fields are reported, not changed', () => {
  const existing = [{ id: 9, ...candidate('SERVICEWAND.PROPERTIES.MAX_ACTIVE', { valueType: 'INTEGER', enforcementType: 'QUOTA_POOL', aggregationType: 'COUNT_ALL', status: 'INACTIVE' }) }];
  const [row] = planDefinitions([candidate('SERVICEWAND.PROPERTIES.MAX_ACTIVE', { valueType: 'INTEGER', enforcementType: 'QUOTA_POOL', aggregationType: 'COUNT_ACTIVE' })], existing, 'SERVICEWAND');
  assert.equal(row.action, 'MISMATCH');
  assert.deepEqual(row.differences, ['aggregationType', 'status']);
});

test('a same-code definition of another owner is flagged', () => {
  const existing = [{ id: 3, ...candidate('SERVICEWAND.FEATURE.CUSTOMER_PORTAL', { organization: { code: 'SERVICE_WAND_WINTER_SERVICES' } }) }];
  const [row] = planDefinitions([candidate('SERVICEWAND.FEATURE.CUSTOMER_PORTAL')], existing, 'SERVICEWAND');
  assert.equal(row.action, 'CREATE_BESIDE_FOREIGN');
});

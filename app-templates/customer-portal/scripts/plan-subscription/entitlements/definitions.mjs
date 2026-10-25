import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { loadConfig, prepareConfiguration, readDev1Catalog } from './prepare.mjs';

export const COMPARED_FIELDS = ['valueType', 'enforcementType', 'scopeType', 'aggregationType', 'resetPeriod', 'status'];

export function planDefinitions(candidates, existing, ownerCode) {
  const owned = new Map(existing.filter(row => row.organization?.code === ownerCode).map(row => [row.code, row]));
  const foreign = new Set(existing.filter(row => row.organization?.code !== ownerCode).map(row => row.code));
  return candidates.map(candidate => {
    const target = { ...candidate, status: 'ACTIVE' };
    const current = owned.get(candidate.code);
    if (!current) return { code: candidate.code, action: foreign.has(candidate.code) ? 'CREATE_BESIDE_FOREIGN' : 'CREATE', target };
    const differences = COMPARED_FIELDS.filter(field => current[field] !== target[field]);
    return { code: candidate.code, action: differences.length ? 'MISMATCH' : 'MATCH', id: current.id, differences, target };
  });
}

async function saveDefinitions(bearer, ownerId, rows) {
  const names = values => values.map(name => ({ name }));
  const entities = rows.map(row => ({ code: row.target.code, nls: row.target.nls, organization: { id: ownerId },
    ...Object.fromEntries(COMPARED_FIELDS.map(field => [field, row.target[field]])) }));
  const mappings = [...names(['code', 'nls', ...COMPARED_FIELDS]), { name: 'organization', type: 'identifier', key: 'id' }];
  const response = await fetch('https://dev-1.servicewand.com/core/api/entitlement-definition/save.json', {
    method: 'POST', headers: { Authorization: 'Bearer ' + bearer, 'Content-Type': 'application/json',
      'X-Organization-Code': 'SERVICEWAND', Connection: 'close' },
    body: JSON.stringify({ entities, mappings }), signal: AbortSignal.timeout(60000),
  });
  const body = await response.text();
  assert.ok(response.ok, 'Definition save failed: HTTP ' + response.status + ' ' + body.slice(0, 300));
  return body ? JSON.parse(body) : null;
}

async function ownerOrganizationId(bearer, code) {
  const response = await fetch('https://dev-1.servicewand.com/core/api/organization/list.json', {
    method: 'POST', headers: { Authorization: 'Bearer ' + bearer, 'Content-Type': 'application/json',
      'X-Organization-Code': 'SYSTEM', Connection: 'close' },
    body: JSON.stringify({ filters: [{ property: 'code', operator: '=', type: 'STRING', value: code }],
      mappings: [{ name: 'id' }, { name: 'code' }], offset: 0, pageSize: 2 }), signal: AbortSignal.timeout(45000),
  });
  assert.ok(response.ok, 'Owner organization lookup failed: HTTP ' + response.status);
  const rows = (await response.json()).result;
  assert.equal(rows.length, 1, 'Owner organization must exist exactly once');
  return rows[0].id;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  assert.ok(args.includes('--dev-1') && args.every(arg => ['--dev-1', '--apply'].includes(arg)), 'Use --dev-1 [--apply]');
  const bearer = process.env.SERVICEWAND_BEARER;
  const config = await loadConfig();
  const catalog = await readDev1Catalog(bearer);
  const prepared = prepareConfiguration(catalog, config);
  const plan = planDefinitions(prepared.nativeDefinitionCandidates, catalog.definitions, config.ownerOrganizationCode);
  const counts = plan.reduce((sum, row) => ({ ...sum, [row.action]: (sum[row.action] || 0) + 1 }), {});
  for (const row of plan) console.log(row.action.padEnd(22), row.code, row.target.nls.en.NAME, row.differences?.length ? row.differences.join(',') : '');
  console.log(JSON.stringify({ apply: args.includes('--apply'), owner: config.ownerOrganizationCode, counts }));
  const creates = plan.filter(row => row.action === 'CREATE');
  if (args.includes('--apply') && creates.length) {
    assert.ok(!plan.some(row => row.action === 'MISMATCH' || row.action === 'CREATE_BESIDE_FOREIGN'), 'Resolve mismatched or foreign definitions before creating');
    await saveDefinitions(bearer, await ownerOrganizationId(bearer, config.ownerOrganizationCode), creates);
    console.log('created', creates.length);
  }
}

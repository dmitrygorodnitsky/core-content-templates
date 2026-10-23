import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { readQuoteSources, canonicalJava } from './quote-sources.mjs';

assert.ok(process.argv.length === 3 && ['--write', '--check'].includes(process.argv[2]), 'Use --write or --check');
const write = process.argv[2] === '--write';
const source = await fs.readFile(new URL('./OnboardingReadiness.java', import.meta.url), 'utf8');
const config = JSON.parse(await fs.readFile(new URL('./config.json', import.meta.url), 'utf8'));
const implementations = Object.fromEntries(Object.entries(await readQuoteSources()).map(([code, text]) =>
  [code, createHash('sha256').update(canonicalJava(text)).digest('hex')]));
if (write) {
  config.quoteLinkPolicy.implementationFingerprints = implementations;
  await fs.writeFile(new URL('./config.json', import.meta.url), JSON.stringify(config, null, 2) + '\n');
} else assert.deepEqual(config.quoteLinkPolicy.implementationFingerprints, implementations, 'Quote policy source fingerprints changed');
// Core omits null-valued metadata members on readback. Unresolved sources stay
// explicit in the canonical local config and absent in the native projection.
const nativeConfig = Object.fromEntries(Object.entries(config).filter(([, value]) => value !== null));
const url = new URL('../PLAN_SUBSCRIPTION_DRAFT_V5.java', import.meta.url);
const start = '    // BEGIN GENERATED ONBOARDING READINESS';
const end = '    // END GENERATED ONBOARDING READINESS';
const nested = source.split('\n').filter(line => !line.startsWith('import ')).join('\n').trim()
  .replace('public final class OnboardingReadiness', 'public static final class OnboardingReadiness');
const region = start + '\n' + nested.split('\n').map(line => '    ' + line).join('\n') + '\n' + end;
const original = await fs.readFile(url, 'utf8');
const begin = original.indexOf(start), finish = original.indexOf(end);
const expected = begin >= 0 ? original.slice(0, begin) + region + original.slice(finish + end.length)
  : original.trimEnd().slice(0, -1).trimEnd() + '\n\n' + region + '\n}\n';
if (write) await fs.writeFile(url, expected); else assert.equal(original, expected, 'Regenerate onboarding Java region');

const inspector = (await fs.readFile(new URL('./type-inspector.java.inc', import.meta.url), 'utf8')).trimEnd();
for (const name of ['PLAN_SUBSCRIPTION_DRAFT_V5.java', 'PLAN_SUBSCRIPTION_ONBOARDING_MODEL_V1.java']) {
  const path = new URL('../' + name, import.meta.url), text = await fs.readFile(path, 'utf8');
  const markerStart = '    // BEGIN GENERATED ONBOARDING TYPE INSPECTOR', markerEnd = '    // END GENERATED ONBOARDING TYPE INSPECTOR';
  const a = text.indexOf(markerStart), b = text.indexOf(markerEnd);
  assert.ok(a >= 0 && b > a);
  const updated = text.slice(0, a) + markerStart + '\n' + inspector + '\n' + markerEnd + text.slice(b + markerEnd.length);
  if (write) await fs.writeFile(path, updated); else assert.equal(text, updated, 'Regenerate type inspector');
}

// Executable orchestration and native adapters have separate authored sources.
async function embed(path, label, body) {
  const url = new URL(path, import.meta.url), text = await fs.readFile(url, 'utf8');
  const start = '    // BEGIN GENERATED ' + label, end = '    // END GENERATED ' + label;
  const a = text.indexOf(start), b = text.indexOf(end);
  const region = start + '\n' + body.trimEnd() + '\n' + end;
  const next = a >= 0 ? text.slice(0,a) + region + text.slice(b + end.length)
    : text.trimEnd().slice(0,-1).trimEnd() + '\n\n' + region + '\n}\n';
  if(write) await fs.writeFile(url, next); else assert.equal(text,next,'Regenerate ' + label);
}
const executor = (await fs.readFile(new URL('./OnboardingExecution.java',import.meta.url),'utf8')).split('\n')
  .filter(line=>!line.startsWith('import ')).join('\n').trim().replace('public final class OnboardingExecution','public static final class OnboardingExecution');
await embed('../PLAN_SUBSCRIPTION_DRAFT_V5.java','ONBOARDING EXECUTION', executor.split('\n').map(line=>'    '+line).join('\n'));
await embed('../PLAN_SUBSCRIPTION_DRAFT_V5.java','ONBOARDING NATIVE EXECUTOR',await fs.readFile(new URL('./native-executor.java.inc',import.meta.url),'utf8'));
await embed('../PLAN_SUBSCRIPTION_ONBOARDING_MODEL_V1.java','ONBOARDING RESOURCE EXECUTOR',await fs.readFile(new URL('./resource-executor.java.inc',import.meta.url),'utf8'));

await embed('../PLAN_SUBSCRIPTION_DRAFT_V5.java','CHECKOUT TAX ASSIGNMENT',await fs.readFile(new URL('../checkout/tax-assignment.java.inc',import.meta.url),'utf8'));
await embed('../PLAN_SUBSCRIPTION_DRAFT_V5.java','CHECKOUT TAX PREVIEW',await fs.readFile(new URL('../checkout/tax-preview.java.inc',import.meta.url),'utf8'));

const checkoutChanges = (await fs.readFile(new URL('../checkout/CheckoutChanges.java',import.meta.url),'utf8')).split('\n').filter(line=>!line.startsWith('import ')).join('\n').trim().replace('public final class CheckoutChanges','public static final class CheckoutChanges');
await embed('../PLAN_SUBSCRIPTION_WORKFLOW_V11.java','CHECKOUT CHANGES',checkoutChanges.split('\n').map(line=>'    '+line).join('\n'));
await embed('../PLAN_SUBSCRIPTION_WORKFLOW_V11.java','CHECKOUT COMMANDS',await fs.readFile(new URL('../checkout/commands.java.inc',import.meta.url),'utf8'));
const readAccess=(await fs.readFile(new URL('../purchase-access/PurchaseReadAccess.java',import.meta.url),'utf8')).split('\n').filter(line=>!line.startsWith('import ')).join('\n').trim().replace('public final class PurchaseReadAccess','public static final class PurchaseReadAccess');
await embed('../PLAN_SUBSCRIPTION_DRAFT_V5.java','PURCHASE READ ACCESS POLICY',readAccess.split('\n').map(line=>'    '+line).join('\n'));
await embed('../PLAN_SUBSCRIPTION_DRAFT_V5.java','PURCHASE READ ACCESS NATIVE',await fs.readFile(new URL('../purchase-access/native.java.inc',import.meta.url),'utf8'));
const emailLayout=(await fs.readFile(new URL('../email/EmailLayout.java',import.meta.url),'utf8')).split('\n').filter(line=>!line.startsWith('import ')).join('\n').trim().replace('public final class EmailLayout','public static final class EmailLayout');
for(const name of ['../PLAN_SUBSCRIPTION_WORKFLOW_V11.java','../PLAN_SUBSCRIPTION_DRAFT_V5.java'])
  await embed(name,'EMAIL LAYOUT',emailLayout.split('\n').map(line=>line?'    '+line:line).join('\n'));

const seedUrl = new URL('../scripts.json', import.meta.url), seed = JSON.parse(await fs.readFile(seedUrl, 'utf8'));
const bill = seed.scripts.find(row => row.code === 'PLAN_SUBSCRIPTION_DRAFT_V5');
const cms = seed.scripts.find(row => row.code === 'PLAN_SUBSCRIPTION_WORKFLOW_V11');
const modelCode = 'PLAN_SUBSCRIPTION_ONBOARDING_MODEL_V1';
if (!seed.scripts.some(row => row.code === modelCode)) {
  assert.ok(write, 'Generate the RM helper declaration');
  seed.scripts.push({ code: modelCode, language: 'Java', category: 'WORKFLOW', organization: 'SYSTEM', executable: true,
    nls: { en: { NAME: 'ServiceWand onboarding read-only Property model' } },
    metadata: { CAPABILITIES: ['CORE', 'CORE-RM'], FUNCTIONS: [{ name: 'inspectPropertyType', parameters: [
      { name: 'typeCode', type: 'java.lang.String', required: true } ] }] }, contentFile: modelCode + '.java' });
}
const add = (script, name, parameters) => {
  const declaration = { name, parameters };
  const index = script.metadata.FUNCTIONS.findIndex(row => row.name === name);
  if (write) { if (index < 0) script.metadata.FUNCTIONS.push(declaration); else script.metadata.FUNCTIONS[index] = declaration; }
  else assert.deepEqual(script.metadata.FUNCTIONS[index], declaration);
};
const param = (name, type) => ({ name, type, required: true });
add(cms, 'checkOnboardingReadiness', [param('formId', 'java.lang.Integer'), param('checkoutDigest', 'java.lang.String')]);
add(bill, 'checkOnboardingReadiness', [param('payloadJson', 'java.lang.String')]);
add(bill, 'inspectOnboardingConfiguration', []);
const executionConfig = JSON.parse(await fs.readFile(new URL('./executor-config.json', import.meta.url),'utf8'));
const nativeExecutionConfig = Object.fromEntries(Object.entries(executionConfig).filter(([,value])=>value!==null));
const rm = seed.scripts.find(row=>row.code===modelCode);
const enforcementConfig=JSON.parse(await fs.readFile(new URL('./enforcement-config.json',import.meta.url),'utf8'));
if(write)bill.metadata.ONBOARDING_ENFORCEMENT_CONFIG=enforcementConfig;else assert.deepEqual(bill.metadata.ONBOARDING_ENFORCEMENT_CONFIG,enforcementConfig);
for(const name of ['prepareOnboarding','provisionOnboarding']) {
  add(bill,name,[param('payloadJson','java.lang.String')]);
  add(cms,name,[param('formId','java.lang.Integer'),param('checkoutDigest','java.lang.String')]);
}
add(bill,'inspectOnboardingExecutor',[]);
add(bill,'readOnboardingStatus',[param('payloadJson','java.lang.String')]);
add(cms,'readPurchaseStatus',[param('formId','java.lang.Integer'),param('checkoutDigest','java.lang.String')]);
add(cms,'readCheckout',[param('formId','java.lang.Integer')]);
add(cms,'reviseCheckout',[param('formId','java.lang.Integer'),param('expectedRevision','java.lang.Integer'),param('expectedCheckoutDigest','java.lang.String'),param('changesJson','java.lang.String')]);
for(const name of ['deliverPurchaseReadAccess','readPurchaseReadAccess']) {
  add(cms,name,[param('formId','java.lang.Integer'),param('checkoutDigest','java.lang.String')]);
  add(bill,name,[param('payloadJson','java.lang.String')]);
}
const accessConfig=JSON.parse(await fs.readFile(new URL('../purchase-access/config.json',import.meta.url),'utf8'));
const nativeAccessConfig=Object.fromEntries(Object.entries(accessConfig).filter(([,value])=>value!==null));
if(write)bill.metadata.PURCHASE_READ_ACCESS_CONFIG=nativeAccessConfig;
else assert.deepEqual(bill.metadata.PURCHASE_READ_ACCESS_CONFIG,nativeAccessConfig);
for(const name of ['ensureOnboardingProperty','verifyOnboardingProperty'])add(rm,name,[param('payloadJson','java.lang.String')]);
if(write) { bill.metadata.ONBOARDING_EXECUTOR_CONFIG = nativeExecutionConfig; rm.metadata.ONBOARDING_EXECUTOR_CONFIG = nativeExecutionConfig; }
else { assert.deepEqual(bill.metadata.ONBOARDING_EXECUTOR_CONFIG,nativeExecutionConfig); assert.deepEqual(rm.metadata.ONBOARDING_EXECUTOR_CONFIG,nativeExecutionConfig); }
if (write) { bill.metadata.ONBOARDING_READINESS_CONFIG = nativeConfig; await fs.writeFile(seedUrl, JSON.stringify(seed, null, 2) + '\n'); }
else assert.deepEqual(bill.metadata.ONBOARDING_READINESS_CONFIG, nativeConfig);

// Refresh compiler markers on the existing bindings; their lifecycle logic stays intact.
const hash = text => createHash('sha256').update(text).digest('hex').slice(0, 12);
const cmsHash = hash(await fs.readFile(new URL('../PLAN_SUBSCRIPTION_WORKFLOW_V11.java', import.meta.url)));
const wfUrl = new URL('../workflow.json', import.meta.url), wf = await fs.readFile(wfUrl, 'utf8');
const wfExpected = wf.replace(/utility source: [a-f0-9]{12}/g, 'utility source: ' + cmsHash);
if (write) await fs.writeFile(wfUrl, wfExpected); else assert.equal(wf, wfExpected);
for (const name of ['order-workflow-guard.json', 'item-workflow-guard.json', 'invoice-workflow-guard.json']) {
  const path = new URL('../' + name, import.meta.url), old = await fs.readFile(path, 'utf8');
  const updated = old.replace(/entitlement checkout source: [a-f0-9]{12}/g, 'entitlement checkout source: ' + hash(await fs.readFile(url)));
  if (write) await fs.writeFile(path, updated); else assert.equal(old, updated);
}

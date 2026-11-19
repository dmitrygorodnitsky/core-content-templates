// Authorized production configuration transfer. Never retries writes; every save is read back.
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import readline from 'node:readline/promises';
const workspace=process.cwd();
const out=path.resolve(process.env.TRANSFER_RUN_DIR||'tmp/production-deploy-2026-11-17');
const packagePath=path.resolve('tmp/final-transfer/validated-checks-package');
const origin='https://prod.servicewand.com';
await fs.mkdir(out,{recursive:true,mode:0o700});
const journalPath=path.join(out,'journal.json');
let journal=JSON.parse(await fs.readFile(journalPath,'utf8').catch(()=>'{"attempts":[],"verified":[],"blocked":[]}'));
const persist=()=>fs.writeFile(journalPath,JSON.stringify(journal,null,2),{mode:0o600});
console.log('Ready for API key on stdin (input hidden).');
if(process.stdin.isTTY){process.stdin.setRawMode(true);}
let credential='';for await(const chunk of process.stdin){credential+=chunk.toString();if(credential.includes('\n'))break;}
if(process.stdin.isTTY)process.stdin.setRawMode(false);
credential=credential.trim();
async function request(url,body,headers={},write=false){
 if(new URL(url).origin!==origin)throw Error('Unexpected origin');
 const response=await fetch(url,{method:body===undefined?'GET':'POST',redirect:'error',headers:{Connection:'close',...headers},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(write?90000:45000)});
 const text=await response.text();
 if(!response.ok)throw Error('HTTP '+response.status+' '+new URL(url).pathname+' '+text.slice(0,500));
 try{return JSON.parse(text);}catch{throw Error('Non-JSON response '+new URL(url).pathname);}
}
const resource=await request(origin+'/core/.well-known/oauth-protected-resource');
const discovery=await request(resource.authorization_servers[0].replace(/\/$/,'')+'/.well-known/openid-configuration');
if(new URL(discovery.token_endpoint).origin!==origin)throw Error('Unexpected auth origin');
const authResponse=await fetch(discovery.token_endpoint,{method:'POST',redirect:'error',headers:{'X-API-Key':credential,'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=api_key&scope=openid',signal:AbortSignal.timeout(30000)});
credential='';const auth=await authResponse.json();if(!auth.access_token)throw Error('Authentication failed');
const headers={Authorization:'Bearer '+auth.access_token,'X-Organization-Code':'SYSTEM','Content-Type':'application/json'};
const templates=JSON.parse(await fs.readFile('tmp/native-transfer/compiled/request-templates.json','utf8'));
const registry=JSON.parse(await fs.readFile(path.join(packagePath,'registry.json'),'utf8'));
const dependencyMap=new Map(registry.map(r=>[r.entity+'|'+r.code,r.dependencies||[]]));
const scriptRenames=JSON.parse(await fs.readFile(path.join(packagePath,'rules/script-codes.json'),'utf8'));
const lookup=JSON.parse(await fs.readFile('tmp/native-transfer/compiled/reference-catalog.json','utf8'));
const baseline=JSON.parse(await fs.readFile('tmp/native-transfer/prod-fresh.json','utf8'));
const snapshot={origin,readAt:new Date().toISOString(),results:{},warnings:{}};
const field=name=>({name});
const ref=(name,fields=['id','code'])=>({name,type:'identifier',key:'id',mappings:fields.map(field)});
function union(mappings){
 const result=new Map();
 for(const m of mappings){const old=result.get(m.name);result.set(m.name,old?{...old,...m,...(old.mappings||m.mappings?{mappings:union([...(old.mappings||[]),...(m.mappings||[])])}:{})}:structuredClone(m));}
 return [...result.values()];
}
function readMappings(entity){
 let mappings=union(templates.filter(o=>o.identity.entity===entity).flatMap(o=>o.bodyTemplate.mappings));
 if(!mappings.length)mappings=[field('id'),field('code')];
 mappings=mappings.filter(m=>m.name!=='code'||!['core/permission','core/bulk-action','core/bulk-action-registry','core-pim/product-price','core/user','core/organization-secret','core/country'].includes(entity));
 mappings=union([...mappings,field('id'),...(entity==='core/permission'?[]:[field('optimistic')])]);
 function enrich(list){return list.map(original=>{const m=['parents','permissions','targets'].includes(original.name)?{...original,type:'collection'}:original;return m.type==='identifier'?{...m,mappings:union([...(m.mappings||[]),field('id'),...(['permissions','permission','initialState','targets','runAs'].includes(m.name)?[]:[field('code')])])}:m.mappings?{...m,mappings:enrich(union([...m.mappings,...(m.type==='collection'?[field('id')]:[])]))}:m;});}
 mappings=enrich(mappings);
 if(entity==='core-rm/resource-type')mappings=[...mappings.filter(m=>m.name!=='sensorDefinitions'),{name:'sensorDefinitions',type:'collection',mappings:[field('id'),field('code')]}];
 if(entity==='core-rm/sensor-definition')return [field('id'),field('code'),ref('resourceType'),ref('sensorType'),ref('defaultScript')];
 if(entity==='core/user')return [field('id'),field('name')];
 if(entity==='core/organization-secret')return [field('id'),field('name'),ref('organization'),ref('type')];
 if(entity==='core/country')return [field('id'),field('code2')];
 if(entity==='core/permission')return [...['id','name','description','group','manual'].map(field),ref('organization')];
 if(entity==='core/workflow')mappings=union([...mappings,ref('initialState'),ref('script')]);
 if(entity==='core/bulk-action-registry')mappings=union([...mappings,{name:'actions',type:'collection',mappings:[field('id'),field('optimistic'),field('function'),ref('script'),ref('permission',['id'])]}]);
 // Catalog lookups must include ownership even if all operations were reuse-only.
 if(!['core/contact-type','core/script-category','core/unit-category','core/unit','core/country','core-rpt/report-type'].includes(entity))mappings=union([...mappings,ref('organization')]);
 return mappings;
}
const entities=new Set([...templates.map(o=>o.identity.entity),...Object.values(lookup).map(v=>v.entity),'core/user','core/permission','core-rm/sensor-definition']);entities.delete('core-rpt/report');
async function readEntity(entity){
 const [service,name]=entity.split('/');const mappings=readMappings(entity);const rows=[];let expectedSize;
 try{for(let offset=0;;offset+=500){const data=await request(origin+'/'+service+'/api/'+name+'/list.json',{mappings,pageSize:500,offset,sorting:[{field:'id',direction:'ASC'}]},headers);if(!Array.isArray(data.result))throw Error('Missing result list');if(expectedSize!==undefined&&data.resultSize!==expectedSize)throw Error('Registry size changed during paginated read');expectedSize=data.resultSize;rows.push(...data.result);if(data.result.length<500)break;}
 if(expectedSize!==undefined&&rows.length!==expectedSize)throw Error('Paginated row count does not match resultSize');
 if(new Set(rows.map(r=>r.id)).size!==rows.length)throw Error('Duplicate IDs across paginated read; snapshot is not consistent');
 snapshot.results[entity]=rows;delete snapshot.warnings[entity];
 }catch(error){delete snapshot.results[entity];snapshot.warnings[entity]=String(error.message).slice(0,600);}
}
let readCount=0;const readQueue=[...entities];await Promise.all(Array.from({length:4},async()=>{while(readQueue.length){const entity=readQueue.shift();await readEntity(entity);if(++readCount%10===0)console.log(JSON.stringify({event:'read-progress',read:readCount,total:entities.size}));}}));
await fs.writeFile(path.join(out,'before.json'),JSON.stringify(snapshot,null,2),{mode:0o600,flag:'wx'}).catch(e=>{if(e.code!=='EEXIST')throw e;});
console.log(JSON.stringify({event:'read-complete',entities:Object.keys(snapshot.results).length,failures:snapshot.warnings}));
const sources=['tmp/retired-order-audit/dev-1.json','tmp/prod-transfer-2026-11-17/dev-1-extra.json','tmp/prod-transfer-2026-11-17/full-definitions.json','tmp/final-transfer/details.json','tmp/native-transfer/dev-1-references.json','tmp/native-transfer/dev-1-contracts.json'];
function equalSubset(expected,actual,fieldPath=''){
 if(['onEnter','onExit','onUpdate','onDelete'].includes(fieldPath.split('.').at(-1))&&(expected==null||expected==='')&&(actual==null||actual===''))return true;
 if(['content','onEnter','onExit','onUpdate','onDelete'].includes(fieldPath.split('.').at(-1))&&typeof expected==='string'&&typeof actual==='string')return expected.replace(/[\r\n]+$/,'')===actual.replace(/[\r\n]+$/,'');
 if(expected===null)return actual==null;
 if(Array.isArray(expected)){
  if(!Array.isArray(actual))return expected.length===0&&actual==null;
  if(expected.length!==actual.length)return false;
  if(fieldPath.split('.').at(-1)==='entityTypes'){
   if(new Set(expected.map(x=>x.value)).size!==expected.length||new Set(actual.map(x=>x.value)).size!==actual.length)return false;
   return expected.every(x=>equalSubset(x,actual.find(y=>y.value===x.value),fieldPath));
  }
  return expected.every((v,i)=>equalSubset(v,typeof v==='object'&&v!==null&&(v.id!==undefined||v.code!==undefined)?actual.find(a=>a&&((v.id!==undefined&&a.id===v.id)||(v.id===undefined&&v.code!==undefined&&a.code===v.code))):actual[i],fieldPath));
 }
 if(expected&&typeof expected==='object')return actual!=null&&Object.entries(expected).every(([k,v])=>k==='optimistic'||equalSubset(v,actual[k],fieldPath+'.'+k));
 return expected===actual;
}
function priceIdentity(row){
 const attributes=structuredClone(row.attributes||{});for(const values of Object.values(attributes))delete values.UNIT_PRICE;
 function stable(value){if(Array.isArray(value))return value.map(stable);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));return value;}
 return JSON.stringify(stable({organization:row.organization?.id,product:row.product?.id,type:row.type?.id,attributes}));
}
function matchesDesired(entity,expected,actual,renames={}){
 if(entity==='core/permission'){const copy={...expected};if(expected?.manual===false&&actual?.manual===false)delete copy.group;if(copy.name?.startsWith('P_SCRIPT_X_')&&'P_SCRIPT_X_'+renames[copy.name.slice('P_SCRIPT_X_'.length)]===copy.id)copy.name=copy.id;return equalSubset(copy,actual);}
 return equalSubset(expected,actual);
}
if(process.env.TRANSFER_RECONCILE==='1'){
 const reconciled=new Set();const retryApproved=new Set();
 if(process.env.TRANSFER_RETRY_NULL_CATEGORY==='1'){
  const routeKey='core/script|WINTER_SERVICES_ROUTE_CHAT_LIFECYCLE#save';
  const blocked=journal.blocked.find(b=>b.key===routeKey&&b.reason.startsWith('HTTP 500'));
  if(blocked&&!(snapshot.results['core/script']||[]).some(r=>r.code==='WINTER_SERVICES_ROUTE_CHAT_LIFECYCLE')){
   const definition=JSON.parse(await fs.readFile(path.join(packagePath,'source-definitions/core__script__WINTER_SERVICES_ROUTE_CHAT_LIFECYCLE.json'),'utf8'));
   const requests=[];for(const file of (await fs.readdir(out)).filter(f=>/^request-.*\.json$/.test(f))){const record=JSON.parse(await fs.readFile(path.join(out,file),'utf8'));if(record.key===routeKey)requests.push(record);}
   if(definition.source.category!==null||requests.length!==1||JSON.stringify(requests[0].body.entities[0].category)!=='{"id":null}')throw Error('Null-category recovery evidence mismatch');
   journal.retryApproved??=[];journal.retryApproved.push({key:routeKey,attemptCount:journal.attempts.filter(a=>a.key===routeKey).length,at:new Date().toISOString(),reason:'Confirmed null source category incorrectly encoded as {id:null}; corrected payload uses null. Source and permissions unchanged.'});
   journal.blocked=journal.blocked.filter(b=>b.key!==routeKey);
  }
 }

 // Explicit recovery after independently saved SensorDefinitions; validate fresh links first.
 const sensorSpecs=JSON.parse(await fs.readFile('app-templates/customer-portal/content/production-transfer/sensor-definitions-2026-11-17.json','utf8'));
 for(const spec of sensorSpecs){
  const resources=(snapshot.results['core-rm/resource-type']||[]).filter(r=>r.code===spec.resourceTypeCode);
  const definitions=(snapshot.results['core-rm/sensor-definition']||[]).filter(r=>r.code===spec.code);
  if(resources.length!==1||definitions.length!==1||definitions[0].resourceType?.id!==resources[0].id||definitions[0].sensorType?.code!==spec.sensorTypeCode||!resources[0].sensorDefinitions?.some(d=>d.code===spec.code&&d.id===definitions[0].id))continue;
  journal.blocked=journal.blocked.filter(record=>{
   if(!record.key.startsWith('core-rm/resource-type|'+spec.resourceTypeCode+'#'))return true;
   if(record.reason.startsWith('Native reference unresolved:')&&record.reason.includes('Sensor definition'))return false;
   if(record.reason.includes('ResourceType.sensorDefinitions')&&record.key.endsWith('#attributes')){
    journal.retryApproved??=[];journal.retryApproved.push({key:record.key,attemptCount:journal.attempts.filter(a=>a.key===record.key).length,at:new Date().toISOString(),reason:'SensorDefinition saved independently and both links verified; retry omits the orphan-removal collection.'});return false;
   }
   return true;
  });
 }

 // Upgrade only unused legacy approvals: a later attempt must never inherit one.
 for(const approval of journal.retryApproved||[]){
  const attempts=journal.attempts.filter(a=>a.key===approval.key);
  if(approval.attemptCount===undefined&&attempts.length&&attempts.every(a=>a.at<approval.at)){
   approval.attemptCount=attempts.length;
   journal.blocked=journal.blocked.filter(b=>!(b.key===approval.key&&b.reason==='Interrupted/uncertain previous attempt; reconcile before retry'));
  }
 }

 for(const record of journal.blocked.filter(x=>!x.reason.startsWith('Dependent'))){
  const files=await fs.readdir(out);let expected;
  for(const file of files.filter(x=>/^request-.*\.json$/.test(x))){const request=JSON.parse(await fs.readFile(path.join(out,file),'utf8'));if(request.key===record.key)expected=request.body.entities[0];}
  if(!expected)continue;
  const entity=record.entity||record.key.split('|')[0];
  const matches=(snapshot.results[entity]||[]).filter(row=>expected.id!==undefined?row.id===expected.id:entity==='core-pim/product-price'?priceIdentity(row)===priceIdentity(expected):expected.code&&row.code===expected.code);
  if(record.reason.includes('ResourceType.sensorDefinitions')&&Array.isArray(expected.sensorDefinitions)&&expected.sensorDefinitions.length===0&&matches.length===1&&!(matches[0].sensorDefinitions||[]).length){retryApproved.add(record.key);journal.retryApproved??=[];journal.retryApproved.push({key:record.key,attemptCount:journal.attempts.filter(a=>a.key===record.key).length,reason:'Failed orphan-collection save; empty source and target sensor collection verified. Retry omits the empty collection.',at:new Date().toISOString()});}
  if(matches.length===1&&matchesDesired(entity,expected,matches[0],scriptRenames)){reconciled.add(record.key);journal.verified.push({key:record.key,entity,id:matches[0].id,at:new Date().toISOString(),reconciledBy:'fresh read-back; code trailing newlines, allowed-type option order, backend-generated permission group only'});}
 }
 journal.blocked=journal.blocked.filter(x=>!reconciled.has(x.key)&&!retryApproved.has(x.key)&&!x.reason.startsWith('Dependent'));
 console.log(JSON.stringify({event:'reconciled',count:reconciled.size,retryApproved:retryApproved.size}));await persist();
}
const knownBlocked=new Set(journal.blocked.map(x=>x.key));const done=new Set(journal.verified.map(x=>x.key));
// A crash after a save is ambiguous: never automatically retry the recorded attempt.
for(const attempt of journal.attempts)if(!done.has(attempt.key)&&!knownBlocked.has(attempt.key)&&!journal.retryApproved?.some(r=>r.key===attempt.key&&r.attemptCount===journal.attempts.filter(a=>a.key===attempt.key).length)){knownBlocked.add(attempt.key);journal.blocked.push({key:attempt.key,reason:'Interrupted/uncertain previous attempt; reconcile before retry'});}
await persist();
const maxWrites=Number(process.env.TRANSFER_MAX_WRITES||10000);let writes=0;
for(let round=0;round<150&&writes<maxWrites;round++){
 const livePath=path.join(out,'live.json');snapshot.readAt=new Date().toISOString();await fs.writeFile(livePath,JSON.stringify(snapshot),{mode:0o600});
 const compiled=path.join(out,'compiled');const args=['app-templates/customer-portal/scripts/production-transfer/native-payload.py','--package',packagePath,...sources.flatMap(s=>['--source',s]),'--target',livePath,'--output',compiled];
 const result=spawnSync('python3',args,{encoding:'utf8'});if(result.status!==0)throw Error('Compiler failed: '+result.stderr.slice(0,800));
 const ready=JSON.parse(await fs.readFile(path.join(compiled,'resolved-requests.json'),'utf8'));
 const nativeIssues=JSON.parse(await fs.readFile(path.join(compiled,'issues.json'),'utf8'));
 const currentTemplates=JSON.parse(await fs.readFile(path.join(compiled,'request-templates.json'),'utf8'));const byKey=new Map(currentTemplates.map(x=>[x.key,x]));
 function hasBlockedDependency(op){
  const raw=JSON.stringify(op.bodyTemplate);
  for(const blocked of knownBlocked){
   const definition=byKey.get(blocked);const logical=definition?.sourceEntry||blocked.split('#')[0];
   if(op.sourceEntry===logical)return true;
   if((dependencyMap.get(op.sourceEntry)||[]).includes(logical))return true;
   const entity=definition?.identity.entity||logical.split('|')[0];const code=definition?.identity.code||logical.slice(logical.indexOf('|')+1);
   if(raw.includes('"$ref":"'+entity+'|'+code+'"'))return true;
   if(entity==='core/bulk-action-registry'&&raw.includes('"$registry":"'+code+'"'))return true;
   if(entity==='core/permission'&&raw.includes(JSON.stringify(code)))return true;
   if(entity==='core/script'&&raw.includes('P_SCRIPT_X_'+code+'"'))return true;
   if(entity==='core/workflow'&&raw.includes('P_WF:'+code+':'))return true;
  }
  return false;
 }
 function propagateBlocked(){
  let changed=true;while(changed){changed=false;for(const op of currentTemplates)if(!done.has(op.key)&&!knownBlocked.has(op.key)&&hasBlockedDependency(op)){knownBlocked.add(op.key);journal.blocked.push({key:op.key,entity:op.identity.entity,reason:'Dependent on blocked prerequisite; no write attempted'});changed=true;}}
 }
 propagateBlocked();await persist();
 for(const issue of nativeIssues)for(const op of currentTemplates)if(op.sourceEntry===issue.entry&&!done.has(op.key)&&!knownBlocked.has(op.key)){knownBlocked.add(op.key);journal.blocked.push({key:op.key,entity:op.identity.entity,reason:'Native reference unresolved: '+issue.reason});}
 propagateBlocked();await persist();
 let candidates=ready.filter(r=>!done.has(r.key)&&!knownBlocked.has(r.key)&&!snapshot.warnings[byKey.get(r.key).identity.entity]);
 // Skip writes depending on any failed read, including reference catalogs.
 candidates=candidates.filter(r=>{const raw=JSON.stringify(byKey.get(r.key).bodyTemplate);return !Object.keys(snapshot.warnings).some(e=>raw.includes('"'+e+'|'));});
 if(!candidates.length)break;
 candidates=candidates.filter(r=>!hasBlockedDependency(byKey.get(r.key)));
 if(!candidates.length)break;
 const stage=Math.min(...candidates.map(r=>byKey.get(r.key).stage));candidates=candidates.filter(r=>byKey.get(r.key).stage===stage);
 console.log(JSON.stringify({event:'stage',round,stage,candidates:candidates.length,verified:done.size,blocked:knownBlocked.size}));
 for(const candidate of candidates){
  if(writes>=maxWrites)break;
  const op=byKey.get(candidate.key),entity=op.identity.entity;
  propagateBlocked();
  if(hasBlockedDependency(op))continue;
  // Existing updates use their optimistic version. Re-read after every same-entity save.
  const body=structuredClone(candidate.body);const desired=body.entities[0];
  if(desired.id!==undefined && entity!=='core/permission'){
   const fresh=snapshot.results[entity]?.find(x=>x.id===desired.id);
   if(!fresh || (fresh.optimistic!==undefined && desired.optimistic!==fresh.optimistic)){
    knownBlocked.add(candidate.key);journal.blocked.push({key:candidate.key,entity,reason:'Target missing or optimistic version changed since compilation; no write attempted'});await persist();continue;
   }
  }
  if(entity==='core/schedule'&&desired.enabled!==false)throw Error('Schedule activation forbidden');
  await fs.writeFile(path.join(out,'request-'+String(journal.attempts.length).padStart(4,'0')+'.json'),JSON.stringify({key:candidate.key,path:candidate.path,body},null,2),{mode:0o600});
  journal.attempts.push({key:candidate.key,at:new Date().toISOString()});await persist();writes++;
  let response,error;
  try{response=await request(origin+candidate.path,body,headers,true);}catch(e){error=String(e.message).slice(0,600);}
  await readEntity(entity);
  const returnedId=typeof response==='number'?response:Array.isArray(response)?response[0]:undefined;
  let rows=snapshot.results[entity]||[];
  const id=desired.id??returnedId;
  let matched=id!==undefined?rows.filter(r=>r.id===id):rows.filter(r=>desired.code&&r.code===desired.code);
  for(let readAttempt=0;!error&&readAttempt<2&&!(matched.length===1&&matchesDesired(entity,desired,matched[0],scriptRenames));readAttempt++){
   await new Promise(resolve=>setTimeout(resolve,1000*(readAttempt+1)));await readEntity(entity);
   rows=snapshot.results[entity]||[];matched=id!==undefined?rows.filter(r=>r.id===id):rows.filter(r=>desired.code&&r.code===desired.code);
  }
  if(!error&&matched.length===1&&matchesDesired(entity,desired,matched[0],scriptRenames)){done.add(candidate.key);journal.verified.push({key:candidate.key,entity,id:matched[0].id,at:new Date().toISOString()});}
  else{knownBlocked.add(candidate.key);journal.blocked.push({key:candidate.key,entity,reason:error||'Save returned but read-back differs or could not uniquely resolve',targetId:id,responseShape:Array.isArray(response)?'array':typeof response,differingFields:matched.length===1?Object.keys(desired).filter(k=>k!=='optimistic'&&!equalSubset(desired[k],matched[0][k],'.'+k)):['identity']});}
  propagateBlocked();await persist();
  console.log(JSON.stringify({event:done.has(candidate.key)?'verified':'blocked',key:candidate.key,...(!done.has(candidate.key)?{reason:journal.blocked.find(x=>x.key===candidate.key).reason}:{})}));
 }
 // Script/workflow saves may generate permissions; bulk actions affect registry children.
 await readEntity('core/permission');await readEntity('core/bulk-action-registry');
}
await fs.writeFile(path.join(out,'after.json'),JSON.stringify(snapshot,null,2),{mode:0o600});
console.log(JSON.stringify({event:'complete',writes,verified:done.size,blocked:knownBlocked.size,readFailures:snapshot.warnings}));

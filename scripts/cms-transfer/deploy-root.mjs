// Staged root CMS deployment. No blind write retries. All mutations are journaled.
import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';
import {resolve,equal,assertWritePath} from './runtime.mjs';
import {blogEntities,assertBlogWritePath,matchesBlog,validateBlogScope} from './blog-runtime.mjs';
const blog=process.argv.includes('--blog'),preflight=process.argv.includes('--preflight');
const origin='https://prod.servicewand.com',pkg=path.resolve(process.argv.includes('--package')?process.argv[process.argv.indexOf('--package')+1]:'tmp/cms-root-stage-1'),run=path.resolve(process.argv.includes('--run')?process.argv[process.argv.indexOf('--run')+1]:'tmp/cms-root-deploy-2026-11-17');
if(!process.argv.includes('--apply')&&!preflight)throw Error('Explicit --apply required');
await fs.mkdir(run,{recursive:true,mode:0o700});const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const ops=await read(pkg+'/requests.json'),identities=await read(pkg+'/identities.json');
if(blog)validateBlogScope(ops);
for(const [file,hash]of Object.entries(await read(pkg+'/SHA256SUMS.json')))if(crypto.createHash('sha256').update(await fs.readFile(pkg+'/'+file)).digest('hex')!==hash)throw Error('Package integrity failed '+file);
const journal=await read(run+'/journal.json').catch(()=>({attempts:[],verified:[],reused:[],blocked:[]}));const bindings={};
let persistQueue=Promise.resolve();
const persist=()=>{const j=JSON.stringify(journal,null,2),b=JSON.stringify(bindings,null,2);persistQueue=persistQueue.then(async()=>{for(const [file,data]of [['journal.json',j],['bindings.json',b]]){await fs.writeFile(run+'/'+file+'.new',data,{mode:0o600});await fs.rename(run+'/'+file+'.new',run+'/'+file);}});return persistQueue;};
console.log('Ready for production API key (hidden).');process.stdin.setRawMode(true);let key='';for await(const c of process.stdin){key+=c;if(key.includes('\n'))break;}process.stdin.setRawMode(false);key=key.trim();
async function http(url,opts={},retry=true){if(new URL(url).origin!==origin)throw Error('Unexpected host');for(let i=0;;i++){try{const r=await fetch(url,{...opts,redirect:'error',headers:{Connection:'close',...opts.headers},signal:AbortSignal.timeout(60000)});const text=await r.text();if(!r.ok){const e=Error('HTTP '+r.status+' '+new URL(url).pathname);e.status=r.status;e.detail=text.slice(0,3000);throw e;}return text?JSON.parse(text):null;}catch(e){if(!retry||i>=2||(e.status&&![502,503,504,429].includes(e.status)))throw e;await new Promise(r=>setTimeout(r,500));}}}
const resource=await http(origin+'/core/.well-known/oauth-protected-resource');const meta=await http(resource.authorization_servers[0].replace(/\/$/,'')+'/.well-known/openid-configuration');const auth=await http(meta.token_endpoint,{method:'POST',headers:{'X-API-Key':key,'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=api_key&scope=openid'},false);key=null;if(!auth?.access_token)throw Error('Authentication failed');
const headers={Authorization:'Bearer '+auth.access_token,'X-Organization-Code':'SYSTEM','Content-Type':'application/json'};
const f=name=>({name}),r=name=>({name,type:'identifier',key:'id',mappings:[f('id'),f('code')]}),url=e=>origin+'/'+e.split('/')[0]+'/api/'+e.split('/')[1];
async function list(e,mappings,filters=[]){let rows=[],size;for(let offset=0;;offset+=100){const data=await http(url(e)+'/list.json',{method:'POST',headers,body:JSON.stringify({mappings,filters,offset,pageSize:100,sorting:[{field:'id',direction:'ASC'}]})});if(size!==undefined&&size!==data.resultSize)throw Error('Catalog changed '+e);size=data.resultSize;rows.push(...data.result);if(rows.length>=size)break;if(!data.result.length)throw Error('Incomplete '+e);}if(rows.length!==size)throw Error('Invalid count '+e);return rows;}
function enrich(mappings){return mappings.map(m=>{const n={...m};if(['parents','permissions','targets','categories','tags','images'].includes(n.name)&&n.mappings)n.type='collection';if(n.mappings)n.mappings=enrich(n.mappings);return n;});}
async function get(e,id,mappings){const mm=enrich(mappings);for(const name of ['id','optimistic'])if(!mm.some(m=>m.name===name))mm.push(f(name));return http(url(e)+'/get.json?id='+encodeURIComponent(id),{method:'POST',headers,body:JSON.stringify(mm)});}
const indexes={};async function refresh(e){let fields=[f('id'),f('code'),f('optimistic'),r('organization')];if(e==='core-cms/block-template')fields.push(r('parent'));if(e==='core-cms/page-context')fields=[f('id'),f('optimistic'),f('url'),f('site'),r('organization')];if(blog){if(e==='core/user')fields=[f('id'),f('optimistic'),f('name'),f('fullname')];if(e==='core/language')fields=[f('id')];if(e.endsWith('/blog-post-category'))fields=[f('id'),f('optimistic'),f('nls'),f('slug'),r('organization')];if(e.endsWith('/blog-post'))fields=[f('id'),f('optimistic'),f('permalink'),f('slug'),f('metadata'),r('organization')];if(e.endsWith('/localized-blog-content'))fields=[f('id'),f('optimistic'),r('blogPost'),r('language'),r('organization')];}indexes[e]=await list(e,fields);return indexes[e];}
for(const e of ['core/organization','core/media-library','core/workflow','core-cms/form-type','core-cms/block-template','core-cms/page-context'])await refresh(e);
if(blog)for(const e of ['core/user','core/language',...blogEntities])await refresh(e);
await fs.writeFile(run+'/before.json',JSON.stringify(indexes,null,2),{flag:'wx',mode:0o600}).catch(e=>{if(e.code!=='EEXIST')throw e;});
function blockPath(row,seen=new Set()){if(seen.has(row.id))throw Error('Block parent cycle');seen.add(row.id);const p=row.parent?.id;if(p){const parent=indexes['core-cms/block-template'].find(x=>x.id===p);if(!parent)throw Error('Missing parent');return blockPath(parent,seen)+'/'+row.code;}return row.code;}
function match(k,rowsOverride){const ident=identities[k];if(!ident||!indexes[ident.entity])return null;const s=ident.selector;if(blog&&['core/user','core/language',...blogEntities].includes(ident.entity)){const expected=ops.find(o=>o.capture===k)?.bodyTemplate?.entities[0];const rows=(rowsOverride||indexes[ident.entity]).filter(row=>matchesBlog(ident,row,bindings,expected));if(rows.length>1)throw Error('Ambiguous '+k);return rows[0]||null;}const rows=(rowsOverride||indexes[ident.entity]).filter(row=>(!s.code||row.code===s.code)&&(!s.organizationCode||row.organization?.code===s.organizationCode)&&(!s.path||blockPath(row)===s.path)&&(!('url'in s)||row.url===s.url)&&(!('site'in s)||(row.site??null)===s.site));if(rows.length>1)throw Error('Ambiguous '+k);return rows[0]||null;}
function bind(k,row){bindings[k]=row.id;bindings['optimistic|'+k]=row.optimistic??null;}
for(const k of Object.keys(identities)){const row=match(k);if(row)bind(k,row);}
async function bindStates(){const row=match('workflow|FORM');if(!row)return;const data=await get('core/workflow',row.id,[f('id'),f('optimistic'),{name:'states',type:'collection',mappings:[f('id'),f('code')]}]);bind('workflow|FORM',data);for(const st of data.states||[])bindings['state|FORM|'+st.code]=st.id;}
await bindStates();
if(blog){for(const k of Object.keys(identities).filter(k=>/^(author|language|organization)\|/.test(k)&&JSON.stringify(ops).includes(JSON.stringify(k))))if(bindings[k]===undefined)throw Error('Missing external identity '+k);}
if(preflight){await fs.writeFile(run+'/preflight.json',JSON.stringify({ok:true,operations:ops.length,blog,checkedAt:new Date().toISOString()}));console.log('Read-only identity preflight passed');process.exit(0);}
async function mediaHash(kind,id,name){const endpoint=kind==='image'?'/core/image/'+id+'/get':kind==='video'?'/core/api/video/'+id+'/stream/'+encodeURIComponent(name):'/core/api/'+kind+'/'+id+'/get';const res=await fetch(origin+endpoint,{headers:{Authorization:headers.Authorization,Connection:'close'},redirect:'error',signal:AbortSignal.timeout(45000)});if(!res.ok)throw Error('Media read HTTP '+res.status);const bytes=Buffer.from(await res.arrayBuffer());return crypto.createHash('sha256').update(bytes).digest('hex');}
async function locateMedia(op){const s=identities[op.capture].selector,kind=identities[op.capture].entity.split('/')[1];const library=bindings['library|'+s.libraryCode];if(library===undefined)throw Error('Library missing '+s.libraryCode);const rows=await list('core/'+kind,[f('id'),f('name'),f('format'),f('size'),r('mediaLibrary')],[{property:'mediaLibrary.id',operator:'=',type:'INTEGER',value:String(library)},{property:'name',operator:'=',type:'STRING',value:s.name}]);const matches=[];for(const row of rows)if(await mediaHash(kind,row.id,s.name)===s.sha256)matches.push(row);if(matches.length>1)throw Error('Ambiguous identical media '+s.name);return matches[0]||null;}
const pagesOnly=process.argv.includes('--resume-pages');if(pagesOnly){for(const op of ops.filter(o=>!o.key.startsWith('page|'))){const verified=journal.verified.find(x=>x.key===op.key);if(!verified)throw Error('Cannot resume pages before all dependencies are verified');if(op.multipartTemplate)bindings[op.capture]=verified.id;}}
const verifiedMedia=new Map();
if(process.argv.includes('--resume-verified-media')){for(const op of ops.filter(o=>o.multipartTemplate)){const prior=[...journal.verified,...journal.reused].find(x=>x.key===op.key);if(!prior)throw Error('Media not verified '+op.key);verifiedMedia.set(op.key,{id:prior.id});}}
const priorMedia=pagesOnly||process.argv.includes('--resume-verified-media')?[]:ops.filter(o=>o.multipartTemplate&&journal.verified.some(x=>x.key===o.key));for(let i=0;i<priorMedia.length;i+=4){const batch=priorMedia.slice(i,i+4);const results=await Promise.allSettled(batch.map(locateMedia));for(let n=0;n<results.length;n++){if(results[n].status!=='fulfilled'||!results[n].value)throw Error('Previously verified media cannot be verified '+batch[n].key);verifiedMedia.set(batch[n].key,results[n].value);}}
async function transferMedia(template,i){
 (blog?assertBlogWritePath:assertWritePath)(template.path);
  let row=verifiedMedia.get(template.key)||await locateMedia(template);
  if(row){bind(template.capture,row);if(!journal.verified.some(x=>x.key===template.key))journal.reused.push({key:template.key,id:row.id});await persist();return;}
  if(journal.attempts.some(x=>x.key===template.key)){
   const attempt=journal.attempts.find(x=>x.key===template.key);
   if(!process.argv.includes('--reconcile-media-absence')||Date.now()-Date.parse(attempt.at)<120000)throw Error('Previous upload uncertain; no blind retry');
   // A deliberately interrupted upload can be retried only after a fresh second
   // absence check, never for an ambiguous match or a failed catalog request.
   await new Promise(r=>setTimeout(r,2000));if(await locateMedia(template))throw Error('Media appeared during absence reconciliation; rerun to reuse it');
   (journal.reconciledAbsences??=[]).push({key:template.key,at:new Date().toISOString(),previousAttempt:attempt.at});journal.attempts=journal.attempts.filter(x=>x.key!==template.key);await persist();
  }
  const op=resolve(template,bindings),part=op.multipartTemplate.files[0],bytes=await fs.readFile(pkg+'/'+part.path);const form=new FormData();form.append('library',String(op.multipartTemplate.library));form.append('files',new Blob([bytes],{type:part.contentType}),part.filename);
  journal.attempts.push({key:op.key,at:new Date().toISOString()});await persist();
  const response=await fetch(origin+op.path,{method:'POST',headers:{Authorization:headers.Authorization,'X-Organization-Code':'SYSTEM',Connection:'close'},body:form,redirect:'error',signal:AbortSignal.timeout(90000)});const text=await response.text();if(!response.ok){await fs.writeFile(run+'/last-error.txt',text,{mode:0o600});throw Error('Upload HTTP '+response.status);}
  row=await locateMedia(template);if(!row)throw Error('Uploaded media not found');bind(template.capture,row);journal.verified.push({key:op.key,id:row.id,sha256:part.sha256});await persist();console.log(JSON.stringify({step:i+1,total:ops.length,phase:'media',name:part.filename}));return;
}
async function transferRecord(template,i){
 const entity=identities[template.capture].entity;let row=match(template.capture);if(row)bind(template.capture,row);if(entity==='core/workflow')await bindStates();
 const op=resolve(template,bindings),desired=op.bodyTemplate.entities[0];if(desired.optimistic===null){delete desired.optimistic;op.bodyTemplate.mappings=op.bodyTemplate.mappings.filter(m=>m.name!=='optimistic');}const updating=desired.id!==undefined;
 if(row){
  const actual=await get(entity,row.id,op.bodyTemplate.mappings);
  if(equal(desired,actual)){bind(op.capture,actual);if(!journal.verified.some(x=>x.key===op.key))journal.reused.push({key:op.key,id:row.id});await persist();return;}
  if(!updating)throw Error('Existing configuration differs '+op.key);
  if(!journal.verified.some(x=>x.key===op.capture+'#shell'||x.key===op.capture+'#states'))throw Error('Refusing to change unrelated existing configuration '+op.key);
  desired.optimistic=actual.optimistic;
 }else if(updating)throw Error('Update target missing');
 if(journal.attempts.some(x=>x.key===op.key)){
  const attempt=journal.attempts.find(x=>x.key===op.key);
  const remaining=120000-(Date.now()-Date.parse(attempt.at));if(blog&&!updating&&process.argv.includes('--reconcile-save-absence')&&remaining>0&&remaining<=60000)await new Promise(r=>setTimeout(r,remaining));
  if(!blog||updating||!process.argv.includes('--reconcile-save-absence')||Date.now()-Date.parse(attempt.at)<120000)throw Error('Previous save outcome unresolved; no blind retry');
  const fresh=await refresh(entity);if(match(op.capture,fresh))throw Error('Save appeared during absence reconciliation; rerun to reuse it');
  (journal.reconciledAbsences??=[]).push({key:op.key,at:new Date().toISOString(),previousAttempt:attempt.at});journal.attempts=journal.attempts.filter(x=>x.key!==op.key);await persist();
 }
 journal.attempts.push({key:op.key,at:new Date().toISOString()});await persist();await fs.writeFile(run+'/request-'+String(i).padStart(3,'0')+'.json',JSON.stringify(op.bodyTemplate),{mode:0o600});
 await http(origin+op.path,{method:'POST',headers,body:JSON.stringify(op.bodyTemplate)},false);
 const fresh=await refresh(entity);row=match(op.capture,fresh);if(!row)throw Error('Saved record not found');const actual=await get(entity,row.id,op.bodyTemplate.mappings);await fs.writeFile(run+'/readback-'+String(i).padStart(3,'0')+'.json',JSON.stringify(actual),{mode:0o600});if(!equal(desired,actual))throw Error('Read-back differs '+op.key);bind(op.capture,actual);if(entity==='core/workflow')await bindStates();journal.verified.push({key:op.key,id:row.id});await persist();console.log(JSON.stringify({step:i+1,total:ops.length,phase:'save',key:op.key}));
}
let stopped=false;
for(let i=0;i<ops.length;i++){
 const template=ops[i];if(pagesOnly&&!template.key.startsWith('page|'))continue;try{
 (blog?assertBlogWritePath:assertWritePath)(template.path);
 if(template.multipartTemplate){
  const batch=[];for(let n=i;n<Math.min(i+4,ops.length)&&ops[n].multipartTemplate;n++)batch.push({template:ops[n],i:n});
  const results=await Promise.allSettled(batch.map(x=>transferMedia(x.template,x.i)));
  const failed=results.findIndex(r=>r.status==='rejected');
  if(failed>=0){template.failedMediaKey=batch[failed].template.key;throw results[failed].reason;}
  i+=batch.length-1;continue;
 }

 if(blog&&blogEntities.includes(identities[template.capture].entity)){
  const batch=[];for(let n=i;n<Math.min(i+4,ops.length)&&ops[n].stage===template.stage&&blogEntities.includes(identities[ops[n].capture].entity);n++)batch.push({template:ops[n],i:n});
  const results=await Promise.allSettled(batch.map(x=>transferRecord(x.template,x.i)));const failed=results.findIndex(r=>r.status==='rejected');
  if(failed>=0){template.failedMediaKey=batch[failed].template.key;throw results[failed].reason;}
  i+=batch.length-1;
 }else await transferRecord(template,i);

 }catch(e){journal.blocked.push({key:template.failedMediaKey||template.key,error:e.message,at:new Date().toISOString()});if(e.detail)await fs.writeFile(run+'/last-error.txt',e.detail,{mode:0o600});await persist();console.log(JSON.stringify({blocked:template.failedMediaKey||template.key,error:e.message}));stopped=true;break;}
}
await fs.writeFile(run+'/after-indexes.json',JSON.stringify(indexes,null,2),{mode:0o600});console.log(JSON.stringify({stopped,verified:journal.verified.length,reused:journal.reused.length}));

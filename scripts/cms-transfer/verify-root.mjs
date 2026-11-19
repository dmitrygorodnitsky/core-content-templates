// Read-only verification of deployed root CMS configuration and rendered HTML.
import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';
import {resolve,equal} from './runtime.mjs';
const origin='https://prod.servicewand.com',pkg=path.resolve(process.argv.includes('--package')?process.argv[process.argv.indexOf('--package')+1]:'tmp/cms-root-stage-1'),run=path.resolve(process.argv.includes('--run')?process.argv[process.argv.indexOf('--run')+1]:'tmp/cms-root-deploy-2026-11-17');
const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const ops=await read(pkg+'/requests.json'),identities=await read(pkg+'/identities.json'),bindings=await read(run+'/bindings.json');
console.log('Ready for production API key (hidden).');process.stdin.setRawMode(true);let key='';for await(const c of process.stdin){key+=c;if(key.includes('\n'))break;}process.stdin.setRawMode(false);key=key.trim();
async function http(url,opts={},retry=true){if(new URL(url).origin!==origin)throw Error('Unexpected host');for(let i=0;;i++){try{const r=await fetch(url,{...opts,redirect:'error',headers:{Connection:'close',...opts.headers},signal:AbortSignal.timeout(60000)});const text=await r.text();if(!r.ok){const e=Error('HTTP '+r.status+' '+new URL(url).pathname);e.status=r.status;e.detail=text.slice(0,3000);throw e;}return text?JSON.parse(text):null;}catch(e){if(!retry||i>=2||(e.status&&![502,503,504,429].includes(e.status)))throw e;await new Promise(r=>setTimeout(r,500));}}}
const resource=await http(origin+'/core/.well-known/oauth-protected-resource');const meta=await http(resource.authorization_servers[0].replace(/\/$/,'')+'/.well-known/openid-configuration');const auth=await http(meta.token_endpoint,{method:'POST',headers:{'X-API-Key':key,'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=api_key&scope=openid'},false);key=null;if(!auth?.access_token)throw Error('Authentication failed');
const headers={Authorization:'Bearer '+auth.access_token,'X-Organization-Code':'SYSTEM','Content-Type':'application/json'};
const f=name=>({name}),r=name=>({name,type:'identifier',key:'id',mappings:[f('id'),f('code')]}),url=e=>origin+'/'+e.split('/')[0]+'/api/'+e.split('/')[1];
async function list(e,mappings,filters=[]){let rows=[],size;for(let offset=0;;offset+=100){const data=await http(url(e)+'/list.json',{method:'POST',headers,body:JSON.stringify({mappings,filters,offset,pageSize:100,sorting:[{field:'id',direction:'ASC'}]})});if(size!==undefined&&size!==data.resultSize)throw Error('Catalog changed '+e);size=data.resultSize;rows.push(...data.result);if(rows.length>=size)break;if(!data.result.length)throw Error('Incomplete '+e);}if(rows.length!==size)throw Error('Invalid count '+e);return rows;}
function enrich(mappings){return mappings.map(m=>{const n={...m};if(['parents','permissions','targets','categories','tags','images'].includes(n.name)&&n.mappings)n.type='collection';if(n.mappings)n.mappings=enrich(n.mappings);return n;});}
async function get(e,id,mappings){const mm=enrich(mappings);for(const name of ['id','optimistic'])if(!mm.some(m=>m.name===name))mm.push(f(name));return http(url(e)+'/get.json?id='+encodeURIComponent(id),{method:'POST',headers,body:JSON.stringify(mm)});}

const report={publicMedia:[],checkedAt:new Date().toISOString(),configuration:[],previews:[],unrelated:[],issues:[]};
const final=new Map();for(const op of ops)if(!op.multipartTemplate)final.set(op.capture,op);
async function verifyConfiguration(key,t){
 const op=resolve(t,bindings),desired=op.bodyTemplate.entities[0],id=bindings[key];
 if(id===undefined){report.issues.push('Missing binding '+key);return;}
 const actual=await get(identities[key].entity,id,op.bodyTemplate.mappings);
 const ok=equal(desired,actual);report.configuration.push({key,ok});if(!ok)report.issues.push('Configuration mismatch '+key);
 if(key.startsWith('page|')){
  let res,html;for(let attempt=0;attempt<3;attempt++){try{res=await fetch(origin+'/core-cms/page-context/'+id+'/preview.html?cmsEdit=true',{method:'POST',headers:{...headers,Connection:'close'},body:JSON.stringify({templateId:actual.template.id,enabledTemplates:actual.enabledTemplates,parameters:{}}),redirect:'error',signal:AbortSignal.timeout(60000)});html=await res.text();break;}catch(e){if(attempt===2){res={ok:false,status:0};html='Request failed: '+e.message;}}}await fs.writeFile(run+'/preview-'+key.split('|').at(-1).replaceAll('/','_'),html);
  const ok=res.ok&&/<(?:html|body|div|section)[\s>]/i.test(html)&&!html.includes('TemplateException');
  report.previews.push({page:actual.url,status:res.status,bytes:Buffer.byteLength(html),ok});if(!ok)report.issues.push('Preview failed '+actual.url);
 }
 console.log(JSON.stringify({checked:key}));
}
const configurations=[...final];
for(let i=0;i<configurations.length;i+=4){const batch=configurations.slice(i,i+4);const results=await Promise.allSettled(batch.map(([key,t])=>verifyConfiguration(key,t)));for(let j=0;j<results.length;j++)if(results[j].status==='rejected')report.issues.push('Configuration read failed '+batch[j][0]+': '+results[j].reason.message);await fs.writeFile(run+'/verification.json',JSON.stringify(report,null,2));}
const before=await read(run+'/before.json');
for(const e of ['core-cms/block-template','core-cms/page-context']){
 const mappings=e.endsWith('block-template')?[f('id'),f('code'),f('optimistic'),r('organization'),r('parent')]:[f('id'),f('optimistic'),f('url'),f('site'),r('organization')];
 const rows=await list(e,mappings);
 for(const prior of before[e]){const now=rows.find(x=>x.id===prior.id),ok=equal(prior,now)&&(prior.optimistic??0)===(now?.optimistic??0);report.unrelated.push({entity:e,key:prior.code||prior.url,ok});if(!ok)report.issues.push('Pre-existing entity changed '+(prior.code||prior.url));}
}
const mediaOps=ops.filter(o=>o.multipartTemplate);
for(let i=0;i<mediaOps.length;i+=4){const results=await Promise.allSettled(mediaOps.slice(i,i+4).map(async o=>{const ident=identities[o.capture],kind=ident.entity.split('/')[1],id=bindings[o.capture];const endpoint=kind==='image'?'/core/image/'+id+'/get':kind==='video'?'/core/api/video/'+id+'/stream/'+encodeURIComponent(ident.selector.name):'/core/api/'+kind+'/'+id+'/get';const res=await fetch(origin+endpoint,{headers:{Connection:'close'},redirect:'error',signal:AbortSignal.timeout(45000)});const bytes=Buffer.from(await res.arrayBuffer());return {key:o.capture,status:res.status,ok:res.ok&&crypto.createHash('sha256').update(bytes).digest('hex')===ident.selector.sha256};}));for(const result of results){if(result.status==='fulfilled'){report.publicMedia.push(result.value);if(!result.value.ok)report.issues.push('Public media failed '+result.value.key);}else report.issues.push('Public media request failed '+result.reason.message);}}
await fs.writeFile(run+'/verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify({configuration:report.configuration.length,previews:report.previews,unrelated:report.unrelated.length,issues:report.issues}));

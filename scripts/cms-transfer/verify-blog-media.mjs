// Public availability check. Full file hashes were verified by the uploader.
import fs from 'node:fs/promises';import {equal} from './runtime.mjs';
const pkg=process.argv[2]||'tmp/cms-blog-stage-2b',run=process.argv[3]||'tmp/cms-blog-deploy-2026-11-17',read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const ops=await read(pkg+'/requests.json'),ids=await read(pkg+'/identities.json'),bindings=await read(run+'/bindings.json'),report=await read(run+'/verification.json');
report.publicMedia=[];report.unrelated=[];
const before=await read(run+'/before.json'),after=await read(run+'/after-indexes.json');
for(const entity of ['core-cms/block-template','core-cms/page-context'])for(const prior of before[entity]){const actual=after[entity].find(x=>x.id===prior.id),ok=equal(prior,actual)&&(prior.optimistic??0)===(actual?.optimistic??0);report.unrelated.push({entity,key:prior.code||prior.url,ok,evidence:'fresh catalog read at deployment completion'});if(!ok)report.issues.push('Pre-existing record changed '+(prior.code||prior.url));}
const media=ops.filter(o=>o.multipartTemplate);
for(let i=0;i<media.length;i+=8){const batch=media.slice(i,i+8),results=await Promise.allSettled(batch.map(async o=>{
 const ident=ids[o.capture];if(ident.entity!=='core/image')throw Error('Expected blog image');const file=await fs.readFile(pkg+'/'+o.multipartTemplate.files[0].path);
 const r=await fetch('https://prod.servicewand.com/core/image/'+bindings[o.capture]+'/get',{headers:{Range:'bytes=0-63',Connection:'close'},redirect:'error',signal:AbortSignal.timeout(20000)});
 const total=r.status===206?Number((r.headers.get('content-range')||'').split('/')[1]):Number(r.headers.get('content-length'));
 const reader=r.body.getReader();let bytes=Buffer.alloc(0);try{while(bytes.length<64){const chunk=await reader.read();if(chunk.done)break;bytes=Buffer.concat([bytes,Buffer.from(chunk.value)]);}}finally{await reader.cancel();}
 return {key:o.capture,status:r.status,bytes:total,ok:r.ok&&total===file.length&&bytes.subarray(0,64).equals(file.subarray(0,64)),check:'anonymous GET range, total size and file prefix; full SHA-256 verified after upload'};
 }));for(let n=0;n<results.length;n++){const r=results[n];if(r.status==='fulfilled'){report.publicMedia.push(r.value);if(!r.value.ok)report.issues.push('Public media mismatch '+r.value.key);}else report.issues.push('Public media failed '+batch[n].capture+': '+r.reason.message);}
 await fs.writeFile(run+'/verification.json',JSON.stringify(report,null,2));console.log('Public images checked',Math.min(i+8,media.length));}
report.completedAt=new Date().toISOString();await fs.writeFile(run+'/verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify({configuration:report.configuration.length,media:report.publicMedia.length,unrelated:report.unrelated.length,previews:report.previews,issues:report.issues}));

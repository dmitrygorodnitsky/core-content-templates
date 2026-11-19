// Anonymous checks only; no configuration writes and no redirects off prod.
import fs from 'node:fs/promises';
const origin='https://prod.servicewand.com',pkg=process.argv[2]||'tmp/cms-blog-stage-2b',run=process.argv[3]||'tmp/cms-blog-deploy-2026-11-17';
const ops=JSON.parse(await fs.readFile(pkg+'/requests.json','utf8'));
const expected=ops.filter(o=>o.path==='/core-cms/api/blog-post/save.json').map(o=>o.bodyTemplate.entities[0]).filter(p=>p.enabled);
const request=async(p,options={})=>fetch(origin+p,{...options,redirect:'manual',signal:AbortSignal.timeout(60000),headers:{Connection:'close',...options.headers}});
const report={checkedAt:new Date().toISOString(),issues:[],pages:[]};
const response=await request('/core-cms/public/SERVICEWAND/blog-post/list.json',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({offset:0,first:0,pageSize:100,filters:[],sorting:[{field:'permalink',direction:'DESC'}]})});
report.apiStatus=response.status;
if(response.ok){const data=await response.json(),rows=Array.isArray(data)?data:data.result;report.publicCount=rows?.length;report.resultSize=data.resultSize;
 const wanted=new Set(expected.map(p=>p.permalink));report.missing=expected.filter(p=>!rows.some(r=>r.permalink===p.permalink)).map(p=>p.permalink);report.unexpected=rows.filter(p=>!wanted.has(p.permalink)).map(p=>p.permalink);if(report.missing.length||report.unexpected.length)report.issues.push('Public list differs from 60 enabled posts');
}else report.issues.push('Public blog API failed');
const paths=['/blogs',...expected.map(p=>'/blog/'+p.permalink.replace(/^\/+/,''))];
for(let i=0;i<paths.length;i+=4){const results=await Promise.allSettled(paths.slice(i,i+4).map(async p=>{const r=await request(p),html=await r.text();const article=html.match(/<article[^>]*data-blog-document[^>]*>([\s\S]*?)<\/article>/i)?.[1]||'';const articleText=article.replace(/<[^>]+>/g,' ').trim();const ok=r.ok&&(p==='/blogs'||articleText.length>50)&&html.length>1000&&!html.includes('TemplateException')&&(p==='/blogs'?html.includes('data-blog-index'):html.includes('data-blog-document'));return {path:p,status:r.status,bytes:Buffer.byteLength(html),ok};}));for(let n=0;n<results.length;n++){const r=results[n];if(r.status==='fulfilled'){report.pages.push(r.value);if(!r.value.ok)report.issues.push('Page failed '+r.value.path);}else report.issues.push('Request failed '+paths[i+n]+': '+r.reason.message);}console.log('Public pages checked',Math.min(i+4,paths.length));}
await fs.writeFile(run+'/public-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify({apiStatus:report.apiStatus,publicCount:report.publicCount,pages:report.pages.length,issues:report.issues}));

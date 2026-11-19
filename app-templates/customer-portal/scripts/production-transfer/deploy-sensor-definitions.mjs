import fs from 'node:fs/promises';
const origin='https://prod.servicewand.com';
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

const run='tmp/sensor-deploy-2026-11-17';await fs.mkdir(run,{recursive:true,mode:0o700});
const definitions=JSON.parse(await fs.readFile('app-templates/customer-portal/content/production-transfer/sensor-definitions-2026-11-17.json','utf8'));
const primitive=(...names)=>names.map(name=>({name}));
const ref=name=>({name,type:'identifier',key:'id',mappings:primitive('id','code')});
const mappings=[...primitive('id','code','nls','optimistic'),ref('resourceType'),ref('sensorType'),ref('defaultScript')];
async function list(entity,fields){const x=await request(origin+'/core-rm/api/'+entity+'/list.json',{mappings:fields,pageSize:1000,sorting:[{field:'id',direction:'ASC'}]},headers);if(x.result.length!==x.resultSize||new Set(x.result.map(r=>r.id)).size!==x.result.length)throw Error('Incomplete catalog '+entity);return x.result;}
function unique(rows,code){const found=rows.filter(r=>r.code===code);if(found.length!==1)throw Error('Missing/ambiguous '+code);return found[0];}
const resources=await list('resource-type',[...primitive('id','code'),{name:'sensorDefinitions',type:'collection',mappings:primitive('id','code')}]);
const types=await list('sensor-type',primitive('id','code'));
const before=await list('sensor-definition',mappings);await fs.writeFile(run+'/before.json',JSON.stringify({resources,types,definitions:before},null,2),{flag:'wx',mode:0o600});
const evidence=[];
for(const spec of definitions){
 if(spec.defaultScriptCode)throw Error('Unexpected script dependency');
 const resourceType=unique(resources,spec.resourceTypeCode),sensorType=unique(types,spec.sensorTypeCode);
 const expected={code:spec.code,nls:spec.nls,resourceType:{id:resourceType.id},sensorType:{id:sensorType.id},defaultScript:null};
 let current=(await list('sensor-definition',mappings)).filter(r=>r.code===spec.code);
 if(current.length>1)throw Error('Ambiguous definition');
 if(!current.length){
  const body={entities:[expected],mappings:mappings.filter(m=>!['id','optimistic'].includes(m.name))};
  await fs.writeFile(run+'/'+spec.code+'-request.json',JSON.stringify(body,null,2),{flag:'wx',mode:0o600});
  await request(origin+'/core-rm/api/sensor-definition/save.json',body,headers,true);
  current=(await list('sensor-definition',mappings)).filter(r=>r.code===spec.code);
 }
 const held=unique(current,spec.code);
 if(held.resourceType?.id!==resourceType.id||held.sensorType?.id!==sensorType.id||held.defaultScript||JSON.stringify(held.nls)!==JSON.stringify(spec.nls))throw Error('Read-back mismatch '+spec.code);
 const resource=unique(await list('resource-type',[...primitive('id','code'),{name:'sensorDefinitions',type:'collection',mappings:primitive('id','code')}]),spec.resourceTypeCode);
 if(!resource.sensorDefinitions?.some(d=>d.id===held.id&&d.code===spec.code))throw Error('Inverse resource link missing');
 evidence.push({code:spec.code,resourceType:spec.resourceTypeCode,sensorType:spec.sensorTypeCode,verified:true});
 console.log(JSON.stringify(evidence.at(-1)));
}
await fs.writeFile(run+'/verified.json',JSON.stringify(evidence,null,2),{mode:0o600});

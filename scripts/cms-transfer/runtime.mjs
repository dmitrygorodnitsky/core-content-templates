export function resolve(v,b){if(Array.isArray(v))return v.map(x=>resolve(x,b));if(v&&typeof v==='object'){if(Object.keys(v).length===1&&'$ref'in v){if(!(v.$ref in b))throw Error('Unresolved '+v.$ref);return b[v.$ref];}return Object.fromEntries(Object.entries(v).map(([k,x])=>[resolve(k,b),resolve(x,b)]));}if(typeof v==='string')return v.replace(/\{\{REF:(.*?)\}\}/g,(_,k)=>{if(!(k in b))throw Error('Unresolved '+k);return String(b[k]);});return v;}
export function equal(expected,actual,path=''){
 if(path.endsWith('.optimistic'))return true;
 // Image discriminator is required on write but omitted by identifier read mappings.
 if(/\.(?:heroImage|image|images\.\d+)\.mediaType$/.test(path)&&expected==='image'&&actual===undefined)return true;
 if(expected===null)return actual==null;
 if(Array.isArray(expected)){
  if(!Array.isArray(actual))return expected.length===0&&actual==null;
  if(expected.length!==actual.length)return false;
  if(path.endsWith('.enabledTemplates'))return new Set(expected).size===new Set(actual).size&&expected.every(x=>actual.includes(x));
  return expected.every((v,i)=>equal(v,v&&typeof v==='object'&&(v.id!==undefined||v.code!==undefined)?actual.find(x=>x&&(v.id!==undefined?x.id===v.id:x.code===v.code)):actual[i],path+'.'+i));
 }
 if(expected&&typeof expected==='object')return actual!=null&&Object.entries(expected).every(([k,v])=>equal(v,actual[k],path+'.'+k));
 if(typeof expected==='string'&&typeof actual==='string'&&/\.(onEnter|onExit|onDelete|onUpdate|html|javascript|css|head)$/.test(path))return expected.replace(/\r\n/g,'\n').trimEnd()===actual.replace(/\r\n/g,'\n').trimEnd();
 if((expected===''||expected==null)&&(actual===''||actual==null)&&/\.(onEnter|onExit|onUpdate|onDelete|html|javascript|css|head)$/.test(path))return true;
 return expected===actual;
}
export function assertWritePath(path){if(!/^\/(core|core-cms)\/api\/(media-library|media|workflow|form-type|block-template|page-context)\/save\.json$/.test(path))throw Error('Write not in authorized CMS scope');}

import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve,equal,assertWritePath} from './runtime.mjs';
test('unresolved destinations fail before a request can be constructed',()=>{
 assert.throws(()=>resolve({organization:{id:{$ref:'organization|SERVICEWAND'}}},{}),/Unresolved/);
 assert.throws(()=>resolve({html:'<img src="/core/image/{{REF:media|logo}}/get">'},{}),/Unresolved/);
 assert.deepEqual(resolve({values:{'{{REF:block|root}}':{image:{$ref:'media|logo'}}}},{'block|root':'target-block','media|logo':'target-image'}),{values:{'target-block':{image:'target-image'}}});
});
test('read-back tolerates generated metadata but rejects rights or destination drift',()=>{
 assert(equal({code:'FORM',permissions:[]},{id:99,code:'FORM',permissions:[],optimistic:1}));
 assert(!equal({permissions:[]},{permissions:[{code:'PUBLIC'}]}));
 assert(!equal({organization:{id:1}},{organization:{id:2}}));
 assert(!equal({values:{title:'Original'}},{values:{title:'Changed'}}));
});
test('write scope excludes submissions, state transitions, and unrelated configuration',()=>{
 for(const p of ['/core-cms/api/form/submit.json','/core/api/workflow/1/send-event.json','/core/api/schedule/save.json','/core/api/organization/save.json'])assert.throws(()=>assertWritePath(p));
 assert.doesNotThrow(()=>assertWritePath('/core-cms/api/page-context/save.json'));
});
test('enabled blocks are a set, ordered attribute lists remain ordered',()=>{
 assert(equal({enabledTemplates:['header','body']},{enabledTemplates:['body','header']}));
 assert(!equal({enabledTemplates:['header','body']},{enabledTemplates:['body','footer']}));
 assert(!equal({attributeOrder:['a','b']},{attributeOrder:['b','a']}));
});

test('write-only image discriminator does not hide wrong image identity',()=>{
 assert(equal({images:[{id:'image-a',mediaType:'image'}]},{images:[{id:'image-a'}]}));
 assert(!equal({images:[{id:'image-a',mediaType:'image'}]},{images:[{id:'image-b'}]}));
 assert(!equal({heroImage:{id:'a',mediaType:'image'}},{heroImage:{id:'a',mediaType:'video'}}));
});

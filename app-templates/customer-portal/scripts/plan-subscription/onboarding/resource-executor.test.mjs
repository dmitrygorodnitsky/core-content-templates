import test from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

test('actual Property owner lookup traverses later parents and terminates cycles',async()=>{
 const source=await fs.readFile(new URL('./resource-executor.java.inc',import.meta.url),'utf8');
 const method=source.slice(source.indexOf('    private Integer onboardingAttributeOwner'),source.indexOf('    private static long onboardingNumber'));
 const java=`import java.util.*;public class ResourceAttributeOwnerTest {
 static Object property(Object bean,String key){return bean==null?null:((Map<?,?>)bean).get(key);}
 static Collection<?> collection(Object raw){return raw instanceof Collection<?> rows?rows:List.of();}
 ${method}
 static Map<String,Object> m(Object...p){Map<String,Object>r=new LinkedHashMap<>();for(int i=0;i<p.length;i+=2)r.put((String)p[i],p[i+1]);return r;}
 public static void main(String[]args){ResourceAttributeOwnerTest t=new ResourceAttributeOwnerTest();
 Map<String,Object> empty=m("id",1,"attributes",List.of(),"parents",List.of()), owner=m("id",2,"attributes",List.of(m("code","ADDRESS")),"parents",List.of());
 Map<String,Object> child=m("id",3,"attributes",List.of(),"parents",List.of(empty,owner));
 if(!Integer.valueOf(2).equals(t.onboardingAttributeOwner(child,"ADDRESS",new HashSet<>())))throw new AssertionError("later parent skipped");
 empty.put("parents",List.of(child));if(!Integer.valueOf(2).equals(t.onboardingAttributeOwner(child,"ADDRESS",new HashSet<>())))throw new AssertionError("cycle interrupted other parent");
 if(t.onboardingAttributeOwner(child,"MISSING",new HashSet<>())!=null)throw new AssertionError("missing owner invented");}}
 `;
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'plan-subscription-owner-'));
 try{await fs.writeFile(path.join(dir,'ResourceAttributeOwnerTest.java'),java);execFileSync('javac',['-d',dir,path.join(dir,'ResourceAttributeOwnerTest.java')],{stdio:'pipe'});execFileSync('java',['-cp',dir,'ResourceAttributeOwnerTest'],{stdio:'pipe'});}finally{await fs.rm(dir,{recursive:true,force:true});}
});

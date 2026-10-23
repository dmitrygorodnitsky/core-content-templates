import test from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

test('actual Checkout projection excludes receipts/tokens and preserves rounding gate',async()=>{
 const text=await fs.readFile(new URL('./commands.java.inc',import.meta.url),'utf8');
 const method=text.slice(text.indexOf('    private Map<String,Object> buyerCheckoutView'),text.indexOf('    private String checkoutTaxHtml'));
 const cms=await fs.readFile(new URL('../PLAN_SUBSCRIPTION_WORKFLOW_V11.java',import.meta.url),'utf8');
 const fields=cms.match(/FIELDS = List\.of\(([\s\S]*?)\);/)[1];
 const java=`import java.util.*;public class CheckoutProjectionTest {
 private static final List<String> FIELDS=List.of(${fields});
 static class Form {Long getId(){return 99L;}boolean hasState(String state){return state.equals("CHECKOUT_PREPARED");}Object findFirstAttributeValue(String code){return "PUBLIC_VALUE";}}
 @SuppressWarnings("unchecked") private static Map<String,Object> map(Object raw){return raw instanceof Map<?,?>?(Map<String,Object>)raw:Map.of();}
 ${method}
 static Map<String,Object> m(Object...p){Map<String,Object>r=new LinkedHashMap<>();for(int i=0;i<p.length;i+=2)r.put((String)p[i],p[i+1]);return r;}
 public static void main(String[]args){
 Map<String,Object> preview=m("lines",List.of(m("role","BASE_PLAN","productName","Plan","quantity",1,"unitAmount","1.99","lineAmount","1.99","metadata","PRIVATE_SECRET","priceId","PRIVATE_SECRET")),"subtotal","1.99","currencyCode","CAD","taxStatus","ROUNDING_POLICY_REQUIRED","totalPayable",null,
 "taxQuote",m("status","CONFIGURED_RATES_APPLIED","taxAmount","0.001","totalWithTaxes","1.991","roundingStatus","ROUNDING_POLICY_REQUIRED","rates",m("PRIVATE_SECRET","10")),
 "entitlements",m("propertyCapacity",m("limit",50,"overallMaximum",500),"weather",m("selected",false,"propertyCount",0),"privateManifest","PRIVATE_SECRET"));
 Map<String,Object> saved=m("checkout",m("preview",preview,"checkoutDigest","PUBLIC_DIGEST","executionUserId","PRIVATE_SECRET"),"devCapturedToken","PRIVATE_SECRET","confirmation",m("tokenId","PRIVATE_SECRET"),"purchase",m("accountId","PRIVATE_SECRET"));
 Map<String,Object> dto=new CheckoutProjectionTest().buyerCheckoutView(new Form(),saved);
 if(dto.toString().contains("PRIVATE_SECRET") || dto.get("totalPayable")!=null || !"ROUNDING_POLICY_REQUIRED".equals(dto.get("taxStatus")) || !Boolean.FALSE.equals(dto.get("canPay")) || !Boolean.FALSE.equals(dto.get("paymentEnabled")))throw new AssertionError(dto);
 if(!"NOT_SELECTED".equals(map(dto.get("weather")).get("status")))throw new AssertionError();
 preview.put("taxStatus","CONFIGURED_RATES_APPLIED");preview.put("totalPayable","2.00");map(preview.get("taxQuote")).put("roundingStatus","EXACT_MINOR_UNITS");
 if(!"2.00".equals(new CheckoutProjectionTest().buyerCheckoutView(new Form(),saved).get("totalPayable")))throw new AssertionError();
 System.out.println("actual projection accepted");}}
 `;
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'plan-subscription-dto-'));
 try {await fs.writeFile(path.join(dir,'CheckoutProjectionTest.java'),java);execFileSync('javac',['-d',dir,path.join(dir,'CheckoutProjectionTest.java')],{stdio:'pipe'});execFileSync('java',['-cp',dir,'CheckoutProjectionTest'],{stdio:'pipe'});}finally{await fs.rm(dir,{recursive:true,force:true});}
});

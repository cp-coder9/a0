// Element-level capture of the rendered C7H truck canvas (proof it is really drawn).
import{createRequire}from'node:module';
import{mkdir,writeFile,readFile}from'node:fs/promises';
import{createHash}from'node:crypto';
const{chromium}=createRequire('E:/social-studio/apps/web/package.json')('playwright');
const base=process.argv[2]||'http://127.0.0.1:3100';
const stamp=new Date().toISOString().replaceAll(':','-').replaceAll('.','-');
const out=`E:/Sitrak-website/docs/showroom-evidence/ui/screenshots/GLB-RENDER-TRUCK-${stamp}`;
await mkdir(out,{recursive:true});
const sha=async f=>createHash('sha256').update(await readFile(f)).digest('hex');
const b=await chromium.launch({channel:'msedge',headless:true});
const result={base,out,shots:[],metrics:{},errors:[]};
try{
 const ctx=await b.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});const p=await ctx.newPage();p.setDefaultTimeout(240000);
 await ctx.route('**/*',r=>{const u=new URL(r.request().url());return['127.0.0.1','localhost'].includes(u.hostname)&&r.request().method()==='GET'?r.continue():r.abort()});
 p.on('pageerror',e=>result.errors.push(e.message));
 await p.goto(base+'/models/sitrak-c7h/',{waitUntil:'load'});
 await p.waitForTimeout(3000);
 await p.getByRole('button',{name:/Load 3D view/i}).click();
 const stage=p.locator('[data-testid="supplied-glb-stage"]');
 await stage.waitFor({state:'attached',timeout:45000});
 await p.waitForFunction(()=>{const el=document.querySelector('[data-testid="supplied-glb-stage"]');return el&&el.dataset.metrics},{timeout:240000});
 await stage.scrollIntoViewIfNeeded();
 await p.waitForTimeout(3000);
 result.metrics=JSON.parse(await stage.evaluate(el=>el.dataset.metrics));
 result.metrics.maxTextureSize=await stage.evaluate(el=>el.dataset.maxTextureSize);
 result.metrics.canvasBox=await stage.boundingBox();
 const el=`${out}/c7h-truck-canvas.png`;await stage.screenshot({path:el,animations:'disabled'});
 const full=`${out}/c7h-truck-route-desktop.png`;await p.screenshot({path:full,animations:'disabled'});
 result.shots.push({file:el,sha256:await sha(el)},{file:full,sha256:await sha(full)});
 await ctx.close();
}catch(e){result.errors.push(e.message)}
finally{await b.close()}
await writeFile(out+'/result.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({out,shots:result.shots,metrics:result.metrics,errors:result.errors},null,2));
if(result.errors.length)process.exitCode=1;

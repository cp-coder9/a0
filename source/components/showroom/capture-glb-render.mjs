// Real GLB render capture. Uses an already-running local dev server; starts nothing,
// kills nothing, installs nothing. Blocks non-loopback requests.
import{createRequire}from'node:module';
import{mkdir,writeFile,readFile}from'node:fs/promises';
import{createHash}from'node:crypto';
const{chromium}=createRequire('E:/social-studio/apps/web/package.json')('playwright');
const base=process.argv[2]||'http://127.0.0.1:3100';
const stamp=new Date().toISOString().replaceAll(':','-').replaceAll('.','-');
const out=`E:/Sitrak-website/docs/showroom-evidence/ui/screenshots/GLB-RENDER-${stamp}`;
await mkdir(out,{recursive:true});
const result={scope:'Real local render of the copied supplied GLB on the C7H route. Server pre-existing; nothing started/stopped/built.',base,shots:[],metrics:{},errors:[]};
const sha=async f=>createHash('sha256').update(await readFile(f)).digest('hex');
const browser=await chromium.launch({channel:'msedge',headless:true});
async function page(viewport){
 const ctx=await browser.newContext({viewport});const p=await ctx.newPage();p.setDefaultTimeout(180000);
 await ctx.route('**/*',r=>{const u=new URL(r.request().url());return ['127.0.0.1','localhost'].includes(u.hostname)&&r.request().method()==='GET'?r.continue():r.abort()});
 p.on('pageerror',e=>result.errors.push({where:p.url(),message:e.message}));
 p.on('console',m=>{if(m.type()==='error')result.errors.push({where:p.url(),console:m.text().slice(0,300)})});
 return{ctx,p};
}
try{
 // ---- Truck model on the C7H exterior tab
 {
  const{ctx,p}=await page({width:1440,height:1000});
  const t0=Date.now();
  await p.goto(base+'/models/sitrak-c7h/',{waitUntil:'load'});
  await p.waitForTimeout(3000); // allow hydration before the toggle is honoured
  await p.getByRole('button',{name:/Load 3D view/i}).click();
  const stage=p.locator('[data-testid="supplied-glb-stage"]');
  try{await stage.waitFor({state:'attached',timeout:45000})}
  catch{await p.getByRole('button',{name:/Load 3D view/i}).click().catch(()=>{});await stage.waitFor({state:'attached',timeout:45000})}
  await p.waitForFunction(()=>{const el=document.querySelector('[data-testid="supplied-glb-stage"]');return el&&el.dataset.loaded==='true'},{timeout:180000});
  await p.waitForFunction(()=>{const el=document.querySelector('[data-testid="supplied-glb-stage"]');return el&&el.dataset.metrics},{timeout:180000});
  await p.waitForTimeout(2500);
  const m=JSON.parse(await stage.evaluate(el=>el.dataset.metrics));
  const maxTex=await stage.evaluate(el=>el.dataset.maxTextureSize);
  result.metrics.truck={...m,wallMs:Date.now()-t0,maxTextureSize:maxTex,canvas:await stage.evaluate(el=>{const c=el.querySelector('canvas');return c?{w:c.width,h:c.height}:null})};
  const shot=`${out}/c7h-truck-3d-desktop.png`;await p.screenshot({path:shot,animations:'disabled'});
  result.shots.push({file:shot,sha256:await sha(shot)});
  // prove it is a live 3D canvas, not a static image
  result.metrics.truck.pixelsNonBlank=await stage.evaluate(el=>{const c=el.querySelector('canvas');if(!c)return 0;const g=document.createElement('canvas');g.width=64;g.height=64;const ctx2=g.getContext('2d');ctx2.drawImage(c,0,0,64,64);const d=ctx2.getImageData(0,0,64,64).data;let n=0;for(let i=0;i<d.length;i+=4)if(d[i]+d[i+1]+d[i+2]>24)n++;return n});
  await ctx.close();
 }
 // ---- Engine model on the specifications tab, mobile
 {
  const{ctx,p}=await page({width:390,height:844});
  await p.goto(base+'/models/sitrak-c7h/#specifications',{waitUntil:'domcontentloaded'});
  const stage=p.locator('.showroom-engine [data-testid="supplied-glb-stage"]');
  await stage.waitFor({state:'attached',timeout:60000});
  await p.waitForFunction(()=>{const el=document.querySelector('.showroom-engine [data-testid="supplied-glb-stage"]');return el&&el.dataset.metrics},{timeout:180000});
  await p.waitForTimeout(2000);
  result.metrics.engine=JSON.parse(await stage.evaluate(el=>el.dataset.metrics));
  await stage.scrollIntoViewIfNeeded();
  const shot=`${out}/c7h-engine-3d-mobile.png`;await p.screenshot({path:shot,animations:'disabled'});
  result.shots.push({file:shot,sha256:await sha(shot)});
  await ctx.close();
 }
}catch(e){result.errors.push({fatal:e.message})}
finally{await browser.close()}
await writeFile(out+'/result.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({out,shots:result.shots.length,metrics:result.metrics,errorCount:result.errors.length,errors:result.errors.slice(0,4)},null,2));
if(result.errors.length)process.exitCode=1;

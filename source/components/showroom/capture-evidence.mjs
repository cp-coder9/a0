
import{createRequire}from'node:module';
import{mkdir,writeFile,readFile}from'node:fs/promises';
import{createHash}from'node:crypto';
import{execSync}from'node:child_process';
const{chromium}=createRequire('E:/social-studio/apps/web/package.json')('playwright');
const base=process.argv[2]||'http://127.0.0.1:3100';
const stamp=new Date().toISOString().replaceAll(':','-').replaceAll('.','-');
const out=`E:/Sitrak-website/docs/showroom-evidence/ui/screenshots/EVIDENCE-${stamp}`;
await mkdir(out,{recursive:true});
const sha=p=>readFile(p).then(b=>createHash('sha256').update(b).digest('hex'));
const SOURCE=['app/page.tsx','app/layout.tsx','app/models/sitrak-c7h/page.tsx','components/Primitives.tsx','components/Header.tsx','components/TruckIllustration.tsx','components/showroom/C7HShowroom.tsx','components/showroom/supplied-models.ts','components/showroom/SuppliedGlbViewer.tsx','components/showroom/glb-loader.ts','components/showroom/ktx2-target.mjs'];
const sourceIdentity={};
for(const f of SOURCE)try{sourceIdentity[f]=await sha('E:/Sitrak-website/'+f)}catch(e){sourceIdentity[f]='MISSING'}
let listener='unknown';
try{listener=execSync('netstat -ano | grep ":3100" | grep LISTENING | head -1').toString().trim()}catch(e){listener='netstat unavailable'}
const manifest={capturedAt:stamp,base,listener,viewports:[],pages:[],checks:[],errors:[]};
const b=await chromium.launch({channel:'msedge',headless:true});
async function shoot(ctx,tag,route,setup){
 const p=await ctx.newPage();
 try{
  await p.goto(base+route,{waitUntil:'domcontentloaded',timeout:90000});
  const intro=p.locator('.intro-screen');
  try{await intro.waitFor({state:'visible',timeout:8000});await p.getByRole('button',{name:/Skip intro/i}).click()}catch{}
  await intro.waitFor({state:'hidden',timeout:15000}).catch(()=>{});
  await p.waitForTimeout(1200);
  if(setup)await setup(p);
  await p.waitForTimeout(600);
  const file=`${out}/${tag}.png`;
  await p.screenshot({path:file,fullPage:true,animations:'disabled'});
  const info=await p.evaluate(()=>({title:document.title,h1:document.querySelector('h1')?.innerText||null,height:document.documentElement.scrollHeight,footer:document.querySelectorAll('footer').length,proof:document.querySelectorAll('#the-proof').length}));
  manifest.pages.push({tag,route,file,sha256:await sha(file),...info});
  await p.close();return true;
 }catch(e){manifest.errors.push({tag,route,error:e.message.slice(0,180)});await p.close().catch(()=>{});return false}
}
for(const vp of [{name:'desktop',width:1440,height:1000},{name:'mobile',width:390,height:844}]){
 const ctx=await b.newContext({viewport:{width:vp.width,height:vp.height}});
 manifest.viewports.push(vp);
 await shoot(ctx,`home-${vp.name}`,'/',async p=>{await p.evaluate(()=>window.scrollTo(0,0))});
 await shoot(ctx,`c7h-exterior-${vp.name}`,'/models/sitrak-c7h/#exterior',async p=>{
  const btn=p.getByRole('button',{name:/Load 3D view/i});
  if(await btn.count()){await btn.click();await p.waitForTimeout(2500)}
 });
 await shoot(ctx,`c7h-cabin-${vp.name}`,'/models/sitrak-c7h/#cabin',async p=>{await p.waitForTimeout(2500)});
 await shoot(ctx,`c7h-specifications-${vp.name}`,'/models/sitrak-c7h/#specifications',async p=>{await p.waitForTimeout(1500)});
 await ctx.close();
}
// assertions on the desktop home + c7h pages
try{
 const ctx=await b.newContext({viewport:{width:1440,height:1000}});const p=await ctx.newPage();
 await p.goto(base+'/models/sitrak-c7h/#specifications',{waitUntil:'domcontentloaded',timeout:90000});
 await p.waitForTimeout(2500);
 manifest.checks.push({name:'exactly one footer on C7H',value:await p.locator('footer').count()});
 manifest.checks.push({name:'one #the-proof anchor on C7H',value:await p.locator('#the-proof').count()});
 const engine=(await p.locator('.showroom-engine').innerText()).replace(/\n+/g,' | ');
 manifest.checks.push({name:'engine honest state',value:engine.slice(0,240)});
 await p.goto(base+'/',{waitUntil:'domcontentloaded',timeout:90000});await p.waitForTimeout(2000);
 manifest.checks.push({name:'home hero heading',value:await p.locator('h1').first().innerText()});
 manifest.checks.push({name:'home range cards',value:await p.locator('[class*=range] article, [class*=range] a[href*=models]').count()});
 manifest.checks.push({name:'home footer count',value:await p.locator('footer').count()});
 await ctx.close();
}catch(e){manifest.errors.push({checks:e.message.slice(0,160)})}
await b.close();
await writeFile(out+'/manifest.json',JSON.stringify({...manifest,sourceIdentity},null,2));
console.log(JSON.stringify({out,pages:manifest.pages.map(p=>p.tag),errors:manifest.errors,checks:manifest.checks},null,2));

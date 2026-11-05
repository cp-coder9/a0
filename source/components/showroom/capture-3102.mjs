import{createRequire}from'node:module';
import{mkdir,writeFile,readFile}from'node:fs/promises';
import{createHash}from'node:crypto';
const{chromium}=createRequire('E:/social-studio/apps/web/package.json')('playwright');
const base=process.env.GATE_BASE||'http://127.0.0.1:3100';
const stamp=new Date().toISOString().replaceAll(':','-').replaceAll('.','-');
const out=`E:/Sitrak-website/docs/showroom-evidence/ui/screenshots/VISUAL-GATE-${stamp}`;
await mkdir(out,{recursive:true});
const sha=async f=>createHash('sha256').update(await readFile(f)).digest('hex');
const b=await chromium.launch({channel:'msedge',headless:true});
const r={base,out,checks:[],shots:[],errors:[]};
const check=(n,pass,actual)=>r.checks.push({name:n,pass,actual});
async function page(vp){
 const ctx=await b.newContext({viewport:vp});const p=await ctx.newPage();p.setDefaultTimeout(240000);
 return{ctx,p};
}
async function ready(p,route){
 for(let attempt=0;attempt<4;attempt++){
  try{await p.goto(base+route,{waitUntil:'domcontentloaded',timeout:200000});break}
  catch(e){if(attempt===3)throw e;await p.waitForTimeout(5000)}
 }
 const intro=p.locator('.intro-screen');
 try{await intro.waitFor({state:'visible',timeout:6000});await p.getByRole('button',{name:/Skip intro/i}).click()}catch{}
 await intro.waitFor({state:'hidden',timeout:15000}).catch(()=>{});
 await p.waitForTimeout(1200);
}
try{
 // ---------- desktop home ----------
 {
  const{ctx,p}=await page({width:1440,height:1000});
  await ready(p,'/');
  await p.evaluate(()=>{const c=document.querySelector('#the-range');c?.scrollIntoView();});
  await p.waitForTimeout(900);
  const altTexts=await p.evaluate(()=>[...document.querySelectorAll('#the-range img')].map(i=>i.getAttribute('alt')));
  check('range card alts are neutral model names',altTexts.length>0&&altTexts.every(a=>a&&!/supplied|photo/i.test(a)),altTexts);
  const brochure=await p.evaluate(()=>[...document.querySelectorAll('a')].filter(a=>/brochure/i.test(a.textContent||'')||/Brochure\.pdf/i.test(a.getAttribute('href')||'')).length);
  check('no brochure download link on home',brochure===0,brochure);
  const band=await p.locator('#the-range').boundingBox();
  const f1=`${out}/home-range-desktop.png`;await p.screenshot({path:f1,animations:'disabled',clip:{x:0,y:Math.max(0,band.y-40),width:1440,height:Math.min(1400,band.height+80)}});
  r.shots.push({file:f1,sha256:await sha(f1)});
  const f2=`${out}/home-full-desktop.png`;await p.screenshot({path:f2,fullPage:true,animations:'disabled'});
  r.shots.push({file:f2,sha256:await sha(f2)});
  await ctx.close();
 }
 // ---------- mobile home ----------
 {
  const{ctx,p}=await page({width:390,height:844});
  await ready(p,'/');
  const f=`${out}/home-full-mobile.png`;await p.screenshot({path:f,fullPage:true,animations:'disabled'});
  r.shots.push({file:f,sha256:await sha(f)});
  const overflow=await p.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
  check('no horizontal overflow on mobile home',!overflow,overflow);
  await ctx.close();
 }
 // ---------- C7H desktop: exterior / cabin / specs ----------
 {
  const{ctx,p}=await page({width:1440,height:1000});
  await ready(p,'/models/sitrak-c7h/#exterior');
  const btn=p.getByRole('button',{name:/Load 3D view/i});
  if(await btn.count()){await btn.click();await p.waitForTimeout(2500)}
  const notice=await p.locator('.illustration-with-notice').innerText().catch(()=>'');
  check('C7H 3D notice names SITRAK C7H and says not available yet',/SITRAK C7H/.test(notice)&&/not available yet/i.test(notice),notice.slice(0,180).replace(/\n+/g,' | '));
  const f1=`${out}/c7h-exterior-desktop.png`;await p.screenshot({path:f1,fullPage:true,animations:'disabled'});
  r.shots.push({file:f1,sha256:await sha(f1)});
  await p.getByRole('link',{name:/^Cabin$/}).click().catch(async()=>{await p.goto(base+'/models/sitrak-c7h/#cabin',{waitUntil:'domcontentloaded',timeout:200000})});
  await p.waitForTimeout(2200);
  const f2=`${out}/c7h-cabin-desktop.png`;await p.screenshot({path:f2,fullPage:true,animations:'disabled'});
  r.shots.push({file:f2,sha256:await sha(f2)});
  await p.goto(base+'/models/sitrak-c7h/#specifications',{waitUntil:'domcontentloaded',timeout:200000});
  await p.waitForTimeout(2200);
  const engine=(await p.locator('.showroom-engine').innerText()).replace(/\n+/g,' | ');
  check('engine section honest state with measured preflight',/not available yet/i.test(engine)&&/682\.7/.test(engine),engine.slice(0,200));
  check('one footer',await p.locator('footer').count()===1,await p.locator('footer').count());
  check('one #the-proof',await p.locator('#the-proof').count()===1,await p.locator('#the-proof').count());
  const f3=`${out}/c7h-specifications-desktop.png`;await p.screenshot({path:f3,fullPage:true,animations:'disabled'});
  r.shots.push({file:f3,sha256:await sha(f3)});
  await ctx.close();
 }
 // ---------- C7H mobile exterior ----------
 {
  const{ctx,p}=await page({width:390,height:844});
  await ready(p,'/models/sitrak-c7h/#exterior');
  const f=`${out}/c7h-exterior-mobile.png`;await p.screenshot({path:f,fullPage:true,animations:'disabled'});
  r.shots.push({file:f,sha256:await sha(f)});
  check('no horizontal overflow on mobile C7H',!(await p.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1)),null);
  await ctx.close();
 }
}catch(e){r.errors.push({fatal:e.message.slice(0,300)})}
await b.close();
await writeFile(out+'/result.json',JSON.stringify(r,null,2));
console.log(JSON.stringify({out,passed:r.checks.filter(c=>c.pass).length,failed:r.checks.filter(c=>!c.pass),shots:r.shots.length,errors:r.errors},null,2));

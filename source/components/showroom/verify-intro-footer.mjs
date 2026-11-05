// Real current-source UI capture against the already-running local dev server.
// Uses an existing local server (does not start/build/kill anything), blocks all
// non-loopback and non-GET requests, and never submits the enquiry form.
import{createRequire}from'node:module';
import{mkdir,writeFile,readFile}from'node:fs/promises';
import{createHash}from'node:crypto';
const{chromium}=createRequire('E:/social-studio/apps/web/package.json')('playwright');
const base=process.argv[2]||'http://127.0.0.1:3102';
const stamp=new Date().toISOString().replaceAll(':','-').replaceAll('.','-');
const out=`E:/Sitrak-website/docs/showroom-evidence/ui/screenshots/INTRO-FOOTER-${stamp}`;
await mkdir(out,{recursive:true});
const checks=[],images=[],errors=[];
const files=['app/layout.tsx','app/page.tsx','app/models/sitrak-c7h/page.tsx','components/Primitives.tsx','components/intro/IntroSplash.tsx'];
const hash=b=>createHash('sha256').update(b).digest('hex');
async function identity(){const o={};for(const f of files)o[f]=hash(await readFile('E:/Sitrak-website/'+f));return o}
const before=await identity();
const browser=await chromium.launch({channel:'msedge',headless:true});
function check(name,pass,actual){checks.push({name,pass,actual})}
try{
 for(const[device,width,height]of[['desktop',1440,1000],['mobile',390,844]]){
  const ctx=await browser.newContext({viewport:{width,height}}),page=await ctx.newPage();page.setDefaultTimeout(25000);
  await ctx.route('**/*',r=>{const u=new URL(r.request().url());return ['127.0.0.1','localhost'].includes(u.hostname)&&r.request().method()==='GET'?r.continue():r.abort()});
  page.on('pageerror',e=>errors.push({device,message:e.message}));
  try{
   await page.goto(base+'/',{waitUntil:'domcontentloaded'});
   // Intro: automatic first open within the session.
   const intro=page.locator('.intro-screen');
   let introShown=false;
   try{await intro.waitFor({state:'visible',timeout:12000});introShown=true}catch{}
   check(device+' intro opens automatically',introShown,introShown);
   if(introShown){
    const shot=`${out}/intro-${device}.png`;await page.screenshot({path:shot,animations:'disabled'});images.push(shot);
    await page.keyboard.press('Escape');
    await intro.waitFor({state:'hidden',timeout:15000}).catch(()=>{});
    check(device+' Escape skips intro',await intro.isHidden(),await intro.isHidden());
   }
   // Single footer + dealership on home.
   check(device+' home has one footer',await page.locator('footer').count()===1,await page.locator('footer').count());
   check(device+' home has one dealership section',await page.locator('#the-proof').count()===1,await page.locator('#the-proof').count());
   await page.locator('#the-proof').scrollIntoViewIfNeeded();
   const shot=`${out}/home-footer-${device}.png`;await page.screenshot({path:shot,fullPage:false,animations:'disabled'});images.push(shot);
   // Intro must not reopen on in-page navigation.
   await page.locator('footer a[href="#the-range"]').first().click().catch(()=>{});
   await page.waitForTimeout(1200);
   check(device+' intro does not reopen after in-page nav',await page.locator('.intro-screen').count()===0,await page.locator('.intro-screen').count());
   // C7H route: one footer, no abbreviated route footer.
   await page.goto(base+'/models/sitrak-c7h/',{waitUntil:'domcontentloaded'});
   check(device+' C7H one footer',await page.locator('footer').count()===1,await page.locator('footer').count());
   check(device+' C7H one dealership section',await page.locator('#the-proof').count()===1,await page.locator('#the-proof').count());
   check(device+' C7H old route footer removed',await page.locator('.showroom-route-footer').count()===0,await page.locator('.showroom-route-footer').count());
   check(device+' C7H intro does not reopen same session',await page.locator('.intro-screen').count()===0,await page.locator('.intro-screen').count());
   await page.locator('#the-proof').scrollIntoViewIfNeeded();
   const shot2=`${out}/c7h-footer-${device}.png`;await page.screenshot({path:shot2,animations:'disabled'});images.push(shot2);
   check(device+' no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),await page.evaluate(()=>({w:innerWidth,d:document.documentElement.scrollWidth})));
  }catch(e){errors.push({device,message:e.message})}finally{await ctx.close()}
 }
 // Reduced motion: intro must not obstruct and must be skippable, still one footer.
 const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),page=await ctx.newPage();
 await ctx.route('**/*',r=>{const u=new URL(r.request().url());return ['127.0.0.1','localhost'].includes(u.hostname)&&r.request().method()==='GET'?r.continue():r.abort()});
 await page.goto(base+'/',{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(2500);
 check('reduced-motion page usable with single footer',await page.locator('footer').count()===1,await page.locator('footer').count());
 const shot=`${out}/reduced-motion-home.png`;await page.screenshot({path:shot,animations:'disabled'});images.push(shot);
 await ctx.close();
}finally{await browser.close()}
const after=await identity();
check('monitored source unchanged during capture',JSON.stringify(before)===JSON.stringify(after),{before,after});
await writeFile(out+'/result.json',JSON.stringify({scope:'Real local Next dev render of current source at '+base+' (server not started/stopped by this script); loopback GET only; no enquiry submission or external contact. Intro persists per browser session.',base,browser:browser.version(),views:[[1440,1000],[390,844]],checks,images,errors},null,2));
console.log(JSON.stringify({out,passed:checks.filter(c=>c.pass).length,failed:checks.filter(c=>!c.pass).map(c=>c.name),images:images.length,errors},null,2));
if(checks.some(c=>!c.pass)||errors.length)process.exitCode=1;

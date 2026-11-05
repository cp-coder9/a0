// Actual top-of-page evidence for the homepage hero regression; no mail/external actions.
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=createRequire('E:/social-studio/apps/web/package.json')('playwright');
const phase=process.env.HERO_PHASE==='before'?'before':'after',expected=phase==='after';
const stamp=new Date().toISOString().replaceAll(':','-').replaceAll('.','-');
const out=`E:/Sitrak-website/docs/showroom-evidence/ui/screenshots/HERO-${phase.toUpperCase()}-${stamp}`;
await mkdir(out,{recursive:true});const shots=[],checks=[],errors=[];
const hash=b=>createHash('sha256').update(b).digest('hex');
const paths=['app/page.tsx','components/Hero.tsx','lib/hero-trucks.ts','components/showroom/ShowroomDiscovery.tsx','components/showroom/showroom.css','components/showroom/HomeDiscovery.test.tsx','components/showroom/verify-hero-restoration.mjs'];
async function identity(){const files={};for(const p of paths)files[p]=hash(await readFile(`E:/Sitrak-website/${p}`));return files;}
const before=await identity();
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 for(const [device,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
  const ctx=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await ctx.newPage();page.setDefaultTimeout(10000);
  await ctx.route('**/*',r=>{const u=new URL(r.request().url());return ['127.0.0.1','localhost'].includes(u.hostname)&&r.request().method()==='GET'?r.continue():r.abort();});
  page.on('pageerror',e=>errors.push({device,message:e.message}));
  try{
   await page.goto('http://127.0.0.1:3100/',{waitUntil:'networkidle',timeout:25000});await page.evaluate(()=>document.fonts.ready);
   await page.evaluate(()=>{history.scrollRestoration='manual';scrollTo(0,0);});
   const state=await page.evaluate(()=>{const hero=document.querySelector('#top.hero'),r=hero?.getBoundingClientRect(),style=hero&&getComputedStyle(hero),image=hero?.querySelector('.hero-image.is-active');return {url:location.href,scrollY,firstMainChild:document.querySelector('main')?.firstElementChild?.id,hero:hero?{rect:{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom},display:style.display,visibility:style.visibility,opacity:style.opacity,image:image?.getAttribute('src'),imageLoaded:!!image&&image.complete&&image.naturalWidth>0}:null,viewport:{width:innerWidth,height:innerHeight},documentWidth:document.documentElement.scrollWidth,h1:[...document.querySelectorAll('h1')].map(e=>e.textContent),rangeCount:document.querySelectorAll('#the-range').length};});
   checks.push({name:`${device} top evidence`,pass:expected?state.firstMainChild==='top'&&state.scrollY===0&&state.hero?.imageLoaded&&state.hero.rect.y<height&&state.hero.rect.bottom>0&&state.hero.display!=='none'&&state.hero.visibility==='visible':!state.hero,state});
   const file=`${out}/homepage-top-${device}.png`;await page.screenshot({path:file,fullPage:false,animations:'disabled'});shots.push({file,utc:new Date().toISOString(),viewport:{width,height},scrollY:0,url:page.url(),sha256:hash(await readFile(file)),fullPage:false,notes:'Uncropped viewport at verified scrollY0, reduced motion; no reconstructed before image.'});
   if(expected){
    await page.getByRole('button',{name:'Next truck',exact:true}).click();
    checks.push({name:`${device} hero manual model navigation`,pass:(await page.getByRole('button',{name:'Show HOWO 7',exact:true}).getAttribute('aria-pressed'))==='true',actual:await page.locator('.hero-model').innerText()});
    await page.getByRole('button',{name:/Book a test drive/}).click();await page.getByRole('dialog').waitFor();
    checks.push({name:`${device} hero model-prefilled enquiry`,pass:await page.locator('select[name=model]').inputValue()==='HOWO 7',actual:await page.locator('select[name=model]').inputValue()});
    await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
    await page.locator('.hero-actions a[href="#the-range"]').click();
    await page.getByRole('link',{name:'Explore SITRAK C7H',exact:true}).click();
    await page.getByRole('heading',{name:'SITRAK C7H',exact:true}).waitFor();
    checks.push({name:`${device} retained range route`,pass:new URL(page.url()).pathname==='/models/sitrak-c7h',actual:page.url()});
   }
  }catch(e){checks.push({name:`${device} journey`,pass:false,actual:e.message});}
  finally{await ctx.close();}
 }
}finally{
 await browser.close();const after=await identity();const stable=JSON.stringify(before)===JSON.stringify(after);
 const result={phase,purpose:expected?'hero restoration developer verification':'pre-fix regression evidence; NOT acceptance',browser:browser.version(),sourceBefore:before,sourceAfter:after,sourceStable:stable,checks,shots,errors,network:'GET loopback only; all submissions and external contacts denied'};
 await writeFile(`${out}/result.json`,JSON.stringify(result,null,2));
 console.log(JSON.stringify({out,phase,passed:checks.filter(c=>c.pass).length,failed:checks.filter(c=>!c.pass),images:shots.length,sourceStable:stable,errors},null,2));if(checks.some(c=>!c.pass)||!stable||errors.length)process.exitCode=1;
}

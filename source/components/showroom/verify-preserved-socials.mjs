// Local SITRAK regression evidence only. Never contacts WhatsApp or submits enquiries.
import {createRequire} from 'node:module';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=createRequire('E:/social-studio/apps/web/package.json')('playwright'); // Existing tool dependency, no Social app execution.
const stamp=new Date().toISOString().replaceAll(':','-').replaceAll('.','-');
const out=`E:/Sitrak-website/docs/showroom-evidence/ui/screenshots/RESTORED-SOCIALS-${stamp}`;
await mkdir(out,{recursive:true});const checks=[],images=[],errors=[];
const browser=await chromium.launch({channel:'msedge',headless:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const prior=JSON.parse(await readFile('E:/Sitrak-website/docs/showroom-evidence/ui/SSIT-C7H-01-resumed-source-manifest.json','utf8')).files;
const sourcePaths=[...new Set([...Object.keys(prior),'components/showroom/FloatingSocialLinks.tsx','components/showroom/FloatingSocialLinks.test.tsx','components/showroom/floating-socials.css','components/showroom/verify-preserved-socials.mjs'])].sort();
async function sourceIdentity(){const files={};for(const p of sourcePaths)files[p]=hash(await readFile(`E:/Sitrak-website/${p}`));return {sha256:hash(JSON.stringify(files)),files};}
const sourceBefore=await sourceIdentity();
function check(name,pass,actual){checks.push({name,pass,actual});}
async function save(){await writeFile(`${out}/result.json`,JSON.stringify({out,sourceBefore,sourceAfter:await sourceIdentity(),browser:browser.version(),checks,images,errors,notes:'Real local pages; external and non-GET requests blocked. No live enquiry or external social click. Developer evidence, not independent QA.'},null,2));}
try{
 for(const [device,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
  const ctx=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await ctx.newPage();page.setDefaultTimeout(10000);
  page.on('pageerror',e=>errors.push({device,message:e.message}));
  await ctx.route('**/*',r=>{const u=new URL(r.request().url());return ['127.0.0.1','localhost'].includes(u.hostname)&&r.request().method()==='GET'?r.continue():r.abort();});
  async function shot(name){const file=`${out}/${name}-${device}.png`;await page.screenshot({path:file,fullPage:true,animations:'disabled',timeout:12000});images.push({file,url:page.url(),viewport:{width,height},utc:new Date().toISOString(),sha256:hash(await readFile(file))});await save();}
  try{
   await page.goto('http://127.0.0.1:3100/',{waitUntil:'domcontentloaded',timeout:20000});
   const rail=page.getByRole('navigation',{name:'Social media',exact:true});await rail.waitFor();
   check(`${device} homepage rail`,await rail.getByRole('link').count()===3,await rail.innerText());
   const wa=rail.getByRole('link',{name:'Chat on WhatsApp at +27609412357'});
   check(`${device} WhatsApp target`,await wa.getAttribute('href')==='https://wa.me/27609412357',await wa.getAttribute('href'));
   const before=page.url(),scroll=await page.evaluate(()=>scrollY);
   await rail.getByRole('link',{name:'Facebook — page link pending'}).focus();
   await page.keyboard.press('Enter'); // Native keyboard activation; click() correctly refuses aria-disabled links.
   check(`${device} pending link does not navigate`,page.url()===before&&(await page.evaluate(()=>scrollY))===scroll,{url:page.url(),scroll:await page.evaluate(()=>scrollY)});
   await shot('homepage-rail');
   await page.getByRole('button',{name:'View HOWO 7 details',exact:true}).click();
   await page.getByRole('dialog').waitFor();
   check(`${device} other-model details preserved`,(await page.getByRole('dialog').innerText()).includes('HOWO 7'),(await page.getByRole('dialog').innerText()).slice(0,160));
   await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
   await page.getByRole('link',{name:'Explore SITRAK C7H',exact:true}).click();
   await page.getByRole('heading',{name:'SITRAK C7H',exact:true}).waitFor();
   await page.getByRole('navigation',{name:'Social media',exact:true}).waitFor();
   check(`${device} no overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),await page.evaluate(()=>({width:innerWidth,document:document.documentElement.scrollWidth})));
   await shot('c7h-rail');
   await page.getByRole('link',{name:'Cabin',exact:true}).click();await page.getByRole('region',{name:'cabin view'}).waitFor();
   check(`${device} cabin loaded poster`,await page.locator('.showroom-poster img').evaluate(e=>e.complete&&e.naturalWidth>0),await page.locator('.showroom-poster img').getAttribute('src'));
   await page.getByRole('button',{name:'Enquire about this C7H',exact:true}).click();await page.getByRole('dialog').waitFor();
   check(`${device} enquiry model`,await page.locator('select[name=model]').inputValue()==='SITRAK C7H',await page.locator('select[name=model]').inputValue());
   await shot('c7h-enquiry-rail');await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
   check(`${device} Escape restores enquiry focus`,await page.getByRole('button',{name:'Enquire about this C7H',exact:true}).evaluate(e=>e===document.activeElement),{});
   await page.getByRole('link',{name:'Specifications',exact:true}).click();await page.getByRole('heading',{name:'Specification reference'}).waitFor();
   await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('heading',{name:'Specification reference'}).waitFor();
   check(`${device} specification reload hash`,new URL(page.url()).hash==='#specifications',page.url());
   await page.getByRole('link',{name:'Exterior',exact:true}).click();
   await page.getByRole('button',{name:'Load illustrative 3D',exact:true}).click();
   await page.waitForFunction(()=>{const g=document.querySelector('[data-testid="truck-3d-stage"]')?.getAttribute('data-geometry');return g&&JSON.parse(g).frames>10||[...document.querySelectorAll('[role=status]')].some(e=>/graphics.*unavailable|graphics could not|could not load/.test(e.textContent||''));},{},{timeout:25000});
   const geometry=await page.locator('[data-testid="truck-3d-stage"]').getAttribute('data-geometry').catch(()=>null);
   check(`${device} actual optional renderer`,Boolean(geometry),geometry?JSON.parse(geometry):await page.locator('[role=status]').allTextContents());
   await shot('c7h-optional-rail');
  }catch(e){check(`${device} journey completed`,false,e.message);await save();}
  finally{await ctx.close();}
 }
 // Pending links must be inert before hydration as well as after it.
 const noJS=await browser.newContext({javaScriptEnabled:false}),staticPage=await noJS.newPage();
 await noJS.route('**/*',r=>{const u=new URL(r.request().url());return ['127.0.0.1','localhost'].includes(u.hostname)&&r.request().method()==='GET'?r.continue():r.abort();});
 await staticPage.goto('http://127.0.0.1:3100/',{waitUntil:'domcontentloaded',timeout:20000});
 const staticUrl=staticPage.url();await staticPage.getByRole('link',{name:'Facebook — page link pending'}).focus();await staticPage.keyboard.press('Enter');
 check('pending profile cannot navigate without JavaScript',staticPage.url()===staticUrl,{before:staticUrl,after:staticPage.url()});await noJS.close();
 // Explicit browser-only graphics denial, not a backend fixture.
 const ctx=await browser.newContext();await ctx.addInitScript(()=>{Object.defineProperty(navigator,'gpu',{value:undefined,configurable:true});HTMLCanvasElement.prototype.getContext=()=>null;});
 const page=await ctx.newPage();await ctx.route('**/*',r=>{const u=new URL(r.request().url());return ['127.0.0.1','localhost'].includes(u.hostname)&&r.request().method()==='GET'?r.continue():r.abort();});
 await page.goto('http://127.0.0.1:3100/models/sitrak-c7h',{waitUntil:'domcontentloaded',timeout:20000});
 await page.getByRole('button',{name:'Load illustrative 3D',exact:true}).click();await page.getByRole('status').filter({hasText:'3D graphics are unavailable'}).waitFor();
 check('injected noGPU retains image and social rail',await page.getByRole('navigation',{name:'Social media'}).isVisible()&&await page.locator('.showroom-poster img').isVisible(),{});await ctx.close();
}finally{await save();await browser.close();console.log(JSON.stringify({out,passed:checks.filter(c=>c.pass).length,failed:checks.filter(c=>!c.pass),images:images.length,errors},null,2));if(checks.some(c=>!c.pass)||errors.length)process.exitCode=1;}

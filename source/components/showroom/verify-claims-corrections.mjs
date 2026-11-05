// Parent verification of owned claims/attribution changes. No live submission or external requests.
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=createRequire('E:/social-studio/apps/web/package.json')('playwright');
const out=`E:/Sitrak-website/docs/showroom-evidence/ui/screenshots/CLAIMS-CORRECTIONS-${new Date().toISOString().replaceAll(':','-').replaceAll('.','-')}`;
await mkdir(out,{recursive:true});const checks=[],shots=[],errors=[],openClaims=[];
const sha=b=>createHash('sha256').update(b).digest('hex');
const paths=['app/page.tsx','components/showroom/C7HShowroom.tsx','components/showroom/ShowroomDiscovery.tsx','components/showroom/showroom.css','components/showroom/HomeClaims.test.tsx','components/showroom/C7HAttribution.test.tsx'];
async function source(){const files={};for(const p of paths)files[p]=sha(await readFile(`E:/Sitrak-website/${p}`));return files;}
const before=await source(),browser=await chromium.launch({channel:'msedge',headless:true});
function check(name,pass,actual){checks.push({name,pass,actual});}
try{
 for(const [device,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
  const ctx=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await ctx.newPage();page.setDefaultTimeout(12000);
  await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(!['127.0.0.1','localhost'].includes(u.hostname)||r.request().method()!=='GET')return r.abort();if(u.pathname==='/assets/panoramas/sitrak-c7h-interior-panorama.jpg')return r.abort();return r.continue();});
  page.on('pageerror',e=>errors.push({device,message:e.message}));
  try{
   await page.goto('http://127.0.0.1:3100/',{waitUntil:'networkidle',timeout:25000});
   const eng=await page.locator('#the-engineering').textContent(),service=await page.locator('#backed-by-service').textContent();
   check(`${device} supplied/approval qualification`,eng.includes('Supplied C7H specification')&&eng.includes('Confirm the exact build, applicable approval documentation and intended application with the dealership.')&&!/homologated|specified for gravel/i.test(eng),eng);
   check(`${device} no unconditional commercial guarantee`,service.includes('Ask the dealership about current maintenance, registration and service-support arrangements.')&&!/start earning|before it costs|nationwide|year 1|first year|less downtime/i.test(service),service);
   check(`${device} hero/range retained`,await page.evaluate(()=>document.querySelector('main')?.firstElementChild?.id==='top'&&document.querySelectorAll('#the-range').length===1&&document.querySelector('#the-range')?.getAttribute('data-screen-label')==='02 The range'),{});
   // Read, do not hide, remaining unowned claim surfaces.
   openClaims.push({device,unresolvedPullingCapacity:/pulling capacity/i.test(await page.locator('#top').textContent()),metadata:await page.locator('meta[name=description]').getAttribute('content')});
   const homeFile=`${out}/homepage-claims-${device}.png`;await page.screenshot({path:homeFile,fullPage:true,animations:'disabled'});shots.push({file:homeFile,url:page.url(),viewport:{width,height},utc:new Date().toISOString(),sha256:sha(await readFile(homeFile)),fullPage:true});
   await page.goto('http://127.0.0.1:3100/models/sitrak-c7h#cabin',{waitUntil:'networkidle',timeout:25000});
   const qualification='Overseas LHD/manual C7-family archive photograph — not the offered RHD AMT cabin. Exact local trim is unverified.';
   const image=page.getByRole('img',{name:qualification,exact:true});await image.waitFor();await image.evaluate(e=>e.decode());
   const caption=await page.locator('.showroom-poster figcaption').textContent();
   check(`${device} network-failed primary has actual archive attribution`,caption===qualification&&await image.getAttribute('src')==='/assets/references/c7h-cockpit.webp',{caption,src:await image.getAttribute('src'),alt:await image.getAttribute('alt')});
   const file=`${out}/cabin-fallback-attribution-${device}.png`;await page.locator('.showroom-poster').screenshot({path:file,animations:'disabled'});shots.push({file,url:page.url(),viewport:{width,height},utc:new Date().toISOString(),sha256:sha(await readFile(file)),notes:'Actual figure with primary panorama network-blocked BEFORE hydration; local archive fallback loaded. No invented media.'});
   await page.getByRole('button',{name:'Enquire about this C7H',exact:true}).click();await page.getByRole('dialog').waitFor();
   check(`${device} fallback enquiry context preserved`,await page.locator('select[name=model]').inputValue()==='SITRAK C7H',{});await page.keyboard.press('Escape');
  }catch(e){check(`${device} verification complete`,false,e.message);}
  finally{await ctx.close();}
 }
}finally{
 await browser.close();const after=await source(),sourceStable=JSON.stringify(before)===JSON.stringify(after);
 await writeFile(`${out}/result.json`,JSON.stringify({out,browser:browser.version(),sourceBefore:before,sourceAfter:after,sourceStable,checks,shots,errors,openClaims,limits:'Owned claims only. Unowned hero/modal/metadata/shared-viewer claims remain. No review closure, full candidate approval, image rights or quality claim.'},null,2));
 console.log(JSON.stringify({out,passed:checks.filter(c=>c.pass).length,failed:checks.filter(c=>!c.pass),sourceStable,images:shots.length,errors},null,2));if(checks.some(c=>!c.pass)||!sourceStable||errors.length)process.exitCode=1;
}

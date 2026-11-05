// Parent cabin-main verification; local GET only, no contact/submission.
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=createRequire('E:/social-studio/apps/web/package.json')('playwright');
const root='E:/Sitrak-website',url='http://127.0.0.1:3100/models/sitrak-c7h/#cabin';
const out=`${root}/docs/showroom-evidence/ui/screenshots/CABIN-MAIN-${new Date().toISOString().replaceAll(':','-').replaceAll('.','-')}`;
await mkdir(out,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const paths=['components/showroom/C7HShowroom.tsx','components/showroom/C7HShowroom.test.tsx','components/showroom/C7HAttribution.test.tsx','components/showroom/showroom.css','components/CabinPanorama.tsx','components/TruckReferenceViewer.tsx','lib/cabin-panorama-renderer.ts','components/showroom/verify-cabin-main.mjs'];
for(const p of ['components/showroom/C7HCabinMain.tsx','components/showroom/C7HCabinMain.test.tsx'])try{await readFile(`${root}/${p}`);paths.push(p);}catch{}
async function source(){const files={};for(const p of paths)files[p]=sha(await readFile(`${root}/${p}`));return files;}
const sourceBefore=await source(),checks=[],shots=[],errors=[],blocked=[];
const browser=await chromium.launch({channel:'msedge',headless:true});
function check(name,pass,actual){checks.push({name,pass,actual});}
async function capture(page,name,notes){const file=`${out}/${name}.png`;await page.screenshot({path:file,fullPage:true,animations:'disabled'});shots.push({file,url:page.url(),viewport:page.viewportSize(),utc:new Date().toISOString(),sha256:sha(await readFile(file)),notes,fullPage:true});}
try{
 for(const [device,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
  for(const scenario of ['working','no-gpu','image-failure']){
   const ctx=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',hasTouch:device==='mobile'}),page=await ctx.newPage();page.setDefaultTimeout(15000);
   let failImage=scenario==='image-failure';
   await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(!['127.0.0.1','localhost'].includes(u.hostname)||r.request().method()!=='GET'){blocked.push({device,scenario,url:r.request().url(),method:r.request().method()});return r.abort();}if(failImage&&u.pathname==='/assets/panoramas/sitrak-c7h-interior-panorama.jpg')return r.abort();return r.continue();});
   if(scenario==='no-gpu')await ctx.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(['webgl','webgl2','experimental-webgl'].includes(type))return null;return get.call(this,type,...args);};});
   page.on('pageerror',e=>errors.push({device,scenario,message:e.message}));
   try{
    await page.goto(url,{waitUntil:'networkidle',timeout:35000});
    const main=page.getByRole('region',{name:'cabin view',exact:true}); // section accessible name
    // Named sections have region semantics; selector fallback is deliberately not a synthetic replacement.
    const scope=page.locator('.c7h-view-main');
    await page.getByRole('link',{name:'Cabin',exact:true}).waitFor();
    check(`${device}/${scenario} cabin selected`,await page.getByRole('link',{name:'Cabin',exact:true}).getAttribute('aria-current')==='page',page.url());
    if(scenario==='working'){
     const surface=scope.getByRole('region',{name:'Interactive SITRAK C7H cabin panorama',exact:true});
     await surface.locator('canvas').waitFor();await page.waitForFunction(()=>document.querySelector('.c7h-view-main [data-renderer]')?.getAttribute('data-renderer')==='webgl-360');
     check(`${device} panorama primary, no separate still`,await scope.locator('.cabin-panorama').count()===1&&await scope.locator('.showroom-poster').count()===0&&await scope.getByRole('button',{name:'Load optional cabin panorama'}).count()===0,{viewers:await scope.locator('.cabin-panorama').count(),posters:await scope.locator('.showroom-poster').count()});
     await surface.focus();await page.keyboard.press('ArrowRight');check(`${device} keyboard pans`,await surface.getAttribute('data-yaw')==='15',await surface.getAttribute('data-yaw'));
     await scope.getByRole('button',{name:'Zoom in panorama',exact:true}).click();check(`${device} zoom operates`,await surface.getAttribute('data-fov')==='65',await surface.getAttribute('data-fov'));
     await scope.getByRole('button',{name:'Reset panorama',exact:true}).click();check(`${device} reset operates`,await surface.getAttribute('data-yaw')==='0'&&await surface.getAttribute('data-fov')==='75',{});
     await surface.scrollIntoViewIfNeeded();const rect=await surface.boundingBox();await page.mouse.move(rect.x+rect.width*.6,rect.y+rect.height*.45);await page.mouse.down();await page.mouse.move(rect.x+rect.width*.4,rect.y+rect.height*.45,{steps:8});await page.mouse.up();check(`${device} pointer drag pans`,Number(await surface.getAttribute('data-yaw'))>0,await surface.getAttribute('data-yaw'));
     await scope.getByRole('button',{name:'Reset panorama',exact:true}).click();
     check(`${device} responsive page containment`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),await page.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:innerWidth})));
     check(`${device} keyboard instructions retained`,/Click and drag.*arrow keys/.test(await scope.textContent()),{});
     await scope.getByRole('button',{name:'Full screen panorama',exact:true}).click();
     const fullscreen=await page.evaluate(()=>!!document.fullscreenElement),fullScreenMessage=await scope.locator('[role=status]').allTextContents();
     check(`${device} fullscreen or honest recovery`,fullscreen||fullScreenMessage.some(t=>/full screen.*(unavailable|could not)/i.test(t)),{fullscreen,fullScreenMessage});if(fullscreen)await page.evaluate(()=>document.exitFullscreen());
    }else if(scenario==='no-gpu'){
     await scope.getByText(/360° graphics are unavailable/).waitFor();
     const image=scope.locator('.cabin-panorama-surface img');await image.evaluate(e=>e.decode());
     check(`${device} noGPU still only inside labelled viewer fallback`,await scope.locator('.cabin-panorama').count()===1&&await scope.locator('.showroom-poster').count()===0&&await image.isVisible(),{status:await scope.locator('[role=status]').allTextContents()});
    }else{
     await scope.getByText('Cabin view unavailable. Retry or continue to specifications.').waitFor();
     check(`${device} failed panorama omits mismatched archive and gives recovery`,await scope.locator('img[src="/assets/references/c7h-cockpit.webp"]').count()===0&&await scope.locator('.cabin-panorama').count()===0&&!/Cockpit photo tab/.test(await scope.textContent()),{status:await scope.locator('[role=status]').allTextContents()});
     await capture(page,`cabin-${scenario}-${device}`,'Actual primary panorama blocked BEFORE navigation/hydration; known mismatched cockpit omitted under new copy direction. No substituted imagery.');
     const retry=scope.getByRole('button',{name:/retry/i});await retry.waitFor();failImage=false;await retry.click();await page.waitForFunction(()=>document.querySelector('.c7h-view-main [data-renderer]')?.getAttribute('data-renderer')==='webgl-360');check(`${device} retry restores main panorama`,await scope.locator('.showroom-poster').count()===0&&await scope.locator('.cabin-panorama').count()===1,{});
    }
    if(scenario!=='image-failure')await capture(page,`cabin-${scenario}-${device}`,'Actual full-page C7H cabin; desktop/mobile browser emulation, reduced motion, no image retouching.');
    await page.getByRole('button',{name:'Enquire about this C7H',exact:true}).click();await page.getByRole('dialog').waitFor();check(`${device}/${scenario} model context preserved`,await page.locator('select[name=model]').inputValue()==='SITRAK C7H',{});await page.keyboard.press('Escape');
    await page.getByRole('link',{name:'Specifications',exact:true}).click();check(`${device}/${scenario} specifications usable`,await page.getByRole('cell',{name:'80 T GCM',exact:true}).isVisible(),{});
   }catch(e){check(`${device}/${scenario} journey complete`,false,e.message);}
   finally{await ctx.close();}
  }
 }
}finally{
 await browser.close();const sourceAfter=await source(),sourceStable=JSON.stringify(sourceBefore)===JSON.stringify(sourceAfter);
 await writeFile(`${out}/result.json`,JSON.stringify({out,browser:browser.version(),sourceBefore,sourceAfter,sourceStable,checks,shots,errors,blocked,limits:'Owner verification only; real Edge local dev route, not independent QA/export-host proof, device hardware or rights/variant/photographic authenticity approval. noGPU is an explicit fault-injection scenario.'},null,2));
 console.log(JSON.stringify({out,passed:checks.filter(c=>c.pass).length,failed:checks.filter(c=>!c.pass),sourceStable,images:shots.length,errors},null,2));if(checks.some(c=>!c.pass)||!sourceStable||errors.length)process.exitCode=1;
}

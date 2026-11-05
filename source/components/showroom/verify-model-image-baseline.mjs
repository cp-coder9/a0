// Baseline evidence only: current assets/model sync, NOT a high-quality completion claim.
import {createRequire} from 'node:module';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {heroTrucks} from '../../lib/hero-trucks.ts';
const {chromium}=createRequire('E:/social-studio/apps/web/package.json')('playwright');
const out=`E:/Sitrak-website/docs/showroom-evidence/ui/screenshots/MODEL-IMAGE-BASELINE-${new Date().toISOString().replaceAll(':','-').replaceAll('.','-')}`;
await mkdir(out,{recursive:true});const checks=[],images=[],quality=[],errors=[];
const browser=await chromium.launch({channel:'msedge',headless:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
function record(name,pass,actual){checks.push({name,pass,actual});}
try{
 for(const [device,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
  const ctx=await browser.newContext({viewport:{width,height},reducedMotion:'no-preference'}),page=await ctx.newPage();page.setDefaultTimeout(12000);
  await ctx.route('**/*',r=>{const u=new URL(r.request().url());return ['127.0.0.1','localhost'].includes(u.hostname)&&r.request().method()==='GET'?r.continue():r.abort();});
  page.on('pageerror',e=>errors.push({device,message:e.message}));
  try{
   await page.goto('http://127.0.0.1:3100/',{waitUntil:'networkidle',timeout:25000});await page.mouse.move(0,0);
   const active=()=>page.locator('.model-selector[aria-pressed=true]').getAttribute('aria-label');
   let previous=await active();
   for(let turn=0;turn<3;turn++){
    await page.waitForFunction(before=>document.querySelector('.model-selector[aria-pressed=true]')?.getAttribute('aria-label')!==before,previous,{timeout:11000});
    const label=await active(),model=heroTrucks.find(t=>label===`Show ${t.name}`),src=await page.locator('.hero-image.is-active').getAttribute('src');
    record(`${device} automatic turn ${turn+1}`,!!model&&src===model.image&&await page.locator('.hero-model').textContent()===model.specification,{label,src,spec:await page.locator('.hero-model').textContent()});previous=label;
   }
   for(const truck of heroTrucks){
    await page.getByRole('button',{name:`Show ${truck.name}`,exact:true}).click();
    const img=page.locator('.hero-image.is-active');await img.evaluate(e=>e.decode());
    record(`${device} manual ${truck.id}`,await img.getAttribute('src')===truck.image&&await page.locator('.hero-model').textContent()===truck.specification,{label:await active(),src:await img.getAttribute('src')});
    const metric=await img.evaluate(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e),scale=s.objectFit==='contain'?Math.min(r.width/e.naturalWidth,r.height/e.naturalHeight):Math.max(r.width/e.naturalWidth,r.height/e.naturalHeight);return {src:e.currentSrc,naturalWidth:e.naturalWidth,naturalHeight:e.naturalHeight,box:{width:r.width,height:r.height},objectFit:s.objectFit,dpr:devicePixelRatio,physicalUpscaleFactor:scale*devicePixelRatio,sourceFractionVisible:{horizontal:Math.min(1,r.width/(e.naturalWidth*scale)),vertical:Math.min(1,r.height/(e.naturalHeight*scale))}};});
    quality.push({device,model:truck.id,...metric,limitation:'Resolution/crop metric only; does not establish photographic detail, exact variant or rights.'});
    await page.evaluate(()=>scrollTo(0,0));const file=`${out}/${truck.id}-${device}.png`;await page.screenshot({path:file,fullPage:false,animations:'disabled'});images.push({file,model:truck.id,viewport:{width,height},utc:new Date().toISOString(),sha256:sha(await readFile(file)),baseline:true});
    await page.getByRole('button',{name:/Book a test drive/}).click();await page.getByRole('dialog').waitFor();
    record(`${device} CTA context ${truck.id}`,await page.locator('select[name=model]').inputValue()===truck.model,{model:await page.locator('select[name=model]').inputValue()});
    await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
   }
  }catch(e){record(`${device} baseline completed`,false,e.message);}
  finally{await ctx.close();}
 }
}finally{
 await browser.close();const result={purpose:'current-assets baseline; NOT high-quality imagery completion or publication approval',out,browser:browser.version(),checks,quality,images,errors,network:'GET loopback only; all submissions and external contacts denied'};
 await writeFile(`${out}/result.json`,JSON.stringify(result,null,2));console.log(JSON.stringify({out,passed:checks.filter(c=>c.pass).length,failed:checks.filter(c=>!c.pass),quality,images:images.length,errors},null,2));if(checks.some(c=>!c.pass)||errors.length)process.exitCode=1;
}

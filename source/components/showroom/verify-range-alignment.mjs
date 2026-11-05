// Measure real SITRAK range alignment; long-text variations exist only in this test DOM.
import {createRequire} from 'node:module';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=createRequire('E:/social-studio/apps/web/package.json')('playwright');
const sharp=createRequire('E:/social-studio/package.json')('sharp'); // Existing screenshot-crop tool; no Social application work.
const phase=process.env.RANGE_PHASE||'before',stamp=new Date().toISOString().replaceAll(':','-').replaceAll('.','-');
const out=`E:/Sitrak-website/docs/showroom-evidence/ui/screenshots/RANGE-ALIGNMENT-${phase.toUpperCase()}-${stamp}`;
await mkdir(out,{recursive:true});const results=[],shots=[],errors=[];
const hash=b=>createHash('sha256').update(b).digest('hex');
async function source(){const files={};for(const p of ['components/showroom/ShowroomDiscovery.tsx','components/showroom/showroom.css','app/page.tsx'])files[p]=hash(await readFile(`E:/Sitrak-website/${p}`));return files;}
const before=await source();const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 for(const [device,width,height] of [['desktop',1440,1000],['tablet',820,1180],['mobile',390,844]]){
  const ctx=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await ctx.newPage();page.setDefaultTimeout(10000);
  await ctx.route('**/*',r=>{const u=new URL(r.request().url());return ['127.0.0.1','localhost'].includes(u.hostname)&&r.request().method()==='GET'?r.continue():r.abort();});
  page.on('pageerror',e=>errors.push({device,message:e.message}));
  try{
   await page.goto('http://127.0.0.1:3100/',{waitUntil:'networkidle',timeout:25000});await page.evaluate(()=>document.fonts.ready);
   const originals=await page.locator('.showroom-range-card').evaluateAll(cards=>cards.map(card=>({title:card.querySelector('h2')?.textContent,spec:card.querySelector('.showroom-range-copy>p:not(.eyebrow)')?.textContent})));
   for(const variable of [false,true]){
    if(variable)await page.locator('.showroom-range-card').nth(1).evaluate(card=>{card.querySelector('h2').textContent='HOWO 7 — extended construction application model';card.querySelector('.showroom-range-copy>p:not(.eyebrow)').textContent='Synthetic long specification text for wrapping checks only — regional construction operations and challenging route conditions, with full content retained rather than clipped.';});
    const data=await page.evaluate(()=>{const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right};};return {viewport:{width:innerWidth,height:innerHeight},documentWidth:document.documentElement.scrollWidth,cards:[...document.querySelectorAll('.showroom-range-card')].map(card=>({card:box(card),image:box(card.querySelector('.showroom-range-image')),title:box(card.querySelector('h2')),copy:box(card.querySelector('.showroom-range-copy')),spec:box(card.querySelector('.showroom-range-copy>p:not(.eyebrow)')),actions:box(card.querySelector('.showroom-range-actions')),primary:box(card.querySelector('.showroom-range-actions>a,.showroom-range-actions>button'))}))};});
    const rows=[];for(const card of data.cards){const row=rows.find(row=>Math.abs(row[0].card.y-card.card.y)<=2);if(row)row.push(card);else rows.push([card]);}
    const misaligned=[];for(const row of rows)if(row.length>1)for(const [part,edge] of [['image','bottom'],['title','y'],['spec','y'],['actions','y'],['card','bottom']]){const values=row.map(c=>c[part][edge]);if(Math.max(...values)-Math.min(...values)>2)misaligned.push({part,edge,delta:Math.max(...values)-Math.min(...values)});}
    const contained=data.cards.every(c=>c.primary.x>=c.card.x-2&&c.primary.right<=c.card.right+2&&c.actions.bottom<=c.card.bottom+2&&c.spec.bottom<=c.actions.y+2);
    const framesContained=data.cards.every(c=>c.image.x>=c.card.x-2&&c.image.right<=c.card.right+2&&c.copy.x>=c.card.x-2&&c.copy.right<=c.card.right+2);
    results.push({device,variableText:variable,pass:data.documentWidth<=width&&!misaligned.length&&contained&&framesContained,misaligned,contained,framesContained,data,originals});
    if(!variable||device==='desktop'){
     const file=`${out}/range-${device}${variable?'-synthetic-long-text':''}.png`,fullPageOriginal=`${out}/fullpage-${device}${variable?'-synthetic-long-text':''}.png`;
     await page.evaluate(()=>{scrollTo(0,0);return new Promise(resolve=>requestAnimationFrame(resolve));});
     const bounds=await page.locator('#the-range').boundingBox();
     const original=await page.screenshot({path:fullPageOriginal,fullPage:true,animations:'disabled',timeout:15000});
     const crop={left:Math.floor(bounds.x),top:Math.floor(bounds.y),width:Math.ceil(bounds.width),height:Math.ceil(bounds.height)};
     await sharp(original).extract(crop).png().toFile(file);
     shots.push({file,url:page.url(),viewport:{width,height},utc:new Date().toISOString(),sha256:hash(await readFile(file)),syntheticDOMText:variable,fullRangeElement:true,fullPageOriginal,fullPageSHA256:hash(original),crop,notes:'Literal pixel crop from preserved real full-page screenshot at scrollY0; no UI hidden, retouched or reconstructed. Avoids sticky controls being repeated through element-scrolling captures.'});
    }
   }
  }catch(e){results.push({device,pass:false,error:e.message});}
  finally{await ctx.close();}
 }
}finally{
 await browser.close();const after=await source(),sourceStable=JSON.stringify(before)===JSON.stringify(after);
 await writeFile(`${out}/result.json`,JSON.stringify({phase,out,browser:browser.version(),sourceBefore:before,sourceAfter:after,sourceStable,results,shots,errors,notes:'Developer layout evidence. Synthetic text only in labelled variation captures; no source mutation/submission or external contacts.'},null,2));
 console.log(JSON.stringify({out,phase,sourceStable,passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).map(({data,originals,...r})=>r),images:shots.length,errors},null,2));
 if(phase==='after'&&(results.some(r=>!r.pass)||!sourceStable||errors.length))process.exitCode=1;
}

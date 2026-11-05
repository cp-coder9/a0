// Offline SSR component/CSS checks only. Never opens external destinations.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const{chromium}=createRequire('E:/social-studio/apps/web/package.json')('playwright');
const out=process.argv[2];if(!out||!out.startsWith('E:/Sitrak-website/docs/showroom-evidence/ui/'))throw Error('Use authorized UI evidence directory');
await mkdir(out,{recursive:true});
const files=['components/Header.tsx','components/showroom/FloatingSocialLinks.tsx','components/showroom/floating-socials.css','components/showroom/official-links.ts','components/showroom/OfficialCompanyLinks.tsx','components/showroom/official-company-links.css'];
const hash=b=>createHash('sha256').update(b).digest('hex');
async function identity(){return Object.fromEntries(await Promise.all(files.map(async p=>[p,hash(await readFile('E:/Sitrak-website/'+p))])))}
const sourceBefore=await identity(),checks=[],images=[],errors=[],network=[];const browser=await chromium.launch({channel:'msedge',headless:true});
function check(name,pass,actual){checks.push({name,pass,actual})}
try{for(const[device,width,height]of[['desktop',1440,1000],['mobile',390,844],['small',320,568],['short-landscape',844,320]]){
 const ctx=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),p=await ctx.newPage();p.setDefaultTimeout(10000);
 await ctx.route('**/*',r=>{const u=r.request().url();if(u.startsWith('file:')&&u.includes('/Sitrak-website/'))return r.continue();network.push(u);return r.abort()});
 p.on('pageerror',e=>errors.push({device,message:e.message}));
 try{
  const fixture=pathToFileURL(out+'/fixture.html').href;await p.goto(fixture,{waitUntil:'load'});
  const rail=p.getByRole('navigation',{name:'Social media'});await rail.waitFor();
  const layout=await p.evaluate(()=>{const rail=document.querySelector('.floating-socials').getBoundingClientRect(),header=document.querySelector('.site-header').getBoundingClientRect(),cta=document.querySelector('.fixture-cta').getBoundingClientRect();const rect=r=>({x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom});return{rail:rect(rail),header:rect(header),cta:rect(cta),width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,targets:[...document.querySelectorAll('.floating-social')].map(a=>rect(a.getBoundingClientRect()))}});
  check(device+' rail/targets inside viewport',layout.rail.x>=0&&layout.rail.y>=0&&layout.rail.right<=width&&layout.rail.bottom<=height&&layout.targets.every(r=>r.width>=44&&r.height>=44),layout);
  check(device+' rail avoids header',layout.rail.y>=layout.header.bottom,layout);
  check(device+' rail avoids synthetic CTA',layout.rail.bottom<=layout.cta.y,layout);
  check(device+' no horizontal overflow',layout.scrollWidth<=width,layout);
  const wanted=[['Facebook','https://www.facebook.com/trukafrik'],['Instagram','https://www.instagram.com/trukafrik'],['TikTok','https://www.tiktok.com/@truk.afrik'],['Chat on WhatsApp','https://wa.me/27609412357']];
  await rail.getByRole('link',{name:wanted[0][0],exact:true}).focus();
  for(let i=0;i<wanted.length;i++){
   const[name,href]=wanted[i],a=rail.getByRole('link',{name,exact:true});check(device+' native focus '+name,await a.evaluate(e=>e===document.activeElement),name);await p.keyboard.press('Enter');
   check(device+' mocked navigation '+name,(await p.evaluate(()=>window.linkIntents.at(-1)))===href&&p.url()===fixture,await a.getAttribute('href'));
   if(i<wanted.length-1)await p.keyboard.press('Tab');
  }
  check(device+' reduced motion',await rail.locator('a').first().evaluate(e=>getComputedStyle(e).transitionDuration)==='0s',await rail.locator('a').first().evaluate(e=>getComputedStyle(e).transitionDuration));
  const image=out+'/social-'+device+'.png';await p.screenshot({path:image,animations:'disabled'});images.push(image);
  await p.evaluate(()=>{const d=document.createElement('div');d.id='fixture-dialog';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.textContent='Synthetic modal visibility check';document.body.append(d)});
  check(device+' social rail hidden during modal',!(await rail.isVisible()),'CSS fixture; not application modal/focus-trap acceptance');
  await p.evaluate(()=>{document.getElementById('fixture-dialog').remove();document.getElementById('primary-nav').classList.add('is-open');document.getElementById('truck-menu-panel').hidden=false;document.getElementById('truck-menu-trigger').setAttribute('aria-expanded','true')});
  check(device+' rail hidden behind open menu',!(await rail.isVisible()),'Menu revealed for CSS fixture; actual React toggle tested separately');
  const resources=p.getByRole('group',{name:'Company information'});await resources.scrollIntoViewIfNeeded();
  for(const name of['Company profile (PDF)','Company website']){const a=resources.getByRole('link',{name,exact:true});await a.scrollIntoViewIfNeeded();await a.click();check(device+' mocked company link '+name,(await p.evaluate(()=>window.linkIntents.at(-1)))===await a.getAttribute('href'),await a.getAttribute('href'))}
  const menu=await resources.getByRole('link',{name:'Company website',exact:true}).boundingBox();check(device+' scrolled company resource inside viewport',!!menu&&menu.y>=0&&menu.y+menu.height<=height,menu);
  const mi=out+'/company-menu-'+device+'.png';await p.screenshot({path:mi,animations:'disabled'});images.push(mi);
 }catch(e){errors.push({device,message:e.message})}finally{await ctx.close()}
}}finally{await browser.close();const sourceAfter=await identity();check('monitored source unchanged',JSON.stringify(sourceBefore)===JSON.stringify(sourceAfter),{sourceBefore,sourceAfter});await writeFile(out+'/result.json',JSON.stringify({scope:'OFFLINE SSR COMPONENT/CSS FIXTURE ONLY. Header menu manually revealed for layout; React open/Escape covered separately by component tests. Not a running Next.js route or full integration QA. Synthetic80px bottom CTA; system fallback fonts.',browser:browser.version(),sourceBefore,sourceAfter,checks,images,errors,blockedRequests:network},null,2));}
console.log(JSON.stringify({out,passed:checks.filter(c=>c.pass).length,failed:checks.filter(c=>!c.pass).map(c=>c.name),images:images.length,errors},null,2));if(checks.some(c=>!c.pass)||errors.length)process.exitCode=1;

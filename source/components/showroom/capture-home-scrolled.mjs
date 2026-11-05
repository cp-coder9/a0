import{createRequire}from'node:module';
import{readFileSync}from'node:fs';
import{createHash}from'node:crypto';
const{chromium}=createRequire('E:/social-studio/apps/web/package.json')('playwright');
const out=process.argv[2];
const b=await chromium.launch({channel:'msedge',headless:true});
const res={};
for(const vp of [{n:'desktop',w:1440,h:1000},{n:'mobile',w:390,h:844}]){
 const ctx=await b.newContext({viewport:{width:vp.w,height:vp.h}});const p=await ctx.newPage();p.setDefaultTimeout(240000);
 await p.goto('http://127.0.0.1:3100/',{waitUntil:'domcontentloaded',timeout:240000});
 const intro=p.locator('.intro-screen');
 try{await intro.waitFor({state:'visible',timeout:10000});await p.getByRole('button',{name:/Skip intro/i}).click()}catch{}
 await intro.waitFor({state:'hidden',timeout:20000}).catch(()=>{});
 const H=await p.evaluate(()=>document.documentElement.scrollHeight);
 for(let y=0;y<H;y+=Math.round(vp.h*0.8)){await p.evaluate(v=>window.scrollTo(0,v),y);await p.waitForTimeout(220)}
 await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(1200);
 const imgs=await p.evaluate(()=>[...document.images].map(i=>({src:(i.currentSrc||i.src).split('/').slice(-1)[0],w:i.naturalWidth,complete:i.complete})));
 const f=out+'/home-'+vp.n+'-scrolled.png';
 await p.screenshot({path:f,fullPage:true,animations:'disabled'});
 res[vp.n]={totalImages:imgs.length,brokenImages:imgs.filter(i=>i.complete&&i.w===0).map(i=>i.src),file:f,sha256:createHash('sha256').update(readFileSync(f)).digest('hex'),height:H};
 await ctx.close();
}
await b.close();
console.log(JSON.stringify(res,null,2));

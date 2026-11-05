/** @typedef {'idle'|'launch'|'impact'|'tagline'|'exit'|'done'} IntroPhase */
/** Shared, dependency-free timeline for the HTML preview and Next.js component. */
export function createIntroController({clock=globalThis,onPhase=()=>{},onComplete=()=>{},oncePerSession=false,storage,storageKey='truk-afrik:intro:v1',reducedMotion=false}={}){
 let started=false,finished=false,disposed=false;const timers=new Set();
 const phase=value=>{if(!disposed)onPhase(value)};
 const schedule=(delay,fn)=>{const id=clock.setTimeout(()=>{timers.delete(id);if(!disposed&&!finished)fn()},delay);timers.add(id)};
 const cancel=()=>{for(const id of timers)clock.clearTimeout(id);timers.clear()};
 const complete=reason=>{if(finished||disposed)return;finished=true;cancel();try{if(oncePerSession)storage?.setItem(storageKey,'1')}catch{}phase('done');onComplete(reason)};
 return {
  start(){if(started||disposed)return;started=true;
   try{if(oncePerSession&&storage?.getItem(storageKey)==='1'){complete('seen');return}}catch{}
   phase(reducedMotion?'tagline':'launch');
   if(reducedMotion){schedule(900,()=>complete('reduced-motion'));return}
   schedule(1150,()=>phase('impact'));
   schedule(1800,()=>phase('tagline'));
   schedule(3700,()=>phase('exit'));
   schedule(4500,()=>complete('finished'));
  },
  skip(){complete('skipped')},
  dispose(){disposed=true;cancel()},
 };
}


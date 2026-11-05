'use client';
import {useEffect,useRef,useState} from 'react';

/** Count once when visible; preserve the real specification in server HTML. */
export function CountUp({value,duration=1600}:{value:number;duration?:number}){
  const element=useRef<HTMLSpanElement>(null);
  const [current,setCurrent]=useState(value);
  useEffect(()=>{
    const node=element.current;
    if(!node)return;
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    if(media.matches||!('IntersectionObserver' in window)){setCurrent(value);return}
    let frame=0,started=false,visible=false,start:number|undefined,disposed=false;
    setCurrent(0);
    const tick=(now:number)=>{
      if(disposed)return;
      if(document.documentElement.dataset.trukIntro==='active'){setCurrent(0);start=now;frame=requestAnimationFrame(tick);return}
      start??=now;
      const progress=Math.min(1,(now-start)/duration);
      setCurrent(Math.round(value*(1-Math.pow(1-progress,3))));
      if(progress<1)frame=requestAnimationFrame(tick);
    };
    const begin=()=>{if(visible&&!started&&!disposed&&document.documentElement.dataset.trukIntro!=='active'){started=true;observer.disconnect();frame=requestAnimationFrame(tick)}};
    const observer=new IntersectionObserver(entries=>{visible=entries.some(entry=>entry.isIntersecting);begin()}, {threshold:.55,rootMargin:'0px 0px -24px 0px'});
    document.addEventListener('trukafrik:intro-complete',begin);
    observer.observe(node);
    const reduce=()=>{if(media.matches){disposed=true;cancelAnimationFrame(frame);observer.disconnect();setCurrent(value)}};
    media.addEventListener('change',reduce);
    return()=>{disposed=true;observer.disconnect();cancelAnimationFrame(frame);media.removeEventListener('change',reduce);document.removeEventListener('trukafrik:intro-complete',begin)};
  },[value,duration]);
  return <span ref={element} className="count-number" data-testid="count-up" aria-hidden="true">{current}</span>;
}

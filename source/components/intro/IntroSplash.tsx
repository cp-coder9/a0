'use client';
import {useEffect,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {createIntroController,type IntroController,type IntroPhase} from './intro-controller.mjs';
import {createMetalAudio,type MetalAudio} from './metal-audio.mjs';

type Props={children:ReactNode;logoSrc?:string;oncePerSession?:boolean;firstVisitOnly?:boolean;autoStart?:boolean};
/** The real landing page stays mounted underneath; no redirect or fake loading. */
export function IntroSplash({children,logoSrc='/intro/sitrak-truk-afrik.png',oncePerSession=true,firstVisitOnly=false,autoStart=false}:Props){
 const [replay,setReplay]=useState(0);
 useEffect(()=>{const request=()=>setReplay(value=>value+1);window.addEventListener('trukafrik:intro-replay',request);return()=>window.removeEventListener('trukafrik:intro-replay',request);},[]);
 const [phase,setPhase]=useState<IntroPhase>('idle'),[reduced,setReduced]=useState(false),[sound,setSound]=useState(false);
 const controller=useRef<IntroController|null>(null),audio=useRef<MetalAudio|null>(null),overlay=useRef<HTMLElement>(null);
 const active=phase!=='idle'&&phase!=='done';
 useEffect(()=>{
  if(!autoStart&&replay===0)return;
  let disposed=false;
  document.documentElement.dataset.trukIntro='active';document.dispatchEvent(new Event('trukafrik:intro-start'));
  const complete=()=>{delete document.documentElement.dataset.trukIntro;document.dispatchEvent(new Event('trukafrik:intro-complete'))};
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');setReduced(media.matches);
  // firstVisitOnly persists "seen" in localStorage so the opening plays once per browser, not
  // once per tab/session. A manual replay (footer button) always plays, and storage failures
  // simply fall back to playing the intro.
  let storage:Storage|undefined;try{storage=firstVisitOnly?window.localStorage:window.sessionStorage}catch{}
  const storageKey=firstVisitOnly?'truk-afrik:intro:v1:seen':'truk-afrik:intro:v1';
  const player=createMetalAudio();audio.current=player;
  const timeline=createIntroController({oncePerSession:replay>0?false:(firstVisitOnly||oncePerSession),storage,storageKey,reducedMotion:media.matches,onComplete:complete,onPhase:value=>{if(disposed)return;setPhase(value);if(value==='impact')player.play()}});
  controller.current=timeline;
  const preference=()=>{if(media.matches){setReduced(true);timeline.skip()}};
  media.addEventListener('change',preference);
  // Start only after the actual logo is decoded. Asset errors never trap visitors.
  const image=new Image();image.src=logoSrc;
  const failOpen=window.setTimeout(()=>{if(!disposed)timeline.skip()},6000);
  image.decode().then(()=>{window.clearTimeout(failOpen);if(!disposed)timeline.start()}).catch(()=>{window.clearTimeout(failOpen);if(!disposed)timeline.skip()});
  return()=>{disposed=true;window.clearTimeout(failOpen);timeline.dispose();player.dispose();media.removeEventListener('change',preference);complete()};
 },[logoSrc,oncePerSession,firstVisitOnly,autoStart,replay]);
 useEffect(()=>{
  if(!active)return;
  const previous=document.body.style.overflow,trigger=document.activeElement as HTMLElement|null;
  document.body.style.overflow='hidden';overlay.current?.focus({preventScroll:true});
  const key=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();controller.current?.skip()}
   if(event.key==='Tab'){
    const buttons=[...overlay.current?.querySelectorAll<HTMLButtonElement>('button')||[]];const first=buttons[0],last=buttons.at(-1);
    if(event.shiftKey&&(document.activeElement===first||document.activeElement===overlay.current)){event.preventDefault();last?.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
   }
  };
  document.addEventListener('keydown',key);
  return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',key);window.setTimeout(()=>{if(trigger?.isConnected)trigger.focus({preventScroll:true})},0)};
 },[active]);
 return <><div className="intro-landing-shell" inert={active}>{children}</div>{active&&<section ref={overlay} className="intro-screen" role="dialog" aria-modal="true" aria-label="SITRAK and Truk Afrik introduction" tabIndex={-1} data-phase={phase} data-reduced={reduced}>
  <div className="intro-surface" aria-hidden="true"><div className="intro-light"/><div className="intro-edge"/></div>
  <div className="intro-camera"><div className="intro-brand"><div className="intro-contact-shadow" aria-hidden="true"/><div className="intro-logo-carrier"><img className="intro-logo" src={logoSrc} width={1386} height={766} alt="SITRAK — Truk Afrik"/></div></div><p className="intro-tagline"><span>We're in it for </span><strong>the long haul.</strong></p></div>
  <div className="intro-impact-ring" aria-hidden="true"/><div className="intro-impact-ring second" aria-hidden="true"/><div className="intro-impact-flash" aria-hidden="true"/><div className="intro-sparks" aria-hidden="true">{Array.from({length:24},(_,i)=><i key={i} style={{'--angle':`${i*15}deg`,'--run':`${140+(i%5)*40}px`,'--spark-delay':`${(i%3)*.008}s`} as CSSProperties}/>)}</div>
  <div className="intro-controls"><button type="button" aria-pressed={sound} onClick={async()=>{setSound(await audio.current?.setEnabled(!sound)??false)}}><span className="intro-sound-mark" aria-hidden="true"/>Sound {sound?'on':'off'}</button><button type="button" className="intro-skip" onClick={()=>controller.current?.skip()}>Skip intro <span aria-hidden="true">→</span></button></div>
 </section>}</>;
}

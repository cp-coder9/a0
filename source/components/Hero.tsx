'use client';
import {useEffect,useRef,useState,type CSSProperties,type PointerEvent,type KeyboardEvent} from 'react';
import {CountUp} from './CountUp';
import {EnquiryButton} from './Enquiry';
import {heroTrucks} from '../lib/hero-trucks';

export function Hero(){
  const [active,setActive]=useState(0);
  const [failedImages,setFailedImages]=useState<ReadonlySet<string>>(()=>new Set());
  const [introActive,setIntroActive]=useState(true);
  const [paused,setPaused]=useState(false);
  const [hovered,setHovered]=useState(false);
  const [focused,setFocused]=useState(false);
  const [visible,setVisible]=useState(false);
  const [pageVisible,setPageVisible]=useState(true);
  const [reduced,setReduced]=useState(true);
  const region=useRef<HTMLElement>(null);
  const imageElements=useRef(new Map<string,HTMLImageElement>());
  useEffect(()=>{
    const failed=[...imageElements.current].filter(([,image])=>image.complete&&image.naturalWidth===0).map(([id])=>id);
    if(failed.length)setFailedImages(previous=>failed.every(id=>previous.has(id))?previous:new Set([...previous,...failed]));
  },[]);
  const playing=!introActive&&!paused&&!hovered&&!focused&&visible&&pageVisible&&!reduced;
  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const preference=()=>setReduced(media.matches);
    const visibility=()=>setPageVisible(!document.hidden);
    preference();visibility();
    const intro=()=>setIntroActive(document.documentElement.dataset.trukIntro==='active');intro();
    document.addEventListener('trukafrik:intro-start',intro);document.addEventListener('trukafrik:intro-complete',intro);
    media.addEventListener('change',preference);
    document.addEventListener('visibilitychange',visibility);
    const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>setVisible(entries.some(entry=>entry.isIntersecting)),{threshold:.25}):null;
    if(observer&&region.current)observer.observe(region.current);else setVisible(true);
    return()=>{observer?.disconnect();media.removeEventListener('change',preference);document.removeEventListener('visibilitychange',visibility);document.removeEventListener('trukafrik:intro-start',intro);document.removeEventListener('trukafrik:intro-complete',intro)};
  },[]);
  useEffect(()=>{
    if(!playing)return;
    const timer=window.setTimeout(()=>setActive(index=>(index+1)%heroTrucks.length),7000);
    return()=>window.clearTimeout(timer);
  },[active,playing]);
  const touch=useRef<{x:number;y:number}|null>(null);
  const truck=heroTrucks[active];
  const select=(index:number)=>{setPaused(true);setActive((index+heroTrucks.length)%heroTrucks.length)};
  function swipeStart(event:PointerEvent<HTMLElement>){
    if(event.pointerType==='mouse'||(event.target as Element).closest('a,button'))return;
    touch.current={x:event.clientX,y:event.clientY};
  }
  function swipeEnd(event:PointerEvent<HTMLElement>){
    if(!touch.current)return;
    const x=event.clientX-touch.current.x,y=event.clientY-touch.current.y;
    touch.current=null;
    if(Math.abs(x)>50&&Math.abs(x)>Math.abs(y)*1.4)select(active+(x<0?1:-1));
  }
  function keyboard(event:KeyboardEvent<HTMLElement>){
    if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();select(active+(event.key==='ArrowRight'?1:-1))}
  }
  return <section id="top" ref={region} className={`hero hero-carousel ${playing?'is-playing':'is-paused'}`} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onFocusCapture={()=>setFocused(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))setFocused(false)}} onClickCapture={event=>{if((event.target as Element).closest('.hero-actions'))setPaused(true)}} data-screen-label="01 The truck" aria-label="Explore the truck range" aria-roledescription="carousel" onKeyDown={keyboard} onPointerDown={swipeStart} onPointerUp={swipeEnd} onPointerCancel={()=>{touch.current=null}}>
    <div className="hero-visual" aria-hidden="true">{heroTrucks.map((item,index)=><img key={item.id} ref={image=>{if(image)imageElements.current.set(item.id,image);else imageElements.current.delete(item.id);}} className={`hero-image hero-carousel-image ${index===active?'is-active':''}`} src={item.image} alt="" onError={()=>setFailedImages(previous=>previous.has(item.id)?previous:new Set(previous).add(item.id))} fetchPriority={index===0?'high':'low'} style={{objectPosition:item.position,visibility:failedImages.has(item.id)?'hidden':undefined}}/>)}</div>
    <div className="hero-shade"/>
    <div className="hero-content">
      
      <div className="hero-slide-copy" key={truck.id} role="group" aria-roledescription="slide" aria-label={`${active+1} of ${heroTrucks.length}: ${truck.name}`}>
        <h1 id="hero-title" aria-label={truck.title.join(' ')}><span className="hero-word"><span>{truck.title[0]}</span></span>{' '}<span className="hero-word"><span>{truck.title[1]}</span></span></h1>
        <p className="hero-copy">{truck.copy}</p>
        <div className="hero-actions"><EnquiryButton model={truck.model} className="button primary lg">Book a test drive <span aria-hidden="true">→</span></EnquiryButton><a className="button ghost lg" href="#the-range">See the range <span aria-hidden="true">↗</span></a></div>
        <div className="hero-specs"><p className="eyebrow sky hero-model">{truck.specification}</p><div className="hero-stats" style={{'--stat-columns':truck.stats.length} as CSSProperties}>
          {truck.stats.map((spec,index)=><div className={`hero-stat ${typeof spec.value==='string'?'hero-stat-text':''}`} key={`${truck.id}-${spec.label}`} role="group" aria-label={`${spec.value}${spec.unit?' '+spec.unit:''} — ${spec.label}`} style={{'--stat-delay':`${.35+index*.08}s`} as CSSProperties}><div className="hero-stat-number">{typeof spec.value==='number'?<CountUp value={spec.value}/>:<span className="hero-stat-value" aria-hidden="true">{spec.value}</span>}{spec.unit&&<span className="hero-stat-unit" aria-hidden="true">{spec.unit}</span>}</div><p aria-hidden="true">{spec.label}</p></div>)}
        </div></div>
      </div>
      <div className="hero-carousel-bar">
        <div className="hero-model-nav" role="group" aria-label="Choose a truck">{heroTrucks.map((item,index)=><button key={item.id} type="button" className={index===active?'model-selector is-active':'model-selector'} aria-label={`Show ${item.name}`} aria-pressed={index===active} onClick={()=>select(index)}><span className="model-selector-index">0{index+1}</span><span>{item.name}</span><span key={`${active}-${playing}`} className="model-progress" aria-hidden="true"/></button>)}</div>
        <div className="hero-carousel-controls">{!reduced&&<button type="button" className="slideshow-toggle" aria-label={paused?'Play truck slideshow':'Pause truck slideshow'} onClick={()=>setPaused(value=>!value)}><span aria-hidden="true">{paused?'▶':'Ⅱ'}</span></button>}<button type="button" aria-label="Previous truck" onClick={()=>select(active-1)}>←</button><button type="button" aria-label="Next truck" onClick={()=>select(active+1)}>→</button></div>
      </div>
      <p className="sr-only" aria-live={playing?'off':'polite'} aria-atomic="true">{truck.name}. {active+1} of {heroTrucks.length}.</p><div className="hero-carousel-footer"><a className="hero-scroll" href="#the-engineering"><span className="scroll-track" aria-hidden="true"><span/></span><span>Explore the engineering</span><span aria-hidden="true">↓</span></a><span className="hero-image-label" role={failedImages.has(truck.id)?'status':undefined}>{failedImages.has(truck.id)?`${truck.name} image unavailable. Model selection and enquiry remain available.`:`Pictured: ${truck.alt}`}</span></div>
    </div>
  </section>;
}

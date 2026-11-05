'use client';
import {useEffect,useRef,useState} from 'react';
import type {CatalogTruck} from '../lib/truck-catalog';
export function TruckGallery({truck,onInspect,badge}:{truck:CatalogTruck;onInspect?:()=>void;badge?:string}){
 const [active,setActive]=useState(0),[visible,setVisible]=useState(false),[hovered,setHovered]=useState(false),[focused,setFocused]=useState(false),[paused,setPaused]=useState(false),[reduced,setReduced]=useState(true),[pageVisible,setPageVisible]=useState(true);
 const region=useRef<HTMLDivElement>(null),touch=useRef<{x:number;y:number}|null>(null),swiped=useRef(false);
 const playing=visible&&!hovered&&!focused&&!paused&&!reduced&&pageVisible;
 useEffect(()=>{
  const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');const preference=()=>setReduced(media?.matches??true);const visibility=()=>setPageVisible(!document.hidden);preference();visibility();media?.addEventListener?.('change',preference);document.addEventListener('visibilitychange',visibility);
  const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>setVisible(entries.some(entry=>entry.isIntersecting)),{threshold:.15}):null;
  if(observer&&region.current)observer.observe(region.current);else setVisible(true);
  return()=>{observer?.disconnect();media?.removeEventListener?.('change',preference);document.removeEventListener('visibilitychange',visibility)};
 },[]);
 useEffect(()=>{if(!playing)return;const timer=window.setTimeout(()=>setActive(value=>(value+1)%truck.images.length),4500);return()=>window.clearTimeout(timer)},[active,playing,truck.images.length]);
 function select(index:number){setPaused(true);setActive((index+truck.images.length)%truck.images.length)}
 const images=<>{truck.images.map((image,index)=><img key={image.src} className={index===active?'gallery-image is-active':'gallery-image'} src={image.src} alt={index===active?image.label:''} aria-hidden={index!==active} loading="lazy" style={{objectPosition:image.position||'center',objectFit:image.fit||'cover'}}/>)}{badge&&<span className="badge">{badge}</span>}{onInspect&&<span className="gallery-open-hint">View technical specs <span aria-hidden="true">↗</span></span>}</>;
 return <div className="truck-gallery" ref={region} role="region" aria-roledescription="carousel" aria-label={`${truck.name} image gallery`} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onFocusCapture={()=>setFocused(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))setFocused(false)}} onPointerDown={event=>{swiped.current=false;if(event.pointerType!=='mouse')touch.current={x:event.clientX,y:event.clientY}}} onPointerUp={event=>{if(!touch.current)return;const x=event.clientX-touch.current.x,y=event.clientY-touch.current.y;touch.current=null;if(Math.abs(x)>40&&Math.abs(x)>Math.abs(y)*1.4){select(active+(x<0?1:-1));swiped.current=true}}} onPointerCancel={()=>{touch.current=null}}>
 {onInspect?<button type="button" className="gallery-open" aria-label={`View ${truck.name} technical specifications`} onClick={()=>{if(!swiped.current)onInspect();swiped.current=false}}>{images}</button>:<div className="gallery-open gallery-display">{images}</div>}
 <div className="gallery-toolbar"><button type="button" className="gallery-arrow" aria-label={`Previous image of ${truck.name}`} onClick={()=>select(active-1)}>←</button><div className="gallery-dots" aria-label="Image selection">{truck.images.map((image,index)=><button type="button" key={image.src} aria-label={`Show image ${index+1}: ${image.label}`} aria-pressed={index===active} onClick={()=>select(index)}><span/></button>)}</div>{!reduced&&<button type="button" className="gallery-play" aria-label={`${paused?'Play':'Pause'} gallery for ${truck.name}`} onClick={()=>setPaused(value=>!value)}>{paused?'▶':'Ⅱ'}</button>}<span className="gallery-count" aria-hidden="true">{active+1} / {truck.images.length}</span><button type="button" className="gallery-arrow" aria-label={`Next image of ${truck.name}`} onClick={()=>select(active+1)}>→</button></div>
 <p className="gallery-caption" aria-live="off">{truck.images[active].label}</p>
 </div>;
}

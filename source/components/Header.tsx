'use client';
import {useState,useRef,useEffect} from 'react';
import {EnquiryButton} from './Enquiry';
import {BrandLogo} from './BrandLogo';
import {truckCatalog} from '../lib/truck-catalog';
import {useTruckDetails,useShowroom} from './TruckExperience';
const links=[['Engineering','#the-engineering'],['Service','#backed-by-service'],['Dealership','#the-proof']];
// The "More" dropdown carries the dealership pages that used to sit behind a single dead link.
const moreLinks:[string,string,string][]=[
 ['/about','About','The dealership and the people behind it'],
 ['/finance','Finance','Structuring the deal with a financier'],
 ['/parts','Parts','Genuine parts and service support'],
 ['/pre-owned','Pre-owned','Used trucks, checked and listed'],
 ['/privacy-policy','Privacy','How enquiry details are handled'],
];
type Menu='range'|'more'|null;
export function Header(){
 const [open,setOpen]=useState(false);
 // One dropdown is open at a time: opening one closes the other.
 const [menu,setMenu]=useState<Menu>(null);
 const rangeOpen=menu==='range',moreOpen=menu==='more';
 const toggle=useRef<HTMLButtonElement>(null),rangeToggle=useRef<HTMLButtonElement>(null),moreToggle=useRef<HTMLButtonElement>(null);
 const openTruck=useTruckDetails(),openShowroom=useShowroom();
 const openedByHover=useRef(false),moreOpenedByHover=useRef(false);
 useEffect(()=>{if(!open&&!menu)return;const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){if(rangeOpen){setMenu(null);rangeToggle.current?.focus()}else if(moreOpen){setMenu(null);moreToggle.current?.focus()}else{setOpen(false);toggle.current?.focus()}}};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key)},[open,menu,rangeOpen,moreOpen]);
 return <header className="site-header"><div className="header-inner"><a href="/#the-range" aria-label="SITRAK Truk Afrik home" className="wordmark"><BrandLogo className="header-brand-logo" priority/></a><button className="menu-toggle" ref={toggle} aria-expanded={open} aria-controls="primary-nav" onClick={()=>setOpen(!open)}>{open?'Close ×':'Menu ☰'}</button><nav id="primary-nav" aria-label="Main navigation" className={open?'is-open':''}>
 {links.map(([label,url])=><a href={url} key={url} onClick={()=>setOpen(false)}>{label}</a>)}
 <div className="truck-menu more-menu" data-testid="more-menu" onMouseEnter={()=>{if(window.matchMedia('(hover: hover)').matches){moreOpenedByHover.current=true;setMenu('more')}}} onMouseLeave={()=>{moreOpenedByHover.current=false;if(!document.activeElement?.closest('.more-menu'))setMenu(value=>value==='more'?null:value)}} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))setMenu(value=>value==='more'?null:value)}}>
  <button type="button" id="more-menu-trigger" className="truck-menu-trigger" ref={moreToggle} aria-expanded={moreOpen} aria-controls="more-menu-panel" onClick={()=>{if(moreOpenedByHover.current){moreOpenedByHover.current=false;setMenu('more')}else setMenu(value=>value==='more'?null:'more')}}>More <span aria-hidden="true">⌄</span></button>
  <div id="more-menu-panel" className="truck-menu-panel more-menu-panel" hidden={!moreOpen} role="group" aria-label="Dealership pages"><p className="eyebrow gold">Dealership</p>{moreLinks.map(([href,label,detail])=><a href={href} key={href} onClick={()=>{setMenu(null);setOpen(false)}}><strong>{label}</strong><small>{detail}</small></a>)}</div>
 </div>
 <div className="truck-menu" data-testid="truck-menu" onMouseEnter={()=>{if(window.matchMedia('(hover: hover)').matches){openedByHover.current=true;setMenu('range')}}} onMouseLeave={()=>{openedByHover.current=false;if(!document.activeElement?.closest('.truck-menu'))setMenu(value=>value==='range'?null:value)}} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))setMenu(value=>value==='range'?null:value)}}>
 <button type="button" id="truck-menu-trigger" className="truck-menu-trigger" ref={rangeToggle} aria-expanded={rangeOpen} aria-controls="truck-menu-panel" onClick={()=>{if(openedByHover.current){openedByHover.current=false;setMenu('range')}else setMenu(value=>value==='range'?null:'range')}}>The range <span aria-hidden="true">⌄</span></button>
 <div id="truck-menu-panel" className="truck-menu-panel" hidden={!rangeOpen} role="group" aria-label="Truck models"><p className="eyebrow gold">Choose your truck</p>{truckCatalog.map(truck=>truck.id==='g7h'?<a key={truck.id} className="showroom-menu-model" href="/models/g7h/" aria-label="Explore SITRAK G7H showroom" onClick={event=>{if(!openShowroom){setMenu(null);setOpen(false);return}if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();setMenu(null);setOpen(false);openShowroom('g7h')}}><img src={truck.images[0].src} alt={`${truck.name} ${truck.config}`}/><span><strong>{truck.name}</strong><small>{truck.config}</small></span><span aria-hidden="true">↗</span></a>:<button type="button" key={truck.id} aria-label={`View ${truck.name} specifications`} onClick={()=>{openTruck(truck.id,window.matchMedia('(max-width:768px)').matches?toggle.current:rangeToggle.current);setMenu(null);setOpen(false)}}><img src={truck.images[0].src} alt={`${truck.name} ${truck.config}`}/><span><strong>{truck.name}</strong><small>{truck.config}</small></span><span aria-hidden="true">↗</span></button>)}<a href="/range" onClick={()=>{setMenu(null);setOpen(false)}}>All models &amp; specifications <span aria-hidden="true">↗</span></a><a href="#the-range" onClick={()=>{setMenu(null);setOpen(false)}}>View full range <span aria-hidden="true">↓</span></a></div>
 </div>
 <span className="header-enquiry" onClick={()=>setOpen(false)}><EnquiryButton/></span></nav></div></header>;
}

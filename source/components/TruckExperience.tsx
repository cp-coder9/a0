'use client';
import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import dynamic from 'next/dynamic';
import {findTruck} from '../lib/truck-catalog';
import {PhoneNumber} from './PhoneNumber';
import {useEnquiry} from './Enquiry';
import {TruckReferenceViewer} from './TruckReferenceViewer';
import {TruckTechnicalDescription} from './TruckTechnicalDescription';
const TruckContext=createContext<(id:string,returnFocus?:HTMLElement|null)=>void>(()=>{});
export function useTruckDetails(){return useContext(TruckContext)}
const ShowroomContext=createContext<((id:string)=>void)|null>(null);
/** Opens the full model showroom as a popup instead of navigating to /models/<id>/. Null outside the home experience. */
export function useShowroom(){return useContext(ShowroomContext)}
const ShowroomDialog=dynamic(()=>import('./showroom/ShowroomDialog').then(m=>m.ShowroomDialog),{ssr:false});
export function TruckExperience({children}:{children:ReactNode}){
 const [active,setActive]=useState<string|null>(null);
 const [showroom,setShowroom]=useState<string|null>(null);
 const dialog=useRef<HTMLDivElement>(null),trigger=useRef<HTMLElement|null>(null);
 const enquire=useEnquiry();
 const truck=active?findTruck(active):undefined;
 function open(id:string,returnFocus?:HTMLElement|null){if(!findTruck(id))return;trigger.current=returnFocus||document.activeElement as HTMLElement;setActive(id)}
 function close(){const target=trigger.current;setActive(null);window.setTimeout(()=>target?.focus(),0)}
 useEffect(()=>{
  if(!active)return;
  const previous=document.body.style.overflow;document.body.style.overflow='hidden';
  dialog.current?.querySelector<HTMLElement>('button')?.focus();
  const key=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();close()}
   if(event.key==='Tab'){
    const elements=[...dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input,select,textarea,[tabindex="0"]')||[]];
    const first=elements[0],last=elements[elements.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
   }
  };
  document.addEventListener('keydown',key);
  return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',key)};
 },[active]);
 return <ShowroomContext.Provider value={setShowroom}><TruckContext.Provider value={open}><div className="site-shell" inert={!!truck}>{children}</div>{truck&&<div className="truck-spec-backdrop" onClick={event=>{if(event.target===event.currentTarget)close()}}><div className="truck-spec-modal" ref={dialog} role="dialog" aria-modal="true" aria-labelledby="truck-spec-title"><button className="dialog-close" onClick={close} aria-label="Close truck specifications">×</button><div className="truck-spec-top"><p className="eyebrow gold">The range · Technical specifications</p><h2 id="truck-spec-title" aria-label={`${truck.name} technical specifications`}>{truck.name}<span className="sr-only"> technical specifications</span></h2><p>{truck.config}</p></div><div className="truck-spec-layout"><div className="truck-spec-photo"><TruckReferenceViewer key={truck.id} truck={truck}/></div><div className="truck-spec-detail"><TruckTechnicalDescription truck={truck}/></div></div><div className="truck-spec-actions"><button className="button primary lg" aria-label={`Enquire now about ${truck.name}`} onClick={()=>{setActive(null);enquire(truck.model,trigger.current)}}>Enquire now <span aria-hidden="true">→</span></button><a className="button ghost" href="tel:0820748725"><PhoneNumber call/></a></div></div></div>}</TruckContext.Provider>{showroom&&<ShowroomDialog truckId={showroom} onClose={()=>setShowroom(null)}/>}</ShowroomContext.Provider>;
}

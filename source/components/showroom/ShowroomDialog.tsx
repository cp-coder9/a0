'use client';
import {useEffect,useRef} from 'react';
import {findTruck} from '../../lib/truck-catalog';
import {rangeModelById} from '../../lib/truck-range';
import {TruckShowroom} from './TruckShowroom';
import './showroom.css';

/** Full-screen popup that replaces navigating to /models/<id>/ from the range cards and header menu. */
export function ShowroomDialog({truckId,onClose}:{truckId:string|null;onClose:()=>void}){
 const panel=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!truckId)return;
  const previous=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const focusTimer=window.setTimeout(()=>panel.current?.querySelector<HTMLElement>('button')?.focus(),0);
  const key=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();onClose();return}
   if(event.key==='Tab'){
    const elements=[...panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input,select,textarea,[tabindex="0"]')||[]];
    if(!elements.length)return;
    const first=elements[0],last=elements[elements.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
   }
  };
  document.addEventListener('keydown',key);
  return ()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',key);window.clearTimeout(focusTimer)};
 },[truckId,onClose]);
 const truckName=truckId?(findTruck(truckId)?.name??rangeModelById(truckId)?.name):undefined;
 if(!truckId||!truckName)return null;
 return <div className="showroom-dialog-backdrop" onClick={event=>{if(event.target===event.currentTarget)onClose()}}>
  <div className="showroom-dialog" role="dialog" aria-modal="true" aria-labelledby="showroom-dialog-title" ref={panel}>
   <div className="showroom-dialog-bar">
    <p className="eyebrow gold" id="showroom-dialog-title">The range · {truckName} showroom</p>
    <button type="button" className="showroom-dialog-close" onClick={onClose} aria-label={`Close ${truckName} showroom`}>Close ×</button>
   </div>
   <div className="showroom-dialog-scroll"><TruckShowroom truckId={truckId} embedded/></div>
  </div>
 </div>;
}

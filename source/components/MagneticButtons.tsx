'use client';
import {useEffect} from 'react';
import './editorial.css';

/** Small magnetic pull on primary CTAs (desktop, motion-safe). Falls back to no movement. */
export function MagneticButtons(){
 useEffect(()=>{
  const fine=window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!fine||reduced)return;
  const buttons=[...document.querySelectorAll<HTMLElement>('a.button, button.button')];
  const cleanups:Array<()=>void>=[];
  for(const button of buttons){
   const move=(event:PointerEvent)=>{
    const rect=button.getBoundingClientRect();
    const x=(event.clientX-rect.left)/rect.width-0.5;
    const y=(event.clientY-rect.top)/rect.height-0.5;
    button.style.transform=`translate(${(x*7).toFixed(2)}px, ${(y*5).toFixed(2)}px)`;
   };
   const reset=()=>{button.style.transform=''};
   button.classList.add('is-magnetic');
   button.addEventListener('pointermove',move);
   button.addEventListener('pointerleave',reset);
   button.addEventListener('blur',reset);
   cleanups.push(()=>{
    button.classList.remove('is-magnetic');
    button.removeEventListener('pointermove',move);
    button.removeEventListener('pointerleave',reset);
    button.removeEventListener('blur',reset);
    button.style.transform='';
   });
  }
  return()=>cleanups.forEach(fn=>fn());
 },[]);
 return null;
}

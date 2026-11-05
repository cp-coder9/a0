'use client';
import {useEffect,useRef} from 'react';
import './mouse-truck.css';

/** Small truck that trails the pointer. Desktop only; disabled for reduced motion and touch. */
export function MouseTruck(){
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const el=ref.current;
  if(!el)return;
  if(window.matchMedia('(hover: none)').matches||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  let x=0,y=0,targetX=0,targetY=0,visible=false,frame=0,lastX=0,facing=1;
  const move=(event:MouseEvent)=>{
   targetX=event.clientX;targetY=event.clientY;
   if(!visible){visible=true;x=targetX;y=targetY;lastX=targetX;el.dataset.visible='true'}
   if(Math.abs(targetX-lastX)>3){facing=targetX<lastX?-1:1;lastX=targetX}
  };
  const leave=()=>{visible=false;el.dataset.visible='false'};
  const tick=()=>{
   x+=(targetX-x)*0.16;y+=(targetY-y)*0.16;
   const velocity=Math.min(8,Math.abs(targetX-x));
   el.style.transform=`translate3d(${x}px, ${y}px, 0)`;
   el.style.setProperty('--truck-lean', `${facing*(4+velocity)}deg`);
   el.style.setProperty('--truck-flip', String(facing));
   frame=requestAnimationFrame(tick);
  };
  window.addEventListener('mousemove',move,{passive:true});
  document.addEventListener('mouseleave',leave);
  frame=requestAnimationFrame(tick);
  return ()=>{window.removeEventListener('mousemove',move);document.removeEventListener('mouseleave',leave);cancelAnimationFrame(frame)};
 },[]);
 return <div className="mouse-truck" ref={ref} aria-hidden="true">
  <svg viewBox="0 0 40 20" role="presentation" focusable="false">
   <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 15V8h13l4-5h7v12"/>
    <path d="M26 3h7l5 6v6"/>
    <circle cx="9" cy="16" r="2.6"/>
    <circle cx="22" cy="16" r="2.6"/>
    <circle cx="33" cy="16" r="2.6"/>
   </g>
  </svg>
 </div>;
}

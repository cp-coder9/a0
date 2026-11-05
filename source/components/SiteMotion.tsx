'use client';
import {useEffect} from 'react';

/** Native scrolling, with one paint-synchronised update and one-shot reveals. */
export function SiteMotion(){
  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    if(media.matches||!('IntersectionObserver' in window))return;
    const nodes=[...document.querySelectorAll<HTMLElement>('main section:not(#top) .section-header, main .card, main .truck-card, main .spec-table, #the-proof h2, #the-proof > div > div:first-child')];
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}
    },{threshold:.08,rootMargin:'0px 0px -30px 0px'});
    nodes.forEach(node=>{node.classList.add('reveal');observer.observe(node)});
    let frame=0;
    const hero=document.getElementById('top');
    const paint=()=>{
      frame=0;
      const total=document.documentElement.scrollHeight-innerHeight;
      document.documentElement.style.setProperty('--scroll-progress',`${total>0?scrollY/total:0}`);
      if(hero)hero.style.setProperty('--hero-shift',`${!media.matches&&innerWidth>768?Math.min(scrollY*.15,120):0}px`);
    };
    const scroll=()=>{if(!frame)frame=requestAnimationFrame(paint)};
    window.addEventListener('scroll',scroll,{passive:true});
    window.addEventListener('resize',scroll,{passive:true});
    const reduce=()=>{if(media.matches){nodes.forEach(node=>node.classList.add('is-visible'));hero?.style.setProperty('--hero-shift','0px')}};
    media.addEventListener('change',reduce);
    return()=>{observer.disconnect();cancelAnimationFrame(frame);window.removeEventListener('scroll',scroll);window.removeEventListener('resize',scroll);media.removeEventListener('change',reduce);nodes.forEach(node=>node.classList.remove('reveal','is-visible'))};
  },[]);
  return null;
}

'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {officialSocialLinks,officialWhatsAppContacts} from './official-links';
import './floating-socials.css';
export const socialLinks=officialSocialLinks;
type Platform='facebook'|'instagram'|'tiktok';
const icons:Record<Platform,ReactNode>={
 facebook:<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14 21v-8h2.7l.4-3H14V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9a21 21 0 0 0-2.5-.2c-2.5 0-4.2 1.5-4.2 4.3v2H8v3h2.6v8H14Z"/></svg>,
 instagram:<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3.8" y="3.8" width="16.4" height="16.4" rx="4.8"/><circle cx="12" cy="12" r="4"/><circle cx="17.1" cy="6.9" r=".8" fill="currentColor" stroke="none"/></svg>,
 tiktok:<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14 3h3a5.6 5.6 0 0 0 4 4v3a9 9 0 0 1-4-1.2v7a5.5 5.5 0 1 1-5.5-5.5h.8v3.1h-.8a2.4 2.4 0 1 0 2.5 2.4V3Z"/></svg>,
};
const whatsappIcon=<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.5L3.5 20.5l1.3-4.3a8.5 8.5 0 1 1 15.7-4.5Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path fill="currentColor" d="M8.1 7.4c.2-.2.5-.3.7-.2l.7.1c.2 0 .3.2.4.4l.7 1.7c.1.3 0 .5-.2.7l-.6.7c-.2.2-.1.4 0 .6a8.4 8.4 0 0 0 3.1 2.7c.3.1.5.1.7-.1l.8-1c.2-.2.4-.3.7-.1l1.7.8c.3.1.4.3.4.5 0 .7-.3 1.4-.8 1.8-.6.4-1.4.5-2.1.3-1.4-.4-3-1.3-4.5-2.7-1.3-1.3-2.2-2.8-2.4-3.9-.2-1 .1-1.8.7-2.3Z"/></svg>;
const labels:Record<Platform,string>={facebook:'Facebook',instagram:'Instagram',tiktok:'TikTok'};
/** Floating rail. WhatsApp is a disclosure because there are two official numbers. */
export function FloatingSocialLinks(){
 const [open,setOpen]=useState(false);
 const wrap=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  if(!open)return;
  const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();setOpen(false);trigger.current?.focus()}};
  const onPointer=(event:PointerEvent)=>{if(!wrap.current?.contains(event.target as Node))setOpen(false)};
  document.addEventListener('keydown',onKey);document.addEventListener('pointerdown',onPointer);
  return()=>{document.removeEventListener('keydown',onKey);document.removeEventListener('pointerdown',onPointer)};
 },[open]);
 return <nav className="floating-socials" aria-label="Social media">
  {(Object.keys(labels) as Platform[]).map(platform=><a key={platform} className={`floating-social floating-social--${platform}`} href={socialLinks[platform]} aria-label={labels[platform]} target="_blank" rel="noopener noreferrer" title={labels[platform]}>{icons[platform]}<span className="floating-social-tooltip" aria-hidden="true">{labels[platform]}</span></a>)}
  <div className="floating-whatsapp" ref={wrap}>
   <button type="button" ref={trigger} className="floating-social floating-social--whatsapp" aria-expanded={open} aria-controls="whatsapp-contacts" aria-label="WhatsApp contact numbers" title="WhatsApp" onClick={()=>setOpen(value=>!value)}>{whatsappIcon}<span className="floating-social-tooltip" aria-hidden="true">WhatsApp</span></button>
   <div className="floating-whatsapp-panel" id="whatsapp-contacts" hidden={!open}>
    <p className="floating-whatsapp-title">WhatsApp us</p>
    {officialWhatsAppContacts.map(contact=><a key={contact.international} className="floating-whatsapp-number" href={contact.href} aria-label={contact.label} target="_blank" rel="noopener noreferrer">{contact.display}</a>)}
   </div>
  </div>
 </nav>;
}

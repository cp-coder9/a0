import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,it,expect} from 'vitest';
import {FloatingSocialLinks} from './FloatingSocialLinks';
import {whatsAppContacts} from './contact-register';
import {Header} from '../Header';
import {renderToStaticMarkup} from 'react-dom/server';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
afterEach(cleanup);
const destinations={Facebook:'https://www.facebook.com/trukafrik',Instagram:'https://www.instagram.com/trukafrik',TikTok:'https://www.tiktok.com/@truk.afrik'};
it('renders three verified social destinations plus both WhatsApp numbers without pending links',()=>{
 render(<FloatingSocialLinks/>);const nav=screen.getByRole('navigation',{name:'Social media'});
 expect(screen.queryAllByRole('link')).toHaveLength(3);
 for(const[name,url]of Object.entries(destinations)){
  const link=screen.getByRole('link',{name});
  expect(link).toHaveAttribute('href',url);expect(link).not.toHaveAttribute('aria-disabled');
  expect(link).toHaveAttribute('target','_blank');expect(link).toHaveAttribute('rel','noopener noreferrer');
  expect(link.querySelector('svg')).toHaveAttribute('aria-hidden','true');
 }
 fireEvent.click(screen.getByRole('button',{name:'WhatsApp contact numbers'}));
 expect(screen.getAllByRole('link')).toHaveLength(5);
 for(const number of whatsAppContacts){
  const link=screen.getByRole('link',{name:number.label});
  expect(link).toHaveAttribute('href',number.href);expect(link).not.toHaveAttribute('aria-disabled');
  expect(link).toHaveAttribute('target','_blank');expect(link).toHaveAttribute('rel','noopener noreferrer');
  expect(link.textContent).toBe(number.display);
 }
 expect(nav.textContent).not.toMatch(/pending/i);expect(nav.querySelector('a[href="#"]')).toBeNull();
});
it('moves company information out of the range menu and drops the redundant website link',()=>{
 render(<><Header/><FloatingSocialLinks/></>);
 fireEvent.click(screen.getByRole('button',{name:/^The range/}));
 expect(screen.queryByRole('group',{name:'Company information'})).toBeNull();
 expect(screen.queryByRole('link',{name:'Company website'})).toBeNull();
 expect(screen.getByRole('navigation',{name:'Social media'})).toBeTruthy();
});
it('emits an explicitly labelled offline component fixture when requested',()=>{
 const directory=process.env.SOCIAL_FIXTURE_DIR;if(!directory)return;
 mkdirSync(directory,{recursive:true});
 const css=['app/tokens.css','app/globals.css','app/motion.css','app/truck-experience.css','components/site-brand.css','components/showroom/showroom.css','components/showroom/floating-socials.css','components/showroom/official-company-links.css'].map(p=>readFileSync(p,'utf8')).join('\n');
 const markup=renderToStaticMarkup(<><Header/><FloatingSocialLinks/></>);
 const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Official links — isolated component fixture</title><style>'+css+'</style><style>body{min-height:100vh;background:#10243b;color:white}.fixture-notice{position:absolute;top:110px;left:24px;max-width:60%;font:14px/1.6 Arial}.fixture-cta{position:fixed;bottom:0;left:0;right:0;height:80px;background:#071320;display:grid;place-items:center;border-top:1px solid #d7af5c}</style></head><body>'+markup+'<main class="fixture-notice"><h1>Official links</h1><p>Isolated SSR component/CSS fixture. Not a live Next.js route or full application QA.</p></main><div class="fixture-cta" data-testid="fixture-mobile-cta">Synthetic 80px bottom-CTA obstacle</div><script>window.linkIntents=[];document.addEventListener("click",e=>{const a=e.target.closest("a");if(a){e.preventDefault();window.linkIntents.push(a.href)}});</script></body></html>';
 writeFileSync(directory+'/fixture.html',html.replaceAll('src="/','src="file:///E:/Sitrak-website/public/').replaceAll('href="/assets/','href="file:///E:/Sitrak-website/public/assets/').replaceAll('href="/intro/','href="file:///E:/Sitrak-website/public/intro/'));expect(html).not.toContain('href="#"');
});

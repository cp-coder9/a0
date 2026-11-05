import {render,screen,cleanup,fireEvent} from '@testing-library/react';
import {afterEach,it,expect} from 'vitest';
import {FloatingSocialLinks} from './FloatingSocialLinks';
import {renderToStaticMarkup} from 'react-dom/server';
import G7HPage from '../../app/models/g7h/page';
import {whatsAppContacts} from './contact-register';
const [waOne,waTwo]=whatsAppContacts;
it('keeps the preserved social feature on the direct G7H route',()=>{
 const html=renderToStaticMarkup(<G7HPage/>);
 expect(html).toContain('aria-label="Social media"');
 expect(html).toContain(waOne.href);
 expect(html).toContain(waTwo.href);
});
afterEach(cleanup);
it('preserves Facebook, Instagram and TikTok with safe external navigation',()=>{
 render(<FloatingSocialLinks/>);
 const nav=screen.getByRole('navigation',{name:'Social media'});
 for(const[name,href]of [['Facebook','https://www.facebook.com/trukafrik'],['Instagram','https://www.instagram.com/trukafrik'],['TikTok','https://www.tiktok.com/@truk.afrik']]){
  const link=screen.getByRole('link',{name});
  expect(link).toHaveAttribute('href',href);
  expect(link).not.toHaveAttribute('aria-disabled');
  expect(link).toHaveAttribute('target','_blank');
  expect(link).toHaveAttribute('rel','noopener noreferrer');
  expect(link.querySelector('svg')).toHaveAttribute('aria-hidden','true');
 }
 expect(screen.queryAllByRole('link')).toHaveLength(3);
});
it('exposes both official WhatsApp numbers through the floating disclosure',()=>{
 render(<FloatingSocialLinks/>);
 const trigger=screen.getByRole('button',{name:'WhatsApp contact numbers'});
 expect(trigger).toHaveAttribute('aria-expanded','false');
 expect(trigger).toHaveAttribute('aria-controls','whatsapp-contacts');
 expect(trigger.querySelector('svg')).toHaveAttribute('aria-hidden','true');
 fireEvent.click(trigger);
 expect(trigger).toHaveAttribute('aria-expanded','true');
 const first=screen.getByRole('link',{name:waOne.label});
 const second=screen.getByRole('link',{name:waTwo.label});
 expect(first).toHaveAttribute('href',waOne.href);
 expect(second).toHaveAttribute('href',waTwo.href);
 for(const [link,row] of [[first,waOne],[second,waTwo]] as const){
  expect(link).toHaveAttribute('target','_blank');
  expect(link).toHaveAttribute('rel','noopener noreferrer');
  expect(link.textContent).toBe(row.display);
  expect(link.getAttribute('aria-label')).toBe(row.label);
  expect(link.getAttribute('href')).not.toContain('text=');
 }
 expect(screen.getAllByRole('link')).toHaveLength(5);
 fireEvent.keyDown(document,{key:'Escape'});
 expect(trigger).toHaveAttribute('aria-expanded','false');
 expect(trigger).toHaveFocus();
 expect(screen.queryAllByRole('link')).toHaveLength(3);
});

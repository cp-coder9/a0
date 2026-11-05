import {it,expect} from 'vitest';
import {contactRegister,whatsAppContacts,toInternational,CONTACT_REGISTER_ADDED_ON} from './contact-register';
const digits=(value:string)=>value.replace(/[^0-9]/g,'');
it('registers exactly three dated contact rows with unique ids',()=>{
 expect(contactRegister).toHaveLength(3);
 const ids=new Set(contactRegister.map(row=>row.id));
 expect(ids.size).toBe(3);
 for(const row of contactRegister){
  expect(row.id.length).toBeGreaterThan(0);
  expect(row.addedOn).toBe(CONTACT_REGISTER_ADDED_ON);
  expect(row.addedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(row.label).toContain(row.display);
  expect(row.source.length).toBeGreaterThan(0);
 }
});
it('derives every WhatsApp destination from the national number, not a hand-typed literal',()=>{
 expect(whatsAppContacts.length).toBe(2);
 for(const row of whatsAppContacts){
  const national=digits(row.display);
  expect(national).toHaveLength(10);
  expect(national.startsWith('0')).toBe(true);
  expect(row.international).toBe(toInternational(national));
  expect(row.international).toMatch(/^27\d{9}$/);
  expect(row.href).toBe(`https://wa.me/${row.international}`);
  expect(row.href).not.toContain('+');
  expect(row.href).not.toContain('text=');
 }
});
it('keeps the telephone row as tel:, not converted to WhatsApp',()=>{
 const phone=contactRegister.filter(row=>row.channel==='phone');
 expect(phone).toHaveLength(1);
 expect(digits(phone[0].href)).toBe(digits(phone[0].display));
 expect(phone[0].href.startsWith('tel:')).toBe(true);
 expect(phone[0].href.startsWith('https://wa.me')).toBe(false);
});

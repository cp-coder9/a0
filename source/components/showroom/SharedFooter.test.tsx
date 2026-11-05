import {render,screen,cleanup,within} from '@testing-library/react';
import {afterEach,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFileSync} from 'node:fs';
import {SharedFooter} from '../Primitives';
import Home from '../../app/page';
import G7HPage from '../../app/models/g7h/page';
import RootLayout from '../../app/layout';

afterEach(cleanup);
const count=(html:string,pattern:RegExp)=>(html.match(pattern)??[]).length;

it('renders exactly one shared footer on the home route',()=>{
 const html=renderToStaticMarkup(<RootLayout><Home/></RootLayout>);
 expect(count(html,/<footer\b/g)).toBe(1);
 expect(html).toContain('Mbombela');
 expect(html).toContain('Benoni');
 expect(count(html,/href="\/#the-range"/g)).toBeGreaterThanOrEqual(1);
});

it('renders the same single footer on the G7H route and drops the abbreviated route footer',()=>{
 const html=renderToStaticMarkup(<RootLayout><G7HPage/></RootLayout>);
 expect(count(html,/<footer\b/g)).toBe(1);
 expect(html).not.toContain('showroom-route-footer');
 expect(html).toContain('Mbombela');
});

it('keeps dealership contacts, pages, the legal disclaimer and intro replay in the shared footer',()=>{
 render(<SharedFooter/>);
 for(const name of['Mbombela','Benoni'])expect(screen.getAllByText(name).length).toBeGreaterThan(0);
 // Brochure download withheld until rights/download clearance is recorded (Ruth review, section D).
 expect(screen.queryByRole('link',{name:/brochure/i})).toBeNull();
 expect(screen.getByRole('link',{name:'chris@trukafrik.com'})).toHaveAttribute('href','mailto:chris@trukafrik.com');
 expect(screen.getByRole('button',{name:/Replay intro/i})).toBeTruthy();
 const pages=screen.getByRole('navigation',{name:'Dealership pages'});
 for(const [label,href] of [['About','/about'],['Finance','/finance'],['Parts','/parts'],['Pre-owned','/pre-owned'],['Privacy','/privacy-policy']]){
  expect(within(pages).getByRole('link',{name:label})).toHaveAttribute('href',href);
 }
 expect(screen.getAllByRole('link',{name:/Truk Afrik home/i})[0]).toHaveAttribute('href','/#the-range');
 expect(screen.getByRole('link',{name:/SITRAK · HOWO/})).toHaveAttribute('href','#the-range');
 const disclaimer=document.querySelector('.footer-disclaimer');
 expect(disclaimer).not.toBeNull();
 expect(disclaimer!.textContent).toContain('DISCLAIMER:');
 expect(disclaimer!.textContent).toContain('SINOTRUK accepts no responsibility or liability');
 expect(disclaimer!.textContent).toContain('Copyright 2026. All Rights Reserved.');
});

it('opens the intro automatically on each load and keeps replay',()=>{
 const layout=readFileSync('app/layout.tsx','utf8');
 expect(layout).toMatch(/<IntroSplash\s+firstVisitOnly\s+autoStart\s*>/);
 expect(layout).toMatch(/<SharedFooter\s*\/>/);
 expect(layout).toContain('<html lang="en-ZA">');
 expect(layout).toContain('export const metadata');
 expect(layout).toContain("import './globals.css'");
});

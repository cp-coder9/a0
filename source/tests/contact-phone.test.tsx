import {render,screen,cleanup} from '@testing-library/react';
import {it,expect,afterEach} from 'vitest';
import {BranchCard,Footer} from '../components/Primitives';
import {readFileSync} from 'node:fs';
afterEach(cleanup);
it('shows a two-line phone label and aligned arrow inside a single branch call link',()=>{render(<BranchCard name="Mbombela" region="Mpumalanga" role="Head office" description="Sales" phone="Call 0820SITRAK"/>);const link=screen.getByRole('link',{name:/Call 0820SITRAK/});expect(link).toHaveAttribute('href','tel:0820748725');expect(link.querySelector('.phone-number')).toHaveTextContent('(082 074 8725)');expect(link.querySelector('.phone-number-digits')).toHaveTextContent('(082 074 8725)');expect(link.querySelector('.phone-number-arrow')).toHaveAttribute('aria-hidden','true');expect(link.querySelector('a')).toBeNull()});
it('keeps the footer contact actionable without local-demo wording',()=>{render(<Footer/>);expect(screen.getByRole('link',{name:/Call 0820SITRAK/})).toHaveTextContent('(082 074 8725)');expect(screen.getByRole('link',{name:'chris@trukafrik.com'})).toHaveAttribute('href','mailto:chris@trukafrik.com');expect(screen.queryByText(/local demo|not emailed/i)).toBeNull()});
it('uses the shared phone label at homepage and truck-detail call sites',()=>{for(const file of ['app/page.tsx','components/TruckExperience.tsx']){const source=readFileSync(file,'utf8');expect(source).toContain('<PhoneNumber');expect(source).not.toMatch(/>Call 0820SITRAK</);expect(source).toContain('tel:0820748725')}});

import {render,screen,fireEvent,cleanup,act} from '@testing-library/react';
import {it,expect,afterEach,beforeEach,vi} from 'vitest';
import {Hero} from '../components/Hero';
import {EnquiryExperience} from '../components/Enquiry';
beforeEach(()=>{vi.useFakeTimers();vi.stubGlobal('matchMedia',()=>({matches:true,addEventListener:vi.fn(),removeEventListener:vi.fn()}))});
afterEach(()=>{cleanup();vi.useRealTimers();vi.unstubAllGlobals()});
it('exposes the published HOWO MAX specifications and wraps without losing context',()=>{render(<EnquiryExperience><Hero/></EnquiryExperience>);fireEvent.click(screen.getByRole('button',{name:'Show HOWO MAX'}));expect(screen.getByRole('button',{name:'Show HOWO MAX'}).getAttribute('aria-pressed')).toBe('true');for(const label of ['480 hp — Rated power','6×4 — Configuration','AMT — Transmission','Long haul — Application'])expect(screen.getByLabelText(label)).toBeTruthy();fireEvent.keyDown(screen.getByRole('region'),{key:'ArrowRight'});expect(screen.getByRole('button',{name:'Show HOWO TX 64330'}).getAttribute('aria-pressed')).toBe('true')});
it('never auto-rotates for reduced motion',()=>{render(<EnquiryExperience><Hero/></EnquiryExperience>);act(()=>vi.advanceTimersByTime(21000));expect(screen.getByRole('button',{name:'Show SITRAK G7H'}).getAttribute('aria-pressed')).toBe('true');expect(screen.queryByRole('button',{name:'Pause truck slideshow'})).toBeNull()});

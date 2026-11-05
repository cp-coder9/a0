import {render,screen,fireEvent,act,cleanup} from '@testing-library/react';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {IntroSplash} from '../components/intro/IntroSplash';

it('default landing content has no intro gate, scroll lock or completion marker',async()=>{
 render(<IntroSplash><main>Actual landing page</main></IntroSplash>);
 await act(async()=>{await Promise.resolve()});act(()=>vi.advanceTimersByTime(6000));
 expect(screen.queryByRole('dialog')).toBeNull();
 expect(screen.getByText('Actual landing page').parentElement).not.toHaveAttribute('inert');
 expect(document.body.style.overflow).toBe('');
 expect(document.documentElement.dataset.trukIntro).toBeUndefined();
 expect(sessionStorage.getItem('truk-afrik:intro:v1')).toBeNull();
});
it('explicit replay bypasses seen state and Escape restores landing access and trigger focus',async()=>{
 sessionStorage.setItem('truk-afrik:intro:v1','1');
 render(<IntroSplash><button onClick={()=>window.dispatchEvent(new Event('trukafrik:intro-replay'))}>Replay introduction</button><main>Actual landing page</main></IntroSplash>);
 await act(async()=>{await Promise.resolve()});expect(screen.queryByRole('dialog')).toBeNull();
 const trigger=screen.getByRole('button',{name:'Replay introduction'});trigger.focus();
 fireEvent.click(trigger);await act(async()=>{await Promise.resolve()});
 expect(screen.getByRole('dialog')).toHaveAttribute('data-phase','launch');
 expect(screen.getByText('Actual landing page').parentElement).toHaveAttribute('inert');
 expect(document.body.style.overflow).toBe('hidden');
 fireEvent.keyDown(document,{key:'Escape'});act(()=>vi.advanceTimersByTime(0));
 expect(screen.queryByRole('dialog')).toBeNull();
 expect(screen.getByText('Actual landing page').parentElement).not.toHaveAttribute('inert');
 expect(document.documentElement.dataset.trukIntro).toBeUndefined();
 expect(document.body.style.overflow).toBe('');expect(trigger).toHaveFocus();
});
it('reduced-motion replay starts at tagline and releases content without the impact timeline',async()=>{
 vi.stubGlobal('matchMedia',()=>({matches:true,addEventListener:vi.fn(),removeEventListener:vi.fn()}));
 render(<IntroSplash><main>Actual landing page</main></IntroSplash>);
 await act(async()=>{await Promise.resolve()});expect(screen.queryByRole('dialog')).toBeNull();
 act(()=>window.dispatchEvent(new Event('trukafrik:intro-replay')));await act(async()=>{await Promise.resolve()});
 expect(screen.getByRole('dialog')).toHaveAttribute('data-reduced','true');
 expect(screen.getByRole('dialog')).toHaveAttribute('data-phase','tagline');
 act(()=>vi.advanceTimersByTime(900));
 expect(screen.queryByRole('dialog')).toBeNull();
 expect(screen.getByText('Actual landing page').parentElement).not.toHaveAttribute('inert');
 expect(document.body.style.overflow).toBe('');
 expect(document.documentElement.dataset.trukIntro).toBeUndefined();
});

beforeEach(()=>{vi.useFakeTimers();sessionStorage.clear();vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}));vi.stubGlobal('Image',class{src='';decode(){return Promise.resolve()}})});
afterEach(()=>{cleanup();vi.useRealTimers();vi.unstubAllGlobals();delete document.documentElement.dataset.trukIntro});
it('animates the logo, reveals the tagline and releases the actual landing content',async()=>{render(<IntroSplash autoStart><main>Actual landing page</main></IntroSplash>);await act(async()=>{await Promise.resolve()});expect(screen.getByRole('dialog')).toHaveAttribute('data-phase','launch');expect(screen.getByText('Actual landing page').parentElement).toHaveAttribute('inert');act(()=>vi.advanceTimersByTime(1150));expect(screen.getByRole('dialog')).toHaveAttribute('data-phase','impact');act(()=>vi.advanceTimersByTime(650));expect(screen.getByRole('dialog')).toHaveAttribute('data-phase','tagline');act(()=>vi.advanceTimersByTime(2700));expect(screen.queryByRole('dialog')).toBeNull();expect(document.body.style.overflow).toBe('');expect(sessionStorage.getItem('truk-afrik:intro:v1')).toBe('1')});
it('skip immediately releases the page',async()=>{render(<IntroSplash autoStart><main>Actual landing page</main></IntroSplash>);await act(async()=>{await Promise.resolve()});fireEvent.click(screen.getByRole('button',{name:/Skip intro/}));expect(screen.queryByRole('dialog')).toBeNull();expect(document.documentElement.dataset.trukIntro).toBeUndefined()});
it('does not replay after completion in the same tab',async()=>{sessionStorage.setItem('truk-afrik:intro:v1','1');render(<IntroSplash autoStart><main>Actual landing page</main></IntroSplash>);await act(async()=>{await Promise.resolve()});expect(screen.queryByRole('dialog')).toBeNull();expect(document.documentElement.dataset.trukIntro).toBeUndefined()});

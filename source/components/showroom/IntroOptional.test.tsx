import {render,screen,act,fireEvent} from '@testing-library/react';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {IntroSplash} from '../intro/IntroSplash';
beforeEach(()=>{vi.useFakeTimers();sessionStorage.clear();vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}));vi.stubGlobal('Image',class{src='';decode(){return Promise.resolve()}})});
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();delete document.documentElement.dataset.trukIntro});
it('never gates initial content and only plays after an explicit replay request',async()=>{
 render(<IntroSplash><main>Immediate truck range</main></IntroSplash>);
 await act(async()=>{await Promise.resolve()});
 expect(screen.queryByRole('dialog')).toBeNull();
 expect(screen.getByText('Immediate truck range').parentElement).not.toHaveAttribute('inert');
 act(()=>window.dispatchEvent(new Event('trukafrik:intro-replay')));
 await act(async()=>{await Promise.resolve()});
 expect(screen.getByRole('dialog')).toBeVisible();
 fireEvent.click(screen.getByRole('button',{name:/Skip intro/}));
 expect(screen.queryByRole('dialog')).toBeNull();
 expect(document.body.style.overflow).toBe('');
});

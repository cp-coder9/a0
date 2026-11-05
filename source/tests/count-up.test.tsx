import {render,screen,act,cleanup} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {CountUp} from '../components/CountUp';
let enter: (entries: {isIntersecting:boolean}[])=>void;
afterEach(()=>{cleanup();vi.unstubAllGlobals()});
function setup(reduced=false){vi.stubGlobal('matchMedia',()=>({matches:reduced,addEventListener:vi.fn(),removeEventListener:vi.fn()}));vi.stubGlobal('IntersectionObserver',class{constructor(cb:typeof enter){enter=cb}observe(){}unobserve(){}disconnect(){}})}
it('counts only when visible and settles on the exact specification',()=>{setup();const frames:FrameRequestCallback[]=[];vi.stubGlobal('requestAnimationFrame',(cb:FrameRequestCallback)=>{frames.push(cb);return frames.length});vi.stubGlobal('cancelAnimationFrame',vi.fn());render(<CountUp value={480}/>);const number=screen.getByTestId('count-up');expect(number.textContent).toBe('0');act(()=>enter([{isIntersecting:false}]));expect(frames).toHaveLength(0);act(()=>enter([{isIntersecting:true}]));act(()=>frames.shift()!(0));act(()=>frames.shift()!(600));expect(Number(number.textContent)).toBeGreaterThan(0);expect(Number(number.textContent)).toBeLessThan(480);act(()=>frames.shift()!(1800));expect(number.textContent).toBe('480')});
it('shows the final value immediately for reduced motion',()=>{setup(true);render(<CountUp value={2300}/>);expect(screen.getByTestId('count-up').textContent).toBe('2300')});

import {render,screen,fireEvent,cleanup,act} from '@testing-library/react';
import {expect,it,vi,afterEach} from 'vitest';
import {TruckGallery} from '../components/TruckGallery';
import {truckCatalog} from '../lib/truck-catalog';
afterEach(()=>{cleanup();vi.useRealTimers();vi.unstubAllGlobals()});
it('cycles visible gallery images and opens specs when the image is clicked',()=>{vi.useFakeTimers();vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}));let enter:(entries:{isIntersecting:boolean}[])=>void=()=>{};vi.stubGlobal('IntersectionObserver',class{constructor(cb:typeof enter){enter=cb}observe(){}disconnect(){}});const inspect=vi.fn();render(<TruckGallery truck={truckCatalog[0]} onInspect={inspect}/>);act(()=>enter([{isIntersecting:true}]));act(()=>vi.advanceTimersByTime(4600));expect(screen.getByRole('img',{name:/Alternative supplied view/})).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'View SITRAK G7H technical specifications'}));expect(inspect).toHaveBeenCalledOnce()});

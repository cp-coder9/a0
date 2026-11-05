import {render,screen,fireEvent} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {CabinPanorama} from '../CabinPanorama';
import {TruckIllustration} from '../TruckIllustration';
import {TruckReferenceViewer} from '../TruckReferenceViewer';
import {findTruck} from '../../lib/truck-catalog';
vi.mock('three/webgpu',()=>({WebGPURenderer:class{constructor(){throw new Error('Explicit unit noGPU boundary');}}}));
vi.mock('next/dynamic',()=>({default:()=>()=> <div>3D view</div>}));
beforeEach(()=>vi.stubGlobal('matchMedia',()=>({matches:true,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
function copy(container:HTMLElement){return [container.textContent,...[...container.querySelectorAll('*')].flatMap(e=>['aria-label','aria-description','title'].map(a=>e.getAttribute(a)||''))].join(' ');}
const banned=/reference|illustrat|approximat|unverified|not verified|no verified|not (?:an? )?(?:exact|actual)/i;
it('uses neutral panorama copy and preserves keyboard help',()=>{
 const{container}=render(<CabinPanorama src="/test-fixture.jpg"/>);expect(copy(container)).not.toMatch(banned);
 expect(screen.getByText(/Click and drag.*arrow keys/)).toBeVisible();
});
it('uses neutral 3D visual and accessibility labels without deleting service safety',()=>{
 const{container}=render(<TruckIllustration id="howo-max"/>);expect(copy(container)).not.toMatch(banned);
 expect(screen.getByText(/not service instructions/)).toBeVisible();
 expect(screen.getByRole('region',{name:'Interactive 3D view'})).toBeVisible();
});
it('does not offer the known tractor tour as the HOWO Tapa tipper cabin',()=>{
 render(<TruckReferenceViewer truck={findTruck('howo-tapa')!}/>);
 expect(screen.queryByRole('tab',{name:'Manufacturer tour'})).toBeNull();
 fireEvent.click(screen.getByRole('tab',{name:'Cabin'}));
 expect(screen.getByText('Cabin view is unavailable for this model.')).toBeVisible();
 expect(document.querySelector('iframe')).toBeNull();
});
it('uses neutral MAX photo titles, badges and labels while retaining its cockpit controls',()=>{
 const{container}=render(<TruckReferenceViewer truck={findTruck('howo-max')!}/>);
 fireEvent.click(screen.getByRole('tab',{name:'Cockpit photo'}));expect(copy(container)).not.toMatch(banned);
 expect(screen.getByRole('button',{name:'Zoom in'})).toBeVisible();
 expect(screen.getByRole('img',{name:'HOWO MAX cockpit'})).toHaveAttribute('src','/assets/references/howo-max-cockpit.webp');
});

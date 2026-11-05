import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,it,expect,vi} from 'vitest';
// Mock only the optional 3D handoff boundary; real photo/panorama and route state remain.
vi.mock('next/dynamic',()=>({default:()=>({id,onViewCockpit}:{id:string;onViewCockpit:()=>void})=><button onClick={onViewCockpit}>View cabin {id}</button>}));
import {TruckReferenceViewer} from '../components/TruckReferenceViewer';
import {findTruck} from '../lib/truck-catalog';
beforeEach(()=>vi.stubGlobal('fetch',vi.fn(()=>{throw new Error('Unexpected request in no-send component test');})));
afterEach(()=>{cleanup();vi.unstubAllGlobals()});
it('opens the new MAX 360 panorama from its primary cockpit action without relabelling it as another model',()=>{const {container}=render(<TruckReferenceViewer truck={findTruck('howo-max')!}/>);fireEvent.click(screen.getByRole('tab',{name:'Interactive 3D'}));fireEvent.click(screen.getByText('View cabin howo-max'));const view=screen.getByRole('region',{name:'Interactive HOWO MAX cabin panorama'});expect(screen.getByRole('img',{name:'HOWO MAX cabin panorama'})).toHaveAttribute('src','/assets/panoramas/howo-max-cabin-360.jpg');expect(container.querySelector('iframe')).toBeNull();fireEvent.keyDown(view,{key:'ArrowRight'});expect(view).toHaveAttribute('data-yaw','15');fireEvent.click(screen.getByRole('button',{name:'Return to 3D exterior'}));expect(screen.getByText('View cabin howo-max')).toBeTruthy();fireEvent.click(screen.getByRole('tab',{name:'Cabin panorama'}));expect(screen.getByRole('region',{name:'Interactive HOWO MAX cabin panorama'})).toBeTruthy()});
it('retains the existing MAX cockpit photo separately with neutral labels and returns to its exterior',()=>{
 const {container}=render(<TruckReferenceViewer truck={findTruck('howo-max')!}/>);
 fireEvent.click(screen.getByRole('tab',{name:'Cockpit photo'}));
 expect(screen.getByRole('img',{name:'HOWO MAX cockpit'})).toHaveAttribute('src','/assets/references/howo-max-cockpit.webp');
 expect(screen.getByText('Photo',{exact:true})).toBeVisible();expect(container.textContent).not.toMatch(/left-hand-drive reference/);
 fireEvent.click(screen.getByRole('button',{name:'Return to 3D exterior'}));
 expect(screen.getByRole('button',{name:'View cabin howo-max'})).toBeVisible();expect(fetch).not.toHaveBeenCalled();
});
it('routes HOWO Tapa cabin handoff to a neutral unavailable state without the known wrong tractor tour',()=>{
 const {container}=render(<TruckReferenceViewer truck={findTruck('howo-tapa')!}/>);
 fireEvent.click(screen.getByRole('tab',{name:'Interactive 3D'}));
 fireEvent.click(screen.getByRole('button',{name:'View cabin howo-tapa'}));
 expect(screen.getByRole('tab',{name:'Cabin'})).toHaveAttribute('aria-selected','true');
 expect(screen.getByText('Cabin view is unavailable for this model.')).toBeVisible();
 expect(screen.queryByRole('tab',{name:'Manufacturer tour'})).toBeNull();
 expect(screen.queryByRole('button',{name:'Load manufacturer tour'})).toBeNull();
 expect(container.querySelector('iframe')).toBeNull();expect(container.querySelector('a[href*="720yun"]')).toBeNull();
 expect(screen.queryByRole('region',{name:/cabin panorama/})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Return to 3D exterior'}));
 expect(screen.getByRole('button',{name:'View cabin howo-tapa'})).toBeVisible();expect(fetch).not.toHaveBeenCalled();
});
it('uses a neutral unavailable state without fabricated or cross-model media when local cabin media is missing',()=>{
 const {container}=render(<TruckReferenceViewer truck={{...findTruck('howo-max')!,id:'unverified-model'}}/>);
 fireEvent.click(screen.getByRole('tab',{name:'Interactive 3D'}));
 fireEvent.click(screen.getByRole('button',{name:'View cabin unverified-model'}));
 expect(screen.getByText('Cabin view is unavailable for this model.')).toBeVisible();
 expect(screen.queryByRole('region',{name:/cabin panorama/})).toBeNull();
 expect(container.querySelector('img[src*="/panoramas/"]')).toBeNull();expect(container.querySelector('iframe')).toBeNull();
 expect(screen.queryByRole('button',{name:'Load manufacturer tour'})).toBeNull();
 expect(screen.queryByText('Enter illustrative cockpit')).toBeNull();
 expect(fetch).not.toHaveBeenCalled();
});

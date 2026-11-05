import {act,render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,it,expect,vi} from 'vitest';
// Only the optional 3D boundary is replaced; real tab/photo/panorama UI is exercised.
vi.mock('next/dynamic',()=>({default:()=>({id,onViewCockpit}:{id:string;onViewCockpit:()=>void})=><button onClick={onViewCockpit}>View cabin {id}</button>}));
import {TruckReferenceViewer} from '../components/TruckReferenceViewer';
import {findTruck} from '../lib/truck-catalog';
afterEach(()=>{cleanup();vi.unstubAllGlobals()});
beforeEach(()=>vi.stubGlobal('fetch',vi.fn(()=>{throw new Error('Unexpected request in no-send component test');})));
it('retains MAX cockpit photo/source and zoom controls with neutral public imagery copy',()=>{
 const {container}=render(<TruckReferenceViewer truck={findTruck('howo-max')!}/>);
 fireEvent.click(screen.getByRole('tab',{name:'Cockpit photo'}));
 expect(screen.getByRole('img',{name:'HOWO MAX cockpit'})).toHaveAttribute('src','/assets/references/howo-max-cockpit.webp');
 expect(screen.getByText('Photo',{exact:true})).toBeVisible();
 expect(container.textContent).not.toMatch(/left-hand-drive reference|not a 360° panorama|local steering side and trim/i);
 expect(screen.getByRole('link',{name:/Source: SINOTRUK/})).toHaveAttribute('rel','noopener noreferrer');
 fireEvent.click(screen.getByRole('button',{name:'Zoom in'}));
 const frame=screen.getByTestId('reference-photo');expect(frame).toHaveAttribute('data-zoom','1.5');
 act(()=>frame.focus());expect(fireEvent.keyDown(frame,{key:'+'})).toBe(false);expect(frame).toHaveAttribute('data-zoom','2');
 fireEvent.click(screen.getByRole('button',{name:'Reset view'}));expect(frame).toHaveAttribute('data-zoom','1');
 expect(screen.getByRole('button',{name:'Zoom out'})).toBeDisabled();expect(fetch).not.toHaveBeenCalled();
});
it('omits the known wrong HOWO Tapa tractor tour on tabs and cabin handoff without any iframe or request',()=>{
 const {container}=render(<TruckReferenceViewer truck={findTruck('howo-tapa')!}/>);
 expect(screen.queryByRole('tab',{name:'Manufacturer tour'})).toBeNull();
 expect(screen.queryByRole('tab',{name:'Cabin panorama'})).toBeNull();
 fireEvent.click(screen.getByRole('tab',{name:'Cabin'}));
 expect(screen.getByText('Cabin view is unavailable for this model.')).toBeVisible();
 fireEvent.click(screen.getByRole('button',{name:'Return to 3D exterior'}));
 fireEvent.click(screen.getByRole('button',{name:'View cabin howo-tapa'}));
 expect(screen.getByText('Cabin view is unavailable for this model.')).toBeVisible();
 expect(container.querySelector('iframe')).toBeNull();expect(container.querySelector('a[href*="720yun"]')).toBeNull();
 expect(screen.queryByRole('button',{name:'Load manufacturer tour'})).toBeNull();
 expect(screen.queryByRole('region',{name:/cabin panorama/})).toBeNull();expect(fetch).not.toHaveBeenCalled();
});
it('keeps MAX image-error recovery and the separate engine photo usable without substituting C7H media',()=>{
 const {container}=render(<TruckReferenceViewer truck={findTruck('howo-max')!}/>);
 fireEvent.click(screen.getByRole('tab',{name:'Cockpit photo'}));
 fireEvent.error(screen.getByRole('img',{name:'HOWO MAX cockpit'}));
 expect(screen.getByText('This image is unavailable. Choose another view or open the credited source below.')).toBeVisible();
 expect(screen.queryByRole('img',{name:'HOWO MAX cockpit'})).toBeNull();
 expect(container.querySelector('img[src*="c7h-cockpit"]')).toBeNull();
 fireEvent.click(screen.getByRole('tab',{name:'Engine'}));
 expect(screen.getByRole('img',{name:'HOWO MAX engine'})).toHaveAttribute('src','/assets/references/howo-max-engine.webp');
 expect(fetch).not.toHaveBeenCalled();
});
it('retains keyboard tab navigation between MAX cockpit photo and model-matched panorama',()=>{
 render(<TruckReferenceViewer truck={findTruck('howo-max')!}/>);
 const photoTab=screen.getByRole('tab',{name:'Cockpit photo'});fireEvent.click(photoTab);act(()=>photoTab.focus());
 expect(fireEvent.keyDown(photoTab,{key:'ArrowLeft'})).toBe(false);
 expect(screen.getByRole('tab',{name:'Cabin panorama'})).toHaveAttribute('aria-selected','true');
 expect(screen.getByRole('tab',{name:'Cabin panorama'})).toHaveFocus();
 expect(screen.getByRole('img',{name:'HOWO MAX cabin panorama'})).toHaveAttribute('src','/assets/panoramas/howo-max-cabin-360.jpg');
 fireEvent.keyDown(screen.getByRole('tab',{name:'Cabin panorama'}),{key:'ArrowRight'});
 expect(photoTab).toHaveAttribute('aria-selected','true');expect(photoTab).toHaveFocus();
 expect(screen.getByRole('img',{name:'HOWO MAX cockpit'})).toBeVisible();
});

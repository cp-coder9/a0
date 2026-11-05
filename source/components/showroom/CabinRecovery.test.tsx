import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {CabinPanorama} from '../CabinPanorama';
const {mount}=vi.hoisted(()=>({mount:vi.fn()}));
vi.mock('../../lib/cabin-panorama-renderer',()=>({mountCabinPanorama:mount}));
afterEach(()=>{vi.restoreAllMocks();mount.mockReset();});
it('detects a cached broken image, reports failure once and removes the nonexistent-tab instruction',async()=>{
 vi.spyOn(HTMLImageElement.prototype,'complete','get').mockReturnValue(true);
 vi.spyOn(HTMLImageElement.prototype,'naturalWidth','get').mockReturnValue(0);
 const failure=vi.fn();render(<CabinPanorama src="/test-fixture-cabin.jpg" modelName="SITRAK C7H" onImageFailure={failure}/>);
 expect(await screen.findByRole('status')).toHaveTextContent('The cabin panorama could not load');
 expect(failure).toHaveBeenCalledTimes(1);expect(mount).not.toHaveBeenCalled();
 expect(screen.queryByText(/Cockpit photo tab/)).toBeNull();
});
it('retries a failed resource and restores the existing panorama without another vehicle',async()=>{
 const dispose=vi.fn();mount.mockReturnValue({dispose,update:vi.fn()});
 const failure=vi.fn();render(<CabinPanorama src="/test-fixture-cabin.jpg" modelName="SITRAK C7H" onImageFailure={failure}/>);
 fireEvent.error(screen.getByRole('img',{name:'SITRAK C7H cabin panorama'}));
 expect(failure).toHaveBeenCalledTimes(1);
 fireEvent.click(screen.getByRole('button',{name:'Retry cabin view'}));
 const image=screen.getByRole('img',{name:'SITRAK C7H cabin panorama'});expect(image).toHaveAttribute('src','/test-fixture-cabin.jpg');
 fireEvent.load(image);
 await waitFor(()=>expect(screen.getByRole('region',{name:'Interactive SITRAK C7H cabin panorama'})).toHaveAttribute('data-renderer','webgl-360'));
 expect(screen.queryByText(/The cabin panorama could not load/)).toBeNull();
});

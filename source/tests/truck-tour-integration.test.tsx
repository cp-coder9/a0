import {act,render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
vi.mock('three/webgpu',()=>({WebGPURenderer:class {}}));
vi.mock('../lib/truck-renderer',()=>({mountTruckRenderer:()=>({ready:Promise.resolve(),dispose:vi.fn()})}));
import {TruckIllustration} from '../components/TruckIllustration';
import {CabinPanorama} from '../components/CabinPanorama';
it('does not render the illustration disclaimer or renderer label banner',()=>{const {container}=render(<TruckIllustration id="howo-max"/>);expect(screen.queryByText(/Reference-based 3D illustration — not an exact vehicle replica/)).toBeNull();expect(container.querySelector('.illustration-disclaimer')).toBeNull();expect(screen.getByRole('button',{name:'Scene: Interior'})).toBeTruthy()});
it('keeps the interior scene when arrow keys are used on focused panorama controls',()=>{
 render(<TruckIllustration id="howo-max" cockpitPhoto={<CabinPanorama src="/assets/panoramas/sitrak-c7h-interior-panorama.jpg" modelName="SITRAK C7H"/>}/>);
 fireEvent.click(screen.getByRole('button',{name:'View cabin'}));
 const pan=screen.getByRole('button',{name:'Pan right'});act(()=>pan.focus());expect(pan).toHaveFocus();
 // Arrow keys on a native control must not leak into the outer guide scene handler.
 fireEvent.keyDown(pan,{key:'ArrowRight'});
 const panorama=screen.getByRole('region',{name:'Interactive SITRAK C7H cabin panorama'});
 expect(panorama).toBeVisible();
 expect(screen.getByRole('button',{name:'Scene: Interior'})).toHaveAttribute('aria-pressed','true');
 // The panorama surface (not its sibling controls) owns the documented arrow-pan shortcut.
 act(()=>panorama.focus());expect(panorama).toHaveFocus();
 expect(fireEvent.keyDown(panorama,{key:'ArrowRight'})).toBe(false);expect(panorama).toHaveAttribute('data-yaw','15');
 expect(screen.getByTestId('truck-3d-stage')).not.toBeVisible();
});
beforeEach(()=>{sessionStorage.clear();vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}))});
afterEach(()=>{cleanup();vi.unstubAllGlobals()});
it('keeps guide navigation while opening cabin content and returns to the last exterior scene',()=>{const callback=vi.fn();render(<TruckIllustration id="howo-max" onViewCockpit={callback} cockpitPhoto={<p>Fixture cabin content</p>}/>);fireEvent.click(screen.getByRole('button',{name:'Scene: Rear'}));fireEvent.click(screen.getByRole('button',{name:'View cabin'}));expect(screen.getByText('Fixture cabin content')).toBeTruthy();expect(screen.getByTestId('truck-3d-stage')).not.toBeVisible();expect(screen.getByRole('button',{name:'Scene: Rear'})).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Return to 3D exterior'}));expect(screen.queryByText('Fixture cabin content')).toBeNull();expect(screen.getByTestId('truck-3d-stage')).toBeVisible();expect(screen.getByRole('button',{name:'Scene: Rear'})).toHaveAttribute('aria-pressed','true');expect(callback).not.toHaveBeenCalled()});
it('preserves model-scoped scene across unmounts and provides keyboard scene navigation',()=>{const first=render(<TruckIllustration id="howo-max" cockpitPhoto={<p>Photo</p>}/>);fireEvent.click(screen.getByRole('button',{name:'Scene: Right'}));first.unmount();render(<TruckIllustration id="howo-max" cockpitPhoto={<p>Photo</p>}/>);expect(screen.getByRole('button',{name:'Scene: Right'})).toHaveAttribute('aria-pressed','true');fireEvent.keyDown(screen.getByRole('button',{name:'Next scene'}),{key:'ArrowRight'});expect(screen.getByRole('button',{name:'Scene: Rear'})).toHaveAttribute('aria-pressed','true')});
it('retains the external cockpit handoff for a truck without a verified local photo',()=>{const callback=vi.fn();render(<TruckIllustration id="howo-7" onViewCockpit={callback}/>);fireEvent.click(screen.getByRole('button',{name:'Scene: Interior'}));expect(callback).toHaveBeenCalledOnce()});

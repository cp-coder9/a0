import {render,screen,fireEvent} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {Hero} from '../Hero';
import {EnquiryExperience} from '../Enquiry';
import {heroTrucks} from '../../lib/hero-trucks';
vi.mock('../CountUp',()=>({CountUp:({value}:{value:number})=><span>{value}</span>}));
beforeEach(()=>vi.stubGlobal('matchMedia',()=>({matches:true,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
it('keeps inactive image failures scoped to their model and does not announce a failed image as pictured',()=>{
 render(<EnquiryExperience><Hero/></EnquiryExperience>);
 // g7h is active (index 0); fail the HOWO TX 64330 image (index 3) while inactive.
 fireEvent.error(document.querySelectorAll('.hero-image')[3]);
 expect(screen.queryByRole('status')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Show HOWO TX 64330'}));
 const status=screen.getByRole('status');expect(status).toHaveTextContent('HOWO TX 64330 image unavailable');
 expect(status.closest('[aria-hidden="true"]')).toBeNull();
 expect(document.querySelector('.hero-image-label')).not.toHaveTextContent('Pictured:');
 fireEvent.click(screen.getByRole('button',{name:'Show HOWO MAX'}));expect(screen.queryByRole('status')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Show HOWO TX 64330'}));expect(screen.getByRole('status')).toHaveTextContent('HOWO TX 64330 image unavailable');
});
it.each(['SITRAK G7H','SITRAK G7S','HOWO TX 64330','HOWO MAX'])('detects %s images already failed before hydration without a new error event',name=>{
 vi.spyOn(HTMLImageElement.prototype,'complete','get').mockReturnValue(true);
 vi.spyOn(HTMLImageElement.prototype,'naturalWidth','get').mockReturnValue(0);
 render(<EnquiryExperience><Hero/></EnquiryExperience>);
 fireEvent.click(screen.getByRole('button',{name:`Show ${name}`}));
 expect(screen.getByRole('status')).toHaveTextContent(`${name} image unavailable`);
 expect(document.querySelector('.hero-image-label')).not.toHaveTextContent('Pictured:');
 fireEvent.click(screen.getByRole('button',{name:/Book a test drive/}));
 const truck=heroTrucks.find(entry=>entry.name===name)!;
 expect(screen.getByRole('combobox',{name:'Truck'})).toHaveValue(truck.model);
});

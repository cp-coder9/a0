import {fireEvent,render,screen} from '@testing-library/react';
import {expect,it,vi} from 'vitest';
vi.mock('next/dynamic',()=>({default:()=>()=>null}));
import {ShowroomDiscovery} from './ShowroomDiscovery';
import {TruckShowroom} from './TruckShowroom';
import {EnquiryExperience} from '../Enquiry';

it('removes imagery disclaimer copy and the per-range confirmation note',()=>{
 render(<EnquiryExperience><ShowroomDiscovery/></EnquiryExperience>);
 expect(screen.queryByText(/Existing imagery is for reference/)).toBeNull();
 expect(screen.queryByText(/Confirm the exact model, build and specification with the dealership/)).toBeNull();
 expect(screen.getAllByRole('button',{name:/^Enquire about /}).length).toBeGreaterThan(0);
});
it('uses neutral exterior labels while preserving model enquiry and specifications navigation',()=>{
 render(<EnquiryExperience><TruckShowroom truckId="g7h"/></EnquiryExperience>);
 // The showroom opens on the 3D model; the exterior labels live on the Images view.
 fireEvent.click(screen.getByRole('link',{name:'Images'}));
 expect(screen.getByRole('img',{name:/SITRAK G7H: /})).toBeVisible();
 expect(document.querySelector('.truck-view-main')).not.toHaveTextContent(/reference|illustrati|not (an? )?(exact|actual)/i);
 expect(screen.queryByRole('button',{name:/Load 3D view/i})).toBeNull();
 expect(screen.getByRole('region',{name:'SITRAK G7H exterior images'})).toBeVisible();
 expect(screen.getByRole('button',{name:'Enquire about this SITRAK G7H'})).toBeVisible();
 expect(screen.getByRole('link',{name:'Specifications'})).toBeVisible();
});

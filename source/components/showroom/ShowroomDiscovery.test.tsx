import {render,screen} from '@testing-library/react';
import {it,expect} from 'vitest';
import {ShowroomDiscovery} from './ShowroomDiscovery';
import {EnquiryExperience} from '../Enquiry';
import {rangeModelCount} from '../../lib/truck-range';

it('renders every published bulletin truck with an enquiry action',()=>{
 render(<EnquiryExperience><ShowroomDiscovery/></EnquiryExperience>);
 expect(screen.getByRole('heading',{name:'Choose the truck for your work.',level:2})).toBeVisible();
 // Every bulletin model is shown once (the marquee duplicate is aria-hidden) with its own enquiry action.
 expect(screen.getAllByRole('button',{name:/^Enquire about /})).toHaveLength(rangeModelCount);
 expect(screen.getAllByRole('heading',{name:'SITRAK G7H 64540'})).toHaveLength(1);
 expect(screen.getAllByRole('heading',{name:'HOWO TX 84371'})).toHaveLength(1);
 expect(screen.getAllByText(/Long haul/).length).toBeGreaterThan(0);
 expect(screen.getAllByText(/Construction/).length).toBeGreaterThan(0);
});
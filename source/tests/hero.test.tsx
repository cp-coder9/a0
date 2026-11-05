import {render,screen,cleanup} from '@testing-library/react';
import {it,expect,afterEach,vi,beforeEach} from 'vitest';
beforeEach(()=>vi.stubGlobal('matchMedia',()=>({matches:true,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
afterEach(()=>vi.unstubAllGlobals());
import {Hero} from '../components/Hero';
import {EnquiryExperience} from '../components/Enquiry';
afterEach(cleanup);
it('keeps all four final specifications accessible while visual numbers animate',()=>{render(<EnquiryExperience><Hero/></EnquiryExperience>);expect(screen.getByRole('heading',{level:1}).textContent).toBe('Come drive one.');for(const label of ['480 hp — Rated power','2300 Nm — Peak torque','65 T — Gross combination mass','12 -spd — ZF 12TX2621 AMT'])expect(screen.getByLabelText(label)).toBeTruthy();expect(screen.getByRole('link',{name:/See the range/}).getAttribute('href')).toBe('#the-range')});

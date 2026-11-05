import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {expect,it,vi,afterEach} from 'vitest';
import {Header} from '../components/Header';
import {TruckExperience} from '../components/TruckExperience';
import {EnquiryExperience} from '../components/Enquiry';
afterEach(()=>{cleanup();vi.unstubAllGlobals()});
it('opens a truck list on hover and opens the selected specification popup',()=>{vi.stubGlobal('matchMedia',()=>({matches:true}));render(<EnquiryExperience><TruckExperience><Header/></TruckExperience></EnquiryExperience>);fireEvent.mouseEnter(screen.getByTestId('truck-menu'));fireEvent.click(screen.getByRole('button',{name:'View HOWO MAX specifications'}));expect(screen.getByRole('dialog',{name:'HOWO MAX technical specifications'})).toHaveTextContent('HW16-HD27 · 16-speed AMT')});

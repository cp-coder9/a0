import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {expect,it,afterEach} from 'vitest';
import {TruckExperience,useTruckDetails} from '../components/TruckExperience';
import {EnquiryExperience} from '../components/Enquiry';
function Trigger(){const open=useTruckDetails();return <button onClick={event=>open('howo-tapa',event.currentTarget)}>Inspect truck</button>}
afterEach(cleanup);
it('opens model-specific technical specs and hands the same truck to a single enquiry popup',()=>{render(<EnquiryExperience><TruckExperience><Trigger/></TruckExperience></EnquiryExperience>);fireEvent.click(screen.getByRole('button',{name:'Inspect truck'}));expect(screen.getByRole('dialog',{name:'HOWO Tapa technical specifications'})).toHaveTextContent('290 hp');fireEvent.click(screen.getByRole('button',{name:'Enquire now about HOWO Tapa'}));expect(screen.getAllByRole('dialog')).toHaveLength(1);expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('HOWO Tapa');expect(screen.getByRole('region',{name:'Selected truck information'})).toHaveTextContent('27 T GVW')});

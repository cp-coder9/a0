import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {expect,it,afterEach} from 'vitest';
import {EnquiryExperience,EnquiryButton} from '../components/Enquiry';
afterEach(cleanup);
it('prefills the clicked truck and displays its specifications in the enquiry popup',()=>{render(<EnquiryExperience><EnquiryButton model="HOWO Tapa">Enquire now</EnquiryButton></EnquiryExperience>);fireEvent.click(screen.getByRole('button',{name:'Enquire now'}));expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('HOWO Tapa');expect(screen.getByRole('region',{name:'Selected truck information'})).toHaveTextContent('290 hp');expect(screen.getByRole('region',{name:'Selected truck information'})).toHaveTextContent('1160 Nm');fireEvent.change(screen.getByRole('combobox'),{target:{value:'SITRAK G7H'}});expect(screen.getByRole('region',{name:'Selected truck information'})).toHaveTextContent('480 hp')});

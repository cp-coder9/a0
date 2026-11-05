import {it,expect} from 'vitest';
import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Header} from '../components/Header';
import {EnquiryExperience} from '../components/Enquiry';
it('closes the mobile navigation when an enquiry opens',async()=>{const user=userEvent.setup();render(<EnquiryExperience><Header/></EnquiryExperience>);const toggle=screen.getByRole('button',{name:/Menu/});await user.click(toggle);expect(toggle).toHaveAttribute('aria-expanded','true');await user.click(screen.getByRole('button',{name:'Enquire →'}));expect(screen.getByRole('dialog')).toBeVisible();expect(toggle).toHaveAttribute('aria-expanded','false');});

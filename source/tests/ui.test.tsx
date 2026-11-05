import {it,expect,vi} from 'vitest';
import {render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {EnquiryExperience} from '../components/Enquiry';
it('opens an accessible enquiry and validates before sending',async()=>{const u=userEvent.setup();render(<EnquiryExperience/>);await u.click(screen.getByRole('button',{name:'Enquire →'}));expect(screen.getByRole('dialog')).toBeVisible();await u.click(screen.getByRole('button',{name:'Send enquiry'}));expect(screen.getByText(/Enter your name/)).toBeVisible();await u.keyboard('{Escape}');expect(screen.queryByRole('dialog')).not.toBeInTheDocument();});

import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {expect,it,vi,afterEach} from 'vitest';
import {Header} from '../components/Header';
afterEach(()=>{cleanup();vi.unstubAllGlobals()});
it('keeps the range dropdown open when the first click follows mouse hover',()=>{vi.stubGlobal('matchMedia',()=>({matches:true}));render(<Header/>);fireEvent.mouseEnter(screen.getByTestId('truck-menu'));fireEvent.click(screen.getByRole('button',{name:'The range'}));expect(screen.getByRole('button',{name:'View HOWO Tapa specifications'})).toBeTruthy()});

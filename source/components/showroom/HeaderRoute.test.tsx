import {render,screen,fireEvent} from '@testing-library/react';
import {it,expect,vi} from 'vitest';
import {Header} from '../Header';
it('routes the G7H header entry directly and preserves other truck detail controls',()=>{
 vi.stubGlobal('matchMedia',()=>({matches:false}));
 render(<Header/>);fireEvent.click(screen.getByRole('button',{name:'The range'}));
 expect(screen.getByRole('link',{name:'Explore SITRAK G7H showroom'})).toHaveAttribute('href','/models/g7h/');
 expect(screen.getByRole('button',{name:'View SITRAK G7S specifications'})).toBeVisible();
 vi.unstubAllGlobals();
});

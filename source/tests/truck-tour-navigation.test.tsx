import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {TruckTourNavigation} from '../components/TruckTourNavigation';
import {initialTour} from '../lib/truck-tour';
afterEach(cleanup);
it('exposes seven selectable scenes, wrapping actions and accessible List state',()=>{const action=vi.fn();render(<TruckTourNavigation state={initialTour()} action={action}/>);expect(screen.getAllByRole('button',{name:/^Scene:/})).toHaveLength(7);fireEvent.click(screen.getByRole('button',{name:'Scene: Interior'}));expect(action).toHaveBeenLastCalledWith({type:'select',scene:6});fireEvent.click(screen.getByRole('button',{name:'Next scene'}));expect(action).toHaveBeenLastCalledWith({type:'next'});fireEvent.click(screen.getByRole('button',{name:'List'}));expect(action).toHaveBeenLastCalledWith({type:'list'})});
it('keeps previous/next and Return available with the interior open and the List hidden',()=>{render(<TruckTourNavigation state={{scene:6,lastExterior:4,list:false}} action={vi.fn()}/>);expect(screen.queryByRole('button',{name:'Scene: Front'})).toBeNull();expect(screen.getByRole('button',{name:'Return to 3D exterior'})).toBeTruthy();expect(screen.getByRole('button',{name:'Previous scene'})).toBeTruthy();expect(screen.getByRole('button',{name:'Next scene'})).toBeTruthy()});

import {render,screen,fireEvent} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {TruckExteriorGallery} from './TruckExteriorGallery';
import type {CatalogTruck} from '../../lib/truck-catalog';

afterEach(()=>vi.restoreAllMocks());
// Synthetic truck so this gallery test does not depend on the live catalogue's copy.
const truck={id:'test-truck',name:'Test Truck',config:'6×4 tractor',fullName:'Test Truck 6×4',images:[{src:'/assets/test-1.jpg',label:'Full truck view'},{src:'/assets/test-2.jpg',label:'Road view — crop of supplied photo'},{src:'/assets/test-3.jpg',label:'Cab detail — crop of supplied photo'}],technical:[],stats:[]} as unknown as CatalogTruck;

it('shows the first catalogue image with its honest caption and cycles with prev/next',()=>{
 render(<TruckExteriorGallery truck={truck}/>);
 expect(screen.getByRole('img',{name:'Test Truck: Full truck view'})).toBeVisible();
 expect(screen.getByText('1 of 3 images')).toBeVisible();
 fireEvent.click(screen.getByRole('button',{name:'Next exterior image'}));
 expect(screen.getByRole('img',{name:/Road view/})).toBeVisible();
 expect(screen.getByText('2 of 3 images')).toBeVisible();
 fireEvent.click(screen.getByRole('button',{name:'Previous exterior image'}));
 expect(screen.getByRole('img',{name:/Full truck view/})).toBeVisible();
});

it('selects an image directly from its thumbnail',()=>{
 render(<TruckExteriorGallery truck={truck}/>);
 fireEvent.click(screen.getByRole('button',{name:/Select exterior image 3/}));
 expect(screen.getByRole('img',{name:/Cab detail/})).toBeVisible();
 expect(screen.getByText('3 of 3 images')).toBeVisible();
});

it('reports an honest unavailable state once every image fails',()=>{
 render(<TruckExteriorGallery truck={truck}/>);
 for(let i=0;i<truck.images.length;i++)fireEvent.error(screen.getByRole('img',{name:/Test Truck:/}));
 expect(screen.getByRole('status')).toHaveTextContent('no substitute vehicle');
 expect(screen.queryByRole('img',{name:/Test Truck:/})).toBeNull();
});

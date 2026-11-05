import {render,screen,cleanup} from '@testing-library/react';
import {renderToStaticMarkup} from 'react-dom/server';
import {it,expect,afterEach} from 'vitest';
import Home from '../app/page';
import {findTruck} from '../lib/truck-catalog';
import {TruckTechnicalDescription} from '../components/TruckTechnicalDescription';
afterEach(cleanup);
it('keeps the detailed G7H numbers and specification layout inside that truck description',()=>{render(<TruckTechnicalDescription truck={findTruck('g7h')!}/>);expect(screen.getByRole('heading',{name:'480 horses. 65 tonnes.'})).toBeTruthy();expect(screen.getByRole('table')).toHaveTextContent('SINOTRUK MC13');expect(screen.getByText('ZF 12TX2621')).toBeTruthy()});
it('removes the standalone specs section without losing the truck range',()=>{const html=renderToStaticMarkup(<Home/>);expect(html).not.toContain('id="the-specs"');expect(html).toContain('id="the-range"');expect(html).not.toContain('href="#the-specs"')});

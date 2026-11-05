import {render,screen,within} from '@testing-library/react';
import {describe,expect,it} from 'vitest';
import {CompareRange} from './CompareRange';

const TRACTOR_CONFIG='6×4 tractor · Long haul';
const TIPPER_CONFIG='6×4 tipper · Construction';

describe('CompareRange',()=>{
 it('shows the four featured bulletin trucks as column headers with their configuration',()=>{
  render(<CompareRange/>);
  expect(screen.getByRole('columnheader',{name:/SITRAK G7H/})).toHaveTextContent(TRACTOR_CONFIG);
  expect(screen.getByRole('columnheader',{name:/SITRAK G7S/})).toHaveTextContent(TRACTOR_CONFIG);
  expect(screen.getByRole('columnheader',{name:/HOWO MAX/})).toHaveTextContent(TRACTOR_CONFIG);
  expect(screen.getByRole('columnheader',{name:/HOWO TX 64330/})).toHaveTextContent(TIPPER_CONFIG);
  expect(screen.getAllByRole('columnheader')).toHaveLength(5);
 });
 it('marks the cells of a specification that differs across the range',()=>{
  render(<CompareRange/>);
  const ratedPower=screen.getByRole('row',{name:/Rated power/});
  expect(ratedPower).toHaveClass('is-different');
  const cells=within(ratedPower).getAllByRole('cell');
  expect(cells).toHaveLength(4);
  cells.forEach(cell=>expect(cell).toHaveClass('is-different'));
  expect(cells[0]).toHaveTextContent('480 hp');
  expect(cells[3]).toHaveTextContent('330 hp');
 });
 it('keeps its table semantics, caption and scroll region accessible',()=>{
  render(<CompareRange/>);
  expect(screen.getByRole('table',{name:/Supplied specification comparison/})).toBeInTheDocument();
  expect(screen.getByRole('rowheader',{name:'Peak torque'})).toBeInTheDocument();
  expect(screen.getByRole('region',{name:/Truck comparison table/})).toHaveAttribute('tabindex','0');
  expect(screen.getByText('Supplied specification comparison: SITRAK G7H, SITRAK G7S, HOWO MAX and HOWO TX 64330')).toBeInTheDocument();
  expect(screen.getByText(/Scroll the table horizontally to compare every model/)).toBeInTheDocument();
 });
 it('notes that the comparison is the published dealer specification only',()=>{
  render(<CompareRange/>);
  expect(screen.getByText('Published SINOTRUK dealer specifications only.')).toBeInTheDocument();
 });
});

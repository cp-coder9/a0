import {fireEvent,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe,expect,it} from 'vitest';
import {AnatomyHotspots} from './AnatomyHotspots';

const HOTSPOT_NAMES=[
 'Rated power: 480 hp',
 'Peak torque: 2 300 Nm',
 'Transmission: 12-speed AMT',
 'Gross combination mass: 65 T GCM',
 'Configuration: 6×4 tractor',
];

const hotspots=()=>screen.getAllByRole('button').filter(button=>button.getAttribute('aria-controls')==='anatomy-hotspot-detail');

describe('AnatomyHotspots',()=>{
 it('renders the featured truck image with one named hotspot button per figure',()=>{
  render(<AnatomyHotspots/>);
  expect(screen.getByRole('img',{name:/SITRAK G7H 64480 6×4 tractor/})).toHaveAttribute('src','/assets/g7h.png');
  expect(hotspots()).toHaveLength(5);
  for(const name of HOTSPOT_NAMES){
   expect(screen.getByRole('button',{name})).toHaveAttribute('aria-controls','anatomy-hotspot-detail');
  }
 });

 it('shows the first hotspot detail by default and updates it on click',async()=>{
  const user=userEvent.setup();
  render(<AnatomyHotspots/>);
  const detail=screen.getByRole('status');
  expect(detail).toHaveTextContent('Rated power');
  expect(detail).toHaveTextContent('480 hp (353 kW)');
  expect(screen.getByRole('button',{name:'Rated power: 480 hp'})).toHaveAttribute('aria-expanded','true');
  const torque=screen.getByRole('button',{name:'Peak torque: 2 300 Nm'});
  await user.click(torque);
  expect(torque).toHaveAttribute('aria-expanded','true');
  expect(detail).toHaveTextContent('2300 Nm @ 1050–1400 rpm');
  expect(screen.getByRole('button',{name:'Rated power: 480 hp'})).toHaveAttribute('aria-expanded','false');
 });

 it('reveals a detail when a hotspot receives focus and closes it with Escape',()=>{
  render(<AnatomyHotspots/>);
  const configuration=screen.getByRole('button',{name:'Configuration: 6×4 tractor'});
  fireEvent.focus(configuration);
  expect(screen.getByRole('status')).toHaveTextContent('Configuration');
  expect(screen.getByRole('status')).toHaveTextContent('6×4 tractor');
  fireEvent.keyDown(configuration,{key:'Escape'});
  expect(screen.getByRole('status')).toHaveTextContent('Select a hotspot on the truck to read the published figure.');
  expect(configuration).toHaveAttribute('aria-expanded','false');
 });

 it('does not carry a per-truck confirmation disclaimer',async()=>{
  const user=userEvent.setup();
  render(<AnatomyHotspots/>);
  expect(document.querySelector('.anatomy-disclaimer')).toBeNull();
  await user.click(screen.getByRole('button',{name:'Next truck'}));
  expect(document.querySelector('.anatomy-disclaimer')).toBeNull();
 });

 it('moves through the featured range with the arrows, showing each truck and its own hotspots',async()=>{
  const user=userEvent.setup();
  render(<AnatomyHotspots/>);
  await user.click(screen.getByRole('button',{name:'Next truck'}));
  expect(screen.getByRole('img',{name:/SITRAK G7S/})).toHaveAttribute('src','/assets/g7s.png');
  expect(screen.getByText('02 / 04 · SITRAK G7S')).toBeVisible();
  expect(hotspots()).toHaveLength(4);
  expect(screen.getByRole('button',{name:'Rated power: 480 hp'})).toHaveAttribute('aria-expanded','true');
  expect(screen.getByRole('button',{name:'Configuration: 6×4 tractor · air'})).toBeVisible();
  await user.click(screen.getByRole('button',{name:'Next truck'}));
  expect(screen.getByRole('img',{name:/HOWO MAX 64480/})).toHaveAttribute('src','/assets/howo-max-front.png');
  expect(screen.getByText('03 / 04 · HOWO MAX')).toBeVisible();
  expect(hotspots()).toHaveLength(5);
  await user.click(screen.getByRole('button',{name:'Next truck'}));
  expect(screen.getByRole('img',{name:/HOWO TX 64330/})).toHaveAttribute('src','/assets/trucks/howo-64330-tipper.webp');
  expect(screen.getByText('04 / 04 · HOWO TX 64330')).toBeVisible();
  expect(hotspots()).toHaveLength(5);
  await user.click(screen.getByRole('button',{name:'Previous truck'}));
  await user.click(screen.getByRole('button',{name:'Previous truck'}));
  await user.click(screen.getByRole('button',{name:'Previous truck'}));
  expect(screen.getByRole('img',{name:/SITRAK G7H/})).toHaveAttribute('src','/assets/g7h.png');
 });

 it('wraps around from the first truck to the last with the previous arrow',async()=>{
  const user=userEvent.setup();
  render(<AnatomyHotspots/>);
  await user.click(screen.getByRole('button',{name:'Previous truck'}));
  expect(screen.getByRole('img',{name:/HOWO TX 64330/})).toHaveAttribute('src','/assets/trucks/howo-64330-tipper.webp');
  expect(screen.getByText('04 / 04 · HOWO TX 64330')).toBeVisible();
  await user.click(screen.getByRole('button',{name:'Next truck'}));
  expect(screen.getByText('01 / 04 · SITRAK G7H')).toBeVisible();
 });

 it('changes truck with the left and right arrow keys',()=>{
  render(<AnatomyHotspots/>);
  const stage=screen.getByRole('group',{name:'Annotated truck range'});
  fireEvent.keyDown(stage,{key:'ArrowRight'});
  expect(screen.getByText('02 / 04 · SITRAK G7S')).toBeVisible();
  fireEvent.keyDown(stage,{key:'ArrowLeft'});
  expect(screen.getByText('01 / 04 · SITRAK G7H')).toBeVisible();
 });
});

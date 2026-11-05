import {act, fireEvent, render, screen, within} from '@testing-library/react';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import {Hero} from '../../components/Hero';
import {EnquiryExperience} from '../../components/Enquiry';
import {heroTrucks} from '../../lib/hero-trucks';
import {truckCatalog} from '../../lib/truck-catalog';

// Model/motion/enquiry contracts, not image decoding, geometry or visual quality.
vi.mock('../../components/CountUp', () => ({CountUp: ({value}: {value: number}) => <span>{value}</span>}));
let reduced = false;
let mediaChanged: (() => void) | undefined;
let previousIntro: string | undefined;
beforeEach(() => {
  vi.useFakeTimers(); reduced = false; previousIntro = document.documentElement.dataset.trukIntro;
  delete document.documentElement.dataset.trukIntro;
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  vi.stubGlobal('IntersectionObserver', class {
    constructor(private callback: (entries: {isIntersecting: boolean}[]) => void) {}
    observe() {this.callback([{isIntersecting: true}]);}
    unobserve() {}
    disconnect() {}
  });
  vi.stubGlobal('matchMedia', () => ({get matches() {return reduced;}, addEventListener: (_: string, callback: () => void) => {mediaChanged = callback;}, removeEventListener: vi.fn()}));
  vi.stubGlobal('fetch', vi.fn(() => {throw new Error('QA safety: unexpected fetch');}));
});
afterEach(() => {
  vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); mediaChanged = undefined;
  if (previousIntro === undefined) delete document.documentElement.dataset.trukIntro;
  else document.documentElement.dataset.trukIntro = previousIntro;
});
const mount = () => render(<EnquiryExperience><Hero/></EnquiryExperience>);
const advance = (slides = 1) => {for (let index = 0; index < slides; index++) act(() => {vi.advanceTimersByTime(7001);});};
function expectContext(index: number) {
  const truck = heroTrucks[index];
  expect(screen.getByRole('button', {name: `Show ${truck.name}`})).toHaveAttribute('aria-pressed', 'true');
  expect(document.querySelectorAll('.model-selector[aria-pressed="true"]')).toHaveLength(1);
  expect(screen.getByRole('group', {name: `${index + 1} of ${heroTrucks.length}: ${truck.name}`})).toBeVisible();
  expect(document.querySelector('.hero-image.is-active')).toHaveAttribute('src', truck.image);
  expect(document.querySelectorAll('.hero-image.is-active')).toHaveLength(1);
  expect(document.querySelector('.hero-image.is-active')).toHaveStyle({objectPosition: truck.position});
  expect(document.querySelector('.hero-model')).toHaveTextContent(truck.specification);
  expect(document.querySelector('.hero-copy')).toHaveTextContent(truck.copy);
  expect(Array.from(document.querySelectorAll('.hero-stats .hero-stat'), element => element.getAttribute('aria-label')).sort()).toEqual(truck.stats.map(stat => `${stat.value}${stat.unit ? ' ' + stat.unit : ''} — ${stat.label}`).sort());
  expect(document.querySelector('.hero-image-label')).toHaveTextContent(`Pictured: ${truck.alt}`);
  expect(screen.getByRole('heading', {level: 1})).toHaveAccessibleName(truck.title.join(' '));
}
function enquire(index: number) {
  fireEvent.click(screen.getByRole('button', {name: /Book a test drive/}));
  expect(screen.getByRole('combobox', {name: 'Truck'})).toHaveValue(heroTrucks[index].model);
  const catalog = truckCatalog.find(truck => truck.id === heroTrucks[index].id)!;
  const summary = within(screen.getByRole('region', {name: 'Selected truck information'}));
  expect(summary.getByRole('heading', {level: 3})).toHaveTextContent(catalog.fullName);
  expect(summary.getByRole('img')).toHaveAttribute('src', catalog.images[0].src);
  expect(fetch).not.toHaveBeenCalled();
}

it('features the four bulletin trucks with a distinct non-placeholder image binding and a catalogue entry', () => {
  expect(heroTrucks.map(t => t.id)).toEqual(['g7h', 'g7s', 'howo-max', 'howo-64330-tipper']);
  expect(new Set(heroTrucks.map(t => t.id)).size).toBe(heroTrucks.length);
  expect(new Set(heroTrucks.map(t => t.image)).size).toBe(heroTrucks.length);
  for (const truck of heroTrucks) {
    const catalog = truckCatalog.find(t => t.id === truck.id);
    expect(catalog, truck.id).toBeTruthy();
    expect(truck.model).toBe(catalog?.model);
    expect(truck.image).toMatch(/^\/assets\//);
    expect(truck.image).not.toMatch(/placeholder|blank|dummy/i);
  }
  // The retained HOWO Tapa showroom page is still a catalogue entry, even though it is not featured.
  expect(truckCatalog.find(t => t.id === 'howo-tapa')).toBeTruthy();
});
it.each(heroTrucks.map((truck, index) => [truck.name, index] as const))('automatic advance retains %s image/name/specifications/enquiry context', (_, index) => {
  mount(); advance(index === 0 ? heroTrucks.length : index); expectContext(index); enquire(index);
});
it('automatic advance wraps through the full catalog back to the first model', () => {
  mount(); advance(heroTrucks.length); expectContext(0);
});
it.each(heroTrucks.map((truck, index) => [truck.name, index] as const))('manual %s selection is coherent and remains paused', (name, index) => {
  mount(); fireEvent.click(screen.getByRole('button', {name: `Show ${name}`}));
  advance(heroTrucks.length + 1); expectContext(index);
  expect(screen.getByRole('button', {name: 'Play truck slideshow'})).toBeVisible(); enquire(index);
});
it('explicit pause prevents motion; Play resumes automatic context advance', () => {
  mount(); fireEvent.click(screen.getByRole('button', {name: 'Pause truck slideshow'}));
  advance(2); expectContext(0);
  fireEvent.click(screen.getByRole('button', {name: 'Play truck slideshow'}));
  advance(); expectContext(1);
});
it('keyboard arrows and Previous/Next wrap without losing model context', () => {
  mount(); const control = screen.getByRole('button', {name: 'Next truck'});
  act(() => {control.focus();});
  expect(control).toHaveFocus();
  expect(fireEvent.keyDown(control, {key: 'ArrowLeft'})).toBe(false); expectContext(heroTrucks.length - 1);
  expect(fireEvent.keyDown(control, {key: 'ArrowRight'})).toBe(false); expectContext(0);
  expect(control).toHaveFocus();
  fireEvent.click(screen.getByRole('button', {name: 'Next truck'})); expectContext(1);
  fireEvent.click(screen.getByRole('button', {name: 'Previous truck'})); expectContext(0);
});
it('hover and keyboard focus suspend autoplay until released', () => {
  mount(); const region = screen.getByRole('region', {name: 'Explore the truck range'});
  fireEvent.mouseEnter(region); advance(2); expectContext(0);
  fireEvent.mouseLeave(region); advance(); expectContext(1);
  const control = screen.getByRole('button', {name: 'Next truck'});
  fireEvent.focus(control); advance(2); expectContext(1);
  fireEvent.blur(control, {relatedTarget: document.body}); advance(); expectContext(2);
});
it.each(heroTrucks.map((truck, index) => [truck.name, index] as const))('reduced motion blocks autoplay and retains manual %s context/enquiry', (name, index) => {
  reduced = true; mount(); advance(heroTrucks.length + 1); expectContext(0);
  expect(screen.queryByRole('button', {name: 'Pause truck slideshow'})).toBeNull();
  fireEvent.click(screen.getByRole('button', {name: `Show ${name}`}));
  advance(2); expectContext(index); enquire(index);
});
it('changing reduced-motion preference stops an already playing carousel', () => {
  mount(); advance(); expectContext(1);
  act(() => {reduced = true; mediaChanged?.();});
  advance(2); expectContext(1);
});
it.each(heroTrucks.map((truck, index) => [truck.name, index] as const))('failed %s hero image exposes an honest status and leaves navigation/enquiry usable', (name, index) => {
  mount(); fireEvent.click(screen.getByRole('button', {name: `Show ${name}`}));
  const image = document.querySelector('.hero-image.is-active'); expect(image).not.toBeNull();
  fireEvent.error(image!);
  // New acceptance: a broken high-quality image may not silently masquerade as success.
  expect(screen.getByRole('status')).toHaveTextContent(/image|photo|unavailable|could not|failed/i);
  const next = (index + 1) % heroTrucks.length;
  fireEvent.click(screen.getByRole('button', {name: 'Next truck'})); expectContext(next); enquire(next);
});

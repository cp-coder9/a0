import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {render,screen,cleanup} from '@testing-library/react';
import {afterEach,describe,expect,it} from 'vitest';
import {rangeModelById, rangeModels} from '../lib/truck-range';
import {RangeSpecifications} from '../components/showroom/RangeSpecifications';
afterEach(cleanup);

const PRICE_PATTERN = /R\s?\d{1,3}(?:[ ,]\d{3})+/;
const PRICING_WORDS = /wholesale|dealer margin|suggested customer price|\bVAT\b/i;

describe('range specification dataset', () => {
  it('covers exactly the 14 attached dealer-bulletin trucks with bulletin row numbers 1–14', () => {
    expect(rangeModels).toHaveLength(14);
    expect(rangeModels.map(model => model.row)).toEqual([1,2,3,4,5,6,7,8,9,10,11,12,13,14]);
    for (const model of rangeModels) {
      expect(model.sheetName.length).toBeGreaterThan(10);
      expect(['SITRAK','HOWO']).toContain(model.brand);
      expect(['Long haul','Construction']).toContain(model.category);
    }
  });

  it('publishes no pricing, discount or margin data', () => {
    const serialised = JSON.stringify(rangeModels);
    expect(serialised).not.toMatch(PRICE_PATTERN);
    expect(serialised).not.toMatch(PRICING_WORDS);
  });

  it('keeps published specifications with their source, and leaves unpublished rows empty', () => {
    for (const model of rangeModels) {
      if (model.match === 'not-published') {
        expect(model.groups).toHaveLength(0);
        expect(model.source).toBeNull();
        continue;
      }
      expect(model.source?.url).toMatch(/^https:\/\/www\.sinotruk\.co\.za\//);
      expect(model.source?.fetched).toBe('2026-11-02');
      const engine = model.groups.find(group => group.id === 'engine');
      expect(engine, `${model.id} needs an engine group`).toBeTruthy();
      expect(engine?.rows.some(row => row.label === 'Engine model' && row.value.length > 0)).toBe(true);
      expect(engine?.rows.some(row => row.label === 'Gearbox')).toBe(true);
    }
  });

  it('only the exact-match rows are labelled as this model’s published specification', () => {
    const exact = rangeModels.filter(model => model.match === 'exact').map(model => model.row);
    const closest = rangeModels.filter(model => model.match === 'closest').map(model => model.row);
    const unpublished = rangeModels.filter(model => model.match === 'not-published').map(model => model.row);
    expect(exact).toEqual([1,4,5,6,9,10,11]);
    expect(closest).toEqual([7,8,12,14]);
    expect(unpublished).toEqual([2,3,13]);
    for (const model of rangeModels.filter(model => model.match === 'closest')) {
      expect(model.matchNote.toLowerCase()).toContain('not');
      expect(model.caveats.length).toBeGreaterThan(0);
    }
  });

  it('serves every referenced truck image from public/assets/trucks', () => {
    for (const model of rangeModels) {
      expect(model.image.startsWith('/assets/trucks/')).toBe(true);
      expect(existsSync(join(process.cwd(),'public',model.image))).toBe(true);
    }
  });
});

describe('range & specifications page', () => {
  it('renders all 14 trucks with engine detail and honest gaps', () => {
    const {container} = render(<RangeSpecifications/>);
    const cards = container.querySelectorAll('article.range-specs-card');
    expect(cards).toHaveLength(14);

    for (const model of rangeModels) {
      expect(container.querySelector(`#model-${model.id}`)).toBeTruthy();
    }

    // A published row shows the engine specification copied from the dealer page.
    const g7s = rangeModelById('sitrak-g7s-64480-air-e3')!;
    const g7sCard = container.querySelector(`#model-${g7s.id}`)!;
    expect(g7sCard.textContent).toContain('Engine & driveline');
    expect(g7sCard.textContent).toContain('MC13,48');
    expect(g7sCard.textContent).toContain('Euro 3');
    expect(g7sCard.textContent).toContain('ZF12TX2621 AMT');

    // A row the dealer site does not publish must not render a specification table.
    const unpublished = rangeModelById('sitrak-g7h-64480-spring-e3')!;
    const unpublishedCard = container.querySelector(`#model-${unpublished.id}`)!;
    expect(unpublishedCard.querySelector('table')).toBeNull();
    expect(unpublishedCard.textContent).toMatch(/does not publish this configuration/i);
    expect(unpublishedCard.textContent).toContain('Spring suspension');

    // A closest-match row must be labelled as a different configuration before its figures.
    const closest = rangeModelById('howo-tx-64330-tipper-10cbm-amt')!;
    const closestCard = container.querySelector(`#model-${closest.id}`)!;
    expect(closestCard.textContent).toMatch(/Different published configuration/i);
    expect(closestCard.querySelector('table')).toBeTruthy();
  });

  it('cites the SINOTRUK dealer product page for every published row', () => {
    const {container} = render(<RangeSpecifications/>);
    const published = rangeModels.filter(model => model.source);
    const links = Array.from(container.querySelectorAll<HTMLAnchorElement>('.range-specs-source a'));
    expect(links).toHaveLength(published.length);
    for (const link of links) {
      expect(link.href).toMatch(/^https:\/\/www\.sinotruk\.co\.za\//);
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toContain('noopener');
    }
  });

  it('contains no pricing on the page', () => {
    const {container} = render(<RangeSpecifications/>);
    expect(container.textContent).not.toMatch(PRICE_PATTERN);
    expect(container.textContent).not.toMatch(PRICING_WORDS);
  });

  it('links the two category sections and cites the published specification source', () => {
    const {container} = render(<RangeSpecifications/>);
    expect(screen.getByRole('heading',{level:1}).textContent).toMatch(/Every truck/i);
    expect(screen.getByRole('navigation',{name:'Range categories'})).toHaveTextContent('Long haul');
    expect(screen.getByRole('navigation',{name:'Range categories'})).toHaveTextContent('Construction');
    expect(container.textContent).toMatch(/Specifications are copied from the SINOTRUK dealer website/i);
    expect(screen.queryByText(/Confirm the exact unit/i)).toBeNull();
  });
});

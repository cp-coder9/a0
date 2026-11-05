/**
 * The truck range for the Truk Afrik site: the 14 models on the SINOTRUK SOUTH AFRICA dealer
 * bulletin SALES-2026/02 (effective 01 Sept 2026), with specifications copied only from the
 * matching pages of the SINOTRUK dealer site (https://www.sinotruk.co.za/).
 *
 * The dataset lives in `range-specifications.json` and is generated from captured raw HTML by
 * `research/dealer-specs-2026-11-02/build_range_data.py`; do not hand-edit the JSON.
 *
 * Deliberate rules:
 *  - NO pricing is present or published. The attached bulletin is internal dealer billing; this
 *    module carries model identity and specifications only.
 *  - A row is `exact` only where the dealer site publishes the same model and configuration.
 *  - `closest` rows keep the published figures but are labelled as a different published
 *    configuration — never presented as the attached model's own specification.
 *  - `not-published` rows stay empty. No value is inferred, converted or carried over from a
 *    different model.
 */
import data from './range-specifications.json';

export type RangeSpecRow = {label: string; value: string};

export type RangeSpecGroup = {
  /** Stable group id used for anchors and test assertions. */
  id: string;
  title: string;
  rows: RangeSpecRow[];
};

export type RangeModelMatch = 'exact' | 'closest' | 'not-published';

export type RangeModelSource = {
  pageLabel: string;
  url: string;
  publishedApplication: string | null;
  publishedModel: string | null;
  fetched: string;
  /** Raw captured page inside this repository, for audit. */
  evidenceFile: string;
};

export type RangeModelSummary = {
  power: string | null;
  euro: string | null;
  transmission: string | null;
  drive: string | null;
  application: string | null;
};

export type RangeModel = {
  /** Stable site id, derived from the attached bulletin row. */
  id: string;
  /** 1-based row number on the attached bulletin (SINOTRUK and HOWO tables together). */
  row: number;
  brand: 'SITRAK' | 'HOWO';
  category: 'Long haul' | 'Construction';
  /** Model name exactly as printed on the attached bulletin. */
  sheetName: string;
  /** MM code printed on the bulletin, or null where the bulletin prints “*”. */
  mmCode: string | null;
  name: string;
  variant: string;
  image: string;
  imageNote?: string;
  match: RangeModelMatch;
  matchNote: string;
  /** For not-published rows: the published adjacent configuration the reader can compare. */
  closest?: {row: number; id: string; label: string};
  source: RangeModelSource | null;
  summary: RangeModelSummary;
  groups: RangeSpecGroup[];
  caveats: string[];
};

export const rangeBulletin = data.bulletin;
export const rangeSpecificationSource = data.specificationSource;

export const rangeModels = data.models as unknown as RangeModel[];

export const rangeModelCount = rangeModels.length;

export const rangeCategories = ['Long haul', 'Construction'] as const;

export function rangeModelsByCategory(category: (typeof rangeCategories)[number]): RangeModel[] {
  return rangeModels.filter(model => model.category === category);
}

export function rangeModelById(id: string): RangeModel | undefined {
  return rangeModels.find(model => model.id === id);
}

export function rangeModelsByMatch(match: RangeModelMatch): RangeModel[] {
  return rangeModels.filter(model => model.match === match);
}

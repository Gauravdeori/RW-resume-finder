import type { Density } from '../components/CandidateRow';

/** View menu choices, remembered in this browser. */
export interface ViewPrefs {
  density: Density;
  /** Results as a 3-column grid (default) or a 1-column list. */
  results: 'list' | 'grid';
}

/** v2: the default became the 3-column grid. v1 only contributes the density choice. */
const KEY = 'resumeFinder.view.v2';
const OLD_KEY = 'resumeFinder.view.v1';
export const DEFAULT_VIEW: ViewPrefs = { density: 'compact', results: 'grid' };

export function loadView(): ViewPrefs {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? localStorage.getItem(OLD_KEY) ?? '{}') as Partial<ViewPrefs>;
    const fromV1 = localStorage.getItem(KEY) === null;
    return {
      density: v.density === 'comfortable' ? 'comfortable' : 'compact',
      results: !fromV1 && v.results === 'list' ? 'list' : 'grid',
    };
  } catch {
    return DEFAULT_VIEW;
  }
}

export function storeView(v: ViewPrefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* storage unavailable: the choice lasts for this visit only */
  }
}

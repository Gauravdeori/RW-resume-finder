import type { Density } from '../components/CandidateRow';

/** View menu choices, remembered in this browser. */
export interface ViewPrefs {
  density: Density;
  /** Results as a 1-column list (default) or a 3-column grid. */
  results: 'list' | 'grid';
}

const KEY = 'resumeFinder.view.v1';
export const DEFAULT_VIEW: ViewPrefs = { density: 'compact', results: 'list' };

export function loadView(): ViewPrefs {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<ViewPrefs>;
    return {
      density: v.density === 'comfortable' ? 'comfortable' : 'compact',
      results: v.results === 'grid' ? 'grid' : 'list',
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

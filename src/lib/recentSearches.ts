import { cloneFilters, normalizeFilters, type Filters } from './types';
import { encodeFilters } from './urlState';

/** A search the recruiter ran ("Show candidates" or "Search within"), newest first. Kept in this browser only. */
export interface RecentSearch {
  key: string;
  steps: Filters[];
  at: string;
}

const KEY = 'resumeFinder.recent.v1';
const KEEP = 8;

export function loadRecent(): RecentSearch[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((r): r is RecentSearch => !!r && typeof r.key === 'string' && Array.isArray(r.steps) && r.steps.length > 0)
      .map((r) => ({ ...r, steps: r.steps.map(normalizeFilters) }));
  } catch {
    return [];
  }
}

export function storeRecent(list: RecentSearch[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable: recent searches last for this visit only */
  }
}

/** Add a search to the top of the list (moving it there if it is already in it). Empty searches are not kept. */
export function addRecent(list: RecentSearch[], steps: Filters[]): RecentSearch[] {
  const key = steps.map(encodeFilters).join('|');
  if (!key.replace(/\|/g, '')) return list;
  const entry: RecentSearch = { key, steps: steps.map(cloneFilters), at: new Date().toISOString() };
  return [entry, ...list.filter((r) => r.key !== key)].slice(0, KEEP);
}

import type { SortKey } from './filter';
import { AGE_MAX, AGE_MIN, emptyFilters, type Filters } from './types';

/**
 * Search state <-> URL query string, so a search can be shared or refreshed.
 *   ?s=<locked step 1>&s=<locked step 2>&f=<current filters>&sort=new
 * Each step is "key.value~key.value", lists joined with ",", e.g. f=ind.financial~gs.A,B~age.d40
 * Written with history.replaceState: no reloads, no extra history entries.
 */

type ListKey = 'genders' | 'seniority' | 'industries' | 'positions' | 'gaishiScores' | 'degrees' | 'schoolClasses' | 'majors';
type TextKey = 'lastName' | 'firstName' | 'currentCompany' | 'schoolName';
type ChoiceKey = 'foreign' | 'englishMin' | 'japaneseMin' | 'overseas';

const LISTS: [string, ListKey][] = [
  ['g', 'genders'],
  ['sen', 'seniority'],
  ['ind', 'industries'],
  ['pos', 'positions'],
  ['gs', 'gaishiScores'],
  ['deg', 'degrees'],
  ['cls', 'schoolClasses'],
  ['maj', 'majors'],
];
const TEXTS: [string, TextKey][] = [
  ['ln', 'lastName'],
  ['fn', 'firstName'],
  ['cc', 'currentCompany'],
  ['sch', 'schoolName'],
];
const CHOICES: [string, ChoiceKey][] = [
  ['fc', 'foreign'],
  ['en', 'englishMin'],
  ['ja', 'japaneseMin'],
  ['ov', 'overseas'],
];

// Values may contain any character; escape the separators we use.
const enc = (v: string) => encodeURIComponent(v).replace(/~/g, '%7E').replace(/\./g, '%2E');
const dec = (v: string) => {
  try {
    return decodeURIComponent(v);
  } catch {
    return '';
  }
};

export function encodeFilters(f: Filters): string {
  const parts: string[] = [];
  for (const [k, field] of TEXTS) if (f[field].trim()) parts.push(`${k}.${enc(f[field].trim())}`);
  const prev = f.previousCompanies.map((p) => p.trim()).filter(Boolean);
  if (prev.length) parts.push(`pc.${prev.map(enc).join(',')}`);
  if (f.ageMode === 'decades' && f.decades.length) parts.push(`age.d${f.decades.join(',')}`);
  if (f.ageMode === 'range') parts.push(`age.r${f.ageMin}-${f.ageMax}`);
  for (const [k, field] of LISTS) if (f[field].length) parts.push(`${k}.${(f[field] as string[]).map(enc).join(',')}`);
  for (const [k, field] of CHOICES) if (f[field] !== 'any') parts.push(`${k}.${enc(f[field])}`);
  return parts.join('~');
}

export function decodeFilters(s: string): Filters {
  const f = emptyFilters();
  for (const part of s.split('~')) {
    const dot = part.indexOf('.');
    if (dot < 1) continue;
    const k = part.slice(0, dot);
    const v = part.slice(dot + 1);
    const text = TEXTS.find(([key]) => key === k);
    const list = LISTS.find(([key]) => key === k);
    const choice = CHOICES.find(([key]) => key === k);
    if (text) f[text[1]] = dec(v);
    else if (list) (f[list[1]] as string[]) = v.split(',').map(dec).filter(Boolean);
    else if (choice) (f[choice[1]] as string) = dec(v);
    else if (k === 'pc') {
      const prev = v.split(',').map(dec).filter(Boolean);
      f.previousCompanies = prev.length ? prev : [''];
    } else if (k === 'age') {
      if (v.startsWith('d')) {
        const decades = v.slice(1).split(',').map(Number).filter((d) => [20, 30, 40, 50, 60].includes(d));
        if (decades.length) Object.assign(f, { ageMode: 'decades', decades, ageMin: Math.min(...decades), ageMax: Math.max(...decades) + 9 });
      } else if (v.startsWith('r')) {
        const [lo, hi] = v.slice(1).split('-').map(Number);
        if (lo >= AGE_MIN && hi <= AGE_MAX && lo <= hi) Object.assign(f, { ageMode: 'range', ageMin: lo, ageMax: hi });
      }
    }
  }
  return f;
}

export interface SearchState {
  steps: Filters[];
  draft: Filters;
  sort: SortKey;
}

export function readSearchState(): SearchState {
  const params = new URLSearchParams(window.location.search);
  return {
    steps: params.getAll('s').map(decodeFilters),
    draft: decodeFilters(params.get('f') ?? ''),
    sort: params.get('sort') === 'new' ? 'new' : 'best',
  };
}

export function writeSearchState({ steps, draft, sort }: SearchState): void {
  const params = new URLSearchParams();
  for (const s of steps) params.append('s', encodeFilters(s));
  const f = encodeFilters(draft);
  if (f) params.set('f', f);
  if (sort !== 'best') params.set('sort', sort);
  const qs = params.toString();
  const url = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
  if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) window.history.replaceState(null, '', url);
}

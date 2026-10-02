import { emptyFilters, normalizeFilters, type Filters } from './types';

/** A saved search keeps its name and every step's filters, never the result list. */
export interface SavedSearch {
  id: string;
  name: string;
  steps: Filters[];
  createdAt: string;
}

const KEY = 'resumeFinder.savedSearches.v1';

function seed(): SavedSearch[] {
  return [
    {
      id: 'seed-1',
      name: 'Middle managers in their 40s',
      createdAt: '2026-09-28',
      steps: [{ ...emptyFilters(), ageMode: 'decades', decades: [40], ageMin: 40, ageMax: 49, seniority: ['K'] }],
    },
    {
      id: 'seed-2',
      name: 'Bilingual finance leaders',
      createdAt: '2026-09-25',
      steps: [
        { ...emptyFilters(), industries: ['financial'], englishMin: 'Business' },
        { ...emptyFilters(), seniority: ['K', 'B'], japaneseMin: 'Native' },
      ],
    },
  ];
}

export function loadSaved(): SavedSearch[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return seed();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return seed();
    return parsed
      .filter((s): s is SavedSearch => !!s && typeof s.name === 'string' && Array.isArray(s.steps) && s.steps.length > 0)
      .map((s) => ({ ...s, steps: s.steps.map((f) => normalizeFilters(f)) }));
  } catch {
    return seed();
  }
}

export function storeSaved(list: SavedSearch[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable (private mode, blocked): saved searches last for this visit only */
  }
}

export const newSavedId = () => `s-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;

/** Forget stored data so the next load returns the seed data ("Reset demo data" in Admin). */
export function clearStoredSaved(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing stored */
  }
}
import type { Dict } from './i18n';
import { GAISHI_SCORES, SENIORITIES, type Filters } from './types';
import type { SavedSearch } from './savedSearches';

/** Caption under the age slider: "Any age" | "30s, 40s" | "Ages 35 to 44". */
export function ageCaption(f: Filters, t: Dict): string {
  if (f.ageMode === 'decades' && f.decades.length) return [...f.decades].sort((a, b) => a - b).map(t.decade).join(', ');
  if (f.ageMode === 'range') return t.ageRange(f.ageMin, f.ageMax);
  return t.anyAge;
}

/** Short chips describing one step's active filters, in panel order. */
export function filterChips(f: Filters, t: Dict): string[] {
  const out: string[] = [];
  const s = (v: string) => v.trim();
  if (s(f.lastName)) out.push(t.chip.last(s(f.lastName)));
  if (s(f.firstName)) out.push(t.chip.first(s(f.firstName)));
  if (s(f.currentCompany)) out.push(t.chip.current(s(f.currentCompany)));
  for (const p of f.previousCompanies) if (s(p)) out.push(t.chip.previous(s(p)));
  if (f.ageMode !== 'any') out.push(ageCaption(f, t));
  for (const g of f.genders) out.push(t.gender[g]);
  for (const k of SENIORITIES) if (f.seniority.includes(k)) out.push(t.seniorityShort[k]);
  for (const i of f.industries) out.push(t.industry[i]);
  for (const p of f.positions) out.push(t.position[p]);
  if (f.gaishiScores.length) out.push(t.chip.gaishi(GAISHI_SCORES.filter((g) => f.gaishiScores.includes(g)).join('/')));
  if (f.englishMin !== 'any') out.push(t.chip.english(f.englishMin));
  if (f.japaneseMin !== 'any') out.push(t.chip.japanese(f.japaneseMin));
  if (f.foreign !== 'any') out.push(t.chip.foreign(f.foreign));
  if (f.overseas !== 'any') out.push(t.chip.overseas(f.overseas));
  for (const d of f.degrees) out.push(t.degree[d]);
  for (const c of f.schoolClasses) out.push(t.chip.schoolClass(c));
  for (const m of f.majors) out.push(t.major[m]);
  if (s(f.schoolName)) out.push(t.chip.school(s(f.schoolName)));
  return out;
}

export const countActiveFilters = (f: Filters, t: Dict) => filterChips(f, t).length;

/** One-line summary in the saved-searches menu. */
export function savedSummary(s: SavedSearch, t: Dict): string {
  if (s.steps.length > 1) return t.searchesInRow(s.steps.length);
  const chips = s.steps[0] ? filterChips(s.steps[0], t) : [];
  if (!chips.length) return t.chip.none;
  return chips.length > 4 ? `${chips.slice(0, 4).join(', ')} …` : chips.join(', ');
}

/** Suggest a name such as "Finance sector managers" from the filters of all steps. */
export function suggestName(steps: Filters[], t: Dict): string {
  const n = t.nameParts;
  const industries = steps.flatMap((f) => f.industries);
  const positions = steps.flatMap((f) => f.positions);
  const seniority = SENIORITIES.filter((k) => steps.some((f) => f.seniority.includes(k)));
  const decades = [...new Set(steps.flatMap((f) => (f.ageMode === 'decades' ? f.decades : [])))];
  const bilingual = steps.some(
    (f) => ['Business', 'Fluent', 'Native'].includes(f.englishMin) || f.gaishiScores.some((g) => g === 'A' || g === 'B'),
  );

  const parts: string[] = [];
  if (bilingual) parts.push(n.bilingual);
  if (industries.length) parts.push(n.industry[industries[0]]);
  else if (positions.length) parts.push(n.position[positions[0]]);
  // "Kachō, Buchō" reads as "managers": name the most junior level ticked.
  parts.push(seniority.length ? n.seniority[seniority[0]] : n.people);
  if (decades.length === 1) parts.push(n.inTheir(decades[0]));

  if (parts.length === 1 && parts[0] === n.people) return n.fallback;
  const name = parts.join(n.join);
  return name.charAt(0).toUpperCase() + name.slice(1);
}

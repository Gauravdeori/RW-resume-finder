import type { Dict } from './i18n';
import { DEGREES, GAISHI_SCORES, QUALIFICATIONS, SENIORITIES, type AgeFields, type Filters, type RowKey } from './types';
import type { SavedSearch } from './savedSearches';

/** Caption under the age slider: "Any age" | "30s, 40s" | "Ages 35 to 44". */
export function ageCaption(f: AgeFields, t: Dict): string {
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
  if (f.englishMin !== 'any') out.push(t.chip.english(f.englishMin, f.toeic));
  if (f.japaneseMin !== 'any') out.push(t.chip.japanese(f.japaneseMin, f.jlpt));
  if (f.overseas !== 'any') out.push(t.chip.overseas(f.overseas));
  if (f.foreign !== 'any') out.push(t.chip.foreign(f.foreign));
  for (const d of DEGREES) if (f.degrees.includes(d)) out.push(t.chip.degree(d, f.majorFor[d]));
  for (const r of f.schoolRatings) out.push(t.chip.schoolRating(r));
  if (f.gpaMin) out.push(t.chip.gpa(f.gpaMin));
  for (const q of QUALIFICATIONS) if (f.qualifications.includes(q)) out.push(t.qualification[q]);
  if (s(f.qualText)) out.push(t.chip.qualText(s(f.qualText)));
  if (s(f.schoolName)) out.push(t.chip.school(s(f.schoolName)));
  return out;
}

export const countActiveFilters = (f: Filters, t: Dict) => filterChips(f, t).length;

export interface ActiveChip {
  id: string;
  label: string;
  /** The filters with just this chip removed. */
  remove: (f: Filters) => Filters;
  /** The filter row it belongs to (to show it as required or nice to have). */
  row: RowKey;
}

const CHIP_ROW: [string, RowKey][] = [
  ['last', 'name'],
  ['first', 'name'],
  ['current', 'company'],
  ['prev-', 'company'],
  ['age', 'age'],
  ['gs-', 'gaishi'],
  ['gpa', 'gpa'],
  ['g-', 'gender'],
  ['s-', 'seniority'],
  ['i-', 'industry'],
  ['p-', 'position'],
  ['en', 'english'],
  ['ja', 'japanese'],
  ['foreign', 'foreign'],
  ['overseas', 'overseas'],
  ['d-', 'degree'],
  ['r-', 'schoolRating'],
  ['q-', 'qualification'],
  ['qt', 'qualification'],
  ['school', 'school'],
];
const rowOfChip = (id: string): RowKey => CHIP_ROW.find(([prefix]) => id.startsWith(prefix))![1];

/** One removable chip per ticked choice, in panel order (shown at the top of the filter panel). */
export function activeChips(f: Filters, t: Dict): ActiveChip[] {
  const out: Omit<ActiveChip, 'row'>[] = [];
  const s = (v: string) => v.trim();
  const without = <T>(arr: T[], v: T) => arr.filter((x) => x !== v);

  if (s(f.lastName)) out.push({ id: 'last', label: t.chip.last(s(f.lastName)), remove: (x) => ({ ...x, lastName: '' }) });
  if (s(f.firstName)) out.push({ id: 'first', label: t.chip.first(s(f.firstName)), remove: (x) => ({ ...x, firstName: '' }) });
  if (s(f.currentCompany))
    out.push({ id: 'current', label: t.chip.current(s(f.currentCompany)), remove: (x) => ({ ...x, currentCompany: '' }) });
  f.previousCompanies.forEach((p, i) => {
    if (s(p))
      out.push({
        id: `prev-${i}`,
        label: t.chip.previous(s(p)),
        // Extra boxes go away; the first box is just emptied.
        remove: (x) => ({
          ...x,
          previousCompanies: i === 0 ? ['', ...x.previousCompanies.slice(1)] : x.previousCompanies.filter((_, j) => j !== i),
        }),
      });
  });
  if (f.ageMode !== 'any')
    out.push({ id: 'age', label: ageCaption(f, t), remove: (x) => ({ ...x, ageMode: 'any', decades: [], ageMin: 20, ageMax: 69 }) });
  for (const g of f.genders) out.push({ id: `g-${g}`, label: t.gender[g], remove: (x) => ({ ...x, genders: without(x.genders, g) }) });
  for (const k of SENIORITIES)
    if (f.seniority.includes(k))
      out.push({ id: `s-${k}`, label: t.seniorityShort[k], remove: (x) => ({ ...x, seniority: without(x.seniority, k) }) });
  for (const i of f.industries) out.push({ id: `i-${i}`, label: t.industry[i], remove: (x) => ({ ...x, industries: without(x.industries, i) }) });
  for (const p of f.positions) out.push({ id: `p-${p}`, label: t.position[p], remove: (x) => ({ ...x, positions: without(x.positions, p) }) });
  for (const g of GAISHI_SCORES)
    if (f.gaishiScores.includes(g))
      out.push({ id: `gs-${g}`, label: t.chip.gaishi(g), remove: (x) => ({ ...x, gaishiScores: without(x.gaishiScores, g) }) });
  // A level chip also clears the TOEIC score or JLPT level that set it.
  if (f.englishMin !== 'any')
    out.push({ id: 'en', label: t.chip.english(f.englishMin, f.toeic), remove: (x) => ({ ...x, englishMin: 'any', toeic: null }) });
  if (f.japaneseMin !== 'any')
    out.push({ id: 'ja', label: t.chip.japanese(f.japaneseMin, f.jlpt), remove: (x) => ({ ...x, japaneseMin: 'any', jlpt: null }) });
  if (f.overseas !== 'any') out.push({ id: 'overseas', label: t.chip.overseas(f.overseas), remove: (x) => ({ ...x, overseas: 'any' }) });
  if (f.foreign !== 'any') out.push({ id: 'foreign', label: t.chip.foreign(f.foreign), remove: (x) => ({ ...x, foreign: 'any' }) });
  for (const d of DEGREES)
    if (f.degrees.includes(d))
      out.push({
        id: `d-${d}`,
        label: t.chip.degree(d, f.majorFor[d]),
        remove: (x) => {
          const { [d]: _gone, ...majorFor } = x.majorFor;
          return { ...x, degrees: without(x.degrees, d), majorFor };
        },
      });
  for (const r of f.schoolRatings)
    out.push({ id: `r-${r}`, label: t.chip.schoolRating(r), remove: (x) => ({ ...x, schoolRatings: without(x.schoolRatings, r) }) });
  if (f.gpaMin) out.push({ id: 'gpa', label: t.chip.gpa(f.gpaMin), remove: (x) => ({ ...x, gpaMin: null }) });
  for (const q of QUALIFICATIONS)
    if (f.qualifications.includes(q))
      out.push({ id: `q-${q}`, label: t.qualification[q], remove: (x) => ({ ...x, qualifications: without(x.qualifications, q) }) });
  if (s(f.qualText)) out.push({ id: 'qt', label: t.chip.qualText(s(f.qualText)), remove: (x) => ({ ...x, qualText: '' }) });
  if (s(f.schoolName)) out.push({ id: 'school', label: t.chip.school(s(f.schoolName)), remove: (x) => ({ ...x, schoolName: '' }) });
  return out.map((c) => ({ ...c, row: rowOfChip(c.id) }));
}

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

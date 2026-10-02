import { CANDIDATES } from './data';
import { LEVELS, type Candidate, type Filters, type Level, type SchoolClass, type Seniority, type GaishiScore } from './types';

const LEVEL_RANK: Record<Level, number> = Object.fromEntries(LEVELS.map((l, i) => [l, i])) as Record<Level, number>;

export const decadeOf = (age: number) => Math.min(60, Math.floor(age / 10) * 10);

/** Decades lit by the age control: the ticked ones, or the ones the slider range overlaps. */
export function litDecades(f: Filters): number[] {
  if (f.ageMode === 'decades') return f.decades;
  if (f.ageMode === 'range') {
    const out: number[] = [];
    for (const d of [20, 30, 40, 50, 60]) if (f.ageMax >= d && f.ageMin <= d + 9) out.push(d);
    return out;
  }
  return [];
}

/**
 * Compile filters into a fast predicate.
 * Rules: inside one row ticked choices join with OR; rows join with AND; an empty row does not filter;
 * "at least" includes every higher level; text matches part of a word, ignoring case.
 */
export function compileFilters(f: Filters): (c: Candidate) => boolean {
  const q = (s: string) => s.trim().toLowerCase();
  const last = q(f.lastName);
  const first = q(f.firstName);
  const current = q(f.currentCompany);
  const prev = f.previousCompanies.map(q).filter(Boolean);
  const school = q(f.schoolName);
  const decades = f.ageMode === 'decades' && f.decades.length ? new Set(f.decades) : null;
  const range = f.ageMode === 'range' ? [f.ageMin, f.ageMax] : null;
  const set = <T>(arr: T[]) => (arr.length ? new Set(arr) : null);
  const genders = set(f.genders as string[]);
  const seniority = set<Seniority>(f.seniority);
  const industries = set<string>(f.industries);
  const positions = set<string>(f.positions);
  const scores = set<GaishiScore>(f.gaishiScores);
  const degrees = set<string>(f.degrees);
  const classes = set<SchoolClass>(f.schoolClasses);
  const majors = set<string>(f.majors);
  const enMin = f.englishMin === 'any' ? -1 : LEVEL_RANK[f.englishMin];
  const jaMin = f.japaneseMin === 'any' ? -1 : LEVEL_RANK[f.japaneseMin];

  return (c) => {
    if (last && !c.lc.last.includes(last)) return false;
    if (first && !c.lc.first.includes(first)) return false;
    if (current && !c.lc.current.includes(current)) return false;
    for (const p of prev) if (!c.lc.prev.some((x) => x.includes(p))) return false;
    if (decades && !decades.has(decadeOf(c.age))) return false;
    if (range && (c.age < range[0] || c.age > range[1])) return false;
    if (genders && !genders.has(c.gender)) return false;
    if (seniority && !seniority.has(c.seniority)) return false;
    if (industries && !industries.has(c.industry)) return false;
    if (positions && !positions.has(c.position)) return false;
    if (scores && !scores.has(c.gaishiScore)) return false;
    if (f.foreign === 'never' && c.foreignCompanyCount !== 0) return false;
    if (f.foreign === 'once' && c.foreignCompanyCount < 1) return false;
    if (f.foreign === 'twice' && c.foreignCompanyCount < 2) return false;
    if (enMin >= 0 && LEVEL_RANK[c.englishLevel] < enMin) return false;
    if (jaMin >= 0 && LEVEL_RANK[c.japaneseLevel] < jaMin) return false;
    if (f.overseas === 'yes' && c.yearsOverseas <= 0) return false;
    if (f.overseas === 'no' && c.yearsOverseas > 0) return false;
    if (degrees && !degrees.has(c.degree)) return false;
    if (classes && !classes.has(c.schoolClass)) return false;
    if (majors && !majors.has(c.major)) return false;
    if (school && !c.lc.school.includes(school)) return false;
    return true;
  };
}

export function applyFilters(list: readonly Candidate[], f: Filters): Candidate[] {
  const pred = compileFilters(f);
  return list.filter(pred);
}

export function countMatches(list: readonly Candidate[], f: Filters): number {
  const pred = compileFilters(f);
  let n = 0;
  for (const c of list) if (pred(c)) n++;
  return n;
}

/** Results of each step: index 0 is every candidate, index i+1 is step i applied to index i. */
export function chainSteps(steps: Filters[]): (readonly Candidate[])[] {
  const out: (readonly Candidate[])[] = [CANDIDATES];
  for (const s of steps) out.push(applyFilters(out[out.length - 1], s));
  return out;
}

// ---------- sorting ----------

export type SortKey = 'best' | 'new';

const GAISHI_RANK: Record<GaishiScore, number> = { A: 0, B: 1, C: 2, D: 3 };
const CLASS_RANK: Record<SchoolClass, number> = { S: 0, A: 1, Overseas: 1, B: 2, C: 3 };
const SENIORITY_RANK: Record<Seniority, number> = { Y: 0, B: 1, K: 2, 'S+': 3, S: 4 };

/** "Best CVs" is a placeholder rank: gaishi score, school class, seniority, then newest CV. */
export function sortCandidates(list: readonly Candidate[], key: SortKey): Candidate[] {
  const out = list.slice();
  if (key === 'new') {
    out.sort((a, b) => (a.cvUpdatedAt < b.cvUpdatedAt ? 1 : a.cvUpdatedAt > b.cvUpdatedAt ? -1 : 0));
  } else {
    out.sort(
      (a, b) =>
        GAISHI_RANK[a.gaishiScore] - GAISHI_RANK[b.gaishiScore] ||
        CLASS_RANK[a.schoolClass] - CLASS_RANK[b.schoolClass] ||
        SENIORITY_RANK[a.seniority] - SENIORITY_RANK[b.seniority] ||
        (a.cvUpdatedAt < b.cvUpdatedAt ? 1 : a.cvUpdatedAt > b.cvUpdatedAt ? -1 : 0),
    );
  }
  return out;
}

import { CANDIDATES, generateCandidates } from './data';
import {
  AGE_LIGHT,
  DECADES,
  DEGREES,
  GAISHI_SCORES,
  INDUSTRIES,
  LEVELS,
  MAJORS,
  POSITIONS,
  SCHOOL_CLASSES,
  SENIORITIES,
  type AgeFields,
  type Filters,
  type GaishiScore,
  type SchoolClass,
  type Seniority,
} from './types';

/**
 * Search engine over precomputed, column-oriented indexes.
 * Built once by initSearch(), before the first render (outside React): each candidate's fields become small
 * integers in typed arrays, so one filter pass over 4,860 candidates is a tight loop of array reads and bit tests.
 * A result set is a Uint32Array of candidate indexes into CANDIDATES.
 */

export const decadeOf = (age: number) => Math.min(60, Math.floor(age / 10) * 10);

/** Decades lit by the age control: the ticked ones, or the ones the slider range overlaps. */
export function litDecades(f: AgeFields): number[] {
  if (f.ageMode === 'decades') return f.decades;
  if (f.ageMode === 'range') return DECADES.filter((d) => f.ageMin <= d + (10 - AGE_LIGHT) && f.ageMax >= d + AGE_LIGHT);
  return [];
}

// ---------- indexes (built once) ----------

const indexOf = <T>(list: readonly T[]) => new Map(list.map((v, i) => [v, i]));
const GENDER_IDX = new Map([
  ['male', 0],
  ['female', 1],
  ['not_stated', 2],
]);

const columns = (n: number) => {
  const col = () => new Uint8Array(n);
  return {
    age: col(),
    gender: col(),
    seniority: col(),
    industry: col(),
    position: col(),
    english: col(),
    japanese: col(),
    gaishi: col(),
    degree: col(),
    schoolClass: col(),
    major: col(),
    foreign: col(),
    overseas: col(),
  };
};
let IX = columns(0);
/** Every candidate, in data order. */
export let ALL = new Uint32Array(0);
let member = new Uint8Array(0);

function buildIndexes() {
  const N = CANDIDATES.length;
  IX = columns(N);
  const sen = indexOf(SENIORITIES);
  const ind = indexOf(INDUSTRIES);
  const pos = indexOf(POSITIONS);
  const lvl = indexOf(LEVELS);
  const gs = indexOf(GAISHI_SCORES);
  const deg = indexOf(DEGREES);
  const cls = indexOf(SCHOOL_CLASSES);
  const maj = indexOf(MAJORS);
  CANDIDATES.forEach((c, i) => {
    IX.age[i] = c.age;
    IX.gender[i] = GENDER_IDX.get(c.gender)!;
    IX.seniority[i] = sen.get(c.seniority)!;
    IX.industry[i] = ind.get(c.industry)!;
    IX.position[i] = pos.get(c.position)!;
    IX.english[i] = lvl.get(c.englishLevel)!;
    IX.japanese[i] = lvl.get(c.japaneseLevel)!;
    IX.gaishi[i] = gs.get(c.gaishiScore)!;
    IX.degree[i] = deg.get(c.degree)!;
    IX.schoolClass[i] = cls.get(c.schoolClass)!;
    IX.major[i] = maj.get(c.major)!;
    IX.foreign[i] = Math.min(255, c.foreignCompanyCount);
    IX.overseas[i] = Math.min(255, c.yearsOverseas);
  });
  ALL = Uint32Array.from({ length: N }, (_, i) => i);
  member = new Uint8Array(N);
  ORDER = { best: ALL.slice().sort(byBest), new: ALL.slice().sort(byDate) };
}

let ready: Promise<void> | null = null;
/** Generate the sample data and build the indexes and sort orders. Runs once; the app renders after it. */
export function initSearch(): Promise<void> {
  ready ??= generateCandidates().then(buildIndexes);
  return ready;
}

/** Bitmask of the ticked values (bit = index in the list); 0 means "row not used". */
function mask<T>(selected: readonly T[], list: readonly T[]): number {
  let m = 0;
  for (const v of selected) {
    const i = list.indexOf(v);
    if (i >= 0) m |= 1 << i;
  }
  return m;
}

/**
 * Apply one step's filters to a result set.
 * Rules: inside one row ticked choices join with OR; rows join with AND; an empty row does not filter;
 * "at least" includes every higher level; text matches part of a word, ignoring case.
 */
export function runFilter(input: Uint32Array, f: Filters): Uint32Array {
  const q = (s: string) => s.trim().toLowerCase();
  const last = q(f.lastName);
  const first = q(f.firstName);
  const current = q(f.currentCompany);
  const prev = f.previousCompanies.map(q).filter(Boolean);
  const school = q(f.schoolName);
  const hasText = !!(last || first || current || prev.length || school);

  // Age: decades become an allowed [min, max] list; a range is one interval.
  const decades = f.ageMode === 'decades' && f.decades.length ? f.decades : null;
  const ageLo = f.ageMode === 'range' ? f.ageMin : 0;
  const ageHi = f.ageMode === 'range' ? f.ageMax : 255;

  const gender = mask(f.genders, ['male', 'female', 'not_stated']);
  const seniority = mask(f.seniority, SENIORITIES);
  const industry = mask(f.industries, INDUSTRIES);
  const position = mask(f.positions, POSITIONS);
  const gaishi = mask(f.gaishiScores, GAISHI_SCORES);
  const degree = mask(f.degrees, DEGREES);
  const schoolClass = mask(f.schoolClasses, SCHOOL_CLASSES);
  const major = mask(f.majors, MAJORS);
  const enMin = f.englishMin === 'any' ? 0 : LEVELS.indexOf(f.englishMin);
  const jaMin = f.japaneseMin === 'any' ? 0 : LEVELS.indexOf(f.japaneseMin);
  const foreignMin = f.foreign === 'once' ? 1 : f.foreign === 'twice' ? 2 : 0;
  const foreignNever = f.foreign === 'never';
  const overseas = f.overseas;

  const out = new Uint32Array(input.length);
  let n = 0;
  for (let k = 0; k < input.length; k++) {
    const i = input[k];
    const age = IX.age[i];
    if (age < ageLo || age > ageHi) continue;
    if (decades && !decades.includes(decadeOf(age))) continue;
    if (gender && !((gender >> IX.gender[i]) & 1)) continue;
    if (seniority && !((seniority >> IX.seniority[i]) & 1)) continue;
    if (industry && !((industry >> IX.industry[i]) & 1)) continue;
    if (position && !((position >> IX.position[i]) & 1)) continue;
    if (gaishi && !((gaishi >> IX.gaishi[i]) & 1)) continue;
    if (IX.english[i] < enMin || IX.japanese[i] < jaMin) continue;
    if (IX.foreign[i] < foreignMin || (foreignNever && IX.foreign[i] !== 0)) continue;
    if (overseas === 'yes' && IX.overseas[i] === 0) continue;
    if (overseas === 'no' && IX.overseas[i] !== 0) continue;
    if (degree && !((degree >> IX.degree[i]) & 1)) continue;
    if (schoolClass && !((schoolClass >> IX.schoolClass[i]) & 1)) continue;
    if (major && !((major >> IX.major[i]) & 1)) continue;
    if (hasText) {
      const lc = CANDIDATES[i].lc;
      if (last && !lc.last.includes(last)) continue;
      if (first && !lc.first.includes(first)) continue;
      if (current && !lc.current.includes(current)) continue;
      if (school && !lc.school.includes(school)) continue;
      let ok = true;
      for (const p of prev) if (!lc.prev.some((x) => x.includes(p))) ok = false;
      if (!ok) continue;
    }
    out[n++] = i;
  }
  return out.subarray(0, n);
}

/** Results of each locked step: index 0 is every candidate, index i+1 is step i applied to index i. */
export function chainSteps(steps: Filters[]): Uint32Array[] {
  const out: Uint32Array[] = [ALL];
  for (const s of steps) out.push(runFilter(out[out.length - 1], s));
  return out;
}

// ---------- sorting: two global orders computed once, then picked by membership (O(n), no re-sorting) ----------

export type SortKey = 'best' | 'new';

const GAISHI_RANK: Record<GaishiScore, number> = { A: 0, B: 1, C: 2, D: 3 };
const CLASS_RANK: Record<SchoolClass, number> = { S: 0, A: 1, Overseas: 1, B: 2, C: 3 };
const SENIORITY_RANK: Record<Seniority, number> = { Y: 0, B: 1, K: 2, 'S+': 3, S: 4 };
const byDate = (a: number, b: number) =>
  CANDIDATES[a].cvUpdatedAt < CANDIDATES[b].cvUpdatedAt ? 1 : CANDIDATES[a].cvUpdatedAt > CANDIDATES[b].cvUpdatedAt ? -1 : 0;

/** "Best CVs" is a placeholder rank: gaishi score, school class, seniority, then newest CV. */
const byBest = (a: number, b: number) => {
  const x = CANDIDATES[a];
  const y = CANDIDATES[b];
  return (
    GAISHI_RANK[x.gaishiScore] - GAISHI_RANK[y.gaishiScore] ||
    CLASS_RANK[x.schoolClass] - CLASS_RANK[y.schoolClass] ||
    SENIORITY_RANK[x.seniority] - SENIORITY_RANK[y.seniority] ||
    byDate(a, b)
  );
};
let ORDER: Record<SortKey, Uint32Array> = { best: ALL, new: ALL };

export function sortResults(set: Uint32Array, key: SortKey): Uint32Array {
  member.fill(0);
  for (let k = 0; k < set.length; k++) member[set[k]] = 1;
  const order = ORDER[key];
  const out = new Uint32Array(set.length);
  let n = 0;
  for (let k = 0; k < order.length && n < set.length; k++) if (member[order[k]]) out[n++] = order[k];
  return out;
}

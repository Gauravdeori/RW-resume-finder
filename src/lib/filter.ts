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
  QUALIFICATIONS,
  SCHOOL_RATINGS,
  SENIORITIES,
  type AgeFields,
  type Education,
  type Filters,
  type RowKey,
  type GaishiScore,
  type SchoolRating,
  type Seniority,
} from './types';

/**
 * Search engine over precomputed, column-oriented indexes.
 * Built once by initSearch(), before the first render (outside React): each candidate's fields become small
 * integers in typed arrays, so one filter pass over 4,860 candidates is a tight loop of array reads and bit tests.
 * A result set is a Uint32Array of candidate indexes into CANDIDATES.
 */

export const decadeOf = (age: number) => Math.min(60, Math.floor(age / 10) * 10);

/** A GPA on the school's own scale (4.0, 4.3, 5.0 or 100) moved to a 4.0 scale; null when the CV states none. */
export const gpaOn4 = (e: Pick<Education, 'gpa' | 'gpaScale'>): number | null => (e.gpa === null ? null : (e.gpa / e.gpaScale) * 4);

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
    /** Bit per degree held (bit = index in DEGREES). */
    degrees: col(),
    /** Major held with each degree (index in MAJORS), NO_MAJOR when none (MBA, or degree not held). */
    majorOf: DEGREES.map(() => col()),
    /** Bit per school rating over all the candidate's schools. */
    ratings: col(),
    /** The best rating (index in RATING_RANK order), for "Best CVs". */
    bestRating: col(),
    /** Best GPA on a 4.0 scale x 100 (0-400); NO_GPA when no GPA is stated. */
    gpa: new Uint16Array(n),
    /** Bit per qualification (index in QUALIFICATIONS). */
    quals: new Uint16Array(n),
    foreign: col(),
    overseas: col(),
  };
};
const NO_MAJOR = 255;
const NO_GPA = 0xffff;
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
  const rat = indexOf(SCHOOL_RATINGS);
  const maj = indexOf(MAJORS);
  const qual = indexOf(QUALIFICATIONS);
  CANDIDATES.forEach((c, i) => {
    IX.age[i] = c.age;
    IX.gender[i] = GENDER_IDX.get(c.gender)!;
    IX.seniority[i] = sen.get(c.seniority)!;
    IX.industry[i] = ind.get(c.industry)!;
    IX.position[i] = pos.get(c.position)!;
    IX.english[i] = lvl.get(c.englishLevel)!;
    IX.japanese[i] = lvl.get(c.japaneseLevel)!;
    IX.gaishi[i] = gs.get(c.gaishiScore)!;
    for (const m of IX.majorOf) m[i] = NO_MAJOR;
    let best = NO_GPA;
    let bestRank = 255;
    for (const e of c.education) {
      const d = deg.get(e.degree)!;
      IX.degrees[i] |= 1 << d;
      if (e.major) IX.majorOf[d][i] = maj.get(e.major)!;
      IX.ratings[i] |= 1 << rat.get(e.schoolRating)!;
      bestRank = Math.min(bestRank, RATING_RANK[e.schoolRating]);
      const g = gpaOn4(e);
      if (g !== null) best = best === NO_GPA ? Math.round(g * 100) : Math.max(best, Math.round(g * 100));
    }
    IX.bestRating[i] = bestRank;
    IX.gpa[i] = best;
    for (const q of c.qualifications) IX.quals[i] |= 1 << qual.get(q)!;
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

type RowTest = { key: RowKey; test: (i: number) => boolean };
const GENDER_LIST = ['male', 'female', 'not_stated'];

/**
 * One test per filter row that has something chosen (rows left empty do not filter).
 * Rules: inside one row ticked choices join with OR; "at least" includes every higher level;
 * text matches part of a word, ignoring case.
 */
function rowTests(f: Filters): RowTest[] {
  const tests: RowTest[] = [];
  const add = (key: RowKey, test: (i: number) => boolean) => tests.push({ key, test });
  const q = (s: string) => s.trim().toLowerCase();
  const bits = (key: RowKey, m: number, col: Uint8Array) => {
    if (m) add(key, (i) => ((m >> col[i]) & 1) === 1);
  };

  const last = q(f.lastName);
  const first = q(f.firstName);
  if (last || first)
    add('name', (i) => {
      const lc = CANDIDATES[i].lc;
      return (!last || lc.last.includes(last)) && (!first || lc.first.includes(first));
    });
  const current = q(f.currentCompany);
  const prev = f.previousCompanies.map(q).filter(Boolean);
  if (current || prev.length)
    add('company', (i) => {
      const lc = CANDIDATES[i].lc;
      if (current && !lc.current.includes(current)) return false;
      return prev.every((p) => lc.prev.some((x) => x.includes(p)));
    });
  if (f.ageMode === 'decades' && f.decades.length) {
    const decades = f.decades;
    add('age', (i) => decades.includes(decadeOf(IX.age[i])));
  } else if (f.ageMode === 'range') {
    const lo = f.ageMin;
    const hi = f.ageMax;
    add('age', (i) => IX.age[i] >= lo && IX.age[i] <= hi);
  }
  bits('gender', mask(f.genders, GENDER_LIST), IX.gender);
  bits('seniority', mask(f.seniority, SENIORITIES), IX.seniority);
  bits('industry', mask(f.industries, INDUSTRIES), IX.industry);
  bits('position', mask(f.positions, POSITIONS), IX.position);
  bits('gaishi', mask(f.gaishiScores, GAISHI_SCORES), IX.gaishi);
  if (f.foreign === 'never') add('foreign', (i) => IX.foreign[i] === 0);
  else if (f.foreign !== 'any') {
    const min = f.foreign === 'once' ? 1 : 2;
    add('foreign', (i) => IX.foreign[i] >= min);
  }
  if (f.englishMin !== 'any') {
    const min = LEVELS.indexOf(f.englishMin);
    add('english', (i) => IX.english[i] >= min);
  }
  if (f.japaneseMin !== 'any') {
    const min = LEVELS.indexOf(f.japaneseMin);
    add('japanese', (i) => IX.japanese[i] >= min);
  }
  if (f.overseas === 'yes') add('overseas', (i) => IX.overseas[i] !== 0);
  if (f.overseas === 'no') add('overseas', (i) => IX.overseas[i] === 0);
  // Degree: holds any ticked degree; where a major is picked for it, with that major for that same degree.
  if (f.degrees.length) {
    const wanted = f.degrees
      .map((d) => DEGREES.indexOf(d))
      .filter((d) => d >= 0)
      .map((d) => {
        const major = f.majorFor[DEGREES[d]];
        return { bit: 1 << d, majors: IX.majorOf[d], major: major ? MAJORS.indexOf(major) : -1 };
      });
    add('degree', (i) => wanted.some((w) => (IX.degrees[i] & w.bit) !== 0 && (w.major < 0 || w.majors[i] === w.major)));
  }
  const ratings = mask(f.schoolRatings, SCHOOL_RATINGS);
  if (ratings) add('schoolRating', (i) => (IX.ratings[i] & ratings) !== 0);
  if (f.gpaMin !== null && f.gpaMin > 0) {
    const min = Math.round(f.gpaMin * 100);
    add('gpa', (i) => IX.gpa[i] !== NO_GPA && IX.gpa[i] >= min);
  }
  // Qualifications: any ticked one, or the typed text found in any qualification on the CV.
  const quals = mask(f.qualifications, QUALIFICATIONS);
  const qualText = q(f.qualText);
  if (quals || qualText)
    add('qualification', (i) => (IX.quals[i] & quals) !== 0 || (!!qualText && CANDIDATES[i].lc.quals.includes(qualText)));
  const school = q(f.schoolName);
  if (school) add('school', (i) => CANDIDATES[i].lc.schools.some((s) => s.includes(school)));
  return tests;
}

/**
 * Apply one step's filters to a result set. Rows join with AND. Only required rows filter: rows marked
 * "nice to have" leave everyone in (they rank results instead, see preferenceScores).
 */
export function runFilter(input: Uint32Array, f: Filters): Uint32Array {
  const optional = new Set(f.optional);
  const tests = rowTests(f)
    .filter((r) => !optional.has(r.key))
    .map((r) => r.test);
  if (!tests.length) return input;
  const out = new Uint32Array(input.length);
  let n = 0;
  next: for (let k = 0; k < input.length; k++) {
    const i = input[k];
    for (const test of tests) if (!test(i)) continue next;
    out[n++] = i;
  }
  return out.subarray(0, n);
}

/** How many nice-to-have rows (over all steps) each candidate matches, indexed by candidate. */
export interface Preferences {
  scores: Uint8Array;
  /** Number of nice-to-have rows in use. */
  total: number;
}

/** Scores for the candidates in `set`; null when no row is marked nice to have. */
export function preferenceScores(set: Uint32Array, steps: Filters[]): Preferences | null {
  const tests = steps.flatMap((f) => {
    const optional = new Set(f.optional);
    return rowTests(f)
      .filter((r) => optional.has(r.key))
      .map((r) => r.test);
  });
  if (!tests.length) return null;
  const scores = new Uint8Array(CANDIDATES.length);
  for (let k = 0; k < set.length; k++) {
    const i = set[k];
    let s = 0;
    for (const test of tests) if (test(i)) s++;
    scores[i] = s;
  }
  return { scores, total: tests.length };
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
const RATING_RANK: Record<SchoolRating, number> = { S: 0, A: 1, Overseas: 1, B: 2, C: 3 };
const SENIORITY_RANK: Record<Seniority, number> = { Y: 0, B: 1, K: 2, 'S+': 3, S: 4 };
const byDate = (a: number, b: number) =>
  CANDIDATES[a].cvUpdatedAt < CANDIDATES[b].cvUpdatedAt ? 1 : CANDIDATES[a].cvUpdatedAt > CANDIDATES[b].cvUpdatedAt ? -1 : 0;

/** "Best CVs" is a placeholder rank: gaishi score, best school rating, seniority, then newest CV. */
const byBest = (a: number, b: number) => {
  const x = CANDIDATES[a];
  const y = CANDIDATES[b];
  return (
    GAISHI_RANK[x.gaishiScore] - GAISHI_RANK[y.gaishiScore] ||
    IX.bestRating[a] - IX.bestRating[b] ||
    SENIORITY_RANK[x.seniority] - SENIORITY_RANK[y.seniority] ||
    byDate(a, b)
  );
};
let ORDER: Record<SortKey, Uint32Array> = { best: ALL, new: ALL };

/**
 * Order a result set. With nice-to-have rows, "Best CVs" puts candidates who match more of them first
 * (keeping the usual order within each group); "New CVs" stays purely by date.
 */
export function sortResults(set: Uint32Array, key: SortKey, prefs?: Preferences | null): Uint32Array {
  member.fill(0);
  for (let k = 0; k < set.length; k++) member[set[k]] = 1;
  const order = ORDER[key];
  const out = new Uint32Array(set.length);
  let n = 0;
  for (let k = 0; k < order.length && n < set.length; k++) if (member[order[k]]) out[n++] = order[k];
  if (!prefs || key !== 'best') return out;

  // Stable bucket sort by score, highest first.
  const { scores, total } = prefs;
  const starts = new Uint32Array(total + 2);
  for (let k = 0; k < out.length; k++) starts[total - scores[out[k]] + 1]++;
  for (let b = 1; b < starts.length; b++) starts[b] += starts[b - 1];
  const ranked = new Uint32Array(out.length);
  for (let k = 0; k < out.length; k++) ranked[starts[total - scores[out[k]]]++] = out[k];
  return ranked;
}

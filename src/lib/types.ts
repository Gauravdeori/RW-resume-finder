export const LEVELS = ['Basic', 'Conversational', 'Business', 'Fluent', 'Native'] as const;
export type Level = (typeof LEVELS)[number];

export const SENIORITIES = ['S', 'S+', 'K', 'B', 'Y'] as const;
export type Seniority = (typeof SENIORITIES)[number];

export const INDUSTRIES = [
  'technology',
  'financial',
  'healthcare',
  'manufacturing',
  'consumer',
  'telecoms',
  'professional',
  'energy',
] as const;
export type Industry = (typeof INDUSTRIES)[number];

export const POSITIONS = ['sales', 'marketing', 'finance', 'hr', 'it', 'legal', 'supply', 'gm'] as const;
export type Position = (typeof POSITIONS)[number];

export const MAJORS = ['business', 'engineering', 'science', 'law', 'humanities', 'infosci'] as const;
export type Major = (typeof MAJORS)[number];

export const DEGREES = ["Bachelor's", "Master's", 'MBA', 'PhD'] as const;
export type Degree = (typeof DEGREES)[number];

/** MBA has no major; Bachelor's, Master's and PhD each have their own. */
export const DEGREES_WITH_MAJOR: readonly Degree[] = ["Bachelor's", "Master's", 'PhD'];

/** School rating (draft list, to be confirmed by Robert Walters): S top, A strong, B solid, C other, Overseas outside Japan. */
export const SCHOOL_RATINGS = ['S', 'A', 'B', 'C', 'Overseas'] as const;
export type SchoolRating = (typeof SCHOOL_RATINGS)[number];

export const QUALIFICATIONS = ['cpa', 'uscpa', 'cfa', 'pmp', 'cia', 'bookkeeping', 'itcert', 'bengoshi', 'sharoushi'] as const;
export type Qualification = (typeof QUALIFICATIONS)[number];

/** JLPT, easiest (N5) to hardest (N1). */
export const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
export type Jlpt = (typeof JLPT_LEVELS)[number];

/** Minimum GPA filter: 0.0 to 4.0 in steps of 0.1 (every GPA is normalised to a 4.0 scale). */
export const GPA_MAX = 4;

export const GAISHI_SCORES = ['A', 'B', 'C', 'D'] as const;
export type GaishiScore = (typeof GAISHI_SCORES)[number];

export const DECADES = [20, 30, 40, 50, 60] as const;
export const AGE_MIN = 20;
export const AGE_MAX = 69;
/**
 * When a typed or dragged age range lights a decade button: only when the range covers MOST of that decade.
 * The upper end must reach the decade's 6th year (50s: 56 or more), and the lower end must start no later than
 * 10 - 6 = 4 years in (40s: 44 or less). 50-55 leaves the 50s unlit; 50-56 lights it. Change this one number to tune.
 */
export const AGE_LIGHT = 6;

export type Gender = 'male' | 'female' | 'not_stated';
export type FilterGender = 'male' | 'female';

export interface PreviousCompany {
  company: string;
  title: string;
  startYear: number;
  endYear: number;
  isForeign: boolean;
}

/** One degree the candidate holds. GPA is on the school's own scale (gpaScale: 4.0, 4.3, 5.0 or 100); null = not stated. */
export interface Education {
  degree: Degree;
  /** null for an MBA (no major). */
  major: Major | null;
  school: string;
  schoolRating: SchoolRating;
  gpa: number | null;
  gpaScale: number;
}

export interface Candidate {
  id: string;
  lastName: string;
  firstName: string;
  dateOfBirth: string; // ISO date
  age: number; // computed from dateOfBirth on the search date
  gender: Gender;
  currentCompany: string;
  currentTitle: string;
  currentStartYear: number;
  currentIsForeign: boolean;
  previousCompanies: PreviousCompany[];
  seniority: Seniority;
  industry: Industry;
  position: Position;
  englishLevel: Level;
  japaneseLevel: Level;
  foreignCompanyCount: number;
  yearsOverseas: number;
  gaishiScore: GaishiScore;
  /** TOEIC score, when the CV states one. */
  toeicScore: number | null;
  /** JLPT level, when the CV states one (native Japanese speakers have none). */
  jlpt: Jlpt | null;
  /** Every degree held, in the order earned: the highest is last. */
  education: Education[];
  qualifications: Qualification[];
  /** Qualifications outside the standard list, as written on the CV. */
  otherQualifications: string[];
  cvUpdatedAt: string; // ISO date
  yearsExperience: number;
  /** Lower-cased copies for fast partial text matching. */
  lc: { last: string; first: string; current: string; prev: string[]; schools: string[]; quals: string };
}

/** The highest degree: the one shown on result cards. */
export const topEducation = (c: Candidate): Education => c.education[c.education.length - 1];

export type ForeignFilter = 'any' | 'never' | 'once' | 'twice';
export type OverseasFilter = 'any' | 'yes' | 'no';
export type AgeMode = 'any' | 'decades' | 'range';
export type LevelFilter = 'any' | Level;

export interface Filters {
  lastName: string;
  firstName: string;
  currentCompany: string;
  previousCompanies: string[];
  ageMode: AgeMode;
  decades: number[];
  ageMin: number;
  ageMax: number;
  genders: FilterGender[];
  seniority: Seniority[];
  industries: Industry[];
  positions: Position[];
  gaishiScores: GaishiScore[];
  foreign: ForeignFilter;
  englishMin: LevelFilter;
  /** TOEIC score typed by the recruiter; it sets englishMin (the level is what filters). */
  toeic: number | null;
  japaneseMin: LevelFilter;
  /** JLPT level picked by the recruiter; it sets japaneseMin (the level is what filters). */
  jlpt: Jlpt | null;
  overseas: OverseasFilter;
  degrees: Degree[];
  /** Major picked for a ticked degree (never for MBA). Matches only that same degree. */
  majorFor: Partial<Record<Degree, Major>>;
  schoolRatings: SchoolRating[];
  /** Minimum GPA on a 4.0 scale; null = any. */
  gpaMin: number | null;
  qualifications: Qualification[];
  /** Free text matched against every qualification on the CV. */
  qualText: string;
  schoolName: string;
  /**
   * Filter rows marked "nice to have" (their Required box unticked). They do not leave anyone out;
   * candidates who match them rank first. Every other row is required. Empty = all required.
   */
  optional: RowKey[];
}

/** One filter row: the unit that can be required or nice to have. */
export const ROW_KEYS = [
  'name',
  'company',
  'age',
  'gender',
  'seniority',
  'industry',
  'position',
  'gaishi',
  'foreign',
  'english',
  'japanese',
  'overseas',
  'degree',
  'schoolRating',
  'gpa',
  'qualification',
  'school',
] as const;
export type RowKey = (typeof ROW_KEYS)[number];

/** The four fields the age control reads and writes. */
export type AgeFields = Pick<Filters, 'ageMode' | 'decades' | 'ageMin' | 'ageMax'>;

export function emptyFilters(): Filters {
  return {
    lastName: '',
    firstName: '',
    currentCompany: '',
    previousCompanies: [''],
    ageMode: 'any',
    decades: [],
    ageMin: AGE_MIN,
    ageMax: AGE_MAX,
    genders: [],
    seniority: [],
    industries: [],
    positions: [],
    gaishiScores: [],
    foreign: 'any',
    englishMin: 'any',
    toeic: null,
    japaneseMin: 'any',
    jlpt: null,
    overseas: 'any',
    degrees: [],
    majorFor: {},
    schoolRatings: [],
    gpaMin: null,
    qualifications: [],
    qualText: '',
    schoolName: '',
    optional: [],
  };
}

/** Filters stored before "School class" became "School rating" and majors moved onto their degree. */
type OldFilters = Partial<Filters> & { schoolClasses?: SchoolRating[]; majors?: unknown };

/** Fill in any fields missing from older stored filters (saved and recent searches). */
export function normalizeFilters(f: OldFilters): Filters {
  const { schoolClasses, majors: _majors, ...rest } = f;
  const base = { ...emptyFilters(), ...rest };
  if (!f.schoolRatings && Array.isArray(schoolClasses)) base.schoolRatings = schoolClasses;
  if (!Array.isArray(base.previousCompanies) || base.previousCompanies.length === 0) base.previousCompanies = [''];
  if (!base.majorFor || typeof base.majorFor !== 'object') base.majorFor = {};
  if (!Array.isArray(base.optional)) base.optional = [];
  base.optional = base.optional
    .map((r) => ((r as string) === 'schoolClass' ? 'schoolRating' : r))
    .filter((r): r is RowKey => (ROW_KEYS as readonly string[]).includes(r));
  return base;
}

export function cloneFilters(f: Filters): Filters {
  return JSON.parse(JSON.stringify(f)) as Filters;
}

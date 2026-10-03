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

export const SCHOOL_CLASSES = ['S', 'A', 'B', 'C', 'Overseas'] as const;
export type SchoolClass = (typeof SCHOOL_CLASSES)[number];

export const GAISHI_SCORES = ['A', 'B', 'C', 'D'] as const;
export type GaishiScore = (typeof GAISHI_SCORES)[number];

export const DECADES = [20, 30, 40, 50, 60] as const;
export const AGE_MIN = 20;
export const AGE_MAX = 69;

export type Gender = 'male' | 'female' | 'not_stated';
export type FilterGender = 'male' | 'female';

export interface PreviousCompany {
  company: string;
  title: string;
  startYear: number;
  endYear: number;
  isForeign: boolean;
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
  degree: Degree;
  major: Major;
  school: string;
  schoolClass: SchoolClass;
  cvUpdatedAt: string; // ISO date
  yearsExperience: number;
  /** Lower-cased copies for fast partial text matching. */
  lc: { last: string; first: string; current: string; prev: string[]; school: string };
}

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
  japaneseMin: LevelFilter;
  overseas: OverseasFilter;
  degrees: Degree[];
  schoolClasses: SchoolClass[];
  majors: Major[];
  schoolName: string;
}

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
    japaneseMin: 'any',
    overseas: 'any',
    degrees: [],
    schoolClasses: [],
    majors: [],
    schoolName: '',
  };
}

/** Fill in any fields missing from older stored filters. */
export function normalizeFilters(f: Partial<Filters>): Filters {
  const base = { ...emptyFilters(), ...f };
  if (!Array.isArray(base.previousCompanies) || base.previousCompanies.length === 0) base.previousCompanies = [''];
  return base;
}

export function cloneFilters(f: Filters): Filters {
  return JSON.parse(JSON.stringify(f)) as Filters;
}

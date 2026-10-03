import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  Candidate,
  Degree,
  ForeignFilter,
  Gender,
  Industry,
  Level,
  Major,
  OverseasFilter,
  Position,
  SchoolClass,
  Seniority,
} from './types';

/**
 * Every UI label lives here (English) and in i18n-ja.ts (Japanese, loaded on demand). Components never hard-code text.
 * Candidate data (names, job titles, companies, schools) is shown as stored.
 */

export type Lang = 'en' | 'ja';

export const fmtNum = (n: number) => n.toLocaleString('en-US');

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

export function splitIso(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const en = {
  appName: 'Resume Finder',
  brandTop: 'Robert—',
  brandBottom: '—Walters',
  brandLabel: 'Robert Walters',
  /** The search page is listed under the product name, Resume Finder. */
  nav: { search: 'Resume Finder', upload: 'Upload Resume', dashboard: 'Dashboard', admin: 'Admin' },
  /** Shorter labels for the phone tab strip. */
  navShort: { search: 'Resume Finder', upload: 'Upload', dashboard: 'Dashboard', admin: 'Admin' },
  homeLabel: 'Robert Walters, Resume Finder home',
  mainNav: 'Main',
  signOut: 'Sign out',
  language: 'Language',
  darkMode: 'Dark mode',
  switchToLight: 'Switch to light mode',
  switchToDark: 'Switch to dark mode',
  savedSearches: 'Saved searches',
  savedShort: 'Saved',
  noSavedSearches: 'No saved searches yet. Use “Save search” to keep one.',
  deleteSaved: (name: string) => `Delete “${name}”`,
  searchesInRow: (n: number) => `${n} searches in a row`,

  pageTitle: 'Find candidates',
  pageSub: 'Tick what the role needs. The count updates with every click.',
  filtersLabel: 'Search filters',

  jdTitle: 'Start from a job description',
  jdLabel: 'Job description',
  jdPlaceholder: 'Paste a job description here, then press “Fill filters from this text”.',
  jdFill: 'Fill filters from this text',
  jdExample: 'Use an example',
  jdFilled: (n: number) => (n === 1 ? '1 filter filled. Check it and fix it if it is wrong.' : `${n} filters filled. Check them and fix any that are wrong.`),
  jdNone: 'No filters found in this text. Tick them below instead.',
  jdEmpty: 'Paste a job description first.',

  rowName: 'Name',
  lastName: 'Last name',
  firstName: 'First name',
  rowCompany: 'Company',
  currentCompany: 'Current company',
  previousCompany: 'Previous company',
  addPrevious: 'Add another previous company',
  removePrevious: 'Remove this previous company',

  rowAge: 'Age',
  decade: (d: number) => `${d}s`,
  anyAge: 'Any age',
  ageRange: (a: number, b: number) => `Ages ${a} to ${b}`,
  ageMinLabel: 'Youngest age',
  ageMaxLabel: 'Oldest age',

  rowGender: 'Gender',
  gender: { male: 'Male', female: 'Female', not_stated: 'Not stated' } as Record<Gender, string>,

  rowSeniority: 'Seniority',
  seniorityButton: { S: 'Staff', 'S+': 'Senior staff', K: 'Kachō, manager', B: 'Buchō, department head', Y: 'Yakuin, executive' } as Record<Seniority, string>,
  seniorityShort: { S: 'Staff', 'S+': 'Senior staff', K: 'Kachō', B: 'Buchō', Y: 'Yakuin' } as Record<Seniority, string>,
  seniorityFact: (s: Seniority) => `${en.seniorityShort[s]} (${s})`,

  rowIndustry: 'Industry',
  industry: {
    technology: 'Technology',
    financial: 'Financial services',
    healthcare: 'Healthcare and pharma',
    manufacturing: 'Manufacturing',
    consumer: 'Consumer and retail',
    telecoms: 'Telecoms',
    professional: 'Professional services',
    energy: 'Energy and infrastructure',
  } as Record<Industry, string>,
  rowPosition: 'Position',
  position: {
    sales: 'Sales',
    marketing: 'Marketing',
    finance: 'Finance and accounting',
    hr: 'Human resources',
    it: 'IT and engineering',
    legal: 'Legal and compliance',
    supply: 'Supply chain',
    gm: 'General management',
  } as Record<Position, string>,

  rowGaishi: 'Gaishi',
  gaishiSub: 'Fit for foreign-affiliated companies',
  gaishiScore: 'Gaishi score',
  gaishiHelp: 'A is the strongest. Built from English level, foreign-company experience and time overseas.',
  foreignLabel: 'Worked at a foreign company',
  foreign: { any: 'Any', never: 'Never', once: 'At least once', twice: 'Twice or more' } as Record<ForeignFilter, string>,
  englishAtLeast: 'English, at least',
  japaneseAtLeast: 'Japanese, at least',
  any: 'Any',
  level: { Basic: 'Basic', Conversational: 'Conversational', Business: 'Business', Fluent: 'Fluent', Native: 'Native' } as Record<Level, string>,
  overseasLabel: 'Lived overseas',
  overseas: { any: 'Any', yes: 'Yes', no: 'No' } as Record<OverseasFilter, string>,

  rowEducation: 'Education',
  degreeLabel: 'Degree',
  degree: { "Bachelor's": "Bachelor's", "Master's": "Master's", MBA: 'MBA', PhD: 'PhD' } as Record<Degree, string>,
  schoolClassLabel: 'School class',
  schoolClass: { S: 'S', A: 'A', B: 'B', C: 'C', Overseas: 'Overseas' } as Record<SchoolClass, string>,
  majorLabel: 'Major',
  major: {
    business: 'Business and economics',
    engineering: 'Engineering',
    science: 'Science',
    law: 'Law and politics',
    humanities: 'Humanities',
    infosci: 'Information science',
  } as Record<Major, string>,
  schoolName: 'School name',

  countMatch: 'candidates match',
  ofDatabase: (n: string) => `of ${n} in the database`,
  ofCurrent: (n: string) => `of ${n} in the current results`,
  ofShort: (n: string) => `of ${n}`,
  showN: (n: number) => (n === 1 ? 'Show 1 candidate' : `Show ${fmtNum(n)} candidates`),
  saveSearch: 'Save search',
  clearAll: 'Clear all filters',
  activeFilters: 'Active filters',
  sections: { basics: 'Basics', role: 'Role', gaishi: 'Gaishi fit', education: 'Education' },
  nSelected: (n: number) => `${n} selected`,
  filtersButton: (n: number) => (n ? `Filters (${n})` : 'Filters'),
  filtersTitle: 'Filters',
  resultsLabel: 'Results',
  ofInSearch: (n: string, k: number) => `of ${n} in search ${k}`,
  closeCv: 'Close CV',
  noActive: 'Nothing ticked yet. Every candidate matches.',
  removeChip: (label: string) => `Remove ${label}`,
  zero: 'No candidates match. Remove a filter to widen the search.',

  resultsTitle: (n: number) => (n === 1 ? '1 candidate' : `${fmtNum(n)} candidates`),
  searchWithin: 'Search within these results',
  editFilters: 'Edit filters',
  newSearch: 'New search',
  trailLabel: 'Search steps',
  allCandidates: 'All candidates',
  searchN: (n: number) => `Search ${n}`,
  searchingWithin: (n: number, k: number) => `Searching within the ${fmtNum(n)} candidates from search ${k}.`,
  editingSearch: (k: number) => `Editing search ${k}.`,
  backToResults: 'Back to results',
  sortBy: 'Sort by',
  sortBest: 'Best CVs',
  sortNew: 'New CVs',
  resultsZero: 'No candidates match these searches. Edit the filters or start a new search.',
  showMore: 'Show 10 more',
  showingOf: (a: number, b: number) => `Showing ${fmtNum(a)} of ${fmtNum(b)}`,

  factAge: 'Age',
  factSeniority: 'Seniority',
  factEnglish: 'English',
  factJapanese: 'Japanese',
  factGaishi: 'Gaishi score',
  factSchool: 'School',
  schoolWithClass: (school: string, cls: SchoolClass) => (cls === 'Overseas' ? school : `${school} (${cls} class)`),
  previouslyAt: 'Previously at',
  openCv: 'Open CV',
  openCvFor: (name: string) => `Open CV for ${name}`,

  displayName: (c: Candidate) => `${c.firstName} ${c.lastName}`,
  titleAt: (c: Candidate) => `${c.currentTitle}, ${c.currentCompany}`,
  summary: (c: Candidate) => {
    const overseas = c.yearsOverseas > 0 ? `${plural(c.yearsOverseas, 'year', 'years')} overseas` : 'no time overseas';
    const foreign = c.foreignCompanyCount > 0 ? plural(c.foreignCompanyCount, 'foreign company', 'foreign companies') : 'no foreign companies';
    return `${plural(c.yearsExperience, 'year', 'years')} of experience in ${en.industry[c.industry].toLowerCase()}. ${en.level[c.englishLevel]} English, ${overseas}, ${foreign}. CV updated ${en.formatDate(c.cvUpdatedAt)}`;
  },
  formatDate: (iso: string) => {
    const { y, m, d } = splitIso(iso);
    return `${d} ${MONTHS_EN[m - 1]} ${y}`;
  },

  cvDialog: (name: string) => `CV of ${name}`,
  cvProfile: 'Profile',
  cvExperience: 'Experience',
  cvEducation: 'Education',
  cvLanguages: 'Languages',
  close: 'Close',
  toPresent: (y: number) => `${y} to present`,
  yearRange: (a: number, b: number) => `${a} to ${b}`,
  profileText: (c: Candidate) => {
    const abroad = c.yearsOverseas > 0 ? `Lived overseas for ${plural(c.yearsOverseas, 'year', 'years')}.` : 'Has not lived overseas.';
    return `${c.currentTitle} with ${plural(c.yearsExperience, 'year', 'years')} of experience in ${en.industry[c.industry].toLowerCase()}, working in ${en.position[c.position].toLowerCase()}. ${en.level[c.englishLevel]} English and ${en.level[c.japaneseLevel].toLowerCase()} Japanese. ${abroad}`;
  },
  educationText: (c: Candidate) => `${en.degree[c.degree]}, ${en.major[c.major]}. ${c.school}.`,
  languagesText: (c: Candidate) => `Japanese: ${en.level[c.japaneseLevel]}. English: ${en.level[c.englishLevel]}.`,

  nameThisSearch: 'Name this search',
  searchName: 'Search name',
  cancel: 'Cancel',
  save: 'Save',

  chip: {
    last: (v: string) => `Last name: ${v}`,
    first: (v: string) => `First name: ${v}`,
    current: (v: string) => `Now at: ${v}`,
    previous: (v: string) => `Previously at: ${v}`,
    gaishi: (v: string) => `Gaishi score ${v}`,
    english: (l: Level) => `English: ${en.level[l]}+`,
    japanese: (l: Level) => `Japanese: ${en.level[l]}+`,
    foreign: (v: ForeignFilter) => `Foreign company: ${en.foreign[v]}`,
    overseas: (v: OverseasFilter) => `Lived overseas: ${en.overseas[v]}`,
    schoolClass: (c: SchoolClass) => (c === 'Overseas' ? 'Overseas school' : `${c} class`),
    school: (v: string) => `School: ${v}`,
    none: 'No filters',
  },

  /** Words used to suggest a name for a saved search. */
  nameParts: {
    industry: {
      technology: 'tech',
      financial: 'finance sector',
      healthcare: 'healthcare',
      manufacturing: 'manufacturing',
      consumer: 'consumer and retail',
      telecoms: 'telecoms',
      professional: 'professional services',
      energy: 'energy sector',
    } as Record<Industry, string>,
    position: {
      sales: 'sales',
      marketing: 'marketing',
      finance: 'finance',
      hr: 'HR',
      it: 'engineering',
      legal: 'legal',
      supply: 'supply chain',
      gm: 'general management',
    } as Record<Position, string>,
    seniority: { S: 'staff', 'S+': 'senior staff', K: 'managers', B: 'department heads', Y: 'executives' } as Record<Seniority, string>,
    people: 'candidates',
    bilingual: 'Bilingual',
    inTheir: (d: number) => `in their ${d}s`,
    fallback: 'My search',
    join: ' ',
  },

  /** Upload Resume and Dashboard pages (Resume Studio look, dummy data). */
  studio: {
    eyebrow: (user: string) => `Welcome back, ${user}`,
    titleBefore: 'Give me a resume for ',
    titleAccent: 'conversion',
    titleAfter: '',
    uploadTitle: 'Upload resume file or select a previous file from',
    uploadLink: 'Dashboard',
    uploadSub: 'Upload a resume to review and convert.',
    dropTitle: 'Drop your resume here',
    dropSub: 'or click to browse',
    dropActive: 'Drop to add this file',
    fileNote: (mb: number) => `Maximum file size: ${mb} MB · Processed on RW infrastructure`,
    removeFile: 'Remove file',
    errType: 'This file type is not supported. Use PDF, DOCX, DOC, XLSX, XLS or TXT.',
    errSize: (mb: number) => `This file is larger than ${mb} MB.`,
    start: 'Start conversion',
    converting: 'Converting…',
    done: (name: string) => `${name} is converted and listed on the dashboard.`,
    doneReview: (name: string) => `${name} is converted and waiting for review on the dashboard.`,
    viewDashboard: 'View on Dashboard',
    settingsTitle: 'Conversion settings',
    settingsSub:
      'Select the source and output language. Same-language options keep the content in the original language; cross-language options translate the resume before export.',
    pairHelp: {
      'ja-ja': 'Keep a Japanese resume in Japanese.',
      'en-en': 'Keep an English resume in English.',
      'ja-en': 'Translate a Japanese resume to English.',
      'en-ja': 'Translate an English resume to Japanese.',
    } as Record<string, string>,
    langShort: { ja: '日本語', en: 'EN' } as Record<'ja' | 'en', string>,
    langCode: { ja: 'JA', en: 'EN' } as Record<'ja' | 'en', string>,
    output: (lang: 'ja' | 'en') => `${lang === 'ja' ? 'Japanese' : 'English'} output`,
    modeTitle: 'Conversion mode',
    mode: { exact: 'Exact Wording', optimized: 'Optimized Mode' } as Record<'exact' | 'optimized', string>,
    modeHelp: {
      exact: "Keep the candidate's wording as close to the source as possible.",
      optimized: 'Tidy the wording and structure into a clearer, recruiter-ready resume.',
    } as Record<'exact' | 'optimized', string>,
    engineTitle: 'Conversion engine',
    engine: { standard: 'Standard', complex: 'Complex' } as Record<'standard' | 'complex', string>,
    engineHelp: {
      standard: 'The proven engine. Single- or dual-language files and table layouts are detected automatically.',
      complex: 'For dense or unusual layouts: multi-column pages, nested tables and mixed languages. Slower.',
    } as Record<'standard' | 'complex', string>,

    dashTitle: 'Dashboard',
    statTotal: 'Total (this page)',
    statExported: 'Successful exports',
    statReview: 'Awaiting review',
    statCross: 'Cross-language',
    listTitle: 'Conversions',
    listMeta: (n: number, keep: number) => `${n} on this page · Auto-trimmed to last ${keep}`,
    col: { num: '#', file: 'File', status: 'Status', by: 'Uploaded by', size: 'Size', created: 'Created' },
    status: { exported: 'Exported', review: 'Awaiting review' } as Record<'exported' | 'review', string>,
    you: (user: string) => `${user} (you)`,
    tagSingle: 'Single Language',
    tagDual: 'Dual Language',
    tagTables: 'Has Tables',
    tagNoTables: 'No Tables',
    size: (kb: number) => `${kb.toFixed(1)} KB`,
    created: (iso: string) => {
      const d = new Date(iso);
      const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
      return `${mon} ${String(d.getDate()).padStart(2, '0')} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    },
    edit: 'Edit',
    editFor: (name: string) => `Edit ${name}`,
    deleteFor: (name: string) => `Delete ${name}`,
    deleted: (name: string) => `${name} deleted.`,
    undo: 'Undo',
    empty: 'No conversions yet. Upload a resume to get started.',
    uploadCta: 'Upload Resume',
    detailTitle: (id: number) => `Conversion #${id}`,
    detailNote: 'In Resume Studio, Edit opens the side-by-side editor. This prototype shows the conversion details only.',
    detailLanguage: 'Languages',
    detailFile: 'File',
  },

  /** Admin page (dummy users and activity; search settings really apply). */
  admin: {
    eyebrow: 'Robert Walters Japan · Workspace',
    title: 'Admin',
    statUsers: 'Users',
    statActive: 'Active this week',
    statInvites: 'Pending invites',
    statConversions: 'Conversions on dashboard',
    usersTitle: 'Users',
    usersSub: 'Who can use Resume Studio and Resume Finder in this workspace.',
    invite: 'Invite user',
    inviteName: 'Name',
    inviteEmail: 'Work email',
    inviteRole: 'Role',
    sendInvite: 'Send invite',
    errName: 'Enter a name.',
    errEmail: 'Enter a valid email address.',
    errDuplicate: 'This email address is already in the list.',
    invited: (name: string) => `Invite sent to ${name}.`,
    role: { admin: 'Admin', recruiter: 'Recruiter', viewer: 'Viewer' } as Record<'admin' | 'recruiter' | 'viewer', string>,
    status: { active: 'Active', invited: 'Invited', deactivated: 'Deactivated' } as Record<'active' | 'invited' | 'deactivated', string>,
    you: '(you)',
    lastActive: (when: string) => `Last active ${when}`,
    neverActive: 'Not signed in yet',
    deactivate: 'Deactivate',
    activate: 'Activate',
    resend: 'Resend invite',
    roleFor: (name: string) => `Role for ${name}`,
    removeUser: (name: string) => `Remove ${name}`,
    settingsTitle: 'Search settings',
    settingsSub: 'Changes apply to the Search page straight away.',
    setting: { gender: 'Gender filter', jd: 'Start from a job description' } as Record<'gender' | 'jd', string>,
    settingHelp: {
      gender: 'Some countries do not allow filtering by gender. When off, the filter is hidden and ignored in every search.',
      jd: 'Lets recruiters paste a job description to fill the filters.',
    } as Record<'gender' | 'jd', string>,
    defaultLang: 'Default language for new users',
    langName: { en: 'English', ja: 'Japanese' } as Record<'en' | 'ja', string>,
    demoTitle: 'Demo data',
    demoSub: 'Put saved searches, dashboard conversions, users, settings and activity back to the sample data. Handy before a demo.',
    reset: 'Reset demo data',
    resetTitle: 'Reset demo data?',
    resetBody: 'Saved searches, dashboard conversions, users, settings and activity go back to the sample data. Changes you made are lost.',
    resetConfirm: 'Reset',
    activityTitle: 'Recent activity',
    activityEmpty: 'No activity yet.',
    act: {
      login: (a: string) => `${a} signed in`,
      export: (a: string, b: string) => `${a} exported ${b}`,
      search: (a: string, b: string) => `${a} saved the search “${b}”`,
      invite: (a: string) => `Invited ${a}`,
      resend: (a: string) => `Resent the invite to ${a}`,
      role: (a: string, b: string) => `Changed ${a}'s role to ${b}`,
      activate: (a: string) => `Activated ${a}`,
      deactivate: (a: string) => `Deactivated ${a}`,
      remove: (a: string) => `Removed ${a}`,
      settingOn: (a: string) => `Turned on: ${a}`,
      settingOff: (a: string) => `Turned off: ${a}`,
      lang: (a: string) => `Default language set to ${a}`,
      reset: 'Demo data reset',
    },
    ago: (iso: string) => {
      const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
      if (m < 1) return 'just now';
      if (m < 60) return `${m} min ago`;
      const h = Math.round(m / 60);
      if (h < 24) return `${h} h ago`;
      const d = Math.round(h / 24);
      return d === 1 ? '1 day ago' : `${d} days ago`;
    },
  },

  footer: 'Prototype with sample data. Every candidate, file and person shown is invented.',
};

export type Dict = typeof en;


// ---------- React context ----------

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
}

const I18nContext = createContext<I18nValue>({ lang: 'en', setLang: () => {}, t: en });
const LANG_KEY = 'resumeFinder.lang';

export function storedLang(): Lang {
  try {
    return localStorage.getItem(LANG_KEY) === 'ja' ? 'ja' : 'en';
  } catch {
    return 'en';
  }
}

// Japanese labels are a separate chunk, fetched the first time they are needed.
let jaDict: Dict | null = null;
let jaLoading: Promise<Dict> | null = null;
export function loadJa(): Promise<Dict> {
  jaLoading ??= import('./i18n-ja').then((m) => (jaDict = m.ja));
  return jaLoading;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(storedLang);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* storage unavailable: keep the choice for this visit only */
    }
  }, []);
  // main.tsx preloads Japanese before the first render when it was the stored choice, so there is no English flash.
  const [ja, setJa] = useState<Dict | null>(jaDict);
  useEffect(() => {
    if (lang !== 'ja' || ja) return;
    let live = true;
    loadJa().then((d) => live && setJa(d));
    return () => {
      live = false;
    };
  }, [lang, ja]);
  const t = lang === 'ja' && ja ? ja : en;
  const shown: Lang = t === en ? 'en' : 'ja';
  useEffect(() => {
    document.documentElement.lang = shown;
  }, [shown]);
  const value = useMemo(() => ({ lang: shown, setLang, t }), [shown, setLang, t]);
  return createElement(I18nContext.Provider, { value }, children);
}

export const useI18n = () => useContext(I18nContext);

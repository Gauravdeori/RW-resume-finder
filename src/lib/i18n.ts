import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
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
 * Every UI label lives here, in English and Japanese. Components never hard-code text.
 * Candidate data (names, job titles, companies, schools) is shown as stored.
 */

export type Lang = 'en' | 'ja';

export const fmtNum = (n: number) => n.toLocaleString('en-US');

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

function splitIso(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const en = {
  appName: 'Resume Finder',
  brandTop: 'Robert—',
  brandBottom: '—Walters',
  brandLabel: 'Robert Walters',
  nav: { upload: 'Upload Resume', dashboard: 'Dashboard', search: 'Search', admin: 'Admin' },
  mainNav: 'Main',
  signOut: 'Sign out',
  language: 'Language',
  darkMode: 'Dark mode',
  switchToLight: 'Switch to light mode',
  switchToDark: 'Switch to dark mode',
  savedSearches: 'Saved searches',
  savedShort: 'Saved',
  savedCount: (n: number) => `Saved searches, ${n} saved`,
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

  footer: 'Prototype with sample data. Every candidate and file shown is invented.',
};

export type Dict = typeof en;

const ja: Dict = {
  appName: 'Resume Finder',
  brandTop: 'Robert—',
  brandBottom: '—Walters',
  brandLabel: 'Robert Walters',
  nav: { upload: '履歴書をアップロード', dashboard: 'ダッシュボード', search: '候補者検索', admin: '管理' },
  mainNav: 'メイン',
  signOut: 'サインアウト',
  language: '言語',
  darkMode: 'ダークモード',
  switchToLight: 'ライトモードに切り替え',
  switchToDark: 'ダークモードに切り替え',
  savedSearches: '保存した検索',
  savedShort: '保存済み',
  savedCount: (n) => `保存した検索（${n} 件）`,
  noSavedSearches: '保存した検索はまだありません。「検索を保存」で保存できます。',
  deleteSaved: (name) => `「${name}」を削除`,
  searchesInRow: (n) => `${n} 段階の絞り込み`,

  pageTitle: '候補者を探す',
  pageSub: '求める条件を選んでください。クリックするたびに人数が更新されます。',
  filtersLabel: '検索条件',

  jdTitle: '求人票から始める',
  jdLabel: '求人票',
  jdPlaceholder: '求人票の本文を貼り付けて「この内容から条件を入力」を押してください。',
  jdFill: 'この内容から条件を入力',
  jdExample: '例を使う',
  jdFilled: (n) => `${n} 件の条件を入力しました。内容を確認し、違うものは修正してください。`,
  jdNone: 'この内容から条件が見つかりませんでした。下の条件から選んでください。',
  jdEmpty: '先に求人票を貼り付けてください。',

  rowName: '氏名',
  lastName: '姓',
  firstName: '名',
  rowCompany: '会社',
  currentCompany: '現在の会社',
  previousCompany: '以前の会社',
  addPrevious: '以前の会社を追加',
  removePrevious: 'この会社を削除',

  rowAge: '年齢',
  decade: (d) => `${d}代`,
  anyAge: '指定なし',
  ageRange: (a, b) => `${a}〜${b}歳`,
  ageMinLabel: '下限年齢',
  ageMaxLabel: '上限年齢',

  rowGender: '性別',
  gender: { male: '男性', female: '女性', not_stated: '未回答' },

  rowSeniority: '役職',
  seniorityButton: { S: 'スタッフ', 'S+': 'シニアスタッフ', K: '課長', B: '部長', Y: '役員' },
  seniorityShort: { S: 'スタッフ', 'S+': 'シニアスタッフ', K: '課長', B: '部長', Y: '役員' },
  seniorityFact: (s) => ja.seniorityShort[s],

  rowIndustry: '業界',
  industry: {
    technology: 'テクノロジー',
    financial: '金融',
    healthcare: 'ヘルスケア・製薬',
    manufacturing: '製造',
    consumer: '消費財・小売',
    telecoms: '通信',
    professional: 'コンサルティング・専門サービス',
    energy: 'エネルギー・インフラ',
  },
  rowPosition: '職種',
  position: {
    sales: '営業',
    marketing: 'マーケティング',
    finance: '財務・経理',
    hr: '人事',
    it: 'IT・エンジニアリング',
    legal: '法務・コンプライアンス',
    supply: 'サプライチェーン',
    gm: '経営・事業責任者',
  },

  rowGaishi: '外資',
  gaishiSub: '外資系企業への適性',
  gaishiScore: '外資スコア',
  gaishiHelp: 'A が最も高い評価です。英語力、外資系企業での経験、海外在住期間から算出します。',
  foreignLabel: '外資系企業での勤務経験',
  foreign: { any: '指定なし', never: 'なし', once: '1社以上', twice: '2社以上' },
  englishAtLeast: '英語（以上）',
  japaneseAtLeast: '日本語（以上）',
  any: '指定なし',
  level: { Basic: '基礎', Conversational: '日常会話', Business: 'ビジネス', Fluent: '流暢', Native: 'ネイティブ' },
  overseasLabel: '海外在住経験',
  overseas: { any: '指定なし', yes: 'あり', no: 'なし' },

  rowEducation: '学歴',
  degreeLabel: '学位',
  degree: { "Bachelor's": '学士', "Master's": '修士', MBA: 'MBA', PhD: '博士' },
  schoolClassLabel: '学校ランク',
  schoolClass: { S: 'S', A: 'A', B: 'B', C: 'C', Overseas: '海外' },
  majorLabel: '専攻',
  major: {
    business: '経営・経済',
    engineering: '工学',
    science: '理学',
    law: '法律・政治',
    humanities: '人文',
    infosci: '情報科学',
  },
  schoolName: '学校名',

  countMatch: '名が該当',
  ofDatabase: (n) => `データベース全 ${n} 名中`,
  ofCurrent: (n) => `現在の結果 ${n} 名中`,
  ofShort: (n) => `${n} 名中`,
  showN: (n) => `${fmtNum(n)} 名を表示`,
  saveSearch: '検索を保存',
  clearAll: '条件をすべてクリア',
  zero: '該当する候補者がいません。条件を外して検索範囲を広げてください。',

  resultsTitle: (n) => `候補者 ${fmtNum(n)} 名`,
  searchWithin: 'この結果から絞り込む',
  editFilters: '条件を編集',
  newSearch: '新しい検索',
  trailLabel: '検索の段階',
  allCandidates: '全候補者',
  searchN: (n) => `検索 ${n}`,
  searchingWithin: (n, k) => `検索 ${k} の候補者 ${fmtNum(n)} 名の中から絞り込んでいます。`,
  editingSearch: (k) => `検索 ${k} を編集しています。`,
  backToResults: '結果に戻る',
  sortBy: '並び順',
  sortBest: 'おすすめ順',
  sortNew: '新着順',
  resultsZero: '該当する候補者がいません。条件を編集するか、新しい検索を始めてください。',
  showMore: 'さらに10件表示',
  showingOf: (a, b) => `${fmtNum(b)} 名中 ${fmtNum(a)} 名を表示`,

  factAge: '年齢',
  factSeniority: '役職',
  factEnglish: '英語',
  factJapanese: '日本語',
  factGaishi: '外資スコア',
  factSchool: '学校',
  schoolWithClass: (school, cls) => (cls === 'Overseas' ? school : `${school} (${cls} ランク)`),
  previouslyAt: '以前の勤務先',
  openCv: '履歴書を開く',
  openCvFor: (name) => `${name} の履歴書を開く`,

  displayName: (c) => `${c.lastName} ${c.firstName}`,
  titleAt: (c) => `${c.currentTitle}, ${c.currentCompany}`,
  summary: (c) => {
    const overseas = c.yearsOverseas > 0 ? `海外在住${c.yearsOverseas}年` : '海外在住経験なし';
    const foreign = c.foreignCompanyCount > 0 ? `外資系${c.foreignCompanyCount}社` : '外資系経験なし';
    return `${ja.industry[c.industry]}業界で${c.yearsExperience}年の経験。英語：${ja.level[c.englishLevel]}、${overseas}、${foreign}。 履歴書更新日 ${ja.formatDate(c.cvUpdatedAt)}`;
  },
  formatDate: (iso) => {
    const { y, m, d } = splitIso(iso);
    return `${y}年${m}月${d}日`;
  },

  cvDialog: (name) => `${name} の履歴書`,
  cvProfile: 'プロフィール',
  cvExperience: '職歴',
  cvEducation: '学歴',
  cvLanguages: '語学',
  close: '閉じる',
  toPresent: (y) => `${y}年〜現在`,
  yearRange: (a, b) => `${a}年〜${b}年`,
  profileText: (c) => {
    const abroad = c.yearsOverseas > 0 ? `海外在住${c.yearsOverseas}年。` : '海外在住経験なし。';
    return `${c.currentTitle}。${ja.industry[c.industry]}業界で${c.yearsExperience}年の経験があり、${ja.position[c.position]}を担当。英語：${ja.level[c.englishLevel]}、日本語：${ja.level[c.japaneseLevel]}。${abroad}`;
  },
  educationText: (c) => `${ja.degree[c.degree]}（${ja.major[c.major]}）。${c.school}。`,
  languagesText: (c) => `日本語：${ja.level[c.japaneseLevel]}。英語：${ja.level[c.englishLevel]}。`,

  nameThisSearch: 'この検索に名前を付ける',
  searchName: '検索名',
  cancel: 'キャンセル',
  save: '保存',

  chip: {
    last: (v) => `姓：${v}`,
    first: (v) => `名：${v}`,
    current: (v) => `現在：${v}`,
    previous: (v) => `以前：${v}`,
    gaishi: (v) => `外資スコア ${v}`,
    english: (l) => `英語：${ja.level[l]}以上`,
    japanese: (l) => `日本語：${ja.level[l]}以上`,
    foreign: (v) => `外資経験：${ja.foreign[v]}`,
    overseas: (v) => `海外在住：${ja.overseas[v]}`,
    schoolClass: (c) => (c === 'Overseas' ? '海外校' : `${c} ランク`),
    school: (v) => `学校：${v}`,
    none: '条件なし',
  },

  nameParts: {
    industry: {
      technology: 'テック',
      financial: '金融',
      healthcare: 'ヘルスケア',
      manufacturing: '製造',
      consumer: '消費財・小売',
      telecoms: '通信',
      professional: '専門サービス',
      energy: 'エネルギー',
    },
    position: {
      sales: '営業',
      marketing: 'マーケティング',
      finance: '財務',
      hr: '人事',
      it: 'エンジニア',
      legal: '法務',
      supply: 'サプライチェーン',
      gm: '経営',
    },
    seniority: { S: 'スタッフ', 'S+': 'シニアスタッフ', K: '課長クラス', B: '部長クラス', Y: '役員クラス' },
    people: '候補者',
    bilingual: 'バイリンガル',
    inTheir: (d) => `${d}代`,
    fallback: 'マイ検索',
    join: '・',
  },

  studio: {
    eyebrow: (user) => `おかえりなさい、${user} さん`,
    titleBefore: '',
    titleAccent: '変換',
    titleAfter: 'する履歴書をアップロード',
    uploadTitle: '履歴書ファイルをアップロード、または以前のファイルを選択：',
    uploadLink: 'ダッシュボード',
    uploadSub: '確認・変換する履歴書をアップロードしてください。',
    dropTitle: 'ここに履歴書をドロップ',
    dropSub: 'またはクリックしてファイルを選択',
    dropActive: 'ドロップしてファイルを追加',
    fileNote: (mb) => `最大ファイルサイズ：${mb} MB ・ RW のインフラで処理`,
    removeFile: 'ファイルを削除',
    errType: 'このファイル形式には対応していません。PDF、DOCX、DOC、XLSX、XLS、TXT を使用してください。',
    errSize: (mb) => `ファイルサイズが ${mb} MB を超えています。`,
    start: '変換を開始',
    converting: '変換中…',
    done: (name) => `${name} を変換し、ダッシュボードに追加しました。`,
    doneReview: (name) => `${name} を変換しました。ダッシュボードでレビュー待ちです。`,
    viewDashboard: 'ダッシュボードで見る',
    settingsTitle: '変換設定',
    settingsSub: '元の言語と出力言語を選択してください。同じ言語の場合は元の言語のまま、異なる言語の場合はエクスポート前に翻訳します。',
    pairHelp: {
      'ja-ja': '日本語の履歴書を日本語のまま変換します。',
      'en-en': '英語の履歴書を英語のまま変換します。',
      'ja-en': '日本語の履歴書を英語に翻訳します。',
      'en-ja': '英語の履歴書を日本語に翻訳します。',
    },
    langShort: { ja: '日本語', en: 'EN' },
    langCode: { ja: 'JA', en: 'EN' },
    output: (lang) => `${lang === 'ja' ? '日本語' : '英語'}で出力`,
    modeTitle: '変換モード',
    mode: { exact: '原文どおり', optimized: '最適化モード' },
    modeHelp: {
      exact: '候補者の表現をできるだけ原文に近い形で残します。',
      optimized: '表現と構成を整え、読みやすい履歴書に仕上げます。',
    },
    engineTitle: '変換エンジン',
    engine: { standard: 'スタンダード', complex: 'コンプレックス' },
    engineHelp: {
      standard: '実績のあるエンジンです。単一言語・二言語のファイルや表のレイアウトを自動で判別します。',
      complex: '複数段組み、入れ子の表、言語の混在など複雑なレイアウト向けです。処理に時間がかかります。',
    },

    dashTitle: 'ダッシュボード',
    statTotal: '合計（このページ）',
    statExported: 'エクスポート済み',
    statReview: 'レビュー待ち',
    statCross: '言語間変換',
    listTitle: '変換履歴',
    listMeta: (n, keep) => `このページ ${n} 件 ・ 直近 ${keep} 件のみ表示`,
    col: { num: '#', file: 'ファイル', status: 'ステータス', by: 'アップロード者', size: 'サイズ', created: '作成日時' },
    status: { exported: 'エクスポート済み', review: 'レビュー待ち' },
    you: (user) => `${user}（あなた）`,
    tagSingle: '単一言語',
    tagDual: '二言語',
    tagTables: '表あり',
    tagNoTables: '表なし',
    size: (kb) => `${kb.toFixed(1)} KB`,
    created: (iso) => {
      const d = new Date(iso);
      return `${d.getMonth() + 1}月${d.getDate()}日 · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    },
    edit: '編集',
    editFor: (name) => `${name} を編集`,
    deleteFor: (name) => `${name} を削除`,
    deleted: (name) => `${name} を削除しました。`,
    undo: '元に戻す',
    empty: '変換履歴はまだありません。履歴書をアップロードして始めましょう。',
    uploadCta: '履歴書をアップロード',
    detailTitle: (id) => `変換 #${id}`,
    detailNote: 'Resume Studio では「編集」で左右比較エディターが開きます。このプロトタイプでは変換の詳細のみ表示します。',
    detailLanguage: '言語',
    detailFile: 'ファイル',
  },

  footer: 'サンプルデータを使用したプロトタイプです。表示される候補者とファイルはすべて架空のものです。',
};

export const DICTS: Record<Lang, Dict> = { en, ja };

// ---------- React context ----------

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
}

const I18nContext = createContext<I18nValue>({ lang: 'en', setLang: () => {}, t: en });
const LANG_KEY = 'resumeFinder.lang';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      return localStorage.getItem(LANG_KEY) === 'ja' ? 'ja' : 'en';
    } catch {
      return 'en';
    }
  });
  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* storage unavailable: keep the choice for this visit only */
    }
  };
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const value = useMemo(() => ({ lang, setLang, t: DICTS[lang] }), [lang]);
  return createElement(I18nContext.Provider, { value }, children);
}

export const useI18n = () => useContext(I18nContext);

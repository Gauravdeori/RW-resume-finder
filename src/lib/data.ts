import { gaishiScore } from './gaishi';
import type {
  Candidate,
  Degree,
  Education,
  Gender,
  Industry,
  Jlpt,
  Level,
  Major,
  Position,
  PreviousCompany,
  Qualification,
  SchoolRating,
  Seniority,
} from './types';

export const TOTAL_CANDIDATES = 4860;

/** CV dates and birth dates are generated relative to this fixed date so the data never shifts. */
const DATA_ANCHOR = { y: 2026, m: 10, d: 1 };
/** Age is computed on the search date (today). */
const SEARCH_DATE = new Date();

// ---------- seeded random ----------

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomTools(seed: number) {
  const rnd = mulberry32(seed);
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];
  function weighted<T>(pairs: readonly (readonly [T, number])[]): T {
    const total = pairs.reduce((s, [, w]) => s + w, 0);
    let r = rnd() * total;
    for (const [v, w] of pairs) {
      r -= w;
      if (r < 0) return v;
    }
    return pairs[pairs.length - 1][0];
  }
  return {
    rnd,
    chance: (p: number) => rnd() < p,
    int: (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1)),
    pick,
    weighted,
  };
}

const { rnd, chance, int, pick, weighted } = randomTools(20261005);
/**
 * A second stream for the fields added later (extra degrees, GPA, qualifications, TOEIC, JLPT), so every
 * candidate's original fields (name, age, companies, highest degree...) stay exactly as they were.
 */
const extra = randomTools(20261104);

// ---------- reference lists ----------

interface Company {
  name: string;
  industry: Industry;
  foreign: boolean;
}

const c = (industry: Industry, foreign: boolean, ...names: string[]): Company[] =>
  names.map((name) => ({ name, industry, foreign }));

const COMPANIES: Company[] = [
  ...c('financial', true, 'J.P. Morgan', 'Goldman Sachs', 'BlackRock Japan', 'AXA Life Japan', 'Morgan Stanley', 'Citi Japan', 'HSBC Japan', 'UBS Japan'),
  ...c('financial', false, 'MUFG Bank', 'SMBC', 'Mizuho Bank', 'Nomura Securities', 'Tokio Marine', 'Daiwa Securities'),
  ...c('technology', true, 'Microsoft Japan', 'Google Japan', 'Amazon Japan', 'Salesforce Japan', 'Cisco Japan', 'Oracle Japan'),
  ...c('technology', false, 'Fujitsu', 'NEC', 'Rakuten', 'Sony', 'LINE Yahoo', 'Mercari'),
  ...c('healthcare', true, 'Pfizer Japan', 'Novartis Pharma', 'Johnson & Johnson Japan', 'Medtronic Japan', 'AstraZeneca Japan'),
  ...c('healthcare', false, 'Astellas', 'Takeda', 'Daiichi Sankyo', 'Eisai', 'Chugai Pharmaceutical', 'Olympus'),
  ...c('manufacturing', true, 'GE Japan', 'Siemens Japan', 'Bosch Japan', '3M Japan', 'ABB Japan'),
  ...c('manufacturing', false, 'Toyota', 'Hitachi', 'Panasonic', 'Denso', 'Mitsubishi Heavy Industries', 'Komatsu'),
  ...c('consumer', true, 'P&G Japan', 'Unilever Japan', 'Nestlé Japan', "L'Oréal Japan", 'IKEA Japan'),
  ...c('consumer', false, 'Fast Retailing', 'Kao', 'Shiseido', 'Suntory', 'Aeon', 'Seven & i'),
  ...c('telecoms', true, 'Nokia Japan', 'Ericsson Japan', 'Vodafone Global Enterprise Japan'),
  ...c('telecoms', false, 'NTT Docomo', 'KDDI', 'SoftBank', 'Rakuten Mobile', 'NTT Communications'),
  ...c('professional', true, 'Accenture Japan', 'McKinsey Japan', 'PwC Japan', 'Deloitte Tohmatsu', 'KPMG Japan', 'Baker McKenzie Tokyo'),
  ...c('professional', false, 'Nomura Research Institute', 'Recruit Holdings', 'Dentsu', 'Nishimura & Asahi'),
  ...c('energy', true, 'Shell Japan', 'BP Japan', 'Siemens Energy Japan', 'Ørsted Japan'),
  ...c('energy', false, 'JERA', 'Tokyo Gas', 'ENEOS', 'Kansai Electric Power', 'Tokyo Electric Power', 'Inpex'),
];

const SCHOOLS: Record<SchoolRating, string[]> = {
  S: ['University of Tokyo', 'Kyoto University', 'Keio University', 'Waseda University'],
  A: ['Osaka University', 'Nagoya University', 'Tohoku University', 'Hitotsubashi University', 'Tokyo Institute of Technology', 'Kyushu University'],
  B: ['Sophia University', 'Meiji University', 'Rikkyo University', 'Doshisha University', 'Aoyama Gakuin University', 'International Christian University', 'Chuo University'],
  C: ['Hosei University', 'Nihon University', 'Toyo University', 'Kindai University', 'Senshu University', 'Komazawa University'],
  Overseas: ['INSEAD', 'Harvard University', 'Stanford University', 'University of Oxford', 'London Business School', 'National University of Singapore', 'UC Berkeley', 'Columbia University'],
};

const JP_LAST = [
  'Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato',
  'Yoshida', 'Yamada', 'Sasaki', 'Yamaguchi', 'Matsumoto', 'Inoue', 'Kimura', 'Hayashi', 'Shimizu', 'Yamazaki',
  'Mori', 'Abe', 'Ikeda', 'Hashimoto', 'Ishikawa', 'Ogawa', 'Okada', 'Endo', 'Ota', 'Fujita',
  'Goto', 'Okamoto', 'Hasegawa', 'Murakami', 'Kondo', 'Ishii', 'Saito', 'Sakamoto', 'Aoki', 'Fujii',
  'Nishimura', 'Fukuda', 'Miura', 'Takeuchi', 'Nakajima', 'Matsuda', 'Harada', 'Ono', 'Tamura', 'Kudo',
];
const JP_FIRST: Record<'male' | 'female', string[]> = {
  male: ['Daisuke', 'Kenta', 'Takashi', 'Hiroshi', 'Kazuya', 'Naoki', 'Shota', 'Yuto', 'Takumi', 'Ryo', 'Kenji', 'Satoshi', 'Makoto', 'Yusuke', 'Tomoya', 'Haruto', 'Sho', 'Akira', 'Koji', 'Tetsuya', 'Masato', 'Jun', 'Shinji', 'Daiki', 'Yuki'],
  female: ['Yuki', 'Aiko', 'Asuka', 'Tomoko', 'Noriko', 'Yumi', 'Haruka', 'Misaki', 'Ayaka', 'Emi', 'Sakura', 'Mai', 'Nanami', 'Rina', 'Kaori', 'Megumi', 'Yoko', 'Akiko', 'Natsuki', 'Erika', 'Mana', 'Chihiro', 'Saki', 'Keiko'],
};
const INTL_LAST = ['Laurent', 'Weber', 'Wilson', 'Chen', 'Kim', 'Thompson', 'Brown', 'Müller', 'Sharma', 'Martin', 'Dubois', 'Patel', 'Wong', 'Smith', 'Garcia', 'Rossi', 'Lee', 'Park', 'Nguyen', 'Schmidt'];
const INTL_FIRST: Record<'male' | 'female', string[]> = {
  male: ['Lucas', 'James', 'David', 'Michael', 'Thomas', 'Daniel', 'Raj', 'Kevin', 'Mark', 'Oliver', 'Marco', 'Ethan'],
  female: ['Lena', 'Emily', 'Sarah', 'Anna', 'Sophie', 'Priya', 'Chloe', 'Olivia', 'Grace', 'Mei', 'Clara', 'Hannah'],
};

const TITLES: Record<Position, Record<Seniority, string>> = {
  sales: { S: 'Account Executive', 'S+': 'Senior Account Executive', K: 'Sales Manager', B: 'Head of Sales', Y: 'Chief Commercial Officer' },
  marketing: { S: 'Marketing Associate', 'S+': 'Senior Marketing Specialist', K: 'Marketing Manager', B: 'Marketing Director', Y: 'Chief Marketing Officer' },
  finance: { S: 'Accountant', 'S+': 'Senior Financial Analyst', K: 'Finance Manager', B: 'Finance Director', Y: 'Chief Financial Officer' },
  hr: { S: 'HR Associate', 'S+': 'Senior HR Business Partner', K: 'HR Manager', B: 'HR Director', Y: 'Chief People Officer' },
  it: { S: 'Software Engineer', 'S+': 'Senior Software Engineer', K: 'Engineering Manager', B: 'Director of Engineering', Y: 'Chief Technology Officer' },
  legal: { S: 'Legal Associate', 'S+': 'Senior Compliance Officer', K: 'Legal Manager', B: 'General Counsel', Y: 'Chief Legal Officer' },
  supply: { S: 'Supply Chain Analyst', 'S+': 'Senior Buyer', K: 'Supply Chain Manager', B: 'Director of Supply Chain', Y: 'Chief Operating Officer' },
  gm: { S: 'Management Associate', 'S+': 'Senior Business Manager', K: 'General Manager', B: 'Managing Director', Y: 'President' },
};

const SENIORITY_ORDER: Seniority[] = ['S', 'S+', 'K', 'B', 'Y'];

const MAJOR_BY_POSITION: Record<Position, Major[]> = {
  sales: ['business', 'humanities'],
  marketing: ['business', 'humanities'],
  finance: ['business'],
  hr: ['humanities', 'law', 'business'],
  it: ['engineering', 'infosci', 'science'],
  legal: ['law'],
  supply: ['engineering', 'business'],
  gm: ['business', 'law', 'engineering'],
};

/** Search words for each qualification (English and Japanese), so the free-text box finds them too. */
const QUAL_TERMS: Record<Qualification, string> = {
  cpa: 'cpa|certified public accountant|公認会計士|会計士',
  uscpa: 'uscpa|us cpa|us certified public accountant|米国公認会計士',
  cfa: 'cfa|chartered financial analyst',
  pmp: 'pmp|project management professional|プロジェクトマネジメント',
  cia: 'cia|certified internal auditor|公認内部監査人',
  bookkeeping: 'bookkeeping|boki|簿記',
  itcert: 'it certification|aws|azure|it資格',
  bengoshi: 'lawyer|bengoshi|attorney|弁護士',
  sharoushi: 'labour and social security attorney|labor and social security attorney|sharoushi|社会保険労務士|社労士',
};

/** How likely each qualification is, by position. */
const QUAL_ODDS: Record<Position, [Qualification, number][]> = {
  sales: [['bookkeeping', 0.06], ['pmp', 0.03]],
  marketing: [['bookkeeping', 0.05], ['pmp', 0.04], ['itcert', 0.03]],
  finance: [['cpa', 0.14], ['uscpa', 0.12], ['cfa', 0.08], ['cia', 0.06], ['bookkeeping', 0.4]],
  hr: [['sharoushi', 0.25], ['bookkeeping', 0.05]],
  it: [['itcert', 0.45], ['pmp', 0.12]],
  legal: [['bengoshi', 0.3], ['cia', 0.05], ['uscpa', 0.02]],
  supply: [['pmp', 0.15], ['bookkeeping', 0.1]],
  gm: [['pmp', 0.08], ['cfa', 0.04], ['uscpa', 0.04], ['bookkeeping', 0.08]],
};

const OTHER_QUALS = [
  'TOEFL iBT',
  'Takken (real estate transaction specialist)',
  'FRM (Financial Risk Manager)',
  'Six Sigma Green Belt',
  'IT Passport',
  'Securities sales representative',
  'SAP certified consultant',
  'Chartered Accountant (ICAEW)',
  'Hisho kentei (secretary certificate)',
  'Chūshō kigyō shindanshi (SME consultant)',
];

// ---------- helpers ----------

const pad = (n: number) => String(n).padStart(2, '0');
const isoDate = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const anchorUtc = () => new Date(Date.UTC(DATA_ANCHOR.y, DATA_ANCHOR.m - 1, DATA_ANCHOR.d));

export function ageOn(dobIso: string, on: Date): number {
  const [y, m, d] = dobIso.split('-').map(Number);
  let age = on.getFullYear() - y;
  const beforeBirthday = on.getMonth() + 1 < m || (on.getMonth() + 1 === m && on.getDate() < d);
  if (beforeBirthday) age -= 1;
  return age;
}

function seniorityForAge(age: number): Seniority {
  if (age < 28) return weighted([['S', 80], ['S+', 20]] as const);
  if (age < 35) return weighted([['S', 25], ['S+', 50], ['K', 25]] as const);
  if (age < 45) return weighted([['S+', 20], ['K', 50], ['B', 24], ['Y', 6]] as const);
  if (age < 55) return weighted([['K', 35], ['B', 45], ['Y', 20]] as const);
  return weighted([['K', 20], ['B', 45], ['Y', 35]] as const);
}

const FOREIGN_PROPENSITY: Record<Level, number> = {
  Basic: 0.08,
  Conversational: 0.25,
  Business: 0.5,
  Fluent: 0.7,
  Native: 0.8,
};

const OVERSEAS_PROPENSITY: Record<Level, number> = {
  Basic: 0.04,
  Conversational: 0.15,
  Business: 0.35,
  Fluent: 0.65,
  Native: 0.9,
};

/** Companies grouped by industry and foreign/Japanese once, so picking one scans a short list, not all of them. */
const POOLS = new Map<string, Company[]>();
for (const co of COMPANIES) {
  const key = `${co.industry}|${co.foreign}`;
  POOLS.set(key, [...(POOLS.get(key) ?? []), co]);
}

function pickCompany(industry: Industry, foreign: boolean, exclude: Set<string>): Company {
  let pool = (POOLS.get(`${industry}|${foreign}`) ?? []).filter((co) => !exclude.has(co.name));
  if (pool.length === 0) pool = COMPANIES.filter((co) => co.foreign === foreign && !exclude.has(co.name));
  if (pool.length === 0) pool = COMPANIES.filter((co) => !exclude.has(co.name));
  return pick(pool);
}

/** A typical GPA (on a 4.0 scale) by school rating, with some spread. */
const GPA_BASE: Record<SchoolRating, number> = { S: 3.3, A: 3.2, B: 3.0, C: 2.8, Overseas: 3.3 };

function makeGpa(rating: SchoolRating, japanese: boolean): Pick<Education, 'gpa' | 'gpaScale'> {
  const gpaScale = japanese
    ? extra.weighted([[4, 65], [4.3, 10], [5, 10], [100, 15]] as const)
    : extra.weighted([[4, 85], [4.3, 15]] as const);
  if (!extra.chance(0.75)) return { gpa: null, gpaScale };
  const spread = (extra.rnd() + extra.rnd() + extra.rnd() - 1.5) * 0.6;
  const on4 = Math.min(4, Math.max(2, GPA_BASE[rating] + spread));
  const raw = (on4 / 4) * gpaScale;
  return { gpa: gpaScale === 100 ? Math.round(raw) : Math.round(raw * 10) / 10, gpaScale };
}

function makeEntry(degree: Degree, major: Major | null, school: string, schoolRating: SchoolRating): Education {
  return { degree, major, school, schoolRating, ...makeGpa(schoolRating, schoolRating !== 'Overseas') };
}

/** A school with about the same rating as `rating` (a step up or down now and then), for an earlier degree. */
function nearbyRating(rating: SchoolRating, international: boolean): SchoolRating {
  if (international || rating === 'Overseas') return extra.chance(0.8) ? 'Overseas' : extra.pick(['S', 'A'] as const);
  return extra.weighted([[rating, 70], ['A', 10], ['B', 12], ['C', 8]] as const);
}

/**
 * Every degree the candidate holds, lowest first. The highest degree, its major, school and rating are the ones the
 * candidate always had; a Bachelor's (and often a Master's before a PhD) is added under it. MBAs have no major.
 */
function makeEducation(
  highest: Degree,
  major: Major,
  school: string,
  rating: SchoolRating,
  international: boolean,
  position: Position,
): Education[] {
  const earlierMajor = () => (extra.chance(0.75) ? major : extra.pick(MAJOR_BY_POSITION[position]));
  const earlier = (degree: Degree, m: Major) => {
    const r = nearbyRating(rating, international);
    const sameSchool = r === rating && extra.chance(0.6);
    return makeEntry(degree, m, sameSchool ? school : extra.pick(SCHOOLS[r]), r);
  };
  if (highest === "Bachelor's") return [makeEntry(highest, major, school, rating)];
  if (highest === 'MBA') {
    // The major they always had is the Bachelor's one; the MBA itself has none.
    const r: SchoolRating = international
      ? nearbyRating(rating, true)
      : extra.weighted([['S', 25], ['A', 30], ['B', 30], ['C', 15]] as const);
    return [makeEntry("Bachelor's", major, extra.pick(SCHOOLS[r]), r), makeEntry('MBA', null, school, rating)];
  }
  if (highest === "Master's") return [earlier("Bachelor's", earlierMajor()), makeEntry(highest, major, school, rating)];
  const list = [earlier("Bachelor's", earlierMajor())];
  if (extra.chance(0.7)) list.push(earlier("Master's", major));
  list.push(makeEntry('PhD', major, school, rating));
  return list;
}

function makeQualifications(position: Position): { qualifications: Qualification[]; otherQualifications: string[] } {
  const qualifications = QUAL_ODDS[position].filter(([, p]) => extra.chance(p)).map(([q]) => q);
  const otherQualifications = extra.chance(0.12) ? [extra.pick(OTHER_QUALS)] : [];
  return { qualifications, otherQualifications };
}

/** TOEIC range for each English level (780 and up reads as Fluent; native speakers who took it score 945+). */
const TOEIC_RANGE: Record<Level, [number, number]> = {
  Basic: [250, 395],
  Conversational: [400, 595],
  Business: [600, 775],
  Fluent: [780, 985],
  Native: [945, 990],
};

/** About 6 in 10 Japanese candidates state a TOEIC score; few international ones do. */
function makeToeic(english: Level, international: boolean): number | null {
  const p = international ? 0.08 : english === 'Native' ? 0.4 : 0.6;
  if (!extra.chance(p)) return null;
  const [lo, hi] = TOEIC_RANGE[english];
  return lo + 5 * extra.int(0, (hi - lo) / 5);
}

/** JLPT matching the Japanese level; native speakers have none. */
function makeJlpt(japanese: Level): Jlpt | null {
  if (japanese === 'Native' || !extra.chance(0.85)) return null;
  if (japanese === 'Basic') return extra.chance(0.5) ? 'N5' : 'N4';
  return ({ Conversational: 'N3', Business: 'N2', Fluent: 'N1' } as const)[japanese];
}

// ---------- generator ----------

function makeCandidate(i: number): Candidate {
  const international = chance(0.09);
  const gender: Gender = weighted([['male', 55], ['female', 42], ['not_stated', 3]] as const);
  const nameGender = gender === 'not_stated' ? (chance(0.5) ? 'male' : 'female') : gender;
  const lastName = international ? pick(INTL_LAST) : pick(JP_LAST);
  const firstName = international ? pick(INTL_FIRST[nameGender]) : pick(JP_FIRST[nameGender]);

  // Age and date of birth
  const decade = weighted([[20, 15], [30, 37], [40, 30], [50, 13], [60, 5]] as const);
  const targetAge = decade === 20 ? int(23, 29) : decade === 60 ? int(60, 66) : int(decade, decade + 9);
  const dob = anchorUtc();
  dob.setUTCFullYear(dob.getUTCFullYear() - targetAge);
  dob.setUTCDate(dob.getUTCDate() - int(0, 364));
  const dateOfBirth = isoDate(dob);
  const age = ageOn(dateOfBirth, SEARCH_DATE);

  const seniority = seniorityForAge(targetAge);
  const industry: Industry = weighted([
    ['financial', 22], ['technology', 18], ['healthcare', 12], ['manufacturing', 11],
    ['consumer', 10], ['telecoms', 7], ['professional', 13], ['energy', 7],
  ] as const);
  let position: Position = weighted([
    ['sales', 18], ['marketing', 10], ['finance', 15], ['hr', 8],
    ['it', 18], ['legal', 8], ['supply', 9], ['gm', 14],
  ] as const);
  if (seniority === 'Y' && chance(0.35)) position = 'gm';

  // Education
  const degree: Degree = international
    ? weighted([["Bachelor's", 40], ["Master's", 25], ['MBA', 30], ['PhD', 5]] as const)
    : weighted([["Bachelor's", 66], ["Master's", 17], ['MBA', 12], ['PhD', 5]] as const);
  let schoolRating: SchoolRating;
  if (international) schoolRating = chance(0.88) ? 'Overseas' : weighted([['S', 50], ['A', 50]] as const);
  else if (degree === 'MBA') schoolRating = weighted([['Overseas', 45], ['S', 25], ['A', 20], ['B', 10]] as const);
  else schoolRating = weighted([['S', 18], ['A', 22], ['B', 32], ['C', 22], ['Overseas', 6]] as const);
  const school = pick(SCHOOLS[schoolRating]);
  const major: Major = chance(0.65) ? pick(MAJOR_BY_POSITION[position]) : pick(['business', 'engineering', 'science', 'law', 'humanities', 'infosci'] as const);

  // Languages and time abroad
  let englishLevel: Level;
  let japaneseLevel: Level;
  let yearsOverseas: number;
  if (international) {
    englishLevel = weighted([['Native', 60], ['Fluent', 30], ['Business', 10]] as const);
    japaneseLevel = weighted([['Basic', 20], ['Conversational', 30], ['Business', 32], ['Fluent', 18]] as const);
    yearsOverseas = Math.min(targetAge - 20, int(6, 22));
  } else {
    englishLevel =
      schoolRating === 'Overseas'
        ? weighted([['Business', 15], ['Fluent', 55], ['Native', 30]] as const)
        : weighted([['Basic', 14], ['Conversational', 26], ['Business', 31], ['Fluent', 21], ['Native', 8]] as const);
    japaneseLevel = 'Native';
    if (chance(OVERSEAS_PROPENSITY[englishLevel]) || schoolRating === 'Overseas') {
      yearsOverseas = weighted([[int(1, 2), 40], [int(3, 5), 40], [int(6, 10), 20]] as const);
      if (schoolRating === 'Overseas') yearsOverseas = Math.max(2, yearsOverseas);
    } else {
      yearsOverseas = 0;
    }
  }

  // Career history
  const startAge = degree === "Bachelor's" ? 22 : 24;
  const yearsExperience = Math.max(1, targetAge - startAge - int(0, 1));
  const careerStart = DATA_ANCHOR.y - yearsExperience;
  let numPrev = yearsExperience < 3 ? int(0, 1) : int(1, Math.min(4, Math.floor(yearsExperience / 4) + 1));
  numPrev = Math.min(numPrev, Math.max(0, yearsExperience - 1));
  const currentStartYear =
    numPrev === 0 ? careerStart : int(Math.max(careerStart + numPrev, DATA_ANCHOR.y - 8), DATA_ANCHOR.y - 1);

  const foreignP = international ? 0.85 : FOREIGN_PROPENSITY[englishLevel];
  const used = new Set<string>();
  const current = pickCompany(industry, chance(foreignP), used);
  used.add(current.name);

  // Split [careerStart, currentStartYear] into numPrev back-to-back jobs.
  const cuts = new Set<number>();
  while (cuts.size < numPrev - 1) cuts.add(int(careerStart + 1, currentStartYear - 1));
  const bounds = [careerStart, ...[...cuts].sort((a, b) => a - b), currentStartYear];
  const sIdx = SENIORITY_ORDER.indexOf(seniority);
  const previousCompanies: PreviousCompany[] = [];
  for (let j = numPrev - 1; j >= 0; j--) {
    // j = 0 is the earliest job; most recent previous job is listed first.
    const stepsBack = numPrev - j;
    const prevSeniority = SENIORITY_ORDER[Math.max(0, sIdx - Math.ceil(stepsBack * 0.7))];
    const prevIndustry = chance(0.75) ? industry : pick(['technology', 'financial', 'healthcare', 'manufacturing', 'consumer', 'telecoms', 'professional', 'energy'] as const);
    const co = pickCompany(prevIndustry, chance(foreignP), used);
    used.add(co.name);
    previousCompanies.push({
      company: co.name,
      title: TITLES[position][prevSeniority],
      startYear: bounds[j],
      endYear: bounds[j + 1],
      isForeign: co.foreign,
    });
  }
  const foreignCompanyCount = (current.foreign ? 1 : 0) + previousCompanies.filter((p) => p.isForeign).length;

  // CV last updated, skewed towards recent.
  const cv = anchorUtc();
  cv.setUTCDate(cv.getUTCDate() - Math.floor(Math.pow(rnd(), 1.6) * 900));

  // Fields added later, from the second random stream.
  const education = makeEducation(degree, major, school, schoolRating, international, position);
  const { qualifications, otherQualifications } = makeQualifications(position);

  return {
    id: `c${String(i + 1).padStart(4, '0')}`,
    lastName,
    firstName,
    dateOfBirth,
    age,
    gender,
    currentCompany: current.name,
    currentTitle: TITLES[position][seniority],
    currentStartYear,
    currentIsForeign: current.foreign,
    previousCompanies,
    seniority,
    industry,
    position,
    englishLevel,
    japaneseLevel,
    foreignCompanyCount,
    yearsOverseas,
    gaishiScore: gaishiScore(englishLevel, foreignCompanyCount, yearsOverseas),
    toeicScore: makeToeic(englishLevel, international),
    jlpt: makeJlpt(japaneseLevel),
    education,
    qualifications,
    otherQualifications,
    cvUpdatedAt: isoDate(cv),
    yearsExperience,
    lc: {
      last: lastName.toLowerCase(),
      first: firstName.toLowerCase(),
      current: current.name.toLowerCase(),
      prev: previousCompanies.map((p) => p.company.toLowerCase()),
      schools: education.map((e) => e.school.toLowerCase()),
      quals: [...qualifications.map((q) => QUAL_TERMS[q]), ...otherQualifications].join('|').toLowerCase(),
    },
  };
}

const list: Candidate[] = [];
/** Every sample candidate, in data order. Filled once by generateCandidates() before the app first renders. */
export const CANDIDATES: readonly Candidate[] = list;

/** Hand the main thread back to the browser (paint, input) before carrying on. */
const yieldToMain = () =>
  new Promise<void>((resolve) => {
    const ch = new MessageChannel();
    ch.port1.onmessage = () => resolve();
    ch.port2.postMessage(null);
  });

const SLICE = 500;

/**
 * Generates the candidates once, outside React, in slices of 500 with a yield between them, so loading never
 * blocks the page in one long task. Same seed and order, so the data is identical on every load.
 */
export async function generateCandidates(): Promise<void> {
  for (let i = list.length; i < TOTAL_CANDIDATES; i++) {
    list.push(makeCandidate(i));
    if (i % SLICE === SLICE - 1) await yieldToMain();
  }
}

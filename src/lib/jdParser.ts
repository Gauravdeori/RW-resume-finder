import type { Filters, ForeignFilter, Industry, Level, OverseasFilter, Position, Seniority, Degree } from './types';

/**
 * Turn a pasted job description into filters.
 *
 * Prototype: keyword rules. The real product can replace the body of `parseJobDescription`
 * with an AI call that returns the same `JdResult` shape as JSON; nothing else needs to change.
 * Only required items become filters: sentences marked "preferred", "a plus" etc. are skipped.
 */

export interface JdResult {
  patch: Partial<Filters>;
  filled: number;
}

export const EXAMPLE_JD = `Finance Manager, FP&A, at a global medical device company (Tokyo)

Our client, a multinational healthcare company, is hiring a Finance Manager to lead FP&A for the Japan business. You will report to the Finance Director and partner with the regional team in Singapore.

Requirements: 8+ years in finance or accounting, experience in a foreign-affiliated company, business-level English and native Japanese. MBA or CPA preferred. Overseas experience is a plus.`;

const OPTIONAL = /\b(preferred|a plus|nice to have|desirable|advantageous|bonus|ideally)\b|歓迎|尚可|あれば尚/i;

const INDUSTRY_RULES: [Industry, RegExp][] = [
  ['technology', /\b(software|saas|cloud|internet|semiconductors?|tech(nology)? (company|firm)|digital platform)\b|IT企業|テクノロジー/gi],
  ['financial', /\b(bank|banking|financial services|investment bank|asset management|insurance|securities|fintech|private equity|hedge fund)\b|金融|銀行|証券|保険/gi],
  ['healthcare', /\b(healthcare|health care|pharma\w*|medical|biotech\w*|life sciences?|hospital|clinical)\b|製薬|医療|ヘルスケア/gi],
  ['manufacturing', /\b(manufactur\w*|factory|automotive|industrial|machinery)\b|製造|メーカー/gi],
  ['consumer', /\b(retail|consumer goods|fmcg|cpg|e-?commerce|fashion|luxury|food and beverage)\b|小売|消費財/gi],
  ['telecoms', /\b(telecom\w*|mobile network|5g|carrier)\b|通信/gi],
  ['professional', /\b(consulting|consultancy|advisory|audit firm|law firm|professional services)\b|コンサル/gi],
  ['energy', /\b(energy|utilit(y|ies)|oil and gas|renewables?|power generation|infrastructure)\b|エネルギー|電力/gi],
];

const POSITION_RULES: [Position, RegExp][] = [
  ['finance', /\b(finance|financial planning|fp&a|accounting|accountant|controller|cpa|treasury)\b|財務|経理|会計/gi],
  ['sales', /\b(sales|business development|account executive|account manager)\b|営業/gi],
  ['marketing', /\b(marketing|brand manager|communications)\b|マーケティング/gi],
  ['hr', /\b(human resources|hr|recruiting|recruiter|talent acquisition)\b|人事|採用/gi],
  ['it', /\b(software engineer\w*|developer|engineering manager|data scientist|devops|cloud engineer|infrastructure engineer)\b|エンジニア|開発/gi],
  ['legal', /\b(legal|compliance|counsel|lawyer|attorney|regulatory affairs)\b|法務|コンプライアンス/gi],
  ['supply', /\b(supply chain|logistics|procurement|purchasing|buyer|sourcing)\b|物流|調達|購買/gi],
  ['gm', /\b(general manager|managing director|country manager|ceo|p&l)\b|事業責任者|経営/gi],
];

/** Checked in order: the most senior match wins. */
const SENIORITY_RULES: [Seniority, RegExp][] = [
  ['Y', /\b(chief|ceo|cfo|cto|coo|vp|vice president|executive director|president)\b|役員|執行役員/i],
  ['B', /\b(director|head of|department head|general manager)\b|部長/i],
  ['K', /\b(manager|team lead(er)?)\b|課長|マネージャー/i],
  ['S+', /\b(senior|sr\.?)\b|主任/i],
  ['S', /\b(associate|analyst|specialist|coordinator|assistant|junior)\b|担当者/i],
];

const LEVEL_WORDS: [Level, string][] = [
  ['Native', 'native(?:[- ]level)?'],
  ['Fluent', 'fluent|fluency in'],
  ['Business', 'business(?:[- ]level)?'],
  ['Conversational', 'conversational'],
];

function languageLevel(body: string, lang: 'english' | 'japanese'): Level | null {
  const jaWord = lang === 'english' ? '英語' : '日本語';
  for (const [level, words] of LEVEL_WORDS) {
    const before = new RegExp(`\\b(?:${words})\\s+(?:level\\s+)?${lang}\\b`, 'i');
    const after = new RegExp(`\\b${lang}\\s*(?:[:(-]|at|at a)?\\s*(?:${words})\\b`, 'i');
    if (before.test(body) || after.test(body)) return level;
  }
  const jaLevel: [Level, RegExp][] = [
    ['Native', new RegExp(`${jaWord}.{0,4}ネイティブ|ネイティブ.{0,4}${jaWord}`)],
    ['Fluent', new RegExp(`${jaWord}.{0,4}流暢|流暢な${jaWord}`)],
    ['Business', new RegExp(`${jaWord}.{0,4}ビジネス|ビジネスレベルの${jaWord}`)],
    ['Conversational', new RegExp(`${jaWord}.{0,4}日常会話|日常会話レベルの${jaWord}`)],
  ];
  for (const [level, re] of jaLevel) if (re.test(body)) return level;
  return null;
}

function bestMatch<T>(body: string, rules: [T, RegExp][]): T | null {
  let best: T | null = null;
  let bestScore = 0;
  for (const [value, re] of rules) {
    const score = (body.match(re) ?? []).length;
    if (score > bestScore) {
      best = value;
      bestScore = score;
    }
  }
  return best;
}

function firstMatch<T>(text: string, rules: [T, RegExp][]): T | null {
  for (const [value, re] of rules) if (re.test(text)) return value;
  return null;
}

export function parseJobDescription(text: string): JdResult {
  const lines = text.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  const titleLine = lines[0] ?? '';
  const required = text
    .split(/(?<=[.!?。])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s && !OPTIONAL.test(s));
  const body = required.join('\n');

  const patch: Partial<Filters> = {};

  const industry = bestMatch(body, INDUSTRY_RULES);
  if (industry) patch.industries = [industry];

  const position = bestMatch(body, POSITION_RULES);
  if (position) patch.positions = [position];

  // The job title is the most reliable place for seniority; fall back to the whole text.
  const seniority = firstMatch(titleLine, SENIORITY_RULES) ?? firstMatch(body, SENIORITY_RULES);
  if (seniority) patch.seniority = [seniority];

  const english = languageLevel(body, 'english');
  if (english) patch.englishMin = english;
  const japanese = languageLevel(body, 'japanese');
  if (japanese) patch.japaneseMin = japanese;

  let foreign: ForeignFilter | null = null;
  if (/\b(two or more|multiple|several) (foreign|global|multinational)/i.test(body)) foreign = 'twice';
  else if (/foreign[- ]affiliated|foreign compan|gaishi|global compan(y|ies) experience|外資/i.test(body)) foreign = 'once';
  if (foreign) patch.foreign = foreign;

  let overseas: OverseasFilter | null = null;
  if (/overseas experience|experience (living|working) (abroad|overseas)|international assignment|海外(勤務|経験|在住)/i.test(body)) overseas = 'yes';
  if (overseas) patch.overseas = overseas;

  const degrees: Degree[] = [];
  if (/\bMBA\b/.test(body)) degrees.push('MBA');
  if (/\bPh\.?D\b/i.test(body)) degrees.push('PhD');
  if (degrees.length) patch.degrees = degrees;

  return { patch, filled: Object.keys(patch).length };
}

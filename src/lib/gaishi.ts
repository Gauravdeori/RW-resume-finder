import { GAISHI_SCORES, type ForeignFilter, type GaishiScore, type Level, type LevelFilter, type OverseasFilter } from './types';

/** English: Native/Fluent 3, Business 2, Conversational 1, Basic 0. */
export function englishPoints(level: Level): number {
  switch (level) {
    case 'Native':
    case 'Fluent':
      return 3;
    case 'Business':
      return 2;
    case 'Conversational':
      return 1;
    default:
      return 0;
  }
}

/** Foreign companies: 1 point each, max 2. */
export function foreignCompanyPoints(count: number): number {
  return Math.min(2, Math.max(0, count));
}

/** Overseas: 1 point if any time abroad, 2 if 3 years or more. */
export function overseasPoints(years: number): number {
  if (years >= 3) return 2;
  return years > 0 ? 1 : 0;
}

export function gaishiPoints(english: Level, foreignCount: number, yearsOverseas: number): number {
  return englishPoints(english) + foreignCompanyPoints(foreignCount) + overseasPoints(yearsOverseas);
}

/** A = 6–7, B = 4–5, C = 2–3, D = 0–1. */
const scoreOf = (p: number): GaishiScore => (p >= 6 ? 'A' : p >= 4 ? 'B' : p >= 2 ? 'C' : 'D');

export function gaishiScore(english: Level, foreignCount: number, yearsOverseas: number): GaishiScore {
  return scoreOf(gaishiPoints(english, foreignCount, yearsOverseas));
}

/**
 * The scores a candidate can have when the score's parts are filtered (English level, foreign companies, time
 * overseas), best first: all Any gives A to D; Fluent English + twice or more + lived overseas gives A only.
 * Japanese is shown with the parts but does not count towards the score.
 */
export function gaishiRange(englishMin: LevelFilter, foreign: ForeignFilter, overseas: OverseasFilter): GaishiScore[] {
  const english = englishMin === 'any' ? [0, 3] : [englishPoints(englishMin), 3];
  const companies = { any: [0, 2], never: [0, 0], once: [1, 2], twice: [2, 2] }[foreign];
  const abroad = { any: [0, 2], yes: [1, 2], no: [0, 0] }[overseas];
  const best = scoreOf(english[1] + companies[1] + abroad[1]);
  const worst = scoreOf(english[0] + companies[0] + abroad[0]);
  return GAISHI_SCORES.slice(GAISHI_SCORES.indexOf(best), GAISHI_SCORES.indexOf(worst) + 1);
}

import type { GaishiScore, Level } from './types';

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
export function gaishiScore(english: Level, foreignCount: number, yearsOverseas: number): GaishiScore {
  const p = gaishiPoints(english, foreignCount, yearsOverseas);
  if (p >= 6) return 'A';
  if (p >= 4) return 'B';
  if (p >= 2) return 'C';
  return 'D';
}

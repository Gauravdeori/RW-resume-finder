import type { Jlpt, Level, LevelFilter } from './types';

/**
 * Test scores the recruiter can type or pick instead of a level. The level is what filters ("this level or higher");
 * the score only sets it.
 */

export const TOEIC_MIN = 10;
export const TOEIC_MAX = 990;

/** TOEIC to English level: under 400 Basic, 400-599 Conversational, 600-779 Business, 780 and up Fluent (never Native). */
export function toeicLevel(score: number): Level {
  if (score < 400) return 'Basic';
  if (score < 600) return 'Conversational';
  if (score < 780) return 'Business';
  return 'Fluent';
}

/** JLPT to Japanese level: N5, N4 Basic; N3 Conversational; N2 Business; N1 Fluent. */
export const JLPT_LEVEL: Record<Jlpt, Level> = { N5: 'Basic', N4: 'Basic', N3: 'Conversational', N2: 'Business', N1: 'Fluent' };

/**
 * The JLPT level shown when a Japanese level is picked: the lowest one that gives that level.
 * Native speakers do not take the JLPT, so Native (and Any) has none.
 */
export function jlptForLevel(level: LevelFilter, current: Jlpt | null): Jlpt | null {
  if (level === 'any' || level === 'Native') return null;
  if (current && JLPT_LEVEL[current] === level) return current;
  return ({ Basic: 'N5', Conversational: 'N3', Business: 'N2', Fluent: 'N1' } as const)[level];
}

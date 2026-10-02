/**
 * Dummy Resume Studio conversions for the Upload Resume and Dashboard pages.
 * Stored in the browser so uploads made in the demo show up on the dashboard. Every file name is invented.
 */

export type Lang = 'ja' | 'en';
export type ConversionMode = 'exact' | 'optimized';
export type ConversionEngine = 'standard' | 'complex';
export type ConversionStatus = 'exported' | 'review';

export interface Conversion {
  id: number;
  fileName: string;
  sizeKb: number;
  source: Lang;
  target: Lang;
  mode: ConversionMode;
  dualLanguage: boolean;
  hasTables: boolean;
  engine: ConversionEngine;
  status: ConversionStatus;
  uploadedBy: string;
  createdAt: string; // ISO date-time
}

export const CURRENT_USER = 'resume-tester';
/** The dashboard keeps only the most recent conversions, like Resume Studio. */
export const KEEP_LAST = 15;
export const MAX_FILE_MB = 10;
export const ACCEPTED_TYPES = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'txt'] as const;

const KEY = 'resumeFinder.conversions.v1';

const SEED_FILES: [string, number, Partial<Conversion>][] = [
  ['Haruki Tanabe.pdf', 211.1, { engine: 'complex' }],
  ['職務経歴書_営業.docx', 38.4, { hasTables: true, engine: 'complex' }],
  ['履歴書_2026.docx', 41.2, { hasTables: true, engine: 'complex' }],
  ['CV_Emily_Carter.docx', 29.8, { source: 'en', target: 'ja', status: 'review' }],
  ['小川 美咲.pdf', 236.3, { engine: 'complex' }],
  ['kenji.DOCX', 32.4, {}],
  ['職務経歴書_財務.docx', 44.0, { hasTables: true }],
  ['Resume - Daniel Ross.pdf', 187.5, { source: 'en', target: 'en' }],
  ['経歴書_最新版.xlsx', 18.9, { hasTables: true, engine: 'complex' }],
  ['Sato Yuna CV.pdf', 158.0, { mode: 'optimized' }],
  ['職務経歴書.doc', 52.7, { hasTables: true }],
  ['Takeshi Mori resume.txt', 6.3, { mode: 'optimized' }],
  ['経歴書_バイリンガル.docx', 61.9, { dualLanguage: true, engine: 'complex' }],
  ['Chen Wei CV.pdf', 142.6, { source: 'en', target: 'en', mode: 'optimized' }],
  ['履歴書.pdf', 97.1, {}],
];

function seed(): Conversion[] {
  const now = Date.now();
  // Newest first; one every 20–60 minutes, going back from now.
  let t = now - 20 * 60_000;
  return SEED_FILES.map(([fileName, sizeKb, extra], i) => {
    const c: Conversion = {
      id: 781 - i,
      fileName,
      sizeKb,
      source: 'ja',
      target: 'ja',
      mode: 'exact',
      dualLanguage: false,
      hasTables: false,
      engine: 'standard',
      status: 'exported',
      uploadedBy: CURRENT_USER,
      createdAt: new Date(t).toISOString(),
      ...extra,
    };
    t -= (20 + ((i * 17) % 41)) * 60_000;
    return c;
  });
}

export function loadConversions(): Conversion[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return seed();
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Conversion[]) : seed();
  } catch {
    return seed();
  }
}

export function storeConversions(list: Conversion[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable: changes last for this visit only */
  }
}

export const fileExtension = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';

export type FileProblem = 'type' | 'size' | null;
export function checkFile(file: File): FileProblem {
  if (!(ACCEPTED_TYPES as readonly string[]).includes(fileExtension(file.name))) return 'type';
  if (file.size > MAX_FILE_MB * 1024 * 1024) return 'size';
  return null;
}

/** Build the dashboard entry for a file "converted" in the demo. */
export function newConversion(
  list: Conversion[],
  file: { name: string; size: number },
  settings: { source: Lang; target: Lang; mode: ConversionMode; engine: ConversionEngine },
): Conversion {
  const ext = fileExtension(file.name);
  return {
    id: Math.max(780, ...list.map((c) => c.id)) + 1,
    fileName: file.name,
    sizeKb: Math.max(0.1, Math.round((file.size / 1024) * 10) / 10),
    ...settings,
    dualLanguage: false,
    hasTables: ext === 'xlsx' || ext === 'xls',
    // Cross-language conversions go to a reviewer before export.
    status: settings.source === settings.target ? 'exported' : 'review',
    uploadedBy: CURRENT_USER,
    createdAt: new Date().toISOString(),
  };
}

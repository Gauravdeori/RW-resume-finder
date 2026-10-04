import { CANDIDATES } from './data';
import type { Dict } from './i18n';
import { topEducation } from './types';

/**
 * File > Export results: the current result list, in its current order, as a CSV file (UTF-8 with a BOM so Excel
 * shows Japanese correctly). Loaded on demand the first time it is used.
 */
export function downloadCsv(rows: Uint32Array, t: Dict) {
  const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const head = [
    t.csv.name,
    t.csv.title,
    t.csv.company,
    t.factAge,
    t.factSeniority,
    t.csv.industry,
    t.factEnglish,
    t.factJapanese,
    t.factGaishi,
    t.factSchool,
    t.csv.toeic,
    t.csv.jlpt,
    t.csv.qualifications,
    t.csv.cvUpdated,
  ];
  const body = Array.from(rows, (i) => {
    const c = CANDIDATES[i];
    const top = topEducation(c);
    return [
      t.displayName(c),
      c.currentTitle,
      c.currentCompany,
      c.age,
      t.seniorityFact(c.seniority),
      t.industry[c.industry],
      t.level[c.englishLevel],
      t.level[c.japaneseLevel],
      c.gaishiScore,
      t.schoolWithRating(top.school, top.schoolRating),
      c.toeicScore ?? '',
      c.jlpt ?? '',
      [...c.qualifications.map((q) => t.qualificationFull[q]), ...c.otherQualifications].join('; '),
      c.cvUpdatedAt,
    ];
  });
  const csv = [head, ...body].map((r) => r.map(q).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `resume-finder-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

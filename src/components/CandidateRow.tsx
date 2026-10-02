import type { ReactNode } from 'react';
import { useI18n } from '../lib/i18n';
import type { Candidate } from '../lib/types';

/** Drawn placeholder for page 1 of the converted CV. Always paper-white, also in dark mode. */
export function CvThumb() {
  const grey = 'block h-px bg-[#c4c4c4]';
  const red = 'block h-[2px] w-4 bg-[#FF4D64]';
  return (
    <span aria-hidden className="flex h-[100px] w-[80px] flex-col gap-[5px] border border-control bg-white px-2.5 pt-3 shadow-sm">
      <span className="block h-[3px] w-7 bg-[#222]" />
      <span className={grey} />
      <span className={`${grey} w-3/4`} />
      <span className={red} />
      <span className={grey} />
      <span className={grey} />
      <span className={red} />
      <span className={grey} />
      <span className={`${grey} w-2/3`} />
    </span>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[12px] text-muted">{label}</dt>
      <dd className="mt-0.5 text-[14px] font-medium leading-snug">{children}</dd>
    </div>
  );
}

export function GaishiBadge({ score }: { score: string }) {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center bg-accent text-[12px] font-bold text-on-accent">{score}</span>
  );
}

export function CandidateRow({ c, onOpenCv }: { c: Candidate; onOpenCv: (c: Candidate) => void }) {
  const { t } = useI18n();
  const name = t.displayName(c);
  const previously = c.previousCompanies.map((p) => p.company).slice(0, 3);

  return (
    <li className="grid gap-5 border-b border-line px-5 py-6 last:border-b-0 md:grid-cols-[minmax(0,1fr)_252px_88px] md:gap-6 md:px-6">
      <div className="min-w-0">
        <h3 className="text-[17px] font-bold leading-tight">{name}</h3>
        <p className="mt-1 text-[14px] font-medium">{t.titleAt(c)}</p>
        <p className="mt-2 max-w-[460px] text-[13px] leading-relaxed text-muted">{t.summary(c)}</p>
        {previously.length > 0 && (
          <p className="mt-2 text-[13px] text-muted">
            {t.previouslyAt} <span className="text-ink">{previously.join(', ')}</span>
          </p>
        )}
      </div>

      <dl className="grid grid-cols-2 content-start gap-x-6 gap-y-3">
        <Fact label={t.factAge}>{c.age}</Fact>
        <Fact label={t.factSeniority}>{t.seniorityFact(c.seniority)}</Fact>
        <Fact label={t.factEnglish}>{t.level[c.englishLevel]}</Fact>
        <Fact label={t.factJapanese}>{t.level[c.japaneseLevel]}</Fact>
        <Fact label={t.factGaishi}>
          <GaishiBadge score={c.gaishiScore} />
        </Fact>
        <Fact label={t.factSchool}>{t.schoolWithClass(c.school, c.schoolClass)}</Fact>
      </dl>

      <div className="flex items-end gap-4 md:flex-col md:items-end md:justify-between">
        <button type="button" onClick={() => onOpenCv(c)} aria-label={t.openCvFor(name)} className="block">
          <CvThumb />
        </button>
        <button type="button" onClick={() => onOpenCv(c)} className="text-[13px] underline underline-offset-2">
          {t.openCv}
        </button>
      </div>
    </li>
  );
}

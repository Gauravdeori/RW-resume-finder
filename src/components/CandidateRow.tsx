import type { ReactNode } from 'react';
import { useI18n } from '../lib/i18n';
import type { Candidate } from '../lib/types';

/** Drawn placeholder for page 1 of the converted CV. Always paper-white, also in dark mode. */
export function CvThumb() {
  const grey = 'block h-px bg-[#c4c4c4]';
  const red = 'block h-[2px] w-4 bg-[#FF4D64]';
  return (
    <span
      aria-hidden
      className="flex h-[76px] w-[60px] flex-col gap-[4px] rounded border border-black/10 bg-white px-2 pt-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-[transform,box-shadow] duration-150 group-hover/thumb:-translate-y-0.5 group-hover/thumb:shadow-[0_6px_16px_rgba(0,0,0,0.16)] md:h-[100px] md:w-[80px] md:gap-[5px] md:px-2.5 md:pt-3"
    >
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
      <dd className="mt-0.5 text-[14px] leading-snug font-medium">{children}</dd>
    </div>
  );
}

/** Gaishi score as a small rounded red pill. */
export function GaishiBadge({ score }: { score: string }) {
  return (
    <span className="inline-flex h-5 min-w-[30px] items-center justify-center rounded-full bg-accent px-2 text-[11px] font-bold text-on-accent">
      {score}
    </span>
  );
}

/** Card layout shared by result rows and their loading skeletons. */
const ROW_GRID =
  'grid grid-cols-[minmax(0,1fr)_60px] gap-x-4 gap-y-4 rounded-xl border border-line bg-card px-4 py-5 shadow-card sm:px-5 md:grid-cols-[minmax(0,1fr)_252px_88px] md:gap-6 md:px-6';

export function CandidateRow({ c, index, onOpenCv }: { c: Candidate; index: number; onOpenCv: (c: Candidate) => void }) {
  const { t } = useI18n();
  const name = t.displayName(c);
  const previously = c.previousCompanies.map((p) => p.company).slice(0, 3);

  return (
    // Phones: name and summary with the CV thumbnail beside them, key facts underneath.
    // Desktop: summary | key facts | thumbnail.
    <li
      className={`${ROW_GRID} anim-fade-up transition-[border-color,box-shadow,transform] duration-150 hover:border-ink/25 hover:shadow-hover`}
      style={{ animationDelay: `${Math.min(index % 10, 9) * 30}ms` }}
    >
      <div className="col-start-1 row-start-1 min-w-0">
        <h3 className="text-[17px] leading-tight font-bold tracking-[-0.01em]">{name}</h3>
        <p className="mt-1 text-[14px] font-medium">{t.titleAt(c)}</p>
        <p className="mt-2 max-w-[460px] text-[13px] leading-relaxed text-muted">{t.summary(c)}</p>
        {previously.length > 0 && (
          <p className="mt-2 text-[13px] text-muted">
            {t.previouslyAt} <span className="text-ink">{previously.join(', ')}</span>
          </p>
        )}
      </div>

      <dl className="col-span-2 row-start-2 grid grid-cols-2 content-start gap-x-6 gap-y-2.5 border-t border-line pt-4 md:col-span-1 md:col-start-2 md:row-start-1 md:gap-y-3 md:border-t-0 md:pt-0">
        <Fact label={t.factAge}>{c.age}</Fact>
        <Fact label={t.factSeniority}>{t.seniorityFact(c.seniority)}</Fact>
        <Fact label={t.factEnglish}>{t.level[c.englishLevel]}</Fact>
        <Fact label={t.factJapanese}>{t.level[c.japaneseLevel]}</Fact>
        <Fact label={t.factGaishi}>
          <GaishiBadge score={c.gaishiScore} />
        </Fact>
        <Fact label={t.factSchool}>{t.schoolWithClass(c.school, c.schoolClass)}</Fact>
      </dl>

      <div className="col-start-2 row-start-1 flex flex-col items-end gap-2 md:col-start-3 md:justify-between">
        <button type="button" onClick={() => onOpenCv(c)} aria-label={t.openCvFor(name)} className="group/thumb block rounded">
          <CvThumb />
        </button>
        <button
          type="button"
          onClick={() => onOpenCv(c)}
          className="text-[12px] whitespace-nowrap underline underline-offset-2 transition-colors duration-150 hover:text-accent md:text-[13px]"
        >
          {t.openCv}
        </button>
      </div>
    </li>
  );
}

/** Placeholder row shown briefly while a search step loads. */
export function CandidateRowSkeleton() {
  return (
    <li aria-hidden className={ROW_GRID}>
      <div className="col-start-1 row-start-1 flex flex-col gap-2.5">
        <span className="skeleton h-4 w-40" />
        <span className="skeleton h-3.5 w-56" />
        <span className="skeleton mt-1 h-3 w-full max-w-[420px]" />
        <span className="skeleton h-3 w-4/5 max-w-[360px]" />
      </div>
      <div className="col-span-2 row-start-2 grid grid-cols-2 gap-x-6 gap-y-3 md:col-span-1 md:col-start-2 md:row-start-1">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className="skeleton h-8" />
        ))}
      </div>
      <div className="col-start-2 row-start-1 flex justify-end md:col-start-3">
        <span className="skeleton h-[76px] w-[60px] md:h-[100px] md:w-[80px]" />
      </div>
    </li>
  );
}

import { memo, type ReactNode } from 'react';
import { useI18n } from '../lib/i18n';
import type { Candidate } from '../lib/types';

/** Page 1 of the converted CV as a tiny inline SVG (no images to load). Paper-white in both themes. */
export function CvThumb() {
  return (
    <svg
      viewBox="0 0 80 100"
      aria-hidden
      className="h-[76px] w-[60px] rounded shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-transform duration-150 group-hover/thumb:-translate-y-0.5 @[640px]:h-[100px] @[640px]:w-[80px]"
    >
      <rect x="0.5" y="0.5" width="79" height="99" rx="3" fill="#fff" stroke="rgba(0,0,0,0.1)" />
      <rect x="10" y="12" width="28" height="3" fill="#222" />
      <g fill="#c4c4c4">
        <rect x="10" y="21" width="60" height="1" />
        <rect x="10" y="27" width="44" height="1" />
        <rect x="10" y="44" width="60" height="1" />
        <rect x="10" y="50" width="60" height="1" />
        <rect x="10" y="67" width="60" height="1" />
        <rect x="10" y="73" width="40" height="1" />
      </g>
      <g fill="#FF4D64">
        <rect x="10" y="35" width="16" height="2" />
        <rect x="10" y="58" width="16" height="2" />
      </g>
    </svg>
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

/**
 * Card layout of a result row. Responds to the results pane's width (container
 * queries): narrow = summary + thumbnail with key facts below; wide = summary | key facts | thumbnail.
 */
const ROW_GRID =
  'grid grid-cols-[minmax(0,1fr)_60px] gap-x-4 gap-y-4 rounded-xl border border-line bg-card px-4 py-5 shadow-card @[640px]:grid-cols-[minmax(0,1fr)_240px_80px] @[640px]:gap-6 @[640px]:px-6';

/** One result. Memoised: re-renders only when its candidate or the language changes. */
export const CandidateRow = memo(function CandidateRow({
  c,
  animate,
  onOpenCv,
}: {
  c: Candidate;
  /** Fade in (only for the first rows of a new result set). */
  animate: boolean;
  onOpenCv: (c: Candidate) => void;
}) {
  const { t } = useI18n();
  const name = t.displayName(c);
  const previously = c.previousCompanies.map((p) => p.company).slice(0, 3);

  return (
    <article className={`${ROW_GRID} ${animate ? 'anim-fade-up' : ''} hover:border-ink/25 hover:shadow-hover`}>
      <div className="col-start-1 row-start-1 min-w-0">
        <h2 className="text-[17px] leading-tight font-bold tracking-[-0.01em]">{name}</h2>
        <p className="mt-1 text-[14px] font-medium">{t.titleAt(c)}</p>
        <p className="mt-2 max-w-[460px] text-[13px] leading-relaxed text-muted">{t.summary(c)}</p>
        {previously.length > 0 && (
          <p className="mt-2 text-[13px] text-muted">
            {t.previouslyAt} <span className="text-ink">{previously.join(', ')}</span>
          </p>
        )}
      </div>

      <dl className="col-span-2 row-start-2 grid grid-cols-2 content-start gap-x-6 gap-y-2.5 border-t border-line pt-4 @[640px]:col-span-1 @[640px]:col-start-2 @[640px]:row-start-1 @[640px]:gap-y-3 @[640px]:border-t-0 @[640px]:pt-0">
        <Fact label={t.factAge}>{c.age}</Fact>
        <Fact label={t.factSeniority}>{t.seniorityFact(c.seniority)}</Fact>
        <Fact label={t.factEnglish}>{t.level[c.englishLevel]}</Fact>
        <Fact label={t.factJapanese}>{t.level[c.japaneseLevel]}</Fact>
        <Fact label={t.factGaishi}>
          <GaishiBadge score={c.gaishiScore} />
        </Fact>
        <Fact label={t.factSchool}>{t.schoolWithClass(c.school, c.schoolClass)}</Fact>
      </dl>

      <div className="col-start-2 row-start-1 flex flex-col items-end gap-2 @[640px]:col-start-3 @[640px]:justify-between">
        <button type="button" onClick={() => onOpenCv(c)} aria-label={t.openCvFor(name)} className="group/thumb block rounded">
          <CvThumb />
        </button>
        <button type="button" onClick={() => onOpenCv(c)} className="text-[12px] whitespace-nowrap underline underline-offset-2 hover:text-accent @[640px]:text-[13px]">
          {t.openCv}
        </button>
      </div>
    </article>
  );
});

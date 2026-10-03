import { memo, type ReactNode } from 'react';
import { useI18n } from '../lib/i18n';
import type { Candidate } from '../lib/types';

/** Fixed card height: the results page works out how many cards fit the screen from it. */
export const CARD_H = 152;

/** Page 1 of the converted CV as a tiny inline SVG (no images to load). Paper-white in both themes. */
export function CvThumb() {
  return (
    <svg
      viewBox="0 0 80 100"
      aria-hidden
      className="h-[70px] w-[56px] rounded shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-transform duration-150 group-hover/thumb:-translate-y-0.5"
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

function Fact({ label, children, title }: { label: string; children: ReactNode; title?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10.5px] leading-[13px] text-muted">{label}</dt>
      <dd className="mt-0.5 truncate text-[12.5px] leading-[16px] font-medium" title={title}>
        {children}
      </dd>
    </div>
  );
}

/** Gaishi score as a small rounded red pill. */
export function GaishiBadge({ score }: { score: string }) {
  return (
    <span className="inline-flex h-[18px] min-w-[28px] items-center justify-center rounded-full bg-accent px-2 text-[11px] font-bold text-on-accent">
      {score}
    </span>
  );
}

/**
 * One result as a compact card of fixed height: name, role, one line of context, six key facts, CV thumbnail.
 * Memoised: re-renders only when its candidate or the language changes.
 */
export const CandidateRow = memo(function CandidateRow({ c, onOpenCv }: { c: Candidate; onOpenCv: (c: Candidate) => void }) {
  const { t } = useI18n();
  const name = t.displayName(c);
  const school = t.schoolWithClass(c.school, c.schoolClass);

  return (
    <article
      className="anim-fade-up flex gap-4 overflow-hidden rounded-xl border border-line bg-card px-4 py-2.5 shadow-card hover:border-ink/25 hover:shadow-hover"
      style={{ height: CARD_H }}
    >
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-[16px] leading-[20px] font-bold tracking-[-0.01em]">{name}</h2>
        <p className="mt-0.5 truncate text-[13px] leading-[18px] font-medium">{t.titleAt(c)}</p>
        <p className="mt-0.5 truncate text-[12px] leading-[16px] text-muted">{t.cardMeta(c)}</p>
        <dl className="mt-1.5 grid grid-cols-3 gap-x-3 gap-y-1">
          <Fact label={t.factAge}>{c.age}</Fact>
          <Fact label={t.factSeniority}>{t.seniorityFact(c.seniority)}</Fact>
          <Fact label={t.factGaishi}>
            <GaishiBadge score={c.gaishiScore} />
          </Fact>
          <Fact label={t.factEnglish}>{t.level[c.englishLevel]}</Fact>
          <Fact label={t.factJapanese}>{t.level[c.japaneseLevel]}</Fact>
          <Fact label={t.factSchool} title={school}>
            {school}
          </Fact>
        </dl>
      </div>

      <div className="flex flex-none flex-col items-center justify-between">
        <button type="button" onClick={() => onOpenCv(c)} aria-label={t.openCvFor(name)} className="group/thumb block rounded">
          <CvThumb />
        </button>
        <button type="button" onClick={() => onOpenCv(c)} className="text-[12px] whitespace-nowrap underline underline-offset-2 hover:text-accent">
          {t.openCv}
        </button>
      </div>
    </article>
  );
});

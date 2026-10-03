import { memo, type ReactNode } from 'react';
import { useI18n } from '../lib/i18n';
import type { Candidate } from '../lib/types';

export type CardVariant = 'row' | 'tile';
export type Density = 'compact' | 'comfortable';

/**
 * Fixed card heights: the results page works out how many cards fit the screen from them.
 * Compact rows and tiles are the same height, so five rows fit on a 1440x900 screen in either view.
 */
export const CARD_H: Record<CardVariant, Record<Density, number>> = {
  row: { compact: 104, comfortable: 122 },
  tile: { compact: 104, comfortable: 122 },
};

/** Page 1 of the converted CV as a tiny inline SVG (no images to load). Paper-white in both themes. */
export function CvThumb({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 80 100" aria-hidden className={`rounded shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-transform duration-150 group-hover/thumb:-translate-y-0.5 ${className}`}>
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

/** Gaishi score letter, large, on a red badge in the card's top-right corner. */
export function GaishiBadge({ score, size }: { score: string; size: 'lg' | 'md' }) {
  const { t } = useI18n();
  return (
    <span
      role="img"
      aria-label={t.gaishiBadge(score)}
      title={t.gaishiBadge(score)}
      className={`flex flex-none items-center justify-center rounded-lg bg-[linear-gradient(135deg,var(--accent),var(--accent-deep))] leading-none font-bold text-white shadow-accent ${
        size === 'lg' ? 'h-11 w-11 text-[28px]' : 'h-9 w-9 text-[22px]'
      }`}
    >
      {score}
    </span>
  );
}

/**
 * One result as a card of fixed height.
 * - "row" (1-column view): name with the details line beside it, role, five key facts in one line, CV thumbnail,
 *   and the gaishi letter large in the top-right corner.
 * - "tile" (3-column view, default): the same facts in five short lines, as tall as a compact row, so a
 *   page shows 3 columns by 5 rows.
 * Memoised: re-renders only when its candidate, layout or language changes.
 */
export const CandidateRow = memo(function CandidateRow({
  c,
  variant,
  density,
  onOpenCv,
}: {
  c: Candidate;
  variant: CardVariant;
  density: Density;
  onOpenCv: (c: Candidate) => void;
}) {
  const { t } = useI18n();
  const name = t.displayName(c);
  const school = t.schoolWithClass(c.school, c.schoolClass);
  const roomy = density === 'comfortable';
  const facts = (
    <>
      <Fact label={t.factAge}>{c.age}</Fact>
      <Fact label={t.factSeniority}>{t.seniorityFact(c.seniority)}</Fact>
      <Fact label={t.factEnglish}>{t.level[c.englishLevel]}</Fact>
      <Fact label={t.factJapanese}>{t.level[c.japaneseLevel]}</Fact>
      <Fact label={t.factSchool} title={school}>
        {school}
      </Fact>
    </>
  );
  const openCv = (
    <button type="button" onClick={() => onOpenCv(c)} className="text-[12px] whitespace-nowrap underline underline-offset-2 hover:text-accent">
      {t.openCv}
    </button>
  );

  if (variant === 'tile') {
    const en = `${t.factEnglishShort} ${t.level[c.englishLevel]}`;
    const jp = `${t.factJapaneseShort} ${t.level[c.japaneseLevel]}`;
    const factLine = [`${t.factAge} ${c.age}`, t.seniorityFact(c.seniority), en, jp].join(' · ');
    return (
      <article
        className={`anim-fade-up flex flex-col overflow-hidden rounded-xl border border-line bg-card px-3.5 shadow-card hover:border-accent/40 hover:shadow-hover ${roomy ? 'py-3' : 'py-2'}`}
        style={{ height: CARD_H.tile[density] }}
      >
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[14.5px] leading-[18px] font-bold tracking-[-0.01em]">{name}</h2>
            <p className="truncate text-[12.5px] leading-[16px] font-medium">{t.titleAt(c)}</p>
          </div>
          <GaishiBadge score={c.gaishiScore} size="md" />
        </div>
        <p className="truncate text-[11.5px] leading-[15px] text-muted">{t.cardMeta(c)}</p>
        <dl className={`text-[12px] leading-[15px] ${roomy ? 'mt-2' : 'mt-1'}`}>
          <div className="truncate" title={factLine}>
            <dt className="sr-only">{`${t.factAge}, ${t.factSeniority}, ${t.factEnglish}, ${t.factJapanese}`}</dt>
            <dd className="inline font-medium">{factLine}</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="sr-only">{t.factSchool}</dt>
            <dd className="min-w-0 flex-1 truncate text-muted" title={school}>
              {school}
            </dd>
            {openCv}
          </div>
        </dl>
      </article>
    );
  }

  return (
    <article
      className={`anim-fade-up flex gap-4 overflow-hidden rounded-xl border border-line bg-card px-4 shadow-card hover:border-accent/40 hover:shadow-hover ${roomy ? 'py-3.5' : 'py-2.5'}`}
      style={{ height: CARD_H.row[density] }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-4">
          <h2 className="max-w-[55%] flex-none truncate text-[16px] leading-[20px] font-bold tracking-[-0.01em]">{name}</h2>
          <p className="ml-auto min-w-0 truncate text-right text-[12px] leading-[16px] text-muted">{t.cardMeta(c)}</p>
        </div>
        <p className="mt-0.5 truncate text-[13px] leading-[18px] font-medium">{t.titleAt(c)}</p>
        <dl className={`grid grid-cols-5 gap-x-4 ${roomy ? 'mt-3' : 'mt-2'}`}>{facts}</dl>
      </div>
      <div className="flex flex-none flex-col items-center justify-between">
        <button type="button" onClick={() => onOpenCv(c)} aria-label={t.openCvFor(name)} className="group/thumb block rounded">
          <CvThumb className="h-[52px] w-[42px]" />
        </button>
        {openCv}
      </div>
      <GaishiBadge score={c.gaishiScore} size="lg" />
    </article>
  );
});

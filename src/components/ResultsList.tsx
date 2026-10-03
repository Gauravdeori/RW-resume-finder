import type { ReactNode } from 'react';
import { filterChips } from '../lib/describe';
import type { SortKey } from '../lib/filter';
import { useI18n } from '../lib/i18n';
import type { Candidate, Filters } from '../lib/types';
import { CandidateRow, CandidateRowSkeleton } from './CandidateRow';
import { Toggle } from './controls';

interface Props {
  steps: Filters[];
  results: Candidate[];
  visible: number;
  sort: SortKey;
  trail: ReactNode;
  /** Show skeleton rows while switching search steps. */
  loading: boolean;
  onSort: (s: SortKey) => void;
  onMore: () => void;
  onOpenCv: (c: Candidate) => void;
  onSearchWithin: () => void;
  onSave: () => void;
  onEdit: () => void;
  onNewSearch: () => void;
}

const LIFT = 'transition-[transform,box-shadow,border-color,filter] duration-150 hover:-translate-y-px active:translate-y-0';
const SECONDARY = `h-10 rounded-lg border border-line bg-card px-3.5 text-[13px] font-medium hover:border-ink/45 hover:shadow-control ${LIFT}`;

export function ResultsList({
  steps,
  results,
  visible,
  sort,
  trail,
  loading,
  onSort,
  onMore,
  onOpenCv,
  onSearchWithin,
  onSave,
  onEdit,
  onNewSearch,
}: Props) {
  const { t } = useI18n();
  const shown = results.slice(0, visible);

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="tabular text-[26px] leading-tight font-bold tracking-[-0.02em] sm:text-[32px]" aria-live="polite">
          {t.resultsTitle(results.length)}
        </h1>
        {/* Phones: full-width "Search within", then three equal buttons. Desktop: one row. */}
        <div className="grid grid-cols-3 items-center gap-2 sm:flex sm:flex-wrap sm:gap-2.5">
          <button
            type="button"
            onClick={onSearchWithin}
            disabled={results.length === 0}
            className={`col-span-3 h-11 rounded-lg bg-[linear-gradient(135deg,var(--accent),var(--accent-deep))] px-4 text-[13px] font-bold text-on-accent shadow-accent hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45 sm:h-10 ${LIFT}`}
          >
            {t.searchWithin}
          </button>
          <button type="button" onClick={onSave} className={SECONDARY}>
            {t.saveSearch}
          </button>
          <button type="button" onClick={onEdit} className={SECONDARY}>
            {t.editFilters}
          </button>
          <button type="button" onClick={onNewSearch} className="h-10 text-[13px] text-muted underline underline-offset-2 hover:text-ink sm:ml-1 sm:h-auto">
            {t.newSearch}
          </button>
        </div>
      </div>

      <div className="mt-5">{trail}</div>

      <div className="mt-4 flex flex-col gap-2">
        {steps.map((s, i) => {
          const chips = filterChips(s, t);
          return (
            <div key={i} className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5">
              <span className="w-[64px] flex-none text-[12px] font-medium text-muted sm:w-[72px]">{t.searchN(i + 1)}</span>
              {(chips.length ? chips : [t.chip.none]).map((c, j) => (
                <span key={j} className="inline-flex h-6 items-center rounded-full border border-line bg-card px-2.5 text-[12px] leading-none">
                  {c}
                </span>
              ))}
            </div>
          );
        })}
      </div>

      <div role="group" aria-label={t.sortBy} className="mt-5 flex items-center gap-2">
        <span className="mr-1 text-[12px] text-muted">{t.sortBy}</span>
        <Toggle on={sort === 'best'} onClick={() => onSort('best')} className="h-8 text-[12px]">
          {t.sortBest}
        </Toggle>
        <Toggle on={sort === 'new'} onClick={() => onSort('new')} className="h-8 text-[12px]">
          {t.sortNew}
        </Toggle>
      </div>

      {loading ? (
        <ul className="mt-5 flex flex-col gap-3" aria-busy="true">
          {Array.from({ length: 3 }, (_, i) => (
            <CandidateRowSkeleton key={i} />
          ))}
        </ul>
      ) : results.length === 0 ? (
        <p className="anim-fade-up mt-5 rounded-xl border border-line bg-card px-6 py-10 text-[14px] shadow-card">{t.resultsZero}</p>
      ) : (
        <>
          <ul className="mt-5 flex flex-col gap-3">
            {shown.map((c, i) => (
              <CandidateRow key={c.id} c={c} index={i} onOpenCv={onOpenCv} />
            ))}
          </ul>
          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="tabular text-[12px] text-muted" aria-live="polite">
              {t.showingOf(shown.length, results.length)}
            </p>
            {shown.length < results.length && (
              <button type="button" onClick={onMore} className={`${SECONDARY} px-5`}>
                {t.showMore}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

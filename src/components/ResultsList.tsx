import type { ReactNode } from 'react';
import { filterChips } from '../lib/describe';
import type { SortKey } from '../lib/filter';
import { useI18n } from '../lib/i18n';
import type { Candidate, Filters } from '../lib/types';
import { CandidateRow } from './CandidateRow';
import { Toggle } from './controls';

interface Props {
  steps: Filters[];
  results: Candidate[];
  visible: number;
  sort: SortKey;
  trail: ReactNode;
  onSort: (s: SortKey) => void;
  onMore: () => void;
  onOpenCv: (c: Candidate) => void;
  onSearchWithin: () => void;
  onSave: () => void;
  onEdit: () => void;
  onNewSearch: () => void;
}

export function ResultsList({
  steps,
  results,
  visible,
  sort,
  trail,
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
        <h1 className="text-[26px] leading-tight font-extrabold tracking-tight sm:text-[32px]" aria-live="polite">
          {t.resultsTitle(results.length)}
        </h1>
        {/* Phones: full-width "Search within", then three equal buttons. Desktop: one row. */}
        <div className="grid grid-cols-3 items-center gap-2 sm:flex sm:flex-wrap sm:gap-2.5 lg:gap-3">
          <button
            type="button"
            onClick={onSearchWithin}
            disabled={results.length === 0}
            className="col-span-3 h-11 bg-accent px-4 sm:h-10 text-[13px] font-bold text-on-accent hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {t.searchWithin}
          </button>
          <button type="button" onClick={onSave} className="h-10 border border-ink px-2 text-[13px] hover:bg-sel hover:text-on-sel sm:px-3.5">
            {t.saveSearch}
          </button>
          <button type="button" onClick={onEdit} className="h-10 border border-ink px-2 text-[13px] hover:bg-sel hover:text-on-sel sm:px-3.5">
            {t.editFilters}
          </button>
          <button type="button" onClick={onNewSearch} className="h-10 text-[13px] underline underline-offset-2 sm:ml-1 sm:h-auto">
            {t.newSearch}
          </button>
        </div>
      </div>

      <div className="mt-5">{trail}</div>

      <div className="mt-4 flex flex-col gap-2">
        {steps.map((s, i) => {
          const chips = filterChips(s, t);
          return (
            <div key={i} className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <span className="w-[60px] flex-none text-[12px] text-muted sm:w-[72px]">{t.searchN(i + 1)}</span>
              {(chips.length ? chips : [t.chip.none]).map((c, j) => (
                <span key={j} className="border border-control bg-card px-2 py-[3px] text-[12px] leading-tight">
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

      {results.length === 0 ? (
        <p className="-mx-4 mt-5 bg-card px-4 py-10 text-[14px] sm:mx-0 sm:px-6">{t.resultsZero}</p>
      ) : (
        <>
          <ul className="-mx-4 mt-5 bg-card sm:mx-0">
            {shown.map((c) => (
              <CandidateRow key={c.id} c={c} onOpenCv={onOpenCv} />
            ))}
          </ul>
          <div className="mt-5 flex flex-col items-center gap-2">
            <p className="text-[12px] text-muted" aria-live="polite">
              {t.showingOf(shown.length, results.length)}
            </p>
            {shown.length < results.length && (
              <button type="button" onClick={onMore} className="h-10 border border-ink px-5 text-[13px] hover:bg-sel hover:text-on-sel">
                {t.showMore}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

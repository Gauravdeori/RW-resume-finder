import { useVirtualizer } from '@tanstack/react-virtual';
import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CANDIDATES } from '../lib/data';
import { activeChips } from '../lib/describe';
import type { SortKey } from '../lib/filter';
import { fmtNum, useI18n } from '../lib/i18n';
import type { Candidate, Filters } from '../lib/types';
import { useAnimatedNumber } from '../lib/useAnimatedNumber';
import { CandidateRow } from './CandidateRow';
import { Toggle } from './controls';

/** Red count card: coral to a slightly deeper red, soft red shadow. */
export const COUNT_CARD = 'bg-[linear-gradient(135deg,var(--accent)_0%,var(--accent-deep)_100%)] shadow-accent';
const LIFT = 'transition-transform duration-150 hover:-translate-y-px active:translate-y-0';
const SECONDARY = `h-10 rounded-lg border border-line bg-card px-3.5 text-[13px] font-medium hover:border-ink/45 hover:shadow-control ${LIFT}`;

/** Live count: a big rolling number with tabular figures and a fixed width, so nothing shifts as it changes. */
const CountCard = memo(function CountCard({ count, ofLine }: { count: number; ofLine: string }) {
  const { t } = useI18n();
  const shown = useAnimatedNumber(count);
  return (
    <div className={`hidden w-[248px] flex-none flex-col justify-center rounded-xl px-6 py-4 lg:flex ${COUNT_CARD}`}>
      <div aria-hidden className="tabular text-[56px] leading-none font-bold tracking-[-0.03em] text-white">
        {fmtNum(shown)}
      </div>
      <p className="mt-3 text-[13px] font-bold text-on-accent" aria-live="polite" aria-atomic="true">
        <span className="sr-only">{fmtNum(count)} </span>
        {t.countMatch}
      </p>
      <p className="text-[12px] text-on-accent">{ofLine}</p>
    </div>
  );
});

const Chip = memo(function Chip({ id, label, onRemove }: { id: string; label: string; onRemove: (id: string) => void }) {
  const { t } = useI18n();
  return (
    <span className="anim-fade-in inline-flex h-7 items-center gap-1 rounded-full border border-accent/30 bg-[color-mix(in_srgb,var(--accent)_8%,var(--card))] pr-1 pl-2.5 text-[12px] font-medium">
      {label}
      <button
        type="button"
        onClick={() => onRemove(id)}
        aria-label={t.removeChip(label)}
        className="flex h-5 w-5 items-center justify-center rounded-full text-[14px] leading-none text-muted hover:bg-accent hover:text-white"
      >
        ×
      </button>
    </span>
  );
});

/** Removable chips for everything ticked in the current step. */
const ActiveChips = memo(function ActiveChips({ filters, onRemove }: { filters: Filters; onRemove: (id: string) => void }) {
  const { t } = useI18n();
  const chips = useMemo(() => activeChips(filters, t), [filters, t]);
  return (
    <div role="group" aria-label={t.activeFilters} className="flex min-h-7 flex-wrap items-center gap-1.5">
      {chips.length === 0 ? (
        <p className="text-[12.5px] text-muted">{t.noActive}</p>
      ) : (
        chips.map((c) => <Chip key={c.id} id={c.id} label={c.label} onRemove={onRemove} />)
      )}
    </div>
  );
});

interface Props {
  /** Sorted candidate indexes into CANDIDATES. */
  results: Uint32Array;
  /** Changes whenever the result set changes: scrolls back to the top and fades the first rows in. */
  resultKey: string;
  ofLine: string;
  trail: ReactNode;
  /** The current step's filters (shown as chips). */
  filters: Filters;
  sort: SortKey;
  canSearchWithin: boolean;
  onRemoveChip: (id: string) => void;
  onSort: (s: SortKey) => void;
  onSearchWithin: () => void;
  onSave: () => void;
  onClear: () => void;
  onOpenCv: (c: Candidate) => void;
}

/**
 * The results side of the one-page layout. Scrolls independently; the list is virtualised
 * (only the rows on screen, plus a few either side, are rendered).
 */
export const ResultsPane = memo(function ResultsPane({
  results,
  resultKey,
  ofLine,
  trail,
  filters,
  sort,
  canSearchWithin,
  onRemoveChip,
  onSort,
  onSearchWithin,
  onSave,
  onClear,
  onOpenCv,
}: Props) {
  const { t } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  // The list starts below the header, whose height changes with the trail and chips. Measured from a
  // ResizeObserver, whose callbacks run after layout, so mounting never forces an extra synchronous layout.
  useEffect(() => {
    const list = listRef.current;
    if (!list?.previousElementSibling) return;
    const ro = new ResizeObserver(() => setScrollMargin(list.offsetTop));
    ro.observe(list.previousElementSibling);
    return () => ro.disconnect();
  }, []);

  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => scrollRef.current,
    // Rows stack their facts under the summary on narrow screens, so they are taller there.
    estimateSize: () => (window.innerWidth >= 700 ? 230 : 400),
    overscan: 2,
    scrollMargin,
  });

  // New result set: back to the top, and let the first rows fade in (not rows re-mounted later by scrolling).
  const changedAt = useMemo(() => performance.now(), [resultKey]);
  useEffect(() => {
    if (scrollRef.current && scrollRef.current.scrollTop > 0) scrollRef.current.scrollTop = 0;
  }, [resultKey]);
  const fresh = performance.now() - changedAt < 600;

  return (
    <div ref={scrollRef} className="@container relative h-full overflow-y-auto overscroll-contain" aria-label={t.resultsLabel} role="region">
      <div className="px-4 pt-5 pb-4 sm:px-6 lg:px-8 lg:pt-6">
        <div className="flex gap-5">
          <CountCard count={results.length} ofLine={ofLine} />
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-3">
            <h1 className="tabular text-[22px] leading-tight font-bold tracking-[-0.02em] lg:hidden">{t.resultsTitle(results.length)}</h1>
            {trail}
            <ActiveChips filters={filters} onRemove={onRemoveChip} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label={t.sortBy} className="flex items-center gap-2">
            <span className="mr-1 text-[12px] text-muted">{t.sortBy}</span>
            <Toggle on={sort === 'best'} onClick={() => onSort('best')} className="h-8 text-[12px]">
              {t.sortBest}
            </Toggle>
            <Toggle on={sort === 'new'} onClick={() => onSort('new')} className="h-8 text-[12px]">
              {t.sortNew}
            </Toggle>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onSearchWithin}
              disabled={!canSearchWithin}
              className={`h-10 rounded-lg bg-[linear-gradient(135deg,var(--accent),var(--accent-deep))] px-4 text-[13px] font-bold text-on-accent shadow-accent disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none ${LIFT}`}
            >
              {t.searchWithin}
            </button>
            <button type="button" onClick={onSave} className={SECONDARY}>
              {t.saveSearch}
            </button>
            <button type="button" onClick={onClear} className="h-10 px-2 text-[13px] text-muted underline underline-offset-2 hover:text-ink">
              {t.clearAll}
            </button>
          </div>
        </div>
      </div>

      <div ref={listRef} className="px-4 pb-6 sm:px-6 lg:px-8">
        {results.length === 0 ? (
          <p role="status" className="anim-fade-up rounded-xl border border-line bg-card px-6 py-10 text-[14px] shadow-card">
            {t.zero}
          </p>
        ) : (
          <div role="list" aria-label={t.resultsTitle(results.length)} className="relative" style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((item) => (
              <div
                key={item.key}
                role="listitem"
                data-index={item.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full pb-3"
                style={{ transform: `translateY(${item.start - scrollMargin}px)` }}
              >
                <CandidateRow c={CANDIDATES[results[item.index]]} animate={fresh && item.index < 8} onOpenCv={onOpenCv} />
              </div>
            ))}
          </div>
        )}
        <p className="mt-4 text-[12px] text-muted">{t.footer}</p>
      </div>
    </div>
  );
});

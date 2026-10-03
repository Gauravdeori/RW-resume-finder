import { memo, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CANDIDATES } from '../lib/data';
import { activeChips, type ActiveChip } from '../lib/describe';
import type { SortKey } from '../lib/filter';
import { fmtNum, useI18n } from '../lib/i18n';
import type { Candidate, Filters } from '../lib/types';
import { useAnimatedNumber } from '../lib/useAnimatedNumber';
import { CARD_H, CandidateRow, type Density } from './CandidateRow';
import { Toggle, cx } from './controls';

/** Red count card: coral to a slightly deeper red, soft red shadow. */
export const COUNT_CARD = 'bg-[linear-gradient(135deg,var(--accent)_0%,var(--accent-deep)_100%)] shadow-accent';
const LIFT = 'transition-transform duration-150 hover:-translate-y-px active:translate-y-0';
const SECONDARY = `h-9 rounded-lg border border-line bg-card px-3 text-[12.5px] font-medium whitespace-nowrap hover:border-ink/45 hover:shadow-control disabled:cursor-not-allowed disabled:opacity-45 ${LIFT}`;
const GAP = 10;
/** The 3-column view drops to 2 columns, then 1, when the results area is narrower than this per column. */
const MIN_TILE_W = 280;

/** Live count: a big rolling number with tabular figures and a fixed width, so nothing shifts as it changes. */
const CountCard = memo(function CountCard({ count, ofLine }: { count: number; ofLine: string }) {
  const { t } = useI18n();
  const shown = useAnimatedNumber(count);
  return (
    <div className={`hidden w-[196px] flex-none flex-col justify-center rounded-xl px-4 py-2.5 lg:flex ${COUNT_CARD}`}>
      <div aria-hidden className="tabular text-[34px] leading-none font-bold tracking-[-0.03em] text-white">
        {fmtNum(shown)}
      </div>
      <p className="mt-1.5 text-[12.5px] leading-tight font-bold text-on-accent" aria-live="polite" aria-atomic="true">
        <span className="sr-only">{fmtNum(count)} </span>
        {t.countMatch}
      </p>
      <p className="truncate text-[11.5px] leading-tight text-on-accent">{ofLine}</p>
    </div>
  );
});

const Chip = memo(function Chip({ id, label, hidden, onRemove }: { id: string; label: string; hidden?: boolean; onRemove: (id: string) => void }) {
  const { t } = useI18n();
  return (
    <span
      data-chip
      className={cx(
        'inline-flex h-7 flex-none items-center gap-1 rounded-full border border-accent/30 bg-[color-mix(in_srgb,var(--accent)_8%,var(--card))] pr-1 pl-2.5 text-[12px] font-medium whitespace-nowrap',
        hidden && 'invisible',
      )}
    >
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

/** Room kept for the "+N more" button when not every chip fits. */
const MORE_W = 84;

/**
 * Removable chips for everything ticked in the current step, on one line. Chips that do not fit are listed
 * under a "+N more" button instead of wrapping onto more lines.
 */
const ActiveChips = memo(function ActiveChips({ filters, onRemove }: { filters: Filters; onRemove: (id: string) => void }) {
  const { t } = useI18n();
  const chips = useMemo(() => activeChips(filters, t), [filters, t]);
  const rowRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ n: chips.length, left: 0 });
  const [width, setWidth] = useState(0);
  const [open, setOpen] = useState(false);
  const menuId = useId();

  // Every chip stays rendered (the ones that do not fit are invisible), so they can always be measured.
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const items = [...row.querySelectorAll<HTMLElement>('[data-chip]')];
    const right = (i: number) => items[i].offsetLeft + items[i].offsetWidth;
    let n = items.length;
    if (n && right(n - 1) > row.clientWidth) {
      n = 0;
      while (n < items.length && right(n) <= row.clientWidth - MORE_W) n++;
    }
    setFit({ n, left: n ? right(n - 1) + 6 : 0 });
  }, [chips, width]);
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(row);
    return () => ro.disconnect();
  }, []);
  const hidden: ActiveChip[] = chips.slice(fit.n);
  useEffect(() => {
    if (!hidden.length) setOpen(false);
  }, [hidden.length]);

  return (
    <div className="relative">
      <div ref={rowRef} role="group" aria-label={t.activeFilters} className="relative flex h-7 items-center gap-1.5 overflow-hidden">
        {chips.length === 0 ? (
          <p className="truncate text-[12.5px] text-muted">{t.noActive}</p>
        ) : (
          chips.map((c, i) => <Chip key={c.id} id={c.id} label={c.label} hidden={i >= fit.n} onRemove={onRemove} />)
        )}
      </div>
      {hidden.length > 0 && (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((o) => !o)}
          className="absolute top-0 h-7 rounded-full border border-line bg-card px-2.5 text-[12px] font-semibold whitespace-nowrap hover:border-ink/45"
          style={{ left: fit.left }}
        >
          {t.moreChips(hidden.length)}
        </button>
      )}
      {open && hidden.length > 0 && (
        <div
          id={menuId}
          className="anim-fade-in absolute top-9 z-20 flex max-w-[min(420px,calc(100vw-32px))] flex-wrap gap-1.5 rounded-xl border border-line bg-card p-2.5 shadow-hover"
          style={{ left: Math.max(0, fit.left - 200) }}
        >
          {hidden.map((c) => (
            <Chip key={c.id} id={c.id} label={c.label} onRemove={onRemove} />
          ))}
        </div>
      )}
    </div>
  );
});

interface Props {
  /** Sorted candidate indexes into CANDIDATES. */
  results: Uint32Array;
  /** Changes whenever the result set changes: goes back to page 1. */
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
  /** View menu: 1-column list (default) or a 3-column grid of compact cards. */
  view: 'list' | 'grid';
  density: Density;
}

/**
 * The results side of the one-page layout. Nothing scrolls: as many cards as fit the space are shown,
 * and Previous / Next move through the rest a page at a time. Only that page is rendered.
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
  view,
  density,
}: Props) {
  const { t } = useI18n();
  const listRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  // How much room the cards have: measured once before the first paint, then whenever the window resizes.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    setBox({ w: el.clientWidth, h: el.clientHeight });
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const variant = view === 'grid' ? 'tile' : 'row';
  const cols = view === 'grid' ? Math.max(1, Math.min(3, Math.floor((box.w + GAP) / (MIN_TILE_W + GAP)))) : 1;
  const cardH = CARD_H[variant][density];
  const rows = Math.max(1, Math.floor((box.h + GAP) / (cardH + GAP)));
  const pageSize = rows * cols;

  // A new result set starts at page 1. Resizing keeps the first card on screen in view.
  const [pos, setPos] = useState({ key: resultKey, first: 0 });
  const first = pos.key === resultKey ? Math.min(pos.first, Math.max(0, results.length - 1)) : 0;
  const start = Math.floor(first / pageSize) * pageSize;
  const end = Math.min(results.length, start + pageSize);
  const pages = Math.max(1, Math.ceil(results.length / pageSize));
  const page = Math.floor(start / pageSize) + 1;
  const go = (to: number) => setPos({ key: resultKey, first: to });
  const pageItems = results.subarray(start, end);

  const sortGroup = (
    <div role="group" aria-label={t.sortBy} className="flex items-center gap-1.5">
      <span className="mr-1 hidden text-[12px] text-muted lg:inline">{t.sortBy}</span>
      <Toggle on={sort === 'best'} onClick={() => onSort('best')} className="h-8 px-2.5 text-[12px]">
        {t.sortBest}
      </Toggle>
      <Toggle on={sort === 'new'} onClick={() => onSort('new')} className="h-8 px-2.5 text-[12px]">
        {t.sortNew}
      </Toggle>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-3" aria-label={t.resultsLabel} role="region">
      <div className="flex flex-none gap-4">
        <CountCard count={results.length} ofLine={ofLine} />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="min-w-0 flex-1 basis-[260px] overflow-hidden">{trail}</div>
            {/* Phones: sort and the actions share one line, with shorter labels. */}
            <div className="flex w-full items-center justify-between gap-2 lg:ml-auto lg:w-auto">
            <div className="lg:hidden">{sortGroup}</div>
            <div className="flex flex-none items-center gap-2">
              <button
                type="button"
                onClick={onSearchWithin}
                disabled={!canSearchWithin}
                className={`h-9 rounded-lg bg-[linear-gradient(135deg,var(--accent),var(--accent-deep))] px-3.5 text-[12.5px] font-bold whitespace-nowrap text-on-accent shadow-accent disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none ${LIFT}`}
              >
                <span className="sm:hidden">{t.searchWithinShort}</span>
                <span className="hidden sm:inline">{t.searchWithin}</span>
              </button>
              <button type="button" onClick={onSave} className={SECONDARY}>
                <span className="sm:hidden">{t.save}</span>
                <span className="hidden sm:inline">{t.saveSearch}</span>
              </button>
              <button
                type="button"
                onClick={onClear}
                className="hidden h-9 px-1 text-[12.5px] whitespace-nowrap text-muted underline underline-offset-2 hover:text-ink lg:block"
              >
                {t.clearAll}
              </button>
            </div>
            </div>
          </div>
          <ActiveChips filters={filters} onRemove={onRemoveChip} />
        </div>
      </div>

      <div
        ref={listRef}
        role="list"
        aria-label={t.resultsTitle(results.length)}
        className="grid min-h-0 flex-1 content-start overflow-hidden"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: GAP }}
      >
        {results.length === 0 ? (
          <p role="status" className="col-span-full rounded-xl border border-line bg-card px-6 py-10 text-[14px] shadow-card">
            {t.zero}
          </p>
        ) : (
          Array.from(pageItems, (i) => (
            <div key={CANDIDATES[i].id} role="listitem">
              <CandidateRow c={CANDIDATES[i]} variant={variant} density={density} onOpenCv={onOpenCv} />
            </div>
          ))
        )}
      </div>

      <nav aria-label={t.pagesLabel} className="flex h-9 flex-none items-center justify-between gap-3">
        <div className="hidden lg:block">{sortGroup}</div>
        <p className="hidden min-w-0 flex-1 truncate text-center text-[11px] text-muted xl:block">{t.footer}</p>
        <div className="flex flex-1 items-center justify-end gap-2 lg:flex-none">
          <button type="button" onClick={() => go(start - pageSize)} disabled={start === 0} className={SECONDARY}>
            ‹ {t.prevPage}
          </button>
          <p className="tabular min-w-[112px] text-center text-[12.5px]" title={t.pageN(page, pages)}>
            {results.length ? t.pageRange(start + 1, end, results.length) : '0'}
          </p>
          <button type="button" onClick={() => go(start + pageSize)} disabled={end >= results.length} className={SECONDARY}>
            {t.nextPage} ›
          </button>
        </div>
      </nav>
    </div>
  );
});

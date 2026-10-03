import { memo, useId } from 'react';
import { savedSummary, suggestName } from '../lib/describe';
import { fmtNum, useI18n } from '../lib/i18n';
import type { RecentSearch } from '../lib/recentSearches';
import type { SavedSearch } from '../lib/savedSearches';
import type { Filters } from '../lib/types';
import { useAnimatedNumber } from '../lib/useAnimatedNumber';
import { PRESS } from './controls';
import { JdButton } from './JdButton';

/** How many saved and recent searches the panel lists; the rest are under "Show all" (File > Open saved search). */
const LIST_MAX = 4;

function SearchList({
  title,
  items,
  empty,
  more,
}: {
  title: string;
  items: { id: string; name: string; summary: string; onPick: () => void }[];
  empty: string;
  more?: { label: string; onClick: () => void };
}) {
  const id = useId();
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="px-1 text-[11.5px] font-semibold tracking-[0.08em] text-muted uppercase">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="mt-1.5 px-1 text-[12px] text-muted">{empty}</p>
      ) : (
        <ul className="mt-1 flex flex-col">
          {items.map((it) => (
            <li key={it.id}>
              <button
                type="button"
                onClick={it.onPick}
                className="block w-full rounded-lg border border-transparent px-2 py-1.5 text-left hover:border-accent/50 hover:bg-pick/50"
              >
                <span className="block truncate text-[13px] leading-[17px] font-semibold">{it.name}</span>
                <span className="block truncate text-[11.5px] leading-[15px] text-muted">{it.summary}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {more && (
        <button type="button" onClick={more.onClick} className="mt-0.5 px-1 text-[12px] text-muted underline underline-offset-2 hover:text-accent">
          {more.label}
        </button>
      )}
    </section>
  );
}

/**
 * Left panel of the full-screen search (~260px, full height): the big live count, "Show candidates",
 * "Save search", "Clear all", "Start from a job description", then saved and recent searches.
 * Picking a saved or recent search loads it into the filters at once.
 */
export const SearchSide = memo(function SearchSide({
  count,
  ofLine,
  note,
  saved,
  recent,
  showJdFill,
  onShow,
  onSave,
  onClear,
  onJdFill,
  onLoad,
  onShowAllSaved,
}: {
  count: number;
  ofLine: string;
  /** "2 nice-to-haves rank matches first", when any filter is nice to have. */
  note?: string;
  saved: SavedSearch[];
  recent: RecentSearch[];
  showJdFill: boolean;
  onShow: () => void;
  onSave: () => void;
  onClear: () => void;
  onJdFill: (p: Partial<Filters>) => void;
  onLoad: (steps: Filters[], savedId?: string) => void;
  onShowAllSaved: () => void;
}) {
  const { t } = useI18n();
  const shown = useAnimatedNumber(count);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <h1 className="sr-only">{t.pageTitle}</h1>
      <div className="flex flex-col rounded-xl bg-[linear-gradient(135deg,var(--accent)_0%,var(--accent-deep)_100%)] px-5 py-4 shadow-accent">
        <div aria-hidden className="tabular text-[48px] leading-none font-bold tracking-[-0.03em] text-white">
          {fmtNum(shown)}
        </div>
        <p className="mt-2 text-[14px] leading-tight font-bold text-on-accent" aria-live="polite" aria-atomic="true">
          <span className="sr-only">{fmtNum(count)} </span>
          {t.countMatch}
        </p>
        <p className="mt-0.5 text-[12px] leading-tight text-on-accent">{ofLine}</p>
        {note && <p className="mt-1 text-[11.5px] leading-tight font-semibold text-white">★ {note}</p>}
      </div>

      <button
        type="button"
        onClick={onShow}
        className={`h-11 rounded-lg bg-ink text-[14px] font-bold text-page shadow-control hover:bg-ink/90 ${PRESS}`}
      >
        {t.showCandidates}
      </button>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onSave} className={`h-9 flex-1 rounded-lg border border-line bg-card text-[12.5px] font-medium hover:border-accent/50 ${PRESS}`}>
          {t.saveSearch}
        </button>
        <button type="button" onClick={onClear} className="h-9 px-1.5 text-[12.5px] whitespace-nowrap text-muted underline underline-offset-2 hover:text-accent">
          {t.clearAll}
        </button>
      </div>
      {showJdFill && <JdButton onFill={onJdFill} />}

      <div className="mt-1 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden rounded-xl border border-line bg-card px-2 py-2.5 shadow-card">
        <SearchList
          title={t.savedSearches}
          empty={t.noSavedSearches}
          items={saved.slice(0, LIST_MAX).map((s) => ({ id: s.id, name: s.name, summary: savedSummary(s, t), onPick: () => onLoad(s.steps, s.id) }))}
          more={saved.length > LIST_MAX ? { label: t.showAllSaved(saved.length), onClick: onShowAllSaved } : undefined}
        />
        <SearchList
          title={t.recentSearches}
          empty={t.noRecent}
          items={recent.slice(0, LIST_MAX).map((r) => ({
            id: r.key,
            name: suggestName(r.steps, t),
            summary: savedSummary({ id: r.key, name: '', steps: r.steps, createdAt: r.at }, t),
            onPick: () => onLoad(r.steps),
          }))}
        />
      </div>
    </div>
  );
});

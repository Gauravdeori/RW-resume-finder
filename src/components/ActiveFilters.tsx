import { activeChips } from '../lib/describe';
import { useI18n } from '../lib/i18n';
import type { Filters } from '../lib/types';

/** Compact row of removable chips showing everything that is ticked, at the top of the filter panel. */
export function ActiveFilters({
  filters,
  onReplace,
  onClear,
}: {
  filters: Filters;
  onReplace: (f: Filters) => void;
  onClear: () => void;
}) {
  const { t } = useI18n();
  const chips = activeChips(filters, t);

  return (
    <section
      aria-label={t.activeFilters}
      className="grid gap-2 py-3 md:grid-cols-[160px_minmax(0,1fr)] md:gap-x-10"
    >
      <h2 className="text-[13px] leading-tight font-semibold md:pt-[7px]">{t.activeFilters}</h2>
      <div className="flex min-h-7 flex-wrap items-center gap-1.5">
        {chips.length === 0 ? (
          <p className="text-[12.5px] text-muted">{t.noActive}</p>
        ) : (
          <>
            {chips.map((c) => (
              <span
                key={c.id}
                className="anim-fade-in inline-flex h-7 items-center gap-1 rounded-full border border-accent/30 bg-[color-mix(in_srgb,var(--accent)_8%,var(--card))] pr-1 pl-2.5 text-[12px] font-medium text-ink"
              >
                {c.label}
                <button
                  type="button"
                  onClick={() => onReplace(c.remove(filters))}
                  aria-label={t.removeChip(c.label)}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[14px] leading-none text-muted transition-colors duration-150 hover:bg-accent hover:text-white"
                >
                  ×
                </button>
              </span>
            ))}
            <button type="button" onClick={onClear} className="ml-1 text-[12px] text-muted underline underline-offset-2 hover:text-ink">
              {t.clearAll}
            </button>
          </>
        )}
      </div>
    </section>
  );
}

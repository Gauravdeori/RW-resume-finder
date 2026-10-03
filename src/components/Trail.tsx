import { Fragment } from 'react';
import { fmtNum, useI18n } from '../lib/i18n';
import { cx } from './controls';

export interface TrailItem {
  label: string;
  count?: number;
  current: boolean;
  onClick?: () => void;
}

const Chevron = () => (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-muted" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 3.5 4.5 4.5L6 12.5" />
  </svg>
);

/** Pill breadcrumb of search steps with counts: All candidates › Search 1 › Search 2. Earlier steps are clickable. */
export function Trail({ items }: { items: TrailItem[] }) {
  const { t } = useI18n();
  return (
    <nav aria-label={t.trailLabel}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
        {items.map((it, i) => {
          const body = (
            <>
              <span>{it.label}</span>
              {it.count !== undefined && (
                <span
                  className={cx(
                    'tabular ml-2 rounded-full px-1.5 py-px text-[11px] font-semibold',
                    it.current ? 'bg-accent/15 text-pick-ink' : 'bg-tile text-muted',
                  )}
                >
                  {fmtNum(it.count)}
                </span>
              )}
            </>
          );
          const cls = cx(
            'inline-flex h-8 items-center rounded-full border px-3 text-[12.5px] font-medium whitespace-nowrap',
            it.current ? 'border-pick-line bg-pick font-semibold text-pick-ink' : 'border-line bg-card text-ink',
          );
          return (
            <Fragment key={i}>
              {i > 0 && (
                <li aria-hidden className="flex items-center">
                  <Chevron />
                </li>
              )}
              <li>
                {it.current || !it.onClick ? (
                  <span className={cls} aria-current={it.current ? 'step' : undefined}>
                    {body}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={it.onClick}
                    className={cx(cls, 'transition-transform duration-[120ms] hover:border-accent/50 active:scale-[0.96]')}
                  >
                    {body}
                  </button>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

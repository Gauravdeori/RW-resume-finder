import { Fragment } from 'react';
import { fmtNum, useI18n } from '../lib/i18n';
import { cx } from './controls';

export interface TrailItem {
  label: string;
  count?: number;
  current: boolean;
  onClick?: () => void;
}

/** Breadcrumb of search steps: All candidates — Search 1 — Search 2. Earlier steps are clickable. */
export function Trail({ items }: { items: TrailItem[] }) {
  const { t } = useI18n();
  return (
    <nav aria-label={t.trailLabel}>
      <ol className="flex flex-wrap items-center gap-y-2">
        {items.map((it, i) => {
          const body = (
            <>
              <span>{it.label}</span>
              {it.count !== undefined && <span className={cx('ml-1.5', !it.current && 'text-muted')}>{fmtNum(it.count)}</span>}
            </>
          );
          const cls = cx(
            'inline-flex h-8 items-center border px-2.5 text-[12px] whitespace-nowrap',
            it.current ? 'border-sel bg-sel text-on-sel' : 'border-line bg-card text-ink',
          );
          return (
            <Fragment key={i}>
              {i > 0 && <li aria-hidden className="mx-2.5 h-[2px] w-4 bg-ink" />}
              <li>
                {it.current || !it.onClick ? (
                  <span className={cls} aria-current={it.current ? 'step' : undefined}>
                    {body}
                  </span>
                ) : (
                  <button type="button" onClick={it.onClick} className={cx(cls, 'hover:border-ink')}>
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

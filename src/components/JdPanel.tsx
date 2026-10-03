import { lazy, memo, Suspense, useState } from 'react';
import { useI18n } from '../lib/i18n';
import type { Filters } from '../lib/types';
import { cx } from './controls';

const JdBody = lazy(() => import('./JdBody'));
const BODY_ID = 'jd-panel-body';

/**
 * Collapsible "Start from a job description" box at the top of the filter sidebar.
 * The body (text box and keyword parser) is a separate chunk, loaded the first time the box is opened.
 */
export const JdPanel = memo(function JdPanel({ onFill }: { onFill: (patch: Partial<Filters>) => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-line bg-page/60 px-4 py-3">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={BODY_ID}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 text-left text-[13px] font-semibold hover:text-accent"
      >
        <span aria-hidden className={cx('inline-block w-3 text-[10px] transition-transform duration-150', open && 'rotate-90')}>
          ▶
        </span>
        {t.jdTitle}
      </button>
      {open && (
        <Suspense fallback={<div id={BODY_ID} className="skeleton mt-3 h-32" />}>
          <JdBody id={BODY_ID} onFill={onFill} />
        </Suspense>
      )}
    </div>
  );
});

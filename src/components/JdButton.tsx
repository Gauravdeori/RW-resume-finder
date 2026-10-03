import { lazy, memo, Suspense, useId, useState } from 'react';
import { useI18n } from '../lib/i18n';
import type { Filters } from '../lib/types';
import { Modal } from './Modal';

const JdBody = lazy(() => import('./JdBody'));

/**
 * "Start from a job description": a small button in the filter panel header that opens the text box in a dialog,
 * so it takes no room on the page. The body (text box and keyword parser) loads the first time it is opened.
 * A successful fill closes the dialog; the filled filters show as chips and tab badges.
 */
export const JdButton = memo(function JdButton({ onFill }: { onFill: (patch: Partial<Filters>) => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const bodyId = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-8 flex-none items-center gap-1.5 rounded-lg border border-line bg-field px-2.5 text-[12px] font-medium transition-transform duration-150 hover:-translate-y-px hover:border-ink/45 hover:shadow-control"
      >
        <svg viewBox="0 0 16 16" aria-hidden className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 1.75h5.5L12.5 4.75v9.5h-8.5z" />
          <path d="M6.5 7.5h4M6.5 10h4" />
        </svg>
        {t.jdTitle}
      </button>
      {open && (
        <Modal labelledBy={titleId} onClose={() => setOpen(false)} className="max-w-[560px] rounded-xl p-5">
          <h2 id={titleId} className="pr-12 text-[16px] font-bold">
            {t.jdTitle}
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t.close}
            className="absolute top-3.5 right-3.5 flex h-9 w-9 items-center justify-center rounded-lg border border-line text-[20px] leading-none hover:border-ink/45"
          >
            ×
          </button>
          <Suspense fallback={<div className="skeleton mt-3 h-40" />}>
            <JdBody
              id={bodyId}
              onFill={(patch) => {
                onFill(patch);
                setOpen(false);
              }}
            />
          </Suspense>
        </Modal>
      )}
    </>
  );
});

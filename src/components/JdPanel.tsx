import { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { EXAMPLE_JD, parseJobDescription } from '../lib/jdParser';
import type { Filters } from '../lib/types';
import { cx } from './controls';

const BODY_ID = 'jd-panel-body';

/**
 * The "Start from a job description" toggle. Phones show it inside the filter card;
 * laptops show it in the page title line to keep the whole panel on one screen.
 */
export function JdToggle({ open, onToggle, className }: { open: boolean; onToggle: () => void; className?: string }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={BODY_ID}
      onClick={onToggle}
      className={cx(
        'items-center gap-2 text-[14px] font-semibold lg:h-7 lg:border lg:border-control lg:bg-card lg:px-2.5 lg:text-[12px] lg:hover:border-ink',
        className,
      )}
    >
      <span aria-hidden className="inline-block w-3 text-[10px]">
        {open ? '▼' : '▶'}
      </span>
      {t.jdTitle}
    </button>
  );
}

/** Collapsible "Start from a job description": paste a JD and matching filters are ticked. */
export function JdPanel({
  open,
  onToggle,
  onFill,
}: {
  open: boolean;
  onToggle: () => void;
  onFill: (patch: Partial<Filters>) => void;
}) {
  const { t } = useI18n();
  const [text, setText] = useState('');
  const [status, setStatus] = useState<null | { kind: 'filled'; n: number } | { kind: 'none' } | { kind: 'empty' }>(null);

  const fill = () => {
    if (!text.trim()) {
      setStatus({ kind: 'empty' });
      return;
    }
    const { patch, filled } = parseJobDescription(text);
    if (filled > 0) onFill(patch);
    setStatus(filled > 0 ? { kind: 'filled', n: filled } : { kind: 'none' });
  };

  const message =
    status?.kind === 'filled' ? t.jdFilled(status.n) : status?.kind === 'none' ? t.jdNone : status?.kind === 'empty' ? t.jdEmpty : '';

  return (
    <div className={cx('py-4 lg:py-0', open && 'lg:pt-3 lg:pb-3')}>
      <JdToggle open={open} onToggle={onToggle} className="flex lg:hidden" />
      <div id={BODY_ID} hidden={!open} className="mt-3 lg:mt-0">
        <textarea
          aria-label={t.jdLabel}
          placeholder={t.jdPlaceholder}
          rows={5}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setStatus(null);
          }}
          className="block w-full resize-y border border-control bg-field p-3 text-[16px] leading-relaxed text-ink sm:text-[13px] outline-none placeholder:text-muted focus:border-ink"
        />
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          <button type="button" onClick={fill} className="h-10 border border-ink px-4 text-[13px] font-medium hover:bg-sel hover:text-on-sel lg:h-8 lg:px-3 lg:text-[12px]">
            {t.jdFill}
          </button>
          <button
            type="button"
            onClick={() => {
              setText(EXAMPLE_JD);
              setStatus(null);
            }}
            className="text-[13px] underline underline-offset-2"
          >
            {t.jdExample}
          </button>
          <p role="status" className="text-[13px] font-medium">
            {status?.kind === 'filled' && <span aria-hidden className="mr-2 inline-block h-2 w-2 bg-accent align-middle" />}
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

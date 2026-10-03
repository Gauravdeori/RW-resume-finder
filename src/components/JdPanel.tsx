import { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { EXAMPLE_JD, parseJobDescription } from '../lib/jdParser';
import type { Filters } from '../lib/types';
import { cx } from './controls';

const BODY_ID = 'jd-panel-body';

/**
 * The "Start from a job description" toggle, at the top of the filter card.
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
        'group items-center gap-2 text-[13px] font-semibold transition-colors duration-150 hover:text-accent',
        className,
      )}
    >
      <span aria-hidden className={cx('inline-block w-3 text-[10px] transition-transform duration-150', open && 'rotate-90')}>
        ▶
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
    <div className="border-b border-line py-3.5">
      <JdToggle open={open} onToggle={onToggle} className="flex" />
      <div id={BODY_ID} hidden={!open} className="anim-fade-up mt-3">
        <textarea
          aria-label={t.jdLabel}
          placeholder={t.jdPlaceholder}
          rows={5}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setStatus(null);
          }}
          className="block w-full resize-y rounded border border-line bg-field p-3 text-[16px] leading-relaxed text-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted hover:border-ink/45 focus:border-ink/60 focus:shadow-control sm:text-[13px]"
        />
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          <button
            type="button"
            onClick={fill}
            className="h-9 rounded-lg bg-sel px-4 text-[13px] font-semibold text-on-sel transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-control"
          >
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
            {status?.kind === 'filled' && <span aria-hidden className="mr-2 inline-block h-2 w-2 rounded-full bg-accent align-middle" />}
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

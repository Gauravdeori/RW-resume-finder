import { useId, useState } from 'react';
import { useI18n } from '../lib/i18n';
import { EXAMPLE_JD, parseJobDescription } from '../lib/jdParser';
import type { Filters } from '../lib/types';

/** Collapsible "Start from a job description": paste a JD and matching filters are ticked. */
export function JdPanel({ onFill }: { onFill: (patch: Partial<Filters>) => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [status, setStatus] = useState<null | { kind: 'filled'; n: number } | { kind: 'none' } | { kind: 'empty' }>(null);
  const bodyId = useId();

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
    <div className="border-b border-line py-4">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-[14px] font-semibold"
      >
        <span aria-hidden className="inline-block w-3 text-[10px]">
          {open ? '▼' : '▶'}
        </span>
        {t.jdTitle}
      </button>
      <div id={bodyId} hidden={!open} className="mt-3">
        <textarea
          aria-label={t.jdLabel}
          placeholder={t.jdPlaceholder}
          rows={7}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setStatus(null);
          }}
          className="block w-full resize-y border border-control bg-field p-3 text-[13px] leading-relaxed text-ink outline-none placeholder:text-muted focus:border-ink"
        />
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          <button type="button" onClick={fill} className="h-10 border border-ink px-4 text-[13px] font-medium hover:bg-sel hover:text-on-sel">
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

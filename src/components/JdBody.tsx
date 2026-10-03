import { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { EXAMPLE_JD, parseJobDescription } from '../lib/jdParser';
import type { Filters } from '../lib/types';

/** Body of "Start from a job description" (with the parser). Loaded on demand the first time the box is opened. */
export default function JdBody({ id, onFill }: { id: string; onFill: (patch: Partial<Filters>) => void }) {
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
    <div id={id} className="anim-fade-up mt-3">
      <textarea
        aria-label={t.jdLabel}
        placeholder={t.jdPlaceholder}
        rows={5}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setStatus(null);
        }}
        className="block w-full resize-y rounded border border-line bg-field p-3 text-[16px] leading-relaxed text-ink outline-none placeholder:text-muted hover:border-ink/45 focus:border-ink/60 focus:shadow-control sm:text-[13px]"
      />
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={fill}
          className="h-9 rounded-lg bg-sel px-4 text-[13px] font-semibold text-on-sel transition-transform duration-150 hover:-translate-y-px hover:shadow-control"
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
      </div>
      <p role="status" className="mt-2 text-[12.5px] font-medium">
        {status?.kind === 'filled' && <span aria-hidden className="mr-2 inline-block h-2 w-2 rounded-full bg-accent align-middle" />}
        {message}
      </p>
    </div>
  );
}

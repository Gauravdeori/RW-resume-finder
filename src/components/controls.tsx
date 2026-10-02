import { useId, type ReactNode } from 'react';

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

/** One-click toggle button: grey border when off, charcoal fill when on. */
export function Toggle({
  on,
  onClick,
  children,
  className,
  label,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      onClick={onClick}
      className={cx(
        'inline-flex h-10 items-center justify-center gap-1.5 border px-3 text-[13px] leading-none whitespace-nowrap transition-colors sm:h-9',
        on ? 'border-sel bg-sel text-on-sel' : 'border-control bg-field text-ink hover:border-ink',
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Checkbox tile used for industry and position: shows a tick when on. */
export function CheckTile({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      onClick={onClick}
      className={cx(
        'flex min-h-[44px] items-center gap-2 border px-2.5 py-1.5 text-left text-[13px] leading-[1.15] transition-colors sm:min-h-[38px]',
        on ? 'border-sel bg-sel text-on-sel' : 'border-control bg-field text-ink hover:border-ink',
      )}
    >
      <span
        aria-hidden
        className={cx(
          'flex h-[14px] w-[14px] flex-none items-center justify-center border',
          on ? 'border-on-sel bg-on-sel text-sel' : 'border-muted',
        )}
      >
        {on && (
          <svg viewBox="0 0 12 12" className="h-[10px] w-[10px]">
            <path d="M2 6.5 4.8 9 10 3" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        )}
      </span>
      <span>{label}</span>
    </button>
  );
}

export function TextField({
  label,
  value,
  onChange,
  trailing,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  trailing?: ReactNode;
}) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-[12px] text-muted">
        {label}
      </label>
      <div className="flex">
        <input
          id={id}
          type="text"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full min-w-0 border border-control bg-field px-3 text-[16px] text-ink sm:h-10 sm:text-[14px] outline-none focus:border-ink focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent"
        />
        {trailing}
      </div>
    </div>
  );
}

/** A filter row: bold label on the left, controls on the right, thin divider between rows. */
export function FilterRow({ label, sub, children }: { label: string; sub?: string; children: ReactNode }) {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      className="grid gap-3 border-b border-line py-4 last:border-b-0 sm:py-5 md:grid-cols-[132px_minmax(0,1fr)] md:gap-4"
    >
      <div>
        <h2 id={id} className="text-[14px] font-semibold leading-tight">
          {label}
        </h2>
        {sub && <p className="mt-1 max-w-[132px] text-[12px] leading-snug text-muted">{sub}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

/** Small grey label above a group of buttons inside a row. */
export function GroupLabel({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <div id={id} className="mb-2 text-[12px] text-muted">
      {children}
    </div>
  );
}

/** A labelled group of toggles that wraps. */
export function ToggleGroup({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className={className}>
      <GroupLabel id={id}>{label}</GroupLabel>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function toggleIn<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

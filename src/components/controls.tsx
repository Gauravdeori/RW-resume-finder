import { useId, type ReactNode } from 'react';

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

/**
 * Shared look for 36px controls: 4px corners, 150ms transitions, a slight lift on hover.
 * Selected = charcoal fill + white text (white fill + charcoal text in dark mode).
 */
const CONTROL =
  'rounded border transition-[transform,box-shadow,border-color,background-color,color] duration-150 ease-out hover:-translate-y-px hover:shadow-control active:translate-y-0';
const OFF = 'border-line bg-field text-ink hover:border-ink/45';
const ON = 'border-sel bg-sel text-on-sel';

/** One-click toggle button. */
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
        'inline-flex h-9 items-center justify-center gap-1.5 px-3 text-[13px] leading-none whitespace-nowrap',
        CONTROL,
        on ? ON : OFF,
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
      className={cx('flex min-h-9 items-center gap-2 px-3 py-1.5 text-left text-[13px] leading-[1.15]', CONTROL, on ? ON : OFF)}
    >
      <span
        aria-hidden
        className={cx(
          'flex h-[14px] w-[14px] flex-none items-center justify-center rounded-[3px] border transition-colors duration-150',
          on ? 'border-on-sel bg-on-sel text-sel' : 'border-muted/70',
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

/**
 * Text input: 36px tall, 14px text, 8px x 12px padding, 1px #D9D9D9 border, 4px corners.
 * Phones use 16px text so iOS Safari does not zoom in when the field is tapped.
 */
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
      <label htmlFor={id} className="mb-1 block text-[12px] leading-tight text-muted">
        {label}
      </label>
      <div className="flex">
        <input
          id={id}
          type="text"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cx(
            'h-9 w-full min-w-0 rounded border border-line bg-field px-3 py-2 text-[16px] text-ink outline-none sm:text-[14px]',
            'transition-[border-color,box-shadow] duration-150 hover:border-ink/45 focus:border-ink/60 focus:shadow-control',
            'focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent',
            trailing ? 'rounded-r-none' : undefined,
          )}
        />
        {trailing}
      </div>
    </div>
  );
}

/**
 * A filter row. Every row uses the same grid: a fixed 160px label column, a 40px gap, then the controls,
 * so all row labels share one left edge and all controls start on one vertical line.
 * Phones: label above the controls.
 */
export function FilterRow({ label, sub, children }: { label: string; sub?: string; children: ReactNode }) {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      className="grid gap-2.5 border-t border-line py-3 first:border-t-0 md:grid-cols-[160px_minmax(0,1fr)] md:gap-x-10 md:gap-y-0"
    >
      <div className="md:pt-[9px]">
        <h2 id={id} className="text-[13px] leading-tight font-semibold">
          {label}
        </h2>
        {sub && <p className="mt-1 text-[12px] leading-snug text-muted">{sub}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

/** Small grey label above a group of buttons inside a row. */
export function GroupLabel({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <div id={id} className="mb-1 text-[12px] leading-tight text-muted">
      {children}
    </div>
  );
}

/** A labelled group of toggles that wraps, with 8px gaps. */
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

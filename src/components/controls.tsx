import { useId, type ReactNode } from 'react';

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

/**
 * Shared look for 36px controls: 4px corners, a slight lift on hover.
 * Only transform is animated (150ms); colours and shadows switch instantly.
 * Selected = charcoal fill + white text (white fill + charcoal text in dark mode).
 */
const CONTROL = 'rounded border transition-transform duration-150 ease-out hover:-translate-y-px hover:shadow-control active:translate-y-0';
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

/** Checkbox tile used for industry and position: shows a tick when on. Labels stay on one line. */
export function CheckTile({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      onClick={onClick}
      className={cx('flex h-9 items-center gap-2 px-3 text-left text-[13px] leading-none whitespace-nowrap', CONTROL, on ? ON : OFF)}
    >
      <span
        aria-hidden
        className={cx(
          'flex h-[14px] w-[14px] flex-none items-center justify-center rounded-[3px] border',
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
  hideLabel,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  trailing?: ReactNode;
  /** The row label already says what this is: keep the label for screen readers only. */
  hideLabel?: boolean;
}) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'mb-1 block text-[12px] leading-tight text-muted'}>
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
            'hover:border-ink/45 focus:border-ink/60 focus:shadow-control',
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
 * A filter row (Ted's grid, sized for the 380px sidebar): a fixed 80px label column, a 12px gap,
 * then the controls, so all row labels share one left edge and all controls start on one vertical line.
 */
export function FilterRow({ label, sub, children }: { label: string; sub?: string; children: ReactNode }) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className="grid grid-cols-[80px_minmax(0,1fr)] gap-x-3 py-2.5">
      <div className="pt-[10px]">
        <h3 id={id} className="text-[12.5px] leading-tight font-semibold">
          {label}
        </h3>
        {sub && <p className="mt-1 text-[11.5px] leading-snug text-muted">{sub}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
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

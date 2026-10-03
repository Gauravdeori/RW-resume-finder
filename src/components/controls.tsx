import { useId, type ReactNode } from 'react';

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

/**
 * Shared look for selectable controls (Resume Studio design language). Height follows the density setting
 * (36px compact, 40px comfortable). A tap gives a quick 120ms press; only transform is animated.
 * Unselected: white with a grey border, coral border at 50% on hover.
 * Selected ("picked"): light red tint, coral border, red text, semibold. Never a black fill.
 */
export const PRESS = 'transition-transform duration-[120ms] ease-out active:scale-[0.96]';
export const OFF = 'border-line bg-field text-ink hover:border-accent/50';
export const PICKED = 'border-pick-line bg-pick text-pick-ink font-semibold';
const CONTROL = `rounded border ${PRESS}`;

/** One-click toggle button. */
export function Toggle({
  on,
  onClick,
  children,
  className,
  label,
  title,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  label?: string;
  /** Tooltip with the full wording when the button shows a short one. */
  title?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      title={title}
      onClick={onClick}
      className={cx(
        'inline-flex h-[var(--ctl-h)] items-center justify-center gap-1.5 px-3 text-[13px] leading-none whitespace-nowrap',
        CONTROL,
        on ? PICKED : OFF,
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Checkbox tile used for industry and position: shows a red tick when on. Labels stay on one line. */
export function CheckTile({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      onClick={onClick}
      className={cx('flex h-[var(--ctl-h)] items-center gap-2 px-3 text-left text-[13px] leading-none whitespace-nowrap', CONTROL, on ? PICKED : OFF)}
    >
      <span
        aria-hidden
        className={cx(
          'flex h-[14px] w-[14px] flex-none items-center justify-center rounded-[3px] border',
          on ? 'border-accent bg-accent text-white' : 'border-muted/70',
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
 * Text input: control height, 14px text, 12px side padding, 1px #D9D9D9 border, 4px corners.
 * Phones use 16px text so iOS Safari does not zoom in when the field is tapped.
 */
export function TextField({
  label,
  value,
  onChange,
  trailing,
  hideLabel,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  trailing?: ReactNode;
  /** The row label already says what this is: keep the label for screen readers only. */
  hideLabel?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cx('min-w-0', className)}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'mb-0.5 block text-[11.5px] leading-tight text-muted'}>
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
            'h-[var(--ctl-h)] w-full min-w-0 rounded border border-line bg-field px-3 text-[16px] text-ink outline-none sm:text-[14px]',
            'hover:border-accent/50 focus:border-accent',
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
 * A filter row (Ted's grid): a fixed label column (--label-w: 80px, 96px in Japanese), a 12px gap,
 * then the controls, so all row labels share one left edge and all controls start on one vertical line.
 * On phones (under 640px) the label sits above its controls, so the controls get the full width.
 */
export function FilterRow({ label, sub, children }: { label: string; sub?: string; children: ReactNode }) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className="grid grid-cols-1 gap-x-3 gap-y-1.5 py-[var(--row-py)] sm:grid-cols-[var(--label-w)_minmax(0,1fr)]">
      <div className="sm:pt-[calc((var(--ctl-h)-15px)/2)]">
        <h3 id={id} className="text-[12.5px] leading-[15px] font-semibold">
          {label}
        </h3>
        {sub && <p className="mt-1 text-[11.5px] leading-snug text-muted">{sub}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function toggleIn<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

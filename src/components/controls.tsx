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
        'inline-flex h-10 items-center justify-center gap-1.5 border px-3 text-[13px] leading-none whitespace-nowrap transition-colors sm:h-9 lg:h-[2.333em] lg:gap-[0.333em] lg:px-[0.667em] lg:text-[1em]',
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
        'flex min-h-[44px] items-center gap-2 border px-2.5 py-1.5 text-left text-[13px] leading-[1.15] transition-colors sm:min-h-[38px] lg:min-h-[2.333em] lg:gap-[0.5em] lg:px-[0.667em] lg:py-[0.333em] lg:text-[1em]',
        on ? 'border-sel bg-sel text-on-sel' : 'border-control bg-field text-ink hover:border-ink',
      )}
    >
      <span
        aria-hidden
        className={cx(
          'flex h-[14px] w-[14px] flex-none items-center justify-center border lg:h-[1em] lg:w-[1em]',
          on ? 'border-on-sel bg-on-sel text-sel' : 'border-muted',
        )}
      >
        {on && (
          <svg viewBox="0 0 12 12" className="h-[10px] w-[10px] lg:h-[0.667em] lg:w-[0.667em]">
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
      <label htmlFor={id} className="mb-1.5 block text-[12px] text-muted lg:mb-[0.167em] lg:text-[0.958em]">
        {label}
      </label>
      <div className="flex">
        <input
          id={id}
          type="text"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full min-w-0 border border-control bg-field px-3 text-[16px] text-ink sm:h-10 sm:text-[14px] lg:h-[2.667em] lg:px-[0.667em] lg:text-[1.083em] outline-none focus:border-ink focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent"
        />
        {trailing}
      </div>
    </div>
  );
}

/**
 * A filter section: bold label above the controls, thin divider above each section.
 * Compact on laptops and desktops (lg) so the whole panel fits on one screen.
 */
export function FilterRow({
  label,
  sub,
  action,
  children,
}: {
  label: string;
  sub?: string;
  /** Optional link or button shown at the right of the section header. */
  action?: ReactNode;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="border-t border-line py-4 sm:py-5 lg:py-[0.667em]">
      <div className="mb-3 flex items-baseline justify-between gap-3 lg:mb-[0.333em]">
        <h2 id={id} className="text-[14px] leading-tight font-semibold lg:text-[1.042em]">
          {label}
          {sub && <span className="ml-2 text-[12px] font-normal text-muted lg:text-[0.917em]">{sub}</span>}
        </h2>
        {action}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

/** Small grey label above a group of buttons inside a section. */
export function GroupLabel({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <div id={id} className="mb-2 text-[12px] text-muted lg:mb-[0.167em] lg:text-[0.917em] lg:leading-tight">
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
      <div className="flex flex-wrap gap-2 lg:gap-[0.333em]">{children}</div>
    </div>
  );
}

export function toggleIn<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

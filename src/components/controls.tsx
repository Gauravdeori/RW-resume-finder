import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../lib/i18n';

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

const TOGGLE_SIZE = {
  md: 'h-[var(--ctl-h)] px-3 text-[13px]',
  /** Compact lists (the degree lines): 32px. */
  sm: 'h-8 px-3 text-[13px]',
  /** Single letters (S, A, B...): square. */
  square: 'h-[var(--ctl-h)] w-9 text-[13px] font-bold',
  /** The main Gaishi score letters: 40px squares. */
  big: 'h-10 w-10 text-[18px] font-bold',
};

/** One-click toggle button. */
export function Toggle({
  on,
  onClick,
  children,
  className,
  label,
  title,
  size = 'md',
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  label?: string;
  /** Tooltip with the full wording when the button shows a short one. */
  title?: string;
  size?: keyof typeof TOGGLE_SIZE;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      title={title}
      onClick={onClick}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 leading-none whitespace-nowrap',
        TOGGLE_SIZE[size],
        CONTROL,
        on ? PICKED : OFF,
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Text that keeps the width of its semibold version, so a button does not grow when it is picked. */
function SteadyText({ children }: { children: ReactNode }) {
  return (
    <span className="grid">
      <span className="col-start-1 row-start-1">{children}</span>
      <span aria-hidden className="invisible col-start-1 row-start-1 h-0 font-semibold">
        {children}
      </span>
    </span>
  );
}

/**
 * A row of joined buttons where at most one is picked (language levels, JLPT); clicking the picked one again
 * clears it. Same look as the age decades.
 */
export function Segmented<T extends string>({
  options,
  value,
  labels,
  titles,
  onPick,
  label,
  dense,
}: {
  options: readonly T[];
  value: T | null;
  labels?: Partial<Record<T, string>>;
  titles?: Partial<Record<T, string>>;
  onPick: (v: T) => void;
  /** Group name for screen readers. */
  label: string;
  /** Tighter buttons, so a level row and its JLPT buttons share one line. */
  dense?: boolean;
}) {
  return (
    // Wraps only when there is no room (the narrow side panel); the full-screen boxes keep each group on one line.
    <div role="group" aria-label={label} className="flex flex-wrap gap-y-1">
      {options.map((o, i) => {
        const on = value === o;
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            title={titles?.[o]}
            onClick={() => onPick(o)}
            className={cx(
              'relative flex h-[var(--ctl-h)] items-center justify-center leading-none whitespace-nowrap',
              dense ? 'px-[5px] text-[12px]' : 'px-2 text-[12.5px]',
              PRESS,
              i === 0 && 'rounded-l',
              i === options.length - 1 && 'rounded-r',
              on
                ? 'z-[1] bg-pick font-semibold text-pick-ink shadow-[inset_0_0_0_1px_var(--pick-line)]'
                : 'bg-field text-ink shadow-[inset_0_0_0_1px_var(--line)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--accent)_50%,transparent)]',
            )}
          >
            <SteadyText>{labels?.[o] ?? o}</SteadyText>
          </button>
        );
      })}
    </div>
  );
}

/** Small pill for multi-select lists (qualifications): red when picked. */
export function Chip({ on, onClick, children, title }: { on: boolean; onClick: () => void; children: ReactNode; title?: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      title={title}
      onClick={onClick}
      className={cx('inline-flex h-7 items-center rounded-full border px-2 text-[12.5px] leading-none whitespace-nowrap', PRESS, on ? PICKED : OFF)}
    >
      <SteadyText>{children}</SteadyText>
    </button>
  );
}

/**
 * (i) button that opens a small glossary. The panel is a native popover in the page's top layer (Esc and a click
 * outside close it), placed under the button and rendered at body level so the zoomed, clipped filter boxes do not
 * shrink or cut it.
 */
export function InfoPopover({ label, children }: { label: string; children: ReactNode }) {
  const id = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const p = panel.current;
    if (!p) return;
    const place = (e: Event) => {
      if ((e as ToggleEvent).newState !== 'open' || !button.current) return;
      const r = button.current.getBoundingClientRect();
      const w = Math.min(340, window.innerWidth - 16);
      p.style.width = `${w}px`;
      p.style.left = `${Math.max(8, Math.min(r.left - 12, window.innerWidth - w - 8))}px`;
      p.style.top = `${r.bottom + 6}px`;
    };
    // Flip above the button when there is no room below.
    const flip = (e: Event) => {
      if ((e as ToggleEvent).newState !== 'open' || !button.current) return;
      const r = button.current.getBoundingClientRect();
      if (r.bottom + 6 + p.offsetHeight > window.innerHeight - 8) p.style.top = `${Math.max(8, r.top - 6 - p.offsetHeight)}px`;
    };
    p.addEventListener('beforetoggle', place);
    p.addEventListener('toggle', flip);
    return () => {
      p.removeEventListener('beforetoggle', place);
      p.removeEventListener('toggle', flip);
    };
  }, []);
  return (
    <>
      <button
        ref={button}
        type="button"
        popoverTarget={id}
        aria-label={label}
        title={label}
        className="flex h-6 w-6 flex-none items-center justify-center rounded-full border border-line bg-field text-muted hover:border-accent hover:text-accent"
      >
        <svg viewBox="0 0 16 16" aria-hidden className="h-3.5 w-3.5" fill="currentColor">
          <circle cx="8" cy="4.2" r="1.15" />
          <rect x="7" y="6.6" width="2" height="6.4" rx="1" />
        </svg>
      </button>
      {createPortal(
        <div
          ref={panel}
          id={id}
          popover="auto"
          role="dialog"
          aria-label={label}
          className="fixed inset-auto m-0 rounded-lg border border-line bg-card p-3.5 text-ink shadow-hover"
        >
          {children}
        </div>,
        document.body,
      )}
    </>
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
      className={cx('flex h-[var(--ctl-h)] items-center gap-1.5 px-2.5 text-left text-[13px] leading-none whitespace-nowrap', CONTROL, on ? PICKED : OFF)}
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
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'mb-0.5 block text-[11.5px] leading-[13px] text-muted'}>
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
 * The small "Required" box beside a filter name. Ticked (default): candidates must match the filter.
 * Unticked: nice to have. Ticked uses the red picked look; a larger invisible hit area makes it easy to tap.
 */
export function RequiredBox({ on, name, onChange }: { on: boolean; name: string; onChange: (on: boolean) => void }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      aria-label={t.requiredFor(name)}
      title={t.requiredHint}
      onClick={() => onChange(!on)}
      data-required
      className={cx(
        'relative flex h-[14px] w-[14px] flex-none items-center justify-center rounded-[3px] border after:absolute after:-inset-[7px] after:content-[""]',
        PRESS,
        on ? 'border-pick-line bg-pick text-pick-ink' : 'border-muted/70 bg-field hover:border-accent',
      )}
    >
      {on && (
        <svg viewBox="0 0 12 12" aria-hidden className="h-[10px] w-[10px]">
          <path d="M2 6.5 4.8 9 10 3" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      )}
    </button>
  );
}

/**
 * A filter row (Ted's grid): a fixed label column (--label-w: 92px, 112px in Japanese; wider by --indent for the
 * Gaishi score, so its indented sub-filters keep the same control line), a 12px gap,
 * then the controls, so all row labels share one left edge and all controls start on one vertical line.
 * With `required`, the label starts with the small Required box; unticked rows say "nice to have".
 * On phones (under 640px) the label sits above its controls, so the controls get the full width.
 */
export function FilterRow({
  label,
  sub,
  required,
  firstLine,
  children,
}: {
  label: string;
  sub?: string;
  required?: { on: boolean; onChange: (on: boolean) => void };
  /** Height of the first line of controls when it is not --ctl-h (40 for the Gaishi letters, 32 for degrees): the label centres on it. */
  firstLine?: number;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const id = useId();
  return (
    <div
      role="group"
      aria-labelledby={id}
      data-optional={required && !required.on ? '' : undefined}
      className="grid grid-cols-1 gap-x-3 gap-y-1.5 py-[var(--row-py)] sm:grid-cols-[var(--label-w)_minmax(0,1fr)]"
    >
      <div
        className="flex items-start gap-1.5 sm:pt-[calc((var(--first-line,var(--ctl-h))-15px)/2)]"
        style={firstLine ? ({ '--first-line': `${firstLine}px` } as CSSProperties) : undefined}
      >
        {required && (
          <span className="pt-px">
            <RequiredBox on={required.on} name={label} onChange={required.onChange} />
          </span>
        )}
        <div className="min-w-0">
          <h3 id={id} className={cx('text-[12.5px] leading-[15px] font-semibold', required && !required.on && 'text-muted')}>
            {label}
          </h3>
          {required && !required.on && <p className="text-[10.5px] leading-[13px] font-medium text-accent">{t.niceTag}</p>}
          {sub && <p className="mt-1 text-[11.5px] leading-snug text-muted">{sub}</p>}
        </div>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function toggleIn<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

import type { ReactNode } from 'react';
import { cx } from './controls';

/** Rounded card used on the Upload Resume and Dashboard pages (Resume Studio look). */
export function StudioCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cx('rounded-[14px] border border-card-line bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:p-6', className)}>
      {children}
    </section>
  );
}

/** Card heading with the red dot. */
export function DotHeading({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="flex items-baseline gap-2.5 text-[17px] leading-snug font-medium sm:text-[18px]">
      <span aria-hidden className="h-2 w-2 flex-none -translate-y-[2px] rounded-full bg-accent" />
      <span>{children}</span>
    </h2>
  );
}

/** Small letter-spaced heading, e.g. CONVERSION MODE. */
export function CapsHeading({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="mono-caps text-[11px] font-semibold text-ink">
      {children}
    </h2>
  );
}

/** Pill-shaped two-option switch. The selected option gets a red outline. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full border border-card-line bg-tile p-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cx(
              'h-9 rounded-full border px-4 text-[14px] font-semibold whitespace-nowrap transition-colors',
              on
                ? 'border-accent bg-[color-mix(in_srgb,var(--accent)_10%,var(--card))] text-accent'
                : 'border-transparent text-ink/75 hover:text-ink',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Rounded chip in the monospace caption style. */
export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-[22px] items-center rounded-full border border-tile-line px-2 font-mono text-[10.5px] tracking-[0.06em] whitespace-nowrap text-ink/80">
      {children}
    </span>
  );
}

export const UploadIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" />
    <path d="M4.5 14.5v3.2c0 1 .8 1.8 1.8 1.8h11.4c1 0 1.8-.8 1.8-1.8v-3.2" />
  </svg>
);

export const FileIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
    <path d="M6.5 3h7.5L18.5 7.5V20a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M13.5 3v5h5" />
  </svg>
);

export const TrashIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 7h15M9.5 7V4.8c0-.4.4-.8.8-.8h3.4c.4 0 .8.4.8.8V7M6.5 7l.8 12.2c.1.5.5.8 1 .8h7.4c.5 0 .9-.3 1-.8L17.5 7M10 11v5.5M14 11v5.5" />
  </svg>
);

export const ArrowRight = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 16 16" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);

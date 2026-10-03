import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { litDecades } from '../lib/filter';
import { useI18n } from '../lib/i18n';
import { AGE_MAX, AGE_MIN, DECADES, type AgeFields } from '../lib/types';
import { PRESS, cx } from './controls';

const ANY: AgeFields = { ageMode: 'any', decades: [], ageMin: AGE_MIN, ageMax: AGE_MAX };
/** 20 to 69 is 50 years, so each decade is exactly one fifth of the track: the same grid as the five buttons. */
const SPAN = AGE_MAX - AGE_MIN + 1;
/** Position (%) of the start of a year on the track. The upper handle sits at the end of its year. */
const at = (yearStart: number) => ((yearStart - AGE_MIN) / SPAN) * 100;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Dual-handle slider drawn to line up exactly with the decade buttons above it: 30 to 49 runs from the left edge
 * of "30s" to the right edge of "40s". Drag either handle or the track; arrow keys move 1 year, Page Up/Down 10.
 */
function RangeSlider({ lo, hi, active, onChange }: { lo: number; hi: number; active: boolean; onChange: (lo: number, hi: number) => void }) {
  const { t } = useI18n();
  const track = useRef<HTMLDivElement>(null);
  const handles = useRef<Record<'lo' | 'hi', HTMLDivElement | null>>({ lo: null, hi: null });
  const drag = useRef<'lo' | 'hi' | null>(null);

  const yearAt = (clientX: number) => {
    const r = track.current!.getBoundingClientRect();
    return AGE_MIN + ((clientX - r.left) / r.width) * SPAN;
  };
  const move = (which: 'lo' | 'hi', clientX: number) => {
    const y = Math.round(yearAt(clientX));
    if (which === 'lo') onChange(clamp(y, AGE_MIN, hi), hi);
    else onChange(lo, clamp(y - 1, lo, AGE_MAX));
  };
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    const y = yearAt(e.clientX);
    const which = Math.abs(y - lo) <= Math.abs(y - (hi + 1)) ? 'lo' : 'hi';
    drag.current = which;
    e.currentTarget.setPointerCapture(e.pointerId);
    handles.current[which]?.focus();
    move(which, e.clientX);
  };
  const onKey = (which: 'lo' | 'hi') => (e: KeyboardEvent) => {
    const step = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -10, PageUp: 10 }[e.key];
    const v = which === 'lo' ? lo : hi;
    const next = e.key === 'Home' ? -Infinity : e.key === 'End' ? Infinity : step === undefined ? null : v + step;
    if (next === null) return;
    e.preventDefault();
    if (which === 'lo') onChange(clamp(next, AGE_MIN, hi), hi);
    else onChange(lo, clamp(next, lo, AGE_MAX));
  };
  const handle = (which: 'lo' | 'hi') => (
    <div
      ref={(el) => {
        handles.current[which] = el;
      }}
      role="slider"
      tabIndex={0}
      aria-label={which === 'lo' ? t.ageMinLabel : t.ageMaxLabel}
      aria-valuemin={which === 'lo' ? AGE_MIN : lo}
      aria-valuemax={which === 'lo' ? hi : AGE_MAX}
      aria-valuenow={which === 'lo' ? lo : hi}
      onKeyDown={onKey(which)}
      data-handle={which}
      className={cx(
        'absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-[1.5px] bg-card shadow-control active:cursor-grabbing',
        active ? 'border-accent' : 'border-muted',
      )}
      style={{ left: `${at(which === 'lo' ? lo : hi + 1)}%` }}
    />
  );

  return (
    <div
      ref={track}
      onPointerDown={onDown}
      onPointerMove={(e) => drag.current && move(drag.current, e.clientX)}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
      className="relative h-4 touch-none select-none"
      data-age-track
    >
      <div aria-hidden className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-line" />
      <div
        aria-hidden
        className={cx('absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full', active ? 'bg-accent' : 'bg-muted/50')}
        style={{ left: `${at(lo)}%`, width: `${at(hi + 1) - at(lo)}%` }}
      />
      {handle('lo')}
      {handle('hi')}
    </div>
  );
}

/** Small number box for typing an exact age. Applies as soon as the number is valid; shows the live value otherwise. */
function AgeBox({ value, label, accept, onCommit }: { value: number; label: string; accept: (v: number) => boolean; onCommit: (v: number) => void }) {
  // While the box is being edited it shows what was typed; otherwise always the current value (slider, decades).
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <input
      type="text"
      inputMode="numeric"
      maxLength={2}
      aria-label={label}
      value={editing ?? String(value)}
      onFocus={() => setEditing(String(value))}
      onChange={(e) => {
        const s = e.target.value.replace(/\D/g, '');
        setEditing(s);
        const v = Number(s);
        if (s.length === 2 && accept(v)) onCommit(v);
      }}
      onBlur={() => setEditing(null)}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      className="tabular h-7 w-11 rounded border border-line bg-field text-center text-[16px] text-ink outline-none hover:border-accent/50 focus:border-accent sm:text-[13.5px]"
    />
  );
}

/**
 * Age: five decade buttons, the slider directly under them on the same grid, "From [30] to [56]" boxes and a large
 * "Age 30 to 56" label, all in sync. Decades always select one continuous range: 30s + 40s = 30-49, and 20s + 40s
 * fills in the 30s. A typed or dragged range lights a decade only when it covers most of it (see AGE_LIGHT).
 */
export function AgeFilter({ filters, onChange }: { filters: AgeFields; onChange: (p: AgeFields) => void }) {
  const { t } = useI18n();
  const lit = [...litDecades(filters)].sort((a, b) => a - b);
  const lo = filters.ageMin;
  const hi = filters.ageMax;

  const setDecades = (list: number[]) =>
    onChange(list.length ? { ageMode: 'decades', decades: list, ageMin: list[0], ageMax: list[list.length - 1] + 9 } : ANY);

  const toggleDecade = (d: number) => {
    const first = lit[0];
    const last = lit[lit.length - 1];
    if (!lit.length) setDecades([d]);
    else if (!lit.includes(d)) setDecades(DECADES.filter((x) => x >= Math.min(first, d) && x <= Math.max(last, d)));
    // Clicking an end decade shrinks the range; clicking one in the middle keeps just that decade.
    else if (d === first || d === last) setDecades(lit.filter((x) => x !== d));
    else setDecades([d]);
  };

  const setRange = (min: number, max: number) => {
    if (min === AGE_MIN && max === AGE_MAX) onChange(ANY);
    else onChange({ ageMode: 'range', decades: [], ageMin: min, ageMax: max });
  };

  return (
    <div className="flex flex-col gap-1">
      <div role="group" aria-label={t.rowAge} className="grid grid-cols-5">
        {DECADES.map((d, i) => {
          const on = lit.includes(d);
          return (
            <button
              key={d}
              type="button"
              aria-pressed={on}
              onClick={() => toggleDecade(d)}
              className={cx(
                'relative h-[var(--ctl-h)] text-[13px]',
                PRESS,
                i === 0 && 'rounded-l',
                i === DECADES.length - 1 && 'rounded-r',
                on
                  ? 'z-[1] bg-pick font-semibold text-pick-ink shadow-[inset_0_0_0_1px_var(--pick-line)]'
                  : 'bg-field text-ink shadow-[inset_0_0_0_1px_var(--line)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--accent)_50%,transparent)]',
              )}
            >
              {t.decade(d)}
            </button>
          );
        })}
      </div>
      <RangeSlider lo={lo} hi={hi} active={filters.ageMode !== 'any'} onChange={setRange} />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-[12.5px] text-muted">
          {t.ageFrom && <span>{t.ageFrom}</span>}
          <AgeBox value={lo} label={t.ageMinLabel} accept={(v) => v >= AGE_MIN && v <= AGE_MAX} onCommit={(v) => setRange(v, Math.max(v, hi))} />
          <span>{t.ageTo}</span>
          <AgeBox value={hi} label={t.ageMaxLabel} accept={(v) => v >= Math.max(lo, AGE_MIN) && v <= AGE_MAX} onCommit={(v) => setRange(lo, v)} />
          {t.ageUnit && <span>{t.ageUnit}</span>}
        </div>
        <p className="tabular text-[18px] leading-none font-bold whitespace-nowrap" aria-live="polite">
          {filters.ageMode === 'any' ? t.anyAge : t.ageLabel(lo, hi)}
        </p>
      </div>
    </div>
  );
}

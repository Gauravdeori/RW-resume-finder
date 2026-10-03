import { ageCaption } from '../lib/describe';
import { litDecades } from '../lib/filter';
import { useI18n } from '../lib/i18n';
import { AGE_MAX, AGE_MIN, DECADES, type Filters } from '../lib/types';
import { Toggle } from './controls';

type AgePatch = Pick<Filters, 'ageMode' | 'decades' | 'ageMin' | 'ageMax'>;

const ANY: AgePatch = { ageMode: 'any', decades: [], ageMin: AGE_MIN, ageMax: AGE_MAX };
const SPAN = AGE_MAX - AGE_MIN;

/**
 * Position along the track, corrected for the native thumb width (--thumb, larger on touch screens)
 * so the drawn line meets the thumb centre.
 */
const pos = (v: number) => {
  const p = ((v - AGE_MIN) / SPAN) * 100;
  return `calc(${p}% + var(--thumb) * ${0.5 - p / 100})`;
};

/**
 * Two ways to set age: decade buttons (quick) or a two-handle slider (exact).
 * Clicking decades moves the handles; dragging lights the decades it covers. The control touched last decides.
 */
export function AgeFilter({ filters, onChange }: { filters: Filters; onChange: (p: AgePatch) => void }) {
  const { t } = useI18n();
  const lit = litDecades(filters);
  const lo = filters.ageMin;
  const hi = filters.ageMax;

  const toggleDecade = (d: number) => {
    const next = lit.includes(d) ? lit.filter((x) => x !== d) : [...lit, d];
    next.sort((a, b) => a - b);
    if (!next.length) onChange(ANY);
    else onChange({ ageMode: 'decades', decades: next, ageMin: next[0], ageMax: next[next.length - 1] + 9 });
  };

  const setRange = (min: number, max: number) => {
    if (min === AGE_MIN && max === AGE_MAX) onChange(ANY);
    else onChange({ ageMode: 'range', decades: [], ageMin: min, ageMax: max });
  };

  return (
    <div>
      <div role="group" aria-label={t.rowAge} className="flex flex-wrap gap-2 lg:gap-[0.333em]">
        {DECADES.map((d) => (
          <Toggle key={d} on={lit.includes(d)} onClick={() => toggleDecade(d)}>
            {t.decade(d)}
          </Toggle>
        ))}
      </div>

      {/* lg: slider and caption share one line */}
      <div className="mt-4 lg:mt-[0.5em] lg:flex lg:items-center lg:gap-[1em]">
      <div className="dual-range max-w-[300px] lg:w-[18em] lg:flex-none">
        <div aria-hidden className="absolute top-1/2 h-[2px] -translate-y-1/2 bg-line" style={{ left: 'calc(var(--thumb) / 2)', right: 'calc(var(--thumb) / 2)' }} />
        <div
          aria-hidden
          className="absolute top-1/2 h-[2px] -translate-y-1/2 bg-ink"
          style={{ left: pos(lo), right: `calc(100% - ${pos(hi)})` }}
        />
        <input
          type="range"
          min={AGE_MIN}
          max={AGE_MAX}
          step={1}
          value={lo}
          aria-label={t.ageMinLabel}
          aria-valuetext={String(lo)}
          onChange={(e) => setRange(Math.min(Number(e.target.value), hi), hi)}
          style={{ zIndex: lo > AGE_MIN + SPAN / 2 ? 4 : 3 }}
        />
        <input
          type="range"
          min={AGE_MIN}
          max={AGE_MAX}
          step={1}
          value={hi}
          aria-label={t.ageMaxLabel}
          aria-valuetext={String(hi)}
          onChange={(e) => setRange(lo, Math.max(Number(e.target.value), lo))}
          style={{ zIndex: 3 }}
        />
      </div>
      <p className="mt-2 text-[13px] text-muted lg:mt-0 lg:text-[1em]" aria-live="polite">
        {ageCaption(filters, t)}
      </p>
      </div>
    </div>
  );
}

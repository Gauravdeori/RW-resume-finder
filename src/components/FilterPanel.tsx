import { useI18n } from '../lib/i18n';
import {
  DEGREES,
  INDUSTRIES,
  MAJORS,
  POSITIONS,
  SCHOOL_CLASSES,
  SENIORITIES,
  type FilterGender,
  type Filters,
} from '../lib/types';
import { ActiveFilters } from './ActiveFilters';
import { AgeFilter } from './AgeFilter';
import { CheckTile, FilterRow, TextField, Toggle, ToggleGroup, toggleIn } from './controls';
import { GaishiFilter } from './GaishiFilter';
import { JdPanel } from './JdPanel';

const GENDERS: FilterGender[] = ['male', 'female'];
/** Same width for every block of controls, so rows line up on the right too. */
const WIDE = 'max-w-[880px]';
const FIELDS = 'grid max-w-[560px] grid-cols-2 gap-3';
/** Industry and position tiles: equal columns wide enough for one-line labels (36px tall), 8px gaps. */
const TILES = `grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fill,minmax(232px,1fr))] ${WIDE}`;

/**
 * Every filter on one page. Buttons and tiles only; no dropdowns.
 * Every row uses the same grid (160px label column, 40px gap, controls), so all labels share one left edge
 * and all controls start on one vertical line.
 */
export function FilterPanel({
  filters,
  onChange,
  onReplace,
  onClear,
  onJdFill,
  jdOpen,
  onJdToggle,
  showGender = true,
  showJdFill = true,
}: {
  filters: Filters;
  onChange: (p: Partial<Filters>) => void;
  /** Replace all filters at once (chip removal). */
  onReplace: (f: Filters) => void;
  onClear: () => void;
  onJdFill: (p: Partial<Filters>) => void;
  jdOpen: boolean;
  onJdToggle: () => void;
  /** Admin settings: the gender filter can be switched off per country; the JD panel can be hidden. */
  showGender?: boolean;
  showJdFill?: boolean;
}) {
  const { t } = useI18n();
  const f = filters;

  const setPrevious = (i: number, v: string) =>
    onChange({ previousCompanies: f.previousCompanies.map((p, j) => (j === i ? v : p)) });
  const removePrevious = (i: number) => onChange({ previousCompanies: f.previousCompanies.filter((_, j) => j !== i) });

  return (
    <div
      aria-label={t.filtersLabel}
      role="region"
      className="-mx-4 bg-card px-4 shadow-card sm:mx-0 sm:rounded-xl sm:px-6"
    >
      {showJdFill && <JdPanel open={jdOpen} onToggle={onJdToggle} onFill={onJdFill} />}
      <ActiveFilters filters={f} onReplace={onReplace} onClear={onClear} />

      <FilterRow label={t.rowName}>
        <div className={FIELDS}>
          <TextField label={t.lastName} value={f.lastName} onChange={(v) => onChange({ lastName: v })} />
          <TextField label={t.firstName} value={f.firstName} onChange={(v) => onChange({ firstName: v })} />
        </div>
      </FilterRow>

      <FilterRow label={t.rowCompany}>
        <div className={FIELDS}>
          <TextField label={t.currentCompany} value={f.currentCompany} onChange={(v) => onChange({ currentCompany: v })} />
          <div className="flex flex-col gap-2">
            {f.previousCompanies.map((p, i) => (
              <TextField
                key={i}
                label={i === 0 ? t.previousCompany : `${t.previousCompany} ${i + 1}`}
                value={p}
                onChange={(v) => setPrevious(i, v)}
                trailing={
                  i > 0 ? (
                    <button
                      type="button"
                      onClick={() => removePrevious(i)}
                      aria-label={t.removePrevious}
                      className="h-9 w-9 flex-none rounded-r border border-l-0 border-line text-[16px] text-muted transition-colors duration-150 hover:text-accent"
                    >
                      ×
                    </button>
                  ) : null
                }
              />
            ))}
          </div>
        </div>
        <div className="mt-2 grid max-w-[560px] grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onChange({ previousCompanies: [...f.previousCompanies, ''] })}
            className="col-span-2 justify-self-start text-left text-[12.5px] sm:col-span-1 sm:col-start-2 text-muted underline underline-offset-2 transition-colors duration-150 hover:text-ink"
          >
            + {t.addPrevious}
          </button>
        </div>
      </FilterRow>

      <FilterRow label={t.rowAge}>
        <AgeFilter filters={f} onChange={onChange} />
      </FilterRow>

      {showGender && (
        <FilterRow label={t.rowGender}>
          <div role="group" aria-label={t.rowGender} className="flex flex-wrap gap-2">
            {GENDERS.map((g) => (
              <Toggle key={g} on={f.genders.includes(g)} onClick={() => onChange({ genders: toggleIn(f.genders, g) })}>
                {t.gender[g]}
              </Toggle>
            ))}
          </div>
        </FilterRow>
      )}

      <FilterRow label={t.rowSeniority}>
        <div role="group" aria-label={t.rowSeniority} className={`flex flex-wrap gap-2 ${WIDE}`}>
          {SENIORITIES.map((s) => (
            <Toggle key={s} on={f.seniority.includes(s)} onClick={() => onChange({ seniority: toggleIn(f.seniority, s) })}>
              <span className="font-bold">{s}</span>
              <span>{t.seniorityButton[s]}</span>
            </Toggle>
          ))}
        </div>
      </FilterRow>

      <FilterRow label={t.rowIndustry}>
        <div role="group" aria-label={t.rowIndustry} className={TILES}>
          {INDUSTRIES.map((i) => (
            <CheckTile key={i} on={f.industries.includes(i)} onClick={() => onChange({ industries: toggleIn(f.industries, i) })} label={t.industry[i]} />
          ))}
        </div>
      </FilterRow>

      <FilterRow label={t.rowPosition}>
        <div role="group" aria-label={t.rowPosition} className={TILES}>
          {POSITIONS.map((p) => (
            <CheckTile key={p} on={f.positions.includes(p)} onClick={() => onChange({ positions: toggleIn(f.positions, p) })} label={t.position[p]} />
          ))}
        </div>
      </FilterRow>

      <FilterRow label={t.rowGaishi} sub={t.gaishiSub}>
        <GaishiFilter filters={f} onChange={onChange} />
      </FilterRow>

      <FilterRow label={t.rowEducation}>
        <div className={`grid gap-x-8 gap-y-4 sm:grid-cols-2 ${WIDE}`}>
          <div className="flex flex-col gap-4">
            <ToggleGroup label={t.degreeLabel}>
              {DEGREES.map((d) => (
                <Toggle key={d} on={f.degrees.includes(d)} onClick={() => onChange({ degrees: toggleIn(f.degrees, d) })}>
                  {t.degree[d]}
                </Toggle>
              ))}
            </ToggleGroup>
            <ToggleGroup label={t.majorLabel}>
              {MAJORS.map((m) => (
                <Toggle key={m} on={f.majors.includes(m)} onClick={() => onChange({ majors: toggleIn(f.majors, m) })}>
                  {t.major[m]}
                </Toggle>
              ))}
            </ToggleGroup>
          </div>
          <div className="flex flex-col gap-4">
            <ToggleGroup label={t.schoolClassLabel}>
              {SCHOOL_CLASSES.map((c) => (
                <Toggle
                  key={c}
                  on={f.schoolClasses.includes(c)}
                  onClick={() => onChange({ schoolClasses: toggleIn(f.schoolClasses, c) })}
                  className={c === 'Overseas' ? undefined : 'w-9 px-0 font-bold'}
                >
                  {t.schoolClass[c]}
                </Toggle>
              ))}
            </ToggleGroup>
            <TextField label={t.schoolName} value={f.schoolName} onChange={(v) => onChange({ schoolName: v })} />
          </div>
        </div>
      </FilterRow>
    </div>
  );
}

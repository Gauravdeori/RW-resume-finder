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
import { AgeFilter } from './AgeFilter';
import { CheckTile, FilterRow, TextField, Toggle, ToggleGroup, toggleIn } from './controls';
import { GaishiFilter } from './GaishiFilter';
import { JdPanel } from './JdPanel';

const GENDERS: FilterGender[] = ['male', 'female'];
/** Phones: tiles in a grid. Laptops/desktops: compact chips that wrap. */
const TILES = 'grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:flex lg:flex-wrap lg:gap-1';

/**
 * Every filter on one page. Buttons and tiles only; no dropdowns.
 * Laptops and desktops: three dense columns so the whole panel fits on one screen without scrolling
 * (reviewer feedback: Japanese recruiters prefer information packed together).
 * Tablets: two columns. Phones: one column with touch-sized controls.
 */
export function FilterPanel({
  filters,
  onChange,
  onJdFill,
  jdOpen,
  onJdToggle,
  showGender = true,
  showJdFill = true,
}: {
  filters: Filters;
  onChange: (p: Partial<Filters>) => void;
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
    <div aria-label={t.filtersLabel} role="region" className="-mx-4 bg-card px-4 sm:mx-0 sm:px-5 lg:px-4 lg:pb-1">
      {showJdFill && <JdPanel open={jdOpen} onToggle={onJdToggle} onFill={onJdFill} />}

      <div className="grid md:grid-cols-2 md:gap-x-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,0.98fr)_minmax(0,1.1fr)] lg:gap-x-4 xl:gap-x-5">
        {/* Column 1, background: name, company, education */}
        <div className="min-w-0 lg:[&>section:first-child]:border-t-0">
          <FilterRow label={t.rowName}>
            <div className="grid grid-cols-2 gap-3 lg:gap-2">
              <TextField label={t.lastName} value={f.lastName} onChange={(v) => onChange({ lastName: v })} />
              <TextField label={t.firstName} value={f.firstName} onChange={(v) => onChange({ firstName: v })} />
            </div>
          </FilterRow>

          <FilterRow
            label={t.rowCompany}
            action={
              <button
                type="button"
                onClick={() => onChange({ previousCompanies: [...f.previousCompanies, ''] })}
                className="text-right text-[13px] underline underline-offset-2 lg:text-[11.5px]"
              >
                {t.addPrevious}
              </button>
            }
          >
            <div className="grid grid-cols-2 gap-3 lg:gap-2">
              <TextField label={t.currentCompany} value={f.currentCompany} onChange={(v) => onChange({ currentCompany: v })} />
              <div className="flex flex-col gap-3 lg:gap-1.5">
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
                          className="h-11 w-10 flex-none border border-l-0 border-control text-[16px] text-muted hover:text-ink sm:h-10 lg:h-8 lg:w-8"
                        >
                          ×
                        </button>
                      ) : null
                    }
                  />
                ))}
              </div>
            </div>
          </FilterRow>

          <FilterRow label={t.rowEducation}>
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-1 lg:gap-y-1">
              <ToggleGroup label={t.degreeLabel}>
                {DEGREES.map((d) => (
                  <Toggle key={d} on={f.degrees.includes(d)} onClick={() => onChange({ degrees: toggleIn(f.degrees, d) })}>
                    {t.degree[d]}
                  </Toggle>
                ))}
              </ToggleGroup>
              <ToggleGroup label={t.schoolClassLabel}>
                {SCHOOL_CLASSES.map((c) => (
                  <Toggle
                    key={c}
                    on={f.schoolClasses.includes(c)}
                    onClick={() => onChange({ schoolClasses: toggleIn(f.schoolClasses, c) })}
                    className={c === 'Overseas' ? undefined : 'w-9 px-0 font-bold lg:w-7 lg:px-0'}
                  >
                    {t.schoolClass[c]}
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
              <TextField label={t.schoolName} value={f.schoolName} onChange={(v) => onChange({ schoolName: v })} />
            </div>
          </FilterRow>
        </div>

        {/* Column 2, role: seniority, industry, position */}
        <div className="min-w-0 lg:[&>section:first-child]:border-t-0">
          <FilterRow label={t.rowSeniority}>
            <div role="group" aria-label={t.rowSeniority} className="flex flex-wrap gap-2 lg:gap-1">
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
                <CheckTile
                  key={i}
                  on={f.industries.includes(i)}
                  onClick={() => onChange({ industries: toggleIn(f.industries, i) })}
                  label={t.industry[i]}
                />
              ))}
            </div>
          </FilterRow>

          <FilterRow label={t.rowPosition}>
            <div role="group" aria-label={t.rowPosition} className={TILES}>
              {POSITIONS.map((p) => (
                <CheckTile
                  key={p}
                  on={f.positions.includes(p)}
                  onClick={() => onChange({ positions: toggleIn(f.positions, p) })}
                  label={t.position[p]}
                />
              ))}
            </div>
          </FilterRow>
        </div>

        {/* Column 3, fit: gaishi, age, gender */}
        <div className="min-w-0 lg:[&>section:first-child]:border-t-0">
          <FilterRow label={t.rowGaishi} sub={t.gaishiSub}>
            <GaishiFilter filters={f} onChange={onChange} />
          </FilterRow>

          <FilterRow label={t.rowAge}>
            <AgeFilter filters={f} onChange={onChange} />
          </FilterRow>

          {showGender && (
            <FilterRow label={t.rowGender}>
              <div role="group" aria-label={t.rowGender} className="flex flex-wrap gap-2 lg:gap-1">
                {GENDERS.map((g) => (
                  <Toggle key={g} on={f.genders.includes(g)} onClick={() => onChange({ genders: toggleIn(f.genders, g) })}>
                    {t.gender[g]}
                  </Toggle>
                ))}
              </div>
            </FilterRow>
          )}
        </div>
      </div>
    </div>
  );
}

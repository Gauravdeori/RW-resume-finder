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
const CONTROLS = 'max-w-[520px]';

/** Every filter on one page. Buttons and tiles only; no dropdowns. */
export function FilterPanel({
  filters,
  onChange,
  onJdFill,
}: {
  filters: Filters;
  onChange: (p: Partial<Filters>) => void;
  onJdFill: (p: Partial<Filters>) => void;
}) {
  const { t } = useI18n();
  const f = filters;

  const setPrevious = (i: number, v: string) =>
    onChange({ previousCompanies: f.previousCompanies.map((p, j) => (j === i ? v : p)) });
  const removePrevious = (i: number) => onChange({ previousCompanies: f.previousCompanies.filter((_, j) => j !== i) });

  return (
    <div aria-label={t.filtersLabel} role="region" className="-mx-4 bg-card px-4 sm:mx-0 sm:px-5 md:px-6">
      <JdPanel onFill={onJdFill} />

      <FilterRow label={t.rowName}>
        <div className={`grid grid-cols-2 gap-3 ${CONTROLS}`}>
          <TextField label={t.lastName} value={f.lastName} onChange={(v) => onChange({ lastName: v })} />
          <TextField label={t.firstName} value={f.firstName} onChange={(v) => onChange({ firstName: v })} />
        </div>
      </FilterRow>

      <FilterRow label={t.rowCompany}>
        <div className={`grid grid-cols-2 gap-3 ${CONTROLS}`}>
          <TextField label={t.currentCompany} value={f.currentCompany} onChange={(v) => onChange({ currentCompany: v })} />
          <div className="flex flex-col gap-3">
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
                      className="h-11 w-10 flex-none border border-l-0 border-control sm:h-10 text-[16px] text-muted hover:text-ink"
                    >
                      ×
                    </button>
                  ) : null
                }
              />
            ))}
          </div>
        </div>
        {/* Own line so it never wraps on phones; under the previous-company column on wider screens. */}
        <div className={`mt-3 sm:grid sm:grid-cols-2 sm:gap-3 ${CONTROLS}`}>
          <button
            type="button"
            onClick={() => onChange({ previousCompanies: [...f.previousCompanies, ''] })}
            className="text-left text-[13px] underline underline-offset-2 sm:col-start-2 sm:justify-self-start"
          >
            {t.addPrevious}
          </button>
        </div>
      </FilterRow>

      <FilterRow label={t.rowAge}>
        <AgeFilter filters={f} onChange={onChange} />
      </FilterRow>

      <FilterRow label={t.rowGender}>
        <div role="group" aria-label={t.rowGender} className="flex flex-wrap gap-2">
          {GENDERS.map((g) => (
            <Toggle key={g} on={f.genders.includes(g)} onClick={() => onChange({ genders: toggleIn(f.genders, g) })}>
              {t.gender[g]}
            </Toggle>
          ))}
        </div>
      </FilterRow>

      <FilterRow label={t.rowSeniority}>
        <div role="group" aria-label={t.rowSeniority} className={`flex flex-wrap gap-2 ${CONTROLS}`}>
          {SENIORITIES.map((s) => (
            <Toggle key={s} on={f.seniority.includes(s)} onClick={() => onChange({ seniority: toggleIn(f.seniority, s) })}>
              <span className="font-bold">{s}</span>
              <span>{t.seniorityButton[s]}</span>
            </Toggle>
          ))}
        </div>
      </FilterRow>

      <FilterRow label={t.rowIndustry}>
        <div role="group" aria-label={t.rowIndustry} className={`grid grid-cols-2 gap-1.5 sm:grid-cols-3 ${CONTROLS}`}>
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
        <div role="group" aria-label={t.rowPosition} className={`grid grid-cols-2 gap-1.5 sm:grid-cols-3 ${CONTROLS}`}>
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

      <FilterRow label={t.rowGaishi} sub={t.gaishiSub}>
        <div className={CONTROLS}>
          <GaishiFilter filters={f} onChange={onChange} />
        </div>
      </FilterRow>

      <FilterRow label={t.rowEducation}>
        <div className={`grid gap-x-6 gap-y-5 sm:grid-cols-2 ${CONTROLS}`}>
          <div className="flex flex-col gap-5">
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
          <div className="flex flex-col gap-5">
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

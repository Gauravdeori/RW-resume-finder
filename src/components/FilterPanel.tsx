import { memo, useCallback, useId, useMemo, useState, type ReactNode } from 'react';
import { useI18n } from '../lib/i18n';
import {
  DEGREES,
  GAISHI_SCORES,
  INDUSTRIES,
  MAJORS,
  POSITIONS,
  SCHOOL_CLASSES,
  SENIORITIES,
  type AgeFields,
  type Filters,
} from '../lib/types';
import { AgeFilter } from './AgeFilter';
import { CheckTile, FilterRow, TextField, Toggle, cx, toggleIn } from './controls';
import { JdPanel } from './JdPanel';

const GENDERS = ['male', 'female'] as const;
const FOREIGN = ['any', 'never', 'once', 'twice'] as const;
const AT_LEAST = ['any', 'Conversational', 'Business', 'Fluent', 'Native'] as const;
const OVERSEAS = ['any', 'yes', 'no'] as const;
const GAISHI_LABELS = { A: 'A', B: 'B', C: 'C', D: 'D' };
/** Single letters get square buttons. */
const SQUARE = ['A', 'B', 'C', 'D', 'S'];
const WRAP = 'flex flex-wrap gap-2';

type SectionKey = 'basics' | 'role' | 'gaishi' | 'education';
type Patch = (p: Partial<Filters>) => void;
type ListField = 'genders' | 'seniority' | 'industries' | 'positions' | 'gaishiScores' | 'degrees' | 'schoolClasses' | 'majors';
type ChoiceField = 'foreign' | 'englishMin' | 'japaneseMin' | 'overseas';

/** How many filters are active in each section (shown as a badge on the section header). */
function activeIn(key: SectionKey, f: Filters, showGender: boolean): number {
  const t = (s: string) => (s.trim() ? 1 : 0);
  switch (key) {
    case 'basics':
      return (
        t(f.lastName) +
        t(f.firstName) +
        t(f.currentCompany) +
        f.previousCompanies.filter((p) => p.trim()).length +
        (f.ageMode !== 'any' ? 1 : 0) +
        (showGender ? f.genders.length : 0)
      );
    case 'role':
      return f.seniority.length + f.industries.length + f.positions.length;
    case 'gaishi':
      return (
        f.gaishiScores.length +
        (f.foreign !== 'any' ? 1 : 0) +
        (f.englishMin !== 'any' ? 1 : 0) +
        (f.japaneseMin !== 'any' ? 1 : 0) +
        (f.overseas !== 'any' ? 1 : 0)
      );
    case 'education':
      return f.degrees.length + f.schoolClasses.length + f.majors.length + t(f.schoolName);
  }
}

/** Collapsible section card. */
function Section({
  id,
  title,
  count,
  open,
  onToggle,
  children,
}: {
  id: SectionKey;
  title: string;
  count: number;
  open: boolean;
  onToggle: (k: SectionKey) => void;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const bodyId = useId();
  return (
    <section className="rounded-xl border border-line bg-card shadow-card">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => onToggle(id)}
          className="flex h-11 w-full items-center gap-2 px-3 text-left text-[12px] font-semibold tracking-[0.08em] uppercase"
        >
          <span className="flex-1">{title}</span>
          {count > 0 && (
            <span
              aria-label={t.nSelected(count)}
              className="tabular inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold tracking-normal text-on-accent"
            >
              {count}
            </span>
          )}
          <svg
            viewBox="0 0 16 16"
            aria-hidden
            className={cx('h-4 w-4 text-muted transition-transform duration-150', open && 'rotate-180')}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m4 6 4 4 4-4" />
          </svg>
        </button>
      </h2>
      <div id={bodyId} hidden={!open} className="divide-y divide-line border-t border-line px-3">
        {children}
      </div>
    </section>
  );
}

// ---------- rows: each is memoised and gets only its own fields, so a click re-renders one row ----------

/** Tick any number of choices (joined with OR). */
const MultiRow = memo(function MultiRow({
  label,
  field,
  value,
  options,
  labels,
  onChange,
  tiles,
  withCode,
  help,
}: {
  label: string;
  field: ListField;
  value: readonly string[];
  options: readonly string[];
  labels: Record<string, string>;
  onChange: Patch;
  /** Checkbox tiles (industry, position) instead of toggle buttons. */
  tiles?: boolean;
  /** Show the code in bold before the label (seniority: "K Kachō, manager"). */
  withCode?: boolean;
  help?: string;
}) {
  const toggle = (o: string) => onChange({ [field]: toggleIn(value as string[], o) } as Partial<Filters>);
  return (
    <FilterRow label={label}>
      <div className={WRAP}>
        {options.map((o) =>
          tiles ? (
            <CheckTile key={o} on={value.includes(o)} onClick={() => toggle(o)} label={labels[o]} />
          ) : (
            <Toggle key={o} on={value.includes(o)} onClick={() => toggle(o)} className={!withCode && SQUARE.includes(o) ? 'w-9 px-0 font-bold' : undefined}>
              {withCode ? (
                <>
                  <span className="font-bold">{o}</span>
                  <span>{labels[o]}</span>
                </>
              ) : (
                labels[o]
              )}
            </Toggle>
          ),
        )}
      </div>
      {help && <p className="mt-1.5 text-[11.5px] leading-snug text-muted">{help}</p>}
    </FilterRow>
  );
});

/** Pick one choice; clicking the selected one again goes back to "Any". */
const ChoiceRow = memo(function ChoiceRow({
  label,
  field,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  field: ChoiceField;
  value: string;
  options: readonly string[];
  labels: Record<string, string>;
  onChange: Patch;
}) {
  return (
    <FilterRow label={label}>
      <div className={WRAP}>
        {options.map((o) => (
          <Toggle key={o} on={value === o} onClick={() => onChange({ [field]: value === o ? 'any' : o } as Partial<Filters>)}>
            {labels[o]}
          </Toggle>
        ))}
      </div>
    </FilterRow>
  );
});

const NameRow = memo(function NameRow({ last, first, onChange }: { last: string; first: string; onChange: Patch }) {
  const { t } = useI18n();
  return (
    <FilterRow label={t.rowName}>
      <div className="grid grid-cols-2 gap-2">
        <TextField label={t.lastName} value={last} onChange={(v) => onChange({ lastName: v })} />
        <TextField label={t.firstName} value={first} onChange={(v) => onChange({ firstName: v })} />
      </div>
    </FilterRow>
  );
});

const CompanyRow = memo(function CompanyRow({ current, previous, onChange }: { current: string; previous: string[]; onChange: Patch }) {
  const { t } = useI18n();
  const setPrevious = (i: number, v: string) => onChange({ previousCompanies: previous.map((p, j) => (j === i ? v : p)) });
  const removePrevious = (i: number) => onChange({ previousCompanies: previous.filter((_, j) => j !== i) });
  return (
    <FilterRow label={t.rowCompany}>
      <div className="flex flex-col gap-2">
        <TextField label={t.currentCompany} value={current} onChange={(v) => onChange({ currentCompany: v })} />
        {previous.map((p, i) => (
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
                  className="h-9 w-9 flex-none rounded-r border border-l-0 border-line text-[16px] text-muted hover:text-accent"
                >
                  ×
                </button>
              ) : null
            }
          />
        ))}
        <button
          type="button"
          onClick={() => onChange({ previousCompanies: [...previous, ''] })}
          className="self-start text-left text-[12.5px] text-muted underline underline-offset-2 hover:text-ink"
        >
          + {t.addPrevious}
        </button>
      </div>
    </FilterRow>
  );
});

const AgeRow = memo(function AgeRow({ ageMode, decades, ageMin, ageMax, onChange }: AgeFields & { onChange: Patch }) {
  const { t } = useI18n();
  const age = useMemo(() => ({ ageMode, decades, ageMin, ageMax }), [ageMode, decades, ageMin, ageMax]);
  return (
    <FilterRow label={t.rowAge}>
      <AgeFilter filters={age} onChange={onChange} />
    </FilterRow>
  );
});

const SchoolRow = memo(function SchoolRow({ value, onChange }: { value: string; onChange: Patch }) {
  const { t } = useI18n();
  return (
    <FilterRow label={t.schoolName}>
      <TextField label={t.schoolName} value={value} onChange={(v) => onChange({ schoolName: v })} hideLabel />
    </FilterRow>
  );
});

/**
 * The filter sidebar: job description box, then four collapsible sections (Basics and Role open by default).
 * Memoised, so it does not re-render when only the results, sort or CV drawer change.
 */
export const FilterPanel = memo(function FilterPanel({
  filters: f,
  onChange,
  onJdFill,
  showGender = true,
  showJdFill = true,
}: {
  filters: Filters;
  onChange: Patch;
  onJdFill: Patch;
  /** Admin settings: the gender filter can be switched off per country; the JD box can be hidden. */
  showGender?: boolean;
  showJdFill?: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState<Record<SectionKey, boolean>>({ basics: true, role: true, gaishi: false, education: false });
  const toggle = useCallback((k: SectionKey) => setOpen((o) => ({ ...o, [k]: !o[k] })), []);
  // Option labels per language; stable objects so the rows' memo holds.
  const labels = useMemo(
    () => ({
      foreign: t.foreign,
      level: { any: t.any, ...t.level },
      overseas: t.overseas,
    }),
    [t],
  );
  const section = (key: SectionKey, children: ReactNode) => (
    <Section id={key} title={t.sections[key]} count={activeIn(key, f, showGender)} open={open[key]} onToggle={toggle}>
      {children}
    </Section>
  );

  return (
    <div role="region" aria-label={t.filtersLabel} className="flex flex-col gap-3">
      {showJdFill && <JdPanel onFill={onJdFill} />}
      {section(
        'basics',
        <>
          <NameRow last={f.lastName} first={f.firstName} onChange={onChange} />
          <CompanyRow current={f.currentCompany} previous={f.previousCompanies} onChange={onChange} />
          <AgeRow ageMode={f.ageMode} decades={f.decades} ageMin={f.ageMin} ageMax={f.ageMax} onChange={onChange} />
          {showGender && <MultiRow label={t.rowGender} field="genders" value={f.genders} options={GENDERS} labels={t.gender} onChange={onChange} />}
        </>,
      )}
      {section(
        'role',
        <>
          <MultiRow
            label={t.rowSeniority}
            field="seniority"
            value={f.seniority}
            options={SENIORITIES}
            labels={t.seniorityButton}
            onChange={onChange}
            withCode
          />
          <MultiRow label={t.rowIndustry} field="industries" value={f.industries} options={INDUSTRIES} labels={t.industry} onChange={onChange} tiles />
          <MultiRow label={t.rowPosition} field="positions" value={f.positions} options={POSITIONS} labels={t.position} onChange={onChange} tiles />
        </>,
      )}
      {section(
        'gaishi',
        <>
          <MultiRow
            label={t.gaishiScore}
            field="gaishiScores"
            value={f.gaishiScores}
            options={GAISHI_SCORES}
            labels={GAISHI_LABELS}
            onChange={onChange}
            help={t.gaishiHelp}
          />
          <ChoiceRow label={t.foreignLabel} field="foreign" value={f.foreign} options={FOREIGN} labels={labels.foreign} onChange={onChange} />
          <ChoiceRow label={t.englishAtLeast} field="englishMin" value={f.englishMin} options={AT_LEAST} labels={labels.level} onChange={onChange} />
          <ChoiceRow label={t.japaneseAtLeast} field="japaneseMin" value={f.japaneseMin} options={AT_LEAST} labels={labels.level} onChange={onChange} />
          <ChoiceRow label={t.overseasLabel} field="overseas" value={f.overseas} options={OVERSEAS} labels={labels.overseas} onChange={onChange} />
        </>,
      )}
      {section(
        'education',
        <>
          <MultiRow label={t.degreeLabel} field="degrees" value={f.degrees} options={DEGREES} labels={t.degree} onChange={onChange} />
          <MultiRow label={t.schoolClassLabel} field="schoolClasses" value={f.schoolClasses} options={SCHOOL_CLASSES} labels={t.schoolClass} onChange={onChange} />
          <MultiRow label={t.majorLabel} field="majors" value={f.majors} options={MAJORS} labels={t.major} onChange={onChange} />
          <SchoolRow value={f.schoolName} onChange={onChange} />
        </>,
      )}
    </div>
  );
});

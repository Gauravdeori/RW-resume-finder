import { memo, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
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
  type FilterGender,
  type Filters,
} from '../lib/types';
import { AgeFilter } from './AgeFilter';
import { CheckTile, FilterRow, TextField, Toggle, cx, toggleIn } from './controls';
import { JdButton } from './JdButton';

const GENDERS = ['male', 'female'] as const;
const FOREIGN = ['any', 'never', 'once', 'twice'] as const;
const AT_LEAST = ['any', 'Conversational', 'Business', 'Fluent', 'Native'] as const;
const OVERSEAS = ['any', 'yes', 'no'] as const;
const GAISHI_LABELS = { A: 'A', B: 'B', C: 'C', D: 'D' };
/** Single letters get square buttons. */
const SQUARE = ['A', 'B', 'C', 'D', 'S'];
const WRAP = 'flex flex-wrap gap-x-2 gap-y-1.5';

type SectionKey = 'basics' | 'role' | 'gaishi' | 'education';
const TABS: SectionKey[] = ['basics', 'role', 'gaishi', 'education'];
type Patch = (p: Partial<Filters>) => void;
type ListField = 'genders' | 'seniority' | 'industries' | 'positions' | 'gaishiScores' | 'degrees' | 'schoolClasses' | 'majors';
type ChoiceField = 'foreign' | 'englishMin' | 'japaneseMin' | 'overseas';

/** How many filters are active in each group (shown as a badge on its tab or zone heading). */
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

function CountBadge({ n }: { n: number }) {
  const { t } = useI18n();
  if (!n) return null;
  return (
    <span
      aria-label={t.nSelected(n)}
      className="tabular inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10.5px] font-bold tracking-normal text-on-accent"
    >
      {n}
    </span>
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
  titles,
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
  /** Show the code in bold before the label (seniority: "K Kachō"). */
  withCode?: boolean;
  /** Full wording shown as a tooltip when `labels` are short. */
  titles?: Record<string, string>;
  /** Short help shown beside the buttons. */
  help?: string;
}) {
  const toggle = (o: string) => onChange({ [field]: toggleIn(value as string[], o) } as Partial<Filters>);
  return (
    <FilterRow label={label}>
      <div className={cx(help && 'flex items-center gap-3')}>
        <div className={cx(WRAP, help && 'flex-none')}>
          {options.map((o) =>
            tiles ? (
              <CheckTile key={o} on={value.includes(o)} onClick={() => toggle(o)} label={labels[o]} />
            ) : (
              <Toggle
                key={o}
                on={value.includes(o)}
                onClick={() => toggle(o)}
                title={titles?.[o]}
                className={!withCode && SQUARE.includes(o) ? 'w-9 px-0 font-bold' : undefined}
              >
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
        {help && <p className="min-w-0 text-[11px] leading-snug text-muted">{help}</p>}
      </div>
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

const GenderButtons = ({ value, onChange }: { value: FilterGender[]; onChange: Patch }) => {
  const { t } = useI18n();
  return (
    <>
      {GENDERS.map((g) => (
        <Toggle key={g} on={value.includes(g)} onClick={() => onChange({ genders: toggleIn(value, g) })}>
          {t.gender[g]}
        </Toggle>
      ))}
    </>
  );
};

/**
 * Name. Japanese names are rarely over three characters, so in Japanese the two boxes are half width and the
 * gender buttons share the row; English keeps two wide boxes (gender gets its own row).
 */
const NameRow = memo(function NameRow({
  last,
  first,
  genders,
  showGender,
  onChange,
}: {
  last: string;
  first: string;
  genders: FilterGender[];
  showGender: boolean;
  onChange: Patch;
}) {
  const { t, lang } = useI18n();
  const genderId = useId();
  if (lang === 'ja')
    return (
      <FilterRow label={t.rowName}>
        <div className="flex flex-wrap items-end gap-x-2 gap-y-1.5">
          <TextField label={t.lastName} value={last} onChange={(v) => onChange({ lastName: v })} className="w-[84px]" />
          <TextField label={t.firstName} value={first} onChange={(v) => onChange({ firstName: v })} className="w-[84px]" />
          {showGender && (
            <div role="group" aria-labelledby={genderId} className="ml-auto flex items-center gap-2">
              <span id={genderId} className="text-[12.5px] font-semibold">
                {t.rowGender}
              </span>
              <GenderButtons value={genders} onChange={onChange} />
            </div>
          )}
        </div>
      </FilterRow>
    );
  return (
    <FilterRow label={t.rowName}>
      <div className="grid grid-cols-2 gap-2">
        <TextField label={t.lastName} value={last} onChange={(v) => onChange({ lastName: v })} />
        <TextField label={t.firstName} value={first} onChange={(v) => onChange({ firstName: v })} />
      </div>
    </FilterRow>
  );
});

const GenderRow = memo(function GenderRow({ value, onChange }: { value: FilterGender[]; onChange: Patch }) {
  const { t, lang } = useI18n();
  if (lang === 'ja') return null; // shares the name row in Japanese
  return (
    <FilterRow label={t.rowGender}>
      <div className={WRAP}>
        <GenderButtons value={value} onChange={onChange} />
      </div>
    </FilterRow>
  );
});

/** Current company and up to three previous companies (more would not fit the screen). */
const MAX_PREVIOUS = 3;

const CompanyRow = memo(function CompanyRow({ current, previous, onChange }: { current: string; previous: string[]; onChange: Patch }) {
  const { t } = useI18n();
  const setPrevious = (i: number, v: string) => onChange({ previousCompanies: previous.map((p, j) => (j === i ? v : p)) });
  const removePrevious = (i: number) => onChange({ previousCompanies: previous.filter((_, j) => j !== i) });
  return (
    <FilterRow label={t.rowCompany}>
      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-2 gap-2">
          <TextField label={t.currentCompany} value={current} onChange={(v) => onChange({ currentCompany: v })} />
          <TextField label={t.previousCompany} value={previous[0] ?? ''} onChange={(v) => setPrevious(0, v)} />
        </div>
        {previous.slice(1).map((p, k) => {
          const i = k + 1;
          return (
            <TextField
              key={i}
              label={`${t.previousCompany} ${i + 1}`}
              value={p}
              onChange={(v) => setPrevious(i, v)}
              hideLabel
              trailing={
                <button
                  type="button"
                  onClick={() => removePrevious(i)}
                  aria-label={t.removePrevious}
                  className="h-[var(--ctl-h)] w-9 flex-none rounded-r border border-l-0 border-line text-[16px] text-muted hover:text-accent"
                >
                  ×
                </button>
              }
            />
          );
        })}
        {previous.length < MAX_PREVIOUS && (
          <button
            type="button"
            onClick={() => onChange({ previousCompanies: [...previous, ''] })}
            className="self-start text-left text-[12px] text-muted underline underline-offset-2 hover:text-accent"
          >
            + {t.addPrevious}
          </button>
        )}
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

/** The rows of one group, shared by both layouts. */
function GroupRows({ group, f, onChange, showGender }: { group: SectionKey; f: Filters; onChange: Patch; showGender: boolean }) {
  const { t } = useI18n();
  // Option labels per language; stable objects so the rows' memo holds.
  const labels = useMemo(() => ({ foreign: t.foreign, level: { any: t.any, ...t.level }, overseas: t.overseas }), [t]);
  switch (group) {
    case 'basics':
      return (
        <>
          <NameRow last={f.lastName} first={f.firstName} genders={f.genders} showGender={showGender} onChange={onChange} />
          <CompanyRow current={f.currentCompany} previous={f.previousCompanies} onChange={onChange} />
          <AgeRow ageMode={f.ageMode} decades={f.decades} ageMin={f.ageMin} ageMax={f.ageMax} onChange={onChange} />
          {showGender && <GenderRow value={f.genders} onChange={onChange} />}
        </>
      );
    case 'role':
      return (
        <>
          <MultiRow
            label={t.rowSeniority}
            field="seniority"
            value={f.seniority}
            options={SENIORITIES}
            labels={t.seniorityShort}
            titles={t.seniorityButton}
            onChange={onChange}
            withCode
          />
          <MultiRow label={t.rowIndustry} field="industries" value={f.industries} options={INDUSTRIES} labels={t.industry} onChange={onChange} tiles />
          <MultiRow label={t.rowPosition} field="positions" value={f.positions} options={POSITIONS} labels={t.position} onChange={onChange} tiles />
        </>
      );
    case 'gaishi':
      return (
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
        </>
      );
    case 'education':
      return (
        <>
          <MultiRow label={t.degreeLabel} field="degrees" value={f.degrees} options={DEGREES} labels={t.degree} onChange={onChange} />
          <MultiRow label={t.schoolClassLabel} field="schoolClasses" value={f.schoolClasses} options={SCHOOL_CLASSES} labels={t.schoolClass} onChange={onChange} />
          <MultiRow label={t.majorLabel} field="majors" value={f.majors} options={MAJORS} labels={t.major} onChange={onChange} />
          <SchoolRow value={f.schoolName} onChange={onChange} />
        </>
      );
  }
}

/** One clearly framed zone of the full-screen search, with a small heading and its active-filter count. */
function Zone({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="rounded-xl border border-line bg-card shadow-card">
      <h2 id={id} className="flex items-center gap-2 px-3.5 pt-2.5 text-[11.5px] font-semibold tracking-[0.08em] text-muted uppercase">
        {title}
        <CountBadge n={count} />
      </h2>
      <div className="divide-y divide-line px-3.5 pb-1">{children}</div>
    </section>
  );
}

/** Tab strip: Basics | Role | Gaishi fit | Education, each with a badge counting its active filters. Arrow keys move. */
function Tabs({
  current,
  counts,
  onSelect,
  idFor,
}: {
  current: SectionKey;
  counts: Record<SectionKey, number>;
  onSelect: (k: SectionKey) => void;
  idFor: (k: SectionKey, part: 'tab' | 'panel') => string;
}) {
  const { t } = useI18n();
  const refs = useRef<Partial<Record<SectionKey, HTMLButtonElement | null>>>({});
  const onKey = (e: KeyboardEvent) => {
    const i = TABS.indexOf(current);
    const to =
      e.key === 'ArrowRight' ? TABS[(i + 1) % TABS.length]
      : e.key === 'ArrowLeft' ? TABS[(i + TABS.length - 1) % TABS.length]
      : e.key === 'Home' ? TABS[0]
      : e.key === 'End' ? TABS[TABS.length - 1]
      : null;
    if (!to) return;
    e.preventDefault();
    onSelect(to);
    refs.current[to]?.focus();
  };
  return (
    <div role="tablist" aria-label={t.filtersLabel} onKeyDown={onKey} className="flex flex-none border-b border-line px-2">
      {TABS.map((k) => {
        const on = k === current;
        return (
          <button
            key={k}
            ref={(el) => {
              refs.current[k] = el;
            }}
            type="button"
            role="tab"
            id={idFor(k, 'tab')}
            aria-selected={on}
            aria-controls={idFor(k, 'panel')}
            tabIndex={on ? 0 : -1}
            onClick={() => onSelect(k)}
            className={cx(
              'relative flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 px-1 text-[12.5px] whitespace-nowrap',
              on ? 'font-semibold text-pick-ink after:absolute after:inset-x-2 after:-bottom-px after:h-[2px] after:bg-accent' : 'text-muted hover:text-ink',
            )}
          >
            {t.sections[k]}
            <CountBadge n={counts[k]} />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Every filter, in one of two layouts:
 * - "zones": the full-screen search. Four framed zones (Basics, Role, Gaishi fit, Education) all visible at once,
 *   in two columns sized so everything fits one screen.
 * - "tabs": the split view's side panel. One group at a time under a tab strip.
 * Memoised, so it does not re-render when only the results, sort, page or CV drawer change.
 */
export const FilterPanel = memo(function FilterPanel({
  filters: f,
  onChange,
  onJdFill,
  showGender = true,
  showJdFill = true,
  heading = true,
  layout = 'tabs',
  onAllFilters,
}: {
  filters: Filters;
  onChange: Patch;
  onJdFill: Patch;
  /** Admin settings: the gender filter can be switched off per country; the JD box can be hidden. */
  showGender?: boolean;
  showJdFill?: boolean;
  /** Show the page title (tabs layout; off in the phone sheet, which has its own). */
  heading?: boolean;
  layout?: 'tabs' | 'zones';
  /** Tabs layout: go back to the full-screen search. */
  onAllFilters?: () => void;
}) {
  const { t } = useI18n();
  const [tab, setTab] = useState<SectionKey>('basics');
  const baseId = useId();
  const idFor = (k: SectionKey, part: 'tab' | 'panel') => `${baseId}-${part}-${k}`;
  const counts: Record<SectionKey, number> = {
    basics: activeIn('basics', f, showGender),
    role: activeIn('role', f, showGender),
    gaishi: activeIn('gaishi', f, showGender),
    education: activeIn('education', f, showGender),
  };
  const zone = (k: SectionKey) => (
    <Zone title={t.sections[k]} count={counts[k]}>
      <GroupRows group={k} f={f} onChange={onChange} showGender={showGender} />
    </Zone>
  );

  if (layout === 'zones')
    return (
      <div role="region" aria-label={t.filtersLabel} className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.18fr)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-3">
          {zone('basics')}
          {zone('education')}
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          {zone('role')}
          {zone('gaishi')}
        </div>
      </div>
    );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {(heading || showJdFill || onAllFilters) && (
        <div className="flex flex-none items-center gap-2 px-4 pt-3 pb-2">
          {heading && <h1 className="mr-auto text-[18px] leading-tight font-bold tracking-[-0.02em]">{t.pageTitle}</h1>}
          {onAllFilters && (
            <button
              type="button"
              onClick={onAllFilters}
              title={t.allFiltersHint}
              className={`inline-flex h-8 flex-none items-center gap-1.5 rounded-lg border border-line bg-field px-2.5 text-[12px] font-medium hover:border-accent/50 ${heading ? '' : 'mr-auto'}`}
            >
              <svg viewBox="0 0 16 16" aria-hidden className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <rect x="2" y="2" width="5" height="5" rx="1" />
                <rect x="9" y="2" width="5" height="5" rx="1" />
                <rect x="2" y="9" width="5" height="5" rx="1" />
                <rect x="9" y="9" width="5" height="5" rx="1" />
              </svg>
              {t.allFilters}
            </button>
          )}
          {showJdFill && <JdButton onFill={onJdFill} />}
        </div>
      )}
      <Tabs current={tab} counts={counts} onSelect={setTab} idFor={idFor} />
      <h2 className="sr-only">{t.sections[tab]}</h2>
      {/* Each group is sized to fit; only on very short screens can this one area scroll, as a fallback. */}
      <div
        role="tabpanel"
        id={idFor(tab, 'panel')}
        aria-labelledby={idFor(tab, 'tab')}
        className="min-h-0 flex-1 divide-y divide-line overflow-y-auto overscroll-contain px-4"
      >
        <GroupRows group={tab} f={f} onChange={onChange} showGender={showGender} />
      </div>
    </div>
  );
});

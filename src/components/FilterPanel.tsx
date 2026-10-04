import { memo, useCallback, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { gaishiRange } from '../lib/gaishi';
import { useI18n } from '../lib/i18n';
import { JLPT_LEVEL, TOEIC_MAX, TOEIC_MIN, jlptForLevel, toeicLevel } from '../lib/languageTests';
import {
  DEGREES,
  DEGREES_WITH_MAJOR,
  GAISHI_SCORES,
  GPA_MAX,
  INDUSTRIES,
  JLPT_LEVELS,
  LEVELS,
  MAJORS,
  POSITIONS,
  QUALIFICATIONS,
  SCHOOL_RATINGS,
  SENIORITIES,
  type AgeFields,
  type Degree,
  type FilterGender,
  type Filters,
  type ForeignFilter,
  type GaishiScore,
  type Jlpt,
  type LevelFilter,
  type Major,
  type OverseasFilter,
  type Qualification,
  type RowKey,
} from '../lib/types';
import { AgeFilter } from './AgeFilter';
import { CheckTile, Chip, FilterRow, InfoPopover, OFF, PICKED, RequiredBox, Segmented, TextField, Toggle, cx, toggleIn } from './controls';
import { FitToScreen } from './FitToScreen';
import { JdButton } from './JdButton';

const GENDERS = ['male', 'female'] as const;
const FOREIGN = ['any', 'never', 'once', 'twice'] as const;
const OVERSEAS = ['any', 'yes', 'no'] as const;
/** Single letters get square buttons. */
const SQUARE = ['A', 'B', 'C', 'D', 'S'];
const WRAP = 'flex flex-wrap gap-x-2 gap-y-1.5';
/** Small grey helper line under a control ("or higher", "TOEIC 820 = Fluent"). */
const CAPTION = 'mt-0.5 text-[11px] leading-[13px] whitespace-nowrap text-muted';

type SectionKey = 'candidate' | 'role' | 'gaishi' | 'education';
const TABS: SectionKey[] = ['candidate', 'role', 'gaishi', 'education'];
type Patch = (p: Partial<Filters>) => void;
type ListField = 'genders' | 'seniority' | 'industries' | 'positions' | 'schoolRatings';
type ChoiceField = 'foreign' | 'overseas';
/** Rows get the list of nice-to-have rows (stable unless it changes) and one callback for their Required box. */
type Req = { optional: RowKey[]; onRequired: (row: RowKey, on: boolean) => void };
const ROW_OF: Record<ListField | ChoiceField, RowKey> = {
  genders: 'gender',
  seniority: 'seniority',
  industries: 'industry',
  positions: 'position',
  schoolRatings: 'schoolRating',
  foreign: 'foreign',
  overseas: 'overseas',
};
const reqFor = ({ optional, onRequired }: Req, row: RowKey) => ({ on: !optional.includes(row), onChange: (on: boolean) => onRequired(row, on) });

/** How many filters are active in each group (shown as a badge on its tab or zone heading). */
function activeIn(key: SectionKey, f: Filters, showGender: boolean): number {
  const t = (s: string) => (s.trim() ? 1 : 0);
  switch (key) {
    case 'candidate':
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
        (f.englishMin !== 'any' ? 1 : 0) +
        (f.japaneseMin !== 'any' ? 1 : 0) +
        (f.overseas !== 'any' ? 1 : 0) +
        (f.foreign !== 'any' ? 1 : 0)
      );
    case 'education':
      return f.degrees.length + f.schoolRatings.length + (f.gpaMin ? 1 : 0) + f.qualifications.length + t(f.qualText) + t(f.schoolName);
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
  after,
  optional,
  onRequired,
}: Req & {
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
  /** Shown after the buttons on the same line (the school rating glossary). */
  after?: ReactNode;
}) {
  const toggle = (o: string) => onChange({ [field]: toggleIn(value as string[], o) } as Partial<Filters>);
  return (
    <FilterRow label={label} required={reqFor({ optional, onRequired }, ROW_OF[field])}>
      <div className={cx(tiles ? 'flex flex-wrap gap-1.5' : WRAP, !!after && 'items-center')}>
        {options.map((o) =>
          tiles ? (
            <CheckTile key={o} on={value.includes(o)} onClick={() => toggle(o)} label={labels[o]} />
          ) : (
            <Toggle
              key={o}
              on={value.includes(o)}
              onClick={() => toggle(o)}
              title={titles?.[o]}
              size={!withCode && SQUARE.includes(o) ? 'square' : 'md'}
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
        {after}
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
  optional,
  onRequired,
}: Req & {
  label: string;
  field: ChoiceField;
  value: string;
  options: readonly string[];
  labels: Record<string, string>;
  onChange: Patch;
}) {
  return (
    <FilterRow label={label} required={reqFor({ optional, onRequired }, ROW_OF[field])}>
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
  optional,
  onRequired,
}: Req & {
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
      <FilterRow label={t.rowName} required={reqFor({ optional, onRequired }, 'name')}>
        <div className="flex flex-wrap items-end gap-x-2 gap-y-1.5">
          <TextField label={t.lastName} value={last} onChange={(v) => onChange({ lastName: v })} className="w-[84px]" />
          <TextField label={t.firstName} value={first} onChange={(v) => onChange({ firstName: v })} className="w-[84px]" />
          {showGender && (
            <div role="group" aria-labelledby={genderId} className="ml-auto flex items-center gap-2">
              <RequiredBox on={!optional.includes('gender')} name={t.rowGender} onChange={(on) => onRequired('gender', on)} />
              <span id={genderId} className={cx('text-[12.5px] font-semibold', optional.includes('gender') && 'text-muted')}>
                {t.rowGender}
              </span>
              <GenderButtons value={genders} onChange={onChange} />
            </div>
          )}
        </div>
      </FilterRow>
    );
  return (
    <FilterRow label={t.rowName} required={reqFor({ optional, onRequired }, 'name')}>
      <div className="grid grid-cols-2 gap-2">
        <TextField label={t.lastName} value={last} onChange={(v) => onChange({ lastName: v })} />
        <TextField label={t.firstName} value={first} onChange={(v) => onChange({ firstName: v })} />
      </div>
    </FilterRow>
  );
});

const GenderRow = memo(function GenderRow({ value, onChange, optional, onRequired }: Req & { value: FilterGender[]; onChange: Patch }) {
  const { t, lang } = useI18n();
  if (lang === 'ja') return null; // shares the name row in Japanese
  return (
    <FilterRow label={t.rowGender} required={reqFor({ optional, onRequired }, 'gender')}>
      <div className={WRAP}>
        <GenderButtons value={value} onChange={onChange} />
      </div>
    </FilterRow>
  );
});

/** Current company and up to three previous companies (more would not fit the screen). */
const MAX_PREVIOUS = 3;

const CompanyRow = memo(function CompanyRow({
  current,
  previous,
  onChange,
  optional,
  onRequired,
}: Req & { current: string; previous: string[]; onChange: Patch }) {
  const { t } = useI18n();
  const setPrevious = (i: number, v: string) => onChange({ previousCompanies: previous.map((p, j) => (j === i ? v : p)) });
  const removePrevious = (i: number) => onChange({ previousCompanies: previous.filter((_, j) => j !== i) });
  return (
    <FilterRow label={t.rowCompany} required={reqFor({ optional, onRequired }, 'company')}>
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

const AgeRow = memo(function AgeRow({ ageMode, decades, ageMin, ageMax, onChange, optional, onRequired }: AgeFields & Req & { onChange: Patch }) {
  const { t } = useI18n();
  const age = useMemo(() => ({ ageMode, decades, ageMin, ageMax }), [ageMode, decades, ageMin, ageMax]);
  return (
    <FilterRow label={t.rowAge} required={reqFor({ optional, onRequired }, 'age')}>
      <AgeFilter filters={age} onChange={onChange} />
    </FilterRow>
  );
});

// ---------- Gaishi fit: the score first, its parts indented under it ----------

/**
 * The overall Gaishi score (A to D): big letters, with a live hint saying which scores the sub-filters below allow,
 * so the link between the parts and the score is clear.
 */
const GaishiScoreRow = memo(function GaishiScoreRow({
  value,
  englishMin,
  foreign,
  overseas,
  onChange,
  optional,
  onRequired,
}: Req & {
  value: GaishiScore[];
  englishMin: LevelFilter;
  foreign: ForeignFilter;
  overseas: OverseasFilter;
  onChange: Patch;
}) {
  const { t } = useI18n();
  const range = gaishiRange(englishMin, foreign, overseas);
  const allAny = englishMin === 'any' && foreign === 'any' && overseas === 'any';
  const conflict = value.length > 0 && !value.some((s) => range.includes(s));
  const hint = allAny ? t.gaishiHint.any : conflict ? t.gaishiHint.conflict(range) : t.gaishiHint.match(range);
  return (
    // Wider label column by the indent, so the score's letters start on the same line as the parts' controls.
    <div className="[--label-w:calc(var(--label-base)+var(--indent))]">
      <FilterRow label={t.gaishiScore} required={reqFor({ optional, onRequired }, 'gaishi')} firstLine={40}>
        {/* The help sits beside the letters; in the narrow side panel it drops under them. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <div className="flex flex-none gap-2">
            {GAISHI_SCORES.map((s) => (
              <Toggle key={s} size="big" on={value.includes(s)} onClick={() => onChange({ gaishiScores: toggleIn(value, s) })}>
                {s}
              </Toggle>
            ))}
          </div>
          <p className="min-w-[180px] flex-1 text-[11px] leading-snug text-muted">{t.gaishiHelp}</p>
        </div>
        <p aria-live="polite" className={cx('mt-1 text-[11.5px] leading-[14px] font-semibold', conflict ? 'text-accent' : 'text-ink')}>
          {hint}
        </p>
      </FilterRow>
    </div>
  );
});

/** TOEIC box: typing a valid score (10 to 990) sets it at once; an empty box clears it. */
function ToeicBox({ value, onScore }: { value: number | null; onScore: (v: number | null) => void }) {
  const { t } = useI18n();
  // While the box is being edited it shows what was typed; otherwise the current score.
  const [editing, setEditing] = useState<string | null>(null);
  const shown = value === null ? '' : String(value);
  return (
    <input
      type="text"
      inputMode="numeric"
      maxLength={3}
      aria-label={t.toeicLabel}
      placeholder={t.toeicPlaceholder}
      value={editing ?? shown}
      onFocus={() => setEditing(shown)}
      onChange={(e) => {
        const s = e.target.value.replace(/\D/g, '').slice(0, 3);
        setEditing(s);
        if (!s) onScore(null);
        else if (Number(s) >= TOEIC_MIN && Number(s) <= TOEIC_MAX) onScore(Number(s));
      }}
      onBlur={() => setEditing(null)}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      className={cx(
        'tabular h-[var(--ctl-h)] w-[76px] rounded border px-2 text-center text-[16px] outline-none placeholder:font-normal placeholder:text-muted sm:text-[13.5px]',
        'hover:border-accent/50 focus:border-accent',
        value === null ? 'border-line bg-field text-ink' : 'border-pick-line bg-pick font-semibold text-pick-ink',
      )}
    />
  );
}

/**
 * English level (this level or higher), with a TOEIC box beside it: typing a score picks the matching level
 * (Native is never set by TOEIC). Picking another level clears a score that no longer matches it.
 */
const EnglishRow = memo(function EnglishRow({
  level,
  toeic,
  onChange,
  optional,
  onRequired,
}: Req & { level: LevelFilter; toeic: number | null; onChange: Patch }) {
  const { t } = useI18n();
  const pickLevel = (l: LevelFilter) => {
    const next = level === l ? 'any' : l;
    onChange({ englishMin: next, toeic: toeic !== null && next !== 'any' && toeicLevel(toeic) === next ? toeic : null });
  };
  return (
    <FilterRow label={t.englishLevel} required={reqFor({ optional, onRequired }, 'english')}>
      <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
        <div>
          <Segmented label={t.englishLevel} options={LEVELS} value={level === 'any' ? null : level} labels={t.level} onPick={pickLevel} dense />
          <p className={CAPTION}>{t.orHigher}</p>
        </div>
        <div className="flex flex-col items-end">
          <ToeicBox value={toeic} onScore={(v) => onChange(v === null ? { toeic: null, englishMin: 'any' } : { toeic: v, englishMin: toeicLevel(v) })} />
          <p className={cx(CAPTION, toeic !== null && 'font-semibold text-pick-ink')} aria-live="polite">
            {toeic === null ? t.toeicLabel : t.toeicIs(toeic, toeicLevel(toeic))}
          </p>
        </div>
      </div>
    </FilterRow>
  );
});

/**
 * Japanese level (this level or higher), with JLPT N5 to N1 on its right. Picking a JLPT level picks the matching
 * Japanese level and the other way round (N5, N4 Basic; N3 Conversational; N2 Business; N1 Fluent; native speakers
 * have no JLPT).
 */
const JapaneseRow = memo(function JapaneseRow({
  level,
  jlpt,
  onChange,
  optional,
  onRequired,
}: Req & { level: LevelFilter; jlpt: Jlpt | null; onChange: Patch }) {
  const { t } = useI18n();
  const pickLevel = (l: LevelFilter) => {
    const next = level === l ? 'any' : l;
    onChange({ japaneseMin: next, jlpt: jlptForLevel(next, jlpt) });
  };
  const pickJlpt = (n: Jlpt) => onChange(jlpt === n ? { jlpt: null, japaneseMin: 'any' } : { jlpt: n, japaneseMin: JLPT_LEVEL[n] });
  return (
    <FilterRow label={t.japaneseLevel} required={reqFor({ optional, onRequired }, 'japanese')}>
      <div className="flex flex-wrap items-start gap-x-1.5 gap-y-1">
        <div>
          <Segmented label={t.japaneseLevel} options={LEVELS} value={level === 'any' ? null : level} labels={t.level} onPick={pickLevel} dense />
          <p className={CAPTION}>{t.orHigher}</p>
        </div>
        <div className="flex flex-col items-end">
          <Segmented label={t.jlptLabel} options={JLPT_LEVELS} value={jlpt} onPick={pickJlpt} dense />
          <p className={cx(CAPTION, jlpt && 'font-semibold text-pick-ink')} aria-live="polite">
            {jlpt ? t.jlptIs(jlpt, JLPT_LEVEL[jlpt]) : level === 'Native' ? t.jlptNative : t.jlptLabel}
          </p>
        </div>
      </div>
    </FilterRow>
  );
});

// ---------- Education ----------

/** Compact dropdown for the major of one ticked degree. Red when a major is picked. */
function MajorSelect({ degree, value, onPick }: { degree: Degree; value: Major | undefined; onPick: (m: Major | undefined) => void }) {
  const { t } = useI18n();
  return (
    <div className="relative min-w-0">
      <select
        aria-label={t.majorFor(degree)}
        value={value ?? ''}
        onChange={(e) => onPick((e.target.value || undefined) as Major | undefined)}
        className={cx(
          'h-8 max-w-full min-w-[176px] appearance-none rounded border pr-8 pl-3 text-[13px] outline-none [&>option]:bg-field [&>option]:font-normal [&>option]:text-ink',
          value ? PICKED : OFF,
        )}
      >
        <option value="">{t.anyMajor}</option>
        {MAJORS.map((m) => (
          <option key={m} value={m}>
            {t.major[m]}
          </option>
        ))}
      </select>
      <svg viewBox="0 0 12 12" aria-hidden className="pointer-events-none absolute top-1/2 right-2.5 h-3 w-3 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M2.5 4.5 6 8l3.5-3.5" />
      </svg>
    </div>
  );
}

/**
 * One line per degree. Ticking a degree turns it red and shows a Major dropdown on the same line, for that degree
 * only (MBA has none). A candidate matches a ticked degree when they hold it, with the picked major for that degree.
 */
const DegreeRow = memo(function DegreeRow({
  degrees,
  majorFor,
  onChange,
  optional,
  onRequired,
}: Req & { degrees: Degree[]; majorFor: Filters['majorFor']; onChange: Patch }) {
  const { t } = useI18n();
  const toggle = (d: Degree) => {
    if (!degrees.includes(d)) return onChange({ degrees: [...degrees, d] });
    const { [d]: _gone, ...rest } = majorFor;
    onChange({ degrees: degrees.filter((x) => x !== d), majorFor: rest });
  };
  return (
    <FilterRow label={t.degreeLabel} required={reqFor({ optional, onRequired }, 'degree')} firstLine={32}>
      <div className="flex flex-col gap-[3px]">
        {DEGREES.map((d) => {
          const on = degrees.includes(d);
          return (
            <div key={d} className="flex items-center gap-2">
              <Toggle on={on} onClick={() => toggle(d)} size="sm" className="w-24 flex-none">
                {t.degree[d]}
              </Toggle>
              {on && DEGREES_WITH_MAJOR.includes(d) && (
                <MajorSelect degree={d} value={majorFor[d]} onPick={(m) => onChange({ majorFor: { ...majorFor, [d]: m } })} />
              )}
            </div>
          );
        })}
      </div>
    </FilterRow>
  );
});

/** The (i) glossary of school ratings. */
function RatingGlossary() {
  const { t } = useI18n();
  return (
    <InfoPopover label={t.ratingInfo}>
      <p className="text-[14px] font-bold">{t.schoolRatingLabel}</p>
      <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[12.5px] leading-snug">
        {SCHOOL_RATINGS.map((r) => (
          <div key={r} className="contents">
            <dt className="font-bold text-pick-ink">{t.schoolRating[r]}</dt>
            <dd>{t.ratingGlossary[r]}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2.5 border-t border-line pt-2 text-[11.5px] leading-snug font-semibold text-muted">{t.ratingSample}</p>
    </InfoPopover>
  );
}

/** Small box for typing a minimum GPA (0.1 to 4.0). Applies as soon as the number is valid. */
function GpaBox({ value, onCommit }: { value: number | null; onCommit: (v: number | null) => void }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState<string | null>(null);
  const shown = value === null ? '' : value.toFixed(1);
  return (
    <input
      type="text"
      inputMode="decimal"
      maxLength={3}
      aria-label={t.gpaBox}
      placeholder="0.0"
      value={editing ?? shown}
      onFocus={() => setEditing(shown)}
      onChange={(e) => {
        const s = e.target.value.replace(/[^\d.]/g, '').slice(0, 3);
        setEditing(s);
        const v = Number(s);
        if (!s || v === 0) onCommit(null);
        else if (!Number.isNaN(v) && v > 0 && v <= GPA_MAX) onCommit(Math.round(v * 10) / 10);
      }}
      onBlur={() => setEditing(null)}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      className={cx(
        'tabular h-[var(--ctl-h)] w-12 flex-none rounded border text-center text-[16px] outline-none placeholder:font-normal placeholder:text-muted sm:text-[13.5px]',
        'hover:border-accent/50 focus:border-accent',
        value === null ? 'border-line bg-field text-ink' : 'border-pick-line bg-pick font-semibold text-pick-ink',
      )}
    />
  );
}

/** Minimum GPA, normalised to a 4.0 scale: Any, or a slider / box from 0.1 to 4.0 in steps of 0.1. */
const GpaRow = memo(function GpaRow({ value, onChange, optional, onRequired }: Req & { value: number | null; onChange: Patch }) {
  const { t } = useI18n();
  const set = (v: number | null) => onChange({ gpaMin: v });
  return (
    <FilterRow label={t.gpaLabel} required={reqFor({ optional, onRequired }, 'gpa')}>
      <div className="flex items-center gap-3">
        <Toggle on={value === null} onClick={() => set(null)}>
          {t.any}
        </Toggle>
        <input
          type="range"
          min={0}
          max={GPA_MAX}
          step={0.1}
          value={value ?? 0}
          aria-label={t.gpaSlider}
          aria-valuetext={value === null ? t.any : value.toFixed(1)}
          onChange={(e) => {
            const v = Math.round(Number(e.target.value) * 10) / 10;
            set(v > 0 ? v : null);
          }}
          className={cx('h-4 w-full max-w-[150px] min-w-[80px] cursor-pointer', value === null ? 'accent-[var(--muted)]' : 'accent-[var(--accent)]')}
        />
        <GpaBox value={value} onCommit={set} />
        <span className="text-[11.5px] leading-tight text-muted">{t.gpaHelp}</span>
      </div>
    </FilterRow>
  );
});

/** Other qualifications: tick any (joined with OR), or type one that is not listed. */
const QualRow = memo(function QualRow({
  value,
  text,
  onChange,
  optional,
  onRequired,
}: Req & { value: Qualification[]; text: string; onChange: Patch }) {
  const { t } = useI18n();
  return (
    <FilterRow label={t.qualLabel} required={reqFor({ optional, onRequired }, 'qualification')}>
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {QUALIFICATIONS.map((q) => (
          <Chip key={q} on={value.includes(q)} title={t.qualificationFull[q]} onClick={() => onChange({ qualifications: toggleIn(value, q) })}>
            {t.qualification[q]}
          </Chip>
        ))}
        <input
          type="text"
          autoComplete="off"
          value={text}
          aria-label={t.qualOther}
          placeholder={t.qualOtherPlaceholder}
          onChange={(e) => onChange({ qualText: e.target.value })}
          className={cx(
            'h-7 min-w-[96px] flex-1 rounded-full border px-3 text-[16px] outline-none placeholder:text-muted sm:text-[12.5px]',
            'hover:border-accent/50 focus:border-accent',
            text.trim() ? 'border-pick-line bg-pick text-pick-ink' : 'border-line bg-field text-ink',
          )}
        />
      </div>
    </FilterRow>
  );
});

const SchoolRow = memo(function SchoolRow({ value, onChange, optional, onRequired }: Req & { value: string; onChange: Patch }) {
  const { t } = useI18n();
  return (
    <FilterRow label={t.schoolName} required={reqFor({ optional, onRequired }, 'school')}>
      <TextField label={t.schoolName} value={value} onChange={(v) => onChange({ schoolName: v })} hideLabel />
    </FilterRow>
  );
});

/** The rows of one group, shared by both layouts. */
function GroupRows({ group, f, onChange, showGender, onRequired }: { group: SectionKey; f: Filters; onChange: Patch; showGender: boolean; onRequired: Req['onRequired'] }) {
  const { t } = useI18n();
  const req: Req = { optional: f.optional, onRequired };
  // Option labels per language; stable objects so the rows' memo holds.
  const labels = useMemo(() => ({ foreign: t.foreign, overseas: t.overseas }), [t]);
  switch (group) {
    case 'candidate':
      return (
        <>
          <NameRow {...req} last={f.lastName} first={f.firstName} genders={f.genders} showGender={showGender} onChange={onChange} />
          <CompanyRow {...req} current={f.currentCompany} previous={f.previousCompanies} onChange={onChange} />
          <AgeRow {...req} ageMode={f.ageMode} decades={f.decades} ageMin={f.ageMin} ageMax={f.ageMax} onChange={onChange} />
          {showGender && <GenderRow {...req} value={f.genders} onChange={onChange} />}
        </>
      );
    case 'role':
      return (
        <>
          <MultiRow {...req}
            label={t.rowSeniority}
            field="seniority"
            value={f.seniority}
            options={SENIORITIES}
            labels={t.seniorityShort}
            titles={t.seniorityButton}
            onChange={onChange}
            withCode
          />
          <MultiRow {...req} label={t.rowIndustry} field="industries" value={f.industries} options={INDUSTRIES} labels={t.industry} onChange={onChange} tiles />
          <MultiRow {...req} label={t.rowPosition} field="positions" value={f.positions} options={POSITIONS} labels={t.position} onChange={onChange} tiles />
        </>
      );
    case 'gaishi':
      return (
        <>
          <GaishiScoreRow {...req} value={f.gaishiScores} englishMin={f.englishMin} foreign={f.foreign} overseas={f.overseas} onChange={onChange} />
          {/* The score's parts, indented under it with a thin guide line: 7px + 2px line + 15px = --indent (24px). */}
          <div className="ml-[7px] border-l-2 border-line pl-[calc(var(--indent)-9px)]">
            <div className="divide-y divide-line">
              <EnglishRow {...req} level={f.englishMin} toeic={f.toeic} onChange={onChange} />
              <JapaneseRow {...req} level={f.japaneseMin} jlpt={f.jlpt} onChange={onChange} />
              <ChoiceRow {...req} label={t.overseasLabel} field="overseas" value={f.overseas} options={OVERSEAS} labels={labels.overseas} onChange={onChange} />
              <ChoiceRow {...req} label={t.foreignLabel} field="foreign" value={f.foreign} options={FOREIGN} labels={labels.foreign} onChange={onChange} />
            </div>
          </div>
        </>
      );
    case 'education':
      return (
        <>
          <DegreeRow {...req} degrees={f.degrees} majorFor={f.majorFor} onChange={onChange} />
          <MultiRow {...req}
            label={t.schoolRatingLabel}
            field="schoolRatings"
            value={f.schoolRatings}
            options={SCHOOL_RATINGS}
            labels={t.schoolRating}
            onChange={onChange}
            after={<RatingGlossary />}
          />
          <GpaRow {...req} value={f.gpaMin} onChange={onChange} />
          <QualRow {...req} value={f.qualifications} text={f.qualText} onChange={onChange} />
          <SchoolRow {...req} value={f.schoolName} onChange={onChange} />
        </>
      );
  }
}

/**
 * One framed box of the full-screen search: a 20px bold heading with a short coral bar under it and its
 * active-filter count, then the rows. The body fills the box's grid cell (see useFitBoxes).
 */
function Zone({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex min-h-0 min-w-0 flex-col rounded-xl border border-line bg-card shadow-card">
      <h2 id={id} className="flex flex-none items-center gap-2 px-3 pt-2 pb-2 text-[20px] leading-6 font-bold text-ink">
        <span className="relative inline-block after:absolute after:-bottom-[3px] after:left-0 after:h-[3px] after:w-7 after:rounded-full after:bg-accent">
          {title}
        </span>
        <CountBadge n={count} />
      </h2>
      <div data-fit-box className="min-h-0 flex-1 overflow-hidden overscroll-contain">
        <div className="divide-y divide-line px-3 pb-1">{children}</div>
      </div>
    </section>
  );
}

/**
 * The four boxes are exactly the same size (a 2x2 grid with equal tracks), so their content must fit them. When the
 * screen is too short for the tallest box (short laptops, browser zoom, Comfortable density), every box's content is
 * scaled down by the same amount with CSS zoom, never below `min`, so text sizes stay equal across boxes. Below `min`
 * a box scrolls inside, as a last resort.
 * A smaller zoom also gives the content more room across, so it wraps less: the largest zoom that fits is found by
 * measuring (a few halving steps), not predicted from the full-size height.
 */
function useFitBoxes(min: number) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const boxes = [...root.querySelectorAll<HTMLElement>('[data-fit-box]')];
    const inners = boxes.map((b) => b.firstElementChild as HTMLElement);
    const overflows = (k: number) => inners[k].getBoundingClientRect().height > boxes[k].clientHeight + 0.5;
    const fitsAt = (z: number) => {
      for (const i of inners) i.style.zoom = z === 1 ? '' : String(z);
      return boxes.every((_, k) => !overflows(k));
    };
    const fit = () => {
      // Measure without scrollbars (they would narrow the content).
      for (const b of boxes) b.style.overflowY = 'hidden';
      let z = 1;
      if (!fitsAt(1)) {
        let lo = min;
        let hi = 1;
        if (fitsAt(lo)) {
          for (let step = 0; step < 7; step++) {
            const mid = (lo + hi) / 2;
            if (fitsAt(mid)) lo = mid;
            else hi = mid;
          }
        }
        z = Math.floor(lo * 1000) / 1000;
        fitsAt(z);
      }
      boxes.forEach((b, k) => (b.style.overflowY = overflows(k) ? 'auto' : 'hidden'));
    };
    fit();
    // Final sizes only change when the window or the content changes, so this does not loop.
    const ro = new ResizeObserver(fit);
    for (const el of [...boxes, ...inners]) ro.observe(el);
    return () => ro.disconnect();
  }, [min]);
  return ref;
}

function Zones({ children, label }: { children: ReactNode; label: string }) {
  const ref = useFitBoxes(0.72);
  return (
    <div
      ref={ref}
      role="region"
      aria-label={label}
      className="grid grid-cols-1 gap-3 lg:h-full lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]"
    >
      {children}
    </div>
  );
}

/** Tab strip: Candidate | Role | Gaishi fit | Education, each with a badge counting its active filters. Arrow keys move. */
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
 * - "zones": the full-screen search. Four boxes of exactly the same size in a 2x2 grid (Candidate, Role /
 *   Gaishi fit, Education), all visible at once and filling the height beside the saved-searches column.
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
  fitMin = 0.72,
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
  /** Tabs layout: the smallest scale used to fit a short screen (phones keep text larger and scroll instead). */
  fitMin?: number;
}) {
  const { t } = useI18n();
  const [tab, setTab] = useState<SectionKey>('candidate');
  const baseId = useId();
  const idFor = (k: SectionKey, part: 'tab' | 'panel') => `${baseId}-${part}-${k}`;
  const counts: Record<SectionKey, number> = {
    candidate: activeIn('candidate', f, showGender),
    role: activeIn('role', f, showGender),
    gaishi: activeIn('gaishi', f, showGender),
    education: activeIn('education', f, showGender),
  };
  // Untick = nice to have (added to f.optional); tick = required again.
  const onRequired = useCallback(
    (row: RowKey, on: boolean) => onChange({ optional: on ? f.optional.filter((r) => r !== row) : [...f.optional, row] }),
    [f.optional, onChange],
  );
  const zone = (k: SectionKey) => (
    <Zone title={t.sections[k]} count={counts[k]}>
      <GroupRows group={k} f={f} onChange={onChange} showGender={showGender} onRequired={onRequired} />
    </Zone>
  );

  if (layout === 'zones')
    return (
      <Zones label={t.filtersLabel}>
        {zone('candidate')}
        {zone('role')}
        {zone('gaishi')}
        {zone('education')}
      </Zones>
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
      {/* Each group is sized to fit; on short screens it scales down slightly instead of scrolling. */}
      <div role="tabpanel" id={idFor(tab, 'panel')} aria-labelledby={idFor(tab, 'tab')} className="flex min-h-0 flex-1 flex-col">
        <FitToScreen className="flex-1 px-4" min={fitMin}>
          <div className="divide-y divide-line">
            <GroupRows group={tab} f={f} onChange={onChange} showGender={showGender} onRequired={onRequired} />
          </div>
        </FitToScreen>
      </div>
    </div>
  );
});

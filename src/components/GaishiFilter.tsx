import { useI18n } from '../lib/i18n';
import {
  GAISHI_SCORES,
  type Filters,
  type ForeignFilter,
  type LevelFilter,
  type OverseasFilter,
} from '../lib/types';
import { Toggle, ToggleGroup, toggleIn } from './controls';

const FOREIGN: ForeignFilter[] = ['any', 'never', 'once', 'twice'];
const AT_LEAST: LevelFilter[] = ['any', 'Conversational', 'Business', 'Fluent', 'Native'];
const OVERSEAS: OverseasFilter[] = ['any', 'yes', 'no'];

/**
 * Gaishi fit: either pick a score A–D, or set its parts.
 * Tablets: two columns. Laptops/desktops: one tight list with labels beside the buttons.
 */
export function GaishiFilter({ filters, onChange }: { filters: Filters; onChange: (p: Partial<Filters>) => void }) {
  const { t } = useI18n();
  // Clicking the selected option again goes back to "Any".
  const single = <T extends string>(current: T, v: T) => (current === v ? ('any' as T) : v);

  return (
    <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-1 lg:gap-y-1">
      <div>
        <ToggleGroup label={t.gaishiScore}>
          {GAISHI_SCORES.map((g) => (
            <Toggle
              key={g}
              on={filters.gaishiScores.includes(g)}
              onClick={() => onChange({ gaishiScores: toggleIn(filters.gaishiScores, g) })}
              className="w-9 px-0 font-bold lg:w-7 lg:px-0"
            >
              {g}
            </Toggle>
          ))}
        </ToggleGroup>
        <p className="mt-2 text-[12px] leading-snug text-muted lg:mt-0.5 lg:text-[11px]">{t.gaishiHelp}</p>
      </div>
      <ToggleGroup label={t.foreignLabel}>
        {FOREIGN.map((o) => (
          <Toggle key={o} on={filters.foreign === o} onClick={() => onChange({ foreign: single(filters.foreign, o) })}>
            {t.foreign[o]}
          </Toggle>
        ))}
      </ToggleGroup>
      <ToggleGroup label={t.englishAtLeast}>
        {AT_LEAST.map((l) => (
          <Toggle key={l} on={filters.englishMin === l} onClick={() => onChange({ englishMin: single(filters.englishMin, l) })}>
            {l === 'any' ? t.any : t.level[l]}
          </Toggle>
        ))}
      </ToggleGroup>
      <ToggleGroup label={t.japaneseAtLeast}>
        {AT_LEAST.map((l) => (
          <Toggle key={l} on={filters.japaneseMin === l} onClick={() => onChange({ japaneseMin: single(filters.japaneseMin, l) })}>
            {l === 'any' ? t.any : t.level[l]}
          </Toggle>
        ))}
      </ToggleGroup>
      <ToggleGroup label={t.overseasLabel}>
        {OVERSEAS.map((o) => (
          <Toggle key={o} on={filters.overseas === o} onClick={() => onChange({ overseas: single(filters.overseas, o) })}>
            {t.overseas[o]}
          </Toggle>
        ))}
      </ToggleGroup>
    </div>
  );
}

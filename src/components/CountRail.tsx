import { fmtNum, useI18n } from '../lib/i18n';
import { useAnimatedNumber } from '../lib/useAnimatedNumber';

interface Props {
  count: number;
  baseCount: number;
  within: boolean;
  onShow: () => void;
  onSave: () => void;
  onClear: () => void;
}

/** Red count card: coral to a slightly deeper red, soft red shadow. */
const COUNT_CARD = 'bg-[linear-gradient(135deg,var(--accent)_0%,var(--accent-deep)_100%)] shadow-accent';

/** Live count. Desktop: sticky right rail. Phones: fixed bar at the bottom. The number rolls to its new value. */
export function CountRail({ count, baseCount, within, onShow, onSave, onClear }: Props) {
  const { t } = useI18n();
  const shown = useAnimatedNumber(count);
  const of = within ? t.ofCurrent(fmtNum(baseCount)) : t.ofDatabase(fmtNum(baseCount));
  const empty = count === 0;

  return (
    <>
      <aside className="hidden lg:sticky lg:top-6 lg:block">
        <div className={`rounded-xl px-6 pt-4 pb-5 ${COUNT_CARD}`}>
          {/* The rolling number is decorative; screen readers get the final value once. */}
          <div aria-hidden className="tabular text-[56px] leading-none font-bold tracking-[-0.03em] text-white">
            {fmtNum(shown)}
          </div>
          <p className="mt-3 text-[13px] font-bold text-on-accent" aria-live="polite" aria-atomic="true">
            <span className="sr-only">{fmtNum(count)} </span>
            {t.countMatch}
          </p>
          <p className="text-[12px] text-on-accent/85">{of}</p>
        </div>
        <button
          type="button"
          onClick={onShow}
          disabled={empty}
          className="mt-3 h-11 w-full rounded-lg bg-accent text-[14px] font-bold text-on-accent transition-[transform,box-shadow,filter] duration-150 hover:-translate-y-px hover:shadow-accent hover:brightness-105 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {t.showN(count)}
        </button>
        {empty && (
          <p role="status" className="anim-fade-in mt-2 text-[13px] leading-snug">
            {t.zero}
          </p>
        )}
        <button
          type="button"
          onClick={onSave}
          className="mt-2 h-11 w-full rounded-lg border border-line bg-card text-[14px] font-medium transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-px hover:border-ink/45 hover:shadow-control"
        >
          {t.saveSearch}
        </button>
        <button type="button" onClick={onClear} className="mt-3 text-[13px] text-muted underline underline-offset-2 hover:text-ink">
          {t.clearAll}
        </button>
      </aside>

      {/* Phones and tablets: one compact row — live count, Show, Save. "Clear all" sits above the panel. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 px-4 pt-2.5 pb-[max(10px,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
        {empty && (
          <p role="status" className="mb-2 text-[12px] leading-snug">
            {t.zero}
          </p>
        )}
        <div className="flex items-stretch gap-2">
          <div className={`flex min-w-[76px] flex-none flex-col justify-center rounded-lg px-2.5 py-1 ${COUNT_CARD}`}>
            <span aria-hidden className="tabular text-[20px] leading-none font-bold text-white">
              {fmtNum(shown)}
            </span>
            <span className="mt-1 text-[10.5px] leading-none whitespace-nowrap text-on-accent">{t.ofShort(fmtNum(baseCount))}</span>
            <span className="sr-only" aria-live="polite" aria-atomic="true">
              {fmtNum(count)} {t.countMatch} {of}
            </span>
          </div>
          <button
            type="button"
            onClick={onShow}
            disabled={empty}
            className="h-12 min-w-0 flex-1 truncate rounded-lg bg-accent px-2 text-[14px] font-bold text-on-accent disabled:cursor-not-allowed disabled:opacity-45"
          >
            {t.showN(count)}
          </button>
          <button
            type="button"
            onClick={onSave}
            aria-label={t.saveSearch}
            className="h-12 flex-none rounded-lg border border-line bg-card px-3 text-[13px] font-medium"
          >
            {t.save}
          </button>
        </div>
      </div>
    </>
  );
}

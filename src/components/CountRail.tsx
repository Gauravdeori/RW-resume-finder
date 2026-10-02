import { fmtNum, useI18n } from '../lib/i18n';

interface Props {
  count: number;
  baseCount: number;
  within: boolean;
  onShow: () => void;
  onSave: () => void;
  onClear: () => void;
}

/** Live count. Desktop: sticky right rail. Phones: fixed bar at the bottom. */
export function CountRail({ count, baseCount, within, onShow, onSave, onClear }: Props) {
  const { t } = useI18n();
  const of = within ? t.ofCurrent(fmtNum(baseCount)) : t.ofDatabase(fmtNum(baseCount));
  const empty = count === 0;

  return (
    <>
      <aside className="hidden lg:sticky lg:top-6 lg:block lg:pl-5">
        <div className="bg-accent px-5 pt-3 pb-4" aria-live="polite" aria-atomic="true">
          <div className="text-[56px] leading-[1.05] font-extrabold tracking-tight text-white">{fmtNum(count)}</div>
          <div className="mt-2 text-[13px] font-bold text-on-accent">{t.countMatch}</div>
          <div className="text-[12px] text-on-accent">{of}</div>
        </div>
        <button
          type="button"
          onClick={onShow}
          disabled={empty}
          className="mt-3 h-10 w-full bg-accent text-[14px] font-bold text-on-accent hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {t.showN(count)}
        </button>
        {empty && (
          <p role="status" className="mt-2 text-[13px] leading-snug">
            {t.zero}
          </p>
        )}
        <button type="button" onClick={onSave} className="mt-3 h-10 w-full border border-ink text-[14px] hover:bg-sel hover:text-on-sel">
          {t.saveSearch}
        </button>
        <button type="button" onClick={onClear} className="mt-3 text-[13px] underline underline-offset-2">
          {t.clearAll}
        </button>
      </aside>

      {/* Phones and tablets: one compact row — live count, Show, Save. "Clear all" sits above the panel. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card px-4 pt-2.5 pb-[max(10px,env(safe-area-inset-bottom))] lg:hidden">
        {empty && (
          <p role="status" className="mb-2 text-[12px] leading-snug">
            {t.zero}
          </p>
        )}
        <div className="flex items-stretch gap-2">
          <div
            className="flex min-w-[76px] flex-none flex-col justify-center bg-accent px-2.5 py-1"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="text-[20px] leading-none font-extrabold text-white">{fmtNum(count)}</span>
            <span className="mt-1 text-[10.5px] leading-none whitespace-nowrap text-on-accent">{t.ofShort(fmtNum(baseCount))}</span>
            <span className="sr-only">
              {t.countMatch} {of}
            </span>
          </div>
          <button
            type="button"
            onClick={onShow}
            disabled={empty}
            className="h-12 min-w-0 flex-1 truncate bg-accent px-2 text-[14px] font-bold text-on-accent disabled:cursor-not-allowed disabled:opacity-45"
          >
            {t.showN(count)}
          </button>
          <button
            type="button"
            onClick={onSave}
            aria-label={t.saveSearch}
            className="h-12 flex-none border border-ink px-3 text-[13px]"
          >
            {t.save}
          </button>
        </div>
      </div>
    </>
  );
}

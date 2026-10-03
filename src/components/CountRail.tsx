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
      {/* Sizes in em: the rail scales with the filter panel to fill the screen (see useFitToScreen). */}
      <aside className="hidden lg:sticky lg:top-3 lg:block lg:pl-[1.333em]">
        <div className="bg-accent px-[1.333em] pt-[0.667em] pb-[1em]" aria-live="polite" aria-atomic="true">
          <div className="text-[3.833em] leading-[1.05] font-extrabold tracking-tight text-white">{fmtNum(count)}</div>
          <div className="mt-[0.333em] text-[1.083em] font-bold text-on-accent">{t.countMatch}</div>
          <div className="text-[1em] text-on-accent">{of}</div>
        </div>
        <button
          type="button"
          onClick={onShow}
          disabled={empty}
          className="mt-[0.667em] h-[3em] w-full bg-accent text-[1.167em] font-bold text-on-accent hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {t.showN(count)}
        </button>
        {empty && (
          <p role="status" className="mt-[0.667em] text-[1.083em] leading-snug">
            {t.zero}
          </p>
        )}
        <button type="button" onClick={onSave} className="mt-[0.667em] h-[3em] w-full border border-ink text-[1.083em] hover:bg-sel hover:text-on-sel">
          {t.saveSearch}
        </button>
        <button type="button" onClick={onClear} className="mt-[0.667em] text-[1.042em] underline underline-offset-2">
          {t.clearAll}
        </button>
        {/* On laptops the page footer is hidden to keep everything on one screen; the note lives here instead. */}
        <p className="mt-[2em] text-[0.917em] leading-snug text-muted">{t.footer}</p>
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

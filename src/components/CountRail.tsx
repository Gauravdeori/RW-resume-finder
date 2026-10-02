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

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden">
        <div className="flex items-center gap-3" aria-live="polite" aria-atomic="true">
          <div className="bg-accent px-2.5 py-1 text-[22px] leading-tight font-extrabold text-white">{fmtNum(count)}</div>
          <div className="min-w-0 flex-1 text-[12px] leading-tight">
            {empty ? (
              <span>{t.zero}</span>
            ) : (
              <>
                <span className="font-bold">{t.countMatch}</span>
                <br />
                <span className="text-muted">{of}</span>
              </>
            )}
          </div>
          <button type="button" onClick={onClear} className="flex-none text-[12px] underline underline-offset-2">
            {t.clearAll}
          </button>
        </div>
        <div className="mt-2.5 flex gap-2">
          <button
            type="button"
            onClick={onShow}
            disabled={empty}
            className="h-10 flex-1 bg-accent text-[14px] font-bold text-on-accent disabled:cursor-not-allowed disabled:opacity-45"
          >
            {t.showN(count)}
          </button>
          <button type="button" onClick={onSave} className="h-10 flex-none border border-ink px-3 text-[13px]">
            {t.saveSearch}
          </button>
        </div>
      </div>
    </>
  );
}

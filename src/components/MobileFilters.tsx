import { useId, type ReactNode } from 'react';
import { fmtNum, useI18n } from '../lib/i18n';
import { useAnimatedNumber } from '../lib/useAnimatedNumber';
import { Modal } from './Modal';
import { COUNT_CARD } from './ResultsPane';

/** Phones and tablets: sticky bar with the live count and a "Filters (6)" button that opens the sheet. */
export function MobileBar({ count, active, onOpen }: { count: number; active: number; onOpen: () => void }) {
  const { t } = useI18n();
  const shown = useAnimatedNumber(count);
  return (
    <div className="flex flex-none items-center gap-3 border-t border-line bg-card px-4 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.08)] lg:hidden">
      <div className={`flex min-w-[96px] flex-col justify-center rounded-lg px-3 py-1.5 ${COUNT_CARD}`}>
        <span aria-hidden className="tabular text-[20px] leading-none font-bold text-white">
          {fmtNum(shown)}
        </span>
        <span className="mt-1 text-[11px] leading-none text-on-accent">{t.countMatch}</span>
        <span className="sr-only" aria-live="polite" aria-atomic="true">
          {fmtNum(count)} {t.countMatch}
        </span>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="ml-auto flex h-12 items-center gap-2 rounded-lg bg-sel px-5 text-[14px] font-bold text-on-sel"
      >
        <svg viewBox="0 0 16 16" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M2 4h12M4.5 8h7M7 12h2" />
        </svg>
        {t.filtersButton(active)}
      </button>
    </div>
  );
}

/** The filter panel in a bottom sheet, with the live count on its "Show" button. */
export function FilterSheet({
  count,
  onClose,
  onClear,
  action,
  children,
}: {
  count: number;
  onClose: () => void;
  onClear: () => void;
  /** Extra button in the sheet header ("Start from a job description"). */
  action?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const titleId = useId();
  return (
    <Modal labelledBy={titleId} onClose={onClose} placement="bottom" className="h-[96dvh] rounded-t-2xl border-b-0">
      <div className="flex flex-none items-center justify-between border-b border-line px-4 py-3">
        <h2 id={titleId} className="text-[16px] font-bold">
          {t.filtersTitle}
        </h2>
        <div className="mr-2 ml-auto">{action}</div>
        <button type="button" onClick={onClose} aria-label={t.close} className="flex h-9 w-9 items-center justify-center rounded-lg text-[22px] leading-none">
          ×
        </button>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
      <div className="flex flex-none items-center gap-2 border-t border-line px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <button type="button" onClick={onClear} className="h-12 px-2 text-[13px] text-muted underline underline-offset-2">
          {t.clearAll}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="h-12 flex-1 rounded-lg bg-[linear-gradient(135deg,var(--accent),var(--accent-deep))] text-[14px] font-bold text-on-accent"
        >
          {t.showN(count)}
        </button>
      </div>
    </Modal>
  );
}

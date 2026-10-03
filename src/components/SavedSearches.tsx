import { useEffect, useId, useRef, useState } from 'react';
import { savedSummary } from '../lib/describe';
import { useI18n } from '../lib/i18n';
import type { SavedSearch } from '../lib/savedSearches';

/** Top-bar "Saved searches" button with a count badge and a menu to run or delete each one. */
export function SavedSearches({
  list,
  onRun,
  onDelete,
}: {
  list: SavedSearch[];
  onRun: (s: SavedSearch) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrap} className="relative">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t.savedCount(list.length)}
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 items-center gap-2 border border-white/60 px-2.5 text-[12px] text-white hover:border-white sm:px-3"
      >
        <span className="hidden sm:inline">{t.savedSearches}</span>
        <span className="sm:hidden">{t.savedShort}</span>
        <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center bg-accent px-1 text-[11px] font-bold text-white">
          {list.length}
        </span>
      </button>

      {open && (
        <div
          id={menuId}
          className="absolute top-full right-0 z-40 mt-2 w-[min(280px,calc(100vw-32px))] border border-line bg-card text-ink shadow-[0_8px_28px_rgba(0,0,0,0.18)]"
        >
          {list.length === 0 ? (
            <p className="px-3 py-3 text-[12px] text-muted">{t.noSavedSearches}</p>
          ) : (
            <ul>
              {list.map((s) => (
                <li key={s.id} className="flex items-stretch border-b border-line last:border-b-0">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onRun(s);
                    }}
                    className="min-w-0 flex-1 px-3 py-2.5 text-left hover:bg-page"
                  >
                    <span className="block truncate text-[13px] font-bold">{s.name}</span>
                    <span className="block truncate text-[12px] text-muted">{savedSummary(s, t)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(s.id)}
                    aria-label={t.deleteSaved(s.name)}
                    className="w-10 flex-none text-[16px] text-muted hover:text-ink"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

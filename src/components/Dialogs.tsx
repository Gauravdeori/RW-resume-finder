import { useId, type ReactNode } from 'react';
import { savedSummary } from '../lib/describe';
import { useI18n } from '../lib/i18n';
import type { SavedSearch } from '../lib/savedSearches';
import { Modal } from './Modal';

function DialogFrame({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const { t } = useI18n();
  const titleId = useId();
  return (
    <Modal labelledBy={titleId} onClose={onClose} className="max-w-[480px] rounded-xl p-5">
      <h2 id={titleId} className="pr-12 text-[16px] font-bold">
        {title}
      </h2>
      <button
        type="button"
        onClick={onClose}
        aria-label={t.close}
        className="absolute top-3.5 right-3.5 flex h-9 w-9 items-center justify-center rounded-lg border border-line text-[20px] leading-none hover:border-accent/50"
      >
        ×
      </button>
      <div className="mt-3">{children}</div>
    </Modal>
  );
}

/** File > Open saved search (also "Show all" under the saved searches list). */
export function OpenSavedDialog({ saved, onPick, onClose }: { saved: SavedSearch[]; onPick: (s: SavedSearch) => void; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <DialogFrame title={t.openSavedTitle} onClose={onClose}>
      {saved.length === 0 ? (
        <p className="text-[13px] text-muted">{t.noSavedSearches}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
          {saved.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => onPick(s)} className="block w-full px-3 py-2.5 text-left hover:bg-pick/60">
                <span className="block truncate text-[13.5px] font-semibold">{s.name}</span>
                <span className="block truncate text-[12px] text-muted">
                  {savedSummary(s, t)} · {s.createdAt}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </DialogFrame>
  );
}

export type HelpTopic = 'howTo' | 'shortcuts' | 'about';

/** Help menu: how to search, keyboard shortcuts, about this prototype. */
export function HelpDialog({ topic, onClose }: { topic: HelpTopic; onClose: () => void }) {
  const { t } = useI18n();
  const title = topic === 'howTo' ? t.menu.howTo : topic === 'shortcuts' ? t.menu.shortcuts : t.menu.about;
  return (
    <DialogFrame title={title} onClose={onClose}>
      {topic === 'howTo' && (
        <ol className="list-decimal space-y-1.5 pl-5 text-[13px] leading-relaxed">
          {t.help.howTo.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      )}
      {topic === 'shortcuts' && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px]">
          {t.help.shortcuts.map(([keys, what]) => (
            <div key={keys} className="contents">
              <dt>
                <kbd className="rounded border border-line bg-tile px-1.5 py-0.5 font-mono text-[11.5px] whitespace-nowrap">{keys}</kbd>
              </dt>
              <dd>{what}</dd>
            </div>
          ))}
        </dl>
      )}
      {topic === 'about' && <p className="text-[13px] leading-relaxed">{t.footer}</p>}
    </DialogFrame>
  );
}

/** Short confirmation at the bottom of the screen ("Saved …", "Exported …"). Announced to screen readers. */
export function Toast({ message }: { message: string | null }) {
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
      {message && (
        <span className="anim-fade-up rounded-full border border-pick-line bg-pick px-4 py-2 text-[13px] font-semibold text-pick-ink shadow-hover">
          {message}
        </span>
      )}
    </div>
  );
}

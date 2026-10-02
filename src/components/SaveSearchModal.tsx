import { useId, useRef, useState } from 'react';
import { useI18n } from '../lib/i18n';
import { Modal } from './Modal';

/** "Name this search" with a suggested name, Cancel / Save. */
export function SaveSearchModal({
  suggested,
  onCancel,
  onSave,
}: {
  suggested: string;
  onCancel: () => void;
  onSave: (name: string) => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(suggested);
  const titleId = useId();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Modal labelledBy={titleId} onClose={onCancel} initialFocus={inputRef} className="mt-[10vh] max-w-[300px] p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) onSave(name.trim());
        }}
      >
        <h2 id={titleId} className="text-[15px] font-bold">
          {t.nameThisSearch}
        </h2>
        <label htmlFor={inputId} className="mt-4 mb-1.5 block text-[12px] text-muted">
          {t.searchName}
        </label>
        <input
          id={inputId}
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          className="h-10 w-full border border-ink bg-field px-3 text-[16px] text-ink outline-none sm:text-[14px]"
        />
        <div className="mt-4 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="h-9 border border-ink px-4 text-[13px]">
            {t.cancel}
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="h-9 bg-accent px-4 text-[13px] font-bold text-on-accent disabled:cursor-not-allowed disabled:opacity-45"
          >
            {t.save}
          </button>
        </div>
      </form>
    </Modal>
  );
}

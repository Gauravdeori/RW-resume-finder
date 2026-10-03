import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { cx } from './controls';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const PLACEMENT = {
  /** Dialog near the top of the screen. */
  center: { wrap: 'items-start justify-center overflow-y-auto px-3 py-3 sm:px-4 sm:py-[8vh]', panel: 'anim-slide-up' },
  /** Drawer from the right edge (CV preview). */
  right: { wrap: 'items-stretch justify-end', panel: 'anim-slide-left h-full overflow-y-auto' },
  /** Sheet from the bottom edge (filters on phones). */
  bottom: { wrap: 'items-end justify-center', panel: 'anim-sheet-up flex max-h-[92dvh] flex-col' },
} as const;

/**
 * Modal over a dimmed, blurred page: a centred dialog, a right-side drawer or a bottom sheet.
 * Esc closes, focus stays inside, focus returns to the opener.
 * The page behind is not re-rendered or scrolled, so the results keep their scroll position.
 */
export function Modal({
  labelledBy,
  onClose,
  children,
  className,
  initialFocus,
  placement = 'center',
}: {
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  initialFocus?: RefObject<HTMLElement | null>;
  placement?: keyof typeof PLACEMENT;
}) {
  const place = PLACEMENT[placement];
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    (initialFocus?.current ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE) ?? panel.current)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRef.current();
        return;
      }
      if (e.key === 'Tab' && panel.current) {
        const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <div
      className={cx('anim-fade-in fixed inset-0 z-50 flex bg-[color-mix(in_srgb,var(--overlay)_70%,transparent)] backdrop-blur-[6px]', place.wrap)}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={cx('relative w-full border border-line bg-card text-ink shadow-[0_24px_64px_rgba(0,0,0,0.22)] outline-none', place.panel, className)}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

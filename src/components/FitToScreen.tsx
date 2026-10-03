import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { cx } from './controls';

/**
 * Keeps its content on screen without scrolling: when the content is taller than the space available (short
 * laptop screens, browser zoom, Windows display scaling), it is scaled down with CSS zoom just enough to fit,
 * never below `min`. It re-fits when the window or the content changes size.
 *
 * Measured once at full size, then zoomed by available / natural height. A smaller zoom gives the content more
 * room across, so it can only wrap less and get shorter: one measurement always fits, with no back-and-forth.
 * Below `min` the area scrolls as a last resort.
 */
export function FitToScreen({ children, min = 0.72, className }: { children: ReactNode; min?: number; className?: string }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const fit = () => {
      i.style.zoom = '1';
      const natural = i.offsetHeight;
      const avail = o.clientHeight;
      const z = natural > avail && avail > 0 ? Math.max(min, Math.floor((avail / natural) * 1000) / 1000) : 1;
      i.style.zoom = z === 1 ? '' : String(z);
      o.style.overflowY = natural * z > avail + 1 ? 'auto' : 'hidden';
    };
    fit();
    // Final sizes only change when the window or the content changes, so this does not loop.
    const ro = new ResizeObserver(fit);
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, [min]);

  return (
    <div ref={outer} className={cx('min-h-0 overscroll-contain', className)} data-fit>
      <div ref={inner}>{children}</div>
    </div>
  );
}

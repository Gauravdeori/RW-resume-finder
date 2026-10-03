import { memo, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { cx } from './controls';

export type MenuItem =
  | { kind: 'action'; label: string; shortcut?: string; disabled?: boolean; onSelect: () => void }
  | { kind: 'radio'; label: string; checked: boolean; onSelect: () => void }
  | { kind: 'separator' };

export interface Menu {
  label: string;
  items: MenuItem[];
}

/**
 * Slim menu bar under the top bar, like Word: File, Edit, View, Help with dropdown menus.
 * Keyboard: Left/Right move along the bar (and between open menus), Enter/Space/Down open a menu, Up opens it at the
 * last item, Up/Down/Home/End move inside a menu, Esc closes it and returns focus to its title, Tab closes.
 */
export const MenuBar = memo(function MenuBar({ menus, label }: { menus: Menu[]; label: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const [active, setActive] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const titles = useRef<(HTMLButtonElement | null)[]>([]);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const focusOnOpen = useRef<'first' | 'last' | null>(null);

  const enabled = () => items.current.filter((el): el is HTMLButtonElement => !!el && !el.disabled);
  const openMenu = (i: number, focus: 'first' | 'last' | null) => {
    focusOnOpen.current = focus;
    setActive(i);
    setOpen(i);
  };
  const close = (refocus: boolean) => {
    const i = open;
    setOpen(null);
    if (refocus && i !== null) titles.current[i]?.focus();
  };

  useEffect(() => {
    if (open === null) return;
    const list = enabled();
    if (focusOnOpen.current === 'first') list[0]?.focus();
    if (focusOnOpen.current === 'last') list[list.length - 1]?.focus();
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const step = (i: number, d: number) => (i + d + menus.length) % menus.length;

  const onTitleKey = (i: number) => (e: KeyboardEvent) => {
    const go = (to: number) => {
      e.preventDefault();
      if (open !== null) openMenu(to, 'first');
      else {
        setActive(to);
        titles.current[to]?.focus();
      }
    };
    if (e.key === 'ArrowRight') go(step(i, 1));
    else if (e.key === 'ArrowLeft') go(step(i, -1));
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(menus.length - 1);
    else if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openMenu(i, 'first');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      openMenu(i, 'last');
    } else if (e.key === 'Escape') close(true);
  };

  const onMenuKey = (i: number) => (e: KeyboardEvent) => {
    const list = enabled();
    const at = list.indexOf(document.activeElement as HTMLButtonElement);
    const focus = (k: number) => {
      e.preventDefault();
      list[(k + list.length) % list.length]?.focus();
    };
    if (e.key === 'ArrowDown') focus(at + 1);
    else if (e.key === 'ArrowUp') focus(at - 1);
    else if (e.key === 'Home') focus(0);
    else if (e.key === 'End') focus(list.length - 1);
    else if (e.key === 'ArrowRight') {
      e.preventDefault();
      openMenu(step(i, 1), 'first');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      openMenu(step(i, -1), 'first');
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close(true);
    } else if (e.key === 'Tab') setOpen(null);
  };

  items.current = [];
  return (
    <div ref={wrap} role="menubar" aria-label={label} className="flex h-7 flex-none items-center gap-0.5 border-b border-line bg-card px-2 lg:px-4">
      {menus.map((m, i) => (
        <div key={m.label} className="relative">
          <button
            ref={(el) => {
              titles.current[i] = el;
            }}
            type="button"
            role="menuitem"
            aria-haspopup="menu"
            aria-expanded={open === i}
            tabIndex={active === i ? 0 : -1}
            onClick={() => (open === i ? setOpen(null) : openMenu(i, null))}
            onMouseEnter={() => open !== null && open !== i && openMenu(i, null)}
            onKeyDown={onTitleKey(i)}
            className={cx('h-6 rounded px-2.5 text-[12.5px]', open === i ? 'bg-pick font-semibold text-pick-ink' : 'text-ink hover:bg-tile')}
          >
            {m.label}
          </button>
          {open === i && (
            <div
              role="menu"
              aria-label={m.label}
              onKeyDown={onMenuKey(i)}
              className="anim-fade-in absolute top-full left-0 z-40 mt-1 min-w-[240px] rounded-lg border border-line bg-card py-1 shadow-hover"
            >
              {m.items.map((it, k) => {
                if (it.kind === 'separator') return <div key={k} role="separator" className="my-1 h-px bg-line" />;
                const radio = it.kind === 'radio';
                return (
                  <button
                    key={k}
                    ref={(el) => {
                      if (el) items.current.push(el);
                    }}
                    type="button"
                    role={radio ? 'menuitemradio' : 'menuitem'}
                    aria-checked={radio ? it.checked : undefined}
                    tabIndex={-1}
                    disabled={!radio && it.disabled}
                    onClick={() => {
                      setOpen(null);
                      it.onSelect();
                    }}
                    className="flex h-8 w-full items-center gap-2 px-3 text-left text-[12.5px] hover:bg-pick hover:text-pick-ink focus:bg-pick focus:text-pick-ink focus:outline-none disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink"
                  >
                    <span aria-hidden className="w-3.5 flex-none text-accent">
                      {radio && it.checked ? '✓' : ''}
                    </span>
                    <span className="flex-1 whitespace-nowrap">{it.label}</span>
                    {!radio && it.shortcut && <span className="pl-6 text-[11px] whitespace-nowrap text-muted">{it.shortcut}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

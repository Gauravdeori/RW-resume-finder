import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

const KEY = 'resumeFinder.theme';
const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

function readStored(): Theme | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

// One shared store, so the top-bar switch and the View menu always agree.
let chosen: Theme | null = readStored();
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  const mq = darkQuery();
  mq.addEventListener('change', fn);
  return () => {
    listeners.delete(fn);
    mq.removeEventListener('change', fn);
  };
};
const current = (): Theme => chosen ?? (darkQuery().matches ? 'dark' : 'light');

function setTheme(t: Theme) {
  chosen = t;
  document.documentElement.setAttribute('data-theme', t);
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* storage unavailable: the choice lasts for this visit only */
  }
  listeners.forEach((fn) => fn());
}

/**
 * Light / dark theme. Follows the device setting until the recruiter picks one (top-bar switch or View menu);
 * the choice is then remembered and applied as data-theme on <html> (index.html applies it before first paint).
 */
export function useTheme(): [Theme, (t: Theme) => void] {
  return [useSyncExternalStore(subscribe, current), setTheme];
}

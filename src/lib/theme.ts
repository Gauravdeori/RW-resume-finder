import { useEffect, useState } from 'react';

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

/**
 * Light / dark theme. Follows the device setting until the recruiter flips the switch;
 * the choice is then remembered and applied as data-theme on <html> (index.html applies it before first paint).
 */
export function useTheme(): [Theme, (t: Theme) => void] {
  const [chosen, setChosen] = useState<Theme | null>(readStored);
  const [device, setDevice] = useState<Theme>(() => (darkQuery().matches ? 'dark' : 'light'));

  useEffect(() => {
    const mq = darkQuery();
    const onChange = () => setDevice(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (chosen) document.documentElement.setAttribute('data-theme', chosen);
    else document.documentElement.removeAttribute('data-theme');
  }, [chosen]);

  const setTheme = (t: Theme) => {
    setChosen(t);
    try {
      localStorage.setItem(KEY, t);
    } catch {
      /* storage unavailable: the choice lasts for this visit only */
    }
  };

  return [chosen ?? device, setTheme];
}

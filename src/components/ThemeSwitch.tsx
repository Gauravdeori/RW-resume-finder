import { useI18n } from '../lib/i18n';
import { useTheme } from '../lib/theme';
import { cx } from './controls';

const Sun = () => (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
    <circle cx="8" cy="8" r="3" fill="currentColor" />
    <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M8 1.2v1.6M8 13.2v1.6M1.2 8h1.6M13.2 8h1.6M3.2 3.2l1.1 1.1M11.7 11.7l1.1 1.1M3.2 12.8l1.1-1.1M11.7 4.3l1.1-1.1" />
    </g>
  </svg>
);

const Moon = () => (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
    <path d="M13.5 10.2A5.8 5.8 0 0 1 5.8 2.5a5.8 5.8 0 1 0 7.7 7.7Z" fill="currentColor" />
  </svg>
);

/** Light / dark switch for the top bar. Square corners to match the rest of the UI. */
export function ThemeSwitch() {
  const { t } = useI18n();
  const [theme, setTheme] = useTheme();
  const dark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={t.darkMode}
      title={dark ? t.switchToLight : t.switchToDark}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className="relative flex h-8 w-[52px] flex-none items-center border border-white/60 hover:border-white"
    >
      <span aria-hidden className="flex w-full justify-between px-[7px] text-white/55">
        <Sun />
        <Moon />
      </span>
      <span
        aria-hidden
        className={cx(
          'absolute top-[3px] flex h-6 w-6 items-center justify-center bg-white text-[#222] transition-[left] duration-150',
          dark ? 'left-[23px]' : 'left-[3px]',
        )}
      >
        {dark ? <Moon /> : <Sun />}
      </span>
    </button>
  );
}

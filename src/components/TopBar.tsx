import { useI18n, type Lang } from '../lib/i18n';
import type { SavedSearch } from '../lib/savedSearches';
import { cx } from './controls';
import { SavedSearches } from './SavedSearches';
import { ThemeSwitch } from './ThemeSwitch';

const LANGS: { id: Lang; label: string }[] = [
  { id: 'en', label: 'EN' },
  { id: 'ja', label: '日本語' },
];

export function TopBar({
  saved,
  onRunSaved,
  onDeleteSaved,
  onSearchNav,
}: {
  saved: SavedSearch[];
  onRunSaved: (s: SavedSearch) => void;
  onDeleteSaved: (id: string) => void;
  onSearchNav: () => void;
}) {
  const { t, lang, setLang } = useI18n();
  const links = [
    { key: 'upload', label: t.nav.upload },
    { key: 'dashboard', label: t.nav.dashboard },
    { key: 'search', label: t.nav.search },
    { key: 'admin', label: t.nav.admin },
  ];

  return (
    <header className="border-b border-topbar-border bg-topbar text-white">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-4 px-4 md:px-8 lg:gap-7">
        <div className="flex flex-none items-center">
          <span aria-label={t.brandLabel} className="text-[12px] leading-[1.05] font-extrabold tracking-tight">
            <span aria-hidden className="block">{t.brandTop}</span>
            <span aria-hidden className="block">{t.brandBottom}</span>
          </span>
          <span aria-hidden className="mx-3 hidden h-5 w-px bg-white/35 sm:block" />
          <span className="hidden text-[12px] sm:inline">{t.appName}</span>
        </div>

        <nav aria-label={t.mainNav} className="hidden md:block">
          <ul className="flex items-center gap-6 text-[12px]">
            {links.map((l) => {
              const active = l.key === 'search';
              return (
                <li key={l.key}>
                  <a
                    href="#"
                    aria-current={active ? 'page' : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      if (active) onSearchNav();
                    }}
                    className={cx(
                      'relative inline-block py-1',
                      active ? 'text-white after:absolute after:inset-x-0 after:-bottom-1 after:h-[2px] after:bg-accent' : 'text-white/75 hover:text-white',
                    )}
                  >
                    {l.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <ThemeSwitch />
          <div role="group" aria-label={t.language} className="flex border border-white/60">
            {LANGS.map((l) => (
              <button
                key={l.id}
                type="button"
                lang={l.id}
                aria-pressed={lang === l.id}
                onClick={() => setLang(l.id)}
                className={cx('h-[30px] px-2 text-[12px]', lang === l.id ? 'bg-white text-[#222]' : 'text-white hover:bg-white/10')}
              >
                {l.label}
              </button>
            ))}
          </div>
          <SavedSearches list={saved} onRun={onRunSaved} onDelete={onDeleteSaved} />
        </div>
      </div>
    </header>
  );
}

import { useI18n, type Lang } from '../lib/i18n';
import { hrefFor, type Route } from '../lib/route';
import type { SavedSearch } from '../lib/savedSearches';
import { cx } from './controls';
import { SavedSearches } from './SavedSearches';
import { ThemeSwitch } from './ThemeSwitch';

const LANGS: { id: Lang; label: string }[] = [
  { id: 'en', label: 'EN' },
  { id: 'ja', label: '日本語' },
];

export function TopBar({
  route,
  saved,
  onRunSaved,
  onDeleteSaved,
}: {
  route: Route;
  saved: SavedSearch[];
  onRunSaved: (s: SavedSearch) => void;
  onDeleteSaved: (id: string) => void;
}) {
  const { t, lang, setLang } = useI18n();
  // Candidate search lives under the product name, Resume Finder, first in the menu.
  const links: { key: Route; label: string }[] = [
    { key: 'search', label: t.nav.search },
    { key: 'upload', label: t.nav.upload },
    { key: 'dashboard', label: t.nav.dashboard },
    { key: 'admin', label: t.nav.admin },
  ];
  const link = (key: Route, label: string, className: (active: boolean) => string) => {
    const active = key === route;
    return (
      <a href={hrefFor(key)} aria-current={active ? 'page' : undefined} className={className(active)}>
        {label}
      </a>
    );
  };

  return (
    <header className="border-b border-topbar-border bg-topbar text-white">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-4 px-4 md:px-8 lg:gap-7">
        <a
          href={hrefFor('search')}
          aria-label={t.homeLabel}
          onClick={() => {
            // Already on Resume Finder: take the recruiter back to the top of the page.
            if (route === 'search') window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex flex-none items-center"
        >
          <span aria-hidden className="text-[12px] leading-[1.05] font-extrabold tracking-tight">
            <span className="block">{t.brandTop}</span>
            <span className="block">{t.brandBottom}</span>
          </span>
        </a>
        <span aria-hidden className="-mx-1 hidden h-5 w-px bg-white/35 md:block lg:-mx-2" />

        <nav aria-label={t.mainNav} className="hidden md:block">
          <ul className="flex items-center gap-6 text-[12px]">
            {links.map((l) => (
              <li key={l.key}>
                {link(l.key, l.label, (active) =>
                  cx(
                    'relative inline-block py-1',
                    active ? 'text-white after:absolute after:inset-x-0 after:-bottom-1 after:h-[2px] after:bg-accent' : 'text-white/75 hover:text-white',
                  ),
                )}
              </li>
            ))}
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
      <nav aria-label={t.mainNav} className="border-t border-white/10 md:hidden">
        <ul className="flex px-1 text-[12.5px]">
          {links.map((l) => (
            <li key={l.key} className="min-w-0 flex-1">
              {link(l.key, t.navShort[l.key], (active) =>
                cx(
                  'relative flex h-11 items-center justify-center px-1 whitespace-nowrap',
                  active ? 'font-semibold text-white after:absolute after:inset-x-2 after:bottom-0 after:h-[2px] after:bg-accent' : 'text-white/70',
                ),
              )}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

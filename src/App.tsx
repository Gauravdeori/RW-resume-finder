import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { HelpDialog, OpenSavedDialog, Toast, type HelpTopic } from './components/Dialogs';
import { FilterPanel } from './components/FilterPanel';
import { FitToScreen } from './components/FitToScreen';
import { JdButton } from './components/JdButton';
import { MenuBar, type Menu } from './components/MenuBar';
import { FilterSheet, MobileBar } from './components/MobileFilters';
import { ResultsPane } from './components/ResultsPane';
import { SaveSearchModal } from './components/SaveSearchModal';
import { SearchSide } from './components/SearchSide';
import { TopBar } from './components/TopBar';
import { Trail, type TrailItem } from './components/Trail';
import type { UploadSettings } from './components/UploadPage';
import { DEFAULT_SETTINGS, loadSettings, storeSettings, type AppSettings } from './lib/admin';
import { KEEP_LAST, clearStoredConversions, loadConversions, newConversion, storeConversions, type Conversion } from './lib/conversions';
import { CANDIDATES } from './lib/data';
import { activeChips, countActiveFilters, suggestName } from './lib/describe';
import { chainSteps, preferenceScores, runFilter, sortResults, type SortKey } from './lib/filter';
import { fmtNum, useI18n } from './lib/i18n';
import { addRecent, loadRecent, storeRecent, type RecentSearch } from './lib/recentSearches';
import { useHashRoute } from './lib/route';
import { clearStoredSaved, loadSaved, newSavedId, storeSaved, type SavedSearch } from './lib/savedSearches';
import { useTheme } from './lib/theme';
import { cloneFilters, emptyFilters, type Candidate, type Filters } from './lib/types';
import { encodeFilters, readSearchState, writeSearchState } from './lib/urlState';
import { useMediaQuery } from './lib/useMediaQuery';
import { loadView, storeView, type ViewPrefs } from './lib/viewPrefs';

// Loaded on demand: the CV drawer when a CV is first opened, the other pages when first visited.
const CvDrawer = lazy(() => import('./components/CvDrawer'));
const UploadPage = lazy(() => import('./components/UploadPage').then((m) => ({ default: m.UploadPage })));
const DashboardPage = lazy(() => import('./components/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const AdminPage = lazy(() => import('./components/AdminPage').then((m) => ({ default: m.AdminPage })));

const TEXT_DEBOUNCE_MS = 250;
const DESKTOP = '(min-width: 1024px)';
/** Typing in one box (or dragging the age slider) within this time counts as one change for "Undo last filter". */
const UNDO_MERGE_MS = 1500;
const UNDO_KEEP = 50;
const TEXT_FIELDS = ['lastName', 'firstName', 'currentCompany', 'previousCompanies', 'schoolName'];

type TextPart = Pick<Filters, 'lastName' | 'firstName' | 'currentCompany' | 'previousCompanies' | 'schoolName'>;
const textOf = (f: Filters): string =>
  JSON.stringify([f.lastName, f.firstName, f.currentCompany, f.previousCompanies, f.schoolName]);
const withText = (f: Filters, key: string): Filters => {
  const [lastName, firstName, currentCompany, previousCompanies, schoolName] = JSON.parse(key) as [
    string,
    string,
    string,
    string[],
    string,
  ];
  const text: TextPart = { lastName, firstName, currentCompany, previousCompanies, schoolName };
  return { ...f, ...text };
};

/**
 * Clicks apply at once; typing applies ~250 ms after the last key press.
 * When the whole draft is replaced (new step, trail jump, clear, chip, JD fill) `version` changes and text applies at once.
 */
function useLiveFilters(f: Filters, version: number): Filters {
  const key = textOf(f);
  const [settled, setSettled] = useState({ key, version });
  useEffect(() => {
    if (settled.version !== version) {
      setSettled({ key, version });
      return;
    }
    if (settled.key === key) return;
    const id = setTimeout(() => setSettled({ key, version }), TEXT_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [key, version, settled.key, settled.version]);
  const effectiveKey = settled.version !== version ? key : settled.key;
  return useMemo(() => withText(f, effectiveKey), [f, effectiveKey]);
}

const initial = readSearchState();

export default function App() {
  const { t } = useI18n();
  // Upload Resume, Dashboard and Admin are separate pages; Resume Finder itself is one page.
  const [route, go] = useHashRoute();
  const desktop = useMediaQuery(DESKTOP);
  const [theme, setTheme] = useTheme();

  // Dummy Resume Studio conversions, newest first, trimmed to the last KEEP_LAST.
  const [conversions, setConversions] = useState<Conversion[]>(loadConversions);
  useEffect(() => storeConversions(conversions), [conversions]);

  const addConversion = useCallback((file: { name: string; size: number }, settings: UploadSettings) => {
    setConversions((list) => [newConversion(list, file, settings), ...list].slice(0, KEEP_LAST));
    // Same rule as newConversion: cross-language conversions wait for review.
    return { status: settings.source === settings.target ? ('exported' as const) : ('review' as const) };
  }, []);

  // Search within results: each locked step keeps its own filters; the draft is the step being edited now.
  // A step's result is its filters applied to the previous step's result. State starts from the URL.
  const [steps, setSteps] = useState<Filters[]>(initial.steps);
  const [draft, setDraft] = useState<Filters>(initial.draft);
  const [draftVersion, setDraftVersion] = useState(0);
  const [sort, setSort] = useState<SortKey>(initial.sort);
  /** First step: full-screen search with every filter. After "Show candidates": split view with results. */
  const [screen, setScreen] = useState(initial.screen);
  const [cv, setCv] = useState<Candidate | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saveDialog, setSaveDialog] = useState<null | { steps: Filters[]; suggested: string }>(null);
  const [openSavedDialog, setOpenSavedDialog] = useState(false);
  const [help, setHelp] = useState<HelpTopic | null>(null);
  const [saved, setSaved] = useState<SavedSearch[]>(loadSaved);
  useEffect(() => storeSaved(saved), [saved]);
  /** The saved search that is loaded now: File > Save updates it. */
  const [currentSavedId, setCurrentSavedId] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentSearch[]>(loadRecent);
  useEffect(() => storeRecent(recent), [recent]);
  const [view, setView] = useState<ViewPrefs>(loadView);
  useEffect(() => storeView(view), [view]);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const notify = useCallback((message: string) => {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // Admin settings that change the search.
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  useEffect(() => storeSettings(settings), [settings]);
  /** With the gender filter switched off in Admin, any gender choice is ignored, including in saved searches. */
  const applySettings = useCallback(
    (f: Filters): Filters => (settings.showGender || !f.genders.length ? f : { ...f, genders: [] }),
    [settings.showGender],
  );

  // ---------- results: pure functions over precomputed indexes, memoised on steps + filters + sort ----------

  const stepResults = useMemo(() => chainSteps(steps.map(applySettings)), [steps, applySettings]);
  const base = stepResults[stepResults.length - 1];
  const liveDraft = useLiveFilters(draft, draftVersion);
  const results = useMemo(() => runFilter(base, applySettings(liveDraft)), [base, liveDraft, applySettings]);
  // Nice-to-have filters (Required box unticked) leave everyone in and rank matches first under Best CVs.
  const prefs = useMemo(() => preferenceScores(results, [...steps, liveDraft].map(applySettings)), [results, steps, liveDraft, applySettings]);
  const sorted = useMemo(() => sortResults(results, sort, prefs), [results, sort, prefs]);
  const onResults = screen === 'results' || steps.length > 0;

  // Keep the URL in step (replaceState: no reloads, no history entries), so a search can be shared or refreshed.
  useEffect(
    () => writeSearchState({ steps, draft: liveDraft, sort, screen: onResults ? 'results' : 'search' }),
    [steps, liveDraft, sort, onResults],
  );

  // ---------- actions (stable, so the memoised panels and results skip re-rendering) ----------

  // Handlers read the latest state from a ref, so typing does not give them a new identity.
  const latest = useRef({ draft, steps, sorted });
  useLayoutEffect(() => {
    latest.current = { draft, steps, sorted };
  });

  // Undo last filter: earlier versions of the current step's filters.
  const history = useRef<Filters[]>([]);
  const lastMerge = useRef<{ key: string; at: number } | null>(null);
  const [undoCount, setUndoCount] = useState(0);
  const remember = useCallback((mergeKey?: string) => {
    const now = Date.now();
    if (mergeKey && lastMerge.current?.key === mergeKey && now - lastMerge.current.at < UNDO_MERGE_MS) {
      lastMerge.current.at = now;
      return;
    }
    lastMerge.current = mergeKey ? { key: mergeKey, at: now } : null;
    history.current = [...history.current.slice(1 - UNDO_KEEP), latest.current.draft];
    setUndoCount(history.current.length);
  }, []);
  const forgetHistory = useCallback(() => {
    history.current = [];
    lastMerge.current = null;
    setUndoCount(0);
  }, []);

  const replaceDraft = useCallback(
    (f: Filters, record = true) => {
      if (record) remember();
      setDraft(f);
      setDraftVersion((v) => v + 1);
    },
    [remember],
  );
  const patchDraft = useCallback(
    (p: Partial<Filters>) => {
      const keys = Object.keys(p);
      const merge =
        keys.length === 1 && TEXT_FIELDS.includes(keys[0]) ? keys[0] : p.ageMode === 'range' ? 'age-range' : undefined;
      remember(merge);
      setDraft((d) => ({ ...d, ...p }));
    },
    [remember],
  );
  const fillDraft = useCallback(
    (p: Partial<Filters>) => {
      remember();
      setDraft((d) => ({ ...d, ...p }));
      setDraftVersion((v) => v + 1);
    },
    [remember],
  );
  const clearDraft = useCallback(() => replaceDraft(emptyFilters()), [replaceDraft]);
  const undo = useCallback(() => {
    const prev = history.current.pop();
    if (!prev) return;
    lastMerge.current = null;
    setUndoCount(history.current.length);
    setDraft(prev);
    setDraftVersion((v) => v + 1);
  }, []);
  const removeChip = useCallback(
    (id: string) => {
      remember();
      setDraft((d) => activeChips(d, t).find((c) => c.id === id)?.remove(d) ?? d);
      setDraftVersion((v) => v + 1);
    },
    [t, remember],
  );

  /** Full-screen search > "Show candidates": the split view with results. */
  const showResults = useCallback(() => {
    setRecent((list) => addRecent(list, [latest.current.draft]));
    setScreen('results');
  }, []);

  /** Lock the current results as a step in the trail and start the next step with an empty panel. */
  const searchWithin = useCallback(() => {
    const { steps, draft } = latest.current;
    setRecent((list) => addRecent(list, [...steps, draft]));
    setSteps([...steps, cloneFilters(draft)]);
    replaceDraft(emptyFilters(), false);
    forgetHistory();
  }, [replaceDraft, forgetHistory]);

  const newSearch = useCallback(() => {
    setSteps([]);
    replaceDraft(emptyFilters(), false);
    forgetHistory();
    setCurrentSavedId(null);
    setScreen('search');
  }, [replaceDraft, forgetHistory]);

  /** Go back to locked step k (k = -1 is "All candidates": a new full-screen search). Later steps go. */
  const jumpTo = useCallback(
    (k: number) => {
      if (k < 0) return newSearch();
      const { steps } = latest.current;
      replaceDraft(cloneFilters(steps[k]), false);
      forgetHistory();
      setSteps(steps.slice(0, k));
    },
    [replaceDraft, forgetHistory, newSearch],
  );

  /** Load a saved or recent search into the filters at once. One step: full-screen search; more: split view. */
  const loadSearch = useCallback(
    (list: Filters[], savedId?: string) => {
      go('search');
      const copy = list.map(cloneFilters);
      setSteps(copy.slice(0, -1));
      replaceDraft(copy[copy.length - 1] ?? emptyFilters(), false);
      forgetHistory();
      setCurrentSavedId(savedId ?? null);
      setScreen(copy.length > 1 ? 'results' : 'search');
    },
    [go, replaceDraft, forgetHistory],
  );
  const runSaved = useCallback((s: SavedSearch) => loadSearch(s.steps, s.id), [loadSearch]);

  /** The steps a save keeps: the locked steps plus the current one (unless it is empty after locked steps). */
  const stepsToSave = () => {
    const { draft, steps } = latest.current;
    return (steps.length && !encodeFilters(draft) ? steps : [...steps, draft]).map(cloneFilters);
  };
  const saveAs = useCallback(() => {
    const list = stepsToSave();
    setSaveDialog({ steps: list, suggested: suggestName(list, t) });
  }, [t]);
  /** File > Save: updates the loaded saved search; otherwise asks for a name (Save as). */
  const save = useCallback(() => {
    const current = saved.find((s) => s.id === currentSavedId);
    if (!current) return saveAs();
    const list = stepsToSave();
    setSaved((all) => all.map((s) => (s.id === current.id ? { ...s, steps: list } : s)));
    notify(t.toastSaved(current.name));
  }, [saved, currentSavedId, saveAs, notify, t]);

  const confirmSave = (name: string) => {
    if (!saveDialog) return;
    const entry: SavedSearch = { id: newSavedId(), name, steps: saveDialog.steps, createdAt: new Date().toISOString().slice(0, 10) };
    setSaved((list) => [entry, ...list]);
    setCurrentSavedId(entry.id);
    setSaveDialog(null);
    notify(t.toastSaved(name));
  };

  const exportResults = useCallback(async () => {
    const rows = latest.current.sorted;
    const { downloadCsv } = await import('./lib/exportCsv');
    downloadCsv(rows, t);
    notify(t.toastExported(rows.length));
  }, [t, notify]);

  const onSort = useCallback((s: SortKey) => setSort(s), []);
  const closeCv = useCallback(() => setCv(null), []);
  const deleteSaved = useCallback((id: string) => setSaved((list) => list.filter((s) => s.id !== id)), []);
  const backToAllFilters = useCallback(() => setScreen('search'), []);

  // Ctrl+Z: undo the last filter (not while typing in a box, which has its own undo). Ctrl+S: save.
  useEffect(() => {
    if (route !== 'search') return;
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const k = e.key.toLowerCase();
      const typing = (e.target as HTMLElement).closest?.('input, textarea');
      if (k === 'z' && !e.shiftKey && !typing) {
        e.preventDefault();
        undo();
      } else if (k === 's') {
        e.preventDefault();
        save();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [route, undo, save]);

  // ---------- menu bar ----------

  const menus: Menu[] = useMemo(
    () => [
      {
        label: t.menu.file,
        items: [
          { kind: 'action', label: t.menu.newSearch, onSelect: newSearch },
          { kind: 'action', label: t.menu.openSaved, onSelect: () => setOpenSavedDialog(true) },
          { kind: 'separator' },
          { kind: 'action', label: t.menu.save, shortcut: 'Ctrl+S', onSelect: save },
          { kind: 'action', label: t.menu.saveAs, onSelect: saveAs },
          { kind: 'separator' },
          { kind: 'action', label: t.menu.exportCsv, onSelect: exportResults },
        ],
      },
      {
        label: t.menu.edit,
        items: [
          { kind: 'action', label: t.menu.clearAll, onSelect: clearDraft },
          { kind: 'action', label: t.menu.undo, shortcut: 'Ctrl+Z', disabled: undoCount === 0, onSelect: undo },
        ],
      },
      {
        label: t.menu.view,
        items: [
          { kind: 'radio', label: t.menu.light, checked: theme === 'light', onSelect: () => setTheme('light') },
          { kind: 'radio', label: t.menu.dark, checked: theme === 'dark', onSelect: () => setTheme('dark') },
          { kind: 'separator' },
          { kind: 'radio', label: t.menu.compact, checked: view.density === 'compact', onSelect: () => setView((v) => ({ ...v, density: 'compact' })) },
          { kind: 'radio', label: t.menu.comfortable, checked: view.density === 'comfortable', onSelect: () => setView((v) => ({ ...v, density: 'comfortable' })) },
          { kind: 'separator' },
          { kind: 'radio', label: t.menu.oneCol, checked: view.results === 'list', onSelect: () => setView((v) => ({ ...v, results: 'list' })) },
          { kind: 'radio', label: t.menu.threeCol, checked: view.results === 'grid', onSelect: () => setView((v) => ({ ...v, results: 'grid' })) },
        ],
      },
      {
        label: t.menu.help,
        items: [
          { kind: 'action', label: t.menu.howTo, onSelect: () => setHelp('howTo') },
          { kind: 'action', label: t.menu.shortcuts, onSelect: () => setHelp('shortcuts') },
          { kind: 'separator' },
          { kind: 'action', label: t.menu.about, onSelect: () => setHelp('about') },
        ],
      },
    ],
    [t, newSearch, save, saveAs, exportResults, clearDraft, undo, undoCount, theme, setTheme, view],
  );

  // ---------- trail: All candidates › Search 1 › Search 2 (current) ----------

  const trail = useMemo(() => {
    const items: TrailItem[] = [{ label: t.allCandidates, count: CANDIDATES.length, current: false, onClick: () => jumpTo(-1) }];
    // The trail keeps to one line: with many steps, the middle ones fold into "…".
    steps.forEach((_, i) => {
      if (steps.length > 3 && i < steps.length - 2) {
        if (i === 0) items.push({ label: '…', current: false });
        return;
      }
      items.push({ label: t.searchN(i + 1), count: stepResults[i + 1].length, current: false, onClick: () => jumpTo(i) });
    });
    items.push({ label: t.searchN(steps.length + 1), count: results.length, current: true });
    return <Trail items={items} />;
  }, [t, steps, stepResults, results.length, jumpTo]);

  const ofLine = steps.length ? t.ofInSearch(fmtNum(base.length), steps.length) : t.ofDatabase(fmtNum(CANDIDATES.length));
  const resultKey = `${steps.length}|${encodeFilters(liveDraft)}|${sort}`;
  const canSearchWithin = encodeFilters(draft) !== '' && results.length > 0;

  if (route !== 'search') {
    return (
      <div className="studio-bg flex min-h-screen flex-col text-ink">
        <TopBar route={route} saved={saved} onRunSaved={runSaved} onDeleteSaved={deleteSaved} />
        <main className="mx-auto w-full max-w-[1300px] flex-1 px-4 pt-5 pb-12 sm:pt-8 md:px-8">
          <Suspense fallback={<div className="skeleton h-64" />}>
            {route === 'admin' ? (
              <AdminPage
                settings={settings}
                onSettings={(p) => setSettings((s) => ({ ...s, ...p }))}
                conversionsCount={conversions.length}
                onResetOthers={() => {
                  clearStoredSaved();
                  clearStoredConversions();
                  setSaved(loadSaved());
                  setConversions(loadConversions());
                  setSettings(DEFAULT_SETTINGS);
                }}
              />
            ) : route === 'upload' ? (
              <UploadPage onConverted={addConversion} onOpenDashboard={() => go('dashboard')} />
            ) : (
              <DashboardPage
                list={conversions}
                onDelete={(id) => setConversions((list) => list.filter((c) => c.id !== id))}
                onRestore={(c) => setConversions((list) => [...list, c].sort((a, b) => b.id - a.id).slice(0, KEEP_LAST))}
                onUpload={() => go('upload')}
              />
            )}
          </Suspense>
        </main>
        <footer className="mx-auto w-full max-w-[1300px] px-4 pt-2 pb-8 text-[12px] text-muted md:px-8">{t.footer}</footer>
      </div>
    );
  }

  const zones = (
    <FilterPanel
      layout="zones"
      filters={draft}
      onChange={patchDraft}
      onJdFill={fillDraft}
      showGender={settings.showGender}
      showJdFill={false}
    />
  );

  // Resume Finder: one screen, no page scrolling. First the full-screen search; then the split view with results.
  return (
    <div data-density={view.density} className="one-screen flex h-dvh flex-col overflow-hidden bg-page text-ink">
      <TopBar route={route} saved={saved} onRunSaved={runSaved} onDeleteSaved={deleteSaved} />
      <MenuBar menus={menus} label={t.menu.label} />

      {!onResults ? (
        desktop ? (
          <main className="flex min-h-0 flex-1 gap-4 px-4 py-2.5 lg:px-5">
            <aside aria-label={t.filtersLabel} className="w-[260px] flex-none">
              <SearchSide
                count={results.length}
                ofLine={ofLine}
                note={prefs ? t.niceRanked(prefs.total) : undefined}
                saved={saved}
                recent={recent}
                showJdFill={settings.showJdFill}
                onShow={showResults}
                onSave={saveAs}
                onClear={clearDraft}
                onJdFill={fillDraft}
                onLoad={loadSearch}
                onShowAllSaved={() => setOpenSavedDialog(true)}
              />
            </aside>
            {/* Fits at 1440x900 as is; on shorter screens it scales down slightly to fit instead of scrolling. */}
            <FitToScreen className="min-w-0 flex-1">{zones}</FitToScreen>
          </main>
        ) : (
          <>
            <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
              <h1 className="mb-3 text-[20px] font-bold">{t.pageTitle}</h1>
              {settings.showJdFill && (
                <div className="mb-3">
                  <JdButton onFill={fillDraft} />
                </div>
              )}
              {zones}
            </main>
            <MobileBar count={results.length} active={countActiveFilters(draft, t)} onOpen={showResults} label={t.showCandidates} />
          </>
        )
      ) : (
        <>
          <main className="flex min-h-0 flex-1 gap-5 px-4 pt-3 pb-2 lg:px-5 lg:pt-3 lg:pb-3">
            {desktop ? (
              <aside aria-label={t.filtersLabel} className="w-[420px] flex-none overflow-hidden rounded-xl border border-line bg-card shadow-card 2xl:w-[460px]">
                <h1 className="sr-only">{t.pageTitle}</h1>
                <FilterPanel
                  heading={false}
                  filters={draft}
                  onChange={patchDraft}
                  onJdFill={fillDraft}
                  showGender={settings.showGender}
                  showJdFill={settings.showJdFill}
                  onAllFilters={steps.length ? undefined : backToAllFilters}
                />
              </aside>
            ) : (
              <h1 className="sr-only">{t.pageTitle}</h1>
            )}
            <div className="min-w-0 flex-1">
              <ResultsPane
                results={sorted}
                resultKey={resultKey}
                ofLine={ofLine}
                trail={trail}
                filters={liveDraft}
                sort={sort}
                canSearchWithin={canSearchWithin}
                onRemoveChip={removeChip}
                onSort={onSort}
                onSearchWithin={searchWithin}
                onSave={saveAs}
                onClear={clearDraft}
                onOpenCv={setCv}
                view={desktop ? view.results : 'list'}
                density={view.density}
                prefs={prefs}
              />
            </div>
          </main>
          {!desktop && <MobileBar count={results.length} active={countActiveFilters(draft, t)} onOpen={() => setSheetOpen(true)} />}
          {!desktop && sheetOpen && (
            <FilterSheet
              count={results.length}
              onClose={() => setSheetOpen(false)}
              onClear={clearDraft}
              action={settings.showJdFill ? <JdButton onFill={fillDraft} /> : null}
            >
              <FilterPanel filters={draft} onChange={patchDraft} onJdFill={fillDraft} showGender={settings.showGender} showJdFill={false} heading={false} fitMin={0.9} />
            </FilterSheet>
          )}
        </>
      )}

      {cv && (
        <Suspense fallback={null}>
          <CvDrawer c={cv} onClose={closeCv} />
        </Suspense>
      )}
      {saveDialog && <SaveSearchModal suggested={saveDialog.suggested} onCancel={() => setSaveDialog(null)} onSave={confirmSave} />}
      {openSavedDialog && (
        <OpenSavedDialog
          saved={saved}
          onPick={(s) => {
            setOpenSavedDialog(false);
            runSaved(s);
          }}
          onClose={() => setOpenSavedDialog(false)}
        />
      )}
      {help && <HelpDialog topic={help} onClose={() => setHelp(null)} />}
      <Toast message={toast} />
    </div>
  );
}

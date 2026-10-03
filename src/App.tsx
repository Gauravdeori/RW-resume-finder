import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FilterPanel } from './components/FilterPanel';
import { JdButton } from './components/JdButton';
import { FilterSheet, MobileBar } from './components/MobileFilters';
import { ResultsPane } from './components/ResultsPane';
import { SaveSearchModal } from './components/SaveSearchModal';
import { TopBar } from './components/TopBar';
import { Trail, type TrailItem } from './components/Trail';
import type { UploadSettings } from './components/UploadPage';
import { DEFAULT_SETTINGS, loadSettings, storeSettings, type AppSettings } from './lib/admin';
import { KEEP_LAST, clearStoredConversions, loadConversions, newConversion, storeConversions, type Conversion } from './lib/conversions';
import { CANDIDATES } from './lib/data';
import { activeChips, countActiveFilters, suggestName } from './lib/describe';
import { chainSteps, runFilter, sortResults, type SortKey } from './lib/filter';
import { fmtNum, useI18n } from './lib/i18n';
import { useHashRoute } from './lib/route';
import { clearStoredSaved, loadSaved, newSavedId, storeSaved, type SavedSearch } from './lib/savedSearches';
import { cloneFilters, emptyFilters, type Candidate, type Filters } from './lib/types';
import { encodeFilters, readSearchState, writeSearchState } from './lib/urlState';
import { useMediaQuery } from './lib/useMediaQuery';

// Loaded on demand: the CV drawer when a CV is first opened, the other pages when first visited.
const CvDrawer = lazy(() => import('./components/CvDrawer'));
const UploadPage = lazy(() => import('./components/UploadPage').then((m) => ({ default: m.UploadPage })));
const DashboardPage = lazy(() => import('./components/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const AdminPage = lazy(() => import('./components/AdminPage').then((m) => ({ default: m.AdminPage })));

const TEXT_DEBOUNCE_MS = 250;
const DESKTOP = '(min-width: 1024px)';

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
  const [cv, setCv] = useState<Candidate | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saveDialog, setSaveDialog] = useState<null | { steps: Filters[]; suggested: string }>(null);
  const [saved, setSaved] = useState<SavedSearch[]>(loadSaved);
  useEffect(() => storeSaved(saved), [saved]);

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
  const sorted = useMemo(() => sortResults(results, sort), [results, sort]);

  // Keep the URL in step (replaceState: no reloads, no history entries), so a search can be shared or refreshed.
  useEffect(() => writeSearchState({ steps, draft: liveDraft, sort }), [steps, liveDraft, sort]);

  // ---------- actions (stable, so the memoised sidebar and results skip re-rendering) ----------

  // Handlers read the latest draft and steps from refs, so typing does not give them a new identity.
  const latest = useRef({ draft, steps });
  useLayoutEffect(() => {
    latest.current = { draft, steps };
  });

  const replaceDraft = useCallback((f: Filters) => {
    setDraft(f);
    setDraftVersion((v) => v + 1);
  }, []);
  const patchDraft = useCallback((p: Partial<Filters>) => setDraft((d) => ({ ...d, ...p })), []);
  const fillDraft = useCallback((p: Partial<Filters>) => {
    setDraft((d) => ({ ...d, ...p }));
    setDraftVersion((v) => v + 1);
  }, []);
  const clearDraft = useCallback(() => replaceDraft(emptyFilters()), [replaceDraft]);
  const removeChip = useCallback(
    (id: string) => {
      setDraft((d) => activeChips(d, t).find((c) => c.id === id)?.remove(d) ?? d);
      setDraftVersion((v) => v + 1);
    },
    [t],
  );

  /** Lock the current results as a step in the trail and start the next step with an empty panel. */
  const searchWithin = useCallback(() => {
    setSteps((s) => [...s, cloneFilters(latest.current.draft)]);
    replaceDraft(emptyFilters());
  }, [replaceDraft]);

  /** Go back to locked step k (k = -1 is "All candidates"): its filters return to the panel; later steps go. */
  const jumpTo = useCallback(
    (k: number) => {
      if (k < 0) {
        setSteps([]);
        replaceDraft(emptyFilters());
        return;
      }
      const { steps } = latest.current;
      replaceDraft(cloneFilters(steps[k]));
      setSteps(steps.slice(0, k));
    },
    [replaceDraft],
  );

  const runSaved = useCallback(
    (s: SavedSearch) => {
      go('search');
      const list = s.steps.map(cloneFilters);
      setSteps(list.slice(0, -1));
      replaceDraft(list[list.length - 1] ?? emptyFilters());
    },
    [go, replaceDraft],
  );

  const hasDraft = encodeFilters(draft) !== '';
  const openSave = useCallback(() => {
    const { draft, steps } = latest.current;
    // An empty draft after locked steps adds nothing to save.
    const list = (steps.length && !encodeFilters(draft) ? steps : [...steps, draft]).map(cloneFilters);
    setSaveDialog({ steps: list, suggested: suggestName(list, t) });
  }, [t]);

  const confirmSave = (name: string) => {
    if (!saveDialog) return;
    const entry: SavedSearch = { id: newSavedId(), name, steps: saveDialog.steps, createdAt: new Date().toISOString().slice(0, 10) };
    setSaved((list) => [entry, ...list]);
    setSaveDialog(null);
  };

  const onSort = useCallback((s: SortKey) => setSort(s), []);
  const closeCv = useCallback(() => setCv(null), []);
  const deleteSaved = useCallback((id: string) => setSaved((list) => list.filter((s) => s.id !== id)), []);

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
  const canSearchWithin = hasDraft && results.length > 0;

  const filterPanel = (
    <FilterPanel
      filters={draft}
      onChange={patchDraft}
      onJdFill={fillDraft}
      showGender={settings.showGender}
      showJdFill={settings.showJdFill}
    />
  );

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

  // Resume Finder: everything on one screen, nothing scrolls. Top bar; filter panel (tabs) and results (pages).
  return (
    <div className="one-screen flex h-dvh flex-col overflow-hidden bg-page text-ink">
      <TopBar route={route} saved={saved} onRunSaved={runSaved} onDeleteSaved={deleteSaved} />

      <main className="flex min-h-0 flex-1 gap-5 px-4 pt-3 pb-2 lg:px-6 lg:pt-4 lg:pb-3">
        {desktop ? (
          <aside aria-label={t.filtersLabel} className="w-[440px] flex-none overflow-hidden rounded-xl border border-line bg-card shadow-card 2xl:w-[480px]">
            {filterPanel}
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
            onSave={openSave}
            onClear={clearDraft}
            onOpenCv={setCv}
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
          <FilterPanel filters={draft} onChange={patchDraft} onJdFill={fillDraft} showGender={settings.showGender} showJdFill={false} heading={false} />
        </FilterSheet>
      )}

      {cv && (
        <Suspense fallback={null}>
          <CvDrawer c={cv} onClose={closeCv} />
        </Suspense>
      )}
      {saveDialog && <SaveSearchModal suggested={saveDialog.suggested} onCancel={() => setSaveDialog(null)} onSave={confirmSave} />}
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CountRail } from './components/CountRail';
import { CvModal } from './components/CvModal';
import { DashboardPage } from './components/DashboardPage';
import { FilterPanel } from './components/FilterPanel';
import { ResultsList } from './components/ResultsList';
import { SaveSearchModal } from './components/SaveSearchModal';
import { TopBar } from './components/TopBar';
import { Trail, type TrailItem } from './components/Trail';
import { UploadPage, type UploadSettings } from './components/UploadPage';
import { KEEP_LAST, loadConversions, newConversion, storeConversions, type Conversion } from './lib/conversions';
import { CANDIDATES } from './lib/data';
import { suggestName } from './lib/describe';
import { chainSteps, countMatches, sortCandidates, type SortKey } from './lib/filter';
import { useI18n } from './lib/i18n';
import { useHashRoute } from './lib/route';
import { loadSaved, newSavedId, storeSaved, type SavedSearch } from './lib/savedSearches';
import { cloneFilters, emptyFilters, type Candidate, type Filters } from './lib/types';

const PAGE = 10;
const TEXT_DEBOUNCE_MS = 300;

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
 * Clicks recount at once; typing recounts ~300 ms after the last key press.
 * When the whole draft is replaced (new step, edit, clear, JD fill) `version` changes and text applies at once.
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

type View = 'panel' | 'results';

export default function App() {
  const { t } = useI18n();
  // Upload Resume, Dashboard and Search are separate pages; search state is kept while you move between them.
  const [route, go] = useHashRoute();

  // Dummy Resume Studio conversions, newest first, trimmed to the last KEEP_LAST.
  const [conversions, setConversions] = useState<Conversion[]>(loadConversions);
  useEffect(() => storeConversions(conversions), [conversions]);

  const addConversion = useCallback((file: { name: string; size: number }, settings: UploadSettings) => {
    setConversions((list) => [newConversion(list, file, settings), ...list].slice(0, KEEP_LAST));
    // Same rule as newConversion: cross-language conversions wait for review.
    return { status: settings.source === settings.target ? ('exported' as const) : ('review' as const) };
  }, []);

  // Search within results: each committed step stores its own filters.
  // A step's result is its filters applied to the previous step's result.
  const [steps, setSteps] = useState<Filters[]>([]);
  const [view, setView] = useState<View>('panel');
  /** Index of the step the panel is editing: steps.length for a new step, steps.length - 1 for "Edit filters". */
  const [editIndex, setEditIndex] = useState(0);
  const [draft, setDraft] = useState<Filters>(emptyFilters);
  const [draftVersion, setDraftVersion] = useState(0);

  const [sort, setSort] = useState<SortKey>('best');
  const [visible, setVisible] = useState(PAGE);
  const [cv, setCv] = useState<Candidate | null>(null);
  const [saveDialog, setSaveDialog] = useState<null | { steps: Filters[]; suggested: string }>(null);
  const [saved, setSaved] = useState<SavedSearch[]>(loadSaved);

  useEffect(() => storeSaved(saved), [saved]);

  const stepResults = useMemo(() => chainSteps(steps), [steps]);
  const base = stepResults[Math.min(editIndex, stepResults.length - 1)];
  const liveDraft = useLiveFilters(draft, draftVersion);
  const draftCount = useMemo(() => countMatches(base, liveDraft), [base, liveDraft]);

  const current = stepResults[stepResults.length - 1];
  const sorted = useMemo(() => sortCandidates(current, sort), [current, sort]);

  // ---------- actions ----------

  const replaceDraft = useCallback((f: Filters) => {
    setDraft(f);
    setDraftVersion((v) => v + 1);
  }, []);
  const patchDraft = useCallback((p: Partial<Filters>) => setDraft((d) => ({ ...d, ...p })), []);
  const top = () => window.scrollTo({ top: 0 });

  const showResults = () => {
    const next = [...steps.slice(0, editIndex), cloneFilters(draft)];
    setSteps(next);
    setEditIndex(next.length - 1);
    setView('results');
    setVisible(PAGE);
    top();
  };

  const searchWithin = () => {
    setEditIndex(steps.length);
    replaceDraft(emptyFilters());
    setView('panel');
    top();
  };

  const editFilters = () => {
    if (!steps.length) return;
    setEditIndex(steps.length - 1);
    replaceDraft(cloneFilters(steps[steps.length - 1]));
    setView('panel');
    top();
  };

  const newSearch = () => {
    setSteps([]);
    setEditIndex(0);
    replaceDraft(emptyFilters());
    setView('panel');
    top();
  };

  const backToResults = () => {
    setEditIndex(steps.length - 1);
    setView('results');
    top();
  };

  /** Jump to an earlier step: k = 0 is "All candidates"; later steps are removed. */
  const jumpTo = (k: number) => {
    if (k === 0) return newSearch();
    setSteps((s) => s.slice(0, k));
    setEditIndex(k - 1);
    setView('results');
    setVisible(PAGE);
    top();
  };

  const runSaved = (s: SavedSearch) => {
    go('search');
    const next = s.steps.map(cloneFilters);
    setSteps(next);
    setEditIndex(next.length - 1);
    replaceDraft(emptyFilters());
    setView('results');
    setVisible(PAGE);
    top();
  };

  const openSave = (stepsToSave: Filters[]) =>
    setSaveDialog({ steps: stepsToSave.map(cloneFilters), suggested: suggestName(stepsToSave, t) });

  const saveFromPanel = () => openSave([...steps.slice(0, editIndex), draft]);
  const saveFromResults = () => openSave(steps);

  const confirmSave = (name: string) => {
    if (!saveDialog) return;
    const entry: SavedSearch = { id: newSavedId(), name, steps: saveDialog.steps, createdAt: new Date().toISOString().slice(0, 10) };
    setSaved((list) => [entry, ...list]);
    setSaveDialog(null);
  };

  // ---------- trail ----------

  const trailItems: TrailItem[] = [{ label: t.allCandidates, count: CANDIDATES.length, current: false, onClick: () => jumpTo(0) }];
  if (view === 'results') {
    steps.forEach((_, i) =>
      trailItems.push({
        label: t.searchN(i + 1),
        count: stepResults[i + 1].length,
        current: i === steps.length - 1,
        onClick: () => jumpTo(i + 1),
      }),
    );
  } else {
    for (let i = 0; i < editIndex; i++)
      trailItems.push({ label: t.searchN(i + 1), count: stepResults[i + 1].length, current: false, onClick: () => jumpTo(i + 1) });
    trailItems.push({ label: t.searchN(editIndex + 1), current: true });
  }

  const showTrailOnPanel = steps.length > 0;
  /** Only the search panel has the fixed count bar on phones, which needs room at the bottom. */
  const searchPanel = route === 'search' && view === 'panel';

  return (
    <div className={`flex min-h-screen flex-col text-ink ${route === 'search' ? 'bg-page' : 'studio-bg'}`}>
      <TopBar
        route={route}
        saved={saved}
        onRunSaved={runSaved}
        onDeleteSaved={(id) => setSaved((list) => list.filter((s) => s.id !== id))}
      />

      <main
        className={`mx-auto w-full flex-1 px-4 pt-5 sm:pt-8 md:px-8 ${route === 'search' ? 'max-w-[1200px]' : 'max-w-[1300px]'} ${searchPanel ? 'pb-24 lg:pb-12' : 'pb-12'}`}
      >
        {route === 'upload' ? (
          <UploadPage onConverted={addConversion} onOpenDashboard={() => go('dashboard')} />
        ) : route === 'dashboard' ? (
          <DashboardPage
            list={conversions}
            onDelete={(id) => setConversions((list) => list.filter((c) => c.id !== id))}
            onRestore={(c) => setConversions((list) => [...list, c].sort((a, b) => b.id - a.id).slice(0, KEEP_LAST))}
            onUpload={() => go('upload')}
          />
        ) : view === 'panel' ? (
          <>
            <div className="flex items-end justify-between gap-4">
              <h1 className="text-[26px] leading-tight font-extrabold tracking-tight sm:text-[32px]">{t.pageTitle}</h1>
              {/* On phones the bottom bar has no room for this, so it sits by the title. */}
              <button
                type="button"
                onClick={() => replaceDraft(emptyFilters())}
                className="mb-1 flex-none text-[13px] underline underline-offset-2 lg:hidden"
              >
                {t.clearAll}
              </button>
            </div>
            <p className="mt-1 text-[13px] text-muted">{t.pageSub}</p>

            {showTrailOnPanel && (
              <div className="mt-5">
                <Trail items={trailItems} />
                <p className="mt-3 text-[13px]">
                  {editIndex > 0 ? t.searchingWithin(base.length, editIndex) : t.editingSearch(editIndex + 1)}{' '}
                  <button type="button" onClick={backToResults} className="underline underline-offset-2">
                    {t.backToResults}
                  </button>
                </p>
              </div>
            )}

            <div className="mt-5 grid items-start sm:mt-6 lg:grid-cols-[minmax(0,1fr)_300px]">
              <FilterPanel
                filters={draft}
                onChange={patchDraft}
                onJdFill={(p) => replaceDraft({ ...draft, ...p })}
              />
              <CountRail
                count={draftCount}
                baseCount={base.length}
                within={editIndex > 0}
                onShow={showResults}
                onSave={saveFromPanel}
                onClear={() => replaceDraft(emptyFilters())}
              />
            </div>
          </>
        ) : (
          <ResultsList
            steps={steps}
            results={sorted}
            visible={visible}
            sort={sort}
            trail={<Trail items={trailItems} />}
            onSort={(s) => {
              setSort(s);
              setVisible(PAGE);
            }}
            onMore={() => setVisible((v) => v + PAGE)}
            onOpenCv={setCv}
            onSearchWithin={searchWithin}
            onSave={saveFromResults}
            onEdit={editFilters}
            onNewSearch={newSearch}
          />
        )}
      </main>

      <footer
        className={`mx-auto w-full px-4 pt-2 text-[12px] text-muted md:px-8 ${route === 'search' ? 'max-w-[1200px]' : 'max-w-[1300px]'} ${searchPanel ? 'pb-28 lg:pb-8' : 'pb-8'}`}
      >
        {t.footer}
      </footer>

      {cv && <CvModal c={cv} onClose={() => setCv(null)} />}
      {saveDialog && (
        <SaveSearchModal suggested={saveDialog.suggested} onCancel={() => setSaveDialog(null)} onSave={confirmSave} />
      )}
    </div>
  );
}

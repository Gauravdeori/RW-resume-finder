import { useEffect, useId, useRef, useState, type DragEvent } from 'react';
import {
  ACCEPTED_TYPES,
  CURRENT_USER,
  MAX_FILE_MB,
  checkFile,
  type ConversionEngine,
  type ConversionMode,
  type FileProblem,
  type Lang,
} from '../lib/conversions';
import { useI18n } from '../lib/i18n';
import { cx } from './controls';
import { ArrowRight, CapsHeading, DotHeading, FileIcon, Segmented, StudioCard, UploadIcon } from './studio';

const PAIRS: [Lang, Lang][] = [
  ['ja', 'ja'],
  ['en', 'en'],
  ['ja', 'en'],
  ['en', 'ja'],
];

export interface UploadSettings {
  source: Lang;
  target: Lang;
  mode: ConversionMode;
  engine: ConversionEngine;
}

/**
 * Upload Resume (dummy). Pick or drop a file, choose settings, "convert".
 * Nothing leaves the browser: the file is only used for its name and size, and the result is listed on the dashboard.
 */
export function UploadPage({
  onConverted,
  onOpenDashboard,
}: {
  onConverted: (file: { name: string; size: number }, settings: UploadSettings) => { status: 'exported' | 'review' };
  onOpenDashboard: () => void;
}) {
  const { t } = useI18n();
  const s = t.studio;
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [problem, setProblem] = useState<FileProblem>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [done, setDone] = useState<null | { name: string; status: 'exported' | 'review' }>(null);
  const [pair, setPair] = useState<[Lang, Lang]>(['ja', 'ja']);
  const [mode, setMode] = useState<ConversionMode>('exact');
  const [engine, setEngine] = useState<ConversionEngine>('standard');

  const pick = (f: File | undefined | null) => {
    if (!f) return;
    const p = checkFile(f);
    setProblem(p);
    setFile(p ? null : f);
    setDone(null);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files[0]);
  };

  // Simulated conversion: a short progress bar, then the file is listed on the dashboard.
  useEffect(() => {
    if (progress === null || !file) return;
    if (progress >= 100) {
      const result = onConverted({ name: file.name, size: file.size }, { source: pair[0], target: pair[1], mode, engine });
      setDone({ name: file.name, status: result.status });
      setFile(null);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    const id = setTimeout(() => setProgress((p) => (p === null ? null : Math.min(100, p + 7))), 90);
    return () => clearTimeout(id);
  }, [progress, file, onConverted, pair, mode, engine]);

  const converting = progress !== null;
  const pairLabel = (a: Lang, b: Lang) => (
    <>
      {/* Keep each language name whole so a narrow tile wraps at the arrow, never inside 日本語. */}
      <span className="whitespace-nowrap">{s.langShort[a]}</span> <span className="mx-1 text-accent">→</span>{' '}
      <span className="whitespace-nowrap">{s.langShort[b]}</span>
    </>
  );

  return (
    <div className="mx-auto max-w-[1120px]">
      <p className="mono-caps text-[11px] text-muted">{s.eyebrow(CURRENT_USER)}</p>
      <h1 className="mt-2 text-[32px] leading-[1.1] font-extrabold tracking-tight sm:text-[44px]">
        {s.titleBefore}
        <em className="text-accent italic">{s.titleAccent}</em>
        {s.titleAfter}
      </h1>

      <div className="mt-6 grid gap-4 sm:gap-5 lg:grid-cols-2">
        {/* Upload */}
        <StudioCard>
          <DotHeading>
            {s.uploadTitle}{' '}
            <button
              type="button"
              onClick={onOpenDashboard}
              className="text-accent underline decoration-[1.5px] underline-offset-4 hover:decoration-2"
            >
              {s.uploadLink}
            </button>
          </DotHeading>
          <p className="mt-1 text-[13px] text-muted">{s.uploadSub}</p>

          <label
            htmlFor={inputId}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cx(
              'mt-4 flex cursor-pointer flex-col items-center rounded-[12px] border border-dashed px-4 py-8 text-center transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
              dragging ? 'border-accent bg-[color-mix(in_srgb,var(--accent)_6%,var(--card))]' : 'border-tile-line hover:border-ink/40',
              converting && 'pointer-events-none opacity-60',
            )}
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-tile-line bg-tile">
              <UploadIcon className="h-6 w-6" />
            </span>
            <span className="mt-4 text-[17px] font-medium">{dragging ? s.dropActive : s.dropTitle}</span>
            <span className="mt-0.5 text-[13px] text-muted">{s.dropSub}</span>
            <span className="mt-5 flex flex-wrap justify-center gap-2">
              {ACCEPTED_TYPES.map((x) => (
                <span key={x} className="inline-flex h-7 items-center rounded-full border border-tile-line px-3 font-mono text-[10.5px] tracking-[0.12em] uppercase">
                  {x}
                </span>
              ))}
            </span>
            <input
              id={inputId}
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES.map((x) => `.${x}`).join(',')}
              className="sr-only"
              disabled={converting}
              onChange={(e) => pick(e.target.files?.[0])}
            />
          </label>

          {problem && (
            <p role="alert" className="mt-3 text-[13px] text-accent">
              {problem === 'type' ? s.errType : s.errSize(MAX_FILE_MB)}
            </p>
          )}

          {file && (
            <div className="mt-3 flex items-center gap-3 rounded-[10px] border border-tile-line bg-tile px-3.5 py-2.5">
              <FileIcon className="h-5 w-5 flex-none text-muted" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-medium">{file.name}</div>
                <div className="font-mono text-[11px] text-muted">{s.size(file.size / 1024)}</div>
              </div>
              {!converting && (
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    if (inputRef.current) inputRef.current.value = '';
                  }}
                  aria-label={s.removeFile}
                  className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[18px] text-muted hover:bg-card hover:text-ink"
                >
                  ×
                </button>
              )}
            </div>
          )}

          {converting && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-tile" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label={s.converting}>
              <div className="h-full rounded-full bg-accent transition-[width] duration-100" style={{ width: `${progress}%` }} />
            </div>
          )}

          {done && (
            <div role="status" className="mt-3 rounded-[10px] border border-ok/40 bg-ok/10 px-3.5 py-3 text-[13px]">
              <p>{done.status === 'review' ? s.doneReview(done.name) : s.done(done.name)}</p>
              <button type="button" onClick={onOpenDashboard} className="mt-1 inline-flex items-center gap-1 font-semibold underline underline-offset-2">
                {s.viewDashboard}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <p className="mono-caps mt-5 text-[10px] leading-relaxed text-muted">{s.fileNote(MAX_FILE_MB)}</p>

          <button
            type="button"
            disabled={!file || converting}
            onClick={() => {
              setDone(null);
              setProgress(0);
            }}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent text-[15px] font-bold text-on-accent transition-opacity hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {converting ? s.converting : s.start}
            {!converting && <ArrowRight className="h-4 w-4" />}
          </button>
        </StudioCard>

        {/* Conversion settings */}
        <StudioCard>
          <DotHeading>{s.settingsTitle}</DotHeading>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">{s.settingsSub}</p>

          <div role="radiogroup" aria-label={s.settingsTitle} className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
            {PAIRS.map(([a, b]) => {
              const on = pair[0] === a && pair[1] === b;
              return (
                <button
                  key={`${a}-${b}`}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setPair([a, b])}
                  className={cx(
                    'flex min-h-[112px] flex-col justify-center rounded-[12px] border px-3.5 py-4 text-left transition-colors sm:px-5',
                    on ? 'border-pick-line bg-pick text-pick-ink' : 'border-tile-line bg-tile text-ink hover:border-accent/50',
                  )}
                >
                  <span className="text-[16px] font-medium sm:text-[20px] sm:whitespace-nowrap">{pairLabel(a, b)}</span>
                  <span className={cx('mt-1.5 text-[12px] leading-snug sm:text-[13px]', on ? 'font-medium opacity-90' : 'text-muted')}>
                    {s.pairHelp[`${a}-${b}`]}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mt-3 flex items-center gap-2 rounded-[10px] border border-card-line bg-tile px-3.5 py-2 font-mono text-[11.5px] tracking-[0.04em]">
            <span aria-hidden className="h-2 w-2 flex-none rounded-full bg-ok" />
            <span>
              {s.langShort[pair[0]]} → {s.langShort[pair[1]]} · {s.output(pair[1])}
            </span>
          </p>
        </StudioCard>

        {/* Mode */}
        <StudioCard>
          <CapsHeading>{s.modeTitle}</CapsHeading>
          <div className="mt-4 flex justify-center">
            <Segmented
              label={s.modeTitle}
              value={mode}
              onChange={setMode}
              options={[
                { value: 'exact', label: s.mode.exact },
                { value: 'optimized', label: s.mode.optimized },
              ]}
            />
          </div>
          <p className="mt-4 text-[13px] leading-relaxed">{s.modeHelp[mode]}</p>
        </StudioCard>

        {/* Engine */}
        <StudioCard>
          <CapsHeading>{s.engineTitle}</CapsHeading>
          <div className="mt-4 flex justify-center">
            <Segmented
              label={s.engineTitle}
              value={engine}
              onChange={setEngine}
              options={[
                { value: 'standard', label: s.engine.standard },
                { value: 'complex', label: s.engine.complex },
              ]}
            />
          </div>
          <p className="mt-4 text-[13px] leading-relaxed">{s.engineHelp[engine]}</p>
        </StudioCard>
      </div>
    </div>
  );
}

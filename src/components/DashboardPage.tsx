import { useEffect, useId, useState } from 'react';
import { KEEP_LAST, type Conversion } from '../lib/conversions';
import { useI18n } from '../lib/i18n';
import { cx } from './controls';
import { Modal } from './Modal';
import { Chip, TrashIcon } from './studio';

function useStudioLabels() {
  const { t } = useI18n();
  const s = t.studio;
  const tags = (c: Conversion) => [
    `${s.langCode[c.source]} → ${s.langCode[c.target]}`,
    s.mode[c.mode],
    c.dualLanguage ? s.tagDual : s.tagSingle,
    c.hasTables ? s.tagTables : s.tagNoTables,
    s.engine[c.engine],
  ];
  return { s, tags };
}

function StatusPill({ status }: { status: Conversion['status'] }) {
  const { s } = useStudioLabels();
  return (
    <span
      className={cx(
        'mono-caps inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[10px] whitespace-nowrap',
        status === 'exported' ? 'border-ok/70 text-ok' : 'border-warn/70 text-warn',
      )}
    >
      <span aria-hidden className={cx('h-1.5 w-1.5 rounded-full', status === 'exported' ? 'bg-ok' : 'bg-warn')} />
      {s.status[status]}
    </span>
  );
}

function RowActions({ c, onEdit, onDelete }: { c: Conversion; onEdit: () => void; onDelete: () => void }) {
  const { s } = useStudioLabels();
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onEdit}
        aria-label={s.editFor(c.fileName)}
        className="h-10 rounded-full border border-card-line bg-card px-4 text-[13px] font-semibold hover:border-ink/50"
      >
        {s.edit}
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={s.deleteFor(c.fileName)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-card-line bg-card hover:border-accent hover:text-accent"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

function DetailModal({ c, onClose }: { c: Conversion; onClose: () => void }) {
  const { s, tags } = useStudioLabels();
  const { t } = useI18n();
  const titleId = useId();
  return (
    <Modal labelledBy={titleId} onClose={onClose} className="max-w-[460px] rounded-[16px] p-6">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 h-8 rounded-full border border-card-line px-3 text-[13px] hover:border-ink/50"
      >
        {t.close}
      </button>
      <p className="mono-caps text-[10.5px] text-muted">{s.detailTitle(c.id)}</p>
      <h2 id={titleId} className="mt-1 pr-16 text-[20px] leading-snug font-semibold break-all">
        {c.fileName}
      </h2>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {tags(c).map((x) => (
          <Chip key={x}>{x}</Chip>
        ))}
      </div>
      <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-[13px]">
        <dt className="text-muted">{s.col.status}</dt>
        <dd>
          <StatusPill status={c.status} />
        </dd>
        <dt className="text-muted">{s.detailLanguage}</dt>
        <dd>
          {s.langShort[c.source]} → {s.langShort[c.target]} · {s.output(c.target)}
        </dd>
        <dt className="text-muted">{s.col.by}</dt>
        <dd>{s.you(c.uploadedBy)}</dd>
        <dt className="text-muted">{s.col.size}</dt>
        <dd>{s.size(c.sizeKb)}</dd>
        <dt className="text-muted">{s.col.created}</dt>
        <dd>{s.created(c.createdAt)}</dd>
      </dl>
      <p className="mt-5 rounded-[10px] bg-tile px-3.5 py-3 text-[12.5px] leading-relaxed text-muted">{s.detailNote}</p>
    </Modal>
  );
}

/** Dashboard (dummy): stats, then the latest conversions. */
export function DashboardPage({
  list,
  onDelete,
  onRestore,
  onUpload,
}: {
  list: Conversion[];
  onDelete: (id: number) => void;
  onRestore: (c: Conversion) => void;
  onUpload: () => void;
}) {
  const { s, tags } = useStudioLabels();
  const [detail, setDetail] = useState<Conversion | null>(null);
  const [removed, setRemoved] = useState<Conversion | null>(null);

  // The undo message disappears after a few seconds.
  useEffect(() => {
    if (!removed) return;
    const id = setTimeout(() => setRemoved(null), 6000);
    return () => clearTimeout(id);
  }, [removed]);

  const remove = (c: Conversion) => {
    onDelete(c.id);
    setRemoved(c);
  };

  const stats = [
    { value: list.length, label: s.statTotal, accent: false },
    { value: list.filter((c) => c.status === 'exported').length, label: s.statExported, accent: true },
    { value: list.filter((c) => c.status === 'review').length, label: s.statReview, accent: false },
    { value: list.filter((c) => c.source !== c.target).length, label: s.statCross, accent: false },
  ];

  return (
    <div className="mx-auto max-w-[1220px]">
      <h1 className="text-[34px] leading-tight font-extrabold tracking-tight sm:text-[44px]">{s.dashTitle}</h1>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((x) => (
          <div key={x.label} className="rounded-[14px] border border-card-line bg-card px-5 py-5 sm:px-6">
            <div className={cx('text-[30px] leading-none font-medium', x.accent && 'text-accent')}>{x.value}</div>
            <div className="mono-caps mt-3 text-[10px] leading-snug text-muted">{x.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-9 flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <h2 className="text-[22px] font-medium">{s.listTitle}</h2>
        <p className="mono-caps text-[10px] text-muted">{s.listMeta(list.length, KEEP_LAST)}</p>
      </div>

      {list.length === 0 ? (
        <div className="mt-4 rounded-[14px] border border-card-line bg-card px-6 py-12 text-center">
          <p className="text-[14px] text-muted">{s.empty}</p>
          <button type="button" onClick={onUpload} className="mt-4 h-11 rounded-full bg-accent px-6 text-[14px] font-bold text-on-accent">
            {s.uploadCta}
          </button>
        </div>
      ) : (
        <>
          {/* Wide screens: table */}
          <div className="mt-4 hidden overflow-hidden rounded-[14px] border border-card-line bg-card lg:block">
            <table className="w-full text-left">
              <thead>
                <tr className="mono-caps text-[10px] text-muted">
                  <th scope="col" className="w-[72px] py-4 pl-6 font-normal">{s.col.num}</th>
                  <th scope="col" className="py-4 pr-4 font-normal">{s.col.file}</th>
                  <th scope="col" className="py-4 pr-4 font-normal">{s.col.status}</th>
                  <th scope="col" className="py-4 pr-4 font-normal">{s.col.by}</th>
                  <th scope="col" className="py-4 pr-4 font-normal">{s.col.size}</th>
                  <th scope="col" className="py-4 pr-4 font-normal">{s.col.created}</th>
                  <th scope="col" className="py-4 pr-6"><span className="sr-only">{s.edit}</span></th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} className="border-t border-card-line align-middle">
                    <td className="py-5 pl-6 text-[13px] text-muted">{c.id}</td>
                    <td className="py-5 pr-4">
                      <div className="text-[14px] font-medium break-all">{c.fileName}</div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {tags(c).map((x) => (
                          <Chip key={x}>{x}</Chip>
                        ))}
                      </div>
                    </td>
                    <td className="py-5 pr-4">
                      <StatusPill status={c.status} />
                    </td>
                    <td className="py-5 pr-4 text-[13px] whitespace-nowrap text-muted">{s.you(c.uploadedBy)}</td>
                    <td className="py-5 pr-4 text-[13px] whitespace-nowrap text-muted">{s.size(c.sizeKb)}</td>
                    <td className="py-5 pr-4 text-[13px] whitespace-nowrap text-muted">{s.created(c.createdAt)}</td>
                    <td className="py-5 pr-6">
                      <div className="flex justify-end">
                        <RowActions c={c} onEdit={() => setDetail(c)} onDelete={() => remove(c)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phones and tablets: cards */}
          <ul className="mt-4 flex flex-col gap-3 lg:hidden">
            {list.map((c) => (
              <li key={c.id} className="rounded-[14px] border border-card-line bg-card px-4 py-4 sm:px-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-[11px] text-muted">#{c.id}</div>
                    <div className="mt-0.5 text-[15px] font-medium break-all">{c.fileName}</div>
                  </div>
                  <StatusPill status={c.status} />
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {tags(c).map((x) => (
                    <Chip key={x}>{x}</Chip>
                  ))}
                </div>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <p className="text-[12px] leading-relaxed text-muted">
                    {s.you(c.uploadedBy)}
                    <br />
                    {s.size(c.sizeKb)} · {s.created(c.createdAt)}
                  </p>
                  <RowActions c={c} onEdit={() => setDetail(c)} onDelete={() => remove(c)} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {removed && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-[420px] items-center justify-between gap-4 rounded-full bg-sel py-2 pr-2 pl-5 text-[13px] text-on-sel shadow-lg"
        >
          <span className="truncate">{s.deleted(removed.fileName)}</span>
          <button
            type="button"
            onClick={() => {
              onRestore(removed);
              setRemoved(null);
            }}
            className="h-8 flex-none rounded-full bg-accent px-4 font-bold text-on-accent"
          >
            {s.undo}
          </button>
        </div>
      )}

      {detail && <DetailModal c={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

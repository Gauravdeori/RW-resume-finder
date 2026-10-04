import { useId, useRef, type ReactNode } from 'react';
import { useI18n } from '../lib/i18n';
import type { Candidate } from '../lib/types';
import { Modal } from './Modal';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="border-b border-line pb-2 text-[13px] font-bold">{title}</h3>
      <div className="mt-3 text-[13px] leading-relaxed">{children}</div>
    </section>
  );
}

/**
 * CV preview as a right-side drawer over the results. Esc or × closes it; the results keep their scroll position.
 * Loaded on demand (React.lazy) the first time a CV is opened.
 */
export default function CvDrawer({ c, onClose }: { c: Candidate; onClose: () => void }) {
  const { t } = useI18n();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  const jobs = [
    { title: c.currentTitle, company: c.currentCompany, years: t.toPresent(c.currentStartYear) },
    ...c.previousCompanies.map((p) => ({ title: p.title, company: p.company, years: t.yearRange(p.startYear, p.endYear) })),
  ];

  return (
    <Modal
      labelledBy={titleId}
      onClose={onClose}
      initialFocus={closeRef}
      placement="right"
      className="max-w-[560px] rounded-l-xl border-y-0 border-r-0 px-5 py-6 sm:px-8 sm:py-7"
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label={t.closeCv}
        className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-lg border border-line text-[20px] leading-none hover:border-ink/45"
      >
        ×
      </button>
      <h2 id={titleId} className="pr-14 text-[24px] leading-tight font-bold tracking-[-0.01em]">
        <span className="sr-only">{t.cvDialog(t.displayName(c))}: </span>
        <span aria-hidden>{t.displayName(c)}</span>
      </h2>
      <p className="mt-1 text-[13px]">{t.titleAt(c)}</p>
      <div aria-hidden className="mt-5 h-[3px] w-10 rounded-full bg-accent" />

      <Section title={t.cvProfile}>
        <p>{t.profileText(c)}</p>
      </Section>

      <Section title={t.cvExperience}>
        <ul className="flex flex-col gap-3">
          {jobs.map((j, i) => (
            <li key={i} className="flex items-start justify-between gap-4">
              <div>
                <div className="font-bold">{j.title}</div>
                <div className="text-muted">{j.company}</div>
              </div>
              <div className="flex-none text-right text-muted">{j.years}</div>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t.cvEducation}>
        <ul className="flex flex-col gap-1">
          {/* Highest degree first, like a CV. */}
          {[...c.education].reverse().map((e) => (
            <li key={e.degree}>{t.educationLine(e)}</li>
          ))}
        </ul>
      </Section>

      <Section title={t.cvLanguages}>
        <p>{t.languagesText(c)}</p>
      </Section>

      {c.qualifications.length + c.otherQualifications.length > 0 && (
        <Section title={t.cvQualifications}>
          <p>{[...c.qualifications.map((q) => t.qualificationFull[q]), ...c.otherQualifications].join(', ')}</p>
        </Section>
      )}
    </Modal>
  );
}

# Resume Finder â€” clickable prototype

Candidate search module for Resume Studio (Kenja Ã— Robert Walters Japan).
Prototype with sample data: 4,860 invented candidates and 15 invented conversions, generated with a seeded random generator so the data is the same on every load. No backend.

## Run

Requires Node 20+.

```bash
npm install
npm run dev        # http://localhost:5173
```

Build a static site (output in `dist/`, relative paths, works on any static host):

```bash
npm run build
npm run preview    # serve the build locally
```

Deploy: Netlify / Vercel / Render static site with build command `npm run build` and publish directory `dist`.

## What is in it

| Feature | Where |
| --- | --- |
| Filter panel (no dropdowns), live count, zero state | `components/FilterPanel.tsx`, `CountRail.tsx` |
| Age: decades + dual slider, last-touched wins | `components/AgeFilter.tsx` |
| Gaishi score (Aâ€“D) and its parts | `components/GaishiFilter.tsx`, `lib/gaishi.ts` |
| Results, Best CVs / New CVs, Show 10 more | `components/ResultsList.tsx`, `CandidateRow.tsx` |
| CV preview modal (Esc closes, scroll kept) | `components/CvModal.tsx` |
| Search within results + trail (unlimited steps) | `App.tsx`, `components/Trail.tsx`, `lib/filter.ts` (`chainSteps`) |
| Saved searches (localStorage, 2 seeded) | `components/SavedSearches.tsx`, `lib/savedSearches.ts` |
| Fill filters from a job description | `components/JdPanel.tsx`, `lib/jdParser.ts` |
| EN / æ—¥æœ¬èªž labels (single file) | `lib/i18n.ts` |
| Light / dark switch (defaults to device, remembered) | `components/ThemeSwitch.tsx`, `lib/theme.ts`, `src/index.css` |
| Upload Resume page (dummy: pick or drop a file, settings, simulated conversion) | `components/UploadPage.tsx` |
| Dashboard page (dummy: stats, last 15 conversions, edit details, delete with undo) | `components/DashboardPage.tsx`, `lib/conversions.ts` |
| Page switching (`#/upload`, `#/dashboard`, `#/search`, `#/admin`; works on any static host). The candidate search is listed in the menu as "Resume Finder"; the logo also goes there | `lib/route.ts`, `components/TopBar.tsx` |
| Admin page (dummy users and activity; invite, change role, deactivate, remove). Its search settings really apply: gender filter on/off (per-country rule), job description panel on/off. "Reset demo data" restores all sample data | `components/AdminPage.tsx`, `lib/admin.ts` |

## Search rules (`lib/filter.ts`)

- Within one row, ticked choices join with OR; different rows join with AND; an empty row does not filter.
- "At least" levels include every higher level. Text boxes: partial, case-insensitive.
- Every filled "Previous company" box must match one of the candidate's previous companies.
- A search step = its filters applied to the previous step's results.
- Clicks recount at once; typing recounts 300 ms after the last key press.

## For the backend hand-over (Deepanker)

- `Candidate` in `lib/types.ts` lists the fields to extract when a CV is converted.
- `compileFilters` in `lib/filter.ts` is the reference behaviour for the real count / search query.
- `parseJobDescription` in `lib/jdParser.ts` returns `{ patch, filled }`; swap its body for an AI call returning the same JSON.
- "Best CVs" is a placeholder rank (gaishi score, school class, seniority, CV date).

## Assumptions to confirm with Ted / Aaron

- Gender filter shows Male / Female only; "not stated" candidates drop out when either is ticked. Needs a per-country switch later.
- "Worked at a foreign company" counts the current company too.
- "Edit filters" edits the last step; earlier steps stay as they are.
- School classes, lists and Japanese labels are drafts (Japanese needs a native check).

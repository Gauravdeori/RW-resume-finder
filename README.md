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
| Full-screen search: four boxes of exactly the same size in a 2x2 grid (Candidate, Role / Gaishi fit, Education), lined up with the left column (the count card's top with the upper boxes, the Saved searches panel's bottom with the lower boxes; the panel fills the room under the buttons). 20px bold headings with a short coral bar. Inside each box one label column (92px, 112px in Japanese), so every control starts on one line; Seniority, Industry, Position and Age line up. Fits 1440x900 at full size; shorter screens scale every box's content down by the same amount instead of scrolling | `components/FilterPanel.tsx` (`Zones`, `useFitBoxes`), `components/SearchSide.tsx` |
| Filter panel, live count, zero state, 36px controls, removable active-filter chips, animated count | `components/FilterPanel.tsx`, `controls.tsx` |
| Age: decades + dual slider, last-touched wins | `components/AgeFilter.tsx` |
| Gaishi fit: the score (A to D, 40px letters) on top; its parts indented under it with a guide line (English level + TOEIC, Japanese level + JLPT, lived overseas, worked at a foreign company). A live hint says which scores the parts allow, and warns when they rule out the score ticked | `components/FilterPanel.tsx`, `lib/gaishi.ts` (`gaishiRange`), `lib/languageTests.ts` |
| Education: one line per degree; ticking one shows a Major dropdown for that degree (none for MBA). School rating with an (i) glossary (sample list, to be confirmed by Robert Walters). Minimum GPA (Any, or 0.1 to 4.0; every GPA normalised to 4.0). Other qualifications (CPA, USCPA, CFA, PMP, CIA, Bookkeeping, IT cert. (AWS/Azure), Lawyer (Bengoshi), Sharoushi) plus a free-text box | `components/FilterPanel.tsx`, `lib/filter.ts` |
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
- English level and Japanese level filter as "this level or higher". A TOEIC score only sets the English level (under 400 Basic, 400-599 Conversational, 600-779 Business, 780+ Fluent; never Native). A JLPT level only sets the Japanese level (N5, N4 Basic; N3 Conversational; N2 Business; N1 Fluent; native speakers have no JLPT), and picking a level lights the matching JLPT.
- Degree: a candidate matches a ticked degree when they hold it and, if a major is picked for it, that major for that same degree. Ticked degrees join with OR.
- School rating and school name match any of the candidate's schools. GPA compares the candidate's best GPA, normalised to 4.0 (GPA / scale x 4); candidates with no GPA on their CV drop out when a minimum is set.
- Other qualifications: any ticked one, or the typed text found in any qualification on the CV (English or Japanese names).
- Every filled "Previous company" box must match one of the candidate's previous companies.
- A search step = its filters applied to the previous step's results.
- Clicks recount at once; typing recounts 300 ms after the last key press.

## For the backend hand-over (Deepanker)

- `Candidate` in `lib/types.ts` lists the fields to extract when a CV is converted.
- `compileFilters` in `lib/filter.ts` is the reference behaviour for the real count / search query.
- `parseJobDescription` in `lib/jdParser.ts` returns `{ patch, filled }`; swap its body for an AI call returning the same JSON.
- `education` is a list of `{ degree, major, school, schoolRating, gpa, gpaScale }` (major is null for an MBA; gpaScale is 4.0, 4.3, 5.0 or 100). Also `qualifications`, `otherQualifications`, `toeicScore` and `jlpt` (both optional).
- "Best CVs" is a placeholder rank (gaishi score, best school rating, seniority, CV date).

## Assumptions to confirm with Ted / Aaron

- Gender filter shows Male / Female only; "not stated" candidates drop out when either is ticked. Needs a per-country switch later.
- "Worked at a foreign company" counts the current company too.
- "Edit filters" edits the last step; earlier steps stay as they are.
- School ratings, lists and Japanese labels are drafts (Japanese needs a native check). Older saved searches and links that used "school class" still open as school rating.
- The Gaishi score is made of English, foreign companies and time overseas; Japanese is shown with its parts but does not count towards it.

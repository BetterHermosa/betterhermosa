# National projects (`/budget`)

The `/budget` page and the "National projects" section on every barangay page show national-government projects that name Hermosa. The data comes from the [Philippine Budget Data API](https://budget.bettergov.ph/docs) (free, no key, exact pesos).

This is **not the municipality's own budget** (AIP, annual budget, LDRRMF). Those are published as PDFs on hermosa.gov.ph and are not in this feature.

## How it works

| Piece | Where |
| --- | --- |
| Snapshot script | `scripts/fetch-budget.js` |
| Snapshot (committed) | `public/data/budget-hermosa.json` |
| Shared types, loader, helpers | `src/lib/budget.ts` |
| Page | `src/pages/budget/index.tsx` |
| Barangay section | `src/components/government/BarangayProjects.tsx` |
| Prerendered HTML, `llms-full.txt`, `hermosa.json` | `scripts/lib/content.cjs` |
| Monthly refresh | `.github/workflows/refresh-budget.yml` |

The site never calls the API from the browser. `fetch-budget.js` runs during `npm run build`, writes the snapshot, and the page loads that one JSON file (one cached request shared by the page and the barangay sections). The prerender step also writes the project lists into the static HTML so crawlers and AI readers see them without JavaScript.

`content.cjs` and the React components render the same data in two places. When you change the wording or sorting of one, change the other (both files say so in a comment).

## What is in the snapshot

- `gaa[]`: General Appropriations Act projects, FY2020-2026, from `/gaa/search?q=hermosa` once per year. Each has `amounts` by year, a `barangay` slug (or `null`) and a `type`.
- `hgab`: FY2027 House bill rows compared with the National Expenditure Program (NEP), for DPWH (region III) and DA farm-to-market roads.
- `meta`: fetch time, source, and the API's disclaimers copied verbatim.

## Matching rules and limits

- The API has no municipality field. A project is kept only when its title names Hermosa and Bataan. A deny list drops "Villahermosa" and other provinces' Hermosa.
- The barangay is found by name in the title (`BARANGAY_ALIASES` in `fetch-budget.js` covers spellings such as Balsik/Balsic and Maete/Malte). Projects naming no barangay appear on `/budget` only.
- A project that does not say "Hermosa" in its title is missed. Each search returns at most 100 rows per year; the script warns if a year hits that cap.
- The type (road, flood control, building, farm-to-market, other) is guessed from keywords in the title.

## Rules from the API (must stay)

- Amounts are exact pesos. `null` means "no such line", never zero.
- NEP and House figures are two versions of one budget: show them side by side, never add them.
- House bill pairings are leads, not confirmed changes. Use the API's `status_label` wording. Do not write "insertion", "deletion" or "irregular" in our own copy.
- Keep the API's `disclaimers` text wherever House bill rows are shown (it is in `meta.disclaimers`).
- No commentary on any project type, flood control included. Show the data and the source.
- Send a descriptive User-Agent (the script does).

## Refreshing

The data changes a few times a year.

```bash
node scripts/fetch-budget.js   # rewrites public/data/budget-hermosa.json
```

Review the diff, then commit the JSON. If the API is unreachable, the script keeps the previous snapshot and the build continues.

`refresh-budget.yml` does this on the 1st of each month (or on demand from the Actions tab). When the data changed it pushes a `chore/refresh-budget-<date>` branch and opens an issue with a link that creates the pull request in one click. It opens an issue and not a PR because the BetterHermosa organization locks "Allow GitHub Actions to create and approve pull requests". If an org owner enables that setting, the last step can use `gh pr create` instead.

The full `npm run build` runs `merge:services`, which needs `python3`. On Windows that command is a Store stub, so run the steps directly: `node scripts/fetch-budget.js && node scripts/generate-sitemap.js && npx vite build && node scripts/prerender-heads.cjs`.

## URL filters

`/budget` keeps its filters in the URL: `?barangay=<slug>`, `?year=<yyyy>`, `?type=<type>`, `?q=<text>`. Invalid values fall back to defaults. With a barangay but no year, the page opens on the newest year that has projects for that barangay.

## Ideas not built yet

- Department pages linking to national projects.
- Regional context from `/nep/2027/rollups/region?code=III&by=department`.
- DPWH district engineering office view (the API requires shared-office totals to stay undivided, with disclaimers).
- Hermosa's own municipal budget, entered from the hermosa.gov.ph PDFs.

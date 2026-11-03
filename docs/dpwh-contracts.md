# DPWH contracts (`/transparency/infrastructure`)

A list of Department of Public Works and Highways (DPWH) contracts that name Hermosa: budget, status, reported progress, contractor, year, program, and a detail page per contract (`/transparency/infrastructure/<contract id>`).

It complements `/budget` (national budget lines naming Hermosa, from the Budget Data API; see [budget-data.md](budget-data.md)). `/budget` shows what was appropriated; this page shows the contracts and who holds them.

## Source

"DPWH Infrastructure Transparency Dataset" (CC0), dataset 19 on the BetterGov Open Data Portal (https://data.bettergov.ph/datasets/19): a parquet file on Hugging Face, `bettergovph/dpwh-transparency-data`. Contracts were saved on the date shown on the page (and in `meta.retrieved`).

The page used to read BetterGov's live DPWH search index (`search2.bettergov.ph`), which needs an API key that this project does not have. It now reads the committed snapshot instead, so there is no key and no live dependency. It is a point in time, not a live feed.

## How the data gets here

```bash
pip install pyarrow
python scripts/extract_dpwh.py               # downloads the ~24 MB file
python scripts/extract_dpwh.py file.parquet  # or use a local copy
```

This writes `public/data/dpwh-hermosa.json` (about 130 KB, committed). It is not part of the build.

The dataset has no municipality field; its `province` column holds the district engineering office. A contract is kept when its description names Hermosa, it is in Region III, and its office is `Bataan 1st DEO` or `Region III` (this drops, for example, a school named "Hilario E. Hermosa" in Nueva Ecija). The barangay is read from the title (same spellings as `scripts/fetch-budget.js`). The script stops if the result has duplicate ids or a surprising count.

## Things to know

- A contract that does not say "Hermosa" in its description is not listed. About a quarter of the contracts do not name a barangay.
- Status, progress and amounts are as published by DPWH and can be inconsistent. A few contracts show 100% progress and still say On-Going; the detail page shows both and says so.
- Amount paid is not shown: the source reports zero for every contract.
- Titles are ALL CAPS with abbreviations in the source; the page makes them readable (`prettify` in `src/lib/dpwh.ts`) without changing the words. Contractor names are shown as published.
- Wording stays neutral. The page shows the published facts and the source; it does not comment on any contract, contractor or type of work, flood control included.

## Routing

The two routes are registered outside the `features.transparency` flag, without the Transparency Portal layout, because the rest of that portal (financial reports, procurement) depends on the same search service and stays off. If the flag is turned on, the portal's sidebar link to "DPWH Projects" still lands on this page.

## Updating

Re-run the script when you want fresher data (the dataset is updated by BetterGov, not on a fixed schedule), review the diff, and commit the JSON. The prerendered page, `llms-full.txt` and `data/hermosa.json` pick it up on the next build through `scripts/lib/content.cjs`.

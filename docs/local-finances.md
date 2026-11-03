# Local finances (`/finances`)

The `/finances` page shows the Municipality of Hermosa's own income and spending, from the Bureau of Local Government Finance (BLGF). It complements `/budget`, which shows national-government projects that name Hermosa (see [budget-data.md](budget-data.md)).

## Source

BLGF publishes per-LGU spreadsheets at https://blgf.gov.ph/lgu-fiscal-data/ (also listed in the BetterGov Open Data Portal, https://data.bettergov.ph, dataset 9). The page uses FY2024 (preliminary, extracted by BLGF on March 17, 2025):

| File | Used for |
| --- | --- |
| `By-LGU-ARI-and-Dependencies-2024.xlsx` | annual regular income and its split, dependency rates |
| `By-LGU-SRE-2024.xlsx` | statement of receipts and expenditures: income, operating spending, capital outlay, cash |
| `FY2024-LDRRMF-by-LGU.xlsx` | local disaster risk reduction and management fund |

BLGF asks users to acknowledge it as the source; the page and `meta.attribution` in the JSON do that.

## How the data gets here

The data is **not** fetched during the build. It changes once a year, so the extracted JSON is committed: `src/data/finances/hermosa.json`.

blgf.gov.ph is behind a firewall that blocks scripted downloads, so the files have to be downloaded in a browser:

```bash
pip install openpyxl
python scripts/extract_blgf.py <folder-with-the-three-xlsx-files>
```

The script finds Hermosa's row in each sheet and checks every column against its header text. It also checks that the parts add up (income components to the total, income minus spending to net operating income, the two disaster-fund shares to the total). A changed layout stops it with a message instead of writing wrong numbers.

## Things to know

- The ARI sheet says "In Php Million" but its values are whole pesos (the components add up to the total as pesos). The extract keeps pesos.
- The ARI total and the SRE "current operating income" use different definitions, so they differ (about ₱441.0M vs ₱466.4M for FY2024). The page says so.
- The data is a year or more behind. State the fiscal year and that it is preliminary wherever it is shown.
- This is not the municipality's annual budget (AIP, annual budget document). Those are PDFs on hermosa.gov.ph and are not in the portal yet.

## Updating for a new year

When BLGF publishes the next year's files, download them, update the file names and URLs in `FILES` in `scripts/extract_blgf.py`, check the column positions still pass the header checks, run the script, and update `fiscalYear` wording if it changes. Then rebuild and review `/finances`.

## Where it appears

Route and navigation (Government menu and footer), `scripts/lib/routes.cjs` (sitemap and prerender), `scripts/lib/content.cjs` (prerendered HTML, `llms-full.txt` and `data/hermosa.json`), `src/data/seo-metadata.json`. `content.cjs` and the React page render the same numbers in two places; keep their wording in sync.

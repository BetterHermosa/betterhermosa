# Statistics page (`/statistics`)

Only the Demographics page is live. It shows Hermosa's census population by year and for each of the 23 barangays.

## Data

`src/data/statistics/population.json`

- Source: PSA Census of Population and Housing, as compiled by PhilAtlas (`philatlas.com/luzon/r03/bataan/hermosa.html` and one page per barangay).
- Years: municipality 1960 to 2024; barangays 1990 to 2024 (1990, 1995, 2000, 2007, 2010, 2015, 2020, 2024).
- 2024 census (POPCEN): taken directly from the PSA website, `psa.gov.ph/classification/psgc/barangays/0300805000` (all 23 barangays, total 80,557). This is the only official-source column; the page loads behind a short automatic security check.
- Check done when the file was built: for every census year from 1990 to 2020 the 23 barangay figures add up exactly to the municipal total (2020: 77,443; 2015: 65,862).
- Growth rates are computed from the census dates (compound annual rate), not copied. They match PhilAtlas (2010-2015: 2.79%, 2015-2020: 3.47%).
- Barangay figures for 2024 sum to 80,557, the PSA municipal figure.
- Barangay figures for 2020 and earlier still come only from PhilAtlas. Municipal totals and the 2015 and 2010 barangay figures were cross-checked against Wikipedia (23 of 23 match); no 2020 barangay table from PSA was found.
- PhilAtlas is a secondary source. Before a formal release, compare 2020 and earlier against the PSA 2020 CPH table for Bataan.

## Hidden pages

`CompetitivenessPage.tsx` (`cmci.json`) and `MunicipalIncomePage.tsx` (`ari.json`) still hold the BetterLB (Los Baños) data and are not routed, linked or in the sitemap. Do not turn them on until Hermosa data replaces it.

- CMCI: needs Hermosa's scores from cmci.dti.gov.ph (blocks automated fetches; copy by hand).
- Income: PhilAtlas lists Hermosa's annual regular income for 2009 to 2016 (BLGF), but the page expects a per-source breakdown and 2016 is old. A current source (SRE or COA report) is needed.

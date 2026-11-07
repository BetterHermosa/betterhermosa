# Statistics page (`/statistics`)

Only the Demographics page is live. It shows Hermosa's census population by year and for each of the 23 barangays.

## Data

`src/data/statistics/population.json`

- Source: PSA Census of Population and Housing, as compiled by PhilAtlas (`philatlas.com/luzon/r03/bataan/hermosa.html` and one page per barangay).
- Years: municipality 1960 to 2020; barangays 1990 to 2020 (1990, 1995, 2000, 2007, 2010, 2015, 2020).
- Check done when the file was built: for every census year from 1990 to 2020 the 23 barangay figures add up exactly to the municipal total (2020: 77,443; 2015: 65,862).
- Growth rates are computed from the census dates (compound annual rate), not copied. They match PhilAtlas (2010-2015: 2.79%, 2015-2020: 3.47%).
- Not included: the 2024 census (POPCEN). Add a 2024 point to `municipality.history` and to each barangay when PSA publishes Hermosa's figures; the page reads the last point as "latest".
- PhilAtlas is a secondary source. Before a formal release, compare against the PSA 2020 CPH table for Bataan.

## Hidden pages

`CompetitivenessPage.tsx` (`cmci.json`) and `MunicipalIncomePage.tsx` (`ari.json`) still hold the BetterLB (Los Baños) data and are not routed, linked or in the sitemap. Do not turn them on until Hermosa data replaces it.

- CMCI: needs Hermosa's scores from cmci.dti.gov.ph (blocks automated fetches; copy by hand).
- Income: PhilAtlas lists Hermosa's annual regular income for 2009 to 2016 (BLGF), but the page expects a per-source breakdown and 2016 is old. A current source (SRE or COA report) is needed.

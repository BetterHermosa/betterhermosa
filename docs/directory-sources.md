# Department heads, barangay captains and barangay maps

Three kinds of directory data come from the Municipality's own site, https://www.hermosa.gov.ph, checked on 2026-11-03. Only names, titles and links are used. No phone numbers or personal emails of individuals are copied, and no staff below department-head level.

## Department heads (`src/data/directory/departments.json`)

Source: the organizational-chart PDFs linked from https://www.hermosa.gov.ph/government/department-offices/ (files dated February to March 2026). Each chart is an image; the names come from the text tags stored inside the PDF (the printed text), not from reading the drawn chart. `head_source` records the page and check date, and the page text says "as shown on the Municipality's organizational chart".

`department_head` has `name`, `title` and `status` (`OIC` or `Acting`, as printed). Titles are the standard titles for each office.

Cross-check against the directory page (https://www.hermosa.gov.ph/about-2/directory/, undated):

- **Agree (9):** Administrator, Accountant, Assessor, Budget Officer, Agriculturist, HRMO (Acting), MDRRMO, Planning and Development, Treasurer.
- **Chart only (3):** Engineer (OIC), Health Officer (OIC), Environment and Natural Resources. The directory has no row for these.
- **Chart and directory differ (3):** the chart is newer, so it is used, but these need confirming with the Municipality.
  - Civil Registrar: chart Marilyn B. Veluz; directory Maria Florina Sibug (the chart lists her as staff).
  - Social Welfare (MSWDO): chart Chasmalin G. Francisco; directory Nenita Jaring.
  - General Services: chart Kelvin John R. Santos (OIC); directory Abraham Jonson.
- Planning: the chart spells the name "Eigbert", the directory "Eighbert". The chart spelling is used.

Left empty on purpose: Business Permit and Licensing (the chart's only named person is a Licensing Officer III, not clearly the head), Market Office (a Market Supervisor I), Tourism, PESO (directory names someone, no chart read), Population, Legal, PDAO (no chart). The Mayor and Vice Mayor are on the Elected Officials page.

## Barangay captains (`src/data/directory/barangays.json`)

`officials` holds the Punong Barangay, **names only**, from the Municipality's directory page (`officials_source`, `officials_checked`). The page says "as listed in the Municipality's directory" and that barangay and SK elections were scheduled for 2 November 2026, so the names may change.

- Single source. The second source (barangaydirectory.com) returned 503 for all 23 pages, so nothing was cross-checked. Earlier search snippets hinted at different names for San Pedro (Ronald Rivera Jorge) and Santo Cristo (Jose Sampang Sanchez) than the directory (Carlos J. Waje Jr., Leonardo J. Cruz Jr.). Unresolved; confirm these two first.
- Cataning and Saba match the same hints. Alfonso M. Cortez (Sacrifice Valley) is also the ABC president on the Elected Officials page.
- The directory lists the same phone number for Saba and Sacrifice Valley, and some irregular numbers. That is one reason phones are not used.
- The directory spells Balsic "Balsik" in places; our slugs and names are used.
- After the elections, update the names and the `officials_checked` date, and remove the elections sentence in `src/pages/government/barangays/[barangay].tsx` and `scripts/lib/content.cjs`.

## Barangay maps (`map_pdf` in `barangays.json`)

https://www.hermosa.gov.ph/about-2/barangays/ links one PDF per barangay under `/wp-content/uploads/2021/03/`. Each is a one-page image, created 2021-03-20. The Tipo map was viewed: a "Parcellary Map of Barangay Tipo" with the political boundary, made from OpenStreetMap, the Municipal Planning and Development Office, Geoportal, NAMRIA and DENR data. It contains no personal data. All 23 URLs were checked with HEAD requests (all return a PDF, about 190 to 260 KB); only Tipo was opened, so the other 22 are assumed to be the same kind of map.

The pages link to the Municipality's file; the PDFs are not copied into this repository.

## Use of the source

The Municipality's footer says both "Copyright © 2020 ... All rights reserved" and "All content is public domain unless otherwise stated". Facts, names and links are used with a source link, and no documents or prose are copied. Under the Philippine IP Code, works of the government are not copyrighted, but exploitation for profit needs prior approval; this project is non-profit. A written okay from the Municipality would settle it.

## Updating

Re-read the pages above, edit the JSON, keep the check dates current, and validate:

```bash
node scripts/validate-json-schema.js src/data/directory/schema/departments.schema.json src/data/directory/departments.json
node scripts/validate-json-schema.js src/data/directory/schema/barangays.schema.json src/data/directory/barangays.json
```

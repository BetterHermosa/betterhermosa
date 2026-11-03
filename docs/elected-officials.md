# Elected officials data

The `/government/elected-officials` page is built from two files:

- `src/data/directory/executive.json`: the Mayor and Vice Mayor.
- `src/data/directory/legislative.json`: the Sangguniang Bayan (8 councilors, the three ex-officio members, the Secretary) and its committees.

The page finds the council by a slug that starts with `sangguniang-bayan` (currently `sangguniang-bayan-2025-2028`). When the term changes, add a new entry with the new term's slug rather than renaming the old one. The page used to look for the Los Baños slug `12th-sangguniang-bayan`, which hid the whole council; do not reintroduce a hard-coded slug.

## Where the data comes from

Checked on 2026-11-03 against the Municipality's own pages:

- https://www.hermosa.gov.ph/government/elected-officials/ lists the Mayor, Vice Mayor, 8 councilors and the three ex-officio members (IPMR, ABC president, SK Federation president). The page has typos ("LFONSO", "PRIDENT"); the data uses the correct spellings.
- Two Vice Mayor's Office charts made by the Hermosa Public Information Office in February 2026 (`wp-content/uploads/2026/03/VICE-MAYORS-OFFICE-SANGGUNIANG-BAYAN-STAFF.pdf` and `...-LEGISLATIVE.pdf`) list the same members and name the Secretary of the Sangguniang Bayan, Atty. Joseph Mario S. Sabado.
- 2025 election winners (OpenHalalan, from COMELEC results) give the same eight councilor surnames and the same Mayor and Vice Mayor. Ballot names differ from the legal names on the Municipality's pages (for example "Boyet" for Reynaldo), so the legal names are used.

Neither page states the term years. "2025-2028" comes from the election date (May 2025) and the three-year term set by law.

## Known gaps

- **Standing committees:** not published on hermosa.gov.ph (searched the site and four org-chart PDFs; two older PDFs are scanned images and could not be read). `permanent_committees` is empty, so the committees page and the "Standing Committees" menu link stay hidden until a list is added. Ask the Sangguniang Bayan Secretary's office for the committee list; each entry needs `committee` and `chairperson`, and optionally `members`.
- **Vice Mayor email, social page and mobile number:** not published. The Mayor's office number differs on the Municipality's pages: the header says (047) 300-6550 and the footer says (047) 300-6750. The data uses 6750; confirm by calling.
- **Mayor's email:** `mayorsoffice301@gmail.com`; the directory page spells it "gmil" once, which looks like a typo.
- **Staff:** the Secretary's office staff list (about 19 names and positions) is published but not shown here.
- **Profile links:** the `personId` fields point to OpenLGU profile pages, which are off (`features.openLGU` is false), so the page does not link to them. They return when the flag is turned on.

## Updating

Edit the JSON, keep `source.retrieved` current, and validate:

```bash
node scripts/validate-json-schema.js src/data/directory/schema/legislative.schema.json src/data/directory/legislative.json
```

The council, Secretary and (once added) committees also feed the prerendered page, `llms-full.txt` and `data/hermosa.json` through `scripts/lib/content.cjs`.

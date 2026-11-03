# Barangay map

A schematic map of Hermosa's 23 barangays. It appears on `/government/barangays` (click a barangay to open its page), on each barangay page (that barangay highlighted), and on `/budget` (shaded by the number of national projects, click to filter).

## Source

"Philippine Barangay Boundaries (Hierarchical GeoJSON)" from the BetterGov Open Data Portal (https://data.bettergov.ph/datasets/23, MIT licence). It is a GitHub release of `bendlikeabamboo/barangay-boundaries-repository`, derived from PSA Philippine Standard Geographic Code snapshots and NAMRIA administrative boundaries. Hermosa is selected by its municipality code (`PH0300805`), not by name.

The shapes are heavily simplified (4 to 16 points each), so they show where things are but not exact borders, and there are gaps between neighbours. The page says "Simplified shapes for orientation, not for surveying" and credits the source.

## How it works

- Data: `src/data/geo/hermosa-barangays.json` (17 KB, committed). Each feature carries the barangay `slug` from `src/data/directory/barangays.json`.
- Component: `src/components/government/BarangayMap.tsx`. It draws plain inline SVG with a simple projection, so there is no map library and no third-party tile requests. Every barangay is a focusable link or button (Enter/Space work), and `<title>` and `aria-label` give its name and count.
- The map is an extra: every fact is also available as text on the same pages.

## Regenerating

```bash
python scripts/extract_boundaries.py            # downloads the ~8 MB release zip
python scripts/extract_boundaries.py bundle.zip # or use a local copy
```

The script stops if the number of polygons differs from the directory or a barangay cannot be matched to a slug.

## Props

`hrefFor(slug)` opens a page, `onSelect(slug)` calls a handler instead (used by the `/budget` filter), `selected` draws the strong outline, and `counts` shades by count (steps: none, 1, 2-3, 4-6, 7+) and adds a legend.

## Known limits

- The smallest barangays are small on a phone screen. The lists on each page are the reliable way to reach every barangay.
- Hermosa's real outline is smoother than these shapes. If a better boundary file becomes available, re-run the script with it; the component does not depend on the shape detail.

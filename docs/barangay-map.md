# Barangay map

A schematic map of Hermosa's 23 barangays. It appears on `/government/barangays` (click a barangay to open its page), on each barangay page (that barangay highlighted), and on `/budget` (shaded by the number of national projects, click to filter).

## Source

"Philippine Barangay Boundaries (Hierarchical GeoJSON)" from the BetterGov Open Data Portal (https://data.bettergov.ph/datasets/23, MIT licence). It is a GitHub release of `bendlikeabamboo/barangay-boundaries-repository`, derived from PSA Philippine Standard Geographic Code snapshots and NAMRIA administrative boundaries. Hermosa is selected by its municipality code (`PH0300805`), not by name.

The shapes are heavily simplified (4 to 16 points each), so they show where things are but not exact borders, and there are gaps between neighbours. A search found no finer source: OpenStreetMap has no barangay boundaries for Hermosa, and the other portal dataset (OSSPhilippines/geoph) is only about twice as detailed. The map therefore draws the shapes as translucent overlays on a street map, and the page says "borders are approximate: for orientation, not for surveying" and credits both sources.

## How it works

- Data: `src/data/geo/hermosa-barangays.json` (17 KB, committed). Each feature carries the barangay `slug` from `src/data/directory/barangays.json`.
- `src/components/government/BarangayMap.tsx` is the component the pages use. It lazy-loads `BarangayMapLeaflet.tsx` (Leaflet through `react-leaflet`), so Leaflet only downloads on pages that show a map. It also renders the legend, the loading placeholder and the credits.
- Basemap: OpenStreetMap tiles (`tile.openstreetmap.org`), the same provider as the weather map on the home page. OpenStreetMap's tile policy allows modest use with attribution; if traffic grows, switch to a tile provider that suits it.
- Shape colours come from the theme variables in `src/index.css` (`.barangay-map .barangay-shape`, with shading steps `lvl-0` to `lvl-4`). Leaflet's own colours are overridden there.
- The map refits to Hermosa whenever its container changes size (`FitBounds`), because the page can finish its layout after the map is created.
- Keyboard and touch: every shape gets `tabindex`, `role="link"` and an `aria-label`, and Enter or Space chooses it. Zoom buttons are 44 px. On touch screens one-finger dragging is off so the page still scrolls; two-finger pinch and the zoom buttons work.
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

- Borders are approximate and can sit visibly off the streets underneath. If a better boundary file becomes available, re-run the script with it; the component does not depend on the shape detail.
- The smallest barangays are small on a phone screen. The lists on each page are the reliable way to reach every barangay.
- Tiles are loaded from a third party, so a visitor's browser contacts OpenStreetMap when a map is shown. If the tiles fail to load the shapes still draw on a blank background.

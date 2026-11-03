#!/usr/bin/env python3
"""
Extract Hermosa's barangay boundaries into src/data/geo/hermosa-barangays.json.

Source: the "Philippine Barangay Boundaries (Hierarchical GeoJSON)" dataset
(https://data.bettergov.ph, dataset 23; MIT licence), a GitHub release of
https://github.com/bendlikeabamboo/barangay-boundaries-repository derived from
PSA Philippine Standard Geographic Code snapshots and NAMRIA administrative
boundaries.

    python scripts/extract_boundaries.py            # downloads the ~8 MB zip
    python scripts/extract_boundaries.py bundle.zip # or use a local copy

Hermosa is selected by its PSGC municipality code (not by name) and each
feature gets the slug of the matching barangay in
src/data/directory/barangays.json. The script stops if a barangay cannot be
matched or the count is not the number of barangays in the directory.
"""

import io
import json
import re
import sys
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "data" / "geo" / "hermosa-barangays.json"
DIRECTORY = ROOT / "src" / "data" / "directory" / "barangays.json"

RELEASE = "v2026.4.13.0"
ZIP_URL = (
    "https://github.com/bendlikeabamboo/barangay-boundaries-repository/releases/download/"
    f"{RELEASE}/barangay-boundaries-2023-10-24-hierarchical.zip"
)
MUNICIPALITY_PCODE = "PH0300805"  # Hermosa, Bataan


def norm(name):
    name = re.sub(r"\(.*?\)", "", name)
    return re.sub(r"[^a-z0-9]", "", name.lower())


def main():
    if len(sys.argv) > 1:
        data = Path(sys.argv[1]).read_bytes()
    else:
        req = urllib.request.Request(ZIP_URL, headers={"User-Agent": "BetterHermosa-build/1.0"})
        data = urllib.request.urlopen(req, timeout=300).read()

    with zipfile.ZipFile(io.BytesIO(data)) as z:
        features = json.loads(z.read("barangays.geojson"))["features"]

    mine = [f for f in features if f["properties"].get("ADM3_PCODE") == MUNICIPALITY_PCODE]
    directory = json.loads(DIRECTORY.read_text(encoding="utf-8"))
    by_norm = {norm(b["barangay_name"]): b for b in directory}

    if len(mine) != len(directory):
        sys.exit(f"Found {len(mine)} polygons for {MUNICIPALITY_PCODE}, directory has {len(directory)} barangays")

    out = []
    for f in sorted(mine, key=lambda f: f["properties"]["ADM4_EN"]):
        props = f["properties"]
        match = by_norm.get(norm(props["ADM4_EN"]))
        if not match:
            sys.exit(f"No directory barangay matches {props['ADM4_EN']!r}")
        out.append(
            {
                "type": "Feature",
                "properties": {
                    "slug": match["slug"],
                    "name": match["barangay_name"],
                    "psgc": props["psgc_code"],
                    "areaSqKm": round(props["AREA_SQKM"], 2),
                },
                "geometry": f["geometry"],
            }
        )

    slugs = [f["properties"]["slug"] for f in out]
    if len(set(slugs)) != len(slugs):
        sys.exit("Two polygons matched the same barangay")

    collection = {
        "type": "FeatureCollection",
        "meta": {
            "source": "Philippine Barangay Boundaries (Hierarchical GeoJSON), via the BetterGov Open Data Portal",
            "sourceUrl": "https://data.bettergov.ph/datasets/23",
            "release": RELEASE,
            "licence": "MIT",
            "attribution": "Boundaries: PSA Philippine Standard Geographic Code and NAMRIA administrative boundaries, compiled in the barangay-boundaries-repository (MIT).",
            "note": "Simplified shapes for orientation, not for surveying.",
            "municipalityPsgc": MUNICIPALITY_PCODE,
        },
        "features": out,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(collection, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {OUT.relative_to(ROOT)}: {len(out)} barangays, {OUT.stat().st_size} bytes")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Extract Hermosa's DPWH contracts into public/data/dpwh-hermosa.json.

Source: "DPWH Infrastructure Transparency Dataset" (CC0), dataset 19 on the
BetterGov Open Data Portal (https://data.bettergov.ph/datasets/19), a parquet
file on Hugging Face (bettergovph/dpwh-transparency-data).

    pip install pyarrow
    python scripts/extract_dpwh.py                 # downloads the ~24 MB file
    python scripts/extract_dpwh.py file.parquet    # or use a local copy

The dataset has no municipality field (its "province" column holds the
district engineering office), so a contract is kept when its description names
Hermosa, it is in Region III, and its district engineering office is not a
different one that only shares the name (for example a school named
"Hilario E. Hermosa" in Nueva Ecija). The script stops if the result looks
wrong. `amountPaid` is zero on every row of the source, so it is not kept.
"""

import json
import re
import sys
import urllib.request
from datetime import date
from pathlib import Path

import pyarrow.parquet as pq

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "data" / "dpwh-hermosa.json"
DIRECTORY = ROOT / "src" / "data" / "directory" / "barangays.json"
CONFIG = json.loads((ROOT / "config" / "lgu.config.json").read_text(encoding="utf-8"))

URL = "https://huggingface.co/datasets/bettergovph/dpwh-transparency-data/resolve/main/dpwh_transparency_data.parquet?download=true"
PAGE = "https://data.bettergov.ph/datasets/19"

# A contract is ours when it is in this region and one of these offices.
REGION = "Region III"
OFFICES = {"Bataan 1st DEO", "Region III"}

# Spellings in DPWH titles that differ from the directory names.
ALIASES = {
    "a-rivera": ["a. rivera", "a rivera"],
    "burgos-soliman": ["burgos", "soliman"],
    "jrc-mandama": ["judge roman cruz", "mandama"],
    "balsic": ["balsic", "balsik"],
    "maite": ["maite", "maete", "malte"],
    "pandatung": ["pandatung", "pandatun"],
    "sto-cristo": ["santo cristo", "sto. cristo", "sto cristo"],
}

CATEGORY = {
    "Roads": "road",
    "Bridges": "bridge",
    "Flood Control and Drainage": "flood-control",
    "Buildings and Facilities": "building",
    "Buildings": "building",
}


def mentions_hermosa(text):
    return bool(re.search(r"hermosa", text, re.I)) and not re.search(r"villa\s?hermosa", text, re.I)


def barangay_of(title, directory):
    lower = title.lower()
    best = None
    for b in directory:
        aliases = ALIASES.get(b["slug"]) or [re.sub(r"\(.*?\)", "", b["barangay_name"]).strip().lower()]
        for alias in aliases:
            m = re.search(r"(?<![a-z])" + re.escape(alias) + r"(?![a-z])", lower)
            if m and (best is None or m.start() < best[1] or (m.start() == best[1] and len(alias) > best[2])):
                best = (b["slug"], m.start(), len(alias))
    return best[0] if best else None


def iso(d):
    return d.isoformat() if d else None


def main():
    if len(sys.argv) > 1:
        path = Path(sys.argv[1])
    else:
        path = ROOT / "dpwh_transparency_data.parquet.tmp"
        req = urllib.request.Request(URL, headers={"User-Agent": "BetterHermosa-build/1.0"})
        path.write_bytes(urllib.request.urlopen(req, timeout=600).read())

    try:
        rows = pq.read_table(path).to_pylist()
    finally:
        if len(sys.argv) <= 1 and path.exists():
            path.unlink()

    directory = json.loads(DIRECTORY.read_text(encoding="utf-8"))
    kept = []
    for r in rows:
        desc = r["description"] or ""
        loc = r["location"] or {}
        if not mentions_hermosa(desc):
            continue
        if loc.get("region") != REGION or loc.get("province") not in OFFICES:
            continue
        kept.append(
            {
                "id": r["contractId"],
                "title": " ".join(desc.split()),
                "category": CATEGORY.get(r["category"], "other"),
                "status": r["status"],
                "budget": round(r["budget"], 2) if r["budget"] is not None else None,
                "progress": round(r["progress"], 2) if r["progress"] is not None else None,
                "contractor": r["contractor"] or None,
                "startDate": iso(r["startDate"]),
                "completionDate": iso(r["completionDate"]),
                "year": r["infraYear"],
                "program": r["programName"] or None,
                "fundSource": r["sourceOfFunds"] or None,
                "office": loc.get("province"),
                "barangay": barangay_of(desc, directory),
                "lat": r["latitude"],
                "lon": r["longitude"],
            }
        )

    ids = [p["id"] for p in kept]
    if len(set(ids)) != len(ids):
        sys.exit("Duplicate contract ids in the result")
    if not 100 <= len(kept) <= 400:
        sys.exit(f"Unexpected number of contracts: {len(kept)}")

    kept.sort(key=lambda p: (p["year"] or "", p["budget"] or 0), reverse=True)
    out = {
        "meta": {
            "lgu": CONFIG["lgu"]["name"],
            "source": "DPWH Infrastructure Transparency Dataset, via the BetterGov Open Data Portal",
            "sourceUrl": PAGE,
            "licence": "CC0 1.0",
            "retrieved": date.today().isoformat(),
            "count": len(kept),
            "notes": [
                "Contracts are matched by the word Hermosa in the DPWH description, within Region III. A contract that does not name Hermosa is not listed.",
                "Status, progress and amounts are as published by DPWH and may be out of date or inconsistent (for example a contract can show 100% progress and still be On-Going).",
                "Amount paid is not shown: the source reports zero for every contract.",
            ],
        },
        "projects": kept,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    total = sum(p["budget"] or 0 for p in kept)
    assigned = sum(1 for p in kept if p["barangay"])
    print(f"Wrote {OUT.relative_to(ROOT)}: {len(kept)} contracts, budget {total:,.2f}, {assigned} with a barangay")


if __name__ == "__main__":
    main()

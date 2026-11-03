#!/usr/bin/env python3
"""
Extract Hermosa's rows from the BLGF Local Government Unit Fiscal Data
spreadsheets into src/data/finances/hermosa.json.

BLGF's site blocks scripted downloads, so download the files in a browser
and pass the folder that holds them:

    pip install openpyxl
    python scripts/extract_blgf.py <folder>

Expected files (from https://blgf.gov.ph/lgu-fiscal-data/, also listed on
https://data.bettergov.ph, dataset 9):
    By-LGU-ARI-and-Dependencies-2024.xlsx
    By-LGU-SRE-2024.xlsx
    FY2024-LDRRMF-by-LGU.xlsx

Every column is checked against its header text, so a changed layout fails
loudly instead of writing wrong numbers.

The ARI sheet is labelled "In Php Million" but its values are whole pesos
(the components add up to the total as pesos), so values are kept as pesos.
"""

import json
import sys
from datetime import date
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "data" / "finances" / "hermosa.json"
CONFIG = json.loads((ROOT / "config" / "lgu.config.json").read_text(encoding="utf-8"))
LGU = CONFIG["lgu"]["name"]
PROVINCE = CONFIG["lgu"]["province"]

PAGE = "https://blgf.gov.ph/lgu-fiscal-data/"
BASE = "https://blgf.gov.ph/wp-content/uploads/"
FILES = {
    "ari": ("By-LGU-ARI-and-Dependencies-2024.xlsx", BASE + "2025/06/By-LGU-ARI-and-Dependencies-2024.xlsx"),
    "sre": ("By-LGU-SRE-2024.xlsx", BASE + "2025/08/By-LGU-SRE-2024.xlsx"),
    "ldrrmf": ("FY2024-LDRRMF-by-LGU.xlsx", BASE + "2025/06/FY2024-LDRRMF-by-LGU.xlsx"),
}


def load(folder, key):
    name = FILES[key][0]
    path = folder / name
    if not path.exists():
        sys.exit(f"Missing {path}")
    ws = openpyxl.load_workbook(path, read_only=True, data_only=True).worksheets[0]
    return list(ws.iter_rows(values_only=True))


def find_row(rows, name_col, province_col):
    hits = [r for r in rows if r[name_col] == LGU and r[province_col] == PROVINCE]
    if len(hits) != 1:
        sys.exit(f"Expected one {LGU}, {PROVINCE} row, found {len(hits)}")
    return hits[0]


def header_text(rows, col, header_rows):
    parts = []
    for i in header_rows:
        cell = rows[i - 1][col] if col < len(rows[i - 1]) else None
        if isinstance(cell, str):
            parts.append(" ".join(cell.split()))
    return " > ".join(parts).lower()


def picker(rows, row, header_rows):
    def pick(col, expect):
        text = header_text(rows, col, header_rows)
        if expect.lower() not in text:
            sys.exit(f"Column {col} header {text!r} does not contain {expect!r}")
        value = row[col]
        return float(value) if value is not None else 0.0

    return pick


def money(x):
    return round(x, 2)


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    folder = Path(sys.argv[1])

    # --- ARI: header rows 7-10, LGU name col 3, province col 2 (0-based) ---
    rows = load(folder, "ari")
    pick = picker(rows, find_row(rows, 3, 2), (7, 8, 9, 10))
    ari = {
        "tax": {
            "realPropertyTax": pick(5, "real property tax"),
            "businessTax": pick(6, "tax on business"),
            "otherTaxes": pick(7, "other taxes"),
            "total": pick(8, "total tax revenue"),
        },
        "nonTax": {
            "regulatoryFees": pick(9, "regulatory fees"),
            "serviceCharges": pick(10, "service/user charges"),
            "economicEnterprises": pick(11, "economic enterprises"),
            "total": pick(12, "total non-tax revenue"),
        },
        "locallySourcedRevenue": pick(13, "total locally - sourced revenue"),
        "interestIncome": pick(14, "interest income"),
        "nationalTaxAllotment": pick(15, "national tax allotment"),
        "otherShares": {
            "economicZone": pick(16, "economic zone"),
            "evat": pick(17, "share from evat"),
            "nationalWealth": pick(18, "national wealth"),
            "pagcorPcsoLotto": pick(19, "pagcor"),
            "tobaccoExciseTax": pick(20, "tobacco"),
            "others": pick(21, "others"),
            "total": pick(22, "total other shares"),
        },
        "total": pick(23, "annual regular income"),
        "dependency": {
            "locallySourced": pick(24, "lsr dependency"),
            "nationalTaxAllotment": pick(25, "nta dependency"),
            "otherShares": pick(26, "other shares from national tax dependency"),
        },
    }
    parts = (
        ari["locallySourcedRevenue"]
        + ari["interestIncome"]
        + ari["nationalTaxAllotment"]
        + ari["otherShares"]["total"]
    )
    if abs(parts - ari["total"]) > 1:
        sys.exit(f"ARI components {parts} do not add up to total {ari['total']}")

    # --- SRE: header rows 7-11, LGU name col 3, province col 2 ---
    rows = load(folder, "sre")
    pick = picker(rows, find_row(rows, 3, 2), (7, 8, 9, 10, 11))
    sre = {
        "income": {
            "localSources": pick(16, "total local sources"),
            "nationalTaxAllotment": pick(17, "national tax allotment"),
            "externalSources": pick(21, "total external sources"),
            "total": pick(22, "total current operating income"),
        },
        "operatingExpenditures": {
            "generalPublicServices": pick(23, "general public services"),
            "education": pick(24, "education, culture"),
            "health": pick(25, "health, nutrition"),
            "laborAndEmployment": pick(26, "labor and employment"),
            "housing": pick(27, "housing and community"),
            "socialWelfare": pick(28, "social services and social welfare"),
            "socialServicesTotal": pick(29, "total social services"),
            "economicServices": pick(30, "economic services"),
            "debtServiceInterest": pick(31, "debt service"),
            "total": pick(32, "total current operating expenditures"),
        },
        "netOperatingIncome": pick(33, "net operating income"),
        "capitalOutlay": pick(43, "purchase/ construct of property"),
        "loanAmortization": pick(47, "payment of loan amortization"),
        "totalNonOperatingExpenditures": pick(51, "total non-operating expenditures"),
        "netChangeInFunds": pick(52, "net increase/ (decrease) in funds"),
        "cashBalanceBeginning": pick(53, "cash balance, beginning"),
        "cashBalanceEnd": pick(57, "fund/ cash balance, end"),
    }
    if abs(
        sre["income"]["localSources"] + sre["income"]["externalSources"] - sre["income"]["total"]
    ) > 1:
        sys.exit("SRE income parts do not add up to the total")
    if abs(
        sre["income"]["total"] - sre["operatingExpenditures"]["total"] - sre["netOperatingIncome"]
    ) > 1:
        sys.exit("SRE net operating income does not match income minus expenditures")

    # --- LDRRMF: header rows 8-9, LGU name col 4, province col 3 ---
    rows = load(folder, "ldrrmf")
    pick = picker(rows, find_row(rows, 4, 3), (8, 9))
    ldrrmf = {
        "seventyPercent": pick(5, "70% ldrrmf"),
        "quickResponseFund": pick(7, "30% quick response fund"),
        "total": pick(9, "total"),
    }
    if abs(ldrrmf["seventyPercent"] + ldrrmf["quickResponseFund"] - ldrrmf["total"]) > 1:
        sys.exit("LDRRMF parts do not add up to the total")

    def clean(o):
        if isinstance(o, dict):
            return {k: clean(v) for k, v in o.items()}
        return money(o) if o > 1 or o == 0 else round(o, 6)

    out = {
        "meta": {
            "lgu": LGU,
            "province": PROVINCE,
            "fiscalYear": 2024,
            "status": "Preliminary",
            "currency": "PHP",
            "scale": "pesos",
            "publisher": "Bureau of Local Government Finance (BLGF), Department of Finance",
            "attribution": "Source: Bureau of Local Government Finance (BLGF). Figures are based on the Statement of Receipts and Expenditures reports submitted by local governments and are preliminary.",
            "extractedBySource": "March 17, 2025",
            "extractedOn": date.today().isoformat(),
            "page": PAGE,
            "sources": [
                {"key": k, "file": f, "url": u} for k, (f, u) in FILES.items()
            ],
        },
        "ari": clean(ari),
        "sre": clean(sre),
        "ldrrmf": clean(ldrrmf),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {OUT.relative_to(ROOT)}: ARI {ari['total']:,.2f}, income {sre['income']['total']:,.2f}")


if __name__ == "__main__":
    main()

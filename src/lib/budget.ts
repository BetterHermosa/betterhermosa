import { useEffect, useState } from 'react';

import barangaysData from '@/data/directory/barangays.json';
import { formatPesoAdaptive } from '@/lib/format';

export type ProjectType =
  'road' | 'flood-control' | 'building' | 'farm-to-market' | 'other';

export interface GaaProject {
  id: string;
  title: string;
  department: string;
  barangay: string | null;
  type: ProjectType;
  amounts: Record<string, number>;
}

export interface HgabRow {
  id: string;
  title: string;
  barangay: string | null;
  type: ProjectType;
  statusLabel: string;
  nep: number | null;
  house: number | null;
  url: string | null;
}

export interface Disclaimer {
  id: string;
  title: string;
  body: string;
  url: string;
}

export interface BudgetSnapshot {
  meta: {
    fetchedAt: string;
    source: string;
    gaaYears: number[];
    disclaimers: Disclaimer[];
  };
  gaa: GaaProject[];
  hgab: {
    fiscalYear: number;
    datasets: { key: string; label: string; rows: HgabRow[] }[];
  };
}

export const TYPE_LABELS: Record<ProjectType, string> = {
  road: 'Roads & bridges',
  'flood-control': 'Flood control & drainage',
  building: 'Buildings',
  'farm-to-market': 'Farm-to-market roads',
  other: 'Other',
};

export const barangayName = (slug: string | null) => {
  if (!slug) return 'Not specified';
  const found = barangaysData.find(b => b.slug === slug);
  return found ? found.barangay_name.replace(/\s*\(.*?\)/, '') : slug;
};

export const peso = (n: number | null) =>
  n == null ? '—' : formatPesoAdaptive(n).fullString;

export const latestYear = (p: GaaProject) =>
  Math.max(...Object.keys(p.amounts).map(Number));

// Mirrors the barangay branch in scripts/lib/content.cjs — keep the sorting
// and wording of the two in sync.
export const projectsForBarangay = (data: BudgetSnapshot, slug: string) =>
  data.gaa
    .filter(p => p.barangay === slug)
    .sort(
      (a, b) =>
        latestYear(b) - latestYear(a) ||
        (b.amounts[latestYear(b)] || 0) - (a.amounts[latestYear(a)] || 0)
    );

export const houseRowsOf = (data: BudgetSnapshot) =>
  data.hgab.datasets.flatMap(d => d.rows);

let snapshot: Promise<BudgetSnapshot> | null = null;

// One shared request for every component that needs the snapshot.
export function loadBudget(): Promise<BudgetSnapshot> {
  if (!snapshot) {
    snapshot = fetch('/data/budget-hermosa.json')
      .then(res => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<BudgetSnapshot>;
      })
      .catch(err => {
        snapshot = null;
        throw err;
      });
  }
  return snapshot;
}

export function useBudget() {
  const [data, setData] = useState<BudgetSnapshot | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadBudget()
      .then(setData)
      .catch(() => setError(true));
  }, []);

  return { data, error };
}

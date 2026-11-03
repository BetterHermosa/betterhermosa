import { useEffect, useState } from 'react';

import { formatPesoAdaptive } from '@/lib/format';

export type DpwhCategory =
  'road' | 'bridge' | 'flood-control' | 'building' | 'other';

export interface DpwhContract {
  id: string;
  title: string;
  category: DpwhCategory;
  status: string;
  budget: number | null;
  progress: number | null;
  contractor: string | null;
  startDate: string | null;
  completionDate: string | null;
  year: string | null;
  program: string | null;
  fundSource: string | null;
  office: string | null;
  barangay: string | null;
  lat: number | null;
  lon: number | null;
}

export interface DpwhSnapshot {
  meta: {
    source: string;
    sourceUrl: string;
    licence: string;
    retrieved: string;
    count: number;
    notes: string[];
  };
  projects: DpwhContract[];
}

export const CATEGORY_LABELS: Record<DpwhCategory, string> = {
  road: 'Roads',
  bridge: 'Bridges',
  'flood-control': 'Flood control & drainage',
  building: 'Buildings',
  other: 'Other',
};

export const peso = (n: number | null) =>
  n == null ? '—' : formatPesoAdaptive(n).fullString;

export const statusVariant = (
  status: string
): 'success' | 'primary' | 'yellow' | 'slate' | 'error' => {
  switch (status) {
    case 'Completed':
      return 'success';
    case 'On-Going':
      return 'primary';
    case 'For Procurement':
      return 'yellow';
    case 'Terminated':
      return 'error';
    default:
      return 'slate';
  }
};

const KEEP = new Set([
  'DPWH',
  'CSSP',
  'MVUC',
  'SCTEX',
  'GAA',
  'DEO',
  'LGU',
  'DEPED',
  'BEFF',
  'SIPAG',
  'ROLL',
  'IT',
  'II',
  'III',
  'IV',
  'HS',
  'PH',
  'NLEX',
  'SBMA',
]);
const SMALL = new Set([
  'of',
  'and',
  'the',
  'to',
  'for',
  'in',
  'at',
  'on',
  'from',
  'with',
]);

// DPWH titles are ALL CAPS with abbreviations; make them readable without
// breaking acronyms and codes.
export function prettify(text: string): string {
  return text
    .split(/(\s+)/)
    .map((token, i) => {
      if (/^\s+$/.test(token) || !token) return token;
      const letters = token.replace(/[^A-Za-z]/g, '');
      if (/\d/.test(token) || KEEP.has(letters)) return token;
      const lower = token.toLowerCase();
      if (i > 0 && SMALL.has(letters.toLowerCase())) return lower;
      return lower.replace(/[a-z]/, c => c.toUpperCase());
    })
    .join('');
}

let snapshot: Promise<DpwhSnapshot> | null = null;

export function loadDpwh(): Promise<DpwhSnapshot> {
  if (!snapshot) {
    snapshot = fetch('/data/dpwh-hermosa.json')
      .then(res => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<DpwhSnapshot>;
      })
      .catch(err => {
        snapshot = null;
        throw err;
      });
  }
  return snapshot;
}

export function useDpwh() {
  const [data, setData] = useState<DpwhSnapshot | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadDpwh()
      .then(setData)
      .catch(() => setError(true));
  }, []);

  return { data, error };
}

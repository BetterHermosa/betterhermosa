#!/usr/bin/env node

/**
 * Snapshots national-government projects located in Hermosa from the
 * Philippine Budget Data API (https://budget.bettergov.ph/docs) into
 * public/data/budget-hermosa.json. Runs as part of `npm run build`; if the API
 * is unreachable the previous snapshot is kept and the build continues.
 *
 * Matching is by place name only: the API has no municipality field, so a
 * project that doesn't say "Hermosa" in its title is not found.
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'data', 'budget-hermosa.json');

const { config, barangays } = require('./lib/routes.cjs');

const API = 'https://budget.bettergov.ph/api/v1';
const GAA_YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026];
const HEADERS = {
  'User-Agent': `${config.portal.name}-build/1.0 (+${config.portal.baseUrl})`,
};

async function get(pathAndQuery) {
  const res = await fetch(API + pathAndQuery, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} ${pathAndQuery}`);
  return res.json();
}

// "Villahermosa" barangays elsewhere and "Hermosa, Dasol" (Pangasinan) are
// the name collisions seen in the API; anything naming another province
// right after "Hermosa," is dropped.
const isHermosaBataan = text =>
  /hermosa/i.test(text) &&
  !/villa\s?hermosa/i.test(text) &&
  !/hermosa,\s*(?!bataan)[a-z]/i.test(text) &&
  /bataan|region iii|hermosa (poblacion|economic|ecozone)/i.test(text);

const BARANGAY_ALIASES = {
  'a-rivera': ['a. rivera', 'a rivera'],
  'burgos-soliman': ['burgos', 'soliman'],
  'jrc-mandama': ['judge roman cruz', 'mandama'],
  mambog: ['mambog'],
  balsic: ['balsic', 'balsik'],
  maite: ['maite', 'maete', 'malte'],
  pandatung: ['pandatung', 'pandatun'],
  'sto-cristo': ['santo cristo', 'sto. cristo', 'sto cristo'],
};

const aliasList = barangays.flatMap(b => {
  const base = b.barangay_name
    .replace(/\(.*?\)/g, '')
    .trim()
    .toLowerCase();
  const aliases = BARANGAY_ALIASES[b.slug] || [base];
  return aliases.map(alias => ({ slug: b.slug, name: b.barangay_name, alias }));
});

function barangayOf(title) {
  const lower = title.toLowerCase();
  let best = null;
  for (const { slug, alias } of aliasList) {
    const m = new RegExp(
      `(?<![a-z])${alias.replace(/[.]/g, '\\.')}(?![a-z])`
    ).exec(lower);
    if (!m) continue;
    if (
      !best ||
      m.index < best.index ||
      (m.index === best.index && alias.length > best.len)
    ) {
      best = { slug, index: m.index, len: alias.length };
    }
  }
  return best ? best.slug : null;
}

function typeOf(title) {
  const t = title.toLowerCase();
  if (
    /multi-?\s?purpose|covered court|barangay hall|evacuation|building|hall\b/.test(
      t
    )
  )
    return 'building';
  if (/\bfmr\b|farm.to.market/.test(t)) return 'farm-to-market';
  if (/road|bridge|street|expressway|bypass|by-pass|\brd\b/.test(t))
    return 'road';
  if (/flood|revetment|river|slope protection|drainage|waterway|dike/.test(t))
    return 'flood-control';
  return 'other';
}

async function fetchGaa() {
  const byKey = new Map();
  for (const year of GAA_YEARS) {
    const res = await get(`/gaa/search?q=hermosa&limit=100&year=${year}`);
    const withAmount = res.data.filter(r => r.years[String(year)].amount > 0);
    if (res.data.length >= 100 && withAmount.length >= 100) {
      console.warn(
        `⚠️  GAA ${year}: result cap reached, some projects may be missing`
      );
    }
    for (const r of res.data) {
      if (!isHermosaBataan(r.name)) continue;
      const amounts = {};
      for (const y of GAA_YEARS) {
        const a = r.years[String(y)].amount;
        if (a > 0) amounts[y] = a;
      }
      if (!Object.keys(amounts).length) continue;
      byKey.set(r.fam_key, {
        id: r.fam_key,
        title: r.name,
        department: r.department,
        barangay: barangayOf(r.name),
        type: typeOf(r.name),
        amounts,
      });
    }
  }
  return [...byKey.values()].sort(
    (a, b) => (b.amounts[2026] || 0) - (a.amounts[2026] || 0)
  );
}

async function fetchHgab(key, label, region) {
  const rows = [];
  let offset = 0;
  let sums = null;
  let disclaimers = [];
  for (;;) {
    const qs = `q=hermosa&limit=200&offset=${offset}${region ? `&region=${region}` : ''}`;
    const res = await get(`/hgab/2027/datasets/${key}/projects?${qs}`);
    sums = res.data.sums;
    disclaimers = res.disclaimers || disclaimers;
    rows.push(...res.data.rows);
    if (res.data.next_offset == null) break;
    offset = res.data.next_offset;
  }
  const kept = rows.filter(r => isHermosaBataan(r.title));
  return {
    key,
    label,
    disclaimers,
    sums,
    rows: kept.map(r => ({
      id: r.id,
      title: r.title,
      barangay: barangayOf(r.title),
      type: typeOf(r.title),
      status: r.trace,
      statusLabel: r.status_label,
      nep: r.nep_php ?? null,
      house: r.house_php ?? null,
      url: r.url || null,
    })),
  };
}

async function main() {
  const [gaa, dpwh, fmr] = await Promise.all([
    fetchGaa(),
    fetchHgab('dpwh', 'DPWH infrastructure', 'III'),
    fetchHgab('fmr', 'DA farm-to-market roads'),
  ]);
  const overview = await get('/hgab/2027');

  const out = {
    meta: {
      fetchedAt: new Date().toISOString(),
      source: 'https://budget.bettergov.ph',
      apiBase: API,
      gaaYears: GAA_YEARS,
      counts: { gaa: gaa.length, dpwh: dpwh.rows.length, fmr: fmr.rows.length },
      notice: overview.meta?.notice || null,
      disclaimers: overview.disclaimers || [],
    },
    gaa,
    hgab: { fiscalYear: 2027, datasets: [dpwh, fmr] },
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
  console.log(
    `✅ Budget snapshot: ${gaa.length} GAA projects, ${dpwh.rows.length} DPWH + ${fmr.rows.length} FMR House bill rows`
  );
}

main().catch(err => {
  if (fs.existsSync(OUT)) {
    console.warn(
      `⚠️  Budget API unavailable (${err.message}); keeping the previous snapshot`
    );
  } else {
    console.error(
      `❌ Budget snapshot failed and no previous snapshot exists: ${err.message}`
    );
    process.exit(1);
  }
});

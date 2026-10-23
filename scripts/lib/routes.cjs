/**
 * Single source of truth for the public, crawlable routes of the portal and
 * their SEO metadata. Used by generate-sitemap.js (sitemap.xml, robots.txt,
 * llms.txt) and prerender-heads.cjs (static <head> per route).
 *
 * Static route titles/descriptions come from src/data/seo-metadata.json (the
 * same file the client-side <SEO> component reads); detail routes are derived
 * from the directory/services data with the formulas in src/lib/seoTemplates.ts.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const readJson = rel =>
  JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));

const config = readJson('config/lgu.config.json');
const seoMeta = readJson('src/data/seo-metadata.json');
const departments = readJson('src/data/directory/departments.json');
const barangays = readJson('src/data/directory/barangays.json');
const executive = readJson('src/data/directory/executive.json');
const legislative = readJson('src/data/directory/legislative.json');
const servicesFile = readJson('src/data/services/services.json');
const services = Array.isArray(servicesFile)
  ? servicesFile
  : servicesFile.services || [];

const TOKENS = {
  'portal.name': config.portal.name,
  'portal.domain': config.portal.domain,
  'portal.baseUrl': config.portal.baseUrl,
  'lgu.name': config.lgu.name,
  'lgu.fullName': config.lgu.fullName,
  'lgu.province': config.lgu.province,
  'lgu.type': config.lgu.type,
  'lgu.adjective':
    config.lgu.type === 'city'
      ? 'City'
      : config.lgu.type === 'province'
        ? 'Provincial'
        : 'Municipal',
};

const resolveTokens = text =>
  text.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, key) => TOKENS[key] ?? key);

const place = `${config.lgu.name}, ${config.lgu.province}`;

// Mirrors the detail-page <SEO> props in the React pages.
const detail = {
  barangay: b => ({
    title: `Barangay ${b.barangay_name}, ${place} | ${config.portal.name}`,
    description: `Contact details, barangay hall address and officials of Barangay ${b.barangay_name} in ${place}.`,
  }),
  department: d => ({
    title: `${toTitleCase(d.office_name)}, ${place} | ${config.portal.name}`,
    description: `Contact numbers, email, address and services of the ${toTitleCase(d.office_name)} of the ${config.lgu.fullName}, ${config.lgu.province}.`,
  }),
  service: s => ({
    title: `${s.service} in ${place} | ${config.portal.name}`,
    description: serviceDescription(s.service, s.description),
  }),
};

// Port of toTitleCase in src/lib/stringUtils.ts — keep the two in sync.
const MINOR_WORDS = ['of', 'and', 'the', 'in', 'for', 'on', 'with'];
const ACRONYMS = [
  'GAD',
  'BPLO',
  'MDRRMO',
  'ICT',
  'MSWDO',
  'MPDC',
  'HR',
  'BFP',
  'PNP',
  'RHU',
];
function toTitleCase(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      const upperWord = word.toUpperCase();
      if (ACRONYMS.includes(upperWord)) return upperWord;
      if (MINOR_WORDS.includes(word) && index !== 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function serviceDescription(name, desc = '') {
  const suffix = `Requirements, steps and office for ${name} in ${place}.`;
  if (desc.length <= 140) return `${desc} ${suffix}`.trim();
  return desc.length <= 200 ? desc : desc.slice(0, 199).trimEnd() + '…';
}

function staticMeta(routePath) {
  let entry = seoMeta[routePath];
  if (!entry || typeof entry !== 'object') return {};
  if (!entry.title && entry._default) entry = entry._default;
  return {
    title: entry.title && resolveTokens(entry.title),
    description: entry.description && resolveTokens(entry.description),
  };
}

const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/government/elected-officials', priority: '0.9' },
  { path: '/government/departments', priority: '0.9' },
  { path: '/government/barangays', priority: '0.9' },
  { path: '/services', priority: '0.9', changefreq: 'weekly' },
  { path: '/about', priority: '0.6' },
  { path: '/contact', priority: '0.6' },
  { path: '/data/weather', priority: '0.5', changefreq: 'daily' },
  { path: '/contribute', priority: '0.4' },
  { path: '/accessibility', priority: '0.3' },
  { path: '/sitemap', priority: '0.3' },
];

const FEATURE_ROUTES = {
  statistics: [
    '/government/statistics',
    '/government/statistics/population',
    '/government/statistics/municipal-income',
    '/government/statistics/competitiveness',
  ],
  transparency: [
    '/transparency',
    '/transparency/financial',
    '/transparency/procurement',
    '/transparency/infrastructure',
  ],
  openLGU: ['/openlgu'],
};

function getRoutes() {
  const routes = STATIC_ROUTES.map(r => ({
    changefreq: 'monthly',
    ...r,
    ...staticMeta(r.path),
  }));

  for (const [flag, paths] of Object.entries(FEATURE_ROUTES)) {
    if (!config.features?.[flag]) continue;
    for (const p of paths) {
      routes.push({
        path: p,
        priority: '0.7',
        changefreq: 'monthly',
        ...staticMeta(p),
      });
    }
  }

  for (const d of departments) {
    if (!d.slug) continue;
    routes.push({
      path: `/government/departments/${d.slug}`,
      priority: '0.7',
      changefreq: 'monthly',
      breadcrumbs: [
        ['Departments', '/government/departments'],
        [toTitleCase(d.office_name), `/government/departments/${d.slug}`],
      ],
      ...detail.department(d),
    });
  }
  for (const b of barangays) {
    if (!b.slug) continue;
    routes.push({
      path: `/government/barangays/${b.slug}`,
      priority: '0.7',
      changefreq: 'monthly',
      breadcrumbs: [
        ['Barangays', '/government/barangays'],
        [b.barangay_name, `/government/barangays/${b.slug}`],
      ],
      ...detail.barangay(b),
    });
  }
  for (const s of services) {
    if (!s.slug) continue;
    routes.push({
      path: `/services/${s.slug}`,
      priority: '0.8',
      changefreq: 'monthly',
      breadcrumbs: [
        ['Services', '/services'],
        [s.service, `/services/${s.slug}`],
      ],
      ...detail.service(s),
    });
  }

  return routes;
}

module.exports = {
  config,
  departments,
  barangays,
  executive,
  legislative,
  services,
  getRoutes,
  resolveTokens,
  toTitleCase,
};

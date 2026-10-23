#!/usr/bin/env node

/**
 * Generates public/sitemap.xml, public/robots.txt and public/llms.txt from the
 * LGU config and directory data. Runs as part of `npm run build`.
 *
 * Route list and metadata live in scripts/lib/routes.cjs (shared with
 * prerender-heads.cjs).
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, '..', 'public');

const {
  config,
  departments,
  barangays,
  executive,
  legislative,
  services,
  getRoutes,
  toTitleCase,
} = require('./lib/routes.cjs');
const { fullMarkdown, dataFeed } = require('./lib/content.cjs');

const baseUrl = config.portal.baseUrl.replace(/\/$/, '');
const today = new Date().toISOString().slice(0, 10);
const routes = getRoutes();

const xmlEscape = s =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function sitemapXml() {
  const urls = routes.map(
    r => `  <url>
    <loc>${xmlEscape(baseUrl + r.path)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  );
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
}

function robotsTxt() {
  return `User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${baseUrl}/sitemap.xml
`;
}

function llmsTxt() {
  const { lgu, portal } = config;
  const lines = [
    `# ${portal.name}`,
    '',
    `> ${portal.description} Volunteer-run and open source; part of the BetterGov.ph network. Not an official government website — the official site is ${lgu.officialWebsite}.`,
    '',
    '## Key pages',
    '',
  ];
  for (const r of routes.filter(r => !r.breadcrumbs)) {
    lines.push(`- [${r.title || r.path}](${baseUrl}${r.path})`);
  }

  lines.push('', '## Elected officials', '');
  for (const e of executive) {
    lines.push(`- ${e.role}: ${e.name}`);
  }
  for (const chamber of legislative) {
    for (const o of chamber.officials || []) {
      lines.push(`- ${o.role}: ${o.name}`);
    }
  }

  lines.push('', '## Offices and departments', '');
  for (const d of departments) {
    lines.push(
      `- [${toTitleCase(d.office_name)}](${baseUrl}/government/departments/${d.slug})`
    );
  }

  lines.push('', '## Barangays', '');
  for (const b of barangays) {
    lines.push(
      `- [${b.barangay_name}](${baseUrl}/government/barangays/${b.slug})`
    );
  }

  if (services.length) {
    lines.push('', '## Services', '');
    for (const s of services) {
      lines.push(`- [${s.service}](${baseUrl}/services/${s.slug})`);
    }
  }

  lines.push(
    '',
    '## Machine-readable',
    '',
    `- [Full content as one text file](${baseUrl}/llms-full.txt)`,
    `- [All directory and service data as JSON](${baseUrl}/data/hermosa.json)`
  );

  lines.push(
    '',
    '## Source and contributions',
    '',
    `- Source code and data: ${portal.githubUrl}`,
    `- Contact: ${portal.contactEmail}`,
    ''
  );
  return lines.join('\n');
}

fs.mkdirSync(path.join(PUBLIC, 'data'), { recursive: true });
fs.writeFileSync(
  path.join(PUBLIC, 'data', 'hermosa.json'),
  JSON.stringify(dataFeed(), null, 2) + '\n',
  'utf8'
);

for (const [file, content] of [
  ['llms-full.txt', fullMarkdown()],
  ['sitemap.xml', sitemapXml()],
  ['robots.txt', robotsTxt()],
  ['llms.txt', llmsTxt()],
]) {
  fs.writeFileSync(path.join(PUBLIC, file), content, 'utf8');
}
console.log(
  `✅ Wrote sitemap.xml (${routes.length} URLs), robots.txt, llms.txt, llms-full.txt, data/hermosa.json for ${baseUrl}`
);

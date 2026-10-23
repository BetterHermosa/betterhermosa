/**
 * Plain-content renderers for crawlers and AI agents that don't run
 * JavaScript. The same directory/services data drives:
 *   - bodyHtml(route)  -> semantic HTML injected into <div id="root"> by
 *                         prerender-heads.cjs (React replaces it on boot)
 *   - fullMarkdown()   -> public/llms-full.txt
 *   - dataFeed()       -> public/data/hermosa.json
 */
const {
  config,
  departments,
  barangays,
  executive,
  legislative,
  services,
  toTitleCase,
} = require('./routes.cjs');

const homeHeading = require('../../public/locales/en/common.json').hero.title;
const baseUrl = config.portal.baseUrl.replace(/\/$/, '');
const place = `${config.lgu.name}, ${config.lgu.province}`;

const esc = s =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const label = k =>
  k
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase()
    .replace(/^./, c => c.toUpperCase());

const arr = v => (Array.isArray(v) ? v : v ? [v] : []);
const link = (href, text) => `<a href="${esc(href)}">${esc(text)}</a>`;
const ul = items =>
  items.length ? `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>` : '';

const isUnverified = s =>
  s.needsVerification === true ||
  arr(s.sources).some(x => /pending/i.test(x.name || ''));

const UNVERIFIED_NOTE =
  'Unverified: this entry is a draft based on the 2025 Citizen’s Charter and has not yet been confirmed with the office. Check requirements and fees with the office before you go.';

const NAV = [
  ['/government/elected-officials', 'Elected officials'],
  ['/government/departments', 'Offices and departments'],
  ['/government/barangays', 'Barangays'],
  ['/services', 'Services'],
  ['/about', 'About'],
  ['/contact', 'Contact'],
];

function contactLines(o) {
  const phones = arr(o.trunkline || o.phone);
  return [
    o.address && `Address: ${esc(o.address)}`,
    phones.length && `Phone: ${phones.map(esc).join(', ')}`,
    o.email && `Email: ${esc(o.email)}`,
    o.website && `Website: ${link(o.website, o.website)}`,
  ].filter(Boolean);
}

function officials() {
  const rows = executive.map(
    e => `${esc(e.role)}: ${esc(e.name)} (${esc(e.office || '')})`
  );
  for (const c of legislative) {
    for (const o of c.officials || [])
      rows.push(`${esc(o.role)}: ${esc(o.name)}`);
  }
  return ul(rows);
}

function body(route) {
  const p = route.path;
  const h1 =
    p === '/'
      ? homeHeading // must match the rendered H1 (hero.title in common.json)
      : (route.title || route.path).split(' | ')[0];
  let main = '';

  if (p === '/') {
    main =
      `<p>${esc(route.description)}</p>` +
      `<p>${esc(config.lgu.fullName)} official website: ${link(config.lgu.officialWebsite, config.lgu.officialWebsite)}. ${esc(config.portal.name)} is a volunteer-run, independent portal and is not an official government website.</p>` +
      `<h2>Elected officials</h2>${officials()}` +
      `<h2>Browse</h2>${ul(NAV.map(([h, t]) => link(h, t)))}`;
  } else if (p === '/government/elected-officials') {
    main = `<p>${esc(route.description)}</p>${officials()}${ul(contactLines(executive[0]))}`;
  } else if (p === '/government/departments') {
    main =
      `<p>${esc(route.description)}</p>` +
      ul(
        departments.map(d => {
          const bits = [
            d.trunkline?.length && arr(d.trunkline).join(', '),
            d.email,
          ].filter(Boolean);
          return (
            link(
              `/government/departments/${d.slug}`,
              toTitleCase(d.office_name)
            ) + (bits.length ? ` — ${esc(bits.join(' · '))}` : '')
          );
        })
      );
  } else if (p === '/government/barangays') {
    main =
      `<p>${esc(route.description)}</p>` +
      ul(
        barangays.map(b =>
          link(`/government/barangays/${b.slug}`, b.barangay_name)
        )
      );
  } else if (p === '/services') {
    main =
      `<p>${esc(route.description)}</p>` +
      ul(
        services.map(
          s =>
            link(`/services/${s.slug}`, s.service) +
            (s.description ? ` — ${esc(s.description)}` : '')
        )
      );
  } else if (p.startsWith('/government/departments/')) {
    const d = departments.find(x => p.endsWith('/' + x.slug));
    const related = services.filter(s => arr(s.officeSlug).includes(d.slug));
    main =
      `<p>${esc(route.description)}</p>${ul(contactLines(d))}` +
      (d.department_head?.name
        ? `<p>Head of office: ${esc(d.department_head.name)}</p>`
        : '') +
      (related.length
        ? `<h2>Services</h2>${ul(related.map(s => link(`/services/${s.slug}`, s.service)))}`
        : '') +
      `<p>${link('/government/departments', 'All offices and departments')}</p>`;
  } else if (p.startsWith('/government/barangays/')) {
    const b = barangays.find(x => p.endsWith('/' + x.slug));
    main =
      `<p>${esc(route.description)}</p>${ul(contactLines(b))}` +
      (b.officials?.length
        ? `<h2>Officials</h2>${ul(b.officials.map(o => `${esc(o.role)}: ${esc(o.name)}`))}`
        : '') +
      `<p>${link('/government/barangays', 'All barangays of ' + config.lgu.name)}</p>`;
  } else if (p.startsWith('/services/')) {
    const s = services.find(x => p.endsWith('/' + x.slug));
    const offices = arr(s.officeSlug)
      .map(slug => departments.find(d => d.slug === slug))
      .filter(Boolean);
    main =
      `<p>${esc(s.description)}</p>` +
      (isUnverified(s)
        ? `<p><strong>${esc(UNVERIFIED_NOTE)}</strong></p>`
        : '') +
      (offices.length
        ? `<p>Office: ${offices.map(d => link(`/government/departments/${d.slug}`, toTitleCase(d.office_name))).join(', ')}</p>`
        : '') +
      (s.requirements?.length
        ? `<h2>Requirements</h2>${ul(s.requirements.map(esc))}`
        : '') +
      (s.steps?.length
        ? `<h2>Steps</h2><ol>${s.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol>`
        : '') +
      (s.quickInfo
        ? `<h2>Quick info</h2>${ul(Object.entries(s.quickInfo).map(([k, v]) => `${esc(label(k))}: ${esc(v)}`))}`
        : '') +
      (s.faqs?.length
        ? `<h2>FAQ</h2>${s.faqs.map(f => `<h3>${esc(f.question)}</h3><p>${esc(f.answer)}</p>`).join('')}`
        : '') +
      `<p>${link('/services', 'All services')}</p>`;
  } else {
    main = `<p>${esc(route.description || '')}</p>`;
  }

  return { h1, main };
}

/** HTML placed inside <div id="root"> for non-JS readers. */
function bodyHtml(route) {
  const { h1, main } = body(route);
  return (
    `<header><p>${link('/', config.portal.name)} · ${esc(place)}</p>` +
    `<nav>${NAV.map(([h, t]) => link(h, t)).join(' · ')}</nav></header>` +
    `<main><h1>${esc(h1)}</h1>${main}</main>` +
    `<footer><p>${esc(config.portal.name)} is an independent, volunteer-run community portal for the ${esc(config.lgu.fullName)}, ${esc(config.lgu.province)}. Source: ${link(config.portal.githubUrl, config.portal.githubUrl)}</p></footer>`
  );
}

function fullMarkdown() {
  const L = [];
  const phones = o => arr(o.trunkline || o.phone).join(', ');
  L.push(`# ${config.portal.name} — full content`, '');
  L.push(
    `> Everything published on ${baseUrl} for the ${config.lgu.fullName}, ${config.lgu.province}. Independent, volunteer-run portal; not an official government website. Official site: ${config.lgu.officialWebsite}.`,
    '',
    '## Elected officials',
    ''
  );
  for (const e of executive)
    L.push(
      `- ${e.role}: ${e.name} — ${e.office || ''}, ${phones(e)}, ${e.email || ''}`
        .replace(/, ,/g, ',')
        .replace(/,\s*$/, '')
    );
  for (const c of legislative) {
    L.push('', `### ${c.chamber}`, '');
    for (const o of c.officials || []) L.push(`- ${o.role}: ${o.name}`);
  }
  L.push('', '## Offices and departments', '');
  for (const d of departments) {
    L.push(
      `### ${toTitleCase(d.office_name)}`,
      `URL: ${baseUrl}/government/departments/${d.slug}`,
      `Address: ${d.address || ''}`
    );
    if (phones(d)) L.push(`Phone: ${phones(d)}`);
    if (d.email) L.push(`Email: ${d.email}`);
    if (d.department_head?.name) L.push(`Head: ${d.department_head.name}`);
    L.push('');
  }
  L.push('## Barangays', '');
  for (const b of barangays) {
    L.push(
      `- ${b.barangay_name} — ${b.address || ''} (${baseUrl}/government/barangays/${b.slug})`
    );
  }
  L.push('', '## Services', '');
  for (const s of services) {
    L.push(
      `### ${s.service}`,
      `URL: ${baseUrl}/services/${s.slug}`,
      s.description || ''
    );
    if (isUnverified(s)) L.push(`NOTE: ${UNVERIFIED_NOTE}`);
    if (s.requirements?.length)
      L.push('Requirements:', ...s.requirements.map(r => `- ${r}`));
    if (s.steps?.length)
      L.push('Steps:', ...s.steps.map((r, i) => `${i + 1}. ${r}`));
    if (s.quickInfo)
      L.push(
        ...Object.entries(s.quickInfo).map(([k, v]) => `${label(k)}: ${v}`)
      );
    L.push('');
  }
  return L.join('\n') + '\n';
}

function dataFeed() {
  return {
    generatedAt: new Date().toISOString().slice(0, 10),
    note: `Independent community data for the ${config.lgu.fullName}, ${config.lgu.province}. Not an official source; services marked unverified are drafts.`,
    source: baseUrl,
    lgu: config.lgu,
    executive,
    legislative,
    departments,
    barangays,
    services: services.map(s => ({ ...s, unverified: isUnverified(s) })),
  };
}

// Mirrors src/lib/structuredData.ts — keep the two in sync.
function jsonLdFor(route) {
  const { lgu, portal, location } = config;
  const out = [];
  if (route.path === '/') {
    const id = `${baseUrl}/#municipality`;
    out.push({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'GovernmentOrganization',
          '@id': id,
          name: lgu.fullName,
          url: lgu.officialWebsite,
          address: {
            '@type': 'PostalAddress',
            addressLocality: lgu.name,
            addressRegion: lgu.province,
            addressCountry: 'PH',
          },
          geo: {
            '@type': 'GeoCoordinates',
            latitude: location.coordinates.lat,
            longitude: location.coordinates.lon,
          },
        },
        {
          '@type': 'WebSite',
          '@id': `${baseUrl}/#website`,
          name: portal.name,
          url: baseUrl,
          description: portal.description,
          inLanguage: ['en', 'fil'],
          about: { '@id': id },
          publisher: {
            '@type': 'Organization',
            name: portal.name,
            url: baseUrl,
            logo: `${baseUrl}${portal.navbarLogoPath}`,
            sameAs: [portal.githubUrl],
          },
        },
      ],
    });
  }
  if (route.path.startsWith('/government/barangays/') && route.breadcrumbs) {
    out.push({
      '@context': 'https://schema.org',
      '@type': 'AdministrativeArea',
      name: `Barangay ${route.breadcrumbs[1][0]}`,
      url: baseUrl + route.path,
      containedInPlace: {
        '@type': 'AdministrativeArea',
        name: lgu.fullName,
        containedInPlace: { '@type': 'AdministrativeArea', name: lgu.province },
      },
    });
  }
  if (route.breadcrumbs) {
    out.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: route.breadcrumbs.map(([name, url], i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name,
        item: baseUrl + url,
      })),
    });
  }
  return out;
}

module.exports = { bodyHtml, fullMarkdown, dataFeed, jsonLdFor };

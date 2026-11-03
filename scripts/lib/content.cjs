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

const fs = require('fs');
const path = require('path');

// Written by scripts/fetch-budget.js; absent on a fresh checkout before the first build.
let budget = null;
try {
  budget = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '..', '..', 'public', 'data', 'budget-hermosa.json'),
      'utf8'
    )
  );
} catch {
  budget = null;
}

let dpwh = null;
try {
  dpwh = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '..', '..', 'public', 'data', 'dpwh-hermosa.json'),
      'utf8'
    )
  );
} catch {
  dpwh = null;
}

let finances = null;
try {
  finances = JSON.parse(
    fs.readFileSync(
      path.join(
        __dirname,
        '..',
        '..',
        'src',
        'data',
        'finances',
        'hermosa.json'
      ),
      'utf8'
    )
  );
} catch {
  finances = null;
}

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
  ['/budget', 'National projects'],
  ['/finances', 'Local finances'],
  ['/transparency/infrastructure', 'DPWH contracts'],
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
    if (c.secretary)
      rows.push(`${esc(c.secretary.role)}: ${esc(c.secretary.name)}`);
  }
  return ul(rows);
}

// Mirrors src/components/government/BarangayProjects.tsx — keep the sorting
// and wording of the two in sync.
function barangayProjects(b) {
  if (!budget) return [];
  const latest = g => Math.max(...Object.keys(g.amounts).map(Number));
  return budget.gaa
    .filter(g => g.barangay === b.slug)
    .sort(
      (x, y) =>
        latest(y) - latest(x) || y.amounts[latest(y)] - x.amounts[latest(x)]
    );
}

function barangayProjectsHtml(b) {
  if (!budget) return '';
  const name = b.barangay_name.replace(/\s*\(.*?\)/, '');
  const projects = barangayProjects(b);
  const peso = n => `₱${n.toLocaleString('en-PH')}`;
  const note = `<p>These are national government projects, not the barangay’s own budget. Source: ${link(budget.meta.source, 'Philippine Budget Data API')}.</p>`;
  if (!projects.length) {
    return `<h2>National projects in ${esc(name)}</h2><p>No national projects naming ${esc(name)} were found. Matching is by place name, so a project may exist without being listed. ${link('/budget', 'See projects for all of Hermosa')}.</p>${note}`;
  }
  const years = budget.meta.gaaYears;
  const lines = budget.hgab.datasets
    .flatMap(d => d.rows)
    .filter(r => r.barangay === b.slug).length;
  return (
    `<h2>National projects in ${esc(name)}</h2>` +
    `<p>${projects.length} national-government ${projects.length === 1 ? 'project names' : 'projects name'} ${esc(name)} (FY ${years[0]}–${years[years.length - 1]}).</p>` +
    ul(
      projects.slice(0, 5).map(g => {
        const y = Math.max(...Object.keys(g.amounts).map(Number));
        return `${esc(g.title)} — FY ${y}, ${esc(peso(g.amounts[y]))}`;
      })
    ) +
    (lines
      ? `<p>${lines} ${lines === 1 ? 'line' : 'lines'} naming ${esc(name)} in the FY ${budget.hgab.fiscalYear} proposal and House bill. ${link(`/budget?barangay=${b.slug}`, 'Compare the versions')}.</p>`
      : '') +
    `<p>${link(`/budget?barangay=${b.slug}`, `See all ${projects.length} ${projects.length === 1 ? 'project' : 'projects'}`)}</p>` +
    note
  );
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
  } else if (p === '/transparency/infrastructure' && dpwh) {
    const peso = n => (n == null ? '—' : `₱${n.toLocaleString('en-PH')}`);
    const label = {
      road: 'Road',
      bridge: 'Bridge',
      'flood-control': 'Flood control and drainage',
      building: 'Building',
      other: 'Other',
    };
    const total = dpwh.projects.reduce((s, x) => s + (x.budget || 0), 0);
    const years = dpwh.projects.map(x => Number(x.year)).filter(Boolean);
    main =
      `<p>${esc(route.description)}</p>` +
      `<p>${dpwh.projects.length} contracts naming ${esc(config.lgu.name)}, FY ${Math.min(...years)} to ${Math.max(...years)}, with budgets totalling ${esc(peso(total))}. Source: ${link(dpwh.meta.sourceUrl, 'DPWH Infrastructure Transparency Dataset')} (${esc(dpwh.meta.licence)}), saved ${esc(dpwh.meta.retrieved)}. ${esc(dpwh.meta.notes.join(' '))}</p>` +
      `<h2>Contracts</h2>` +
      ul(
        dpwh.projects.map(
          x =>
            `${esc(x.title)} — ${esc(x.id)}, ${esc(label[x.category])}, FY ${esc(x.year)}, ${esc(x.status)}, budget ${esc(peso(x.budget))}${x.progress != null ? `, reported progress ${esc(x.progress)}%` : ''}${x.contractor ? `, contractor ${esc(x.contractor)}` : ''}`
        )
      );
  } else if (p === '/finances' && finances) {
    const m = finances.meta;
    const peso = n => `₱${n.toLocaleString('en-PH')}`;
    const pct = (a, b) => `${((a / b) * 100).toFixed(1)}%`;
    const { ari, sre, ldrrmf } = finances;
    const exp = sre.operatingExpenditures;
    main =
      `<p>${esc(route.description)}</p>` +
      `<p>FY ${m.fiscalYear} (${esc(m.status.toLowerCase())}). ${esc(m.attribution)} Amounts are in pesos.</p>` +
      `<h2>Where the income comes from</h2>` +
      ul([
        `Annual regular income: ${esc(peso(ari.total))}`,
        `National tax allotment: ${esc(peso(ari.nationalTaxAllotment))} (${pct(ari.nationalTaxAllotment, ari.total)})`,
        `Locally sourced revenue: ${esc(peso(ari.locallySourcedRevenue))} (${pct(ari.locallySourcedRevenue, ari.total)})`,
        `Other shares from national tax collection: ${esc(peso(ari.otherShares.total))}, of which the economic zone ${esc(peso(ari.otherShares.economicZone))}`,
        `Interest income: ${esc(peso(ari.interestIncome))}`,
      ]) +
      `<h2>What the municipality raises itself</h2>` +
      ul([
        `Real property tax: ${esc(peso(ari.tax.realPropertyTax))}`,
        `Tax on business: ${esc(peso(ari.tax.businessTax))}`,
        `Other taxes: ${esc(peso(ari.tax.otherTaxes))}`,
        `Regulatory fees: ${esc(peso(ari.nonTax.regulatoryFees))}`,
        `Service and user charges: ${esc(peso(ari.nonTax.serviceCharges))}`,
        `Receipts from economic enterprises: ${esc(peso(ari.nonTax.economicEnterprises))}`,
      ]) +
      `<h2>Current operating spending</h2>` +
      ul([
        `General public services: ${esc(peso(exp.generalPublicServices))}`,
        `Education, culture and sports: ${esc(peso(exp.education))}`,
        `Health, nutrition and population control: ${esc(peso(exp.health))}`,
        `Social services and social welfare: ${esc(peso(exp.socialWelfare))}`,
        `Labor and employment: ${esc(peso(exp.laborAndEmployment))}`,
        `Economic services: ${esc(peso(exp.economicServices))}`,
        `Interest on debt: ${esc(peso(exp.debtServiceInterest))}`,
        `Total: ${esc(peso(exp.total))}`,
      ]) +
      `<h2>Income, spending and cash</h2>` +
      ul([
        `Current operating income: ${esc(peso(sre.income.total))}`,
        `Net operating income: ${esc(peso(sre.netOperatingIncome))}`,
        `Capital outlay: ${esc(peso(sre.capitalOutlay))}`,
        `Loan amortization paid: ${esc(peso(sre.loanAmortization))}`,
        `Cash balance, end of year: ${esc(peso(sre.cashBalanceEnd))}`,
        `Disaster fund (LDRRMF): ${esc(peso(ldrrmf.total))}`,
      ]) +
      `<p>Sources: ${m.sources.map(s => link(s.url, s.file)).join(', ')}. The annual regular income and statement of receipts and expenditures use different definitions, so their totals differ. The municipality’s own annual budget is published on ${link(config.lgu.officialWebsite, config.lgu.officialWebsite)}. See also ${link('/budget', 'national projects in ' + config.lgu.name)}.</p>`;
  } else if (p === '/budget' && budget) {
    const barangayName = slug =>
      barangays.find(b => b.slug === slug)?.barangay_name || 'Hermosa-wide';
    const peso = n => (n == null ? '—' : `₱${n.toLocaleString('en-PH')}`);
    const top = budget.gaa
      .filter(g => g.amounts[2026])
      .sort((a, b) => b.amounts[2026] - a.amounts[2026]);
    const total = top.reduce((s, g) => s + g.amounts[2026], 0);
    main =
      `<p>${esc(route.description)}</p>` +
      `<p>FY 2026: ${top.length} national-government projects naming ${esc(config.lgu.name)}, totalling ${esc(peso(total))} (General Appropriations Act). These are not the municipality’s own budget. Data: ${link(budget.meta.source, 'Philippine Budget Data API')}, fetched ${esc(budget.meta.fetchedAt.slice(0, 10))}.</p>` +
      `<h2>FY 2026 projects</h2>` +
      ul(
        top.map(
          g =>
            `${esc(g.title)} — ${esc(barangayName(g.barangay))}, ${esc(g.department)}, ${esc(peso(g.amounts[2026]))}`
        )
      ) +
      `<h2>FY 2027: National Expenditure Program vs House bill</h2>` +
      budget.hgab.datasets
        .map(d =>
          ul(
            d.rows.map(
              r =>
                `${esc(r.title)} — ${esc(r.statusLabel)}; NEP ${esc(peso(r.nep))}; House bill ${esc(peso(r.house))}`
            )
          )
        )
        .join('') +
      budget.meta.disclaimers
        .map(x => `<p><strong>${esc(x.title)}</strong> ${esc(x.body)}</p>`)
        .join('');
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
        ? `<p>Head of office: ${esc(d.department_head.name)}${d.department_head.title ? `, ${esc([d.department_head.status, d.department_head.title].filter(Boolean).join(' '))}` : ''}. As shown on the Municipality’s organizational chart, checked ${esc(d.head_source?.checked || '')}.</p>`
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
        ? `<h2>Officials</h2>${ul(b.officials.map(o => `${esc(o.role)}: ${esc(o.name)}`))}` +
          (b.officials_source
            ? `<p>As listed in the ${link(b.officials_source, 'Municipality’s directory')}, checked ${esc(b.officials_checked || '')}. Barangay and Sangguniang Kabataan elections were scheduled for 2 November 2026, so this may change.</p>`
            : '')
        : '') +
      (b.map_pdf
        ? `<p>${link(b.map_pdf, 'Official barangay map (PDF) from the Municipality')}</p>`
        : '') +
      barangayProjectsHtml(b) +
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
    if (c.secretary) L.push(`- ${c.secretary.role}: ${c.secretary.name}`);
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
    if (d.department_head?.name)
      L.push(
        `Head: ${d.department_head.name}${d.department_head.title ? ` (${[d.department_head.status, d.department_head.title].filter(Boolean).join(' ')})` : ''}`
      );
    L.push('');
  }
  L.push('## Barangays', '');
  for (const b of barangays) {
    L.push(
      `- ${b.barangay_name} — ${b.address || ''} (${baseUrl}/government/barangays/${b.slug})`
    );
    const projects = barangayProjects(b);
    if (projects.length) {
      L.push(
        `  National projects naming this barangay: ${projects.length} (${baseUrl}/budget?barangay=${b.slug})`
      );
      for (const g of projects.slice(0, 5)) {
        const y = Math.max(...Object.keys(g.amounts).map(Number));
        L.push(
          `  - ${g.title} — FY ${y}, ₱${g.amounts[y].toLocaleString('en-PH')}`
        );
      }
    }
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
    budget,
    finances,
    dpwh,
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

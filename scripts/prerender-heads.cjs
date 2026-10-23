#!/usr/bin/env node

/**
 * Post-build step: writes dist/<route>/index.html for every public route with
 * a route-specific <title>, description, canonical and Open Graph tags in the
 * static HTML, so crawlers and link previews (Facebook, Messenger) that don't
 * run JavaScript get real metadata. The React app (and Helmet) still takes
 * over in the browser. Unknown routes keep falling back to the SPA shell.
 *
 * Route list and metadata: scripts/lib/routes.cjs (shared with the sitemap).
 */
const fs = require('fs');
const path = require('path');
const { config, getRoutes } = require('./lib/routes.cjs');
const { bodyHtml } = require('./lib/content.cjs');

const DIST = path.join(__dirname, '..', 'dist');
const shell = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
const baseUrl = config.portal.baseUrl.replace(/\/$/, '');
const ogImage = `${baseUrl}${config.portal.defaultOgImagePath}`;

const esc = s =>
  s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const defaults = {
  title: `${config.portal.name} | ${config.lgu.name}, ${config.lgu.province}`,
  description: `${config.portal.description} Officials, offices, barangays and services.`,
};

function render(route) {
  const title = route.title || defaults.title;
  const description = route.description || defaults.description;
  const url = baseUrl + (route.path === '/' ? '/' : route.path);

  // Drop the generic og tags already in the shell; we re-add them complete.
  let html = shell.replace(/\s*<meta\s+property="og:[^>]*>/g, '');
  html = html.replace(/<title>[\s\S]*?<\/title>/, '');
  html = html.replace(/\s*<meta\s+name="description"[^>]*>/, '');

  // data-rh lets react-helmet-async replace these tags instead of duplicating
  // them once the app boots.
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta data-rh="true" name="description" content="${esc(description)}" />`,
    `<link data-rh="true" rel="canonical" href="${url}" />`,
    `<meta data-rh="true" property="og:site_name" content="${esc(config.portal.name)}" />`,
    `<meta data-rh="true" property="og:locale" content="en_PH" />`,
    `<meta data-rh="true" property="og:type" content="website" />`,
    `<meta data-rh="true" property="og:title" content="${esc(title)}" />`,
    `<meta data-rh="true" property="og:description" content="${esc(description)}" />`,
    `<meta data-rh="true" property="og:url" content="${url}" />`,
    `<meta data-rh="true" property="og:image" content="${ogImage}" />`,
    `<meta data-rh="true" property="og:image:type" content="image/png" />`,
    `<meta data-rh="true" property="og:image:width" content="1200" />`,
    `<meta data-rh="true" property="og:image:height" content="630" />`,
    `<meta data-rh="true" name="twitter:card" content="summary_large_image" />`,
  ].join('\n    ');

  html = html.replace('</head>', `    ${tags}\n  </head>`);
  // React's createRoot replaces this content on boot; readers that don't run
  // JavaScript keep it.
  return html.replace(
    '<div id="root"></div>',
    () => `<div id="root">${bodyHtml({ ...route, title, description })}</div>`
  );
}

let count = 0;
for (const route of getRoutes()) {
  const html = render(route);
  if (route.path === '/') {
    fs.writeFileSync(path.join(DIST, 'index.html'), html);
  } else {
    const dir = path.join(DIST, route.path);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html);
  }
  count++;
}
console.log(`✅ Prerendered <head> for ${count} routes`);

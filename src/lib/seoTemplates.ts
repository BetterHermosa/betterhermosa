import { config } from './lguConfig';
import { toTitleCase } from './stringUtils';

// helpers for interpolation using config

const place = `${config.lgu.name}, ${config.lgu.province}`;

// Detail-page metadata. scripts/lib/routes.cjs mirrors these formulas for the
// sitemap and prerendered <head> — keep the two in sync.
export function barangaySeo(barangayName: string) {
  return {
    title: `Barangay ${barangayName}, ${place}`,
    description: `Contact details, barangay hall address and officials of Barangay ${barangayName} in ${place}.`,
  };
}

export function departmentSeo(officeName: string) {
  const name = toTitleCase(officeName);
  return {
    title: `${name}, ${place}`,
    description: `Contact numbers, email, address and services of the ${name} of the ${config.lgu.fullName}, ${config.lgu.province}.`,
  };
}

export function serviceSeo(serviceName: string, serviceDescription = '') {
  const suffix = `Requirements, steps and office for ${serviceName} in ${place}.`;
  let description: string;
  if (serviceDescription.length <= 140) {
    description = `${serviceDescription} ${suffix}`.trim();
  } else if (serviceDescription.length <= 200) {
    description = serviceDescription;
  } else {
    description = serviceDescription.slice(0, 199).trimEnd() + '…';
  }
  return { title: `${serviceName} in ${place}`, description };
}

export function formatStandardTitle(
  subject: string,
  portalName?: string
): string {
  return `${subject} | ${portalName || config.portal.name}`;
}

export function formatStandardDescription(
  subject: string,
  portalName?: string,
  lguFullName?: string
): string {
  const name = portalName || config.portal.name;
  const lgu = lguFullName || config.lgu.fullName;
  return `Learn more about ${subject} through ${name}, the community portal for the ${lgu}, ${config.lgu.province}.`;
}

/**
 * Resolve {{token}} placeholders in seo-metadata.json entries.
 * Called at runtime by the SEO component.
 */
const TOKEN_MAP: Record<string, string> = {
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

const TOKEN_RE = /\{\{(\w+(?:\.\w+)*)\}\}/g;

export function resolveSeoTokens(text: string): string {
  return text.replace(TOKEN_RE, (_, key) => TOKEN_MAP[key] ?? key);
}

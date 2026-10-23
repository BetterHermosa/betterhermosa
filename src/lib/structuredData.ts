import { config } from './lguConfig';

const { lgu, portal, location } = config;

const municipality = {
  '@type': 'GovernmentOrganization',
  '@id': `${portal.baseUrl}/#municipality`,
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
};

/** Home page: the municipality plus this portal as a WebSite. */
export const homeJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    municipality,
    {
      '@type': 'WebSite',
      '@id': `${portal.baseUrl}/#website`,
      name: portal.name,
      url: portal.baseUrl,
      description: portal.description,
      inLanguage: ['en', 'fil'],
      about: { '@id': municipality['@id'] },
      publisher: {
        '@type': 'Organization',
        name: portal.name,
        url: portal.baseUrl,
        logo: `${portal.baseUrl}${portal.navbarLogoPath}`,
        sameAs: [portal.githubUrl],
      },
    },
  ],
};

export function barangayJsonLd(name: string, slug: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'AdministrativeArea',
    name: `Barangay ${name}`,
    url: `${portal.baseUrl}/government/barangays/${slug}`,
    containedInPlace: {
      '@type': 'AdministrativeArea',
      name: lgu.fullName,
      containedInPlace: { '@type': 'AdministrativeArea', name: lgu.province },
    },
  };
}

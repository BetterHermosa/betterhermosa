import { useParams } from 'react-router-dom';

import {
  Briefcase,
  ExternalLink,
  GraduationCapIcon,
  MapPinIcon,
  UsersIcon,
} from 'lucide-react';

import { BarangayHeader } from '@/components/government/BarangayHeader';
import {
  OfficialCard,
  PunongBarangayCard,
} from '@/components/government/OfficialCard';
import {
  Breadcrumb,
  BreadcrumbHome,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/navigation/Breadcrumb';

import { BarangayMap } from '@/components/government/BarangayMap';
import { BarangayProjects } from '@/components/government/BarangayProjects';
import { SEO } from '@/components/layout/SEO';

import { barangaySeo } from '@/lib/seoTemplates';
import { toTitleCase } from '@/lib/stringUtils';
import { barangayJsonLd } from '@/lib/structuredData';

import barangaysData from '@/data/directory/barangays.json';

export default function BarangayDetail() {
  const { barangay: slug } = useParams();
  const barangay = barangaysData.find(b => b.slug === slug);

  if (!barangay)
    return <div className='p-20 text-center'>Barangay not found</div>;

  const punongBarangay = barangay.officials?.find(o =>
    o.role.includes('Punong Barangay')
  );
  const kagawads = barangay.officials?.filter(o =>
    o.role.includes('SB Member')
  );
  const skOfficials = barangay.officials?.filter(o => o.role.includes('SK'));
  const secretary = barangay.officials?.find(o => o.role.includes('Secretary'));
  const treasurer = barangay.officials?.find(o => o.role.includes('Treasurer'));

  const seo = barangaySeo(barangay.barangay_name);

  return (
    <div className='animate-in fade-in space-y-6 pb-20 duration-500'>
      <SEO
        title={seo.title}
        description={seo.description}
        breadcrumbs={[
          { name: 'Barangays', url: '/government/barangays' },
          {
            name: barangay.barangay_name,
            url: `/government/barangays/${barangay.slug}`,
          },
        ]}
        jsonLd={barangayJsonLd(barangay.barangay_name, barangay.slug)}
      />
      {/* Skip Link for Accessibility */}
      <a
        href='#main-content'
        className='focus:bg-kapwa-bg-surface focus:text-kapwa-text-strong focus:ring-kapwa-border-focus sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:ring-2'
      >
        Skip to main content
      </a>

      {/* --- BREADCRUMBS --- */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbHome href='/' />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href='/government/barangays'>
              Barangays
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {toTitleCase(barangay.barangay_name.replace('BARANGAY ', ''))}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* --- COMPACT IDENTITY HEADER --- */}
      <BarangayHeader barangay={barangay} />

      {/* --- OFFICIALS SECTION (Unified) --- */}
      <main id='main-content' className='space-y-6'>
        {/* Section Header */}
        <div className='border-kapwa-border-weak flex items-center gap-2 border-b pb-3'>
          <UsersIcon
            aria-hidden='true'
            className='text-kapwa-text-disabled h-4 w-4'
          />
          <h2
            id='officials-heading'
            className='kapwa-heading-md text-kapwa-text-strong'
          >
            Barangay Officials
          </h2>
        </div>

        {/* Punong Barangay */}
        {punongBarangay && (
          <div className='space-y-2' role='group' aria-label='Chief Executive'>
            <p className='sr-only'>Chief Executive</p>
            <p className='text-kapwa-text-disabled pl-1 text-[10px] font-bold tracking-widest uppercase'>
              Chief Executive
            </p>
            <PunongBarangayCard official={punongBarangay} />
            {barangay.officials_source && (
              <p className='text-kapwa-text-support pl-1 text-xs'>
                As listed in the{' '}
                <a
                  href={barangay.officials_source}
                  target='_blank'
                  rel='noreferrer'
                  className='text-kapwa-text-brand font-bold'
                >
                  Municipality&rsquo;s directory
                </a>
                , checked {barangay.officials_checked}. Barangay and Sangguniang
                Kabataan elections were scheduled for 2 November 2026, so this
                may change.
              </p>
            )}
          </div>
        )}

        {/* Sangguniang Barangay */}
        {kagawads && kagawads.length > 0 && (
          <div
            className='space-y-2'
            role='group'
            aria-label='Sangguniang Barangay'
          >
            <p className='sr-only'>Sangguniang Barangay</p>
            <p className='text-kapwa-text-disabled pl-1 text-[10px] font-bold tracking-widest uppercase'>
              Sangguniang Barangay
            </p>
            <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3'>
              {kagawads?.map(kagawad => (
                <OfficialCard
                  key={kagawad.name}
                  official={kagawad}
                  role='Barangay Kagawad'
                  icon={UsersIcon}
                />
              ))}
            </div>
          </div>
        )}

        {/* Sangguniang Kabataan */}
        {skOfficials && skOfficials.length > 0 && (
          <div
            className='space-y-2'
            role='group'
            aria-label='Sangguniang Kabataan'
          >
            <p className='sr-only'>Sangguniang Kabataan</p>
            <p className='text-kapwa-text-disabled pl-1 text-[10px] font-bold tracking-widest uppercase'>
              Sangguniang Kabataan
            </p>
            <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3'>
              {skOfficials.map(sk => (
                <OfficialCard
                  key={sk.name}
                  official={sk}
                  role={sk.role.replace('SK ', '')}
                  icon={GraduationCapIcon}
                />
              ))}
            </div>
          </div>
        )}

        {/* Barangay Administration */}
        {(secretary || treasurer) && (
          <div
            className='space-y-2'
            role='group'
            aria-label='Barangay Administration'
          >
            <p className='sr-only'>Barangay Administration</p>
            <p className='text-kapwa-text-disabled pl-1 text-[10px] font-bold tracking-widest uppercase'>
              Barangay Administration
            </p>
            <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
              {secretary && (
                <OfficialCard
                  official={secretary}
                  role='Barangay Secretary'
                  icon={Briefcase}
                />
              )}
              {treasurer && (
                <OfficialCard
                  official={treasurer}
                  role='Barangay Treasurer'
                  icon={Briefcase}
                />
              )}
            </div>
          </div>
        )}
        <section aria-labelledby='location-heading' className='space-y-3 pt-2'>
          <div className='border-kapwa-border-weak flex items-center gap-2 border-b pb-3'>
            <MapPinIcon
              aria-hidden='true'
              className='text-kapwa-text-disabled h-4 w-4'
            />
            <h2
              id='location-heading'
              className='kapwa-heading-md text-kapwa-text-strong'
            >
              Location in Hermosa
            </h2>
          </div>
          <BarangayMap
            selected={barangay.slug}
            hrefFor={s => `/government/barangays/${s}`}
            className='max-w-md'
          />
          {barangay.map_pdf && (
            <a
              href={barangay.map_pdf}
              target='_blank'
              rel='noreferrer'
              className='text-kapwa-text-brand inline-flex min-h-11 items-center gap-2 text-sm font-bold'
            >
              Official barangay map (PDF) from the Municipality
              <ExternalLink aria-hidden='true' className='h-3 w-3' />
            </a>
          )}
        </section>

        <BarangayProjects
          slug={barangay.slug}
          name={barangay.barangay_name.replace(/\s*\(.*?\)/, '')}
        />
      </main>
    </div>
  );
}

import { Link } from 'react-router-dom';

import { AlertCircle, Landmark } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';

import {
  TYPE_LABELS,
  houseRowsOf,
  latestYear,
  peso,
  projectsForBarangay,
  useBudget,
} from '@/lib/budget';

const TOP = 5;

const linkClass =
  'text-kapwa-text-brand inline-flex min-h-11 items-center text-sm font-bold';

// Mirrors the barangay branch in scripts/lib/content.cjs — keep the wording
// of the two in sync.
export function BarangayProjects({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  const { data, error } = useBudget();
  const seeAll = `/budget?barangay=${slug}`;

  const projects = data ? projectsForBarangay(data, slug) : [];
  const houseLines = data
    ? houseRowsOf(data).filter(r => r.barangay === slug).length
    : 0;

  return (
    <section
      aria-labelledby='national-projects-heading'
      className='space-y-3 pt-2'
    >
      <div className='border-kapwa-border-weak flex items-center gap-2 border-b pb-3'>
        <Landmark
          aria-hidden='true'
          className='text-kapwa-text-disabled h-4 w-4'
        />
        <h2
          id='national-projects-heading'
          className='kapwa-heading-md text-kapwa-text-strong'
        >
          National projects in {name}
        </h2>
      </div>

      {error ? (
        <p className='text-kapwa-text-support flex items-center gap-2 text-sm'>
          <AlertCircle aria-hidden='true' className='h-4 w-4 shrink-0' />
          The project data could not be loaded. Please try again later.
        </p>
      ) : !data ? (
        <div className='bg-kapwa-bg-surface-raised h-16 animate-pulse rounded-xl' />
      ) : projects.length === 0 ? (
        <p className='text-kapwa-text-support text-sm'>
          No national projects naming {name} were found. Matching is by place
          name, so a project may exist without being listed.{' '}
          <Link to='/budget' className='text-kapwa-text-brand font-bold'>
            See projects for all of Hermosa
          </Link>
          .
        </p>
      ) : (
        <>
          <p className='text-kapwa-text-support text-sm'>
            {projects.length} national-government{' '}
            {projects.length === 1 ? 'project names' : 'projects name'} {name}{' '}
            (FY {data.meta.gaaYears[0]}–{data.meta.gaaYears.at(-1)}).
          </p>
          <ul className='border-kapwa-border-weak bg-kapwa-bg-surface divide-kapwa-border-weak divide-y rounded-xl border'>
            {projects.slice(0, TOP).map(p => {
              const year = latestYear(p);
              return (
                <li
                  key={p.id}
                  className='flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between'
                >
                  <div className='min-w-0'>
                    <p className='text-kapwa-text-strong text-sm leading-snug font-bold'>
                      {p.title}
                    </p>
                    <div className='mt-2 flex flex-wrap items-center gap-2'>
                      <Badge variant='slate' className='text-[10px]'>
                        FY {year}
                      </Badge>
                      <Badge variant='primary' className='text-[10px]'>
                        {TYPE_LABELS[p.type]}
                      </Badge>
                    </div>
                  </div>
                  <p className='text-kapwa-text-strong shrink-0 font-mono text-sm font-bold sm:text-right'>
                    {peso(p.amounts[year])}
                  </p>
                </li>
              );
            })}
          </ul>
          {houseLines > 0 && (
            <p className='text-kapwa-text-support text-sm'>
              {houseLines} {houseLines === 1 ? 'line' : 'lines'} naming {name}{' '}
              in the FY {data.hgab.fiscalYear} proposal and House bill.{' '}
              <Link to={seeAll} className='text-kapwa-text-brand font-bold'>
                Compare the versions
              </Link>
              .
            </p>
          )}
          <Link to={seeAll} className={linkClass}>
            See all {projects.length}{' '}
            {projects.length === 1 ? 'project' : 'projects'} →
          </Link>
        </>
      )}

      <p className='text-kapwa-text-support text-xs'>
        These are national government projects, not the barangay&rsquo;s own
        budget. Source:{' '}
        <a
          href='https://budget.bettergov.ph'
          target='_blank'
          rel='noreferrer'
          className='text-kapwa-text-brand font-bold'
        >
          Philippine Budget Data API
        </a>
        .
      </p>
    </section>
  );
}

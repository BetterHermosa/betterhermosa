import { useEffect, useMemo, useState } from 'react';

import { Link, useSearchParams } from 'react-router-dom';

import { AlertCircle, ExternalLink, HardHat } from 'lucide-react';

import { ModuleHeader } from '@/components/layout/PageLayouts';
import { SEO } from '@/components/layout/SEO';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PaginationControls } from '@/components/ui/Pagination';
import SearchInput from '@/components/ui/SearchInput';

import barangaysData from '@/data/directory/barangays.json';
import { barangayName } from '@/lib/budget';
import {
  CATEGORY_LABELS,
  peso,
  prettify,
  statusVariant,
  useDpwh,
} from '@/lib/dpwh';
import { config } from '@/lib/lguConfig';

const selectClass =
  'border-kapwa-border-weak bg-kapwa-bg-surface text-kapwa-text-strong min-h-11 w-full rounded-lg border px-3 text-sm md:w-48';

export default function InfrastructurePage() {
  const { data, error } = useDpwh();
  const [params, setParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Filters live in the URL so a view can be shared.
  const query = params.get('q') || '';
  const year = params.get('year') || '';
  const status = params.get('status') || '';
  const category = params.get('category') || '';
  const barangay = params.get('barangay') || '';

  const setFilter = (key: string, value: string) =>
    setParams(
      prev => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true }
    );

  const filterKey = params.toString();
  useEffect(() => setPage(1), [filterKey]);

  const options = useMemo(() => {
    const projects = data?.projects ?? [];
    const uniq = (xs: (string | null)[]) =>
      [...new Set(xs.filter((x): x is string => !!x))].sort();
    return {
      years: uniq(projects.map(p => p.year)).reverse(),
      statuses: uniq(projects.map(p => p.status)),
      categories: uniq(projects.map(p => p.category)),
      barangays: barangaysData.filter(b =>
        projects.some(p => p.barangay === b.slug)
      ),
    };
  }, [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.projects ?? [])
      .filter(p => !year || p.year === year)
      .filter(p => !status || p.status === status)
      .filter(p => !category || p.category === category)
      .filter(p => !barangay || p.barangay === barangay)
      .filter(
        p =>
          !q ||
          p.title.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          (p.contractor || '').toLowerCase().includes(q)
      );
  }, [data, year, status, category, barangay, query]);

  const totalBudget = filtered.reduce((sum, p) => sum + (p.budget || 0), 0);
  const completed = filtered.filter(p => p.status === 'Completed').length;
  const latest = filtered.reduce(
    (max, p) => Math.max(max, Number(p.year) || 0),
    0
  );

  const rows = filtered.slice((page - 1) * perPage, page * perPage);

  const dashboardUrl = `https://transparency.bettergov.ph/dpwh?q=${encodeURIComponent(config.lgu.name)}`;

  return (
    <div className='animate-in fade-in mx-auto max-w-full space-y-8 px-4 pb-20 duration-500 md:px-8'>
      <SEO />
      <ModuleHeader
        title='DPWH Contracts in Hermosa'
        description={`Public works contracts of the Department of Public Works and Highways that name ${config.lgu.name}, ${config.lgu.province}: amount, status, progress and contractor as published by DPWH.`}
      >
        <SearchInput
          value={query}
          onChangeValue={v => setFilter('q', v)}
          placeholder='Search title, contract or contractor...'
          className='md:w-80'
        />
      </ModuleHeader>

      {error ? (
        <EmptyState
          title='Unavailable'
          message='The contract data could not be loaded. Please try again later.'
          icon={AlertCircle}
        />
      ) : !data ? (
        <div className='space-y-4'>
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className='bg-kapwa-bg-surface-raised h-16 animate-pulse rounded-xl'
            />
          ))}
        </div>
      ) : (
        <>
          <div className='flex flex-col gap-3 md:flex-row md:flex-wrap'>
            <select
              aria-label='Fiscal year'
              value={year}
              onChange={e => setFilter('year', e.target.value)}
              className={selectClass}
            >
              <option value=''>All years</option>
              {options.years.map(y => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select
              aria-label='Status'
              value={status}
              onChange={e => setFilter('status', e.target.value)}
              className={selectClass}
            >
              <option value=''>All statuses</option>
              {options.statuses.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              aria-label='Type of work'
              value={category}
              onChange={e => setFilter('category', e.target.value)}
              className={selectClass}
            >
              <option value=''>All types</option>
              {options.categories.map(c => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c as keyof typeof CATEGORY_LABELS] ?? c}
                </option>
              ))}
            </select>
            <select
              aria-label='Barangay'
              value={barangay}
              onChange={e => setFilter('barangay', e.target.value)}
              className={selectClass}
            >
              <option value=''>All barangays</option>
              {options.barangays.map(b => (
                <option key={b.slug} value={b.slug}>
                  {barangayName(b.slug)}
                </option>
              ))}
            </select>
          </div>

          <dl className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
            {[
              ['Contracts', String(filtered.length)],
              ['Total budget', peso(totalBudget)],
              ['Completed (as published)', String(completed)],
              ['Latest year', latest ? String(latest) : '—'],
            ].map(([label, value]) => (
              <div
                key={label}
                className='border-kapwa-border-weak bg-kapwa-bg-surface rounded-xl border p-4'
              >
                <dt className='text-kapwa-text-disabled text-[10px] font-bold tracking-widest uppercase'>
                  {label}
                </dt>
                <dd className='text-kapwa-text-strong mt-1 text-xl font-black'>
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          {filtered.length === 0 ? (
            <EmptyState
              title='No contracts found'
              message='Try other filters or a different search.'
              icon={HardHat}
            />
          ) : (
            <div className='border-kapwa-border-weak bg-kapwa-bg-surface overflow-hidden rounded-xl border shadow-sm'>
              <ul className='divide-kapwa-border-weak divide-y'>
                {rows.map(p => (
                  <li key={p.id}>
                    <Link
                      to={`/transparency/infrastructure/${p.id}`}
                      className='hover:bg-kapwa-bg-surface-raised/50 flex flex-col gap-2 px-4 py-4 transition-colors sm:flex-row sm:items-start sm:justify-between sm:px-6'
                    >
                      <div className='min-w-0'>
                        <p className='text-kapwa-text-strong line-clamp-3 text-sm leading-snug font-bold'>
                          {prettify(p.title)}
                        </p>
                        <div className='mt-2 flex flex-wrap items-center gap-2'>
                          <Badge
                            variant={statusVariant(p.status)}
                            className='text-[10px]'
                          >
                            {p.status}
                          </Badge>
                          <Badge variant='primary' className='text-[10px]'>
                            {CATEGORY_LABELS[p.category]}
                          </Badge>
                          <span className='text-kapwa-text-support text-xs'>
                            {p.year} · {p.id}
                            {p.barangay ? ` · ${barangayName(p.barangay)}` : ''}
                          </span>
                        </div>
                      </div>
                      <div className='shrink-0 sm:text-right'>
                        <p className='text-kapwa-text-strong font-mono text-sm font-bold'>
                          {peso(p.budget)}
                        </p>
                        {p.progress != null && (
                          <p className='text-kapwa-text-support text-xs'>
                            {p.progress.toFixed(0)}% reported progress
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <PaginationControls
                currentPage={page}
                totalPages={Math.ceil(filtered.length / perPage)}
                resultsPerPage={perPage}
                totalItems={filtered.length}
                onPageChange={setPage}
                onResultsPerPageChange={n => {
                  setPerPage(n);
                  setPage(1);
                }}
              />
            </div>
          )}

          <section className='bg-kapwa-bg-surface-raised text-kapwa-text-support space-y-2 rounded-xl p-4 text-sm sm:p-6'>
            <h2 className='text-kapwa-text-strong font-bold'>
              About this data
            </h2>
            <p>
              Contract details come from the{' '}
              <a
                href={data.meta.sourceUrl}
                target='_blank'
                rel='noreferrer'
                className='text-kapwa-text-brand font-bold'
              >
                DPWH Infrastructure Transparency Dataset
              </a>{' '}
              on the BetterGov Open Data Portal ({data.meta.licence}), saved on{' '}
              {data.meta.retrieved}. {data.meta.notes.join(' ')} See also{' '}
              <Link to='/budget' className='text-kapwa-text-brand font-bold'>
                National Projects
              </Link>{' '}
              for budget lines, and the{' '}
              <a
                href={dashboardUrl}
                target='_blank'
                rel='noreferrer'
                className='text-kapwa-text-brand inline-flex items-center gap-1 font-bold'
              >
                national DPWH dashboard <ExternalLink className='h-3 w-3' />
              </a>
              .
            </p>
          </section>
        </>
      )}
    </div>
  );
}

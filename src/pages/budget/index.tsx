import { useEffect, useMemo, useState } from 'react';

import { Link, useSearchParams } from 'react-router-dom';

import { AlertCircle, ExternalLink, FileText, Wallet } from 'lucide-react';

import { BarangayMap } from '@/components/government/BarangayMap';
import { SEO } from '@/components/layout/SEO';
import { ModuleHeader } from '@/components/layout/PageLayouts';
import { Badge } from '@/components/ui/Badge';
import { CardGrid } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PaginationControls } from '@/components/ui/Pagination';
import SearchInput from '@/components/ui/SearchInput';
import { StatCard } from '@/components/ui/StatCard';

import barangaysData from '@/data/directory/barangays.json';
import {
  TYPE_LABELS,
  barangayName,
  houseRowsOf,
  latestYear,
  peso,
  projectsForBarangay,
  useBudget,
} from '@/lib/budget';
import { config } from '@/lib/lguConfig';

const selectClass =
  'border-kapwa-border-weak bg-kapwa-bg-surface text-kapwa-text-strong min-h-11 w-full rounded-lg border px-3 text-sm md:w-48';

export default function BudgetPage() {
  const { data, error } = useBudget();
  const [params, setParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Filters live in the URL so a barangay page can link to its own list.
  const barangayParam = params.get('barangay') || '';
  const barangay = barangaysData.some(b => b.slug === barangayParam)
    ? barangayParam
    : '';
  const typeParam = params.get('type') || '';
  const type = typeParam in TYPE_LABELS ? typeParam : '';
  const query = params.get('q') || '';

  const years = useMemo(
    () => (data ? [...data.meta.gaaYears].reverse().map(String) : []),
    [data]
  );
  // Without an explicit year, open on the newest year that has projects for
  // the chosen barangay (not an empty FY2026).
  const defaultYear = useMemo(() => {
    if (!data) return '2026';
    if (!barangay) return String(data.meta.gaaYears.at(-1));
    const first = projectsForBarangay(data, barangay)[0];
    return first
      ? String(latestYear(first))
      : String(data.meta.gaaYears.at(-1));
  }, [data, barangay]);
  const yearParam = params.get('year') || '';
  const year = years.includes(yearParam) ? yearParam : defaultYear;

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

  // Everything except the barangay filter, so the map can still shade the
  // other barangays while one is selected.
  const yearMatches = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.gaa
      .filter(p => (p.amounts[year] || 0) > 0)
      .filter(p => !type || p.type === type)
      .filter(p => !q || p.title.toLowerCase().includes(q));
  }, [data, year, type, query]);

  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const p of yearMatches) {
      if (p.barangay) out[p.barangay] = (out[p.barangay] || 0) + 1;
    }
    return out;
  }, [yearMatches]);

  const filtered = useMemo(
    () =>
      yearMatches
        .filter(p => !barangay || p.barangay === barangay)
        .sort((a, b) => (b.amounts[year] || 0) - (a.amounts[year] || 0)),
    [yearMatches, barangay, year]
  );

  const yearTotal = filtered.reduce(
    (sum, p) => sum + (p.amounts[year] || 0),
    0
  );

  const byBarangay = useMemo(() => {
    const totals = new Map<string, { count: number; amount: number }>();
    for (const p of filtered) {
      const key = p.barangay || '';
      const cur = totals.get(key) || { count: 0, amount: 0 };
      totals.set(key, {
        count: cur.count + 1,
        amount: cur.amount + (p.amounts[year] || 0),
      });
    }
    return [...totals.entries()].sort((a, b) => b[1].amount - a[1].amount);
  }, [filtered, year]);

  const houseRows = useMemo(
    () =>
      data
        ? houseRowsOf(data).filter(r => !barangay || r.barangay === barangay)
        : [],
    [data, barangay]
  );
  const sumVersion = (key: 'nep' | 'house') =>
    houseRows.reduce((sum, r) => sum + (r[key] || 0), 0);

  const pageRows = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className='animate-in fade-in mx-auto max-w-full space-y-8 px-4 pb-20 duration-500 md:px-8'>
      <SEO />
      <ModuleHeader
        title={`National Projects in ${config.lgu.name}`}
        description={`Roads, flood control and buildings funded in the national budget (General Appropriations Act) that name ${config.lgu.name}, ${config.lgu.province}. This is not the municipality's own budget.`}
      >
        <SearchInput
          value={query}
          onChangeValue={v => setFilter('q', v)}
          placeholder='Search projects...'
          className='md:w-72'
        />
      </ModuleHeader>

      {error ? (
        <EmptyState
          title='Unavailable'
          message='The budget data could not be loaded. Please try again later.'
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
          <div className='flex flex-col gap-3 md:flex-row'>
            <select
              aria-label='Fiscal year'
              value={year}
              onChange={e => setFilter('year', e.target.value)}
              className={selectClass}
            >
              {years.map(y => (
                <option key={y} value={y}>
                  FY {y}
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
              {barangaysData.map(b => (
                <option key={b.slug} value={b.slug}>
                  {barangayName(b.slug)}
                </option>
              ))}
            </select>
            <select
              aria-label='Project type'
              value={type}
              onChange={e => setFilter('type', e.target.value)}
              className={selectClass}
            >
              <option value=''>All types</option>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <section className='space-y-3'>
            <h2 className='text-kapwa-text-strong text-xl font-black'>
              Map by barangay, FY {year}
            </h2>
            <p className='text-kapwa-text-support text-sm'>
              Shaded by the number of projects naming each barangay. Choose a
              barangay to filter the list; choose it again to clear.
            </p>
            <BarangayMap
              counts={counts}
              selected={barangay || null}
              onSelect={slug =>
                setFilter('barangay', slug === barangay ? '' : slug)
              }
              className='max-w-2xl'
            />
          </section>

          <CardGrid columns={4}>
            <StatCard
              label={`FY ${year} projects`}
              value={filtered.length}
              subtext='Matching the filters'
              icon={FileText}
              iconBg='bg-kapwa-bg-surface-raised text-kapwa-text-strong'
            />
            <StatCard
              label={`FY ${year} total`}
              value={peso(yearTotal)}
              subtext='General Appropriations Act'
              icon={Wallet}
              iconBg='bg-kapwa-green-50 text-kapwa-green-600'
            />
            <StatCard
              label='FY 2027 proposal (NEP)'
              value={peso(sumVersion('nep'))}
              subtext={`Lines naming ${barangay ? barangayName(barangay) : config.lgu.name}`}
              icon={Wallet}
              iconBg='bg-kapwa-bg-brand-weak text-kapwa-text-brand'
            />
            <StatCard
              label='FY 2027 House bill'
              value={peso(sumVersion('house'))}
              subtext='Compared, not added to NEP'
              icon={Wallet}
              iconBg='bg-kapwa-orange-50 text-kapwa-orange-600'
            />
          </CardGrid>

          {filtered.length === 0 ? (
            <EmptyState
              title='No projects found'
              message='Try another year, barangay or search.'
            />
          ) : (
            <div className='border-kapwa-border-weak bg-kapwa-bg-surface overflow-hidden rounded-xl border shadow-sm'>
              <ul className='divide-kapwa-border-weak divide-y'>
                {pageRows.map(p => (
                  <li
                    key={p.id}
                    className='flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6'
                  >
                    <div className='min-w-0'>
                      <p className='text-kapwa-text-strong text-sm leading-snug font-bold'>
                        {p.title}
                      </p>
                      <div className='mt-2 flex flex-wrap items-center gap-2'>
                        <Badge variant='primary' className='text-[10px]'>
                          {TYPE_LABELS[p.type]}
                        </Badge>
                        <span className='text-kapwa-text-support text-xs'>
                          {barangayName(p.barangay)} · {p.department}
                        </span>
                      </div>
                    </div>
                    <p className='text-kapwa-text-strong shrink-0 font-mono text-sm font-bold sm:text-right'>
                      {peso(p.amounts[year] || 0)}
                    </p>
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

          <section className='space-y-3'>
            <h2 className='text-kapwa-text-strong text-xl font-black'>
              By barangay, FY {year}
            </h2>
            <ul className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>
              {byBarangay.map(([slug, t]) => (
                <li
                  key={slug}
                  className='border-kapwa-border-weak bg-kapwa-bg-surface flex items-center justify-between rounded-lg border px-4 py-3 text-sm'
                >
                  <span className='text-kapwa-text-strong font-bold'>
                    {barangayName(slug || null)}
                  </span>
                  <span className='text-kapwa-text-support'>
                    {t.count} · {peso(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className='space-y-3'>
            <h2 className='text-kapwa-text-strong text-xl font-black'>
              FY {data.hgab.fiscalYear}: National Expenditure Program vs House
              bill
            </h2>
            <p className='text-kapwa-text-support text-sm'>
              The proposal (NEP) and the House version are two versions of one
              budget. Compare them; do not add them. A dash means that version
              has no such line.
            </p>
            <div className='border-kapwa-border-weak bg-kapwa-bg-surface overflow-hidden rounded-xl border'>
              <ul className='divide-kapwa-border-weak divide-y'>
                {houseRows.map(r => (
                  <li key={r.id} className='space-y-2 px-4 py-4 sm:px-6'>
                    <p className='text-kapwa-text-strong text-sm leading-snug font-bold'>
                      {r.title}
                    </p>
                    <div className='text-kapwa-text-support flex flex-wrap items-center gap-x-4 gap-y-1 text-xs'>
                      <Badge variant='slate' className='text-[10px]'>
                        {r.statusLabel}
                      </Badge>
                      <span>NEP: {peso(r.nep)}</span>
                      <span>House bill: {peso(r.house)}</span>
                      <span>{barangayName(r.barangay)}</span>
                      {r.url && (
                        <a
                          href={r.url}
                          target='_blank'
                          rel='noreferrer'
                          className='text-kapwa-text-brand inline-flex min-h-11 items-center gap-1 font-bold'
                        >
                          Source <ExternalLink className='h-3 w-3' />
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {data.meta.disclaimers.map(d => (
              <p key={d.id} className='text-kapwa-text-support text-xs'>
                <strong>{d.title}</strong> {d.body}
              </p>
            ))}
          </section>

          <section className='bg-kapwa-bg-surface-raised text-kapwa-text-support space-y-2 rounded-xl p-4 text-sm sm:p-6'>
            <h2 className='text-kapwa-text-strong font-bold'>
              About this data
            </h2>
            <p>
              Figures come from the{' '}
              <a
                href={data.meta.source}
                target='_blank'
                rel='noreferrer'
                className='text-kapwa-text-brand font-bold'
              >
                Philippine Budget Data API
              </a>{' '}
              (BetterGov), fetched {data.meta.fetchedAt.slice(0, 10)}. Amounts
              are exact pesos. Projects are matched by place name, so a project
              that does not say &ldquo;{config.lgu.name}&rdquo; in its title is
              not listed. These are national government projects, not the
              municipality&rsquo;s own budget, which is published on{' '}
              <a
                href={config.lgu.officialWebsite}
                target='_blank'
                rel='noreferrer'
                className='text-kapwa-text-brand font-bold'
              >
                {config.lgu.officialWebsite.replace('https://www.', '')}
              </a>
              . For the municipality&rsquo;s own income and spending, see{' '}
              <Link to='/finances' className='text-kapwa-text-brand font-bold'>
                Local Finances
              </Link>
              .
            </p>
          </section>
        </>
      )}
    </div>
  );
}

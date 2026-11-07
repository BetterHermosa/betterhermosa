import { useMemo, useState } from 'react';

import { CHART_THEME, standardAxisProps } from '@/constants/charts';
import { Info, LineChart as LineIcon, TrendingUp, Users } from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import {
  ChartTooltip,
  ResponsiveChart,
} from '@/components/data-display/ChartContainer';
import { DetailSection } from '@/components/layout/PageLayouts';
import { PageHero } from '@/components/layout/PageLayouts';

import { cn } from '@/lib/utils';

// Data Import
import populationData from '@/data/statistics/population.json';

// Distinct colours for the largest barangays; the first three use brand primaries
const BRGY_COLORS = [
  '#0066eb', // blue
  '#cc3e00', // orange
  '#059669', // green
  '#7c3aed', // purple
  '#dc2626', // red
  '#0891b2', // cyan
  '#db2777', // pink
  '#b45309', // brown
];

const CHART_BARANGAYS = BRGY_COLORS.length;
const CHART_FROM_YEAR = 1990;

// 1. DEFINED INTERFACES: Removes 'any' completely
interface BarangayPopulationPoint {
  year: number;
  [key: string]: number | null; // Allows dynamic barangay names as keys
}

export default function PopulationPage() {
  const [activeTab, setActiveTab] = useState<'municipality' | 'barangays'>(
    'municipality'
  );
  const { municipality, barangays, meta } = populationData;

  const latestMuni = municipality.history[municipality.history.length - 1];
  const prevYear = municipality.history[municipality.history.length - 2].year;
  const latestGrowth = municipality.growthRates.find(
    r => r.period === '2020-2024'
  );
  const growth = latestGrowth?.rate;
  const sortedBarangays = useMemo(() => {
    return [...populationData.barangays].sort((a, b) => {
      const latestA = a.history[a.history.length - 1].population;
      const latestB = b.history[b.history.length - 1].population;
      return latestB - latestA;
    });
  }, []);
  const sortedBarangaysForLine = useMemo(
    () => sortedBarangays.slice(0, CHART_BARANGAYS),
    [sortedBarangays]
  );

  // 1. PIVOT DATA: Combine all barangay histories into one array for the Multi-line chart
  const comparativeData = useMemo<BarangayPopulationPoint[]>(() => {
    const years = municipality.history
      .map(h => h.year)
      .filter(year => year >= CHART_FROM_YEAR);
    return years.map(year => {
      // Initialize with year, then type-safely add barangay counts
      const point: BarangayPopulationPoint = { year };
      barangays.forEach(b => {
        point[b.name] =
          b.history.find(h => h.year === year)?.population || null;
      });
      return point;
    });
  }, [barangays, municipality.history]);

  return (
    <>
      {/* PageHero - documented pattern for layout headers */}
      <PageHero
        title='Population Profile'
        description='Detailed demographic analysis tracking growth from the municipal level down to individual barangays.'
      >
        <div className='flex flex-wrap gap-2 justify-center'>
          <Badge variant='primary' dot>
            Census {latestMuni.year}
          </Badge>
          <Badge variant='slate'>{barangays.length} Barangays</Badge>
        </div>
      </PageHero>

      {/* KPI Cards - using new StatCard component */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3 mb-kapwa-lg'>
        <StatCard
          label='Total Population'
          value={latestMuni.population.toLocaleString()}
          subtext={`Census ${latestMuni.year}`}
          variant='primary'
          trend={{ value: growth || 0, positive: (growth || 0) >= 0 }}
        />
        <StatCard
          label='Growth Rate'
          value={`${growth}%`}
          subtext={`Annual (${latestGrowth?.period ?? ''})`}
          variant='secondary'
        />
        <StatCard
          label='Admin Units'
          value={barangays.length}
          subtext='Official Barangays'
          variant='slate'
          icon={Users}
        />
      </div>

      {/* Unified Tab Switcher */}
      <div className='mb-kapwa-lg bg-kapwa-bg-hover flex gap-1.5 rounded-2xl p-1.5'>
        <button
          onClick={() => setActiveTab('municipality')}
          className={cn(
            'flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold tracking-widest uppercase transition-all',
            activeTab === 'municipality'
              ? 'text-kapwa-text-brand-bold bg-kapwa-bg-surface shadow-md'
              : 'hover:text-kapwa-text-support text-kapwa-text-strong0'
          )}
        >
          <TrendingUp className='w-4 h-4' /> Municipal Growth
        </button>
        <button
          onClick={() => setActiveTab('barangays')}
          className={cn(
            'flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold tracking-widest uppercase transition-all',
            activeTab === 'barangays'
              ? 'text-kapwa-text-brand-bold bg-kapwa-bg-surface shadow-md'
              : 'hover:text-kapwa-text-support text-kapwa-text-strong0'
          )}
        >
          <LineIcon className='w-4 h-4' /> Barangay Comparison
        </button>
      </div>

      {/* Chart wrapped in DetailSection - documented pattern */}
      <DetailSection
        title={
          activeTab === 'municipality'
            ? 'Total Municipal Growth'
            : `Barangay Trends (${CHART_BARANGAYS} largest)`
        }
        icon={TrendingUp}
      >
        <ResponsiveChart height={activeTab === 'barangays' ? 550 : 400}>
          {activeTab === 'municipality' ? (
            <LineChart
              data={municipality.history}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                vertical={false}
                stroke={CHART_THEME.grid}
                strokeDasharray='3 3'
              />
              <XAxis dataKey='year' {...standardAxisProps} dy={10} />
              <YAxis
                {...standardAxisProps}
                tickFormatter={val => `${val / 1000}k`}
              />
              <Tooltip
                content={<ChartTooltip formatter={v => v.toLocaleString()} />}
              />
              <Line
                type='monotone'
                dataKey='population'
                name='Total Residents'
                stroke='var(--color-kapwa-blue-600)'
                strokeWidth={5}
                dot={{
                  fill: 'var(--color-kapwa-blue-600)',
                  r: 4,
                  strokeWidth: 2,
                  stroke: '#fff',
                }}
                activeDot={{ r: 8, strokeWidth: 4, stroke: '#fff' }}
              />
            </LineChart>
          ) : (
            <LineChart
              data={comparativeData}
              margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
            >
              <CartesianGrid
                vertical={false}
                stroke={CHART_THEME.grid}
                strokeDasharray='3 3'
              />
              <XAxis dataKey='year' {...standardAxisProps} dy={10} />
              <YAxis {...standardAxisProps} />
              <Tooltip
                content={<ChartTooltip formatter={v => v.toLocaleString()} />}
              />
              <Legend
                verticalAlign='top'
                iconType='circle'
                wrapperStyle={{
                  paddingBottom: '30px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              />
              {sortedBarangaysForLine.map((b, i) => {
                const isTop3 = i < 3;

                return (
                  <Line
                    key={b.id}
                    type='monotone'
                    dataKey={b.name}
                    stroke={BRGY_COLORS[i % BRGY_COLORS.length]}
                    // Make the top 3 lines bolder (Accessibility: emphasis)
                    strokeWidth={isTop3 ? 4 : 2}
                    // Only show dots on top 3 to reduce visual clutter
                    dot={
                      isTop3 ? { r: 4, strokeWidth: 2, stroke: '#555' } : false
                    }
                    activeDot={{ r: 8, strokeWidth: 4, stroke: '#fff' }}
                  />
                );
              })}
            </LineChart>
          )}
        </ResponsiveChart>
      </DetailSection>

      <DetailSection title={`All ${barangays.length} barangays`} icon={Users}>
        <div className='overflow-x-auto'>
          <table className='w-full text-left text-sm'>
            <thead>
              <tr className='border-kapwa-border-weak text-kapwa-text-support border-b text-xs uppercase'>
                <th scope='col' className='py-2 pr-1.5 font-bold'>
                  Barangay
                </th>
                <th scope='col' className='px-1.5 py-2 text-right font-bold'>
                  {prevYear}
                </th>
                <th scope='col' className='px-1.5 py-2 text-right font-bold'>
                  {latestMuni.year}
                </th>
                <th scope='col' className='py-2 pl-1.5 text-right font-bold'>
                  Change
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedBarangays.map(b => {
                const now = b.history[b.history.length - 1].population;
                const before = b.history.find(
                  h => h.year === prevYear
                )?.population;
                const change = before ? ((now - before) / before) * 100 : null;
                return (
                  <tr
                    key={b.id}
                    className='border-kapwa-border-weak text-kapwa-text-strong border-b'
                  >
                    <th scope='row' className='py-2 pr-1.5 font-bold'>
                      {b.name}
                    </th>
                    <td className='px-1.5 py-2 text-right tabular-nums'>
                      {before?.toLocaleString() ?? '-'}
                    </td>
                    <td className='px-1.5 py-2 text-right tabular-nums'>
                      {now.toLocaleString()}
                    </td>
                    <td className='py-2 pl-1.5 text-right tabular-nums'>
                      {change === null
                        ? '-'
                        : `${change > 0 ? '+' : ''}${change.toFixed(1)}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DetailSection>

      {/* Info box using DetailSection for consistency */}
      <DetailSection title='How to read this data' icon={Info}>
        <p className='text-xs italic leading-relaxed text-kapwa-text-disabled'>
          {activeTab === 'municipality'
            ? `The municipal growth chart tracks population at each census from ${municipality.history[0].year} to ${latestMuni.year}.`
            : `The chart shows the ${CHART_BARANGAYS} most populated barangays at each census since ${CHART_FROM_YEAR}. All ${barangays.length} barangays are in the table below.`}
        </p>
      </DetailSection>

      {/* Footer using documented footer pattern */}
      <footer className='pt-10 space-y-4 text-center border-t border-kapwa-border-weak'>
        <div className='flex justify-center items-center mx-auto w-6 h-6 rounded-full bg-kapwa-bg-success-weak text-kapwa-text-success'>
          <svg
            className='w-4 h-4'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
        </div>
        <div className='space-y-1'>
          <p className='text-kapwa-text-support text-sm'>
            Source: {meta.source}. {meta.notes}
          </p>
        </div>
      </footer>
    </>
  );
}

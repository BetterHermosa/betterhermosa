import { Link } from 'react-router-dom';

import { Coins, Landmark, PiggyBank, Wallet } from 'lucide-react';

import { SEO } from '@/components/layout/SEO';
import { ModuleHeader } from '@/components/layout/PageLayouts';
import { CardGrid } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';

import finances from '@/data/finances/hermosa.json';
import { formatPesoAdaptive } from '@/lib/format';
import { config } from '@/lib/lguConfig';

const peso = (n: number) => formatPesoAdaptive(n).fullString;
const pct = (part: number, whole: number) =>
  whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : '—';

interface Line {
  label: string;
  value: number;
}

function Breakdown({
  title,
  lines,
  total,
}: {
  title: string;
  lines: Line[];
  total: number;
}) {
  return (
    <section className='space-y-3'>
      <h3 className='text-kapwa-text-strong text-lg font-black'>{title}</h3>
      <ul className='border-kapwa-border-weak bg-kapwa-bg-surface divide-kapwa-border-weak divide-y rounded-xl border'>
        {lines
          .filter(l => l.value !== 0)
          .map(l => (
            <li key={l.label} className='space-y-2 px-4 py-3'>
              <div className='flex items-baseline justify-between gap-4 text-sm'>
                <span className='text-kapwa-text-strong font-bold'>
                  {l.label}
                </span>
                <span className='text-kapwa-text-strong shrink-0 font-mono font-bold'>
                  {peso(l.value)}
                </span>
              </div>
              <div className='flex items-center gap-3'>
                <div className='bg-kapwa-bg-hover h-1.5 flex-1 overflow-hidden rounded-xl'>
                  <div
                    className='bg-kapwa-bg-brand-weak h-full'
                    style={{
                      width: `${Math.min((l.value / total) * 100, 100)}%`,
                    }}
                  />
                </div>
                <span className='text-kapwa-text-support w-12 shrink-0 text-right text-xs'>
                  {pct(l.value, total)}
                </span>
              </div>
            </li>
          ))}
      </ul>
    </section>
  );
}

export default function FinancesPage() {
  const { meta, ari, sre, ldrrmf } = finances;
  const exp = sre.operatingExpenditures;

  const incomeLines: Line[] = [
    { label: 'National tax allotment', value: ari.nationalTaxAllotment },
    { label: 'Locally sourced revenue', value: ari.locallySourcedRevenue },
    {
      label: 'Share from the economic zone',
      value: ari.otherShares.economicZone,
    },
    {
      label: 'Other national shares',
      value: ari.otherShares.total - ari.otherShares.economicZone,
    },
    { label: 'Interest income', value: ari.interestIncome },
  ];
  const localLines: Line[] = [
    { label: 'Real property tax', value: ari.tax.realPropertyTax },
    { label: 'Tax on business', value: ari.tax.businessTax },
    { label: 'Other taxes', value: ari.tax.otherTaxes },
    { label: 'Regulatory fees', value: ari.nonTax.regulatoryFees },
    { label: 'Service and user charges', value: ari.nonTax.serviceCharges },
    {
      label: 'Receipts from economic enterprises',
      value: ari.nonTax.economicEnterprises,
    },
  ];
  const spendLines: Line[] = [
    { label: 'General public services', value: exp.generalPublicServices },
    { label: 'Education, culture and sports', value: exp.education },
    { label: 'Health, nutrition and population control', value: exp.health },
    { label: 'Social services and social welfare', value: exp.socialWelfare },
    { label: 'Labor and employment', value: exp.laborAndEmployment },
    { label: 'Economic services', value: exp.economicServices },
    { label: 'Interest on debt', value: exp.debtServiceInterest },
  ];

  return (
    <div className='animate-in fade-in mx-auto max-w-full space-y-8 px-4 pb-20 duration-500 md:px-8'>
      <SEO />
      <ModuleHeader
        title={`${config.lgu.name}'s Own Finances`}
        description={`Income and spending of the ${config.lgu.fullName} for FY ${meta.fiscalYear} (${meta.status.toLowerCase()}), as reported to the Bureau of Local Government Finance.`}
      />

      <CardGrid columns={4}>
        <StatCard
          label='Annual regular income'
          value={peso(ari.total)}
          subtext={`FY ${meta.fiscalYear}`}
          icon={Wallet}
          iconBg='bg-kapwa-green-50 text-kapwa-green-600'
        />
        <StatCard
          label='Raised locally'
          value={pct(ari.locallySourcedRevenue, ari.total)}
          subtext='Share of annual regular income'
          icon={Landmark}
          iconBg='bg-kapwa-bg-brand-weak text-kapwa-text-brand'
        />
        <StatCard
          label='National tax allotment'
          value={pct(ari.nationalTaxAllotment, ari.total)}
          subtext='Share of annual regular income'
          icon={Coins}
          iconBg='bg-kapwa-orange-50 text-kapwa-orange-600'
        />
        <StatCard
          label='Disaster fund (LDRRMF)'
          value={peso(ldrrmf.total)}
          subtext='70% preparedness, 30% quick response'
          icon={PiggyBank}
          iconBg='bg-kapwa-bg-surface-raised text-kapwa-text-strong'
        />
      </CardGrid>

      <div className='grid gap-8 lg:grid-cols-2'>
        <Breakdown
          title='Where the income comes from'
          lines={incomeLines}
          total={ari.total}
        />
        <Breakdown
          title='What the municipality raises itself'
          lines={localLines}
          total={ari.locallySourcedRevenue}
        />
      </div>

      <div className='grid gap-8 lg:grid-cols-2'>
        <Breakdown
          title='Current operating spending'
          lines={spendLines}
          total={exp.total}
        />
        <section className='space-y-3'>
          <h3 className='text-kapwa-text-strong text-lg font-black'>
            Income, spending and cash
          </h3>
          <dl className='border-kapwa-border-weak bg-kapwa-bg-surface divide-kapwa-border-weak divide-y rounded-xl border text-sm'>
            {[
              ['Current operating income', sre.income.total],
              ['Current operating expenditures', exp.total],
              ['Net operating income', sre.netOperatingIncome],
              [
                'Capital outlay (property, plant and equipment)',
                sre.capitalOutlay,
              ],
              ['Loan amortization paid', sre.loanAmortization],
              ['Cash balance, start of year', sre.cashBalanceBeginning],
              ['Cash balance, end of year', sre.cashBalanceEnd],
            ].map(([label, value]) => (
              <div
                key={label as string}
                className='flex items-baseline justify-between gap-4 px-4 py-3'
              >
                <dt className='text-kapwa-text-strong font-bold'>{label}</dt>
                <dd className='text-kapwa-text-strong shrink-0 font-mono font-bold'>
                  {peso(value as number)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section className='bg-kapwa-bg-surface-raised text-kapwa-text-support space-y-2 rounded-xl p-4 text-sm sm:p-6'>
        <h2 className='text-kapwa-text-strong font-bold'>About this data</h2>
        <p>
          {meta.attribution} The annual regular income figures and the statement
          of receipts and expenditures use different definitions, so their
          totals differ. Amounts are in pesos.
        </p>
        <p>
          Source files:{' '}
          {meta.sources.map((s, i) => (
            <span key={s.key}>
              {i > 0 && ', '}
              <a
                href={s.url}
                target='_blank'
                rel='noreferrer'
                className='text-kapwa-text-brand font-bold'
              >
                {s.file}
              </a>
            </span>
          ))}{' '}
          (published at{' '}
          <a
            href={meta.page}
            target='_blank'
            rel='noreferrer'
            className='text-kapwa-text-brand font-bold'
          >
            blgf.gov.ph
          </a>
          ). The municipality&rsquo;s own annual budget is published on{' '}
          <a
            href={config.lgu.officialWebsite}
            target='_blank'
            rel='noreferrer'
            className='text-kapwa-text-brand font-bold'
          >
            {config.lgu.officialWebsite.replace('https://www.', '')}
          </a>
          . For national government projects in {config.lgu.name}, see{' '}
          <Link to='/budget' className='text-kapwa-text-brand font-bold'>
            National Projects
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

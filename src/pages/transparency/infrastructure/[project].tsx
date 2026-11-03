import { Link, useParams } from 'react-router-dom';

import { AlertCircle, ArrowLeft, ExternalLink } from 'lucide-react';

import { DetailSection } from '@/components/layout/PageLayouts';
import { SEO } from '@/components/layout/SEO';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

import { barangayName } from '@/lib/budget';
import {
  CATEGORY_LABELS,
  peso,
  prettify,
  statusVariant,
  useDpwh,
} from '@/lib/dpwh';

const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso + 'T00:00:00').toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6'>
      <dt className='text-kapwa-text-support text-sm font-bold'>{label}</dt>
      <dd className='text-kapwa-text-strong text-sm sm:text-right'>{value}</dd>
    </div>
  );
}

export default function InfrastructureDetail() {
  const { contractId } = useParams();
  const { data, error } = useDpwh();
  const back = (
    <Link
      to='/transparency/infrastructure'
      className='text-kapwa-text-brand inline-flex min-h-11 items-center gap-2 text-sm font-bold'
    >
      <ArrowLeft className='h-4 w-4' /> All DPWH contracts
    </Link>
  );

  if (error) {
    return (
      <EmptyState
        title='Unavailable'
        message='The contract data could not be loaded. Please try again later.'
        icon={AlertCircle}
      />
    );
  }
  if (!data) {
    return (
      <div className='bg-kapwa-bg-surface-raised h-64 animate-pulse rounded-xl' />
    );
  }

  const p = data.projects.find(x => x.id === contractId);
  if (!p) {
    return (
      <div className='space-y-4 px-4 md:px-8'>
        {back}
        <EmptyState
          title='Contract not found'
          message='This contract is not in the Hermosa list.'
        />
      </div>
    );
  }

  const inconsistent = p.progress === 100 && p.status !== 'Completed';

  return (
    <div className='animate-in fade-in mx-auto max-w-3xl space-y-6 px-4 pb-20 duration-500 md:px-8'>
      <SEO
        title={`DPWH contract ${p.id} | Hermosa, Bataan`}
        description={`${prettify(p.title).slice(0, 150)}`}
      />
      {back}
      <div className='space-y-3'>
        <h1 className='text-kapwa-text-strong text-xl leading-snug font-black md:text-2xl'>
          {prettify(p.title)}
        </h1>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
          <Badge variant='primary'>{CATEGORY_LABELS[p.category]}</Badge>
          <span className='text-kapwa-text-support text-sm'>
            Contract {p.id}
          </span>
        </div>
      </div>

      <DetailSection title='Contract details'>
        <dl className='divide-kapwa-border-weak divide-y'>
          <Field label='Budget' value={peso(p.budget)} />
          <Field
            label='Reported progress'
            value={p.progress != null ? `${p.progress.toFixed(2)}%` : '—'}
          />
          <Field label='Contractor' value={p.contractor ?? '—'} />
          <Field label='Year' value={p.year ?? '—'} />
          <Field label='Start date' value={formatDate(p.startDate)} />
          <Field label='Completion date' value={formatDate(p.completionDate)} />
          <Field label='Program' value={p.program ?? '—'} />
          <Field label='Source of funds' value={p.fundSource ?? '—'} />
          <Field label='District engineering office' value={p.office ?? '—'} />
          <Field
            label='Barangay named in the title'
            value={
              p.barangay ? (
                <Link
                  to={`/government/barangays/${p.barangay}`}
                  className='text-kapwa-text-brand font-bold'
                >
                  {barangayName(p.barangay)}
                </Link>
              ) : (
                'Not named'
              )
            }
          />
          {p.lat != null && p.lon != null && (
            <Field
              label='Location'
              value={
                <a
                  href={`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=16/${p.lat}/${p.lon}`}
                  target='_blank'
                  rel='noreferrer'
                  className='text-kapwa-text-brand inline-flex min-h-11 items-center gap-1 font-bold'
                >
                  View on OpenStreetMap <ExternalLink className='h-3 w-3' />
                </a>
              }
            />
          )}
        </dl>
      </DetailSection>

      {inconsistent && (
        <p className='text-kapwa-text-support text-sm'>
          DPWH lists this contract as {p.status} with 100% reported progress.
          Both values are shown as published.
        </p>
      )}
      <p className='text-kapwa-text-support text-xs'>
        As published in the{' '}
        <a
          href={data.meta.sourceUrl}
          target='_blank'
          rel='noreferrer'
          className='text-kapwa-text-brand font-bold'
        >
          DPWH Infrastructure Transparency Dataset
        </a>
        , saved on {data.meta.retrieved}. Status, progress and amounts may be
        out of date.
      </p>
    </div>
  );
}

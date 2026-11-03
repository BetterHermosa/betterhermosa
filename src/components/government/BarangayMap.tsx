import { Suspense, lazy } from 'react';

import { useNavigate } from 'react-router-dom';

// Leaflet is loaded on demand so it stays out of the pages that don't show a map.
const BarangayMapLeaflet = lazy(() => import('./BarangayMapLeaflet'));

interface BarangayMapProps {
  /** Opens a page when a barangay is chosen. */
  hrefFor?: (slug: string) => string;
  /** Called instead of navigating, for filters. */
  onSelect?: (slug: string) => void;
  /** Barangay drawn with a strong outline. */
  selected?: string | null;
  /** Project counts per slug; when given the shapes are shaded by count. */
  counts?: Record<string, number>;
  /** Unit for the count, e.g. "projects". */
  countLabel?: string;
  className?: string;
}

const OPACITY = [0, 0.2, 0.4, 0.65, 0.9];
const LEGEND = ['None', '1', '2-3', '4-6', '7+'];

export function BarangayMap({
  hrefFor,
  onSelect,
  selected,
  counts,
  countLabel = 'projects',
  className,
}: BarangayMapProps) {
  const navigate = useNavigate();

  const choose =
    onSelect || hrefFor
      ? (slug: string) => {
          if (onSelect) onSelect(slug);
          else if (hrefFor) navigate(hrefFor(slug));
        }
      : undefined;

  return (
    <figure className={className}>
      <Suspense
        fallback={
          <div
            role='status'
            aria-label='Loading map'
            className='bg-kapwa-bg-surface-raised border-kapwa-border-weak h-[340px] w-full animate-pulse rounded-xl border md:h-[460px]'
          />
        }
      >
        <BarangayMapLeaflet
          choose={choose}
          selected={selected}
          counts={counts}
          countLabel={countLabel}
        />
      </Suspense>
      {counts && (
        <figcaption className='text-kapwa-text-support mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
          <span className='font-bold'>{countLabel}:</span>
          {LEGEND.map((text, i) => (
            <span key={text} className='inline-flex items-center gap-1'>
              <span
                aria-hidden='true'
                className='border-kapwa-border-strong inline-block h-3 w-3 rounded-sm border'
                style={{
                  backgroundColor:
                    i === 0
                      ? 'var(--color-kapwa-bg-surface)'
                      : 'var(--color-kapwa-bg-brand-default)',
                  opacity: i === 0 ? 1 : OPACITY[i],
                }}
              />
              {text}
            </span>
          ))}
        </figcaption>
      )}
      <p className='text-kapwa-text-support mt-2 text-xs'>
        Barangay shapes are simplified, so borders are approximate: for
        orientation, not for surveying. Boundaries: PSA and NAMRIA, compiled in
        the barangay-boundaries-repository (MIT), via the{' '}
        <a
          href='https://data.bettergov.ph/datasets/23'
          target='_blank'
          rel='noreferrer'
          className='text-kapwa-text-brand font-bold'
        >
          BetterGov Open Data Portal
        </a>
        . Map: &copy;{' '}
        <a
          href='https://www.openstreetmap.org/copyright'
          target='_blank'
          rel='noreferrer'
          className='text-kapwa-text-brand font-bold'
        >
          OpenStreetMap
        </a>{' '}
        contributors.
      </p>
    </figure>
  );
}

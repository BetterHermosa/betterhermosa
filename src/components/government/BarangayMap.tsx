import { KeyboardEvent, useMemo } from 'react';

import { useNavigate } from 'react-router-dom';

import barangaysData from '@/data/directory/barangays.json';
import geo from '@/data/geo/hermosa-barangays.json';

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

const WIDTH = 100;

const nameOf = (slug: string) => {
  const b = barangaysData.find(x => x.slug === slug);
  return b ? b.barangay_name.replace(/\s*\(.*?\)/, '') : slug;
};

// Shade steps by count: 0, 1, 2-3, 4-6, 7+
const level = (n: number) =>
  n <= 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 6 ? 3 : 4;
const OPACITY = [0, 0.2, 0.4, 0.65, 0.9];
const LEGEND = ['None', '1', '2-3', '4-6', '7+'];

// Equirectangular projection fitted to Hermosa: x is scaled by cos(latitude).
function useShapes() {
  return useMemo(() => {
    const rings = geo.features.flatMap(f => f.geometry.coordinates.flat());
    const lons = rings.map(p => p[0]);
    const lats = rings.map(p => p[1]);
    const minLon = Math.min(...lons);
    const maxLat = Math.max(...lats);
    const k = Math.cos((((maxLat + Math.min(...lats)) / 2) * Math.PI) / 180);
    const w = (Math.max(...lons) - minLon) * k;
    const h = maxLat - Math.min(...lats);
    const scale = WIDTH / w;
    const pad = 2;
    const shapes = geo.features.map(f => ({
      slug: f.properties.slug,
      d:
        f.geometry.coordinates
          .map(ring =>
            ring
              .map(
                ([lon, lat], i) =>
                  `${i ? 'L' : 'M'}${((lon - minLon) * k * scale + pad).toFixed(2)},${((maxLat - lat) * scale + pad).toFixed(2)}`
              )
              .join('')
          )
          .join('') + 'Z',
    }));
    return { shapes, height: h * scale + pad * 2 };
  }, []);
}

export function BarangayMap({
  hrefFor,
  onSelect,
  selected,
  counts,
  countLabel = 'projects',
  className,
}: BarangayMapProps) {
  const navigate = useNavigate();
  const { shapes, height } = useShapes();

  const choose = (slug: string) => {
    if (onSelect) onSelect(slug);
    else if (hrefFor) navigate(hrefFor(slug));
  };
  const interactive = Boolean(onSelect || hrefFor);

  return (
    <figure className={className}>
      <svg
        viewBox={`0 0 ${WIDTH + 4} ${height}`}
        role='group'
        aria-label='Map of the barangays of Hermosa'
        className='bg-kapwa-bg-surface-raised border-kapwa-border-weak h-auto w-full rounded-xl border'
      >
        {shapes.map(({ slug, d }) => {
          const n = counts?.[slug] ?? 0;
          const isSelected = selected === slug;
          const label = counts
            ? `${nameOf(slug)}: ${n} ${countLabel}`
            : nameOf(slug);
          const fill = counts
            ? level(n) === 0
              ? 'var(--color-kapwa-bg-surface)'
              : 'var(--color-kapwa-bg-brand-default)'
            : isSelected
              ? 'var(--color-kapwa-bg-brand-default)'
              : 'var(--color-kapwa-bg-surface)';
          const opacity = counts ? (level(n) === 0 ? 1 : OPACITY[level(n)]) : 1;
          const onKey = (e: KeyboardEvent<SVGPathElement>) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              choose(slug);
            }
          };
          return (
            <path
              key={slug}
              d={d}
              fill={fill}
              fillOpacity={opacity}
              stroke='var(--color-kapwa-border-strong)'
              strokeWidth={isSelected ? 1.6 : 0.4}
              strokeLinejoin='round'
              role={interactive ? (onSelect ? 'button' : 'link') : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={label}
              aria-pressed={onSelect ? isSelected : undefined}
              onClick={interactive ? () => choose(slug) : undefined}
              onKeyDown={interactive ? onKey : undefined}
              className={
                interactive
                  ? 'cursor-pointer outline-none focus-visible:stroke-[2]'
                  : undefined
              }
            >
              <title>{label}</title>
            </path>
          );
        })}
      </svg>
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
        Simplified shapes for orientation, not for surveying. Boundaries: PSA
        and NAMRIA, compiled in the barangay-boundaries-repository (MIT), via
        the{' '}
        <a
          href='https://data.bettergov.ph/datasets/23'
          target='_blank'
          rel='noreferrer'
          className='text-kapwa-text-brand font-bold'
        >
          BetterGov Open Data Portal
        </a>
        .
      </p>
    </figure>
  );
}

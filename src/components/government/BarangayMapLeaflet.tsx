import { useEffect, useMemo } from 'react';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapContainer,
  Polygon,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';

import barangaysData from '@/data/directory/barangays.json';
import geo from '@/data/geo/hermosa-barangays.json';

export interface BarangayMapLeafletProps {
  choose?: (slug: string) => void;
  selected?: string | null;
  counts?: Record<string, number>;
  countLabel: string;
}

const nameOf = (slug: string) => {
  const b = barangaysData.find(x => x.slug === slug);
  return b ? b.barangay_name.replace(/\s*\(.*?\)/, '') : slug;
};

// Shade steps by count: 0, 1, 2-3, 4-6, 7+ (styled in index.css)
const level = (n: number) =>
  n <= 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 6 ? 3 : 4;

// Fit Hermosa into the container, and refit whenever the container changes
// size (the page may finish its layout after the map is created).
function FitBounds({ bounds }: { bounds: L.LatLngBounds }) {
  const map = useMap();
  useEffect(() => {
    const fit = () => {
      map.invalidateSize();
      map.fitBounds(bounds, { padding: [10, 10] });
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map, bounds]);
  return null;
}

export default function BarangayMapLeaflet({
  choose,
  selected,
  counts,
  countLabel,
}: BarangayMapLeafletProps) {
  const { shapes, bounds } = useMemo(() => {
    const shapes = geo.features.map(f => ({
      slug: f.properties.slug,
      positions: f.geometry.coordinates.map(ring =>
        ring.map(([lon, lat]) => [lat, lon] as [number, number])
      ),
    }));
    const points = shapes.flatMap(s => s.positions.flat());
    return { shapes, bounds: L.latLngBounds(points) };
  }, []);

  const interactive = Boolean(choose);

  return (
    <MapContainer
      bounds={bounds}
      boundsOptions={{ padding: [10, 10] }}
      maxBounds={bounds.pad(0.6)}
      maxBoundsViscosity={1}
      minZoom={10}
      zoomSnap={0.25}
      zoomDelta={0.5}
      scrollWheelZoom={false}
      dragging={!L.Browser.mobile}
      attributionControl
      className='barangay-map border-kapwa-border-weak z-0 h-[340px] w-full rounded-xl border md:h-[460px]'
    >
      <FitBounds bounds={bounds} />
      <TileLayer
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={17}
      />
      {shapes.map(({ slug, positions }) => {
        const n = counts?.[slug] ?? 0;
        const isSelected = selected === slug;
        const cls = [
          'barangay-shape',
          counts ? `lvl-${level(n)}` : 'lvl-plain',
          isSelected ? 'is-selected' : '',
          interactive ? 'is-interactive' : '',
        ]
          .filter(Boolean)
          .join(' ');
        const label = counts
          ? `${nameOf(slug)}: ${n} ${countLabel}`
          : nameOf(slug);
        return (
          <Polygon
            key={`${slug}-${cls}`}
            positions={positions}
            pathOptions={{ className: cls, weight: isSelected ? 3 : 1.5 }}
            eventHandlers={{
              click: () => choose?.(slug),
              add: e => {
                const el = (e.target as L.Polygon).getElement();
                if (!el || !interactive) return;
                el.setAttribute('tabindex', '0');
                el.setAttribute('role', 'link');
                el.setAttribute('aria-label', label);
                el.addEventListener('keydown', ev => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    choose?.(slug);
                  }
                });
              },
            }}
          >
            <Tooltip sticky>{label}</Tooltip>
          </Polygon>
        );
      })}
    </MapContainer>
  );
}

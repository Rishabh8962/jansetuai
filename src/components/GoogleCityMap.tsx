import { useMemo, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, Pin } from '@vis.gl/react-google-maps';
import { type Complaint, getCategoryIcon, CATEGORY_LABELS } from '@/data/mockData';
import { GOOGLE_MAPS_API_KEY, BHOPAL_CENTER, DEFAULT_ZOOM, DARK_MAP_STYLE } from '@/lib/mapsConfig';

interface Props {
  complaints: Complaint[];
  height?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
}

const PRIORITY_COLOR: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#22c55e',
};

export default function GoogleCityMap({
  complaints,
  height = '500px',
  center = BHOPAL_CENTER,
  zoom = DEFAULT_ZOOM,
}: Props) {
  const [selected, setSelected] = useState<Complaint | null>(null);

  // Re-center markers around Bhopal if mock data sits in another city
  const markers = useMemo(() => {
    return complaints.map((c, i) => {
      const inBhopal = c.lat > 23.0 && c.lat < 23.5 && c.lng > 77.2 && c.lng < 77.7;
      if (inBhopal) return c;
      // Spread non-Bhopal mock complaints around Bhopal in a small radius
      const angle = (i * 137.5) * (Math.PI / 180);
      const radius = 0.012 + (i % 5) * 0.004;
      return {
        ...c,
        lat: BHOPAL_CENTER.lat + Math.cos(angle) * radius,
        lng: BHOPAL_CENTER.lng + Math.sin(angle) * radius,
      };
    });
  }, [complaints]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="font-semibold text-foreground">Priority:</span>
        {Object.entries(PRIORITY_COLOR).map(([label, color]) => (
          <span key={label} className="flex items-center gap-1.5 capitalize">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            {label}
          </span>
        ))}
        <span className="ml-auto text-[11px] font-mono text-muted-foreground">
          📍 Bhopal, MP · {markers.length} complaints
        </span>
      </div>
      <div
        className="w-full rounded-xl overflow-hidden border border-border/50"
        style={{ height }}
      >
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <Map
            mapId="janmitra_dark"
            defaultCenter={center}
            defaultZoom={zoom}
            gestureHandling="greedy"
            disableDefaultUI={false}
            styles={DARK_MAP_STYLE}
            className="w-full h-full"
          >
            {markers.map((c) => (
              <AdvancedMarker
                key={c.id}
                position={{ lat: Number(c.lat), lng: Number(c.lng) }}
                onClick={() => setSelected(c)}
              >
                <Pin
                  background={PRIORITY_COLOR[c.priority] ?? '#06b6d4'}
                  borderColor="#0f172a"
                  glyphColor="#ffffff"
                />
              </AdvancedMarker>
            ))}

            {selected && (
              <InfoWindow
                position={{ lat: Number(selected.lat), lng: Number(selected.lng) }}
                onCloseClick={() => setSelected(null)}
              >
                <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 200, color: '#0f172a' }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {getCategoryIcon(selected.category)} {CATEGORY_LABELS[selected.category]}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                    {selected.id} · {selected.ward}
                  </div>
                  <div style={{ fontSize: 12, marginBottom: 6 }}>{selected.description}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ color: PRIORITY_COLOR[selected.priority], fontWeight: 600 }}>
                      {selected.priority}
                    </span>
                    <span style={{ color: '#64748b' }}>{selected.status.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>
    </div>
  );
}

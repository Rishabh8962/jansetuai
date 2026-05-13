import { useMemo, useState } from 'react';
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';
import { type Complaint, getCategoryIcon, CATEGORY_LABELS } from '@/data/mockData';
import { GOOGLE_MAPS_API_KEY, BHOPAL_CENTER, DEFAULT_ZOOM, DARK_MAP_STYLE } from '@/lib/mapsConfig';

interface Props {
  complaints: Complaint[];
  height?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  /** color markers by status (resolved=green, in-progress=navy, pending=orange) instead of priority */
  colorBy?: 'priority' | 'status';
}

const PRIORITY_COLOR: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#22c55e',
};

const STATUS_COLOR: Record<string, string> = {
  submitted: '#FF9933',     // saffron
  assigned: '#FF9933',
  in_progress: '#000080',   // navy
  under_review: '#06b6d4',
  rework_required: '#ef4444',
  completed: '#138808',     // india green
};

function colorFor(c: Complaint, mode: 'priority' | 'status') {
  if (mode === 'status') return STATUS_COLOR[c.status] ?? '#06b6d4';
  return PRIORITY_COLOR[c.priority] ?? '#06b6d4';
}

export default function GoogleCityMap({
  complaints,
  height = '500px',
  center = BHOPAL_CENTER,
  zoom = DEFAULT_ZOOM,
  colorBy = 'priority',
}: Props) {
  const [selected, setSelected] = useState<Complaint | null>(null);

  const markers = useMemo(() => {
    return complaints.map((c, i) => {
      const inBhopal = c.lat > 23.0 && c.lat < 23.5 && c.lng > 77.2 && c.lng < 77.7;
      if (inBhopal) return c;
      const angle = (i * 137.5) * (Math.PI / 180);
      const radius = 0.012 + (i % 5) * 0.004;
      return {
        ...c,
        lat: BHOPAL_CENTER.lat + Math.cos(angle) * radius,
        lng: BHOPAL_CENTER.lng + Math.sin(angle) * radius,
      };
    });
  }, [complaints]);

  const legend = colorBy === 'status'
    ? [
        ['Pending', STATUS_COLOR.submitted],
        ['In progress', STATUS_COLOR.in_progress],
        ['Resolved', STATUS_COLOR.completed],
      ]
    : Object.entries(PRIORITY_COLOR);

  return (
    <div className="space-y-3 h-full flex flex-col">
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="font-semibold text-foreground">{colorBy === 'status' ? 'Status' : 'Priority'}:</span>
        {legend.map(([label, color]) => (
          <span key={label} className="flex items-center gap-1.5 capitalize">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color as string }} />
            {label}
          </span>
        ))}
        <span className="ml-auto text-[11px] font-mono text-muted-foreground">
          📍 Bhopal, MP · {markers.length} complaints
        </span>
      </div>
      <div
        className="w-full rounded-xl overflow-hidden border border-border/50 flex-1"
        style={{ height }}
      >
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <Map
            defaultCenter={center}
            defaultZoom={zoom}
            gestureHandling="greedy"
            disableDefaultUI={false}
            styles={DARK_MAP_STYLE}
            className="w-full h-full"
          >
            {markers.map((c) => {
              const fill = colorFor(c, colorBy);
              const active = selected?.id === c.id;
              return (
                <Marker
                  key={c.id}
                  position={{ lat: Number(c.lat), lng: Number(c.lng) }}
                  onClick={() => setSelected(c)}
                  animation={active ? 1 /* BOUNCE */ : undefined}
                  icon={{
                    path: 0,
                    scale: c.priority === 'critical' ? 10 : c.priority === 'high' ? 8 : 6.5,
                    fillColor: fill,
                    fillOpacity: c.status === 'completed' ? 0.55 : 0.95,
                    strokeColor: '#ffffff',
                    strokeWeight: 1.6,
                  } as any}
                />
              );
            })}

            {selected && (
              <InfoWindow
                position={{ lat: Number(selected.lat), lng: Number(selected.lng) }}
                onCloseClick={() => setSelected(null)}
              >
                <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 230, maxWidth: 260, color: '#0f172a' }}>
                  {selected.imageUrl && selected.imageUrl !== '/placeholder.svg' && (
                    <img
                      src={selected.imageUrl}
                      alt={selected.category}
                      style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 8, marginBottom: 6 }}
                      onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                    />
                  )}
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
                    {getCategoryIcon(selected.category)} {CATEGORY_LABELS[selected.category]}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                    {selected.id} · {selected.ward}
                  </div>
                  <div style={{ fontSize: 12, marginBottom: 6, lineHeight: 1.35 }}>
                    {selected.description.length > 90 ? selected.description.slice(0, 90) + '…' : selected.description}
                  </div>
                  {typeof selected.aiConfidence === 'number' && (
                    <div style={{ marginBottom: 6 }}>
                      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>
                        AI confidence: {Math.round((selected.aiConfidence ?? 0) * 100)}%
                      </div>
                      <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2 }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.round((selected.aiConfidence ?? 0) * 100)}%`,
                            background: '#000080',
                            borderRadius: 2,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, alignItems: 'center' }}>
                    <span style={{ color: PRIORITY_COLOR[selected.priority], fontWeight: 700, textTransform: 'uppercase' }}>
                      {selected.priority}
                    </span>
                    <span
                      style={{
                        color: '#fff',
                        background: STATUS_COLOR[selected.status] ?? '#64748b',
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    >
                      {selected.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 6 }}>
                    {selected.department} · {new Date(selected.createdAt).toLocaleDateString()}
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

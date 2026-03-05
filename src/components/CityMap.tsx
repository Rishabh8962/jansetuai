import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { type Complaint, getCategoryIcon, CATEGORY_LABELS } from '@/data/mockData';

interface CityMapProps {
  complaints: Complaint[];
}

export default function CityMap({ complaints }: CityMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [12.9716, 77.5946],
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    // Add complaint markers
    complaints.forEach(c => {
      const color = c.status === 'completed' ? '#22c55e' :
        c.status === 'in_progress' ? '#0dd3d3' :
          c.status === 'assigned' ? '#f59e0b' : '#6b7280';

      const marker = L.circleMarker([c.lat, c.lng], {
        radius: c.priority === 'critical' ? 8 : c.priority === 'high' ? 6 : 5,
        fillColor: color,
        color: color,
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.5,
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: Inter, sans-serif; font-size: 12px; min-width: 180px;">
          <div style="font-weight: 600; margin-bottom: 4px;">${getCategoryIcon(c.category)} ${CATEGORY_LABELS[c.category]}</div>
          <div style="color: #888; margin-bottom: 2px;">${c.id} · ${c.ward}</div>
          <div style="color: #888; margin-bottom: 4px;">${c.description}</div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: ${color}; font-weight: 500;">${c.status.replace('_', ' ')}</span>
            <span>${c.priority}</span>
          </div>
        </div>
      `);
    });

    // Add heatmap-like clusters (simple circle overlays)
    const heatCenters = [
      { lat: 12.975, lng: 77.59, intensity: 0.6 },
      { lat: 12.96, lng: 77.58, intensity: 0.8 },
      { lat: 12.98, lng: 77.61, intensity: 0.5 },
      { lat: 12.955, lng: 77.605, intensity: 0.7 },
    ];

    heatCenters.forEach(h => {
      L.circle([h.lat, h.lng], {
        radius: 800,
        fillColor: 'hsl(0, 72%, 55%)',
        color: 'transparent',
        fillOpacity: h.intensity * 0.15,
      }).addTo(map);
    });

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [complaints]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="font-semibold text-foreground">Legend:</span>
        {[
          { label: 'Submitted', color: '#6b7280' },
          { label: 'Assigned', color: '#f59e0b' },
          { label: 'In Progress', color: '#0dd3d3' },
          { label: 'Completed', color: '#22c55e' },
        ].map(l => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-destructive/20 border border-destructive/30" />
          Hotspot Zone
        </span>
      </div>
      <div ref={mapRef} className="w-full h-[500px] rounded-xl overflow-hidden border border-border/50" />
    </div>
  );
}

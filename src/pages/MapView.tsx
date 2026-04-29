import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Filter, X, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getComplaints } from '@/data/store';
import { CATEGORY_LABELS, getCategoryIcon, getStatusColor, type Complaint, type Priority } from '@/data/mockData';
import { useStoreRefresh } from '@/hooks/useStore';
import jansetuLogo from '@/assets/jansetu-logo.png';

const PRIORITY_COLORS: Record<Priority, string> = {
  critical: '#ef4444',
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
};

const PRIORITY_LABELS: Record<Priority, string> = {
  critical: 'Critical',
  high: 'High Priority',
  medium: 'Medium Priority',
  low: 'Low Priority',
};

type Filter = 'all' | Priority | 'pending' | 'resolved';

export default function MapView() {
  useStoreRefresh();
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const heatRef = useRef<L.LayerGroup | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [showHeat, setShowHeat] = useState(true);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const complaints = getComplaints();

  const filtered = useMemo(() => {
    if (filter === 'all') return complaints;
    if (filter === 'pending') return complaints.filter(c => c.status !== 'completed');
    if (filter === 'resolved') return complaints.filter(c => c.status === 'completed');
    return complaints.filter(c => c.priority === filter);
  }, [complaints, filter]);

  // Init map once
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
    mapInstance.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    heatRef.current = L.layerGroup().addTo(map);
    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Refresh markers when filter/data changes
  useEffect(() => {
    const map = mapInstance.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    filtered.forEach(c => {
      const color = PRIORITY_COLORS[c.priority];
      const r = c.priority === 'critical' ? 9 : c.priority === 'high' ? 8 : c.priority === 'medium' ? 6 : 5;
      const marker = L.circleMarker([c.lat, c.lng], {
        radius: r,
        fillColor: color,
        color: '#fff',
        weight: 1.5,
        opacity: 0.95,
        fillOpacity: c.status === 'completed' ? 0.35 : 0.8,
      });
      marker.on('click', () => setSelected(c));
      marker.addTo(layer);
    });
  }, [filtered]);

  // Heatmap toggle
  useEffect(() => {
    const map = mapInstance.current;
    const heat = heatRef.current;
    if (!map || !heat) return;
    heat.clearLayers();
    if (!showHeat) return;
    // Aggregate complaints into clusters for heat halos
    const grid: Record<string, { lat: number; lng: number; n: number }> = {};
    filtered.forEach(c => {
      const key = `${c.lat.toFixed(2)}_${c.lng.toFixed(2)}`;
      if (!grid[key]) grid[key] = { lat: c.lat, lng: c.lng, n: 0 };
      grid[key].n += c.priority === 'critical' || c.priority === 'high' ? 2 : 1;
    });
    Object.values(grid).forEach(cell => {
      const intensity = Math.min(1, cell.n / 8);
      L.circle([cell.lat, cell.lng], {
        radius: 350 + cell.n * 60,
        fillColor: '#ef4444',
        color: 'transparent',
        fillOpacity: intensity * 0.18,
      }).addTo(heat);
    });
  }, [filtered, showHeat]);

  const filters: { id: Filter; label: string; color?: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'critical', label: 'Critical', color: PRIORITY_COLORS.critical },
    { id: 'high', label: 'High', color: PRIORITY_COLORS.high },
    { id: 'medium', label: 'Medium', color: PRIORITY_COLORS.medium },
    { id: 'low', label: 'Low', color: PRIORITY_COLORS.low },
    { id: 'pending', label: 'Pending' },
    { id: 'resolved', label: 'Resolved' },
  ];

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="z-30 glass-card rounded-none border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img src={jansetuLogo} alt="JanMitra AI" className="w-7 h-7 rounded" />
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold tracking-wide truncate">
              <span className="text-foreground">JanMitra</span> <span className="text-primary">AI</span>{' '}
              <span className="text-muted-foreground">· Live City Map</span>
            </h1>
            <div className="text-xs text-muted-foreground">{filtered.length} of {complaints.length} complaints visible</div>
          </div>
          <button
            onClick={() => setShowHeat(s => !s)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showHeat ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Heatmap
          </button>
        </div>
        <div className="flex items-center gap-1 px-4 pb-2 overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filter === f.id ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.color && <span className="w-2 h-2 rounded-full" style={{ background: f.color }} />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="relative flex-1">
        <div ref={mapRef} className="absolute inset-0" />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-20 glass-card p-3 text-xs space-y-1.5">
          <div className="font-semibold mb-1 text-foreground">Priority</div>
          {(['critical', 'high', 'medium', 'low'] as Priority[]).map(p => (
            <div key={p} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: PRIORITY_COLORS[p] }} />
              <span className="text-muted-foreground">{PRIORITY_LABELS[p]}</span>
            </div>
          ))}
        </div>

        {/* Selected complaint card */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              className="absolute bottom-4 right-4 z-20 glass-card p-4 w-[300px] max-w-[calc(100vw-2rem)]"
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute top-2 right-2 w-6 h-6 rounded-md hover:bg-white/10 flex items-center justify-center text-muted-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{getCategoryIcon(selected.category)}</span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{CATEGORY_LABELS[selected.category]}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">{selected.id}</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{selected.description}</p>
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-3 h-3" /> {selected.ward}
                </span>
                <span className={`font-medium ${getStatusColor(selected.status)}`}>
                  {selected.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: `${PRIORITY_COLORS[selected.priority]}25`,
                    color: PRIORITY_COLORS[selected.priority],
                  }}
                >
                  {selected.priority} priority
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground">
                  {selected.department}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

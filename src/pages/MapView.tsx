import { useMemo, useState } from 'react';
import { ArrowLeft, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getComplaints } from '@/data/store';
import { type Priority } from '@/data/mockData';
import { useStoreRefresh } from '@/hooks/useStore';
import jansetuLogo from '@/assets/jansetu-logo.png';
import GoogleCityMap from '@/components/GoogleCityMap';

const PRIORITY_COLORS: Record<Priority, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#22c55e',
};

type FilterId = 'all' | Priority | 'pending' | 'resolved';

export default function MapView() {
  useStoreRefresh();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterId>('all');
  const complaints = getComplaints();

  const filtered = useMemo(() => {
    if (filter === 'all') return complaints;
    if (filter === 'pending') return complaints.filter((c) => c.status !== 'completed');
    if (filter === 'resolved') return complaints.filter((c) => c.status === 'completed');
    return complaints.filter((c) => c.priority === filter);
  }, [complaints, filter]);

  const filters: { id: FilterId; label: string; color?: string }[] = [
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
      <div className="z-30 glass-card rounded-none border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img src={jansetuLogo} alt="JanMitra AI" className="w-7 h-7 rounded" />
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold tracking-wide truncate">
              <span className="text-foreground">JanMitra</span> <span className="text-primary">AI</span>{' '}
              <span className="text-muted-foreground">· Bhopal Live City Map</span>
            </h1>
            <div className="text-xs text-muted-foreground">
              {filtered.length} of {complaints.length} complaints visible
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 px-4 pb-2 overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          {filters.map((f) => (
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

      <div className="flex-1 p-4 overflow-hidden">
        <GoogleCityMap complaints={filtered} height="100%" />
      </div>
    </div>
  );
}

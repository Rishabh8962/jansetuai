import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Search, MessageSquareHeart, Mail, Hash, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type FeedbackRow = {
  id: string;
  name: string;
  email: string;
  issue_id: string | null;
  rating: number;
  message: string;
  status: string;
  admin_response: string | null;
  created_at: string;
};

const STATUSES = ['all', 'new', 'reviewing', 'resolved'] as const;

export default function FeedbackPanel() {
  const [items, setItems] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUSES)[number]>('all');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) {
      toast.error('Failed to load feedback');
      return;
    }
    setItems((data ?? []) as FeedbackRow[]);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return items.filter((f) => {
      if (statusFilter !== 'all' && f.status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (
          !f.name.toLowerCase().includes(s) &&
          !f.email.toLowerCase().includes(s) &&
          !(f.issue_id ?? '').toLowerCase().includes(s) &&
          !f.message.toLowerCase().includes(s)
        ) return false;
      }
      return true;
    });
  }, [items, statusFilter, search]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('feedback').update({ status }).eq('id', id);
    if (error) { toast.error('Update failed'); return; }
    setItems((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)));
    toast.success(`Marked as ${status}`);
  };

  const avg = items.length
    ? (items.reduce((s, f) => s + f.rating, 0) / items.length).toFixed(1)
    : '–';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquareHeart className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold">Citizen Feedback</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            {items.length} total · avg rating {avg}/5
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, issue ID, message…"
            className="pl-9"
          />
        </div>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              statusFilter === s ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card p-8 text-center text-sm text-muted-foreground">
          No feedback found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{f.name}</div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{f.email}</span>
                    {f.issue_id && <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{f.issue_id}</span>}
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />
                      {new Date(f.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {[1,2,3,4,5].map((n) => (
                    <Star key={n} className={`w-3.5 h-3.5 ${n <= f.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                  ))}
                </div>
              </div>
              <p className="text-sm">{f.message}</p>
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${
                  f.status === 'resolved' ? 'bg-success/15 text-success' :
                  f.status === 'reviewing' ? 'bg-warning/15 text-warning' :
                  'bg-primary/15 text-primary'
                }`}>{f.status}</span>
                <div className="flex gap-1">
                  {f.status !== 'reviewing' && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(f.id, 'reviewing')} className="h-7 text-xs">
                      Reviewing
                    </Button>
                  )}
                  {f.status !== 'resolved' && (
                    <Button size="sm" onClick={() => updateStatus(f.id, 'resolved')} className="h-7 text-xs gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Resolve
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

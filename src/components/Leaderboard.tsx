import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Star } from 'lucide-react';

interface Entry {
  rank: number;
  name: string;
  points: number;
  reports: number;
  badge?: string;
}

const TOP_CONTRIBUTORS: Entry[] = [
  { rank: 1, name: 'Priya Sharma', points: 2840, reports: 47, badge: 'City Champion' },
  { rank: 2, name: 'Rajesh Kumar', points: 2310, reports: 39, badge: 'Civic Hero' },
  { rank: 3, name: 'Meera Nair', points: 1980, reports: 33, badge: 'Watchdog' },
  { rank: 4, name: 'You', points: 1240, reports: 18, badge: 'Active Reporter' },
  { rank: 5, name: 'Arjun Reddy', points: 980, reports: 14 },
];

const rankColor = (r: number) =>
  r === 1 ? 'from-yellow-400 to-amber-500'
  : r === 2 ? 'from-slate-300 to-slate-400'
  : r === 3 ? 'from-amber-600 to-amber-700'
  : 'from-primary/40 to-primary/20';

const rankIcon = (r: number) =>
  r === 1 ? Trophy : r === 2 ? Medal : r === 3 ? Award : Star;

export default function Leaderboard({ compact = false }: { compact?: boolean }) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="section-title">Top Contributors</div>
          <div className="text-xs text-muted-foreground mt-0.5">Earn points by reporting verified issues</div>
        </div>
        <Trophy className="w-5 h-5 text-warning" />
      </div>
      <div className="space-y-2">
        {(compact ? TOP_CONTRIBUTORS.slice(0, 3) : TOP_CONTRIBUTORS).map((e, i) => {
          const Icon = rankIcon(e.rank);
          const isYou = e.name === 'You';
          return (
            <motion.div
              key={e.rank}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 p-2 rounded-xl border transition-colors ${
                isYou ? 'bg-primary/10 border-primary/40' : 'bg-white/[0.02] border-white/5'
              }`}
            >
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${rankColor(e.rank)} flex items-center justify-center shadow-md`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium flex items-center gap-1.5 truncate">
                  {e.name}
                  {isYou && <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary text-primary-foreground">you</span>}
                </div>
                {e.badge && <div className="text-[10px] text-muted-foreground truncate">{e.badge} · {e.reports} reports</div>}
              </div>
              <div className="text-right">
                <div className="text-sm font-mono font-semibold gradient-text">{e.points.toLocaleString()}</div>
                <div className="text-[10px] text-muted-foreground">pts</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

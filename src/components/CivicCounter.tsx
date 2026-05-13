import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  label: string;
  value: number;
  suffix?: string;
  tone?: 'saffron' | 'india-green' | 'navy' | 'primary';
  delay?: number;
}

const TONE: Record<string, string> = {
  saffron: 'text-saffron border-saffron/30 bg-saffron/10',
  'india-green': 'text-india-green border-india-green/30 bg-india-green/10',
  navy: 'text-navy border-navy/40 bg-navy/15',
  primary: 'text-primary border-primary/30 bg-primary/10',
};

export default function CivicCounter({ icon: Icon, label, value, suffix = '', tone = 'primary', delay = 0 }: Props) {
  const [n, setN] = useState(0);

  useEffect(() => {
    const dur = 1200;
    const start = performance.now() + delay * 1000;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - start) / dur));
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, delay]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card p-4 flex items-center gap-3"
    >
      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${TONE[tone]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-mono font-bold tracking-tight text-foreground">
          {n.toLocaleString()}{suffix}
        </div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      </div>
    </motion.div>
  );
}

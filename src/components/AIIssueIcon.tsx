import { Trash2, Droplets, Lightbulb, Construction, TreePine, Waves, type LucideIcon } from 'lucide-react';

const MAP: Record<string, { emoji: string; icon: LucideIcon; tone: string }> = {
  garbage:        { emoji: '🗑️', icon: Trash2,       tone: 'from-saffron/30 to-saffron/10 text-saffron' },
  drainage:       { emoji: '🕳️', icon: Waves,        tone: 'from-navy/30 to-navy/10 text-navy' },
  sewage_overflow:{ emoji: '🕳️', icon: Waves,        tone: 'from-navy/30 to-navy/10 text-navy' },
  water_leakage:  { emoji: '💧', icon: Droplets,     tone: 'from-accent/30 to-accent/10 text-accent' },
  streetlight:    { emoji: '💡', icon: Lightbulb,    tone: 'from-warning/30 to-warning/10 text-warning' },
  road_damage:    { emoji: '🚧', icon: Construction, tone: 'from-saffron/30 to-saffron/10 text-saffron' },
  pothole:        { emoji: '🚧', icon: Construction, tone: 'from-saffron/30 to-saffron/10 text-saffron' },
  tree:           { emoji: '🌳', icon: TreePine,     tone: 'from-india-green/30 to-india-green/10 text-india-green' },
};

export function getIssueIcon(category?: string) {
  return MAP[category || ''] ?? { emoji: '✨', icon: Lightbulb, tone: 'from-primary/30 to-accent/20 text-primary' };
}

export default function AIIssueIcon({ category, size = 64 }: { category?: string; size?: number }) {
  const cfg = getIssueIcon(category);
  return (
    <div
      className={`relative rounded-3xl bg-gradient-to-br ${cfg.tone} flex items-center justify-center shadow-civic`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span style={{ fontSize: size * 0.5 }} className="leading-none">{cfg.emoji}</span>
    </div>
  );
}

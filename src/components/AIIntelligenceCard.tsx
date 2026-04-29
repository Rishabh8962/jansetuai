import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, AlertTriangle, ShieldCheck, Zap, Activity, Check, X, Loader2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CATEGORIES, CATEGORY_LABELS, getCategoryIcon, type ComplaintCategory } from '@/data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

export interface AIIntelResult {
  category: ComplaintCategory | string;
  department: string;
  confidence: number;
  confidenceBand: 'low' | 'medium' | 'high';
  severity: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  explanation: string;
  factors: string[];
  keywords: string[];
  isEmergency: boolean;
  urgencyHits: string[];
  sentiment: 'negative' | 'neutral' | 'positive';
  adjustments: string[];
  needsConfirmation: boolean;
  modelLayers: string[];
}

interface Props {
  loading?: boolean;
  result?: AIIntelResult | null;
  onConfirm?: (correct: boolean, correctedCategory?: string) => void;
  confirmed?: 'correct' | 'corrected' | null;
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-destructive/15 text-destructive border-destructive/30',
  medium: 'bg-warning/15 text-warning border-warning/30',
  low: 'bg-success/15 text-success border-success/30',
};

const BAND_COLORS = {
  high: 'from-success to-emerald-400',
  medium: 'from-warning to-amber-400',
  low: 'from-destructive to-rose-400',
};

export function AIIntelligenceCard({ loading, result, onConfirm, confirmed }: Props) {
  const [editing, setEditing] = useState(false);
  const [corrected, setCorrected] = useState<string>('');

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          key="loading"
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8 }}
          className="glass-card p-5 border-primary/40 relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-2xl animate-pulse" />
          </div>
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center ring-2 ring-primary/40 animate-pulse">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-primary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> JanMitra AI is thinking…
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Rule layer · Vision model · Context re-rank
              </div>
            </div>
          </div>
          <div className="relative mt-3 grid grid-cols-3 gap-1.5">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="h-1.5 rounded-full bg-primary/30 overflow-hidden"
                initial={{ opacity: 0.3 }}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-accent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {result && !loading && (
        <motion.div
          key="result"
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          className="space-y-3"
        >
          {/* Emergency banner */}
          {result.isEmergency && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl bg-destructive text-destructive-foreground p-3 flex items-center gap-3 shadow-lg shadow-destructive/40 animate-pulse"
            >
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-bold uppercase tracking-wide">Emergency detected</div>
                <div className="text-xs opacity-90">Routing as CRITICAL priority for immediate response.</div>
              </div>
            </motion.div>
          )}

          {/* Hero AI result card */}
          <div className="glass-card p-5 border-primary/40 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 blur-3xl pointer-events-none" />

            <div className="relative flex items-start gap-3">
              <motion.div
                initial={{ rotate: -20, scale: 0.7 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260 }}
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center ring-2 ring-primary/40 shrink-0"
              >
                <Brain className="w-6 h-6 text-primary-foreground" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-primary/80 font-semibold">AI Classification</div>
                <div className="text-2xl font-bold text-foreground leading-tight truncate">
                  {getCategoryIcon(result.category as ComplaintCategory)} {CATEGORY_LABELS[result.category as ComplaintCategory] || result.category}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 italic line-clamp-2">"{result.title}"</div>
              </div>
            </div>

            {/* Confidence meter */}
            <div className="relative mt-4">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-muted-foreground uppercase tracking-wider font-semibold">Confidence</span>
                <span className="font-mono font-bold text-foreground">{(result.confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.confidence * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full bg-gradient-to-r ${BAND_COLORS[result.confidenceBand]}`}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                <span>Low</span><span>Medium</span><span>High</span>
              </div>
            </div>

            {/* Priority + meta chips */}
            <div className="relative flex flex-wrap items-center gap-2 mt-4">
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${PRIORITY_COLORS[result.priority]}`}>
                <Zap className="w-3 h-3 inline mr-1" />{result.priority}
              </span>
              <span className="text-[11px] px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                Severity: {result.severity}
              </span>
              <span className="text-[11px] px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                {result.department}
              </span>
              {result.sentiment === 'negative' && (
                <span className="text-[11px] px-2 py-1 rounded-full bg-warning/15 text-warning">
                  😠 Negative sentiment
                </span>
              )}
            </div>
          </div>

          {/* Explainability */}
          <div className="glass-card p-4 border-accent/30">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-accent" />
              <div className="text-xs font-bold text-accent uppercase tracking-wider">Why this classification?</div>
            </div>
            <p className="text-sm text-foreground leading-relaxed mb-3">{result.explanation}</p>

            {result.factors.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {result.factors.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.06 }}
                    className="text-xs text-muted-foreground flex items-start gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                    <span>{f}</span>
                  </motion.div>
                ))}
              </div>
            )}

            {result.keywords.length > 0 && (
              <div className="flex items-start gap-2 flex-wrap pt-2 border-t border-border/40">
                <Tag className="w-3 h-3 text-muted-foreground mt-1" />
                {result.keywords.map(k => (
                  <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-mono">
                    {k}
                  </span>
                ))}
              </div>
            )}

            {result.adjustments.length > 0 && (
              <div className="mt-3 pt-2 border-t border-border/40 space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Context adjustments</div>
                {result.adjustments.map((a, i) => (
                  <div key={i} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-success" />{a}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 pt-2 border-t border-border/40 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Pipeline:</span>
              {result.modelLayers.map((m, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Confirmation / feedback loop */}
          {!confirmed && onConfirm && (
            <div className={`glass-card p-3 ${result.needsConfirmation ? 'border-warning/40' : 'border-border/40'}`}>
              {!editing ? (
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-semibold">
                      {result.needsConfirmation ? '⚠️ Did we get this right?' : 'Help us improve — was this correct?'}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Your feedback trains the JanMitra AI model.
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => onConfirm(true)} className="gap-1 border-success/40 text-success hover:bg-success/10">
                    <Check className="w-3.5 h-3.5" /> Yes
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="gap-1 border-destructive/40 text-destructive hover:bg-destructive/10">
                    <X className="w-3.5 h-3.5" /> No
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Pick the correct category:</div>
                  <Select value={corrected} onValueChange={setCorrected}>
                    <SelectTrigger className="bg-card border-border h-9">
                      <SelectValue placeholder="Choose category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {getCategoryIcon(cat)} {CATEGORY_LABELS[cat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="flex-1">Cancel</Button>
                    <Button size="sm" disabled={!corrected} onClick={() => { onConfirm(false, corrected); setEditing(false); }} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                      Submit correction
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {confirmed && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className={`glass-card p-2.5 flex items-center gap-2 text-xs ${
                confirmed === 'correct' ? 'border-success/40 text-success' : 'border-primary/40 text-primary'
              }`}>
              <Check className="w-3.5 h-3.5" />
              {confirmed === 'correct'
                ? 'Thanks! Recorded as a correct prediction.'
                : 'Correction saved — JanMitra AI will learn from this.'}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

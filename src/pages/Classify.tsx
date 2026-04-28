import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Send, Sparkles, Image as ImageIcon, Mic, MicOff, ArrowRight, Building2, ShieldCheck, Lightbulb, X, History } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AIIntelligenceCard, type AIIntelResult } from '@/components/AIIntelligenceCard';
import { SmartImageUpload } from '@/components/SmartImageUpload';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { CATEGORY_LABELS, CATEGORY_DEPARTMENTS, getCategoryIcon, type ComplaintCategory } from '@/data/mockData';
import jansetuLogo from '@/assets/jansetu-logo.png';
import { addComplaint, getComplaints } from '@/data/store';
import type { Complaint } from '@/data/mockData';

const HINT_RULES: { match: RegExp; label: string; tone: 'info' | 'warn' | 'ai' }[] = [
  { match: /\b(garbage|trash|waste|bin|dump|litter)\b/i, label: 'Looks like a Sanitation issue', tone: 'ai' },
  { match: /\b(pothole|road|cracks?|cave[- ]?in|highway)\b/i, label: 'Looks like a Roads issue', tone: 'ai' },
  { match: /\b(water|pipe|leak|burst|supply|tap)\b/i, label: 'Looks like a Water Supply issue', tone: 'ai' },
  { match: /\b(drain|sewage|sewer|manhole|overflow)\b/i, label: 'Looks like a Drainage / Sewage issue', tone: 'ai' },
  { match: /\b(street\s?light|lamp|bulb|dark|flickering)\b/i, label: 'Looks like an Electricity issue', tone: 'ai' },
  { match: /\b(fire|burning|gas leak|electric shock|electrocut|collapse|accident|injur)\b/i, label: '🚨 Possible emergency — will route as critical', tone: 'warn' },
  { match: /^.{0,18}$/, label: 'Try adding more details — location, duration, severity', tone: 'info' },
];

const EXAMPLES = [
  'Garbage not collected for 3 days near my building',
  'Large pothole on MG Road causing accidents at night',
  'Water pipeline burst, flooding the entire street',
  'Streetlight near park has been off for a week',
];

export default function Classify() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showImage, setShowImage] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AIIntelResult | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'corrected' | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const voice = useVoiceInput({ onResult: (t) => setText((prev) => (prev ? prev + ' ' : '') + t) });

  const hints = useMemo(() => {
    if (!text.trim()) return [];
    const out: { label: string; tone: string }[] = [];
    for (const rule of HINT_RULES) {
      if (rule.match.test(text)) out.push({ label: rule.label, tone: rule.tone });
      if (out.length >= 2) break;
    }
    return out;
  }, [text]);

  const similar = useMemo(() => {
    if (text.trim().length < 12) return null;
    const tokens = text.toLowerCase().split(/\s+/).filter(t => t.length > 4);
    if (tokens.length === 0) return null;
    const all = getComplaints();
    const hit = all.find(c => {
      const blob = (c.description + ' ' + c.category).toLowerCase();
      const score = tokens.reduce((acc, t) => acc + (blob.includes(t) ? 1 : 0), 0);
      return score >= 2;
    });
    return hit || null;
  }, [text]);

  const analyze = useCallback(async () => {
    if (!text.trim() && !imageUrl) {
      toast.error('Describe the issue or upload an image first');
      return;
    }
    setAnalyzing(true);
    setResult(null);
    setFeedback(null);
    try {
      const { data, error } = await supabase.functions.invoke('classify-complaint', {
        body: { text, imageUrl: imageUrl || undefined },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const r = data as AIIntelResult;
      setResult(r);
      toast.success(`Classified as ${CATEGORY_LABELS[r.category as ComplaintCategory] || r.category}`);
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || '';
      if (msg.includes('Rate')) toast.error('AI rate limit — please retry shortly');
      else if (msg.includes('credits')) toast.error('AI credits exhausted');
      else toast.error('AI classification failed');
    } finally {
      setAnalyzing(false);
    }
  }, [text, imageUrl]);

  const submitFeedback = async (correct: boolean, correctedCategory?: string) => {
    if (!result) return;
    setFeedback(correct ? 'correct' : 'corrected');
    try {
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from('ai_feedback').insert({
        user_id: userData?.user?.id ?? null,
        input_text: text || null,
        image_url: imageUrl || null,
        predicted_category: result.category,
        predicted_confidence: result.confidence,
        predicted_priority: result.priority,
        corrected_category: correctedCategory ?? null,
        corrected_priority: null,
        was_correct: correct,
        reasoning: { factors: result.factors, keywords: result.keywords, adjustments: result.adjustments } as any,
      });
      toast.success(correct ? 'Thanks! Recorded as correct.' : 'Correction saved — JanSetu AI is learning.');
    } catch (e) { console.error(e); }
  };

  const fileComplaint = () => {
    if (!result) return;
    const id = `CMP-${String(Date.now()).slice(-5)}`;
    const category = result.category as ComplaintCategory;
    const priority = result.priority === 'critical' ? 'critical'
      : result.severity === 'high' ? 'high'
      : result.severity === 'low' ? 'low' : 'medium';
    const newC: Complaint = {
      id, userId: 'USR-SELF', citizenName: 'You', category,
      description: text || result.description,
      imageUrl: imageUrl || '/placeholder.svg',
      lat: 12.9716 + (Math.random() - 0.5) * 0.1,
      lng: 77.5946 + (Math.random() - 0.5) * 0.1,
      ward: 'Ward 3', status: 'submitted', priority: priority as any,
      department: CATEGORY_DEPARTMENTS[category] || result.department,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      aiConfidence: result.confidence, aiDetectedCategory: category,
    };
    addComplaint(newC);
    setSubmittedId(id);
    toast.success(`Filed as ${id} — routed to ${newC.department}`);
  };

  const reset = () => {
    setText(''); setImageUrl(null); setResult(null); setFeedback(null);
    setSubmittedId(null); setShowImage(false);
  };

  return (
    <div className="min-h-screen bg-background cyber-grid relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none hero-glow" />
      <motion.div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary)), transparent 60%)' }}
        animate={{ opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 6, repeat: Infinity }}
      />

      <nav className="relative z-20 max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={jansetuLogo} alt="JanSetu AI" className="w-8 h-8 rounded-lg" />
          <span className="font-bold tracking-tight">
            <span className="text-foreground">JanSetu</span> <span className="gradient-text">AI</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/citizen" className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-white/5">
            <History className="w-3.5 h-3.5 inline mr-1" /> My complaints
          </Link>
          <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-white/5">
            Advanced
          </Link>
        </div>
      </nav>

      <div className="relative z-10 max-w-3xl mx-auto px-4 pt-4 pb-20">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-card text-xs text-muted-foreground mb-4">
            <Sparkles className="w-3 h-3 text-accent" /> Grievance Intelligence Engine
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Describe your issue. <span className="gradient-text">AI does the rest.</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Our explainable AI classifies, prioritizes, and routes your complaint to the right department in seconds.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4 md:p-5 border-primary/30 relative"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-sm font-semibold">Tell us what's wrong</div>
              <div className="text-[11px] text-muted-foreground">Be specific — location, duration, severity</div>
            </div>
          </div>

          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g., Garbage has not been collected for 3 days near my apartment in Indiranagar"
            className="min-h-[120px] bg-secondary/40 border-border/50 focus:border-primary/60 text-base resize-none"
          />

          <AnimatePresence>
            {hints.length > 0 && !result && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 space-y-1.5 overflow-hidden"
              >
                {hints.map((h, i) => (
                  <div
                    key={i}
                    className={`text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${
                      h.tone === 'warn'
                        ? 'bg-destructive/10 text-destructive border border-destructive/30'
                        : h.tone === 'ai'
                        ? 'bg-primary/10 text-primary border border-primary/25'
                        : 'bg-secondary/60 text-muted-foreground'
                    }`}
                  >
                    {h.tone === 'warn' ? '⚠️' : h.tone === 'ai' ? <Sparkles className="w-3 h-3" /> : <Lightbulb className="w-3 h-3" />}
                    {h.label}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {similar && !result && (
              <motion.div
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-2 text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-warning/10 text-warning border border-warning/30"
              >
                <Building2 className="w-3 h-3" />
                Similar complaint already reported: <span className="font-mono">{similar.id}</span> — {CATEGORY_LABELS[similar.category]}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-3">
            {!showImage && !imageUrl ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowImage(true)}
                    className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> Add photo (optional)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (!voice.supported) { toast.error('Voice not supported in this browser'); return; }
                      voice.isListening ? voice.stop() : voice.start();
                    }}
                    className={`text-xs gap-1.5 ${voice.isListening ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {voice.isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    {voice.isListening ? 'Stop' : 'Voice'}
                  </Button>
                </div>
                <span className="text-[10px] text-muted-foreground">{text.length} chars</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Photo evidence</div>
                  <Button size="sm" variant="ghost" onClick={() => { setShowImage(false); setImageUrl(null); }} className="h-6 text-xs">
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <SmartImageUpload
                  onImageUploaded={(u) => setImageUrl(u)}
                  onImageCleared={() => setImageUrl(null)}
                  currentImage={imageUrl}
                />
              </div>
            )}
          </div>

          {!text && !result && (
            <div className="mt-3 pt-3 border-t border-border/40">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 font-semibold">Try an example</div>
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setText(ex)}
                    className="text-[11px] px-2 py-1 rounded-full bg-secondary/70 hover:bg-secondary border border-border/50 text-muted-foreground hover:text-foreground transition"
                  >
                    {ex.length > 42 ? ex.slice(0, 42) + '…' : ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={analyze}
            disabled={analyzing || (!text.trim() && !imageUrl)}
            className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-xl h-11 shadow-lg shadow-primary/30"
          >
            {analyzing ? (
              <><Brain className="w-4 h-4 animate-pulse" /> AI is analyzing your complaint…</>
            ) : (
              <><Send className="w-4 h-4" /> Analyze with AI</>
            )}
          </Button>
        </motion.div>

        <div className="mt-5">
          <AIIntelligenceCard
            loading={analyzing}
            result={result}
            confirmed={feedback}
            onConfirm={submitFeedback}
          />
        </div>

        {result && !submittedId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="mt-4 glass-card p-4 border-accent/30 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Routing</div>
              <div className="text-sm font-semibold truncate">
                Assigned to: <span className="text-accent">{CATEGORY_DEPARTMENTS[result.category as ComplaintCategory] || result.department}</span>
              </div>
            </div>
            <Button onClick={fileComplaint} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5">
              File complaint <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </motion.div>
        )}

        {submittedId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            className="mt-4 glass-card p-5 border-success/40 text-center"
          >
            <ShieldCheck className="w-10 h-10 text-success mx-auto mb-2" />
            <div className="text-sm text-muted-foreground">Filed successfully as</div>
            <div className="text-2xl font-mono font-bold gradient-text">{submittedId}</div>
            <div className="flex gap-2 justify-center mt-4">
              <Button size="sm" variant="outline" onClick={reset} className="border-border/50">Report another</Button>
              <Button size="sm" onClick={() => navigate('/citizen')} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Track status <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}

        <div className="mt-8 text-center text-[11px] text-muted-foreground">
          Powered by a multi-layer AI pipeline · Rule layer → Vision model → Context re-rank
        </div>
      </div>
    </div>
  );
}

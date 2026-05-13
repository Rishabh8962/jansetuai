import { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Send, Sparkles, Image as ImageIcon, Mic, MicOff, ArrowRight, Building2,
  ShieldCheck, Lightbulb, X, History, Zap, Bot, MapPin, Activity, ChevronDown,
  CheckCircle2, Cpu, Network, Wrench, FileSearch, Users, BarChart3, Heart
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AIIntelligenceCard, type AIIntelResult } from '@/components/AIIntelligenceCard';
import { SmartImageUpload } from '@/components/SmartImageUpload';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { CATEGORY_LABELS, CATEGORY_DEPARTMENTS, type ComplaintCategory } from '@/data/mockData';
import jansetuLogo from '@/assets/jansetu-logo.png';
import { addComplaint, getComplaints } from '@/data/store';
import type { Complaint } from '@/data/mockData';
import { JanMitraAssistant } from '@/components/JanMitraAssistant';
import FeedbackForm from '@/components/FeedbackForm';
import LocationPicker, { type PickedLocation } from '@/components/LocationPicker';

const HINT_RULES: { match: RegExp; label: string; tone: 'info' | 'warn' | 'ai' }[] = [
  { match: /\b(garbage|trash|waste|bin|dump|litter)\b/i, label: 'Looks like a Sanitation issue', tone: 'ai' },
  { match: /\b(pothole|road|cracks?|cave[- ]?in|highway)\b/i, label: 'Looks like a Roads issue', tone: 'ai' },
  { match: /\b(water|pipe|leak|burst|supply|tap)\b/i, label: 'Looks like a Water Supply issue', tone: 'ai' },
  { match: /\b(drain|sewage|sewer|manhole|overflow)\b/i, label: 'Looks like a Drainage issue', tone: 'ai' },
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

const FEATURES = [
  { icon: Brain, title: 'AI Classification', desc: 'Auto-detects category from text and images using a multi-layer LLM pipeline.' },
  { icon: Zap, title: 'Smart Priority', desc: 'Detects urgency keywords and assigns High / Medium / Low priority instantly.' },
  { icon: Activity, title: 'Real-time Tracking', desc: 'Watch your complaint move from Submitted → In Review → Assigned → Resolved.' },
  { icon: Bot, title: 'JanMitra Assistant', desc: 'Conversational AI that helps you write, classify, and track complaints.' },
];

const FLOW_STEPS = [
  { icon: FileSearch, label: 'You describe', desc: 'Text, voice or photo' },
  { icon: Cpu, label: 'AI analyzes', desc: 'Gemini + rules' },
  { icon: Network, label: 'Auto routes', desc: 'Right department' },
  { icon: Wrench, label: 'Worker fixes', desc: 'Field assignment' },
  { icon: CheckCircle2, label: 'Resolved', desc: 'AI verified' },
];

export default function Classify() {
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showImage, setShowImage] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AIIntelResult | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'corrected' | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [location, setLocation] = useState<PickedLocation | null>(null);

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

  const openForm = () => {
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

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
      toast.success(correct ? 'Thanks! Recorded as correct.' : 'Correction saved — JanMitra AI is learning.');
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
      description: location?.address ? `${text || result.description}\n📍 ${location.address}` : (text || result.description),
      imageUrl: imageUrl || '/placeholder.svg',
      lat: location?.lat ?? 23.2599 + (Math.random() - 0.5) * 0.05,
      lng: location?.lng ?? 77.4126 + (Math.random() - 0.5) * 0.05,
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
    setSubmittedId(null); setShowImage(false); setLocation(null);
  };

  // Step progress
  const stepIdx = submittedId ? 4 : result ? (location ? 3 : 2) : (text || imageUrl ? 1 : 0);
  const STEPS = ['Upload', 'AI Analysis', 'Location', 'Details', 'Submit'];

  return (
    <div className="min-h-screen bg-background cyber-grid relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none hero-glow" />
      <motion.div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary)), transparent 60%)' }}
        animate={{ opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 6, repeat: Infinity }}
      />

      {/* NAV */}
      <nav className="relative z-20 max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={jansetuLogo} alt="JanMitra AI" className="w-8 h-8 rounded-lg" />
          <span className="font-bold tracking-tight">
            <span className="text-foreground">JanMitra</span> <span className="gradient-text">AI</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/citizen" className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-white/5 hidden sm:inline-flex items-center">
            <History className="w-3.5 h-3.5 inline mr-1" /> My complaints
          </Link>
          <a href="#portals" className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-white/5">
            Portals
          </a>
          <Button onClick={openForm} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl">
            Report Now
          </Button>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pt-10 pb-12 text-center">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          {/* Animated logo */}
          <motion.div
            className="relative w-24 h-24 mx-auto mb-6"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/40 via-accent/30 to-primary/40 blur-2xl animate-pulse" />
            <div className="relative w-full h-full rounded-3xl glass-card flex items-center justify-center border border-primary/30 shadow-[0_0_40px_-8px_hsl(var(--primary)/0.6)]">
              <img src={jansetuLogo} alt="JanMitra AI logo" className="w-14 h-14 rounded-2xl" />
            </div>
            <motion.div
              className="absolute -inset-2 rounded-3xl border border-primary/20"
              animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          </motion.div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-card text-xs text-muted-foreground mb-5">
            <Sparkles className="w-3 h-3 text-accent" /> AI-powered grievance classification system
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-4">
            <span className="text-foreground">JanMitra</span> <span className="gradient-text">AI</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-2">
            From complaint to resolution — powered by AI.
          </p>
          <p className="text-sm text-muted-foreground/80 max-w-2xl mx-auto mb-7">
            Describe an issue in your own words. Our AI classifies, prioritizes, and routes it to the right department in seconds.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={openForm}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 rounded-xl shadow-lg shadow-primary/30 h-12 px-7 text-base"
            >
              <Send className="w-4 h-4" /> Report Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/citizen')}
              className="border-white/15 bg-white/5 hover:bg-white/10 gap-2 rounded-xl h-12"
            >
              Track a complaint
            </Button>
          </div>
          <button
            onClick={openForm}
            className="mt-10 text-muted-foreground hover:text-foreground text-xs inline-flex items-center gap-1 animate-pulse"
          >
            Scroll to file <ChevronDown className="w-3 h-3" />
          </button>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pb-12">
        <div className="text-center mb-6">
          <div className="section-title mb-1">What makes it smart</div>
          <h2 className="text-2xl font-bold">Four AI superpowers</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="glass-card glass-card-hover p-5"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="font-semibold text-sm mb-1">{f.title}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pb-14">
        <div className="text-center mb-6">
          <div className="section-title mb-1">How it works</div>
          <h2 className="text-2xl font-bold">From your words to action</h2>
        </div>
        <div className="glass-card p-5 md:p-7">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-2">
            {FLOW_STEPS.map((s, i) => (
              <div key={s.label} className="relative flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center mb-2">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-sm font-semibold">{s.label}</div>
                <div className="text-[11px] text-muted-foreground">{s.desc}</div>
                {i < FLOW_STEPS.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-3 -right-2 w-4 h-4 text-muted-foreground/40" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PORTALS */}
      <section id="portals" className="relative z-10 max-w-5xl mx-auto px-4 pb-14">
        <div className="text-center mb-6">
          <div className="section-title mb-1">Choose your portal</div>
          <h2 className="text-2xl font-bold">Three apps, one platform</h2>
          <p className="text-sm text-muted-foreground mt-2">Tailored experiences for citizens, field workers and authorities.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              id: 'citizen',
              title: 'Citizen Portal',
              desc: 'Snap a photo. AI detects the issue and routes it to the right department.',
              icon: Users,
              path: '/citizen',
              gradient: 'from-primary to-accent',
              tags: ['AI Vision', 'Camera', 'Tracking', 'Voice'],
            },
            {
              id: 'worker',
              title: 'Field Worker',
              desc: 'Get assigned tasks, navigate, and upload before/after repair proof.',
              icon: Wrench,
              path: '/worker',
              gradient: 'from-warning to-destructive',
              tags: ['Task Queue', 'Navigation', 'Proof', 'AI Verify'],
            },
            {
              id: 'dashboard',
              title: 'Command Center',
              desc: 'Real-time analytics, GIS map, AI Copilot, and approval workflow.',
              icon: BarChart3,
              path: '/dashboard',
              gradient: 'from-accent to-primary',
              tags: ['Analytics', 'GIS Map', 'Copilot', 'Trust Score'],
            },
          ].map((role, i) => (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              onClick={() => navigate(role.path)}
              className="glass-card glass-card-hover p-6 text-left group relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'var(--gradient-glow)' }} />
              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <role.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-bold mb-1">{role.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{role.desc}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {role.tags.map(t => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground">{t}</span>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-xs text-primary font-medium">
                  Open portal <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* FORM (toggled) */}

      <AnimatePresence>
        {showForm && (
          <motion.section
            ref={formRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative z-10 max-w-3xl mx-auto px-4 pb-20"
          >
            <div className="text-center mb-5">
              <div className="section-title mb-1">Report an issue</div>
              <h2 className="text-2xl font-bold">Describe it. <span className="gradient-text">AI does the rest.</span></h2>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
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
                    <MapPin className="w-3 h-3" />
                    Similar complaint already reported nearby: <span className="font-mono">{similar.id}</span> — {CATEGORY_LABELS[similar.category]}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-3">
                {!showImage && !imageUrl ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button" size="sm" variant="ghost"
                        onClick={() => setShowImage(true)}
                        className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                      >
                        <ImageIcon className="w-3.5 h-3.5" /> Add photo (optional)
                      </Button>
                      <Button
                        type="button" size="sm" variant="ghost"
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
                    <SmartImageUpload onUploaded={(u) => setImageUrl(u)} />
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

                {/* Progress steps */}
                <div className="mt-5 flex items-center justify-between max-w-md mx-auto">
                  {['Submitted', 'In Review', 'Assigned', 'Resolved'].map((step, i) => (
                    <div key={step} className="flex-1 flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        i === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground border border-border'
                      }`}>
                        {i + 1}
                      </div>
                      <div className={`text-[10px] mt-1 ${i === 0 ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>{step}</div>
                      {i < 3 && <div className="absolute" />}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 justify-center mt-5">
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
          </motion.section>
        )}
      </AnimatePresence>

      {/* FEEDBACK */}
      <section id="feedback" className="relative z-10 max-w-3xl mx-auto px-4 pb-14">
        <div className="text-center mb-6">
          <div className="section-title mb-1">We listen</div>
          <h2 className="text-2xl font-bold">Help us improve JanMitra AI</h2>
          <p className="text-sm text-muted-foreground mt-2">Your feedback reaches the Command Center directly.</p>
        </div>
        <FeedbackForm />
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/10 mt-8">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src={jansetuLogo} alt="JanMitra AI" className="w-8 h-8 rounded-lg" />
            <div className="text-sm">
              <span className="font-bold text-foreground">JanMitra</span>{' '}
              <span className="gradient-text font-bold">AI</span>
              <div className="text-[11px] text-muted-foreground">Smart civic governance, powered by AI</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            Made with <Heart className="w-3.5 h-3.5 text-destructive fill-destructive" /> by{' '}
            <span className="font-semibold gradient-text">TechnoSquad</span>
          </div>
        </div>
      </footer>

      {/* Floating JanMitra assistant */}
      <JanMitraAssistant onAction={(a) => { if (a === 'report_issue' || a === 'start_complaint') openForm(); }} />
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, X, Send, Mic, MicOff, Volume2, VolumeX, Sparkles,
  FileText, MapPin, Bell, Upload, BarChart3, ListChecks, ShieldCheck,
  User, Wrench, AlertTriangle, CheckCircle2, RefreshCw, ArrowRight, HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { JanMitraAvatar } from './JanMitraAvatar';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useLang } from '@/i18n/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { addComplaint, getComplaints } from '@/data/store';
import {
  CATEGORY_LABELS, CATEGORY_DEPARTMENTS, type ComplaintCategory,
} from '@/data/mockData';

export type JanMitraRole = 'citizen' | 'worker' | 'authority';

interface Msg { role: 'user' | 'assistant'; content: string; kind?: 'text' | 'draft' }
interface Props {
  role?: JanMitraRole; // optional default; user can switch via picker
  context?: Record<string, unknown>;
  onAction?: (action: string) => void;
}

type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking';
type Mood = 'neutral' | 'happy' | 'serious' | 'excited';

interface ComplaintDraft {
  title: string;
  category: string;             // raw from AI (pothole | garbage | water_leak | ...)
  category_label: string;
  department: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  location: string | null;
  summary: string;
  reasoning: string[];
  missing_info: string[];
  emergency: boolean;
  confidence: number;
}

// Map LLM enum → client enum
const CATEGORY_MAP: Record<string, ComplaintCategory> = {
  pothole: 'pothole',
  garbage: 'garbage',
  water_leak: 'water_leakage',
  streetlight: 'streetlight',
  drainage: 'drainage',
  road_damage: 'road_damage',
  sewage: 'sewage_overflow',
  other: 'pothole', // safe fallback
};

const QUICK_ACTIONS: Record<JanMitraRole, { icon: any; label: string; prompt: string; action?: string }[]> = {
  citizen: [
    { icon: FileText, label: 'File Complaint', prompt: 'I want to report a new civic issue.', action: 'start_complaint' },
    { icon: ListChecks, label: 'Track Status', prompt: 'What is the status of my latest complaint?', action: 'track_complaint' },
    { icon: MapPin, label: 'Nearby Issues', prompt: 'Show me issues near my location.', action: 'open_map' },
    { icon: HelpCircle, label: 'Help', prompt: 'How does JanMitra work?' },
  ],
  worker: [
    { icon: ListChecks, label: 'My Tasks', prompt: 'What are my pending tasks today?', action: 'view_tasks' },
    { icon: BarChart3, label: 'Filter Queue', prompt: 'Show me high priority complaints in my ward.' },
    { icon: Upload, label: 'Upload Repair', prompt: 'Help me upload a repair proof image.', action: 'upload_repair' },
    { icon: ShieldCheck, label: 'Update Status', prompt: 'How do I update a complaint to In Progress?' },
  ],
  authority: [
    { icon: BarChart3, label: 'Today Overview', prompt: "Give me a summary of today's civic operations.", action: 'view_analytics' },
    { icon: MapPin, label: 'Hotspots', prompt: 'Predict the next civic hotspots in the city.' },
    { icon: ShieldCheck, label: 'Review Queue', prompt: 'Anything urgent in the review queue?', action: 'view_review_queue' },
  ],
};

const ROLE_GREETING: Record<JanMitraRole, string> = {
  citizen: "👋 Namaste! I'm **JanMitra**. Tell me your problem in your own words and I'll classify, structure, and file it for you. आप हिन्दी में भी लिख सकते हैं.",
  worker: "👋 Hi! I'm **JanMitra**, your field assistant. Ask me about your tasks, repair guidance, status updates, or complaint summaries.",
  authority: "👋 Welcome. I'm **JanMitra**, your governance copilot — KPIs, hotspots, slow departments, and recommendations.",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-rose-100 text-rose-700 border-rose-300',
};

export function JanMitraAssistant({ role: roleProp, context, onAction }: Props) {
  const navigate = useNavigate();
  const { lang } = useLang();
  const [open, setOpen] = useState(false);

  // Role picker state
  const [role, setRole] = useState<JanMitraRole | null>(roleProp ?? null);
  const [showRolePicker, setShowRolePicker] = useState(!roleProp);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [mouth, setMouth] = useState(0);
  const [mood, setMood] = useState<Mood>('neutral');
  const [ttsOn, setTtsOn] = useState(true);
  const [unreadHint, setUnreadHint] = useState(true);

  // Complaint flow state
  const [mode, setMode] = useState<'chat' | 'collecting' | 'preview' | 'submitted'>('chat');
  const [draft, setDraft] = useState<ComplaintDraft | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const mouthTimer = useRef<number | null>(null);

  const avatarState: AvatarState = streaming || extracting
    ? 'speaking'
    : (typeof window !== 'undefined' && (window as any)._janmitraListening)
      ? 'listening'
      : 'idle';

  const { isListening, start: startVoice, stop: stopVoice, supported: voiceSupported } = useVoiceInput({
    onResult: (text) => setInput(text),
  });
  useEffect(() => { (window as any)._janmitraListening = isListening; }, [isListening]);

  // Reset greeting whenever role changes
  useEffect(() => {
    if (role) {
      setMessages([{ role: 'assistant', content: ROLE_GREETING[role] }]);
      setMode('chat');
      setDraft(null);
      setSubmittedId(null);
    }
  }, [role]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streaming, draft, mode]);

  useEffect(() => {
    if (!open) {
      try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
      if (mouthTimer.current) { clearInterval(mouthTimer.current); mouthTimer.current = null; }
      setMouth(0);
    }
  }, [open]);

  const speak = useCallback((text: string) => {
    if (!ttsOn || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(
        text.replace(/\[\[ACTION:[^\]]+\]\]/g, '').replace(/\*\*/g, '')
      );
      u.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      u.rate = 1.02;
      u.pitch = 1.05;
      if (mouthTimer.current) clearInterval(mouthTimer.current);
      mouthTimer.current = window.setInterval(() => setMouth(Math.random() * 0.9 + 0.1), 90);
      u.onend = () => {
        if (mouthTimer.current) { clearInterval(mouthTimer.current); mouthTimer.current = null; }
        setMouth(0);
      };
      window.speechSynthesis.speak(u);
    } catch { /* noop */ }
  }, [ttsOn, lang]);

  const detectMood = (text: string): Mood => {
    const t = text.toLowerCase();
    if (/critical|urgent|hazard|danger|emergency|गंभीर|खतरा/.test(t)) return 'serious';
    if (/great|resolved|completed|thanks|शुक्रिया|बढ़िया|filed|submitted/.test(t)) return 'happy';
    if (/welcome|hello|namaste|नमस्ते/.test(t)) return 'excited';
    return 'neutral';
  };

  const runAction = useCallback((action: string) => {
    if (action === 'start_complaint') {
      setMode('collecting');
      setMessages((p) => [...p, { role: 'assistant', content: '📝 Sure! Please describe your issue in your own words — what happened, where, and since when.' }]);
      return;
    }
    if (onAction) { onAction(action); return; }
    switch (action) {
      case 'open_map': navigate('/map'); break;
      case 'view_analytics': navigate('/dashboard'); break;
      case 'view_tasks': navigate('/worker'); break;
      case 'track_complaint':
      case 'open_notifications':
      case 'upload_repair':
      case 'view_review_queue':
        toast.info(`JanMitra: opening ${action.replace('_', ' ')}…`);
        break;
    }
  }, [navigate, onAction]);

  // === Complaint creation: extract structured draft ===
  const findSimilar = useCallback((cat: ComplaintCategory) => {
    try {
      const all = getComplaints();
      const recent = all
        .filter((c) => c.category === cat && c.status !== 'completed')
        .slice(0, 1)[0];
      return recent || null;
    } catch { return null; }
  }, []);

  const extractDraft = useCallback(async (text: string) => {
    setExtracting(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/janmitra-extract`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text }),
      });
      if (!resp.ok) {
        if (resp.status === 429) toast.error('JanMitra is busy. Try again shortly.');
        else if (resp.status === 402) toast.error('AI credits exhausted.');
        else toast.error('Failed to analyze complaint.');
        return;
      }
      const data = await resp.json();
      const d = data.draft as ComplaintDraft;
      setDraft(d);
      setMode('preview');
      const similar = findSimilar(CATEGORY_MAP[d.category] || 'pothole');
      setMessages((p) => [
        ...p,
        { role: 'assistant', kind: 'draft', content: `__DRAFT__${Date.now()}` },
        ...(similar ? [{ role: 'assistant' as const, content: `ℹ️ A similar **${CATEGORY_LABELS[similar.category] || similar.category}** complaint already exists nearby (${similar.id}). Do you still want to file?` }] : []),
        { role: 'assistant', content: d.emergency
          ? '🚨 This looks like an **emergency**. I marked it as **Critical** priority. Shall I file it now?'
          : 'Here is what I understood. Shall I file this complaint for you?' },
      ]);
      setMood(d.emergency ? 'serious' : 'neutral');
    } catch (e) {
      console.error(e);
      toast.error('JanMitra extraction failed.');
    } finally {
      setExtracting(false);
    }
  }, [findSimilar]);

  const submitDraft = useCallback(() => {
    if (!draft) return;
    const cat: ComplaintCategory = CATEGORY_MAP[draft.category] || 'pothole';
    const id = `CMP-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    addComplaint({
      id,
      userId: 'janmitra-user',
      citizenName: 'JanMitra Citizen',
      category: cat,
      description: draft.summary,
      imageUrl: '/placeholder.svg',
      lat: 12.9716,
      lng: 77.5946,
      ward: draft.location || 'Ward 1',
      status: 'submitted',
      priority: draft.priority,
      department: draft.department || CATEGORY_DEPARTMENTS[cat],
      createdAt: now,
      updatedAt: now,
      aiConfidence: draft.confidence,
      aiDetectedCategory: cat,
    });
    setSubmittedId(id);
    setMode('submitted');
    setMessages((p) => [...p, {
      role: 'assistant',
      content: `✅ **Complaint filed successfully!**\n\nYour Complaint ID is **${id}**. Track it anytime by saying "track ${id}". I have routed it to the **${draft.department}** team.`,
    }]);
    toast.success(`Complaint ${id} submitted`);
    setDraft(null);
  }, [draft]);

  const cancelDraft = () => {
    setDraft(null);
    setMode('chat');
    setMessages((p) => [...p, { role: 'assistant', content: 'No problem — I have discarded that draft. You can rewrite it any time.' }]);
  };

  // === Chat send (free conversation) ===
  const sendChat = useCallback(async (overrideText?: string, presetAction?: string) => {
    if (!role) return;
    const text = (overrideText ?? input).trim();
    if (!text || streaming) return;
    setInput('');
    if (isListening) stopVoice();

    // If we are collecting a complaint description from a citizen, route through extractor
    if (role === 'citizen' && mode === 'collecting') {
      setMessages((p) => [...p, { role: 'user', content: text }, { role: 'assistant', content: '🧠 Analyzing your complaint…' }]);
      await extractDraft(text);
      // Remove the placeholder loader
      setMessages((p) => p.filter((m, i) => !(m.role === 'assistant' && m.content === '🧠 Analyzing your complaint…')));
      return;
    }

    // Auto-detect citizen complaint intent on first descriptive message
    if (role === 'citizen' && mode === 'chat' && /\b(pothole|garbage|water|leak|street ?light|drain|sewage|fire|accident|road|broken|burst|overflow|गड्ढा|कचरा|पानी|बिजली)\b/i.test(text) && text.length > 25) {
      setMessages((p) => [...p, { role: 'user', content: text }, { role: 'assistant', content: '🧠 Looks like a complaint — analyzing…' }]);
      await extractDraft(text);
      setMessages((p) => p.filter((m) => m.content !== '🧠 Looks like a complaint — analyzing…'));
      return;
    }

    const next: Msg[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setStreaming(true);
    setMood('neutral');
    setMessages((p) => [...p, { role: 'assistant', content: '' }]);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/janmitra-chat`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          role,
          context: { ...context, language: lang, presetAction, mode },
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!resp.ok) {
        if (resp.status === 429) toast.error('JanMitra is busy. Try again shortly.');
        else if (resp.status === 402) toast.error('AI credits exhausted.');
        else toast.error('JanMitra failed to respond.');
        setStreaming(false);
        setMessages((p) => p.slice(0, -1));
        return;
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let acc = '';
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line || line.startsWith(':')) continue;
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              acc += delta;
              setMessages((p) => p.map((m, i) => i === p.length - 1 ? { ...m, content: acc } : m));
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      setMood(detectMood(acc));
      const actMatch = acc.match(/\[\[ACTION:([a-z_]+)\]\]/i);
      if (actMatch) {
        const cleaned = acc.replace(/\[\[ACTION:[^\]]+\]\]/g, '').trim();
        setMessages((p) => p.map((m, i) => i === p.length - 1 ? { ...m, content: cleaned } : m));
        setTimeout(() => runAction(actMatch[1]), 600);
      }
      speak(acc);
    } catch (e) {
      console.error(e);
      toast.error('JanMitra connection failed.');
      setMessages((p) => p.slice(0, -1));
    } finally {
      setStreaming(false);
    }
  }, [role, input, streaming, isListening, stopVoice, messages, context, lang, mode, extractDraft, runAction, speak]);

  const handleQuickAction = (q: { prompt: string; action?: string }) => {
    if (q.action) runAction(q.action);
    else sendChat(q.prompt);
  };

  const pickRole = (r: JanMitraRole) => {
    setRole(r);
    setShowRolePicker(false);
  };

  const quickActions = useMemo(() => role ? QUICK_ACTIONS[role] : [], [role]);

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setOpen(true); setUnreadHint(false); }}
            className="fixed bottom-5 right-5 z-50 rounded-full shadow-2xl shadow-indigo-500/40 bg-gradient-to-br from-indigo-600 via-violet-600 to-teal-500 p-2"
            aria-label="Open JanMitra assistant"
          >
            <div className="relative">
              <JanMitraAvatar state="idle" size={64} mood="excited" />
              {unreadHint && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
              )}
            </div>
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full px-2 py-0.5 text-[10px] font-semibold rounded-full bg-white/95 text-indigo-700 shadow whitespace-nowrap">
              JanMitra
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
            className="fixed bottom-4 right-4 z-50 w-[min(94vw,440px)] h-[min(82vh,680px)] rounded-3xl overflow-hidden border border-white/40 shadow-2xl shadow-indigo-900/30 backdrop-blur-2xl bg-gradient-to-br from-white/85 via-white/70 to-indigo-50/80 flex flex-col"
          >
            {/* Header */}
            <div className="relative flex items-center gap-3 px-4 pt-4 pb-3 bg-gradient-to-r from-indigo-600/95 via-violet-600/95 to-teal-500/95 text-white">
              <JanMitraAvatar state={avatarState} mood={mood} size={56} mouth={mouth} />
              <div className="flex-1 min-w-0">
                <div className="font-bold leading-tight flex items-center gap-1.5">
                  JanMitra <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] opacity-90 capitalize flex items-center gap-1.5">
                  {role ? `${role} mode` : 'choose role'} •{' '}
                  {extracting ? 'analyzing…' : streaming ? 'thinking…' : isListening ? 'listening…' : 'online'}
                  {role && (
                    <button
                      onClick={() => setShowRolePicker(true)}
                      className="ml-1 underline underline-offset-2 hover:opacity-80 text-[10px]"
                    >switch</button>
                  )}
                </div>
              </div>
              <Button
                size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setTtsOn((v) => !v)}
                title={ttsOn ? 'Mute voice' : 'Enable voice'}
              >
                {ttsOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              <Button
                size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setOpen(false)} aria-label="Close"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Role picker overlay */}
            {showRolePicker && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex-1 overflow-y-auto p-5 space-y-3 bg-gradient-to-b from-white/70 to-indigo-50/60"
              >
                <div className="text-center mb-3">
                  <div className="text-base font-bold text-slate-800">Who are you?</div>
                  <div className="text-xs text-slate-600">Choose your role so I can help better</div>
                </div>
                <button
                  onClick={() => pickRole('citizen')}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white border-2 border-indigo-200 hover:border-indigo-500 hover:shadow-lg transition text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800">Citizen</div>
                    <div className="text-xs text-slate-600">Report & track civic issues</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-indigo-500" />
                </button>
                <button
                  onClick={() => pickRole('worker')}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white border-2 border-teal-200 hover:border-teal-500 hover:shadow-lg transition text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white">
                    <Wrench className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800">Worker / Department Staff</div>
                    <div className="text-xs text-slate-600">Manage tasks & update statuses</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-teal-500" />
                </button>
                <button
                  onClick={() => pickRole('authority')}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white border-2 border-amber-200 hover:border-amber-500 hover:shadow-lg transition text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800">Authority</div>
                    <div className="text-xs text-slate-600">KPIs, hotspots & oversight</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-500" />
                </button>
              </motion.div>
            )}

            {/* Messages */}
            {!showRolePicker && (
              <>
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
                  {messages.map((m, i) => {
                    if (m.kind === 'draft' && draft) {
                      return (
                        <DraftCard
                          key={i}
                          draft={draft}
                          onSubmit={submitDraft}
                          onCancel={cancelDraft}
                          onEdit={() => {
                            setMode('collecting');
                            setMessages((p) => [...p, { role: 'assistant', content: '✏️ No problem — please rewrite or add more details.' }]);
                          }}
                        />
                      );
                    }
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                          m.role === 'user'
                            ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-br-sm'
                            : 'bg-white/90 text-slate-800 border border-indigo-100 rounded-bl-sm'
                        }`}>
                          {m.role === 'assistant' && m.content === '' && streaming ? (
                            <span className="inline-flex gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:120ms]" />
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:240ms]" />
                            </span>
                          ) : (
                            <span dangerouslySetInnerHTML={{
                              __html: m.content
                                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                                .replace(/\n/g, '<br/>'),
                            }} />
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                  {extracting && (
                    <div className="flex justify-start">
                      <div className="px-3 py-2 rounded-2xl bg-white/90 border border-indigo-100 text-xs text-indigo-700 inline-flex items-center gap-2">
                        <RefreshCw className="w-3 h-3 animate-spin" /> AI is structuring your complaint…
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick actions */}
                <div className="px-3 pb-1.5 flex flex-wrap gap-1.5 border-t border-white/40 pt-2 bg-white/50">
                  {quickActions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickAction(q)}
                      disabled={streaming || extracting}
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 transition"
                    >
                      <q.icon className="w-3 h-3" />
                      {q.label}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <div className="px-3 pb-3 pt-2 bg-white/60">
                  <div className="flex items-end gap-2">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
                      }}
                      placeholder={
                        role === 'citizen' && mode === 'collecting'
                          ? 'Describe your issue in detail…'
                          : lang === 'hi' ? 'अपना सवाल लिखें…' : 'Ask JanMitra anything…'
                      }
                      rows={1}
                      className="min-h-[42px] max-h-28 resize-none bg-white text-slate-900 placeholder:text-slate-400 border-indigo-200 focus-visible:ring-indigo-400"
                    />
                    {voiceSupported && (
                      <Button
                        size="icon"
                        variant={isListening ? 'destructive' : 'outline'}
                        className="h-10 w-10 shrink-0"
                        onClick={() => (isListening ? stopVoice() : startVoice())}
                        title={isListening ? 'Stop listening' : 'Speak'}
                      >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </Button>
                    )}
                    <Button
                      size="icon"
                      className="h-10 w-10 shrink-0 bg-gradient-to-br from-indigo-600 to-teal-500 hover:opacity-90"
                      onClick={() => sendChat()}
                      disabled={!input.trim() || streaming || extracting}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function DraftCard({
  draft, onSubmit, onCancel, onEdit,
}: {
  draft: ComplaintDraft;
  onSubmit: () => void;
  onCancel: () => void;
  onEdit: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-white to-indigo-50/60 p-3 shadow-md"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700">
          <Sparkles className="w-3.5 h-3.5" />
          AI-STRUCTURED COMPLAINT
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
          {(draft.confidence * 100).toFixed(0)}% conf
        </span>
      </div>

      <div className="font-semibold text-slate-800 text-sm leading-tight mb-1.5">{draft.title}</div>
      <div className="text-xs text-slate-600 mb-2.5 leading-relaxed">{draft.summary}</div>

      {draft.emergency && (
        <div className="mb-2 px-2 py-1.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-1.5 text-[11px] font-semibold text-rose-700">
          <AlertTriangle className="w-3.5 h-3.5" />
          Emergency detected — auto-marked critical
        </div>
      )}

      <div className="grid grid-cols-2 gap-1.5 mb-2.5 text-[11px]">
        <Field label="Category" value={draft.category_label} />
        <Field label="Priority" value={draft.priority.toUpperCase()} className={PRIORITY_COLORS[draft.priority]} />
        <Field label="Department" value={draft.department} />
        <Field label="Location" value={draft.location || 'Not specified'} />
      </div>

      {draft.reasoning?.length > 0 && (
        <div className="mb-2 px-2 py-1.5 rounded-lg bg-violet-50 border border-violet-100">
          <div className="text-[10px] font-bold uppercase text-violet-700 mb-0.5 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" /> Why this classification?
          </div>
          <ul className="text-[11px] text-violet-900 space-y-0.5">
            {draft.reasoning.slice(0, 3).map((r, i) => <li key={i}>• {r}</li>)}
          </ul>
        </div>
      )}

      {draft.missing_info?.length > 0 && (
        <div className="mb-2.5 px-2 py-1.5 rounded-lg bg-amber-50 border border-amber-100">
          <div className="text-[10px] font-bold uppercase text-amber-700 mb-0.5">Add for faster resolution</div>
          <ul className="text-[11px] text-amber-900 space-y-0.5">
            {draft.missing_info.slice(0, 3).map((r, i) => <li key={i}>• {r}</li>)}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <Button size="sm" className="flex-1 h-8 text-xs bg-gradient-to-r from-indigo-600 to-teal-500" onClick={onSubmit}>
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> File Complaint
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onEdit}>
          Edit
        </Button>
        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </motion.div>
  );
}

function Field({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className={`px-2 py-1 rounded-lg border ${className || 'bg-white border-indigo-100'}`}>
      <div className="text-[9px] uppercase tracking-wide opacity-60">{label}</div>
      <div className="font-semibold leading-tight">{value}</div>
    </div>
  );
}

export default JanMitraAssistant;

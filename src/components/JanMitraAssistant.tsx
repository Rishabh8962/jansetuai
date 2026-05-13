import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Mic, MicOff, Volume2, VolumeX, Sparkles, FileText, MapPin, Bell, Upload, BarChart3, ListChecks, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { JanMitraAvatar } from './JanMitraAvatar';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useLang } from '@/i18n/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export type JanMitraRole = 'citizen' | 'worker' | 'authority';

interface Msg { role: 'user' | 'assistant'; content: string }
interface Props {
  role: JanMitraRole;
  context?: Record<string, unknown>;
  /** Optional: handle in-app actions emitted via [[ACTION:name]] tags */
  onAction?: (action: string) => void;
}

type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking';
type Mood = 'neutral' | 'happy' | 'serious' | 'excited';

const QUICK_ACTIONS: Record<JanMitraRole, { icon: any; label: string; prompt: string; action?: string }[]> = {
  citizen: [
    { icon: FileText, label: 'Report Issue', prompt: 'I want to report a new civic issue.', action: 'report_issue' },
    { icon: MapPin, label: 'Nearby Issues', prompt: 'Show me issues near my location.', action: 'open_map' },
    { icon: Sparkles, label: 'Track Status', prompt: 'What is the status of my latest complaint?', action: 'track_complaint' },
    { icon: Bell, label: 'My Alerts', prompt: 'Show my notifications.', action: 'open_notifications' },
  ],
  worker: [
    { icon: ListChecks, label: 'My Tasks', prompt: 'What are my pending tasks today?', action: 'view_tasks' },
    { icon: Upload, label: 'Upload Repair', prompt: 'Help me upload a repair proof image.', action: 'upload_repair' },
    { icon: ShieldCheck, label: 'How to Fix?', prompt: 'Guide me through fixing this current task.' },
  ],
  authority: [
    { icon: BarChart3, label: 'Today Overview', prompt: 'Give me a summary of today\'s civic operations.', action: 'view_analytics' },
    { icon: MapPin, label: 'Hotspots', prompt: 'Predict the next civic hotspots in the city.' },
    { icon: ShieldCheck, label: 'Review Queue', prompt: 'Anything urgent in the review queue?', action: 'view_review_queue' },
  ],
};

const ROLE_GREETING: Record<JanMitraRole, string> = {
  citizen: '👋 Namaste! I\'m **JanMitra**, your civic AI companion. Ask me anything — report an issue, track status, or explore your area.',
  worker: '👋 Hi! I\'m **JanMitra**. I\'ll help you with your assigned tasks, repair guidance, and proof uploads.',
  authority: '👋 Welcome. I\'m **JanMitra**, your governance copilot — ask for KPIs, hotspots, slow departments, or recommendations.',
};

export function JanMitraAssistant({ role, context, onAction }: Props) {
  const navigate = useNavigate();
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ role: 'assistant', content: ROLE_GREETING[role] }]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [mouth, setMouth] = useState(0);
  const [mood, setMood] = useState<Mood>('neutral');
  const [ttsOn, setTtsOn] = useState(true);
  const [unreadHint, setUnreadHint] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mouthTimer = useRef<number | null>(null);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const avatarState: AvatarState = streaming
    ? 'speaking'
    : (typeof window !== 'undefined' && (window as any)._janmitraListening)
      ? 'listening'
      : 'idle';

  // Voice input
  const { isListening, start: startVoice, stop: stopVoice, supported: voiceSupported } = useVoiceInput({
    onResult: (text) => setInput(text),
  });
  useEffect(() => {
    (window as any)._janmitraListening = isListening;
  }, [isListening]);

  // Autoscroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streaming]);

  // Stop TTS when closing
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
      const u = new SpeechSynthesisUtterance(text.replace(/\[\[ACTION:[^\]]+\]\]/g, '').replace(/\*\*/g, ''));
      u.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      u.rate = 1.02;
      u.pitch = 1.05;
      utterRef.current = u;

      // Lip-sync ticker
      if (mouthTimer.current) clearInterval(mouthTimer.current);
      mouthTimer.current = window.setInterval(() => {
        setMouth(Math.random() * 0.9 + 0.1);
      }, 90);
      u.onend = () => {
        if (mouthTimer.current) { clearInterval(mouthTimer.current); mouthTimer.current = null; }
        setMouth(0);
      };
      window.speechSynthesis.speak(u);
    } catch { /* noop */ }
  }, [ttsOn, lang]);

  const detectMood = (text: string): Mood => {
    const t = text.toLowerCase();
    if (/critical|urgent|hazard|danger|गंभीर|खतरा/.test(t)) return 'serious';
    if (/great|resolved|completed|thanks|शुक्रिया|बढ़िया/.test(t)) return 'happy';
    if (/welcome|hello|namaste|नमस्ते/.test(t)) return 'excited';
    return 'neutral';
  };

  const runAction = useCallback((action: string) => {
    if (onAction) { onAction(action); return; }
    // Default routing fallback
    switch (action) {
      case 'open_map': navigate('/map'); break;
      case 'view_analytics': navigate('/dashboard'); break;
      case 'view_tasks': navigate('/worker'); break;
      case 'report_issue':
      case 'track_complaint':
      case 'open_notifications':
      case 'upload_repair':
      case 'view_review_queue':
        toast.info(`JanMitra: opening ${action.replace('_', ' ')}…`);
        break;
    }
  }, [navigate, onAction]);

  const send = useCallback(async (overrideText?: string, presetAction?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || streaming) return;
    setInput('');
    if (isListening) stopVoice();

    const next: Msg[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setStreaming(true);
    setMood('neutral');

    // Append empty assistant message we'll fill in
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
          context: { ...context, language: lang, presetAction },
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!resp.ok) {
        if (resp.status === 429) toast.error('JanMitra is busy. Try again shortly.');
        else if (resp.status === 402) toast.error('AI credits exhausted. Add funds in Lovable workspace.');
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

      // Final
      setMood(detectMood(acc));

      // Detect [[ACTION:...]] tag
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
  }, [input, streaming, isListening, stopVoice, messages, role, context, lang, speak, runAction]);

  const handleQuickAction = (q: { prompt: string; action?: string }) => {
    if (q.action) runAction(q.action);
    send(q.prompt, q.action);
  };

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
            className="fixed bottom-4 right-4 z-50 w-[min(92vw,420px)] h-[min(80vh,640px)] rounded-3xl overflow-hidden border border-white/40 shadow-2xl shadow-indigo-900/30 backdrop-blur-2xl bg-gradient-to-br from-white/85 via-white/70 to-indigo-50/80"
          >
            {/* Header */}
            <div className="relative flex items-center gap-3 px-4 pt-4 pb-3 bg-gradient-to-r from-indigo-600/95 via-violet-600/95 to-teal-500/95 text-white">
              <JanMitraAvatar state={avatarState} mood={mood} size={56} mouth={mouth} />
              <div className="flex-1 min-w-0">
                <div className="font-bold leading-tight flex items-center gap-1.5">
                  JanMitra <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] opacity-90 capitalize">
                  {role} mode • {streaming ? 'thinking…' : isListening ? 'listening…' : 'online'}
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setTtsOn((v) => !v)}
                title={ttsOn ? 'Mute voice' : 'Enable voice'}
              >
                {ttsOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 h-[calc(100%-200px)]">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      m.role === 'user'
                        ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-br-sm'
                        : 'bg-white/90 text-slate-800 border border-indigo-100 rounded-bl-sm'
                    }`}
                  >
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
              ))}
            </div>

            {/* Quick actions */}
            <div className="px-3 pb-1.5 flex flex-wrap gap-1.5 border-t border-white/40 pt-2 bg-white/50">
              {QUICK_ACTIONS[role].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAction(q)}
                  disabled={streaming}
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
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
                  }}
                  placeholder={lang === 'hi' ? 'अपना सवाल लिखें…' : 'Ask JanMitra anything…'}
                  rows={1}
                  className="min-h-[42px] max-h-28 resize-none bg-white border-indigo-200 focus-visible:ring-indigo-400"
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
                  onClick={() => send()}
                  disabled={!input.trim() || streaming}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default JanMitraAssistant;

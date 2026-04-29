import { motion } from 'framer-motion';
import { MapPin, Users, Wrench, BarChart3, Building2, Zap, Sparkles, ArrowRight, Camera, Brain, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jansetuLogo from '@/assets/jansetu-logo.png';
import { Button } from '@/components/ui/button';

const roles = [
  {
    id: 'citizen',
    title: 'Citizen Portal',
    description: 'Snap a photo. AI detects the issue and routes it to the right department.',
    icon: Users,
    path: '/citizen',
    gradient: 'from-primary to-accent',
    features: ['AI Vision', 'Camera Capture', 'Live Tracking', 'Voice Reports'],
  },
  {
    id: 'worker',
    title: 'Field Worker',
    description: 'Get assigned tasks, navigate, and upload before/after repair proof.',
    icon: Wrench,
    path: '/worker',
    gradient: 'from-warning to-destructive',
    features: ['Task Queue', 'Navigation', 'Repair Proof', 'AI Verification'],
  },
  {
    id: 'dashboard',
    title: 'Command Center',
    description: 'Real-time analytics, GIS map, AI Copilot, and approval workflow.',
    icon: BarChart3,
    path: '/dashboard',
    gradient: 'from-accent to-primary',
    features: ['Live Analytics', 'GIS Map', 'AI Copilot', 'Trust Scores'],
  },
];

const features = [
  { icon: Camera, title: 'Smart Upload', desc: 'Drag & drop, browse, or capture from camera with instant preview.' },
  { icon: Brain, title: 'AI Vision', desc: 'Gemini classifies pothole, garbage, drainage, streetlight & more.' },
  { icon: MapPin, title: 'Live Tracking', desc: 'Submitted → Assigned → In Progress → Under Review → Resolved.' },
  { icon: ShieldCheck, title: 'AI Verification', desc: 'Repair photos auto-checked before admin approval.' },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background cyber-grid relative overflow-hidden">
      {/* Hero glow background */}
      <div className="absolute inset-0 pointer-events-none hero-glow" />
      <motion.div
        className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary)), transparent 60%)' }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.25, 0.4, 0.25] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(var(--accent)), transparent 60%)' }}
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.45, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Top nav */}
      <nav className="relative z-20 max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src={jansetuLogo} alt="JanMitra AI" className="w-9 h-9 rounded-xl" />
          <span className="font-bold text-lg tracking-tight">
            <span className="text-foreground">JanMitra</span>{' '}
            <span className="gradient-text">AI</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
          <a href="#features" className="px-3 py-1.5 rounded-lg hover:text-foreground hover:bg-white/5 transition-colors">Features</a>
          <a href="#roles" className="px-3 py-1.5 rounded-lg hover:text-foreground hover:bg-white/5 transition-colors">Portals</a>
          <button onClick={() => navigate('/citizen')} className="px-3 py-1.5 rounded-lg hover:text-foreground hover:bg-white/5 transition-colors">Track</button>
        </div>
        <Button
          onClick={() => navigate('/citizen')}
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 rounded-xl"
        >
          Report Issue <ArrowRight className="w-4 h-4" />
        </Button>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-8 pb-20">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-card text-xs text-muted-foreground mb-6"
          >
            <Sparkles className="w-3 h-3 text-accent" /> AI-powered civic governance
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-bold mb-5 tracking-tight leading-[1.05]">
            Report Civic Issues{' '}
            <span className="gradient-text">Instantly with AI</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload a photo. Our AI detects potholes, garbage, drainage, streetlights and more — then routes them to the right department in real time.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
            <Button
              size="lg"
              onClick={() => navigate('/citizen')}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 rounded-xl shadow-lg shadow-primary/30"
            >
              <Camera className="w-4 h-4" /> Report Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="border-white/15 bg-white/5 hover:bg-white/10 gap-2 rounded-xl"
            >
              View Command Center
            </Button>
          </div>
          <div className="flex items-center justify-center gap-5 mt-7 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-primary" /> Gemini Vision</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-accent" /> GIS Mapping</span>
            <span className="flex items-center gap-1.5"><Building2 className="w-3 h-3 text-primary" /> Digital Twin</span>
          </div>
        </motion.div>

        {/* Feature strip */}
        <div id="features" className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-16">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
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

        {/* Role cards */}
        <div id="roles" className="mb-12">
          <div className="text-center mb-6">
            <div className="section-title mb-2">Choose your portal</div>
            <h2 className="text-2xl font-bold">Three apps, one platform</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {roles.map((role, i) => (
              <motion.button
                key={role.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                onClick={() => navigate(role.path)}
                className="glass-card glass-card-hover p-6 text-left group relative overflow-hidden"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'var(--gradient-glow)' }} />
                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.gradient} flex items-center justify-center mb-4
                    group-hover:scale-110 transition-transform shadow-lg`}>
                    <role.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h2 className="text-lg font-bold mb-1">{role.title}</h2>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{role.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {role.features.map(f => (
                      <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground">{f}</span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs text-primary font-medium">
                    Open portal <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="glass-card p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { label: 'Complaints', value: '500+', sub: 'demo dataset' },
              { label: 'Departments', value: '5', sub: 'tracked' },
              { label: 'Workers', value: '10', sub: 'field agents' },
              { label: 'AI Models', value: '5', sub: 'active' },
            ].map(s => (
              <div key={s.label}>
                <div className="text-2xl font-mono font-bold gradient-text">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="text-[10px] text-muted-foreground/60">{s.sub}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

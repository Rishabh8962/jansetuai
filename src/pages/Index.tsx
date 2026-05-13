import { motion } from 'framer-motion';
import { MapPin, Users, Wrench, BarChart3, Building2, Sparkles, ArrowRight, Camera, Brain, ShieldCheck, CheckCircle2, Activity, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jansetuLogo from '@/assets/jansetu-logo.png';
import { Button } from '@/components/ui/button';
import GoogleCityMap from '@/components/GoogleCityMap';
import CivicCounter from '@/components/CivicCounter';
import { getComplaints } from '@/data/store';
import { useStoreRefresh } from '@/hooks/useStore';
import { useMemo } from 'react';
import { CATEGORY_LABELS, getCategoryIcon } from '@/data/mockData';

const roles = [
  {
    id: 'citizen',
    title: 'Citizen Portal',
    description: 'Snap a photo. AI detects the issue and routes it to the right department.',
    icon: Users,
    path: '/citizen',
    gradient: 'from-saffron to-warning',
    features: ['AI Vision', 'Camera Capture', 'Live Tracking', 'Voice Reports'],
  },
  {
    id: 'worker',
    title: 'Field Worker',
    description: 'Get assigned tasks, navigate, and upload before/after repair proof.',
    icon: Wrench,
    path: '/worker',
    gradient: 'from-navy to-primary',
    features: ['Task Queue', 'Navigation', 'Repair Proof', 'AI Verification'],
  },
  {
    id: 'dashboard',
    title: 'Command Center',
    description: 'Real-time analytics, GIS map, AI Copilot, and approval workflow.',
    icon: BarChart3,
    path: '/dashboard',
    gradient: 'from-india-green to-accent',
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
  useStoreRefresh();
  const navigate = useNavigate();
  const complaints = getComplaints();

  const stats = useMemo(() => {
    const total = complaints.length;
    const resolved = complaints.filter(c => c.status === 'completed').length;
    return {
      resolved,
      active: Math.max(120, total * 3),
      departments: 5,
      accuracy: 96,
    };
  }, [complaints]);

  const recentAI = useMemo(() => complaints.slice(0, 3), [complaints]);

  return (
    <div className="min-h-screen bg-background cyber-grid relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none hero-glow" />
      <motion.div
        className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(var(--saffron)), transparent 60%)' }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.18, 0.32, 0.18] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(var(--india-green)), transparent 60%)' }}
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Top nav */}
      <nav className="relative z-20 max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src={jansetuLogo} alt="JanSetu" className="w-9 h-9 rounded-xl" />
          <span className="font-bold text-lg tracking-tight">
            <span className="text-foreground">Jan</span>
            <span className="text-saffron">Setu</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
          <a href="#features" className="px-3 py-1.5 rounded-lg hover:text-foreground hover:bg-white/5 transition-colors">Features</a>
          <a href="#roles" className="px-3 py-1.5 rounded-lg hover:text-foreground hover:bg-white/5 transition-colors">Portals</a>
          <button onClick={() => navigate('/citizen')} className="px-3 py-1.5 rounded-lg hover:text-foreground hover:bg-white/5 transition-colors">Track</button>
        </div>
        <Button
          onClick={() => navigate('/citizen')}
          className="bg-saffron text-saffron-foreground hover:bg-saffron/90 gap-2 rounded-xl shadow-civic"
        >
          Report Issue <ArrowRight className="w-4 h-4" />
        </Button>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-6 pb-20">
        {/* HERO — two columns */}
        <section className="grid lg:grid-cols-2 gap-8 items-center mb-20">
          {/* Left */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-card text-xs text-muted-foreground mb-5">
              <Sparkles className="w-3 h-3 text-saffron" /> Government-grade civic-tech for Bharat
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-4">
              <span className="text-foreground">Jan</span>
              <span className="text-saffron">Setu</span>
            </h1>
            <p className="text-lg md:text-xl text-foreground/90 max-w-xl mb-3 font-medium">
              Empowering Citizens. Solving Civic Issues with AI.
            </p>
            <p className="text-sm text-muted-foreground max-w-xl mb-7 leading-relaxed">
              Snap a photo, our AI detects the issue, pinpoints the location, and routes it to the right
              department in seconds — with live tracking until it's resolved.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-8">
              <Button
                size="lg"
                onClick={() => navigate('/citizen')}
                className="bg-saffron text-saffron-foreground hover:bg-saffron/90 gap-2 rounded-xl shadow-civic h-12 px-7 text-base"
              >
                <Camera className="w-4 h-4" /> Report Issue
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/citizen')}
                className="border-white/15 bg-white/5 hover:bg-white/10 gap-2 rounded-xl h-12"
              >
                Track Complaint <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <CivicCounter icon={CheckCircle2} label="Issues Resolved" value={stats.resolved} tone="india-green" />
              <CivicCounter icon={Users} label="Active Citizens" value={stats.active} tone="saffron" delay={0.1} />
              <CivicCounter icon={Building2} label="Departments" value={stats.departments} tone="navy" delay={0.2} />
              <CivicCounter icon={Target} label="AI Accuracy" value={stats.accuracy} suffix="%" tone="primary" delay={0.3} />
            </div>
          </motion.div>

          {/* Right — live map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="relative"
          >
            <div className="glass-card p-3 border-saffron/20 shadow-float">
              <div className="flex items-center justify-between px-2 pt-1 pb-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-india-green animate-pulse" />
                  Live · Bhopal
                </div>
                <div className="text-[11px] text-muted-foreground font-mono">{complaints.length} issues</div>
              </div>
              <div className="rounded-xl overflow-hidden">
                <GoogleCityMap complaints={complaints.slice(0, 40)} height="380px" colorBy="status" />
              </div>
            </div>

            {/* Floating AI cards */}
            <motion.div
              className="absolute -left-3 top-10 hidden md:block"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              {recentAI[0] && (
                <div className="glass-card p-2.5 border-saffron/30 shadow-civic flex items-center gap-2 max-w-[200px]">
                  <div className="text-2xl leading-none">{getCategoryIcon(recentAI[0].category)}</div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-saffron uppercase tracking-wider font-semibold">AI detected</div>
                    <div className="text-xs font-semibold truncate">{CATEGORY_LABELS[recentAI[0].category]}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {Math.round((recentAI[0].aiConfidence ?? 0.94) * 100)}% confidence
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div
              className="absolute -right-3 bottom-12 hidden md:block"
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            >
              {recentAI[1] && (
                <div className="glass-card p-2.5 border-india-green/30 shadow-float flex items-center gap-2 max-w-[200px]">
                  <div className="w-8 h-8 rounded-lg bg-india-green/15 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-india-green" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-india-green uppercase tracking-wider font-semibold">Resolved</div>
                    <div className="text-xs font-semibold truncate">{CATEGORY_LABELS[recentAI[1].category]}</div>
                    <div className="text-[10px] text-muted-foreground">{recentAI[1].ward}</div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        </section>

        {/* Feature strip */}
        <div id="features" className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-16">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 + i * 0.06 }}
              className="glass-card glass-card-hover p-5"
            >
              <div className="w-10 h-10 rounded-xl bg-saffron/10 flex items-center justify-center mb-3">
                <f.icon className="w-5 h-5 text-saffron" />
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
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.1 }}
                onClick={() => navigate(role.path)}
                className="glass-card glass-card-hover p-6 text-left group relative overflow-hidden"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'var(--gradient-civic)' }} />
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
                  <div className="mt-4 flex items-center gap-1 text-xs text-saffron font-medium">
                    Open portal <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

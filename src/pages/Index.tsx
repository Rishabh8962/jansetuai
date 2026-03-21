import { motion } from 'framer-motion';
import { MapPin, Users, Wrench, BarChart3, Building2, Zap, LogIn, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, ROLE_LABELS, ROLE_PATHS, logout } from '@/data/authStore';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import jansetuLogo from '@/assets/jansetu-logo.png';

const roles = [
  {
    id: 'citizen',
    title: 'Citizen Portal',
    description: 'Report civic issues, track complaints, and provide feedback',
    icon: Users,
    path: '/citizen',
    gradient: 'from-emerald-500 to-teal-600',
    features: ['Report Issues', 'Track Status', 'Voice Complaints', 'AI Detection'],
  },
  {
    id: 'worker',
    title: 'Field Worker',
    description: 'Manage assigned tasks, navigate to issues, and submit completion reports',
    icon: Wrench,
    path: '/worker',
    gradient: 'from-amber-500 to-orange-600',
    features: ['Task Queue', 'Navigation', 'Photo Upload', 'AI Verification'],
  },
  {
    id: 'dashboard',
    title: 'Government Official',
    description: 'Analytics dashboard with maps, charts, AI copilot, and department management',
    icon: BarChart3,
    path: '/dashboard',
    gradient: 'from-indigo-500 to-purple-600',
    features: ['Live Analytics', 'City Map', 'AI Copilot', 'Trust Scores'],
  },
];

export default function Index() {
  const navigate = useNavigate();
  const user = useAuth() ?? getCurrentUser();

  return (
    <div className="min-h-screen bg-background cyber-grid relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'var(--gradient-glow)' }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12 md:py-20">
        {/* Auth Bar */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex justify-end mb-6 gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/profile')} className="gap-2 text-muted-foreground hover:text-foreground">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">{user.avatar}</div>
                <span className="text-xs">{user.name}</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { logout(); window.location.reload(); }} className="text-xs text-destructive">
                Logout
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate('/login')} size="sm" className="gap-2 bg-primary text-primary-foreground">
              <LogIn className="w-4 h-4" /> Login / Sign Up
            </Button>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.img
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', duration: 0.8 }}
              src={jansetuLogo}
              alt="JanSetu AI Logo"
              className="w-20 h-20 rounded-2xl shadow-lg"
              style={{ boxShadow: 'var(--shadow-glow)' }}
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-3 tracking-tight">
            <span className="text-foreground">JanSetu</span>{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">AI</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            AI-Powered Smart City Governance Platform
          </p>
          <div className="flex items-center justify-center gap-6 mt-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-primary" /> AI Detection</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" /> GIS Mapping</span>
            <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-primary" /> Digital Twin</span>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {roles.map((role, i) => (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.15 }}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => navigate(role.path)}
              className="glass-card p-6 text-left hover:border-primary/40 transition-all group relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'var(--gradient-glow)' }} />
              <div className="relative z-10">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.gradient} flex items-center justify-center mb-4
                  group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                  <role.icon className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-lg font-bold mb-1">{role.title}</h2>
                <p className="text-sm text-muted-foreground mb-4">{role.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {role.features.map(f => (
                    <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{f}</span>
                  ))}
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="mt-12 glass-card p-5 glow-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { label: 'Complaints', value: '500+', sub: 'demo dataset', color: 'text-primary' },
              { label: 'Departments', value: '5', sub: 'tracked', color: 'text-accent' },
              { label: 'Workers', value: '10', sub: 'field agents', color: 'text-warning' },
              { label: 'AI Models', value: '5', sub: 'active', color: 'text-success' },
            ].map(s => (
              <div key={s.label}>
                <div className={`text-3xl font-mono font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="text-[10px] text-muted-foreground/60">{s.sub}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Login CTA */}
        {!user && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            className="mt-6 text-center">
            <Button onClick={() => navigate('/login')} size="lg" className="gap-2 bg-primary text-primary-foreground px-8 font-semibold shadow-lg"
              style={{ boxShadow: 'var(--shadow-glow)' }}>
              <LogIn className="w-5 h-5" /> Get Started — Login or Sign Up
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

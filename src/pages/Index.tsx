import { motion } from 'framer-motion';
import { MapPin, Users, Wrench, BarChart3, Building2, Zap, LogIn, Shield, ArrowRight, Globe, Cpu, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '@/data/authStore';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const roles = [
  {
    id: 'citizen', title: 'Citizen Portal', description: 'Report civic issues, track complaints, get AI-powered updates',
    icon: Users, path: '/citizen', color: 'from-[hsl(175,85%,42%)] to-[hsl(195,85%,45%)]',
    features: ['Report Issues', 'Track Status', 'Voice Input', 'AI Detection'],
  },
  {
    id: 'worker', title: 'Field Worker', description: 'Manage tasks, navigate to issues, submit repair proofs',
    icon: Wrench, path: '/worker', color: 'from-[hsl(38,95%,55%)] to-[hsl(25,90%,52%)]',
    features: ['Task Queue', 'Navigation', 'Photo Upload', 'AI Verify'],
  },
  {
    id: 'dashboard', title: 'Government Official', description: 'Analytics dashboard, city maps, AI copilot, department oversight',
    icon: BarChart3, path: '/dashboard', color: 'from-[hsl(260,75%,60%)] to-[hsl(280,80%,55%)]',
    features: ['Live Analytics', 'City Map', 'AI Copilot', 'Trust Scores'],
  },
];

export default function Index() {
  const navigate = useNavigate();
  const user = useAuth() ?? getCurrentUser();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 cyber-grid" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-[0.08]"
        style={{ background: 'radial-gradient(circle, hsl(175 85% 42%), transparent 70%)' }} />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-[0.05]"
        style={{ background: 'radial-gradient(circle, hsl(260 75% 60%), transparent 70%)' }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-16">
        {/* Top bar */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end mb-8 gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/profile')} className="gap-2 text-muted-foreground hover:text-foreground">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">{user.avatar}</div>
                <span className="text-xs">{user.name}</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { logout(); window.location.reload(); }} className="text-xs text-destructive hover:text-destructive">
                Logout
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate('/login')} size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <LogIn className="w-4 h-4" /> Login / Sign Up
            </Button>
          )}
        </motion.div>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-14">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
            className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-[hsl(175,85%,42%)] to-[hsl(260,75%,60%)] flex items-center justify-center shadow-xl"
            style={{ boxShadow: '0 0 50px hsl(175 85% 42% / 0.3)' }}>
            <Shield className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight">
            <span className="text-foreground">JanSetu</span>{' '}
            <span className="gradient-text">AI</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            AI-Powered Smart City Governance Platform
          </p>
          <div className="flex items-center justify-center gap-8 mt-8 text-sm text-muted-foreground">
            {[
              { icon: Cpu, label: 'AI Detection' },
              { icon: Globe, label: 'GIS Mapping' },
              { icon: Eye, label: 'Digital Twin' },
              { icon: Building2, label: 'Smart Gov' },
            ].map((f, i) => (
              <motion.span key={f.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-2">
                <f.icon className="w-4 h-4 text-primary" /> {f.label}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {roles.map((role, i) => (
            <motion.button key={role.id}
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.15 }}
              whileHover={{ y: -4, scale: 1.01 }}
              onClick={() => navigate(role.path)}
              className="glass-card p-7 text-left hover:border-primary/30 transition-all group relative">
              <div className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-bl-full"
                style={{ background: `linear-gradient(135deg, transparent, hsl(175 85% 42% / 0.05))` }} />
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-5 group-hover:shadow-lg transition-all duration-300`}
                style={{ boxShadow: '0 4px 20px hsl(220 20% 3% / 0.3)' }}>
                <role.icon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold mb-2">{role.title}</h2>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{role.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {role.features.map(f => (
                  <span key={f} className="text-[10px] px-2.5 py-1 rounded-full bg-muted/80 text-muted-foreground font-medium">{f}</span>
                ))}
              </div>
              <div className="flex items-center gap-2 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Enter <ArrowRight className="w-4 h-4" />
              </div>
            </motion.button>
          ))}
        </div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="glass-card p-6 glow-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: 'Complaints', value: '500+', sub: 'demo dataset', color: 'text-primary' },
              { label: 'Departments', value: '5', sub: 'tracked', color: 'text-accent' },
              { label: 'Workers', value: '10', sub: 'field agents', color: 'text-warning' },
              { label: 'AI Models', value: '5', sub: 'active', color: 'text-success' },
            ].map(s => (
              <div key={s.label}>
                <div className={`text-3xl md:text-4xl font-mono font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                <div className="text-[10px] text-muted-foreground/50">{s.sub}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {!user && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="mt-8 text-center">
            <Button onClick={() => navigate('/login')} size="lg" className="gap-2 bg-primary text-primary-foreground px-10 font-semibold text-base"
              style={{ boxShadow: '0 0 30px hsl(175 85% 42% / 0.3)' }}>
              <LogIn className="w-5 h-5" /> Get Started
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

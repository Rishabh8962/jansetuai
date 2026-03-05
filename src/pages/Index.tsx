import { motion } from 'framer-motion';
import { MapPin, Shield, Users, Wrench, BarChart3, Building2, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const roles = [
  {
    id: 'citizen',
    title: 'Citizen Portal',
    description: 'Report civic issues, track complaints, and provide feedback',
    icon: Users,
    path: '/citizen',
    gradient: 'from-[hsl(175,80%,50%)] to-[hsl(190,90%,45%)]',
    features: ['Report Issues', 'Track Status', 'Voice Complaints', 'GPS Location'],
  },
  {
    id: 'worker',
    title: 'Field Worker',
    description: 'Manage assigned tasks, navigate to issues, and submit completion reports',
    icon: Wrench,
    path: '/worker',
    gradient: 'from-[hsl(38,92%,55%)] to-[hsl(25,95%,50%)]',
    features: ['Task Queue', 'Navigation', 'Photo Upload', 'Status Updates'],
  },
  {
    id: 'dashboard',
    title: 'Command Center',
    description: 'Analytics dashboard with maps, charts, and department management',
    icon: BarChart3,
    path: '/dashboard',
    gradient: 'from-[hsl(260,70%,60%)] to-[hsl(280,80%,55%)]',
    features: ['Live Analytics', 'City Map', 'AI Predictions', 'Trust Scores'],
  },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background cyber-grid relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'var(--gradient-glow)' }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center glow-border">
              <Shield className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
            <span className="text-primary">PS</span>-CRM
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            AI-Powered Smart City Governance Platform
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-primary" /> AI Detection</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-primary" /> GIS Mapping</span>
            <span className="flex items-center gap-1.5"><Building2 className="w-3 h-3 text-primary" /> Digital Twin</span>
          </div>
        </motion.div>

        {/* Role Selection */}
        <div className="grid md:grid-cols-3 gap-4">
          {roles.map((role, i) => (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              onClick={() => navigate(role.path)}
              className="glass-card p-6 text-left hover:border-primary/40 transition-all group relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'var(--gradient-glow)' }} />
              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.gradient} flex items-center justify-center mb-4
                  group-hover:scale-110 transition-transform`}>
                  <role.icon className="w-6 h-6 text-background" />
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

        {/* Stats Strip */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="mt-12 glass-card p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { label: 'Complaints', value: '500+', sub: 'demo dataset' },
              { label: 'Departments', value: '5', sub: 'tracked' },
              { label: 'Workers', value: '10', sub: 'field agents' },
              { label: 'AI Models', value: '4', sub: 'active' },
            ].map(s => (
              <div key={s.label}>
                <div className="text-2xl font-mono font-bold text-primary">{s.value}</div>
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

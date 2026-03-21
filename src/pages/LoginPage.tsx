import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, Shield, Wrench, Users, ChevronRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { login, signup, getDemoCredentials, type UserRole, ROLE_LABELS, ROLE_PATHS } from '@/data/authStore';
import { useNavigate } from 'react-router-dom';
import jansetuLogo from '@/assets/jansetu-logo.png';

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('citizen');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const demoAccounts = getDemoCredentials();

  const handleLogin = () => {
    setError('');
    setLoading(true);
    setTimeout(() => {
      const result = login(email, password);
      if (result.success && result.user) {
        navigate(ROLE_PATHS[result.user.role]);
      } else {
        setError(result.error || 'Login failed');
      }
      setLoading(false);
    }, 600);
  };

  const handleSignup = () => {
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      const result = signup(name, email, phone, role, password);
      if (result.success && result.user) {
        navigate(ROLE_PATHS[result.user.role]);
      } else {
        setError(result.error || 'Signup failed');
      }
      setLoading(false);
    }, 600);
  };

  const handleDemoLogin = (demoEmail: string) => {
    setLoading(true);
    setTimeout(() => {
      const result = login(demoEmail, 'demo123');
      if (result.success && result.user) {
        navigate(ROLE_PATHS[result.user.role]);
      }
      setLoading(false);
    }, 400);
  };

  const roleOptions: { id: UserRole; label: string; icon: typeof Users; color: string }[] = [
    { id: 'citizen', label: 'Citizen', icon: Users, color: 'from-emerald-500 to-teal-600' },
    { id: 'worker', label: 'Field Worker', icon: Wrench, color: 'from-amber-500 to-orange-600' },
    { id: 'government_official', label: 'Govt Official', icon: Shield, color: 'from-indigo-500 to-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 cyber-grid" />
        <div className="absolute inset-0" style={{ background: 'var(--gradient-glow)' }} />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-1/2 -right-1/2 w-full h-full rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.img
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            src={jansetuLogo}
            alt="JanSetu AI"
            className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-lg"
            style={{ boxShadow: 'var(--shadow-glow)' }}
          />
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-foreground">JanSetu</span>{' '}
            <span className="text-primary">AI</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Smart City Governance Platform</p>
        </div>

        {/* Main Card */}
        <div className="glass-card p-6 space-y-5">
          {/* Tab Toggle */}
          <div className="flex rounded-lg bg-muted/50 p-1">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all
                ${mode === 'login' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LogIn className="w-4 h-4" /> Login
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all
                ${mode === 'signup' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <UserPlus className="w-4 h-4" /> Sign Up
            </button>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
                  <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email"
                    className="bg-muted/30 border-border/50" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password</label>
                  <div className="relative">
                    <Input value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password"
                      type={showPassword ? 'text' : 'password'} className="bg-muted/30 border-border/50 pr-10"
                      onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button onClick={handleLogin} disabled={loading} className="w-full gap-2 bg-primary text-primary-foreground font-semibold">
                  {loading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" /> : <LogIn className="w-4 h-4" />}
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </motion.div>
            ) : (
              <motion.div key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                {/* Role Selection */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Select Your Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    {roleOptions.map(r => (
                      <button key={r.id} onClick={() => setRole(r.id)}
                        className={`p-3 rounded-lg text-center transition-all border
                          ${role === r.id ? 'border-primary bg-primary/10 shadow-md' : 'border-border/50 bg-muted/20 hover:border-border'}`}>
                        <div className={`w-8 h-8 mx-auto mb-1.5 rounded-lg bg-gradient-to-br ${r.color} flex items-center justify-center`}>
                          <r.icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-[10px] font-medium leading-tight">{r.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Full Name</label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" className="bg-muted/30 border-border/50" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
                  <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" className="bg-muted/30 border-border/50" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone (optional)</label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 XXXXXXXXXX" className="bg-muted/30 border-border/50" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password</label>
                  <Input value={password} onChange={e => setPassword(e.target.value)} placeholder="Create password"
                    type="password" className="bg-muted/30 border-border/50" />
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button onClick={handleSignup} disabled={loading} className="w-full gap-2 bg-primary text-primary-foreground font-semibold">
                  {loading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" /> : <UserPlus className="w-4 h-4" />}
                  {loading ? 'Creating account...' : `Sign Up as ${ROLE_LABELS[role]}`}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Demo Accounts */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-4 glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Demo Access</span>
          </div>
          <div className="space-y-2">
            {demoAccounts.map(d => (
              <button key={d.email} onClick={() => handleDemoLogin(d.email)}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-left group">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold
                  ${d.role === 'Citizen' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 
                    d.role === 'Worker' ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 
                    'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
                  {d.role[0]}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{d.role}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{d.email}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

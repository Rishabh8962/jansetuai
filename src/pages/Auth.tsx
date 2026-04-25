import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import { Loader2, ShieldCheck, User, HardHat, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth, type AppRole } from '@/auth/AuthContext';
import { toast } from 'sonner';
import jansetuLogo from '@/assets/jansetu-logo.png';

const ROLE_OPTIONS: { value: AppRole; label: string; icon: any; description: string }[] = [
  { value: 'citizen', label: 'Citizen', icon: User, description: 'Report and track civic issues' },
  { value: 'worker', label: 'Field Worker', icon: HardHat, description: 'Resolve assigned tasks' },
  { value: 'authority', label: 'Authority', icon: ShieldCheck, description: 'Monitor & approve repairs' },
];

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, user, primaryRole, loading } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<AppRole>('citizen');
  const [busy, setBusy] = useState(false);

  // If already signed in, route by role.
  if (!loading && user && primaryRole) {
    const target = primaryRole === 'authority' ? '/dashboard' : primaryRole === 'worker' ? '/worker' : '/citizen';
    return <Navigate to={target} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email.trim(), password);
        if (error) toast.error(error);
        else toast.success('Welcome back!');
      } else {
        if (!displayName.trim()) { toast.error('Please enter your name'); return; }
        const { error } = await signUp(email.trim(), password, displayName.trim(), role);
        if (error) toast.error(error);
        else toast.success('Account created — signing you in…');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background cyber-grid flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <button
          onClick={() => navigate('/')}
          className="text-xs text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1"
        >
          ← Back to home
        </button>

        <div className="glass-card rounded-3xl p-8 border border-border/40 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <img src={jansetuLogo} alt="JanSetu AI" className="w-10 h-10 rounded-lg" />
            <div>
              <h1 className="text-xl font-bold">
                <span className="text-foreground">JanSetu</span> <span className="text-primary">AI</span>
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Smart civic governance
              </p>
            </div>
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as 'signin' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4">
              <TabsContent value="signup" className="space-y-4 mt-0">
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Aanya Sharma"
                    required={mode === 'signup'}
                  />
                </div>

                <div>
                  <Label>I am a</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1.5">
                    {ROLE_OPTIONS.map((r) => (
                      <button
                        type="button"
                        key={r.value}
                        onClick={() => setRole(r.value)}
                        className={`p-3 rounded-xl border text-center transition ${
                          role === r.value
                            ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                            : 'border-border hover:border-primary/40 bg-background/50'
                        }`}
                      >
                        <r.icon className={`w-5 h-5 mx-auto mb-1 ${role === r.value ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div className="text-xs font-medium">{r.label}</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    {ROLE_OPTIONS.find(r => r.value === role)?.description}
                  </p>
                </div>
              </TabsContent>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  minLength={6}
                  required
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
              </div>

              <Button type="submit" disabled={busy} className="w-full bg-gradient-to-r from-indigo-600 to-teal-500 hover:opacity-90">
                {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {mode === 'signin' ? 'Sign in' : 'Create account'}
              </Button>
            </form>
          </Tabs>

          <p className="text-[11px] text-muted-foreground text-center mt-6">
            By continuing you agree to use JanSetu AI for civic reporting purposes.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

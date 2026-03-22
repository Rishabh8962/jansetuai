import { motion } from 'framer-motion';
import { ArrowLeft, LogOut, Mail, Phone, Calendar, Star, ClipboardCheck, AlertTriangle, CheckCircle2, Wrench, Shield, Award, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout, ROLE_LABELS, ROLE_PATHS } from '@/data/authStore';
import { useAuth } from '@/hooks/useAuth';

export default function ProfilePage() {
  const user = useAuth() ?? getCurrentUser();
  const navigate = useNavigate();

  if (!user) { navigate('/login'); return null; }

  const handleLogout = () => { logout(); navigate('/login'); };

  const roleColor = user.role === 'citizen' ? 'from-[hsl(175,85%,42%)] to-[hsl(195,85%,45%)]'
    : user.role === 'worker' ? 'from-[hsl(38,95%,55%)] to-[hsl(25,90%,52%)]'
    : 'from-[hsl(260,75%,60%)] to-[hsl(280,80%,55%)]';

  const RoleIcon = user.role === 'citizen' ? AlertTriangle : user.role === 'worker' ? Wrench : Shield;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 glass-card border-b border-border/30 rounded-none">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <button onClick={() => navigate(ROLE_PATHS[user.role])} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-sm font-bold">My Profile</h1>
          <button onClick={handleLogout} className="text-destructive hover:text-destructive/80"><LogOut className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 text-center">
          <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${roleColor} flex items-center justify-center text-2xl font-bold text-white mb-4 shadow-xl`}>
            {user.avatar}
          </div>
          <h2 className="text-xl font-bold">{user.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <RoleIcon className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-semibold">{ROLE_LABELS[user.role]}</span>
          </div>
          {user.department && <div className="text-xs text-muted-foreground mt-1">{user.department}</div>}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 space-y-3">
          <div className="section-title mb-3">Contact</div>
          {[
            { icon: Mail, label: 'Email', value: user.email },
            { icon: Phone, label: 'Phone', value: user.phone || 'Not provided' },
            { icon: Calendar, label: 'Joined', value: new Date(user.joinedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-3">
              <f.icon className="w-4 h-4 text-primary" />
              <div><div className="text-xs text-muted-foreground">{f.label}</div><div className="text-sm font-medium">{f.value}</div></div>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <div className="section-title mb-4">Performance</div>
          {user.role === 'citizen' && (
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={AlertTriangle} label="Filed" value={user.complaintsSubmitted ?? 0} color="text-warning" />
              <StatCard icon={CheckCircle2} label="Resolved" value={user.complaintsResolved ?? 0} color="text-success" />
              <div className="col-span-2">
                <StatCard icon={TrendingUp} label="Resolution Rate"
                  value={`${user.complaintsSubmitted ? ((user.complaintsResolved ?? 0) / user.complaintsSubmitted * 100).toFixed(0) : 0}%`} color="text-primary" />
              </div>
            </div>
          )}
          {user.role === 'worker' && (
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={ClipboardCheck} label="Completed" value={user.tasksCompleted ?? 0} color="text-primary" />
              <StatCard icon={AlertTriangle} label="Active" value={user.tasksAssigned ?? 0} color="text-warning" />
              <StatCard icon={Star} label="Rating" value={user.avgRating ?? 0} color="text-warning" />
              <StatCard icon={Award} label="Badge" value={
                (user.tasksCompleted ?? 0) > 100 ? 'Gold' : (user.tasksCompleted ?? 0) > 50 ? 'Silver' : 'Bronze'
              } color="text-accent" />
            </div>
          )}
          {user.role === 'government_official' && (
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={CheckCircle2} label="Approved" value={user.reviewsApproved ?? 0} color="text-success" />
              <StatCard icon={AlertTriangle} label="Rejected" value={user.reviewsRejected ?? 0} color="text-destructive" />
              <div className="col-span-2">
                <StatCard icon={TrendingUp} label="Total Reviews" value={(user.reviewsApproved ?? 0) + (user.reviewsRejected ?? 0)} color="text-primary" />
              </div>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-2">
          <Button onClick={() => navigate(ROLE_PATHS[user.role])} className="w-full bg-primary text-primary-foreground h-11 font-semibold">Go to Dashboard</Button>
          <Button onClick={handleLogout} variant="outline" className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 h-11">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Star; label: string; value: string | number; color: string }) {
  return (
    <div className="glass-card-light p-4 text-center">
      <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
      <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

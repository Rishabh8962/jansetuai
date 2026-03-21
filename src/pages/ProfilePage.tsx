import { motion } from 'framer-motion';
import { ArrowLeft, LogOut, User, Mail, Phone, Calendar, Star, ClipboardCheck, AlertTriangle, CheckCircle2, Wrench, Shield, Award, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout, ROLE_LABELS, ROLE_PATHS } from '@/data/authStore';
import { useAuth } from '@/hooks/useAuth';
import jansetuLogo from '@/assets/jansetu-logo.png';

export default function ProfilePage() {
  const user = useAuth() ?? getCurrentUser();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColor = user.role === 'citizen' ? 'from-emerald-500 to-teal-600' :
    user.role === 'worker' ? 'from-amber-500 to-orange-600' : 'from-indigo-500 to-purple-600';

  const roleIcon = user.role === 'citizen' ? User : user.role === 'worker' ? Wrench : Shield;
  const RoleIcon = roleIcon;

  return (
    <div className="min-h-screen bg-background cyber-grid">
      <div className="sticky top-0 z-50 glass-card border-b border-border/50 rounded-none">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(ROLE_PATHS[user.role])} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src={jansetuLogo} alt="JanSetu AI" className="w-6 h-6 rounded" />
            <h1 className="text-sm font-semibold">My Profile</h1>
          </div>
          <button onClick={handleLogout} className="text-destructive hover:text-destructive/80">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 text-center">
          <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${roleColor} flex items-center justify-center text-2xl font-bold text-white mb-4 shadow-lg`}>
            {user.avatar}
          </div>
          <h2 className="text-xl font-bold">{user.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <RoleIcon className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">{ROLE_LABELS[user.role]}</span>
          </div>
          {user.department && (
            <div className="text-xs text-muted-foreground mt-1">{user.department}</div>
          )}
        </motion.div>

        {/* Contact Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4 space-y-3">
          <div className="section-title mb-3">Contact Information</div>
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">Email</div>
              <div className="text-sm font-medium">{user.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">Phone</div>
              <div className="text-sm font-medium">{user.phone || 'Not provided'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">Member Since</div>
              <div className="text-sm font-medium">{new Date(user.joinedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
          </div>
        </motion.div>

        {/* Role-specific Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-4">
          <div className="section-title mb-4">Performance Dashboard</div>

          {user.role === 'citizen' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-warning" />
                <div className="text-2xl font-bold font-mono text-warning">{user.complaintsSubmitted ?? 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Complaints Filed</div>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-success" />
                <div className="text-2xl font-bold font-mono text-success">{user.complaintsResolved ?? 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Resolved</div>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 text-center col-span-2">
                <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold font-mono text-primary">
                  {user.complaintsSubmitted ? ((user.complaintsResolved ?? 0) / user.complaintsSubmitted * 100).toFixed(0) : 0}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">Resolution Rate</div>
              </div>
            </div>
          )}

          {user.role === 'worker' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <ClipboardCheck className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold font-mono text-primary">{user.tasksCompleted ?? 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Tasks Completed</div>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-warning" />
                <div className="text-2xl font-bold font-mono text-warning">{user.tasksAssigned ?? 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Active Tasks</div>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <Star className="w-6 h-6 mx-auto mb-2 text-amber-400" />
                <div className="text-2xl font-bold font-mono text-amber-400">{user.avgRating ?? 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Avg Rating</div>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <Award className="w-6 h-6 mx-auto mb-2 text-accent" />
                <div className="text-2xl font-bold font-mono text-accent">
                  {user.tasksCompleted && user.tasksCompleted > 100 ? 'Gold' : user.tasksCompleted && user.tasksCompleted > 50 ? 'Silver' : 'Bronze'}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Badge</div>
              </div>
            </div>
          )}

          {user.role === 'government_official' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-success" />
                <div className="text-2xl font-bold font-mono text-success">{user.reviewsApproved ?? 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Approved</div>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-destructive" />
                <div className="text-2xl font-bold font-mono text-destructive">{user.reviewsRejected ?? 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Rejected / Rework</div>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 text-center col-span-2">
                <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold font-mono text-primary">
                  {((user.reviewsApproved ?? 0) + (user.reviewsRejected ?? 0)) || 0}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Total Reviews</div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-2">
          <Button onClick={() => navigate(ROLE_PATHS[user.role])} className="w-full bg-primary text-primary-foreground">
            Go to Dashboard
          </Button>
          <Button onClick={handleLogout} variant="outline" className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

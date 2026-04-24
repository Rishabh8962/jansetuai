import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, MapPin, Users, AlertTriangle, CheckCircle2, Clock, TrendingUp, Shield, ArrowLeft, Activity, Building2, Zap, ClipboardCheck, ThumbsUp, ThumbsDown, MessageSquare, Send, ShieldCheck, Eye, RotateCcw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { CATEGORY_LABELS, getCategoryIcon, type Complaint } from '@/data/mockData';
import { getComplaints, getDepartments, getWorkers, getReviewQueue, approveReview, rejectReview, getAllReviews, askAICopilot } from '@/data/store';
import { useNavigate } from 'react-router-dom';
import { useStoreRefresh } from '@/hooks/useStore';
import CityMap from '@/components/CityMap';
import BeforeAfterSlider from '@/components/BeforeAfterSlider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import jansetuLogo from '@/assets/jansetu-logo.png';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { RealtimeNotificationBridge } from '@/components/RealtimeNotificationBridge';

type Tab = 'overview' | 'analytics' | 'map' | 'departments' | 'review' | 'copilot';

export default function GovernmentDashboard() {
  useStoreRefresh();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const complaints = getComplaints();
  const departments = getDepartments();
  const workers = getWorkers();
  const reviewQueue = getReviewQueue();

  const stats = useMemo(() => {
    const total = complaints.length;
    const resolved = complaints.filter(c => c.status === 'completed').length;
    const pending = complaints.filter(c => !['completed'].includes(c.status)).length;
    const underReview = complaints.filter(c => c.status === 'under_review').length;
    const avgResTime = complaints
      .filter(c => c.resolutionTime)
      .reduce((a, c) => a + (c.resolutionTime || 0), 0) / (resolved || 1);
    return { total, resolved, pending, underReview, avgResTime: avgResTime.toFixed(1) };
  }, [complaints]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    complaints.forEach(c => {
      const label = CATEGORY_LABELS[c.category];
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name: name.split(' ')[0], value, fullName: name }));
  }, [complaints]);

  const trendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      complaints: Math.floor(Math.random() * 80 + 40),
      resolved: Math.floor(Math.random() * 60 + 20),
    }));
  }, []);

  const wardData = useMemo(() => {
    const counts: Record<string, number> = {};
    complaints.forEach(c => { counts[c.ward] = (counts[c.ward] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [complaints]);

  const sentimentData = useMemo(() => {
    const rated = complaints.filter(c => c.sentiment);
    return [
      { name: 'Positive', value: rated.filter(c => c.sentiment === 'positive').length, color: 'hsl(150, 70%, 45%)' },
      { name: 'Neutral', value: rated.filter(c => c.sentiment === 'neutral').length, color: 'hsl(215, 15%, 55%)' },
      { name: 'Negative', value: rated.filter(c => c.sentiment === 'negative').length, color: 'hsl(0, 72%, 55%)' },
    ];
  }, [complaints]);

  const tabs: { id: Tab; label: string; icon: typeof BarChart3; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'review', label: 'Review', icon: ClipboardCheck, badge: reviewQueue.length },
    { id: 'copilot', label: 'AI Copilot', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'map', label: 'City Map', icon: MapPin },
    { id: 'departments', label: 'Depts', icon: Building2 },
  ];

  const CHART_COLORS = ['hsl(175, 80%, 50%)', 'hsl(260, 70%, 60%)', 'hsl(150, 70%, 45%)', 'hsl(38, 92%, 55%)', 'hsl(0, 72%, 55%)', 'hsl(200, 80%, 55%)', 'hsl(30, 80%, 50%)'];

  return (
    <div className="min-h-screen bg-background cyber-grid">
      <RealtimeNotificationBridge audience="admin" />
      <div className="sticky top-0 z-50 glass-card border-b border-border/50 rounded-none">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img src={jansetuLogo} alt="JanSetu AI" className="w-7 h-7 rounded" />
          <div className="flex-1">
            <h1 className="text-sm font-semibold tracking-wide">
              <span className="text-foreground">JanSetu</span> <span className="text-primary">AI</span> <span className="text-muted-foreground">Command Center</span>
            </h1>
            <div className="text-xs text-muted-foreground">Smart City Governance Platform</div>
          </div>
          <div className="flex items-center gap-2">
            {reviewQueue.length > 0 && (
              <button onClick={() => setTab('review')} className="relative">
                <ClipboardCheck className="w-5 h-5 text-warning" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-warning text-[10px] font-bold text-warning-foreground flex items-center justify-center">
                  {reviewQueue.length}
                </span>
              </button>
            )}
            <LanguageSwitcher compact />
            <div className="status-dot-active" />
            <span className="text-xs text-muted-foreground">LIVE</span>
          </div>
        </div>
        <div className="flex px-4 gap-1 pb-2 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap relative
                ${tab === t.id ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
              {t.badge && t.badge > 0 && (
                <span className="w-4 h-4 rounded-full bg-warning text-[10px] font-bold text-warning-foreground flex items-center justify-center">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-w-7xl mx-auto">
        {tab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {reviewQueue.length > 0 && (
              <motion.button initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => setTab('review')}
                className="w-full glass-card p-3 border-warning/40 flex items-center gap-3 hover:border-warning/60 transition-colors">
                <ClipboardCheck className="w-5 h-5 text-warning" />
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold text-warning">{reviewQueue.length} awaiting review</div>
                  <div className="text-xs text-muted-foreground">AI-verified repairs need admin approval</div>
                </div>
              </motion.button>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Complaints', value: stats.total, icon: AlertTriangle, color: 'text-primary' },
                { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'text-success' },
                { label: 'Under Review', value: stats.underReview, icon: Eye, color: 'text-accent' },
                { label: 'Avg Resolution', value: `${stats.avgResTime}h`, icon: TrendingUp, color: 'text-warning' },
              ].map((m, i) => (
                <motion.div key={m.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="glass-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <m.icon className={`w-5 h-5 ${m.color}`} />
                    <div className="section-title">{m.label}</div>
                  </div>
                  <div className="metric-value">{m.value}</div>
                </motion.div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="glass-card p-4">
                <div className="section-title mb-4">Complaint Trends</div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorComplaints" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(175, 80%, 50%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(175, 80%, 50%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                    <XAxis dataKey="month" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} axisLine={false} />
                    <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} axisLine={false} />
                    <Tooltip contentStyle={{ background: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 15%, 18%)', borderRadius: 8, color: 'hsl(200, 20%, 92%)' }} />
                    <Area type="monotone" dataKey="complaints" stroke="hsl(175, 80%, 50%)" fill="url(#colorComplaints)" strokeWidth={2} />
                    <Area type="monotone" dataKey="resolved" stroke="hsl(150, 70%, 45%)" fill="hsl(150, 70%, 45%)" fillOpacity={0.1} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card p-4">
                <div className="section-title mb-4">Issue Distribution</div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 15%, 18%)', borderRadius: 8, color: 'hsl(200, 20%, 92%)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {categoryData.map((c, i) => (
                    <div key={c.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                      <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i] }} />
                      {c.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="glass-card p-4">
                <div className="section-title mb-4">Citizen Sentiment</div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                      {sentimentData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 15%, 18%)', borderRadius: 8, color: 'hsl(200, 20%, 92%)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-4 justify-center mt-2">
                  {sentimentData.map(s => (
                    <div key={s.name} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      <span className="text-muted-foreground">{s.name}</span>
                      <span className="font-mono font-medium">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-4">
                <div className="section-title mb-4">Ward-Level Complaints</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={wardData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} axisLine={false} />
                    <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} axisLine={false} />
                    <Tooltip contentStyle={{ background: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 15%, 18%)', borderRadius: 8, color: 'hsl(200, 20%, 92%)' }} />
                    <Bar dataKey="value" fill="hsl(175, 80%, 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-4">
              <div className="section-title mb-3">Recent Complaints</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-xs text-muted-foreground font-medium">ID</th>
                      <th className="text-left py-2 text-xs text-muted-foreground font-medium">Category</th>
                      <th className="text-left py-2 text-xs text-muted-foreground font-medium hidden md:table-cell">Ward</th>
                      <th className="text-left py-2 text-xs text-muted-foreground font-medium">Status</th>
                      <th className="text-left py-2 text-xs text-muted-foreground font-medium hidden md:table-cell">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.slice(0, 10).map(c => (
                      <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 font-mono text-xs">{c.id}</td>
                        <td className="py-2">{getCategoryIcon(c.category)} {CATEGORY_LABELS[c.category]}</td>
                        <td className="py-2 text-muted-foreground hidden md:table-cell">{c.ward}</td>
                        <td className="py-2">
                          <span className={`text-xs font-medium ${
                            c.status === 'completed' ? 'text-success' :
                            c.status === 'under_review' ? 'text-accent' :
                            c.status === 'rework_required' ? 'text-destructive' :
                            c.status === 'in_progress' ? 'text-primary' :
                            c.status === 'assigned' ? 'text-warning' : 'text-muted-foreground'
                          }`}>
                            {c.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-2 hidden md:table-cell">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getPriorityColor(c.priority)}`}>{c.priority}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'review' && <ReviewTab />}

        {tab === 'copilot' && <CopilotTab />}

        {tab === 'analytics' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="glass-card p-4">
              <div className="section-title mb-4">Average Resolution Time by Category (hours)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData.map(c => ({ ...c, avgTime: Math.floor(Math.random() * 60 + 10) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} axisLine={false} />
                  <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 15%, 18%)', borderRadius: 8, color: 'hsl(200, 20%, 92%)' }} />
                  <Bar dataKey="avgTime" fill="hsl(260, 70%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card p-4">
              <div className="section-title mb-4">Monthly Resolution Rate</div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData.map(t => ({ ...t, rate: Math.floor((t.resolved / t.complaints) * 100) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} axisLine={false} />
                  <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} axisLine={false} unit="%" />
                  <Tooltip contentStyle={{ background: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 15%, 18%)', borderRadius: 8, color: 'hsl(200, 20%, 92%)' }} />
                  <Line type="monotone" dataKey="rate" stroke="hsl(150, 70%, 45%)" strokeWidth={2} dot={{ fill: 'hsl(150, 70%, 45%)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card p-4 glow-border">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-primary" />
                <div className="section-title">AI Predicted Hotspots</div>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                {[
                  { area: 'MG Road – Ward 3', issue: 'Potholes', risk: 87, trend: 'Rising' },
                  { area: 'Jayanagar – Ward 5', issue: 'Garbage', risk: 74, trend: 'Stable' },
                  { area: 'Whitefield – Ward 7', issue: 'Water Leaks', risk: 69, trend: 'Rising' },
                ].map(h => (
                  <div key={h.area} className="bg-muted/30 rounded-lg p-3">
                    <div className="text-sm font-medium">{h.area}</div>
                    <div className="text-xs text-muted-foreground">{h.issue}</div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-lg font-mono font-bold text-destructive">{h.risk}%</div>
                      <span className={`text-xs ${h.trend === 'Rising' ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {h.trend === 'Rising' ? '↑' : '→'} {h.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-4">
              <div className="section-title mb-3">Worker Productivity</div>
              <div className="space-y-2">
                {workers.slice(0, 6).map(w => (
                  <div key={w.id} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      {w.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{w.name}</div>
                      <div className="text-xs text-muted-foreground">{w.department}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono font-bold">{w.completedTasks}</div>
                      <div className="text-xs text-muted-foreground">tasks</div>
                    </div>
                    <div className="w-16">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(w.completedTasks / 150) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'map' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <CityMap complaints={complaints} />
          </motion.div>
        )}

        {tab === 'departments' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {departments.map(dept => (
                <div key={dept.id} className="glass-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{dept.name}</div>
                      <div className="text-xs text-muted-foreground">Head: {dept.head}</div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Shield className="w-4 h-4 text-primary" />
                        <span className="font-mono font-bold text-lg">{dept.trustScore}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">Trust Score</div>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${dept.trustScore}%`,
                      background: dept.trustScore > 75 ? 'hsl(150, 70%, 45%)' : dept.trustScore > 50 ? 'hsl(38, 92%, 55%)' : 'hsl(0, 72%, 55%)'
                    }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-sm font-mono font-bold">{dept.totalComplaints}</div>
                      <div className="text-[10px] text-muted-foreground">Total</div>
                    </div>
                    <div>
                      <div className="text-sm font-mono font-bold text-success">{dept.resolved}</div>
                      <div className="text-[10px] text-muted-foreground">Resolved</div>
                    </div>
                    <div>
                      <div className="text-sm font-mono font-bold text-warning">{dept.pending}</div>
                      <div className="text-[10px] text-muted-foreground">Pending</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/30">
                    <span>Avg Resolution: <span className="font-mono text-foreground">{dept.avgResolutionTime}h</span></span>
                    <span className={dept.trustScore > 75 ? 'text-success' : 'text-warning'}>
                      {dept.trustScore > 75 ? '● Excellent' : dept.trustScore > 50 ? '● Fair' : '● Needs Improvement'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function getPriorityColor(priority: string) {
  const colors: Record<string, string> = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-primary/20 text-primary',
    high: 'bg-warning/20 text-warning',
    critical: 'bg-destructive/20 text-destructive',
  };
  return colors[priority] || '';
}

// AI Governance Copilot
function CopilotTab() {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: '🤖 Welcome to the **JanSetu AI Governance Copilot**. I can help you analyze complaints, department performance, worker productivity, and predict future hotspots.\n\nTry asking:\n• "Which ward has the most complaints?"\n• "Which department is slowest?"\n• "Show me today\'s summary"\n• "Predict future hotspots"' },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    // Simulate response delay
    setTimeout(() => {
      const response = askAICopilot(userMsg);
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
    }, 500);
  };

  const quickQuestions = [
    'Which ward has the most complaints?',
    'Which department is slowest?',
    'Show pending complaints summary',
    'Who is the best worker?',
    'Predict future hotspots',
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold">AI Governance Copilot</h2>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {quickQuestions.map(q => (
          <button key={q} onClick={() => { setInput(q); }}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-muted text-muted-foreground hover:bg-primary/15 hover:text-primary transition-colors">
            {q}
          </button>
        ))}
      </div>

      <div className="glass-card p-4 min-h-[400px] max-h-[500px] overflow-y-auto space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm
              ${msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 text-foreground'}`}>
              <div className="whitespace-pre-wrap">{msg.text.replace(/\*\*(.*?)\*\*/g, '$1')}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask about complaints, departments, workers..."
          className="bg-card border-border" />
        <Button onClick={handleSend} className="bg-primary text-primary-foreground">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// Review Tab
function ReviewTab() {
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const reviewQueue = getReviewQueue();
  const complaints = getComplaints();
  const allReviews = getAllReviews();

  const handleApprove = (complaintId: string) => {
    const notes = adminNotes[complaintId] || 'Repair verified and approved. Issue resolved satisfactorily.';
    approveReview(complaintId, notes);
    setAdminNotes(prev => { const n = { ...prev }; delete n[complaintId]; return n; });
  };

  const handleReject = (complaintId: string) => {
    const notes = adminNotes[complaintId] || 'Repair not satisfactory. Please revisit the issue.';
    rejectReview(complaintId, notes);
    setAdminNotes(prev => { const n = { ...prev }; delete n[complaintId]; return n; });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <ClipboardCheck className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold">Review & Approve Repairs</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        AI has verified worker repairs. Review AI analysis, images, and approve or reject.
      </p>

      {reviewQueue.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-success opacity-50" />
          <p className="text-sm text-muted-foreground">No pending reviews. All caught up! 🎉</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviewQueue.map(item => {
            const complaint = complaints.find(c => c.id === item.complaintId);
            if (!complaint) return null;
            return (
              <div key={item.complaintId} className="glass-card p-4 space-y-3 border-warning/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getCategoryIcon(complaint.category)}</span>
                    <div>
                      <div className="font-semibold text-sm">{complaint.id} – {CATEGORY_LABELS[complaint.category]}</div>
                      <div className="text-xs text-muted-foreground">{complaint.ward} · {complaint.assignedWorker} · {complaint.department}</div>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-warning/20 text-warning font-medium">Pending Review</span>
                </div>

                <div className="text-sm text-muted-foreground">{complaint.description}</div>

                {/* AI Verification Result */}
                {item.aiVerification && (
                  <div className={`rounded-lg p-3 space-y-2 ${item.aiVerification.issueStillDetected ? 'bg-destructive/10 border border-destructive/30' : 'bg-success/10 border border-success/30'}`}>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className={`w-4 h-4 ${item.aiVerification.issueStillDetected ? 'text-destructive' : 'text-success'}`} />
                      <span className={`text-xs font-semibold ${item.aiVerification.issueStillDetected ? 'text-destructive' : 'text-success'}`}>
                        AI Verification: {item.aiVerification.issueStillDetected ? '⚠️ Issue May Persist' : '✓ Repair Looks Successful'}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground ml-auto">{(item.aiVerification.confidence * 100).toFixed(0)}% confidence</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.aiVerification.verdict}</p>
                    <p className="text-xs text-muted-foreground">{item.aiVerification.afterAnalysis}</p>
                  </div>
                )}

                <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                  <div className="text-xs font-medium text-primary">Worker's Report</div>
                  <p className="text-sm">{item.workerNotes}</p>
                  <BeforeAfterSlider
                    beforeUrl={complaint.imageUrl || '/placeholder.svg'}
                    afterUrl={item.workerRepairImageUrl || '/placeholder.svg'}
                    beforeLabel="Before · Reported"
                    afterLabel="After · Repaired"
                    height={220}
                    improvementPct={item.aiVerification && !item.aiVerification.issueStillDetected
                      ? Math.round(item.aiVerification.confidence * 100)
                      : undefined}
                  />
                  <div className="text-[10px] text-muted-foreground">Completed: {new Date(item.completedAt).toLocaleString()}</div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Admin Notes (sent to citizen)</label>
                  <Textarea
                    value={adminNotes[item.complaintId] || ''}
                    onChange={e => setAdminNotes(prev => ({ ...prev, [item.complaintId]: e.target.value }))}
                    placeholder="Repair verified. Issue resolved satisfactorily."
                    className="bg-card border-border text-sm min-h-[60px]"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => handleApprove(item.complaintId)}
                    className="flex-1 gap-2 bg-success text-success-foreground hover:bg-success/90">
                    <ThumbsUp className="w-4 h-4" /> Approve & Send Report
                  </Button>
                  <Button onClick={() => handleReject(item.complaintId)}
                    variant="outline" className="flex-1 gap-2 border-destructive/50 text-destructive hover:bg-destructive/10">
                    <ThumbsDown className="w-4 h-4" /> Reject → Rework
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {allReviews.filter(r => r.reviewed).length > 0 && (
        <div>
          <div className="section-title mb-3 mt-6">Recently Reviewed</div>
          <div className="space-y-2">
            {allReviews.filter(r => r.reviewed).slice(0, 5).map(r => {
              const c = complaints.find(x => x.id === r.complaintId);
              return (
                <div key={r.complaintId} className={`glass-card p-3 flex items-center gap-3 ${r.approved ? 'border-success/20' : 'border-destructive/20'}`}>
                  <span className={`text-lg ${r.approved ? '' : 'opacity-50'}`}>{c ? getCategoryIcon(c.category) : '📋'}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{r.complaintId}</div>
                    <div className="text-xs text-muted-foreground">{r.adminNotes}</div>
                  </div>
                  <span className={`text-xs font-medium ${r.approved ? 'text-success' : 'text-destructive'}`}>
                    {r.approved ? '✓ Approved' : '✗ Rework'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

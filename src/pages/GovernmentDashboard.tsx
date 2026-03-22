import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, MapPin, Users, AlertTriangle, CheckCircle2, TrendingUp, Shield, ArrowLeft, Activity, Building2, Zap, ClipboardCheck, ThumbsUp, ThumbsDown, MessageSquare, Send, ShieldCheck, Eye, User } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { CATEGORY_LABELS, getCategoryIcon, type Complaint } from '@/data/mockData';
import { getComplaints, getDepartments, getWorkers, getReviewQueue, approveReview, rejectReview, getAllReviews, askAICopilot } from '@/data/store';
import { useNavigate } from 'react-router-dom';
import { useStoreRefresh } from '@/hooks/useStore';
import CityMap from '@/components/CityMap';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

type Tab = 'overview' | 'analytics' | 'map' | 'departments' | 'review' | 'copilot';

const CHART_COLORS = ['hsl(175, 85%, 45%)', 'hsl(260, 75%, 60%)', 'hsl(150, 80%, 42%)', 'hsl(38, 95%, 55%)', 'hsl(0, 80%, 58%)', 'hsl(210, 85%, 55%)', 'hsl(30, 80%, 50%)'];
const tooltipStyle = { background: 'hsl(220, 18%, 8%)', border: '1px solid hsl(220, 16%, 16%)', borderRadius: 10, color: 'hsl(210, 40%, 96%)' };

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
    const pending = complaints.filter(c => c.status !== 'completed').length;
    const underReview = complaints.filter(c => c.status === 'under_review').length;
    const avgRes = complaints.filter(c => c.resolutionTime).reduce((a, c) => a + (c.resolutionTime || 0), 0) / (resolved || 1);
    const slaCompliance = resolved > 0 ? Math.floor((complaints.filter(c => c.status === 'completed' && (c.resolutionTime || 0) < 48).length / resolved) * 100) : 0;
    return { total, resolved, pending, underReview, avgResTime: avgRes.toFixed(1), slaCompliance };
  }, [complaints]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    complaints.forEach(c => { const l = CATEGORY_LABELS[c.category]; counts[l] = (counts[l] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: name.split(' ')[0], value, fullName: name }));
  }, [complaints]);

  const trendData = useMemo(() => {
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(month => ({
      month, complaints: Math.floor(Math.random() * 80 + 40), resolved: Math.floor(Math.random() * 60 + 20),
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
      { name: 'Positive', value: rated.filter(c => c.sentiment === 'positive').length, color: 'hsl(150, 80%, 42%)' },
      { name: 'Neutral', value: rated.filter(c => c.sentiment === 'neutral').length, color: 'hsl(215, 15%, 50%)' },
      { name: 'Negative', value: rated.filter(c => c.sentiment === 'negative').length, color: 'hsl(0, 80%, 58%)' },
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 glass-card border-b border-border/30 rounded-none">
        <div className="flex items-center gap-3 px-4 py-3 max-w-7xl mx-auto">
          <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></button>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(260,75%,60%)] to-[hsl(280,80%,55%)] flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-sm font-bold tracking-wide">
              <span className="text-foreground">JanSetu</span> <span className="text-primary">AI</span>
              <span className="text-muted-foreground ml-1 text-xs font-normal">Command Center</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/profile')} className="text-muted-foreground hover:text-foreground"><User className="w-5 h-5" /></button>
            {reviewQueue.length > 0 && (
              <button onClick={() => setTab('review')} className="relative">
                <ClipboardCheck className="w-5 h-5 text-warning" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-warning text-[10px] font-bold text-warning-foreground flex items-center justify-center">{reviewQueue.length}</span>
              </button>
            )}
            <div className="status-dot-active" />
            <span className="text-xs text-muted-foreground font-mono">LIVE</span>
          </div>
        </div>
        <div className="flex px-4 gap-1 pb-2 overflow-x-auto max-w-7xl mx-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 relative ${tab === t.id ? 'tab-pill-active' : 'tab-pill-inactive'}`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
              {t.badge && t.badge > 0 && (
                <span className="w-4 h-4 rounded-full bg-warning text-[10px] font-bold text-warning-foreground flex items-center justify-center">{t.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-w-7xl mx-auto">
        {tab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {reviewQueue.length > 0 && (
              <motion.button initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onClick={() => setTab('review')}
                className="w-full glass-card p-4 border-warning/30 flex items-center gap-3 hover:border-warning/50 transition-all shimmer">
                <ClipboardCheck className="w-6 h-6 text-warning" />
                <div className="flex-1 text-left">
                  <div className="text-sm font-bold text-warning">{reviewQueue.length} awaiting review</div>
                  <div className="text-xs text-muted-foreground">AI-verified repairs need approval</div>
                </div>
              </motion.button>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'Total', value: stats.total, icon: AlertTriangle, color: 'text-primary' },
                { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'text-success' },
                { label: 'Pending', value: stats.pending, icon: Users, color: 'text-warning' },
                { label: 'Under Review', value: stats.underReview, icon: Eye, color: 'text-accent' },
                { label: 'SLA Compliance', value: `${stats.slaCompliance}%`, icon: TrendingUp, color: 'text-primary' },
              ].map((m, i) => (
                <motion.div key={m.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="kpi-card">
                  <div className="flex items-center justify-between mb-3">
                    <m.icon className={`w-5 h-5 ${m.color}`} />
                    <span className="section-title text-[10px]">{m.label}</span>
                  </div>
                  <div className="metric-value">{m.value}</div>
                </motion.div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="glass-card p-5">
                <div className="section-title mb-4">Complaint Trends</div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="gPrimary" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(175, 85%, 45%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(175, 85%, 45%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 14%)" />
                    <XAxis dataKey="month" tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 11 }} axisLine={false} />
                    <YAxis tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 11 }} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="complaints" stroke="hsl(175, 85%, 45%)" fill="url(#gPrimary)" strokeWidth={2} />
                    <Area type="monotone" dataKey="resolved" stroke="hsl(150, 80%, 42%)" fill="hsl(150, 80%, 42%)" fillOpacity={0.08} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card p-5">
                <div className="section-title mb-4">Issue Distribution</div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {categoryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {categoryData.map((c, i) => (
                    <div key={c.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                      <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i] }} />{c.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="glass-card p-5">
                <div className="section-title mb-4">Citizen Sentiment</div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                      {sentimentData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-4 justify-center mt-2">
                  {sentimentData.map(s => (
                    <div key={s.name} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      <span className="text-muted-foreground">{s.name}</span>
                      <span className="font-mono font-bold">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-5">
                <div className="section-title mb-4">Ward-Level Complaints</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={wardData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 14%)" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 10 }} axisLine={false} />
                    <YAxis tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 11 }} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" fill="hsl(175, 85%, 45%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Worker Leaderboard */}
            <div className="glass-card p-5">
              <div className="section-title mb-4">Worker Leaderboard</div>
              <div className="space-y-2">
                {[...workers].sort((a, b) => b.completedTasks - a.completedTasks).slice(0, 6).map((w, i) => (
                  <div key={w.id} className="flex items-center gap-3 py-2.5 border-b border-border/20 last:border-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                      ${i === 0 ? 'bg-warning/20 text-warning' : i === 1 ? 'bg-muted-foreground/20 text-muted-foreground' : i === 2 ? 'bg-warning/10 text-warning/70' : 'bg-muted text-muted-foreground'}`}>
                      {i + 1}
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
                      {w.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{w.name}</div>
                      <div className="text-xs text-muted-foreground">{w.department}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono font-bold">{w.completedTasks}</div>
                      <div className="text-[10px] text-muted-foreground">tasks</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono font-bold text-warning">{w.rating}</div>
                      <div className="text-[10px] text-muted-foreground">rating</div>
                    </div>
                    <div className="w-20">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(w.completedTasks / 150) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent complaints table */}
            <div className="glass-card p-5">
              <div className="section-title mb-4">Recent Complaints</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30">
                      {['ID', 'Category', 'Ward', 'Status', 'Priority'].map(h => (
                        <th key={h} className={`text-left py-2 text-xs text-muted-foreground font-medium ${h === 'Ward' || h === 'Priority' ? 'hidden md:table-cell' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.slice(0, 10).map(c => (
                      <tr key={c.id} className="border-b border-border/10 hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 font-mono text-xs">{c.id}</td>
                        <td className="py-2.5">{getCategoryIcon(c.category)} {CATEGORY_LABELS[c.category]}</td>
                        <td className="py-2.5 text-muted-foreground hidden md:table-cell">{c.ward}</td>
                        <td className="py-2.5">
                          <span className={`text-xs font-semibold ${
                            c.status === 'completed' ? 'text-success' : c.status === 'under_review' ? 'text-accent' :
                            c.status === 'rework_required' ? 'text-destructive' : c.status === 'in_progress' ? 'text-primary' :
                            c.status === 'assigned' ? 'text-warning' : 'text-muted-foreground'
                          }`}>{c.status.replace(/_/g, ' ')}</span>
                        </td>
                        <td className="py-2.5 hidden md:table-cell">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getPriorityColor(c.priority)}`}>{c.priority}</span>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div className="glass-card p-5">
              <div className="section-title mb-4">Resolution Time by Category (hours)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData.map(c => ({ ...c, avgTime: Math.floor(Math.random() * 60 + 10) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 14%)" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 11 }} axisLine={false} />
                  <YAxis tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 11 }} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="avgTime" fill="hsl(260, 75%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="glass-card p-5">
              <div className="section-title mb-4">Monthly Resolution Rate</div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData.map(t => ({ ...t, rate: Math.floor((t.resolved / t.complaints) * 100) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 14%)" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 11 }} axisLine={false} />
                  <YAxis tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 11 }} axisLine={false} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="rate" stroke="hsl(150, 80%, 42%)" strokeWidth={2} dot={{ fill: 'hsl(150, 80%, 42%)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="glass-card p-5 glow-border">
              <div className="flex items-center gap-2 mb-4"><Zap className="w-4 h-4 text-primary" /><span className="section-title">AI Predicted Hotspots</span></div>
              <div className="grid md:grid-cols-3 gap-3">
                {[
                  { area: 'MG Road – Ward 3', issue: 'Potholes', risk: 87, trend: 'Rising' },
                  { area: 'Jayanagar – Ward 5', issue: 'Garbage', risk: 74, trend: 'Stable' },
                  { area: 'Whitefield – Ward 7', issue: 'Water Leaks', risk: 69, trend: 'Rising' },
                ].map(h => (
                  <div key={h.area} className="glass-card-light p-4">
                    <div className="text-sm font-semibold">{h.area}</div>
                    <div className="text-xs text-muted-foreground">{h.issue}</div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-2xl font-mono font-bold text-destructive">{h.risk}%</div>
                      <span className={`text-xs font-medium ${h.trend === 'Rising' ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {h.trend === 'Rising' ? '↑' : '→'} {h.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'map' && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><CityMap complaints={complaints} /></motion.div>}

        {tab === 'departments' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {departments.map(dept => (
                <div key={dept.id} className="glass-card p-5 space-y-3 hover-lift">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold">{dept.name}</div>
                      <div className="text-xs text-muted-foreground">Head: {dept.head}</div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1"><Shield className="w-4 h-4 text-primary" /><span className="font-mono font-bold text-xl">{dept.trustScore}</span></div>
                      <div className="text-[10px] text-muted-foreground">Trust Score</div>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${dept.trustScore}%`,
                      background: dept.trustScore > 75 ? 'hsl(150, 80%, 42%)' : dept.trustScore > 50 ? 'hsl(38, 95%, 55%)' : 'hsl(0, 80%, 58%)'
                    }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div><div className="text-sm font-mono font-bold">{dept.totalComplaints}</div><div className="text-[10px] text-muted-foreground">Total</div></div>
                    <div><div className="text-sm font-mono font-bold text-success">{dept.resolved}</div><div className="text-[10px] text-muted-foreground">Resolved</div></div>
                    <div><div className="text-sm font-mono font-bold text-warning">{dept.pending}</div><div className="text-[10px] text-muted-foreground">Pending</div></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/20">
                    <span>Avg: <span className="font-mono text-foreground">{dept.avgResolutionTime}h</span></span>
                    <span className={dept.trustScore > 75 ? 'text-success' : 'text-warning'}>
                      {dept.trustScore > 75 ? '● Excellent' : dept.trustScore > 50 ? '● Fair' : '● Needs Work'}
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

function getPriorityColor(p: string) {
  return { low: 'bg-muted text-muted-foreground', medium: 'bg-primary/20 text-primary', high: 'bg-warning/20 text-warning', critical: 'bg-destructive/20 text-destructive' }[p] || '';
}

function CopilotTab() {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: '🤖 Welcome to **JanSetu AI Copilot**. Ask me about complaints, departments, workers, or predictions.\n\nTry: "Which ward has the most complaints?" or "Predict hotspots"' },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setTimeout(() => { setMessages(prev => [...prev, { role: 'ai', text: askAICopilot(userMsg) }]); }, 400);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" /><h2 className="text-lg font-bold">AI Governance Copilot</h2></div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['Which ward has the most complaints?', 'Which department is slowest?', 'Show pending summary', 'Who is the best worker?', 'Predict hotspots'].map(q => (
          <button key={q} onClick={() => setInput(q)} className="tab-pill-inactive whitespace-nowrap">{q}</button>
        ))}
      </div>
      <div className="glass-card p-4 min-h-[400px] max-h-[500px] overflow-y-auto space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-foreground'}`}>
              <div className="whitespace-pre-wrap">{msg.text.replace(/\*\*(.*?)\*\*/g, '$1')}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask about complaints, departments..." className="bg-muted/30 border-border/50" />
        <Button onClick={handleSend} className="bg-primary text-primary-foreground"><Send className="w-4 h-4" /></Button>
      </div>
    </motion.div>
  );
}

function ReviewTab() {
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const reviewQueue = getReviewQueue();
  const complaints = getComplaints();
  const allReviews = getAllReviews();

  const handleApprove = (id: string) => { approveReview(id, adminNotes[id] || 'Repair verified and approved.'); setAdminNotes(p => { const n = { ...p }; delete n[id]; return n; }); };
  const handleReject = (id: string) => { rejectReview(id, adminNotes[id] || 'Repair not satisfactory. Please revisit.'); setAdminNotes(p => { const n = { ...p }; delete n[id]; return n; }); };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-primary" /><h2 className="text-lg font-bold">Review & Approve</h2></div>
      {reviewQueue.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-success opacity-30" />
          <p className="text-sm text-muted-foreground">No pending reviews 🎉</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviewQueue.map(item => {
            const complaint = complaints.find(c => c.id === item.complaintId);
            if (!complaint) return null;
            return (
              <div key={item.complaintId} className="glass-card p-5 space-y-4 border-warning/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getCategoryIcon(complaint.category)}</span>
                    <div>
                      <div className="font-bold text-sm">{complaint.id} – {CATEGORY_LABELS[complaint.category]}</div>
                      <div className="text-xs text-muted-foreground">{complaint.ward} · {complaint.assignedWorker}</div>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-warning/15 text-warning font-semibold">Pending</span>
                </div>
                {item.aiVerification && (
                  <div className={`rounded-xl p-4 space-y-2 ${item.aiVerification.issueStillDetected ? 'bg-destructive/8 border border-destructive/20' : 'bg-success/8 border border-success/20'}`}>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className={`w-4 h-4 ${item.aiVerification.issueStillDetected ? 'text-destructive' : 'text-success'}`} />
                      <span className={`text-xs font-bold ${item.aiVerification.issueStillDetected ? 'text-destructive' : 'text-success'}`}>
                        AI: {item.aiVerification.issueStillDetected ? '⚠️ Issue May Persist' : '✓ Repair Successful'}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground ml-auto">{(item.aiVerification.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.aiVerification.verdict}</p>
                  </div>
                )}
                <div className="glass-card-light p-3 space-y-2">
                  <div className="text-xs font-semibold text-primary">Worker's Report</div>
                  <p className="text-sm">{item.workerNotes}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-20 bg-muted/30 rounded-lg flex items-center justify-center text-muted-foreground text-xs border border-border/20">📷 Before</div>
                    <div className="h-20 bg-muted/30 rounded-lg flex items-center justify-center text-muted-foreground text-xs border border-border/20">📷 After</div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Official Notes</label>
                  <Textarea value={adminNotes[item.complaintId] || ''} onChange={e => setAdminNotes(p => ({ ...p, [item.complaintId]: e.target.value }))}
                    placeholder="Repair verified. Issue resolved." className="bg-muted/20 border-border/40 text-sm min-h-[60px]" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleApprove(item.complaintId)} className="flex-1 gap-2 bg-success text-success-foreground hover:bg-success/90 h-11 font-semibold">
                    <ThumbsUp className="w-4 h-4" /> Approve
                  </Button>
                  <Button onClick={() => handleReject(item.complaintId)} variant="outline" className="flex-1 gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 h-11 font-semibold">
                    <ThumbsDown className="w-4 h-4" /> Reject
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
                <div key={r.complaintId} className={`glass-card p-3 flex items-center gap-3 ${r.approved ? 'border-success/15' : 'border-destructive/15'}`}>
                  <span className="text-lg">{c ? getCategoryIcon(c.category) : '📋'}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{r.complaintId}</div>
                    <div className="text-xs text-muted-foreground">{r.adminNotes}</div>
                  </div>
                  <span className={`text-xs font-semibold ${r.approved ? 'text-success' : 'text-destructive'}`}>{r.approved ? '✓ Approved' : '✗ Rework'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

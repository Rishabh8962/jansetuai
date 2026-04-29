import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, CheckCircle2, Navigation, AlertTriangle, ChevronRight, Phone, Bell, ShieldCheck, RotateCcw, Sparkles, Loader2, XCircle, AlertOctagon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CATEGORY_LABELS, getCategoryIcon, getPriorityColor, type Complaint } from '@/data/mockData';
import { getComplaints, updateComplaintStatus, getNotifications, markNotificationRead } from '@/data/store';
import { useNavigate } from 'react-router-dom';
import { useStoreRefresh } from '@/hooks/useStore';
import { SmartImageUpload } from '@/components/SmartImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import jansetuLogo from '@/assets/jansetu-logo.png';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { RealtimeNotificationBridge } from '@/components/RealtimeNotificationBridge';
import { JanMitraAssistant } from '@/components/JanMitraAssistant';

type View = 'tasks' | 'detail' | 'notifications';

interface AIVerification {
  status: 'resolved' | 'partially_resolved' | 'not_fixed';
  confidence: number;
  reasoning: string;
  quality_score: number;
  recommendation: 'approve' | 'review' | 'rework';
}

export default function WorkerApp() {
  useStoreRefresh();
  const navigate = useNavigate();
  const [view, setView] = useState<View>('tasks');
  const [selectedTask, setSelectedTask] = useState<Complaint | null>(null);
  const [filter, setFilter] = useState<'all' | 'assigned' | 'in_progress' | 'rework_required' | 'under_review'>('all');
  const [afterImageUrl, setAfterImageUrl] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [aiResult, setAiResult] = useState<AIVerification | null>(null);

  const complaints = getComplaints();
  const workerNotifications = getNotifications('worker');
  const unreadCount = workerNotifications.filter(n => !n.read).length;

  const workerTasks = complaints.filter(c =>
    c.workerId === 'WRK-00001' ||
    ['assigned', 'in_progress', 'under_review', 'rework_required', 'completed'].includes(c.status)
  ).slice(0, 30);

  const filteredTasks = filter === 'all' ? workerTasks : workerTasks.filter(t => t.status === filter);

  const stats = {
    assigned: workerTasks.filter(t => t.status === 'assigned').length,
    inProgress: workerTasks.filter(t => t.status === 'in_progress').length,
    rework: workerTasks.filter(t => t.status === 'rework_required').length,
    underReview: workerTasks.filter(t => t.status === 'under_review').length,
  };

  const resetTaskState = () => {
    setAfterImageUrl(null);
    setAiResult(null);
    setVerifying(false);
  };

  const openTask = (task: Complaint) => {
    setSelectedTask(task);
    resetTaskState();
    setView('detail');
  };

  const handleStartWork = (id: string) => {
    updateComplaintStatus(id, 'in_progress');
    const updated = getComplaints().find(c => c.id === id);
    if (updated) setSelectedTask({ ...updated });
  };

  const runAIVerification = async () => {
    if (!selectedTask || !afterImageUrl) return;
    setVerifying(true);
    setAiResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('verify-repair', {
        body: {
          beforeImageUrl: selectedTask.imageUrl,
          afterImageUrl,
          category: selectedTask.category,
          description: selectedTask.description,
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      setAiResult(data as AIVerification);
      toast.success('AI verification complete');
    } catch (e) {
      console.error(e);
      toast.error('AI verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const submitForReview = () => {
    if (!selectedTask || !afterImageUrl || !aiResult) return;
    updateComplaintStatus(selectedTask.id, 'completed', afterImageUrl);
    const updated = getComplaints().find(c => c.id === selectedTask.id);
    if (updated) setSelectedTask({ ...updated });
    toast.success('Submitted for command center approval');
    resetTaskState();
  };

  const statusLabels: Record<string, string> = {
    submitted: 'New', assigned: 'Assigned', in_progress: 'In Progress',
    under_review: 'Under Review', rework_required: 'Rework', completed: 'Completed',
  };

  const aiStatusMeta = (s: AIVerification['status']) => {
    if (s === 'resolved') return { label: 'Resolved', icon: CheckCircle2, color: 'text-success', bg: 'border-success/40 bg-success/5' };
    if (s === 'partially_resolved') return { label: 'Partially Resolved', icon: AlertOctagon, color: 'text-warning', bg: 'border-warning/40 bg-warning/5' };
    return { label: 'Not Fixed', icon: XCircle, color: 'text-destructive', bg: 'border-destructive/40 bg-destructive/5' };
  };

  return (
    <div className="min-h-screen bg-background cyber-grid">
      <RealtimeNotificationBridge audience="worker" />
      <JanMitraAssistant
        role="worker"
        context={{
          view,
          stats,
          currentTask: selectedTask ? { id: selectedTask.id, category: selectedTask.category, status: selectedTask.status, priority: selectedTask.priority, ward: selectedTask.ward } : null,
          unreadNotifications: unreadCount,
        }}
        onAction={(a) => {
          if (a === 'view_tasks') setView('tasks');
          else if (a === 'upload_repair' && selectedTask) setView('detail');
        }}
      />
      <div className="sticky top-0 z-50 glass-card border-b border-border/50 rounded-none">
        <div className="flex items-center justify-between px-4 py-3">
          {view === 'detail' ? (
            <button onClick={() => { setView('tasks'); resetTaskState(); }} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <img src={jansetuLogo} alt="JanMitra AI" className="w-6 h-6 rounded" />
            <h1 className="text-sm font-semibold tracking-wide">
              <span className="text-foreground">JanMitra</span> <span className="gradient-text">AI</span> <span className="text-muted-foreground">Worker</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <button onClick={() => setView('notifications')} className="relative text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4">
        <AnimatePresence mode="wait">
          {view === 'tasks' && (
            <motion.div key="tasks" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              <div className="glass-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">RK</div>
                <div>
                  <div className="font-semibold text-sm">Ramesh K</div>
                  <div className="text-xs text-muted-foreground">Roads & Infrastructure · On Duty</div>
                </div>
              </div>

              {stats.rework > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="glass-card p-3 border-destructive/30 flex items-center gap-3">
                  <RotateCcw className="w-5 h-5 text-destructive" />
                  <span className="text-sm font-medium text-destructive">{stats.rework} task{stats.rework > 1 ? 's' : ''} need rework</span>
                </motion.div>
              )}

              {unreadCount > 0 && (
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  onClick={() => setView('notifications')}
                  className="w-full glass-card p-3 border-warning/30 flex items-center gap-3">
                  <Bell className="w-5 h-5 text-warning" />
                  <span className="text-sm font-medium">{unreadCount} new notification{unreadCount > 1 ? 's' : ''}</span>
                  <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                </motion.button>
              )}

              <div className="grid grid-cols-4 gap-2">
                <div className="glass-card p-3 text-center">
                  <div className="text-xl font-bold font-mono text-warning">{stats.assigned}</div>
                  <div className="text-[10px] text-muted-foreground">Assigned</div>
                </div>
                <div className="glass-card p-3 text-center">
                  <div className="text-xl font-bold font-mono text-primary">{stats.inProgress}</div>
                  <div className="text-[10px] text-muted-foreground">Working</div>
                </div>
                <div className="glass-card p-3 text-center">
                  <div className="text-xl font-bold font-mono text-accent">{stats.underReview}</div>
                  <div className="text-[10px] text-muted-foreground">Review</div>
                </div>
                <div className="glass-card p-3 text-center">
                  <div className="text-xl font-bold font-mono text-destructive">{stats.rework}</div>
                  <div className="text-[10px] text-muted-foreground">Rework</div>
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {(['all', 'assigned', 'in_progress', 'rework_required', 'under_review'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors
                      ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                    {f === 'all' ? 'All' : statusLabels[f]}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {filteredTasks.map(task => (
                  <button key={task.id} onClick={() => openTask(task)}
                    className={`glass-card glass-card-hover p-3 w-full text-left flex items-center gap-3
                      ${task.status === 'rework_required' ? 'border-destructive/30' : ''}`}>
                    <span className="text-xl">{getCategoryIcon(task.category)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{CATEGORY_LABELS[task.category]}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{task.description}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{task.ward} · {task.id}</div>
                    </div>
                    {task.status === 'rework_required' && <RotateCcw className="w-4 h-4 text-destructive flex-shrink-0" />}
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'detail' && selectedTask && (
            <motion.div key="detail" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{selectedTask.id}</h2>
                <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${getPriorityColor(selectedTask.priority)}`}>
                  {selectedTask.priority.toUpperCase()}
                </span>
              </div>

              {selectedTask.status === 'rework_required' && (
                <div className="glass-card p-3 border-destructive/40 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-destructive" />
                  <div>
                    <div className="text-sm font-semibold text-destructive">Rework Required</div>
                    <div className="text-xs text-muted-foreground">Command center rejected the previous repair. Please revisit and fix.</div>
                  </div>
                </div>
              )}

              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getCategoryIcon(selectedTask.category)}</span>
                  <div>
                    <div className="font-semibold">{CATEGORY_LABELS[selectedTask.category]}</div>
                    <div className="text-xs text-muted-foreground">{selectedTask.department}</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
                <div className="rounded-xl overflow-hidden aspect-video bg-muted">
                  {selectedTask.imageUrl && selectedTask.imageUrl !== '/placeholder.svg' ? (
                    <img src={selectedTask.imageUrl} alt="Original complaint" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                      📷 Original complaint image
                    </div>
                  )}
                </div>
              </div>

              <div className="glass-card p-4 space-y-2">
                <div className="section-title">Location</div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{selectedTask.ward}</span>
                  <span className="text-xs font-mono text-muted-foreground ml-auto">
                    {selectedTask.lat.toFixed(4)}°, {selectedTask.lng.toFixed(4)}°
                  </span>
                </div>
                <Button variant="outline" className="w-full gap-2 border-border mt-2">
                  <Navigation className="w-4 h-4" /> Navigate to Location
                </Button>
              </div>

              <div className="glass-card p-4">
                <div className="section-title mb-2">Reported By</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{selectedTask.citizenName}</div>
                    <div className="text-xs text-muted-foreground">{new Date(selectedTask.createdAt).toLocaleString()}</div>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1 border-border">
                    <Phone className="w-3 h-3" /> Call
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {(selectedTask.status === 'assigned' || selectedTask.status === 'rework_required') && (
                  <Button onClick={() => handleStartWork(selectedTask.id)}
                    className="w-full gap-2 bg-primary text-primary-foreground">
                    {selectedTask.status === 'rework_required' ? (
                      <><RotateCcw className="w-4 h-4" /> Restart Repair</>
                    ) : (
                      <><AlertTriangle className="w-4 h-4" /> Start Working</>
                    )}
                  </Button>
                )}

                {selectedTask.status === 'in_progress' && (
                  <>
                    <SmartImageUpload
                      label="Upload Repair Proof (After)"
                      helperText="Capture or upload the completed repair"
                      onUploaded={(url) => { setAfterImageUrl(url); setAiResult(null); }}
                      onClear={() => { setAfterImageUrl(null); setAiResult(null); }}
                    />

                    {/* Before/After comparison */}
                    {afterImageUrl && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-3 space-y-3">
                        <div className="section-title">Before vs After</div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Before</div>
                            <div className="rounded-lg overflow-hidden aspect-square bg-muted">
                              {selectedTask.imageUrl && selectedTask.imageUrl !== '/placeholder.svg' ? (
                                <img src={selectedTask.imageUrl} className="w-full h-full object-cover" alt="before" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">N/A</div>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[10px] text-success uppercase tracking-wide">After</div>
                            <div className="rounded-lg overflow-hidden aspect-square bg-muted">
                              <img src={afterImageUrl} className="w-full h-full object-cover" alt="after" />
                            </div>
                          </div>
                        </div>

                        {!aiResult && (
                          <Button onClick={runAIVerification} disabled={verifying}
                            className="w-full gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground">
                            {verifying ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> AI is comparing images…</>
                            ) : (
                              <><Sparkles className="w-4 h-4" /> Run AI Verification</>
                            )}
                          </Button>
                        )}
                      </motion.div>
                    )}

                    {/* AI verification result */}
                    {aiResult && (() => {
                      const meta = aiStatusMeta(aiResult.status);
                      const Icon = meta.icon;
                      return (
                        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                          className={`glass-card p-4 space-y-3 ${meta.bg}`}>
                          <div className="flex items-center gap-2">
                            <Icon className={`w-5 h-5 ${meta.color}`} />
                            <div className="flex-1">
                              <div className={`font-semibold ${meta.color}`}>AI Verdict: {meta.label}</div>
                              <div className="text-[10px] text-muted-foreground">
                                Confidence {(aiResult.confidence * 100).toFixed(0)}% · Quality {aiResult.quality_score}/100
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{aiResult.reasoning}</p>
                          <div className="text-[10px] text-muted-foreground">
                            Recommendation: <span className="font-semibold uppercase">{aiResult.recommendation}</span>
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" className="flex-1 gap-1" onClick={runAIVerification} disabled={verifying}>
                              <Sparkles className="w-3 h-3" /> Re-verify
                            </Button>
                            <Button onClick={submitForReview}
                              disabled={aiResult.status === 'not_fixed'}
                              className="flex-1 gap-1 bg-success text-success-foreground hover:bg-success/90 disabled:bg-muted disabled:text-muted-foreground">
                              <ShieldCheck className="w-3 h-3" /> Submit
                            </Button>
                          </div>
                          {aiResult.status === 'not_fixed' && (
                            <p className="text-[10px] text-destructive text-center">
                              AI says the issue is not fixed. Please redo the repair and re-upload.
                            </p>
                          )}
                        </motion.div>
                      );
                    })()}
                  </>
                )}

                {selectedTask.status === 'under_review' && (
                  <div className="glass-card p-4 text-center border-accent/30">
                    <ShieldCheck className="w-8 h-8 text-accent mx-auto mb-2" />
                    <div className="font-semibold text-accent">Under Command Center Review</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      AI verification passed. Awaiting government approval.
                    </div>
                  </div>
                )}
                {selectedTask.status === 'completed' && (
                  <div className="glass-card p-4 text-center border-success/30">
                    <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
                    <div className="font-semibold text-success">Task Completed & Approved</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Command center has approved your repair. Full report sent to citizen.
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === 'notifications' && (
            <motion.div key="notifications" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              <h2 className="text-xl font-bold">Notifications</h2>
              {workerNotifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {workerNotifications.map(n => (
                    <button key={n.id} onClick={() => {
                      markNotificationRead(n.id);
                      const c = complaints.find(x => x.id === n.complaintId);
                      if (c) openTask(c);
                    }}
                      className={`glass-card p-3 w-full text-left space-y-1 transition-colors ${!n.read ? 'border-primary/40' : 'opacity-70'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{n.title}</span>
                        {!n.read && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{n.message}</p>
                      <div className="text-[10px] text-muted-foreground font-mono">{new Date(n.timestamp).toLocaleString()}</div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Camera, CheckCircle2, Clock, Navigation, AlertTriangle, ChevronRight, Upload, Phone, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CATEGORY_LABELS, getCategoryIcon, getPriorityColor, type Complaint } from '@/data/mockData';
import { getComplaints, updateComplaintStatus, getNotifications, markNotificationRead } from '@/data/store';
import { useNavigate } from 'react-router-dom';
import { useStoreRefresh } from '@/hooks/useStore';

type View = 'tasks' | 'detail' | 'notifications';

export default function WorkerApp() {
  useStoreRefresh();
  const navigate = useNavigate();
  const [view, setView] = useState<View>('tasks');
  const [selectedTask, setSelectedTask] = useState<Complaint | null>(null);
  const [filter, setFilter] = useState<'all' | 'assigned' | 'in_progress' | 'completed'>('all');
  const [uploadedPhoto, setUploadedPhoto] = useState(false);

  const complaints = getComplaints();
  const workerNotifications = getNotifications('worker');
  const unreadCount = workerNotifications.filter(n => !n.read).length;

  // Show all non-submitted complaints + any assigned to this worker
  const workerTasks = complaints.filter(c => c.workerId === 'WRK-00001' || c.status !== 'submitted').slice(0, 30);
  const filteredTasks = filter === 'all' ? workerTasks : workerTasks.filter(t => t.status === filter);

  const stats = {
    assigned: workerTasks.filter(t => t.status === 'assigned').length,
    inProgress: workerTasks.filter(t => t.status === 'in_progress').length,
    completed: workerTasks.filter(t => t.status === 'completed').length,
  };

  const handleStatusUpdate = (id: string, status: Complaint['status']) => {
    if (status === 'completed' && !uploadedPhoto) return; // Must upload photo first
    updateComplaintStatus(id, status, '/placeholder.svg');
    // Refresh selected task from store
    const updated = getComplaints().find(c => c.id === id);
    if (updated) setSelectedTask({ ...updated });
    setUploadedPhoto(false);
  };

  const handleStartWork = (id: string) => {
    updateComplaintStatus(id, 'in_progress');
    const updated = getComplaints().find(c => c.id === id);
    if (updated) setSelectedTask({ ...updated });
  };

  const statusLabels = { submitted: 'New', assigned: 'Assigned', in_progress: 'In Progress', completed: 'Completed' };

  return (
    <div className="min-h-screen bg-background cyber-grid">
      <div className="sticky top-0 z-50 glass-card border-b border-border/50 rounded-none">
        <div className="flex items-center justify-between px-4 py-3">
          {view === 'detail' ? (
            <button onClick={() => setView('tasks')} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-sm font-semibold tracking-wide">
            <span className="text-primary">PS</span>-CRM Worker
          </h1>
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

              {/* Notification banner */}
              {unreadCount > 0 && (
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  onClick={() => setView('notifications')}
                  className="w-full glass-card p-3 border-warning/30 flex items-center gap-3">
                  <Bell className="w-5 h-5 text-warning" />
                  <span className="text-sm font-medium">{unreadCount} new task notification{unreadCount > 1 ? 's' : ''}</span>
                  <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                </motion.button>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div className="glass-card p-3 text-center">
                  <div className="text-xl font-bold font-mono text-warning">{stats.assigned}</div>
                  <div className="text-xs text-muted-foreground">Assigned</div>
                </div>
                <div className="glass-card p-3 text-center">
                  <div className="text-xl font-bold font-mono text-primary">{stats.inProgress}</div>
                  <div className="text-xs text-muted-foreground">In Progress</div>
                </div>
                <div className="glass-card p-3 text-center">
                  <div className="text-xl font-bold font-mono text-success">{stats.completed}</div>
                  <div className="text-xs text-muted-foreground">Done</div>
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {(['all', 'assigned', 'in_progress', 'completed'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors
                      ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                    {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {filteredTasks.map(task => (
                  <button key={task.id} onClick={() => { setSelectedTask(task); setUploadedPhoto(false); setView('detail'); }}
                    className="glass-card p-3 w-full text-left flex items-center gap-3 hover:border-primary/30 transition-colors">
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

              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getCategoryIcon(selectedTask.category)}</span>
                  <div>
                    <div className="font-semibold">{CATEGORY_LABELS[selectedTask.category]}</div>
                    <div className="text-xs text-muted-foreground">{selectedTask.department}</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
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

              {/* Task Workflow */}
              <div className="glass-card p-4">
                <div className="section-title mb-3">Task Workflow</div>
                <div className="flex items-center gap-2 text-xs">
                  {['Assigned', 'Navigate', 'Fix', 'Upload Proof', 'Complete'].map((step, i) => {
                    const stepIndex = selectedTask.status === 'assigned' ? 0
                      : selectedTask.status === 'in_progress' ? (uploadedPhoto ? 3 : 2)
                      : selectedTask.status === 'completed' ? 4 : 0;
                    return (
                      <div key={step} className="flex items-center gap-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold
                          ${i <= stepIndex ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          {i <= stepIndex ? '✓' : i + 1}
                        </div>
                        {i < 4 && <div className={`w-4 h-0.5 ${i < stepIndex ? 'bg-primary' : 'bg-muted'}`} />}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                  <span>Assign</span><span>Nav</span><span>Fix</span><span>Proof</span><span>Done</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {selectedTask.status === 'assigned' && (
                  <Button onClick={() => handleStartWork(selectedTask.id)}
                    className="w-full gap-2 bg-primary text-primary-foreground">
                    <AlertTriangle className="w-4 h-4" /> Start Working
                  </Button>
                )}
                {selectedTask.status === 'in_progress' && (
                  <>
                    {!uploadedPhoto ? (
                      <Button onClick={() => setUploadedPhoto(true)}
                        variant="outline" className="w-full gap-2 border-border">
                        <Camera className="w-4 h-4" /> Upload Repair Photo
                      </Button>
                    ) : (
                      <div className="glass-card p-3 border-success/30 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        <span className="text-sm text-success font-medium">Repair photo uploaded ✓</span>
                      </div>
                    )}
                    <Button onClick={() => handleStatusUpdate(selectedTask.id, 'completed')}
                      disabled={!uploadedPhoto}
                      className={`w-full gap-2 ${uploadedPhoto ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}>
                      <CheckCircle2 className="w-4 h-4" /> {uploadedPhoto ? 'Mark as Completed & Send for Review' : 'Upload photo first to complete'}
                    </Button>
                  </>
                )}
                {selectedTask.status === 'completed' && (
                  <div className="glass-card p-4 text-center border-success/30">
                    <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
                    <div className="font-semibold text-success">Task Completed & Sent for Admin Review</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      The admin will review your repair and approve or request a redo.
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
                      if (c) { setSelectedTask(c); setUploadedPhoto(false); setView('detail'); }
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

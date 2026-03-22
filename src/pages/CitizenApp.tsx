import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Camera, Mic, Send, ArrowLeft, CheckCircle2, Clock, AlertTriangle, Search, ChevronRight, Star, Bell, FileText, ShieldCheck, Eye, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_DEPARTMENTS, getCategoryIcon, getStatusColor, type ComplaintCategory, type Complaint } from '@/data/mockData';
import { getComplaints, addComplaint, getNotifications, getCitizenReport, markNotificationRead } from '@/data/store';
import { useNavigate } from 'react-router-dom';
import { useStoreRefresh } from '@/hooks/useStore';

type View = 'home' | 'report' | 'track' | 'detail' | 'success' | 'notifications' | 'full-report';

export default function CitizenApp() {
  useStoreRefresh();
  const navigate = useNavigate();
  const [view, setView] = useState<View>('home');
  const [selectedCategory, setSelectedCategory] = useState<ComplaintCategory | ''>('');
  const [description, setDescription] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [newComplaintId, setNewComplaintId] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [reportComplaintId, setReportComplaintId] = useState('');
  const [imageUploaded, setImageUploaded] = useState(false);
  const complaints = getComplaints();
  const citizenNotifications = getNotifications('citizen');
  const unreadCount = citizenNotifications.filter(n => !n.read).length;
  const myComplaints = complaints.slice(0, 15);

  const handleSubmit = useCallback(() => {
    if (!selectedCategory && !imageUploaded) return;
    const id = `CMP-${String(complaints.length + 1).padStart(5, '0')}`;
    const category = selectedCategory || 'pothole';
    const newComplaint: Complaint = {
      id, userId: 'USR-SELF', citizenName: 'You', category,
      description: description || `${CATEGORY_LABELS[category]} reported via image upload`,
      imageUrl: '/placeholder.svg',
      lat: 12.9716 + (Math.random() - 0.5) * 0.1, lng: 77.5946 + (Math.random() - 0.5) * 0.1,
      ward: 'Ward 3', status: 'submitted', priority: 'medium',
      department: CATEGORY_DEPARTMENTS[category],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      aiConfidence: 0.92, aiDetectedCategory: category,
    };
    addComplaint(newComplaint);
    setNewComplaintId(id);
    setView('success');
    setSelectedCategory(''); setDescription(''); setImageUploaded(false);
  }, [selectedCategory, description, complaints.length, imageUploaded]);

  const handleImageUpload = () => {
    setImageUploaded(true);
    if (!selectedCategory) {
      const detected: ComplaintCategory[] = ['pothole', 'garbage', 'drainage', 'streetlight', 'sewage_overflow'];
      setSelectedCategory(detected[Math.floor(Math.random() * detected.length)]);
    }
  };

  const handleTrack = () => {
    const found = complaints.find(c => c.id === trackingId.toUpperCase());
    if (found) { setSelectedComplaint(found); setView('detail'); }
  };

  const statusSteps: Complaint['status'][] = ['submitted', 'assigned', 'in_progress', 'under_review', 'completed'];
  const statusLabels: Record<string, string> = {
    submitted: 'Submitted', assigned: 'Assigned', in_progress: 'In Progress',
    under_review: 'Under Review', rework_required: 'Rework Required', completed: 'Resolved',
  };

  const simulateVoice = () => {
    setIsRecording(true);
    setTimeout(() => {
      setDescription('There is a large pothole near the main junction causing traffic issues');
      setSelectedCategory('pothole');
      setIsRecording(false);
    }, 2000);
  };

  const report = reportComplaintId ? getCitizenReport(reportComplaintId) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 glass-card border-b border-border/30 rounded-none">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <button onClick={() => view !== 'home' ? setView('home') : navigate('/')} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-bold tracking-wide">
            <span className="text-foreground">JanSetu</span> <span className="text-primary">AI</span>
            <span className="text-muted-foreground ml-1 text-xs font-normal">Citizen</span>
          </h1>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/profile')} className="text-muted-foreground hover:text-foreground"><User className="w-5 h-5" /></button>
            <button onClick={() => setView('notifications')} className="relative text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">{unreadCount}</span>}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4">
        <AnimatePresence mode="wait">
          {/* HOME */}
          {view === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[hsl(175,85%,42%)] to-[hsl(195,85%,45%)] flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-1">Report & Track</h2>
                <p className="text-sm text-muted-foreground">Civic issues in your neighborhood</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Report Issue', sub: 'Upload photo or describe', icon: AlertTriangle, color: 'text-warning', action: () => setView('report') },
                  { label: 'Track Status', sub: 'Check your complaint', icon: Search, color: 'text-primary', action: () => setView('track') },
                ].map(item => (
                  <button key={item.label} onClick={item.action}
                    className="glass-card p-5 text-left hover:border-primary/30 transition-all group hover-lift">
                    <item.icon className={`w-6 h-6 ${item.color} mb-3 group-hover:scale-110 transition-transform`} />
                    <div className="font-semibold text-sm">{item.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{item.sub}</div>
                  </button>
                ))}
              </div>

              {unreadCount > 0 && (
                <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  onClick={() => setView('notifications')}
                  className="w-full glass-card p-3 glow-border flex items-center gap-3 hover:border-primary/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"><Bell className="w-4 h-4 text-primary" /></div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">{unreadCount} new notification{unreadCount > 1 ? 's' : ''}</div>
                    <div className="text-xs text-muted-foreground">Tap to view updates</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              )}

              <div>
                <div className="section-title mb-3">Recent Complaints</div>
                <div className="space-y-2">
                  {myComplaints.slice(0, 5).map(c => (
                    <button key={c.id} onClick={() => { setSelectedComplaint(c); setView('detail'); }}
                      className="glass-card p-3 w-full text-left flex items-center gap-3 hover:border-primary/20 transition-all hover-lift">
                      <span className="text-xl">{getCategoryIcon(c.category)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{CATEGORY_LABELS[c.category]}</div>
                        <div className="text-xs text-muted-foreground">{c.id} · {c.ward}</div>
                      </div>
                      <div className={`text-xs font-semibold ${getStatusColor(c.status)}`}>{statusLabels[c.status]}</div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* REPORT */}
          {view === 'report' && (
            <motion.div key="report" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
              <h2 className="text-xl font-bold">Report an Issue</h2>
              <div className="space-y-4">
                <div>
                  <label className="section-title mb-2 block">Upload Photo (AI will detect issue)</label>
                  {!imageUploaded ? (
                    <Button onClick={handleImageUpload} variant="outline" className="w-full h-32 border-dashed border-2 border-border/50 flex flex-col gap-2 hover:border-primary/30">
                      <Camera className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Tap to upload photo</span>
                      <span className="text-xs text-primary">AI will auto-detect the issue</span>
                    </Button>
                  ) : (
                    <div className="glass-card p-3 glow-border flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-success" />
                      <div>
                        <span className="text-sm font-medium text-success">Photo uploaded ✓</span>
                        <div className="text-xs text-muted-foreground">AI analyzing...</div>
                      </div>
                    </div>
                  )}
                </div>

                {imageUploaded && selectedCategory && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    className="glass-card p-4 border-primary/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-4 h-4 text-primary" />
                      <span className="text-xs text-muted-foreground">AI Image Detection</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-primary">{getCategoryIcon(selectedCategory)} {CATEGORY_LABELS[selectedCategory]} detected</span>
                      <span className="text-xs font-mono text-success px-2 py-0.5 rounded-full bg-success/10">92% confidence</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">→ {CATEGORY_DEPARTMENTS[selectedCategory]}</div>
                  </motion.div>
                )}

                <div>
                  <label className="section-title mb-2 block">Category {imageUploaded && '(auto-detected)'}</label>
                  <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as ComplaintCategory)}>
                    <SelectTrigger className="bg-muted/30 border-border/50"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{getCategoryIcon(cat)} {CATEGORY_LABELS[cat]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="section-title mb-2 block">Description (optional)</label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the issue..." className="bg-muted/30 border-border/50 min-h-[80px]" />
                </div>

                <Button variant="outline" onClick={simulateVoice}
                  className={`w-full gap-2 border-border/50 ${isRecording ? 'border-destructive text-destructive animate-pulse' : ''}`}>
                  <Mic className="w-4 h-4" /> {isRecording ? 'Listening...' : 'Voice Report'}
                </Button>

                <div className="glass-card p-3 flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-xs text-muted-foreground">GPS Location</div>
                    <div className="text-sm font-mono">12.9716° N, 77.5946° E</div>
                  </div>
                  <div className="status-dot-active ml-auto" />
                </div>

                <Button onClick={handleSubmit} disabled={!selectedCategory && !imageUploaded}
                  className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold"
                  style={{ boxShadow: selectedCategory || imageUploaded ? '0 0 20px hsl(175 85% 42% / 0.2)' : 'none' }}>
                  <Send className="w-4 h-4" /> Submit Complaint
                </Button>
              </div>
            </motion.div>
          )}

          {/* TRACK */}
          {view === 'track' && (
            <motion.div key="track" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
              <h2 className="text-xl font-bold">Track Complaint</h2>
              <div className="flex gap-2">
                <Input value={trackingId} onChange={e => setTrackingId(e.target.value)} placeholder="Enter Complaint ID (e.g. CMP-00001)" className="bg-muted/30 border-border/50 font-mono" />
                <Button onClick={handleTrack} className="bg-primary text-primary-foreground"><Search className="w-4 h-4" /></Button>
              </div>
              <div className="space-y-2">
                {myComplaints.slice(0, 8).map(c => (
                  <button key={c.id} onClick={() => { setSelectedComplaint(c); setView('detail'); }}
                    className="glass-card p-3 w-full text-left flex items-center gap-3 hover:border-primary/20 transition-all">
                    <span className="text-lg">{getCategoryIcon(c.category)}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{CATEGORY_LABELS[c.category]}</div>
                      <div className="text-xs font-mono text-muted-foreground">{c.id}</div>
                    </div>
                    <div className={`text-xs font-semibold ${getStatusColor(c.status)}`}>{statusLabels[c.status]}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* DETAIL */}
          {view === 'detail' && selectedComplaint && (
            <motion.div key="detail" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{selectedComplaint.id}</h2>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(selectedComplaint.status)} bg-current/10`}>
                  {statusLabels[selectedComplaint.status]}
                </span>
              </div>

              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getCategoryIcon(selectedComplaint.category)}</span>
                  <div>
                    <div className="font-semibold">{CATEGORY_LABELS[selectedComplaint.category]}</div>
                    <div className="text-xs text-muted-foreground">{selectedComplaint.department}</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{selectedComplaint.description}</p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>📍 {selectedComplaint.ward}</span>
                  <span>📅 {new Date(selectedComplaint.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Timeline */}
              <div className="glass-card p-4">
                <div className="section-title mb-4">Progress Timeline</div>
                <div className="relative">
                  {statusSteps.map((step, i) => {
                    const currentIdx = selectedComplaint.status === 'rework_required' ? 2 : statusSteps.indexOf(selectedComplaint.status);
                    const isActive = currentIdx >= i;
                    const isCurrent = selectedComplaint.status === step || (selectedComplaint.status === 'rework_required' && step === 'in_progress');
                    return (
                      <div key={step} className="flex items-start gap-3 mb-4 last:mb-0">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                            ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                            ${isCurrent ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}>
                            {isActive ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                          </div>
                          {i < statusSteps.length - 1 && <div className={`w-0.5 h-6 mt-1 ${isActive ? 'bg-primary' : 'bg-muted'}`} />}
                        </div>
                        <div className="pt-1">
                          <div className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{statusLabels[step]}</div>
                          {isCurrent && selectedComplaint.status === 'rework_required' && step === 'in_progress' && (
                            <div className="text-xs text-destructive mt-0.5">⚠️ Rework required</div>
                          )}
                          {isCurrent && selectedComplaint.status !== 'rework_required' && (
                            <div className="text-xs text-primary flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" /> Current</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedComplaint.aiVerification && (
                <div className={`glass-card p-4 ${selectedComplaint.aiVerification.issueStillDetected ? 'border-warning/30' : 'border-success/30'}`}>
                  <div className="flex items-center gap-2 mb-2"><ShieldCheck className="w-4 h-4 text-primary" /><span className="section-title">AI Verification</span></div>
                  <p className="text-sm text-muted-foreground">{selectedComplaint.aiVerification.verdict}</p>
                </div>
              )}

              {selectedComplaint.assignedWorker && (
                <div className="glass-card p-4">
                  <div className="section-title mb-2">Assigned Worker</div>
                  <div className="text-sm font-medium">{selectedComplaint.assignedWorker}</div>
                  <div className="text-xs text-muted-foreground">{selectedComplaint.department}</div>
                </div>
              )}

              {selectedComplaint.status === 'completed' && (
                <Button onClick={() => { setReportComplaintId(selectedComplaint.id); setView('full-report'); }}
                  className="w-full gap-2 bg-primary text-primary-foreground"><FileText className="w-4 h-4" /> View Resolution Report</Button>
              )}

              {selectedComplaint.citizenRating && (
                <div className="glass-card p-4">
                  <div className="section-title mb-2">Your Rating</div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-5 h-5 ${s <= selectedComplaint.citizenRating! ? 'text-warning fill-warning' : 'text-muted'}`} />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* NOTIFICATIONS */}
          {view === 'notifications' && (
            <motion.div key="notifications" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              <h2 className="text-xl font-bold">Notifications</h2>
              {citizenNotifications.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No notifications yet</p>
                  <p className="text-xs mt-1">Submit a complaint to receive updates</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {citizenNotifications.map(n => (
                    <button key={n.id} onClick={() => { markNotificationRead(n.id); const c = complaints.find(x => x.id === n.complaintId); if (c) { setSelectedComplaint(c); setView('detail'); } }}
                      className={`glass-card p-3 w-full text-left space-y-1 transition-all ${!n.read ? 'border-primary/30' : 'opacity-60'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{n.title}</span>
                        {!n.read && <div className="status-dot-active" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{n.message}</p>
                      <div className="text-[10px] text-muted-foreground font-mono">{new Date(n.timestamp).toLocaleString()}</div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* FULL REPORT */}
          {view === 'full-report' && (
            <motion.div key="full-report" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              <h2 className="text-xl font-bold">Resolution Report</h2>
              {report ? (
                <div className="space-y-3">
                  <div className="glass-card p-5 border-success/30 space-y-4">
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-6 h-6 text-success" /><span className="font-bold text-success">Issue Resolved & Approved</span></div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {[
                        { label: 'Complaint ID', value: report.complaintId },
                        { label: 'Category', value: report.category.replace('_', ' ') },
                        { label: 'Department', value: report.department },
                        { label: 'Worker', value: report.assignedWorker },
                        { label: 'Submitted', value: new Date(report.submittedAt).toLocaleDateString() },
                        { label: 'Resolved', value: new Date(report.resolvedAt).toLocaleDateString() },
                      ].map(f => (
                        <div key={f.label}>
                          <div className="text-xs text-muted-foreground">{f.label}</div>
                          <div className="font-medium capitalize">{f.value}</div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Resolution Time</div>
                      <p className="text-sm font-mono font-bold text-primary">{report.resolutionTime} hours</p>
                    </div>
                    {report.aiVerification && (
                      <div className="bg-muted/30 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1"><ShieldCheck className="w-4 h-4 text-primary" /><span className="text-xs font-semibold text-primary">AI Verification</span></div>
                        <p className="text-xs text-muted-foreground">{report.aiVerification.verdict}</p>
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Official Notes</div>
                      <p className="text-sm text-success">{report.adminNotes}</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setView('home')} className="w-full border-border/50">Back to Home</Button>
                </div>
              ) : (
                <div className="glass-card p-8 text-center">
                  <Clock className="w-10 h-10 mx-auto mb-3 text-warning opacity-50" />
                  <p className="text-sm font-medium">Report Not Yet Available</p>
                  <p className="text-xs text-muted-foreground mt-1">Pending official review</p>
                  <Button variant="outline" onClick={() => setView('home')} className="mt-4 border-border/50">Back</Button>
                </div>
              )}
            </motion.div>
          )}

          {/* SUCCESS */}
          {view === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 space-y-5">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                className="w-24 h-24 mx-auto rounded-full bg-success/15 flex items-center justify-center"
                style={{ boxShadow: '0 0 40px hsl(150 80% 40% / 0.2)' }}>
                <CheckCircle2 className="w-12 h-12 text-success" />
              </motion.div>
              <h2 className="text-2xl font-bold">Complaint Submitted!</h2>
              <div className="glass-card p-5 inline-block glow-border">
                <div className="text-xs text-muted-foreground">Your Complaint ID</div>
                <div className="text-3xl font-mono font-bold text-primary mt-1">{newComplaintId}</div>
              </div>
              <p className="text-sm text-muted-foreground">AI has classified your issue. Worker will be assigned shortly!</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => setView('home')} className="border-border/50">Home</Button>
                <Button onClick={() => setView('notifications')} className="bg-primary text-primary-foreground gap-1"><Bell className="w-4 h-4" /> Notifications</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

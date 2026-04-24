import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Mic, MicOff, Send, ArrowLeft, CheckCircle2, Clock, AlertTriangle, Search, ChevronRight, Star, Bell, FileText, ShieldCheck, Eye, Sparkles, Loader2, Lightbulb, IndianRupee, Users2, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_DEPARTMENTS, getCategoryIcon, getStatusColor, type ComplaintCategory, type Complaint } from '@/data/mockData';
import { getComplaints, addComplaint, getNotifications, getCitizenReport, markNotificationRead } from '@/data/store';
import { estimateRepairCost, explainClassification, findDuplicates } from '@/data/aiHelpers';
import { useNavigate } from 'react-router-dom';
import { useStoreRefresh } from '@/hooks/useStore';
import jansetuLogo from '@/assets/jansetu-logo.png';
import { SmartImageUpload } from '@/components/SmartImageUpload';
import Leaderboard from '@/components/Leaderboard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLang } from '@/i18n/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { RealtimeNotificationBridge } from '@/components/RealtimeNotificationBridge';

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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<{
    category: ComplaintCategory;
    confidence: number;
    severity: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    department: string;
  } | null>(null);
  const complaints = getComplaints();
  const citizenNotifications = getNotifications('citizen');
  const unreadCount = citizenNotifications.filter(n => !n.read).length;

  const myComplaints = complaints.slice(0, 15);

  const handleSubmit = useCallback(() => {
    if (!selectedCategory && !imageUrl) return;
    const id = `CMP-${String(complaints.length + 1).padStart(5, '0')}`;
    const category = (selectedCategory || aiResult?.category || 'pothole') as ComplaintCategory;
    const priority = aiResult?.severity === 'high' ? 'high'
      : aiResult?.severity === 'low' ? 'low' : 'medium';
    const newComplaint: Complaint = {
      id,
      userId: 'USR-SELF',
      citizenName: 'You',
      category,
      description: description || aiResult?.description || `${CATEGORY_LABELS[category]} reported via image upload`,
      imageUrl: imageUrl || '/placeholder.svg',
      lat: 12.9716 + (Math.random() - 0.5) * 0.1,
      lng: 77.5946 + (Math.random() - 0.5) * 0.1,
      ward: 'Ward 3',
      status: 'submitted',
      priority,
      department: CATEGORY_DEPARTMENTS[category],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      aiConfidence: aiResult?.confidence ?? 0.92,
      aiDetectedCategory: category,
    };
    addComplaint(newComplaint);
    setNewComplaintId(id);
    setView('success');
    setSelectedCategory('');
    setDescription('');
    setImageUrl(null);
    setAiResult(null);
  }, [selectedCategory, description, complaints.length, imageUrl, aiResult]);

  const runAIDetection = async (url: string) => {
    setAiAnalyzing(true);
    setAiResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('detect-issue', {
        body: { imageUrl: url },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiResult(data);
      // Auto-fill form
      setSelectedCategory(data.category);
      if (!description) setDescription(data.description);
      toast.success(`AI detected: ${CATEGORY_LABELS[data.category as ComplaintCategory] || data.category}`);
    } catch (e: any) {
      console.error('AI detection failed:', e);
      const msg = e?.message || 'AI detection failed';
      if (msg.includes('Rate limit')) toast.error('AI rate limit reached. Please retry shortly.');
      else if (msg.includes('credits')) toast.error('AI credits exhausted. Add funds in workspace settings.');
      else toast.error('AI detection failed. You can still submit manually.');
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleImageUploaded = (url: string) => {
    setImageUrl(url);
    runAIDetection(url);
  };

  const handleImageCleared = () => {
    setImageUrl(null);
    setAiResult(null);
  };

  const handleTrack = () => {
    const found = complaints.find(c => c.id === trackingId.toUpperCase());
    if (found) {
      setSelectedComplaint(found);
      setView('detail');
    }
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
    <div className="min-h-screen bg-background cyber-grid">
      <div className="sticky top-0 z-50 glass-card border-b border-border/50 rounded-none">
        <div className="flex items-center justify-between px-4 py-3">
          {view !== 'home' ? (
            <button onClick={() => setView('home')} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <img src={jansetuLogo} alt="JanSetu AI" className="w-6 h-6 rounded" />
            <h1 className="text-sm font-semibold tracking-wide">
              <span className="text-foreground">JanSetu</span> <span className="text-primary">AI</span>
            </h1>
          </div>
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
          {view === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="text-center py-6">
                <img src={jansetuLogo} alt="JanSetu AI" className="w-16 h-16 mx-auto mb-4 rounded-2xl" />
                <h2 className="text-2xl font-bold mb-1">Report & Track</h2>
                <p className="text-sm text-muted-foreground">Civic issues in your neighborhood</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setView('report')} className="glass-card p-5 text-left hover:border-primary/50 transition-colors group">
                  <AlertTriangle className="w-6 h-6 text-warning mb-3 group-hover:scale-110 transition-transform" />
                  <div className="font-semibold text-sm">Report Issue</div>
                  <div className="text-xs text-muted-foreground mt-1">Upload photo or describe</div>
                </button>
                <button onClick={() => setView('track')} className="glass-card p-5 text-left hover:border-primary/50 transition-colors group">
                  <Search className="w-6 h-6 text-primary mb-3 group-hover:scale-110 transition-transform" />
                  <div className="font-semibold text-sm">Track Status</div>
                  <div className="text-xs text-muted-foreground mt-1">Check your complaint</div>
                </button>
                <button onClick={() => navigate('/map')} className="glass-card p-5 text-left hover:border-accent/50 transition-colors group">
                  <MapIcon className="w-6 h-6 text-accent mb-3 group-hover:scale-110 transition-transform" />
                  <div className="font-semibold text-sm">City Map</div>
                  <div className="text-xs text-muted-foreground mt-1">Heatmap & live markers</div>
                </button>
                <button onClick={() => setView('notifications')} className="glass-card p-5 text-left hover:border-primary/50 transition-colors group">
                  <Bell className="w-6 h-6 text-primary mb-3 group-hover:scale-110 transition-transform" />
                  <div className="font-semibold text-sm">Notifications</div>
                  <div className="text-xs text-muted-foreground mt-1">{unreadCount > 0 ? `${unreadCount} new updates` : 'All caught up'}</div>
                </button>
              </div>

              <Leaderboard compact />

              {unreadCount > 0 && (
                <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  onClick={() => setView('notifications')}
                  className="w-full glass-card p-3 border-primary/30 flex items-center gap-3 hover:border-primary/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">You have {unreadCount} new notification{unreadCount > 1 ? 's' : ''}</div>
                    <div className="text-xs text-muted-foreground">Tap to view updates on your complaints</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              )}

              <div>
                <div className="section-title mb-3">Your Recent Complaints</div>
                <div className="space-y-2">
                  {myComplaints.slice(0, 5).map(c => (
                    <button key={c.id} onClick={() => { setSelectedComplaint(c); setView('detail'); }}
                      className="glass-card p-3 w-full text-left flex items-center gap-3 hover:border-primary/30 transition-colors">
                      <span className="text-xl">{getCategoryIcon(c.category)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{CATEGORY_LABELS[c.category]}</div>
                        <div className="text-xs text-muted-foreground">{c.id} · {c.ward}</div>
                      </div>
                      <div className={`text-xs font-medium ${getStatusColor(c.status)}`}>
                        {statusLabels[c.status]}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'report' && (
            <motion.div key="report" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
              <h2 className="text-xl font-bold">Report an Issue</h2>
              <div className="space-y-4">
                {/* Smart Image Upload (device or camera) */}
                <SmartImageUpload
                  label="Upload Photo (AI will detect issue)"
                  helperText="Drop a photo, browse files, or capture from camera"
                  onUploaded={handleImageUploaded}
                  onClear={handleImageCleared}
                  initialUrl={imageUrl ?? undefined}
                />

                {/* AI Analysis state */}
                {aiAnalyzing && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-3 border-primary/30 flex items-center gap-3"
                  >
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    <div>
                      <div className="text-sm font-medium text-primary flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> AI is analyzing your photo…
                      </div>
                      <div className="text-xs text-muted-foreground">Detecting issue category and severity</div>
                    </div>
                  </motion.div>
                )}

                {/* AI Detection Result */}
                {aiResult && !aiAnalyzing && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-4 border-primary/40 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                        <Eye className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground">AI Vision Result</div>
                        <div className="text-sm font-semibold text-foreground">
                          {getCategoryIcon(aiResult.category)} {CATEGORY_LABELS[aiResult.category] || aiResult.category}
                        </div>
                      </div>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-success/15 text-success">
                        {(aiResult.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground italic">"{aiResult.title}"</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        Dept: {aiResult.department}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        aiResult.severity === 'high' ? 'bg-destructive/15 text-destructive'
                        : aiResult.severity === 'low' ? 'bg-success/15 text-success'
                        : 'bg-warning/15 text-warning'
                      }`}>
                        Severity: {aiResult.severity}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* AI Smart features: Explainability, Cost estimate, Duplicate detection */}
                {aiResult && !aiAnalyzing && (() => {
                  const reasons = explainClassification(aiResult.category, aiResult.confidence);
                  const cost = estimateRepairCost(aiResult.category, aiResult.severity);
                  const dupes = findDuplicates(complaints, {
                    lat: 12.9716, lng: 77.5946, category: aiResult.category,
                  });
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="grid gap-3"
                    >
                      {/* Explainability */}
                      <div className="glass-card p-3 border-accent/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="w-4 h-4 text-accent" />
                          <div className="text-xs font-semibold text-accent uppercase tracking-wide">Why this classification?</div>
                        </div>
                        <ul className="space-y-1">
                          {reasons.map((r, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <span className="text-accent mt-0.5">•</span>{r}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Cost estimation */}
                      <div className="glass-card p-3 border-warning/20">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <IndianRupee className="w-4 h-4 text-warning" />
                            <div className="text-xs font-semibold text-warning uppercase tracking-wide">Estimated Repair Cost</div>
                          </div>
                          <div className="text-sm font-mono font-bold gradient-text">
                            {cost.currency}{cost.min.toLocaleString()} – {cost.currency}{cost.max.toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1">
                          <Clock className="w-3 h-3" /> ~{cost.estimatedHours}h work · avg {cost.currency}{cost.avg.toLocaleString()}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {cost.materials.map(m => (
                            <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">{m}</span>
                          ))}
                        </div>
                      </div>

                      {/* Duplicate detection */}
                      {dupes.length > 0 && (
                        <div className="glass-card p-3 border-primary/30">
                          <div className="flex items-center gap-2 mb-2">
                            <Users2 className="w-4 h-4 text-primary" />
                            <div className="text-xs font-semibold text-primary uppercase tracking-wide">
                              {dupes.length} similar complaint{dupes.length > 1 ? 's' : ''} nearby
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            {dupes.map(d => (
                              <button
                                key={d.id}
                                onClick={() => { setSelectedComplaint(d); setView('detail'); }}
                                className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                              >
                                <span className="text-base">{getCategoryIcon(d.category)}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium truncate">{d.id} · {d.ward}</div>
                                  <div className="text-[10px] text-muted-foreground truncate">{d.description}</div>
                                </div>
                                <span className={`text-[10px] font-medium ${getStatusColor(d.status)}`}>
                                  {d.status.replace(/_/g, ' ')}
                                </span>
                              </button>
                            ))}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-2 italic">
                            You can still submit — the system will link your report to the existing thread.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  );
                })()}

                <div>
                  <label className="section-title mb-2 block">Issue Category {aiResult && '(auto-detected — editable)'}</label>
                  <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as ComplaintCategory)}>
                    <SelectTrigger className="bg-card border-border">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {getCategoryIcon(cat)} {CATEGORY_LABELS[cat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="section-title mb-2 block">Description {aiResult && '(AI-generated — editable)'}</label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Describe the issue..." className="bg-card border-border min-h-[80px]" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={simulateVoice}
                    className={`flex-1 gap-2 border-border ${isRecording ? 'border-destructive text-destructive animate-pulse' : ''}`}>
                    <Mic className="w-4 h-4" /> {isRecording ? 'Listening...' : 'Voice Report'}
                  </Button>
                </div>
                <div className="glass-card p-3 flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-xs text-muted-foreground">GPS Location Detected</div>
                    <div className="text-sm font-mono">12.9716° N, 77.5946° E</div>
                  </div>
                  <div className="status-dot-active ml-auto" />
                </div>

                <Button onClick={handleSubmit} disabled={(!selectedCategory && !imageUrl) || aiAnalyzing}
                  className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Send className="w-4 h-4" /> Submit Complaint
                </Button>
              </div>
            </motion.div>
          )}

          {view === 'track' && (
            <motion.div key="track" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
              <h2 className="text-xl font-bold">Track Complaint</h2>
              <div className="flex gap-2">
                <Input value={trackingId} onChange={e => setTrackingId(e.target.value)}
                  placeholder="Enter Complaint ID (e.g. CMP-00001)" className="bg-card border-border font-mono" />
                <Button onClick={handleTrack} className="bg-primary text-primary-foreground">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">Or select from your recent complaints:</div>
              <div className="space-y-2">
                {myComplaints.slice(0, 8).map(c => (
                  <button key={c.id} onClick={() => { setSelectedComplaint(c); setView('detail'); }}
                    className="glass-card p-3 w-full text-left flex items-center gap-3 hover:border-primary/30 transition-colors">
                    <span className="text-lg">{getCategoryIcon(c.category)}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{CATEGORY_LABELS[c.category]}</div>
                      <div className="text-xs font-mono text-muted-foreground">{c.id}</div>
                    </div>
                    <div className={`text-xs font-medium ${getStatusColor(c.status)}`}>{statusLabels[c.status]}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'detail' && selectedComplaint && (
            <motion.div key="detail" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{selectedComplaint.id}</h2>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(selectedComplaint.status)} bg-current/10`}>
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

              {/* Status Timeline */}
              <div className="glass-card p-4">
                <div className="section-title mb-4">Progress Timeline</div>
                <div className="relative">
                  {statusSteps.map((step, i) => {
                    const currentIdx = selectedComplaint.status === 'rework_required'
                      ? 2 // rework shows at in_progress level
                      : statusSteps.indexOf(selectedComplaint.status);
                    const isActive = currentIdx >= i;
                    const isCurrent = selectedComplaint.status === step ||
                      (selectedComplaint.status === 'rework_required' && step === 'in_progress');
                    return (
                      <div key={step} className="flex items-start gap-3 mb-4 last:mb-0">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                            ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                            ${isCurrent ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}>
                            {isActive ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                          </div>
                          {i < statusSteps.length - 1 && <div className={`w-0.5 h-6 mt-1 ${isActive ? 'bg-primary' : 'bg-muted'}`} />}
                        </div>
                        <div className="pt-1">
                          <div className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {statusLabels[step]}
                          </div>
                          {isCurrent && selectedComplaint.status === 'rework_required' && step === 'in_progress' && (
                            <div className="text-xs text-destructive flex items-center gap-1 mt-0.5">
                              ⚠️ Rework required – worker is revisiting
                            </div>
                          )}
                          {isCurrent && selectedComplaint.status !== 'rework_required' && (
                            <div className="text-xs text-primary flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" /> Current status
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Verification info */}
              {selectedComplaint.aiVerification && (
                <div className={`glass-card p-4 ${selectedComplaint.aiVerification.issueStillDetected ? 'border-warning/30' : 'border-success/30'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <div className="section-title">AI Verification Result</div>
                  </div>
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
                  className="w-full gap-2 bg-primary text-primary-foreground">
                  <FileText className="w-4 h-4" /> View Full Resolution Report
                </Button>
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

          {view === 'notifications' && (
            <motion.div key="notifications" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              <h2 className="text-xl font-bold">Notifications</h2>
              {citizenNotifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No notifications yet</p>
                  <p className="text-xs mt-1">Submit a complaint to receive updates</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {citizenNotifications.map(n => (
                    <button key={n.id} onClick={() => {
                      markNotificationRead(n.id);
                      const c = complaints.find(x => x.id === n.complaintId);
                      if (c) { setSelectedComplaint(c); setView('detail'); }
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

          {view === 'full-report' && (
            <motion.div key="full-report" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              <h2 className="text-xl font-bold">Full Resolution Report</h2>
              {report ? (
                <div className="space-y-3">
                  <div className="glass-card p-4 border-success/30 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-6 h-6 text-success" />
                      <span className="font-semibold text-success">Issue Resolved & Approved</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">Complaint ID</div>
                        <div className="font-mono font-bold">{report.complaintId}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Category</div>
                        <div className="font-medium capitalize">{report.category.replace('_', ' ')}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Department</div>
                        <div>{report.department}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Assigned Worker</div>
                        <div>{report.assignedWorker}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Submitted</div>
                        <div className="text-xs font-mono">{new Date(report.submittedAt).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Resolved</div>
                        <div className="text-xs font-mono">{new Date(report.resolvedAt).toLocaleString()}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Description</div>
                      <p className="text-sm">{report.description}</p>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Resolution Time</div>
                      <p className="text-sm font-mono">{report.resolutionTime} hours</p>
                    </div>
                    {report.aiVerification && (
                      <div className="bg-muted/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldCheck className="w-4 h-4 text-primary" />
                          <span className="text-xs font-medium text-primary">AI Verification</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{report.aiVerification.verdict}</p>
                        <p className="text-xs text-muted-foreground mt-1">{report.aiVerification.afterAnalysis}</p>
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Admin Review Notes</div>
                      <p className="text-sm text-success">{report.adminNotes}</p>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Repair Proof</div>
                      <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                        📷 Repair photo uploaded by worker
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setView('home')} className="w-full border-border">Back to Home</Button>
                </div>
              ) : (
                <div className="glass-card p-6 text-center">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-warning" />
                  <p className="text-sm font-medium">Report Not Yet Available</p>
                  <p className="text-xs text-muted-foreground mt-1">The admin has not yet reviewed and approved this complaint.</p>
                  <Button variant="outline" onClick={() => setView('home')} className="mt-4 border-border">Back to Home</Button>
                </div>
              )}
            </motion.div>
          )}

          {view === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 space-y-4">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 mx-auto rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-success" />
              </motion.div>
              <h2 className="text-2xl font-bold">Complaint Submitted!</h2>
              <div className="glass-card p-4 inline-block">
                <div className="text-xs text-muted-foreground">Your Complaint ID</div>
                <div className="text-2xl font-mono font-bold text-primary">{newComplaintId}</div>
              </div>
              <p className="text-sm text-muted-foreground">AI has classified your issue. A worker will be auto-assigned shortly!</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setView('home')} className="border-border">Home</Button>
                <Button onClick={() => setView('notifications')} className="bg-primary text-primary-foreground gap-1">
                  <Bell className="w-4 h-4" /> Notifications
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

import { type Complaint, type Worker, type Department, type Project } from './mockData';

// Event system
type Listener = () => void;
const listeners = new Set<Listener>();
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function notify() { listeners.forEach(l => l()); }

// In-memory store — starts empty, populated by user actions + demo seed
let complaints: Complaint[] = [];
let workers: Worker[] = [];
let departments: Department[] = [];
let projects: Project[] = [];
let seeded = false;

// Notifications
export interface Notification {
  id: string;
  type: 'citizen' | 'worker' | 'government_official';
  title: string;
  message: string;
  complaintId: string;
  timestamp: string;
  read: boolean;
}

let notifications: Notification[] = [];

export function getNotifications(type?: Notification['type']): Notification[] {
  return type ? notifications.filter(n => n.type === type) : notifications;
}

export function addNotification(n: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
  notifications.unshift({
    ...n,
    id: `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    read: false,
  });
  notify();
}

export function markNotificationRead(id: string) {
  const n = notifications.find(x => x.id === id);
  if (n) n.read = true;
}

// AI Verification
export interface AIVerificationResult {
  issueStillDetected: boolean;
  confidence: number;
  verdict: string;
  beforeCategory: string;
  afterAnalysis: string;
}

// Review queue
export interface ReviewItem {
  complaintId: string;
  workerRepairImageUrl: string;
  workerNotes: string;
  completedAt: string;
  reviewed: boolean;
  approved?: boolean;
  adminNotes?: string;
  aiVerification?: AIVerificationResult;
}

let reviewQueue: ReviewItem[] = [];

export function getReviewQueue(): ReviewItem[] {
  return reviewQueue.filter(r => !r.reviewed);
}
export function getAllReviews(): ReviewItem[] {
  return reviewQueue;
}

function simulateAIVerification(complaint: Complaint): AIVerificationResult {
  const isFixed = Math.random() > 0.2;
  const confidence = parseFloat((Math.random() * 0.15 + 0.82).toFixed(2));
  const catLabel = complaint.category.replace('_', ' ');
  return isFixed
    ? { issueStillDetected: false, confidence, verdict: `AI: ${catLabel} no longer detected. Repair successful.`, beforeCategory: catLabel, afterAnalysis: `Before: ${catLabel} detected. After: Issue resolved.` }
    : { issueStillDetected: true, confidence, verdict: `AI: ${catLabel} still partially detected. Manual review recommended.`, beforeCategory: catLabel, afterAnalysis: `Before: ${catLabel} detected. After: Residual signs visible.` };
}

export function addReviewItem(item: Omit<ReviewItem, 'reviewed'>) {
  reviewQueue.unshift({ ...item, reviewed: false });
  notify();
}

export function approveReview(complaintId: string, adminNotes: string) {
  const item = reviewQueue.find(r => r.complaintId === complaintId);
  if (item) { item.reviewed = true; item.approved = true; item.adminNotes = adminNotes; }
  const complaint = complaints.find(c => c.id === complaintId);
  if (complaint) {
    complaint.status = 'completed';
    complaint.resolvedAt = new Date().toISOString();
    complaint.resolutionTime = Math.floor((Date.now() - new Date(complaint.createdAt).getTime()) / 3600000);
    addNotification({ type: 'citizen', title: 'Complaint Resolved ✅', message: `Your complaint ${complaintId} has been resolved. Review: ${adminNotes}`, complaintId });
  }
  notify();
}

export function rejectReview(complaintId: string, adminNotes: string) {
  const item = reviewQueue.find(r => r.complaintId === complaintId);
  if (item) { item.reviewed = true; item.approved = false; item.adminNotes = adminNotes; }
  const complaint = complaints.find(c => c.id === complaintId);
  if (complaint) {
    complaint.status = 'rework_required';
    addNotification({ type: 'worker', title: 'Rework Required ⚠️', message: `Repair for ${complaintId} rejected: ${adminNotes}`, complaintId });
    addNotification({ type: 'citizen', title: 'Repair Under Rework', message: `Repair for ${complaintId} is being redone. We apologize for the delay.`, complaintId });
  }
  notify();
}

// Citizen report
export interface CitizenReport {
  complaintId: string; category: string; description: string; submittedAt: string;
  assignedWorker: string; department: string; repairImageUrl: string;
  resolvedAt: string; resolutionTime: number; adminNotes: string;
  aiVerification?: AIVerificationResult; status: 'approved';
}

export function getCitizenReport(complaintId: string): CitizenReport | null {
  const complaint = complaints.find(c => c.id === complaintId);
  const review = reviewQueue.find(r => r.complaintId === complaintId && r.approved);
  if (!complaint || !review) return null;
  return {
    complaintId, category: complaint.category, description: complaint.description,
    submittedAt: complaint.createdAt, assignedWorker: complaint.assignedWorker || 'Unknown',
    department: complaint.department, repairImageUrl: review.workerRepairImageUrl,
    resolvedAt: complaint.resolvedAt || review.completedAt,
    resolutionTime: complaint.resolutionTime || 0,
    adminNotes: review.adminNotes || '', aiVerification: review.aiVerification, status: 'approved',
  };
}

// Seed with demo data for the dashboard to have something
function ensureSeeded() {
  if (seeded) return;
  seeded = true;
  const { generateComplaints, generateWorkers, generateDepartments, generateProjects } = require('./mockData');
  complaints = generateComplaints();
  workers = generateWorkers();
  departments = generateDepartments();
  projects = generateProjects();
}

export function getComplaints(): Complaint[] { ensureSeeded(); return complaints; }
export function getWorkers(): Worker[] { ensureSeeded(); return workers; }
export function getDepartments(): Department[] { ensureSeeded(); return departments; }
export function getProjects(): Project[] { ensureSeeded(); return projects; }

export function addComplaint(complaint: Complaint) {
  ensureSeeded();
  complaints.unshift(complaint);

  // Auto-assign after delay
  setTimeout(() => {
    const available = workers.filter(w => w.status !== 'offline');
    const worker = available[Math.floor(Math.random() * available.length)];
    if (worker) {
      complaint.status = 'assigned';
      complaint.assignedWorker = worker.name;
      complaint.workerId = worker.id;
      complaint.updatedAt = new Date().toISOString();
      worker.activeTasks += 1;
      addNotification({ type: 'worker', title: 'New Task 🔔', message: `${complaint.category.replace('_', ' ')} complaint (${complaint.id}) assigned to you.`, complaintId: complaint.id });
      addNotification({ type: 'citizen', title: 'Worker Assigned', message: `${complaint.id} assigned to ${worker.name} (${complaint.department}).`, complaintId: complaint.id });
    }
    notify();
  }, 1500);

  notify();
}

export function updateComplaintStatus(id: string, status: Complaint['status'], repairImageUrl?: string) {
  const c = complaints.find(c => c.id === id);
  if (!c) return;

  if (status === 'completed') {
    c.status = 'under_review';
    c.updatedAt = new Date().toISOString();
    const aiResult = simulateAIVerification(c);
    c.aiVerification = { issueStillDetected: aiResult.issueStillDetected, confidence: aiResult.confidence, verdict: aiResult.verdict };
    addReviewItem({ complaintId: id, workerRepairImageUrl: repairImageUrl || '/placeholder.svg', workerNotes: 'Issue fixed. Repair photo uploaded.', completedAt: new Date().toISOString(), aiVerification: aiResult });
    addNotification({ type: 'government_official', title: aiResult.issueStillDetected ? 'Review ⚠️ AI Flagged' : 'Review Required 📋', message: `Worker completed ${id}. ${aiResult.verdict}`, complaintId: id });
    addNotification({ type: 'citizen', title: 'Under Review', message: `Repair for ${id} completed. AI verification in progress.`, complaintId: id });
  } else {
    c.status = status;
    c.updatedAt = new Date().toISOString();
    if (status === 'in_progress') {
      addNotification({ type: 'citizen', title: 'Work Started 🔧', message: `Worker started on ${id}.`, complaintId: id });
    }
  }
  notify();
}

// AI Copilot
export function askAICopilot(question: string): string {
  const q = question.toLowerCase();
  const all = getComplaints();
  const depts = getDepartments();
  const allW = getWorkers();

  if (q.includes('ward') && (q.includes('most') || q.includes('highest'))) {
    const counts: Record<string, number> = {};
    all.forEach(c => { counts[c.ward] = (counts[c.ward] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return `📊 **${top[0]}** leads with **${top[1]}** complaints. Recommend increasing patrols there.`;
  }
  if (q.includes('slow') || (q.includes('department') && q.includes('resolv'))) {
    const slowest = [...depts].sort((a, b) => b.avgResolutionTime - a.avgResolutionTime)[0];
    return `🐢 **${slowest.name}** is slowest at **${slowest.avgResolutionTime}h** avg resolution. Trust score: ${slowest.trustScore}/100.`;
  }
  if (q.includes('pending') || q.includes('unresolved')) {
    const pending = all.filter(c => c.status !== 'completed').length;
    const critical = all.filter(c => c.priority === 'critical' && c.status !== 'completed').length;
    return `📋 **${pending}** pending complaints, **${critical}** critical. Immediate action recommended.`;
  }
  if (q.includes('worker') || q.includes('productive') || q.includes('best')) {
    const best = [...allW].sort((a, b) => b.completedTasks - a.completedTasks)[0];
    return `👷 **${best.name}** leads with **${best.completedTasks}** tasks, ${best.rating}/5 rating.`;
  }
  if (q.includes('trust') || q.includes('score')) {
    const best = [...depts].sort((a, b) => b.trustScore - a.trustScore)[0];
    const worst = [...depts].sort((a, b) => a.trustScore - b.trustScore)[0];
    return `🛡️ Highest trust: **${best.name}** (${best.trustScore}/100). Lowest: **${worst.name}** (${worst.trustScore}/100).`;
  }
  if (q.includes('hotspot') || q.includes('predict') || q.includes('future')) {
    return `🔮 Predicted hotspots:\n• **MG Road (Ward 3)** – 87% pothole risk\n• **Jayanagar (Ward 5)** – 74% garbage overflow\n• **Whitefield (Ward 7)** – 69% water leaks\n\nDeploy preventive teams within 48h.`;
  }
  if (q.includes('today') || q.includes('summary')) {
    const today = new Date().toDateString();
    const todayCount = all.filter(c => new Date(c.createdAt).toDateString() === today).length || 8;
    return `📅 Today: **${todayCount}** new complaints, **${Math.floor(todayCount * 0.6)}** resolved, **${allW.filter(w => w.status !== 'offline').length}** active workers.`;
  }
  const resolved = all.filter(c => c.status === 'completed').length;
  return `🤖 System: **${all.length}** total complaints, **${((resolved / all.length) * 100).toFixed(1)}%** resolved, **${depts.length}** departments active.\n\nAsk about wards, departments, workers, or predictions.`;
}

export function useStoreData() {}

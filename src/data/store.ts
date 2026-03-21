import { generateComplaints, generateWorkers, generateDepartments, generateProjects, type Complaint, type Worker, type Department, type Project } from './mockData';

// Event system for reactive updates
type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach(l => l());
}

// Singleton store
let complaints: Complaint[] | null = null;
let workers: Worker[] | null = null;
let departments: Department[] | null = null;
let projects: Project[] | null = null;

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

// AI Verification result
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

// Simulate AI verification comparing before/after images
function simulateAIVerification(complaint: Complaint): AIVerificationResult {
  // 80% chance AI says issue is fixed
  const isFixed = Math.random() > 0.2;
  const confidence = parseFloat((Math.random() * 0.15 + 0.82).toFixed(2));
  const categoryLabel = complaint.category.replace('_', ' ');

  if (isFixed) {
    return {
      issueStillDetected: false,
      confidence,
      verdict: `AI analysis complete: ${categoryLabel} no longer detected in the completion image. Repair appears successful.`,
      beforeCategory: categoryLabel,
      afterAnalysis: `Before: ${categoryLabel} detected (${(complaint.aiConfidence || 0.9 * 100).toFixed(0)}% confidence). After: Issue not detected. Surface/area appears repaired.`,
    };
  } else {
    return {
      issueStillDetected: true,
      confidence,
      verdict: `AI analysis complete: ${categoryLabel} still partially detected in completion image. Repair may be incomplete.`,
      beforeCategory: categoryLabel,
      afterAnalysis: `Before: ${categoryLabel} detected. After: Residual signs of ${categoryLabel} still visible (${(confidence * 100).toFixed(0)}% confidence). Manual review recommended.`,
    };
  }
}

export function addReviewItem(item: Omit<ReviewItem, 'reviewed'>) {
  reviewQueue.unshift({ ...item, reviewed: false });
  notify();
}

export function approveReview(complaintId: string, adminNotes: string) {
  const item = reviewQueue.find(r => r.complaintId === complaintId);
  if (item) {
    item.reviewed = true;
    item.approved = true;
    item.adminNotes = adminNotes;
  }
  const complaint = getComplaints().find(c => c.id === complaintId);
  if (complaint) {
    complaint.status = 'completed';
    complaint.resolvedAt = new Date().toISOString();
    complaint.resolutionTime = Math.floor((Date.now() - new Date(complaint.createdAt).getTime()) / 3600000);
    addNotification({
      type: 'citizen',
      title: 'Complaint Resolved! ✅',
      message: `Your complaint ${complaintId} (${complaint.category}) has been reviewed and approved. Resolution: ${adminNotes}. Thank you for your report!`,
      complaintId,
    });
  }
  notify();
}

export function rejectReview(complaintId: string, adminNotes: string) {
  const item = reviewQueue.find(r => r.complaintId === complaintId);
  if (item) {
    item.reviewed = true;
    item.approved = false;
    item.adminNotes = adminNotes;
  }
  const complaint = getComplaints().find(c => c.id === complaintId);
  if (complaint) {
    complaint.status = 'rework_required';
    addNotification({
      type: 'worker',
      title: 'Rework Required ⚠️',
      message: `Government Official rejected repair for ${complaintId}. Reason: ${adminNotes}. Please revisit and fix the issue.`,
      complaintId,
    });
    addNotification({
      type: 'citizen',
      title: 'Repair Under Rework',
      message: `The repair for ${complaintId} was not satisfactory. The worker has been asked to redo the repair. We apologize for the delay.`,
      complaintId,
    });
  }
  notify();
}

// Citizen report
export interface CitizenReport {
  complaintId: string;
  category: string;
  description: string;
  submittedAt: string;
  assignedWorker: string;
  department: string;
  repairImageUrl: string;
  resolvedAt: string;
  resolutionTime: number;
  adminNotes: string;
  aiVerification?: AIVerificationResult;
  status: 'approved';
}

export function getCitizenReport(complaintId: string): CitizenReport | null {
  const complaint = getComplaints().find(c => c.id === complaintId);
  const review = reviewQueue.find(r => r.complaintId === complaintId && r.approved);
  if (!complaint || !review) return null;
  return {
    complaintId,
    category: complaint.category,
    description: complaint.description,
    submittedAt: complaint.createdAt,
    assignedWorker: complaint.assignedWorker || 'Unknown',
    department: complaint.department,
    repairImageUrl: review.workerRepairImageUrl,
    resolvedAt: complaint.resolvedAt || review.completedAt,
    resolutionTime: complaint.resolutionTime || 0,
    adminNotes: review.adminNotes || '',
    aiVerification: review.aiVerification,
    status: 'approved',
  };
}

export function getComplaints(): Complaint[] {
  if (!complaints) complaints = generateComplaints();
  return complaints;
}

export function getWorkers(): Worker[] {
  if (!workers) workers = generateWorkers();
  return workers;
}

export function getDepartments(): Department[] {
  if (!departments) departments = generateDepartments();
  return departments;
}

export function getProjects(): Project[] {
  if (!projects) projects = generateProjects();
  return projects;
}

export function addComplaint(complaint: Complaint) {
  getComplaints().unshift(complaint);

  setTimeout(() => {
    const availableWorkers = getWorkers().filter(w => w.status !== 'offline');
    const worker = availableWorkers[Math.floor(Math.random() * availableWorkers.length)];
    if (worker) {
      complaint.status = 'assigned';
      complaint.assignedWorker = worker.name;
      complaint.workerId = worker.id;
      complaint.updatedAt = new Date().toISOString();
      worker.activeTasks += 1;

      addNotification({
        type: 'worker',
        title: 'New Task Assigned 🔔',
        message: `New ${complaint.category.replace('_', ' ')} complaint (${complaint.id}) assigned to you at ${complaint.ward}.`,
        complaintId: complaint.id,
      });

      addNotification({
        type: 'citizen',
        title: 'Complaint Assigned',
        message: `Your complaint ${complaint.id} has been assigned to ${worker.name} from ${complaint.department}.`,
        complaintId: complaint.id,
      });
    }
    notify();
  }, 1500);

  notify();
}

export function updateComplaintStatus(id: string, status: Complaint['status'], repairImageUrl?: string) {
  const c = getComplaints().find(c => c.id === id);
  if (c) {
    if (status === 'completed') {
      // Worker submits completion → AI verifies → goes to under_review
      c.status = 'under_review';
      c.updatedAt = new Date().toISOString();

      // Run AI verification
      const aiResult = simulateAIVerification(c);
      c.aiVerification = {
        issueStillDetected: aiResult.issueStillDetected,
        confidence: aiResult.confidence,
        verdict: aiResult.verdict,
      };

      // Add to review queue with AI result
      addReviewItem({
        complaintId: id,
        workerRepairImageUrl: repairImageUrl || '/placeholder.svg',
        workerNotes: 'Issue has been fixed on site. Repair photo uploaded.',
        completedAt: new Date().toISOString(),
        aiVerification: aiResult,
      });

      addNotification({
        type: 'government_official',
        title: aiResult.issueStillDetected ? 'Review Required ⚠️ AI Flagged' : 'Review Required 📋',
        message: aiResult.issueStillDetected
          ? `Worker completed ${id} but AI detected issue may persist. ${aiResult.verdict}`
          : `Worker completed repair for ${id}. AI confirms repair looks successful. Please review and approve.`,
        complaintId: id,
      });

      addNotification({
        type: 'citizen',
        title: 'Repair Completed - Under Review',
        message: `The worker has completed the repair for ${id}. AI verification and official review in progress. You'll receive a full report once approved.`,
        complaintId: id,
      });
    } else {
      c.status = status;
      c.updatedAt = new Date().toISOString();

      if (status === 'in_progress') {
        addNotification({
          type: 'citizen',
          title: 'Work Started 🔧',
          message: `Worker has started working on your complaint ${id}.`,
          complaintId: id,
        });
      }
    }
    notify();
  }
}

// AI Governance Copilot - simulated responses
export function askAICopilot(question: string): string {
  const q = question.toLowerCase();
  const allComplaints = getComplaints();
  const depts = getDepartments();
  const allWorkers = getWorkers();

  // Ward with most complaints
  if (q.includes('ward') && (q.includes('most') || q.includes('highest'))) {
    const wardCounts: Record<string, number> = {};
    allComplaints.forEach(c => { wardCounts[c.ward] = (wardCounts[c.ward] || 0) + 1; });
    const topWard = Object.entries(wardCounts).sort((a, b) => b[1] - a[1])[0];
    return `📊 **${topWard[0]}** has the most complaints with **${topWard[1]}** total issues reported. Top categories include potholes and garbage accumulation. I recommend increasing patrol frequency and scheduling preventive maintenance in this ward.`;
  }

  // Slowest department
  if (q.includes('slow') || q.includes('department') && q.includes('resolv')) {
    const slowest = [...depts].sort((a, b) => b.avgResolutionTime - a.avgResolutionTime)[0];
    return `🐢 **${slowest.name}** is the slowest department with an average resolution time of **${slowest.avgResolutionTime} hours**. Their trust score is ${slowest.trustScore}/100. Recommendation: Allocate additional workers and review internal processes for efficiency gains.`;
  }

  // Pending complaints
  if (q.includes('pending') || q.includes('unresolved')) {
    const pending = allComplaints.filter(c => !['completed'].includes(c.status)).length;
    const critical = allComplaints.filter(c => c.priority === 'critical' && c.status !== 'completed').length;
    return `📋 There are **${pending}** pending complaints, of which **${critical}** are marked as critical priority. Most pending issues are in the pothole and garbage categories. Immediate attention is recommended for critical items.`;
  }

  // Worker productivity
  if (q.includes('worker') || q.includes('productive') || q.includes('best worker')) {
    const bestWorker = [...allWorkers].sort((a, b) => b.completedTasks - a.completedTasks)[0];
    return `👷 **${bestWorker.name}** is the most productive worker with **${bestWorker.completedTasks}** completed tasks and a ${bestWorker.rating}/5 rating. They work in the ${bestWorker.department} department. Consider recognizing their performance and using their workflow as a benchmark.`;
  }

  // Trust score
  if (q.includes('trust') || q.includes('score')) {
    const best = [...depts].sort((a, b) => b.trustScore - a.trustScore)[0];
    const worst = [...depts].sort((a, b) => a.trustScore - b.trustScore)[0];
    return `🛡️ **${best.name}** has the highest trust score at **${best.trustScore}/100**, while **${worst.name}** has the lowest at **${worst.trustScore}/100**. Trust scores are calculated based on resolution time, citizen feedback, and pending complaint ratio.`;
  }

  // Hotspots
  if (q.includes('hotspot') || q.includes('predict') || q.includes('future')) {
    return `🔮 AI Predictive Analysis identifies these hotspot areas:\n\n• **MG Road (Ward 3)** – 87% risk for potholes (rising trend)\n• **Jayanagar (Ward 5)** – 74% risk for garbage overflow\n• **Whitefield (Ward 7)** – 69% risk for water leaks\n\nRecommendation: Deploy preventive maintenance teams to these areas within the next 48 hours.`;
  }

  // Today's summary
  if (q.includes('today') || q.includes('summary') || q.includes('overview')) {
    const today = new Date().toDateString();
    const todayComplaints = allComplaints.filter(c => new Date(c.createdAt).toDateString() === today).length;
    return `📅 **Today's Summary:**\n\n• New complaints: **${todayComplaints || 12}**\n• Resolved today: **${Math.floor(todayComplaints * 0.6) || 7}**\n• Active workers: **${allWorkers.filter(w => w.status !== 'offline').length}**\n• Average response time: **2.3 hours**\n\nOverall system health: Good. No critical escalations pending.`;
  }

  return `🤖 Based on the current data:\n\n• Total complaints in system: **${allComplaints.length}**\n• Resolution rate: **${((allComplaints.filter(c => c.status === 'completed').length / allComplaints.length) * 100).toFixed(1)}%**\n• Active departments: **${depts.length}**\n\nTry asking about specific wards, departments, workers, or predictions for more detailed insights.`;
}

export function useStoreData() {}

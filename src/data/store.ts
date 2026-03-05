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

// Singleton store for consistent data across views
let complaints: Complaint[] | null = null;
let workers: Worker[] | null = null;
let departments: Department[] | null = null;
let projects: Project[] | null = null;

// Notifications for real-time updates
export interface Notification {
  id: string;
  type: 'citizen' | 'worker' | 'admin';
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

// Pending review queue for command center
export interface ReviewItem {
  complaintId: string;
  workerRepairImageUrl: string;
  workerNotes: string;
  completedAt: string;
  reviewed: boolean;
  approved?: boolean;
  adminNotes?: string;
}

let reviewQueue: ReviewItem[] = [];

export function getReviewQueue(): ReviewItem[] {
  return reviewQueue.filter(r => !r.reviewed);
}

export function getAllReviews(): ReviewItem[] {
  return reviewQueue;
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
    // Notify citizen with full report
    addNotification({
      type: 'citizen',
      title: 'Complaint Resolved! ✅',
      message: `Your complaint ${complaintId} (${complaint.category}) has been reviewed and approved by the admin. Resolution: ${adminNotes}. Worker repair verified. Thank you for your report!`,
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
    complaint.status = 'in_progress';
    // Notify worker to redo
    addNotification({
      type: 'worker',
      title: 'Task Rejected - Redo Required',
      message: `Admin rejected repair for ${complaintId}. Reason: ${adminNotes}. Please revisit and fix the issue.`,
      complaintId,
    });
  }
  notify();
}

// Citizen report data
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

  // Auto-assign to a worker after a short delay (simulate real-time)
  setTimeout(() => {
    const availableWorkers = getWorkers().filter(w => w.status !== 'offline');
    const worker = availableWorkers[Math.floor(Math.random() * availableWorkers.length)];
    if (worker) {
      complaint.status = 'assigned';
      complaint.assignedWorker = worker.name;
      complaint.workerId = worker.id;
      complaint.updatedAt = new Date().toISOString();
      worker.activeTasks += 1;

      // Notify worker
      addNotification({
        type: 'worker',
        title: 'New Task Assigned 🔔',
        message: `New ${complaint.category} complaint (${complaint.id}) assigned to you at ${complaint.ward}.`,
        complaintId: complaint.id,
      });

      // Notify citizen
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
      // Worker marks as completed → goes to review queue, status becomes "under_review" (we use in_progress still but add to review)
      c.status = 'completed';
      c.updatedAt = new Date().toISOString();
      c.resolvedAt = new Date().toISOString();
      c.resolutionTime = Math.floor((Date.now() - new Date(c.createdAt).getTime()) / 3600000);

      // Add to command center review queue
      addReviewItem({
        complaintId: id,
        workerRepairImageUrl: repairImageUrl || '/placeholder.svg',
        workerNotes: 'Issue has been fixed on site. Repair photo uploaded.',
        completedAt: new Date().toISOString(),
      });

      // Notify admin
      addNotification({
        type: 'admin',
        title: 'Review Required 📋',
        message: `Worker completed repair for ${id} (${c.category}). Repair photo uploaded. Please review and approve.`,
        complaintId: id,
      });

      // Notify citizen
      addNotification({
        type: 'citizen',
        title: 'Repair Completed - Under Review',
        message: `The worker has completed the repair for ${id}. It is now under admin review. You will receive a full report once approved.`,
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

// Hook for reactive store
export function useStoreData() {
  // This is called inside a React component with useSyncExternalStore
}

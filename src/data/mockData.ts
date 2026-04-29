// Mock data generator for JanMitra AI Smart City Platform

export type ComplaintCategory = 'pothole' | 'garbage' | 'streetlight' | 'water_leakage' | 'drainage' | 'road_damage' | 'sewage_overflow';
export type ComplaintStatus = 'submitted' | 'assigned' | 'in_progress' | 'under_review' | 'rework_required' | 'completed';
export type UserRole = 'citizen' | 'worker' | 'admin';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Sentiment = 'positive' | 'neutral' | 'negative';

export interface Complaint {
  id: string;
  userId: string;
  citizenName: string;
  category: ComplaintCategory;
  description: string;
  imageUrl: string;
  lat: number;
  lng: number;
  ward: string;
  status: ComplaintStatus;
  priority: Priority;
  department: string;
  assignedWorker?: string;
  workerId?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolutionTime?: number;
  citizenRating?: number;
  sentiment?: Sentiment;
  aiConfidence?: number;
  aiDetectedCategory?: ComplaintCategory;
  aiVerification?: {
    issueStillDetected: boolean;
    confidence: number;
    verdict: string;
  };
}

export interface Worker {
  id: string;
  name: string;
  department: string;
  phone: string;
  activeTasks: number;
  completedTasks: number;
  rating: number;
  lat: number;
  lng: number;
  status: 'available' | 'busy' | 'offline';
}

export interface Department {
  id: string;
  name: string;
  trustScore: number;
  totalComplaints: number;
  resolved: number;
  pending: number;
  avgResolutionTime: number;
  head: string;
}

export interface Project {
  id: string;
  name: string;
  department: string;
  lat: number;
  lng: number;
  status: 'planned' | 'in_progress' | 'completed';
  budget: number;
  progress: number;
}

const categoryLabels: Record<ComplaintCategory, string> = {
  pothole: 'Pothole',
  garbage: 'Garbage Accumulation',
  streetlight: 'Broken Streetlight',
  water_leakage: 'Water Leakage',
  drainage: 'Drainage Blockage',
  road_damage: 'Road Damage',
  sewage_overflow: 'Sewage Overflow',
};

const categoryDepartments: Record<ComplaintCategory, string> = {
  pothole: 'Roads & Infrastructure',
  garbage: 'Sanitation',
  streetlight: 'Electricity',
  water_leakage: 'Water Supply',
  drainage: 'Drainage',
  road_damage: 'Roads & Infrastructure',
  sewage_overflow: 'Sanitation',
};

const categories: ComplaintCategory[] = ['pothole', 'garbage', 'streetlight', 'water_leakage', 'drainage', 'road_damage', 'sewage_overflow'];
const statuses: ComplaintStatus[] = ['submitted', 'assigned', 'in_progress', 'under_review', 'completed'];
const priorities: Priority[] = ['low', 'medium', 'high', 'critical'];
const sentiments: Sentiment[] = ['positive', 'neutral', 'negative'];
const wards = ['Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5', 'Ward 6', 'Ward 7', 'Ward 8'];

const names = ['Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sunita Devi', 'Vikram Singh', 'Meera Nair', 'Arjun Reddy', 'Kavitha Iyer', 'Sanjay Gupta', 'Deepa Menon', 'Rahul Verma', 'Anita Roy', 'Manoj Tiwari', 'Lakshmi Pillai', 'Suresh Babu'];
const workerNames = ['Ramesh K', 'Sunil P', 'Gopal M', 'Ravi S', 'Vinod T', 'Mohan R', 'Ashok B', 'Krishna V', 'Ganesh N', 'Prasad L'];

const descriptions: Record<ComplaintCategory, string[]> = {
  pothole: ['Large pothole on main road causing accidents', 'Deep pothole near school zone', 'Multiple potholes on highway stretch', 'Pothole filled with water blocking traffic'],
  garbage: ['Garbage overflowing from community bin', 'Waste not collected for 3 days', 'Illegal dumping near residential area', 'Garbage blocking drainage system'],
  streetlight: ['Streetlight not working for a week', 'Broken streetlight near park', 'Flickering light causing visibility issues', 'Multiple lights out on main street'],
  water_leakage: ['Pipeline burst flooding the road', 'Water leaking from main supply line', 'Continuous water leak near junction', 'Underground pipe leaking for days'],
  drainage: ['Drain overflowing during rain', 'Blocked drain causing waterlogging', 'Open drain cover missing', 'Sewage overflow on residential street'],
  road_damage: ['Road surface damaged by heavy trucks', 'Cracks on newly built road', 'Road cave-in near intersection', 'Damaged road divider causing accidents'],
  sewage_overflow: ['Sewage overflowing onto main road', 'Manhole cover broken with sewage leaking', 'Sewage water entering residential colony', 'Open sewage line near school'],
};

const CENTER_LAT = 12.9716;
const CENTER_LNG = 77.5946;

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateId(prefix: string, index: number): string {
  return `${prefix}-${String(index).padStart(5, '0')}`;
}

function generateDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return d.toISOString();
}

export function generateComplaints(): Complaint[] {
  const complaints: Complaint[] = [];
  for (let i = 1; i <= 500; i++) {
    const category = randomItem(categories);
    const status = randomItem(statuses);
    const daysAgo = Math.floor(randomInRange(0, 90));
    const createdAt = generateDate(daysAgo);
    const resolvedAt = status === 'completed' ? generateDate(Math.max(0, daysAgo - Math.floor(randomInRange(1, 10)))) : undefined;
    const resolutionTime = resolvedAt ? Math.floor(randomInRange(2, 168)) : undefined;

    complaints.push({
      id: generateId('CMP', i),
      userId: generateId('USR', Math.floor(randomInRange(1, 200))),
      citizenName: randomItem(names),
      category,
      description: randomItem(descriptions[category]),
      imageUrl: `/placeholder.svg`,
      lat: CENTER_LAT + randomInRange(-0.08, 0.08),
      lng: CENTER_LNG + randomInRange(-0.08, 0.08),
      ward: randomItem(wards),
      status,
      priority: randomItem(priorities),
      department: categoryDepartments[category],
      assignedWorker: status !== 'submitted' ? randomItem(workerNames) : undefined,
      workerId: status !== 'submitted' ? generateId('WRK', Math.floor(randomInRange(1, 10))) : undefined,
      createdAt,
      updatedAt: createdAt,
      resolvedAt,
      resolutionTime,
      citizenRating: status === 'completed' ? Math.floor(randomInRange(1, 6)) : undefined,
      sentiment: status === 'completed' ? randomItem(sentiments) : undefined,
      aiConfidence: randomInRange(0.7, 0.99),
      aiDetectedCategory: Math.random() > 0.1 ? category : randomItem(categories),
    });
  }
  return complaints;
}

export function generateWorkers(): Worker[] {
  return workerNames.map((name, i) => ({
    id: generateId('WRK', i + 1),
    name,
    department: randomItem(Object.values(categoryDepartments)),
    phone: `+91 ${Math.floor(randomInRange(7000000000, 9999999999))}`,
    activeTasks: Math.floor(randomInRange(0, 8)),
    completedTasks: Math.floor(randomInRange(20, 150)),
    rating: parseFloat(randomInRange(3.5, 5).toFixed(1)),
    lat: CENTER_LAT + randomInRange(-0.05, 0.05),
    lng: CENTER_LNG + randomInRange(-0.05, 0.05),
    status: randomItem(['available', 'busy', 'offline'] as const),
  }));
}

export function generateDepartments(): Department[] {
  const depts = ['Roads & Infrastructure', 'Sanitation', 'Electricity', 'Water Supply', 'Drainage'];
  return depts.map((name, i) => ({
    id: generateId('DEPT', i + 1),
    name,
    trustScore: parseFloat(randomInRange(55, 95).toFixed(1)),
    totalComplaints: Math.floor(randomInRange(50, 200)),
    resolved: Math.floor(randomInRange(30, 150)),
    pending: Math.floor(randomInRange(5, 50)),
    avgResolutionTime: parseFloat(randomInRange(12, 72).toFixed(1)),
    head: randomItem(names),
  }));
}

export function generateProjects(): Project[] {
  const projectNames = [
    'Highway Expansion Phase II', 'Smart Street Lighting', 'Underground Drainage System',
    'Water Pipeline Renewal', 'Waste Processing Plant', 'Road Resurfacing Drive',
    'Solar Power Grid', 'Flood Prevention System',
  ];
  return projectNames.map((name, i) => ({
    id: generateId('PRJ', i + 1),
    name,
    department: randomItem(Object.values(categoryDepartments)),
    lat: CENTER_LAT + randomInRange(-0.06, 0.06),
    lng: CENTER_LNG + randomInRange(-0.06, 0.06),
    status: randomItem(['planned', 'in_progress', 'completed'] as const),
    budget: Math.floor(randomInRange(500000, 50000000)),
    progress: Math.floor(randomInRange(0, 100)),
  }));
}

export const CATEGORY_LABELS = categoryLabels;
export const CATEGORY_DEPARTMENTS = categoryDepartments;
export const CATEGORIES = categories;
export const WARDS = wards;

export function getCategoryIcon(cat: ComplaintCategory): string {
  const icons: Record<ComplaintCategory, string> = {
    pothole: '🕳️',
    garbage: '🗑️',
    streetlight: '💡',
    water_leakage: '💧',
    drainage: '🚰',
    road_damage: '🚧',
    sewage_overflow: '🚽',
  };
  return icons[cat];
}

export function getStatusColor(status: ComplaintStatus): string {
  const colors: Record<ComplaintStatus, string> = {
    submitted: 'text-muted-foreground',
    assigned: 'text-warning',
    in_progress: 'text-primary',
    under_review: 'text-accent',
    rework_required: 'text-destructive',
    completed: 'text-success',
  };
  return colors[status];
}

export function getPriorityColor(priority: Priority): string {
  const colors: Record<Priority, string> = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-primary/20 text-primary',
    high: 'bg-warning/20 text-warning',
    critical: 'bg-destructive/20 text-destructive',
  };
  return colors[priority];
}

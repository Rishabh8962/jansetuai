// Authentication store — localStorage-based with fresh data on each session

export type UserRole = 'citizen' | 'worker' | 'government_official';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar: string;
  joinedAt: string;
  complaintsSubmitted?: number;
  complaintsResolved?: number;
  tasksCompleted?: number;
  tasksAssigned?: number;
  avgRating?: number;
  avgResolutionHours?: number;
  reviewsApproved?: number;
  reviewsRejected?: number;
  department?: string;
}

const STORAGE_KEY = 'jansetu_auth_user';
const REG_KEY = 'jansetu_registered_users';

type AuthListener = () => void;
const authListeners = new Set<AuthListener>();
function notifyAuth() { authListeners.forEach(l => l()); }

export function subscribeAuth(listener: AuthListener): () => void {
  authListeners.add(listener);
  return () => authListeners.delete(listener);
}

export function getCurrentUser(): AppUser | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

// Demo accounts — seeded fresh (no old data carried over)
const DEMO_USERS: AppUser[] = [
  { id: 'CIT-001', name: 'Rajesh Kumar', email: 'rajesh@mail.com', phone: '+91 9876543210', role: 'citizen', avatar: 'RK', joinedAt: '2025-06-15', complaintsSubmitted: 0, complaintsResolved: 0 },
  { id: 'CIT-002', name: 'Priya Sharma', email: 'priya@mail.com', phone: '+91 9876543211', role: 'citizen', avatar: 'PS', joinedAt: '2025-08-01', complaintsSubmitted: 0, complaintsResolved: 0 },
  { id: 'WRK-001', name: 'Ramesh K', email: 'ramesh.w@gov.in', phone: '+91 8765432100', role: 'worker', avatar: 'RK', joinedAt: '2024-01-10', tasksCompleted: 0, tasksAssigned: 0, avgRating: 0, avgResolutionHours: 0, department: 'Roads & Infrastructure' },
  { id: 'WRK-002', name: 'Sunil P', email: 'sunil.w@gov.in', phone: '+91 8765432101', role: 'worker', avatar: 'SP', joinedAt: '2024-03-22', tasksCompleted: 0, tasksAssigned: 0, avgRating: 0, avgResolutionHours: 0, department: 'Sanitation' },
  { id: 'GOV-001', name: 'Dr. Anand Rao', email: 'anand.rao@gov.in', phone: '+91 7654321000', role: 'government_official', avatar: 'AR', joinedAt: '2023-04-01', reviewsApproved: 0, reviewsRejected: 0, department: 'Municipal Commissioner' },
  { id: 'GOV-002', name: 'Smt. Kavitha Iyer', email: 'kavitha.iyer@gov.in', phone: '+91 7654321001', role: 'government_official', avatar: 'KI', joinedAt: '2023-06-15', reviewsApproved: 0, reviewsRejected: 0, department: 'Deputy Commissioner' },
];

export function login(email: string, _password: string): { success: boolean; user?: AppUser; error?: string } {
  const user = DEMO_USERS.find(u => u.email === email);
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    notifyAuth();
    return { success: true, user };
  }
  const registered = getRegisteredUsers();
  const regUser = registered.find(u => u.email === email);
  if (regUser) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(regUser));
    notifyAuth();
    return { success: true, user: regUser };
  }
  return { success: false, error: 'Invalid credentials. Try a demo account or sign up.' };
}

export function signup(name: string, email: string, phone: string, role: UserRole, _password: string): { success: boolean; user?: AppUser; error?: string } {
  const all = [...DEMO_USERS, ...getRegisteredUsers()];
  if (all.find(u => u.email === email)) {
    return { success: false, error: 'An account with this email already exists.' };
  }
  const prefix = role === 'citizen' ? 'CIT' : role === 'worker' ? 'WRK' : 'GOV';
  const user: AppUser = {
    id: `${prefix}-${Date.now().toString(36).toUpperCase()}`,
    name, email, phone, role,
    avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
    joinedAt: new Date().toISOString().split('T')[0],
    ...(role === 'citizen' ? { complaintsSubmitted: 0, complaintsResolved: 0 } : {}),
    ...(role === 'worker' ? { tasksCompleted: 0, tasksAssigned: 0, avgRating: 0, avgResolutionHours: 0, department: 'General' } : {}),
    ...(role === 'government_official' ? { reviewsApproved: 0, reviewsRejected: 0, department: 'Administration' } : {}),
  };
  const registered = getRegisteredUsers();
  registered.push(user);
  localStorage.setItem(REG_KEY, JSON.stringify(registered));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  notifyAuth();
  return { success: true, user };
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
  notifyAuth();
}

export function updateUserStats(userId: string, updates: Partial<AppUser>) {
  const user = getCurrentUser();
  if (user && user.id === userId) {
    const updated = { ...user, ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyAuth();
  }
}

function getRegisteredUsers(): AppUser[] {
  try {
    const stored = localStorage.getItem(REG_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

export function getDemoCredentials() {
  return [
    { role: 'Citizen', email: 'rajesh@mail.com', password: 'demo123' },
    { role: 'Field Worker', email: 'ramesh.w@gov.in', password: 'demo123' },
    { role: 'Government Official', email: 'anand.rao@gov.in', password: 'demo123' },
  ];
}

export const ROLE_LABELS: Record<UserRole, string> = {
  citizen: 'Citizen',
  worker: 'Field Worker',
  government_official: 'Government Official',
};

export const ROLE_PATHS: Record<UserRole, string> = {
  citizen: '/citizen',
  worker: '/worker',
  government_official: '/dashboard',
};

// Clear all old data on app init
export function clearAllSavedData() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(REG_KEY);
  localStorage.removeItem('jansetu_data_version');
}

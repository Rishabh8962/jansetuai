// Simulated authentication store (localStorage-based)

export type UserRole = 'citizen' | 'worker' | 'government_official';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar: string;
  joinedAt: string;
  // Role-specific stats
  complaintsSubmitted?: number;
  complaintsResolved?: number;
  tasksCompleted?: number;
  tasksAssigned?: number;
  avgRating?: number;
  reviewsApproved?: number;
  reviewsRejected?: number;
  department?: string;
}

// Dummy users for each role
const DUMMY_USERS: AppUser[] = [
  // Citizens
  { id: 'CIT-001', name: 'Rajesh Kumar', email: 'rajesh@mail.com', phone: '+91 9876543210', role: 'citizen', avatar: 'RK', joinedAt: '2024-06-15', complaintsSubmitted: 12, complaintsResolved: 8 },
  { id: 'CIT-002', name: 'Priya Sharma', email: 'priya@mail.com', phone: '+91 9876543211', role: 'citizen', avatar: 'PS', joinedAt: '2024-08-01', complaintsSubmitted: 5, complaintsResolved: 3 },
  { id: 'CIT-003', name: 'Amit Patel', email: 'amit@mail.com', phone: '+91 9876543212', role: 'citizen', avatar: 'AP', joinedAt: '2024-09-10', complaintsSubmitted: 18, complaintsResolved: 14 },
  // Workers
  { id: 'WRK-001', name: 'Ramesh K', email: 'ramesh.w@gov.in', phone: '+91 8765432100', role: 'worker', avatar: 'RK', joinedAt: '2023-01-10', tasksCompleted: 145, tasksAssigned: 12, avgRating: 4.6, department: 'Roads & Infrastructure' },
  { id: 'WRK-002', name: 'Sunil P', email: 'sunil.w@gov.in', phone: '+91 8765432101', role: 'worker', avatar: 'SP', joinedAt: '2023-03-22', tasksCompleted: 98, tasksAssigned: 8, avgRating: 4.2, department: 'Sanitation' },
  { id: 'WRK-003', name: 'Gopal M', email: 'gopal.w@gov.in', phone: '+91 8765432102', role: 'worker', avatar: 'GM', joinedAt: '2023-05-05', tasksCompleted: 67, tasksAssigned: 5, avgRating: 4.8, department: 'Electricity' },
  // Government Officials
  { id: 'GOV-001', name: 'Dr. Anand Rao', email: 'anand.rao@gov.in', phone: '+91 7654321000', role: 'government_official', avatar: 'AR', joinedAt: '2022-04-01', reviewsApproved: 234, reviewsRejected: 18, department: 'Municipal Commissioner' },
  { id: 'GOV-002', name: 'Smt. Kavitha Iyer', email: 'kavitha.iyer@gov.in', phone: '+91 7654321001', role: 'government_official', avatar: 'KI', joinedAt: '2022-06-15', reviewsApproved: 189, reviewsRejected: 12, department: 'Deputy Commissioner' },
];

const STORAGE_KEY = 'jansetu_auth_user';

type AuthListener = () => void;
const authListeners = new Set<AuthListener>();

function notifyAuth() {
  authListeners.forEach(l => l());
}

export function subscribeAuth(listener: AuthListener): () => void {
  authListeners.add(listener);
  return () => authListeners.delete(listener);
}

export function getCurrentUser(): AppUser | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function login(email: string, password: string): { success: boolean; user?: AppUser; error?: string } {
  // Find dummy user by email
  const user = DUMMY_USERS.find(u => u.email === email);
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    notifyAuth();
    return { success: true, user };
  }
  // Check registered users
  const registered = getRegisteredUsers();
  const regUser = registered.find(u => u.email === email);
  if (regUser) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(regUser));
    notifyAuth();
    return { success: true, user: regUser };
  }
  return { success: false, error: 'Invalid email or password. Try a demo account or sign up.' };
}

export function signup(name: string, email: string, phone: string, role: UserRole, password: string): { success: boolean; user?: AppUser; error?: string } {
  const all = [...DUMMY_USERS, ...getRegisteredUsers()];
  if (all.find(u => u.email === email)) {
    return { success: false, error: 'An account with this email already exists.' };
  }

  const rolePrefix = role === 'citizen' ? 'CIT' : role === 'worker' ? 'WRK' : 'GOV';
  const user: AppUser = {
    id: `${rolePrefix}-${Date.now().toString(36).toUpperCase()}`,
    name,
    email,
    phone,
    role,
    avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
    joinedAt: new Date().toISOString().split('T')[0],
    ...(role === 'citizen' ? { complaintsSubmitted: 0, complaintsResolved: 0 } : {}),
    ...(role === 'worker' ? { tasksCompleted: 0, tasksAssigned: 0, avgRating: 0, department: 'General' } : {}),
    ...(role === 'government_official' ? { reviewsApproved: 0, reviewsRejected: 0, department: 'Administration' } : {}),
  };

  // Save to registered users
  const registered = getRegisteredUsers();
  registered.push(user);
  localStorage.setItem('jansetu_registered_users', JSON.stringify(registered));

  // Auto-login
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
    const stored = localStorage.getItem('jansetu_registered_users');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function getDemoCredentials(): { role: string; email: string; password: string }[] {
  return [
    { role: 'Citizen', email: 'rajesh@mail.com', password: 'demo123' },
    { role: 'Worker', email: 'ramesh.w@gov.in', password: 'demo123' },
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

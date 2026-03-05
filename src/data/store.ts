import { generateComplaints, generateWorkers, generateDepartments, generateProjects, type Complaint, type Worker, type Department, type Project } from './mockData';

// Singleton store for consistent data across views
let complaints: Complaint[] | null = null;
let workers: Worker[] | null = null;
let departments: Department[] | null = null;
let projects: Project[] | null = null;

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
}

export function updateComplaintStatus(id: string, status: Complaint['status']) {
  const c = getComplaints().find(c => c.id === id);
  if (c) {
    c.status = status;
    c.updatedAt = new Date().toISOString();
    if (status === 'completed') {
      c.resolvedAt = new Date().toISOString();
      c.resolutionTime = Math.floor((Date.now() - new Date(c.createdAt).getTime()) / 3600000);
    }
  }
}

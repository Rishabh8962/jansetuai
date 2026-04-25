import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type DbComplaint = Tables<'complaints'>;
export type DbWorker = Tables<'workers'>;
export type DbDepartment = Tables<'departments'>;
export type DbNotification = Tables<'notifications'>;
export type DbReview = Tables<'reviews'>;
export type DbProfile = Tables<'profiles'>;

// ---------- Departments ----------
export function useDepartments() {
  const [data, setData] = useState<DbDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from('departments').select('*').order('name').then(({ data }) => {
      setData(data ?? []);
      setLoading(false);
    });
  }, []);
  return { data, loading };
}

// ---------- Workers ----------
export function useWorkers() {
  const [data, setData] = useState<DbWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    const { data } = await supabase.from('workers').select('*').order('name');
    setData(data ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return { data, loading, reload };
}

// ---------- Complaints (with realtime) ----------
export function useComplaints(filter?: { citizenId?: string; workerId?: string | null }) {
  const [data, setData] = useState<DbComplaint[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    let q = supabase.from('complaints').select('*').order('created_at', { ascending: false });
    if (filter?.citizenId) q = q.eq('citizen_id', filter.citizenId);
    if (filter?.workerId !== undefined && filter?.workerId !== null) q = q.eq('worker_id', filter.workerId);
    const { data } = await q;
    setData(data ?? []);
    setLoading(false);
  }, [filter?.citizenId, filter?.workerId]);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    const ch = supabase
      .channel('complaints-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, () => reload())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [reload]);

  return { data, loading, reload };
}

// ---------- Notifications ----------
export function useNotifications(audience: 'citizen' | 'worker' | 'authority', userId?: string | null) {
  const [data, setData] = useState<DbNotification[]>([]);

  const reload = useCallback(async () => {
    let q = supabase.from('notifications').select('*').eq('audience', audience).order('created_at', { ascending: false }).limit(50);
    const { data } = await q;
    setData(data ?? []);
  }, [audience]);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    const ch = supabase
      .channel(`notifs-${audience}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => reload())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [audience, reload]);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    reload();
  };

  return { data, markRead, reload };
}

// ---------- Reviews ----------
export function useReviews() {
  const [data, setData] = useState<DbReview[]>([]);

  const reload = useCallback(async () => {
    const { data } = await supabase.from('reviews').select('*').order('completed_at', { ascending: false });
    setData(data ?? []);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    const ch = supabase
      .channel('reviews-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => reload())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [reload]);

  return { data, reload };
}

// ---------- Mutations ----------
export interface NewComplaintInput {
  citizen_id: string;
  citizen_name: string;
  category: string;
  description: string;
  image_url: string;
  lat: number;
  lng: number;
  ward: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  department: string;
  ai_confidence?: number | null;
  ai_severity?: string | null;
  ai_detected_category?: string | null;
}

export async function createComplaint(input: NewComplaintInput) {
  const display_id = `CMP-${Date.now().toString().slice(-6)}`;

  const { data, error } = await supabase
    .from('complaints')
    .insert({ ...input, display_id })
    .select()
    .single();
  if (error) throw error;

  // Auto-assign first available worker in same department
  const { data: workers } = await supabase
    .from('workers')
    .select('*')
    .eq('department', input.department)
    .neq('status', 'offline')
    .order('active_tasks')
    .limit(1);
  const worker = workers?.[0];

  if (worker) {
    await supabase
      .from('complaints')
      .update({ status: 'assigned', worker_id: worker.id, assigned_worker: worker.name })
      .eq('id', data.id);
    await supabase.from('workers').update({ active_tasks: worker.active_tasks + 1 }).eq('id', worker.id);

    // Notify citizen + worker (if worker has user account)
    await supabase.from('notifications').insert([
      { recipient_id: input.citizen_id, audience: 'citizen', title: 'Complaint Assigned', message: `Your complaint ${display_id} was assigned to ${worker.name} (${input.department}).`, complaint_id: data.id },
    ]);
    if (worker.user_id) {
      await supabase.from('notifications').insert({
        recipient_id: worker.user_id, audience: 'worker',
        title: 'New Task Assigned 🔔',
        message: `New ${input.category.replace('_', ' ')} complaint (${display_id}) at ${input.ward}.`,
        complaint_id: data.id,
      });
    }
  }

  // Timeline event
  await supabase.from('complaint_events').insert({
    complaint_id: data.id, event_type: 'submitted',
    message: 'Complaint submitted by citizen', actor_id: input.citizen_id,
  });

  return { ...data, display_id };
}

export async function updateComplaintStatus(complaintId: string, status: DbComplaint['status'], actorId?: string) {
  const patch: Partial<DbComplaint> = { status };
  if (status === 'completed') patch.resolved_at = new Date().toISOString();
  await supabase.from('complaints').update(patch).eq('id', complaintId);
  await supabase.from('complaint_events').insert({
    complaint_id: complaintId, event_type: status, message: `Status changed to ${status}`, actor_id: actorId ?? null,
  });
}

export async function submitRepairReview(args: {
  complaintId: string;
  workerId: string | null;
  workerUserId: string;
  repairImageUrl: string;
  workerNotes: string;
  aiVerification: any;
  citizenId?: string | null;
  displayId: string;
}) {
  await supabase.from('reviews').insert({
    complaint_id: args.complaintId,
    worker_id: args.workerId,
    worker_user_id: args.workerUserId,
    repair_image_url: args.repairImageUrl,
    worker_notes: args.workerNotes,
    ai_verification: args.aiVerification,
  });
  await supabase.from('complaints').update({
    status: 'under_review',
    ai_verification: args.aiVerification,
  }).eq('id', args.complaintId);

  await supabase.from('complaint_events').insert({
    complaint_id: args.complaintId, event_type: 'under_review',
    message: 'Worker submitted repair proof. Awaiting authority approval.',
    actor_id: args.workerUserId,
  });

  // Notify authority + citizen
  await supabase.from('notifications').insert([
    { audience: 'authority', title: 'Review Required 📋', message: `Repair submitted for ${args.displayId}. AI: ${args.aiVerification?.status ?? 'analyzed'}.`, complaint_id: args.complaintId },
    args.citizenId ? { recipient_id: args.citizenId, audience: 'citizen', title: 'Repair Completed - Under Review', message: `Worker completed repair for ${args.displayId}. Awaiting verification.`, complaint_id: args.complaintId } : null,
  ].filter(Boolean) as any);
}

export async function approveReview(reviewId: string, complaintId: string, adminNotes: string, adminId: string, displayId: string, citizenId?: string | null) {
  await supabase.from('reviews').update({
    reviewed: true, approved: true, admin_notes: adminNotes, reviewed_by: adminId, reviewed_at: new Date().toISOString(),
  }).eq('id', reviewId);
  await supabase.from('complaints').update({
    status: 'completed', resolved_at: new Date().toISOString(),
  }).eq('id', complaintId);
  await supabase.from('complaint_events').insert({
    complaint_id: complaintId, event_type: 'completed', message: `Approved: ${adminNotes}`, actor_id: adminId,
  });
  if (citizenId) {
    await supabase.from('notifications').insert({
      recipient_id: citizenId, audience: 'citizen',
      title: 'Complaint Resolved! ✅',
      message: `Your complaint ${displayId} has been approved. ${adminNotes}`,
      complaint_id: complaintId,
    });
    // Award points
    const { data: prof } = await supabase.from('profiles').select('points').eq('user_id', citizenId).maybeSingle();
    if (prof) await supabase.from('profiles').update({ points: (prof.points ?? 0) + 25 }).eq('user_id', citizenId);
  }
}

export async function rejectReview(reviewId: string, complaintId: string, adminNotes: string, adminId: string, displayId: string, workerUserId?: string | null, citizenId?: string | null) {
  await supabase.from('reviews').update({
    reviewed: true, approved: false, admin_notes: adminNotes, reviewed_by: adminId, reviewed_at: new Date().toISOString(),
  }).eq('id', reviewId);
  await supabase.from('complaints').update({ status: 'rework_required' }).eq('id', complaintId);
  await supabase.from('complaint_events').insert({
    complaint_id: complaintId, event_type: 'rework_required', message: `Rework required: ${adminNotes}`, actor_id: adminId,
  });
  const notifs: any[] = [];
  if (workerUserId) notifs.push({ recipient_id: workerUserId, audience: 'worker', title: 'Rework Required ⚠️', message: `Repair for ${displayId} rejected. ${adminNotes}`, complaint_id: complaintId });
  if (citizenId) notifs.push({ recipient_id: citizenId, audience: 'citizen', title: 'Repair Under Rework', message: `Repair for ${displayId} was not satisfactory.`, complaint_id: complaintId });
  if (notifs.length) await supabase.from('notifications').insert(notifs);
}

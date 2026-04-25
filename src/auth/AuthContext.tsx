import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'citizen' | 'worker' | 'authority';

interface AuthCtx {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  primaryRole: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName: string, role: AppRole) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

const ROLE_PRIORITY: AppRole[] = ['authority', 'worker', 'citizen'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRoles = useCallback(async (uid: string) => {
    const { data } = await supabase.from('user_roles').select('role').eq('user_id', uid);
    setRoles((data ?? []).map((r) => r.role as AppRole));
  }, []);

  const refreshRoles = useCallback(async () => {
    if (user) await loadRoles(user.id);
  }, [user, loadRoles]);

  useEffect(() => {
    // Set up listener FIRST per Lovable Auth rules, then check existing session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        // Defer additional Supabase calls to avoid deadlock
        setTimeout(() => loadRoles(sess.user.id), 0);
      } else {
        setRoles([]);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) loadRoles(s.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadRoles]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string, role: AppRole) => {
    const redirectUrl = `${window.location.origin}/`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { display_name: displayName },
      },
    });
    if (error) return { error: error.message };

    // Citizen role auto-assigned by trigger. For worker/authority, also insert.
    if (data.user && role !== 'citizen') {
      const { error: rerr } = await supabase.from('user_roles').insert({ user_id: data.user.id, role });
      if (rerr) console.warn('role insert failed (will need authority approval):', rerr.message);
    }
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setRoles([]);
  }, []);

  const primaryRole: AppRole | null =
    ROLE_PRIORITY.find((r) => roles.includes(r)) ?? null;

  return (
    <Ctx.Provider value={{ session, user, roles, primaryRole, loading, signIn, signUp, signOut, refreshRoles }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>');
  return v;
}

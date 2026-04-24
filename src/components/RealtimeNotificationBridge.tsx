import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Bell } from 'lucide-react';
import { getNotifications, subscribe, type Notification } from '@/data/store';

interface Props {
  /** Which notification stream to surface as toasts. */
  audience: Notification['type'];
}

/**
 * Subscribes to the in-memory store and surfaces *new* notifications
 * for the current audience as sonner toasts. Does not render anything.
 */
export function RealtimeNotificationBridge({ audience }: Props) {
  const seenRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  useEffect(() => {
    // Mark all currently-existing notifications as "seen" on mount,
    // so we only toast for *new* ones that arrive during this session.
    const initial = getNotifications(audience);
    initial.forEach(n => seenRef.current.add(n.id));
    initializedRef.current = true;

    const unsub = subscribe(() => {
      const current = getNotifications(audience);
      // notifications are unshifted (newest first); iterate reverse for chronological toasts
      for (let i = current.length - 1; i >= 0; i--) {
        const n = current[i];
        if (seenRef.current.has(n.id)) continue;
        seenRef.current.add(n.id);
        toast(n.title, {
          description: n.message,
          icon: <Bell className="w-4 h-4 text-primary" />,
          duration: 5000,
        });
      }
    });

    return () => { unsub(); };
  }, [audience]);

  return null;
}

import { useSyncExternalStore } from 'react';
import { subscribeAuth, getCurrentUser } from '@/data/authStore';

let authVersion = 0;

export function useAuth() {
  useSyncExternalStore(
    (callback) => {
      const unsub = subscribeAuth(() => {
        authVersion++;
        callback();
      });
      return unsub;
    },
    () => authVersion,
    () => authVersion,
  );
  return getCurrentUser();
}

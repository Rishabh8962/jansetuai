import { useSyncExternalStore } from 'react';
import { subscribe } from '@/data/store';

let version = 0;

const originalSubscribe = subscribe;

// Re-export a hook that forces re-render on store changes
export function useStoreRefresh() {
  const ver = useSyncExternalStore(
    (callback) => {
      const unsub = originalSubscribe(() => {
        version++;
        callback();
      });
      return unsub;
    },
    () => version,
    () => version,
  );
  return ver;
}

import { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * RealtimeManager — اتصال Supabase Realtime مركزي واحد
 * ─────────────────────────────────────────────────────────
 * بدلاً من أن تفتح كل صفحة قناة Realtime خاصة بها،
 * هذا المدير يفتح قناة واحدة للتطبيق كله ويوزع الأحداث
 * على المشتركين (subscribers) بكفاءة عالية.
 *
 * الاستخدام في الصفحات:
 *   const { subscribe } = useRealtimeManager();
 *   useEffect(() => {
 *     const unsub = subscribe('products', '*', (payload) => { ... });
 *     return unsub;
 *   }, [subscribe]);
 */

const RealtimeManagerContext = createContext(null);

// Map: tableName → Map: eventType → Set<callback>
const listenersMap = new Map();

let channelInstance = null;
let subscriberCount = 0;

function getOrCreateChannel() {
  if (channelInstance) return channelInstance;

  const TABLES = ['products', 'transactions', 'system_settings'];

  let builder = supabase.channel('global-realtime-manager');

  TABLES.forEach((table) => {
    ['INSERT', 'UPDATE', 'DELETE'].forEach((event) => {
      builder = builder.on(
        'postgres_changes',
        { event, schema: 'public', table },
        (payload) => {
          const key = `${table}:${event}`;
          const keyAll = `${table}:*`;
          const dispatch = (listeners) => {
            if (listeners) listeners.forEach((cb) => cb(payload));
          };
          dispatch(listenersMap.get(key));
          dispatch(listenersMap.get(keyAll));
        }
      );
    });
  });

  channelInstance = builder.subscribe();
  return channelInstance;
}

export function RealtimeManagerProvider({ children }) {
  const channelRef = useRef(null);

  useEffect(() => {
    channelRef.current = getOrCreateChannel();
    subscriberCount++;

    return () => {
      subscriberCount--;
      // Only remove when truly last component using it
      if (subscriberCount <= 0 && channelInstance) {
        supabase.removeChannel(channelInstance);
        channelInstance = null;
        channelRef.current = null;
      }
    };
  }, []);

  /**
   * subscribe(table, event, callback)
   * event: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
   * returns cleanup function
   */
  const subscribe = useCallback((table, event, callback) => {
    const key = `${table}:${event}`;
    if (!listenersMap.has(key)) listenersMap.set(key, new Set());
    listenersMap.get(key).add(callback);

    return () => {
      listenersMap.get(key)?.delete(callback);
      if (listenersMap.get(key)?.size === 0) listenersMap.delete(key);
    };
  }, []);

  return (
    <RealtimeManagerContext.Provider value={{ subscribe }}>
      {children}
    </RealtimeManagerContext.Provider>
  );
}

export function useRealtimeManager() {
  const ctx = useContext(RealtimeManagerContext);
  if (!ctx) throw new Error('useRealtimeManager must be inside <RealtimeManagerProvider>');
  return ctx;
}



// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/notifications/client.ts (Facade + optional realtime)
// -------------------------------------------------------------
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import { notificationsApi, type Notification } from "@/integrations/metahub/rtk/endpoints/notifications.endpoints";
import { useEffect } from "react";

export type { Notification };

export const notifications = {
  async list(params?: Parameters<typeof notificationsApi.endpoints.listNotifications.initiate>[0]) {
    try { const data = await store.dispatch(notificationsApi.endpoints.listNotifications.initiate(params ?? {})).unwrap(); return { data: data as Notification[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Notification[] | null, error: { message } }; }
  },
  async getById(id: string) {
    try { const data = await store.dispatch(notificationsApi.endpoints.getNotificationById.initiate(id)).unwrap(); return { data: data as Notification, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Notification | null, error: { message } }; }
  },
  async unreadCount(user_id?: string) {
    try { const data = await store.dispatch(notificationsApi.endpoints.getUnreadCount.initiate({ user_id })).unwrap(); return { data, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as { count: number } | null, error: { message } }; }
  },
  async read(id: string) {
    try { const data = await store.dispatch(notificationsApi.endpoints.markAsRead.initiate(id)).unwrap(); return { data, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as { success: true } | null, error: { message } }; }
  },
  async readAll(user_id?: string) {
    try { const data = await store.dispatch(notificationsApi.endpoints.markAllAsRead.initiate({ user_id })).unwrap(); return { data, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as { success: true } | null, error: { message } }; }
  },
};

// Optional: super-light realtime via EventSource (if BE supports) with polling fallback
export function useRealtimeNotifications(
  userId: string | undefined,
  onInsert: (n: Notification) => void,
  opts?: { pollMs?: number }
) {
  useEffect(() => {
    if (!userId) return;
    let stop = false;
    let es: EventSource | null = null;

    // Try EventSource first
    const url = new URL("/notifications/stream", window.location.origin);
    url.searchParams.set("user_id", userId);
    try {
      es = new EventSource(url.toString());
      es.onmessage = (ev) => {
        try { const n = JSON.parse(ev.data) as Notification; onInsert(n); } catch { /* ignore */ }
      };
      es.onerror = () => { es?.close(); es = null; };
    } catch { /* ignore */ }

    // Polling fallback (last 1 item every N ms)
    const pollMs = Math.max(2000, opts?.pollMs ?? 5000);
    let lastSeen: string | null = null;

    async function poll() {
      if (stop) return;
      try {
        const { data } = await notifications.list({ user_id: userId, limit: 1, offset: 0, order: "desc" });
        const top = data && data[0];
        if (top && top.id !== lastSeen) { lastSeen = top.id; onInsert(top); }
      } catch { /* ignore */ }
      finally { if (!es) setTimeout(poll, pollMs); }
    }

    if (!es) poll();

    return () => { stop = true; if (es) es.close(); };
  }, [userId, onInsert, opts?.pollMs]);
}

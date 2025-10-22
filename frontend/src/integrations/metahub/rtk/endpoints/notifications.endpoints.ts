
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/notifications.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "@/integrations/metahub/rtk/baseApi";

const toNumber = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));
const tryParse = <T>(x: unknown): T => { if (typeof x === "string") { try { return JSON.parse(x) as T; } catch {
    /* no-op */
} } return x as T; };

export type Notification = {
  id: string;
  user_id: string;
  type: string;                         // e.g., "order_paid"
  title?: string | null;
  message?: string | null;
  data?: Record<string, unknown> | null;// provider payload
  is_read: 0 | 1 | boolean;
  created_at: string;
};

type ApiNotification = Omit<Notification, "data"> & { data?: string | Notification["data"] };

const normalizeNotification = (n: ApiNotification): Notification => ({ ...n, data: n.data ? tryParse<Notification["data"]>(n.data) : null });

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listNotifications: b.query<
      Notification[],
      { user_id?: string; is_read?: 0 | 1 | boolean; limit?: number; offset?: number; order?: "asc" | "desc" }
    >({
      query: (params) => ({ url: "/notifications", params }),
      transformResponse: (res: unknown): Notification[] => Array.isArray(res) ? (res as ApiNotification[]).map(normalizeNotification) : [],
      providesTags: (result) => result ? [
        ...result.map((n) => ({ type: "Notification" as const, id: n.id })),
        { type: "Notifications" as const, id: "LIST" },
      ] : [{ type: "Notifications" as const, id: "LIST" }],
    }),

    getNotificationById: b.query<Notification, string>({
      query: (id) => ({ url: `/notifications/${id}` }),
      transformResponse: (res: unknown): Notification => normalizeNotification(res as ApiNotification),
      providesTags: (_r, _e, id) => [{ type: "Notification", id }],
    }),

    getUnreadCount: b.query<{ count: number }, { user_id?: string }>({
      query: (args) => ({ url: "/notifications/unread-count", params: args ?? {} }),
      transformResponse: (res: unknown): { count: number } => ({ count: toNumber((res as any)?.count ?? 0) }),
      providesTags: [{ type: "Notifications" as const, id: "UNREAD" }],
    }),

    markAsRead: b.mutation<{ success: true }, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "POST" }),
      transformResponse: (res: unknown): { success: true } => (res as { success: true }) ?? { success: true },
      invalidatesTags: (_r, _e, id) => [{ type: "Notification" as const, id }, { type: "Notifications" as const, id: "UNREAD" }],
    }),

    markAllAsRead: b.mutation<{ success: true }, { user_id?: string }>({
      query: (body) => ({ url: "/notifications/read-all", method: "POST", body }),
      transformResponse: (res: unknown): { success: true } => (res as { success: true }) ?? { success: true },
      invalidatesTags: [{ type: "Notifications" as const, id: "LIST" }, { type: "Notifications" as const, id: "UNREAD" }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListNotificationsQuery,
  useGetNotificationByIdQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} = notificationsApi;

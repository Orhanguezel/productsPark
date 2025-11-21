// ===================================================================
// FILE: src/integrations/metahub/rtk/endpoints/notifications.endpoints.ts
// ===================================================================
import { baseApi } from "../baseApi";
import {
  Notification,
  NotificationsListResult,
  CreateNotificationBody,
  UpdateNotificationBody,
  MarkAllReadResult,
} from "../types/notifications";

/** GET /notifications/unread-count dönüş tipi (normalize edeceğiz) */
interface UnreadCountRaw {
  unread?: number;
  count?: number;
  total?: number;
  // Backend ekstra alan gönderirse burada dursun diye:
  [key: string]: unknown;
}

/** GET /notifications raw response (beklenen şekil) */
interface NotificationsListRaw {
  items: unknown[];
  unread_count?: number;
  unreadCount?: number;
}

/** Type guard: res → NotificationsListRaw mı? */
function isNotificationsListRaw(value: unknown): value is NotificationsListRaw {
  if (!value || typeof value !== "object") return false;

  const v = value as { items?: unknown };
  return Array.isArray(v.items);
}

/**
 * NOT: baseApi.tagTypes kısmına aşağıdakileri eklemeyi unutma:
 *  - "Notification"
 *  - "Notifications"
 *  - "NotificationsMeta"
 */
export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** GET /notifications → { items, unreadCount } */
    listNotifications: build.query<NotificationsListResult, void>({
      query: () => ({ url: "/notifications" }),
      transformResponse: (res: unknown): NotificationsListResult => {
        // Beklenen: { items: Notification[], unread_count?: number }
        if (isNotificationsListRaw(res)) {
          const { items, unread_count, unreadCount } = res;

          const normalizedItems = items as Notification[];
          const normalizedUnread =
            typeof unread_count === "number"
              ? unread_count
              : typeof unreadCount === "number"
                ? unreadCount
                : 0;

          return {
            items: normalizedItems,
            unreadCount: normalizedUnread,
          };
        }

        // Eğer backend direkt array dönerse (fallback)
        if (Array.isArray(res)) {
          return {
            items: res as Notification[],
            unreadCount: 0,
          };
        }

        // Hiç beklemediğimiz bir şekil gelirse boş dön
        return { items: [], unreadCount: 0 };
      },
      providesTags: (result) =>
        result
          ? [
            ...result.items.map((n) => ({
              type: "Notification" as const,
              id: n.id,
            })),
            { type: "Notifications" as const, id: "LIST" },
            { type: "NotificationsMeta" as const, id: "UNREAD" },
          ]
          : [
            { type: "Notifications" as const, id: "LIST" },
            { type: "NotificationsMeta" as const, id: "UNREAD" },
          ],
    }),

    /** GET /notifications/unread-count → number */
    getUnreadNotificationCount: build.query<number, void>({
      query: () => ({ url: "/notifications/unread-count" }),
      transformResponse: (res: unknown): number => {
        if (typeof res === "number") return res;

        const obj = (res ?? {}) as UnreadCountRaw;
        if (typeof obj.unread === "number") return obj.unread;
        if (typeof obj.count === "number") return obj.count;
        if (typeof obj.total === "number") return obj.total;

        return 0;
      },
      providesTags: () => [
        { type: "NotificationsMeta" as const, id: "UNREAD" },
      ],
    }),

    /** POST /notifications → Notification */
    createNotification: build.mutation<Notification, CreateNotificationBody>({
      query: (body) => ({
        url: "/notifications",
        method: "POST",
        body,
      }),
      transformResponse: (res: unknown): Notification => res as Notification,
      invalidatesTags: () => [
        { type: "Notifications" as const, id: "LIST" },
        { type: "NotificationsMeta" as const, id: "UNREAD" },
      ],
    }),

    /** PATCH /notifications/:id → Notification (okundu işaretleme) */
    markNotificationRead: build.mutation<Notification, UpdateNotificationBody>({
      query: ({ id, ...body }) => ({
        url: `/notifications/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (res: unknown): Notification => res as Notification,
      invalidatesTags: (_r, _e, arg) => [
        { type: "Notification" as const, id: arg.id },
        { type: "Notifications" as const, id: "LIST" },
        { type: "NotificationsMeta" as const, id: "UNREAD" },
      ],
    }),

    /** POST /notifications/mark-all-read → { updated } */
    markAllNotificationsRead: build.mutation<MarkAllReadResult, void>({
      query: () => ({
        url: "/notifications/mark-all-read",
        method: "POST",
      }),
      transformResponse: (res: unknown): MarkAllReadResult => {
        if (res && typeof res === "object" && "updated" in res) {
          return res as MarkAllReadResult;
        }
        return { updated: 0 };
      },
      invalidatesTags: () => [
        { type: "Notifications" as const, id: "LIST" },
        { type: "NotificationsMeta" as const, id: "UNREAD" },
      ],
    }),

    /** DELETE /notifications/:id → { ok: true } */
    deleteNotification: build.mutation<{ ok: boolean }, string>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: "DELETE",
      }),
      transformResponse: (res: unknown): { ok: boolean } => {
        if (res && typeof res === "object" && "ok" in res) {
          return res as { ok: boolean };
        }
        return { ok: true };
      },
      invalidatesTags: (_r, _e, id) => [
        { type: "Notification" as const, id },
        { type: "Notifications" as const, id: "LIST" },
        { type: "NotificationsMeta" as const, id: "UNREAD" },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useCreateNotificationMutation,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} = notificationsApi;

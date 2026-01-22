// ===================================================================
// FILE: src/integrations/rtk/endpoints/notifications.endpoints.ts
// FINAL — Notifications RTK (Auth-required, shared for admin+user)
// Backend base:
// - GET    /notifications
// - GET    /notifications/unread-count
// - POST   /notifications
// - PATCH  /notifications/:id
// - POST   /notifications/mark-all-read
// - DELETE /notifications/:id
// ===================================================================

import { baseApi } from '@/integrations/baseApi';

import type {
  NotificationView,
  NotificationsListParams,
  UnreadCountResp,
  CreateNotificationBody,
  UpdateNotificationBody,
  MarkAllReadBody,
  OkResp,
  MarkAllReadResult,
} from '@/integrations/types';

import {
  normalizeNotification,
  normalizeNotificationsList,
  normalizeUnreadCount,
  normalizeOk,
  normalizeMarkAllRead,
  toNotificationsListQuery,
  toCreateNotificationBody,
  toUpdateNotificationBody,
} from '@/integrations/types';

const BASE = '/notifications';

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** GET /notifications */
    listNotifications: b.query<NotificationView[], NotificationsListParams | void>({
      query: (params) => {
        const qp = params ? toNotificationsListQuery(params) : undefined;
        return { url: BASE, method: 'GET', ...(qp ? { params: qp } : {}) };
      },
      transformResponse: (res: unknown): NotificationView[] => normalizeNotificationsList(res),
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((n) => ({ type: 'Notification' as const, id: n.id })),
              { type: 'Notifications' as const, id: 'LIST' },
              { type: 'Notifications' as const, id: 'UNREAD' },
            ]
          : [
              { type: 'Notifications' as const, id: 'LIST' },
              { type: 'Notifications' as const, id: 'UNREAD' },
            ],
      keepUnusedDataFor: 30,
    }),

    /** GET /notifications/unread-count -> {count} */
    getUnreadCount: b.query<UnreadCountResp, void>({
      query: () => ({ url: `${BASE}/unread-count`, method: 'GET' }),
      transformResponse: (res: unknown): UnreadCountResp => ({ count: normalizeUnreadCount(res) }),
      providesTags: [{ type: 'Notifications' as const, id: 'UNREAD' }],
      keepUnusedDataFor: 10,
    }),

    /** POST /notifications */
    createNotification: b.mutation<NotificationView, CreateNotificationBody>({
      query: (body) => ({
        url: BASE,
        method: 'POST',
        body: toCreateNotificationBody(body),
      }),
      transformResponse: (res: unknown): NotificationView => normalizeNotification(res),
      invalidatesTags: [
        { type: 'Notifications' as const, id: 'LIST' },
        { type: 'Notifications' as const, id: 'UNREAD' },
      ],
    }),

    /** PATCH /notifications/:id */
    updateNotification: b.mutation<NotificationView, { id: string; body: UpdateNotificationBody }>({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: toUpdateNotificationBody(body),
      }),
      transformResponse: (res: unknown): NotificationView => normalizeNotification(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Notification' as const, id: arg.id },
        { type: 'Notifications' as const, id: 'LIST' },
        { type: 'Notifications' as const, id: 'UNREAD' },
      ],
    }),

    /** POST /notifications/mark-all-read */
    markAllRead: b.mutation<MarkAllReadResult, MarkAllReadBody | void>({
      query: (body) => ({
        url: `${BASE}/mark-all-read`,
        method: 'POST',
        body: body ?? {}, // backend empty object kabul eder
      }),
      transformResponse: (res: unknown): MarkAllReadResult => normalizeMarkAllRead(res),
      invalidatesTags: [
        { type: 'Notifications' as const, id: 'LIST' },
        { type: 'Notifications' as const, id: 'UNREAD' },
      ],
    }),

    /** DELETE /notifications/:id */
    deleteNotification: b.mutation<OkResp, { id: string }>({
      query: ({ id }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      transformResponse: (res: unknown): OkResp => normalizeOk(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Notification' as const, id: arg.id },
        { type: 'Notifications' as const, id: 'LIST' },
        { type: 'Notifications' as const, id: 'UNREAD' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListNotificationsQuery,
  useGetUnreadCountQuery,
  useCreateNotificationMutation,
  useUpdateNotificationMutation,
  useMarkAllReadMutation,
  useDeleteNotificationMutation,
} = notificationsApi;

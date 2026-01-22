// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/fake_notifications.endpoints.ts
// FINAL — Fake Notifications RTK endpoints (clean; helpers in /types)
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type { FetchArgs } from '@reduxjs/toolkit/query';

import type {
  FakeOrderNotification,
  FakeNotificationSettings,
  FakeOrdersAdminListParams,
} from '@/integrations/types';

import {
  toFakeOrdersAdminListQuery,
  pluckFakeArray,
  normalizeFakeOrderNotification,
  normalizeFakeNotificationSettings,
} from '@/integrations/types';

/* ---------------- endpoints ---------------- */

const extendedApi = baseApi.enhanceEndpoints({
  addTagTypes: ['FakeOrders', 'FakeOrderSettings'] as const,
});

const BASE = '/fake-order-notifications';
const ADMIN_BASE = '/admin/fake-order-notifications';

export const fakeNotificationsApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    /* ================= ADMIN: CRUD ================= */

    listFakeOrderNotifications: b.query<FakeOrderNotification[], FakeOrdersAdminListParams | void>({
      query: (params): FetchArgs => {
        const qp = toFakeOrdersAdminListQuery(params);
        return qp
          ? { url: '/admin/fake-order-notifications', params: qp }
          : { url: '/admin/fake-order-notifications' };
      },
      transformResponse: (res: unknown): FakeOrderNotification[] =>
        pluckFakeArray(res, ['data', 'items', 'rows', 'result']).map((x) =>
          normalizeFakeOrderNotification(x),
        ),
      providesTags: (result) =>
        result && result.length
          ? [
              ...result.map((x) => ({ type: 'FakeOrders' as const, id: x.id })),
              { type: 'FakeOrders' as const, id: 'LIST' },
            ]
          : [{ type: 'FakeOrders' as const, id: 'LIST' }],
    }),

    getFakeOrderNotification: b.query<FakeOrderNotification, string>({
      query: (id): FetchArgs => ({
        url: `/admin/fake-order-notifications/${encodeURIComponent(id)}`,
      }),
      transformResponse: (r: unknown): FakeOrderNotification => normalizeFakeOrderNotification(r),
      providesTags: (_r, _e, id) => [{ type: 'FakeOrders' as const, id }],
    }),

    createFakeOrderNotification: b.mutation<
      FakeOrderNotification,
      {
        product_name: string;
        customer: string;
        location?: string | null;
        time_ago: string;
        is_active?: boolean;
      }
    >({
      query: (body): FetchArgs => ({
        url: '/admin/fake-order-notifications',
        method: 'POST',
        body,
      }),
      transformResponse: (r: unknown): FakeOrderNotification => normalizeFakeOrderNotification(r),
      invalidatesTags: [{ type: 'FakeOrders' as const, id: 'LIST' }],
    }),

    updateFakeOrderNotification: b.mutation<
      FakeOrderNotification,
      {
        id: string;
        patch: Partial<{
          product_name: string;
          customer: string;
          location: string | null;
          time_ago: string;
          is_active: boolean;
        }>;
      }
    >({
      query: ({ id, patch }): FetchArgs => ({
        url: `/admin/fake-order-notifications/${encodeURIComponent(id)}`,
        method: 'PUT',
        body: patch,
      }),
      transformResponse: (r: unknown): FakeOrderNotification => normalizeFakeOrderNotification(r),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'FakeOrders' as const, id },
        { type: 'FakeOrders' as const, id: 'LIST' },
      ],
    }),

    deleteFakeOrderNotification: b.mutation<{ ok: true }, string>({
      query: (id): FetchArgs => ({
        url: `/admin/fake-order-notifications/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      transformResponse: (): { ok: true } => ({ ok: true as const }),
      invalidatesTags: [{ type: 'FakeOrders' as const, id: 'LIST' }],
    }),

    /* ================= ADMIN: SETTINGS ================= */

    getFakeNotificationSettings: b.query<FakeNotificationSettings, void>({
      query: (): FetchArgs => ({ url: '/admin/site-settings/fake-notification-config' }),
      transformResponse: (r: unknown): FakeNotificationSettings =>
        normalizeFakeNotificationSettings(r),
      providesTags: [{ type: 'FakeOrderSettings' as const, id: 'CFG' }],
    }),

    updateFakeNotificationSettings: b.mutation<
      FakeNotificationSettings,
      Partial<FakeNotificationSettings>
    >({
      query: (patch): FetchArgs => ({
        url: '/admin/site-settings/fake-notification-config',
        method: 'PUT',
        body: patch,
      }),
      transformResponse: (r: unknown): FakeNotificationSettings =>
        normalizeFakeNotificationSettings(r),
      invalidatesTags: [{ type: 'FakeOrderSettings' as const, id: 'CFG' }],
    }),

    /* ================= PUBLIC ================= */

    getPublicFakeNotificationSettings: b.query<FakeNotificationSettings, void>({
      query: (): FetchArgs => ({ url: '/site-settings/fake-notification-config' }),
      transformResponse: (r: unknown): FakeNotificationSettings =>
        normalizeFakeNotificationSettings(r),
      providesTags: [{ type: 'FakeOrderSettings' as const, id: 'CFG_PUBLIC' }],
    }),

    listPublicFakeOrders: b.query<FakeOrderNotification[], void>({
      query: (): FetchArgs => ({ url: '/fake-order-notifications' }),
      transformResponse: (res: unknown): FakeOrderNotification[] =>
        pluckFakeArray(res, ['data', 'items', 'rows', 'result']).map((x) =>
          normalizeFakeOrderNotification(x),
        ),
    }),

    getPublicRandomFakeOrder: b.query<FakeOrderNotification, void>({
      query: (): FetchArgs => ({ url: '/fake-order-notifications/random' }),
      transformResponse: (r: unknown): FakeOrderNotification => normalizeFakeOrderNotification(r),
    }),
  }),
  overrideExisting: true,
});

export const {
  // ADMIN CRUD
  useListFakeOrderNotificationsQuery,
  useGetFakeOrderNotificationQuery,
  useCreateFakeOrderNotificationMutation,
  useUpdateFakeOrderNotificationMutation,
  useDeleteFakeOrderNotificationMutation,

  // ADMIN settings
  useGetFakeNotificationSettingsQuery,
  useUpdateFakeNotificationSettingsMutation,

  // PUBLIC
  useGetPublicFakeNotificationSettingsQuery,
  useListPublicFakeOrdersQuery,
  useGetPublicRandomFakeOrderQuery,
} = fakeNotificationsApi;

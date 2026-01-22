// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/admin/fake_admin_notifications.endpoints.ts
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

const ADMIN_BASE = '/admin/fake-order-notifications';
const SETTINGS_BASE = '/admin/site-settings/fake-notification-config';

export const fakeNotificationsAdminApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    /* ================= ADMIN: CRUD ================= */

    listFakeOrderNotifications: b.query<FakeOrderNotification[], FakeOrdersAdminListParams | void>({
      query: (params): FetchArgs => {
        const qp = toFakeOrdersAdminListQuery(params);
        return qp
          ? { url: `${ADMIN_BASE}`, params: qp }
          : { url: `${ADMIN_BASE}` };
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
        url: `${ADMIN_BASE}/${encodeURIComponent(id)}`,
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
        url: `${ADMIN_BASE}`,
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
        url: `${ADMIN_BASE}/${encodeURIComponent(id)}`,
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
        url: `${ADMIN_BASE}/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      transformResponse: (): { ok: true } => ({ ok: true as const }),
      invalidatesTags: [{ type: 'FakeOrders' as const, id: 'LIST' }],
    }),

    /* ================= ADMIN: SETTINGS ================= */

    getFakeNotificationSettings: b.query<FakeNotificationSettings, void>({
      query: (): FetchArgs => ({ url: SETTINGS_BASE }),
      transformResponse: (r: unknown): FakeNotificationSettings =>
        normalizeFakeNotificationSettings(r),
      providesTags: [{ type: 'FakeOrderSettings' as const, id: 'CFG' }],
    }),

    updateFakeNotificationSettings: b.mutation<
      FakeNotificationSettings,
      Partial<FakeNotificationSettings>
    >({
      query: (patch): FetchArgs => ({
        url: SETTINGS_BASE,
        method: 'PUT',
        body: patch,
      }),
      transformResponse: (r: unknown): FakeNotificationSettings =>
        normalizeFakeNotificationSettings(r),
      invalidatesTags: [{ type: 'FakeOrderSettings' as const, id: 'CFG' }],
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
} = fakeNotificationsAdminApi;

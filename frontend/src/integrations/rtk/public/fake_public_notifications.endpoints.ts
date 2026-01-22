// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/public/fake_public_notifications.endpoints.ts
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
const SETTINGS_BASE = '/site-settings/fake-notification-config';

export const fakeNotificationsApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({


    /* ================= PUBLIC ================= */

    getPublicFakeNotificationSettings: b.query<FakeNotificationSettings, void>({
      query: (): FetchArgs => ({ url: `${SETTINGS_BASE}` }),
      transformResponse: (r: unknown): FakeNotificationSettings =>
        normalizeFakeNotificationSettings(r),
      providesTags: [{ type: 'FakeOrderSettings' as const, id: 'CFG_PUBLIC' }],
    }),

    listPublicFakeOrders: b.query<FakeOrderNotification[], void>({
      query: (): FetchArgs => ({ url: `${BASE}` }),
      transformResponse: (res: unknown): FakeOrderNotification[] =>
        pluckFakeArray(res, ['data', 'items', 'rows', 'result']).map((x) =>
          normalizeFakeOrderNotification(x),
        ),
    }),

    getPublicRandomFakeOrder: b.query<FakeOrderNotification, void>({
      query: (): FetchArgs => ({ url: `${BASE}/random` }),
      transformResponse: (r: unknown): FakeOrderNotification => normalizeFakeOrderNotification(r),
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetPublicFakeNotificationSettingsQuery,
  useListPublicFakeOrdersQuery,
  useGetPublicRandomFakeOrderQuery,
} = fakeNotificationsApi;

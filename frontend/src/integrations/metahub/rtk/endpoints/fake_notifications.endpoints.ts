// src/integrations/metahub/rtk/endpoints/fake_notifications.endpoints.ts

import { baseApi } from "../baseApi";
import type { FakeOrderNotification, FakeNotificationSettings } from "../types/fakeNotifications";

type ListParams = Partial<{
  is_active: boolean;
  q: string;
  order: string;   // "created_at.desc"
  limit: number;
  offset: number;
}>;

const toStr = (v: unknown) => (typeof v === "string" ? v : String(v ?? ""));
const toBool = (v: unknown) => v === true || v === 1 || v === "1" || v === "true";

type RawFake = Partial<{
  id: unknown;
  product_name: unknown;
  customer: unknown;
  location: unknown;
  time_ago: unknown;
  is_active: unknown;
  created_at: unknown;
}>;

function normalizeFake(row: unknown): FakeOrderNotification {
  const r = (row ?? {}) as RawFake;
  return {
    id: toStr(r.id),
    product_name: toStr(r.product_name),
    customer: toStr(r.customer),
    location: r.location == null ? null : toStr(r.location),
    time_ago: toStr(r.time_ago),
    is_active: toBool(r.is_active),
    created_at: toStr(r.created_at),
  };
}

type RawSettings = Partial<Record<string, unknown>>;
function normalizeSettings(r: unknown): FakeNotificationSettings {
  const x = (r ?? {}) as RawSettings;
  const toNum = (v: unknown, d: number) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : d;
  };
  return {
    notification_display_duration: toNum(x.notification_display_duration, 5),
    notification_interval: toNum(x.notification_interval, 30),
    notification_delay: toNum(x.notification_delay, 10),
    fake_notifications_enabled: toBool(x.fake_notifications_enabled ?? true),
  };
}

export const fakeNotificationsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({

    /* ================= ADMIN: CRUD ================= */

    listFakeOrderNotifications: b.query<FakeOrderNotification[], ListParams | void>({
      // ⬇️ Burada sihir: p'yi default {} ile tek tipe indiriyoruz
      query: (p: ListParams = {}) => {
        const usp = new URLSearchParams();

        if (typeof p.is_active === "boolean") {
          usp.set("is_active", p.is_active ? "1" : "0");
        }
        if (p.q) usp.set("q", p.q);
        if (p.order) usp.set("order", p.order);
        if (typeof p.limit === "number") usp.set("limit", String(p.limit));
        if (typeof p.offset === "number") usp.set("offset", String(p.offset));

        const qs = usp.toString();
        return { url: `/admin/fake-order-notifications${qs ? `?${qs}` : ""}` };
      },
      transformResponse: (rows: unknown): FakeOrderNotification[] =>
        (Array.isArray(rows) ? rows : []).map(normalizeFake),
      providesTags: (result) =>
        result
          ? [
            ...result.map((x) => ({ type: "FakeOrders" as const, id: x.id })),
            { type: "FakeOrders" as const, id: "LIST" },
          ]
          : [{ type: "FakeOrders" as const, id: "LIST" }],
    }),

    getFakeOrderNotification: b.query<FakeOrderNotification, string>({
      query: (id) => ({ url: `/admin/fake-order-notifications/${id}` }),
      transformResponse: (r: unknown) => normalizeFake(r),
      providesTags: (_r, _e, id) => [{ type: "FakeOrders", id }],
    }),

    createFakeOrderNotification: b.mutation<
      FakeOrderNotification,
      { product_name: string; customer: string; location?: string | null; time_ago: string; is_active?: boolean }
    >({
      query: (body) => ({ url: `/admin/fake-order-notifications`, method: "POST", body }),
      transformResponse: (r: unknown) => normalizeFake(r),
      invalidatesTags: [{ type: "FakeOrders", id: "LIST" }],
    }),

    updateFakeOrderNotification: b.mutation<
      FakeOrderNotification,
      { id: string; patch: Partial<{ product_name: string; customer: string; location: string | null; time_ago: string; is_active: boolean }> }
    >({
      query: ({ id, patch }) => ({ url: `/admin/fake-order-notifications/${id}`, method: "PUT", body: patch }),
      transformResponse: (r: unknown) => normalizeFake(r),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "FakeOrders", id },
        { type: "FakeOrders", id: "LIST" },
      ],
    }),

    deleteFakeOrderNotification: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `/admin/fake-order-notifications/${id}`, method: "DELETE" }),
      transformResponse: () => ({ ok: true }),
      invalidatesTags: [{ type: "FakeOrders", id: "LIST" }],
    }),

    /* ================= ADMIN: SETTINGS ================= */

    getFakeNotificationSettings: b.query<FakeNotificationSettings, void>({
      query: () => ({ url: `/admin/site-settings/fake-notification-config` }),
      transformResponse: (r: unknown) => normalizeSettings(r),
      providesTags: [{ type: "FakeOrderSettings" as const, id: "CFG" }],
    }),

    updateFakeNotificationSettings: b.mutation<FakeNotificationSettings, Partial<FakeNotificationSettings>>({
      query: (patch) => ({ url: `/admin/site-settings/fake-notification-config`, method: "PUT", body: patch }),
      transformResponse: (r: unknown) => normalizeSettings(r),
      invalidatesTags: [{ type: "FakeOrderSettings", id: "CFG" }],
    }),

    /* ================= PUBLIC ================= */

    getPublicFakeNotificationSettings: b.query<FakeNotificationSettings, void>({
      query: () => ({ url: `/site-settings/fake-notification-config` }),
      transformResponse: (r: unknown) => normalizeSettings(r),
      providesTags: [{ type: "FakeOrderSettings" as const, id: "CFG_PUBLIC" }],
    }),

    listPublicFakeOrders: b.query<FakeOrderNotification[], void>({
      query: () => ({ url: `/fake-order-notifications` }),
      transformResponse: (rows: unknown): FakeOrderNotification[] =>
        (Array.isArray(rows) ? rows : []).map(normalizeFake),
    }),

    getPublicRandomFakeOrder: b.query<FakeOrderNotification, void>({
      query: () => ({ url: `/fake-order-notifications/random` }),
      transformResponse: (r: unknown) => normalizeFake(r),
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

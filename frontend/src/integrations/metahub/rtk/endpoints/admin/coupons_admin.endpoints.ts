
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/coupons_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../../baseApi";

// helpers
const toNumber = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));
const toNullableNumber = (x: unknown): number | null => (x == null ? null : toNumber(x));
const toBool = (x: unknown): boolean => {
  if (typeof x === "boolean") return x;
  if (typeof x === "number") return x !== 0;
  const s = String(x).toLowerCase();
  return s === "true" || s === "1";
};
const toIso = (x: unknown): string | null => {
  if (!x) return null;
  const d = typeof x === "string" ? new Date(x) : (x as Date);
  return new Date(d).toISOString();
};
const tryParse = <T>(x: unknown): T => {
  if (typeof x === "string") { try { return JSON.parse(x) as T; } catch { /* ignore */ } }
  return x as T;
};
const tryParseArray = <T>(x: unknown): T[] => {
  if (Array.isArray(x)) return x as T[];
  return tryParse<T[]>(x);
};

export type CouponDiscountType = "percent" | "fixed";
export type CouponScope = "order" | "product" | "category";
export type CouponUsageType = "single_use" | "multi_use";

export type Coupon = {
  id: string;
  code: string;
  title: string | null;
  description: string | null;
  discount_type: CouponDiscountType;
  discount_value: number;       // percent (0-100) or minor units
  currency: string | null;      // required if fixed
  scope: CouponScope;           // which entities it applies to
  product_ids: string[] | null;
  category_ids: string[] | null;
  min_order_total: number | null; // minor units
  max_redemptions: number | null;  // overall cap
  per_user_limit: number | null;   // per user cap
  usage_type: CouponUsageType;     // single/multi
  start_date: string | null;       // ISO
  end_date: string | null;         // ISO
  is_active: boolean;
  metadata?: Record<string, unknown> | null;
  created_at: string;              // ISO
  updated_at: string | null;       // ISO
};

export type ApiCoupon = Omit<Coupon,
  | "discount_value" | "product_ids" | "category_ids" | "min_order_total"
  | "max_redemptions" | "per_user_limit" | "is_active" | "start_date" | "end_date" | "updated_at"
> & {
  discount_value: number | string;
  product_ids: string | string[] | null;
  category_ids: string | string[] | null;
  min_order_total: number | string | null;
  max_redemptions: number | string | null;
  per_user_limit: number | string | null;
  is_active: boolean | 0 | 1 | "0" | "1" | string;
  start_date: string | null;
  end_date: string | null;
  updated_at: string | null;
};

const normalizeCoupon = (c: ApiCoupon): Coupon => ({
  ...c,
  title: (c.title ?? null) as string | null,
  description: (c.description ?? null) as string | null,
  discount_value: toNumber(c.discount_value),
  currency: (c.currency ?? null) as string | null,
  product_ids: c.product_ids == null ? null : tryParseArray<string>(c.product_ids),
  category_ids: c.category_ids == null ? null : tryParseArray<string>(c.category_ids),
  min_order_total: toNullableNumber(c.min_order_total),
  max_redemptions: toNullableNumber(c.max_redemptions),
  per_user_limit: toNullableNumber(c.per_user_limit),
  is_active: toBool(c.is_active),
  start_date: c.start_date ? toIso(c.start_date) : null,
  end_date: c.end_date ? toIso(c.end_date) : null,
  metadata: (c.metadata ?? null) as Record<string, unknown> | null,
  updated_at: c.updated_at ? toIso(c.updated_at) : null,
});

export type CouponListParams = {
  q?: string; // code/title
  active?: boolean;
  scope?: CouponScope;
  created_from?: string; created_to?: string; // ISO
  start_from?: string; start_to?: string;     // ISO
  end_from?: string; end_to?: string;         // ISO
  limit?: number; offset?: number;
  sort?: "created_at" | "updated_at" | "start_date" | "end_date" | "code";
  order?: "asc" | "desc";
};

export type CreateCouponBody = Omit<Coupon,
  | "id" | "created_at" | "updated_at" | "is_active" | "metadata"
> & { is_active?: boolean; metadata?: Record<string, unknown> | null };

export type UpdateCouponBody = Partial<CreateCouponBody>;

export type CouponUsage = {
  id: string;
  coupon_id: string;
  user_id: string | null;
  order_id: string | null;
  amount_discounted: number; // minor units
  created_at: string;        // ISO
};

export type ApiCouponUsage = Omit<CouponUsage, "amount_discounted"> & { amount_discounted: number | string };

const normalizeUsage = (u: ApiCouponUsage): CouponUsage => ({
  ...u,
  amount_discounted: toNumber(u.amount_discounted),
});

export type CouponStats = {
  coupon_id: string;
  total_redemptions: number;
  unique_users: number;
  total_discount_amount: number; // minor units
};

export type ApiCouponStats = Omit<CouponStats, "total_redemptions" | "unique_users" | "total_discount_amount"> & {
  total_redemptions: number | string;
  unique_users: number | string;
  total_discount_amount: number | string;
};

const normalizeStats = (s: ApiCouponStats): CouponStats => ({
  ...s,
  total_redemptions: toNumber(s.total_redemptions),
  unique_users: toNumber(s.unique_users),
  total_discount_amount: toNumber(s.total_discount_amount),
});

export type CouponsExportParams = CouponListParams & { format?: "csv" | "xlsx" };
export type ExportResponse = { url: string; expires_at: string | null };

export const couponsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listCouponsAdmin: b.query<Coupon[], CouponListParams | void>({
      query: (params) => ({ url: "/coupons", params }),
      transformResponse: (res: unknown): Coupon[] => {
        if (Array.isArray(res)) return (res as ApiCoupon[]).map(normalizeCoupon);
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as ApiCoupon[]).map(normalizeCoupon) : [];
      },
      providesTags: (result) => result ? [
        ...result.map((c) => ({ type: "Coupons" as const, id: c.id })),
        { type: "Coupons" as const, id: "LIST" },
      ] : [{ type: "Coupons" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getCouponAdminById: b.query<Coupon, string>({
      query: (id) => ({ url: `/coupons/${id}` }),
      transformResponse: (res: unknown): Coupon => normalizeCoupon(res as ApiCoupon),
      providesTags: (_r, _e, id) => [{ type: "Coupons", id }],
    }),

    createCouponAdmin: b.mutation<Coupon, CreateCouponBody>({
      query: (body) => ({ url: "/coupons", method: "POST", body }),
      transformResponse: (res: unknown): Coupon => normalizeCoupon(res as ApiCoupon),
      invalidatesTags: [{ type: "Coupons", id: "LIST" }],
    }),

    updateCouponAdmin: b.mutation<Coupon, { id: string; body: UpdateCouponBody }>({
      query: ({ id, body }) => ({ url: `/coupons/${id}`, method: "PATCH", body }),
      transformResponse: (res: unknown): Coupon => normalizeCoupon(res as ApiCoupon),
      invalidatesTags: (_r, _e, arg) => [{ type: "Coupons", id: arg.id }, { type: "Coupons", id: "LIST" }],
    }),

    toggleCouponAdmin: b.mutation<Coupon, { id: string; active: boolean }>({
      query: ({ id, active }) => ({ url: `/coupons/${id}/${active ? "enable" : "disable"}`, method: "POST" }),
      transformResponse: (res: unknown): Coupon => normalizeCoupon(res as ApiCoupon),
      invalidatesTags: (_r, _e, arg) => [{ type: "Coupons", id: arg.id }, { type: "Coupons", id: "LIST" }],
    }),

    deleteCouponAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `/coupons/${id}`, method: "DELETE" }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: "Coupons", id: "LIST" }],
    }),

    listCouponUsageAdmin: b.query<CouponUsage[], { id: string; limit?: number; offset?: number }>({
      query: ({ id, limit, offset }) => ({ url: `/coupons/${id}/usage`, params: { limit, offset } }),
      transformResponse: (res: unknown): CouponUsage[] => Array.isArray(res) ? (res as ApiCouponUsage[]).map(normalizeUsage) : [],
      providesTags: (_r, _e, arg) => [{ type: "Coupons", id: `USG_${arg.id}` }],
    }),

    couponStatsAdmin: b.query<CouponStats, string>({
      query: (id) => ({ url: `/coupons/${id}/stats` }),
      transformResponse: (res: unknown): CouponStats => normalizeStats(res as ApiCouponStats),
      providesTags: (_r, _e, id) => [{ type: "Coupons", id: `STS_${id}` }],
    }),

    exportCouponsAdmin: b.mutation<ExportResponse, CouponsExportParams | void>({
      query: (params) => ({ url: `/coupons/export`, method: "GET", params }),
      transformResponse: (res: unknown): ExportResponse => {
        const r = res as { url?: unknown; expires_at?: unknown };
        return { url: String(r?.url ?? ""), expires_at: r?.expires_at ? toIso(r.expires_at) : null };
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useListCouponsAdminQuery,
  useGetCouponAdminByIdQuery,
  useCreateCouponAdminMutation,
  useUpdateCouponAdminMutation,
  useToggleCouponAdminMutation,
  useDeleteCouponAdminMutation,
  useListCouponUsageAdminQuery,
  useCouponStatsAdminQuery,
  useExportCouponsAdminMutation,
} = couponsAdminApi;

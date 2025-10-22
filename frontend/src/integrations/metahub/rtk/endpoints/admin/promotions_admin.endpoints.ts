
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/promotions_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi as baseApi2 } from "../../baseApi";

// Reuse helpers by redeclaring (no shared util to keep file-local)
const nToNumber = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));
const nToBool = (x: unknown): boolean => {
  if (typeof x === "boolean") return x;
  if (typeof x === "number") return x !== 0;
  const s = String(x).toLowerCase();
  return s === "true" || s === "1";
};
const nToIso = (x: unknown): string | null => (!x ? null : new Date(x as string | number | Date).toISOString());
const nTryParse = <T>(x: unknown): T => {
  if (typeof x === "string") { try { return JSON.parse(x) as T; } catch { } }
  return x as T;
};

export type PromotionType = "automatic" | "coupon_attached"; // automatic rules or attach-to-coupon extra rules
export type RewardType = "percent_off" | "fixed_off" | "free_item" | "free_shipping";

export type Promotion = {
  id: string;
  name: string;
  description: string | null;
  type: PromotionType;
  is_active: boolean;
  start_date: string | null; // ISO
  end_date: string | null;   // ISO
  // Conditions/Rules
  min_items?: number | null;
  min_order_total?: number | null; // minor units
  include_product_ids?: string[] | null;
  include_category_ids?: string[] | null;
  exclude_product_ids?: string[] | null;
  exclude_category_ids?: string[] | null;
  // Reward
  reward_type: RewardType;
  reward_value?: number | null; // percent or fixed minor units
  reward_product_id?: string | null; // for free_item
  currency?: string | null; // for fixed_off
  metadata?: Record<string, unknown> | null;
  created_at: string; // ISO
  updated_at: string | null; // ISO
};

export type ApiPromotion = Omit<Promotion,
  | "is_active" | "start_date" | "end_date" | "min_items" | "min_order_total"
  | "include_product_ids" | "include_category_ids" | "exclude_product_ids" | "exclude_category_ids"
  | "reward_value" | "updated_at"
> & {
  is_active: boolean | 0 | 1 | "0" | "1" | string;
  start_date: string | null;
  end_date: string | null;
  min_items?: number | string | null;
  min_order_total?: number | string | null;
  include_product_ids?: string | string[] | null;
  include_category_ids?: string | string[] | null;
  exclude_product_ids?: string | string[] | null;
  exclude_category_ids?: string | string[] | null;
  reward_value?: number | string | null;
  updated_at: string | null;
};

const arr = <T>(x: unknown): T[] | null => (x == null ? null : Array.isArray(x) ? (x as T[]) : nTryParse<T[]>(x));

const normalizePromotion = (p: ApiPromotion): Promotion => ({
  ...p,
  description: (p.description ?? null) as string | null,
  is_active: nToBool(p.is_active),
  start_date: p.start_date ? nToIso(p.start_date) : null,
  end_date: p.end_date ? nToIso(p.end_date) : null,
  min_items: p.min_items == null ? null : nToNumber(p.min_items),
  min_order_total: p.min_order_total == null ? null : nToNumber(p.min_order_total),
  include_product_ids: arr<string>(p.include_product_ids),
  include_category_ids: arr<string>(p.include_category_ids),
  exclude_product_ids: arr<string>(p.exclude_product_ids),
  exclude_category_ids: arr<string>(p.exclude_category_ids),
  reward_value: p.reward_value == null ? null : nToNumber(p.reward_value),
  reward_product_id: (p.reward_product_id ?? null) as string | null,
  currency: (p.currency ?? null) as string | null,
  metadata: (p.metadata ?? null) as Record<string, unknown> | null,
  updated_at: p.updated_at ? nToIso(p.updated_at) : null,
});

export type PromotionListParams = {
  q?: string;
  active?: boolean;
  type?: PromotionType;
  created_from?: string; created_to?: string; // ISO
  start_from?: string; start_to?: string;
  end_from?: string; end_to?: string;
  limit?: number; offset?: number;
  sort?: "created_at" | "updated_at" | "start_date" | "end_date" | "name";
  order?: "asc" | "desc";
};

export type CreatePromotionBody = Omit<Promotion,
  | "id" | "created_at" | "updated_at" | "metadata" | "is_active"
> & { is_active?: boolean; metadata?: Record<string, unknown> | null };

export type UpdatePromotionBody = Partial<CreatePromotionBody>;

export type PromotionsExportParams = PromotionListParams & { format?: "csv" | "xlsx" };

export const promotionsAdminApi = baseApi2.injectEndpoints({
  endpoints: (b) => ({
    listPromotionsAdmin: b.query<Promotion[], PromotionListParams | void>({
      query: (params) => ({ url: "/promotions", params }),
      transformResponse: (res: unknown): Promotion[] => {
        if (Array.isArray(res)) return (res as ApiPromotion[]).map(normalizePromotion);
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as ApiPromotion[]).map(normalizePromotion) : [];
      },
      providesTags: (result) => result ? [
        ...result.map((p) => ({ type: "Promotions" as const, id: p.id })),
        { type: "Promotions" as const, id: "LIST" },
      ] : [{ type: "Promotions" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getPromotionAdminById: b.query<Promotion, string>({
      query: (id) => ({ url: `/promotions/${id}` }),
      transformResponse: (res: unknown): Promotion => normalizePromotion(res as ApiPromotion),
      providesTags: (_r, _e, id) => [{ type: "Promotions", id }],
    }),

    createPromotionAdmin: b.mutation<Promotion, CreatePromotionBody>({
      query: (body) => ({ url: "/promotions", method: "POST", body }),
      transformResponse: (res: unknown): Promotion => normalizePromotion(res as ApiPromotion),
      invalidatesTags: [{ type: "Promotions", id: "LIST" }],
    }),

    updatePromotionAdmin: b.mutation<Promotion, { id: string; body: UpdatePromotionBody }>({
      query: ({ id, body }) => ({ url: `/promotions/${id}`, method: "PATCH", body }),
      transformResponse: (res: unknown): Promotion => normalizePromotion(res as ApiPromotion),
      invalidatesTags: (_r, _e, arg) => [{ type: "Promotions", id: arg.id }, { type: "Promotions", id: "LIST" }],
    }),

    togglePromotionAdmin: b.mutation<Promotion, { id: string; active: boolean }>({
      query: ({ id, active }) => ({ url: `/promotions/${id}/${active ? "enable" : "disable"}`, method: "POST" }),
      transformResponse: (res: unknown): Promotion => normalizePromotion(res as ApiPromotion),
      invalidatesTags: (_r, _e, arg) => [{ type: "Promotions", id: arg.id }, { type: "Promotions", id: "LIST" }],
    }),

    exportPromotionsAdmin: b.mutation<ExportResponse, PromotionsExportParams | void>({
      query: (params) => ({ url: `/promotions/export`, method: "GET", params }),
      transformResponse: (res: unknown): ExportResponse => {
        const r = res as { url?: unknown; expires_at?: unknown };
        return { url: String(r?.url ?? ""), expires_at: r?.expires_at ? nToIso(r.expires_at) : null };
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useListPromotionsAdminQuery,
  useGetPromotionAdminByIdQuery,
  useCreatePromotionAdminMutation,
  useUpdatePromotionAdminMutation,
  useTogglePromotionAdminMutation,
  useExportPromotionsAdminMutation,
} = promotionsAdminApi;
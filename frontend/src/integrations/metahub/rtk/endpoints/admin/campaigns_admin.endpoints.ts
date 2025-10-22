
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/campaigns_admin.endpoints.ts
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
  if (typeof x === "string") {
    try { return JSON.parse(x) as T; } catch { /* keep */ }
  }
  return x as T;
};
const toStringArray = (x: unknown): string[] | null => {
  if (x == null) return null;
  if (Array.isArray(x)) return x.map((v) => String(v));
  if (typeof x === "string") {
    try { const arr = JSON.parse(x); return Array.isArray(arr) ? arr.map((v) => String(v)) : (x ? x.split(",").map((v) => v.trim()).filter(Boolean) : []); }
    catch { return x ? x.split(",").map((v) => v.trim()).filter(Boolean) : []; }
  }
  return [];
};

export type DiscountType = "percent" | "fixed";
export type CampaignMode = "automatic" | "code";
export type CampaignScope = "order" | "product";
export type AppliesTo = "all" | "categories" | "products";

export type Condition =
  | { type: "min_order_total"; value: number }
  | { type: "category_in"; ids: string[] }
  | { type: "product_in"; ids: string[] }
  | { type: "user_segment"; segment: string }
  | { type: "new_customer"; value: boolean }
  | { type: "has_coupon"; code?: string | null }
  | { type: "weekday_in"; days: number[] };

export type Campaign = {
  id: string;
  name: string;
  slug: string | null;
  code: string | null;               // if mode = code
  mode: CampaignMode;                // automatic/code
  scope: CampaignScope;              // order/product
  discount_type: DiscountType;       // percent/fixed
  discount_value: number;            // percent: 0-100, fixed: currency unit/minor unit (BE decided)
  currency: string | null;           // for fixed discounts
  applies_to: AppliesTo;             // all/categories/products
  product_ids: string[] | null;      // if applies_to = products
  category_ids: string[] | null;     // if applies_to = categories
  conditions: Condition[] | null;    // extra rules
  starts_at: string | null;          // ISO
  ends_at: string | null;            // ISO
  priority: number;                  // conflict resolution
  is_active: boolean;
  stackable: boolean;                // can stack with coupons/other campaigns
  usage_limit: number | null;        // total lifetime limit
  used_count: number;                // denormalized usage
  per_user_limit: number | null;     // per user limit
  metadata?: Record<string, unknown> | null;
  created_at: string;                // ISO
  updated_at: string | null;         // ISO
};

export type ApiCampaign = Omit<Campaign,
  | "discount_value" | "priority" | "is_active" | "stackable" | "usage_limit" | "used_count" | "per_user_limit"
  | "product_ids" | "category_ids" | "conditions" | "starts_at" | "ends_at" | "updated_at"
> & {
  discount_value: number | string;
  priority: number | string;
  is_active: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  stackable: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  usage_limit: number | string | null;
  used_count: number | string;
  per_user_limit: number | string | null;
  product_ids: string | string[] | null;
  category_ids: string | string[] | null;
  conditions: string | Condition[] | null;
  starts_at: string | null;
  ends_at: string | null;
  updated_at: string | null;
};

const normalizeCampaign = (c: ApiCampaign): Campaign => ({
  ...c,
  slug: (c.slug ?? null) as string | null,
  code: (c.code ?? null) as string | null,
  currency: (c.currency ?? null) as string | null,
  product_ids: toStringArray(c.product_ids),
  category_ids: toStringArray(c.category_ids),
  conditions: c.conditions == null ? null : tryParse<Condition[]>(c.conditions),
  discount_value: toNumber(c.discount_value),
  priority: toNumber(c.priority),
  is_active: toBool(c.is_active),
  stackable: toBool(c.stackable),
  usage_limit: toNullableNumber(c.usage_limit),
  used_count: toNumber(c.used_count),
  per_user_limit: toNullableNumber(c.per_user_limit),
  starts_at: c.starts_at ? toIso(c.starts_at) : null,
  ends_at: c.ends_at ? toIso(c.ends_at) : null,
  metadata: (c.metadata ?? null) as Record<string, unknown> | null,
  updated_at: c.updated_at ? toIso(c.updated_at) : null,
});

export type CampaignUsage = {
  id: string;
  campaign_id: string;
  order_id: string | null;
  user_id: string | null;
  amount_discounted: number;
  created_at: string; // ISO
};

export type ApiCampaignUsage = Omit<CampaignUsage, "amount_discounted"> & { amount_discounted: number | string };

const normalizeUsage = (u: ApiCampaignUsage): CampaignUsage => ({
  ...u,
  order_id: (u.order_id ?? null) as string | null,
  user_id: (u.user_id ?? null) as string | null,
  amount_discounted: toNumber(u.amount_discounted),
});

export type ListParams = {
  q?: string; // search in name/code/slug
  mode?: CampaignMode;
  scope?: CampaignScope;
  discount_type?: DiscountType;
  applies_to?: AppliesTo;
  is_active?: boolean;
  starts_at?: string; ends_at?: string;
  min_value?: number; max_value?: number;
  limit?: number; offset?: number;
  sort?: "created_at" | "updated_at" | "used_count" | "discount_value" | "priority" | "name";
  order?: "asc" | "desc";
};

export type CreateCampaignBody = Omit<Campaign, "id" | "created_at" | "updated_at" | "used_count">;
export type UpdateCampaignBody = Partial<CreateCampaignBody>;
export type ToggleCampaignBody = { is_active: boolean };

// Preview API — evaluate a campaign against cart snapshot
export type PreviewItem = { product_id: string; qty: number; price: number };
export type PreviewBody = { items: PreviewItem[]; user_id?: string | null; coupon_code?: string | null; currency?: string | null; subtotal?: number | null };
export type PreviewResult = { applicable: boolean; discount_amount: number; breakdown?: string | null; message?: string | null };
export type ApiPreviewResult = Omit<PreviewResult, "discount_amount"> & { discount_amount: number | string };

const normalizePreview = (r: ApiPreviewResult): PreviewResult => ({ ...r, discount_amount: toNumber(r.discount_amount) });

export const campaignsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listCampaignsAdmin: b.query<Campaign[], ListParams | void>({
      query: (params) => ({ url: "/campaigns", params }),
      transformResponse: (res: unknown): Campaign[] => {
        if (Array.isArray(res)) return (res as ApiCampaign[]).map(normalizeCampaign);
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as ApiCampaign[]).map(normalizeCampaign) : [];
      },
      providesTags: (result) => result ? [
        ...result.map((c) => ({ type: "Campaigns" as const, id: c.id })),
        { type: "Campaigns" as const, id: "LIST" },
      ] : [{ type: "Campaigns" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getCampaignAdminById: b.query<Campaign, string>({
      query: (id) => ({ url: `/campaigns/${id}` }),
      transformResponse: (res: unknown): Campaign => normalizeCampaign(res as ApiCampaign),
      providesTags: (_r, _e, id) => [{ type: "Campaigns", id }],
    }),

    createCampaignAdmin: b.mutation<Campaign, CreateCampaignBody>({
      query: (body) => ({ url: `/campaigns`, method: "POST", body }),
      transformResponse: (res: unknown): Campaign => normalizeCampaign(res as ApiCampaign),
      invalidatesTags: [{ type: "Campaigns", id: "LIST" }],
    }),

    updateCampaignAdmin: b.mutation<Campaign, { id: string; body: UpdateCampaignBody }>({
      query: ({ id, body }) => ({ url: `/campaigns/${id}`, method: "PATCH", body }),
      transformResponse: (res: unknown): Campaign => normalizeCampaign(res as ApiCampaign),
      invalidatesTags: (_r, _e, arg) => [{ type: "Campaigns", id: arg.id }, { type: "Campaigns", id: "LIST" }],
    }),

    toggleCampaignAdmin: b.mutation<Campaign, { id: string; body: ToggleCampaignBody }>({
      query: ({ id, body }) => ({ url: `/campaigns/${id}/toggle`, method: "POST", body }),
      transformResponse: (res: unknown): Campaign => normalizeCampaign(res as ApiCampaign),
      invalidatesTags: (_r, _e, arg) => [{ type: "Campaigns", id: arg.id }, { type: "Campaigns", id: "LIST" }],
    }),

    deleteCampaignAdmin: b.mutation<{ success: true }, string>({
      query: (id) => ({ url: `/campaigns/${id}`, method: "DELETE" }),
      transformResponse: (_res: unknown) => ({ success: true as const }),
      invalidatesTags: (_r, _e, id) => [{ type: "Campaigns", id }, { type: "Campaigns", id: "LIST" }],
    }),

    listCampaignUsagesAdmin: b.query<CampaignUsage[], { id: string; limit?: number; offset?: number }>({
      query: ({ id, limit, offset }) => ({ url: `/campaigns/${id}/usages`, params: { limit, offset } }),
      transformResponse: (res: unknown): CampaignUsage[] => Array.isArray(res) ? (res as ApiCampaignUsage[]).map(normalizeUsage) : [],
      providesTags: (_r, _e, arg) => [{ type: "Campaigns", id: `USAGES_${arg.id}` }],
    }),

    previewCampaignAdmin: b.mutation<PreviewResult, { id: string; body: PreviewBody }>({
      query: ({ id, body }) => ({ url: `/campaigns/${id}/preview`, method: "POST", body }),
      transformResponse: (res: unknown): PreviewResult => normalizePreview(res as ApiPreviewResult),
    }),
  }),
  overrideExisting: true,
});

export const {
  useListCampaignsAdminQuery,
  useGetCampaignAdminByIdQuery,
  useCreateCampaignAdminMutation,
  useUpdateCampaignAdminMutation,
  useToggleCampaignAdminMutation,
  useDeleteCampaignAdminMutation,
  useListCampaignUsagesAdminQuery,
  usePreviewCampaignAdminMutation,
} = campaignsAdminApi;
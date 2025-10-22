
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/variants_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../../baseApi";

// helpers
const toNumber = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));
const toBool = (x: unknown): boolean => {
  if (typeof x === "boolean") return x;
  if (typeof x === "number") return x !== 0;
  const s = String(x).toLowerCase();
  return s === "true" || s === "1";
};
const tryParse = <T = unknown>(x: unknown): T | null => {
  if (typeof x === "string") {
    const s = x.trim();
    if ((s.startsWith("{") && s.endsWith("}")) || (s.startsWith("[") && s.endsWith("]"))) {
      try { return JSON.parse(s) as T; } catch { return null; }
    }
  }
  return (x as T) ?? null;
};

export type VariantOptionPair = { key: string; value: string | number };

export type Variant = {
  id: string;
  name: string; // e.g., "4K | 1 Kullanıcı | 1 Ay"
  key: string; // machine key / code
  sku: string | null;
  image_url: string | null;
  price_diff: number | null; // delta from product price (positive/negative)
  stock: number | null;
  option_values: VariantOptionPair[] | null; // describes this variant via option key/values
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
};

export type ApiVariant = Omit<Variant,
  | "price_diff" | "stock" | "option_values"
  | "is_active" | "display_order"
> & {
  price_diff: number | string | null;
  stock: number | string | null;
  option_values: string | VariantOptionPair[] | null;
  is_active: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  display_order: number | string;
};

const normalizeVariant = (v: ApiVariant): Variant => ({
  ...v,
  sku: (v.sku ?? null) as string | null,
  image_url: (v.image_url ?? null) as string | null,
  price_diff: v.price_diff == null ? null : toNumber(v.price_diff),
  stock: v.stock == null ? null : toNumber(v.stock),
  option_values: Array.isArray(v.option_values)
    ? v.option_values
    : (typeof v.option_values === "string" ? tryParse<VariantOptionPair[]>(v.option_values) : null),
  is_active: toBool(v.is_active),
  display_order: toNumber(v.display_order),
});

export type ListParams = {
  q?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
  sort?: "name" | "display_order" | "created_at" | "updated_at" | "stock";
  order?: "asc" | "desc";
};

export type UpsertVariantBody = {
  name: string;
  key: string;
  sku?: string | null;
  image_url?: string | null;
  price_diff?: number | null;
  stock?: number | null;
  option_values?: VariantOptionPair[] | null;
  is_active?: boolean;
  display_order?: number;
};

export const variantsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listVariantsAdmin: b.query<Variant[], ListParams | void>({
      query: (params) => ({ url: "/variants", params }),
      transformResponse: (res: unknown): Variant[] => Array.isArray(res) ? (res as ApiVariant[]).map(normalizeVariant) : [],
      providesTags: (result) => result ? [
        ...result.map((v) => ({ type: "Variants" as const, id: v.id })),
        { type: "Variants" as const, id: "LIST" },
      ] : [{ type: "Variants" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    listVariantsByProductAdmin: b.query<Variant[], string>({
      query: (productId) => ({ url: `/variants/by-product/${productId}` }),
      transformResponse: (res: unknown): Variant[] => Array.isArray(res) ? (res as ApiVariant[]).map(normalizeVariant) : [],
      providesTags: (_r, _e, productId) => [{ type: "Variants", id: `PRODUCT_${productId}` }],
    }),

    getVariantAdminById: b.query<Variant, string>({
      query: (id) => ({ url: `/variants/${id}` }),
      transformResponse: (res: unknown): Variant => normalizeVariant(res as ApiVariant),
      providesTags: (_r, _e, id) => [{ type: "Variants", id }],
    }),

    createVariantAdmin: b.mutation<Variant, UpsertVariantBody>({
      query: (body) => ({ url: "/variants", method: "POST", body }),
      transformResponse: (res: unknown): Variant => normalizeVariant(res as ApiVariant),
      invalidatesTags: [{ type: "Variants", id: "LIST" }],
    }),

    updateVariantAdmin: b.mutation<Variant, { id: string; body: UpsertVariantBody }>({
      query: ({ id, body }) => ({ url: `/variants/${id}`, method: "PUT", body }),
      transformResponse: (res: unknown): Variant => normalizeVariant(res as ApiVariant),
      invalidatesTags: (_r, _e, arg) => [{ type: "Variants", id: arg.id }, { type: "Variants", id: "LIST" }],
    }),

    deleteVariantAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `/variants/${id}`, method: "DELETE" }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, id) => [{ type: "Variants", id }, { type: "Variants", id: "LIST" }],
    }),

    reorderVariantsAdmin: b.mutation<{ ok: true }, Array<{ id: string; display_order: number }>>({
      query: (items) => ({ url: "/variants/reorder", method: "POST", body: { items } }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: [{ type: "Variants", id: "LIST" }],
    }),

    toggleActiveVariantAdmin: b.mutation<Variant, { id: string; is_active: boolean }>({
      query: ({ id, is_active }) => ({ url: `/variants/${id}/active`, method: "PATCH", body: { is_active } }),
      transformResponse: (res: unknown): Variant => normalizeVariant(res as ApiVariant),
      invalidatesTags: (_r, _e, arg) => [{ type: "Variants", id: arg.id }, { type: "Variants", id: "LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListVariantsAdminQuery,
  useListVariantsByProductAdminQuery,
  useGetVariantAdminByIdQuery,
  useCreateVariantAdminMutation,
  useUpdateVariantAdminMutation,
  useDeleteVariantAdminMutation,
  useReorderVariantsAdminMutation,
  useToggleActiveVariantAdminMutation,
} = variantsAdminApi;

// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/product_variants.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../baseApi";

// --- helpers ---
const toNumber = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));
const numOrNull = (x: unknown): number | null => (x == null ? null : toNumber(x));
const tryParse = <T>(x: unknown): T => {
  if (typeof x === "string") { try { return JSON.parse(x) as T; } catch { /* noop */ } }
  return x as T;
};

// --- types ---
export type Variant = {
  id: string;
  product_id: string;
  sku?: string | null;
  barcode?: string | null;
  price: number;
  compare_at_price?: number | null;
  currency: string;
  weight_gram?: number | null;
  attributes?: Record<string, unknown> | null;
  media?: Array<{ url: string; alt?: string | null }> | null;
  is_active?: 0 | 1 | boolean;
  created_at?: string;
  updated_at?: string;
};

type ApiVariant = Omit<Variant, "price" | "compare_at_price" | "weight_gram" | "attributes" | "media"> & {
  price: number | string;
  compare_at_price?: number | string | null;
  weight_gram?: number | string | null;
  attributes?: string | Variant["attributes"];
  media?: string | Variant["media"];
};

const normalizeVariant = (v: ApiVariant): Variant => ({
  ...v,
  price: toNumber(v.price),
  compare_at_price: numOrNull(v.compare_at_price as unknown),
  weight_gram: numOrNull(v.weight_gram as unknown),
  attributes: v.attributes ? tryParse<Variant["attributes"]>(v.attributes) : null,
  media: v.media ? tryParse<Variant["media"]>(v.media) : null,
});

export type UpsertVariantBody = Partial<Omit<Variant, "id" | "created_at" | "updated_at">> & { id?: string; product_id: string };

export const productVariantsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listProductVariants: b.query<
      Variant[],
      { product_id?: string; is_active?: 0 | 1 | boolean; limit?: number; offset?: number; sort?: "created_at" | "price"; order?: "asc" | "desc" }
    >({
      query: (params) => ({ url: "/product_variants", params }),
      transformResponse: (res: unknown): Variant[] => Array.isArray(res) ? (res as ApiVariant[]).map(normalizeVariant) : [],
      providesTags: (result, _e, args) => {
        const base = [{ type: "Variants" as const, id: "LIST" }];
        const scoped = args?.product_id ? [{ type: "Variants" as const, id: `PRODUCT_${args.product_id}` }] : [];
        const rows = result ? result.map((r) => ({ type: "Variant" as const, id: r.id })) : [];
        return [...rows, ...scoped, ...base];
      },
    }),

    getVariantById: b.query<Variant, string>({
      query: (id) => ({ url: `/product_variants/${id}` }),
      transformResponse: (res: unknown): Variant => normalizeVariant(res as ApiVariant),
      providesTags: (_r, _e, id) => [{ type: "Variant", id }],
    }),

    createVariant: b.mutation<Variant, Omit<UpsertVariantBody, "id">>({
      query: (body) => ({ url: "/product_variants", method: "POST", body }),
      transformResponse: (res: unknown): Variant => normalizeVariant(res as ApiVariant),
      invalidatesTags: (r) => r ? [
        { type: "Variants" as const, id: "LIST" },
        { type: "Variants" as const, id: `PRODUCT_${r.product_id}` },
      ] : [{ type: "Variants" as const, id: "LIST" }],
    }),

    updateVariant: b.mutation<Variant, { id: string; patch: Partial<UpsertVariantBody> }>({
      query: ({ id, patch }) => ({ url: `/product_variants/${id}`, method: "PATCH", body: patch }),
      transformResponse: (res: unknown): Variant => normalizeVariant(res as ApiVariant),
      invalidatesTags: (r) => r ? [ { type: "Variant" as const, id: r.id }, { type: "Variants" as const, id: `PRODUCT_${r.product_id}` } ] : [],
    }),

    deleteVariant: b.mutation<{ success: true }, { id: string; product_id: string }>({
      query: ({ id }) => ({ url: `/product_variants/${id}`, method: "DELETE" }),
      transformResponse: (res: unknown): { success: true } => (res as { success: true }) ?? { success: true },
      invalidatesTags: (_r, _e, a) => [ { type: "Variant" as const, id: a.id }, { type: "Variants" as const, id: `PRODUCT_${a.product_id}` } ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListProductVariantsQuery,
  useGetVariantByIdQuery,
  useCreateVariantMutation,
  useUpdateVariantMutation,
  useDeleteVariantMutation,
} = productVariantsApi;
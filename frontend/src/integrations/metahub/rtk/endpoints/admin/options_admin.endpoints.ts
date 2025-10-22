
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/options_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi as baseApi2 } from "../../baseApi";

const toIso2 = (x: unknown): string => new Date(x as string | number | Date).toISOString();
const tryParse2 = <T>(x: unknown): T => { if (typeof x === "string") { try { return JSON.parse(x) as T; } catch { /* ignore */ } } return x as T; };

export type OptionGroup = { id: string; product_id: string; name: string; slug: string; values: string[]; required: boolean; created_at: string; updated_at: string };
export type ApiOptionGroup = Omit<OptionGroup, "values" | "created_at" | "updated_at"> & { values: string | string[]; created_at: string | number | Date; updated_at: string | number | Date };

const normalizeOptionGroup = (g: ApiOptionGroup): OptionGroup => ({
  ...g,
  values: Array.isArray(g.values) ? g.values.map(String) : tryParse2<string[]>(g.values),
  created_at: toIso2(g.created_at),
  updated_at: toIso2(g.updated_at),
});

export type Variant = {
  id: string;
  product_id: string;
  sku: string;
  title: string | null;
  image_url: string | null;
  option_values: Record<string, string>;    // { Color: "Red", Size: "M" }
  price: number;
  original_price: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ApiVariant = Omit<Variant, "option_values" | "price" | "original_price" | "created_at" | "updated_at" | "is_active"> & {
  option_values: string | Record<string, string>;
  price: number | string;
  original_price: number | string | null;
  is_active: boolean | 0 | 1 | "0" | "1";
  created_at: string | number | Date;
  updated_at: string | number | Date;
};

const toNum2 = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));
const toBool2 = (x: unknown): boolean => (typeof x === "boolean" ? x : Number(x as unknown) === 1);

const normalizeVariant = (v: ApiVariant): Variant => ({
  ...v,
  option_values: typeof v.option_values === "string" ? tryParse2<Record<string, string>>(v.option_values) : v.option_values,
  price: toNum2(v.price),
  original_price: v.original_price == null ? null : toNum2(v.original_price),
  is_active: toBool2(v.is_active),
  created_at: toIso2(v.created_at),
  updated_at: toIso2(v.updated_at),
});

export type OptionGroupsListParams = { product_id: string };
export type VariantsListParams = { product_id: string; is_active?: boolean };
export type UpsertOptionGroupBody = Omit<OptionGroup, "id" | "created_at" | "updated_at">;
export type PatchOptionGroupBody = Partial<UpsertOptionGroupBody>;
export type UpsertVariantBody = Omit<Variant, "id" | "created_at" | "updated_at">;
export type PatchVariantBody = Partial<UpsertVariantBody>;

export const optionsAdminApi = baseApi2.injectEndpoints({
  endpoints: (b) => ({
    listOptionGroupsAdmin: b.query<OptionGroup[], OptionGroupsListParams>({
      query: (params) => ({ url: "/admin/option-groups", params }),
      transformResponse: (res: unknown): OptionGroup[] => Array.isArray(res) ? (res as ApiOptionGroup[]).map(normalizeOptionGroup) : [],
      providesTags: (result, _e, arg) => result ? [
        ...result.map((g) => ({ type: "OptionGroup" as const, id: g.id })),
        { type: "OptionGroups" as const, id: `PRODUCT_${arg.product_id}` },
      ] : [{ type: "OptionGroups" as const, id: `PRODUCT_${arg.product_id}` }],
    }),

    createOptionGroupAdmin: b.mutation<OptionGroup, UpsertOptionGroupBody>({
      query: (body) => ({ url: "/admin/option-groups", method: "POST", body }),
      transformResponse: (res: unknown): OptionGroup => normalizeOptionGroup(res as ApiOptionGroup),
      invalidatesTags: (_r, _e, arg) => [{ type: "OptionGroups" as const, id: `PRODUCT_${arg.product_id}` }],
    }),

    updateOptionGroupAdmin: b.mutation<OptionGroup, { id: string; body: PatchOptionGroupBody }>({
      query: ({ id, body }) => ({ url: `/admin/option-groups/${id}`, method: "PATCH", body }),
      transformResponse: (res: unknown): OptionGroup => normalizeOptionGroup(res as ApiOptionGroup),
      invalidatesTags: (res) => res ? [{ type: "OptionGroup" as const, id: res.id }] : [],
    }),

    deleteOptionGroupAdmin: b.mutation<{ ok: true }, { id: string; product_id: string }>({
      query: ({ id }) => ({ url: `/admin/option-groups/${id}`, method: "DELETE" }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [{ type: "OptionGroups" as const, id: `PRODUCT_${arg.product_id}` }],
    }),

    listVariantsAdmin: b.query<Variant[], VariantsListParams>({
      query: (params) => ({ url: "/admin/variants", params: { ...params, is_active: params.is_active == null ? undefined : params.is_active ? 1 : 0 } }),
      transformResponse: (res: unknown): Variant[] => Array.isArray(res) ? (res as ApiVariant[]).map(normalizeVariant) : [],
      providesTags: (result, _e, arg) => result ? [
        ...result.map((v) => ({ type: "Variant" as const, id: v.id })),
        { type: "Variants" as const, id: `PRODUCT_${arg.product_id}` },
      ] : [{ type: "Variants" as const, id: `PRODUCT_${arg.product_id}` }],
    }),

    createVariantAdmin: b.mutation<Variant, UpsertVariantBody>({
      query: (body) => ({ url: "/admin/variants", method: "POST", body }),
      transformResponse: (res: unknown): Variant => normalizeVariant(res as ApiVariant),
      invalidatesTags: (_r, _e, arg) => [{ type: "Variants" as const, id: `PRODUCT_${arg.product_id}` }, { type: "Product" as const, id: arg.product_id }],
    }),

    updateVariantAdmin: b.mutation<Variant, { id: string; body: PatchVariantBody }>({
      query: ({ id, body }) => ({ url: `/admin/variants/${id}`, method: "PATCH", body }),
      transformResponse: (res: unknown): Variant => normalizeVariant(res as ApiVariant),
      invalidatesTags: (res) => res ? [{ type: "Variant" as const, id: res.id }, { type: "Variants" as const, id: `PRODUCT_${res.product_id}` }] : [],
    }),

    deleteVariantAdmin: b.mutation<{ ok: true }, { id: string; product_id: string }>({
      query: ({ id }) => ({ url: `/admin/variants/${id}`, method: "DELETE" }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Variants" as const, id: `PRODUCT_${arg.product_id}` }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListOptionGroupsAdminQuery,
  useCreateOptionGroupAdminMutation,
  useUpdateOptionGroupAdminMutation,
  useDeleteOptionGroupAdminMutation,
  useListVariantsAdminQuery,
  useCreateVariantAdminMutation,
  useUpdateVariantAdminMutation,
  useDeleteVariantAdminMutation,
} = optionsAdminApi;


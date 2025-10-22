
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/product_options.endpoints.ts
// -------------------------------------------------------------
import { baseApi as baseApi2 } from "../baseApi";

const toNumber2 = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));

export type ProductOption = {
  id: string;
  product_id: string;
  name: string;
  position?: number | null;
  is_required?: 0 | 1 | boolean;
};

export type ApiProductOption = Omit<ProductOption, "position"> & { position?: number | string | null };
const normalizeOption = (o: ApiProductOption): ProductOption => ({ ...o, position: o.position == null ? null : toNumber2(o.position) });

export type ProductOptionValue = {
  id: string;
  option_id: string;
  value: string;
  position?: number | null;
};

export type ApiProductOptionValue = Omit<ProductOptionValue, "position"> & { position?: number | string | null };
const normalizeValue = (v: ApiProductOptionValue): ProductOptionValue => ({ ...v, position: v.position == null ? null : toNumber2(v.position) });

export type UpsertOptionBody = Partial<Omit<ProductOption, "id">> & { id?: string; product_id: string; name: string };
export type UpsertValueBody = Partial<Omit<ProductOptionValue, "id">> & { id?: string; option_id: string; value: string };

export const productOptionsApi = baseApi2.injectEndpoints({
  endpoints: (b) => ({
    listProductOptions: b.query<ProductOption[], { product_id: string }>({
      query: ({ product_id }) => ({ url: "/product_options", params: { product_id } }),
      transformResponse: (res: unknown): ProductOption[] => Array.isArray(res) ? (res as ApiProductOption[]).map(normalizeOption) : [],
      providesTags: (_r, _e, a) => [{ type: "Options" as const, id: `PRODUCT_${a.product_id}` }],
    }),

    listOptionValues: b.query<ProductOptionValue[], { option_id: string }>({
      query: ({ option_id }) => ({ url: "/product_option_values", params: { option_id } }),
      transformResponse: (res: unknown): ProductOptionValue[] => Array.isArray(res) ? (res as ApiProductOptionValue[]).map(normalizeValue) : [],
      providesTags: (_r, _e, a) => [{ type: "OptionValues" as const, id: `OPTION_${a.option_id}` }],
    }),

    createOption: b.mutation<ProductOption, Omit<UpsertOptionBody, "id">>({
      query: (body) => ({ url: "/product_options", method: "POST", body }),
      transformResponse: (res: unknown): ProductOption => normalizeOption(res as ApiProductOption),
      invalidatesTags: (r) => r ? [{ type: "Options" as const, id: `PRODUCT_${r.product_id}` }] : [],
    }),

    updateOption: b.mutation<ProductOption, { id: string; patch: Partial<UpsertOptionBody> }>({
      query: ({ id, patch }) => ({ url: `/product_options/${id}`, method: "PATCH", body: patch }),
      transformResponse: (res: unknown): ProductOption => normalizeOption(res as ApiProductOption),
      invalidatesTags: (r) => r ? [{ type: "Options" as const, id: `PRODUCT_${r.product_id}` }] : [],
    }),

    deleteOption: b.mutation<{ success: true }, { id: string; product_id: string }>({
      query: ({ id }) => ({ url: `/product_options/${id}`, method: "DELETE" }),
      transformResponse: (res: unknown): { success: true } => (res as { success: true }) ?? { success: true },
      invalidatesTags: (_r, _e, a) => [{ type: "Options" as const, id: `PRODUCT_${a.product_id}` }],
    }),

    createOptionValue: b.mutation<ProductOptionValue, Omit<UpsertValueBody, "id">>({
      query: (body) => ({ url: "/product_option_values", method: "POST", body }),
      transformResponse: (res: unknown): ProductOptionValue => normalizeValue(res as ApiProductOptionValue),
      invalidatesTags: (r) => r ? [{ type: "OptionValues" as const, id: `OPTION_${r.option_id}` }] : [],
    }),

    updateOptionValue: b.mutation<ProductOptionValue, { id: string; patch: Partial<UpsertValueBody> }>({
      query: ({ id, patch }) => ({ url: `/product_option_values/${id}`, method: "PATCH", body: patch }),
      transformResponse: (res: unknown): ProductOptionValue => normalizeValue(res as ApiProductOptionValue),
      invalidatesTags: (r) => r ? [{ type: "OptionValues" as const, id: `OPTION_${r.option_id}` }] : [],
    }),

    deleteOptionValue: b.mutation<{ success: true }, { id: string; option_id: string }>({
      query: ({ id }) => ({ url: `/product_option_values/${id}`, method: "DELETE" }),
      transformResponse: (res: unknown): { success: true } => (res as { success: true }) ?? { success: true },
      invalidatesTags: (_r, _e, a) => [{ type: "OptionValues" as const, id: `OPTION_${a.option_id}` }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListProductOptionsQuery,
  useListOptionValuesQuery,
  useCreateOptionMutation,
  useUpdateOptionMutation,
  useDeleteOptionMutation,
  useCreateOptionValueMutation,
  useUpdateOptionValueMutation,
  useDeleteOptionValueMutation,
} = productOptionsApi;
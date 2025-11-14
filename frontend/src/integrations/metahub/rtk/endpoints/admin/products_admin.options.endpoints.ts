// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/products_admin.options.endpoints.ts
// PRODUCT OPTIONS: CRUD
// -------------------------------------------------------------
import { baseApi } from "../../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type {
  ProductOption,
} from "@/integrations/metahub/db/types/products";

const BASE = "/admin/products";

const isRecord = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

const pluckArray = (res: unknown, keys: string[]): unknown[] => {
  if (Array.isArray(res)) return res;
  if (isRecord(res)) {
    for (const k of keys) {
      const v = (res as Record<string, unknown>)[k];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
};

export type ProductOptionCreateInput = {
  id?: string;
  option_name: string;
  option_values: string[];
};

export type ProductOptionUpdateInput = Partial<ProductOptionCreateInput>;

export const productOptionsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /admin/products/:id/options
    listProductOptionsAdmin: b.query<ProductOption[], string>({
      query: (productId): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(productId)}/options`,
      }),
      transformResponse: (res: unknown): ProductOption[] => {
        const rows = pluckArray(res, ["data", "items", "rows", "options"]);
        return rows.filter(isRecord).map((x) => x as unknown as ProductOption);
      },
      providesTags: (_result, _error, productId) => [
        { type: "ProductOptions" as const, id: productId },
      ],
      keepUnusedDataFor: 60,
    }),

    // POST /admin/products/:id/options
    createProductOptionAdmin: b.mutation<
      ProductOption,
      { id: string; body: ProductOptionCreateInput }
    >({
      query: ({ id, body }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}/options`,
        method: "POST",
        body,
      }),
      transformResponse: (res: unknown): ProductOption => res as ProductOption,
      invalidatesTags: (_r, _e, arg) => [
        { type: "ProductOptions" as const, id: arg.id },
      ],
    }),

    // PATCH /admin/products/:id/options/:optionId
    updateProductOptionAdmin: b.mutation<
      ProductOption,
      { id: string; optionId: string; body: ProductOptionUpdateInput }
    >({
      query: ({ id, optionId, body }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(
          id
        )}/options/${encodeURIComponent(optionId)}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (res: unknown): ProductOption => res as ProductOption,
      invalidatesTags: (_r, _e, arg) => [
        { type: "ProductOptions" as const, id: arg.id },
      ],
    }),

    // DELETE /admin/products/:id/options/:optionId
    deleteProductOptionAdmin: b.mutation<
      { ok: true },
      { id: string; optionId: string }
    >({
      query: ({ id, optionId }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(
          id
        )}/options/${encodeURIComponent(optionId)}`,
        method: "DELETE",
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "ProductOptions" as const, id: arg.id },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListProductOptionsAdminQuery,
  useCreateProductOptionAdminMutation,
  useUpdateProductOptionAdminMutation,
  useDeleteProductOptionAdminMutation,
} = productOptionsAdminApi;

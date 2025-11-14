// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/products_admin.faqs.endpoints.ts
// FAQS: CRUD + toggle + replace
// -------------------------------------------------------------
import { baseApi } from "../../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type {
  FAQ,
  FAQInput,
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

const toBool = (v: unknown): boolean => {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  const s = String(v ?? "").toLowerCase();
  return s === "1" || s === "true";
};

type ListProductFaqsParams = {
  id: string;
  only_active?: boolean | 0 | 1;
};

export const productFaqsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /admin/products/:id/faqs
    listProductFaqsAdmin: b.query<FAQ[], ListProductFaqsParams>({
      query: ({ id, only_active }): FetchArgs => {
        const params: Record<string, string | number> = {};
        if (only_active !== undefined) {
          params.only_active = toBool(only_active) ? 1 : 0;
        }
        return {
          url: `${BASE}/${encodeURIComponent(id)}/faqs`,
          params,
        } as FetchArgs;
      },
      transformResponse: (res: unknown): FAQ[] => {
        const rows = pluckArray(res, ["data", "items", "rows", "faqs"]);
        return rows.filter(isRecord).map((x) => x as unknown as FAQ);
      },
      providesTags: (_result, _error, arg) => [
        { type: "ProductFAQs" as const, id: arg.id },
      ],
      keepUnusedDataFor: 60,
    }),

    // POST /admin/products/:id/faqs
    createProductFaqAdmin: b.mutation<
      FAQ,
      { id: string; body: FAQInput }
    >({
      query: ({ id, body }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}/faqs`,
        method: "POST",
        body,
      }),
      transformResponse: (res: unknown): FAQ => res as FAQ,
      invalidatesTags: (_r, _e, arg) => [
        { type: "ProductFAQs" as const, id: arg.id },
      ],
    }),

    // PATCH /admin/products/:id/faqs/:faqId
    updateProductFaqAdmin: b.mutation<
      FAQ,
      { id: string; faqId: string; body: Partial<FAQInput> }
    >({
      query: ({ id, faqId, body }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}/faqs/${encodeURIComponent(
          faqId
        )}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (res: unknown): FAQ => res as FAQ,
      invalidatesTags: (_r, _e, arg) => [
        { type: "ProductFAQs" as const, id: arg.id },
      ],
    }),

    // PATCH /admin/products/:id/faqs/:faqId/active
    toggleProductFaqActiveAdmin: b.mutation<
      FAQ,
      { id: string; faqId: string; is_active: boolean }
    >({
      query: ({ id, faqId, is_active }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(
          id
        )}/faqs/${encodeURIComponent(faqId)}/active`,
        method: "PATCH",
        body: { is_active },
      }),
      transformResponse: (res: unknown): FAQ => res as FAQ,
      invalidatesTags: (_r, _e, arg) => [
        { type: "ProductFAQs" as const, id: arg.id },
      ],
    }),

    // DELETE /admin/products/:id/faqs/:faqId
    deleteProductFaqAdmin: b.mutation<
      { ok: true },
      { id: string; faqId: string }
    >({
      query: ({ id, faqId }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(
          id
        )}/faqs/${encodeURIComponent(faqId)}`,
        method: "DELETE",
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "ProductFAQs" as const, id: arg.id },
      ],
    }),

    // PUT /admin/products/:id/faqs (replace – eski FE için)
    replaceFaqsAdmin: b.mutation<
      { ok: true },
      { id: string; faqs: Array<FAQInput | FAQ> }
    >({
      query: ({ id, faqs }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}/faqs`,
        method: "PUT",
        body: { faqs },
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "ProductFAQs" as const, id: arg.id },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListProductFaqsAdminQuery,
  useCreateProductFaqAdminMutation,
  useUpdateProductFaqAdminMutation,
  useToggleProductFaqActiveAdminMutation,
  useDeleteProductFaqAdminMutation,
  useReplaceFaqsAdminMutation,
} = productFaqsAdminApi;

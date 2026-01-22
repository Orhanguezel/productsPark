// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/products_admin.faqs.endpoints.ts
// FINAL — Admin Product FAQs RTK (CRUD + toggle + replace)
// -------------------------------------------------------------
import { baseApi } from '@/integrations/baseApi';
import type { FetchArgs } from '@reduxjs/toolkit/query';

import type {
  ProductFaq,
  ProductFaqInput,
  AdminListProductFaqsParams,
} from '@/integrations/types';
import {
  normalizeProductFaq,
  normalizeProductFaqs,
  toAdminListProductFaqsQuery,
  toFaqInputBody,
  toReplaceFaqsBody,
} from '@/integrations/types';

const BASE = '/admin/products';

export const productFaqsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /admin/products/:id/faqs
    listProductFaqsAdmin: b.query<ProductFaq[], AdminListProductFaqsParams>({
      query: ({ id, ...rest }): FetchArgs => {
        const qp = toAdminListProductFaqsQuery({ id, ...rest });
        return {
          url: `${BASE}/${encodeURIComponent(id)}/faqs`,
          method: 'GET',
          ...(qp ? { params: qp } : {}),
        };
      },
      transformResponse: (res: unknown): ProductFaq[] => normalizeProductFaqs(res),
      providesTags: (_r, _e, arg) => [{ type: 'ProductFAQs' as const, id: arg.id }],
      keepUnusedDataFor: 60,
    }),

    // POST /admin/products/:id/faqs
    createProductFaqAdmin: b.mutation<ProductFaq, { id: string; body: ProductFaqInput }>({
      query: ({ id, body }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}/faqs`,
        method: 'POST',
        body: toFaqInputBody(body),
      }),
      transformResponse: (res: unknown): ProductFaq => normalizeProductFaq(res),
      invalidatesTags: (_r, _e, arg) => [{ type: 'ProductFAQs' as const, id: arg.id }],
    }),

    // PATCH /admin/products/:id/faqs/:faqId
    updateProductFaqAdmin: b.mutation<
      ProductFaq,
      { id: string; faqId: string; body: Partial<ProductFaqInput> }
    >({
      query: ({ id, faqId, body }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}/faqs/${encodeURIComponent(faqId)}`,
        method: 'PATCH',
        body: toFaqInputBody(body),
      }),
      transformResponse: (res: unknown): ProductFaq => normalizeProductFaq(res),
      invalidatesTags: (_r, _e, arg) => [{ type: 'ProductFAQs' as const, id: arg.id }],
    }),

    // PATCH /admin/products/:id/faqs/:faqId/active
    toggleProductFaqActiveAdmin: b.mutation<
      ProductFaq,
      { id: string; faqId: string; is_active: boolean }
    >({
      query: ({ id, faqId, is_active }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}/faqs/${encodeURIComponent(faqId)}/active`,
        method: 'PATCH',
        body: { is_active: is_active ? 1 : 0 },
      }),
      transformResponse: (res: unknown): ProductFaq => normalizeProductFaq(res),
      invalidatesTags: (_r, _e, arg) => [{ type: 'ProductFAQs' as const, id: arg.id }],
    }),

    // DELETE /admin/products/:id/faqs/:faqId
    deleteProductFaqAdmin: b.mutation<{ ok: true }, { id: string; faqId: string }>({
      query: ({ id, faqId }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}/faqs/${encodeURIComponent(faqId)}`,
        method: 'DELETE',
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'ProductFAQs' as const, id: arg.id }],
    }),

    // PUT /admin/products/:id/faqs (replace – legacy)
    replaceFaqsAdmin: b.mutation<
      { ok: true },
      { id: string; faqs: Array<ProductFaqInput | ProductFaq> }
    >({
      query: ({ id, faqs }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}/faqs`,
        method: 'PUT',
        body: toReplaceFaqsBody(faqs),
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'ProductFAQs' as const, id: arg.id }],
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

// -------------------------------------------------------------
// FILE: src/integrations/rtk/admin/payment_providers_admin.endpoints.ts
// FINAL — Payment Providers (ADMIN) RTK
// - create: args = UpsertPaymentProviderAdminBody (NO {body:..} wrapper)
// - update: args = { id, body }
// - delete: args = string (id)
// -------------------------------------------------------------

import { baseApi } from '@/integrations/baseApi';

import type {
  PaymentProviderAdmin,
  PaymentProvidersAdminListParams,
  UpsertPaymentProviderAdminBody,
  DeleteProviderResp,
} from '@/integrations/types';

import {
  normalizePaymentProviderAdmin,
  normalizePaymentProviderAdminList,
  toPaymentProvidersListQuery,
  toUpsertPaymentProviderAdminBody,
  normalizeDeleteProviderResp,
} from '@/integrations/types';

const BASE = '/admin/payment_providers';

const extendedApi = baseApi.enhanceEndpoints({
  addTagTypes: ['PaymentProvider', 'PaymentProviders'] as const,
});

export const paymentProvidersAdminApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    listPaymentProvidersAdmin: b.query<
      PaymentProviderAdmin[],
      PaymentProvidersAdminListParams | void
    >({
      query: (params) => {
        const qp = params ? toPaymentProvidersListQuery(params) : undefined;
        return { url: BASE, ...(qp ? { params: qp } : {}) };
      },
      transformResponse: (res: unknown): PaymentProviderAdmin[] =>
        normalizePaymentProviderAdminList(res),
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((p) => ({ type: 'PaymentProvider' as const, id: p.id })),
              { type: 'PaymentProviders' as const, id: 'LIST' },
            ]
          : [{ type: 'PaymentProviders' as const, id: 'LIST' }],
      keepUnusedDataFor: 60,
    }),

    getPaymentProviderAdminById: b.query<PaymentProviderAdmin, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}` }),
      transformResponse: (res: unknown): PaymentProviderAdmin => normalizePaymentProviderAdmin(res),
      providesTags: (_r, _e, id) => [{ type: 'PaymentProvider' as const, id }],
      keepUnusedDataFor: 60,
    }),

    // ✅ CREATE (NO wrapper)
    createPaymentProviderAdmin: b.mutation<PaymentProviderAdmin, UpsertPaymentProviderAdminBody>({
      query: (body) => ({
        url: BASE,
        method: 'POST',
        body: toUpsertPaymentProviderAdminBody(body),
      }),
      transformResponse: (res: unknown): PaymentProviderAdmin => normalizePaymentProviderAdmin(res),
      invalidatesTags: [{ type: 'PaymentProviders' as const, id: 'LIST' }],
    }),

    updatePaymentProviderAdmin: b.mutation<
      PaymentProviderAdmin,
      { id: string; body: UpsertPaymentProviderAdminBody }
    >({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: toUpsertPaymentProviderAdminBody(body),
      }),
      transformResponse: (res: unknown): PaymentProviderAdmin => normalizePaymentProviderAdmin(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'PaymentProvider' as const, id: arg.id },
        { type: 'PaymentProviders' as const, id: 'LIST' },
      ],
    }),

    // ✅ DELETE (arg = string)
    deletePaymentProviderAdmin: b.mutation<DeleteProviderResp, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'DELETE' }),
      transformResponse: (res: unknown): DeleteProviderResp => normalizeDeleteProviderResp(res),
      invalidatesTags: (_r, _e, id) => [
        { type: 'PaymentProvider' as const, id },
        { type: 'PaymentProviders' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListPaymentProvidersAdminQuery,
  useGetPaymentProviderAdminByIdQuery,
  useCreatePaymentProviderAdminMutation,
  useUpdatePaymentProviderAdminMutation,
  useDeletePaymentProviderAdminMutation,
} = paymentProvidersAdminApi;

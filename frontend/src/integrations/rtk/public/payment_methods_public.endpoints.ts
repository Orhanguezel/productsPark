// -------------------------------------------------------------
// FILE: src/integrations/rtk/public/payment_methods_public.endpoints.ts
// FINAL — Public Payment Methods (single endpoint)
// GET /public/payment-methods
// -------------------------------------------------------------

import { baseApi } from '@/integrations/baseApi';

import type { PublicPaymentMethodsResp } from '@/integrations/types';
import { normalizePublicPaymentMethodsResp } from '@/integrations/types';

const BASE = '/public/payment-methods';

const extendedApi = baseApi.enhanceEndpoints({
  addTagTypes: ['PublicPaymentMethods'] as const,
});

export const publicPaymentMethodsApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    getPublicPaymentMethods: b.query<PublicPaymentMethodsResp, void>({
      query: () => ({ url: BASE }),
      transformResponse: (res: unknown): PublicPaymentMethodsResp =>
        normalizePublicPaymentMethodsResp(res),
      providesTags: [{ type: 'PublicPaymentMethods', id: 'SINGLE' }],
      keepUnusedDataFor: 60,
    }),
  }),
  overrideExisting: true,
});

export const { useGetPublicPaymentMethodsQuery } = publicPaymentMethodsApi;

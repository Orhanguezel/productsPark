// =============================================================
// FILE: src/integrations/rtk/admin/api_providers.endpoints.ts
// FINAL — Api Providers RTK Endpoints (types+normalizers central)
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type { ApiProvider, ApiProviderBalanceResponse } from '@/integrations/types';
import { normalizeApiProvider } from '@/integrations/types';

type ListParams = {
  activeOnly?: boolean;
  orderBy?: { field: 'name' | 'created_at' | 'updated_at'; asc?: boolean };
};

const BASE = '/admin/api-providers';

export const apiProvidersApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listApiProviders: b.query<ApiProvider[], ListParams | undefined>({
      query: (params) => {
        const p: ListParams = params ?? {};
        const usp = new URLSearchParams();

        if (p.activeOnly) usp.set('is_active', '1');

        if (p.orderBy) {
          const dir = p.orderBy.asc === false ? 'desc' : 'asc';
          usp.set('order', `${p.orderBy.field}.${dir}`);
        } else {
          usp.set('order', 'name.asc');
        }

        const qs = usp.toString();
        return { url: `${BASE}${qs ? `?${qs}` : ''}` };
      },

      transformResponse: (rows: unknown): ApiProvider[] =>
        (Array.isArray(rows) ? rows : []).map(normalizeApiProvider),

      providesTags: (result) =>
        result
          ? [
              ...result.map((x) => ({ type: 'ApiProviders' as const, id: x.id })),
              { type: 'ApiProviders' as const, id: 'LIST' },
            ]
          : [{ type: 'ApiProviders' as const, id: 'LIST' }],
    }),

    getApiProvider: b.query<ApiProvider, string>({
      query: (id) => ({ url: `${BASE}/${id}` }),
      transformResponse: (r: unknown) => normalizeApiProvider(r),
      providesTags: (_r, _e, id) => [{ type: 'ApiProviders', id }],
    }),

    createApiProvider: b.mutation<
      ApiProvider,
      {
        name: string;
        provider_type?: string;
        api_url: string;
        api_key: string;
        is_active?: boolean;
        credentials?: Record<string, unknown>;
      }
    >({
      query: (body) => ({
        url: `${BASE}`,
        method: 'POST',
        body,
      }),
      transformResponse: (r: unknown) => normalizeApiProvider(r),
      invalidatesTags: [{ type: 'ApiProviders', id: 'LIST' }],
    }),

    updateApiProvider: b.mutation<
      ApiProvider,
      {
        id: string;
        patch: Partial<{
          name: string;
          provider_type: string;
          api_url: string;
          api_key: string;
          is_active: boolean;
          credentials: Record<string, unknown>;
        }>;
      }
    >({
      query: ({ id, patch }) => ({
        url: `${BASE}/${id}`,
        method: 'PUT',
        body: patch,
      }),
      transformResponse: (r: unknown) => normalizeApiProvider(r),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'ApiProviders', id },
        { type: 'ApiProviders', id: 'LIST' },
      ],
    }),

    deleteApiProvider: b.mutation<{ ok: true }, string>({
      query: (id) => ({
        url: `${BASE}/${id}`,
        method: 'DELETE',
      }),
      transformResponse: () => ({ ok: true }),
      invalidatesTags: [{ type: 'ApiProviders', id: 'LIST' }],
    }),

    // BALANCE CHECK
    checkApiProviderBalance: b.mutation<ApiProviderBalanceResponse, { id: string }>({
      query: ({ id }) => ({
        url: `${BASE}/${id}/check-balance`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'ApiProviders', id },
        { type: 'ApiProviders', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListApiProvidersQuery,
  useGetApiProviderQuery,
  useCreateApiProviderMutation,
  useUpdateApiProviderMutation,
  useDeleteApiProviderMutation,
  useCheckApiProviderBalanceMutation,
} = apiProvidersApi;

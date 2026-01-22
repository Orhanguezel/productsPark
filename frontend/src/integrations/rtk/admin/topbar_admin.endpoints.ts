// ----------------------------------------------------------------------
// FILE: src/integrations/rtk/admin/topbar_admin.endpoints.ts
// FINAL — Topbar Admin RTK
// ----------------------------------------------------------------------

import { baseApi } from '@/integrations/baseApi';
import type { TopbarSetting, AdminTopbarListParams, UpsertTopbarBody } from '@/integrations/types';
import {
  normalizeTopbarAdmin,
  normalizeTopbarAdminList,
  toTopbarAdminListQuery,
  toTopbarAdminUpsertBody,
} from '@/integrations/types';

const BASE = '/admin/topbar_settings';

const extendedApi = baseApi.enhanceEndpoints({ addTagTypes: ['TopbarSettings'] as const });

export const topbarAdminApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /admin/topbar_settings
    listTopbarAdmin: b.query<TopbarSetting[], AdminTopbarListParams | void>({
      query: (q) => {
        const qp = q ? toTopbarAdminListQuery(q) : undefined;
        return {
          url: BASE,
          ...(qp ? { params: qp } : {}), // exactOptionalPropertyTypes ✅
        };
      },
      transformResponse: (res: unknown): TopbarSetting[] => normalizeTopbarAdminList(res),
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((i) => ({ type: 'TopbarSettings' as const, id: i.id })),
              { type: 'TopbarSettings' as const, id: 'LIST' },
            ]
          : [{ type: 'TopbarSettings' as const, id: 'LIST' }],
      keepUnusedDataFor: 60,
    }),

    // GET /admin/topbar_settings/:id
    getTopbarAdminById: b.query<TopbarSetting, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}` }),
      transformResponse: (res: unknown): TopbarSetting => normalizeTopbarAdmin(res),
      providesTags: (_r, _e, id) => [{ type: 'TopbarSettings' as const, id }],
    }),

    // POST /admin/topbar_settings
    createTopbarAdmin: b.mutation<TopbarSetting, UpsertTopbarBody>({
      query: (body) => ({
        url: BASE,
        method: 'POST',
        body: toTopbarAdminUpsertBody(body),
      }),
      transformResponse: (res: unknown): TopbarSetting => normalizeTopbarAdmin(res),
      invalidatesTags: [
        { type: 'TopbarSettings' as const, id: 'LIST' },
        { type: 'TopbarSettings' as const, id: 'ACTIVE' },
      ],
    }),

    // PATCH /admin/topbar_settings/:id
    updateTopbarAdmin: b.mutation<TopbarSetting, { id: string; body: UpsertTopbarBody }>({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: toTopbarAdminUpsertBody(body),
      }),
      transformResponse: (res: unknown): TopbarSetting => normalizeTopbarAdmin(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'TopbarSettings' as const, id: arg.id },
        { type: 'TopbarSettings' as const, id: 'LIST' },
        { type: 'TopbarSettings' as const, id: 'ACTIVE' },
      ],
    }),

    // DELETE /admin/topbar_settings/:id
    deleteTopbarAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'DELETE' }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'TopbarSettings' as const, id },
        { type: 'TopbarSettings' as const, id: 'LIST' },
        { type: 'TopbarSettings' as const, id: 'ACTIVE' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListTopbarAdminQuery,
  useGetTopbarAdminByIdQuery,
  useCreateTopbarAdminMutation,
  useUpdateTopbarAdminMutation,
  useDeleteTopbarAdminMutation,
} = topbarAdminApi;

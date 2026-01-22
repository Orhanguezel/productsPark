// ----------------------------------------------------------------------
// FILE: src/integrations/rtk/public/topbar_public.endpoints.ts
// FINAL — Topbar Public RTK
// ----------------------------------------------------------------------

import { baseApi } from '@/integrations/baseApi';
import type { TopbarSetting, TopbarPublicListParams } from '@/integrations/types';
import {
  normalizeTopbarPublicList,
  normalizeTopbarPublic,
  toTopbarPublicListQuery,
} from '@/integrations/types';

const BASE = '/topbar_settings';

const extendedApi = baseApi.enhanceEndpoints({ addTagTypes: ['TopbarSettings'] as const });

export const topbarPublicApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /topbar_settings
    listTopbarSettings: b.query<TopbarSetting[], TopbarPublicListParams | void>({
      query: (q) => {
        const qp = q ? toTopbarPublicListQuery(q) : undefined;
        return {
          url: BASE,
          ...(qp ? { params: qp } : {}),
          // Eğer projende public çağrılarda auth skip gerekiyorsa:
          // headers: { 'x-skip-auth': '1' },
        };
      },
      transformResponse: (res: unknown): TopbarSetting[] => normalizeTopbarPublicList(res),
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((i) => ({ type: 'TopbarSettings' as const, id: i.id })),
              { type: 'TopbarSettings' as const, id: 'LIST' },
            ]
          : [{ type: 'TopbarSettings' as const, id: 'LIST' }],
      keepUnusedDataFor: 60,
    }),

    /** Aktif ilk kaydı döndürür (yoksa null) */
    getActiveTopbar: b.query<TopbarSetting | null, void>({
      query: () => ({
        url: BASE,
        params: { is_active: 1, limit: 1 },
        // headers: { 'x-skip-auth': '1' },
      }),
      transformResponse: (res: unknown): TopbarSetting | null => {
        const list = Array.isArray(res) ? res : [];
        return list.length ? normalizeTopbarPublic(list[0]) : null;
      },
      providesTags: [{ type: 'TopbarSettings' as const, id: 'ACTIVE' }],
      keepUnusedDataFor: 60,
    }),
  }),
  overrideExisting: true,
});

export const { useListTopbarSettingsQuery, useGetActiveTopbarQuery } = topbarPublicApi;

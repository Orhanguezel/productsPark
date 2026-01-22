// ----------------------------------------------------------------------
// FILE: src/integrations/rtk/public/menu_items_public.endpoints.ts
// FINAL — Public MenuItems RTK (central types + helpers)
// - exactOptionalPropertyTypes safe: params property only when defined
// ----------------------------------------------------------------------

import { baseApi } from '@/integrations/baseApi';
import type { FetchArgs } from '@reduxjs/toolkit/query';

import type { ApiMenuItemPublic, MenuItem, MenuPublicListParams } from '@/integrations/types';
import { normalizeMenuItemPublic, toMenuPublicQuery } from '@/integrations/types';

const BASE = '/menu_items';

export const menuItemsPublicApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /menu_items
    listMenuItems: b.query<MenuItem[], MenuPublicListParams | void>({
      query: (q): FetchArgs => {
        const qp = q ? toMenuPublicQuery(q) : undefined;

        // params: undefined göndermek YASAK (exactOptionalPropertyTypes)
        return qp ? { url: BASE, params: qp } : { url: BASE };
      },
      transformResponse: (res: unknown): MenuItem[] =>
        Array.isArray(res) ? (res as ApiMenuItemPublic[]).map(normalizeMenuItemPublic) : [],
      providesTags: (result) =>
        result?.length
          ? [
              { type: 'MenuItems' as const, id: 'LIST' },
              ...result.map((i) => ({ type: 'MenuItems' as const, id: i.id })),
            ]
          : [{ type: 'MenuItems' as const, id: 'LIST' }],
      keepUnusedDataFor: 60,
    }),

    // GET /menu_items/:id
    getMenuItemById: b.query<MenuItem, string>({
      query: (id): FetchArgs => ({ url: `${BASE}/${encodeURIComponent(id)}` }),
      transformResponse: (res: unknown): MenuItem =>
        normalizeMenuItemPublic(res as ApiMenuItemPublic),
      providesTags: (_r, _e, id) => [{ type: 'MenuItems' as const, id }],
    }),
  }),
  overrideExisting: true,
});

export const { useListMenuItemsQuery, useGetMenuItemByIdQuery } = menuItemsPublicApi;

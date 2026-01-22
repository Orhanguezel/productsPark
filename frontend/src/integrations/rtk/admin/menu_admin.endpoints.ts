// ----------------------------------------------------------------------
// FILE: src/integrations/rtk/admin/menu_items_admin.endpoints.ts
// FINAL — Admin MenuItems RTK (central types + helpers)
// - exactOptionalPropertyTypes safe (no params: undefined)
// ----------------------------------------------------------------------

import { baseApi } from '@/integrations/baseApi';
import type { FetchArgs } from '@reduxjs/toolkit/query';

import type {
  ApiMenuItemAdmin,
  MenuItem,
  MenuAdminListParams,
  UpsertMenuItemBody,
} from '@/integrations/types';
import {
  normalizeMenuItemAdmin,
  toMenuAdminQuery,
  toMenuItemAdminBody,
} from '@/integrations/types';

const BASE = '/admin/menu_items';

const extendedApi = baseApi.enhanceEndpoints({
  addTagTypes: ['MenuItems'] as const,
});

export const menuItemsAdminApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /admin/menu_items
    listMenuItemsAdmin: b.query<MenuItem[], MenuAdminListParams | void>({
      query: (q): FetchArgs => {
        const qp = q ? toMenuAdminQuery(q) : undefined;
        return qp ? { url: BASE, params: qp } : { url: BASE };
      },
      transformResponse: (res: unknown): MenuItem[] =>
        Array.isArray(res) ? (res as ApiMenuItemAdmin[]).map(normalizeMenuItemAdmin) : [],
      providesTags: (result) =>
        result && result.length
          ? [
              { type: 'MenuItems' as const, id: 'LIST' },
              ...result.map((i) => ({ type: 'MenuItems' as const, id: i.id })),
            ]
          : [{ type: 'MenuItems' as const, id: 'LIST' }],
      keepUnusedDataFor: 60,
    }),

    // GET /admin/menu_items/:id
    getMenuItemAdminById: b.query<MenuItem, string>({
      query: (id): FetchArgs => ({ url: `${BASE}/${encodeURIComponent(id)}` }),
      transformResponse: (res: unknown): MenuItem =>
        normalizeMenuItemAdmin(res as ApiMenuItemAdmin),
      providesTags: (_r, _e, id) => [{ type: 'MenuItems' as const, id }],
    }),

    // POST /admin/menu_items
    createMenuItemAdmin: b.mutation<MenuItem, UpsertMenuItemBody>({
      query: (body): FetchArgs => ({
        url: BASE,
        method: 'POST',
        body: toMenuItemAdminBody(body),
      }),
      transformResponse: (res: unknown): MenuItem =>
        normalizeMenuItemAdmin(res as ApiMenuItemAdmin),
      invalidatesTags: [{ type: 'MenuItems' as const, id: 'LIST' }],
    }),

    // PATCH /admin/menu_items/:id
    updateMenuItemAdmin: b.mutation<MenuItem, { id: string; body: UpsertMenuItemBody }>({
      query: ({ id, body }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: toMenuItemAdminBody(body),
      }),
      transformResponse: (res: unknown): MenuItem =>
        normalizeMenuItemAdmin(res as ApiMenuItemAdmin),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'MenuItems' as const, id: arg.id },
        { type: 'MenuItems' as const, id: 'LIST' },
      ],
    }),

    // DELETE /admin/menu_items/:id
    deleteMenuItemAdmin: b.mutation<{ ok: true }, string>({
      query: (id): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      transformResponse: (): { ok: true } => ({ ok: true as const }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'MenuItems' as const, id },
        { type: 'MenuItems' as const, id: 'LIST' },
      ],
    }),

    // POST /admin/menu_items/reorder
    reorderMenuItemsAdmin: b.mutation<{ ok: true }, Array<{ id: string; display_order: number }>>({
      query: (items): FetchArgs => ({
        url: `${BASE}/reorder`,
        method: 'POST',
        body: { items },
      }),
      transformResponse: (): { ok: true } => ({ ok: true as const }),
      invalidatesTags: [{ type: 'MenuItems' as const, id: 'LIST' }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListMenuItemsAdminQuery,
  useGetMenuItemAdminByIdQuery,
  useCreateMenuItemAdminMutation,
  useUpdateMenuItemAdminMutation,
  useDeleteMenuItemAdminMutation,
  useReorderMenuItemsAdminMutation,
} = menuItemsAdminApi;

// ===================================================================
// FILE: src/integrations/rtk/admin/popups_admin.endpoints.ts
// FINAL — Popups (ADMIN) RTK
// - central types: integrations/types/popups.ts
// - no any
// - exactOptionalPropertyTypes friendly
// ===================================================================

import { baseApi } from '@/integrations/baseApi';
import type { FetchArgs } from '@reduxjs/toolkit/query';

import type {
  PopupAdminView,
  PopupAdminUpsertBody,
  PopupAdminPatchBody,
} from '@/integrations/types';
import {
  normalizePopupAdminView,
  normalizePopupAdminList,
  toPopupAdminApiBody,
} from '@/integrations/types';

const BASE = '/admin/popups';

const extendedApi = baseApi.enhanceEndpoints({ addTagTypes: ['Popups'] as const });

export const popupsAdminApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /admin/popups
    listPopupsAdmin: b.query<PopupAdminView[], void>({
      query: (): FetchArgs => ({ url: BASE, method: 'GET' }),
      transformResponse: (res: unknown): PopupAdminView[] => normalizePopupAdminList(res),
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((p) => ({ type: 'Popups' as const, id: p.id })),
              { type: 'Popups' as const, id: 'LIST' },
            ]
          : [{ type: 'Popups' as const, id: 'LIST' }],
      keepUnusedDataFor: 60,
    }),

    // GET /admin/popups/:id
    getPopupAdminById: b.query<PopupAdminView, string>({
      query: (id): FetchArgs => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'GET' }),
      transformResponse: (res: unknown): PopupAdminView => normalizePopupAdminView(res),
      providesTags: (_r, _e, id) => [{ type: 'Popups' as const, id }],
      keepUnusedDataFor: 60,
    }),

    // POST /admin/popups
    createPopupAdmin: b.mutation<PopupAdminView, PopupAdminUpsertBody>({
      query: (body): FetchArgs => ({
        url: BASE,
        method: 'POST',
        body: toPopupAdminApiBody(body),
      }),
      transformResponse: (res: unknown): PopupAdminView => normalizePopupAdminView(res),
      invalidatesTags: [{ type: 'Popups' as const, id: 'LIST' }],
      async onQueryStarted(_body, { dispatch, queryFulfilled }) {
        try {
          const { data: created } = await queryFulfilled;
          dispatch(
            popupsAdminApi.util.updateQueryData('listPopupsAdmin', undefined, (draft) => {
              draft.unshift(created);
            }),
          );
        } catch {
          // no-op
        }
      },
    }),

    // PATCH /admin/popups/:id
    updatePopupAdmin: b.mutation<PopupAdminView, { id: string; body: PopupAdminPatchBody }>({
      query: ({ id, body }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: toPopupAdminApiBody(body),
      }),
      transformResponse: (res: unknown): PopupAdminView => normalizePopupAdminView(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Popups' as const, id: arg.id },
        { type: 'Popups' as const, id: 'LIST' },
      ],
      async onQueryStarted({ id, body }, { dispatch, queryFulfilled }) {
        // optimistic patch (server dönüşünde replace edeceğiz)
        const patch = dispatch(
          popupsAdminApi.util.updateQueryData('listPopupsAdmin', undefined, (draft) => {
            const it = draft.find((d) => d.id === id);
            if (!it) return;

            if (typeof body.title !== 'undefined') it.title = body.title;
            if (typeof body.content !== 'undefined') it.content = body.content ?? it.content;

            if (typeof body.image_url !== 'undefined') it.image_url = body.image_url ?? null;
            if (typeof body.image_asset_id !== 'undefined')
              it.image_asset_id = body.image_asset_id ?? null;
            if (typeof body.image_alt !== 'undefined') it.image_alt = body.image_alt ?? null;

            if (typeof body.button_text !== 'undefined') it.button_text = body.button_text ?? null;
            if (typeof body.button_link !== 'undefined') it.button_link = body.button_link ?? null;

            if (typeof body.is_active !== 'undefined') {
              const v = body.is_active;
              it.is_active = v === true || v === 1 || v === '1' || v === 'true';
            }

            if (typeof body.display_frequency !== 'undefined' && body.display_frequency) {
              it.display_frequency = body.display_frequency;
            }

            if (typeof body.delay_seconds !== 'undefined') {
              if (typeof body.delay_seconds === 'number')
                it.delay_seconds = Math.max(0, Math.trunc(body.delay_seconds));
            }

            if (typeof body.start_date !== 'undefined') it.start_date = body.start_date ?? null;
            if (typeof body.end_date !== 'undefined') it.end_date = body.end_date ?? null;

            if (typeof body.product_id !== 'undefined') it.product_id = body.product_id ?? null;
            if (typeof body.coupon_code !== 'undefined') it.coupon_code = body.coupon_code ?? null;

            if (typeof body.display_pages !== 'undefined' && body.display_pages)
              it.display_pages = body.display_pages;

            if (typeof body.priority !== 'undefined') it.priority = body.priority ?? null;

            if (typeof body.duration_seconds !== 'undefined')
              it.duration_seconds = body.duration_seconds ?? null;
          }),
        );

        try {
          const { data: updated } = await queryFulfilled;
          dispatch(
            popupsAdminApi.util.updateQueryData('listPopupsAdmin', undefined, (draft) => {
              const i = draft.findIndex((d) => d.id === id);
              if (i >= 0) draft[i] = updated;
            }),
          );
        } catch {
          patch.undo();
        }
      },
    }),

    // DELETE /admin/popups/:id
    deletePopupAdmin: b.mutation<{ ok: true }, string>({
      query: (id): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: [{ type: 'Popups' as const, id: 'LIST' }],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          popupsAdminApi.util.updateQueryData('listPopupsAdmin', undefined, (draft) => {
            const i = draft.findIndex((d) => d.id === id);
            if (i >= 0) draft.splice(i, 1);
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useListPopupsAdminQuery,
  useGetPopupAdminByIdQuery,
  useCreatePopupAdminMutation,
  useUpdatePopupAdminMutation,
  useDeletePopupAdminMutation,
} = popupsAdminApi;

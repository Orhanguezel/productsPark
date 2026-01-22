// =============================================================
// FILE: src/integrations/rtk/admin/sliders_admin.endpoints.ts
// FINAL — Admin Sliders RTK (central types + helpers)
// - exactOptionalPropertyTypes friendly (params undefined set edilmez)
// - no explicit any
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  SliderAdminView,
  SliderAdminListParams,
  SliderCreateInput,
  SliderUpdateInput,
  SliderStatusBody,
  SliderReorderBody,
  SliderSetImageBody,
} from '@/integrations/types';

import {
  normalizeSliderAdmin,
  normalizeSliderAdminList,
  toSlidersAdminQuery,
  toSliderCreateApiBody,
  toSliderUpdateApiBody,
} from '@/integrations/types';

const ADMIN_BASE = '/admin/sliders';

const extendedApi = baseApi.enhanceEndpoints({ addTagTypes: ['Slider'] as const });

export const slidersAdminApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /admin/sliders
    adminListSlides: b.query<SliderAdminView[], SliderAdminListParams | void>({
      query: (p) => {
        const qp = toSlidersAdminQuery(p);
        return {
          url: ADMIN_BASE,
          ...(qp ? { params: qp } : {}),
        };
      },
      transformResponse: (res: unknown): SliderAdminView[] => normalizeSliderAdminList(res),
      providesTags: (result) =>
        result?.length
          ? [
              { type: 'Slider' as const, id: 'LIST' },
              ...result.map((x) => ({ type: 'Slider' as const, id: x.id })),
            ]
          : [{ type: 'Slider' as const, id: 'LIST' }],
    }),

    // GET /admin/sliders/:id
    adminGetSlide: b.query<SliderAdminView, string | number>({
      query: (id) => ({ url: `${ADMIN_BASE}/${encodeURIComponent(String(id))}` }),
      transformResponse: (res: unknown): SliderAdminView => normalizeSliderAdmin(res),
      providesTags: (_r, _e, id) => [{ type: 'Slider' as const, id: String(id) }],
    }),

    // POST /admin/sliders
    adminCreateSlide: b.mutation<SliderAdminView, SliderCreateInput>({
      query: (body) => ({
        url: ADMIN_BASE,
        method: 'POST',
        body: toSliderCreateApiBody(body),
      }),
      transformResponse: (res: unknown): SliderAdminView => normalizeSliderAdmin(res),
      invalidatesTags: [{ type: 'Slider' as const, id: 'LIST' }],
    }),

    // PATCH /admin/sliders/:id
    adminUpdateSlide: b.mutation<SliderAdminView, { id: string | number; body: SliderUpdateInput }>(
      {
        query: ({ id, body }) => ({
          url: `${ADMIN_BASE}/${encodeURIComponent(String(id))}`,
          method: 'PATCH',
          body: toSliderUpdateApiBody(body),
        }),
        transformResponse: (res: unknown): SliderAdminView => normalizeSliderAdmin(res),
        invalidatesTags: (_r, _e, arg) => [
          { type: 'Slider' as const, id: String(arg.id) },
          { type: 'Slider' as const, id: 'LIST' },
        ],
      },
    ),

    // DELETE /admin/sliders/:id
    adminDeleteSlide: b.mutation<{ ok: true }, string | number>({
      query: (id) => ({
        url: `${ADMIN_BASE}/${encodeURIComponent(String(id))}`,
        method: 'DELETE',
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Slider' as const, id: String(id) },
        { type: 'Slider' as const, id: 'LIST' },
      ],
    }),

    // POST /admin/sliders/reorder
    adminReorderSlides: b.mutation<{ ok: true }, SliderReorderBody>({
      query: (body) => ({
        url: `${ADMIN_BASE}/reorder`,
        method: 'POST',
        body,
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: [{ type: 'Slider' as const, id: 'LIST' }],
    }),

    // POST /admin/sliders/:id/status
    adminSetSlideStatus: b.mutation<
      SliderAdminView,
      { id: string | number; body: SliderStatusBody }
    >({
      query: ({ id, body }) => ({
        url: `${ADMIN_BASE}/${encodeURIComponent(String(id))}/status`,
        method: 'POST',
        body,
      }),
      transformResponse: (res: unknown): SliderAdminView => normalizeSliderAdmin(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Slider' as const, id: String(arg.id) },
        { type: 'Slider' as const, id: 'LIST' },
      ],
    }),

    // PATCH /admin/sliders/:id/image { asset_id?: string | null }
    adminSetSlideImage: b.mutation<
      SliderAdminView,
      { id: string | number; body: SliderSetImageBody }
    >({
      query: ({ id, body }) => ({
        url: `${ADMIN_BASE}/${encodeURIComponent(String(id))}/image`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: unknown): SliderAdminView => normalizeSliderAdmin(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Slider' as const, id: String(arg.id) },
        { type: 'Slider' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useAdminListSlidesQuery,
  useAdminGetSlideQuery,
  useAdminCreateSlideMutation,
  useAdminUpdateSlideMutation,
  useAdminDeleteSlideMutation,
  useAdminReorderSlidesMutation,
  useAdminSetSlideStatusMutation,
  useAdminSetSlideImageMutation,
} = slidersAdminApi;

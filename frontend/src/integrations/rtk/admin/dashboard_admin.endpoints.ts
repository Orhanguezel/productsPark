// =============================================================
// FILE: src/integrations/rtk/admin/dashboard_admin.endpoints.ts
// FINAL — Admin Dashboard RTK (counts + latest lists) using central helpers
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type { FetchBaseQueryMeta } from '@reduxjs/toolkit/query';

import type { ProductLite, UserLite } from '@/integrations/types';
import { coerceCount, coerceItems, toCountQuery, toListQuery } from '@/integrations/types';

export const dashboardAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /* -------------------- counts -------------------- */
    countProducts: b.query<number, void>({
      query: () => toCountQuery('/admin/products/list'),
      transformResponse: (res: unknown, meta?: FetchBaseQueryMeta) => coerceCount(res, meta),
      providesTags: [{ type: 'Products' as const, id: 'COUNT' }],
    }),

    countCategories: b.query<number, void>({
      query: () => toCountQuery('/admin/categories/list'),
      transformResponse: (res: unknown, meta?: FetchBaseQueryMeta) => coerceCount(res, meta),
      providesTags: [{ type: 'Categories' as const, id: 'COUNT' }],
    }),

    countSubCategories: b.query<number, void>({
      query: () => toCountQuery('/admin/sub-categories/list'),
      transformResponse: (res: unknown, meta?: FetchBaseQueryMeta) => coerceCount(res, meta),
      providesTags: [{ type: 'SubCategories' as const, id: 'COUNT' }],
    }),

    countUsers: b.query<number, void>({
      query: () => toCountQuery('/admin/users/list'),
      transformResponse: (res: unknown, meta?: FetchBaseQueryMeta) => coerceCount(res, meta),
      providesTags: [{ type: 'Users' as const, id: 'COUNT' }],
    }),

    countPages: b.query<number, void>({
      query: () => toCountQuery('/admin/custom-pages/list'),
      transformResponse: (res: unknown, meta?: FetchBaseQueryMeta) => coerceCount(res, meta),
      providesTags: [{ type: 'Pages' as const, id: 'COUNT' }],
    }),

    countServices: b.query<number, void>({
      query: () => toCountQuery('/admin/services/list'),
      transformResponse: (res: unknown, meta?: FetchBaseQueryMeta) => coerceCount(res, meta),
      providesTags: [{ type: 'Services' as const, id: 'COUNT' }],
    }),

    countContacts: b.query<number, void>({
      query: () => toCountQuery('/admin/contacts/list'),
      transformResponse: (res: unknown, meta?: FetchBaseQueryMeta) => coerceCount(res, meta),
      providesTags: [{ type: 'Contacts' as const, id: 'COUNT' }],
    }),

    countSliders: b.query<number, void>({
      query: () => toCountQuery('/admin/sliders/list'),
      transformResponse: (res: unknown, meta?: FetchBaseQueryMeta) => coerceCount(res, meta),
      providesTags: [{ type: 'Sliders' as const, id: 'COUNT' }],
    }),

    countAccessories: b.query<number, void>({
      query: () => toCountQuery('/admin/accessories/list'),
      transformResponse: (res: unknown, meta?: FetchBaseQueryMeta) => coerceCount(res, meta),
      providesTags: [{ type: 'Accessories' as const, id: 'COUNT' }],
    }),

    countCampaigns: b.query<number, void>({
      query: () => toCountQuery('/admin/campaigns/list'),
      transformResponse: (res: unknown, meta?: FetchBaseQueryMeta) => coerceCount(res, meta),
      providesTags: [{ type: 'Campaigns' as const, id: 'COUNT' }],
    }),

    countAnnouncements: b.query<number, void>({
      query: () => toCountQuery('/admin/announcements/list'),
      transformResponse: (res: unknown, meta?: FetchBaseQueryMeta) => coerceCount(res, meta),
      providesTags: [{ type: 'Announcements' as const, id: 'COUNT' }],
    }),

    countReviews: b.query<number, void>({
      query: () => toCountQuery('/admin/product-reviews/list'),
      transformResponse: (res: unknown, meta?: FetchBaseQueryMeta) => coerceCount(res, meta),
      providesTags: [{ type: 'Reviews' as const, id: 'COUNT' }],
    }),

    /* -------------------- latest lists -------------------- */
    latestProducts: b.query<ProductLite[], number | void>({
      query: (limit = 10) => toListQuery('/admin/products/list', { limit }),
      transformResponse: (res: unknown): ProductLite[] => coerceItems<ProductLite>(res),
      providesTags: (res) =>
        Array.isArray(res)
          ? [
              ...res.map((x) => ({ type: 'Products' as const, id: x.id })),
              { type: 'Products' as const, id: 'LATEST' },
            ]
          : [{ type: 'Products' as const, id: 'LATEST' }],
    }),

    latestUsers: b.query<UserLite[], number | void>({
      query: (limit = 10) => toListQuery('/admin/users/list', { limit }),
      transformResponse: (res: unknown): UserLite[] => coerceItems<UserLite>(res),
      providesTags: (res) =>
        Array.isArray(res)
          ? [
              ...res.map((x) => ({ type: 'Users' as const, id: x.id })),
              { type: 'Users' as const, id: 'LATEST' },
            ]
          : [{ type: 'Users' as const, id: 'LATEST' }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useCountProductsQuery,
  useCountCategoriesQuery,
  useCountSubCategoriesQuery,
  useCountUsersQuery,
  useCountPagesQuery,
  useCountServicesQuery,
  useCountContactsQuery,
  useCountSlidersQuery,
  useCountAccessoriesQuery,
  useCountCampaignsQuery,
  useCountAnnouncementsQuery,
  useCountReviewsQuery,
  useLatestProductsQuery,
  useLatestUsersQuery,
} = dashboardAdminApi;

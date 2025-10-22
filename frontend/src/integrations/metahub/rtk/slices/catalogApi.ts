import { baseApi } from "../baseApi";

export const catalogApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    categories: b.query<unknown, void>({ query: () => ({ url: "/api/v1/categories" }) }),
    popularItems: b.query<unknown, void>({ query: () => ({ url: "/api/v1/items/popular" }) }),
    itemDetails: b.query<unknown, { id: string }>({
      query: ({ id }) => ({ url: "/api/v1/items/details", params: { id } }),
    }),
  }),
  overrideExisting: false,
});

export const { useCategoriesQuery, usePopularItemsQuery, useItemDetailsQuery } = catalogApi;

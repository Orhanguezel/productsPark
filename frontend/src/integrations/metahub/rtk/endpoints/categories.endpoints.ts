import { baseApi } from "../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query"; // 👈 EKLE

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  icon?: string | null;
  parent_id?: string | null;
  is_featured?: 0 | 1 | boolean;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
};

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listCategories: builder.query<Category[], void>({
      query: (): FetchArgs => ({ url: "/categories" }), // 👈
      providesTags: (result) =>
        result
          ? [
              ...result.map((c) => ({ type: "Categories" as const, id: c.id })),
              { type: "Categories" as const, id: "LIST" },
            ]
          : [{ type: "Categories" as const, id: "LIST" }],
    }),
    getCategoryById: builder.query<Category, string>({
      query: (id): FetchArgs => ({ url: `/categories/${id}` }), // 👈
      providesTags: (_r, _e, id) => [{ type: "Categories", id }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListCategoriesQuery,
  useGetCategoryByIdQuery,
} = categoriesApi;

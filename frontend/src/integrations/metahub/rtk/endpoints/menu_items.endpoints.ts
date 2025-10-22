
// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/menu_items.endpoints.ts
// =============================================================
import { baseApi as baseApi_m1 } from "../baseApi";

type BoolLike = 0 | 1 | boolean;

export type MenuItem = {
  id: string;
  title: string;
  slug?: string | null;
  href?: string | null; // external or internal
  parent_id?: string | null;
  position?: number | null;
  is_active?: BoolLike;
  locale?: string | null;
  created_at?: string;
  updated_at?: string;
};

export const menuItemsApi = baseApi_m1.injectEndpoints({
  endpoints: (b) => ({
    listMenuItems: b.query<
      MenuItem[],
      { locale?: string; is_active?: BoolLike; parent_id?: string | null; limit?: number; offset?: number; sort?: "position" | "created_at"; order?: "asc" | "desc" }
    >({
      query: (params) => ({ url: "/menu_items", params }),
      transformResponse: (res: unknown): MenuItem[] => (Array.isArray(res) ? (res as MenuItem[]) : []),
      providesTags: (result) =>
        result
          ? [...result.map((i) => ({ type: "MenuItem" as const, id: i.id })), { type: "MenuItems" as const, id: "LIST" }]
          : [{ type: "MenuItems" as const, id: "LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const { useListMenuItemsQuery } = menuItemsApi;
// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/menu_items.endpoints.ts
// =============================================================
import { baseApi } from "../baseApi";
import type { MenuItemRow, MenuPublicListParams } from "../../db/types/menu";

const BASE = "/menu_items";

const toParams = (p?: MenuPublicListParams | void) => {
  if (!p) return undefined;
  const params: Record<string, string> = {};
  if (p.order) params.order = p.order;
  if (p.is_active !== undefined) params.is_active = String(p.is_active);
  if (p.parent_id !== undefined && p.parent_id !== null) params.parent_id = p.parent_id;
  if (p.parent_id === null) params.parent_id = ""; // BE null'u query'de özel işliyorsa göndermeyebilirsin
  if (p.limit != null) params.limit = String(p.limit);
  if (p.offset != null) params.offset = String(p.offset);

  // yoksayılanlar ama FE gönderebilir:
  if (p.locale) params.locale = p.locale;
  if (p.select) params.select = p.select;
  if (p.location) params.location = p.location;
  if (p.section_id != null) params.section_id = String(p.section_id);

  return params;
};

export const menuItemsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listMenuItems: b.query<MenuItemRow[], MenuPublicListParams | void>({
      query: (q) => {
        const params = toParams(q);
        return params ? { url: BASE, params } : { url: BASE };
      },
      transformResponse: (res: unknown): MenuItemRow[] =>
        Array.isArray(res) ? (res as unknown as MenuItemRow[]) : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((i) => ({ type: "MenuItems" as const, id: i.id })),
              { type: "MenuItems" as const, id: "LIST" },
            ]
          : [{ type: "MenuItems" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getMenuItemById: b.query<MenuItemRow, string>({
      query: (id) => ({ url: `${BASE}/${id}` }),
      transformResponse: (res: unknown): MenuItemRow => res as MenuItemRow,
      providesTags: (_r, _e, id) => [{ type: "MenuItems", id }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListMenuItemsQuery,
  useGetMenuItemByIdQuery,
} = menuItemsApi;

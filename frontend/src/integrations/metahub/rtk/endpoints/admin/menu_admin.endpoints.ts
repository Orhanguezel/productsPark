// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/menu_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../../baseApi";
import type { MenuItemRow } from "../../../db/types";

/** Utils */
const toNum = (x: unknown): number => (typeof x === "number" ? x : Number(x ?? 0));
const toBool = (x: unknown): boolean => {
  if (typeof x === "boolean") return x;
  if (typeof x === "number") return x !== 0;
  const s = String(x ?? "").trim().toLowerCase();
  return s === "1" || s === "true";
};

/** Raw (BE) */
export type ApiMenuItemAdmin = {
  id: string;
  title?: string | null;
  url?: string | null;
  href?: string | null;
  type?: "page" | "custom" | null;
  page_id?: string | null;
  parent_id?: string | null;
  location?: "header" | "footer" | null;
  icon?: string | null;
  section_id?: string | null;
  is_active?: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  display_order?: number | string | null;
  position?: number | string | null;
  created_at?: string;
  updated_at?: string;
};

/** FE normalize — merkez tip + admin ek alanları */
export type MenuItemAdmin = MenuItemRow & {
  type: "page" | "custom";
  page_id: string | null;
  display_order: number;
};

const normalizeMenuItem = (p: ApiMenuItemAdmin): MenuItemAdmin => ({
  id: p.id,
  title: String(p.title ?? ""),
  url: String(p.url ?? p.href ?? ""),
  section_id: (p.section_id ?? null) as string | null,
  icon: (p.icon ?? null) as string | null,
  is_active: toBool(p.is_active),

  href: p.href ?? null,
  slug: null,
  parent_id: p.parent_id ?? null,
  position: toNum(p.position ?? p.display_order ?? 0),
  order_num: toNum(p.position ?? p.display_order ?? 0),
  location: (p.location ?? (p.section_id ? "footer" : "header")) as "header" | "footer",
  locale: null,
  created_at: p.created_at,
  updated_at: p.updated_at,

  type: (p.type ?? "custom") as "page" | "custom",
  page_id: p.page_id ?? null,
  display_order: toNum(p.display_order ?? p.position ?? 0),
});

/** List filters (admin) */
export type MenuAdminListParams = {
  q?: string;
  location?: "header" | "footer";
  section_id?: string | null;
  parent_id?: string | null;
  is_active?: boolean;
  limit?: number;
  offset?: number;
  sort?: "display_order" | "created_at" | "title";
  order?: "asc" | "desc";
};

/** Upsert FE body (admin) */
export type UpsertMenuItemBody = {
  title: string;
  url: string; // merkez tip: string (null değil)
  type: "page" | "custom";
  page_id?: string | null;
  parent_id?: string | null;
  location: "header" | "footer";
  icon?: string | null;
  section_id?: string | null;
  is_active?: boolean;
  display_order?: number;
};

/** FE -> BE body map */
const toApiBody = (b: UpsertMenuItemBody) => ({
  title: b.title,
  url: b.url ?? "",
  href: b.url ?? "",
  type: b.type,
  page_id: b.type === "page" ? b.page_id ?? null : null,
  parent_id: b.parent_id ?? null,
  location: b.location,
  icon: b.icon ?? null,
  section_id: b.location === "footer" ? b.section_id ?? null : null,
  is_active: b.is_active ?? true,
  display_order: b.display_order ?? 0,
  position: b.display_order ?? 0,
});

const toParams = (p?: MenuAdminListParams | void) => {
  if (!p) return undefined;
  const params: Record<string, string> = {};
  if (p.q) params.q = p.q;
  if (p.location) params.location = p.location;
  if (p.section_id != null) params.section_id = String(p.section_id);
  if (p.parent_id != null) params.parent_id = String(p.parent_id);
  if (typeof p.is_active === "boolean") params.is_active = String(p.is_active);
  if (p.limit != null) params.limit = String(p.limit);
  if (p.offset != null) params.offset = String(p.offset);
  if (p.sort) params.sort = p.sort;
  if (p.order) params.order = p.order;
  return params;
};

const BASE = "/admin/menu_items";

export const menuAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listMenuItemsAdmin: b.query<MenuItemAdmin[], MenuAdminListParams | void>({
      query: (q) => ({ url: `${BASE}`, params: toParams(q) }),
      transformResponse: (res: unknown): MenuItemAdmin[] =>
        Array.isArray(res) ? (res as ApiMenuItemAdmin[]).map(normalizeMenuItem) : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((i) => ({ type: "MenuItems" as const, id: i.id })),
              { type: "MenuItems" as const, id: "LIST" },
            ]
          : [{ type: "MenuItems" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getMenuItemAdminById: b.query<MenuItemAdmin, string>({
      query: (id) => ({ url: `${BASE}/${id}` }),
      transformResponse: (res: unknown): MenuItemAdmin => normalizeMenuItem(res as ApiMenuItemAdmin),
      providesTags: (_r, _e, id) => [{ type: "MenuItems", id }],
    }),

    createMenuItemAdmin: b.mutation<MenuItemAdmin, UpsertMenuItemBody>({
      query: (body) => ({ url: `${BASE}`, method: "POST", body: toApiBody(body) }),
      transformResponse: (res: unknown): MenuItemAdmin => normalizeMenuItem(res as ApiMenuItemAdmin),
      invalidatesTags: [{ type: "MenuItems", id: "LIST" }],
    }),

    updateMenuItemAdmin: b.mutation<MenuItemAdmin, { id: string; body: UpsertMenuItemBody }>({
      query: ({ id, body }) => ({ url: `${BASE}/${id}`, method: "PATCH", body: toApiBody(body) }),
      transformResponse: (res: unknown): MenuItemAdmin => normalizeMenuItem(res as ApiMenuItemAdmin),
      invalidatesTags: (_r, _e, arg) => [
        { type: "MenuItems", id: arg.id },
        { type: "MenuItems", id: "LIST" },
      ],
    }),

    deleteMenuItemAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `${BASE}/${id}`, method: "DELETE" }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, id) => [
        { type: "MenuItems", id },
        { type: "MenuItems", id: "LIST" },
      ],
    }),

    /** Reorder (toplu) */
    reorderMenuItemsAdmin: b.mutation<{ ok: true }, Array<{ id: string; display_order: number }>>({
      query: (items) => ({ url: `${BASE}/reorder`, method: "POST", body: { items } }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: [{ type: "MenuItems", id: "LIST" }],
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
} = menuAdminApi;

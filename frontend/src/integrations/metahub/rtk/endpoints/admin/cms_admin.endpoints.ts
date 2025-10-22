// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/cms_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../../baseApi";

// helpers
const toNumber = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));
const toIso = (x: unknown): string => new Date(x as string | number | Date).toISOString();
const toBool = (x: unknown): boolean => (typeof x === "boolean" ? x : String(x).toLowerCase() === "true" || String(x) === "1");
const tryParse = <T>(x: unknown): T => {
  if (typeof x === "string") {
    try { return JSON.parse(x) as T; } catch {/* noop */}
  }
  return x as T;
};
const arr = <T>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : []);

// -------------------- PAGES --------------------
export type PageStatus = "draft" | "published" | "archived";
export type PageSeo = { meta_title?: string | null; meta_description?: string | null; og_image_url?: string | null; indexable?: boolean };
export type Page = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: unknown;              // rich JSON or HTML string parsed to object|string
  status: PageStatus;
  seo: PageSeo | null;
  author_id: string | null;
  created_at: string;            // ISO
  updated_at: string;            // ISO
  published_at: string | null;   // ISO
};

export type ApiPage = Omit<Page, "content" | "seo" | "created_at" | "updated_at" | "published_at"> & {
  content: string | unknown;
  seo: string | PageSeo | null;
  created_at: string | number | Date;
  updated_at: string | number | Date;
  published_at: string | number | Date | null;
};

const normalizePage = (p: ApiPage): Page => ({
  ...p,
  content: p.content == null ? null : tryParse<unknown>(p.content),
  seo: p.seo == null ? null : tryParse<PageSeo>(p.seo),
  created_at: toIso(p.created_at),
  updated_at: toIso(p.updated_at),
  published_at: p.published_at == null ? null : toIso(p.published_at),
});

export type PageListParams = {
  q?: string;            // title/slug/desc
  status?: PageStatus;
  limit?: number; offset?: number;
  sort?: "created_at" | "updated_at" | "title" | "published_at";
  order?: "asc" | "desc";
};

export type CreatePageBody = {
  slug: string; title: string; description?: string | null; content?: unknown; status?: PageStatus; seo?: PageSeo | null;
};
export type UpdatePageBody = Partial<CreatePageBody>;
export type ExportResponse = { url: string; expires_at: string | null };

// -------------------- BLOCKS --------------------
export type Block = {
  id: string;
  key: string;                    // e.g. "home.hero"
  type: string;                   // e.g. "richtext" | "banner" | "cta"
  data: unknown;                  // JSON payload
  is_active: boolean;
  updated_at: string;
};

export type ApiBlock = Omit<Block, "data" | "updated_at" | "is_active"> & {
  data: string | unknown;
  is_active: boolean | 0 | 1 | "0" | "1" | string;
  updated_at: string | number | Date;
};

const normalizeBlock = (b: ApiBlock): Block => ({
  ...b,
  data: b.data == null ? null : tryParse<unknown>(b.data),
  is_active: toBool(b.is_active),
  updated_at: toIso(b.updated_at),
});

export type BlockListParams = { q?: string; key?: string; type?: string; is_active?: boolean; limit?: number; offset?: number; sort?: "updated_at" | "key"; order?: "asc" | "desc" };
export type CreateBlockBody = { key: string; type: string; data: unknown; is_active?: boolean };
export type UpdateBlockBody = Partial<CreateBlockBody>;

// -------------------- MENUS --------------------
export type MenuItem = { id: string; label: string; url: string; external?: boolean; children?: MenuItem[] };
export type Menu = { id: string; key: string; name: string; items: MenuItem[]; updated_at: string };
export type ApiMenu = Omit<Menu, "items" | "updated_at"> & { items: string | MenuItem[]; updated_at: string | number | Date };
const normalizeMenu = (m: ApiMenu): Menu => ({ ...m, items: arr<MenuItem>(typeof m.items === "string" ? tryParse<MenuItem[]>(m.items) : m.items), updated_at: toIso(m.updated_at) });

export type CreateMenuBody = { key: string; name: string; items?: MenuItem[] };
export type UpdateMenuBody = Partial<CreateMenuBody>;

// -------------------- REDIRECTS --------------------
export type Redirect = { id: string; source: string; target: string; code: 301 | 302; is_active: boolean; hit_count: number; created_at: string };
export type ApiRedirect = Omit<Redirect, "created_at" | "is_active" | "hit_count"> & { created_at: string | number | Date; is_active: boolean | 0 | 1 | "0" | "1" | string; hit_count: number | string };
const normalizeRedirect = (r: ApiRedirect): Redirect => ({ ...r, created_at: toIso(r.created_at), is_active: toBool(r.is_active), hit_count: toNumber(r.hit_count) });

export type RedirectListParams = { q?: string; code?: 301 | 302; is_active?: boolean; limit?: number; offset?: number; sort?: "created_at" | "hit_count" | "source"; order?: "asc" | "desc" };
export type CreateRedirectBody = { source: string; target: string; code?: 301 | 302; is_active?: boolean };
export type UpdateRedirectBody = Partial<CreateRedirectBody>;
export type ImportRedirectItem = { source: string; target: string; code?: 301 | 302; is_active?: boolean };

export const cmsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // ------ Pages ------
    listPagesAdmin: b.query<Page[], PageListParams | void>({
      query: () => ({ url: "/cms/pages" }),
      transformResponse: (res: unknown): Page[] => {
        if (Array.isArray(res)) return (res as ApiPage[]).map(normalizePage);
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as ApiPage[]).map(normalizePage) : [];
      },
      providesTags: (result) => result ? [
        ...result.map((x) => ({ type: "CmsPage" as const, id: x.id })),
        { type: "CmsPages" as const, id: "LIST" },
      ] : [{ type: "CmsPages" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getPageAdminById: b.query<Page, string>({
      query: (id) => ({ url: `/cms/pages/${id}` }),
      transformResponse: (res: unknown): Page => normalizePage(res as ApiPage),
      providesTags: (_r, _e, id) => [{ type: "CmsPage", id }],
    }),

    getPageAdminBySlug: b.query<Page, string>({
      query: (slug) => ({ url: `/cms/pages/by-slug/${encodeURIComponent(slug)}` }),
      transformResponse: (res: unknown): Page => normalizePage(res as ApiPage),
      providesTags: (_r, _e, slug) => [{ type: "CmsPage", id: `SLUG_${slug}` }],
    }),

    createPageAdmin: b.mutation<Page, CreatePageBody>({
      query: (body) => ({ url: "/cms/pages", method: "POST", body }),
      transformResponse: (res: unknown): Page => normalizePage(res as ApiPage),
      invalidatesTags: [{ type: "CmsPages" as const, id: "LIST" }],
    }),

    updatePageAdmin: b.mutation<Page, { id: string; body: UpdatePageBody }>({
      query: ({ id, body }) => ({ url: `/cms/pages/${id}`, method: "PATCH", body }),
      transformResponse: (res: unknown): Page => normalizePage(res as ApiPage),
      invalidatesTags: (_r, _e, arg) => [{ type: "CmsPage", id: arg.id }, { type: "CmsPages", id: "LIST" }],
    }),

    deletePageAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `/cms/pages/${id}`, method: "DELETE" }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: "CmsPages" as const, id: "LIST" }],
    }),

    publishPageAdmin: b.mutation<Page, string>({
      query: (id) => ({ url: `/cms/pages/${id}/publish`, method: "POST" }),
      transformResponse: (res: unknown): Page => normalizePage(res as ApiPage),
      invalidatesTags: (_r, _e, id) => [{ type: "CmsPage", id }, { type: "CmsPages", id: "LIST" }],
    }),

    unpublishPageAdmin: b.mutation<Page, string>({
      query: (id) => ({ url: `/cms/pages/${id}/unpublish`, method: "POST" }),
      transformResponse: (res: unknown): Page => normalizePage(res as ApiPage),
      invalidatesTags: (_r, _e, id) => [{ type: "CmsPage", id }, { type: "CmsPages", id: "LIST" }],
    }),

    duplicatePageAdmin: b.mutation<Page, string>({
      query: (id) => ({ url: `/cms/pages/${id}/duplicate`, method: "POST" }),
      transformResponse: (res: unknown): Page => normalizePage(res as ApiPage),
      invalidatesTags: [{ type: "CmsPages" as const, id: "LIST" }],
    }),

    exportPagesAdmin: b.mutation<ExportResponse, PageListParams | void>({
      query: () => ({ url: "/cms/pages/export", method: "GET" }),
      transformResponse: (res: unknown): ExportResponse => {
        const r = res as { url?: unknown; expires_at?: unknown };
        return { url: String(r?.url ?? ""), expires_at: r?.expires_at ? toIso(r.expires_at) : null };
      },
    }),

    // ------ Blocks ------
    listBlocksAdmin: b.query<Block[], BlockListParams | void>({
      query: () => ({ url: "/cms/blocks" }),
      transformResponse: (res: unknown): Block[] => {
        if (Array.isArray(res)) return (res as ApiBlock[]).map(normalizeBlock);
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as ApiBlock[]).map(normalizeBlock) : [];
      },
      providesTags: (result) => result ? [
        ...result.map((x) => ({ type: "CmsBlock" as const, id: x.id })),
        { type: "CmsBlocks" as const, id: "LIST" },
      ] : [{ type: "CmsBlocks" as const, id: "LIST" }],
    }),

    getBlockAdminById: b.query<Block, string>({
      query: (id) => ({ url: `/cms/blocks/${id}` }),
      transformResponse: (res: unknown): Block => normalizeBlock(res as ApiBlock),
      providesTags: (_r, _e, id) => [{ type: "CmsBlock", id }],
    }),

    createBlockAdmin: b.mutation<Block, CreateBlockBody>({
      query: (body) => ({ url: "/cms/blocks", method: "POST", body }),
      transformResponse: (res: unknown): Block => normalizeBlock(res as ApiBlock),
      invalidatesTags: [{ type: "CmsBlocks" as const, id: "LIST" }],
    }),

    updateBlockAdmin: b.mutation<Block, { id: string; body: UpdateBlockBody }>({
      query: ({ id, body }) => ({ url: `/cms/blocks/${id}`, method: "PATCH", body }),
      transformResponse: (res: unknown): Block => normalizeBlock(res as ApiBlock),
      invalidatesTags: (_r, _e, arg) => [{ type: "CmsBlock", id: arg.id }, { type: "CmsBlocks", id: "LIST" }],
    }),

    deleteBlockAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `/cms/blocks/${id}`, method: "DELETE" }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: "CmsBlocks" as const, id: "LIST" }],
    }),

    // ------ Menus ------
    listMenusAdmin: b.query<Menu[], void | { q?: string }>({
      query: () => ({ url: "/cms/menus" }),
      transformResponse: (res: unknown): Menu[] => {
        if (Array.isArray(res)) return (res as ApiMenu[]).map(normalizeMenu);
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as ApiMenu[]).map(normalizeMenu) : [];
      },
      providesTags: (result) => result ? [
        ...result.map((x) => ({ type: "CmsMenu" as const, id: x.id })),
        { type: "CmsMenus" as const, id: "LIST" },
      ] : [{ type: "CmsMenus" as const, id: "LIST" }],
    }),

    getMenuAdminById: b.query<Menu, string>({
      query: (id) => ({ url: `/cms/menus/${id}` }),
      transformResponse: (res: unknown): Menu => normalizeMenu(res as ApiMenu),
      providesTags: (_r, _e, id) => [{ type: "CmsMenu", id }],
    }),

    createMenuAdmin: b.mutation<Menu, CreateMenuBody>({
      query: (body) => ({ url: "/cms/menus", method: "POST", body }),
      transformResponse: (res: unknown): Menu => normalizeMenu(res as ApiMenu),
      invalidatesTags: [{ type: "CmsMenus" as const, id: "LIST" }],
    }),

    updateMenuAdmin: b.mutation<Menu, { id: string; body: UpdateMenuBody }>({
      query: ({ id, body }) => ({ url: `/cms/menus/${id}`, method: "PATCH", body }),
      transformResponse: (res: unknown): Menu => normalizeMenu(res as ApiMenu),
      invalidatesTags: (_r, _e, arg) => [{ type: "CmsMenu", id: arg.id }, { type: "CmsMenus", id: "LIST" }],
    }),

    deleteMenuAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `/cms/menus/${id}`, method: "DELETE" }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: "CmsMenus" as const, id: "LIST" }],
    }),

    updateMenuItemsAdmin: b.mutation<Menu, { id: string; items: MenuItem[] }>({
      query: ({ id, items }) => ({ url: `/cms/menus/${id}/items`, method: "POST", body: { items } }),
      transformResponse: (res: unknown): Menu => normalizeMenu(res as ApiMenu),
      invalidatesTags: (_r, _e, arg) => [{ type: "CmsMenu", id: arg.id }],
    }),

    // ------ Redirects ------
    listRedirectsAdmin: b.query<Redirect[], RedirectListParams | void>({
      query: () => ({ url: "/cms/redirects" }),
      transformResponse: (res: unknown): Redirect[] => {
        if (Array.isArray(res)) return (res as ApiRedirect[]).map(normalizeRedirect);
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as ApiRedirect[]).map(normalizeRedirect) : [];
      },
      providesTags: (result) => result ? [
        ...result.map((x) => ({ type: "Redirect" as const, id: x.id })),
        { type: "Redirects" as const, id: "LIST" },
      ] : [{ type: "Redirects" as const, id: "LIST" }],
    }),

    getRedirectAdminById: b.query<Redirect, string>({
      query: (id) => ({ url: `/cms/redirects/${id}` }),
      transformResponse: (res: unknown): Redirect => normalizeRedirect(res as ApiRedirect),
      providesTags: (_r, _e, id) => [{ type: "Redirect", id }],
    }),

    createRedirectAdmin: b.mutation<Redirect, CreateRedirectBody>({
      query: (body) => ({ url: "/cms/redirects", method: "POST", body }),
      transformResponse: (res: unknown): Redirect => normalizeRedirect(res as ApiRedirect),
      invalidatesTags: [{ type: "Redirects" as const, id: "LIST" }],
    }),

    updateRedirectAdmin: b.mutation<Redirect, { id: string; body: UpdateRedirectBody }>({
      query: ({ id, body }) => ({ url: `/cms/redirects/${id}`, method: "PATCH", body }),
      transformResponse: (res: unknown): Redirect => normalizeRedirect(res as ApiRedirect),
      invalidatesTags: (_r, _e, arg) => [{ type: "Redirect", id: arg.id }, { type: "Redirects", id: "LIST" }],
    }),

    deleteRedirectAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `/cms/redirects/${id}`, method: "DELETE" }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: "Redirects" as const, id: "LIST" }],
    }),

    importRedirectsAdmin: b.mutation<{ imported: number }, { items: ImportRedirectItem[] } | { csv: string }>({
      query: (body) => ({ url: "/cms/redirects/import", method: "POST", body }),
      transformResponse: (res: unknown): { imported: number } => ({ imported: toNumber((res as { imported?: unknown })?.imported ?? 0) }),
      invalidatesTags: [{ type: "Redirects" as const, id: "LIST" }],
    }),

    exportRedirectsAdmin: b.mutation<ExportResponse, RedirectListParams | void>({
      query: () => ({ url: "/cms/redirects/export", method: "GET" }),
      transformResponse: (res: unknown): ExportResponse => {
        const r = res as { url?: unknown; expires_at?: unknown };
        return { url: String(r?.url ?? ""), expires_at: r?.expires_at ? toIso(r.expires_at) : null };
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  // pages
  useListPagesAdminQuery,
  useGetPageAdminByIdQuery,
  useGetPageAdminBySlugQuery,
  useCreatePageAdminMutation,
  useUpdatePageAdminMutation,
  useDeletePageAdminMutation,
  usePublishPageAdminMutation,
  useUnpublishPageAdminMutation,
  useDuplicatePageAdminMutation,
  useExportPagesAdminMutation,
  // blocks
  useListBlocksAdminQuery,
  useGetBlockAdminByIdQuery,
  useCreateBlockAdminMutation,
  useUpdateBlockAdminMutation,
  useDeleteBlockAdminMutation,
  // menus
  useListMenusAdminQuery,
  useGetMenuAdminByIdQuery,
  useCreateMenuAdminMutation,
  useUpdateMenuAdminMutation,
  useDeleteMenuAdminMutation,
  useUpdateMenuItemsAdminMutation,
  // redirects
  useListRedirectsAdminQuery,
  useGetRedirectAdminByIdQuery,
  useCreateRedirectAdminMutation,
  useUpdateRedirectAdminMutation,
  useDeleteRedirectAdminMutation,
  useImportRedirectsAdminMutation,
  useExportRedirectsAdminMutation,
} = cmsAdminApi;

// ----------------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/footer_sections_admin.endpoints.ts
// ----------------------------------------------------------------------
import { baseApi } from "../../baseApi";

const toNum = (x: unknown): number => (typeof x === "number" ? x : Number(x ?? 0));
const toBool = (x: unknown): boolean => {
  if (typeof x === "boolean") return x;
  if (typeof x === "number") return x !== 0;
  const s = String(x ?? "").trim().toLowerCase();
  return s === "1" || s === "true";
};

export type ApiFooterSection = {
  id: string;
  title?: string | null;
  is_active?: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  display_order?: number | string | null;
  position?: number | string | null;
  created_at?: string;
  updated_at?: string;
};

export type FooterSection = {
  id: string;
  title: string;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
};

const normalize = (p: ApiFooterSection): FooterSection => ({
  id: p.id,
  title: String(p.title ?? ""),
  is_active: toBool(p.is_active),
  display_order: toNum(p.display_order ?? p.position ?? 0),
  created_at: p.created_at,
  updated_at: p.updated_at,
});

export type FooterSectionListParams = {
  is_active?: boolean;
  limit?: number;
  offset?: number;
  sort?: "display_order" | "created_at" | "title";
  order?: "asc" | "desc";
};

export type UpsertFooterSectionBody = {
  title: string;
  is_active?: boolean;
  display_order?: number;
};

const toApiBody = (b: UpsertFooterSectionBody) => ({
  title: b.title,
  is_active: b.is_active ?? true,
  display_order: b.display_order ?? 0,
  position: b.display_order ?? 0, // uyumluluk
});

const BASE = "/admin/footer_sections";

export const footerSectionsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listFooterSectionsAdmin: b.query<FooterSection[], FooterSectionListParams | void>({
      query: () => ({ url: `${BASE}` }),
      transformResponse: (res: unknown): FooterSection[] =>
        Array.isArray(res) ? (res as ApiFooterSection[]).map(normalize) : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((i) => ({ type: "FooterSections" as const, id: i.id })),
              { type: "FooterSections" as const, id: "LIST" },
            ]
          : [{ type: "FooterSections" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getFooterSectionAdminById: b.query<FooterSection, string>({
      query: (id) => ({ url: `${BASE}/${id}` }),
      transformResponse: (res: unknown): FooterSection => normalize(res as ApiFooterSection),
      providesTags: (_r, _e, id) => [{ type: "FooterSections", id }],
    }),

    createFooterSectionAdmin: b.mutation<FooterSection, UpsertFooterSectionBody>({
      query: (body) => ({ url: `${BASE}`, method: "POST", body: toApiBody(body) }),
      transformResponse: (res: unknown): FooterSection => normalize(res as ApiFooterSection),
      invalidatesTags: [{ type: "FooterSections", id: "LIST" }],
    }),

    updateFooterSectionAdmin: b.mutation<FooterSection, { id: string; body: UpsertFooterSectionBody }>({
      query: ({ id, body }) => ({ url: `${BASE}/${id}`, method: "PATCH", body: toApiBody(body) }),
      transformResponse: (res: unknown): FooterSection => normalize(res as ApiFooterSection),
      invalidatesTags: (_r, _e, arg) => [
        { type: "FooterSections", id: arg.id },
        { type: "FooterSections", id: "LIST" },
      ],
    }),

    deleteFooterSectionAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `${BASE}/${id}`, method: "DELETE" }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, id) => [
        { type: "FooterSections", id },
        { type: "FooterSections", id: "LIST" },
      ],
    }),

    reorderFooterSectionsAdmin: b.mutation<{ ok: true }, Array<{ id: string; display_order: number }>>({
      query: (items) => ({ url: `${BASE}/reorder`, method: "POST", body: { items } }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: [{ type: "FooterSections", id: "LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListFooterSectionsAdminQuery,
  useGetFooterSectionAdminByIdQuery,
  useCreateFooterSectionAdminMutation,
  useUpdateFooterSectionAdminMutation,
  useDeleteFooterSectionAdminMutation,
  useReorderFooterSectionsAdminMutation,
} = footerSectionsAdminApi;

// ----------------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/footer_sections_admin.endpoints.ts
// ----------------------------------------------------------------------
import { baseApi } from "../../baseApi";
import type {
  ApiFooterSection,
  FooterSection,
  FooterSectionListParams,
  UpsertFooterSectionBody,
  ReorderFooterSectionItem,
  FooterLink,
} from "@/integrations/metahub/db/types/footer";

/* utils */
const toNum = (x: unknown): number =>
  typeof x === "number" ? x : Number(x ?? 0);

const toBool = (x: unknown): boolean => {
  if (x === null || x === undefined) return true; // BE default'u true
  if (typeof x === "boolean") return x;
  if (typeof x === "number") return x !== 0;
  const s = String(x).trim().toLowerCase();
  return s === "1" || s === "true";
};

const safeParseLinks = (s: unknown): FooterLink[] => {
  if (Array.isArray(s)) return s as FooterLink[];
  if (typeof s !== "string") return [];
  try {
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? (parsed as FooterLink[]) : [];
  } catch {
    return [];
  }
};

const getUnknown = (obj: object, key: string): unknown =>
  (obj as Record<string, unknown>)[key];

const normalize = (p: ApiFooterSection): FooterSection => {
  const linksRaw = getUnknown(p, "links");
  return {
    id: p.id,
    title: String(p.title ?? ""),
    is_active: toBool(p.is_active),
    links: safeParseLinks(linksRaw),
    display_order: toNum(p.display_order ?? 0),
    created_at: p.created_at ?? null,
    updated_at: p.updated_at ?? null,
  };
};

/** FE -> BE body map (links dizi -> JSON string) */
const toApiBody = (b: UpsertFooterSectionBody) => ({
  title: b.title,
  is_active: b.is_active ?? true,
  links: JSON.stringify(b.links ?? []),
  display_order: b.display_order ?? 0,
});

/** Query param map (admin) */
const toParams = (p?: FooterSectionListParams | void) => {
  if (!p) return undefined;
  const params: Record<string, string> = {};
  if (p.q) params.q = p.q;
  if (typeof p.is_active === "boolean") params.is_active = String(p.is_active);
  if (p.limit != null) params.limit = String(p.limit);
  if (p.offset != null) params.offset = String(p.offset);
  if (p.sort) params.sort = p.sort; // "display_order" | "created_at" | "title"
  if (p.order) params.order = p.order;
  return params;
};

const BASE = "/admin/footer_sections";

export const footerSectionsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listFooterSectionsAdmin: b.query<FooterSection[], FooterSectionListParams | void>({
      query: (q) => {
        const params = toParams(q);
        return params ? { url: BASE, params } : { url: BASE };
      },
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
      query: (body) => ({ url: BASE, method: "POST", body: toApiBody(body) }),
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
      transformResponse: (): { ok: true } => ({ ok: true }), // 204'e uyumlu
      invalidatesTags: (_r, _e, id) => [
        { type: "FooterSections", id },
        { type: "FooterSections", id: "LIST" },
      ],
    }),

    reorderFooterSectionsAdmin: b.mutation<{ ok: true }, ReorderFooterSectionItem[]>({
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

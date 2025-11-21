// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/footer_sections.endpoints.ts
// =============================================================
import { baseApi } from "../baseApi";
import type {
  ApiFooterSection,
  FooterSection,
  FooterPublicListParams,
  FooterLink,
} from "@/integrations/metahub/rtk/types/footer";

/* utils */
const toNum = (x: unknown): number =>
  typeof x === "number" ? x : Number(x ?? 0);

const toBool = (x: unknown): boolean => {
  if (x === null || x === undefined) return true;
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

const normalizePublic = (f: ApiFooterSection): FooterSection => ({
  id: f.id,
  title: String(f.title ?? ""),
  links: safeParseLinks(f.links),
  display_order: toNum(f.display_order ?? 0),
  is_active: toBool(f.is_active),
  created_at: f.created_at ?? null,
  updated_at: f.updated_at ?? null,
});

const toParams = (p?: FooterPublicListParams | void) => {
  if (!p) return undefined;
  const params: Record<string, string> = {};
  if (p.q) params.q = p.q;
  if (typeof p.is_active === "boolean") params.is_active = String(p.is_active);
  if (p.limit != null) params.limit = String(p.limit);
  if (p.offset != null) params.offset = String(p.offset);
  if (p.order) params.order = p.order;
  return params;
};

const BASE = "/footer_sections";

export const footerSectionsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listFooterSections: b.query<FooterSection[], FooterPublicListParams | void>({
      query: (q) => {
        const params = toParams(q);
        return params ? { url: BASE, params } : { url: BASE };
      },
      transformResponse: (res: unknown): FooterSection[] =>
        Array.isArray(res) ? (res as ApiFooterSection[]).map(normalizePublic) : [],
      providesTags: (result) =>
        result
          ? [
            ...result.map((i) => ({ type: "FooterSections" as const, id: i.id })),
            { type: "FooterSections" as const, id: "LIST" },
          ]
          : [{ type: "FooterSections" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getFooterSectionById: b.query<FooterSection, string>({
      query: (id) => ({ url: `${BASE}/${id}` }),
      transformResponse: (res: unknown): FooterSection => normalizePublic(res as ApiFooterSection),
      providesTags: (_r, _e, id) => [{ type: "FooterSections", id }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListFooterSectionsQuery,
  useGetFooterSectionByIdQuery,
} = footerSectionsApi;

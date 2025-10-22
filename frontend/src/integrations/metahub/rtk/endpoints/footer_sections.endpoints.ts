

// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/footer_sections.endpoints.ts
// =============================================================
import { baseApi as baseApi_m2 } from "../baseApi";

const tryParse_m2 = <T>(x: unknown): T => {
  if (typeof x === "string") { try { return JSON.parse(x) as T; } catch { /* noop */ } }
  return x as T;
};

type BoolLike2 = 0 | 1 | boolean;

export type FooterSection = {
  id: string;
  key: string;           // e.g., "company", "support"
  title?: string | null;
  locale?: string | null;
  content_html?: string | null; // rich text
  links?: Array<{ label: string; href: string; external?: boolean }>; // may arrive as JSON-string
  is_active?: BoolLike2;
  created_at?: string;
  updated_at?: string;
};

export type ApiFooterSection = Omit<FooterSection, "links"> & { links?: string | FooterSection["links"] };

const normalizeFooterSection = (f: ApiFooterSection): FooterSection => ({
  ...f,
  links: f.links ? tryParse_m2<FooterSection["links"]>(f.links) : undefined,
});

export const footerSectionsApi = baseApi_m2.injectEndpoints({
  endpoints: (b) => ({
    listFooterSections: b.query<FooterSection[], { locale?: string; is_active?: BoolLike2 }>({
      query: (params) => ({ url: "/footer_sections", params }),
      transformResponse: (res: unknown): FooterSection[] => Array.isArray(res) ? (res as ApiFooterSection[]).map(normalizeFooterSection) : [],
      providesTags: (result) => result
        ? [...result.map((i) => ({ type: "FooterSection" as const, id: i.id })), { type: "FooterSections" as const, id: "LIST" }]
        : [{ type: "FooterSections" as const, id: "LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const { useListFooterSectionsQuery } = footerSectionsApi;

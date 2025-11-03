// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/admin/email_templates_admin.endpoints.ts
// =============================================================
import { baseApi } from "../../baseApi";
import type { EmailTemplateRow, EmailTemplateView } from "../../../db/types/email";

// helpers
const toBool = (v: unknown): boolean =>
  v === true || v === 1 || v === "1" || v === "true";

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const extractHtml = (raw: unknown): string => {
  if (typeof raw === "string") return raw;
  if (isObj(raw) && typeof raw["html"] === "string") return raw["html"] as string;
  return "";
};
const str = (v: unknown): string =>
  typeof v === "string" ? v : v == null ? "" : String(v);

const toArrayOfStrings = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((x): x is string => typeof x === "string");
      }
    } catch {
      // fallthrough
    }
    return v.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

// row -> view
const toView = (row: unknown): EmailTemplateView => {
   const r = (row ?? {}) as Record<string, unknown>;
  const htmlSrc = r["body_html"] ?? r["content"] ?? r["html"] ?? r["body"];
   return {
    id: str(r["id"]),
    key: str(r["template_key"] ?? r["key"]),
    // ŞABLON ADI: template_name yoksa olası alternatiflere bak
    name: str(r["template_name"] ?? r["name"] ?? r["title"]),
    // KONU: subject yoksa alternatif adlara bak
    subject: str(r["subject"] ?? r["mail_subject"] ?? r["title"]),
    content_html: extractHtml(htmlSrc),
    variables: toArrayOfStrings(r["variables"]),
    is_active: toBool(r["is_active"]),
    locale: typeof r["locale"] === "string" ? (r["locale"] as string) : null,
    created_at: typeof r["created_at"] === "string" ? (r["created_at"] as string) : undefined,
    updated_at: typeof r["updated_at"] === "string" ? (r["updated_at"] as string) : undefined,
  };
};

const BASE = "/admin/email_templates";

export const emailTemplatesAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listEmailTemplatesAdmin: b.query<EmailTemplateView[], void>({
      query: () => ({ url: `${BASE}` }),
      transformResponse: (res: unknown): EmailTemplateView[] =>
        Array.isArray(res) ? (res as unknown[]).map(toView) : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((t) => ({ type: "EmailTemplates" as const, id: t.id })),
              { type: "EmailTemplates" as const, id: "LIST" },
            ]
          : [{ type: "EmailTemplates" as const, id: "LIST" }],
    }),

    getEmailTemplateAdminById: b.query<EmailTemplateView, string>({
      query: (id) => ({ url: `${BASE}/${id}` }),
      transformResponse: (res: unknown): EmailTemplateView => toView(res),
      providesTags: (_r, _e, id) => [{ type: "EmailTemplates", id }],
    }),

    createEmailTemplateAdmin: b.mutation<
      EmailTemplateView,
      // BE alanları ile yazıyoruz:
      {
        template_key: string;
        template_name: string;
        subject: string;
        content: string;
        variables?: unknown;
        is_active?: boolean | 0 | 1 | "0" | "1" | "true" | "false";
        locale?: string | null;
      }
    >({
      query: (body) => ({
        url: `${BASE}`,
        method: "POST",
        body,
      }),
      transformResponse: (res: unknown): EmailTemplateView => toView(res),
      invalidatesTags: [{ type: "EmailTemplates", id: "LIST" }],
    }),

    updateEmailTemplateAdmin: b.mutation<
      EmailTemplateView,
      {
        id: string;
        body: Partial<{
          template_key: string;
          template_name: string;
          subject: string;
          content: string;
          variables?: unknown;
          is_active?: boolean | 0 | 1 | "0" | "1" | "true" | "false";
          locale?: string | null;
        }>;
      }
    >({
      query: ({ id, body }) => ({
        url: `${BASE}/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (res: unknown): EmailTemplateView => toView(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: "EmailTemplates", id: arg.id },
        { type: "EmailTemplates", id: "LIST" },
      ],
    }),

    deleteEmailTemplateAdmin: b.mutation<void, string>({
      query: (id) => ({
        url: `${BASE}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "EmailTemplates", id: "LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListEmailTemplatesAdminQuery,
  useGetEmailTemplateAdminByIdQuery,
  useCreateEmailTemplateAdminMutation,
  useUpdateEmailTemplateAdminMutation,
  useDeleteEmailTemplateAdminMutation,
} = emailTemplatesAdminApi;

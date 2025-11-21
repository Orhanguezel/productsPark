// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/email_templates.endpoints.ts
// =============================================================
import { baseApi as baseApi_m5 } from "../baseApi";
import type { EmailTemplateRow, EmailTemplateView, BoolLike } from "../types/email";

// küçük yardımcılar (admin dosyasındakilerle eş)
const toBool = (x: BoolLike | undefined): boolean =>
  x === true || x === 1 || x === "1" || x === "true";

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const toArrayOfStrings = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((x): x is string => typeof x === "string");
      }
    } catch {/* ignored */
    }
    return v.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

const extractHtml = (raw: unknown): string => {
  if (typeof raw === "string") return raw;
  if (isObj(raw) && typeof raw["html"] === "string") return raw["html"] as string;
  return "";
};

const toView = (row: unknown): EmailTemplateView => {
  const r = (row ?? {}) as Partial<EmailTemplateRow>;
  const html = r.body_html ?? r.content;
  return {
    id: String(r.id ?? ""),
    key: String(r.template_key ?? ""),
    name: String(r.template_name ?? ""),
    subject: String(r.subject ?? ""),
    content_html: extractHtml(html),
    variables: toArrayOfStrings(r.variables),
    is_active: toBool(r.is_active),
    locale: (typeof r.locale === "string" ? r.locale : null) ?? null,
    created_at: typeof r.created_at === "string" ? r.created_at : undefined,
    updated_at: typeof r.updated_at === "string" ? r.updated_at : undefined,
  };
};

export const emailTemplatesApi = baseApi_m5.injectEndpoints({
  endpoints: (b) => ({
    listEmailTemplates: b.query<EmailTemplateView[], { locale?: string; is_active?: BoolLike } | void>({
      query: () => ({ url: "/email_templates" }),
      transformResponse: (res: unknown): EmailTemplateView[] =>
        Array.isArray(res) ? (res as unknown[]).map(toView) : [],
      providesTags: (result) =>
        result
          ? [
            ...result.map((t) => ({ type: "EmailTemplate" as const, id: t.id })),
            { type: "EmailTemplate" as const, id: "LIST" },
          ]
          : [{ type: "EmailTemplate" as const, id: "LIST" }],
    }),

    getEmailTemplateByKey: b.query<EmailTemplateView, { key: string; locale?: string }>({
      query: ({ key, locale }) => ({ url: `/email_templates/by-key/${key}`, params: { locale } }),
      transformResponse: (res: unknown): EmailTemplateView => toView(res),
      providesTags: (_r, _e, { key }) => [{ type: "EmailTemplate", id: `KEY_${key}` }],
    }),
  }),
  overrideExisting: true,
});

export const { useListEmailTemplatesQuery, useGetEmailTemplateByKeyQuery } = emailTemplatesApi;

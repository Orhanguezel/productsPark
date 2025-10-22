

// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/email_templates.endpoints.ts
// =============================================================
import { baseApi as baseApi_m5 } from "../baseApi";

type BoolLike5 = 0 | 1 | boolean;

export type EmailTemplate = {
  id: string;
  key: string; // e.g., order_confirmation
  subject: string;
  body_html: string;
  locale?: string | null;
  is_active?: BoolLike5;
  updated_at?: string;
};

export const emailTemplatesApi = baseApi_m5.injectEndpoints({
  endpoints: (b) => ({
    listEmailTemplates: b.query<EmailTemplate[], { locale?: string; is_active?: BoolLike5 }>({
      query: (params) => ({ url: "/email_templates", params }),
      transformResponse: (res: unknown): EmailTemplate[] => Array.isArray(res) ? (res as EmailTemplate[]) : [],
      providesTags: (result) => result
        ? [...result.map((t) => ({ type: "EmailTemplate" as const, id: t.id })), { type: "EmailTemplates" as const, id: "LIST" }]
        : [{ type: "EmailTemplates" as const, id: "LIST" }],
    }),

    getEmailTemplateByKey: b.query<EmailTemplate, { key: string; locale?: string }>({
      query: ({ key, locale }) => ({ url: `/email_templates/by-key/${key}`, params: { locale } }),
      transformResponse: (res: unknown): EmailTemplate => res as EmailTemplate,
      providesTags: (_r, _e, { key }) => [{ type: "EmailTemplate", id: `KEY_${key}` }],
    }),
  }),
  overrideExisting: true,
});

export const { useListEmailTemplatesQuery, useGetEmailTemplateByKeyQuery } = emailTemplatesApi;


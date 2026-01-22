// =============================================================
// FILE: src/integrations/rtk/admin/email_templates_admin.endpoints.ts
// FINAL — Admin EmailTemplates RTK (central types+normalizers)
// Backend (assumed):
// - GET    /admin/email_templates
// - GET    /admin/email_templates/:id
// - POST   /admin/email_templates
// - PATCH  /admin/email_templates/:id
// - DELETE /admin/email_templates/:id
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  EmailTemplateAdminView,
  EmailTemplateAdminCreateBody,
  EmailTemplateAdminPatchBody,
} from '@/integrations/types';
import { normalizeEmailTemplateAdmin, normalizeEmailTemplateAdminList } from '@/integrations/types';

const BASE = '/admin/email_templates';

export const emailTemplatesAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listEmailTemplatesAdmin: b.query<EmailTemplateAdminView[], void>({
      query: () => ({ url: BASE, method: 'GET' }),
      transformResponse: (res: unknown): EmailTemplateAdminView[] =>
        normalizeEmailTemplateAdminList(res),
      providesTags: (result) =>
        result
          ? [
              ...result.map((t) => ({ type: 'EmailTemplates' as const, id: t.id })),
              { type: 'EmailTemplates' as const, id: 'LIST' },
            ]
          : [{ type: 'EmailTemplates' as const, id: 'LIST' }],
    }),

    getEmailTemplateAdminById: b.query<EmailTemplateAdminView, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'GET' }),
      transformResponse: (res: unknown): EmailTemplateAdminView => normalizeEmailTemplateAdmin(res),
      providesTags: (_r, _e, id) => [{ type: 'EmailTemplates' as const, id }],
    }),

    createEmailTemplateAdmin: b.mutation<EmailTemplateAdminView, EmailTemplateAdminCreateBody>({
      query: (body) => ({ url: BASE, method: 'POST', body }),
      transformResponse: (res: unknown): EmailTemplateAdminView => normalizeEmailTemplateAdmin(res),
      invalidatesTags: [{ type: 'EmailTemplates' as const, id: 'LIST' }],
    }),

    updateEmailTemplateAdmin: b.mutation<
      EmailTemplateAdminView,
      { id: string; body: EmailTemplateAdminPatchBody }
    >({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: unknown): EmailTemplateAdminView => normalizeEmailTemplateAdmin(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'EmailTemplates' as const, id: arg.id },
        { type: 'EmailTemplates' as const, id: 'LIST' },
      ],
    }),

    deleteEmailTemplateAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'DELETE' }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: 'EmailTemplates' as const, id: 'LIST' }],
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

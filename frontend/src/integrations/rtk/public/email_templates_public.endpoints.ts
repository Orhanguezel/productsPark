// =============================================================
// FILE: src/integrations/rtk/public/email_templates_public.endpoints.ts
// FINAL — Public EmailTemplates RTK (single-language)
// Backend:
// - GET  /email_templates
// - GET  /email_templates/by-key/:key
// - POST /email_templates/by-key/:key/render
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  EmailTemplatesPublicListParams,
  EmailTemplatePublic,
  EmailTemplateRenderResp,
  RenderTemplateByKeyBody,
} from '@/integrations/types';
import {
  normalizeEmailTemplatePublic,
  normalizeEmailTemplatePublicList,
  normalizeEmailTemplateRenderResp,
  toEmailTemplatesPublicQuery,
} from '@/integrations/types';

const BASE = '/email_templates';

export const emailTemplatesPublicApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listEmailTemplatesPublic: b.query<EmailTemplatePublic[], EmailTemplatesPublicListParams | void>(
      {
        query: (params) => {
          const qs = toEmailTemplatesPublicQuery(params ?? undefined);
          return { url: `${BASE}${qs}`, method: 'GET' };
        },
        transformResponse: (res: unknown): EmailTemplatePublic[] =>
          normalizeEmailTemplatePublicList(res),
        providesTags: (result) =>
          result && result.length
            ? [
                ...result.map((t) => ({ type: 'EmailTemplate' as const, id: t.id })),
                { type: 'EmailTemplates' as const, id: 'LIST_PUBLIC' },
              ]
            : [{ type: 'EmailTemplates' as const, id: 'LIST_PUBLIC' }],
        keepUnusedDataFor: 60,
      },
    ),

    getEmailTemplateByKeyPublic: b.query<EmailTemplatePublic, { key: string }>({
      query: ({ key }) => ({
        url: `${BASE}/by-key/${encodeURIComponent(key)}`,
        method: 'GET',
      }),
      transformResponse: (res: unknown): EmailTemplatePublic => normalizeEmailTemplatePublic(res),
      providesTags: (_r, _e, arg) => [{ type: 'EmailTemplateKey' as const, id: arg.key }],
    }),

    renderTemplateByKeyPublic: b.mutation<
      EmailTemplateRenderResp,
      { key: string; body?: RenderTemplateByKeyBody }
    >({
      query: ({ key, body }) => ({
        url: `${BASE}/by-key/${encodeURIComponent(key)}/render`,
        method: 'POST',
        body: body ?? {},
      }),
      transformResponse: (res: unknown): EmailTemplateRenderResp =>
        normalizeEmailTemplateRenderResp(res),
    }),
  }),
  overrideExisting: true,
});

export const {
  useListEmailTemplatesPublicQuery,
  useGetEmailTemplateByKeyPublicQuery,
  useRenderTemplateByKeyPublicMutation,
} = emailTemplatesPublicApi;

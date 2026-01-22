// =============================================================
// FILE: src/integrations/rtk/public/support_tickets_public.endpoints.ts
// FINAL — Public Support Tickets RTK
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  SupportTicket,
  SupportListParams,
  SupportCreateBody,
  SupportUpdatePatch,
} from '@/integrations/types';
import {
  normalizeSupportTicket,
  normalizeSupportTicketList,
  toSupportListQuery,
  toSupportCreateBody,
  toSupportUpdateBody,
} from '@/integrations/types';

const BASE = '/support_tickets';

const extendedApi = baseApi.enhanceEndpoints({
  addTagTypes: ['SupportTicket', 'SupportTickets'] as const,
});

export const supportTicketsPublicApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    listSupportTickets: b.query<SupportTicket[], SupportListParams | void>({
      query: (params) => {
        const qp = params ? toSupportListQuery(params) : undefined;
        return { url: BASE, ...(qp ? { params: qp } : {}) };
      },
      transformResponse: (res: unknown): SupportTicket[] => normalizeSupportTicketList(res),
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((t) => ({ type: 'SupportTicket' as const, id: t.id })),
              { type: 'SupportTickets' as const, id: 'LIST' },
            ]
          : [{ type: 'SupportTickets' as const, id: 'LIST' }],
      keepUnusedDataFor: 60,
    }),

    getSupportTicketById: b.query<SupportTicket, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}` }),
      transformResponse: (res: unknown): SupportTicket => normalizeSupportTicket(res),
      providesTags: (_r, _e, id) => [{ type: 'SupportTicket' as const, id }],
      keepUnusedDataFor: 60,
    }),

    createSupportTicket: b.mutation<SupportTicket, SupportCreateBody>({
      query: (body) => ({
        url: BASE,
        method: 'POST',
        body: toSupportCreateBody(body),
      }),
      transformResponse: (res: unknown): SupportTicket => normalizeSupportTicket(res),
      invalidatesTags: [{ type: 'SupportTickets' as const, id: 'LIST' }],
    }),

    updateSupportTicket: b.mutation<SupportTicket, { id: string; patch: SupportUpdatePatch }>({
      query: ({ id, patch }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: toSupportUpdateBody(patch),
      }),
      transformResponse: (res: unknown): SupportTicket => normalizeSupportTicket(res),
      invalidatesTags: (_r, _e, arg) => [{ type: 'SupportTicket' as const, id: arg.id }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListSupportTicketsQuery,
  useGetSupportTicketByIdQuery,
  useCreateSupportTicketMutation,
  useUpdateSupportTicketMutation,
} = supportTicketsPublicApi;

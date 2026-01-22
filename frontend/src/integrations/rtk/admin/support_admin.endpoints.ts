// =============================================================
// FILE: src/integrations/rtk/admin/support_admin.endpoints.ts
// FINAL — Admin Support Tickets RTK
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type { SupportTicket, SupportListParams, SupportUpdatePatch } from '@/integrations/types';
import {
  normalizeSupportTicket,
  normalizeSupportTicketList,
  toSupportListQuery,
  toSupportUpdateBody,
} from '@/integrations/types';

const BASE = '/admin/support_tickets';

const extendedApi = baseApi.enhanceEndpoints({
  addTagTypes: ['SupportTicket', 'SupportTickets'] as const,
});

export const supportAdminApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    listSupportTicketsAdmin: b.query<SupportTicket[], SupportListParams | void>({
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

    getSupportTicketAdminById: b.query<SupportTicket, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}` }),
      transformResponse: (res: unknown): SupportTicket => normalizeSupportTicket(res),
      providesTags: (_r, _e, id) => [{ type: 'SupportTicket' as const, id }],
      keepUnusedDataFor: 60,
    }),

    updateSupportTicketAdmin: b.mutation<SupportTicket, { id: string; patch: SupportUpdatePatch }>({
      query: ({ id, patch }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: toSupportUpdateBody(patch),
      }),
      transformResponse: (res: unknown): SupportTicket => normalizeSupportTicket(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'SupportTicket' as const, id: arg.id },
        { type: 'SupportTickets' as const, id: 'LIST' },
      ],
    }),

    deleteSupportTicketAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'DELETE' }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: 'SupportTickets' as const, id: 'LIST' }],
    }),

    closeSupportTicketAdmin: b.mutation<SupportTicket, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}/close`, method: 'POST' }),
      transformResponse: (res: unknown): SupportTicket => normalizeSupportTicket(res),
      invalidatesTags: (_r, _e, id) => [
        { type: 'SupportTicket' as const, id },
        { type: 'SupportTickets' as const, id: 'LIST' },
      ],
    }),

    reopenSupportTicketAdmin: b.mutation<SupportTicket, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}/reopen`, method: 'POST' }),
      transformResponse: (res: unknown): SupportTicket => normalizeSupportTicket(res),
      invalidatesTags: (_r, _e, id) => [
        { type: 'SupportTicket' as const, id },
        { type: 'SupportTickets' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListSupportTicketsAdminQuery,
  useGetSupportTicketAdminByIdQuery,
  useUpdateSupportTicketAdminMutation,
  useDeleteSupportTicketAdminMutation,
  useCloseSupportTicketAdminMutation,
  useReopenSupportTicketAdminMutation,
} = supportAdminApi;
